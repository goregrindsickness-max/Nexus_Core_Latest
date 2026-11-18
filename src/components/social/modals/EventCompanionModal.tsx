import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  X,
  Ticket,
  Clock,
  QrCode,
  Shield,
  Music,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Users,
  Flame,
  Star,
  Sparkles,
  Calendar,
  Layers,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Send,
  MessageSquare,
  Trash2,
  Reply,
  Pin,
  Megaphone,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { bandSetlists } from '../../../data/socialFeedMockData';
import {
  formatTimeTo12h,
  hasGigTickets,
  getExternalTicketUrl,
  getExternalTicketProviderName,
  getShowTicketTiers,
  parseSingleAdmissionPrice,
  findInAppPassForEvent
} from '../../../utils/socialFeedUtils';
import {
  formatShowDateRange,
  getEffectiveShowEndDate,
  getEffectiveShowStartDate,
} from '../../../utils/showDisplayUtils';

type PitCategory = 'chat' | 'set_times' | 'merch' | 'meetup' | 'pit';

const PIT_CATEGORIES: Array<{
  id: 'all' | PitCategory;
  label: string;
  shortLabel: string;
  badgeClass: string;
}> = [
  { id: 'all', label: 'All Activity', shortLabel: 'All', badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  { id: 'chat', label: '💬 General', shortLabel: '💬 Chat', badgeClass: 'bg-zinc-800/90 text-zinc-300 border-zinc-700' },
  { id: 'set_times', label: '⏱️ Set Times', shortLabel: '⏱️ Set Times', badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/40' },
  { id: 'merch', label: '👕 Merch Report', shortLabel: '👕 Merch', badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-500/40' },
  { id: 'meetup', label: '🚗 Meetup / Rides', shortLabel: '🚗 Meetup', badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40' },
  { id: 'pit', label: '🔥 Front Row / Pit', shortLabel: '🔥 In Pit', badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/40' },
];

const PIT_REACTION_EMOJIS = ['🤘', '🔥', '💀', '🍻'];

const LEGACY_MOCK_NAMES = new Set([
  'pit host',
  'jax_riff',
  'valkyrie_v',
  'metalhead99',
  'sarahv',
  'tour crew',
]);

function isMockSeedMessage(msg: any): boolean {
  if (!msg) return true;
  const id = String(msg.id || '');
  if (id.startsWith('seed-') || id === 'msg_1' || id === 'msg_2') return true;
  const uid = String(msg.user_id || '');
  if (uid.startsWith('seed-')) return true;
  const uname = String(msg.username || msg.author || msg.user || '').toLowerCase().trim();
  if (LEGACY_MOCK_NAMES.has(uname)) return true;
  return false;
}

interface EventCompanionModalProps {
  isEventModeActive: boolean;
  setIsEventModeActive: (val: boolean) => void;
  activeEventData: any;
  eventModeTab: 'info' | 'setlist' | 'chat';
  setEventModeTab: (tab: 'info' | 'setlist' | 'chat') => void;
  isTicketScanned: boolean;
  setIsTicketScanned: (val: boolean) => void;
  scanTime: string | null;
  setScanTime: (time: string | null) => void;
  liveSetlists: Record<string, any>;
  venueMessages: any[];
  setVenueMessages: React.Dispatch<React.SetStateAction<any[]>>;
  venueMessageInput: string;
  setVenueMessageInput: (val: string) => void;
  userProfile?: any;
  getSupabase?: () => any;
  onCheckoutTicket?: (gig: any) => void;
  onEditShow?: (gig: any) => void;
  onDeleteShow?: (gig: any) => void;
  onDeleteGig?: (gig: any) => void;
  triggerNotification?: (title: string, message?: string, icon?: string) => void;
}

export const EventCompanionModal: React.FC<EventCompanionModalProps> = ({
  isEventModeActive,
  setIsEventModeActive,
  activeEventData,
  eventModeTab,
  setEventModeTab,
  isTicketScanned,
  setIsTicketScanned,
  scanTime,
  setScanTime,
  liveSetlists,
  venueMessages,
  setVenueMessages,
  venueMessageInput,
  setVenueMessageInput,
  userProfile,
  getSupabase,
  onCheckoutTicket,
  onEditShow,
  onDeleteShow,
  onDeleteGig,
  triggerNotification
}) => {
  // RSVP State
  const [rsvpStatus, setRsvpStatus] = useState<'going' | 'maybe' | 'cant_make' | null>(null);
  const [rsvpCounts, setRsvpCounts] = useState<{ going: number; maybe: number; cant_make: number }>({
    going: 0,
    maybe: 0,
    cant_make: 0
  });

  // Collapsed by default setlists state
  const [expandedSetlists, setExpandedSetlists] = useState<Record<string, boolean>>({});
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Enhanced Venue Pit Wall states
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | PitCategory>('all');
  const [composerCategory, setComposerCategory] = useState<PitCategory>('chat');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const [pinnedNotice, setPinnedNotice] = useState<{ text: string; updatedBy: string; updatedAt: string } | null>(null);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [pinDraftText, setPinDraftText] = useState('');
  const [isLoadingPitWall, setIsLoadingPitWall] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const eventKey = useMemo(() => {
    if (!activeEventData) return 'default_event';
    return String(
      activeEventData.id ||
        `${activeEventData.headliner || activeEventData.title || 'show'}_${activeEventData.date || ''}`
    ).trim();
  }, [activeEventData]);

  // Resolve current actor ID for reactions & ownership
  const currentActorId = useMemo(() => {
    if (userProfile?.id) return String(userProfile.id);
    try {
      let stored = localStorage.getItem('nexus_guest_user_id');
      if (!stored) {
        stored = `guest_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('nexus_guest_user_id', stored);
      }
      return stored;
    } catch (_) {
      return 'guest_fan';
    }
  }, [userProfile?.id]);

  // Check ownership of the show
  const isShowOwner = React.useMemo(() => {
    if (!activeEventData) return false;
    if (activeEventData.is_community_submitted || activeEventData.isCommunitySubmitted || activeEventData.is_user_created) return true;
    try {
      const rawCreated = localStorage.getItem('nexus_created_show_ids');
      if (rawCreated) {
        const list: string[] = JSON.parse(rawCreated);
        if (activeEventData.id && list.includes(activeEventData.id)) return true;
      }
      const rawExt = localStorage.getItem('nexus_core_shows_extended');
      if (rawExt) {
        const extMap = JSON.parse(rawExt);
        if (activeEventData.id && extMap[activeEventData.id]) return true;
      }
    } catch (_) {}
    if (userProfile) {
      const uid = userProfile.id || userProfile.uid || userProfile.email || userProfile.handle;
      if (activeEventData.created_by && activeEventData.created_by === uid) return true;
      if (activeEventData.user_id && activeEventData.user_id === uid) return true;
      if (activeEventData.band_id && (activeEventData.band_id === uid || activeEventData.band_id === userProfile.bandId)) return true;
      const uName = String(userProfile.bandName || userProfile.name || userProfile.handle || '').toLowerCase().trim();
      const hName = String(activeEventData.headliner || activeEventData.name || '').toLowerCase().trim();
      if (uName && hName && (uName === hName || hName.includes(uName))) return true;
      const role = String(userProfile.role || userProfile.type || '').toLowerCase();
      if (role.includes('admin') || role.includes('promoter') || role.includes('label')) return true;
    }
    if (typeof activeEventData.id === 'string' && (activeEventData.id.startsWith('sh_comm_') || activeEventData.id.startsWith('show_') || activeEventData.id.startsWith('custom_'))) {
      return true;
    }
    return true;
  }, [activeEventData, userProfile]);

  // Initialize RSVP and stats per active event
  useEffect(() => {
    if (!activeEventData) return;

    setShowDeleteConfirm(false);
    setExpandedSetlists({});
    setReplyingTo(null);
    setActiveCategoryFilter('all');
    setIsEditingPin(false);

    const eventId = activeEventData.id || activeEventData.headliner || 'default';
    const userKey = userProfile?.id || 'guest';
    const savedRsvp = localStorage.getItem(`nexus_event_rsvp_${eventId}_${userKey}`);
    
    if (savedRsvp === 'going' || savedRsvp === 'maybe' || savedRsvp === 'cant_make') {
      setRsvpStatus(savedRsvp);
    } else {
      setRsvpStatus(null);
    }

    setRsvpCounts({
      going: 0,
      maybe: 0,
      cant_make: 0
    });
  }, [activeEventData?.id, userProfile?.id]);

  const handleRsvpChange = (status: 'going' | 'maybe' | 'cant_make') => {
    if (!activeEventData) return;
    const eventId = activeEventData.id || activeEventData.headliner || 'default';
    const userKey = userProfile?.id || 'guest';

    const prevStatus = rsvpStatus;
    let newStatus: 'going' | 'maybe' | 'cant_make' | null = status;

    if (prevStatus === status) {
      newStatus = null;
      localStorage.removeItem(`nexus_event_rsvp_${eventId}_${userKey}`);
    } else {
      localStorage.setItem(`nexus_event_rsvp_${eventId}_${userKey}`, status);
    }

    setRsvpStatus(newStatus);

    setRsvpCounts(prev => {
      const updated = { ...prev };
      if (prevStatus === 'going') updated.going = Math.max(0, updated.going - 1);
      if (prevStatus === 'maybe') updated.maybe = Math.max(0, updated.maybe - 1);
      if (prevStatus === 'cant_make') updated.cant_make = Math.max(0, updated.cant_make - 1);

      if (newStatus === 'going') updated.going += 1;
      if (newStatus === 'maybe') updated.maybe += 1;
      if (newStatus === 'cant_make') updated.cant_make += 1;

      return updated;
    });

    const supabaseClient = getSupabase ? getSupabase() : null;
    if (supabaseClient && userProfile?.id) {
      supabaseClient.from('nexus_event_rsvps').upsert({
        event_id: String(eventId),
        user_id: userProfile.id,
        status: newStatus || 'none',
        updated_at: new Date().toISOString()
      }).then();
    }
  };

  const toggleSetlistAccordion = (bandName: string) => {
    setExpandedSetlists(prev => ({
      ...prev,
      [bandName]: !prev[bandName]
    }));
  };

  // Load real Pit Wall messages from server + subscribe to Realtime channel
  useEffect(() => {
    if (!activeEventData || !isEventModeActive) return;
    const storageKey = `nexus_venue_pitwall_${eventKey}`;

    // 1. Load any real non-mock cached messages first for instant UI
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter(m => !isMockSeedMessage(m));
          setVenueMessages(realOnly);
          if (realOnly.length !== parsed.length) {
            localStorage.setItem(storageKey, JSON.stringify(realOnly));
          }
        }
      } else {
        setVenueMessages([]);
      }
    } catch (_) {
      setVenueMessages([]);
    }

    // 2. Fetch authoritative messages & pinned notice from backend
    let cancelled = false;
    setIsLoadingPitWall(true);
    fetch(`/api/shows/${encodeURIComponent(eventKey)}/pitwall`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled || !data) return;
        if (Array.isArray(data.messages)) {
          const clean = data.messages.filter((m: any) => !isMockSeedMessage(m));
          setVenueMessages(clean);
          try {
            localStorage.setItem(storageKey, JSON.stringify(clean));
          } catch (_) {}
        }
        if (data.pinnedNotice !== undefined) {
          setPinnedNotice(data.pinnedNotice || null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoadingPitWall(false);
      });

    // 3. Subscribe to Supabase Realtime broadcast channel for instant multi-user sync
    const supabaseClient = getSupabase ? getSupabase() : null;
    let channel: any = null;
    if (supabaseClient) {
      channel = supabaseClient.channel(`venue_chat_${eventKey}`, {
        config: { broadcast: { self: false } }
      });

      channel
        .on('broadcast', { event: 'venue_msg' }, (payload: any) => {
          const incoming = payload?.payload;
          if (!incoming || isMockSeedMessage(incoming)) return;
          setVenueMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev;
            const updated = [...prev, incoming];
            try {
              localStorage.setItem(storageKey, JSON.stringify(updated));
            } catch (_) {}
            return updated;
          });
        })
        .on('broadcast', { event: 'venue_react' }, (payload: any) => {
          const updatedMsg = payload?.payload;
          if (!updatedMsg?.id) return;
          setVenueMessages(prev =>
            prev.map(m => (m.id === updatedMsg.id ? { ...m, reactions: updatedMsg.reactions } : m))
          );
        })
        .on('broadcast', { event: 'venue_pin' }, (payload: any) => {
          setPinnedNotice(payload?.payload || null);
        })
        .on('broadcast', { event: 'venue_delete' }, (payload: any) => {
          const deletedId = payload?.payload?.messageId;
          if (!deletedId) return;
          setVenueMessages(prev => prev.filter(m => m.id !== deletedId));
        })
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (supabaseClient && channel) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [eventKey, isEventModeActive]);

  // Auto-scroll when switching to chat or when new messages arrive
  useEffect(() => {
    if (eventModeTab === 'chat') {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [eventModeTab, venueMessages.length]);

  const handleSendVenueMessage = async (textToSend?: string, overrideCategory?: PitCategory) => {
    const rawText = textToSend !== undefined ? textToSend : venueMessageInput;
    const text = (rawText || '').trim();
    if (!text || !activeEventData) return;

    const senderId = currentActorId;
    const senderName =
      userProfile?.bandName ||
      userProfile?.username ||
      userProfile?.name ||
      userProfile?.full_name ||
      'Scene Attendee';
    const senderHandle = userProfile?.handle || userProfile?.username || '';
    const senderAvatar =
      userProfile?.avatar_url || userProfile?.avatar || userProfile?.profileAvatarUrl || '';
    const senderRole = userProfile?.role || userProfile?.type || (isShowOwner ? 'Show Host' : 'Fan');
    const chosenCat = overrideCategory || composerCategory || 'chat';

    const payload = {
      id: `pit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventId: eventKey,
      user_id: senderId,
      username: senderName,
      handle: senderHandle,
      avatar_url: senderAvatar,
      role: senderRole,
      category: chosenCat,
      text,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            username: replyingTo.username,
            text: replyingTo.text,
          }
        : null,
      reactions: {},
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString()
    };

    // 1. Optimistic local state update IMMEDIATELY
    const storageKey = `nexus_venue_pitwall_${eventKey}`;
    setVenueMessages(prev => {
      const cleanPrev = prev.filter(m => !isMockSeedMessage(m) && m.id !== payload.id);
      const updated = [...cleanPrev, payload];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    setVenueMessageInput('');
    setReplyingTo(null);

    // 2. Persist to authoritative backend endpoint
    try {
      const res = await fetch(`/api/shows/${encodeURIComponent(eventKey)}/pitwall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.message) {
          setVenueMessages(prev =>
            prev.map(m => (m.id === payload.id ? data.message : m))
          );
        }
      }
    } catch (err) {
      console.warn('Pit Wall server save note:', err);
    }

    // 3. Broadcast via Supabase Realtime to other connected attendees
    try {
      const supabaseClient = getSupabase ? getSupabase() : null;
      if (supabaseClient) {
        supabaseClient.channel(`venue_chat_${eventKey}`).send({
          type: 'broadcast',
          event: 'venue_msg',
          payload
        });
      }
    } catch (_) {}
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!messageId) return;
    const actorId = currentActorId;

    // Optimistic update
    let optimisticUpdatedMsg: any = null;
    setVenueMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId) return msg;
        const reactions = { ...(msg.reactions || {}) };
        const currentList: string[] = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
        if (currentList.includes(actorId)) {
          const next = currentList.filter(u => u !== actorId);
          if (next.length === 0) delete reactions[emoji];
          else reactions[emoji] = next;
        } else {
          reactions[emoji] = [...currentList, actorId];
        }
        optimisticUpdatedMsg = { ...msg, reactions };
        return optimisticUpdatedMsg;
      })
    );

    try {
      const res = await fetch(
        `/api/shows/${encodeURIComponent(eventKey)}/pitwall/${encodeURIComponent(messageId)}/react`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji, userId: actorId }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.message) {
          optimisticUpdatedMsg = data.message;
          setVenueMessages(prev =>
            prev.map(m => (m.id === messageId ? data.message : m))
          );
        }
      }
    } catch (_) {}

    if (optimisticUpdatedMsg) {
      try {
        const supabaseClient = getSupabase ? getSupabase() : null;
        if (supabaseClient) {
          supabaseClient.channel(`venue_chat_${eventKey}`).send({
            type: 'broadcast',
            event: 'venue_react',
            payload: optimisticUpdatedMsg,
          });
        }
      } catch (_) {}
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) return;
    const storageKey = `nexus_venue_pitwall_${eventKey}`;
    setVenueMessages(prev => {
      const updated = prev.filter(m => m.id !== messageId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    try {
      await fetch(
        `/api/shows/${encodeURIComponent(eventKey)}/pitwall/${encodeURIComponent(messageId)}`,
        { method: 'DELETE' }
      );
    } catch (_) {}

    try {
      const supabaseClient = getSupabase ? getSupabase() : null;
      if (supabaseClient) {
        supabaseClient.channel(`venue_chat_${eventKey}`).send({
          type: 'broadcast',
          event: 'venue_delete',
          payload: { messageId },
        });
      }
    } catch (_) {}
  };

  const handleSavePinnedNotice = async (textToPin: string) => {
    const senderName =
      userProfile?.bandName ||
      userProfile?.username ||
      userProfile?.name ||
      'Show Host';
    const clean = textToPin.trim();
    const nextNotice = clean
      ? { text: clean, updatedBy: senderName, updatedAt: new Date().toISOString() }
      : null;

    setPinnedNotice(nextNotice);
    setIsEditingPin(false);

    try {
      await fetch(`/api/shows/${encodeURIComponent(eventKey)}/pitwall/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, updatedBy: senderName }),
      });
    } catch (_) {}

    try {
      const supabaseClient = getSupabase ? getSupabase() : null;
      if (supabaseClient) {
        supabaseClient.channel(`venue_chat_${eventKey}`).send({
          type: 'broadcast',
          event: 'venue_pin',
          payload: nextNotice,
        });
      }
    } catch (_) {}
  };

  // Filtered messages for active category
  const visibleMessages = useMemo(() => {
    const cleanList = (venueMessages || []).filter(m => !isMockSeedMessage(m));
    if (activeCategoryFilter === 'all') return cleanList;
    return cleanList.filter(m => (m.category || 'chat') === activeCategoryFilter);
  }, [venueMessages, activeCategoryFilter]);

  const uniqueParticipantCount = useMemo(() => {
    const ids = new Set<string>();
    (venueMessages || []).forEach(m => {
      if (!isMockSeedMessage(m) && (m.user_id || m.username)) {
        ids.add(String(m.user_id || m.username));
      }
    });
    if (currentActorId) ids.add(currentActorId);
    return ids.size;
  }, [venueMessages, currentActorId]);

  const [collectionsVersion, setCollectionsVersion] = useState(0);

  useEffect(() => {
    const refreshCollections = () => setCollectionsVersion((v) => v + 1);
    window.addEventListener('nexus-collections-updated', refreshCollections);
    window.addEventListener('storage', refreshCollections);
    return () => {
      window.removeEventListener('nexus-collections-updated', refreshCollections);
      window.removeEventListener('storage', refreshCollections);
    };
  }, []);

  const externalTicketUrl = getExternalTicketUrl(activeEventData);
  const externalProviderName = getExternalTicketProviderName(externalTicketUrl);
  const customTicketTiers = getShowTicketTiers(activeEventData);
  const admissionInfo = parseSingleAdmissionPrice(activeEventData);
  const isNativePaidBoxOffice = !externalTicketUrl && (customTicketTiers.length > 0 || admissionInfo.hasNumericPrice);
  const purchasedPass = useMemo(
    () => (externalTicketUrl ? null : findInAppPassForEvent(activeEventData)),
    [activeEventData, externalTicketUrl, collectionsVersion]
  );

  // Determine if tickets are setup for this event
  const isTicketSetup = Boolean(externalTicketUrl || isNativePaidBoxOffice || hasGigTickets(activeEventData));

  // Compute Full Tour Lineup
  const headlinerName = (activeEventData?.headliner || 'Headliner').trim();
  const getLineupList = (): string[] => {
    if (!activeEventData) return [headlinerName];

    if (Array.isArray(activeEventData.lineup) && activeEventData.lineup.length > 0) {
      return activeEventData.lineup;
    }
    if (typeof activeEventData.lineup === 'string' && activeEventData.lineup.trim().length > 0) {
      return activeEventData.lineup.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(activeEventData.support_lineup) && activeEventData.support_lineup.length > 0) {
      return [headlinerName, ...activeEventData.support_lineup.map((s: any) => s.name || s.band_name || s)];
    }
    if (typeof activeEventData.support_bands === 'string' && activeEventData.support_bands.trim().length > 0) {
      return [headlinerName, ...activeEventData.support_bands.split(',').map((s: string) => s.trim()).filter(Boolean)];
    }

    // Curated tour package rosters
    const upper = headlinerName.toUpperCase();
    if (upper.includes('CRYPTOPSY')) {
      return ['CRYPTOPSY', 'DYING FETUS', 'ABORTED', 'DECREPIT BIRTH', 'ARCHSPIRE'];
    }
    if (upper.includes('DYING FETUS')) {
      return ['DYING FETUS', 'DEVOURMENT', 'CORDYCEPS', 'SANGUISUGABOGG'];
    }
    if (upper.includes('MORTICIAN')) {
      return ['MORTICIAN', 'INCANTATION', 'SANGUISUGABOGG', 'PHOBOPHILIC'];
    }
    if (upper.includes('DARK FUNERAL')) {
      return ['DARK FUNERAL', 'BELPHEGOR', 'INCANTATION', 'ROTTING CHRIST', 'GHOST BATH'];
    }
    if (upper.includes('HYPOCRISY')) {
      return ['HYPOCRISY', 'CARCASS', 'THE BLACK DAHLIA MURDER', 'KATAKLYSM'];
    }
    if (upper.includes('IMMOLATION')) {
      return ['IMMOLATION', 'VADER', 'MONSTROSITY', 'DEICIDE'];
    }

    return [headlinerName, 'Direct Support', 'Special Guest Opener'];
  };

  const fullLineup = getLineupList();

  return (
    <AnimatePresence>
      {isEventModeActive && activeEventData && (
        <motion.div
          key="modal-backdrop-eventcompanionmodal-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 h-[100dvh] bg-black/95 backdrop-blur-xl z-[10080] flex flex-col pb-[env(safe-area-inset-bottom)] zoom-in-95 duration-300"
        >
          {/* Header */}
          <div className="px-4 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] border-b border-zinc-900 bg-black/80 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/50 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white font-black uppercase tracking-wider leading-tight text-sm sm:text-base truncate">
                    {activeEventData.headliner || activeEventData.title}
                  </h2>
                  {(activeEventData.date || getEffectiveShowStartDate(activeEventData)) && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                      {(() => {
                        const startRaw = getEffectiveShowStartDate(activeEventData);
                        const endRaw = getEffectiveShowEndDate(activeEventData);
                        if (endRaw && startRaw) {
                          return formatShowDateRange(startRaw, endRaw, { includeWeekday: true }) || activeEventData.date;
                        }
                        return activeEventData.date || startRaw;
                      })()}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 truncate mt-0.5">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{activeEventData.venue}</span>
                  {activeEventData.city && <span className="text-zinc-500 truncate">• {activeEventData.city}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEditShow && isShowOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEventModeActive(false);
                    onEditShow(activeEventData);
                  }}
                  className="w-9 h-9 bg-zinc-900 hover:bg-zinc-800 text-[#00ffcc] rounded-full flex items-center justify-center transition-colors border border-zinc-800 cursor-pointer shrink-0 shadow-md"
                  title="Edit Show Details"
                >
                  <span className="text-sm">✏️</span>
                </button>
              )}
              {(onDeleteShow || onDeleteGig) && isShowOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(prev => !prev);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border cursor-pointer shrink-0 shadow-md ${
                    showDeleteConfirm 
                      ? 'bg-rose-600 text-white border-rose-500 shadow-rose-900/50 scale-105' 
                      : 'bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 border-zinc-800 hover:border-rose-500/50'
                  }`}
                  title="Permanently Delete Show"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEventModeActive(false)}
                className="w-9 h-9 bg-zinc-900 hover:bg-zinc-800 rounded-full flex items-center justify-center transition-colors border border-zinc-800 cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Delete Confirmation Banner */}
          {showDeleteConfirm && (
            <div className="bg-rose-950/90 border-b border-rose-500/60 px-4 py-3 text-center animate-in slide-in-from-top-2">
              <div className="max-w-md mx-auto space-y-2.5">
                <div className="flex items-center justify-center gap-2 text-rose-200 font-bold text-xs uppercase tracking-wider">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Permanently Delete Upcoming Show?</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Remove <strong className="text-white">"{activeEventData.headliner}"</strong> ({activeEventData.date} at {activeEventData.venue})? This will permanently erase it from your schedules and database so it never comes back.
                </p>
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const deleteFn = onDeleteShow || onDeleteGig;
                      if (deleteFn && activeEventData) {
                        deleteFn(activeEventData);
                        setShowDeleteConfirm(false);
                        setIsEventModeActive(false);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-rose-950 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-900 bg-zinc-950/60 shrink-0">
            <button
              onClick={() => setEventModeTab('info')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                eventModeTab === 'info'
                  ? 'text-rose-500 border-rose-500 bg-rose-500/5'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Access & Tickets</span>
            </button>
            <button
              onClick={() => setEventModeTab('setlist')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                eventModeTab === 'setlist'
                  ? 'text-rose-500 border-rose-500 bg-rose-500/5'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lineup & Setlists</span>
            </button>
            <button
              onClick={() => setEventModeTab('chat')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                eventModeTab === 'chat'
                  ? 'text-rose-500 border-rose-500 bg-rose-500/5'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Venue Pit Wall</span>
              {venueMessages.filter(m => !isMockSeedMessage(m)).length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {venueMessages.filter(m => !isMockSeedMessage(m)).length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {eventModeTab === 'chat' ? (
            <div className="flex-1 min-h-0 flex flex-col w-full max-w-3xl mx-auto overflow-hidden bg-[#07080b] border-x border-zinc-900/80">
              {/* Top Venue Pit Wall Header & Pinned Show Bulletin */}
              <div className="px-4 py-2.5 bg-zinc-950/95 border-b border-zinc-800/80 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 relative" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black uppercase tracking-wider text-white truncate flex items-center gap-1.5">
                        <span>Live Venue Pit Wall</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-bold">
                          REALTIME
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">
                        {activeEventData?.venue || 'Venue'}{activeEventData?.city ? ` • ${activeEventData.city}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPinDraftText(
                          pinnedNotice?.text ||
                            `Doors: ${formatTimeTo12h(activeEventData?.doors_time || activeEventData?.time || '7:00 PM')} • Lineup: ${fullLineup.slice(0, 3).join(' / ')}`
                        );
                        setIsEditingPin(prev => !prev);
                      }}
                      className="text-[10px] font-mono text-amber-300 hover:text-amber-200 bg-amber-950/50 hover:bg-amber-900/50 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Pin Set Times or Live Show Update"
                    >
                      <Pin className="w-3 h-3 text-amber-400" />
                      <span>{pinnedNotice ? 'Update Pin' : 'Pin Set Times'}</span>
                    </button>
                    <div className="text-[10px] font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Users className="w-3 h-3 text-rose-400" />
                      <span>{uniqueParticipantCount} active</span>
                    </div>
                  </div>
                </div>

                {/* Pinned Show Bulletin Editor */}
                {isEditingPin && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 font-bold uppercase">
                      <span className="flex items-center gap-1.5">
                        <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                        Pin Live Show Status / Set Times Banner
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingPin(false)}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pinDraftText}
                        onChange={e => setPinDraftText(e.target.value)}
                        placeholder="e.g. Doors 7PM • Opener 8PM • Headliner 9:30PM • Merch open by stage right"
                        className="flex-1 bg-black/80 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePinnedNotice(pinDraftText)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-[10px] uppercase cursor-pointer shrink-0"
                      >
                        Save Pin
                      </button>
                      {pinnedNotice && (
                        <button
                          type="button"
                          onClick={() => handleSavePinnedNotice('')}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 border border-zinc-800 text-[10px] font-mono cursor-pointer shrink-0"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Active Pinned Bulletin Display */}
                {pinnedNotice?.text ? (
                  <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-950/60 via-zinc-900/90 to-zinc-950 border border-amber-500/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-amber-100 font-medium break-words leading-snug">
                          {pinnedNotice.text}
                        </p>
                        <span className="text-[9px] font-mono text-amber-400/80">
                          Pinned by {pinnedNotice.updatedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="truncate">
                      ⏱️ Doors: <strong className="text-zinc-200">{formatTimeTo12h(activeEventData?.doors_time || activeEventData?.time || '7:00 PM')}</strong> • Lineup: <strong className="text-zinc-200">{fullLineup.slice(0, 3).join(', ')}</strong>
                    </span>
                  </div>
                )}

                {/* Category Filter Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  {PIT_CATEGORIES.map(cat => {
                    const isActive = activeCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                            : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Messages Feed Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                {isLoadingPitWall && visibleMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs font-mono text-zinc-500 animate-pulse">
                    Syncing live Venue Pit Wall...
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <div className="text-center py-10 px-4 flex flex-col items-center gap-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-white">
                        {activeCategoryFilter === 'all'
                          ? `Start the Pit Wall for ${activeEventData.headliner || activeEventData.title}`
                          : `No ${PIT_CATEGORIES.find(c => c.id === activeCategoryFilter)?.shortLabel} posts yet`}
                      </p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        This is a live, real-time channel for attendees, bands, and fans at <strong className="text-zinc-200">{activeEventData.venue || 'the venue'}</strong>. Drop a message below or tap a topic to kick off the conversation:
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      {[
                        { text: 'Anyone know the exact set times for tonight?', cat: 'set_times' as PitCategory },
                        { text: 'How is the merch line looking right now?', cat: 'merch' as PitCategory },
                        { text: 'Who is heading to the venue early for front row?', cat: 'meetup' as PitCategory },
                        { text: 'Soundcheck is sounding massive in here! 🤘', cat: 'pit' as PitCategory },
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setComposerCategory(prompt.cat);
                            setVenueMessageInput(prompt.text);
                            inputRef.current?.focus();
                          }}
                          className="text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-rose-500/50 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          "{prompt.text}"
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  visibleMessages.map((msg, i) => {
                    const isMe =
                      msg.user_id === currentActorId ||
                      (userProfile?.id && msg.user_id === userProfile.id) ||
                      (userProfile?.username && msg.username === userProfile.username);
                    const catMeta =
                      PIT_CATEGORIES.find(c => c.id === (msg.category || 'chat')) || PIT_CATEGORIES[1];
                    const reactionsMap: Record<string, string[]> =
                      msg.reactions && typeof msg.reactions === 'object' ? msg.reactions : {};

                    return (
                      <div
                        key={msg.id ? `venue-msg-${msg.id}-${i}` : `venue-msg-${i}`}
                        className={`group flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Clickable Attendee Avatar */}
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.username) {
                              window.dispatchEvent(
                                new CustomEvent('openPublicProfile', {
                                  detail: {
                                    id: msg.user_id,
                                    name: msg.username,
                                    username: msg.handle || msg.username,
                                    avatar: msg.avatar_url,
                                    role: msg.role || 'Fan',
                                  },
                                })
                              );
                            }
                          }}
                          className={`w-9 h-9 rounded-full ${
                            isMe ? 'bg-rose-600 ring-2 ring-rose-500/40' : 'bg-zinc-800 border border-zinc-700 hover:border-rose-500/60'
                          } flex items-center justify-center text-xs text-white font-bold shrink-0 overflow-hidden shadow transition-all cursor-pointer`}
                          title={`View ${msg.username || 'Attendee'}'s profile`}
                        >
                          {msg.avatar_url ? (
                            <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            (msg.username || 'F')[0]?.toUpperCase()
                          )}
                        </button>

                        <div className={`flex flex-col max-w-[82%] sm:max-w-[74%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Message Bubble */}
                          <div
                            className={`w-full rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                              isMe
                                ? 'bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-tr-sm border border-rose-500/50'
                                : 'bg-zinc-900/95 border border-zinc-800 text-zinc-100 rounded-tl-sm'
                            }`}
                          >
                            {/* Author + Role + Category + Time Header */}
                            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (msg.username) {
                                      window.dispatchEvent(
                                        new CustomEvent('openPublicProfile', {
                                          detail: {
                                            id: msg.user_id,
                                            name: msg.username,
                                            username: msg.handle || msg.username,
                                            avatar: msg.avatar_url,
                                            role: msg.role || 'Fan',
                                          },
                                        })
                                      );
                                    }
                                  }}
                                  className={`text-[11px] font-bold truncate hover:underline cursor-pointer ${
                                    isMe ? 'text-white' : 'text-rose-300'
                                  }`}
                                >
                                  {msg.username || 'Scene Attendee'}
                                </button>
                                {msg.role && msg.role !== 'Fan' && (
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/30 text-amber-300 border border-amber-400/30">
                                    {msg.role}
                                  </span>
                                )}
                                {msg.category && msg.category !== 'chat' && (
                                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${catMeta.badgeClass}`}>
                                    {catMeta.shortLabel}
                                  </span>
                                )}
                              </div>
                              {msg.timestamp && (
                                <span className={`text-[9px] font-mono shrink-0 ${isMe ? 'text-rose-200/80' : 'text-zinc-500'}`}>
                                  {msg.timestamp}
                                </span>
                              )}
                            </div>

                            {/* Quoted Reply Context if replying to another message */}
                            {msg.replyTo && msg.replyTo.text && (
                              <div
                                className={`mb-1.5 px-2.5 py-1.5 rounded-lg border-l-2 text-[11px] ${
                                  isMe
                                    ? 'bg-black/25 border-rose-200 text-rose-100'
                                    : 'bg-black/40 border-rose-500 text-zinc-300'
                                }`}
                              >
                                <span className="font-mono font-bold text-[10px] block opacity-90">
                                  ↩ @{msg.replyTo.username}
                                </span>
                                <span className="line-clamp-2 opacity-85">{msg.replyTo.text}</span>
                              </div>
                            )}

                            {/* Message Body */}
                            <p className="leading-relaxed break-words text-[13px] whitespace-pre-wrap">
                              {msg.text}
                            </p>
                          </div>

                          {/* Action & Reactions Bar Under Message */}
                          <div className={`flex items-center gap-1.5 mt-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {/* Quick Reaction Pills */}
                            {PIT_REACTION_EMOJIS.map(emoji => {
                              const users = Array.isArray(reactionsMap[emoji]) ? reactionsMap[emoji] : [];
                              const count = users.length;
                              const hasReacted = users.includes(currentActorId);
                              if (count === 0 && !hasReacted) {
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className="opacity-70 sm:opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
                                    title={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                );
                              }
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                                    hasReacted
                                      ? 'bg-rose-950/90 border-rose-500/60 text-rose-200 font-bold'
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{count}</span>
                                </button>
                              );
                            })}

                            {/* Reply Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo({
                                  id: msg.id,
                                  username: msg.username || 'Attendee',
                                  text: msg.text,
                                });
                                inputRef.current?.focus();
                              }}
                              className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded-md hover:bg-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Reply</span>
                            </button>

                            {/* Delete Button (own message or show owner) */}
                            {(isMe || isShowOwner) && msg.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 px-1.5 py-0.5 rounded-md hover:bg-zinc-900 transition-colors cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer Area (Always visible above bottom bar) */}
              <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800/90 sticky bottom-0 z-20 shrink-0 space-y-2 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                {/* Active Reply Banner */}
                {replyingTo && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-rose-500/40 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Reply className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-zinc-400 font-mono text-[11px] truncate">
                        Replying to <strong className="text-rose-300">@{replyingTo.username}</strong>: "{replyingTo.text}"
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-zinc-400 hover:text-white p-0.5 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Post Tag Selector + Quick Prompts */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Tag:
                    </span>
                    {PIT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setComposerCategory(cat.id as PitCategory)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all border cursor-pointer ${
                          composerCategory === cat.id
                            ? cat.badgeClass + ' font-bold ring-1 ring-white/20'
                            : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {cat.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendVenueMessage();
                  }}
                  className="flex items-center gap-2 w-full"
                >
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      id="venue-pit-wall-input"
                      type="text"
                      placeholder={
                        replyingTo
                          ? `Reply to @${replyingTo.username}...`
                          : `Message the ${activeEventData.headliner || 'Venue'} Pit Wall...`
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-rose-500 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all shadow-inner"
                      value={venueMessageInput}
                      onChange={(e) => setVenueMessageInput(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <button
                    id="venue-pit-wall-send-btn"
                    type="submit"
                    disabled={!venueMessageInput.trim()}
                    className="px-4 h-11 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-lg shadow-rose-950/60 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer font-mono font-bold text-xs uppercase"
                    title="Post to Pit Wall"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Post</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {eventModeTab === 'info' && (
                <div className="max-w-md mx-auto space-y-4 animate-in fade-in duration-300 pb-8">
                
                {/* 1. EVENT FLYER */}
                {activeEventData.flyer_url && (
                  <div className="bg-[#0b0d10] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-2.5 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between">
                      <div className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🖼️ Official Event Flyer</span>
                      </div>
                    </div>
                    <div className="p-2 flex justify-center bg-black/40">
                      <img 
                        src={activeEventData.flyer_url} 
                        alt={activeEventData.headliner || 'Event Flyer'}
                        className="w-full h-auto object-contain rounded-xl border border-zinc-800 max-h-[600px]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {/* 2. VENUE INFO BOX */}
                {(() => {
                  const venueName = activeEventData.venue_name || activeEventData.venue || activeEventData.name || 'Live Venue';
                  const streetAddress = activeEventData.venue_address || '';
                  const city = activeEventData.city || '';
                  const state = activeEventData.state_province || '';
                  const country = activeEventData.country || '';
                  const capacityVal = activeEventData.capacity || activeEventData.venue_capacity || activeEventData.expected_attendance;

                  let locationCity = city;
                  if (locationCity && state && !locationCity.toLowerCase().includes(state.toLowerCase())) {
                    locationCity = `${locationCity}, ${state}`;
                  }
                  
                  const navQueryParts = [
                    (venueName !== 'Live Venue' && venueName !== 'Underground Venue' && venueName !== 'Music Venue') ? venueName : '',
                    streetAddress,
                    locationCity,
                    country
                  ].filter(Boolean);
                  const navDestination = navQueryParts.length > 0 ? navQueryParts.join(', ') : (venueName || 'Venue');
                  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(navDestination)}`;

                  const handleCopy = () => {
                    const fullText = [venueName, streetAddress, locationCity, country].filter(Boolean).join(', ');
                    navigator.clipboard.writeText(fullText);
                    setCopiedAddress(true);
                    setTimeout(() => setCopiedAddress(false), 2000);
                  };

                  return (
                    <div className="bg-[#0b0d10] border border-zinc-800/90 rounded-2xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#00ffcc]" />
                          <span className="text-xs font-black text-white uppercase tracking-wider font-mono">
                            Venue Information
                          </span>
                        </div>
                        {capacityVal ? (
                          <div className="px-2.5 py-0.5 rounded-md bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[#00ffcc] text-[10px] font-mono font-bold flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{capacityVal} Cap</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-sm font-black text-white tracking-wide">
                              {venueName}
                            </div>
                            {streetAddress ? (
                              <div className="text-xs text-zinc-300 font-mono">
                                {streetAddress}
                              </div>
                            ) : null}
                            {locationCity ? (
                              <div className="text-[11px] text-zinc-400 font-mono">
                                {locationCity}{country ? ` • ${country}` : ''}
                              </div>
                            ) : null}
                          </div>
                          
                          {(streetAddress || locationCity) ? (
                            <button
                              onClick={handleCopy}
                              title="Copy venue address"
                              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors flex-shrink-0 cursor-pointer"
                            >
                              {copiedAddress ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : null}
                        </div>

                        {capacityVal ? (
                          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                            <span className="text-zinc-500">Official Capacity</span>
                            <span className="text-zinc-200 font-bold">{capacityVal} Attendees</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Google Maps Live Directions Button */}
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Get Live Directions (Google Maps)</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                    </div>
                  );
                })()}

                {/* 3. OFFICIAL BOX OFFICE / TICKET PURCHASE UNDER VENUE INFORMATION */}
                {externalTicketUrl ? (
                  <div className="bg-gradient-to-br from-amber-950/35 via-[#12100c] to-zinc-950 border border-amber-500/40 rounded-2xl p-4 shadow-xl shadow-black/40 space-y-3 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                            <span>External Box Office</span>
                            <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.2 rounded">
                              {externalProviderName}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            Off-platform vendor • No in-app confirmation or QR code
                          </div>
                        </div>
                      </div>

                      {activeEventData.price && (
                        <div className="sm:text-right">
                          <span className="inline-block text-xs font-black text-amber-300 font-mono px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/35 shadow break-words max-w-full">
                            {activeEventData.price}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-black/50 border border-amber-500/30 flex items-start gap-2 text-[10.5px] font-mono text-amber-100/90 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Tickets are sold directly via <strong className="text-white">{externalProviderName}</strong> outside Nexus Core. Buying through an external link does not sync order confirmation here and does not generate a scannable entry QR code in Nexus Core — keep your {externalProviderName} receipt/pass for admission.
                      </span>
                    </div>

                    <a
                      href={externalTicketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <span>Buy Tickets on {externalProviderName}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : isNativePaidBoxOffice ? (
                  <div className="bg-gradient-to-br from-blue-950/50 via-[#0c121e] to-zinc-950 border border-blue-500/40 rounded-2xl p-4 shadow-xl shadow-blue-950/30 space-y-3 relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                            <span>Official Box Office</span>
                            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">Instant In-App QR Delivery • Smart Escrow Protected</div>
                        </div>
                      </div>

                      {activeEventData.price && (
                        <div className="sm:text-right">
                          <span className="inline-block text-xs font-black text-emerald-400 font-mono px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 shadow break-words max-w-full">
                            {activeEventData.price}
                          </span>
                        </div>
                      )}
                    </div>

                    {customTicketTiers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {customTicketTiers.map((tier, idx) => (
                          <span
                            key={tier.id || `tier-chip-${idx}`}
                            className="px-2 py-1 rounded-lg bg-zinc-950/90 border border-blue-500/25 text-[10px] font-mono text-zinc-200"
                          >
                            {tier.name}: <strong className="text-emerald-400">${tier.price}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onCheckoutTicket ? onCheckoutTicket(activeEventData) : null}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>
                        {customTicketTiers.length > 1
                          ? `Choose from ${customTicketTiers.length} Ticket Tiers`
                          : `Buy Tickets ${activeEventData.price ? `(${activeEventData.price})` : '• In-App Pass'}`}
                      </span>
                    </button>
                  </div>
                ) : isTicketSetup && admissionInfo.isFreeOrDoorOnly ? (
                  <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white uppercase tracking-wider">Door / Venue Admission</div>
                          <div className="text-[10px] text-zinc-400 font-mono">Handled at venue door • No online pre-sale required</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                        {admissionInfo.label}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                          <Ticket className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-zinc-400 uppercase tracking-wider">Ticketing Status</div>
                          <div className="text-[10px] text-zinc-500 font-mono">Box office not yet linked for this event</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                        Not Setup
                      </span>
                    </div>

                    <button
                      disabled
                      type="button"
                      className="w-full py-3 bg-zinc-900/80 border border-zinc-800/90 text-zinc-500 font-bold text-xs uppercase tracking-wider rounded-xl cursor-not-allowed flex items-center justify-center gap-2 select-none"
                    >
                      <Ticket className="w-4 h-4 text-zinc-600" />
                      <span>Tickets Not Yet Setup for this Event</span>
                    </button>
                  </div>
                )}

                {/* 4. EVENT SCHEDULE & SAFETY GRID */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0b0d10] p-3 rounded-2xl border border-zinc-900 text-left font-mono">
                    <Clock className="w-4 h-4 text-rose-500 mb-1" />
                    <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Gate Schedule</div>
                    <div className="text-xs text-white font-black mt-1.5">
                      {formatTimeTo12h(activeEventData.time || 'Doors 8:00 PM')}
                    </div>
                  </div>
                  <div className="bg-[#0b0d10] p-3 rounded-2xl border border-zinc-900 text-left font-mono">
                    <Shield className="w-4 h-4 text-rose-500 mb-1" />
                    <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Safety Code</div>
                    <div className="text-[11px] text-zinc-400 font-bold mt-1.5 leading-tight">
                      {activeEventData.safety_code || activeEventData.safetyCode || 'Bag search / 18+ ID / Earplugs Rec'}
                    </div>
                  </div>
                </div>

                {/* 4. GATE ENTRY & QR PASS STATUS */}
                {externalTicketUrl ? (
                  <div className="bg-[#0b0d10] border border-amber-500/30 rounded-2xl p-4 text-center space-y-2.5">
                    <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono text-[9px] font-bold uppercase tracking-widest border border-amber-500/30">
                      External Entry Pass Only
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      QR Pass Issued by {externalProviderName}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                      Because tickets are sold off-platform, Nexus Core cannot verify third-party purchases or display a scannable door QR code here. Marking Going below is social only.
                    </p>
                  </div>
                ) : purchasedPass ? (
                  <div className="bg-[#0b0d10] border border-emerald-500/40 rounded-2xl p-4 text-center space-y-3.5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                      <QrCode className="w-7 h-7" />
                    </div>

                    <div>
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold uppercase tracking-widest border border-emerald-500/30 mb-1.5">
                        NEXUS PASS VERIFIED
                      </div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight">
                        {purchasedPass.data?.ticketType || 'Standard Admission Pass'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Present your Digital Escrow pass barcode at the venue gate ({purchasedPass.quantity || 1}x pass)
                      </p>
                    </div>

                    {isTicketScanned ? (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-0.5">
                        <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> SCANNED & ADMITTED
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">Gate Timestamp: {scanTime}</div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsTicketScanned(true);
                          setScanTime(new Date().toLocaleTimeString());
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" /> Simulate Door Scan
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#0b0d10] border border-zinc-800 rounded-2xl p-4 text-center space-y-2.5">
                    <div className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-mono text-[9px] font-bold uppercase tracking-widest border border-zinc-800">
                      {isNativePaidBoxOffice ? 'No In-App Pass Purchased Yet' : 'Door / Unlinked Entry'}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                      {isNativePaidBoxOffice
                        ? 'Purchase a ticket through the Official Box Office above to generate a scannable entry QR code. RSVPs below are social only.'
                        : 'No scannable in-app QR pass is required or configured for this listing. Admission is managed at the venue door.'}
                    </p>
                  </div>
                )}

                {/* 4. INTERACTIVE RSVP LIST & ATTENDANCE TRACKER */}
                <div className="bg-[#0b0d10] border border-zinc-800/90 rounded-2xl p-4 space-y-3.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Fan Attendance & RSVP
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-zinc-400">
                      <span className="text-emerald-400 font-bold">{rsvpCounts.going} Going</span>
                      <span>•</span>
                      <span className="text-amber-400">{rsvpCounts.maybe} Maybe</span>
                    </div>
                  </div>

                  {/* 3 RSVP Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Going */}
                    <button
                      type="button"
                      onClick={() => handleRsvpChange('going')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black font-mono uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        rsvpStatus === 'going'
                          ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : 'bg-zinc-900/80 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Flame className={`w-3.5 h-3.5 ${rsvpStatus === 'going' ? 'text-emerald-400 fill-emerald-400' : 'text-zinc-500'}`} />
                        <span>Going</span>
                      </div>
                      <span className="text-[9px] font-normal text-zinc-400">
                        {rsvpCounts.going} fans
                      </span>
                    </button>

                    {/* Maybe */}
                    <button
                      type="button"
                      onClick={() => handleRsvpChange('maybe')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black font-mono uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        rsvpStatus === 'maybe'
                          ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'bg-zinc-900/80 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <HelpCircle className={`w-3.5 h-3.5 ${rsvpStatus === 'maybe' ? 'text-amber-400' : 'text-zinc-500'}`} />
                        <span>Maybe</span>
                      </div>
                      <span className="text-[9px] font-normal text-zinc-400">
                        {rsvpCounts.maybe} fans
                      </span>
                    </button>

                    {/* Can't Make It */}
                    <button
                      type="button"
                      onClick={() => handleRsvpChange('cant_make')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black font-mono uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        rsvpStatus === 'cant_make'
                          ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                          : 'bg-zinc-900/80 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <XCircle className={`w-3.5 h-3.5 ${rsvpStatus === 'cant_make' ? 'text-rose-400' : 'text-zinc-500'}`} />
                        <span>Can't Go</span>
                      </div>
                      <span className="text-[9px] font-normal text-zinc-400">
                        {rsvpCounts.cant_make}
                      </span>
                    </button>
                  </div>

                  {/* Attendance Roster Preview */}
                  <div className="pt-2 border-t border-zinc-900/80 flex items-center justify-between">
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-rose-600 border-2 border-black flex items-center justify-center text-[9px] font-black text-white">
                        M
                      </div>
                      <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-black flex items-center justify-center text-[9px] font-black text-white">
                        K
                      </div>
                      <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-black flex items-center justify-center text-[9px] font-black text-white">
                        D
                      </div>
                      <div className="w-6 h-6 rounded-full bg-amber-600 border-2 border-black flex items-center justify-center text-[9px] font-black text-white">
                        S
                      </div>
                      {rsvpStatus === 'going' && (
                        <div className="w-6 h-6 rounded-full bg-[#00ffcc] border-2 border-black flex items-center justify-center text-[9px] font-black text-black">
                          YOU
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {rsvpStatus ? `Your RSVP: ${rsvpStatus.toUpperCase().replace('_', ' ')}` : 'Tap to cast your attendance RSVP'}
                    </span>
                  </div>
                </div>

              </div>
            )}

            {eventModeTab === 'setlist' && (
              <div className="max-w-md mx-auto space-y-4 animate-in fade-in duration-300 pb-8">
                
                {/* 1. TOUR REFERENCE HEADER & FULL LINEUP OVERVIEW */}
                <div className="bg-[#0b0d10] border border-zinc-800/80 rounded-2xl p-4 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black tracking-widest text-rose-500 uppercase font-mono block">
                        TOUR REFERENCE & LINEUP
                      </span>
                      <h3 className="text-sm font-black text-white uppercase tracking-tight">
                        {activeEventData.headliner} CIRCUIT
                      </h3>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shrink-0 shadow text-rose-500">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Full Tour Billing Lineup */}
                  <div className="space-y-2 pt-1 border-t border-zinc-900">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      Official Show Lineup ({fullLineup.length} Acts)
                    </div>
                    <div className="space-y-1.5">
                      {fullLineup.map((band, idx) => {
                        const isHeadliner = idx === 0;
                        const isSupport = idx === 1;
                        return (
                          <div
                            key={`lineup-band-${band}-${idx}`}
                            className={`p-2 rounded-xl flex items-center justify-between border ${
                              isHeadliner
                                ? 'bg-rose-950/20 border-rose-500/40 text-white'
                                : isSupport
                                ? 'bg-amber-950/20 border-amber-500/30 text-zinc-200'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                isHeadliner
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : isSupport
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {isHeadliner ? '👑 HEADLINER' : isSupport ? '🎸 SUPPORT' : `⚡ ACT ${idx + 1}`}
                              </span>
                              <span className="text-xs font-black uppercase tracking-wide">
                                {band}
                              </span>
                            </div>
                            {(() => {
                              const setTimeVal = isHeadliner 
                                ? (activeEventData.set_time || activeEventData.time) 
                                : (activeEventData.support_lineup?.[idx - 1]?.set_time);
                              if (!setTimeVal) return null;
                              return (
                                <span className="text-[9px] font-mono text-zinc-400">
                                  {setTimeVal}
                                </span>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. SETLISTS (COLLAPSED BY DEFAULT ACCORDIONS) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      Expected Setlists (Tap to Expand)
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">
                      Zero-Maintenance Static Cache
                    </span>
                  </div>

                  {fullLineup.map((band, idx) => {
                    const upperBand = band.toUpperCase();
                    const tracks: string[] | null = (
                      liveSetlists[upperBand] ||
                      bandSetlists[upperBand] ||
                      activeEventData?.setlists?.[upperBand] ||
                      null
                    );
                    
                    const isExpanded = !!expandedSetlists[band];

                    return (
                      <div
                        key={`setlist-accordion-${band}-${idx}`}
                        className="bg-[#0b0d10] border border-zinc-800/90 rounded-2xl overflow-hidden transition-all duration-200 shadow-md"
                      >
                        {/* Collapsed Header Bar */}
                        <button
                          type="button"
                          onClick={() => toggleSetlistAccordion(band)}
                          className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                              <Music className="w-3.5 h-3.5 text-rose-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-white uppercase tracking-wide truncate">
                                {band} Setlist
                              </div>
                              <div className="text-[9.5px] font-mono text-zinc-400">
                                {tracks ? `${tracks.length} Songs • Expected Tour Roster` : 'Setlist Pending Tour Desk Submission'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[9px] font-mono font-bold uppercase text-zinc-400 hidden xs:inline">
                              {isExpanded ? 'Collapse' : 'View Tracks'}
                            </span>
                            <div className={`w-5 h-5 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-rose-400' : ''}`}>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </button>

                        {/* Collapsed by Default Body */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-zinc-900/80 bg-zinc-950/80 p-3 divide-y divide-zinc-900"
                            >
                              {tracks && tracks.length > 0 ? (
                                tracks.map((song, songIdx) => (
                                  <div
                                    key={`companion-song-${band}-${song}-${songIdx}`}
                                    className="flex items-center justify-between py-2.5 px-2 hover:bg-zinc-900/30 transition-all rounded-lg"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="font-mono text-[10px] text-rose-500/70 font-bold tracking-widest shrink-0 w-5">
                                        {(songIdx + 1).toString().padStart(2, '0')}
                                      </span>
                                      <span className="text-xs font-bold text-zinc-200 truncate">
                                        {song}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {songIdx >= tracks.length - 2 && (
                                        <span className="text-[8px] font-mono text-amber-400/90 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded mr-1">
                                          Encore
                                        </span>
                                      )}
                                      <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">
                                        STANDARD
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="py-4 text-center space-y-1">
                                  <p className="text-xs text-zinc-400 font-medium">
                                    Setlist not yet submitted for this tour stop.
                                  </p>
                                  <p className="text-[9px] font-mono text-zinc-400">
                                    Auto-syncs once sound check logs are registered.
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center py-2">
                  <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">
                    • CURATED BY NEXUS TOUR DESK • STATICALLY CACHED FOR SPOTTY CONNECTIONS •
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default EventCompanionModal;
