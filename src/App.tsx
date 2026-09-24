import { usePromoterOffers } from './hooks/usePromoterOffers';
import { useTourNotes } from './hooks/useTourNotes';
import { useGlobalDataSync } from './hooks/useGlobalDataSync';
import { AppNavigationBar } from './components/navigation/AppNavigationBar';
import { HomeDashboardView } from "./components/dashboard/HomeDashboardView";
import SalesWorkspace from './components/portals/Band/SalesWorkspace';
import FinanceWorkspace from './components/portals/Band/FinanceWorkspace';
import EventsWorkspace from './components/portals/Band/EventsWorkspace';
import LoginView from "./components/LoginView";
import WorkspaceRegistrationWizard from "./components/WorkspaceRegistrationWizard";
import RecentSalesFeed from './components/portals/Band/RecentSalesFeed';
import { useBandManagement } from './hooks/useBandManagement';
import { useTourLogistics } from './hooks/useTourLogistics';
import { MetricsSplitCard, FinanceCarouselCard, FourCardAutoCarousel, DecoupledFinanceCards, TourNotesWidget, TourNotesCard, BlackBookWidget, BlackBookCard } from './components/dashboard/cards';
import { LiveInventoryCard } from './components/dashboard/LiveInventoryCard';
import { LiveTeamActivityCard } from './components/dashboard/LiveTeamActivityCard';
import { CashDrawerLedgerCard } from './components/dashboard/CashDrawerLedgerCard';
import { HomeV2DashboardView } from './components/dashboard/HomeV2DashboardView';
import { BrandNavigationHeader } from './components/navigation/BrandNavigationHeader';
import { NexusTopBar } from './components/navigation/NexusTopBar';
import { GlobalModalsContainer } from './components/modals/GlobalModalsContainer';
import { useModalStore } from './store/useModalStore';
import { MainTabRouter } from './components/views/MainTabRouter';
import { AnimatedCount, AnimatedText } from "./components/AnimatedElements";
import { BAND_PORTAL_BILLING } from './config/billingMatrix';
import { useBandState } from "./hooks/useBandState";
import { useInventoryState } from "./hooks/useInventoryState";
import { useOffersManagement } from "./hooks/useOffersManagement";
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import InteractiveRoutePreview from './components/portals/Band/InteractiveRoutePreview';
import { inventoryStore, posSalesStore, itinerariesStore, socialFeedStore, reviewsStore, showsStore, registrationStagingStore, venuesStore, offersStore, routingBeaconsStore, creativeNodesStore, expensesStore, profileStore } from './utils/indexedDB';
import { wipeAllLocalData } from './utils/resetApp';
import { registerNotificationsOnStartup } from './services/pushNotificationService';
import { initializeSonicActivityListeners } from './services/sonicFootprintService';
import { formatTimeAgo, extractUUID } from './utils/socialFeedUtils';
import { 
  Menu, 
  ChevronDown, 
  ChevronUp,
  Cloud, 
  RefreshCw, 
  Flag, 
  Calendar, 
  BarChart2, 
  Settings, 
  Trash2, 
  Plus, 
  Briefcase,
  Check,
  X,
  Sparkles,
  TrendingUp, 
  MessageSquare, 
  ExternalLink,
  DollarSign,
  MapPin,
  Clock,
  ArrowRight,
  Database,
  CheckCircle,
  FileText,
  Radio,
  Send,
  Star,
  Play,
  Mic,
  Wifi,
  WifiOff,
  Disc,
  Home,
  Package,
  ChevronRight,
  ChevronLeft,
  Tag,
  CloudSun,
  CloudOff,
  Wind,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Truck,
  Table,
  CheckSquare,
  Square,
  ListTodo,
  Compass,
  Lock,
  Coffee,
  User,
  Fuel,
  Gauge,
  Repeat,
  Upload,
  Edit2,
  AlertTriangle,
  Plane,
  Share2,
  Flame,
  LogOut,
  Award,
  UserPlus,
  BookOpen,
  Printer,
  HelpCircle,
  Eye,
  EyeOff,
  Terminal,
  Building,
  Phone,
  Copy,
  Download,
  Shield,
  Globe,
  ShoppingCart,
  Users,
  Bell,
  Ticket,
  TrendingDown,
  Banknote,
  CreditCard,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sale, Show, InventoryItem, TourNote, Band, UserProfile, ChecklistItem, BankItem, Flight, InventoryAudit, UserReview, LoyaltyMember, Offer, DbNotification, SubscriptionTier, StagedDistroItem, AssetRevenueSplit, CashTransaction, BandJoinRequest, RegisteredWorkspaceRef, hasRegisteredWorkspace, normalizeRegisteredWorkspaces } from './types';
import { communityBandManager, isCommunityBandRecord } from './lib/communityBands';
import { isMiguelNameOrProfile } from './components/social/utils/profileUtils';
import { initOfflineQueue, getSupabase, testSupabaseConnection, getSupabaseUrl, getSupabaseAnonKey, subscribeToTable, sanitizeInventoryItemForDb, executeWithSchemaResilience, getOfflineQueue, processOfflineQueue, isBypassRequiredError, handleDatabaseFailover, saveToFailoverCache, generateUUID, uploadBase64ToStorage, fetchUserBands, sanitizeBandPayload, ensureValidSupabaseAuthSession, autoSyncCreativeProfile, fetchUserCreatives, resolveInventoryImageUrl } from './supabase';
import AlbumArt from './components/AlbumArt';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useSubscriptionTimer } from './hooks/useSubscriptionTimer';
import InventoryView from './components/portals/Band/InventoryView';
import MerchWorkspaceWrapper from './components/portals/Band/MerchWorkspaceWrapper';
import NotificationCenterView from './components/NotificationCenterView';
import ShowsView, { getShowWeatherAndWarnings } from './components/portals/Band/ShowsView';
import SalesDashboardView from './components/sales/SalesDashboardView';
import SettingsView from './components/SettingsView';
import SettingsWorkspace from './components/SettingsWorkspace';
import TourNotesView from './components/portals/Band/TourNotesView';
import SetlistsView from './components/portals/Band/SetlistsView';
import ReportsView from './components/portals/Band/ReportsView';
import GuestlistsView from './components/portals/Band/GuestlistsView';
import AddItemView from './components/portals/Band/AddItemView';
import CashDrawerView from './components/portals/Band/CashDrawerView';
import TourChecklistView from './components/portals/Band/TourChecklistView';
import PromoHubView from './components/portals/Band/PromoHubView';
import PlansView from './components/PlansView';
import TermsOfServiceView from './components/TermsOfServiceView';
import BlackBookView from './components/portals/Band/BlackBookView';
import MerchandisePrintersView from './components/portals/Band/MerchandisePrintersView';
import SplashView from './components/SplashView';
import CreativeDashboardViewV2 from './components/portals/Creative/CreativeDashboardViewV2';
import CreativesHubView from './components/portals/Band/CreativesHubView';
import HelpDeskView from './components/HelpDeskView';
import CustomerPayView from './components/sales/CustomerPayView';
import PremiumGate from './components/PremiumGate';
import PromoterPortalView from './components/portals/Promoter/PromoterPortalView';
import PromoterDashboardViewV2 from './components/portals/Promoter/PromoterDashboardViewV2';
import CoOpRouteStagingView from './components/portals/Band/CoOpRouteStagingView';
import RoutingBeaconForm from './components/portals/Promoter/RoutingBeaconForm';
import PublicVIPKioskView from './components/portals/Band/PublicVIPKioskView';
import LandingView from './components/LandingView';
import GuestPassConfirmView from './components/GuestPassConfirmView';
import OnRouteEssentialsView from './components/portals/Band/OnRouteEssentialsView';
import DevBandDistroDeck from './components/portals/Band/DevBandDistroDeck';
import { V2ExpandableCard } from './components/V2ExpandableCard';
import LabelDashboardViewV2 from './components/portals/Label/LabelDashboardViewV2';
import { UniversalSocialFeed, GENRE_REACTION_MATRICES } from './components/social/UniversalSocialFeed';
import StudioWorkspaceWrapper from './components/studio/StudioWorkspaceWrapper';
import { FloatingChatHead } from './components/messaging/FloatingChatHead';
import { AvatarPopupOverlay } from './components/messaging/AvatarPopupOverlay';
import LiveTeamActivityWorkspace from './components/portals/Band/LiveTeamActivityWorkspace';
import { FLAGS } from './types';
const concertBg = "https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/High%20energy%20concert%202.png";


// Helper to resolve coordinates for a show
function getShowCoordinates(show: Show): { lat: number; lng: number } {
    if (show.id === "show_stop_102") return { lat: 40.7358, lng: -73.9546 };
  if (show.id === "show_stop_103") return { lat: 39.6654, lng: -105.2054 };

  const cityLower = (show.city || '').toLowerCase().trim();
  const addressLower = (show.venue_address || '').toLowerCase().trim();

  const cityMatches: { [key: string]: { lat: number; lng: number } } = {
    chicago: { lat: 41.8781, lng: -87.6298 },
    brooklyn: { lat: 40.7358, lng: -73.9546 },
    "new york": { lat: 40.7128, lng: -74.0060 },
    denver: { lat: 39.7392, lng: -104.9903 },
    morrison: { lat: 39.6536, lng: -105.1911 },
    austin: { lat: 30.2672, lng: -97.7431 },
    seattle: { lat: 47.6062, lng: -122.3321 },
    losangeles: { lat: 34.0522, lng: -118.2437 },
    "los_angeles": { lat: 34.0522, lng: -118.2437 },
    nashville: { lat: 36.1627, lng: -86.7816 },
    london: { lat: 51.5074, lng: -0.1278 }
  };

  for (const [key, coords] of Object.entries(cityMatches)) {
    if (cityLower.includes(key) || addressLower.includes(key)) {
      return coords;
    }
  }

  const str = (show.venue_address || show.name || show.id || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 25.0 + Math.abs((hash % 1000) / 1000) * 24.0;
  const lng = -124.0 + Math.abs(((hash >> 3) % 1000) / 1000) * 53.0;
  return { lat, lng };
}

function compressImageAtModuleLevel(base64Str: string, maxWidth = 1920, maxHeight = 1080, quality = 0.92): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width <= 0 || height <= 0) {
        resolve(base64Str);
        return;
      }
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/webp', quality));
        } catch (e) {
          resolve(base64Str);
        }
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

// Haversine formula to find distance between two coordinates
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const dKm = R * c;
  const dMi = dKm * 0.621371;
  return { miles: Math.round(dMi), km: Math.round(dKm) };
}

// A custom component to animate numbers/counts smoothly in real-time
const CREATIVE_CORE_SKILLS: Record<string, string[]> = {
  ARTIST_DESIGNER: ['LOGO_ART', 'ALBUM_ARTWORK', 'LAYOUT_DESIGN', 'GRAPHIC_DESIGN', 'MERCHANDISE_DESIGN', 'TYPOGRAPHY_LETTERING', 'ANIMATION_MOTION', '3D_RENDERING'],
  SOUND_RECORDING: ['MIX_MASTER', 'FOH_SOUND', 'SYSTEM_MONITOR_TECH'],
  PHOTO_VIDEO_SOCIAL: ['PHOTOGRAPHY', 'VIDEO_PRODUCTION', 'MUSIC_VIDEO_DIRECTOR'],
  SESSION_MUSICIAN_TECHS: ['TOUR_MANAGEMENT', 'SESSION_MUSICIAN', 'LIGHTING_DIRECTOR', 'STAGE_DESIGN', 'BOOKING_AGENT']
};

const GENRE_CLUSTERS = [
  {
    name: 'CLUSTER 01: EXTREME METAL',
    genres: ['DEATH METAL', 'SLAMMING BDM', 'BRUTAL DEATH METAL', 'BRUTAL DEATHCORE', 'TECHNICAL BDM', 'DEATH N\' ROLL', 'TECH DEATH', 'BLASTING BDM', 'GRINDCORE', 'DEATHGRIND', 'GOREGRIND/PORNOGRIND', 'THRASH METAL', 'DEATH THRASH', 'MELODIC DEATH', 'OSDM', 'DOOM', 'BLACK METAL', 'BLACKENED DEATH', 'SYMPHONIC BLACK', 'DEATHCORE', 'PROGRESSIVE DEATH']
  },
  {
    name: 'CLUSTER 02: ROCK/HEAVY METAL',
    genres: ['TRADITIONAL HEAVY METAL', 'DOOM METAL', 'STONER METAL', 'SLUDGE METAL', 'STONER ROCK', 'PROG METAL', 'POWER METAL', 'ALTERNATIVE ROCK', 'GOTHIC ROCK', 'HARD ROCK', 'NEW WAVE', 'FOLK METAL', 'AVANT-GARDE', 'DJENT', 'MATHCORE', 'MATH ROCK', 'SHOE GAZE', 'NOISE ROCK', 'INDIE ROCK', 'NU METAL']
  },
  {
    name: 'CLUSTER 03: HARDCORE',
    genres: ['TRADITIONAL HARDCORE', 'METALCORE', 'BEATDOWN', 'YOUTH CREW', 'FASTCORE', 'POST HARDCORE', 'MELODIC HARDCORE', 'SKRAMZ/SCREAMO', 'POWER VIOLENCE', 'MINCECORE']
  },
  {
    name: 'CLUSTER 04: PUNK/ALTERNATIVE',
    genres: ['PUNK ROCK', 'POP PUNK', 'MATH ROCK', 'MIDWEST EMO', 'SKATE PUNK', 'MELODIC PUNK', 'INDIE PUNK', 'POST PUNK', 'GRUNGE']
  },
  {
    name: 'CLUSTER 05: INDUSTRIAL/EDM',
    genres: ['EBM', 'SYNTHWAVE', 'DARKWAVE/COLD WAVE', 'AGGROTECH/TERROR EBM', 'TECHNO', 'INDUSTRIAL METAL', 'DUBSTEP', 'DRUM & BASS', 'GABBER/HARDSTYLE', 'BREAKCORE', 'HARSH NOISE WALL', 'WITCH HOUSE']
  },
  {
    name: 'CLUSTER 06: HIP HOP/RAP',
    genres: ['UNDERGROUND RAP', 'TRAP', 'BOOM BAP', 'PHONK', 'DRILL', 'CLOUD RAP', 'EXPERIMENTAL', 'GRIME']
  }
];

interface LoginViewProps {
  onLogin: (customProfile?: UserProfile, customBand?: Band, selectBandId?: string) => void;
  userProfile: UserProfile;
  initialTab?: 'unlock' | 'signup';
  onTabChange?: (tab: 'unlock' | 'signup') => void;
  triggerNotification?: (msg: string) => void;
  isUpgradeMode?: boolean;
}


