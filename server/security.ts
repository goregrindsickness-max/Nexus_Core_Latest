import express from 'express';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://cyjnpuneruonskfzpmqo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5am5wdW5lcnVvbnNrZnpwbXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTA1NjIsImV4cCI6MjA5NTQyNjU2Mn0.94h4Ao-cpLXwU8xxJsKln0iud2wOw746yZlAdFP2gDM';

export interface AuthenticatedUser {
  id: string;
  email: string;
  isAdmin: boolean;
  role?: string;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

const DEFAULT_ADMIN_USER_IDS = new Set<string>([
  '5403162d-1947-43aa-b5f6-38a1bd2a1b80',
]);

const DEFAULT_ADMIN_EMAILS = new Set<string>([
  'goregrindsickness@gmail.com',
  'admin@nexus.com',
  'admin@nexuscore.fm',
]);

function getAdminSets() {
  const ids = new Set<string>(DEFAULT_ADMIN_USER_IDS);
  const emails = new Set<string>(DEFAULT_ADMIN_EMAILS);

  const envIds = (process.env.ADMIN_USER_IDS || '').split(',');
  for (const id of envIds) {
    const clean = id.trim();
    if (clean) ids.add(clean);
  }

  const envEmails = (process.env.ADMIN_EMAILS || '').split(',');
  for (const em of envEmails) {
    const clean = em.trim().toLowerCase();
    if (clean) emails.add(clean);
  }

  return { ids, emails };
}

function getSupabaseAuthClient(): SupabaseClient {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY
  ).trim();

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let cachedAuthClient: SupabaseClient | null = null;
function getAuthClient(): SupabaseClient {
  if (!cachedAuthClient) {
    cachedAuthClient = getSupabaseAuthClient();
  }
  return cachedAuthClient;
}

interface TokenCacheEntry {
  user: AuthenticatedUser;
  expiresAtMs: number;
}

const verifiedTokenCache = new Map<string, TokenCacheEntry>();
const TOKEN_CACHE_MAX_TTL_MS = 30_000;

function extractJwtExpMs(token: string): number {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;
    const payloadJson = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000;
    }
  } catch {
    // ignore decode failure
  }
  return 0;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function extractBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) return null;
  const token = match[1].trim();
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
}

export async function verifySupabaseJwt(token: string): Promise<AuthenticatedUser | null> {
  if (!token) return null;

  const tokenHash = hashToken(token);
  const now = Date.now();
  const cached = verifiedTokenCache.get(tokenHash);
  if (cached && cached.expiresAtMs > now) {
    return cached.user;
  }
  if (cached) {
    verifiedTokenCache.delete(tokenHash);
  }

  try {
    const client = getAuthClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user?.id) {
      return null;
    }

    const supaUser = data.user;
    const userId = String(supaUser.id);
    const email = String(supaUser.email || '').trim().toLowerCase();

    const { ids: adminIds, emails: adminEmails } = getAdminSets();
    let isAdmin =
      adminIds.has(userId) ||
      (email ? adminEmails.has(email) : false) ||
      supaUser.app_metadata?.role === 'admin' ||
      supaUser.app_metadata?.is_admin === true;

    let profileRole: string | undefined =
      typeof supaUser.user_metadata?.role === 'string' ? supaUser.user_metadata.role : undefined;

    if (!isAdmin) {
      try {
        const { data: profile } = await client
          .from('profiles')
          .select('is_admin, role')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          if (profile.is_admin === true || String(profile.role || '').toLowerCase() === 'admin') {
            isAdmin = true;
          }
          if (typeof profile.role === 'string') {
            profileRole = profile.role;
          }
        }
      } catch {
        // profiles lookup optional if table/service role unavailable
      }
    }

    const authUser: AuthenticatedUser = {
      id: userId,
      email,
      isAdmin,
      role: profileRole,
      token,
    };

    const jwtExpMs = extractJwtExpMs(token);
    const cacheExpiry = jwtExpMs > now
      ? Math.min(jwtExpMs, now + TOKEN_CACHE_MAX_TTL_MS)
      : now + 10_000;

    if (verifiedTokenCache.size > 500) {
      for (const [k, v] of verifiedTokenCache.entries()) {
        if (v.expiresAtMs <= now) verifiedTokenCache.delete(k);
      }
      if (verifiedTokenCache.size > 500) {
        verifiedTokenCache.clear();
      }
    }

    verifiedTokenCache.set(tokenHash, {
      user: authUser,
      expiresAtMs: cacheExpiry,
    });

    return authUser;
  } catch (err) {
    console.warn('[SECURITY] JWT verification error:', (err as any)?.message || err);
    return null;
  }
}

