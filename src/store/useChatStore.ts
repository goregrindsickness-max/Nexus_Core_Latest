import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabase } from '../supabase';
import { markChatAsRead, handleMarkAllAsRead } from '../lib/chat';


/**
 * Resolves active authenticated user ID from local active profile or Supabase session.
 */
export const getValidUserId = async (client?: any): Promise<string> => {
  if (typeof localStorage !== 'undefined') {
    try {
      const savedProfile = localStorage.getItem('nexus_core_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed?.id) return parsed.id;
      }

      const savedUser = localStorage.getItem('nexus_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id) return parsed.id;
      }
    } catch (e) {
      console.warn('Messaging Warning: Failed to parse local storage profile for user ID:', e);
    }
  }

  const supabase = client || getSupabase();

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        return session.user.id;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        return user.id;
      }
    } catch (err) {
      console.warn('Messaging Warning: Exception resolving Supabase user session ID:', err);
    }
  }

  if (typeof localStorage !== 'undefined') {
    try {
      let guestId = localStorage.getItem('nexus_guest_user_id');
      if (!guestId) {
        guestId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem('nexus_guest_user_id', guestId);
      }
      return guestId;
    } catch (e) {
      console.warn('Messaging Warning: Failed to parse local storage guest ID:', e);
    }
  }

  return `usr_${Date.now()}`;
};

/**
 * Direct Raw Database Message Dispatcher
 */
export const sendDirectMessage = async (senderId: string, recipientId: string, text: string) => {
  console.warn('=== [SEND MESSAGE DIAGNOSTIC] ===');
  console.warn('1. Sender ID:', senderId);
  console.warn('2. Recipient ID:', recipientId);
  console.warn('3. Message Text:', text);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUid = session?.user?.id || 'NO_AUTH_SESSION';
      console.warn('4. Supabase Auth UID:', sessionUid);
      if (sessionUid !== 'NO_AUTH_SESSION' && sessionUid !== senderId) {
        console.warn('⚠️ RLS MISMATCH WARNING: senderId (', senderId, ') differs from authenticated Supabase session UID (', sessionUid, '). If Supabase RLS is enabled on nexus_chats, Supabase will reject this insert!');
      }
    } catch (e) {}
  }

  if (!senderId || !recipientId || !text || !text.trim()) {
    console.error('[Direct Chat] Send aborted: Missing senderId, recipientId, or empty message text.');
    return { success: false, error: 'Missing senderId, recipientId, or empty message text' };
  }

  console.log(`[Direct Chat] Attempting DB insert from ${senderId} -> ${recipientId}`);

  if (!supabase) {
    console.error('[Direct Chat] Supabase client unavailable.');
    return { success: false, error: 'Supabase client unavailable' };
  }

  const trimmed = text.trim();

  // Raw, direct insert to Supabase
  const { data: chatData, error: chatError } = await supabase
    .from('nexus_chats')
    .insert([{
      sender_id: senderId,
      receiver_id: recipientId,
      recipient_id: recipientId,
      message: trimmed,
      content: trimmed,
      is_read: false
    }])
    .select()
    .single();

  if (chatError) {
    console.error('[Direct Chat] Supabase DB Insert Failed:', chatError.message, chatError);
  } else {
    console.log('[Direct Chat] Message written to DB successfully:', chatData);
  }

  // Direct insert to notifications
  try {
    const { error: notifError } = await supabase
      .from('nexus_notifications')
      .insert([{
        user_id: recipientId,
        actor_id: senderId,
        type: 'direct_message',
        title: 'New Direct Signal',
        content: trimmed,
        is_read: false
      }]);

    if (notifError) {
      console.warn('[Direct Chat] Notification write warning:', notifError.message);
    }
  } catch (notifErr: any) {
    console.warn('[Direct Chat] Notification write exception:', notifErr?.message || notifErr);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
  }

  return { success: !chatError, data: chatData, error: chatError };
};

/**
 * Standardized Direct Message Handler
 */
