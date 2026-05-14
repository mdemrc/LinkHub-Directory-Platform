import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { sanitizeHtml, sanitizeCss, isValidUrl } from '../lib/sanitize';

const router = Router();

// Get all ads (admin)
router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const ads = await prisma.ad.findMany({
      orderBy: [
        { position: 'asc' },
        { order: 'asc' }
      ]
    });

    // Check which ads were created from paid orders
    const adIds = ads.map(a => a.id);
    const paidOrders = await prisma.adOrderRequest.findMany({
      where: { createdAdId: { in: adIds } },
      select: { createdAdId: true }
    });
    const purchasedAdIds = new Set(paidOrders.map(o => o.createdAdId));

    const adsWithPurchaseInfo = ads.map(ad => ({
      ...ad,
      isPurchased: purchasedAdIds.has(ad.id)
    }));

    res.json(adsWithPurchaseInfo);
  } catch (error) {
    console.error('Get all ads error:', error);
    res.status(500).json({ error: 'Failed to get ads' });
  }
});

// Get active ads by position (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { position, trackView } = req.query;

    const where: any = { isActive: true };

    // Date filtering for scheduled ads
    const now = new Date();
    where.OR = [
      { startDate: null, endDate: null },
      { startDate: { lte: now }, endDate: null },
      { startDate: null, endDate: { gte: now } },
      { startDate: { lte: now }, endDate: { gte: now } }
    ];

    // Map frontend position names to Prisma enum values
    if (position) {
      const positionMap: Record<string, string> = {
        // Legacy aliases (v1 compatibility)
        'TOP': 'HEADER_TOP',
        'BOTTOM': 'FOOTER',
        'CONTENT': 'CONTENT_TOP',
        // Direct enum values
        'HEADER_TOP': 'HEADER_TOP',
        'HEADER_BOTTOM': 'HEADER_BOTTOM',
        'SIDEBAR_LEFT': 'SIDEBAR_LEFT',
        'SIDEBAR_RIGHT': 'SIDEBAR_RIGHT',
        'CONTENT_TOP': 'CONTENT_TOP',
        'CONTENT_INLINE': 'CONTENT_INLINE',
        'FOOTER': 'FOOTER'
      };
      const mappedPosition = positionMap[position as string];
      if (mappedPosition) {
        where.position = mappedPosition;
      }
    }

    const ads = await prisma.ad.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    // Only increment view if explicitly requested (prevents double counting)
    if (trackView === 'true' && ads.length > 0) {
      await prisma.ad.updateMany({
        where: { id: { in: ads.map(a => a.id) } },
        data: { viewCount: { increment: 1 } }
      });
    }

    res.json(ads);
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ error: 'Failed to get ads' });
  }
});

// Track ad click
router.post('/:id/click', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.ad.update({
      where: { id: parseInt(id) },
      data: { clickCount: { increment: 1 } }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track ad click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Create ad (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    if (!data.type || !data.position || !data.linkUrl) {
      return res.status(400).json({ error: 'Type, position, and linkUrl are required' });
    }

    const ad = await prisma.ad.create({
      data: {
        name: data.name || `Ad ${Date.now()}`,
        type: data.type,
        position: data.position,
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl,
        htmlContent: data.htmlContent ? sanitizeHtml(data.htmlContent) : null,
        textContent: data.textContent || null,
        textTitle: data.textTitle || null,
        textIcon: data.textIcon || null,
        customCss: data.customCss ? sanitizeCss(data.customCss) : null,
        fontSize: data.fontSize || null,
        fontWeight: data.fontWeight || null,
        backgroundColor: data.backgroundColor || null,
        textColor: data.textColor || null,
        borderColor: data.borderColor || null,
        bannerSize: data.bannerSize || null,
        width: data.width || null,
        height: data.height || null,
        startDate: data.startDate && data.startDate !== '' ? new Date(data.startDate) : null,
        endDate: data.endDate && data.endDate !== '' ? new Date(data.endDate) : null,
        durationType: data.durationType || null,
        order: data.order || 0,
        isActive: data.isActive !== false
      }
    });

    res.status(201).json(ad);
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// Update ad (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    // Only update fields that were explicitly sent in the request
    const updateData: any = {};

    if ('name' in data) updateData.name = data.name || undefined;
    if ('type' in data) updateData.type = data.type;
    if ('position' in data) updateData.position = data.position;
    if ('linkUrl' in data) updateData.linkUrl = data.linkUrl;
    if ('imageUrl' in data) updateData.imageUrl = data.imageUrl || null;
    if ('htmlContent' in data) updateData.htmlContent = data.htmlContent ? sanitizeHtml(data.htmlContent) : null;
    if ('textContent' in data) updateData.textContent = data.textContent || null;
    if ('textTitle' in data) updateData.textTitle = data.textTitle || null;
    if ('textIcon' in data) updateData.textIcon = data.textIcon || null;
    if ('customCss' in data) updateData.customCss = data.customCss ? sanitizeCss(data.customCss) : null;
    if ('fontSize' in data) updateData.fontSize = data.fontSize || null;
    if ('fontWeight' in data) updateData.fontWeight = data.fontWeight || null;
    if ('backgroundColor' in data) updateData.backgroundColor = data.backgroundColor || null;
    if ('textColor' in data) updateData.textColor = data.textColor || null;
    if ('borderColor' in data) updateData.borderColor = data.borderColor || null;
    if ('bannerSize' in data) updateData.bannerSize = data.bannerSize || null;
    if ('startDate' in data) updateData.startDate = data.startDate && data.startDate !== '' ? new Date(data.startDate) : null;
    if ('endDate' in data) updateData.endDate = data.endDate && data.endDate !== '' ? new Date(data.endDate) : null;
    if ('durationType' in data) updateData.durationType = data.durationType || null;
    if ('order' in data) updateData.order = data.order ?? 0;
    if ('isActive' in data) updateData.isActive = data.isActive;

    const ad = await prisma.ad.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(ad);
  } catch (error: any) {
    console.error('Update ad error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ad not found' });
    }
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

// Reorder ads (admin only)
router.post('/reorder', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { adId, direction } = req.body;

    if (!adId || !direction) {
      return res.status(400).json({ error: 'adId and direction are required' });
    }

    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    // Get the neighbor ad to swap with
    const neighbor = await prisma.ad.findFirst({
      where: {
        position: ad.position,
        order: direction === 'up' ? { lt: ad.order } : { gt: ad.order }
      },
      orderBy: { order: direction === 'up' ? 'desc' : 'asc' }
    });

    if (neighbor) {
      // Swap orders
      await prisma.$transaction([
        prisma.ad.update({ where: { id: ad.id }, data: { order: neighbor.order } }),
        prisma.ad.update({ where: { id: neighbor.id }, data: { order: ad.order } }),
      ]);
    }

    const ads = await prisma.ad.findMany({
      orderBy: [{ position: 'asc' }, { order: 'asc' }]
    });

    res.json(ads);
  } catch (error) {
    console.error('Reorder ads error:', error);
    res.status(500).json({ error: 'Failed to reorder ads' });
  }
});

// Delete ad (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.ad.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Ad deleted successfully' });
  } catch (error: any) {
    console.error('Delete ad error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ad not found' });
    }
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

export default router;
