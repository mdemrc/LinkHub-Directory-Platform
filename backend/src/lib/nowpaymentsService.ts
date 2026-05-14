import crypto from 'crypto';

export interface NowPaymentsPayment {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id?: string;
  order_description?: string;
  purchase_id?: string;
  created_at?: string;
  updated_at?: string;
  actually_paid?: number;
  outcome_amount?: number;
  outcome_currency?: string;
}

export interface NowPaymentsStatusResponse {
  payment_id: string;
  payment_status: 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';
  pay_address: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  purchase_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MinAmountResponse {
  currency_from: string;
  currency_to: string;
  min_amount: number;
  fiat_equivalent?: number;
}

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

// Supported cryptocurrencies with their display info
export const SUPPORTED_CRYPTOS = [
  { code: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: 'bitcoin' },
  { code: 'eth', name: 'Ethereum', symbol: 'ETH', icon: 'ethereum' },
  { code: 'ltc', name: 'Litecoin', symbol: 'LTC', icon: 'litecoin' },
  { code: 'bch', name: 'Bitcoin Cash', symbol: 'BCH', icon: 'bitcoincash' },
  { code: 'usdttrc20', name: 'USDT (TRC-20)', symbol: 'USDT', icon: 'tether' },
  { code: 'usdterc20', name: 'USDT (ERC-20)', symbol: 'USDT', icon: 'tether' },
  { code: 'trx', name: 'Tron', symbol: 'TRX', icon: 'tron' },
  { code: 'xmr', name: 'Monero', symbol: 'XMR', icon: 'monero' },
  { code: 'xrp', name: 'Ripple', symbol: 'XRP', icon: 'ripple' },
  { code: 'sol', name: 'Solana', symbol: 'SOL', icon: 'solana' },
  { code: 'bnbbsc', name: 'BNB (BSC)', symbol: 'BNB', icon: 'bnb' },
  { code: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: 'usdc' },
  { code: 'doge', name: 'Dogecoin', symbol: 'DOGE', icon: 'dogecoin' },
];

export class NowPaymentsService {
  private apiKey: string;
  private ipnSecret: string;

  constructor(apiKey: string, ipnSecret: string) {
    this.apiKey = apiKey;
    this.ipnSecret = ipnSecret;
  }

  /**
   * Create a new payment
   */
  async createPayment(
    amount: number,
    payCurrency: string,
    orderId?: string,
    orderDescription?: string,
    callbackUrl?: string
  ): Promise<NowPaymentsPayment> {
    try {
      const paymentData: any = {
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: payCurrency.toLowerCase(),
        order_id: orderId,
        order_description: orderDescription,
      };

      if (callbackUrl) {
        paymentData.ipn_callback_url = callbackUrl;
      }

      const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string; error?: string };
        const message = errorData.message || errorData.error || response.statusText || '';
        if (
          message.toLowerCase().includes('less than minimal') ||
          message.toLowerCase().includes('minimum') ||
          message.toLowerCase().includes('too small') ||
          message.toLowerCase().includes('amount is less')
        ) {
          const minError = new Error('MINIMUM_AMOUNT_ERROR') as any;
          minError.isMinimumError = true;
          minError.originalMessage = message;
          throw minError;
        }
        throw new Error(`NowPayments API error: ${message}`);
      }

      return await response.json() as NowPaymentsPayment;
    } catch (error: any) {
      console.error('NowPayments createPayment error:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<NowPaymentsStatusResponse> {
    try {
      const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(`NowPayments API error: ${errorData.message || response.statusText}`);
      }

      return await response.json() as NowPaymentsStatusResponse;
    } catch (error: any) {
      console.error('NowPayments getPaymentStatus error:', error);
      throw error;
    }
  }

  /**
   * Get minimum payment amount for a currency (in USD)
   */
  async getMinimumAmount(payCurrency: string): Promise<number> {
    try {
      // Use currency_from=usd to get the minimum USD amount directly, avoiding conversion rate issues
      const url = `${NOWPAYMENTS_API_URL}/min-amount?currency_from=usd&currency_to=${payCurrency.toLowerCase()}&fiat_equivalent=usd`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        // Fallback: try old method with fiat_equivalent
        const fallbackUrl = `${NOWPAYMENTS_API_URL}/min-amount?currency_from=${payCurrency.toLowerCase()}&currency_to=${payCurrency.toLowerCase()}&fiat_equivalent=usd`;
        const fallbackRes = await fetch(fallbackUrl, { method: 'GET', headers: { 'x-api-key': this.apiKey } });
        if (!fallbackRes.ok) return 5;
        const fallbackData = await fallbackRes.json() as MinAmountResponse;
        return fallbackData.fiat_equivalent || 5;
      }

      const data = await response.json() as MinAmountResponse;
      // min_amount is in USD when currency_from=usd
      return data.min_amount || data.fiat_equivalent || 5;
    } catch (error) {
      return 5; // Default minimum
    }
  }

  /**
   * Get minimum amounts for multiple currencies
   */
  async getMinimumAmounts(currencies: string[]): Promise<Record<string, number>> {
    const amounts: Record<string, number> = {};
    
    await Promise.all(
      currencies.map(async (currency) => {
        try {
          amounts[currency] = await this.getMinimumAmount(currency);
        } catch (error) {
          amounts[currency] = 5; // Default
        }
      })
    );
    
    return amounts;
  }

  /**
   * Validate webhook signature
   */
  validateWebhook(payload: any, signature: string): boolean {
    try {
      if (!this.ipnSecret) {
        console.warn('IPN Secret not configured, skipping validation');
        return true;
      }

      const hmac = crypto.createHmac('sha512', this.ipnSecret);
      const sortedPayload = JSON.stringify(this.sortObject(payload));
      hmac.update(sortedPayload);
      const calculatedSignature = hmac.digest('hex');

      return calculatedSignature === signature;
    } catch (error) {
      console.error('NowPayments validateWebhook error:', error);
      return false;
    }
  }

  /**
   * Sort object keys for signature calculation
   */
  private sortObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    return Object.keys(obj)
      .sort()
      .reduce((result: any, key: string) => {
        result[key] = this.sortObject(obj[key]);
        return result;
      }, {});
  }

  /**
   * Map NowPayments status to internal status
   */
  mapStatus(npStatus: string): 'PENDING' | 'CONFIRMING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' {
    switch (npStatus) {
      case 'waiting':
        return 'PENDING';
      case 'confirming':
      case 'sending':
        return 'CONFIRMING';
      case 'confirmed':
      case 'finished':
        return 'COMPLETED';
      case 'failed':
      case 'refunded':
        return 'FAILED';
      case 'expired':
        return 'EXPIRED';
      default:
        return 'PENDING';
    }
  }
}

// Singleton instance getter
let serviceInstance: NowPaymentsService | null = null;

export function getNowPaymentsService(apiKey?: string, ipnSecret?: string): NowPaymentsService | null {
  if (apiKey) {
    serviceInstance = new NowPaymentsService(apiKey, ipnSecret || '');
    return serviceInstance;
  }
  return serviceInstance;
}
