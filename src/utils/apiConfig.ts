import { supabase } from '../lib/supabaseClient';

/**
 * NexusCore API Configuration & Endpoint Resolver
 * 
 * Provides robust URL resolution across Web browsers, Cloud Run, and Native Android/iOS APK builds (Capacitor/Cordova).
 * In native mobile APK environments, relative endpoints (/api/...) are routed to the live Cloud Run backend.
 */

export const DEFAULT_PRODUCTION_BACKEND_URL = 'https://ais-pre-s6jhaejrxpqgkdr7esx5hy-148981064113.us-west2.run.app';
export const DEV_BACKEND_URL = 'https://ais-dev-s6jhaejrxpqgkdr7esx5hy-148981064113.us-west2.run.app';

/**
 * Returns the active base API URL for backend calls.
 */
export function getBackendApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // 1. Explicit VITE / App environment variables
  const envBackend = (import.meta as any).env?.VITE_BACKEND_URL || 
                     (import.meta as any).env?.VITE_APP_URL || 
                     (import.meta as any).env?.APP_URL;
  if (envBackend && typeof envBackend === 'string' && envBackend.trim() && !envBackend.includes('MY_APP_URL')) {
    return envBackend.trim().replace(/\/+$/, '');
  }

  // 2. User-configured override in localStorage
  try {
    const custom = localStorage.getItem('nexus_custom_api_url');
    if (custom && custom.trim().startsWith('http')) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch (e) {}

  const origin = window.location.origin || '';

  // 3. Native APK / Mobile WebView detection (Capacitor, Cordova, localhost without dev port, file://)
  const isNativeApk = 
    origin.startsWith('capacitor://') ||
    origin.startsWith('file://') ||
    origin.startsWith('ionic://') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('https://localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('10.0.2.2');

  // If running inside Android APK (where origin is localhost or capacitor:// and not local node dev :3000), target cloud backend
  if (isNativeApk && !origin.includes(':3000')) {
    return DEFAULT_PRODUCTION_BACKEND_URL;
  }

  // 4. Standard Web Browser
  return '';
}

/**
 * Formats a complete, reachable API endpoint URL.
 */
export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getBackendApiBaseUrl();
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}

/**
 * Extracts a cached Supabase access token synchronously/safely from storage if needed.
 */
function readCachedAuthTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('nexus_core_auth_token');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token =
        parsed?.access_token ||
        parsed?.currentSession?.access_token ||
        parsed?.session?.access_token;
      if (typeof token === 'string' && token.split('.').length === 3) {
        return token;
      }
    }
  } catch {
    // ignore storage parse error
  }
  return null;
}

/**
 * Retrieves the current authenticated user's Supabase JWT access token.
 * Performs a lightweight refresh only if the active session is within 30s of expiring.
 */
export async function getSupabaseAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { data } = await supabase.auth.getSession();
    let session = data?.session || null;

    if (session?.access_token) {
      const nowSec = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at - nowSec < 30 && session.refresh_token) {
        try {
          const refreshed = await supabase.auth.refreshSession();
          if (refreshed.data?.session?.access_token) {
            session = refreshed.data.session;
          }
        } catch {
          // keep current token if refresh fails
        }
      }
      return session.access_token;
    }
  } catch {
    // fall through to storage fallback
  }

  return readCachedAuthTokenFromStorage();
}

/**
 * Builds Authorization Bearer headers if a Supabase access token is active.
 */
export async function getAuthHeaders(extraHeaders?: HeadersInit): Promise<Headers> {
  const headers = new Headers(extraHeaders || {});
  if (!headers.has('Authorization')) {
    const token = await getSupabaseAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return headers;
}

/**
 * Authenticated fetch wrapper for NexusCore backend routes.
 * Automatically resolves relative paths for Web/Cloud Run/Capacitor APK and attaches Supabase Bearer JWT.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let target: RequestInfo | URL = input;
  if (typeof input === 'string' && input.startsWith('/')) {
    target = getApiEndpoint(input);
  }

  const headers = await getAuthHeaders(init?.headers);
  return fetch(target, {
    ...init,
    headers,
  });
}

/**
 * Matches server-side admin criteria for gating admin-only UI polls & panels cleanly.
 */
export function isClientAdmin(userProfile?: any): boolean {
  if (!userProfile || typeof userProfile !== 'object') return false;
  const uid = String(userProfile.id || userProfile.user_id || '').trim();
  const email = String(userProfile.email || '').trim().toLowerCase();
  const role = String(userProfile.role || '').trim().toLowerCase();

  if (uid === '5403162d-1947-43aa-b5f6-38a1bd2a1b80') return true;
  if (
    email === 'goregrindsickness@gmail.com' ||
    email === 'admin@nexus.com' ||
    email === 'admin@nexuscore.fm'
  ) {
    return true;
  }
  if (userProfile.is_admin === true || role === 'admin') return true;
  return false;
}

/**
 * Returns fallback endpoints in case the primary Cloud Run endpoint is unreachable.
 */
export function getApiFallbackEndpoints(path: string): string[] {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const endpoints: string[] = [];

  const primary = getApiEndpoint(cleanPath);
  endpoints.push(primary);

  const prodUrl = `${DEFAULT_PRODUCTION_BACKEND_URL}${cleanPath}`;
  const devUrl = `${DEV_BACKEND_URL}${cleanPath}`;

  if (!endpoints.includes(prodUrl)) endpoints.push(prodUrl);
  if (!endpoints.includes(devUrl)) endpoints.push(devUrl);
  if (!endpoints.includes(cleanPath)) endpoints.push(cleanPath);

  return endpoints;
}
