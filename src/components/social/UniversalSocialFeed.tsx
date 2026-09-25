import { SocialThemeShell } from "./SocialThemeShell";
import { FeedViewRouter } from "./FeedViewRouter";
import { useTapePlayer } from "./hooks/useTapePlayer";
import { useSocialFollowsAndProfiles } from "./hooks/useSocialFollowsAndProfiles";
import { useSocialMarketplaceState } from "./hooks/useSocialMarketplaceState";
import { useSocialAdminState } from "./hooks/useSocialAdminState";
import { useSocialClipsState } from "./hooks/useSocialClipsState";
import { useSocialStoriesState } from "./hooks/useSocialStoriesState";
import { useSocialFeedSync } from "./hooks/useSocialFeedSync";
import { mockShopItems } from '../../data/shopMockData';
import { initialForumThreads } from '../../data/forumMockData';
import { getAvatarBorderColorClass, getRoleBorderAndGlowClass, compressImage, isValidUUID, isValidUUIDLocal } from './utils/socialUtils';
import { fanTheme, royalBlueTheme, getSocialTheme } from './utils/themeUtils';
import { useSocialPortalRole } from './hooks/useSocialPortalRole';
import { SocialRoleProvider } from './context/SocialRoleContext';
import { useDoubleTapReaction } from './hooks/useDoubleTapReaction';
import { FloatingReactionOverlay } from './FloatingReactionOverlay';
import { useFeedLocalCache } from './hooks/useFeedLocalCache';
import { useSocialFeedState, getYouTubeId } from './hooks/useSocialFeedState';
import { useSocialFeedActions } from './hooks/useSocialFeedActions';
import {
  resolveBandLogo,
  resolveBandCover,
  resolveBandHandle,
  resolveBandName,
  resolveBandBio,
  resolveBandLocation,
  resolveEffectiveAvatar,
  resolveEffectiveCover
} from '../../utils/bandProfileUtils';
import {
  loadDiscoverProfilesCache,
  saveDiscoverProfilesCache,
  loadProfileLocalStorageCache,
  loadProfileIndexedDBCache
} from './utils/feedCacheUtils';
import { resolveActiveUserId, syncPostToSupabase } from './utils/postSyncUtils';
import { mergePostWithReactions } from './utils/reactionStore';
import { useSocialProfileState } from './hooks/useSocialProfileState';
import { FeedTopHeader } from './navigation/FeedTopHeader';
import { FeedSideDrawers } from './navigation/FeedSideDrawers';
import { SocialModalsOverlay } from './modals/SocialModalsOverlay';
import { SceneRadioPlayer } from './player/SceneRadioPlayer';
import { CartDrawer } from './drawers/CartDrawer';
import { AlbumDetailsModal } from './modals/AlbumDetailsModal';
import { AttachSongModal } from './modals/AttachSongModal';
import { PhotoLightboxModal } from './modals/PhotoLightboxModal';
import { ClipsOverlaysModal } from './modals/ClipsOverlaysModal';
import { TicketEscrowModal } from './modals/TicketEscrowModal';
import { FanPitWallDrawer } from './drawers/FanPitWallDrawer';
import { StripeCartCheckoutModal } from './modals/StripeCartCheckoutModal';
import { LeftProfileDrawer } from './drawers/LeftProfileDrawer';
import { RightNotificationsDrawer } from './drawers/RightNotificationsDrawer';
import { UploadClipModal } from './modals/UploadClipModal';
import { UploadStoryModal } from './modals/UploadStoryModal';
import { StoryViewerModal } from './modals/StoryViewerModal';
import { EventCompanionModal } from './modals/EventCompanionModal';
import { formatTimeAgo } from '../../utils/socialFeedUtils';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveCropperModal } from '../InteractiveCropperModal';
import { ProfileMarketplaceTab } from '../profile/ProfileMarketplaceTab';
import { MapPin, Calendar, Clock, ArrowRight, ArrowLeft, Share2, Flame, Zap, Check,
  CheckCircle, X, Tag, ShoppingCart, Ticket, Briefcase, Volume2, VolumeX, Shield, MessageSquare, MessageCircle, Repeat, TrendingUp, Image, Home, Bell, Settings, Search, User, CreditCard, Crown, Library, Users, PlayCircle, Youtube, Wifi, WifiOff, Database, AlertTriangle, Lock, Unlock, Trash2, Plus, Minus, RefreshCw, ArrowUp, ArrowDown, Edit2, FileUp, Folder, Heart, Send, Award, UserPlus, UserCheck,
   Music, Activity, Disc, Play, Pause, Square, SkipBack, SkipForward, Link as LinkIcon, Network, Pin as PinIcon, Image as ImageIcon, Upload, Compass, MoreVertical, LayoutGrid, ArrowUpRight, Menu, LogOut, ChevronRight, ChevronDown, ChevronUp, Filter, ShoppingBag, PauseCircle, FastForward, Rewind, Maximize2, Star, Globe, Fingerprint, Box, Hash, Mic, Settings2, SlidersHorizontal, Info, Phone, FileText, BellOff, Users as UsersGroup, Archive, Download, EyeOff, ShieldAlert, UserMinus, Sparkles, PlaySquare, Radio, Video, Camera, Smile, ThumbsUp, CornerUpLeft , Palette, DollarSign, MinusCircle, Slash, Eye, Shirt} from 'lucide-react';
import { BAND_PORTAL_BILLING } from '../../config/billingMatrix';
import { PLATFORM_TRANSACTION_FEES } from '../../constants/fees';
import { profileStore, socialFeedStore } from '../../utils/indexedDB';
import { supabase } from '../../lib/supabaseClient';
import { getSupabase, subscribeToTable, executeWithSchemaResilience, uploadBase64ToStorage, normalizeLoadedProfile, createShopMerchItem, fetchShopMerchItems, sanitizeMicroGenres, formatBandLocation, sanitizeShowForDb, ensureUUID } from '../../supabase';
import { uploadFeedMedia } from '../../lib/storage';
import { communityBandManager } from '../../lib/communityBands';
import Barcode from 'react-barcode';
import { MASTER_GENRES } from '../../constants/genres';
import { InboxPreferences } from '../messaging/InboxPreferences';
import MarqueeText from '../MarqueeText';
import { getProfileGlowInfo } from '../../utils/profileGlow';
import { triggerPictureViewer } from '../../utils/avatarPopupEvents';
import { TimelineTab } from '../profile/TimelineTab';
import { SocialSubNav } from './SocialSubNav';
import { formatTimeTo12Hour } from '../../lib/timeUtils';
import { SocialMapOverlay } from './SocialMapOverlay';
import { SubViewControlPanels } from './SubViewControlPanels';
import CreateCommunityShowModal from './modals/CreateCommunityShowModal';
import { InlineShareModal } from './modals/InlineShareModal';
import { InlineReactionsModal } from './modals/InlineReactionsModal';
import { PollCreationModal } from './modals/PollCreationModal';
import { SongShareModal } from './modals/SongShareModal';
import { AddItemModal } from './modals/AddItemModal';
import { PollCreationModal as PollCreateModal } from './modals/PollCreationModal';
import { MerchDropModal } from './modals/MerchDropModal';
import { ReportProfileModal } from './modals/ReportProfileModal';
import { SubmitEpkModal, ViewEpksModal, EpkModals } from './modals/EpkModals';
import { AdminPinModal } from './modals/AdminPinModal';
import { AdminConsoleModal } from './modals/AdminConsoleModal';
import { formatLocationDisplay } from '../../constants/location';
import { PublicProfileModal } from './modals/PublicProfileModal';
import { DirectMessageDrawer } from './modals/DirectMessageDrawer';
import { ProfileHubCard } from './ProfileHubCard';
import { FollowersModal } from './follows';
import { PROFILE_REGISTRY, isMiguelNameOrProfile } from './utils/profileUtils';
import { DEFAULT_LABEL_POSTS, DEFAULT_INBOUND_INQUIRIES } from '../../data/mockSocialData';
import { handleMarkAllAsRead } from '../../lib/chat';
import { useNexusMessaging } from '../messaging/useNexusMessaging';
import {
  GENRE_REACTION_MATRICES,
  roleTheme,
  type FeedItem,
  mockLiveTonight,
  bandSetlists,
  mockStories,
  mockInAppSongs,
  mockFeed,
  ROSTER_CATALOGS,
  RADIO_PLAYLISTS,
  FRONTEND_FALLBACK_PLAYLISTS
} from '../../data/socialFeedMockData';
import { playAmbientMetalDrone as playAmbientMetalDroneEngine } from '../../utils/audioEngine';
import {
  isAudioUrl,
  getCollectionsTrackDuration,
  enrichTicketData,
  compressImageInSocialFeed,
  getEmbedUrl,
  extractUUID,
  getAvatarForName,
  getWorkspaceBorderColorClass,
  getChatThreadBorderClass
} from '../../utils/socialFeedUtils';

// Re-export constants/utilities and types for backward compatibility
export { isAudioUrl, GENRE_REACTION_MATRICES, roleTheme, type FeedItem };

