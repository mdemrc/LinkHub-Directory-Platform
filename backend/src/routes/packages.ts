import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all packages (public - for pricing page)
router.get('/', async (req: Request, res: Response) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    res.json(packages);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Failed to get packages' });
  }
});

// Get all packages including inactive (admin)
router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { order: 'asc' }
    });

    res.json(packages);
  } catch (error) {
    console.error('Get all packages error:', error);
    res.status(500).json({ error: 'Failed to get packages' });
  }
});

// Get single package by slug (public)
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const pkg = await prisma.package.findUnique({
      where: { slug }
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json(pkg);
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({ error: 'Failed to get package' });
  }
});

// Create package (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    if (!data.name || !data.slug || !data.features || !data.prices) {
      return res.status(400).json({ error: 'Name, slug, features, and prices are required' });
    }

    const pkg = await prisma.package.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
        icon: data.icon,
        size: data.size,
        description: data.description,
        subtitle: data.subtitle,
        features: data.features,
        prices: data.prices,
        maxSlots: data.maxSlots,
        order: data.order || 0,
        isActive: data.isActive !== false
      }
    });

    res.status(201).json(pkg);
  } catch (error: any) {
    console.error('Create package error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Package with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// Update package (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const pkg = await prisma.package.update({
      where: { id: parseInt(id) },
      data
    });

    res.json(pkg);
  } catch (error: any) {
    console.error('Update package error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// Delete package (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.package.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Package deleted successfully' });
  } catch (error: any) {
    console.error('Delete package error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

export default router;
