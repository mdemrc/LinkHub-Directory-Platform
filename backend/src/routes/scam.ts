import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { notifyScamReport } from '../lib/telegramNotify';

const router = Router();

// Get all scam reports (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, verified } = req.query;

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (verified === 'true') {
      where.isVerified = true;
    }

    const scams = await prisma.scamReport.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Group by category
    const grouped = scams.reduce((acc: any, scam) => {
      if (!acc[scam.category]) {
        acc[scam.category] = [];
      }
      acc[scam.category].push(scam);
      return acc;
    }, {});

    res.json({ scams, grouped });
  } catch (error) {
    console.error('Get scam reports error:', error);
    res.status(500).json({ error: 'Failed to get scam reports' });
  }
});

// Get scam categories (public)
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.scamReport.groupBy({
      by: ['category'],
      _count: true
    });

    res.json(categories);
  } catch (error) {
    console.error('Get scam categories error:', error);
    res.status(500).json({ error: 'Failed to get scam categories' });
  }
});

// Create scam report (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { siteName, siteUrl, category, reason, isVerified } = req.body;

    if (!siteName || !category) {
      return res.status(400).json({ error: 'Site name and category are required' });
    }

    const scam = await prisma.scamReport.create({
      data: {
        siteName,
        siteUrl,
        category,
        reason,
        isVerified: isVerified || false
      }
    });

    res.status(201).json(scam);

    notifyScamReport({ siteName, siteUrl: siteUrl || null, category }).catch(() => {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to create scam report' });
  }
});

// Update scam report (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const scam = await prisma.scamReport.update({
      where: { id: parseInt(id) },
      data
    });

    res.json(scam);
  } catch (error: any) {
    console.error('Update scam report error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Scam report not found' });
    }
    res.status(500).json({ error: 'Failed to update scam report' });
  }
});

// Delete scam report (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.scamReport.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Scam report deleted successfully' });
  } catch (error: any) {
    console.error('Delete scam report error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Scam report not found' });
    }
    res.status(500).json({ error: 'Failed to delete scam report' });
  }
});

export default router;
