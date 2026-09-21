import React, { useState, useEffect, useRef } from 'react';
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
  Trash2
} from 'lucide-react';
import { bandSetlists } from '../../../data/socialFeedMockData';
import { formatTimeTo12h, hasGigTickets } from '../../../utils/socialFeedUtils';


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
    // Reset expanded setlists to collapsed by default for each opened show
    setExpandedSetlists({});

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

    // If clicking the same status, toggle off
    if (prevStatus === status) {
      newStatus = null;
      localStorage.removeItem(`nexus_event_rsvp_${eventId}_${userKey}`);
    } else {
      localStorage.setItem(`nexus_event_rsvp_${eventId}_${userKey}`, status);
    }

    setRsvpStatus(newStatus);

    // Adjust live counts
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

    if (triggerNotification) {
      if (newStatus === 'going') {
        triggerNotification('RSVP Confirmed', `You are marked as GOING to ${activeEventData.headliner}!`, '🔥');
      } else if (newStatus === 'maybe') {
        triggerNotification('RSVP Updated', `Marked as MAYBE for ${activeEventData.headliner}.`, '🤔');
      } else if (newStatus === 'cant_make') {
        triggerNotification('RSVP Updated', `Marked as CAN'T MAKE IT for this show.`, '❌');
      }
    }

    // Persist to Supabase if table exists
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

  // Reference to auto-scroll pit wall messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or load venue pit wall messages for the active event
  useEffect(() => {
    if (!activeEventData) return;
    const eventId = activeEventData.id || activeEventData.headliner || 'default_event';
    const storageKey = `nexus_venue_pitwall_${eventId}`;

    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVenueMessages(parsed);
          return;
        }
      } catch (e) {
        console.warn("Could not parse cached pit messages", e);
      }
    }

    // Default high-energy seed messages for this specific venue & show
    const venueName = activeEventData.venue || 'The Venue';
    const headliner = activeEventData.headliner || 'Tonight\'s Show';
    const seedMessages = [
      {
        id: `seed-1-${eventId}`,
        user_id: 'seed-system',
        username: 'Pit Host',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        text: `Welcome to the live Pit Wall for ${headliner} at ${venueName}! Keep it brutal 🤘`,
        timestamp: 'Showtime',
        is_official: true
      },
      {
        id: `seed-2-${eventId}`,
        user_id: 'seed-user-1',
        username: 'Jax_Riff',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        text: 'Soundcheck sounded monstrous outside! Doors moving quick.',
        timestamp: '15m ago'
      },
      {
        id: `seed-3-${eventId}`,
        user_id: 'seed-user-2',
        username: 'Valkyrie_V',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        text: 'Merch table has the tour-exclusive vinyls. Grab em before they vanish 🔥',
        timestamp: '8m ago'
      }
    ];

    setVenueMessages(seedMessages);
    try {
      localStorage.setItem(storageKey, JSON.stringify(seedMessages));
    } catch (_) {}
  }, [activeEventData?.id, activeEventData?.headliner, activeEventData?.venue]);

  // Auto-scroll when switching to chat or when new messages arrive
  useEffect(() => {
    if (eventModeTab === 'chat') {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [eventModeTab, venueMessages.length]);

  const handleSendVenueMessage = (textToSend?: string) => {
    const rawText = textToSend !== undefined ? textToSend : venueMessageInput;
    const text = (rawText || '').trim();
    if (!text || !activeEventData) return;

    // Resolve sender identity with fallback so guest/unregistered users are NEVER blocked
    let guestId = 'guest_fan';
    try {
      let stored = localStorage.getItem('nexus_guest_user_id');
      if (!stored) {
        stored = `guest_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('nexus_guest_user_id', stored);
      }
      guestId = stored;
    } catch (_) {}

    const senderId = userProfile?.id || guestId;
    const senderName = userProfile?.username || userProfile?.name || userProfile?.full_name || 'Fan In The Pit';
    const senderAvatar = userProfile?.avatar_url || userProfile?.avatar || userProfile?.profileAvatarUrl || '';

    const payload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: senderId,
      username: senderName,
      avatar_url: senderAvatar,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString()
    };

    // 1. Optimistic local state update IMMEDIATELY
    setVenueMessages(prev => {
      const updated = [...prev, payload];
      const eventId = activeEventData.id || activeEventData.headliner || 'default_event';
      try {
        localStorage.setItem(`nexus_venue_pitwall_${eventId}`, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    setVenueMessageInput('');

    // 2. Broadcast via Supabase and insert into table if available
    try {
      const supabaseClient = getSupabase ? getSupabase() : null;
      if (supabaseClient) {
        supabaseClient.channel(`venue_chat_${activeEventData.id || activeEventData.headliner}`).send({
          type: 'broadcast',
          event: 'venue_msg',
          payload: payload
        });

        supabaseClient.from('nexus_venue_chat').insert({
          event_id: activeEventData.id || null,
          profile_id: userProfile?.id || null,
          sender_name: senderName,
          message: text,
          created_at: new Date().toISOString()
        }).then(({ error }: any) => {
          if (error) console.warn("Supabase venue chat sync note:", error.message);
        });
      }
    } catch (err) {
      console.warn("Realtime broadcast note:", err);
    }
  };

  // Determine if tickets are setup for this event
  const isTicketSetup = hasGigTickets(activeEventData);

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
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex flex-col zoom-in-95 duration-300"
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-zinc-900 bg-black/80 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/50 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white font-black uppercase tracking-wider leading-tight text-sm sm:text-base truncate">
                    {activeEventData.headliner}
                  </h2>
                  {activeEventData.date && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                      {activeEventData.date}
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
          <div className="flex border-b border-zinc-900 bg-zinc-950/60">
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
              <Music className="w-3.5 h-3.5" />
              <span>Venue Pit Wall</span>
            </button>
          </div>

          {/* Tab Content */}
          {eventModeTab === 'chat' ? (
            <div className="flex-1 min-h-0 flex flex-col w-full max-w-2xl mx-auto overflow-hidden bg-black/40">
              {/* Venue Pit Wall Live Status Banner */}
              <div className="px-4 py-2.5 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex items-center justify-center shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
                    <span className="w-2 h-2 rounded-full bg-rose-500 relative" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-wider text-rose-400 truncate flex items-center gap-1.5">
                      <span>Venue Pit Wall</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800/60 text-rose-300 font-bold">
                        LIVE
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">
                      {activeEventData?.venue || 'The Venue'}{activeEventData?.city ? ` • ${activeEventData.city}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3 text-rose-400" />
                    <span>{venueMessages.length + 14} in pit</span>
                  </div>
                </div>
              </div>

              {/* Quick Reactions / Topics */}
              <div className="px-3 py-2 bg-zinc-950/60 border-b border-zinc-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {[
                  '🤘 Pit is crazy!',
                  '🔥 Merch booth open?',
                  '⚡ What is set time?',
                  '🍻 Who is in front row?',
                  '🔊 Sound is massive'
                ].map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setVenueMessageInput(tag);
                    }}
                    className="text-[10px] font-mono bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Messages Feed Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className="text-center text-[10px] text-zinc-500 uppercase tracking-widest font-mono py-1">
                  — Real-time Attendee & Fan Chat —
                </div>

                {venueMessages.map((msg, i) => {
                  const isMe = msg.user_id === userProfile?.id || (userProfile?.username && msg.username === userProfile?.username);
                  return (
                    <div
                      key={msg.id ? `venue-msg-${msg.id}-${i}` : `venue-msg-${i}`}
                      className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full ${
                          isMe ? 'bg-rose-600' : 'bg-zinc-800 border border-zinc-700'
                        } flex items-center justify-center text-xs text-white font-bold shrink-0 overflow-hidden shadow`}
                      >
                        {msg.avatar_url ? (
                          <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          msg.username?.[0]?.toUpperCase() || '🤘'
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                          isMe
                            ? 'bg-rose-600 text-white rounded-tr-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold truncate ${isMe ? 'text-rose-200' : 'text-zinc-400'}`}>
                            {msg.username || 'Metal Fan'}
                          </span>
                          {msg.timestamp && (
                            <span className={`text-[9px] font-mono ${isMe ? 'text-rose-200/70' : 'text-zinc-500'}`}>
                              {msg.timestamp}
                            </span>
                          )}
                        </div>
                        <p className="leading-relaxed break-words text-[13px]">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}

                {venueMessages.length === 0 && (
                  <div className="text-center text-xs text-zinc-400 py-12 flex flex-col items-center gap-2">
                    <MessageSquare className="w-8 h-8 text-zinc-600 animate-pulse" />
                    <p className="font-bold text-zinc-300">The Pit Wall is quiet.</p>
                    <p className="text-[11px] text-zinc-500 max-w-xs">
                      Drop the first message below to alert the venue, attendees, and fans!
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Pinned Bottom Chat Input */}
              <div className="p-3 sm:p-4 bg-zinc-950/95 border-t border-zinc-800 sticky bottom-0 z-10 shrink-0 backdrop-blur-md">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendVenueMessage();
                  }}
                  className="flex items-center gap-2 max-w-xl mx-auto w-full"
                >
                  <div className="relative flex-1">
                    <input
                      id="venue-pit-wall-input"
                      type="text"
                      placeholder="Message the venue pit wall..."
                      className="w-full bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 focus:border-rose-500 rounded-full py-3 pl-4 pr-10 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all shadow-inner"
                      value={venueMessageInput}
                      onChange={(e) => setVenueMessageInput(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <button
                    id="venue-pit-wall-send-btn"
                    type="submit"
                    disabled={!venueMessageInput.trim()}
                    className="w-10 h-10 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-full flex items-center justify-center shrink-0 transition-all shadow-lg shadow-rose-950/60 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                    title="Send to Pit Wall"
                  >
                    <Send className="w-4 h-4" />
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
                    triggerNotification?.('📋 Address Copied', 'Venue location copied to clipboard');
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
                {isTicketSetup ? (
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
                          <div className="text-[10px] text-zinc-400 font-mono">Instant QR Delivery • Smart Escrow Protected</div>
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

                    <button
                      type="button"
                      onClick={() => onCheckoutTicket ? onCheckoutTicket(activeEventData) : null}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Buy Tickets {activeEventData.price ? `(${activeEventData.price})` : '• Presale Access'}</span>
                    </button>
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

                    {/* Greyed Out Ticket Button */}
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

                {/* 4. PASS & GATE ADMISSION SIMULATOR (ENTRY SCANNER) UNDER SCHEDULE & SAFETY */}
                <div className="bg-[#0b0d10] border border-zinc-800 rounded-2xl p-4 text-center space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-rose-500" />

                  <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
                    <QrCode className="w-7 h-7" />
                  </div>

                  <div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[9px] font-bold uppercase tracking-widest border border-rose-500/30 mb-1.5">
                      NEXUS PASS VERIFIED
                    </div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">VIP FLOOR & PIT ACCESS</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Present barcode at venue gate for gate check</p>
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
                      className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" /> Simulate Door Scan
                    </button>
                  )}
                </div>

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
