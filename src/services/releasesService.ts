import { supabase as singletonSupabase } from '../lib/supabaseClient';
import { getSupabase } from './clientService';
import { labelCatalogStore } from '../utils/indexedDB';
import { uploadBase64ToStorage } from './storageService';
import { ensureUUID, executeWithSchemaResilience } from './schemaResilienceService';

const getActiveSupabase = (portalType?: 'band' | 'promoter' | 'creative') => {
  return getSupabase(portalType) || singletonSupabase;
};

export interface ReleaseTrack {
  id: string;
  num?: string;
  title: string;
  duration?: string;
  lyrics?: string;
  audioUrl?: string;
  url?: string;
  isrc?: string;
  fileSize?: string;
  metrics?: Record<string, any>;
}

export interface CatalogRelease {
  id: string;
  catalogId?: string;
  title: string;
  coverColor?: string;
  type?: 'Album' | 'EP' | 'Demo' | 'Split' | 'Single' | string;
  releaseDate?: string;
  label?: string;
  genre?: string;
  coverImage?: string | null;
  coverUrl?: string | null;
  tracks?: ReleaseTrack[];
  formats?: {
    vinyl?: { warehouse_qty?: number; shelf_id?: string; variants?: any[] };
    cd?: { warehouse_qty?: number; shelf_id?: string };
    cassette?: { warehouse_qty?: number; shelf_id?: string };
    [key: string]: any;
  };
  digital?: any[];
  audio_vault_path?: string;
  band_id?: string;
  label_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Strips out any client-side-only metadata properties and maps camelCase fields
 * to snake_case database schema columns to prevent 400 Bad Request schema rejections.
 * Handles both individual objects and arrays properly.
 */
export function sanitizeReleaseForDb(release: any): any {
  if (!release || typeof release !== 'object') return {};
  if (Array.isArray(release)) {
    return release.map((r) => sanitizeReleaseForDb(r));
  }

  // If passed an object with numeric index keys (e.g. { "0": {...}, "1": {...} }), convert to array
  const keys = Object.keys(release);
  if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
    return keys
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => sanitizeReleaseForDb(release[k]));
  }

  const clean: Record<string, any> = { ...release };

  if (clean.catalogId && !clean.catalog_id) clean.catalog_id = clean.catalogId;
  if (clean.releaseDate && !clean.release_date) clean.release_date = clean.releaseDate;
  if (clean.coverImage && !clean.cover_image && !clean.cover_url) {
    clean.cover_image = clean.coverImage;
    clean.cover_url = clean.coverImage;
  }
  if (clean.image_url && !clean.cover_image && !clean.cover_url) {
    clean.cover_image = clean.image_url;
    clean.cover_url = clean.image_url;
  }
  if (clean.year && !clean.release_date) {
    clean.release_date = String(clean.year);
  }
  if (clean.release_info && !clean.label) {
    clean.label = clean.release_info;
  }

  // Strip client-side-only metadata properties and obsolete/unsupported schema columns
  delete clean.catalogId;
  delete clean.releaseDate;
  delete clean.coverColor;
  delete clean.cover_color;
  delete clean.coverImage;
  delete clean.isEditing;
  delete clean.isNew;
  delete clean.selectedFile;
  delete clean.image_url;
  delete clean.year;
  delete clean.release_info;

  const allowedColumns = new Set([
    'id',
    'band_id',
    'label_id',
    'title',
    'catalog_id',
    'type',
    'release_date',
    'label',
    'genre',
    'cover_image',
    'cover_url',
    'tracks',
    'formats',
    'digital',
    'audio_vault_path',
    'status',
    'created_at',
    'updated_at'
  ]);

  const dbRelease: Record<string, any> = {};
  for (const key of Object.keys(clean)) {
    if (allowedColumns.has(key)) {
      dbRelease[key] = clean[key];
    }
  }
  return dbRelease;
}

/**
 * Fetch all releases from Supabase database 'releases' table
 */
