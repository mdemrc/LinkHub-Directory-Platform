import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { NowPaymentsService, SUPPORTED_CRYPTOS } from '../lib/nowpaymentsService';
import { TelegramService } from '../lib/telegramService';
import { isValidUrl, isValidEmail } from '../lib/sanitize';
import { verifyCaptcha } from '../lib/captcha';
import { notifyPaymentReceived, notifyPaymentConfirmed, notifyNewOrder } from '../lib/telegramNotify';

const router = Router();

// Default telegram message templates
const DEFAULT_TELEGRAM_TEMPLATES = {
  paymentReceived: '💰 *New Payment Received*\n\nOrder: #{orderId}\nAmount: ${amount}\nCurrency: {currency}\nStatus: {status}',
  paymentConfirmed: '✅ *Payment Confirmed*\n\nOrder: #{orderId}\nAmount: ${amount}\nTitle: {title}',
  newOrder: '📦 *New Ad Order*\n\nOrder: #{orderId}\nType: {type}\nTitle: {title}\nDuration: {duration}\nPrice: ${price}\nContact: {contact}',
};

// Helper function to send telegram notification (uses centralized module)
async function sendTelegramNotification(type: 'payment' | 'order', data: any) {
  try {
    if (type === 'order') {
      await notifyNewOrder({
        orderId: String(data.orderId),
        adType: data.type || 'BANNER',
        title: data.title || 'N/A',
        duration: data.duration || 'N/A',
        price: data.price || 0,
        contact: data.contact || 'N/A',
      });
    } else if (type === 'payment') {
      if (data.confirmed) {
        await notifyPaymentConfirmed({
          orderId: String(data.orderId),
          amount: data.amount || 0,
          title: data.title || 'N/A',
        });
      } else {
        await notifyPaymentReceived({
          orderId: String(data.orderId),
          amount: data.amount || 0,
          currency: data.currency || 'CRYPTO',
          status: data.status || 'Confirming',
        });
      }
    }
  } catch (error) {
    console.error('Failed to send telegram notification:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AD PRICING ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Get all pricing (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const pricing = await prisma.adPricing.findMany({
      where: { isActive: true },
      orderBy: [
        { type: 'asc' },
        { order: 'asc' }
      ]
    });
    res.json(pricing);
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ error: 'Failed to get pricing' });
  }
});

// Get all pricing including inactive (admin)
router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const pricing = await prisma.adPricing.findMany({
      orderBy: [
        { type: 'asc' },
        { order: 'asc' }
      ]
    });
    res.json(pricing);
  } catch (error) {
    console.error('Get all pricing error:', error);
    res.status(500).json({ error: 'Failed to get pricing' });
  }
});

// Create pricing slot (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { type, position, bannerSize, displayName, description, previewLabel, features, priceWeek, priceMonth, price2Months, price3Months, price6Months, priceYear, isActive, badgeType, badgeText, badgeIcon, badgeColor, glowEnabled, glowColor } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }

    const pricing = await prisma.adPricing.create({
      data: {
        type,
        position: position || null,
        bannerSize: bannerSize || null,
        displayName: displayName || null,
        description: description || null,
        previewLabel: previewLabel || null,
        features: features || null,
        priceWeek: parseFloat(priceWeek) || 0,
        priceMonth: parseFloat(priceMonth) || 0,
        price2Months: parseFloat(price2Months) || 0,
        price3Months: parseFloat(price3Months) || 0,
        price6Months: parseFloat(price6Months) || 0,
        priceYear: parseFloat(priceYear) || 0,
        isActive: isActive !== false,
        badgeType: badgeType || null,
        badgeText: badgeText || null,
        badgeIcon: badgeIcon || null,
        badgeColor: badgeColor || null,
        glowEnabled: glowEnabled === true,
        glowColor: glowColor || null,
      }
    });

    res.status(201).json(pricing);
  } catch (error: any) {
    console.error('Create pricing error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This slot already exists for this type' });
    }
    res.status(500).json({ error: 'Failed to create pricing' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AD SETTINGS ROUTES (must be defined before /:id wildcard routes)
// ═══════════════════════════════════════════════════════════════════════════════

// Get ad settings (public)
router.get('/settings', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.adSettings.findFirst();
    
    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.adSettings.create({
        data: {
          pageTitle: 'Advertising',
          pageSubtitle: 'Daily real and stable attendance of the resource is ≈ 4,420 people and 11,300 views.',
          maxBannerSlots: 6,
          maxTextSlots: 5,
          bannerSize: '468x64',
          bannerPosition: 'Header',
          howToOrderSteps: [
            'Select Ad type',
            'Select period of advert',
            'Enter your Ad text and link or upload banner',
            'Pay by crypto currency',
            'Wait a confirmation',
            'During 3 hours your Ad will be posted'
          ],
          paymentMethods: ['BTC', 'ETH', 'LTC', 'USDT'],
          nowpaymentsEnabled: false,
          enabledCryptos: { btc: true, eth: true, ltc: true, xmr: true }
        }
      });
    }
    
    // Don't expose API keys to public
    const publicSettings = {
      ...settings,
      nowpaymentsApiKey: undefined,
      nowpaymentsIpnSecret: undefined
    };
    
    res.json(publicSettings);
  } catch (error) {
    console.error('Get ad settings error:', error);
    res.status(500).json({ error: 'Failed to get ad settings' });
  }
});

