import { useState, useRef, useEffect, useCallback } from 'react';
import { getSupabase, normalizeLoadedProfile } from '../../supabase';
import { extractUUID } from '../../utils/socialFeedUtils';
import { getValidUserId, sendDirectMessage, openFloatingChat } from '../../store/useChatStore';
import { markChatAsRead } from '../../lib/chat';
import { useChats } from '../../hooks/useChats';
import { presenceManager } from '../../lib/presence';

export type MessageType = {
  id: string;
  sender: string;
  text?: string;
  time: string;
  image?: string;
  link?: string;
  voice?: boolean;
  voiceDuration?: string;
  voiceAudioUrl?: string;
  reactions?: { emoji: string; by: string }[];
  replyTo?: MessageType;
  status?: 'sent' | 'delivered' | 'read';
};

export type ChatType = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  roleBadge: string;
  roleColor: string;
  online: boolean;
  unread: number;
  messages: MessageType[];
  settings?: {
    muted?: boolean;
    notifications?: boolean;
    autoSavePhotos?: boolean;
    disappearing?: 'Off' | '24 hours' | '7 days';
    readReceipts?: boolean;
    typingIndicator?: boolean;
    blocked?: boolean;
    restricted?: boolean;
    hidden?: boolean;
  };
};

interface UseNexusMessagingOptions {
  userProfile: any;
  setAllProfiles?: React.Dispatch<React.SetStateAction<any[]>>;
  setAllFollows?: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useNexusMessaging({ userProfile, setAllProfiles, setAllFollows }: UseNexusMessagingOptions) {
  const { totalUnreadCount: hookUnreadCount, refetch: refetchChats } = useChats();

  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [typedMessage, setTypedMessage] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<MessageType | null>(null);
  const [showConversationSettings, setShowConversationSettings] = useState(false);
  const [showInboxSettings, setShowInboxSettings] = useState(false);
  const [globalReadReceipts, setGlobalReadReceipts] = useState(true);
  const [globalActiveStatus, setGlobalActiveStatus] = useState(true);
  const [whoCanReachMe, setWhoCanReachMe] = useState<'everyone' | 'artists_bands' | 'mutuals'>('everyone');
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  const isIncomingChatSync = useRef(false);

  // Sync listener effect
  useEffect(() => {
    const handleSync = () => {
      refetchChats();
    };

    window.addEventListener('nexus_chats_updated', handleSync);
    window.addEventListener('nexus_chat_read', handleSync);
    window.addEventListener('nexus_all_read', handleSync);

    return () => {
      window.removeEventListener('nexus_chats_updated', handleSync);
      window.removeEventListener('nexus_chat_read', handleSync);
      window.removeEventListener('nexus_all_read', handleSync);
    };
  }, [refetchChats]);

  const getRecipientEmail = useCallback(async (chat: ChatType) => {
    if (chat.id && chat.id.includes('@')) {
      return chat.id;
    }
    const supabaseClient = getSupabase();
    if (!supabaseClient) return null;
    try {
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('*');
      if (profiles) {
        const chatNameLower = chat.name.toLowerCase().trim();
        const chatIdLower = chat.id.toLowerCase().trim();
        const found = profiles.find((p: any) => {
          const pName = (p?.name || "User" || p.full_name || p.email || '').toLowerCase().trim();
          const pHandle = (p.console_handle || '').toLowerCase().trim();
          const pLabel = (p.label_company_name || '').toLowerCase().trim();
          const pBand = (p.bandName || '').toLowerCase().trim();
          const pCreative = (p.creative_name || p.creative_metadata?.business_name || '').toLowerCase().trim();
          const pPromoter = (p.promoter_name || p.promoter_metadata?.brand_name || '').toLowerCase().trim();
          const pEmail = (p.email || '').toLowerCase().trim();
          const pId = (p.id || '').toLowerCase().trim();
          return pName === chatNameLower || 
                 pHandle === chatNameLower || 
                 pHandle === chatIdLower ||
                 pLabel === chatNameLower || 
                 pBand === chatNameLower || 
                 pCreative === chatNameLower || 
                 pPromoter === chatNameLower ||
                 pEmail === chatNameLower ||
                 pId === chatIdLower ||
                 pEmail === chatIdLower;
        });
        if (found && found.email) {
          return found.email;
        }
      }
    } catch (e) {
      console.warn("Failed to lookup recipient email:", e);
    }
    return `${chat.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@nexus.network`;
  }, []);

  const loadChatsFromSupabase = useCallback(async () => {
    const supabaseClient = getSupabase();
    if (!supabaseClient || !userProfile?.id || !userProfile?.email) return;

    try {
      const emailKey = userProfile.email.toLowerCase().trim();

      // 1. Fetch all profiles safely with resilience
      let profiles: any[] = [];
      let pErr: any = null;

      try {
        const res = await supabaseClient.from('profiles').select('*');
        if (res.error) {
          pErr = res.error;
        } else if (res.data) {
          profiles = res.data;
        }
      } catch (err: any) {
        pErr = err;
      }

      if (pErr) {
        console.warn('Notice fetching profiles in useNexusMessaging:', pErr?.message || pErr);
        const clientInstance = getSupabase();
        if (clientInstance && clientInstance !== supabaseClient) {
          try {
            const fallback = await clientInstance.from('profiles').select('*');
            if (!fallback.error && fallback.data) {
              profiles = fallback.data;
              pErr = null;
            }
          } catch (fErr) {
            console.warn('Fallback profile query notice:', fErr);
          }
        }
      }

      if (setAllProfiles) {
        const normalizedProfiles = (profiles || []).map((p: any) => normalizeLoadedProfile(p));
        setAllProfiles(normalizedProfiles);
      }

      if (setAllFollows) {
        const { data: followsData, error: fErr } = await supabaseClient
          .from('follows')
          .select('follower_id, followed_id');
        if (!fErr && followsData) {
          setAllFollows(followsData.map((f: any) => ({
            fan_profile_id: f.follower_id,
            artist_id: f.followed_id
          })));
        }
      }

      let myUuid = extractUUID(userProfile.id) || userProfile.id;
      let authUid = '';
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user?.id) authUid = session.user.id;
      } catch (e) {}

      const myIds = Array.from(new Set([
        userProfile.id,
        userProfile.email,
        emailKey,
        myUuid,
        authUid
      ].filter(Boolean)));

      // 2. Fetch all relational messages involving current user
      let messages: any[] = [];
      
      try {
        const isValidUUIDLocal = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const validUuids = myIds.filter(id => typeof id === 'string' && isValidUUIDLocal(id));
        const filterParts = validUuids.flatMap(id => [
          `sender_id.eq.${id}`,
          `receiver_id.eq.${id}`,
          `recipient_id.eq.${id}`
        ]);

        if (filterParts.length > 0) {
          const { data: rawRemoteMsgs, error: mErr } = await supabaseClient
            .from('nexus_chats')
            .select('*')
            .or(filterParts.join(','))
            .order('created_at', { ascending: true });

          if (mErr) {
            console.warn("Failed to fetch relational messages in useNexusMessaging:", mErr);
          } else if (rawRemoteMsgs) {
            messages = rawRemoteMsgs;
          }
        }
      } catch (err) {
        console.warn("Exception fetching nexus_chats in useNexusMessaging:", err);
      }

      const threadsMap = new Map<string, ChatType>();

      // Pre-populate with all other profiles in the system by default
      profiles?.forEach((p: any) => {
        if (!p.email) return;
        const otherEmail = p.email.toLowerCase().trim();
        if (otherEmail === emailKey) return; // skip myself

        const roleStr = p.account_type || 'User';

        let resolvedAvatar = p.avatar_url;
        if (roleStr.toLowerCase().includes('label') && p.label_avatar) resolvedAvatar = p.label_avatar;
        else if (roleStr.toLowerCase().includes('creative') && p.creative_avatar) resolvedAvatar = p.creative_avatar;
        else if (roleStr.toLowerCase().includes('promoter') && p.promoter_logo) resolvedAvatar = p.promoter_logo;

        threadsMap.set(otherEmail, {
          id: otherEmail,
          name: p.full_name || p.console_handle || p.email,
          avatar: resolvedAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          role: roleStr,
          roleBadge: roleStr.toUpperCase().split(' / ')[0],
          roleColor: 'text-purple-400 bg-purple-955/10 border-purple-900/30',
          online: presenceManager.isOnline(p || otherEmail),
          unread: 0,
          messages: []
        });
      });

      messages?.forEach((msg: any) => {
        const receiverId = msg.receiver_id || msg.recipient_id;
        if (!msg.sender_id || !receiverId) return;

        const isMeSender = (myIds || []).some(id => String(id).toLowerCase() === String(msg.sender_id).toLowerCase());
        const otherUserId = isMeSender ? receiverId : msg.sender_id;

        const otherProfile = profiles?.find((p: any) =>
          p.id === otherUserId ||
          p.email?.toLowerCase().trim() === String(otherUserId).toLowerCase().trim() ||
          (p?.name || "User").toLowerCase().trim() === String(otherUserId).toLowerCase().trim() ||
          p.username?.toLowerCase().trim() === String(otherUserId).toLowerCase().trim() ||
          p.console_handle?.toLowerCase().trim() === String(otherUserId).toLowerCase().trim()
        );

        const otherEmail = otherProfile?.email ? otherProfile.email.toLowerCase().trim() : String(otherUserId).toLowerCase().trim();

        if (!threadsMap.has(otherEmail)) {
          const roleStr = otherProfile?.account_type || 'User';

          let resolvedAvatar = otherProfile?.avatar_url;
          if (roleStr.toLowerCase().includes('label') && otherProfile?.label_avatar) resolvedAvatar = otherProfile.label_avatar;
          else if (roleStr.toLowerCase().includes('creative') && otherProfile?.creative_avatar) resolvedAvatar = otherProfile.creative_avatar;
          else if (roleStr.toLowerCase().includes('promoter') && otherProfile?.promoter_logo) resolvedAvatar = otherProfile.promoter_logo;

          threadsMap.set(otherEmail, {
            id: otherEmail,
            name: otherProfile?.full_name || otherProfile?.console_handle || otherProfile?.name || otherEmail,
            avatar: resolvedAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            role: roleStr,
            roleBadge: roleStr.toUpperCase().split(' / ')[0],
            roleColor: 'text-purple-400 bg-purple-955/10 border-purple-900/30',
            online: presenceManager.isOnline(otherProfile || otherEmail),
            unread: 0,
            messages: []
          });
        }

        const thread = threadsMap.get(otherEmail)!;

        const formattedMsg: MessageType & { rawTime: number } = {
          id: msg.id,
          sender: isMeSender ? 'user' : 'them',
          text: msg.message || msg.content || '',
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTime: new Date(msg.created_at).getTime()
        };

        if (!(thread?.messages || []).some((m) => m.id === msg.id || (m.text === formattedMsg.text && m.sender === formattedMsg.sender))) {
          thread.messages.push(formattedMsg);
        }

        if (!msg.is_read && !isMeSender) {
          thread.unread += 1;
        }
      });

      const remoteChats = Array.from(threadsMap.values());
      
      // Merge with localStorage
      try {
        const localSaved = localStorage.getItem(`nexus_chats_${emailKey}`);
        if (localSaved) {
          const localChats = JSON.parse(localSaved);
          if (Array.isArray(localChats)) {
            localChats.forEach((lc: any) => {
              const rc = remoteChats.find((c: any) => 
                c.id === lc.id || 
                c.id === lc.contactId || 
                (lc.email && c.id.toLowerCase() === String(lc.email).toLowerCase()) || 
                (lc.contactId && c.id.toLowerCase() === String(lc.contactId).toLowerCase()) || 
                (c.name && lc.name && c.name.toLowerCase() === lc.name.toLowerCase()) || 
                (c.name && lc.profileName && c.name.toLowerCase() === lc.profileName.toLowerCase())
              );
              if (rc) {
                if (lc.unread === 0 || lc.isRead === true || lc.is_read === true) {
                  rc.unread = 0;
                }
                if (Array.isArray(lc.messages)) {
                  lc.messages.forEach((lm: any) => {
                    if (!(rc?.messages || []).some((rm: any) => rm.id === lm.id || (rm.text === lm.text && rm.sender === lm.sender))) {
                      rc.messages.push(lm);
                    }
                  });
                }
              } else if (lc.messages && lc.messages.length > 0) {
                if (lc.unread === 0 || lc.isRead === true || lc.is_read === true) {
                  lc.unread = 0;
                }
                remoteChats.push(lc);
              }
            });
          }
        }
      } catch (e) {}

      // Force selected thread to be read
      remoteChats.forEach(rc => {
        if (selectedChatId && (rc.id === selectedChatId || rc.id.toLowerCase() === selectedChatId.toLowerCase())) {
          rc.unread = 0;
        }
      });

      // Sort
      const sortedRemoteChats = remoteChats.sort((a, b) => {
        const aHasMsgs = a.messages && a.messages.length > 0;
        const bHasMsgs = b.messages && b.messages.length > 0;
        if (aHasMsgs && !bHasMsgs) return -1;
        if (!aHasMsgs && bHasMsgs) return 1;
        if (aHasMsgs && bHasMsgs) {
          const timeA = (a.messages[a.messages.length - 1] as any).rawTime || 0;
          const timeB = (b.messages[b.messages.length - 1] as any).rawTime || 0;
          return timeB - timeA;
        }
        return 0;
      });

      isIncomingChatSync.current = true;
      setChats(sortedRemoteChats);

      try {
        localStorage.setItem(`nexus_chats_${emailKey}`, JSON.stringify(sortedRemoteChats));
      } catch (e) {}

    } catch (err) {
      console.warn("Error loading relational chats in useNexusMessaging:", err);
    }
  }, [userProfile?.id, userProfile?.email, setAllProfiles, setAllFollows, selectedChatId]);

  // Handle message sending
  const handleSendMessage = useCallback((customData?: any) => {
    if (!typedMessage.trim() && !customData && !selectedChatId) return;
    if (!selectedChatId) return;
    
    const textToSend = typedMessage;
    const newMessage = {
      id: `sent-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: 'Just now',
      replyTo: replyingToMessage || undefined,
      ...customData
    };
    
    const emailKey = userProfile?.email?.toLowerCase().trim();
    setChats(prev => {
      const newList = prev.map(c => {
        if (c.id === selectedChatId) {
          return {
            ...c,
            messages: [...c.messages, newMessage]
          };
        }
        return c;
      });
      if (emailKey) {
        try {
          localStorage.setItem(`nexus_chats_${emailKey}`, JSON.stringify(newList));
        } catch (e) {}
      }
      return newList;
    });

    window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
    
    setTypedMessage('');
    setReplyingToMessage(null);
    setAttachmentMenuOpen(false);

    // Sync to real recipient in Supabase relationally
    const syncMessageToRecipient = async () => {
      const supabaseClient = getSupabase();
      if (!supabaseClient || !userProfile?.email) return;

      const activeChat = chats.find(c => c.id === selectedChatId);
      if (!activeChat) return;

      const rawRecipientEmail = await getRecipientEmail(activeChat);
      if (!rawRecipientEmail) {
        console.warn("Recipient email not found for chat:", activeChat?.name);
        return;
      }

      const recipientEmail = rawRecipientEmail.toLowerCase().trim();

      try {
        const senderId = userProfile?.id || (await getValidUserId(supabaseClient));

        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', recipientEmail)
          .maybeSingle();

        const receiverId = profileData?.id || extractUUID(recipientEmail) || recipientEmail;

        if (senderId && receiverId) {
          const msgContent = newMessage.text || 'Sent an attachment';

          const { data: chatData, error: insertErr } = await sendDirectMessage(senderId, receiverId, msgContent);

          if (insertErr) {
            console.error('[Chat Engine] Failed to write message to Supabase:', insertErr);
          } else {
            console.log('[Chat Engine] Real database message successfully persisted:', chatData);
          }

          // Insert notification using valid UUID
          const receiverUUID = (profileData?.id && extractUUID(profileData.id)) || extractUUID(receiverId);
          if (receiverUUID) {
            const newNotifId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000000';
            await supabaseClient
              .from('nexus_notifications')
              .insert([{
                id: newNotifId,
                user_id: receiverUUID,
                title: '💬 NEW MESSAGE',
                message: `New message from ${userProfile.name || userProfile.full_name || 'Nexus Contact'}: "${(newMessage.text || 'Sent an attachment').substring(0, 60)}"`,
                category: 'CHAT',
                type: 'chat_message',
                is_read: false,
                created_at: new Date().toISOString()
              }]);
          }
        }
      } catch (err) {
        console.warn("Failed to sync message to recipient relationally:", err);
      }
    };

    syncMessageToRecipient();
  }, [typedMessage, selectedChatId, replyingToMessage, userProfile, chats, getRecipientEmail]);

  // Load chats on mount / profile change
  useEffect(() => {
    try {
      if (userProfile?.email) {
        const emailKey = userProfile.email.toLowerCase().trim();
        const saved = localStorage.getItem(`nexus_chats_${emailKey}`);
        if (saved) {
          setChats(JSON.parse(saved));
        }
      }
    } catch (e) {
      console.warn("Failed to load chats from localStorage:", e);
    }

    loadChatsFromSupabase();
  }, [userProfile?.email, userProfile?.id, loadChatsFromSupabase]);

  // Automatically mark messages as read when selectedChatId changes
  useEffect(() => {
    if (!selectedChatId || !userProfile?.id) return;

    markChatAsRead(selectedChatId, userProfile.id);

    const supabaseClient = getSupabase();

    setChats(prev => {
      const updated = prev.map(c => {
        if (c.id === selectedChatId || c.name?.toLowerCase() === selectedChatId.toLowerCase()) {
          return {
            ...c,
            unread: 0,
            isRead: true,
            is_read: true,
            messages: Array.isArray(c.messages)
              ? c.messages.map(m => ({ ...m, status: 'read' as const }))
              : c.messages
          };
        }
        return c;
      });
      if (userProfile?.email) {
        const emailKey = userProfile.email.toLowerCase().trim();
        try {
          localStorage.setItem(`nexus_chats_${emailKey}`, JSON.stringify(updated));
        } catch (e) {
          console.warn("Failed to write chats to localStorage inside select setter:", e);
        }
      }
      return updated;
    });

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
      window.dispatchEvent(new CustomEvent('nexus_chat_read', { detail: { chatId: selectedChatId } }));
    }, 0);

    if (!supabaseClient) return;

    const myProfileUuid = extractUUID(userProfile.id) || userProfile.id;

    // Direct RPC call
    supabaseClient.rpc('mark_all_chats_and_notifications_read', {
      p_profile_id: myProfileUuid
    }).then(() => {}, () => {});

    const isUuid = extractUUID(selectedChatId);
    if (isUuid) {
      supabaseClient.rpc('mark_thread_as_read', {
        p_chat_id: selectedChatId,
        p_profile_id: myProfileUuid
      }).then(() => {}, () => {});

      // Direct update
      supabaseClient
        .from('nexus_chats')
        .update({ is_read: true })
        .eq('sender_id', selectedChatId)
        .or(`receiver_id.eq.${myProfileUuid},recipient_id.eq.${myProfileUuid}`)
        .eq('is_read', false)
        .then(({ error }) => {
          if (error) {
            console.warn("[useNexusMessaging] Direct update warning:", error);
          }
        });
    } else {
      // It's an email or username, resolve from profiles
      supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', selectedChatId)
        .maybeSingle()
        .then(({ data: profData }) => {
          if (profData?.id) {
            const senderUuid = extractUUID(profData.id) || profData.id;
            supabaseClient.rpc('mark_thread_as_read', {
              p_chat_id: senderUuid,
              p_profile_id: myProfileUuid
            }).then(() => {}, () => {});

            supabaseClient
              .from('nexus_chats')
              .update({ is_read: true })
              .eq('sender_id', senderUuid)
              .or(`receiver_id.eq.${myProfileUuid},recipient_id.eq.${myProfileUuid}`)
              .eq('is_read', false)
              .then(() => {});
          }
        });
    }
  }, [selectedChatId, userProfile?.id, userProfile?.email]);

  // Save chats to localStorage whenever chats or userProfile?.email changes
  useEffect(() => {
    if (!userProfile?.email) return;
    try {
      const emailKey = userProfile.email.toLowerCase().trim();
      const chatsStr = JSON.stringify(chats);
      localStorage.setItem(`nexus_chats_${emailKey}`, chatsStr);
    } catch (e) {
      console.warn("Failed to save chats to localStorage:", e);
    }
  }, [chats, userProfile?.email]);

  return {
    chats,
    setChats,
    selectedChatId,
    setSelectedChatId,
    chatSearch,
    setChatSearch,
    typedMessage,
    setTypedMessage,
    replyingToMessage,
    setReplyingToMessage,
    showConversationSettings,
    setShowConversationSettings,
    showInboxSettings,
    setShowInboxSettings,
    globalReadReceipts,
    setGlobalReadReceipts,
    globalActiveStatus,
    setGlobalActiveStatus,
    whoCanReachMe,
    setWhoCanReachMe,
    attachmentMenuOpen,
    setAttachmentMenuOpen,
    isRecordingVoice,
    setIsRecordingVoice,
    recordingTime,
    setRecordingTime,
    activeReactionMessageId,
    setActiveReactionMessageId,
    loadChatsFromSupabase,
    getRecipientEmail,
    handleSendMessage,
    openFloatingChat,
    hookUnreadCount,
    refetchChats
  };
}
