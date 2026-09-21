import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { markChatAsRead, handleMarkAllAsRead, isUnread } from '../../lib/chat';
import { 
  Search, 
  Settings,
  SlidersHorizontal, 
  ArrowLeft, 
  MessageSquare, 
  RefreshCw, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  Check, 
  CheckCheck, 
  ChevronLeft,
  Terminal,
  Sparkles,
  Info,
  ShieldAlert,
  UserX,
  Bell,
  BellOff,
  Pin,
  Trash2,
  ExternalLink,
  Lock,
  VolumeX,
  Slash,
  UserCheck,
  MoreVertical,
  Plus,
  Flag,
  Music,
  SquarePen,
  User,
  Users
} from 'lucide-react';
import { InboxPreferences } from './InboxPreferences';
import { useUserPresence, presenceManager, formatPresenceStatus } from '../../lib/presence';

export interface InboxConversation {
  contactId: string;
  profileName: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  isRead: boolean;
  roleBadge?: string;
  isMuted?: boolean;
  isPinned?: boolean;
  isBlocked?: boolean;
  isRestricted?: boolean;
  nickname?: string;
}

// Dedicated row with real-time live presence tracking
const InboxConversationRow: React.FC<{
  chat: InboxConversation;
  displayName: string;
  isMuted?: boolean;
  isPinned?: boolean;
  isBlocked?: boolean;
  isUnread: boolean;
  onSelect: () => void;
}> = ({ chat, displayName, isMuted, isPinned, isBlocked, isUnread, onSelect }) => {
  const { formatted, isOnline } = useUserPresence(chat);

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all group shadow-sm ${
        isUnread
          ? 'border-2 border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.45)] bg-rose-950/45 hover:bg-rose-900/60'
          : 'border border-zinc-800/80 bg-zinc-900/60 hover:bg-rose-950/20 hover:border-rose-900/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="relative shrink-0">
          <div className={`w-10 h-10 rounded-full bg-zinc-800 border flex items-center justify-center font-black text-xs text-rose-400 overflow-hidden shadow-md ${isUnread ? 'border-red-500 ring-2 ring-red-500/30' : 'border-zinc-700'}`}>
            {chat.avatarUrl ? (
              <img src={chat.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.substring(0, 2).toUpperCase()
            )}
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full border-2 border-zinc-950 absolute -bottom-0.5 -right-0.5 shadow-sm transition-colors ${
              isBlocked ? 'bg-rose-500' : formatted.dotClass
            }`}
            title={formatted.text}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-black truncate transition-colors ${isUnread ? 'text-white font-extrabold' : 'text-zinc-200 group-hover:text-rose-300'}`}>
              {displayName}
            </span>
            {isUnread && (
              <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-red-600 text-white shadow-sm animate-pulse shrink-0">
                UNREAD
              </span>
            )}
            {isPinned && (
              <Pin className="w-3 h-3 text-rose-400 shrink-0 fill-rose-400/20" />
            )}
            {isMuted && (
              <VolumeX className="w-3 h-3 text-zinc-500 shrink-0" />
            )}
            {chat.roleBadge && (
              <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-800/90 border border-zinc-700 text-zinc-400">
                {chat.roleBadge}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className={`text-[11px] truncate max-w-[220px] font-sans ${isUnread ? 'text-zinc-100 font-semibold' : 'text-zinc-400'}`}>
              {isBlocked ? '[Signal Blocked]' : chat.lastMessage}
            </div>
            <span className="text-[9px] font-mono text-zinc-500 shrink-0">
              {isOnline ? (
                <span className="text-emerald-400 font-bold">Active now</span>
              ) : (
                formatted.shortText
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end shrink-0 gap-1 pl-1">
        <span className={`text-[9px] font-mono ${isUnread ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
          {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isUnread && (
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
        )}
      </div>
    </div>
  );
};

interface InboxTerminalProps {
  onBack?: () => void;
  userProfile?: any;
  allProfiles?: any[];
  discoverProfiles?: any[];
  onSelectProfile?: (profile: any) => void;
}

const isValidUUID = (str: string | undefined | null): boolean => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

export const InboxTerminal: React.FC<InboxTerminalProps> = ({
  onBack,
  userProfile: initialUserProfile,
  allProfiles = [],
  discoverProfiles = [],
  onSelectProfile,
}) => {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Active conversation & messages
  const [selectedContact, setSelectedContact] = useState<InboxConversation | null>(null);
  const selectedPresence = useUserPresence(selectedContact);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Media & Attachments
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Global Settings Modal / Preferences
  const [showSettings, setShowSettings] = useState(false);
  
  // Per-Thread Settings Modal
  const [showThreadSettings, setShowThreadSettings] = useState(false);
  const [threadNicknames, setThreadNicknames] = useState<Record<string, string>>({});
  const [mutedThreads, setMutedThreads] = useState<Record<string, boolean>>({});
  const [pinnedThreads, setPinnedThreads] = useState<Record<string, boolean>>({});
  const [blockedContacts, setBlockedContacts] = useState<Record<string, boolean>>({});
  const [restrictedContacts, setRestrictedContacts] = useState<Record<string, boolean>>({});

  const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserProfile?.id || null);
  const [userProfile, setUserProfile] = useState<any>(initialUserProfile || null);
  const [globalReadReceipts, setGlobalReadReceipts] = useState(true);
  const [globalActiveStatus, setGlobalActiveStatus] = useState(true);
  const [whoCanReachMe, setWhoCanReachMe] = useState<'everyone' | 'artists_bands' | 'mutuals'>('everyone');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [myNote, setMyNote] = useState<string | null>(() => {
    if (initialUserProfile?.update_ticker) return initialUserProfile.update_ticker;
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('nexus_user_thought_note') || null;
    }
    return null;
  });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [realStories, setRealStories] = useState<any[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  const [expandedThought, setExpandedThought] = useState<{
    id?: string;
    name: string;
    handle?: string;
    avatar?: string;
    note: string;
    song?: string;
    roleBadge?: string;
    rawProfile?: any;
    isMine?: boolean;
  } | null>(null);

  // Helper to filter out test probes, dummy placeholders, and disconnected phantom accounts
  const isLegitimateRecipientProfile = (profile: any): boolean => {
    if (!profile) return false;

    const raw = profile.raw || profile.rawProfile || profile;
    const name = String(profile.name || raw.full_name || raw.name || raw.profileName || '').trim();
    const handle = String(profile.handle || raw.console_handle || raw.handle || '').trim();
    const email = String(profile.email || raw.email || '').toLowerCase().trim();
    const avatar = String(profile.avatar || profile.avatarUrl || raw.avatar_url || raw.avatar || '').trim();
    const bio = String(profile.subtext || raw.bio || raw.description || raw.note || '').trim();
    const band = String(raw.band_name || raw.bandName || '').trim();
    const label = String(raw.label_company_name || raw.label_name || '').trim();
    const creative = String(raw.creative_name || raw.business_name || '').trim();
    const promoter = String(raw.promoter_name || raw.agency_name || raw.brand_name || '').trim();

    // 1. Exclude test probes / mock probe domains
    if (email.includes('test_probe') || email.includes('@example.com') || email.includes('probe_')) {
      return false;
    }

    // 2. Reject placeholder names without real identity credentials
    const lowerName = name.toLowerCase();
    const isPlaceholderName = 
      !name ||
      lowerName === 'new user' ||
      lowerName === 'user' ||
      lowerName === 'nexus user' ||
      lowerName === 'anonymous' ||
      lowerName === 'guest';

    if (isPlaceholderName) {
      const hasCustomHandle = Boolean(handle && !handle.toLowerCase().includes('user') && handle !== '@');
      const hasAffiliation = Boolean(band || label || creative || promoter);
      const hasCustomAvatar = Boolean(avatar && !avatar.includes('default') && !avatar.includes('placeholder'));
      const hasMeaningfulBio = Boolean(bio && bio !== 'Connecting on Nexus');
      
      // If it lacks real identity credentials, it's not a real account
      if (!hasCustomHandle && !hasAffiliation && !hasCustomAvatar && !hasMeaningfulBio) {
        return false;
      }
    }

    // Must have an ID or name
    if (!profile.id && !name) {
      return false;
    }

    return true;
  };

  // Suggested & searchable in-app contacts for the compose modal
  const availableRecipientProfiles = React.useMemo(() => {
    const recipientsList: any[] = [];
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const seenHandles = new Set<string>();
    const seenNames = new Set<string>();

    const activeUserIds = new Set(
      [
        currentUserId,
        initialUserProfile?.id,
        userProfile?.id,
        userProfile?.email?.toLowerCase().trim(),
        userProfile?.console_handle?.toLowerCase().replace(/^@/, '').trim(),
        userProfile?.full_name?.toLowerCase().trim(),
      ].filter(Boolean)
    );

    const addOrMergeRecipient = (candidate: {
      id?: string;
      name?: string;
      handle?: string;
      email?: string;
      avatar?: string;
      role?: string;
      subtext?: string;
      raw?: any;
    }) => {
      if (!candidate || !isLegitimateRecipientProfile(candidate)) return;

      const rawObj = candidate.raw || candidate;
      const rawIdStr = String(candidate.id || rawObj.id || rawObj.user_id || '').trim();
      const normId = rawIdStr.replace(/^real-p-/, '').toLowerCase();
      const normEmail = String(candidate.email || rawObj.email || '').toLowerCase().trim();
      const rawHandle = String(candidate.handle || rawObj.console_handle || rawObj.handle || '').trim();
      const normHandle = rawHandle.replace(/^@/, '').toLowerCase().trim();
      const rawName = String(candidate.name || rawObj.full_name || rawObj.name || rawObj.profileName || '').trim();
      const normName = rawName.toLowerCase();

      // Skip current logged-in user
      if (
        (normId && activeUserIds.has(normId)) ||
        (rawIdStr && activeUserIds.has(rawIdStr.toLowerCase())) ||
        (normEmail && activeUserIds.has(normEmail)) ||
        (normHandle && activeUserIds.has(normHandle)) ||
        (normName && activeUserIds.has(normName))
      ) {
        return;
      }

      // Check for duplicate
      const isDuplicate =
        (normId && seenIds.has(normId)) ||
        (normEmail && seenEmails.has(normEmail)) ||
        (normHandle && seenHandles.has(normHandle)) ||
        (normName && normName !== 'user' && normName !== 'nexus user' && seenNames.has(normName));

      const cleanHandleDisplay = rawHandle
        ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`)
        : '';

      const cleanAvatar = candidate.avatar || rawObj.avatar_url || rawObj.avatar || '';

      if (isDuplicate) {
        // Find existing record and enrich with best details
        const existing = recipientsList.find(r => {
          const rRaw = r.raw || r;
          const rNormId = String(r.id || rRaw.id || '').replace(/^real-p-/, '').toLowerCase().trim();
          const rNormEmail = String(r.email || rRaw.email || '').toLowerCase().trim();
          const rNormHandle = String(r.handle || rRaw.console_handle || '').replace(/^@/, '').toLowerCase().trim();
          const rNormName = String(r.name || rRaw.full_name || '').toLowerCase().trim();
          return (
            (normId && rNormId === normId) ||
            (normEmail && rNormEmail === normEmail) ||
            (normHandle && rNormHandle === normHandle) ||
            (normName && normName !== 'user' && rNormName === normName)
          );
        });

        if (existing) {
          // If existing ID was prefixed or synthetic, but candidate has real UUID, adopt genuine UUID
          if (normId && (!existing.id || existing.id.startsWith('real-p-') || existing.id.startsWith('user-'))) {
            existing.id = rawIdStr.replace(/^real-p-/, '');
          }
          // If existing has no avatar or placeholder avatar, adopt candidate avatar
          if ((!existing.avatar || existing.avatar.includes('default')) && cleanAvatar && !cleanAvatar.includes('default')) {
            existing.avatar = cleanAvatar;
          }
          // If existing has no handle, adopt candidate handle
          if (!existing.handle && cleanHandleDisplay) {
            existing.handle = cleanHandleDisplay;
          }
          // If existing has generic subtext, adopt better subtext
          if (
            (!existing.subtext || existing.subtext === 'No updates posted yet' || existing.subtext === 'Connecting on Nexus') &&
            candidate.subtext &&
            candidate.subtext !== 'No updates posted yet'
          ) {
            existing.subtext = candidate.subtext;
          }
        }
        return;
      }

      // Record identity keys
      if (normId) seenIds.add(normId);
      if (normEmail) seenEmails.add(normEmail);
      if (normHandle) seenHandles.add(normHandle);
      if (normName && normName !== 'user' && normName !== 'nexus user') seenNames.add(normName);

      recipientsList.push({
        id: rawIdStr.replace(/^real-p-/, ''),
        name: rawName,
        handle: cleanHandleDisplay,
        email: normEmail,
        avatar: cleanAvatar,
        role: (candidate.role || rawObj.account_type || rawObj.role || 'USER').toUpperCase(),
        subtext: candidate.subtext || (rawObj.bio ? (rawObj.bio.length > 70 ? rawObj.bio.substring(0, 67) + '…' : rawObj.bio) : '') || '',
        raw: rawObj,
      });
    };

    // 1. Add all from realStories
    realStories.forEach(s => {
      addOrMergeRecipient({
        id: s.rawProfile?.id || s.id,
        name: s.profileName,
        handle: s.handle || '',
        avatar: s.avatarUrl || '',
        role: s.accountType || 'USER',
        subtext: s.note || s.song || '',
        raw: s.rawProfile,
      });
    });

    // 2. Add from allProfiles
    (allProfiles || []).forEach(p => {
      addOrMergeRecipient({
        id: p?.id,
        name: p?.full_name || p?.name || p?.console_handle,
        handle: p?.console_handle ? (p.console_handle.startsWith('@') ? p.console_handle : `@${p.console_handle}`) : '',
        email: p?.email,
        avatar: p?.avatar_url || p?.avatar || '',
        role: (p?.account_type || p?.role || 'USER').toUpperCase(),
        subtext: p?.bio || (p?.genre_tags?.length ? p.genre_tags.join(', ') : ''),
        raw: p,
      });
    });

    // 3. Add from discoverProfiles
    (discoverProfiles || []).forEach(p => {
      addOrMergeRecipient({
        id: p?.id,
        name: p?.full_name || p?.name || p?.console_handle,
        handle: p?.console_handle ? (p.console_handle.startsWith('@') ? p.console_handle : `@${p.console_handle}`) : '',
        email: p?.email,
        avatar: p?.avatar_url || p?.avatar || '',
        role: (p?.account_type || p?.role || 'USER').toUpperCase(),
        subtext: p?.bio || '',
        raw: p,
      });
    });

    // 4. Add from active conversations
    conversations.forEach(c => {
      if (c.contactId) {
        addOrMergeRecipient({
          id: c.contactId,
          name: c.profileName,
          handle: '',
          avatar: c.avatarUrl || '',
          role: (c.roleBadge || 'USER').toUpperCase(),
          subtext: c.lastMessage || '',
          raw: { id: c.contactId, full_name: c.profileName, avatar_url: c.avatarUrl },
        });
      }
    });

    const all = recipientsList.sort((a, b) => {
      // 1. Prioritize accounts with real photo avatars
      const aHasAvatar = Boolean(a.avatar && a.avatar.trim() !== '');
      const bHasAvatar = Boolean(b.avatar && b.avatar.trim() !== '');
      if (aHasAvatar && !bHasAvatar) return -1;
      if (!aHasAvatar && bHasAvatar) return 1;

      // 2. Prioritize accounts with handles
      const aHasHandle = Boolean(a.handle && a.handle.trim() !== '');
      const bHasHandle = Boolean(b.handle && b.handle.trim() !== '');
      if (aHasHandle && !bHasHandle) return -1;
      if (!aHasHandle && bHasHandle) return 1;

      return a.name.localeCompare(b.name);
    });

    if (!recipientSearchQuery.trim()) {
      return all.slice(0, 30);
    }

    const q = recipientSearchQuery.toLowerCase().trim();
    return all.filter(p => 
      p.name?.toLowerCase().includes(q) ||
      p.handle?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q) ||
      p.subtext?.toLowerCase().includes(q)
    );
  }, [realStories, allProfiles, discoverProfiles, conversations, currentUserId, initialUserProfile?.id, userProfile, recipientSearchQuery]);

  const handleStartNewMessageWithContact = (contact: any) => {
    const contactNormId = String(contact.id || '').replace(/^real-p-/, '').toLowerCase().trim();
    const contactNormName = String(contact.name || '').toLowerCase().trim();

    const existing = conversations.find(c => {
      const cNormId = String(c.contactId || '').replace(/^real-p-/, '').toLowerCase().trim();
      const cNormName = String(c.profileName || '').toLowerCase().trim();
      return (
        (contactNormId && cNormId === contactNormId) ||
        (contactNormName && cNormName === contactNormName)
      );
    });

    if (existing) {
      handleSelectContact(existing);
    } else {
      const newConv: InboxConversation = {
        contactId: contact.id,
        profileName: contact.name,
        avatarUrl: contact.avatar,
        lastMessage: '',
        timestamp: new Date().toISOString(),
        isRead: true,
        roleBadge: contact.role || 'USER',
      };
      setConversations(prev => [newConv, ...prev]);
      handleSelectContact(newConv);
    }
    setIsNewMessageModalOpen(false);
    setRecipientSearchQuery('');
  };

  const handleStartCustomMessage = () => {
    const customName = recipientSearchQuery.trim().replace(/^@/, '');
    if (!customName) return;
    const existing = conversations.find(c => c.profileName.toLowerCase() === customName.toLowerCase());
    if (existing) {
      handleSelectContact(existing);
    } else {
      const newConv: InboxConversation = {
        contactId: `user-${customName.toLowerCase()}`,
        profileName: customName,
        avatarUrl: '',
        lastMessage: '',
        timestamp: new Date().toISOString(),
        isRead: true,
        roleBadge: 'USER',
      };
      setConversations(prev => [newConv, ...prev]);
      handleSelectContact(newConv);
    }
    setIsNewMessageModalOpen(false);
    setRecipientSearchQuery('');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Resolve current authenticated user and profile
  const resolveCurrentUser = async () => {
    let uid: string | undefined;
    let email: string | undefined;
    let profileData: any = null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id;
      email = session?.user?.email?.toLowerCase().trim();
    } catch (e) {
      console.warn('[InboxTerminal] Auth session fetch warning:', e);
    }

    if (typeof localStorage !== 'undefined') {
      if (!uid) {
        const sbKey = Object.keys(localStorage).find(k => k.includes('sb-') && k.includes('-auth-token'));
        if (sbKey) {
          try {
            const parsed = JSON.parse(localStorage.getItem(sbKey) || '{}');
            if (parsed?.user?.id) uid = parsed.user.id;
            if (parsed?.user?.email) email = parsed.user.email.toLowerCase().trim();
          } catch (e) {}
        }
      }
      try {
        const stored = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
        if (stored) {
          profileData = JSON.parse(stored);
          if (!uid && profileData?.id) uid = profileData.id;
          if (!email && profileData?.email) email = profileData.email.toLowerCase().trim();
        }
      } catch (e) {}
    }

    if (uid && !profileData) {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
        if (data) profileData = data;
      } catch (e) {}
    }

    if (!profileData) {
      profileData = { id: uid || 'guest_user', name: 'You', email: email || '' };
    }

    setCurrentUserId(uid || profileData.id || null);
    setUserProfile(profileData);
    return { uid, email, profileData };
  };

  // Fetch top-level conversations list
  const fetchInboxConversations = async () => {
    setRefreshing(true);
    const { uid, email } = await resolveCurrentUser();

    const validUuids = Array.from(new Set([uid].filter((id): id is string => Boolean(id) && isValidUUID(id))));

    if (validUuids.length === 0) {
      console.warn('[InboxTerminal] Fetch aborted: No active user session or valid UUID available.');
      setConversations([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const myIdentifiers = Array.from(new Set([uid, email].filter(Boolean) as string[]));

    const filterConditions: string[] = [];
    validUuids.forEach(id => {
      filterConditions.push(`sender_id.eq.${id}`);
      filterConditions.push(`receiver_id.eq.${id}`);
      filterConditions.push(`recipient_id.eq.${id}`);
    });

    try {
      const { data: messages, error } = await supabase
        .from('nexus_chats')
        .select('*')
        .or(filterConditions.join(','))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[InboxTerminal] Error fetching chats from nexus_chats:', error.message);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!messages || messages.length === 0) {
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const contactIds = new Set<string>();
      const conversationMap = new Map<string, any>();

      messages.forEach((msg) => {
        const isMe = (myIdentifiers || []).some(id => 
          String(id).toLowerCase() === String(msg.sender_id).toLowerCase()
        );

        const contactId = isMe 
          ? (msg.receiver_id || msg.recipient_id) 
          : msg.sender_id;

        if (!contactId) return;

        if (!conversationMap.has(contactId)) {
          contactIds.add(contactId);
          conversationMap.set(contactId, {
            contactId,
            lastMessage: msg.message || msg.content || 'Media attachment',
            timestamp: msg.created_at,
            unreadCount: 0,
            isRead: true,
          });
        }

        const conv = conversationMap.get(contactId)!;
        // Incoming message from the other person that hasn't been read
        const msgUnread = uid ? isUnread(msg, uid) : (!isMe && (msg.is_read === false || msg.is_read === null));
        if (msgUnread) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
          conv.isRead = false;
        }
      });

      const idsArray = Array.from(contactIds);
      if (idsArray.length > 0) {
        const profileFilters: string[] = [];
        idsArray.forEach(id => {
          if (isValidUUID(id)) {
            profileFilters.push(`id.eq.${id}`);
          }
          if (id.includes('@')) {
            profileFilters.push(`email.eq.${id.toLowerCase().trim()}`);
          } else if (!isValidUUID(id)) {
            profileFilters.push(`console_handle.eq.${id}`);
          }
        });

        if (profileFilters.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name, console_handle, avatar_url, account_type')
            .or(profileFilters.join(','));

          const profileMap = new Map<string, any>();
          profiles?.forEach((p) => {
            if (p.id) profileMap.set(p.id, p);
            if (p.email) profileMap.set(p.email.toLowerCase().trim(), p);
            if (p.console_handle) profileMap.set(p.console_handle.toLowerCase().trim(), p);
          });

          const hydratedThreads: InboxConversation[] = Array.from(conversationMap.values()).map((thread) => {
            const profile = profileMap.get(thread.contactId) || profileMap.get(String(thread.contactId).toLowerCase().trim());
            const nameStr = profile?.full_name || profile?.console_handle || thread.contactId || 'Unknown Operator';
            
            return {
              ...thread,
              profileName: nameStr,
              avatarUrl: profile?.avatar_url,
              roleBadge: (profile?.account_type || 'User').toUpperCase(),
            };
          });

          setConversations(hydratedThreads);
        } else {
          setConversations(Array.from(conversationMap.values()).map(t => ({
            ...t,
            profileName: t.contactId,
            roleBadge: 'USER'
          })));
        }
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error('[InboxTerminal] Exception querying inbox conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch thread messages for active conversation
  const fetchThreadMessages = async (contactId: string) => {
    if (!contactId) return;
    setThreadLoading(true);

    const myUid = currentUserId || (await resolveCurrentUser()).uid;
    if (!myUid) {
      setThreadLoading(false);
      return;
    }

    try {
      const isMyUuid = isValidUUID(myUid);
      const isContactUuid = isValidUUID(contactId);

      let queryFilter = '';
      if (isMyUuid && isContactUuid) {
        queryFilter = `and(sender_id.eq.${myUid},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${myUid}),and(sender_id.eq.${myUid},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${myUid})`;
      } else {
        queryFilter = `and(sender_id.eq.${myUid},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${myUid})`;
      }

      const { data, error } = await supabase
        .from('nexus_chats')
        .select('*')
        .or(queryFilter)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setThreadMessages(data);
      } else {
        // Resilient fallback query
        const { data: fallbackData } = await supabase
          .from('nexus_chats')
          .select('*')
          .or(`sender_id.eq.${myUid},receiver_id.eq.${myUid},recipient_id.eq.${myUid},sender_id.eq.${contactId},receiver_id.eq.${contactId},recipient_id.eq.${contactId}`)
          .order('created_at', { ascending: true });

        if (fallbackData) {
          const filtered = fallbackData.filter((m: any) =>
            (String(m.sender_id) === String(myUid) && (String(m.receiver_id) === String(contactId) || String(m.recipient_id) === String(contactId))) ||
            (String(m.sender_id) === String(contactId) && (String(m.receiver_id) === String(myUid) || String(m.recipient_id) === String(myUid)))
          );
          setThreadMessages(filtered);
        }
      }

      // Mark unread messages in thread as read in Supabase & RPC
      // (Triggered cleanly on thread selection / active thread change)
      
      // Mark local thread as read
      setConversations(prev => prev.map(c => c.contactId === contactId ? { ...c, isRead: true } : c));

      // Sync local storage & dispatch custom event to update global badge immediately
      try {
        const sessionRes = await supabase.auth.getSession();
        const userEmail = sessionRes?.data?.session?.user?.email || userProfile?.email;
        if (userEmail) {
          const emailKey = userEmail.toLowerCase().trim();
          const saved = localStorage.getItem(`nexus_chats_${emailKey}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const updated = parsed.map((c: any) => 
                (c.id === contactId || String(c.id).toLowerCase() === String(contactId).toLowerCase() || c.name?.toLowerCase() === String(contactId).toLowerCase())
                  ? { ...c, unread: 0 }
                  : c
              );
              localStorage.setItem(`nexus_chats_${emailKey}`, JSON.stringify(updated));
            }
          }
        }
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
    } catch (e) {
      console.error('[InboxTerminal] Exception querying thread messages:', e);
    } finally {
      setThreadLoading(false);
    }
  };

  // Fetch real profiles from the profiles table for the Stories / Thoughts carousel
  const fetchRealProfilesForStories = useCallback(async () => {
    setStoriesLoading(true);
    try {
      const { data: dbProfiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, console_handle, avatar_url, bio, top_song_title, update_ticker, account_type, genre_tags, created_at')
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) {
        console.warn('[InboxTerminal] Querying profiles for inbox stories notice:', error.message);
      }

      const combinedList: any[] = [];
      const seenIds = new Set<string>();
      const seenEmails = new Set<string>();
      const seenHandles = new Set<string>();
      const seenNames = new Set<string>();

      const addCombinedProfile = (p: any) => {
        if (!p || !isLegitimateRecipientProfile(p)) return;

        const rawIdStr = String(p.id || '').trim();
        const normId = rawIdStr.replace(/^real-p-/, '').toLowerCase();
        const normEmail = String(p.email || '').toLowerCase().trim();
        const rawHandle = String(p.console_handle || p.handle || '').trim();
        const normHandle = rawHandle.replace(/^@/, '').toLowerCase().trim();
        const rawName = String(p.full_name || p.name || p.profileName || '').trim();
        const normName = rawName.toLowerCase();

        const isDuplicate =
          (normId && seenIds.has(normId)) ||
          (normEmail && seenEmails.has(normEmail)) ||
          (normHandle && seenHandles.has(normHandle)) ||
          (normName && normName !== 'user' && normName !== 'nexus user' && seenNames.has(normName));

        if (isDuplicate) {
          const existing = combinedList.find(item => {
            const itemNormId = String(item.id || '').replace(/^real-p-/, '').toLowerCase().trim();
            const itemNormEmail = String(item.email || '').toLowerCase().trim();
            const itemNormHandle = String(item.console_handle || item.handle || '').replace(/^@/, '').toLowerCase().trim();
            const itemNormName = String(item.full_name || item.name || '').toLowerCase().trim();
            return (
              (normId && itemNormId === normId) ||
              (normEmail && itemNormEmail === normEmail) ||
              (normHandle && itemNormHandle === normHandle) ||
              (normName && normName !== 'user' && itemNormName === normName)
            );
          });
          if (existing) {
            if (rawIdStr && !rawIdStr.startsWith('real-p-') && existing.id?.startsWith('real-p-')) {
              existing.id = rawIdStr;
            }
            if ((!existing.avatar_url || existing.avatar_url.includes('default')) && (p.avatar_url || p.avatar)) {
              existing.avatar_url = p.avatar_url || p.avatar;
            }
            if (!existing.bio && p.bio) existing.bio = p.bio;
            if ((!existing.update_ticker || existing.update_ticker === 'No updates posted yet') && p.update_ticker && p.update_ticker !== 'No updates posted yet') {
              existing.update_ticker = p.update_ticker;
            }
            if (!existing.console_handle && (p.console_handle || p.handle)) {
              existing.console_handle = p.console_handle || p.handle;
            }
          }
          return;
        }

        if (normId) seenIds.add(normId);
        if (normEmail) seenEmails.add(normEmail);
        if (normHandle) seenHandles.add(normHandle);
        if (normName && normName !== 'user' && normName !== 'nexus user') seenNames.add(normName);

        combinedList.push({
          ...p,
          id: rawIdStr.replace(/^real-p-/, ''),
        });
      };

      // 1. Insert database profiles
      (dbProfiles || []).forEach(p => addCombinedProfile(p));

      // 2. Insert any props allProfiles
      (allProfiles || []).forEach(p => {
        addCombinedProfile({
          id: p.id,
          email: p.email,
          full_name: p.full_name || p.name,
          console_handle: p.console_handle || p.handle,
          avatar_url: p.avatar_url || p.avatar,
          bio: p.bio,
          top_song_title: p.top_song_title || p.favoriteSong,
          update_ticker: p.update_ticker || p.rosterTicker,
          account_type: p.account_type || p.role || 'User',
          genre_tags: p.genre_tags || p.genres,
        });
      });

      // 3. Insert any props discoverProfiles
      (discoverProfiles || []).forEach(p => {
        addCombinedProfile({
          id: p.id,
          email: p.email,
          full_name: p.full_name || p.name,
          console_handle: p.console_handle || p.handle,
          avatar_url: p.avatar_url || p.avatar,
          bio: p.bio,
          top_song_title: p.top_song_title || p.favoriteSong,
          update_ticker: p.update_ticker || p.rosterTicker,
          account_type: p.account_type || p.role || 'User',
          genre_tags: p.genre_tags || p.genres,
        });
      });

      const activeUserIds = new Set(
        [
          currentUserId,
          initialUserProfile?.id,
          userProfile?.id,
          userProfile?.email?.toLowerCase(),
          userProfile?.console_handle?.toLowerCase(),
        ].filter(Boolean)
      );

      const mappedStories = combinedList
        .filter(p => {
          if (!p) return false;
          if (p.id && activeUserIds.has(p.id)) return false;
          if (p.email && activeUserIds.has(p.email.toLowerCase())) return false;
          if (p.console_handle && activeUserIds.has(p.console_handle.toLowerCase())) return false;
          if (!isLegitimateRecipientProfile(p)) return false;
          return true;
        })
        .map(p => {
          const rawName = p.full_name || p.name || p.console_handle || 'Nexus User';
          const cleanHandle = p.console_handle
            ? (p.console_handle.startsWith('@') ? p.console_handle : `@${p.console_handle}`)
            : '';
          
          const rawNote =
            p.update_ticker ||
            p.rosterTicker ||
            (p.bio ? (p.bio.length > 70 ? p.bio.substring(0, 67) + '…' : p.bio) : null) ||
            (p.top_song_title ? `Listening to: ${p.top_song_title}` : (p.genre_tags?.length ? `Into ${p.genre_tags[0]}` : 'Connecting on Nexus'));

          return {
            id: p.id,
            profileName: rawName,
            handle: cleanHandle,
            avatarUrl: p.avatar_url || p.avatar || '',
            note: rawNote,
            song: p.top_song_title || p.favoriteSong || '',
            accountType: (p.account_type || p.role || 'User').toUpperCase(),
            hasStory: Boolean(p.avatar_url || p.update_ticker || p.bio),
            rawProfile: p,
          };
        });

      setRealStories(mappedStories);
    } catch (err) {
      console.error('[InboxTerminal] Error fetching real profiles for stories:', err);
    } finally {
      setStoriesLoading(false);
    }
  }, [currentUserId, initialUserProfile?.id, userProfile?.id, allProfiles, discoverProfiles]);

  useEffect(() => {
    fetchInboxConversations();
    fetchRealProfilesForStories();

    const handleSync = () => {
      fetchInboxConversations();
      fetchRealProfilesForStories();
    };
    const handleReadSync = (e: any) => {
      const readChatId = e.detail?.chatId;
      if (readChatId) {
        setConversations(prev =>
          prev.map(c => (c.contactId === readChatId ? { ...c, isRead: true, unread: 0 } : c))
        );
      }
    };
    const handleAllReadSync = () => {
      setConversations(prev =>
        prev.map(c => ({ ...c, isRead: true, unread: 0 }))
      );
    };

    window.addEventListener('nexus_chats_updated', handleSync);
    window.addEventListener('nexus_chat_read', handleReadSync);
    window.addEventListener('nexus_all_read', handleAllReadSync);

    const channel = supabase
      .channel('inbox_terminal_db_sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'nexus_chats' },
        (payload) => {
          fetchInboxConversations();
          const incomingMessage = payload.new;
          if (selectedContact && incomingMessage) {
            const activePartnerId = selectedContact.contactId;
            // If the user is currently looking at this specific open thread:
            if (activePartnerId && activePartnerId === incomingMessage.sender_id) {
              // 1. Mark local message as read immediately
              incomingMessage.is_read = true;

              // 2. Persist to database so it stays read on refresh
              markChatAsRead(incomingMessage.sender_id, currentUserId || undefined);
            }
            if (
              (incomingMessage.sender_id === activePartnerId || incomingMessage.receiver_id === activePartnerId || incomingMessage.recipient_id === activePartnerId)
            ) {
              fetchThreadMessages(activePartnerId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('nexus_chats_updated', handleSync);
      window.removeEventListener('nexus_chat_read', handleReadSync);
      window.removeEventListener('nexus_all_read', handleAllReadSync);
      supabase.removeChannel(channel);
    };
  }, [selectedContact?.contactId]);

  const handleSelectThread = async (partnerUserId: string) => {
    if (!partnerUserId) return;

    // 1. Optimistic Local Update
    setThreadMessages((prev) =>
      prev.map((m) =>
        m.sender_id === partnerUserId ? { ...m, is_read: true } : m
      )
    );
    setConversations((prev) =>
      prev.map((c) =>
        c.contactId === partnerUserId ? { ...c, isRead: true, unread: 0 } : c
      )
    );

    // 2. Dispatch Custom Event for useChats & FloatingChatHead to sync
    window.dispatchEvent(
      new CustomEvent('nexus_chat_read', { detail: { chatId: partnerUserId } })
    );
    window.dispatchEvent(new CustomEvent('nexus_chats_updated'));

    // 3. Persist Read Status to Supabase Database via shared helper
    await markChatAsRead(partnerUserId, currentUserId || undefined);
  };

  // Automatically mark messages as read when active thread changes
  useEffect(() => {
    if (selectedContact?.contactId) {
      handleSelectThread(selectedContact.contactId);
    }
  }, [selectedContact?.contactId, currentUserId]);

  // Handle selecting a conversation
  const handleSelectContact = (chat: InboxConversation) => {
    setSelectedContact(chat);

    handleSelectThread(chat.contactId);
    fetchThreadMessages(chat.contactId);
  };

  // Listen for global custom events to open specific chat thread
  useEffect(() => {
    const handleOpenEvent = (e: any) => {
      const detail = e.detail;
      if (detail?.profile_id) {
        const contactId = detail.profile_id;
        const profileName = detail.name || detail.username || 'Operator';
        const avatarUrl = detail.avatar_url || detail.avatar;

        const matched = conversations.find(c => c.contactId === contactId);
        if (matched) {
          handleSelectContact(matched);
        } else {
          const newContact: InboxConversation = {
            contactId,
            profileName,
            avatarUrl,
            lastMessage: 'Established new session',
            timestamp: new Date().toISOString(),
            isRead: true,
            roleBadge: (detail.role || detail.role_badge || 'USER').toUpperCase()
          };
          setConversations(prev => [newContact, ...prev]);
          handleSelectContact(newContact);
        }
      }
    };

    window.addEventListener('nexus_open_chat', handleOpenEvent);
    window.addEventListener('nexus_open_chat_thread', handleOpenEvent);
    return () => {
      window.removeEventListener('nexus_open_chat', handleOpenEvent);
      window.removeEventListener('nexus_open_chat_thread', handleOpenEvent);
    };
  }, [conversations]);

  // Handle sending a message in active thread
  const handleSendMessage = async () => {
    if (!selectedContact || (!messageText.trim() && !attachmentUrl) || isSending) return;

    if (blockedContacts[selectedContact.contactId]) {
      setToastMessage('Cannot send message: Contact is currently blocked.');
      return;
    }

    const trimmed = messageText.trim();
    const myUid = currentUserId || (await resolveCurrentUser()).uid;
    if (!myUid) {
      console.warn('[InboxTerminal] Send aborted: Missing active user ID');
      return;
    }

    setIsSending(true);

    const nowIso = new Date().toISOString();
    const optimisticMsg = {
      id: `temp_${Date.now()}`,
      sender_id: myUid,
      receiver_id: selectedContact.contactId,
      recipient_id: selectedContact.contactId,
      message: trimmed || 'Media attachment',
      content: trimmed || 'Media attachment',
      created_at: nowIso,
      is_read: true,
      media_url: attachmentUrl || undefined,
      attachment_url: attachmentUrl || undefined,
    };

    setThreadMessages(prev => [...prev, optimisticMsg]);
    setMessageText('');
    const sentMediaUrl = attachmentUrl;
    setAttachmentUrl(null);
    setShowImageInput(false);

    // Update conversation list item
    setConversations(prev => prev.map(c => {
      if (c.contactId === selectedContact.contactId) {
        return {
          ...c,
          lastMessage: trimmed || 'Media attachment',
          timestamp: nowIso,
          isRead: true,
        };
      }
      return c;
    }));

    try {
      const payload: any = {
        sender_id: myUid,
        receiver_id: selectedContact.contactId,
        recipient_id: selectedContact.contactId,
        message: trimmed || 'Media attachment',
        content: trimmed || 'Media attachment',
        is_read: false,
      };

      if (sentMediaUrl) {
        payload.media_url = sentMediaUrl;
        payload.attachment_url = sentMediaUrl;
      }

      const { data, error } = await supabase
        .from('nexus_chats')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('[InboxTerminal] Error writing message to Supabase:', error.message);
      } else if (data) {
        setThreadMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data : m));
      }

      window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
    } catch (err) {
      console.error('[InboxTerminal] Exception inserting message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle local file attachment upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Actions for active thread settings
  const handleToggleMuteThread = () => {
    if (!selectedContact) return;
    const cid = selectedContact.contactId;
    const newStatus = !mutedThreads[cid];
    setMutedThreads(prev => ({ ...prev, [cid]: newStatus }));
    setToastMessage(newStatus ? `Muted notifications for ${selectedContact.profileName}` : `Unmuted notifications for ${selectedContact.profileName}`);
  };

  const handleTogglePinThread = () => {
    if (!selectedContact) return;
    const cid = selectedContact.contactId;
    const newStatus = !pinnedThreads[cid];
    setPinnedThreads(prev => ({ ...prev, [cid]: newStatus }));
    setToastMessage(newStatus ? `Pinned ${selectedContact.profileName} thread to top` : `Unpinned ${selectedContact.profileName} thread`);
  };

  const handleToggleBlockContact = () => {
    if (!selectedContact) return;
    const cid = selectedContact.contactId;
    const newStatus = !blockedContacts[cid];
    setBlockedContacts(prev => ({ ...prev, [cid]: newStatus }));
    setToastMessage(newStatus ? `Blocked ${selectedContact.profileName}. Signaling restricted.` : `Unblocked ${selectedContact.profileName}.`);
  };

  const handleToggleRestrictContact = () => {
    if (!selectedContact) return;
    const cid = selectedContact.contactId;
    const newStatus = !restrictedContacts[cid];
    setRestrictedContacts(prev => ({ ...prev, [cid]: newStatus }));
    setToastMessage(newStatus ? `Restricted ${selectedContact.profileName}. Messages require gatekeeper review.` : `Removed restrictions for ${selectedContact.profileName}.`);
  };

  const handleClearHistory = () => {
    if (!selectedContact) return;
    if (window.confirm(`Are you sure you want to clear message history for ${selectedContact.profileName}?`)) {
      setThreadMessages([]);
      setToastMessage(`Cleared local message history with ${selectedContact.profileName}.`);
    }
  };

  const handleViewProfile = () => {
    if (!selectedContact) return;
    window.dispatchEvent(new CustomEvent('nexus_open_profile', {
      detail: { profile_id: selectedContact.contactId }
    }));
    setShowThreadSettings(false);
  };

  const handleMarkAllRead = async () => {
    try {
      setConversations((prev) =>
        prev.map((c) => ({ ...c, isRead: true, unread: 0 }))
      );

      window.dispatchEvent(new CustomEvent('nexus_all_read'));
      window.dispatchEvent(new CustomEvent('nexus_chats_updated'));

      await handleMarkAllAsRead(currentUserId, setConversations as any);
      setToastMessage('All conversations & notifications marked as read.');
    } catch (err) {
      console.error('[InboxTerminal] Error marking all as read:', err);
    }
  };

  // Filter & sort conversations (pinned threads go first)
  const filteredConversations = conversations
    .filter(chat =>
      (threadNicknames[chat.contactId] || chat.profileName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aPinned = pinnedThreads[a.contactId] ? 1 : 0;
      const bPinned = pinnedThreads[b.contactId] ? 1 : 0;
      return bPinned - aPinned;
    });

  return (
    <div className="w-full h-full min-h-0 bg-zinc-950 text-white flex flex-col rounded-xl border border-rose-900/40 overflow-hidden shadow-2xl relative font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-[200] bg-rose-950/90 border border-rose-600/50 text-white text-xs px-3 py-2 rounded-lg shadow-xl font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: CONTACTS LIST (Takes full width when no contact selected across ALL viewports) */}
      <div className={`w-full flex-1 min-h-0 border-r border-zinc-800 bg-black/60 flex-col shrink-0 ${selectedContact ? 'hidden' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-rose-900/40 bg-black/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-7 h-7 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all shadow-md mr-1 group cursor-pointer"
                  title="Return"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]" />
              <h2 className="text-[23px] leading-[28px] text-[#00aaff] font-black uppercase tracking-wider font-display">Messages</h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsNewMessageModalOpen(true)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all shadow flex items-center justify-center cursor-pointer"
                title="New Message"
              >
                <SquarePen className="w-4 h-4" />
              </button>

              <button
                onClick={() => fetchInboxConversations()}
                disabled={refreshing}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all shadow flex items-center justify-center cursor-pointer"
                title="Sync Conversations"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all shadow flex items-center justify-center cursor-pointer"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-rose-900/40 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/60 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Notes / Stories Horizontal Scroll */}
        <div className="w-full flex items-center gap-3.5 overflow-x-auto no-scrollbar pt-7 pb-2.5 px-4 border-b border-rose-900/40 bg-black/50 shrink-0">
          {/* User Note Create */}
          <div 
            className="flex flex-col items-center gap-1 shrink-0 relative cursor-pointer group" 
            onClick={() => {
              if (myNote) {
                setExpandedThought({
                  id: currentUserId || undefined,
                  name: userProfile?.name || userProfile?.full_name || userProfile?.console_handle || 'You',
                  handle: userProfile?.console_handle ? `@${userProfile.console_handle}` : undefined,
                  avatar: userProfile?.avatar || userProfile?.avatar_url || '',
                  note: myNote,
                  roleBadge: userProfile?.account_type || userProfile?.role || 'USER',
                  isMine: true
                });
              } else {
                setIsAddingNote(true);
              }
            }}
          >
            {myNote && (
              <div 
                className="absolute -top-5 left-1/2 -translate-x-1/2 bg-zinc-900 text-rose-300 text-[8px] font-bold px-2 py-0.5 rounded-full max-w-[68px] truncate z-10 shadow-md border border-rose-900/60 group-hover:scale-105 transition-transform text-center font-sans"
                title={myNote}
              >
                {myNote.length > 9 ? myNote.substring(0, 8) + '…' : myNote}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-zinc-900" />
              </div>
            )}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden">
                {userProfile?.avatar || userProfile?.avatar_url ? (
                  <img src={userProfile?.avatar || userProfile?.avatar_url} alt="You" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xs font-bold text-zinc-400 font-mono">{userProfile?.name?.substring(0, 2).toUpperCase() || 'YOU'}</span>
                )}
              </div>
              {!myNote && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-rose-600 border-2 border-black rounded-full flex items-center justify-center text-white group-hover:bg-rose-500 transition-colors shadow">
                  <Plus className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <span className="text-[9px] text-zinc-400 mt-0.5 font-mono">{myNote ? 'Your thought' : 'Add thought'}</span>
          </div>

          {/* Real Profiles Notes / Stories Carousel */}
          {realStories.map((story, sIdx) => (
            <div 
              key={`story-${sIdx}-${story.id || ''}-${story.band_id || ''}-${story.raw_id || ''}-${story.handle || ''}-${story.profileName || ''}`} 
              onClick={() => {
                setExpandedThought({
                  id: story.id,
                  name: story.profileName,
                  handle: story.handle,
                  avatar: story.avatarUrl,
                  note: story.note,
                  song: story.song,
                  roleBadge: story.accountType,
                  rawProfile: story.rawProfile,
                  isMine: false
                });
              }}
              className="flex flex-col items-center gap-1 shrink-0 relative cursor-pointer group hover:-translate-y-0.5 transition-transform"
            >
              {story.note && (
                <div 
                  className="absolute -top-5 left-1/2 -translate-x-1/2 bg-zinc-900/95 text-zinc-200 text-[8px] font-bold px-2 py-0.5 rounded-full max-w-[68px] truncate z-10 shadow-md border border-purple-500/40 group-hover:scale-105 group-hover:border-purple-400 transition-all text-center font-sans"
                  title={story.note}
                >
                  {story.note.length > 9 ? story.note.substring(0, 8) + '…' : story.note}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-zinc-900" />
                </div>
              )}
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-purple-600/90 p-[2px] shadow-sm group-hover:border-purple-400 transition-colors">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                  {story.avatarUrl ? (
                    <img src={story.avatarUrl} alt={story.profileName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xs font-bold text-rose-400 font-mono">
                      {story.profileName.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-zinc-300 mt-0.5 truncate max-w-[55px] font-mono">{story.profileName}</span>
            </div>
          ))}
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1.5 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
              <span className="text-xs font-mono tracking-widest uppercase">Syncing DB Signals...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 gap-2 p-4">
              <MessageSquare className="w-8 h-8 text-rose-500/40" />
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">No Signal Threads</span>
              <p className="text-[11px] text-zinc-600 max-w-xs">
                Direct messages initiated via profiles or floating chat windows will appear here.
              </p>
            </div>
          ) : (
            filteredConversations.map((chat, cIdx) => {
              const displayName = threadNicknames[chat.contactId] || chat.profileName;
              const isMuted = mutedThreads[chat.contactId];
              const isPinned = pinnedThreads[chat.contactId];
              const isBlocked = blockedContacts[chat.contactId];
              const isUnread = !chat.isRead || Boolean((chat as any).unread && (chat as any).unread > 0);

              return (
                <InboxConversationRow
                  key={chat.contactId ? `chat-${chat.contactId}-${cIdx}` : `chat-${cIdx}`}
                  chat={chat}
                  displayName={displayName}
                  isMuted={isMuted}
                  isPinned={isPinned}
                  isBlocked={isBlocked}
                  isUnread={isUnread}
                  onSelect={() => handleSelectContact(chat)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* VIEW 2: ACTIVE THREAD FULL SCREEN (Takes full width when contact is selected across ALL viewports) */}
      <div className={`w-full flex-1 min-h-0 bg-zinc-950/80 flex-col ${selectedContact ? 'flex' : 'hidden'}`}>
        
        {selectedContact && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {/* PINNED CONVERSATION HEADER */}
            <div className="p-3.5 border-b border-rose-900/30 bg-black/90 flex items-center justify-between shrink-0 z-10 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back Button to return to contact list on ALL viewports */}
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800/60 text-zinc-300 hover:text-rose-400 transition-all flex items-center gap-1 cursor-pointer font-mono text-xs font-bold shrink-0"
                  title="Back to Conversations"
                >
                  <ChevronLeft className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">INBOX</span>
                </button>

                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-rose-400 overflow-hidden shadow">
                    {selectedContact.avatarUrl ? (
                      <img src={selectedContact.avatarUrl} alt={selectedContact.profileName} className="w-full h-full object-cover" />
                    ) : (
                      selectedContact.profileName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full border-2 border-zinc-950 absolute -bottom-0.5 -right-0.5 shadow-sm transition-colors ${
                      blockedContacts[selectedContact.contactId] ? 'bg-rose-500' : selectedPresence.formatted.dotClass
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider truncate">
                      {threadNicknames[selectedContact.contactId] || selectedContact.profileName}
                    </h3>
                    {selectedContact.roleBadge && (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-rose-400 shrink-0">
                        {selectedContact.roleBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedPresence.formatted.dotClass}`} />
                    <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                      selectedPresence.formatted.isOnline
                        ? 'text-emerald-400'
                        : selectedPresence.formatted.isRecentlyActive
                        ? 'text-amber-400'
                        : 'text-zinc-500'
                    }`}>
                      {selectedPresence.formatted.text}
                    </span>
                    {!selectedPresence.formatted.isOnline && (
                      <span className="text-[9px] font-mono text-zinc-600">• ENCRYPTED</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Thread Action Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => fetchThreadMessages(selectedContact.contactId)}
                  disabled={threadLoading}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Refresh Thread"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${threadLoading ? 'animate-spin text-rose-400' : ''}`} />
                </button>

                {/* THREAD SETTINGS BUTTON (Facebook-style connection details & options) */}
                <button
                  onClick={() => setShowThreadSettings(true)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800/60 text-zinc-300 hover:text-rose-400 transition-all flex items-center gap-1.5 cursor-pointer font-mono text-xs font-bold"
                  title="Thread Settings & Connection Details"
                >
                  <Info className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">DETAILS</span>
                </button>
              </div>
            </div>

            {/* SCROLLABLE THREAD MESSAGES CONTAINER */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 no-scrollbar bg-gradient-to-b from-black/40 via-zinc-950 to-black/60">
              {threadLoading && threadMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
                  <span className="text-xs font-mono uppercase">Retrieving Thread History...</span>
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 gap-2">
                  <Terminal className="w-10 h-10 text-rose-500/30" />
                  <span className="text-xs font-mono uppercase font-bold text-zinc-400">Direct Signal Channel Initialized</span>
                  <p className="text-[11px] text-zinc-600 max-w-xs">
                    Send a direct message below to start communicating on this node.
                  </p>
                </div>
              ) : (
                threadMessages.map((msg, idx) => {
                  const isSentByMe = String(msg.sender_id).toLowerCase() === String(currentUserId).toLowerCase();
                  const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const mediaUrl = msg.media_url || msg.attachment_url || msg.image;

                  return (
                    <div
                      key={msg.id ? `msg-${msg.id}-${idx}` : `msg-${idx}`}
                      className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`p-3 text-xs leading-relaxed max-w-[80%] shadow-md font-sans ${
                          isSentByMe
                            ? 'bg-rose-950/70 border border-rose-800/60 text-white rounded-2xl rounded-tr-xs ml-auto'
                            : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-2xl rounded-tl-xs mr-auto'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message || msg.content}</p>
                        
                        {mediaUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-zinc-800/80 bg-black">
                            <img src={mediaUrl} alt="Attachment" className="max-h-60 w-auto object-contain" />
                          </div>
                        )}

                        <div className={`flex items-center gap-1 mt-1 text-[9px] font-mono ${isSentByMe ? 'text-rose-300/70 justify-end' : 'text-zinc-500 justify-start'}`}>
                          <span>{timeStr}</span>
                          {isSentByMe && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Check className="w-3 h-3 text-rose-400/60" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment Preview Bar */}
            {attachmentUrl && (
              <div className="px-4 py-2 bg-zinc-900/90 border-t border-rose-900/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-mono text-zinc-300">Attachment Ready</span>
                  <img src={attachmentUrl} alt="Preview" className="w-8 h-8 rounded object-cover border border-zinc-700" />
                </div>
                <button
                  onClick={() => setAttachmentUrl(null)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Custom Image URL Bar */}
            {showImageInput && (
              <div className="px-4 py-2 bg-zinc-900/90 border-t border-rose-900/30 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={() => {
                    if (customImageUrl.trim()) {
                      setAttachmentUrl(customImageUrl.trim());
                      setCustomImageUrl('');
                      setShowImageInput(false);
                    }
                  }}
                  className="px-3 py-1 bg-rose-600 text-white font-mono text-xs rounded-lg font-bold hover:bg-rose-500"
                >
                  Attach
                </button>
                <button
                  onClick={() => setShowImageInput(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PINNED DIRECT MESSAGE INPUT BAR */}
            <div className="p-3 border-t border-rose-900/40 bg-black/90 flex items-center gap-2 shrink-0 z-10 shadow-lg">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800/60 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                title="Attach Image File"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800/60 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                title="Attach Image URL"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder={blockedContacts[selectedContact.contactId] ? 'Contact blocked...' : `Message ${threadNicknames[selectedContact.contactId] || selectedContact.profileName}...`}
                value={messageText}
                disabled={blockedContacts[selectedContact.contactId]}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-zinc-900/90 border border-rose-900/40 rounded-xl py-2.5 px-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500 transition-colors font-sans disabled:opacity-50"
              />

              <button
                onClick={handleSendMessage}
                disabled={(!messageText.trim() && !attachmentUrl) || isSending || blockedContacts[selectedContact.contactId]}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center font-bold text-xs cursor-pointer shrink-0 ${
                  (messageText.trim() || attachmentUrl) && !isSending && !blockedContacts[selectedContact.contactId]
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PER-THREAD SETTINGS & CONNECTION DETAILS MODAL */}
      {showThreadSettings && selectedContact && (
        <div 
          className="fixed inset-0 z-[170] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowThreadSettings(false)}
        >
          <div 
            className="w-full max-w-md bg-[#09060f] border border-rose-900/60 rounded-2xl p-5 shadow-2xl flex flex-col overflow-hidden text-white font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-900/40 mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-black uppercase tracking-wider font-mono text-white">
                  Thread Options & Connection Details
                </h3>
              </div>
              <button
                onClick={() => setShowThreadSettings(false)}
                className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contact Details Card */}
            <div className="bg-black/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-rose-800 flex items-center justify-center text-lg font-black text-rose-400 overflow-hidden mb-2 shadow-lg">
                {selectedContact.avatarUrl ? (
                  <img src={selectedContact.avatarUrl} alt={selectedContact.profileName} className="w-full h-full object-cover" />
                ) : (
                  selectedContact.profileName.substring(0, 2).toUpperCase()
                )}
              </div>
              
              <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">
                {threadNicknames[selectedContact.contactId] || selectedContact.profileName}
              </h4>

              <div className="flex items-center gap-2 mt-1">
                {selectedContact.roleBadge && (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-400">
                    {selectedContact.roleBadge}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${selectedPresence.formatted.dotClass}`} />
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    selectedPresence.formatted.isOnline
                      ? 'text-emerald-400'
                      : selectedPresence.formatted.isRecentlyActive
                      ? 'text-amber-400'
                      : 'text-zinc-500'
                  }`}>
                    {selectedPresence.formatted.text}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-[10px] font-mono text-zinc-500 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
                Node ID: {selectedContact.contactId.substring(0, 18)}...
              </div>

              <button
                onClick={handleViewProfile}
                className="mt-3 w-full py-2 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Full Account Profile</span>
              </button>
            </div>

            {/* Custom Nickname Input */}
            <div className="space-y-1.5 mb-4">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Thread Nickname / Alias
              </label>
              <input
                type="text"
                placeholder="Set nickname..."
                value={threadNicknames[selectedContact.contactId] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setThreadNicknames(prev => ({ ...prev, [selectedContact.contactId]: val }));
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            {/* Preferences & Actions */}
            <div className="space-y-2 mb-4">
              <button
                onClick={handleToggleMuteThread}
                className="w-full p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono text-zinc-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-zinc-400" />
                  <span>Mute Notifications</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${mutedThreads[selectedContact.contactId] ? 'bg-rose-950 text-rose-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {mutedThreads[selectedContact.contactId] ? 'MUTED' : 'OFF'}
                </span>
              </button>

              <button
                onClick={handleTogglePinThread}
                className="w-full p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono text-zinc-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-zinc-400" />
                  <span>Pin Conversation To Top</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pinnedThreads[selectedContact.contactId] ? 'bg-rose-950 text-rose-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {pinnedThreads[selectedContact.contactId] ? 'PINNED' : 'OFF'}
                </span>
              </button>

              <button
                onClick={handleToggleRestrictContact}
                className="w-full p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono text-zinc-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Restrict Account</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${restrictedContacts[selectedContact.contactId] ? 'bg-amber-950 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {restrictedContacts[selectedContact.contactId] ? 'RESTRICTED' : 'OFF'}
                </span>
              </button>

              <button
                onClick={handleToggleBlockContact}
                className="w-full p-2.5 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 rounded-xl flex items-center justify-between text-xs font-mono text-rose-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span>Block Account</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${blockedContacts[selectedContact.contactId] ? 'bg-rose-600 text-white' : 'bg-rose-950 text-rose-400'}`}>
                  {blockedContacts[selectedContact.contactId] ? 'BLOCKED' : 'BLOCK'}
                </span>
              </button>

              <button
                onClick={handleClearHistory}
                className="w-full p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-zinc-500" />
                  <span>Clear Thread Messages</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold">PURGE</span>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-center">
              <span className="text-[9px] font-mono text-zinc-600">
                End-to-end signal route verified • Nexus Protocol v2.4
              </span>
            </div>
          </div>
        </div>
      )}

      {/* RESTORED GLOBAL INBOX SETTINGS MODAL */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="w-full max-w-2xl max-h-[85vh] bg-[#08050c] border border-rose-900/50 rounded-2xl p-6 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-rose-900/40 mb-4">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white font-mono">
                    Inbox Preferences & Gatekeeper
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Configure signaling presence, gatekeeper security filters, and media options.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 no-scrollbar space-y-4">
              <InboxPreferences
                userProfile={userProfile}
                chats={conversations.map(c => ({
                  id: c.contactId,
                  name: c.profileName,
                  avatar: c.avatarUrl || '',
                  role: c.roleBadge || 'USER',
                  roleBadge: c.roleBadge || 'USER',
                  roleColor: 'purple',
                  online: true,
                  unread: c.isRead ? 0 : 1,
                  messages: [],
                }))}
                setChats={() => {}}
                globalReadReceipts={globalReadReceipts}
                setGlobalReadReceipts={setGlobalReadReceipts}
                globalActiveStatus={globalActiveStatus}
                setGlobalActiveStatus={setGlobalActiveStatus}
                whoCanReachMe={whoCanReachMe}
                setWhoCanReachMe={setWhoCanReachMe}
                triggerNotification={(msg) => setToastMessage(msg)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Note Creation Modal */}
      {isAddingNote && (
        <div className="absolute inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setIsAddingNote(false)}
            className="absolute top-4 left-4 p-2 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center w-full max-w-sm gap-6">
            <h2 className="text-xl font-bold text-white font-sans">New note</h2>
            
            <div className="relative mt-12 w-full flex justify-center">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-52 text-center z-20">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Share a thought..." 
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value.slice(0, 60))}
                  className="bg-zinc-800 text-white text-sm px-4 py-3 rounded-2xl w-full text-center outline-none border border-zinc-700 focus:border-zinc-500 placeholder:text-zinc-500 shadow-xl font-sans"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-zinc-800" />
              </div>
              
              <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-900 overflow-hidden shadow-2xl relative z-10 mx-auto mt-6">
                {userProfile?.avatar || userProfile?.avatar_url ? (
                  <img src={userProfile.avatar || userProfile.avatar_url} alt="You" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-400 font-mono">
                    {userProfile?.name?.substring(0, 2).toUpperCase() || userProfile?.full_name?.substring(0, 2).toUpperCase() || 'YOU'}
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-xs text-zinc-400 text-center mt-4">
              Everyone on Nexus can see your shared thought ticker.
            </p>
            
            <button 
              onClick={async () => {
                const trimmed = newNoteText.trim();
                if (trimmed) {
                  setMyNote(trimmed);
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('nexus_user_thought_note', trimmed);
                  }
                  if (currentUserId && isValidUUID(currentUserId)) {
                    try {
                      await supabase.from('profiles').update({ update_ticker: trimmed }).eq('id', currentUserId);
                    } catch (e) {
                      console.warn('[InboxTerminal] Error saving thought:', e);
                    }
                  }
                }
                setIsAddingNote(false);
                setNewNoteText('');
              }}
              disabled={!newNoteText.trim()}
              className="mt-6 px-8 py-3 bg-white text-black font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-[200px] cursor-pointer hover:bg-zinc-200 transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      )}

      {/* Expanded Thought Popover / Modal */}
      {expandedThought && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-rose-900/60 rounded-2xl p-5 max-w-xs w-full shadow-2xl relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setExpandedThought(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-purple-500 p-0.5 shadow-lg overflow-hidden mb-3">
              {expandedThought.avatar ? (
                <img src={expandedThought.avatar} alt={expandedThought.name} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center font-black text-rose-400 text-lg font-mono">
                  {expandedThought.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-0.5">{expandedThought.name}</h3>
            {expandedThought.handle && (
              <span className="text-[11px] font-mono text-zinc-400 mb-1">{expandedThought.handle}</span>
            )}
            <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/50 mb-3">
              {expandedThought.isMine ? 'Your Thought' : `${expandedThought.roleBadge || 'USER'} Thought`}
            </span>

            {/* Full Thought Bubble */}
            <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 my-1 text-xs text-zinc-100 font-sans leading-relaxed relative text-left">
              <span className="text-rose-500 font-serif text-base leading-none mr-1">“</span>
              {expandedThought.note}
              <span className="text-rose-500 font-serif text-base leading-none ml-1">”</span>
            </div>

            {expandedThought.song && (
              <div className="w-full flex items-center justify-center gap-2 bg-rose-950/30 border border-rose-900/40 p-2 rounded-lg text-[11px] text-rose-300 font-mono my-2">
                <Music className="w-3 h-3 text-rose-400 animate-pulse shrink-0" />
                <span className="truncate">{expandedThought.song}</span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2 mt-3">
              {expandedThought.isMine ? (
                <div className="w-full flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setMyNote(null);
                      if (typeof localStorage !== 'undefined') {
                        localStorage.removeItem('nexus_user_thought_note');
                      }
                      if (currentUserId && isValidUUID(currentUserId)) {
                        try {
                          await supabase.from('profiles').update({ update_ticker: null }).eq('id', currentUserId);
                        } catch (e) {}
                      }
                      setExpandedThought(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-900/60 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Clear Note
                  </button>
                  <button
                    onClick={() => {
                      setExpandedThought(null);
                      setIsAddingNote(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      const matched = conversations.find(c => c.contactId === expandedThought.id || c.profileName.toLowerCase() === expandedThought.name.toLowerCase());
                      if (matched) {
                        handleSelectContact(matched);
                      } else {
                        const newC: InboxConversation = {
                          contactId: expandedThought.id || expandedThought.name,
                          profileName: expandedThought.name,
                          avatarUrl: expandedThought.avatar,
                          lastMessage: `Replying to thought: "${expandedThought.note}"`,
                          timestamp: new Date().toISOString(),
                          isRead: true,
                          roleBadge: expandedThought.roleBadge || 'USER'
                        };
                        setConversations(prev => [newC, ...prev]);
                        handleSelectContact(newC);
                      }
                      setExpandedThought(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Direct Message</span>
                  </button>
                  {expandedThought.rawProfile && (
                    <button
                      onClick={() => {
                        if (onSelectProfile) {
                          onSelectProfile(expandedThought.rawProfile);
                        } else {
                          window.dispatchEvent(new CustomEvent('nexus_open_profile', {
                            detail: { profile_id: expandedThought.id, profile: expandedThought.rawProfile }
                          }));
                        }
                        setExpandedThought(null);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Account Profile</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW MESSAGE / COMPOSE MODAL */}
      {isNewMessageModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1015] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-950/60 border border-rose-900/60 flex items-center justify-center text-rose-400">
                  <SquarePen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">New Message</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Select a person or profile to write to</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsNewMessageModalOpen(false);
                  setRecipientSearchQuery('');
                }}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient Search Input */}
            <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/40">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={recipientSearchQuery}
                  onChange={(e) => setRecipientSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && recipientSearchQuery.trim()) {
                      if (availableRecipientProfiles.length > 0) {
                        handleStartNewMessageWithContact(availableRecipientProfiles[0]);
                      } else {
                        handleStartCustomMessage();
                      }
                    }
                  }}
                  placeholder="Type name, @handle, or profile..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500/70 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-all font-sans"
                />
                {recipientSearchQuery && (
                  <button
                    onClick={() => setRecipientSearchQuery('')}
                    className="absolute right-3 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Suggested / Matching Contacts List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-900/60 no-scrollbar min-h-[220px]">
              <div className="px-2 py-1.5 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                <span>{recipientSearchQuery.trim() ? 'Matching In-App Profiles' : 'Suggested In-App Contacts'}</span>
                <span>{availableRecipientProfiles.length} available</span>
              </div>

              {availableRecipientProfiles.length === 0 ? (
                <div className="p-6 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">No contact matching "{recipientSearchQuery}"</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">You can still start a new direct thread</p>
                  </div>
                  <button
                    onClick={handleStartCustomMessage}
                    className="mt-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Message "{recipientSearchQuery}"</span>
                  </button>
                </div>
              ) : (
                availableRecipientProfiles.map((contact, cIdx) => (
                  <div
                    key={contact.id ? `recip-${contact.id}-${cIdx}` : `recip-${cIdx}`}
                    onClick={() => handleStartNewMessageWithContact(contact)}
                    className="p-2.5 rounded-xl hover:bg-zinc-900/90 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-rose-500/80 transition-colors">
                        {contact.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs font-mono font-bold text-rose-400">
                            {contact.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                            {contact.name}
                          </span>
                          {contact.role && (
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider border border-zinc-700/60">
                              {contact.role}
                            </span>
                          )}
                        </div>
                        {contact.handle && (
                          <p className="text-[11px] font-mono text-zinc-400 truncate">
                            {contact.handle}
                          </p>
                        )}
                        {contact.subtext && (
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-sans">
                            {contact.subtext}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartNewMessageWithContact(contact);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 group-hover:bg-rose-600 text-zinc-300 group-hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-sm"
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InboxTerminal;

