import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import {
  getNowPaymentsService,
  isNowPaymentsEnabled,
} from '../services/nowpaymentsService';
import { 
  getPaymentRemainingTime, 
  isPaymentExpired,
  PAYMENT_TIMEOUT_MINUTES 
} from '../services/paymentTimeoutService';
import crypto from 'crypto';
import { isValidEmail } from '../lib/sanitize';
import { notifyNewOrder, notifyPaymentReceived, notifyPaymentConfirmed } from '../lib/telegramNotify';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// Get payment settings (public - for checkout page)
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const [enabledSetting, minAmountSetting, maxAmountSetting, currencySetting] =
      await Promise.all([
        prisma.setting.findUnique({ where: { key: 'NOWPAYMENTS_ENABLED' } }),
        prisma.setting.findUnique({ where: { key: 'PAYMENT_MIN_AMOUNT' } }),
        prisma.setting.findUnique({ where: { key: 'PAYMENT_MAX_AMOUNT' } }),
        prisma.setting.findUnique({ where: { key: 'PAYMENT_CURRENCY' } }),
      ]);

    res.json({
      nowpaymentsEnabled:
        enabledSetting?.value === true || enabledSetting?.value === 'true',
      minAmount: Number(minAmountSetting?.value) || 10,
      maxAmount: Number(maxAmountSetting?.value) || 10000,
      currency: (currencySetting?.value as string) || 'EUR',
    });
  } catch (error) {
    console.error('Get payment settings error:', error);
    res.status(500).json({ error: 'Failed to get payment settings' });
  }
});

// Get available currencies
router.get('/currencies', async (req: Request, res: Response) => {
  try {
    const service = await getNowPaymentsService();
    if (!service) {
      return res.status(503).json({ error: 'Payment service not available' });
    }

    const currencies = await service.getCurrencies();
    res.json(currencies);
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({ error: 'Failed to get currencies' });
  }
});

// Get minimum amount for a currency
router.get('/min-amount/:currency', async (req: Request, res: Response) => {
  try {
    const { currency } = req.params;
    const fiatQuery = req.query.fiat;
    const fiatCurrency = (typeof fiatQuery === 'string' ? fiatQuery : 'eur');

    const service = await getNowPaymentsService();
    if (!service) {
      return res.status(503).json({ error: 'Payment service not available' });
    }

    const minAmount = await service.getMinimumAmount(fiatCurrency, currency as string);
    res.json(minAmount);
  } catch (error) {
    console.error('Get min amount error:', error);
    res.status(500).json({ error: 'Failed to get minimum amount' });
  }
});

// Get estimate for payment
router.get('/estimate', async (req: Request, res: Response) => {
  try {
    const amount = Number(req.query.amount);
    const from = (req.query.from as string) || 'eur';
    const to = req.query.to as string;

    if (!amount || !to) {
      return res.status(400).json({ error: 'Amount and currency (to) are required' });
    }

    const service = await getNowPaymentsService();
    if (!service) {
      return res.status(503).json({ error: 'Payment service not available' });
    }

    const estimate = await service.getEstimatedPrice(amount, from, to);
    res.json(estimate);
  } catch (error) {
    console.error('Get estimate error:', error);
    res.status(500).json({ error: 'Failed to get estimate' });
  }
});

