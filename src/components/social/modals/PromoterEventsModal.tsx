import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  Search, 
  Flame, 
  Sparkles, 
  Plus, 
  Check, 
  Share2, 
  ExternalLink, 
  Music, 
  Users, 
  Building, 
  AlertCircle, 
  CalendarPlus, 
  Bell, 
  Download,
  History,
  Archive,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  QrCode,
  TicketCheck
} from 'lucide-react';
import { fetchArchiveShowsFromDatabase, ArchiveShowItem, parseVenueAndAddress, classifyEventType } from '../../../services/archiveShowsService';
import BandClaimHandoverModal from './BandClaimHandoverModal';
import { communityBandManager, CommunityBandRecord } from '../../../lib/communityBands';
import { syncShowRsvpWithServer, trigger24hShowRemindersOnServer } from '../../../lib/pushNotifications';

export interface PromoterEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoterProfile: any;
  userProfile?: any;
  shows?: any[];
  triggerNotification?: (msg: string) => void;
  openCheckout?: (itemType: string, details?: any) => void;
  onSelectEvent?: (event: any) => void;
}

export interface PromoterEventItem {
  id: string;
  title: string;
  type: 'festival' | 'tour' | 'club_gig' | 'showcase';
  date: string;
  dateRaw?: string;
  venue: string;
  venueAddress?: string;
  city: string;
  lineup: string[];
  doorsTime?: string;
  setTime?: string;
  price?: string;
  ticketStatus: 'on_sale' | 'selling_fast' | 'presale' | 'sold_out';
  ticketUrl?: string;
  description?: string;
  bannerUrl?: string;
  isFeatured?: boolean;
}

// Default upcoming anchor events are empty so non-real mock events are removed
const DEFAULT_NEXUS_UPCOMING_EVENTS: PromoterEventItem[] = [];

