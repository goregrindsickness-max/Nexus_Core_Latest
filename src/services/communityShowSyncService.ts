import { getSupabase, ensureValidSupabaseAuthSession } from './clientService';
import {
  sanitizeShowForDb,
  executeWithSchemaResilience,
  generateUUID,
  ensureUUID,
} from './schemaResilienceService';
import { enqueueOfflineAction } from './offlineSyncService';
import { uploadBase64ToStorage } from './storageService';
import { showsStore } from '../utils/indexedDB';
import { isShowEmbargoedOrDraft } from '../utils/showDisplayUtils';

const EXTENDED_SHOWS_KEY = 'nexus_core_shows_extended';
const CREATED_SHOW_IDS_KEY = 'nexus_created_show_ids';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLACEHOLDER_CREATOR_IDS = new Set([
  '00000000-0000-4000-a000-000000000000',
  '00000000-0000-4000-a000-000000000001',
  '5403162d-1947-43aa-b5f6-38a1bd2a1b80',
  ensureUUID('community_curator'),
]);

function safeReadExtendedMap(): Record<string, any> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(EXTENDED_SHOWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function safeWriteExtendedMap(map: Record<string, any>) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(EXTENDED_SHOWS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('[CommunityShowSync] Failed writing nexus_core_shows_extended:', e);
  }
}

