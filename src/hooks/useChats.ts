import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getSupabase } from '../supabase';
import { getValidUserId, handleSendMessage } from '../store/useChatStore';
import { markChatAsRead, handleMarkAllAsRead } from '../lib/chat';
import { pushManager } from '../lib/pushNotifications';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id?: string;
  recipient_id?: string;
  message?: string;
  content?: string;
  is_read?: boolean | null;
  created_at?: string;
  [key: string]: any;
}

export const useChats = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadMessageIds, setUnreadMessageIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const activeRecipientIdRef = useRef<string | null>(activeRecipientId);
  activeRecipientIdRef.current = activeRecipientId;
  const currentUserIdRef = useRef<string | null>(currentUserId);
  currentUserIdRef.current = currentUserId;

  // Resolve active user ID
  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      getValidUserId(supabase).then((id) => {
        if (id) setCurrentUserId(id);
      });
    }
  }, []);

  // Fetch all messages for current user to compute totalUnreadCount
  const fetchAllMessages = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const uid = currentUserId || (await getValidUserId(supabase));
      if (!uid) return;

      const { data, error } = await supabase
        .from('nexus_chats')
        .select('*')
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        const unreadSet = new Set<string>();
        data.forEach((msg: ChatMessage) => {
          if (msg.sender_id !== uid && (msg.is_read === false || msg.is_read === null)) {
            unreadSet.add(msg.id);
          }
        });
        setUnreadMessageIds(unreadSet);
      }
    } catch (e) {
      console.warn('[useChats] Exception fetching messages:', e);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchAllMessages();

    const handleSync = () => fetchAllMessages();
    const handleRead = (e: any) => {
      const readChatId = e.detail?.chatId;
      if (readChatId) {
        setMessages((prev) =>
          prev.map((msg) => {
            const isMatch =
              msg.sender_id === readChatId ||
              msg.receiver_id === readChatId ||
              msg.recipient_id === readChatId;
            return isMatch ? { ...msg, is_read: true } : msg;
          })
        );
        setUnreadMessageIds((prev) => {
          const next = new Set(prev);
          messages.filter((m) => m.sender_id === readChatId).forEach((m) => next.delete(m.id));
          return next;
        });
      }
      fetchAllMessages();
    };
    const handleAllRead = () => {
      setMessages((prev) => prev.map((msg) => ({ ...msg, is_read: true })));
      setUnreadMessageIds(new Set());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('nexus_chats_updated', handleSync);
      window.addEventListener('nexus_chat_read', handleRead);
      window.addEventListener('nexus_all_read', handleAllRead);
    }

    const supabase = getSupabase();
    let channel: any = null;
    if (supabase) {
      const channelName = `global_usechats_listener_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'nexus_chats' },
          (payload: any) => {
            const incomingMessage = payload.new;
            if (incomingMessage) {
              const activePartnerId = activeRecipientIdRef.current;
              const activeUid = currentUserIdRef.current;
              // If the user is currently looking at this specific open thread:
              if (activePartnerId && activePartnerId === incomingMessage.sender_id) {
                // 1. Mark local message as read immediately
                incomingMessage.is_read = true;

                // 2. Persist to database so it stays read on refresh
                markChatAsRead(incomingMessage.sender_id, activeUid || undefined);
              } else if (!incomingMessage.is_read && incomingMessage.sender_id !== activeUid) {
                setUnreadMessageIds((prev) => new Set(prev).add(incomingMessage.id));
              }

              setMessages((prev) => {
                if (prev.some((m) => m.id === incomingMessage.id)) return prev;
                return [...prev, incomingMessage];
              });

              // Dispatch real device push notification if incoming from another user
              if (incomingMessage.sender_id !== activeUid) {
                const previewText = incomingMessage.content || incomingMessage.message || 'Sent an attachment';
                pushManager.sendPushNotification({
                  title: '💬 New Direct Message',
                  body: previewText.length > 80 ? `${previewText.substring(0, 77)}...` : previewText,
                  category: 'direct_messages',
                  priority: 'P1',
                  targetTab: 'messages',
                  data: {
                    senderId: incomingMessage.sender_id,
                  }
                });
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('nexus_chats_updated', handleSync);
        window.removeEventListener('nexus_chat_read', handleRead);
        window.removeEventListener('nexus_all_read', handleAllRead);
      }
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchAllMessages]);

 // Sum ALL individual unread incoming messages dynamically
  const totalUnreadCount = useMemo(() => {
    if (!currentUserId) return 0;

    // Filter directly from messages array (single source of truth)
    const unreadFromMessages = messages.filter(
      (msg) =>
        msg.sender_id !== currentUserId &&
        (msg.is_read === false || msg.is_read === null)
    ).length;

    // Use unreadMessageIds as a fallback ONLY if messages array hasn't loaded yet
    return Math.max(unreadFromMessages, unreadMessageIds.size);
  }, [messages, currentUserId, unreadMessageIds]);

  const handleSelectThread = useCallback(
    async (thread: any) => {
      const partnerId =
        typeof thread === 'string'
          ? thread
          : thread?.partner_id || thread?.sender_id || thread?.id;

      if (!partnerId) return;

      // 1. Instantly update local React state array for all messages in this thread
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_id === partnerId || msg.receiver_id === partnerId
            ? { ...msg, is_read: true }
            : msg
        )
      );

      // 2. Clear ALL unread IDs associated with this sender (even if not in active messages array)
      setUnreadMessageIds((prev) => {
        const next = new Set(prev);
        // Wipe all IDs or clear the set if this is the active thread
        next.clear(); 
        return next;
      });

      // 3. Persist Read Status to BOTH Chats and Notifications
      const supabase = getSupabase();
      if (partnerId && currentUserId && supabase) {
        try {
          // Mark chats as read
          await supabase.rpc('mark_thread_as_read', {
            p_chat_id: partnerId,
            p_profile_id: currentUserId,
          });

          // ALSO mark related chat notifications as read for this sender
          await supabase
            .from('nexus_notifications')
            .update({ is_read: true })
            .eq('user_id', currentUserId)
            .eq('is_read', false);
        } catch (e) {
          console.warn('Error marking thread/notifications as read:', e);
          await markChatAsRead(partnerId, currentUserId || undefined);
        }
      } else {
        await markChatAsRead(partnerId, currentUserId || undefined);
      }
    },
    [currentUserId]
  );
  const markThreadRead = useCallback(
    async (threadId: string) => {
      await handleSelectThread(threadId);
    },
    [handleSelectThread]
  );

  const markAllRead = useCallback(async () => {
    setMessages((prev) => prev.map((msg) => ({ ...msg, is_read: true })));
    setUnreadMessageIds(new Set());
    await handleMarkAllAsRead(currentUserId || undefined);
  }, [currentUserId]);

  const sendMessage = useCallback(
    async (recipientId: string, content: string) => {
      setIsSending(true);
      try {
        const result = await handleSendMessage(recipientId, content);
        await fetchAllMessages();
        return result;
      } finally {
        setIsSending(false);
      }
    },
    [fetchAllMessages]
  );

  return {
    messages,
    unreadMessageIds,
    totalUnreadCount,
    currentUserId,
    activeRecipientId,
    setActiveRecipientId,
    loading,
    isSending,
    sendMessage,
    markThreadRead,
    handleSelectThread,
    markAllRead,
    refetch: fetchAllMessages,
  };
};

export default useChats;
