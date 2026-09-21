import { supabase } from './supabaseClient';

export const isUnread = (chatItem: any, currentUserId: string) => {
  if (!chatItem || !currentUserId) return false;

  // If user sent it, it's never unread for them
  if (String(chatItem.sender_id).toLowerCase() === String(currentUserId).toLowerCase()) return false;
  
  // Check if user is the intended target (receiver_id or recipient_id)
  const isRecipient = 
    (chatItem.receiver_id && String(chatItem.receiver_id).toLowerCase() === String(currentUserId).toLowerCase()) ||
    (chatItem.recipient_id && String(chatItem.recipient_id).toLowerCase() === String(currentUserId).toLowerCase());
  
  // Return unread status
  return isRecipient && (chatItem.is_read === false || chatItem.is_read === null);
};

export const markChatAsRead = async (chatId?: string, currentUserId?: string) => {
  try {
    // 1. Resolve Active User ID safely (exclude JWT tokens like sb-access-token)
    const { data: { session } } = await supabase.auth.getSession();
    let resolvedUser = currentUserId || 
                         session?.user?.id || 
                         (typeof localStorage !== 'undefined' ? (
                           localStorage.getItem('nexus_active_profile_id')
                         ) : null);

    if (!resolvedUser && typeof localStorage !== 'undefined') {
      const savedProfile = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          resolvedUser = parsed?.id || parsed?.email || null;
        } catch (e) {}
      }
    }

    // Ensure resolvedUser is not a JWT token (JWT tokens start with 'ey')
    const targetUserId = (resolvedUser && String(resolvedUser).startsWith('ey')) ? null : resolvedUser;

    const userEmail = session?.user?.email || (typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_user_email') : null);

    console.log(`[CHAT INBOX] Executing mark_thread_as_read for thread: ${chatId || 'ALL'} | user: ${targetUserId || 'AUTH_CONTEXT'}`);

    // 2. Call RPC (Pass thread ID or null for mark-all)
    let rpcSuccess = false;
    try {
      const { data, error } = await supabase.rpc('mark_thread_as_read', {
        p_chat_id: chatId || null,
        p_profile_id: targetUserId || null
      });

      if (error || data === false) {
        console.warn('[MARK READ RPC]: mark_thread_as_read returned false/error, attempting mark_all_chats_and_notifications_read fallback...');
        if (targetUserId) {
          const { error: fErr } = await supabase.rpc('mark_all_chats_and_notifications_read', {
            p_profile_id: targetUserId
          });
          if (!fErr) rpcSuccess = true;
        }
      } else {
        rpcSuccess = true;
        console.log('[MARK READ SUCCESS]: Database updated via RPC.');
      }
    } catch (e) {
      if (targetUserId) {
        try {
          await supabase.rpc('mark_all_chats_and_notifications_read', {
            p_profile_id: targetUserId
          });
          rpcSuccess = true;
        } catch (e2) {}
      }
    }

    // Direct fallback update on nexus_chats
    if (chatId) {
      let query = supabase
        .from('nexus_chats')
        .update({ is_read: true })
        .eq('sender_id', chatId)
        .eq('is_read', false);

      if (targetUserId) {
        query = query.or(`receiver_id.eq.${targetUserId},recipient_id.eq.${targetUserId}`);
      }

      const { error: updErr } = await query;
      if (updErr) {
        console.error('[Direct Update Error]', updErr);
        // Try simple update without receiver filter
        await supabase
          .from('nexus_chats')
          .update({ is_read: true })
          .eq('sender_id', chatId)
          .eq('is_read', false);
      }
    }

    if (targetUserId) {
      try {
        await supabase
          .from('nexus_notifications')
          .update({ is_read: true })
          .eq('user_id', targetUserId)
          .eq('is_read', false);
      } catch (nErr) {
        console.warn('[MARK READ NOTIFICATIONS ERROR]:', nErr);
      }
    }

    // 3. Persist to localStorage caches immediately
    if (typeof localStorage !== 'undefined') {
      const identifiers = [userEmail, targetUserId].filter(Boolean) as string[];
      identifiers.forEach(idVal => {
        if (!idVal) return;
        const key = `nexus_chats_${idVal.toLowerCase().trim()}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const updated = parsed.map((c: any) => {
                if (
                  !chatId ||
                  c.id === chatId ||
                  c.contactId === chatId ||
                  (c.email && c.email.toLowerCase() === chatId.toLowerCase()) ||
                  (c.profileName && c.profileName.toLowerCase() === chatId.toLowerCase())
                ) {
                  const msgs = Array.isArray(c.messages)
                    ? c.messages.map((m: any) => ({ ...m, is_read: true, read: true }))
                    : c.messages;
                  return { ...c, unread: 0, isRead: true, is_read: true, messages: msgs };
                }
                return c;
              });
              localStorage.setItem(key, JSON.stringify(updated));
            }
          } catch (e) {}
        }
      });
    }

    // 4. Dispatch global event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_chat_read', { detail: { chatId } }));
      window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
    }

    return true;

  } catch (err) {
    console.error('[MARK READ EXCEPTION]:', err);
    return false;
  }
};

export const handleMarkAllAsRead = async (
  profileId?: string, 
  setThreads?: React.Dispatch<React.SetStateAction<any[]>>
) => {
  // 1. Instantly update local React state for immediate visual responsiveness
  if (setThreads) {
    setThreads((prev) =>
      prev.map((thread) => ({
        ...thread,
        is_read: true,
        unread: false,
        unread_count: 0,
        isRead: true,
        read: true
      }))
    );
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const targetUserId = profileId || 
                         session?.user?.id || 
                         (typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_active_profile_id') : null);

    console.log(`[CHAT INBOX] Marking all chats & notifications as read for user: ${targetUserId}`);

    // 2. Persist to database via Security Definer RPC
    const { error } = await supabase.rpc('mark_all_chats_and_notifications_read', {
      p_profile_id: targetUserId || null
    });

    if (error) {
      console.error('[MARK ALL READ RPC ERROR]:', error.message);
      return;
    }

    console.log('[MARK ALL READ SUCCESS]: Database updated via RPC.');
    if (targetUserId) {
      await supabase.from('nexus_chats').update({ is_read: true }).eq('is_read', false).or(`receiver_id.eq.${targetUserId},recipient_id.eq.${targetUserId}`);
    }

    // 3. Update localStorage cache for all chat and notification keys
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nexus_chats_')) {
          try {
            const saved = localStorage.getItem(key);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const updated = parsed.map((c: any) => ({ ...c, unread: 0, isRead: true, is_read: true }));
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          } catch (e) {}
        }
        if (key && key.startsWith('nexus_notifications_')) {
          try {
            const saved = localStorage.getItem(key);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const updated = parsed.map((n: any) => ({ ...n, read: true, is_read: true }));
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          } catch (e) {}
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_all_read'));
      window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
    }

  } catch (err) {
    console.error('[MARK ALL READ EXCEPTION]:', err);
  }
};
