import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Canonical single-source-of-truth Supabase client and portal management module
export const DEFAULT_SUPABASE_URL = 'https://cyjnpuneruonskfzpmqo.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5am5wdW5lcnVvbnNrZnpwbXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTA1NjIsImV4cCI6MjA5NTQyNjU2Mn0.94h4Ao-cpLXwU8xxJsKln0iud2wOw746yZlAdFP2gDM';

const envUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.SUPABASE_URL) ||
  (typeof process !== 'undefined' && process?.env && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  '';
const envKey =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process?.env && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
  '';

export const SUPABASE_URL = (envUrl || '').trim() || DEFAULT_SUPABASE_URL;
export const SUPABASE_KEY = (envKey || '').trim() || DEFAULT_SUPABASE_ANON_KEY;

if (!envUrl || !envKey) {
  console.info('[Supabase Singleton] Active with built-in default project connection for Nexus Core.');
}

// Single canonical Supabase client instance across the entire app bundle
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'nexus_core_auth_token',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

export const rawClient: SupabaseClient = supabase;

let queryBuilderWrapper: ((builder: any, table: string) => any) | null = null;
export function setQueryBuilderWrapper(wrapper: (builder: any, table: string) => any) {
  queryBuilderWrapper = wrapper;
}

// Caches per portal type: 'band' | 'promoter' | 'creative'
const rawSupabaseInstances: Record<string, SupabaseClient | null> = {};
const proxiedSupabaseInstances: Record<string, any> = {};

export function getActivePortalType(): 'band' | 'promoter' | 'creative' {
  if (typeof window === 'undefined') return 'band';
  let profileStr = null;
  try {
    profileStr = localStorage.getItem('nexus_core_user_profile');
  } catch (e) {}
  if (profileStr) {
    try {
      const parsed = JSON.parse(profileStr);
      if (parsed && typeof parsed.account_type === 'string') {
        const type = parsed.account_type.toLowerCase();
        if (type === 'promoter' || type === 'creative' || type === 'band') {
          return type as 'band' | 'promoter' | 'creative';
        }
      }
    } catch (e) {}
  }
  return 'band';
}

export function getSupabaseUrlForPortal(portalType: 'band' | 'promoter' | 'creative'): string {
  if (typeof window !== 'undefined') {
    let saved = null;
    try {
      saved = localStorage.getItem(`nexus_core_${portalType}_supabase_url`);
    } catch (e) {}
    if (saved && saved.trim() && (saved.trim().startsWith('http://') || saved.trim().startsWith('https://'))) {
      return saved.trim();
    }
  }
  return SUPABASE_URL;
}

export function getSupabaseAnonKeyForPortal(portalType: 'band' | 'promoter' | 'creative'): string {
  if (typeof window !== 'undefined') {
    let saved = null;
    try {
      saved = localStorage.getItem(`nexus_core_${portalType}_supabase_key`);
    } catch (e) {}
    if (saved && saved.trim()) {
      return saved.trim();
    }
  }
  return SUPABASE_KEY;
}

export function getSupabaseUrl(): string {
  return getSupabaseUrlForPortal(getActivePortalType());
}

export function getSupabaseAnonKey(): string {
  return getSupabaseAnonKeyForPortal(getActivePortalType());
}

export function clearSupabaseClientsCache() {
  for (const key of Object.keys(rawSupabaseInstances)) {
    delete rawSupabaseInstances[key];
  }
  for (const key of Object.keys(proxiedSupabaseInstances)) {
    delete proxiedSupabaseInstances[key];
  }
}

export function getRawSupabase(customPortalType?: 'band' | 'promoter' | 'creative'): SupabaseClient | null {
  const portalType = customPortalType || getActivePortalType();
  if (rawSupabaseInstances[portalType]) {
    return rawSupabaseInstances[portalType];
  }

  let customUrl = null;
  let customKey = null;
  if (typeof window !== 'undefined') {
    try {
      customUrl = localStorage.getItem(`nexus_core_${portalType}_supabase_url`);
      customKey = localStorage.getItem(`nexus_core_${portalType}_supabase_key`);
    } catch (e) {}
  }

  if (!customUrl && !customKey) {
    rawSupabaseInstances[portalType] = supabase;
    return supabase;
  }

  const url = getSupabaseUrlForPortal(portalType);
  const key = getSupabaseAnonKeyForPortal(portalType);

  if (!url || !key || url.includes('YOUR_ACTUAL') || key.includes('YOUR_ACTUAL')) {
    console.error(`CRITICAL ERROR: Supabase credentials for [${portalType}] are unconfigured or empty strings!`);
    return null;
  }

  try {
    const raw = createClient(url, key, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nexus_core_auth_token',
        flowType: 'pkce',
      },
    });
    rawSupabaseInstances[portalType] = raw;
    return raw;
  } catch (err) {
    console.error(`Failed to initialize Supabase client for [${portalType}]:`, err);
    return null;
  }
}

