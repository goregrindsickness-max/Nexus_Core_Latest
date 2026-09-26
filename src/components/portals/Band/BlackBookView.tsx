import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Users, Mail, Star, MessageSquare, Send, ChevronLeft, ChevronRight, ChevronDown, Calendar, Plus, X, Radio, CheckCircle, XCircle, Clock, Edit2, Sparkles, Database, RefreshCw, Globe, Check, Trash2, Mic2, Music, Building2, SlidersHorizontal, Filter, AlertTriangle, Save, ChevronsUpDown, AlertOctagon, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import { Offer, UserReview, Venue } from '../../../types';
import { RoutingBeacon } from '../Promoter/PromoterPortalView';
import { getSupabase } from '../../../supabase';
import { handleSendMessage as sendDbMessage } from '../../../store/useChatStore';
import VenueReputationCard from './VenueReputationCard';
import { seedVenuesForCities, classifyPlace, isIrrelevantPlace } from '../../../services/musicBrainzSeederService';
import { getAllBlackBookVenues, BUILT_IN_BLACK_BOOK_VENUES } from '../../../services/venueSearchService';

/**
 * Detect if an existing place record appears to be closed, defunct, or former
 */
export function detectDefunctReason(venue: any): string | null {
  if (!venue) return null;
  const name = (venue.name || '').toLowerCase();
  const address = (venue.address || '').toLowerCase();
  const notes = Array.isArray(venue.intelEntries) 
    ? venue.intelEntries.join(' ').toLowerCase() 
    : (Array.isArray(venue.intel_entries) ? venue.intel_entries.join(' ').toLowerCase() : '');

  if (
    name.includes('(closed') ||
    name.includes('[closed') ||
    name.includes('(defunct') ||
    name.includes('[defunct') ||
    name.includes('(former') ||
    name.includes('(demolished') ||
    name.includes('(historic') ||
    name.includes('permanently closed')
  ) {
    return 'Name marked as closed or former';
  }

  if (
    notes.includes('permanently closed') ||
    notes.includes('shut down') ||
    notes.includes('defunct') ||
    notes.includes('demolished') ||
    notes.includes('out of business') ||
    notes.includes('ceased operations')
  ) {
    return 'Intel notes report closure';
  }

  if (address.includes('closed') || address.includes('former location')) {
    return 'Address tagged as former location';
  }

  return null;
}


interface BlackBookViewProps {
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  userProfile: any;
  setUserProfile?: React.Dispatch<React.SetStateAction<any>>;
  activeBandName: string;
  offers?: Offer[];
  onUpdateOffer?: (offer: Offer) => void;
  userReviews?: UserReview[];
  venues?: Venue[];
  setVenues?: React.Dispatch<React.SetStateAction<Venue[]>>;
  initialTab?: 'directory' | 'beacons';
  hideTabs?: boolean;
  disableScrollToTop?: boolean;
}

const mockVenues = [
  {
    id: 'v1',
    name: 'The Echo',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    capacity: 350,
    email: 'booking@theechola.com',
    genreFit: 92,
    payoutRating: 4.8,
    loadInRating: 3.5,
    buyers: 'Lizzy & Mark',
    intelEntries: [
      "Hard cut off at 11:30PM. Load-in through the back alley, very tight squeeze. Payout is always exact and on time.",
      "The local sound engineer is top-tier. Bring earplugs, it gets very loud inside.",
      "Security is strict but professional. Backstage room is locked during general door opening."
    ]
  },
  {
    id: 'v2',
    name: 'Chain Reaction',
    city: 'Anaheim',
    state: 'CA',
    country: 'USA',
    capacity: 250,
    email: 'chainreactionbooking@gmail.com',
    genreFit: 98,
    payoutRating: 4.5,
    loadInRating: 4.0,
    buyers: 'Jon',
    intelEntries: [
      "Legendary spot for heavy/punk bands. Front door load-in only. Merch area gets incredibly crowded but moves units.",
      "Very friendly venue owners who really care about DIY culture. Soft drinks are on house for artists.",
      "Check with Jon about load-in details before 5 PM to secure easy street parking."
    ]
  },
  {
    id: 'v3',
    name: 'Bottom of the Hill',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    capacity: 246,
    email: 'booking@bottomofthehill.com',
    genreFit: 85,
    payoutRating: 5.0,
    loadInRating: 3.0,
    buyers: 'Lynn',
    intelEntries: [
      "Incredible sound system. Steep stairs for load-in are brutal on cabinets. Ask for the drink tickets early.",
      "Lynn is super busy but will respond if you follow up once after 4 days. Great vegan food nearby."
    ]
  },
  {
    id: 'v4',
    name: 'Neumos',
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    capacity: 650,
    email: 'talent@neumos.com',
    genreFit: 78,
    payoutRating: 4.9,
    loadInRating: 4.5,
    buyers: 'Evan',
    intelEntries: [
      "Highly professional staff. Green room is huge and stocked. Load-in is easy via the side ramp.",
      "Excellent local promotion. Usually books weeks or months in advance.",
      "Merch stand space has its own dedicated power strip. Highly visible to the crowd."
    ]
  },
];

