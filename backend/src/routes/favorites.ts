import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user's favorites
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: {
        link: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(favorites.map(f => ({ ...(f as any).link, favoritedAt: f.createdAt })));
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// Add to favorites
router.post('/:linkId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const linkId = req.params.linkId as string;

    // Check if link exists
    const link = await prisma.link.findUnique({
      where: { id: parseInt(linkId) }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_linkId: {
          userId: req.user!.id,
          linkId: parseInt(linkId)
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already in favorites' });
    }

    await prisma.favorite.create({
      data: {
        userId: req.user!.id,
        linkId: parseInt(linkId)
      }
    });

    res.status(201).json({ message: 'Added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove from favorites
router.delete('/:linkId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const linkId = req.params.linkId as string;

    await prisma.favorite.delete({
      where: {
        userId_linkId: {
          userId: req.user!.id,
          linkId: parseInt(linkId)
        }
      }
    });

    res.json({ message: 'Removed from favorites' });
  } catch (error: any) {
    console.error('Remove favorite error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Not in favorites' });
    }
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Check if link is favorited
router.get('/check/:linkId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const linkId = req.params.linkId as string;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_linkId: {
          userId: req.user!.id,
          linkId: parseInt(linkId)
        }
      }
    });

    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
});

export default router;
