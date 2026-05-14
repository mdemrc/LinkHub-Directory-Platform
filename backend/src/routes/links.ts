import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { checkSingleLink } from '../services/siteChecker';
import { isValidUrl, sanitizeCss, sanitizeHtml } from '../lib/sanitize';

// Helper function to check URL status (similar to siteChecker service)
async function checkUrlStatus(url: string): Promise<{ status: 'ONLINE' | 'OFFLINE' | 'UNKNOWN', responseTime: number | null, message?: string }> {
  try {
    // Mirror/alt URLs are placeholder fields kept for backwards compatibility
    const urlObj = new URL(url);
    if (urlObj.hostname.endsWith('/mirror')) {
      return { status: 'UNKNOWN', responseTime: null, message: 'Cannot check mirror URLs from public' };
    }
    if (urlObj.hostname.endsWith('/alt')) {
      return { status: 'UNKNOWN', responseTime: null, message: 'Mirror URL — auto-check skipped' };
    }

    const startTime = Date.now();
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      maxContentLength: 1024 * 50,
    });
    const responseTime = Date.now() - startTime;
    return { 
      status: response.status < 500 ? 'ONLINE' : 'OFFLINE', 
      responseTime 
    };
  } catch (error: any) {
    // Distinguish timeout from other errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return { status: 'OFFLINE', responseTime: null, message: 'Connection timed out' };
    }
    if (error.code === 'ENOTFOUND') {
      return { status: 'OFFLINE', responseTime: null, message: 'Domain not found' };
    }
    return { status: 'OFFLINE', responseTime: null, message: error.message || 'Connection failed' };
  }
}

const router = Router();

// Check URL status (admin only)
router.post('/check-status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await checkUrlStatus(url);
    res.json(result);
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Get all links (public, with filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      categoryId, 
      categorySlug,
      countryCode,
      status, 
      search, 
      isScam,
      isPinned,
      limit = '50',
      offset = '0'
    } = req.query;

    const where: any = { isActive: true };

    if (categoryId) {
      where.categoryId = parseInt(categoryId as string);
    }

    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug as string }
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    if (countryCode) {
      where.countryCode = countryCode;
    }

    if (status) {
      where.status = status;
    }

    if (isScam === 'true') {
      where.isScam = true;
    } else if (isScam === 'false') {
      where.isScam = false;
    }

    if (isPinned === 'true') {
      where.isPinned = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
        { url: { contains: search as string } }
      ];
    }

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { countryName: 'asc' },
          { title: 'asc' },
          { createdAt: 'desc' }
        ],
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          _count: {
            select: { favorites: true }
          }
        }
      }),
      prisma.link.count({ where })
    ]);

    res.json({
      links,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ error: 'Failed to get links' });
  }
});

// Get links by category slug (public) - grouped by country
router.get('/by-category/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const category = await prisma.category.findUnique({
      where: { slug }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const links = await prisma.link.findMany({
      where: { 
        categoryId: category.id,
        isActive: true
      },
      orderBy: [
        { isPinned: 'desc' },
        { countryName: 'asc' },
        { title: 'asc' }
      ],
      include: {
        _count: { select: { favorites: true } }
      }
    });

    // Group links by country
    const grouped: Record<string, { countryCode: string; countryName: string; links: typeof links }> = {};
    
    for (const link of links) {
      const key = link.countryCode || 'GLOBAL';
      if (!grouped[key]) {
        grouped[key] = {
          countryCode: link.countryCode || 'GLOBAL',
          countryName: link.countryName || 'Global',
          links: []
        };
      }
      grouped[key].links.push(link);
    }

    // Sort country groups by child category order (if subcategories with countryCode exist)
    let countries = Object.values(grouped);
    const childCategories = await prisma.category.findMany({
      where: { parentId: category.id, countryCode: { not: null } },
      orderBy: { order: 'asc' },
      select: { countryCode: true, order: true }
    });

    if (childCategories.length > 0) {
      const orderMap = new Map(childCategories.map(c => [c.countryCode, c.order]));
      countries.sort((a, b) => {
        const orderA = orderMap.get(a.countryCode) ?? 99999;
        const orderB = orderMap.get(b.countryCode) ?? 99999;
        if (orderA !== orderB) return orderA - orderB;
        return a.countryName.localeCompare(b.countryName);
      });
    }

    res.json({
      category,
      displayLimit: (category as any).displayLimit || null,
      countries
    });
  } catch (error) {
    console.error('Get links by category error:', error);
    res.status(500).json({ error: 'Failed to get links' });
  }
});

// Get links organized by subcategories of a parent category (public)
router.get('/by-parent/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ order: 'asc' }, { name: 'asc' }]
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // If category has children, group links by subcategory
    // If no children, treat the category itself as the only group
    const targetCategories = category.children && category.children.length > 0
      ? category.children
      : [category];

    const subcategories = await Promise.all(
      targetCategories.map(async (subcat) => {
        const links = await prisma.link.findMany({
          where: { categoryId: subcat.id, isActive: true },
          orderBy: [
            { isPinned: 'desc' },
            { title: 'asc' }
          ],
          include: {
            _count: { select: { favorites: true } }
          }
        });
        return {
          id: subcat.id,
          name: subcat.name,
          slug: subcat.slug,
          icon: (subcat as any).icon || null,
          countryCode: (subcat as any).countryCode || null,
          showOnParent: (subcat as any).showOnParent || false,
          displayLimit: (subcat as any).displayLimit || null,
          links
        };
      })
    );

    res.json({
      category,
      subcategories
    });
  } catch (error) {
    console.error('Get links by parent category error:', error);
    res.status(500).json({ error: 'Failed to get links' });
  }
});

