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

  // Load initial notifications from Supabase & localStorage on mount / profile change
  useEffect(() => {
    if (!setNotifications) return;
    let active = true;

    async function loadNotifications() {
      let localNotifs: any[] = [];
      try {
        const rawLocal = localStorage.getItem('nexus_local_notifications_v1');
        if (rawLocal) {
          localNotifs = JSON.parse(rawLocal);
        }
      } catch (_) {}

      let remoteNotifs: any[] = [];
      const supabase = (await import('../../../supabase')).getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('nexus_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          if (!error && data && Array.isArray(data)) {
            remoteNotifs = data.map((row: any) => ({
              ...(row.data || {}),
              id: row.id,
              user_id: row.user_id,
              actor_id: row.actor_id,
              title: row.title || row.data?.title || 'Notification',
              message: row.message || row.data?.message || '',
              category: row.category || row.type || 'SYSTEM',
              read: row.is_read ?? row.data?.read ?? false,
              is_read: row.is_read ?? row.data?.is_read ?? false,
              created_at: row.created_at || new Date().toISOString()
            }));
          }
        } catch (e) {
          console.warn('[useSocialFeedSync] Error fetching Supabase notifications:', e);
        }
      }

      if (!active) return;

      const combinedMap = new Map<string, any>();
      [...remoteNotifs, ...localNotifs].forEach((n) => {
        if (n && n.id && !combinedMap.has(n.id)) {
          combinedMap.set(n.id, n);
        }
      });

      const finalNotifs = Array.from(combinedMap.values()).sort((a, b) => {
        const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
        const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      if (finalNotifs.length > 0) {
        setNotifications(prev => {
          const prevMap = new Map((prev || []).map(p => [p.id, p]));
          finalNotifs.forEach(fn => {
            if (!prevMap.has(fn.id)) {
              prevMap.set(fn.id, fn);
            }
          });
          return Array.from(prevMap.values()).sort((a, b) => {
            const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
            const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
            return timeB - timeA;
          });
        });
      }
    }

    loadNotifications();

    return () => {
      active = false;
    };
  }, [userProfile?.id, userProfile?.email, setNotifications]);

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

        const myId = userProfile?.id;
        const myEmail = userProfile?.email;

        // Actor check: if current user is the actor who triggered this event, never notify themselves!
        const isActor = Boolean(
          (raw.actor_id && (raw.actor_id === myId || raw.actor_id === myEmail)) ||
          (raw.actor_email && raw.actor_email === myEmail) ||
          (raw.data?.actor_id && (raw.data?.actor_id === myId || raw.data?.actor_id === myEmail)) ||
          (raw.data?.actor_email && raw.data?.actor_email === myEmail)
        );
        if (isActor) return;

        // For reaction notifications, ensure it is strictly targeted to the post author (current user)
        const isReaction = raw.category === 'REACTION' || raw.type === 'post_reaction' || (raw.title && String(raw.title).toUpperCase().includes('REACTION'));
        if (isReaction) {
          const isDirectRecipient = Boolean(
            (myId && raw.user_id === myId) ||
            (myEmail && (raw.user_id === myEmail || raw.data?.user_id === myEmail))
          );
          if (!isDirectRecipient) return;
        } else {
          const matchesUser = !raw.user_id || raw.user_id === myId || raw.user_id === myEmail;
          if (!matchesUser) return;
        }
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
