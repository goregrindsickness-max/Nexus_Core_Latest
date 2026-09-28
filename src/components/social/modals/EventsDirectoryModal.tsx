import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ArrowLeft,
  MapPin,
  Calendar,
  Ticket,
  Music,
  Navigation,
  Search,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Building,
  Clock,
  Sparkles,
  Map as MapIcon,
  List,
  Flame,
  Radio,
  Share2,
  DollarSign,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Database,
  DownloadCloud,
  RefreshCw,
  CheckCircle2,
  History,
  Archive,
  Tag,
  Info,
  Layers,
  Award
} from 'lucide-react';
import { getSupabase } from '../../../supabase';
import { showsStore } from '../../../utils/indexedDB';
import { resolveLocationCoordinates } from '../../../lib/geoResolution';

export interface EventsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMapEvent: any;
  setSelectedMapEvent: (evt: any) => void;
  selectedCityFilter: string;
  setSelectedCityFilter: (city: string) => void;
  mapFilterGenre: string;
  setMapFilterGenre: (genre: string) => void;
  userProfile: any;
  promoterProfile?: any;
  initialViewMode?: 'list' | 'map' | 'community_archives';
  triggerNotification?: (msg: string) => void;
  liveEvents?: any[];
  setLiveEvents?: React.Dispatch<React.SetStateAction<any[]>>;
  shows?: any[];
  setShows?: React.Dispatch<React.SetStateAction<any[]>>;
  onImportShowsFromTable?: () => Promise<void> | void;
  onOpenShowCreator?: () => void;
  onSelectEvent?: (evt: any) => void;
  onOpenEventPage?: (evt: any) => void;
}

/**
 * Determines whether a show was personally booked by the active promoter/user
 * vs being a community submitted show or DIY scene gig.
 */
export const checkIsPersonallyBooked = (show: any, userProfile?: any, promoterProfile?: any): boolean => {
  if (!show) return false;
  // If explicitly flagged as a community show, it was NOT personally booked
  if (show.is_community_submitted === true || show.is_community === true || show.source === 'community') {
    return false;
  }
  const uId = userProfile?.id;
  const pId = promoterProfile?.id;
  if (uId && (show.creator_id === uId || show.promoter_id === uId || show.user_id === uId)) {
    return true;
  }
  if (pId && (show.creator_id === pId || show.promoter_id === pId)) {
    return true;
  }
  if (show.is_promoter_show === true || show.booked_personally === true) {
    return true;
  }
  if (show.festival_name && String(show.festival_name).toLowerCase().includes('domination')) {
    return true;
  }
  return false;
};

/**
 * Checks whether a show is embargoed, private draft, or currently in confirmation
 * (e.g., Molested Divinity shows which are embargoed and unannounced).
 */
export const isEmbargoedShow = (show: any): boolean => {
  if (!show) return false;
  if (show.status === 'Embargoed' || show.status === 'Draft' || show.publication_status === 'embargoed_private' || show.publication_status === 'draft' || show.is_published === false) {
    return true;
  }
  const text = `${show.headliner || ''} ${show.band_name || ''} ${show.band || ''} ${show.name || ''} ${show.show_name || ''} ${show.title || ''} ${show.notes || ''} ${show.description || ''} ${Array.isArray(show.support) ? show.support.join(' ') : (show.support || '')} ${Array.isArray(show.lineup) ? show.lineup.map((l: any) => typeof l === 'string' ? l : (l.band || l.name)).join(' ') : ''}`.toLowerCase();
  if (text.includes('molested divinity') || text.includes('molesteddivinity') || text.includes('molested-divinity')) {
    return true;
  }
  return false;
};

// Color palette themes for distinct show card borders (underground / cyberpunk / scene aesthetic)
export const SHOW_BORDER_THEMES = [
  {
    name: 'cyan',
    border: 'border-cyan-500/55 hover:border-cyan-400',
    selectedBorder: 'border-cyan-400 ring-2 ring-cyan-400/80 shadow-[0_0_24px_rgba(6,182,212,0.35)] bg-gradient-to-br from-cyan-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(6,182,212,0.22)]',
    tagBg: 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300',
  },
  {
    name: 'fuchsia',
    border: 'border-fuchsia-500/55 hover:border-fuchsia-400',
    selectedBorder: 'border-fuchsia-400 ring-2 ring-fuchsia-400/80 shadow-[0_0_24px_rgba(217,70,239,0.35)] bg-gradient-to-br from-fuchsia-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(217,70,239,0.22)]',
    tagBg: 'bg-fuchsia-950/60 border-fuchsia-800/80 text-fuchsia-300',
  },
  {
    name: 'lime',
    border: 'border-lime-500/55 hover:border-lime-400',
    selectedBorder: 'border-lime-400 ring-2 ring-lime-400/80 shadow-[0_0_24px_rgba(132,204,22,0.35)] bg-gradient-to-br from-lime-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(132,204,22,0.22)]',
    tagBg: 'bg-lime-950/60 border-lime-800/80 text-lime-300',
  },
  {
    name: 'amber',
    border: 'border-amber-500/55 hover:border-amber-400',
    selectedBorder: 'border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.35)] bg-gradient-to-br from-amber-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(245,158,11,0.22)]',
    tagBg: 'bg-amber-950/60 border-amber-800/80 text-amber-300',
  },
  {
    name: 'rose',
    border: 'border-rose-500/55 hover:border-rose-400',
    selectedBorder: 'border-rose-400 ring-2 ring-rose-400/80 shadow-[0_0_24px_rgba(244,63,94,0.35)] bg-gradient-to-br from-rose-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(244,63,94,0.22)]',
    tagBg: 'bg-rose-950/60 border-rose-800/80 text-rose-300',
  },
  {
    name: 'violet',
    border: 'border-violet-500/55 hover:border-violet-400',
    selectedBorder: 'border-violet-400 ring-2 ring-violet-400/80 shadow-[0_0_24px_rgba(139,92,246,0.35)] bg-gradient-to-br from-violet-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(139,92,246,0.22)]',
    tagBg: 'bg-violet-950/60 border-violet-800/80 text-violet-300',
  },
  {
    name: 'emerald',
    border: 'border-emerald-500/55 hover:border-emerald-400',
    selectedBorder: 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_24px_rgba(16,185,129,0.35)] bg-gradient-to-br from-emerald-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(16,185,129,0.22)]',
    tagBg: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
  },
  {
    name: 'orange',
    border: 'border-orange-500/55 hover:border-orange-400',
    selectedBorder: 'border-orange-400 ring-2 ring-orange-400/80 shadow-[0_0_24px_rgba(249,115,22,0.35)] bg-gradient-to-br from-orange-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(249,115,22,0.22)]',
    tagBg: 'bg-orange-950/60 border-orange-800/80 text-orange-300',
  },
  {
    name: 'teal',
    border: 'border-teal-500/55 hover:border-teal-400',
    selectedBorder: 'border-teal-400 ring-2 ring-teal-400/80 shadow-[0_0_24px_rgba(20,184,166,0.35)] bg-gradient-to-br from-teal-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(20,184,166,0.22)]',
    tagBg: 'bg-teal-950/60 border-teal-800/80 text-teal-300',
  },
  {
    name: 'indigo',
    border: 'border-indigo-500/55 hover:border-indigo-400',
    selectedBorder: 'border-indigo-400 ring-2 ring-indigo-400/80 shadow-[0_0_24px_rgba(99,102,241,0.35)] bg-gradient-to-br from-indigo-950/30 to-[#090b10]',
    glow: 'hover:shadow-[0_0_18px_rgba(99,102,241,0.22)]',
    tagBg: 'bg-indigo-950/60 border-indigo-800/80 text-indigo-300',
  },
];

export const getShowBorderTheme = (idOrIndex: string | number) => {
  let num = 0;
  if (typeof idOrIndex === 'number') {
    num = idOrIndex;
  } else if (typeof idOrIndex === 'string') {
    for (let i = 0; i < idOrIndex.length; i++) {
      num = (num * 31 + idOrIndex.charCodeAt(i)) % 10000;
    }
  }
  return SHOW_BORDER_THEMES[Math.abs(num) % SHOW_BORDER_THEMES.length];
};

/**
 * Normalizes any show table row into a standardized Event Directory gig object
 */
