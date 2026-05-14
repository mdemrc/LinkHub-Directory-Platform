/**
 * Input sanitization utilities for preventing XSS attacks.
 * Sanitizes HTML content, CSS, and URLs.
 */

// Dangerous HTML tags/attributes that can execute scripts
const DANGEROUS_TAGS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const DANGEROUS_EVENT_ATTRS = /\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;
const DANGEROUS_JS_URLS = /(?:href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi;

/**
 * Sanitize HTML content - removes script tags, event handlers, javascript: URLs.
 * Keeps safe HTML structure for admin-authored content (ads, announcements, pages).
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html;
  
  return html
    .replace(DANGEROUS_TAGS, '') // Remove <script> tags
    .replace(DANGEROUS_EVENT_ATTRS, '') // Remove on* event handlers
    .replace(DANGEROUS_JS_URLS, '') // Remove javascript: href/src
    .replace(/<iframe\b[^>]*src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')[^>]*>/gi, '') // iframe js
    .replace(/<embed\b[^>]*src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')[^>]*>/gi, ''); // embed js
}

/**
 * Sanitize CSS content - removes dangerous CSS expressions and imports.
 */
export function sanitizeCss(css: string): string {
  if (!css) return css;
  
  return css
    .replace(/expression\s*\(/gi, '') // IE CSS expressions
    .replace(/-moz-binding\s*:/gi, '') // Firefox XBL binding
    .replace(/javascript\s*:/gi, '') // javascript: in CSS
    .replace(/@import\s+/gi, '') // @import (can load external resources)
    .replace(/behavior\s*:/gi, ''); // behavior property (IE)
}

/**
 * Validate URL - ensures it's a valid http/https URL and not a javascript: or data: URL
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'ftp:'];
    
    // Also allow mirror/alt placeholder domains
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}
