import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import prisma from './lib/prisma';

// Routes
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import linkRoutes from './routes/links';
import adRoutes from './routes/ads';
import adPricingRoutes from './routes/adPricing';
import packageRoutes from './routes/packages';
import changelogRoutes from './routes/changelog';
import scamRoutes from './routes/scam';
import pageRoutes from './routes/pages';
import settingRoutes from './routes/settings';
import statsRoutes from './routes/stats';
import submissionRoutes from './routes/submissions';
import favoriteRoutes from './routes/favorites';
import languageRoutes from './routes/languages';
import faqRoutes from './routes/faq';
import contactRoutes from './routes/contact';
import paymentRoutes from './routes/payments';
import telegramRoutes from './routes/telegram';
import announcementRoutes from './routes/announcements';
import messageRoutes from './routes/messages';
import seoRoutes from './routes/seo';

// Services
import { startSiteChecker } from './services/siteChecker';
import { startPaymentTimeoutChecker, stopPaymentTimeoutChecker } from './services/paymentTimeoutService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 58741;

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:58742',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '10mb' }));

// Global rate limiter: 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});
app.use(globalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/ad-pricing', adPricingRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/changelog', changelogRoutes);
app.use('/api/scam', scamRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);

// SEO routes (sitemap.xml, robots.txt) - served at root level
app.use('/', seoRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    name: 'LinkHub API',
    version: '2.0.0',
    status: 'running'
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start site checker service (enabled by default)
    const siteCheckEnabled = process.env.SITE_CHECK_ENABLED !== 'false';
    if (siteCheckEnabled) {
      startSiteChecker();
      console.log('✅ Site checker service started');
    } else {
      console.log('ℹ️ Site checker service disabled');
    }

    // Start payment timeout checker
    startPaymentTimeoutChecker();
    console.log('✅ Payment timeout checker started');

    app.listen(port, () => {
      console.log(`🚀 Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  stopPaymentTimeoutChecker();
  await prisma.$disconnect();
  process.exit(0);
});