export async function optionalAuth(req: express.Request, _res: express.Response, next: express.NextFunction) {
  try {
    const token = extractBearerToken(req);
    if (token) {
      const user = await verifySupabaseJwt(token);
      if (user) {
        req.authUser = user;
      }
    }
  } catch {
    // optionalAuth never blocks
  }
  next();
}

export async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in and retry.' });
    }
    const user = await verifySupabaseJwt(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired authentication session.' });
    }
    req.authUser = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: err?.message || 'Authentication verification failed.' });
  }
}

export async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const user = await verifySupabaseJwt(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired authentication session.' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }
    req.authUser = user;
    next();
  } catch (err: any) {
    return res.status(403).json({ error: err?.message || 'Admin authorization failed.' });
  }
}

// ============================================================
// STRICT CORS ALLOWLIST & SAFE REDIRECT HELPERS
// ============================================================

const BUILT_IN_ALLOWED_ORIGINS = [
  'https://ais-pre-s6jhaejrxpqgkdr7esx5hy-148981064113.us-west2.run.app',
  'https://ais-dev-s6jhaejrxpqgkdr7esx5hy-148981064113.us-west2.run.app',
  'https://thenexuscoreapp.com',
  'https://www.thenexuscoreapp.com',
  'https://nexuscore.fm',
  'https://www.nexuscore.fm',
  'http://localhost:3000',
  'https://localhost:3000',
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://10.0.2.2:3000',
  'http://10.0.2.2:5173',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
];

function normalizeOriginString(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '*' || trimmed.includes('MY_APP_URL')) return null;
  try {
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    if (/^(capacitor|ionic):\/\/localhost$/i.test(trimmed)) {
      return trimmed.toLowerCase();
    }
    return null;
  }
}

export function getAllowedOriginsSet(): Set<string> {
  const allowed = new Set<string>();
  for (const origin of BUILT_IN_ALLOWED_ORIGINS) {
    const norm = normalizeOriginString(origin);
    if (norm) allowed.add(norm);
  }

  const envSources = [
    process.env.APP_URL,
    process.env.VITE_APP_URL,
    process.env.VITE_BACKEND_URL,
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
  ];

  for (const item of envSources) {
    const norm = normalizeOriginString(item);
    if (norm) allowed.add(norm);
  }

  return allowed;
}

export function isOriginAllowed(originHeader: string | undefined, req?: express.Request): boolean {
  if (!originHeader || typeof originHeader !== 'string') return false;
  const normalized = normalizeOriginString(originHeader);
  if (!normalized) return false;

  const allowedSet = getAllowedOriginsSet();
  if (allowedSet.has(normalized)) return true;

  // Match the server's own Host header (Cloud Run revision domains, custom proxy hosts)
  if (req) {
    const host = req.get('x-forwarded-host') || req.get('host');
    if (host) {
      const cleanHost = host.split(',')[0].trim().toLowerCase();
      if (normalized === `https://${cleanHost}` || normalized === `http://${cleanHost}`) {
        return true;
      }
    }
  }

  // Allow HTTPS Nexus Core subdomains if configured
  if (/^https:\/\/([a-z0-9-]+\.)?(thenexuscoreapp\.com|nexuscore\.fm)$/i.test(normalized)) {
    return true;
  }

  return false;
}

