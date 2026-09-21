import localforage from 'localforage';
import { getRawSupabase } from './clientService';
import { generateUUID, ensureUUID, sanitizeShowForDb, sanitizeInventoryItemForDb } from './schemaResilienceService';
import { sanitizeBandPayload } from './bandService';
import { sanitizeReleaseForDb } from './releasesService';

export interface OfflineAction {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'upsert' | 'delete';
  payload: any;
  eqFilters: { column: string; value: any }[];
  timestamp: string;
}

// Helper to resolve and ensure band_name is present
export const resolveBandName = (item: any, bandIdFallback?: string): any => {
  if (!item || typeof item !== 'object') return item;
  let bName = (item.band_name || item.name || '').trim();
  const lookupId = item.id || bandIdFallback;
  const rawSlugCandidate = (item.custom_slug || item.slug || '').trim().toLowerCase();

  const KNOWN_SEEDED_NAMES: Record<string, string> = {
    'cordyceps': 'Cordyceps',
    'mortician': 'Mortician',
    'sanguisugabogg': 'Sanguisugabogg',
    'necrophagist': 'Necrophagist',
    'dying-fetus': 'Dying Fetus',
    'devourment': 'Devourment',
    'origin': 'Origin',
    'peelingflesh': 'PeelingFlesh',
    'putrid-pile': 'Putrid Pile',
    'lividity': 'Lividity'
  };

  if ((!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') && rawSlugCandidate && KNOWN_SEEDED_NAMES[rawSlugCandidate]) {
    bName = KNOWN_SEEDED_NAMES[rawSlugCandidate];
  }

  if ((!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') && lookupId) {
    const lId = String(lookupId);
    const lUUID = ensureUUID(lId);

    const findInList = (list: any[]) => {
      return list.find((b: any) => {
        if (!b) return false;
        const bId = b.id ? String(b.id) : '';
        const bUUID = b.id ? ensureUUID(b.id) : '';
        const bSlug = (b.custom_slug || b.slug || '').trim().toLowerCase();
        return bId === lId || bUUID === lUUID || (rawSlugCandidate && bSlug === rawSlugCandidate);
      });
    };

    try {
      const archives = JSON.parse(localStorage.getItem('nexus_community_band_archives') || '[]');
      const found = findInList(archives);
      if (found?.name || found?.band_name) {
        const n = (found.name || found.band_name).trim();
        if (n && n.toLowerCase() !== 'underground label' && n.toLowerCase() !== 'nexus artist') bName = n;
      }
    } catch {}
    if (!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') {
      try {
        const allCommunity = JSON.parse(localStorage.getItem('nexus_community_bands_v2') || '[]');
        const found = findInList(allCommunity);
        if (found?.name || found?.band_name) {
          const n = (found.name || found.band_name).trim();
          if (n && n.toLowerCase() !== 'underground label' && n.toLowerCase() !== 'nexus artist') bName = n;
        }
      } catch {}
    }
    if (!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') {
      try {
        const registered = JSON.parse(localStorage.getItem('nexus_registered_bands') || '[]');
        const found = findInList(registered);
        if (found?.name || found?.band_name) {
          const n = (found.name || found.band_name).trim();
          if (n && n.toLowerCase() !== 'underground label' && n.toLowerCase() !== 'nexus artist') bName = n;
        }
      } catch {}
    }
    if (!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') {
      try {
        const activeBandRaw = localStorage.getItem('nexus_active_band');
        if (activeBandRaw) {
          const parsed = JSON.parse(activeBandRaw);
          if (parsed?.name || parsed?.band_name) {
            const n = (parsed.name || parsed.band_name).trim();
            if (n && n.toLowerCase() !== 'underground label' && n.toLowerCase() !== 'nexus artist') bName = n;
          }
        }
      } catch {}
    }
  }

  if ((!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') && rawSlugCandidate) {
    bName = KNOWN_SEEDED_NAMES[rawSlugCandidate] || rawSlugCandidate
      .split('-')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  item.band_name = bName || 'Nexus Artist';
  delete item.name;
  return sanitizeBandPayload(item);
};

export function isNetworkOrConnectivityError(err: any): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  if (!err) return false;

  const message = (err.message || '').toLowerCase();
  const code = (err.code || '').toLowerCase();
  const status = Number(err.status || err.statusCode);

  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('load failed') ||
    message.includes('failed to fetch') ||
    message.includes('cors') ||
    message.includes('unreachable') ||
    message.includes('egress') ||
    message.includes('quota') ||
    message.includes('exceed') ||
    message.includes('rate limit') ||
    message.includes('bypass') ||
    status === 0 ||
    status === 402 || // Payment Required / Egress Limit
    status === 429 || // Too Many Requests / Rate Limited
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status >= 500 || // Server-side retryable errors
    code === 'fetch_error' ||
    code === 'network_error' ||
    code.includes('egress') ||
    code.includes('quota')
  ) {
    return true;
  }
  return false;
}

export const offlineQueueStore = localforage.createInstance({
  name: 'NexusCore_Offline_DB',
  storeName: 'offline_queue',
});

let memoryQueue: OfflineAction[] = [];
let memoryQueueInitialized = false;

export async function initOfflineQueue() {
  if (memoryQueueInitialized) return;
  try {
    const fromIdb = await offlineQueueStore.getItem<OfflineAction[]>('queue');
    if (fromIdb) {
      memoryQueue = fromIdb;
    } else {
      let raw = null;
      try {
        raw = localStorage.getItem('nexus_core_offline_write_queue');
      } catch (e) {}
      if (raw) {
        memoryQueue = JSON.parse(raw);
        await offlineQueueStore.setItem('queue', memoryQueue);
        try {
          localStorage.removeItem('nexus_core_offline_write_queue');
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Failed to init offline queue from IDB', e);
  }
  memoryQueueInitialized = true;
}

export function getOfflineQueue(): OfflineAction[] {
  return memoryQueue;
}

export function saveOfflineQueue(queue: OfflineAction[]) {
  memoryQueue = queue;
  offlineQueueStore
    .setItem('queue', queue)
    .catch((e) => console.error('Error saving offline write queue to IDB:', e));
}

export function normalizeArrayPayload(raw: any): any {
  if (!raw) return raw;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') {
    const keys = Object.keys(raw);
    if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
      return keys.sort((a, b) => Number(a) - Number(b)).map((k) => raw[k]);
    }
  }
  return raw;
}

export function enqueueOfflineAction(action: OfflineAction) {
  const queue = getOfflineQueue();
  const normalizedPayload = normalizeArrayPayload(action.payload);
  const cleanAction: OfflineAction = {
    ...action,
    payload: normalizedPayload
  };

  const isDuplicate = (queue || []).some(
    (q) =>
      q.table === cleanAction.table &&
      q.action === cleanAction.action &&
      JSON.stringify(q.eqFilters) === JSON.stringify(cleanAction.eqFilters) &&
      JSON.stringify(q.payload) === JSON.stringify(cleanAction.payload)
  );
  if (!isDuplicate) {
    queue.push(cleanAction);
    saveOfflineQueue(queue);
    console.log(
      `[Offline Sync Queue] Enqueued action: ${cleanAction.action} on ${cleanAction.table}. Total actions pending: ${queue.length}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nexus_core_offline_queue_changed', { detail: { queueLength: queue.length } })
      );
    }
  }
}

let isSyncing = false;

export async function processOfflineQueue(): Promise<void> {
  if (isSyncing) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  const rawSupabase = getRawSupabase();
  if (!rawSupabase) return;

  isSyncing = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nexus_core_offline_sync_status_changed', { detail: { syncing: true } })
    );
  }
  console.log(`[Offline Sync Queue] Online connection state active! Syncing ${queue.length} actions...`);

  const pendingActions = [...queue];
  const activeQueue: OfflineAction[] = [];

  for (const action of pendingActions) {
    try {
      let builder = rawSupabase.from(action.table);
      let payload = normalizeArrayPayload(action.payload);

      if (action.table === 'shows' && payload) {
        payload = Array.isArray(payload) ? payload.map(sanitizeShowForDb) : sanitizeShowForDb(payload);
      } else if (action.table === 'inventory' && payload) {
        payload = Array.isArray(payload) ? payload.map(sanitizeInventoryItemForDb) : sanitizeInventoryItemForDb(payload);
      } else if (action.table === 'bands' && payload) {
        const filterId = action.eqFilters?.find((f) => f.column === 'id')?.value;
        payload = Array.isArray(payload)
          ? payload.map((item) => resolveBandName(item, filterId))
          : resolveBandName(payload, filterId);
      } else if (action.table === 'releases' && payload) {
        payload = Array.isArray(payload) ? payload.map(sanitizeReleaseForDb) : sanitizeReleaseForDb(payload);
      }

      // Handle Array payloads with bulk execution + sequential individual fallback
      if (Array.isArray(payload)) {
        let cleanArray = payload.filter(Boolean);
        if (cleanArray.length === 0) continue;

        // Deduplicate array items by ID to prevent PostgreSQL "ON CONFLICT DO UPDATE command cannot affect row a second time" error
        const seenIds = new Set<string>();
        const dedupedArray: any[] = [];
        for (const item of cleanArray) {
          if (item && typeof item === 'object' && item.id) {
            if (seenIds.has(item.id)) {
              console.warn(`[Offline Sync Queue] Filtered duplicate item id '${item.id}' from batch on '${action.table}'`);
              continue;
            }
            seenIds.add(item.id);
          }
          dedupedArray.push(item);
        }
        cleanArray = dedupedArray;

        let batchError: any = null;

        if (action.action === 'insert') {
          const { error } = await rawSupabase.from(action.table).insert(cleanArray);
          batchError = error;
        } else if (action.action === 'upsert') {
          const { error } = await rawSupabase.from(action.table).upsert(cleanArray, { onConflict: 'id' });
          batchError = error;
        }

        if (batchError) {
          if (isNetworkOrConnectivityError(batchError)) {
            console.warn(`[Offline Sync Queue] Network issue during batch sync on '${action.table}'. Pausing queue.`);
            activeQueue.push(...pendingActions.slice(pendingActions.indexOf(action)));
            break;
          }

          console.warn(`[Offline Sync Queue] Bulk operation rejected on '${action.table}', falling back to sequential item requests:`, batchError.message);

          // Sequential fallback for array elements
          let anySucceeded = false;
          for (const item of cleanArray) {
            let singleRes: any;
            if (action.action === 'insert') {
              singleRes = await rawSupabase.from(action.table).insert(item);
            } else if (action.action === 'upsert') {
              singleRes = await rawSupabase.from(action.table).upsert(item, { onConflict: 'id' });
            }

            if (singleRes?.error) {
              if (isNetworkOrConnectivityError(singleRes.error)) {
                activeQueue.push(...pendingActions.slice(pendingActions.indexOf(action)));
                break;
              }
              console.error(`[Offline Sync Queue] Sequential item error on '${action.table}':`, singleRes.error);
            } else {
              anySucceeded = true;
            }
          }

          if (anySucceeded) {
            console.log(`[Offline Sync Queue] Successfully synchronized item(s) sequentially on ${action.table}`);
          }
        } else {
          console.log(`[Offline Sync Queue] Synchronized batch action successfully: ${action.action} on table ${action.table} (${cleanArray.length} items)`);
        }

        continue;
      }

      // Single object processing
      let resPromise: any;
      if (action.action === 'insert') {
        resPromise = builder.insert(payload);
      } else if (action.action === 'update') {
        resPromise = builder.update(payload);
      } else if (action.action === 'upsert') {
        resPromise = builder.upsert(payload);
      } else if (action.action === 'delete') {
        resPromise = builder.delete();
      } else {
        continue;
      }

      if (action.eqFilters && action.eqFilters.length > 0) {
        action.eqFilters.forEach((filter) => {
          resPromise = resPromise.eq(filter.column, filter.value);
        });
      }

      const { error } = await resPromise;

      if (error) {
        if (isNetworkOrConnectivityError(error)) {
          console.warn(
            `[Offline Sync Queue] Network / connectivity error encountered while processing. Pausing queue.`,
            error
          );
          activeQueue.push(...pendingActions.slice(pendingActions.indexOf(action)));
          break;
        }
        console.error(`[Offline Sync Queue] Non-retryable database/schema error on sync item [${action.table} / ${action.action}]:`, error, action);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('nexus_core_toast', {
              detail: {
                message: `Sync notice on ${action.table} (${action.action}): ${error.message || 'Schema or constraint mismatch'}`,
                type: 'error'
              }
            })
          );
        }
      } else {
        console.log(`[Offline Sync Queue] Synchronized action successfully: ${action.action} on table ${action.table}`);
      }
    } catch (err) {
      console.error(`[Offline Sync Queue] Exception during sequence execution:`, err);
      if (isNetworkOrConnectivityError(err)) {
        activeQueue.push(...pendingActions.slice(pendingActions.indexOf(action)));
        break;
      }
    }
  }

  saveOfflineQueue(activeQueue);
  isSyncing = false;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nexus_core_offline_queue_changed', { detail: { queueLength: activeQueue.length } })
    );
    window.dispatchEvent(
      new CustomEvent('nexus_core_offline_sync_status_changed', { detail: { syncing: false } })
    );
  }
}

export function wrapQueryBuilder(realBuilder: any, table: string): any {
  let action: 'insert' | 'update' | 'upsert' | 'delete' | 'select' | null = null;
  let payload: any = null;
  const eqFilters: { column: string; value: any }[] = [];

  const handler: ProxyHandler<any> = {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (onfulfilled?: any, onrejected?: any) => {
          const isWrite = action && ['insert', 'update', 'upsert', 'delete'].includes(action);
          const promise = target;
          return promise.then(
            (result: any) => {
              if (isWrite && isNetworkOrConnectivityError(result?.error)) {
                console.warn(
                  `[Offline Queue] Direct connection failed for ${action} on '${table}'. Enqueuing offline write packet.`
                );

                enqueueOfflineAction({
                  id: generateUUID(),
                  table,
                  action: action as any,
                  payload,
                  eqFilters,
                  timestamp: new Date().toISOString(),
                });

                const dummyResult = { error: null, data: payload, count: 1 };
                return onfulfilled ? onfulfilled(dummyResult) : dummyResult;
              }
              return onfulfilled ? onfulfilled(result) : result;
            },
            (err: any) => {
              if (isWrite && isNetworkOrConnectivityError(err)) {
                console.warn(
                  `[Offline Queue] Intercepted throwing connectivity issue for ${action} on '${table}'. Enqueuing offline write packet.`,
                  err
                );

                enqueueOfflineAction({
                  id: generateUUID(),
                  table,
                  action: action as any,
                  payload,
                  eqFilters,
                  timestamp: new Date().toISOString(),
                });

                const dummyResult = { error: null, data: payload, count: 1 };
                return onfulfilled ? onfulfilled(dummyResult) : dummyResult;
              }
              return onrejected ? onrejected(err) : Promise.reject(err);
            }
          );
        };
      }

      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return (...args: any[]) => {
          if (prop === 'insert') {
            action = 'insert';
            payload = Array.isArray(args[0]) ? [...args[0]] : normalizeArrayPayload(args[0]);
          } else if (prop === 'update') {
            action = 'update';
            payload = Array.isArray(args[0]) ? [...args[0]] : normalizeArrayPayload(args[0]);
          } else if (prop === 'upsert') {
            action = 'upsert';
            payload = Array.isArray(args[0]) ? [...args[0]] : normalizeArrayPayload(args[0]);
          } else if (prop === 'delete') {
            action = 'delete';
          } else if (prop === 'eq') {
            eqFilters.push({ column: args[0], value: args[1] });
          }

          if (table === 'bands' && payload && (prop === 'insert' || prop === 'update' || prop === 'upsert')) {
            const filterId = eqFilters.find((f) => f.column === 'id')?.value;
            payload = Array.isArray(payload)
              ? payload.map((item) => resolveBandName(item, filterId))
              : resolveBandName(payload, filterId);
          }

          const nextResult = val.apply(target, args);
          return wrapQueryBuilder(nextResult, table);
        };
      }

      return val;
    }
  };

  return new Proxy(realBuilder, handler);
}

/**
 * Checks if a Supabase error or throw suggests that a database egress/network bypass is required
 */
export function isBypassRequiredError(error: any): boolean {
  if (!error) return false;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }

  const msg = String(error.message || '').toLowerCase();
  const status = Number(error.status || error.statusCode);
  const code = String(error.code || '');

  if (
    status === 402 || // Payment Required
    status === 411 || // Length Required (blocked by Cloudflare/gateway constraints)
    status === 429 || // Too many requests or rate-limited limits
    status === 0 || // Failed network socket connection
    status >= 400 || // ANY gateway / client limitation or error in this sandbox
    status >= 500 || // Gateway timeout / server failures
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('cors') ||
    msg.includes('blocked') ||
    msg.includes('lock') ||
    msg.includes('failed to fetch') ||
    msg.includes('egress') ||
    msg.includes('quota') ||
    msg.includes('exceed') ||
    msg.includes('rate limit') ||
    msg.includes('bypass') ||
    code.includes('network') ||
    code.includes('fetch') ||
    code.includes('egress') ||
    code.includes('quota')
  ) {
    return true;
  }
  return false;
}

/**
 * Handles database failover by returning fallback data.
 */
export function handleDatabaseFailover(tableName: string, fallbackData: any[]): any[] {
  return fallbackData;
}

/**
 * Dynamically serializes successfully loaded database records to local cache failover slots.
 */
export function saveToFailoverCache(tableName: string, freshData: any[]): void {
  // Disabled as per user request to remove fallback logic entirely
}

// Background scheduling triggers for instant auto-resilience
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Offline Sync Engine] Browser went online! Executing queue sync.');
    processOfflineQueue().then();
  });

  setInterval(() => {
    processOfflineQueue().then();
  }, 15000);

  setTimeout(() => {
    processOfflineQueue().then();
  }, 1000);
}
