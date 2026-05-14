import prisma from './prisma';
import { TelegramService } from './telegramService';

async function getTelegramService(): Promise<{ service: TelegramService; chatId: string; settings: any } | null> {
  try {
    const settings = await prisma.telegramSettings.findFirst();
    if (!settings?.enabled || !settings?.botToken || !settings?.chatId) return null;
    return { service: new TelegramService(settings.botToken), chatId: settings.chatId, settings };
  } catch {
    return null;
  }
}

export async function notifyNewLinkSubmission(data: {
  title: string;
  url: string;
  mirrorUrl?: string | null;
  altUrl?: string | null;
  description?: string | null;
  category?: string | null;
  countryCode?: string | null;
  contact?: string | null;
}) {
  try {
    const tg = await getTelegramService();
    if (!tg?.settings?.notifyLinks) return;
    const { service, chatId, settings } = tg;
    let message = '🔗 *New Link Submission*\n\n';
    message += `📌 *Title:* ${data.title}\n`;
    message += `🌐 *URL:* ${data.url}\n`;
    if (data.mirrorUrl) message += `🔁 *Mirror:* ${data.mirrorUrl}\n`;
    if (data.altUrl) message += `🟣 *Alt:* ${data.altUrl}\n`;
    if (data.description) message += `📝 *Description:* ${data.description}\n`;
    if (data.category) message += `📂 *Category:* ${data.category}\n`;
    if (data.countryCode) message += `🏳️ *Country:* ${data.countryCode}\n`;
    message += `👤 *Contact:* ${data.contact || 'Anonymous'}`;
    await service.sendMessage(chatId, message);
  } catch (error) {
    console.error('Telegram notify link submission error:', error);
  }
}

export async function notifyNewOrder(data: {
  orderId: string;
  adType: string;
  title: string;
  duration: string;
  price: number;
  contact: string;
}) {
  try {
    const tg = await getTelegramService();
    if (!tg?.settings?.notifyOrders) return;
    const { service, chatId, settings } = tg;
    const template = settings.newOrderTemplate || '📦 *New Ad Order*\n\nOrder: #{orderId}\nType: {type}\nTitle: {title}\nDuration: {duration}\nPrice: ${price}\nContact: {contact}';
    const message = TelegramService.formatTemplate(template, {
      orderId: data.orderId,
      type: data.adType,
      title: data.title,
      duration: data.duration,
      price: data.price,
      contact: data.contact,
    });
    await service.sendMessage(chatId, message);
  } catch (error) {
    console.error('Telegram notify new order error:', error);
  }
}

export async function notifyPaymentReceived(data: {
  orderId: string;
  amount: number;
  currency: string;
  status: string;
}) {
  try {
    const tg = await getTelegramService();
    if (!tg?.settings?.notifyPayments) return;
    const { service, chatId, settings } = tg;
    const template = settings.paymentReceivedTemplate || '💰 *New Payment Received*\n\nOrder: #{orderId}\nAmount: ${amount}\nCurrency: {currency}\nStatus: {status}';
    const message = TelegramService.formatTemplate(template, {
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
    });
    await service.sendMessage(chatId, message);
  } catch (error) {
    console.error('Telegram notify payment received error:', error);
  }
}

export async function notifyPaymentConfirmed(data: {
  orderId: string;
  amount: number;
  title: string;
}) {
  try {
    const tg = await getTelegramService();
    if (!tg?.settings?.notifyPayments) return;
    const { service, chatId, settings } = tg;
    const template = settings.paymentConfirmedTemplate || '✅ *Payment Confirmed*\n\nOrder: #{orderId}\nAmount: ${amount}\nTitle: {title}';
    const message = TelegramService.formatTemplate(template, {
      orderId: data.orderId,
      amount: data.amount,
      title: data.title,
    });
    await service.sendMessage(chatId, message);
  } catch (error) {
    console.error('Telegram notify payment confirmed error:', error);
  }
}

export async function notifyScamReport(data: {
  siteName: string;
  siteUrl?: string | null;
  category: string;
}) {
  try {
    const tg = await getTelegramService();
    if (!tg) return;
    const { service, chatId } = tg;
    const message = `⚠️ *New Scam Report*\n\nSite: ${data.siteName}\nURL: ${data.siteUrl || 'N/A'}\nCategory: ${data.category}`;
    await service.sendMessage(chatId, message);
  } catch (error) {
    console.error('Telegram notify scam report error:', error);
  }
}
