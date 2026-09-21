import { getSupabase } from './clientService';
import { compressAndTranscodeImageToWebP, base64ToBlob } from './storageService';
import { sanitizeInventoryItemForDb, executeWithSchemaResilience, generateUUID } from './schemaResilienceService';
import { InventoryItem } from '../types';

export const INVENTORY_STORAGE_BUCKET = 'inventory-items';
export const DEFAULT_INVENTORY_IMAGE = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop';

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
  if (!supabase) {
    console.warn('[INVENTORY STORAGE] Supabase client unavailable. Retaining local asset reference.');
    return fallbackResult;
  }

  try {
    let uploadBlob: Blob;

    if (typeof fileOrData === 'string') {
      if (!fileOrData.startsWith('data:')) {
        // Already a remote URL
        return {
          publicUrl: fileOrData,
          imagePath: fileOrData.includes(INVENTORY_STORAGE_BUCKET) ? fileOrData.split(`${INVENTORY_STORAGE_BUCKET}/`)[1] || storagePath : storagePath
        };
      }
      // Compress and transcode Base64
      const compressedData = await compressAndTranscodeImageToWebP(fileOrData);
      uploadBlob = base64ToBlob(compressedData);
    } else {
      // Compress and transcode File or Blob
      const compressed = await compressAndTranscodeImageToWebP(fileOrData);
      if (typeof compressed === 'string' && compressed.startsWith('data:')) {
        uploadBlob = base64ToBlob(compressed);
      } else {
        uploadBlob = compressed instanceof Blob ? compressed : fileOrData;
      }
    }

    // 1. Upload to Supabase 'inventory-items' storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(INVENTORY_STORAGE_BUCKET)
      .upload(storagePath, uploadBlob, {
        upsert: true,
        cacheControl: '3600',
        contentType: 'image/webp'
      });

    if (uploadError) {
      console.warn(`[INVENTORY STORAGE] Failed uploading to '${INVENTORY_STORAGE_BUCKET}':`, uploadError.message);
      // Fallback candidate buckets if inventory-items is temporarily unprovisioned
      const fallbackBuckets = ['media', 'public-assets', 'community-bands'];
      for (const fbBucket of fallbackBuckets) {
        try {
          const { data: fbData, error: fbErr } = await supabase.storage
            .from(fbBucket)
            .upload(storagePath, uploadBlob, { upsert: true, cacheControl: '3600', contentType: 'image/webp' });
          if (!fbErr && fbData) {
            const { data: pubData } = supabase.storage.from(fbBucket).getPublicUrl(fbData.path || storagePath);
            if (pubData?.publicUrl) {
              return {
                publicUrl: pubData.publicUrl,
                imagePath: fbData.path || storagePath
              };
            }
          }
        } catch (_) {}
      }
      return fallbackResult;
    }

    const finalPath = uploadData?.path || storagePath;
    const { data: pubData } = supabase.storage.from(INVENTORY_STORAGE_BUCKET).getPublicUrl(finalPath);
    const publicUrl = pubData?.publicUrl || fallbackResult.publicUrl;

    console.log(`[INVENTORY STORAGE SUCCESS] Stored image in bucket '${INVENTORY_STORAGE_BUCKET}' (${finalPath}):`, publicUrl);

    return {
      publicUrl,
      imagePath: finalPath
    };
  } catch (err: any) {
    console.error('[INVENTORY STORAGE ERROR] Exception uploading item asset:', err?.message || err);
    return fallbackResult;
  }
}

/**
 * Fetches all inventory items from Supabase 'inventory' table, ensuring
 * that the `image_path` database column is retrieved and routed through
 * the 'inventory-items' storage bucket to construct accurate public image URLs.
 */
export async function fetchInventoryItems(bandId?: string): Promise<InventoryItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('inventory')
      .select('id, created_at, name, table_stock, van_stock, low_threshold, status, item_type, price, image_url, image_path, border_color, band_id, is_exclusive, sku, initial_batch_size, cost, barcode, variants')
      .order('created_at', { ascending: false });

    if (bandId) {
      query = query.eq('band_id', bandId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[INVENTORY SERVICE] Error fetching inventory items:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => {
      const resolvedUrl = resolveInventoryImageUrl(item);
      return {
        ...item,
        image_url: resolvedUrl,
        image_path: item.image_path || undefined
      } as InventoryItem;
    });
  } catch (err: any) {
    console.error('[INVENTORY SERVICE] Exception retrieving inventory records:', err?.message || err);
    return [];
  }
}

/**
 * Persists an InventoryItem into the Supabase database. If an un-uploaded
 * image (data URI / local blob) is detected in image_url, it is automatically
 * routed through the 'inventory-items' bucket before writing to the database.
 */
export async function saveInventoryItem(
  item: Partial<InventoryItem>
): Promise<{ data: InventoryItem | null; error: any }> {
  const supabase = getSupabase();
  let finalImagePath = item.image_path;
  let finalImageUrl = item.image_url;

  // 1. If image is a local base64 or blob, upload it to the 'inventory-items' bucket first
  if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.startsWith('blob:'))) {
    try {
      const uploadResult = await uploadInventoryItemImage(finalImageUrl, item.id, item.band_id);
      finalImagePath = uploadResult.imagePath;
      finalImageUrl = uploadResult.publicUrl;
    } catch (e) {
      console.warn('[INVENTORY SERVICE] Could not upload image attachment before save:', e);
    }
  }

  const payload: Partial<InventoryItem> = {
    ...item,
    image_url: finalImageUrl,
    image_path: finalImagePath
  };

  const dbItem = sanitizeInventoryItemForDb(payload);

  if (!supabase) {
    return { data: payload as InventoryItem, error: null };
  }

  try {
    const { data, error } = await executeWithSchemaResilience(async (cleanPayload) => {
      return await supabase.from('inventory').upsert([cleanPayload], { onConflict: 'id' }).select('*').single();
    }, dbItem);

    if (error) {
      return { data: null, error };
    }

    const savedRecord = data ? {
      ...data,
      image_url: resolveInventoryImageUrl(data),
      image_path: data.image_path || finalImagePath
    } : payload;

    return { data: savedRecord as InventoryItem, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Removes an inventory item and optionally removes its storage asset from 'inventory-items'.
 */
export async function deleteInventoryItem(itemId: string, imagePath?: string): Promise<{ error: any }> {
  const supabase = getSupabase();
  if (!supabase) return { error: null };

  try {
    if (imagePath && !imagePath.startsWith('http')) {
      try {
        await supabase.storage.from(INVENTORY_STORAGE_BUCKET).remove([imagePath]);
      } catch (stErr) {
        console.warn('[INVENTORY STORAGE] Could not delete bucket file:', stErr);
      }
    }

    const { error } = await supabase.from('inventory').delete().eq('id', itemId);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}