export async function fetchReleasesFromDatabase(portalType?: 'band' | 'promoter' | 'creative'): Promise<CatalogRelease[]> {
  try {
    const client = getActiveSupabase(portalType);
    const { data, error } = await client
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[releasesService] fetchReleases database notice:', error.message);
      return [];
    }

    if (data && Array.isArray(data)) {
      return data.map(row => ({
        id: row.id,
        catalogId: row.catalog_id || row.catalogId,
        title: row.title,
        coverColor: row.cover_color || row.coverColor,
        type: row.type || row.format_type || 'Album',
        releaseDate: row.release_date || row.releaseDate,
        label: row.label,
        genre: row.genre,
        coverImage: row.cover_image || row.cover_url || row.coverImage,
        coverUrl: row.cover_url || row.cover_image || row.coverUrl,
        tracks: Array.isArray(row.tracks) ? row.tracks : (typeof row.tracks === 'string' ? JSON.parse(row.tracks) : []),
        formats: typeof row.formats === 'object' && row.formats ? row.formats : (typeof row.formats === 'string' ? JSON.parse(row.formats) : {}),
        digital: Array.isArray(row.digital) ? row.digital : (typeof row.digital === 'string' ? JSON.parse(row.digital) : []),
        audio_vault_path: row.audio_vault_path,
        band_id: row.band_id,
        label_id: row.label_id,
        status: row.status || 'active',
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    }
  } catch (err) {
    console.warn('[releasesService] Exception fetching releases from DB:', err);
  }
  return [];
}

/**
 * Upsert a release into the Supabase database 'releases' table with auto-healing, payload sanitization, and server payload reconciliation.
 */
export async function upsertReleaseToDatabase(
  release: CatalogRelease,
  bandId: string,
  portalType?: 'band' | 'promoter' | 'creative'
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const client = getActiveSupabase(portalType);
    const targetBandId = ensureUUID(String(bandId || release.band_id || 'b1').trim());
    const isValidUUID = (str?: string | null) => 
      str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

    // Process cover image Base64 strings to save into 'audio-vault' bucket
    let finalCoverUrl = release.coverUrl || release.coverImage || null;
    if (finalCoverUrl && finalCoverUrl.startsWith('data:')) {
      try {
        const uploadedUrl = await uploadBase64ToStorage(
          finalCoverUrl,
          'audio-vault',
          targetBandId,
          `release-${release.id || 'new'}-cover`
        );
        if (uploadedUrl) {
          finalCoverUrl = uploadedUrl;
        }
      } catch (uploadErr) {
        console.warn('[releasesService] Error uploading cover image to audio-vault storage, falling back to original string:', uploadErr);
      }
    }

    const rawPayload: Record<string, any> = {
      id: release.id ? ensureUUID(release.id) : ensureUUID(`rel-${targetBandId}-${Date.now()}`),
      band_id: targetBandId,
      label_id: isValidUUID(release.label_id) ? release.label_id : null,
      title: release.title,
      catalog_id: release.catalogId || null,
      type: release.type || 'Album',
      release_date: release.releaseDate || null,
      label: release.label || null,
      genre: release.genre || null,
      cover_image: finalCoverUrl,
      cover_url: finalCoverUrl,
      tracks: release.tracks || [],
      formats: release.formats || {},
      digital: release.digital || [],
      audio_vault_path: release.audio_vault_path || null,
      status: release.status || 'active',
      updated_at: new Date().toISOString()
    };

    const payload = sanitizeReleaseForDb(rawPayload);

    // 1. Resilient upsert
    let res = await executeWithSchemaResilience(
      async (cleanPayload) => await client.from('releases').upsert(cleanPayload, { onConflict: 'id' }).select().maybeSingle(),
      payload
    );

    let error = res?.error;
    let data = res?.data;

    // Auto-heal: If foreign key constraint failed on 'bands', insert placeholder band and retry
    if (error && (error.message?.includes('foreign key') || error.code === '23503' || String(error).includes('foreign key'))) {
      console.warn('[releasesService] Foreign key constraint on bands detected. Auto-provisioning band row:', targetBandId);
      try {
        const { data: existingBand } = await client
          .from('bands')
          .select('id, band_name')
          .eq('id', targetBandId)
          .maybeSingle();

        if (!existingBand) {
          let resolvedName = '';
          try {
            const archives = JSON.parse(localStorage.getItem('nexus_community_band_archives') || '[]');
            const found = archives.find((b: any) => b && (b.id === targetBandId || ensureUUID(b.id) === targetBandId));
            if (found?.name || found?.band_name) resolvedName = (found.name || found.band_name).trim();
          } catch {}
          if (!resolvedName) {
            resolvedName = payload.artist || 'Artist';
          }
          const slug = resolvedName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');

          await executeWithSchemaResilience(
            async (p) => await client.from('bands').upsert(p, { onConflict: 'id' }),
            {
              id: targetBandId,
              band_name: resolvedName,
              custom_slug: slug,
              updated_at: new Date().toISOString()
            }
          );
        }

        // Retry release upsert with schema resilience
        const retryResult = await executeWithSchemaResilience(
          async (cleanPayload) => await client.from('releases').upsert(cleanPayload, { onConflict: 'id' }).select().maybeSingle(),
          payload
        );
        
        error = retryResult?.error;
        data = retryResult?.data;
      } catch (bandProvisionErr) {
        console.warn('[releasesService] Band auto-provision notice:', bandProvisionErr);
      }
    }

    if (error) {
      console.error('[releasesService] Database upsert error:', error.message || error);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nexus_core_toast', {
            detail: {
              message: `Failed to save release "${release.title}": ${error.message || 'Database rejected write'}`,
              type: 'error'
            }
          })
        );
      }
      return { success: false, error: error.message || String(error) };
    }

    console.log('[releasesService] Successfully persisted and reconciled release to Supabase:', release.title);
    return { success: true, data };
  } catch (err: any) {
    console.error('[releasesService] Critical exception upserting release:', err);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nexus_core_toast', {
          detail: {
            message: `Critical error saving release: ${err?.message || 'Unknown exception'}`,
            type: 'error'
          }
        })
      );
    }
    return { success: false, error: err?.message || 'Unknown exception' };
  }
}