export function createCorsMiddleware(): express.RequestHandler {
  return (req, res, next) => {
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

    if (origin) {
      if (isOriginAllowed(origin, req)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        res.setHeader('Access-Control-Max-Age', '86400');

        if (req.method === 'OPTIONS') {
          return res.sendStatus(204);
        }
      } else {
        // Explicit disallowed browser origin
        res.setHeader('Vary', 'Origin');
        if (req.method === 'OPTIONS' || req.path.startsWith('/api/')) {
          return res.status(403).json({ error: 'Origin not permitted by CORS policy' });
        }
      }
    } else if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  };
}

export function resolveSafeAppOrigin(req: express.Request): string {
  const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  if (originHeader && isOriginAllowed(originHeader, req)) {
    const norm = normalizeOriginString(originHeader);
    if (norm && (norm.startsWith('http://') || norm.startsWith('https://'))) {
      return norm;
    }
  }

  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  if (host) {
    const cleanHost = host.split(',')[0].trim();
    const cleanProto = proto.split(',')[0].trim().toLowerCase() === 'http' ? 'http' : 'https';
    return `${cleanProto}://${cleanHost}`;
  }

  const envAppUrl = normalizeOriginString(process.env.APP_URL || process.env.VITE_APP_URL);
  if (envAppUrl) return envAppUrl;

  return 'https://ais-pre-s6jhaejrxpqgkdr7esx5hy-148981064113.us-west2.run.app';
}

export function resolveSafeRedirectUrl(req: express.Request, requestedUrl: unknown, fallbackPath: string): string {
  const defaultBase = resolveSafeAppOrigin(req);
  const safeFallback = `${defaultBase}${fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`}`;

  if (!requestedUrl || typeof requestedUrl !== 'string') {
    return safeFallback;
  }

  const trimmed = requestedUrl.trim();
  if (!trimmed) return safeFallback;

  // Relative path redirect
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return `${defaultBase}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const origin = `${parsed.protocol}//${parsed.host}`.toLowerCase();
    if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && isOriginAllowed(origin, req)) {
      return trimmed;
    }
  } catch {
    // fall through
  }

  return safeFallback;
}

// ============================================================
// OWNERSHIP & ENTITY AUTHORIZATION HELPERS
// ============================================================

export function stripEntityPrefix(rawId?: string | null): string {
  if (!rawId || typeof rawId !== 'string') return '';
  return rawId.trim().replace(/^(band|promoter|creative|label|venue):/i, '');
}

function memberListContainsUser(members: unknown, user: AuthenticatedUser): boolean {
  if (!Array.isArray(members)) return false;
  return members.some((m: any) => {
    if (!m) return false;
    if (typeof m === 'string') {
      const s = m.trim().toLowerCase();
      return s === user.id.toLowerCase() || (user.email && s === user.email.toLowerCase());
    }
    if (typeof m === 'object') {
      const mId = String(m.id || m.user_id || m.profile_id || '').trim();
      const mEmail = String(m.email || '').trim().toLowerCase();
      if (mId && mId === user.id) return true;
      if (user.email && mEmail && mEmail === user.email.toLowerCase()) return true;
    }
    return false;
  });
}

