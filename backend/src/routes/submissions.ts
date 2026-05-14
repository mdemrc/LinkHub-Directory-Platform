import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';
import { checkSingleLink } from '../services/siteChecker';
import { isValidUrl, isValidEmail } from '../lib/sanitize';
import { verifyCaptcha } from '../lib/captcha';
import { notifyNewLinkSubmission } from '../lib/telegramNotify';

const router = Router();

// Submit new link (public with captcha, or authenticated)
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    if (!data.title || !data.url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    if (!isValidUrl(data.url)) {
      return res.status(400).json({ error: 'Invalid URL format. Only http/https/ftp URLs are allowed.' });
    }

    const captchaResult = await verifyCaptcha(data.captchaToken, req.ip);
    if (!captchaResult.success) {
      return res.status(400).json({ error: captchaResult.error || 'CAPTCHA verification failed' });
    }

    const submission = await prisma.linkSubmission.create({
      data: {
        title: data.title,
        url: data.url,
        mirrorUrl: data.mirrorUrl || null,
        altUrl: data.altUrl || null,
        description: data.description || null,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        countryCode: data.countryCode || null,
        contactEmail: data.contactEmail || null,
        userId: req.user?.id || null,
        submitterIp: req.ip
      }
    });

    res.status(201).json({
      message: 'Link submitted successfully. It will be reviewed by our team.',
      submission: {
        id: submission.id,
        status: submission.status
      }
    });

    // Fetch category name with parent for notification
    let categoryName: string | null = null;
    if (submission.categoryId) {
      const cat = await prisma.category.findUnique({ 
        where: { id: submission.categoryId }, 
        select: { name: true, parent: { select: { name: true } } } 
      });
      if (cat) {
        categoryName = cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name;
      }
    }

    notifyNewLinkSubmission({
      title: data.title,
      url: data.url,
      mirrorUrl: data.mirrorUrl || null,
      altUrl: data.altUrl || null,
      description: data.description || null,
      category: categoryName,
      countryCode: data.countryCode || null,
      contact: data.contactEmail || null,
    }).catch(() => {});
  } catch (error) {
    console.error('Submit link error:', error);
    res.status(500).json({ error: 'Failed to submit link' });
  }
});

// Get user's submissions (authenticated)
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await prisma.linkSubmission.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Get all submissions (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [submissions, total] = await Promise.all([
      prisma.linkSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          user: {
            select: { id: true, username: true, email: true }
          }
        }
      }),
      prisma.linkSubmission.count({ where })
    ]);

    res.json({ submissions, total });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Approve submission (admin only)
router.post('/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { categoryId, note } = req.body;

    const submission = await prisma.linkSubmission.findUnique({
      where: { id: parseInt(id) }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (!categoryId && !submission.categoryId) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Create the link
    const link = await prisma.link.create({
      data: {
        title: submission.title,
        url: submission.url,
        mirrorUrl: submission.mirrorUrl,
        altUrl: submission.altUrl,
        description: submission.description,
        categoryId: categoryId || submission.categoryId!
      }
    });

    // Update submission status
    await prisma.linkSubmission.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        adminNote: note,
        reviewedAt: new Date(),
        reviewedBy: req.user!.id
      }
    });

    res.json({
      message: 'Submission approved and link created',
      link
    });

    // Auto-check link status in the background (non-blocking)
    if (link.url) {
      checkSingleLink(link.id).catch(err =>
        console.error(`Auto-check failed for link ${link.id}:`, err)
      );
    }
  } catch (error) {
    console.error('Approve submission error:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

// Reject submission (admin only)
router.post('/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { note } = req.body;

    await prisma.linkSubmission.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        adminNote: note,
        reviewedAt: new Date(),
        reviewedBy: req.user!.id
      }
    });

    res.json({ message: 'Submission rejected' });
  } catch (error: any) {
    console.error('Reject submission error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.status(500).json({ error: 'Failed to reject submission' });
  }
});

// Delete submission (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.linkSubmission.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Submission deleted successfully' });
  } catch (error: any) {
    console.error('Delete submission error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

export default router;
