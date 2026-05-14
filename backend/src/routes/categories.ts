import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all categories (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;

    const where: any = {};
    
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        children: {
          where: includeInactive !== 'true' ? { isActive: true } : {},
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
          include: {
            _count: { select: { links: true } }
          }
        },
        _count: {
          select: { links: true }
        }
      }
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get navigation categories (for navbar tabs)
router.get('/navigation', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { 
        isActive: true,
        showInNav: true,
        parentId: null  // Only top-level categories in nav
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        showInNav: true,
        displayMode: true,
        children: {
          where: { isActive: true },
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            countryCode: true,
          }
        }
      }
    });

    res.json(categories);
  } catch (error) {
    console.error('Get navigation categories error:', error);
    res.status(500).json({ error: 'Failed to get navigation categories' });
  }
});

// Get single category by slug (public) - includes links grouped by country
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    // Skip if slug looks like a number (let /id/:id handle it)
    if (/^\d+$/.test(slug)) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        links: {
          where: { isActive: true },
          orderBy: [
            { isPinned: 'desc' },
            { countryName: 'asc' },
            { order: 'asc' }
          ],
          include: {
            _count: { select: { favorites: true } }
          }
        },
        _count: {
          select: { links: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// Get category by ID (admin)
router.get('/id/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { links: true } }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// Create category (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, icon, description, order, showInNav, showOnParent, parentId, displayMode, countryCode, displayLimit } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        icon,
        description,
        order: order || 0,
        showInNav: showInNav !== false,
        showOnParent: showOnParent === true,
        parentId: parentId || null,
        displayMode: displayMode || 'SUBCATEGORY',
        countryCode: countryCode || null,
        displayLimit: displayLimit ? parseInt(displayLimit) : null
      }
    });

    res.status(201).json(category);
  } catch (error: any) {
    console.error('Create category error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const data = req.body;

    const category = await prisma.category.update({
      where: { id },
      data
    });

    res.json(category);
  } catch (error: any) {
    console.error('Update category error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Delete category error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Reorder categories (admin only)
router.post('/reorder', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { orders } = req.body;

    await prisma.$transaction(
      orders.map((item: { id: number; order: number }) =>
        prisma.category.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

export default router;
