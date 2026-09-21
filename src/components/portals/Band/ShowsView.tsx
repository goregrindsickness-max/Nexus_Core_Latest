import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Check, 
  DollarSign, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X, 
  Sparkles, 
  RefreshCw, 
  Globe,
  Music,
  CheckCircle,
  XCircle,
  Sun,
  CloudSun,
  Wind,
  Thermometer,
  Milestone,
  FileText,
  Edit,
  AlertTriangle,
  Save,
  Route,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Cloud,
  MessageSquare,
  Send,
  Unlink,
  Share2,
  Key,
  Settings
} from 'lucide-react';

export interface ShowWeatherWarning {
  type: 'STORM' | 'COLD' | 'HEAT' | 'WIND' | 'INFO';
  severity: 'SEVERE' | 'WARNING' | 'ADVISORY' | 'INFO';
  title: string;
  description: string;
  color: string;
  badgeColor: string;
}

export interface ShowWeather {
  temp: number;
  conditions: string;
  windSpeed: number;
  humidity: number;
  isOutdoor: boolean;
  warnings: ShowWeatherWarning[];
}

export const getShowWeatherAndWarnings = (show: Show): ShowWeather => {
  const city = show.city || show.name || "Fort Wayne";
  const showName = (show.festival_name || show.name || '').toLowerCase();
  const showType = (show.show_type || '').toLowerCase();
  const isOutdoor = !!show.festival_name || 
                     showName.includes('festival') || 
                     showName.includes('fest') || 
                     showName.includes('park') || 
                     showName.includes('lawn') || 
                     showName.includes('stadium') || 
                     showName.includes('field') || 
                     showName.includes('amphitheater') || 
                     showName.includes('fair') || 
                     showName.includes('outdoor') || 
                     showName.includes('riot');

  // Deterministic seed based on city name + show ID/date to make each stop's weather unique but persistent
  const seedString = `${city}-${show.date || '2026-07-03'}-${show.id || ''}`;
  const sum = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Parse date month to adjust temperature for winter/summer
  let month = 6; // default June
  if (show.date) {
    const parts = show.date.split('-');
    if (parts.length >= 2) {
      month = parseInt(parts[1], 10);
    }
  }

  // Base temperature depending on month
  // Winter months: Nov (11), Dec (12), Jan (1), Feb (2), Mar (3)
  // Summer months: Jun (6), Jul (7), Aug (8)
  let baseTemp = 65;
  if ([11, 12, 1, 2].includes(month)) {
    baseTemp = 24 + (sum % 18); // 24°F to 42°F
  } else if ([6, 7, 8].includes(month)) {
    baseTemp = 75 + (sum % 20); // 75°F to 95°F
  } else {
    baseTemp = 48 + (sum % 22); // 48°F to 70°F
  }

  // We can select weather conditions deterministically
  let conditions = 'Partly Cloudy';
  let windSpeed = 4 + (sum % 18); // 4 to 22 mph
  let humidity = 40 + (sum % 50); // 40% to 90%

  const conditionPools = {
    winter: ['Heavy Snow', 'Blizzard Conditions', 'Freezing Rain', 'Overcast', 'Clear & Freezing', 'Chilly Wind'],
    summer: ['Sunny & Clear', 'Extreme Heat Warning', 'Severe Thunderstorms', 'Passing Showers', 'Humid & Overcast', 'Breezy & Sunny'],
    normal: ['Partly Cloudy', 'Sunny & Warm', 'Clear Skies', 'Mild & Overcast', 'Breezy & Cool', 'Steady Rain']
  };

  if ([11, 12, 1, 2].includes(month)) {
    conditions = conditionPools.winter[sum % conditionPools.winter.length];
  } else if ([6, 7, 8].includes(month)) {
    conditions = conditionPools.summer[sum % conditionPools.summer.length];
  } else {
    conditions = conditionPools.normal[sum % conditionPools.normal.length];
  }

  const warnings: ShowWeatherWarning[] = [];

  // 1. Extreme Winter Cold / Blizzard Warning
  if (baseTemp < 32 && (conditions.toLowerCase().includes('snow') || conditions.toLowerCase().includes('blizzard') || conditions.toLowerCase().includes('freezing'))) {
    warnings.push({
      type: 'COLD',
      severity: 'SEVERE',
      title: '❄️ Blizzard & Ice Hazard Warning',
      description: 'Severe travel risk for tour bus and equipment semi-trailers. Protect water systems and gear from sub-freezing temperatures.',
      color: 'border-red-500/30 bg-red-950/20 text-red-400',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40'
    });
  } else if (baseTemp < 38) {
    warnings.push({
      type: 'COLD',
      severity: 'WARNING',
      title: '🥶 Extreme Winter Cold Advisory',
      description: 'Temperatures below freezing. Road freeze risk during overnight hauls. Monitor trailer heater status and load-in freeze alerts.',
      color: 'border-blue-500/30 bg-blue-950/20 text-blue-400',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40'
    });
  }

  // 2. High Wind Warning
  if (windSpeed > 15) {
    if (isOutdoor) {
      warnings.push({
        type: 'WIND',
        severity: 'SEVERE',
        title: '💨 Severe Gale Stage Hazard',
        description: `High winds of ${windSpeed}mph forecast. Extreme safety risk for outdoor festival stage canvas, banner rigging, and line-array PA hangs. Secure all loose hardware!`,
        color: 'border-amber-500/30 bg-amber-950/20 text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      });
    } else {
      warnings.push({
        type: 'WIND',
        severity: 'ADVISORY',
        title: '🌬️ High Wind Advisory',
        description: `Wind gusts up to ${windSpeed}mph. Potential trailer sway on open interstate routes. Exercise caution while driving.`,
        color: 'border-zinc-500/30 bg-zinc-950/20 text-zinc-400',
        badgeColor: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40'
      });
    }
  }

  // 3. Severe Storms & Lightning Warning
  if (conditions.toLowerCase().includes('thunderstorms') || conditions.toLowerCase().includes('rain') || conditions.toLowerCase().includes('storm')) {
    if (isOutdoor) {
      warnings.push({
        type: 'STORM',
        severity: 'SEVERE',
        title: '⛈️ Lightning & Heavy Storm Danger',
        description: 'Severe thunderstorm threat. Outdoor event risk. Prepare stage evacuation protocols and line-array power isolation checklists.',
        color: 'border-red-500/30 bg-red-950/20 text-red-400 font-bold',
        badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40'
      });
    } else {
      warnings.push({
        type: 'STORM',
        severity: 'WARNING',
        title: '🌧️ Heavy Rain Warning',
        description: 'Flooding risk in local low-lying venue entrance/load-in zones. Expect loading dock delay. Keep sensitive cables off ground.',
        color: 'border-amber-500/30 bg-amber-950/20 text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      });
    }
  }

  // 4. Heat Warnings
  if (baseTemp > 88) {
    warnings.push({
      type: 'HEAT',
      severity: 'WARNING',
      title: '🔥 Extreme Heat Advisory',
      description: `High temp of ${baseTemp}°F. Outdoor stage thermal load alert: protect amplifiers and lighting ballasts from overheating. Crew hydration priority.`,
      color: 'border-orange-500/30 bg-orange-950/20 text-orange-400',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40'
    });
  }

  // 5. Outdoor Venue general notices
  if (isOutdoor && warnings.length === 0) {
    warnings.push({
      type: 'INFO',
      severity: 'INFO',
      title: '🎪 Outdoor Venue Operational Standard',
      description: 'Outdoor setting. Keep stage power distribution cables covered. Monitor hourly weather radar changes for wind or rain shifts.',
      color: 'border-[#00ffcc]/20 bg-[#00ffcc]/5 text-zinc-300',
      badgeColor: 'bg-[#00ffcc]/10 text-[#00ffcc] border-[#00ffcc]/30'
    });
  }

  return {
    temp: baseTemp,
    conditions,
    windSpeed,
    humidity,
    isOutdoor,
    warnings
  };
};
import { Show, Sale } from '../../../types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getSupabase, sanitizeShowForDb, ensureValidSupabaseAuthSession } from '../../../supabase';
import { requestLocationPermission } from '../../../services/locationService';
import ShowFormModal from './ShowFormModal';
import ShowExpandedView from './ShowExpandedView';
import DaySheetPrintView from './DaySheetPrintView';
import { FieldIntel } from './FieldIntel';
import CoOpRouteStagingView from './CoOpRouteStagingView';
import PostShowReview from './PostShowReview';

const concertBg = "https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/High%20energy%20concert%202.png";
const darkMapAsset = "https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Dark%20World%20Map.png";

// Read Mapbox keys dynamically from client env settings or local storage fallback for APK compatibility
export const getResolvedMapboxToken = (): string => {
  const envs = (import.meta as any).env || {};
  if (envs.VITE_MAPBOX_ACCESS_TOKEN && typeof envs.VITE_MAPBOX_ACCESS_TOKEN === 'string' && envs.VITE_MAPBOX_ACCESS_TOKEN.trim() !== '') {
    return envs.VITE_MAPBOX_ACCESS_TOKEN.trim();
  }
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('nexus_mapbox_token') || localStorage.getItem('VITE_MAPBOX_ACCESS_TOKEN') || localStorage.getItem('mapbox_token');
    if (local && local.trim() !== '') return local.trim();
    if ((window as any).__MAPBOX_TOKEN__) return (window as any).__MAPBOX_TOKEN__;
  }
  return '';
};
const mapboxStyleUrl = 'mapbox://styles/mapbox/dark-v11'; // High performance dark theme

interface ShowsViewProps {
  shows: Show[];
  setShows: React.Dispatch<React.SetStateAction<Show[]>>;
  sales: Sale[];
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  setModalType: React.Dispatch<React.SetStateAction<'sale' | 'show' | 'note' | null>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onBack: () => void;
  bandName?: string;
  activeBandId?: string;
  initialOpenForm?: boolean;
  onCloseForm?: () => void;
  inventory?: any[];
  initialExpandedShowId?: string | null;
  onClearInitialExpandedShowId?: () => void;
  initialSettlementShowId?: string | null;
  onClearInitialSettlementShowId?: () => void;
  offers?: any[];
  onAcceptOffer?: (offerId: string) => void;
  onDeclineOffer?: (offerId: string) => void;
  onRenegotiateOffer?: (offerId: string, extraNotes: string, targetGuarantee: number) => void;
  onBlockPromoter?: (offerId: string) => void;
  onUpdateOffer?: (offer: any) => void;
  onOpenOnRouteEssentials?: (address: string) => void;
  isOffline?: boolean;
  hideBackButton?: boolean;
  onlyMap?: boolean;
  hideMap?: boolean;
  disableScrollToTop?: boolean;
  activeClearanceLevel?: number;
}

// Map helper to map common cities / venues to SVG coordinates (0 - 800 width, 0 - 450 height)
const CITY_COORDINATES: Record<string, { x: number; y: number; label: string }> = {
  'Denison': { x: 395, y: 325, label: 'Denison, TX' },
  'LA': { x: 120, y: 310, label: 'Los Angeles' },
  'SF': { x: 80, y: 240, label: 'San Francisco' },
  'TX': { x: 380, y: 360, label: 'Austin/Texas' },
  'IL': { x: 540, y: 155, label: 'Chicago' },
  'WI': { x: 530, y: 130, label: 'Cudahy/WI' },
  'IN': { x: 560, y: 170, label: 'Fort Wayne/IN' },
  'CO': { x: 280, y: 210, label: 'Denver' },
  'MI': { x: 590, y: 150, label: 'Detroit' },
  'NY': { x: 710, y: 140, label: 'New York' },
  'Seattle': { x: 100, y: 70, label: 'Seattle' },
  'Portland': { x: 95, y: 100, label: 'Portland' }
};

// Map helper to map common cities/venues to precise global GIS Geo Coordinate pairs [lng, lat]
const CITY_GEOLOCATIONS: Record<string, { lng: number; lat: number; label: string }> = {
  'Denison': { lng: -96.5367, lat: 33.7557, label: 'Denison, TX, USA' },
  'LA': { lng: -118.2437, lat: 34.0522, label: 'Los Angeles, USA' },
  'SF': { lng: -122.4194, lat: 37.7749, label: 'San Francisco, USA' },
  'Texas': { lng: -97.7431, lat: 30.2672, label: 'Austin, TX, USA' },
  'Austin': { lng: -97.7431, lat: 30.2672, label: 'Austin, TX, USA' },
  'TX': { lng: -97.7431, lat: 30.2672, label: 'Austin, TX, USA' },
  'Chicago': { lng: -87.6298, lat: 41.8781, label: 'Chicago, IL, USA' },
  'IL': { lng: -87.6298, lat: 41.8781, label: 'Chicago, IL, USA' },
  'WI': { lng: -87.8612, lat: 42.9556, label: 'Cudahy, WI, USA' },
  'Cudahy': { lng: -87.8612, lat: 42.9556, label: 'Cudahy, WI, USA' },
  'IN': { lng: -85.1394, lat: 41.0793, label: 'Fort Wayne, IN, USA' },
  'Fort Wayne': { lng: -85.1394, lat: 41.0793, label: 'Fort Wayne, IN, USA' },
  'CO': { lng: -104.9903, lat: 39.7392, label: 'Denver, CO, USA' },
  'Denver': { lng: -104.9903, lat: 39.7392, label: 'Denver, CO, USA' },
  'MI': { lng: -83.0458, lat: 42.3314, label: 'Detroit, MI, USA' },
  'Detroit': { lng: -83.0458, lat: 42.3314, label: 'Detroit, MI, USA' },
  'NY': { lng: -74.0060, lat: 40.7128, label: 'New York, NY, USA' },
  'New York': { lng: -74.0060, lat: 40.7128, label: 'New York, NY, USA' },
  'Seattle': { lng: -122.3321, lat: 47.6062, label: 'Seattle, WA, USA' },
  'Portland': { lng: -122.6765, lat: 45.5231, label: 'Portland, OR, USA' },
  
  // International tour stops
  'London': { lng: -0.1278, lat: 51.5074, label: 'London, UK' },
  'Paris': { lng: 2.3522, lat: 48.8566, label: 'Paris, FR' },
  'Berlin': { lng: 13.4050, lat: 52.5200, label: 'Berlin, DE' },
  'Tokyo': { lng: 139.6503, lat: 35.6762, label: 'Tokyo, JP' },
  'Sydney': { lng: 151.2093, lat: -33.8688, label: 'Sydney, AU' },
  'Toronto': { lng: -79.3832, lat: 43.6532, label: 'Toronto, CA' },
  'Montreal': { lng: -73.5673, lat: 45.5017, label: 'Montreal, CA' },
  'Vancouver': { lng: -123.1207, lat: 49.2827, label: 'Vancouver, CA' },
  'Mumbai': { lng: 72.8777, lat: 19.0760, label: 'Mumbai, IN' },
  'Rio': { lng: -43.1729, lat: -22.9068, label: 'Rio de Janeiro, BR' },
  'Mexico City': { lng: -99.1332, lat: 19.4326, label: 'Mexico City, MX' },
  'Melbourne': { lng: 144.9631, lat: -37.8136, label: 'Melbourne, AU' },
  'Amsterdam': { lng: 4.8952, lat: 52.3702, label: 'Amsterdam, NL' }
};

// Generative procedural coord helper so custom or international entries are DETERMINISTICALLY mapped 
function getProceduralLatLng(str: string): { lng: number; lat: number } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generates lng between -120 and -75 (North America focus by default instead of positive / African longitudes!)
  const l = -120 + (Math.abs(hash) % 45);
  // Generates lat between 28 and 48 
  const t = 28 + (Math.abs(hash >> 3) % 20);
  return { lng: l, lat: t };
}

function findShowGeoLocation(show: Show): { lng: number; lat: number } {
  // First priority: check if show.venue_lat and show.venue_lng are provided
  if (typeof show.venue_lat === 'number' && typeof show.venue_lng === 'number' && show.venue_lat !== 0 && show.venue_lng !== 0) {
    return { lng: show.venue_lng, lat: show.venue_lat };
  }

  // Combine venue details to ensure robust query matching
  const textElements = [
    show.festival_name,
    show.name,
    show.city,
    show.state_province,
    show.country
  ].filter(Boolean);

  const text = textElements.join(' ').toLowerCase();

  for (const [key, geo] of Object.entries(CITY_GEOLOCATIONS)) {
    if (text.includes(key.toLowerCase())) {
      return { lng: geo.lng, lat: geo.lat };
    }
  }
  
  // Look for any raw coordinates in double format e.g. "45.10,-75.30"
  const geoMatch = show.name.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (geoMatch) {
    const parsedLat = parseFloat(geoMatch[1]);
    const parsedLng = parseFloat(geoMatch[2]);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      return { lng: parsedLng, lat: parsedLat };
    }
  }

  return getProceduralLatLng(show.name || show.id);
}

const getShowTypeDetails = (stop: Show) => {
  const type = stop.show_type || (stop.festival_name ? 'festival' : 'headliner');
  switch (type) {
    case 'festival':
      return {
        label: 'Festival',
        borderColor: 'border-teal-500/25',
        activeBorderColor: 'border-teal-400',
        bgColor: 'bg-teal-950/10',
        textColor: 'text-teal-400',
        badgeBg: 'bg-teal-450/10 text-[#00ffcc] border-teal-500/30'
      };
    case 'headliner':
      return {
        label: 'Headliner',
        borderColor: 'border-rose-500/25',
        activeBorderColor: 'border-rose-500',
        bgColor: 'bg-rose-950/10',
        textColor: 'text-rose-400',
        badgeBg: 'bg-rose-450/10 text-rose-300 border-rose-500/30'
      };
    case 'support':
      return {
        label: 'Support Set',
        borderColor: 'border-indigo-500/25',
        activeBorderColor: 'border-indigo-550',
        bgColor: 'bg-indigo-950/10',
        textColor: 'text-indigo-400',
        badgeBg: 'bg-indigo-455/10 text-indigo-300 border-indigo-500/30'
      };
    case 'tour date':
      return {
        label: 'Tour Stop',
        borderColor: 'border-amber-500/25',
        activeBorderColor: 'border-amber-500',
        bgColor: 'bg-amber-950/5',
        textColor: 'text-amber-450',
        badgeBg: 'bg-amber-455/10 text-amber-300 border-amber-550/30'
      };
    case 'one-off':
    default:
      return {
        label: 'One-off Special',
        borderColor: 'border-zinc-700/30',
        activeBorderColor: 'border-zinc-200',
        bgColor: 'bg-zinc-950/10',
        textColor: 'text-zinc-300',
        badgeBg: 'bg-zinc-700/20 text-zinc-300 border-zinc-650/30'
      };
  }
};

function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the Earth in miles
  const rlat1 = lat1 * (Math.PI / 180);
  const rlat2 = lat2 * (Math.PI / 180);
  const difflat = rlat2 - rlat1;
  const difflon = (lon2 - lon1) * (Math.PI / 180);

  const d =
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
          Math.cos(rlat1) *
            Math.cos(rlat2) *
            Math.sin(difflon / 2) *
            Math.sin(difflon / 2)
      )
    );
  return d;
}

