import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Initial admin account
  const adminPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'change-me-on-first-login', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Top-level categories – generic web directory layout
  const catDev = await prisma.category.upsert({
    where: { slug: 'developer-tools' },
    update: {},
    create: {
      name: 'Developer Tools',
      slug: 'developer-tools',
      icon: 'FiCode',
      description: 'IDEs, CLIs, frameworks and APIs',
      order: 0,
      showInNav: true,
      isActive: true,
    },
  });

  const catDesign = await prisma.category.upsert({
    where: { slug: 'design' },
    update: {},
    create: {
      name: 'Design',
      slug: 'design',
      icon: 'FiLayers',
      description: 'Icons, fonts, color palettes and UI kits',
      order: 1,
      showInNav: true,
      isActive: true,
    },
  });

  const catNews = await prisma.category.upsert({
    where: { slug: 'news' },
    update: {},
    create: {
      name: 'News & Blogs',
      slug: 'news',
      icon: 'FiBookOpen',
      description: 'Reading lists and aggregators',
      order: 2,
      showInNav: true,
      isActive: true,
    },
  });

  // A few sample links so the homepage isn't empty after the first install.
  // Replace / extend through the admin panel.
  const links = [
    {
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      description: 'Comprehensive documentation for web standards.',
      categoryId: catDev.id,
      countryCode: 'GLOBAL',
      countryName: 'Global',
      isPinned: true,
      status: 'ONLINE' as any,
    },
    {
      title: 'GitHub',
      url: 'https://github.com',
      description: 'Source code hosting and collaboration platform.',
      categoryId: catDev.id,
      countryCode: 'US',
      countryName: 'USA',
      isPinned: false,
      status: 'ONLINE' as any,
    },
    {
      title: 'Dribbble',
      url: 'https://dribbble.com',
      description: 'Design community to showcase and discover work.',
      categoryId: catDesign.id,
      countryCode: 'US',
      countryName: 'USA',
      isPinned: false,
      status: 'ONLINE' as any,
    },
  ];

  for (const linkData of links) {
    await prisma.link.create({
      data: linkData,
    });
  }

  const settings = [
    { key: 'site_name', value: 'LinkHub', category: 'general' },
    { key: 'site_title', value: 'Curated Link Directory', category: 'general' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma['$disconnect']();
  });