// Search links (public)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '20' } = req.query;

    if (!q) {
      return res.json([]);
    }

    const links = await prisma.link.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: q as string } },
          { description: { contains: q as string } },
          { url: { contains: q as string } }
        ]
      },
      orderBy: [
        { isPinned: 'desc' },
        { clickCount: 'desc' }
      ],
      take: parseInt(limit as string),
      include: {
        category: {
          select: { 
            id: true, 
            name: true, 
            slug: true
          }
        }
      }
    });

    res.json(links);
  } catch (error) {
    console.error('Search links error:', error);
    res.status(500).json({ error: 'Failed to search links' });
  }
});

// Get single link (public)
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const link = await prisma.link.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { favorites: true }
        }
      }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Check if user has favorited
    let isFavorited = false;
    if (req.user) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_linkId: {
            userId: req.user.id,
            linkId: link.id
          }
        }
      });
      isFavorited = !!favorite;
    }

    res.json({ ...link, isFavorited });
  } catch (error) {
    console.error('Get link error:', error);
    res.status(500).json({ error: 'Failed to get link' });
  }
});

// Track link click (public)
router.post('/:id/click', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.link.update({
      where: { id: parseInt(id) },
      data: { clickCount: { increment: 1 } }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Create link (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    if (!data.title && !data.url) {
      return res.status(400).json({ error: 'At least title or URL is required' });
    }

    // Check for duplicate URL (only when URL is non-empty)
    const urlValue = data.url?.trim() || '';
    if (urlValue && !isValidUrl(urlValue)) {
      return res.status(400).json({ error: 'Invalid URL format. Only http/https/ftp URLs are allowed.' });
    }
    if (urlValue) {
      const existing = await prisma.link.findFirst({ where: { url: urlValue } });
      if (existing) {
        return res.status(400).json({ error: 'A link with this URL already exists' });
      }
    }

    // Determine initial status: Mirror/mirror links always start as ONLINE
    const hasMirrorUrl = urlValue && (urlValue.includes('/mirror') || urlValue.includes('/alt'));
    const hasMirrorOnly = !urlValue && data.mirrorUrl;
    const initialStatus = (hasMirrorUrl || hasMirrorOnly) ? 'ONLINE' : (data.status || 'ONLINE');

    const link = await prisma.link.create({
      data: {
        title: data.title || 'Untitled',
        url: data.url || '',
        mirrorUrl: data.mirrorUrl,
        altUrl: data.altUrl,
        backupUrl: data.backupUrl,
        description: data.description,
        countryCode: data.countryCode,
        countryName: data.countryName,
        twitterUrl: data.twitterUrl,
        facebookUrl: data.facebookUrl,
        telegramUrl: data.telegramUrl,
        discordUrl: data.discordUrl,
        categoryId: data.categoryId ? parseInt(data.categoryId) : 1,
        status: initialStatus,
        isPinned: data.isPinned || false,
        pinnedColor: data.pinnedColor || null,
        textColor: data.textColor || null,
        customCss: data.customCss ? sanitizeCss(data.customCss) : null,
        isScam: data.isScam || false,
        hasMirror: data.hasMirror || false,
        isHighlighted: data.isHighlighted || false,
        highlightColor: data.highlightColor,
        badges: data.badges,
        order: data.order || 0
      },
      include: {
        category: true
      }
    });

    res.status(201).json(link);

    // Auto-check link status in the background (skip placeholder/mirror links)
    if (link.url && !link.url.includes('/mirror') && !link.url.includes('/alt')) {
      checkSingleLink(link.id).catch(err =>
        console.error(`Auto-check failed for link ${link.id}:`, err)
      );
    }
  } catch (error: any) {
    console.error('Create link error:', error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(400).json({ error: `A link with this ${field} already exists` });
    }
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// Update link (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    if (data.categoryId) {
      data.categoryId = parseInt(data.categoryId);
    }

    // Validate URL if being updated
    if (data.url && !isValidUrl(data.url)) {
      return res.status(400).json({ error: 'Invalid URL format. Only http/https/ftp URLs are allowed.' });
    }

    // Sanitize CSS if being updated
    if (data.customCss) {
      data.customCss = sanitizeCss(data.customCss);
    }

    const link = await prisma.link.update({
      where: { id: parseInt(id) },
      data,
      include: { category: true }
    });

    res.json(link);
  } catch (error: any) {
    console.error('Update link error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.status(500).json({ error: 'Failed to update link' });
  }
});

// Delete link (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.link.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Link deleted successfully' });
  } catch (error: any) {
    console.error('Delete link error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Bulk update link status (admin only)
router.post('/bulk-status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { ids, status, isActive } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    await prisma.link.updateMany({
      where: { id: { in: ids } },
      data: updateData
    });

    res.json({ message: 'Links updated successfully' });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update links' });
  }
});

// Reorder links (admin only)
router.post('/reorder', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { orders } = req.body;

    await prisma.$transaction(
      orders.map((item: { id: number; order: number }) =>
        prisma.link.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    res.json({ message: 'Links reordered successfully' });
  } catch (error) {
    console.error('Reorder links error:', error);
    res.status(500).json({ error: 'Failed to reorder links' });
  }
});

export default router;
