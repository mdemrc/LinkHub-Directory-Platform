import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { triggerManualCheck, updateCheckInterval, checkSingleLink } from '../services/siteChecker';

const router = Router();

// ===== Public Settings Endpoint =====
router.get('/public', async (req: Request, res: Response) => {
  try {
    const publicKeys = [
      'site_name',
      'site_description',
      'site_keywords',
      'logo_url',
      'favicon_url',
      'primary_color',
      'contact_email',
      'discord_url',
      'telegram_url',
      'enable_submissions',
      'enable_ads',
      'maintenance_mode',
      'social_links',
      'legal_terms_html',
      'legal_privacy_html',
      'captcha_enabled',
      'captcha_provider',
      'captcha_site_key',
      'livechat_enabled',
      'livechat_provider',
      'livechat_property_id',
      'livechat_base_url',
      'livechat_embed_code',
      'advertising_page_mode',
      'jabber_url',
    ];

    const settings = await prisma.setting.findMany({
      where: {
        key: { in: publicKeys }
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Failed to get public settings' });
  }
});

// ===== Site Checker Endpoints =====

// Get site checker status
router.get('/site-checker/status', async (req: Request, res: Response) => {
  try {
    const [intervalSetting, timeoutSetting, lastCheckSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'site_check_interval' } }),
      prisma.setting.findUnique({ where: { key: 'site_check_timeout' } }),
      prisma.setting.findUnique({ where: { key: 'last_site_check' } })
    ]);

    // Get link statistics
    const stats = await prisma.link.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: true
    });

    const statusCounts = {
      online: stats.find(s => s.status === 'ONLINE')?._count || 0,
      offline: stats.find(s => s.status === 'OFFLINE')?._count || 0,
      unknown: stats.find(s => s.status === 'UNKNOWN')?._count || 0
    };

    res.json({
      interval: parseInt(String(intervalSetting?.value)) || 30,
      timeout: parseInt(String(timeoutSetting?.value)) || 10000,
      lastCheck: lastCheckSetting?.value || null,
      stats: statusCounts
    });
  } catch (error) {
    console.error('Get site checker status error:', error);
    res.status(500).json({ error: 'Failed to get site checker status' });
  }
});

// Update site checker settings (admin only)
router.post('/site-checker/settings', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { interval, timeout } = req.body;

    if (interval !== undefined) {
      const minutes = parseInt(interval);
      if (minutes < 1 || minutes > 1440) {
        return res.status(400).json({ error: 'Interval must be between 1 and 1440 minutes' });
      }
      await updateCheckInterval(minutes);
    }

    if (timeout !== undefined) {
      const ms = parseInt(timeout);
      if (ms < 1000 || ms > 60000) {
        return res.status(400).json({ error: 'Timeout must be between 1000 and 60000 ms' });
      }
      await prisma.setting.upsert({
        where: { key: 'site_check_timeout' },
        update: { value: String(ms) },
        create: { 
          key: 'site_check_timeout', 
          value: String(ms), 
          category: 'site_checker',
          description: 'Timeout in milliseconds for each site check'
        }
      });
    }

    res.json({ message: 'Site checker settings updated' });
  } catch (error) {
    console.error('Update site checker settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Trigger manual site check (admin only)
router.post('/site-checker/run', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await triggerManualCheck();
    res.json(result);
  } catch (error) {
    console.error('Trigger site check error:', error);
    res.status(500).json({ error: 'Failed to trigger site check' });
  }
});

// Check single link (admin only)
router.post('/site-checker/check/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const linkId = parseInt(req.params.id as string);
    const result = await checkSingleLink(linkId);
    
    if (!result) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Check single link error:', error);
    res.status(500).json({ error: 'Failed to check link' });
  }
});

// ===== General Settings Endpoints =====

// Get setting by key (restricted to safe public keys only)
const PUBLIC_SETTING_KEYS = new Set([
  'site_name', 'site_description', 'site_keywords', 'logo_url', 'favicon_url',
  'primary_color', 'contact_email', 'discord_url', 'telegram_url',
  'enable_submissions', 'enable_ads', 'maintenance_mode', 'social_links',
  'legal_terms_html', 'legal_privacy_html',
  'site_check_interval', 'site_check_timeout', 'last_site_check',
  'NOWPAYMENTS_ENABLED', 'PAYMENT_MIN_AMOUNT', 'PAYMENT_MAX_AMOUNT', 'PAYMENT_CURRENCY',
  'captcha_enabled', 'captcha_provider', 'captcha_site_key'
]);

router.get('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;

    if (!PUBLIC_SETTING_KEYS.has(key)) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const setting = await prisma.setting.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to get setting' });
  }
});

// Get settings by category (restricted to safe categories)
const PUBLIC_SETTING_CATEGORIES = new Set(['general', 'appearance', 'site_checker', 'seo']);

router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category as string;

    if (!PUBLIC_SETTING_CATEGORIES.has(category)) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const settings = await prisma.setting.findMany({
      where: { 
        category,
        key: { in: Array.from(PUBLIC_SETTING_KEYS) }
      }
    });

    // Convert to key-value object
    const settingsObj = settings.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings by category error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Get all settings (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    res.json(settings);
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Create or update setting (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { key, value, category, description } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, category, description },
      create: { key, value, category: category || 'general', description }
    });

    res.json(setting);
  } catch (error) {
    console.error('Create/update setting error:', error);
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

// Bulk update settings (admin only)
router.post('/bulk', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { settings } = req.body; // [{key, value, category?}, ...]

    await prisma.$transaction(
      settings.map((s: { key: string; value: any; category?: string }) =>
        prisma.setting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: { key: s.key, value: s.value, category: s.category || 'general' }
        })
      )
    );

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Delete setting (admin only)
router.delete('/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const key = req.params.key as string;

    await prisma.setting.delete({
      where: { key }
    });

    res.json({ message: 'Setting deleted successfully' });
  } catch (error: any) {
    console.error('Delete setting error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Get contact info
router.get('/contact/info', async (req: Request, res: Response) => {
  try {
    const contacts = await prisma.contactInfo.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    res.json(contacts);
  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({ error: 'Failed to get contact info' });
  }
});

// Update contact info (admin only)
router.post('/contact/info', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const contact = await prisma.contactInfo.upsert({
      where: { id: data.id || 0 },
      update: data,
      create: data
    });

    res.json(contact);
  } catch (error) {
    console.error('Update contact info error:', error);
    res.status(500).json({ error: 'Failed to update contact info' });
  }
});

export default router;