export default function App() {

  const [userProfile, setUserProfile] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_user_profile');
      if (!saved || saved === 'null') return null;
      const parsed = JSON.parse(saved);
      if (parsed) {
        if (parsed.account_type === 'fan' || parsed.account_type === 'fan_only') {
          parsed.active_workspace = 'fan_only';
        } else {
          parsed.active_workspace = 'industry_pro';
          if (parsed.account_type === 'pro' || parsed.account_type === 'band' || parsed.account_type === 'creative' || parsed.account_type === 'promoter' || parsed.account_type === 'label') {
            parsed.account_type = 'industry_pro';
          }
        }
        if (!parsed.console_handle || parsed.console_handle === 'user' || parsed.console_handle === '@user' || parsed.console_handle.toLowerCase().includes('virulent')) {
          parsed.console_handle = '@bdmCEO';
        }
        if (!parsed.handle || parsed.handle === 'user' || parsed.handle === '@user' || parsed.handle.toLowerCase().includes('virulent')) {
          parsed.handle = '@bdmCEO';
        }
      }
      return parsed;
    } catch (_) {
      return null;
    }
  });
  const {
    bands, setBands,
    activeBandId, setActiveBandId,
    currentLoadedBandId, setCurrentLoadedBandId,
    editingBand, setEditingBand,
    deletingBandId, setDeletingBandId,
    bandLineup, setBandLineup,
    crewMembers, setCrewMembers,
    bandLogoUrl, setBandLogoUrl,
    bandCoverUrl, setBandCoverUrl,
    selectedMicroGenres, setSelectedMicroGenres,
    bandJoinRequests, setBandJoinRequests
  } = useBandState();

  // Centralized Modal Registry Store
  const {
    isModalOpen, setIsModalOpen,
    modalType, setModalType,
    selectedSaleReceipt, setSelectedSaleReceipt,
    isBandModalOpen, setIsBandModalOpen,
    isCashDrawerOpen, setIsCashDrawerOpen,
    isQuickActionPanelOpen, setIsQuickActionPanelOpen,
    isPttOpen, setIsPttOpen,
    isTransferModalOpen, setIsTransferModalOpen,
    transferPreselectedId, setTransferPreselectedId,
    isLiveTeamActivityOpen, setIsLiveTeamActivityOpen,
    showWorkspaceRegistration, setShowWorkspaceRegistration,
    isSettingsDrawerOpen, setIsSettingsDrawerOpen,
    openTransferModal, openCashDrawer, openBandModal, openWorkspaceRegistration, openSettingsDrawer
  } = useModalStore();
  
  // Security Clearance and Member simulation state
  const [activeClearanceLevel, setActiveClearanceLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_active_clearance_level');
      return saved ? Number(saved) : 5;
    } catch (_) {
      return 5;
    }
  });
  const [simulatedMemberId, setSimulatedMemberId] = useState<string>(() => {
    return localStorage.getItem('nexus_core_simulated_member_id') || 'l1';
  });

  useEffect(() => {
    if (localStorage.getItem('WIPED_ONCE_JULY_16_11_50') !== 'true') {
       localStorage.setItem('WIPED_ONCE_JULY_16_11_50', 'true');
       wipeAllLocalData();
    }
    registerNotificationsOnStartup();
    initializeSonicActivityListeners();
  }, []);

  // Suppress "Invalid Refresh Token" from Supabase if it throws an unhandled rejection
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason.message === 'string' && event.reason.message.includes('Invalid Refresh Token')) {
        console.warn('Supabase Auth Warning: Invalid Refresh Token. Suppressing unhandled rejection.', event.reason.message);
        event.preventDefault(); // Prevents the error from crashing the app or showing Error Boundary
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

      const [isPttRecording, setIsPttRecording] = useState<boolean>(false);

  const [isInitialHydrated, setIsInitialHydrated] = useState(false);
  const activeBandIdRef = useRef<string>('');
  const userProfileRef = useRef<any>(null);



  const isRosterOwner = userProfile?.role === 'owner' || userProfile?.role === 'admin';

  const isTabRestricted = (tab: string, clearance: number) => {
    // Level 5 has unrestricted access to everything
    if (clearance >= 5) return false;

    // Level 1: Only events (shows) and social (social)
    if (clearance === 1) {
      const allowed = ['shows', 'social', 'home-v2', 'home', 'plans', 'terms', 'help-desk', 'checklist'];
      return !allowed.includes(tab);
    }

    // Level 2: same as level 1 + POS checkout (new-sale)
    if (clearance === 2) {
      const allowed = ['shows', 'social', 'new-sale', 'home-v2', 'home', 'plans', 'terms', 'help-desk', 'checklist'];
      return !allowed.includes(tab);
    }

    // Level 3: Level 1 & 2 + inventory (inventory, add-item)
    if (clearance === 3) {
      const allowed = ['shows', 'social', 'new-sale', 'inventory', 'add-item', 'home-v2', 'home', 'plans', 'terms', 'help-desk', 'checklist'];
      return !allowed.includes(tab);
    }

    // Level 4: Level 1-3 + finance (reports)
    if (clearance === 4) {
      const allowed = ['shows', 'social', 'new-sale', 'inventory', 'add-item', 'reports', 'home-v2', 'home', 'plans', 'terms', 'help-desk', 'checklist'];
      return !allowed.includes(tab);
    }

    return false;
  };

  const isSubNavRestricted = (nav: string, clearance: number) => {
    if (clearance >= 5) return false;
    
    if (nav === 'SALES' && clearance < 2) return true;
    if (nav === 'MERCH' && clearance < 3) return true;
    if (nav === 'FINANCE' && clearance < 4) return true;
    if (nav === 'SETTINGS' && clearance < 5) return true;
    
    return false;
  };


  // Navigation tabs and connection states
  const [musicTrackCount, setMusicTrackCount] = useState<number>(0);
  const [busCallTime, setBusCallTime] = useState<string>(() => { try { return localStorage.getItem('tour_bus_call_time') || "23:30"; } catch(e) { return "23:30"; } });
  const [lockupTime, setLockupTime] = useState<string>(() => { try { return localStorage.getItem('tour_lockup_time') || "23:45"; } catch(e) { return "23:45"; } });
  const [isTime24Hour, setIsTime24Hour] = useState<boolean>(() => { try { return localStorage.getItem('tour_time_is_24h') !== 'false'; } catch(e) { return true; } });
  const [isEditingBusCall, setIsEditingBusCall] = useState<boolean>(false);
  // Tour Logistics Hook
  const tourLogistics = useTourLogistics();
  const {
    isWeatherForecastExpanded, setIsWeatherForecastExpanded,
    customNavDestination, setCustomNavDestination,
    isWaypointsExpanded, setIsWaypointsExpanded,
    isInteractiveMapExpanded, setIsInteractiveMapExpanded,
    isFuelCalculatorExpanded, setIsFuelCalculatorExpanded,
    isPreDriveChecklistExpanded, setIsPreDriveChecklistExpanded,
    isDriverRotationExpanded, setIsDriverRotationExpanded,
    vehicleType, setVehicleType,
    fuelPrice, setFuelPrice,
    customMpg, setCustomMpg,
    activeDriver, setActiveDriver,
    driveHoursElapsed, setDriveHoursElapsed,
    checkedPreDriveItems, setCheckedPreDriveItems,
    waypoints, setWaypoints,
    newWaypointName, setNewWaypointName,
    newWaypointType, setNewWaypointType,
    localWeather, weatherLoading, weatherError, currentCoords, fetchLocalWeather,
    tourStatusIndex, setTourStatusIndex,
    isTourStatusPaused, setIsTourStatusPaused,
    isHoveringTourStatus, setIsHoveringTourStatus,
    lastInteractionTime, registerTourStatusInteraction,
    handleStatusTouchStart, handleStatusTouchMove, handleStatusTouchEnd
  } = tourLogistics;
  const [tempBusCallTime, setTempBusCallTime] = useState<string>("23:30");
  const [tempLockupTime, setTempLockupTime] = useState<string>("23:45");
  const [isOfflineSimActive, setIsOfflineSimActive] = useState<boolean>(false);
  const [isSyncBadgeExpanded, setIsSyncBadgeExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'home-v2' | 'inventory' | 'reports' | 'shows' | 'settings' | 'new-sale' | 'notes' | 'setlists' | 'guestlist' | 'add-item' | 'promo-hub' | 'plans' | 'terms' | 'black-book' | 'flights' | 'merchandise-printers' | 'help-desk' | 'pay-portal' | 'creatives-hub' | 'checklist' | 'landing' | 'on-route-essentials' | 'distro-deck' | 'distro-deck-v2' | 'social' | 'studio' | 'creative' | 'promoter' | 'label'>('social');
  const [distroDeckSubTab, setDistroDeckSubTab] = useState<'feed' | 'merch' | 'fans' | 'customizer' | 'alliances' | 'music'>('music');
  const [settingsExpandedSection, setSettingsExpandedSection] = useState<string>('');
  const [promoHubSubTab, setPromoHubSubTab] = useState<'distro' | 'stories' | 'loyalty'>('distro');
  const [promoHubSelectedItemId, setPromoHubSelectedItemId] = useState<string | undefined>(undefined);
  const [promoCardActiveSlot, setPromoCardActiveSlot] = useState<'distro' | 'stories' | 'loyalty'>('distro');
  const [blackBookCardActiveSlot, setBlackBookCardActiveSlot] = useState<'A' | 'B'>('A');
  const [onRouteVenueAddress, setOnRouteVenueAddress] = useState<string | null>(null);

  const [inlineCashDrawerAddingType, setInlineCashDrawerAddingType] = useState<'starting_bank' | 'bank_drop' | 'payout' | 'expense' | 'cash_sale' | null>(null);
  const [inlineCashDrawerAmount, setInlineCashDrawerAmount] = useState<string>('');
  const [inlineCashDrawerDescription, setInlineCashDrawerDescription] = useState<string>('');
  const [inlineCashDrawerActiveFilter, setInlineCashDrawerActiveFilter] = useState<'all' | 'starting_bank' | 'bank_drop' | 'payout' | 'expense' | 'cash_sale'>('all');

  const [dashboardV2ActiveNav, setDashboardV2ActiveNav] = useState<'EVENTS' | 'SALES' | 'MERCH' | 'FINANCE' | 'SOCIAL' | 'SETTINGS' | 'STUDIO'>('EVENTS');

  const [activeEventsSection, setActiveEventsSection] = useState<string | null>(null);
  const [isV2StoryCreatorExpanded, setIsV2StoryCreatorExpanded] = useState<boolean>(false);
  const [v2RoleMenuOpen, setV2RoleMenuOpen] = useState<boolean>(false);
  const dashboardScrollPos = useRef<number>(0);
  const dashboardRef = useRef<HTMLDivElement>(null);
        

  

  // When returning to home tab, restore scroll position
  useLayoutEffect(() => {
    if (activeTab === 'home' && dashboardRef.current) {
      dashboardRef.current.scrollTop = dashboardScrollPos.current;
    }
  }, [activeTab]);

  // Swipeable Post Preview Feed in Promo card
  const [allianceActivePostIndex, setAllianceActivePostIndex] = useState<number>(0);
  const [allianceCommentText, setAllianceCommentText] = useState<string>('');
  const [previewReactionMenuOpenFor, setPreviewReactionMenuOpenFor] = useState<string | null>(null);
  const [previewFollowedActs, setPreviewFollowedActs] = useState<Record<string, boolean>>({});
  const [alliancePosts, setAlliancePosts] = useState<any[]>(() => {
    const cached = localStorage.getItem('distro_db_announcements');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const defaultAnnouncements = [
      {
        id: 'post_4',
        type: 'merch_drop',
        timestamp: 'June 23, 20260 at 2:40 PM',
        message: 'New "Desert Decay" long sleeves just hit the store. Heavyweight cotton, discharge print. Grab yours before they are gone.',
        tag: 'Merch Haul',
        author: { name: 'GATECREEPER', avatar: 'GC', role: 'Artist' },
        merchData: {
          name: 'Desert Decay Longsleeve',
          price: 35,
          thumbnail: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          sizes: ['S', 'M', 'L', 'XL']
        },
        likes_count: 215,
        user_liked: false,
        comments: [
          { id: 'c_gc1', username: 'riff_lord', text: 'Discharge print quality on these is top tier! Copped an XL.', time: '2 hours ago' },
          { id: 'c_gc1_r1', parent_comment_id: 'c_gc1', username: 'GATECREEPER', text: 'Hell yeah! Shipping out today. Thanks for the support!', time: '1 hour ago' }
        ]
      },
      {
        id: 'post_5',
        type: 'promo',
        timestamp: 'June 18, 2026 at 4:32 PM',
        message: '🔴 NEW VINYL DROP! The Ritual Sewer Gates Double Splatter LP is now staged on our physical distribution desk. Strictly limited to 300 heavy wax pieces worldwide.',
        tag: 'Band Announcement',
        author: { name: 'Artist', avatar: 'BD', role: 'Artist', isYou: true },
        image_url: 'https://images.unsplash.com/photo-1542208998-f6dbbb27a72f?q=80&w=650&auto=format&fit=crop',
        likes_count: 42,
        user_liked: false,
        comments: [
          { id: 'c_1', username: 'analog_fiend', text: 'Stunning double wax colorway! Just triggered simulated order checkout.', time: '1 hour ago' },
          { id: 'c_2', username: 'synth_cultist', text: 'Will these be loaded into the tour van stash for the Detroit gig?', time: '30 mins ago' },
          { id: 'c_2_r1', parent_comment_id: 'c_2', username: 'TOMB MOLD', text: 'Yes! Stashing 50 copies for the merch table at the Sanctuary.', time: '15 mins ago' }
        ]
      }
    ];
    return defaultAnnouncements;
  });

  const handleAlliancePostReaction = (postId: string, reactionType: string) => {
    const updated = alliancePosts.map((post) => {
      if (post.id === postId) {
        let reactions = post.reactions;
        if (!reactions || !Array.isArray(reactions)) {
          reactions = [
            { type: 'hype', count: post.likes_count || 12, active: post.user_liked || false },
            { type: 'token_heavy_energy', count: Math.round((post.likes_count || 12) * 0.4), active: false },
            { type: 'token_movement_vibe', count: 0, active: false },
            { type: 'token_collectible_classic', count: 0, active: false },
            { type: 'token_aesthetic', count: Math.round((post.likes_count || 12) * 0.25), active: false },
            { type: 'token_disappointment', count: 0, active: false },
            { type: 'token_rejection', count: 0, active: false }
          ];
        } else {
          reactions = reactions.map((r: any) => ({ ...r }));
        }

        reactions = reactions.map((r: any) => {
          if (r.type === reactionType) {
            const newActive = !r.active;
            return {
              ...r,
              active: newActive,
              count: newActive ? r.count + 1 : Math.max(0, r.count - 1)
            };
          }
          return r;
        });

        const hypeReact = reactions.find((r: any) => r.type === 'hype');
        return {
          ...post,
          reactions,
          likes_count: hypeReact ? hypeReact.count : post.likes_count,
          user_liked: hypeReact ? hypeReact.active : post.user_liked
        };
      }
      return post;
    });
    setAlliancePosts(updated);
    localStorage.setItem('distro_db_announcements', JSON.stringify(updated));
    
    const matrix = GENRE_REACTION_MATRICES['metal'] || {};
    const emoji = matrix[reactionType]?.icon || '🔥';
    const label = matrix[reactionType]?.label || 'Hype';
    
    // Sync Notification to Supabase for author only
    const targetPost = alliancePosts.find((p) => p.id === postId);
    if (targetPost) {
      const actorName = userProfile?.name || userProfile?.console_handle || 'A user';
      const postSnippet = (targetPost.content || targetPost.message || 'transmission').substring(0, 50);
      const targetUserId = targetPost.author?.email || targetPost.author?.name || 'author';
      
      // Resolve target receiver UUID for the author (never fall back to current user)
      const validReceiverUUID = (targetUserId && extractUUID(targetUserId)) || null;
      
      if (validReceiverUUID && validReceiverUUID !== userProfile?.id) {
        const notifId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (extractUUID(postId) || '00000000-0000-0000-0000-000000000000');
        const notifItem = {
          id: notifId,
          user_id: validReceiverUUID,
          title: `🔥 NEW REACTION`,
          message: `${actorName} reacted (${label}) to your transmission: "${postSnippet}"`,
          category: 'REACTION',
          timeAgo: 'Just now',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          read: false,
          is_read: false,
          type: 'post_reaction',
          postId: postId,
          linkTab: 'feed',
        };

        try {
          const supabaseClient = getSupabase();
          if (supabaseClient) {
            supabaseClient.from('nexus_notifications').insert([{
              id: notifItem.id,
              user_id: validReceiverUUID,
              title: notifItem.title,
              message: notifItem.message,
              category: 'REACTION',
              type: 'post_reaction',
              is_read: false,
              data: notifItem,
              created_at: new Date().toISOString(),
            }]).then(({ error }) => {
              if (error) console.error("Notification insert error:", error);
            });
          }
        } catch (err) {
          console.warn('Sync notice:', err);
        }
      }
    }
  };

  // Blocked Promoters state

  // Monospace dark-brutalist notification states


  const [notifications, setNotifications] = useState<DbNotification[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Safeguard: Deduplicate stored notifications
          const seenIds = new Set<string>();
          const seenMessages = new Map<string, number>();
          return parsed.filter((notif: DbNotification) => {
            if (!notif || !notif.id) return false;
            if (seenIds.has(notif.id)) return false;
            seenIds.add(notif.id);

            const msgKey = `${notif.category || ''}:${notif.message}`;
            const notifTime = new Date(notif.created_at).getTime();
            if (seenMessages.has(msgKey)) {
              const prevTime = seenMessages.get(msgKey)!;
              if (Math.abs(notifTime - prevTime) < 5000) {
                return false;
              }
            }
            seenMessages.set(msgKey, notifTime);
            return true;
          });
        }
      }
    } catch (_) {}
    return [];
  });

  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [pendingOpenShowsForm, setPendingOpenShowsForm] = useState(false);
  const [pendingFlightIsAdding, setPendingFlightIsAdding] = useState(false);
  const [autoExpandShowId, setAutoExpandShowId] = useState<string | null>(null);
  const [autoOpenSettlementShowId, setAutoOpenSettlementShowId] = useState<string | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_core_user_profile');
      return !saved || saved === 'null';
    } catch (_) {
      return true;
    }
  });
  const [showSplash, setShowSplash] = useState(true);
  const [loginInitialTab, setLoginInitialTab] = useState<'unlock' | 'signup'>('unlock');
  const [isUpgradeMode, setIsUpgradeMode] = useState<boolean>(false);


  // Seamless sign-up on page load for team invitations
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('accept_invite') === '1') {
      setLoginInitialTab('signup');
      setIsLoggedOut(true);
      setShowSplash(false);
      triggerNotification?.("📋 Invite accepted: Welcome to the team registration gate.");
    }

    // Handle Stripe Checkout Return Handshake
    if (params.get('checkout_success') === '1') {
      const sessionId = params.get('session_id') || `cs_${Date.now()}`;

      // 1. Check for pending cart order
      const pendingCartRaw = localStorage.getItem('nexus_pending_cart_order');
      if (pendingCartRaw) {
        try {
          const pending = JSON.parse(pendingCartRaw);
          const orderId = `STRP-${sessionId.slice(-6).toUpperCase()}`;
          const newPurchases = (pending.cartItems || []).map((item: any, idx: number) => ({
            id: `col_${Date.now()}_${idx}`,
            orderId,
            transactionId: sessionId,
            type: 'merch' as const,
            data: {
              id: item.productId || item.id,
              name: item.name,
              thumbnail: item.image || item.thumbnail,
              price: item.price,
              band: item.bandName,
              sizes: item.size ? [item.size] : [],
              shippingAddress: pending.shippingAddress
            },
            quantity: item.quantity || 1,
            paymentMethod: 'STRIPE_LIVE',
            date: new Date()
          }));

          const existing = JSON.parse(localStorage.getItem('nexus_my_collections_v1') || '[]');
          localStorage.setItem('nexus_my_collections_v1', JSON.stringify([...newPurchases, ...existing]));
          localStorage.removeItem('nexus_pending_cart_order');
          triggerNotification?.(`⚡ Order Confirmed! Stripe verified your payment for ${newPurchases.length} items. Added to Collections.`);
        } catch (e) {
          console.warn('Failed parsing pending cart order:', e);
        }
      }

      // 2. Check for pending single ticket/merch order
      const pendingSingleRaw = localStorage.getItem('nexus_pending_single_order');
      if (pendingSingleRaw) {
        try {
          const pending = JSON.parse(pendingSingleRaw);
          const orderId = `STRP-${sessionId.slice(-6).toUpperCase()}`;
          const newRecord = {
            id: `col_${Date.now()}`,
            orderId,
            transactionId: sessionId,
            type: pending.type || (pending.isTicket ? 'ticket' : 'merch'),
            data: {
              ...pending.rawItem,
              name: pending.isTicket ? `${pending.rawItem?.headliner || 'Concert'} Pass` : (pending.rawItem?.name || 'Tour Item'),
              ticketType: pending.activeTierConfig?.name,
              tierCode: pending.selectedTier,
              pricePerUnit: pending.unitPrice,
              attendees: pending.attendeeDetails || [],
              ticketCode: `TKT-${orderId.slice(-4)}-1`,
              thumbnail: pending.rawItem?.thumbnail || pending.rawItem?.image || pending.post?.image_url,
              shippingAddress: {
                name: pending.shippingName,
                street: pending.shippingStreet,
                city: pending.shippingCity,
                state: pending.shippingState,
                zip: pending.shippingZip,
                phone: pending.shippingPhone
              }
            },
            quantity: pending.quantity || 1,
            totalAmount: pending.grandTotal || 25,
            paymentMethod: 'STRIPE_LIVE',
            date: new Date()
          };

          const existing = JSON.parse(localStorage.getItem('nexus_my_collections_v1') || '[]');
          localStorage.setItem('nexus_my_collections_v1', JSON.stringify([newRecord, ...existing]));
          localStorage.removeItem('nexus_pending_single_order');
          triggerNotification?.(`⚡ Ticket Confirmed! Stripe verified your booking. Digital pass added to My Collections.`);
        } catch (e) {
          console.warn('Failed parsing pending single order:', e);
        }
      }

      // Clean query parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Sync pathname /pay with activeTab
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname === '/pay') {
        setActiveTab('pay-portal');
      }
    };
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    if (userProfile?.email) {
      const client = getSupabase();
      if (client) {
        ensureValidSupabaseAuthSession(client).then((session) => {
          if (session) {
            console.log('[Supabase Auth] Proactive background session verified for:', userProfile.email);
          }
        }).catch((err) => {
          console.warn('[Supabase Auth] Proactive background session notice:', err);
        });
      }
    }
  }, [userProfile?.email, userProfile?.pin]);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setUserProfile(e.detail);
        const ws = e.detail.active_workspace || e.detail.account_type;
        if (ws === 'band') {
          setActiveTab('home-v2');
          setDashboardV2ActiveNav('EVENTS');
        } else if (ws === 'promoter') {
          setActiveTab('promoter' as any);
        } else if (ws === 'creative') {
          setActiveTab('creative' as any);
        } else if (ws === 'label') {
          setActiveTab('label' as any);
        } else if (ws === 'industry_pro' || ws === 'fan_only') {
          setActiveTab('social');
        }
      }
    };
    window.addEventListener('nexus_core_user_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('nexus_core_user_profile_updated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    const handleRegisterWorkspace = (e: any) => {
      const target = e.detail?.target;
      if (target && typeof window !== 'undefined') {
        localStorage.setItem('nexus_target_register_workspace', target.toUpperCase());
      }
      setShowWorkspaceRegistration(true);
    };
    window.addEventListener('nexus_target_register_workspace', handleRegisterWorkspace);
    return () => window.removeEventListener('nexus_target_register_workspace', handleRegisterWorkspace);
  }, []);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setActiveTab(e.detail as any);
      } else if (e.detail && typeof e.detail === 'object') {
        if (e.detail.subNav) {
          setDashboardV2ActiveNav(e.detail.subNav);
        }
        if (e.detail.tab) {
          setActiveTab(e.detail.tab);
        }
      }
    };
    window.addEventListener('nexus_navigate', handleNavigate);
    window.addEventListener('nexus_navigate_tab', handleNavigate);
    return () => {
      window.removeEventListener('nexus_navigate', handleNavigate);
      window.removeEventListener('nexus_navigate_tab', handleNavigate);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'pay-portal') {
      if (window.location.pathname !== '/pay') {
        window.history.pushState(null, '', '/pay' + window.location.search);
      }
    } else {
      if (window.location.pathname === '/pay') {
        window.history.pushState(null, '', '/');
      }
    }
  }, [activeTab]);


  const playPttSound = (type: 'beep-on' | 'beep-off' | 'static') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'beep-on') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.frequency.value = 880;
        osc2.frequency.value = 1109;
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.15);
      } else if (type === 'beep-off') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(554, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(370, ctx.currentTime + 0.2);
        osc.type = 'triangle';
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'static') {
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1.2;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start();
        noise.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("AudioContext warning:", e);
    }
  };
  
  const renderTime = (time24Str: string) => {
    try {
      const parts = (time24Str || "").split(':');
      if (parts.length < 2) return time24Str;
      if (isTime24Hour) {
        return time24Str;
      }
      let hr = parseInt(parts[0], 10);
      const min = parts[1];
      if (isNaN(hr)) return time24Str;
      const ampm = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12;
      if (hr === 0) hr = 12;
      return `${hr}:${min} ${ampm}`;
    } catch (_) {
      return time24Str;
    }
  };
  
  // Live Trial Timer & Active Subscription custom hook
  const { activePlan, setActivePlan, currentTime, getTrialCountdownStr, isTrialExpired } = useSubscriptionTimer();

  // Long-press behavior for "New Sale" button
  const newSalePressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressTriggered, setIsLongPressTriggered] = useState(false);

  const handleNewSalePointerDown = () => {
    setIsLongPressTriggered(false);
    if (newSalePressTimer.current) clearTimeout(newSalePressTimer.current);
    newSalePressTimer.current = setTimeout(() => {
      setIsLongPressTriggered(true);
      setIsCashDrawerOpen(true);
      // Removed triggerNotification here to avoid "not defined" errors if declared later
    }, 600);
  };

  const handleNewSalePointerUp = () => {
    if (newSalePressTimer.current) {
      clearTimeout(newSalePressTimer.current);
      newSalePressTimer.current = null;
    }
  };

  const handleNewSaleClick = () => {
    if (isLongPressTriggered) {
      setIsLongPressTriggered(false);
      return;
    }
    setActiveTab('new-sale');
  };

  // Profile Cards Carousel
  const [profileCarouselIndex, setProfileCarouselIndex] = useState(0); // 0 = User Profile, 1 = Band Profile
  useEffect(() => {
    const interval = setInterval(() => {
      setProfileCarouselIndex(prev => (prev === 0 ? 1 : 0));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Helper to determine the current or next show
  const getNextShow = () => {
    if (shows.length === 0) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = shows
      .filter(s => s.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (upcoming.length > 0) return upcoming[0];
    // Fallback: sort all and pick the latest one
    const sorted = [...shows].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0];
  };

  // Helper to load setlist info from localStorage
  const getSetlistDetailsForShow = (showId: string | undefined) => {
    if (!showId) return { count: 0, durationStr: '0:00', allottedStr: '60:00' };
    try {
      const saved = localStorage.getItem('nexus_core_setlists');
      if (saved) {
        const setlistsMap = JSON.parse(saved);
        const sl = setlistsMap[showId];
        if (sl) {
          const count = (sl.songs || []).filter((s: any) => s.vibe !== 'break' && !s.name.toLowerCase().includes('break')).length;
          const totalSecs = (sl.songs || []).reduce((acc: number, s: any) => acc + (s.minutes * 60) + s.seconds, 0);
          const minutes = Math.floor(totalSecs / 60);
          const seconds = totalSecs % 60;
          return {
            count,
            durationStr: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            allottedStr: `${sl.allottedMinutes || 60}:${(sl.allottedSeconds || 0).toString().padStart(2, '0')}`
          };
        }
      }
    } catch (_) {}
    return { count: 0, durationStr: '0:00', allottedStr: '60:00' };
  };

  // Test diagnostic connection
  useEffect(() => {
    testSupabaseConnection().then(res => {
      console.log('Diagnostic test completed:', res);
      if (!res.success) {
        console.warn('Silent Connection Test Diagnostic Result:', res.message);
      } else {
        console.log('Diagnostic test success:', res.message);
      }
    });
  }, []);



  // Supabase Configuration Status
  const [supabaseUrl] = useState<string>(getSupabaseUrl());
  const [supabaseKey] = useState<string>(getSupabaseAnonKey());
  const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey;
  const [dbStatus, setDbStatus] = useState<'connected' | 'unconfigured' | 'error'>(
    isSupabaseConfigured ? 'connected' : 'unconfigured'
  );

  // Real-time browser online status state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Local state to track the offline queue count dynamically
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  useEffect(() => {
    // Check initial queue size
    setPendingSyncCount(getOfflineQueue().length);

    const handleQueueChanged = (e: any) => {
      if (e.detail && typeof e.detail.queueLength === 'number') {
        setPendingSyncCount(e.detail.queueLength);
      }
    };

    window.addEventListener('nexus_core_offline_queue_changed', handleQueueChanged);
    return () => {
      window.removeEventListener('nexus_core_offline_queue_changed', handleQueueChanged);
    };
  }, []);

  // DB subscription / fetch logs for dev debugging feedback
  const [logs, setLogs] = useState<string[]>(['Application local state initialized.']);

  // Helper to append a log message
  const addLog = React.useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 99)]);
  }, []);

  // Helper to add an offline queued action to localStorage
  const queueOfflineAction = (type: 'sale' | 'show' | 'note', operation: 'insert' | 'update' | 'delete', payload: any) => {
    try {
      const existingQueueStr = localStorage.getItem('nexus_core_offline_queue');
      const queue = existingQueueStr ? JSON.parse(existingQueueStr) : [];
      queue.push({
        id: Math.random().toString(36).substring(2, 9),
        type,
        operation,
        payload,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('nexus_core_offline_queue', JSON.stringify(queue));
      addLog(`[OFFLINE CACHE] Cached ${operation} for ${type} in local standby queue.`);
    } catch (err) {
      console.error('Error queuing offline action', err);
    }
  };

  // Application database-backed state with realistic seed data
  const [sales, setSales] = useState<Sale[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);



  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Trigger temporary floating notification
  const triggerNotification = React.useCallback((msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 2000);
  }, []);



  // Promoter Offers Hook
  const promoterOffers = usePromoterOffers({
    isHydrated,
    bands,
    activeBandId,
    setShows,
    triggerNotification,
    addLog
  });
  const {
    offers, setOffers,
    blockedPromoters, setBlockedPromoters,
    handleCreateOffer, handleUpdateOffer,
    handleAcceptOffer, handleDeclineOffer,
    handleBlockPromoter, handleRenegotiateOffer
  } = promoterOffers;

  const [notes, setNotes] = useState<TourNote[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_notes_offline');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mockIds = new Set(["note_01", "note_02"]);
        return parsed.filter((item: any) => !mockIds.has(item.id));
      }
    } catch (_) {}
    return [];
  });

  // Tour Notes & Checklist Hook
  const tourNotes = useTourNotes({
    notes,
    setNotes,
    isOnline,
    triggerNotification,
    addLog,
    queueOfflineAction
  });
  const {
    isNoteExpanded, setIsNoteExpanded,
    inlineNoteEditingId, setInlineNoteEditingId,
    inlineNoteText, setInlineNoteText,
    inlineNoteCategory, setInlineNoteCategory,
    inlineNoteTag, setInlineNoteTag,
    activeNoteIndex, setActiveNoteIndex,
    isTourNotesCardCollapsed, setIsTourNotesCardCollapsed,
    NOTE_CATEGORIES, NOTE_STATUSES,
    handleNoteTouchStart, handleNoteTouchMove, handleNoteTouchEnd,
    handleDeleteNote, handleUpdateNote,
    isChecklistModalOpen, setIsChecklistModalOpen,
    isFlightModalOpen, setIsFlightModalOpen,
    checklistItems, setChecklistItems,
    checklistBank, setChecklistBank,
    toggleChecklistItem
  } = tourNotes;


  // Asynchronous Offline Hydration from IndexedDB Stores
  useEffect(() => {
    const hydrateStores = async () => {
      try {
        await initOfflineQueue();
        const inv = await inventoryStore.getItem('nexus_master_inventory');
        if (inv) setInventory(JSON.parse(inv as string));
        
        const pos = await posSalesStore.getItem('nexus_master_pos_sales');
        if (pos) setSales(JSON.parse(pos as string));
        else {
          const old = localStorage.getItem('nexus_core_sales_offline');
          if (old) setSales(JSON.parse(old));
        }

        const shws = await showsStore.getItem('nexus_master_shows');
        if (shws) setShows(JSON.parse(shws as string));

        const flts = await itinerariesStore.getItem('nexus_master_itineraries');
        if (flts) setFlights(JSON.parse(flts as string));

        const revs = await reviewsStore.getItem('nexus_master_reviews');
        if (revs) setUserReviews(JSON.parse(revs as string));

        const vens = await venuesStore.getItem('nexus_master_venues');
        if (vens) setVenues(JSON.parse(vens as string));
        else {
          const oldV = localStorage.getItem('nexus_core_venues');
          if (oldV) setVenues(JSON.parse(oldV));
        }

        const offs = await offersStore.getItem('nexus_master_offers');
        if (offs) setOffers(JSON.parse(offs as string));
        else {
          const oldO = localStorage.getItem('nexus_core_offers_offline');
          if (oldO) setOffers(JSON.parse(oldO));
        }

        const exps = await expensesStore.getItem('nexus_master_expenses');
        if (exps) setExpenses(JSON.parse(exps as string));
        else {
          const oldE = localStorage.getItem('nexus_core_expenses');
          if (oldE) setExpenses(JSON.parse(oldE));
        }

        const lm = localStorage.getItem('nexus_core_loyalty_members');
        if (lm) setLoyaltyMembers(JSON.parse(lm));
        
        const ct = localStorage.getItem('nexus_core_cash_transactions');
        if (ct) setCashTransactions(JSON.parse(ct));
        
        const bp = localStorage.getItem('nexus_core_blocked_promoters');
        if (bp) setBlockedPromoters(JSON.parse(bp));

        setIsHydrated(true);


      } catch (err) {
        console.error('IDB Hydration Error:', err);
        setIsHydrated(true);
      }
    };
    hydrateStores();
  }, []);

  // Merge seed shows with extended local storage metadata on initial mount
  useEffect(() => {
    try {
      const existing = localStorage.getItem('nexus_core_shows_extended');
      if (existing) {
        const extendedMap = JSON.parse(existing);
        setShows(prev => prev.map(s => {
          const extra = extendedMap[s.id];
          if (extra) {
            return { ...s, ...extra };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error('Failed to merge extended show metadata on mount:', err);
    }
  }, []);
  
  const isLoadedFromDbRef = useRef(false);
  const { inventory, setInventory, editingItem, setEditingItem, stagedDistroItems, setStagedDistroItems, inventoryAudits, setInventoryAudits } = useInventoryState();




  const [dailySalesGoal, setDailySalesGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_sales_goal');
      if (saved) return Number(saved);
    } catch (_) {}
    return 250;
  });

  const [cashTransactions, setCashTransactions] = useState<import('./types').CashTransaction[]>([]);

  const [expenses, setExpenses] = useState<{ id: string; description: string; amount: number; date: string }[]>([]);
  const [venues, setVenues] = useState<import('./types').Venue[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      venuesStore.setItem('nexus_master_venues', JSON.stringify(venues)).catch(e => console.warn(e));
      localStorage.setItem('nexus_core_venues', JSON.stringify(venues));
    } catch (e) {
      console.error('Failed to save venues:', e);
    }
  }, [venues, isHydrated]);

  // Sync bands list with localStorage namespaced by profile ID
  useEffect(() => {
    if (!userProfile) return;
    try {
      profileStore.setItem(`nexus_core_${userProfile?.id}_bands`, bands);
    } catch (e) {
      console.error('Failed to save namespaced bands to localStorage:', e);
    }
  }, [bands, userProfile?.id]);

  // Sync active band ID with localStorage namespaced by profile ID
  useEffect(() => {
    if (!userProfile) return;
    try {
      profileStore.setItem(`nexus_core_${userProfile?.id}_active_band_id`, activeBandId);
    } catch (e) {
      console.error('Failed to save namespaced active band ID to localStorage:', e);
    }
  }, [activeBandId, userProfile?.id]);

  // Sync user profile changes back to localStorage and IndexedDB and Supabase
  useEffect(() => {
    if (userProfile) {
      try {
        profileStore.setItem('nexus_core_user_profile', userProfile);
        localStorage.setItem('nexus_core_user_profile', JSON.stringify(userProfile));
        
        // Automatic upsert to supabase removed to prevent ghost profiles.
      } catch (e) {
        console.error('Failed to save userProfile to local DB:', e);
      }
    }
  }, [userProfile, isOnline]);

  // Load account-specific offline caches instantly upon context/tenant switch to allow pristine clean slates
  useEffect(() => {
    // Fetch live community band profiles and full discographies from Supabase in the background
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      communityBandManager.fetchFromSupabase().catch((err) => {
        console.warn('[App] Background Supabase band fetch notice:', err);
      });
    }
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    
    const loadCaches = async () => {
    try {
      // 1. First setup namespaced bands lists & active contexts to assure decoupling
      let cachedBands = await profileStore.getItem(`nexus_core_${userProfile?.id}_bands`);
      let cachedActiveBandIdStr = await profileStore.getItem(`nexus_core_${userProfile?.id}_active_band_id`);
      
      // Fallback to localStorage for backward compatibility if IndexedDB is empty
      if (!cachedBands) {
        const legacyBands = localStorage.getItem(`nexus_core_${userProfile?.id}_bands`);
        if (legacyBands) cachedBands = JSON.parse(legacyBands);
      }
      if (!cachedActiveBandIdStr) {
        cachedActiveBandIdStr = localStorage.getItem(`nexus_core_${userProfile?.id}_active_band_id`);
      }
      

      let currentActiveBandId = activeBandId;

      if (userProfile?.id === 'profile_admin') {
        const adminBands = (cachedBands && Array.isArray(cachedBands) && cachedBands.length > 0) ? cachedBands : [];
        setBands(adminBands as any[]);
        const adminActiveId = cachedActiveBandIdStr || (adminBands[0]?.id || '');
        setActiveBandId(adminActiveId as string);
        currentActiveBandId = adminActiveId as string;
      } else {
        let userBands: any[] = [];
        const supabase = getSupabase();
        let remoteBands: any[] | null = null;
        if (supabase && navigator.onLine && userProfile?.id) {
          try {
            const userBandsData = await fetchUserBands(userProfile.id);
            if (Array.isArray(userBandsData)) {
              remoteBands = userBandsData;
            }
          } catch (_) {}
        }

        if (remoteBands !== null) {
          userBands = remoteBands.map((b: any) => ({
            ...b,
            name: b.band_name || b.name || 'Artist'
          }));
        } else if (cachedBands && Array.isArray(cachedBands) && cachedBands.length > 0) {
          userBands = cachedBands;
        } else if (bands && bands.length > 0) {
          userBands = bands;
        } else {
          userBands = [];
        }

        // Restrict userBands strictly to Virulent Excision workspace
        userBands = userBands.filter((b: any) => {
          const bId = String(b.id || '').trim();
          const bName = String(b.name || b.band_name || '').trim().toLowerCase();
          return bId === 'cbddb810-259b-4230-9968-3d402dfdb872' || bName.includes('virulent excision');
        });
        if (userBands.length === 0) {
          userBands = [{
            id: 'cbddb810-259b-4230-9968-3d402dfdb872',
            name: 'Virulent Excision',
            band_name: 'Virulent Excision',
            genre: 'Brutal Death Metal',
            logo_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396',
            cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-cover_1787467851123.jpg?t=1787467851123',
            owner_id: userProfile?.id
          }];
        }

        if (userProfile?.id) {
          profileStore.setItem(`nexus_core_${userProfile?.id}_bands`, userBands);
        }
        setBands(userBands);

        const isOwnerMiguel = isMiguelNameOrProfile(userProfile);

        // Cleanse corrupted band_id or band_name from userProfile if it was set to a community archive or mismatched
        const isCorruptCommunityBand = Boolean(
          (userProfile?.band_id && isCommunityBandRecord(userProfile.band_id)) ||
          (userProfile?.band_name && (isCommunityBandRecord(userProfile.band_name) || userProfile.band_name.toLowerCase().includes('necroticgorebeast') || userProfile.band_name.toLowerCase().includes('molested') || userProfile.band_name.toLowerCase() === 'dying fetus')) ||
          (userProfile?.bandName && (isCommunityBandRecord(userProfile.bandName) || userProfile.bandName.toLowerCase().includes('necroticgorebeast') || userProfile.bandName.toLowerCase().includes('molested') || userProfile.bandName.toLowerCase() === 'dying fetus'))
        );

        if (isOwnerMiguel || isCorruptCommunityBand) {
          const needsVEFix = isOwnerMiguel && (
            userProfile?.band_id !== 'cbddb810-259b-4230-9968-3d402dfdb872' ||
            userProfile?.band_name !== 'Virulent Excision' ||
            userProfile?.bandName !== 'Virulent Excision'
          );

          if (isCorruptCommunityBand || needsVEFix) {
            userProfile.band_id = isOwnerMiguel ? 'cbddb810-259b-4230-9968-3d402dfdb872' : null;
            userProfile.band_name = isOwnerMiguel ? 'Virulent Excision' : null;
            userProfile.bandName = isOwnerMiguel ? 'Virulent Excision' : null;
            try {
              localStorage.setItem('nexus_core_user_profile', JSON.stringify(userProfile));
              if (isOwnerMiguel) {
                localStorage.setItem('nexus_active_band_id', 'cbddb810-259b-4230-9968-3d402dfdb872');
              }
            } catch (_) {}
            if (supabase && userProfile.id) {
              supabase.from('profiles').update({
                band_id: userProfile.band_id,
                band_name: userProfile.band_name,
                bandName: userProfile.bandName
              }).eq('id', userProfile.id).then();
            }
          }
        }

        // Backfill userProfile band_id / band_name if user has a valid band registered
        if (userBands.length > 0 && userProfile?.id) {
          const primaryBand = userBands[0];
          const hasMissingBandFields = !userProfile.band_id || !userProfile.band_name || !userProfile.bandName;
          const isPrimaryValid = !isCommunityBandRecord(primaryBand.id) && !isCommunityBandRecord(primaryBand.name);
          if (isPrimaryValid && (hasMissingBandFields || (isOwnerMiguel && userProfile.band_name !== 'Virulent Excision'))) {
            const updatedProfile = {
              ...userProfile,
              band_id: isOwnerMiguel ? 'cbddb810-259b-4230-9968-3d402dfdb872' : (userProfile.band_id || primaryBand.id),
              band_name: isOwnerMiguel ? 'Virulent Excision' : (userProfile.band_name || userProfile.bandName || primaryBand.band_name || primaryBand.name),
              bandName: isOwnerMiguel ? 'Virulent Excision' : (userProfile.bandName || userProfile.band_name || primaryBand.band_name || primaryBand.name),
              active_workspace: userProfile.active_workspace || ((userProfile.account_type === 'fan' || userProfile.account_type === 'fan_only') ? 'fan_only' : 'industry_pro'),
              account_type: (userProfile.account_type === 'fan' || userProfile.account_type === 'fan_only') ? 'fan' : 'industry pro'
            };
            setUserProfile(updatedProfile);
            try {
              localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));
            } catch (_) {}

            if (supabase) {
              supabase.from('profiles').update({
                band_id: updatedProfile.band_id,
                band_name: updatedProfile.band_name,
                bandName: updatedProfile.bandName,
                active_workspace: updatedProfile.active_workspace,
                account_type: updatedProfile.account_type
              }).eq('id', userProfile.id).then();
            }
          }
        }

        // Auto-heal existing creative profile ONLY if workspace is registered
        if (supabase && navigator.onLine && userProfile?.id && userProfile.id !== 'guest' && hasRegisteredWorkspace(userProfile, 'creative')) {
          autoSyncCreativeProfile(userProfile).then((synced) => {
            if (synced && (!userProfile.creative_id || !(userProfile as any).creative_business_name)) {
              const healedProfile = {
                ...userProfile,
                creative_id: userProfile.creative_id || synced.id,
                creative_name: userProfile.creative_name || synced.business_name || synced.creative_name,
                creative_business_name: (userProfile as any).creative_business_name || synced.business_name || synced.creative_name,
                creative_avatar: (userProfile as any).creative_avatar || synced.avatar_url,
                creative_banner: (userProfile as any).creative_banner || synced.banner_url,
              };
              setUserProfile(healedProfile);
              try {
                localStorage.setItem('nexus_core_user_profile', JSON.stringify(healedProfile));
              } catch (_) {}
            }
          }).catch((err) => console.warn('Creative auto-sync notice:', err));
        }

        let userActiveId = 'cbddb810-259b-4230-9968-3d402dfdb872';
        setActiveBandId(userActiveId);
        currentActiveBandId = userActiveId;
      }

      // 2. Load context collections namespaced by current active context suffix
      const suffix = currentActiveBandId || userProfile?.id || 'offline';
      
      const cachedSalesStr = localStorage.getItem(`nexus_core_${suffix}_sales_offline`);
      const cachedShowsStr = localStorage.getItem(`nexus_core_${suffix}_shows_offline`);
      const cachedNotesStr = localStorage.getItem(`nexus_core_${suffix}_notes_offline`);
      const cachedAuditsStr = localStorage.getItem(`nexus_core_${suffix}_audits_offline`);
      const cachedInventoryStr = localStorage.getItem(`nexus_core_${suffix}_inventory_offline`);
      const cachedExpensesStr = localStorage.getItem(`nexus_core_${suffix}_expenses`);
      const cachedCashTransactionsStr = localStorage.getItem(`nexus_core_${suffix}_cash_transactions`);
      const cachedSalesGoalStr = localStorage.getItem(`nexus_core_${suffix}_sales_goal`);
      
      if (userProfile?.id === 'profile_admin') {
        const defaultExpenses = [
          { id: 'exp_1', description: 'Gas refill (van)', amount: 65.00, date: new Date().toISOString().split('T')[0] },
          { id: 'exp_2', description: 'Hotel room booking', amount: 150.00, date: new Date().toISOString().split('T')[0] },
          { id: 'exp_3', description: 'Highway tolls', amount: 35.00, date: new Date().toISOString().split('T')[0] }
        ];
        setSales(cachedSalesStr ? JSON.parse(cachedSalesStr) : []);
        setShows(cachedShowsStr ? JSON.parse(cachedShowsStr) : []);
        setNotes(cachedNotesStr ? JSON.parse(cachedNotesStr) : []);
        setInventoryAudits(cachedAuditsStr ? JSON.parse(cachedAuditsStr) : []);
        setInventory(cachedInventoryStr ? JSON.parse(cachedInventoryStr) : []);
        setExpenses(cachedExpensesStr ? JSON.parse(cachedExpensesStr) : defaultExpenses);
        setCashTransactions(cachedCashTransactionsStr ? JSON.parse(cachedCashTransactionsStr) : []);
        setDailySalesGoal(cachedSalesGoalStr ? Number(cachedSalesGoalStr) : 250);
      } else {
        // Pristine, completely clean slate for newly registered test accounts!
        setSales(cachedSalesStr ? JSON.parse(cachedSalesStr) : []);
        setShows(cachedShowsStr ? JSON.parse(cachedShowsStr) : []);
        setNotes(cachedNotesStr ? JSON.parse(cachedNotesStr) : []);
        setInventoryAudits(cachedAuditsStr ? JSON.parse(cachedAuditsStr) : []);
        setInventory(cachedInventoryStr ? JSON.parse(cachedInventoryStr) : []);
        setExpenses(cachedExpensesStr ? JSON.parse(cachedExpensesStr) : []);
        setCashTransactions(cachedCashTransactionsStr ? JSON.parse(cachedCashTransactionsStr) : []);
        setDailySalesGoal(cachedSalesGoalStr ? Number(cachedSalesGoalStr) : 250);
      }
      setIsInitialHydrated(true);
    } catch (e) {
      console.error('Failed to swap context collections:', e);
    }
    };
    
    loadCaches();
  }, [activeBandId, userProfile?.id]);

  // Sync core collections with localStorage to maintain offline durability namespaced by current profile suffix
  useEffect(() => {
    if (!isInitialHydrated) return;
    try {
      const suffix = activeBandId || userProfile?.id || 'offline';
      localStorage.setItem(`nexus_core_${suffix}_sales_offline`, JSON.stringify(sales));
    } catch (_) {}
  }, [sales, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated) return;
    try {
      const suffix = activeBandId || userProfile?.id || 'offline';
      localStorage.setItem(`nexus_core_${suffix}_shows_offline`, JSON.stringify(shows));
    } catch (_) {}
  }, [shows, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated) return;
    try {
      const suffix = activeBandId || userProfile?.id || 'offline';
      localStorage.setItem(`nexus_core_${suffix}_notes_offline`, JSON.stringify(notes));
    } catch (_) {}
  }, [notes, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated) return;
    try {
      const suffix = activeBandId || userProfile?.id || 'offline';
      localStorage.setItem(`nexus_core_${suffix}_audits_offline`, JSON.stringify(inventoryAudits));
    } catch (_) {}
  }, [inventoryAudits, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated) return;
    try {
      const suffix = activeBandId || userProfile?.id || 'offline';
      localStorage.setItem(`nexus_core_${suffix}_inventory_offline`, JSON.stringify(inventory));
      const variantsCache = inventory.reduce((acc, item) => {
        if (item.variants && item.variants.length > 0) acc[item.id] = item.variants;
        return acc;
      }, {} as Record<string, any>);
      localStorage.setItem(`nexus_core_${suffix}_variants_cache`, JSON.stringify(variantsCache));
    } catch (_) {}
  }, [inventory, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated) return;
    try {
      const suffix = activeBandId || userProfile?.id || 'offline';
      localStorage.setItem(`nexus_core_${suffix}_cash_transactions`, JSON.stringify(cashTransactions));
    } catch (_) {}
  }, [cashTransactions, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated) return;
    try {
      const suffix = activeBandId || userProfile?.id || 'offline';
      localStorage.setItem(`nexus_core_${suffix}_expenses`, JSON.stringify(expenses));
    } catch (_) {}
  }, [expenses, isInitialHydrated]);

  const isBandRegistered = useMemo(() => {
    if (!userProfile) return false;
    return (
      hasRegisteredWorkspace(userProfile, 'band') ||
      Boolean(userProfile.band_id || userProfile.bandName || userProfile.band_name) ||
      (bands && bands.length > 0)
    );
  }, [userProfile, bands]);

  const activeBand = useMemo(() => {
    if (!isBandRegistered) return null;
    const veBand = bands.find(b => b.id === 'cbddb810-259b-4230-9968-3d402dfdb872' || (b.name || '').toLowerCase().includes('virulent excision')) || bands[0];
    if (veBand && (veBand.id === 'cbddb810-259b-4230-9968-3d402dfdb872' || (veBand.name || veBand.band_name || '').toLowerCase().includes('virulent excision'))) {
      return veBand;
    }
    return {
      id: 'cbddb810-259b-4230-9968-3d402dfdb872',
      name: 'Virulent Excision',
      band_name: 'Virulent Excision',
      genre: 'Brutal Death Metal',
      logo_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396',
      cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-cover_1787467851123.jpg?t=1787467851123',
      owner_id: userProfile?.id
    };
  }, [bands, isBandRegistered, userProfile]);


  // 1. When activeBand changes, load its specific data into state and set currentLoadedBandId
  useEffect(() => {
    if (!activeBand) return;
    const bandId = activeBand.id;
    
    // Load lineup
    const savedLineup = localStorage.getItem(`nexus_core_band_lineup_${bandId}`);
    let loadedLineup: any[] | null = null;

    if (savedLineup) {
      try {
        const parsed = JSON.parse(savedLineup);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedLineup = parsed.map((m: any, idx: number) => ({
            ...m,
            clearanceLevel: m.clearanceLevel || (idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 3 : 2)
          }));
        }
      } catch (_) {}
    }

    if (!loadedLineup && (activeBand as any).lineup) {
      const rawLineup = (activeBand as any).lineup;
      if (Array.isArray(rawLineup)) {
        loadedLineup = rawLineup;
      } else if (typeof rawLineup === 'string') {
        try {
          const parsed = JSON.parse(rawLineup);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedLineup = parsed;
          }
        } catch (_) {
          const parts = rawLineup.split(',').map((s: string) => s.trim()).filter(Boolean);
          if (parts.length > 0) {
            loadedLineup = parts.map((part: string, idx: number) => ({
              id: `l_${Date.now()}_${idx}`,
              name: part,
              role: 'Member',
              clearanceLevel: idx === 0 ? 5 : 4,
              inviteStatus: 'accepted'
            }));
          }
        }
      }
    }

    if (loadedLineup && loadedLineup.length > 0) {
      setBandLineup(loadedLineup);
    } else {
      setBandLineup([
        { id: 'l1', name: 'Band Member 1', role: 'Vocals', clearanceLevel: 5, inviteStatus: 'accepted' },
        { id: 'l2', name: 'Frank Butcher', role: 'Guitars', clearanceLevel: 4, inviteStatus: 'accepted' },
        { id: 'l3', name: 'Alex Decay', role: 'Bass', clearanceLevel: 3, inviteStatus: 'pending' },
        { id: 'l4', name: 'Jack Ripper', role: 'Drums', clearanceLevel: 2, inviteStatus: 'none' }
      ]);
    }

    // Load cover
    const savedCover = localStorage.getItem(`nexus_core_band_cover_${bandId}`) || activeBand.cover_url || '';
    setBandCoverUrl(savedCover);

    // Load logo
    const savedLogo = localStorage.getItem(`nexus_core_band_logo_${bandId}`) || activeBand.logo_url || activeBand.avatar_url || (activeBand as any).avatar || '';
    setBandLogoUrl(savedLogo);

    // Load crew
    const savedCrew = localStorage.getItem(`nexus_core_crew_members_${bandId}`);
    if (savedCrew) {
      try {
        setCrewMembers(JSON.parse(savedCrew));
      } catch (_) {}
    } else {
      setCrewMembers([
        { id: 'c1', name: 'Chris Smith', role: 'FOH Sound Tech', contact: 'chris.sound@nexus.core' },
        { id: 'c2', name: 'John Marston', role: 'Driver / Transport', contact: '+1 (555) 321-7890' }
      ]);
    }

    setCurrentLoadedBandId(bandId);
  }, [activeBand?.id]);

  useEffect(() => {
    if (!isInitialHydrated || !activeBand || currentLoadedBandId !== activeBand.id) return;
    try {
      localStorage.setItem(`nexus_core_crew_members_${activeBand.id}`, JSON.stringify(crewMembers));
    } catch (_) {}
  }, [crewMembers, activeBand?.id, currentLoadedBandId, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated || !activeBand || currentLoadedBandId !== activeBand.id) return;
    try {
      localStorage.setItem(`nexus_core_band_lineup_${activeBand.id}`, JSON.stringify(bandLineup));
    } catch (_) {}
  }, [bandLineup, activeBand?.id, currentLoadedBandId, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated || !activeBand || currentLoadedBandId !== activeBand.id) return;
    try {
      localStorage.setItem(`nexus_core_band_logo_${activeBand.id}`, bandLogoUrl);
    } catch (_) {}
  }, [bandLogoUrl, activeBand?.id, currentLoadedBandId, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated || !activeBand || currentLoadedBandId !== activeBand.id) return;
    try {
      localStorage.setItem(`nexus_core_band_cover_${activeBand.id}`, bandCoverUrl);
    } catch (_) {}
  }, [bandCoverUrl, activeBand?.id, currentLoadedBandId, isInitialHydrated]);

  // Find active simulated member in the lineup or crew
  const activeSimulatedMember = useMemo(() => {
    const list = Array.isArray(bandLineup) ? bandLineup : [];
    const crewList = Array.isArray(crewMembers) ? crewMembers : [];
    const combined = [
      ...list.map((m: any) => ({ ...m, clearanceLevel: m.clearanceLevel || 5 })),
      ...crewList.map((c: any) => ({ ...c, clearanceLevel: c.clearanceLevel || 1 }))
    ];
    const found = combined.find((m: any) => m.id === simulatedMemberId);
    if (found) return found;
    // Default to first member of current lineup if loaded
    if (list.length > 0) return { ...list[0], clearanceLevel: list[0].clearanceLevel || 5 };
    // Ultimate fallback
    return { id: 'l1', name: 'Band Member 1', role: 'Vocals', clearanceLevel: 5 };
  }, [bandLineup, crewMembers, simulatedMemberId]);

  // Keep activeClearanceLevel in sync with activeSimulatedMember's level, and persist changes
  useEffect(() => {
    if (activeSimulatedMember) {
      const lvl = activeSimulatedMember.clearanceLevel || 5;
      if (lvl !== activeClearanceLevel) {
        queueMicrotask(() => {
          setActiveClearanceLevel(lvl);
        });
      }
      localStorage.setItem('nexus_core_active_clearance_level', String(lvl));
      localStorage.setItem('nexus_core_simulated_member_id', activeSimulatedMember.id);
    }
  }, [activeSimulatedMember?.id, activeSimulatedMember?.clearanceLevel, activeClearanceLevel]);

  // Filtered lists for the active band context
  const filteredShows = useMemo(() => {
    return shows.filter(show => {
      // 1. If marked as community-submitted, or created via community hub (sh_comm_), or band_id is 'community_hub' / starts with 'community':
      const isCommunityOnly = show.is_community_submitted === true || 
        (typeof show.id === 'string' && show.id.startsWith('sh_comm_')) || 
        (show.band_id && (show.band_id === 'community_hub' || show.band_id.startsWith('community')));

      if (isCommunityOnly) {
        // Only include in band workspace if explicitly assigned to this specific band's ID
        return Boolean(show.band_id && show.band_id === activeBandId && show.band_id !== 'community_hub');
      }

      // 2. Regular band shows: belong to this band or legacy show without band_id
      return !show.band_id || show.band_id === activeBandId;
    });
  }, [shows, activeBandId]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => !sale.band_id || sale.band_id === activeBandId);
  }, [sales, activeBandId]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => !item.band_id || item.band_id === activeBandId);
  }, [inventory, activeBandId]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Hide internal NEXUS storage notes
      if (note.category?.startsWith('NEXUS_')) return false;
      return !note.band_id || note.band_id === activeBandId;
    });
  }, [notes, activeBandId]);


  const handleDeleteBand = (bandId: string, name: string) => {
    if (bands.length <= 1) {
      triggerNotification('Cannot delete. At least one artist profile must remain.');
      return;
    }

    setBands(prev => prev.filter(b => b.id !== bandId));

    if (activeBandId === bandId) {
      const remaining = bands.filter(b => b.id !== bandId);
      if (remaining.length > 0) {
        setActiveBandId(remaining[0].id);
      }
    }

    addLog(`Deleted artist profile from roster: ${name}`);
    triggerNotification(`Removed ${name} from roster.`);
    setDeletingBandId(null);
  };

  const handleCreateBand = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentLimit = 
      userProfile?.sub_tier === 'touring_pro_plus' ? BAND_PORTAL_BILLING.tiers.touring_pro_plus.bandProfileLimit :
      userProfile?.sub_tier === 'touring_pro' ? BAND_PORTAL_BILLING.tiers.touring_pro.bandProfileLimit :
      userProfile?.sub_tier === 'enterprise_circuit' ? 999 :
      userProfile?.sub_tier === 'power_user_pro' ? 2 : 1;
      
    if (bands.length >= currentLimit) {
      triggerNotification(`Band Profile limit reached (${currentLimit}). Upgrade your subscription to add more.`);
      return;
    }

    if (!newBandForm.name.trim()) {
      triggerNotification('Please provide a valid band name.');
      return;
    }

    const newId = generateUUID();
    let bandLogo = newBandForm.logo_url || logoPresets[customLogoPreset];
    let bandCover = (newBandForm as any).cover_url || undefined;

    if (bandLogo && bandLogo.startsWith('data:')) {
      try {
        const publicUrl = await uploadBase64ToStorage(bandLogo, 'community-bands', userProfile?.id || newId, 'band-logo');
        if (publicUrl && !publicUrl.startsWith('data:')) {
          bandLogo = publicUrl;
        }
      } catch (err) {
        console.warn('Failed to upload new band logo to storage:', err);
      }
    }

    if (bandCover && bandCover.startsWith('data:')) {
      try {
        const publicUrl = await uploadBase64ToStorage(bandCover, 'community-bands', userProfile?.id || newId, 'band-cover');
        if (publicUrl && !publicUrl.startsWith('data:')) {
          bandCover = publicUrl;
        }
      } catch (err) {
        console.warn('Failed to upload new band cover to storage:', err);
      }
    }

    const newBand: Band = {
      id: newId,
      name: newBandForm.name.trim(),
      band_name: newBandForm.name.trim(),
      genre: newBandForm.genre.trim() || '',
      logo_url: bandLogo,
      cover_url: bandCover
    };

    // Store new band
    setBands(prev => [...prev, newBand]);
    try {
      const existingBandsStr = localStorage.getItem('nexus_bands_list');
      const existingBands = existingBandsStr ? JSON.parse(existingBandsStr) : [];
      const updatedBands = [newBand, ...existingBands.filter((b: any) => b.id !== newBand.id)];
      localStorage.setItem('nexus_bands_list', JSON.stringify(updatedBands));
    } catch (_) {}

    // Synchronize to Supabase bands table
    try {
      const supabase = getSupabase();
      if (supabase && navigator.onLine) {
        const cleanPayload = sanitizeBandPayload({
          ...newBand,
          creator_id: userProfile?.id || null
        });
        await executeWithSchemaResilience(
          async (payload) => await supabase.from('bands').upsert([payload]),
          cleanPayload
        );
      }
    } catch (err) {
      console.warn('Error persisting new band to Supabase:', err);
    }

    // Synchronize active userProfile workspace attributes
    if (userProfile) {
      const allowed = Array.from(new Set([...(userProfile.allowed_workspaces || []), 'band']));
      const bandRef: RegisteredWorkspaceRef = { type: 'band', id: newBand.id, name: newBand.name };
      const registered = normalizeRegisteredWorkspaces(userProfile.registered_workspaces, [bandRef]);
      const updatedProfile = {
        ...userProfile,
        active_workspace: 'band',
        allowed_workspaces: allowed,
        registered_workspaces: registered,
        band_id: newBand.id,
        band_name: newBand.name,
        bandName: newBand.name
      };
      setUserProfile(updatedProfile);
      try {
        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));
      } catch (_) {}
    }

    // Create seed items for this band so the manager has starter inventory
    const seedInventoryItems: InventoryItem[] = [
      {
        id: 'i_new_' + Math.random().toString(36).substring(2, 9),
        name: `${newBand.name} Classic Logo Tee`,
        item_type: 'Multiple',
        price: 30.00,
        table_stock: 45,
        van_stock: 120,
        status: 'Healthy',
        border_color: '#3b82f6',
        image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=200&auto=format&fit=crop',
        band_id: newId
      },
      {
        id: 'i_new_' + Math.random().toString(36).substring(2, 9),
        name: `${newBand.name} Logo Stickers (x10)`,
        item_type: 'Sticker',
        price: 5.00,
        table_stock: 110,
        van_stock: 250,
        status: 'Healthy',
        border_color: '#eab308',
        image_url: 'https://images.unsplash.com/photo-1496200186974-4293800e2c20?q=80&w=200&auto=format&fit=crop',
        band_id: newId
      }
    ];

    setInventory(prev => [...prev, ...seedInventoryItems]);

    // Schedule kickoff show for this band
    const seedShow: Show = {
      id: 'sh_new_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      name: 'Madison Square Garden, NY',
      festival_name: `${newBand.name} World Tour Kickoff`,
      date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      status: 'Active',
      revenue: 1400,
      band_id: newId
    };

    setShows(prev => [seedShow, ...prev]);

    // Auto switch to it and navigate to the band workspace EVENTS page
    setActiveBandId(newId);
    try {
      localStorage.setItem('nexus_active_band_id', newId);
    } catch (_) {}
    setActiveTab('home-v2');
    setDashboardV2ActiveNav('EVENTS');
    setIsBandModalOpen(false);

    // Reset form
    setNewBandForm({
      name: '',
      genre: '',
      logo_url: '',
      is_managed_client: false,
      management_role: 'tour_manager',
      management_commission_pct: 15,
      management_day_rate: 250,
      executive_contact_name: '',
      executive_contact_email: '',
      executive_contact_phone: '',
      client_roster_notes: ''
    });
    
    addLog(`Registered new roster artist "${newBand.name}" and generated starter tour dataset.`);
    triggerNotification(`Active artist switched to: ${newBand.name}`);
  };

  const handleOpenMyProfile = () => {
    const personalHandle = userProfile?.console_handle && !userProfile.console_handle.toLowerCase().includes('virulent') && userProfile.console_handle !== '@user' && userProfile.console_handle !== 'user'
      ? (userProfile.console_handle.startsWith('@') ? userProfile.console_handle : `@${userProfile.console_handle}`)
      : '@bdmCEO';

    const detailPayload = {
      id: userProfile?.id,
      name: userProfile?.name || userProfile?.full_name || 'Miguel Goregrinder Medina',
      legalName: userProfile?.full_name || userProfile?.name || 'Miguel Goregrinder Medina',
      handle: personalHandle,
      console_handle: personalHandle,
      username: personalHandle,
      avatar: userProfile?.avatar_url || null,
      avatar_url: userProfile?.avatar_url || null,
      banner: userProfile?.banner_url || null,
      banner_url: userProfile?.banner_url || null,
      cover_url: userProfile?.banner_url || null,
      location: userProfile?.location || 'USA / Global',
      role: userProfile?.account_type === 'industry_pro' ? 'Industry Pro' 
          : 'Fan Listener',
      type: 'user',
      isPersonal: true,
      isBandProfile: false,
      isYou: true,
      badges: userProfile?.badges || (
        userProfile?.account_type === 'industry_pro' ? ['💼 Industry Pro'] : ['🤘 Fan']
      ),
      customBadges: userProfile?.badges || (
        userProfile?.account_type === 'industry_pro' ? ['💼 Industry Pro'] : ['🤘 Fan']
      ),
      bio: userProfile?.bio || userProfile?.blurb || 'User profile on the Nexus network.',
    };

    setActiveTab('social');
    triggerNotification?.("⚡ Opening your personal profile...");

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openPublicProfile', {
        detail: detailPayload
      }));
    }, 100);
  };

  const [reviewScore, setReviewScore] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerGroup, setReviewerGroup] = useState('');
  const [reviewLeft, setReviewLeft] = useState(false);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('nexus_core_user_reviews', JSON.stringify(userReviews));
    } catch (_) {}
  }, [userReviews]);

  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>(() => {
    try {
      const raw = localStorage.getItem('nexus_core_loyalty_members');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: 'loyalty_1',
        created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        name: 'Sarah Connor',
        city: 'Los Angeles',
        state: 'CA',
        country: 'United States',
        email: 'sarah.c@cyberdyne.com',
        phone: '2135551984',
        pin: '1984',
        opt_in_promotions: true,
        lifetime_discount_uses: 2
      },
      {
        id: 'loyalty_2',
        created_at: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(),
        name: 'James Hetfield',
        city: 'San Francisco',
        state: 'CA',
        country: 'United States',
        email: 'papa.het@metallica.com',
        phone: '4155551981',
        pin: '1081',
        opt_in_promotions: true,
        lifetime_discount_uses: 1
      },
      {
        id: 'loyalty_3',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        name: 'Alex Mercer',
        city: 'Toronto',
        state: 'ON',
        country: 'Canada',
        email: 'alex_mercer@gentek.org',
        phone: '4165552009',
        pin: '2009',
        opt_in_promotions: false,
        lifetime_discount_uses: 0
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('nexus_core_loyalty_members', JSON.stringify(loyaltyMembers));
    } catch (_) {}
  }, [loyaltyMembers]);


  useEffect(() => {
    if (userProfile && !reviewerName) {
      setReviewerName(userProfile?.name);
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeBand && !reviewerGroup) {
      setReviewerGroup(activeBand?.name);
    }
  }, [activeBand]);



  const handleOfflineSyncSuccess = React.useCallback((msg: string) => {
    triggerNotification(`🔄 ${msg}`);
  }, [triggerNotification]);

  const { isOnline: offlineSyncIsOnline, queueLength: offlineQueueLength, isSyncing: offlineIsSyncing } = useOfflineSync(handleOfflineSyncSuccess);

  // Restock action
  const handleRestock = () => {
    setIsTransferModalOpen(true);
  };

  // Band Management Hook
  const bandManagement = useBandManagement({
    activeBand,
    setBands,
    userProfile,
    setUserProfile,
    triggerNotification,
    addLog,
    editingBand,
    setEditingBand
  });
  const {
    newBandForm, setNewBandForm,
    customLogoPreset, setCustomLogoPreset,
    logoPresets,
    editName, setEditName,
    editGenre, setEditGenre,
    editLogoUrl, setEditLogoUrl,
    editLogoPresetIdx, setEditLogoPresetIdx,
    dragActive, setDragActive,
    rosterFileInputRef, editRosterFileInputRef,
    bandInfoName, setBandInfoName,
    bandInfoHomebase, setBandInfoHomebase,
    bandInfoFoundedYear, setBandInfoFoundedYear,
    bandInfoBio, setBandInfoBio,
    bandInfoCustomSlug, setBandInfoCustomSlug,
    bandInfoBookingEmail, setBandInfoBookingEmail,
    bandInfoBookingPhone, setBandInfoBookingPhone,
    bandInfoYoutubeVideo, setBandInfoYoutubeVideo,
    bandInfoStreamingUrl, setBandInfoStreamingUrl,
    bandInfoTechRider, setBandInfoTechRider,
    bandInfoTourVehicle, setBandInfoTourVehicle,
    bandInfoMetalArchivesUrl, setBandInfoMetalArchivesUrl,
    logoUploaderDragActive, setLogoUploaderDragActive,
    coverUploaderDragActive, setCoverUploaderDragActive,
    bandInfoLogoFileInputRef, bandInfoCoverFileInputRef,
    handleBandInfoLogoUpload, handleBandInfoCoverUpload,
    compressLogoImage, handleLogoUpload, handleUpdateBand
  } = bandManagement;

  const saveShowExtraMetadata = (showId: string, show: Show) => {
    try {
      const existing = localStorage.getItem('nexus_core_shows_extended');
      const extendedMap = existing ? JSON.parse(existing) : {};
      extendedMap[showId] = {
        event_scope: show.event_scope,
        tour_id: show.tour_id,
        venue_address: show.venue_address,
        city: show.city,
        promoter_contact: show.promoter_contact,
        load_in_time: show.load_in_time,
        doors_time: show.doors_time,
        set_time: show.set_time,
        venue_cut_percentage: show.venue_cut_percentage,
        guarantee_amount: show.guarantee_amount,
        currency: show.currency,
        tax_rate: show.tax_rate,
        expected_attendance: show.expected_attendance,
        guest_list: show.guest_list,
        additional_notes: show.additional_notes,
      };
      localStorage.setItem('nexus_core_shows_extended', JSON.stringify(extendedMap));
    } catch (err) {
      console.error('Failed to save show extra metadata', err);
    }
  };

  // Sync offline queued actions to live Supabase server
  const [revenueSplits, setRevenueSplits] = useState<AssetRevenueSplit[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const {
    syncOfflineQueue,
    commitInventoryMutation,
    commitSaleMutation,
    commitFlightMutation,
    commitShowMutation,
    commitReviewMutation,
    processingGlobalSyncQueue,
  } = useGlobalDataSync({
    isOnline,
    setIsOnline,
    inventory,
    setInventory,
    sales,
    setSales,
    flights,
    setFlights,
    shows,
    setShows,
    userReviews,
    setUserReviews,
    revenueSplits,
    addLog,
    triggerNotification,
  });

  const handleDataSubmit = async (type: 'sale' | 'show' | 'note', payload: any) => {
    const supabase = getSupabase();
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toISOString();

    if (type === 'sale') {
      const newSale: Sale = {
        id,
        created_at: timestamp,
        item_name: payload.item_name,
        quantity: payload.quantity,
        item_type: payload.item_type,
        amount: payload.amount,
        payment_method: payload.payment_method,
        image_url: payload.image_url,
        cart_items: payload.cart_items,
        band_id: activeBandId,
        team_member_id: payload.team_member_id,
      };

      commitSaleMutation(newSale);
      triggerNotification(`Recorded sale: +$${((payload.amount ?? 0) * (payload.quantity ?? 1)).toFixed(2)}`);
    }

    if (type === 'show') {
      const newShow: Show = {
        id: payload.id || id,
        created_at: payload.created_at || timestamp,
        name: payload.name,
        festival_name: payload.festival_name,
        date: payload.date,
        status: payload.status || 'Active',
        revenue: payload.guarantee_amount || payload.revenue || 0,
        show_type: payload.show_type || 'headliner',
        band_id: activeBandId,

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
        support_lineup: payload.support_lineup,
      };

      commitShowMutation(newShow);
      saveShowExtraMetadata(newShow.id, newShow);
      
      const isUpdate = !!payload.id;
      addLog(isUpdate ? `Updated scheduled show: ${newShow.name}` : `Scheduled new show: ${newShow.name}`);
      triggerNotification(isUpdate ? `Show updated successfully!` : `New show scheduled!`);
    }

    if (type === 'note') {
      const newNote: TourNote = {
        id,
        created_at: timestamp,
        category: payload.category || 'FINANCIALS',
        text: payload.text,
        tag_name: payload.tag_name || 'SETTLEMENT',
        band_id: activeBandId,
        show_id: payload.show_id || undefined,
      };

      if (supabase && isOnline) {
        addLog(`Pushing tour note to Supabase Postgres 'notes' matrix...`);
        const dbNote = { ...newNote };
        delete dbNote.band_id;
        try {
          const { error } = await supabase.from('notes').insert([dbNote]);
          if (error) {
            addLog(`Supabase Error: ${error.message}. Saved to local container.`);
            queueOfflineAction('note', 'insert', newNote);
          } else {
            addLog(`Note committed to live notes database.`);
          }
        } catch (e: any) {
          addLog(`Network failed: ${e.message}. Saved to local sync queue.`);
          queueOfflineAction('note', 'insert', newNote);
        }
      } else {
        queueOfflineAction('note', 'insert', newNote);
        addLog(`Added note details offline: "${newNote.text.substring(0, 20)}..."`);
      }
      setNotes(prev => [newNote, ...prev]);
      setActiveNoteIndex(0);
      triggerNotification(`Notes updated!`);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      localStorage.setItem('nexus_core_notifications', JSON.stringify(updated));
      return updated;
    });

    const supabase = getSupabase();
    if (supabase && isOnline) {
      try {
        await supabase
          .from('nexus_notifications')
          .update({ is_read: true })
          .eq('id', id);
        addLog(`Sent read state update to Supabase for alert [${id}]`);
      } catch (err) {
        console.error('Failed to update notification read state in Supabase:', err);
      }
    }
  };

  // Fetch tables and initiate real-time listeners upon mount/keys configuration
  useEffect(() => {
    // Active context-namespaced offline layout hydration is handled dynamically by context swap useEffect

    const supabase = getSupabase();
    if (!supabase) {
      setDbStatus('unconfigured');
      addLog('Operating securely without active DB credentials. Tap mock generators below.');
      isLoadedFromDbRef.current = true;
      return;
    }

    if (!isOnline) {
      setDbStatus('error');
      addLog('Operating offline. Handshake with Supabase delayed until network returns.');
      isLoadedFromDbRef.current = true;
      return;
    }

    addLog('Attempting handshake with Supabase server schema...');

    let active = true;
    const unsubscribers: (() => void)[] = [];

    const hydrateModuleData = async () => {
      // Guard Clause: Ensure a valid active user session exists before querying Supabase
      const session = await ensureValidSupabaseAuthSession(supabase);
      if (!session) {
        addLog('🔒 Database Handshake: Invalid or expired session token. Retaining secure local storage mode.');
        setDbStatus('error');
        isLoadedFromDbRef.current = true;
        return;
      }

      try {
        setDbStatus('connected');
        addLog('Connecting to tour database... listening to real-time sync.');

        // STEP 1 & 2: Local IndexedDB Hydration First
        try {
          const inv = await inventoryStore.getItem('nexus_master_inventory');
          if (inv) setInventory(JSON.parse(inv as string));
          
          const pos = await posSalesStore.getItem('nexus_master_pos_sales');
          if (pos) setSales(JSON.parse(pos as string));
          else {
            const old = localStorage.getItem('nexus_core_sales_offline');
            if (old) setSales(JSON.parse(old));
          }

          const shws = await showsStore.getItem('nexus_master_shows');
          if (shws) setShows(JSON.parse(shws as string));

          const flts = await itinerariesStore.getItem('nexus_master_itineraries');
          if (flts) setFlights(JSON.parse(flts as string));

          const revs = await reviewsStore.getItem('nexus_master_reviews');
          if (revs) setUserReviews(JSON.parse(revs as string));
        } catch (err) {
          console.error('IDB Hydration Error:', err);
        }

        // Try load sales
        try {
          const { data: salesDb, error: salesErr } = await supabase
            .from('sales')
            .select('*')
            .order('created_at', { ascending: false });
          if (!salesErr && salesDb) {
            if (salesDb.length > 0) {
              const mockSaleIds = new Set([].map(s => s.id));
              const realSales = salesDb.filter((s: any) => !mockSaleIds.has(s.id));

              if (salesDb.length > realSales.length) {
                // Clean up mock sales from DB
                supabase.from('sales').delete().in('id', Array.from(mockSaleIds)).then();
              }

              setSales(realSales);
              posSalesStore.setItem('nexus_master_pos_sales', JSON.stringify(realSales)).catch(console.warn);
              addLog(`Synchronized ${realSales.length} sales from database table.`);
            } else {
              addLog(`Sales table is empty in live database.`);
            }
          } else if (salesErr) {
            // Silently catch egress block, preserving UI state!
          }
        } catch (err: any) {
          // Silently catch egress block, preserving UI state!
        }

        // Try load shows
        try {
          const { data: showsDb, error: showsErr } = await supabase
            .from('shows')
            .select('*')
            .order('date', { ascending: true });
          if (!showsErr && showsDb) {
            if (showsDb.length > 0) {
              const mockShowIds = new Set([].map(s => s.id));
              const realShows = showsDb.filter((s: any) => !mockShowIds.has(s.id));

              if (showsDb.length > realShows.length) {
                // Clean up mock shows from DB
                supabase.from('shows').delete().in('id', Array.from(mockShowIds)).then();
              }

              let mergedShows = realShows as Show[];
              try {
                const existing = localStorage.getItem('nexus_core_shows_extended');
                const extendedMap = existing ? JSON.parse(existing) : {};
                let deletedShowIds = new Set<string>();
                try {
                  const rawDel = localStorage.getItem('nexus_deleted_community_shows');
                  if (rawDel) {
                    const delList: string[] = JSON.parse(rawDel);
                    delList.forEach(item => deletedShowIds.add(String(item).toLowerCase().trim()));
                  }
                  const rawPromoterDel = localStorage.getItem('nexus_promoter_deleted_shows');
                  if (rawPromoterDel) {
                    const pDelList: string[] = JSON.parse(rawPromoterDel);
                    pDelList.forEach(item => deletedShowIds.add(String(item).toLowerCase().trim()));
                  }
                } catch (_) {}

                const seenShowIds = new Set<string>();
                const seenShowSigs = new Set<string>();
                const uniqueShows: Show[] = [];

                for (const s of realShows) {
                  const extra = extendedMap[s.id] || (s.show_name ? Object.values(extendedMap).find((v: any) => v.name === s.show_name || v.show_name === s.show_name || (v.date === s.date && v.city === s.city)) : null);
                  const formatted: Show = {
                    ...s,
                    name: s.name || s.show_name || s.venue || s.headliner || 'Scheduled Show',
                    show_name: s.show_name || s.name || 'Scheduled Show',
                    venue: s.venue || s.venue_name || s.venue_address || s.name || s.show_name,
                    venue_name: s.venue_name || s.venue || s.name,
                    date: s.date || s.show_date,
                    ...(extra || {})
                  };

                  const sId = String(formatted.id || '').trim();
                  const sName = String((formatted as any).headliner || formatted.name || (formatted as any).show_name || '').toLowerCase().trim();
                  const sDate = String(formatted.date || '').toLowerCase().trim();
                  const sSig = `${sName}__${sDate}`;

                  if (sId && deletedShowIds.has(sId.toLowerCase())) continue;
                  if (sName && sDate && deletedShowIds.has(sSig)) continue;

                  if (sId && seenShowIds.has(sId)) continue;
                  if (sName && sDate && seenShowSigs.has(sSig)) continue;

                  if (sId) seenShowIds.add(sId);
                  if (sName && sDate) seenShowSigs.add(sSig);
                  uniqueShows.push(formatted);
                }
                mergedShows = uniqueShows;
              } catch (_) {}
              setShows(mergedShows);
              showsStore.setItem('nexus_master_shows', JSON.stringify(mergedShows)).catch(console.warn);
              addLog(`Synchronized ${realShows.length} tours from database table.`);
            } else {
              addLog(`Shows table is empty in live database.`);
            }
          } else if (showsErr) {
             // Silently catch egress block, preserving UI state!
          }
        } catch (err: any) {
           // Silently catch egress block, preserving UI state!
        }

        // Try load notes
        try {
          const { data: notesDb, error: notesErr } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });
          if (!notesErr && notesDb) {
            if (notesDb.length > 0) {
              const mockNoteIds = new Set([].map(n => n.id));
              const realNotes = notesDb.filter((n: any) => !mockNoteIds.has(n.id));

              if (notesDb.length > realNotes.length) {
                supabase.from('notes').delete().in('id', Array.from(mockNoteIds)).then();
              }

              setNotes(realNotes);
              saveToFailoverCache('notes', realNotes);
              addLog(`Synchronized ${realNotes.length} tour notes.`);
            } else {
              addLog(`Notes table is empty in live database.`);
              setNotes([]);
              saveToFailoverCache('notes', []);
            }
          } else if (notesErr) {
            if (isBypassRequiredError(notesErr)) {
              addLog(`⚡ [EGRESS LOCK] Blocked standard 'notes' API gateway. Failover active.`);
              const localNotes = handleDatabaseFailover('notes', []);
              setNotes(localNotes);
            } else {
              addLog(`Querying 'notes' failed: ${notesErr.message}`);
            }
          }
        } catch (err: any) {
          if (isBypassRequiredError(err)) {
            addLog(`⚡ [EGRESS LOCK] Blocked standard 'notes' network. Failover active.`);
            const localNotes = handleDatabaseFailover('notes', []);
            setNotes(localNotes);
          } else {
            console.error('Unhandled notes fetch exception:', err);
          }
        }

        // Try load inventory
        try {
          const { data: inventoryDb, error: inventoryErr } = await supabase
            .from('inventory')
            .select('id, name, table_stock, van_stock, low_threshold, status, item_type, price, image_url, image_path, border_color, band_id, is_exclusive, sku, initial_batch_size, cost, barcode, variants');
          if (!inventoryErr && inventoryDb) {
            let cachedVariants: Record<string, any> = {};
            try {
              const cvStr = localStorage.getItem('nexus_core_variants_cache');
              if (cvStr) cachedVariants = JSON.parse(cvStr);
            } catch (_) {}

            const formatted = inventoryDb.map((item: any) => ({
              ...item,
              image_url: resolveInventoryImageUrl(item),
              image_path: item.image_path || undefined,
              variants: item.variants || cachedVariants[item.id],
              band_id: item.band_id || activeBandIdRef.current
            }));

            // --- OFFLINE/BYPASS UNION MERGE ---
            const suffix = activeBandIdRef.current || userProfileRef.current?.id || 'offline';
            let existingLocal: InventoryItem[] = [];
            try {
              const cachedStr = localStorage.getItem(`nexus_core_${suffix}_inventory_offline`);
              if (cachedStr) existingLocal = JSON.parse(cachedStr);
            } catch (_) {}

            const dbIdSet = new Set(formatted.map(item => item.id));
            const localOnlyItems = existingLocal.filter(item => item && item.id && !dbIdSet.has(item.id));
            const merged = [...formatted, ...localOnlyItems];

            setInventory(merged as InventoryItem[]);
            inventoryStore.setItem('nexus_master_inventory', JSON.stringify(merged)).catch(console.warn);

            if (formatted.length > 0) {
              if (localOnlyItems.length > 0) {
                addLog(`Synchronized ${formatted.length} inventory products from Supabase. Merged and preserved ${localOnlyItems.length} unsynced local items.`);
              } else {
                addLog(`Synchronized ${formatted.length} inventory products from Supabase.`);
              }
            } else {
              addLog(`Inventory table is empty in live database. Restored ${localOnlyItems.length} cached items.`);
            }
          } else if (inventoryErr) {
            // Silently catch egress block, preserving UI state!
          }
        } catch (e: any) {
          // Silently catch egress block, preserving UI state!
        }

        // Try load inventory audits
        try {
          const { data: auditsDb, error: auditsErr } = await supabase
            .from('inventory_audits')
            .select('*');
          if (!auditsErr && auditsDb && auditsDb.length > 0) {
            setInventoryAudits(auditsDb as any[]);
            saveToFailoverCache('inventory_audits', auditsDb as any[]);
            addLog(`Synchronized ${auditsDb.length} inventory audits from Supabase.`);
          } else if (auditsErr) {
            if (isBypassRequiredError(auditsErr)) {
              addLog(`⚡ [EGRESS LOCK] Blocked 'inventory_audits' API gateway. Failover active.`);
              const localAudits = handleDatabaseFailover('inventory_audits', []);
              setInventoryAudits(localAudits);
            }
          }
        } catch (e: any) {
          if (isBypassRequiredError(e)) {
            addLog(`⚡ [EGRESS LOCK] Blocked 'inventory_audits' network. Failover active.`);
            const localAudits = handleDatabaseFailover('inventory_audits', []);
            setInventoryAudits(localAudits);
          } else {
            console.error('Error loading audits from Supabase:', e);
          }
        }

        // Try load flights
        try {
          const { data: flightsDb, error: flightsErr } = await supabase
            .from('flights')
            .select('*');
          if (!flightsErr && flightsDb) {
            if (flightsDb.length > 0) {
              const formattedFlights: Flight[] = flightsDb.map((f: any) => ({
                id: f.id,
                travelerName: f.traveler_name,
                airline: f.airline,
                flightNumber: f.flight_number,
                departureAirport: f.departure_airport,
                arrivalAirport: f.arrival_airport,
                departureTime: f.departure_time,
                arrivalTime: f.arrival_time,
                status: f.status,
                gate: f.gate || '',
                notes: f.notes || ''
              }));
              setFlights(formattedFlights);
              itinerariesStore.setItem('nexus_master_itineraries', JSON.stringify(formattedFlights)).catch(console.warn);
              addLog(`Synchronized ${formattedFlights.length} crew flights from Supabase.`);
            } else {
              addLog(`Flights table is empty in live database.`);
            }
          } else if (flightsErr) {
             // Silently catch egress block, preserving UI state!
          }
        } catch (e: any) {
           // Silently catch egress block, preserving UI state!
        }

        // Try load music_tracks count
        try {
          if (activeBandId && activeBandId.trim() !== '') {
            const { count, error: mCountErr } = await supabase
              .from('music_tracks')
              .select('*', { count: 'exact', head: true })
              .eq('band_id', activeBandId);
            if (!mCountErr && count !== null) {
              setMusicTrackCount(count);
            } else {
              setMusicTrackCount(0);
            }
          } else {
            console.warn('[Tracks] Skipped fetch: activeBandId is missing or empty.');
            setMusicTrackCount(0);
          }
        } catch (e: any) {
          setMusicTrackCount(0);
        }

        // Try load user reviews
        try {
          const { data: reviewsDb, error: reviewsErr } = await supabase
            .from('user_reviews')
            .select('*');
          if (!reviewsErr && reviewsDb && reviewsDb.length > 0) {
            setUserReviews(reviewsDb as UserReview[]);
            reviewsStore.setItem('nexus_master_reviews', JSON.stringify(reviewsDb)).catch(console.warn);
            addLog(`Synchronized ${reviewsDb.length} user reviews from Supabase.`);
          } else if (reviewsErr) {
             // Silently catch egress block, preserving UI state!
          }
        } catch (e: any) {
           // Silently catch egress block, preserving UI state!
        }

        // Try load loyalty members
        try {
          const { data: loyaltyDb, error: loyaltyErr } = await supabase
            .from('loyalty_members')
            .select('*')
            .order('created_at', { ascending: false });
          if (!loyaltyErr && loyaltyDb) {
            if (loyaltyDb.length > 0) {
              setLoyaltyMembers(loyaltyDb as LoyaltyMember[]);
              saveToFailoverCache('loyalty_members', loyaltyDb as LoyaltyMember[]);
              addLog(`Synchronized ${loyaltyDb.length} legacy loyalty program members from Supabase.`);
            } else {
              addLog(`Loyalty members table is clean in live database.`);
            }
          } else if (loyaltyErr) {
            if (isBypassRequiredError(loyaltyErr)) {
              addLog(`⚡ [EGRESS LOCK] Blocked 'loyalty_members' API gateway. Failover active.`);
              const localLoyalty = handleDatabaseFailover('loyalty_members', []);
              setLoyaltyMembers(localLoyalty);
            }
          }
        } catch (e: any) {
          if (isBypassRequiredError(e)) {
            addLog(`⚡ [EGRESS LOCK] Blocked 'loyalty_members' network. Failover active.`);
            const localLoyalty = handleDatabaseFailover('loyalty_members', []);
            setLoyaltyMembers(localLoyalty);
          } else {
            console.error('Error loading loyalty members from Supabase:', e);
          }
        }

        // Try load asset_revenue_splits
        try {
          const { data: splitsDb, error: splitsErr } = await supabase
            .from('asset_revenue_splits')
            .select('*');
          if (!splitsErr && splitsDb) {
             setRevenueSplits(splitsDb as AssetRevenueSplit[]);
          }
        } catch (e: any) {}

        // Try load band_join_requests_v1
        try {
          const { data: bjrDb, error: bjrErr } = await supabase
            .from('band_join_requests_v1')
            .select('*')
            .order('created_at', { ascending: false });
          if (!bjrErr && bjrDb) {
             setBandJoinRequests(bjrDb as BandJoinRequest[]);
             saveToFailoverCache('band_join_requests_v1', bjrDb as BandJoinRequest[]);
          } else if (bjrErr) {
            if (isBypassRequiredError(bjrErr)) {
              addLog(`⚡ [EGRESS LOCK] Blocked 'band_join_requests_v1' API gateway. Failover active.`);
              const localBjr = handleDatabaseFailover('band_join_requests_v1', []);
              if (localBjr.length > 0) setBandJoinRequests(localBjr);
            }
          }
        } catch (e: any) {
          if (isBypassRequiredError(e)) {
            addLog(`⚡ [EGRESS LOCK] Blocked 'band_join_requests_v1' network. Failover active.`);
            const localBjr = handleDatabaseFailover('band_join_requests_v1', []);
            if (localBjr.length > 0) setBandJoinRequests(localBjr);
          }
        }

        // Try load nexus_notifications
        try {
          const { data: notificationsDb, error: notifErr } = await supabase
            .from('nexus_notifications')
            .select('*')
            .order('created_at', { ascending: false });
          if (!notifErr && notificationsDb && notificationsDb.length > 0) {
            // Deduplicate loaded notifications to guarantee no duplicates reach the state
            const seenIds = new Set<string>();
            const seenMessages = new Map<string, number>();
            const cleanNotifs = (notificationsDb as any[]).map(row => ({
              ...row,
              message: row.message || row.content || row.title || row.body || '',
              category: row.category || row.type || 'SYSTEM'
            })).filter(notif => {
              if (!notif || !notif.id) return false;
              if (seenIds.has(notif.id)) return false;
              seenIds.add(notif.id);

              const msgKey = `${notif.category || ''}:${notif.message}`;
              const notifTime = new Date(notif.created_at || Date.now()).getTime();
              if (seenMessages.has(msgKey)) {
                const prevTime = seenMessages.get(msgKey)!;
                if (Math.abs(notifTime - prevTime) < 5000) {
                  return false;
                }
              }
              seenMessages.set(msgKey, notifTime);
              return true;
            });
            setNotifications(cleanNotifs);
            saveToFailoverCache('nexus_notifications', cleanNotifs);
            addLog(`Synchronized ${cleanNotifs.length} security broadcast alerts from Supabase (deduplicated).`);
          } else if (notifErr) {
            if (isBypassRequiredError(notifErr)) {
              addLog(`⚡ [EGRESS LOCK] Blocked 'nexus_notifications' API gateway. Failover active.`);
              const localNotif = handleDatabaseFailover('nexus_notifications', []);
              setNotifications(localNotif);
            }
          }
        } catch (e: any) {
          if (isBypassRequiredError(e)) {
            addLog(`⚡ [EGRESS LOCK] Blocked 'nexus_notifications' network. Failover active.`);
            const localNotif = handleDatabaseFailover('nexus_notifications', []);
            setNotifications(localNotif);
          } else {
            console.error('Error loading notifications from Supabase:', e);
          }
        }

        // Set live DB load completion flag
        isLoadedFromDbRef.current = true;


        // Guard against race conditions where the component has already unmounted before async loads resolved
        if (!active) return;

        // Realtime Subscription listeners
        const unsubscribeSales = subscribeToTable('sales', (payload) => {
          addLog(`[REALTIME SALES] received: ${payload.eventType}`);
          if (payload.eventType === 'INSERT') {
            setSales(prev => {
              // 1. Deduplicate by precise ID
              if ((prev || []).some(s => s.id === payload.new.id)) {
                return prev;
              }
              // 2. Clear out seed/fallback entries if we have them
              // 3. Prevent duplicate cards for identical transaction values inserted within 15 seconds of an optimistic local addition (in case database rewrote/ignored the client ID)
              const payloadTime = new Date(payload.new.created_at).getTime();
              const isRecentDuplicate = (prev || []).some(s => 
                s.item_name === payload.new.item_name &&
                Math.abs(s.amount - payload.new.amount) < 0.01 &&
                Math.abs(new Date(s.created_at).getTime() - payloadTime) < 15000
              );
              if (isRecentDuplicate) {
                // Replace the optimistic one with the real one (so it features the official database ID)
                return prev.map(s => {
                  const checkTime = new Date(s.created_at).getTime();
                  if (s.item_name === payload.new.item_name &&
                      Math.abs(s.amount - payload.new.amount) < 0.01 &&
                      Math.abs(checkTime - payloadTime) < 15000) {
                    return payload.new as Sale;
                  }
                  return s;
                });
              }
              return [payload.new as Sale, ...prev];
            });
            triggerNotification('Live sale alert!');
          } else if (payload.eventType === 'UPDATE') {
            setSales(prev => prev.map(s => s.id === payload.new.id ? (payload.new as Sale) : s));
          } else if (payload.eventType === 'DELETE') {
            setSales(prev => prev.filter(s => s.id !== payload.old.id));
          }
        });
        if (unsubscribeSales) {
          if (!active) unsubscribeSales();
          else unsubscribers.push(unsubscribeSales);
        }

        const unsubscribeShows = subscribeToTable('shows', (payload) => {
          addLog(`[REALTIME SHOWS] received: ${payload.eventType}`);
          if (payload.eventType === 'INSERT') {
            setShows(prev => {
              if ((prev || []).some(s => s.id === payload.new.id)) {
                return prev;
              }
              return [...prev, payload.new as Show];
            });
          } else if (payload.eventType === 'DELETE') {
            setShows(prev => prev.filter(s => s.id !== payload.old.id));
          }
        });
        if (unsubscribeShows) {
          if (!active) unsubscribeShows();
          else unsubscribers.push(unsubscribeShows);
        }

        const unsubscribeNotes = subscribeToTable('notes', (payload) => {
          addLog(`[REALTIME NOTES] received: ${payload.eventType}`);
          if (payload.eventType === 'INSERT') {
            setNotes(prev => {
              if ((prev || []).some(n => n.id === payload.new.id)) {
                return prev;
              }
              const isFallback = (prev || []).some(n => n.id === 'note_01' || n.id === 'note_02');
              if (isFallback) {
                return [payload.new as TourNote];
              }
              return [payload.new as TourNote, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(n => n.id !== payload.old.id));
          }
        });
        if (unsubscribeNotes) {
          if (!active) unsubscribeNotes();
          else unsubscribers.push(unsubscribeNotes);
        }

        const unsubscribeFlights = subscribeToTable('flights', (payload) => {
          addLog(`[REALTIME FLIGHTS] received: ${payload.eventType}`);
          if (payload.eventType === 'INSERT') {
            const formatted = {
              id: payload.new.id,
              travelerName: payload.new.traveler_name,
              airline: payload.new.airline,
              flightNumber: payload.new.flight_number,
              departureAirport: payload.new.departure_airport,
              arrivalAirport: payload.new.arrival_airport,
              departureTime: payload.new.departure_time,
              arrivalTime: payload.new.arrival_time,
              status: payload.new.status,
              gate: payload.new.gate || '',
              notes: payload.new.notes || ''
            };
            setFlights(prev => {
              if ((prev || []).some(f => f.id === formatted.id)) return prev;
              return [formatted, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const formatted = {
              id: payload.new.id,
              travelerName: payload.new.traveler_name,
              airline: payload.new.airline,
              flightNumber: payload.new.flight_number,
              departureAirport: payload.new.departure_airport,
              arrivalAirport: payload.new.arrival_airport,
              departureTime: payload.new.departure_time,
              arrivalTime: payload.new.arrival_time,
              status: payload.new.status,
              gate: payload.new.gate || '',
              notes: payload.new.notes || ''
            };
            setFlights(prev => prev.map(f => f.id === formatted.id ? formatted : f));
          } else if (payload.eventType === 'DELETE') {
            setFlights(prev => prev.filter(f => f.id !== payload.old.id));
          }
        });
        if (unsubscribeFlights) {
          if (!active) unsubscribeFlights();
          else unsubscribers.push(unsubscribeFlights);
        }

        const unsubscribeReviews = subscribeToTable('user_reviews', (payload) => {
          addLog(`[REALTIME REVIEWS] received: ${payload.eventType}`);
          if (payload.eventType === 'INSERT') {
            setUserReviews(prev => {
              if ((prev || []).some(r => r.id === payload.new.id)) return prev;
              return [payload.new as UserReview, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setUserReviews(prev => prev.filter(r => r.id !== payload.old.id));
          }
        });
        if (unsubscribeReviews) {
          if (!active) unsubscribeReviews();
          else unsubscribers.push(unsubscribeReviews);
        }

        const unsubscribeAudits = subscribeToTable('inventory_audits', (payload) => {
          addLog(`[REALTIME AUDITS] received: ${payload.eventType}`);
          if (payload.eventType === 'INSERT') {
            setInventoryAudits(prev => {
              if ((prev || []).some(a => a.id === payload.new.id)) return prev;
              return [payload.new as InventoryAudit, ...prev];
            });
          }
        });
        if (unsubscribeAudits) {
          if (!active) unsubscribeAudits();
          else unsubscribers.push(unsubscribeAudits);
        }

        const unsubscribeLoyalty = subscribeToTable('loyalty_members', (payload) => {
          addLog(`[REALTIME LOYALTY] received: ${payload.eventType}`);
          if (payload.eventType === 'INSERT') {
            setLoyaltyMembers(prev => {
              if ((prev || []).some(m => m.id === payload.new.id)) return prev;
              return [payload.new as LoyaltyMember, ...prev];
            });
            triggerNotification(`🎉 VIP Loyalty signup: ${payload.new.name}!`);
          } else if (payload.eventType === 'UPDATE') {
            setLoyaltyMembers(prev => prev.map(m => m.id === payload.new.id ? (payload.new as LoyaltyMember) : m));
          } else if (payload.eventType === 'DELETE') {
            setLoyaltyMembers(prev => prev.filter(m => m.id !== payload.old.id));
          }
        });
        if (unsubscribeLoyalty) {
          if (!active) unsubscribeLoyalty();
          else unsubscribers.push(unsubscribeLoyalty);
        }

      } catch (e: any) {
        setDbStatus('error');
        addLog(`Database link issue: ${e.message}`);
      }
    };

    hydrateModuleData();

    return () => {
      active = false;
      unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch (unsubErr) {
          console.error('Error executing subscript cleanup hook:', unsubErr);
        }
      });
    };
  }, [supabaseUrl, supabaseKey, isOnline]);

  // 4-card auto carousel states for left dashboard metrics
  const [leftCarouselIndex, setLeftCarouselIndex] = useState(0);
  const [isLeftCardPaused, setIsLeftCardPaused] = useState(false);
  const [isMetricCarouselPaused, setIsMetricCarouselPaused] = useState(false);
  const [isGlobalHoverPaused, setIsGlobalHoverPaused] = useState(false);
  const [isEditingSalesGoal, setIsEditingSalesGoal] = useState(false);
  const [salesGoalInput, setSalesGoalInput] = useState('');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // Mobile Swipe/Touch Ref Tracker for left metrics carousel
  const leftTouchStartXRef = useRef<number | null>(null);
  const leftTouchEndXRef = useRef<number | null>(null);
  const leftTouchTimerRef = useRef<any>(null);

  const handleLeftTouchStart = (e: React.TouchEvent) => {
    leftTouchStartXRef.current = e.targetTouches[0].clientX;
    leftTouchEndXRef.current = e.targetTouches[0].clientX;
    
    if (leftTouchTimerRef.current) {
      clearTimeout(leftTouchTimerRef.current);
      leftTouchTimerRef.current = null;
    }
    
    // Pause immediately on mobile touch start so it does not auto-advance while they are looking, tapping or dragging
    setIsLeftCardPaused(true);
    setIsGlobalHoverPaused(true);
  };

  const handleLeftTouchMove = (e: React.TouchEvent) => {
    leftTouchEndXRef.current = e.targetTouches[0].clientX;
    setIsLeftCardPaused(true);
    setIsGlobalHoverPaused(true);
  };

  const handleLeftTouchEnd = () => {
    if (leftTouchStartXRef.current === null || leftTouchEndXRef.current === null) return;
    const diffX = leftTouchStartXRef.current - leftTouchEndXRef.current;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        // swipe left -> show next card
        setLeftCarouselIndex((prev) => (prev + 1) % 4);
      } else {
        // swipe right -> show prev card
        setLeftCarouselIndex((prev) => (prev - 1 + 4) % 4);
      }
    }
    // reset trackers
    leftTouchStartXRef.current = null;
    leftTouchEndXRef.current = null;

    if (leftTouchTimerRef.current) {
      clearTimeout(leftTouchTimerRef.current);
    }
    
    // Set a timeout of 12 seconds of complete idle-ness on touch end, 
    // before auto-rotating resumes. This gives them plenty of time 
    // to view, interact, click, type or look without interruption.
    leftTouchTimerRef.current = setTimeout(() => {
      const activeEl = document.activeElement;
      const isEditing = isEditingSalesGoal || (activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName));
      if (!isEditing) {
        setIsLeftCardPaused(false);
        setIsGlobalHoverPaused(false);
      }
    }, 12000);
  };

  // Derived dashboard metrics
  const todayStrValForSales = new Date().toISOString().split('T')[0];
  const todaySalesOnly = filteredSales.filter(sale => {
    if (!sale.created_at) return false;
    return sale.created_at.split('T')[0] === todayStrValForSales;
  });
  const todayRevenue = todaySalesOnly.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);
  const isCritical = (filteredInventory || []).some(i => (i.table_stock || 0) <= 25);
  const totalTableStock = filteredInventory.reduce((sum, item) => sum + (item.table_stock || 0), 0);
  const totalVanStock = filteredInventory.reduce((sum, item) => sum + (item.van_stock || 0), 0);

  // Derived expense metrics
  const dailyExpensesTotal = useMemo(() => {
    const todayStrVal = new Date().toISOString().split('T')[0];
    return expenses
      .filter(e => e.date === todayStrVal)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);
  
  const runningExpensesTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const expensePerShow = useMemo(() => {
    const showsCount = filteredShows.length || 1;
    return runningExpensesTotal / showsCount;
  }, [runningExpensesTotal, filteredShows.length]);

  // Derived top selling items with active images from inventory
  const topSellingItems = useMemo(() => {
    // Collect and sum quantities
    const itemMap: Record<string, number> = {};
    filteredSales.forEach(sale => {
      itemMap[sale.item_name] = (itemMap[sale.item_name] || 0) + (sale.quantity || 1);
    });

    const sortedList = Object.entries(itemMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const mapped = sortedList.slice(0, 3).map(si => {
      const dbMatch = inventory.find(inv => inv.name === si.name);
      return {
        name: si.name,
        count: si.count,
        imageUrl: dbMatch?.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop'
      };
    });

    // Handle under 3 sold fallback to showcase live catalog
    if (mapped.length < 3) {
      const activeNames = new Set(mapped.map(m => m.name));
      const fallbackPool = [...inventory].sort((a, b) => b.van_stock - a.van_stock);
      for (const item of fallbackPool) {
        if (mapped.length >= 3) break;
        if (!activeNames.has(item?.name)) {
          mapped.push({
            name: item?.name,
            count: 0,
            imageUrl: item.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop'
          });
          activeNames.add(item?.name);
        }
      }
    }

    return mapped;
  }, [filteredSales, inventory]);

  // Active or next scheduled show (closest to today, within 1 year in the future)
  const sortedShows = [...filteredShows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const todayStr = new Date().toISOString().split('T')[0];
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const oneYearFromNowStr = oneYearFromNow.toISOString().split('T')[0];
  
  const currentOrNextShow = sortedShows.find(s => s.date >= todayStr && s.date <= oneYearFromNowStr) || null;
  
  // Calculate active shows needing settlement
  const showsNeedingSettlement = useMemo(() => {
    return filteredShows.filter(show => {
      if (show.status !== 'Active') return false;
      
      const parts = show.date.split('-');
      if (parts.length !== 3) return false;
      const [year, month, day] = parts.map(Number);
      
      let targetHour = 23; // Default 11:00 PM local time
      let targetMinute = 0;
      
      if (show.curfew_time) {
        const timeParts = show.curfew_time.split(':');
        if (timeParts.length >= 2) {
          const h = Number(timeParts[0]);
          const m = Number(timeParts[1]);
          if (!isNaN(h) && !isNaN(m)) {
            targetHour = h;
            targetMinute = m;
          }
        }
      }
      
      const endThreshold = new Date(year, month - 1, day, targetHour, targetMinute, 0);
      
      // If curfew hour is early AM (like 2am), shift the date by 1 to have 2 AM on the next day
      if (targetHour < 5) {
        endThreshold.setDate(endThreshold.getDate() + 1);
      }
      
      return currentTime >= endThreshold;
    });
  }, [filteredShows, currentTime]);

  const hasSettleReminder = showsNeedingSettlement.length > 0;
  const firstShowToSettle = showsNeedingSettlement[0] || null;

  const activeShowDisplay = currentOrNextShow 
    ? (currentOrNextShow.festival_name || currentOrNextShow.name)
    : "No Shows or Tours Currently booked";

  // Countdown calculations
  const countdownString = useMemo(() => {
    if (!currentOrNextShow) return "No Shows or Tours Currently booked";
    
    const [year, month, day] = currentOrNextShow.date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day, 20, 0, 0); // 8:00 PM local time
    
    const diffMs = targetDate.getTime() - currentTime.getTime();
    if (diffMs <= 0) {
      const endWindow = targetDate.getTime() + (3 * 60 * 60 * 1000); // 3-hour show window
      if (currentTime.getTime() < endWindow) {
        return "SHOW IN PROGRESS ● LIVE NOW";
      }
      return "Show concluded";
    }
    
    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    
    return `${hours}h ${minutes}m ${seconds}s until show start`;
  }, [currentOrNextShow?.date, currentTime]);

  // Show specific notes
  const showSpecificNotes = useMemo(() => {
    if (!currentOrNextShow) return [];
    return filteredNotes.filter(n => n.show_id === currentOrNextShow.id);
  }, [filteredNotes, currentOrNextShow?.id]);

  // Table stock percentages
  const tableStockPercent = useMemo(() => {
    const maxPotential = (totalTableStock + totalVanStock) || 1;
    return Math.min(100, Math.round((totalTableStock / maxPotential) * 100));
  }, [totalTableStock, totalVanStock]);

  // Metric Carousel states & derived metrics
  const totalSalesCount = filteredSales.length;
  const todaySalesCount = todaySalesOnly.length;
  const todayItemsSold = todaySalesOnly.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const tourTotalRevenue = filteredSales.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);
  const averageSaleValue = totalSalesCount > 0 ? tourTotalRevenue / totalSalesCount : 0;

  // Find top seller item name
  const itemCounts = filteredSales.reduce((acc, saleItem) => {
    acc[saleItem.item_name] = (acc[saleItem.item_name] || 0) + (saleItem.quantity || 1);
    return acc;
  }, {} as Record<string, number>);

  let topSellerName = "None";
  let maxCount = 0;
  (Object.entries(itemCounts) as [string, number][]).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topSellerName = name;
    }
  });

  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);

  useEffect(() => {
    if (isMetricCarouselPaused || isGlobalHoverPaused) return;
    const timer = setInterval(() => {
      setCurrentMetricIndex(prev => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, [isMetricCarouselPaused, isGlobalHoverPaused]);

  // Team Carousel Slider state
  const [teamCarouselIndex, setTeamCarouselIndex] = useState(0);
  const [isTeamCarouselPaused, setIsTeamCarouselPaused] = useState(false);

  // Auto-rotate Live Team/Activity every 5 seconds
  useEffect(() => {
    if (isTeamCarouselPaused || isGlobalHoverPaused) return;
    const timer = setInterval(() => {
      setTeamCarouselIndex(prev => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, [isTeamCarouselPaused, isGlobalHoverPaused]);

  // Dashboard Block 8 Carousel (Setlist / Guestlist) states
  const [dashboardCarouselIndex, setDashboardCarouselIndex] = useState(0); // 0 = Setlists, 1 = Guestlist
  const [selectedGuestlistShowId, setSelectedGuestlistShowId] = useState<string>('');

  // Left card auto-rotation handler (runs every 6.5s unless paused)
  useEffect(() => {
    if (isLeftCardPaused || isGlobalHoverPaused) return;
    const timer = setInterval(() => {
      setLeftCarouselIndex(prev => (prev + 1) % 4);
    }, 6500);
    return () => clearInterval(timer);
  }, [isLeftCardPaused, isGlobalHoverPaused]);

  const handleAddExpense = (description: string, amount: number) => {
    const newExp = {
      id: 'exp_' + Date.now(),
      description: description.trim(),
      amount,
      date: new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => {
      const updated = [newExp, ...prev];
      localStorage.setItem('nexus_core_expenses', JSON.stringify(updated));
      return updated;
    });
    addLog(`Recorded tour expense: "${description}" for $${amount}`);
    triggerNotification(`Added expense: $${amount}`);
  };

  const handleSaveSalesGoal = (amount: number) => {
    setDailySalesGoal(amount);
    localStorage.setItem('nexus_core_sales_goal', String(amount));
    addLog(`Daily sales goal updated to $${amount}`);
    triggerNotification(`Sales goal set to $${amount}`);
  };


  // Core Crew Checklist states
  useEffect(() => {
    try {
      localStorage.setItem('nexus_core_flights', JSON.stringify(flights));
    } catch (_) {}
  }, [flights]);

  const teamMembers = useMemo(() => {
    const bandId = activeBandId || '';
    const savedTeam = localStorage.getItem(`nexus_core_team_members_${bandId}`);
    let list: any[] = [];
    if (savedTeam) {
      try {
        list = JSON.parse(savedTeam);
      } catch (e) {
        list = [];
      }
    }
    
    // Ensure we always have at least one or fallback members if none saved
    if (list.length === 0) {
      list = [
        {
          id: 't1',
          name: 'Band Member 1',
          role: 'Merch Crew Lead',
          avatar_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=120',
        },
        {
          id: 't2',
          name: 'Sarah Connor',
          role: 'Tour Manager',
          avatar_url: 'https://images.unsplash.com/photo-1484876065684-b683cf17d276?auto=format&fit=crop&q=80&w=120',
        },
        {
          id: 't3',
          name: 'David Grohl',
          role: 'Owner / Band Manager',
          avatar_url: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&q=80&w=120',
        },
        {
          id: 't4',
          name: activeBand ? activeBand?.name : 'Vocalist/Guitar',
          role: 'Artist Rep',
          avatar_url: 'https://images.unsplash.com/photo-1525201548942-d8c8b097a3c3?auto=format&fit=crop&q=80&w=120',
        }
      ];
    }

    // Now format them to fit the team carousel display format
    return list.map((m, idx) => {
      // Pick or map avatar
      let avatar = m.avatar_url || (m.isYou ? userProfile?.avatar_url : undefined);
      if (!avatar) {
        const avatars = [
          'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20Circuits.png',
          'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20Circuits.png',
          'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20bars.png',
          'https://images.unsplash.com/photo-1525201548942-d8c8b097a3c3?auto=format&fit=crop&q=80&w=120',
        ];
        avatar = avatars[idx % avatars.length];
      }
      return {
        id: m.id || `member-${idx}-${m.name || 'item'}`,
        name: m.name,
        role: m.role,
        avatar: avatar,
        status: idx === 0 || idx % 2 === 0 ? 'active' : 'idle',
        lastActive: idx === 0 ? 'Active now' : `Active ${idx * 4}m ago`
      };
    });
  }, [activeBandId, userProfile, activeTab, activeBand]);

  const teamActivities = useMemo(() => {
    const list: { id: string; user: string; avatar: string; text: string; time: string; type: string; timestamp: number }[] = [];

    // 1. Convert real sales into activity items
    filteredSales.slice(0, 20).forEach((sale, index) => {
      // Pick a real team member dynamically
      const member = teamMembers[index % teamMembers.length] || {
        name: 'Band Member 1',
        avatar: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=120'
      };
      
      const timeMs = sale.created_at ? Date.parse(sale.created_at) : Date.now() - index * 60000;
const timeAgo = sale.created_at ? formatTimeAgo(sale.created_at) : 'Just now';
list.push({
  id: `sale-activity-${sale.id || index}`,
  user: member?.name,
  avatar: member.avatar,
  text: `sold ${sale.quantity || 1}x ${sale.item_name} via ${sale.payment_method} ($${((sale.amount ?? 0) * (sale.quantity || 1)).toFixed(2)})`,
  time: timeAgo,
  type: 'sale',
  timestamp: timeMs
});
    });

    // 2. Convert real notes into activity items
    filteredNotes.slice(0, 20).forEach((note, index) => {
      // Pick a real team member dynamically from members (starting from index 1 to vary)
      const member = teamMembers[(index + 1) % teamMembers.length] || {
        name: 'Sarah Connor',
        avatar: 'https://images.unsplash.com/photo-1484876065684-b683cf17d276?auto=format&fit=crop&q=80&w=120'
      };
      
      const timeMs = note.created_at ? Date.parse(note.created_at) : Date.now() - index * 120000;
const timeAgo = note.created_at ? formatTimeAgo(note.created_at) : 'A while ago';
list.push({
  id: `note-activity-${note.id || index}`,
  user: member?.name,
  avatar: member.avatar,
  text: `added tour note: "${note.text.length > 28 ? note.text.substring(0, 28) + '...' : note.text}"`,
  time: timeAgo,
  type: 'note',
  timestamp: timeMs
});
    });

    // Sort combined activities by timestamp descending
    list.sort((a, b) => b.timestamp - a.timestamp);

    // 3. Fallback simulated entries to keep the view active and collaborative
    if (list.length < 3) {
      const m0 = teamMembers[0] || { name: 'Band Member 1', avatar: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=120' };
      const m1 = teamMembers[1] || m0;
      const m2 = teamMembers[2] || m0;

      list.push({
        id: 'init-1',
        user: m0.name,
        avatar: m0.avatar,
        text: 'synchronized table stock counts for tonight',
        time: '5m ago',
        type: 'stock',
        timestamp: Date.now() - 5 * 60000
      });
      list.push({
        id: 'init-2',
        user: m1.name,
        avatar: m1.avatar,
        text: 'updated guestlist door instructions',
        time: '12m ago',
        type: 'logistics',
        timestamp: Date.now() - 12 * 60000
      });
      list.push({
        id: 'init-3',
        user: m2.name,
        avatar: m2.avatar,
        text: 'confirmed Sound Check clear with Venue PA',
        time: '1h ago',
        type: 'show',
        timestamp: Date.now() - 60 * 65000
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
    }

    return list.slice(0, 20);
  }, [filteredSales, filteredNotes, teamMembers]);

  const totalInventoryValue = useMemo(() => {
    return filteredInventory.reduce((sum, item) => sum + ((item.table_stock || 0) + (item.van_stock || 0)) * (item.price || 0), 0);
  }, [filteredInventory]);

  const metrics = [
    {
      id: "revenue",
      title: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      color: "#00d195",
      textColor: "text-[#00ffcc]",
      bgClass: "from-emerald-950/15 via-zinc-900/10 to-emerald-900/15",
      borderClass: "border-[#00d195]/40 hover:border-[#00d195]",
      dotClass: "bg-[#00ffcc]",
      icon: <DollarSign className="w-3.5 h-3.5 text-[#00d195]" />
    },
    {
      id: "topseller",
      title: "Top Seller",
      value: topSellerName.length > 22 ? topSellerName.substring(0, 20) + "..." : topSellerName,
      color: "#a3e635",
      textColor: "text-[#a3e635]",
      bgClass: "from-lime-950/15 via-zinc-900/10 to-lime-950/15",
      borderClass: "border-[#a3e635]/40 hover:border-[#a3e635]",
      dotClass: "bg-[#a3e635]",
      icon: <Star className="w-3.5 h-3.5 text-[#a3e635]" />
    },
    {
      id: "salescount",
      title: "Sales Count",
      value: `${todaySalesCount} ${todaySalesCount === 1 ? 'Sale' : 'Sales'}`,
      color: "#a855f7",
      textColor: "text-[#a855f7]",
      bgClass: "from-purple-950/15 via-zinc-900/10 to-purple-950/15",
      borderClass: "border-[#a855f7]/40 hover:border-[#a855f7]",
      dotClass: "bg-[#a855f7]",
      icon: <RefreshCw className="w-3.5 h-3.5 text-[#a855f7]" />
    },
    {
      id: "itemssold",
      title: "Items Sold",
      value: `${todayItemsSold} ${todayItemsSold === 1 ? 'Item' : 'Items'}`,
      color: "#3b82f6",
      textColor: "text-[#3b82f6]",
      bgClass: "from-blue-950/15 via-zinc-900/10 to-blue-950/15",
      borderClass: "border-[#3b82f6]/40 hover:border-[#3b82f6]",
      dotClass: "bg-[#3b82f6]",
      icon: <BarChart2 className="w-3.5 h-3.5 text-[#3b82f6]" />
    },
    {
      id: "averagesale",
      title: "Average Sale",
      value: `$${averageSaleValue.toFixed(2)}`,
      color: "#f59e0b",
      textColor: "text-[#f59e0b]",
      bgClass: "from-amber-950/15 via-zinc-900/10 to-amber-950/15",
      borderClass: "border-[#f59e0b]/40 hover:border-[#f59e0b]",
      dotClass: "bg-[#f59e0b]",
      icon: <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b]" />
    }
  ];


  const getCashDrawerSummary = () => {
    let startingBank = 0;
    let cashSales = 0;
    let totalPayouts = 0;
    let totalExpenses = 0;
    let bankDrops = 0;

    cashTransactions.forEach(t => {
      switch (t.type) {
        case 'starting_bank': startingBank += t.amount; break;
        case 'cash_sale': cashSales += t.amount; break;
        case 'payout': totalPayouts += t.amount; break;
        case 'expense': totalExpenses += t.amount; break;
        case 'bank_drop': bankDrops += t.amount; break;
      }
    });

    const netCash = startingBank + cashSales - totalPayouts - totalExpenses - bankDrops;
    return { startingBank, cashSales, totalPayouts, totalExpenses, bankDrops, netCash };
  };





  if (window.location.search.includes('guest_confirm=1')) {
    return (
      <GuestPassConfirmView 
        onGoToApp={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('guest_confirm');
          url.searchParams.delete('email');
          url.searchParams.delete('guestName');
          url.searchParams.delete('band');
          url.searchParams.delete('date');
          url.searchParams.delete('venue');
          url.searchParams.delete('pass_type');
          window.history.pushState(null, '', url.pathname + url.search);
          setActiveTab('home-v2');
        }}
      />
    );
  }

  if (window.location.search.includes('signup=vip')) {
    return (
      <PublicVIPKioskView 
        activeBandName={activeBand?.name || "Artist"} 
        shows={shows}
        loyaltyMembers={loyaltyMembers}
        onBackToApp={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('signup');
          window.history.pushState(null, '', url.pathname + url.search);
          setActiveTab('home-v2');
        }}
        onSignUp={(member) => {
          setLoyaltyMembers(prev => {
            const index = prev.findIndex(m => m.id === member.id || m.phone === member.phone);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = member;
              return updated;
            }
            return [member, ...prev];
          });
        }}
        onUpdateMember={(member) => {
          setLoyaltyMembers(prev => prev.map(m => m.id === member.id ? member : m));
        }}
      />
    );
  }

  if (activeTab === 'pay-portal' || window.location.pathname === '/pay') {
    return <CustomerPayView onBackToApp={() => setActiveTab('home-v2')} />;
  }

  if (activeTab === 'landing' || window.location.pathname === '/landing') {
    return <LandingView onEnterApp={() => setActiveTab('home-v2')} />;
  }

  return (
    <div className={`w-full min-h-screen text-[#f3f4f6] font-sans flex flex-col justify-start relative overflow-x-hidden ${
      (isLoggedOut && loginInitialTab === 'signup') || userProfile?.account_type === 'label' || (!isLoggedOut && (userProfile?.account_type === 'promoter' || userProfile?.account_type === 'creative'))
        ? `${(!isLoggedOut && (userProfile?.account_type === 'promoter' || userProfile?.account_type === 'creative')) ? 'bg-[#07080a]' : 'bg-[#0c0e12]'} pb-0`
        : `sm:max-w-[620px] sm:mx-auto sm:border-x sm:border-zinc-800 ${
            (showSplash || isLoggedOut) 
              ? 'bg-[#0c0e12] pb-0' 
              : (userProfile?.account_type === 'creative' || userProfile?.account_type === 'promoter') 
                ? 'bg-[#07080a] pb-0' 
                : (userProfile?.account_type === 'industry_pro' || userProfile?.account_type === 'fan_only')
                  ? 'bg-black pb-0'
                  : 'bg-[#0c0e12] pb-20'
          }`
    }`} style={{ fontSize: '16px' }}>
      
      {/* Dynamic Alert Banner */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            key="dynamic-alert-banner"
            initial={{ opacity: 1, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 1, y: -20 }}
            className="fixed top-4 left-4 right-4 sm:max-w-sm sm:left-auto sm:right-4 z-[9999] bg-[#12b295] text-black px-4 py-3 rounded-lg shadow-2xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-black/20"
          >
            <Radio className="w-4 h-4 animate-ping" />
            {showNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global NotificationCenterView Overlay */}
      {userProfile && (
        <NotificationCenterView
          userProfile={userProfile}
          notifications={notifications}
          setNotifications={setNotifications}
          onMarkAsRead={handleMarkNotificationAsRead}
          onNavigateToInventory={() => {
            setActiveTab('inventory');
            setIsTransferModalOpen(true);
          }}
          onNavigateToPost={(postId) => {
            setActiveTab('social');
            setIsNotificationDrawerOpen(false);
            setTimeout(() => {
              const postEl = document.getElementById(`post`);
              if (postEl) {
                postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                postEl.classList.add('ring-2', 'ring-purple-500', 'scale-[1.01]', 'duration-500');
                setTimeout(() => {
                  postEl.classList.remove('ring-2', 'ring-purple-500', 'scale-[1.01]');
                }, 3000);
              }
            }, 300);
          }}
          isOpen={isNotificationDrawerOpen}
          onClose={() => setIsNotificationDrawerOpen(false)}
          triggerNotification={triggerNotification}
          hideTrigger={true}
        />
      )}

      <div className="flex-1 w-full flex flex-col relative">
        {showSplash ? (
          <SplashView 
            isLoggedOut={isLoggedOut}
            onGoToDashboard={() => {
              const saved = localStorage.getItem('nexus_core_user_profile');
              const profileSaved = saved !== null && saved !== 'null';
              if (profileSaved) {
                setIsLoggedOut(false);
              } else {
                setIsLoggedOut(true);
              }
              setShowSplash(false);
            }} 
            onCreateAccount={() => {
              setLoginInitialTab('signup');
              setIsLoggedOut(true);
              setShowSplash(false);
            }}
          />
        ) : isLoggedOut ? (
          <LoginView 
            initialTab={loginInitialTab} 
            triggerNotification={triggerNotification}
            isUpgradeMode={isUpgradeMode}
            userProfile={userProfile || undefined}
            onBackToSplash={() => setShowSplash(true)}
            onLogin={(customProfile, customBand, selectBandId) => {
              setIsUpgradeMode(false);
              setIsTime24Hour(localStorage.getItem('tour_time_is_24h') !== 'false');
              const savedPlan = localStorage.getItem('nexus_core_active_plan');
              if (savedPlan) {
                setActivePlan(savedPlan);
              }
              if (customProfile) {
                const workspaces = customProfile.allowed_workspaces || [];
                const isFanAccount = customProfile.account_type === 'fan' || customProfile.account_type === 'fan_only';
                const isProfessional = !isFanAccount && (workspaces.includes('creative') || workspaces.includes('band') || workspaces.includes('promoter') || workspaces.includes('label') || customProfile.account_type === 'pro' || customProfile.account_type === 'industry_pro' || customProfile.role === 'Industry Pro');
                
                const hasUnlockedBandWorkspace = Boolean(
                  customBand ||
                  selectBandId ||
                  customProfile.account_type === 'band' ||
                  customProfile.band_id ||
                  customProfile.bandName ||
                  customProfile.band_name ||
                  hasRegisteredWorkspace(customProfile, 'band')
                );

                // On login, ensure active_workspace defaults to 'industry_pro' (or 'fan_only')
                if (isFanAccount) {
                  customProfile.account_type = 'fan';
                  customProfile.active_workspace = 'fan_only';
                } else {
                  customProfile.account_type = 'industry_pro';
                  customProfile.active_workspace = 'industry_pro';
                }

                if (hasUnlockedBandWorkspace) {
                  if (customBand) {
                    customProfile.band_id = customBand.id;
                    customProfile.band_name = customBand.name || customBand.band_name || customProfile.band_name;
                    customProfile.bandName = customBand.name || customBand.band_name || customProfile.bandName;
                  }
                  if (!hasRegisteredWorkspace(customProfile, 'band')) {
                    customProfile.registered_workspaces = normalizeRegisteredWorkspaces(customProfile.registered_workspaces, [{
                      type: 'band',
                      id: customProfile.band_id || selectBandId || customBand?.id || generateUUID(),
                      name: customProfile.band_name || customProfile.bandName || customBand?.name || 'Band Workspace'
                    }]);
                  }
                }

                // Preserve personal profile avatar & banner (DO NOT overwrite with band logo)
                if (customBand && customBand.name) {
                  customProfile.bandName = customBand.name;
                  customProfile.band_name = customBand.name;
                }

                setUserProfile(customProfile);
                try {
                  localStorage.setItem('nexus_core_user_profile', JSON.stringify(customProfile));
                } catch (_) {}
                triggerNotification(`👤 Profile Loaded: Welcome ${customProfile.name || customProfile.full_name}!`);
              }
              if (customBand) {
                if (customBand.lineup) {
                  try {
                    localStorage.setItem(
                      `nexus_core_band_lineup_${customBand.id}`,
                      typeof customBand.lineup === 'string' ? customBand.lineup : JSON.stringify(customBand.lineup)
                    );
                  } catch (_) {}
                }
                setBands(prev => {
                  const exists = (prev || []).some(b => b.id === customBand.id);
                  if (exists) return (prev || []).map(b => b.id === customBand.id ? customBand : b);
                  return [customBand, ...(prev || [])];
                });
                try {
                  const existingBandsStr = localStorage.getItem('nexus_bands_list');
                  const existingBands = existingBandsStr ? JSON.parse(existingBandsStr) : [];
                  const updatedBands = [customBand, ...existingBands.filter((b: any) => b.id !== customBand.id)];
                  localStorage.setItem('nexus_bands_list', JSON.stringify(updatedBands));
                } catch (_) {}
                triggerNotification(`🎸 Artist Workspace Available: ${customBand.name}!`);
              }
              const targetBandId = selectBandId || customBand?.id || customProfile?.band_id;
              if (targetBandId) {
                setActiveBandId(targetBandId);
                try {
                  localStorage.setItem('nexus_active_band_id', targetBandId);
                } catch (_) {}
              }

              // Fresh logins ALWAYS land on the Industry Pro dashboard
              setActiveTab('social');

              setIsLoggedOut(false);
              triggerNotification('🔓 Session unlocked successfully!');
              addLog(customProfile ? `New crew profile signed up: ${customProfile.name} (${customProfile.role}) for ${customBand?.name || 'Artist'}` : 'Session restored by authorized administrator.');
            }} 
          />
        ) : (!showSplash && !isLoggedOut && (activeTab as string) === 'social') ? (
          <UniversalSocialFeed 
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            portalRole={
              (userProfile?.account_type === 'fan' || userProfile?.account_type === 'fan_only' || userProfile?.active_workspace === 'fan_only') ? 'fan_only' :
              userProfile?.active_workspace === 'creative' ? 'creative' :
              userProfile?.active_workspace === 'label' ? 'label' :
              userProfile?.active_workspace === 'promoter' ? 'promoter' :
              userProfile?.active_workspace === 'band' ? 'band' :
              'industry_pro'
            }
            bandJoinRequests={bandJoinRequests}
            setBandJoinRequests={setBandJoinRequests}
            bands={bands}
            setBands={setBands}
            activeBand={activeBand}
            activeBandId={activeBandId}
            onLogout={() => {
              localStorage.removeItem('nexus_core_user_profile'); setUserProfile(null); window.location.reload();
              triggerNotification?.("Session closed. Goodbye.");
            }}
            onBack={() => {
              const target = userProfile?.active_workspace;
              if (target === 'creative') setActiveTab('creative');
              else if (target === 'label') setActiveTab('label');
              else if (target === 'promoter') setActiveTab('promoter');
              else setActiveTab('home-v2');
            }}
            onNavigateToTab={(tab: string, subNav?: string) => {
              if (subNav) {
                setDashboardV2ActiveNav(subNav as any);
              }
              setActiveTab(tab as any);
            }}
            setActiveTab={setActiveTab}
            setDashboardV2ActiveNav={setDashboardV2ActiveNav}
            dashboardV2ActiveNav={dashboardV2ActiveNav}
            onUpgradeToPro={() => {
              setShowWorkspaceRegistration(true);
            }}
            triggerNotification={triggerNotification}
            addLog={addLog}
            onUpdateBandLogo={(newUrl) => {
              if (activeBand) {
                const updatedBand = { ...activeBand, logo_url: newUrl };
                setBands((prevBands) =>
                  prevBands.map((b) => (b.id === activeBand.id ? updatedBand : b))
                );
              }
            }}
          />
        ) : (!showSplash && !isLoggedOut && (userProfile?.account_type === 'creative' || userProfile?.active_workspace === 'creative' || (activeTab as string) === 'creative')) ? (
          <div className="flex-grow overflow-y-auto">
              <CreativeDashboardViewV2
                onUpgradeToPro={() => setShowWorkspaceRegistration(true)}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                notifications={notifications}
                onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                setActiveTab={setActiveTab as any}
                onLogout={() => {
                  localStorage.removeItem('nexus_core_user_profile'); setUserProfile(null); window.location.reload();
                  triggerNotification?.("Creative console disconnected.");
                }}
                onBack={() => {
                  if (userProfile && (userProfile.band_id || hasRegisteredWorkspace(userProfile, 'band'))) {
                    const updated = { ...userProfile, account_type: 'industry_pro', active_workspace: 'band' };
                    setUserProfile(updated);
                    try { localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated)); } catch (_) {}
                    setActiveTab('home-v2');
                    triggerNotification?.("Switched to Band Workspace.");
                  } else {
                    const updated = { ...userProfile, account_type: 'industry_pro', active_workspace: 'industry_pro' };
                    setUserProfile(updated);
                    try { localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated)); } catch (_) {}
                    setActiveTab('social');
                    triggerNotification?.("Switched to Industry Pro.");
                  }
                }}
                triggerNotification={triggerNotification}
                addLog={addLog}
              />
          </div>
        ) : (!showSplash && !isLoggedOut && (userProfile?.account_type === 'label' || userProfile?.active_workspace === 'label' || (activeTab as string) === 'label')) ? (
            <LabelDashboardViewV2
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              notifications={notifications}
              onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
              triggerNotification={triggerNotification}
              setActiveTab={setActiveTab as any}
              onLogout={() => {
                localStorage.removeItem('nexus_core_user_profile'); setUserProfile(null); window.location.reload();
                triggerNotification('Session closed. Goodbye.');
              }}
            />
        ) : (!showSplash && !isLoggedOut && FLAGS.ENABLE_PROMOTER_PORTAL && (userProfile?.account_type === 'promoter' || userProfile?.active_workspace === 'promoter' || (activeTab as string) === 'promoter')) ? (
            <div className="flex-grow overflow-y-auto">
              <PromoterDashboardViewV2
                onUpgradeToPro={() => setShowWorkspaceRegistration(true)}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                onLogout={() => {
                  localStorage.removeItem('nexus_core_user_profile'); setUserProfile(null); window.location.reload();
                  triggerNotification?.("Promoter console disconnected.");
                }}
                onBack={() => {
                  localStorage.removeItem('nexus_core_user_profile'); setUserProfile(null); window.location.reload();
                  triggerNotification?.("Session closed. Goodbye.");
                }}
                notifications={notifications}
                onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                triggerNotification={triggerNotification}
                setActiveTab={setActiveTab as any}
                addLog={addLog}
                bands={bands}
                offers={offers}
                onCreateOffer={handleCreateOffer}
                onUpdateOffer={handleUpdateOffer}
                shows={shows}
                onMarkAsRead={handleMarkNotificationAsRead}
                activeBand={activeBand}
                activeBandId={activeBandId}
                setActiveBandId={setActiveBandId}
                isOfflineSimActive={isOfflineSimActive}
                setIsOfflineSimActive={setIsOfflineSimActive}
                isOnline={isOnline}
              />
            </div>
        ) : (
          <>
            {/* TOP STATUS BAR ACCENTS REMOVED */}


        {/* BRAND NAVIGATION HEADER */}
        <NexusTopBar
          activeTab={activeTab} setActiveTab={setActiveTab as any} setDashboardV2ActiveNav={setDashboardV2ActiveNav} triggerNotification={triggerNotification}
          pendingSyncCount={pendingSyncCount} processOfflineQueue={processOfflineQueue} isRosterOwner={isRosterOwner} activePlan={activePlan}
          getTrialCountdownStr={getTrialCountdownStr} activeClearanceLevel={activeClearanceLevel} activeSimulatedMember={activeSimulatedMember}
          userProfile={userProfile} notifications={notifications} setIsNotificationDrawerOpen={setIsNotificationDrawerOpen}
          v2RoleMenuOpen={v2RoleMenuOpen} setV2RoleMenuOpen={setV2RoleMenuOpen} activeBand={activeBand} bands={bands}
          simulatedMemberId={simulatedMemberId} setSimulatedMemberId={setSimulatedMemberId} bandLineup={bandLineup} crewMembers={crewMembers}
          handleOpenMyProfile={handleOpenMyProfile} setUserProfile={setUserProfile} isOfflineSimActive={isOfflineSimActive}
          setIsOfflineSimActive={setIsOfflineSimActive} isOnline={isOnline}
          onUpgradeToPro={() => setShowWorkspaceRegistration(true)}
          onOpenSettingsDrawer={() => setIsSettingsDrawerOpen(true)}
        />

        {isTabRestricted(activeTab, activeClearanceLevel) ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[70vh] bg-[#030303] text-zinc-300">
            <div className="max-w-md w-full bg-[#09090b] border border-zinc-800 p-8 rounded-2xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/10 via-red-500/10 to-amber-500/10 rounded-2xl blur opacity-65" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-rose-950/20 border border-rose-500/30 flex items-center justify-center mb-5 text-rose-500">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                  Access Restricted
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-2">
                  SECURE PORTAL INTERCEPTED • LEVEL {activeClearanceLevel}
                </p>
                <div className="bg-black/40 border border-zinc-900 rounded-xl p-4 my-6 text-left w-full space-y-2 text-xs">
                  <p className="text-zinc-400 font-sans leading-relaxed">
                    The requested portal <span className="font-mono text-rose-400 font-bold uppercase">{activeTab}</span> is restricted for your active simulated user.
                  </p>
                  <p className="text-zinc-500 font-sans leading-relaxed text-[11px]">
                    To view this tab, you require a higher security clearance level than your current <span className="font-mono text-zinc-300 font-semibold">Level {activeClearanceLevel}</span>.
                  </p>
                </div>
                
                <div className="w-full space-y-3 text-left">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block mb-1 tracking-wider font-bold">Temporarily elevate simulated identity</span>
                  <select
                    value={simulatedMemberId}
                    onChange={(e) => {
                      const targetId = e.target.value;
                      setSimulatedMemberId(targetId);
                      const combined = [
                        ...(Array.isArray(bandLineup) ? bandLineup : []),
                        ...(Array.isArray(crewMembers) ? crewMembers : [])
                      ];
                      const foundName = combined.find((m: any) => m.id === targetId)?.name || 'Member';
                      triggerNotification?.(`⚡ Simulating ${foundName}`);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#00ffcc]/50 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer"
                  >
                    {[
                      ...(Array.isArray(bandLineup) ? bandLineup : []).map((m: any) => ({ ...m, type: 'Lineup', lvl: m.clearanceLevel || 5 })),
                      ...(Array.isArray(crewMembers) ? crewMembers : []).map((c: any) => ({ ...c, type: 'Crew', lvl: c.clearanceLevel || 1 }))
                    ].map((member: any, idx: number) => {
                      const optKey = `${member.type}-${member.id || 'noid'}-${idx}`;
                      const optVal = member.id || `${member.type}-${idx}`;
                      return (
                        <option key={optKey} value={optVal}>
                          [{member.type}] {member?.name || 'Unnamed'} ({member.role || 'Crew'}) - Lvl {member.lvl}
                        </option>
                      );
                    })}
                  </select>
                  
                  <button
                    onClick={() => {
                      setSimulatedMemberId('');
                      triggerNotification?.("⚡ Returned to normal view");
                    }}
                    className="w-full bg-red-950/40 text-red-400 border border-red-900 hover:bg-red-900/60 rounded-lg py-2 text-xs font-mono transition-all"
                  >
                    Clear Simulation
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'home' || activeTab === 'home-v2' ? (
          !isBandRegistered ? (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[70vh] bg-[#030303] text-zinc-300 font-mono">
              <div className="max-w-md w-full bg-[#09090b] border border-emerald-500/30 p-8 rounded-2xl shadow-[0_10px_50px_-12px_rgba(16,185,129,0.2)] relative overflow-hidden group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-2xl blur opacity-65" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-center mb-5 text-emerald-400 shadow-lg shadow-emerald-950/50">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                    Band Workspace Locked
                  </h3>
                  <p className="text-xs text-emerald-400/80 font-mono mt-1">
                    REGISTRATION REQUIRED
                  </p>
                  <div className="bg-black/50 border border-zinc-800 rounded-xl p-4 my-6 text-left w-full space-y-2 text-xs">
                    <p className="text-zinc-300 font-sans leading-relaxed">
                      You have not registered a Band Workspace on your profile yet.
                    </p>
                    <p className="text-zinc-500 font-sans leading-relaxed text-[11px]">
                      Registering your band unlocks tour logistics, merch inventory management, flight & hotel manifests, setlist builders, and financial tracking.
                    </p>
                  </div>
                  
                  <div className="w-full space-y-3 text-left">
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('nexus_target_register_workspace', 'band');
                        }
                        setShowWorkspaceRegistration(true);
                      }}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Register Band Workspace Now</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('social');
                        const updated = { ...userProfile, active_workspace: 'industry_pro', account_type: 'industry_pro' };
                        setUserProfile(updated);
                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                        window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                      }}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs rounded-xl transition-all border border-zinc-800 cursor-pointer"
                    >
                      Return to Industry Pro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'home' ? (
            <HomeDashboardView dashboardRef={dashboardRef} dashboardScrollPos={dashboardScrollPos} setActiveTab={setActiveTab} triggerNotification={triggerNotification} addLog={addLog} musicTrackCount={musicTrackCount} isRosterOwner={isRosterOwner} setDistroDeckSubTab={setDistroDeckSubTab} userProfile={userProfile} activeBand={activeBand} isSyncBadgeExpanded={isSyncBadgeExpanded} setIsOfflineSimActive={setIsOfflineSimActive} isOfflineSimActive={isOfflineSimActive} isOnline={isOnline} setIsSyncBadgeExpanded={setIsSyncBadgeExpanded} status={status} setIsMetricCarouselPaused={setIsMetricCarouselPaused} setCurrentMetricIndex={setCurrentMetricIndex} metrics={metrics} currentMetricIndex={currentMetricIndex} setIsHoveringTourStatus={setIsHoveringTourStatus} registerTourStatusInteraction={registerTourStatusInteraction} handleStatusTouchStart={handleStatusTouchStart} handleStatusTouchMove={handleStatusTouchMove} handleStatusTouchEnd={handleStatusTouchEnd} hasSettleReminder={hasSettleReminder} firstShowToSettle={firstShowToSettle} setAutoExpandShowId={setAutoExpandShowId} shows={shows} setTourStatusIndex={setTourStatusIndex} tourStatusIndex={tourStatusIndex} activeShowDisplay={activeShowDisplay} currentOrNextShow={currentOrNextShow} countdownString={countdownString} inventory={inventory} isCritical={isCritical} totalTableStock={totalTableStock} totalVanStock={totalVanStock} notes={notes} filteredNotes={filteredNotes} isNoteExpanded={isNoteExpanded} setIsNoteExpanded={setIsNoteExpanded} inlineNoteEditingId={inlineNoteEditingId} setInlineNoteEditingId={setInlineNoteEditingId} inlineNoteText={inlineNoteText} setInlineNoteText={setInlineNoteText} inlineNoteCategory={inlineNoteCategory} setInlineNoteCategory={setInlineNoteCategory} inlineNoteTag={inlineNoteTag} setInlineNoteTag={setInlineNoteTag} activeNoteIndex={activeNoteIndex} setActiveNoteIndex={setActiveNoteIndex} isTourNotesCardCollapsed={isTourNotesCardCollapsed} setIsTourNotesCardCollapsed={setIsTourNotesCardCollapsed} handleNoteTouchStart={handleNoteTouchStart} handleNoteTouchMove={handleNoteTouchMove} handleNoteTouchEnd={handleNoteTouchEnd} handleDeleteNote={handleDeleteNote} handleUpdateNote={handleUpdateNote} handleDataSubmit={handleDataSubmit} showSpecificNotes={showSpecificNotes} localWeather={localWeather} weatherLoading={weatherLoading} weatherError={weatherError} currentCoords={currentCoords} customNavDestination={customNavDestination} setCustomNavDestination={setCustomNavDestination} venues={venues} fetchLocalWeather={fetchLocalWeather} setIsWeatherForecastExpanded={setIsWeatherForecastExpanded} isWeatherForecastExpanded={isWeatherForecastExpanded} isEditingBusCall={isEditingBusCall} isTime24Hour={isTime24Hour} setIsTime24Hour={setIsTime24Hour} tempBusCallTime={tempBusCallTime} setTempBusCallTime={setTempBusCallTime} tempLockupTime={tempLockupTime} setTempLockupTime={setTempLockupTime} setIsEditingBusCall={setIsEditingBusCall} setBusCallTime={setBusCallTime} setLockupTime={setLockupTime} renderTime={renderTime} busCallTime={busCallTime} lockupTime={lockupTime} checklistItems={checklistItems} toggleChecklistItem={toggleChecklistItem} flights={flights} tableStockPercent={tableStockPercent} handleRestock={handleRestock} handleNewSaleClick={handleNewSaleClick} handleNewSalePointerDown={handleNewSalePointerDown} handleNewSalePointerUp={handleNewSalePointerUp} setIsGlobalHoverPaused={setIsGlobalHoverPaused} setDashboardCarouselIndex={setDashboardCarouselIndex} dashboardCarouselIndex={dashboardCarouselIndex} getNextShow={getNextShow} getSetlistDetailsForShow={getSetlistDetailsForShow} selectedGuestlistShowId={selectedGuestlistShowId} setSelectedGuestlistShowId={setSelectedGuestlistShowId} sales={sales} setModalType={setModalType} setIsModalOpen={setIsModalOpen} sortedShows={sortedShows} setPromoCardActiveSlot={setPromoCardActiveSlot} promoCardActiveSlot={promoCardActiveSlot} setIsNotificationDrawerOpen={setIsNotificationDrawerOpen} setDashboardV2ActiveNav={setDashboardV2ActiveNav} alliancePosts={alliancePosts} previewReactionMenuOpenFor={previewReactionMenuOpenFor} setPreviewReactionMenuOpenFor={setPreviewReactionMenuOpenFor} handleAlliancePostReaction={handleAlliancePostReaction} setAlliancePosts={setAlliancePosts} previewFollowedActs={previewFollowedActs} setPreviewFollowedActs={setPreviewFollowedActs} filteredInventory={filteredInventory} setPromoHubSelectedItemId={setPromoHubSelectedItemId} setPromoHubSubTab={setPromoHubSubTab} loyaltyMembers={loyaltyMembers} reviewLeft={reviewLeft} userReviews={userReviews} setReviewLeft={setReviewLeft} setReviewText={setReviewText} setReviewScore={setReviewScore} reviewScore={reviewScore} reviewText={reviewText} reviewerName={reviewerName} setReviewerName={setReviewerName} reviewerGroup={reviewerGroup} setReviewerGroup={setReviewerGroup} setUserReviews={setUserReviews}  renderRecentSalesFeed={() => null} />
          ) : (
            <HomeV2DashboardView setIsGlobalHoverPaused={setIsGlobalHoverPaused} dashboardV2ActiveNav={dashboardV2ActiveNav} setActiveTab={setActiveTab} setDashboardV2ActiveNav={setDashboardV2ActiveNav} setIsV2StoryCreatorExpanded={setIsV2StoryCreatorExpanded} isV2StoryCreatorExpanded={isV2StoryCreatorExpanded} inventory={inventory} filteredInventory={filteredInventory} triggerNotification={triggerNotification} addLog={addLog} activeBand={activeBand} stagedDistroItems={stagedDistroItems} setStagedDistroItems={setStagedDistroItems} activeTab={activeTab} userProfile={userProfile} setUserProfile={setUserProfile} bands={bands} setBands={setBands} bandJoinRequests={bandJoinRequests} setBandJoinRequests={setBandJoinRequests} isSubNavRestricted={isSubNavRestricted} activeClearanceLevel={activeClearanceLevel} simulatedMemberId={simulatedMemberId} setSimulatedMemberId={setSimulatedMemberId} bandLineup={bandLineup} crewMembers={crewMembers} activeDriver={activeDriver} activeEventsSection={activeEventsSection} activeShowDisplay={activeShowDisplay} busCallTime={busCallTime} checkedPreDriveItems={checkedPreDriveItems} checklistBank={checklistBank} checklistItems={checklistItems} commitFlightMutation={commitFlightMutation} countdownString={countdownString} currentCoords={currentCoords} currentOrNextShow={currentOrNextShow} customMpg={customMpg} customNavDestination={customNavDestination} driveHoursElapsed={driveHoursElapsed} fetchLocalWeather={fetchLocalWeather} filteredNotes={filteredNotes} isNoteExpanded={isNoteExpanded} setIsNoteExpanded={setIsNoteExpanded} inlineNoteEditingId={inlineNoteEditingId} setInlineNoteEditingId={setInlineNoteEditingId} inlineNoteText={inlineNoteText} setInlineNoteText={setInlineNoteText} inlineNoteCategory={inlineNoteCategory} setInlineNoteCategory={setInlineNoteCategory} inlineNoteTag={inlineNoteTag} setInlineNoteTag={setInlineNoteTag} activeNoteIndex={activeNoteIndex} setActiveNoteIndex={setActiveNoteIndex} isTourNotesCardCollapsed={isTourNotesCardCollapsed} setIsTourNotesCardCollapsed={setIsTourNotesCardCollapsed} handleNoteTouchStart={handleNoteTouchStart} handleNoteTouchMove={handleNoteTouchMove} handleNoteTouchEnd={handleNoteTouchEnd} filteredSales={filteredSales} filteredShows={filteredShows} flights={flights} fuelPrice={fuelPrice} handleDeleteNote={handleDeleteNote} handleUpdateNote={handleUpdateNote} handleUpdateOffer={handleUpdateOffer} isCritical={isCritical} isDriverRotationExpanded={isDriverRotationExpanded} isEditingBusCall={isEditingBusCall} isFuelCalculatorExpanded={isFuelCalculatorExpanded} isInteractiveMapExpanded={isInteractiveMapExpanded} isOfflineSimActive={isOfflineSimActive} isOnline={isOnline} isPreDriveChecklistExpanded={isPreDriveChecklistExpanded} isTime24Hour={isTime24Hour} isWaypointsExpanded={isWaypointsExpanded} localWeather={localWeather} lockupTime={lockupTime} newWaypointName={newWaypointName} newWaypointType={newWaypointType} offers={offers} onRouteVenueAddress={onRouteVenueAddress} renderTime={renderTime} selectedGuestlistShowId={selectedGuestlistShowId} setActiveDriver={setActiveDriver} setActiveEventsSection={setActiveEventsSection} setAutoExpandShowId={setAutoExpandShowId} setBusCallTime={setBusCallTime} setCheckedPreDriveItems={setCheckedPreDriveItems} setChecklistBank={setChecklistBank} setChecklistItems={setChecklistItems} setCustomMpg={setCustomMpg} setCustomNavDestination={setCustomNavDestination} setDriveHoursElapsed={setDriveHoursElapsed} setFlights={setFlights} setFuelPrice={setFuelPrice} setIsDriverRotationExpanded={setIsDriverRotationExpanded} setIsEditingBusCall={setIsEditingBusCall} setIsFuelCalculatorExpanded={setIsFuelCalculatorExpanded} setIsInteractiveMapExpanded={setIsInteractiveMapExpanded} setIsModalOpen={setIsModalOpen} setIsOfflineSimActive={setIsOfflineSimActive} setIsPreDriveChecklistExpanded={setIsPreDriveChecklistExpanded} setIsTime24Hour={setIsTime24Hour} setIsWaypointsExpanded={setIsWaypointsExpanded} setLockupTime={setLockupTime} setModalType={setModalType} setNewWaypointName={setNewWaypointName} setNewWaypointType={setNewWaypointType} setSelectedGuestlistShowId={setSelectedGuestlistShowId} setShows={setShows} setTempBusCallTime={setTempBusCallTime} setTempLockupTime={setTempLockupTime} setVehicleType={setVehicleType} setVenues={setVenues} setWaypoints={setWaypoints} showSpecificNotes={showSpecificNotes} shows={shows} sortedShows={sortedShows} tempBusCallTime={tempBusCallTime} tempLockupTime={tempLockupTime} totalTableStock={totalTableStock} totalVanStock={totalVanStock} userReviews={userReviews} vehicleType={vehicleType} venues={venues} waypoints={waypoints} weatherError={weatherError} weatherLoading={weatherLoading} bandCoverUrl={bandCoverUrl} handleDataSubmit={handleDataSubmit} loyaltyMembers={loyaltyMembers} setInventory={setInventory} setLoyaltyMembers={setLoyaltyMembers} inventoryAudits={inventoryAudits} setInventoryAudits={setInventoryAudits} activeBandId={activeBandId} setTransferPreselectedId={setTransferPreselectedId} setIsTransferModalOpen={setIsTransferModalOpen} setEditingItem={setEditingItem} expenses={expenses} sales={sales} setExpenses={setExpenses} setEditingBand={setEditingBand} setIsBandModalOpen={setIsBandModalOpen} bandInfoBio={bandInfoBio} setBandInfoBio={setBandInfoBio} bandInfoCustomSlug={bandInfoCustomSlug} setBandInfoCustomSlug={setBandInfoCustomSlug} bandInfoBookingEmail={bandInfoBookingEmail} setBandInfoBookingEmail={setBandInfoBookingEmail} bandInfoBookingPhone={bandInfoBookingPhone} setBandInfoBookingPhone={setBandInfoBookingPhone} bandInfoYoutubeVideo={bandInfoYoutubeVideo} setBandInfoYoutubeVideo={setBandInfoYoutubeVideo} bandInfoStreamingUrl={bandInfoStreamingUrl} setBandInfoStreamingUrl={setBandInfoStreamingUrl} bandInfoTechRider={bandInfoTechRider} setBandInfoTechRider={setBandInfoTechRider} bandInfoTourVehicle={bandInfoTourVehicle} setBandInfoTourVehicle={setBandInfoTourVehicle} bandInfoMetalArchivesUrl={bandInfoMetalArchivesUrl} setBandInfoMetalArchivesUrl={setBandInfoMetalArchivesUrl} bandLogoUrl={bandLogoUrl} setLogoUploaderDragActive={setLogoUploaderDragActive} handleBandInfoLogoUpload={handleBandInfoLogoUpload} logoUploaderDragActive={logoUploaderDragActive} bandInfoLogoFileInputRef={bandInfoLogoFileInputRef} setCoverUploaderDragActive={setCoverUploaderDragActive} handleBandInfoCoverUpload={handleBandInfoCoverUpload} coverUploaderDragActive={coverUploaderDragActive} bandInfoCoverFileInputRef={bandInfoCoverFileInputRef} bandInfoName={bandInfoName} setBandInfoName={setBandInfoName} selectedMicroGenres={selectedMicroGenres} setSelectedMicroGenres={setSelectedMicroGenres} bandInfoHomebase={bandInfoHomebase} setBandInfoHomebase={setBandInfoHomebase} bandInfoFoundedYear={bandInfoFoundedYear} setBandInfoFoundedYear={setBandInfoFoundedYear} setBandLineup={setBandLineup} setCrewMembers={setCrewMembers} setReviewLeft={setReviewLeft} setReviewText={setReviewText} reviewScore={reviewScore} setReviewScore={setReviewScore} reviewText={reviewText} reviewerName={reviewerName} setReviewerName={setReviewerName} reviewerGroup={reviewerGroup} setReviewerGroup={setReviewerGroup} setSales={setSales} logs={logs} handleRestock={handleRestock} dbStatus={dbStatus} />
          )
        ) : (
          <MainTabRouter
            activeTab={activeTab}
            setActiveTab={setActiveTab as any}
            triggerNotification={triggerNotification}
            addLog={addLog}
            dashboardRef={dashboardRef}
            dashboardScrollPos={dashboardScrollPos}
            filteredInventory={filteredInventory}
            inventory={inventory}
            setInventory={setInventory}
            inventoryAudits={inventoryAudits}
            setInventoryAudits={setInventoryAudits}
            setEditingItem={setEditingItem}
            editingItem={editingItem}
            activeBandId={activeBandId}
            setTransferPreselectedId={setTransferPreselectedId}
            setIsTransferModalOpen={setIsTransferModalOpen}
            setDistroDeckSubTab={setDistroDeckSubTab}
            stagedDistroItems={stagedDistroItems}
            setStagedDistroItems={setStagedDistroItems}
            activeClearanceLevel={activeClearanceLevel}
            shows={shows}
            setShows={setShows}
            filteredShows={filteredShows}
            filteredSales={filteredSales}
            sales={sales}
            setSales={setSales}
            commitInventoryMutation={commitInventoryMutation}
            handleDataSubmit={handleDataSubmit}
            activeBand={activeBand}
            setIsCashDrawerOpen={setIsCashDrawerOpen}
            setAutoOpenSettlementShowId={setAutoOpenSettlementShowId}
            loyaltyMembers={loyaltyMembers}
            setLoyaltyMembers={setLoyaltyMembers}
            isOfflineSimActive={isOfflineSimActive}
            isOnline={isOnline}
            processingGlobalSyncQueue={processingGlobalSyncQueue}
            getSupabase={getSupabase}
            inventoryStore={inventoryStore}
            setModalType={setModalType as any}
            setIsModalOpen={setIsModalOpen}
            pendingOpenShowsForm={pendingOpenShowsForm}
            setPendingOpenShowsForm={setPendingOpenShowsForm}
            autoExpandShowId={autoExpandShowId}
            setAutoExpandShowId={setAutoExpandShowId}
            autoOpenSettlementShowId={autoOpenSettlementShowId}
            setOnRouteVenueAddress={setOnRouteVenueAddress}
            offers={offers}
            blockedPromoters={blockedPromoters}
            handleAcceptOffer={handleAcceptOffer}
            handleDeclineOffer={handleDeclineOffer}
            handleRenegotiateOffer={handleRenegotiateOffer}
            handleBlockPromoter={handleBlockPromoter}
            handleUpdateOffer={handleUpdateOffer}
            filteredNotes={filteredNotes}
            handleDeleteNote={handleDeleteNote}
            handleUpdateNote={handleUpdateNote}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            venues={venues}
            setVenues={setVenues}
            setSettingsExpandedSection={setSettingsExpandedSection}
            logs={logs}
            handleRestock={handleRestock}
            dbStatus={dbStatus}
            supabaseUrl={supabaseUrl}
            supabaseKey={supabaseKey}
            bands={bands}
            setBands={setBands}
            setActiveBandId={setActiveBandId}
            setIsBandModalOpen={setIsBandModalOpen}
            settingsExpandedSection={settingsExpandedSection}
            selectedGuestlistShowId={selectedGuestlistShowId}
            expenses={expenses}
            setExpenses={setExpenses}
            promoHubSubTab={promoHubSubTab}
            promoHubSelectedItemId={promoHubSelectedItemId}
            userReviews={userReviews}
            setUserReviews={setUserReviews}
            activePlan={activePlan}
            setActivePlan={setActivePlan}
            flights={flights}
            setFlights={setFlights}
            commitFlightMutation={commitFlightMutation}
            pendingFlightIsAdding={pendingFlightIsAdding}
            setPendingFlightIsAdding={setPendingFlightIsAdding}
            checklistItems={checklistItems}
            setChecklistItems={setChecklistItems}
            checklistBank={checklistBank}
            setChecklistBank={setChecklistBank}
            onRouteVenueAddress={onRouteVenueAddress}
            distroDeckSubTab={distroDeckSubTab}
          />
        )}
      </>
    )}
  </div>
        {/* Offline Queue Reconciler bottom status bar banner */}
        {(!offlineSyncIsOnline || isOfflineSimActive || offlineQueueLength > 0 || offlineIsSyncing) && (
          <div id="offline-queue-indicator" className={`fixed ${(!isLoggedOut && !showSplash && (!userProfile?.account_type || userProfile?.account_type === 'band') && activeTab !== 'social') ? 'bottom-[72px]' : 'bottom-0'} w-full sm:max-w-[620px] bg-black/90 border-t border-b border-zinc-900 px-4 py-1.5 flex items-center justify-between z-45 font-mono text-[8.5px] uppercase tracking-wider text-[#00ffcc] select-none shadow-[0_-5px_15px_rgba(0,0,0,0.4)]`}>
            <div className="flex items-center gap-1.5 font-bold">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${offlineIsSyncing ? 'bg-[#00ffcc] animate-ping' : 'bg-amber-400 animate-pulse'}`} />
              <span>
                {offlineIsSyncing 
                  ? '// SYNCING OFFLINE LEDGER...' 
                  : `// OFFLINE QUEUE: [${offlineQueueLength}] PENDING INJECTS`
                }
              </span>
            </div>
            <div className="text-zinc-500 text-[8px] font-medium tracking-normal text-right font-mono">
              [SUPABASE RESILIENCE ACTIVE]
            </div>
          </div>
        )}

        {/* Rectangular Navigation Bar (Push-to-talk, Quick Actions) - Band Workspace Only (not on Social Feed or Industry Pro) */}
        {!isLoggedOut && !showSplash && isBandRegistered && (activeTab === 'home' || activeTab === 'home-v2') && (
          <AppNavigationBar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setDashboardV2ActiveNav={setDashboardV2ActiveNav}
            promoHubSubTab={promoHubSubTab}
            setPromoHubSubTab={setPromoHubSubTab}
            triggerNotification={triggerNotification}
            addLog={addLog}
            setIsQuickActionPanelOpen={setIsQuickActionPanelOpen}
            isPttOpen={isPttOpen}
            setIsPttOpen={setIsPttOpen}
            isPttRecording={isPttRecording}
            playPttSound={playPttSound}
            isNavMenuOpen={isNavMenuOpen}
            setIsNavMenuOpen={setIsNavMenuOpen}
            activeBand={activeBand}
            bandLogoUrl={bandLogoUrl}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            handleOpenMyProfile={handleOpenMyProfile}
            setLoginInitialTab={setLoginInitialTab}
            setIsLoggedOut={setIsLoggedOut}
            setShowSplash={setShowSplash}
          />
        )}


      {/* GLOBAL MODALS & DRAWERS REGISTRY */}
      <GlobalModalsContainer
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        activeTab={activeTab as string}
        setActiveTab={setActiveTab as any}
        shows={shows}
        inventory={inventory}
        setInventory={setInventory}
        handleDataSubmit={handleDataSubmit}
        triggerNotification={triggerNotification}
        bandManagement={bandManagement}
        bands={bands}
        activeBand={activeBand}
        activeBandId={activeBandId}
        setActiveBandId={setActiveBandId}
        addLog={addLog}
        deletingBandId={deletingBandId}
        setDeletingBandId={setDeletingBandId}
        handleDeleteBand={handleDeleteBand}
        cashTransactions={cashTransactions}
        setCashTransactions={setCashTransactions}
        checklistItems={checklistItems}
        setChecklistItems={setChecklistItems}
        checklistBank={checklistBank}
        setChecklistBank={setChecklistBank}
        setEditingItem={setEditingItem}
        setPendingOpenShowsForm={setPendingOpenShowsForm}
        setPendingFlightIsAdding={setPendingFlightIsAdding}
        playPttSound={playPttSound}
        commitInventoryMutation={commitInventoryMutation}
        teamActivities={teamActivities}
        setIsUpgradeMode={setIsUpgradeMode}
        setLoginInitialTab={setLoginInitialTab}
        setIsLoggedOut={setIsLoggedOut}
      />

      {/* Real-time overlay portals */}
      <FloatingChatHead />
      <AvatarPopupOverlay />
    </div>
  );
}

