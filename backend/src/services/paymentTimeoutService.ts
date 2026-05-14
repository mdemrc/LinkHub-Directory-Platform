import prisma from '../lib/prisma';

// Payment timeout duration in milliseconds (1 hour)
export const PAYMENT_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
export const PAYMENT_TIMEOUT_MINUTES = 60;

/**
 * Check and expire timed-out payments
 * Should be called periodically (e.g., every minute)
 */
export async function checkExpiredPayments(): Promise<number> {
  try {
    const expireTime = new Date(Date.now() - PAYMENT_TIMEOUT_MS);

    // Find all payments that are still waiting and older than timeout
    const expiredPayments = await prisma.payment.findMany({
      where: {
        status: 'WAITING',
        createdAt: { lt: expireTime }
      },
      include: {
        order: true
      }
    });

    if (expiredPayments.length === 0) {
      return 0;
    }

    // Update each expired payment
    for (const payment of expiredPayments) {
      await prisma.$transaction([
        // Update payment status
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'EXPIRED',
            expiredAt: new Date()
          }
        }),
        // Update associated order if exists
        ...(payment.order ? [
          prisma.adOrder.update({
            where: { id: payment.order.id },
            data: {
              status: 'EXPIRED'
            }
          })
        ] : [])
      ]);

      console.log(`Payment ${payment.id} expired (created at ${payment.createdAt})`);
    }

    console.log(`Expired ${expiredPayments.length} payments`);
    return expiredPayments.length;
  } catch (error) {
    console.error('Check expired payments error:', error);
    return 0;
  }
}

/**
 * Get remaining time for a payment in seconds
 */
export function getPaymentRemainingTime(createdAt: Date): number {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const remaining = PAYMENT_TIMEOUT_MS - elapsed;
  return Math.max(0, Math.floor(remaining / 1000));
}

/**
 * Check if a payment is expired based on creation time
 */
export function isPaymentExpired(createdAt: Date): boolean {
  return getPaymentRemainingTime(createdAt) <= 0;
}

/**
 * Start the payment timeout checker interval
 * Runs every minute
 */
let timeoutInterval: NodeJS.Timeout | null = null;

export function startPaymentTimeoutChecker(): void {
  if (timeoutInterval) {
    console.log('Payment timeout checker already running');
    return;
  }

  // Check immediately on start
  checkExpiredPayments();

  // Then check every minute
  timeoutInterval = setInterval(() => {
    checkExpiredPayments();
  }, 60 * 1000); // Check every minute

  console.log('Payment timeout checker started (checking every minute)');
}

export function stopPaymentTimeoutChecker(): void {
  if (timeoutInterval) {
    clearInterval(timeoutInterval);
    timeoutInterval = null;
    console.log('Payment timeout checker stopped');
  }
}
