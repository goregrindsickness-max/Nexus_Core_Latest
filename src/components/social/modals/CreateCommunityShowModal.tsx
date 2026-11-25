import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Upload,
  Plus,
  Trash2,
  Check,
  ZoomIn,
  Layers,
  Music,
  Shield,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Pin,
  Eye,
  Building2,
  Wand2,
} from 'lucide-react';
import { compressImageInSocialFeed, getShowTicketTiers } from '../../../utils/socialFeedUtils';
import {
  findMatchingExistingShowForBatchStop,
  getMultiDaySpanDays,
  isShowPastOrEnded,
  parseShowExtraNotes,
  shiftIsoDateYear,
} from '../../../utils/showDisplayUtils';
import { showsStore, venuesStore } from '../../../utils/indexedDB';
import {
  getSupabase,
  generateUUID,
  ensureUUID,
  uploadBase64ToStorage,
  syncCommunityShowToCloud,
} from '../../../supabase';
import { CustomTicketTiersBuilder } from '../../shows/CustomTicketTiersBuilder';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import type { TicketTier } from '../../../types';

export interface CreateCommunityShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (showData: any) => void;
  editingShow?: any | null;
  triggerNotification?: (msg: string) => void;
}

export interface TourStopItem {
  id: string;
  show_date: string;
  end_date?: string;
  city: string;
  state: string;
  venue_name: string;
  doors_time?: string;
  set_time?: string;
  ticket_url?: string;
}

interface BandSuggestionItem {
  name: string;
  logo?: string;
  genre?: string;
  location?: string;
}

interface VenueSuggestionItem {
  id?: string;
  name: string;
  city: string;
  state: string;
  street_address?: string;
  capacity?: number;
}

