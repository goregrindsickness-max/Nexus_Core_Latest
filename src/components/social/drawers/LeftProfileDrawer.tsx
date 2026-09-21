import { MASTER_GENRES } from "../../../constants/genres";
import { US_STATES, COUNTRIES } from "../../../constants/location";
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Barcode from 'react-barcode';
import { InteractiveCropperModal } from "../../InteractiveCropperModal";
import { uploadBase64ToStorage, resolveZipCode, autoArchiveProfileAssets, getSupabase, extractGlobalProfilePayload, executeSanitizedProfileUpsert, sanitizeBandPayload, executeWithSchemaResilience } from "../../../supabase";
import { getRoleBorderAndGlowClass } from "../utils/socialUtils";
import {
  resolveBandLogo,
  resolveBandCover,
  resolveBandHandle,
  resolveBandName,
  resolveBandBio,
  resolveBandLocation,
  resolveEffectiveAvatar,
  resolveEffectiveCover
} from "../../../utils/bandProfileUtils";
import {
  getStoredWallets,
  saveStoredWallets,
  connectWalletWithOAuth,
  disconnectWalletProvider,
  setPreferredWallet,
  toggleSingleTapBuying,
  selectWalletCard,
  UserWalletsState,
  WalletCard
} from "../../../services/digitalWalletService";
import { WalletOAuthModal } from "../modals/WalletOAuthModal";
import { PaymentMethodsSettings } from "../../PaymentMethodsSettings";
import { CommunityBandCuratorModal } from "../modals/CommunityBandCuratorModal";
import {
  X, Check, User, Shield, ShieldAlert, Key, Sparkles, MapPin, Calendar, Building,
  Camera, Globe, Instagram, Music2, Mail, Lock, Settings, LogOut, ChevronRight,
  ChevronDown, Edit3, Save, Flame, Zap, Award, Terminal, Sliders, Eye, EyeOff, Layers, Radio,
  FileText, Send, Plus, Trash2, ExternalLink, HelpCircle, Ticket, Barcode as BarcodeIcon,
  ShoppingBag, Search, Users, Play, Disc, MessageSquare, Bell, BellOff,
  UserCheck, UserMinus, Tag, SkipBack, Square, SkipForward, Volume2, Pause,
  Library, Download, Star, ArrowRight, Database, CreditCard, Crown, Wifi, WifiOff, Settings2, LayoutGrid, ShoppingCart, Music, Image as ImageIcon, Shirt, Fingerprint
} from 'lucide-react';

interface LeftProfileDrawerProps {
  leftDrawerOpen: boolean;
  setLeftDrawerOpen: (val: boolean) => void;
  userProfile?: any;
  activeBand?: any;
  portalRole?: string;
  isEmbedded?: boolean;
  profileAvatarUrl?: string | null;
  setProfileAvatarUrl?: (val: string | null) => void;
  profileCoverUrl?: string | null;
  setProfileCoverUrl?: (val: string | null) => void;
  profileFullLegalName?: string;
  setProfileFullLegalName?: (val: string) => void;
  profileHandle?: string;
  setProfileHandle?: (val: string) => void;
  profileBlurb?: string;
  setProfileBlurb?: (val: string) => void;
  profileLocation?: string;
  setProfileLocation?: (val: string) => void;
  profileZip?: string;
  setProfileZip?: (val: string) => void;
  profileMetalArchivesUrl?: string;
  setProfileMetalArchivesUrl?: (val: string) => void;
  profileTopSongArtist?: string;
  setProfileTopSongArtist?: (val: string) => void;
  profileTopSongTitle?: string;
  setProfileTopSongTitle?: (val: string) => void;
  profileTopSongUrl?: string;
  setProfileTopSongUrl?: (val: string) => void;
  selectedUserProfile?: any;
  setSelectedUserProfile?: React.Dispatch<React.SetStateAction<any>>;
  setUserProfile?: React.Dispatch<React.SetStateAction<any>>;
  profileGenres?: string[];
  setProfileGenres?: React.Dispatch<React.SetStateAction<string[]>>;
  profileMicroGenres?: string[];
  setProfileMicroGenres?: React.Dispatch<React.SetStateAction<string[]>>;
  profileStealthMode?: boolean;
  setProfileStealthMode?: (val: boolean) => void;
  profileFavoriteSong?: string;
  setProfileFavoriteSong?: (val: string) => void;
  profileEmail?: string;
  setProfileEmail?: (val: string) => void;
  profilePassword?: string;
  setProfilePassword?: (val: string) => void;
  profilePin?: string;
  setProfilePin?: (val: string) => void;
  isPinModalOpen?: boolean;
  setIsPinModalOpen?: (val: boolean) => void;
  showMapModal?: boolean;
  setShowMapModal?: (val: boolean) => void;
  showReportModal?: boolean;
  setShowReportModal?: (val: boolean) => void;
  showAdminPINModal?: boolean;
  setShowAdminPINModal?: (val: boolean) => void;
  showLabelEpkModal?: boolean;
  setShowLabelEpkModal?: (val: boolean) => void;
  showViewEpksModal?: boolean;
  setShowViewEpksModal?: (val: boolean) => void;
  showSubmitEpkModal?: boolean;
  setShowSubmitEpkModal?: (val: boolean) => void;
  setActiveTab?: (tab: any) => void;
  triggerNotification?: (msg: string) => void;
  getSupabase?: () => any;
  handleLogout?: () => void;

  drawerCurrentView?: string;
  setDrawerCurrentView?: (view: string) => void;
  followingActiveTab?: string;
  setFollowingActiveTab?: (tab: any) => void;
  followingSearchQuery?: string;
  setFollowingSearchQuery?: (q: string) => void;
  discoverProfiles?: any[];
  setDiscoverProfiles?: React.Dispatch<React.SetStateAction<any[]>>;
  handleFollowProfile?: (profile: any) => void;
  filterShowFollowedOnly?: boolean;
  setFilterShowFollowedOnly?: (val: boolean) => void;
  pinEntered?: string;
  setPinEntered?: (val: string) => void;
  pinError?: string;
  setPinError?: (val: string) => void;
  collectionTab?: string;
  setCollectionTab?: (tab: any) => void;
  saveProfileData?: (finalSave?: boolean) => void;
  setViewingReceipt?: (receipt: any) => void;
  isMiguelNameOrProfile?: (p?: any) => boolean;

  currentClearance?: string;
  teamMembers?: any[];
  setTeamMembers?: React.Dispatch<React.SetStateAction<any[]>>;
  expandedMemberId?: string | null;
  setExpandedMemberId?: (id: string | null) => void;
  myCollections?: any[];
  setMyCollections?: React.Dispatch<React.SetStateAction<any[]>>;
  collPlayerActiveId?: string | null;
  setCollPlayerActiveId?: (id: string | null) => void;
  collPlayerActiveTrackId?: string | null;
  setCollPlayerActiveTrackId?: (id: string | null) => void;
  collPlayerIsPlaying?: boolean;
  setCollPlayerIsPlaying?: React.Dispatch<React.SetStateAction<boolean>>;
  collPlayerProgress?: number;
  setCollPlayerProgress?: React.Dispatch<React.SetStateAction<number>>;
  collPlayerVolume?: number;
  setCollPlayerVolume?: React.Dispatch<React.SetStateAction<number>>;
  collPlayerRatings?: Record<string, number>;
  setCollPlayerRatings?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  getCollectionsTrackDuration?: (trackId: string) => string;
  setShowAddItemModal?: (val: boolean) => void;
  [key: string]: any;
}