// Get full settings including API keys (admin only)
router.get('/settings/full', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.adSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.adSettings.create({
        data: {
          pageTitle: 'Advertising',
          pageSubtitle: 'Daily real and stable attendance of the resource is ≈ 4,420 people and 11,300 views.',
          maxBannerSlots: 6,
          maxTextSlots: 5,
          bannerSize: '468x64',
          bannerPosition: 'Header',
          howToOrderSteps: [],
          paymentMethods: ['BTC'],
          nowpaymentsEnabled: false,
          enabledCryptos: { btc: true, eth: true, ltc: true, xmr: true }
        }
      });
    }
    
    // Mask API key for security (show only last 4 chars)
    const maskedSettings = {
      ...settings,
      nowpaymentsApiKey: settings.nowpaymentsApiKey 
        ? `****${settings.nowpaymentsApiKey.slice(-4)}` 
        : null,
      nowpaymentsIpnSecret: settings.nowpaymentsIpnSecret
        ? `****${settings.nowpaymentsIpnSecret.slice(-4)}`
        : null,
      hasApiKey: !!settings.nowpaymentsApiKey,
      hasIpnSecret: !!settings.nowpaymentsIpnSecret
    };
    
    res.json(maskedSettings);
  } catch (error) {
    console.error('Get full settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update ad settings (admin)
router.patch('/settings', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    
    // Get or create settings
    let settings = await prisma.adSettings.findFirst();
    
    if (settings) {
      settings = await prisma.adSettings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.adSettings.create({
        data: {
          ...data,
          howToOrderSteps: data.howToOrderSteps || [],
          paymentMethods: data.paymentMethods || ['BTC']
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Update ad settings error:', error);
    res.status(500).json({ error: 'Failed to update ad settings' });
  }
});

// Update NowPayments settings (admin)
router.patch('/settings/nowpayments', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey, ipnSecret, enabled, enabledCryptos } = req.body;
    
    let settings = await prisma.adSettings.findFirst();
    
    const updateData: any = {};
    
    // Only update API key if provided and not masked
    if (apiKey && !apiKey.startsWith('****')) {
      updateData.nowpaymentsApiKey = apiKey;
    }
    
    // Only update IPN secret if provided and not masked
    if (ipnSecret && !ipnSecret.startsWith('****')) {
      updateData.nowpaymentsIpnSecret = ipnSecret;
    }
    
    if (typeof enabled === 'boolean') {
      updateData.nowpaymentsEnabled = enabled;
    }
    
    if (enabledCryptos) {
      updateData.enabledCryptos = enabledCryptos;
    }
    
    if (settings) {
      settings = await prisma.adSettings.update({
        where: { id: settings.id },
        data: updateData
      });
    } else {
      settings = await prisma.adSettings.create({
        data: {
          pageTitle: 'Advertising',
          pageSubtitle: '',
          maxBannerSlots: 6,
          maxTextSlots: 5,
          bannerSize: '468x64',
          bannerPosition: 'Header',
          howToOrderSteps: [],
          paymentMethods: ['BTC'],
          ...updateData
        }
      });
    }
    
    res.json({ 
      success: true,
      nowpaymentsEnabled: settings.nowpaymentsEnabled,
      hasApiKey: !!settings.nowpaymentsApiKey,
      hasIpnSecret: !!settings.nowpaymentsIpnSecret,
      enabledCryptos: settings.enabledCryptos
    });
  } catch (error) {
    console.error('Update NowPayments settings error:', error);
    res.status(500).json({ error: 'Failed to update NowPayments settings' });
  }
});

// Test NowPayments connection (admin)
router.post('/settings/nowpayments/test', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.adSettings.findFirst();
    
    if (!settings || !settings.nowpaymentsApiKey) {
      return res.status(400).json({ error: 'API key not configured' });
    }
    
    const service = new NowPaymentsService(settings.nowpaymentsApiKey, settings.nowpaymentsIpnSecret || '');
    
    // Try to get minimum amount as a connection test
    const minAmount = await service.getMinimumAmount('btc');
    
    res.json({ 
      success: true, 
      message: 'Connection successful',
      testResult: { btcMinAmount: minAmount }
    });
  } catch (error: any) {
    console.error('NowPayments test error:', error);
    res.status(400).json({ 
      error: 'Connection failed', 
      message: error.message 
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING CRUD (/:id wildcard routes — must be after /settings routes)
// ═══════════════════════════════════════════════════════════════════════════════

// Update pricing slot (admin)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const data = req.body;

    // Convert numeric strings to numbers
    if (data.priceWeek !== undefined) data.priceWeek = parseFloat(data.priceWeek);
    if (data.priceMonth !== undefined) data.priceMonth = parseFloat(data.priceMonth);
    if (data.price2Months !== undefined) data.price2Months = parseFloat(data.price2Months);
    if (data.price3Months !== undefined) data.price3Months = parseFloat(data.price3Months);
    if (data.price6Months !== undefined) data.price6Months = parseFloat(data.price6Months);
    if (data.priceYear !== undefined) data.priceYear = parseFloat(data.priceYear);

    // Ensure boolean for glowEnabled
    if (data.glowEnabled !== undefined) data.glowEnabled = data.glowEnabled === true;

    const pricing = await prisma.adPricing.update({
      where: { id },
      data
    });

    res.json(pricing);
  } catch (error: any) {
    console.error('Update pricing error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Pricing not found' });
    }
    res.status(500).json({ error: 'Failed to update pricing' });
  }
});

