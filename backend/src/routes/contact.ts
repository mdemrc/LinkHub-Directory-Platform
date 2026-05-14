import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all contact info items (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, activeOnly } = req.query;

    const where: any = {};
    
    if (activeOnly === 'true') {
      where.isActive = true;
    }
    
    if (type) {
      where.type = type;
    }

    const contacts = await prisma.contactInfo.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { id: 'asc' }
      ]
    });

    res.json(contacts);
  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({ error: 'Failed to get contact info' });
  }
});

// Get contact info by type (public)
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as string;

    const contacts = await prisma.contactInfo.findMany({
      where: { 
        type,
        isActive: true 
      },
      orderBy: { order: 'asc' }
    });

    res.json(contacts);
  } catch (error) {
    console.error('Get contact info by type error:', error);
    res.status(500).json({ error: 'Failed to get contact info' });
  }
});

// Get single contact info item
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    const contact = await prisma.contactInfo.findUnique({
      where: { id }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact info not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({ error: 'Failed to get contact info' });
  }
});

// Create contact info (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { type, label, value, extra, order, isActive } = req.body;

    if (!type || !label || !value) {
      return res.status(400).json({ error: 'Type, label, and value are required' });
    }

    const contact = await prisma.contactInfo.create({
      data: {
        type,
        label,
        value,
        extra: extra || null,
        order: order || 0,
        isActive: isActive !== false
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact info error:', error);
    res.status(500).json({ error: 'Failed to create contact info' });
  }
});

// Update contact info (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { type, label, value, extra, order, isActive } = req.body;

    const contact = await prisma.contactInfo.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(label !== undefined && { label }),
        ...(value !== undefined && { value }),
        ...(extra !== undefined && { extra }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(contact);
  } catch (error) {
    console.error('Update contact info error:', error);
    res.status(500).json({ error: 'Failed to update contact info' });
  }
});

// Reorder contact info items (admin only)
router.post('/reorder', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body; // Array of { id, order }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    await prisma.$transaction(
      items.map((item: { id: number; order: number }) =>
        prisma.contactInfo.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Reorder contact info error:', error);
    res.status(500).json({ error: 'Failed to reorder contact info' });
  }
});

// Delete contact info (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    await prisma.contactInfo.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact info error:', error);
    res.status(500).json({ error: 'Failed to delete contact info' });
  }
});

export default router;