export function UniversalSocialFeed({
 
  userProfile, 
  setUserProfile,
  activeBand,
  activeBandId,
  onLogout, 
  onUpgradeToPro, 
  triggerNotification, 
  portalRole: propPortalRole = 'industry_pro', 
  onBack, 
  onNavigateToWarehouse,
  activeClearanceLevel,
  setActiveClearanceLevel,
  bands,
  setBands,
  bandJoinRequests,
  setBandJoinRequests,
  isEmbedded: isPropEmbedded,
  onNavigateToTab,
  setActiveTab: propSetActiveTab,
  setDashboardV2ActiveNav,
  dashboardV2ActiveNav,
  shows: propShows,
  setShows: propSetShows
}: any) {
  const portalRoleState = useSocialPortalRole({
    initialRole: propPortalRole,
    userProfile
  });
  const {
    portalRole,
    setPortalRole,
    roleMenuOpen,
    setRoleMenuOpen,
    isProfessional,
    activeRoleTheme,
    currentTheme,
    dataTheme,
    switchRole
  } = portalRoleState;

  const isEmbedded = isPropEmbedded === true;

  const handleLogout = () => {};
  const { feed, setFeed, _setFeed } = useFeedLocalCache({
    portalRole,
    userProfile,
    activeBand,
    activeBandId,
    defaultFeed: mockFeed
  });
  const [labelPosts, setLabelPosts] = useState<any[]>(() => DEFAULT_LABEL_POSTS.map(p => mergePostWithReactions(p, userProfile?.id)));
  const [liveEvents, setLiveEvents] = useState<any[]>(() => {
    try {
      const rawDel = localStorage.getItem('nexus_deleted_community_shows');
      if (!rawDel) return mockLiveTonight;
      const delList: string[] = JSON.parse(rawDel);
      const delSet = new Set(delList.map(s => String(s).toLowerCase().trim()));
      return mockLiveTonight.filter(g => {
        const gId = String(g.id || '').toLowerCase().trim();
        const gSig = `${String(g.headliner || '').toLowerCase().trim()}__${String(g.date || '').toLowerCase().trim()}`;
        return !delSet.has(gId) && !delSet.has(gSig);
      });
    } catch {
      return mockLiveTonight;
    }
  });
  const [liveSetlists, setLiveSetlists] = useState<Record<string, string[]>>(bandSetlists);
  const [venueMessages, setVenueMessages] = useState<any[]>([]);
  const [venueMessageInput, setVenueMessageInput] = useState('');
  const [registeringPortalKey, setRegisteringPortalKey] = useState<string | null>(null);
  const [regWorkspaceName, setRegWorkspaceName] = useState('');
  const [regWorkspaceHandle, setRegWorkspaceHandle] = useState('');
  const [regWorkspaceLogo, setRegWorkspaceLogo] = useState('');

  const resolvedActiveBand = useMemo(() => {
    if (activeBand && (activeBand.name || activeBand.id)) {
      return {
        ...activeBand,
        name: resolveBandName(activeBand, userProfile),
        logo_url: resolveBandLogo(activeBand, userProfile),
        cover_url: resolveBandCover(activeBand, userProfile),
        custom_slug: resolveBandHandle(activeBand, userProfile)
      };
    }
    if (Array.isArray(bands) && bands.length > 0) {
      const found = bands.find((b: any) => b.id === activeBandId) || bands[0];
      return {
        ...found,
        name: resolveBandName(found, userProfile),
        logo_url: resolveBandLogo(found, userProfile),
        cover_url: resolveBandCover(found, userProfile),
        custom_slug: resolveBandHandle(found, userProfile)
      };
    }
    try {
      const cached = localStorage.getItem('nexus_active_band');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.name || parsed.id)) {
          return {
            ...parsed,
            name: resolveBandName(parsed, userProfile),
            logo_url: resolveBandLogo(parsed, userProfile),
            cover_url: resolveBandCover(parsed, userProfile),
            custom_slug: resolveBandHandle(parsed, userProfile)
          };
        }
      }
    } catch (_) {}
    return {
      id: userProfile?.band_id || 'band:active',
      name: resolveBandName(null, userProfile),
      logo_url: resolveBandLogo(null, userProfile),
      cover_url: resolveBandCover(null, userProfile),
      custom_slug: resolveBandHandle(null, userProfile),
      owner_id: userProfile?.id
    };
  }, [activeBand, bands, activeBandId, userProfile]);

  const effectiveBands = useMemo(() => {
    if (Array.isArray(bands) && bands.length > 0) return bands;
    if (resolvedActiveBand) return [resolvedActiveBand];
    if (activeBand) return [activeBand];
    return [];
  }, [bands, resolvedActiveBand, activeBand]);

  const [expandedTours, setExpandedTours] = useState<Record<string, boolean>>({});
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({});
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [boostMenuPostId, setBoostMenuPostId] = useState<string | null>(null);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  // Gesture & Double-Tap Reaction Engine via useDoubleTapReaction
  const {
    traysHiddenOnMobile,
    setTraysHiddenOnMobile,
    particles,
    triggerParticleReaction,
    handleDoubleTapToggle,
    clearParticles
  } = useDoubleTapReaction({
    triggerNotification,
    genreKey: 'metal'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [drawerCurrentView, setDrawerCurrentView] = useState<string>('root');
  const [followingActiveTab, setFollowingActiveTab] = useState<'bands' | 'venues' | 'creatives' | 'labels' | 'friends'>('bands');
  const [followingSearchQuery, setFollowingSearchQuery] = useState('');
  const [selectedGigOnMap, setSelectedGigOnMap] = useState<any>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [mapRadius, setMapRadius] = useState<number>(25);
  const [isLoading, setIsLoading] = useState(true);
  const [rosterExpanded, setRosterExpanded] = useState(false);
  const [selectedLabelBand, setSelectedLabelBand] = useState('Devourment');
  const [showLabelEpkModal, setShowLabelEpkModal] = useState(false);
  const [isCommunityShowModalOpen, setIsCommunityShowModalOpen] = useState(false);
  const [editingCommunityShow, setEditingCommunityShow] = useState<any | null>(null);
  const [activeFeedCategoryFilter, setActiveFeedCategoryFilter] = useState<string>('all');

  const handleCommunityShowSubmit = async (payload: any) => {
    let currentUserId = userProfile?.id;
    if (!currentUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId)) {
      try {
        const sb = getSupabase();
        if (sb) {
          const authUser = (await sb.auth.getUser()).data.user;
          if (authUser?.id) {
            currentUserId = authUser.id;
          }
        }
      } catch (_) {}
    }
    if (!currentUserId) {
      currentUserId = userProfile?.role === 'fan' ? '00000000-0000-4000-a000-000000000001' : '00000000-0000-4000-a000-000000000000';
    }

    const showId = ensureUUID(payload.id || ('sh_comm_' + Math.random().toString(36).substring(2, 9)));
    const timestamp = payload.created_at || new Date().toISOString();

    const headlinerVal = payload.headliner || payload.name || 'Live Show';
    const inputTitle = payload.show_name || payload.festival_name || payload.title || payload.name || payload.headliner;
    const finalShowName = inputTitle || `${headlinerVal} Live`;
    const venueVal = payload.venue || payload.venue_name || payload.venue_address || payload.name || 'Underground Venue';

    const newShow: any = {
      id: showId,
      created_at: timestamp,
      creator_id: ensureUUID(currentUserId),
      name: finalShowName,
      show_name: finalShowName,
      headliner: headlinerVal,
      festival_name: payload.festival_name,
      date: payload.date,
      show_date: payload.show_date || payload.date,
      status: payload.status || 'Active',
      guarantee_amount: payload.guarantee_amount || payload.revenue || 0,
      show_type: payload.show_type || 'headliner',
      venue_name: payload.venue_name || payload.venue || 'Live Venue',
      venue_address: payload.venue_address || undefined,
      venue: payload.venue || payload.venue_name || 'Live Venue',
      capacity: payload.capacity,
      venue_capacity: payload.capacity,
      expected_attendance: payload.capacity || payload.expected_attendance,
      city: payload.city,
      state_province: payload.state_province,
      country: payload.country,
      doors_time: payload.doors_time,
      set_time: payload.set_time,
      day_of_show_price: payload.day_of_show_price,
      presale_price: payload.presale_price,
      age_restriction: payload.age_restriction,
      age: payload.age || payload.age_restriction,
      safety_code: payload.safety_code,
      price: payload.price,
      ticket_price: payload.ticket_price,
      is_community_submitted: true,
      band_id: payload.band_id || 'community_hub',
      external_ticket_url: payload.external_ticket_url,
      ticket_url: payload.ticket_url || payload.external_ticket_url,
      flyer_url: payload.flyer_url,
      support_lineup: payload.support_lineup,
      support_bands: payload.support_bands,
      is_time_24h: payload.is_time_24h
    };

    let localStorageShowsMap: any = {};
    try {
      const existing = localStorage.getItem('nexus_core_shows_extended');
      if (existing) localStorageShowsMap = JSON.parse(existing);

      const headlinerNorm = String(headlinerVal).toLowerCase().trim();
      const dateNorm = String(newShow.date || newShow.show_date || '').trim();

      // Clean up previous temporary or stale keys for this same show
      Object.keys(localStorageShowsMap).forEach(key => {
        const item = localStorageShowsMap[key];
        if (key === payload.id || key === showId) {
          delete localStorageShowsMap[key];
        } else if (item) {
          const itemHeadliner = String(item.headliner || item.name || '').toLowerCase().trim();
          const itemDate = String(item.date || item.show_date || '').trim();
          if (itemHeadliner && dateNorm && itemHeadliner === headlinerNorm && itemDate === dateNorm) {
            delete localStorageShowsMap[key];
          }
        }
      });

      localStorageShowsMap[showId] = { ...newShow };
      localStorage.setItem('nexus_core_shows_extended', JSON.stringify(localStorageShowsMap));

      // Record in user's created shows cache
      const rawCreated = localStorage.getItem('nexus_created_show_ids');
      const createdList: string[] = rawCreated ? JSON.parse(rawCreated) : [];
      if (!createdList.includes(showId)) {
        createdList.push(showId);
        localStorage.setItem('nexus_created_show_ids', JSON.stringify(createdList));
      }

      // Remove from deleted blacklist if recreating
      const rawDeleted = localStorage.getItem('nexus_deleted_community_shows');
      if (rawDeleted) {
        const delList: string[] = JSON.parse(rawDeleted);
        const sig = `${headlinerNorm}__${dateNorm.toLowerCase()}`;
        const filteredDel = delList.filter(item => item !== showId && item !== sig);
        localStorage.setItem('nexus_deleted_community_shows', JSON.stringify(filteredDel));
      }
    } catch (_) {}

    try {
      const sb = getSupabase();
      if (sb) {
        const pruned = sanitizeShowForDb(newShow);
        const { error } = await executeWithSchemaResilience(async (payload) => {
          return await sb.from('shows').upsert([payload]);
        }, pruned);

        if (error) {
          console.error('Supabase community show upsert error:', error);
          triggerNotification?.(`⚠️ Supabase error saving show: ${error.message || 'Check connection'}`);
        } else {
          console.log('Supabase community show synced successfully:', showId);
          triggerNotification?.(editingCommunityShow ? `✏️ Community show "${newShow.name}" updated & synced to Supabase!` : `🌍 Community show "${newShow.name}" posted & synced to Supabase!`);
          setIsCommunityShowModalOpen(false);
          setEditingCommunityShow(null);
          
          try {
            const formattedDoors = newShow.doors_time ? formatTimeTo12Hour(newShow.doors_time) : '';
            const doorsDisplay = formattedDoors 
              ? (String(formattedDoors).toLowerCase().includes('door') ? formattedDoors : `Doors ${formattedDoors}`)
              : (newShow.set_time ? `Set ${formatTimeTo12Hour(newShow.set_time)}` : 'Doors 7:30 PM');

            const newGig = {
              ...newShow,
              id: showId,
              venue: newShow.venue || newShow.venue_name || 'Underground Venue',
              venue_name: newShow.venue_name || newShow.venue || 'Underground Venue',
              venue_address: newShow.venue_address || undefined,
              capacity: newShow.capacity,
              venue_capacity: newShow.capacity,
              headliner: newShow.headliner || newShow.name || 'Live Show',
              time: doorsDisplay,
              date: newShow.date || 'Upcoming',
              city: newShow.city,
              state_province: newShow.state_province,
              country: newShow.country,
              distance: undefined,
              price: newShow.price || (newShow.external_ticket_url ? 'External Tickets' : 'Free / Crowdsourced'),
              isFollowed: false,
              is_community_submitted: true,
              external_ticket_url: newShow.external_ticket_url,
              ticket_url: newShow.ticket_url,
              ticketsAvailable: true,
              ticketStatus: 'active'
            };
            setLiveEvents(prev => {
              const normNewHeadliner = String(newGig.headliner || '').toLowerCase().trim();
              const normNewDate = String(newGig.date || '').toLowerCase().trim();
              const filtered = prev.filter(g => {
                if (g.id === showId || g.id === payload.id) return false;
                const gHeadliner = String(g.headliner || (g as any).name || '').toLowerCase().trim();
                const gDate = String(g.date || '').toLowerCase().trim();
                if (gHeadliner && normNewDate && gHeadliner === normNewHeadliner && gDate === normNewDate) return false;
                return true;
              });
              return [newGig, ...filtered];
            });
          } catch (_) {}
          return;
        }
      } else {
        triggerNotification?.('⚠️ Supabase client not configured. Saved locally.');
      }
    } catch (e) {
      console.warn('Community show db upsert exception:', e);
      triggerNotification?.('⚠️ Supabase connection exception: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }

    triggerNotification?.(editingCommunityShow ? `✏️ Community show "${newShow.name}" updated locally.` : `🌍 Community show "${newShow.name}" posted locally (Supabase offline/unconfigured).`);
    setIsCommunityShowModalOpen(false);
    setEditingCommunityShow(null);

    try {
      const formattedDoors = newShow.doors_time ? formatTimeTo12Hour(newShow.doors_time) : '';
      const doorsDisplay = formattedDoors 
        ? (String(formattedDoors).toLowerCase().includes('door') ? formattedDoors : `Doors ${formattedDoors}`)
        : (newShow.set_time ? `Set ${formatTimeTo12Hour(newShow.set_time)}` : 'Doors 7:30 PM');

      const newGig = {
        ...newShow,
        id: showId,
        venue: newShow.venue || newShow.venue_name || 'Underground Venue',
        venue_name: newShow.venue_name || newShow.venue || 'Underground Venue',
        venue_address: newShow.venue_address || undefined,
        capacity: newShow.capacity,
        venue_capacity: newShow.capacity,
        headliner: newShow.headliner || newShow.name || 'Live Show',
        time: doorsDisplay,
        date: newShow.date || 'Upcoming',
        city: newShow.city,
        state_province: newShow.state_province,
        country: newShow.country,
        distance: undefined,
        price: newShow.price || (newShow.external_ticket_url ? 'External Tickets' : 'Free / Crowdsourced'),
        isFollowed: false,
        is_community_submitted: true,
        external_ticket_url: newShow.external_ticket_url,
        ticket_url: newShow.ticket_url,
        ticketsAvailable: true,
        ticketStatus: 'active'
      };
      setLiveEvents(prev => {
        const normNewHeadliner = String(newGig.headliner || '').toLowerCase().trim();
        const normNewDate = String(newGig.date || '').toLowerCase().trim();
        const filtered = prev.filter(g => {
          if (g.id === showId || g.id === payload.id) return false;
          const gHeadliner = String(g.headliner || (g as any).name || '').toLowerCase().trim();
          const gDate = String(g.date || '').toLowerCase().trim();
          if (gHeadliner && normNewDate && gHeadliner === normNewHeadliner && gDate === normNewDate) return false;
          return true;
        });
        return [newGig, ...filtered];
      });
    } catch (_) {}
  };

  // Permanently delete an upcoming show from state, localStorage, and Supabase database
  const handleDeleteUpcomingShowPermanently = async (gig: any) => {
    if (!gig) return;

    const showId = String(gig.id || '').trim();
    const headlinerVal = String(gig.headliner || gig.name || gig.show_name || '').trim();
    const dateVal = String(gig.rawDate || gig.date || gig.show_date || '').trim();
    const headlinerNorm = headlinerVal.toLowerCase().trim();
    const dateNorm = dateVal.toLowerCase().trim();
    const sig = `${headlinerNorm}__${dateNorm}`;

    // 1. Instantly remove from React in-memory state
    setLiveEvents(prev => prev.filter(g => {
      if (showId && g.id === showId) return false;
      const gH = String(g.headliner || (g as any).name || '').toLowerCase().trim();
      const gD = String((g as any).rawDate || g.date || (g as any).show_date || '').toLowerCase().trim();
      if (headlinerNorm && dateNorm && gH === headlinerNorm && gD === dateNorm) return false;
      return true;
    }));

    // 2. Add to persistent blacklist in localStorage so it never resurrects upon refresh
    try {
      const rawDeleted = localStorage.getItem('nexus_deleted_community_shows');
      const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (showId && !deletedList.includes(showId)) deletedList.push(showId);
      if (sig && !deletedList.includes(sig)) deletedList.push(sig);
      localStorage.setItem('nexus_deleted_community_shows', JSON.stringify(deletedList));
    } catch (e) {
      console.warn('Failed to update nexus_deleted_community_shows', e);
    }

    // 3. Remove from localStorage 'nexus_core_shows_extended'
    try {
      const rawExt = localStorage.getItem('nexus_core_shows_extended');
      if (rawExt) {
        const extMap = JSON.parse(rawExt);
        let changed = false;
        Object.keys(extMap).forEach(k => {
          const item = extMap[k];
          if (k === showId || item?.id === showId) {
            delete extMap[k];
            changed = true;
          } else if (item) {
            const itemH = String(item.headliner || item.name || item.show_name || '').toLowerCase().trim();
            const itemD = String(item.rawDate || item.date || item.show_date || '').toLowerCase().trim();
            if (itemH && itemD && itemH === headlinerNorm && itemD === dateNorm) {
              delete extMap[k];
              changed = true;
            }
          }
        });
        if (changed) {
          localStorage.setItem('nexus_core_shows_extended', JSON.stringify(extMap));
        }
      }
    } catch (e) {
      console.warn('Failed to clean nexus_core_shows_extended', e);
    }

    // 4. Remove from localStorage 'nexus_created_show_ids'
    try {
      const rawCreated = localStorage.getItem('nexus_created_show_ids');
      if (rawCreated) {
        const createdList: string[] = JSON.parse(rawCreated);
        const filtered = createdList.filter(id => id !== showId);
        localStorage.setItem('nexus_created_show_ids', JSON.stringify(filtered));
      }
    } catch (_) {}

    // 5. Remove from localStorage 'nexus_master_shows' and 'nexus_core_shows_offline'
    try {
      const rawMaster = localStorage.getItem('nexus_master_shows');
      if (rawMaster) {
        const masterList = JSON.parse(rawMaster);
        if (Array.isArray(masterList)) {
          const updatedMaster = masterList.filter((s: any) => s.id !== showId && s.name !== headlinerVal);
          localStorage.setItem('nexus_master_shows', JSON.stringify(updatedMaster));
        }
      }
    } catch (_) {}
    try {
      const rawOffline = localStorage.getItem('nexus_core_shows_offline');
      if (rawOffline) {
        const offlineList = JSON.parse(rawOffline);
        if (Array.isArray(offlineList)) {
          const updatedOffline = offlineList.filter((s: any) => s.id !== showId && s.name !== headlinerVal);
          localStorage.setItem('nexus_core_shows_offline', JSON.stringify(updatedOffline));
        }
      }
    } catch (_) {}

    // 6. Delete from Supabase 'nexus_events' and 'shows' tables
    try {
      const sb = getSupabase();
      if (sb) {
        if (showId) {
          await sb.from('nexus_events').delete().eq('id', showId);
          await sb.from('shows').delete().eq('id', showId);
        }
        if (headlinerVal && dateVal) {
          await sb.from('nexus_events').delete().eq('headliner', headlinerVal).eq('date', dateVal);
          await sb.from('shows').delete().eq('name', headlinerVal).eq('date', dateVal);
        }
      }
    } catch (err) {
      console.warn('Supabase delete error during permanent show removal:', err);
    }

    // 7. Close companion modal if it was active
    setIsEventModeActive(false);

    triggerNotification?.('🗑️ Show Permanently Deleted', `"${headlinerVal || 'Upcoming show'}" has been permanently removed.`);
  };

  // Custom Marketplace & Cart State Hook
  const {
    checkoutItem,
    setCheckoutItem,
    selectedAlbum,
    setSelectedAlbum,
    selectedSize,
    setSelectedSize,
    quantity,
    setQuantity,
    purchaseStep,
    setPurchaseStep,
    shippingName,
    setShippingName,
    shippingStreet,
    setShippingStreet,
    shippingCity,
    setShippingCity,
    shippingState,
    setShippingState,
    shippingZip,
    setShippingZip,
    shippingPhone,
    setShippingPhone,
    shippingErrors,
    setShippingErrors,
    showSongShareModal,
    setShowSongShareModal,
    songShareTitle,
    setSongShareTitle,
    songShareArtist,
    setSongShareArtist,
    songShareAlbum,
    setSongShareAlbum,
    songShareSpotifyUrl,
    setSongShareSpotifyUrl,
    songShareCoverUrl,
    setSongShareCoverUrl,
    itemCategory,
    setItemCategory,
    itemTitle,
    setItemTitle,
    itemDescription,
    setItemDescription,
    itemPrice,
    setItemPrice,
    itemLocation,
    setItemLocation,
    itemImages,
    setItemImages,
    handleSaveItem,
    cartItems,
    setCartItems,
    isCartOpen,
    setIsCartOpen,
    showStripeCartCheckout,
    setShowStripeCartCheckout,
    addToCart,
    selectedMerchSize,
    setSelectedMerchSize,
    selectedMerchQty,
    setSelectedMerchQty,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    checkoutSuccess,
    setCheckoutSuccess
  } = useSocialMarketplaceState({
    setShowAddItemModal,
    triggerNotification
  });

  // Custom Admin, Loyalty, Warehouse & Pro Dashboard State Hook
  const {
    expandedMemberId,
    setExpandedMemberId,
    teamMembers,
    setTeamMembers,
    labelHeadquarters,
    setLabelHeadquarters,
    labelFoundedYear,
    setLabelFoundedYear,
    labelRosterCount,
    setLabelRosterCount,
    labelRosterTicker,
    setLabelRosterTicker,
    labelPrimaryGenres,
    setLabelPrimaryGenres,
    loyaltyProgramEnabled,
    setLoyaltyProgramEnabled,
    loyaltyPointMultiplier,
    setLoyaltyPointMultiplier,
    loyaltyCustomTiers,
    setLoyaltyCustomTiers,
    newTierName,
    setNewTierName,
    newTierPoints,
    setNewTierPoints,
    newTierReward,
    setNewTierReward,
    newProdName,
    setNewProdName,
    newProdPrice,
    setNewProdPrice,
    newProdCategory,
    setNewProdCategory,
    newProdSubcategory,
    setNewProdSubcategory,
    newProdDesc,
    setNewProdDesc,
    newProdStock,
    setNewProdStock,
    adminClickCount,
    setAdminClickCount,
    showAdminPINModal,
    setShowAdminPINModal,
    adminPIN,
    setAdminPIN,
    isAdminMode,
    setIsAdminMode,
    blacklistRecords,
    setBlacklistRecords,
    newBlacklistType,
    setNewBlacklistType,
    newBlacklistValue,
    setNewBlacklistValue,
    isBlacklistLoading,
    setIsBlacklistLoading,
    adminPINRef,
    reports,
    setReports,
    showReportModal,
    setShowReportModal,
    reportReason,
    setReportReason
  } = useSocialAdminState({
    userProfile
  });

  // Custom Clips State Hook
  const {
    clips,
    setClips,
    showUploadClipModal,
    setShowUploadClipModal,
    newClipCaption,
    setNewClipCaption,
    newClipVideoUrl,
    setNewClipVideoUrl,
    selectedClipFile,
    setSelectedClipFile,
    newClipTitle,
    setNewClipTitle,
    isUploadingClip,
    setIsUploadingClip,
    selectedClipThumbnailFile,
    setSelectedClipThumbnailFile,
    newClipThumbnailUrl,
    setNewClipThumbnailUrl,
    clipDuration,
    setClipDuration,
    compressionProgress,
    setCompressionProgress,
    isCompressingClip,
    setIsCompressingClip,
    shouldCompressClip,
    setShouldCompressClip,
    newClipSongTitle,
    setNewClipSongTitle,
    newClipBandName,
    setNewClipBandName,
    newClipTags,
    setNewClipTags,
    showClipsAnalyticsModal,
    setShowClipsAnalyticsModal,
    showMyClipsModal,
    setShowMyClipsModal,
    activeClipComments,
    setActiveClipComments,
    activeClipShare,
    setActiveClipShare,
    activeClipMetrics,
    setActiveClipMetrics,
    newClipCommentText,
    setNewClipCommentText,
    compressVideoFile,
    deleteClip
  } = useSocialClipsState({
    triggerNotification
  });

  // Custom Stories State Hook
  const {
    stories,
    setStories,
    storyProgress,
    setStoryProgress,
    isStoryPaused,
    setIsStoryPaused,
    showUploadStoryModal,
    setShowUploadStoryModal,
    newStoryImage,
    setNewStoryImage,
    newStoryVideo,
    setNewStoryVideo,
    selectedStoryFile,
    setSelectedStoryFile,
    fallbackBase64,
    setFallbackBase64,
    isUploading,
    setIsUploading,
    newStoryCaption,
    setNewStoryCaption,
    newStoryMusic,
    setNewStoryMusic,
    newStoryTextOverlay,
    setNewStoryTextOverlay,
    newStoryTextStyle,
    setNewStoryTextStyle,
    newStoryTextColor,
    setNewStoryTextColor,
    newStoryTextColorHex,
    setNewStoryTextColorHex,
    newStoryBorder,
    setNewStoryBorder,
    selectedStorySticker,
    setSelectedStorySticker,
    newStoryStickers,
    setNewStoryStickers,
    newStoryTextSize,
    setNewStoryTextSize,
    newStoryTextX,
    setNewStoryTextX,
    newStoryTextY,
    setNewStoryTextY,
    newStoryStickerScale,
    setNewStoryStickerScale,
    newStoryStickerX,
    setNewStoryStickerX,
    newStoryStickerY,
    setNewStoryStickerY
  } = useSocialStoriesState();

  // Map Filter States
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');
  const [mapFilterGenre, setMapFilterGenre] = useState('all');

  // EPK Drag States
  const [isEpkDragOver, setIsEpkDragOver] = useState(false);



  // Global Notification Listener
  useEffect(() => {
    const handleAddNotification = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      const newNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: detail.title || 'Forum Activity',
        text: detail.message || detail.text || '',
        message: detail.message || detail.text || '',
        type: detail.type || 'comment',
        read: false,
        is_read: false,
        timestamp: Date.now(),
        timeAgo: 'Just now',
        time: 'Just now',
        targetTab: detail.targetTab || 'forum',
        author: detail.author || 'Member',
        avatar: detail.avatar || detail.authorAvatar,
        category: detail.category
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        if (userProfile?.email) {
          try {
            localStorage.setItem(`nexus_notifications_${userProfile.email}`, JSON.stringify(updated));
          } catch (err) {}
        }
        return updated;
      });
    };

    window.addEventListener('nexus_add_notification', handleAddNotification);
    return () => {
      window.removeEventListener('nexus_add_notification', handleAddNotification);
    };
  }, [userProfile]);



  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allFollows, setAllFollows] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`nexus_notifications_${userProfile?.email || 'guest'}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load notifications:", e);
    }
    return [];
  });

  // Messenger / Chat and Direct Messaging via useNexusMessaging
  const {
    chats,
    setChats,
    selectedChatId,
    setSelectedChatId,
    chatSearch,
    setChatSearch,
    typedMessage,
    setTypedMessage,
    replyingToMessage,
    setReplyingToMessage,
    showConversationSettings,
    setShowConversationSettings,
    showInboxSettings,
    setShowInboxSettings,
    globalReadReceipts,
    setGlobalReadReceipts,
    globalActiveStatus,
    setGlobalActiveStatus,
    whoCanReachMe,
    setWhoCanReachMe,
    attachmentMenuOpen,
    setAttachmentMenuOpen,
    isRecordingVoice,
    setIsRecordingVoice,
    recordingTime,
    setRecordingTime,
    activeReactionMessageId,
    setActiveReactionMessageId,
    loadChatsFromSupabase,
    getRecipientEmail,
    handleSendMessage,
    openFloatingChat,
    hookUnreadCount,
    refetchChats
  } = useNexusMessaging({
    userProfile,
    setAllProfiles,
    setAllFollows
  });

  // Supabase & Sync Effects Delegation Hook
  useSocialFeedSync({
    userProfile,
    portalRole,
    setChats,
    loadChatsFromSupabase,
    refetchChats,
    triggerNotification,
    feed
  });

  // Fetch events and setlists with followed artist ranking and upcoming date formatting
  const fetchEventsAndSetlists = useCallback(async () => {
      const supabaseClient = getSupabase();
      if (!supabaseClient) return;

      try {
        let localFollows: Record<string, boolean> = {};
        try {
          localFollows = JSON.parse(localStorage.getItem('nexus_local_follows_v1') || '{}');
        } catch (e) {}

        let extendedMap: Record<string, any> = {};
        try {
          const rawExt = localStorage.getItem('nexus_core_shows_extended');
          if (rawExt) extendedMap = JSON.parse(rawExt);
        } catch (e) {}

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
        } catch (e) {}

        const { data: eventsData, error: eventsError } = await supabaseClient.from('nexus_events').select('*').order('created_at', { ascending: false });
        
        let compiledGigs: any[] = [];

        if (!eventsError && eventsData && eventsData.length > 0) {
          compiledGigs = eventsData
            .filter(e => {
              const eId = String(e.id || '').toLowerCase().trim();
              const eH = String(e.headliner || e.band_name || e.name || '').toLowerCase().trim();
              const eD = String(e.date || '').toLowerCase().trim();
              const sig = `${eH}__${eD}`;
              if (eId && deletedShowIds.has(eId)) return false;
              if (eH && eD && deletedShowIds.has(sig)) return false;
              return true;
            })
            .map(e => {
            const extra = extendedMap[e.id] || (e.show_name ? Object.values(extendedMap).find((v: any) => v.name === e.show_name || v.show_name === e.show_name || (v.date === e.date && v.city === e.city)) : null);
            const headlinerClean = (extra?.headliner || e.headliner || e.band_name || extra?.name || e.name || 'Live Band').trim();
            const isFollowed = !!(localFollows[headlinerClean.toLowerCase()] || (e.band_id && localFollows[e.band_id]));
            const venueClean = extra?.venue || extra?.venue_name || e.venue || e.venue_name || e.venue_address || 'Metal Venue';
            const priceClean = extra?.price || e.price || (extra?.day_of_show_price ? `$${extra.day_of_show_price}` : undefined) || (extra?.presale_price ? `$${extra.presale_price}` : undefined) || (e.ticket_price ? `$${e.ticket_price}` : undefined);
            return {
              id: e.id,
              venue: venueClean,
              headliner: headlinerClean,
              time: extra?.doors_time ? `Doors ${extra.doors_time}` : (e.time || (e.doors_time ? `Doors ${e.doors_time}` : 'Doors 8:00 PM')),
              date: e.date || 'Tonight',
              city: (e.city || extra?.city) ? `${e.city || extra?.city}${(e.state_province || extra?.state_province) ? `, ${e.state_province || extra?.state_province}` : ''}` : undefined,
              distance: e.distance,
              price: priceClean,
              isFollowed,
              external_ticket_url: extra?.external_ticket_url || e.external_ticket_url,
              ticket_url: extra?.ticket_url || e.ticket_url || extra?.external_ticket_url || e.external_ticket_url,
              ticketsAvailable: !!(extra?.external_ticket_url || e.external_ticket_url || extra?.ticket_url || e.ticket_url || priceClean),
              ticketStatus: 'active'
            };
          });
        }

        // Unconditionally import and merge all active dates from the shows database table, local storage, and props
        try {
          const allRawShows: any[] = [];

          // 1. Fetch from Supabase shows table
          const { data: showsData } = await supabaseClient
            .from('shows')
            .select('*')
            .order('date', { ascending: true });

          if (showsData && Array.isArray(showsData) && showsData.length > 0) {
            allRawShows.push(...showsData);
          } else {
            // Fallback only if no shows in Supabase table
            if (propShows && Array.isArray(propShows) && propShows.length > 0) {
              allRawShows.push(...propShows);
            }
          }

          if (allRawShows.length > 0) {
            // Deduplicate raw shows by id or headliner + date
            const dedupedRawShows: any[] = [];
            const seenShowMap = new Set<string>();

            allRawShows.forEach(s => {
              if (!s) return;
              const sId = String(s.id || '').toLowerCase().trim();
              const sH = String(s.headliner || s.band_name || s.name || s.show_name || '').toLowerCase().trim();
              const sD = String(s.date || s.show_date || '').toLowerCase().trim();
              const sig = sId ? `id_${sId}` : `h_${sH}__${sD}`;
              if (!seenShowMap.has(sig)) {
                seenShowMap.add(sig);
                dedupedRawShows.push(s);
              }
            });

            const showsGigs = dedupedRawShows
              .filter(s => {
                const sId = String(s.id || '').toLowerCase().trim();
                const sH = String(s.headliner || s.band_name || s.name || s.show_name || '').toLowerCase().trim();
                const sD = String(s.date || s.show_date || '').toLowerCase().trim();
                const sig = `${sH}__${sD}`;
                if (sId && deletedShowIds.has(sId)) return false;
                if (sH && sD && deletedShowIds.has(sig)) return false;
                return true;
              })
              .map(s => {
              const extra = extendedMap[s.id] || (s.show_name ? Object.values(extendedMap).find((v: any) => v.name === s.show_name || v.show_name === s.show_name || (v.date === s.date && v.city === s.city)) : null);
              const headlinerClean = (extra?.headliner || s.headliner || s.band_name || s.name || s.show_name || extra?.name || 'Headliner').trim();
              const isFollowed = !!(localFollows[headlinerClean.toLowerCase()] || (s.band_id && localFollows[s.band_id]));
              
              let dateDisplay = 'Upcoming';
              const rawDate = s.date || s.show_date || extra?.date;
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
                  }
                } catch (e) {}
              }

              const doorsVal = extra?.doors_time || s.doors_time;
              const formattedDoors = doorsVal ? formatTimeTo12Hour(doorsVal) : '';
              const timeDisplay = formattedDoors 
                ? (String(formattedDoors).toLowerCase().includes('door') ? formattedDoors : `Doors ${formattedDoors}`) 
                : (s.set_time ? `Set ${formatTimeTo12Hour(s.set_time)}` : (extra?.set_time ? `Set ${formatTimeTo12Hour(extra.set_time)}` : (s.time || 'Doors 7:30 PM')));

              const venueDisplay = extra?.venue || extra?.venue_name || s.venue || s.venue_name || s.venue_address || (s.name && !s.name.includes('Live') ? s.name : undefined) || 'Underground Venue';
              
              // Prioritize exact user prices and prevent falling back to hardcoded $25.00
              let priceDisplay = extra?.price || s.price;
              if (!priceDisplay) {
                if (extra?.day_of_show_price || s.day_of_show_price) {
                  const dos = extra?.day_of_show_price || s.day_of_show_price;
                  const presale = extra?.presale_price || s.presale_price;
                  priceDisplay = presale ? `$${presale} / $${dos}` : (dos.startsWith('$') ? dos : `$${dos}`);
                } else if (extra?.presale_price || s.presale_price) {
                  const presale = extra?.presale_price || s.presale_price;
                  priceDisplay = presale.startsWith('$') ? presale : `$${presale}`;
                } else if (s.ticket_price) {
                  priceDisplay = `$${s.ticket_price}`;
                } else if (extra?.external_ticket_url || s.external_ticket_url) {
                  priceDisplay = 'External Tickets';
                } else if (s.is_community_submitted || extra?.is_community_submitted) {
                  priceDisplay = 'Free / DIY';
                } else if (s.guarantee_amount && s.guarantee_amount > 0) {
                  priceDisplay = `$${Math.min(45, Math.max(15, Math.round(s.guarantee_amount / 100)))}`;
                } else {
                  priceDisplay = '$20.00';
                }
              }

              const rawCity = s.city || extra?.city;
              const rawState = s.state_province || extra?.state_province;
              const rawCountry = s.country || extra?.country;
              const venueNameVal = extra?.venue_name || s.venue_name || extra?.venue || s.venue || 'Underground Venue';
              const venueAddrVal = extra?.venue_address || s.venue_address;
              const capVal = extra?.capacity || s.capacity || extra?.venue_capacity || s.venue_capacity || extra?.expected_attendance || s.expected_attendance;

              return {
                ...s,
                ...(extra || {}),
                id: s.id,
                venue: venueDisplay,
                venue_name: venueNameVal,
                venue_address: venueAddrVal,
                capacity: capVal,
                venue_capacity: capVal,
                headliner: headlinerClean,
                time: timeDisplay,
                date: dateDisplay,
                rawDate: rawDate,
                city: rawCity,
                state_province: rawState,
                country: rawCountry,
                price: priceDisplay,
                day_of_show_price: extra?.day_of_show_price || s.day_of_show_price,
                presale_price: extra?.presale_price || s.presale_price,
                safety_code: extra?.safety_code || s.safety_code,
                isFollowed,
                isFromShowsTable: true,
                source: 'shows_table',
                external_ticket_url: extra?.external_ticket_url || s.external_ticket_url,
                ticket_url: extra?.ticket_url || s.ticket_url || extra?.external_ticket_url || s.external_ticket_url,
                ticketsAvailable: !!(extra?.external_ticket_url || s.external_ticket_url || extra?.ticket_url || s.ticket_url || priceDisplay),
                ticketStatus: 'active',
                is_community_submitted: !!(s.is_community_submitted || extra?.is_community_submitted)
              };
            });

            compiledGigs = [...compiledGigs, ...showsGigs];
          }
        } catch (e) {}

        // Clean up any stale duplicate keys from extendedMap that now exist in compiledGigs
        if (Object.keys(extendedMap).length > 0) {
          const syncedSignatures = new Set(compiledGigs.map(g => `${String(g.headliner || '').toLowerCase().trim()}__${String(g.rawDate || g.date || '').toLowerCase().trim()}`));
          let hasCleanedExtended = false;
          
          Object.keys(extendedMap).forEach(k => {
            const ext = extendedMap[k];
            if (ext) {
              const extSig = `${String(ext.headliner || ext.name || '').toLowerCase().trim()}__${String(ext.date || ext.show_date || '').toLowerCase().trim()}`;
              if (syncedSignatures.has(extSig) && k.startsWith('sh_comm_')) {
                delete extendedMap[k];
                hasCleanedExtended = true;
              }
            }
          });

          if (hasCleanedExtended) {
            try {
              localStorage.setItem('nexus_core_shows_extended', JSON.stringify(extendedMap));
            } catch (_) {}
          }

          // Only add local entries that don't match any compiled gig by ID or headliner + date
          const localGigs = Object.values(extendedMap)
            .filter((localShow: any) => {
              if (!localShow) return false;
              const localId = String(localShow.id || '').toLowerCase().trim();
              const localH = String(localShow.headliner || localShow.name || '').toLowerCase().trim();
              const localD = String(localShow.date || localShow.show_date || '').toLowerCase().trim();
              const localSig = `${localH}__${localD}`;
              
              if (localId && deletedShowIds.has(localId)) return false;
              if (localH && localD && deletedShowIds.has(localSig)) return false;
              if (compiledGigs.some(g => g.id === localShow.id)) return false;
              if (localH && localD && syncedSignatures.has(localSig)) return false;
              return true;
            })
            .map((localShow: any) => {
              const headlinerClean = (localShow.headliner || localShow.band_name || localShow.name || 'Live Show').trim();
              const isFollowed = !!(localFollows[headlinerClean.toLowerCase()] || (localShow.band_id && localFollows[localShow.band_id]));
              const doorsVal = localShow.doors_time;
              const timeDisplay = doorsVal 
                ? (String(doorsVal).toLowerCase().includes('door') ? doorsVal : `Doors ${doorsVal}`) 
                : (localShow.set_time ? `Set ${localShow.set_time}` : 'Doors 7:30 PM');

              return {
                ...localShow,
                id: localShow.id,
                venue: localShow.venue || localShow.venue_name || localShow.name || 'Underground Venue',
                venue_name: localShow.venue_name || localShow.venue || 'Underground Venue',
                venue_address: localShow.venue_address || undefined,
                capacity: localShow.capacity || localShow.venue_capacity,
                venue_capacity: localShow.capacity || localShow.venue_capacity,
                headliner: headlinerClean,
                time: timeDisplay,
                date: localShow.date || 'Upcoming',
                city: localShow.city,
                state_province: localShow.state_province,
                country: localShow.country,
                price: localShow.price || (localShow.external_ticket_url ? 'External Tickets' : 'Free / DIY'),
                isFollowed,
                is_community_submitted: true,
                external_ticket_url: localShow.external_ticket_url,
                ticket_url: localShow.ticket_url || localShow.external_ticket_url,
                ticketsAvailable: true,
                ticketStatus: 'active'
              };
            });

          compiledGigs = [...compiledGigs, ...localGigs];
        }

        // Strict Deduplication Pass: Ensure each gig is strictly unique by ID and headliner + date signature
        const seenIds = new Set<string>();
        const seenSignatures = new Set<string>();
        const deduplicatedGigs: any[] = [];

        for (const gig of compiledGigs) {
          if (!gig) continue;
          const gigId = String(gig.id || '').trim();
          const hClean = String(gig.headliner || gig.name || '').toLowerCase().trim();
          const dClean = String(gig.rawDate || gig.date || gig.show_date || '').toLowerCase().trim();
          const sig = `${hClean}__${dClean}`;

          if (gigId && deletedShowIds.has(gigId.toLowerCase())) {
            continue;
          }
          if (hClean && dClean && deletedShowIds.has(sig)) {
            continue;
          }

          if (gigId && seenIds.has(gigId)) {
            continue;
          }
          if (hClean && dClean && seenSignatures.has(sig)) {
            continue;
          }

          if (gigId) seenIds.add(gigId);
          if (hClean && dClean) seenSignatures.add(sig);
          deduplicatedGigs.push(gig);
        }

        if (deduplicatedGigs.length > 0) {
          // Sort so followed artists are front-and-center
          deduplicatedGigs.sort((a, b) => {
            if (a.isFollowed && !b.isFollowed) return -1;
            if (!a.isFollowed && b.isFollowed) return 1;
            return 0;
          });
          setLiveEvents(deduplicatedGigs);
        } else {
          // Apply followed flags to mock seeds, excluding blacklisted deleted shows
          const updatedMock = mockLiveTonight
            .filter(gig => {
              const gId = String(gig.id || '').toLowerCase().trim();
              const gSig = `${String(gig.headliner || '').toLowerCase().trim()}__${String(gig.date || '').toLowerCase().trim()}`;
              return !deletedShowIds.has(gId) && !deletedShowIds.has(gSig);
            })
            .map(gig => ({
              ...gig,
              isFollowed: !!localFollows[gig.headliner.toLowerCase()]
            })).sort((a, b) => (b.isFollowed ? 1 : 0) - (a.isFollowed ? 1 : 0));
          setLiveEvents(updatedMock);
        }

        const { data: setlistsData, error: setlistsError } = await supabaseClient.from('nexus_setlists').select('*');
        if (!setlistsError && setlistsData && setlistsData.length > 0) {
           const nextSetlists = { ...bandSetlists };
           setlistsData.forEach(row => {
             nextSetlists[row.band_name.toUpperCase()] = row.tracks;
           });
           setLiveSetlists(nextSetlists);
        }
      } catch (err) {
        console.error("Failed to fetch events and setlists:", err);
      }
  }, [propShows]);

  useEffect(() => {
    fetchEventsAndSetlists();
  }, [fetchEventsAndSetlists]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Pit Wall states
  const [activePitWallShow, setActivePitWallShow] = useState<{ band: string, city: string, venue: string } | null>(null);
  const [pitWallMessages, setPitWallMessages] = useState<Record<string, {id: string, user: string, text: string, time: string}[]>>({});
  const [newPitWallMessage, setNewPitWallMessage] = useState('');

  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [sharingPost, setSharingPost] = useState<FeedItem | null>(null);
  const [viewingReactionsPost, setViewingReactionsPost] = useState<FeedItem | null>(null);
  const [reactionsActiveTab, setReactionsActiveTab] = useState<string>('all');

  const [attachedSong, setAttachedSong] = useState<{ id: string; band: string; title: string; album: string; duration: string; } | null>(null);
  const [showSongModal, setShowSongModal] = useState(false);

  const [shopItems, setShopItems] = useState<any[]>(mockShopItems);
  const [selectedMerch, setSelectedMerch] = useState<any>(null);

  const [notifFilter, setNotifFilter] = useState('all');
  const markAllNotifsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true, is_read: true }));
      if (userProfile?.email) {
        try {
          localStorage.setItem(`nexus_notifications_${userProfile.email}`, JSON.stringify(updated));
        } catch (e) {}
      }
      const userUUID = userProfile?.id && extractUUID(userProfile.id);
      const supabaseClient = getSupabase();
      if (supabaseClient && userUUID) {
        supabaseClient.from('nexus_notifications')
          .update({ is_read: true })
          .eq('user_id', userUUID)
          .then(({ error }: any) => {
            if (error) console.warn("Error marking all notifications read in Supabase:", error);
          });
      }
      return updated;
    });
    triggerNotification?.('All notifications marked as read.');
  };

  const clearAllNotifs = () => {
    setNotifications([]);
    if (userProfile?.email) {
      try {
        localStorage.setItem(`nexus_notifications_${userProfile.email}`, JSON.stringify([]));
      } catch (e) {}
    }
    const userUUID = userProfile?.id && extractUUID(userProfile.id);
    const supabaseClient = getSupabase();
    if (supabaseClient && userUUID) {
      supabaseClient.from('nexus_notifications')
        .delete()
        .eq('user_id', userUUID)
        .then(({ error }: any) => {
          if (error) console.warn("Error clearing notifications in Supabase:", error);
        });
    }
    triggerNotification?.('All notifications cleared.');
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (userProfile?.email) {
        try {
          localStorage.setItem(`nexus_notifications_${userProfile.email}`, JSON.stringify(updated));
        } catch (e) {}
      }
      const notifUUID = extractUUID(id);
      const supabaseClient = getSupabase();
      if (supabaseClient && notifUUID) {
        supabaseClient.from('nexus_notifications')
          .delete()
          .eq('id', notifUUID)
          .then(({ error }: any) => {
            if (error) console.warn("Error deleting notification in Supabase:", error);
          });
      }
      return updated;
    });
  };

  const [activeReactions, setActiveReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);

  // New Feature States
  const [showSceneRadio, setShowSceneRadio] = useState(true);
  const [sceneRadioTrack, setSceneRadioTrack] = useState<{title: string, artist: string, albumArt: string}>({
    title: 'Phobophile',
    artist: 'CRYPTOPSY',
    albumArt: 'https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=400&q=80'
  });
  const [isEventModeActive, setIsEventModeActive] = useState(false);
  const [activeEventData, setActiveEventData] = useState<any>(null);
  const [eventModeTab, setEventModeTab] = useState<'info' | 'setlist' | 'chat'>('info');
  const [isTicketScanned, setIsTicketScanned] = useState(false);
  const [scanTime, setScanTime] = useState<string | null>(null);

  const {
    isPinModalOpen,
    setIsPinModalOpen,
    pinEntered,
    setPinEntered,
    pinError,
    setPinError,
    profileFullLegalName,
    setProfileFullLegalName,
    profileHandle,
    setProfileHandle,
    profileEmail,
    setProfileEmail,
    profilePassword,
    setProfilePassword,
    profilePin,
    setProfilePin,
    profileLocation,
    setProfileLocation,
    profileZip,
    setProfileZip,
    profileGenres,
    setProfileGenres,
    expandedClusters,
    setExpandedClusters,
    genreClusterExpanded,
    setGenreClusterExpanded,
    profilePrimaryGenres,
    setProfilePrimaryGenres,
    profileMicroGenres,
    setProfileMicroGenres,
    profileTopSongArtist,
    setProfileTopSongArtist,
    profileTopSongTitle,
    setProfileTopSongTitle,
    profileFavoriteSong,
    setProfileFavoriteSong,
    profileTopSongUrl,
    setProfileTopSongUrl,
    profileMetalArchivesUrl,
    setProfileMetalArchivesUrl,
    profileSceneCred,
    setProfileSceneCred,
    digitalTicketsScanned,
    setDigitalTicketsScanned,
    physicalMerchBought,
    setPhysicalMerchBought,
    bandsDiscovered,
    setBandsDiscovered,
    profileAvatarUrl,
    setProfileAvatarUrl,
    profileCoverUrl,
    setProfileCoverUrl,
    cropperOpen,
    setCropperOpen,
    cropperImageSrc,
    setCropperImageSrc,
    cropperType,
    setCropperType,
    avatarFileInputRef,
    coverFileInputRef,
    profileSceneRoles,
    setProfileSceneRoles,
    profileBlurb,
    setProfileBlurb,
    profileStealthMode,
    setProfileStealthMode,
    filterHideTicketPresales,
    setFilterHideTicketPresales,
    filterShowMerchDropsOnlyFromFollowed,
    setFilterShowMerchDropsOnlyFromFollowed,
    filterShowFollowedOnly,
    setFilterShowFollowedOnly,
    prefPushNotifications,
    setPrefPushNotifications,
    prefLocationServices,
    setPrefLocationServices,
    saveProfileData,

    // Collections
    myCollections,
    setMyCollections,
    collectionTab,
    setCollectionTab,
    viewingReceipt,
    setViewingReceipt,

    // Ticket upgrades & transfer
    selectedTicketTier,
    setSelectedTicketTier,
    attendeeDetails,
    setAttendeeDetails,
    transferMode,
    setTransferMode,
    transferRecipient,
    setTransferRecipient,
    transferMessage,
    setTransferMessage,
    resellPrice,
    setResellPrice,
    resellPaymentInfo,
    setResellPaymentInfo,
    resellMethod,
    setResellMethod,
    transferringAttendeeIndex,
    setTransferringAttendeeIndex,
    simulatedResaleBalance,
    setSimulatedResaleBalance,

    // Collections player
    collPlayerActiveId,
    setCollPlayerActiveId,
    collPlayerActiveTrackId,
    setCollPlayerActiveTrackId,
    collPlayerIsPlaying,
    setCollPlayerIsPlaying,
    collPlayerProgress,
    setCollPlayerProgress,
    collPlayerVolume,
    setCollPlayerVolume,
    collPlayerRatings,
    setCollPlayerRatings,

    // Profile playback
    profileActivePlaybackTrackId,
    setProfileActivePlaybackTrackId,
    profileIsPlaying,
    setProfileIsPlaying,
    profilePlaybackProgress,
    setProfilePlaybackProgress,
    profileAudioVolume,
    setProfileAudioVolume,
    rotationIsPlaying,
    setRotationIsPlaying
  } = useSocialProfileState({ portalRole, userProfile, activeBand: resolvedActiveBand || activeBand, quantity });

  const [hypeAnimations, setHypeAnimations] = useState<Record<string, boolean>>({});
  const [reactionMenuOpenFor, setReactionMenuOpenFor] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    // Clearance
    localClearance,
    setLocalClearance,
    currentClearance,
    updateClearance,
    proClearanceLevel,

    // Composer & Post state
    postIdentity,
    setPostIdentity,
    newPostText,
    setNewPostText,
    editingPostId,
    setEditingPostId,
    editingPostText,
    setEditingPostText,
    deleteConfirmPostId,
    setDeleteConfirmPostId,
    mentionQuery,
    setMentionQuery,
    newPostTag,
    setNewPostTag,
    showTagWarning,
    setShowTagWarning,
    showContentWarning,
    setShowContentWarning,
    expandedComments,
    setExpandedComments,
    mediaUrl,
    setMediaUrl,
    selectedMediaFiles,
    setSelectedMediaFiles,
    isSubmittingPost,
    setIsSubmittingPost,
    isDetectingLocation,
    setIsDetectingLocation,
    youtubeUrl,
    setYoutubeUrl,
    taggedVenue,
    setTaggedVenue,
    taggedBands,
    setTaggedBands,
    showMediaInput,
    setShowMediaInput,
    showYoutubeInput,
    setShowYoutubeInput,
    showVenueInput,
    setShowVenueInput,
    showPollModal,
    setShowPollModal,
    showMerchDropModal,
    setShowMerchDropModal,
    pollQuestion,
    setPollQuestion,
    pollVariant,
    setPollVariant,
    pollOptions,
    setPollOptions,
    pollIsTimed,
    setPollIsTimed,
    pollTimerDays,
    setPollTimerDays,
    pollTimerHours,
    setPollTimerHours,
    merchDropName,
    setMerchDropName,
    merchDropPrice,
    setMerchDropPrice,
    merchDropThumbnail,
    setMerchDropThumbnail,
    merchDropImages,
    setMerchDropImages,
    merchDropCategory,
    setMerchDropCategory,
    merchDropDescription,
    setMerchDropDescription,
    merchDropVariants,
    setMerchDropVariants,
    merchDropStock,
    setMerchDropStock,
    merchDropIsUnlimited,
    setMerchDropIsUnlimited,
    merchDropAllowNegotiation,
    setMerchDropAllowNegotiation,
    merchDropIsTimed,
    setMerchDropIsTimed,
    merchDropTimerHours,
    setMerchDropTimerHours,
    merchDropTimerMinutes,
    setMerchDropTimerMinutes,
    commentInputs,
    setCommentInputs,

    // Tape state
    showTapeInput,
    setShowTapeInput,
    tapeTitle,
    setTapeTitle,
    tapeBand,
    setTapeBand,
    tapeDate,
    setTapeDate,
    tapeDuration,
    setTapeDuration,
    tapeAudioUrl,
    setTapeAudioUrl,
    tapeAudioFileName,
    setTapeAudioFileName,
    isUploadingTapeAudio,
    setIsUploadingTapeAudio,
    tapeFileInputRef,

    // Filters
    shopCategory,
    setShopCategory,
    shopBrandFilter,
    setShopBrandFilter,
    communityCategory,
    setCommunityCategory,
    shopSearchQuery,
    setShopSearchQuery,
    forumSearch,
    setForumSearch,
    forumCategory,
    setForumCategory,
    forumPrimaryGenre,
    setForumPrimaryGenre,
    forumMicroGenre,
    setForumMicroGenre,

    // DIY Event states
    showEventModal,
    setShowEventModal,
    eventTitle,
    setEventTitle,
    eventType,
    setEventType,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    eventLocationName,
    setEventLocationName,
    eventAddress,
    setEventAddress,
    eventIsSecret,
    setEventIsSecret,
    eventLineup,
    setEventLineup,
    eventFlyerUrl,
    setEventFlyerUrl,
    eventDescription,
    setEventDescription,
    eventCost,
    setEventCost,
    eventTicketUrl,
    setEventTicketUrl,

    // Handlers
    handleDetectLocation,
    handleMediaUpload,
    removeMediaFile,
    handleReaction,
    handleEditPost,
    handleSaveEdit,
    handleDeletePost,
    handleCreatePost,
  } = useSocialFeedState({
    feed,
    setFeed,
    userProfile,
    portalRole,
    activeBand: resolvedActiveBand || activeBand,
    isEmbedded,
    profileHandle,
    profileAvatarUrl,
    profileSceneRoles,
    profileFullLegalName,
    activeClearanceLevel,
    setActiveClearanceLevel,
    triggerNotification,
    attachedSong,
    setAttachedSong,
    setHypeAnimations,
    setReactionMenuOpenFor,
    longPressTimerRef: longPressTimer,
    setNotifications,
    bands: effectiveBands,
  });

  // Listen for Scene Radio track sharing events to load track into Post Creator
  useEffect(() => {
    const handleRadioShare = (e: any) => {
      const detail = e.detail;
      if (!detail || !detail.videoId) return;

      const ytUrl = `https://www.youtube.com/watch?v=${detail.videoId}`;
      const shareCaption = `🔥 Currently spinning "${detail.title}" by ${detail.author || 'Scene Artist'} on Scene Radio [${detail.genreName || 'Radio'}]! 🤘`;

      setNewPostText(shareCaption);
      setYoutubeUrl(ytUrl);
      setShowYoutubeInput(true);
      if (detail.genreName) {
        setNewPostTag(detail.genreName);
      }

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(ytUrl).catch(() => {});
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerNotification?.(`🚀 Scene Radio track loaded into Post Creator! Edit & click Post when ready.`);
    };

    window.addEventListener('nexus_share_radio_track', handleRadioShare);
    return () => {
      window.removeEventListener('nexus_share_radio_track', handleRadioShare);
    };
  }, [setNewPostText, setYoutubeUrl, setShowYoutubeInput, setNewPostTag, triggerNotification]);

  // Retro Tape Player hook
  const {
    playingTapeId,
    setPlayingTapeId,
    tapeProgress,
    setTapeProgress,
    handleTapeAudioUpload,
    formatProgress
  } = useTapePlayer({
    feed,
    userProfile,
    triggerNotification,
    tapeTitle,
    setTapeTitle,
    tapeBand,
    setTapeBand,
    setTapeDuration,
    setTapeAudioUrl,
    setIsUploadingTapeAudio,
    setTapeAudioFileName,
    tapeFileInputRef
  });

  // Offline Syncing Engine States
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineSyncStatus, setOfflineSyncStatus] = useState<'synced' | 'local_saved' | 'syncing'>('synced');
  const [lastOfflineSaveTime, setLastOfflineSaveTime] = useState<string | null>(null);
  const isLoadedRef = useRef(false);
  const isIncomingChatSync = useRef(false);
  const isIncomingNotifSync = useRef(false);
  const lastLoadedPortalRoleRef = useRef<string | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (portalRole === 'label') {
      setProfileLocation(userProfile?.label_headquarters || '');
      setLabelHeadquarters(userProfile?.label_headquarters || '');
    }
  }, [portalRole, userProfile?.label_headquarters]);

  useEffect(() => {
    if (portalRole === 'band' && activeBand) {
      if (activeBand.homebase) {
        setLabelHeadquarters(activeBand.homebase);
      }
      if (activeBand.founded_year) {
        setLabelFoundedYear(activeBand.founded_year);
      }
      if (activeBand.ticker) {
        setLabelRosterTicker(activeBand.ticker);
      }
      if (activeBand.blurb) {
        setProfileBlurb(activeBand.blurb);
      }
    }
  }, [portalRole, activeBand]);


  // On-mount: Load from caches & Register network event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSyncStatus('syncing');
      setTimeout(() => {
        setOfflineSyncStatus('synced');
        triggerNotification?.("🌐 Connection restored! All offline changes have been synchronized with the main ledger.");
      }, 1200);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      triggerNotification?.("📶 Signal outage detected. Nexus Terminal has switched to local offline cache mode.");
    };

    const handleAvatarUpdateEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      // Guard: Ignore if this update is for a band entity, community band, or release
      if (detail.isBand || detail.type === 'band' || detail.isCommunityBand || detail.is_community_band) {
        return;
      }

      const newAvatarUrl = detail.avatarUrl || detail.avatar_url || detail.logo_url;
      if (newAvatarUrl && typeof newAvatarUrl === 'string') {
        const isUserExplicit = Boolean(
          detail.isUserAvatar ||
          detail.target === 'user' ||
          (detail.id && userProfile?.id && detail.id === userProfile.id) ||
          (detail.authorName && userProfile?.name && detail.authorName.toLowerCase().trim() === userProfile.name.toLowerCase().trim())
        );

        // Do not default to current user if ID belongs to someone else
        const targetUserId = detail.id || (isUserExplicit ? userProfile?.id : null);
        const targetName = (detail.authorName || detail.name || (isUserExplicit ? userProfile?.name : '') || '').toLowerCase().trim();

        if (!targetUserId && !targetName) return;

        // Dynamically update the author avatar across in-memory feed items without creating a duplicate post
        setFeed(prev => prev.map(item => {
          const rawItem = item as any;
          const itemUserId = rawItem.user_id || rawItem.author_id || item.author?.id;
          const itemName = (item.author?.name || rawItem.authorName || '').toLowerCase().trim();
          const itemIsBand = Boolean((item.author as any)?.isBand || rawItem.isBand || rawItem.workspace_type === 'band' || rawItem.authorRole === 'Band / Artist' || item.author?.role === 'Band / Artist');

          // If this is a personal user avatar update, never touch posts made by bands
          if (isUserExplicit && itemIsBand) return item;

          if ((targetUserId && itemUserId === targetUserId) || (targetName && itemName === targetName)) {
            return {
              ...item,
              author: {
                ...item.author,
                avatar: newAvatarUrl
              }
            };
          }
          return item;
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('nexus_avatar_updated', handleAvatarUpdateEvent);

    const currentUserId = userProfile?.id || 'guest';
    const userChanged = lastLoadedUserIdRef.current !== currentUserId;
    const roleChanged = lastLoadedPortalRoleRef.current !== portalRole || userChanged;
    
    lastLoadedPortalRoleRef.current = portalRole;
    lastLoadedUserIdRef.current = currentUserId;

    if (roleChanged) {
      isLoadedRef.current = false;

      // Reset to defaults first based on portalRole to avoid state leaking / overwriting professional profiles
      
      const signupLocation = (userProfile?.city && userProfile?.state_province) ? `${userProfile.city}, ${userProfile.state_province}` : null;
      
      let defaultName = '';
      let defaultHandle = '';
      let defaultAvatar = null;
      let defaultCover = null;
      let defaultLocation = signupLocation || userProfile?.location_code || userProfile?.city_state || 'Detroit, MI';
      let defaultGenres = (userProfile?.genre_tags && userProfile.genre_tags.length > 0) ? userProfile.genre_tags : ['Death Metal', 'Technical Death Metal', 'Grindcore'];
      let defaultFavoriteSong = '';
      let defaultBlurb = '';
      let defaultStealthMode = false;
      let defaultHideTicketPresales = false;
      let defaultShowMerchDropsOnlyFromFollowed = false;
      let defaultShowFollowedOnly = false;
      let defaultPushNotifications = true;
      let defaultLocationServices = true;

      if (portalRole === 'fan_only') {
        defaultName = userProfile?.full_name || userProfile?.legal_name || userProfile?.name || userProfile?.screen_name || 'Fan Listener';
        defaultHandle = userProfile?.console_handle || userProfile?.screen_name?.replace(/\s+/g, '') || 'fan_core';
        defaultAvatar = userProfile?.avatar_url || 'FL';
        defaultCover = userProfile?.banner_url || null;
        defaultLocation = signupLocation || userProfile?.location_code || 'Denison, TX';
        defaultGenres = (userProfile?.genre_tags && userProfile.genre_tags.length > 0) ? userProfile.genre_tags : ['Goregrind', 'Slam', 'Brutal Death Metal', 'Death Metal'];
      } else if (portalRole === 'industry_pro' || portalRole === 'industry pro') {
        defaultName = userProfile?.full_name || userProfile?.legal_name || userProfile?.name || 'Industry Pro';
        defaultHandle = userProfile?.console_handle || userProfile?.handle || (userProfile?.screen_name || userProfile?.name || '').replace(/\s+/g, '') || 'pro_user';
        defaultAvatar = userProfile?.avatar_url || null;
        defaultCover = userProfile?.banner_url || null;
        defaultLocation = signupLocation || userProfile?.location_code || 'Detroit, MI';
        defaultGenres = (userProfile?.genre_tags && userProfile.genre_tags.length > 0) ? userProfile.genre_tags : ['Death Metal', 'Technical Death Metal', 'Grindcore'];
        defaultFavoriteSong = '';
      } else {
        // Professional portals
        defaultName = portalRole === 'band' ? resolveBandName(resolvedActiveBand || activeBand, userProfile)
          : portalRole === 'creative' ? (userProfile?.creative_metadata?.business_name || 'Pro Creative')
          : portalRole === 'promoter' ? (userProfile?.promoter_metadata?.brand_name || 'Pro Promoter')
          : portalRole === 'label' ? (userProfile?.label_company_name || 'Pro Label')
          : (userProfile?.full_name || userProfile?.legal_name || userProfile?.name || 'Pro Account');

        defaultHandle = portalRole === 'band' ? resolveBandHandle(resolvedActiveBand || activeBand, userProfile)
          : portalRole === 'creative' ? (userProfile?.creative_metadata?.business_name?.replace(/\s+/g, '') || 'creative_pro')
          : portalRole === 'promoter' ? (userProfile?.promoter_metadata?.brand_name?.replace(/\s+/g, '') || 'promoter_pro')
          : portalRole === 'label' ? (userProfile?.label_url_slug || 'label_pro')
          : (userProfile?.console_handle || userProfile?.handle || 'pro_account');

        defaultAvatar = portalRole === 'band' ? resolveBandLogo(resolvedActiveBand || activeBand, userProfile)
          : portalRole === 'label' ? (userProfile?.label_avatar || null)
          : portalRole === 'creative' ? (userProfile?.creative_avatar || null)
          : portalRole === 'promoter' ? ((userProfile as any)?.promoter_logo || null)
          : (userProfile?.avatar_url || null);

        defaultCover = portalRole === 'band' ? resolveBandCover(resolvedActiveBand || activeBand, userProfile)
          : portalRole === 'label' ? (userProfile?.label_banner || null)
          : portalRole === 'creative' ? (userProfile?.creative_banner || null)
          : portalRole === 'promoter' ? ((userProfile as any)?.promoter_cover_image || null)
          : (userProfile?.banner_url || null);

        defaultLocation = portalRole === 'band' ? resolveBandLocation(resolvedActiveBand || activeBand, userProfile)
          : portalRole === 'label' && userProfile?.label_headquarters ? userProfile.label_headquarters 
          : portalRole === 'creative' && userProfile?.creative_metadata?.base_location ? userProfile.creative_metadata.base_location
          : portalRole === 'promoter' && (userProfile as any)?.promoter_city ? `${(userProfile as any).promoter_city}, ${(userProfile as any).promoter_state}`
          : (signupLocation || userProfile?.location_code || userProfile?.city_state || 'Detroit, MI');
      }

      setProfileFullLegalName(defaultName);
      setProfileHandle(defaultHandle);
      setProfileAvatarUrl(defaultAvatar);
      setProfileCoverUrl(defaultCover);
      setProfileLocation(defaultLocation);
      setProfileGenres(defaultGenres);
      setProfileFavoriteSong(defaultFavoriteSong);
      setProfileBlurb(defaultBlurb);
      setProfileStealthMode(defaultStealthMode);
      setFilterHideTicketPresales(defaultHideTicketPresales);
      setFilterShowMerchDropsOnlyFromFollowed(defaultShowMerchDropsOnlyFromFollowed);
      setFilterShowFollowedOnly(defaultShowFollowedOnly);
      setPrefPushNotifications(defaultPushNotifications);
      setPrefLocationServices(defaultLocationServices);

      const profileCacheKey = `nexus_${portalRole}_profile_v1_${userProfile?.id || 'guest'}`;

      // Initial load sequence
let loadedFromLocalStorage = false;
try {
  const parsed = loadProfileLocalStorageCache(portalRole, userProfile?.id);
  if (parsed) {
    if (portalRole === 'band') {
      setProfileFullLegalName(resolveBandName(resolvedActiveBand || activeBand, userProfile));
      setProfileHandle(resolveBandHandle(resolvedActiveBand || activeBand, userProfile));
      setProfileAvatarUrl(resolveBandLogo(resolvedActiveBand || activeBand, userProfile));
      setProfileCoverUrl(resolveBandCover(resolvedActiveBand || activeBand, userProfile));
      setProfileLocation(resolveBandLocation(resolvedActiveBand || activeBand, userProfile));
      setProfileBlurb(resolveBandBio(resolvedActiveBand || activeBand, userProfile));
    } else if (portalRole !== 'industry_pro' && portalRole !== 'fan_only') {
      // Keep live parent values instead of overriding with stale localStorage cache
      const parentName = portalRole === 'creative' ? userProfile?.creative_metadata?.business_name || userProfile?.business_name || userProfile?.full_name
        : portalRole === 'promoter' ? userProfile?.promoter_metadata?.brand_name 
        : portalRole === 'label' ? userProfile?.label_company_name 
        : userProfile?.name || userProfile?.full_name;
      
      setProfileFullLegalName(parentName || parsed.profileFullLegalName || 'Pro Account');

      const parentHandle = portalRole === 'creative' ? (userProfile?.creative_metadata?.business_name || userProfile?.business_name)?.toLowerCase().replace(/\s+/g, '')
        : portalRole === 'promoter' ? userProfile?.promoter_metadata?.brand_name?.toLowerCase().replace(/\s+/g, '')
        : portalRole === 'label' ? userProfile?.label_url_slug
        : null;

      if (parentHandle) {
        setProfileHandle(parentHandle);
      } else if (parsed.profileHandle) {
        setProfileHandle(parsed.profileHandle);
      }

      const parentAvatar = portalRole === 'label' ? userProfile?.label_avatar 
        : portalRole === 'creative' ? userProfile?.creative_avatar || userProfile?.avatar_url
        : portalRole === 'promoter' ? (userProfile as any)?.promoter_logo 
        : userProfile?.avatar_url;
      
      if (parentAvatar) setProfileAvatarUrl(parentAvatar);
      else if (parsed.profileAvatarUrl) setProfileAvatarUrl(parsed.profileAvatarUrl);

      const parentCover = portalRole === 'label' ? userProfile?.label_banner 
        : portalRole === 'creative' ? userProfile?.creative_banner || userProfile?.banner_url
        : portalRole === 'promoter' ? (userProfile as any)?.promoter_cover_image 
        : userProfile?.banner_url;
      
      if (parentCover) setProfileCoverUrl(parentCover);
      else if (parsed.profileCoverUrl) setProfileCoverUrl(parsed.profileCoverUrl);

    } else {
      const uName = userProfile?.full_name || userProfile?.legal_name || userProfile?.name || userProfile?.screen_name;
      if (uName && uName !== 'New User' && uName !== '') {
        setProfileFullLegalName(uName);
      } else if (parsed.profileFullLegalName) {
        setProfileFullLegalName(parsed.profileFullLegalName);
      }

      const uAvatar = userProfile?.avatar_url;
      const defaultAvatar = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20Circuits.png';
      if (uAvatar && uAvatar !== defaultAvatar) {
        setProfileAvatarUrl(uAvatar);
      } else if (parsed.profileAvatarUrl) {
        setProfileAvatarUrl(parsed.profileAvatarUrl);
      }

      const uCover = userProfile?.banner_url;
      if (uCover) {
        setProfileCoverUrl(uCover);
      } else if (parsed.profileCoverUrl) {
        setProfileCoverUrl(parsed.profileCoverUrl);
      }
    }

    const uHandle = userProfile?.handle || userProfile?.console_handle || userProfile?.screen_name?.replace(/\s+/g, '');
    if (uHandle && uHandle !== '') {
      setProfileHandle(uHandle);
    } else if (parsed.profileHandle) {
      setProfileHandle(parsed.profileHandle);
    }

    const uEmail = userProfile?.email;
    if (uEmail && uEmail !== '') {
      setProfileEmail(uEmail);
    } else if (parsed.profileEmail) {
      setProfileEmail(parsed.profileEmail);
    }

    if (parsed.profilePassword) setProfilePassword(parsed.profilePassword);

    const uPin = (userProfile as any)?.pin;
    if (uPin && uPin !== '') {
      setProfilePin(uPin);
    } else if (parsed.profilePin) {
      setProfilePin(parsed.profilePin);
    }

    const uLoc = userProfile?.location_code || userProfile?.location;
    if (uLoc && uLoc !== '') {
      setProfileLocation(uLoc);
    } else if (parsed.profileLocation) {
      setProfileLocation(parsed.profileLocation);
    }

    if (parsed.profileGenres) setProfileGenres(parsed.profileGenres);
    if (parsed.profilePrimaryGenres) setProfilePrimaryGenres(parsed.profilePrimaryGenres);
    if (parsed.profileMicroGenres) setProfileMicroGenres(parsed.profileMicroGenres);
    if (parsed.profileTopSongArtist !== undefined) setProfileTopSongArtist(parsed.profileTopSongArtist);
    if (parsed.profileTopSongTitle !== undefined) setProfileTopSongTitle(parsed.profileTopSongTitle);
    if (parsed.profileFavoriteSong) setProfileFavoriteSong(parsed.profileFavoriteSong);
    if (parsed.profileTopSongUrl) setProfileTopSongUrl(parsed.profileTopSongUrl);
    if (parsed.profileSceneRoles) {
      let roles = parsed.profileSceneRoles;
      if (portalRole === 'label') {
        roles = roles.filter((r: string) => r !== 'Musician' && r !== 'Artist');
        if (!roles.includes('Record Label')) roles.push('Record Label');
      }
      setProfileSceneRoles(roles);
    }
    if (parsed.profileBlurb) setProfileBlurb(parsed.profileBlurb);
    if (parsed.profileStealthMode !== undefined) setProfileStealthMode(parsed.profileStealthMode);
    if (parsed.filterHideTicketPresales !== undefined) setFilterHideTicketPresales(parsed.filterHideTicketPresales);
    if (parsed.filterShowMerchDropsOnlyFromFollowed !== undefined) setFilterShowMerchDropsOnlyFromFollowed(parsed.filterShowMerchDropsOnlyFromFollowed);
    if (parsed.filterShowFollowedOnly !== undefined) setFilterShowFollowedOnly(parsed.filterShowFollowedOnly);
    if (parsed.prefPushNotifications !== undefined) setPrefPushNotifications(parsed.prefPushNotifications);
    if (parsed.prefLocationServices !== undefined) setPrefLocationServices(parsed.prefLocationServices);
    
    loadedFromLocalStorage = true;
    isLoadedRef.current = true;
  }
} catch (e) {
  console.error("Error loading offline profile cache", e);
}

      // Try IndexedDB as secondary robust backup
loadProfileIndexedDBCache(portalRole, userProfile?.id).then((data: any) => {
  if (data) {
    // Helper to reject base64 strings from being treated as valid image URLs
    const getCleanUrl = (url: string | null | undefined) => {
      if (!url) return null;
      if (url.startsWith('data:image')) return null; // Blocks base64 leaks!
      return url;
    };

    // Always restore avatar and cover urls from IndexedDB since they are excluded from localStorage
    if (portalRole === 'band') {
      setProfileAvatarUrl(resolveBandLogo(resolvedActiveBand || activeBand, userProfile));
      setProfileCoverUrl(resolveBandCover(resolvedActiveBand || activeBand, userProfile));
      setProfileFullLegalName(resolveBandName(resolvedActiveBand || activeBand, userProfile));
      setProfileHandle(resolveBandHandle(resolvedActiveBand || activeBand, userProfile));
      setProfileLocation(resolveBandLocation(resolvedActiveBand || activeBand, userProfile));
      setProfileBlurb(resolveBandBio(resolvedActiveBand || activeBand, userProfile));
    } else if (portalRole !== 'industry_pro' && portalRole !== 'fan_only') {
      const parentAvatar = portalRole === 'label' ? userProfile?.label_avatar 
        : portalRole === 'creative' ? userProfile?.creative_avatar || userProfile?.avatar_url
        : portalRole === 'promoter' ? (userProfile as any)?.promoter_logo 
        : userProfile?.avatar_url;
      
      setProfileAvatarUrl(getCleanUrl(parentAvatar) || getCleanUrl(data.profileAvatarUrl) || null);

      const parentCover = portalRole === 'label' ? userProfile?.label_banner 
        : portalRole === 'creative' ? userProfile?.creative_banner || userProfile?.banner_url
        : portalRole === 'promoter' ? (userProfile as any)?.promoter_cover_image 
        : userProfile?.banner_url;
      
      setProfileCoverUrl(getCleanUrl(parentCover) || getCleanUrl(data.profileCoverUrl) || null);
    } else {
      if (data.profileAvatarUrl && !data.profileAvatarUrl.startsWith('data:image')) {
        setProfileAvatarUrl(data.profileAvatarUrl);
      }
      if (data.profileCoverUrl && !data.profileCoverUrl.startsWith('data:image')) {
        setProfileCoverUrl(data.profileCoverUrl);
      }
    }

    if (!loadedFromLocalStorage) {
      if (portalRole === 'band') {
        setProfileFullLegalName(resolveBandName(resolvedActiveBand || activeBand, userProfile));
        setProfileHandle(resolveBandHandle(resolvedActiveBand || activeBand, userProfile));
      } else if (portalRole !== 'industry_pro' && portalRole !== 'fan_only') {
        const parentName = portalRole === 'creative' ? userProfile?.creative_metadata?.business_name || userProfile?.business_name 
          : portalRole === 'promoter' ? userProfile?.promoter_metadata?.brand_name 
          : portalRole === 'label' ? userProfile?.label_company_name 
          : userProfile?.name || userProfile?.full_name;
        
        setProfileFullLegalName(parentName || data.profileFullLegalName || 'Pro Account');

        const parentHandle = portalRole === 'creative' ? (userProfile?.creative_metadata?.business_name || userProfile?.business_name)?.toLowerCase().replace(/\s+/g, '')
          : portalRole === 'promoter' ? userProfile?.promoter_metadata?.brand_name?.toLowerCase().replace(/\s+/g, '')
          : portalRole === 'label' ? userProfile?.label_url_slug
          : null;
        
        setProfileHandle(parentHandle || data.profileHandle || 'pro_account');
      } else {
        setProfileFullLegalName(data.profileFullLegalName || userProfile?.full_name || userProfile?.legal_name || userProfile?.name || userProfile?.screen_name || 'Fan Listener');
        if (data.profileHandle) setProfileHandle(data.profileHandle);
      }

      if (data.profileEmail) setProfileEmail(data.profileEmail);
      if (data.profilePassword) setProfilePassword(data.profilePassword);
      if (data.profilePin) setProfilePin(data.profilePin);
      
      if (portalRole === 'label' && userProfile?.label_headquarters) {
        setProfileLocation(userProfile.label_headquarters);
      } else if (data.profileLocation) {
        setProfileLocation(data.profileLocation);
      }

      if (data.profileGenres) setProfileGenres(data.profileGenres);
      if (data.profilePrimaryGenres) setProfilePrimaryGenres(data.profilePrimaryGenres);
      if (data.profileMicroGenres) setProfileMicroGenres(data.profileMicroGenres);
      if (data.profileTopSongArtist !== undefined) setProfileTopSongArtist(data.profileTopSongArtist);
      if (data.profileTopSongTitle !== undefined) setProfileTopSongTitle(data.profileTopSongTitle);
      if (data.profileFavoriteSong) setProfileFavoriteSong(data.profileFavoriteSong);
      if (data.profileTopSongUrl) setProfileTopSongUrl(data.profileTopSongUrl);
      if (data.profileSceneRoles) {
        let roles = data.profileSceneRoles;
        if (portalRole === 'label') {
          roles = roles.filter((r: string) => r !== 'Musician' && r !== 'Artist');
          if (!roles.includes('Record Label')) roles.push('Record Label');
        }
        setProfileSceneRoles(roles);
      }
      if (data.profileBlurb) setProfileBlurb(data.profileBlurb);
      if (data.profileStealthMode !== undefined) setProfileStealthMode(data.profileStealthMode);
      if (data.filterHideTicketPresales !== undefined) setFilterHideTicketPresales(data.filterHideTicketPresales);
      if (data.filterShowMerchDropsOnlyFromFollowed !== undefined) setFilterShowMerchDropsOnlyFromFollowed(data.filterShowMerchDropsOnlyFromFollowed);
      if (data.filterShowFollowedOnly !== undefined) setFilterShowFollowedOnly(data.filterShowFollowedOnly);
      if (data.prefPushNotifications !== undefined) setPrefPushNotifications(data.prefPushNotifications);
      if (data.prefLocationServices !== undefined) setPrefLocationServices(data.prefLocationServices);
    }
  }
  isLoadedRef.current = true;
}).catch(err => {
  console.warn("IndexedDB connection failed, falling back:", err);
  isLoadedRef.current = true;
});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('nexus_avatar_updated', handleAvatarUpdateEvent);
    };
  }, [portalRole, userProfile?.id, activeBand?.id]);

  // Core background autosave has been disabled to protect user profiles from silent corruption or overrides.
  // Profile settings are only updated when explicitly saved by the user and authorized via PIN code entry.
  useEffect(() => {
    // Left empty to prevent autosave corruption.
  }, []);




  // Real-time syncing for chats and notifications is delegated to useSocialFeedSync hook

  // Payment OAuth Connections States
  const [isGooglePayConnected, setIsGooglePayConnected] = useState(false);
  const [isApplePayConnected, setIsApplePayConnected] = useState(false);
  const [isPaypalConnected, setIsPaypalConnected] = useState(false);
  const [isConnectingPayment, setIsConnectingPayment] = useState<string | null>(null); // 'google' | 'apple' | 'paypal' | null

  // NEW TAB NAVIGATION STATE
  const [activeTab, setActiveTab] = useState<'feed' | 'shop' | 'forum' | 'messages' | 'gallery' | 'reels'>('feed');
  const [isLiveTonightOpen, setIsLiveTonightOpen] = useState(true);

  useEffect(() => {
    if (activeTab === 'messages') {
      setIsLiveTonightOpen(false);
    } else {
      setIsLiveTonightOpen(true);
    }
  }, [activeTab]);

  // Shop merchandise state & categories
  const [selectedShopItem, setSelectedShopItem] = useState<any | null>(null);
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [shopPage, setShopPage] = useState<number>(1);

  useEffect(() => {
    setShopPage(1);
  }, [shopCategory, shopSearchQuery]);

  useEffect(() => {
    if (portalRole === 'label') {
      setShopBrandFilter(userProfile?.label_company_name || 'TDF');
    }
  }, [portalRole, userProfile?.label_company_name]);

  // Centralized high-performance gallery state
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [galleryLimit, setGalleryLimit] = useState(12);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<any | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('All Photos');
  const [foldersList, setFoldersList] = useState<string[]>(['All Photos', 'Profile Pics', 'Cover Images']);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderCreator, setShowFolderCreator] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [pendingCaption, setPendingCaption] = useState<string>('');
  const [pendingFolder, setPendingFolder] = useState<string>('Profile Pics');
  const [selectedSecondaryUserProfile, setSelectedSecondaryUserProfile] = useState<any | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<{
    id?: string | null;
    allowed_workspaces?: string[];
    is_pro?: boolean;
    name: string;
    avatar: string;
    banner?: string;
    banner_url?: string;
    cover_url?: string;
    role: string;
    bio: string;
    location: string;
    genres: string[];
    followersCount: number;
    followingCount: number;
    sharesCount: number;
    isFollowed: boolean;
    favoriteSong?: string;
    top_song_title?: string;
    top_song_url?: string;
    rosterTicker?: string;
    customBadges?: string[];
    isYou?: boolean;
    hasProAccess?: boolean;
    musicCatalog?: any[];
    associatedProfiles?: { name: string; role: string; avatar: string; }[];
    email?: string;
    account_type?: string | null;
  } | null>(null);

  const [profileHistory, setProfileHistory] = useState<any[]>([]);

  const handleSelectUserProfile = useCallback((newProfileOrUpdater: any) => {
    setSelectedUserProfile((prev: any) => {
      const next = typeof newProfileOrUpdater === 'function' ? newProfileOrUpdater(prev) : newProfileOrUpdater;
      if (next) {
        if (prev && (prev.id !== next.id || prev.name !== next.name)) {
          setProfileHistory((h) => [...h, prev]);
        }
      } else {
        setProfileHistory([]);
      }
      return next;
    });
  }, []);

  const handleBackProfile = useCallback(() => {
    setProfileHistory((prevHistory) => {
      if (prevHistory.length > 0) {
        const previousProfile = prevHistory[prevHistory.length - 1];
        setSelectedUserProfile(previousProfile);
        return prevHistory.slice(0, -1);
      } else {
        setSelectedUserProfile(null);
        return [];
      }
    });
  }, []);

  const [liveProfileData, setLiveProfileData] = useState<any>(null);
  const [liveProfileStats, setLiveProfileStats] = useState<{ followers: number; following: number; shares: number } | null>(null);
  const [currentUserStats, setCurrentUserStats] = useState<{ followers: number; following: number; shares: number } | null>(null);
  const [liveProfileLoading, setLiveProfileLoading] = useState<boolean>(false);

  // Follows, real profiles, discover profiles, and follow toggle handlers
  const {
    discoverProfiles,
    setDiscoverProfiles,
    realProfiles,
    setRealProfiles,
    resolveProfileUUID,
    handleFollowProfile,
    handleToggleMutualFollow,
    handleUnfollow,
    handleGlobalSearchFollowToggle
  } = useSocialFollowsAndProfiles({
    userProfile,
    allProfiles,
    allFollows,
    setAllFollows,
    selectedUserProfile,
    setSelectedUserProfile,
    triggerNotification,
    setLiveProfileStats,
    setCurrentUserStats
  });

  useEffect(() => {
    if (!selectedUserProfile || !supabase) {
      setLiveProfileData(null);
      setLiveProfileStats(null);
      return;
    }

    let active = true;

    async function loadProfileData() {
      try {
        setLiveProfileLoading(true);
        const isValidUUID = (str: string | null | undefined): boolean => 
          typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

        let profileData = null;
        let targetId = resolveProfileUUID(selectedUserProfile, allProfiles);
        const selProfAny = selectedUserProfile as any;

        if (!targetId && selProfAny) {
          if (isValidUUID(selProfAny.raw_id)) targetId = selProfAny.raw_id;
          else if (isValidUUID(selProfAny.band_id)) targetId = selProfAny.band_id;
          else if (isValidUUID(selProfAny.id)) targetId = selProfAny.id;
          else if (isValidUUID(selProfAny.user_id)) targetId = selProfAny.user_id;
        }

        const targetName = (
          selProfAny?.band_name || 
          selProfAny?.bandName || 
          selProfAny?.name || 
          selProfAny?.full_name || 
          ''
        ).trim();

        if (!targetId && targetName) {
          try {
            const { data: bMatch } = await supabase
              .from('bands')
              .select('id')
              .or(`band_name.ilike.${targetName},name.ilike.${targetName}`)
              .limit(1);
            if (bMatch?.[0]?.id && isValidUUID(bMatch[0].id)) {
              targetId = bMatch[0].id;
            } else {
              const { data: pMatch } = await supabase
                .from('profiles')
                .select('id')
                .or(`full_name.ilike.${targetName},name.ilike.${targetName},console_handle.ilike.${targetName}`)
                .limit(1);
              if (pMatch?.[0]?.id && isValidUUID(pMatch[0].id)) {
                targetId = pMatch[0].id;
              }
            }
          } catch (e) {}
        }

        if (targetId && isValidUUID(targetId)) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetId)
            .maybeSingle();
          if (data) {
            profileData = normalizeLoadedProfile(data);
          } else {
            const { data: bData } = await supabase
              .from('bands')
              .select('*')
              .eq('id', targetId)
              .maybeSingle();
            if (bData) {
              profileData = {
                ...bData,
                id: bData.id,
                name: bData.band_name || bData.name || 'Band',
                band_name: bData.band_name || bData.name || 'Band',
                role: 'Band',
                category: 'bands',
                isBandProfile: true
              };
            }
          }
        }

        let followerCount = 0;
        let followingCount = 0;

        if (targetId && isValidUUID(targetId)) {
          // Fetch exact follower / following counts from Supabase follows table
          const { count: folCount, error: folErr } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('followed_id', targetId);

          if (!folErr) {
            followerCount = folCount || 0;
            const { count: followingCnt } = await supabase
              .from('follows')
              .select('*', { count: 'exact', head: true })
              .eq('follower_id', targetId);
            followingCount = followingCnt || 0;
          }
        }

        let isFollowedByMe = false;
        if (targetId && isValidUUID(targetId)) {
          let myId = resolveProfileUUID(userProfile, allProfiles) || userProfile?.id;
          if (!myId && supabase) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.id) myId = sessionData.session.user.id;
          }

          if (myId && isValidUUID(myId)) {
            const { data: followRecord } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', myId)
              .eq('followed_id', targetId)
              .maybeSingle();
            if (followRecord) isFollowedByMe = true;
          }
        }

        if (active) {
          if (profileData) {
            setLiveProfileData(profileData);
          } else {
            setLiveProfileData(selectedUserProfile);
          }
          setLiveProfileStats({
            followers: followerCount,
            following: followingCount,
            shares: profileData?.reputation || profileData?.sharesCount || selectedUserProfile?.sharesCount || 0
          });
          setSelectedUserProfile(prev => {
            if (!prev) return null;
            return {
              ...prev,
              isFollowed: isFollowedByMe,
              followersCount: followerCount,
              followingCount: followingCount,
              followers: followerCount,
              following: followingCount
            };
          });
        }
      } catch (err) {
        console.error('Failed to load live profile data:', err);
      } finally {
        if (active) {
          setLiveProfileLoading(false);
        }
      }
    }

    loadProfileData();

    return () => {
      active = false;
    };
  }, [selectedUserProfile?.id, selectedUserProfile?.email, selectedUserProfile?.name, allProfiles, allFollows]);

  useEffect(() => {
    let active = true;
    async function loadCurrentUserStats() {
      try {
        const currentUserId = resolveProfileUUID(userProfile, allProfiles);
        const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
        
        if (currentUserId && isValidUUID(currentUserId)) {
          const { count: followers } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('followed_id', currentUserId);
            
          const { count: following } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', currentUserId);
            
          if (active) {
            setCurrentUserStats({
              followers: followers || 0,
              following: following || 0,
              shares: userProfile?.sharesCount || 0
            });
          }
        }
      } catch (err) {
        console.error('Failed to load current user stats', err);
      }
    }
    
    if (supabase) {
      loadCurrentUserStats();
    }
    return () => { active = false; };
  }, [supabase, userProfile?.id, userProfile?.email, allProfiles, allFollows]);

  const targetProfile = useMemo(() => {
    if (!selectedUserProfile) return null;
    const baseProf = allProfiles.find((p: any) => 
      p.id === selectedUserProfile.id ||
      (p.email && selectedUserProfile.email && p.email.toLowerCase() === selectedUserProfile.email.toLowerCase()) ||
      (p?.name && selectedUserProfile?.name && p.name.toLowerCase() === selectedUserProfile.name.toLowerCase())
    ) || selectedUserProfile;

    const formatLocation = (profSource: any) => {
      if (!profSource) return '';
      return formatLocationDisplay(profSource);
    };

    if (liveProfileData && (liveProfileData.id === baseProf.id || liveProfileData.email === baseProf.email || liveProfileData.name === baseProf.name)) {
      const resolvedBanner = liveProfileData.banner_url || liveProfileData.creative_banner || liveProfileData.promoter_cover_image || liveProfileData.label_banner || baseProf.banner_url || baseProf.banner;
      const resolvedCover = liveProfileData.cover_url || liveProfileData.banner_url || liveProfileData.creative_banner || liveProfileData.promoter_cover_image || liveProfileData.label_banner || baseProf.cover_url || baseProf.banner;
      
      const resolvedGenres = (() => {
        if (liveProfileData.genre_tags && Array.isArray(liveProfileData.genre_tags) && liveProfileData.genre_tags.length > 0) return liveProfileData.genre_tags;
        if (Array.isArray(liveProfileData.genres) && liveProfileData.genres.length > 0) return liveProfileData.genres;
        if (typeof liveProfileData.genre_tags === 'string') {
          try {
            const parsed = JSON.parse(liveProfileData.genre_tags);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          } catch (e) {
            return liveProfileData.genre_tags.split(',').map((g: string) => g.trim()).filter(Boolean);
          }
        }
        if (typeof liveProfileData.genres === 'string') {
          try {
            const parsed = JSON.parse(liveProfileData.genres);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          } catch (e) {
            return liveProfileData.genres.split(',').map((g: string) => g.trim()).filter(Boolean);
          }
        }
        return (baseProf.genres && baseProf.genres.length > 0 ? baseProf.genres : baseProf.genre_tags && baseProf.genre_tags.length > 0 ? baseProf.genre_tags : selectedUserProfile?.genres && selectedUserProfile.genres.length > 0 ? selectedUserProfile.genres : (selectedUserProfile as any)?.genre_tags || []);
      })();

      const finalLoc = formatLocation(liveProfileData) || formatLocation(baseProf) || 'USA / Global';

      return {
        ...baseProf,
        ...liveProfileData,
        isYou: selectedUserProfile?.isYou,
        isFollowed: selectedUserProfile?.isFollowed,
        name: liveProfileData.name || baseProf.name,
        avatar: liveProfileData.avatar || liveProfileData.creative_avatar || liveProfileData.promoter_logo || liveProfileData.label_logo || baseProf.avatar,
        role: liveProfileData.role || baseProf.role,
        bio: liveProfileData.bio !== undefined ? liveProfileData.bio : baseProf.bio,
        top_song_title: liveProfileData.top_song_title !== undefined ? liveProfileData.top_song_title : (baseProf.top_song_title || baseProf.favoriteSong),
        top_song_url: liveProfileData.top_song_url !== undefined ? liveProfileData.top_song_url : baseProf.top_song_url,
        location: finalLoc,
        legalName: liveProfileData.legal_name || liveProfileData.full_name || liveProfileData.name || baseProf.legalName,
        handle: liveProfileData.console_handle || liveProfileData.handle || baseProf.handle,
        banner_url: resolvedBanner,
        cover_url: resolvedCover,
        followersCount: liveProfileStats?.followers !== undefined ? liveProfileStats.followers : baseProf.followersCount,
        followingCount: liveProfileStats?.following !== undefined ? liveProfileStats.following : baseProf.followingCount,
        sharesCount: liveProfileStats?.shares !== undefined ? liveProfileStats.shares : baseProf.sharesCount,
        genres: resolvedGenres,
        genre_tags: resolvedGenres,
        allowed_workspaces: liveProfileData.allowed_workspaces || baseProf.allowed_workspaces || [],
        is_pro: liveProfileData.is_pro === true || baseProf.is_pro === true || liveProfileData.account_type === 'industry_pro' || baseProf.account_type === 'industry_pro',
        customBadges: liveProfileData.customBadges || baseProf.customBadges || selectedUserProfile?.customBadges || [],
        account_type: liveProfileData.account_type || baseProf.account_type || baseProf.role || null
      };
    }

    const baseLoc = formatLocation(baseProf) || 'USA / Global';
    const fallbackGenres = (baseProf.genres && baseProf.genres.length > 0 ? baseProf.genres : baseProf.genre_tags && baseProf.genre_tags.length > 0 ? baseProf.genre_tags : selectedUserProfile?.genres && selectedUserProfile.genres.length > 0 ? selectedUserProfile.genres : (selectedUserProfile as any)?.genre_tags || []);
    return {
      ...baseProf,
      genres: fallbackGenres,
      genre_tags: fallbackGenres,
      isYou: selectedUserProfile?.isYou,
      isFollowed: selectedUserProfile?.isFollowed,
      location: baseLoc,
      account_type: baseProf.account_type || baseProf.role || null,
      customBadges: baseProf.customBadges || selectedUserProfile?.customBadges || [],
      bio: baseProf.bio || baseProf.profileBlurb || '',
      top_song_title: baseProf.top_song_title || baseProf.favoriteSong || '',
      top_song_url: baseProf.top_song_url || ''
    };
  }, [selectedUserProfile, allProfiles, liveProfileData, liveProfileStats]);

  const containerRef = useRef<HTMLDivElement>(null);

  const [profileActiveTab, setProfileActiveTab] = useState<string>('timeline');

  // Auto-redirect profile active tab if invalid for current profile role
  useEffect(() => {
    if (selectedUserProfile) {
      const r = (selectedUserProfile?.role || '').toLowerCase();
      const isArtist = r.includes('artist') || r.includes('band');
      const isLabel = r.includes('label');
      const isPromoter = r.includes('promoter');
      const isCreative = r.includes('creative');

      let allowedTabs = ['timeline', 'gallery', 'collection', 'resale_closet'];
      if (isArtist || isLabel) {
        allowedTabs = ['timeline', 'music', 'gallery', 'shop'];
      } else if (isPromoter) {
        allowedTabs = ['timeline', 'gallery', 'tickets'];
      } else if (isCreative) {
        allowedTabs = ['timeline', 'portfolio', 'gallery'];
      }

      if (!allowedTabs.includes(profileActiveTab)) {
        setProfileActiveTab('timeline');
      }
    }
  }, [selectedUserProfile, profileActiveTab]);
  const [viewingFollowersOrFollowing, setViewingFollowersOrFollowing] = useState<'followers' | 'following' | null>(null);
  const [liveFollowsList, setLiveFollowsList] = useState<any[]>([]);
  const [liveFollowsLoading, setLiveFollowsLoading] = useState(false);

  useEffect(() => {
    if (!viewingFollowersOrFollowing || !supabase) {
      setLiveFollowsList([]);
      return;
    }
    let active = true;
    async function fetchFollows() {
      setLiveFollowsLoading(true);
      try {
        const isValidUUID = (str: string | null | undefined): boolean => 
          typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

        const activeTarget = selectedUserProfile || targetProfile;
        if (!activeTarget) {
          setLiveFollowsList([]);
          return;
        }

        const isBandTarget = Boolean(
          activeTarget?.isBandProfile ||
          activeTarget?.type === 'band' ||
          activeTarget?.role === 'band' ||
          activeTarget?.role === 'Band' ||
          activeTarget?.portalRole === 'band' ||
          activeTarget?.account_type === 'band' ||
          (portalRole === 'band' && (activeTarget?.isYou || activeTarget?.id === userProfile?.id || activeTarget?.band_name)) ||
          activeTarget?.band_name ||
          activeTarget?.bandName ||
          activeTarget?.band_id
        );

        let activeId: string | null = null;

        if (isBandTarget) {
          // 1. Resolve Band-specific UUID
          const candidateBandId = activeTarget.band_id || (activeTarget.isBandProfile ? (activeTarget.raw_id || activeTarget.id) : null);
          if (candidateBandId && isValidUUID(candidateBandId)) {
            activeId = candidateBandId;
          }

          const bandSearchName = (activeTarget.band_name || activeTarget.bandName || activeTarget.name || '').trim();
          if ((!activeId || !isValidUUID(activeId)) && bandSearchName) {
            try {
              const { data: bMatch } = await supabase
                .from('bands')
                .select('id')
                .or(`band_name.ilike.${bandSearchName},name.ilike.${bandSearchName}`)
                .limit(1);
              if (bMatch?.[0]?.id && isValidUUID(bMatch[0].id)) {
                activeId = bMatch[0].id;
              }
            } catch (e) {}
          }

          if ((!activeId || !isValidUUID(activeId)) && (activeTarget.isYou || activeTarget.id === userProfile?.id) && userProfile?.band_id && isValidUUID(userProfile.band_id)) {
            activeId = userProfile.band_id;
          }
        } else {
          // Personal / Creative / Label / Promoter resolution
          if (activeTarget.creative_id && isValidUUID(activeTarget.creative_id)) activeId = activeTarget.creative_id;
          else if (activeTarget.registered_creative_id && isValidUUID(activeTarget.registered_creative_id)) activeId = activeTarget.registered_creative_id;
          else if (activeTarget.raw_id && isValidUUID(activeTarget.raw_id)) activeId = activeTarget.raw_id;
          else if (activeTarget.id && isValidUUID(activeTarget.id)) activeId = activeTarget.id;
          else if (activeTarget.creator_id && isValidUUID(activeTarget.creator_id)) activeId = activeTarget.creator_id;
          else if (activeTarget.user_id && isValidUUID(activeTarget.user_id)) activeId = activeTarget.user_id;

          if (!activeId) {
            activeId = resolveProfileUUID(activeTarget, allProfiles);
          }
        }

        const targetName = (
          activeTarget.business_name ||
          activeTarget.creative_name ||
          activeTarget.band_name || 
          activeTarget.bandName || 
          activeTarget.name || 
          activeTarget.full_name || 
          ''
        ).trim();

        // If activeId is not yet resolved, query creatives, bands, and profiles in Supabase
        if (!activeId && targetName) {
          try {
            if (isBandTarget) {
              const { data: bMatch } = await supabase
                .from('bands')
                .select('id')
                .or(`band_name.ilike.${targetName},name.ilike.${targetName}`)
                .limit(1);
              if (bMatch?.[0]?.id && isValidUUID(bMatch[0].id)) {
                activeId = bMatch[0].id;
              }
            } else {
              const { data: cMatch } = await supabase
                .from('creatives')
                .select('id, creator_id, user_id')
                .or(`business_name.ilike.%${targetName}%,creative_name.ilike.%${targetName}%,name.ilike.%${targetName}%`)
                .limit(1);
              if (cMatch?.[0]?.id && isValidUUID(cMatch[0].id)) {
                activeId = cMatch[0].id;
              } else {
                const { data: pMatch } = await supabase
                  .from('profiles')
                  .select('id')
                  .or(`full_name.ilike.${targetName},name.ilike.${targetName},console_handle.ilike.${targetName}`)
                  .limit(1);
                if (pMatch?.[0]?.id && isValidUUID(pMatch[0].id)) {
                  activeId = pMatch[0].id;
                }
              }
            }
          } catch (e) {}
        }

        if (!activeId || !isValidUUID(activeId)) {
          if (active) {
            setLiveFollowsList([]);
            setLiveProfileStats(prev => prev ? { ...prev, [viewingFollowersOrFollowing]: 0 } : prev);
          }
          return;
        }

        if (viewingFollowersOrFollowing === 'followers') {
          // Read local storage saved follows
          let localFollows: Record<string, boolean> = {};
          try {
            localFollows = JSON.parse(localStorage.getItem('nexus_local_follows_v1') || '{}');
          } catch (e) {}

          const isLocallyFollowed = (activeId && localFollows[activeId]) === true;

          // Query official records in Supabase 'follows' table where followed_id = activeId or artist_id = activeId
          let followsData: any[] = [];
          if (activeId && isValidUUID(activeId)) {
            try {
              const { data, error: fErr } = await supabase
                .from('follows')
                .select('*')
                .or(`followed_id.eq.${activeId},artist_id.eq.${activeId}`);
              if (!fErr && data && data.length > 0) {
                followsData = data;
              } else {
                const { data: d2 } = await supabase
                  .from('follows')
                  .select('*')
                  .eq('followed_id', activeId);
                if (d2) followsData = d2;
              }
            } catch (e) {}
          }

          const combinedMap = new Map<string, any>();
          const followerIds = (followsData || []).map((f: any) => f.follower_id || f.fan_profile_id).filter(isValidUUID);

          if (followerIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', followerIds);

            const { data: bandsData } = await supabase
              .from('bands')
              .select('*')
              .in('id', followerIds);

            const { data: creativesData } = await supabase
              .from('creatives')
              .select('*')
              .in('id', followerIds);

            const foundIds = new Set<string>();

            (profilesData || []).forEach(p => {
              const norm = normalizeLoadedProfile(p);
              const pName = p.full_name || p.display_name || p.name || p.console_handle || 'User';
              combinedMap.set(String(p.id), {
                ...norm,
                id: p.id,
                name: pName,
                full_name: pName,
                display_name: pName,
                console_handle: p.console_handle || `@${pName.toLowerCase().replace(/\s+/g, '')}`,
                avatar_url: p.avatar_url || p.avatar,
                role: p.role || p.account_type || 'Member',
                category: 'people',
                isYou: (userProfile?.id && p.id === userProfile.id) || (userProfile?.email && p.email?.toLowerCase() === userProfile.email.toLowerCase())
              });
              foundIds.add(String(p.id));
            });

            (bandsData || []).forEach(b => {
              const bName = b.band_name || b.name || 'Band';
              combinedMap.set(String(b.id), {
                id: b.id,
                name: bName,
                band_name: bName,
                display_name: bName,
                role: 'Band',
                category: 'band',
                avatar_url: b.logo_url || b.cover_url || '',
                banner_url: b.cover_url || '',
                console_handle: b.console_handle || `@${bName.toLowerCase().replace(/\s+/g, '')}`,
                isBandProfile: true
              });
              foundIds.add(String(b.id));
            });

            (creativesData || []).forEach(c => {
              const cName = c.business_name || c.creative_name || c.name || 'Creative Pro';
              combinedMap.set(String(c.id), {
                id: c.id,
                name: cName,
                business_name: cName,
                display_name: cName,
                role: c.specialty || 'Creative Pro',
                category: 'creative',
                avatar_url: c.creative_avatar || c.avatar_url || '',
                banner_url: c.creative_banner || c.banner_url || '',
                console_handle: c.creative_handle || c.handle || `@${cName.toLowerCase().replace(/\s+/g, '')}`,
                isCreativeProfile: true
              });
              foundIds.add(String(c.id));
            });

            followerIds.forEach(id => {
              if (!foundIds.has(String(id))) {
                const inMem = allProfiles.find(p => p.id === id);
                if (inMem) {
                  const norm = normalizeLoadedProfile(inMem);
                  const pName = inMem.full_name || inMem.display_name || inMem.name || inMem.console_handle || 'User';
                  combinedMap.set(String(id), {
                    ...norm,
                    id,
                    name: pName,
                    full_name: pName,
                    display_name: pName,
                    category: inMem.category || 'people'
                  });
                }
              }
            });
          }

          // If current logged-in user explicitly follows this specific band/entity, ensure current user is in the followers list
          if (isLocallyFollowed && userProfile) {
            const currentUserId = userProfile.id || userProfile.user_id || 'you-current-user';
            const currentUserName = userProfile.full_name || userProfile.display_name || userProfile.name || 'You';
            combinedMap.set(String(currentUserId), {
              ...normalizeLoadedProfile(userProfile),
              id: currentUserId,
              name: currentUserName,
              full_name: currentUserName,
              display_name: currentUserName,
              console_handle: userProfile.console_handle || '@you',
              avatar_url: userProfile.avatar_url || userProfile.avatar,
              role: userProfile.role || userProfile.account_type || 'Creative Pro',
              category: 'people',
              isYou: true
            });
          }

          const resultList = Array.from(combinedMap.values());
          if (active) {
            setLiveFollowsList(resultList);
            setLiveProfileStats(prev => prev ? { ...prev, followers: resultList.length } : prev);
          }
        } else {
          // Viewing FOLLOWING (accounts that activeId follows)
          let followsData: any[] = [];
          if (activeId && isValidUUID(activeId)) {
            try {
              const { data, error: fErr } = await supabase
                .from('follows')
                .select('*')
                .or(`follower_id.eq.${activeId},fan_profile_id.eq.${activeId}`);
              if (!fErr && data && data.length > 0) {
                followsData = data;
              } else {
                const { data: d2 } = await supabase
                  .from('follows')
                  .select('*')
                  .eq('follower_id', activeId);
                if (d2) followsData = d2;
              }
            } catch (e) {}
          }

          const combinedMap = new Map<string, any>();
          const followedIds = (followsData || []).map((f: any) => f.followed_id || f.artist_id).filter(isValidUUID);

          if (followedIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', followedIds);

            const { data: bandsData } = await supabase
              .from('bands')
              .select('*')
              .in('id', followedIds);

            const { data: creativesData } = await supabase
              .from('creatives')
              .select('*')
              .in('id', followedIds);

            const foundIds = new Set<string>();

            (profilesData || []).forEach(p => {
              const norm = normalizeLoadedProfile(p);
              const pName = p.full_name || p.display_name || p.name || p.console_handle || 'User';
              combinedMap.set(String(p.id), {
                ...norm,
                id: p.id,
                name: pName,
                full_name: pName,
                display_name: pName,
                console_handle: p.console_handle || `@${pName.toLowerCase().replace(/\s+/g, '')}`,
                avatar_url: p.avatar_url || p.avatar,
                role: p.role || p.account_type || 'Member',
                category: 'people',
                isYou: (userProfile?.id && p.id === userProfile.id) || (userProfile?.email && p.email?.toLowerCase() === userProfile.email.toLowerCase())
              });
              foundIds.add(String(p.id));
            });

            (bandsData || []).forEach(b => {
              const bName = b.band_name || b.name || 'Band';
              combinedMap.set(String(b.id), {
                id: b.id,
                name: bName,
                band_name: bName,
                display_name: bName,
                role: 'Band',
                category: 'band',
                avatar_url: b.logo_url || b.cover_url || '',
                banner_url: b.cover_url || '',
                console_handle: b.console_handle || `@${bName.toLowerCase().replace(/\s+/g, '')}`,
                isBandProfile: true
              });
              foundIds.add(String(b.id));
            });

            (creativesData || []).forEach(c => {
              const cName = c.business_name || c.creative_name || c.name || 'Creative Pro';
              combinedMap.set(String(c.id), {
                id: c.id,
                name: cName,
                business_name: cName,
                display_name: cName,
                role: c.specialty || 'Creative Pro',
                category: 'creative',
                avatar_url: c.creative_avatar || c.avatar_url || '',
                banner_url: c.creative_banner || c.banner_url || '',
                console_handle: c.creative_handle || c.handle || `@${cName.toLowerCase().replace(/\s+/g, '')}`,
                isCreativeProfile: true
              });
              foundIds.add(String(c.id));
            });

            followedIds.forEach(id => {
              if (!foundIds.has(String(id))) {
                const inMem = allProfiles.find(p => p.id === id);
                if (inMem) {
                  const norm = normalizeLoadedProfile(inMem);
                  const pName = inMem.full_name || inMem.display_name || inMem.name || inMem.console_handle || 'User';
                  combinedMap.set(String(id), {
                    ...norm,
                    id,
                    name: pName,
                    full_name: pName,
                    display_name: pName,
                    category: inMem.category || 'people'
                  });
                }
              }
            });
          }

          let resultList = Array.from(combinedMap.values());
          if (active) {
            setLiveFollowsList(resultList);
            setLiveProfileStats(prev => prev ? { ...prev, following: resultList.length } : prev);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch follows', err);
      } finally {
        if (active) setLiveFollowsLoading(false);
      }
    }
    fetchFollows();
    return () => { active = false; };
  }, [viewingFollowersOrFollowing, selectedUserProfile?.id, selectedUserProfile?.email, (selectedUserProfile as any)?.console_handle, targetProfile?.id, userProfile?.id, userProfile?.email, allProfiles]);

  // EPK States
  const [epkSubmissions, setEpkSubmissions] = useState<any[]>(() => {
    const cached = localStorage.getItem('nexus_epk_submissions');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: "epk_1",
        targetLabel: "Aura Records",
        bandName: "SEWER GASKET",
        bio: "Sludge / Grindcore from Detroit. Heavy feedback-drenched speed slop.",
        history: "Formed in 2024, released two demo tapes on recycled cassettes.",
        members: "John Gasket (Vocals), Pete Sludge (Guitars), Dan Blast (Drums)",
        profileLink: "https://demos.soundstream.com/sewer-gasket",
        tracks: [
          { name: "demo_track_1.mp3", size: "4.2 MB" }
        ],
        timestamp: "June 29, 2026, 10:15 AM",
        status: "pending"
      },
      {
        id: "epk_2",
        targetLabel: "Shadowland Records",
        bandName: "ABYSSAL MAW",
        bio: "Cavernous Black/Doom metal with atmospheric drone elements.",
        history: "Formed in the damp woods of Oregon in 2023. One self-titled EP released.",
        members: "Void (All Instruments)",
        profileLink: "https://demos.soundstream.com/abyssal-maw",
        tracks: [
          { name: "abyssal_echoes.wav", size: "32.5 MB" }
        ],
        timestamp: "June 28, 2026, 4:20 PM",
        status: "pending"
      }
    ];
  });

  const [showViewEpksModal, setShowViewEpksModal] = useState(false);
  const [showSubmitEpkModal, setShowSubmitEpkModal] = useState(false);
  const [expandedEpkId, setExpandedEpkId] = useState<string | null>(null);
  const [epkFilterTab, setEpkFilterTab] = useState<'my_label' | 'all'>('my_label');

  // EPK Submit Form states
  const [epkFormBandName, setEpkFormBandName] = useState('');
  const [epkFormBio, setEpkFormBio] = useState('');
  const [epkFormHistory, setEpkFormHistory] = useState('');
  const [epkFormMembers, setEpkFormMembers] = useState('');
  const [epkFormProfileLink, setEpkFormProfileLink] = useState('');
  const [epkFormTracks, setEpkFormTracks] = useState<{ name: string; size: string }[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [epkSubmissionSuccess, setEpkSubmissionSuccess] = useState(false);

  // Sync EPKs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexus_epk_submissions', JSON.stringify(epkSubmissions));
    } catch (e) {
      console.warn('Failed to save EPKs to localStorage, quota exceeded.', e);
    }
  }, [epkSubmissions]);

  // Reset form when selected user profile changes
  useEffect(() => {
    if (selectedUserProfile) {
      setProfileActiveTab('timeline');
      setEpkFormBandName('');
      setEpkFormBio('');
      setEpkFormHistory('');
      setEpkFormMembers('');
      setEpkFormProfileLink('');
      setEpkFormTracks([]);
      setEpkSubmissionSuccess(false);
    }
  }, [selectedUserProfile]);

  const playAmbientMetalDrone = (songName: string) => {
    if (rotationIsPlaying === songName) {
      setRotationIsPlaying(null);
      return;
    }
    setRotationIsPlaying(songName);
    triggerNotification?.(`🔊 Tuning frequency: "${songName}" stream`);
    playAmbientMetalDroneEngine(songName);

    setTimeout(() => {
      setRotationIsPlaying(prev => prev === songName ? null : prev);
    }, 2200);
  };

  const [userEndorsements, setUserEndorsements] = useState<Record<string, Record<string, number>>>({
    'cryptopsy': { 'Heaviness': 300, 'Atmosphere': 95, 'Energy': 290, 'Rawness': 250 },
    'devourment': { 'Heaviness': 295, 'Atmosphere': 120, 'Energy': 275, 'Rawness': 240 },
    'dying fetus': { 'Heaviness': 298, 'Atmosphere': 110, 'Energy': 280, 'Rawness': 210 }
  });

