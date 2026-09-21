import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getSupabase } from '../../supabase';
import { openFloatingChat } from '../../store/useChatStore';
import { markChatAsRead, handleMarkAllAsRead } from '../../lib/chat';
import { extractUUID } from '../../utils/socialFeedUtils';
import { useUserPresence, presenceManager, formatPresenceStatus } from '../../lib/presence';
import { pushManager } from '../../lib/pushNotifications';
import { 
  X, 
  Send, 
  Minimize2, 
  MessageSquare, 
  ChevronLeft, 
  Search, 
  Radio, 
  Sparkles, 
  Flame,
  ShieldCheck,
  User,
  CheckCheck
} from 'lucide-react';

interface ChatMessage {
  id?: string | number;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at?: string;
  is_read?: boolean;
}

interface ConversationItem {
  id: string;
  name: string;
  avatar?: string | null;
  role?: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  last_seen_at?: any;
  updated_at?: any;
}

// Conversation row with dynamic, live presence indicator
const FloatingConversationRow: React.FC<{
  conv: ConversationItem;
  onSelect: () => void;
}> = ({ conv, onSelect }) => {
  const { formatted, isOnline } = useUserPresence(conv);

  return (
    <button
      onClick={onSelect}
      className="w-full p-3 flex items-center gap-3 hover:bg-zinc-900/80 transition-colors text-left cursor-pointer group"
    >
      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
        {conv.avatar ? (
          <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-orange-400 font-mono font-bold text-xs">
            {conv.name.substring(0, 2).toUpperCase()}
          </div>
        )}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-1 ring-black transition-colors ${formatted.dotClass}`}
          title={formatted.text}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-mono font-bold text-xs text-white truncate group-hover:text-orange-400 transition-colors">
            {conv.name}
          </span>
          <span className="text-[9px] font-mono text-zinc-500 shrink-0">
            {formatted.isOnline ? (
              <span className="text-emerald-400 font-bold">NOW</span>
            ) : (
              conv.time || formatted.shortText
            )}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-mono text-zinc-400 truncate flex-1">
            {conv.lastMessage}
          </p>
          <span className="text-[9px] font-mono text-zinc-600 shrink-0">
            {formatted.shortText}
          </span>
        </div>
      </div>

      {conv.unread && conv.unread > 0 ? (
        <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-mono text-[10px] font-extrabold shrink-0 shadow-sm">
          {conv.unread}
        </span>
      ) : null}
    </button>
  );
};

const isValidUUID = (str: string | undefined | null): boolean => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

export const FloatingChatHead: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('nexus_chat_head_dismissed');
      if (saved === 'true') return true;
      if (saved === 'false') return false;
    }
    return true;
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<{ id: string; name: string; avatar_url?: string | null } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'chat' | 'list'>('chat');
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [inputText, setInputText] = useState('');

  // Explicitly dismiss chat head and persist preference across reloads
  const handleDismissChatHead = useCallback(() => {
    setIsDismissed(true);
    setIsOpen(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nexus_chat_head_dismissed', 'true');
    }
  }, []);

  // Live real-time presence for the currently targeted user
  const { presence: targetPresence, formatted: targetFormatted, isOnline: isTargetOnline } = useUserPresence(targetUser);

  // Position state (clamped to screen)
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const x = Math.max(16, window.innerWidth - 84);
      const y = Math.max(80, window.innerHeight - 140);
      return { x, y };
    }
    return { x: 20, y: 100 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isOverDismiss, setIsOverDismiss] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, startLeft: 0, startTop: 0 });
  const hasMovedRef = useRef(false);
  const hasInitializedOpen = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && viewMode === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, viewMode]);

  // Helper to resolve effective sender ID
  const getEffectiveSenderId = useCallback(async (): Promise<string> => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) return session.user.id;
      } catch (e) {}
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const sbKey = Object.keys(localStorage).find(k => k.includes('sb-') && k.includes('-auth-token'));
        if (sbKey) {
          const parsed = JSON.parse(localStorage.getItem(sbKey) || '{}');
          if (parsed?.user?.id) return parsed.user.id;
        }
      } catch (e) {}
      try {
        const stored = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.id) return parsed.id;
        }
      } catch (e) {}
    }

    let guestId = typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_guest_user_id') : null;
    if (!guestId && typeof localStorage !== 'undefined') {
      guestId = `usr_${Date.now()}`;
      localStorage.setItem('nexus_guest_user_id', guestId);
    }
    return guestId || `usr_${Date.now()}`;
  }, []);

  // Sync user session
  useEffect(() => {
    const syncUserId = async () => {
      const uid = await getEffectiveSenderId();
      setCurrentUserId(uid);
    };

    syncUserId();

    const supabase = getSupabase();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [getEffectiveSenderId]);

  // Load conversations and unread stats from local storage & Supabase
  const loadConversations = useCallback(async () => {
    let currentUserEmail = '';
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
        if (stored) {
          const p = JSON.parse(stored);
          if (p?.email) currentUserEmail = p.email.toLowerCase().trim();
        }
      } catch (e) {}
    }

    let loadedList: ConversationItem[] = [];
    let unreadCount = 0;

    if (currentUserEmail && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(`nexus_chats_${currentUserEmail}`);
        if (saved) {
          const raw = JSON.parse(saved);
          if (Array.isArray(raw)) {
            loadedList = raw.map((c: any) => {
              const unread = c.unread || 0;
              unreadCount += unread;
              const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].text : 'No messages yet';
              const lastTime = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].time : '';
              return {
                id: c.id,
                name: c.name || 'Anonymous User',
                avatar: c.avatar || null,
                role: c.role || 'User',
                lastMessage: lastMsg,
                time: lastTime,
                unread,
              };
            });
          }
        }
      } catch (e) {}
    }

    // Also check Supabase unread counts if available
    const supabase = getSupabase();
    if (supabase && currentUserId && isValidUUID(currentUserId)) {
      try {
        const { count, error } = await supabase
          .from('nexus_chats')
          .select('*', { count: 'exact', head: true })
          .or(`receiver_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
          .neq('sender_id', currentUserId)
          .eq('is_read', false);

        if (!error && typeof count === 'number') {
          unreadCount = Math.max(unreadCount, count);
        }
      } catch (e) {}

      // If loadedList is empty or missing threads, fetch conversations directly from Supabase
      if (loadedList.length === 0) {
        try {
          const { data: recentMsgs } = await supabase
            .from('nexus_chats')
            .select('*')
            .or(`receiver_id.eq.${currentUserId},recipient_id.eq.${currentUserId},sender_id.eq.${currentUserId}`)
            .order('created_at', { ascending: false })
            .limit(30);

          if (recentMsgs && recentMsgs.length > 0) {
            const partnerIds = new Set<string>();
            recentMsgs.forEach((m: any) => {
              const partner = m.sender_id === currentUserId ? (m.receiver_id || m.recipient_id) : m.sender_id;
              if (partner && partner !== currentUserId) partnerIds.add(partner);
            });

            if (partnerIds.size > 0) {
              const { data: partnerProfiles } = await supabase
                .from('profiles')
                .select('id, full_name, console_handle, email, avatar_url, account_type')
                .in('id', Array.from(partnerIds));

              const profileMap = new Map<string, any>();
              partnerProfiles?.forEach((p: any) => profileMap.set(p.id, p));

              const newItems: ConversationItem[] = [];
              partnerIds.forEach((pid) => {
                const prof = profileMap.get(pid);
                const msgsWithPartner = recentMsgs.filter(
                  (m: any) =>
                    (m.sender_id === pid && (m.receiver_id === currentUserId || m.recipient_id === currentUserId)) ||
                    (m.sender_id === currentUserId && (m.receiver_id === pid || m.recipient_id === pid))
                );
                const lastM = msgsWithPartner[0];
                const unreadInThread = msgsWithPartner.filter(
                  (m: any) => m.sender_id === pid && (m.is_read === false || m.is_read === null)
                ).length;

                newItems.push({
                  id: pid,
                  name: prof?.full_name || prof?.console_handle || 'Direct Signal',
                  avatar: prof?.avatar_url || null,
                  role: prof?.account_type || 'User',
                  lastMessage: lastM ? (lastM.message || lastM.content || 'No messages yet') : '',
                  time: lastM ? new Date(lastM.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                  unread: unreadInThread,
                });
              });

              if (newItems.length > 0) {
                loadedList = newItems;
              }
            }
          }
        } catch (err) {
          console.warn('Error hydrating conversations in FloatingChatHead:', err);
        }
      }
    }

    setConversations(loadedList);
    setTotalUnreadCount(unreadCount);

    if (unreadCount > 0) {
      // Respect user dismissal: only auto-show if user has NOT explicitly dismissed the chat head
      const isExplicitlyDismissed = typeof localStorage !== 'undefined' && localStorage.getItem('nexus_chat_head_dismissed') === 'true';
      if (!isExplicitlyDismissed) {
        setIsDismissed(false);
      }
    }

    // If no targetUser is selected yet, default targetUser to the most recent conversation if present
    setTargetUser((prev) => {
      if (prev) return prev;
      if (loadedList.length > 0) {
        return {
          id: loadedList[0].id,
          name: loadedList[0].name,
          avatar_url: loadedList[0].avatar,
        };
      }
      return null;
    });
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
    const handleSync = () => loadConversations();
    window.addEventListener('nexus_chats_updated', handleSync);
    return () => window.removeEventListener('nexus_chats_updated', handleSync);
  }, [loadConversations]);

  // Keep position clamped on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.max(16, Math.min(window.innerWidth - 76, prev.x)),
        y: Math.max(80, Math.min(window.innerHeight - 80, prev.y)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dragging event listeners on window
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      if (Math.hypot(deltaX, deltaY) > 5) {
        hasMovedRef.current = true;
      }

      const rawX = dragStartPos.current.startLeft + deltaX;
      const rawY = dragStartPos.current.startTop + deltaY;

      // Clamp to screen bounds
      const clampedX = Math.max(10, Math.min(window.innerWidth - 74, rawX));
      const clampedY = Math.max(60, Math.min(window.innerHeight - 74, rawY));

      setPosition({ x: clampedX, y: clampedY });

      // Check distance to dismiss area at bottom center
      const dismissX = window.innerWidth / 2;
      const dismissY = window.innerHeight - 70;
      const distToDismiss = Math.hypot(clampedX + 28 - dismissX, clampedY + 28 - dismissY);
      setIsOverDismiss(distToDismiss < 90);
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      setIsDragging(false);

      if (isOverDismiss) {
        handleDismissChatHead();
        setIsOverDismiss(false);
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isOverDismiss]);

  // Mark all chats & notifications as read
  const handleMarkAllRead = useCallback(async () => {
    setTotalUnreadCount(0);
    setConversations((prev) => prev.map((c) => ({ ...c, unread: 0 })));
    setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));

    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nexus_chats_')) {
            const val = localStorage.getItem(key);
            if (val) {
              const list = JSON.parse(val);
              if (Array.isArray(list)) {
                const updated = list.map((item: any) => ({
                  ...item,
                  unread: 0,
                  isRead: true,
                  is_read: true,
                  messages: Array.isArray(item.messages)
                    ? item.messages.map((m: any) => ({ ...m, is_read: true, read: true }))
                    : item.messages,
                }));
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          }
        }
      } catch (e) {}
    }

    const supabase = getSupabase();
    if (supabase && currentUserId) {
      try {
        await supabase.rpc('mark_all_chats_and_notifications_read', {
          p_profile_id: currentUserId,
        });
      } catch (e) {}
    }

    await handleMarkAllAsRead(currentUserId || undefined);

    window.dispatchEvent(new CustomEvent('nexus_all_read'));
    window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
  }, [currentUserId]);

  // Mark chat as read
  const handleMarkThreadRead = useCallback(async (partnerId: string) => {
    if (!partnerId) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.sender_id === partnerId || msg.receiver_id === partnerId
          ? { ...msg, is_read: true }
          : msg
      )
    );

    setConversations((prev) =>
      prev.map((c) =>
        c.id === partnerId || c.name?.toLowerCase() === partnerId.toLowerCase()
          ? { ...c, unread: 0 }
          : c
      )
    );

    setTotalUnreadCount((prev) => {
      const remaining = conversations.reduce((acc, c) => {
        if (c.id === partnerId || c.name?.toLowerCase() === partnerId.toLowerCase()) return acc;
        return acc + (c.unread || 0);
      }, 0);
      return Math.max(0, remaining);
    });

    // Resolve partner details (UUID and Email) for resilient matching
    let partnerEmail = partnerId.includes('@') ? partnerId.toLowerCase().trim() : '';
    let partnerUuid = isValidUUID(partnerId) ? partnerId : '';

    const supabase = getSupabase();
    if (supabase && (!partnerEmail || !partnerUuid)) {
      try {
        const queryCol = partnerEmail ? 'email' : (isValidUUID(partnerId) ? 'id' : 'console_handle');
        const queryVal = partnerEmail || partnerId;
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, email')
          .eq(queryCol, queryVal)
          .maybeSingle();

        if (pData) {
          if (pData.id) partnerUuid = pData.id;
          if (pData.email) partnerEmail = pData.email.toLowerCase().trim();
        }
      } catch (e) {}
    }

    // Update local storage unread count across all caches
    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nexus_chats_')) {
            const saved = localStorage.getItem(key);
            if (saved) {
              const list = JSON.parse(saved);
              if (Array.isArray(list)) {
                const updated = list.map((item: any) => {
                  const isMatch =
                    item.id === partnerId ||
                    (partnerUuid && item.id === partnerUuid) ||
                    (partnerEmail && item.id?.toLowerCase() === partnerEmail) ||
                    (partnerUuid && item.contactId === partnerUuid) ||
                    (partnerEmail && item.email?.toLowerCase() === partnerEmail) ||
                    (item.name && item.name.toLowerCase() === partnerId.toLowerCase());

                  if (isMatch) {
                    return {
                      ...item,
                      unread: 0,
                      isRead: true,
                      is_read: true,
                      messages: Array.isArray(item.messages)
                        ? item.messages.map((m: any) => ({ ...m, is_read: true, read: true }))
                        : item.messages,
                    };
                  }
                  return item;
                });
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          }
        }
      } catch (e) {}
    }

    if (supabase && currentUserId) {
      try {
        if (partnerUuid) {
          await supabase.rpc('mark_thread_as_read', {
            p_chat_id: partnerUuid,
            p_profile_id: currentUserId,
          });
        }
        // Always run security-definer mark_all_chats_and_notifications_read to guarantee updates in DB
        await supabase.rpc('mark_all_chats_and_notifications_read', {
          p_profile_id: currentUserId,
        });
      } catch (e) {}
    }

    await markChatAsRead(partnerUuid || partnerId, currentUserId || undefined);

    window.dispatchEvent(new CustomEvent('nexus_chat_read', { detail: { chatId: partnerUuid || partnerId } }));
    window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
  }, [currentUserId, conversations]);

  // Open Chat Handler
  const handleOpenChat = useCallback((threadId?: string) => {
    const tid = threadId || targetUser?.id;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('nexus_chat_head_dismissed');
    }
    setIsOpen(true);
    setIsDismissed(false);
    setViewMode(tid ? 'chat' : 'list');
    if (tid) {
      handleMarkThreadRead(tid);
    }
  }, [targetUser, handleMarkThreadRead]);

  // Global listeners for nexus_open_chat & nexus_open_chat_thread
  useEffect(() => {
    const handleTrigger = (e: any) => {
      const detail = e.detail || {};
      const targetId = detail.profile_id || detail.id || detail.targetId || detail.partner_id || detail.user_id;
      const targetName = detail.name || detail.full_name || detail.username || detail.display_name || 'Direct Signal';
      const targetAvatar = detail.avatar_url || detail.avatar || detail.image || detail.thumbnail || null;
      const initialText = detail.message || detail.initialMessage || detail.text || '';

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('nexus_chat_head_dismissed');
      }

      if (targetId) {
        setTargetUser({
          id: targetId,
          name: targetName,
          avatar_url: targetAvatar,
        });
        if (initialText) {
          setInputText(initialText);
        }
        setIsDismissed(false);
        setIsOpen(true);
        setViewMode('chat');
        handleMarkThreadRead(targetId);
      } else {
        // Toggle or open general floating head
        setIsDismissed(false);
        setIsOpen(true);
      }
    };

    window.addEventListener('nexus_open_chat' as any, handleTrigger as EventListener);
    window.addEventListener('nexus_open_chat_thread' as any, handleTrigger as EventListener);
    window.addEventListener('nexus_toggle_floating_chat' as any, handleTrigger as EventListener);

    return () => {
      window.removeEventListener('nexus_open_chat' as any, handleTrigger as EventListener);
      window.removeEventListener('nexus_open_chat_thread' as any, handleTrigger as EventListener);
      window.removeEventListener('nexus_toggle_floating_chat' as any, handleTrigger as EventListener);
    };
  }, [handleMarkThreadRead]);

  // Global Realtime listener for incoming messages
  useEffect(() => {
    const supabase = getSupabase();
    if (!currentUserId || !supabase) return;

    const globalChannel = supabase
      .channel(`floating_chats_incoming_${currentUserId}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'nexus_chats' },
        async (payload) => {
          const newMsg = payload.new as any;
          if (
            (newMsg.receiver_id === currentUserId || newMsg.recipient_id === currentUserId) &&
            newMsg.sender_id !== currentUserId
          ) {
            let senderName = 'New Message';
            let avatarUrl: string | null = null;

            try {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('id, full_name, console_handle, avatar_url')
                .eq('id', newMsg.sender_id)
                .maybeSingle();

              if (senderProfile) {
                const sp = senderProfile as any;
                senderName = sp.full_name || sp.name || sp.console_handle || 'Direct Signal';
                avatarUrl = sp.avatar_url || sp.avatar || null;
              }
            } catch (err) {}

            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('nexus_chat_head_dismissed');
            }
            setIsDismissed(false);

            setTargetUser((prev) => {
              if (prev && prev.id === newMsg.sender_id) return prev;
              return {
                id: newMsg.sender_id,
                name: senderName,
                avatar_url: avatarUrl,
              };
            });

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, {
                id: newMsg.id,
                sender_id: newMsg.sender_id,
                receiver_id: newMsg.receiver_id || newMsg.recipient_id,
                message: newMsg.message || newMsg.content || '',
                created_at: newMsg.created_at || new Date().toISOString(),
                is_read: newMsg.is_read
              }];
            });

            setTotalUnreadCount((c) => c + 1);

            // Trigger OS / Browser real-time notification
            pushManager.notify({
              title: `💬 New Message from ${senderName}`,
              body: newMsg.message || newMsg.content || 'Sent you a direct transmission.',
              category: 'messages',
              priority: 'P1',
              targetTab: 'social',
              data: {
                senderId: newMsg.sender_id,
                name: senderName,
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [currentUserId]);

  // Fetch conversation history when targetUser changes
  useEffect(() => {
    if (!targetUser?.id) return;

    let localMsgs: ChatMessage[] = [];
    let currentUserEmail = '';

    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
        if (stored) {
          const p = JSON.parse(stored);
          if (p?.email) currentUserEmail = p.email.toLowerCase().trim();
        }
        if (currentUserEmail) {
          const saved = localStorage.getItem(`nexus_chats_${currentUserEmail}`);
          if (saved) {
            const chatList = JSON.parse(saved);
            const thread = chatList.find((c: any) =>
              c.id === targetUser.id ||
              c.id?.toLowerCase() === targetUser.id?.toLowerCase() ||
              c.name?.toLowerCase() === targetUser.name?.toLowerCase()
            );
            if (thread?.messages) {
              localMsgs = thread.messages.map((m: any) => ({
                id: m.id,
                sender_id: m.sender === 'user' ? (currentUserId || 'me') : targetUser.id,
                receiver_id: m.sender === 'user' ? targetUser.id : (currentUserId || 'me'),
                message: m.text || m.message,
                created_at: m.rawTime ? new Date(m.rawTime).toISOString() : new Date().toISOString(),
                is_read: true,
              }));
            }
          }
        }
      } catch (e) {}
    }

    const fetchSupabaseHistory = async () => {
      const supabase = getSupabase();
      let remoteMsgs: ChatMessage[] = [];

      if (supabase && currentUserId && targetUser.id && isValidUUID(currentUserId) && isValidUUID(targetUser.id)) {
        try {
          const { data, error } = await supabase
            .from('nexus_chats')
            .select('*')
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},recipient_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true });

          if (!error && data) {
            remoteMsgs = data.map((d: any) => ({
              id: d.id,
              sender_id: d.sender_id,
              receiver_id: d.receiver_id || d.recipient_id,
              message: d.message || d.content,
              created_at: d.created_at,
              is_read: d.is_read
            }));
          }
        } catch (e) {}
      }

      const combined = [...localMsgs];
      remoteMsgs.forEach((rm) => {
        if (!combined.some((lm) => lm.id === rm.id || lm.message === rm.message)) {
          combined.push(rm);
        }
      });

      setMessages(combined);
    };

    fetchSupabaseHistory();
  }, [targetUser, currentUserId]);

  // Send Message Handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !targetUser?.id) return;

    const text = inputText.trim();
    setInputText('');

    const supabase = getSupabase();
    const senderId = currentUserId || (await getEffectiveSenderId());

    let currentUserEmail = '';
    let currentUserProfileId = senderId;
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
        if (stored) {
          const p = JSON.parse(stored);
          if (p?.email) currentUserEmail = p.email.toLowerCase().trim();
          if (p?.id) currentUserProfileId = p.id;
        }
      } catch (e) {}
    }

    let resolvedRecipientId = targetUser.id;
    let recipientEmail = targetUser.id.includes('@') ? targetUser.id.toLowerCase().trim() : '';

    if (supabase && targetUser.id) {
      try {
        const filterParts: string[] = [];
        if (isValidUUID(targetUser.id)) filterParts.push(`id.eq.${targetUser.id}`);
        if (targetUser.id.includes('@')) filterParts.push(`email.eq.${targetUser.id.toLowerCase().trim()}`);
        else if (!isValidUUID(targetUser.id)) filterParts.push(`console_handle.eq.${targetUser.id}`);

        if (filterParts.length > 0) {
          const { data: recipientProfile } = await supabase
            .from('profiles')
            .select('id, email')
            .or(filterParts.join(','))
            .maybeSingle();

          if (recipientProfile) {
            if (recipientProfile.id) resolvedRecipientId = recipientProfile.id;
            if (recipientProfile.email) recipientEmail = recipientProfile.email.toLowerCase().trim();
          }
        }
      } catch (e) {}
    }

    if (!recipientEmail) {
      recipientEmail = targetUser.id.includes('@') ? targetUser.id.toLowerCase().trim() : `${targetUser.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@nexus.network`;
    }

    // Optimistic UI Append
    const tempMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sender_id: currentUserProfileId || senderId,
      receiver_id: resolvedRecipientId,
      message: text,
      created_at: new Date().toISOString(),
      is_read: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    // 1. Write to localStorage
    if (currentUserEmail) {
      try {
        const storageKey = `nexus_chats_${currentUserEmail}`;
        const existingStr = localStorage.getItem(storageKey);
        let chatList: any[] = existingStr ? JSON.parse(existingStr) : [];

        let thread = chatList.find((c: any) =>
          c.id === recipientEmail ||
          c.id === resolvedRecipientId ||
          c.name?.toLowerCase() === targetUser.name.toLowerCase()
        );

        if (!thread) {
          thread = {
            id: recipientEmail,
            name: targetUser.name,
            avatar: targetUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            role: 'User',
            roleBadge: 'USER',
            roleColor: 'text-purple-400 bg-purple-955/10 border-purple-900/30',
            online: true,
            unread: 0,
            messages: []
          };
          chatList.push(thread);
        }

        const formattedMsg = {
          id: `sent-${Date.now()}`,
          sender: 'user',
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTime: Date.now()
        };

        if (!thread.messages) thread.messages = [];
        thread.messages.push(formattedMsg);

        localStorage.setItem(storageKey, JSON.stringify(chatList));
      } catch (e) {}
    }

    // 2. Supabase DB Insert
    if (supabase) {
      try {
        const insertSender = currentUserProfileId || senderId;
        const insertReceiver = resolvedRecipientId;

        await supabase.from('nexus_chats').insert([{
          sender_id: insertSender,
          receiver_id: insertReceiver,
          recipient_id: insertReceiver,
          message: text,
          content: text,
          is_read: false
        }]);

        const receiverUUID = insertReceiver && extractUUID(insertReceiver);
        if (receiverUUID) {
          const newNotifId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000000';
          await supabase
            .from('nexus_notifications')
            .insert([{
              id: newNotifId,
              user_id: receiverUUID,
              title: '💬 NEW MESSAGE',
              message: `New message: "${text.substring(0, 60)}"`,
              category: 'CHAT',
              type: 'chat_message',
              is_read: false,
              created_at: new Date().toISOString()
            }]);
        }
      } catch (err) {}
    }

    window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
  };

  // Filter conversations for the thread picker
  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // If dismissed, render a small, subtle reopen trigger in bottom corner if needed or stay dismissed
  if (isDismissed) {
    return null;
  }

  // COLLAPSED / MOVEABLE CHAT HEAD BUBBLE
  if (!isOpen) {
    return (
      <>
        <div 
          className="fixed z-[10000000] flex items-center select-none"
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`, 
            touchAction: 'none' 
          }}
        >
          <div className="relative group">
            {/* Dismiss button on hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismissChatHead();
              }}
              className="absolute -top-1.5 -left-1.5 z-30 w-5 h-5 rounded-full bg-zinc-950 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-red-600 hover:border-red-500 flex items-center justify-center transition-all shadow-lg cursor-pointer opacity-0 group-hover:opacity-100"
              title="Dismiss Chat Head"
            >
              <X size={12} />
            </button>

            {/* Draggable & Clickable Chat Head Avatar */}
            <div
              onPointerDown={(e) => {
                hasMovedRef.current = false;
                dragStartPos.current = {
                  x: e.clientX,
                  y: e.clientY,
                  startLeft: position.x,
                  startTop: position.y,
                };
                setIsDragging(true);
              }}
              onClick={() => {
                if (!hasMovedRef.current) {
                  handleOpenChat();
                }
              }}
              className={`relative w-14 h-14 rounded-full bg-zinc-950 border-2 ${
                totalUnreadCount > 0
                  ? 'border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.6)] animate-pulse'
                  : 'border-orange-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
              } flex items-center justify-center transition-transform ${
                isDragging ? 'scale-110 cursor-grabbing' : 'hover:scale-105 cursor-grab active:scale-95'
              }`}
              title={targetUser ? `Open Chat with ${targetUser.name}` : 'Open Encrypted Messages'}
            >
              {targetUser?.avatar_url ? (
                <img
                  src={targetUser.avatar_url}
                  alt={targetUser.name}
                  className="w-full h-full rounded-full object-cover pointer-events-none"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                  }}
                />
              ) : targetUser?.name ? (
                <span className="font-mono font-black text-orange-400 text-sm pointer-events-none">
                  {targetUser.name.substring(0, 2).toUpperCase()}
                </span>
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-600 via-red-600 to-zinc-950 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white pointer-events-none" />
                </div>
              )}

              {/* Glowing Unread Badge Counter */}
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5.5 min-w-5.5 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-mono font-extrabold text-white shadow-lg ring-2 ring-black">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}

              {/* Live Signal Status Dot */}
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-zinc-950 rounded-full pointer-events-none transition-colors ${
                  targetUser
                    ? targetFormatted.dotClass
                    : totalUnreadCount > 0
                    ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse'
                    : 'bg-emerald-500/80 ring-1 ring-emerald-950'
                }`}
                title={targetUser ? targetFormatted.text : 'Direct Comms'}
              />
            </div>
          </div>
        </div>

        {/* Drag-to-Dismiss Drop Target at bottom center */}
        {isDragging && (
          <div className="fixed inset-x-0 bottom-6 z-[9999999] pointer-events-none flex flex-col justify-end items-center">
            <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-200 border ${
              isOverDismiss 
                ? 'bg-red-600 border-red-400 scale-125 text-white shadow-[0_0_35px_rgba(239,68,68,0.9)]' 
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-400 scale-100 backdrop-blur-md shadow-2xl'
            }`}>
              <X size={24} className="stroke-[3]" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider mt-0.5">Dismiss</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // EXPANDED FLOATING CHAT PANE
  return (
    <div 
      className="fixed z-[10000000] bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[85vh] bg-[#0c0a0e] border border-orange-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-950/90 border-b border-orange-500/30 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          {viewMode === 'chat' && (
            <button
              onClick={() => setViewMode('list')}
              className="p-1 text-zinc-400 hover:text-orange-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              title="All Conversations"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {viewMode === 'chat' && targetUser ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-orange-500/50 shrink-0 bg-zinc-900">
                {targetUser.avatar_url ? (
                  <img src={targetUser.avatar_url} alt={targetUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-orange-400 font-mono text-xs font-bold">
                    {targetUser.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-black ${targetFormatted.dotClass}`} />
              </div>
              <div className="min-w-0">
                <h4 className="font-mono font-bold text-xs sm:text-sm text-white truncate">
                  {targetUser.name}
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${targetFormatted.dotClass}`} />
                  <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                    targetFormatted.isOnline
                      ? 'text-emerald-400'
                      : targetFormatted.isRecentlyActive
                      ? 'text-amber-400'
                      : 'text-zinc-500'
                  }`}>
                    {targetFormatted.text}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Radio size={16} />
              </div>
              <div>
                <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
                  NEXUS DIRECT COMM
                </h4>
                <span className="text-[10px] font-mono text-zinc-400">Direct Transmissions</span>
              </div>
            </div>
          )}
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          {totalUnreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-medium text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer mr-1"
              title="Mark All Conversations As Read"
            >
              <CheckCheck size={14} />
              <span className="hidden sm:inline">Mark Read</span>
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            title="Minimize to Floating Bubble"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={handleDismissChatHead}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            title="Close & Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Content: Chat Stream or Thread List */}
      {viewMode === 'chat' && targetUser ? (
        <>
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-zinc-950/40 scrollbar-thin scrollbar-thumb-zinc-800">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                <Sparkles className="w-8 h-8 text-orange-400/60 animate-pulse" />
                <p className="font-mono text-xs text-zinc-400">
                  Encrypted frequency established with <span className="text-orange-400 font-bold">{targetUser.name}</span>.
                </p>
                <p className="text-[11px] text-zinc-600 font-mono">
                  Type below to send an instant direct message.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUserId || msg.sender_id === 'me' || (msg as any).sender === 'user';
                return (
                  <div key={msg.id ? `msg-${msg.id}-${idx}` : `msg-${idx}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs font-mono break-words shadow-md ${
                        isMe
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-black font-bold rounded-br-xs'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-xs'
                      }`}
                    >
                      {msg.message}
                    </div>
                    {msg.created_at && (
                      <span className="text-[9px] font-mono text-zinc-600 px-1 mt-0.5">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Input Bar */}
          <form onSubmit={handleSend} className="p-2.5 bg-zinc-950 border-t border-zinc-800/80 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message @${targetUser.name}...`}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:hover:bg-orange-500 text-black font-bold rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Send size={15} />
            </button>
          </form>
        </>
      ) : (
        /* Conversation Threads List */
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/40">
          <div className="p-3 border-b border-zinc-800/80 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            {totalUnreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-emerald-950/50 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 rounded-xl text-[11px] font-mono transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 font-mono text-xs space-y-2">
                <User className="w-8 h-8 mx-auto text-zinc-600" />
                <p>No active conversations found.</p>
                <p className="text-[10px] text-zinc-600">Click "Message" on any user or band profile to start a thread.</p>
              </div>
            ) : (
              filteredConversations.map((conv, idx) => (
                <FloatingConversationRow
                  key={`${conv.id}-${idx}`}
                  conv={conv}
                  onSelect={() => {
                    setTargetUser({
                      id: conv.id,
                      name: conv.name,
                      avatar_url: conv.avatar,
                    });
                    setViewMode('chat');
                    handleMarkThreadRead(conv.id);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { openFloatingChat };
export default FloatingChatHead;