export async function getUserOwnedEntityIds(supabase: SupabaseClient | null, user: AuthenticatedUser): Promise<Set<string>> {
  const owned = new Set<string>([
    user.id,
    `band:${user.id}`,
    `promoter:${user.id}`,
    `creative:${user.id}`,
    `label:${user.id}`,
  ]);

  if (!supabase) return owned;

  const checks: Promise<void>[] = [];

  checks.push((async () => {
    try {
      const { data } = await supabase
        .from('bands')
        .select('id, owner_id, creator_id, members');
      if (Array.isArray(data)) {
        for (const b of data) {
          const isOwner =
            b.owner_id === user.id ||
            b.creator_id === user.id ||
            memberListContainsUser(b.members, user);
          if (isOwner && b.id) {
            owned.add(String(b.id));
            owned.add(`band:${b.id}`);
          }
        }
      }
    } catch {
      // ignore table lookup failure
    }
  })());

  checks.push((async () => {
    try {
      const { data } = await supabase
        .from('promoters')
        .select('id, owner_id, user_id, email, members');
      if (Array.isArray(data)) {
        for (const p of data) {
          const isOwner =
            p.owner_id === user.id ||
            p.user_id === user.id ||
            (user.email && String(p.email || '').trim().toLowerCase() === user.email.toLowerCase()) ||
            memberListContainsUser(p.members, user);
          if (isOwner && p.id) {
            owned.add(String(p.id));
            owned.add(`promoter:${p.id}`);
          }
        }
      }
    } catch {
      // ignore
    }
  })());

  checks.push((async () => {
    try {
      const { data } = await supabase
        .from('creatives')
        .select('id, user_id, email');
      if (Array.isArray(data)) {
        for (const c of data) {
          const isOwner =
            c.user_id === user.id ||
            (user.email && String(c.email || '').trim().toLowerCase() === user.email.toLowerCase());
          if (isOwner && c.id) {
            owned.add(String(c.id));
            owned.add(`creative:${c.id}`);
          }
        }
      }
    } catch {
      // ignore
    }
  })());

  checks.push((async () => {
    try {
      const { data } = await supabase
        .from('network_entities')
        .select('id, owner_id, creator_id, email, members');
      if (Array.isArray(data)) {
        for (const n of data) {
          const isOwner =
            n.owner_id === user.id ||
            n.creator_id === user.id ||
            (user.email && String(n.email || '').trim().toLowerCase() === user.email.toLowerCase()) ||
            memberListContainsUser(n.members, user);
          if (isOwner && n.id) {
            owned.add(String(n.id));
            owned.add(`label:${n.id}`);
          }
        }
      }
    } catch {
      // ignore
    }
  })());

  await Promise.allSettled(checks);
  return owned;
}

export async function assertBandOrEntityOwner(
  supabase: SupabaseClient | null,
  user: AuthenticatedUser,
  targetEntityId?: string | null
): Promise<boolean> {
  if (user.isAdmin) return true;
  if (!targetEntityId || typeof targetEntityId !== 'string') return false;

  const cleanTarget = stripEntityPrefix(targetEntityId);
  if (!cleanTarget) return false;
  if (cleanTarget === user.id || targetEntityId.trim() === user.id) return true;

  const owned = await getUserOwnedEntityIds(supabase, user);
  return owned.has(targetEntityId.trim()) || owned.has(cleanTarget);
}

export function hasAnyOwnershipMatch(
  user: AuthenticatedUser,
  ownedIds: Set<string>,
  candidates: Array<unknown>
): boolean {
  if (user.isAdmin) return true;
  for (const raw of candidates) {
    if (!raw) continue;
    if (Array.isArray(raw)) {
      if (hasAnyOwnershipMatch(user, ownedIds, raw)) return true;
      continue;
    }
    const str = String(raw).trim();
    if (!str) continue;
    const stripped = stripEntityPrefix(str);
    if (
      str === user.id ||
      stripped === user.id ||
      (user.email && str.toLowerCase() === user.email.toLowerCase()) ||
      ownedIds.has(str) ||
      ownedIds.has(stripped)
    ) {
      return true;
    }
  }
  return false;
}

// ============================================================
// SANITIZATION, SSRF & RATE LIMITING HELPERS
// ============================================================

export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isAllowedBandcampUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'bandcamp.com' || (host.endsWith('.bandcamp.com') && host.length > '.bandcamp.com'.length);
  } catch {
    return false;
  }
}

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
}): express.RequestHandler {
  const store = new Map<string, RateLimitBucket>();

  return (req, res, next) => {
    const now = Date.now();
    const actor = req.authUser?.id || req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${options.keyPrefix}:${actor}`;

    if (store.size > 2000) {
      for (const [k, v] of store.entries()) {
        if (v.resetAtMs <= now) store.delete(k);
      }
    }

    const existing = store.get(key);
    if (!existing || existing.resetAtMs <= now) {
      store.set(key, { count: 1, resetAtMs: now + options.windowMs });
      return next();
    }

    if (existing.count >= options.max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: `Rate limit exceeded for ${options.keyPrefix}. Please retry in ${retryAfterSec}s.`,
      });
    }

    existing.count += 1;
    next();
  };
}
