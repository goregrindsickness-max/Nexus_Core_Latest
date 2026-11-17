import { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';

/**
 * Dedicated IndexedDB stores for offline & Supabase egress blackout resilience.
 * - profileMediaCacheStore: Stores image blobs / base64 payloads (avatars, band logos, banners, artwork).
 * - profileDataCacheStore: Stores profile JSON metadata payloads (bio, handles, links, roster, location).
 */
export const profileMediaCacheStore = localforage.createInstance({
  name: 'NexusCore_Media_Cache',
  storeName: 'profile_media_cache',
});

export const profileDataCacheStore = localforage.createInstance({
  name: 'NexusCore_Media_Cache',
  storeName: 'profile_data_cache',
});

// Cache bounds & eviction policy configuration
const MAX_MEDIA_CACHE_ITEMS = 65; // Cap at 65 cached images (within 50-75 requirement)
const MAX_DATA_CACHE_ITEMS = 100; // Cap at 100 cached profile JSON records
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days expiration timestamp

interface CacheEnvelope<T> {
  data: T;
  timestamp: number; // Last accessed time (used for LRU eviction)
  createdAt: number; // Creation time (used for 7-day TTL expiration)
}

// In-memory caches for instant zero-latency resolution
const memoryImageCache = new Map<string, string>();
const memoryDataCache = new Map<string, Record<string, any>>();

// Tracked Blob URLs to prevent memory leaks in WebView / Capacitor
const activeTrackedObjectUrls = new Set<string>();

/**
 * Normalizes a URL or asset key into a clean, consistent cache storage key
 */
export function toCacheKey(keyOrUrl?: string | null): string {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') return '';
  const clean = keyOrUrl.trim().toLowerCase();
  return clean.split('?')[0].replace(/[^a-z0-9_-]/gi, '_');
}

// ==========================================
// 1. PROFILE JSON METADATA CACHING
// ==========================================

/**
 * Caches profile JSON text metadata (username, bio, links, roster, location) in IndexedDB and memory.
 */
export async function cacheProfileMetadata(profileIdOrHandle: string, data: Record<string, any>): Promise<void> {
  const cacheKey = toCacheKey(profileIdOrHandle);
  if (!cacheKey || !data || typeof data !== 'object') return;

  const now = Date.now();
  const envelope: CacheEnvelope<Record<string, any>> = {
    data: { ...data },
    timestamp: now,
    createdAt: now,
  };

  try {
    memoryDataCache.set(cacheKey, data);
    await profileDataCacheStore.setItem(cacheKey, envelope);
    evictStaleDataCacheEntries().catch(() => {});
  } catch (err) {
    console.warn('[ProfileDataCache] Failed to cache profile metadata:', cacheKey, err);
  }
}

/**
 * Retrieves cached profile JSON metadata from memory or IndexedDB.
 */
export async function getCachedProfileMetadata(profileIdOrHandle: string): Promise<Record<string, any> | null> {
  const cacheKey = toCacheKey(profileIdOrHandle);
  if (!cacheKey) return null;

  // 1. Check memory cache first
  if (memoryDataCache.has(cacheKey)) {
    return memoryDataCache.get(cacheKey)!;
  }

  // 2. Read from IndexedDB
  try {
    const envelope = await profileDataCacheStore.getItem<CacheEnvelope<Record<string, any>>>(cacheKey);
    if (envelope && envelope.data) {
      // Check 7-day expiration
      if (Date.now() - envelope.createdAt > MAX_CACHE_AGE_MS) {
        await profileDataCacheStore.removeItem(cacheKey);
        return null;
      }
      // Update last accessed timestamp for LRU tracking
      envelope.timestamp = Date.now();
      profileDataCacheStore.setItem(cacheKey, envelope).catch(() => {});

      memoryDataCache.set(cacheKey, envelope.data);
      return envelope.data;
    }
  } catch (err) {
    console.warn('[ProfileDataCache] Error reading cached metadata:', cacheKey, err);
  }

  return null;
}

/**
 * Hydrates profile state using cached metadata if current fields are missing or network is offline/egress blocked.
 */
export async function hydrateProfileWithCache(profileIdOrHandle: string, currentData?: any): Promise<any> {
  const cached = await getCachedProfileMetadata(profileIdOrHandle);
  if (!cached) return currentData || null;
  if (!currentData || typeof currentData !== 'object') return cached;

  // Merge cached text payload so bio, handle, location, links, roster are never blank
  return {
    ...cached,
    ...currentData,
    bio: currentData.bio || cached.bio || '',
    name: currentData.name || currentData.full_name || cached.name || cached.full_name || '',
    full_name: currentData.full_name || currentData.name || cached.full_name || cached.name || '',
    username: currentData.username || currentData.console_handle || cached.username || cached.console_handle || '',
    console_handle: currentData.console_handle || currentData.username || cached.console_handle || cached.username || '',
    city: currentData.city || cached.city || '',
    state_province: currentData.state_province || cached.state_province || '',
    country: currentData.country || cached.country || '',
    roster: Array.isArray(currentData.roster) && currentData.roster.length > 0 ? currentData.roster : (cached.roster || []),
    lineup: Array.isArray(currentData.lineup) && currentData.lineup.length > 0 ? currentData.lineup : (cached.lineup || []),
    discography: Array.isArray(currentData.discography) && currentData.discography.length > 0 ? currentData.discography : (cached.discography || []),
  };
}

// ==========================================
// 2. IMAGE BLOB / DATA URL CACHING & LRU EVICTION
// ==========================================

/**
 * Caches an image blob or base64 data URL locally in IndexedDB with LRU envelope metadata.
 */
export async function cacheProfileImage(keyOrUrl: string, dataUrlOrBlob: string | Blob): Promise<void> {
  const cacheKey = toCacheKey(keyOrUrl);
  if (!cacheKey || !dataUrlOrBlob) return;

  const now = Date.now();

  try {
    let payload = '';
    if (typeof dataUrlOrBlob === 'string') {
      payload = dataUrlOrBlob;
    } else if (dataUrlOrBlob instanceof Blob) {
      payload = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.readAsDataURL(dataUrlOrBlob);
      });
    }

    if (!payload) return;

    const envelope: CacheEnvelope<string> = {
      data: payload,
      timestamp: now,
      createdAt: now,
    };

    memoryImageCache.set(cacheKey, payload);
    await profileMediaCacheStore.setItem(cacheKey, envelope);

    // Asynchronously enforce LRU capacity & 7-day TTL eviction
    evictStaleMediaCacheEntries().catch(() => {});
  } catch (err) {
    console.warn('[ProfileMediaCache] Failed to cache image:', cacheKey, err);
  }
}