/**
 * Verifies and refreshes the active Supabase auth session without brute-forcing dummy passwords
 * or silently provisioning unauthorized accounts.
 */
export async function ensureValidSupabaseAuthSession(client: SupabaseClient | any): Promise<any> {
  if (!client?.auth) return null;
  try {
    const { data: sessionData } = await client.auth.getSession();
    const currentSession = sessionData?.session;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const isExpiredOrClose =
      !currentSession || !currentSession.access_token || (currentSession.expires_at && currentSession.expires_at < nowSeconds + 60);

    if (isExpiredOrClose) {
      try {
        const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
        if (!refreshError && refreshData?.session) {
          return refreshData.session;
        }
      } catch (_) {}

      // Check stored refresh tokens in localStorage
      if (typeof window !== 'undefined') {
        const storedKeys = ['nexus_core_auth_token', 'sb-cyjnpuneruonskfzpmqo-auth-token', 'supabase.auth.token'];
        for (const k of storedKeys) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              const refreshToken = parsed?.refresh_token || parsed?.currentSession?.refresh_token;
              const accessToken = parsed?.access_token || parsed?.currentSession?.access_token;
              if (refreshToken) {
                const { data: setRes, error: setErr } = await client.auth.setSession({
                  access_token: accessToken || '',
                  refresh_token: refreshToken,
                });
                if (!setErr && setRes?.session) {
                  return setRes.session;
                }
              }
            }
          } catch (_) {}
        }
      }
    }

    return currentSession;
  } catch (err) {
    console.warn('[AUTH SESSION CHECK] Exception verifying auth session:', err);
    return null;
  }
}

