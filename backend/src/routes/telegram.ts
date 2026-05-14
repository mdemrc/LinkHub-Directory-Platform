/**
 * Telegram Settings Routes
 * Admin endpoints for managing Telegram notifications
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TelegramService } from '../lib/telegramService';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Default message templates
const DEFAULT_TEMPLATES = {
  paymentReceived: '💰 *New Payment Received*\n\nOrder: #{orderId}\nAmount: ${amount}\nCurrency: {currency}\nStatus: {status}',
  paymentConfirmed: '✅ *Payment Confirmed*\n\nOrder: #{orderId}\nAmount: ${amount}\nTitle: {title}',
  newOrder: '📦 *New Ad Order*\n\nOrder: #{orderId}\nType: {type}\nTitle: {title}\nDuration: {duration}\nPrice: ${price}\nContact: {contact}',
  newLink: '🔗 *New Link Submission*\n\nTitle: {title}\nURL: {url}\nContact: {contact}'
};

// Helper to mask token
function maskToken(token: string | null): string {
  if (!token) return '';
  if (token.length < 10) return '****';
  return token.substring(0, 6) + '****' + token.substring(token.length - 4);
}

// ============================================================================
// GET /api/telegram/settings - Get telegram settings (admin)
// ============================================================================
router.get('/settings', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.telegramSettings.findFirst();
    
    if (!settings) {
      // Create default settings with default templates
      settings = await prisma.telegramSettings.create({
        data: {
          paymentReceivedTemplate: DEFAULT_TEMPLATES.paymentReceived,
          paymentConfirmedTemplate: DEFAULT_TEMPLATES.paymentConfirmed,
          newOrderTemplate: DEFAULT_TEMPLATES.newOrder,
          newLinkTemplate: DEFAULT_TEMPLATES.newLink
        }
      });
    }

    // Mask sensitive data
    res.json({
      ...settings,
      // Use defaults if templates are null
      paymentReceivedTemplate: settings.paymentReceivedTemplate || DEFAULT_TEMPLATES.paymentReceived,
      paymentConfirmedTemplate: settings.paymentConfirmedTemplate || DEFAULT_TEMPLATES.paymentConfirmed,
      newOrderTemplate: settings.newOrderTemplate || DEFAULT_TEMPLATES.newOrder,
      newLinkTemplate: settings.newLinkTemplate || DEFAULT_TEMPLATES.newLink,
      botToken: maskToken(settings.botToken),
      hasBotToken: !!settings.botToken,
      hasChatId: !!settings.chatId
    });
  } catch (error) {
    console.error('Get telegram settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// ============================================================================
// PATCH /api/telegram/settings - Update telegram settings (admin)
// ============================================================================
router.patch('/settings', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      botToken,
      chatId,
      enabled,
      notifyPayments,
      notifyOrders,
      notifyLinks,
      paymentReceivedTemplate,
      paymentConfirmedTemplate,
      newOrderTemplate,
      newLinkTemplate
    } = req.body;

    let settings = await prisma.telegramSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.telegramSettings.create({
        data: {}
      });
    }

    // Build update data
    const updateData: any = {};

    // Only update botToken if provided (not masked)
    if (botToken !== undefined && !botToken.includes('****')) {
      updateData.botToken = botToken || null;
    }
    
    if (chatId !== undefined) updateData.chatId = chatId || null;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (notifyPayments !== undefined) updateData.notifyPayments = notifyPayments;
    if (notifyOrders !== undefined) updateData.notifyOrders = notifyOrders;
    if (notifyLinks !== undefined) updateData.notifyLinks = notifyLinks;
    
    // Message templates
    if (paymentReceivedTemplate !== undefined) updateData.paymentReceivedTemplate = paymentReceivedTemplate;
    if (paymentConfirmedTemplate !== undefined) updateData.paymentConfirmedTemplate = paymentConfirmedTemplate;
    if (newOrderTemplate !== undefined) updateData.newOrderTemplate = newOrderTemplate;
    if (newLinkTemplate !== undefined) updateData.newLinkTemplate = newLinkTemplate;

    const updated = await prisma.telegramSettings.update({
      where: { id: settings.id },
      data: updateData
    });

    res.json({
      ...updated,
      botToken: maskToken(updated.botToken),
      hasBotToken: !!updated.botToken,
      hasChatId: !!updated.chatId
    });
  } catch (error) {
    console.error('Update telegram settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============================================================================
// POST /api/telegram/test - Test telegram connection (admin)
// ============================================================================
router.post('/test', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.telegramSettings.findFirst();
    
    if (!settings?.botToken) {
      return res.status(400).json({ success: false, error: 'Bot token not configured' });
    }

    if (!settings?.chatId) {
      return res.status(400).json({ success: false, error: 'Chat ID not configured' });
    }

    const telegramService = new TelegramService(settings.botToken);
    
    // Verify bot token
    const botVerify = await telegramService.verifyToken();
    if (!botVerify.valid) {
      return res.json({ 
        success: false, 
        error: `Invalid bot token: ${botVerify.error}` 
      });
    }

    // Verify chat ID
    const chatVerify = await telegramService.getChat(settings.chatId);
    if (!chatVerify.valid) {
      return res.json({ 
        success: false, 
        error: `Invalid chat ID: ${chatVerify.error}` 
      });
    }

    // Send test message
    const testMessage = `🔔 *LinkHub Test Notification*\n\n` +
      `Bot: @${botVerify.botName}\n` +
      `Chat: ${chatVerify.chatTitle}\n` +
      `Time: ${new Date().toISOString()}\n\n` +
      `✅ Connection successful!`;

    const sendResult = await telegramService.sendMessage(settings.chatId, testMessage);
    
    if (sendResult.ok) {
      res.json({ 
        success: true, 
        message: 'Test message sent successfully',
        botName: botVerify.botName,
        chatTitle: chatVerify.chatTitle
      });
    } else {
      res.json({ 
        success: false, 
        error: `Failed to send message: ${sendResult.description}` 
      });
    }
  } catch (error) {
    console.error('Test telegram error:', error);
    res.status(500).json({ success: false, error: 'Failed to test connection' });
  }
});

// ============================================================================
// POST /api/telegram/send - Send a custom notification (admin)
// ============================================================================
router.post('/send', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const settings = await prisma.telegramSettings.findFirst();
    
    if (!settings?.enabled || !settings?.botToken || !settings?.chatId) {
      return res.status(400).json({ error: 'Telegram notifications not configured' });
    }

    const telegramService = new TelegramService(settings.botToken);
    const result = await telegramService.sendMessage(settings.chatId, message);
    
    if (result.ok) {
      res.json({ success: true, message: 'Message sent successfully' });
    } else {
      res.json({ success: false, error: result.description });
    }
  } catch (error) {
    console.error('Send telegram error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================================================
// POST /api/telegram/test-notification - Send a test notification by type (admin)
// ============================================================================
router.post('/test-notification', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.body;

    const settings = await prisma.telegramSettings.findFirst();

    if (!settings?.botToken || !settings?.chatId) {
      return res.status(400).json({ success: false, error: 'Bot token and chat ID must be configured' });
    }

    const telegramService = new TelegramService(settings.botToken);

    let message = '';
    switch (type) {
      case 'link':
        message = TelegramService.formatTemplate(
          settings.newLinkTemplate || DEFAULT_TEMPLATES.newLink,
          { title: 'Example Site', url: 'https://example.com', contact: 'test@example.com' }
        );
        break;
      case 'order':
        message = TelegramService.formatTemplate(
          settings.newOrderTemplate || DEFAULT_TEMPLATES.newOrder,
          { orderId: 'TEST-001', type: 'BANNER', title: 'Test Banner Ad', duration: '30 days', price: '49.99', contact: 'test@example.com' }
        );
        break;
      case 'payment_received':
        message = TelegramService.formatTemplate(
          settings.paymentReceivedTemplate || DEFAULT_TEMPLATES.paymentReceived,
          { orderId: 'TEST-001', amount: '49.99', currency: 'BTC', status: 'confirming' }
        );
        break;
      case 'payment_confirmed':
        message = TelegramService.formatTemplate(
          settings.paymentConfirmedTemplate || DEFAULT_TEMPLATES.paymentConfirmed,
          { orderId: 'TEST-001', amount: '49.99', title: 'Test Banner Ad' }
        );
        break;
      default:
        return res.status(400).json({ success: false, error: 'Invalid notification type. Use: link, order, payment_received, payment_confirmed' });
    }

    const result = await telegramService.sendMessage(settings.chatId, message);

    if (result.ok) {
      res.json({ success: true, message: `Test ${type} notification sent` });
    } else {
      res.json({ success: false, error: result.description });
    }
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to send test notification' });
  }
});

export default router;