export default function BlackBookView({ onBack, triggerNotification, userProfile, setUserProfile, activeBandName, offers = [], onUpdateOffer, userReviews = [], venues = [], setVenues, initialTab = 'directory', hideTabs = false, disableScrollToTop = false }: BlackBookViewProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'beacons'>(initialTab);
  const [beacons, setBeacons] = useState<RoutingBeacon[]>([]);
  const [offerFilter, setOfferFilter] = useState<'all' | 'pending' | 'accepted' | 'renegotiating'>('all');
  const [localRenegotiateId, setLocalRenegotiateId] = useState<string | null>(null);
  const [counterGuarantee, setCounterGuarantee] = useState<string>('');
  const [counterNotes, setCounterNotes] = useState<string>('');

  // Promoter Messaging Drawer states
  const [selectedPromoter, setSelectedPromoter] = useState<any>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{ sender: 'user' | 'promoter'; text: string; time: string }>>>(() => {
    try {
      const saved = localStorage.getItem('nexus_promoter_chats_v1');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const routingGaps = React.useMemo(() => {
    const localShowsStr = localStorage.getItem('nexus_core_shows_offline');
    let showsList = [];
    if (localShowsStr) {
      try {
        showsList = JSON.parse(localShowsStr);
      } catch (e) {}
    }
    if (!showsList || showsList.length === 0) {
      showsList = [];
    }

    const filtered = showsList.filter((s: any) => !activeBandName || s.band_id === '' || s.band_id === activeBandName || !s.band_id);
    const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length < 2) {
      return ["May 27 (Transit Corridor: Chicago -> Brooklyn)"];
    }

    const gaps: string[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const d1 = new Date(sorted[i].date);
      const d2 = new Date(sorted[i + 1].date);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        const gapDate = new Date(d1);
        gapDate.setDate(d1.getDate() + 1);
        const dateStr = gapDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        gaps.push(`${dateStr} (Transit Corridor: ${sorted[i].city || sorted[i].name} -> ${sorted[i + 1].city || sorted[i + 1].name})`);
      }
    }

    if (gaps.length === 0) {
      return ["May 27 (Transit Corridor: Chicago -> Brooklyn)"];
    }
    return gaps;
  }, [activeBandName]);

  const handleSendMessage = async () => {
    if (!typedMessage.trim() || !selectedPromoter) return;
    const msgText = typedMessage.trim();
    const promoterKey = selectedPromoter.name;
    const newMsg = {
      sender: 'user' as const,
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = {
      ...chatMessages,
      [promoterKey]: [...(chatMessages[promoterKey] || []), newMsg]
    };

    setChatMessages(updated);
    localStorage.setItem('nexus_promoter_chats_v1', JSON.stringify(updated));
    setTypedMessage('');
    triggerNotification(`✉️ Message routed directly to ${selectedPromoter.name}!`);

    // Execute uninhibited DB write to Supabase
    const recipientId = selectedPromoter.id || selectedPromoter.email || selectedPromoter.name;
    sendDbMessage(recipientId, msgText);
  };

  // Scroll to top of the page on tab toggle inside BlackBookView
  useEffect(() => {
    if (disableScrollToTop) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const scrollableDivs = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    scrollableDivs.forEach(div => {
      div.scrollTop = 0;
    });
  }, [activeTab, disableScrollToTop]);

  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [bookmarkMutating, setBookmarkMutating] = useState<string | null>(null);

  const toggleSavedVenue = async (venueId: string) => {
    if (!userProfile?.id) {
      triggerNotification("⚠️ PLEASE AUTHENTICATE TO BOOKMARK VENUES.");
      return;
    }

    setBookmarkMutating(venueId);

    const isCreative = userProfile?.account_type === 'creative';
    const metadataKey = isCreative ? 'creative_metadata' : 'promoter_metadata';
    const metadata = userProfile[metadataKey] || {};
    const oldSaved = metadata.saved_venues || [];

    let newSaved: string[];
    const index = oldSaved.indexOf(venueId);
    if (index >= 0) {
      newSaved = oldSaved.filter((id: string) => id !== venueId);
    } else {
      newSaved = [...oldSaved, venueId];
    }

    const updatedMetadata = {
      ...metadata,
      saved_venues: newSaved
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        // Update user profile metadata cleanly
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            [metadataKey]: updatedMetadata
          })
          .eq('id', userProfile?.id);

        let error = updateError;

        // If row not found or update failed, fallback to safe upsert without invalid 'role' column
        if (updateError) {
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userProfile?.id,
              email: userProfile?.email || '',
              full_name: userProfile?.name || userProfile?.full_name || 'User',
              [metadataKey]: updatedMetadata
            }, { onConflict: 'id' });
          error = upsertError;
        }

        if (error) {
          console.error("Supabase upsert bookmark error:", error);
          triggerNotification("⚠️ CLOUD PORTAL SYNC INTERRUPTED. ASSIGNED LOCALLY.");
        } else {
          triggerNotification(index >= 0 ? "🗑️ REMOVED FROM BOOKMARKS" : "⭐ VENUE BOOKMARKED SUCCESSFULLY");
        }
      } catch (err) {
        console.error("Bookmark mutation failed:", err);
        triggerNotification("⚠️ OFFLINE OR DISCONNECTED. SAVED LOCALLY.");
      }
    } else {
      triggerNotification(index >= 0 ? "🗑️ REMOVED FROM LOCAL PROFILE" : "⭐ SAVED TO LOCAL PROFILE");
    }

    if (setUserProfile) {
      setUserProfile((prev: any) => ({
        ...prev,
        [metadataKey]: updatedMetadata
      }));
    }

    setBookmarkMutating(null);
  };

  React.useEffect(() => {
    // Load local beacons
    const localStr = localStorage.getItem('nexus_core_routing_beacons_v1');
    if (localStr) {
      try {
        setBeacons(JSON.parse(localStr).filter((b: any) => b.band_name === activeBandName));
      } catch (e) {}
    }
  }, [activeBandName]);

  // MusicBrainz Hub Seeding & Supabase Sync State
  const [isSeederModalOpen, setIsSeederModalOpen] = useState(false);
  const [isSeedingActive, setIsSeedingActive] = useState(false);
  const [isPushingToSupabase, setIsPushingToSupabase] = useState(false);
  const [seedingLogs, setSeedingLogs] = useState<string[]>([]);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [seededHubs, setSeededHubs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_seeded_hubs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [customHubs, setCustomHubs] = useState<string[]>([]);
  const [selectedHubs, setSelectedHubs] = useState<string[]>([]);
  const [customCityInput, setCustomCityInput] = useState('');

  const TOUR_HUB_PRESETS = [
    { city: 'Austin', state: 'TX', label: 'Austin, TX' },
    { city: 'Dallas', state: 'TX', label: 'Dallas, TX' },
    { city: 'Oklahoma City', state: 'OK', label: 'Oklahoma City, OK' },
    { city: 'Houston', state: 'TX', label: 'Houston, TX' },
    { city: 'San Antonio', state: 'TX', label: 'San Antonio, TX' },
    { city: 'Chicago', state: 'IL', label: 'Chicago, IL' },
    { city: 'Denver', state: 'CO', label: 'Denver, CO' },
    { city: 'Los Angeles', state: 'CA', label: 'Los Angeles, CA' },
    { city: 'Seattle', state: 'WA', label: 'Seattle, WA' },
    { city: 'Nashville', state: 'TN', label: 'Nashville, TN' },
    { city: 'Atlanta', state: 'GA', label: 'Atlanta, GA' },
    { city: 'New York', state: 'NY', label: 'New York, NY' },
    { city: 'Philadelphia', state: 'PA', label: 'Philadelphia, PA' },
    { city: 'Portland', state: 'OR', label: 'Portland, OR' },
    { city: 'Minneapolis', state: 'MN', label: 'Minneapolis, MN' },
    { city: 'Detroit', state: 'MI', label: 'Detroit, MI' }
  ];

  const availablePresets = TOUR_HUB_PRESETS.filter(
    h => !seededHubs.some(sh => sh.toLowerCase() === h.city.toLowerCase())
  );

  const availableCustomHubs = customHubs.filter(
    ch => !seededHubs.some(sh => sh.toLowerCase() === ch.toLowerCase())
  );

  const toggleHubSelection = (cityName: string) => {
    setSelectedHubs(prev => 
      prev.includes(cityName) 
        ? prev.filter(c => c !== cityName) 
        : [...prev, cityName]
    );
  };

  const handleAddCustomHub = () => {
    const clean = customCityInput.trim();
    if (!clean) return;

    if (seededHubs.some(sh => sh.toLowerCase() === clean.toLowerCase())) {
      triggerNotification(`ℹ️ '${clean}' has already been seeded in the Black Book.`);
      setCustomCityInput('');
      return;
    }

    if (!customHubs.some(ch => ch.toLowerCase() === clean.toLowerCase())) {
      setCustomHubs(prev => [...prev, clean]);
    }

    if (!selectedHubs.some(sh => sh.toLowerCase() === clean.toLowerCase())) {
      setSelectedHubs(prev => [...prev, clean]);
    }

    setCustomCityInput('');
    triggerNotification(`📍 Selected new region: ${clean}`);
  };

  const handleRemoveCustomHub = (cityName: string) => {
    setCustomHubs(prev => prev.filter(c => c !== cityName));
    setSelectedHubs(prev => prev.filter(c => c !== cityName));
  };

  const [localVenues, setLocalVenues] = useState<any[]>(() => {
    return mockVenues.map(mv => {
      const cls = classifyPlace(mv.name, (mv as any).place_type);
      return {
        ...mv,
        place_type: (mv as any).place_type || cls.place_type,
        capacity: mv.capacity !== undefined ? mv.capacity : cls.estimated_capacity
      };
    });
  });

  // Deleted venues registry
  const [deletedVenueIds, setDeletedVenueIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nexus_deleted_venue_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Category filter state: venue | studio | rehearsal | saved (Live Stages by default)
  const [categoryFilter, setCategoryFilter] = useState<'venue' | 'studio' | 'rehearsal' | 'saved'>('venue');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string | null>(null);

  // Edit Venue Modal State
  const [isEditVenueOpen, setIsEditVenueOpen] = useState(false);
  const [editVenueForm, setEditVenueForm] = useState({
    id: '',
    name: '',
    place_type: 'venue',
    capacity: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    website: '',
    lat: '',
    lng: '',
    buyers: '',
    email: '',
    phone: '',
    genreFit: 85,
    payoutRating: 4.5,
    loadInRating: 4.0,
    notes: '',
    intelNote: ''
  });

  // Delete Venue Confirmation Modal State
  const [venueToDelete, setVenueToDelete] = useState<{ id: string; name: string; city?: string; state?: string; capacity?: any; source?: string } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Directory Audit & Defunct Places Cleaner State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditFlaggedPlaces, setAuditFlaggedPlaces] = useState<Array<{ venue: any; reason: string }>>([]);
  const [selectedAuditIds, setSelectedAuditIds] = useState<Set<string>>(new Set());
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCustomTerm, setAuditCustomTerm] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  // Load venues from database and local storage on mount with overrides & classifications
  useEffect(() => {
    const loadPersistedVenues = async () => {
      let dbVenues: any[] = [];
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('venues').select('*');
          if (!error && data && data.length > 0) {
            dbVenues = data;
          }
        } catch (_) {}
      }

      // Fetch server-persisted venues cache
      let serverVenues: any[] = [];
      try {
        const res = await fetch('/api/venues');
        if (res.ok) {
          const sData = await res.json();
          if (sData.success && Array.isArray(sData.venues)) {
            serverVenues = sData.venues;
          }
        }
      } catch (_) {}

      let cachedVenues: any[] = [];
      try {
        const bbVenues = await getAllBlackBookVenues();
        if (Array.isArray(bbVenues) && bbVenues.length > 0) {
          cachedVenues = bbVenues.map(v => ({
            id: v.id,
            name: v.name,
            address: v.fullAddress || v.streetAddress || '',
            city: v.city,
            state_province: v.state || 'USA',
            country: v.country || 'USA',
            capacity: typeof v.capacity === 'number' ? v.capacity : 500,
            genre_fit: v.genreFit || 90,
            payout_rating: v.payoutRating || 4.8,
            load_in_rating: v.loadInRating || 4.5,
            source: v.source || 'blackbook'
          }));
        }
      } catch (_) {}

      try {
        const local = localStorage.getItem('nexus_musicbrainz_venues');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            cachedVenues = [...cachedVenues, ...parsed];
          }
        }
      } catch (_) {}

      // Load custom overrides if user has edited details
      let customOverrides: Record<string, any> = {};
      try {
        const overridesStr = localStorage.getItem('nexus_venue_custom_overrides');
        if (overridesStr) customOverrides = JSON.parse(overridesStr);
      } catch (_) {}

      const allCombined = [...dbVenues, ...serverVenues, ...cachedVenues].filter(v => !isIrrelevantPlace(v));
      if (allCombined.length > 0) {
        const mapped = allCombined.map(v => {
          const cls = classifyPlace(v.name, v.place_type || v.type || v.source);
          const defaultPlaceType = v.place_type || cls.place_type;
          
          // Determine capacity: if capacity is 350 (default) but place is a studio/rehearsal, reset to 0
          let effectiveCapacity = v.capacity;
          if (effectiveCapacity === 350 && (defaultPlaceType === 'studio' || defaultPlaceType === 'rehearsal')) {
            effectiveCapacity = 0;
          } else if (effectiveCapacity === undefined || effectiveCapacity === null) {
            effectiveCapacity = cls.estimated_capacity;
          }

          const baseItem = {
            id: v.id || `v_${Math.random()}`,
            name: v.name,
            address: v.address || '',
            city: v.city,
            state: v.state_province || '',
            country: v.country || 'USA',
            lat: v.lat,
            lng: v.lng,
            place_type: defaultPlaceType,
            capacity: effectiveCapacity,
            email: v.email || '',
            genreFit: v.genre_fit || 85,
            payoutRating: v.payout_rating || 4.5,
            loadInRating: v.load_in_rating || 4.0,
            buyers: v.buyers || (defaultPlaceType === 'studio' ? 'Studio Manager' : 'Local Booking Coordinator'),
            intelEntries: Array.isArray(v.intel_entries) ? v.intel_entries : [
              v.lat && v.lng ? `GPS: [${v.lat}, ${v.lng}] calibrated for tour routing.` : 'Verified place directory.'
            ],
            source: v.source || 'MusicBrainz'
          };

          // Apply override if present
          if (customOverrides[baseItem.id]) {
            return { ...baseItem, ...customOverrides[baseItem.id] };
          }
          return baseItem;
        });

        setLocalVenues(prev => {
          const existingKeys = new Set(prev.map(p => `${p.name.toLowerCase()}_${p.city.toLowerCase()}`));
          const uniqueNew = mapped.filter(m => !existingKeys.has(`${m.name.toLowerCase()}_${m.city.toLowerCase()}`));
          return [...prev, ...uniqueNew];
        });
      }
    };

    loadPersistedVenues();
  }, []);

  useEffect(() => {
    // combine mockVenues with any dynamically passed global venues
    const mappedGlobal = (venues || []).map(v => {
      const cls = classifyPlace(v.name, (v as any).place_type);
      return {
        id: v.id,
        name: v.name,
        address: v.address || '',
        city: v.city,
        state: v.state_province || '',
        country: v.country || '',
        lat: v.lat,
        lng: v.lng,
        place_type: (v as any).place_type || cls.place_type,
        capacity: v.capacity !== undefined ? v.capacity : cls.estimated_capacity,
        email: v.email || '',
        genreFit: v.genre_fit || 50,
        payoutRating: v.payout_rating || 3,
        loadInRating: v.load_in_rating || 3,
        buyers: v.buyers || '',
        intelEntries: v.intel_entries || [],
        source: v.source
      };
    });
    
    // Merge but don't duplicate (by id or name+city)
    setLocalVenues(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const newGlobals = mappedGlobal.filter(mg => !existingIds.has(mg.id));
      return [...prev, ...newGlobals];
    });
  }, [venues]);

  const syncVenuesBatchToSupabase = async (venuesList: any[]) => {
    if (!venuesList || venuesList.length === 0) return;

    // 1. Post batch to server-side persistent endpoint (works across all devices & APK)
    try {
      await fetch('/api/venues/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venues: venuesList })
      });
    } catch (_) {}

    // 2. Direct Supabase venues upsert attempt
    const supabase = getSupabase();
    if (supabase) {
      for (const v of venuesList) {
        try {
          const venueId = v.id || `mb_${v.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${v.city.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const payload: any = {
            id: venueId,
            name: v.name,
            address: v.address || null,
            city: v.city,
            state_province: v.state_province || v.state || null,
            country: v.country || 'USA',
            lat: v.lat || null,
            lng: v.lng || null,
            place_type: v.place_type || 'venue',
            capacity: v.capacity || null,
            email: v.email || null,
            buyers: v.buyers || 'Local Booking Coordinator',
            genre_fit: v.genre_fit || v.genreFit || 85,
            payout_rating: v.payout_rating || v.payoutRating || 4.5,
            load_in_rating: v.load_in_rating || v.loadInRating || 4.0,
            source: 'MusicBrainz',
            intel_entries: Array.isArray(v.intel_entries || v.intelEntries) ? (v.intel_entries || v.intelEntries) : []
          };
          
          await supabase.from('venues').upsert(payload, { onConflict: 'id' });
        } catch (_) {}
      }
    }
  };

  const handleRunVenueSeeder = async () => {
    if (selectedHubs.length === 0) {
      triggerNotification("⚠️ Please select at least one tour hub city.");
      return;
    }

    setIsSeedingActive(true);
    setSeedingProgress(10);
    setSeedingLogs([`[INIT] Starting MusicBrainz place seeder for ${selectedHubs.length} hub(s): ${selectedHubs.join(', ')}...`]);

    try {
      let apiSuccess = false;

      // 1. Try server-side API endpoint
      try {
        setSeedingLogs(prev => [...prev, `[SERVER] Calling /api/venues/seed-musicbrainz...`]);
        const res = await fetch('/api/venues/seed-musicbrainz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cities: selectedHubs })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.venues && data.venues.length > 0) {
            apiSuccess = true;
            setSeedingProgress(100);
            setSeedingLogs(prev => [
              ...prev,
              `[SUCCESS] Server seeded ${data.totalVenues} places across ${selectedHubs.join(', ')}.`,
              `[DATABASE] Categorized live venues, recording studios, and rehearsal spaces with realistic capacity.`
            ]);

            const mapped = data.venues.map((v: any) => {
              const cls = classifyPlace(v.name, v.place_type);
              return {
                id: v.id,
                name: v.name,
                address: v.address || '',
                city: v.city,
                state: v.state_province || '',
                country: v.country || 'USA',
                lat: v.lat,
                lng: v.lng,
                place_type: v.place_type || cls.place_type,
                capacity: v.capacity !== undefined ? v.capacity : cls.estimated_capacity,
                email: v.email || '',
                genreFit: v.genre_fit || 85,
                payoutRating: v.payout_rating || 4.5,
                loadInRating: v.load_in_rating || 4.0,
                buyers: v.buyers || (v.place_type === 'studio' ? 'Studio Manager' : 'Local Booking Coordinator'),
                intelEntries: v.intel_entries || [
                  v.lat && v.lng ? `GPS: [${v.lat}, ${v.lng}] calibrated for tour routing.` : 'Verified place.'
                ],
                source: 'MusicBrainz'
              };
            });

            setLocalVenues(prev => {
              const existingKeys = new Set(prev.map(p => `${p.name.toLowerCase()}_${p.city.toLowerCase()}`));
              const newlyAdded = mapped.filter((m: any) => !existingKeys.has(`${m.name.toLowerCase()}_${m.city.toLowerCase()}`));
              return [...prev, ...newlyAdded];
            });

            if (setVenues) {
              setVenues(prev => {
                const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
                const added = data.venues.filter((v: any) => !existingNames.has(v.name.toLowerCase()));
                return [...prev, ...added];
              });
            }

            triggerNotification(`⚡ Pre-seeded ${data.totalVenues} categorized places for tour routing!`);

            // Register these hubs as seeded and remove from active target list
            const newlySeeded = Array.from(new Set([...seededHubs, ...selectedHubs]));
            setSeededHubs(newlySeeded);
            try {
              localStorage.setItem('nexus_seeded_hubs', JSON.stringify(newlySeeded));
            } catch (e) {}
            setSelectedHubs([]);

            // Guarantee direct sync to Supabase venues table from client
            if (data.venues && data.venues.length > 0) {
              syncVenuesBatchToSupabase(data.venues);
            }
          }
        }
      } catch (apiErr) {
        console.warn("Backend API seeder fallback to direct service:", apiErr);
      }

      // 2. Client-side fallback if server-side is bypassed
      if (!apiSuccess) {
        setSeedingLogs(prev => [...prev, `[CLIENT] Running direct MusicBrainz seeder service...`]);
        const result = await seedVenuesForCities(selectedHubs, (msg, _city, pct) => {
          if (pct) setSeedingProgress(pct);
          setSeedingLogs(prev => [...prev, `[STATUS] ${msg}`]);
        });

        if (result.venues.length > 0) {
          const mapped = result.venues.map(v => ({
            id: v.id,
            name: v.name,
            address: v.address || '',
            city: v.city,
            state: v.state_province || '',
            country: v.country || 'USA',
            lat: v.lat,
            lng: v.lng,
            place_type: v.place_type || 'venue',
            capacity: v.capacity !== undefined ? v.capacity : 350,
            email: v.email || '',
            genreFit: v.genre_fit || 85,
            payoutRating: v.payout_rating || 4.5,
            loadInRating: v.load_in_rating || 4.0,
            buyers: v.buyers || 'Local Booking Coordinator',
            intelEntries: v.intel_entries || [],
            source: 'MusicBrainz'
          }));

          setLocalVenues(prev => {
            const existingKeys = new Set(prev.map(p => `${p.name.toLowerCase()}_${p.city.toLowerCase()}`));
            const newlyAdded = mapped.filter(m => !existingKeys.has(`${m.name.toLowerCase()}_${m.city.toLowerCase()}`));
            return [...prev, ...newlyAdded];
          });

          if (setVenues) {
            setVenues(prev => {
              const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
              const added = result.venues.filter(v => !existingNames.has(v.name.toLowerCase()));
              return [...prev, ...added];
            });
          }

          triggerNotification(`⚡ Seeded ${result.totalVenuesFound} places via MusicBrainz!`);

          // Register these hubs as seeded and remove from active target list
          const newlySeeded = Array.from(new Set([...seededHubs, ...selectedHubs]));
          setSeededHubs(newlySeeded);
          try {
            localStorage.setItem('nexus_seeded_hubs', JSON.stringify(newlySeeded));
          } catch (e) {}
          setSelectedHubs([]);

          // Guarantee sync to Supabase venues table from client
          if (result.venues && result.venues.length > 0) {
            syncVenuesBatchToSupabase(result.venues);
          }
        }
      }
    } catch (err: any) {
      setSeedingLogs(prev => [...prev, `[ERROR] ${err.message || err}`]);
      triggerNotification("⚠️ Seeding completed with warnings.");
    } finally {
      setIsSeedingActive(false);
    }
  };

  /**
   * Temporary utility button handler:
   * Pushes all currently seeded hubs and venues (local state + built-in directory)
   * into the Supabase 'venues' table.
   */
  const handlePushAllHubsToSupabase = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      triggerNotification("⚠️ Supabase client is not connected.");
      return;
    }

    setIsPushingToSupabase(true);
    triggerNotification("🚀 Starting batch sync of all seeded hubs to Supabase 'venues' table...");

    try {
      // Map built-in directory venues
      const builtInMapped = BUILT_IN_BLACK_BOOK_VENUES.map(v => ({
        id: v.id,
        name: v.name,
        address: v.fullAddress || v.streetAddress || '',
        city: v.city || 'Unknown',
        state_province: v.state || 'USA',
        country: v.country || 'USA',
        capacity: typeof v.capacity === 'number' ? v.capacity : parseInt(v.capacity as any, 10) || 500,
        place_type: 'venue',
        email: v.contactEmail || (v as any).email || '',
        buyers: v.contactName || (v as any).buyers || 'Local Booking Coordinator',
        genre_fit: v.genreFit || 90,
        payout_rating: v.payoutRating || 4.8,
        load_in_rating: v.loadInRating || 4.5,
        source: 'blackbook_builtin',
        intel_entries: [v.parkingNotes, v.notes].filter(Boolean)
      }));

      const combinedToPush = [...localVenues, ...builtInMapped];

      // Deduplicate by Name + City
      const uniqueMap = new Map<string, any>();
      combinedToPush.forEach(v => {
        if (!v?.name) return;
        const cleanName = v.name.trim();
        const cleanCity = (v.city || '').trim();
        const key = `${cleanName.toLowerCase()}_${cleanCity.toLowerCase()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, v);
        }
      });

      const uniqueList = Array.from(uniqueMap.values());
      let successCount = 0;
      let errorCount = 0;

      // Batch push in chunks of 20
      const chunkSize = 20;
      for (let i = 0; i < uniqueList.length; i += chunkSize) {
        const chunk = uniqueList.slice(i, i + chunkSize);

        const payloads = chunk.map(v => {
          const safeId = v.id && !String(v.id).startsWith('v_0.')
            ? String(v.id)
            : `hub_${v.name.replace(/\W+/g, '_').toLowerCase()}_${(v.city || '').replace(/\W+/g, '_').toLowerCase()}`;

          return {
            id: safeId,
            name: v.name,
            address: v.address || v.fullAddress || v.streetAddress || null,
            city: v.city || 'Unknown',
            state_province: v.state_province || v.state || 'USA',
            country: v.country || 'USA',
            place_type: v.place_type || 'venue',
            capacity: typeof v.capacity === 'number' ? v.capacity : (parseInt(v.capacity, 10) || null),
            email: v.email || null,
            buyers: v.buyers || 'Local Booking Coordinator',
            genre_fit: typeof v.genreFit === 'number' ? v.genreFit : (v.genre_fit || 85),
            payout_rating: typeof v.payoutRating === 'number' ? v.payoutRating : (v.payout_rating || 4.5),
            load_in_rating: typeof v.loadInRating === 'number' ? v.loadInRating : (v.load_in_rating || 4.0),
            lat: typeof v.lat === 'number' ? v.lat : null,
            lng: typeof v.lng === 'number' ? v.lng : null,
            source: v.source || 'blackbook_seeded',
            intel_entries: Array.isArray(v.intelEntries) ? v.intelEntries : (Array.isArray(v.intel_entries) ? v.intel_entries : [])
          };
        });

        // Attempt 1: Extended schema upsert
        const { error: fullErr } = await supabase.from('venues').upsert(payloads, { onConflict: 'id' });

        if (!fullErr) {
          successCount += chunk.length;
        } else {
          // Attempt 2: Base schema fallback
          const basePayloads = payloads.map(v => ({
            id: v.id,
            name: v.name,
            city: v.city,
            state_province: v.state_province,
            country: v.country,
            capacity: v.capacity,
            email: v.email,
            buyers: v.buyers,
            genre_fit: v.genre_fit,
            payout_rating: v.payout_rating,
            load_in_rating: v.load_in_rating,
            intel_entries: v.intel_entries
          }));

          const { error: baseErr } = await supabase.from('venues').upsert(basePayloads, { onConflict: 'id' });

          if (!baseErr) {
            successCount += chunk.length;
          } else {
            console.warn('Batch venue push chunk error:', baseErr.message);
            errorCount += chunk.length;
          }
        }
      }

      if (errorCount === 0) {
        triggerNotification(`✅ Successfully pushed ${successCount} seeded hubs to Supabase 'venues' table!`);
      } else {
        triggerNotification(`⚡ Pushed ${successCount} hubs to Supabase (${errorCount} failed or restricted).`);
      }
    } catch (err: any) {
      console.error('Error pushing hubs to Supabase:', err);
      triggerNotification(`❌ Error pushing hubs to Supabase: ${err?.message || err}`);
    } finally {
      setIsPushingToSupabase(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pitchText, setPitchText] = useState('');
  
  // New State for contributions
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [newVenueForm, setNewVenueForm] = useState({ 
    name: '', 
    city: '', 
    state: '', 
    country: '', 
    address: '',
    website: '',
    capacity: '', 
    email: '', 
    buyers: '',
    place_type: 'venue'
  });
  
  const [intelVenueId, setIntelVenueId] = useState<string | null>(null);
  const [newIntelForm, setNewIntelForm] = useState({ payout: 5, loadIn: 5, notes: '' });

  // Beacon System
  const [beaconForm, setBeaconForm] = useState({ targetRegion: '', radius: '50 MI', startDate: '', endDate: '', contactLocal: userProfile?.email || 'booking@band.com' });
  const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>({});
  const [reRequestPanel, setReRequestPanel] = useState<Record<string, boolean>>({});

  // Swipe logic indices tracker and handlers
  const [activeIntelIndex, setActiveIntelIndex] = useState<Record<string, number>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = (venueId: string, entriesLen: number) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      setActiveIntelIndex(prev => {
        const activeIdx = prev[venueId] !== undefined ? Math.max(0, Math.min(prev[venueId], entriesLen - 1)) : 0;
        let newIdx = activeIdx;
        if (isLeftSwipe) {
          newIdx = (activeIdx + 1) % entriesLen;
        } else if (isRightSwipe) {
          newIdx = (activeIdx - 1 + entriesLen) % entriesLen;
        }
        return { ...prev, [venueId]: newIdx };
      });
    }
  };

  // Contact Suggestion Tracker
  const [suggestionModalVenue, setSuggestionModalVenue] = useState<any>(null);
  const [suggestionForm, setSuggestionForm] = useState({ buyer_name: '', booking_email: '' });

  const handleOpenSuggestion = (venue: any) => {
    setSuggestionModalVenue(venue);
    setSuggestionForm({ buyer_name: venue.buyers, booking_email: venue.email });
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestionModalVenue) return;
    const supabase = getSupabase();
    if (supabase) {
        try {
            await supabase.from('contact_suggestions').insert([{
                venue_id: suggestionModalVenue.id,
                suggested_buyer_name: suggestionForm.buyer_name,
                suggested_booking_email: suggestionForm.booking_email,
                status: 'pending'
            }]);
            triggerNotification('Correction submitted to verification queue.');
        } catch (e) {
            triggerNotification('Correction submitted to verification queue (local reserve).');
        }
    } else {
        triggerNotification('Correction submitted to verification queue (offline auth).');
    }
    setSuggestionModalVenue(null);
  };

  const handleBroadcastBeacon = async () => {
    if (!beaconForm.targetRegion || !beaconForm.startDate || !beaconForm.endDate) {
      triggerNotification("Please fill required fields (Target Location, Window Start/End).");
      return;
    }
    const supabase = getSupabase();
    try {
      const payload = {
        id: `beacon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        band_name: activeBandName,
        target_region: beaconForm.targetRegion,
        start_date: beaconForm.startDate,
        end_date: beaconForm.endDate,
        booking_email: userProfile?.email || '',
        genre_tags: userProfile?.genre_tags || [],
        created_at: new Date().toISOString()
      };
      
      if (supabase) {
        await supabase.from('routing_beacons_v1').insert([payload]);
      }
      
      setBeacons(prev => {
        const next = [payload as any, ...prev];
        try {
          const localStr = localStorage.getItem('nexus_core_routing_beacons_v1');
          let allBeacons = localStr ? JSON.parse(localStr) : [];
          allBeacons = [payload, ...allBeacons];
          localStorage.setItem('nexus_core_routing_beacons_v1', JSON.stringify(allBeacons));
        } catch (err) {}
        return next;
      });
      triggerNotification(`Beacon broadcasted for ${beaconForm.targetRegion} [${beaconForm.radius} Radius]`);
      setBeaconForm(p => ({ ...p, targetRegion: '', startDate: '', endDate: '' }));
    } catch (e) {
      triggerNotification("Broadcast submitted to queue (local fallback).");
    }
  };

  const isCreativeField = userProfile?.account_type === 'creative';
  const activeMetadata = isCreativeField ? userProfile?.creative_metadata : userProfile?.promoter_metadata;
  const savedVenueIds = activeMetadata?.saved_venues || [];

  // Expand / Collapse state for all cards
  const [areAllExpanded, setAreAllExpanded] = useState<boolean>(false);
  const [globalExpandState, setGlobalExpandState] = useState<boolean | undefined>(undefined);

  // Active places excluding deleted records
  const activePlaces = localVenues.filter(v => !deletedVenueIds.has(v.id));

  // Compute category counts for tab headers
  const venuesCount = activePlaces.filter(v => {
    const pType = v.place_type;
    if (pType === 'studio' || pType === 'rehearsal') return false;
    if (v.name?.toLowerCase().match(/\b(studio|recording|rehearsal)\b/i)) return false;
    return true;
  }).length;
  const studiosCount = activePlaces.filter(v => {
    return v.place_type === 'studio' || v.name?.toLowerCase().match(/\b(studio|recording|sound lab|mastering|tracking)\b/i);
  }).length;
  const rehearsalCount = activePlaces.filter(v => {
    return v.place_type === 'rehearsal' || v.place_type === 'other' || v.name?.toLowerCase().match(/\b(rehearsal|lockout|jam space|production center)\b/i);
  }).length;
  const savedCount = activePlaces.filter(v => savedVenueIds.includes(v.id)).length;
  const detectedDefunctCount = activePlaces.filter(v => detectDefunctReason(v) !== null).length;

  // Derive unique seeded cities and places counts
  const seededHubsWithCounts = useMemo(() => {
    const countsByCity: Record<string, number> = {};
    activePlaces.forEach(p => {
      if (!p.city) return;
      const cleanCity = p.city.trim();
      if (!cleanCity) return;
      // Capitalize first letters nicely
      const normalized = cleanCity;
      countsByCity[normalized] = (countsByCity[normalized] || 0) + 1;
    });

    // Merge explicitly seeded hubs with all cities found in active places
    const allKnownCities = Array.from(new Set([...seededHubs, ...Object.keys(countsByCity)]));
    return allKnownCities
      .map(city => ({
        city,
        count: countsByCity[city] || 0
      }))
      .filter(item => item.count > 0 || seededHubs.some(sh => sh.toLowerCase() === item.city.toLowerCase()))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  }, [activePlaces, seededHubs]);

  const filteredVenues = activePlaces.filter(v => {
    // 1. City / Seeded Hub Smart Filter
    if (selectedCityFilter) {
      if (v.city.toLowerCase() !== selectedCityFilter.toLowerCase()) {
        return false;
      }
    }

    // 2. Tab category filter
    if (categoryFilter === 'saved' || showBookmarksOnly) {
      if (!savedVenueIds.includes(v.id)) return false;
    } else if (categoryFilter === 'venue') {
      const isStudio = v.place_type === 'studio' || v.name?.toLowerCase().match(/\b(studio|recording|sound lab)\b/i);
      const isRehearsal = v.place_type === 'rehearsal' || v.name?.toLowerCase().match(/\b(rehearsal|lockout)\b/i);
      if (isStudio || isRehearsal) return false;
    } else if (categoryFilter === 'studio') {
      const isStudio = v.place_type === 'studio' || v.name?.toLowerCase().match(/\b(studio|recording|sound lab|mastering|tracking)\b/i);
      if (!isStudio) return false;
    } else if (categoryFilter === 'rehearsal') {
      const isRehearsal = v.place_type === 'rehearsal' || v.place_type === 'other' || v.name?.toLowerCase().match(/\b(rehearsal|lockout|jam space|production center)\b/i);
      if (!isRehearsal) return false;
    }

    // 3. Search term filter
    return (
      v.city.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (v.state && v.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.country && v.country.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleOpenEditVenue = (venue: any) => {
    setEditVenueForm({
      id: venue.id,
      name: venue.name || '',
      place_type: venue.place_type || 'venue',
      capacity: venue.capacity !== undefined ? String(venue.capacity) : '',
      address: venue.address || '',
      city: venue.city || '',
      state: venue.state || venue.state_province || '',
      country: venue.country || 'USA',
      website: venue.website || '',
      lat: venue.lat !== undefined && venue.lat !== null ? String(venue.lat) : '',
      lng: venue.lng !== undefined && venue.lng !== null ? String(venue.lng) : '',
      buyers: venue.buyers || '',
      email: venue.email || '',
      phone: venue.phone || '',
      genreFit: venue.genreFit || venue.genre_fit || 85,
      payoutRating: venue.payoutRating || venue.payout_rating || 4.5,
      loadInRating: venue.loadInRating || venue.load_in_rating || 4.0,
      notes: '',
      intelNote: ''
    });
    setIsEditVenueOpen(true);
  };

  const handleSaveEditVenue = async () => {
    if (!editVenueForm.id || !editVenueForm.name || !editVenueForm.city) {
      triggerNotification("⚠️ Name and City are required.");
      return;
    }

    const capNum = parseInt(editVenueForm.capacity);
    const effectiveCap = isNaN(capNum) ? 0 : capNum;

    const updatedData: any = {
      name: editVenueForm.name,
      place_type: editVenueForm.place_type,
      capacity: effectiveCap,
      address: editVenueForm.address,
      city: editVenueForm.city,
      state: editVenueForm.state,
      state_province: editVenueForm.state,
      country: editVenueForm.country,
      website: editVenueForm.website,
      lat: editVenueForm.lat ? parseFloat(editVenueForm.lat) : null,
      lng: editVenueForm.lng ? parseFloat(editVenueForm.lng) : null,
      buyers: editVenueForm.buyers,
      email: editVenueForm.email,
      phone: editVenueForm.phone,
      genreFit: Number(editVenueForm.genreFit),
      genre_fit: Number(editVenueForm.genreFit),
      payoutRating: Number(editVenueForm.payoutRating),
      payout_rating: Number(editVenueForm.payoutRating),
      loadInRating: Number(editVenueForm.loadInRating),
      load_in_rating: Number(editVenueForm.loadInRating)
    };

    // Update local state
    setLocalVenues(prev => prev.map(v => {
      if (v.id === editVenueForm.id) {
        const existingEntries = Array.isArray(v.intelEntries) ? [...v.intelEntries] : [];
        const noteToAdd = editVenueForm.notes?.trim() || editVenueForm.intelNote?.trim();
        if (noteToAdd) {
          existingEntries.unshift(`[UPDATED] ${noteToAdd}`);
        }
        return {
          ...v,
          ...updatedData,
          intelEntries: existingEntries
        };
      }
      return v;
    }));

    if (setVenues) {
      setVenues(prev => prev.map(v => v.id === editVenueForm.id ? { ...v, ...updatedData } : v));
    }

    // Save to LocalStorage overrides
    try {
      const overridesStr = localStorage.getItem('nexus_venue_custom_overrides');
      const overrides = overridesStr ? JSON.parse(overridesStr) : {};
      overrides[editVenueForm.id] = updatedData;
      localStorage.setItem('nexus_venue_custom_overrides', JSON.stringify(overrides));
    } catch {}

    // Persist to Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('venues').update({
          name: updatedData.name,
          place_type: updatedData.place_type,
          capacity: updatedData.capacity,
          address: updatedData.address,
          city: updatedData.city,
          state_province: updatedData.state_province,
          country: updatedData.country,
          website: updatedData.website,
          lat: updatedData.lat,
          lng: updatedData.lng,
          buyers: updatedData.buyers,
          email: updatedData.email,
          genre_fit: updatedData.genre_fit,
          payout_rating: updatedData.payout_rating,
          load_in_rating: updatedData.load_in_rating
        }).eq('id', editVenueForm.id);
      } catch (err) {
        console.warn("Could not sync edit to Supabase:", err);
      }
    }

    setIsEditVenueOpen(false);
    triggerNotification(`✅ Updated details for ${editVenueForm.name}`);
  };

  const handleOpenDeleteVenue = (id: string, name: string, venueObj?: any) => {
    setVenueToDelete({
      id,
      name,
      city: venueObj?.city,
      state: venueObj?.state || venueObj?.state_province,
      capacity: venueObj?.capacity,
      source: venueObj?.source
    });
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!venueToDelete) return;
    const { id, name } = venueToDelete;

    // Remove from localVenues
    setLocalVenues(prev => prev.filter(v => v.id !== id));
    if (setVenues) {
      setVenues(prev => prev.filter(v => v.id !== id));
    }

    // Update deleted registry
    setDeletedVenueIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('nexus_deleted_venue_ids', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    // Delete from Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('venues').delete().eq('id', id);
      } catch (err) {
        console.warn("Could not delete venue from Supabase:", err);
      }
    }

    setIsDeleteConfirmOpen(false);
    setVenueToDelete(null);
    triggerNotification(`🗑️ Removed "${name}" from Black Book.`);
  };

  const handleOpenAuditModal = () => {
    const flagged: Array<{ venue: any; reason: string }> = [];
    const seenIds = new Set<string>();

    for (const v of activePlaces) {
      const reason = detectDefunctReason(v);
      if (reason && !seenIds.has(v.id)) {
        flagged.push({ venue: v, reason });
        seenIds.add(v.id);
      }
    }

    setAuditFlaggedPlaces(flagged);
    setSelectedAuditIds(new Set(flagged.map(f => f.venue.id)));
    setAuditSearch('');
    setAuditCustomTerm('');
    setIsAuditModalOpen(true);
  };

  const handleAddCustomAuditScan = () => {
    const term = auditCustomTerm.trim().toLowerCase();
    if (!term) return;

    const matching = activePlaces.filter(v => 
      v.name.toLowerCase().includes(term) || 
      v.city.toLowerCase().includes(term) ||
      (v.address && v.address.toLowerCase().includes(term))
    );

    if (matching.length === 0) {
      triggerNotification(`No active places found matching "${auditCustomTerm}".`);
      return;
    }

    setAuditFlaggedPlaces(prev => {
      const existingIds = new Set(prev.map(p => p.venue.id));
      const newlyFlagged = matching
        .filter(m => !existingIds.has(m.id))
        .map(m => ({ venue: m, reason: `Matches search: "${auditCustomTerm}"` }));
      return [...prev, ...newlyFlagged];
    });

    setSelectedAuditIds(prev => {
      const next = new Set(prev);
      matching.forEach(m => next.add(m.id));
      return next;
    });

    triggerNotification(`Flagged ${matching.length} matching places for review.`);
    setAuditCustomTerm('');
  };

  const handleToggleAuditSelect = (id: string) => {
    setSelectedAuditIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllAudit = (filteredList: Array<{ venue: any; reason: string }>) => {
    const allFilteredSelected = filteredList.every(item => selectedAuditIds.has(item.venue.id));
    setSelectedAuditIds(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredList.forEach(item => next.delete(item.venue.id));
      } else {
        filteredList.forEach(item => next.add(item.venue.id));
      }
      return next;
    });
  };

  const handlePurgeSelectedDefunct = async () => {
    if (selectedAuditIds.size === 0) return;
    setIsPurging(true);
    const idsToPurge = Array.from(selectedAuditIds);

    // 1. Remove from local state
    setLocalVenues(prev => prev.filter(v => !selectedAuditIds.has(v.id)));
    if (setVenues) {
      setVenues(prev => prev.filter(v => !selectedAuditIds.has(v.id)));
    }

    // 2. Mark in deleted IDs set and localStorage
    setDeletedVenueIds(prev => {
      const next = new Set(prev);
      idsToPurge.forEach(id => next.add(id));
      try {
        localStorage.setItem('nexus_deleted_venue_ids', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    // 3. Delete from Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('venues').delete().in('id', idsToPurge);
      } catch (err) {
        console.warn("Could not batch delete from Supabase:", err);
      }
    }

    setIsPurging(false);
    setIsAuditModalOpen(false);
    triggerNotification(`🗑️ Purged ${idsToPurge.length} defunct places from the Black Book!`);
  };

  const handleGeneratePitch = (venue: any) => {
    setSelectedVenue(venue);
    setPitchText(getPitchTemplate(venue));
    setIsModalOpen(true);
  };

  const getPitchTemplate = (venue: any) => {
    return `Subject: Booking Inquiry: ${activeBandName} / ${venue.city}, ${venue.state || ''} Routing

Hi ${venue.buyers || 'Booking Team'},

Hope this email finds you well. I'm reaching out regarding potential dates for ${activeBandName} routing through ${venue.city}. We know ${venue.name} is the premier spot for our genre, and we're looking to lock in a date for our upcoming run.

We typically draw solid numbers in the region and believe we'd be a great fit for your calendar. We can provide recent draw history and references upon request.

Let us know if you have any avails coming up.

Best,
${userProfile?.name || 'Manager'}
Representing ${activeBandName}`;
  };

  const handleCopyPitch = () => {
    if (selectedVenue) {
      navigator.clipboard.writeText(pitchText);
      triggerNotification("Pitch copied to clipboard!");
      setIsModalOpen(false);
    }
  };

  const handleAddVenue = async () => {
    if (!newVenueForm.name.trim() || !newVenueForm.city.trim()) {
      triggerNotification("Please fill required fields (Place Name and City).");
      return;
    }
    const venueId = `v_${Date.now()}`;
    const fullAddress = [newVenueForm.address?.trim(), newVenueForm.city?.trim(), newVenueForm.state?.trim()].filter(Boolean).join(', ');
    const venue = {
      id: venueId,
      name: newVenueForm.name.trim(),
      city: newVenueForm.city.trim(),
      state: newVenueForm.state.trim() || 'N/A',
      state_province: newVenueForm.state.trim() || 'N/A',
      country: newVenueForm.country.trim() || 'USA',
      address: newVenueForm.address.trim() || fullAddress,
      street_address: newVenueForm.address.trim() || '',
      website: newVenueForm.website.trim() || '',
      place_type: newVenueForm.place_type || 'venue',
      capacity: parseInt(newVenueForm.capacity) || 0,
      email: newVenueForm.email.trim() || '',
      buyers: newVenueForm.buyers.trim() || (newVenueForm.place_type === 'studio' ? 'Studio Coordinator' : 'Booking Dept.'),
      genre_fit: 85,
      genreFit: 85,
      payout_rating: 0,
      payoutRating: 0,
      load_in_rating: 0,
      loadInRating: 0,
      intel_entries: ['Community submitted place. Be the first to contribute intel notes!'],
      intelEntries: ['Community submitted place. Be the first to contribute intel notes!'],
      source: 'UserSubmission'
    };
    
    setLocalVenues(prev => [venue, ...prev]);

    if (setVenues) {
      setVenues(prev => [venue as any, ...prev]);
    }

    try {
      const overridesStr = localStorage.getItem('nexus_venue_custom_overrides');
      const overrides = overridesStr ? JSON.parse(overridesStr) : {};
      overrides[venueId] = venue;
      localStorage.setItem('nexus_venue_custom_overrides', JSON.stringify(overrides));
    } catch {}

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('venues').insert([{
          id: venueId,
          name: venue.name,
          address: venue.address,
          website: venue.website,
          city: venue.city,
          state_province: venue.state_province,
          country: venue.country,
          capacity: venue.capacity,
          email: venue.email,
          genre_fit: venue.genre_fit,
          payout_rating: venue.payout_rating,
          load_in_rating: venue.load_in_rating,
          buyers: venue.buyers,
          intel_entries: venue.intel_entries
        }]);
      } catch (err) {
        console.warn("Could not insert venue to Supabase:", err);
      }
    }

    setNewVenueForm({ 
      name: '', 
      city: '', 
      state: '', 
      country: '', 
      address: '',
      website: '',
      capacity: '', 
      email: '', 
      buyers: '', 
      place_type: 'venue' 
    });
    setIsAddVenueOpen(false);
    triggerNotification(`Added "${venue.name}" to the Black Book.`);
  };

  const handleAddIntel = async () => {
    if (!intelVenueId) return;
    if (!newIntelForm.notes) {
      triggerNotification("Please add some notes to your intel.");
      return;
    }

    let updatedVenueRecord: any = null;

    setVenues(prev => prev.map((v: any) => {
      if (v.id === intelVenueId) {
        const newPayout = v.payoutRating === 0 ? newIntelForm.payout : (v.payoutRating + newIntelForm.payout) / 2;
        const newLoadIn = v.loadInRating === 0 ? newIntelForm.loadIn : (v.loadInRating + newIntelForm.loadIn) / 2;
        
        const currentEntries = v.intelEntries && v.intelEntries[0] !== 'No intel yet. Be the first to contribute!'
          ? v.intelEntries
          : [];

        const updatedEntries = [newIntelForm.notes, ...currentEntries];

        updatedVenueRecord = {
          ...v,
          payoutRating: newPayout,
          loadInRating: newLoadIn,
          payout_rating: newPayout,
          load_in_rating: newLoadIn,
          intelEntries: updatedEntries,
          intel_entries: updatedEntries
        };
        return updatedVenueRecord;
      }
      return v;
    }));

    setLocalVenues(prev => prev.map((v: any) => {
      if (v.id === intelVenueId && updatedVenueRecord) {
        return updatedVenueRecord;
      }
      return v;
    }));

    try {
      if (updatedVenueRecord) {
        const overridesStr = localStorage.getItem('nexus_venue_custom_overrides');
        const overrides = overridesStr ? JSON.parse(overridesStr) : {};
        overrides[intelVenueId] = updatedVenueRecord;
        localStorage.setItem('nexus_venue_custom_overrides', JSON.stringify(overrides));
      }
    } catch {}

    const supabase = getSupabase();
    if (supabase && updatedVenueRecord) {
      try {
        await supabase.from('venues').update({
          payout_rating: updatedVenueRecord.payout_rating,
          load_in_rating: updatedVenueRecord.load_in_rating,
          intel_entries: updatedVenueRecord.intel_entries
        }).eq('id', intelVenueId);
      } catch (err) {
        console.warn("Could not sync intel to Supabase:", err);
      }
    }
    
    setActiveIntelIndex(prev => ({ ...prev, [intelVenueId]: 0 }));
    setIntelVenueId(null);
    setNewIntelForm({ payout: 5, loadIn: 5, notes: '' });
    triggerNotification("Intel contributed and synced globally.");
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-white">
      {/* Header */}
      <div className="flex-none pt-6 pb-6 px-5 border-b border-zinc-800 bg-[#0a0a0c]/95 backdrop-blur z-10 sticky top-0 relative">
        {/* Centered Title Lockup */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <h1 
              className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white uppercase text-center select-text leading-none"
              style={{
                textShadow: activeTab === 'beacons' ? 'none' : '0 0 12px rgba(245, 158, 11, 0.4), 0 0 25px rgba(217, 119, 6, 0.35), 0 0 50px rgba(245, 158, 11, 0.2)',
                letterSpacing: '0.1em',
                fontWeight: 950,
                fontSize: '22px',
                marginLeft: '0px',
                marginTop: '0px'
              }}
            >
              {activeTab === 'beacons' ? '📡 Routing Beacons & Offers' : 'The Black Book'}
            </h1>
          </motion.div>
          <p 
            className="text-xs md:text-sm text-zinc-400 font-mono tracking-wide max-w-xl leading-relaxed text-center"
            style={{ marginTop: '-6px', fontSize: '11px' }}
          >
            {activeTab === 'directory' 
              ? "A community-sourced and vetted directory providing live, crowd-verified independent venue logistics, contact pipelines, and field intel."
              : "Broadcast your open dates to promoters in target regions, source booking offers, and review deal guarantees."}
          </p>
        </div>

        {/* Tab Controls */}
        {!hideTabs && (
          <div className="mt-4 flex bg-black rounded p-1 border border-zinc-800">
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono transition-colors ${
                activeTab === 'directory' 
                  ? 'bg-[#a855f7]/20 text-[#a855f7]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Directory
            </button>
            <button
              onClick={() => setActiveTab('beacons')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono transition-colors ${
                activeTab === 'beacons' 
                  ? 'bg-[#00ffcc]/20 text-[#00ffcc]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Beacons & Offers
            </button>
          </div>
        )}

        {/* Action Button, Subcategory Tabs & Search Bar */}
        {activeTab === 'directory' && (
          <div className="mt-4 flex flex-col gap-3 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setIsAddVenueOpen(true)}
                className="w-full bg-transparent border-2 border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc]/10 py-2.5 rounded-lg flex items-center justify-center font-bold tracking-widest uppercase transition-colors font-mono cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.15)] text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5 shrink-0" />
                <span>Add Place</span>
              </button>
              <button
                onClick={() => setIsSeederModalOpen(true)}
                className="w-full bg-gradient-to-r from-teal-950/60 to-emerald-950/40 border-2 border-teal-400 text-teal-300 hover:from-teal-900/60 hover:to-emerald-900/40 py-2.5 rounded-lg flex items-center justify-center font-bold tracking-widest uppercase transition-all font-mono cursor-pointer shadow-[0_0_20px_rgba(45,212,191,0.25)] text-xs group truncate px-2"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-teal-400 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="truncate">Seed Tour Hubs</span>
              </button>
              <button
                type="button"
                onClick={handlePushAllHubsToSupabase}
                disabled={isPushingToSupabase}
                className="w-full bg-gradient-to-r from-amber-950/70 via-purple-950/60 to-amber-950/70 border-2 border-amber-400 text-amber-300 hover:from-amber-900/80 hover:to-purple-900/80 py-2.5 rounded-lg flex items-center justify-center font-bold tracking-widest uppercase transition-all font-mono cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] text-xs group truncate px-2 disabled:opacity-50"
                title="Temporary action: Push all currently seeded hubs and venues to Supabase 'venues' table"
              >
                <Database className={`w-4 h-4 mr-1.5 text-amber-400 shrink-0 ${isPushingToSupabase ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="truncate">{isPushingToSupabase ? 'Pushing Hubs...' : '⚡ Push Hubs to Supabase'}</span>
              </button>
            </div>

            {/* Category Filter Tabs Grid (Live Stages, Studios, Rehearsal, Bookmarks) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-1">
              {[
                { id: 'venue', label: 'Live Stages', count: venuesCount, icon: Music, color: 'text-teal-400', activeBg: 'bg-teal-950/40', activeBorder: 'border-teal-500/70' },
                { id: 'studio', label: 'Studios', count: studiosCount, icon: Mic2, color: 'text-purple-400', activeBg: 'bg-purple-950/40', activeBorder: 'border-purple-500/70' },
                { id: 'rehearsal', label: 'Rehearsal', count: rehearsalCount, icon: Building2, color: 'text-sky-400', activeBg: 'bg-sky-950/40', activeBorder: 'border-sky-500/70' },
                { id: 'saved', label: 'Bookmarks', count: savedCount, icon: Star, color: 'text-amber-400', activeBg: 'bg-amber-950/40', activeBorder: 'border-amber-500/70' }
              ].map(tab => {
                const isActive = (categoryFilter === tab.id && !showBookmarksOnly) || (tab.id === 'saved' && showBookmarksOnly);
                const Icon = tab.icon;
                return (
                  <button
                    key={`cat-tab-${tab.id}`}
                    type="button"
                    onClick={() => {
                      if (tab.id === 'saved') {
                        setShowBookmarksOnly(true);
                        setCategoryFilter('saved');
                      } else {
                        setShowBookmarksOnly(false);
                        setCategoryFilter(tab.id as any);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-between gap-1.5 cursor-pointer border select-none ${
                      isActive
                        ? `${tab.activeBg} ${tab.activeBorder} text-white shadow-md ring-1 ring-white/10`
                        : 'bg-zinc-950/80 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? tab.color : 'text-zinc-500'}`} />
                      <span className="truncate text-[11px]">{tab.label}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 font-mono ${
                      isActive ? 'bg-zinc-700 text-white font-black' : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar & Expand/Collapse Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search city, state, venue/studio, country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#13161a] border border-zinc-800 text-sm rounded-lg pl-9 pr-8 py-2.5 focus:outline-none focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/30 transition-all font-sans placeholder:text-zinc-500 text-zinc-200"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                    title="Clear Search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <div className="text-[11px] font-mono text-zinc-500 px-2.5 py-2 bg-zinc-950/80 rounded-lg border border-zinc-900">
                  <span className="text-zinc-300 font-bold">{filteredVenues.length}</span> {filteredVenues.length === 1 ? 'place' : 'places'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !areAllExpanded;
                    setAreAllExpanded(next);
                    setGlobalExpandState(next);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
                    areAllExpanded
                      ? 'bg-[#a855f7]/20 border-[#a855f7]/50 text-[#d8b4fe]'
                      : 'bg-[#13161a] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                  title={areAllExpanded ? "Collapse All Cards" : "Expand All Cards"}
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span>{areAllExpanded ? 'Collapse All' : 'Expand All'}</span>
                </button>
              </div>
            </div>

            {/* Smart Seeded Hubs City / Region Filter Buttons */}
            {seededHubsWithCounts.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-teal-400" />
                    <span>Seeded Hubs Filter</span>
                    {selectedCityFilter && (
                      <span className="text-zinc-400 font-normal">
                        • showing <strong className="text-teal-300 underline">{selectedCityFilter}</strong>
                      </span>
                    )}
                  </span>
                  {selectedCityFilter && (
                    <button
                      type="button"
                      onClick={() => setSelectedCityFilter(null)}
                      className="text-[10px] font-mono text-teal-400 hover:text-teal-300 underline cursor-pointer"
                    >
                      Show All Regions
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  <button
                    type="button"
                    onClick={() => setSelectedCityFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-all cursor-pointer border flex items-center gap-1.5 ${
                      selectedCityFilter === null
                        ? 'bg-teal-400 text-black border-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.4)] font-black'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>All Hubs</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      selectedCityFilter === null ? 'bg-black/20 text-black font-black' : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      {activePlaces.length}
                    </span>
                  </button>

                  {seededHubsWithCounts.map(({ city, count }) => {
                    const isSelected = selectedCityFilter?.toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        key={`hub-filter-${city}`}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCityFilter(null);
                          } else {
                            setSelectedCityFilter(city);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-400 text-black border-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.5)] font-black ring-1 ring-teal-300'
                            : 'bg-zinc-950/80 border-zinc-850 text-zinc-300 hover:border-teal-500/50 hover:text-teal-200 hover:bg-zinc-900/60'
                        }`}
                      >
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-black' : 'text-teal-400'}`} />
                        <span>{city}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isSelected ? 'bg-black/25 text-black font-black' : 'bg-zinc-900 text-zinc-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === 'directory' ? (
          <>
            {/* Manual Venue Addition Suggestion Banner */}
            <div className="bg-gradient-to-r from-zinc-950 via-purple-950/25 to-zinc-950 border border-purple-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-mono font-bold text-zinc-200">
                    Looking for a DIY space, house venue, or studio not listed in this region?
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Enter known booking contacts, load-in intel, and stage specs manually to build the Black Book.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVenueOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white rounded-lg text-xs font-mono font-bold uppercase transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Venue Manually</span>
              </button>
            </div>

            {filteredVenues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 p-6 space-y-3">
                <MapPin className="w-10 h-10 text-zinc-700 mb-1" />
                <p className="text-zinc-300 font-mono text-sm uppercase tracking-wider font-bold">No places found</p>
                <p className="text-zinc-500 font-mono text-xs max-w-md">
                  {searchTerm 
                    ? `No places matching "${searchTerm}". If you're looking for a DIY room, underground spot, or studio in a seeded location, enter any known details manually.`
                    : "No places found in this category. You can seed additional tour hubs or manually enter known venue details."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddVenueOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white rounded-lg text-xs font-mono font-bold uppercase shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Enter Venue Details Manually</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSeederModalOpen(true)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Seed More Hubs</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredVenues.map((venue, idx) => {
                return (
                  <VenueReputationCard
                    key={`bb-venue-${venue.id || 'v'}-${idx}`}
                    venue={venue}
                    userReviews={userReviews}
                    savedVenueIds={savedVenueIds}
                    bookmarkMutating={bookmarkMutating}
                    toggleSavedVenue={toggleSavedVenue}
                    handleOpenSuggestion={handleOpenSuggestion}
                    handleGeneratePitch={handleGeneratePitch}
                    setIntelVenueId={setIntelVenueId}
                    activeIntelIndex={activeIntelIndex}
                    setActiveIntelIndex={setActiveIntelIndex}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEndHandler={onTouchEndHandler}
                    triggerNotification={triggerNotification}
                    onBuyerClick={setSelectedPromoter}
                    onEditVenue={handleOpenEditVenue}
                    onDeleteVenue={handleOpenDeleteVenue}
                    defaultExpanded={false}
                    isExpandedOverride={globalExpandState}
                  />
                );
              })
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#0b0c10] border border-[#00ffcc]/50 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,255,204,0.15)] animate-[pulse_3s_ease-in-out_infinite] relative overflow-hidden group">
              {/* Radar Sweep Effect */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-b from-transparent via-[#00ffcc]/5 to-[#00ffcc]/10 opacity-0 group-hover:opacity-30 transition-opacity duration-1000" />

              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4 text-left">
                <Radio className="w-5 h-5 text-[#00ffcc] animate-pulse" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  Broadcast Open Dates
                </h3>
              </div>
              
              <div className="mb-4 p-2 bg-black/40 border border-[#00ffcc]/20 rounded font-mono text-[9px] text-zinc-500 text-left">
                <div className="text-[#00ffcc]/80"> {'>'} INITIALIZING BROADCAST...</div>
                <div className="text-[#00ffcc]/80"> {'>'} READY FOR TRANSMISSION</div>
              </div>
              
              <div className="space-y-4 mb-5 text-left font-mono">
                <div>
                  <label className="block text-[10px] uppercase text-[#00ffcc] mb-1.5 tracking-wider">Target Location</label>
                  <input
                    type="text"
                    value={beaconForm.targetRegion}
                    onChange={e => setBeaconForm(p => ({ ...p, targetRegion: e.target.value }))}
                    placeholder="City, State/Province, or Country"
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-xs focus:outline-none focus:border-[#00ffcc]/50 text-white placeholder:text-zinc-700"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase text-[#00ffcc] mb-1.5 tracking-wider">Search Radius</label>
                  <div className="flex items-center gap-2">
                    {['25 MI', '50 MI', '100 MI', '250 MI'].map((radius, idx) => (
                      <button
                        key={`${radius}-${idx}`}
                        type="button"
                        onClick={() => setBeaconForm(p => ({ ...p, radius }))}
                        className={`flex-1 py-2 rounded text-[10px] font-bold tracking-widest uppercase transition-colors border ${
                          beaconForm.radius === radius
                            ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-orange-500/50 hover:text-orange-300'
                        }`}
                      >
                        {radius}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#00ffcc] mb-1.5 tracking-wider">Window Start</label>
                    <input
                      type="date"
                      value={beaconForm.startDate}
                      onChange={e => setBeaconForm(p => ({ ...p, startDate: e.target.value }))}
                      className="w-full bg-black border border-zinc-800 rounded p-2 text-xs focus:outline-none focus:border-[#00ffcc]/50 text-zinc-300 min-h-[34px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#00ffcc] mb-1.5 tracking-wider">Window End</label>
                    <input
                      type="date"
                      value={beaconForm.endDate}
                      onChange={e => setBeaconForm(p => ({ ...p, endDate: e.target.value }))}
                      className="w-full bg-black border border-zinc-800 rounded p-2 text-xs focus:outline-none focus:border-[#00ffcc]/50 text-zinc-300 min-h-[34px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#00ffcc] mb-1.5 tracking-wider">Direct Contact</label>
                  <input
                    type="email"
                    value={beaconForm.contactLocal}
                    onChange={e => setBeaconForm(p => ({ ...p, contactLocal: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-xs focus:outline-none focus:border-[#00ffcc]/50 text-white placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <button
                onClick={handleBroadcastBeacon}
                className="w-full bg-black border border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc]/10 hover:shadow-[0_0_15px_rgba(0,255,204,0.3)] py-3 rounded-lg font-bold tracking-widest uppercase text-xs transition-all font-mono cursor-pointer shadow-[0_0_10px_rgba(0,255,204,0.1)] mb-4"
              >
                Send Beacon 📡
              </button>

              {beacons.length > 0 && (
                <div className="border-t border-zinc-800/80 pt-3 mt-2 flex items-center gap-3 w-full overflow-hidden select-none">
                  <div className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase shrink-0 flex items-center gap-1">
                    <span>BEACONS</span>
                    <span className="text-[#00ffcc] animate-pulse">●</span>
                  </div>
                  <div className="flex-1 flex overflow-x-auto space-x-2 py-2 scrollbar-none hide-scrollbar">
                    {beacons.map((beacon, i) => (
                      <div 
                        key={`bb-beacon-${beacon.id || beacon.target_region || ''}-${i}`} 
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Radio className="w-3 h-3 text-[#00ffcc] animate-pulse shrink-0" />
                        <span className="font-bold text-white uppercase">{beacon.target_region}</span>
                        <span className="text-[9px] text-zinc-500 font-mono font-medium">({beacon.start_date} - {beacon.end_date})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#0b0c10] border border-amber-500/30 rounded-2xl p-5 shadow-lg">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-4 text-left">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-500" />
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Promoter Offers
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                  {['all', 'pending', 'accepted', 'renegotiating'].map((filter, idx) => (
                    <button
                      key={`bb-filter-${filter}-${idx}`}
                      onClick={() => setOfferFilter(filter as any)}
                      className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${
                        offerFilter === filter 
                          ? 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-amber-500/50 hover:text-amber-400'
                      }`}
                    >
                      {filter === 'accepted' ? 'Confirmed' : filter === 'renegotiating' ? 'Countered' : filter}
                    </button>
                  ))}
                </div>
              </div>
              
              {offers.filter(o => offerFilter === 'all' || o.status === offerFilter).length === 0 ? (
                <p className="text-xs text-zinc-500 font-mono text-center py-6">
                  {offers.length === 0 ? "No pending offers from promoters. Broadast your availability via routing beacons." : "No offers match the current filter."}
                </p>
              ) : (
                <div className="space-y-3">
                  {offers.filter(o => offerFilter === 'all' || o.status === offerFilter).map((offer, idx) => {
                    let badgeText = '';
                    let badgeStyle = '';
                    let borderStyle = '';

                    const needsAction = offer.last_action_by === 'promoter';
                    const isExpanded = expandedOffers[offer.id] ?? false;
                    const toggleExpand = () => setExpandedOffers(prev => ({ ...prev, [offer.id]: !(expandedOffers[offer.id] ?? false) }));
                    const isConfirmed = offer.status === 'accepted';

                    let cardContainerStyle = 'border border-zinc-800 bg-zinc-950/70 shadow-none';
                    if (offer.status === 'pending') {
                      badgeText = '[ PENDING ]';
                      badgeStyle = 'text-[#00ffff]/80';
                      cardContainerStyle = 'border border-[#00ffff]/20 bg-zinc-950/40 shadow-[0_0_10px_rgba(0,255,255,0.02)]';
                    } else if (offer.status === 'accepted') {
                      badgeText = '[ CONFIRMED ]';
                      badgeStyle = 'text-[#00ff66] font-bold';
                      cardContainerStyle = 'border border-emerald-500/30 bg-emerald-950/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]';
                    } else if (offer.status === 'declined') {
                      badgeText = '[ REJECTED ]';
                      badgeStyle = 'text-[#ff3838]';
                      cardContainerStyle = 'border border-zinc-900 bg-zinc-950/40 opacity-50';
                    } else {
                      badgeText = '[ COUNTERED ]';
                      badgeStyle = 'text-amber-500';
                      cardContainerStyle = 'border border-amber-500/30 bg-amber-950/5';
                    }

                    return (
                      <div 
                        key={`bb-offer-${offer.id || 'off'}-${idx}`} 
                        className={`font-mono rounded-lg transition-all text-xs overflow-hidden ${cardContainerStyle}`}
                      >
                        <div 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 cursor-pointer select-none"
                          onClick={toggleExpand}
                        >
                          {/* Date & Venue Info */}
                          <div className="flex items-center gap-3 text-left">
                            <div className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 shrink-0 select-none">
                              {offer.date || 'TBD'}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-zinc-200 select-all truncate uppercase">
                                {offer.venue_name}
                              </div>
                              <div className="text-xs font-mono text-zinc-400 mt-1">
                                Split: 80/20 | Tax: 8.25% | Fees: $0.00
                              </div>
                              <div className="text-[9px] text-zinc-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="text-zinc-600 font-bold uppercase">PROMOTER:</span>
                                <span className="text-zinc-400 font-sans font-medium">{offer.promoter_name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Guarantee Amount, Badge & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-5 border-t border-zinc-900/40 sm:border-0 pt-2 sm:pt-0 shrink-0">
                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-[8px] text-zinc-600 block leading-none font-bold uppercase tracking-widest mb-0.5">GUARANTEE</span>
                              <span className="text-white text-xs font-black">${(offer.guarantee_amount || 0).toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-[10px] ${badgeStyle} tracking-wider font-extrabold select-none shrink-0`}>
                                {badgeText}
                              </span>
                              <div className="w-5 h-5 flex items-center justify-center rounded-full border border-zinc-700 bg-black/40 shrink-0">
                                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Accordion Expansion Panel */}
                        {isExpanded && (
                          <div className="border-t border-zinc-900 bg-zinc-950/90 p-4 text-left">
                            {/* Inline Additional Details */}
                            <div className="text-white font-semibold font-display text-xs mb-2">
                              {offer.city}, {offer.state_province || 'USA'}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className={`text-[8.5px] px-1.5 py-0.5 rounded-md font-mono font-black tracking-wider uppercase border inline-flex items-center gap-1 leading-none ${
                                offer.show_type === 'festival' 
                                  ? 'bg-[#00ffcc]/10 border-[#00ffcc]/30 text-[#00ffcc]' 
                                  : 'bg-purple-950/40 border-purple-800 text-purple-350'
                              }`}>
                                {offer.show_type === 'festival' ? '🎪 Festival format' : '🎸 Standard Show'}
                              </span>
                            </div>
                            {offer.notes && (
                              <p className="text-[10px] bg-black/40 p-2 rounded border border-purple-950 text-zinc-400 leading-normal italic font-mono mt-1.5 mb-3 break-words">
                                "{offer.notes}"
                              </p>
                            )}
                            {offer.status === 'renegotiating' && (
                              <div className="bg-amber-950/20 border border-amber-900/30 p-2 rounded text-[10px] text-amber-300 mt-2 mb-3">
                                <span className="font-extrabold uppercase text-[9px] block mb-0.5">Renegotiation Info:</span>
                                "{offer.renegotiation_notes || 'Counter-proposal under review.'}"
                              </div>
                            )}

                            {/* Actions Group (Pre-confirmation vs Post-confirmation) */}
                            {!isConfirmed && offer.status !== 'declined' && (
                              <div className="flex items-center gap-2 mb-4">
                                {needsAction ? (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onUpdateOffer && onUpdateOffer({ ...offer, status: 'accepted' }) }}
                                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded py-2 flex items-center justify-center cursor-pointer transition-colors font-bold uppercase text-[9px] md:text-xs"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Accept & Book
                                    </button>
                                    <button
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setLocalRenegotiateId(offer.id);
                                        setCounterGuarantee(offer.guarantee_amount.toString());
                                        setCounterNotes('');
                                      }}
                                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded py-2 flex items-center justify-center cursor-pointer transition-colors font-bold uppercase text-[9px] md:text-xs"
                                    >
                                      Re-negotiate
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onUpdateOffer && onUpdateOffer({ ...offer, status: 'declined' }) }}
                                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded py-2 flex items-center justify-center cursor-pointer transition-colors font-bold uppercase text-[9px] md:text-xs"
                                    >
                                      <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[9.5px] font-mono text-purple-400/80 italic w-full text-center py-2 block">
                                    Counter-Proposal Dispatched • Awaiting Promoter Review.
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Regenerate Panel */}
                            {localRenegotiateId === offer.id && (
                              <div className="space-y-4 bg-black/50 p-4 rounded-xl border border-amber-500/30 shadow-inner mt-4 mb-4" onClick={e => e.stopPropagation()}>
                                <div>
                                  <p className="font-bold text-[10px] text-amber-400 uppercase tracking-wider block mb-2">Guarantee Counter Fee ($)</p>
                                  <input
                                    id={`counter-fee-${offer.id}`}
                                    type="number"
                                    placeholder="Counter Fee ($)"
                                    value={counterGuarantee}
                                    onChange={(e) => setCounterGuarantee(e.target.value)}
                                    className="w-full bg-zinc-900 border border-amber-500/30 rounded p-2 text-xs text-white max-w-[150px] font-bold"
                                  />
                                </div>
                                <div>
                                  <p className="font-bold text-[10px] text-amber-400 uppercase tracking-wider block mb-2">Explanation / Terms Notes</p>
                                  <input
                                    id={`counter-desc-${offer.id}`}
                                    type="text"
                                    placeholder="Explanation / Terms notes..."
                                    value={counterNotes}
                                    onChange={(e) => setCounterNotes(e.target.value)}
                                    className="w-full bg-zinc-900 border border-amber-500/30 rounded p-2 text-xs text-zinc-300"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end mt-4">
                                  <button
                                    onClick={() => {
                                      if (!counterGuarantee || parseFloat(counterGuarantee) <= 0) return;
                                      onUpdateOffer && onUpdateOffer({ 
                                        ...offer,
                                        status: 'renegotiating',
                                        guarantee_amount: parseFloat(counterGuarantee),
                                        renegotiation_notes: counterNotes,
                                        last_action_by: 'band'
                                      });
                                      setLocalRenegotiateId(null);
                                      setCounterGuarantee('');
                                      setCounterNotes('');
                                      triggerNotification?.(`Counter proposal dispatched back!`);
                                    }}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-white font-black text-[10px] uppercase transition-colors"
                                  >
                                    Submit Counter
                                  </button>
                                  <button
                                    onClick={() => {
                                      setLocalRenegotiateId(null);
                                      setCounterGuarantee('');
                                      setCounterNotes('');
                                    }}
                                    className="px-4 py-2 bg-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] uppercase transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {isConfirmed && (
                              <div className="mb-4 space-y-2 border border-zinc-800 bg-black/40 rounded-lg p-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); triggerNotification("Advance request ping sent to Promoter."); }}
                                  className="w-full bg-emerald-950 border border-emerald-500/50 hover:bg-emerald-900/80 text-emerald-400 py-2.5 rounded flex items-center justify-center font-black tracking-widest uppercase text-[10px] transition-colors cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                                >
                                  [ ⚡ ASK FOR SHOW DETAILS ADVANCE ]
                                </button>
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setReRequestPanel(p => ({ ...p, [offer.id]: !p[offer.id] }));
                                  }}
                                  className="w-full bg-transparent border border-zinc-800 hover:bg-zinc-900 text-zinc-400 py-2 rounded flex items-center justify-center font-bold tracking-widest uppercase text-[9px] transition-colors cursor-pointer mt-2.5"
                                >
                                  [ ↻ RE-REQUEST SHOW/VENUE ADVANCE ]
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to request cancellation for this booked show? The promoter will have to sign off.")) {
                                      onUpdateOffer && onUpdateOffer({ ...offer, status: 'declined' });
                                    }
                                  }}
                                  className="w-full bg-red-950 border border-red-500/40 hover:bg-red-900/60 text-red-400 py-2 rounded flex items-center justify-center font-black tracking-widest uppercase text-[10px] transition-colors cursor-pointer mt-2.5"
                                >
                                  [ CANCEL CONFIRMED SHOW ]
                                </button>
                                
                                {reRequestPanel[offer.id] && (
                                  <div className="mt-2.5 pt-2.5 border-t border-zinc-800/60">
                                    <div className="text-[9px] uppercase text-zinc-600 font-bold mb-2 tracking-widest">Flag Missing Info:</div>
                                    <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                                      {['Missing Wi-Fi details', 'Missing Parking/Power specs', 'Curfew/Load-out times', 'Green room access code'].map((flag, idx) => (
                                        <label key={`${flag}-${idx}`} className="flex items-center gap-2 cursor-pointer group" onClick={e => e.stopPropagation()}>
                                          <input type="checkbox" className="accent-amber-500 bg-zinc-900 border-zinc-700" />
                                          <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase select-none">{flag}</span>
                                        </label>
                                      ))}
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); triggerNotification("Updated requested details sent."); setReRequestPanel(p => ({ ...p, [offer.id]: false })); }}
                                      className="w-full mt-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 py-2 rounded border border-amber-500/30 uppercase text-[9px] font-bold cursor-pointer transition-colors"
                                    >
                                      Submit Targeted Request
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* View Venue Link */}
                            <div className="mb-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchTerm(offer.venue_name);
                                  setActiveTab('directory');
                                }}
                                className="text-[#a855f7] hover:text-[#c084fc] font-bold text-[10px] tracking-widest cursor-pointer uppercase underline underline-offset-4 decoration-[#a855f7]/40 hover:decoration-[#c084fc]"
                              >
                                [ VIEW VENUE PROFILE ↗ ]
                              </button>
                            </div>

                            {/* Counter History Log */}
                            {(offer.status === 'renegotiating' || offer.status === 'accepted' || offer.status === 'declined') && (
                              <div className="mt-3 text-[9px] text-amber-500/70 border border-amber-500/20 bg-amber-950/20 p-2.5 rounded">
                                // HISTORY: Original Offer: ${(offer.guarantee_amount && offer.guarantee_amount * 0.85).toFixed(0)} | Countered Target: ${offer.guarantee_amount} | {offer.status === 'renegotiating' ? 'Awaiting Response.' : 'Resolved.'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pitch Modal with suggestions editor */}
      <AnimatePresence>
        {isModalOpen && selectedVenue && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-[#13161a] border border-zinc-800 rounded-xl z-50 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col max-w-2xl mx-auto"
            >
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0a0a0c]">
                <h3 className="font-display font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#a855f7]" /> Route Pitch Composer
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-4 bg-[#0d0f12] flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-[10px] uppercase font-mono text-zinc-550 mb-1.5 tracking-wider text-left">Custom pitch payload</label>
                  <textarea
                    value={pitchText}
                    onChange={(e) => setPitchText(e.target.value)}
                    className="w-full flex-grow bg-black border border-zinc-800 rounded-lg p-3 text-xs sm:text-sm font-mono text-zinc-300 focus:outline-none focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/20 resize-y min-h-[160px] leading-relaxed"
                    placeholder="Structure custom touring query details..."
                  />
                </div>
                
                {/* Custom suggestions container */}
                <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 border-l-2 border-l-purple-500 text-left">
                  <p className="text-[10px] uppercase font-mono text-purple-400 font-bold mb-2 tracking-widest flex items-center gap-1">
                    <span>● Intel Suggestions Checklist:</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "+ Add Draw Details", text: "\n\n- Expected Regional Draw: 150-250 heads based on recent ticket sales in nearby metros." },
                      { label: "+ Ask Ticket Splits", text: "\n\n- Room Economics: Inquire about average 80/20 splits or standard local guarantees." },
                      { label: "+ Introduce Opener Bands", text: "\n\n- Show Lineup: We are communicating with local support act [Enter Opener] to complete the night." },
                      { label: "+ Link Audio Session", text: "\n\n- Live Performance Reference: Check our live recording reel here: [ENTER_LINK]" },
                      { label: "+ technical brief", text: "\n\n- Production Specs: We travel with our own front-of-house tech engineer and carry minimal input racks." }
                    ].map((sug, i) => (
                      <button
                        key={`bb-pitch-sug-${i}-${sug.label}`}
                        type="button"
                        onClick={() => setPitchText(prev => prev + sug.text)}
                        className="px-2.5 py-1.5 bg-purple-950/25 hover:bg-[#a855f7] hover:text-black border border-purple-800/40 hover:border-[#a855f7] text-[9.5px] uppercase font-bold text-purple-300 rounded transition-all cursor-pointer font-mono"
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-[#0a0a0c] flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 py-3 rounded-lg font-bold tracking-wider uppercase text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyPitch}
                  className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-lg font-bold tracking-wider uppercase text-xs transition-colors cursor-pointer shadow-lg"
                >
                  Copy pitch & close
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* Add Place Modal */}
        {isAddVenueOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddVenueOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-4 right-4 top-[8%] bg-[#13161a] border border-zinc-800 rounded-xl z-50 overflow-hidden shadow-2xl max-h-[88vh] flex flex-col max-w-lg mx-auto"
            >
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0a0a0c]">
                <h3 className="font-display font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#00ffcc]" /> Add New Place to Black Book
                </h3>
                <button onClick={() => setIsAddVenueOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4 bg-[#0d0f12] text-left">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Place / Facility Name</label>
                  <input type="text" value={newVenueForm.name} onChange={e => setNewVenueForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white" placeholder="e.g., The Empty Bottle or Sunset Sound" />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Category / Place Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'venue', label: '🎸 Live Venue / Stage' },
                      { id: 'studio', label: '🎙️ Recording Studio' },
                      { id: 'rehearsal', label: '🥁 Rehearsal Space' },
                      { id: 'other', label: '🏛️ Landmark / Other' }
                    ].map(typeOpt => (
                      <button
                        key={`new-pt-${typeOpt.id}`}
                        type="button"
                        onClick={() => setNewVenueForm(p => ({ ...p, place_type: typeOpt.id }))}
                        className={`py-2 px-2.5 rounded border text-xs font-mono font-bold text-left transition-all ${
                          newVenueForm.place_type === typeOpt.id
                            ? 'bg-teal-950/60 border-teal-400 text-teal-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {typeOpt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* State, Province & Country Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">City <span className="text-teal-400">*</span></label>
                    <input type="text" value={newVenueForm.city} onChange={e => setNewVenueForm(p => ({ ...p, city: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white" placeholder="Chicago" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">State/Province</label>
                    <input type="text" value={newVenueForm.state} onChange={e => setNewVenueForm(p => ({ ...p, state: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white" placeholder="IL" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Country</label>
                    <input type="text" value={newVenueForm.country} onChange={e => setNewVenueForm(p => ({ ...p, country: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white" placeholder="USA" />
                  </div>
                </div>

                {/* Street Address Input */}
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Street Address</label>
                  <input 
                    type="text" 
                    value={newVenueForm.address} 
                    onChange={e => setNewVenueForm(p => ({ ...p, address: e.target.value }))} 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white font-mono" 
                    placeholder="e.g., 2208 Elliston Pl or 1035 N Western Ave" 
                  />
                </div>

                {/* Website Input (Optional) */}
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Website URL <span className="text-zinc-500 lowercase">(optional)</span></label>
                  <input 
                    type="url" 
                    value={newVenueForm.website} 
                    onChange={e => setNewVenueForm(p => ({ ...p, website: e.target.value }))} 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white font-mono" 
                    placeholder="https://venue.com" 
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] uppercase font-mono text-zinc-400">Max Room Capacity</label>
                    <span className="text-[10px] font-mono text-zinc-500">Set 0 for studios / rehearsals</span>
                  </div>
                  <input type="number" value={newVenueForm.capacity} onChange={e => setNewVenueForm(p => ({ ...p, capacity: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white font-mono" placeholder={newVenueForm.place_type === 'venue' ? '350' : '0'} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Contact Email <span className="text-zinc-500 lowercase">(optional)</span></label>
                  <input type="email" value={newVenueForm.email} onChange={e => setNewVenueForm(p => ({ ...p, email: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white" placeholder="booking@venue.com" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Contact / Talent Buyer Name <span className="text-zinc-500 lowercase">(optional)</span></label>
                  <input type="text" value={newVenueForm.buyers} onChange={e => setNewVenueForm(p => ({ ...p, buyers: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white" placeholder="Booking Coordinator / Studio Manager" />
                </div>
              </div>
              <div className="p-4 border-t border-zinc-800 bg-[#0a0a0c]">
                <button onClick={handleAddVenue} className="w-full bg-[#00ffcc] text-black hover:bg-[#00e6b8] py-3 rounded-lg font-bold tracking-wider uppercase text-xs font-mono transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.3)]">Save Place to Directory</button>
              </div>
            </motion.div>
          </>
        )}

        {/* Add Intel Modal */}
        {intelVenueId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIntelVenueId(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-4 right-4 top-[15%] bg-[#13161a] border border-zinc-800 rounded-xl z-50 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col max-w-lg mx-auto"
            >
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0a0a0c]">
                <h3 className="font-display font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" /> Contribute Intel
                </h3>
                <button onClick={() => setIntelVenueId(null)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4 bg-[#0d0f12] text-left">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-mono text-amber-500 mb-1.5">Payout Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((val, idx) => (
                        <button
                          key={`payout-${val}-${idx}`}
                          type="button"
                          onClick={() => setNewIntelForm(p => ({ ...p, payout: val }))}
                          className={`flex-1 h-8 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            newIntelForm.payout >= val
                              ? 'bg-orange-500 text-black border-orange-500'
                              : 'bg-zinc-900 text-zinc-600 border-zinc-800 hover:border-amber-500/50'
                          }`}
                        >
                          <span className="font-mono font-bold text-xs">{val}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-mono text-amber-500 mb-1.5">Load-in Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((val, idx) => (
                        <button
                          key={`loadin-${val}-${idx}`}
                          type="button"
                          onClick={() => setNewIntelForm(p => ({ ...p, loadIn: val }))}
                          className={`flex-1 h-8 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            newIntelForm.loadIn >= val
                              ? 'bg-orange-500 text-black border-orange-500'
                              : 'bg-zinc-900 text-zinc-600 border-zinc-800 hover:border-amber-500/50'
                          }`}
                        >
                          <span className="font-mono font-bold text-xs">{val}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-amber-500 mb-1">Intel Notes (Staff, rules, tips)</label>
                  <textarea rows={4} value={newIntelForm.notes} onChange={e => setNewIntelForm(p => ({ ...p, notes: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-amber-500/50 text-white resize-none" placeholder="Sound guy was named Dave, super helpful..." />
                </div>
              </div>
              <div className="p-4 border-t border-zinc-800 bg-[#0a0a0c]">
                <button onClick={handleAddIntel} className="w-full bg-[#primary] bg-amber-500 text-black hover:bg-amber-400 py-3 rounded-lg font-bold tracking-wider uppercase text-sm transition-colors cursor-pointer">Submit Intel</button>
              </div>
            </motion.div>
          </>
        )}
        {/* Contact Suggestion Modal */}
        {suggestionModalVenue && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSuggestionModalVenue(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-4 right-4 top-[15%] bg-[#13161a] border border-zinc-800 rounded-xl z-50 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col max-w-lg mx-auto"
            >
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0a0a0c]">
                <h3 className="font-display font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#00ffcc]" /> Suggest Contact Data Correction
                </h3>
                <button onClick={() => setSuggestionModalVenue(null)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4 bg-[#0d0f12] text-left">
                <div className="text-[10px] text-zinc-400 font-mono bg-zinc-900 border border-zinc-800 p-3 rounded-lg leading-relaxed">
                  <span className="text-[#00ffcc] font-bold uppercase tracking-widest">// NETWORK PROTOCOL:</span> Submitted contact updates are routed through a verification queue to prevent dead links. Live sync occurs upon network confirmation.
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">New Talent Buyer Name</label>
                  <input type="text" value={suggestionForm.buyer_name} onChange={e => setSuggestionForm(p => ({ ...p, buyer_name: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">New Booking Email Address</label>
                  <input type="email" value={suggestionForm.booking_email} onChange={e => setSuggestionForm(p => ({ ...p, booking_email: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-[#00ffcc]/50 text-white" placeholder="booking@venue.com" />
                </div>
              </div>
              <div className="p-4 border-t border-zinc-800 bg-[#0a0a0c]">
                <button onClick={handleSubmitSuggestion} className="w-full bg-orange-500 text-black hover:bg-orange-400 py-3 rounded-lg font-bold tracking-wider uppercase text-sm transition-colors cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.3)]">Submit Correction</button>
              </div>
            </motion.div>
          </>
        )}

        {/* Interaction Drawer: Direct Promoter Pipeline */}
        {selectedPromoter && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPromoter(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-900 shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-950 text-left">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-full bg-purple-900/60 text-purple-200 border-2 border-purple-500/30 flex items-center justify-center font-bold font-display tracking-wider text-sm select-none shadow-[0_0_15px_rgba(168,85,247,0.25)] relative">
                    {selectedPromoter.avatar}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white tracking-wide uppercase select-all flex items-center space-x-1.5">
                      <span>{selectedPromoter.name}</span>
                    </h4>
                    <p className="text-[10px] text-purple-400 font-mono tracking-widest uppercase mt-0.5 select-text">
                      Promoter @ {selectedPromoter.venue}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPromoter(null)}
                  className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contextual Attachment Block */}
              <div className="p-4 bg-zinc-900/20 border-b border-zinc-900/60 text-left">
                <div className="bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-xl p-3 shadow-inner">
                  <span className="text-[9px] font-mono font-black text-purple-400 uppercase tracking-widest block mb-1">
                    ⚡ CURRENT ACTIVE UNBOOKED ROUTING GAPS:
                  </span>
                  <div className="space-y-1.5 mt-2">
                    {routingGaps.map((gap, gIdx) => (
                      <div key={`bb-genre-${gIdx}`} className="inline-flex bg-purple-950/40 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold leading-normal w-full items-center space-x-1.5 shadow-[0_0_10px_rgba(168,85,247,0.05)] select-all">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                        <span className="truncate">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secure Chat Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-950/40 flex flex-col text-left">
                <div className="text-[10px] text-zinc-500 font-mono text-center select-none uppercase tracking-widest border-b border-zinc-900/60 pb-2.5">
                  🔐 END-TO-END NATIVE MESSAGE ROUTER
                </div>

                <div className="flex-1 space-y-4">
                  {(!chatMessages[selectedPromoter.name] || chatMessages[selectedPromoter.name].length === 0) ? (
                    <div className="text-center text-zinc-600 font-mono text-xs py-16 select-none max-w-xs mx-auto">
                      No transmission history recorded. Initiate immediate pipeline message below to bypass email lag.
                    </div>
                  ) : (
                    chatMessages[selectedPromoter.name].map((msg, mIdx) => (
                      <div
                        key={`bb-chat-msg-${mIdx}`}
                        className={`flex flex-col max-w-[85%] ${
                          msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed font-sans shadow-md ${
                            msg.sender === 'user'
                              ? 'bg-purple-650 text-white rounded-tr-none font-medium'
                              : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-zinc-600 font-mono mt-1 select-none">
                          {msg.time} {msg.sender === 'user' && '│ Transmitted'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Input Matrix */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex flex-col gap-2.5 text-left">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={e => setTypedMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    placeholder={`Direct message to ${selectedPromoter.name}...`}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded focus:border-purple-500 text-sm p-3 text-zinc-100 outline-none placeholder:text-zinc-600 transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="h-11 w-11 bg-purple-600 hover:bg-purple-500 text-white rounded flex items-center justify-center transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.3)] shrink-0 active:scale-95"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[9px] text-zinc-600 font-mono select-none uppercase text-center tracking-widest">
                  Secure Direct Promoter Link Established
                </div>
              </div>
            </motion.div>
          </>
        )}
        {/* MusicBrainz Tour Hub Seeder Modal */}
        {isSeederModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSeedingActive) setIsSeederModalOpen(false);
              }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-4 right-4 top-[10%] bottom-[10%] bg-[#0f1217] border border-teal-500/40 rounded-2xl z-50 overflow-hidden shadow-[0_0_50px_rgba(20,184,166,0.25)] flex flex-col max-w-2xl mx-auto"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-teal-500/20 flex items-center justify-between bg-[#080a0d]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-950/80 border border-teal-500/50 flex items-center justify-center shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base tracking-wide flex items-center gap-2">
                      MusicBrainz Tour Hub Seeder
                    </h3>
                    <p className="text-[11px] text-teal-400/70 font-mono">
                      Query open place databases & geocode tour routing coordinates
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSeederModalOpen(false)} 
                  disabled={isSeedingActive}
                  className="text-zinc-500 hover:text-white cursor-pointer disabled:opacity-30 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-5 bg-[#0b0e12] flex-1 text-left">
                {/* Info Protocol Note */}
                <div className="text-xs text-zinc-300 font-mono bg-teal-950/20 border border-teal-500/30 p-3.5 rounded-xl leading-relaxed">
                  <span className="text-teal-400 font-bold uppercase tracking-wider block mb-1">
                    ⚡ // APP-WIDE VENUE SEEDING PROTOCOL:
                  </span>
                  Harvests verified music venues and recording/rehearsal spaces for selected hubs and persists them directly into the Supabase <code className="text-teal-300">venues</code> table for all users app-wide. Automatically filters out irrelevant noise such as <strong>churches</strong>, <strong>arenas</strong>, and <strong>convention centers</strong>.
                </div>

                {/* Hub Selection Matrix */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase font-mono font-bold text-teal-300 tracking-wider">
                      Target Tour Hubs ({selectedHubs.length} Selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedHubs([])}
                        className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                      >
                        Clear All
                      </button>
                      {availablePresets.length > 0 && (
                        <>
                          <span className="text-zinc-600">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedHubs([...new Set([...availablePresets.map(h => h.city), ...availableCustomHubs])])}
                            className="text-[10px] font-mono text-teal-400 hover:text-teal-300 underline cursor-pointer"
                          >
                            Select Available
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Selected Hubs Visual Summary Bar */}
                  {selectedHubs.length > 0 ? (
                    <div className="mb-3 p-2.5 bg-teal-950/40 border border-teal-500/40 rounded-xl flex flex-wrap items-center gap-1.5 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                      <span className="text-[10px] font-mono font-bold text-teal-300 uppercase tracking-wider mr-1">
                        Active Queue:
                      </span>
                      {selectedHubs.map(hubCity => (
                        <span
                          key={`selected-pill-${hubCity}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-900/80 border border-teal-400 text-teal-100 text-[11px] font-mono font-bold shadow-sm"
                        >
                          <Check className="w-3 h-3 text-teal-300" />
                          {hubCity}
                          <button
                            type="button"
                            onClick={() => toggleHubSelection(hubCity)}
                            disabled={isSeedingActive}
                            className="hover:text-red-400 ml-0.5 cursor-pointer text-teal-300/70"
                            title={`Deselect ${hubCity}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-2.5 p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-400">
                      ℹ️ <span className="text-zinc-300">No hubs selected.</span> Choose from available unseeded regions below or add a custom metro.
                    </div>
                  )}

                  {/* Available Unseeded Presets */}
                  {availablePresets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availablePresets.map(hub => {
                        const isSelected = selectedHubs.includes(hub.city);
                        return (
                          <button
                            key={`hub-${hub.city}`}
                            type="button"
                            onClick={() => toggleHubSelection(hub.city)}
                            disabled={isSeedingActive}
                            className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-950/70 border-teal-400 text-teal-100 shadow-[0_0_12px_rgba(45,212,191,0.25)] ring-1 ring-teal-400/50'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                          >
                            <span className="truncate">{hub.label}</span>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-teal-300 shrink-0 ml-1" />
                            ) : (
                              <Square className="w-3 h-3 text-zinc-600 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400">
                      All default preset tour hubs have been seeded! Add any custom metro or international region below.
                    </div>
                  )}
                </div>

                {/* Custom User-Added Metros / Regions */}
                {availableCustomHubs.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-mono font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Custom Added Regions ({availableCustomHubs.length})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableCustomHubs.map(hubCity => {
                        const isSelected = selectedHubs.includes(hubCity);
                        return (
                          <div
                            key={`custom-hub-card-${hubCity}`}
                            className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50'
                                : 'bg-zinc-900/70 border-zinc-750 text-zinc-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleHubSelection(hubCity)}
                              disabled={isSeedingActive}
                              className="flex items-center gap-1.5 truncate flex-1 text-left cursor-pointer"
                            >
                              <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                              <span className="truncate">{hubCity}</span>
                            </button>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomHub(hubCity)}
                                disabled={isSeedingActive}
                                className="text-zinc-500 hover:text-red-400 p-0.5 cursor-pointer transition-colors"
                                title={`Remove custom hub '${hubCity}'`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Metro Input */}
                <div>
                  <label className="block text-[11px] uppercase font-mono font-bold text-zinc-300 mb-1.5 tracking-wider flex items-center justify-between">
                    <span>Add Custom Metro / Region</span>
                    <span className="text-[10px] text-teal-400 font-normal normal-case">Automatically selected upon adding</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCityInput}
                      onChange={e => setCustomCityInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddCustomHub(); }}
                      disabled={isSeedingActive}
                      placeholder="e.g. Portland, Minneapolis, Montreal, Leeds..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomHub}
                      disabled={isSeedingActive || !customCityInput.trim()}
                      className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 text-black font-mono font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(20,184,166,0.3)] cursor-pointer"
                    >
                      + Add & Select
                    </button>
                  </div>
                </div>

                {/* Manual Venue Suggestion Notice */}
                <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-mono font-bold text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Looking for a specific DIY space or basement venue?
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400">
                      Public seeders only pull registered venues. If a spot is unlisted in a seeded location, enter any known details manually.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSeederModalOpen(false);
                      setIsAddVenueOpen(true);
                    }}
                    className="px-3 py-1.5 bg-purple-600/90 hover:bg-purple-500 text-white rounded-lg text-[11px] font-mono font-bold uppercase transition-all shadow-sm shrink-0 cursor-pointer"
                  >
                    + Enter Manually
                  </button>
                </div>

                {/* Already Seeded Protected Hubs */}
                {seededHubs.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Already Seeded & Protected ({seededHubs.length})
                      </label>
                      <span className="text-[9.5px] font-mono text-zinc-600">
                        Locked to preserve curated entries & prevent noise
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {seededHubs.map(hubCity => (
                        <span
                          key={`seeded-hub-${hubCity}`}
                          className="px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[10px] font-mono flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
                          {hubCity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Seeding Terminal Logs */}
                {seedingLogs.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] uppercase font-mono text-teal-400/80 font-bold tracking-wider">
                        Live Execution Logs & Telemetry
                      </label>
                      {isSeedingActive && (
                        <span className="text-[10px] font-mono text-teal-400 animate-pulse flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Ingesting...
                        </span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-900 rounded-full h-1.5 mb-2 overflow-hidden border border-zinc-800">
                      <div 
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${seedingProgress}%` }}
                      />
                    </div>

                    <div className="bg-black/90 border border-zinc-800 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-[11px] space-y-1 text-zinc-300 select-text">
                      {seedingLogs.map((log, lIdx) => (
                        <div key={`seed-log-${lIdx}`} className="leading-relaxed">
                          {log.includes('[SUCCESS]') || log.includes('⚡') ? (
                            <span className="text-emerald-400 font-bold">{log}</span>
                          ) : log.includes('[ERROR]') || log.includes('⚠️') ? (
                            <span className="text-red-400 font-bold">{log}</span>
                          ) : log.includes('[DATABASE]') || log.includes('[SERVER]') ? (
                            <span className="text-teal-400">{log}</span>
                          ) : (
                            <span className="text-zinc-400">{log}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 border-t border-teal-500/20 bg-[#080a0d] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsSeederModalOpen(false)}
                    disabled={isSeedingActive}
                    className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 rounded-xl text-xs font-mono font-bold uppercase transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handlePushAllHubsToSupabase}
                    disabled={isPushingToSupabase || isSeedingActive}
                    className="px-4 py-3 bg-gradient-to-r from-amber-950/80 via-purple-950/70 to-amber-950/80 border border-amber-400/60 text-amber-300 hover:border-amber-300 rounded-xl font-bold font-mono tracking-wider uppercase text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    title="Push all currently loaded & built-in hubs to Supabase 'venues' table"
                  >
                    <Database className={`w-4 h-4 text-amber-400 ${isPushingToSupabase ? 'animate-spin' : ''}`} />
                    <span>{isPushingToSupabase ? 'Pushing...' : 'Push Hubs to Supabase'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRunVenueSeeder}
                  disabled={isSeedingActive || selectedHubs.length === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 text-black rounded-xl font-bold font-mono tracking-wider uppercase text-xs transition-all cursor-pointer shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2"
                >
                  {isSeedingActive ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Seeding {selectedHubs.length} Hubs...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Start Pre-Seeding Tour Hubs</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* Edit Place / Venue Details Modal */}
        {isEditVenueOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditVenueOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-4 right-4 top-[6%] bg-[#13161a] border border-zinc-800 rounded-xl z-50 overflow-hidden shadow-2xl max-h-[88vh] flex flex-col max-w-xl mx-auto"
            >
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0a0a0c]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-purple-950/40 border border-purple-800/40 text-purple-400">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-sm">
                      Edit Place Record
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      Override & update custom details in your Black Book
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsEditVenueOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 bg-[#0d0f12] text-left flex-1">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Place Name</label>
                  <input
                    type="text"
                    value={editVenueForm.name}
                    onChange={e => setEditVenueForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-sm focus:outline-none focus:border-purple-500/50 text-white font-medium"
                    placeholder="Place name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Place Category / Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'venue', label: 'Live Stage', icon: Music, color: 'text-teal-400' },
                      { id: 'studio', label: 'Studio', icon: Mic2, color: 'text-purple-400' },
                      { id: 'rehearsal', label: 'Rehearsal', icon: Building2, color: 'text-sky-400' },
                      { id: 'other', label: 'Other', icon: Globe, color: 'text-zinc-400' }
                    ].map(typeOpt => {
                      const Icon = typeOpt.icon;
                      const isSel = editVenueForm.place_type === typeOpt.id;
                      return (
                        <button
                          key={`edit-pt-${typeOpt.id}`}
                          type="button"
                          onClick={() => setEditVenueForm(p => ({ ...p, place_type: typeOpt.id }))}
                          className={`py-2 px-2.5 rounded border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isSel
                              ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isSel ? typeOpt.color : 'text-zinc-500'}`} />
                          <span>{typeOpt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">City</label>
                    <input
                      type="text"
                      value={editVenueForm.city}
                      onChange={e => setEditVenueForm(p => ({ ...p, city: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-purple-500/50 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">State / Province</label>
                    <input
                      type="text"
                      value={editVenueForm.state}
                      onChange={e => setEditVenueForm(p => ({ ...p, state: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-purple-500/50 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Country</label>
                    <input
                      type="text"
                      value={editVenueForm.country}
                      onChange={e => setEditVenueForm(p => ({ ...p, country: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-purple-500/50 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Address / Street</label>
                  <input
                    type="text"
                    value={editVenueForm.address}
                    onChange={e => setEditVenueForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-purple-500/50 text-white font-mono"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Website URL <span className="text-zinc-500 lowercase">(optional)</span></label>
                  <input
                    type="url"
                    value={editVenueForm.website}
                    onChange={e => setEditVenueForm(p => ({ ...p, website: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-purple-500/50 text-white font-mono"
                    placeholder="https://venue.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] uppercase font-mono text-zinc-400">Capacity</label>
                      <span className="text-[10px] font-mono text-zinc-500">Heads</span>
                    </div>
                    <input
                      type="number"
                      value={editVenueForm.capacity}
                      onChange={e => setEditVenueForm(p => ({ ...p, capacity: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-purple-500/50 text-white font-mono"
                      placeholder="350"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Contact Email <span className="text-zinc-500 lowercase">(optional)</span></label>
                    <input
                      type="email"
                      value={editVenueForm.email}
                      onChange={e => setEditVenueForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-purple-500/50 text-white"
                      placeholder="booking@venue.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Talent Buyer / Manager Name <span className="text-zinc-500 lowercase">(optional)</span></label>
                  <input
                    type="text"
                    value={editVenueForm.buyers}
                    onChange={e => setEditVenueForm(p => ({ ...p, buyers: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-purple-500/50 text-white"
                    placeholder="Talent Coordinator"
                  />
                </div>

                {/* Rating Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-amber-500 mb-1">
                      Payout Rating: {editVenueForm.payoutRating} / 5
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={`ep-payout-${val}`}
                          type="button"
                          onClick={() => setEditVenueForm(p => ({ ...p, payoutRating: val }))}
                          className={`flex-1 h-7 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                            editVenueForm.payoutRating >= val
                              ? 'bg-amber-500 text-black font-black'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-amber-500 mb-1">
                      Load-in Rating: {editVenueForm.loadInRating} / 5
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={`ep-loadin-${val}`}
                          type="button"
                          onClick={() => setEditVenueForm(p => ({ ...p, loadInRating: val }))}
                          className={`flex-1 h-7 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                            editVenueForm.loadInRating >= val
                              ? 'bg-amber-500 text-black font-black'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Intel & Production Notes</label>
                  <textarea
                    rows={3}
                    value={editVenueForm.notes}
                    onChange={e => setEditVenueForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-xs text-white resize-none font-mono focus:outline-none focus:border-purple-500/50"
                    placeholder="Enter gear specs, load-in quirks, parking information..."
                  />
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-[#0a0a0c] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditVenueOpen(false)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs font-mono font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditVenue}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* Audit & Purge Defunct Listings Modal */}
        {isAuditModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuditModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-[#101216] border border-red-500/30 rounded-2xl z-50 overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.25)] max-w-2xl mx-auto max-h-[88vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-850 bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base tracking-wide flex items-center gap-2">
                      <span>Directory Health Audit</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 border border-red-500/40 text-red-300">
                        Defunct Cleaner
                      </span>
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      Batch inspect and purge closed, defunct, or demolished venues
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {/* Custom Search & Keyword Scanner */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-2">
                  <label className="block text-[10px] uppercase font-mono font-bold text-zinc-400">
                    Custom Defunct / Keyword Scanner
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={auditCustomTerm}
                      onChange={e => setAuditCustomTerm(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomAuditScan();
                        }
                      }}
                      placeholder="Search closed venue name, city, or keyword (e.g. 'Al\'s Bar' or 'closed')..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAuditScan}
                      className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Scan</span>
                    </button>
                  </div>
                </div>

                {/* Filter in Audit Results */}
                {auditFlaggedPlaces.length > 0 && (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = auditFlaggedPlaces.filter(p => 
                            p.venue.name.toLowerCase().includes(auditSearch.toLowerCase()) ||
                            p.venue.city.toLowerCase().includes(auditSearch.toLowerCase())
                          );
                          handleToggleSelectAllAudit(filtered);
                        }}
                        className="text-xs font-mono font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer bg-red-950/30 px-2.5 py-1 rounded border border-red-500/20"
                      >
                        {auditFlaggedPlaces.length > 0 && selectedAuditIds.size === auditFlaggedPlaces.length ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Deselect All</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5" />
                            <span>Select All</span>
                          </>
                        )}
                      </button>
                      <span className="text-xs font-mono text-zinc-400">
                        <strong className="text-white">{selectedAuditIds.size}</strong> of {auditFlaggedPlaces.length} selected for purge
                      </span>
                    </div>

                    <input
                      type="text"
                      value={auditSearch}
                      onChange={e => setAuditSearch(e.target.value)}
                      placeholder="Filter audit list..."
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/40 w-44 font-mono"
                    />
                  </div>
                )}

                {/* Flagged Places List */}
                {auditFlaggedPlaces.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-2">
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
                    <div className="text-sm font-bold text-white">Your Directory Is Clean!</div>
                    <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
                      No automated defunct or permanently closed venue patterns detected in your active listings. Use the custom scanner above to flag specific spots if needed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {auditFlaggedPlaces
                      .filter(p => 
                        p.venue.name.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        p.venue.city.toLowerCase().includes(auditSearch.toLowerCase())
                      )
                      .map(({ venue, reason }) => {
                        const isSelected = selectedAuditIds.has(venue.id);
                        return (
                          <div
                            key={`audit-v-${venue.id}`}
                            onClick={() => handleToggleAuditSelect(venue.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-red-950/30 border-red-500/50 text-white shadow-sm'
                                : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="pt-0.5">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-red-400 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-white truncate flex items-center gap-2">
                                  <span>{venue.name}</span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/60 border border-red-500/40 text-red-200">
                                    {reason}
                                  </span>
                                </div>
                                <div className="text-xs font-mono text-zinc-400 mt-0.5 truncate">
                                  {venue.city}{venue.state ? `, ${venue.state}` : ''} • Cap: {venue.capacity || 'N/A'} {venue.address ? `• ${venue.address}` : ''}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteVenue(venue.id, venue.name, venue);
                              }}
                              className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                              title="Inspect / Single Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-850 bg-[#0c0d10] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={selectedAuditIds.size === 0 || isPurging}
                  onClick={handlePurgeSelectedDefunct}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(239,68,68,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {isPurging
                      ? 'Purging Records...'
                      : `Purge Selected (${selectedAuditIds.size}) Listings`}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && venueToDelete && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-[#13161a] border border-red-500/30 rounded-2xl z-50 overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.2)] max-w-md mx-auto"
            >
              <div className="p-6 text-left space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base">
                      Remove from Black Book?
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      Exclude from directory & routing engine
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-850 p-3.5 rounded-xl text-left space-y-1">
                  <div className="text-white font-bold text-sm">{venueToDelete.name}</div>
                  <div className="text-xs font-mono text-zinc-400">
                    {venueToDelete.city}{venueToDelete.state ? `, ${venueToDelete.state}` : ''} • Cap: {venueToDelete.capacity || 'N/A'}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 pt-1">
                    Source: {venueToDelete.source || 'Local Database'}
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  This place will be permanently hidden from your Nexus Core database and will not appear in tour optimization suggestions.
                </p>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-[#0a0a0c] flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  Keep Place
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Place</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