export const PromoterEventsModal: React.FC<PromoterEventsModalProps> = ({
  isOpen,
  onClose,
  promoterProfile,
  userProfile,
  shows = [],
  triggerNotification,
  openCheckout,
  onSelectEvent
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Event Form State (for promoter self)
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventVenue, setNewEventVenue] = useState(
    Array.isArray(promoterProfile?.active_venues) && promoterProfile.active_venues.length > 0 
      ? promoterProfile.active_venues[0] 
      : 'Live Venue'
  );
  const [newEventCity, setNewEventCity] = useState(promoterProfile?.location || 'Chicago, IL');
  const [newLineupText, setNewLineupText] = useState('');
  const [newEventType, setNewEventType] = useState<'festival' | 'tour' | 'club_gig'>('festival');
  const [newEventPrice, setNewEventPrice] = useState('$25.00');
  const [localCustomEvents, setLocalCustomEvents] = useState<PromoterEventItem[]>([]);

  // RSVP'd Shows State (stored in localStorage)
  const [rsvpedShowIds, setRsvpedShowIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nexus_rsvped_shows');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Reminders Set State
  const [remindedShowIds, setRemindedShowIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nexus_show_reminders');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Claimed Fan Passes State (stored in localStorage)
  const [claimedPassShowIds, setClaimedPassShowIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nexus_claimed_passes');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Selected Pass Show for Digital Fan Pass Modal
  const [selectedPassShow, setSelectedPassShow] = useState<PromoterEventItem | null>(null);

  // Supporting Band Claim Record for BandClaimHandoverModal
  const [claimingBandRecord, setClaimingBandRecord] = useState<CommunityBandRecord | null>(null);

  // Additional Past Shows Filters
  const [pastYearFilter, setPastYearFilter] = useState<string>('all');
  const [pastTypeFilter, setPastTypeFilter] = useState<string>('all');

  // Track expanded cards state (collapsed by default)
  const [expandedShowIds, setExpandedShowIds] = useState<Set<string>>(new Set());

  const toggleExpandShow = (showId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedShowIds(prev => {
      const next = new Set(prev);
      if (next.has(showId)) {
        next.delete(showId);
      } else {
        next.add(showId);
      }
      return next;
    });
  };

  // Handle Pass Issue / Toggle
  const handleGetPass = (event: PromoterEventItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setClaimedPassShowIds(prev => {
      const next = new Set(prev);
      next.add(event.id);
      try {
        localStorage.setItem('nexus_claimed_passes', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });
    setSelectedPassShow(event);
    triggerNotification?.(`🎟️ Digital Guest Entry Pass issued for "${event.title}"!`);
  };

  // Handle Supporting Band Profile Claim
  const handleClaimBandProfile = (bandName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let bandRecord = communityBandManager.findByName(bandName);
    if (!bandRecord) {
      bandRecord = communityBandManager.upsertCommunityBand({
        name: bandName,
        band_name: bandName,
        genre: 'Metal / Hardcore',
        verification_status: 'community_archive'
      });
    }
    setClaimingBandRecord(bandRecord);
  };

  const [dbArchiveShows, setDbArchiveShows] = useState<ArchiveShowItem[]>([]);
  const [isLoadingArchives, setIsLoadingArchives] = useState<boolean>(false);

  // Load custom stored promoter events
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexus_promoter_custom_events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocalCustomEvents(parsed);
        }
      }
    } catch (_) {}
  }, []);

  // Fetch historic database archive shows involving this band or promoter
  useEffect(() => {
    let isMounted = true;
    const loadArchives = async () => {
      setIsLoadingArchives(true);
      try {
        const archives = await fetchArchiveShowsFromDatabase(
          promoterProfile?.user_id || promoterProfile?.id || undefined
        );
        if (isMounted) {
          setDbArchiveShows(archives || []);
        }
      } catch (e) {
        console.warn('[PromoterEventsModal] Failed to load archive shows:', e);
      } finally {
        if (isMounted) setIsLoadingArchives(false);
      }
    };
    if (isOpen) {
      loadArchives();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, promoterProfile?.id, promoterProfile?.user_id]);

  if (!isOpen) return null;

  const promoterName = promoterProfile?.entity_name || promoterProfile?.corporate_name || promoterProfile?.band_name || promoterProfile?.name || 'Live Calendar';
  const promoterAvatar = promoterProfile?.promoter_logo || promoterProfile?.avatar_url || promoterProfile?.avatar || '';
  const isOwner = Boolean(
    promoterProfile?.isYou || 
    (userProfile?.id && (promoterProfile?.user_id === userProfile?.id || promoterProfile?.id === userProfile?.id)) ||
    (userProfile?.email && promoterProfile?.email === userProfile?.email)
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // Map dbArchiveShows to PromoterEventItem format
  const archiveEvents: (PromoterEventItem & { isPast?: boolean; attendance?: string; milestone?: string; historicalNotes?: string; bannerUrl?: string })[] = dbArchiveShows.map(a => {
    const { venueName, venueAddress } = parseVenueAndAddress(a);
    const evType = classifyEventType(a);

    return {
      id: a.id || `archive_${a.year}_${Math.random().toString(36).substring(2, 7)}`,
      title: a.title,
      type: evType as any,
      date: a.date || String(a.year),
      dateRaw: a.date,
      venue: venueName,
      venueAddress: a.venueAddress || venueAddress,
      city: a.city || 'Chicago, IL',
      lineup: Array.isArray(a.lineup) ? a.lineup : [],
      doorsTime: 'ARCHIVED',
      setTime: 'CONCLUDED',
      price: 'COMPLETED',
      ticketStatus: 'sold_out',
      description: a.historicalNotes || a.notes || 'Archived historic show.',
      isPast: true,
      attendance: a.attendance,
      milestone: a.milestone,
      historicalNotes: a.historicalNotes,
      bannerUrl: a.flyerUrl,
      creator_id: a.user_id,
      user_id: a.user_id,
      promoter_id: a.promoter_id,
      band_id: a.band_id
    };
  });

  // Consolidate shows from Supabase and defaults
  const allEvents: (PromoterEventItem & { isPast?: boolean; attendance?: string; milestone?: string; historicalNotes?: string; bannerUrl?: string })[] = [
    ...localCustomEvents,
    ...DEFAULT_NEXUS_UPCOMING_EVENTS,
    // Map any active live shows from DB
    ...(shows || []).filter(s => {
      if (s.is_published === false || s.publication_status === 'embargoed_private' || s.publication_status === 'draft' || s.status === 'Draft' || s.status === 'Embargoed') {
        return false;
      }
      return true;
    }).map(s => {
      const lineupArray = Array.isArray(s.lineup)
        ? s.lineup
        : (s.lineup ? String(s.lineup).split(',').map((x: string) => x.trim()) : [s.headliner || s.name].filter(Boolean));

      const rawDate = s.date || s.show_date || '';
      const isPast = Boolean(rawDate && rawDate.split('T')[0] < todayStr);

      const { venueName, venueAddress } = parseVenueAndAddress(s);
      const evType = classifyEventType(s);

      return {
        id: String(s.id || Math.random().toString(36).substring(2, 9)),
        title: s.festival_name || s.tour_name || s.name || s.title || 'Live Show',
        type: evType as any,
        date: s.date || s.show_date || 'TBA',
        dateRaw: rawDate,
        venue: venueName,
        venueAddress: venueAddress,
        city: s.city ? (s.state_province ? `${s.city}, ${s.state_province}` : s.city) : 'Chicago, IL',
        lineup: lineupArray,
        doorsTime: s.doors_time || '7:00 PM',
        setTime: s.set_time || '8:00 PM',
        price: s.price ? (String(s.price).startsWith('$') ? String(s.price) : `$${s.price}`) : '$25.00',
        ticketStatus: (s.ticket_status || 'on_sale') as any,
        ticketUrl: s.ticket_link || s.ticket_url,
        description: s.additional_notes || s.description || 'Confirmed live extreme metal show.',
        isPast
      };
    }),
    ...archiveEvents
  ];

  // Deduplicate by title + date
  const seenKeys = new Set<string>();
  const deduplicatedEvents = allEvents.filter(ev => {
    const key = `${ev.title.toLowerCase().trim()}_${ev.date.toLowerCase().trim()}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  // Toggle RSVP for a show
  const toggleRsvp = (event: PromoterEventItem) => {
    setRsvpedShowIds(prev => {
      const next = new Set(prev);
      const isRsvped = next.has(event.id);
      if (isRsvped) {
        next.delete(event.id);
        triggerNotification?.(`Cancelled RSVP for "${event.title}"`);
        syncShowRsvpWithServer({
          show_id: event.id,
          show_title: event.title,
          show_date: event.dateRaw || event.date,
          venue_name: event.venue,
          city: event.city,
          user_id: userProfile?.id,
          user_email: userProfile?.email,
          action: 'cancel'
        });
      } else {
        next.add(event.id);
        triggerNotification?.(`🔥 RSVP Confirmed! Added "${event.title}" to your Pit List.`);
        
        // Sync RSVP with server show_rsvps table & register VAPID push subscription
        syncShowRsvpWithServer({
          show_id: event.id,
          show_title: event.title,
          show_date: event.dateRaw || event.date,
          venue_name: event.venue,
          city: event.city,
          user_id: userProfile?.id,
          user_email: userProfile?.email,
          action: 'rsvp'
        });

        // Dispatch global event for Sonic XP & timeline feeds
        try {
          window.dispatchEvent(new CustomEvent('nexus_show_rsvped', {
            detail: { showId: event.id, title: event.title }
          }));
        } catch (_) {}
      }
      try {
        localStorage.setItem('nexus_rsvped_shows', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });
  };

  // Toggle Reminder
  const toggleReminder = (event: PromoterEventItem) => {
    setRemindedShowIds(prev => {
      const next = new Set(prev);
      const isReminded = next.has(event.id);
      if (isReminded) {
        next.delete(event.id);
        triggerNotification?.(`⏰ Reminder removed for "${event.title}"`);
      } else {
        next.add(event.id);
        triggerNotification?.(`⏰ 24h VAPID push reminder scheduled for "${event.title}"!`);
        // Sync RSVP with show_rsvps table to guarantee 24h push delivery
        syncShowRsvpWithServer({
          show_id: event.id,
          show_title: event.title,
          show_date: event.dateRaw || event.date,
          venue_name: event.venue,
          city: event.city,
          user_id: userProfile?.id,
          user_email: userProfile?.email,
          action: 'rsvp'
        });
      }
      try {
        localStorage.setItem('nexus_show_reminders', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });
  };

  // Add to Google Calendar / Apple Calendar
  const handleAddToCalendar = (event: PromoterEventItem) => {
    const rawDateStr = event.dateRaw || event.date || '';
    let startIso = rawDateStr.replace(/[^0-9]/g, '').slice(0, 8);
    if (startIso.length < 8) {
      const now = new Date();
      startIso = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    }

    const title = encodeURIComponent(event.title);
    const location = encodeURIComponent(`${event.venue}, ${event.city}`);
    const details = encodeURIComponent(
      `${event.description || 'Live Show'}\n\nLineup: ${event.lineup?.join(', ')}\nDoors: ${event.doorsTime || '6:00 PM'}\nTickets: ${event.price || 'GA'}`
    );

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}T200000Z/${startIso}T235900Z&details=${details}&location=${location}`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
    triggerNotification?.(`📅 Opening Calendar export for "${event.title}"...`);
  };

  // Download .ics file
  const handleDownloadIcs = (event: PromoterEventItem) => {
    const rawDateStr = event.dateRaw || event.date || '';
    let startIso = rawDateStr.replace(/[^0-9]/g, '').slice(0, 8);
    if (startIso.length < 8) {
      const now = new Date();
      startIso = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexus Extreme Metal//Live Shows Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}-${Date.now()}@nexuslive.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startIso}T200000Z`,
      `DTEND:${startIso}T235900Z`,
      `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}\\nLineup: ${(event.lineup || []).join(', ')}`,
      `LOCATION:${event.venue.replace(/,/g, '\\,')}\\, ${event.city.replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotification?.(`📅 Downloaded "${event.title}.ics" calendar invite!`);
  };

  const targetName = (
    promoterProfile?.band_name ||
    promoterProfile?.name ||
    promoterProfile?.full_name ||
    promoterProfile?.entity_name ||
    promoterProfile?.corporate_name ||
    ''
  ).trim().toLowerCase();

  const targetId = promoterProfile?.id || promoterProfile?.user_id || promoterProfile?.band_id;

  const isPromoterType = Boolean(
    promoterProfile?.account_type === 'promoter' ||
    promoterProfile?.role?.toLowerCase().includes('promoter') ||
    promoterProfile?.is_promoter ||
    promoterProfile?.promoter_logo
  );

  const isEventMatchingProfile = (ev: PromoterEventItem & { isPast?: boolean; creator_id?: string; user_id?: string; promoter_id?: string; band_id?: string }) => {
    // 1. Direct ID match
    if (targetId) {
      if (
        ev.creator_id === targetId ||
        ev.user_id === targetId ||
        ev.promoter_id === targetId ||
        ev.band_id === targetId
      ) {
        return true;
      }
    }

    // 2. Lineup / Title match for artists
    if (targetName && targetName.length >= 2) {
      const matchInLineup = Array.isArray(ev.lineup) && ev.lineup.some(b => {
        const bName = typeof b === 'string' ? b.toLowerCase() : String(b).toLowerCase();
        return bName.includes(targetName) || targetName.includes(bName);
      });
      if (matchInLineup) {
        return true;
      }

      if (
        ev.title.toLowerCase().includes(targetName) ||
        (ev.description && ev.description.toLowerCase().includes(targetName))
      ) {
        return true;
      }
    }

    // 3. If promoter account and title matches or no specific artist restriction
    if (isPromoterType && (!targetName || ev.title.toLowerCase().includes(targetName))) {
      return true;
    }

    // If neither name nor ID matched, exclude this event from this band's profile
    return false;
  };

  // Only keep events that actually belong to / feature this band or promoter
  const profileEvents = deduplicatedEvents.filter(isEventMatchingProfile);

  const myRsvpCount = profileEvents.filter(ev => rsvpedShowIds.has(ev.id)).length;
  const pastEventsCount = profileEvents.filter(ev => ev.isPast || (ev.dateRaw && ev.dateRaw.split('T')[0] < todayStr)).length;

  const filteredEvents = profileEvents.filter(ev => {
    const isPastDate = Boolean(ev.dateRaw && ev.dateRaw.split('T')[0] < todayStr);
    const isPastShow = Boolean(ev.isPast || isPastDate);

    if (filterType === 'rsvps') {
      return rsvpedShowIds.has(ev.id);
    }
    
    if (filterType === 'past') {
      if (!isPastShow) return false;

      // Year Filter
      if (pastYearFilter !== 'all') {
        const dateStr = (ev.date || '') + ' ' + (ev.dateRaw || '');
        if (!dateStr.includes(pastYearFilter)) {
          return false;
        }
      }

      // Type Filter
      if (pastTypeFilter !== 'all') {
        if (pastTypeFilter === 'festival' && ev.type !== 'festival') return false;
        if (pastTypeFilter === 'tour' && ev.type !== 'tour') return false;
        if (pastTypeFilter === 'club_gig' && ev.type !== 'club_gig' && ev.type !== 'showcase') return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchVenue = (ev.venue || '').toLowerCase().includes(q);
        const matchVenueAddr = (ev.venueAddress || '').toLowerCase().includes(q);
        const matchCity = (ev.city || '').toLowerCase().includes(q);
        const matchDate = (ev.date || '').toLowerCase().includes(q);
        const matchLineup = Array.isArray(ev.lineup) && ev.lineup.some(b => typeof b === 'string' && b.toLowerCase().includes(q));
        const matchNotes = (ev.description || ev.historicalNotes || '').toLowerCase().includes(q);

        if (!matchTitle && !matchVenue && !matchVenueAddr && !matchCity && !matchDate && !matchLineup && !matchNotes) {
          return false;
        }
      }

      return true;
    }

    // For upcoming categories, filter out past shows
    if (isPastShow) {
      return false;
    }

    if (filterType !== 'all') {
      if (filterType === 'festival' && ev.type !== 'festival') return false;
      if (filterType === 'tour' && ev.type !== 'tour') return false;
      if (filterType === 'club_gig' && ev.type !== 'club_gig' && ev.type !== 'showcase') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchVenue = (ev.venue || '').toLowerCase().includes(q);
      const matchVenueAddr = (ev.venueAddress || '').toLowerCase().includes(q);
      const matchCity = (ev.city || '').toLowerCase().includes(q);
      const matchLineup = Array.isArray(ev.lineup) && ev.lineup.some(b => typeof b === 'string' && b.toLowerCase().includes(q));
      if (!matchTitle && !matchVenue && !matchVenueAddr && !matchCity && !matchLineup) return false;
    }
    return true;
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate.trim()) {
      triggerNotification?.('⚠️ Please provide an event title and date.');
      return;
    }

    const created: PromoterEventItem = {
      id: `ev_${Date.now()}`,
      title: newEventTitle.trim(),
      type: newEventType,
      date: newEventDate.trim(),
      dateRaw: newEventDate.trim(),
      venue: newEventVenue.trim(),
      city: newEventCity.trim(),
      lineup: newLineupText.split(',').map(s => s.trim()).filter(Boolean),
      doorsTime: '6:30 PM',
      setTime: '7:00 PM',
      price: newEventPrice.trim() || '$25.00',
      ticketStatus: 'on_sale',
      description: `Official event announced by ${promoterName}.`
    };

    const updated = [created, ...localCustomEvents];
    setLocalCustomEvents(updated);
    try {
      localStorage.setItem('nexus_promoter_custom_events', JSON.stringify(updated));
    } catch (_) {}

    triggerNotification?.(`⚡ Created upcoming event: ${created.title}!`);
    setShowAddForm(false);
    setNewEventTitle('');
    setNewLineupText('');
  };

  return (
    <div 
      className="fixed inset-0 z-[10000000] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-zinc-950 border border-yellow-500/40 rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.2)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Accent Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {promoterAvatar ? (
              <img 
                src={promoterAvatar} 
                alt={promoterName} 
                className="w-12 h-12 rounded-xl object-cover border border-yellow-500/50 shadow-md shrink-0" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono truncate">
                  {promoterName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  ⚡ UPCOMING SHOWS & LIVE CALENDAR
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                Confirmed gigs, festival dates, personal RSVP tracking & calendar reminders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black rounded-lg uppercase font-mono flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Event</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Events"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Owner Add Event Drawer */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateEvent}
              className="border-b border-yellow-500/30 bg-zinc-900/90 p-4 sm:p-5 space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Fast Event Publishing
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Event / Festival Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Underground Metal Showcase"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NOV 28, 2026"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Live Music Club"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Chicago, IL"
                    value={newEventCity}
                    onChange={(e) => setNewEventCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Ticket Price</label>
                  <input
                    type="text"
                    placeholder="e.g. $25 Advance / $30 Door"
                    value={newEventPrice}
                    onChange={(e) => setNewEventPrice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Lineup Bands (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Headliner Band, Support 1, Support 2"
                  value={newLineupText}
                  onChange={(e) => setNewLineupText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2">
                  {(['festival', 'tour', 'club_gig'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewEventType(t)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                        newEventType === t 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase font-mono rounded-lg transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Publish to Live Events
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Controls: Filter Pills & Search */}
        <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-zinc-950/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {[
              { id: 'all', label: 'All Upcoming' },
              { id: 'past', label: `📜 Past Shows & Tours (${pastEventsCount})` },
              { id: 'rsvps', label: `🔥 My RSVPs (${myRsvpCount})` },
              { id: 'festival', label: 'Festivals' },
              { id: 'tour', label: 'Tours' },
              { id: 'club_gig', label: 'Club Gigs' }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterType(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-mono transition-all whitespace-nowrap cursor-pointer ${
                  filterType === pill.id
                    ? 'bg-yellow-500 text-black font-black shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search band, festival, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        {/* Secondary Sub-Bar for Past Shows Search & Filter */}
        {filterType === 'past' && (
          <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                Past Shows Search Filters:
              </span>

              {/* Year Dropdown */}
              <select
                value={pastYearFilter}
                onChange={(e) => setPastYearFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">📅 All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>

              {/* Show Type Dropdown */}
              <select
                value={pastTypeFilter}
                onChange={(e) => setPastTypeFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">🎪 All Event Types</option>
                <option value="tour">🚀 Tour Stops</option>
                <option value="festival">🔥 Festivals</option>
                <option value="club_gig">🎸 Club Gigs</option>
              </select>

              {(pastYearFilter !== 'all' || pastTypeFilter !== 'all' || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setPastYearFilter('all');
                    setPastTypeFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="text-[11px] text-zinc-400">
              Showing <strong className="text-amber-300">{filteredEvents.length}</strong> past dates
            </div>
          </div>
        )}

        {/* Events Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-zinc-900/30 rounded-2xl border border-zinc-850 p-6">
              <Calendar className="w-12 h-12 text-zinc-600 mx-auto animate-pulse" />
              <h3 className="text-sm font-mono font-black text-zinc-300 uppercase tracking-wider">
                {filterType === 'rsvps' ? 'No RSVPs Yet' : 'No upcoming shows currently scheduled'}
              </h3>
              <p className="text-xs text-zinc-500 font-mono max-w-md mx-auto">
                {filterType === 'rsvps'
                  ? "You haven't RSVP'd to any shows yet. Click the 'RSVP / Pit List' flame icon on any event to build your personal live calendar and set reminders."
                  : "Confirmed tour dates and festival appearances will automatically appear here once published."}
              </p>
              {isOwner && filterType !== 'rsvps' && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase font-mono rounded-xl inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Announce First Show
                </button>
              )}
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isExpanded = expandedShowIds.has(event.id);
              const isPastShow = Boolean(event.isPast || (event.dateRaw && event.dateRaw.split('T')[0] < todayStr) || filterType === 'past');
              const isFest = event.type === 'festival';
              const isTour = event.type === 'tour';
              const isRsvped = rsvpedShowIds.has(event.id);
              const isReminded = remindedShowIds.has(event.id);

              // Filter out duplicate active band name from supporting lineup array
              const cleanedLineup = (event.lineup || []).filter((band: string) => {
                if (!band) return false;
                const bLower = String(band).trim().toLowerCase();
                if (!bLower) return false;
                // Exclude if targetName is already present in title
                if (targetName && bLower === targetName && event.title.toLowerCase().includes(targetName)) {
                  return false;
                }
                // Exclude if title equals band name exactly
                if (event.title.trim().toLowerCase() === bLower) {
                  return false;
                }
                return true;
              });

              return (
                <div
                  key={event.id}
                  className={`group bg-zinc-900/70 hover:bg-zinc-900 border ${
                    isRsvped ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.12)]' : 'border-zinc-800 hover:border-yellow-500/40'
                  } rounded-xl transition-all duration-200 shadow-md overflow-hidden`}
                >
                  {/* Collapsed Bar / Summary Header (Clickable to Expand) */}
                  <div 
                    onClick={(e) => toggleExpandShow(event.id, e)}
                    className="p-3.5 sm:p-4 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/40 hover:bg-zinc-900/60 transition-colors"
                  >
                    {/* Left: Date & Main Summary */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Date Badge */}
                      <div className="shrink-0 w-16 sm:w-20 text-center bg-zinc-950 border border-zinc-800 group-hover:border-yellow-500/30 rounded-lg p-2 shadow-inner">
                        <div className="text-[10px] font-mono uppercase font-bold text-yellow-400 leading-none">
                          {event.date.split(' ')[0] || 'DATE'}
                        </div>
                        <div className="text-base sm:text-lg font-black text-white font-mono leading-tight mt-0.5">
                          {event.date.split(' ')[1]?.replace(',', '') || '—'}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500">
                          {event.date.includes('202') ? event.date.slice(-4) : (event.dateRaw ? event.dateRaw.slice(0, 4) : '2026')}
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-wider ${
                            isFest 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : isTour
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {isFest ? 'FESTIVAL' : isTour ? 'TOUR STOP' : 'CLUB GIG'}
                          </span>

                          {isPastShow ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono bg-zinc-800 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                              <History className="w-3 h-3 text-amber-400" />
                              PAST SHOW ARCHIVE
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {event.ticketStatus ? event.ticketStatus.replace('_', ' ') : 'ON SALE'}
                            </span>
                          )}

                          {isRsvped && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                              <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                              RSVP
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-mono group-hover:text-yellow-400 transition-colors truncate">
                          {event.title}
                        </h3>

                        {/* PROMINENT VENUE NAME & ADDRESS */}
                        <div className="text-xs sm:text-sm font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="font-black text-amber-300 uppercase tracking-wide bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {event.venue}
                          </span>
                          {event.venueAddress && event.venueAddress !== event.venue && (
                            <span className="text-zinc-400 font-medium text-xs">
                              📍 {event.venueAddress}
                            </span>
                          )}
                          <span className="text-zinc-500 font-bold">•</span>
                          <span className="text-zinc-300 font-semibold">{event.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price/Status & Collapse Toggle Button */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {isPastShow ? (
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-500 border border-zinc-800">
                          CONCLUDED
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-black text-yellow-400">
                          {event.price || '$25.00'}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => toggleExpandShow(event.id, e)}
                        className="p-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
                        title={isExpanded ? 'Collapse show details' : 'Expand show details'}
                      >
                        <span className="hidden sm:inline text-[10px] uppercase font-bold text-zinc-400">
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-yellow-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Card Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-zinc-800/80 bg-zinc-950/60 p-4 sm:p-5 space-y-4"
                      >
                        {/* Featured Venue Box */}
                        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                          <div>
                            <div className="text-[10px] font-mono text-yellow-400 uppercase font-black tracking-wider flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-yellow-400" /> Featured Venue & Location
                            </div>
                            <div className="text-base sm:text-lg font-black text-amber-300 font-mono uppercase tracking-wide mt-0.5">
                              {event.venue}
                            </div>
                            {event.venueAddress && event.venueAddress !== event.venue && (
                              <div className="text-xs font-mono text-amber-200/90 font-medium mt-0.5">
                                📍 Address: <span className="text-zinc-200">{event.venueAddress}</span>
                              </div>
                            )}
                            <div className="text-xs font-mono text-zinc-400 mt-0.5">
                              🌆 City/Region: <strong className="text-zinc-200">{event.city}</strong>
                            </div>
                          </div>

                          <div className="text-left sm:text-right font-mono text-xs text-zinc-400 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
                            {!isPastShow && (
                              <div>Doors: <span className="text-white font-bold">{event.doorsTime || '6:00 PM'}</span></div>
                            )}
                            <div>Status: <span className="text-amber-400 font-bold uppercase">{isPastShow ? 'Concluded Show' : event.ticketStatus}</span></div>
                          </div>
                        </div>

                        {/* Milestone & Attendance */}
                        {(event.milestone || event.attendance) && (
                          <div className="flex items-center gap-3 flex-wrap">
                            {event.milestone && (
                              <div className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>{event.milestone}</span>
                              </div>
                            )}
                            {event.attendance && (
                              <div className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                                👥 Official Attendance: <strong className="text-white">{event.attendance}</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Cleaned Lineup (Without double band name!) */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-mono text-zinc-400 uppercase font-bold flex items-center gap-1">
                            <Music className="w-3.5 h-3.5 text-yellow-500/70" />
                            {cleanedLineup.length > 0 ? 'Supporting Lineup & Performers:' : 'Band Lineup:'}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Target Band Header Tag */}
                            {targetName && (
                              <span className="px-2.5 py-1 bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 rounded-lg text-xs font-mono font-black uppercase tracking-wide">
                                ⭐ {promoterProfile?.band_name || promoterProfile?.name || targetName}
                              </span>
                            )}
                            {cleanedLineup.map((band: string, idx: number) => {
                              const bandRec = communityBandManager.findByName(band);
                              const isClaimed = bandRec?.verification_status === 'verified_official';

                              return (
                                <div 
                                  key={`${event.id}-band-${idx}`}
                                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-mono font-semibold flex items-center gap-2"
                                >
                                  <span>{band}</span>
                                  {!isClaimed && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleClaimBandProfile(band, e)}
                                      className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                      title={`Claim official Nexus profile for ${band}`}
                                    >
                                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                                      <span>Claim Profile</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Description / Historical Notes */}
                        {event.description && (
                          <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-300 font-mono leading-relaxed">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
                              {isPastShow ? '📜 Show Notes & Archival Overview:' : 'Event Details:'}
                            </div>
                            <p>{event.description}</p>
                          </div>
                        )}

                        {/* Action Buttons (Disabled for Past/Completed Shows) */}
                        <div className="pt-2 border-t border-zinc-850 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          {/* Quick Calendar & RSVP Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* RSVP Action */}
                            <button
                              type="button"
                              disabled={isPastShow}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isPastShow) toggleRsvp(event);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black uppercase transition-all flex items-center gap-1.5 border ${
                                isPastShow
                                  ? 'bg-zinc-900/60 text-zinc-600 border-zinc-850 cursor-not-allowed opacity-60'
                                  : isRsvped
                                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-950/40 cursor-pointer'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-amber-500/40 cursor-pointer'
                              }`}
                              title={isPastShow ? 'RSVP disabled for concluded shows' : 'Toggle show RSVP'}
                            >
                              <Flame className={`w-3.5 h-3.5 ${isPastShow ? 'text-zinc-600' : isRsvped ? 'fill-black text-black' : 'text-amber-400'}`} />
                              <span>
                                {isPastShow ? 'RSVP Closed' : isRsvped ? 'In Pit (RSVP’d)' : 'RSVP to Show'}
                              </span>
                            </button>

                            {/* Add to Google Calendar */}
                            <button
                              type="button"
                              disabled={isPastShow}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isPastShow) handleAddToCalendar(event);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all border flex items-center gap-1.5 ${
                                isPastShow
                                  ? 'bg-zinc-900/60 text-zinc-600 border-zinc-850 cursor-not-allowed opacity-60'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700 cursor-pointer'
                              }`}
                              title={isPastShow ? 'Calendar export disabled for past shows' : 'Add to Google Calendar'}
                            >
                              <CalendarPlus className={`w-3.5 h-3.5 ${isPastShow ? 'text-zinc-600' : 'text-yellow-400'}`} />
                              <span>Google Cal</span>
                            </button>

                            {/* Download .ICS File */}
                            <button
                              type="button"
                              disabled={isPastShow}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isPastShow) handleDownloadIcs(event);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all border flex items-center gap-1.5 ${
                                isPastShow
                                  ? 'bg-zinc-900/60 text-zinc-600 border-zinc-850 cursor-not-allowed opacity-60'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700 cursor-pointer'
                              }`}
                              title={isPastShow ? '.ICS export disabled for past shows' : 'Download .ICS calendar invite'}
                            >
                              <Download className={`w-3.5 h-3.5 ${isPastShow ? 'text-zinc-600' : 'text-zinc-400'}`} />
                              <span>.ICS</span>
                            </button>

                            {/* Set Reminder */}
                            <button
                              type="button"
                              disabled={isPastShow}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isPastShow) toggleReminder(event);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
                                isPastShow
                                  ? 'bg-zinc-900/60 text-zinc-600 border-zinc-850 cursor-not-allowed opacity-60'
                                  : isReminded
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/60 cursor-pointer'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800 cursor-pointer'
                              }`}
                              title={isPastShow ? 'Reminders disabled for past shows' : 'Set show reminder'}
                            >
                              <Bell className={`w-3.5 h-3.5 ${isPastShow ? 'text-zinc-600' : isReminded ? 'fill-purple-400 text-purple-400' : 'text-zinc-400'}`} />
                              <span>
                                {isPastShow ? 'Reminder Expired' : isReminded ? 'Reminder Set' : 'Remind Me'}
                              </span>
                            </button>
                          </div>

                          {/* Get Passes CTA */}
                          <div>
                            <button
                              type="button"
                              disabled={isPastShow}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isPastShow) return;
                                handleGetPass(event, e);
                              }}
                              className={`w-full sm:w-auto px-4 py-2 text-xs font-black uppercase font-mono rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                isPastShow
                                  ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed opacity-60 shadow-none'
                                  : claimedPassShowIds.has(event.id)
                                  ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer'
                                  : 'bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-black shadow-[0_0_15px_rgba(234,179,8,0.25)] cursor-pointer'
                              }`}
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>
                                {isPastShow 
                                  ? 'Passes Expired (Concluded)' 
                                  : claimedPassShowIds.has(event.id) 
                                  ? '🎟️ Pass Issued (View Pass)' 
                                  : 'Get Guest Pass'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-zinc-500 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Showing {filteredEvents.length} {filterType === 'rsvps' ? 'RSVP’d' : 'confirmed'} live dates</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-mono text-xs transition-colors cursor-pointer"
          >
            Close View
          </button>
        </div>

        {/* Digital Fan Pass Modal Overlay */}
        {selectedPassShow && (
          <div className="fixed inset-0 z-[1000010] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#090a0f] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono">
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TicketCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white uppercase text-sm tracking-wider">Digital Guest Entry Pass</h3>
                </div>
                <button
                  onClick={() => setSelectedPassShow(null)}
                  className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pass Body */}
              <div className="p-5 space-y-4">
                {/* Pass Graphic Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-amber-500/30 shadow-lg relative overflow-hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-black">
                        VIP PIT ACCESS PASS
                      </span>
                      <h4 className="text-base font-black text-white uppercase tracking-wide mt-1">
                        {selectedPassShow.title}
                      </h4>
                    </div>
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  </div>

                  <div className="text-xs text-zinc-300 space-y-1 pt-2 border-t border-zinc-850">
                    <div>📍 Venue: <strong className="text-amber-300">{selectedPassShow.venue}</strong></div>
                    {selectedPassShow.venueAddress && (
                      <div className="text-zinc-400">Address: {selectedPassShow.venueAddress}</div>
                    )}
                    <div>🌆 City: {selectedPassShow.city}</div>
                    <div>📅 Date: <strong className="text-white">{selectedPassShow.date}</strong></div>
                    <div>⏰ Doors: {selectedPassShow.doorsTime || '7:00 PM'}</div>
                  </div>

                  {/* Barcode Graphic */}
                  <div className="pt-3 border-t border-dashed border-zinc-800 flex flex-col items-center justify-center space-y-1">
                    <div className="flex gap-1 items-center h-8 bg-white p-2 rounded w-full justify-center">
                      {[...Array(24)].map((_, i) => (
                        <div key={i} className={`h-full ${i % 3 === 0 ? 'w-1.5 bg-black' : i % 2 === 0 ? 'w-1 bg-black' : 'w-0.5 bg-black'}`} />
                      ))}
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
                      PASS #{selectedPassShow.id.slice(-8).toUpperCase()} • VALIDATED
                    </span>
                  </div>
                </div>

                {/* Reminder Toggle */}
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${remindedShowIds.has(selectedPassShow.id) ? 'text-purple-400 fill-purple-400' : 'text-zinc-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-white">Show Reminder Notification</div>
                      <div className="text-[10px] text-zinc-400">Receive an alert 24 hours before doors open</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleReminder(selectedPassShow)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                      remindedShowIds.has(selectedPassShow.id)
                        ? 'bg-purple-900 text-purple-200 border border-purple-500'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {remindedShowIds.has(selectedPassShow.id) ? 'Enabled' : 'Enable'}
                  </button>
                </div>
                {/* Test VAPID Push Trigger */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      triggerNotification?.("⚡ Triggering 24h VAPID push reminder service...");
                      const res = await trigger24hShowRemindersOnServer();
                      if (res.success) {
                        triggerNotification?.(`🔔 VAPID Push Service executed! Checked ${res.checked || 0} RSVPs (${res.remindersSent || 0} push sent)`);
                      } else {
                        triggerNotification?.("🔔 VAPID Push Service triggered!");
                      }
                    }}
                    className="w-full py-1.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 rounded-lg text-[10px] text-purple-300 font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3 h-3 text-purple-400" /> Test 24h VAPID Push Notification Service
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved to My Profile Passes
                </span>

                <button
                  onClick={() => setSelectedPassShow(null)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Supporting Band Claim Handover Modal */}
        {claimingBandRecord && (
          <BandClaimHandoverModal
            isOpen={Boolean(claimingBandRecord)}
            onClose={() => setClaimingBandRecord(null)}
            bandRecord={claimingBandRecord}
            currentUserId={userProfile?.id || promoterProfile?.id || 'guest'}
            onClaimSuccess={(claimedBand) => {
              triggerNotification?.(`🎉 Successfully claimed official profile for "${claimedBand.name}"!`);
              setClaimingBandRecord(null);
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default PromoterEventsModal;
