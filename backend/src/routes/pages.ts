import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { sanitizeHtml } from '../lib/sanitize';

const router = Router();

// Get all pages (admin)
router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { order: 'asc' }
    });

    res.json(pages);
  } catch (error) {
    console.error('Get all pages error:', error);
    res.status(500).json({ error: 'Failed to get pages' });
  }
});

// Get navigation pages (for menus)
router.get('/navigation', async (req: Request, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      where: { 
        isActive: true,
        menuLocation: { not: null }
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        menuLocation: true,
        menuLabel: true,
        pageType: true,
        order: true
      }
    });

    // Group by menu location
    const grouped = pages.reduce((acc: any, page) => {
      const loc = page.menuLocation!;
      if (!acc[loc]) {
        acc[loc] = [];
      }
      acc[loc].push(page);
      return acc;
    }, {});

    res.json({ pages, grouped });
  } catch (error) {
    console.error('Get navigation pages error:', error);
    res.status(500).json({ error: 'Failed to get navigation pages' });
  }
});

// Get page by slug (public)
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const page = await prisma.page.findUnique({
      where: { slug }
    });

    if (!page || !page.isActive) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ error: 'Failed to get page' });
  }
});

// Create page (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    if (!data.title || !data.slug || !data.content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' });
    }

    const page = await prisma.page.create({
      data: {
        title: data.title,
        slug: data.slug.toLowerCase(),
        content: sanitizeHtml(data.content),
        menuLocation: data.menuLocation,
        menuLabel: data.menuLabel,
        pageType: data.pageType || 'CONTENT',
        order: data.order || 0,
        isActive: data.isActive !== false
      }
    });

    res.status(201).json(page);
  } catch (error: any) {
    console.error('Create page error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Page with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Update page (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    if (data.content) data.content = sanitizeHtml(data.content);

    const page = await prisma.page.update({
      where: { id: parseInt(id) },
      data
    });

    res.json(page);
  } catch (error: any) {
    console.error('Update page error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// Delete page (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.page.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Page deleted successfully' });
  } catch (error: any) {
    console.error('Delete page error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

export default router;
