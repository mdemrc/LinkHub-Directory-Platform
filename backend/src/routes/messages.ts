import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';
import { verifyCaptcha } from '../lib/captcha';

const router = Router();

// Submit new contact message / scam report (public)
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { telegram, categoryId, linkId, message, captchaToken } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const captchaResult = await verifyCaptcha(captchaToken, req.ip);
    if (!captchaResult.success) {
      return res.status(400).json({ error: captchaResult.error || 'CAPTCHA verification failed' });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        telegram,
        categoryId: categoryId ? parseInt(categoryId) : null,
        linkId: linkId ? parseInt(linkId) : null,
        message,
      },
    });

    res.status(201).json({
      message: 'Your report/message has been received. Thank you.',
      id: contactMessage.id
    });
  } catch (error) {
    console.error('Submit message error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Get all messages (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          category: { select: { id: true, name: true } },
          link: { select: { id: true, title: true, url: true } }
        }
      }),
      prisma.contactMessage.count({ where })
    ]);

    res.json({ messages, total });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Update message status / add admin note (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status, adminNote } = req.body;

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        status,
        adminNote
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update message error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete message (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    await prisma.contactMessage.delete({
      where: { id }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Delete message error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