export const normalizeShowToEventDirectoryItem = (show: any, idx: number = 0, userProfile?: any, promoterProfile?: any) => {
  const headliner = (show.headliner || show.band_name || show.name || show.show_name || 'Live Act').trim();
  const venue = (show.venue || show.venue_name || (show.name && !show.name.includes('Live') ? show.name : 'Underground Venue')).trim();
  const rawCity = show.city || 'Tour Stop';
  const rawState = show.state_province || '';
  const city = rawState ? `${rawCity}, ${rawState}` : rawCity;
  
  const isPersonallyBooked = checkIsPersonallyBooked(show, userProfile, promoterProfile);
  const isCommunityShow = !isPersonallyBooked || Boolean(show.is_community_submitted || show.is_community || show.source === 'community');

  // Format date display
  let dateDisplay = 'Upcoming';
  let isPast = false;
  const rawDate = show.date || show.show_date;
  if (rawDate) {
    try {
      const dateStr = String(rawDate).split('T')[0];
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const parsedDate = new Date(year, month, day);
        const today = new Date();
        const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        if (parsedDate.getTime() === todayNorm.getTime()) {
          dateDisplay = 'Tonight';
        } else if (parsedDate.getTime() === tomorrowNorm.getTime()) {
          dateDisplay = 'Tomorrow';
        } else if (parsedDate.getTime() < todayNorm.getTime()) {
          isPast = true;
          dateDisplay = parsedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        } else {
          dateDisplay = parsedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        }
      } else {
        dateDisplay = String(rawDate);
      }
    } catch {
      dateDisplay = String(rawDate);
    }
  }

  const isArchived = isPast || Boolean(show.additional_notes && String(show.additional_notes).includes('"archived":true'));

  const doorsVal = show.doors_time;
  const timeDisplay = doorsVal
    ? (String(doorsVal).toLowerCase().includes('door') ? doorsVal : `Doors ${doorsVal}`)
    : (show.set_time ? `Set ${show.set_time}` : (show.time || 'Doors 7:30 PM'));

  let priceDisplay = show.price;
  if (!priceDisplay) {
    if (show.day_of_show_price && show.presale_price) {
      priceDisplay = `$${show.presale_price} / $${show.day_of_show_price}`;
    } else if (show.presale_price) {
      priceDisplay = String(show.presale_price).startsWith('$') ? show.presale_price : `$${show.presale_price}`;
    } else if (show.ticket_price) {
      priceDisplay = `$${show.ticket_price}`;
    } else if (show.day_of_show_price) {
      priceDisplay = String(show.day_of_show_price).startsWith('$') ? show.day_of_show_price : `$${show.day_of_show_price}`;
    } else if (show.guarantee_amount && show.guarantee_amount > 0) {
      priceDisplay = `$${Math.min(45, Math.max(15, Math.round(show.guarantee_amount / 100)))}`;
    } else if (show.external_ticket_url) {
      priceDisplay = 'External Tickets';
    } else {
      priceDisplay = '$25';
    }
  }

  let supportList: string[] = [];
  if (Array.isArray(show.support)) {
    supportList = show.support;
  } else if (Array.isArray(show.lineup)) {
    supportList = show.lineup.map((l: any) => typeof l === 'string' ? l : (l.band || l.name)).filter(Boolean);
  } else if (typeof show.support === 'string' && show.support.trim()) {
    supportList = show.support.split(',').map((s: string) => s.trim());
  } else if (Array.isArray(show.guest_list) && show.guest_list.length > 0) {
    supportList = show.guest_list.slice(0, 3).map((g: any) => g.name || g.contact_name).filter(Boolean);
  }

  const ticketUrl = show.ticketUrl || show.ticket_url || show.external_ticket_url || '';
  const flyerUrl = show.flyerUrl || show.flyer_url || show.image || show.thumbnail || show.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
  const genre = show.genre || (show.micro_genres && show.micro_genres.length > 0 ? show.micro_genres.join(' / ') : 'Extreme Metal / Touring Route');

  // Derive coordinates accurately
  let lat = show.venue_lat || show.lat;
  let lng = show.venue_lng || show.lng;
  if (!lat || !lng) {
    const geo = resolveLocationCoordinates({
      city: rawCity || show.city,
      state: show.state_province || show.state,
      venueName: venue,
      festivalName: show.festival_name,
      venueLat: show.venue_lat || show.lat,
      venueLng: show.venue_lng || show.lng,
      fallbackKey: `${rawCity || ''} ${venue || ''} ${show.id || idx}`,
      stopIndex: idx
    });
    lat = geo.lat;
    lng = geo.lng;
  }

  return {
    ...show,
    id: show.id || `show-table-${idx}`,
    title: show.festival_name ? `${show.festival_name} (${venue})` : (show.name?.includes('Live') ? show.name : `${headliner} at ${venue}`),
    headliner,
    venue,
    venue_name: venue,
    venue_address: show.venue_address,
    city,
    state_province: show.state_province,
    country: show.country,
    date: dateDisplay,
    rawDate: rawDate || show.date,
    isPast,
    isArchived,
    isPersonallyBooked,
    isCommunityShow,
    is_community_submitted: Boolean(show.is_community_submitted || isCommunityShow),
    time: timeDisplay,
    price: priceDisplay,
    genre,
    support: supportList,
    ticketUrl,
    flyerUrl,
    verified: true,
    isFromShowsTable: true,
    source: 'shows_table',
    lat,
    lng,
    description: show.notes || show.description || `Official booked tour date at ${venue}. All advance sales, tour merchandise, and door entries active.`,
    ticketsAvailable: true,
    ticketStatus: 'active'
  };
};

const DEFAULT_CURATED_EVENTS: any[] = [];

