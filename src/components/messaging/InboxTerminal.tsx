import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { markChatAsRead, handleMarkAllAsRead } from '../../lib/chat';
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
  Sparkles,
  Info,
  Pin,
  VolumeX,
  Plus,
  Music,
  SquarePen,
  Users,
  ExternalLink,
  UserPlus,
  Mic,
  Reply,
  ChevronUp,
  ChevronDown,
  Link2,
  Palette,
} from 'lucide-react';
import { InboxPreferences } from './InboxPreferences';
import { InboxComposerModal, ComposerContact } from './InboxComposerModal';
import { InboxThreadDetailsModal } from './InboxThreadDetailsModal';
import { InlineAudioWaveformCard } from './InlineAudioWaveformCard';
import { TourOfferCard } from './TourOfferCard';
import { RichSignalComposerSheet, SignalComposerMode } from './RichSignalComposerSheet';
import {
  THREAD_THEMES,
  ThreadTheme,
  getThreadTheme,
  readStoredThreadThemes,
  writeStoredThreadThemes,
} from './threadThemes';
import { useUserPresence } from '../../lib/presence';
import { useThreadPresence, computeThreadPresenceKey } from '../../hooks/useThreadPresence';
import { pushManager } from '../../lib/pushNotifications';
import { setActiveDmThreadId, consumePendingDmThread } from '../../lib/pushClient';
import { authFetch, getSupabaseAccessToken } from '../../utils/apiConfig';
import {
  InboxConversation,
  GroupMember,
  GroupSystemAction,
  HydratedThreadMessage,
  ReplyReference,
  AudioCardPayload,
  OfferCardPayload,
  isValidUuid,
  createClientMsgId,
  createGroupId,
  encodeGroupMessagePayload,
  encodeMediaMessagePayload,
  encodeRichMessagePayload,
  parseChatMessagePayload,
  formatDefaultGroupName,
  buildThreadTimeline,
  aggregateInboxConversations,
  computeOfferStatuses,
  extractSharedLinks,
  prioritizeAndRandomizeSceneNotes,
  readCachedConversations,
  writeCachedConversations,
} from '../../utils/groupMessagingUtils';

export type { InboxConversation };

function formatConversationTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const GroupStackedAvatar: React.FC<{ members?: GroupMember[]; fallbackName: string }> = ({
  members = [],
  fallbackName,
}) => {
  const firstTwo = members.slice(0, 2);
  if (firstTwo.length < 2) {
    const single = firstTwo[0];
    return (
      <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0">
        {single?.avatarUrl ? (
          <img
            src={single.avatarUrl}
            alt={fallbackName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Users className="w-5 h-5 text-zinc-300" />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 shrink-0">
      <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#0c0e13] overflow-hidden flex items-center justify-center text-[10px] font-semibold text-zinc-200 absolute top-0 left-0 z-10 shadow">
        {firstTwo[0].avatarUrl ? (
          <img
            src={firstTwo[0].avatarUrl}
            alt={firstTwo[0].name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          (firstTwo[0].name || 'A').slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-[#0c0e13] overflow-hidden flex items-center justify-center text-[10px] font-semibold text-zinc-100 absolute bottom-0 right-0 shadow">
        {firstTwo[1].avatarUrl ? (
          <img
            src={firstTwo[1].avatarUrl}
            alt={firstTwo[1].name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          (firstTwo[1].name || 'B').slice(0, 2).toUpperCase()
        )}
      </div>
    </div>
  );
};

const InboxConversationRow: React.FC<{
  chat: InboxConversation;
  displayName: string;
  theme?: ThreadTheme;
  isSelected?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  isBlocked?: boolean;
  unreadCount: number;
  onSelect: () => void;
}> = ({
  chat,
  displayName,
  theme,
  isSelected,
  isMuted,
  isPinned,
  isBlocked,
  unreadCount,
  onSelect,
}) => {
  const { formatted, isOnline } = useUserPresence(chat.isGroup ? null : chat);
  const resolvedTheme = theme || getThreadTheme();
  const isUnread = unreadCount > 0 || !chat.isRead;
  const timeFormatted = formatConversationTimestamp(chat.timestamp);
  const initials = (displayName || 'NC')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative overflow-hidden w-full text-left px-3 py-2.5 min-h-[68px] rounded-xl flex items-center gap-3 transition-all cursor-pointer group ${
        isSelected
          ? 'bg-white/[0.08] border border-white/[0.12]'
          : isUnread
          ? `bg-white/[0.025] hover:bg-white/[0.05] border ${resolvedTheme.unreadRowBorderClass}`
          : 'hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      {/* Faint, clean left-edge splash of color by the profile avatar when unread */}
      {isUnread && (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-28 pointer-events-none transition-opacity duration-300"
            style={resolvedTheme.unreadEdgeSplashStyle}
          />
          <span
            aria-hidden="true"
            className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full pointer-events-none"
            style={resolvedTheme.unreadEdgeBarStyle}
          />
        </>
      )}

      {/* Avatar */}
      {chat.isGroup ? (
        <div
          className="relative z-10 rounded-full shrink-0"
          style={isUnread ? resolvedTheme.unreadAvatarGlowStyle : undefined}
        >
          <GroupStackedAvatar members={chat.members} fallbackName={displayName} />
        </div>
      ) : (
        <div className="relative z-10 shrink-0">
          <div
            className="w-12 h-12 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center font-semibold text-xs text-zinc-200 overflow-hidden transition-shadow"
            style={isUnread ? resolvedTheme.unreadAvatarGlowStyle : undefined}
          >
            {chat.avatarUrl ? (
              <img
                src={chat.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.fallback-initials')) {
                    const span = document.createElement('span');
                    span.className = 'text-xs font-semibold text-zinc-300 fallback-initials';
                    span.textContent = initials;
                    parent.appendChild(span);
                  }
                }}
              />
            ) : (
              initials
            )}
          </div>
          <span
            className={`w-3 h-3 rounded-full border-2 border-[#0c0e13] absolute bottom-0 right-0 transition-colors ${
              isBlocked ? 'bg-rose-500' : formatted.dotClass
            }`}
            title={formatted.text}
          />
        </div>
      )}

      {/* Middle Text Info */}
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`text-[14px] truncate leading-tight ${
                isUnread ? 'font-bold text-white' : 'font-semibold text-zinc-200 group-hover:text-white'
              }`}
            >
              {displayName}
            </span>
            {isPinned && <Pin className={`w-3 h-3 shrink-0 ${resolvedTheme.accentIconClass}`} />}
            {isMuted && <VolumeX className="w-3 h-3 text-zinc-500 shrink-0" />}
          </div>
          {timeFormatted && (
            <span
              className={`text-[11px] tabular-nums shrink-0 ${
                isUnread ? resolvedTheme.unreadTimeClass : 'text-zinc-500'
              }`}
            >
              {timeFormatted}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-[12px] truncate leading-snug flex-1 ${
              isUnread ? 'text-zinc-100 font-medium' : 'text-zinc-400'
            }`}
          >
            {isBlocked ? 'Blocked contact' : chat.lastMessage || 'No messages yet'}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 ? (
              <span
                className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums flex items-center justify-center ${resolvedTheme.unreadBadgeClass}`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : !chat.isRead ? (
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${resolvedTheme.unreadDotClass}`} />
            ) : null}
          </div>
        </div>

        {/* Clean unboxed secondary metadata line */}
        {(chat.isGroup || chat.roleBadge || isOnline) && (
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate uppercase tracking-wider font-medium">
            {chat.isGroup
              ? `Group · ${Math.max(2, chat.members?.length || 2)} members`
              : `${chat.roleBadge || 'Member'}${isOnline ? ' · Active now' : ''}`}
          </p>
        )}
      </div>
    </button>
  );
};

interface InboxTerminalProps {
  onBack?: () => void;
  userProfile?: any;
  allProfiles?: any[];
  discoverProfiles?: any[];
  onSelectProfile?: (profile: any) => void;
}

export const InboxTerminal: React.FC<InboxTerminalProps> = ({
  onBack,
  userProfile: initialUserProfile,
  allProfiles = [],
  discoverProfiles = [],
  onSelectProfile,
}) => {
  const [conversations, setConversations] = useState<InboxConversation[]>(() => {
    const bootIds = [
      initialUserProfile?.id,
      initialUserProfile?.email,
    ].filter(Boolean) as string[];
    return readCachedConversations(bootIds);
  });
  const [loading, setLoading] = useState(() => conversations.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Active conversation & messages
  const [selectedContact, setSelectedContact] = useState<InboxConversation | null>(null);
  const selectedPresence = useUserPresence(selectedContact?.isGroup ? null : selectedContact);
  const [threadMessages, setThreadMessages] = useState<HydratedThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Media & Attachments
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Modals & Preferences
  const [showSettings, setShowSettings] = useState(false);
  const [showThreadSettings, setShowThreadSettings] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [threadThemes, setThreadThemes] = useState<Record<string, string>>(() =>
    readStoredThreadThemes()
  );
  const [threadNicknames, setThreadNicknames] = useState<Record<string, string>>({});
  const [mutedThreads, setMutedThreads] = useState<Record<string, boolean>>({});
  const [pinnedThreads, setPinnedThreads] = useState<Record<string, boolean>>({});
  const [blockedContacts, setBlockedContacts] = useState<Record<string, boolean>>({});
  const [restrictedContacts, setRestrictedContacts] = useState<Record<string, boolean>>({});

  const activeThreadTheme = useMemo(
    () => getThreadTheme(selectedContact ? threadThemes[selectedContact.contactId] : undefined),
    [selectedContact, threadThemes]
  );

  const handleSetThreadTheme = useCallback(
    (contactId: string, themeId: string) => {
      if (!contactId) return;
      const chosen = getThreadTheme(themeId);
      setThreadThemes((prev) => {
        const next = { ...prev, [contactId]: chosen.id };
        writeStoredThreadThemes(next);
        return next;
      });
      setToastMessage(`Thread theme set to ${chosen.name}`);
    },
    []
  );

  const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserProfile?.id || null);
  const [myValidUuids, setMyValidUuids] = useState<string[]>(() =>
    initialUserProfile?.id && isValidUuid(initialUserProfile.id) ? [initialUserProfile.id] : []
  );
  const [userProfile, setUserProfile] = useState<any>(initialUserProfile || null);
  const [globalReadReceipts, setGlobalReadReceipts] = useState(true);
  const [globalActiveStatus, setGlobalActiveStatus] = useState(true);
  const [whoCanReachMe, setWhoCanReachMe] = useState<'everyone' | 'artists_bands' | 'mutuals'>('everyone');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Message Reactions State
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});

  const [myNote, setMyNote] = useState<string | null>(() => {
    if (initialUserProfile?.update_ticker) return initialUserProfile.update_ticker;
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('nexus_user_thought_note') || null;
    }
    return null;
  });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isMyNoteFresh, setIsMyNoteFresh] = useState(false);
  const [viewedStoryIds, setViewedStoryIds] = useState<Record<string, boolean>>({});
  const [sceneNoteShuffleSeed, setSceneNoteShuffleSeed] = useState<number>(() => Math.random());
  const [realStories, setRealStories] = useState<any[]>([]);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
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

  // Rich Signals, Swipe-to-Reply & In-Thread Search
  const [signalComposerMode, setSignalComposerMode] = useState<SignalComposerMode | null>(null);
  const [replyingToMsg, setReplyingToMsg] = useState<ReplyReference | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [swipeState, setSwipeState] = useState<{ msgId: string; offsetX: number } | null>(null);
  const [showThreadSearch, setShowThreadSearch] = useState(false);
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [threadSearchTab, setThreadSearchTab] = useState<'messages' | 'links'>('messages');
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);

  const selectedContactRef = useRef<InboxConversation | null>(selectedContact);
  selectedContactRef.current = selectedContact;
  const conversationsRef = useRef<InboxConversation[]>(conversations);
  conversationsRef.current = conversations;
  const myValidUuidsRef = useRef<string[]>(myValidUuids);
  myValidUuidsRef.current = myValidUuids;
  const currentUserIdRef = useRef<string | null>(currentUserId);
  currentUserIdRef.current = currentUserId;
  const initialUserProfileRef = useRef<any>(initialUserProfile);
  initialUserProfileRef.current = initialUserProfile;
  const userProfileRef = useRef<any>(userProfile);
  userProfileRef.current = userProfile;
  const allProfilesRef = useRef<any[]>(allProfiles);
  allProfilesRef.current = allProfiles;
  const discoverProfilesRef = useRef<any[]>(discoverProfiles);
  discoverProfilesRef.current = discoverProfiles;
  const replyingToRef = useRef<ReplyReference | null>(replyingToMsg);
  replyingToRef.current = replyingToMsg;
  const composerInputRef = useRef<HTMLInputElement>(null);
  const msgRefsMap = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartRef = useRef<{
    msgId: string;
    startX: number;
    startY: number;
    isHorizontal: boolean | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myThreadDisplayName =
    userProfile?.full_name || userProfile?.name || userProfile?.console_handle || 'You';
  const myThreadAvatar =
    userProfile?.avatar_url || userProfile?.avatar || initialUserProfile?.avatar_url || undefined;
  const threadPresenceKey = useMemo(
    () =>
      computeThreadPresenceKey(
        currentUserId,
        selectedContact?.contactId,
        selectedContact?.isGroup
      ),
    [currentUserId, selectedContact?.contactId, selectedContact?.isGroup]
  );

  const { typingUsers, memberReadMap, notifyTyping, notifyReadMessage } = useThreadPresence({
    threadKey: threadPresenceKey,
    myUserId: currentUserId,
    myName: myThreadDisplayName,
    myAvatar: myThreadAvatar,
  });

  const notifyReadMessageRef = useRef(notifyReadMessage);
  notifyReadMessageRef.current = notifyReadMessage;

  const latestNonTempMsgId = useMemo(() => {
    for (let i = threadMessages.length - 1; i >= 0; i--) {
      const m = threadMessages[i];
      if (!m.isSystemEvent && m.id && !String(m.id).startsWith('temp_')) {
        return m.id;
      }
    }
    return undefined;
  }, [threadMessages]);

  useEffect(() => {
    if (latestNonTempMsgId && selectedContact?.contactId) {
      notifyReadMessageRef.current(latestNonTempMsgId);
    }
  }, [latestNonTempMsgId, selectedContact?.contactId]);

  const offerStatusMap = useMemo(
    () => computeOfferStatuses(threadMessages),
    [threadMessages]
  );

  const sharedThreadLinks = useMemo(
    () => extractSharedLinks(threadMessages),
    [threadMessages]
  );

  const matchedThreadMsgIds = useMemo(() => {
    const q = threadSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return threadMessages
      .filter((m) => {
        if (m.isSystemEvent) return false;
        const hay = [
          m.textContent,
          m.audioCard?.title,
          m.audioCard?.artist,
          m.offerCard?.title,
          m.offerCard?.venue,
          m.offerCard?.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .map((m) => m.id);
  }, [threadMessages, threadSearchQuery]);

  const scrollToMessage = useCallback((msgId: string) => {
    if (!msgId) return;
    const el = msgRefsMap.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedMsgId((prev) => (prev === msgId ? null : prev));
      }, 1800);
    }
  }, []);

  useEffect(() => {
    if (matchedThreadMsgIds.length === 0) {
      setActiveMatchIdx(0);
      return;
    }
    const clampedIdx = Math.min(activeMatchIdx, matchedThreadMsgIds.length - 1);
    if (clampedIdx !== activeMatchIdx) {
      setActiveMatchIdx(clampedIdx);
    }
  }, [matchedThreadMsgIds, activeMatchIdx]);

  const handleToggleMessageReaction = (msgId: string, emoji: string) => {
    setMessageReactions((prev) => {
      const existing = prev[msgId] || [];
      const updated = existing.includes(emoji)
        ? existing.filter((e) => e !== emoji)
        : [...existing, emoji];
      return { ...prev, [msgId]: updated };
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2600);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Filter out test probes, dummy placeholders, and disconnected phantom accounts
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

    if (email.includes('test_probe') || email.includes('@example.com') || email.includes('probe_')) {
      return false;
    }

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
      if (!hasCustomHandle && !hasAffiliation && !hasCustomAvatar && !hasMeaningfulBio) {
        return false;
      }
    }

    return Boolean(profile.id || name);
  };

  // Suggested & searchable in-app contacts for compose & group member pickers
  const availableRecipientProfiles: ComposerContact[] = useMemo(() => {
    const recipientsList: ComposerContact[] = [];
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const seenHandles = new Set<string>();
    const seenNames = new Set<string>();

    const activeUserIds = new Set(
      [
        currentUserId,
        ...myValidUuids,
        initialUserProfile?.id,
        userProfile?.id,
        userProfile?.email?.toLowerCase().trim(),
        userProfile?.console_handle?.toLowerCase().replace(/^@/, '').trim(),
        userProfile?.full_name?.toLowerCase().trim(),
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
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

      if (
        (normId && activeUserIds.has(normId)) ||
        (rawIdStr && activeUserIds.has(rawIdStr.toLowerCase())) ||
        (normEmail && activeUserIds.has(normEmail)) ||
        (normHandle && activeUserIds.has(normHandle)) ||
        (normName && activeUserIds.has(normName))
      ) {
        return;
      }

      const isDuplicate =
        (normId && seenIds.has(normId)) ||
        (normEmail && seenEmails.has(normEmail)) ||
        (normHandle && seenHandles.has(normHandle)) ||
        (normName && normName !== 'user' && normName !== 'nexus user' && seenNames.has(normName));

      const cleanHandleDisplay = rawHandle
        ? rawHandle.startsWith('@')
          ? rawHandle
          : `@${rawHandle}`
        : '';
      const cleanAvatar = candidate.avatar || rawObj.avatar_url || rawObj.avatar || '';

      if (isDuplicate) {
        const existing = recipientsList.find((r) => {
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
          if (normId && (!existing.id || existing.id.startsWith('real-p-') || existing.id.startsWith('user-'))) {
            existing.id = rawIdStr.replace(/^real-p-/, '');
          }
          if ((!existing.avatar || existing.avatar.includes('default')) && cleanAvatar && !cleanAvatar.includes('default')) {
            existing.avatar = cleanAvatar;
          }
          if (!existing.handle && cleanHandleDisplay) existing.handle = cleanHandleDisplay;
          if (!existing.email && normEmail) existing.email = normEmail;
        }
        return;
      }

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
        subtext:
          candidate.subtext ||
          (rawObj.bio ? (rawObj.bio.length > 70 ? rawObj.bio.substring(0, 67) + '…' : rawObj.bio) : '') ||
          '',
        raw: rawObj,
      });
    };

    realStories.forEach((s) =>
      addOrMergeRecipient({
        id: s.rawProfile?.id || s.id,
        name: s.profileName,
        handle: s.handle || '',
        email: s.rawProfile?.email,
        avatar: s.avatarUrl || '',
        role: s.accountType || 'USER',
        subtext: s.note || s.song || '',
        raw: s.rawProfile,
      })
    );

    (allProfiles || []).forEach((p) =>
      addOrMergeRecipient({
        id: p?.id,
        name: p?.full_name || p?.name || p?.console_handle,
        handle: p?.console_handle ? (p.console_handle.startsWith('@') ? p.console_handle : `@${p.console_handle}`) : '',
        email: p?.email,
        avatar: p?.avatar_url || p?.avatar || '',
        role: (p?.account_type || p?.role || 'USER').toUpperCase(),
        subtext: p?.bio || (p?.genre_tags?.length ? p.genre_tags.join(', ') : ''),
        raw: p,
      })
    );

    (discoverProfiles || []).forEach((p) =>
      addOrMergeRecipient({
        id: p?.id,
        name: p?.full_name || p?.name || p?.console_handle,
        handle: p?.console_handle ? (p.console_handle.startsWith('@') ? p.console_handle : `@${p.console_handle}`) : '',
        email: p?.email,
        avatar: p?.avatar_url || p?.avatar || '',
        role: (p?.account_type || p?.role || 'USER').toUpperCase(),
        subtext: p?.bio || '',
        raw: p,
      })
    );

    conversations.forEach((c) => {
      if (c.contactId && !c.isGroup) {
        addOrMergeRecipient({
          id: c.contactId,
          name: c.profileName,
          email: c.email,
          avatar: c.avatarUrl || '',
          role: (c.roleBadge || 'USER').toUpperCase(),
          subtext: c.lastMessage || '',
          raw: { id: c.contactId, full_name: c.profileName, avatar_url: c.avatarUrl, email: c.email },
        });
      }
    });

    return recipientsList.sort((a, b) => {
      const aHasAvatar = Boolean(a.avatar && a.avatar.trim() !== '');
      const bHasAvatar = Boolean(b.avatar && b.avatar.trim() !== '');
      if (aHasAvatar && !bHasAvatar) return -1;
      if (!aHasAvatar && bHasAvatar) return 1;
      const aHasHandle = Boolean(a.handle && a.handle.trim() !== '');
      const bHasHandle = Boolean(b.handle && b.handle.trim() !== '');
      if (aHasHandle && !bHasHandle) return -1;
      if (!aHasHandle && bHasHandle) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [realStories, allProfiles, discoverProfiles, conversations, currentUserId, myValidUuids, initialUserProfile?.id, userProfile]);

  const orderedSceneNotes = useMemo(() => {
    const storyMap = new Map<string, any>();
    realStories.forEach((s) => {
      if (s.profileName || s.handle) {
        storyMap.set((s.profileName || s.handle).toLowerCase(), s);
      }
    });

    const mergedList: any[] = [...realStories];
    availableRecipientProfiles.forEach((p) => {
      const key = (p.name || p.handle || '').toLowerCase();
      if (key && !storyMap.has(key)) {
        mergedList.push({
          id: p.id,
          profileName: p.name,
          handle: p.handle,
          avatarUrl: p.avatar,
          note: p.subtext || null,
          song: null,
          accountType: p.role,
          rawProfile: p.raw,
        });
      }
    });

    return prioritizeAndRandomizeSceneNotes(mergedList, sceneNoteShuffleSeed).slice(0, 32);
  }, [realStories, availableRecipientProfiles, sceneNoteShuffleSeed]);

  /**
   * Resolves ALL valid identities for the signed-in user so Inbox never misses threads
   * due to startup session race or persona/profile ID discrepancies.
   */
  const resolveCurrentUser = useCallback(async () => {
    let primaryUid: string | undefined;
    let email: string | undefined;
    let profileData: any = initialUserProfile || null;
    const uuidSet = new Set<string>();
    const identifierSet = new Set<string>();

    const collectId = (val: any) => {
      if (!val || typeof val !== 'string') return;
      const trimmed = val.trim();
      if (!trimmed) return;
      identifierSet.add(trimmed);
      if (isValidUuid(trimmed)) uuidSet.add(trimmed);
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        primaryUid = session.user.id;
        collectId(session.user.id);
      }
      if (session?.user?.email) {
        email = session.user.email.toLowerCase().trim();
        identifierSet.add(email);
      }
      if (!primaryUid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          primaryUid = user.id;
          collectId(user.id);
        }
        if (!email && user?.email) {
          email = user.email.toLowerCase().trim();
          identifierSet.add(email);
        }
      }
    } catch (e) {
      console.warn('[InboxTerminal] Auth session resolution notice:', e);
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const authTokenRaw = localStorage.getItem('nexus_core_auth_token');
        if (authTokenRaw) {
          const parsed = JSON.parse(authTokenRaw);
          if (parsed?.user?.id) {
            if (!primaryUid) primaryUid = parsed.user.id;
            collectId(parsed.user.id);
          }
          if (!email && parsed?.user?.email) {
            email = parsed.user.email.toLowerCase().trim();
            identifierSet.add(email);
          }
        }
      } catch {}

      const sbKey = Object.keys(localStorage).find((k) => k.includes('sb-') && k.includes('-auth-token'));
      if (sbKey) {
        try {
          const parsed = JSON.parse(localStorage.getItem(sbKey) || '{}');
          if (parsed?.user?.id) {
            if (!primaryUid) primaryUid = parsed.user.id;
            collectId(parsed.user.id);
          }
          if (!email && parsed?.user?.email) {
            email = parsed.user.email.toLowerCase().trim();
            identifierSet.add(email);
          }
        } catch {}
      }

      try {
        const activeProfId = localStorage.getItem('nexus_active_profile_id');
        if (activeProfId) collectId(activeProfId);

        const stored = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
        if (stored) {
          const parsedProfile = JSON.parse(stored);
          if (!profileData) profileData = parsedProfile;
          if (parsedProfile?.id) {
            if (!primaryUid) primaryUid = parsedProfile.id;
            collectId(parsedProfile.id);
          }
          if (!email && parsedProfile?.email) {
            email = String(parsedProfile.email).toLowerCase().trim();
            identifierSet.add(email);
          }
        }
      } catch {}
    }

    const initProf = initialUserProfileRef.current;
    if (initProf?.id) {
      if (!primaryUid) primaryUid = initProf.id;
      collectId(initProf.id);
    }
    if (initProf?.email) {
      if (!email) email = String(initProf.email).toLowerCase().trim();
      identifierSet.add(String(initProf.email).toLowerCase().trim());
    }

    if (primaryUid && (!profileData || !profileData.full_name)) {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', primaryUid).maybeSingle();
        if (data) profileData = { ...(profileData || {}), ...data };
      } catch {}
    }

    if (!profileData) {
      profileData = { id: primaryUid || 'guest_user', name: 'You', email: email || '' };
    }

    const allUuids = Array.from(uuidSet);
    const resolvedPrimary = primaryUid || allUuids[0] || profileData?.id || null;
    if (resolvedPrimary) {
      setCurrentUserId((prev) => (prev === resolvedPrimary ? prev : resolvedPrimary));
    }
    if (allUuids.length > 0) {
      const nextKey = allUuids.join('|');
      setMyValidUuids((prev) => (prev.join('|') === nextKey ? prev : allUuids));
    }
    setUserProfile((prev: any) => {
      if (
        prev &&
        profileData &&
        prev.id === profileData.id &&
        prev.full_name === profileData.full_name &&
        prev.name === profileData.name &&
        prev.avatar_url === profileData.avatar_url &&
        prev.email === profileData.email
      ) {
        return prev;
      }
      return profileData;
    });

    return {
      uid: resolvedPrimary,
      email,
      profileData,
      allUuids,
      allIdentifiers: Array.from(identifierSet),
    };
  }, []);

  // Fetch conversations across ALL valid user UUIDs (both 1-on-1 DMs and Group Threads)
  const fetchInboxConversations = useCallback(async () => {
    setRefreshing(true);
    const { uid, email, allUuids, allIdentifiers } = await resolveCurrentUser();

    if (allUuids.length === 0) {
      console.warn('[InboxTerminal] Deferred sync: Waiting for active session UUID.');
      const cached = readCachedConversations([uid || '', email || ''].filter(Boolean));
      if (cached.length > 0) {
        setConversations((prev) => (prev.length > 0 ? prev : cached));
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Hydrate cache immediately if state is still empty
    const cached = readCachedConversations([...allUuids, ...(email ? [email] : [])]);
    if (cached.length > 0) {
      setConversations((prev) => (prev.length === 0 ? cached : prev));
    }

    const filterConditions: string[] = [];
    allUuids.forEach((id) => {
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
        console.error('[InboxTerminal] Error fetching nexus_chats:', error.message);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!messages || messages.length === 0) {
        setConversations([]);
        writeCachedConversations([...allUuids, ...(email ? [email] : [])], []);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Collect all partner IDs and group member IDs so profile details hydrate cleanly
      const profileIdsToFetch = new Set<string>();
      const myLowerSet = new Set(allIdentifiers.map((id) => id.toLowerCase()));

      messages.forEach((msg: any) => {
        const parsed = parseChatMessagePayload(msg);
        if (parsed.group) {
          (parsed.group.members || []).forEach((m) => {
            if (m?.id) profileIdsToFetch.add(String(m.id));
          });
        } else {
          const isMe = myLowerSet.has(String(msg.sender_id || '').toLowerCase());
          const partner = isMe ? msg.receiver_id || msg.recipient_id : msg.sender_id;
          if (partner && !myLowerSet.has(String(partner).toLowerCase())) {
            profileIdsToFetch.add(String(partner));
          }
        }
      });

      const profileMap = new Map<string, any>();
      const idsArray = Array.from(profileIdsToFetch);
      if (idsArray.length > 0) {
        const profileFilters: string[] = [];
        idsArray.forEach((id) => {
          if (isValidUuid(id)) profileFilters.push(`id.eq.${id}`);
          else if (id.includes('@')) profileFilters.push(`email.eq.${id.toLowerCase().trim()}`);
          else profileFilters.push(`console_handle.eq.${id}`);
        });

        if (profileFilters.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name, console_handle, avatar_url, account_type')
            .or(profileFilters.join(','));

          profiles?.forEach((p) => {
            if (p.id) {
              profileMap.set(p.id, p);
              profileMap.set(p.id.toLowerCase(), p);
            }
            if (p.email) profileMap.set(p.email.toLowerCase().trim(), p);
            if (p.console_handle) profileMap.set(p.console_handle.toLowerCase().trim(), p);
          });
        }
      }

      const aggregated = aggregateInboxConversations(messages, allIdentifiers, profileMap).map((conv) => {
        if (conv.isGroup && conv.members) {
          const enrichedMembers = conv.members.map((m) => {
            const p = profileMap.get(m.id) || profileMap.get(m.id.toLowerCase());
            if (!p) return m;
            return {
              ...m,
              name: m.name || p.full_name || p.console_handle || 'Member',
              avatarUrl: m.avatarUrl || p.avatar_url || undefined,
              role: m.role || (p.account_type || 'USER').toUpperCase(),
              email: m.email || p.email,
            };
          });
          return {
            ...conv,
            members: enrichedMembers,
            profileName:
              conv.groupName || formatDefaultGroupName(enrichedMembers, allIdentifiers),
          };
        }
        return conv;
      });

      setConversations((prev) => {
        // Preserve newly initiated unsent drafts/conversations created during this session
        const activeDrafts = prev.filter(
          (p) =>
            !aggregated.some(
              (a) => String(a.contactId).toLowerCase() === String(p.contactId).toLowerCase()
            ) &&
            selectedContactRef.current?.contactId === p.contactId
        );
        const merged = [...activeDrafts, ...aggregated];
        writeCachedConversations([...allUuids, ...(email ? [email] : [])], merged);
        return merged;
      });

      // If a thread was opened via push notification deep-link before conversations hydrated, enrich selectedContact now
      if (selectedContactRef.current?.contactId) {
        const activeCid = String(selectedContactRef.current.contactId).toLowerCase();
        const hydratedMatch = aggregated.find(
          (a) => String(a.contactId).toLowerCase() === activeCid
        );
        if (hydratedMatch) {
          setSelectedContact((prev) =>
            prev && String(prev.contactId).toLowerCase() === activeCid
              ? {
                  ...prev,
                  ...hydratedMatch,
                  isRead: true,
                  unreadCount: 0,
                }
              : prev
          );
        }
      }
    } catch (err) {
      console.error('[InboxTerminal] Exception querying inbox conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resolveCurrentUser]);

  // Fetch thread messages for either a 1-on-1 DM or a Group Thread
  const fetchThreadMessages = useCallback(
    async (target: InboxConversation | string) => {
      const targetConv: InboxConversation | null =
        typeof target === 'string'
          ? conversationsRef.current.find((c) => c.contactId === target) || {
              contactId: target,
              profileName: target,
              lastMessage: '',
              timestamp: new Date().toISOString(),
              isRead: true,
              isGroup: target.startsWith('grp_'),
              groupId: target.startsWith('grp_') ? target : undefined,
            }
          : target;

      if (!targetConv?.contactId) return;
      setThreadLoading(true);

      const { uid, allUuids, allIdentifiers } = await resolveCurrentUser();
      if (allUuids.length === 0 && !uid) {
        setThreadLoading(false);
        return;
      }

      const activeUuids = allUuids.length > 0 ? allUuids : uid ? [uid] : [];

      try {
        let rawRows: any[] = [];

        if (targetConv.isGroup && targetConv.groupId) {
          const orConditions: string[] = [];
          activeUuids.forEach((myId) => {
            orConditions.push(`sender_id.eq.${myId}`);
            orConditions.push(`receiver_id.eq.${myId}`);
            orConditions.push(`recipient_id.eq.${myId}`);
          });
          const { data } = await supabase
            .from('nexus_chats')
            .select('*')
            .or(orConditions.join(','))
            .order('created_at', { ascending: true });

          rawRows = data || [];
          const timeline = buildThreadTimeline(rawRows, {
            groupId: targetConv.groupId,
            myIds: allIdentifiers,
          });
          setThreadMessages(timeline);

          // Mark any unread incoming group rows for this group as read
          const myLower = new Set(allIdentifiers.map((id) => id.toLowerCase()));
          const unreadRowIds = timeline
            .filter(
              (m) =>
                !myLower.has(m.sender_id.toLowerCase()) &&
                m.raw?.id &&
                (m.raw.is_read === false || m.raw.is_read === null)
            )
            .map((m) => m.raw.id);

          // Also collect any raw unread rows for this group
          rawRows.forEach((r: any) => {
            const parsed = parseChatMessagePayload(r);
            if (
              parsed.group?.groupId === targetConv.groupId &&
              !myLower.has(String(r.sender_id || '').toLowerCase()) &&
              (r.is_read === false || r.is_read === null) &&
              r.id &&
              !unreadRowIds.includes(r.id)
            ) {
              unreadRowIds.push(r.id);
            }
          });

          if (unreadRowIds.length > 0) {
            await supabase
              .from('nexus_chats')
              .update({ is_read: true })
              .in('id', unreadRowIds);
          }
        } else {
          const cid = targetConv.contactId;
          const queryPairs: string[] = [];
          activeUuids.forEach((myId) => {
            if (isValidUuid(myId) && isValidUuid(cid)) {
              queryPairs.push(`and(sender_id.eq.${myId},receiver_id.eq.${cid})`);
              queryPairs.push(`and(sender_id.eq.${cid},receiver_id.eq.${myId})`);
              queryPairs.push(`and(sender_id.eq.${myId},recipient_id.eq.${cid})`);
              queryPairs.push(`and(sender_id.eq.${cid},recipient_id.eq.${myId})`);
            } else {
              queryPairs.push(`and(sender_id.eq.${myId},receiver_id.eq.${cid})`);
              queryPairs.push(`and(sender_id.eq.${cid},receiver_id.eq.${myId})`);
            }
          });

          const { data, error } = await supabase
            .from('nexus_chats')
            .select('*')
            .or(queryPairs.join(','))
            .order('created_at', { ascending: true });

          if (!error && data) {
            rawRows = data;
          } else {
            const orFallback = activeUuids
              .flatMap((myId) => [
                `sender_id.eq.${myId}`,
                `receiver_id.eq.${myId}`,
                `recipient_id.eq.${myId}`,
              ])
              .concat([`sender_id.eq.${cid}`, `receiver_id.eq.${cid}`, `recipient_id.eq.${cid}`])
              .join(',');
            const { data: fallbackData } = await supabase
              .from('nexus_chats')
              .select('*')
              .or(orFallback)
              .order('created_at', { ascending: true });
            rawRows = fallbackData || [];
          }

          const timeline = buildThreadTimeline(rawRows, {
            contactId: cid,
            myIds: allIdentifiers,
          });
          setThreadMessages(timeline);
        }

        // Update local unread state immediately
        setConversations((prev) =>
          prev.map((c) =>
            c.contactId === targetConv.contactId
              ? { ...c, isRead: true, unread: 0, unreadCount: 0 }
              : c
          )
        );
      } catch (e) {
        console.error('[InboxTerminal] Exception querying thread messages:', e);
      } finally {
        setThreadLoading(false);
      }
    },
    [resolveCurrentUser]
  );

  // Fetch real profiles for top active strip
  const fetchRealProfilesForStories = useCallback(async () => {
    try {
      const { data: dbProfiles, error } = await supabase
        .from('profiles')
        .select(
          'id, email, full_name, console_handle, avatar_url, bio, top_song_title, update_ticker, account_type, genre_tags, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('[InboxTerminal] Querying profiles notice:', error.message);
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

        if (isDuplicate) return;

        if (normId) seenIds.add(normId);
        if (normEmail) seenEmails.add(normEmail);
        if (normHandle) seenHandles.add(normHandle);
        if (normName && normName !== 'user' && normName !== 'nexus user') seenNames.add(normName);

        combinedList.push({ ...p, id: rawIdStr.replace(/^real-p-/, '') });
      };

      (dbProfiles || []).forEach((p) => addCombinedProfile(p));
      (allProfilesRef.current || []).forEach((p) =>
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
        })
      );
      (discoverProfilesRef.current || []).forEach((p) =>
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
        })
      );

      const uProf = userProfileRef.current;
      const initProf = initialUserProfileRef.current;
      const activeUserIds = new Set(
        [
          currentUserIdRef.current,
          ...myValidUuidsRef.current,
          initProf?.id,
          uProf?.id,
          uProf?.email?.toLowerCase(),
          uProf?.console_handle?.toLowerCase(),
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
      );

      const mappedStories = combinedList
        .filter((p) => {
          if (!p) return false;
          if (p.id && activeUserIds.has(String(p.id).toLowerCase())) return false;
          if (p.email && activeUserIds.has(String(p.email).toLowerCase())) return false;
          if (p.console_handle && activeUserIds.has(String(p.console_handle).toLowerCase())) return false;
          return isLegitimateRecipientProfile(p);
        })
        .map((p) => {
          const rawName = p.full_name || p.name || p.console_handle || 'Nexus User';
          const cleanHandle = p.console_handle
            ? p.console_handle.startsWith('@')
              ? p.console_handle
              : `@${p.console_handle}`
            : '';
          const hasRealUpdate = Boolean(p.update_ticker || p.rosterTicker || p.top_song_title);
          const rawNote =
            p.update_ticker ||
            p.rosterTicker ||
            (p.bio ? (p.bio.length > 70 ? p.bio.substring(0, 67) + '…' : p.bio) : null) ||
            (p.top_song_title
              ? `Listening to: ${p.top_song_title}`
              : p.genre_tags?.length
              ? `Into ${p.genre_tags[0]}`
              : null);

          return {
            id: p.id,
            profileName: rawName,
            handle: cleanHandle,
            avatarUrl: p.avatar_url || p.avatar || '',
            note: rawNote,
            song: p.top_song_title || p.favoriteSong || '',
            accountType: (p.account_type || p.role || 'User').toUpperCase(),
            hasRealUpdate,
            rawProfile: p,
          };
        });

      setRealStories(mappedStories);
    } catch (err) {
      console.error('[InboxTerminal] Error fetching real profiles:', err);
    }
  }, []);

  useEffect(() => {
    fetchRealProfilesForStories();
  }, [allProfiles?.length, discoverProfiles?.length, initialUserProfile?.id, fetchRealProfilesForStories]);

  // Primary Inbox Sync + Auth Subscription + Supabase Realtime Listener
  useEffect(() => {
    fetchInboxConversations();

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        fetchInboxConversations();
      }
    });

    const handleSync = () => {
      fetchInboxConversations();
    };
    const handleReadSync = (e: any) => {
      const readChatId = e.detail?.chatId;
      if (readChatId) {
        setConversations((prev) =>
          prev.map((c) =>
            c.contactId === readChatId ? { ...c, isRead: true, unread: 0, unreadCount: 0 } : c
          )
        );
      }
    };
    const handleAllReadSync = () => {
      setConversations((prev) =>
        prev.map((c) => ({ ...c, isRead: true, unread: 0, unreadCount: 0 }))
      );
    };

    window.addEventListener('nexus_chats_updated', handleSync);
    window.addEventListener('nexus_chat_read', handleReadSync);
    window.addEventListener('nexus_all_read', handleAllReadSync);

    const channel = supabase
      .channel(`inbox_terminal_db_sync_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'nexus_chats' },
        (payload) => {
          const incomingMessage = payload.new as any;
          if (!incomingMessage) return;

          const activeUuidLower = new Set(
            [currentUserIdRef.current, ...myValidUuidsRef.current]
              .filter(Boolean)
              .map((id) => String(id).toLowerCase())
          );

          const senderLower = String(incomingMessage.sender_id || '').toLowerCase();
          const recLower = String(
            incomingMessage.receiver_id || incomingMessage.recipient_id || ''
          ).toLowerCase();

          // Ignore unrelated global rows if we know our user IDs
          if (
            activeUuidLower.size > 0 &&
            !activeUuidLower.has(senderLower) &&
            !activeUuidLower.has(recLower)
          ) {
            return;
          }

          fetchInboxConversations();

          const currentOpen = selectedContactRef.current;
          if (!currentOpen) return;

          const parsed = parseChatMessagePayload(incomingMessage);
          if (currentOpen.isGroup && currentOpen.groupId) {
            if (parsed.group?.groupId === currentOpen.groupId) {
              fetchThreadMessages(currentOpen);
            }
          } else if (!parsed.group) {
            const activePartnerId = currentOpen.contactId;
            if (
              activePartnerId &&
              (incomingMessage.sender_id === activePartnerId ||
                incomingMessage.receiver_id === activePartnerId ||
                incomingMessage.recipient_id === activePartnerId)
            ) {
              if (incomingMessage.sender_id === activePartnerId) {
                markChatAsRead(
                  incomingMessage.sender_id,
                  currentUserIdRef.current || undefined
                );
              }
              fetchThreadMessages(currentOpen);
            }
          }
        }
      )
      .subscribe();

    return () => {
      authSub?.subscription?.unsubscribe();
      window.removeEventListener('nexus_chats_updated', handleSync);
      window.removeEventListener('nexus_chat_read', handleReadSync);
      window.removeEventListener('nexus_all_read', handleAllReadSync);
      supabase.removeChannel(channel);
    };
  }, [initialUserProfile?.id, fetchInboxConversations, fetchThreadMessages]);

  const handleSelectThread = useCallback(
    async (chat: InboxConversation) => {
      if (!chat?.contactId) return;

      setThreadMessages((prev) =>
        prev.map((m) =>
          chat.isGroup || m.sender_id === chat.contactId
            ? { ...m, is_read: true }
            : m
        )
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.contactId === chat.contactId
            ? { ...c, isRead: true, unread: 0, unreadCount: 0 }
            : c
        )
      );

      window.dispatchEvent(
        new CustomEvent('nexus_chat_read', { detail: { chatId: chat.contactId } })
      );

      if (!chat.isGroup) {
        await markChatAsRead(chat.contactId, currentUserId || undefined);
      }
    },
    [currentUserId]
  );

  const handleSelectContact = useCallback(
    (chat: InboxConversation) => {
      setSelectedContact(chat);
      setReplyingToMsg(null);
      setShowThreadSearch(false);
      setThreadSearchQuery('');
      setActiveMatchIdx(0);
      handleSelectThread(chat);
      fetchThreadMessages(chat);
    },
    [handleSelectThread, fetchThreadMessages]
  );

  useEffect(() => {
    setActiveDmThreadId(selectedContact?.contactId || null);
    return () => {
      setActiveDmThreadId(null);
    };
  }, [selectedContact?.contactId]);

  const openThreadByDetail = useCallback(
    (detail: any) => {
      const rawContactId = detail?.groupId || detail?.profile_id || detail?.senderId || detail?.id;
      if (!rawContactId) return;
      const contactId = String(rawContactId).trim();
      const rawName = String(detail.name || detail.username || detail.senderName || 'Contact')
        .replace(/^💬\s*Direct Message from\s+/i, '')
        .replace(/^💬\s*New Direct Message/i, '')
        .replace(/^💬\s*/i, '')
        .trim();
      const profileName = rawName || 'Contact';
      const avatarUrl = detail.avatar_url || detail.avatar;
      const isGroupThread = Boolean(detail.isGroup || contactId.startsWith('grp_'));

      const matched = conversationsRef.current.find(
        (c) => String(c.contactId).toLowerCase() === contactId.toLowerCase()
      );
      if (matched) {
        handleSelectContact(matched);
      } else {
        const newContact: InboxConversation = {
          contactId,
          profileName,
          avatarUrl,
          lastMessage: '',
          timestamp: new Date().toISOString(),
          isRead: true,
          unreadCount: 0,
          isGroup: isGroupThread,
          groupId: isGroupThread ? contactId : undefined,
          groupName: isGroupThread ? profileName : undefined,
          roleBadge: (detail.role || detail.role_badge || (isGroupThread ? 'GROUP' : 'USER')).toUpperCase(),
        };
        setConversations((prev) => {
          if (
            prev.some(
              (c) => String(c.contactId).toLowerCase() === contactId.toLowerCase()
            )
          ) {
            return prev;
          }
          return [newContact, ...prev];
        });
        handleSelectContact(newContact);
      }
    },
    [handleSelectContact]
  );

  useEffect(() => {
    // Auto-minimize any open floating chat head when entering the full Inbox view
    window.dispatchEvent(new CustomEvent('nexus_inbox_mounted'));

    const handleOpenEvent = (e: any) => {
      openThreadByDetail(e?.detail);
    };

    const pending = consumePendingDmThread();
    if (pending?.profile_id) {
      openThreadByDetail(pending);
    }

    window.addEventListener('nexus_open_chat', handleOpenEvent);
    window.addEventListener('nexus_open_chat_thread', handleOpenEvent);
    window.addEventListener('nexus_open_inbox_thread', handleOpenEvent);
    return () => {
      window.removeEventListener('nexus_open_chat', handleOpenEvent);
      window.removeEventListener('nexus_open_chat_thread', handleOpenEvent);
      window.removeEventListener('nexus_open_inbox_thread', handleOpenEvent);
    };
  }, [openThreadByDetail]);

  /**
   * Dispatch a group message (text, attachment, rich cards, replies, or system action) across all recipients
   */
  const dispatchGroupEnvelope = useCallback(
    async (
      targetGroup: InboxConversation,
      opts: {
        text: string;
        mediaUrl?: string;
        systemAction?: GroupSystemAction;
        replyTo?: ReplyReference;
        audioCard?: AudioCardPayload;
        offerCard?: OfferCardPayload;
      }
    ) => {
      const { uid, profileData } = await resolveCurrentUser();
      const myUid = uid || currentUserId;
      if (!myUid || !targetGroup.groupId) return;

      const senderDisplayName =
        profileData?.full_name ||
        profileData?.name ||
        profileData?.console_handle ||
        userProfile?.full_name ||
        userProfile?.name ||
        'You';
      const senderAvatar =
        profileData?.avatar_url || profileData?.avatar || userProfile?.avatar_url || userProfile?.avatar;

      const membersMap = new Map<string, GroupMember>();
      membersMap.set(myUid.toLowerCase(), {
        id: myUid,
        name: senderDisplayName,
        avatarUrl: senderAvatar,
        role: (profileData?.account_type || 'USER').toUpperCase(),
      });
      (targetGroup.members || []).forEach((m) => {
        if (m?.id) membersMap.set(m.id.toLowerCase(), m);
      });
      const fullMembers = Array.from(membersMap.values());

      const msgId = createClientMsgId();
      const nowIso = new Date().toISOString();
      const groupTitle =
        targetGroup.groupName ||
        formatDefaultGroupName(fullMembers, [myUid]);

      const encodedPayload = encodeGroupMessagePayload({
        v: 1,
        groupId: targetGroup.groupId,
        groupName: groupTitle,
        members: fullMembers,
        msgId,
        senderName: senderDisplayName,
        senderAvatar,
        text: opts.text,
        mediaUrl: opts.mediaUrl,
        systemAction: opts.systemAction,
        replyTo: opts.replyTo,
        audioCard: opts.audioCard,
        offerCard: opts.offerCard,
      });

      const optimisticEntry: HydratedThreadMessage = {
        id: msgId,
        sender_id: myUid,
        created_at: nowIso,
        is_read: true,
        textContent: opts.text,
        mediaUrl: opts.mediaUrl,
        replyTo: opts.replyTo,
        audioCard: opts.audioCard,
        offerCard: opts.offerCard,
        isSystemEvent: Boolean(opts.systemAction),
        group: {
          v: 1,
          groupId: targetGroup.groupId,
          groupName: groupTitle,
          members: fullMembers,
          msgId,
          senderName: senderDisplayName,
          senderAvatar,
          text: opts.text,
          mediaUrl: opts.mediaUrl,
          systemAction: opts.systemAction,
          replyTo: opts.replyTo,
          audioCard: opts.audioCard,
          offerCard: opts.offerCard,
        },
        raw: { id: msgId, sender_id: myUid, created_at: nowIso, message: encodedPayload },
      };

      setThreadMessages((prev) => {
        if (selectedContactRef.current?.groupId !== targetGroup.groupId) return prev;
        return [...prev, optimisticEntry];
      });

      const fallbackSummary =
        opts.audioCard
          ? opts.audioCard.kind === 'voice'
            ? '🎤 Voice note'
            : `🎵 Demo: ${opts.audioCard.title}`
          : opts.offerCard
          ? `📋 ${opts.offerCard.title}`
          : opts.mediaUrl
          ? 'Sent an attachment'
          : 'Message';
      const lastPreview = opts.systemAction
        ? opts.text
        : `You: ${opts.text || fallbackSummary}`;

      setConversations((prev) =>
        prev.map((c) =>
          c.contactId === targetGroup.contactId
            ? {
                ...c,
                groupName: groupTitle,
                profileName: groupTitle,
                members: fullMembers,
                roleBadge: `GROUP · ${Math.max(2, fullMembers.length)}`,
                lastMessage: lastPreview,
                timestamp: nowIso,
                isRead: true,
                unread: 0,
                unreadCount: 0,
              }
            : c
        )
      );

      const recipientIds = fullMembers
        .map((m) => m.id)
        .filter((id) => id && id.toLowerCase() !== myUid.toLowerCase() && isValidUuid(id));

      if (recipientIds.length === 0) return;

      let serverDispatched = false;
      try {
        const accessToken = await getSupabaseAccessToken();
        if (accessToken) {
          const apiRes = await authFetch('/api/social/group-dm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              groupId: targetGroup.groupId,
              groupName: groupTitle,
              recipientIds,
              encodedPayload,
              previewText: opts.text || 'Sent an attachment',
              senderId: myUid,
              senderName: senderDisplayName,
            }),
          });
          if (apiRes.ok) serverDispatched = true;
        }
      } catch {}

      if (!serverDispatched) {
        const rows = recipientIds.map((rid) => ({
          sender_id: myUid,
          receiver_id: rid,
          recipient_id: rid,
          message: encodedPayload,
          content: encodedPayload,
          is_read: false,
          created_at: nowIso,
        }));
        const { error } = await supabase.from('nexus_chats').insert(rows);
        if (error) {
          console.error('[InboxTerminal] Group fan-out insert error:', error.message);
        }

        // Fallback push notifications per recipient
        recipientIds.forEach((rid) => {
          const memberObj = fullMembers.find((m) => m.id === rid);
          pushManager
            .sendPushToServer({
              userId: rid,
              userEmail: memberObj?.email,
              excludeUserId: myUid,
              excludeUserEmail: userProfile?.email,
              title: `💬 ${groupTitle}`,
              body: `${senderDisplayName}: ${(opts.text || 'Sent an attachment').slice(0, 110)}`,
              category: 'direct_messages',
              targetTab: 'messages',
              priority: 'P1',
              tag: `nexus-group-${targetGroup.groupId}`,
              data: {
                senderId: myUid,
                senderName: senderDisplayName,
                groupId: targetGroup.groupId,
              },
            })
            .catch(() => {});
        });
      }

      window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
    },
    [currentUserId, resolveCurrentUser, userProfile]
  );

  // Composer Handlers (1-on-1 & Group)
  const handleStartNewMessageWithContact = (contact: ComposerContact) => {
    const contactNormId = String(contact.id || '').replace(/^real-p-/, '').toLowerCase().trim();
    const contactNormName = String(contact.name || '').toLowerCase().trim();

    const existing = conversations.find((c) => {
      if (c.isGroup) return false;
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
        email: contact.email,
        profileName: contact.name,
        avatarUrl: contact.avatar,
        lastMessage: '',
        timestamp: new Date().toISOString(),
        isRead: true,
        unreadCount: 0,
        roleBadge: contact.role || 'USER',
        isGroup: false,
      };
      setConversations((prev) => [newConv, ...prev]);
      handleSelectContact(newConv);
    }
    setIsNewMessageModalOpen(false);
  };

  const handleStartCustomMessage = (customNameInput: string) => {
    const customName = customNameInput.trim().replace(/^@/, '');
    if (!customName) return;
    const existing = conversations.find(
      (c) => !c.isGroup && c.profileName.toLowerCase() === customName.toLowerCase()
    );
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
        unreadCount: 0,
        roleBadge: 'USER',
        isGroup: false,
      };
      setConversations((prev) => [newConv, ...prev]);
      handleSelectContact(newConv);
    }
    setIsNewMessageModalOpen(false);
  };

  const handleCreateGroupChat = async (selectedMembers: GroupMember[], requestedGroupName: string) => {
    const { uid, profileData } = await resolveCurrentUser();
    const myUid = uid || currentUserId || 'me';
    const myName =
      profileData?.full_name ||
      profileData?.name ||
      profileData?.console_handle ||
      userProfile?.full_name ||
      userProfile?.name ||
      'You';
    const myAvatar =
      profileData?.avatar_url || profileData?.avatar || userProfile?.avatar_url || userProfile?.avatar;

    const allMembers: GroupMember[] = [
      {
        id: myUid,
        name: myName,
        avatarUrl: myAvatar,
        role: (profileData?.account_type || 'USER').toUpperCase(),
      },
      ...selectedMembers.filter((m) => m.id.toLowerCase() !== myUid.toLowerCase()),
    ];

    const finalGroupName =
      requestedGroupName.trim() || formatDefaultGroupName(allMembers, [myUid]);
    const groupId = createGroupId();
    const nowIso = new Date().toISOString();

    const newGroupConv: InboxConversation = {
      contactId: groupId,
      groupId,
      groupName: finalGroupName,
      profileName: finalGroupName,
      isGroup: true,
      members: allMembers,
      lastMessage: `${myName.split(' ')[0]} created the group`,
      timestamp: nowIso,
      isRead: true,
      unreadCount: 0,
      unread: 0,
      roleBadge: `GROUP · ${allMembers.length}`,
    };

    setConversations((prev) => [newGroupConv, ...prev]);
    setSelectedContact(newGroupConv);
    setThreadMessages([]);
    setIsNewMessageModalOpen(false);

    await dispatchGroupEnvelope(newGroupConv, {
      text: `${myName.split(' ')[0]} created "${finalGroupName}"`,
      systemAction: 'created',
    });
  };

  // Unified rich + standard message dispatcher (1-on-1 DM and Group Thread)
  const dispatchThreadMessage = async (opts: {
    text: string;
    mediaUrl?: string | null;
    replyTo?: ReplyReference | null;
    audioCard?: AudioCardPayload;
    offerCard?: OfferCardPayload;
  }) => {
    const contact = selectedContactRef.current;
    if (!contact || isSending) return;

    if (!contact.isGroup && blockedContacts[contact.contactId]) {
      setToastMessage('Cannot send message: Contact is blocked.');
      return;
    }

    const trimmed = (opts.text || '').trim();
    const sentMediaUrl = opts.mediaUrl || undefined;
    const replyRef = opts.replyTo || undefined;

    notifyTyping(false);
    setReplyingToMsg(null);
    setIsSending(true);

    try {
      if (contact.isGroup && contact.groupId) {
        await dispatchGroupEnvelope(contact, {
          text: trimmed,
          mediaUrl: sentMediaUrl,
          replyTo: replyRef,
          audioCard: opts.audioCard,
          offerCard: opts.offerCard,
        });
        return;
      }

      const myUid = currentUserId || (await resolveCurrentUser()).uid;
      if (!myUid) {
        console.warn('[InboxTerminal] Send aborted: Missing active user ID');
        return;
      }

      const nowIso = new Date().toISOString();
      const tempId = `temp_${Date.now()}`;
      const isRichPayload = Boolean(replyRef || opts.audioCard || opts.offerCard);
      const previewSummary =
        trimmed ||
        (opts.audioCard
          ? opts.audioCard.kind === 'voice'
            ? '🎤 Voice note'
            : `🎵 Demo: ${opts.audioCard.title}`
          : opts.offerCard
          ? `📋 ${opts.offerCard.title}`
          : sentMediaUrl
          ? 'Sent an attachment'
          : 'Sent a message');

      const optimisticMsg: HydratedThreadMessage = {
        id: tempId,
        sender_id: myUid,
        receiver_id: contact.contactId,
        recipient_id: contact.contactId,
        created_at: nowIso,
        is_read: true,
        textContent: trimmed,
        mediaUrl: sentMediaUrl,
        replyTo: replyRef,
        audioCard: opts.audioCard,
        offerCard: opts.offerCard,
        isSystemEvent: false,
        raw: { id: tempId, sender_id: myUid, created_at: nowIso },
      };

      setThreadMessages((prev) => [...prev, optimisticMsg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.contactId === contact.contactId
            ? {
                ...c,
                lastMessage: previewSummary,
                timestamp: nowIso,
                isRead: true,
                unread: 0,
                unreadCount: 0,
              }
            : c
        )
      );

      const senderDisplayName =
        userProfile?.full_name || userProfile?.name || userProfile?.console_handle || 'Nexus Contact';
      const recipientEmail =
        contact.email || (contact.contactId.includes('@') ? contact.contactId : undefined);

      const encodedRich = isRichPayload
        ? encodeRichMessagePayload({
            v: 1,
            msgId: tempId,
            text: trimmed,
            mediaUrl: sentMediaUrl,
            replyTo: replyRef,
            audioCard: opts.audioCard,
            offerCard: opts.offerCard,
          })
        : null;

      let serverDispatched = false;
      if (contact.contactId && contact.contactId !== myUid) {
        try {
          const accessToken = await getSupabaseAccessToken();
          if (accessToken) {
            const apiRes = await authFetch('/api/social/dm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientId: contact.contactId,
                recipientEmail,
                message: encodedRich || trimmed || 'Sent an attachment',
                mediaUrl: isRichPayload ? undefined : sentMediaUrl,
                previewText: previewSummary,
                senderId: myUid,
                senderName: senderDisplayName,
              }),
            });
            if (apiRes.ok) {
              const apiJson = await apiRes.json().catch(() => null);
              if (apiJson?.message) {
                const hydrated = buildThreadTimeline([apiJson.message], {
                  contactId: contact.contactId,
                  myIds: [myUid, ...myValidUuids],
                })[0];
                if (hydrated) {
                  setThreadMessages((prev) => prev.map((m) => (m.id === tempId ? hydrated : m)));
                }
              }
              serverDispatched = true;
            }
          }
        } catch {}
      }

      if (!serverDispatched) {
        const dbMessageBody =
          encodedRich ||
          (sentMediaUrl
            ? encodeMediaMessagePayload(trimmed, sentMediaUrl)
            : trimmed || 'Sent an attachment');

        const { data, error } = await supabase
          .from('nexus_chats')
          .insert([
            {
              sender_id: myUid,
              receiver_id: contact.contactId,
              recipient_id: contact.contactId,
              message: dbMessageBody,
              content: dbMessageBody,
              is_read: false,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error('[InboxTerminal] Error writing DM to Supabase:', error.message);
        } else if (data) {
          const hydrated = buildThreadTimeline([data], {
            contactId: contact.contactId,
            myIds: [myUid, ...myValidUuids],
          })[0];
          if (hydrated) {
            setThreadMessages((prev) => prev.map((m) => (m.id === tempId ? hydrated : m)));
          }
        }

        if (contact.contactId && contact.contactId !== myUid) {
          const previewBody = previewSummary.substring(0, 120);
          if (isValidUuid(contact.contactId)) {
            try {
              const newNotifId =
                typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `notif_${Date.now()}`;
              await supabase.from('nexus_notifications').insert([
                {
                  id: newNotifId,
                  user_id: contact.contactId,
                  actor_id: isValidUuid(myUid) ? myUid : null,
                  title: '💬 NEW MESSAGE',
                  message: `New message from ${senderDisplayName}: "${previewBody.substring(0, 60)}"`,
                  category: 'CHAT',
                  type: 'chat_message',
                  is_read: false,
                  created_at: new Date().toISOString(),
                },
              ]);
            } catch {}
          }

          pushManager
            .sendPushToServer({
              userId: contact.contactId,
              userEmail: recipientEmail,
              excludeUserId: myUid,
              excludeUserEmail: userProfile?.email,
              title: `💬 Direct Message from ${senderDisplayName}`,
              body: previewBody,
              category: 'direct_messages',
              targetTab: 'messages',
              priority: 'P1',
              tag: `nexus-dm-${myUid}`,
              data: {
                senderId: myUid,
                senderName: senderDisplayName,
              },
            })
            .catch(() => {});
        }
      }

      window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
    } catch (err) {
      console.error('[InboxTerminal] Exception sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Send message inside active 1-on-1 or Group thread
  const handleSendMessage = async () => {
    if (!selectedContact || (!messageText.trim() && !attachmentUrl) || isSending) return;
    const textToSend = messageText.trim();
    const mediaToSend = attachmentUrl;
    const replyRef = replyingToRef.current;

    setMessageText('');
    setAttachmentUrl(null);
    setShowImageInput(false);

    await dispatchThreadMessage({
      text: textToSend,
      mediaUrl: mediaToSend,
      replyTo: replyRef,
    });
  };

  const handleStartReply = (msg: HydratedThreadMessage) => {
    const isSent = myIdentitySet.has(String(msg.sender_id || '').toLowerCase());
    const senderName = isSent
      ? 'You'
      : selectedContact?.isGroup
      ? msg.group?.senderName ||
        selectedContact.members?.find(
          (m) => String(m.id).toLowerCase() === String(msg.sender_id).toLowerCase()
        )?.name ||
        'Member'
      : threadNicknames[selectedContact?.contactId || ''] ||
        selectedContact?.profileName ||
        'Member';

    const excerpt =
      msg.textContent?.trim() ||
      (msg.audioCard
        ? `${msg.audioCard.kind === 'voice' ? 'Voice note' : 'Demo'}: ${msg.audioCard.title}`
        : msg.offerCard
        ? msg.offerCard.title
        : msg.mediaUrl
        ? 'Attachment'
        : 'Message');

    setReplyingToMsg({
      msgId: msg.id,
      senderName,
      excerpt: excerpt.slice(0, 90),
    });
    setTimeout(() => composerInputRef.current?.focus(), 40);
  };

  const handleAcceptOffer = async (card: OfferCardPayload) => {
    const myFirst = myThreadDisplayName.split(' ')[0] || 'Member';
    await dispatchThreadMessage({
      text: '',
      offerCard: {
        id: createClientMsgId(),
        type: 'offer_response',
        targetOfferId: card.id,
        title: card.title,
        guarantee: card.guarantee,
        terms: `Accepted by ${myFirst}`,
        status: 'accepted',
        respondedBy: myThreadDisplayName,
      },
    });
    setToastMessage(`Accepted offer: ${card.title}`);
  };

  const handleCounterOffer = async (
    card: OfferCardPayload,
    counterGuarantee: string,
    note: string
  ) => {
    const myFirst = myThreadDisplayName.split(' ')[0] || 'Member';
    await dispatchThreadMessage({
      text: '',
      offerCard: {
        id: createClientMsgId(),
        type: 'offer_response',
        targetOfferId: card.id,
        title: card.title,
        guarantee: counterGuarantee,
        terms: note || `Counter proposal sent by ${myFirst}`,
        status: 'countered',
        respondedBy: myThreadDisplayName,
      },
    });
    setToastMessage(`Counter offer sent for ${card.title}`);
  };

  const handleViewShowFromCard = (card: OfferCardPayload) => {
    window.dispatchEvent(
      new CustomEvent('nexus_open_show_details', {
        detail: {
          showId: card.showId,
          title: card.title,
          headliner: card.title,
          venue: card.venue,
          date: card.date,
        },
      })
    );
  };

  // Group Management Handlers
  const handleRenameGroup = async (newName: string) => {
    if (!selectedContact?.isGroup) return;
    const updatedGroup: InboxConversation = {
      ...selectedContact,
      groupName: newName,
      profileName: newName,
    };
    setSelectedContact(updatedGroup);
    const actorName = (userProfile?.full_name || userProfile?.name || 'Someone').split(' ')[0];
    await dispatchGroupEnvelope(updatedGroup, {
      text: `${actorName} renamed the group to "${newName}"`,
      systemAction: 'renamed',
    });
    setToastMessage(`Group renamed to "${newName}"`);
  };

  const handleAddGroupMembers = async (addedMembers: GroupMember[]) => {
    if (!selectedContact?.isGroup || addedMembers.length === 0) return;
    const mergedMap = new Map<string, GroupMember>();
    (selectedContact.members || []).forEach((m) => mergedMap.set(m.id.toLowerCase(), m));
    addedMembers.forEach((m) => mergedMap.set(m.id.toLowerCase(), m));
    const mergedMembers = Array.from(mergedMap.values());

    const updatedGroup: InboxConversation = {
      ...selectedContact,
      members: mergedMembers,
      roleBadge: `GROUP · ${mergedMembers.length}`,
    };
    setSelectedContact(updatedGroup);
    const actorName = (userProfile?.full_name || userProfile?.name || 'Someone').split(' ')[0];
    const addedNames = addedMembers.map((m) => m.name.split(' ')[0]).join(', ');
    await dispatchGroupEnvelope(updatedGroup, {
      text: `${actorName} added ${addedNames} to the group`,
      systemAction: 'members_added',
    });
    setToastMessage(`Added ${addedMembers.length} member${addedMembers.length > 1 ? 's' : ''} to group`);
  };

  const handleLeaveGroup = async () => {
    if (!selectedContact?.isGroup || !currentUserId) return;
    const actorName = (userProfile?.full_name || userProfile?.name || 'A member').split(' ')[0];
    const remainingMembers = (selectedContact.members || []).filter(
      (m) => m.id.toLowerCase() !== currentUserId.toLowerCase()
    );
    const updatedGroup: InboxConversation = {
      ...selectedContact,
      members: remainingMembers,
    };
    await dispatchGroupEnvelope(updatedGroup, {
      text: `${actorName} left the group`,
      systemAction: 'member_left',
    });
    setConversations((prev) => prev.filter((c) => c.contactId !== selectedContact.contactId));
    setSelectedContact(null);
    setShowThreadSettings(false);
    setToastMessage('You left the group conversation.');
  };

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

  const handleMarkAllRead = async () => {
    try {
      setConversations((prev) =>
        prev.map((c) => ({ ...c, isRead: true, unread: 0, unreadCount: 0 }))
      );
      window.dispatchEvent(new CustomEvent('nexus_all_read'));
      window.dispatchEvent(new CustomEvent('nexus_chats_updated'));
      await handleMarkAllAsRead(currentUserId || undefined, setConversations as any);
      setToastMessage('All conversations marked as read.');
    } catch (err) {
      console.error('[InboxTerminal] Error marking all as read:', err);
    }
  };

  // Filter & sort conversations (pinned threads first, then newest activity)
  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return conversations
      .filter((chat) => {
        if (!q) return true;
        const nameMatch = (threadNicknames[chat.contactId] || chat.profileName)
          .toLowerCase()
          .includes(q);
        const msgMatch = (chat.lastMessage || '').toLowerCase().includes(q);
        const memberMatch = (chat.members || []).some((m) =>
          (m.name || '').toLowerCase().includes(q)
        );
        return nameMatch || msgMatch || memberMatch;
      })
      .sort((a, b) => {
        const aPinned = pinnedThreads[a.contactId] ? 1 : 0;
        const bPinned = pinnedThreads[b.contactId] ? 1 : 0;
        if (bPinned !== aPinned) return bPinned - aPinned;
        return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
      });
  }, [conversations, searchQuery, threadNicknames, pinnedThreads]);

  // Helper to resolve sender metadata inside group threads
  const getSenderMetaForMessage = useCallback(
    (msg: HydratedThreadMessage) => {
      const senderIdLower = String(msg.sender_id || '').toLowerCase();
      const memberMatch = selectedContact?.members?.find(
        (m) => String(m.id || '').toLowerCase() === senderIdLower
      );
      return {
        name: msg.group?.senderName || memberMatch?.name || 'Member',
        avatar: msg.group?.senderAvatar || memberMatch?.avatarUrl,
      };
    },
    [selectedContact?.members]
  );

  const myIdentitySet = useMemo(
    () =>
      new Set(
        [currentUserId, ...myValidUuids, userProfile?.id, userProfile?.email]
          .filter(Boolean)
          .map((id) => String(id).toLowerCase())
      ),
    [currentUserId, myValidUuids, userProfile?.id, userProfile?.email]
  );

  return (
    <div className="w-full flex-1 min-h-0 bg-[#07080b] text-white flex flex-col lg:flex-row rounded-none sm:rounded-xl border-x-0 sm:border border-white/[0.07] overflow-hidden shadow-2xl relative font-sans">
      {/* Subtle Toast */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-[220] bg-[#141720] border border-white/[0.12] text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PANE 1: CONVERSATIONS SIDEBAR (Full-screen on mobile when no selection, persistent sidebar on desktop) */}
      <div
        className={`w-full lg:w-[360px] xl:w-[390px] flex-1 lg:flex-none min-h-0 border-r border-white/[0.07] bg-[#0c0e13] flex-col shrink-0 ${
          selectedContact ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.07] bg-[#090b0f] flex flex-col gap-3 shrink-0 inbox-laser-scanline">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-11 h-11 -ml-2 flex items-center justify-center rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-white truncate">Messages</h2>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsNewMessageModalOpen(true)}
                className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
                title="New Message or Group"
              >
                <SquarePen className="w-4 h-4" />
                <span className="hidden sm:inline">Compose</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSceneNoteShuffleSeed(Math.random());
                  fetchInboxConversations();
                  fetchRealProfilesForStories();
                }}
                disabled={refreshing}
                className="w-11 h-11 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                title="Sync Conversations"
                aria-label="Sync conversations"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="w-11 h-11 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                title="Inbox Preferences"
                aria-label="Inbox preferences"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search messages or group members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141720] border border-white/[0.07] rounded-xl py-2.5 pl-10 pr-8 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-zinc-500 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Thoughts / Scene Notes Strip */}
        <div className="w-full border-b border-white/[0.07] bg-[#0a0c10] shrink-0 pt-2.5 pb-2 px-3">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[11px] font-medium text-zinc-400">Active scene notes</span>
            <span className="text-[11px] text-zinc-500 tabular-nums">
              {availableRecipientProfiles.length} active
            </span>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pt-11 pb-1.5 px-1">
            {/* User's Own Note */}
            <div
              className="flex flex-col items-center gap-1 shrink-0 relative cursor-pointer group"
              onClick={() => {
                if (myNote) {
                  setExpandedThought({
                    id: currentUserId || undefined,
                    name:
                      userProfile?.name ||
                      userProfile?.full_name ||
                      userProfile?.console_handle ||
                      'You',
                    handle: userProfile?.console_handle ? `@${userProfile.console_handle}` : undefined,
                    avatar: userProfile?.avatar || userProfile?.avatar_url || '',
                    note: myNote,
                    roleBadge: userProfile?.account_type || userProfile?.role || 'USER',
                    isMine: true,
                  });
                } else {
                  setIsAddingNote(true);
                }
              }}
            >
              {myNote && (
                <div
                  className="absolute -top-[44px] left-1/2 -translate-x-1/2 w-[66px] h-[42px] bg-[#181c26] text-zinc-100 border border-white/[0.14] rounded-xl z-20 shadow-lg p-1.5 flex items-center justify-center text-center"
                  title={myNote}
                >
                  <span className="text-[9px] font-medium leading-tight line-clamp-2 break-words w-full">
                    {myNote}
                  </span>
                </div>
              )}
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-full bg-zinc-900 border-2 flex items-center justify-center overflow-hidden ${
                    myNote
                      ? isMyNoteFresh
                        ? 'border-rose-500 scene-note-flash-ring'
                        : 'border-rose-500'
                      : 'border-white/[0.12] group-hover:border-zinc-500'
                  }`}
                >
                  {userProfile?.avatar || userProfile?.avatar_url ? (
                    <img
                      src={userProfile?.avatar || userProfile?.avatar_url}
                      alt="You"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-zinc-300">
                      {userProfile?.name?.substring(0, 2).toUpperCase() || 'YOU'}
                    </span>
                  )}
                </div>
                {!myNote && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-rose-600 border-2 border-[#0a0c10] rounded-full flex items-center justify-center text-white">
                    <Plus className="w-3 h-3" />
                  </div>
                )}
              </div>
              <span className="text-[11px] text-zinc-400 max-w-[64px] truncate">
                {myNote ? 'Your note' : 'Add note'}
              </span>
            </div>

            {orderedSceneNotes.map((story, sIdx) => {
                const storyKey = String(story.id || story.profileName || sIdx);
                const showFlashRing = Boolean(story.hasRealUpdate && !viewedStoryIds[storyKey]);
                return (
                <div
                  key={`signal-${sIdx}-${story.id || ''}-${story.profileName || ''}`}
                  onClick={() => {
                    if (story.hasRealUpdate) {
                      setViewedStoryIds((prev) =>
                        prev[storyKey] ? prev : { ...prev, [storyKey]: true }
                      );
                    }
                    if (story.note || story.song) {
                      setExpandedThought({
                        id: story.id,
                        name: story.profileName,
                        handle: story.handle,
                        avatar: story.avatarUrl,
                        note: story.note || 'Active on Nexus.',
                        song: story.song,
                        roleBadge: story.accountType,
                        rawProfile: story.rawProfile,
                        isMine: false,
                      });
                    } else {
                      const existing = conversations.find(
                        (c) => !c.isGroup && c.contactId === story.id
                      );
                      if (existing) {
                        handleSelectContact(existing);
                      } else {
                        const newConv: InboxConversation = {
                          contactId: story.id || `conv_${Date.now()}_${sIdx}`,
                          profileName: story.profileName,
                          avatarUrl: story.avatarUrl,
                          lastMessage: '',
                          timestamp: new Date().toISOString(),
                          isRead: true,
                          unreadCount: 0,
                          roleBadge: story.accountType,
                        };
                        setConversations((prev) => [newConv, ...prev]);
                        handleSelectContact(newConv);
                      }
                    }
                  }}
                  className="flex flex-col items-center gap-1 shrink-0 relative cursor-pointer group"
                >
                  {story.note && (
                    <div
                      className="absolute -top-[44px] left-1/2 -translate-x-1/2 w-[66px] h-[42px] bg-[#181c26] text-zinc-100 rounded-xl z-20 shadow-md p-1.5 flex items-center justify-center text-center border border-white/[0.12] group-hover:border-white/[0.25] transition-colors"
                      title={story.note}
                    >
                      <span className="text-[9px] font-medium leading-tight line-clamp-2 break-words w-full text-zinc-200">
                        {story.note}
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border-2 transition-colors ${
                        showFlashRing
                          ? 'border-rose-500 scene-note-flash-ring'
                          : story.hasRealUpdate
                          ? 'border-rose-500/80'
                          : 'border-white/[0.1] group-hover:border-zinc-500'
                      }`}
                    >
                      {story.avatarUrl ? (
                        <img
                          src={story.avatarUrl}
                          alt={story.profileName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-zinc-300">
                          {(story.profileName || 'NC')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    {story.song && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 bg-[#0c0e13] border border-white/[0.15] rounded-full p-1 shadow"
                        title={story.song}
                      >
                        <Music className="w-2.5 h-2.5 text-rose-400" />
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] text-zinc-400 truncate max-w-[64px] group-hover:text-zinc-200 transition-colors">
                    {story.profileName?.split(' ')[0] || 'Member'}
                  </span>
                </div>
                );
              })}
          </div>
        </div>

        {/* Conversations Scroll List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1 no-scrollbar">
          {loading && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-zinc-500 gap-2.5">
              <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
              <span className="text-xs font-medium text-zinc-400">Syncing conversations…</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-zinc-500 gap-3 px-6">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-zinc-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">No conversations yet</p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Start a 1-on-1 message or pick multiple contacts to create a private group thread.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMessageModalOpen(true)}
                className="px-4 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2"
              >
                <SquarePen className="w-3.5 h-3.5" />
                <span>Start a Message or Group</span>
              </button>
            </div>
          ) : (
            filteredConversations.map((chat, cIdx) => {
              const displayName = threadNicknames[chat.contactId] || chat.profileName;
              const unreadCount =
                typeof chat.unreadCount === 'number'
                  ? chat.unreadCount
                  : typeof chat.unread === 'number'
                  ? chat.unread
                  : chat.isRead
                  ? 0
                  : 1;

              return (
                <InboxConversationRow
                  key={chat.contactId ? `chat-${chat.contactId}-${cIdx}` : `chat-${cIdx}`}
                  chat={chat}
                  displayName={displayName}
                  theme={getThreadTheme(threadThemes[chat.contactId])}
                  isSelected={selectedContact?.contactId === chat.contactId}
                  isMuted={mutedThreads[chat.contactId]}
                  isPinned={pinnedThreads[chat.contactId]}
                  isBlocked={blockedContacts[chat.contactId]}
                  unreadCount={unreadCount}
                  onSelect={() => handleSelectContact(chat)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* PANE 2: ACTIVE THREAD (Full-screen on mobile when selected, right pane on desktop) */}
      <div
        className={`w-full flex-1 min-h-0 bg-[#07080b] flex-col ${
          selectedContact ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {!selectedContact ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Your Messages &amp; Group Threads
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
              Select a conversation from the left, or start a private group chat with any number of scene contacts.
            </p>
            <button
              type="button"
              onClick={() => setIsNewMessageModalOpen(true)}
              className="mt-5 px-5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <SquarePen className="w-4 h-4" />
              <span>New Message or Group</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Pinned Conversation Header */}
            <div
              className="px-3 sm:px-4 py-2.5 border-b border-white/[0.07] bg-[#090b0f] flex items-center justify-between shrink-0 z-10 gap-2 inbox-laser-scanline"
              style={activeThreadTheme.headerAccentStyle}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="lg:hidden min-w-[44px] min-h-[44px] -ml-1.5 rounded-xl hover:bg-white/[0.06] text-zinc-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  title="Back to Conversations"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {selectedContact.isGroup ? (
                  <GroupStackedAvatar
                    members={selectedContact.members}
                    fallbackName={selectedContact.profileName}
                  />
                ) : (
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center font-semibold text-xs text-zinc-200 overflow-hidden">
                      {selectedContact.avatarUrl ? (
                        <img
                          src={selectedContact.avatarUrl}
                          alt={selectedContact.profileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedContact.profileName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full border-2 border-[#090b0f] absolute bottom-0 right-0 ${
                        blockedContacts[selectedContact.contactId]
                          ? 'bg-rose-500'
                          : selectedPresence.formatted.dotClass
                      }`}
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-sm font-bold text-white tracking-tight truncate">
                      {threadNicknames[selectedContact.contactId] || selectedContact.profileName}
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {selectedContact.isGroup ? (
                      <span className="tabular-nums">
                        {Math.max(2, selectedContact.members?.length || 2)} members ·{' '}
                        {(selectedContact.members || [])
                          .slice(0, 4)
                          .map((m) => m.name.split(' ')[0])
                          .join(', ')}
                        {(selectedContact.members?.length || 0) > 4
                          ? ` +${(selectedContact.members?.length || 0) - 4}`
                          : ''}
                      </span>
                    ) : (
                      <>
                        {selectedContact.roleBadge ? `${selectedContact.roleBadge} · ` : ''}
                        <span
                          className={
                            selectedPresence.formatted.isOnline
                              ? 'text-emerald-400 font-medium'
                              : selectedPresence.formatted.isRecentlyActive
                              ? 'text-amber-400'
                              : 'text-zinc-400'
                          }
                        >
                          {selectedPresence.formatted.text}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {selectedContact.isGroup && (
                  <button
                    type="button"
                    onClick={() => setShowThreadSettings(true)}
                    className="min-h-[44px] px-3 rounded-xl hover:bg-white/[0.06] text-zinc-300 hover:text-white transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer text-xs font-medium"
                    title="Manage Members"
                  >
                    <UserPlus className={`w-4 h-4 ${activeThreadTheme.accentIconClass}`} />
                    <span>Members</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowThemePicker((v) => !v)}
                  className={`w-11 h-11 rounded-xl transition-colors flex items-center justify-center cursor-pointer relative ${
                    showThemePicker
                      ? 'bg-white/[0.1] text-white'
                      : 'hover:bg-white/[0.06] text-zinc-400 hover:text-white'
                  }`}
                  title={`Thread Theme: ${activeThreadTheme.name}`}
                  aria-label="Customize thread theme and color"
                >
                  <Palette className={`w-4 h-4 ${activeThreadTheme.accentIconClass}`} />
                  <span
                    className="w-2 h-2 rounded-full absolute bottom-2 right-2 border border-[#090b0f]"
                    style={{ background: activeThreadTheme.swatchGradient }}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowThreadSearch((v) => !v)}
                  className={`w-11 h-11 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                    showThreadSearch
                      ? 'bg-white/[0.1] text-white'
                      : 'hover:bg-white/[0.06] text-zinc-400 hover:text-white'
                  }`}
                  title="Search Conversation & Links"
                  aria-label="Search conversation and links"
                >
                  <Search className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => fetchThreadMessages(selectedContact)}
                  disabled={threadLoading}
                  className="w-11 h-11 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                  title="Refresh Thread"
                  aria-label="Refresh thread"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      threadLoading ? `animate-spin ${activeThreadTheme.accentIconClass}` : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowThreadSettings(true)}
                  className="w-11 h-11 rounded-xl hover:bg-white/[0.06] text-zinc-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                  title="Thread Details"
                  aria-label="Thread details"
                >
                  <Info className={`w-4 h-4 ${activeThreadTheme.accentIconClass}`} />
                </button>
              </div>
            </div>

            {/* Collapsible Per-Thread Theme & Color Picker Drawer */}
            {showThemePicker && (
              <div className="px-3 sm:px-4 py-2.5 bg-[#0c0e13] border-b border-white/[0.07] shrink-0 z-10">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Palette className={`w-3.5 h-3.5 shrink-0 ${activeThreadTheme.accentIconClass}`} />
                    <span className="text-xs font-semibold text-white">Thread Theme &amp; Color</span>
                    <span className="text-[11px] text-zinc-400 truncate hidden sm:inline">
                      — {activeThreadTheme.name} ({activeThreadTheme.vibe})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowThemePicker(false)}
                    className="w-7 h-7 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                    aria-label="Close theme picker"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {THREAD_THEMES.map((theme) => {
                    const isSelected = activeThreadTheme.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleSetThreadTheme(selectedContact.contactId, theme.id)}
                        className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                          isSelected
                            ? 'bg-white/[0.1] border-white/30 text-white shadow-sm'
                            : 'bg-[#141720] hover:bg-white/[0.05] border-white/[0.07] text-zinc-300'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center border border-white/25 shrink-0"
                          style={{ background: theme.swatchGradient }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white drop-shadow" />}
                        </span>
                        <div className="text-left">
                          <p className="text-[11px] font-semibold leading-tight text-white">
                            {theme.name}
                          </p>
                          <p className="text-[9px] text-zinc-400 leading-tight">{theme.vibe}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Collapsible In-Thread Search & Shared Links Drawer */}
            {showThreadSearch && (
              <div className="px-3 sm:px-4 py-2.5 bg-[#0c0e13] border-b border-white/[0.07] space-y-2 shrink-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#141720] border border-white/[0.08] rounded-xl p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setThreadSearchTab('messages')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        threadSearchTab === 'messages'
                          ? 'bg-rose-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Messages
                    </button>
                    <button
                      type="button"
                      onClick={() => setThreadSearchTab('links')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        threadSearchTab === 'links'
                          ? 'bg-rose-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>Links ({sharedThreadLinks.length})</span>
                    </button>
                  </div>

                  {threadSearchTab === 'messages' && (
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          value={threadSearchQuery}
                          onChange={(e) => {
                            setThreadSearchQuery(e.target.value);
                            setActiveMatchIdx(0);
                          }}
                          placeholder="Search inside thread..."
                          autoFocus
                          className={`w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none ${activeThreadTheme.composerFocusClass}`}
                        />
                      </div>

                      {threadSearchQuery.trim() && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] text-zinc-400 tabular-nums px-1">
                            {matchedThreadMsgIds.length > 0
                              ? `${activeMatchIdx + 1}/${matchedThreadMsgIds.length}`
                              : '0/0'}
                          </span>
                          <button
                            type="button"
                            disabled={matchedThreadMsgIds.length === 0}
                            onClick={() => {
                              if (matchedThreadMsgIds.length === 0) return;
                              const nextIdx =
                                (activeMatchIdx - 1 + matchedThreadMsgIds.length) %
                                matchedThreadMsgIds.length;
                              setActiveMatchIdx(nextIdx);
                              scrollToMessage(matchedThreadMsgIds[nextIdx]);
                            }}
                            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 text-zinc-200 flex items-center justify-center cursor-pointer"
                            aria-label="Previous match"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={matchedThreadMsgIds.length === 0}
                            onClick={() => {
                              if (matchedThreadMsgIds.length === 0) return;
                              const nextIdx = (activeMatchIdx + 1) % matchedThreadMsgIds.length;
                              setActiveMatchIdx(nextIdx);
                              scrollToMessage(matchedThreadMsgIds[nextIdx]);
                            }}
                            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 text-zinc-200 flex items-center justify-center cursor-pointer"
                            aria-label="Next match"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowThreadSearch(false);
                      setThreadSearchQuery('');
                    }}
                    className="w-9 h-9 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                    aria-label="Close thread search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {threadSearchTab === 'links' && (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                    {sharedThreadLinks.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-2">No links shared in this thread yet.</p>
                    ) : (
                      sharedThreadLinks.map((lnk, lIdx) => (
                        <div
                          key={`${lnk.msgId}-${lIdx}`}
                          className="flex items-center justify-between gap-2 bg-[#141720] border border-white/[0.07] rounded-xl px-3 py-2"
                        >
                          <a
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs hover:underline truncate flex-1 ${activeThreadTheme.accentIconClass}`}
                          >
                            {lnk.url}
                          </a>
                          <button
                            type="button"
                            onClick={() => scrollToMessage(lnk.msgId)}
                            className="text-[11px] font-medium text-zinc-300 hover:text-white px-2 py-1 rounded-lg bg-white/[0.05] cursor-pointer shrink-0"
                          >
                            Jump
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Thread Messages Container */}
            <div
              className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-5 py-4 space-y-1.5 no-scrollbar bg-[#07080b] transition-colors duration-300"
              style={activeThreadTheme.canvasAtmosphereStyle}
            >
              {threadLoading && threadMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2.5">
                  <RefreshCw className={`w-5 h-5 animate-spin ${activeThreadTheme.accentIconClass}`} />
                  <span className="text-xs font-medium text-zinc-400">Loading messages…</span>
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 gap-2 py-12">
                  <MessageSquare className="w-9 h-9 text-zinc-700" />
                  <span className="text-sm font-semibold text-zinc-300">
                    {selectedContact.isGroup ? 'Group thread ready' : 'Start the conversation'}
                  </span>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    {selectedContact.isGroup
                      ? `Messages sent here go to all ${selectedContact.members?.length || 2} group members.`
                      : `Send a message below to connect with ${selectedContact.profileName}.`}
                  </p>
                </div>
              ) : (
                threadMessages.map((msg, idx) => {
                  if (msg.isSystemEvent) {
                    return (
                      <div
                        key={msg.id || `sys-${idx}`}
                        className="py-2 flex items-center justify-center"
                      >
                        <span className="text-[11px] text-zinc-500 bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full">
                          {msg.textContent}
                        </span>
                      </div>
                    );
                  }

                  const isSentByMe = myIdentitySet.has(String(msg.sender_id || '').toLowerCase());
                  const prevMsg = idx > 0 ? threadMessages[idx - 1] : null;
                  const sameSenderAsPrev =
                    prevMsg &&
                    !prevMsg.isSystemEvent &&
                    String(prevMsg.sender_id).toLowerCase() === String(msg.sender_id).toLowerCase();

                  const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  const msgKey = msg.id || `msg-${idx}`;
                  const reactions = messageReactions[msgKey] || [];
                  const textContent = msg.textContent || '';
                  const isSetTime = textContent.includes('🎸 SET TIME CONFIRMATION');

                  const senderMeta =
                    selectedContact.isGroup && !isSentByMe
                      ? getSenderMetaForMessage(msg)
                      : null;

                  const swipeOffset = swipeState?.msgId === msgKey ? swipeState.offsetX : 0;
                  const isHighlighted = highlightedMsgId === msgKey;
                  const activeSearchMatch =
                    threadSearchQuery.trim() &&
                    matchedThreadMsgIds[activeMatchIdx] === msgKey;

                  // Resolve member avatars who have read up to this specific message
                  const liveReaders = Object.values(memberReadMap).filter(
                    (r) => r.lastReadMsgId === msgKey
                  );
                  const showDmFallbackAvatar =
                    !selectedContact.isGroup &&
                    isSentByMe &&
                    msg.is_read &&
                    msgKey === latestNonTempMsgId &&
                    liveReaders.length === 0;

                  return (
                    <div
                      key={msg.id ? `msg-${msg.id}-${idx}` : `msg-${idx}`}
                      ref={(el) => {
                        msgRefsMap.current[msgKey] = el;
                      }}
                      className={`flex flex-col group/msg relative rounded-xl transition-colors duration-300 ${
                        sameSenderAsPrev ? 'pt-0.5' : 'pt-3'
                      } ${isSentByMe ? 'items-end' : 'items-start'} ${
                        isHighlighted || activeSearchMatch
                          ? 'bg-white/[0.06] ring-1 ring-white/25 px-1.5 -mx-1.5'
                          : ''
                      }`}
                    >
                      {/* Sender Name Label in Group Chats */}
                      {selectedContact.isGroup && !isSentByMe && !sameSenderAsPrev && senderMeta && (
                        <span className="text-[11px] font-medium text-zinc-400 mb-1 ml-9">
                          {senderMeta.name}
                        </span>
                      )}

                      <div
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          if (!touch) return;
                          swipeStartRef.current = {
                            msgId: msgKey,
                            startX: touch.clientX,
                            startY: touch.clientY,
                            isHorizontal: null,
                          };
                        }}
                        onTouchMove={(e) => {
                          const st = swipeStartRef.current;
                          if (!st || st.msgId !== msgKey) return;
                          const touch = e.touches[0];
                          if (!touch) return;
                          const dx = touch.clientX - st.startX;
                          const dy = touch.clientY - st.startY;
                          if (st.isHorizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                            st.isHorizontal = Math.abs(dx) > Math.abs(dy);
                          }
                          if (!st.isHorizontal) return;
                          const clamped = Math.max(-52, Math.min(52, dx));
                          setSwipeState({ msgId: msgKey, offsetX: clamped });
                        }}
                        onTouchEnd={() => {
                          if (swipeState?.msgId === msgKey && Math.abs(swipeState.offsetX) >= 36) {
                            handleStartReply(msg);
                          }
                          swipeStartRef.current = null;
                          setSwipeState(null);
                        }}
                        style={
                          swipeOffset !== 0
                            ? { transform: `translateX(${swipeOffset}px)` }
                            : undefined
                        }
                        className={`flex items-end gap-2 max-w-[88%] sm:max-w-[74%] transition-transform duration-150 ${
                          isSentByMe ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {/* Sender Avatar in Group Chats */}
                        {selectedContact.isGroup && !isSentByMe && (
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/[0.08] overflow-hidden flex items-center justify-center text-[10px] font-semibold text-zinc-300 shrink-0">
                            {!sameSenderAsPrev ? (
                              senderMeta?.avatar ? (
                                <img
                                  src={senderMeta.avatar}
                                  alt={senderMeta.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                (senderMeta?.name || 'M').slice(0, 2).toUpperCase()
                              )
                            ) : (
                              <span className="sr-only" />
                            )}
                          </div>
                        )}

                        <div className="relative">
                          {/* Hover Reaction & Reply Picker */}
                          <div
                            className={`absolute -top-7 ${
                              isSentByMe ? 'right-0' : 'left-0'
                            } opacity-0 group-hover/msg:opacity-100 transition-opacity bg-[#141720] border border-white/[0.1] rounded-full px-2 py-0.5 flex items-center gap-1 shadow-xl z-20`}
                          >
                            {['🤘', '🔥', '💀', '⚡', '🖤'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleMessageReaction(msgKey, emoji)}
                                className="text-xs hover:scale-125 transition-transform cursor-pointer p-0.5"
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                            <span className="w-px h-3.5 bg-white/[0.1] mx-0.5" />
                            <button
                              type="button"
                              onClick={() => handleStartReply(msg)}
                              className="p-0.5 text-zinc-300 hover:text-white cursor-pointer"
                              title="Reply to message"
                              aria-label="Reply to message"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div
                            className={`px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                              isSentByMe
                                ? activeThreadTheme.sentBubbleClass
                                : 'bg-[#141720] border border-white/[0.07] text-zinc-100 rounded-2xl rounded-bl-sm'
                            }`}
                            style={isSentByMe ? activeThreadTheme.sentBubbleStyle : undefined}
                          >
                            {/* Quoted Reply Header */}
                            {msg.replyTo && (
                              <button
                                type="button"
                                onClick={() => scrollToMessage(msg.replyTo!.msgId)}
                                className={`w-full text-left mb-2 px-2.5 py-1.5 rounded-lg bg-black/35 border transition-colors cursor-pointer block ${activeThreadTheme.replyBorderClass}`}
                              >
                                <p className={`text-[10px] font-semibold truncate ${activeThreadTheme.replyLabelClass}`}>
                                  Replying to {msg.replyTo.senderName}
                                </p>
                                <p className="text-[11px] text-zinc-400 truncate">
                                  {msg.replyTo.excerpt}
                                </p>
                              </button>
                            )}

                            {/* Inline Audio Waveform Card (Demo or Voice Note) */}
                            {msg.audioCard && (
                              <div className="mb-1.5">
                                <InlineAudioWaveformCard
                                  card={msg.audioCard}
                                  isSentByMe={isSentByMe}
                                />
                              </div>
                            )}

                            {/* Interactive Tour Booking Offer / Show Card */}
                            {msg.offerCard && (
                              <div className="mb-1.5">
                                <TourOfferCard
                                  card={msg.offerCard}
                                  resolvedStatus={offerStatusMap[msg.offerCard.id]}
                                  isSentByMe={isSentByMe}
                                  onAcceptOffer={handleAcceptOffer}
                                  onCounterOffer={handleCounterOffer}
                                  onViewShow={handleViewShowFromCard}
                                />
                              </div>
                            )}

                            {!msg.audioCard && !msg.offerCard && isSetTime ? (
                              <div
                                className={`mb-1.5 p-2.5 rounded-xl bg-black/40 border flex flex-col gap-1 ${activeThreadTheme.replyBorderClass}`}
                              >
                                <div
                                  className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${activeThreadTheme.replyLabelClass}`}
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Confirmed Set Schedule</span>
                                </div>
                                <p className="whitespace-pre-wrap break-words font-medium text-zinc-100 mt-0.5">
                                  {textContent}
                                </p>
                              </div>
                            ) : textContent ? (
                              <p className="whitespace-pre-wrap break-words">
                                {(() => {
                                  const q = threadSearchQuery.trim();
                                  if (!q) return textContent;
                                  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                  const parts = textContent.split(new RegExp(`(${escaped})`, 'gi'));
                                  return parts.map((part, pIdx) =>
                                    part.toLowerCase() === q.toLowerCase() ? (
                                      <mark
                                        key={pIdx}
                                        className="bg-white/25 text-white rounded px-0.5"
                                      >
                                        {part}
                                      </mark>
                                    ) : (
                                      <React.Fragment key={pIdx}>{part}</React.Fragment>
                                    )
                                  );
                                })()}
                              </p>
                            ) : null}

                            {msg.mediaUrl && (
                              <div className="mt-2 rounded-xl overflow-hidden border border-white/[0.08] bg-black">
                                <img
                                  src={msg.mediaUrl}
                                  alt="Attachment"
                                  className="max-h-60 w-auto object-contain"
                                />
                              </div>
                            )}

                            {reactions.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                {reactions.map((emoji, eIdx) => (
                                  <span
                                    key={eIdx}
                                    className="text-[11px] bg-black/40 border border-white/[0.1] rounded-full px-2 py-0.5 text-zinc-200"
                                  >
                                    {emoji}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div
                              className={`flex items-center gap-1 mt-1 text-[10px] tabular-nums ${
                                isSentByMe
                                  ? `${activeThreadTheme.sentMetaTextClass} justify-end`
                                  : 'text-zinc-500 justify-start'
                              }`}
                            >
                              <span>{timeStr}</span>
                              {isSentByMe &&
                                (msg.is_read ? (
                                  <CheckCheck className={`w-3.5 h-3.5 ${activeThreadTheme.sentCheckClass}`} />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-zinc-400" />
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tiny Group / DM Read Avatars underneath message */}
                      {(liveReaders.length > 0 || showDmFallbackAvatar) && (
                        <div
                          className={`flex items-center -space-x-1 mt-1 ${
                            isSentByMe ? 'pr-1' : selectedContact.isGroup ? 'pl-9' : 'pl-1'
                          }`}
                          title={
                            liveReaders.length > 0
                              ? `Seen by ${liveReaders.map((r) => r.name).join(', ')}`
                              : `Seen by ${selectedContact.profileName}`
                          }
                        >
                          {liveReaders.slice(0, 5).map((reader) => (
                            <div
                              key={reader.userId}
                              className="w-4 h-4 rounded-full bg-zinc-800 border border-[#07080b] overflow-hidden flex items-center justify-center text-[8px] font-bold text-zinc-200"
                            >
                              {reader.avatarUrl ? (
                                <img
                                  src={reader.avatarUrl}
                                  alt={reader.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                reader.name.slice(0, 1).toUpperCase()
                              )}
                            </div>
                          ))}
                          {showDmFallbackAvatar && (
                            <div className="w-4 h-4 rounded-full bg-zinc-800 border border-[#07080b] overflow-hidden flex items-center justify-center text-[8px] font-bold text-zinc-200">
                              {selectedContact.avatarUrl ? (
                                <img
                                  src={selectedContact.avatarUrl}
                                  alt={selectedContact.profileName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                selectedContact.profileName.slice(0, 1).toUpperCase()
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {isSending && (
                <div className="flex justify-end pt-1">
                  <span className="text-[11px] text-zinc-500">Sending…</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Live Typing Indicator Strip */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-1.5 bg-[#090b0f] border-t border-white/[0.05] flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${activeThreadTheme.typingDotClass}`} />
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${activeThreadTheme.typingDotClass}`}
                    style={{ animationDelay: '120ms' }}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${activeThreadTheme.typingDotClass}`}
                    style={{ animationDelay: '240ms' }}
                  />
                </span>
                <span className="text-[11px] text-zinc-400">
                  {typingUsers.length === 1
                    ? `${typingUsers[0].name.split(' ')[0]} is typing...`
                    : typingUsers.length === 2
                    ? `${typingUsers[0].name.split(' ')[0]} and ${typingUsers[1].name.split(' ')[0]} are typing...`
                    : `${typingUsers[0].name.split(' ')[0]} and ${typingUsers.length - 1} others are typing...`}
                </span>
              </div>
            )}

            {/* Replying-To Quote Preview Banner */}
            {replyingToMsg && (
              <div className="px-4 py-2 bg-[#0c0e13] border-t border-white/[0.07] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Reply className={`w-3.5 h-3.5 shrink-0 ${activeThreadTheme.accentIconClass}`} />
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold truncate ${activeThreadTheme.replyLabelClass}`}>
                      Replying to {replyingToMsg.senderName}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{replyingToMsg.excerpt}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingToMsg(null)}
                  className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Cancel reply"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Attachment Preview */}
            {attachmentUrl && (
              <div className="px-4 py-2 bg-[#0c0e13] border-t border-white/[0.07] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className={`w-4 h-4 ${activeThreadTheme.accentIconClass}`} />
                  <span className="text-xs text-zinc-300">Attachment ready</span>
                  <img
                    src={attachmentUrl}
                    alt="Preview"
                    className="w-9 h-9 rounded-lg object-cover border border-white/[0.1]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentUrl(null)}
                  className="p-2 text-zinc-400 hover:text-white cursor-pointer"
                  aria-label="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Image URL Drawer */}
            {showImageInput && (
              <div className="px-4 py-2 bg-[#0c0e13] border-t border-white/[0.07] flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className={`flex-1 bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none ${activeThreadTheme.composerFocusClass}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customImageUrl.trim()) {
                      setAttachmentUrl(customImageUrl.trim());
                      setCustomImageUrl('');
                      setShowImageInput(false);
                    }
                  }}
                  className={`px-3.5 min-h-[36px] text-xs rounded-xl font-semibold cursor-pointer ${activeThreadTheme.sendButtonClass}`}
                >
                  Attach
                </button>
                <button
                  type="button"
                  onClick={() => setShowImageInput(false)}
                  className="p-2 text-zinc-400 hover:text-white cursor-pointer"
                  aria-label="Close image URL input"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Scene Action Templates & Interactive Signal Triggers */}
            {!blockedContacts[selectedContact.contactId] && (
              <div className="px-3 pt-2 pb-1.5 bg-[#090b0f] border-t border-white/[0.07] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[11px] font-medium text-zinc-500 shrink-0 mr-1">
                  Quick:
                </span>
                <button
                  type="button"
                  onClick={() => setSignalComposerMode('offer')}
                  className="px-3 min-h-[34px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  📋 Tour Offer
                </button>
                <button
                  type="button"
                  onClick={() => setSignalComposerMode('demo')}
                  className="px-3 min-h-[34px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  🎵 Song Demo
                </button>
                <button
                  type="button"
                  onClick={() => setSignalComposerMode('voice')}
                  className="px-3 min-h-[34px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  🎤 Voice Note
                </button>
                <button
                  type="button"
                  onClick={() => setSignalComposerMode('show')}
                  className="px-3 min-h-[34px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  🎟 Share Show
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMessageText(
                      '🎸 SET TIME CONFIRMATION: Confirming 8:30 PM load-in and 9:30 PM set time.'
                    )
                  }
                  className="px-3 min-h-[34px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  🎸 Set Time
                </button>
                <button
                  type="button"
                  onClick={() => setMessageText('🤘 Heavy horns! Shredding set as always!')}
                  className="px-3 min-h-[34px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  🤘 Heavy Horns
                </button>
              </div>
            )}

            {/* Composer Input Bar */}
            <div className="px-3 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/[0.07] bg-[#090b0f] flex items-center gap-2 shrink-0 z-10">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="sr-only"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-xl bg-[#141720] hover:bg-white/[0.08] border border-white/[0.07] text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer shrink-0"
                title="Attach Image File"
                aria-label="Attach image file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="w-11 h-11 rounded-xl bg-[#141720] hover:bg-white/[0.08] border border-white/[0.07] text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer shrink-0 hidden sm:flex"
                title="Attach Image URL"
                aria-label="Attach image URL"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSignalComposerMode('voice')}
                className="w-11 h-11 rounded-xl bg-[#141720] hover:bg-white/[0.08] border border-white/[0.07] text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer shrink-0"
                title="Record Voice Note"
                aria-label="Record voice note"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                ref={composerInputRef}
                type="text"
                placeholder={
                  blockedContacts[selectedContact.contactId]
                    ? 'Contact blocked…'
                    : `Message ${
                        threadNicknames[selectedContact.contactId] || selectedContact.profileName
                      }…`
                }
                value={messageText}
                disabled={blockedContacts[selectedContact.contactId]}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setMessageText(nextVal);
                  notifyTyping(Boolean(nextVal.trim()));
                }}
                onBlur={() => notifyTyping(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className={`flex-1 min-h-[44px] bg-[#141720] border border-white/[0.08] rounded-xl px-4 text-xs sm:text-[13px] text-white placeholder:text-zinc-500 focus:outline-none ${activeThreadTheme.composerFocusClass} transition-colors disabled:opacity-50`}
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={
                  (!messageText.trim() && !attachmentUrl) ||
                  isSending ||
                  blockedContacts[selectedContact.contactId]
                }
                className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                  (messageText.trim() || attachmentUrl) &&
                  !isSending &&
                  !blockedContacts[selectedContact.contactId]
                    ? activeThreadTheme.sendButtonClass
                    : 'bg-white/[0.06] text-zinc-600 cursor-not-allowed'
                }`}
                title="Send Message"
                aria-label="Send message"
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

      {/* Per-Thread & Group Management Modal */}
      <InboxThreadDetailsModal
        isOpen={showThreadSettings}
        onClose={() => setShowThreadSettings(false)}
        conversation={selectedContact}
        currentUserId={currentUserId}
        presenceFormatted={selectedPresence.formatted}
        nickname={selectedContact ? threadNicknames[selectedContact.contactId] || '' : ''}
        onNicknameChange={(val) => {
          if (!selectedContact) return;
          setThreadNicknames((prev) => ({ ...prev, [selectedContact.contactId]: val }));
        }}
        themeId={selectedContact ? threadThemes[selectedContact.contactId] : undefined}
        onThemeChange={(tid) => {
          if (!selectedContact) return;
          handleSetThreadTheme(selectedContact.contactId, tid);
        }}
        isMuted={Boolean(selectedContact && mutedThreads[selectedContact.contactId])}
        isPinned={Boolean(selectedContact && pinnedThreads[selectedContact.contactId])}
        isBlocked={Boolean(selectedContact && blockedContacts[selectedContact.contactId])}
        isRestricted={Boolean(selectedContact && restrictedContacts[selectedContact.contactId])}
        onToggleMute={() => {
          if (!selectedContact) return;
          const cid = selectedContact.contactId;
          const next = !mutedThreads[cid];
          setMutedThreads((prev) => ({ ...prev, [cid]: next }));
          setToastMessage(next ? `Muted ${selectedContact.profileName}` : `Unmuted ${selectedContact.profileName}`);
        }}
        onTogglePin={() => {
          if (!selectedContact) return;
          const cid = selectedContact.contactId;
          const next = !pinnedThreads[cid];
          setPinnedThreads((prev) => ({ ...prev, [cid]: next }));
          setToastMessage(next ? `Pinned ${selectedContact.profileName}` : `Unpinned ${selectedContact.profileName}`);
        }}
        onToggleRestrict={() => {
          if (!selectedContact) return;
          const cid = selectedContact.contactId;
          const next = !restrictedContacts[cid];
          setRestrictedContacts((prev) => ({ ...prev, [cid]: next }));
          setToastMessage(
            next
              ? `Restricted ${selectedContact.profileName}`
              : `Removed restriction for ${selectedContact.profileName}`
          );
        }}
        onToggleBlock={() => {
          if (!selectedContact) return;
          const cid = selectedContact.contactId;
          const next = !blockedContacts[cid];
          setBlockedContacts((prev) => ({ ...prev, [cid]: next }));
          setToastMessage(
            next ? `Blocked ${selectedContact.profileName}` : `Unblocked ${selectedContact.profileName}`
          );
        }}
        onClearHistory={() => {
          if (!selectedContact) return;
          setThreadMessages([]);
          setToastMessage(`Cleared local view for ${selectedContact.profileName}`);
          setShowThreadSettings(false);
        }}
        onViewProfile={(pid) => {
          window.dispatchEvent(new CustomEvent('nexus_open_profile', { detail: { profile_id: pid } }));
          setShowThreadSettings(false);
        }}
        availableContacts={availableRecipientProfiles}
        onRenameGroup={handleRenameGroup}
        onAddGroupMembers={handleAddGroupMembers}
        onLeaveGroup={handleLeaveGroup}
      />

      {/* Global Inbox Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[85dvh] bg-[#0c0e13] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.07] mb-4">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Inbox Preferences</h3>
                  <p className="text-xs text-zinc-400">
                    Manage active status, read receipts, and who can message you.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-3 min-h-[36px] rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-zinc-200 cursor-pointer"
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="w-10 h-10 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 no-scrollbar space-y-4">
              <InboxPreferences
                userProfile={userProfile}
                chats={conversations.map((c) => ({
                  id: c.contactId,
                  name: c.profileName,
                  avatar: c.avatarUrl || '',
                  role: c.roleBadge || 'USER',
                  roleBadge: c.roleBadge || 'USER',
                  roleColor: 'rose',
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

      {/* Scene Note Creation Modal */}
      {isAddingNote && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsAddingNote(false)}
            className="absolute top-4 left-4 w-11 h-11 flex items-center justify-center text-white rounded-xl hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center w-full max-w-sm gap-6">
            <h2 className="text-xl font-bold text-white">New note</h2>

            <div className="relative mt-12 w-full flex justify-center">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-56 text-center z-20">
                <input
                  type="text"
                  autoFocus
                  placeholder="Share a thought..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value.slice(0, 60))}
                  className="bg-[#141720] text-white text-sm px-4 py-3 rounded-2xl w-full text-center outline-none border border-white/[0.12] focus:border-rose-500/60 placeholder:text-zinc-500 shadow-xl"
                />
              </div>

              <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-[#0c0e13] overflow-hidden shadow-2xl relative z-10 mx-auto mt-6">
                {userProfile?.avatar || userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar || userProfile.avatar_url}
                    alt="You"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">
                    {userProfile?.name?.substring(0, 2).toUpperCase() ||
                      userProfile?.full_name?.substring(0, 2).toUpperCase() ||
                      'YOU'}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-400 text-center mt-2">
              Visible to scene contacts in the active notes strip.
            </p>

            <button
              type="button"
              onClick={async () => {
                const trimmed = newNoteText.trim();
                if (trimmed) {
                  setMyNote(trimmed);
                  setIsMyNoteFresh(true);
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('nexus_user_thought_note', trimmed);
                  }
                  if (currentUserId && isValidUuid(currentUserId)) {
                    try {
                      await supabase
                        .from('profiles')
                        .update({ update_ticker: trimmed })
                        .eq('id', currentUserId);
                    } catch {}
                  }
                }
                setIsAddingNote(false);
                setNewNoteText('');
              }}
              disabled={!newNoteText.trim()}
              className="mt-4 px-8 min-h-[44px] bg-white text-black font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-[200px] cursor-pointer hover:bg-zinc-200 transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      )}

      {/* Expanded Thought Modal */}
      {expandedThought && (
        <div
          className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setExpandedThought(null)}
        >
          <div
            className="bg-[#0c0e13] border border-white/[0.1] rounded-2xl p-5 max-w-xs w-full shadow-2xl relative flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpandedThought(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-rose-500/70 overflow-hidden mb-3">
              {expandedThought.avatar ? (
                <img
                  src={expandedThought.avatar}
                  alt={expandedThought.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-zinc-200 text-lg">
                  {expandedThought.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <h3 className="text-sm font-bold text-white">{expandedThought.name}</h3>
            {expandedThought.handle && (
              <span className="text-xs text-zinc-400 mt-0.5">{expandedThought.handle}</span>
            )}
            <span className="text-[11px] text-rose-400 font-medium mt-1 mb-3">
              {expandedThought.isMine ? 'Your Note' : `${expandedThought.roleBadge || 'Member'}`}
            </span>

            <div className="w-full bg-[#141720] border border-white/[0.07] rounded-xl p-3.5 text-xs text-zinc-100 leading-relaxed text-left">
              &ldquo;{expandedThought.note}&rdquo;
            </div>

            {expandedThought.song && (
              <div className="w-full flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.07] p-2 rounded-xl text-xs text-zinc-300 mt-2.5">
                <Music className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{expandedThought.song}</span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2 mt-4">
              {expandedThought.isMine ? (
                <div className="w-full flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setMyNote(null);
                      setIsMyNoteFresh(false);
                      if (typeof localStorage !== 'undefined') {
                        localStorage.removeItem('nexus_user_thought_note');
                      }
                      if (currentUserId && isValidUuid(currentUserId)) {
                        try {
                          await supabase
                            .from('profiles')
                            .update({ update_ticker: null })
                            .eq('id', currentUserId);
                        } catch {}
                      }
                      setExpandedThought(null);
                    }}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Clear Note
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedThought(null);
                      setIsAddingNote(true);
                    }}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const matched = conversations.find(
                        (c) =>
                          !c.isGroup &&
                          (c.contactId === expandedThought.id ||
                            c.profileName.toLowerCase() === expandedThought.name.toLowerCase())
                      );
                      if (matched) {
                        handleSelectContact(matched);
                      } else {
                        const newC: InboxConversation = {
                          contactId: expandedThought.id || expandedThought.name,
                          profileName: expandedThought.name,
                          avatarUrl: expandedThought.avatar,
                          lastMessage: '',
                          timestamp: new Date().toISOString(),
                          isRead: true,
                          unreadCount: 0,
                          roleBadge: expandedThought.roleBadge || 'USER',
                        };
                        setConversations((prev) => [newC, ...prev]);
                        handleSelectContact(newC);
                      }
                      setExpandedThought(null);
                    }}
                    className="w-full min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Message {expandedThought.name.split(' ')[0]}</span>
                  </button>
                  {expandedThought.rawProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectProfile) {
                          onSelectProfile(expandedThought.rawProfile);
                        } else {
                          window.dispatchEvent(
                            new CustomEvent('nexus_open_profile', {
                              detail: {
                                profile_id: expandedThought.id,
                                profile: expandedThought.rawProfile,
                              },
                            })
                          );
                        }
                        setExpandedThought(null);
                      }}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Select New Message / Group Composer Modal */}
      <InboxComposerModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        contacts={availableRecipientProfiles}
        onStartDirectMessage={handleStartNewMessageWithContact}
        onStartCustomDirectMessage={handleStartCustomMessage}
        onCreateGroupChat={handleCreateGroupChat}
      />

      {/* Rich Signal Composer Sheet (Demo Waveform, Voice Note, Tour Offer, Show Card) */}
      <RichSignalComposerSheet
        mode={signalComposerMode}
        onClose={() => setSignalComposerMode(null)}
        defaultArtistName={myThreadDisplayName}
        onSubmitAudioCard={(card, captionText) => {
          dispatchThreadMessage({
            text: captionText || '',
            audioCard: card,
            replyTo: replyingToRef.current,
          });
        }}
        onSubmitOfferCard={(card, captionText) => {
          dispatchThreadMessage({
            text: captionText || '',
            offerCard: card,
            replyTo: replyingToRef.current,
          });
        }}
      />
    </div>
  );
};

export default InboxTerminal;
