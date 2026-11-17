import { useState, useEffect, useCallback } from 'react';
import { getOfflineQueue, processOfflineQueue, enqueueOfflineAction, generateUUID } from '../supabase';

export function enqueuePendingMutation(
  endpoint: string,
  action: 'insert' | 'update' | 'delete' | 'upsert',
  payload: any,
  filters?: { column: string; value: any }[]
) {
  enqueueOfflineAction({
    id: generateUUID(),
    table: endpoint,
    action: action as any,
    payload,
    eqFilters: filters || [],
    timestamp: new Date().toISOString()
  });
}

export function useOfflineSync(onSyncSuccess?: (msg: string) => void) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queueLength, setQueueLength] = useState<number>(() => getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue().then(() => {
        if (onSyncSuccess) onSyncSuccess('Cloud synchronization complete!');
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.queueLength === 'number') {
        setQueueLength(customEvent.detail.queueLength);
      } else {
        setQueueLength(getOfflineQueue().length);
      }
    };

    const handleSyncStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.syncing === 'boolean') {
        setIsSyncing(customEvent.detail.syncing);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('nexus_core_offline_queue_changed', handleQueueChange);
    window.addEventListener('nexus_core_offline_sync_status_changed', handleSyncStatus);

    // Initial check & run
    setIsOnline(navigator.onLine);
    setQueueLength(getOfflineQueue().length);
    if (navigator.onLine) {
      processOfflineQueue().then(() => {
        // Initial sync if online
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('nexus_core_offline_queue_changed', handleQueueChange);
      window.removeEventListener('nexus_core_offline_sync_status_changed', handleSyncStatus);
    };
  }, [onSyncSuccess]);

  const addMutation = useCallback((
    endpoint: string,
    action: 'insert' | 'update' | 'delete' | 'upsert',
    payload: any,
    filters?: { column: string; value: any }[]
  ) => {
    enqueuePendingMutation(endpoint, action, payload, filters);
  }, []);

  return {
    isOnline,
    queueLength,
    isSyncing,
    addMutation,
    syncNow: () => processOfflineQueue()
  };
}
