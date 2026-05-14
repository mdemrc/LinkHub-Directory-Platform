/**
 * TelegramService - Telegram Bot API for notifications
 */

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'Markdown' | 'HTML';
}

export interface SendMessageResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text: string;
  };
  description?: string;
}

const TELEGRAM_API_URL = 'https://api.telegram.org';

export class TelegramService {
  private botToken: string;

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(chatId: string, text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<SendMessageResponse> {
    try {
      const url = `${TELEGRAM_API_URL}/bot${this.botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      });

      const data = await response.json() as SendMessageResponse;
      
      if (!data.ok) {
        console.error('Telegram send message error:', data.description);
      }

      return data;
    } catch (error) {
      console.error('TelegramService sendMessage error:', error);
      return { ok: false, description: 'Network error' };
    }
  }

  /**
   * Verify bot token and get bot info
   */
  async verifyToken(): Promise<{ valid: boolean; botName?: string; error?: string }> {
    try {
      const url = `${TELEGRAM_API_URL}/bot${this.botToken}/getMe`;
      
      const response = await fetch(url);
      const data = await response.json() as { ok: boolean; result?: { username: string }; description?: string };

      if (data.ok && data.result) {
        return { valid: true, botName: data.result.username };
      }

      return { valid: false, error: data.description || 'Invalid token' };
    } catch (error) {
      console.error('TelegramService verifyToken error:', error);
      return { valid: false, error: 'Network error' };
    }
  }

  /**
   * Get chat info to verify chat ID
   */
  async getChat(chatId: string): Promise<{ valid: boolean; chatTitle?: string; error?: string }> {
    try {
      const url = `${TELEGRAM_API_URL}/bot${this.botToken}/getChat`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id: chatId }),
      });

      const data = await response.json() as { ok: boolean; result?: { title?: string; username?: string }; description?: string };

      if (data.ok && data.result) {
        return { valid: true, chatTitle: data.result.title || data.result.username || 'Private Chat' };
      }

      return { valid: false, error: data.description || 'Invalid chat ID' };
    } catch (error) {
      console.error('TelegramService getChat error:', error);
      return { valid: false, error: 'Network error' };
    }
  }

  /**
   * Format a message template with placeholders
   */
  static formatTemplate(template: string, data: Record<string, string | number>): string {
    let formatted = template;
    
    for (const [key, value] of Object.entries(data)) {
      formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    
    return formatted;
  }

  /**
   * Send payment received notification
   */
  async sendPaymentReceived(
    chatId: string,
    template: string,
    data: {
      orderId: number | string;
      amount: number | string;
      currency: string;
      status: string;
    }
  ): Promise<SendMessageResponse> {
    const text = TelegramService.formatTemplate(template, data);
    return this.sendMessage(chatId, text);
  }

  /**
   * Send payment confirmed notification
   */
  async sendPaymentConfirmed(
    chatId: string,
    template: string,
    data: {
      orderId: number | string;
      amount: number | string;
      title: string;
    }
  ): Promise<SendMessageResponse> {
    const text = TelegramService.formatTemplate(template, data);
    return this.sendMessage(chatId, text);
  }

  /**
   * Send new order notification
   */
  async sendNewOrder(
    chatId: string,
    template: string,
    data: {
      orderId: number | string;
      type: string;
      title: string;
      duration: string;
      price: number | string;
      contact: string;
    }
  ): Promise<SendMessageResponse> {
    const text = TelegramService.formatTemplate(template, data);
    return this.sendMessage(chatId, text);
  }

  /**
   * Send new link submission notification
   */
  async sendNewLinkSubmission(
    chatId: string,
    template: string,
    data: {
      title: string;
      url: string;
      contact: string;
    }
  ): Promise<SendMessageResponse> {
    const text = TelegramService.formatTemplate(template, data);
    return this.sendMessage(chatId, text);
  }
}

export default TelegramService;
