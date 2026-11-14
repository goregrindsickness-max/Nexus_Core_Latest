import express from 'express';

const STATIC_ALLOWED_ORIGINS = new Set([
  'https://thenexuscoreapp.com',
  'https://www.thenexuscoreapp.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
]);

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // Same-origin or server-to-server requests
  if (STATIC_ALLOWED_ORIGINS.has(origin)) return true;

  const envAppUrl = process.env.APP_URL?.replace(/\/+$/, '');
  if (envAppUrl && origin === envAppUrl) return true;

  const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (extraOrigins.includes(origin)) return true;

  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    // Allow AI Studio / Cloud Run preview domains & Nexus Core subdomains over HTTPS
    if (
      parsed.protocol === 'https:' &&
      (host.endsWith('.run.app') ||
        host.endsWith('.googleusercontent.com') ||
        host.endsWith('.thenexuscoreapp.com') ||
        host.endsWith('.aistudio.google.com'))
    ) {
      return true;
    }
  } catch (_) {}

  return false;
}

export function createCorsMiddleware(): express.RequestHandler {
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-supabase-auth, stripe-signature'
      );
    }

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  };
}

/**
 * Resolves a trusted base origin for redirects and links (never trusts arbitrary Origin/Host headers).
 */
export function resolveSafeAppOrigin(req: express.Request): string {
  const configured = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  const reqOrigin = req.headers.origin;
  if (reqOrigin && isOriginAllowed(reqOrigin)) {
    return reqOrigin.replace(/\/+$/, '');
  }
  if (configured && configured.startsWith('http')) {
    return configured;
  }
  return 'https://thenexuscoreapp.com';
}

/**
 * Validates that a custom redirect URL points only to an allowed origin or a relative path.
 */
export function resolveSafeRedirectUrl(
  candidateUrl: string | undefined,
  fallbackOrigin: string,
  defaultPath = '/'
): string {
  const safeBase = fallbackOrigin.replace(/\/+$/, '');
  if (!candidateUrl || typeof candidateUrl !== 'string') {
    return `${safeBase}${defaultPath}`;
  }
  const trimmed = candidateUrl.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return `${safeBase}${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (isOriginAllowed(parsed.origin)) {
      return parsed.toString();
    }
  } catch (_) {}
  return `${safeBase}${defaultPath}`;
}

export function escapeHtml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function isAllowedBandcampUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    // Disallow localhost, IPs, or non-bandcamp domains
    if (host === 'bandcamp.com' || host.endsWith('.bandcamp.com')) {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateLimitBucket>();

// Periodically prune expired buckets
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) {
      rateBuckets.delete(key);
    }
  }
}, 60_000).unref?.();

export interface RateLimitOptions {
  name: string;
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export function createRateLimiter(opts: RateLimitOptions): express.RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const userKey =
      req.authUser?.id ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const bucketKey = `${opts.name}:${userKey}`;

    let bucket = rateBuckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 1, resetAt: now + opts.windowMs };
      rateBuckets.set(bucketKey, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(0, opts.maxRequests - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(opts.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > opts.maxRequests) {
      return res.status(429).json({
        error:
          opts.message ||
          'Too many requests. Please wait a moment before trying again.',
      });
    }
    next();
  };
}

// Shared pre-configured rate limiters across domain routes
export const uploadLimiter = createRateLimiter({ name: 'upload', windowMs: 60_000, maxRequests: 25 });
export const aiLimiter = createRateLimiter({ name: 'ai-gemini', windowMs: 60_000, maxRequests: 20 });
export const emailLimiter = createRateLimiter({ name: 'email-dispatch', windowMs: 60_000, maxRequests: 15 });
export const paymentLimiter = createRateLimiter({ name: 'payments', windowMs: 60_000, maxRequests: 25 });
export const pushLimiter = createRateLimiter({ name: 'push', windowMs: 60_000, maxRequests: 30 });
export const scrapeLimiter = createRateLimiter({ name: 'scrape', windowMs: 60_000, maxRequests: 20 });
export const apiMutationLimiter = createRateLimiter({ name: 'mutation', windowMs: 60_000, maxRequests: 90 });
export const bugReportLimiter = createRateLimiter({ name: 'bug-report', windowMs: 60_000, maxRequests: 15 });
