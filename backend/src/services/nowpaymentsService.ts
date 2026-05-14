import crypto from 'crypto';
import { PrismaClient, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface NowPaymentsConfig {
  apiKey: string;
  ipnSecret: string;
  sandboxMode?: boolean;
}

export interface CreatePaymentParams {
  priceAmount: number;
  priceCurrency: string;
  payCurrency?: string;
  orderId: string;
  orderDescription?: string;
  callbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface NowPaymentsInvoice {
  id: string;
  token_id: string;
  invoice_url: string;
  success_url: string;
  cancel_url: string;
  partially_paid_url: string | null;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  order_id: string;
  order_description: string;
  price_amount: string;
  price_currency: string;
  pay_currency: string | null;
  is_fixed_rate: boolean;
  is_fee_paid_by_user: boolean;
}

export interface NowPaymentsPayment {
  payment_id: number;
  invoice_id: number | null;
  payment_status: string;
  pay_address: string;
  payin_extra_id: string | null;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: number;
  outcome_amount: number;
  outcome_currency: string;
  created_at: string;
  updated_at: string;
}

export interface NowPaymentsWebhookPayload {
  payment_id: number;
  invoice_id: number | null;
  payment_status: string;
  pay_address: string;
  payin_extra_id: string | null;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: number;
  outcome_amount: number;
  outcome_currency: string;
  created_at: string;
  updated_at: string;
}

export interface MinAmountResponse {
  currency_from: string;
  currency_to: string;
  min_amount: number;
  fiat_equivalent?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class NowPaymentsService {
  private readonly apiKey: string;
  private readonly ipnSecret: string;
  private readonly baseUrl: string;

  constructor(config: NowPaymentsConfig) {
    this.apiKey = config.apiKey;
    this.ipnSecret = config.ipnSecret;
    this.baseUrl = config.sandboxMode
      ? 'https://api-sandbox.nowpayments.io/v1'
      : 'https://api.nowpayments.io/v1';
  }

  /**
   * Get API status
   */
  async getStatus(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/status`, {
      headers: { 'x-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`NowPayments API error: ${response.statusText}`);
    }

    return response.json() as Promise<{ message: string }>;
  }

  /**
   * Get available currencies
   */
  async getCurrencies(): Promise<{ currencies: string[] }> {
    const response = await fetch(`${this.baseUrl}/currencies`, {
      headers: { 'x-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to get currencies: ${response.statusText}`);
    }

    return response.json() as Promise<{ currencies: string[] }>;
  }

  /**
   * Get minimum payment amount for a currency
   */
  async getMinimumAmount(
    currencyFrom: string,
    currencyTo: string = 'btc'
  ): Promise<MinAmountResponse> {
    const params = new URLSearchParams({
      currency_from: currencyFrom.toLowerCase(),
      currency_to: currencyTo.toLowerCase(),
    });

    const response = await fetch(`${this.baseUrl}/min-amount?${params}`, {
      headers: { 'x-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to get minimum amount: ${response.statusText}`);
    }

    return response.json() as Promise<MinAmountResponse>;
  }

  /**
   * Get estimated price for a payment
   */
  async getEstimatedPrice(
    amount: number,
    currencyFrom: string,
    currencyTo: string
  ): Promise<{ estimated_amount: number }> {
    const params = new URLSearchParams({
      amount: amount.toString(),
      currency_from: currencyFrom.toLowerCase(),
      currency_to: currencyTo.toLowerCase(),
    });

    const response = await fetch(`${this.baseUrl}/estimate?${params}`, {
      headers: { 'x-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to get estimate: ${response.statusText}`);
    }

    return response.json() as Promise<{ estimated_amount: number }>;
  }

  /**
   * Create an invoice (payment page)
   */
  async createInvoice(params: CreatePaymentParams): Promise<NowPaymentsInvoice> {
    const response = await fetch(`${this.baseUrl}/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: params.priceAmount,
        price_currency: params.priceCurrency.toLowerCase(),
        pay_currency: params.payCurrency?.toLowerCase(),
        order_id: params.orderId,
        order_description: params.orderDescription || `Order ${params.orderId}`,
        ipn_callback_url: params.callbackUrl,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(
        `Failed to create invoice: ${errorData.message || response.statusText}`
      );
    }

    return response.json() as Promise<NowPaymentsInvoice>;
  }

  /**
   * Create a direct payment (without invoice page)
   */
  async createPayment(params: CreatePaymentParams): Promise<NowPaymentsPayment> {
    if (!params.payCurrency) {
      throw new Error('payCurrency is required for direct payment');
    }

    const response = await fetch(`${this.baseUrl}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: params.priceAmount,
        price_currency: params.priceCurrency.toLowerCase(),
        pay_currency: params.payCurrency.toLowerCase(),
        order_id: params.orderId,
        order_description: params.orderDescription || `Order ${params.orderId}`,
        ipn_callback_url: params.callbackUrl,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(
        `Failed to create payment: ${errorData.message || response.statusText}`
      );
    }

    return response.json() as Promise<NowPaymentsPayment>;
  }

  /**
   * Get payment status by ID
   */
  async getPaymentStatus(paymentId: string | number): Promise<NowPaymentsPayment> {
    const response = await fetch(`${this.baseUrl}/payment/${paymentId}`, {
      headers: { 'x-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment status: ${response.statusText}`);
    }

    return response.json() as Promise<NowPaymentsPayment>;
  }

  /**
   * Validate IPN webhook signature
   */
  validateWebhook(payload: string, signature: string): boolean {
    if (!this.ipnSecret) {
      console.warn('IPN secret not configured, skipping validation');
      return true;
    }

    const hmac = crypto.createHmac('sha512', this.ipnSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(signature)
    );
  }

  /**
   * Sort object keys for signature verification
   */
  sortObject(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.keys(obj)
      .sort()
      .reduce((result: Record<string, unknown>, key: string) => {
        result[key] = obj[key];
        return result;
      }, {});
  }

  /**
   * Map NowPayments status to our PaymentStatus enum
   */
  mapStatus(nowPaymentsStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      waiting: PaymentStatus.WAITING,
      confirming: PaymentStatus.CONFIRMING,
      confirmed: PaymentStatus.CONFIRMED,
      sending: PaymentStatus.SENDING,
      partially_paid: PaymentStatus.PARTIALLY_PAID,
      finished: PaymentStatus.FINISHED,
      failed: PaymentStatus.FAILED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
    };

    return statusMap[nowPaymentsStatus.toLowerCase()] || PaymentStatus.WAITING;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let serviceInstance: NowPaymentsService | null = null;

/**
 * Get or create NowPayments service instance
 * Fetches configuration from database Settings
 */
export async function getNowPaymentsService(): Promise<NowPaymentsService | null> {
  try {
    // Fetch settings from database
    const [enabledSetting, apiKeySetting, ipnSecretSetting, sandboxSetting] =
      await Promise.all([
        prisma.setting.findUnique({ where: { key: 'NOWPAYMENTS_ENABLED' } }),
        prisma.setting.findUnique({ where: { key: 'NOWPAYMENTS_API_KEY' } }),
        prisma.setting.findUnique({ where: { key: 'NOWPAYMENTS_IPN_SECRET' } }),
        prisma.setting.findUnique({ where: { key: 'NOWPAYMENTS_SANDBOX' } }),
      ]);

    // Check if NowPayments is enabled
    const isEnabled = enabledSetting?.value === true || enabledSetting?.value === 'true';
    if (!isEnabled) {
      return null;
    }

    // Get API key
    const apiKey = typeof apiKeySetting?.value === 'string' 
      ? apiKeySetting.value 
      : (apiKeySetting?.value as { value?: string })?.value;
    
    if (!apiKey) {
      console.warn('NowPayments API key not configured');
      return null;
    }

    // Get IPN secret
    const ipnSecret = typeof ipnSecretSetting?.value === 'string'
      ? ipnSecretSetting.value
      : (ipnSecretSetting?.value as { value?: string })?.value || '';

    // Check sandbox mode
    const sandboxMode = sandboxSetting?.value === true || sandboxSetting?.value === 'true';

    // Create or update service instance
    serviceInstance = new NowPaymentsService({
      apiKey,
      ipnSecret,
      sandboxMode,
    });

    return serviceInstance;
  } catch (error) {
    console.error('Error initializing NowPayments service:', error);
    return null;
  }
}

/**
 * Check if NowPayments is configured and enabled
 */
export async function isNowPaymentsEnabled(): Promise<boolean> {
  const service = await getNowPaymentsService();
  return service !== null;
}

export default NowPaymentsService;