export const EventsDirectoryModal: React.FC<EventsDirectoryModalProps> = ({
  isOpen,
  onClose,
  selectedMapEvent,
  setSelectedMapEvent,
  selectedCityFilter,
  setSelectedCityFilter,
  mapFilterGenre,
  setMapFilterGenre,
  userProfile,
  promoterProfile,
  initialViewMode,
  triggerNotification,
  liveEvents,
  setLiveEvents,
  shows,
  setShows,
  onImportShowsFromTable,
  onOpenShowCreator,
  onSelectEvent,
  onOpenEventPage
}) => {
  // View mode toggle: List (default upcoming) vs Map vs Community Archives
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'community_archives'>(initialViewMode || 'list');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Search & Filter States (Collapsed by default for maximum show list viewability)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archiveYearFilter, setArchiveYearFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'tonight' | 'tomorrow' | 'weekend' | 'upcoming' | 'archives'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [ticketOnly, setTicketOnly] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [localImportedShows, setLocalImportedShows] = useState<any[]>([]);

  // Calculate active filter count (excluding search query)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCityFilter && selectedCityFilter.toLowerCase() !== 'all') count++;
    if (mapFilterGenre && mapFilterGenre.toLowerCase() !== 'all') count++;
    if (dateFilter && dateFilter !== 'all' && dateFilter !== 'archives') count++;
    if (verifiedOnly) count++;
    if (ticketOnly) count++;
    return count;
  }, [selectedCityFilter, mapFilterGenre, dateFilter, verifiedOnly, ticketOnly]);

  // RSVP Pit List State
  const [rsvpedShowIds, setRsvpedShowIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('nexus_show_rsvps');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleShowRsvp = (showId: string, headliner?: string) => {
    setRsvpedShowIds(prev => {
      const next = new Set(prev);
      const isRsvped = next.has(showId);
      if (isRsvped) {
        next.delete(showId);
        triggerNotification?.(`Removed RSVP for ${headliner || 'show'}`);
      } else {
        next.add(showId);
        triggerNotification?.(`🔥 In Pit List! RSVP confirmed for ${headliner || 'show'}!`);
      }
      try {
        localStorage.setItem('nexus_show_rsvps', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });
  };

  // Google Calendar URL Generator
  const getGoogleCalendarUrl = (evt: any) => {
    if (!evt) return '#';
    const title = encodeURIComponent(evt.title || `${evt.headliner || 'Show'} Live`);
    const location = encodeURIComponent(`${evt.venue || ''}${evt.city ? `, ${evt.city}` : ''}`);
    const details = encodeURIComponent(evt.description || `Live show featuring ${evt.headliner}. ${evt.ticketUrl ? `Tickets: ${evt.ticketUrl}` : ''}`);
    
    let datePart = '';
    const rawDate = evt.rawDate || evt.show_date || evt.date;
    if (rawDate && /\d{4}-\d{2}-\d{2}/.test(String(rawDate))) {
      datePart = String(rawDate).split('T')[0].replace(/-/g, '');
    } else {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      datePart = today;
    }
    const dates = `${datePart}T200000Z/${datePart}T230000Z`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${details}`;
  };

  // AI Flyer Parser Modal State
  const [isAiFlyerModalOpen, setIsAiFlyerModalOpen] = useState(false);
  const [aiFlyerText, setAiFlyerText] = useState('');
  const [aiFlyerImage, setAiFlyerImage] = useState<string | null>(null);
  const [isAiParsing, setIsAiParsing] = useState(false);

  const handleParseFlyerWithAi = async () => {
    if (!aiFlyerText.trim() && !aiFlyerImage) {
      triggerNotification?.('⚠️ Please upload a flyer photo or paste show announcement text first.');
      return;
    }
    setIsAiParsing(true);
    try {
      const res = await fetch('/api/parse-show-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: aiFlyerImage,
          rawText: aiFlyerText
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const parsed = data.data;
        triggerNotification?.(`✨ AI Flyer parsed! Extracted "${parsed.headliner || 'Show'}" at ${parsed.venue_name || 'Venue'}.`);
        setIsAiFlyerModalOpen(false);
        setAiFlyerText('');
        setAiFlyerImage(null);
        if (onOpenShowCreator) {
          onClose();
          onOpenShowCreator();
          window.dispatchEvent(new CustomEvent('nexus_prefill_show_creator', { detail: parsed }));
        }
      } else {
        triggerNotification?.(`⚠️ AI Parsing notice: ${data.error || 'Check input text'}`);
      }
    } catch (err: any) {
      triggerNotification?.(`❌ Error parsing flyer: ${err.message || err}`);
    } finally {
      setIsAiParsing(false);
    }
  };

  // Open Full Event Companion Page handler
  const handleOpenFullEventPage = (event: any) => {
    if (!event) return;
    if (onOpenEventPage) {
      onOpenEventPage(event);
    }
    // Also dispatch custom window event for universal deep-linking across the app
    window.dispatchEvent(new CustomEvent('open-event-companion', { detail: event }));
    triggerNotification?.(`Opening event page: ${event.title || event.headliner || 'Show'}`);
  };

  // Function to aggregate all shows directly from the database, indexedDB and props into the directory
  const handleImportShowsFromTable = useCallback(async () => {
    setIsImporting(true);
    try {
      const allExtractedShows: any[] = [];

      // 1. Fetch directly from Supabase shows table
      try {
        const client = getSupabase();
        if (client) {
          const { data: dbShows, error: dbErr } = await client
            .from('shows')
            .select('*')
            .order('date', { ascending: true });

          if (!dbErr && dbShows && Array.isArray(dbShows) && dbShows.length > 0) {
            allExtractedShows.push(...dbShows);
          }
        }
      } catch (err) {
        console.warn('Direct Supabase fetch for shows table had an issue:', err);
      }

      // 2. Fetch from IndexedDB showsStore if available
      try {
        if (showsStore) {
          const idbList: any[] = [];
          await showsStore.iterate((value: any) => {
            if (Array.isArray(value)) {
              idbList.push(...value);
            } else if (value && typeof value === 'object') {
              idbList.push(value);
            }
          });
          if (idbList.length > 0) {
            allExtractedShows.push(...idbList);
          }
        }
      } catch (err) {
        console.warn('IndexedDB shows store read error:', err);
      }

      // 3. If props.shows provided, include them as well
      if (shows && Array.isArray(shows) && shows.length > 0) {
        allExtractedShows.push(...shows);
      }

      // 4. Deduplicate extracted shows by id or headliner + date
      const dedupedShows: any[] = [];
      const seenShowSigs = new Set<string>();

      allExtractedShows.forEach((s, idx) => {
        if (!s || isEmbargoedShow(s)) return;
        const sId = String(s.id || '').toLowerCase().trim();
        const sH = String(s.headliner || s.band_name || s.name || s.show_name || '').toLowerCase().trim();
        const sD = String(s.date || s.show_date || '').toLowerCase().trim();
        const sig = sId ? `id_${sId}` : `h_${sH}__${sD}`;

        if (!seenShowSigs.has(sig)) {
          seenShowSigs.add(sig);
          dedupedShows.push(normalizeShowToEventDirectoryItem(s, idx));
        }
      });

      setLocalImportedShows(dedupedShows);

      // If parent onImportShowsFromTable callback is provided, invoke it
      if (onImportShowsFromTable) {
        await onImportShowsFromTable();
      }

      // Update parent liveEvents if setLiveEvents is available
      if (setLiveEvents && dedupedShows.length > 0) {
        setLiveEvents((prev: any[]) => {
          const currentList = Array.isArray(prev) ? prev.filter(e => !isEmbargoedShow(e)) : [];
          const existingSigs = new Set(
            currentList.map(e => String(e.id || '').toLowerCase().trim())
          );
          const toAdd = dedupedShows.filter(
            ds => !isEmbargoedShow(ds) && !existingSigs.has(String(ds.id).toLowerCase().trim())
          );
          return [...currentList, ...toAdd];
        });
      }
    } catch (err) {
      console.error('Error aggregating shows table:', err);
    } finally {
      setIsImporting(false);
    }
  }, [shows, setLiveEvents, onImportShowsFromTable]);

  // Auto-run show table import when modal opens if we don't have shows yet
  useEffect(() => {
    if (isOpen) {
      handleImportShowsFromTable();
    }
  }, [isOpen]);

  // Normalize incoming events combining database/props events, shows table items, and curated events
  const normalizedEvents = useMemo(() => {
    const rawList = (liveEvents && liveEvents.length > 0) ? liveEvents.filter(e => !isEmbargoedShow(e)) : [];
    
    // Merge liveEvents with localImportedShows and props.shows
    const combined = [...rawList];
    const seenSigs = new Set<string>();

    // Mark existing liveEvents
    combined.forEach(evt => {
      const idStr = String(evt.id || '').toLowerCase().trim();
      const sig = `${(evt.headliner || evt.title || evt.name || '').toLowerCase()}_${(evt.date || evt.rawDate || '').toLowerCase()}`;
      if (idStr) seenSigs.add(`id_${idStr}`);
      if (sig) seenSigs.add(`sig_${sig}`);
    });

    // Add locally imported shows
    localImportedShows.forEach((showItem, idx) => {
      if (isEmbargoedShow(showItem)) return;
      const idStr = String(showItem.id || '').toLowerCase().trim();
      const sig = `${(showItem.headliner || showItem.title || showItem.name || '').toLowerCase()}_${(showItem.date || showItem.rawDate || '').toLowerCase()}`;
      if (!seenSigs.has(`id_${idStr}`) && !seenSigs.has(`sig_${sig}`)) {
        seenSigs.add(`id_${idStr}`);
        seenSigs.add(`sig_${sig}`);
        combined.push(showItem);
      }
    });

    // Add shows from props.shows if not already present
    if (shows && Array.isArray(shows)) {
      shows.forEach((s, idx) => {
        if (isEmbargoedShow(s)) {
          return;
        }
        const normalized = normalizeShowToEventDirectoryItem(s, idx, userProfile, promoterProfile);
        const idStr = String(normalized.id || '').toLowerCase().trim();
        const sig = `${(normalized.headliner || normalized.title || normalized.name || '').toLowerCase()}_${(normalized.date || normalized.rawDate || '').toLowerCase()}`;
        if (!seenSigs.has(`id_${idStr}`) && !seenSigs.has(`sig_${sig}`)) {
          seenSigs.add(`id_${idStr}`);
          seenSigs.add(`sig_${sig}`);
          combined.push(normalized);
        }
      });
    }

    // Add curated items not yet in list
    DEFAULT_CURATED_EVENTS.forEach(curated => {
      if (isEmbargoedShow(curated)) return;
      const sig = `${(curated.headliner || curated.title).toLowerCase()}_${(curated.date || '').toLowerCase()}`;
      if (!seenSigs.has(`sig_${sig}`)) {
        combined.push(curated);
      }
    });

    return combined
      .filter(evt => !isEmbargoedShow(evt))
      .map((evt: any, idx: number) => {
      const headliner = evt.headliner || evt.band || evt.name || evt.title || 'Live Act';
      const venue = evt.venue || evt.venue_name || 'Underground Venue';
      const city = evt.city || (evt.state_province ? `${evt.state_province}` : 'Los Angeles, CA');
      const date = evt.date || 'Upcoming';
      const time = evt.time || evt.doors_time || 'Doors 8:00 PM';
      const price = evt.price || (evt.presale_price ? `$${evt.presale_price}` : '$25');
      const genre = evt.genre || (evt.micro_genres && evt.micro_genres.length > 0 ? evt.micro_genres.join(' / ') : 'Extreme Metal / Underground');
      
      let supportList: string[] = [];
      if (Array.isArray(evt.support)) {
        supportList = evt.support;
      } else if (Array.isArray(evt.lineup)) {
        supportList = evt.lineup.map((l: any) => typeof l === 'string' ? l : (l.band || l.name)).filter(Boolean);
      } else if (typeof evt.support === 'string' && evt.support.trim()) {
        supportList = evt.support.split(',').map((s: string) => s.trim());
      }

      const ticketUrl = evt.ticketUrl || evt.ticket_url || evt.external_ticket_url || '';
      const flyerUrl = evt.flyerUrl || evt.flyer_url || evt.image || evt.thumbnail || '';
      const verified = Boolean(evt.verified || evt.is_community_submitted || evt.isFollowed || evt.isFromShowsTable || evt.source === 'shows_table');
      const isFromShowsTable = Boolean(evt.isFromShowsTable || evt.source === 'shows_table');
      const isPersonallyBooked = checkIsPersonallyBooked(evt, userProfile, promoterProfile);
      const isCommunityShow = !isPersonallyBooked || Boolean(evt.is_community_submitted || evt.is_community || evt.source === 'community');

      return {
        ...evt,
        id: evt.id || `event-${idx}`,
        title: evt.title || `${headliner} at ${venue}`,
        headliner,
        venue,
        city,
        date,
        time,
        price,
        genre,
        support: supportList,
        ticketUrl,
        flyerUrl,
        verified,
        isFromShowsTable,
        isPersonallyBooked,
        isCommunityShow,
        is_community_submitted: isCommunityShow,
        lat: evt.lat || (34.0 + (idx % 8) * 0.1),
        lng: evt.lng || (-118.2 - (idx % 8) * 0.1),
        description: evt.description || (isFromShowsTable ? `Official booked tour date at ${venue}. Advance ticketing, tour merch and door entries active.` : `Live underground performance at ${venue}. All ages & support welcome.`),
        ticketsAvailable: Boolean(evt.ticketsAvailable || ticketUrl || evt.ticketStatus === 'active')
      };
    });
  }, [liveEvents, localImportedShows, shows, userProfile, promoterProfile]);

  // Dedicated list of community archive shows (shows concluded that were not booked personally by the promoter)
  const communityArchiveEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return normalizedEvents.filter(evt => {
      const isBooked = checkIsPersonallyBooked(evt, userProfile, promoterProfile);
      if (isBooked) return false;
      const rawDate = evt.rawDate || evt.date || '';
      const isPast = evt.isPast || evt.isArchived || (rawDate && String(rawDate).split('T')[0] < todayStr);
      return Boolean(isPast);
    });
  }, [normalizedEvents, userProfile, promoterProfile]);

  // Extract distinct years from community archives
  const archiveYears = useMemo(() => {
    const years = new Set<string>();
    communityArchiveEvents.forEach(evt => {
      const raw = String(evt.rawDate || evt.date || '');
      const match = raw.match(/\b(20\d{2})\b/);
      if (match) years.add(match[1]);
    });
    return Array.from(years).sort().reverse();
  }, [communityArchiveEvents]);

  // Filtered community archives based on search, city, genre, and year
  const filteredCommunityArchives = useMemo(() => {
    return communityArchiveEvents.filter(evt => {
      const q = (archiveSearchQuery || searchQuery).trim().toLowerCase();
      if (q) {
        const inHeadliner = (evt.headliner || '').toLowerCase().includes(q);
        const inTitle = (evt.title || '').toLowerCase().includes(q);
        const inVenue = (evt.venue || '').toLowerCase().includes(q);
        const inCity = (evt.city || '').toLowerCase().includes(q);
        const inGenre = (evt.genre || '').toLowerCase().includes(q);
        const inDesc = (evt.description || '').toLowerCase().includes(q);
        const inSupport = Array.isArray(evt.support) && evt.support.some((act: string) => act.toLowerCase().includes(q));
        if (!inHeadliner && !inTitle && !inVenue && !inCity && !inGenre && !inDesc && !inSupport) {
          return false;
        }
      }
      if (selectedCityFilter && selectedCityFilter.toLowerCase() !== 'all') {
        const targetCity = selectedCityFilter.toLowerCase().trim();
        const eventCity = (evt.city || '').toLowerCase().trim();
        if (!eventCity.includes(targetCity)) return false;
      }
      if (mapFilterGenre && mapFilterGenre.toLowerCase() !== 'all') {
        const targetGenre = mapFilterGenre.toLowerCase().trim();
        const eventGenre = (evt.genre || '').toLowerCase().trim();
        if (!eventGenre.includes(targetGenre)) return false;
      }
      if (archiveYearFilter && archiveYearFilter !== 'all') {
        const rawDate = String(evt.rawDate || evt.date || '');
        if (!rawDate.includes(archiveYearFilter)) return false;
      }
      return true;
    });
  }, [communityArchiveEvents, archiveSearchQuery, searchQuery, selectedCityFilter, mapFilterGenre, archiveYearFilter]);

  // Extract unique cities & genres for quick filtering
  const { uniqueCities, uniqueGenres } = useMemo(() => {
    const cities = new Set<string>();
    const genres = new Set<string>();
    normalizedEvents.forEach(evt => {
      if (evt.city) cities.add(evt.city.trim());
      if (evt.genre) {
        evt.genre.split(/[/,]/).forEach((g: string) => {
          const trimmed = g.trim();
          if (trimmed && trimmed.length > 2) genres.add(trimmed);
        });
      }
    });
    return {
      uniqueCities: Array.from(cities).sort(),
      uniqueGenres: Array.from(genres).slice(0, 10).sort()
    };
  }, [normalizedEvents]);

  // Filter application
  const filteredEvents = useMemo(() => {
    return normalizedEvents.filter(evt => {
      // 1. Search Query (Matches headliner, support bands, venue, city, or genre)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inHeadliner = evt.headliner.toLowerCase().includes(q);
        const inVenue = evt.venue.toLowerCase().includes(q);
        const inCity = evt.city.toLowerCase().includes(q);
        const inGenre = evt.genre.toLowerCase().includes(q);
        const inSupport = evt.support.some((act: string) => act.toLowerCase().includes(q));
        if (!inHeadliner && !inVenue && !inCity && !inGenre && !inSupport) {
          return false;
        }
      }

      // 2. City Filter
      if (selectedCityFilter && selectedCityFilter.toLowerCase() !== 'all') {
        const targetCity = selectedCityFilter.toLowerCase().trim();
        const eventCity = (evt.city || '').toLowerCase().trim();
        if (!eventCity.includes(targetCity)) {
          return false;
        }
      }

      // 3. Genre Filter
      if (mapFilterGenre && mapFilterGenre.toLowerCase() !== 'all') {
        const targetGenre = mapFilterGenre.toLowerCase().trim();
        const eventGenre = (evt.genre || '').toLowerCase().trim();
        if (!eventGenre.includes(targetGenre)) {
          return false;
        }
      }

      // 4. Date Presets Filter
      if (dateFilter && dateFilter !== 'all') {
        const d = (evt.date || '').toLowerCase();
        const rawDate = evt.rawDate || evt.date || '';
        const todayStr = new Date().toISOString().split('T')[0];
        const isPastEvent = evt.isPast || evt.isArchived || (rawDate && String(rawDate).split('T')[0] < todayStr);

        if (dateFilter === 'archives') {
          if (!isPastEvent) return false;
        } else {
          if (isPastEvent) return false;
          if (dateFilter === 'tonight' && !d.includes('tonight')) return false;
          if (dateFilter === 'tomorrow' && !d.includes('tomorrow')) return false;
          if (dateFilter === 'weekend' && (!d.includes('fri') && !d.includes('sat') && !d.includes('sun'))) return false;
          if (dateFilter === 'upcoming' && (d.includes('tonight') || d.includes('tomorrow'))) return false;
        }
      }

      // 5. Checkboxes (Verified, Tickets)
      if (verifiedOnly && !evt.verified) return false;
      if (ticketOnly && !evt.ticketsAvailable && !evt.ticketUrl) return false;

      return true;
    });
  }, [normalizedEvents, searchQuery, selectedCityFilter, mapFilterGenre, dateFilter, verifiedOnly, ticketOnly]);

  const activeEvent = selectedMapEvent ||
    (viewMode === 'community_archives' ? filteredCommunityArchives[0] : filteredEvents[0]) ||
    null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10050] bg-black/95 flex items-center justify-center p-1.5 sm:p-4 backdrop-blur-2xl animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            className="bg-[#0b0c10] border border-cyan-900/50 rounded-2xl w-full max-w-6xl h-[94vh] sm:h-[90vh] max-h-[900px] overflow-hidden flex flex-col relative shadow-[0_0_60px_rgba(6,182,212,0.18)]"
          >
            {/* TOP HEADER & TITLE BAR */}
            <div className="p-3.5 sm:p-4 border-b border-zinc-900 bg-black/80 flex flex-wrap items-center justify-between gap-3 shrink-0 relative pr-14 sm:pr-16">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  viewMode === 'community_archives'
                    ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                }`}>
                  {viewMode === 'community_archives' ? (
                    <History className="w-5 h-5" />
                  ) : (
                    <Calendar className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {/* Badge placed above the title */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 w-fit ${
                      viewMode === 'community_archives'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${viewMode === 'community_archives' ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400 animate-pulse'}`} />
                      {viewMode === 'community_archives'
                        ? `${filteredCommunityArchives.length} Concluded Shows`
                        : `${filteredEvents.length} Shows`}
                    </span>
                  </div>

                  <h2 className="text-white font-black uppercase text-sm sm:text-base tracking-widest font-mono flex items-center gap-2">
                    {viewMode === 'community_archives'
                      ? 'Community & Scene Show Archives'
                      : viewMode === 'map'
                      ? 'Radar Map Directory'
                      : 'Live Events & Gigs Directory'}
                  </h2>

                  <p className="text-[10px] text-zinc-400 font-mono hidden sm:block">
                    {viewMode === 'community_archives'
                      ? 'Archived and completed performances submitted by community bands and local scenes — kept separate from your personal promoter archives'
                      : 'Search upcoming tours, booked shows, local club dates, DIY gigs & festivals by city or band'}
                  </p>
                </div>
              </div>

              {/* View Mode Toggle (List vs Map vs Community Archives) & Action Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* List / Map / Community Archives View Switch */}
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('list');
                      if (dateFilter === 'archives') setDateFilter('all');
                      setMobileDetailOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Upcoming</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('map');
                      setMobileDetailOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'map'
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Radar Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('community_archives');
                      setDateFilter('archives');
                      setMobileDetailOpen(false);
                      triggerNotification?.('Viewing Community & Scene Show Archives');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'community_archives'
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20'
                        : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/30'
                    }`}
                    title="View archives specifically for community shows not booked personally"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Community Archives</span>
                  </button>
                </div>

                {/* Action Buttons: AI Flyer Auto-Fill & Post Show */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAiFlyerModalOpen(true);
                      triggerNotification?.('✨ AI Flyer & Text Auto-Fill Parser ready');
                    }}
                    className="hidden sm:flex text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 px-3 py-1.5 rounded-xl items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
                    title="Upload flyer photo or copy text to auto-fill show details using Gemini AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>AI Flyer Auto-Fill</span>
                  </button>

                  {onOpenShowCreator && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileDetailOpen(false);
                        onClose();
                        onOpenShowCreator();
                      }}
                      className="hidden sm:flex text-xs font-mono uppercase font-bold text-black bg-[#00ffcc] hover:bg-[#00ffcc]/90 px-3 py-1.5 rounded-xl items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
                    >
                      + Post Show
                    </button>
                  )}
                </div>
              </div>

              {/* Pinned Upper Right Corner Close Button */}
              <button
                onClick={() => {
                  setMobileDetailOpen(false);
                  onClose();
                }}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-md cursor-pointer z-20"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* INTEGRATED COLLAPSIBLE SEARCH & FILTER BAR */}
            <div className="bg-[#0c0d12] border-b border-zinc-900 shrink-0">
              {/* Primary Single-Row Toolbar (Search + Filters Toggle + Year Selector for Archives) */}
              <div className="p-2 sm:px-4 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Search Bar (Band, Venue, City, etc.) */}
                <div className="flex-1 min-w-[180px] relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      viewMode === 'community_archives'
                        ? 'Search archived shows, bands, venues...'
                        : 'Search by Band (e.g. Incantation), Venue, or City...'
                    }
                    className="w-full bg-black/70 border border-zinc-850 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Inline Year Filters when in Community Archives mode (eliminates need for bulky banner) */}
                {viewMode === 'community_archives' && archiveYears.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setArchiveYearFilter('all')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        archiveYearFilter === 'all'
                          ? 'bg-amber-400 text-black shadow-sm font-black'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      All Years
                    </button>
                    {archiveYears.slice(0, 4).map((yr) => (
                      <button
                        key={`yr-pill-${yr}`}
                        type="button"
                        onClick={() => setArchiveYearFilter(String(yr))}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          archiveYearFilter === String(yr)
                            ? 'bg-amber-400 text-black shadow-sm font-black'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                )}

                {/* Filters Expand/Collapse Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isFiltersExpanded || activeFilterCount > 0
                      ? viewMode === 'community_archives'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/50 shadow-sm'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                  title={isFiltersExpanded ? 'Collapse filters' : 'Expand filters'}
                >
                  <SlidersHorizontal className={`w-3.5 h-3.5 ${viewMode === 'community_archives' ? 'text-amber-400' : 'text-cyan-400'}`} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className={`w-4 h-4 rounded-full ${viewMode === 'community_archives' ? 'bg-amber-400' : 'bg-cyan-400'} text-black text-[9px] font-black flex items-center justify-center`}>
                      {activeFilterCount}
                    </span>
                  )}
                  {isFiltersExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </button>

                {/* Quick reset button if any filters active and toolbar collapsed */}
                {!isFiltersExpanded && (activeFilterCount > 0 || searchQuery || archiveYearFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setArchiveSearchQuery('');
                      setArchiveYearFilter('all');
                      setSelectedCityFilter('all');
                      setMapFilterGenre('all');
                      setDateFilter('all');
                      setVerifiedOnly(false);
                      setTicketOnly(false);
                    }}
                    className="text-[10px] font-mono text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0 underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Active Filter Chips Summary (Visible when collapsed with active filters) */}
              {!isFiltersExpanded && activeFilterCount > 0 && (
                <div className="px-3 pb-2 sm:px-4 flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                  <span className="text-zinc-500 font-bold">Active:</span>
                  {selectedCityFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-rose-400" /> {selectedCityFilter}
                      <button onClick={() => setSelectedCityFilter('all')} className="hover:text-rose-400 ml-0.5">×</button>
                    </span>
                  )}
                  {mapFilterGenre !== 'all' && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1">
                      <Music className="w-2.5 h-2.5 text-cyan-400" /> {mapFilterGenre}
                      <button onClick={() => setMapFilterGenre('all')} className="hover:text-rose-400 ml-0.5">×</button>
                    </span>
                  )}
                  {dateFilter !== 'all' && dateFilter !== 'archives' && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" /> {dateFilter}
                      <button onClick={() => setDateFilter('all')} className="hover:text-rose-400 ml-0.5">×</button>
                    </span>
                  )}
                  {ticketOnly && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 flex items-center gap-1">
                      <Ticket className="w-2.5 h-2.5" /> Tickets Only
                      <button onClick={() => setTicketOnly(false)} className="hover:text-rose-400 ml-0.5">×</button>
                    </span>
                  )}
                  {verifiedOnly && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/80 text-amber-300 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      <button onClick={() => setVerifiedOnly(false)} className="hover:text-rose-400 ml-0.5">×</button>
                    </span>
                  )}
                </div>
              )}

              {/* Collapsible Expanded Filters Panel */}
              {isFiltersExpanded && (
                <div className="p-3 sm:px-4 pt-0 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200 border-t border-zinc-900/80 mt-1">
                  {/* Row 1: City & Genre Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center pt-2">
                    {/* City Dropdown */}
                    <div className="sm:col-span-6">
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={selectedCityFilter}
                          onChange={(e) => setSelectedCityFilter(e.target.value)}
                          className="w-full bg-black/70 border border-zinc-800 text-xs text-zinc-300 font-mono rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
                        >
                          <option value="all">All Locations ({normalizedEvents.length})</option>
                          {uniqueCities.map((city, cIdx) => (
                            <option key={`city-${cIdx}`} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Genre Dropdown */}
                    <div className="sm:col-span-6">
                      <div className="relative">
                        <Music className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={mapFilterGenre}
                          onChange={(e) => setMapFilterGenre(e.target.value)}
                          className="w-full bg-black/70 border border-zinc-800 text-xs text-zinc-300 font-mono rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
                        >
                          <option value="all">All Genres</option>
                          {uniqueGenres.map((genre, gIdx) => (
                            <option key={`genre-${gIdx}`} value={genre}>
                              {genre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Date Presets & Quick Filter Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-900/60 text-xs font-mono">
                    {/* Date presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> When:
                      </span>
                      {[
                        { id: 'all', label: 'All Dates' },
                        { id: 'tonight', label: '🔥 Tonight' },
                        { id: 'tomorrow', label: 'Tomorrow' },
                        { id: 'weekend', label: 'This Weekend' },
                        { id: 'upcoming', label: 'Later Tours' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setDateFilter(preset.id as any);
                            if (viewMode === 'community_archives') {
                              setViewMode('list');
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                            dateFilter === preset.id
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm'
                              : 'bg-zinc-950 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Fast toggles */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setTicketOnly(!ticketOnly)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                          ticketOnly
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <Ticket className="w-3 h-3" /> Tickets Available
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerifiedOnly(!verifiedOnly)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                          verifiedOnly
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" /> Verified Gigs
                      </button>

                      {(searchQuery || selectedCityFilter !== 'all' || mapFilterGenre !== 'all' || dateFilter !== 'all' || verifiedOnly || ticketOnly || archiveYearFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setArchiveSearchQuery('');
                            setArchiveYearFilter('all');
                            setSelectedCityFilter('all');
                            setMapFilterGenre('all');
                            setDateFilter('all');
                            setVerifiedOnly(false);
                            setTicketOnly(false);
                          }}
                          className="text-[10px] text-zinc-500 hover:text-rose-400 underline cursor-pointer ml-1"
                        >
                          Reset all
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MAIN CONTENT AREA: LIST DIRECTORY OR RADAR MAP */}
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col md:flex-row relative">
              {viewMode === 'list' ? (
                /* ======================== LIST / DIRECTORY VIEW ======================== */
                <div className="flex-1 min-h-0 min-w-0 flex flex-col md:flex-row overflow-hidden w-full h-full">
                  {/* Left Column: Events Grid / List (Hidden on mobile when detailed view is open) */}
                  <div className={`${mobileDetailOpen ? 'hidden md:block' : 'block'} flex-1 min-h-0 min-w-0 h-full overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3.5 bg-black/40 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent`}>
                    {filteredEvents.length === 0 ? (
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                          <Filter className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-white font-mono font-bold text-sm">No Events Match Your Filters</h4>
                          <p className="text-xs font-mono text-zinc-500 max-w-sm mt-1">
                            Try expanding your search query, selecting "All Locations", or clearing active date restrictions.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCityFilter('all');
                            setMapFilterGenre('all');
                            setDateFilter('all');
                            setVerifiedOnly(false);
                            setTicketOnly(false);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-cyan-400 border border-cyan-900/60 cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pb-8 sm:pb-0">
                        {filteredEvents.map((evt, idx) => {
                          const isSelected = selectedMapEvent?.id === evt.id;
                          const isTonight = evt.date.toLowerCase().includes('tonight');
                          const isTomorrow = evt.date.toLowerCase().includes('tomorrow');
                          const theme = getShowBorderTheme(evt.id || idx);

                          return (
                            <div
                              key={evt.id}
                              onClick={() => {
                                setSelectedMapEvent(evt);
                                onSelectEvent?.(evt);
                                setMobileDetailOpen(true);
                              }}
                              className={`group bg-[#090b10] border-2 rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                                isSelected
                                  ? theme.selectedBorder
                                  : `${theme.border} ${theme.glow} bg-[#090b10]`
                              }`}
                            >
                              {/* Top Banner Tag & Verification Badges */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {isTonight ? (
                                    <span className="bg-rose-950/80 border border-rose-500/60 text-rose-300 font-mono font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                                      <Flame className="w-3 h-3 text-rose-400 fill-rose-400" /> TONIGHT
                                    </span>
                                  ) : isTomorrow ? (
                                    <span className="bg-amber-950/80 border border-amber-500/60 text-amber-300 font-mono font-bold text-[9px] px-2 py-0.5 rounded">
                                      TOMORROW
                                    </span>
                                  ) : (
                                    <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono font-bold text-[9px] px-2 py-0.5 rounded">
                                      {evt.date}
                                    </span>
                                  )}

                                  {/* Official Verified Promoter vs Community Submitted Badge */}
                                  {evt.isPersonallyBooked || evt.verified ? (
                                    <span className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-mono font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1" title="Verified show booked by official promoter/venue">
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Official
                                    </span>
                                  ) : (
                                    <span className="bg-amber-950/80 border border-amber-500/60 text-amber-300 font-mono font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1" title="Community submitted show by fan/band contributor">
                                      <Award className="w-3 h-3 text-amber-400" /> Community
                                    </span>
                                  )}

                                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded truncate max-w-[150px] ${theme.tagBg}`}>
                                    {evt.genre}
                                  </span>
                                </div>

                                <span className="text-emerald-400 font-mono font-black text-xs shrink-0">
                                  {evt.price}
                                </span>
                              </div>

                              {/* Headliner & Title */}
                              <div className="space-y-1 mb-3">
                                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-cyan-300 transition-colors font-mono tracking-tight leading-snug">
                                  {evt.headliner}
                                </h3>
                                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
                                  <Building className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                  <span className="text-zinc-300 font-bold">{evt.venue}</span>
                                  <span className="text-zinc-600">•</span>
                                  <span className="text-zinc-400">{evt.city}</span>
                                </div>
                              </div>

                              {/* Support Bands Lineup Chips */}
                              {evt.support && evt.support.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block mb-1">
                                    Lineup Support:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {evt.support.map((band: string, bIdx: number) => (
                                      <button
                                        key={`supp-${band}-${bIdx}`}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSearchQuery(band);
                                          triggerNotification?.(`Filtered by lineup band: "${band}"`);
                                        }}
                                        className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-black/60 border border-zinc-800 text-zinc-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
                                        title={`Filter shows with ${band}`}
                                      >
                                        +{band}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Card Bottom: Doors, RSVP Pit, Google Cal & Action CTA */}
                              <div className="pt-2 border-t border-zinc-900/80 flex items-center justify-between mt-auto flex-wrap gap-1.5">
                                <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-600" /> {evt.time}
                                </span>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* RSVP Pit List Toggle */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleShowRsvp(evt.id, evt.headliner);
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                      rsvpedShowIds.has(evt.id)
                                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse'
                                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
                                    }`}
                                    title={rsvpedShowIds.has(evt.id) ? 'You are in the pit list!' : 'RSVP and join pit list'}
                                  >
                                    <Flame className={`w-3 h-3 ${rsvpedShowIds.has(evt.id) ? 'text-rose-400 fill-rose-400' : 'text-zinc-500'}`} />
                                    <span>{rsvpedShowIds.has(evt.id) ? 'In Pit 🔥' : 'Pit RSVP'}</span>
                                  </button>

                                  {/* Add to Google Calendar Link */}
                                  <a
                                    href={getGoogleCalendarUrl(evt)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-800 transition-colors"
                                    title="Add show date to Google Calendar"
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                  </a>

                                  {evt.ticketUrl ? (
                                    <a
                                      href={evt.ticketUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase transition-all shadow flex items-center gap-1"
                                    >
                                      <Ticket className="w-3 h-3" /> Tickets
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMapEvent(evt);
                                        onSelectEvent?.(evt);
                                        setMobileDetailOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-[10px] font-mono font-bold uppercase transition-colors"
                                    >
                                      Details
                                    </button>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMapEvent(evt);
                                      onSelectEvent?.(evt);
                                      setMobileDetailOpen(true);
                                    }}
                                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-1 font-mono text-[10px]"
                                    title="View Full Show Dossier"
                                  >
                                    <span className="hidden sm:inline">Details</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Selected Show Detail Panel (Rich Dossier - Hidden on mobile unless show is tapped) */}
                  <div className={`${mobileDetailOpen ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 bg-[#08090d] border-t md:border-t-0 md:border-l border-zinc-900 p-4 sm:p-5 flex-col justify-between overflow-y-auto overscroll-contain shrink-0 min-h-0 h-full scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent`}>
                    {/* Mobile Back Button */}
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-900 md:hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setMobileDetailOpen(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold cursor-pointer hover:bg-cyan-900 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to All Shows
                      </button>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Show Dossier</span>
                    </div>

                    {activeEvent ? (
                      <div className="space-y-4 pb-8 sm:pb-0">
                        {/* Event Flyer / Photo Banner */}
                        {activeEvent.flyerUrl && (
                          <div className="w-full h-36 rounded-xl overflow-hidden bg-black border border-zinc-800 relative group">
                            <img
                              src={activeEvent.flyerUrl}
                              alt={activeEvent.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono font-bold text-white">
                              <span className="bg-black/70 px-2 py-0.5 rounded border border-zinc-800">
                                {activeEvent.city}
                              </span>
                              <span className="bg-cyan-500 text-black px-2 py-0.5 rounded font-black">
                                {activeEvent.price}
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono uppercase tracking-wider font-bold mb-1 flex-wrap">
                            {activeEvent.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                            <span>{activeEvent.genre}</span>
                          </div>
                          <h3 className="text-base font-black text-white font-mono leading-tight">
                            {activeEvent.title}
                          </h3>
                        </div>

                        {/* Quick Spec Box */}
                        <div className="space-y-2 bg-black/60 p-3 rounded-xl border border-zinc-900 text-xs font-mono">
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Building className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>
                              {activeEvent.venue} ({activeEvent.city})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{activeEvent.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{activeEvent.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Door Price: <strong className="text-emerald-400">{activeEvent.price}</strong></span>
                          </div>
                        </div>

                        {/* Description */}
                        {activeEvent.description && (
                          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900/80">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block mb-1">
                              Show Details
                            </span>
                            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                              {activeEvent.description}
                            </p>
                          </div>
                        )}

                        {/* Full Lineup */}
                        {activeEvent.support && activeEvent.support.length > 0 && (
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block mb-1.5">
                              Lineup & Support
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs font-mono font-bold">
                                {activeEvent.headliner} (Headliner)
                              </span>
                              {activeEvent.support.map((act: string, i: number) => (
                                <button
                                  key={`dossier-act-${act}-${i}`}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(act);
                                    triggerNotification?.(`Filtered shows by "${act}"`);
                                  }}
                                  className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-xs font-mono border border-zinc-800 hover:border-cyan-500/50 hover:text-white transition-colors cursor-pointer"
                                >
                                  {act}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* CTAs */}
                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={() => handleOpenFullEventPage(activeEvent)}
                            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 text-black font-mono uppercase font-black text-xs py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer border border-amber-300/80 active:scale-[0.98]"
                          >
                            <Sparkles className="w-4 h-4 text-black animate-pulse" /> Open Full Event Page
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              triggerNotification?.(`🎟️ Reserved pass for ${activeEvent.title}!`);
                            }}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono uppercase font-black text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Ticket className="w-4 h-4" /> Claim Presale Pass
                          </button>

                          {activeEvent.ticketUrl && (
                            <a
                              href={activeEvent.ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono uppercase font-bold text-[10px] py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-zinc-800"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Official Box Office Website
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                        <Calendar className="w-8 h-8 text-zinc-700" />
                        <p className="text-xs font-mono text-zinc-500">
                          Select an event from the list to view full lineup, venue info & tickets.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : viewMode === 'community_archives' ? (
                /* ======================== COMMUNITY ARCHIVES VIEW ======================== */
                <div className="flex-1 min-h-0 min-w-0 flex flex-col md:flex-row overflow-hidden w-full h-full">
                  {/* Left Column: Community Archive Shows Grid / List */}
                  <div className={`${mobileDetailOpen ? 'hidden md:block' : 'block'} flex-1 min-h-0 min-w-0 h-full overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3.5 bg-black/50 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent`}>
                    {filteredCommunityArchives.length === 0 ? (
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <History className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-white font-mono font-bold text-sm">No Community Archives Found</h4>
                          <p className="text-xs font-mono text-zinc-500 max-w-sm mt-1">
                            No past community-submitted gigs match your search or filters.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setArchiveSearchQuery('');
                            setArchiveYearFilter('all');
                            setSelectedCityFilter('all');
                            setMapFilterGenre('all');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-amber-400 border border-amber-500/40 cursor-pointer"
                        >
                          Reset Archive Filters
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pb-8 sm:pb-0">
                        {filteredCommunityArchives.map((evt, idx) => {
                          const isSelected = selectedMapEvent?.id === evt.id;
                          const theme = getShowBorderTheme(evt.id || `arch-${idx}`);
                          return (
                            <div
                              key={`comm-arch-${evt.id}`}
                              onClick={() => {
                                setSelectedMapEvent(evt);
                                onSelectEvent?.(evt);
                                setMobileDetailOpen(true);
                              }}
                              className={`group bg-[#0c0d12] border-2 rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                                isSelected
                                  ? theme.selectedBorder
                                  : `${theme.border} ${theme.glow} bg-[#0c0d12]`
                              }`}
                            >
                              {/* Top Banner Tag */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-amber-950/80 border border-amber-500/60 text-amber-300 font-mono font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-amber-400" /> CONCLUDED • {evt.date}
                                  </span>
                                  <span className="bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                                    <Tag className="w-3 h-3 text-zinc-400" /> Community Gig
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/60 border border-zinc-850">
                                  Archived
                                </span>
                              </div>

                              {/* Headliner & Show Title */}
                              <div className="space-y-1 mb-2.5">
                                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-amber-300 transition-colors font-mono tracking-tight leading-snug">
                                  {evt.headliner}
                                </h3>
                                {evt.show_name && evt.show_name !== evt.headliner && (
                                  <p className="text-xs font-mono text-amber-400/80 font-bold truncate">
                                    {evt.show_name}
                                  </p>
                                )}
                                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
                                  <Building className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span className="text-zinc-300 font-bold">{evt.venue}</span>
                                  <span className="text-zinc-600">•</span>
                                  <span className="text-zinc-400">{evt.city}</span>
                                </div>
                              </div>

                              {/* Description / Archive notes */}
                              {evt.description && (
                                <p className="text-[11px] font-mono text-zinc-400 bg-black/40 border border-zinc-900 rounded-xl p-2.5 mb-3 line-clamp-2 leading-relaxed">
                                  {evt.description}
                                </p>
                              )}

                              {/* Support Bands Lineup Chips */}
                              {evt.support && evt.support.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block mb-1">
                                    Bands on Bill:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-amber-950/30 border border-amber-500/40 text-amber-300">
                                      {evt.headliner}
                                    </span>
                                    {evt.support.map((band: string, bIdx: number) => (
                                      <span
                                        key={`comm-supp-${band}-${bIdx}`}
                                        className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-black/60 border border-zinc-800 text-zinc-400"
                                      >
                                        +{band}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Card Bottom: Archive Status & Actions */}
                              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between mt-auto">
                                <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-600" /> Preserved in Scene Records
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenFullEventPage(evt);
                                    }}
                                    className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-500/60 rounded-lg text-[10px] font-mono font-bold uppercase transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3" /> Event Page
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMapEvent(evt);
                                      onSelectEvent?.(evt);
                                      setMobileDetailOpen(true);
                                    }}
                                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                                    title="View Archive Dossier"
                                  >
                                    <span>Dossier</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Selected Community Archive Detail Panel */}
                  <div className={`${mobileDetailOpen ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 bg-[#08090d] border-t md:border-t-0 md:border-l border-zinc-900 p-4 sm:p-5 flex-col justify-between overflow-y-auto overscroll-contain shrink-0 min-h-0 h-full scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent`}>
                    {/* Mobile Back Button */}
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-900 md:hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setMobileDetailOpen(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold cursor-pointer hover:bg-amber-900 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Community Archives
                      </button>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Archive Dossier</span>
                    </div>

                    {activeEvent ? (
                      <div className="space-y-4 pb-8 sm:pb-0">
                        {/* Event Flyer / Photo Banner */}
                        {activeEvent.flyerUrl && (
                          <div className="w-full h-36 rounded-xl overflow-hidden bg-black border border-zinc-800 relative group">
                            <img
                              src={activeEvent.flyerUrl}
                              alt={activeEvent.title}
                              className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono font-bold text-white">
                              <span className="bg-black/80 px-2 py-0.5 rounded border border-zinc-800">
                                {activeEvent.city}
                              </span>
                              <span className="bg-amber-500 text-black px-2 py-0.5 rounded font-black">
                                CONCLUDED
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono uppercase tracking-wider font-bold mb-1 flex-wrap">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Community Show Archive</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">{activeEvent.genre}</span>
                          </div>
                          <h3 className="text-base font-black text-white font-mono leading-tight">
                            {activeEvent.title}
                          </h3>
                        </div>

                        {/* Quick Spec Box */}
                        <div className="space-y-2 bg-black/60 p-3 rounded-xl border border-zinc-900 text-xs font-mono">
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Building className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>
                              {activeEvent.venue} ({activeEvent.city})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Concluded on {activeEvent.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Community Booking (Not on promoter roster)</span>
                          </div>
                        </div>

                        {/* Distinction note */}
                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-[11px] font-mono text-amber-300/90 leading-relaxed flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            This show was submitted by the community and is filed here in the Scene Directory archives rather than your promoter festival archives.
                          </span>
                        </div>

                        {/* Description */}
                        {activeEvent.description && (
                          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900/80">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block mb-1">
                              Archive Notes
                            </span>
                            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                              {activeEvent.description}
                            </p>
                          </div>
                        )}

                        {/* Full Lineup */}
                        {activeEvent.support && activeEvent.support.length > 0 && (
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block mb-1.5">
                              Lineup on Bill
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-mono font-bold">
                                {activeEvent.headliner} (Headliner)
                              </span>
                              {activeEvent.support.map((act: string, i: number) => (
                                <span
                                  key={`arch-act-${act}-${i}`}
                                  className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-xs font-mono border border-zinc-800"
                                >
                                  {act}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* CTAs */}
                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={() => handleOpenFullEventPage(activeEvent)}
                            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 text-black font-mono uppercase font-black text-xs py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer border border-amber-300/80 active:scale-[0.98]"
                          >
                            <Sparkles className="w-4 h-4 text-black animate-pulse" /> Open Full Event Page
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              triggerNotification?.(`📋 Archived link ready for ${activeEvent.title}`);
                            }}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono uppercase font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-zinc-800 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Share Scene Archive
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                        <History className="w-8 h-8 text-zinc-700" />
                        <p className="text-xs font-mono text-zinc-500">
                          Select an archived show to view venue and performance records.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ======================== RADAR MAP VIEW (SECONDARY TOGGLE) ======================== */
                <div className="flex-1 min-h-0 min-w-0 flex flex-col md:flex-row overflow-hidden relative w-full h-full">
                  {/* Canvas */}
                  <div className={`${mobileDetailOpen ? 'hidden md:flex' : 'flex'} flex-1 bg-zinc-950 relative overflow-hidden items-center justify-center p-4`}>
                    {/* Grid Background Effect */}
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />

                    {/* Concentric Radar Rings */}
                    <div className="absolute w-[440px] h-[440px] rounded-full border border-cyan-500/10 animate-ping pointer-events-none" />
                    <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-500/20 pointer-events-none" />
                    <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent animate-spin duration-10000 pointer-events-none" />

                    {/* Interactive Event Pins Canvas */}
                    <div className="relative w-full h-full max-w-xl max-h-[440px] border border-zinc-900 rounded-2xl bg-black/50 backdrop-blur-sm p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-cyan-400" /> GEOLOCATED RADAR ACTIVE
                        </span>
                        <span>{filteredEvents.length} PINS IN SCOPE</span>
                      </div>

                      {/* Pins */}
                      <div className="relative flex-1 my-4 flex items-center justify-center flex-wrap gap-4 overflow-y-auto p-2 max-h-[340px]">
                        {filteredEvents.map((evt, idx) => {
                          const isSelected = selectedMapEvent?.id === evt.id;
                          return (
                            <motion.button
                              key={`pin-${evt.id}-${idx}`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedMapEvent(evt);
                                setMobileDetailOpen(true);
                              }}
                              className="relative group cursor-pointer flex flex-col items-center max-w-[130px]"
                            >
                              <div
                                className={`p-2.5 rounded-full border shadow-xl transition-all ${
                                  isSelected
                                    ? 'bg-cyan-500 text-black border-white shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-125 z-20'
                                    : 'bg-zinc-900 text-cyan-400 border-cyan-500/40 hover:border-cyan-400 hover:bg-zinc-800'
                                }`}
                              >
                                <Music className="w-4 h-4" />
                              </div>

                              <span
                                className={`mt-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold truncate max-w-full shadow-md ${
                                  isSelected
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                                    : 'bg-black/80 text-zinc-400 border border-zinc-800 group-hover:text-white'
                                }`}
                                title={evt.venue}
                              >
                                {evt.headliner}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="text-[9px] font-mono text-zinc-500 text-center">
                        Click any pin to inspect the event details and lineup
                      </div>
                    </div>
                  </div>

                  {/* Sidebar for Map */}
                  <div className={`${mobileDetailOpen ? 'flex' : 'hidden md:flex'} w-full md:w-80 bg-[#07080a] border-t md:border-t-0 md:border-l border-zinc-900 p-4 flex-col justify-between overflow-y-auto shrink-0 h-full`}>
                    {/* Mobile Back Button for Map */}
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-900 md:hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setMobileDetailOpen(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold cursor-pointer hover:bg-cyan-900 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Radar Map
                      </button>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Pin Dossier</span>
                    </div>

                    {activeEvent ? (
                      <div className="space-y-4 pb-8 sm:pb-0">
                        <div>
                          <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono uppercase tracking-wider font-bold mb-1">
                            {activeEvent.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                            <span>{activeEvent.genre}</span>
                          </div>
                          <h3 className="text-sm font-black text-white font-mono leading-snug">
                            {activeEvent.title}
                          </h3>
                        </div>

                        <div className="space-y-2 bg-zinc-950 p-3 rounded-xl border border-zinc-900 text-xs font-mono">
                          <div className="flex items-center gap-2 text-zinc-300">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{activeEvent.venue} ({activeEvent.city})</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{activeEvent.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Price: <strong className="text-emerald-400">{activeEvent.price}</strong></span>
                          </div>
                        </div>

                        {activeEvent.support && activeEvent.support.length > 0 && (
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block mb-1">Support</span>
                            <div className="flex flex-wrap gap-1">
                              {activeEvent.support.map((act: string, i: number) => (
                                <span key={`map-act-${act}-${i}`} className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-[10px] font-mono border border-zinc-800">
                                  {act}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={() => handleOpenFullEventPage(activeEvent)}
                            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 text-black font-mono uppercase font-black text-xs py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer border border-amber-300/80 active:scale-[0.98]"
                          >
                            <Sparkles className="w-4 h-4 text-black animate-pulse" /> Open Full Event Page
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerNotification?.(`🎟️ Reserved pass for ${activeEvent.title}!`)}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono uppercase font-black text-xs py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Ticket className="w-4 h-4" /> Claim Presale Pass
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                        <MapPin className="w-8 h-8 text-zinc-700" />
                        <p className="text-xs font-mono text-zinc-500">Select a radar pin to view venue and line-up.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Flyer & Show Announcement Parser Modal */}
      {isAiFlyerModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#0c0d12] border-2 border-cyan-500/60 rounded-2xl p-5 sm:p-6 shadow-[0_0_40px_rgba(6,182,212,0.3)] relative overflow-hidden font-mono space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span>AI Flyer & Announcement Parser</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAiFlyerModalOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload a concert flyer image or paste raw show announcement copy (e.g. from an Instagram or Facebook post). Gemini AI will extract all details (headliner, support, venue, date, doors time, ticket price, ticket URL) and pre-fill the show creator automatically!
            </p>

            {/* Image Upload Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-bold block">Option 1: Upload Flyer Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setAiFlyerImage(reader.result as string);
                      triggerNotification?.('Flyer image uploaded ready for AI parsing!');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
              />
              {aiFlyerImage && (
                <div className="w-full h-28 rounded-xl border border-cyan-500/40 overflow-hidden relative mt-2 bg-black">
                  <img src={aiFlyerImage} alt="Flyer Preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setAiFlyerImage(null)}
                    className="absolute top-1.5 right-1.5 bg-black/80 text-rose-400 p-1 rounded-full text-xs hover:bg-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Text Paste Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-bold block">Option 2: Paste Show Copy / Text</label>
              <textarea
                value={aiFlyerText}
                onChange={(e) => setAiFlyerText(e.target.value)}
                placeholder="Paste Instagram/Facebook show post copy here (e.g., 'DYING FETUS live at The Bomb Factory Oct 18 w/ Incantation & Fulci. Doors 7pm, $35 presale...')"
                rows={4}
                className="w-full bg-black/80 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 resize-none font-mono"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAiFlyerModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isAiParsing || (!aiFlyerText.trim() && !aiFlyerImage)}
                onClick={handleParseFlyerWithAi}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 text-black font-black text-xs uppercase rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
              >
                {isAiParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Parsing Flyer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Auto-Fill Show Details</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
