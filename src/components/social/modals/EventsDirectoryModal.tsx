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
  Filter,
  Database,
  DownloadCloud,
  RefreshCw,
  CheckCircle2
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
 * Normalizes any show table row into a standardized Event Directory gig object
 */
export const normalizeShowToEventDirectoryItem = (show: any, idx: number = 0) => {
  const headliner = (show.headliner || show.band_name || show.name || show.show_name || 'Live Act').trim();
  const venue = (show.venue || show.venue_name || (show.name && !show.name.includes('Live') ? show.name : 'Underground Venue')).trim();
  const rawCity = show.city || 'Tour Stop';
  const rawState = show.state_province || '';
  const city = rawState ? `${rawCity}, ${rawState}` : rawCity;
  
  // Format date display
  let dateDisplay = 'Upcoming';
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

const DEFAULT_CURATED_EVENTS = [
  {
    id: 'evt_1',
    title: 'Devourment + Mortician (Live at Reggies)',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    date: 'Tonight • 8:00 PM',
    time: 'Doors 8:00 PM',
    price: '$35',
    lat: 41.85,
    lng: -87.62,
    genre: 'Death Metal / Grind',
    headliner: 'Devourment',
    support: ['Mortician', 'Sanguisugabogg', 'Tribal Gaze'],
    verified: true,
    ticketUrl: 'https://reggieschicago.com',
    flyerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    description: 'Special co-headlining extreme underground night. Brutal death metal masters Devourment return with heavy support.',
  },
  {
    id: 'evt_2',
    title: 'Immolation (Close to a World Below Anniv)',
    venue: 'The Metro',
    city: 'Chicago, IL',
    date: 'Tomorrow • 7:30 PM',
    time: 'Doors 7:30 PM',
    price: '$42',
    lat: 41.94,
    lng: -87.65,
    genre: 'Death Metal',
    headliner: 'Immolation',
    support: ['Incantation', 'Fulci', 'Frozen Soul'],
    verified: true,
    ticketUrl: 'https://metrochicago.com',
    flyerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    description: 'Celebrating classic atmospheric death metal history live in full glory.',
  },
  {
    id: 'evt_3',
    title: 'Underground DIY Noise Fest III',
    venue: 'Subterranean',
    city: 'Chicago, IL',
    date: 'Sat, Jul 29 • 6:00 PM',
    time: 'Doors 6:00 PM',
    price: '$20',
    lat: 41.91,
    lng: -87.67,
    genre: 'Hardcore / Punk',
    headliner: 'Jesus Piece',
    support: ['Kubbik', 'Jarhead Fertilizer', 'Volcano'],
    verified: false,
    ticketUrl: '',
    flyerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    description: 'DIY all-ages warehouse hardcore showcase. Bring earplugs. Respect the pit.',
  },
  {
    id: 'evt_4',
    title: 'Cannibal Corpse World Tour',
    venue: 'Brooklyn Steel',
    city: 'New York, NY',
    date: 'Fri, Aug 04 • 8:00 PM',
    time: 'Doors 7:00 PM',
    price: '$45',
    lat: 40.71,
    lng: -73.93,
    genre: 'Death Metal',
    headliner: 'Cannibal Corpse',
    support: ['Mayhem', 'Gorguts', 'Blood Incantation'],
    verified: true,
    ticketUrl: 'https://bowerypresents.com',
    flyerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    description: 'Global touring lineup stopping in NYC for a massive evening of relentless death & black metal.',
  },
  {
    id: 'evt_5',
    title: 'Autopsy & Repulsion Live West Coast Incursion',
    venue: 'The Underground',
    city: 'Los Angeles, CA',
    date: 'Tonight • 8:00 PM',
    time: 'Doors 8:00 PM',
    price: '$35',
    lat: 34.05,
    lng: -118.25,
    genre: 'Death Metal / Grind',
    headliner: 'AUTOPSY',
    support: ['Repulsion', 'Necrot', 'Cerebral Rot'],
    verified: true,
    ticketUrl: '',
    flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    description: 'Legendary death metal pioneers tearing through a career-spanning set with grind legends.',
  },
  {
    id: 'evt_6',
    title: 'Incantation Rotting Spiritual Invocation',
    venue: 'Nexus Hub',
    city: 'Long Beach, CA',
    date: 'Tonight • 9:30 PM',
    time: 'Set 9:30 PM',
    price: '$30',
    lat: 33.77,
    lng: -118.19,
    genre: 'Death Metal',
    headliner: 'INCANTATION',
    support: ['Mortiferum', 'Worm'],
    verified: true,
    ticketUrl: '',
    flyerUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    description: 'Special club performance with custom sound reinforcement & exclusive live bootleg cassette drop.',
  },
  {
    id: 'evt_7',
    title: 'Cryptopsy None So Vile Retrospective',
    venue: 'Warehouse 4',
    city: 'Anaheim, CA',
    date: 'Tomorrow • 7:00 PM',
    time: 'Doors 7:00 PM',
    price: '$28',
    lat: 33.83,
    lng: -117.91,
    genre: 'Technical Death Metal',
    headliner: 'CRYPTOPSY',
    support: ['Dying Fetus', 'Archspire'],
    verified: true,
    ticketUrl: '',
    flyerUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&auto=format&fit=crop&q=80',
    description: 'Lightning technical extremity and blastbeats in full sonic force.',
  },
  {
    id: 'evt_8',
    title: 'Masonic Temple Thrash Assault',
    venue: 'Masonic Temple',
    city: 'San Francisco, CA',
    date: 'Fri, Oct 24 • 6:30 PM',
    time: 'Doors 6:30 PM',
    price: '$45',
    lat: 37.77,
    lng: -122.41,
    genre: 'Thrash Metal',
    headliner: 'DEATH ANGEL',
    support: ['Exodus', 'Vio-lence'],
    verified: true,
    ticketUrl: '',
    flyerUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&auto=format&fit=crop&q=80',
    description: 'Bay Area thrash legends reunite for a historic home turf showcase.',
  },
  {
    id: 'evt_9',
    title: 'Skinless & Peeling Flesh Slam Fest',
    venue: 'The Pit Stage',
    city: 'San Diego, CA',
    date: 'Sat, Oct 25 • 10:00 PM',
    time: 'Set 10:00 PM',
    price: '$25',
    lat: 32.71,
    lng: -117.16,
    genre: 'Slam / Death Metal',
    headliner: 'SKINLESS',
    support: ['Peeling Flesh', 'Bodybox', 'Snuffed on Sight'],
    verified: false,
    ticketUrl: '',
    flyerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    description: 'Heavy grooves, slams, and non-stop pit action. No stage barriers.',
  }
];

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
  // View mode toggle: List (default) vs Map
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'tonight' | 'tomorrow' | 'weekend' | 'upcoming'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [ticketOnly, setTicketOnly] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [localImportedShows, setLocalImportedShows] = useState<any[]>([]);

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
        if (!s) return;
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
          const currentList = Array.isArray(prev) ? prev : [];
          const existingSigs = new Set(
            currentList.map(e => String(e.id || '').toLowerCase().trim())
          );
          const toAdd = dedupedShows.filter(
            ds => !existingSigs.has(String(ds.id).toLowerCase().trim())
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
    const rawList = (liveEvents && liveEvents.length > 0) ? liveEvents : [];
    
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
        if (s.is_published === false || s.publication_status === 'embargoed_private' || s.publication_status === 'draft' || s.status === 'Draft' || s.status === 'Embargoed') {
          return;
        }
        const normalized = normalizeShowToEventDirectoryItem(s, idx);
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
      const sig = `${(curated.headliner || curated.title).toLowerCase()}_${(curated.date || '').toLowerCase()}`;
      if (!seenSigs.has(`sig_${sig}`)) {
        combined.push(curated);
      }
    });

    return combined.map((evt: any, idx: number) => {
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
        lat: evt.lat || (34.0 + (idx % 8) * 0.1),
        lng: evt.lng || (-118.2 - (idx % 8) * 0.1),
        description: evt.description || (isFromShowsTable ? `Official booked tour date at ${venue}. Advance ticketing, tour merch and door entries active.` : `Live underground performance at ${venue}. All ages & support welcome.`),
        ticketsAvailable: Boolean(evt.ticketsAvailable || ticketUrl || evt.ticketStatus === 'active')
      };
    });
  }, [liveEvents, localImportedShows, shows]);

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
        if (dateFilter === 'tonight' && !d.includes('tonight')) return false;
        if (dateFilter === 'tomorrow' && !d.includes('tomorrow')) return false;
        if (dateFilter === 'weekend' && (!d.includes('fri') && !d.includes('sat') && !d.includes('sun'))) return false;
        if (dateFilter === 'upcoming' && (d.includes('tonight') || d.includes('tomorrow'))) return false;
      }

      // 5. Checkboxes (Verified, Tickets)
      if (verifiedOnly && !evt.verified) return false;
      if (ticketOnly && !evt.ticketsAvailable && !evt.ticketUrl) return false;

      return true;
    });
  }, [normalizedEvents, searchQuery, selectedCityFilter, mapFilterGenre, dateFilter, verifiedOnly, ticketOnly]);

  const activeEvent = selectedMapEvent || filteredEvents[0] || null;

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
            <div className="p-3.5 sm:p-4 border-b border-zinc-900 bg-black/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white font-black uppercase text-sm sm:text-base tracking-widest font-mono flex items-center gap-2">
                      Live Events & Gigs Directory
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      {filteredEvents.length} Shows
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono hidden sm:block">
                    Search upcoming tours, booked shows, local club dates, DIY gigs & festivals by city or band
                  </p>
                </div>
              </div>

              {/* View Mode Toggle (List vs Map) & Action Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* List / Map View Switch */}
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('list');
                      setMobileDetailOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Directory</span>
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
                </div>

                {/* Post Show Button */}
                {onOpenShowCreator && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDetailOpen(false);
                      onClose();
                      onOpenShowCreator();
                    }}
                    className="hidden sm:flex text-xs font-mono uppercase font-bold text-black bg-[#00ffcc] hover:bg-[#00ffcc]/90 px-3 py-1.5 rounded-xl items-center gap-1.5 transition-all shadow cursor-pointer"
                  >
                    + Post Show
                  </button>
                )}

                {/* Close modal */}
                <button
                  onClick={() => {
                    setMobileDetailOpen(false);
                    onClose();
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* INTEGRATED SEARCH & FILTER BAR */}
            <div className="bg-[#0e1017] border-b border-zinc-900 p-3 sm:px-4 space-y-2.5 shrink-0">
              {/* Row 1: Search input + City & Genre Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Search Bar (Band, Venue, City, etc.) */}
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Band (e.g. Incantation), Venue, or Scene..."
                    className="w-full bg-black/70 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* City Dropdown */}
                <div className="sm:col-span-3">
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
                <div className="sm:col-span-3">
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
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-900/60 text-xs font-mono">
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
                      onClick={() => setDateFilter(preset.id as any)}
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

                  {(searchQuery || selectedCityFilter !== 'all' || mapFilterGenre !== 'all' || dateFilter !== 'all' || verifiedOnly || ticketOnly) && (
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
                      className="text-[10px] text-zinc-500 hover:text-rose-400 underline cursor-pointer ml-1"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
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
                        {filteredEvents.map((evt) => {
                          const isSelected = selectedMapEvent?.id === evt.id;
                          const isTonight = evt.date.toLowerCase().includes('tonight');
                          const isTomorrow = evt.date.toLowerCase().includes('tomorrow');

                          return (
                            <div
                              key={evt.id}
                              onClick={() => {
                                setSelectedMapEvent(evt);
                                onSelectEvent?.(evt);
                                setMobileDetailOpen(true);
                              }}
                              className={`group bg-[#090b10] border rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between hover:shadow-lg ${
                                isSelected
                                  ? 'border-cyan-500 ring-1 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)] bg-gradient-to-br from-cyan-950/20 to-[#090b10]'
                                  : 'border-zinc-850 hover:border-zinc-700 bg-[#090b10]'
                              }`}
                            >
                              {/* Top Banner Tag */}
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

                                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-900/60 px-2 py-0.5 rounded truncate max-w-[150px]">
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

                              {/* Card Bottom: Doors & Action CTA */}
                              <div className="pt-2 border-t border-zinc-900/80 flex items-center justify-between mt-auto">
                                <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-600" /> {evt.time}
                                </span>

                                <div className="flex items-center gap-1.5">
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
                                        triggerNotification?.(`🎟️ RSVP added for ${evt.headliner} at ${evt.venue}!`);
                                      }}
                                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-[10px] font-mono font-bold uppercase transition-colors"
                                    >
                                      RSVP / Door
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
    </AnimatePresence>
  );
};
