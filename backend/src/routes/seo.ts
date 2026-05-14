import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:58742`;

    const [categories, pages, scamReports] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        select: { slug: true, updatedAt: true },
        orderBy: { order: 'asc' },
      }),
      prisma.page.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.scamReport.findMany({
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      }),
    ]);

    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${frontendUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${now}</lastmod>
  </url>
  <url>
    <loc>${frontendUrl}/pricing</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${frontendUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${frontendUrl}/faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${frontendUrl}/scam</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    ${scamReports[0] ? `<lastmod>${scamReports[0].updatedAt.toISOString()}</lastmod>` : ''}
  </url>
  <url>
    <loc>${frontendUrl}/changelog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${frontendUrl}/submit</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${frontendUrl}/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${frontendUrl}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`;

    for (const cat of categories) {
      xml += `
  <url>
    <loc>${frontendUrl}/category/${cat.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${cat.updatedAt.toISOString()}</lastmod>
  </url>`;
    }

    for (const page of pages) {
      xml += `
  <url>
    <loc>${frontendUrl}/page/${page.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
    <lastmod>${page.updatedAt.toISOString()}</lastmod>
  </url>`;
    }

    xml += `
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

router.get('/robots.txt', async (req: Request, res: Response) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:58742`;
    const apiUrl = `${req.protocol}://${req.get('host')}`;

    const customRobots = await prisma.setting.findUnique({
      where: { key: 'robots_txt' },
    });

    if (customRobots?.value && typeof customRobots.value === 'string' && customRobots.value.trim()) {
      res.set('Content-Type', 'text/plain');
      res.send(customRobots.value);
      return;
    }

    const robotsTxt = `User-agent: *
Allow: /
Disallow: /toptip
Disallow: /checkout
Disallow: /payment
Disallow: /profile
Disallow: /favorites
Disallow: /api/

Sitemap: ${apiUrl}/sitemap.xml
`;

    res.set('Content-Type', 'text/plain');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(robotsTxt);
  } catch (error) {
    console.error('Robots.txt generation error:', error);
    res.set('Content-Type', 'text/plain');
    res.send('User-agent: *\nAllow: /\n');
  }
});

export default router;