export function getSupabase(customPortalType?: 'band' | 'promoter' | 'creative'): SupabaseClient | null {
  const portalType = customPortalType || getActivePortalType();
  const raw = getRawSupabase(portalType);
  if (!raw) return null;

  if (proxiedSupabaseInstances[portalType]) {
    return proxiedSupabaseInstances[portalType];
  }

  try {
    const proxied = new Proxy(raw, {
      get(target, prop, receiver) {
        if (prop === 'from') {
          return (table: string) => {
            const queryBuilder = target.from(table);
            return queryBuilderWrapper ? queryBuilderWrapper(queryBuilder, table) : queryBuilder;
          };
        }

        if (prop === 'storage') {
          const rawStorage = target.storage;
          if (!rawStorage) return undefined;

          return new Proxy(rawStorage, {
            get(storageTarget, storageProp) {
              if (storageProp === 'from') {
                return (bucketName: string) => {
                  const rawBucket = storageTarget.from(bucketName);
                  if (!rawBucket) return undefined;

                  return new Proxy(rawBucket, {
                    get(bucketTarget, bucketProp) {
                      if (bucketProp === 'upload' || bucketProp === 'update' || bucketProp === 'uploadToSignedUrl') {
                        return async (...args: any[]) => {
                          const pathArg = args[0];
                          let fileArg = args[1];
                          let optionsArg = args[2];

                          const isSignedUrl = bucketProp === 'uploadToSignedUrl';
                          if (isSignedUrl) {
                            fileArg = args[2];
                            optionsArg = args[3];
                          }

                          await ensureValidSupabaseAuthSession(target);

                          const updatedOptions = {
                            ...optionsArg,
                            cacheControl:
                              typeof optionsArg?.cacheControl === 'string' && /^\d+$/.test(optionsArg.cacheControl)
                                ? optionsArg.cacheControl
                                : '31536000',
                            upsert: optionsArg?.upsert ?? true,
                          };

                          const isVideoFile =
                            bucketName === 'clips' ||
                            (fileArg && typeof fileArg === 'object' && 'type' in fileArg && typeof fileArg.type === 'string' && fileArg.type.startsWith('video/')) ||
                            (typeof pathArg === 'string' && /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(pathArg));

                          let processedFile = fileArg;

                          if (isVideoFile) {
                            let videoMime = 'video/mp4';
                            if (fileArg && typeof fileArg === 'object' && 'type' in fileArg && typeof fileArg.type === 'string' && fileArg.type.startsWith('video/')) {
                              videoMime = fileArg.type;
                            } else if (typeof pathArg === 'string') {
                              if (/\.webm$/i.test(pathArg)) videoMime = 'video/webm';
                              else if (/\.mov$/i.test(pathArg)) videoMime = 'video/quicktime';
                            }
                            updatedOptions.contentType = videoMime;
                          } else if (fileArg && typeof fileArg === 'object' && 'type' in fileArg && typeof fileArg.type === 'string' && fileArg.type.startsWith('image/')) {
                            try {
                              const { compressAndTranscodeImageToWebP } = await import('./storageManager');
                              processedFile = await compressAndTranscodeImageToWebP(fileArg);
                              if (
                                processedFile &&
                                typeof processedFile === 'object' &&
                                'type' in processedFile &&
                                processedFile.type
                              ) {
                                updatedOptions.contentType = processedFile.type;
                              }
                            } catch (err) {
                              console.error(`[STORAGE PROXY] Image auto-compression failed, uploading original:`, err);
                            }
                          }

                          let result;
                          if (isSignedUrl) {
                            result = await bucketTarget.uploadToSignedUrl(pathArg, args[1], processedFile, updatedOptions);
                          } else {
                            result = await bucketTarget[bucketProp](pathArg, processedFile, updatedOptions);
                          }

                          if (result?.error) {
                            const errStr = (result.error.message || '').toLowerCase();
                            const statusCode = (result.error as any)?.statusCode || (result.error as any)?.status;
                            if (
                              statusCode === 400 ||
                              statusCode === 401 ||
                              errStr.includes('row-level') ||
                              errStr.includes('jwt') ||
                              errStr.includes('expired') ||
                              errStr.includes('token')
                            ) {
                              try {
                                const { data: refreshed } = await target.auth.refreshSession();
                                if (refreshed?.session) {
                                  if (isSignedUrl) {
                                    result = await bucketTarget.uploadToSignedUrl(
                                      pathArg,
                                      args[1],
                                      processedFile,
                                      updatedOptions
                                    );
                                  } else {
                                    result = await bucketTarget[bucketProp](pathArg, processedFile, updatedOptions);
                                  }
                                }
                              } catch (_) {}
                            }
                          }

                          return result;
                        };
                      }
                      return Reflect.get(bucketTarget, bucketProp);
                    },
                  });
                };
              }
              return Reflect.get(storageTarget, storageProp);
            }
          });
        }

        return Reflect.get(target, prop, receiver);
      },
    });
    proxiedSupabaseInstances[portalType] = proxied;
    return proxied;
  } catch (err) {
    console.error(`Failed to create proxy wrapper for Supabase client [${portalType}]:`, err);
    return raw;
  }
}

export type { SupabaseClient };
export default supabase;
