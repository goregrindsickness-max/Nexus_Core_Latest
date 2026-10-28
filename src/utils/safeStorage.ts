/**
 * Safe localStorage wrapper that handles quota exceeded exceptions,
 * automatically sanitizes heavy base64 strings if necessary,
 * and falls back safely without throwing unhandled exceptions.
 */

export function sanitizeForLocalStorage<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  try {
    const clone = JSON.parse(JSON.stringify(data));

    const sanitizeValue = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string') {
          // If string is a large base64 image (> 30KB or starts with data:image/ and is long)
          if (val.length > 30000 && (val.startsWith('data:image/') || val.startsWith('data:application/'))) {
            // Delete heavy base64 payload from localStorage object (IndexedDB maintains full copy)
            delete obj[key];
          }
        } else if (typeof val === 'object' && val !== null) {
          sanitizeValue(val);
        }
      }
    };

    sanitizeValue(clone);
    return clone;
  } catch (_) {
    return data;
  }
}

export function safeSetLocalStorageItem(key: string, value: any): boolean {
  if (typeof window === 'undefined') return false;

  const strVal = typeof value === 'string' ? value : JSON.stringify(value);

  // If value string itself is enormous (> 1.5MB), attempt sanitization first
  if (strVal.length > 1500000 && typeof value === 'object' && value !== null) {
    const sanitized = sanitizeForLocalStorage(value);
    try {
      localStorage.setItem(key, JSON.stringify(sanitized));
      return true;
    } catch (_) {
      // Fallthrough to standard handler
    }
  }

  try {
    localStorage.setItem(key, strVal);
    return true;
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.number === -2147024882) {
      console.warn(`[SafeStorage] QuotaExceededError on setting "${key}". Sanitizing payload...`);

      // 1. Try saving sanitized version if value is object
      if (typeof value === 'object' && value !== null) {
        try {
          const sanitized = sanitizeForLocalStorage(value);
          localStorage.setItem(key, JSON.stringify(sanitized));
          return true;
        } catch (_) {}
      }

      // 2. Try evicting non-essential cache keys
      try {
        const nonEssentialKeys = [
          'nexus_core_notifications',
          'nexus_core_shows_extended',
          'nexus_core_sales_offline',
          'nexus_master_setlists',
          'nexus_my_collections_v1',
          'distro_db_announcements'
        ];
        for (const evictKey of nonEssentialKeys) {
          if (evictKey !== key) {
            localStorage.removeItem(evictKey);
          }
        }

        const retryVal = typeof value === 'object' && value !== null
          ? JSON.stringify(sanitizeForLocalStorage(value))
          : strVal;
        
        localStorage.setItem(key, retryVal);
        return true;
      } catch (_) {
        console.warn(`[SafeStorage] Could not write "${key}" to localStorage even after eviction.`);
      }
    } else {
      console.warn(`[SafeStorage] Error setting "${key}" in localStorage:`, err);
    }
    return false;
  }
}

export function safeGetLocalStorageItem<T = string>(key: string, fallback: T | null = null): T | null {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return item as unknown as T;
  } catch (_) {
    return fallback;
  }
}
