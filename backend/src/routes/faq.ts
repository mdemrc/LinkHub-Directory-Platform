import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all FAQ items (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, activeOnly } = req.query;

    const where: any = {};
    
    if (activeOnly === 'true') {
      where.isActive = true;
    }
    
    if (category) {
      where.category = category;
    }

    const faqs = await prisma.faqItem.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { order: 'asc' },
        { id: 'asc' }
      ]
    });

    res.json(faqs);
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ error: 'Failed to get FAQs' });
  }
});

// Get FAQ categories (public)
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.faqItem.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true }
    });

    const result = categories
      .filter(c => c.category)
      .map(c => ({
        name: c.category,
        count: c._count.id
      }));

    res.json(result);
  } catch (error) {
    console.error('Get FAQ categories error:', error);
    res.status(500).json({ error: 'Failed to get FAQ categories' });
  }
});

// Get single FAQ item
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    const faq = await prisma.faqItem.findUnique({
      where: { id }
    });

    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json(faq);
  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({ error: 'Failed to get FAQ' });
  }
});

// Create FAQ item (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer, category, order, isActive } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const faq = await prisma.faqItem.create({
      data: {
        question,
        answer,
        category: category || null,
        order: order || 0,
        isActive: isActive !== false
      }
    });

    res.status(201).json(faq);
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// Update FAQ item (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { question, answer, category, order, isActive } = req.body;

    const faq = await prisma.faqItem.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(category !== undefined && { category }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(faq);
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// Reorder FAQ items (admin only)
router.post('/reorder', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body; // Array of { id, order }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    await prisma.$transaction(
      items.map((item: { id: number; order: number }) =>
        prisma.faqItem.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Reorder FAQs error:', error);
    res.status(500).json({ error: 'Failed to reorder FAQs' });
  }
});

// Delete FAQ item (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);

    await prisma.faqItem.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

export default router;