function safeReadCreatedIds(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CREATED_SHOW_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function markExtendedSyncState(showId: string, showPayload: any, pending: boolean, errorMsg?: string) {
  const map = safeReadExtendedMap();
  const existing = map[showId] || {};
  const merged = {
    ...existing,
    ...showPayload,
    id: showId,
    _pendingCloudSync: pending,
  };
  if (pending) {
    merged._lastSyncError = errorMsg || 'Pending cloud sync';
  } else {
    delete merged._lastSyncError;
    merged._syncedToCloudAt = new Date().toISOString();
  }
  map[showId] = merged;
  safeWriteExtendedMap(map);
}

async function resolveAuthenticatedCreatorId(
  sb: any,
  preferredCreatorId?: string
): Promise<{ authUserId: string | null; hasActiveSession: boolean }> {
  try {
    const session = await ensureValidSupabaseAuthSession(sb);
    const sessionUid = session?.user?.id || null;
    if (sessionUid && UUID_REGEX.test(sessionUid)) {
      return { authUserId: sessionUid, hasActiveSession: true };
    }
  } catch (_) {}

  try {
    const { data } = await sb.auth.getUser();
    const uid = data?.user?.id || null;
    if (uid && UUID_REGEX.test(uid)) {
      return { authUserId: uid, hasActiveSession: true };
    }
  } catch (_) {}

  if (preferredCreatorId && UUID_REGEX.test(preferredCreatorId) && !PLACEHOLDER_CREATOR_IDS.has(preferredCreatorId.toLowerCase())) {
    return { authUserId: preferredCreatorId, hasActiveSession: false };
  }

  return { authUserId: null, hasActiveSession: false };
}

export interface SyncCommunityShowResult {
  synced: boolean;
  error: any | null;
  showId: string;
  queuedOffline: boolean;
}

/**
 * Authoritatively syncs a community-submitted show to Supabase `shows` with:
 * 1. Pre-flight session refresh (critical on Capacitor Android APK after resume)
 * 2. Real `auth.uid()` creator_id stamping so Harden RLS checks pass
 * 3. Flyer base64 upload fallback to allowed `feed_media` bucket
 * 4. `executeWithSchemaResilience` to tolerate schema drift
 * 5. Automatic offline queue & `_pendingCloudSync` flagging on any failure
 */
export async function syncCommunityShowToCloud(
  rawShow: any,
  options?: { userProfileId?: string; skipOfflineQueue?: boolean }
): Promise<SyncCommunityShowResult> {
  const showId = ensureUUID(rawShow?.id || generateUUID());
  const sb = getSupabase();

  if (!sb) {
    markExtendedSyncState(showId, rawShow, true, 'Supabase client not configured');
    if (!options?.skipOfflineQueue) {
      enqueueOfflineAction({
        id: generateUUID(),
        table: 'shows',
        action: 'upsert',
        payload: sanitizeShowForDb({ ...rawShow, id: showId }),
        eqFilters: [],
        timestamp: new Date().toISOString(),
      });
    }
    return {
      synced: false,
      error: { message: 'Supabase client unavailable' },
      showId,
      queuedOffline: !options?.skipOfflineQueue,
    };
  }

  const { authUserId, hasActiveSession } = await resolveAuthenticatedCreatorId(
    sb,
    rawShow?.creator_id || options?.userProfileId
  );

  // Use the authenticated user's UID whenever available so RLS creator_id = auth.uid() passes.
  const resolvedCreatorId = authUserId
    ? ensureUUID(authUserId)
    : ensureUUID(rawShow?.creator_id || options?.userProfileId || '00000000-0000-4000-a000-000000000000');

  let resolvedFlyerUrl = rawShow?.flyer_url;
  if (typeof resolvedFlyerUrl === 'string' && resolvedFlyerUrl.startsWith('data:image/')) {
    try {
      const uploaded = await uploadBase64ToStorage(resolvedFlyerUrl, 'feed_media', resolvedCreatorId, 'show_flyer');
      if (uploaded && !uploaded.startsWith('data:')) {
        resolvedFlyerUrl = uploaded;
      }
    } catch (_) {}
  }

  const enrichedShow = {
    ...rawShow,
    id: showId,
    creator_id: resolvedCreatorId,
    flyer_url: resolvedFlyerUrl,
    is_community_submitted: rawShow?.is_community_submitted ?? true,
  };

  const pruned = sanitizeShowForDb(enrichedShow);
  // Ensure creator_id matches the active authenticated UID rather than sanitizeShowForDb's hardcoded admin fallback
  if (authUserId) {
    pruned.creator_id = ensureUUID(authUserId);
  }

  if (!hasActiveSession) {
    markExtendedSyncState(showId, enrichedShow, true, 'Waiting for active Supabase auth session');
    if (!options?.skipOfflineQueue) {
      enqueueOfflineAction({
        id: generateUUID(),
        table: 'shows',
        action: 'upsert',
        payload: pruned,
        eqFilters: [],
        timestamp: new Date().toISOString(),
      });
    }
    return {
      synced: false,
      error: { code: 'AUTH_REQUIRED', message: 'Active Supabase session required to publish globally' },
      showId,
      queuedOffline: !options?.skipOfflineQueue,
    };
  }

  try {
    const { error } = await executeWithSchemaResilience(
      async (payload) => await sb.from('shows').upsert([payload]),
      pruned
    );

    if (error) {
      markExtendedSyncState(showId, enrichedShow, true, error.message || 'Supabase upsert failed');
      if (!options?.skipOfflineQueue) {
        enqueueOfflineAction({
          id: generateUUID(),
          table: 'shows',
          action: 'upsert',
          payload: pruned,
          eqFilters: [],
          timestamp: new Date().toISOString(),
        });
      }
      return {
        synced: false,
        error,
        showId,
        queuedOffline: !options?.skipOfflineQueue,
      };
    }

    markExtendedSyncState(showId, enrichedShow, false);
    return {
      synced: true,
      error: null,
      showId,
      queuedOffline: false,
    };
  } catch (err: any) {
    markExtendedSyncState(showId, enrichedShow, true, err?.message || 'Supabase exception');
    if (!options?.skipOfflineQueue) {
      enqueueOfflineAction({
        id: generateUUID(),
        table: 'shows',
        action: 'upsert',
        payload: pruned,
        eqFilters: [],
        timestamp: new Date().toISOString(),
      });
    }
    return {
      synced: false,
      error: err,
      showId,
      queuedOffline: !options?.skipOfflineQueue,
    };
  }
}

/**
 * Reconciles stranded local community shows in `nexus_core_shows_extended` and IndexedDB `showsStore`
 * that were saved locally (e.g. on APK while offline or with an expired JWT) and are missing from
 * Supabase `showsData`. Automatically pushes them once a valid authenticated session is present.
 */
export async function reconcilePendingCommunityShows(
  remoteShows: any[],
  deletedShowIds: Set<string> = new Set()
): Promise<{ attempted: number; syncedCount: number; syncedShows: any[] }> {
  const sb = getSupabase();
  if (!sb) return { attempted: 0, syncedCount: 0, syncedShows: [] };

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { attempted: 0, syncedCount: 0, syncedShows: [] };
  }

  const remoteIds = new Set<string>();
  const remoteSignatures = new Set<string>();
  for (const s of remoteShows || []) {
    if (!s) continue;
    if (s.id) remoteIds.add(String(s.id).toLowerCase().trim());
    const h = String(s.headliner || s.band_name || s.name || s.show_name || '').toLowerCase().trim();
    const d = String(s.date || s.show_date || '').toLowerCase().trim();
    if (h && d) remoteSignatures.add(`${h}__${d}`);
  }

  const extendedMap = safeReadExtendedMap();
  const createdIds = new Set(safeReadCreatedIds().map((id) => String(id).toLowerCase().trim()));
  const candidatesById = new Map<string, any>();

  for (const [key, item] of Object.entries(extendedMap)) {
    if (!item || typeof item !== 'object') continue;
    if (key === 'sh_batch_completed' || (item as any)._isBatch) continue;
    const rawId = String((item as any).id || key || '').trim();
    const normId = rawId.toLowerCase();
    const isLocallyAuthoredCommunity = Boolean(
      (item as any)._pendingCloudSync ||
      ((item as any).is_community_submitted && (createdIds.has(normId) || createdIds.has(ensureUUID(rawId))))
    );
    if (!isLocallyAuthoredCommunity) continue;
    candidatesById.set(ensureUUID(rawId), { ...item, id: ensureUUID(rawId) });
  }

  // Also scan IndexedDB `showsStore` for batch-created community shows that never reached Supabase
  try {
    await showsStore.iterate((val: any) => {
      if (!val || typeof val !== 'object' || Array.isArray(val)) return;
      if ((val as any)._isBatch || val.id === 'sh_batch_completed') return;
      if (val.is_community_submitted === true && val.id) {
        const uid = ensureUUID(String(val.id));
        if (!candidatesById.has(uid)) {
          candidatesById.set(uid, { ...val, id: uid });
        }
      }
    });
  } catch (_) {}

  const toSync: any[] = [];
  for (const [uid, candidate] of candidatesById.entries()) {
    const h = String(candidate.headliner || candidate.band_name || candidate.name || candidate.show_name || '')
      .toLowerCase()
      .trim();
    const d = String(candidate.date || candidate.show_date || '').toLowerCase().trim();
    const sig = h && d ? `${h}__${d}` : '';

    if (deletedShowIds.has(uid.toLowerCase()) || (sig && deletedShowIds.has(sig))) {
      continue;
    }
    if (remoteIds.has(uid.toLowerCase()) || (sig && remoteSignatures.has(sig))) {
      // Already confirmed in Supabase — clear stale pending flag if present
      if (candidate._pendingCloudSync) {
        markExtendedSyncState(uid, candidate, false);
      }
      continue;
    }
    if (isShowEmbargoedOrDraft(candidate)) {
      continue;
    }
    toSync.push(candidate);
  }

  if (toSync.length === 0) {
    return { attempted: 0, syncedCount: 0, syncedShows: [] };
  }

  const { hasActiveSession } = await resolveAuthenticatedCreatorId(sb);
  if (!hasActiveSession) {
    return { attempted: toSync.length, syncedCount: 0, syncedShows: [] };
  }

  let syncedCount = 0;
  const syncedShows: any[] = [];
  for (const item of toSync) {
    const res = await syncCommunityShowToCloud(item, { skipOfflineQueue: true });
    if (res.synced) {
      syncedCount++;
      syncedShows.push(item);
    }
  }

  return { attempted: toSync.length, syncedCount, syncedShows };
}
