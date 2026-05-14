import * as cron from 'node-cron';
import axios from 'axios';
import https from 'https';
import prisma from '../lib/prisma';

interface CheckResult {
  id: number;
  status: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  responseTime: number | null;
}

// Store the current cron job so we can restart it when interval changes
let currentCronJob: cron.ScheduledTask | null = null;
let isChecking = false;

// User agents for rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

// HTTPS agent that tolerates self-signed/expired certificates
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Check a single URL with multiple methods
async function checkUrl(url: string, timeout: number): Promise<{ isOnline: boolean; responseTime: number | null }> {
  const userAgent = getRandomUserAgent();
  
  // Method 1: Try HEAD request first (lightweight)
  try {
    const startTime = Date.now();
    
    const response = await axios.head(url, {
      timeout,
      maxRedirects: 10,
      validateStatus: () => true,
      httpsAgent,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
    });

    const responseTime = Date.now() - startTime;
    const isOnline = response.status < 500;
    return { isOnline, responseTime };
  } catch (headError: any) {
    // HEAD failed — some servers block HEAD, try GET
  }
  
  // Method 2: Try GET request with response stream (avoid body size issues)
  try {
    const startTime = Date.now();
    
    const response = await axios.get(url, {
      timeout,
      maxRedirects: 10,
      validateStatus: () => true,
      httpsAgent,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      // Use stream to avoid downloading full body
      responseType: 'stream',
    });

    const responseTime = Date.now() - startTime;
    const isOnline = response.status < 500;
    
    // Destroy the stream immediately — we only need the status code
    if (response.data && typeof response.data.destroy === 'function') {
      response.data.destroy();
    }

    return { isOnline, responseTime };
  } catch (error: any) {
    // Check if we got a response at all (site is responding, just erroring)
    if (error.response && error.response.status) {
      return { isOnline: error.response.status < 500, responseTime: null };
    }
    
    // DNS failures = truly offline
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ENETUNREACH') {
      return { isOnline: false, responseTime: null };
    }
    
    // Timeout — try once more with doubled timeout
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      try {
        const startTime = Date.now();
        const response = await axios.head(url, {
          timeout: timeout * 2,
          maxRedirects: 5,
          validateStatus: () => true,
          httpsAgent,
          headers: { 'User-Agent': userAgent },
        });
        const responseTime = Date.now() - startTime;
        return { isOnline: response.status < 500, responseTime };
      } catch {
        return { isOnline: false, responseTime: null };
      }
    }
    
    return { isOnline: false, responseTime: null };
  }
}

// Check all active links
async function checkAllLinks(): Promise<void> {
  if (isChecking) {
    return;
  }

  isChecking = true;
  
  try {
    // Get check settings
    const timeoutSetting = await prisma.setting.findUnique({
      where: { key: 'site_check_timeout' }
    });
    const timeout = parseInt(String(timeoutSetting?.value)) || 10000;

    // Mark mirror-only / placeholder links as ONLINE without HTTP check
    await prisma.link.updateMany({
      where: {
        isActive: true,
        OR: [
          { url: { contains: '/mirror' } },
          { url: { contains: '/alt' } },
          { url: { equals: '' }, mirrorUrl: { not: null } },
          { hasMirror: true },
          { isPermanentOnline: true },
        ]
      },
      data: {
        status: 'ONLINE',
        lastChecked: new Date()
      }
    });

    // Get all active links that need checking (skip directory, Mirror-only, and permanent online)
    const links = await prisma.link.findMany({
      where: {
        isActive: true,
        url: { not: '' },
        hasMirror: false,
        isPermanentOnline: false,
        NOT: [
          { url: { contains: '/mirror' } },
          { url: { contains: '/alt' } }
        ]
      },
      select: { id: true, url: true, title: true }
    });

    const results: CheckResult[] = [];
    const batchSize = 5; // Check 5 links concurrently to avoid overwhelming

    // Process in batches
    for (let i = 0; i < links.length; i += batchSize) {
      const batch = links.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (link) => {
          try {
            const { isOnline, responseTime } = await checkUrl(link.url, timeout);
            return {
              id: link.id,
              status: isOnline ? 'ONLINE' : 'OFFLINE',
              responseTime
            } as CheckResult;
          } catch (err) {
            return {
              id: link.id,
              status: 'UNKNOWN',
              responseTime: null
            } as CheckResult;
          }
        })
      );

      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < links.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update database in batch
    const now = new Date();
    
    await prisma.$transaction(
      results.map(result =>
        prisma.link.update({
          where: { id: result.id },
          data: {
            status: result.status,
            responseTime: result.responseTime,
            lastChecked: now
          }
        })
      )
    );



    // Update last check setting
    await prisma.setting.upsert({
      where: { key: 'last_site_check' },
      update: { value: now.toISOString() },
      create: { key: 'last_site_check', value: now.toISOString(), category: 'system' }
    });

  } catch (error) {
    // Silent error handling
  } finally {
    isChecking = false;
  }
}

