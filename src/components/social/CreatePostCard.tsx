import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getSupabase } from '../../supabase';
import { getCurrentCoordinates } from '../../services/locationService';
import { getAvailablePersonas, resolveActivePersona } from './utils/personaResolution';
import {
  Send,
  Image as ImageIcon,
  Video,
  MapPin,
  Music,
  Users,
  BarChart2,
  ShoppingBag,
  Radio,
  Sparkles,
  X,
  AlertTriangle,
  Upload,
  Clock,
  SlidersHorizontal,
  Disc,
  CheckCircle2,
  ListPlus,
  Globe,
  Lock,
  Shirt,
  PlayCircle,
  Youtube,
  Folder,
  Plus,
  RefreshCw,
  Calendar,
  Ticket,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { checkDuplicateCommunityEvent, EVENT_CATEGORIES } from '../../utils/communityEventUtils';
import { getExistingPhotoPitAlbums, persistPhotoPitFolders } from './utils/photoPitAlbums';
import { resolveBandcampMetadata, isBandcampUrl, normalizeBandcampUrl, BandcampResolvedData } from '../../utils/socialFeedUtils';
import { BandcampEmbedCard } from './embeds/BandcampEmbedCard';
import { BandcampSearchHelper } from './embeds/BandcampSearchHelper';
import { VenueAutocompleteInput } from './VenueAutocompleteInput';
import { BandTagAutocomplete } from './BandTagAutocomplete';


export type ComposerRoleTheme = 'band' | 'creative' | 'promoter' | 'label' | 'industry_pro' | 'fan_only';

export interface ComposerThemeConfig {
  key: ComposerRoleTheme;
  roleTitle: string;
  cardBg: string;
  panelBg: string;
  innerPanelBg: string;
  attachedTagBg: string;
  attachedTagIcon: string;
  gradientBtn: string;
  cardBorderGlow: string;
  badgeBg: string;
  badgeText: string;
  accentText: string;
  accentBg: string;
  accentHoverBg: string;
  accentBorder: string;
  inputBorder: string;
  inputFocus: string;
  buttonBg: string;
  panelBorder: string;
  panelHeaderBg: string;
  activeBtnStyle: string;
  inactiveBtnStyle: string;
  glowHex: string;
}

export function getComposerRoleTheme(roleOrTheme?: string): ComposerThemeConfig {
  const r = (roleOrTheme || '').toLowerCase();

  if (r === 'band' || r.includes('band') || r.includes('artist')) {
    return {
      key: 'band',
      roleTitle: 'BAND / ARTIST COMPOSER',
      cardBg: 'bg-[#040e0a]',
      panelBg: 'bg-[#020805]',
      innerPanelBg: 'bg-[#031209]',
      attachedTagBg: 'bg-emerald-950 border-emerald-800 text-emerald-200',
      attachedTagIcon: 'text-emerald-400',
      gradientBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
      cardBorderGlow: 'border-emerald-500/60 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.35),0_0_60px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]',
      badgeBg: 'bg-emerald-950/80',
      badgeText: 'text-emerald-300',
      accentText: 'text-emerald-400',
      accentBg: 'bg-emerald-900/50',
      accentHoverBg: 'hover:bg-emerald-900/80',
      accentBorder: 'border-emerald-500/50',
      inputBorder: 'border-emerald-900/40',
      inputFocus: 'focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/30',
      panelBorder: 'border-emerald-900/60',
      panelHeaderBg: 'bg-emerald-950/60',
      activeBtnStyle: 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      inactiveBtnStyle: 'bg-[#0a120e] border-emerald-900/40 text-zinc-400 hover:border-emerald-500/60 hover:text-white',
      glowHex: '#10b981'
    };
  }

  if (r === 'creative' || r.includes('creative')) {
    return {
      key: 'creative',
      roleTitle: 'CREATIVE COMPOSER',
      cardBg: 'bg-[#0e040c]',
      panelBg: 'bg-[#080206]',
      innerPanelBg: 'bg-[#12030d]',
      attachedTagBg: 'bg-pink-950 border-pink-800 text-pink-200',
      attachedTagIcon: 'text-pink-400',
      gradientBtn: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500',
      cardBorderGlow: 'border-pink-500/60 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(236,72,153,0.35),0_0_60px_rgba(236,72,153,0.2)] hover:border-pink-400 hover:shadow-[0_0_40px_rgba(236,72,153,0.5)]',
      badgeBg: 'bg-pink-950/80',
      badgeText: 'text-pink-300',
      accentText: 'text-pink-400',
      accentBg: 'bg-pink-900/50',
      accentHoverBg: 'hover:bg-pink-900/80',
      accentBorder: 'border-pink-500/50',
      inputBorder: 'border-pink-900/40',
      inputFocus: 'focus:border-pink-400 focus:ring-1 focus:ring-pink-400/30',
      buttonBg: 'bg-pink-600 hover:bg-pink-500 active:bg-pink-700 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] border border-pink-400/30',
      panelBorder: 'border-pink-900/60',
      panelHeaderBg: 'bg-pink-950/60',
      activeBtnStyle: 'bg-pink-950/70 border-pink-500 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.35)]',
      inactiveBtnStyle: 'bg-[#120a10] border-pink-900/40 text-zinc-400 hover:border-pink-500/60 hover:text-white',
      glowHex: '#ec4899'
    };
  }

  if (r === 'promoter' || r.includes('promoter') || r.includes('venue')) {
    return {
      key: 'promoter',
      roleTitle: 'PROMOTER COMPOSER',
      cardBg: 'bg-[#0e0e04]',
      panelBg: 'bg-[#080802]',
      innerPanelBg: 'bg-[#121103]',
      attachedTagBg: 'bg-yellow-950 border-yellow-800 text-yellow-200',
      attachedTagIcon: 'text-yellow-400',
      gradientBtn: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500',
      cardBorderGlow: 'border-yellow-400/60 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(250,204,21,0.35),0_0_60px_rgba(250,204,21,0.2)] hover:border-yellow-300 hover:shadow-[0_0_40px_rgba(250,204,21,0.5)]',
      badgeBg: 'bg-yellow-950/80',
      badgeText: 'text-yellow-300',
      accentText: 'text-yellow-300',
      accentBg: 'bg-yellow-900/50',
      accentHoverBg: 'hover:bg-yellow-900/80',
      accentBorder: 'border-yellow-400/50',
      inputBorder: 'border-yellow-900/40',
      inputFocus: 'focus:border-yellow-300 focus:ring-1 focus:ring-yellow-300/30',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-bold shadow-[0_0_20px_rgba(250,204,21,0.4)] border border-yellow-300/40',
      panelBorder: 'border-yellow-900/60',
      panelHeaderBg: 'bg-yellow-950/60',
      activeBtnStyle: 'bg-yellow-950/70 border-yellow-400 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.35)]',
      inactiveBtnStyle: 'bg-[#12110a] border-yellow-900/40 text-zinc-400 hover:border-yellow-400/60 hover:text-white',
      glowHex: '#facc15'
    };
  }

  if (r === 'label' || r.includes('label')) {
    return {
      key: 'label',
      roleTitle: 'RECORD LABEL COMPOSER',
      cardBg: 'bg-[#0e0a04]',
      panelBg: 'bg-[#080502]',
      innerPanelBg: 'bg-[#120903]',
      attachedTagBg: 'bg-orange-950 border-orange-800 text-orange-200',
      attachedTagIcon: 'text-orange-400',
      gradientBtn: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500',
      cardBorderGlow: 'border-orange-500/60 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(249,115,22,0.35),0_0_60px_rgba(249,115,22,0.2)] hover:border-orange-400 hover:shadow-[0_0_40px_rgba(249,115,22,0.5)]',
      badgeBg: 'bg-orange-950/80',
      badgeText: 'text-orange-300',
      accentText: 'text-orange-400',
      accentBg: 'bg-orange-900/50',
      accentHoverBg: 'hover:bg-orange-900/80',
      accentBorder: 'border-orange-500/50',
      inputBorder: 'border-orange-900/40',
      inputFocus: 'focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30',
      buttonBg: 'bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400/30',
      panelBorder: 'border-orange-900/60',
      panelHeaderBg: 'bg-orange-950/60',
      activeBtnStyle: 'bg-orange-950/70 border-orange-500 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.35)]',
      inactiveBtnStyle: 'bg-[#120e0a] border-orange-900/40 text-zinc-400 hover:border-orange-500/60 hover:text-white',
      glowHex: '#f97316'
    };
  }

  if (r === 'fan_only' || r.includes('fan')) {
    return {
      key: 'fan_only',
      roleTitle: 'FAN COMPOSER',
      cardBg: 'bg-[#00133b]',
      panelBg: 'bg-[#00133b]',
      innerPanelBg: 'bg-[#001a4d]',
      attachedTagBg: 'bg-cyan-950 border-cyan-800 text-cyan-200',
      attachedTagIcon: 'text-cyan-400',
      gradientBtn: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
      cardBorderGlow: 'border-cyan-500/60 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.35),0_0_60px_rgba(6,182,212,0.2)] hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]',
      badgeBg: 'bg-cyan-950/80',
      badgeText: 'text-cyan-300',
      accentText: 'text-cyan-400',
      accentBg: 'bg-cyan-900/50',
      accentHoverBg: 'hover:bg-cyan-900/80',
      accentBorder: 'border-cyan-500/50',
      inputBorder: 'border-cyan-900/40',
      inputFocus: 'focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30',
      buttonBg: 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/30',
      panelBorder: 'border-cyan-900/60',
      panelHeaderBg: 'bg-cyan-950/60',
      activeBtnStyle: 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
      inactiveBtnStyle: 'bg-[#001a4d] border-cyan-900/40 text-zinc-400 hover:border-cyan-500/60 hover:text-white',
      glowHex: '#06b6d4'
    };
  }

  // Default: Industry Pro (Purple / Violet)
  return {
    key: 'industry_pro',
    roleTitle: 'INDUSTRY PRO COMPOSER',
    cardBg: 'bg-[#0c0a14]',
    panelBg: 'bg-[#050308]',
    innerPanelBg: 'bg-[#090612]',
    attachedTagBg: 'bg-purple-950 border-purple-800 text-purple-200',
    attachedTagIcon: 'text-purple-400',
    gradientBtn: 'bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500',
    cardBorderGlow: 'border-purple-600/50 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.35),0_0_60px_rgba(147,51,234,0.2)] hover:border-purple-500/80 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)]',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    accentText: 'text-purple-400',
    accentBg: 'bg-purple-900/50',
    accentHoverBg: 'hover:bg-purple-900/80',
    accentBorder: 'border-purple-500/50',
    inputBorder: 'border-purple-900/40',
    inputFocus: 'focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30',
    buttonBg: 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/30',
    panelBorder: 'border-purple-900/60',
    panelHeaderBg: 'bg-purple-950/60',
    activeBtnStyle: 'bg-purple-950/70 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    inactiveBtnStyle: 'bg-[#0d0914] border-purple-900/40 text-zinc-400 hover:border-purple-500/60 hover:text-white',
    glowHex: '#a855f7'
  };
}

export interface CreatePostCardProps {
  roleTheme?: ComposerRoleTheme | ComposerThemeConfig | string;
  portalRole?: string;
  activeBand?: any;
  profileFullLegalName?: string;
  profileHandle?: string;
  profileAvatarUrl?: string;
  userProfile: any;
  postIdentity: string;
  setPostIdentity: (identity: string) => void;
  newPostText: string;
  setNewPostText: (text: string) => void;
  newPostImageUrl: string;
  setNewPostImageUrl: (url: string) => void;
  selectedMediaFiles?: {url: string, type: 'image'|'video', file?: File}[];
  setSelectedMediaFiles?: (files: {url: string, type: 'image'|'video', file?: File}[]) => void;
  handleMediaUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newPostCategory: string;
  setNewPostCategory: (cat: string) => void;
  handleCreatePost: (e: React.FormEvent) => void;
  availableIdentities?: Array<{ id: string; name: string }>;
  bands?: any[];

  // Video & Venue
  youtubeUrl?: string;
  setYoutubeUrl?: (url: string) => void;
  taggedVenue?: string;
  setTaggedVenue?: (venue: string) => void;

  // Poll
  setShowPollModal?: (show: boolean) => void;
  pollQuestion?: string;
  setPollQuestion?: (q: string) => void;
  pollVariant?: 'standard' | 'encore_setlist' | 'promoter_lineup';
  setPollVariant?: (v: 'standard' | 'encore_setlist' | 'promoter_lineup') => void;
  pollOptions?: string[];
  setPollOptions?: (opts: string[]) => void;
  pollIsTimed?: boolean;
  setPollIsTimed?: (isTimed: boolean) => void;
  pollTimerDays?: string;
  setPollTimerDays?: (days: string) => void;
  pollTimerHours?: string;
  setPollTimerHours?: (hours: string) => void;

  // Merch Drop
  setShowMerchDropModal?: (show: boolean) => void;
  merchDropName?: string;
  setMerchDropName?: (name: string) => void;
  merchDropPrice?: string;
  setMerchDropPrice?: (price: string) => void;

  // Songs/Album
  setShowSongModal?: (show: boolean) => void;
  attachedSong?: any;
  setAttachedSong?: (song: any) => void;

  // Tag Band
  taggedBands?: string[];
  setTaggedBands?: (bands: string[]) => void;

  // Tape / Reel
  tapeTitle?: string;
  setTapeTitle?: (title: string) => void;
  tapeBand?: string;
  setTapeBand?: (band: string) => void;
  tapeDate?: string;
  setTapeDate?: (date: string) => void;
  tapeDuration?: string;
  setTapeDuration?: (dur: string) => void;
  tapeAudioUrl?: string;
  setTapeAudioUrl?: (url: string) => void;
  tapeAudioFileName?: string;
  isUploadingTapeAudio?: boolean;
  handleTapeAudioUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tapeFileInputRef?: React.RefObject<HTMLInputElement>;

  // Scheduler Props
  scheduledTime?: string;
  setScheduledTime?: (val: string) => void;
  handleSchedulePost?: (e: React.FormEvent, scheduledAt: string) => void;
  triggerNotification?: (msg: string) => void;

  // DIY Event & Ticket Props (Optional)
  setShowEventModal?: (show: boolean) => void;
  eventTitle?: string;
  setEventTitle?: (val: string) => void;
  eventType?: string;
  setEventType?: (val: string) => void;
  eventDate?: string;
  setEventDate?: (val: string) => void;
  eventTime?: string;
  setEventTime?: (val: string) => void;
  eventLocationName?: string;
  setEventLocationName?: (val: string) => void;
  eventAddress?: string;
  setEventAddress?: (val: string) => void;
  eventIsSecret?: boolean;
  setEventIsSecret?: (val: boolean) => void;
  eventLineup?: string;
  setEventLineup?: (val: string) => void;
  eventFlyerUrl?: string;
  setEventFlyerUrl?: (val: string) => void;
  eventDescription?: string;
  setEventDescription?: (val: string) => void;
  eventCost?: string;
  setEventCost?: (val: string) => void;
  eventTicketUrl?: string;
  setEventTicketUrl?: (val: string) => void;
  eventData?: any;
  setEventData?: (data: any) => void;
  setUserProfile?: (profile: any) => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({
  roleTheme,
  portalRole,
  activeBand,
  profileFullLegalName,
  profileHandle,
  profileAvatarUrl,
  userProfile,
  setUserProfile,
  postIdentity,
  setPostIdentity,
  newPostText,
  setNewPostText,
  newPostImageUrl,
  setNewPostImageUrl,
  selectedMediaFiles = [],
  setSelectedMediaFiles,
  handleMediaUpload,
  newPostCategory,
  setNewPostCategory,
  handleCreatePost,
  availableIdentities = [],
  bands = [],
  youtubeUrl = '',
  setYoutubeUrl,
  taggedVenue = '',
  setTaggedVenue,
  setShowPollModal,
  pollQuestion = '',
  setPollQuestion,
  pollVariant = 'standard',
  setPollVariant,
  pollOptions = ['', ''],
  setPollOptions,
  pollIsTimed = false,
  setPollIsTimed,
  pollTimerDays = '1',
  setPollTimerDays,
  pollTimerHours = '0',
  setPollTimerHours,
  setShowMerchDropModal,
  merchDropName = '',
  setMerchDropName,
  merchDropPrice = '25',
  setMerchDropPrice,
  setShowSongModal,
  attachedSong,
  setAttachedSong,
  taggedBands = [],
  setTaggedBands,
  tapeTitle = '',
  setTapeTitle,
  tapeBand = '',
  setTapeBand,
  tapeDate = '',
  setTapeDate,
  tapeDuration = '',
  setTapeDuration,
  tapeAudioUrl = '',
  setTapeAudioUrl,
  tapeAudioFileName = '',
  isUploadingTapeAudio = false,
  handleTapeAudioUpload,
  tapeFileInputRef,
  scheduledTime: externalScheduledTime = '',
  setScheduledTime: externalSetScheduledTime,
  handleSchedulePost,
  triggerNotification,

  // DIY Event Props
  setShowEventModal,
  eventTitle = '',
  setEventTitle,
  eventType = 'DIY Show',
  setEventType,
  eventDate = '',
  setEventDate,
  eventTime = '',
  setEventTime,
  eventLocationName = '',
  setEventLocationName,
  eventAddress = '',
  setEventAddress,
  eventIsSecret = false,
  setEventIsSecret,
  eventLineup = '',
  setEventLineup,
  eventFlyerUrl = '',
  setEventFlyerUrl,
  eventDescription = '',
  setEventDescription,
  eventCost = '',
  setEventCost,
  eventTicketUrl = '',
  setEventTicketUrl,
  eventData,
  setEventData,
}) => {
  const availablePersonas = useMemo(() => {
    const effectiveBands = (bands && bands.length > 0) ? bands : (availableIdentities && availableIdentities.length > 0 ? availableIdentities : []);
    return getAvailablePersonas({
      portalRole,
      userProfile,
      activeBand,
      bands: effectiveBands,
      profileFullLegalName,
      profileHandle,
      profileAvatarUrl,
    });
  }, [portalRole, userProfile, activeBand, bands, availableIdentities, profileFullLegalName, profileHandle, profileAvatarUrl]);

  const activePersona = useMemo(() => {
    const effectiveBands = (bands && bands.length > 0) ? bands : (availableIdentities && availableIdentities.length > 0 ? availableIdentities : []);
    return resolveActivePersona({
      postIdentity,
      portalRole,
      userProfile,
      activeBand,
      bands: effectiveBands,
      profileFullLegalName,
      profileHandle,
      profileAvatarUrl,
    });
  }, [postIdentity, portalRole, userProfile, activeBand, bands, availableIdentities, profileFullLegalName, profileHandle, profileAvatarUrl]);

  const effectiveRole = activePersona.type;
  const theme: ComposerThemeConfig = (roleTheme && typeof roleTheme === 'object' && 'roleTitle' in roleTheme) ? (roleTheme as ComposerThemeConfig) : getComposerRoleTheme(effectiveRole);

  const isBandRole = activePersona.type === 'band';
  const isCreativeRole = activePersona.type === 'creative';
  const isLabelRole = activePersona.type === 'label';
  const isPromoterRole = activePersona.type === 'promoter';
  const isFanRole = activePersona.type === 'fan';

  const displayName = activePersona.name;
  const avatarUrl = activePersona.avatarUrl;
  const roleBadgeTitle = activePersona.roleBadge;

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [tagBandInput, setTagBandInput] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [localScheduledTime, setLocalScheduledTime] = useState('');
  const [postScope, setPostScope] = useState<'public' | 'followers' | 'private'>('public');
  const existingPhotoPitAlbums = useMemo(() => {
    const list = getExistingPhotoPitAlbums(userProfile, portalRole);
    return list.length > 0 ? list : ['Profile Pics', 'Cover Images'];
  }, [userProfile, portalRole]);

  const [availableAlbums, setAvailableAlbums] = useState<string[]>(existingPhotoPitAlbums);
  const [selectedAlbum, setSelectedAlbum] = useState<string>(existingPhotoPitAlbums[0] || 'Profile Pics');
  const [isCreatingNewAlbum, setIsCreatingNewAlbum] = useState<boolean>(false);
  const [newAlbumInput, setNewAlbumInput] = useState<string>('');

  useEffect(() => {
    const list = getExistingPhotoPitAlbums(userProfile, portalRole);
    if (list.length > 0) {
      setAvailableAlbums(list);
      setSelectedAlbum((prev) => (list.includes(prev) ? prev : list[0]));
    }
  }, [userProfile, portalRole]);

  // Bandcamp resolution state
  const [bandcampResolved, setBandcampResolved] = useState<BandcampResolvedData | null>(null);
  const [isResolvingBandcamp, setIsResolvingBandcamp] = useState<boolean>(false);

  const handleSelectBandcampTrack = (track: { url: string; title: string; artist: string; artworkUrl?: string }) => {
    setNewPostImageUrl(track.url);
    setIsResolvingBandcamp(true);
    setBandcampResolved({
      success: true,
      embedUrl: null,
      title: track.title,
      artist: track.artist,
      artwork: track.artworkUrl,
      pageUrl: track.url,
      itemType: 'track'
    });
    resolveBandcampMetadata(track.url).then((res) => {
      if (res && res.success && res.embedUrl) {
        setBandcampResolved(res);
      }
      setIsResolvingBandcamp(false);
    }).catch(() => {
      setIsResolvingBandcamp(false);
    });
    if (triggerNotification) {
      triggerNotification(`🎵 Attached Bandcamp track "${track.title}" by ${track.artist}!`);
    }
  };

  useEffect(() => {
    if (!newPostImageUrl || !newPostImageUrl.toLowerCase().includes('bandcamp.com')) {
      setBandcampResolved(null);
      setIsResolvingBandcamp(false);
      return;
    }

    let isMounted = true;
    setIsResolvingBandcamp(true);

    const timer = setTimeout(async () => {
      try {
        const result = await resolveBandcampMetadata(newPostImageUrl);
        if (isMounted) {
          setBandcampResolved((prev) => {
            if (result && result.embedUrl) {
              return {
                ...result,
                title: result.title || prev?.title,
                artist: result.artist || prev?.artist,
                artwork: result.artwork || prev?.artwork,
              };
            }
            return prev || result;
          });
          setIsResolvingBandcamp(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsResolvingBandcamp(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [newPostImageUrl]);

  const [scrapedLocation, setScrapedLocation] = useState<string | null>(null);
  const [isScrapingLocation, setIsScrapingLocation] = useState<boolean>(false);
  const [includeAutoLocation, setIncludeAutoLocation] = useState<boolean>(false);

  // Real-time duplicate check for Show / Fest / Tour event details
  const dupCheck = useMemo(() => {
    return checkDuplicateCommunityEvent({
      title: eventTitle || '',
      date: eventDate || '',
      venue: eventLocationName || taggedVenue || '',
      ticketUrl: eventTicketUrl || '',
    });
  }, [eventTitle, eventDate, eventLocationName, taggedVenue, eventTicketUrl]);

  const handleClearEventDetails = () => {
    setEventTitle?.('');
    setEventDate?.('');
    setEventTime?.('');
    setEventLocationName?.('');
    setEventAddress?.('');
    setEventLineup?.('');
    setEventCost?.('');
    setEventTicketUrl?.('');
    setEventDescription?.('');
    setEventFlyerUrl?.('');
    setEventIsSecret?.(false);
    setEventData?.(null);
    triggerNotification?.('Event details cleared.');
  };

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionCursorPos, setMentionCursorPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (mentionQuery === null) {
      setMentionSuggestions([]);
      return;
    }
    
    const searchMentions = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      
      try {
        let query = supabase.from('profiles').select('id, name, full_name, console_handle, avatar, profile_image').limit(5);
        if (mentionQuery) {
          query = query.or(`console_handle.ilike.%${mentionQuery}%,name.ilike.%${mentionQuery}%`);
        }
        
        const { data, error } = await query;
        if (!error && data) {
          setMentionSuggestions(data);
        }
      } catch (e) {
        console.warn("Error fetching mentions:", e);
      }
    };
    
    // Simple debounce
    const timeout = setTimeout(searchMentions, 300);
    return () => clearTimeout(timeout);
  }, [mentionQuery]);

  const fetchAutoLocation = async () => {
    setIsScrapingLocation(true);
    const coords = await getCurrentCoordinates({ enableHighAccuracy: true, timeout: 10000 });
    if (!coords) {
      setIsScrapingLocation(false);
      if (triggerNotification) {
        triggerNotification(`📍 Location permission unavailable or not granted.`);
      }
      return;
    }

    const { latitude, longitude } = coords;
    let locName = '';
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.suburb || address.county || '';
        const state = address.state || address.state_code || address.country || '';

        if (city && state) {
          locName = `${city}, ${state}`;
        } else if (city) {
          locName = city;
        } else if (state) {
          locName = state;
        }
      }
    } catch (err) {
      // Fallback
    }
    
    const fullLoc = locName || 'Local Scene';
    setScrapedLocation(fullLoc);
    setIsScrapingLocation(false);
    setIncludeAutoLocation(false);
    if (triggerNotification) {
      triggerNotification(`📍 Location detected: ${fullLoc}`);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      fetchAutoLocation();
    }
  }, []);

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const isBandcampUrl = (url: string) => {
    if (!url) return false;
    return url.toLowerCase().includes('bandcamp.com');
  };

  const activeScheduledTime = externalScheduledTime || localScheduledTime;
  const updateScheduledTime = (val: string) => {
    setLocalScheduledTime(val);
    if (externalSetScheduledTime) externalSetScheduledTime(val);
  };



  const togglePanel = (panelName: string) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scrapedLocation && includeAutoLocation && setTaggedVenue && !taggedVenue) {
      setTaggedVenue(scrapedLocation);
    }
    if (activeScheduledTime) {
      if (handleSchedulePost) {
        handleSchedulePost(e, activeScheduledTime);
      } else {
        handleCreatePost(e);
      }
      const formatted = new Date(activeScheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      if (triggerNotification) {
        triggerNotification(`⏰ Transmission scheduled for dispatch on ${formatted}!`);
      }
      setShowScheduler(false);
      updateScheduledTime('');
    } else {
      handleCreatePost(e);
    }
  };

  const applyPresetHours = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    updateScheduledTime(localIso);
  };

  const applyPresetTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    updateScheduledTime(localIso);
  };

  const applyPresetFridayEvening = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(18, 0, 0, 0);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    updateScheduledTime(localIso);
  };

  const addTaggedBand = () => {
    if (tagBandInput.trim() && setTaggedBands) {
      if (!taggedBands.includes(tagBandInput.trim().toUpperCase())) {
        setTaggedBands([...taggedBands, tagBandInput.trim().toUpperCase()]);
      }
      setTagBandInput('');
    }
  };

  const removeTaggedBand = (bandToRemove: string) => {
    if (setTaggedBands) {
      setTaggedBands(taggedBands.filter((b) => b !== bandToRemove));
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewPostText(val);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    
    // Check if the user is typing an @mention
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
      
      // Calculate basic position
      // For a real robust solution, we'd use getBoundingClientRect or an off-screen mirror,
      // but a simple fixed absolute position works for MVP popups inside a relative container.
      setMentionCursorPos({ top: 30, left: 10 }); 
    } else {
      setMentionQuery(null);
      setMentionCursorPos(null);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % mentionSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(mentionSuggestions[mentionIndex]);
      } else if (e.key === 'Escape') {
        setMentionQuery(null);
        setMentionCursorPos(null);
      }
    }
  };

  const selectMention = (profile: any) => {
    const cursorPosition = textareaRef.current?.selectionStart || newPostText.length;
    const textBeforeCursor = newPostText.slice(0, cursorPosition);
    const textAfterCursor = newPostText.slice(cursorPosition);
    
    const textBeforeMatch = textBeforeCursor.replace(/@([a-zA-Z0-9_]*)$/, '');
    const mentionText = `@${profile.console_handle || profile.name} `;
    
    const finalVal = textBeforeMatch + mentionText + textAfterCursor;
    setNewPostText(finalVal);
    
    setMentionQuery(null);
    setMentionCursorPos(null);
    
    // Refocus and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = textBeforeMatch.length + mentionText.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const hasAttachments =
    Boolean(newPostImageUrl) ||
    selectedMediaFiles.length > 0 ||
    Boolean(youtubeUrl) ||
    Boolean(taggedVenue) ||
    Boolean(attachedSong) ||
    taggedBands.length > 0 ||
    Boolean(pollQuestion) ||
    Boolean(merchDropName) ||
    Boolean(tapeTitle || tapeAudioUrl) ||
    Boolean(eventTitle) ||
    Boolean(eventData) ||
    postScope !== 'public';

  return (
    <div 
      className={`w-full ${theme.cardBg} border rounded-2xl p-3.5 sm:p-5 transition-all mb-2 text-left relative overflow-hidden group ${theme.cardBorderGlow}`}
      style={theme.key === 'fan_only' ? { backgroundColor: '#00133b' } : undefined}
    >
      {/* Hidden file input for Tape Audio */}
      {handleTapeAudioUpload && (
        <input
          type="file"
          ref={tapeFileInputRef}
          onChange={handleTapeAudioUpload}
          accept="audio/*,.mp3,.wav,.m4a"
          className="hidden"
        />
      )}

      {/* Dynamic role background ambient glow */}
      <div 
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-500 opacity-25" 
        style={{ backgroundColor: theme.glowHex }}
      />

      {/* Header & Identity Section */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-zinc-800/80 mb-3 relative z-10">
        {/* Top Tier: User Identity (Avatar + Name + Sparkles + Role Badge) & Desktop Persona Switcher */}
        <div className="flex items-center justify-between gap-2 min-w-0 w-full">
          {/* Author Identity */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div 
              className="w-8 h-8 rounded-full border p-0.5 bg-black/60 shrink-0 overflow-hidden transition-all"
              style={{ borderColor: `${theme.glowHex}80`, boxShadow: `0 0 10px ${theme.glowHex}40` }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-black text-xs" style={{ color: theme.glowHex }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
              <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" style={{ color: theme.glowHex }} />
              <span className="text-[11.5px] sm:text-xs font-mono font-bold uppercase tracking-wider text-white truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[220px]">
                {displayName}
              </span>
              {/* Role Badge Tag */}
              <span className={`text-[8px] sm:text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 whitespace-nowrap ${theme.badgeBg} ${theme.badgeText} ${theme.accentBorder}`}>
                {roleBadgeTitle}
              </span>
            </div>
          </div>

          {/* Desktop Identity Selector */}
          {availablePersonas.length > 1 ? (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-[9px] font-mono text-zinc-400 shrink-0">Posting as:</span>
              <select
                value={activePersona.id}
                onChange={(e) => setPostIdentity(e.target.value)}
                className={`bg-[#07050d] text-[10px] font-mono font-bold border rounded-lg px-2.5 py-1 focus:outline-none transition-all cursor-pointer max-w-[220px] truncate ${theme.badgeText} ${theme.accentBorder}`}
                title="Select which workspace or band persona you are publishing as"
              >
                {availablePersonas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.roleBadge})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 ml-2 text-[9px] font-mono text-zinc-400">
              <span>Posting as:</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.accentBorder}`}>
                {activePersona.name}
              </span>
            </div>
          )}
        </div>

        {/* Sub-Tier: Location Scraper & Mobile Persona Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
          {/* Auto Location Scraper Display */}
          <div className="flex items-center gap-1 min-w-0">
            {isScrapingLocation ? (
              <span className="text-[9px] font-mono text-zinc-400 animate-pulse flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin text-rose-400" /> Scraper detecting location...
              </span>
            ) : scrapedLocation ? (
              <div className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/80 shadow-sm max-w-full">
                <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                <span className="truncate max-w-[150px] xs:max-w-[200px] sm:max-w-[260px] font-bold">{scrapedLocation}</span>
                <button
                  type="button"
                  title="Re-scrape current location"
                  onClick={fetchAutoLocation}
                  className="text-zinc-400 hover:text-white ml-0.5 cursor-pointer p-0.5"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  title={includeAutoLocation ? "Location attached to post. Click to detach." : "Click to attach location to post."}
                  onClick={() => {
                    const next = !includeAutoLocation;
                    setIncludeAutoLocation(next);
                    if (next) {
                      if (setTaggedVenue && scrapedLocation) {
                        setTaggedVenue(scrapedLocation);
                      }
                    } else {
                      if (setTaggedVenue && taggedVenue === scrapedLocation) {
                        setTaggedVenue('');
                      }
                    }
                  }}
                  className={`ml-1 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    includeAutoLocation ? 'bg-emerald-800 text-white shadow-sm' : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {includeAutoLocation ? 'ATTACHED ✓' : '+ ATTACH'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={fetchAutoLocation}
                className={`text-[9px] font-mono hover:text-white flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${theme.badgeBg} ${theme.badgeText} ${theme.accentBorder}`}
              >
                <MapPin className="w-2.5 h-2.5 text-rose-400" />
                <span>Detect Location</span>
              </button>
            )}
          </div>

          {/* Mobile-Only Persona Switcher (Clean dedicated full-width strip on mobile) */}
          {availablePersonas.length > 1 && (
            <div className="flex sm:hidden items-center justify-between gap-1.5 w-full bg-black/40 px-2.5 py-1.5 rounded-lg border border-zinc-800/80 mt-0.5">
              <span className="text-[9px] font-mono text-zinc-400 shrink-0 font-bold uppercase tracking-wider">Posting as:</span>
              <select
                value={activePersona.id}
                onChange={(e) => setPostIdentity(e.target.value)}
                className={`bg-[#07050d] text-[10px] font-mono font-bold border rounded-md px-2 py-1 focus:outline-none transition-all cursor-pointer flex-1 max-w-[210px] truncate ml-1 ${theme.badgeText} ${theme.accentBorder}`}
                title="Select which workspace or band persona you are publishing as"
              >
                {availablePersonas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.roleBadge})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-3">
        {/* Main Textarea Input with Monospace Transmission Character Counter */}
        <div className="relative w-full">
          <textarea
            ref={textareaRef}
            value={newPostText}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Share an update, photo, or setlist from the pit..."
            maxLength={1000}
            className={`w-full bg-[#0d0914] border rounded-xl p-3 pb-7 text-xs text-white placeholder:text-zinc-600 focus:outline-none font-mono resize-none min-h-[95px] transition-all ${theme.inputBorder} ${theme.inputFocus}`}
            rows={4}
          />
          <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-zinc-500 select-none pointer-events-none">
            {newPostText.length} / 1000
          </div>
          
          {/* Mention Popover */}
          {mentionQuery !== null && mentionCursorPos && (
            <div 
              className="absolute z-50 bg-[#111319] border border-[#00ffcc]/30 rounded-xl shadow-2xl overflow-hidden w-64 max-h-48 overflow-y-auto"
              style={{ top: mentionCursorPos.top + 20, left: mentionCursorPos.left }}
            >
              {mentionSuggestions.length > 0 ? (
                <div className="flex flex-col">
                  {mentionSuggestions.map((prof, i) => (
                    <button
                      type="button"
                      key={prof.id ? `mention-${prof.id}-${i}` : `mention-${i}`}
                      className={`flex items-center gap-2 p-2 w-full text-left transition-colors ${
                        i === mentionIndex ? 'bg-[#00ffcc]/20' : 'hover:bg-zinc-800'
                      }`}
                      onClick={() => selectMention(prof)}
                    >
                      <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0">
                        {(prof.avatar || prof.profile_image) ? (
                          <img src={prof.avatar || prof.profile_image} className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-bold uppercase">
                            {(prof.console_handle || prof.name || 'U').charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="text-xs font-mono font-bold text-white truncate">
                          {prof.console_handle || prof.name || 'Unknown'}
                        </span>
                        {prof.full_name && (
                          <span className="text-[9px] font-mono text-zinc-400 truncate">
                            {prof.full_name}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-xs font-mono text-zinc-500 text-center">
                  {mentionQuery ? 'No profiles found.' : 'Type a handle to search...'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flyer & Tour Announcement Smart Companion Prompt (Completely Optional) */}
        {(Boolean(newPostImageUrl) || selectedMediaFiles.length > 0) && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-zinc-950/80 to-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <Ticket className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400">
                    🎪 Sharing a Show, Fest or Tour Flyer?
                  </span>
                  <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 font-bold">
                    OPTIONAL
                  </span>
                </div>
                <p className="text-[10px] text-zinc-300 font-mono leading-tight mt-0.5">
                  {eventTitle
                    ? `Attached Event: "${eventTitle}" (${eventDate || 'Date set'} @ ${eventLocationName || taggedVenue || 'Venue set'})`
                    : 'Attach ticket links & date details to generate an interactive event page on the scene calendar with duplicate prevention.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => togglePanel('event')}
                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  eventTitle
                    ? 'bg-amber-500 text-black border-amber-400 hover:bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/60 text-amber-300 hover:text-white'
                }`}
              >
                {eventTitle ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>EDIT EVENT PAGE</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ADD EVENT / TICKETS</span>
                  </>
                )}
              </button>

              {eventTitle && (
                <button
                  type="button"
                  onClick={handleClearEventDetails}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove event details"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reordered & Refactored Action Buttons Layout */}
        <div className="space-y-2">
          {/* Row 1: +PHOTO/ MEDIA, +EVENT / TICKETS */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => togglePanel('media')}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activePanel === 'media' || newPostImageUrl || selectedMediaFiles.length > 0
                  ? theme.activeBtnStyle
                  : theme.inactiveBtnStyle
              }`}
            >
              <ImageIcon className="w-3 h-3 shrink-0" style={{ color: theme.glowHex }} />
              <span className="truncate">+PHOTO/ MEDIA</span>
            </button>

            <button
              type="button"
              onClick={() => togglePanel('event')}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                eventTitle || eventData || activePanel === 'event'
                  ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)] font-bold'
                  : theme.inactiveBtnStyle
              }`}
            >
              <Ticket className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="truncate text-amber-300">
                {eventTitle ? '✓ EVENT ATTACHED' : '+EVENT / TICKETS'}
              </span>
            </button>
          </div>

          {/* Row 2: +Video, +Music, +Poll */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => togglePanel('video')}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activePanel === 'video' || youtubeUrl
                  ? theme.activeBtnStyle
                  : theme.inactiveBtnStyle
              }`}
            >
              <Video className="w-3 h-3 shrink-0" style={{ color: theme.glowHex }} />
              <span className="truncate">+VIDEO</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (setShowSongModal) setShowSongModal(true);
                else togglePanel('song');
              }}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                attachedSong || activePanel === 'song'
                  ? theme.activeBtnStyle
                  : theme.inactiveBtnStyle
              }`}
            >
              <Music className="w-3 h-3 shrink-0" style={{ color: theme.glowHex }} />
              <span className="truncate">+MUSIC</span>
            </button>

            <button
              type="button"
              onClick={() => togglePanel('poll')}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activePanel === 'poll' || pollQuestion
                  ? theme.activeBtnStyle
                  : theme.inactiveBtnStyle
              }`}
            >
              <BarChart2 className="w-3 h-3 shrink-0" style={{ color: theme.glowHex }} />
              <span className="truncate">+POLL</span>
            </button>
          </div>

          {/* Row 3: +Merch Drop, +Tape/ Demo */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                if (setShowMerchDropModal) setShowMerchDropModal(true);
                else togglePanel('merch');
              }}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                merchDropName || activePanel === 'merch'
                  ? theme.activeBtnStyle
                  : theme.inactiveBtnStyle
              }`}
            >
              <ShoppingBag className="w-3 h-3 shrink-0" style={{ color: theme.glowHex }} />
              <span className="truncate">+MERCH DROP</span>
            </button>

            <button
              type="button"
              onClick={() => togglePanel('tape')}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activePanel === 'tape' || tapeTitle || tapeAudioUrl
                  ? theme.activeBtnStyle
                  : theme.inactiveBtnStyle
              }`}
            >
              <Radio className="w-3 h-3 animate-pulse shrink-0" style={{ color: theme.glowHex }} />
              <span className="truncate">+TAPE/ DEMO</span>
            </button>
          </div>

          {/* Row 4: +Tag Band, +Tag Venue, +Scope (3-Button Layout) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => togglePanel('band')}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activePanel === 'band' || taggedBands.length > 0
                  ? theme.activeBtnStyle
                  : theme.inactiveBtnStyle
              }`}
            >
              <Users className="w-3 h-3 shrink-0" style={{ color: theme.glowHex }} />
              <span className="truncate">+TAG BAND</span>
            </button>

            <button
              type="button"
              onClick={() => togglePanel('venue')}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activePanel === 'venue' || taggedVenue
                  ? theme.activeBtnStyle
                  : theme.inactiveBtnStyle
              }`}
            >
              <MapPin className="w-3 h-3 shrink-0" style={{ color: theme.glowHex }} />
              <span className="truncate">+VENUE</span>
            </button>

            <button
              type="button"
              onClick={() => togglePanel('scope')}
              className={`w-full px-2 py-2 rounded-xl border text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activePanel === 'scope' || postScope !== 'public'
                  ? theme.activeBtnStyle
                  : theme.inactiveBtnStyle
              }`}
            >
              <Globe className="w-3 h-3 shrink-0" style={{ color: theme.glowHex }} />
              <span className="truncate">+SCOPE</span>
            </button>
          </div>
        </div>

        {/* Dynamic Panels */}

        {/* Media Input Panel (Native Images, Audio Stems & Bandcamp Link Resolver) */}
        {activePanel === 'media' && (
          <div className={`${theme.panelBg} p-3.5 rounded-xl border ${theme.panelBorder} space-y-3 animate-in fade-in duration-150`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${theme.badgeText} font-bold uppercase`}>
              <div className="flex items-center gap-1.5">
                <ImageIcon className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>UPLOAD PHOTOS, AUDIO STEMS, OR BANDCAMP LINK</span>
              </div>
              <button type="button" onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
            </div>

            {/* 1. Native file upload for images and audio files (.mp3, .wav) with centered text (Drop Zone First) */}
            <label className={`flex flex-col items-center justify-center text-center w-full min-h-[85px] border-2 ${theme.inputBorder} border-dashed rounded-xl cursor-pointer ${theme.innerPanelBg} hover:opacity-90 transition-colors p-3`}>
              <div className="flex flex-col items-center justify-center text-center">
                <Upload className={`w-5 h-5 mb-1.5 ${theme.accentText}`} />
                <p className="text-[10px] font-mono text-zinc-300 font-bold text-center">CLICK OR DRAG NATIVE IMAGES & AUDIO (.MP3, .WAV)</p>
                <p className="text-[9px] font-mono text-zinc-500 text-center mt-0.5">Supports PNG, JPG, WEBP, MP3, WAV up to 10MB</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*,audio/*,.mp3,.wav,.flac,.m4a" 
                multiple 
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const oversized = files.find(f => f.size > 10 * 1024 * 1024);
                  if (oversized) {
                    if (triggerNotification) triggerNotification("⚠️ File exceeds 10MB payload limit.");
                    return;
                  }
                  if (handleMediaUpload) handleMediaUpload(e);
                }} 
              />
            </label>

            {/* 2. Album Organizer Picker (Existing Photo Pit Albums Only) */}
            <div className={`${theme.innerPanelBg} p-2.5 rounded-xl border ${theme.inputBorder} space-y-2`}>
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 font-bold uppercase">
                <span className={`flex items-center gap-1 ${theme.badgeText}`}>
                  <Folder className={`w-3 h-3 ${theme.accentText}`} /> PHOTO PIT ALBUM
                </span>
                {!isCreatingNewAlbum && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewAlbum(true)}
                    className={`${theme.accentText} hover:opacity-80 flex items-center gap-1 font-bold cursor-pointer`}
                  >
                    <Plus className="w-3 h-3" /> CREATE NEW ALBUM
                  </button>
                )}
              </div>

              {isCreatingNewAlbum ? (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Enter new Photo Pit album title..."
                    value={newAlbumInput}
                    onChange={(e) => setNewAlbumInput(e.target.value)}
                    className={`flex-1 ${theme.panelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-1.5 font-mono ${theme.inputFocus}`}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (newAlbumInput.trim()) {
                        const name = newAlbumInput.trim();
                        let nextList = availableAlbums;
                        if (!availableAlbums.some(a => a.toLowerCase() === name.toLowerCase())) {
                          nextList = [...availableAlbums, name];
                          setAvailableAlbums(nextList);
                          await persistPhotoPitFolders(nextList, userProfile, portalRole, setUserProfile);
                        }
                        setSelectedAlbum(name);
                        setNewAlbumInput('');
                        setIsCreatingNewAlbum(false);
                        if (triggerNotification) triggerNotification(`📁 Created Photo Pit album "${name}"`);
                      }
                    }}
                    className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-rose-700 cursor-pointer"
                  >
                    SAVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewAlbum(false)}
                    className="text-zinc-500 hover:text-zinc-300 text-[10px] font-mono p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={selectedAlbum}
                  onChange={(e) => setSelectedAlbum(e.target.value)}
                  className={`w-full ${theme.panelBg} text-xs ${theme.badgeText} border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus} cursor-pointer`}
                >
                  {availableAlbums.map((album, idx) => (
                    <option key={`album-${album}-${idx}`} value={album} className="bg-black text-white">
                      📁 Photo Pit: {album}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 2.8 Search Songs on Bandcamp Helper */}
            <BandcampSearchHelper
              onSelectTrack={handleSelectBandcampTrack}
              theme={theme}
            />

            {/* 3. Direct Image or Bandcamp URL input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">Or Paste Direct Image / Bandcamp Track Link</label>
                {isBandcampUrl(newPostImageUrl) && (
                  <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30 animate-pulse">
                    ⚡ Smart Bandcamp Slug Resolver Active
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="https://artistname.bandcamp.com/track/symbiotic-voracity..."
                value={newPostImageUrl}
                onChange={(e) => setNewPostImageUrl(normalizeBandcampUrl(e.target.value))}
                className={`w-full ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
              />
            </div>

            {/* 4. Live Bandcamp Embed Player Resolver in Composer */}
            {isBandcampUrl(newPostImageUrl) && (
              <div className="space-y-2 animate-in fade-in">
                {isResolvingBandcamp && !bandcampResolved ? (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wide">
                        RESOLVING BANDCAMP EMBED STREAM...
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500">Connecting to Bandcamp</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold px-1">
                      <span className="text-cyan-300 flex items-center gap-1.5">
                        <Disc className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                        BANDCAMP EMBED PLAYER PREVIEW
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPostImageUrl('');
                          setBandcampResolved(null);
                        }}
                        className="text-zinc-500 hover:text-cyan-400 text-[9px] font-mono font-bold uppercase transition-colors"
                      >
                        CLEAR LINK
                      </button>
                    </div>

                    <BandcampEmbedCard
                      embedUrl={bandcampResolved?.embedUrl || (newPostImageUrl.includes('EmbeddedPlayer') ? newPostImageUrl : null)}
                      title={bandcampResolved?.title}
                      artist={bandcampResolved?.artist}
                      artworkUrl={bandcampResolved?.artwork}
                      pageUrl={bandcampResolved?.pageUrl || newPostImageUrl}
                      itemType={bandcampResolved?.itemType}
                      variant="feed"
                      compact={false}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Media Files Thumbnails */}
            {selectedMediaFiles && selectedMediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedMediaFiles.map((file, idx) => (
                  <div key={`media-file-${file.file?.name || file.url}-${idx}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-purple-900/40 bg-zinc-950">
                    {file.type === 'image' ? (
                      <img src={file.url} alt="upload preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-purple-950/80">
                        <Music className="w-4 h-4 text-purple-300" />
                        <span className="text-[8px] font-mono text-purple-200 mt-1 truncate max-w-full">AUDIO</span>
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => {
                        if (setSelectedMediaFiles) {
                          setSelectedMediaFiles(selectedMediaFiles.filter((_, i) => i !== idx));
                        }
                      }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-rose-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video Panel - Strictly YouTube Links & Preview Resolver */}
        {activePanel === 'video' && (
          <div className={`${theme.panelBg} p-3.5 rounded-xl border ${theme.panelBorder} space-y-3 animate-in fade-in duration-150`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${theme.badgeText} font-bold uppercase`}>
              <div className="flex items-center gap-1.5">
                <Video className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>STRICTLY YOUTUBE VIDEO LINK & PREVIEW RESOLVER</span>
              </div>
              <button type="button" onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
            </div>

            <input
              type="text"
              placeholder="Paste YouTube Link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl && setYoutubeUrl(e.target.value)}
              className={`w-full ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2.5 font-mono ${theme.inputFocus}`}
            />

            {/* YouTube Live Thumbnail Preview Resolver */}
            {youtubeUrl && (
              <div>
                {getYouTubeVideoId(youtubeUrl) ? (
                  <div className={`p-3 rounded-xl bg-zinc-950 border ${theme.inputBorder} flex flex-col sm:flex-row items-center gap-3`}>
                    <div className="relative w-full sm:w-36 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-black group">
                      <img
                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(youtubeUrl)}/hqdefault.jpg`}
                        alt="YouTube Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-rose-500 drop-shadow-md" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1 text-left">
                      <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-mono font-bold uppercase">
                        <Youtube className="w-3.5 h-3.5" />
                        <span>YOUTUBE LINK RESOLVED</span>
                      </div>
                      <p className="text-xs font-bold text-white truncate font-mono">
                        Video ID: {getYouTubeVideoId(youtubeUrl)}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">Ready for inline embed & video playback in feed</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setYoutubeUrl && setYoutubeUrl('')}
                      className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-300 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-900 shrink-0 cursor-pointer"
                    >
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-900/60 text-[10px] font-mono text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Enter a valid YouTube URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Transmission Scope / Audience Privacy Panel */}
        {activePanel === 'scope' && (
          <div className={`${theme.panelBg} p-3.5 rounded-xl border ${theme.panelBorder} space-y-3 animate-in fade-in duration-150`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${theme.badgeText} font-bold uppercase`}>
              <div className="flex items-center gap-1.5">
                <Globe className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>SELECT TRANSMISSION SCOPE / AUDIENCE PRIVACY</span>
              </div>
              <button type="button" onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPostScope('public')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  postScope === 'public'
                    ? `${theme.panelHeaderBg} ${theme.accentBorder} text-white`
                    : `${theme.innerPanelBg} border-zinc-800/80 text-zinc-400 hover:text-zinc-200`
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold uppercase ${theme.accentText} flex items-center gap-1`}>
                    <Globe className={`w-3 h-3 ${theme.accentText}`} /> PUBLIC
                  </span>
                  {postScope === 'public' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[9px] text-zinc-500 font-mono leading-tight">All pit members & global scene feed</p>
              </button>

              <button
                type="button"
                onClick={() => setPostScope('followers')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  postScope === 'followers'
                    ? `${theme.panelHeaderBg} ${theme.accentBorder} text-white`
                    : `${theme.innerPanelBg} border-zinc-800/80 text-zinc-400 hover:text-zinc-200`
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold uppercase ${theme.accentText} flex items-center gap-1`}>
                    <Users className={`w-3 h-3 ${theme.accentText}`} /> FOLLOWERS ONLY
                  </span>
                  {postScope === 'followers' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[9px] text-zinc-500 font-mono leading-tight">Restricted to your scene crew & followers</p>
              </button>

              <button
                type="button"
                onClick={() => setPostScope('private')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  postScope === 'private'
                    ? `${theme.panelHeaderBg} ${theme.accentBorder} text-white`
                    : `${theme.innerPanelBg} border-zinc-800/80 text-zinc-400 hover:text-zinc-200`
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold uppercase ${theme.accentText} flex items-center gap-1`}>
                    <Lock className={`w-3 h-3 ${theme.accentText}`} /> SELECT MEMBERS
                  </span>
                  {postScope === 'private' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[9px] text-zinc-500 font-mono leading-tight">Private transmission to tagged band or direct crew</p>
              </button>
            </div>
          </div>
        )}

        {/* Tag Venue Panel */}
        {activePanel === 'venue' && (
          <div className={`${theme.panelBg} p-3 rounded-xl border ${theme.panelBorder} space-y-2 animate-in fade-in duration-150`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${theme.badgeText} font-bold uppercase`}>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                TAG VENUE & SHOW LOCATION
              </span>
              <button type="button" onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
            </div>

            <VenueAutocompleteInput
              value={taggedVenue}
              onChange={(venue, venueData) => {
                if (setTaggedVenue) setTaggedVenue(venue);
                if (venueData && !eventLocationName && setEventLocationName) {
                  setEventLocationName(venueData.name);
                }
                if (venueData?.fullAddress && !eventAddress && setEventAddress) {
                  setEventAddress(venueData.fullAddress);
                }
              }}
              placeholder="Search Black Book or Google Places venue (e.g. Chain Reaction, The Echo)..."
              theme={{
                innerPanelBg: theme.innerPanelBg,
                inputBorder: theme.inputBorder,
                inputFocus: theme.inputFocus,
                badgeBg: theme.badgeBg,
                badgeText: theme.badgeText,
                accentText: theme.accentText
              }}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}

        {/* Tag Band Panel */}
        {activePanel === 'band' && (
          <div className={`${theme.panelBg} p-3 rounded-xl border ${theme.panelBorder} space-y-2.5 animate-in fade-in duration-150`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${theme.badgeText} font-bold uppercase`}>
              <span className="flex items-center gap-1.5">
                <Music className={`w-3.5 h-3.5 ${theme.accentText}`} />
                TAG BAND PROFILES IN THIS POST
              </span>
              <button type="button" onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
            </div>
            
            <BandTagAutocomplete
              taggedBands={taggedBands}
              onAddBand={(bandName) => {
                if (setTaggedBands && !taggedBands.includes(bandName)) {
                  setTaggedBands([...taggedBands, bandName]);
                }
              }}
              onRemoveBand={(bandName) => {
                if (setTaggedBands) {
                  setTaggedBands(taggedBands.filter((b) => b !== bandName));
                }
              }}
              availableBands={bands}
              theme={{
                innerPanelBg: theme.innerPanelBg,
                inputBorder: theme.inputBorder,
                inputFocus: theme.inputFocus,
                badgeBg: theme.badgeBg,
                badgeText: theme.badgeText,
                accentText: theme.accentText,
                accentBg: theme.accentBg,
                accentBorder: theme.accentBorder,
                attachedTagBg: theme.attachedTagBg
              }}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}

        {/* Attach Song / Track Panel */}
        {activePanel === 'song' && (
          <div className={`${theme.panelBg} p-3.5 rounded-xl border ${theme.panelBorder} space-y-3 animate-in fade-in duration-150`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${theme.badgeText} font-bold uppercase`}>
              <div className="flex items-center gap-1.5">
                <Music className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>ATTACH SONG / SCENE TRACK</span>
              </div>
              <div className="flex items-center gap-2">
                {setShowSongModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSongModal(true);
                      setActivePanel(null);
                    }}
                    className={`text-[9px] font-mono font-bold ${theme.accentText} hover:opacity-80 ${theme.badgeBg} px-2 py-0.5 rounded border ${theme.accentBorder}`}
                  >
                    CATALOG POPUP
                  </button>
                )}
                <button type="button" onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {attachedSong ? (
              <div className={`flex items-center justify-between p-2.5 rounded-lg ${theme.badgeBg} border ${theme.accentBorder}`}>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${theme.badgeText} truncate`}>{attachedSong.title}</p>
                  <p className={`text-[10px] ${theme.accentText} font-mono truncate`}>{attachedSong.band || 'Scene Track'} • {attachedSong.album || 'Single'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedSong && setAttachedSong(null)}
                  className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 px-2.5 py-1 rounded bg-red-950/60 border border-red-900 ml-2 cursor-pointer"
                >
                  REMOVE
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter track title or artist name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.currentTarget as HTMLInputElement).value.trim();
                      if (val && setAttachedSong) {
                        setAttachedSong({
                          id: `custom-${Date.now()}`,
                          title: val,
                          band: 'Featured Artist',
                          album: 'Scene Audio',
                          duration: '3:30'
                        });
                      }
                    }
                  }}
                  className={`w-full ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
                />
                <p className="text-[10px] text-zinc-500 font-mono">Press Enter to attach custom song name, or use CATALOG POPUP to search scene catalog.</p>
              </div>
            )}
          </div>
        )}

        {/* Setlist Poll Panel */}
        {activePanel === 'poll' && (
          <div className={`${theme.panelBg} p-3.5 rounded-xl border ${theme.panelBorder} space-y-3 animate-in fade-in duration-150`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${theme.badgeText} font-bold uppercase`}>
              <div className="flex items-center gap-1.5">
                <BarChart2 className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>CREATE COMMUNITY / SETLIST POLL</span>
              </div>
              <div className="flex items-center gap-2">
                {setShowPollModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPollModal(true);
                      setActivePanel(null);
                    }}
                    className={`text-[9px] font-mono font-bold ${theme.accentText} hover:opacity-80 ${theme.badgeBg} px-2 py-0.5 rounded border ${theme.accentBorder}`}
                  >
                    EXPAND FULL POPUP
                  </button>
                )}
                <button type="button" onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Poll Type Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPollVariant && setPollVariant('standard')}
                className={`py-1.5 px-2 rounded text-[9px] font-mono font-bold uppercase border transition-colors ${
                  pollVariant === 'standard'
                    ? `${theme.badgeBg} ${theme.accentBorder} ${theme.badgeText}`
                    : `${theme.innerPanelBg} border-zinc-800 text-zinc-500 hover:text-zinc-300`
                }`}
              >
                STANDARD POLL
              </button>
              <button
                type="button"
                onClick={() => setPollVariant && setPollVariant('encore_setlist')}
                className={`py-1.5 px-2 rounded text-[9px] font-mono font-bold uppercase border transition-colors ${
                  pollVariant === 'encore_setlist'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : `${theme.innerPanelBg} border-zinc-800 text-zinc-500 hover:text-zinc-300`
                }`}
              >
                ENCORE SETLIST
              </button>
              <button
                type="button"
                onClick={() => setPollVariant && setPollVariant('promoter_lineup')}
                className={`py-1.5 px-2 rounded text-[9px] font-mono font-bold uppercase border transition-colors ${
                  pollVariant === 'promoter_lineup'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : `${theme.innerPanelBg} border-zinc-800 text-zinc-500 hover:text-zinc-300`
                }`}
              >
                PROMOTER LINEUP
              </button>
            </div>

            <input
              type="text"
              placeholder={
                pollVariant === 'encore_setlist'
                  ? "e.g. Which song should the headliner play for the finale?"
                  : pollVariant === 'promoter_lineup'
                  ? "e.g. Which support act should open the Minneapolis gig?"
                  : "Poll Question (e.g. WHAT IS YOUR CURRENT TOP BDM BAND?)"
              }
              value={pollQuestion}
              onChange={(e) => setPollQuestion && setPollQuestion(e.target.value)}
              className={`w-full ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
            />

            <div className="space-y-1.5">
              {pollOptions.map((opt, idx) => (
                <div key={`poll-option-${idx}`} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}...`}
                    value={opt}
                    onChange={(e) => {
                      if (setPollOptions) {
                        const updated = [...pollOptions];
                        updated[idx] = e.target.value;
                        setPollOptions(updated);
                      }
                    }}
                    className={`flex-1 ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-1.5 font-mono ${theme.inputFocus}`}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (setPollOptions) {
                          setPollOptions(pollOptions.filter((_, i) => i !== idx));
                        }
                      }}
                      className="text-zinc-500 hover:text-rose-400 px-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {pollOptions.length < 6 && setPollOptions && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className={`text-[10px] font-mono ${theme.accentText} font-bold uppercase flex items-center gap-1`}
              >
                <ListPlus className="w-3 h-3" />
                <span>+ ADD OPTION</span>
              </button>
            )}

            {/* Timed Poll / Deadline Option */}
            <div className={`pt-2.5 border-t ${theme.inputBorder} space-y-2`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pollIsTimed}
                    onChange={(e) => setPollIsTimed && setPollIsTimed(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/20 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5 text-amber-400 font-extrabold uppercase text-[10px] tracking-wide">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> TIMED POLL / DEADLINE
                  </span>
                </label>
                {pollIsTimed && (
                  <span className="text-[9px] font-mono text-amber-400/80 uppercase font-bold">
                    {parseInt(pollTimerDays || '0') > 0 ? `${pollTimerDays}d ` : ''}{pollTimerHours}h limit
                  </span>
                )}
              </div>

              {pollIsTimed && (
                <div className={`p-2.5 ${theme.innerPanelBg} rounded-xl border border-amber-500/30 space-y-2 animate-in fade-in duration-200`}>
                  <div className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Voting Closes In:</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '1 HOUR', days: '0', hours: '1' },
                      { label: '24 HOURS', days: '1', hours: '0' },
                      { label: '3 DAYS', days: '3', hours: '0' },
                      { label: '7 DAYS', days: '7', hours: '0' },
                    ].map((preset, pIdx) => (
                      <button
                        key={`poll-preset-${preset.label}-${pIdx}`}
                        type="button"
                        onClick={() => {
                          setPollTimerDays && setPollTimerDays(preset.days);
                          setPollTimerHours && setPollTimerHours(preset.hours);
                        }}
                        className={`py-1 px-1 rounded text-[8px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                          pollTimerDays === preset.days && pollTimerHours === preset.hours
                            ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] font-mono text-zinc-400 font-bold shrink-0">Days:</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={pollTimerDays}
                      onChange={(e) => setPollTimerDays && setPollTimerDays(e.target.value)}
                      className="w-14 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[9px] font-mono text-zinc-400 font-bold shrink-0">Hours:</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={pollTimerHours}
                      onChange={(e) => setPollTimerHours && setPollTimerHours(e.target.value)}
                      className="w-14 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Merch Drop Panel */}
        {activePanel === 'merch' && (
          <div className={`${theme.panelBg} p-3.5 rounded-xl border ${theme.panelBorder} space-y-2 animate-in fade-in duration-150`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${theme.badgeText} font-bold uppercase`}>
              <div className="flex items-center gap-1.5">
                <ShoppingBag className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>MERCH DROP / EXCLUSIVE ITEM</span>
              </div>
              <div className="flex items-center gap-2">
                {setShowMerchDropModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMerchDropModal(true);
                      setActivePanel(null);
                    }}
                    className={`text-[9px] font-mono font-bold ${theme.accentText} hover:opacity-80 ${theme.badgeBg} px-2 py-0.5 rounded border ${theme.accentBorder}`}
                  >
                    EXPAND FULL POPUP
                  </button>
                )}
                <button type="button" onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Item Name (e.g. Hail Space 2.0 T-Shirt)..."
                value={merchDropName}
                onChange={(e) => setMerchDropName && setMerchDropName(e.target.value)}
                className={`col-span-2 ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
              />
              <input
                type="text"
                placeholder="Price ($)..."
                value={merchDropPrice}
                onChange={(e) => setMerchDropPrice && setMerchDropPrice(e.target.value)}
                className={`${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
              />
            </div>
          </div>
        )}

        {/* Tape / Reel Panel (Complete Retro Cassette Creator) */}
        {activePanel === 'tape' && (
          <div className={`${theme.panelBg} p-4 rounded-xl border ${theme.panelBorder} space-y-3 animate-in fade-in duration-150`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${theme.badgeText} font-bold uppercase border-b ${theme.inputBorder} pb-2`}>
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${theme.accentText} animate-pulse`} />
                <span className={`font-black tracking-wider ${theme.badgeText}`}>🎵 CASSETTE TAPE / LIVE BOOTLEG REEL CREATOR</span>
              </div>
              <button type="button" onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
            </div>

            {/* Audio Upload Button */}
            <div className={`flex flex-col sm:flex-row items-center gap-3 ${theme.innerPanelBg} p-3 rounded-lg border ${theme.inputBorder}`}>
              <button
                type="button"
                disabled={isUploadingTapeAudio}
                onClick={() => tapeFileInputRef?.current?.click()}
                className={`w-full sm:w-auto px-4 py-2 ${theme.badgeBg} hover:${theme.accentBg} border ${theme.accentBorder} rounded-lg ${theme.badgeText} text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all`}
              >
                <Upload className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>{isUploadingTapeAudio ? 'UPLOADING AUDIO...' : 'UPLOAD AUDIO FILE (.MP3/.WAV)'}</span>
              </button>
              <div className="text-[10px] font-mono text-zinc-400 truncate max-w-xs">
                {tapeAudioFileName ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {tapeAudioFileName}
                  </span>
                ) : (
                  <span>Attach live bootleg audio, soundboard rip, or reel</span>
                )}
              </div>
            </div>

            {/* Tape Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className={`text-[9px] font-mono ${theme.accentText} uppercase font-bold block mb-1`}>Tape Title</label>
                <input
                  type="text"
                  placeholder="e.g. Detroit '89 Basement Soundboard Rip"
                  value={tapeTitle}
                  onChange={(e) => setTapeTitle && setTapeTitle(e.target.value)}
                  className={`w-full ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
                />
              </div>

              <div>
                <label className={`text-[9px] font-mono ${theme.accentText} uppercase font-bold block mb-1`}>Band / Artist Name</label>
                <input
                  type="text"
                  placeholder="e.g. IMMOLATION"
                  value={tapeBand}
                  onChange={(e) => setTapeBand && setTapeBand(e.target.value)}
                  className={`w-full ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
                />
              </div>

              <div>
                <label className={`text-[9px] font-mono ${theme.accentText} uppercase font-bold block mb-1`}>Recording Date</label>
                <input
                  type="text"
                  placeholder="e.g. OCT 14, 1989"
                  value={tapeDate}
                  onChange={(e) => setTapeDate && setTapeDate(e.target.value)}
                  className={`w-full ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
                />
              </div>

              <div>
                <label className={`text-[9px] font-mono ${theme.accentText} uppercase font-bold block mb-1`}>Tape Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 42:15"
                  value={tapeDuration}
                  onChange={(e) => setTapeDuration && setTapeDuration(e.target.value)}
                  className={`w-full ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
                />
              </div>
            </div>

            <div>
              <label className={`text-[9px] font-mono ${theme.accentText} uppercase font-bold block mb-1`}>Direct Audio Stream / MP3 URL (Optional)</label>
              <input
                type="text"
                placeholder="https://... (or use file uploader above)"
                value={tapeAudioUrl}
                onChange={(e) => setTapeAudioUrl && setTapeAudioUrl(e.target.value)}
                className={`w-full ${theme.innerPanelBg} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder} rounded-lg p-2 font-mono ${theme.inputFocus}`}
              />
            </div>
          </div>
        )}

        {/* Event, Fest, Tour & Ticket Details Panel (Completely Optional) */}
        {activePanel === 'event' && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0e0a05] border border-amber-500/40 space-y-3.5 animate-in fade-in duration-150 text-left shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 font-bold uppercase pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-400" />
                <span className="tracking-wider">SHOW, FEST & TOUR DETAILS (OPTIONAL)</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-950/80 text-amber-400 border border-amber-500/30 font-normal">
                  CREATES EVENT PAGE
                </span>
              </div>
              <div className="flex items-center gap-2">
                {setShowEventModal && (
                  <button
                    type="button"
                    onClick={() => setShowEventModal(true)}
                    className="text-[9px] text-amber-400/80 hover:text-amber-300 underline font-mono flex items-center gap-1 cursor-pointer"
                    title="Open expanded modal studio"
                  >
                    FULL STUDIO ↗
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Smart Deduplication Banner */}
            {dupCheck.isDuplicate && dupCheck.matchedEvent ? (
              <div className="p-3 bg-amber-950/70 border-2 border-amber-500/70 rounded-xl text-amber-200 text-xs space-y-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <div className="flex items-center gap-1.5 font-bold font-mono text-[11px] text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Existing Event Page Detected ({dupCheck.matchReason})</span>
                </div>
                <p className="text-[11px] text-zinc-200 font-mono">
                  Matches <strong className="text-amber-300 font-bold">"{dupCheck.matchedEvent.name}"</strong> on {dupCheck.matchedEvent.date} @ {dupCheck.matchedEvent.venue_name}.
                </p>
                <div className="p-2 rounded-lg bg-black/40 border border-amber-500/30 flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    ✓ Deduplication Active: Posting will link to this existing event page to avoid duplicates and consolidate RSVP attendance & tickets!
                  </span>
                </div>
              </div>
            ) : (
              eventTitle && (
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    ✨ New Event Page: A fresh scene event page will be generated upon posting for "{eventTitle}".
                  </span>
                </div>
              )
            )}

            {/* Event Category Pills */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-amber-400 font-bold block">
                EVENT TYPE / CATEGORY
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'DIY Show', label: 'DIY SHOW', icon: '🎸' },
                  { id: 'Fest / Festival', label: 'FESTIVAL', icon: '🎪' },
                  { id: 'Tour Date', label: 'TOUR DATE', icon: '🚐' },
                  { id: 'Club Gig', label: 'CLUB GIG', icon: '⚡' },
                  { id: 'Warehouse Rave', label: 'WAREHOUSE RAVE', icon: '🔊' },
                  { id: 'House Party', label: 'HOUSE PARTY', icon: '🎉' },
                  { id: 'Pop-Up / Jam', label: 'POP-UP / JAM', icon: '🔥' },
                  { id: 'Other Gathering', label: 'OTHER', icon: '✨' },
                ].map((cat) => (
                  <button
                    key={`composer-cat-${cat.id}`}
                    type="button"
                    onClick={() => setEventType?.(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                      eventType === cat.id
                        ? 'bg-amber-500 text-black font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Event Title / Fest Name */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
                Event / Tour / Fest Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sanguisugabogg + Kruelty US Tour, Mass Destruction Fest"
                value={eventTitle}
                onChange={(e) => setEventTitle?.(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
                  Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oct 24, 2026 or 2026-10-24"
                  value={eventDate}
                  onChange={(e) => setEventDate?.(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
                  Doors / Start Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7:00 PM / Doors 6:30"
                  value={eventTime}
                  onChange={(e) => setEventTime?.(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Venue & Location Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
                  Venue / Location Name (Black Book & Places)
                </label>
                <VenueAutocompleteInput
                  value={eventLocationName}
                  onChange={(venue, venueData) => {
                    setEventLocationName?.(venueData ? venueData.name : venue);
                    if (venueData?.fullAddress && setEventAddress) {
                      setEventAddress(venueData.fullAddress);
                    }
                  }}
                  placeholder="e.g. Chain Reaction, The Echo, Saint Vitus..."
                  theme={{
                    innerPanelBg: 'bg-zinc-950',
                    inputBorder: 'border-zinc-800',
                    inputFocus: 'focus:border-amber-500'
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
                  Street Address or City
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1120 Manhattan Ave, Brooklyn NY"
                  value={eventAddress}
                  onChange={(e) => setEventAddress?.(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Secret Location Toggle */}
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-200 uppercase block">
                    Underground / Secret Location
                  </span>
                  <span className="text-[8.5px] font-mono text-zinc-500 block">
                    Hides exact street address on public feed; revealed via DM or to RSVPs.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={eventIsSecret}
                onChange={(e) => setEventIsSecret?.(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Lineup & Performers */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
                Performing Lineup (Bands / Artists / DJs)
              </label>
              <input
                type="text"
                placeholder="e.g. Mortician, Vomit Corpse, Local Support"
                value={eventLineup}
                onChange={(e) => setEventLineup?.(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Ticket Link & Door Price Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-amber-400 uppercase font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-amber-400" /> TICKET / PRESALE LINK
                  </span>
                  <span className="text-[8px] text-zinc-500 font-mono">DICE, EVENTBRITE, ETC.</span>
                </label>
                <input
                  type="url"
                  placeholder="https://dice.fm/event/... or ticketmaster link"
                  value={eventTicketUrl}
                  onChange={(e) => setEventTicketUrl?.(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
                  Entry / Cover / Door Price
                </label>
                <input
                  type="text"
                  placeholder="e.g. $15 ADV / $20 DOS or FREE / $5 DONATION"
                  value={eventCost}
                  onChange={(e) => setEventCost?.(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Description / Scene Guidelines */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
                Event Notes / Accessibility / Guidelines (Optional)
              </label>
              <textarea
                placeholder="e.g. All ages, BYOB, respect the space, no violence outside the pit."
                value={eventDescription}
                onChange={(e) => setEventDescription?.(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none resize-none transition-colors"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
              <button
                type="button"
                onClick={handleClearEventDetails}
                className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-rose-900/60 text-zinc-400 hover:text-rose-400 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                CLEAR EVENT
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePanel(null);
                  if (triggerNotification) {
                    triggerNotification(
                      eventTitle
                        ? `✓ Event details attached: "${eventTitle}"!`
                        : 'Event panel saved.'
                    );
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SAVE & ATTACH TO POST</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Attachments Bar */}
        {hasAttachments && (
          <div className={`flex flex-wrap items-center gap-1.5 pt-2 border-t ${theme.inputBorder}`}>
            <span className={`text-[9px] font-mono uppercase ${theme.accentText} font-bold mr-1`}>Attached:</span>

            {newPostImageUrl && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <ImageIcon className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>Media Image</span>
                <button type="button" onClick={() => setNewPostImageUrl('')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}

            {youtubeUrl && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <Video className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>Video Embed</span>
                <button type="button" onClick={() => setYoutubeUrl && setYoutubeUrl('')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}

            {taggedVenue && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <MapPin className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>{taggedVenue}</span>
                <button type="button" onClick={() => setTaggedVenue && setTaggedVenue('')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}

            {!taggedVenue && scrapedLocation && includeAutoLocation && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-[10px] font-mono text-emerald-300">
                <MapPin className="w-3 h-3 text-rose-400" />
                <span>LOC: {scrapedLocation}</span>
                <button type="button" onClick={() => setIncludeAutoLocation(false)} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}

            {attachedSong && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <Music className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>Song: {attachedSong.title || attachedSong.name}</span>
                <button type="button" onClick={() => setAttachedSong && setAttachedSong(null)} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}

            {taggedBands.map((band, bIdx) => (
              <span key={`tagged-band-${band}-${bIdx}`} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <Users className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>@{band}</span>
                <button type="button" onClick={() => removeTaggedBand(band)} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {pollQuestion && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <BarChart2 className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>Poll: {pollQuestion.substring(0, 18)}...</span>
                <button type="button" onClick={() => setPollQuestion && setPollQuestion('')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}

            {merchDropName && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <ShoppingBag className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>Merch: {merchDropName} (${merchDropPrice})</span>
                <button type="button" onClick={() => setMerchDropName && setMerchDropName('')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}

            {(tapeTitle || tapeAudioUrl) && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <Radio className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>Tape: {tapeTitle || 'Live Tape'}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (setTapeTitle) setTapeTitle('');
                    if (setTapeAudioUrl) setTapeAudioUrl('');
                  }}
                  className="hover:text-rose-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(eventTitle || eventData?.title) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-500/50 text-[10px] font-mono text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold">
                  Event: {eventTitle || eventData?.title}
                  {eventDate ? ` (${eventDate})` : ''}
                  {eventTicketUrl ? ' 🎟️ Presale' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => togglePanel('event')}
                  className="text-amber-400 hover:text-amber-200 underline text-[9px] ml-1 cursor-pointer font-bold uppercase"
                >
                  EDIT
                </button>
                <button
                  type="button"
                  onClick={handleClearEventDetails}
                  className="hover:text-rose-400 ml-1 cursor-pointer p-0.5"
                  title="Remove event details"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {postScope !== 'public' && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <Globe className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>Scope: {postScope.toUpperCase()}</span>
                <button type="button" onClick={() => setPostScope('public')} className="hover:text-rose-400 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(Boolean(newPostImageUrl) || selectedMediaFiles.length > 0) && selectedAlbum && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${theme.attachedTagBg} text-[10px] font-mono ${theme.badgeText}`}>
                <Folder className={`w-3 h-3 ${theme.attachedTagIcon}`} />
                <span>Album: {selectedAlbum}</span>
              </span>
            )}
          </div>
        )}

        {/* Prominent Full-Width Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!newPostText.trim() && !newPostImageUrl && !tapeAudioUrl && !pollQuestion && !merchDropName && !eventTitle && !eventData}
            className={`w-full py-3 sm:py-3.5 rounded-xl disabled:bg-zinc-800/80 disabled:border-zinc-800 disabled:text-zinc-500 disabled:shadow-none font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99] ${theme.buttonBg}`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {activeScheduledTime
                ? `QUEUE FOR ${new Date(activeScheduledTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : 'POST TO GLOBAL NETWORK'}
            </span>
          </button>

          {/* Post Scheduler Button placed directly under the main post button */}
          <button
            type="button"
            onClick={() => setShowScheduler(!showScheduler)}
            className={`w-full mt-2 py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              showScheduler || activeScheduledTime
                ? theme.activeBtnStyle
                : theme.inactiveBtnStyle
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" style={{ color: theme.glowHex }} />
            <span>
              {activeScheduledTime
                ? `⏰ SCHEDULED: ${new Date(activeScheduledTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : 'SCHEDULE TRANSMISSION / POST'}
            </span>
          </button>

          {/* Expandable Scheduler Drawer/Panel */}
          {(showScheduler || activeScheduledTime) && (
            <div className={`mt-2.5 p-3 rounded-xl ${theme.innerPanelBg} border ${theme.panelBorder} space-y-3 text-left`}>
              <div className={`flex items-center justify-between pb-2 border-b ${theme.inputBorder}`}>
                <div className={`flex items-center gap-2 ${theme.badgeText} font-mono text-[11px] font-bold uppercase tracking-wider`}>
                  <Clock className={`w-3.5 h-3.5 ${theme.accentText}`} />
                  <span>TRANSMISSION SCHEDULER</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScheduler(false)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                  QUICK PRESETS:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPresetHours(1)}
                    className={`px-2 py-1.5 rounded-lg ${theme.badgeBg} hover:${theme.accentBg} border ${theme.accentBorder} text-[10px] font-mono ${theme.badgeText} transition-colors text-center font-bold cursor-pointer`}
                  >
                    +1 HOUR
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetHours(3)}
                    className={`px-2 py-1.5 rounded-lg ${theme.badgeBg} hover:${theme.accentBg} border ${theme.accentBorder} text-[10px] font-mono ${theme.badgeText} transition-colors text-center font-bold cursor-pointer`}
                  >
                    +3 HOURS
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTomorrowMorning()}
                    className={`px-2 py-1.5 rounded-lg ${theme.badgeBg} hover:${theme.accentBg} border ${theme.accentBorder} text-[10px] font-mono ${theme.badgeText} transition-colors text-center font-bold cursor-pointer`}
                  >
                    TOMORROW 9AM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetFridayEvening()}
                    className={`px-2 py-1.5 rounded-lg ${theme.badgeBg} hover:${theme.accentBg} border ${theme.accentBorder} text-[10px] font-mono ${theme.badgeText} transition-colors text-center font-bold cursor-pointer`}
                  >
                    FRIDAY 6PM
                  </button>
                </div>
              </div>

              {/* Custom Datetime Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                  TARGET DISPATCH DATE & TIME:
                </label>
                <input
                  type="datetime-local"
                  value={activeScheduledTime}
                  onChange={(e) => updateScheduledTime(e.target.value)}
                  className={`w-full ${theme.panelBg} border ${theme.inputBorder} rounded-lg px-3 py-2 text-xs ${theme.badgeText} font-mono ${theme.inputFocus} transition-colors cursor-pointer`}
                />
              </div>

              {/* Active Scheduled Confirmation Badge */}
              {activeScheduledTime && (
                <div className={`p-2 rounded-lg ${theme.badgeBg} border ${theme.accentBorder} text-[10px] font-mono ${theme.badgeText} flex items-center justify-between gap-2`}>
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${theme.accentText} shrink-0`} />
                    <span className="truncate">
                      Queued for {new Date(activeScheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateScheduledTime('')}
                    className="text-rose-400 hover:text-rose-300 font-bold uppercase underline shrink-0 cursor-pointer"
                  >
                    CLEAR
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={!activeScheduledTime || (!newPostText.trim() && !newPostImageUrl && !tapeAudioUrl && !pollQuestion && !merchDropName && !eventTitle && !eventData)}
                  onClick={(e) => handleFormSubmit(e)}
                  className={`w-full py-2.5 px-3 rounded-lg ${theme.gradientBtn} disabled:from-zinc-900 disabled:to-zinc-900 disabled:border disabled:border-zinc-800 disabled:text-zinc-600 text-white font-mono font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>CONFIRM & QUEUE TRANSMISSION</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer Footer Note */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[8.5px] sm:text-[9.5px] font-mono text-amber-300/80 bg-amber-950/20 border border-amber-500/20 rounded-lg p-2 text-center leading-snug">
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>
            Music-focused ecosystem. Behind-the-scenes & personal updates welcome. Purely off-topic, political, or abusive posts are moderated.
          </span>
        </div>
      </form>
    </div>
  );
};

export default CreatePostCard;