// Create payment / order
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      packageId,
      duration,
      customerEmail,
      customerName,
      adType,
      adTitle,
      adUrl,
      adImageUrl,
      adDescription,
      customerNotes,
      successUrl,
      cancelUrl,
    } = req.body;

    // Validate required fields
    if (!packageId || !duration || !customerEmail) {
      return res.status(400).json({
        error: 'Package ID, duration, and customer email are required',
      });
    }

    if (!isValidEmail(customerEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get package
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg || !pkg.isActive) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Find price for duration
    const prices = pkg.prices as Array<{
      duration: string;
      label: string;
      price: number;
      currency: string;
      discount?: number;
    }>;

    const priceOption = prices.find((p) => p.duration === duration);
    if (!priceOption) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    // Calculate final price
    const finalPrice = priceOption.discount
      ? priceOption.price * (1 - priceOption.discount / 100)
      : priceOption.price;

    // Get NowPayments service
    const service = await getNowPaymentsService();
    if (!service) {
      return res.status(503).json({ error: 'Payment service not available' });
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Get callback URL from settings
    const callbackUrlSetting = await prisma.setting.findUnique({
      where: { key: 'NOWPAYMENTS_CALLBACK_URL' },
    });
    const callbackUrl =
      (callbackUrlSetting?.value as string) ||
      `${process.env.API_URL || 'http://localhost:3001'}/api/payments/webhook/nowpayments`;

    // Create NowPayments invoice
    const invoice = await service.createInvoice({
      priceAmount: finalPrice,
      priceCurrency: priceOption.currency,
      orderId: orderNumber,
      orderDescription: `${pkg.name} - ${priceOption.label}`,
      callbackUrl,
      successUrl: successUrl || `${process.env.FRONTEND_URL}/payment/success?order=${orderNumber}`,
      cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel?order=${orderNumber}`,
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        nowpaymentId: invoice.id,
        invoiceUrl: invoice.invoice_url,
        priceAmount: finalPrice,
        priceCurrency: priceOption.currency,
        status: 'WAITING',
      },
    });

    // Create order record
    const order = await prisma.adOrder.create({
      data: {
        orderNumber,
        customerEmail,
        customerName,
        packageId,
        packageName: pkg.name,
        duration,
        durationLabel: priceOption.label,
        priceAmount: finalPrice,
        priceCurrency: priceOption.currency,
        adType: adType || 'BANNER',
        adTitle,
        adUrl,
        adImageUrl,
        adDescription,
        customerNotes,
        paymentId: payment.id,
        status: 'PENDING_PAYMENT',
      },
    });

    res.json({
      success: true,
      orderNumber,
      invoiceUrl: invoice.invoice_url,
      payment: {
        id: payment.id,
        status: payment.status,
      },
      order: {
        id: order.id,
        status: order.status,
      },
    });

    notifyNewOrder({
      orderId: orderNumber,
      adType: adType || 'BANNER',
      title: adTitle || adUrl || 'N/A',
      duration: priceOption.label,
      price: finalPrice,
      contact: customerEmail,
    }).catch(() => {});
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get order status (public - for checking payment status)
router.get('/order/:orderNumber', async (req: Request, res: Response) => {
  try {
    const orderNumber = req.params.orderNumber as string;

    const order = await prisma.adOrder.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        packageName: true,
        durationLabel: true,
        priceAmount: true,
        priceCurrency: true,
        createdAt: true,
        payment: {
          select: {
            status: true,
            invoiceUrl: true,
            payAddress: true,
            payCurrency: true,
            payAmount: true,
            createdAt: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderWithPayment = order as typeof order & { payment: { status: string; invoiceUrl: string | null; createdAt: Date; payAddress: string | null; payCurrency: string | null; payAmount: any } | null };
    
    // Calculate remaining time
    const remainingSeconds = orderWithPayment.payment 
      ? getPaymentRemainingTime(orderWithPayment.payment.createdAt)
      : 0;
    
    // Check if payment should be marked as expired
    const isExpired = orderWithPayment.payment && 
      orderWithPayment.payment.status === 'WAITING' && 
      remainingSeconds <= 0;

    res.json({
      orderNumber: order.orderNumber,
      status: isExpired ? 'EXPIRED' : order.status,
      packageName: order.packageName,
      durationLabel: order.durationLabel,
      priceAmount: order.priceAmount,
      priceCurrency: order.priceCurrency,
      payment: orderWithPayment.payment
        ? {
            status: isExpired ? 'EXPIRED' : orderWithPayment.payment.status,
            invoiceUrl: orderWithPayment.payment.invoiceUrl,
            payAddress: orderWithPayment.payment.payAddress,
            payCurrency: orderWithPayment.payment.payCurrency,
            payAmount: orderWithPayment.payment.payAmount,
            remainingSeconds,
            timeoutMinutes: PAYMENT_TIMEOUT_MINUTES,
            isExpired
          }
        : null,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════

// NowPayments IPN webhook
router.post('/webhook/nowpayments', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-nowpayments-sig'] as string;
    const payload = JSON.stringify(req.body);

    // Get service
    const service = await getNowPaymentsService();
    if (!service) {
      console.warn('NowPayments webhook received but service not configured');
      return res.status(200).json({ status: 'ignored' });
    }

    // Validate signature
    const sortedPayload = JSON.stringify(service.sortObject(req.body));
    if (!service.validateWebhook(sortedPayload, signature)) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const {
      payment_id,
      payment_status,
      order_id,
      pay_address,
      pay_currency,
      pay_amount,
      actually_paid,
      price_amount,
      price_currency,
    } = req.body;

    console.log(`NowPayments webhook: Order ${order_id}, Status: ${payment_status}`);

    // Find payment by NowPayments ID or order number
    let payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { nowpaymentId: String(payment_id) },
          { order: { orderNumber: order_id } },
        ],
      },
      include: { order: true },
    });

    if (!payment) {
      console.warn(`Payment not found for order ${order_id}`);
      return res.status(200).json({ status: 'payment_not_found' });
    }

    // Map status
    const mappedStatus = service.mapStatus(payment_status);

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        nowpaymentId: String(payment_id),
        payAddress: pay_address,
        payCurrency: pay_currency,
        payAmount: pay_amount,
        actuallyPaid: actually_paid,
        status: mappedStatus,
        rawWebhookData: req.body,
        paidAt: mappedStatus === 'FINISHED' ? new Date() : undefined,
      },
    });

    // Update order status if payment is completed
    if (payment.order && mappedStatus === 'FINISHED') {
      await prisma.adOrder.update({
        where: { id: payment.order.id },
        data: { status: 'PAYMENT_RECEIVED' },
      });

      notifyPaymentConfirmed({
        orderId: payment.order.orderNumber,
        amount: price_amount || payment.order.priceAmount,
        title: payment.order.adTitle || payment.order.adUrl || payment.order.packageName,
      }).catch(() => {});
    }

    // Notify on new payment (first webhook)
    if (mappedStatus === 'WAITING' || mappedStatus === 'CONFIRMING') {
      notifyPaymentReceived({
        orderId: order_id,
        amount: price_amount,
        currency: pay_currency || price_currency,
        status: payment_status,
      }).catch(() => {});
    }

    // Update order status if payment failed or expired
    if (
      payment.order &&
      (mappedStatus === 'FAILED' || mappedStatus === 'EXPIRED')
    ) {
      await prisma.adOrder.update({
        where: { id: payment.order.id },
        data: { status: 'EXPIRED' },
      });
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Map AdOrderRequest to AdOrder-like format
// ═══════════════════════════════════════════════════════════════════════════════

function mapAdOrderRequest(r: any) {
  // Map AdOrderRequest status to OrderStatus-compatible values
  const statusMap: Record<string, string> = {
    PENDING: 'PENDING_PAYMENT',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    ACTIVE: 'APPROVED',
    EXPIRED: 'EXPIRED',
  };
  // If payment is completed but order status is still PENDING, show PAYMENT_RECEIVED
  const mappedStatus =
    r.paymentStatus === 'COMPLETED' && r.status === 'PENDING'
      ? 'PAYMENT_RECEIVED'
      : statusMap[r.status] || r.status;

  return {
    id: r.id,
    _source: 'adPricing', // marker to distinguish in frontend
    orderNumber: `AOR-${r.id}`,
    customerEmail: r.contactInfo || '',
    customerName: null,
    packageId: 0,
    packageName: r.adPosition?.replace(/_/g, ' ') || r.adType,
    duration: r.duration,
    durationLabel: r.duration?.replace(/_/g, ' '),
    priceAmount: r.price,
    priceCurrency: 'USD',
    adType: r.adType,
    adTitle: r.adTitle,
    adUrl: r.adLink,
    adImageUrl: r.adBannerUrl,
    adDescription: null,
    status: mappedStatus,
    createdAdId: r.createdAdId,
    adminNotes: r.adminNotes,
    customerNotes: null,
    payment: r.nowpaymentId
      ? {
          id: 0,
          nowpaymentId: r.nowpaymentId,
          invoiceUrl: null,
          payAddress: r.payAddress,
          payCurrency: r.payCurrency,
          payAmount: r.payAmount,
          actuallyPaid: r.actuallyPaid,
          priceAmount: r.price,
          priceCurrency: 'USD',
          status: r.paymentStatus,
          paidAt: r.paidAt,
          createdAt: r.createdAt,
        }
      : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// Get all orders (admin) - merges AdOrder and AdOrderRequest
router.get(
  '/admin/orders',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, page = '1', limit = '20' } = req.query;

      const where: Record<string, unknown> = {};
      if (status) {
        where.status = status;
      }

      // Fetch from both tables
      const [adOrders, adOrderRequests] = await Promise.all([
        prisma.adOrder.findMany({
          where,
          include: { payment: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.adOrderRequest.findMany({
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Map AdOrderRequest records and merge
      const mappedRequests = adOrderRequests.map(mapAdOrderRequest);

      // Filter mapped requests by status if needed
      let filteredRequests = mappedRequests;
      if (status) {
        filteredRequests = mappedRequests.filter((r: any) => r.status === status);
      }

      // Merge and sort by createdAt descending
      const allOrders = [...adOrders, ...filteredRequests].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Paginate
      const total = allOrders.length;
      const skip = (Number(page) - 1) * Number(limit);
      const paginatedOrders = allOrders.slice(skip, skip + Number(limit));

      res.json({
        orders: paginatedOrders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  }
);

// Get single order (admin)
router.get(
  '/admin/orders/:id',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const source = req.query.source as string;

      if (source === 'adPricing') {
        const order = await prisma.adOrderRequest.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        return res.json(mapAdOrderRequest(order));
      }

      const order = await prisma.adOrder.findUnique({
        where: { id },
        include: { payment: true },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({ error: 'Failed to get order' });
    }
  }
);

// Approve order and create ad (admin)
router.post(
  '/admin/orders/:id/approve',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { adData, adminNotes, source } = req.body;

      // Handle AdOrderRequest source
      if (source === 'adPricing') {
        const order = await prisma.adOrderRequest.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.createdAdId) return res.status(400).json({ error: 'Ad already created' });

        const durationMap: Record<string, number> = {
          WEEK: 7, MONTH: 30, '2_MONTHS': 60, '3_MONTHS': 90, '6_MONTHS': 180, YEAR: 365,
        };
        const durationDays = durationMap[order.duration] || 30;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        const ad = await prisma.ad.create({
          data: {
            name: order.adTitle,
            type: order.adType,
            position: (order.adPosition as any) || adData?.position || 'HEADER_TOP',
            linkUrl: order.adLink || '',
            textTitle: order.adTitle,
            imageUrl: order.adBannerUrl,
            bannerSize: order.bannerSize,
            startDate,
            endDate,
            durationType: order.duration,
            isActive: true,
          },
        });

        await prisma.adOrderRequest.update({
          where: { id },
          data: { status: 'APPROVED', createdAdId: ad.id, adminNotes },
        });

        return res.json({ success: true, order: { id, status: 'APPROVED' }, ad });
      }

      const order = await prisma.adOrder.findUnique({
        where: { id },
        include: { payment: true },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'PAYMENT_RECEIVED') {
        return res.status(400).json({
          error: 'Order must be in PAYMENT_RECEIVED status to approve',
        });
      }

      // Calculate end date based on duration
      const durationMap: Record<string, number> = {
        '1_WEEK': 7,
        '2_WEEKS': 14,
        '1_MONTH': 30,
        '2_MONTHS': 60,
        '3_MONTHS': 90,
        '6_MONTHS': 180,
        '1_YEAR': 365,
      };

      const durationDays = durationMap[order.duration] || 30;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // Create the ad
      const ad = await prisma.ad.create({
        data: {
          type: order.adType,
          position: adData?.position || 'HEADER_TOP',
          linkUrl: order.adUrl || '',
          textTitle: order.adTitle,
          textContent: order.adDescription,
          imageUrl: order.adImageUrl,
          startDate,
          endDate,
          durationType: order.duration,
          isActive: true,
          ...adData,
        },
      });

      // Update order
      await prisma.adOrder.update({
        where: { id },
        data: {
          status: 'APPROVED',
          createdAdId: ad.id,
          adminNotes,
        },
      });

      res.json({
        success: true,
        order: { id, status: 'APPROVED' },
        ad,
      });
    } catch (error) {
      console.error('Approve order error:', error);
      res.status(500).json({ error: 'Failed to approve order' });
    }
  }
);

// Reject order (admin)
router.post(
  '/admin/orders/:id/reject',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { adminNotes, reason, source } = req.body;

      // Handle AdOrderRequest source
      if (source === 'adPricing') {
        const order = await prisma.adOrderRequest.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        await prisma.adOrderRequest.update({
          where: { id },
          data: { status: 'REJECTED', adminNotes: adminNotes || reason },
        });
        return res.json({ success: true, order: { id, status: 'REJECTED' } });
      }

      const order = await prisma.adOrder.findUnique({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      await prisma.adOrder.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNotes: adminNotes || reason,
        },
      });

      res.json({
        success: true,
        order: { id, status: 'REJECTED' },
      });
    } catch (error) {
      console.error('Reject order error:', error);
      res.status(500).json({ error: 'Failed to reject order' });
    }
  }
);

// Get payment statistics (admin)
router.get(
  '/admin/stats',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const [
        adOrderTotal,
        adOrderPending,
        adOrderCompleted,
        adOrderRevenue,
        reqTotal,
        reqPending,
        reqCompleted,
        reqRevenue,
      ] = await Promise.all([
        prisma.adOrder.count(),
        prisma.adOrder.count({
          where: { status: { in: ['PENDING_PAYMENT', 'PAYMENT_RECEIVED'] } },
        }),
        prisma.adOrder.count({ where: { status: 'APPROVED' } }),
        prisma.adOrder.aggregate({
          where: { status: 'APPROVED' },
          _sum: { priceAmount: true },
        }),
        prisma.adOrderRequest.count(),
        prisma.adOrderRequest.count({
          where: { status: 'PENDING' },
        }),
        prisma.adOrderRequest.count({
          where: { status: { in: ['APPROVED', 'ACTIVE'] } },
        }),
        prisma.adOrderRequest.aggregate({
          where: { status: { in: ['APPROVED', 'ACTIVE'] } },
          _sum: { price: true },
        }),
      ]);

      res.json({
        totalOrders: adOrderTotal + reqTotal,
        pendingOrders: adOrderPending + reqPending,
        completedOrders: adOrderCompleted + reqCompleted,
        totalRevenue:
          Number(adOrderRevenue._sum.priceAmount || 0) +
          Number(reqRevenue._sum.price || 0),
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }
);

// Update payment settings (admin)
router.put(
  '/admin/settings',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        nowpaymentsEnabled,
        nowpaymentsApiKey,
        nowpaymentsIpnSecret,
        nowpaymentsSandbox,
        nowpaymentsCallbackUrl,
        minAmount,
        maxAmount,
        currency,
      } = req.body;

      const updates = [
        { key: 'NOWPAYMENTS_ENABLED', value: nowpaymentsEnabled, category: 'payment' },
        { key: 'NOWPAYMENTS_API_KEY', value: nowpaymentsApiKey, category: 'payment' },
        { key: 'NOWPAYMENTS_IPN_SECRET', value: nowpaymentsIpnSecret, category: 'payment' },
        { key: 'NOWPAYMENTS_SANDBOX', value: nowpaymentsSandbox, category: 'payment' },
        { key: 'NOWPAYMENTS_CALLBACK_URL', value: nowpaymentsCallbackUrl, category: 'payment' },
        { key: 'PAYMENT_MIN_AMOUNT', value: minAmount, category: 'payment' },
        { key: 'PAYMENT_MAX_AMOUNT', value: maxAmount, category: 'payment' },
        { key: 'PAYMENT_CURRENCY', value: currency, category: 'payment' },
      ];

      for (const update of updates) {
        if (update.value !== undefined) {
          await prisma.setting.upsert({
            where: { key: update.key },
            create: {
              key: update.key,
              value: update.value,
              category: update.category,
            },
            update: { value: update.value },
          });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Update payment settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

// Get payment settings (admin - includes secrets)
router.get(
  '/admin/settings',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const settings = await prisma.setting.findMany({
        where: { category: 'payment' },
      });

      const settingsMap: Record<string, unknown> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      res.json({
        nowpaymentsEnabled: settingsMap['NOWPAYMENTS_ENABLED'] || false,
        nowpaymentsApiKey: settingsMap['NOWPAYMENTS_API_KEY'] || '',
        nowpaymentsIpnSecret: settingsMap['NOWPAYMENTS_IPN_SECRET'] || '',
        nowpaymentsSandbox: settingsMap['NOWPAYMENTS_SANDBOX'] || false,
        nowpaymentsCallbackUrl: settingsMap['NOWPAYMENTS_CALLBACK_URL'] || '',
        minAmount: settingsMap['PAYMENT_MIN_AMOUNT'] || 10,
        maxAmount: settingsMap['PAYMENT_MAX_AMOUNT'] || 10000,
        currency: settingsMap['PAYMENT_CURRENCY'] || 'EUR',
      });
    } catch (error) {
      console.error('Get payment settings error:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  }
);

// Test NowPayments connection (admin)
router.get(
  '/admin/test-connection',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const service = await getNowPaymentsService();
      if (!service) {
        return res.json({
          success: false,
          error: 'NowPayments not configured or disabled',
        });
      }

      const status = await service.getStatus();
      res.json({
        success: true,
        message: status.message,
      });
    } catch (error) {
      console.error('Test connection error:', error);
      res.json({
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  }
);

export default router;