const getProfileForUser = (userParam: any) => {
  if (!userParam) return null;

  // Extract candidate target IDs and keys from userParam (supporting userId, bandId, profileId, user_id, band_id, profile_id, authorId, id)
  const targetId = typeof userParam === 'object' 
    ? (userParam.userId || userParam.id || userParam.user_id || userParam.authorId || userParam.profile_id || userParam.profileId) 
    : (typeof userParam === 'string' && (userParam.includes('-') || userParam.length > 20) ? userParam : null);
  
  const targetBandId = typeof userParam === 'object'
    ? (userParam.bandId || userParam.band_id || (userParam.isBandProfile || userParam.type === 'band' ? (userParam.id || userParam.raw_id) : null))
    : null;

  let rawName = typeof userParam === 'string' 
    ? (userParam.includes('-') && userParam.length > 20 ? '' : userParam) 
    : (userParam.name || userParam.authorName || userParam.display_name || userParam.full_name || userParam.band_name || userParam.bandName || '');
  let cleanHandle = '';
  let cleanRealName = '';
  let cleanDisplayName = rawName;

  const matchParen = rawName.match(/^(.+?)\s*\((.+?)\)$/);
  if (matchParen) {
    cleanHandle = matchParen[1].trim();
    cleanRealName = matchParen[2].trim();
    cleanDisplayName = cleanHandle;
  } else {
    cleanHandle = typeof userParam === 'object' && (userParam.console_handle || userParam.handle || userParam.creative_handle || userParam.username)
      ? (userParam.console_handle || userParam.handle || userParam.creative_handle || userParam.username)
      : (rawName.startsWith('@') ? rawName.slice(1) : rawName);
    cleanRealName = typeof userParam === 'object' && (userParam.realName || userParam.full_name || userParam.legalName)
      ? (userParam.realName || userParam.full_name || userParam.legalName)
      : rawName;
  }

  cleanHandle = (cleanHandle || 'user').replace('@', '').replace(/[\(\)].*/, '').trim();

  const myId = userProfile?.id;
  const myEmail = userProfile?.email?.toLowerCase()?.trim();
  const targetEmail = typeof userParam === 'object' ? (userParam.email?.toLowerCase()?.trim() || userParam.authorEmail?.toLowerCase()?.trim() || userParam.author_email?.toLowerCase()?.trim()) : null;

  const targetNameLower = cleanDisplayName.toLowerCase().trim();
  const rawNameLower = rawName.toLowerCase().trim();
  const cleanRealLower = cleanRealName.toLowerCase().trim();
  const cleanHandleLower = cleanHandle.toLowerCase().trim();

  const dbProfile = (allProfiles || []).find((p: any) => 
    (targetId && p.id && String(p.id) === String(targetId)) ||
    (targetEmail && p.email && p.email.toLowerCase().trim() === targetEmail) ||
    (!targetId && targetNameLower && p?.name && p.name.toLowerCase().trim() === targetNameLower) || 
    (!targetId && targetNameLower && p?.full_name && p.full_name.toLowerCase().trim() === targetNameLower) || 
    (!targetId && targetNameLower && p?.console_handle && p.console_handle.toLowerCase().trim() === targetNameLower) || 
    (!targetId && cleanHandleLower && cleanHandleLower !== 'user' && p?.console_handle && p.console_handle.toLowerCase().trim() === cleanHandleLower) || 
    (!targetId && targetNameLower && p?.label_company_name && p.label_company_name.toLowerCase().trim() === targetNameLower) || 
    (!targetId && targetNameLower && p?.promoter_name && p.promoter_name.toLowerCase().trim() === targetNameLower) || 
    (!targetId && targetNameLower && p?.creative_name && p.creative_name.toLowerCase().trim() === targetNameLower)
  );

  const myNameLower = (userProfile?.name || '').toLowerCase().trim();
  const myFullNameLower = (userProfile?.full_name || profileFullLegalName || '').toLowerCase().trim();
  const myHandleLower = (userProfile?.console_handle || userProfile?.handle || profileHandle || '').replace('@', '').toLowerCase().trim();
  const myBandNameLower = (activeBand?.name || userProfile?.bandName || '').toLowerCase().trim();

  // Strict isCurrentUser resolution to prevent state overwrite when viewing friend profiles
  const isExplicitNotYou = typeof userParam === 'object' && userParam.isYou === false;
  const hasIdMismatch = Boolean(targetId && myId && String(targetId) !== String(myId));
  const hasEmailMismatch = Boolean(targetEmail && myEmail && targetEmail !== myEmail);

  const isCurrentUser = !isExplicitNotYou && !hasIdMismatch && !hasEmailMismatch && !!(
    (typeof userParam === 'object' && userParam.isYou === true) ||
    (targetId && myId && String(targetId) === String(myId)) ||
    (targetEmail && myEmail && targetEmail === myEmail) ||
    (!targetId && !targetEmail && myHandleLower && myHandleLower !== 'user' && (cleanHandleLower === myHandleLower || targetNameLower === myHandleLower)) ||
    (!targetId && !targetEmail && myFullNameLower && myFullNameLower !== 'user' && myFullNameLower !== 'new user' && (cleanRealLower === myFullNameLower || targetNameLower === myFullNameLower)) ||
    (!targetId && !targetEmail && myNameLower && myNameLower !== 'user' && myNameLower !== 'new user' && targetNameLower === myNameLower)
  );

  if (isCurrentUser) {
    const isExplicitBand = (typeof userParam === 'object' && (userParam.isBandProfile || userParam.type === 'band' || userParam.role === 'Artist' || userParam.role === 'Band' || userParam.account_type === 'band')) ||
      (cleanHandleLower === (activeBand?.name || '').toLowerCase().replace(/\s+/g, '') && cleanHandleLower !== '') ||
      (targetNameLower === (activeBand?.name || '').toLowerCase() && targetNameLower !== '');

    const isExplicitIndustryPro = (typeof userParam === 'object' && (userParam.role === 'Industry Pro' || userParam.account_type === 'industry_pro')) ||
      cleanHandleLower === 'bdmceo' || targetNameLower === 'bdmceo';

    const isExplicitCreative = typeof userParam === 'object' && (userParam.role === 'Creative' || userParam.account_type === 'creative');
    const isExplicitLabel = typeof userParam === 'object' && (userParam.role === 'Label' || userParam.account_type === 'label');
    const isExplicitPromoter = typeof userParam === 'object' && (userParam.role === 'Promoter' || userParam.account_type === 'promoter');

    const activeRole = isExplicitBand ? 'band'
      : isExplicitIndustryPro ? 'industry_pro'
      : isExplicitCreative ? 'creative'
      : isExplicitLabel ? 'label'
      : isExplicitPromoter ? 'promoter'
      : (portalRole || userProfile?.active_workspace || userProfile?.account_type || 'fan_only');

    if (activeRole === 'band' || isExplicitBand) {
      return {
        id: activeBand?.id || userProfile?.id || null,
        name: activeBand?.name || userProfile?.bandName || 'Artist',
        band_name: activeBand?.name || userProfile?.bandName || 'Artist',
        avatar: activeBand?.logo_url || userProfile?.avatar_url || null,
        avatar_url: activeBand?.logo_url || userProfile?.avatar_url || null,
        logo_url: activeBand?.logo_url || null,
        banner: activeBand?.cover_url || userProfile?.banner_url || null,
        banner_url: activeBand?.cover_url || userProfile?.banner_url || null,
        cover_url: activeBand?.cover_url || null,
        location: activeBand?.location || activeBand?.homebase || userProfile?.location || 'USA / Global',
        role: 'Artist',
        account_type: 'band',
        type: 'band',
        isBandProfile: true,
        isPersonal: false,
        isYou: true,
        badges: activeBand?.badges || ['🎸 Artist'],
        customBadges: activeBand?.badges || ['🎸 Artist'],
        bio: activeBand?.bio || userProfile?.bio || `${activeBand?.name || 'Artist'} profile on Nexus.`,
        genres: activeBand?.genres || (activeBand?.genre ? [activeBand?.genre] : ['Metal']),
        genre: activeBand?.genre || 'Metal',
        lineup: activeBand?.lineup || activeBand?.members || [],
        followersCount: currentUserStats?.followers ?? 0,
        followingCount: currentUserStats?.following ?? 0,
        hasProAccess: true,
        musicCatalog: activeBand?.catalog || []
      };
    }

    if (activeRole === 'creative' || userProfile?.account_type === 'creative') {
      const cBizName = userProfile?.creative_business_name || userProfile?.creative_name || profileFullLegalName || userProfile?.name || 'Pro Creative';
      const cHandle = profileHandle || userProfile?.creative_handle || 'creative_pro';
      return {
        id: userProfile?.id || null,
        name: cBizName,
        business_name: cBizName,
        businessName: cBizName,
        creative_name: cBizName,
        creative_handle: cHandle,
        legalName: profileFullLegalName || userProfile?.full_name || userProfile?.name,
        avatar: userProfile?.creative_avatar || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=150',
        avatar_url: userProfile?.creative_avatar || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=150',
        banner: userProfile?.creative_banner || userProfile?.banner_url || null,
        banner_url: userProfile?.creative_banner || userProfile?.banner_url || null,
        cover_url: userProfile?.creative_banner || userProfile?.banner_url || null,
        location: userProfile?.location || 'USA / Global',
        role: 'Creative',
        account_type: 'creative',
        type: 'creative',
        isPersonal: true,
        isBandProfile: false,
        isYou: true,
        badges: ['🛠️ Creative Pro', '🎨 Designer'],
        customBadges: ['🛠️ Creative Pro', '🎨 Designer'],
        bio: userProfile?.bio || profileBlurb || 'Professional creative specialist on the Nexus network.',
        handle: cHandle,
        console_handle: cHandle,
        followersCount: currentUserStats?.followers ?? 0,
        followingCount: currentUserStats?.following ?? 0,
        hasProAccess: true,
        creative_metadata: userProfile?.creative_metadata
      };
    }

    if (activeRole === 'label' || userProfile?.account_type === 'label') {
      const labelName = userProfile?.label_company_name || profileFullLegalName || userProfile?.name || 'Record Label';
      const labelHandle = profileHandle || userProfile?.label_url_slug || 'record_label';
      return {
        id: userProfile?.id || null,
        name: labelName,
        label_company_name: labelName,
        legalName: profileFullLegalName || userProfile?.full_name || userProfile?.name,
        avatar: userProfile?.label_logo || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150',
        avatar_url: userProfile?.label_logo || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150',
        banner: userProfile?.label_banner || userProfile?.banner_url || null,
        banner_url: userProfile?.label_banner || userProfile?.banner_url || null,
        cover_url: userProfile?.label_banner || userProfile?.banner_url || null,
        location: userProfile?.location || 'USA / Global',
        role: 'Label',
        account_type: 'label',
        type: 'label',
        isPersonal: true,
        isBandProfile: false,
        isYou: true,
        badges: ['💿 Record Label'],
        customBadges: ['💿 Record Label'],
        bio: userProfile?.bio || profileBlurb || 'Official record label account on Nexus.',
        handle: labelHandle,
        console_handle: labelHandle,
        followersCount: currentUserStats?.followers ?? 0,
        followingCount: currentUserStats?.following ?? 0,
        hasProAccess: true
      };
    }

    if (activeRole === 'promoter' || userProfile?.account_type === 'promoter') {
      const promoterName = userProfile?.promoter_metadata?.brand_name || profileFullLegalName || userProfile?.name || 'Promoter';
      const promoterHandle = profileHandle || 'promoter_pro';
      return {
        id: userProfile?.id || null,
        name: promoterName,
        legalName: profileFullLegalName || userProfile?.full_name || userProfile?.name,
        avatar: userProfile?.promoter_metadata?.logo || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150',
        avatar_url: userProfile?.promoter_metadata?.logo || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150',
        banner: userProfile?.promoter_cover_image || userProfile?.banner_url || null,
        banner_url: userProfile?.promoter_cover_image || userProfile?.banner_url || null,
        cover_url: userProfile?.promoter_cover_image || userProfile?.banner_url || null,
        location: userProfile?.location || 'USA / Global',
        role: 'Promoter',
        account_type: 'promoter',
        type: 'promoter',
        isPersonal: true,
        isBandProfile: false,
        isYou: true,
        badges: ['🎫 Promoter'],
        customBadges: ['🎫 Promoter'],
        bio: userProfile?.bio || profileBlurb || 'Concert promoter and event organizer on Nexus.',
        handle: promoterHandle,
        console_handle: promoterHandle,
        followersCount: currentUserStats?.followers ?? 0,
        followingCount: currentUserStats?.following ?? 0,
        hasProAccess: true
      };
    }

    if (activeRole === 'industry_pro' || userProfile?.account_type === 'industry_pro') {
      const pName = profileFullLegalName || userProfile?.full_name || userProfile?.name || 'Industry Pro';
      const rawHandle = profileHandle || userProfile?.console_handle || userProfile?.handle;
      const pHandle = (!rawHandle || rawHandle.toLowerCase().includes('virulent') || rawHandle === 'pro_user' || rawHandle === 'user') ? '@bdmCEO' : (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`);
      return {
        id: userProfile?.id || null,
        name: pName,
        legalName: pName,
        avatar: userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        avatar_url: userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        banner: userProfile?.banner_url || null,
        banner_url: userProfile?.banner_url || null,
        cover_url: userProfile?.banner_url || null,
        location: userProfile?.location || 'USA / Global',
        role: 'Industry Pro',
        account_type: 'industry_pro',
        type: 'user',
        isPersonal: true,
        isBandProfile: false,
        isYou: true,
        badges: userProfile?.badges?.length ? userProfile.badges : ['🤘 Fan', '⚡ Industry Pro'],
        customBadges: userProfile?.badges?.length ? userProfile.badges : ['🤘 Fan', '⚡ Industry Pro'],
        bio: userProfile?.bio || profileBlurb || 'Industry professional on the Nexus network.',
        handle: pHandle,
        console_handle: pHandle,
        followersCount: currentUserStats?.followers ?? 0,
        followingCount: currentUserStats?.following ?? 0,
        hasProAccess: true,
        isIndustryProPersonal: true
      };
    }

    const fName = profileFullLegalName || userProfile?.full_name || userProfile?.name || 'Fan Listener';
    const rawFHandle = profileHandle || userProfile?.fan_handle || userProfile?.console_handle || userProfile?.handle;
    const fHandle = (!rawFHandle || rawFHandle.toLowerCase().includes('virulent') || rawFHandle === 'listener' || rawFHandle === 'user') ? '@bdmCEO' : (rawFHandle.startsWith('@') ? rawFHandle : `@${rawFHandle}`);
    return {
      id: userProfile?.id || null,
      name: fName,
      legalName: fName,
      avatar: userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      avatar_url: userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      banner: userProfile?.banner_url || null,
      banner_url: userProfile?.banner_url || null,
      cover_url: userProfile?.banner_url || null,
      location: userProfile?.location || 'USA / Global',
      role: 'Fan Listener',
      account_type: 'fan_only',
      type: 'user',
      isPersonal: true,
      isBandProfile: false,
      isYou: true,
      badges: userProfile?.badges?.length ? userProfile.badges : ['🤘 Fan'],
      customBadges: userProfile?.badges?.length ? userProfile.badges : ['🤘 Fan'],
      bio: userProfile?.bio || profileBlurb || 'Fan and scene listener on the Nexus network.',
      handle: fHandle,
      console_handle: fHandle,
      followersCount: currentUserStats?.followers ?? 0,
      followingCount: currentUserStats?.following ?? 0,
      hasProAccess: false
    };
  }

  // Check if target is an official band entity (Community Archive or Supabase Band)
  const candidateBandId = targetId || (typeof userParam === 'object' ? (userParam.band_id || userParam.raw_id) : null);
  const matchedCommunityBand = 
    (candidateBandId ? communityBandManager.getById(candidateBandId) : null) ||
    communityBandManager.findByName(cleanDisplayName) ||
    communityBandManager.findByName(rawName) ||
    communityBandManager.findMatch(cleanDisplayName) ||
    communityBandManager.findMatch(rawName);

  const isExplicitBand = !!(
    (typeof userParam === 'object' && (userParam.isBandProfile || userParam.isBand || userParam.type === 'band' || userParam.category === 'bands' || userParam.account_type === 'band' || userParam.portalRole === 'band' || userParam.role === 'Artist' || userParam.role === 'Official Band' || userParam.role === 'Band' || userParam.role === 'Archive Band')) ||
    matchedCommunityBand ||
    (dbProfile && (dbProfile.isBandProfile || dbProfile.account_type === 'band' || dbProfile.role === 'Artist' || dbProfile.role === 'Band'))
  );

  if (matchedCommunityBand || (isExplicitBand && (matchedCommunityBand || (typeof userParam === 'object' && (userParam.isBandProfile || userParam.isRealBand || userParam.category === 'bands'))))) {
    const bandObj = matchedCommunityBand;
    const bandName = bandObj?.name || (bandObj as any)?.band_name || userParam?.name || userParam?.band_name || cleanDisplayName;
    const bandLogo = bandObj?.logo_url || bandObj?.avatar_url || (bandObj as any)?.avatar || userParam?.logo_url || userParam?.avatar_url || userParam?.avatar || userParam?.image;
    const bandBanner = bandObj?.cover_url || bandObj?.banner_url || userParam?.cover_url || userParam?.banner_url || userParam?.banner;
    const bandGenres = (bandObj as any)?.genres || (bandObj?.genre ? [bandObj.genre] : (userParam?.genres || ['Metal']));
    const bandLocation = bandObj ? [bandObj.city, bandObj.state || bandObj.state_province, bandObj.country].filter(Boolean).join(', ') : (userParam?.location || 'USA / Global');
    const bandBio = bandObj?.bio || userParam?.bio || `${bandName} official band profile on Nexus.`;
    const bandId = bandObj?.id || candidateBandId || (userParam as any)?.id || ensureUUID(bandName.toLowerCase().replace(/\s+/g, '-'));

    return {
      id: bandId,
      raw_id: bandObj?.id || bandId,
      band_id: bandObj?.id || bandId,
      name: bandName,
      band_name: bandName,
      avatar: bandLogo,
      avatar_url: bandLogo,
      logo_url: bandLogo,
      image: bandLogo,
      banner: bandBanner,
      banner_url: bandBanner,
      cover_url: bandBanner,
      location: bandLocation,
      role: bandObj?.verification_status === 'community_archive' ? 'Archive Band' : 'Artist',
      account_type: 'band',
      portalRole: 'band',
      type: 'band',
      isBandProfile: true,
      isPersonal: false,
      isBand: true,
      isRealBand: true,
      isYou: false,
      badges: (bandObj as any)?.badges || ['🎸 Artist', '⚡ Official Band'],
      customBadges: (bandObj as any)?.badges || ['🎸 Artist', '⚡ Official Band'],
      bio: bandBio,
      genres: Array.isArray(bandGenres) ? bandGenres : [bandGenres],
      genre: Array.isArray(bandGenres) ? bandGenres[0] : (bandGenres || 'Metal'),
      lineup: bandObj?.lineup || [],
      discography: bandObj?.discography || [],
      associatedProfiles: bandObj?.lineup && bandObj.lineup.length > 0 ? bandObj.lineup.map((m: any, i: number) => ({ name: m.name, role: m.role || 'Member', avatar: m.avatar || `https://images.unsplash.com/photo-${1500000000000 + (i * 100000)}?auto=format&fit=crop&q=80&w=100`, activated: true })) : [],
      followersCount: bandObj?.followers_count || (liveProfileStats?.followers ?? 120),
      followingCount: (bandObj as any)?.following_count || (liveProfileStats?.following ?? 0),
      hasProAccess: true,
      verification_status: bandObj?.verification_status || 'verified_official',
      is_verified: bandObj?.verification_status === 'verified_official' || (bandObj as any)?.is_verified === true,
      is_community_archive: bandObj?.verification_status === 'community_archive',
      musicCatalog: bandObj?.discography || []
    };
  }

  const paramName = cleanDisplayName;
  const paramRole = typeof userParam === 'object' ? (userParam.role || 'Fan Listener') : 'Fan Listener';
  const paramAvatar = typeof userParam === 'object' ? (userParam.avatar || userParam.avatar_url || '👤') : '👤';

  const user = {
    name: isCurrentUser ? (profileFullLegalName || userProfile?.name || paramName) : paramName,
    avatar: isCurrentUser ? (profileAvatarUrl || paramAvatar) : paramAvatar,
    role: isCurrentUser ? (
      portalRole === 'industry_pro' || userProfile?.account_type === 'industry_pro' ? 'Industry Pro' :
      portalRole === 'fan_only' || userProfile?.account_type === 'fan_only' ? 'Fan Listener' :
      isEmbedded ? (portalRole.charAt(0).toUpperCase() + portalRole.slice(1)) : (userProfile?.role || paramRole || 'Fan Listener')
    ) : paramRole,
    banner: userParam?.banner,
    handle: isCurrentUser ? (userProfile?.console_handle || userProfile?.handle || userProfile?.username) : userParam?.console_handle || userParam?.handle,
    console_handle: isCurrentUser ? (userProfile?.console_handle || userProfile?.handle || userProfile?.username) : userParam?.console_handle || userParam?.handle,
    isYou: isCurrentUser
  };

    const isYou = isCurrentUser;
    
    // Check if followed in discoverProfiles
    const discoverProf = discoverProfiles.find(p => (p?.name || "User").toLowerCase() === (user?.name || "User").toLowerCase());
    const isFollowed = discoverProf ? discoverProf.followed : false;

    // Predefined biographies & details
    const profileRegistry = PROFILE_REGISTRY;

    const userRoleLower = (user?.role || "Member" || '').toLowerCase();
    const key = (user?.name || "User" || '').toLowerCase();
    const registryData = profileRegistry[key] || {
      bio: isYou ? (profileBlurb || '') : (userParam?.bio || ''),
      location: isYou ? profileLocation : 'USA / Global',
      genres: isYou ? profileGenres : [userRoleLower.includes('artist') ? 'Metal' : 'Underground'],
      followersCount: isYou ? (currentUserStats?.followers ?? 0) : (liveProfileStats?.followers ?? 0),
      followingCount: isYou ? (currentUserStats?.following ?? 0) : (liveProfileStats?.following ?? 0),
      sharesCount: isYou ? 10 : 10,
      favoriteSong: isYou ? (profileFavoriteSong || '') : (dbProfile?.favoriteSong || userParam?.favoriteSong || ''),
      top_song_title: isYou ? (profileTopSongTitle ? (profileTopSongArtist ? `${profileTopSongArtist} - ${profileTopSongTitle}` : profileTopSongTitle) : profileFavoriteSong) : (dbProfile?.top_song_title || userParam?.top_song_title || ''),
      top_song_url: isYou ? (profileTopSongUrl || userProfile?.top_song_url || '') : (dbProfile?.top_song_url || userParam?.top_song_url || ''),
      customBadges: isYou ? (
        portalRole === 'label' ? ['💿 Record Label'] :
        portalRole === 'promoter' ? ['🎫 Promoter'] :
        portalRole === 'creative' ? ['🎨 Creative'] :
        portalRole === 'band' ? ['🎸 Artist'] :
        portalRole === 'industry_pro' ? ['💼 Industry Pro'] :
        ['🤘 Fan']
      ) : [user?.role || "Member" || 'User']
    };
    
    const hasProAccess = isYou || 
                         userRoleLower.includes('artist') || 
                         userRoleLower.includes('label') || 
                         userRoleLower.includes('promoter') ||
                         userRoleLower.includes('industry');
    
    // Returns user's uploaded catalog or empty array
    const getMusicCatalogForUser = (userName: string, userRole: string) => {
      return [];
    };

    const musicCatalog = getMusicCatalogForUser(user?.name || "User", user?.role || "Member");

    const isBand = (userRoleLower.includes('artist') || userRoleLower.includes('band')) && 
                   (!isYou || userProfile?.registered_workspaces?.includes('band'));
    
    let bandMembers: any[] = [];
    if (isBand) {
      const lowerName = (user?.name || "User").toLowerCase();
      if (isYou) {
        const activeBandId = (activeBand as any)?.id || userProfile?.activeBandId || 'default';
        const savedLineupStr = localStorage.getItem(`nexus_core_band_lineup_${activeBandId}`);
        const localLineup = savedLineupStr ? JSON.parse(savedLineupStr) : [];
        if (localLineup.length > 0) {
          bandMembers = localLineup.map((member: any, index: number) => ({
            name: member?.name,
            role: member.role || 'Member',
            avatar: `https://images.unsplash.com/photo-${1500000000000 + (index * 100000)}?auto=format&fit=crop&q=80&w=100`,
            activated: index % 2 === 0
          }));
        } else {
          bandMembers = [
            { name: userProfile?.name || 'User', role: 'Lead Vocalist', avatar: userProfile?.avatar || '👤', activated: true },
            { name: 'Guitar Surgeon', role: 'Guitarist', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', activated: false },
            { name: 'Blastbeat Engine', role: 'Drummer', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100', activated: true }
          ];
        }
      } else if (lowerName.includes('devourment')) {
        bandMembers = [
          { name: 'Ruben Rosas', role: 'Lead Vocalist', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', activated: true },
          { name: 'Chris Andrews', role: 'Guitarist', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', activated: false },
          { name: 'Dave Spencer', role: 'Bassist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', activated: true },
          { name: 'Brad Fincher', role: 'Drummer', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100', activated: false }
        ];
      } else if (lowerName.includes('cryptopsy')) {
        bandMembers = [
          { name: 'Flo Mounier', role: 'Drummer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', activated: true },
          { name: 'Christian Donaldson', role: 'Guitarist', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', activated: false },
          { name: 'Matt McGachy', role: 'Lead Vocalist', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', activated: true },
          { name: 'Olivier Pinard', role: 'Bassist', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100', activated: false }
        ];
      } else {
        bandMembers = [
          { name: 'Vocal Overlord', role: 'Lead Vocalist', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', activated: true },
          { name: 'Guitar Surgeon', role: 'Guitarist', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', activated: false },
          { name: 'Blastbeat Engine', role: 'Drummer', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100', activated: false }
        ];
      }
    }

    // Build dynamic associated profiles/ties from registered workspaces & real profile attributes
const dynamicUserTies: { name: string; role: string; avatar: string }[] = [];
const targetProfObj = isYou ? userProfile : dbProfile;

// Ensure workspaces is always treated as an array regardless of DB return type
const rawWorkspaces = targetProfObj?.registered_workspaces || targetProfObj?.allowed_workspaces || [];
const regWorkspaces: string[] = Array.isArray(rawWorkspaces) 
  ? rawWorkspaces 
  : typeof rawWorkspaces === 'string' 
    ? rawWorkspaces.split(',').map((s: string) => s.trim()) 
    : [];

if (regWorkspaces.includes('label') || targetProfObj?.label_company_name) {
  dynamicUserTies.push({
    name: targetProfObj?.label_company_name || 'Record Label',
    role: 'Label',
    avatar: targetProfObj?.label_avatar || targetProfObj?.avatar || 'https://images.unsplash.com/photo-1542208998-f6dbbb27a72f?w=150'
  });
}

const promoterName = targetProfObj?.promoter_name || targetProfObj?.promoter_metadata?.brand_name;
if (regWorkspaces.includes('promoter') || promoterName) {
  dynamicUserTies.push({
    name: promoterName || 'Live Event Promoter',
    role: 'Promoter',
    avatar: targetProfObj?.promoter_logo || targetProfObj?.promoter_metadata?.logo || targetProfObj?.avatar || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=150'
  });
}

const creativeName = targetProfObj?.creative_name || targetProfObj?.creative_metadata?.business_name;
if (regWorkspaces.includes('creative') || creativeName) {
  dynamicUserTies.push({
    name: creativeName || 'Creative Services',
    role: 'Creative',
    avatar: targetProfObj?.creative_avatar || targetProfObj?.avatar || 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=150'
  });
}

const isTargetMiguel = isMiguelNameOrProfile(targetProfObj) || (isYou && isMiguelNameOrProfile(userProfile));
const rawBandNameVal = targetProfObj?.band_name || targetProfObj?.bandName;
const bandNameVal = (isTargetMiguel || (rawBandNameVal && (rawBandNameVal.toLowerCase().includes('molested') || rawBandNameVal.toLowerCase().includes('dying fetus')))) ? 'Virulent Excision' : rawBandNameVal;
if (regWorkspaces.includes('band') || (bandNameVal && isTargetMiguel)) {
  const finalBandName = bandNameVal || (isTargetMiguel ? 'Virulent Excision' : null);
  if (finalBandName) {
    const isVE = finalBandName.toLowerCase() === 'virulent excision';
    dynamicUserTies.push({
      name: finalBandName,
      role: 'Artist',
      avatar: isVE ? 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396' : (targetProfObj?.avatar || targetProfObj?.avatar_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150')
    });
  }
}

if (Array.isArray(targetProfObj?.label_band_roster)) {
  targetProfObj.label_band_roster.forEach((bandName: string) => {
    if (bandName && !dynamicUserTies.some(t => t.name.toLowerCase() === bandName.toLowerCase())) {
      dynamicUserTies.push({
        name: bandName,
        role: 'Roster Artist',
        avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'
      });
    }
  });
}

    const associatedProfiles = isBand ? bandMembers :
      dynamicUserTies.length > 0 ? dynamicUserTies :
      userRoleLower.includes('label') ? [
        { name: 'Devourment', role: 'Artist', avatar: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=100' },
        { name: 'Pathology', role: 'Artist', avatar: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=100' },
        { name: 'Origin', role: 'Artist', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200' },
        { name: 'Incinerate', role: 'Artist', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=200' },
        { name: 'Stabbing', role: 'Artist', avatar: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=200' }
      ] : [];
    const dbBanner = dbProfile?.banner_url || dbProfile?.creative_banner || dbProfile?.promoter_cover_image || dbProfile?.label_banner;
    const banner = (user as any).banner || dbBanner || (discoverProf as any)?.banner || registryData.banner || (isYou ? profileCoverUrl : undefined);


    const finalGenres = (() => {
      if (isYou) {
        if (portalRole === 'band' || ((userRoleLower.includes('artist') || userRoleLower.includes('band')) && userProfile?.registered_workspaces?.includes('band'))) {
          return activeBand?.genre ? activeBand.genre.split(' / ').filter(Boolean) : profileGenres;
        }
        return profileGenres;
      }

      const targetProf = dbProfile || (userParam as any);
      const dbGenres = targetProf?.genres || targetProf?.genre_tags || targetProf?.creative_metadata?.genre_tags || targetProf?.promoter_metadata?.genre_tags;
      if (dbGenres && Array.isArray(dbGenres) && dbGenres.length > 0) {
        return dbGenres;
      }
      if (typeof dbGenres === 'string' && dbGenres.trim()) {
        try {
          const parsed = JSON.parse(dbGenres);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          const split = dbGenres.split(',').map((g: string) => g.trim()).filter(Boolean);
          if (split.length > 0) return split;
        }
      }

      return registryData.genres || [userRoleLower.includes('artist') ? 'Metal' : 'Underground'];
    })();

    const cleanTickerText = (val?: string) => {
      if (!val || !val.trim()) return "No updates posted yet";
      if (val.includes("EXTREME SONIC DEPLOYMENTS") || val.includes("SEWER GASKET JOINS") || val.includes("NAVIGATING THE NEXUS MATRIX")) {
        return "No updates posted yet";
      }
      return val.trim();
    };

    const finalFavoriteSong = isYou ? profileFavoriteSong : (registryData.favoriteSong || 'None Selected');
    const finalRosterTicker = isYou 
      ? cleanTickerText(userProfile?.update_ticker || userProfile?.rosterTicker || labelRosterTicker)
      : cleanTickerText(dbProfile?.update_ticker || dbProfile?.rosterTicker || registryData.rosterTicker);

    const followersCount = isYou 
      ? (currentUserStats?.followers ?? liveProfileStats?.followers ?? 0)
      : (liveProfileStats?.followers ?? 0);

    const followingCount = isYou 
      ? (currentUserStats?.following ?? liveProfileStats?.following ?? 0)
      : (liveProfileStats?.following ?? 0);

    const resolvedLegalName = isYou 
      ? (portalRole === 'band' ? (activeBand?.name || userProfile?.bandName || profileFullLegalName)
         : portalRole === 'fan_only' ? (profileFullLegalName || userProfile?.full_name || userProfile?.name)
         : portalRole === 'creative' ? (userProfile?.creative_metadata?.business_name || profileFullLegalName || 'Pro Creative')
         : portalRole === 'promoter' ? (userProfile?.promoter_metadata?.brand_name || profileFullLegalName || 'Pro Promoter')
         : portalRole === 'label' ? (userProfile?.label_company_name || profileFullLegalName || 'Pro Label')
         : (profileFullLegalName || userProfile?.legal_name || userProfile?.full_name || userProfile?.name))
      : (userParam.name === 'GoregrindSlayer' ? 'Tyler Slamson' :
         userParam.name === 'Blastfiend999' ? 'Zachary Blaster' :
         userParam.name === 'TapeTrader99' ? 'Marcus Cassette' :
         userParam.name === 'Scene Photographer' ? 'Dustin Shutter' :
         userParam.name === 'DeathMetalFan99' ? 'Alex Mercer' :
         (userParam as any).realName || userParam.name);

    const resolvedHandle = isYou 
      ? (portalRole === 'band' ? (profileHandle || (activeBand?.name || '').replace(/\s+/g, ''))
         : portalRole === 'fan_only' ? (profileHandle || userProfile?.fan_handle || 'listener')
         : portalRole === 'creative' ? (profileHandle || 'creative_pro')
         : portalRole === 'promoter' ? (profileHandle || 'promoter_pro')
         : portalRole === 'label' ? (profileHandle || userProfile?.label_url_slug || 'label_pro')
         : (profileHandle || userProfile?.console_handle || userProfile?.handle))
      : (userParam.name === 'GoregrindSlayer' ? 'GoregrindSlayer' :
         userParam.name === 'Blastfiend999' ? 'Blastfiend999' :
         userParam.name === 'TapeTrader99' ? 'TapeTrader99' :
         userParam.name === 'Scene Photographer' ? 'ScenePhotographer' :
         userParam.name === 'DeathMetalFan99' ? 'DeathMetalFan99' :
         (userParam as any).handle || userParam.name.replace(/\s+/g, ''));

    const resolvedProfileId = dbProfile?.id || (userParam as any).id || (userParam as any).userId || (userParam as any).user_id || targetId || null;

    return {
      id: resolvedProfileId,
      userId: resolvedProfileId,
      raw_id: resolvedProfileId,
      name: user?.name || "User",
      avatar: user?.avatar,
      email: isYou ? userProfile?.email : (userParam.email || (realProfiles.find(p => (p?.name || "User").toLowerCase() === (user?.name || "User").toLowerCase()) as any)?.email),
      banner,
      banner_url: dbProfile?.banner_url || dbProfile?.creative_banner || dbProfile?.promoter_cover_image || dbProfile?.label_banner || banner,
      cover_url: dbProfile?.cover_url || dbProfile?.promoter_cover_image || dbProfile?.creative_banner || banner,
      role: user?.role || "Member",
      isYou,
      isFollowed,
      legalName: resolvedLegalName,
      handle: dbProfile?.console_handle || dbProfile?.handle || resolvedHandle,
      console_handle: dbProfile?.console_handle || dbProfile?.handle || resolvedHandle,
      ...registryData,
      bio: dbProfile?.bio || (isYou ? profileBlurb : (userParam?.bio || registryData?.bio || '')),
      followersCount,
      followingCount,
      genres: finalGenres,
      genre_tags: finalGenres,
      favoriteSong: finalFavoriteSong,
      rosterTicker: finalRosterTicker,
      hasProAccess,
      musicCatalog,
      associatedProfiles,
      allowed_workspaces: dbProfile?.allowed_workspaces || [],
      is_pro: dbProfile?.is_pro === true
    };
  };

  const getPostAuthorDisplayName = (author?: { name?: string; realName?: string; legalName?: string; role?: string; isYou?: boolean; isBand?: boolean; band_name?: string; workspace_type?: string; portalRole?: string }) => {
    if (!author) return 'Anonymous User';
    const name = author.name || 'Anonymous User';
    const legalOrRealName = author.legalName || author.realName;

    // If author already formatted with parenthesis e.g. "handle (Legal Name)", keep it as is
    if (name.includes('(') && name.includes(')')) {
      return name;
    }

    // If author is a band/artist workspace or role
    if (
      author.isBand || 
      author.band_name || 
      author.role === 'Band / Artist' || 
      author.role === 'Artist' || 
      author.role === 'Band' || 
      (author as any).workspace_type === 'band' || 
      (author as any).portalRole === 'band'
    ) {
      return author.band_name || name;
    }

    // If author is a label or promoter entity
    if (author.role === 'Label' || author.role === 'Promoter') {
      return name;
    }

    // If author has a real legal name attached, render handle (Legal Name)
    if (legalOrRealName && legalOrRealName !== name) {
      return `${name} (${legalOrRealName})`;
    }

    if (name === 'GoregrindSlayer') {
      return 'GoregrindSlayer (Tyler Slamson)';
    }
    if (name === 'Blastfiend999') {
      return 'Blastfiend999 (Zachary Blaster)';
    }
    if (name === 'TapeTrader99') {
      return 'TapeTrader99 (Marcus Cassette)';
    }
    if (name === 'Scene Photographer') {
      return 'Scene Photographer (Dustin Shutter)';
    }
    if (name === 'DeathMetalFan99') {
      return 'DeathMetalFan99 (Alex Mercer)';
    }

    return name;
  };

  const getProfileForUserRef = useRef(getProfileForUser);
  useEffect(() => {
    getProfileForUserRef.current = getProfileForUser;
  });

  useEffect(() => {
    const handleOpenPublicProfile = (e: CustomEvent) => {
      // Prevent double triggers if multiple feed instances exist
      if ((window as any).__isOpeningProfileModal) return;
      (window as any).__isOpeningProfileModal = true;
      setTimeout(() => {
        (window as any).__isOpeningProfileModal = false;
      }, 300);

      e.stopImmediatePropagation?.();
      const profileData = e.detail?.profile || e.detail;
      if (profileData) {
        setSelectedUserProfile(getProfileForUserRef.current(profileData));
      }
    };

    const handleUrlProfileRouting = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlUserId = searchParams.get('userId') || searchParams.get('user_id') || searchParams.get('user') || searchParams.get('profileId') || searchParams.get('profile_id');
        const urlBandId = searchParams.get('bandId') || searchParams.get('band_id') || searchParams.get('band');
        
        if (urlUserId || urlBandId) {
          const isMe = (urlUserId && userProfile?.id && String(urlUserId) === String(userProfile.id)) ||
                       (urlBandId && userProfile?.band_id && String(urlBandId) === String(userProfile.band_id));
          const targetPayload: any = {
            id: urlUserId || urlBandId,
            userId: urlUserId,
            bandId: urlBandId,
            isYou: Boolean(isMe),
            isBandProfile: Boolean(urlBandId && !urlUserId)
          };
          const resolved = getProfileForUserRef.current(targetPayload);
          if (resolved) {
            setSelectedUserProfile(resolved);
          }
        }
      } catch (_) {}
    };

    const handleOpenEventCompanion = (e: any) => {
      const gig = e.detail;
      if (gig) {
        setActiveEventData(gig);
        setIsEventModeActive(true);
        setShowMapModal(false);
      }
    };

    handleUrlProfileRouting();
    window.addEventListener('popstate', handleUrlProfileRouting);
    window.addEventListener('openPublicProfile', handleOpenPublicProfile as any);
    window.addEventListener('open-event-companion', handleOpenEventCompanion as any);
    return () => {
      window.removeEventListener('popstate', handleUrlProfileRouting);
      window.removeEventListener('openPublicProfile', handleOpenPublicProfile as any);
      window.removeEventListener('open-event-companion', handleOpenEventCompanion as any);
    };
  }, [userProfile?.id, userProfile?.band_id]);

  const findCurrentStoryIndex = useCallback((target: any) => {
    if (!target || !Array.isArray(stories) || stories.length === 0) return -1;
    const targetId = String(target.id ?? '');
    const idIdx = stories.findIndex(s => targetId && String(s.id ?? '') === targetId);
    if (idIdx !== -1) return idIdx;
    return stories.findIndex(s =>
      (s.name && s.name === target.name) ||
      (s.image && s.image === target.image) ||
      (s.video && s.video === target.video)
    );
  }, [stories]);

  const handleNextStory = useCallback(() => {
    if (!activeStory) return;
    const currentIndex = findCurrentStoryIndex(activeStory);
    if (currentIndex !== -1 && currentIndex < stories.length - 1) {
      setActiveStory(stories[currentIndex + 1]);
    } else {
      setActiveStory(null);
    }
  }, [activeStory, findCurrentStoryIndex, stories]);

  const handlePrevStory = useCallback(() => {
    if (!activeStory) return;
    const currentIndex = findCurrentStoryIndex(activeStory);
    if (currentIndex > 0) {
      setActiveStory(stories[currentIndex - 1]);
    }
  }, [activeStory, findCurrentStoryIndex, stories]);

  const [shopItemsList, setShopItemsList] = useState<any[]>(mockShopItems);
  const [inAppSongsList, setInAppSongsList] = useState<any[]>(mockInAppSongs);

  useEffect(() => {
    const fetchShopItemsAndTracks = async () => {
      const supabaseClient = getSupabase();
      if (!supabaseClient) return;
      try {
        const { data: shopData, error: shopError } = await supabaseClient.from('nexus_shop_items').select('*').order('created_at', { ascending: false });
        if (!shopError && shopData && shopData.length > 0) {
          const fromDb = shopData.map(d => ({
             id: d.id,
             name: d.name,
             price: Number(d.price),
             category: d.category,
             subcategory: d.category,
             description: d.description,
             thumbnail: d.fallback_thumbnail,
             fallbackThumbnail: d.fallback_thumbnail,
             condition: d.condition,
             year: 'N/A',
             brand: d.brand_name || 'Generic',
             seller: d.seller,
             poster: d.seller,
             location: 'Local',
             is_real_account: true
          }));
          const merged = [...fromDb, ...mockShopItems];
          setShopItemsList(merged);
          setShopItems(merged);
        }

        const { data: trackData, error: trackError } = await supabaseClient.from('nexus_tracks').select('*').order('created_at', { ascending: false });
        if (!trackError && trackData && trackData.length > 0) {
           setInAppSongsList(prev => {
             const dbTracks = trackData.map(t => ({
                id: t.id,
                title: t.title,
                band: t.band,
                album: t.album,
                duration: t.duration,
                coverArt: t.cover_art,
                audioUrl: ''
             }));
             return [...dbTracks, ...mockInAppSongs];
           });
        }
      } catch(e) {
         console.error('Error fetching shop items / tracks:', e);
      }
    };
    fetchShopItemsAndTracks();
  }, []);

  const [isPostListingOpen, setIsPostListingOpen] = useState(false);
  const [newListingType, setNewListingType] = useState<'gear' | 'classifieds'>('gear');
  const [newListingTitle, setNewListingTitle] = useState('');
  const [newListingPrice, setNewListingPrice] = useState('100');
  const [newListingCondition, setNewListingCondition] = useState('Good');
  const [newListingBrand, setNewListingBrand] = useState('');
  const [newListingYear, setNewListingYear] = useState('');
  const [newListingLocation, setNewListingLocation] = useState('Los Angeles, CA');
  const [newListingDescription, setNewListingDescription] = useState('');
  const [newListingImagePreset, setNewListingImagePreset] = useState('guitar');
  const [newListingCustomImage, setNewListingCustomImage] = useState('');

  const defaultUserHandle = userProfile?.username || userProfile?.full_name || 'AnonymousRiffer';

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingTitle.trim()) {
      triggerNotification?.("Please enter a listing title.");
      return;
    }
    if (!newListingDescription.trim()) {
      triggerNotification?.("Please enter a description.");
      return;
    }

    const presetsMap = {
      guitar: 'https://images.unsplash.com/photo-1508186227413-bb1f58693046?auto=format&fit=crop&w=600&q=80',
      amp: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=600&q=80',
      drums: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=600&q=80',
      audio: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80'
    };

    const imageUrl = newListingCustomImage.trim() || presetsMap[newListingImagePreset as keyof typeof presetsMap] || presetsMap.guitar;

    const newListingItem = {
      id: `comm_${Date.now()}`,
      name: newListingTitle.trim(),
      price: newListingType === 'gear' ? parseFloat(newListingPrice) || 0 : 0,
      category: newListingType,
      subcategory: newListingType,
      description: newListingDescription.trim(),
      thumbnail: imageUrl,
      fallbackThumbnail: imageUrl,
      ...(newListingType === 'gear' ? {
        condition: newListingCondition,
        brand: newListingBrand.trim() || 'Generic',
        year: newListingYear.trim() || 'N/A',
        seller: defaultUserHandle
      } : {
        poster: defaultUserHandle
      }),
      location: newListingLocation.trim() || 'Local'
    };

    const supabaseClient = getSupabase();
    if (supabaseClient) {
      try {
        await supabaseClient.from('nexus_shop_items').insert({
          profile_id: userProfile?.id,
          name: newListingTitle.trim(),
          price: newListingType === 'gear' ? parseFloat(newListingPrice) || 0 : 0,
          category: newListingType,
          condition: newListingCondition,
          description: newListingDescription.trim(),
          seller: defaultUserHandle,
          fallback_thumbnail: imageUrl,
          is_user_listed: true,
          brand_name: newListingBrand.trim() || 'Generic',
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error inserting shop item', err);
      }
    }

    setShopItemsList(prev => [newListingItem as any, ...prev]);
    setIsPostListingOpen(false);
    triggerNotification?.(`🚀 Successfully posted "${newListingTitle.trim()}" to the Community Marketplace!`);

    // Reset fields
    setNewListingTitle('');
    setNewListingPrice('100');
    setNewListingBrand('');
    setNewListingYear('');
    setNewListingDescription('');
    setNewListingCustomImage('');
  };

  // Reddit-style Forum states and interfaces
  const [forumThreads, setForumThreads] = useState<any[]>(initialForumThreads);

  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);

  // 100% foolproof display-level deduplication layer for social notifications
  const deduplicatedNotifications = useMemo(() => {
    const seenIds = new Set<string>();
    const seenMessages = new Map<string, number>(); // title:msg -> timestamp
    
    return notifications.filter(notif => {
      if (!notif) return false;
      const idStr = notif.id || `notif_${notif.title}_${notif.message}`;
      if (seenIds.has(idStr)) {
        return false;
      }
      seenIds.add(idStr);
      
      const key = `${notif.title || ''}:${notif.message || ''}`;
      if (seenMessages.has(key)) {
        return false;
      }
      seenMessages.set(key, 1);
      return true;
    });
  }, [notifications]);

  const unreadNotifsCount = useMemo(() => {
    return deduplicatedNotifications.filter(n => !n.read).length;
  }, [deduplicatedNotifications]);

  const totalUnreadCount = useMemo(() => {
    const chatsUnread = chats.reduce((acc, c) => {
      const unreadNum = typeof c.unread === 'number' ? c.unread : (c.unread ? 1 : 0);
      return acc + unreadNum;
    }, 0);
    return Math.max(hookUnreadCount, chatsUnread);
  }, [chats, hookUnreadCount]);



  useEffect(() => {
    if (!userProfile?.email) return;
    try {
      const notifsStr = JSON.stringify(notifications);
      localStorage.setItem(`nexus_notifications_${userProfile.email}`, notifsStr);
    } catch (e) {
      console.warn("Failed to save notifications to localStorage:", e);
    }
  }, [notifications, userProfile?.email]);

  useEffect(() => {
    const userUUID = userProfile?.id && extractUUID(userProfile.id);
    if (!userUUID) return;

    const loadNotificationsFromSupabase = async () => {
      const supabaseClient = getSupabase();
      if (!supabaseClient) return;

      try {
        await supabaseClient.auth.getSession();
        const { data, error } = await supabaseClient
          .from('nexus_notifications')
          .select('*')
          .eq('user_id', userUUID)
          .order('created_at', { ascending: false });

        if (data && Array.isArray(data) && data.length > 0) {
          const remoteNotifs = data.map((row: any) => ({
            ...row,
            id: row.id,
            title: row.title || 'Notification',
            message: row.message || row.content || '',
            category: row.category || row.type || 'SYSTEM',
            read: row.is_read ?? row.read ?? false,
            is_read: row.is_read ?? row.read ?? false,
            timeAgo: row.created_at ? new Date(row.created_at).toLocaleTimeString() : 'Recently',
            timestamp: row.created_at || new Date().toISOString(),
          }));
          
          setNotifications(remoteNotifs);
          if (userProfile?.email) {
            try {
              localStorage.setItem(`nexus_notifications_${userProfile.email}`, JSON.stringify(remoteNotifs));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn("Error loading notifications from Supabase:", err);
      }
    };

    loadNotificationsFromSupabase();
  }, [userProfile?.email]);
  
  // Create Thread states
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('Album Reviews');
  const [newThreadPrimaryGenre, setNewThreadPrimaryGenre] = useState('Extreme Metal');
  const [newThreadMicroGenre, setNewThreadMicroGenre] = useState('Death Metal');
  const [newThreadMediaUrl, setNewThreadMediaUrl] = useState('');
  const [newThreadYoutubeUrl, setNewThreadYoutubeUrl] = useState('');
  const [showThreadMediaInput, setShowThreadMediaInput] = useState(false);
  const [showThreadYoutubeInput, setShowThreadYoutubeInput] = useState(false);

  // Comment on Thread state
  const [threadCommentInput, setThreadCommentInput] = useState('');
  const [threadReplyInputs, setThreadReplyInputs] = useState<Record<string, string>>({});
  const [activeThreadReplyCommentId, setActiveThreadReplyCommentId] = useState<string | null>(null);

  const {
    handleLikePost,
    handleBookmarkPost,
    handleSharePost,
    handleVotePoll,
    handleAddComment,
    handleVoteComment,
    handleVoteReply,
    handleAddReply,
    toggleComments,
    handleShareToTimeline,
    handleShareExternal,
    handleImageClickInFeed,
    handleConnectPayment,
    handleCreateThread,
    handleVote,
    handleAddThreadComment,
    handleVoteThreadComment,
    handleVoteThreadReply,
    handleAddThreadReply,
    handleEpkSubmit,
    handleReportSubmit,
    handleVerifyAdminPIN,
    handleShareSong
  } = useSocialFeedActions({
    feed,
    setFeed,
    userProfile,
    profileHandle,
    profileAvatarUrl,
    commentInputs,
    setCommentInputs,
    replyInputs,
    setReplyInputs,
    setActiveReplyCommentId,
    sharingPost,
    setSharingPost,
    triggerNotification,
    triggerPictureViewer,
    setForumThreads,
    setNotifications,
    newThreadTitle,
    setNewThreadTitle,
    newThreadContent,
    setNewThreadContent,
    newThreadCategory,
    newThreadMicroGenre,
    setNewThreadMicroGenre,
    newThreadMediaUrl,
    setNewThreadMediaUrl,
    newThreadYoutubeUrl,
    setNewThreadYoutubeUrl,
    setNewThreadPrimaryGenre,
    setShowCreateThread,
    threadCommentInput,
    setThreadCommentInput,
    threadReplyInputs,
    setThreadReplyInputs,
    setActiveThreadReplyCommentId,
    isGooglePayConnected,
    setIsGooglePayConnected,
    isApplePayConnected,
    setIsApplePayConnected,
    isPaypalConnected,
    setIsPaypalConnected,
    setIsConnectingPayment,
    expandedComments,
    setExpandedComments,
    handleFollowProfileParam: handleFollowProfile,
    likePostParam: handleReaction,
    setPreviewImage,
    setZoomScale,
    setPan
  });

  const getGenreMetadata = (primary: string, micro: string) => {
    if (primary === 'All') {
      return {
        title: 'Collective Music Boards',
        desc: 'The ultimate space for heavy, experimental, and underground music. Switch genre circles below to explore!'
      };
    }
    if (micro === 'All') {
      return {
        title: `${primary} Hub`,
        desc: `Everything related to ${primary} acts, labels, and gear.`
      };
    }
    return {
      title: `${micro} Board`,
      desc: `Discuss ${micro} album arts, reviews, gear setup, upcoming shows, and labels.`
    };
  };

  useEffect(() => {
    if (!activeEventData || !isEventModeActive) return;
    const supabaseClient = getSupabase();
    if (!supabaseClient) return;

    // Load existing messages from DB
    supabaseClient.from('nexus_venue_chat')
      .select('*, profiles(username, full_name, avatar_url, role)')
      .eq('event_id', activeEventData.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          const loadedMessages = data.map(row => ({
            user_id: row.profile_id,
            username: row.profiles?.username || row.profiles?.full_name || 'Anonymous',
            avatar_url: row.profiles?.avatar_url,
            text: row.message,
            timestamp: row.created_at
          }));
          setVenueMessages(loadedMessages);
        }
      });

    const channel = supabaseClient.channel(`venue_chat_${activeEventData.id}`, {
      config: { broadcast: { self: true } }
    });

    channel.on('broadcast', { event: 'venue_msg' }, (payload) => {
      setVenueMessages(prev => [...prev, payload.payload]);
    }).subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [activeEventData, isEventModeActive]);
  useEffect(() => {
    const fetchSearchResults = async () => {
      const q = globalSearchQuery.trim();
      if (!q) {
        setSearchResults([]);
        return;
      }
      const supabaseClient = getSupabase();
      if (!supabaseClient) {
        // Fallback to local filter if no DB client
        setSearchResults((allProfiles || []).filter(p => {
          const nameFields = [
            p?.full_name,
            p?.username,
            p?.name,
            p?.console_handle,
            p?.band_name,
            p?.business_name,
            p?.agency_name,
            p?.label_name
          ].filter(Boolean).map(f => String(f).toLowerCase());

          const genre = (p?.genre || p?.genres || '').toString().toLowerCase();
          const location = (p?.homebase || p?.city || p?.location || '').toLowerCase();
          
          const matchesName = nameFields.some(f => f.includes(q.toLowerCase()));
          return matchesName || genre.includes(q.toLowerCase()) || location.includes(q.toLowerCase());
        }));
        return;
      }
      try {
        const queryTerm = `%${q}%`;

        // 1. Query profiles table across all name, handle, role, and workspace fields
        const { data: profData } = await supabaseClient
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.${queryTerm},username.ilike.${queryTerm},band_name.ilike.${queryTerm},console_handle.ilike.${queryTerm},business_name.ilike.${queryTerm},agency_name.ilike.${queryTerm},label_name.ilike.${queryTerm},role.ilike.${queryTerm}`)
          .limit(20);

        // 2. Query registered bands table
        const { data: bandsData } = await supabaseClient
          .from('bands')
          .select('*')
          .or(`band_name.ilike.${queryTerm},name.ilike.${queryTerm},city.ilike.${queryTerm},state_province.ilike.${queryTerm},country.ilike.${queryTerm}`)
          .limit(20);

        const mappedProfiles = (profData || []).map(p => ({
          ...p,
          name: p.full_name || p.username || p.band_name || p.business_name || p.agency_name || p.label_name || 'Unknown',
          avatar: p.avatar_url || p.band_logo || p.creative_avatar || p.promoter_logo || p.label_avatar,
          category: (p.account_type === 'industry_pro' || p.account_type === 'industry pro') ? 'people' :
                    (p.role?.includes('band') || p.role?.includes('artist') || p.band_name) ? 'bands' : 
                    (p.role?.includes('label') || p.label_name) ? 'labels' : 
                    (p.role?.includes('venue') || p.role?.includes('promoter') || p.agency_name) ? 'venues' : 
                    (p.role?.includes('creative') || p.business_name) ? 'creatives' : 'people'
        }));

        const mappedBands = (bandsData || []).map(b => {
          const loc = formatBandLocation(b);
          const cleanMicros = sanitizeMicroGenres(b.micro_genres || b.sub_genres || b.genre_tags || b.genres || b.genre);

          return {
            ...b,
            id: b.id || `band_${b.band_name || b.name}`,
            band_id: b.id,
            name: b.band_name || b.name || 'Registered Band',
            band_name: b.band_name || b.name,
            full_name: b.band_name || b.name,
            username: (b.band_name || b.name || '').toLowerCase().replace(/\s+/g, '_'),
            avatar: b.logo_url || b.avatar_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
            avatar_url: b.logo_url || b.avatar_url,
            role: 'band',
            portalRole: 'Band / Artist',
            type: 'band',
            isBandProfile: true,
            category: 'bands',
            micro_genres: cleanMicros,
            genre: cleanMicros.length > 0 ? cleanMicros.join(' • ') : 'Metal / Hardcore',
            city: b.city,
            state_province: b.state_province,
            country: b.country,
            homebase: loc,
            location: loc,
            bio: b.bio || `Official registered band entity for ${b.band_name || b.name}.`
          };
        });

        const combined = [...mappedProfiles, ...mappedBands];
        const seen = new Set();
        const deduped = combined.filter(item => {
          const nameLower = (item.name || '').toLowerCase();
          // If searching for Miguel, exclude "Vortex Graphics" creative/band profile.
          const isSearchingForMiguel = q.toLowerCase().includes('miguel') || q.toLowerCase().includes('goregrinder') || q.toLowerCase().includes('goregrindsickness');
          const isVortexProfile = nameLower.includes('vortex graphics') || nameLower.includes('vortex graphic');
          if (isSearchingForMiguel && isVortexProfile) {
            return false;
          }
          const key = item.id || item.band_id || item.band_name || item.name;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setSearchResults(deduped);
      } catch (e) {
        console.error("Search failed", e);
        setSearchResults([]);
      }
    };
    
    const timeout = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(timeout);
  }, [globalSearchQuery, allProfiles]);

  const startLongPress = (postId: string) => {
    longPressTimer.current = setTimeout(() => {
      setReactionMenuOpenFor(postId);
      triggerNotification?.("Reaction dock deployed");
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const openCheckout = (type: 'merch' | 'ticket' | 'music', data: any) => {
    setCheckoutItem({ type, data });
    setQuantity(1);
    setPurchaseStep('details');
    setBottomSheetOpen(true);
    setShippingName(profileFullLegalName || '');
    setShippingStreet('');
    setShippingCity('');
    setShippingState('');
    setShippingZip('');
    setShippingPhone('');
    setShippingErrors({});
  };

  const handlePurchase = () => {
    setPurchaseStep('processing');
    setTimeout(() => {
      setPurchaseStep('success');
      
      if (checkoutItem) {
        if (checkoutItem.type === 'cart') {
          // Process multiple items in cart
          const newPurchases = (checkoutItem.data as any[]).map((item, idx) => ({
            id: `col_${Date.now()}_${idx}`,
            type: 'merch' as const,
            data: {
              id: item.productId,
              name: item.name,
              thumbnail: item.image,
              price: item.price,
              band: item.bandName,
              sizes: item.size ? [item.size] : [],
              shippingAddress: {
                name: shippingName || profileFullLegalName || 'Customer',
                street: shippingStreet || 'N/A',
                city: shippingCity || 'N/A',
                state: shippingState || 'N/A',
                zip: shippingZip || 'N/A',
                phone: shippingPhone || 'N/A'
              }
            },
            quantity: item.quantity,
            date: new Date()
          }));

          setMyCollections(prev => {
            const updated = [...newPurchases, ...prev];
            try {
              localStorage.setItem('nexus_my_collections_v1', JSON.stringify(updated));
            } catch (e) {
              console.warn("Failed to save collections to localStorage", e);
            }
            return updated;
          });

          // Empty cart
          setCartItems([]);

          // Dynamic unread notification for the whole cart
          const itemsCount = (checkoutItem.data as any[]).reduce((sum, item) => sum + item.quantity, 0);
          const firstItemName = (checkoutItem.data as any[])[0]?.name || 'Merch';
          const displayMsg = itemsCount > 1 
            ? `Successfully purchased ${firstItemName} and ${itemsCount - 1} other item(s). Receipt sent to your email!`
            : `Successfully purchased ${firstItemName}. Receipt sent to your email!`;

          const newNotif = {
            id: `n_purchase_${Date.now()}`,
            title: `🛍️ CART ORDER • Confirmed`,
            message: displayMsg,
            highlight: 'Order History',
            timeAgo: 'Just now',
            timestamp: new Date().toISOString(),
            read: false,
            type: 'shop',
            linkTab: 'shop'
          };
          setNotifications(prev => [newNotif, ...prev]);
          triggerNotification?.('Express Checkout successful! Confirmation sent.');

        } else {
          let purchaseData = { ...checkoutItem.data };
          if (checkoutItem.type === 'ticket') {
            const enriched = enrichTicketData(checkoutItem.data);
            purchaseData = {
              ...enriched,
              ticketType: selectedTicketTier === 'ga' ? 'General Admission' : selectedTicketTier === 'vip' ? 'VIP Access Pass' : 'VIP Ultimate Fan Bundle (includes Merch Bundle)',
              tierCode: selectedTicketTier,
              attendees: attendeeDetails.slice(0, quantity).map((att, idx) => ({
                name: att?.name.trim() || `Attendee ${idx + 1}`,
                tier: selectedTicketTier,
                size: selectedTicketTier === 'vip_merch' ? att.size : undefined
              }))
            };
          } else if (checkoutItem.type === 'merch') {
            purchaseData = {
              ...checkoutItem.data,
              shippingAddress: {
                name: shippingName || profileFullLegalName || 'Customer',
                street: shippingStreet || 'N/A',
                city: shippingCity || 'N/A',
                state: shippingState || 'N/A',
                zip: shippingZip || 'N/A',
                phone: shippingPhone || 'N/A'
              }
            };
          }

          const newPurchase = {
            id: `col_${Date.now()}`,
            type: checkoutItem.type,
            data: purchaseData,
            quantity: quantity,
            date: new Date()
          };

          setMyCollections(prev => {
            const updated = [newPurchase, ...prev];
            try {
              localStorage.setItem('nexus_my_collections_v1', JSON.stringify(updated));
            } catch (e) {
              console.warn("Failed to save collections to localStorage", e);
            }
            return updated;
          });

          // Dynamic unread notification
          const itemName = checkoutItem?.data?.name || checkoutItem?.data?.headliner || checkoutItem?.data?.title || 'Order';
          const typeLabel = checkoutItem?.type === 'merch' ? '🛍️ MERCH ORDER' : checkoutItem?.type === 'ticket' ? '🎟️ TICKET ORDER' : '🎵 MUSIC ORDER';
          const newNotif = {
            id: `n_purchase_${Date.now()}`,
            title: `${typeLabel} • Confirmed`,
            message: `Successfully purchased ${quantity}x ${itemName}. Receipt sent to your email!`,
            highlight: 'Order History',
            timeAgo: 'Just now',
            timestamp: new Date().toISOString(),
            read: false,
            type: 'shop',
            linkTab: checkoutItem?.type === 'merch' ? 'shop' : 'feed'
          };
          setNotifications(prev => [newNotif, ...prev]);
          triggerNotification?.('Purchase successful! Confirmation sent.');
        }
      }
    }, 1500);
  };

  const validateAndPurchase = () => {
    if (checkoutItem?.type === 'merch' || checkoutItem?.type === 'cart') {
      const errors: any = {};
      const targetName = shippingName || profileFullLegalName;
      if (!targetName?.trim()) errors.name = 'Full name is required';
      if (!shippingStreet?.trim()) errors.street = 'Street address is required';
      if (!shippingCity?.trim()) errors.city = 'City is required';
      if (!shippingState?.trim()) errors.state = 'State is required';
      if (!shippingZip?.trim()) errors.zip = 'ZIP code is required';
      
      if (Object.keys(errors).length > 0) {
        setShippingErrors(errors);
        triggerNotification?.("⚠️ Please fill in all shipping details.");
        return;
      }
    }
    setShippingErrors({});
    handlePurchase();
  };

  const handleTicketAction = (action: 'transfer' | 'resell' | 'simulate_resale_buy' | 'cancel_resale') => {
    if (!viewingReceipt) return;

    let updatedCollections = [...myCollections];
    const ticketIdx = updatedCollections.findIndex(c => c.id === viewingReceipt.id);
    if (ticketIdx === -1) return;

    const currentTicket = updatedCollections[ticketIdx];

    if (action === 'transfer') {
      const attendeeIdx = transferringAttendeeIndex;
      let newAttendees = [...(currentTicket.data.attendees || [])];
      
      // If there are no structured attendees yet (old mock data), we can initialize them
      if (newAttendees.length === 0) {
        for (let i = 0; i < currentTicket.quantity; i++) {
          newAttendees.push({ name: `Attendee ${i + 1}`, tier: 'ga' });
        }
      }

      const attendeeName = newAttendees[attendeeIdx]?.name || "Attendee";
      newAttendees.splice(attendeeIdx, 1);

      if (currentTicket.quantity <= 1 || newAttendees.length === 0) {
        updatedCollections.splice(ticketIdx, 1);
      } else {
        updatedCollections[ticketIdx] = {
          ...currentTicket,
          quantity: currentTicket.quantity - 1,
          data: {
            ...currentTicket.data,
            attendees: newAttendees
          }
        };
      }

      setMyCollections(updatedCollections);
      try {
        localStorage.setItem('nexus_my_collections_v1', JSON.stringify(updatedCollections));
      } catch (e) {
        console.warn(e);
      }
      
      triggerNotification?.(`🎉 Ticket gifted to ${transferRecipient || 'Friend'}!`);
      
      const newNotif = {
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        title: `🎫 TICKET GIFTED`,
        message: `Successfully transferred ticket for ${attendeeName} to ${transferRecipient || 'Friend'}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'receipt',
        linkTab: 'collections'
      };
      setNotifications(prev => [newNotif, ...prev]);
      
      setViewingReceipt(null);
      setTransferMode('none');

    } else if (action === 'resell') {
      const priceVal = parseFloat(resellPrice) || 35;
      updatedCollections[ticketIdx] = {
        ...currentTicket,
        data: {
          ...currentTicket.data,
          isListedForResale: true,
          resellPrice: priceVal,
          resellPaymentInfo: resellPaymentInfo || 'CashApp $MyNexusHandle',
          resellMethod: resellMethod,
          resaleAttendeeIdx: transferringAttendeeIndex
        }
      };

      setMyCollections(updatedCollections);
      try {
        localStorage.setItem('nexus_my_collections_v1', JSON.stringify(updatedCollections));
      } catch (e) {
        console.warn(e);
      }
      
      const attName = currentTicket.data.attendees?.[transferringAttendeeIndex]?.name || `Attendee ${transferringAttendeeIndex + 1}`;
      triggerNotification?.(`🚀 ${attName}'s ticket listed for $${priceVal.toFixed(2)}!`);
      setTransferMode('none');
      setViewingReceipt(updatedCollections[ticketIdx]);

    } else if (action === 'cancel_resale') {
      updatedCollections[ticketIdx] = {
        ...currentTicket,
        data: {
          ...currentTicket.data,
          isListedForResale: false,
          resellPrice: undefined,
          resellPaymentInfo: undefined
        }
      };

      setMyCollections(updatedCollections);
      try {
        localStorage.setItem('nexus_my_collections_v1', JSON.stringify(updatedCollections));
      } catch (e) {
        console.warn(e);
      }
      
      triggerNotification?.(`Listing cancelled.`);
      setTransferMode('none');
      setViewingReceipt(updatedCollections[ticketIdx]);

    } else if (action === 'simulate_resale_buy') {
      const priceVal = currentTicket.data.resellPrice || 35;
      const attendeeIdx = currentTicket.data.resaleAttendeeIdx !== undefined ? currentTicket.data.resaleAttendeeIdx : 0;
      let newAttendees = [...(currentTicket.data.attendees || [])];
      
      if (newAttendees.length === 0) {
        for (let i = 0; i < currentTicket.quantity; i++) {
          newAttendees.push({ name: `Attendee ${i + 1}`, tier: 'ga' });
        }
      }

      const attendeeName = newAttendees[attendeeIdx]?.name || "Attendee";
      newAttendees.splice(attendeeIdx, 1);

      setSimulatedResaleBalance(prev => prev + priceVal);

      if (currentTicket.quantity <= 1 || newAttendees.length === 0) {
        updatedCollections.splice(ticketIdx, 1);
      } else {
        updatedCollections[ticketIdx] = {
          ...currentTicket,
          quantity: currentTicket.quantity - 1,
          data: {
            ...currentTicket.data,
            isListedForResale: false,
            resellPrice: undefined,
            resellPaymentInfo: undefined,
            attendees: newAttendees
          }
        };
      }

      setMyCollections(updatedCollections);
      try {
        localStorage.setItem('nexus_my_collections_v1', JSON.stringify(updatedCollections));
      } catch (e) {
        console.warn(e);
      }

      triggerNotification?.(`💰 Ticket bought! $${priceVal.toFixed(2)} added to Resale Balance.`);
      
      const newNotif = {
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        title: `💰 TICKET RESOLD`,
        message: `Successfully sold ticket for ${attendeeName} for $${priceVal.toFixed(2)}! Funds cleared.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'receipt',
        linkTab: 'collections'
      };
      setNotifications(prev => [newNotif, ...prev]);

      setViewingReceipt(null);
      setTransferMode('none');
    }
  };





  const gridStyle = {
    backgroundImage: `linear-gradient(to right, ${currentTheme.gridColor || 'rgba(239,68,68,0.025)'} 1px, transparent 1px), linear-gradient(to bottom, ${currentTheme.gridColor || 'rgba(239,68,68,0.025)'} 1px, transparent 1px)`,
    backgroundSize: '24px 24px'
  };

  return (
    <SocialRoleProvider value={portalRoleState}>
      <SocialThemeShell
        containerRef={containerRef}
        dataTheme={dataTheme}
        gridStyle={gridStyle}
      >

      <div className="transition-all duration-300 opacity-100">
      {/* Standalone Navigation Header */}
      <FeedTopHeader
        isEmbedded={isEmbedded}
        onBack={onBack}
        adminClickCount={adminClickCount}
        setAdminClickCount={setAdminClickCount}
        setShowAdminPINModal={setShowAdminPINModal}
        adminPINRef={adminPINRef}
        setIsCartOpen={setIsCartOpen}
        cartItems={cartItems}
        profileFullLegalName={profileFullLegalName}
        profileAvatarUrl={profileAvatarUrl}
        profileCoverUrl={profileCoverUrl}
        roleMenuOpen={roleMenuOpen}
        setRoleMenuOpen={setRoleMenuOpen}
        portalRole={portalRole}
        setPortalRole={setPortalRole}
        switchRole={switchRole}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        activeBand={resolvedActiveBand || activeBand}
        getRoleBorderAndGlowClass={getRoleBorderAndGlowClass}
        unreadNotifsCount={unreadNotifsCount}
        setRightDrawerOpen={setRightDrawerOpen}
        setLeftDrawerOpen={setLeftDrawerOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showSceneRadio={showSceneRadio}
        setShowSceneRadio={setShowSceneRadio}
        globalSearchQuery={globalSearchQuery}
        setGlobalSearchQuery={setGlobalSearchQuery}
        searchResults={searchResults}
        allProfiles={allProfiles}
        discoverProfiles={discoverProfiles}
        handleGlobalSearchFollowToggle={handleGlobalSearchFollowToggle}
        getSupabase={getSupabase}
        triggerNotification={triggerNotification}
        onLogout={onLogout}
        onNavigateToTab={onNavigateToTab}
        setDashboardV2ActiveNav={setDashboardV2ActiveNav}
        dashboardV2ActiveNav={dashboardV2ActiveNav}
        activeFeedCategoryFilter={activeFeedCategoryFilter}
        setActiveFeedCategoryFilter={setActiveFeedCategoryFilter}
      />

        {/* Profile Hub Card */}
        <ProfileHubCard
          activeTab={activeTab}
          setLeftDrawerOpen={setLeftDrawerOpen}
          setDrawerCurrentView={setDrawerCurrentView}
          triggerNotification={triggerNotification}
          currentTheme={currentTheme}
          profileCoverUrl={profileCoverUrl}
          isEmbedded={isEmbedded}
          profileAvatarUrl={profileAvatarUrl}
          profileHandle={profileHandle}
          profileFullLegalName={profileFullLegalName}
          portalRole={portalRole}
          profileBlurb={profileBlurb}
          profileSceneRoles={profileSceneRoles}
          profileLocation={profileLocation}
          getRoleBorderAndGlowClass={getRoleBorderAndGlowClass}
          activeBand={resolvedActiveBand || activeBand}
          userProfile={userProfile}
        />

        {/* Sub-view control panels & Live Tonight Header inside unified sticky header */}
        {activeTab !== 'forum' && activeTab !== 'messages' && activeTab !== 'reels' && activeTab !== 'shop' && activeTab !== 'gallery' && (activeTab as string) !== 'photopit' && (
          <SubViewControlPanels
            isLiveTonightOpen={isLiveTonightOpen}
            setIsLiveTonightOpen={setIsLiveTonightOpen}
            liveEvents={liveEvents}
            onSelectLiveTonight={(gig) => {
              setActiveEventData(gig);
              setIsEventModeActive(true);
            }}
            onCheckoutTicket={(gig) => openCheckout('ticket', gig)}
            filterHideTicketPresales={filterHideTicketPresales}
            setFilterHideTicketPresales={setFilterHideTicketPresales}
            filterShowFollowedOnly={filterShowFollowedOnly}
            setFilterShowFollowedOnly={setFilterShowFollowedOnly}
            filterShowMerchDropsOnlyFromFollowed={filterShowMerchDropsOnlyFromFollowed}
            setFilterShowMerchDropsOnlyFromFollowed={setFilterShowMerchDropsOnlyFromFollowed}
            onOpenMapModal={() => setShowMapModal(true)}
            onOpenShowCreator={() => { setEditingCommunityShow(null); setIsCommunityShowModalOpen(true); }}
            onEditShow={(gig) => { setEditingCommunityShow(gig); setIsCommunityShowModalOpen(true); }}
            onDeleteGig={handleDeleteUpcomingShowPermanently}
          />
        )}
      </div>

      {isLoading ? (
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-2 sm:px-4 space-y-8 animate-pulse">
          {/* Scene Creator Box Skeleton */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 h-32" />
          
          {/* Stories Skeleton */}
          <div className="space-y-3">
            <div className="h-3 w-32 bg-zinc-800/50 rounded" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={`story-skel-${i}`} className="w-28 h-40 rounded-xl bg-zinc-900/50 border border-zinc-800/50 shrink-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-zinc-800/80" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Edge-to-edge card shells */}
          {[1, 2].map((i) => (
            <div key={`card-skel-${i}`} className="-mx-4 sm:mx-0 bg-[#121214]/50 border-y sm:border border-zinc-900/50 sm:rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800/50 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 bg-zinc-800/50 rounded" />
                  <div className="h-2 w-16 bg-zinc-900/50 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-zinc-800/50 rounded" />
                <div className="h-3 w-5/6 bg-zinc-800/50 rounded" />
              </div>
              <div className="w-full h-48 bg-zinc-900/50 rounded-lg" />
              <div className="flex justify-between items-center pt-2">
                <div className="w-16 h-4 bg-zinc-800/50 rounded" />
                <div className="w-16 h-4 bg-zinc-800/50 rounded" />
                <div className="w-16 h-4 bg-zinc-800/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
<FeedViewRouter
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  userProfile={userProfile}
  postIdentity={postIdentity}
  setPostIdentity={setPostIdentity}
  newPostText={newPostText}
  setNewPostText={setNewPostText}
  mediaUrl={mediaUrl}
  setMediaUrl={setMediaUrl}
  selectedMediaFiles={selectedMediaFiles}
  setSelectedMediaFiles={setSelectedMediaFiles}
  handleMediaUpload={handleMediaUpload}
  newPostTag={newPostTag}
  setNewPostTag={setNewPostTag}
  handleCreatePost={handleCreatePost}
  youtubeUrl={youtubeUrl}
  setYoutubeUrl={setYoutubeUrl}
  taggedVenue={taggedVenue}
  setTaggedVenue={setTaggedVenue}
  setShowPollModal={setShowPollModal}
  pollQuestion={pollQuestion}
  setPollQuestion={setPollQuestion}
  pollVariant={pollVariant}
  setPollVariant={setPollVariant}
  pollOptions={pollOptions}
  setPollOptions={setPollOptions}
  pollIsTimed={pollIsTimed}
  setPollIsTimed={setPollIsTimed}
  pollTimerDays={pollTimerDays}
  setPollTimerDays={setPollTimerDays}
  pollTimerHours={pollTimerHours}
  setPollTimerHours={setPollTimerHours}
  setShowMerchDropModal={setShowMerchDropModal}
  merchDropName={merchDropName}
  setMerchDropName={setMerchDropName}
  merchDropPrice={merchDropPrice}
  setMerchDropPrice={setMerchDropPrice}
  setShowSongModal={setShowSongModal}
  attachedSong={attachedSong}
  setAttachedSong={setAttachedSong}
  taggedBands={taggedBands}
  setTaggedBands={setTaggedBands}
  tapeTitle={tapeTitle}
  setTapeTitle={setTapeTitle}
  tapeBand={tapeBand}
  setTapeBand={setTapeBand}
  tapeDate={tapeDate}
  setTapeDate={setTapeDate}
  tapeDuration={tapeDuration}
  setTapeDuration={setTapeDuration}
  tapeAudioUrl={tapeAudioUrl}
  setTapeAudioUrl={setTapeAudioUrl}
  tapeAudioFileName={tapeAudioFileName}
  isUploadingTapeAudio={isUploadingTapeAudio}
  handleTapeAudioUpload={handleTapeAudioUpload}
  tapeFileInputRef={tapeFileInputRef}
  triggerNotification={triggerNotification}
  setShowEventModal={setShowEventModal}
  eventTitle={eventTitle}
  setEventTitle={setEventTitle}
  eventType={eventType}
  setEventType={setEventType}
  eventDate={eventDate}
  setEventDate={setEventDate}
  eventTime={eventTime}
  setEventTime={setEventTime}
  eventLocationName={eventLocationName}
  setEventLocationName={setEventLocationName}
  eventAddress={eventAddress}
  setEventAddress={setEventAddress}
  eventIsSecret={eventIsSecret}
  setEventIsSecret={setEventIsSecret}
  eventLineup={eventLineup}
  setEventLineup={setEventLineup}
  eventFlyerUrl={eventFlyerUrl}
  setEventFlyerUrl={setEventFlyerUrl}
  eventDescription={eventDescription}
  setEventDescription={setEventDescription}
  eventCost={eventCost}
  setEventCost={setEventCost}
  eventTicketUrl={eventTicketUrl}
  setEventTicketUrl={setEventTicketUrl}
  stories={stories}
  setShowUploadStoryModal={setShowUploadStoryModal}
  setActiveStory={setActiveStory}
  filterHideTicketPresales={filterHideTicketPresales}
  filterShowFollowedOnly={filterShowFollowedOnly}
  filterShowMerchDropsOnlyFromFollowed={filterShowMerchDropsOnlyFromFollowed}
  activeFeedCategoryFilter={activeFeedCategoryFilter}
  setActiveFeedCategoryFilter={setActiveFeedCategoryFilter}
  discoverProfiles={discoverProfiles}
  profileFullLegalName={profileFullLegalName}
  feed={feed}
  setFeed={setFeed}
  labelPosts={labelPosts}
  setLabelPosts={setLabelPosts}
  handleReaction={handleReaction}
  handleAddComment={handleAddComment}
  setEditingPostId={setEditingPostId}
  setEditingPostText={setEditingPostText}
  handleSaveEdit={handleSaveEdit}
  handleDeletePost={handleDeletePost}
  setCheckoutItem={setCheckoutItem}
  setSelectedUserProfile={setSelectedUserProfile}
  setActiveEventData={setActiveEventData}
  setIsEventModeActive={setIsEventModeActive}
  setBottomSheetOpen={setBottomSheetOpen}
  handleVotePoll={handleVotePoll}
  shopBrandFilter={shopBrandFilter}
  setShopBrandFilter={setShopBrandFilter}
  portalRole={portalRole}
  activeBand={resolvedActiveBand || activeBand}
  bands={effectiveBands}
  roleTheme={activeRoleTheme}
  profileHandle={profileHandle}
  shopSearchQuery={shopSearchQuery}
  setShopSearchQuery={setShopSearchQuery}
  shopCategory={shopCategory}
  setShopCategory={setShopCategory}
  shopItems={shopItems}
  setShopItems={setShopItems}
  selectedMerch={selectedMerch}
  setSelectedMerch={setSelectedMerch}
  selectedMerchSize={selectedMerchSize}
  setSelectedMerchSize={setSelectedMerchSize}
  selectedMerchQty={selectedMerchQty}
  setSelectedMerchQty={setSelectedMerchQty}
  isCheckoutModalOpen={isCheckoutModalOpen}
  setIsCheckoutModalOpen={setIsCheckoutModalOpen}
  checkoutSuccess={checkoutSuccess}
  setCheckoutSuccess={setCheckoutSuccess}
  getSupabase={getSupabase}
  profileAvatarUrl={profileAvatarUrl}
  allProfiles={allProfiles}
  syncPostToSupabase={syncPostToSupabase}
  uploadBase64ToStorage={uploadBase64ToStorage}
  compressImageInSocialFeed={compressImageInSocialFeed}
  triggerPictureViewer={triggerPictureViewer}
  clips={clips}
  setClips={setClips}
  deleteClip={deleteClip}
  getProfileForUser={getProfileForUser}
  getPostAuthorDisplayName={getPostAuthorDisplayName}
  handleFollowProfile={handleFollowProfile}
  openCheckout={openCheckout}
  addToCart={addToCart}
  cartItems={cartItems}
  setCartItems={setCartItems}
  isCartOpen={isCartOpen}
  setIsCartOpen={setIsCartOpen}
  chats={chats}
  setChats={setChats}
/>

      )}

      {/* Side Drawers & Floating Handles */}
      <FeedSideDrawers
        leftDrawerOpen={leftDrawerOpen}
        setLeftDrawerOpen={setLeftDrawerOpen}
        drawerCurrentView={drawerCurrentView}
        setDrawerCurrentView={setDrawerCurrentView}
        followingActiveTab={followingActiveTab}
        setFollowingActiveTab={setFollowingActiveTab}
        followingSearchQuery={followingSearchQuery}
        setFollowingSearchQuery={setFollowingSearchQuery}
        discoverProfiles={discoverProfiles}
        setDiscoverProfiles={setDiscoverProfiles}
        handleFollowProfile={handleFollowProfile}
        filterShowFollowedOnly={filterShowFollowedOnly}
        setFilterShowFollowedOnly={setFilterShowFollowedOnly}
        pinEntered={pinEntered}
        setPinEntered={setPinEntered}
        pinError={pinError}
        setPinError={setPinError}
        collectionTab={collectionTab}
        setCollectionTab={setCollectionTab}
        saveProfileData={saveProfileData}
        setViewingReceipt={setViewingReceipt}
        isMiguelNameOrProfile={isMiguelNameOrProfile}
        userProfile={userProfile}
        activeBand={resolvedActiveBand || activeBand}
        portalRole={portalRole}
        isEmbedded={isEmbedded}
        profileAvatarUrl={profileAvatarUrl}
        setProfileAvatarUrl={setProfileAvatarUrl}
        profileCoverUrl={profileCoverUrl}
        setProfileCoverUrl={setProfileCoverUrl}
        profileFullLegalName={profileFullLegalName}
        setProfileFullLegalName={setProfileFullLegalName}
        profileHandle={profileHandle}
        setProfileHandle={setProfileHandle}
        profileBlurb={profileBlurb}
        setProfileBlurb={setProfileBlurb}
        profileLocation={profileLocation}
        setProfileLocation={setProfileLocation}
        profileZip={profileZip}
        setProfileZip={setProfileZip}
        profileMetalArchivesUrl={profileMetalArchivesUrl}
        setProfileMetalArchivesUrl={setProfileMetalArchivesUrl}
        profileTopSongArtist={profileTopSongArtist}
        setProfileTopSongArtist={setProfileTopSongArtist}
        profileTopSongTitle={profileTopSongTitle}
        setProfileTopSongTitle={setProfileTopSongTitle}
        profileTopSongUrl={profileTopSongUrl}
        setProfileTopSongUrl={setProfileTopSongUrl}
        profileGenres={profileGenres}
        setProfileGenres={setProfileGenres}
        profileMicroGenres={profileMicroGenres}
        setProfileMicroGenres={setProfileMicroGenres}
        profileStealthMode={profileStealthMode}
        setProfileStealthMode={setProfileStealthMode}
        profileFavoriteSong={profileFavoriteSong}
        setProfileFavoriteSong={setProfileFavoriteSong}
        profileEmail={profileEmail}
        setProfileEmail={setProfileEmail}
        profilePassword={profilePassword}
        setProfilePassword={setProfilePassword}
        profilePin={profilePin}
        setProfilePin={setProfilePin}
        isPinModalOpen={isPinModalOpen}
        setIsPinModalOpen={setIsPinModalOpen}
        showMapModal={showMapModal}
        setShowMapModal={setShowMapModal}
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        showAdminPINModal={showAdminPINModal}
        setShowAdminPINModal={setShowAdminPINModal}
        showLabelEpkModal={showLabelEpkModal}
        setShowLabelEpkModal={setShowLabelEpkModal}
        showViewEpksModal={showViewEpksModal}
        setShowViewEpksModal={setShowViewEpksModal}
        showSubmitEpkModal={showSubmitEpkModal}
        setShowSubmitEpkModal={setShowSubmitEpkModal}
        setActiveTab={setActiveTab}
        triggerNotification={triggerNotification}
        getSupabase={getSupabase}
        handleLogout={handleLogout}
        rightDrawerOpen={rightDrawerOpen}
        setRightDrawerOpen={setRightDrawerOpen}
        unreadNotifsCount={unreadNotifsCount}
        notifications={notifications}
        setNotifications={setNotifications}
        notifFilter={notifFilter}
        setNotifFilter={setNotifFilter}
        markAllNotifsAsRead={markAllNotifsAsRead}
        clearAllNotifs={clearAllNotifs}
        deleteNotif={deleteNotif}
        setSelectedChatId={setSelectedChatId}
        showSceneRadio={showSceneRadio}
        setShowSceneRadio={setShowSceneRadio}
        activeTab={activeTab}
        selectedChatId={selectedChatId}
        traysHiddenOnMobile={traysHiddenOnMobile}
      />
            {/* Unified Modals Overlay */}
      <SocialModalsOverlay
        // Lightbox & Share
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        sharingPost={sharingPost}
        setSharingPost={setSharingPost}
        handleShareToTimeline={handleShareToTimeline}
        handleShareExternal={handleShareExternal}

        // Reactions
        viewingReactionsPost={viewingReactionsPost}
        setViewingReactionsPost={setViewingReactionsPost}
        reactionsActiveTab={reactionsActiveTab}
        setReactionsActiveTab={setReactionsActiveTab}
        allProfiles={allProfiles}
        userProfile={userProfile}

        // Clips Overlays
        showClipsAnalyticsModal={showClipsAnalyticsModal}
        setShowClipsAnalyticsModal={setShowClipsAnalyticsModal}
        showMyClipsModal={showMyClipsModal}
        setShowMyClipsModal={setShowMyClipsModal}
        showUploadClipModal={showUploadClipModal}
        setShowUploadClipModal={setShowUploadClipModal}
        activeClipComments={activeClipComments}
        setActiveClipComments={setActiveClipComments}
        activeClipShare={activeClipShare}
        setActiveClipShare={setActiveClipShare}
        activeClipMetrics={activeClipMetrics}
        setActiveClipMetrics={setActiveClipMetrics}
        clips={clips}
        setClips={setClips}
        deleteClip={deleteClip}
        newClipTitle={newClipTitle}
        setNewClipTitle={setNewClipTitle}
        newClipCaption={newClipCaption}
        setNewClipCaption={setNewClipCaption}
        newClipVideoUrl={newClipVideoUrl}
        setNewClipVideoUrl={setNewClipVideoUrl}
        newClipSongTitle={newClipSongTitle}
        setNewClipSongTitle={setNewClipSongTitle}
        newClipBandName={newClipBandName}
        setNewClipBandName={setNewClipBandName}
        newClipTags={newClipTags}
        setNewClipTags={setNewClipTags}
        selectedClipFile={selectedClipFile}
        setSelectedClipFile={setSelectedClipFile}
        triggerNotification={triggerNotification}
        portalRole={portalRole}

        // Stories
        showUploadStoryModal={showUploadStoryModal}
        setShowUploadStoryModal={setShowUploadStoryModal}
        newStoryImage={newStoryImage}
        setNewStoryImage={setNewStoryImage}
        newStoryVideo={newStoryVideo}
        setNewStoryVideo={setNewStoryVideo}
        newStoryMusic={newStoryMusic}
        setNewStoryMusic={setNewStoryMusic}
        newStoryCaption={newStoryCaption}
        setNewStoryCaption={setNewStoryCaption}
        newStoryTextOverlay={newStoryTextOverlay}
        setNewStoryTextOverlay={setNewStoryTextOverlay}
        newStoryTextStyle={newStoryTextStyle}
        setNewStoryTextStyle={setNewStoryTextStyle}
        newStoryTextColorHex={newStoryTextColorHex}
        setNewStoryTextColorHex={setNewStoryTextColorHex}
        newStoryTextSize={newStoryTextSize}
        setNewStoryTextSize={setNewStoryTextSize}
        newStoryTextX={newStoryTextX}
        setNewStoryTextX={setNewStoryTextX}
        newStoryTextY={newStoryTextY}
        setNewStoryTextY={setNewStoryTextY}
        newStoryBorder={newStoryBorder}
        setNewStoryBorder={setNewStoryBorder}
        newStoryStickers={newStoryStickers}
        setNewStoryStickers={setNewStoryStickers}
        selectedStorySticker={selectedStorySticker}
        setSelectedStorySticker={setSelectedStorySticker}
        newStoryStickerScale={newStoryStickerScale}
        setNewStoryStickerScale={setNewStoryStickerScale}
        newStoryStickerX={newStoryStickerX}
        setNewStoryStickerX={setNewStoryStickerX}
        newStoryStickerY={newStoryStickerY}
        setNewStoryStickerY={setNewStoryStickerY}
        setStories={setStories}

        // Companion & Escrow
        isEventModeActive={isEventModeActive}
        setIsEventModeActive={setIsEventModeActive}
        activeEventData={activeEventData}
        eventModeTab={eventModeTab}
        setEventModeTab={setEventModeTab}
        isTicketScanned={isTicketScanned}
        setIsTicketScanned={setIsTicketScanned}
        scanTime={scanTime}
        setScanTime={setScanTime}
        liveSetlists={liveSetlists}
        venueMessages={venueMessages}
        setVenueMessages={setVenueMessages}
        venueMessageInput={venueMessageInput}
        setVenueMessageInput={setVenueMessageInput}
        getSupabase={getSupabase}
        onEditShow={(gig: any) => { setEditingCommunityShow(gig); setIsCommunityShowModalOpen(true); }}
        onDeleteGig={handleDeleteUpcomingShowPermanently}
        onDeleteShow={handleDeleteUpcomingShowPermanently}
        viewingReceipt={viewingReceipt}
        setViewingReceipt={setViewingReceipt}
        handleTicketAction={handleTicketAction}

        // Cart & Stripe Checkout
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        cartItems={cartItems}
        setCartItems={setCartItems}
        setShowStripeCartCheckout={setShowStripeCartCheckout}
        showStripeCartCheckout={showStripeCartCheckout}
        bottomSheetOpen={bottomSheetOpen}
        setBottomSheetOpen={setBottomSheetOpen}
        checkoutItem={checkoutItem}
        setCheckoutItem={setCheckoutItem}

        // Album & Songs
        selectedAlbum={selectedAlbum}
        setSelectedAlbum={setSelectedAlbum}
        openCheckout={openCheckout}
        showSongModal={showSongModal}
        setShowSongModal={setShowSongModal}
        inAppSongsList={inAppSongsList}
        setAttachedSong={setAttachedSong}
        showSongShareModal={showSongShareModal}
        setShowSongShareModal={setShowSongShareModal}
        songShareTitle={songShareTitle}
        setSongShareTitle={setSongShareTitle}
        songShareArtist={songShareArtist}
        setSongShareArtist={setSongShareArtist}
        songShareAlbum={songShareAlbum}
        setSongShareAlbum={setSongShareAlbum}
        songShareSpotifyUrl={songShareSpotifyUrl}
        setSongSpotifyUrl={setSongShareSpotifyUrl}
        songShareCoverUrl={songShareCoverUrl}
        setSongShareCoverUrl={setSongShareCoverUrl}
        setSongShareSpotifyUrl={setSongShareSpotifyUrl}

        // Add Item
        showAddItemModal={showAddItemModal}
        setShowAddItemModal={setShowAddItemModal}
        itemCategory={itemCategory}
        setItemCategory={setItemCategory}
        itemTitle={itemTitle}
        setItemTitle={setItemTitle}
        itemDescription={itemDescription}
        setItemDescription={setItemDescription}
        itemPrice={itemPrice}
        setItemPrice={setItemPrice}
        itemLocation={itemLocation}
        setItemLocation={setItemLocation}
        itemImages={itemImages}
        setItemImages={setItemImages}
        handleSaveItem={handleSaveItem}

        // Map & Events Directory
        showMapModal={showMapModal}
        setShowMapModal={setShowMapModal}
        setSelectedGigOnMap={setSelectedGigOnMap}
        selectedGigOnMap={selectedGigOnMap}
        selectedCityFilter={selectedCityFilter}
        setSelectedCityFilter={setSelectedCityFilter}
        mapFilterGenre={mapFilterGenre}
        setMapFilterGenre={setMapFilterGenre}
        liveEvents={liveEvents}
        setLiveEvents={setLiveEvents}
        shows={propShows}
        setShows={propSetShows}
        onImportShowsFromTable={fetchEventsAndSetlists}
        onOpenShowCreator={() => { setEditingCommunityShow(null); setIsCommunityShowModalOpen(true); }}
        onSelectEvent={(gig) => {
          setActiveEventData(gig);
        }}
        onOpenEventPage={(gig) => {
          setActiveEventData(gig);
          setIsEventModeActive(true);
          setShowMapModal(false);
        }}

        // Poll
        showPollModal={showPollModal}
        setShowPollModal={setShowPollModal}
        pollQuestion={pollQuestion}
        setPollQuestion={setPollQuestion}
        pollOptions={pollOptions}
        setPollOptions={setPollOptions}
        pollVariant={pollVariant}
        setPollVariant={setPollVariant}
        pollIsTimed={pollIsTimed}
        setPollIsTimed={setPollIsTimed}
        pollTimerDays={pollTimerDays}
        setPollTimerDays={setPollTimerDays}
        pollTimerHours={pollTimerHours}
        setPollTimerHours={setPollTimerHours}
        handleCreatePoll={handleCreatePost}

        // Merch Drop
        showMerchDropModal={showMerchDropModal}
        setShowMerchDropModal={setShowMerchDropModal}
        merchDropName={merchDropName}
        setMerchDropName={setMerchDropName}
        merchDropPrice={merchDropPrice}
        setMerchDropPrice={setMerchDropPrice}
        merchDropThumbnail={merchDropThumbnail}
        setMerchDropThumbnail={setMerchDropThumbnail}
        merchDropImages={merchDropImages}
        setMerchDropImages={setMerchDropImages}
        merchDropCategory={merchDropCategory}
        setMerchDropCategory={setMerchDropCategory}
        merchDropDescription={merchDropDescription}
        setMerchDropDescription={setMerchDropDescription}
        merchDropVariants={merchDropVariants}
        setMerchDropVariants={setMerchDropVariants}
        merchDropStock={merchDropStock}
        setMerchDropStock={setMerchDropStock}
        merchDropIsUnlimited={merchDropIsUnlimited}
        setMerchDropIsUnlimited={setMerchDropIsUnlimited}
        merchDropAllowNegotiation={merchDropAllowNegotiation}
        setMerchDropAllowNegotiation={setMerchDropAllowNegotiation}
        merchDropIsTimed={merchDropIsTimed}
        setMerchDropIsTimed={setMerchDropIsTimed}
        merchDropTimerHours={merchDropTimerHours}
        setMerchDropTimerHours={setMerchDropTimerHours}
        merchDropTimerMinutes={merchDropTimerMinutes}
        setMerchDropTimerMinutes={setMerchDropTimerMinutes}
        handlePublishMerchDrop={() => {}}

        // DIY Event Modal
        showEventModal={showEventModal}
        setShowEventModal={setShowEventModal}
        eventTitle={eventTitle}
        setEventTitle={setEventTitle}
        eventType={eventType}
        setEventType={setEventType}
        eventDate={eventDate}
        setEventDate={setEventDate}
        eventTime={eventTime}
        setEventTime={setEventTime}
        eventLocationName={eventLocationName}
        setEventLocationName={setEventLocationName}
        eventAddress={eventAddress}
        setEventAddress={setEventAddress}
        eventIsSecret={eventIsSecret}
        setEventIsSecret={setEventIsSecret}
        eventLineup={eventLineup}
        setEventLineup={setEventLineup}
        eventFlyerUrl={eventFlyerUrl}
        setEventFlyerUrl={setEventFlyerUrl}
        eventDescription={eventDescription}
        setEventDescription={setEventDescription}
        eventCost={eventCost}
        setEventCost={setEventCost}
        eventTicketUrl={eventTicketUrl}
        setEventTicketUrl={setEventTicketUrl}

        // Report Profile
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        selectedUserProfile={selectedUserProfile}
        reportReason={reportReason}
        setReportReason={setReportReason}
        reports={reports}
        setReports={setReports}

        // EPK
        showSubmitEpkModal={showSubmitEpkModal}
        setShowSubmitEpkModal={setShowSubmitEpkModal}
        setEpkSubmissionSuccess={setEpkSubmissionSuccess}
        epkSubmissionSuccess={epkSubmissionSuccess}
        epkFormBandName={epkFormBandName}
        setEpkFormBandName={setEpkFormBandName}
        epkFormBio={epkFormBio}
        setEpkFormBio={setEpkFormBio}
        epkFormHistory={epkFormHistory}
        setEpkFormHistory={setEpkFormHistory}
        epkFormMembers={epkFormMembers}
        setEpkFormMembers={setEpkFormMembers}
        epkFormProfileLink={epkFormProfileLink}
        setEpkFormProfileLink={setEpkFormProfileLink}
        epkFormTracks={epkFormTracks}
        setEpkFormTracks={setEpkFormTracks}
        isEpkDragOver={isEpkDragOver}
        setIsEpkDragOver={setIsEpkDragOver}
        showViewEpksModal={showViewEpksModal}
        setShowViewEpksModal={setShowViewEpksModal}
        epkFilterTab={epkFilterTab}
        setEpkFilterTab={setEpkFilterTab}
        epkSubmissions={epkSubmissions}
        setEpkSubmissions={setEpkSubmissions}
        expandedEpkId={expandedEpkId}
        setExpandedEpkId={setExpandedEpkId}

        // Admin
        showAdminPINModal={showAdminPINModal}
        setShowAdminPINModal={setShowAdminPINModal}
        adminPIN={adminPIN}
        setAdminPIN={setAdminPIN}
        setIsAdminMode={setIsAdminMode}
        isAdminMode={isAdminMode}
        blacklistRecords={blacklistRecords}
        setBlacklistRecords={setBlacklistRecords}
        newBlacklistType={newBlacklistType}
        setNewBlacklistType={setNewBlacklistType}
        newBlacklistValue={newBlacklistValue}
        setNewBlacklistValue={setNewBlacklistValue}
        isBlacklistLoading={isBlacklistLoading}
        setIsBlacklistLoading={setIsBlacklistLoading}

        // Public Profile
        liveProfileStats={liveProfileStats}
        setSelectedUserProfile={handleSelectUserProfile}
        onBackProfile={handleBackProfile}
        profileHistory={profileHistory}
        setSelectedSecondaryUserProfile={setSelectedSecondaryUserProfile}
        targetProfile={targetProfile}
        setUserProfile={setUserProfile}
        profileActiveTab={profileActiveTab}
        setProfileActiveTab={setProfileActiveTab}
        triggerPictureViewer={triggerPictureViewer}
        handleFollowProfile={handleFollowProfile}
        handleToggleMutualFollow={handleToggleMutualFollow}
        setViewingFollowersOrFollowing={setViewingFollowersOrFollowing}
        openFloatingChat={openFloatingChat}
        bandJoinRequests={bandJoinRequests}
        setBandJoinRequests={setBandJoinRequests}
        setLeftDrawerOpen={setLeftDrawerOpen}
        setDrawerCurrentView={setDrawerCurrentView}
        setShopBrandFilter={setShopBrandFilter}
        setActiveTab={setActiveTab}
        profileBlurb={profileBlurb}
        setProfileBlurb={setProfileBlurb}
        saveProfileData={saveProfileData}
        labelRosterTicker={labelRosterTicker}
        profilePrimaryGenres={profilePrimaryGenres}
        profileMicroGenres={profileMicroGenres}
        profileGenres={profileGenres}
        profileTopSongArtist={profileTopSongArtist}
        setProfileTopSongArtist={setProfileTopSongArtist}
        profileTopSongTitle={profileTopSongTitle}
        setProfileTopSongTitle={setProfileTopSongTitle}
        setProfileFavoriteSong={setProfileFavoriteSong}
        setProfileTopSongUrl={setProfileTopSongUrl}
        rosterExpanded={rosterExpanded}
        setRosterExpanded={setRosterExpanded}
        collectionTab={collectionTab}
        setCollectionTab={setCollectionTab}
        myCollections={myCollections}
        setMyCollections={setMyCollections}
        collPlayerActiveId={collPlayerActiveId}
        setCollPlayerActiveId={setCollPlayerActiveId}
        collPlayerActiveTrackId={collPlayerActiveTrackId}
        setCollPlayerActiveTrackId={setCollPlayerActiveTrackId}
        collPlayerIsPlaying={collPlayerIsPlaying}
        setCollPlayerIsPlaying={setCollPlayerIsPlaying}
        setSelectedGalleryItem={setSelectedGalleryItem}
        selectedLabelBand={selectedLabelBand}
        setSelectedLabelBand={setSelectedLabelBand}
        profileActivePlaybackTrackId={profileActivePlaybackTrackId}
        setProfileActivePlaybackTrackId={setProfileActivePlaybackTrackId}
        profileIsPlaying={profileIsPlaying}
        setProfileIsPlaying={setProfileIsPlaying}
        profilePlaybackProgress={profilePlaybackProgress}
        setProfilePlaybackProgress={setProfilePlaybackProgress}
        getProfileForUser={getProfileForUser}
        normalizeLoadedProfile={normalizeLoadedProfile}
        supabase={supabase}
        setLiveProfileStats={setLiveProfileStats}

        // Followers
        viewingFollowersOrFollowing={viewingFollowersOrFollowing}
        liveFollowsLoading={liveFollowsLoading}
        liveFollowsList={liveFollowsList}

        // DM Drawer & Settings
        showConversationSettings={showConversationSettings}
        setShowConversationSettings={setShowConversationSettings}
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
        chats={chats}
        setChats={setChats}
        showInboxSettings={showInboxSettings}
        setShowInboxSettings={setShowInboxSettings}
        globalReadReceipts={globalReadReceipts}
        setGlobalReadReceipts={setGlobalReadReceipts}
        globalActiveStatus={globalActiveStatus}
        setGlobalActiveStatus={setGlobalActiveStatus}
        whoCanReachMe={whoCanReachMe}
        setWhoCanReachMe={setWhoCanReachMe}

        // Fan Pit & Cropper
        activePitWallShow={activePitWallShow}
        setActivePitWallShow={setActivePitWallShow}
        cropperOpen={cropperOpen}
        setCropperOpen={setCropperOpen}
        cropperImageSrc={cropperImageSrc}
        cropperType={cropperType}
        setProfileAvatarUrl={setProfileAvatarUrl}
        setProfileCoverUrl={setProfileCoverUrl}
        isEmbedded={isEmbedded}
        profileHandle={profileHandle}
        profileSceneRoles={profileSceneRoles}
        profileFullLegalName={profileFullLegalName}
        setFeed={setFeed}
        syncPostToSupabase={syncPostToSupabase}
      />
      {/* Floating Particle Reaction Overlay */}
      <FloatingReactionOverlay particles={particles} />

      <CreateCommunityShowModal
        isOpen={isCommunityShowModalOpen}
        onClose={() => { setIsCommunityShowModalOpen(false); setEditingCommunityShow(null); }}
        onSubmit={handleCommunityShowSubmit}
        editingShow={editingCommunityShow}
        triggerNotification={triggerNotification}
      />

      {/* Facebook-style Story Viewer Modal */}
      <StoryViewerModal
        activeStory={activeStory}
        stories={stories}
        progress={storyProgress}
        isPaused={isStoryPaused}
        setIsPaused={setIsStoryPaused}
        onClose={() => setActiveStory(null)}
        onNext={handleNextStory}
        onPrev={handlePrevStory}
        triggerNotification={triggerNotification}
        userProfile={userProfile}
      />
      </SocialThemeShell>
    </SocialRoleProvider>
  );
}