export default function ShowsView({
  shows,
  setShows,
  sales,
  triggerNotification,
  addLog,
  setModalType,
  setIsModalOpen,
  onBack,
  bandName,
  activeBandId,
  initialOpenForm = false,
  onCloseForm,
  inventory = [],
  initialExpandedShowId,
  onClearInitialExpandedShowId,
  initialSettlementShowId,
  onClearInitialSettlementShowId,
  offers = [],
  onAcceptOffer,
  onDeclineOffer,
  onRenegotiateOffer,
  onBlockPromoter,
  onUpdateOffer,
  onOpenOnRouteEssentials,
  isOffline = false,
  hideBackButton = false,
  onlyMap = false,
  hideMap = false,
  disableScrollToTop = false,
  activeClearanceLevel = 5
}: ShowsViewProps) {
  // Direct Offers local panel toggle & renegotiation states
  const [localRenegotiateId, setLocalRenegotiateId] = useState<string | null>(null);
  const [counterGuarantee, setCounterGuarantee] = useState<string>('');
  const [counterNotes, setCounterNotes] = useState<string>('');
  const [isOffersPanelExpanded, setIsOffersPanelExpanded] = useState(false);
  const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>({});
  const [offerFilter, setOfferFilter] = useState<'all' | 'pending' | 'accepted' | 'renegotiating'>('all');
  const [reRequestPanel, setReRequestPanel] = useState<Record<string, boolean>>({});

  // Navigation & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'upcoming' | 'past' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'revenue'>('date');
  
  // Interactive Map and Calendar selections
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [expandedShowId, setExpandedShowId] = useState<string | null>(null);
  const [expandedShowCards, setExpandedShowCards] = useState<Record<string, boolean>>({});
  const [isCoOpStagingActive, setIsCoOpStagingActive] = useState(false);
  const [showPitWallId, setShowPitWallId] = useState<string | null>(null);
  const [pitWallMessages, setPitWallMessages] = useState<Record<string, {id: string, user: string, text: string, time: string}[]>>({});
  const [newPitWallMessage, setNewPitWallMessage] = useState('');

  const toggleShowCardExpanded = (id: string) => {
    setExpandedShowCards(prev => {
      const current = prev[id] !== undefined ? prev[id] : (id === selectedShowId);
      return {
        ...prev,
        [id]: !current
      };
    });
  };
  
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date()); // Dynamic current date
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Dynamic selected date preset to today

  // State for inline Show editor modal
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMapLocked, setIsMapLocked] = useState(true);
  const [activeMapboxToken, setActiveMapboxToken] = useState<string>(getResolvedMapboxToken);
  const [showTokenConfigModal, setShowTokenConfigModal] = useState<boolean>(false);
  const [tokenInputVal, setTokenInputVal] = useState<string>('');
  const [mapError, setMapError] = useState(false);

  const handleSaveMapboxToken = (newToken: string) => {
    const trimmed = newToken.trim();
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('nexus_mapbox_token', trimmed);
      } else {
        localStorage.removeItem('nexus_mapbox_token');
      }
    }
    setActiveMapboxToken(trimmed);
    setMapError(false);
    setShowTokenConfigModal(false);
    triggerNotification(trimmed ? '🗺️ Mapbox Access Token saved & activated!' : '🗺️ Mapbox Token removed. Using fallback vector map.');
  };
  const [editingFormShow, setEditingFormShow] = useState<Show | null>(null);
  const [formInitialType, setFormInitialType] = useState<'headliner' | 'support' | 'festival' | 'tour date' | 'one-off'>('headliner');
  const [transactionsShowId, setTransactionsShowId] = useState<string | null>(null);
  const [settlementShow, setSettlementShow] = useState<Show | null>(null);
  const [settlementMode, setSettlementMode] = useState<'audit' | 'final' | null>(null);
  const [daySheetShow, setDaySheetShow] = useState<Show | null>(null);
  const [showActionModal, setShowActionModal] = useState<{ type: 'remove_or_delete'; show: Show } | null>(null);

  // Auto-open show form if controlled by parent state
  const onCloseFormRef = useRef(onCloseForm);
  useEffect(() => {
    onCloseFormRef.current = onCloseForm;
  }, [onCloseForm]);

  useEffect(() => {
    if (initialOpenForm) {
      setIsFormModalOpen(true);
      onCloseFormRef.current?.();
    }
  }, [initialOpenForm]);

  // Scroll to top of the page on tab or active sub-view changes
  useEffect(() => {
    if (disableScrollToTop) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const scrollableDivs = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    scrollableDivs.forEach(div => {
      div.scrollTop = 0;
    });
  }, [filterTab, expandedShowId, disableScrollToTop]);

  // Hook into deep navigation links from other screens (like the dashboard upcoming calendar card click)
  const onClearInitialExpandedShowIdRef = useRef(onClearInitialExpandedShowId);
  useEffect(() => {
    onClearInitialExpandedShowIdRef.current = onClearInitialExpandedShowId;
  }, [onClearInitialExpandedShowId]);

  useEffect(() => {
    if (initialExpandedShowId) {
      setExpandedShowId(initialExpandedShowId);
      onClearInitialExpandedShowIdRef.current?.();
    }
  }, [initialExpandedShowId]);

  // Settlement auto-open deep link hook
  const onClearInitialSettlementShowIdRef = useRef(onClearInitialSettlementShowId);
  useEffect(() => {
    onClearInitialSettlementShowIdRef.current = onClearInitialSettlementShowId;
  }, [onClearInitialSettlementShowId]);

  useEffect(() => {
    if (initialSettlementShowId) {
      const matched = shows.find(s => s.id === initialSettlementShowId);
      if (matched) {
        setSettlementShow(matched);
        setSettlementMode('final');
        setFilterTab('all');
        setExpandedShowId(initialSettlementShowId);
      }
      onClearInitialSettlementShowIdRef.current?.();
    }
  }, [initialSettlementShowId, shows]);

  // Dynamic Tour Progression Metrics Dashboard calculation
  const tourProgression = useMemo(() => {
    const total = shows.length;
    const completed = shows.filter(s => s.status === 'Closed').length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Sum show.revenue if defined, or sum sales matching each show
    let totalProjectedRevenue = shows.reduce((acc, s) => acc + (s.revenue || 0), 0);
    if (totalProjectedRevenue === 0 && sales.length > 0) {
      totalProjectedRevenue = sales.reduce((acc, s) => acc + (s.amount * (s.quantity || 1)), 0);
    }
    
    const nextShow = [...shows]
      .filter(s => s.status === 'Active' && new Date(s.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    return {
      total,
      completed,
      progressPercent,
      totalProjectedRevenue,
      nextShow
    };
  }, [shows, sales]);

  // Milestone checklist state management with localStorage serialization
  const [showMilestones, setShowMilestones] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem('nexus_core_show_milestones');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const toggleMilestone = (showId: string, milestone: string) => {
    setShowMilestones(prev => {
      const current = prev[showId] || [];
      const updated = current.includes(milestone)
        ? current.filter(m => m !== milestone)
        : [...current, milestone];
      const next = { ...prev, [showId]: updated };
      localStorage.setItem('nexus_core_show_milestones', JSON.stringify(next));
      return next;
    });
  };

  // Route & Transit dynamic generator
  const getRouteTransitInfo = (currentShow: Show) => {
    const sortedShows = [...shows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const currentIndex = sortedShows.findIndex(s => s.id === currentShow.id);
    if (currentIndex > 0) {
      const prevShow = sortedShows[currentIndex - 1];
      const prevCity = prevShow.city || prevShow.name.split(',')[0];
      const currentCity = currentShow.city || currentShow.name.split(',')[0];
      
      const sum = currentCity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const distance = Math.floor(120 + ((prevCity.length + currentCity.length) * 12.4 + sum) % 350);
      const driveHours = (distance / 60).toFixed(1);
      
      return {
        prevShowName: prevShow.festival_name || prevShow.name,
        prevCity,
        distance,
        driveHours
      };
    }
    return null;
  };

  // Weather Dynamic generator
  const getWeatherInfo = (city: string) => {
    const cleanedCity = city || "Fort Wayne";
    const sum = cleanedCity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const temp = 62 + (sum % 24); // between 62°F and 86°F
    const conditions = ['Partly Cloudy', 'Sunny & Warm', 'Clear Skies', 'Mild & Overcast', 'Breezy & Cool'][sum % 5];
    const windSpeed = 5 + (sum % 12);
    
    return {
      temp,
      conditions,
      windSpeed
    };
  };

  // SVG dimensions for USA visual map
  const svgWidth = 800;
  const svgHeight = 450;

  // Mapbox DOM mounting refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});

  // Compile active show list with precise GIS longitude and lat pairs
  const showsWithGeoCoords = useMemo(() => {
    return shows.map((show, idx) => {
      const geo = findShowGeoLocation(show);
      return {
        ...show,
        lng: geo.lng,
        lat: geo.lat,
        label: show.name.split(',')[0]
      };
    });
  }, [shows]);

  // Mapbox initialization logic
  useEffect(() => {
    if (!activeMapboxToken || !mapContainerRef.current || mapError) return;

    // Verify WebGL availability before attempting canvas initialization
    if (typeof mapboxgl.supported === 'function' && !mapboxgl.supported()) {
      console.warn('Mapbox GL is not supported in this WebGL environment.');
      setMapError(true);
      return;
    }

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    try {
      mapboxgl.accessToken = activeMapboxToken;

      // On native Android/Capacitor APK builds, prompt/verify OS location permissions seamlessly
      requestLocationPermission().catch((err) => {
        console.warn('Mapbox location permission check:', err);
      });
      
      // Mobile & Android WebView optimization: use Mercator projection which has universal GPU shader support
      const isMobileDevice = typeof window !== 'undefined' && (
        window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapboxStyleUrl,
        center: [-98.5795, 39.8283], // Centered globally/US-scale
        zoom: 3,
        projection: isMobileDevice ? ({ name: 'mercator' } as any) : ({ name: 'globe' } as any),
        attributionControl: false
      });

      map.on('style.load', () => {
        if (!isMounted) return;
        try {
          if (!isMobileDevice) {
            map.setFog({
              color: 'rgb(11, 13, 20)',
              'high-color': 'rgb(24, 28, 38)',
              'horizon-blend': 0.03,
              'space-color': 'rgb(4, 4, 6)',
              'star-intensity': 0.7
            });
          }
        } catch (_) {}
      });

      // Resilient error listener: only trigger fallback if WebGL context was destroyed / lost, NOT on minor 404 tile/sprite errors
      map.on('error', (e) => {
        const errorMsg = String(e?.error?.message || e?.error || '');
        console.warn('Mapbox event notification:', errorMsg, e);
        if (
          errorMsg.toLowerCase().includes('webgl') ||
          errorMsg.toLowerCase().includes('context lost') ||
          errorMsg.toLowerCase().includes('failed to initialize webgl')
        ) {
          console.error('Fatal Mapbox WebGL Context Error:', e);
          if (isMounted) {
            setMapError(true);
          }
        }
      });

      mapRef.current = map;

      // Handle dynamic resizing with ResizeObserver for slow Android WebView layout calculations
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      // Force resize calculation on map load
      map.on('load', () => {
        if (isMounted) {
          map.resize();
        }
      });

      // Progressive fallback timeouts for mobile rendering layout passes
      const t1 = setTimeout(() => { if (isMounted && mapRef.current) mapRef.current.resize(); }, 150);
      const t2 = setTimeout(() => { if (isMounted && mapRef.current) mapRef.current.resize(); }, 500);
      const t3 = setTimeout(() => { if (isMounted && mapRef.current) mapRef.current.resize(); }, 1200);

      addLog('Initialized Mapbox Interactive Tour Hub.');

      return () => {
        isMounted = false;
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        try {
          map.remove();
        } catch (_) {}
        mapRef.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize mapbox canvas:', err);
      setMapError(true);
    }
  }, [activeMapboxToken, mapboxStyleUrl, mapError]);

  // Marker and route updating effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear removed markers
    const currentShowIds = new Set(showsWithGeoCoords.map(s => s.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentShowIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add/Update current markers
    showsWithGeoCoords.forEach(show => {
      const isSelected = selectedShowId === show.id;
      const isClosed = show.status === 'Closed';
      const colorClass = isClosed ? '#c084fc' : '#00ffcc';

      if (markersRef.current[show.id]) {
        const markerElement = markersRef.current[show.id].getElement();
        if (markerElement) {
          markerElement.style.border = isSelected ? '2.5px solid #ffffff' : `1.5px solid ${colorClass}`;
          markerElement.style.boxShadow = isSelected ? '0 0 14px #00ffcc' : 'none';
          markerElement.style.transform = isSelected ? 'scale(1.25)' : 'scale(1)';
        }
      } else {
        const el = document.createElement('div');
        el.className = 'custom-mapbox-marker group cursor-pointer relative';
        el.style.width = '15px';
        el.style.height = '15px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = colorClass;
        el.style.border = isSelected ? '2.5px solid #ffffff' : `1.5px solid ${colorClass}`;
        el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.boxShadow = isSelected ? '0 0 14px #00ffcc' : 'none';

        if (!isClosed) {
          const pulse = document.createElement('div');
          pulse.className = 'absolute -inset-1.5 rounded-full bg-[#00ffcc] opacity-35 animate-ping';
          pulse.style.pointerEvents = 'none';
          el.appendChild(pulse);
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/85 text-[9px] font-mono text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-800 pointer-events-none uppercase tracking-wider font-semibold z-50';
        tooltip.innerText = show.city ? `${show.city}${show.state_province ? `, ${show.state_province}` : ''}${show.country ? ` (${show.country})` : ''}` : show.name.split(',')[0];
        el.appendChild(tooltip);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          handleSelectShow(show.id);
        });

        const newMarker = new mapboxgl.Marker({ element: el })
          .setLngLat([show.lng, show.lat])
          .addTo(map);

        markersRef.current[show.id] = newMarker;
      }
    });

    // Draw lines connecting markers in chronological order
    const updateRoutes = () => {
      const sortedStops = [...showsWithGeoCoords]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(s => [s.lng, s.lat]);

      const routeSourceId = 'tour-route';
      const routeLayerId = 'tour-route-line';

      const geoData: any = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: sortedStops
        }
      };

      const source = map.getSource(routeSourceId) as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geoData);
      } else {
        map.addSource(routeSourceId, {
          type: 'geojson',
          data: geoData
        });

        map.addLayer({
          id: routeLayerId,
          type: 'line',
          source: routeSourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#00ffcc',
            'line-width': 1.5,
            'line-opacity': 0.45,
            'line-dasharray': [2, 2]
          }
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateRoutes();
    } else {
      map.on('style.load', updateRoutes);
    }
  }, [showsWithGeoCoords, selectedShowId]);

  // Smooth FlyTo fly transition when stop is selected from the listing calendar system
  useEffect(() => {
    if (!selectedShowId || !mapRef.current) return;
    const currentStop = showsWithGeoCoords.find(s => s.id === selectedShowId);
    if (currentStop) {
      mapRef.current.flyTo({
        center: [currentStop.lng, currentStop.lat],
        zoom: 6,
        duration: 1800,
        essential: true
      });
    }
  }, [selectedShowId]);

  // Determine coordinates for each show in list to support SVG map fallback beautifully
  const showsWithCoords = useMemo(() => {
    return shows.map((show, idx) => {
      // Analyze text to find matches for coordinates
      let foundCoord = { x: 300, y: 200 }; // Default center fallback
      
      const venueText = [
        show.festival_name,
        show.name,
        show.city,
        show.state_province,
        show.country
      ].filter(Boolean).join(' ').toLowerCase();

      let matchedKey = '';

      for (const key of Object.keys(CITY_COORDINATES)) {
        if (venueText.includes(key.toLowerCase())) {
          foundCoord = CITY_COORDINATES[key];
          matchedKey = key;
          break;
        }
      }

      // If no exact keyword match, procedurally generate based on index to spread out dots naturally
      if (!matchedKey) {
        const seedValue = (idx * 79) % 360;
        const rad = (seedValue * Math.PI) / 180;
        // Float CA/TX area
        const rx = 350 + Math.cos(rad) * 150;
        const ry = 220 + Math.sin(rad) * 100;
        foundCoord = { x: rx, y: ry };
      }

      return {
        ...show,
        x: foundCoord.x,
        y: foundCoord.y,
        label: show.name.split(',')[0]
      };
    });
  }, [shows]);

  // Derived coordinates sorted chronologically for path connecting line
  const chronologicalShowCoords = useMemo(() => {
    return [...showsWithCoords]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(s => ({ x: s.x, y: s.y, id: s.id, name: s.festival_name || s.name }));
  }, [showsWithCoords]);

  // Handle selected show from calendar or map click
  const handleSelectShow = (id: string) => {
    setSelectedShowId(id);
    const show = shows.find(s => s.id === id);
    if (show) {
      const showDate = new Date(show.date);
      // Adjust calendar month to match show date
      setCurrentDate(new Date(showDate.getFullYear(), showDate.getMonth(), 1));
      setSelectedDate(showDate);
      addLog(`Selected tour stop: [${show.festival_name || show.name}] on date ${show.date}`);
    }
  };

  // Duplicate Show Action
  const handleDuplicateShow = async (show: Show) => {
    const id = 'sh_dup_' + Math.random().toString(36).substring(2, 9);
    const duplicated: Show = {
      ...show,
      id,
      created_at: new Date().toISOString(),
      festival_name: show.festival_name ? `${show.festival_name} (Copy)` : undefined,
      name: `${show.name} (Copy)`,
      revenue: show.revenue ? parseFloat((show.revenue * 0.9).toFixed(2)) : undefined, // slight variation
      band_id: show.band_id || activeBandId || 'b1',
      is_community_submitted: false
    };
    
    setShows(prev => [...prev, duplicated]);
    addLog(`Duplicated tour stop: [${show.name}] to new copy [${duplicated.name}]`);
    triggerNotification('Show successfully duplicated!');

    // Duplicate local storage extended details
    try {
      const existing = localStorage.getItem('nexus_core_shows_extended');
      if (existing) {
        const extendedMap = JSON.parse(existing);
        const extra = extendedMap[show.id];
        if (extra) {
          extendedMap[id] = { ...extra, band_id: show.band_id || activeBandId || 'b1', is_community_submitted: false };
          localStorage.setItem('nexus_core_shows_extended', JSON.stringify(extendedMap));
        }
      }
    } catch (_) {}

    // Database Sync
    const supabase = getSupabase();
    if (supabase) {
      const session = await ensureValidSupabaseAuthSession(supabase);
      if (!session) {
        addLog(`Database session invalid. Duplicated show cached locally.`);
        return;
      }
      const prunedDbShow = sanitizeShowForDb(duplicated);
      const { error } = await supabase.from('shows').insert([prunedDbShow]);
      if (error) {
        addLog(`Database insert error on duplicate: ${error.message}`);
      } else {
        addLog(`Postgres sync finalized for duplicated show.`);
      }
    }
  };

  // Remove / Detach Show from Band Workspace (Keeps show intact in Community Shows Hub)
  const handleRemoveFromBandWorkspace = async (id: string, name: string) => {
    setShows(prev => prev.filter(s => s.id !== id));
    if (selectedShowId === id) setSelectedShowId(null);
    setShowActionModal(null);
    addLog(`Removed show [${name}] from band workspace. Record remains live in Community Shows Hub.`);
    triggerNotification(`"${name}" removed from Band Workspace (persisted in Community Shows Hub).`);

    // Database Sync: Update band_id to 'community_hub' and ensure is_community_submitted is true
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('shows').update({
          band_id: 'community_hub',
          is_community_submitted: true
        }).eq('id', id);
        addLog(`Database sync: Show detached from band roster and published to community.`);
      } catch (err: any) {
        addLog(`Database detach error: ${err?.message || err}`);
      }
    }

    // Extended storage update
    try {
      const raw = localStorage.getItem('nexus_core_shows_extended');
      if (raw) {
        const extMap = JSON.parse(raw);
        if (extMap[id]) {
          extMap[id].band_id = 'community_hub';
          extMap[id].is_community_submitted = true;
          localStorage.setItem('nexus_core_shows_extended', JSON.stringify(extMap));
        }
      }
    } catch (_) {}
  };

  // Delete Show Action (Deletes permanently from database)
  const handleDeleteShow = async (id: string, name: string) => {
    setShows(prev => prev.filter(s => s.id !== id));
    if (selectedShowId === id) setSelectedShowId(null);
    setShowActionModal(null);
    addLog(`Deleted tour stop slot ID: [${id}] - ${name}`);
    triggerNotification('Tour stop record permanently removed.');

    // Database Sync
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('shows').delete().eq('id', id);
      if (error) {
        addLog(`Database remove error: ${error.message}`);
      } else {
        addLog(`Postgres sync finalized for deleted show.`);
      }
    }
  };

  // Close Show Action (Toggles status and updates revenue)
  const handleToggleCloseShow = async (show: Show) => {
    const newStatus = show.status === 'Closed' ? 'Active' : 'Closed';
    const newRevenue = show.status === 'Closed' ? show.revenue : (show.revenue || 250); // Set default revenue if closing
    
    setShows(prev => prev.map(s => s.id === show.id ? { 
      ...s, 
      status: newStatus,
      revenue: newRevenue
    } : s));
    
    addLog(`Updated Tour Stop Settlement Status: [${show.name}] updated to ${newStatus}`);
    triggerNotification(`Settlement status: marked as ${newStatus}!`);

    // Database Sync
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('shows').update({
        status: newStatus,
        revenue: newRevenue
      }).eq('id', show.id);
      if (error) {
        addLog(`Database update error on settlement toggle: ${error.message}`);
      } else {
        addLog(`Postgres sync finalized for updated settlement status.`);
      }
    }
  };

  // Form submission handler for Save/Update of Detailed ShowFormModal
  const handleSaveFormShow = async (payload: any) => {
    const showId = payload.id || 'sh_' + Math.random().toString(36).substring(2, 9);
    const timestamp = payload.created_at || new Date().toISOString();

    const newShow: Show = {
      id: showId,
      created_at: timestamp,
      name: payload.name,
      festival_name: payload.festival_name,
      date: payload.date,
      status: payload.status || 'Active',
      revenue: payload.guarantee_amount || payload.revenue || 0,
      show_type: payload.show_type || 'headliner',
      band_id: payload.band_id || (payload.is_community_submitted ? 'community_hub' : (activeBandId || 'b1')),
      is_community_submitted: !!payload.is_community_submitted,
      external_ticket_url: payload.external_ticket_url,
      
      // High Fidelity Fields
      event_scope: payload.event_scope,
      tour_id: payload.tour_id,
      venue_address: payload.venue_address,
      city: payload.city,
      state_province: payload.state_province,
      country: payload.country,
      promoter_contact: payload.promoter_contact,
      load_in_time: payload.load_in_time,
      doors_time: payload.doors_time,
      set_time: payload.set_time,
      curfew_time: payload.curfew_time,
      venue_cut_percentage: payload.venue_cut_percentage,
      guarantee_amount: payload.guarantee_amount,
      currency: payload.currency,
      tax_rate: payload.tax_rate,
      expected_attendance: payload.expected_attendance,
      guest_list: payload.guest_list,
      additional_notes: payload.additional_notes,
      merch_space_fee: payload.merch_space_fee,
      seller_cost: payload.seller_cost,
      tables_provided: payload.tables_provided,
      hanging_grids_provided: payload.hanging_grids_provided,
      shore_power: payload.shore_power,
      parking_arrangements: payload.parking_arrangements,
      age_restriction: payload.age_restriction,
      wifi_network: payload.wifi_network,
      wifi_password: payload.wifi_password,
      merch_call_time: payload.merch_call_time,
      soundcheck_time: payload.soundcheck_time,
      dinner_arrangements: payload.dinner_arrangements,
      local_food_notes: payload.local_food_notes,
      emergency_medical_info: payload.emergency_medical_info,
      local_pharmacy_info: payload.local_pharmacy_info,
      audio_production_requirements: payload.audio_production_requirements,
      stage_backline_requirements: payload.stage_backline_requirements,
      support_lineup: payload.support_lineup,
    };

    // Update state
    if (payload.id) {
      setShows(prev => prev.map(s => s.id === payload.id ? newShow : s));
      addLog(`Updated scheduled show: ${newShow.name}`);
      triggerNotification(`Show updated successfully!`);
    } else {
      setShows(prev => [newShow, ...prev]);
      addLog(`Tour date scheduled: ${newShow.name}`);
      triggerNotification(`New show scheduled!`);
    }

    // Save extra fields locally
    let localStorageShowsMap: any = {};
    try {
      const existing = localStorage.getItem('nexus_core_shows_extended');
      if (existing) localStorageShowsMap = JSON.parse(existing);
      localStorageShowsMap[showId] = { ...newShow };
      localStorage.setItem('nexus_core_shows_extended', JSON.stringify(localStorageShowsMap));
    } catch (_) {}

    // Database Sync
    const supabase = getSupabase();
    if (supabase) {
      const session = await ensureValidSupabaseAuthSession(supabase);
      if (!session) {
        addLog(`Database session invalid. Saved show cached locally.`);
        setIsFormModalOpen(false);
        setEditingFormShow(null);
        return;
      }
      const prunedDbShow = sanitizeShowForDb(newShow);

      let dbErr;
      if (payload.id) {
        const { error } = await supabase.from('shows').update(prunedDbShow).eq('id', payload.id);
        dbErr = error;
      } else {
        const { error } = await supabase.from('shows').insert([prunedDbShow]);
        dbErr = error;
      }

      if (dbErr) {
        addLog(`Database sync issue: ${dbErr.message}`);
      } else {
        addLog(`Show coordinates successfully synchronized to live cloud.`);
      }
    }

    // Reset modals
    setIsFormModalOpen(false);
    setEditingFormShow(null);
  };

  // Calendar Helpers
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const startDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", 
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const calendarDays = useMemo(() => {
    const totalDays = daysInMonth(currentDate);
    const startOffset = startDayOfMonth(currentDate);
    const daysArr: { date: Date | null; isCurrentMonth: boolean; hasShow: boolean; shows: Show[] }[] = [];

    // Offset for empty starting days
    for (let i = 0; i < startOffset; i++) {
      daysArr.push({ date: null, isCurrentMonth: false, hasShow: false, shows: [] });
    }

    // Populate actual month days
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      const isoStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      
      const dayShows = shows.filter(s => s.date === isoStr);
      
      daysArr.push({
        date: dayDate,
        isCurrentMonth: true,
        hasShow: dayShows.length > 0,
        shows: dayShows
      });
    }

    return daysArr;
  }, [currentDate, shows]);

  // Selected date's list of shows
  const showsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const isoStr = selectedDate.toISOString().split('T')[0];
    return shows.filter(s => s.date === isoStr);
  }, [selectedDate, shows]);

  // 5 metrics calculations based on user instructions and active lists
  const stats = useMemo(() => {
    // Specifically track aggregate gross of merch sales only, not guarantees
    const totalSales = sales.reduce((sum, s) => sum + (s.amount * (s.quantity || 1)), 0);
    const avgPerShow = shows.length > 0 ? totalSales / shows.length : 0;
    const totalGuarantees = shows.reduce((sum, s) => sum + (s.guarantee_amount || 0), 0);
    
    // Calculate Cities count (extract unique places)
    const uniqueCities = new Set(
      shows.map(s => {
        const parts = s.name.split(',');
        return parts.length > 1 ? parts[1].trim() : s.name.trim();
      })
    );

    // Track actual quantities in sales table only
    const itemsSold = sales.reduce((sum, s) => sum + (s.quantity || 1), 0);

    return {
      totalSales,
      itemsSold,
      avgPerShow,
      citiesCount: uniqueCities.size,
      totalGuarantees
    };
  }, [shows, sales]);

  // Filter shows for rendering lists
  const filteredShows = useMemo(() => {
    let result = [...shows];

    // Search query match
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.festival_name && s.festival_name.toLowerCase().includes(query))
      );
    }

    // Tab Filter
    const todayStr = new Date().toISOString().split('T')[0];
    if (filterTab === 'upcoming') {
      result = result.filter(s => s.date >= todayStr);
    } else if (filterTab === 'past') {
      result = result.filter(s => s.date < todayStr);
    }

    // Sort options
    if (sortBy === 'date') {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === 'revenue') {
      result.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    }

    return result;
  }, [shows, searchQuery, filterTab, sortBy]);

  const expandedShow = useMemo(() => shows.find(s => s.id === expandedShowId), [shows, expandedShowId]);
  if (expandedShow) {
    return (
      <ShowExpandedView
        show={expandedShow}
        sales={sales}
        onBack={() => setExpandedShowId(null)}
        onManageSetlist={() => {}}
        onCloseShow={() => handleToggleCloseShow(expandedShow)}
        onAddExpense={() => {}}
        onViewAllSales={() => {}}
        bandName={bandName}
        triggerNotification={triggerNotification}
        onOpenOnRouteEssentials={() => {
          if (onOpenOnRouteEssentials) {
            const parts = [];
            if (expandedShow.venue_address && expandedShow.venue_address.trim() !== '') parts.push(expandedShow.venue_address.trim());
            if (expandedShow.city && expandedShow.city.trim() !== '') parts.push(expandedShow.city.trim());
            if (expandedShow.state_province && expandedShow.state_province.trim() !== '') parts.push(expandedShow.state_province.trim());
            const addressString = parts.length > 0 ? parts.join(", ") : "Address unavailable";
            onOpenOnRouteEssentials(addressString);
          }
        }}
      />
    );
  }

  if (isCoOpStagingActive) {
    return (
      <CoOpRouteStagingView 
        onBack={() => setIsCoOpStagingActive(false)}
        addLog={addLog}
        triggerNotification={triggerNotification}
      />
    );
  }

  if (onlyMap) {
    return (
      <div 
        className="bg-[#0b0d13] border-2 border-[#1f2330] rounded-xl overflow-hidden relative shadow-lg" 
        style={{ height: '380px', width: '100%', minHeight: '380px' }}
        id="shows-coordinate-map"
      >
        
        {/* Gesture Lock Overlay */}
        {isMapLocked && (
          <div className="absolute inset-0 z-10 bg-transparent" />
        )}

        {activeMapboxToken && !mapError ? (
          // Active Mapbox viewport container
          <div 
            ref={mapContainerRef} 
            className="absolute inset-0 w-full h-full z-0" 
            style={{ height: '380px', width: '100%', minHeight: '380px' }}
          />
        ) : (
          // Falling back to vector layout with background Dark Map overlay if Mapbox token is absent
          <>
            <div className="absolute inset-0 bg-[radial-gradient(#1f242e_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60 pointer-events-none" />
            
            {/* Embedded SVG coordinates map overlay inside container */}
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="absolute inset-0 w-full h-full drop-shadow-2xl select-none z-10"
              preserveAspectRatio="xMidYMid slice"
            >
              <image 
                href={darkMapAsset} 
                width={svgWidth} 
                height={svgHeight} 
                preserveAspectRatio="xMidYMid slice"
                className="opacity-75 mix-blend-lighten select-none pointer-events-none" 
              />
                {/* Glowing neon paths mapping chronological stops connection */}
                {chronologicalShowCoords.length > 1 && (
                  <polyline
                    points={chronologicalShowCoords.map(coord => `${coord.x},${coord.y}`).join(' ')}
                    fill="none"
                    className="stroke-[#00ffcc]/35 stroke-[1.5px]"
                    strokeDasharray="2 4"
                  />
                )}

                {/* Glowing animated path overlay connecting dots */}
                {chronologicalShowCoords.length > 1 && (
                  <polyline
                    points={chronologicalShowCoords.map(coord => `${coord.x},${coord.y}`).join(' ')}
                    fill="none"
                    className="stroke-[#00ffcc] stroke-[1px] opacity-60"
                    strokeDasharray="180"
                    strokeDashoffset="180"
                    style={{
                      strokeDasharray: 500,
                      strokeDashoffset: 500,
                      animation: 'dash 14s linear infinite'
                    }}
                  />
                )}

                {/* Show stop coordinate points */}
                {showsWithCoords.map((show, swcIdx) => {
                  const isActive = selectedShowId === show.id;
                  const isClosed = show.status === 'Closed';
                  const colorClass = isClosed ? '#c084fc' : '#00ffcc'; // Purple for closed, teal for active
                  
                  return (
                    <g 
                      key={show.id ? `coord-${show.id}-${swcIdx}` : `coord-${swcIdx}`} 
                      className="cursor-pointer group"
                      onClick={() => handleSelectShow(show.id)}
                    >
                      <circle
                        cx={show.x}
                        cy={show.y}
                        r={isActive ? "10" : "6"}
                        fill="transparent"
                        stroke={colorClass}
                        strokeWidth="1.5"
                        className="group-hover:scale-125 transition-transform duration-300"
                      />
                      
                      {/* Glowing pulsing dot for active stops */}
                      {!isClosed && (
                        <circle
                          cx={show.x}
                          cy={show.y}
                          r="12"
                          fill="transparent"
                          stroke="#00ffcc"
                          strokeWidth="1"
                          className="animate-ping opacity-25"
                        />
                      )}

                      <circle
                        cx={show.x}
                        cy={show.y}
                        r={isActive ? "5" : "3.5"}
                        fill={colorClass}
                        className="transition-all duration-300"
                      />
                      
                      {/* Label tag mapping text labels */}
                      <text
                        x={show.x}
                        y={show.y - (isActive ? 14 : 10)}
                        textAnchor="middle"
                        fill={isActive ? "#00ffcc" : "#9ca3af"}
                        fontSize={isActive ? "11px" : "8px"}
                        fontWeight={isActive ? "bold" : "600"}
                        fontFamily="monospace"
                        className="bg-black text-[9px] filter drop-shadow-md drop-shadow-[#000000_1px_1px]"
                      >
                        {show.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
          </>
        )}
        
        {/* Title Tag overlay */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 bg-black/75 backdrop-blur-md border border-zinc-800 rounded-lg p-2 md:p-2.5 max-w-[200px] md:max-w-[240px]">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-mono uppercase text-[#00ffcc] tracking-wider block font-black truncate">{bandName || "Void Walkers"} Tour '26</span>
            <button
              onClick={() => {
                setTokenInputVal(activeMapboxToken);
                setShowTokenConfigModal(true);
              }}
              title="Configure Mapbox Token"
              className="text-zinc-400 hover:text-[#00ffcc] p-0.5 rounded hover:bg-zinc-800 transition-colors shrink-0"
            >
              <Key className="w-3 h-3" />
            </button>
          </div>
          <h3 className="text-xs font-semibold tracking-wide text-[#ffffff] font-display mt-0.5 flex items-center justify-between">
            <span>Interactive Mapbox</span>
            {activeMapboxToken && !mapError && (
              <span className="text-[7.5px] font-mono text-emerald-400 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-800">LIVE</span>
            )}
          </h3>
          <p className="text-[8px] font-mono text-zinc-400 mt-1 hidden sm:block">
            {activeMapboxToken 
              ? `Displaying ${shows.length} global stops with live Fly-to zoom control!`
              : (
                <span className="cursor-pointer hover:underline text-[#00ffcc]" onClick={() => { setTokenInputVal(activeMapboxToken); setShowTokenConfigModal(true); }}>
                  Click to configure Mapbox Token for interactive 3D map.
                </span>
              )
            }
          </p>

          {/* Incorporated Active & Settled stops list/legend with count */}
          <div className="mt-2 pt-2 border-t border-zinc-800/60 flex flex-col gap-1 text-[8px] sm:text-[9px] font-mono text-zinc-300">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] inline-block animate-pulse shrink-0" />
              <span>Active: <strong className="text-[#00ffcc]">{shows.filter(s => s.status !== 'Closed').length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] inline-block shrink-0" />
              <span>Settled: <strong className="text-[#c084fc]">{shows.filter(s => s.status === 'Closed').length}</strong></span>
            </div>
          </div>
        </div>

        {/* Gesture Lock Toggle */}
        <button 
          onClick={() => setIsMapLocked(!isMapLocked)}
          className={`absolute bottom-2 right-2 md:top-[88px] md:right-4 md:bottom-auto md:left-auto z-20 font-mono text-[8px] sm:text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer bg-black/85 backdrop-blur-md shadow-xl px-2 py-1.5 rounded-none border border-emerald-500 hover:border-emerald-400 ${
            isMapLocked 
              ? 'text-zinc-400 hover:text-white hover:bg-emerald-950/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
          }`}
        >
          {isMapLocked ? 'Tap to Unlock' : 'Tap to Lock'}
        </button>

        {/* Active tour detail readout footer */}
        {selectedShowId && (
          <div className="absolute bottom-14 left-2 right-2 md:bottom-4 md:left-4 md:right-4 z-20 bg-black/85 backdrop-blur-md px-3 py-1.5 border border-zinc-800 rounded-lg flex justify-between items-center text-[10px] md:text-xs shadow-xl animate-fade-in">
            {(() => {
              const selectedShow = shows.find(s => s.id === selectedShowId);
              if (!selectedShow) return null;
              return (
                <>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#00ffcc] shrink-0" />
                    <span className="font-mono text-zinc-200 font-bold truncate max-w-[140px] sm:max-w-xs">{selectedShow.festival_name ? `${selectedShow.festival_name} • ` : ''}{selectedShow.name}</span>
                  </div>
                  <div className="flex gap-2 md:gap-3 font-mono text-[9px] md:text-[10px] text-zinc-400 font-bold ml-2 shrink-0">
                    <span>Date: <span className="text-white">{selectedShow.date}</span></span>
                    {selectedShow.revenue && <span>Gross: <span className="text-emerald-400">${selectedShow.revenue}</span></span>}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="shows-view-container" className="flex flex-col bg-black text-[#c5c6c7] p-4 space-y-4 max-w-7xl mx-auto pb-3 font-sans">
      
      {/* DIRECT BOOKING PROPOSALS & OFFERS BANNER */}
      {offers && offers.length > 0 && (
        <div className="border border-purple-500/50 rounded-xl bg-purple-950/5 overflow-hidden shadow-lg shadow-purple-950/10" id="band-direct-proposals-widget">
          {/* Pulsing Toggle Header */}
          <button
            onClick={() => setIsOffersPanelExpanded(!isOffersPanelExpanded)}
            className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-950/30 via-purple-900/10 to-transparent text-left focus:outline-none hover:bg-purple-950/20 transition-all font-mono"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <div>
                <span className="text-xs font-display font-black uppercase tracking-wider text-white">
                  Direct Promoter Booking Offers
                </span>
                <span className="ml-2.5 bg-purple-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded">
                  {offers.filter(o => o.status === 'pending' || o.status === 'renegotiating').length} proposals
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-purple-300 font-mono text-[9px] uppercase tracking-widest font-extrabold">
              <span>{isOffersPanelExpanded ? '[ CLOSE REVIEW ]' : '[ REVIEW OFFERS ]'}</span>
              <span className="text-xs">{isOffersPanelExpanded ? '▲' : '▼'}</span>
            </div>
          </button>

          {isOffersPanelExpanded && (
            <div className="p-4 border-t border-purple-900/40 bg-zinc-950/50 space-y-3.5 text-left font-mono">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar mb-3">
                {['all', 'pending', 'accepted', 'renegotiating'].map((filter, idx) => (
                  <button
                    key={`${filter}-${idx}`}
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
              
              {offers.filter(o => offerFilter === 'all' || o.status === offerFilter).length === 0 ? (
                <p className="text-xs text-zinc-500 font-mono italic text-center py-4">All booking offers are cleared, accepted or locked!</p>
              ) : (
                <div className="space-y-3">
                  {offers.filter(o => offerFilter === 'all' || o.status === offerFilter).map((offer, idx) => {
                    const needsAction = offer.last_action_by === 'promoter';
                    let badgeText = '';
                    let badgeStyle = '';
                    let borderStyle = '';

                    const isExpanded = expandedOffers[offer.id] ?? true;
                    const toggleExpand = () => setExpandedOffers(prev => ({ ...prev, [offer.id]: !(expandedOffers[offer.id] ?? true) }));
                    const isConfirmed = offer.status === 'accepted';

                    if (offer.status === 'pending') {
                      badgeText = '[ PENDING ]';
                      badgeStyle = 'text-[#00ffff]/80';
                      borderStyle = 'border-[#00ffff]/60 shadow-[0_0_8px_rgba(0,255,255,0.15)]';
                    } else if (offer.status === 'accepted') {
                      badgeText = '[ CONFIRMED ]';
                      badgeStyle = 'text-[#00ff66] font-bold';
                      borderStyle = 'border-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.15)] bg-emerald-950/10';
                    } else if (offer.status === 'declined') {
                      badgeText = '[ REJECTED ]';
                      badgeStyle = 'text-[#ff3838]';
                      borderStyle = 'border-zinc-800';
                    } else {
                      badgeText = '[ COUNTERED ]';
                      badgeStyle = 'text-amber-500';
                      borderStyle = 'border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.15)]';
                    }

                    const missingFields: string[] = [];
                    if (!offer.soundcheck_time) missingFields.push('Soundcheck');
                    if (!offer.merch_call_time) missingFields.push('Merch Call');
                    if (!offer.dinner_arrangements) missingFields.push('Dinner');
                    if (!offer.travel_arrangements) missingFields.push('Travel');
                    if (!offer.load_in_time) missingFields.push('Load-In');
                    if (!offer.doors_time) missingFields.push('Doors');
                    if (!offer.set_time) missingFields.push('Set Time');
                    if (!offer.curfew_time) missingFields.push('Curfew');
                    if (!offer.venue_cut_percentage) missingFields.push('Venue Cut %');
                    if (!offer.merch_cut_percentage) missingFields.push('Merch Cut %');

                    return (
                      <div 
                        key={offer.id ? `offer-${offer.id}-${idx}` : `offer-${idx}`} 
                        className={`font-mono bg-zinc-950/70 border rounded-lg hover:border-opacity-100 transition-all text-xs overflow-hidden ${idx === 0 ? '' : borderStyle}`}
                        style={idx === 0 ? { borderColor: '#f9f90b', borderWidth: '1.834783px', backgroundColor: '#0b0c0e' } : undefined}
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
                              <p className="text-[10px] bg-black/40 p-2 rounded border border-purple-950 text-zinc-400 leading-normal italic font-mono mt-1.5 mb-3">
                                "{offer.notes}"
                              </p>
                            )}
                            {offer.status === 'renegotiating' && (
                              <div className="bg-amber-950/20 border border-amber-900/30 p-2 rounded text-[10px] text-amber-300 mt-2 mb-3">
                                <span className="font-extrabold uppercase text-[9px] block mb-0.5">Renegotiation Info:</span>
                                "{offer.renegotiation_notes || 'Counter-proposal under review.'}"
                              </div>
                            )}

                            {/* Promoter Cancellation Request Acknowledgment Widget */}
                            {offer.is_cancelled && !offer.cancellation_acknowledged && (
                              <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-lg text-[10px] text-zinc-300 mt-2 mb-3.5 space-y-2">
                                <div className="flex items-center gap-1.5 text-red-400 font-extrabold uppercase text-[10px]">
                                  <span>🚨</span>
                                  <span>Promoter Requested Cancellation</span>
                                </div>
                                <p className="text-[9.5px] text-zinc-400 leading-normal">
                                  The promoter has filed a request to cancel this contract. You must acknowledge or approve this cancellation.
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Are you sure you want to approve this contract cancellation?")) {
                                        onUpdateOffer?.({
                                          ...offer,
                                          cancellation_acknowledged: true,
                                          status: 'declined',
                                          last_action_by: 'band'
                                        });
                                        triggerNotification?.("Cancellation acknowledged and approved.");
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white font-extrabold rounded text-[9.5px] uppercase cursor-pointer border border-red-600"
                                  >
                                    [ APPROVE CANCEL ]
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateOffer?.({
                                        ...offer,
                                        is_cancelled: false,
                                        last_action_by: 'band',
                                        notes: offer.notes 
                                          ? `${offer.notes}\n\n[BAND REJECTED CANCELLATION REQUEST]`
                                          : `[BAND REJECTED CANCELLATION REQUEST]`
                                      });
                                      triggerNotification?.("Cancellation request declined.");
                                    }}
                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-[9.5px] uppercase cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Missing Day-sheet Specs Widget */}
                            {missingFields.length > 0 && offer.status !== 'declined' && !offer.is_cancelled && (
                              <div className="bg-amber-950/15 border border-amber-900/25 p-3 rounded-lg text-[10px] text-zinc-300 mt-2 mb-3.5 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[9px]">
                                  <span>⚠️</span>
                                  <span>Missing Day-Sheet Specs ({missingFields.length})</span>
                                </div>
                                <p className="text-[9px] text-zinc-400 leading-relaxed">
                                  Empty non-required day-sheet fields: <strong className="text-zinc-350">{missingFields.join(', ')}</strong>.
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const requestedMsg = `[BAND REQUESTED SPECS: Kindly outline: ${missingFields.join(', ')}]`;
                                    onUpdateOffer?.({
                                      ...offer,
                                      details_completed: false,
                                      notes: offer.notes ? `${offer.notes}\n\n${requestedMsg}` : requestedMsg
                                    });
                                    triggerNotification?.("Requested missing logistics specs from the promoter.");
                                  }}
                                  className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-950 hover:text-white border border-amber-500/30 text-amber-300 rounded font-black font-mono text-[9px] uppercase cursor-pointer"
                                >
                                  [ Ping Promoter to Populate Specs ]
                                </button>
                              </div>
                            )}

                            {/* Actions Group (Pre-confirmation vs Post-confirmation) */}
                            {!isConfirmed && offer.status !== 'declined' && (
                              <div className="flex items-center gap-2 mb-4">
                                {needsAction ? (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onAcceptOffer?.(offer.id) }}
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
                                      onClick={(e) => { e.stopPropagation(); onDeclineOffer?.(offer.id) }}
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

                            {/* Block Promoter Action */}
                            {!isConfirmed && offer.status !== 'declined' && (
                              <div className="flex border-t border-zinc-800/40 pt-2 mb-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onBlockPromoter?.(offer.id);
                                  }}
                                  className="w-full bg-black hover:bg-zinc-900 text-zinc-600 hover:text-red-500 border border-zinc-800 hover:border-red-900/40 rounded py-2 flex items-center justify-center cursor-pointer transition-colors font-bold uppercase text-[9px] tracking-widest"
                                  title="Outright block this specific promoter from sending further offers"
                                >
                                  Outright Block Promoter
                                </button>
                              </div>
                            )}

                            {/* Regenerate Panel */}
                            {localRenegotiateId === offer.id && (
                              <div className="space-y-4 bg-black/50 p-4 rounded-xl border border-amber-500/30 shadow-inner mt-4" onClick={e => e.stopPropagation()}>
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
                                      onRenegotiateOffer?.(offer.id, counterNotes, parseFloat(counterGuarantee));
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
                              <div className="mb-4 flex flex-col gap-2 border border-zinc-800 bg-black/40 rounded-lg p-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); triggerNotification("Advance request ping sent to Promoter."); }}
                                  className="w-full bg-emerald-950 border border-emerald-500/50 hover:bg-emerald-900/80 text-emerald-400 py-2.5 rounded flex items-center justify-center font-black tracking-widest uppercase text-[10px] transition-colors cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                                >
                                  [ ⚡ ASK FOR SHOW DETAILS ADVANCE ]
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to request cancellation for this booked show? The promoter will have to sign off.")) {
                                      onDeclineOffer?.(offer.id);
                                    }
                                  }}
                                  className="w-full bg-red-950 border border-red-500/40 hover:bg-red-900/60 text-red-400 py-2.5 rounded flex items-center justify-center font-black tracking-widest uppercase text-[10px] transition-colors cursor-pointer"
                                >
                                  [ CANCEL CONFIRMED SHOW ]
                                </button>
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
          )}
        </div>
      )}

      {/* TOP COMPONENT: DESIGNER INTERACTIVE ROUTING MAP */}
      {!hideMap && (
        <div 
          className="bg-[#0b0d13] border-2 border-[#1f2330] rounded-xl overflow-hidden relative shadow-lg" 
          style={{ height: '380px', width: '100%', minHeight: '380px' }}
          id="shows-coordinate-map"
        >
          
          {/* Gesture Lock Overlay */}
          {isMapLocked && (
            <div className="absolute inset-0 z-10 bg-transparent" />
          )}

          {activeMapboxToken && !mapError ? (
            // Active Mapbox viewport container
            <div 
              ref={mapContainerRef} 
              className="absolute inset-0 w-full h-full z-0" 
              style={{ height: '380px', width: '100%', minHeight: '380px' }}
            />
          ) : (
            // Falling back to vector layout with background Dark Map overlay if Mapbox token is absent
            <>
              <div className="absolute inset-0 bg-[radial-gradient(#1f242e_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60 pointer-events-none" />
              
              {/* Embedded SVG coordinates map overlay inside container */}
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                className="absolute inset-0 w-full h-full drop-shadow-2xl select-none z-10"
                preserveAspectRatio="xMidYMid slice"
              >
                <image 
                  href={darkMapAsset} 
                  width={svgWidth} 
                  height={svgHeight} 
                  preserveAspectRatio="xMidYMid slice"
                  className="opacity-75 mix-blend-lighten select-none pointer-events-none" 
                />
                  {/* Glowing neon paths mapping chronological stops connection */}
                  {chronologicalShowCoords.length > 1 && (
                    <polyline
                      points={chronologicalShowCoords.map(coord => `${coord.x},${coord.y}`).join(' ')}
                      fill="none"
                      className="stroke-[#00ffcc]/35 stroke-[1.5px]"
                      strokeDasharray="2 4"
                    />
                  )}

                  {/* Glowing animated path overlay connecting dots */}
                  {chronologicalShowCoords.length > 1 && (
                    <polyline
                      points={chronologicalShowCoords.map(coord => `${coord.x},${coord.y}`).join(' ')}
                      fill="none"
                      className="stroke-[#00ffcc] stroke-[1px] opacity-60"
                      strokeDasharray="180"
                      strokeDashoffset="180"
                      style={{
                        strokeDasharray: 500,
                        strokeDashoffset: 500,
                        animation: 'dash 14s linear infinite'
                      }}
                    />
                  )}

                  {/* Show stop coordinate points */}
                  {showsWithCoords.map((show, swcIdx) => {
                    const isActive = selectedShowId === show.id;
                    const isClosed = show.status === 'Closed';
                    const colorClass = isClosed ? '#c084fc' : '#00ffcc'; // Purple for closed, teal for active
                    
                    return (
                      <g 
                        key={show.id ? `coord2-${show.id}-${swcIdx}` : `coord2-${swcIdx}`} 
                        className="cursor-pointer group"
                        onClick={() => handleSelectShow(show.id)}
                      >
                        <circle
                          cx={show.x}
                          cy={show.y}
                          r={isActive ? "10" : "6"}
                          fill="transparent"
                          stroke={colorClass}
                          strokeWidth="1.5"
                          className="group-hover:scale-125 transition-transform duration-300"
                        />
                        
                        {/* Glowing pulsing dot for active stops */}
                        {!isClosed && (
                          <circle
                            cx={show.x}
                            cy={show.y}
                            r="12"
                            fill="transparent"
                            stroke="#00ffcc"
                            strokeWidth="1"
                            className="animate-ping opacity-25"
                          />
                        )}

                        <circle
                          cx={show.x}
                          cy={show.y}
                          r={isActive ? "5" : "3.5"}
                          fill={colorClass}
                          className="transition-all duration-300"
                        />
                        
                        {/* Label tag mapping text labels */}
                        <text
                          x={show.x}
                          y={show.y - (isActive ? 14 : 10)}
                          textAnchor="middle"
                          fill={isActive ? "#00ffcc" : "#9ca3af"}
                          fontSize={isActive ? "11px" : "8px"}
                          fontWeight={isActive ? "bold" : "600"}
                          fontFamily="monospace"
                          className="bg-black text-[9px] filter drop-shadow-md drop-shadow-[#000000_1px_1px]"
                        >
                          {show.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
            </>
          )}
          
          {/* Title Tag overlay */}
          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 bg-black/75 backdrop-blur-md border border-zinc-800 rounded-lg p-2 md:p-2.5 max-w-[200px] md:max-w-[240px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] font-mono uppercase text-[#00ffcc] tracking-wider block font-black truncate">{bandName || "Void Walkers"} Tour '26</span>
              <button
                onClick={() => {
                  setTokenInputVal(activeMapboxToken);
                  setShowTokenConfigModal(true);
                }}
                title="Configure Mapbox Token"
                className="text-zinc-400 hover:text-[#00ffcc] p-0.5 rounded hover:bg-zinc-800 transition-colors shrink-0"
              >
                <Key className="w-3 h-3" />
              </button>
            </div>
            <h3 className="text-xs font-semibold tracking-wide text-[#ffffff] font-display mt-0.5 flex items-center justify-between">
              <span>Interactive Mapbox</span>
              {activeMapboxToken && !mapError && (
                <span className="text-[7.5px] font-mono text-emerald-400 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-800">LIVE</span>
              )}
            </h3>
            <p className="text-[8px] font-mono text-zinc-400 mt-1 hidden sm:block">
              {activeMapboxToken 
                ? `Displaying ${shows.length} global stops with live Fly-to zoom control!`
                : (
                  <span className="cursor-pointer hover:underline text-[#00ffcc]" onClick={() => { setTokenInputVal(activeMapboxToken); setShowTokenConfigModal(true); }}>
                    Click to configure Mapbox Token for interactive 3D map.
                  </span>
                )
              }
            </p>

            {/* Incorporated Active & Settled stops list/legend with count */}
            <div className="mt-2 pt-2 border-t border-zinc-800/60 flex flex-col gap-1 text-[8px] sm:text-[9px] font-mono text-zinc-300">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] inline-block animate-pulse shrink-0" />
                <span>Active: <strong className="text-[#00ffcc]">{shows.filter(s => s.status !== 'Closed').length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] inline-block shrink-0" />
                <span>Settled: <strong className="text-[#c084fc]">{shows.filter(s => s.status === 'Closed').length}</strong></span>
              </div>
            </div>
          </div>

          {/* Gesture Lock Toggle */}
          <button 
            onClick={() => setIsMapLocked(!isMapLocked)}
            className={`absolute bottom-2 right-2 md:top-[88px] md:right-4 md:bottom-auto md:left-auto z-20 font-mono text-[8px] sm:text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer bg-black/85 backdrop-blur-md shadow-xl px-2 py-1.5 rounded-none border border-emerald-500 hover:border-emerald-400 ${
              isMapLocked 
                ? 'text-zinc-400 hover:text-white hover:bg-emerald-950/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isMapLocked ? 'Tap to Unlock' : 'Tap to Lock'}
          </button>

          {/* Active tour detail readout footer */}
          {selectedShowId && (
            <div className="absolute bottom-14 left-2 right-2 md:bottom-4 md:left-4 md:right-4 z-20 bg-black/85 backdrop-blur-md px-3 py-1.5 border border-zinc-800 rounded-lg flex justify-between items-center text-[10px] md:text-xs shadow-xl animate-fade-in">
              {(() => {
                const selectedShow = shows.find(s => s.id === selectedShowId);
                if (!selectedShow) return null;
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#00ffcc] shrink-0" />
                      <span className="font-mono text-zinc-200 font-bold truncate max-w-[140px] sm:max-w-xs">{selectedShow.festival_name ? `${selectedShow.festival_name} • ` : ''}{selectedShow.name}</span>
                    </div>
                    <div className="flex gap-2 md:gap-3 font-mono text-[9px] md:text-[10px] text-zinc-400 font-bold ml-2 shrink-0">
                      <span>Date: <span className="text-white">{selectedShow.date}</span></span>
                      {selectedShow.revenue && <span>Gross: <span className="text-emerald-400">${selectedShow.revenue}</span></span>}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* REPLACED POSITION: FULL INTERACTIVE CALENDAR SYSTEM */}
      <div className="flex flex-col gap-4" id="calendar-view-system">

        <div className="flex flex-col gap-2">
          {/* Animated flashing "add new show" button above the calendar */}
          <motion.button
            type="button"
            onClick={() => {
              setFormInitialType('tour date');
              setIsFormModalOpen(true);
              triggerNotification('Opening form to log new tour date slots...');
            }}
            animate={{
              boxShadow: [
                "0 0 4px rgba(0,255,204,0.2)",
                "0 0 20px rgba(0,255,204,0.6)",
                "0 0 4px rgba(0,255,204,0.2)"
              ],
              scale: [1, 1.015, 1]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 text-black font-extrabold text-[11px] font-mono uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-[0.985] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.3)] border border-emerald-300/40"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
            </span>
            <Plus className="w-4.5 h-4.5 stroke-[3] text-black" /> ADD NEW TOUR DATE
          </motion.button>
          
          <motion.button
            type="button"
            onClick={() => {
              setFormInitialType('one-off');
              setIsFormModalOpen(true);
              triggerNotification('Opening form to log new one-off date...');
            }}
            animate={{
              boxShadow: [
                "0 0 4px rgba(56,189,248,0.2)",
                "0 0 20px rgba(56,189,248,0.6)",
                "0 0 4px rgba(56,189,248,0.2)"
              ],
              scale: [1, 1.015, 1]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.9
            }}
            className="w-full py-3.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 text-black font-extrabold text-[11px] font-mono uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-[0.985] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)] border border-cyan-300/40"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
            </span>
            <Plus className="w-4.5 h-4.5 stroke-[3] text-black" /> ADD NEW ONE-OFF OR FESTIVAL DATE
          </motion.button>
        </div>
        
        {/* Core Calendar grid component - Full Width breakout with Pulsing Border */}
        <div className="w-[calc(100%+2rem)] -mx-4 rounded-none border-x-0 border-y sm:w-full sm:mx-0 sm:rounded-xl sm:border bg-[#0e1014] p-4 sm:p-5 flex flex-col justify-between calendar-pulse-border transition-all duration-300">
          <div className="flex items-center justify-between mb-4 px-1 sm:px-0">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#00ffcc]" />
              <span className="text-sm sm:text-xs uppercase font-mono tracking-wider font-bold text-zinc-300 sm:text-zinc-400">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={previousMonth}
                className="p-2 px-3 sm:p-1.5 sm:px-2 rounded border border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900 transition-colors text-zinc-400 hover:text-white cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 px-3 sm:p-1.5 sm:px-2 rounded border border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900 transition-colors text-zinc-400 hover:text-white cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] sm:text-[9px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((day, idx) => {
              if (!day.date) {
                return <div key={`empty-day-${idx}`} className="min-h-[46px] sm:min-h-0 sm:aspect-square bg-transparent rounded" />;
              }

              const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
              const dayStr = day.date.getDate();
              
              // Custom neon outline and status highlights
              let statusBorder = 'border-zinc-800/40 text-zinc-400 hover:bg-zinc-800/30';
              if (day.hasShow) {
                // Booked shows are filled in green with high-contrast text and a subtle drop shadow
                statusBorder = 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-emerald-500';
              }
              if (isSelected) {
                statusBorder += ' ring-2 ring-amber-400 ring-offset-2 ring-offset-black scale-102 z-10';
              }

              return (
                <button
                  key={`day-${idx}`}
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[46px] sm:min-h-0 sm:aspect-square hover:scale-[1.03] transition-all flex flex-col justify-between p-1.5 sm:p-1 text-xs rounded border cursor-pointer ${statusBorder}`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="leading-none text-[11px] sm:text-[10px] font-mono tracking-tighter">{dayStr}</span>
                  {day.hasShow && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current self-end animate-pulse mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Show Panel - Full Width */}
        <div className="w-full flex flex-col space-y-3">
          
          <div className="bg-[#0e1014] border border-zinc-800 rounded-xl p-4 flex-grow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-baseline border-b border-zinc-800 pb-2 mb-3">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#00ffcc] uppercase uppercase-label">
                  📅 TARGET DATE SET
                </span>
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {selectedDate ? selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'NoneSelected'}
                </span>
              </div>

              {showsOnSelectedDate.length === 0 ? (
                <div className="py-3 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-2xl opacity-60">💤</span>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase font-mono">No Scheduled Stops</h4>
                    <p className="text-[10px] text-zinc-600 font-mono mt-1 max-w-[200px]">
                      No bands booked on this date. Keep routing efficient.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {showsOnSelectedDate.map((show, sdIdx) => {
                    const isClosed = show.status === 'Closed';

                    return (
                      <div 
                        key={show.id ? `sondate-${show.id}-${sdIdx}` : `sondate-${sdIdx}`} 
                        className={`border rounded-lg p-3 space-y-3 bg-zinc-900/40 relative overflow-hidden ${
                          isClosed ? 'border-purple-900/30 opacity-80' : 'border-[#00ffcc]/30 shadow-[0_0_10px_rgba(0,255,204,0.02)]'
                        }`}
                      >
                        {/* Status bar label */}
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className={`px-1.5 py-0.5 rounded leading-none ${
                            isClosed ? 'bg-purple-900/20 text-purple-400' : 'bg-teal-500/10 text-teal-300'
                          }`}>
                            ● {show.status}
                          </span>
                          
                          <span className="text-zinc-500">ID: {show.id}</span>
                        </div>

                        <div className="text-left">
                          {show.festival_name && (
                            <span className="text-[10px] uppercase font-mono font-bold text-teal-400 block tracking-widest leading-none mb-1">
                              {show.festival_name}
                            </span>
                          )}
                          <h4 className="text-xs font-semibold text-white tracking-wide">{show.name}</h4>
                          {show.city && (
                            <span className="text-[10px] text-zinc-400 font-mono block mt-1">📍 {show.city}{show.state_province ? `, ${show.state_province}` : ''}{show.country ? `, ${show.country}` : ''}</span>
                          )}
                        </div>

                        {show.revenue !== undefined && (
                          <div className="flex justify-between items-baseline py-1 border-t border-b border-zinc-800/40 font-mono">
                            <span className="text-[8px] text-zinc-500 uppercase">Gross Settlement</span>
                            <span className="text-xs text-emerald-400 font-bold">
                              {show.currency?.includes('EUR') ? '€' : show.currency?.includes('GBP') ? '£' : '$'}
                              {(show.guarantee_amount || show.revenue || 0).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {/* IDEAS 2 & 3: Transit + Weather Widget & Show Day Milestones Checklist */}
                        {(() => {
                          const transit = getRouteTransitInfo(show);
                          const weatherData = getShowWeatherAndWarnings(show);
                          const milestones = ['Load-In', 'Merch Count-In', 'Soundcheck/Setlist Ready', 'Stall Staffed', 'Settlement Finished'];
                          const activeChecked = showMilestones[show.id] || [];
                          const pct = milestones.length > 0 ? Math.round((activeChecked.length / milestones.length) * 100) : 0;

                          return (
                            <div className="space-y-2.5 pt-2 pb-1 border-t border-zinc-800/20 font-sans text-left">
                              {/* Transit & Weather Row */}
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="bg-zinc-950/50 rounded-lg p-2 border border-zinc-850/50 flex flex-col justify-between">
                                  <div className="flex items-center gap-1 text-[#00ffcc] font-mono font-bold uppercase text-[8px]">
                                    <Milestone className="w-2.5 h-2.5" />
                                    <span>Transit Status</span>
                                  </div>
                                  {transit ? (
                                    <div className="mt-1 leading-normal font-medium text-zinc-350 text-[9.5px]">
                                      {transit.distance} mi ({transit.driveHours}h drive)<br/>
                                      <span className="text-[8px] text-zinc-500">From {transit.prevCity}</span>
                                    </div>
                                  ) : (
                                    <span className="mt-1 text-zinc-500 font-mono text-[9px] italic">First tour stop</span>
                                  )}
                                </div>
                                
                                <div className="bg-zinc-950/50 rounded-lg p-2 border border-zinc-850/50 flex flex-col justify-between">
                                  <div className="flex items-center gap-1 text-[#00ffcc] font-mono font-semibold uppercase text-[8px]">
                                    <Sun className="w-2.5 h-2.5 animate-pulse" />
                                    <span>Venue Weather</span>
                                  </div>
                                  <div className="mt-1 leading-normal font-medium text-zinc-350 text-[9.5px] flex items-center justify-between">
                                    <span>{weatherData.temp}°F • {weatherData.conditions}</span>
                                    <span className="text-[8px] text-zinc-500 font-mono">💨 {weatherData.windSpeed}mph</span>
                                  </div>
                                </div>
                              </div>

                              {/* Dynamic and Colorful Weather Warnings */}
                              {weatherData.warnings.map((warn, wIdx) => (
                                <div 
                                  key={`show-warn-${show.id}-${wIdx}`} 
                                  className={`p-2 rounded-lg border text-[9.5px] leading-relaxed flex items-start gap-1.5 ${warn.color}`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-inherit" />
                                  <div>
                                    <p className="font-bold tracking-wide uppercase text-[9.5px]">{warn.title}</p>
                                    <p className="opacity-90">{warn.description}</p>
                                  </div>
                                </div>
                              ))}

                              {/* Show Day Milestones Checklist */}
                              <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800 shadow-md space-y-2 mt-2">
                                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-300 uppercase tracking-widest border-b border-zinc-800/80 pb-2">
                                  <span className="font-bold">📋 Show-Day Milestones</span>
                                  <span className="text-[#00ffcc] font-black tracking-widest">{activeChecked.length} / {milestones.length} DONE</span>
                                </div>
                                <div className="w-full bg-black h-1.5 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    style={{ width: `${pct}%` }} 
                                    className="bg-gradient-to-r from-emerald-500 to-[#00ffcc] h-full rounded-full transition-all duration-300"
                                  />
                                </div>
                                <div className="grid grid-cols-1 gap-1.5 pt-1.5">
                                  {milestones.map((m, mIdx) => {
                                    const isDone = activeChecked.includes(m);
                                    return (
                                      <button
                                        key={`${m}-${mIdx}`}
                                        type="button"
                                        onClick={() => toggleMilestone(show.id, m)}
                                        className={`flex items-center gap-2.5 text-[11px] font-mono tracking-tight p-2.5 rounded-lg text-left border cursor-pointer select-none transition-all active:scale-[0.98] ${
                                          isDone 
                                            ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300 font-bold shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]' 
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-medium hover:bg-zinc-800'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center border-2 transition-colors ${
                                          isDone ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-black border-zinc-600'
                                        }`}>
                                          {isDone && <CheckCircle className="w-2.5 h-2.5 text-black stroke-[3]" />}
                                        </div>
                                        <span className="truncate leading-none pt-px">{m}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER SEARCH MODULE AND LISTING DETAILS */}
      <div className="bg-[#13161d] border border-zinc-800 rounded-xl p-4 space-y-3" id="filters-and-lists">
        <div className="flex flex-col gap-3">
          {/* Expanded Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c202a] border border-[#2e3444] text-white rounded p-1.5 pl-8 text-xs font-mono focus:outline-none focus:border-[#00ffcc]"
              placeholder="Search venues or cities..."
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 h-3 w-3 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Expanded Filter Selector directly under the search bar */}
          <div className="flex flex-col md:flex-row gap-2 w-full justify-between items-stretch">
            {/* Filter Tab buttons stretched evenly */}
            <div className="flex bg-[#1c1f26] border border-zinc-800 rounded p-0.5 gap-0.5 text-[9px] font-mono font-bold uppercase tracking-wider flex-grow justify-between md:justify-start">
              <button
                onClick={() => setFilterTab('upcoming')}
                className={`flex-grow px-3 py-1.5 rounded transition-colors cursor-pointer text-center ${
                  filterTab === 'upcoming' ? 'bg-[#00ffcc] text-black font-extrabold' : 'text-zinc-450 hover:text-white'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilterTab('past')}
                className={`flex-grow px-3 py-1.5 rounded transition-colors cursor-pointer text-center ${
                  filterTab === 'past' ? 'bg-[#00ffcc] text-black font-extrabold' : 'text-zinc-450 hover:text-white'
                }`}
              >
                Past
              </button>
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-grow px-3 py-1.5 rounded transition-colors cursor-pointer text-center ${
                  filterTab === 'all' ? 'bg-[#00ffcc] text-black font-extrabold' : 'text-zinc-450 hover:text-white'
                }`}
              >
                All Stops
              </button>
            </div>

            {/* Sort options/refresh controls stretched evenly */}
            <div className="flex gap-2 items-stretch flex-grow md:flex-grow-0">
              <div className="flex bg-[#1c1f26] border border-zinc-800 rounded p-0.5 gap-0.5 text-[9px] font-mono font-bold uppercase tracking-wider flex-grow justify-between md:justify-start">
                <button
                  onClick={() => setSortBy('date')}
                  className={`flex-grow px-3 py-1.5 rounded transition-colors cursor-pointer text-center ${
                    sortBy === 'date' ? 'bg-zinc-700 text-white' : 'text-zinc-450 hover:text-white'
                  }`}
                >
                  By Date
                </button>
                <button
                  onClick={() => setSortBy('revenue')}
                  className={`flex-grow px-3 py-1.5 rounded transition-colors cursor-pointer text-center ${
                    sortBy === 'revenue' ? 'bg-zinc-700 text-white' : 'text-zinc-450 hover:text-white'
                  }`}
                >
                  By Rev
                </button>
              </div>
              
              <button 
                onClick={() => {
                  triggerNotification('Schedule reloaded from cloud db.');
                  addLog('Manual schedule refresh completed.');
                }}
                className="px-3 py-1.5 rounded bg-zinc-850 hover:bg-zinc-700 text-zinc-400 border border-zinc-850 hover:text-white cursor-pointer flex items-center justify-center"
                title="Refresh stop feeds"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SHOW CARDS LIST */}
      <div className="grid grid-cols-1 gap-4 pb-6 animate-fadeIn" id="shows-listing-flow">
        {shows.length === 0 ? (
          <div 
            className="p-5 text-left border border-zinc-800 bg-[#0e1014] rounded-2xl font-mono text-zinc-300 space-y-3 shadow-lg md:col-span-2"
          >
            <p className="text-xs font-bold text-white uppercase tracking-wider text-[#FF9900]">
              📅 TOUR ROUTE EMPTY
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Get your calendar moving by creating your first event node using the buttons above. Place coordinates to track driving distances.
            </p>
          </div>
        ) : filteredShows.length === 0 ? (
          <div 
            className="py-3 text-center text-xs text-zinc-500 bg-[#0e1014] border border-dashed border-zinc-850 rounded-2xl md:col-span-2"
          >
            No matching shows found. Refine your search query.
          </div>
        ) : (
          filteredShows.map((stop, stopIdx) => {
            const isClosed = stop.status === 'Closed';
            const isCardExpanded = expandedShowCards[stop.id] ?? (stop.id === selectedShowId);
            const typeDetails = getShowTypeDetails(stop);
            const showSales = sales.filter(s => s.show_id === stop.id);
            const itemsSold = showSales.reduce((acc, current) => acc + (current.quantity || 1), 0);
            const showTotal = showSales.reduce((acc, current) => acc + (current.amount * (current.quantity || 1)), 0);
            const isTopPerformer = stats.avgPerShow > 0 && showTotal > stats.avgPerShow * 1.5;

            // Calculate driving distance
            const stopGeo = showsWithGeoCoords.find(s => s.id === stop.id);
            const currentStopDate = new Date(stop.date);
            const nextShows = showsWithGeoCoords
              .filter(s => new Date(s.date) > currentStopDate)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const nextShow = nextShows.length > 0 ? nextShows[0] : null;

            let distanceDisplay = "";
            let travelTimeDisplay = "";
            let distanceMiles = 0;
            let hours = 0;

            if (nextShow) {
              if (stopGeo?.lat && stopGeo?.lng && nextShow.lat && nextShow.lng) {
                distanceMiles = calculateDistanceMiles(stopGeo.lat, stopGeo.lng, nextShow.lat, nextShow.lng);
                distanceDisplay = `${Math.round(distanceMiles)} mi`;
                hours = distanceMiles / 65; // ~65 mph avg
                travelTimeDisplay = `~${Math.round(hours)} hrs` + (hours > 1.2 ? ' drive' : '');
              } else if (nextShow.city) {
                distanceDisplay = nextShow.city;
              } else {
                distanceDisplay = new Date(nextShow.date).toLocaleDateString();
              }
            }

            const type = stop.show_type || (stop.festival_name ? 'festival' : 'headliner');
            let borderClass = '';
            if (stop.id === selectedShowId) {
              borderClass = 'border-[#00ffcc] shadow-[#00ffcc]/10 shadow-xl ring-1 ring-[#00ffcc]/30';
            } else if (isClosed) {
              borderClass = 'border-purple-600/50 hover:border-purple-400';
            } else {
              switch (type) {
                case 'festival':
                  borderClass = 'border-teal-500/50 hover:border-teal-400';
                  break;
                case 'headliner':
                  borderClass = 'border-rose-500/50 hover:border-rose-400';
                  break;
                case 'support':
                  borderClass = 'border-indigo-500/50 hover:border-indigo-400';
                  break;
                case 'tour date':
                  borderClass = 'border-amber-550/50 hover:border-amber-400';
                  break;
                default:
                  borderClass = 'border-zinc-700/60 hover:border-zinc-500';
              }
            }

            const isLongDrive = distanceMiles > 350;

            return (
              <React.Fragment key={stop.id ? `stop-${stop.id}-${stopIdx}` : `stop-${stopIdx}`}>
                <div 
                  className={`bg-[#0c0f12] border-2 rounded-2xl flex flex-col overflow-hidden shadow-lg transition-all ${borderClass}`}
                  style={stopIdx === 0 ? { borderWidth: '3.1px', borderColor: '#000090' } : undefined}
                >
                {/* TOP SECTION (HEADER) */}
                <div 
                  onClick={() => {
                    setSelectedShowId(stop.id);
                    toggleShowCardExpanded(stop.id);
                  }}
                  className="p-4 flex flex-col gap-3.5 relative cursor-pointer hover:bg-zinc-900/10 transition-colors group"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFormShow(stop);
                    }}
                    className="absolute top-4 right-4 text-[#00ffcc] hover:text-[#00ffcc] bg-[#0c0e12]/95 hover:bg-zinc-900 border border-[#00ffcc]/30 hover:border-[#00ffcc] p-2 rounded-full transition-all duration-200 z-10 shadow-[0_0_12px_rgba(0,255,204,0.25)] hover:shadow-[0_0_20px_rgba(0,255,204,0.6)] cursor-pointer"
                    title="Edit Show"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex gap-4 items-start min-w-0 pr-8">
                    {/* Left side: Date Badge */}
                    <div className="flex flex-col items-center justify-center pt-1.5 pb-1 min-w-[55px] shrink-0 bg-zinc-950/40 border border-zinc-800/80 rounded-xl text-center shadow-inner">
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">{new Date(stop.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="text-2xl font-display font-black text-[#00ffcc] leading-none mt-1">{new Date(stop.date).getDate()}</span>
                    </div>
                    
                    {/* Right side: Title & Venue Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${typeDetails.badgeBg}`}>
                          {typeDetails.label}
                        </span>
                        {isTopPerformer && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Top Performer
                          </span>
                        )}
                        {stop.is_synced === false ? (
                          <span className="text-[9px] font-mono font-bold text-amber-500 tracking-tight block animate-pulse">[ ▰ OFFLINE CACHED ]</span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-emerald-500/80 tracking-tight block transition-all">[ ✓ SYNCED ]</span>
                        )}
                        {stop.is_community_submitted && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            🌍 Community Show
                          </span>
                        )}
                        {stop.external_ticket_url && (
                          <a 
                            href={stop.external_ticket_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] font-mono font-bold text-[#00ffcc] hover:text-black hover:bg-[#00ffcc] bg-black/60 border border-[#00ffcc]/50 px-2 py-0.5 rounded transition-all inline-flex items-center gap-1"
                          >
                            🎟️ External Tickets ↗
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerNotification?.(`Collaboration handshake initialized for event "${stop.name}". Representatives on Nexus Core can co-manage details and prevent duplicates.`);
                            addLog(`Collaborate/Claim request initiated for show: ${stop.name} (${stop.date})`);
                          }}
                          className="text-[9px] font-mono font-bold text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900 border border-purple-500/40 px-2 py-0.5 rounded transition-all inline-flex items-center gap-1"
                          title="Collaborate or claim representation on this event page"
                        >
                          🤝 Collaborate / Claim
                        </button>
                      </div>
                      
                      <h3 className="text-base font-bold text-white leading-snug font-display tracking-tight hover:text-[#00ffcc] transition-colors">
                        {stop.name}
                      </h3>
                      
                      <div className="mt-1 space-y-1 text-xs text-zinc-400">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#00ffcc] shrink-0" /> 
                          <span className="truncate text-zinc-300">
                            {stop.venue_address ? `${stop.venue_address}, ` : ''}{stop.city}{stop.state_province ? `, ${stop.state_province}` : ''}
                          </span>
                        </p>

                        {distanceDisplay && (
                          <p className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                            <span className="text-[#00ffcc] font-bold">➔</span> Next Stop: <span className="text-zinc-300 font-bold">{distanceDisplay}</span>{travelTimeDisplay ? ` (${travelTimeDisplay})` : ''}
                          </p>
                        )}
                        
                        {/* Dynamic Drive Directions Hyperlinks - ONLY SHOW WHEN EXPANDED */}
                        {isCardExpanded && (
                          <div className="flex gap-2 items-center flex-wrap pt-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-500 uppercase">Directions:</span>
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                [stop.venue_address, stop.city, stop.state_province, stop.country].filter(Boolean).join(', ') || stop.name
                              )}`}
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-[9px] font-mono font-bold text-[#00ffcc] hover:text-[#00ffd0] bg-[#00ffcc]/5 hover:bg-[#00ffcc]/15 border border-[#00ffd0]/20 px-1.5 py-0.5 rounded transition-all no-underline inline-flex items-center gap-0.5"
                            >
                              <span>Google</span>
                              <ExternalLink className="w-2 h-2 text-[#00ffcc]" />
                            </a>
                            <a 
                              href={`https://maps.apple.com/?daddr=${encodeURIComponent(
                                [stop.venue_address, stop.city, stop.state_province, stop.country].filter(Boolean).join(', ') || stop.name
                              )}`}
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-[9px] font-mono font-bold text-purple-300 hover:text-purple-200 bg-purple-500/5 hover:bg-purple-500/15 border border-purple-500/20 px-1.5 py-0.5 rounded transition-all no-underline inline-flex items-center gap-0.5"
                            >
                              <span>Apple</span>
                              <ExternalLink className="w-2 h-2 text-purple-300" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM METRICS MINI-BAR (Perfect horizontal strip with dividers) */}
                  <div className="mt-0.5 pt-2 border-t border-zinc-900/60 flex items-center justify-between text-[11px] font-mono select-none">
                    {/* Gross */}
                    <div 
                      className="flex items-center gap-1 cursor-pointer group/sales shrink-0" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setTransactionsShowId(stop.id); 
                      }}
                    >
                      <span className="text-zinc-500 uppercase text-[9px] tracking-wider shrink-0">Gross:</span>
                      <span className="font-display font-black text-white group-hover/sales:text-[#00ffcc] transition-colors shrink-0">
                        ${showTotal.toFixed(2)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#00ffcc] group-hover/sales:translate-x-0.5 transition-transform shrink-0" />
                    </div>

                    <span className="text-zinc-800 shrink-0">|</span>

                    {/* Items Sold */}
                    <div className="shrink-0">
                      <span className="text-zinc-500 text-[9px] uppercase tracking-wider mr-1">Sold:</span>
                      <span className="text-zinc-300 font-bold">{itemsSold} <span className="text-[9px] text-zinc-500">pcs</span></span>
                    </div>

                    <span className="text-zinc-800 shrink-0">|</span>

                    {/* Guarantee */}
                    <div className="text-emerald-400 flex items-center gap-1 shrink-0">
                      <span className="text-zinc-500 text-[9px] uppercase tracking-wider shrink-0">Flat:</span>
                      <span className="text-emerald-300 font-bold shrink-0">${stop.guarantee_amount || 0}</span>
                    </div>

                    <span className="text-zinc-800 shrink-0">|</span>

                    {/* Toggle Button */}
                    <div className="shrink-0">
                      <button 
                        type="button"
                        className="text-[#00ffcc] hover:text-[#00ffd0] transition-colors cursor-pointer flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase tracking-wider py-0.5 shrink-0"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          toggleShowCardExpanded(stop.id); 
                        }}
                      >
                        <span>{isCardExpanded ? 'Less' : 'More'}</span>
                        {isCardExpanded ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* COLLAPSIBLE DETAILS PANEL */}
                {isCardExpanded && (
                  <>
                    {/* ACTION BUTTON GRID */}
                    <div className="px-4 pb-4 animate-slideDown">
                      <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] font-bold tracking-wide">
                        {/* Row 1: Detail View, Open Day Sheet */}
                        <button 
                           onClick={(e) => {
                            e.stopPropagation();
                            setExpandedShowId(stop.id);
                          }}
                          className="py-2.5 rounded-lg border border-[#1b3b2d] text-[#00ffcc] bg-[#00ffcc]/5 flex items-center justify-center gap-1.5 hover:bg-[#00ffcc]/10 transition-colors cursor-pointer group"
                        >
                          <MapPin className="w-3.5 h-3.5" /> Detail View
                        </button>

                        <button 
                           onClick={(e) => {
                            e.stopPropagation();
                            setShowPitWallId(stop.id);
                          }}
                          className="py-2.5 rounded-lg border border-rose-900/50 text-rose-400 bg-rose-500/5 flex items-center justify-center gap-1.5 hover:bg-rose-900/20 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-rose-450 animate-pulse" /> Enter Pit Wall
                        </button>
                        
                        <button 
                           onClick={(e) => {
                            e.stopPropagation();
                            setDaySheetShow(stop);
                          }}
                          className="py-2.5 rounded-lg border border-purple-900/50 text-purple-400 bg-purple-500/5 flex items-center justify-center gap-1.5 hover:bg-purple-900/20 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-450" /> Open Day Sheet
                        </button>
                        
                        {/* Row 2: Duplicate, Delete */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateShow(stop);
                          }}
                          className="py-2.5 rounded-lg border border-[#2d204a] text-[#c084fc] bg-[#c084fc]/5 flex items-center justify-center gap-1.5 hover:bg-[#c084fc]/10 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </button>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActionModal({
                              type: 'remove_or_delete',
                              show: stop
                            });
                          }}
                          className="py-2.5 rounded-lg border border-[#4a1c1d] text-red-400 bg-red-400/5 flex items-center justify-center gap-2 hover:bg-red-400/10 transition-colors cursor-pointer"
                          title="Remove from Band Workspace or Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove / Delete
                        </button>

                        {/* Row 3: Spot Check, Settle Show */}
                        {!isClosed ? (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSettlementShow(stop);
                                setSettlementMode('audit');
                              }}
                              className="py-2.5 rounded-lg border border-amber-900/50 text-amber-400 bg-amber-500/5 flex items-center justify-center gap-1.5 hover:bg-amber-900/20 transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Spot Check
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSettlementShow(stop);
                                setSettlementMode('final');
                              }}
                              className="py-2.5 rounded-lg border border-emerald-900/50 text-emerald-400 bg-emerald-500/5 flex items-center justify-center gap-1.5 hover:bg-emerald-900/20 transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Settle Show
                            </button>
                          </>
                        ) : (
                          <PostShowReview 
                            show={stop} 
                            triggerNotification={triggerNotification} 
                            addLog={addLog} 
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* BOTTOM METRICS */}
                    <div className="px-4 py-3 bg-[#080a0c] border-t border-zinc-900 flex justify-between items-center">
                      <div className="text-[11px] text-zinc-500 font-mono tracking-wider flex items-center gap-1.5 w-full">
                        {(() => {
                          const stopGeo = showsWithGeoCoords.find(s => s.id === stop.id);
                          const currentStopDate = new Date(stop.date);
                          const nextShows = showsWithGeoCoords
                            .filter(s => new Date(s.date) > currentStopDate)
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                          
                          const nextShow = nextShows.length > 0 ? nextShows[0] : null;

                          let distanceDisplay = "Distance to next show: No other shows booked";
                          let timeDisplay = null;

                          if (nextShow) {
                            distanceDisplay = `Distance to next show: ${nextShow.city || 'TBA'}`;
                            if (stopGeo?.lat && stopGeo?.lng && nextShow.lat && nextShow.lng) {
                              const distanceMiles = calculateDistanceMiles(stopGeo.lat, stopGeo.lng, nextShow.lat, nextShow.lng);
                              distanceDisplay = `Distance to next show: ${Math.round(distanceMiles)} mi`;
                              const hours = distanceMiles / 65; // Assume ~65 mph avg
                              timeDisplay = `~${Math.round(hours)} hrs drive`;
                            } else if (nextShow.city && stopGeo?.city) {
                               distanceDisplay = `Distance to next show: ${nextShow.city}`;
                            } else {
                               distanceDisplay = `Distance to next show: ${new Date(nextShow.date).toLocaleDateString()}`;
                            }
                          }
                          
                          return (
                            <>
                              <span>{distanceDisplay}</span>
                              {timeDisplay && (
                                <span className="text-[11px] text-zinc-600 font-mono ml-auto">
                                  {timeDisplay}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}
                
              </div>

              {isLongDrive && nextShow && (
                <div className="bg-[#0e1014] border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_15px_rgba(245,158,11,0.04)] animate-fadeIn my-2">
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/25 text-amber-400 shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest block leading-none">OVERNIGHT SAFETY ALERT</span>
                      <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                        Excessive Drive Distance: {stop.city || 'Current Stop'} ➔ {nextShow.city || 'Next Stop'} ({Math.round(distanceMiles)} mi)
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        This trip requires <span className="text-zinc-200 font-semibold">~{Math.round(hours)} hours</span> of continuous driving. Overnight travel of this length is unsafe for a single driver.
                      </p>
                    </div>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl text-left font-mono text-[10px] space-y-1.5 shrink-0 max-w-sm w-full md:w-auto">
                    <span className="text-amber-400 font-bold uppercase tracking-wider block text-[9px]">💡 Recommended Protocols</span>
                    <p className="text-zinc-400 leading-normal font-sans">
                      • Multi-driver shift rotate (every 150 miles).<br />
                      • Secure midway resting stop / overnight motel.<br />
                      • Avoid midnight fatiguing windows (2:00 AM - 5:00 AM).
                    </p>
                  </div>
                </div>
              )}

              {/* 3.B: DYNAMIC SCENE FIT ROUTING ASSISTANT FOR GAPS */}
              {(() => {
                if (!nextShow) return null;
                const d1 = new Date(stop.date);
                const d2 = new Date(nextShow.date);
                const diffTime = Math.abs(d2.getTime() - d1.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays <= 1) return null;

                const matchedVenueName = "Chain Reaction";
                const matchedMatchPercentage = 98;

                return (
                  <div className="my-3 p-4 bg-[#0a0518] border border-purple-900/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between text-xs font-mono shadow-[0_0_15px_rgba(168,85,247,0.1)] gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2.5 text-zinc-300 text-left">
                      <span className="text-purple-400 font-bold text-lg animate-pulse">⚡</span>
                      <p className="font-sans text-zinc-300 leading-relaxed">
                        <span className="font-mono text-purple-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">ROUTING RADAR COOP</span>
                        ⚡ High Scene Fit Suggestion: <span className="text-[#00ffcc] font-black font-display">{matchedVenueName}</span> ({matchedMatchPercentage}% Match) is within your active transit corridor vector.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (triggerNotification) {
                          triggerNotification(`📍 Routing assistant pre-loaded ${matchedVenueName} profile in Black Book directory.`);
                        }
                      }}
                      className="text-purple-400 hover:text-purple-300 underline font-bold cursor-pointer shrink-0 ml-2 whitespace-nowrap text-xs font-mono select-none"
                    >
                      Tap to open profile
                    </button>
                  </div>
                );
              })()}
            </React.Fragment>
          );
        })
        )}
      </div>

      {/* IDEA 1: Dynamic Tour Progress Metrics & Countdown Header (MOVED UNDER SHOW CARDS) */}
      <div className="bg-[#13161d]/85 border border-[#2e3444] rounded-xl p-4 space-y-3 shadow-lg backdrop-blur-sm select-none my-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]"></span>
            </span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400">Tour Campaign Progress</span>
          </div>
          <span className="text-xs font-mono font-bold text-[#00ffcc]">
            {tourProgression.completed} of {tourProgression.total} Stops Finalized
          </span>
        </div>

        {/* Graphical Progression Bar */}
        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800 p-[1.5px]">
          <div 
            style={{ width: `${tourProgression.progressPercent}%` }} 
            className="bg-gradient-to-r from-emerald-500 to-[#00ffcc] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,255,204,0.4)]"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 font-sans">
          <div className="bg-zinc-950/40 p-2 rounded-lg border border-zinc-900 text-left">
            <span className="text-[8px] font-mono font-bold text-zinc-500 block uppercase">Completion</span>
            <span className="text-sm font-bold text-white tracking-tight">{tourProgression.progressPercent}%</span>
          </div>
          <div className="bg-zinc-950/40 p-2 rounded-lg border border-zinc-900 text-left">
            <span className="text-[8px] font-mono font-bold text-zinc-500 block uppercase">Projected Rev</span>
            <span className="text-sm font-bold text-emerald-400 tracking-tight">${tourProgression.totalProjectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="bg-zinc-950/40 p-2 rounded-lg border border-zinc-900 text-left">
            <span className="text-[8px] font-mono font-bold text-zinc-500 block uppercase">Next Active</span>
            <span className="text-[10px] font-bold text-[#c084fc] tracking-tight truncate block">
              {tourProgression.nextShow ? new Date(tourProgression.nextShow.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Tour Done!'}
            </span>
          </div>
        </div>
      </div>

      {/* MOVED POSITION: THE 5 DYNAMIC TILES (MOVED TO BOTTOM) */}
      <div className="w-full overflow-x-auto scrollbar-none">
        <div className="flex gap-2.5 pt-2 pb-1 min-w-[680px]" id="bottom-metric-tiles">
          {/* SHOW GUARANTEES */}
          <div className="bg-[#13161d] border border-[#00ffcc]/25 rounded-xl p-2.5 flex-1 flex flex-col items-center justify-center text-center hover:border-[#00ffcc]/50 transition-all shadow-md min-w-[125px]">
            <div className="flex items-center gap-1 justify-center whitespace-nowrap">
              <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 whitespace-nowrap">Show Guarantees</span>
              <DollarSign className="w-3 h-3 text-[#00ffcc] shrink-0" />
            </div>
            <div className="mt-1 flex flex-col items-center whitespace-nowrap">
              <span className="text-xl font-display font-black text-[#00ffcc] whitespace-nowrap" style={{ fontSize: '18px' }}>${stats.totalGuarantees.toLocaleString()}</span>
              <span className="text-[8px] text-zinc-500 font-mono block mt-0.5 whitespace-nowrap">Aggregate flat guarantees</span>
            </div>
          </div>

          {/* TOTAL SALES */}
          <div className="bg-[#13161d] border border-emerald-500/20 rounded-xl p-2.5 flex-1 flex flex-col items-center justify-center text-center hover:border-emerald-500/40 transition-all shadow-md min-w-[120px]">
            <div className="flex items-center gap-1 justify-center whitespace-nowrap">
              <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 whitespace-nowrap">Total Sales</span>
              <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
            </div>
            <div className="mt-1 flex flex-col items-center whitespace-nowrap">
              <span className="text-xl font-display font-black text-emerald-400 whitespace-nowrap" style={{ fontSize: '18px' }}>${stats.totalSales.toFixed(2)}</span>
              <span className="text-[8px] text-zinc-500 font-mono block mt-0.5 whitespace-nowrap">Aggregate tour gross</span>
            </div>
          </div>

          {/* ITEMS SOLD */}
          <div className="bg-[#13161d] border border-purple-500/20 rounded-xl p-2.5 flex-1 flex flex-col items-center justify-center text-center hover:border-purple-500/40 transition-all shadow-md min-w-[120px]">
            <div className="flex items-center gap-1 justify-center whitespace-nowrap">
              <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 whitespace-nowrap">Items Sold</span>
              <TrendingUp className="w-3 h-3 text-purple-400 shrink-0" />
            </div>
            <div className="mt-1 flex flex-col items-center whitespace-nowrap">
              <span className="text-xl font-display font-black text-purple-400 whitespace-nowrap" style={{ fontSize: '18px' }}>{stats.itemsSold} units</span>
              <span className="text-[8px] text-zinc-500 font-mono block mt-0.5 whitespace-nowrap">Table merc volume</span>
            </div>
          </div>

          {/* AVG/SHOW */}
          <div className="bg-[#13161d] border border-amber-500/20 rounded-xl p-2.5 flex-1 flex flex-col items-center justify-center text-center hover:border-amber-500/40 transition-all shadow-md min-w-[120px]">
            <div className="flex items-center gap-1 justify-center whitespace-nowrap">
              <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 whitespace-nowrap">Avg / Show</span>
              <DollarSign className="w-3 h-3 text-amber-500 shrink-0" />
            </div>
            <div className="mt-1 flex flex-col items-center whitespace-nowrap">
              <span className="text-xl font-display font-black text-amber-400 whitespace-nowrap" style={{ fontSize: '18px' }}>${stats.avgPerShow.toFixed(2)}</span>
              <span className="text-[8px] text-zinc-500 font-mono block mt-0.5 whitespace-nowrap">Show revenue average</span>
            </div>
          </div>

          {/* CITIES */}
          <div className="bg-[#13161d] border border-pink-500/20 rounded-xl p-2.5 flex-1 flex flex-col items-center justify-center text-center hover:border-pink-500/40 transition-all shadow-md min-w-[120px]">
            <div className="flex items-center gap-1 justify-center whitespace-nowrap">
              <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 whitespace-nowrap">Cities</span>
              <Globe className="w-3 h-3 text-pink-500 shrink-0" />
            </div>
            <div className="mt-1 flex flex-col items-center whitespace-nowrap">
              <span className="text-xl font-display font-black text-pink-500 whitespace-nowrap" style={{ fontSize: '18px' }}>{stats.citiesCount}</span>
              <span className="text-[8px] text-zinc-500 font-mono block mt-0.5 whitespace-nowrap">Stops with location</span>
            </div>
          </div>
        </div>
      </div>

      <ShowFormModal
        isOpen={isFormModalOpen || !!editingFormShow}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingFormShow(null);
        }}
        shows={shows}
        editingShow={editingFormShow}
        onDuplicate={handleDuplicateShow}
        onSubmit={handleSaveFormShow}
        initialShowType={formInitialType}
      />

      {showActionModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1117] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Unlink className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Manage Show / Tour Stop</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">{showActionModal.show.name} • {showActionModal.show.date}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowActionModal(null)}
                className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                How would you like to handle <strong className="text-white">"{showActionModal.show.name}"</strong>?
              </p>

              {/* Option 1: Remove from Band Workspace (Keep in Community Shows) */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Globe className="w-4 h-4" />
                      <span>Remove from Band Workspace Only</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">Recommended</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-normal">
                      Removes this show from your active band calendar, day sheets, and settlements, but <strong>preserves it live in the Community Shows Hub</strong> for fans, attendees, and promoters.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFromBandWorkspace(showActionModal.show.id, showActionModal.show.name)}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <Unlink className="w-3.5 h-3.5" /> Remove from Band (Keep in Community Hub)
                </button>
              </div>

              {/* Option 2: Delete Permanently Everywhere */}
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/15 hover:bg-red-950/25 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently Everywhere</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Completely deletes this show from the database. It will be removed from both this Band Workspace and the public Community Shows section.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteShow(showActionModal.show.id, showActionModal.show.name)}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                </button>
              </div>
            </div>

            <div className="p-3 bg-black/40 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowActionModal(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {transactionsShowId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-[#1b3b2d] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-black/40">
              <h2 className="text-white font-bold tracking-wide">Transactions</h2>
              <button 
                onClick={() => setTransactionsShowId(null)}
                className="p-2 hover:bg-zinc-800/60 rounded-full text-zinc-400 hover:text-white transition-colors"
                title="Close"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2 flex-1 scrollbar-none">
              {(() => {
                const showSales = sales.filter(s => s.show_id === transactionsShowId);
                if (showSales.length === 0) {
                  return <div className="text-center py-8 text-zinc-500 font-mono text-xs">No transactions recorded for this show.</div>;
                }
                return showSales.map((sale, sIdx) => (
                  <div key={sale.id ? `sale-${sale.id}-${sIdx}` : `sale-${sIdx}`} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {sale.quantity}x {sale.item_name || 'Item'}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(sale.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[15px] font-bold text-[#00ffcc] tracking-wide">
                        ${(sale.amount * (sale.quantity || 1)).toFixed(2)}
                      </span>
                      <span className="block text-[9px] text-zinc-500 font-mono uppercase mt-1">
                        {sale.payment_method}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {showTokenConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e1118] border border-zinc-700 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#00ffcc]" />
                <h3 className="font-display text-white text-sm font-bold tracking-wide">Mapbox Token Configuration</h3>
              </div>
              <button 
                onClick={() => setShowTokenConfigModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Enter your Mapbox public access token (<code className="text-[#00ffcc] font-mono text-[11px]">pk.eyJ...</code>) to activate high-performance live 3D routing & fly-to navigation on this device or APK installation.
            </p>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1 font-bold">Public Access Token</label>
              <input
                type="text"
                value={tokenInputVal}
                onChange={(e) => setTokenInputVal(e.target.value)}
                placeholder="Paste your Mapbox access token..."
                className="w-full bg-[#161a24] border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ffcc]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {activeMapboxToken ? (
                <button
                  type="button"
                  onClick={() => handleSaveMapboxToken('')}
                  className="text-[11px] text-red-400 hover:text-red-300 font-mono transition-colors underline cursor-pointer"
                >
                  Clear Token
                </button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTokenConfigModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveMapboxToken(tokenInputVal)}
                  className="px-4 py-1.5 rounded-lg bg-[#00ffcc] text-black font-bold text-xs hover:bg-[#00ffcc]/80 transition-colors cursor-pointer shadow-md shadow-[#00ffcc]/20"
                >
                  Save & Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {settlementShow && (
        <SettlementTerminal
          show={settlementShow}
          mode={settlementMode || 'final'}
          sales={sales}
          inventory={inventory}
          onClose={() => { setSettlementShow(null); setSettlementMode(null); }}
          setShows={setShows}
          triggerNotification={triggerNotification}
          addLog={addLog}
        />
      )}

      {daySheetShow && (
        <DaySheetPrintView
          show={daySheetShow}
          sales={sales}
          isOpen={!!daySheetShow}
          onClose={() => setDaySheetShow(null)}
          activeBandName={bandName || 'Artist'}
          triggerNotification={triggerNotification}
        />
      )}

      {/* Pit Wall Drawer */}
      <AnimatePresence>
        {showPitWallId && (() => {
          const show = shows.find(s => s.id === showPitWallId);
          if (!show) return null;
          
          const messages = pitWallMessages[showPitWallId] || [];

          return (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[400px] bg-[#0c0f12] border-l border-rose-900/40 z-[200] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h3 className="font-display font-black text-rose-500 uppercase tracking-widest text-sm">
                      The Pit Wall
                    </h3>
                  </div>
                  <p className="text-zinc-400 text-[10px] font-mono truncate">{show.name}</p>
                </div>
                <button
                  onClick={() => setShowPitWallId(null)}
                  className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* System Notice */}
              <div className="px-4 py-3 bg-rose-950/20 border-b border-rose-900/30 text-center">
                <p className="text-[9px] font-mono uppercase text-rose-400 font-bold tracking-wider">
                  ⚠️ Live Session Active<br/>
                  <span className="text-zinc-500 font-normal">Destructs 6hrs post-show</span>
                </p>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar flex flex-col-reverse">
                {[...messages].reverse().map((msg, mIdx) => (
                  <div key={msg.id ? `msg-${msg.id}-${mIdx}` : `msg-${mIdx}`} className={`flex flex-col ${msg.user === 'You' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[10px] font-bold text-zinc-300">{msg.user}</span>
                      <span className="text-[8px] font-mono text-zinc-600">{msg.time}</span>
                    </div>
                    <div className={`px-3 py-2 rounded-xl max-w-[85%] text-sm ${msg.user === 'You' ? 'bg-rose-600 text-white rounded-br-sm' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                <div className="flex flex-col items-start opacity-70">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[10px] font-bold text-rose-400">SYSTEM</span>
                    <span className="text-[8px] font-mono text-zinc-600">--:--</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-transparent border border-rose-900/30 text-zinc-400 text-xs italic font-mono">
                    Pit Wall initialized for {show.city}. Keep it brutal.
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPitWallMessage.trim()) return;
                    setPitWallMessages(prev => {
                      const existing = prev[showPitWallId] || [];
                      return {
                        ...prev,
                        [showPitWallId]: [
                          ...existing, 
                          { id: Date.now().toString(), user: 'You', text: newPitWallMessage, time: 'Just now' }
                        ]
                      };
                    });
                    setNewPitWallMessage('');
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newPitWallMessage}
                    onChange={(e) => setNewPitWallMessage(e.target.value)}
                    placeholder="Scream into the void..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-rose-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newPitWallMessage.trim()}
                    className="p-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}

// ==========================================
// END-OF-NIGHT SETTLEMENT ASSISTANT TERMINAL
// ==========================================

interface SignaturePadProps {
  label: string;
  onClear: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ label, onClear, canvasRef }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = '#00ffcc'; // Custom neon accent signature colour
    context.lineWidth = 2.5;
    contextRef.current = context;

    // Background of signature square
    context.fillStyle = '#080a0c';
    context.fillRect(0, 0, rect.width, rect.height);
  }, [canvasRef]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    let clientX, clientY;
    if ('touches' in e.nativeEvent) {
      clientX = e.nativeEvent.touches[0].clientX;
      clientY = e.nativeEvent.touches[0].clientY;
    } else {
      clientX = e.nativeEvent.clientX;
      clientY = e.nativeEvent.clientY;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    let clientX, clientY;
    if ('touches' in e.nativeEvent) {
      if (e.cancelable) e.preventDefault();
      clientX = e.nativeEvent.touches[0].clientX;
      clientY = e.nativeEvent.touches[0].clientY;
    } else {
      clientX = e.nativeEvent.clientX;
      clientY = e.nativeEvent.clientY;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (contextRef.current) {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    }
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = contextRef.current;
    if (!context) return;
    
    const rect = canvas.getBoundingClientRect();
    context.fillStyle = '#080a0c';
    context.fillRect(0, 0, rect.width, rect.height);
    onClear();
  };

  return (
    <div className="flex flex-col gap-1 sm:gap-2">
      <span className="text-[8px] sm:text-[9px] uppercase font-mono tracking-wider text-zinc-500 font-bold text-left">{label}</span>
      <div className="relative border border-zinc-800/80 rounded-xl overflow-hidden bg-[#080a0c]">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-24 sm:h-28 cursor-crosshair touch-none block"
        />
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute bottom-1 right-1 p-1 px-1.5 text-[8px] font-mono rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer uppercase font-bold"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

interface SettlementTerminalProps {
  show: Show;
  mode: 'audit' | 'final';
  sales: Sale[];
  inventory: any[];
  onClose: () => void;
  setShows: React.Dispatch<React.SetStateAction<Show[]>>;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
}

const SettlementTerminal: React.FC<SettlementTerminalProps> = ({
  show,
  mode,
  sales,
  inventory,
  onClose,
  setShows,
  triggerNotification,
  addLog
}) => {
  const showSales = useMemo(() => sales.filter(s => s.show_id === show.id), [sales, show.id]);
  const grossMerchSales = useMemo(() => showSales.reduce((acc, s) => acc + (s.amount * (s.quantity || 1)), 0), [showSales]);
  
  const [expectedCounts, setExpectedCounts] = useState<Record<string, number>>({});
  const [currentCounts, setCurrentCounts] = useState<Record<string, number>>({});
  
  const [venueApparelCutPct, setVenueApparelCutPct] = useState(20);
  const [venueMediaCutPct, setVenueMediaCutPct] = useState(10);
  const [guaranteeAmount, setGuaranteeAmount] = useState(show.guarantee_amount || 0);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedAudit, setIsSavedAudit] = useState(false);

  const artistCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const venueCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastInitializedShowIdRef = useRef<string | null>(null);

  // Load snapshots or initiate defaults
  useEffect(() => {
    if (lastInitializedShowIdRef.current === show.id) {
      return;
    }
    lastInitializedShowIdRef.current = show.id;

    const cacheKey = `nexus_core_settlement_draft_${show.id}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.expectedCounts) setExpectedCounts(parsed.expectedCounts);
        if (parsed.currentCounts) setCurrentCounts(parsed.currentCounts);
        if (parsed.venueApparelCutPct !== undefined) setVenueApparelCutPct(parsed.venueApparelCutPct);
        if (parsed.venueMediaCutPct !== undefined) setVenueMediaCutPct(parsed.venueMediaCutPct);
        if (parsed.guaranteeAmount !== undefined) setGuaranteeAmount(parsed.guaranteeAmount);
        return;
      } catch (e) {
        console.error('Error parsing settlement draft', e);
      }
    }

    const initialsExp: Record<string, number> = {};
    const initialsCurrent: Record<string, number> = {};
    
    inventory.forEach((item) => {
      const reportedSold = showSales
        .filter(s => s.item_name === item?.name)
        .reduce((sum, s) => sum + (s.quantity || 1), 0);
        
      const exp = item.table_stock !== undefined ? item.table_stock : 30;
      initialsExp[item.id] = exp;
      initialsCurrent[item.id] = Math.max(0, exp - reportedSold);
    });
    
    setExpectedCounts(initialsExp);
    setCurrentCounts(initialsCurrent);
  }, [inventory, show.id, showSales]);

  // Sync draft edits to local reactive state cache
  useEffect(() => {
    if (Object.keys(expectedCounts).length > 0) {
      const cacheKey = `nexus_core_settlement_draft_${show.id}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        expectedCounts,
        currentCounts,
        venueApparelCutPct,
        venueMediaCutPct,
        guaranteeAmount
      }));
    }
  }, [expectedCounts, currentCounts, venueApparelCutPct, venueMediaCutPct, guaranteeAmount, show.id]);

  const isMediaItemType = (typeStr: string) => {
    const t = (typeStr || '').toUpperCase();
    return t.includes('CD') || t.includes('MEDIA') || t.includes('VINYL') || t.includes('ALBUM') || t.includes('CASSETTE');
  };

  const { mediaGross, apparelGross } = useMemo(() => {
    let media = 0;
    let apparel = 0;
    showSales.forEach((s) => {
      if (isMediaItemType(s.item_type) || isMediaItemType(s.item_name)) {
        media += s.amount * (s.quantity || 1);
      } else {
        apparel += s.amount * (s.quantity || 1);
      }
    });
    return { mediaGross: media, apparelGross: apparel };
  }, [showSales]);

  const gridData = useMemo(() => {
    return inventory.map((item) => {
      const exp = expectedCounts[item.id] !== undefined ? expectedCounts[item.id] : (item.table_stock || 30);
      const sold = showSales
        .filter(s => s.item_name === item?.name)
        .reduce((sum, s) => sum + (s.quantity || 1), 0);
      const curr = currentCounts[item.id] !== undefined ? currentCounts[item.id] : Math.max(0, exp - sold);
      
      const variance = exp - curr - sold; // Variance Formula
      const penalty = variance > 0 ? (variance * (item.price || 0)) : 0;
      
      return {
        ...item,
        exp,
        sold,
        curr,
        variance,
        penalty
      };
    });
  }, [inventory, expectedCounts, currentCounts, showSales]);

  const totalVariancePenalty = useMemo(() => {
    return gridData.reduce((sum, d) => sum + d.penalty, 0);
  }, [gridData]);

  const venueApparelCut = apparelGross * (venueApparelCutPct / 100);
  const venueMediaCut = mediaGross * (venueMediaCutPct / 100);
  const venueRawCut = venueApparelCut + venueMediaCut;
  const netVenueCut = Math.max(0, venueRawCut - totalVariancePenalty);
  const bandNetPayout = guaranteeAmount + grossMerchSales - netVenueCut;

  const handleSaveSnapshot = async () => {
    setIsSaving(true);
    const supabase = getSupabase();
    const payload = {
      show_id: show.id,
      created_at: new Date().toISOString(),
      snapshot_data: {
        expectedCounts,
        currentCounts,
        grossMerchSales,
        totalVariancePenalty
      }
    };

    try {
      if (supabase) {
        const { error } = await supabase.from('show_audit_snapshots_v1').insert([payload]);
        if (error) {
          console.warn('[Offline Mode Backing snapshot]', error.message);
          addLog(`Audit Sync Warning: PostgreSQL SNAPSHOT write offline cache loaded.`);
        } else {
          addLog(`Audit snapshot synced successfully to database for show: ${show.name}`);
        }
      }
      
      localStorage.setItem(`nexus_core_audit_snapshot_offline_${show.id}`, JSON.stringify(payload));
      setIsSavedAudit(true);
      triggerNotification('Show audit snapshot successfully saved!');
    } catch (e: any) {
      console.error(e);
      addLog(`Snapshot local backup created. Supabase: ${e.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setIsSavedAudit(false), 3000);
    }
  };

  const handleCommitFinalClose = async () => {
    const artistSig = artistCanvasRef.current?.toDataURL('image/png') || '';
    const venueSig = venueCanvasRef.current?.toDataURL('image/png') || '';

    if (mode === 'final' && (!artistSig || !venueSig)) {
      triggerNotification('Required: Artist/TM and Venue representative must sign off.');
      return;
    }

    setIsSaving(true);
    const supabase = getSupabase();
    const settlementPayload = {
      show_id: show.id,
      created_at: new Date().toISOString(),
      gross_merch_sales: grossMerchSales,
      venue_cut_apparel_pct: venueApparelCutPct,
      venue_cut_media_pct: venueMediaCutPct,
      show_guarantee: guaranteeAmount,
      variance_penalty_total: totalVariancePenalty,
      net_venue_cut: netVenueCut,
      band_net_payout: bandNetPayout,
      artist_signature: artistSig,
      venue_signature: venueSig,
      status: 'settled'
    };

    try {
      if (supabase) {
        const { error: sError } = await supabase.from('show_settlements_v1').insert([settlementPayload]);
        if (sError) {
          console.warn('[Postgres inserts skipped/not found]', sError.message);
          addLog(`Db Settle Table Notice: Data payload successfully cached locally.`);
        }
      }

      const updatedShow = { ...show, status: 'Closed' as const, revenue: bandNetPayout };
      setShows(prev => prev.map(s => s.id === show.id ? updatedShow : s));
      
      if (supabase) {
        await supabase
          .from('shows')
          .update({ status: 'Closed', revenue: bandNetPayout })
          .eq('id', show.id);
      }

      localStorage.setItem(`nexus_core_settlement_final_${show.id}`, JSON.stringify(settlementPayload));
      localStorage.removeItem(`nexus_core_settlement_draft_${show.id}`);
      
      triggerNotification(`Show settled and locked! Net Payout: $${bandNetPayout.toFixed(2)}`);
      onClose();
    } catch (e: any) {
      console.error(e);
      const updatedShow = { ...show, status: 'Closed' as const, revenue: bandNetPayout };
      setShows(prev => prev.map(s => s.id === show.id ? updatedShow : s));
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0c0e12] z-[60] overflow-y-auto w-full h-full scrollbar-none">
      <div className="w-full max-w-5xl mx-auto min-h-screen bg-[#0c0e12] md:border-x md:border-zinc-800 flex flex-col shadow-2xl">
        
        {/* Header Ribbon */}
        <div className="p-4 sm:p-6 border-b border-zinc-805 bg-zinc-950/45 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full ${
                mode === 'audit' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
              }`}>
                {mode === 'audit' ? 'LIVE SPOT CHECK (AUDIT)' : 'FINAL END-OF-NIGHT CLOSE'}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {show.date ? new Date(show.date).toLocaleDateString() : ''}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight mt-1">
              Settlement Assistant: {show.name}
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">{show.city || 'Tour Stop'}</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer hover:rotate-90 text-[10px] uppercase font-bold"
            title="Exit"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Panel Workspace */}
        <div className="p-4 sm:p-6 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 flex-1 flex flex-col lg:flex-row">
          
          {/* LEFT COLUMN: Inventory Verification Grid */}
          <div className="space-y-4 flex flex-col">
            <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-sans text-left flex items-center">
                  1. Shift Inventory Out-Counts
                  <FieldIntel content="Verify physical item out-counts at the end of the show against register logs to highlight discrepancies." />
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono text-left">Set expected starting stock, verify sales, out-count remainder</p>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 font-bold bg-zinc-900 px-2 py-1 rounded">
                Items: {gridData.length}
              </span>
            </div>

            {/* Inventory scroll box */}
            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {gridData.length === 0 ? (
                <div className="p-5 text-left border-2 border-dashed border-zinc-800 bg-black/40 rounded-xl font-mono text-zinc-400 space-y-3">
                  <p className="text-[10px] uppercase font-bold text-[#8b5cf6]">● RECONCILIATION PROCEDURES: SETTLEMENT TERMINAL</p>
                  <ul className="space-y-2 text-[9.5px] leading-relaxed tracking-wide uppercase">
                    <li className="flex items-start gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <span className="text-[#8b5cf6] font-bold">1.</span>
                      <span>Load starting inventory levels and compare with final physical item out-counts at the end of the show.</span>
                    </li>
                    <li className="flex items-start gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <span className="text-[#8b5cf6] font-bold">2.</span>
                      <span>Configure venue splits for apparel and group media to calculate the venue's cut dynamically in real-time.</span>
                    </li>
                    <li className="flex items-start gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <span className="text-[#8b5cf6] font-bold">3.</span>
                      <span>Verify and commit the final financial snapshot to reconcile variance penalties and lock the tour stop.</span>
                    </li>
                  </ul>
                </div>
              ) : (
                gridData.map((item, gdIdx) => (
                  <div key={item.id ? `gd-${item.id}-${gdIdx}` : `gd-${gdIdx}`} className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-3 flex flex-col gap-2 hover:bg-zinc-900/40 transition-colors">
                    <div className="flex gap-3 items-center">
                      <div className="w-9 h-9 bg-zinc-950 rounded bg-cover bg-center border border-zinc-800/50 shrink-0 flex items-center justify-center text-zinc-600 font-bold text-xs"
                           style={item.image_url ? { backgroundImage: `url(${item.image_url})` } : undefined}>
                        {!item.image_url && '👕'}
                      </div>
                      <div className="flex-grow text-left">
                        <span className="text-[8px] font-mono text-[#00ffcc] uppercase tracking-widest font-bold">{item.item_type || 'Merchandise'}</span>
                        <h4 className="text-xs font-bold text-white tracking-wide truncate">{item?.name}</h4>
                        <div className="flex justify-between mt-0.5 font-mono text-[9px] text-zinc-500">
                          <span>Price: ${(item.price || 0).toFixed(2)} retail</span>
                          {item.sku && <span>SKU: {item.sku}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 items-center text-center font-mono">
                      {/* Expected / Allocation Input */}
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">Starting</span>
                        <input
                          type="number"
                          min="0"
                          value={item.exp}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setExpectedCounts(prev => ({ ...prev, [item.id]: val }));
                          }}
                          className="w-full text-center bg-zinc-950 text-xs text-zinc-300 rounded border border-zinc-800 py-1 focus:border-[#00ffcc] focus:outline-none"
                        />
                      </div>

                      {/* Sold (Read-Only) */}
                      <div className="flex flex-col text-left bg-zinc-950/20 p-1 rounded border border-zinc-900">
                        <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider text-center">App Sold</span>
                        <span className="text-xs text-center font-bold text-[#00ffcc] py-0.5">{item.sold}</span>
                      </div>

                      {/* Counted Input */}
                      <div className="flex flex-col text-left col-span-2">
                        <span className="text-[8px] text-emerald-400 uppercase font-black tracking-wider">Physical Counted</span>
                        <input
                          type="number"
                          min="0"
                          value={item.curr}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setCurrentCounts(prev => ({ ...prev, [item.id]: val }));
                          }}
                          className="w-full text-center bg-zinc-950 font-bold text-xs text-emerald-400 rounded border-2 border-emerald-900/60 focus:border-[#00ffcc] focus:ring-1 focus:ring-[#00ffcc]/30 py-0.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Variance warning flag with details */}
                    {item.variance !== 0 && (
                      <div className={`p-2 rounded text-[10px] font-mono flex items-center justify-between ${
                        item.variance > 0 
                          ? 'bg-rose-950/20 border border-rose-900/30 text-rose-400' 
                          : 'bg-teal-950/20 border border-teal-900/30 text-teal-400'
                      }`}>
                        <span className="flex items-center gap-1.5 text-left">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {item.variance > 0 
                              ? `Missing Count: ${item.variance} unit(s) under-count` 
                              : `Surplus Overage: ${Math.abs(item.variance)} unit(s) over-count`}
                          </span>
                        </span>
                        <span className="font-extrabold ml-2 text-right">
                          {item.variance > 0 ? `-$${item.penalty.toFixed(2)}` : `+$0.00`}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Mid-Show Save snap block */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveSnapshot}
                className={`w-full py-3 ${
                  !navigator.onLine
                    ? 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-600/50 text-white shadow-amber-600/15'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-400'
                } border rounded-xl font-bold uppercase text-xs tracking-wider font-mono flex justify-center items-center gap-2 transition-all cursor-pointer`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Preserving snapshot...' : !navigator.onLine ? (isSavedAudit ? '✓ AUDIT DRAFT SAVED TO DEVICE!' : '[ SAVE TO DEVICE PROGRESS ]') : (isSavedAudit ? '✓ AUDIT DRAFT PRESERVED!' : '[ SAVE PROGRESS ]')}
              </button>
              <p className="text-[9px] text-zinc-500 font-mono text-center mt-1">
                Saves physical snapshot counts into Supabase table "show_audit_snapshots_v1". Safe to exit and return.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Financial Split & Reconciliation Form */}
          <div className="space-y-4 flex flex-col justify-between bg-zinc-950/20 p-4 border border-zinc-900 rounded-2xl">
            <div className="space-y-4">
              <div className="text-left">
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-sans">2. Financial Split Reconciliation</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Calculate real-time splits deducting inventory variance</p>
              </div>

              {/* Dynamic math form */}
              <div className="space-y-3 font-mono text-xs">
                
                {/* Gross Merch pre-filled */}
                <div className="flex justify-between items-center bg-zinc-950 p-2.5 border border-zinc-900 rounded-xl">
                  <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Gross Merch Sales</span>
                  <span className="text-sm font-black text-[#00ffcc]">${grossMerchSales.toFixed(2)}</span>
                </div>

                {/* Splits detail */}
                <div className="bg-black/40 border border-zinc-900 rounded-xl p-3 space-y-2.5 text-left">
                  <span className="text-[9px] uppercase font-black text-zinc-500 block">Cut Split Adjustments</span>
                  
                  {/* Apparel split % */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 flex items-center">
                      Venue Apparel Cut
                      <FieldIntel content="The standard physical commission cut percentage reserved for venue hall-staffing and space-rent adjustments." />
                    </span>
                    <div className="flex items-center gap-1 w-20 justify-end">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={venueApparelCutPct}
                        onChange={(e) => setVenueApparelCutPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-12 bg-zinc-950 text-center border border-zinc-800 rounded py-0.5 text-xs text-white"
                      />
                      <span className="text-zinc-400">%</span>
                    </div>
                  </div>

                  {/* Media split % */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 flex items-center">
                      Venue Media Cut
                      <FieldIntel content="Commission cut dedicated exclusively for music physical records, video, CDs, vinyl, or cassette tape formats." />
                    </span>
                    <div className="flex items-center gap-1 w-20 justify-end">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={venueMediaCutPct}
                        onChange={(e) => setVenueMediaCutPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-12 bg-zinc-950 text-center border border-zinc-800 rounded py-0.5 text-xs text-white"
                      />
                      <span className="text-zinc-400">%</span>
                    </div>
                  </div>

                  {/* Contracted guarantee input */}
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-900">
                    <span className="text-zinc-400 flex items-center">
                      Show Guarantee
                      <FieldIntel content="Minimum base flat-rate currency fee promised to the artists by venue promoters before accounting retail items sales." />
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">$</span>
                      <input
                        type="number"
                        min="0"
                        value={guaranteeAmount}
                        onChange={(e) => setGuaranteeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 bg-zinc-950 text-center border border-zinc-800 rounded py-0.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Automated Math flow summary */}
                <div className="bg-zinc-950/80 p-3 border border-zinc-900 rounded-xl space-y-1.5 text-[11px] leading-relaxed text-left">
                  <span className="text-[8px] uppercase font-bold text-zinc-500 block">Calculation Summary</span>
                  
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Apparel Sells ({genrePercentage(apparelGross, grossMerchSales)}%)</span>
                    <span className="text-zinc-300">${apparelGross.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Media Sells ({genrePercentage(mediaGross, grossMerchSales)}%)</span>
                    <span className="text-zinc-300">${mediaGross.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between font-bold border-t border-zinc-900 text-zinc-400 pt-1">
                    <span>Venue Raw Cut</span>
                    <span>${venueRawCut.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-rose-400 font-extrabold pb-0.5">
                    <span className="flex items-center">
                      Unresolved Stock Variance Penalties
                      <FieldIntel content="Variance Penalty automatically deducts missing inventory retail values directly from the venue's final cash settlement cut." />
                    </span>
                    <span className="font-extrabold ml-2 text-right">
                      -${totalVariancePenalty.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-t border-zinc-900 pt-1 font-bold text-zinc-300">
                    <span>Net Venue Cut Owed</span>
                    <span>${netVenueCut.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-[#00ffcc] font-black text-xs sm:text-[13px] border-t border-dashed border-zinc-800 pt-1.5">
                    <span>BAND NET PAYOUT</span>
                    <span>${bandNetPayout.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature & Submit Block */}
            <div className="space-y-4 pt-3 border-t border-zinc-900/80 mt-4">
              
              {/* HTML5 Drawpads side-by-side inside Final mode */}
              <div className="grid grid-cols-2 gap-3">
                <SignaturePad
                  label="[ ARTIST / TM SIGNATURE ]"
                  onClear={() => {}}
                  canvasRef={artistCanvasRef}
                />
                <SignaturePad
                  label="[ VENUE REPRESENTATIVE ]"
                  onClear={() => {}}
                  canvasRef={venueCanvasRef}
                />
              </div>

              {/* Commit close button */}
              {mode === 'final' ? (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleCommitFinalClose}
                  className="w-full py-3.5 bg-emerald-500 hover:brightness-110 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex justify-center items-center"
                >
                  {isSaving ? 'Synching Final Settlement...' : '[ COMMIT SETTLEMENT & CLOSE SHOW ]'}
                </button>
              ) : (
                <div className="p-3 text-center bg-amber-500/5 border border-amber-500/15 rounded-xl">
                  <p className="text-[9px] text-amber-500 font-mono tracking-wide leading-relaxed uppercase">
                    Audit (Spot Check) Mode Active. Exit or Save Draft counts above. Sign-off signatures and full terminal close requires entering closing mode.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

// Helper percentage maker
function genrePercentage(val: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((val / total) * 100);
}