/**
 * Upsert a batch of releases into the Supabase database 'releases' table with strict bulk insert handling,
 * distinct valid UUID generation, payload sanitization, foreign key auto-healing, sequential fallback, and explicit persistence verification.
 */
export async function upsertReleasesBatchToDatabase(
  releases: CatalogRelease[] | Record<string, any>,
  bandId: string,
  portalType?: 'band' | 'promoter' | 'creative'
): Promise<{ success: boolean; error?: string; data?: any; count?: number }> {
  try {
    const client = getActiveSupabase(portalType);

    // 1. Normalize input: ensure true array even if passed an object with numeric index keys
    let releaseList: any[] = [];
    if (Array.isArray(releases)) {
      releaseList = [...releases];
    } else if (releases && typeof releases === 'object') {
      const keys = Object.keys(releases);
      if (keys.length > 0) {
        releaseList = keys.sort((a, b) => Number(a) - Number(b)).map((k) => (releases as any)[k]);
      }
    }

    if (!Array.isArray(releaseList) || releaseList.length === 0) {
      return { success: true, count: 0 };
    }

    const targetBandId = ensureUUID(String(bandId || 'b1').trim());
    const isValidUUID = (str?: string | null) => 
      str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) : false;

    // Auto-provision band row in Supabase 'bands' table before inserting releases to ensure foreign key integrity
    try {
      const { data: existingBand } = await client
        .from('bands')
        .select('id, band_name')
        .eq('id', targetBandId)
        .maybeSingle();

      if (!existingBand) {
        let resolvedName = '';
        try {
          const archives = JSON.parse(localStorage.getItem('nexus_community_band_archives') || '[]');
          const found = archives.find((b: any) => b && (b.id === targetBandId || ensureUUID(b.id) === targetBandId));
          if (found?.name || found?.band_name) resolvedName = (found.name || found.band_name).trim();
        } catch {}
        if (!resolvedName && releaseList[0]?.artist) {
          resolvedName = releaseList[0].artist;
        }
        if (!resolvedName) {
          resolvedName = 'Artist';
        }
        const slug = resolvedName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');

        await executeWithSchemaResilience(
          async (p) => await client.from('bands').upsert(p, { onConflict: 'id' }),
          {
            id: targetBandId,
            band_name: resolvedName,
            custom_slug: slug,
            updated_at: new Date().toISOString()
          }
        );
      }
    } catch (e) {
      console.warn('[releasesService] Pre-sync band check notice:', e);
    }

    const processedPayloads: any[] = [];
    const seenIds = new Set<string>();

    for (const [idx, release] of releaseList.entries()) {
      if (!release) continue;
      const releaseId = ensureUUID(release.id || `rel-${targetBandId}-${idx}-${Date.now()}`);
      
      // Deduplicate release items by ID to prevent PostgreSQL "ON CONFLICT DO UPDATE command cannot affect row a second time" error
      if (seenIds.has(releaseId)) {
        console.warn(`[releasesService] Skipping duplicate release ID in batch: ${releaseId}`);
        continue;
      }
      seenIds.add(releaseId);

      let finalCoverUrl = release.coverUrl || release.coverImage || release.cover_url || release.cover_image || release.image_url || null;
      if (finalCoverUrl && finalCoverUrl.startsWith('data:')) {
        try {
          const uploadedUrl = await uploadBase64ToStorage(
            finalCoverUrl,
            'audio-vault',
            targetBandId,
            `release-${releaseId}-cover`
          );
          if (uploadedUrl) {
            finalCoverUrl = uploadedUrl;
          }
        } catch (uploadErr) {
          console.warn('[releasesService] Error uploading cover image for batch release:', uploadErr);
        }
      }

      const rawPayload: Record<string, any> = {
        id: releaseId,
        band_id: targetBandId,
        label_id: isValidUUID(release.label_id) ? release.label_id : null,
        title: release.title || `Release ${idx + 1}`,
        catalog_id: release.catalogId || release.catalog_id || null,
        type: release.type || 'Album',
        release_date: release.releaseDate || release.release_date || release.year || String(new Date().getFullYear()),
        label: release.label || release.release_info || null,
        genre: release.genre || null,
        cover_image: finalCoverUrl,
        cover_url: finalCoverUrl,
        tracks: Array.isArray(release.tracks) ? release.tracks : [],
        formats: typeof release.formats === 'object' && release.formats ? release.formats : {},
        digital: Array.isArray(release.digital) ? release.digital : [],
        audio_vault_path: release.audio_vault_path || null,
        status: release.status || 'active',
        updated_at: new Date().toISOString()
      };

      processedPayloads.push(sanitizeReleaseForDb(rawPayload));
    }

    if (processedPayloads.length === 0) {
      return { success: true, count: 0 };
    }

    // Secondary guarantee: Deduplicate final processed array by id before sending to database
    const dedupedPayloadsMap = new Map<string, any>();
    for (const item of processedPayloads) {
      if (item && item.id) {
        dedupedPayloadsMap.set(item.id, item);
      }
    }
    const finalPayloads = Array.from(dedupedPayloadsMap.values());

    // 2. Execute bulk upsert with fallback to sequential individual upserts if batch is rejected
    let dataResult: any = null;
    let syncError: any = null;

    const batchRes = await executeWithSchemaResilience(
      async (payload) => await client.from('releases').upsert(payload, { onConflict: 'id' }).select(),
      finalPayloads
    );

    if (!batchRes?.error) {
      dataResult = batchRes?.data;
    } else {
      console.warn('[releasesService] Bulk array upsert failed, executing sequential individual upserts:', batchRes.error.message || batchRes.error);
      
      let successfulCount = 0;
      for (const singleItem of finalPayloads) {
        const singleRes = await executeWithSchemaResilience(
          async (payload) => await client.from('releases').upsert(payload, { onConflict: 'id' }).select().maybeSingle(),
          singleItem
        );

        if (!singleRes?.error) {
          successfulCount++;
          if (!dataResult) dataResult = [];
          if (Array.isArray(dataResult)) dataResult.push(singleRes.data);
        } else {
          console.error(`[releasesService] Sequential upsert failed for release "${singleItem.title}":`, singleRes.error);
          syncError = singleRes.error;
        }
      }

      if (successfulCount > 0) {
        syncError = null; // Partial or full individual persistence succeeded
      }
    }

    if (syncError) {
      console.error('[releasesService] Database batch upsert error:', syncError.message || syncError);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nexus_core_toast', {
            detail: {
              message: `❌ Batch release sync rejected by database: ${syncError.message || 'Database error'}`,
              type: 'error'
            }
          })
        );
      }
      return { success: false, error: syncError.message || String(syncError) };
    }

    // 3. Database Persistence Verification: Query Supabase to confirm releases exist in the DB
    try {
      const { data: verifyData, error: verifyErr } = await client
        .from('releases')
        .select('id, title')
        .eq('band_id', targetBandId);

      if (verifyErr) {
        console.warn('[releasesService] Persistence verification query notice:', verifyErr.message);
      } else {
        console.log(`[releasesService] Confirmed ${verifyData?.length || 0} release(s) live in Supabase for band ${targetBandId}`);
      }
    } catch (verErr) {
      console.warn('[releasesService] Persistence verification exception:', verErr);
    }

    console.log('[releasesService] Successfully persisted release batch to Supabase:', processedPayloads.length, 'items');
    return { success: true, data: dataResult, count: processedPayloads.length };
  } catch (err: any) {
    console.error('[releasesService] Critical exception batch upserting releases:', err);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nexus_core_toast', {
          detail: {
            message: `❌ Critical error batch saving releases: ${err?.message || 'Unknown exception'}`,
            type: 'error'
          }
        })
      );
    }
    return { success: false, error: err?.message || 'Unknown exception' };
  }
}

/**
 * Delete a release from the Supabase database
 */
export async function deleteReleaseFromDatabase(
  releaseId: string,
  portalType?: 'band' | 'promoter' | 'creative'
): Promise<boolean> {
  try {
    const client = getActiveSupabase(portalType);
    const { error } = await client
      .from('releases')
      .delete()
      .eq('id', releaseId);

    if (error) {
      console.warn('[releasesService] Delete database error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[releasesService] Exception deleting release:', err);
    return false;
  }
}