// Delete pricing slot (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    await prisma.adPricing.delete({
      where: { id }
    });

    res.json({ message: 'Pricing deleted successfully' });
  } catch (error: any) {
    console.error('Delete pricing error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Pricing not found' });
    }
    res.status(500).json({ error: 'Failed to delete pricing' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AD ORDER REQUEST ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Get all orders (admin)
router.get('/orders', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    
    const where: any = {};
    if (status) {
      where.status = status;
    }
    
    const orders = await prisma.adOrderRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Create order (public - for customers)
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const {
      adType,
      adPosition,
      adTitle,
      adLink,
      adBannerUrl,
      bannerSize,
      duration,
      price,
      contactInfo,
      paymentMethod
    } = req.body;

    if (!adType || !adTitle || !adLink || !duration || !price || !contactInfo || !paymentMethod) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const captchaResult = await verifyCaptcha(req.body.captchaToken, req.ip);
    if (!captchaResult.success) {
      return res.status(400).json({ error: captchaResult.error || 'CAPTCHA verification failed' });
    }

    if (adLink && !isValidUrl(adLink)) {
      return res.status(400).json({ error: 'Invalid ad link URL format' });
    }

    const order = await prisma.adOrderRequest.create({
      data: {
        adType,
        adPosition: adPosition || null,
        adTitle,
        adLink,
        adBannerUrl: adBannerUrl || null,
        bannerSize: bannerSize || null,
        duration,
        price: parseFloat(price),
        contactInfo,
        paymentMethod,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });

    // Send Telegram notification for new order
    await sendTelegramNotification('order', {
      orderId: order.id,
      type: order.adType,
      title: order.adTitle,
      duration: order.duration,
      price: order.price,
      contact: order.contactInfo
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (admin)
router.patch('/orders/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const data = req.body;

    const order = await prisma.adOrderRequest.update({
      where: { id },
      data
    });

    res.json(order);
  } catch (error: any) {
    console.error('Update order error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order (admin)
router.delete('/orders/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    await prisma.adOrderRequest.delete({
      where: { id }
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Delete order error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CRYPTO & PAYMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Get enabled cryptocurrencies (public)
router.get('/cryptos', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.adSettings.findFirst();
    
    if (!settings || !settings.nowpaymentsEnabled) {
      return res.json({ cryptos: [], enabled: false });
    }
    
    const enabledCryptos = settings.enabledCryptos as Record<string, boolean> || {};
    
    // Filter supported cryptos by enabled status
    const cryptos = SUPPORTED_CRYPTOS.filter(c => enabledCryptos[c.code] === true);
    
    res.json({ 
      cryptos, 
      enabled: settings.nowpaymentsEnabled,
      allCryptos: SUPPORTED_CRYPTOS // For admin panel
    });
  } catch (error) {
    console.error('Get cryptos error:', error);
    res.status(500).json({ error: 'Failed to get cryptocurrencies' });
  }
});

// Get minimum amounts for enabled cryptos (public)
router.get('/cryptos/min-amounts', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.adSettings.findFirst();
    
    if (!settings || !settings.nowpaymentsApiKey) {
      return res.json({ minAmounts: {} });
    }
    
    // Get all crypto codes to fetch min amounts for all (for admin panel)
    const allCodes = SUPPORTED_CRYPTOS.map(c => c.code);
    
    const service = new NowPaymentsService(settings.nowpaymentsApiKey, settings.nowpaymentsIpnSecret || '');
    const minAmounts = await service.getMinimumAmounts(allCodes);
    
    res.json({ minAmounts });
  } catch (error) {
    console.error('Get min amounts error:', error);
    res.status(500).json({ error: 'Failed to get minimum amounts' });
  }
});

// Create payment with NowPayments (public)
router.post('/orders/:id/pay', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { currency } = req.body;
    
    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }
    
    // Get order
    const order = await prisma.adOrderRequest.findUnique({
      where: { id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.paymentStatus === 'COMPLETED') {
      return res.status(400).json({ error: 'Order is already paid' });
    }
    
    // Get settings
    const settings = await prisma.adSettings.findFirst();
    
    if (!settings || !settings.nowpaymentsEnabled || !settings.nowpaymentsApiKey) {
      return res.status(503).json({ error: 'Payment system is not configured' });
    }
    
    // Check if crypto is enabled
    const enabledCryptos = settings.enabledCryptos as Record<string, boolean> || {};
    if (!enabledCryptos[currency.toLowerCase()]) {
      return res.status(400).json({ error: 'This cryptocurrency is not enabled' });
    }
    
    // Create NowPayments payment
    const service = new NowPaymentsService(settings.nowpaymentsApiKey, settings.nowpaymentsIpnSecret || '');

    // Pre-validate: check minimum amount for selected currency (add 5% buffer for rate fluctuations)
    const minFiatEquivalent = await service.getMinimumAmount(currency);
    const minWithBuffer = minFiatEquivalent * 1.05;
    if (order.price < minWithBuffer) {
      return res.status(400).json({
        error: `The order amount ($${order.price.toFixed(2)}) is below the minimum required for ${currency.toUpperCase()} payments ($${minFiatEquivalent.toFixed(2)}). Please choose a different cryptocurrency or increase your order amount.`,
        minRequired: minFiatEquivalent,
        currency: currency.toUpperCase(),
      });
    }
    
    const baseUrl = process.env.APP_URL || process.env.FRONTEND_URL;
    const callbackUrl = baseUrl 
      ? `${baseUrl.replace(/\/$/, '')}/api/ad-pricing/webhook/nowpayments`
      : undefined;
    
    if (callbackUrl) {
      console.log('NowPayments callback URL:', callbackUrl);
    } else {
      console.warn('No APP_URL or FRONTEND_URL set — NowPayments webhook will not be registered. Falling back to polling.');
    }
    
    const payment = await service.createPayment(
      order.price,
      currency,
      `ad_order_${order.id}`,
      `Ad Order: ${order.adTitle}`,
      callbackUrl
    );
    
    // Update order with payment info
    const updatedOrder = await prisma.adOrderRequest.update({
      where: { id },
      data: {
        nowpaymentId: String(payment.payment_id),
        payAddress: payment.pay_address,
        payCurrency: payment.pay_currency.toUpperCase(),
        payAmount: payment.pay_amount,
        paymentStatus: 'PENDING'
      }
    });
    
    res.json({
      order: {
        ...updatedOrder,
        createdAt: updatedOrder.createdAt
      },
      payment: {
        paymentId: payment.payment_id,
        address: payment.pay_address,
        amount: payment.pay_amount,
        currency: payment.pay_currency.toUpperCase(),
        usdAmount: order.price,
        remainingSeconds: 60 * 60 // 1 hour in seconds
      }
    });
  } catch (error: any) {
    // Return 400 (not 500) for minimum amount errors so frontend can handle gracefully
    if (
      error?.isMinimumError ||
      (error?.message && (
        error.message.toLowerCase().includes('less than minimal') ||
        error.message.toLowerCase().includes('minimum') ||
        error.message === 'MINIMUM_AMOUNT_ERROR'
      ))
    ) {
      return res.status(400).json({
        error: `The selected cryptocurrency requires a higher minimum payment amount. Please choose a different coin or a longer ad duration.`,
        isMinimumError: true,
      });
    }
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment. Please try again.' });
  }
});

// Get payment status (public)
router.get('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    const order = await prisma.adOrderRequest.findUnique({
      where: { id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // If we have a NowPayments ID, check status
    if (order.nowpaymentId) {
      const settings = await prisma.adSettings.findFirst();
      
      if (settings?.nowpaymentsApiKey) {
        const service = new NowPaymentsService(settings.nowpaymentsApiKey, settings.nowpaymentsIpnSecret || '');
        
        try {
          const status = await service.getPaymentStatus(order.nowpaymentId);
          const mappedStatus = service.mapStatus(status.payment_status);
          
          // Update if status changed
          if (mappedStatus !== order.paymentStatus) {
            const isNewlyCompleted = mappedStatus === 'COMPLETED' && order.paymentStatus !== 'COMPLETED';
            
            const updateData: any = {
              paymentStatus: mappedStatus,
              actuallyPaid: status.actually_paid,
            };
            
            if (isNewlyCompleted) {
              updateData.paidAt = new Date();
              // Only auto-approve if autoPlace is enabled
              if (settings.autoPlaceEnabled) {
                updateData.status = 'APPROVED';
              }
            }
            
            await prisma.adOrderRequest.update({
              where: { id },
              data: updateData
            });
            
            order.paymentStatus = mappedStatus;
            order.actuallyPaid = status.actually_paid;
            
            // Auto-create ad when payment completes (only if autoPlace enabled)
            if (isNewlyCompleted && !order.createdAdId && settings.autoPlaceEnabled) {
              await createAdFromOrder(order);
            }

            // Send telegram notification for payment completion via polling
            if (isNewlyCompleted) {
              await sendTelegramNotification('payment', {
                confirmed: true,
                orderId: order.id,
                amount: order.price,
                title: order.adTitle
              });
            }
          }
        } catch (error) {
          console.error('Failed to check payment status:', error);
        }
      }
    }
    
    res.json({
      id: order.id,
      paymentStatus: order.paymentStatus,
      payAddress: order.payAddress,
      payAmount: order.payAmount,
      payCurrency: order.payCurrency,
      actuallyPaid: order.actuallyPaid,
      price: order.price
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// Helper: Calculate duration end date from duration string
function calculateEndDate(duration: string): Date {
  const now = new Date();
  switch (duration) {
    case 'WEEK': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'MONTH': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '2_MONTHS': return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    case '3_MONTHS': return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case '6_MONTHS': return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    case 'YEAR': return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

// Helper: Auto-create Ad from a completed order
async function createAdFromOrder(order: any): Promise<number | null> {
  try {
    const endDate = calculateEndDate(order.duration);
    const position = order.adPosition || (order.adType === 'BANNER' ? 'HEADER_TOP' : 'CONTENT_TOP');

    // Map bannerSize to pixel dimensions
    const sizeMap: Record<string, { width: number; height: number }> = {
      xs: { width: 468, height: 60 },
      sm: { width: 728, height: 90 },
      cc: { width: 920, height: 111 },
    };
    const dimensions = order.bannerSize ? sizeMap[order.bannerSize] : null;

    const ad = await prisma.ad.create({
      data: {
        name: order.adTitle,
        type: order.adType,
        position,
        imageUrl: order.adBannerUrl || null,
        linkUrl: order.adLink,
        textContent: order.adType === 'TEXT' ? order.adTitle : null,
        bannerSize: order.bannerSize || null,
        width: dimensions?.width || null,
        height: dimensions?.height || null,
        startDate: new Date(),
        endDate,
        durationType: order.duration,
        isActive: true,
        order: 0,
      }
    });

    // Update order with created ad reference
    await prisma.adOrderRequest.update({
      where: { id: order.id },
      data: {
        createdAdId: ad.id,
        status: 'ACTIVE',
        expiresAt: endDate,
      }
    });

    console.log(`Auto-created Ad #${ad.id} from Order #${order.id}`);
    return ad.id;
  } catch (error) {
    console.error('Failed to auto-create ad from order:', error);
    return null;
  }
}

// NowPayments Webhook (IPN Callback)
router.post('/webhook/nowpayments', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-nowpayments-sig'] as string;
    const body = req.body;
    
    console.log('NowPayments webhook received:', body);
    
    // Get settings for IPN secret
    const settings = await prisma.adSettings.findFirst();
    
    if (!settings || !settings.nowpaymentsApiKey) {
      return res.status(503).json({ error: 'Payment system not configured' });
    }
    
    // Validate signature if IPN secret is configured
    if (settings.nowpaymentsIpnSecret && signature) {
      const service = new NowPaymentsService(settings.nowpaymentsApiKey, settings.nowpaymentsIpnSecret);
      
      if (!service.validateWebhook(body, signature)) {
        console.error('Invalid NowPayments webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Extract payment info
    const {
      payment_id,
      payment_status,
      pay_amount,
      actually_paid
    } = body;
    
    const paymentIdStr = String(payment_id);
    
    // Find order by NowPayments ID
    const order = await prisma.adOrderRequest.findFirst({
      where: { nowpaymentId: paymentIdStr }
    });
    
    if (!order) {
      console.error(`Order not found for payment ID: ${paymentIdStr}`);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Map status
    const service = new NowPaymentsService(settings.nowpaymentsApiKey, settings.nowpaymentsIpnSecret || '');
    const mappedStatus = service.mapStatus(payment_status);
    
    // Update order
    const updateData: any = {
      paymentStatus: mappedStatus,
      actuallyPaid: actually_paid || pay_amount
    };
    
    const isNewlyCompleted = mappedStatus === 'COMPLETED' && order.paymentStatus !== 'COMPLETED';
    
    if (isNewlyCompleted) {
      updateData.paidAt = new Date();
      // Only auto-approve if autoPlace is enabled
      if (settings.autoPlaceEnabled) {
        updateData.status = 'APPROVED';
      }
    }
    
    await prisma.adOrderRequest.update({
      where: { id: order.id },
      data: updateData
    });
    
    console.log(`Order ${order.id} updated: payment ${mappedStatus}`);
    
    // Auto-create ad when payment is completed (only if autoPlace enabled)
    if (isNewlyCompleted && settings.autoPlaceEnabled) {
      await createAdFromOrder(order);
      
      await sendTelegramNotification('payment', {
        confirmed: true,
        orderId: order.id,
        amount: order.price,
        title: order.adTitle
      });
    } else if (isNewlyCompleted && !settings.autoPlaceEnabled) {
      // Manual mode: notify admin that payment received and needs manual activation
      await sendTelegramNotification('payment', {
        confirmed: true,
        orderId: order.id,
        amount: order.price,
        title: order.adTitle
      });
    } else if (mappedStatus === 'CONFIRMING' && order.paymentStatus !== 'CONFIRMING') {
      await sendTelegramNotification('payment', {
        confirmed: false,
        orderId: order.id,
        amount: order.price,
        currency: order.payCurrency || 'CRYPTO',
        status: 'Confirming'
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('NowPayments webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Manually activate an order (admin) - creates/activates the ad
router.post('/orders/:id/activate', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    const order = await prisma.adOrderRequest.findUnique({
      where: { id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.createdAdId) {
      return res.status(400).json({ error: 'Ad already created for this order' });
    }
    
    const adId = await createAdFromOrder(order);
    
    if (!adId) {
      return res.status(500).json({ error: 'Failed to create ad' });
    }
    
    const updatedOrder = await prisma.adOrderRequest.findUnique({ where: { id } });
    res.json(updatedOrder);
  } catch (error) {
    console.error('Activate order error:', error);
    res.status(500).json({ error: 'Failed to activate order' });
  }
});

export default router;