/**
 * Retrieves a cached base64 image or Blob URL from memory/IndexedDB.
 */
export async function getCachedProfileImage(keyOrUrl: string): Promise<string | null> {
  const cacheKey = toCacheKey(keyOrUrl);
  if (!cacheKey) return null;

  // 1. Check memory cache
  if (memoryImageCache.has(cacheKey)) {
    return memoryImageCache.get(cacheKey)!;
  }

  // 2. Check IndexedDB
  try {
    const item = await profileMediaCacheStore.getItem<any>(cacheKey);
    if (item) {
      // Support legacy string format or envelope format
      const isEnvelope = typeof item === 'object' && item !== null && 'data' in item;
      const dataStr: string = isEnvelope ? item.data : item;
      const createdAt: number = isEnvelope ? item.createdAt || Date.now() : Date.now();

      // Check 7-day expiration timestamp
      if (Date.now() - createdAt > MAX_CACHE_AGE_MS) {
        await profileMediaCacheStore.removeItem(cacheKey);
        return null;
      }

      // Update LRU last accessed timestamp
      if (isEnvelope) {
        item.timestamp = Date.now();
        profileMediaCacheStore.setItem(cacheKey, item).catch(() => {});
      }

      memoryImageCache.set(cacheKey, dataStr);
      return dataStr;
    }
  } catch (err) {
    console.warn('[ProfileMediaCache] Error reading image from cache:', cacheKey, err);
  }

  return null;
}

/**
 * LRU & TTL Eviction Policy for Media Cache Store:
 * 1. Purges entries older than 7 days (TTL expiration).
 * 2. Caps total cached image count to MAX_MEDIA_CACHE_ITEMS (65 images), removing oldest accessed entries.
 */
export async function evictStaleMediaCacheEntries(): Promise<number> {
  try {
    const keys = await profileMediaCacheStore.keys();
    if (!keys || keys.length === 0) return 0;

    const now = Date.now();
    const itemsWithMeta: { key: string; timestamp: number; createdAt: number }[] = [];
    let purgedCount = 0;

    for (const key of keys) {
      const item = await profileMediaCacheStore.getItem<any>(key);
      if (!item) continue;

      const isEnvelope = typeof item === 'object' && item !== null && 'data' in item;
      const createdAt = isEnvelope ? (item.createdAt || 0) : 0;
      const timestamp = isEnvelope ? (item.timestamp || createdAt) : 0;

      // 1. Purge entries older than 7 days
      if (createdAt > 0 && now - createdAt > MAX_CACHE_AGE_MS) {
        await profileMediaCacheStore.removeItem(key);
        memoryImageCache.delete(key);
        purgedCount++;
        continue;
      }

      itemsWithMeta.push({ key, timestamp, createdAt });
    }

    // 2. Enforce MAX_MEDIA_CACHE_ITEMS cap (LRU: purge oldest last-accessed entries)
    if (itemsWithMeta.length > MAX_MEDIA_CACHE_ITEMS) {
      itemsWithMeta.sort((a, b) => a.timestamp - b.timestamp); // Ascending order (oldest first)
      const overflowCount = itemsWithMeta.length - MAX_MEDIA_CACHE_ITEMS;

      for (let i = 0; i < overflowCount; i++) {
        const toRemove = itemsWithMeta[i];
        if (toRemove?.key) {
          await profileMediaCacheStore.removeItem(toRemove.key);
          memoryImageCache.delete(toRemove.key);
          purgedCount++;
        }
      }
    }

    return purgedCount;
  } catch (err) {
    console.warn('[ProfileMediaCache] Error enforcing LRU eviction:', err);
    return 0;
  }
}

