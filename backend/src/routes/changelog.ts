import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all changelog entries (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, limit = '20' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const changelogs = await prisma.changelog.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(changelogs);
  } catch (error) {
    console.error('Get changelogs error:', error);
    res.status(500).json({ error: 'Failed to get changelogs' });
  }
});

// Get latest version (public)
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const changelog = await prisma.changelog.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' }
    });

    if (!changelog) {
      return res.json({ version: '1.0.0' });
    }

    res.json(changelog);
  } catch (error) {
    console.error('Get latest version error:', error);
    res.status(500).json({ error: 'Failed to get latest version' });
  }
});

// Get single changelog
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const changelog = await prisma.changelog.findUnique({
      where: { id: parseInt(id) }
    });

    if (!changelog) {
      return res.status(404).json({ error: 'Changelog not found' });
    }

    res.json(changelog);
  } catch (error) {
    console.error('Get changelog error:', error);
    res.status(500).json({ error: 'Failed to get changelog' });
  }
});

// Create changelog (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { version, title, changes, status } = req.body;

    if (!version || !title || !changes) {
      return res.status(400).json({ error: 'Version, title, and changes are required' });
    }

    const changelog = await prisma.changelog.create({
      data: {
        version,
        title,
        changes,
        status: status || 'COMMITTED',
        publishedAt: status === 'PUBLISHED' ? new Date() : null
      }
    });

    res.status(201).json(changelog);
  } catch (error) {
    console.error('Create changelog error:', error);
    res.status(500).json({ error: 'Failed to create changelog' });
  }
});

// Update changelog (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    // If status is being changed to PUBLISHED, set publishedAt
    if (data.status === 'PUBLISHED') {
      data.publishedAt = new Date();
    }

    const changelog = await prisma.changelog.update({
      where: { id: parseInt(id) },
      data
    });

    res.json(changelog);
  } catch (error: any) {
    console.error('Update changelog error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Changelog not found' });
    }
    res.status(500).json({ error: 'Failed to update changelog' });
  }
});

// Delete changelog (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.changelog.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Changelog deleted successfully' });
  } catch (error: any) {
    console.error('Delete changelog error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Changelog not found' });
    }
    res.status(500).json({ error: 'Failed to delete changelog' });
  }
});

export default router;
