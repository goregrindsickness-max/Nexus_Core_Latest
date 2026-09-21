import { useEffect, useRef, useCallback } from 'react';
import { subscribeToTable } from '../../../supabase';
import { syncPostToSupabase } from '../utils/postSyncUtils';
import {
  loadFeedCache,
  saveFeedCache,
  loadProfileIndexedDBCache,
  loadProfileLocalStorageCache
} from '../utils/feedCacheUtils';
import { profileStore, socialFeedStore } from '../../../utils/indexedDB';

export interface UseSocialFeedSyncParams {
  userProfile?: any;
  portalRole?: string;
  setChats?: React.Dispatch<React.SetStateAction<any[]>>;
  setNotifications?: React.Dispatch<React.SetStateAction<any[]>>;
  loadChatsFromSupabase?: () => void;
  refetchChats?: () => void;
  triggerNotification?: (msg: string) => void;
  feed?: any[];
}

export function useSocialFeedSync({
  userProfile,
  portalRole,
  setChats,
  setNotifications,
  loadChatsFromSupabase,
  refetchChats,
  triggerNotification,
  feed
}: UseSocialFeedSyncParams = {}) {
  const isIncomingNotifSync = useRef(false);

  // Real-time Supabase subscriptions for chats and notifications
  useEffect(() => {
    if (!userProfile?.email && !setChats && !setNotifications) return;
    let active = true;

    const unsubChats = subscribeToTable('nexus_chats', () => {
      if (!active) return;
      loadChatsFromSupabase?.();
    });

    const handleCustomSync = () => {
      if (!active) return;
      loadChatsFromSupabase?.();
      refetchChats?.();
    };

    const handleChatReadSync = (e: any) => {
      if (!active) return;
      const readChatId = e.detail?.chatId;
      if (readChatId && setChats) {
        const lower = String(readChatId).toLowerCase().trim();
        setChats(prev => prev.map(c => {
          const isMatch = c.id === readChatId ||
            String(c.id).toLowerCase().trim() === lower ||
            ((c as any).contactId && String((c as any).contactId).toLowerCase().trim() === lower) ||
            ((c as any).email && String((c as any).email).toLowerCase().trim() === lower);
          return isMatch ? { ...c, unread: 0 } : c;
        }));
      }
      refetchChats?.();
    };

    const handleAllReadSync = () => {
      if (!active) return;
      if (setChats) setChats(prev => prev.map(c => ({ ...c, unread: 0 })));
      if (setNotifications) setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
      refetchChats?.();
    };

    window.addEventListener('nexus_chats_updated', handleCustomSync);
    window.addEventListener('nexus_chat_read', handleChatReadSync);
    window.addEventListener('nexus_all_read', handleAllReadSync);

    const unsubNotifs = subscribeToTable('nexus_notifications', (payload) => {
      if (!active) return;
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const raw = payload.new as any;
        if (!raw) return;
        const matchesUser = !raw.user_id || raw.user_id === userProfile?.id || raw.user_id === userProfile?.email;
        if (matchesUser) {
          try {
            isIncomingNotifSync.current = true;
            const notifRow = {
              ...raw,
              id: raw.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
              message: raw.message || raw.content || raw.title || '',
              category: raw.category || raw.type || 'SYSTEM',
              read: raw.is_read ?? raw.read ?? false,
              is_read: raw.is_read ?? raw.read ?? false,
            };
            if (setNotifications) {
              setNotifications(prev => {
                const exists = (prev || []).some(n => n.id === notifRow.id);
                if (exists) return prev;
                if (!notifRow.is_read) {
                  queueMicrotask(() => {
                    triggerNotification?.(`🔔 ${notifRow.title || 'Notification'}: ${notifRow.message}`);
                  });
                }
                return [notifRow, ...(prev || [])];
              });
            }
          } catch (e) {}
        }
      }
    });

    return () => {
      active = false;
      if (unsubChats) unsubChats();
      if (unsubNotifs) unsubNotifs();
      window.removeEventListener('nexus_chats_updated', handleCustomSync);
      window.removeEventListener('nexus_chat_read', handleChatReadSync);
      window.removeEventListener('nexus_all_read', handleAllReadSync);
    };
  }, [userProfile?.email, setChats, setNotifications, loadChatsFromSupabase, refetchChats, triggerNotification]);

  // Feed IndexedDB cache sync
  const syncFeedToCache = useCallback(async (currentFeed: any[], role?: string, userId?: string) => {
    if (!currentFeed || currentFeed.length === 0) return;
    await saveFeedCache(role || portalRole || 'fan_only', currentFeed, userId || userProfile?.id);
  }, [portalRole, userProfile?.id]);

  // Save feed to cache on updates
  useEffect(() => {
    if (feed && feed.length > 0 && portalRole) {
      syncFeedToCache(feed, portalRole, userProfile?.id);
    }
  }, [feed, portalRole, userProfile?.id, syncFeedToCache]);

  // IndexedDB Hydration helpers
  const hydrateFeedFromIndexedDB = useCallback(async (role?: string, userId?: string) => {
    return await loadFeedCache(role || portalRole || 'fan_only', userId || userProfile?.id);
  }, [portalRole, userProfile?.id]);

  const hydrateProfileFromIndexedDB = useCallback(async (role?: string, userId?: string) => {
    return await loadProfileIndexedDBCache(role || portalRole || 'fan_only', userId || userProfile?.id);
  }, [portalRole, userProfile?.id]);

  const hydrateProfileFromLocalStorage = useCallback((role?: string, userId?: string) => {
    return loadProfileLocalStorageCache(role || portalRole || 'fan_only', userId || userProfile?.id);
  }, [portalRole, userProfile?.id]);

  // Background post publisher wrapper
  const handleSyncPost = useCallback(async (post: any, directUserId?: string) => {
    await syncPostToSupabase(post, directUserId || userProfile?.id);
  }, [userProfile?.id]);

  return {
    syncPostToSupabase: handleSyncPost,
    hydrateFeedFromIndexedDB,
    hydrateProfileFromIndexedDB,
    hydrateProfileFromLocalStorage,
    syncFeedToCache,
    profileStore,
    socialFeedStore
  };
}
