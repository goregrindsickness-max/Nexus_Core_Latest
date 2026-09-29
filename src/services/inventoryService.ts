import { getSupabase, ensureValidSupabaseAuthSession } from './clientService';
import { compressAndTranscodeImageToWebP, base64ToBlob } from './storageService';
import { sanitizeInventoryItemForDb, executeWithSchemaResilience, generateUUID } from './schemaResilienceService';
import { InventoryItem } from '../types';

export const INVENTORY_STORAGE_BUCKET = 'inventory-items';
export const DEFAULT_INVENTORY_IMAGE = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop';

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }
  const baseUrl = (typeof process !== 'undefined' && process?.env?.APP_URL) || 'http://localhost:3000';
  return `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
}

export interface InventoryImageUploadResult {
  publicUrl: string;
  imagePath: string;
}

/**
 * Resolves an inventory item's public image URL through the Supabase 'inventory-items'
 * storage bucket using the item's `image_path` column, with graceful fallbacks.
 */
export function resolveInventoryImageUrl(
  itemOrPathOrUrl?: Partial<InventoryItem> | { image_path?: string; image_url?: string; [key: string]: any } | string | null,
  fallbackUrl: string = DEFAULT_INVENTORY_IMAGE
): string {
  if (!itemOrPathOrUrl) return fallbackUrl;

  // 1. If passed a direct string
  if (typeof itemOrPathOrUrl === 'string') {
    const str = itemOrPathOrUrl.trim();
    if (!str) return fallbackUrl;
    // Already a fully-qualified web URL or data/blob URI
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:') || str.startsWith('blob:')) {
      return str;
    }
    // Relative object path in 'inventory-items' bucket
    const supabase = getSupabase();
    if (supabase) {
      const { data } = supabase.storage.from(INVENTORY_STORAGE_BUCKET).getPublicUrl(str);
      if (data?.publicUrl) return data.publicUrl;
    }
    return str;
  }

  // 2. If passed an InventoryItem object
  const imagePath = itemOrPathOrUrl.image_path?.trim();
  const imageUrl = itemOrPathOrUrl.image_url?.trim();

  if (imagePath) {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    const supabase = getSupabase();
    if (supabase) {
      const { data } = supabase.storage.from(INVENTORY_STORAGE_BUCKET).getPublicUrl(imagePath);
      if (data?.publicUrl) return data.publicUrl;
    }
    return imagePath;
  }

  if (imageUrl) {
    return imageUrl;
  }

  return fallbackUrl;
}

/**
 * Uploads an image (File, Blob, or base64/data URI) directly into the Supabase
 * 'inventory-items' storage bucket, returning both the public URL and the relative image_path.
 */
export async function uploadInventoryItemImage(
  fileOrData: File | Blob | string,
  itemId?: string,
  bandId?: string
): Promise<InventoryImageUploadResult> {
  const cleanId = String(itemId || generateUUID()).replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `items/${cleanId}_${timestamp}.webp`;

  const fallbackResult: InventoryImageUploadResult = {
    publicUrl: typeof fileOrData === 'string' ? fileOrData : DEFAULT_INVENTORY_IMAGE,
    imagePath: storagePath
  };

  const supabase = getSupabase();

  try {
    let uploadBlob: Blob;
    let base64DataStr: string | null = null;

    if (typeof fileOrData === 'string') {
      if (!fileOrData.startsWith('data:')) {
        // Already a remote URL
        return {
          publicUrl: fileOrData,
          imagePath: fileOrData.includes(INVENTORY_STORAGE_BUCKET) ? fileOrData.split(`${INVENTORY_STORAGE_BUCKET}/`)[1] || storagePath : storagePath
        };
      }
      base64DataStr = fileOrData;
      const compressedData = await compressAndTranscodeImageToWebP(fileOrData);
      uploadBlob = base64ToBlob(compressedData);
    } else {
      const compressed = await compressAndTranscodeImageToWebP(fileOrData);
      if (typeof compressed === 'string' && compressed.startsWith('data:')) {
        base64DataStr = compressed;
        uploadBlob = base64ToBlob(compressed);
      } else {
        uploadBlob = compressed instanceof Blob ? compressed : fileOrData;
      }
    }

    if (supabase) {
      // Ensure active auth session to satisfy Supabase Storage RLS policies
      await ensureValidSupabaseAuthSession(supabase).catch(() => {});

      // 1. Upload to Supabase 'inventory-items' storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(INVENTORY_STORAGE_BUCKET)
        .upload(storagePath, uploadBlob, {
          upsert: true,
          cacheControl: '3600',
          contentType: 'image/webp'
        });

      if (!uploadError && uploadData) {
        const finalPath = uploadData.path || storagePath;
        const { data: pubData } = supabase.storage.from(INVENTORY_STORAGE_BUCKET).getPublicUrl(finalPath);
        const publicUrl = pubData?.publicUrl || fallbackResult.publicUrl;

        console.log(`[INVENTORY STORAGE SUCCESS] Stored image in bucket '${INVENTORY_STORAGE_BUCKET}' (${finalPath}):`, publicUrl);

        return {
          publicUrl,
          imagePath: finalPath
        };
      } else if (uploadError) {
        console.warn(`[INVENTORY STORAGE CLIENT WARN] '${INVENTORY_STORAGE_BUCKET}' upload error:`, uploadError.message);
      }
    }

    // 2. Server upload fallback (routes through server service role to bypass browser restrictions)
    if (base64DataStr || typeof fileOrData === 'string') {
      try {
        const rawBase64 = base64DataStr || (fileOrData as string);
        const apiRes = await fetch(getApiUrl('/api/upload'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data: rawBase64,
            bucket: INVENTORY_STORAGE_BUCKET,
            userId: bandId || 'band_inventory',
            fileNameToken: cleanId
          })
        });
        if (apiRes.ok) {
          const apiJson = await apiRes.json();
          if (apiJson?.publicUrl) {
            return {
              publicUrl: apiJson.publicUrl,
              imagePath: storagePath
            };
          }
        }
      } catch (srvErr) {
        console.warn('[INVENTORY STORAGE SERVER FALLBACK WARN]', srvErr);
      }
    }

    return fallbackResult;
  } catch (err: any) {
    console.error('[INVENTORY STORAGE ERROR] Exception uploading item asset:', err?.message || err);
    return fallbackResult;
  }
}

/**
 * Fetches all inventory items from Supabase 'inventory' table and global server cache,
 * ensuring that the `image_path` database column is retrieved and routed through
 * the 'inventory-items' storage bucket to construct accurate public image URLs.
 */
export async function fetchInventoryItems(bandId?: string): Promise<InventoryItem[]> {
  const supabase = getSupabase();
  const itemsMap = new Map<string, InventoryItem>();

  // 1. Fetch from Supabase 'inventory' table
  if (supabase) {
    try {
      await ensureValidSupabaseAuthSession(supabase).catch(() => {});
      let query = supabase
        .from('inventory')
        .select('id, created_at, name, table_stock, van_stock, low_threshold, status, item_type, price, image_url, image_path, border_color, band_id, is_exclusive, sku, initial_batch_size, cost, barcode, variants')
        .order('created_at', { ascending: false });

      if (bandId) {
        query = query.eq('band_id', bandId);
      }

      const { data, error } = await query;
      if (!error && data) {
        data.forEach((item: any) => {
          if (item?.id) {
            const resolvedUrl = resolveInventoryImageUrl(item);
            itemsMap.set(item.id, {
              ...item,
              image_url: resolvedUrl,
              image_path: item.image_path || undefined
            } as InventoryItem);
          }
        });
      }
    } catch (err: any) {
      console.warn('[INVENTORY SERVICE] Exception retrieving Supabase inventory records:', err?.message || err);
    }
  }

  // 2. Fetch from server API global cache
  try {
    const endpoint = bandId ? `/api/inventory?band_id=${encodeURIComponent(bandId)}` : '/api/inventory';
    const res = await fetch(getApiUrl(endpoint));
    if (res.ok) {
      const json = await res.json();
      if (json?.items && Array.isArray(json.items)) {
        json.items.forEach((item: any) => {
          if (item?.id) {
            const resolvedUrl = resolveInventoryImageUrl(item);
            const existing = itemsMap.get(item.id) || ({} as Partial<InventoryItem>);
            itemsMap.set(item.id, {
              ...existing,
              ...item,
              image_url: resolvedUrl,
              image_path: item.image_path || existing.image_path || undefined
            } as InventoryItem);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[INVENTORY SERVICE] Server API fetch fallback warning:', err);
  }

  return Array.from(itemsMap.values());
}

/**
 * Persists an InventoryItem into the Supabase database and global server API.
 * If an un-uploaded image (data URI / local blob) is detected in image_url, it is
 * automatically routed through the 'inventory-items' bucket before saving.
 */
export async function saveInventoryItem(
  item: Partial<InventoryItem>
): Promise<{ data: InventoryItem | null; error: any }> {
  const supabase = getSupabase();
  let itemId = item.id;

  // Validate RFC4122 v4 UUID format for PostgreSQL compatibility
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!itemId || !uuidRegex.test(itemId)) {
    itemId = generateUUID();
  }

  let finalImagePath = item.image_path;
  let finalImageUrl = item.image_url;

  // 1. If image is a local base64 or blob, upload it to the 'inventory-items' bucket first
  if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.startsWith('blob:'))) {
    try {
      const uploadResult = await uploadInventoryItemImage(finalImageUrl, itemId, item.band_id);
      finalImagePath = uploadResult.imagePath;
      finalImageUrl = uploadResult.publicUrl;
    } catch (e) {
      console.warn('[INVENTORY SERVICE] Could not upload image attachment before save:', e);
    }
  }

  const payload: Partial<InventoryItem> = {
    ...item,
    id: itemId,
    image_url: finalImageUrl,
    image_path: finalImagePath
  };

  const dbItem = sanitizeInventoryItemForDb(payload);

  let savedRecord: InventoryItem | null = null;
  let saveError: any = null;

  // 2. Persist to Supabase database
  if (supabase) {
    try {
      await ensureValidSupabaseAuthSession(supabase).catch(() => {});
      const { data, error } = await executeWithSchemaResilience(async (cleanPayload) => {
        return await supabase.from('inventory').upsert([cleanPayload], { onConflict: 'id' }).select('*').single();
      }, dbItem);

      if (!error && data) {
        savedRecord = {
          ...data,
          image_url: resolveInventoryImageUrl(data),
          image_path: data.image_path || finalImagePath
        } as InventoryItem;
      } else if (error) {
        saveError = error;
        console.warn('[INVENTORY SERVICE] Supabase direct upsert error (falling back to server API):', error.message);
      }
    } catch (err: any) {
      saveError = err;
      console.warn('[INVENTORY SERVICE] Supabase direct exception:', err?.message || err);
    }
  }

  // 3. Persist to server API endpoint (guarantees cross-device persistence globally)
  try {
    const apiRes = await fetch(getApiUrl('/api/inventory'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: payload })
    });
    if (apiRes.ok) {
      const apiJson = await apiRes.json();
      if (apiJson?.items && apiJson.items[0]) {
        const srvItem = apiJson.items[0];
        savedRecord = {
          ...payload,
          ...srvItem,
          image_url: resolveInventoryImageUrl(srvItem),
          image_path: srvItem.image_path || finalImagePath
        } as InventoryItem;
        saveError = null; // Cleared error since server persisted successfully
      }
    }
  } catch (srvErr) {
    console.warn('[INVENTORY SERVICE] Server API save endpoint exception:', srvErr);
  }

  return { data: savedRecord || (payload as InventoryItem), error: saveError };
}

/**
 * Removes an inventory item and optionally removes its storage asset from 'inventory-items'.
 */
export async function deleteInventoryItem(itemId: string, imagePath?: string): Promise<{ error: any }> {
  const supabase = getSupabase();

  if (imagePath && !imagePath.startsWith('http') && supabase) {
    try {
      await ensureValidSupabaseAuthSession(supabase).catch(() => {});
      await supabase.storage.from(INVENTORY_STORAGE_BUCKET).remove([imagePath]);
    } catch (stErr) {
      console.warn('[INVENTORY STORAGE] Could not delete bucket file:', stErr);
    }
  }

  let delError = null;

  if (supabase) {
    try {
      await ensureValidSupabaseAuthSession(supabase).catch(() => {});
      const { error } = await supabase.from('inventory').delete().eq('id', itemId);
      delError = error;
    } catch (err: any) {
      delError = err;
    }
  }

  try {
    await fetch(getApiUrl(`/api/inventory/${encodeURIComponent(itemId)}`), { method: 'DELETE' });
  } catch (_) {}

  return { error: delError };
}