export const LeftProfileDrawer: React.FC<LeftProfileDrawerProps> = (props) => {
  const {
    leftDrawerOpen,
    setLeftDrawerOpen,
    userProfile,
    portalRole,
    isEmbedded,
    profileAvatarUrl,
    setProfileAvatarUrl,
    profileCoverUrl,
    setProfileCoverUrl,
    profileFullLegalName,
    setProfileFullLegalName,
    profileHandle,
    setProfileHandle,
    profileBlurb,
    setProfileBlurb,
    profileLocation,
    setProfileLocation,
    profileGenres = [],
    setProfileGenres,
    profileMicroGenres = [],
    setProfileMicroGenres,
    profileStealthMode,
    setProfileStealthMode,
    profileFavoriteSong,
    setProfileFavoriteSong,
    profileEmail,
    setProfileEmail,
    profilePassword,
    setProfilePassword,
    profilePin,
    setProfilePin,
    isPinModalOpen,
    setIsPinModalOpen,
    showMapModal,
    setShowMapModal,
    showReportModal,
    setShowReportModal,
    showAdminPINModal,
    setShowAdminPINModal,
    showLabelEpkModal,
    setShowLabelEpkModal,
    showViewEpksModal,
    setShowViewEpksModal,
    showSubmitEpkModal,
    setShowSubmitEpkModal,
    setActiveTab,
    triggerNotification,
    getSupabase,
    handleLogout,

    drawerCurrentView = 'root',
    setDrawerCurrentView = () => {},
    followingActiveTab = 'bands',
    setFollowingActiveTab = () => {},
    followingSearchQuery = '',
    setFollowingSearchQuery = () => {},
    discoverProfiles = [],
    setDiscoverProfiles = () => {},
    handleFollowProfile = () => {},
    filterShowFollowedOnly = false,
    setFilterShowFollowedOnly = () => {},
    pinEntered = '',
    setPinEntered = () => {},
    pinError = '',
    setPinError = () => {},
    collectionTab = 'tickets',
    setCollectionTab = () => {},
    saveProfileData = () => {},
    setViewingReceipt = () => {},
    isMiguelNameOrProfile = () => false,

    profileSceneRoles = [],
    setProfileSceneRoles = () => {},
    profilePrimaryGenres = [],
    setProfilePrimaryGenres = () => {},
    profileTopSongArtist = '',
    setProfileTopSongArtist = () => {},
    profileTopSongTitle = '',
    setProfileTopSongTitle = () => {},
    profileTopSongUrl = '',
    setProfileTopSongUrl = () => {},
    setUserProfile = () => {},
    selectedUserProfile = null,
    setSelectedUserProfile = () => {},
    filterHideTicketPresales = false,
    setFilterHideTicketPresales = () => {},
    filterShowMerchDropsOnlyFromFollowed = false,
    setFilterShowMerchDropsOnlyFromFollowed = () => {},
    prefPushNotifications = true,
    setPrefPushNotifications = () => {},
    prefLocationServices = true,
    setPrefLocationServices = () => {},
    isOnline = true,
    lastOfflineSaveTime = null,
    onUpgradeToPro = () => {},

    onNavigateToWarehouse = () => {},
    setRightDrawerOpen = () => {},
    onLogout = () => {},
    labelHeadquarters = '',
    labelFoundedYear = '',
    labelRosterCount = 0,
    activeBand = null,
    labelPrimaryGenres = [],
    labelRosterTicker = '',
    setLabelRosterTicker = () => {},
    profileSceneCred = 0,
    digitalTicketsScanned = 0,
    physicalMerchBought = 0,
    bandsDiscovered = 0,
    profileZip = '',
    setProfileZip = () => {},
    profileMetalArchivesUrl = '',
    setProfileMetalArchivesUrl = () => {},

    currentClearance = 'Clearance: Full Access',
    teamMembers = [],
    setTeamMembers = () => {},
    expandedMemberId = null,
    setExpandedMemberId = () => {},
    myCollections = [],
    setMyCollections = () => {},
    collPlayerActiveId = null,
    setCollPlayerActiveId = () => {},
    collPlayerActiveTrackId = null,
    setCollPlayerActiveTrackId = () => {},
    collPlayerIsPlaying = false,
    setCollPlayerIsPlaying = () => {},
    collPlayerProgress = 0,
    setCollPlayerProgress = () => {},
    collPlayerVolume = 100,
    setCollPlayerVolume = () => {},
    collPlayerRatings = {},
    setCollPlayerRatings = () => {},
    getCollectionsTrackDuration = () => '3:45',
    setShowAddItemModal = () => {}
  } = props;

  const [newProdName, setNewProdName] = React.useState('');
  const [newProdPrice, setNewProdPrice] = React.useState('');
  const [newProdDesc, setNewProdDesc] = React.useState('');
  const [newProdCategory, setNewProdCategory] = React.useState('media');
  const [newProdSubcategory, setNewProdSubcategory] = React.useState('vinyl');
  const [newProdStock, setNewProdStock] = React.useState('50');
  const [shopItemsList, setShopItemsList] = React.useState<any[]>([]);

  const avatarFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [cropperOpen, setCropperOpen] = React.useState(false);
  const [cropperImageSrc, setCropperImageSrc] = React.useState<string | null>(null);
  const [cropperType, setCropperType] = React.useState<'avatar' | 'cover'>('avatar');
  const [expandedClusters, setExpandedClusters] = React.useState<Record<string, boolean>>({});
  const [isCommunityCuratorOpen, setIsCommunityCuratorOpen] = React.useState(false);

  const [loyaltyProgramEnabled, setLoyaltyProgramEnabled] = React.useState(true);
  const [loyaltyPointMultiplier, setLoyaltyPointMultiplier] = React.useState('10');
  const [loyaltyCustomTiers, setLoyaltyCustomTiers] = React.useState<any[]>([
    { id: 1, name: 'Pit Regular', points: 500, reward: '10% Merch Discount' },
    { id: 2, name: 'Tour Veteran', points: 1500, reward: 'Exclusive Pin + VIP Badge' },
    { id: 3, name: 'Backstage Elite', points: 3500, reward: 'Free Test Pressing LP' }
  ]);
  const [newTierName, setNewTierName] = React.useState('');
  const [newTierPoints, setNewTierPoints] = React.useState('');
  const [newTierReward, setNewTierReward] = React.useState('');

  const locationParts = (profileLocation || '').split(',').map(s => s.trim());
  const currentCity = locationParts[0] || '';
  const currentState = locationParts[1] || '';
  const [profileCountry, setProfileCountry] = React.useState(() => {
    return props.selectedUserProfile?.country || props.userProfile?.country || 'USA';
  });

  const [isConnectingPayment, setIsConnectingPayment] = React.useState<string | null>(null);
  const [activeOAuthProvider, setActiveOAuthProvider] = React.useState<'google' | 'apple' | 'paypal' | null>(null);
  const [walletsState, setWalletsState] = React.useState<UserWalletsState>(() => getStoredWallets(props.userProfile));

  React.useEffect(() => {
    const handleWalletsUpdate = (e: any) => {
      if (e.detail) {
        setWalletsState(e.detail);
      } else {
        setWalletsState(getStoredWallets(props.userProfile));
      }
    };
    window.addEventListener('nexus-wallets-changed', handleWalletsUpdate);
    return () => window.removeEventListener('nexus-wallets-changed', handleWalletsUpdate);
  }, [props.userProfile]);

  const isGooglePayConnected = Boolean(walletsState?.google?.linked);
  const isApplePayConnected = Boolean(walletsState?.apple?.linked);
  const isPaypalConnected = Boolean(walletsState?.paypal?.linked);

  const handleConnectPayment = (method: 'google' | 'apple' | 'paypal') => {
    // Open OAuth authentication gateway modal
    setActiveOAuthProvider(method);
  };

  const handleDisconnectPayment = (method: 'google' | 'apple' | 'paypal') => {
    const next = disconnectWalletProvider(method, props.userProfile);
    setWalletsState(next);
    const name = method === 'google' ? 'Google Pay' : method === 'apple' ? 'Apple Pay' : 'PayPal Wallet';
    triggerNotification?.(`Unlinked and revoked OAuth access for ${name}.`);
  };

  const handleSelectCard = (provider: 'google' | 'apple' | 'paypal', cardId: string) => {
    const next = selectWalletCard(provider, cardId, props.userProfile);
    setWalletsState(next);
    triggerNotification?.(`Updated primary card for ${provider === 'google' ? 'Google Pay' : provider === 'apple' ? 'Apple Pay' : 'PayPal Wallet'}.`);
  };

  const handleSetPreferredWallet = (method: 'google' | 'apple' | 'paypal') => {
    const next = setPreferredWallet(method, props.userProfile);
    setWalletsState(next);
    const name = method === 'google' ? 'Google Pay' : method === 'apple' ? 'Apple Pay' : 'PayPal Wallet';
    triggerNotification?.(`Set ${name} as default wallet for instant purchases.`);
  };

  const handleToggleSingleTap = () => {
    const next = toggleSingleTapBuying(!walletsState.singleTapEnabled, props.userProfile);
    setWalletsState(next);
    triggerNotification?.(next.singleTapEnabled ? '⚡ Single-Tap buying enabled for all presales & merch.' : 'Single-Tap buying disabled.');
  };

if (!leftDrawerOpen) return null;

  return (
        <div className="fixed inset-0 z-[250] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setLeftDrawerOpen(false)} />
          <div className="relative w-[85%] sm:w-80 max-w-sm bg-[#030303] border-r border-zinc-900 h-full flex flex-col animate-in slide-in-from-left duration-300 shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden bg-[linear-gradient(to_right,rgba(239,68,68,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(239,68,68,0.06)_1px,transparent_1px)] [background-size:20px_20px]">
            {/* Ambient Aura Glows for Left Drawer */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-rose-950/5 rounded-full blur-[90px] pointer-events-none z-0" />
            <div className="absolute bottom-20 right-0 w-52 h-52 bg-purple-950/5 rounded-full blur-[80px] pointer-events-none z-0" />

            <div className="p-6 border-b border-zinc-900 flex flex-col gap-4 bg-zinc-950/40 backdrop-blur-md shrink-0 z-10 relative overflow-hidden">
              <button onClick={() => setLeftDrawerOpen(false)} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-rose-900/40 border border-zinc-800 hover:border-rose-500/50 text-zinc-400 hover:text-rose-400 rounded-full transition-all z-50 cursor-pointer"><X className="w-4 h-4" /></button>
              {/* Optional Cover Image backdrop */}
              <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {(() => {
                  const effectiveCover = resolveEffectiveCover(portalRole || 'industry_pro', activeBand, userProfile, profileCoverUrl);
                  return effectiveCover ? (
                    <img src={effectiveCover} className="w-full h-full object-cover opacity-20 blur-[1px]" alt="" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-rose-950/15 via-transparent to-transparent" />
                  );
                })()}
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                {(() => {
                  const effectiveAvatar = resolveEffectiveAvatar(portalRole || 'industry_pro', activeBand, userProfile, profileAvatarUrl);
                  const effectiveName = portalRole === 'band' ? resolveBandName(activeBand, userProfile) : ((portalRole as any) === 'label' ? (userProfile?.label_company_name || 'Pro Label') : (profileFullLegalName || 'User'));
                  return effectiveAvatar ? (
                    <img src={effectiveAvatar} className="w-14 h-14 rounded-full object-cover border border-rose-500/40 shrink-0 shadow-lg" alt="Profile" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-rose-950/40 border border-rose-500/50 flex items-center justify-center font-black text-rose-400 text-xl shrink-0">
                      {effectiveName.replace(/^@+/, '').charAt(0).toUpperCase()}
                    </div>
                  );
                })()}
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-black text-white truncate font-display">
                      {(portalRole as any) === 'label' 
                        ? (userProfile?.label_company_name || 'Pro Label') 
                        : (portalRole === 'band'
                            ? resolveBandName(activeBand, userProfile)
                            : (['creative', 'promoter'].includes(portalRole) || isEmbedded
                                ? (profileFullLegalName || (profileHandle ? `@${profileHandle.replace(/^@+/, '')}` : 'Workspace'))
                                : (profileHandle ? `@${profileHandle.replace(/^@+/, '')}` : (profileFullLegalName || 'Guest'))))
                      }
                    </h2>
                    {isEmbedded && (
                      <span className="text-[7px] font-black uppercase tracking-wider bg-rose-500/20 border border-rose-500/40 text-rose-400 px-1.5 py-0.5 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-zinc-400 font-mono truncate mt-0.5">
                    {(portalRole as any) === 'label'
                      ? `Active User: ${userProfile?.name || 'Active Operator'}`
                      : (portalRole === 'band'
                          ? `@${resolveBandHandle(activeBand, userProfile)} • BAND ACCOUNT`
                          : (['creative', 'promoter'].includes(portalRole) || isEmbedded
                              ? `@${(profileHandle || 'pro').replace(/^@+/, '')} • ${portalRole.toUpperCase()} ACCOUNT`
                              : (profileFullLegalName || `@${(profileHandle || 'user').replace(/^@+/, '')}`)))
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 relative z-10">
              <AnimatePresence initial={false}>
                {drawerCurrentView === 'root' && (
                  <motion.div
                    key="root"
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-100%", opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 overflow-y-auto py-4 flex flex-col"
                  >
                    <div className="space-y-1 px-3 flex-1">
                      {/* Short Profile blurb preview inside root */}
                      <div className="mx-1 mb-3 p-3 bg-zinc-950/50 rounded-xl border border-zinc-900 text-center">
                        <p className="text-[11px] text-zinc-400 italic">"{profileBlurb || 'No profile blurb written yet.'}"</p>
                        <div className="mt-2 flex flex-wrap gap-1 justify-center">
                          <span className="text-[8px] font-black uppercase tracking-wider bg-rose-950/40 border border-rose-900/40 text-rose-400 px-2 py-0.5 rounded-md font-mono">
                            {portalRole === 'fan_only' ? 'Fan Only' : 'Industry Pro'}
                          </span>
                        </div>
                      </div>

                      {/* Main Navigation Menu */}
                      <div className="space-y-2 mt-2">
                        {/* Profile Settings */}
                        <button 
                          type="button"
                          onClick={() => setDrawerCurrentView('profile')} 
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-900/90 border border-zinc-900 hover:border-zinc-800 transition-all duration-200 group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/15 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.25)] transition-all shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                                Profile Settings
                              </span>
                              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-mono transition-colors truncate">
                                Identity, bio & preferences
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>

                        {/* Saved Payment Methods */}
                        <button 
                          type="button"
                          onClick={() => setDrawerCurrentView('payment')} 
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-900/90 border border-zinc-900 hover:border-zinc-800 transition-all duration-200 group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:border-purple-500/40 group-hover:bg-purple-500/15 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.25)] transition-all shrink-0">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                                Saved Payment Methods
                              </span>
                              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-mono transition-colors truncate">
                                Digital wallets & 1-tap checkout
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>

                        {/* VIP Club Info */}
                        {!isEmbedded && (
                          <button 
                            type="button"
                            onClick={() => setDrawerCurrentView('vip')} 
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-900/90 border border-zinc-900 hover:border-zinc-800 transition-all duration-200 group cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:border-rose-500/40 group-hover:bg-rose-500/15 group-hover:shadow-[0_0_10px_rgba(244,63,94,0.25)] transition-all shrink-0">
                                <Crown className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                                  VIP Club Info
                                </span>
                                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-mono transition-colors truncate">
                                  Balcony access & perks
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                          </button>
                        )}

                        {/* My Collections */}
                        {!isEmbedded && (
                          <button 
                            type="button"
                            onClick={() => setDrawerCurrentView('collections')} 
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-900/90 border border-zinc-900 hover:border-zinc-800 transition-all duration-200 group cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/15 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.25)] transition-all shrink-0">
                                <Library className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                                  My Collections
                                </span>
                                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-mono transition-colors truncate">
                                  Tickets, vinyl, merch & tapes
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                          </button>
                        )}

                        {/* Following Lists */}
                        <button 
                          type="button"
                          onClick={() => setDrawerCurrentView('following')} 
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-900/90 border border-zinc-900 hover:border-zinc-800 transition-all duration-200 group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 group-hover:bg-blue-500/15 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.25)] transition-all shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                                Following Lists
                              </span>
                              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-mono transition-colors truncate">
                                Bands, venues, peers & artists
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>

                        {/* Band Archivist */}
                        <button 
                          type="button"
                          onClick={() => setIsCommunityCuratorOpen(true)} 
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-900/90 border border-zinc-900 hover:border-zinc-800 transition-all duration-200 group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:border-amber-500/40 group-hover:bg-amber-500/15 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.25)] transition-all shrink-0">
                              <Disc className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                                Band Archivist
                              </span>
                              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-mono transition-colors truncate">
                                Community archive & discography
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>
                      </div>

                      {/* Scene Cred Block moved to bottom of root drawer view */}
                      <div className="mx-1 mt-5 bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-2xl space-y-3 shadow-md">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase text-rose-400 tracking-wider font-mono flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Scene Cred
                          </h4>
                          <span className="bg-rose-500/10 text-rose-400 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-500/20">{profileSceneCred} PTS</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-900/80 pb-1.5">
                            <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5 text-zinc-500" /> Digital Tickets Scanned</span>
                            <span className="text-white font-mono">{digitalTicketsScanned} (+{digitalTicketsScanned * 20})</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-900/80 pb-1.5">
                            <span className="flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5 text-zinc-500" /> Physical Merch Bought</span>
                            <span className="text-white font-mono">{physicalMerchBought} (+{physicalMerchBought * 50})</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-900/80 pb-1.5">
                            <span className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-zinc-500" /> Bands Discovered</span>
                            <span className="text-white font-mono">{bandsDiscovered} (+{bandsDiscovered * 30})</span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setDrawerCurrentView('vip')}
                          className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Unlock VIP Balcony Upgrade
                        </button>
                      </div>
                    </div>
                  <div className="p-4 border-t border-zinc-900 bg-zinc-950/50 mt-auto shrink-0">
                    <button onClick={() => { setLeftDrawerOpen(false); onLogout?.(); }} className="w-full py-3.5 bg-zinc-900 text-rose-500 text-xs font-black uppercase tracking-wider rounded-lg hover:bg-zinc-800 transition-colors">
                      Log Out
                    </button>
                  </div>
                </motion.div>
              )}

                {drawerCurrentView !== 'root' && (
                  <motion.div
                    key="subview"
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 overflow-y-auto bg-[#030303] flex flex-col z-20 bg-[linear-gradient(to_right,rgba(239,68,68,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(239,68,68,0.06)_1px,transparent_1px)] [background-size:20px_20px]"
                  >
                    <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur p-4 border-b border-zinc-900 flex items-center shrink-0 cursor-pointer text-zinc-400 hover:text-white" onClick={() => setDrawerCurrentView('root')}>
                      <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
                      <span className="text-xs font-black uppercase tracking-widest font-display">Back</span>
                    </div>
                    <div className="flex-1 p-4">
                      {drawerCurrentView === 'profile' && (
                        !(portalRole === 'industry_pro' || portalRole === 'fan_only') ? (
                          <div className="space-y-5 pb-8">
                            <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-3 mb-4 flex-wrap">
                              <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest font-display">
                                {(portalRole as any) === 'label' ? 'Label Brand Registry' : 'Professional Brand Registry'}
                              </h3>
                              <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${(currentClearance as any) == 5 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' : (currentClearance as any) == 4 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse'}`}>
                                {(currentClearance as any) == 5 && '🔑 LEVEL 5 OWNER'}
                                {(currentClearance as any) == 4 && '💼 LEVEL 4 PARTNER'}
                                {(currentClearance as any) == 3 && '📣 LEVEL 3 REP'}
                                {(currentClearance as any) == 2 && '🔒 LEVEL 2 STAFF'}
                                {(currentClearance as any) == 1 && '📱 LEVEL 1 TEMP'}
                              </span>
                            </div>

                            <div className="p-3.5 bg-cyan-950/10 border border-cyan-900/40 text-cyan-400 rounded-xl text-[10px] leading-normal font-medium">
                              ℹ️ <strong>CORE IDENTITY LOCKED:</strong> Most brand identity settings are locked in the social feed to maintain a single source of truth. Please use the workspace portal settings to update your core details. You can update your Bio/Manifesto and Roster Ticker below.
                            </div>

                            {/* Brand Identity details (Read Only) */}
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                {/* Readonly Avatar */}
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-zinc-500">{portalRole === 'band' ? 'Band Logo' : ((portalRole as any) === 'label' ? 'Label Avatar' : 'Profile Avatar')}</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center overflow-hidden">
                                      {(() => {
                                        const logo = portalRole === 'band' ? resolveBandLogo(activeBand, userProfile) : (profileAvatarUrl || activeBand?.logo_url);
                                        return logo ? (
                                          <img src={logo} className="w-full h-full object-cover opacity-90" alt="Avatar" />
                                        ) : (
                                          <span className="font-black text-zinc-600 text-sm">{(profileHandle || 'U').replace(/^@+/, '').charAt(0).toUpperCase()}</span>
                                        );
                                      })()}
                                    </div>
                                    <span className="text-[8px] font-mono text-zinc-600">Locked to Portal</span>
                                  </div>
                                </div>

                                {/* Readonly Cover */}
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-zinc-500">{portalRole === 'band' ? 'Band Cover Banner' : ((portalRole as any) === 'label' ? 'Label Banner' : 'Cover Banner')}</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-16 h-12 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center overflow-hidden">
                                      {(() => {
                                        const cover = portalRole === 'band' ? resolveBandCover(activeBand, userProfile) : (profileCoverUrl || activeBand?.cover_url);
                                        return cover ? (
                                          <img src={cover} className="w-full h-full object-cover opacity-90" alt="Cover" />
                                        ) : (
                                          <span className="text-[8px] text-zinc-600 font-mono">None</span>
                                        );
                                      })()}
                                    </div>
                                    <span className="text-[8px] font-mono text-zinc-600">Locked to Portal</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-400">{portalRole === 'band' ? 'Band / Artist Entity Name' : ((portalRole as any) === 'label' ? 'Record Label Entity Name' : 'Corporate Entity Name')}</label>
                                <input 
                                  type="text" 
                                  value={portalRole === 'band' ? resolveBandName(activeBand, userProfile) : (profileFullLegalName || '')} 
                                  disabled
                                  className="w-full mt-1 bg-zinc-950/50 border border-zinc-850/50 rounded-xl px-3 py-2.5 text-xs text-zinc-400 disabled:cursor-not-allowed font-medium" 
                                />
                              </div>

                              <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-400">{portalRole === 'band' ? 'Band Handle / Screen Name' : ((portalRole as any) === 'label' ? 'Label Handle / Screen Name' : 'Brand Handle / Screen Name')}</label>
                                <div className="relative mt-1">
                                  <span className="absolute left-3.5 top-2.5 text-zinc-600 text-xs font-mono">@</span>
                                  <input 
                                    type="text" 
                                    value={portalRole === 'band' ? resolveBandHandle(activeBand, userProfile).replace(/^@+/, '') : (profileHandle || '').replace(/^@+/, '')} 
                                    disabled
                                    className="w-full bg-zinc-950/50 border border-zinc-850/50 rounded-xl py-2.5 pl-7 pr-3 text-xs text-zinc-400 disabled:cursor-not-allowed font-medium" 
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400">{portalRole === 'band' ? 'Homebase / Location' : ((portalRole as any) === 'label' ? 'Distribution HQ' : 'Headquarters')}</label>
                                  <input 
                                    type="text" 
                                    value={portalRole === 'band' ? (activeBand?.homebase || activeBand?.city || profileLocation || 'Denison, TX, USA') : labelHeadquarters} 
                                    disabled
                                    className="w-full mt-1 bg-zinc-950/50 border border-zinc-850/50 rounded-xl px-3 py-2.5 text-xs text-zinc-400 disabled:cursor-not-allowed font-medium" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400">{portalRole === 'band' ? 'Formed Year' : 'Founded Year'}</label>
                                  <input 
                                    type="text" 
                                    value={portalRole === 'band' ? (activeBand?.formed_year || activeBand?.year_formed || '2023') : labelFoundedYear} 
                                    disabled
                                    className="w-full mt-1 bg-zinc-950/50 border border-zinc-850/50 rounded-xl px-3 py-2.5 text-xs text-zinc-400 disabled:cursor-not-allowed font-medium" 
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {(portalRole as any) === 'label' ? (
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-zinc-400">Roster Count</label>
                                    <input 
                                      type="text" 
                                      value={labelRosterCount} 
                                      disabled
                                      className="w-full mt-1 bg-zinc-950/50 border border-zinc-850/50 rounded-xl px-3 py-2.5 text-xs text-zinc-500 disabled:cursor-not-allowed font-medium" 
                                    />
                                  </div>
                                ) : null}
                                <div className="col-span-2">
                                  <label className="text-[10px] uppercase font-bold text-zinc-400">Security PIN</label>
                                  <input 
                                    type="password" 
                                    maxLength={6}
                                    value={profilePin} 
                                    disabled
                                    placeholder="******"
                                    className="w-full mt-1 bg-zinc-950/50 border border-zinc-850/50 rounded-xl px-3 py-2.5 text-xs text-zinc-500 font-mono tracking-widest text-center disabled:cursor-not-allowed font-medium" 
                                  />
                                </div>
                              </div>

                              {/* Label / Band Genres */}
                              <div className="opacity-75 pointer-events-none">
                                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">{(portalRole as any) === 'label' ? 'Primary Label Genres' : 'Genres / Genre Tags'}</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {(() => {
                                    let bandGenreList: string[] = [];
                                    if ((portalRole as any) === 'band' && activeBand) {
                                      if (Array.isArray(activeBand.micro_genres) && activeBand.micro_genres.length > 0) {
                                        bandGenreList = activeBand.micro_genres;
                                      } else if (Array.isArray(activeBand.genre_tags) && activeBand.genre_tags.length > 0) {
                                        bandGenreList = activeBand.genre_tags;
                                      } else if (Array.isArray(activeBand.genres) && activeBand.genres.length > 0) {
                                        bandGenreList = activeBand.genres;
                                      } else if (activeBand.genre) {
                                        bandGenreList = activeBand.genre.split(/[\/,]/).map((s: string) => s.trim()).filter(Boolean);
                                      }
                                    }
                                    const listToDisplay = bandGenreList.length > 0 ? bandGenreList : (labelPrimaryGenres.length > 0 ? labelPrimaryGenres : ['Metal']);
                                    return listToDisplay.map((genre, idx) => (
                                      <span
                                        key={`genre-${genre}-${idx}`}
                                        className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded border bg-orange-950/40 text-orange-400 border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.15)]"
                                      >
                                        {genre}
                                      </span>
                                    ));
                                  })()}
                                </div>
                              </div>

                              {/* Our Most Popular Track (Only for Bands) - Restricted exclusively to band's own catalog */}
                              {(portalRole as any) === 'band' && (
                                <div className="space-y-1.5 mt-6 border-t border-zinc-900/60 pt-4">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] uppercase font-bold text-orange-400 font-mono tracking-wider">Our Most Popular Track</label>
                                    <span className="text-[7.5px] font-mono text-zinc-500 uppercase">CATALOG RESTRICTED</span>
                                  </div>
                                  <select
                                    value={profileFavoriteSong}
                                    onChange={(e) => {
                                      setProfileFavoriteSong(e.target.value);
                                      triggerNotification?.(`📊 Popular track updated to: ${e.target.value}`);
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-orange-500 focus:outline-none font-medium cursor-pointer"
                                  >
                                    <option value="None Selected">-- Select Track from Catalog --</option>
                                    <optgroup label="Cosmic Descent (EP)">
                                      <option value="Into the Void">Into the Void</option>
                                      <option value="Abyssal">Abyssal</option>
                                      <option value="Cosmic Ascent">Cosmic Ascent</option>
                                    </optgroup>
                                    <optgroup label="Necrotic Rituals (LP)">
                                      <option value="Necrotic Ritual">Necrotic Ritual</option>
                                      <option value="Gateway to Madness">Gateway to Madness</option>
                                      <option value="Slam Torment">Slam Torment</option>
                                    </optgroup>
                                    <optgroup label="Goregrind Overdrive (EP)">
                                      <option value="Rotting in Gutturals">Rotting in Gutturals</option>
                                      <option value="Flesh Carver">Flesh Carver</option>
                                    </optgroup>
                                  </select>
                                </div>
                              )}

                              {/* Ticker (Editable) */}
                              <div className="space-y-1 mt-4">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] uppercase font-bold text-orange-400">
                                    {(portalRole as any) === 'band' ? 'Band Update Ticker (Marquee)' : 'Update Ticker (Marquee)'}
                                  </label>
                                  <span className="text-[9px] font-mono font-bold text-zinc-500">{labelRosterTicker.length}/200</span>
                                </div>
                                <textarea 
                                  maxLength={200}
                                  value={labelRosterTicker}
                                  onChange={(e) => setLabelRosterTicker(e.target.value)}
                                  rows={2.5}
                                  placeholder={(portalRole as any) === 'band' ? "Enter band news, gigs, tape drops for marquee ticker..." : "Enter live news, updates, or announcements for marquee ticker..."}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-orange-400 font-mono tracking-widest uppercase placeholder-zinc-600 focus:border-orange-500 focus:outline-none resize-none font-black transition-colors"
                                />
                              </div>

                              {/* Label Bio / Manifesto (Editable) - Moved to bottom */}
                              <div className="space-y-1 mt-4 border-t border-zinc-900/60 pt-4">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] uppercase font-bold text-orange-400">{(portalRole as any) === 'label' ? 'Label Bio & Manifesto' : 'Bio & Manifesto'}</label>
                                  <span className="text-[9px] font-mono font-bold text-zinc-500">{profileBlurb.length}/500</span>
                                </div>
                                <textarea 
                                  maxLength={500}
                                  value={profileBlurb}
                                  onChange={(e) => setProfileBlurb(e.target.value.slice(0, 500))}
                                  rows={3}
                                  placeholder="Enter bio, mission statement or underground manifesto..."
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none resize-none font-medium transition-colors"
                                />
                              </div>
                            </div>

                            {/* Save & Back buttons */}
                            <div className="pt-4 border-t border-zinc-900 space-y-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  if ((currentClearance as any) < 4) {
                                    triggerNotification?.("❌ Access Denied: Level 5 Clearance required to save brand registry.");
                                    return;
                                  }
                                  setDrawerCurrentView('root');
                                  triggerNotification?.("✨ Label Brand Configuration saved successfully!");
                                }}
                                className={`w-full py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-colors font-display shadow-lg ${(currentClearance as any) < 4 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer'}`}
                              >
                                Save Brand Settings
                              </button>
                              <button 
                                type="button"
                                onClick={() => setDrawerCurrentView('root')}
                                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors font-display"
                              >
                                Discard Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-5 pb-8">
                          <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-3 mb-4 flex-wrap">
                            <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest font-display">Profile Settings</h3>
                            {isEmbedded && portalRole && portalRole !== 'fan_only' && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded">
                                {portalRole.toUpperCase()} PORTAL
                              </span>
                            )}
                          </div>

                          {/* Profile Pictures section */}
                          <div className="space-y-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-900">
                            <h4 className="text-[10px] font-black uppercase text-rose-400 tracking-wider font-mono">Visual Identity</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                              {/* Avatar Upload */}
                              <div className="space-y-1">
                                <div className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Profile Avatar</div>
                                <div 
                                  onClick={() => avatarFileInputRef.current?.click()}
                                  className="w-full relative group/avatar bg-zinc-900/10 hover:bg-zinc-900/30 border border-dashed border-zinc-850 hover:border-rose-500/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 h-36"
                                >
                                  <input 
                                    ref={avatarFileInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          setCropperImageSrc(reader.result as string);
                                          setCropperType('avatar');
                                          setCropperOpen(true);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />

                                  <div className="relative">
                                    {profileAvatarUrl ? (
                                      <div className="relative">
                                        <img src={profileAvatarUrl} className={`w-16 h-16 rounded-full object-cover group-hover/avatar:scale-105 transition-transform ${getRoleBorderAndGlowClass(portalRole)}`} alt="Avatar" />
                                        <button 
                                          type="button" 
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setProfileAvatarUrl(null);
                                            triggerNotification?.("Profile avatar removed!");
                                            if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
                                          }}
                                          className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-zinc-950 z-20 cursor-pointer shadow-md"
                                          title="Remove Avatar"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <div className={`w-16 h-16 rounded-full bg-zinc-950 flex items-center justify-center font-black text-zinc-500 text-lg group-hover/avatar:text-zinc-300 transition-all ${getRoleBorderAndGlowClass(portalRole)}`}>
                                        {profileHandle?.charAt(0).toUpperCase() || 'U'}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-rose-400 group-hover/avatar:text-rose-300 transition-colors">
                                      {profileAvatarUrl ? 'Replace Photo' : 'Upload Photo'}
                                    </div>
                                    <div className="text-[7px] font-mono text-zinc-500 uppercase mt-0.5">Click box to browse</div>
                                  </div>
                                </div>

                                <div className="mt-1.5 pt-1.5 border-t border-zinc-900/60">
                                  <div className="text-[7.5px] uppercase tracking-wider font-bold text-zinc-600 mb-1">Local Presets:</div>
                                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                                    {[
                                      { name: 'Nexus Icon Brackets', url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20Circuits.png' }
                                    ].map((preset, prIdx) => (
                                      <button
                                        key={`avatar-preset-${preset.url}-${prIdx}`}
                                        type="button"
                                        onClick={() => {
                                          setProfileAvatarUrl(preset.url);
                                          triggerNotification?.(`Avatar set to ${preset.name}!`);
                                        }}
                                        className={`px-1 py-0.5 text-[8px] font-mono border rounded transition-all cursor-pointer whitespace-nowrap ${
                                          profileAvatarUrl === preset.url
                                            ? 'bg-rose-950/40 text-rose-400 border-rose-500/40'
                                            : 'bg-zinc-900/30 text-zinc-500 border-zinc-900 hover:text-zinc-300 hover:border-zinc-800'
                                        }`}
                                      >
                                        {preset.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Cover Banner Upload */}
                              <div className="space-y-1">
                                <div className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Optional Cover Banner</div>
                                <div 
                                  onClick={() => coverFileInputRef.current?.click()}
                                  className="w-full relative group/cover bg-zinc-900/10 hover:bg-zinc-900/30 border border-dashed border-zinc-850 hover:border-rose-500/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 h-36"
                                >
                                  <input 
                                    ref={coverFileInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          setCropperImageSrc(reader.result as string);
                                          setCropperType('cover');
                                          setCropperOpen(true);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />

                                  {profileCoverUrl ? (
                                    <div className="relative w-full aspect-[2.5/1] rounded-lg overflow-hidden border border-zinc-800 shadow-md group-hover/cover:scale-[1.02] transition-transform">
                                      <img src={profileCoverUrl} className="w-full h-full object-cover" alt="Cover Preview" />
                                      <button 
                                        type="button" 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setProfileCoverUrl(null);
                                          triggerNotification?.("Profile cover banner removed!");
                                          if (coverFileInputRef.current) coverFileInputRef.current.value = '';
                                        }}
                                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-zinc-950 z-20 cursor-pointer shadow-md"
                                        title="Remove Cover Banner"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="w-full aspect-[2.5/1] rounded-lg bg-zinc-950 border border-zinc-850 flex flex-col items-center justify-center gap-1 text-zinc-500 group-hover/cover:border-rose-500/30 group-hover/cover:text-zinc-300 transition-all">
                                      <ImageIcon className="w-4 h-4 text-zinc-600 group-hover/cover:text-rose-400 transition-colors" />
                                      <span className="text-[7px] font-mono uppercase tracking-widest text-zinc-600 group-hover/cover:text-zinc-400">No Banner Set</span>
                                    </div>
                                  )}

                                  <div className="text-center">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-rose-400 group-hover/cover:text-rose-300 transition-colors">
                                      {profileCoverUrl ? 'Replace Banner' : 'Upload Banner'}
                                    </div>
                                    <div className="text-[7px] font-mono text-zinc-500 uppercase mt-0.5">Click box to browse</div>
                                  </div>
                                </div>

                                <div className="mt-1.5 pt-1.5 border-t border-zinc-900/60">
                                  <div className="text-[7.5px] uppercase tracking-wider font-bold text-zinc-600 mb-1">Local Presets:</div>
                                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                                    {[
                                      { name: 'VE Background 2026', url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Virulent%20Excision%20-%20Chambers%20TS.png' }
                                    ].map((preset, prIdx) => (
                                      <button
                                        key={`cover-preset-${preset.url}-${prIdx}`}
                                        type="button"
                                        onClick={() => {
                                          setProfileCoverUrl(preset.url);
                                          triggerNotification?.(`Cover set to ${preset.name}!`);
                                        }}
                                        className={`px-1 py-0.5 text-[8px] font-mono border rounded transition-all cursor-pointer whitespace-nowrap ${
                                          profileCoverUrl === preset.url
                                            ? 'bg-purple-950/40 text-purple-400 border-purple-500/40'
                                            : 'bg-zinc-900/30 text-zinc-500 border-zinc-900 hover:text-zinc-300 hover:border-zinc-800'
                                        }`}
                                      >
                                        {preset.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] uppercase font-bold text-zinc-400">
                                {(portalRole as any) === 'band' ? 'Band / Artist Name' :
                                 (portalRole as any) === 'creative' ? 'Business / Creative Name' :
                                 (portalRole as any) === 'promoter' ? 'Promoter / Brand Name' :
                                 (portalRole as any) === 'label' ? 'Record Label Name' :
                                 'Full Legal Name'}
                              </label>
                              <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Unlocked</span>
                            </div>
                            <input 
                              type="text" 
                              value={profileFullLegalName || ''} 
                              onChange={(e) => {
                                const val = e.target.value;
                                if (setProfileFullLegalName) setProfileFullLegalName(val);
                                if (setUserProfile) {
                                  setUserProfile((prev: any) => prev ? { ...prev, full_name: val, legal_name: val, legalName: val } : null);
                                }
                                try {
                                  localStorage.setItem('nexus_full_legal_name', val);
                                  localStorage.setItem('nexus_user_full_name', val);
                                } catch (_) {}
                              }}
                              onBlur={() => {
                                if (saveProfileData) saveProfileData(true);
                              }}
                              className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none font-medium font-mono" 
                            />
                            <p className="text-[9px] text-emerald-400/80 mt-1 font-mono leading-normal flex items-center gap-1">
                              🔓 <strong>Editable:</strong> Legal registry name can be updated at any time.
                            </p>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-400">Screen Name / Handle</label>
                            <div className="relative mt-1">
                              <span className="absolute left-3.5 top-2.5 text-zinc-600 text-xs font-mono">@</span>
                              <input 
                                type="text" 
                                value={profileHandle} 
                                onChange={(e) => setProfileHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-7 pr-3 text-xs text-white focus:border-rose-500 focus:outline-none" 
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-400">Email Address</label>
                            <input 
                              type="email" 
                              value={profileEmail} 
                              onChange={(e) => setProfileEmail(e.target.value)}
                              className="w-full mt-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none" 
                            />
                          </div>

                          {/* City, State, Country & ZIP Code Split */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-zinc-400">City</label>
                              <input 
                                type="text" 
                                value={currentCity} 
                                onChange={(e) => {
                                  const newCity = e.target.value;
                                  const newLoc = newCity ? (currentState ? `${newCity}, ${currentState}` : newCity) : (currentState ? `${currentState}` : '');
                                  setProfileLocation(newLoc);
                                  if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, city: newCity, city_state: newLoc, location_code: newLoc } : null); }
                                  if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, city: newCity, city_state: newLoc, location: newLoc } : null); }
                                }}
                                placeholder="e.g. Detroit"
                                className="w-full mt-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none" 
                              />
                            </div>

                            <div>
                              <label className="text-[10px] uppercase font-bold text-zinc-400">Country</label>
                              <select
                                value={profileCountry}
                                onChange={(e) => {
                                  const newCountry = e.target.value;
                                  setProfileCountry(newCountry);
                                  if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, country: newCountry } : null); }
                                  if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, country: newCountry } : null); }
                                }}
                                className="w-full mt-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
                              >
                                {COUNTRIES.map((c, cIdx) => (
                                  <option key={`country-${c.code}-${cIdx}`} value={c.code}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-zinc-400">State / Province</label>
                              {(!profileCountry || profileCountry === 'USA' || profileCountry === 'US') ? (
                                <select
                                  value={currentState}
                                  onChange={(e) => {
                                    const newState = e.target.value;
                                    const newLoc = currentCity ? (newState ? `${currentCity}, ${newState}` : currentCity) : newState;
                                    setProfileLocation(newLoc);
                                    if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, state_province: newState, city_state: newLoc, location_code: newLoc } : null); }
                                    if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, state_province: newState, city_state: newLoc, location: newLoc } : null); }
                                  }}
                                  className="w-full mt-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
                                >
                                  <option value="">Select State</option>
                                  {US_STATES.map((st, stIdx) => (
                                    <option key={`state-${st.code}-${stIdx}`} value={st.code}>{st.name} ({st.code})</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={currentState}
                                  onChange={(e) => {
                                    const newState = e.target.value;
                                    const newLoc = currentCity ? (newState ? `${currentCity}, ${newState}` : currentCity) : newState;
                                    setProfileLocation(newLoc);
                                    if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, state_province: newState, city_state: newLoc, location_code: newLoc } : null); }
                                    if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, state_province: newState, city_state: newLoc, location: newLoc } : null); }
                                  }}
                                  placeholder="Region / Province"
                                  className="w-full mt-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                                />
                              )}
                            </div>

                            <div>
                              <label className="text-[10px] uppercase font-bold text-zinc-400">ZIP Code</label>
                              <input 
                                type="text" 
                                value={profileZip} 
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                                  setProfileZip(val);
                                  if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, zip_code: val } : null); }
                                  if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, zip_code: val } : null); }
                                  if (val.length === 5) {
                                    const resolved = resolveZipCode(val);
                                    if (resolved && resolved !== val) {
                                      setProfileLocation(resolved);
                                      if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, zip_code: val, city_state: resolved, location_code: resolved } : null); }
                                      if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, zip_code: val, city_state: resolved, location: resolved } : null); }
                                    }
                                  }
                                }}
                                placeholder="e.g. 48201"
                                className="w-full mt-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-rose-500 focus:outline-none" 
                              />
                            </div>
                          </div>

                          {/* Primary Scene Role Display */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-zinc-400">Primary Scene Role</label>
                            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                  portalRole === 'fan_only' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                                }`} />
                                <span className="text-xs font-black uppercase tracking-wider text-white font-mono">
                                  {portalRole === 'fan_only' ? 'Fan Only' : `Industry Pro ${portalRole && portalRole !== 'industry_pro' && typeof (portalRole as any) === 'string' ? `(${String(portalRole).toUpperCase()})` : ''}`}
                                </span>
                              </div>
                              <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${
                                portalRole === 'fan_only' ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40' : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                              }`}>
                                {portalRole === 'fan_only' ? 'Fan Account' : 'Verified Pro Account'}
                              </span>
                            </div>
                          </div>

                          {/* Curate Sonic Footprint */}
                          <div className="pt-3 border-t border-zinc-900 space-y-3">
                            <div>
                              <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider font-display mb-0.5">Curate Sonic Footprint</h4>
                              <p className="text-[9px] text-zinc-500 leading-normal">Curate your music identity on the underground network.</p>
                            </div>

                            <div className="space-y-3">
                              {/* Favorite Song / Current Top Song Split Inputs */}
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-zinc-400 block">
                                  {(portalRole as any) === 'band' ? "Our Featured Release" : "Current Top Song / Anthem"}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-[8.5px] font-mono text-zinc-500 uppercase mb-1">Band / Artist Name</div>
                                    <input 
                                      type="text" 
                                      value={profileTopSongArtist} 
                                      onChange={(e) => {
                                        const artist = e.target.value;
                                        setProfileTopSongArtist(artist);
                                        const full = artist && profileTopSongTitle ? `${artist} - ${profileTopSongTitle}` : (artist || profileTopSongTitle || '');
                                        setProfileFavoriteSong(full);
                                        if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, top_song_artist: artist, top_song_title: profileTopSongTitle, favoriteSong: full } : null); }
                                        if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, top_song_artist: artist, top_song_title: profileTopSongTitle, favoriteSong: full } : null); }
                                      }}
                                      placeholder="e.g. Devourment"
                                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none font-medium" 
                                    />
                                  </div>
                                  <div>
                                    <div className="text-[8.5px] font-mono text-zinc-500 uppercase mb-1">Song / Track Name</div>
                                    <div className="flex gap-1.5">
                                      <input 
                                        type="text" 
                                        value={profileTopSongTitle} 
                                        onChange={(e) => {
                                          const title = e.target.value;
                                          setProfileTopSongTitle(title);
                                          const full = profileTopSongArtist && title ? `${profileTopSongArtist} - ${title}` : (profileTopSongArtist || title || '');
                                          setProfileFavoriteSong(full);
                                          if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, top_song_title: title, favoriteSong: full } : null); }
                                          if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, top_song_title: title, favoriteSong: full } : null); }
                                        }}
                                        placeholder="e.g. Babykiller"
                                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none font-medium" 
                                      />
                                      {(portalRole as any) === 'band' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const popularTracks = [
                                              { artist: "Abyssal", title: "Into the Void" },
                                              { artist: "Abyssal", title: "Necrotic Ritual" },
                                              { artist: "Devourment", title: "Babykiller" },
                                              { artist: "Cryptopsy", title: "Phobophile" }
                                            ];
                                            const item = popularTracks[Math.floor(Math.random() * popularTracks.length)];
                                            setProfileTopSongArtist(item.artist);
                                            setProfileTopSongTitle(item.title);
                                            setProfileFavoriteSong(`${item.artist} - ${item.title}`);
                                            triggerNotification?.(`📊 Auto-selected track: ${item.artist} - ${item.title}`);
                                          }}
                                          className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-emerald-400 border border-zinc-800 rounded-xl text-[9px] font-bold font-mono transition-colors uppercase shrink-0"
                                          title="Auto-select track"
                                        >
                                          Auto
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Top Song URL */}
                              <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                                  Top Song URL (e.g., Spotify, Bandcamp, YouTube)
                                </label>
                                <input 
                                  type="text" 
                                  value={profileTopSongUrl} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProfileTopSongUrl(val);
                                    if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, top_song_url: val } : null); }
                                    if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, top_song_url: val } : null); }
                                  }}
                                  placeholder="https://open.spotify.com/track/..."
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none font-medium" 
                                />
                              </div>


                              {/* Favorite Extreme Micro-Genres Accordions */}
                              <div className="space-y-3 pt-3 border-t border-zinc-900/80">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] uppercase font-bold text-purple-400 font-mono tracking-wider block">
                                    Favorite Micro-Genres (Pick Unlimited)
                                  </label>
                                  {(profileGenres.length > 0 || profileMicroGenres.length > 0) && (
                                    <span className="text-[9px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded-full">
                                      {Array.from(new Set([...profileGenres, ...profileMicroGenres])).length} Selected
                                    </span>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  {MASTER_GENRES.map((cluster, cIdx) => {
                                    const isExpanded = !!expandedClusters[cluster.name];
                                    const activePicks = Array.from(new Set([...profileGenres, ...profileMicroGenres]));
                                    const selectedCount = cluster.tags.filter(tag => activePicks.includes(tag.label)).length;
                                    
                                    return (
                                      <div key={`master-genre-${cluster.name}-${cIdx}`} className="border border-zinc-900 rounded-xl bg-zinc-950/60 overflow-hidden">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setExpandedClusters(prev => ({ ...prev, [cluster.name]: !prev[cluster.name] }));
                                          }}
                                          className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-zinc-900/40 transition-colors cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-black uppercase text-zinc-300 tracking-wider font-mono">{cluster.name}</span>
                                            {selectedCount > 0 && (
                                              <span className="bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                                                {selectedCount} Selected
                                              </span>
                                            )}
                                          </div>
                                          {isExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                                          )}
                                        </button>
                                        
                                        {isExpanded && (
                                          <div className="p-3 bg-black/80 border-t border-zinc-900/80 flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
                                            {cluster.tags.map((tag, tIdx) => {
                                              const isSelected = activePicks.includes(tag.label);
                                              return (
                                                <button
                                                  key={tag.id ? `tag-${tag.id}-${tIdx}` : `tag-${tIdx}`}
                                                  type="button"
                                                  onClick={() => {
                                                    let nextList: string[];
                                                    if (isSelected) {
                                                      nextList = activePicks.filter(g => g !== tag.label);
                                                    } else {
                                                      nextList = [...activePicks, tag.label];
                                                    }
                                                    if (setProfileGenres) setProfileGenres(nextList);
                                                    if (setProfileMicroGenres) setProfileMicroGenres(nextList);
                                                    if (setUserProfile) {
                                                      setUserProfile((prev: any) => prev ? {
                                                        ...prev,
                                                        genres: nextList,
                                                        genre_tags: nextList,
                                                        profileGenres: nextList,
                                                        profileMicroGenres: nextList,
                                                        micro_genres: nextList
                                                      } : null);
                                                    }
                                                    if (selectedUserProfile?.isYou && setSelectedUserProfile) {
                                                      setSelectedUserProfile((prev: any) => prev ? {
                                                        ...prev,
                                                        genres: nextList,
                                                        genre_tags: nextList,
                                                        profileGenres: nextList,
                                                        profileMicroGenres: nextList,
                                                        micro_genres: nextList
                                                      } : null);
                                                    }
                                                  }}
                                                  className={`px-2 py-1 text-[8.5px] font-mono font-bold uppercase tracking-wider rounded border transition-all cursor-pointer ${
                                                    isSelected 
                                                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.3)]' 
                                                      : 'bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300 hover:border-zinc-750'
                                                  }`}
                                                >
                                                  {tag.label}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stealth Mode Toggle */}
                          <div className="pt-3 border-t border-zinc-900">
                            <label className="flex items-start justify-between gap-4 cursor-pointer">
                              <div className="flex-1">
                                <div className="text-xs font-black uppercase tracking-wider text-white">Stealth Mode (Incognito)</div>
                                <div className="text-[10px] text-zinc-500 leading-normal mt-0.5 font-medium">
                                  Hides your active "Check-In" status so you don't show up on public venue maps. Watch a set in peace without being tracked by the local feed.
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setProfileStealthMode(!profileStealthMode)}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${profileStealthMode ? 'bg-rose-600' : 'bg-zinc-800'}`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${profileStealthMode ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </label>
                          </div>

                          {/* Feed Content Filtering */}
                          <div className="pt-3 border-t border-zinc-900 space-y-3">
                            <div>
                              <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider font-display mb-0.5">Feed Content Filtering</h4>
                              <p className="text-[9px] text-zinc-500 leading-normal">Customize what automatically injects into your main timeline feed.</p>
                            </div>

                            <div className="space-y-3 pt-1">
                              {/* Filter 1 */}
                              <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                  <div className="text-xs font-bold text-zinc-300">Hide Ticket Presales</div>
                                  <div className="text-[9px] text-zinc-500 leading-none mt-0.5 font-medium">Mute ticket announcements and presales</div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setFilterHideTicketPresales(!filterHideTicketPresales)}
                                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${filterHideTicketPresales ? 'bg-rose-600' : 'bg-zinc-800'}`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${filterHideTicketPresales ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                              </label>

                              {/* Filter 2 */}
                              <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                  <div className="text-xs font-bold text-zinc-300">Show Merch Drops From Followed Only</div>
                                  <div className="text-[9px] text-zinc-500 leading-none mt-0.5 font-medium">Filter merch posts to followed acts only</div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setFilterShowMerchDropsOnlyFromFollowed(!filterShowMerchDropsOnlyFromFollowed)}
                                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${filterShowMerchDropsOnlyFromFollowed ? 'bg-rose-600' : 'bg-zinc-800'}`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${filterShowMerchDropsOnlyFromFollowed ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                              </label>

                              {/* Filter 3 */}
                              <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                  <div className="text-xs font-bold text-zinc-300">Followed Only Feed Filter</div>
                                  <div className="text-[9px] text-zinc-500 leading-none mt-0.5 font-medium">Hide posts from all un-followed channels</div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const nextVal = !filterShowFollowedOnly;
                                    setFilterShowFollowedOnly(nextVal);
                                    triggerNotification?.(nextVal ? "✨ Feed set to Followed Accounts only!" : "🌎 Feed set to show all community updates!");
                                  }}
                                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${filterShowFollowedOnly ? 'bg-rose-600' : 'bg-zinc-800'}`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${filterShowFollowedOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                              </label>
                            </div>
                          </div>

                          {/* System Preferences */}
                          <div className="pt-3 border-t border-zinc-900 space-y-3">
                            <div>
                              <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider font-display mb-0.5">System Preferences</h4>
                              <p className="text-[9px] text-zinc-500 leading-normal">Configure device-level connection permissions and push hooks.</p>
                            </div>

                            <div className="space-y-3 pt-1">
                              {/* Push Notifications */}
                              <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                  <div className="text-xs font-bold text-zinc-300">Push Notifications</div>
                                  <div className="text-[9px] text-zinc-500 leading-none mt-0.5 font-medium">Get alerts for new shows and merch drops</div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setPrefPushNotifications(!prefPushNotifications)}
                                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${prefPushNotifications ? 'bg-rose-600' : 'bg-zinc-800'}`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${prefPushNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                              </label>

                              {/* Location Services */}
                              <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                  <div className="text-xs font-bold text-zinc-300">Location Services</div>
                                  <div className="text-[9px] text-zinc-500 leading-none mt-0.5 font-medium">Used to find local gigs automatically</div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setPrefLocationServices(!prefLocationServices)}
                                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${prefLocationServices ? 'bg-rose-600' : 'bg-zinc-800'}`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${prefLocationServices ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                              </label>
                            </div>
                          </div>

                          {/* Profile Blurb / Bio (At Bottom of Settings) */}
                          <div className="pt-3 border-t border-zinc-900 space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] uppercase font-bold text-zinc-400">Profile Blurb / Bio</label>
                              <span className="text-[9px] font-mono font-bold text-zinc-500">{profileBlurb.length}/500</span>
                            </div>
                            <textarea 
                              maxLength={500}
                              value={profileBlurb}
                              onChange={(e) => {
                                const val = e.target.value.slice(0, 500);
                                setProfileBlurb(val);
                                if (setUserProfile) { setUserProfile((prev: any) => prev ? { ...prev, bio: val, profileBlurb: val } : null); }
                                if (selectedUserProfile?.isYou) { setSelectedUserProfile((prev: any) => prev ? { ...prev, bio: val, profileBlurb: val } : null); }
                              }}
                              rows={3}
                              placeholder="Write your short scene blurb..."
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-2.5 text-xs text-white placeholder-zinc-600 focus:border-rose-500 focus:outline-none resize-none font-medium"
                            />
                          </div>

                          {/* Save Button & Offline Indicator */}
                          <div className="pt-4 border-t border-zinc-900 space-y-3">
                            {/* Offline Save & Cache Sync Status Banner */}
                            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                              isOnline 
                                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-950/20 border-amber-500/20 text-amber-400'
                            }`}>
                              <div className="flex items-center gap-2">
                                {isOnline ? (
                                  <Wifi className="w-4 h-4 text-emerald-500 animate-pulse" />
                                ) : (
                                  <WifiOff className="w-4 h-4 text-amber-500 animate-pulse" />
                                )}
                                <div className="text-left">
                                  <p className="text-[10px] font-black uppercase tracking-wider leading-none">
                                    {isOnline ? 'Cloud Synced' : 'Offline Mode Active'}
                                  </p>
                                  <p className="text-[8px] font-mono opacity-80 mt-0.5 leading-none">
                                    {isOnline ? 'Changes auto-saved to secure nodes' : 'All inputs stored securely in offline sandbox'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-right font-mono text-[8px] opacity-75">
                                <Database className="w-3 h-3" />
                                <span>{lastOfflineSaveTime ? `Last write: ${lastOfflineSaveTime}` : 'Cache Standby'}</span>
                              </div>
                            </div>

                            <button 
                              onClick={() => {
                                setPinEntered('');
                                setPinError('');
                                setIsPinModalOpen(true);
                              }}
                              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors font-display shadow-lg shadow-rose-950/20"
                            >
                              Save Changes
                            </button>
                          </div>


                        </div>
                        )
                      )}
                      
                      {drawerCurrentView === 'payment' && (
                        <div className="space-y-4">
                          <PaymentMethodsSettings
                            userProfile={props.userProfile}
                            setUserProfile={props.setUserProfile}
                            triggerNotification={triggerNotification}
                          />
                        </div>
                      )}

                      {drawerCurrentView === 'vip' && (
                        (portalRole as any) === 'label' ? (
                          <div className="space-y-6 pb-8">
                            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                              <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest font-display">Loyalty Matrix Control</h3>
                              <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${(currentClearance as any) == 5 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse'}`}>
                                {(currentClearance as any) == 5 ? '🔑 LEVEL 5 OWNER' : '🔒 LEVEL 2 STAFF'}
                              </span>
                            </div>

                            {/* Program Toggle */}
                            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-white">Underground Loyalty Matrix</h4>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Let fans earn custom rewards, exclusive test pressings, and merch discounts.</p>
                              </div>
                              <button
                                type="button"
                                disabled={(currentClearance as any) < 4}
                                onClick={() => {
                                  setLoyaltyProgramEnabled(!loyaltyProgramEnabled);
                                  triggerNotification?.(loyaltyProgramEnabled ? "⚠️ Loyalty Program Suspended." : "✅ Loyalty Program Active!");
                                }}
                                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${loyaltyProgramEnabled ? 'bg-orange-500' : 'bg-zinc-800'}`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${loyaltyProgramEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                            </div>

                            {loyaltyProgramEnabled && (
                              <div className="space-y-4">
                                {/* Loyalty Config Multiplier */}
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Standard Point Multiplier</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={loyaltyPointMultiplier}
                                      onChange={(e) => setLoyaltyPointMultiplier(e.target.value.replace(/\D/g, ''))}
                                      disabled={(currentClearance as any) < 4}
                                      className="w-16 bg-zinc-950 border border-zinc-850 rounded-lg px-2 py-1.5 text-xs text-center font-mono font-bold text-white focus:border-orange-500 focus:outline-none disabled:opacity-50"
                                    />
                                    <span className="text-xs text-zinc-400">Points earned per $1 spent in your storefront.</span>
                                  </div>
                                </div>

                                {/* Custom Tiers list */}
                                <div className="space-y-2.5">
                                  <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase text-orange-400 tracking-wider font-mono">Custom Loyalty Tiers</h4>
                                    <span className="text-[9px] font-mono text-zinc-500">{loyaltyCustomTiers.length} Active Tiers</span>
                                  </div>

                                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {loyaltyCustomTiers.map((tier, trIdx) => (
                                      <div key={tier.id ? `tier-${tier.id}-${trIdx}` : `tier-${trIdx}`} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center justify-between gap-3">
                                        <div>
                                          <div className="text-xs font-black text-zinc-200 flex items-center gap-1.5">
                                            <Crown className="w-3.5 h-3.5 text-orange-400" />
                                            {tier.name}
                                          </div>
                                          <div className="text-[10px] text-zinc-400 mt-1">Reward: <span className="text-orange-400/90 font-medium">{tier.reward}</span></div>
                                          <div className="text-[8.5px] font-mono text-zinc-600 mt-0.5">Unlocks at: <span className="text-zinc-400 font-bold">{tier.points.toLocaleString()} PTS</span></div>
                                        </div>
                                        {(currentClearance as any) == 5 ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setLoyaltyCustomTiers(prev => prev.filter(t => t.id !== tier.id));
                                              triggerNotification?.(`❌ Tier "${tier.name}" deleted.`);
                                            }}
                                            className="text-zinc-600 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                            title="Delete Tier"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        ) : (
                                          <span className="text-[8px] font-mono text-zinc-650">Locked</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Add Custom Tier form */}
                                <div className="p-3.5 bg-zinc-950/20 border border-zinc-900/60 rounded-xl space-y-3">
                                  <h4 className="text-[9px] font-black uppercase text-zinc-400 tracking-wider font-mono">Create New Loyalty Milestone</h4>
                                  {(currentClearance as any) < 4 ? (
                                    <div className="text-[9px] font-mono text-red-400 bg-red-950/10 p-2 rounded border border-red-900/20">
                                      🔒 RESTRICTED: Owner clearance required to add/modify customer reward tiers.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="text"
                                          placeholder="Tier Name (e.g. Elite VIP)"
                                          value={newTierName}
                                          onChange={(e) => setNewTierName(e.target.value)}
                                          className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Points needed (e.g. 5000)"
                                          value={newTierPoints}
                                          onChange={(e) => setNewTierPoints(e.target.value.replace(/\D/g, ''))}
                                          className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none font-mono"
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        placeholder="Milestone Reward Description"
                                        value={newTierReward}
                                        onChange={(e) => setNewTierReward(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!newTierName || !newTierPoints || !newTierReward) {
                                            triggerNotification?.("⚠️ Fill out all tier parameters.");
                                            return;
                                          }
                                          const newTier = {
                                            id: Date.now(),
                                            name: newTierName,
                                            points: parseInt(newTierPoints) || 0,
                                            reward: newTierReward
                                          };
                                          setLoyaltyCustomTiers(prev => [...prev, newTier].sort((a,b) => a.points - b.points));
                                          triggerNotification?.(`✅ Added Tier "${newTierName}"!`);
                                          setNewTierName('');
                                          setNewTierPoints('');
                                          setNewTierReward('');
                                        }}
                                        className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                      >
                                        Deploy Loyalty Tier
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Back button */}
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => setDrawerCurrentView('root')}
                                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors font-display cursor-pointer"
                              >
                                Back to Control Panel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                          <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-2 font-display">VIP Club Status</h3>
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-zinc-400 font-bold">Tier 1: Scenester</span>
                              <span className="text-rose-400 font-bold">1,240 / 2,000 pts</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 w-[62%] rounded-full shadow-[0_0_8px_#f43f5e]" />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Tier 1 Block */}
                            <div className="p-3 bg-zinc-950/60 border border-rose-500/30 rounded-xl space-y-3 relative overflow-hidden">
                              <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-500/10 border-l border-b border-rose-500/20 rounded-bl-lg text-[8px] font-mono font-black text-rose-400 tracking-wider uppercase">
                                Active Tier
                              </div>
                              <div className="text-[10px] font-black uppercase text-rose-500 tracking-wider font-mono">
                                Tier 1: Scenester <span className="text-zinc-500">(0 - 1,999 pts)</span>
                              </div>
                              <div className="space-y-2.5">
                                <div className="flex gap-2.5 items-start">
                                  <Zap className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-bold text-white">Early Ticket Access</div>
                                    <div className="text-[10px] text-zinc-400">Buy 24h before public sale.</div>
                                  </div>
                                </div>
                                <div className="flex gap-2.5 items-start">
                                  <Tag className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-bold text-white">Merch Discounts</div>
                                    <div className="text-[10px] text-zinc-400">10% off at participating venues.</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tier 2 Block */}
                            <div className="p-3 bg-zinc-950/20 border border-zinc-900 rounded-xl space-y-3 opacity-60">
                              <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider font-mono flex items-center justify-between">
                                <span>Tier 2: Pit Crew <span className="text-zinc-650">(2,000 - 3,999 pts)</span></span>
                                <span className="text-[8px] uppercase tracking-widest bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded">Locked</span>
                              </div>
                              <div className="space-y-2.5">
                                <div className="flex gap-2.5 items-start">
                                  <Shield className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-bold text-zinc-300">Guest List Entry</div>
                                    <div className="text-[10px] text-zinc-500">Unlocks free guest spots for select dates.</div>
                                  </div>
                                </div>
                                <div className="flex gap-2.5 items-start">
                                  <Zap className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-bold text-zinc-300">⚡ Exclusive Demo Streams</div>
                                    <div className="text-[10px] text-zinc-500">Listen to pre-release band demos early.</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tier 3 Block */}
                            <div className="p-3 bg-zinc-950/10 border border-zinc-950 rounded-xl space-y-3 opacity-40">
                              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider font-mono flex items-center justify-between">
                                <span>Tier 3: Die-Hard <span className="text-zinc-700">(4,000+ pts)</span></span>
                                <span className="text-[8px] uppercase tracking-widest bg-zinc-950 text-zinc-650 px-1.5 py-0.5 rounded">Locked</span>
                              </div>
                              <div className="space-y-2.5">
                                <div className="flex gap-2.5 items-start">
                                  <Ticket className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-bold text-zinc-400">🎫 VIP Presale Access</div>
                                    <div className="text-[10px] text-zinc-500">Early access to limited run tickets before general admission.</div>
                                  </div>
                                </div>
                                <div className="flex gap-2.5 items-start">
                                  <Volume2 className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-bold text-zinc-400">🎸 Side-Stage Festival Access</div>
                                    <div className="text-[10px] text-zinc-500">Unlocks special viewing balconies at premium fests.</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* How to Earn Points Block */}
                          <div className="border-t border-zinc-800/60 pt-4 mt-2">
                            <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-wider font-mono mb-2.5 flex items-center gap-1.5">
                              🔥 HOW TO EARN SCENE POINTS
                            </h4>
                            <ul className="space-y-2 text-xs text-zinc-400">
                              <li className="flex items-start gap-2 bg-zinc-950/30 p-2 rounded-lg border border-zinc-900/40">
                                <span className="shrink-0 text-sm">🎟️</span>
                                <div>
                                  <span className="font-bold text-zinc-200">Native Ticketing:</span>
                                  <span className="text-rose-400 font-mono ml-1 font-bold">+50 Points</span> <span className="text-[10px] text-zinc-500">per ticket purchased.</span>
                                </div>
                              </li>
                              <li className="flex items-start gap-2 bg-zinc-950/30 p-2 rounded-lg border border-zinc-900/40">
                                <span className="shrink-0 text-sm">📦</span>
                                <div>
                                  <span className="font-bold text-zinc-200">Merch Catalog Store:</span>
                                  <span className="text-rose-400 font-mono ml-1 font-bold">+2 Points</span> <span className="text-[10px] text-zinc-500">per $1 spent on apparel/media.</span>
                                </div>
                              </li>
                              <li className="flex items-start gap-2 bg-zinc-950/30 p-2 rounded-lg border border-zinc-900/40">
                                <span className="shrink-0 text-sm">📍</span>
                                <div>
                                  <span className="font-bold text-zinc-200">Live Venue Check-In:</span>
                                  <span className="text-rose-400 font-mono ml-1 font-bold">+25 Points</span> <span className="text-[10px] text-zinc-500">for checking into an active show frame from the pit.</span>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                        )
                      )}

                      {drawerCurrentView === 'warehouse' && (
                        <div className="space-y-6 pb-8">
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                            <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest font-display">Warehouse Ledger</h3>
                            <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${(currentClearance as any) == 5 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse'}`}>
                              {(currentClearance as any) == 5 ? '🔑 LEVEL 5 OWNER' : '🔒 LEVEL 2 STAFF'}
                            </span>
                          </div>

                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Control catalog listings, customize stock trackers, and toggle public visibility for products on your label's storefront.
                          </p>

                          {/* Security warning if staff */}
                          {(currentClearance as any) < 4 && (
                            <div className="p-3.5 bg-red-950/10 border border-[#00ffcc]/30 text-red-400 rounded-xl text-[10px] leading-normal font-medium">
                              🔒 <strong>STAFF LOCK ACTIVE:</strong> Support staff accounts cannot edit prices, change stock numbers, toggle public visibility, or add new catalog listings.
                            </div>
                          )}

                          {/* Catalog list */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-orange-400 tracking-wider font-mono">Storefront Catalog</h4>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                              {shopItemsList.filter(item => {
                                const nameL = (item?.name || '').toLowerCase();
                                const descL = item.description.toLowerCase();
                                return (
                                  item.category === 'label' ||
                                  nameL.includes('tdf') ||
                                  nameL.includes('torture') ||
                                  nameL.includes('virulent excision') ||
                                  nameL.includes('heinous') ||
                                  item.brand?.toLowerCase() === 'torture' ||
                                  (item as any).isLabelProduct
                                );
                              }).map((rawItem, itIdx) => {
                                const item = rawItem as any;
                                return (
                                  <div key={item.id ? `item-${item.id}-${itIdx}` : `item-${itIdx}`} className={`p-3 bg-zinc-950/40 border rounded-xl flex flex-col gap-2.5 transition-colors ${item.hidden ? 'border-zinc-900/60 opacity-50' : 'border-zinc-850 hover:border-zinc-800'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                                          {item?.name}
                                          {item.hidden && <span className="text-[8px] font-mono font-bold bg-zinc-800 text-zinc-500 px-1.5 py-0.2 rounded">HIDDEN</span>}
                                        </div>
                                        <div className="text-[9px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">{item.subcategory || item.category}</div>
                                      </div>
                                      <button
                                        type="button"
                                        disabled={(currentClearance as any) < 4}
                                        onClick={() => {
                                          setShopItemsList(prev => prev.map((p: any) => p.id === item.id ? { ...p, hidden: !p.hidden } : p));
                                          triggerNotification?.(item.hidden ? `✅ Live on Store: "${item?.name}"` : `⚠️ Hidden from Store: "${item?.name}"`);
                                        }}
                                        className={`px-2 py-1 text-[9px] font-mono font-black rounded border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${item.hidden ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white' : 'bg-orange-950/20 border-orange-500/20 text-orange-400 hover:bg-orange-950/40'}`}
                                      >
                                        {item.hidden ? 'SHOW' : 'HIDE'}
                                      </button>
                                    </div>

                                    {/* Price and Stock Adjuster (Disabled for staff) */}
                                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-zinc-900">
                                      <div>
                                        <label className="text-[8px] uppercase tracking-wider font-mono text-zinc-500 block">List Price</label>
                                        <div className="relative mt-0.5">
                                          <span className="absolute left-2 top-1.5 text-zinc-500 text-[10px] font-mono">$</span>
                                          <input
                                            type="text"
                                            disabled={(currentClearance as any) < 4}
                                            value={String(item.price).replace('$', '')}
                                            onChange={(e) => {
                                              const val = e.target.value.replace(/[^0-9.]/g, '');
                                              setShopItemsList(prev => prev.map(p => p.id === item.id ? { ...p, price: parseFloat(val) || 0 } : p));
                                            }}
                                            className="w-full bg-zinc-950 border border-zinc-900 rounded px-5 py-1 text-[10px] text-white font-mono focus:border-orange-500 focus:outline-none disabled:opacity-50"
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-[8px] uppercase tracking-wider font-mono text-zinc-500 block">Stock Level Ticker</label>
                                        <input
                                          type="text"
                                          disabled={(currentClearance as any) < 4}
                                          value={item.stockAlert || item.stockLevel || 'IN STOCK'}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setShopItemsList(prev => prev.map(p => p.id === item.id ? { ...p, stockAlert: val, stockLevel: val } : p));
                                          }}
                                          className="w-full mt-0.5 bg-zinc-950 border border-zinc-900 rounded px-2 py-1 text-[10px] text-white font-mono focus:border-orange-500 focus:outline-none disabled:opacity-50"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Add Catalog Run Form */}
                          <div className="p-3.5 bg-zinc-950/20 border border-zinc-900/60 rounded-xl space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-orange-400 tracking-wider font-mono">Create Catalog Run</h4>
                            {(currentClearance as any) < 4 ? (
                              <div className="text-[9px] font-mono text-red-400 bg-red-950/10 p-2 rounded border border-red-900/20">
                                🔒 RESTRICTED: Owner clearance required to deploy new physical/digital catalog items.
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                <input
                                  type="text"
                                  placeholder="Catalog Item Title (e.g. TDF Hooded Zip-up)"
                                  value={newProdName}
                                  onChange={(e) => setNewProdName(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
                                />

                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Price in USD (e.g. 24.99)"
                                    value={newProdPrice}
                                    onChange={(e) => setNewProdPrice(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none font-mono"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Stock Ticker (e.g. ONLY 3 LEFT)"
                                    value={newProdStock}
                                    onChange={(e) => setNewProdStock(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none font-mono"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    value={newProdCategory}
                                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                                    className="bg-zinc-950 border border-zinc-850 rounded-lg px-2 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                                  >
                                    <option value="media">Physical Media</option>
                                    <option value="apparel">Apparel / Merch</option>
                                  </select>
                                  <select
                                    value={newProdSubcategory}
                                    onChange={(e) => setNewProdSubcategory(e.target.value)}
                                    className="bg-zinc-950 border border-zinc-850 rounded-lg px-2 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                                  >
                                    <option value="vinyl">Vinyl LP</option>
                                    <option value="cd">Compact Disc</option>
                                    <option value="cassette">Cassette Tape</option>
                                    <option value="shirt">T-Shirt</option>
                                    <option value="hoodie">Hoodie / Outerwear</option>
                                  </select>
                                </div>

                                <input
                                  type="text"
                                  placeholder="Short item description..."
                                  value={newProdDesc}
                                  onChange={(e) => setNewProdDesc(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
                                />

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newProdName || !newProdPrice) {
                                      triggerNotification?.("⚠️ Fill out name and price to deploy catalog run.");
                                      return;
                                    }
                                    const parsedPrice = parseFloat(newProdPrice.replace('$', '')) || 0;
                                    const newItem = {
                                      id: `shop_item_${Date.now()}`,
                                      name: newProdName,
                                      price: parsedPrice,
                                      description: newProdDesc || 'Official Torture Distro Catalog Run.',
                                      category: newProdCategory,
                                      subcategory: newProdSubcategory,
                                      stockLevel: newProdStock || 'IN STOCK',
                                      stockAlert: newProdStock || 'IN STOCK',
                                      brand: 'Torture',
                                      isLabelProduct: true,
                                      thumbnail: newProdCategory === 'media' ? 'https://images.unsplash.com/photo-1539628390156-b84721319288?auto=format&fit=crop&q=80&w=200' : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=200',
                                      fallbackThumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=200',
                                      condition: 'Mint',
                                      year: '2026',
                                      seller: 'Label',
                                      hidden: false
                                    };
                                    setShopItemsList(prev => [newItem as any, ...prev]);
                                    triggerNotification?.(`🚀 Successfully Deployed "${newProdName}" to Storefront!`);
                                    setNewProdName('');
                                    setNewProdPrice('');
                                    setNewProdDesc('');
                                    setNewProdStock('50');
                                  }}
                                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                >
                                  Deploy New Catalog Release
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Close button */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setDrawerCurrentView('root')}
                              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors font-display cursor-pointer"
                            >
                              Back to Control Panel
                            </button>
                          </div>
                        </div>
                      )}

                      {drawerCurrentView === 'security' && (
                        <div className="space-y-6 pb-8">
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-5 h-5 text-orange-400" />
                              <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest font-display">Security Access Matrix</h3>
                            </div>
                            <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                              {(currentClearance as any) == 5 && '🔑 LEVEL 5 OWNER'}
                              {(currentClearance as any) == 4 && '💼 LEVEL 4 PARTNER'}
                              {(currentClearance as any) == 3 && '📣 LEVEL 3 REP'}
                              {(currentClearance as any) == 2 && '🔒 LEVEL 2 STAFF'}
                              {(currentClearance as any) == 1 && '📱 LEVEL 1 TEMP'}
                            </span>
                          </div>

                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Configure active personnel credentials, toggle workspace clearance, and audit granular action permissions across the label.
                          </p>



                          {/* Search personnel */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider font-mono">Label Personnel Directory</h4>
                              <span className="text-[9px] font-mono text-zinc-500">{teamMembers.length} active members</span>
                            </div>

                            <div className="space-y-2.5">
                              {teamMembers.map((member, mIdx) => {
                                const isExpanded = expandedMemberId === member.id;
                                return (
                                  <div 
                                    key={member.id ? `team-member-${member.id}-${mIdx}` : `team-member-${mIdx}`} 
                                    className={`p-3.5 bg-zinc-950/40 border rounded-xl transition-all duration-200 ${isExpanded ? 'border-orange-500/30 bg-zinc-950/70' : 'border-zinc-900 hover:border-zinc-800'}`}
                                  >
                                    {/* Main row card click to expand */}
                                    <div 
                                      onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                                      className="flex items-center justify-between cursor-pointer select-none"
                                    >
                                      <div>
                                        <div className="text-xs font-black text-white flex items-center gap-2">
                                          {member?.name}
                                          {member.email === userProfile?.email && (
                                            <span className="text-[7px] font-mono font-bold bg-orange-950/40 text-orange-400 border border-orange-500/20 px-1 py-0.2 rounded">YOU</span>
                                          )}
                                        </div>
                                        <div className="text-[9.5px] text-zinc-400 mt-0.5">{member.role}</div>
                                        <div className="text-[8.5px] font-mono text-zinc-600 mt-0.5">{member.email}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded ${member.clearanceLevel === 5 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-zinc-850 text-zinc-400 border border-zinc-800'}`}>
                                          Lvl {member.clearanceLevel || 2} {member.clearanceLevel === 5 ? 'Owner' : member.clearanceLevel === 4 ? 'Partner' : member.clearanceLevel === 3 ? 'Rep' : member.clearanceLevel === 2 ? 'Staff' : 'Temp'}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-orange-400' : ''}`} />
                                      </div>
                                    </div>

                                    {/* Expanded granular options with toggles */}
                                    {isExpanded && (
                                      <div className="mt-4 pt-4 border-t border-zinc-900/80 space-y-3.5 animate-fade-in">
                                        {/* 5-Level Clearance switch */}
                                        <div className="flex flex-col gap-2 py-1 border-b border-zinc-900/40 pb-3">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <span className="text-[9.5px] font-bold text-white uppercase tracking-wider block">Security Clearance Level</span>
                                              <span className="text-[8.5px] text-zinc-550 font-mono">Assign dynamic clearance (Levels 1 - 5)</span>
                                            </div>
                                            <span className="text-[9px] font-black uppercase text-orange-400 bg-orange-950/40 border border-orange-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                                              Level {member.clearanceLevel || 2}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-950 border border-zinc-900 rounded-lg">
                                            {[1, 2, 3, 4, 5].map((lvl) => {
                                              const isLvlSelected = (member.clearanceLevel || 2) === lvl;
                                              const levelNames: Record<number, string> = {
                                                1: 'Temp Asst',
                                                2: 'Hired Staff',
                                                3: 'Label Rep',
                                                4: 'Partner',
                                                5: 'Owner'
                                              };
                                              return (
                                                <button
                                                  key={`member-${member.id || 'idx'}-lvl-${lvl}`}
                                                  type="button"
                                                  onClick={() => {
                                                    setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, clearanceLevel: lvl } : m));
                                                    triggerNotification?.(`🛡️ Re-assigned ${member?.name} to Level ${lvl} (${levelNames[lvl]}).`);
                                                  }}
                                                  className={`py-1.5 text-[8.5px] font-black uppercase rounded transition-all cursor-pointer flex flex-col items-center justify-center ${isLvlSelected ? 'bg-orange-600 text-white font-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                >
                                                  <span>Lvl {lvl}</span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        <div className="text-[9px] uppercase font-black tracking-wider text-orange-400/80 font-mono mb-2">Granular Portal Toggles</div>

                                        {/* Toggle: View Analytics */}
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <span className="text-[9px] font-bold text-zinc-250 block">View Financials & Analytics</span>
                                            <span className="text-[8px] text-zinc-550 font-mono">Access royalties, payouts, and revenue reporting.</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTeamMembers(prev => prev.map(m => m.id === member.id ? { 
                                                ...m, 
                                                permissions: { ...m.permissions, canViewAnalytics: !m.permissions.canViewAnalytics } 
                                              } : m));
                                              triggerNotification?.(`🔄 Updated permissions for ${member?.name}`);
                                            }}
                                            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${member.permissions.canViewAnalytics ? 'bg-orange-500' : 'bg-zinc-800'}`}
                                          >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${member.permissions.canViewAnalytics ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                          </button>
                                        </div>

                                        {/* Toggle: Edit Product Prices */}
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <span className="text-[9px] font-bold text-zinc-250 block">Modify Listing Prices</span>
                                            <span className="text-[8px] text-zinc-550 font-mono">Allow price tuning and currency conversion logs.</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTeamMembers(prev => prev.map(m => m.id === member.id ? { 
                                                ...m, 
                                                permissions: { ...m.permissions, canEditPrices: !m.permissions.canEditPrices } 
                                              } : m));
                                              triggerNotification?.(`🔄 Updated permissions for ${member?.name}`);
                                            }}
                                            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${member.permissions.canEditPrices ? 'bg-orange-500' : 'bg-zinc-800'}`}
                                          >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${member.permissions.canEditPrices ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                          </button>
                                        </div>

                                        {/* Toggle: Manage Physical Releases */}
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <span className="text-[9px] font-bold text-zinc-250 block">Manage Master Warehouse Runs</span>
                                            <span className="text-[8px] text-zinc-550 font-mono">Add new physical items, LP runs, and restock bands.</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTeamMembers(prev => prev.map(m => m.id === member.id ? { 
                                                ...m, 
                                                permissions: { ...m.permissions, canManageReleases: !m.permissions.canManageReleases } 
                                              } : m));
                                              triggerNotification?.(`🔄 Updated permissions for ${member?.name}`);
                                            }}
                                            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${member.permissions.canManageReleases ? 'bg-orange-500' : 'bg-zinc-800'}`}
                                          >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${member.permissions.canManageReleases ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                          </button>
                                        </div>

                                        {/* Toggle: Access Royalties Ledger */}
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <span className="text-[9px] font-bold text-zinc-250 block">Access Royalties Ledger</span>
                                            <span className="text-[8px] text-zinc-550 font-mono">Tweak split rates and compile smart contract sheets.</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTeamMembers(prev => prev.map(m => m.id === member.id ? { 
                                                ...m, 
                                                permissions: { ...m.permissions, canAccessRoyalties: !m.permissions.canAccessRoyalties } 
                                              } : m));
                                              triggerNotification?.(`🔄 Updated permissions for ${member?.name}`);
                                            }}
                                            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${member.permissions.canAccessRoyalties ? 'bg-orange-500' : 'bg-zinc-800'}`}
                                          >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${member.permissions.canAccessRoyalties ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                          </button>
                                        </div>

                                        {/* Toggle: Toggle Public Visibility */}
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <span className="text-[9px] font-bold text-zinc-250 block">Toggle Product Visibility</span>
                                            <span className="text-[8px] text-zinc-550 font-mono">Hide or show catalog items live on storefront.</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTeamMembers(prev => prev.map(m => m.id === member.id ? { 
                                                ...m, 
                                                permissions: { ...m.permissions, canToggleVisibility: !m.permissions.canToggleVisibility } 
                                              } : m));
                                              triggerNotification?.(`🔄 Updated permissions for ${member?.name}`);
                                            }}
                                            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${member.permissions.canToggleVisibility ? 'bg-orange-500' : 'bg-zinc-800'}`}
                                          >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${member.permissions.canToggleVisibility ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Back button */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setDrawerCurrentView('root')}
                              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors font-display cursor-pointer"
                            >
                              Back to Control Panel
                            </button>
                          </div>
                        </div>
                      )}

                      {drawerCurrentView === 'collections' && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-4">My Collections</h3>
                          <div className="mx-0 my-4 p-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl grid grid-cols-2 gap-1.5 shadow-inner">
                            <button
                              type="button"
                              onClick={() => setCollectionTab('tickets')}
                              className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                                collectionTab === 'tickets'
                                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50'
                                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                              }`}
                            >
                              <Ticket className={collectionTab === 'tickets' ? 'text-cyan-400' : 'text-zinc-500'} size={14}/>
                              <span>Tickets</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCollectionTab('music')}
                              className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                                collectionTab === 'music'
                                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50'
                                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                              }`}
                            >
                              <Disc className={collectionTab === 'music' ? 'text-cyan-400' : 'text-zinc-500'} size={14}/>
                              <span>Music</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCollectionTab('merch')}
                              className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                                collectionTab === 'merch'
                                  ? 'bg-purple-950/50 text-purple-300 border border-purple-800/60 shadow-md'
                                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                              }`}
                            >
                              <Shirt className={collectionTab === 'merch' ? 'text-purple-400' : 'text-zinc-500'} size={14}/>
                              <span>Merch</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCollectionTab('for_sale')}
                              className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                                collectionTab === 'for_sale'
                                  ? 'bg-red-950/40 text-red-400 border border-red-800/60 shadow-md'
                                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                              }`}
                            >
                              <Tag className={collectionTab === 'for_sale' ? 'text-red-400' : 'text-zinc-500'} size={14}/>
                              <span>For Sale</span>
                            </button>
                          </div>
                          
                           <div className="space-y-3 pt-2">
                            {collectionTab === 'music' ? (
                              (() => {
                                const musicItems = myCollections.filter(item => item.type === 'music');
                                if (musicItems.length === 0) {
                                  return (
                                    <div className="text-center py-8 text-zinc-500 text-sm font-mono uppercase">
                                      No music in your collection yet.
                                    </div>
                                  );
                                }

                                const activeMusicItem = musicItems.find(item => item.id === collPlayerActiveId) || musicItems[0];
                                
                                // Mock some tracks for the active album
                                const tracks = [
                                  { id: `${activeMusicItem.id}_t1`, title: '01. ' + (activeMusicItem.data.title || activeMusicItem.data.name) + ' (Original Mix)' },
                                  { id: `${activeMusicItem.id}_t2`, title: '02. Midnight Shadows (Instrumental Mix)' },
                                  { id: `${activeMusicItem.id}_t3`, title: '03. Echoes from the Scene (Live Edit)' },
                                  { id: `${activeMusicItem.id}_t4`, title: '04. Crypt of Agony (Ambient Outro)' }
                                ];

                                const activeTrack = tracks.find(t => t.id === collPlayerActiveTrackId) || tracks[0];
                                const trackDuration = getCollectionsTrackDuration(activeTrack.id);

                                return (
                                  <div className="space-y-5 animate-in fade-in duration-300">
                                    {/* SKEUOMORPHIC PREMIUM MUSIC PLAYER DECK */}
                                    <div className="bg-zinc-950 border border-rose-900/40 shadow-[0_0_20px_rgba(244,63,94,0.1)] rounded-2xl p-4 space-y-4">
                                      <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                                        <div className="flex items-center gap-2">
                                          <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                                          <h3 className="text-xs font-mono font-black text-zinc-100 uppercase tracking-widest">Premium Music Player</h3>
                                        </div>
                                        <span className="text-[7.5px] font-mono bg-[#000000] px-2 py-0.5 border border-[#1A1A1A] text-zinc-400 uppercase rounded">STUDIO HI-FI MATRIX</span>
                                      </div>

                                      {/* SKEUOMORPHIC GRID */}
                                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                        {/* OFFICIAL ALBUM COVER ART */}
                                        <div className="sm:col-span-4 flex justify-center">
                                          <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center group">
                                            {/* Glow Behind */}
                                            <div 
                                              className="absolute inset-0 bg-rose-500/10 rounded-2xl blur-xl transition-opacity duration-500" 
                                              style={{ opacity: collPlayerIsPlaying ? 0.7 : 0.2 }} 
                                            />
                                            
                                            {activeMusicItem.data.thumbnail || activeMusicItem.data.coverUrl || activeMusicItem.data.image ? (
                                              <img 
                                                src={activeMusicItem.data.thumbnail || activeMusicItem.data.coverUrl || activeMusicItem.data.image} 
                                                alt={activeMusicItem.data.title || activeMusicItem.data.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                referrerPolicy="no-referrer"
                                              />
                                            ) : (
                                              <div className="flex flex-col items-center justify-center p-2 text-center">
                                                <Disc className="w-8 h-8 text-rose-500 mb-1 opacity-80" />
                                                <span className="text-[7.5px] font-mono font-bold text-zinc-300 uppercase">OFFICIAL COVER</span>
                                              </div>
                                            )}

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />

                                            {/* Bottom Badges */}
                                            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                                              <span className="px-1 py-0.2 rounded bg-black/80 backdrop-blur-md border border-zinc-800 text-[6.5px] font-mono text-rose-400 uppercase tracking-widest font-bold truncate max-w-[70px]">
                                                {activeMusicItem.data.band || activeMusicItem.data.artist || 'NEXUS'}
                                              </span>
                                              <span className="px-1 py-0.2 rounded bg-black/80 backdrop-blur-md border border-zinc-800 text-[6px] font-mono text-zinc-400 uppercase font-bold">
                                                HI-FI
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* METADATA, VISUALIZER & CONTROLS */}
                                        <div className="sm:col-span-8 flex flex-col items-center text-center space-y-2.5">
                                          {/* Meta info */}
                                          <div className="space-y-1 w-full flex flex-col items-center">
                                            <div className="flex items-center gap-1.5 justify-center w-full">
                                              <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest font-black font-semibold">ACTIVE DECK STEREO</span>
                                              <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-mono uppercase font-black tracking-widest flex items-center gap-1 ${collPlayerIsPlaying ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' : 'bg-zinc-900 text-zinc-500 border border-zinc-850'}`}>
                                                <span className={`w-1 h-1 rounded-full ${collPlayerIsPlaying ? 'bg-rose-500 animate-ping' : 'bg-zinc-600'}`} />
                                                {collPlayerIsPlaying ? 'PLAYING' : 'PAUSED'}
                                              </span>
                                            </div>

                                            {/* Track Title Container */}
                                            <div className="w-full h-7 flex items-center justify-center bg-black/60 px-2.5 rounded-lg border border-zinc-900 max-w-xs mx-auto">
                                              <span className="font-mono font-black text-[10px] uppercase tracking-wider text-rose-400 text-center truncate">
                                                {activeTrack.title}
                                              </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 text-[8px] font-mono text-zinc-500 w-full max-w-xs mx-auto">
                                              <span>ARTIST: <span className="text-zinc-400 font-bold uppercase">{activeMusicItem.data.band || activeMusicItem.data.artist || 'UNKNOWN'}</span></span>
                                              
                                              {/* Star Rating */}
                                              <div className="flex items-center gap-0.5 bg-black/40 border border-zinc-900 px-1.5 py-0.5 rounded-lg">
                                                {[1, 2, 3, 4, 5].map((star, sIdx) => {
                                                  const rating = collPlayerRatings[activeMusicItem.id] || 0;
                                                  return (
                                                    <button
                                                      key={`music-star-${activeMusicItem.id}-${star}-${sIdx}`}
                                                      type="button"
                                                      onClick={() => {
                                                        setCollPlayerRatings(prev => ({ ...prev, [activeMusicItem.id]: star }));
                                                        triggerNotification?.(`Rated "${activeMusicItem.data.title || activeMusicItem.data.name}" ${star} Stars`);
                                                      }}
                                                      className="hover:scale-110 transition-transform cursor-pointer"
                                                    >
                                                      <Star className={`w-2.5 h-2.5 ${star <= rating ? 'fill-rose-400 text-rose-400' : 'text-zinc-700'}`} />
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Equalizer bars */}
                                          <div className="h-3 flex items-end justify-center gap-0.5 overflow-hidden border-b border-zinc-900/40 pb-0.5 w-full max-w-xs mx-auto">
                                            {Array.from({ length: 24 }).map((_, idx) => (
                                              <div
                                                key={`eq-bar-${activeMusicItem.id}-${idx}`}
                                                className={`flex-1 rounded-t-sm transition-all duration-300 ${collPlayerIsPlaying ? 'bg-rose-500' : 'bg-zinc-850'}`}
                                                style={{ height: `${collPlayerIsPlaying ? Math.floor(15 + Math.random() * 85) : 10}%` }}
                                              />
                                            ))}
                                          </div>

                                          {/* Track length progress bar */}
                                          <div className="space-y-1 w-full max-w-xs mx-auto">
                                            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 font-bold">
                                              <span>{Math.floor(collPlayerProgress / 30)}:{(collPlayerProgress % 30 * 2).toString().padStart(2, '0')}</span>
                                              
                                              <div className="flex items-center gap-1 text-[7px]">
                                                 <span className="px-1 py-0.2 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black">[ LOSSLESS 24-BIT ]</span>
                                              </div>

                                              <span>{trackDuration}</span>
                                            </div>
                                            <div 
                                              className="h-1 bg-black rounded-full overflow-hidden cursor-pointer border border-zinc-900 relative"
                                              onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const clickX = e.clientX - rect.left;
                                                const percent = Math.round((clickX / rect.width) * 100);
                                                setCollPlayerProgress(Math.min(100, Math.max(0, percent)));
                                              }}
                                            >
                                              <div 
                                                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-300" 
                                                style={{ width: `${collPlayerProgress}%` }} 
                                              />
                                            </div>
                                          </div>

                                          {/* Controls & Volume */}
                                          <div className="flex items-center justify-between gap-4 pt-1 w-full max-w-xs mx-auto">
                                            {/* Audio controls */}
                                            <div className="flex items-center gap-2">
                                              <button 
                                                type="button"
                                                onClick={() => {
                                                  const currIdx = tracks.findIndex(t => t.id === activeTrack.id);
                                                  const prevIdx = (currIdx - 1 + tracks.length) % tracks.length;
                                                  setCollPlayerActiveTrackId(tracks[prevIdx].id);
                                                  setCollPlayerProgress(0);
                                                  setCollPlayerIsPlaying(true);
                                                }}
                                                className="p-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all active:scale-90"
                                                title="Previous Track"
                                              >
                                                <SkipBack className="w-3.5 h-3.5" />
                                              </button>

                                              <button 
                                                type="button"
                                                onClick={() => setCollPlayerIsPlaying(!collPlayerIsPlaying)} 
                                                className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-all active:scale-95 flex items-center justify-center shadow-md shadow-rose-950/40"
                                                title={collPlayerIsPlaying ? "Pause" : "Play"}
                                              >
                                                {collPlayerIsPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                              </button>

                                              <button 
                                                type="button"
                                                onClick={() => { 
                                                  setCollPlayerIsPlaying(false); 
                                                  setCollPlayerProgress(0); 
                                                }} 
                                                className="p-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all active:scale-90"
                                                title="Stop"
                                              >
                                                <Square className="w-3.5 h-3.5" />
                                              </button>

                                              <button 
                                                type="button"
                                                onClick={() => {
                                                  const currIdx = tracks.findIndex(t => t.id === activeTrack.id);
                                                  const nextIdx = (currIdx + 1) % tracks.length;
                                                  setCollPlayerActiveTrackId(tracks[nextIdx].id);
                                                  setCollPlayerProgress(0);
                                                  setCollPlayerIsPlaying(true);
                                                }}
                                                className="p-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all active:scale-90"
                                                title="Next Track"
                                              >
                                                <SkipForward className="w-3.5 h-3.5" />
                                              </button>
                                            </div>

                                            {/* Volume bar */}
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-black border border-zinc-900 rounded-lg w-28">
                                              <Volume2 className="w-3 h-3 text-zinc-550 shrink-0" />
                                              <input 
                                                type="range" 
                                                min="0" 
                                                max="1" 
                                                step="0.05" 
                                                value={collPlayerVolume} 
                                                onChange={(e) => setCollPlayerVolume(Number(e.target.value))} 
                                                className="w-14 accent-rose-500 h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer" 
                                              />
                                              <span className="text-[8px] text-zinc-500 font-mono w-5 text-right shrink-0">{Math.round(collPlayerVolume * 100)}%</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* TRACKS LIST */}
                                      <div className="border-t border-zinc-900/80 pt-2.5">
                                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black mb-1.5 pl-1">TRACK LIST:</div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                          {tracks.map((track, trkIdx) => {
                                            const isCurrent = track.id === activeTrack.id;
                                            const duration = getCollectionsTrackDuration(track.id);
                                            return (
                                              <div 
                                                key={track.id ? `trk-${track.id}-${trkIdx}` : `trk-${trkIdx}`} 
                                                onClick={() => {
                                                  setCollPlayerActiveTrackId(track.id);
                                                  setCollPlayerProgress(0);
                                                  setCollPlayerIsPlaying(true);
                                                }}
                                                className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${isCurrent ? 'bg-rose-500/10 border-rose-600/60 text-white shadow-[0_0_12px_rgba(239,68,68,0.15)]' : 'bg-black/40 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[8px] font-bold ${isCurrent ? 'bg-rose-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500'}`}>
                                                    {isCurrent && collPlayerIsPlaying ? <Pause className="w-2 h-2" /> : <Play className="w-2 h-2 ml-0.5" />}
                                                  </span>
                                                  <span className={`text-[10px] font-mono uppercase tracking-wide truncate block ${isCurrent ? 'text-white font-bold' : 'text-zinc-300'}`}>{track.title}</span>
                                                </div>
                                                <span className="text-[9px] font-mono font-medium text-zinc-500 shrink-0">{duration}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    {/* LIST OF PURCHASED RELEASES AS INDIVIDUAL CARDS */}
                                    <div className="space-y-2.5">
                                      <div className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2 font-mono">
                                        <Library className="w-4 h-4 text-rose-500" /> Purchased Releases ({musicItems.length})
                                      </div>
                                      <div className="grid grid-cols-1 gap-3">
                                        {musicItems.map((item, mIdx) => {
                                          const isActive = item.id === activeMusicItem.id;
                                          return (
                                            <div 
                                              key={item.id ? `item-${item.id}-${mIdx}` : `item-${mIdx}`} 
                                              onClick={() => {
                                                setCollPlayerActiveId(item.id);
                                                setCollPlayerActiveTrackId(`${item.id}_t1`);
                                                setCollPlayerProgress(0);
                                                setCollPlayerIsPlaying(true);
                                                triggerNotification?.(`Loaded ${item.data.title || item.data.name} into playback deck.`);
                                              }}
                                              className={`bg-[#0c0d10] border rounded-xl overflow-hidden relative cursor-pointer group transition-all duration-300 ${isActive ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30' : 'border-zinc-850 hover:border-zinc-700'}`}
                                            >
                                              <div className={`absolute top-0 right-0 w-20 h-20 bg-rose-500/5 blur-xl rounded-full pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                              
                                              <div className="p-3.5 relative z-10 flex gap-4 items-center">
                                                <div className="w-16 h-16 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden relative shadow-lg shadow-black/40">
                                                  {item.data.thumbnail ? (
                                                    <img src={item.data.thumbnail} alt={item.data.title || item.data.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                  ) : (
                                                    <Disc className="w-7 h-7 text-zinc-500" />
                                                  )}
                                                  
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center shadow-lg shadow-black/50">
                                                      <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black">STUDIO LP</span>
                                                    {isActive && (
                                                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[7px] font-mono px-1.5 py-0.2 rounded uppercase font-black tracking-widest animate-pulse font-bold">DECK LOADED</span>
                                                    )}
                                                  </div>
                                                  <h4 className="text-sm font-bold text-white truncate leading-tight mt-0.5">{item.data.title || item.data.name}</h4>
                                                  <p className="text-xs text-rose-400 mt-0.5 truncate font-semibold uppercase">{item.data.band || item.data.artist || 'Unknown Artist'}</p>
                                                  
                                                  <div className="flex items-center gap-2 mt-2 text-[9px] font-mono text-zinc-500">
                                                    <span>PURCHASED: {new Date(item.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5 text-rose-500" /> Hi-Res WAV</span>
                                                  </div>
                                                </div>

                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    triggerNotification?.(`Downloading HD lossless audio bundle for "${item.data.title || item.data.name}"...`);
                                                  }}
                                                  className="w-8 h-8 rounded-full border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-rose-400 flex items-center justify-center hover:bg-zinc-900 transition-all active:scale-90 shadow-md"
                                                  title="Download WAV Bundle"
                                                >
                                                  <Download className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              (() => {
                                const filteredItems = myCollections.filter(item => {
                                  if (collectionTab === 'tickets') return item.type === 'ticket';
                                  if (collectionTab === 'merch') return item.type === 'merch' && !item.data?.isForSale && !(item as any).forSale;
                                  if (collectionTab === 'for_sale') return (item as any).forSale || item.data?.isForSale || item.data?.forSale;
                                  return item.type === 'merch';
                                });
                                
                                return (
                                  <div className="space-y-4">
                                    {collectionTab === 'for_sale' && (
                                      <button
                                        onClick={() => setShowAddItemModal(true)}
                                        className="w-full py-3 bg-red-950/20 border border-red-900/50 hover:bg-red-900/40 hover:border-red-500/50 rounded-xl flex flex-col items-center justify-center gap-1 text-red-400 transition-all group shadow-inner"
                                      >
                                        <div className="bg-red-500/20 p-2 rounded-full group-hover:scale-110 transition-transform">
                                          <Plus className="w-5 h-5 text-red-400" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest mt-1">Add New Item</span>
                                      </button>
                                    )}

                                    {filteredItems.length === 0 ? (
                                      <div className="text-center py-10 bg-zinc-950/40 border border-zinc-900/50 rounded-xl">
                                        <div className="flex justify-center mb-3 opacity-50">
                                          {collectionTab === 'tickets' ? <Ticket size={32} className="text-zinc-500" /> : <Tag size={32} className="text-zinc-500" />}
                                        </div>
                                        <div className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-1">
                                          No {collectionTab.replace('_', ' ')} yet
                                        </div>
                                        <div className="text-zinc-600 text-xs px-6">
                                          {collectionTab === 'for_sale' 
                                            ? "List items from your collection to sell to other fans."
                                            : "Items you collect will appear here."}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {filteredItems.map((item, fIdx) => (
                                          <div key={item.id ? `merch-item-${item.id}-${fIdx}` : `merch-item-${fIdx}`} className="bg-[#121214] border border-zinc-800 hover:border-zinc-700 transition-colors rounded-xl overflow-hidden relative cursor-pointer" onClick={() => {
                                            if (item.type === 'ticket' || item.type === 'merch') {
                                              setViewingReceipt(item);
                                            }
                                          }}>
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-xl rounded-full pointer-events-none" />
                                            <div className="p-4 relative z-10">
                                              {item.type === 'ticket' && (
                                                <>
                                                  {item.data.isListedForResale && (
                                                    <div className="absolute top-2 right-2 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-0.5 text-[9px] font-mono text-amber-400 font-bold uppercase animate-pulse">
                                                      Resale Listed (${item.data.resellPrice?.toFixed(2)})
                                                    </div>
                                                  )}
                                                  <div className="flex gap-4 mb-3">
                                                    <div className="w-12 h-12 bg-zinc-900 rounded-lg flex flex-col items-center justify-center shrink-0 border border-zinc-800">
                                                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(item.date).toLocaleString('default', { month: 'short' })}</span>
                                                      <span className="text-lg font-black text-white">{new Date(item.date).getDate()}</span>
                                                    </div>
                                                    <div>
                                                      <div className="text-sm font-bold text-white uppercase tracking-wide">{item.data.headliner || item.data.name}</div>
                                                      <div className="text-xs text-zinc-400 mt-0.5 font-mono">{item.data.venue} • {item.data.time || '8:00 PM'}</div>
                                                      <div className="mt-2 text-rose-500 text-[10px] font-mono tracking-widest uppercase flex items-center gap-1">
                                                        <Ticket className="w-3 h-3" /> Admit {item.quantity}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="border-t border-dashed border-zinc-800 bg-white p-3 flex flex-col items-center mt-2 rounded-b-lg">
                                                    <Barcode 
                                                      value={`TKT-${item.id.slice(-6).toUpperCase()}`} 
                                                      format="CODE128" 
                                                      width={1.2} 
                                                      height={26} 
                                                      displayValue={false} 
                                                      background="transparent" 
                                                      lineColor="#000000" 
                                                    />
                                                    <span className="text-[7px] font-mono text-zinc-500 tracking-[0.25em] font-bold mt-0.5">
                                                      *TKT-{item.id.slice(-6).toUpperCase()}*
                                                    </span>
                                                  </div>
                                                </>
                                              )}
                                              {item.type === 'merch' && (
                                                <div className="flex gap-4 items-center">
                                                  <div className="w-16 h-16 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {item.data.thumbnail ? (
                                                      <img src={item.data.thumbnail} alt={item.data.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                      <ShoppingBag className="w-6 h-6 text-zinc-500" />
                                                    )}
                                                  </div>
                                                  <div className="flex-1">
                                                    <div className="text-sm font-bold text-white leading-tight">{item.data.name}</div>
                                                    <div className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-mono">Qty: {item.quantity} • Receipt #{item.id.slice(-6)}</div>
                                                    {collectionTab === 'for_sale' && item.data.price && (
                                                      <div className="text-xs font-bold text-emerald-400 mt-1">${item.data.price.toFixed(2)}</div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      )}

                      {drawerCurrentView === 'following' && (() => {
                        const activeFollowed = discoverProfiles.filter(p => {
                          if (!p.followed) return false;
                          if (followingSearchQuery !== '') {
                            return (p?.name || "User").toLowerCase().includes(followingSearchQuery.toLowerCase());
                          }
                          return p.category === followingActiveTab;
                        });
                        const activeSuggested = discoverProfiles.filter(p => {
                          if (p.followed) return false;
                          if (followingSearchQuery !== '') {
                            return (p?.name || "User").toLowerCase().includes(followingSearchQuery.toLowerCase());
                          }
                          return p.category === followingActiveTab;
                        });

                        const toggleNotifications = (profileId: string, name: string) => {
                          setDiscoverProfiles(prev => prev.map(p => {
                            if (p.id === profileId) {
                              const nextVal = !p.notificationsEnabled;
                              triggerNotification?.(nextVal ? `🔔 Notifications enabled for ${name}!` : `🔕 Muted notifications for ${name}.`);
                              return { ...p, notificationsEnabled: nextVal };
                            }
                            return p;
                          }));
                        };

                        const toggleFollowProfile = (profileId: string, name: string) => {
                          handleFollowProfile(name);
                        };

                        const toggleCategoryAlerts = () => {
                          const allActive = activeFollowed.every(p => p.notificationsEnabled);
                          setDiscoverProfiles(prev => prev.map(p => {
                            if (p.category === followingActiveTab && p.followed) {
                              return { ...p, notificationsEnabled: !allActive };
                            }
                            return p;
                          }));
                          triggerNotification?.(allActive 
                            ? `🔕 Muted all alert notifications for this section.` 
                            : `🔔 Enabled real-time alert notifications for all followed profiles here!`
                          );
                        };

                        const getLiveStatus = (profile: any) => {
                          if (profile.category === 'bands') {
                            const mod = profile?.name.length % 3;
                            if (mod === 0) return { label: '🔴 LIVE SHOW TONIGHT', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20' };
                            if (mod === 1) return { label: '💿 IN THE STUDIO', color: 'text-amber-400 bg-amber-950/20 border-amber-500/20' };
                            return { label: '🤘 ACTIVE ONLINE', color: 'text-rose-400 bg-rose-950/20 border-rose-500/20' };
                          }
                          if (profile.category === 'venues') {
                            const mod = profile?.name.length % 3;
                            if (mod === 0) return { label: '🎫 GIG TONIGHT', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20' };
                            if (mod === 1) return { label: '🏟️ AUDITIONS OPEN', color: 'text-amber-400 bg-amber-950/20 border-amber-500/20' };
                            return { label: '🛑 SOLD OUT GIG', color: 'text-zinc-500 bg-zinc-950/40 border-zinc-800/20' };
                          }
                          if (profile.category === 'creatives') {
                            const mod = profile?.name.length % 2;
                            if (mod === 0) return { label: '🎨 COMMISSIONS OPEN', color: 'text-fuchsia-400 bg-fuchsia-950/20 border-fuchsia-500/20' };
                            return { label: '⚡ NEW ART RELEASED', color: 'text-rose-400 bg-rose-950/20 border-rose-500/20' };
                          }
                          if (profile.category === 'labels') {
                            const mod = profile?.name.length % 2;
                            if (mod === 0) return { label: '💿 NEW RELEASES', color: 'text-orange-400 bg-orange-950/20 border-orange-500/20' };
                            return { label: '📦 SHIPS WORLDWIDE', color: 'text-zinc-400 bg-zinc-950/20 border-zinc-800/20' };
                          }
                          const mod = profile?.name.length % 3;
                          if (mod === 0) return { label: '🔥 IN THE PIT', color: 'text-rose-400 bg-rose-950/20 border-rose-500/20' };
                          if (mod === 1) return { label: '🎸 JAMMING', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20' };
                          return { label: '💤 OFFLINE', color: 'text-zinc-600 bg-zinc-950/20 border-zinc-900/30' };
                        };

                        const activeCategoryCount = (cat: 'bands' | 'venues' | 'creatives' | 'labels' | 'friends') => {
                          return discoverProfiles.filter(p => p.followed && p.category === cat).length;
                        };

                        return (
                          <div className="space-y-4 animate-in fade-in duration-200">
                            <div>
                              <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest font-display">Following Lists</h3>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Manage your circles and alert feeds in real-time</p>
                            </div>

                            {/* Search bar */}
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                              <input 
                                type="text"
                                placeholder={`Search followed...`}
                                value={followingSearchQuery}
                                onChange={(e) => setFollowingSearchQuery(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 pl-9 pr-8 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono placeholder:text-zinc-600"
                              />
                              {followingSearchQuery && (
                                <button 
                                  onClick={() => setFollowingSearchQuery('')}
                                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Multi-row Grid Layout for Instant Category Tab Visibility */}
                            <div className="grid grid-cols-6 gap-1 shrink-0 bg-zinc-950/40 p-1 border border-zinc-900 rounded-xl">
                              {/* Row 1: Bands & Venues (each spanning 3 columns out of 6) */}
                              <button 
                                onClick={() => setFollowingActiveTab('bands')}
                                className={`col-span-3 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-between gap-1.5 border ${followingActiveTab === 'bands' ? 'bg-rose-950/40 border-rose-500/40 text-rose-400' : 'bg-zinc-950 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'}`}
                              >
                                <span>Bands/Artists</span>
                                <span className={`px-1 py-0.5 rounded text-[8px] font-bold font-mono shrink-0 ${followingActiveTab === 'bands' ? 'bg-rose-900/60 text-rose-300' : 'bg-zinc-900 text-zinc-600'}`}>
                                  {activeCategoryCount('bands')}
                                </span>
                              </button>
                              <button 
                                onClick={() => setFollowingActiveTab('venues')}
                                className={`col-span-3 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-between gap-1.5 border ${followingActiveTab === 'venues' ? 'bg-rose-950/40 border-rose-500/40 text-rose-400' : 'bg-zinc-950 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'}`}
                              >
                                <span>Venues/Promoters</span>
                                <span className={`px-1 py-0.5 rounded text-[8px] font-bold font-mono shrink-0 ${followingActiveTab === 'venues' ? 'bg-rose-900/60 text-rose-300' : 'bg-zinc-900 text-zinc-600'}`}>
                                  {activeCategoryCount('venues')}
                                </span>
                              </button>

                              {/* Row 2: Creatives, Labels & Friends (each spanning 2 columns out of 6) */}
                              <button 
                                onClick={() => setFollowingActiveTab('creatives')}
                                className={`col-span-2 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-between gap-1 border ${followingActiveTab === 'creatives' ? 'bg-rose-950/40 border-rose-500/40 text-rose-400' : 'bg-zinc-950 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'}`}
                              >
                                <span className="truncate">Creatives</span>
                                <span className={`px-1 py-0.5 rounded text-[8px] font-bold font-mono shrink-0 ${followingActiveTab === 'creatives' ? 'bg-rose-900/60 text-rose-300' : 'bg-zinc-900 text-zinc-600'}`}>
                                  {activeCategoryCount('creatives')}
                                </span>
                              </button>
                              <button 
                                onClick={() => setFollowingActiveTab('labels')}
                                className={`col-span-2 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-between gap-1 border ${followingActiveTab === 'labels' ? 'bg-rose-950/40 border-rose-500/40 text-rose-400' : 'bg-zinc-950 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'}`}
                              >
                                <span className="truncate">Labels</span>
                                <span className={`px-1 py-0.5 rounded text-[8px] font-bold font-mono shrink-0 ${followingActiveTab === 'labels' ? 'bg-rose-900/60 text-rose-300' : 'bg-zinc-900 text-zinc-600'}`}>
                                  {activeCategoryCount('labels')}
                                </span>
                              </button>
                              <button 
                                onClick={() => setFollowingActiveTab('friends')}
                                className={`col-span-2 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-between gap-1 border ${followingActiveTab === 'friends' ? 'bg-rose-950/40 border-rose-500/40 text-rose-400' : 'bg-zinc-950 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'}`}
                              >
                                <span className="truncate">Friends</span>
                                <span className={`px-1 py-0.5 rounded text-[8px] font-bold font-mono shrink-0 ${followingActiveTab === 'friends' ? 'bg-rose-900/60 text-rose-300' : 'bg-zinc-900 text-zinc-600'}`}>
                                  {activeCategoryCount('friends')}
                                </span>
                              </button>
                            </div>

                            {/* Toolbar: Followed Feed Switch & Bulk Alert Switch */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* 1. Toggle followed feed */}
                              <div className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-900/60 rounded-xl gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="flex h-1.5 w-1.5 relative shrink-0">
                                    {filterShowFollowedOnly && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${filterShowFollowedOnly ? 'bg-rose-500' : 'bg-zinc-700'}`}></span>
                                  </span>
                                  <span className="text-[9px] font-bold uppercase text-zinc-400 truncate leading-tight font-mono">Followed Feed Only</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const nextVal = !filterShowFollowedOnly;
                                    setFilterShowFollowedOnly(nextVal);
                                    triggerNotification?.(nextVal ? "✨ Feed set to Followed Accounts only!" : "🌎 Feed set to show all community updates!");
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all shrink-0 ${filterShowFollowedOnly ? 'bg-rose-950/60 border border-rose-500/30 text-rose-400' : 'bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-zinc-300'}`}
                                >
                                  {filterShowFollowedOnly ? 'ON' : 'OFF'}
                                </button>
                              </div>

                              {/* 2. Bulk Action Toggle */}
                              <button
                                disabled={activeFollowed.length === 0}
                                onClick={toggleCategoryAlerts}
                                className="flex items-center justify-center gap-1.5 p-2.5 bg-zinc-950 border border-zinc-900/60 rounded-xl hover:bg-zinc-900/40 text-[9px] font-bold uppercase text-zinc-400 hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none font-mono"
                              >
                                {activeFollowed.every(p => p.notificationsEnabled) ? (
                                  <>
                                    <BellOff className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span>Mute Alerts</span>
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span>Alerts Active</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* List of Followed profiles */}
                            <div className="space-y-2 pt-1">
                              {activeFollowed.length === 0 ? (
                                <div className="text-center py-8 px-4 bg-zinc-950/30 border border-dashed border-zinc-900 rounded-2xl">
                                  <Users className="w-7 h-7 text-zinc-700 mx-auto mb-2" />
                                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">No Followed Accounts</h4>
                                  <p className="text-[9px] text-zinc-600 mt-1 max-w-[180px] mx-auto leading-relaxed">You are not following anyone here yet. Tap "+ Follow" below!</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {activeFollowed.map((profile, pIdx) => (
                                    <div key={profile.id ? `foll-${profile.id}-${pIdx}` : `foll-${pIdx}`} className="flex items-center justify-between p-2.5 bg-zinc-900/40 rounded-xl border border-zinc-800/40 hover:border-zinc-800 transition-all">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {/* Avatar image with indicator */}
                                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                                          <img src={profile.image} alt={profile?.name} className="w-full h-full object-cover" />
                                          {(profile.category === 'friends' || profile.category === 'bands') && (
                                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-zinc-950" />
                                          )}
                                        </div>
                                        
                                        <div className="min-w-0">
                                          <div className="text-xs font-black text-white truncate uppercase tracking-wide leading-tight">{profile?.name}</div>
                                          <p className="text-[9px] text-zinc-500 truncate mt-0.5 leading-none">{profile.desc}</p>
                                          {/* Live Status Pill */}
                                          {(() => {
                                            const status = getLiveStatus(profile);
                                            return (
                                              <span className={`inline-flex items-center text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1 leading-none ${status.color}`}>
                                                {status.label}
                                              </span>
                                            );
                                          })()}
                                        </div>
                                      </div>

                                      {/* Interactive Buttons */}
                                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                        {/* Context-Specific Shortcut */}
                                        {profile.category === 'bands' && (
                                          <button 
                                            onClick={() => {
                                              setActiveTab('feed');
                                              setLeftDrawerOpen(false);
                                              triggerNotification?.(`🎧 Tuning in to ${profile?.name}'s tracks on your feed!`);
                                            }}
                                            title="View Tracks"
                                            className="w-6 h-6 rounded bg-zinc-950 border border-zinc-900 flex items-center justify-center text-rose-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                                          >
                                            <Play className="w-2.5 h-2.5 fill-rose-500/20" />
                                          </button>
                                        )}

                                        {profile.category === 'venues' && (
                                          <button 
                                            onClick={() => {
                                              setActiveTab('feed');
                                              setLeftDrawerOpen(false);
                                              triggerNotification?.(`🎫 Opening ${profile?.name} schedule on the community dashboard!`);
                                            }}
                                            title="View Gigs"
                                            className="w-6 h-6 rounded bg-zinc-950 border border-zinc-900 flex items-center justify-center text-rose-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                                          >
                                            <Ticket className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                        {profile.role?.toLowerCase().includes('artist') && (
                                          <button 
                                            onClick={() => triggerNotification?.(`🎵 ${profile?.name} added to queue`)}
                                            title="Listen"
                                            className="w-6 h-6 rounded bg-zinc-950 border border-zinc-900 flex items-center justify-center text-rose-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                                          >
                                            <Disc className="w-2.5 h-2.5" />
                                          </button>
                                        )}


                                        {profile.category === 'friends' && (
                                          <button 
                                            onClick={() => {
                                              window.dispatchEvent(new CustomEvent('nexus_open_chat', { detail: { profile_id: profile?.name, name: profile?.name, username: profile?.name, avatar_url: profile.image } }));
                                              window.dispatchEvent(new CustomEvent('nexus_open_chat_thread', { detail: { profile_id: profile?.name, name: profile?.name, username: profile?.name, avatar_url: profile.image } }));
                                              setLeftDrawerOpen(false);
                                              triggerNotification?.(`💬 DM with ${profile?.name} opened.`);

                                            }}
                                            title="Direct Message"
                                            className="w-6 h-6 rounded bg-zinc-950 border border-zinc-900 flex items-center justify-center text-rose-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                                          >
                                            <MessageSquare className="w-2.5 h-2.5" />
                                          </button>
                                        )}

                                        {/* Notifications bell */}
                                        <button 
                                          onClick={() => toggleNotifications(profile.id, profile?.name)}
                                          title={profile.notificationsEnabled ? "Mute alerts" : "Enable alerts"}
                                          className={`w-6 h-6 rounded border flex items-center justify-center transition-all cursor-pointer ${
                                            profile.notificationsEnabled 
                                              ? 'bg-rose-950/20 border-rose-500/30 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.1)]' 
                                              : 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-zinc-400'
                                          }`}
                                        >
                                          {profile.notificationsEnabled ? <Bell className="w-2.5 h-2.5" /> : <BellOff className="w-2.5 h-2.5" />}
                                        </button>

                                        {/* Unfollow Button */}
                                        <button 
                                          onClick={() => toggleFollowProfile(profile.id, profile?.name)}
                                          title="Unfollow"
                                          className="w-6 h-6 rounded bg-zinc-950 border border-zinc-900 hover:border-rose-500/30 text-zinc-600 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                                        >
                                          <UserMinus className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Suggestions List */}
                            {activeSuggested.length > 0 && (
                              <div className="pt-3 border-t border-zinc-900 space-y-2">
                                <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider font-mono">Suggested to Follow</div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar pr-0.5">
                                  {activeSuggested.map((profile, pIdx) => (
                                    <div key={profile.id ? `sugg-${profile.id}-${pIdx}` : `sugg-${pIdx}`} className="flex items-center justify-between p-2 bg-zinc-950/40 rounded-lg border border-zinc-900 hover:border-zinc-850 transition-all">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded overflow-hidden border border-zinc-900 shrink-0">
                                          <img src={profile.image} alt={profile?.name} className="w-full h-full object-cover opacity-50" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-[11px] font-bold text-zinc-300 truncate uppercase leading-tight">{profile?.name}</div>
                                          <p className="text-[8px] text-zinc-600 truncate mt-0.5 font-mono leading-none">{profile.desc}</p>
                                        </div>
                                      </div>

                                      <button 
                                        onClick={() => toggleFollowProfile(profile.id, profile?.name)}
                                        className="bg-zinc-900 hover:bg-zinc-800 text-rose-400 hover:text-white font-bold text-[8px] uppercase px-2 py-1 rounded-md border border-zinc-850 shrink-0 cursor-pointer transition-colors"
                                      >
                                        + Follow
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 6-Digit Security PIN Validation Dialog Overlay */}
              {isPinModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                  <div className="w-full max-w-xs bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4 shadow-2xl relative border-rose-500/15">
                    <div className="text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-rose-950/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 animate-pulse">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs font-black uppercase text-zinc-100 tracking-wider font-display">Confirm Identity PIN</h3>
                      <p className="text-[9px] text-zinc-400 leading-normal">
                        Enter your 6-digit security PIN to authorize and commit your profile modifications.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <input 
                        type="password"
                        maxLength={6}
                        value={pinEntered}
                        onChange={(e) => {
                          setPinError('');
                          setPinEntered(e.target.value.replace(/\D/g, ''));
                        }}
                        placeholder="••••••"
                        className="w-full text-center text-xl font-mono tracking-[0.35em] bg-black border border-zinc-900 rounded-xl py-3 text-rose-500 focus:outline-none focus:border-rose-500 font-bold"
                        autoFocus
                      />
                      {pinError && (
                        <p className="text-[9px] text-rose-500 text-center font-mono font-semibold mt-1">
                          {pinError}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPinModalOpen(false);
                          setPinEntered('');
                          setPinError('');
                        }}
                        className="py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors font-mono cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const rawCurrentPin = String((userProfile as any)?.pin || profilePin || '000000').trim();
                          const entered = pinEntered.trim();
                          const isMatch = entered === rawCurrentPin ||
                            (entered.length >= 4 && (
                              entered.padEnd(6, '0') === rawCurrentPin.padEnd(6, '0') ||
                              entered === (rawCurrentPin + '000000').slice(0, 6) ||
                              rawCurrentPin === (entered + '000000').slice(0, 6)
                            ));

                          if (isMatch) {
                            setIsPinModalOpen(false);
                            setPinEntered('');
                            setPinError('');
                            setDrawerCurrentView('root');
                            saveProfileData(true);
                            triggerNotification?.("🟢 IDENTITY CONFIRMED: CHANGES COMMITTED SUCCESSFULLY.");
                          } else {
                            setPinError("❌ WRONG SECURITY PIN VALUE. TRANSACTION REFUSED.");
                            triggerNotification?.("⚠️ Access Denied: Incorrect PIN.");
                          }
                        }}
                        className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors font-mono cursor-pointer shadow-lg shadow-rose-950/20"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Cropper Modal */}
              <InteractiveCropperModal
                isOpen={cropperOpen}
                onClose={() => {
                  setCropperOpen(false);
                  setCropperImageSrc('');
                }}
                imageSrc={cropperImageSrc}
                aspectRatio={cropperType === 'avatar' ? '1:1' : '3:1'}
                onCropComplete={async (croppedBase64) => {
                  setCropperOpen(false);
                  setCropperImageSrc('');
                  try {
                    triggerNotification?.("⏳ Processing and optimizing image...");
                    const userProfileId = userProfile?.id || 'profile_anonymous';
                    const bucket = 'community-bands';
                    const token = cropperType === 'avatar' ? 'profile-avatar' : 'cover-banner';
                    
                    // Attempt the storage upload strictly
                    const publicUrl = await uploadBase64ToStorage(croppedBase64, bucket, userProfileId, token);
                    
                    if (!publicUrl) {
                      throw new Error("Storage upload returned an empty public URL.");
                    }

                    if (cropperType === 'avatar') {
                      if (setProfileAvatarUrl) setProfileAvatarUrl(publicUrl);
                    } else {
                      if (setProfileCoverUrl) setProfileCoverUrl(publicUrl);
                    }

                    if (setUserProfile) {
                      setUserProfile((prev: any) => prev ? {
                        ...prev,
                        ...(cropperType === 'avatar'
                          ? { avatar: publicUrl, avatar_url: publicUrl, logo_url: publicUrl }
                          : { banner: publicUrl, banner_url: publicUrl, cover_url: publicUrl })
                      } : prev);
                    }

                    if (userProfile?.id) {
                      const sbClient = getSupabase();
                      if (sbClient) {
                        if (cropperType === 'avatar') {
                          await autoArchiveProfileAssets(sbClient, userProfile.id, publicUrl, null, userProfile.name);
                        } else {
                          await autoArchiveProfileAssets(sbClient, userProfile.id, null, publicUrl, userProfile.name);
                        }

                        const columnToUpdate = cropperType === 'avatar' ? { avatar_url: publicUrl } : { banner_url: publicUrl };
                        const globalPayload = extractGlobalProfilePayload({
                          id: userProfile.id,
                          ...columnToUpdate
                        }, userProfile.id);
                        await executeSanitizedProfileUpsert(sbClient, globalPayload);

                        // If portal is band or user is linked to band, sync to bands table too
                        if (portalRole === 'band' || (userProfile as any)?.band_id || (props as any)?.activeBand?.id) {
                          const targetBandId = (props as any)?.activeBand?.id || (userProfile as any)?.band_id || userProfile.id;
                          if (targetBandId) {
                            const bandImageField = cropperType === 'avatar'
                              ? { logo_url: publicUrl, avatar_url: publicUrl }
                              : { cover_url: publicUrl, banner_url: publicUrl };
                            const sanitized = sanitizeBandPayload({
                              id: targetBandId,
                              band_name: profileFullLegalName || userProfile.name || 'Band',
                              name: profileFullLegalName || userProfile.name || 'Band',
                              ...bandImageField
                            });
                            await executeWithSchemaResilience(
                              async (payload) => await sbClient.from('bands').upsert([payload]),
                              sanitized
                            );
                            window.dispatchEvent(new CustomEvent('nexus_band_updated', { detail: sanitized }));
                          }
                        }
                      }
                    }

                    // Dispatch avatar update event globally
                    window.dispatchEvent(new CustomEvent('nexus_avatar_updated', {
                      detail: {
                        id: userProfile?.id,
                        avatarUrl: publicUrl,
                        avatar_url: publicUrl,
                        logo_url: publicUrl,
                        logoUrl: publicUrl,
                        authorName: profileFullLegalName || userProfile?.name || 'User',
                        name: profileFullLegalName || userProfile?.name || 'User',
                        authorRole: portalRole || 'User'
                      }
                    }));

                    triggerNotification?.(`✨ ${cropperType === 'avatar' ? 'Profile Avatar' : 'Cover Banner'} updated & synchronized!`);
                  } catch (err: any) {
                    console.error("Failed to upload cropped image to storage:", err);
                    triggerNotification?.("⚠️ Failed to upload image to storage bucket.");
                  }
                }}
              />

              {/* Real OAuth Digital Wallet Authorization Modal */}
              <WalletOAuthModal
                isOpen={!!activeOAuthProvider}
                provider={activeOAuthProvider || 'google'}
                userProfile={props.userProfile}
                onClose={() => setActiveOAuthProvider(null)}
                onSuccess={(prov, card) => {
                  const refreshed = getStoredWallets(props.userProfile);
                  setWalletsState(refreshed);
                  const name = prov === 'google' ? 'Google Pay' : prov === 'apple' ? 'Apple Pay' : 'PayPal Wallet';
                  triggerNotification?.(`⚡ ${name} verified and live! Ready for real 1-tap checkout.`);
                }}
              />

              {/* Community Band Archivist Modal (Direct Fan Curating / Editing - No registration forms required) */}
              <CommunityBandCuratorModal
                isOpen={isCommunityCuratorOpen}
                onClose={() => setIsCommunityCuratorOpen(false)}
                userProfile={userProfile}
                triggerNotification={triggerNotification}
                onSaved={(band) => {
                  triggerNotification?.(`⚡ Saved community archive for "${band.name}"!`);
                }}
              />
            </div>
          </div>
        </div>
  );
};