export const handleSendMessage = async (
  arg1: string,
  arg2: string,
  arg3?: string,
  client?: any
) => {
  let senderId: string = '';
  let recipientId: string = '';
  let text: string = '';

  if (arg3 && typeof arg3 === 'string' && arg3.trim().length > 0) {
    senderId = arg1;
    recipientId = arg2;
    text = arg3;
  } else {
    recipientId = arg1;
    text = arg2;
  }

  const supabase = client || getSupabase();
  if (!senderId && supabase) {
    senderId = (await getValidUserId(supabase)) || '';
  }

  return await sendDirectMessage(senderId, recipientId, text);
};

export const openFloatingChat = async (targetProfileId: string, profileData?: any) => {
  console.warn('=== [OPEN FLOATING CHAT DIAGNOSTIC] ===');
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.warn('1. Supabase Auth UID:', session?.user?.id || 'NO_AUTH_SESSION');
    } catch (e) {}
  }

  let activeProfile: any = null;
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
      if (stored) activeProfile = JSON.parse(stored);
    } catch (e) {}
  }

  console.warn('2. App Store Profile ID:', activeProfile?.id || 'NO_STORE_PROFILE');
  console.warn('3. Target Profile ID:', targetProfileId);

  if (activeProfile?.id === targetProfileId) {
    console.warn('❌ BLOCKED: App thinks current user ID matches target ID (messaging self)');
  }

  console.log('[useChatStore] Forcing chat window open for target:', targetProfileId);
  if (typeof window !== 'undefined') {
    const detailPayload = {
      profile_id: targetProfileId,
      name: profileData?.name || profileData?.username || profileData?.full_name || profileData?.display_name || 'User',
      username: profileData?.name || profileData?.username || profileData?.full_name || profileData?.display_name || 'User',
      avatar_url: profileData?.avatar || profileData?.avatar_url || null,
      ...profileData,
    };
    window.dispatchEvent(
      new CustomEvent('nexus_open_chat_thread', { detail: detailPayload })
    );
    window.dispatchEvent(
      new CustomEvent('nexus_open_chat', { detail: detailPayload })
    );
  }
};

/**
 * Custom React Hook for Direct Messaging State Management
 */
export const useChatStore = () => {
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (recipientId: string, content: string) => {
    setIsSending(true);
    try {
      const result = await handleSendMessage(recipientId, content);
      return result;
    } finally {
      setIsSending(false);
    }
  }, []);

  const fetchMessagesForRecipient = useCallback(async (recipientId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    try {
      const currentUserId = await getValidUserId(supabase);
      if (!currentUserId || !recipientId) return;

      const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (!isValidUUID(currentUserId) || !isValidUUID(recipientId)) {
        return;
      }

      const { data, error } = await supabase
        .from('nexus_chats')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeRecipientId) {
      fetchMessagesForRecipient(activeRecipientId);
    }

    const supabase = getSupabase();
    if (!supabase) return;

    let channel: any = null;
    let isCancelled = false;

    getValidUserId(supabase).then((currentUserId) => {
      if (!currentUserId || isCancelled) return;

      const channelName = `chat_listener_${currentUserId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'nexus_chats',
          },
          async (payload: any) => {
            const newMsg = payload.new;
            if (!newMsg) return;

            const isForCurrentUser =
              newMsg.receiver_id === currentUserId ||
              newMsg.recipient_id === currentUserId;

            if (!isForCurrentUser) return;

            console.log('[Direct Chat] Incoming message received via Realtime:', newMsg);

            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('id, full_name, console_handle, avatar_url')
              .eq('id', newMsg.sender_id)
              .maybeSingle();

            const hydratedMessage = {
              ...newMsg,
              sender: senderProfile || { full_name: 'Unknown User' }
            };

            setMessages((prev) => {
              if ((prev || []).some((m) => m.id === newMsg.id)) return prev;
              return [...prev, hydratedMessage];
            });

            if (typeof window !== 'undefined') {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
              }, 0);
            }
          }
        )
        .subscribe((status: string) => {
          console.log('Realtime chat subscription status:', status);
        });
    });

    return () => {
      isCancelled = true;
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeRecipientId, fetchMessagesForRecipient]);

  return {
    activeRecipientId,
    setActiveRecipientId,
    messages,
    loading,
    isSending,
    sendMessage,
    sendDirectMessage,
    openFloatingChat,
    fetchMessagesForRecipient,
    getValidUserId,
    handleSendMessage
  };
};

export default useChatStore;