/**
 * LRU & TTL Eviction Policy for Data Cache Store:
 */
export async function evictStaleDataCacheEntries(): Promise<number> {
  try {
    const keys = await profileDataCacheStore.keys();
    if (!keys || keys.length === 0) return 0;

    const now = Date.now();
    const itemsWithMeta: { key: string; timestamp: number; createdAt: number }[] = [];
    let purgedCount = 0;

    for (const key of keys) {
      const item = await profileDataCacheStore.getItem<any>(key);
      if (!item) continue;

      const isEnvelope = typeof item === 'object' && item !== null && 'data' in item;
      const createdAt = isEnvelope ? (item.createdAt || 0) : 0;
      const timestamp = isEnvelope ? (item.timestamp || createdAt) : 0;

      if (createdAt > 0 && now - createdAt > MAX_CACHE_AGE_MS) {
        await profileDataCacheStore.removeItem(key);
        memoryDataCache.delete(key);
        purgedCount++;
        continue;
      }

      itemsWithMeta.push({ key, timestamp, createdAt });
    }

    if (itemsWithMeta.length > MAX_DATA_CACHE_ITEMS) {
      itemsWithMeta.sort((a, b) => a.timestamp - b.timestamp);
      const overflowCount = itemsWithMeta.length - MAX_DATA_CACHE_ITEMS;

      for (let i = 0; i < overflowCount; i++) {
        const toRemove = itemsWithMeta[i];
        if (toRemove?.key) {
          await profileDataCacheStore.removeItem(toRemove.key);
          memoryDataCache.delete(toRemove.key);
          purgedCount++;
        }
      }
    }

    return purgedCount;
  } catch (err) {
    console.warn('[ProfileDataCache] Error enforcing data LRU eviction:', err);
    return 0;
  }
}

// ==========================================
// 3. OBJECT URL CLEANUP & MEMORY LEAK GUARD
// ==========================================

/**
 * Creates a tracked Object URL that is automatically registered for cleanup.
 */
export function createTrackedObjectURL(blob: Blob): string {
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  activeTrackedObjectUrls.add(url);
  return url;
}

/**
 * Safely revokes a specific blob URL to prevent memory leaks in WebView / Capacitor.
 */
export function revokeTrackedObjectURL(url?: string | null): void {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (_) {}
    activeTrackedObjectUrls.delete(url);
  }
}

/**
 * Revokes all tracked Blob URLs currently registered in memory.
 */
export function revokeAllTrackedObjectUrls(): void {
  activeTrackedObjectUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch (_) {}
  });
  activeTrackedObjectUrls.clear();
}

/**
 * Custom React Hook: Resolves a cached image and manages Object URL cleanup on unmount/update.
 */
export function useCachedImageObjectUrl(keyOrUrl?: string | null, fallbackUrl = ''): {
  imageSrc: string;
  isLoading: boolean;
} {
  const [imageSrc, setImageSrc] = useState<string>(fallbackUrl || keyOrUrl || '');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const createdBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const cleanKey = toCacheKey(keyOrUrl);

    // Clean up previous blob URL if key changed
    if (createdBlobUrlRef.current) {
      revokeTrackedObjectURL(createdBlobUrlRef.current);
      createdBlobUrlRef.current = null;
    }

    if (!keyOrUrl) {
      setImageSrc(fallbackUrl);
      setIsLoading(false);
      return;
    }

    async function loadCachedImage() {
      setIsLoading(true);
      const cachedData = await getCachedProfileImage(cleanKey);

      if (!isMounted) return;

      if (cachedData) {
        setImageSrc(cachedData);
      } else {
        setImageSrc(keyOrUrl || fallbackUrl);
      }
      setIsLoading(false);
    }

    loadCachedImage();

    return () => {
      isMounted = false;
      if (createdBlobUrlRef.current) {
        revokeTrackedObjectURL(createdBlobUrlRef.current);
        createdBlobUrlRef.current = null;
      }
    };
  }, [keyOrUrl, fallbackUrl]);

  return { imageSrc, isLoading };
}

/**
 * React Image onError helper: Swaps broken remote network images (e.g. Supabase 509 egress block)
 * with the locally cached version from IndexedDB.
 */
export async function handleImageErrorWithCache(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  keyOrUrl?: string,
  fallbackSrc?: string
): Promise<void> {
  const target = e.currentTarget;
  target.onerror = null; // Prevent infinite reload loops

  if (keyOrUrl) {
    const cached = await getCachedProfileImage(keyOrUrl);
    if (cached && target.src !== cached) {
      target.src = cached;
      target.style.display = 'block';
      return;
    }
  }

  if (fallbackSrc && target.src !== fallbackSrc) {
    target.src = fallbackSrc;
    target.style.display = 'block';
  } else {
    target.style.display = 'none';
  }
}
