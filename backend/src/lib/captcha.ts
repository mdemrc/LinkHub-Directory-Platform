/**
 * CAPTCHA Verification Service
 * Supports Cloudflare Turnstile and Google reCAPTCHA v2.
 * Provider and keys are configured via admin settings.
 */

import axios from 'axios';
import prisma from './prisma';

export type CaptchaProvider = 'none' | 'turnstile' | 'recaptcha_v2';

interface CaptchaSettings {
  provider: CaptchaProvider;
  siteKey: string;
  secretKey: string;
  enabled: boolean;
}

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Load CAPTCHA settings from the database.
 */
export async function getCaptchaSettings(): Promise<CaptchaSettings> {
  const keys = ['captcha_provider', 'captcha_site_key', 'captcha_secret_key', 'captcha_enabled'];
  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } }
  });

  const map: Record<string, string> = {};
  settings.forEach(s => { map[s.key] = s.value as string; });

  return {
    provider: (map.captcha_provider as CaptchaProvider) || 'none',
    siteKey: map.captcha_site_key || '',
    secretKey: map.captcha_secret_key || '',
    enabled: map.captcha_enabled === 'true',
  };
}

/**
 * Verify a CAPTCHA token from the client.
 * Returns true if CAPTCHA is disabled or token is valid.
 */
export async function verifyCaptcha(token: string | undefined, remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  const config = await getCaptchaSettings();

  // If CAPTCHA is disabled or provider is none, skip verification
  if (!config.enabled || config.provider === 'none' || !config.secretKey) {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'CAPTCHA verification required' };
  }

  try {
    if (config.provider === 'turnstile') {
      return await verifyTurnstile(token, config.secretKey, remoteIp);
    } else if (config.provider === 'recaptcha_v2') {
      return await verifyRecaptchaV2(token, config.secretKey, remoteIp);
    }

    return { success: false, error: 'Unknown CAPTCHA provider' };
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return { success: false, error: 'CAPTCHA verification failed' };
  }
}

async function verifyTurnstile(token: string, secret: string, remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  const body: Record<string, string> = { secret, response: token };
  if (remoteIp) body.remoteip = remoteIp;

  const { data } = await axios.post(TURNSTILE_VERIFY_URL, new URLSearchParams(body), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000,
  });

  if (data.success) {
    return { success: true };
  }
  return { success: false, error: data['error-codes']?.join(', ') || 'Turnstile verification failed' };
}

async function verifyRecaptchaV2(token: string, secret: string, remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  const params: Record<string, string> = { secret, response: token };
  if (remoteIp) params.remoteip = remoteIp;

  const { data } = await axios.post(RECAPTCHA_VERIFY_URL, new URLSearchParams(params), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000,
  });

  if (data.success) {
    return { success: true };
  }
  return { success: false, error: data['error-codes']?.join(', ') || 'reCAPTCHA verification failed' };
}