const PRICE_PRESETS = ['Free', 'Cover at Door', '$15', '$20', '$25', '$30'];
const AGE_PRESETS = ['All Ages', '16+', '18+', '21+'];

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function addDaysToIsoDate(isoDate: string, daysToAdd: number): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + daysToAdd);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function parsePastedTourRoutingText(rawText: string, defaultYear: number): TourStopItem[] {
  if (!rawText || !rawText.trim()) return [];

  // Check if the pasted block mentions an explicit 4-digit tour year like "U.S. TOUR 2027"
  const globalYearMatch = rawText.match(/\b(202[5-9]|203\d)\b/);
  const effectiveYear = globalYearMatch ? parseInt(globalYearMatch[1], 10) : defaultYear;

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 4);

  const parsedStops: TourStopItem[] = [];

  for (const rawLine of lines) {
    // Strip leading bullets or asterisks
    const line = rawLine.replace(/^[*•\-–—]+\s*/, '').trim();
    if (!line) continue;

    let isoDate = '';
    let remainder = '';

    // Pattern 1: YYYY-MM-DD at start
    const isoMatch = line.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\b[\s|:\-–—•]*(.*)$/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = isoMatch[2].padStart(2, '0');
      const d = isoMatch[3].padStart(2, '0');
      isoDate = `${y}-${m}-${d}`;
      remainder = isoMatch[4].trim();
    }

    // Pattern 2: MM/DD/YYYY or MM/DD/YY or M/D at start
    if (!isoDate) {
      const slashMatch = line.match(/^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b[\s|:\-–—•]*(.*)$/);
      if (slashMatch) {
        const mNum = parseInt(slashMatch[1], 10);
        const dNum = parseInt(slashMatch[2], 10);
        if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
          let yNum = effectiveYear;
          if (slashMatch[3]) {
            const rawY = parseInt(slashMatch[3], 10);
            yNum = rawY < 100 ? 2000 + rawY : rawY;
          }
          isoDate = `${yNum}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
          remainder = slashMatch[4].trim();
        }
      }
    }

    // Pattern 3: MonthName DD[, YYYY] at start (e.g., "Mar 9 Dallas, TX - Puzzles")
    if (!isoDate) {
      const monthMatch = line.match(
        /^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?\b[\s|:\-–—•]*(.*)$/i
      );
      if (monthMatch) {
        const mKey = monthMatch[1].toLowerCase();
        const mNum = MONTH_NAME_MAP[mKey];
        const dNum = parseInt(monthMatch[2], 10);
        if (mNum && dNum >= 1 && dNum <= 31) {
          const yNum = monthMatch[3] ? parseInt(monthMatch[3], 10) : effectiveYear;
          isoDate = `${yNum}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
          remainder = monthMatch[4].trim();
        }
      }
    }

    if (!isoDate || !remainder) continue;

    // Now extract City, State and Venue from remainder
    // Common separators: " - ", " – ", " — ", " @ ", " | ", or 2+ spaces
    let cityPart = '';
    let venuePart = '';

    if (remainder.includes(' @ ')) {
      const parts = remainder.split(' @ ').map((s) => s.trim());
      cityPart = parts[0];
      venuePart = parts.slice(1).join(' @ ');
    } else if (remainder.includes(' | ')) {
      const parts = remainder.split(' | ').map((s) => s.trim());
      cityPart = parts[0];
      venuePart = parts.slice(1).join(' - ');
    } else if (/\s+[-–—]\s+/.test(remainder)) {
      const parts = remainder.split(/\s+[-–—]\s+/).map((s) => s.trim());
      cityPart = parts[0];
      venuePart = parts.slice(1).join(' - ');
    } else if (/\s{2,}/.test(remainder)) {
      const parts = remainder.split(/\s{2,}/).map((s) => s.trim());
      cityPart = parts[0];
      venuePart = parts.slice(1).join(' ');
    } else {
      // Try matching "City, ST Venue Name"
      const cityStateVenueMatch = remainder.match(/^([A-Za-z .'-]+,\s*[A-Za-z]{2})\s+(.+)$/);
      if (cityStateVenueMatch) {
        cityPart = cityStateVenueMatch[1].trim();
        venuePart = cityStateVenueMatch[2].trim();
      } else {
        cityPart = remainder;
        venuePart = 'Live Venue';
      }
    }

    let city = cityPart.trim();
    let state = '';
    if (city.includes(',')) {
      const [c, s] = city.split(',').map((p) => p.trim());
      city = c || city;
      // Strip trailing venue tokens if state accidentally captured them
      const stateTokens = (s || '').split(/\s+/);
      if (stateTokens.length > 1 && stateTokens[0].length === 2 && !venuePart) {
        state = stateTokens[0].toUpperCase();
        venuePart = stateTokens.slice(1).join(' ');
      } else {
        state = (s || '').toUpperCase();
      }
    }

    if (!city) continue;

    parsedStops.push({
      id: 'stop_' + Math.random().toString(36).substring(2, 9) + '_' + parsedStops.length,
      show_date: isoDate,
      city,
      state,
      venue_name: venuePart.trim() || 'Live Venue',
      doors_time: '19:00',
    });
  }

  return parsedStops;
}

export const CreateCommunityShowModal: React.FC<CreateCommunityShowModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingShow,
  triggerNotification,
}) => {
  // Active Tab: 'single' (Default) | 'tour' (Batch Multi-Date Tour)
  const [activeTab, setActiveTab] = useState<'single' | 'tour'>('single');

  // ----------------------------------------------------
  // TAB A: Single Show State
  // ----------------------------------------------------
  const [name, setName] = useState('');
  const [festivalName, setFestivalName] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMultiDayFest, setIsMultiDayFest] = useState(false);
  const [doorsTime, setDoorsTime] = useState('19:00');
  const [setTime, setSetTime] = useState('20:00');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [venueId, setVenueId] = useState('');
  const [venueSource, setVenueSource] = useState<'matched-blackbook' | 'auto-stubbed' | null>(null);
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [country, setCountry] = useState('United States');
  const [externalTicketUrl, setExternalTicketUrl] = useState('');
  const [flyerUrl, setFlyerUrl] = useState('');
  const [dayOfShowPrice, setDayOfShowPrice] = useState('');
  const [presalePrice, setPresalePrice] = useState('');
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [ageRestriction, setAgeRestriction] = useState('All Ages');
  const [safetyCode, setSafetyCode] = useState('');
  const [isTime24Hour, setIsTime24Hour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tour_time_is_24h') === 'true';
    } catch {
      return false;
    }
  });

  const [supportBands, setSupportBands] = useState<string[]>([]);
  const [newSupportBandInput, setNewSupportBandInput] = useState('');
  const [isDraggingSingleFlyer, setIsDraggingSingleFlyer] = useState(false);
  const [showAdvancedSingle, setShowAdvancedSingle] = useState(false);

  // ----------------------------------------------------
  // TAB B: Tour Dates (Batch Multi-Date) State
  // ----------------------------------------------------
  const [tourHeadliner, setTourHeadliner] = useState('');
  const [tourSupportBands, setTourSupportBands] = useState<string[]>([]);
  const [newTourSupportInput, setNewTourSupportInput] = useState('');
  const [tourPackageName, setTourPackageName] = useState('');
  const [tourFlyerUrl, setTourFlyerUrl] = useState('');
  const [tourStops, setTourStops] = useState<TourStopItem[]>([]);
  const [isDraggingTourFlyer, setIsDraggingTourFlyer] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [isPosterPinnedMobile, setIsPosterPinnedMobile] = useState(false);

  // Quick-Paste Tour Routing State
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [quickPasteText, setQuickPasteText] = useState('');
  const [quickPasteYear, setQuickPasteYear] = useState<number>(() => new Date().getFullYear());

  // Tour Stop Inline Add Form State
  const [stopDate, setStopDate] = useState('');
  const [stopEndDate, setStopEndDate] = useState('');
  const [stopCity, setStopCity] = useState('');
  const [stopState, setStopState] = useState('');
  const [stopVenue, setStopVenue] = useState('');
  const [stopDoorsTime, setStopDoorsTime] = useState('19:00');
  const [stopTicketUrl, setStopTicketUrl] = useState('');
  const [isBatchCreating, setIsBatchCreating] = useState(false);

  // Directory Autocomplete Data & Focus Tracking
  const [bandCatalog, setBandCatalog] = useState<BandSuggestionItem[]>([]);
  const [venueCatalog, setVenueCatalog] = useState<VenueSuggestionItem[]>([]);
  const [activeAutocompleteField, setActiveAutocompleteField] = useState<
    null | 'single-headliner' | 'single-support' | 'single-venue' | 'tour-headliner' | 'tour-support' | 'tour-venue'
  >(null);

  // File Inputs Refs
  const singleFlyerInputRef = useRef<HTMLInputElement>(null);
  const tourFlyerInputRef = useRef<HTMLInputElement>(null);

  // Helper: Format 24h to 12h AM/PM
  const formatTimeToDisplay = (time24: string) => {
    if (!time24) return '';
    if (isTime24Hour) return time24;
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10);
    if (isNaN(h)) return time24;
    const m = mStr || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m} ${period}`;
  };

  // Load Known Bands & Black Book Venues for Instant Autocomplete
  useEffect(() => {
    if (!isOpen) return;

    const loadAutocompleteDirectories = async () => {
      // 1. Aggregate Bands
      const bandMap = new Map<string, BandSuggestionItem>();
      const registerBandCandidate = (raw: any) => {
        if (!raw) return;
        const bName = String(raw.band_name || raw.name || '').trim();
        if (!bName || bName.length < 2) return;
        const key = bName.toLowerCase();
        const logo =
          raw.logo_url || raw.avatar_url || raw.image_url || raw.avatar || undefined;
        const genre = Array.isArray(raw.micro_genres)
          ? raw.micro_genres.slice(0, 2).join(' • ')
          : typeof raw.genre === 'string'
          ? raw.genre
          : undefined;
        const loc =
          [raw.city, raw.state_province || raw.state].filter(Boolean).join(', ') ||
          raw.homebase ||
          raw.location ||
          undefined;

        const existing = bandMap.get(key);
        bandMap.set(key, {
          name: existing?.name || bName,
          logo: existing?.logo || (typeof logo === 'string' && !logo.includes('unsplash') ? logo : undefined),
          genre: existing?.genre || genre,
          location: existing?.location || loc,
        });
      };

      try {
        const storageKeys = ['nexus_community_bands_v2', 'nexus_registered_bands', 'nexus_bands_list'];
        for (const k of storageKeys) {
          const rawStr = localStorage.getItem(k);
          if (rawStr) {
            const parsed = JSON.parse(rawStr);
            if (Array.isArray(parsed)) parsed.forEach(registerBandCandidate);
          }
        }
      } catch (_) {}

      // Also pull bands from existing shows & Supabase
      try {
        await showsStore.iterate((val: any) => {
          if (val && typeof val === 'object') {
            if (val.headliner) registerBandCandidate({ name: val.headliner });
            if (typeof val.support_bands === 'string') {
              val.support_bands
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
                .forEach((b: string) => registerBandCandidate({ name: b }));
            }
          }
        });
      } catch (_) {}

      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data } = await supabase
            .from('bands')
            .select('band_name, logo_url, micro_genres, city, state_province')
            .limit(120);
          if (Array.isArray(data)) {
            data.forEach(registerBandCandidate);
          }
        }
      } catch (_) {}

      setBandCatalog(Array.from(bandMap.values()).sort((a, b) => a.name.localeCompare(b.name)));

      // 2. Aggregate Black Book Venues
      const venueMap = new Map<string, VenueSuggestionItem>();
      const registerVenueCandidate = (v: any) => {
        if (!v || typeof v !== 'object') return;
        const vName = String(v.name || v.venue_name || v.venue || '').trim();
        if (!vName || vName.toLowerCase() === 'live venue' || vName.toLowerCase() === 'live stage') return;
        const vCity = String(v.city || '').trim();
        const vState = String(v.state || v.state_province || '').trim();
        const key = `${vName.toLowerCase()}|${vCity.toLowerCase()}`;
        const existing = venueMap.get(key);
        const capNum = Number(v.capacity || v.venue_capacity);
        venueMap.set(key, {
          id: v.id || existing?.id,
          name: existing?.name || vName,
          city: existing?.city || vCity,
          state: existing?.state || vState,
          street_address: v.street_address || v.venue_address || existing?.street_address,
          capacity: Number.isFinite(capNum) && capNum > 0 ? capNum : existing?.capacity,
        });
      };

      try {
        const masterVenues = await venuesStore.getItem<any>('nexus_master_venues');
        if (masterVenues) {
          const parsed = typeof masterVenues === 'string' ? JSON.parse(masterVenues) : masterVenues;
          if (Array.isArray(parsed)) parsed.forEach(registerVenueCandidate);
        }
        await venuesStore.iterate((val: any, key: string) => {
          if (key !== 'nexus_master_venues' && val && typeof val === 'object') {
            registerVenueCandidate(val);
          }
        });
      } catch (_) {}

      try {
        await showsStore.iterate((val: any) => {
          if (val && typeof val === 'object' && (val.venue_name || val.venue)) {
            registerVenueCandidate(val);
          }
        });
      } catch (_) {}

      setVenueCatalog(Array.from(venueMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    };

    loadAutocompleteDirectories();
  }, [isOpen]);

  // Populate from editingShow when available
  useEffect(() => {
    if (editingShow) {
      setActiveTab('single');

      const isGeneric = (str?: string) => {
        if (!str) return true;
        const lower = str.toLowerCase().trim();
        return (
          !lower ||
          lower === 'tour show' ||
          lower === 'live show' ||
          lower === 'show' ||
          lower === 'gig' ||
          lower === 'live act' ||
          lower === 'underground show'
        );
      };

      let headlinerVal = editingShow.headliner || editingShow.band_name || editingShow.artist_name || '';
      let venueVal =
        editingShow.venue_name ||
        (editingShow.venue && !editingShow.venue.toLowerCase().includes('live show') ? editingShow.venue : '') ||
        '';
      let cityVal = editingShow.city || '';
      let stateVal = editingShow.state_province || editingShow.state || '';
      let festivalVal = editingShow.festival_name || editingShow.tour_name || '';

      const compositeStr = editingShow.name || editingShow.show_name || editingShow.title || '';

      if (compositeStr.includes(' | ') || compositeStr.includes(' - ') || isGeneric(headlinerVal)) {
        let leftPart = compositeStr;

        if (compositeStr.includes(' | ')) {
          const parts = compositeStr.split(' | ').map((s: string) => s.trim());
          leftPart = parts[0];
          if (parts[1]) {
            const extractedVenue = parts[1].replace(/\(Tour\)/gi, '').trim();
            if (extractedVenue && (isGeneric(venueVal) || !venueVal)) {
              venueVal = extractedVenue;
            }
          }
        }

        if (leftPart.includes(' - ')) {
          const [hPart, locPart] = leftPart.split(' - ').map((s: string) => s.trim());
          if (hPart && !isGeneric(hPart)) {
            headlinerVal = hPart;
          }
          if (locPart && (!cityVal || cityVal === 'Tour Stop')) {
            if (locPart.includes(',')) {
              const [c, s] = locPart.split(',').map((str: string) => str.trim());
              cityVal = c;
              stateVal = s;
            } else {
              cityVal = locPart;
            }
          }
        } else if (leftPart && !isGeneric(leftPart) && isGeneric(headlinerVal)) {
          if (leftPart.includes(' at ')) {
            const [hPart, vPart] = leftPart.split(' at ').map((s: string) => s.trim());
            if (hPart && !isGeneric(hPart)) headlinerVal = hPart;
            if (vPart && isGeneric(venueVal)) venueVal = vPart;
          } else {
            headlinerVal = leftPart;
          }
        }
      }

      if (isGeneric(headlinerVal)) {
        headlinerVal = festivalVal && !isGeneric(festivalVal) ? festivalVal : 'Vader';
      }

      if (cityVal.includes(',')) {
        const parts = cityVal
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean);
        cityVal = parts[0] || '';
        if (!stateVal && parts[1]) stateVal = parts[1];
      }

      setName(headlinerVal);
      setFestivalName(festivalVal);
      setVenueName(venueVal);
      setCity(cityVal);
      setStateProvince(stateVal);

      const rawDate = editingShow.rawDate || editingShow.date || editingShow.show_date || '';
      const parsedStart =
        rawDate && /^\d{4}-\d{2}-\d{2}/.test(String(rawDate)) ? String(rawDate).split('T')[0] : '';
      setDate(parsedStart);

      const extraEdit = parseShowExtraNotes(editingShow);
      const rawEnd =
        editingShow.end_date || editingShow.endDate || extraEdit.end_date || extraEdit.endDate || '';
      const parsedEnd =
        rawEnd && /^\d{4}-\d{2}-\d{2}/.test(String(rawEnd)) ? String(rawEnd).split('T')[0] : '';
      setEndDate(parsedEnd);
      setIsMultiDayFest(Boolean(parsedEnd && (!parsedStart || parsedEnd > parsedStart)));

      setDoorsTime(editingShow.doors_time || '19:00');
      setSetTime(editingShow.set_time || '20:00');

      const rawVAddr =
        editingShow.venue_address ||
        (editingShow.venue && editingShow.venue !== venueVal ? editingShow.venue : '') ||
        '';
      setVenueAddress(rawVAddr);
      setCountry(editingShow.country || 'United States');
      const rawCap = editingShow.venue_capacity || editingShow.capacity || '';
      setCapacity(rawCap ? String(rawCap) : '');

      let dosP = editingShow.day_of_show_price ? String(editingShow.day_of_show_price) : '';
      let advP = editingShow.presale_price ? String(editingShow.presale_price) : '';
      const combinedPrice = editingShow.price || editingShow.ticket_price || '';

      if (!dosP && !advP && combinedPrice) {
        const priceStr = String(combinedPrice);
        if (priceStr.includes('/')) {
          const [p1, p2] = priceStr.split('/').map((s) => s.trim());
          advP = p1.replace(/^(dos|presale|adv|door)\s*/gi, '').trim();
          dosP = (p2 || '').replace(/^(dos|presale|adv|door)\s*/gi, '').trim();
        } else {
          dosP = priceStr.replace(/^(dos|presale|adv|door)\s*/gi, '').trim();
        }
      }
      setDayOfShowPrice(dosP || (typeof combinedPrice === 'string' ? combinedPrice : ''));
      setPresalePrice(advP);

      setExternalTicketUrl(editingShow.external_ticket_url || editingShow.ticket_url || '');
      setFlyerUrl(editingShow.flyer_url || '');
      const loadedTiers = getShowTicketTiers(editingShow);
      setTicketTiers(loadedTiers);
      setAgeRestriction(editingShow.age_restriction || editingShow.age || 'All Ages');
      const loadedSafety = editingShow.safety_code || editingShow.safetyCode || '';
      setSafetyCode(loadedSafety);

      // Automatically expand advanced accordion if editing show has advanced properties populated
      setShowAdvancedSingle(
        Boolean(loadedTiers.length > 0 || rawVAddr || rawCap || loadedSafety)
      );

      if (Array.isArray(editingShow.support_lineup)) {
        setSupportBands(
          editingShow.support_lineup.map((s: any) =>
            typeof s === 'string' ? s : s.band_name || s.name || ''
          )
        );
      } else if (typeof editingShow.support_bands === 'string') {
        setSupportBands(
          editingShow.support_bands
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        );
      }
    } else {
      // Reset single show form
      setName('');
      setFestivalName('');
      setDate('');
      setEndDate('');
      setIsMultiDayFest(false);
      setDoorsTime('19:00');
      setSetTime('20:00');
      setVenueName('');
      setVenueAddress('');
      setCapacity('');
      setCity('');
      setStateProvince('');
      setCountry('United States');
      setExternalTicketUrl('');
      setFlyerUrl('');
      setDayOfShowPrice('');
      setPresalePrice('');
      setTicketTiers([]);
      setAgeRestriction('All Ages');
      setSafetyCode('');
      setSupportBands([]);
      setNewSupportBandInput('');
      setShowAdvancedSingle(false);

      // Reset tour batch form
      setTourHeadliner('');
      setTourSupportBands([]);
      setNewTourSupportInput('');
      setTourPackageName('');
      setTourFlyerUrl('');
      setTourStops([]);
      setStopDate('');
      setStopEndDate('');
      setStopCity('');
      setStopState('');
      setStopVenue('');
      setStopDoorsTime('19:00');
      setStopTicketUrl('');
      setIsQuickPasteOpen(false);
      setQuickPasteText('');
    }
  }, [editingShow, isOpen]);

  // Venue auto-match detection for Single Show
  useEffect(() => {
    if (!venueName.trim()) {
      setVenueSource(null);
      return;
    }
    const matched = venueCatalog.find(
      (v) =>
        v.name.toLowerCase().trim() === venueName.toLowerCase().trim() ||
        (city.trim() &&
          v.city.toLowerCase().trim() === city.toLowerCase().trim() &&
          v.name.toLowerCase().includes(venueName.toLowerCase().trim()))
    );
    if (matched) {
      setVenueSource('matched-blackbook');
      if (matched.id) setVenueId(matched.id);
      if (!capacity && matched.capacity) setCapacity(String(matched.capacity));
      if (!venueAddress && matched.street_address) setVenueAddress(matched.street_address);
      if (!city && matched.city) setCity(matched.city);
      if (!stateProvince && matched.state) setStateProvince(matched.state);
    } else {
      setVenueSource('auto-stubbed');
    }
  }, [venueName, city, venueCatalog]);

  // Computed Autocomplete Suggestions
  const getFilteredBands = (query: string, excludeList: string[] = []): BandSuggestionItem[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const excluded = new Set(excludeList.map((b) => b.toLowerCase()));
    return bandCatalog
      .filter((b) => !excluded.has(b.name.toLowerCase()) && b.name.toLowerCase().includes(q))
      .slice(0, 6);
  };

  const getFilteredVenues = (query: string, cityFilter?: string): VenueSuggestionItem[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return venueCatalog
      .filter((v) => {
        const nameMatch = v.name.toLowerCase().includes(q);
        const cityMatch = v.city.toLowerCase().includes(q);
        if (!nameMatch && !cityMatch) return false;
        if (cityFilter && cityFilter.trim() && v.city) {
          // Prioritize or allow matching
          return true;
        }
        return true;
      })
      .slice(0, 6);
  };

  // Advanced Fields Active Count Badge
  const advancedFieldsCount = useMemo(() => {
    let count = 0;
    if (ticketTiers.length > 0) count += 1;
    if (venueAddress.trim()) count += 1;
    if (capacity.trim()) count += 1;
    if (safetyCode.trim()) count += 1;
    if (country.trim() && country.trim().toLowerCase() !== 'united states') count += 1;
    return count;
  }, [ticketTiers.length, venueAddress, capacity, safetyCode, country]);

  if (!isOpen) return null;

  // Process manual flyer upload with compression & Storage upload
  const processImageFile = (file: File, onSuccess: (publicUrl: string) => void) => {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      triggerNotification?.('⚠️ Flyer image exceeds 12MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImageInSocialFeed(raw, 1080, 1080, 0.8);
        let uploadedUrl = await uploadBase64ToStorage(compressed, 'feed_media', 'community_show', 'flyer');
        if (!uploadedUrl || uploadedUrl.startsWith('data:')) {
          uploadedUrl = await uploadBase64ToStorage(compressed, 'archives', 'community_show', 'flyer');
        }
        if (uploadedUrl && !uploadedUrl.startsWith('data:')) {
          onSuccess(uploadedUrl);
        } else {
          onSuccess(compressed);
        }
      } catch {
        onSuccess(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Multi-Band Parse & Add Helper (supports comma/semicolon/newline separated paste)
  const addBandsToList = (
    rawInput: string,
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) => {
    const tokens = rawInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;
    setList((prev) => {
      const existingLower = new Set(prev.map((b) => b.toLowerCase()));
      const additions: string[] = [];
      for (const t of tokens) {
        if (!existingLower.has(t.toLowerCase())) {
          existingLower.add(t.toLowerCase());
          additions.push(t);
        }
      }
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
    clearInput();
  };

  const moveBandInList = (
    index: number,
    direction: -1 | 1,
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList((prev) => {
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
  };

  // Support Bands Handlers for Single Show
  const handleAddSupportBand = (overrideValue?: string) => {
    addBandsToList(
      overrideValue ?? newSupportBandInput,
      supportBands,
      setSupportBands,
      () => setNewSupportBandInput('')
    );
  };

  const handleRemoveSupportBand = (index: number) => {
    setSupportBands((prev) => prev.filter((_, i) => i !== index));
  };

  // Support Bands Handlers for Tour Dates Tab
  const handleAddTourSupportBand = (overrideValue?: string) => {
    addBandsToList(
      overrideValue ?? newTourSupportInput,
      tourSupportBands,
      setTourSupportBands,
      () => setNewTourSupportInput('')
    );
  };

  const handleRemoveTourSupportBand = (index: number) => {
    setTourSupportBands((prev) => prev.filter((_, i) => i !== index));
  };

  // Select Venue Suggestion for Single Show
  const handleSelectSingleVenueSuggestion = (v: VenueSuggestionItem) => {
    setVenueName(v.name);
    if (v.city) setCity(v.city);
    if (v.state) setStateProvince(v.state);
    if (v.street_address) setVenueAddress(v.street_address);
    if (v.capacity) setCapacity(String(v.capacity));
    if (v.id) setVenueId(v.id);
    setVenueSource('matched-blackbook');
    setActiveAutocompleteField(null);
  };

  // Select Venue Suggestion for Tour Stop
  const handleSelectTourStopVenueSuggestion = (v: VenueSuggestionItem) => {
    setStopVenue(v.name);
    if (v.city) setStopCity(v.city);
    if (v.state) setStopState(v.state);
    setActiveAutocompleteField(null);
  };

  // Tour Stop Add Handler (with Auto-Incrementing Date Picker)
  const handleAddTourStop = () => {
    if (!stopDate) {
      triggerNotification?.('⚠️ Please select a date for the tour stop.');
      return;
    }
    if (!stopCity.trim()) {
      triggerNotification?.('⚠️ Please enter the city for this stop.');
      return;
    }
    const cleanStopEnd = stopEndDate && stopEndDate > stopDate ? stopEndDate : undefined;

    const newStop: TourStopItem = {
      id: 'stop_' + Math.random().toString(36).substring(2, 9),
      show_date: stopDate,
      ...(cleanStopEnd ? { end_date: cleanStopEnd } : {}),
      city: stopCity.trim(),
      state: stopState.trim().toUpperCase(),
      venue_name: stopVenue.trim() || 'Live Venue',
      doors_time: stopDoorsTime || '19:00',
      ticket_url: stopTicketUrl.trim() || undefined,
    };

    setTourStops((prev) =>
      [...prev, newStop].sort((a, b) => a.show_date.localeCompare(b.show_date))
    );

    // Auto-increment stopDate by +1 day for rapid sequential tour entry
    setStopDate(addDaysToIsoDate(stopDate, 1));
    setStopEndDate('');
    setStopCity('');
    setStopState('');
    setStopVenue('');
    setStopTicketUrl('');
  };

  // Quick-Paste Tour Routing Handler
  const handleParseQuickPasteStops = () => {
    const parsed = parsePastedTourRoutingText(quickPasteText, quickPasteYear);
    if (parsed.length === 0) {
      triggerNotification?.(
        '⚠️ Could not detect tour dates. Format each line like: "2/11 Washington, DC - Pearl Street Warehouse"'
      );
      return;
    }

    setTourStops((prev) => {
      const merged = [...prev, ...parsed];
      return merged.sort((a, b) => a.show_date.localeCompare(b.show_date));
    });
    const lastStop = parsed[parsed.length - 1];
    if (lastStop?.show_date) {
      setStopDate(addDaysToIsoDate(lastStop.show_date, 1));
    }
    setQuickPasteText('');
    setIsQuickPasteOpen(false);
    triggerNotification?.(`✅ Parsed and added ${parsed.length} tour stops!`);
  };

  const handleRemoveTourStop = (id: string) => {
    setTourStops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateTourStopDate = (id: string, nextDate: string) => {
    if (!nextDate) return;
    setTourStops((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextEnd = s.end_date && s.end_date > nextDate ? s.end_date : undefined;
        return {
          ...s,
          show_date: nextDate,
          ...(nextEnd ? { end_date: nextEnd } : { end_date: undefined }),
        };
      })
    );
  };

  const handleShiftAllPastStopsNextYear = () => {
    setTourStops((prev) =>
      prev.map((s) => {
        if (!isShowPastOrEnded({ date: s.show_date, end_date: s.end_date })) return s;
        const shiftedStart = shiftIsoDateYear(s.show_date, 1);
        const shiftedEnd = s.end_date ? shiftIsoDateYear(s.end_date, 1) : undefined;
        return {
          ...s,
          show_date: shiftedStart,
          ...(shiftedEnd ? { end_date: shiftedEnd } : {}),
        };
      })
    );
    triggerNotification?.('Updated past tour stop dates to next year.');
  };

  // Computed Preview Price String for Live Event Card Preview
  const previewPriceLabel = useMemo(() => {
    const cleanDos = dayOfShowPrice.trim();
    const cleanPresale = presalePrice.trim();
    if (cleanDos && cleanPresale) {
      return `$${cleanPresale.replace(/^\$/, '')} adv / $${cleanDos.replace(/^\$/, '')} dos`;
    }
    if (cleanDos) {
      return cleanDos.startsWith('$') ||
        cleanDos.toLowerCase().includes('free') ||
        cleanDos.toLowerCase().includes('cover')
        ? cleanDos
        : `$${cleanDos}`;
    }
    if (cleanPresale) {
      return `$${cleanPresale.replace(/^\$/, '')} adv`;
    }
    if (ticketTiers.length > 0) {
      const validPrices = ticketTiers
        .map((t) => Number(t.price))
        .filter((p) => Number.isFinite(p) && p >= 0);
      if (validPrices.length > 0) {
        const minP = Math.min(...validPrices);
        return validPrices.length > 1 ? `From $${minP}` : `$${minP}`;
      }
    }
    if (externalTicketUrl.trim()) return 'External Tickets';
    return 'Cover at Door';
  }, [dayOfShowPrice, presalePrice, ticketTiers, externalTicketUrl]);

  // Submit Handler for Single Show Tab
  const handleSingleShowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const headlinerVal = name.trim();
    if (!headlinerVal) {
      triggerNotification?.('⚠️ Please provide a band / headliner name.');
      return;
    }
    if (!date) {
      triggerNotification?.('⚠️ Please choose a show date.');
      return;
    }
    if (isMultiDayFest && endDate && endDate < date) {
      triggerNotification?.('⚠️ Festival end date cannot be earlier than the start date.');
      return;
    }
    if (!city.trim()) {
      triggerNotification?.('⚠️ City is required.');
      return;
    }

    const explicitVenueName = venueName.trim();
    const explicitVenueAddress = venueAddress.trim();
    const explicitCapacity = capacity.trim() ? parseInt(capacity.trim(), 10) : undefined;
    const trimmedFestival = festivalName.trim();

    const finalShowName = trimmedFestival ? `${headlinerVal} (${trimmedFestival})` : headlinerVal;

    const formattedSupportLineup = supportBands.map((bandName) => ({
      band_name: bandName,
      set_duration: '35 mins',
    }));

    const validTiers = ticketTiers
      .filter(
        (t) =>
          String(t.name || '').trim().length > 0 &&
          Number.isFinite(Number(t.price)) &&
          Number(t.price) >= 0
      )
      .map((t, idx) => ({
        ...t,
        id: t.id || `tier_${idx}_${Date.now()}`,
        name: String(t.name).trim(),
        price: Number(t.price),
        capacity:
          Number.isFinite(Number(t.capacity)) && Number(t.capacity) > 0 ? Number(t.capacity) : 0,
        sold: Number.isFinite(Number(t.sold)) && Number(t.sold) >= 0 ? Number(t.sold) : 0,
        description: t.description?.trim() || undefined,
        includesMerch: Boolean(t.includesMerch),
      }));

    const cleanDos = dayOfShowPrice.trim();
    const cleanPresale = presalePrice.trim();
    let computedPrice = 'Free';
    if (cleanDos && cleanPresale) {
      computedPrice = `$${cleanPresale.replace(/^\$/, '')} adv / $${cleanDos.replace(/^\$/, '')} dos`;
    } else if (cleanDos) {
      computedPrice =
        cleanDos.startsWith('$') ||
        cleanDos.toLowerCase().includes('free') ||
        cleanDos.toLowerCase().includes('cover')
          ? cleanDos
          : `$${cleanDos}`;
    } else if (cleanPresale) {
      computedPrice = `$${cleanPresale.replace(/^\$/, '')} adv`;
    } else if (validTiers.length > 0) {
      const lowestTier = Math.min(...validTiers.map((t) => t.price));
      computedPrice = validTiers.length > 1 ? `From $${lowestTier}` : `$${lowestTier}`;
    } else if (externalTicketUrl.trim()) {
      computedPrice = 'External Tickets';
    }

    const effectiveEndDate = isMultiDayFest && endDate && endDate > date ? endDate : undefined;

    const showId = editingShow?.id ? ensureUUID(editingShow.id) : generateUUID();
    const showPayload = {
      id: showId,
      name: finalShowName,
      show_name: finalShowName,
      headliner: headlinerVal,
      festival_name: trimmedFestival || undefined,
      tour_name: trimmedFestival || undefined,
      date,
      show_date: date,
      end_date: effectiveEndDate,
      endDate: effectiveEndDate,
      doors_time: doorsTime || undefined,
      set_time: setTime || undefined,
      venue_name: explicitVenueName || explicitVenueAddress || 'Live Stage',
      venue_address: explicitVenueAddress || undefined,
      venue: explicitVenueName || explicitVenueAddress || `${headlinerVal} Local Stage`,
      venue_id: venueId || editingShow?.venue_id || undefined,
      venue_source: venueSource || editingShow?.venue_source || undefined,
      capacity: explicitCapacity || undefined,
      venue_capacity: explicitCapacity || undefined,
      expected_attendance: explicitCapacity || undefined,
      city: city.trim() || stateProvince.trim() || 'Austin, TX',
      state_province: stateProvince.trim() || undefined,
      state: stateProvince.trim() || undefined,
      country: country.trim() || undefined,
      day_of_show_price: cleanDos || undefined,
      presale_price: cleanPresale || undefined,
      age_restriction: ageRestriction,
      age: ageRestriction,
      safety_code: safetyCode.trim() || undefined,
      price: computedPrice,
      ticket_price: cleanDos ? parseFloat(cleanDos.replace(/[^0-9.]/g, '')) || undefined : undefined,
      ticket_tiers: validTiers,
      external_ticket_url: externalTicketUrl.trim() || undefined,
      ticket_url: externalTicketUrl.trim() || undefined,
      flyer_url: flyerUrl || undefined,
      support_lineup: formattedSupportLineup,
      support_bands: supportBands.join(', '),
      is_time_24h: isTime24Hour,
      is_community_submitted: true,
      additional_notes: JSON.stringify({
        tour_name: trimmedFestival || undefined,
        tour_title: trimmedFestival || undefined,
        end_date: effectiveEndDate,
        flyer_url: flyerUrl && !flyerUrl.startsWith('data:image/') ? flyerUrl : undefined,
        ...(validTiers.length > 0 ? { ticket_tiers: validTiers } : {}),
      }),
      created_at: editingShow?.created_at || new Date().toISOString(),
    };

    onSubmit(showPayload);
  };

  // Batch Creation Handler for Tour Dates Tab
  const handleBatchCreateTour = async () => {
    const headlinerVal = tourHeadliner.trim();
    if (!headlinerVal) {
      triggerNotification?.('⚠️ Please enter the Headliner / Main Touring Artist.');
      return;
    }
    if (tourStops.length === 0) {
      triggerNotification?.('⚠️ Please add at least one tour stop date before creating events.');
      return;
    }

    setIsBatchCreating(true);
    let createdCount = 0;
    const activeTourName = tourPackageName.trim() || `${headlinerVal} Tour`;
    const sharedSupport = tourSupportBands.join(', ');
    const sharedLineup = tourSupportBands.map((b) => ({ band_name: b, set_duration: '35 mins' }));

    try {
      const existingShowsList: any[] = [];
      try {
        await showsStore.iterate((val: any) => {
          if (val && typeof val === 'object') {
            existingShowsList.push(val);
          }
        });
      } catch (_) {}

      for (const stop of tourStops) {
        const existingShow = findMatchingExistingShowForBatchStop(
          existingShowsList,
          headlinerVal,
          stop.show_date,
          stop.city
        );

        const showId = ensureUUID(existingShow?.id || generateUUID());
        const venueVal =
          stop.venue_name || existingShow?.venue_name || existingShow?.venue || 'Live Venue';
        const finalName = `${headlinerVal} at ${venueVal}`;

        if (stop.venue_name && stop.city) {
          const vStubId = 'ven_' + Math.random().toString(36).substring(2, 9);
          venuesStore
            .setItem(vStubId, {
              id: vStubId,
              name: stop.venue_name,
              city: stop.city,
              state: stop.state,
              country: 'United States',
              status: 'unverified-stub',
              source: 'tour-batch-manual',
              updated_at: new Date().toISOString(),
            })
            .catch(() => {});
        }

        const resolvedStopFlyer =
          tourFlyerUrl || existingShow?.flyer_url || existingShow?.flyerUrl || undefined;
        const resolvedStopEndDate = stop.end_date || existingShow?.end_date || undefined;
        const {
          isPast: _staleIsPast,
          isArchived: _staleIsArchived,
          is_past: _staleIsPastSnake,
          completed: _staleCompleted,
          ...safeExisting
        } = existingShow || {};
        const showPayload: any = {
          ...safeExisting,
          id: showId,
          creator_id: existingShow?.creator_id,
          name: finalName,
          show_name: finalName,
          headliner: headlinerVal,
          festival_name: activeTourName,
          tour_name: activeTourName,
          date: stop.show_date,
          show_date: stop.show_date,
          status: 'Active',
          ...(resolvedStopEndDate
            ? { end_date: resolvedStopEndDate, endDate: resolvedStopEndDate }
            : {}),
          doors_time: stop.doors_time || existingShow?.doors_time || '19:00',
          set_time: '20:00',
          venue_name: venueVal,
          venue: venueVal,
          city: (stop.city && String(stop.city).trim()) || existingShow?.city || 'Austin, TX',
          state_province: stop.state || existingShow?.state_province || undefined,
          state: stop.state || existingShow?.state || undefined,
          country: 'United States',
          price: existingShow?.price || 'Cover at Door',
          day_of_show_price: existingShow?.day_of_show_price || 'Cover at Door',
          age_restriction: existingShow?.age_restriction || 'All Ages',
          ticket_url: stop.ticket_url || existingShow?.ticket_url || undefined,
          external_ticket_url:
            stop.ticket_url || existingShow?.external_ticket_url || undefined,
          flyer_url: resolvedStopFlyer,
          flyerUrl: resolvedStopFlyer,
          support_bands: sharedSupport || existingShow?.support_bands,
          support_lineup: sharedLineup.length > 0 ? sharedLineup : existingShow?.support_lineup,
          is_community_submitted: true,
          additional_notes: JSON.stringify({
            tour_name: activeTourName,
            tour_title: activeTourName,
            ...(resolvedStopEndDate ? { end_date: resolvedStopEndDate } : {}),
            stop_id: showId,
            flyer_url:
              resolvedStopFlyer && !resolvedStopFlyer.startsWith('data:image/')
                ? resolvedStopFlyer
                : undefined,
          }),
          updated_at: new Date().toISOString(),
        };

        await showsStore.setItem(showId, showPayload);
        try {
          const rawExt = localStorage.getItem('nexus_core_shows_extended');
          const extMap = rawExt ? JSON.parse(rawExt) : {};
          extMap[showId] = { ...showPayload, _pendingCloudSync: true };
          localStorage.setItem('nexus_core_shows_extended', JSON.stringify(extMap));

          const rawCreated = localStorage.getItem('nexus_created_show_ids');
          const createdList: string[] = rawCreated ? JSON.parse(rawCreated) : [];
          if (!createdList.includes(showId)) {
            createdList.push(showId);
            localStorage.setItem('nexus_created_show_ids', JSON.stringify(createdList));
          }
        } catch (_) {}

        await syncCommunityShowToCloud(showPayload);

        createdCount++;
      }

      window.dispatchEvent(new CustomEvent('COMMUNITY_SHOWS_UPDATED'));
      triggerNotification?.(
        `🎉 Successfully created ${createdCount} tour show events! Each stop now has its own event page you can edit anytime.`
      );

      if (tourStops.length > 0) {
        onSubmit({
          id: 'sh_batch_completed',
          _isBatch: true,
          count: createdCount,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to create tour dates batch:', err);
      triggerNotification?.('⚠️ Failed to save all tour dates. Please try again.');
    } finally {
      setIsBatchCreating(false);
    }
  };

  // Single Show Date Badge Helper for Live Card Preview
  const previewDateParts = useMemo(() => {
    if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) {
      return { month: 'TBD', day: '--', year: String(new Date().getFullYear()) };
    }
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      month: dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: String(d).padStart(2, '0'),
      year: String(y),
    };
  }, [date]);

  const singleHeadlinerSuggestions =
    activeAutocompleteField === 'single-headliner' ? getFilteredBands(name, [name]) : [];
  const singleSupportSuggestions =
    activeAutocompleteField === 'single-support'
      ? getFilteredBands(newSupportBandInput, [name, ...supportBands])
      : [];
  const singleVenueSuggestions =
    activeAutocompleteField === 'single-venue' ? getFilteredVenues(venueName, city) : [];

  const tourHeadlinerSuggestions =
    activeAutocompleteField === 'tour-headliner'
      ? getFilteredBands(tourHeadliner, [tourHeadliner])
      : [];
  const tourSupportSuggestions =
    activeAutocompleteField === 'tour-support'
      ? getFilteredBands(newTourSupportInput, [tourHeadliner, ...tourSupportBands])
      : [];
  const tourVenueSuggestions =
    activeAutocompleteField === 'tour-venue' ? getFilteredVenues(stopVenue, stopCity) : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2.5 sm:p-4 pb-14 sm:pb-6 bg-black/85 backdrop-blur-md animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-3xl bg-[#0a0c10] border border-zinc-800/90 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[92vh]"
        >
          {/* Top Accent Gradient Hairline */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-[#0f131a]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-wide font-mono uppercase">
                    {editingShow ? 'Edit Community Show' : 'Community Show Console'}
                  </h3>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    Scene Hub
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Post a single concert date or batch-import a full multi-date tour
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tab Switcher */}
          <div className="flex items-center justify-between border-b border-zinc-800/90 bg-black/50 px-5 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`pb-2.5 px-3.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'single'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Single Show</span>
              </button>

              {!editingShow && (
                <button
                  type="button"
                  onClick={() => setActiveTab('tour')}
                  className={`pb-2.5 px-3.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'tour'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tour Dates (Batch)</span>
                  {tourStops.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      {tourStops.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {bandCatalog.length > 0 && (
              <span className="hidden md:inline-block text-[10px] font-mono text-zinc-500 pb-2">
                {bandCatalog.length} bands • {venueCatalog.length} Black Book venues indexed
              </span>
            )}
          </div>

          {/* ======================================================== */}
          {/* TAB A: SINGLE SHOW FORM                                   */}
          {/* ======================================================== */}
          {activeTab === 'single' && (
            <form
              onSubmit={handleSingleShowSubmit}
              className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs"
            >
              {/* 1. LIVE EVENT CARD PREVIEW + FLYER UPLOAD BANNER */}
              <div className="relative rounded-xl border border-zinc-800/90 overflow-hidden bg-[#0e1218] shadow-lg">
                {flyerUrl && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <img
                      src={flyerUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover object-center opacity-25 blur-[2px] scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c10]/95 via-[#0a0c10]/80 to-[#0a0c10]/90" />
                  </div>
                )}

                <div className="relative z-10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Live Card Preview */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Date Badge */}
                    <div className="w-13 h-15 rounded-xl bg-black/80 border border-emerald-500/30 flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                        {previewDateParts.month}
                      </span>
                      <span className="text-lg font-black text-white leading-none my-0.5 font-mono">
                        {previewDateParts.day}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {previewDateParts.year}
                      </span>
                    </div>

                    {/* Show Summary */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-300 uppercase flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" />
                          Live Card Preview
                        </span>
                        {festivalName.trim() && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[9px] font-mono font-bold text-purple-300 truncate max-w-[180px]">
                            {festivalName.trim()}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-[9px] font-mono text-zinc-300">
                          {ageRestriction}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-300">
                          {previewPriceLabel}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-white font-mono truncate">
                        {name.trim() || 'HEADLINER BAND NAME'}
                      </h4>

                      {supportBands.length > 0 && (
                        <p className="text-[11px] font-mono text-zinc-300 truncate">
                          w/ {supportBands.join(', ')}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mt-1 truncate">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300 font-semibold truncate">
                          {venueName.trim() || 'Venue Name'}
                        </span>
                        <span>•</span>
                        <span className="truncate">
                          {city.trim() || 'City'}
                          {stateProvince.trim() ? `, ${stateProvince.trim()}` : ''}
                        </span>
                        <span>•</span>
                        <span className="text-zinc-500 shrink-0">
                          Doors {formatTimeToDisplay(doorsTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Flyer Upload / Thumbnail Controls */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingSingleFlyer(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingSingleFlyer(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingSingleFlyer(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        processImageFile(file, (url) => setFlyerUrl(url));
                      }
                    }}
                    className={`shrink-0 rounded-xl border border-dashed transition p-2 flex items-center gap-2.5 ${
                      isDraggingSingleFlyer
                        ? 'bg-emerald-950/60 border-emerald-400'
                        : 'bg-black/60 border-zinc-700 hover:border-emerald-500/50'
                    }`}
                  >
                    {flyerUrl ? (
                      <>
                        <div
                          onClick={() => setLightboxImageUrl(flyerUrl)}
                          className="relative w-12 h-14 rounded-lg overflow-hidden border border-zinc-700 cursor-zoom-in group shrink-0"
                          title="Click to inspect full-size flyer with pinch-to-zoom"
                        >
                          <img
                            src={flyerUrl}
                            alt="Flyer Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <ZoomIn className="w-3.5 h-3.5 text-emerald-300" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 pr-1">
                          <button
                            type="button"
                            onClick={() => setLightboxImageUrl(flyerUrl)}
                            className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer text-left"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => singleFlyerInputRef.current?.click()}
                            className="text-[10px] font-mono text-zinc-300 hover:text-white cursor-pointer text-left"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setFlyerUrl('')}
                            className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer text-left"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => singleFlyerInputRef.current?.click()}
                        className="px-3 py-2 flex items-center gap-2 text-left cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-bold text-emerald-300">
                            Attach Flyer
                          </div>
                          <div className="text-[9px] font-mono text-zinc-400">
                            Drop or browse
                          </div>
                        </div>
                      </button>
                    )}
                    <input
                      ref={singleFlyerInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file, (url) => setFlyerUrl(url));
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. LINEUP & PACKAGE SECTION */}
              <div className="p-3.5 rounded-xl bg-[#0f131a]/90 border border-zinc-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Headliner with Community Band Hub Autocomplete */}
                  <div className="relative">
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Band / Headliner Name <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onFocus={() => setActiveAutocompleteField('single-headliner')}
                      onBlur={() =>
                        setTimeout(() => {
                          setActiveAutocompleteField((prev) =>
                            prev === 'single-headliner' ? null : prev
                          );
                        }, 180)
                      }
                      onChange={(e) => {
                        setName(e.target.value);
                        setActiveAutocompleteField('single-headliner');
                      }}
                      placeholder="e.g. Dying Fetus, Mortician, PeelingFlesh"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                    {singleHeadlinerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#12161f] border border-emerald-500/40 rounded-xl shadow-2xl overflow-hidden divide-y divide-zinc-800/60">
                        {singleHeadlinerSuggestions.map((b, idx) => (
                          <button
                            key={`hl-sug-${b.name}-${idx}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setName(b.name);
                              setActiveAutocompleteField(null);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-500/10 flex items-center justify-between gap-2 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {b.logo ? (
                                <img
                                  src={b.logo}
                                  alt={b.name}
                                  className="w-6 h-6 rounded-full object-cover border border-zinc-700 shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-300 shrink-0">
                                  {b.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="font-mono font-bold text-white truncate">
                                {b.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[140px]">
                              {b.genre || b.location || 'Band Hub'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Festival / Tour Package Name */}
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Festival or Tour Package Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={festivalName}
                      onChange={(e) => setFestivalName(e.target.value)}
                      placeholder="e.g. U.S. Tour 2027, Chaos & Carnage"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Support Lineup with Autocomplete, Comma Paste & Reordering */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider">
                      Support Lineup / Other Bands (Optional)
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Tip: Paste comma-separated bands to add multiple at once
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newSupportBandInput}
                        onFocus={() => setActiveAutocompleteField('single-support')}
                        onBlur={() =>
                          setTimeout(() => {
                            setActiveAutocompleteField((prev) =>
                              prev === 'single-support' ? null : prev
                            );
                          }, 180)
                        }
                        onChange={(e) => {
                          setNewSupportBandInput(e.target.value);
                          setActiveAutocompleteField('single-support');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSupportBand();
                          }
                        }}
                        placeholder="Type or paste band names (e.g. Cryptopsy, Gorgasm) + Enter"
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                      />
                      {singleSupportSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#12161f] border border-emerald-500/40 rounded-xl shadow-2xl overflow-hidden divide-y divide-zinc-800/60">
                          {singleSupportSuggestions.map((b, idx) => (
                            <button
                              key={`sup-sug-${b.name}-${idx}`}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddSupportBand(b.name);
                                setActiveAutocompleteField(null);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-emerald-500/10 flex items-center justify-between gap-2 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {b.logo ? (
                                  <img
                                    src={b.logo}
                                    alt={b.name}
                                    className="w-5 h-5 rounded-full object-cover border border-zinc-700 shrink-0"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-[9px] font-mono font-bold text-emerald-300 shrink-0">
                                    {b.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="font-mono font-bold text-white truncate">
                                  {b.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400">
                                + Add to Lineup
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddSupportBand()}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-mono text-xs flex items-center gap-1 cursor-pointer transition border border-zinc-700"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Add</span>
                    </button>
                  </div>

                  {supportBands.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {supportBands.map((band, idx) => (
                        <span
                          key={`sup-band-${band}-${idx}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 border border-zinc-800 hover:border-emerald-500/40 text-zinc-200 font-mono text-[11px] transition group"
                        >
                          <span className="text-[9px] text-emerald-400/80 font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold">{band}</span>
                          {supportBands.length > 1 && (
                            <span className="inline-flex items-center gap-0.5 ml-0.5 border-l border-zinc-800 pl-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveBandInList(idx, -1, setSupportBands)}
                                className="text-zinc-500 hover:text-emerald-400 disabled:opacity-25 cursor-pointer"
                                title="Move earlier in billing"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === supportBands.length - 1}
                                onClick={() => moveBandInList(idx, 1, setSupportBands)}
                                className="text-zinc-500 hover:text-emerald-400 disabled:opacity-25 cursor-pointer"
                                title="Move later in billing"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSupportBand(idx)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
                            title="Remove band"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. DATE & SCHEDULE SECTION */}
              <div className="p-3.5 rounded-xl bg-[#0f131a]/90 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-[11px] text-zinc-200 uppercase tracking-wider font-bold">
                      Schedule & Time
                    </span>
                    {isMultiDayFest && date && endDate && endDate > date && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">
                        {getMultiDaySpanDays(date, endDate)}-Day Fest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-300 font-mono font-bold">
                      <input
                        type="checkbox"
                        checked={isMultiDayFest}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsMultiDayFest(checked);
                          if (!checked) setEndDate('');
                        }}
                        className="rounded bg-black border-zinc-800 text-amber-400 focus:ring-0 cursor-pointer"
                      />
                      <span>Multi-Day Fest</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-400 font-mono">
                      <input
                        type="checkbox"
                        checked={isTime24Hour}
                        onChange={(e) => setIsTime24Hour(e.target.checked)}
                        className="rounded bg-black border-zinc-800 text-emerald-400 focus:ring-0 cursor-pointer"
                      />
                      <span>24-Hour Format</span>
                    </label>
                  </div>
                </div>

                <div
                  className={`grid grid-cols-1 ${
                    isMultiDayFest ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
                  } gap-3`}
                >
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-400 mb-1">
                      {isMultiDayFest ? 'Start Date' : 'Show Date'}{' '}
                      <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => {
                        const nextStart = e.target.value;
                        setDate(nextStart);
                        if (endDate && nextStart && endDate < nextStart) {
                          setEndDate(nextStart);
                        }
                      }}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  {isMultiDayFest && (
                    <div>
                      <label className="block font-mono text-[11px] text-amber-300 mb-1">
                        End Date <span className="text-amber-400">(Multi-Day)</span>
                      </label>
                      <input
                        type="date"
                        min={date || undefined}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-black border border-amber-500/40 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-400 mb-1 flex items-center justify-between">
                      <span>Doors Time</span>
                      <span className="text-[10px] text-emerald-400/80">
                        {formatTimeToDisplay(doorsTime)}
                      </span>
                    </label>
                    <input
                      type="time"
                      value={doorsTime}
                      onChange={(e) => setDoorsTime(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-400 mb-1 flex items-center justify-between">
                      <span>Set Time</span>
                      <span className="text-[10px] text-emerald-400/80">
                        {formatTimeToDisplay(setTime)}
                      </span>
                    </label>
                    <input
                      type="time"
                      value={setTime}
                      onChange={(e) => setSetTime(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* 4. VENUE & LOCATION SECTION (WITH BLACK BOOK AUTOCOMPLETE) */}
              <div className="p-3.5 rounded-xl bg-[#0f131a]/90 border border-zinc-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Venue Name with Black Book Dropdown */}
                  <div className="sm:col-span-6 relative">
                    <div className="flex items-center justify-between mb-1 gap-1">
                      <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider">
                        Venue Name <span className="text-emerald-400">*</span>
                      </label>
                      {venueSource === 'matched-blackbook' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          Black Book {capacity ? `(${capacity} Cap)` : 'Matched'}
                        </span>
                      )}
                      {venueSource === 'auto-stubbed' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                          <MapPin className="w-2.5 h-2.5 text-amber-400" />
                          New Black Book Entry
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={venueName}
                      onFocus={() => setActiveAutocompleteField('single-venue')}
                      onBlur={() =>
                        setTimeout(() => {
                          setActiveAutocompleteField((prev) =>
                            prev === 'single-venue' ? null : prev
                          );
                        }, 180)
                      }
                      onChange={(e) => {
                        setVenueName(e.target.value);
                        setActiveAutocompleteField('single-venue');
                      }}
                      placeholder="e.g. Puzzles, The Rail Club, Trees"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                    {singleVenueSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#12161f] border border-emerald-500/40 rounded-xl shadow-2xl overflow-hidden divide-y divide-zinc-800/60">
                        {singleVenueSuggestions.map((v, idx) => (
                          <button
                            key={`ven-sug-${v.name}-${v.city}-${idx}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSingleVenueSuggestion(v);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-500/10 flex items-center justify-between gap-2 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-mono font-bold text-white truncate">
                                {v.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                              {[v.city, v.state].filter(Boolean).join(', ')}
                              {v.capacity ? ` • ${v.capacity} cap` : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div className="sm:col-span-4">
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      City <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Dallas, Austin"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  {/* State */}
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={stateProvince}
                      onChange={(e) => setStateProvince(e.target.value)}
                      placeholder="TX"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* 5. ADMISSION, PRICE PRESET CHIPS & TACTILE AGE PILLS */}
              <div className="p-3.5 rounded-xl bg-[#0f131a]/90 border border-zinc-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  {/* Day of Show Price + Quick Preset Chips */}
                  <div className="sm:col-span-5">
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Day of Show Price <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={dayOfShowPrice}
                      onChange={(e) => setDayOfShowPrice(e.target.value)}
                      placeholder="e.g. $25, Free, Cover at Door"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {PRICE_PRESETS.map((preset) => {
                        const isSelected =
                          dayOfShowPrice.trim().toLowerCase() === preset.toLowerCase();
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setDayOfShowPrice(preset)}
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] transition cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                                : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                            }`}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pre-Sale Price */}
                  <div className="sm:col-span-3">
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Pre-Sale (Opt.)
                    </label>
                    <input
                      type="text"
                      value={presalePrice}
                      onChange={(e) => setPresalePrice(e.target.value)}
                      placeholder="e.g. $20 adv"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  {/* Age Restriction Segmented Pills */}
                  <div className="sm:col-span-4">
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Age Policy
                    </label>
                    <div className="grid grid-cols-4 gap-1 bg-black p-1 rounded-lg border border-zinc-800">
                      {AGE_PRESETS.map((age) => {
                        const active = ageRestriction === age;
                        return (
                          <button
                            key={age}
                            type="button"
                            onClick={() => setAgeRestriction(age)}
                            className={`py-1.5 rounded-md font-mono text-[10px] font-bold transition cursor-pointer ${
                              active
                                ? 'bg-emerald-400 text-black shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {age}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* External Ticket URL */}
                <div className="pt-2 border-t border-zinc-800/60">
                  <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                    External Ticketing Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={externalTicketUrl}
                    onChange={(e) => setExternalTicketUrl(e.target.value)}
                    placeholder="https://dice.fm/event/... or https://ticketmaster.com/..."
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* 6. COLLAPSIBLE ADVANCED DETAILS & CUSTOM TICKET TIERS ACCORDION */}
              <div className="rounded-xl border border-zinc-800/80 bg-[#0d1017] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSingle((prev) => !prev)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-zinc-900/60 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                      Advanced Venue, Safety Policy & Custom Ticket Tiers
                    </span>
                    {advancedFieldsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                        {advancedFieldsCount} active
                      </span>
                    )}
                  </div>
                  {showAdvancedSingle ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </button>

                {showAdvancedSingle && (
                  <div className="p-4 pt-2 border-t border-zinc-800/80 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                          Street Address (Optional)
                        </label>
                        <input
                          type="text"
                          value={venueAddress}
                          onChange={(e) => setVenueAddress(e.target.value)}
                          placeholder="e.g. 2709 Elm St"
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                          Venue Capacity
                        </label>
                        <input
                          type="text"
                          value={capacity}
                          onChange={(e) => setCapacity(e.target.value)}
                          placeholder="e.g. 650"
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="United States"
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                        Safety Code / Door Policy (Optional)
                      </label>
                      <input
                        type="text"
                        value={safetyCode}
                        onChange={(e) => setSafetyCode(e.target.value)}
                        placeholder="e.g. Safe Space / Zero Tolerance / Bag Check at Door"
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    {/* Custom In-App Admission Tiers Builder */}
                    <CustomTicketTiersBuilder
                      tiers={ticketTiers}
                      onChange={setTicketTiers}
                      hasExternalUrl={Boolean(externalTicketUrl.trim())}
                      accentColor="emerald"
                    />
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-mono text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-lg font-mono text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-400/20"
                >
                  {editingShow ? 'Update Show Details' : 'Post Community Show'}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB B: TOUR DATES (BATCH MULTI-DATE) FORM                */}
          {/* ======================================================== */}
          {activeTab === 'tour' && (
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs space-y-4">
              {/* Mobile Pinned Poster Reference Bar (when user docks the poster on mobile) */}
              {isPosterPinnedMobile && tourFlyerUrl && (
                <div className="sticky top-0 z-30 p-2.5 rounded-xl bg-[#0b0e14]/95 backdrop-blur-md border border-emerald-500/40 shadow-2xl flex items-center gap-3">
                  <img
                    src={tourFlyerUrl}
                    alt="Pinned Tour Poster"
                    onClick={() => setLightboxImageUrl(tourFlyerUrl)}
                    className="w-16 h-20 object-contain bg-black rounded-lg border border-zinc-700 cursor-zoom-in shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                      <Pin className="w-3 h-3" />
                      <span>Tour Poster Pinned</span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      Tap poster to open full-screen pinch-to-zoom viewer anytime.
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setLightboxImageUrl(tourFlyerUrl)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold cursor-pointer"
                      >
                        Full Pinch-Zoom
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPosterPinnedMobile(false)}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] cursor-pointer"
                      >
                        Unpin
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tour Shared Details: Headliner, Support Bands, Tour Name */}
              <div className="p-4 rounded-xl bg-[#0f131a] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider">
                    <Music className="w-3.5 h-3.5" />
                    <span>Tour Package & Shared Lineup</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuickPasteOpen((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      isQuickPasteOpen
                        ? 'bg-emerald-400 text-black border-emerald-300'
                        : 'bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Quick-Paste Tour Dates</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tour Headliner with Autocomplete */}
                  <div className="relative">
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Headliner / Main Artist <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tourHeadliner}
                      onFocus={() => setActiveAutocompleteField('tour-headliner')}
                      onBlur={() =>
                        setTimeout(() => {
                          setActiveAutocompleteField((prev) =>
                            prev === 'tour-headliner' ? null : prev
                          );
                        }, 180)
                      }
                      onChange={(e) => {
                        setTourHeadliner(e.target.value);
                        setActiveAutocompleteField('tour-headliner');
                      }}
                      placeholder="e.g. Dying Fetus, Cannibal Corpse"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                    {tourHeadlinerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#12161f] border border-emerald-500/40 rounded-xl shadow-2xl overflow-hidden divide-y divide-zinc-800/60">
                        {tourHeadlinerSuggestions.map((b, idx) => (
                          <button
                            key={`thl-sug-${b.name}-${idx}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setTourHeadliner(b.name);
                              setActiveAutocompleteField(null);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-500/10 flex items-center justify-between gap-2 transition cursor-pointer"
                          >
                            <span className="font-mono font-bold text-white truncate">
                              {b.name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 truncate">
                              {b.genre || b.location || 'Band Hub'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Tour Package Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={tourPackageName}
                      onChange={(e) => setTourPackageName(e.target.value)}
                      placeholder="e.g. U.S. Tour 2027"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Shared Support Bands with Autocomplete, Comma Paste & Reordering */}
                <div className="relative">
                  <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                    Support Bands (Shared Across All Tour Stops)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newTourSupportInput}
                        onFocus={() => setActiveAutocompleteField('tour-support')}
                        onBlur={() =>
                          setTimeout(() => {
                            setActiveAutocompleteField((prev) =>
                              prev === 'tour-support' ? null : prev
                            );
                          }, 180)
                        }
                        onChange={(e) => {
                          setNewTourSupportInput(e.target.value);
                          setActiveAutocompleteField('tour-support');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTourSupportBand();
                          }
                        }}
                        placeholder="Type or comma-paste package bands (e.g. Cryptopsy, Gorgasm)"
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                      />
                      {tourSupportSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#12161f] border border-emerald-500/40 rounded-xl shadow-2xl overflow-hidden divide-y divide-zinc-800/60">
                          {tourSupportSuggestions.map((b, idx) => (
                            <button
                              key={`tsup-sug-${b.name}-${idx}`}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddTourSupportBand(b.name);
                                setActiveAutocompleteField(null);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-emerald-500/10 flex items-center justify-between gap-2 transition cursor-pointer"
                            >
                              <span className="font-mono font-bold text-white truncate">
                                {b.name}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400">
                                + Add to Tour
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddTourSupportBand()}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-mono text-xs flex items-center gap-1 cursor-pointer transition border border-zinc-700"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Add</span>
                    </button>
                  </div>

                  {tourSupportBands.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tourSupportBands.map((band, idx) => (
                        <span
                          key={`tour-sup-${band}-${idx}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 border border-zinc-800 text-zinc-200 font-mono text-[11px]"
                        >
                          <span className="text-[9px] text-emerald-400/80 font-bold">
                            #{idx + 1}
                          </span>
                          <span>{band}</span>
                          {tourSupportBands.length > 1 && (
                            <span className="inline-flex items-center gap-0.5 ml-0.5 border-l border-zinc-800 pl-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveBandInList(idx, -1, setTourSupportBands)}
                                className="text-zinc-500 hover:text-emerald-400 disabled:opacity-25 cursor-pointer"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === tourSupportBands.length - 1}
                                onClick={() => moveBandInList(idx, 1, setTourSupportBands)}
                                className="text-zinc-500 hover:text-emerald-400 disabled:opacity-25 cursor-pointer"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveTourSupportBand(idx)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Collapsible Quick-Paste Tour Routing Parser */}
                {isQuickPasteOpen && (
                  <div className="p-3.5 rounded-xl bg-black/80 border border-emerald-500/40 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-mono font-bold text-xs">
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Quick-Paste Tour Routing Parser</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-400">Default Year:</span>
                        <select
                          value={quickPasteYear}
                          onChange={(e) => setQuickPasteYear(Number(e.target.value))}
                          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-[11px] font-mono text-emerald-300 outline-none"
                        >
                          {[2026, 2027, 2028].map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                      Paste raw tour dates below (one stop per line). Supports formats like{' '}
                      <code className="text-emerald-300">
                        2/11 Washington, DC - Pearl Street Warehouse
                      </code>{' '}
                      or <code className="text-emerald-300">Mar 9 Dallas, TX @ Puzzles</code>.
                    </p>
                    <textarea
                      rows={5}
                      value={quickPasteText}
                      onChange={(e) => setQuickPasteText(e.target.value)}
                      placeholder={`2/11 Washington, DC - Pearl Street Warehouse\n2/12 Baltimore, MD - Metro\n3/09 Dallas, TX - Puzzles\n3/10 Austin, TX - Brushy Street Commons`}
                      className="w-full bg-[#090b10] border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsQuickPasteOpen(false)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-[11px] cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={handleParseQuickPasteStops}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-mono font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Parse & Add Tour Stops</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Responsive Layout: Tour Poster Drop/Viewer + Tour Stops Entry */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Left / Top: Tour Poster Dropzone & Full-Size Pinch-to-Zoom Trigger */}
                <div className="md:col-span-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-zinc-300 uppercase tracking-wider font-bold">
                      Tour Poster Reference
                    </span>
                    {tourFlyerUrl && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPosterPinnedMobile((prev) => !prev)}
                          className={`md:hidden text-[10px] font-mono flex items-center gap-1 px-2 py-0.5 rounded border cursor-pointer ${
                            isPosterPinnedMobile
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <Pin className="w-2.5 h-2.5" />
                          <span>{isPosterPinnedMobile ? 'Pinned' : 'Pin Top'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLightboxImageUrl(tourFlyerUrl)}
                          className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3" />
                          <span>Pinch-Zoom</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingTourFlyer(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingTourFlyer(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingTourFlyer(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        processImageFile(file, (url) => setTourFlyerUrl(url));
                      }
                    }}
                    onClick={() => {
                      if (tourFlyerUrl) {
                        setLightboxImageUrl(tourFlyerUrl);
                      } else {
                        tourFlyerInputRef.current?.click();
                      }
                    }}
                    className={`rounded-xl text-center border-2 border-dashed transition cursor-pointer relative overflow-hidden flex flex-col items-center justify-center ${
                      isDraggingTourFlyer
                        ? 'bg-emerald-950/40 border-emerald-400'
                        : tourFlyerUrl
                        ? 'bg-neutral-950 border-neutral-700 hover:border-emerald-500/50'
                        : 'bg-neutral-900/40 border-neutral-700 hover:border-emerald-500/50 p-6'
                    }`}
                    style={{ minHeight: tourFlyerUrl ? '320px' : '180px' }}
                  >
                    {tourFlyerUrl ? (
                      <div className="relative w-full h-full flex flex-col group">
                        <img
                          src={tourFlyerUrl}
                          alt="Tour Poster"
                          className="w-full h-80 object-contain bg-black rounded-lg"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black via-black/85 to-transparent flex items-center justify-between">
                          <span className="text-[10px] font-mono text-emerald-400 truncate">
                            Attached to all {tourStops.length} stops
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImageUrl(tourFlyerUrl);
                              }}
                              className="px-2 py-0.5 bg-black/80 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono hover:bg-emerald-950 cursor-pointer"
                            >
                              Zoom
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                tourFlyerInputRef.current?.click();
                              }}
                              className="px-2 py-0.5 bg-black/80 text-zinc-300 border border-zinc-700 rounded text-[10px] font-mono hover:bg-zinc-800 cursor-pointer"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTourFlyerUrl('');
                              }}
                              className="px-2 py-0.5 bg-black/80 text-rose-400 border border-rose-500/30 rounded text-[10px] font-mono hover:bg-rose-950 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center p-4">
                        <Upload className="w-6 h-6 text-emerald-400 mb-1.5" />
                        <span className="text-xs font-semibold text-emerald-300 font-mono">
                          Drop Tour Poster Here
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-1 font-mono text-center">
                          Upload poster to preview tour stops & dates side-by-side with pinch-to-zoom
                        </span>
                      </div>
                    )}
                    <input
                      ref={tourFlyerInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file, (url) => setTourFlyerUrl(url));
                      }}
                    />
                  </div>
                </div>

                {/* Right / Bottom: Tour Stops Inline Adder + List */}
                <div className="md:col-span-7 space-y-3">
                  {/* Inline Tour Stop Creator */}
                  <div className="p-3.5 rounded-xl bg-[#0f131a] border border-emerald-500/30 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Tour Stop</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Date auto-advances +1 day after adding each stop
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block font-mono text-[10px] text-zinc-400">
                            Start Date <span className="text-emerald-400">*</span>
                          </label>
                          {stopDate && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setStopDate(addDaysToIsoDate(stopDate, 1))}
                                className="px-1.5 py-0.2 rounded bg-zinc-800 hover:bg-emerald-950 text-[9px] font-mono text-emerald-300 border border-zinc-700 cursor-pointer"
                                title="Advance date by 1 day"
                              >
                                +1d
                              </button>
                              <button
                                type="button"
                                onClick={() => setStopDate(addDaysToIsoDate(stopDate, 2))}
                                className="px-1.5 py-0.2 rounded bg-zinc-800 hover:bg-emerald-950 text-[9px] font-mono text-emerald-300 border border-zinc-700 cursor-pointer"
                                title="Advance date by 2 days"
                              >
                                +2d
                              </button>
                            </div>
                          )}
                        </div>
                        <input
                          type="date"
                          value={stopDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStopDate(val);
                            if (stopEndDate && val && stopEndDate < val) setStopEndDate(val);
                          }}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-zinc-400 mb-0.5">
                          End Date <span className="text-zinc-500">(Fest Opt.)</span>
                        </label>
                        <input
                          type="date"
                          min={stopDate || undefined}
                          value={stopEndDate}
                          onChange={(e) => setStopEndDate(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-400 outline-none"
                        />
                      </div>
                      <div className="relative">
                        <label className="block font-mono text-[10px] text-zinc-400 mb-0.5">
                          Venue Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Puzzles, Reggies"
                          value={stopVenue}
                          onFocus={() => setActiveAutocompleteField('tour-venue')}
                          onBlur={() =>
                            setTimeout(() => {
                              setActiveAutocompleteField((prev) =>
                                prev === 'tour-venue' ? null : prev
                              );
                            }, 180)
                          }
                          onChange={(e) => {
                            setStopVenue(e.target.value);
                            setActiveAutocompleteField('tour-venue');
                          }}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                        />
                        {tourVenueSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#12161f] border border-emerald-500/40 rounded-xl shadow-2xl overflow-hidden divide-y divide-zinc-800/60">
                            {tourVenueSuggestions.map((v, idx) => (
                              <button
                                key={`tven-sug-${v.name}-${v.city}-${idx}`}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectTourStopVenueSuggestion(v);
                                }}
                                className="w-full px-2.5 py-1.5 text-left hover:bg-emerald-500/10 flex items-center justify-between gap-2 transition cursor-pointer"
                              >
                                <span className="font-mono font-bold text-white truncate">
                                  {v.name}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                                  {[v.city, v.state].filter(Boolean).join(', ')}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block font-mono text-[10px] text-zinc-400 mb-0.5">
                          City <span className="text-emerald-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dallas, Chicago"
                          value={stopCity}
                          onChange={(e) => setStopCity(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTourStop();
                            }
                          }}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-zinc-400 mb-0.5">
                          State / Prov
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. TX, IL"
                          value={stopState}
                          onChange={(e) => setStopState(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTourStop();
                            }
                          }}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="url"
                        placeholder="Ticket URL (Optional)"
                        value={stopTicketUrl}
                        onChange={(e) => setStopTicketUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTourStop();
                          }
                        }}
                        className="flex-1 bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddTourStop}
                        className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold font-mono text-xs rounded transition cursor-pointer shrink-0"
                      >
                        + Add Stop
                      </button>
                    </div>

                    {stopDate &&
                      isShowPastOrEnded({
                        date: stopDate,
                        end_date: stopEndDate || undefined,
                      }) && (
                        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 font-mono text-[10px]">
                          <span>
                            Selected date ({stopDate}) is in the past and will be filed as an
                            archived show.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextYearDate = shiftIsoDateYear(stopDate, 1);
                              setStopDate(nextYearDate);
                              if (stopEndDate)
                                setStopEndDate(shiftIsoDateYear(stopEndDate, 1));
                            }}
                            className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-black font-bold shrink-0 cursor-pointer"
                          >
                            Use {shiftIsoDateYear(stopDate, 1)}
                          </button>
                        </div>
                      )}
                  </div>

                  {/* List of Added Tour Stops */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          Tour Stops
                        </span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                          {tourStops.length} Total
                        </span>
                      </div>
                      {tourStops.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTourStops([])}
                          className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {(() => {
                      const pastCount = tourStops.filter((s) =>
                        isShowPastOrEnded({ date: s.show_date, end_date: s.end_date })
                      ).length;
                      if (pastCount === 0) return null;
                      return (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-950/50 border border-amber-500/50 text-amber-200 font-mono text-[11px]">
                          <span>
                            {pastCount} tour {pastCount === 1 ? 'stop has' : 'stops have'} a past
                            date (check year) and will show under Past Shows.
                          </span>
                          <button
                            type="button"
                            onClick={handleShiftAllPastStopsNextYear}
                            className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] shrink-0 cursor-pointer"
                          >
                            Shift Past Stops +1 Year
                          </button>
                        </div>
                      );
                    })()}

                    {tourStops.length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500 font-mono text-xs space-y-1.5">
                        <div>
                          No tour stops added yet. Use the form above or click{' '}
                          <button
                            type="button"
                            onClick={() => setIsQuickPasteOpen(true)}
                            className="text-emerald-400 underline cursor-pointer"
                          >
                            Quick-Paste Tour Dates
                          </button>{' '}
                          to import a full routing list at once.
                        </div>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                        {tourStops.map((stop, idx) => {
                          const isStopPast = isShowPastOrEnded({
                            date: stop.show_date,
                            end_date: stop.end_date,
                          });
                          return (
                            <div
                              key={stop.id}
                              className={`p-2 rounded-lg bg-black/60 border flex items-center justify-between gap-2 transition ${
                                isStopPast
                                  ? 'border-amber-500/50 bg-amber-950/20'
                                  : 'border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 font-mono flex-1">
                                <span className="text-[10px] text-zinc-500 shrink-0 font-bold w-5">
                                  #{idx + 1}
                                </span>
                                <input
                                  type="date"
                                  value={stop.show_date}
                                  onChange={(e) =>
                                    handleUpdateTourStopDate(stop.id, e.target.value)
                                  }
                                  aria-label={`Date for stop ${idx + 1}`}
                                  className={`bg-zinc-950 border rounded px-1.5 py-0.5 text-[11px] font-bold font-mono shrink-0 outline-none ${
                                    isStopPast
                                      ? 'border-amber-500/60 text-amber-300'
                                      : 'border-zinc-800 text-emerald-400 focus:border-emerald-400'
                                  }`}
                                />
                                {stop.end_date && stop.end_date > stop.show_date && (
                                  <span className="text-[10px] text-amber-300 shrink-0">
                                    – {stop.end_date}
                                  </span>
                                )}
                                <span className="text-zinc-200 font-semibold truncate">
                                  {stop.city}
                                  {stop.state ? `, ${stop.state}` : ''}
                                </span>
                                <span className="text-zinc-400 truncate">
                                  @ {stop.venue_name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isStopPast && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateTourStopDate(
                                        stop.id,
                                        shiftIsoDateYear(stop.show_date, 1)
                                      )
                                    }
                                    className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-400 hover:text-black border border-amber-500/50 text-amber-300 font-mono font-bold text-[10px] cursor-pointer"
                                    title="Shift year forward by 1 year"
                                  >
                                    +1 Yr
                                  </button>
                                )}
                                {stop.ticket_url && (
                                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTourStop(stop.id)}
                                  className="text-zinc-500 hover:text-rose-400 p-1 transition cursor-pointer"
                                  title="Remove stop"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Batch Actions Footer */}
              <div className="pt-3 flex items-center justify-between border-t border-zinc-800 flex-wrap gap-2">
                <p className="text-[11px] text-zinc-400 font-mono">
                  {tourStops.length > 0
                    ? `Will generate ${tourStops.length} separate community show pages that can each be edited individually.`
                    : 'Add or paste tour dates to generate separate community events.'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-mono text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchCreateTour}
                    disabled={
                      isBatchCreating || tourStops.length === 0 || !tourHeadliner.trim()
                    }
                    className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg font-mono text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-400/20 flex items-center gap-2"
                  >
                    <span>
                      {isBatchCreating
                        ? 'Creating Events...'
                        : `Save & Create All (${tourStops.length}) Events`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Full-Resolution Pinch-to-Zoom Lightbox Modal */}
          <PhotoLightboxModal
            previewImage={lightboxImageUrl}
            setPreviewImage={setLightboxImageUrl}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateCommunityShowModal;
