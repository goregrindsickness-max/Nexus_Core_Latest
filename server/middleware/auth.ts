import express from 'express';
import {
  ADMIN_EMAILS,
  AuthenticatedUser,
  getAuthClient,
  getUserOwnedEntityIds,
  assertBandOrEntityOwner,
  hasAnyOwnershipMatch,
  stripEntityPrefix,
} from '../lib/supabaseAdmin';

export type { AuthenticatedUser };
export {
  getAuthClient,
  getUserOwnedEntityIds,
  assertBandOrEntityOwner,
  hasAnyOwnershipMatch,
  stripEntityPrefix,
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export function extractBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization || req.headers['x-supabase-auth'];
  if (typeof authHeader === 'string') {
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.slice(7).trim();
    }
    return authHeader.trim();
  }
  return null;
}

export async function verifySupabaseJwt(token: string): Promise<AuthenticatedUser | null> {
  if (!token || token === 'undefined' || token === 'null') return null;
  const supabase = getAuthClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return null;
    }
    const user = data.user;
    const email = user.email?.toLowerCase();
    const metaRole =
      user.app_metadata?.role ||
      user.user_metadata?.role ||
      user.role;
    const isAdmin =
      Boolean(email && ADMIN_EMAILS.has(email)) ||
      metaRole === 'admin' ||
      metaRole === 'service_role' ||
      Boolean(user.app_metadata?.is_admin);

    return {
      id: user.id,
      email,
      role: metaRole,
      isAdmin,
      userMetadata: user.user_metadata || {},
    };
  } catch (err) {
    return null;
  }
}

/**
 * Middleware: Attaches req.authUser if a valid Bearer token is present, but does not block anonymous requests.
 */
export async function optionalAuth(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  try {
    const token = extractBearerToken(req);
    if (token) {
      const verified = await verifySupabaseJwt(token);
      if (verified) {
        req.authUser = verified;
      }
    }
  } catch (_) {}
  next();
}

/**
 * Middleware: Requires a valid Supabase JWT Bearer token.
 */
export async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    if (req.authUser) {
      return next();
    }
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in and provide a valid Bearer token.',
      });
    }
    const verified = await verifySupabaseJwt(token);
    if (!verified) {
      return res.status(401).json({
        error: 'Invalid or expired authentication session. Please sign in again.',
      });
    }
    req.authUser = verified;
    return next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Authentication verification failed.' });
  }
}

/**
 * Middleware: Requires an authenticated admin user OR a valid internal server secret header.
 */
export async function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const internalSecret = process.env.INTERNAL_ADMIN_SECRET;
    const providedSecret = req.headers['x-nexus-admin-secret'];
    if (
      internalSecret &&
      typeof providedSecret === 'string' &&
      providedSecret === internalSecret
    ) {
      req.authUser = {
        id: 'system-admin',
        email: 'admin@thenexuscoreapp.com',
        role: 'admin',
        isAdmin: true,
      };
      return next();
    }

    if (!req.authUser) {
      const token = extractBearerToken(req);
      if (token) {
        const verified = await verifySupabaseJwt(token);
        if (verified) req.authUser = verified;
      }
    }

    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!req.authUser.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
    }
    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Administrator verification failed.' });
  }
}
