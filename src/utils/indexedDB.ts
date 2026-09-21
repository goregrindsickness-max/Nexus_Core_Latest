import localforage from 'localforage';

localforage.config({
  name: 'NexusCore_Offline_DB',
});

/**
 * Normalizes an image URL for deduplication comparisons.
 */
function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  return url.split('?')[0].trim().toLowerCase();
}

/**
 * Generates a unique cryptographic-like content hash/fingerprint for a given asset (post or photo object).
 * This ensures content-based uniqueness even if generated/duplicate IDs are assigned.
 */
export function generateAssetFingerprint(item: any): string {
  if (!item || typeof item !== 'object') return '';

  // 1. Primary DB/ID check (ignore mock prefixes)
  const rawId = String(item.id || item.uuid || item.post_id || '');
  const id = rawId.startsWith('mock_') ? '' : rawId;

  // 2. Normalized image/media URL (core visual asset identifier)
  const imgUrl = item.image || item.media_url || item.imageUrl || item.url || '';
  const normUrl = imgUrl ? normalizeImageUrl(imgUrl) : '';

  // 3. Caption/Content text
  const text = (item.content || item.caption || '').trim().toLowerCase();

  // 4. Folder or album container name
  const folder = (item.gallery_folder || item.folder || '').trim().toLowerCase();

  // Return a precise fingerprint string
  if (normUrl) {
    // If the asset has an image URL, the visual signature combined with content + folder defines its uniqueness
    return `asset_photo:[${folder}]:[${normUrl}]:[${text}]`;
  }

  if (id) {
    return `asset_id:${id}`;
  }

  // Fallback to text content fingerprint
  return `asset_text:[${folder}]:[${text}]`;
}

/**
 * Deduplicates an array of assets (such as feed items, photo entries, or database rows)
 * using their content hashes/fingerprints and unique identifiers.
 */
export function deduplicateAssetsArray<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return items;

  const seenFingerprints = new Set<string>();
  const seenIds = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (!item) continue;

    const rawItem = item as any;
    const id = String(rawItem.id || rawItem.uuid || rawItem.post_id || '');
    const hasRealId = id && !id.startsWith('mock_');

    // Verify ID uniqueness
    if (hasRealId) {
      if (seenIds.has(id)) {
        console.warn(`[IndexedDB deduplication] Dropped duplicate entry with existing ID: ${id}`);
        continue;
      }
    }

    // Verify Fingerprint uniqueness
    const fingerprint = generateAssetFingerprint(rawItem);
    if (fingerprint) {
      if (seenFingerprints.has(fingerprint)) {
        console.warn(`[IndexedDB deduplication] Dropped duplicate entry with content signature: ${fingerprint}`);
        continue;
      }
      seenFingerprints.add(fingerprint);
    }

    if (hasRealId) {
      seenIds.add(id);
    }

    result.push(item);
  }

  return result;
}

/**
 * Intercepts write operations on localforage stores to ensure all saved arrays/collections
 * remain fully unique and duplicate-free.
 */
function wrapStoreWithDeduplication<S extends any>(store: S): S {
  const originalSetItem = (store as any).setItem.bind(store);

  (store as any).setItem = async function <T>(key: string, value: T): Promise<T> {
    let finalValue = value;

    if (Array.isArray(value)) {
      finalValue = deduplicateAssetsArray(value) as unknown as T;
    } else if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          finalValue = JSON.stringify(deduplicateAssetsArray(parsed)) as unknown as T;
        }
      } catch (_) {
        // Not a stringified JSON array, persist as-is
      }
    }

    return originalSetItem(key, finalValue);
  };

  return store;
}

export const inventoryStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'inventory_store'
}));

export const posSalesStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'pos_sales_store'
}));

export const itinerariesStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'itineraries_store'
}));

export const socialFeedStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'social_feed_store'
}));

export const reviewsStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'reviews_store'
}));

export const showsStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'shows_store'
}));

export const venuesStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'venues_store'
}));

export const offersStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'offers_store'
}));

export const routingBeaconsStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'routing_beacons_store'
}));

export const creativeNodesStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'creative_nodes_store'
}));

export const expensesStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'expenses_store'
}));

export const registrationStagingStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'registration_staging'
}));

export const labelCatalogStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'label_catalog_store'
}));

export const profileStore = wrapStoreWithDeduplication(localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'profile_store'
}));
