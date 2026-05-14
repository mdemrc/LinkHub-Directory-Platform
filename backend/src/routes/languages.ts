import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all languages (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;

    const where = activeOnly === 'true' ? { isActive: true } : {};

    const languages = await prisma.language.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(languages);
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Failed to get languages' });
  }
});

// Get translations for a language
router.get('/:code/translations', async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;
    const { category } = req.query;

    const language = await prisma.language.findUnique({
      where: { code }
    });

    if (!language) {
      return res.status(404).json({ error: 'Language not found' });
    }

    const where: any = { languageId: language.id };
    if (category) {
      where.category = category;
    }

    const translations = await prisma.translation.findMany({
      where
    });

    // Convert to key-value object
    const translationsObj = translations.reduce((acc: any, t) => {
      acc[t.key] = t.value;
      return acc;
    }, {});

    res.json(translationsObj);
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({ error: 'Failed to get translations' });
  }
});

// Create language (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, nativeName, flag, isDefault, order } = req.body;

    if (!code || !name || !nativeName) {
      return res.status(400).json({ error: 'Code, name, and nativeName are required' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const language = await prisma.language.create({
      data: {
        code: code.toLowerCase(),
        name,
        nativeName,
        flag,
        isDefault: isDefault || false,
        order: order || 0
      }
    });

    res.status(201).json(language);
  } catch (error: any) {
    console.error('Create language error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Language with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to create language' });
  }
});

// Update language (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true, id: { not: parseInt(id) } },
        data: { isDefault: false }
      });
    }

    const language = await prisma.language.update({
      where: { id: parseInt(id) },
      data
    });

    res.json(language);
  } catch (error: any) {
    console.error('Update language error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Language not found' });
    }
    res.status(500).json({ error: 'Failed to update language' });
  }
});

// Create or update translation (admin only)
router.post('/translations', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { languageCode, key, value, category } = req.body;

    if (!languageCode || !key || !value) {
      return res.status(400).json({ error: 'Language code, key, and value are required' });
    }

    const language = await prisma.language.findUnique({
      where: { code: languageCode }
    });

    if (!language) {
      return res.status(404).json({ error: 'Language not found' });
    }

    const translation = await prisma.translation.upsert({
      where: {
        key_languageId: {
          key,
          languageId: language.id
        }
      },
      update: { value, category },
      create: {
        key,
        value,
        category: category || 'common',
        languageId: language.id
      }
    });

    res.json(translation);
  } catch (error) {
    console.error('Save translation error:', error);
    res.status(500).json({ error: 'Failed to save translation' });
  }
});

// Bulk update translations (admin only)
router.post('/translations/bulk', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { languageCode, translations } = req.body;
    // translations: [{key, value, category?}, ...]

    const language = await prisma.language.findUnique({
      where: { code: languageCode }
    });

    if (!language) {
      return res.status(404).json({ error: 'Language not found' });
    }

    await prisma.$transaction(
      translations.map((t: { key: string; value: string; category?: string }) =>
        prisma.translation.upsert({
          where: {
            key_languageId: {
              key: t.key,
              languageId: language.id
            }
          },
          update: { value: t.value, category: t.category },
          create: {
            key: t.key,
            value: t.value,
            category: t.category || 'common',
            languageId: language.id
          }
        })
      )
    );

    res.json({ message: 'Translations updated successfully' });
  } catch (error) {
    console.error('Bulk update translations error:', error);
    res.status(500).json({ error: 'Failed to update translations' });
  }
});

// Delete translation (admin only)
router.delete('/translations/:languageCode/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const languageCode = req.params.languageCode as string;
    const key = req.params.key as string;

    const language = await prisma.language.findUnique({
      where: { code: languageCode }
    });

    if (!language) {
      return res.status(404).json({ error: 'Language not found' });
    }

    await prisma.translation.delete({
      where: {
        key_languageId: {
          key,
          languageId: language.id
        }
      }
    });

    res.json({ message: 'Translation deleted successfully' });
  } catch (error: any) {
    console.error('Delete translation error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Translation not found' });
    }
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

export default router;
