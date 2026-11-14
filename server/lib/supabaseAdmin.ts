import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const FALLBACK_SUPABASE_URL = 'https://guvdkdyrmmoyadmapokx.supabase.co';
export const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dmRrZHlybW1veWFkbWFwb2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODg3NzIsImV4cCI6MjA4ODI2NDc3Mn0.im603s71m3n6-573-H-pI_2m7n6_H8_pI_2m7n6_H8';

export const ADMIN_EMAILS = new Set([
  'm3dina99@gmail.com',
  'miguel@thenexuscoreapp.com',
  'admin@thenexuscoreapp.com',
]);

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  isAdmin: boolean;
  userMetadata?: Record<string, any>;
}

let supabaseServiceInstance: SupabaseClient | null = null;
let cachedAuthClient: SupabaseClient | null = null;

export function getSupabaseService(): SupabaseClient | null {
  if (!supabaseServiceInstance) {
    const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const url = rawUrl.startsWith('http') ? rawUrl : FALLBACK_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (url && key && url.startsWith('http')) {
      try {
        supabaseServiceInstance = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
      } catch (err) {
        console.warn('[SUPABASE ADMIN INIT ERROR]: Failed to initialize Supabase service client:', err);
      }
    }
  }
  return supabaseServiceInstance;
}

export function getAuthClient(): SupabaseClient | null {
  if (cachedAuthClient) return cachedAuthClient;
  const rawUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    FALLBACK_SUPABASE_URL;
  const url = rawUrl.startsWith('http') ? rawUrl : FALLBACK_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  try {
    cachedAuthClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return cachedAuthClient;
  } catch (err) {
    console.warn('[SECURITY] Failed to initialize Supabase auth client:', err);
    return null;
  }
}

/**
 * SECURE VAULT INTEGRATION LAYER
 * Safely fetches encrypted API keys from Supabase Vault (via RPC or direct query)
 * with an automatic, non-breaking fallback to local environment variables.
 */
export const VAULT_LOCAL_FALLBACKS: Record<string, string | undefined> = {
  gemini_api_key: process.env.GEMINI_API_KEY,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  vapid_private_key: process.env.VAPID_PRIVATE_KEY,
  resend_api_key: process.env.RESEND_API_KEY,
};

const vaultSecretCache: Record<string, { value: string; expiresAt: number }> = {};
const VAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache to prevent latency spikes

export async function getVaultSecret(secretName: keyof typeof VAULT_LOCAL_FALLBACKS | string): Promise<string> {
  const now = Date.now();
  const cached = vaultSecretCache[secretName];
  if (cached && cached.expiresAt > now && cached.value) {
    return cached.value;
  }

  const fallbackVal = VAULT_LOCAL_FALLBACKS[secretName] || process.env[secretName.toUpperCase()] || '';

  // Only attempt Supabase Vault lookup if we have a real service_role key
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (hasServiceRoleKey) {
    try {
      const sb = getSupabaseService();
      if (sb) {
        const { data: rpcData, error: rpcErr } = await sb.rpc('get_vault_secret', { secret_name: secretName });
        if (!rpcErr && typeof rpcData === 'string' && rpcData.trim().length > 0) {
          const val = rpcData.trim();
          vaultSecretCache[secretName] = { value: val, expiresAt: now + VAULT_CACHE_TTL_MS };
          return val;
        }
      }
    } catch (_) {
      // Silently fall back to local environment variable if RPC is not yet provisioned
    }
  }

  if (fallbackVal) {
    vaultSecretCache[secretName] = { value: fallbackVal, expiresAt: now + VAULT_CACHE_TTL_MS };
  }
  return fallbackVal;
}

/**
 * ENTITY & BAND OWNERSHIP VERIFICATION HELPERS
 */
export function stripEntityPrefix(id: string): string {
  return String(id || '').replace(/^(band|promoter|creative|label|festival|user):/i, '').trim();
}

export async function getUserOwnedEntityIds(
  supabase: SupabaseClient | null,
  user: AuthenticatedUser
): Promise<Set<string>> {
  const owned = new Set<string>();
  if (!user?.id) return owned;

  owned.add(user.id);
  owned.add(`user:${user.id}`);

  if (!supabase) return owned;

  try {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id, data')
      .eq('id', user.id)
      .maybeSingle();

    if (profileRow) {
      owned.add(profileRow.id);
      const pData = typeof profileRow.data === 'string'
        ? JSON.parse(profileRow.data)
        : (profileRow.data || {});

      const addId = (rawId: any) => {
        if (!rawId || typeof rawId !== 'string') return;
        const clean = stripEntityPrefix(rawId);
        if (!clean) return;
        owned.add(clean);
        owned.add(`band:${clean}`);
        owned.add(`promoter:${clean}`);
        owned.add(`creative:${clean}`);
        owned.add(`label:${clean}`);
        owned.add(`festival:${clean}`);
      };

      addId(pData.band_id);
      addId(pData.bandId);
      addId(pData.activeEntityId);

      const managedArrays = [
        pData.managedBands,
        pData.managedClients,
        pData.ownedEntities,
        pData.entities,
        pData.bands,
      ];
      for (const arr of managedArrays) {
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (typeof item === 'string') addId(item);
            else if (item && typeof item === 'object') {
              addId(item.id);
              addId(item.band_id);
              addId(item.bandId);
            }
          }
        }
      }
    }
  } catch (_) {}

  try {
    const { data: bandRows } = await supabase
      .from('bands')
      .select('id')
      .or(`owner_id.eq.${user.id},created_by.eq.${user.id},user_id.eq.${user.id}`);

    if (Array.isArray(bandRows)) {
      for (const row of bandRows) {
        if (row?.id) {
          owned.add(row.id);
          owned.add(`band:${row.id}`);
        }
      }
    }
  } catch (_) {}

  return owned;
}

export async function assertBandOrEntityOwner(
  supabase: SupabaseClient | null,
  user: AuthenticatedUser,
  targetBandOrEntityId?: string | null
): Promise<boolean> {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (!targetBandOrEntityId) return true;

  const cleanTarget = stripEntityPrefix(targetBandOrEntityId);
  if (!cleanTarget) return true;
  if (cleanTarget === user.id) return true;

  const ownedIds = await getUserOwnedEntityIds(supabase, user);
  if (ownedIds.has(cleanTarget) || ownedIds.has(targetBandOrEntityId)) {
    return true;
  }

  if (supabase) {
    try {
      const { data: bandRow } = await supabase
        .from('bands')
        .select('id, owner_id, created_by, user_id, email, manager_email')
        .eq('id', cleanTarget)
        .maybeSingle();

      if (bandRow) {
        if (
          bandRow.owner_id === user.id ||
          bandRow.created_by === user.id ||
          bandRow.user_id === user.id
        ) {
          return true;
        }
        if (
          user.email &&
          (bandRow.email?.toLowerCase() === user.email ||
            bandRow.manager_email?.toLowerCase() === user.email)
        ) {
          return true;
        }
      }
    } catch (_) {}
  }

  return false;
}

export function hasAnyOwnershipMatch(
  user: AuthenticatedUser,
  ownedIds: Set<string>,
  candidateIds: Array<string | undefined | null>
): boolean {
  if (user.isAdmin) return true;
  for (const candidate of candidateIds) {
    if (!candidate) continue;
    const raw = String(candidate).trim();
    const clean = stripEntityPrefix(raw);
    if (ownedIds.has(raw) || ownedIds.has(clean) || clean === user.id) {
      return true;
    }
  }
  return false;
}
