import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get current stats (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const [
      totalLinks,
      onlineLinks,
      offlineLinks,
      totalUsers,
      totalCategories
    ] = await Promise.all([
      prisma.link.count({ where: { isActive: true } }),
      prisma.link.count({ where: { isActive: true, status: 'ONLINE' } }),
      prisma.link.count({ where: { isActive: true, status: 'OFFLINE' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } })
    ]);

    res.json({
      totalLinks,
      onlineLinks,
      offlineLinks,
      totalUsers,
      totalCategories
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get admin dashboard stats
router.get('/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalLinks,
      onlineLinks,
      offlineLinks,
      totalUsers,
      pendingSubmissions,
      totalClicks,
      // Additional stats
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      todayRevenue,
      // AdOrderRequest stats (second order system)
      totalOrderRequests,
      pendingOrderRequests,
      completedOrderRequests,
      totalReqRevenue,
      todayReqRevenue,
      totalAds,
      activeAds,
      pendingMessages
    ] = await Promise.all([
      prisma.link.count({ where: { isActive: true } }),
      prisma.link.count({ where: { isActive: true, status: 'ONLINE' } }),
      prisma.link.count({ where: { isActive: true, status: 'OFFLINE' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.linkSubmission.count({ where: { status: 'PENDING' } }),
      prisma.link.aggregate({ 
        where: { isActive: true },
        _sum: { clickCount: true }
      }),
      // AdOrder stats
      prisma.adOrder.count(),
      prisma.adOrder.count({ where: { status: 'PENDING_PAYMENT' } }),
      prisma.adOrder.count({ where: { status: 'APPROVED' } }),
      prisma.adOrder.aggregate({
        where: { status: 'APPROVED' },
        _sum: { priceAmount: true }
      }),
      prisma.adOrder.aggregate({
        where: { 
          status: 'APPROVED',
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        },
        _sum: { priceAmount: true }
      }),
      // AdOrderRequest stats
      prisma.adOrderRequest.count(),
      prisma.adOrderRequest.count({ where: { status: 'PENDING' } }),
      prisma.adOrderRequest.count({ where: { status: { in: ['APPROVED', 'ACTIVE'] } } }),
      prisma.adOrderRequest.aggregate({
        where: { status: { in: ['APPROVED', 'ACTIVE'] } },
        _sum: { price: true }
      }),
      prisma.adOrderRequest.aggregate({
        where: { 
          status: { in: ['APPROVED', 'ACTIVE'] },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        },
        _sum: { price: true }
      }),
      // Ad stats
      prisma.ad.count(),
      prisma.ad.count({ where: { isActive: true } }),
      // Message stats
      prisma.contactMessage.count({ where: { status: 'PENDING' } })
    ]);

    const combinedTotalOrders = totalOrders + totalOrderRequests;
    const combinedPendingOrders = pendingOrders + pendingOrderRequests;
    const combinedCompletedOrders = completedOrders + completedOrderRequests;
    const combinedTotalRevenue = (Number(totalRevenue._sum?.priceAmount) || 0) + (Number(totalReqRevenue._sum?.price) || 0);
    const combinedTodayRevenue = (Number(todayRevenue._sum?.priceAmount) || 0) + (Number(todayReqRevenue._sum?.price) || 0);

    res.json({
      totalLinks,
      onlineLinks,
      offlineLinks,
      totalUsers,
      pendingSubmissions,
      pendingMessages,
      totalClicks: totalClicks._sum?.clickCount || 0,
      orders: {
        total: combinedTotalOrders,
        pending: combinedPendingOrders,
        completed: combinedCompletedOrders
      },
      revenue: {
        total: combinedTotalRevenue,
        today: combinedTodayRevenue
      },
      ads: {
        total: totalAds,
        active: activeAds
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

// Get admin sidebar counts
router.get('/admin-sidebar', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      categories,
      links,
      announcements,
      faq,
      ads,
      adOrders,
      adPricing,
      orders,
      payments,
      submissions,
      messages,
      users,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.link.count(),
      prisma.announcement.count(),
      prisma.faqItem.count(),
      prisma.ad.count(),
      prisma.adOrderRequest.count(),
      prisma.adPricing.count(),
      prisma.adOrder.count(),
      prisma.payment.count(),
      prisma.linkSubmission.count({ where: { status: 'PENDING' } }),
      prisma.contactMessage.count({ where: { status: 'PENDING' } }),
      prisma.user.count(),
    ]);

    res.json({
      categories,
      links,
      announcements,
      faq,
      ads,
      adOrders,
      adPricing,
      orders,
      payments,
      submissions,
      messages,
      users,
    });
  } catch (error) {
    console.error('Get admin sidebar counts error:', error);
    res.status(500).json({ error: 'Failed to get admin sidebar counts' });
  }
});

// Get sidebar stats (for left sidebar display)
router.get('/sidebar', async (req: Request, res: Response) => {
  try {
    const [
      totalLinks,
      onlineLinks
    ] = await Promise.all([
      prisma.link.count({ where: { isActive: true } }),
      prisma.link.count({ where: { isActive: true, status: 'ONLINE' } })
    ]);

    // Get latest changelog for version
    const latestVersion = await prisma.changelog.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: { version: true, publishedAt: true }
    });

    res.json({
      linkStats: {
        added: 0, // Could track additions
        reported: 0 // Could track reports
      },
      totalStats: {
        online: onlineLinks,
        total: totalLinks
      },
      version: latestVersion?.version || '1.0.0',
      lastUpdate: latestVersion?.publishedAt
    });
  } catch (error) {
    console.error('Get sidebar stats error:', error);
    res.status(500).json({ error: 'Failed to get sidebar stats' });
  }
});

// Get daily stats history (admin)
router.get('/history', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { days = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const stats = await prisma.statsDaily.findMany({
      where: {
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    res.json(stats);
  } catch (error) {
    console.error('Get stats history error:', error);
    res.status(500).json({ error: 'Failed to get stats history' });
  }
});

// Record daily stats (admin only, or called by internal cron)
router.post('/record', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLinks, onlineLinks, offlineLinks, totalUsers] = await Promise.all([
      prisma.link.count({ where: { isActive: true } }),
      prisma.link.count({ where: { isActive: true, status: 'ONLINE' } }),
      prisma.link.count({ where: { isActive: true, status: 'OFFLINE' } }),
      prisma.user.count({ where: { isActive: true } })
    ]);

    await prisma.statsDaily.upsert({
      where: { date: today },
      update: { totalLinks, onlineLinks, offlineLinks, totalUsers },
      create: { date: today, totalLinks, onlineLinks, offlineLinks, totalUsers }
    });

    res.json({ message: 'Stats recorded successfully' });
  } catch (error) {
    console.error('Record stats error:', error);
    res.status(500).json({ error: 'Failed to record stats' });
  }
});

export default router;
