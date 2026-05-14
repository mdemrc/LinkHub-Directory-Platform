import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { sanitizeHtml } from '../lib/sanitize';

const router = Router();

// Get active announcements (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
});

// Get all announcements (admin)
router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(announcements);
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
});

// Create announcement (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, content, type, showOnPageLoad, showEveryVisit, autoClose,
      autoCloseDuration, allowManualClose, backgroundColor,
      textColor, borderColor, startDate, endDate, priority, isActive,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content: sanitizeHtml(content),
        type: type || 'MODAL',
        showOnPageLoad: showOnPageLoad !== false,
        showEveryVisit: showEveryVisit || false,
        autoClose: autoClose || false,
        autoCloseDuration: autoCloseDuration || 10,
        allowManualClose: allowManualClose !== false,
        backgroundColor,
        textColor,
        borderColor,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || 0,
        isActive: isActive !== false,
      },
    });

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement (admin)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const data = { ...req.body };

    if (data.content) data.content = sanitizeHtml(data.content);
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.startDate === '') data.startDate = null;
    if (data.endDate === '') data.endDate = null;

    const announcement = await prisma.announcement.update({
      where: { id },
      data,
    });

    res.json(announcement);
  } catch (error: any) {
    console.error('Update announcement error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    await prisma.announcement.delete({ where: { id } });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
