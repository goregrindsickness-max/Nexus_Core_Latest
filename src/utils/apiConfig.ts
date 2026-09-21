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