// Get check interval from database
async function getCheckInterval(): Promise<number> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'site_check_interval' }
    });
    return parseInt(String(setting?.value)) || 30; // Default 30 minutes
  } catch {
    return 30;
  }
}

// Start the site checker service
export async function startSiteChecker(): Promise<void> {
  const intervalMinutes = await getCheckInterval();

  // Run initial check immediately on server start
  checkAllLinks();

  // Schedule regular checks
  scheduleCronJob(intervalMinutes);
}

// Schedule or reschedule the cron job
function scheduleCronJob(intervalMinutes: number): void {
  // Stop existing cron job if any
  if (currentCronJob) {
    currentCronJob.stop();
    currentCronJob = null;
  }

  // Create new cron expression
  const cronExpression = `*/${intervalMinutes} * * * *`;
  
  currentCronJob = cron.schedule(cronExpression, () => {
    checkAllLinks();
  });
}

// Update check interval (called from admin settings)
export async function updateCheckInterval(minutes: number): Promise<void> {
  // Update setting in database
  await prisma.setting.upsert({
    where: { key: 'site_check_interval' },
    update: { value: String(minutes) },
    create: { 
      key: 'site_check_interval', 
      value: String(minutes), 
      category: 'site_checker',
      description: 'Interval in minutes between site status checks'
    }
  });

  // Reschedule cron job
  scheduleCronJob(minutes);
}

// Manual check trigger (for admin)
export async function triggerManualCheck(): Promise<{ message: string }> {
  if (isChecking) {
    return { message: 'Check already in progress' };
  }
  
  // Run check in background
  checkAllLinks();
  return { message: 'Site check started' };
}

// Check single link
export async function checkSingleLink(linkId: number): Promise<CheckResult | null> {
  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { id: true, url: true, mirrorUrl: true, hasMirror: true, isPermanentOnline: true }
    });

    if (!link) return null;

    // If URL is a mirror placeholder, hasMirror flag, or permanent online, mark as ONLINE
    const isMirrorPlaceholder = link.url && (link.url.includes('/mirror') || link.url.includes('/alt'));
    const hasMirrorOnly = !link.url && link.mirrorUrl;

    if (isMirrorPlaceholder || hasMirrorOnly || link.hasMirror || link.isPermanentOnline) {
      await prisma.link.update({
        where: { id: linkId },
        data: {
          status: 'ONLINE',
          responseTime: null,
          lastChecked: new Date()
        }
      });
      return { id: linkId, status: 'ONLINE', responseTime: null };
    }

    const timeoutSetting = await prisma.setting.findUnique({
      where: { key: 'site_check_timeout' }
    });
    const timeout = (timeoutSetting?.value as number) || 10000;

    const { isOnline, responseTime } = await checkUrl(link.url, timeout);
    const status = isOnline ? 'ONLINE' : 'OFFLINE';

    await prisma.link.update({
      where: { id: linkId },
      data: {
        status,
        responseTime,
        lastChecked: new Date()
      }
    });

    return { id: linkId, status, responseTime };
  } catch (error) {
    console.error(`Error checking link ${linkId}:`, error);
    return null;
  }
}
