import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Pencil, X, ArrowLeft, Edit2, AlertTriangle, Briefcase, Plus, Ticket, MapPin, Disc, Tag, Pause, Play, Search, Volume2, ChevronDown, Music, Download, PlayCircle, ShoppingCart, SkipBack, Square, SkipForward, UserCheck, UserPlus, MessageSquare, Shield, ShoppingBag, Calendar, Award, Network, Activity, Camera, ArrowUpRight, FileUp, Users, CheckCircle, Flame, Shirt, Building2 } from 'lucide-react';
import { hasRegisteredWorkspace } from '../../../types';
import { getProfileGlowInfo } from '../../../utils/profileGlow';
import { formatLocationDisplay } from '../../../constants/location';
import { useUserPresence } from '../../../lib/presence';
import { ROSTER_CATALOGS } from '../../../data/socialFeedMockData';
import { normalizeLoadedProfile, getSupabase, executeWithSchemaResilience, executeSanitizedProfileUpsert } from '../../../supabase';
import { getEmbedUrl, getCollectionsTrackDuration, extractUUID } from '../../../utils/socialFeedUtils';
import { isCommunityBandRecord } from '../../../lib/seedBandsData';
import { isMiguelNameOrProfile } from '../../social/utils/profileUtils';
import MarqueeText from '../../MarqueeText';
import BandBookingModal from '../../social/modals/BandBookingModal';
import { SonicFootprint, ListenerMetric, calculateListenerMetrics } from '../../profile/SonicFootprint';
import { TimelineTab } from '../../profile/TimelineTab';
import { ProfileMarketplaceTab } from '../../profile/ProfileMarketplaceTab';
import { GalleryTab } from '../../profile/GalleryTab';
import { CrtTvFrame } from '../../profile/CrtTvFrame';

export type { ListenerMetric };
export { calculateListenerMetrics };

export const getReleaseCoverUrl = (release: any): string | null => {
  if (!release) return null;
  const url =
    release.cover_url ||
    release.cover_image ||
    release.coverUrl ||
    release.coverImage ||
    release.image_url ||
    release.imageUrl ||
    release.artwork_url ||
    release.artworkUrl ||
    release.artwork ||
    release.cover ||
    release.thumbnail ||
    release.thumbnailUrl ||
    release.thumbnail_url ||
    release.image ||
    release.poster ||
    release.flyer ||
    null;
  if (typeof url === 'string' && url.trim().length > 0 && !url.includes('undefined') && !url.includes('null')) {
    return url.trim();
  }
  return null;
};

import { PublicProfileModalProps } from '../../social/modals/PublicProfileModal';
export const ProfileCard: React.FC<PublicProfileModalProps> = ({
  selectedUserProfile,
  setSelectedUserProfile,
  onBackProfile,
  profileHistory,
  targetProfile,
  userProfile,
  setUserProfile,
  portalRole = '',
  profileActiveTab,
  setProfileActiveTab,
  triggerPictureViewer,
  triggerNotification,
  allProfiles = [],
  handleFollowProfile,
  setViewingFollowersOrFollowing,
  openFloatingChat,
  bandJoinRequests,
  setBandJoinRequests,
  setLeftDrawerOpen,
  setDrawerCurrentView,
  openCheckout,
  setShowReportModal,
  setShowSubmitEpkModal,
  setShowAddItemModal,
  setShopBrandFilter,
  setSecondaryUserProfile,
  setActiveTab,
  profileBlurb,
  setProfileBlurb,
  saveProfileData,
  labelRosterTicker = '',
  profilePrimaryGenres = [],
  profileMicroGenres = [],
  profileGenres = [],
  profileTopSongArtist,
  setProfileTopSongArtist,
  profileTopSongTitle,
  setProfileTopSongTitle,
  setProfileFavoriteSong,
  setProfileTopSongUrl,
  rosterExpanded,
  setRosterExpanded,
  collectionTab,
  setCollectionTab,
  myCollections,
  collPlayerActiveId,
  setCollPlayerActiveId,
  collPlayerActiveTrackId,
  setCollPlayerActiveTrackId,
  collPlayerIsPlaying,
  setCollPlayerIsPlaying,
  setSelectedGalleryItem,
  selectedLabelBand,
  setSelectedLabelBand,
  profileActivePlaybackTrackId,
  setProfileActivePlaybackTrackId,
  profileIsPlaying,
  setProfileIsPlaying,
  profilePlaybackProgress,
  setProfilePlaybackProgress,
  getProfileForUser,
  supabase,
  liveProfileStats,
  setLiveProfileStats,
  feed
}) => {
  const [liveRoutingStats, setLiveRoutingStats] = React.useState<{ toursCount: number; showsCount: number }>({ toursCount: 0, showsCount: 0 });
  const [showBandBookingModal, setShowBandBookingModal] = React.useState(false);
  const [fetchedBandData, setFetchedBandData] = React.useState<any>(null);
  const [linkedBandData, setLinkedBandData] = React.useState<any>(null);
  const [fetchedProfileData, setFetchedProfileData] = React.useState<any>(null);
  const [isEditingBio, setIsEditingBio] = React.useState(false);
  const [isEditingTopSong, setIsEditingTopSong] = React.useState(false);
  const [isEditingTicker, setIsEditingTicker] = React.useState(false);
  const [tickerUpdateText, setTickerUpdateText] = React.useState<string>(() => {
    const targetId = selectedUserProfile?.id || 'guest';
    const stored = localStorage.getItem(`nexus_active_ticker_${targetId}`);
    if (stored && stored !== "NAVIGATING THE NEXUS MATRIX • STAY TUNED FOR LIVE SHOWS & RELEASES") return stored;
    const ticker = selectedUserProfile?.rosterTicker || selectedUserProfile?.update_ticker || labelRosterTicker;
    if (!ticker || ticker.includes('NAVIGATING THE NEXUS MATRIX') || ticker.includes('EXTREME SONIC') || ticker.includes('SEWER GASKET')) {
      return "No updates posted yet";
    }
    return ticker;
  });

  React.useEffect(() => {
    const targetId = selectedUserProfile?.id || 'guest';
    const stored = localStorage.getItem(`nexus_active_ticker_${targetId}`);
    const currentTicker = selectedUserProfile?.rosterTicker || selectedUserProfile?.update_ticker || labelRosterTicker;
    if (stored && stored !== "NAVIGATING THE NEXUS MATRIX • STAY TUNED FOR LIVE SHOWS & RELEASES") {
      setTickerUpdateText(stored);
    } else if (currentTicker && !currentTicker.includes('NAVIGATING THE NEXUS MATRIX') && !currentTicker.includes('EXTREME SONIC') && !currentTicker.includes('SEWER GASKET')) {
      setTickerUpdateText(currentTicker);
    } else {
      setTickerUpdateText("No updates posted yet");
    }
  }, [selectedUserProfile?.id, labelRosterTicker]);

  const handleSaveTickerUpdate = (newText: string) => {
    const cleanText = newText.slice(0, 200);
    setTickerUpdateText(cleanText);
    const targetId = selectedUserProfile?.id || userProfile?.id || 'guest';
    try {
      localStorage.setItem(`nexus_active_ticker_${targetId}`, cleanText);
    } catch(err){}
    
    setSelectedUserProfile((prev: any) => prev ? { ...prev, rosterTicker: cleanText, update_ticker: cleanText } : null);
    if (setUserProfile) {
      queueMicrotask(() => {
        setUserProfile((pPrev: any) => pPrev ? { ...pPrev, rosterTicker: cleanText, update_ticker: cleanText } : null);
      });
    }
    setIsEditingTicker(false);

    if (targetId && targetId !== 'guest') {
      const supabase = getSupabase();
      if (supabase) {
        executeSanitizedProfileUpsert(
          supabase,
          { id: targetId, update_ticker: cleanText }
        ).catch(err => console.error('[Supabase update_ticker error]:', err));
      }
    }

    if (saveProfileData) {
      saveProfileData(true);
    }
    triggerNotification?.("⚡ Live profile marquee update saved!");
  };

  const isTargetExplicitSelf = Boolean(
    selectedUserProfile?.isYou ||
    targetProfile?.isYou ||
    (selectedUserProfile?.id && userProfile?.id && String(selectedUserProfile.id) === String(userProfile.id)) ||
    (selectedUserProfile?.email && userProfile?.email && selectedUserProfile.email.toLowerCase() === userProfile.email.toLowerCase())
  );

  const isOwnerMiguel = isMiguelNameOrProfile(selectedUserProfile) || isMiguelNameOrProfile(targetProfile) || (isTargetExplicitSelf && isMiguelNameOrProfile(userProfile)) || isMiguelNameOrProfile(userProfile);

  React.useEffect(() => {
    let isMounted = true;
    async function loadProfileBandDataAndShows() {
      const base = selectedUserProfile || targetProfile;
      if (!base) return;

      if (isMounted) {
        setFetchedBandData(null);
        setLinkedBandData(null);
      }

      const targetRoleStr = (base?.role || base?.portalRole || '').toLowerCase();
      const isPersonal = !!(
        base?.isPersonal ||
        targetRoleStr === 'fan' ||
        targetRoleStr === 'industry pro' ||
        targetRoleStr === 'member' ||
        targetRoleStr === 'creative' ||
        targetRoleStr === 'promoter' ||
        targetRoleStr === 'label'
      );

      const isBand = !isPersonal && !!(
        base?.isBandProfile ||
        base?.type === 'band' ||
        targetRoleStr === 'band' ||
        targetRoleStr === 'artist'
      );

      const targetId = base.id || selectedUserProfile?.id;
      const targetName = base.band_name || base.name || base.bandName || selectedUserProfile?.name;

      // A) Fetch shows from Supabase table 'shows' to compute real Live Routing Status
      if (supabase && isBand) {
        try {
          let showsList: any[] = [];
          const validUUID = targetId && extractUUID(targetId);
          if (validUUID) {
            // Only filter by band_id
            const { data } = await supabase
              .from('shows')
              .select('*')
              .eq('band_id', validUUID);
            if (data && data.length > 0) showsList = data;
          }

          if (isMounted) {
            if (showsList.length > 0) {
              const distinctTours = new Set(
                showsList.map((s: any) => s.tour_name || s.tour_id || s.tour).filter(Boolean)
              );
              setLiveRoutingStats({
                toursCount: distinctTours.size,
                showsCount: showsList.length
              });
            } else {
              setLiveRoutingStats({ toursCount: 0, showsCount: 0 });
            }
          }
        } catch (e) {
          if (isMounted) setLiveRoutingStats({ toursCount: 0, showsCount: 0 });
        }
      } else {
        if (isMounted) setLiveRoutingStats({ toursCount: 0, showsCount: 0 });
      }

      // B) Fetch/Sync Band Data from Supabase 'bands' table
      if (supabase) {
        try {
          let record: any = null;
          const validUUID = targetId && extractUUID(targetId);
          if (validUUID) {
            const { data } = await supabase
              .from('bands')
              .select('*')
              .eq('id', validUUID)
              .maybeSingle();
            if (data) record = data;

            if (!record) {
              const { data: creatorBand } = await supabase
                .from('bands')
                .select('*')
                .eq('creator_id', validUUID)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              if (creatorBand) record = creatorBand;
            }
          }
          if (!record && targetName) {
            const { data } = await supabase
              .from('bands')
              .select('*')
              .ilike('band_name', `%${targetName}%`)
              .maybeSingle();
            if (data) record = data;
          }
          if (!record) {
            const { data: allBands } = await supabase
              .from('bands')
              .select('*')
              .limit(5);
            if (allBands && allBands.length > 0) {
              const userBand = allBands.find((b: any) => b.user_id === targetId || b.owner_id === targetId);
              if (userBand) {
                record = userBand;
              }
            }
          }

          if (isMounted && record) {
            setFetchedBandData(record);
          }
        } catch (err) {
          // Fallback silently
        }
      }

      // B2) Fetch Linked Band Data if profile has an associated band (for personal/industry pro/creative/promoter/label)
      try {
        let linkedBandRecord: any = null;
        const targetUserId = base?.id || selectedUserProfile?.id || targetProfile?.id;
        const validUUID = targetUserId && extractUUID(targetUserId);
        const targetBandId = base?.band_id || selectedUserProfile?.band_id || (base?.isYou ? userProfile?.band_id : null);
        const targetBandName = base?.band_name || base?.bandName || selectedUserProfile?.band_name || selectedUserProfile?.bandName || (base?.isYou ? (userProfile?.band_name || userProfile?.bandName) : null);

        if (supabase) {
          if (targetBandId && extractUUID(targetBandId)) {
            try {
              const { data } = await supabase.from('bands').select('*').eq('id', extractUUID(targetBandId)).maybeSingle();
              if (data) linkedBandRecord = data;
            } catch (_) {}
          }

          if (!linkedBandRecord && validUUID) {
            try {
              const { data } = await supabase.from('bands').select('*').eq('creator_id', validUUID).neq('verification_status', 'community_archive').order('created_at', { ascending: false }).limit(1).maybeSingle();
              if (data && data.verification_status !== 'community_archive' && data.band_name?.toLowerCase() !== 'dying fetus') linkedBandRecord = data;
            } catch (_) {}
          }

          if (!linkedBandRecord && validUUID) {
            try {
              const { data } = await supabase.from('bands').select('*').eq('user_id', validUUID).neq('verification_status', 'community_archive').order('created_at', { ascending: false }).limit(1).maybeSingle();
              if (data && data.verification_status !== 'community_archive' && data.band_name?.toLowerCase() !== 'dying fetus') linkedBandRecord = data;
            } catch (_) {}
          }

          if (!linkedBandRecord && validUUID) {
            try {
              const { data } = await supabase.from('bands').select('*').eq('owner_id', validUUID).neq('verification_status', 'community_archive').order('created_at', { ascending: false }).limit(1).maybeSingle();
              if (data && data.verification_status !== 'community_archive' && data.band_name?.toLowerCase() !== 'dying fetus') linkedBandRecord = data;
            } catch (_) {}
          }

          if (!linkedBandRecord && validUUID) {
            try {
              const { data } = await supabase.from('bands').select('*').eq('profile_id', validUUID).neq('verification_status', 'community_archive').order('created_at', { ascending: false }).limit(1).maybeSingle();
              if (data && data.verification_status !== 'community_archive' && data.band_name?.toLowerCase() !== 'dying fetus') linkedBandRecord = data;
            } catch (_) {}
          }

          if (!linkedBandRecord && (targetBandName || targetName)) {
            const queryName = targetBandName || targetName;
            try {
              const { data } = await supabase.from('bands').select('*').ilike('band_name', `%${queryName.trim()}%`).maybeSingle();
              if (data) linkedBandRecord = data;
            } catch (_) {}
          }
        }

        if (!linkedBandRecord && (base?.isYou || selectedUserProfile?.isYou || userProfile?.id === targetUserId) && (userProfile?.bandName || userProfile?.band_name || userProfile?.band_id)) {
          try {
            const localBandStr = localStorage.getItem('nexus_my_band_profile');
            if (localBandStr) linkedBandRecord = JSON.parse(localBandStr);
          } catch (_) {}

          if (!linkedBandRecord) {
            linkedBandRecord = {
              id: userProfile.band_id || 'my_band_id',
              band_name: userProfile.band_name || userProfile.bandName,
              name: userProfile.band_name || userProfile.bandName,
              logo_url: userProfile.avatar_url || userProfile.avatar,
              genre: userProfile.genre || 'Metal'
            };
          }
        }

        if (isMounted) {
          if (linkedBandRecord) {
            setLinkedBandData(linkedBandRecord);
          } else if (targetBandName) {
            setLinkedBandData({
              id: targetBandId || `band_fallback_${Date.now()}`,
              band_name: targetBandName,
              name: targetBandName,
              genre: 'Metal / Hardcore'
            });
          } else {
            setLinkedBandData(null);
          }
        }
      } catch (err) {
        console.warn('Could not fetch linked band data:', err);
      }

      // C) Fetch Profile from 'profiles' table for full name, console handle, location, bio
      if (supabase) {
        try {
          let profRecord: any = null;
          const targetId = base?.id || selectedUserProfile?.id || targetProfile?.id;
          const targetEmail = base?.email || selectedUserProfile?.email;
          const targetHandle = base?.console_handle || base?.handle || base?.username || selectedUserProfile?.console_handle;
          const targetName = base?.full_name || base?.name || selectedUserProfile?.name;
          const validUUID = targetId && extractUUID(targetId);

          if (validUUID) {
            const { data } = await supabase.from('profiles').select('*').eq('id', validUUID).maybeSingle();
            if (data) profRecord = data;
          }
          if (!profRecord && targetEmail) {
            const { data } = await supabase.from('profiles').select('*').ilike('email', targetEmail.trim()).maybeSingle();
            if (data) profRecord = data;
          }
          if (!profRecord && targetHandle) {
            const cleanHandle = targetHandle.replace('@', '').trim();
            const { data } = await supabase.from('profiles').select('*').ilike('console_handle', cleanHandle).maybeSingle();
            if (data) profRecord = data;
          }
          if (!profRecord && targetName) {
            const { data } = await supabase.from('profiles').select('*').or(`full_name.ilike.%${targetName.trim()}%,console_handle.ilike.%${targetName.trim()}%`).maybeSingle();
            if (data) profRecord = data;
          }

          if (isMounted && profRecord) {
            const normProf = normalizeLoadedProfile(profRecord);
            setFetchedProfileData(normProf);
            if (normProf.top_song_url && setProfileTopSongUrl) {
              if (base?.isYou || selectedUserProfile?.isYou) {
                setProfileTopSongUrl(normProf.top_song_url);
              }
            }
            if (normProf.bio && setProfileBlurb) {
              if (base?.isYou || selectedUserProfile?.isYou) {
                setProfileBlurb(normProf.bio);
              }
            }
          }
        } catch (err) {
          // Fallback silently
        }
      }
    }

    loadProfileBandDataAndShows();
    return () => { isMounted = false; };
  }, [selectedUserProfile?.id, selectedUserProfile?.email, selectedUserProfile?.console_handle, selectedUserProfile?.name, targetProfile?.id, targetProfile?.name, supabase]);

  if (!selectedUserProfile) return null;

  const baseTarget = selectedUserProfile || targetProfile;

  const targetRole = (baseTarget?.role || baseTarget?.portalRole || baseTarget?.account_type || '').toLowerCase();

  const isExplicitPersonal = !!(
    baseTarget?.isPersonal ||
    baseTarget?.type === 'user' ||
    baseTarget?.isBandProfile === false ||
    targetRole === 'fan' ||
    targetRole.includes('industry') ||
    targetRole === 'member' ||
    targetRole === 'creative' ||
    targetRole === 'promoter' ||
    targetRole === 'label'
  );

  const isArtistOrBand = !isExplicitPersonal && !!(
    baseTarget?.isBandProfile ||
    baseTarget?.type === 'band' ||
    targetRole === 'artist' ||
    targetRole === 'band'
  );

  const isCurrentUserBand = isArtistOrBand && !!(
    baseTarget?.isYou ||
    baseTarget?.id === userProfile?.id ||
    baseTarget?.name === userProfile?.bandName
  );

  let localSavedBand: any = null;
  if (isCurrentUserBand) {
    try {
      const localStr = localStorage.getItem('nexus_my_band_profile');
      if (localStr) localSavedBand = JSON.parse(localStr);
    } catch (e) {}
  }

  const bData = isCurrentUserBand ? (fetchedBandData || localSavedBand) : null;

  const effTarget = {
    ...baseTarget,
    ...(fetchedProfileData ? {
      full_name: fetchedProfileData.full_name || fetchedProfileData.name || baseTarget.full_name || baseTarget.name,
      name: fetchedProfileData.full_name || fetchedProfileData.name || baseTarget.name,
      console_handle: (baseTarget?.isYou || selectedUserProfile?.isYou)
        ? '@bdmCEO'
        : (fetchedProfileData.console_handle || fetchedProfileData.username || fetchedProfileData.handle || baseTarget.console_handle),
      handle: (baseTarget?.isYou || selectedUserProfile?.isYou)
        ? '@bdmCEO'
        : (fetchedProfileData.console_handle || fetchedProfileData.username || fetchedProfileData.handle || baseTarget.handle),
      city: fetchedProfileData.city || baseTarget.city,
      state_province: fetchedProfileData.state_province || baseTarget.state_province,
      country: fetchedProfileData.country || baseTarget.country,
      registered_workspaces: fetchedProfileData.registered_workspaces || baseTarget.registered_workspaces,
      allowed_workspaces: fetchedProfileData.allowed_workspaces || baseTarget.allowed_workspaces,
      homebase: fetchedProfileData.homebase || baseTarget.homebase,
      location: formatLocationDisplay(fetchedProfileData) || baseTarget.location,
      bio: (fetchedProfileData.bio !== undefined && fetchedProfileData.bio !== null && fetchedProfileData.bio !== '')
        ? fetchedProfileData.bio
        : ((baseTarget?.isYou || selectedUserProfile?.isYou || (userProfile?.id && (baseTarget?.id === userProfile.id || selectedUserProfile?.id === userProfile.id)))
            ? (profileBlurb || (userProfile as any)?.bio || baseTarget?.bio || '')
            : (baseTarget?.bio || '')),
      avatar: fetchedProfileData.avatar_url || fetchedProfileData.avatar || baseTarget.avatar,
      avatar_url: fetchedProfileData.avatar_url || fetchedProfileData.avatar || baseTarget.avatar_url,
      top_song_url: fetchedProfileData.top_song_url !== undefined && fetchedProfileData.top_song_url !== null && fetchedProfileData.top_song_url !== '' ? fetchedProfileData.top_song_url : baseTarget?.top_song_url,
      top_song_title: fetchedProfileData.top_song_title || fetchedProfileData.favoriteSong || baseTarget?.top_song_title || baseTarget?.favoriteSong,
      favoriteSong: fetchedProfileData.favoriteSong || fetchedProfileData.top_song_title || baseTarget?.favoriteSong || baseTarget?.top_song_title,
      top_song_artist: fetchedProfileData.top_song_artist || baseTarget?.top_song_artist,
      featured_youtube_url: fetchedProfileData.featured_youtube_url || fetchedProfileData.top_song_url || baseTarget?.featured_youtube_url,
    } : {}),
    ...(bData ? {
      name: bData.band_name || bData.name || baseTarget.name,
      band_name: bData.band_name || bData.name || baseTarget.band_name,
      avatar: bData.logo_url || bData.avatar_url || baseTarget.avatar || baseTarget.avatar_url,
      avatar_url: bData.logo_url || bData.avatar_url || baseTarget.avatar_url || baseTarget.avatar,
      banner: bData.cover_url || bData.banner_url || baseTarget.banner || baseTarget.banner_url,
      banner_url: bData.cover_url || bData.banner_url || baseTarget.banner_url || baseTarget.banner,
      cover_url: bData.cover_url || baseTarget.cover_url,
      logo_url: bData.logo_url || baseTarget.logo_url,
      city: bData.city || baseTarget.city,
      state_province: bData.state_province || baseTarget.state_province,
      country: bData.country || baseTarget.country,
      homebase: bData.homebase || formatLocationDisplay(bData) || baseTarget.homebase,
      bio: bData.bio || baseTarget.bio,
      custom_slug: isArtistOrBand ? (bData.custom_slug || baseTarget.custom_slug) : (fetchedProfileData?.custom_slug || baseTarget.custom_slug),
      console_handle: (baseTarget?.isYou || selectedUserProfile?.isYou)
        ? '@bdmCEO'
        : (isArtistOrBand && bData.custom_slug ? `@${bData.custom_slug.replace('@', '')}` : (baseTarget.console_handle || baseTarget.handle || '@bdmCEO')),
      genre: bData.genre || baseTarget.genre,
      genre_tags: bData.genre_tags || (bData.genre ? [bData.genre] : baseTarget.genre_tags),
      lineup: bData.lineup || baseTarget.lineup,
      streaming_url: bData.streaming_url || baseTarget.streaming_url,
      featured_youtube_url: bData.featured_youtube_url || baseTarget.featured_youtube_url,
      metal_archives_url: bData.metal_archives_url || baseTarget.metal_archives_url,
      booking_email: bData.booking_email || baseTarget.booking_email,
      booking_phone: bData.booking_phone || baseTarget.booking_phone,
    } : {
      name: baseTarget?.name || baseTarget?.legalName || baseTarget?.full_name || 'User',
      console_handle: (baseTarget?.isYou || selectedUserProfile?.isYou)
        ? '@bdmCEO'
        : (baseTarget?.console_handle || baseTarget?.handle || (
            targetRole === 'industry_pro' 
              ? (userProfile?.console_handle || userProfile?.handle || 'pro_user')
              : 'user'
          ))
    })
  };

  const prof = effTarget;
  const userPresence = useUserPresence(effTarget?.id || effTarget?.email || effTarget?.handle || effTarget?.name || selectedUserProfile?.id || selectedUserProfile?.email || selectedUserProfile?.name);
  const isOnline = selectedUserProfile?.isYou || userPresence?.isOnline || userPresence?.formatted?.statusType === 'online';
  const isRecentlyActive = userPresence?.formatted?.isRecentlyActive || userPresence?.formatted?.statusType === 'recent';
  const workspaces = prof?.registered_workspaces || prof?.allowed_workspaces || prof?.workspaces || (prof?.isYou || prof?.id === userProfile?.id ? userProfile?.registered_workspaces || userProfile?.allowed_workspaces : []) || [];
  const isPro = prof?.is_pro === true;
  const r = (prof?.portalRole || prof?.role || prof?.account_type || targetRole || '').toLowerCase();
  const isBandProfile = !!(prof?.isBandProfile || prof?.type === 'band' || ((r.includes('artist') || r.includes('band')) && !prof?.isPersonal && prof?.type !== 'user' && !r.includes('industry') && !r.includes('creative') && !r.includes('pro')));

  const isProAccount = !!(
    prof?.account_type === 'industry pro' ||
    prof?.account_type === 'industry_pro' ||
    prof?.account_type === 'pro' ||
    prof?.active_workspace === 'industry_pro' ||
    isPro ||
    r.includes('industry') ||
    r.includes('pro') ||
    r.includes('creative') ||
    r.includes('promoter') ||
    r.includes('label') ||
    (Array.isArray(workspaces) && workspaces.some((w: any) => ['industry_pro', 'industry pro', 'pro', 'creative', 'promoter', 'label', 'band'].includes(typeof w === 'string' ? w : w?.type))) ||
    (Array.isArray(selectedUserProfile?.registered_workspaces) && selectedUserProfile.registered_workspaces.some((w: any) => ['industry_pro', 'industry pro', 'pro', 'creative', 'promoter', 'label', 'band'].includes(typeof w === 'string' ? w : w?.type))) ||
    (userProfile?.id === effTarget?.id || effTarget?.isYou)
  );
  
  return (
    <>
      <AnimatePresence>
        {selectedUserProfile && (
        <motion.div
          key="public-profile-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] p-4 pt-12 pb-24 bg-black/85 backdrop-blur-md overflow-y-auto flex flex-col items-center gap-6 xl:flex-row xl:items-start xl:justify-center xl:p-12"
          onClick={() => setSelectedUserProfile(null)}
        >
          <motion.div
            key="public-profile-modal-card"
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-[#0b0c0e] rounded-2xl overflow-hidden shrink-0 transition-all border"
            style={getProfileGlowInfo(effTarget).cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover Banner */}
            <div className="h-48 w-full bg-gradient-to-r from-rose-950/60 via-zinc-900 to-purple-950/60 relative overflow-hidden flex items-center justify-center group">
              {(effTarget.banner_url || effTarget.cover_url || effTarget.banner) ? (
                <img 
                  src={effTarget.banner_url || effTarget.cover_url || effTarget.banner} 
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                  alt="Cover Banner" 
                  onClick={(e) => {
                    e.stopPropagation();
                    const bannerUrl = effTarget.banner_url || effTarget.cover_url || effTarget.banner;
                    triggerPictureViewer?.({
                      photoId: `banner_${effTarget.id || selectedUserProfile.id || 'banner'}`,
                      profileId: effTarget.id || selectedUserProfile.id,
                      username: selectedUserProfile.name || 'User',
                      imageUrl: bannerUrl,
                      title: 'Profile Cover Banner',
                      caption: `Cover banner image of @${selectedUserProfile.name}`
                    });
                  }}
                />
              ) : (
                <>
                  <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] ${(selectedUserProfile?.role || '').toLowerCase().includes('label') ? 'from-orange-900/20' : 'from-rose-900/10'} via-transparent to-transparent`} />
                  <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                </>
              )}
              
              {selectedUserProfile.isYou && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => {
                      setSelectedUserProfile(null);
                      setLeftDrawerOpen?.(true);
                      setDrawerCurrentView?.('profile');
                    }} 
                    className="px-3 py-1.5 bg-black/80 hover:bg-black text-white text-[10px] font-bold uppercase font-mono tracking-widest rounded border border-zinc-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Cover Image
                  </button>
                </div>
              )}

              {/* Top Left: Back Button to previous profile card */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBackProfile) {
                    onBackProfile();
                  } else {
                    setSelectedUserProfile(null);
                  }
                }}
                className="absolute top-4 left-4 bg-black/60 hover:bg-black/90 text-white rounded-full p-1.5 transition-all border border-zinc-800 hover:border-zinc-600 hover:scale-105 z-10 flex items-center justify-center group shadow-md"
                title="Go back to previous profile card"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserProfile(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white rounded-full p-1.5 transition-all border border-zinc-800 z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Body */}
            <div className="px-5 pb-6 pt-2 relative transform-gpu isolate">
              {selectedUserProfile.isYou && (
                <span className="absolute top-2 right-5 text-[10px] uppercase tracking-widest font-mono text-rose-500 font-bold bg-rose-500/5 px-2.5 py-1 rounded border border-rose-950/40 shadow-[0_0_10px_rgba(244,63,94,0.05)] z-20">
                  Your Profile
                </span>
              )}
              {/* Avatar section */}
              <div className="flex flex-col items-start mb-2 relative z-10 transform-gpu isolate">
                <div className="relative group/avatar -mt-14 flex flex-col items-start">
                  <div 
                    className="relative p-[3px] rounded-full mb-2 cursor-pointer transition-transform duration-200 hover:scale-105"
                    style={{
                      backgroundColor: getProfileGlowInfo(effTarget).color,
                      boxShadow: `0 0 20px ${getProfileGlowInfo(effTarget).color}88, 0 0 36px ${getProfileGlowInfo(effTarget).color}33`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const avatarImg = selectedUserProfile.avatar || effTarget.avatar_url;
                      triggerPictureViewer?.({
                        photoId: `avatar_${effTarget.id || selectedUserProfile.id || 'avatar'}`,
                        profileId: effTarget.id || selectedUserProfile.id,
                        username: selectedUserProfile.name || 'User',
                        avatarUrl: typeof avatarImg === 'string' ? avatarImg : undefined,
                        imageUrl: typeof avatarImg === 'string' ? avatarImg : undefined,
                        title: 'Profile Avatar Picture',
                        caption: `Profile avatar picture of @${selectedUserProfile.name}`
                      });
                    }}
                  >
                    <div 
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-950 flex items-center justify-center text-3xl font-black text-white shrink-0 overflow-hidden border-2 relative shadow-2xl"
                      style={{
                        borderColor: '#09090b'
                      }}
                    >
                      {selectedUserProfile.avatar && (selectedUserProfile.avatar.startsWith('http') || selectedUserProfile.avatar.startsWith('data:image') || selectedUserProfile.avatar.startsWith('/')) ? (
                        <img src={selectedUserProfile.avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="font-bold">{selectedUserProfile.avatar || (effTarget.name || 'P').slice(0, 2).toUpperCase()}</span>
                      )}
                      
                      {selectedUserProfile.isYou && (
                        <div 
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserProfile(null);
                            setLeftDrawerOpen?.(true);
                            setDrawerCurrentView?.('profile');
                          }}
                        >
                          <Edit2 className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Live Online Status Indicator */}
                    <div 
                      className="absolute bottom-1 right-1 z-30 flex items-center justify-center pointer-events-none"
                      title={selectedUserProfile.isYou ? "Online (You)" : isOnline ? "Online Now" : isRecentlyActive ? "Recently Active" : "Offline"}
                    >
                      <span className="relative flex h-4 w-4 sm:h-4.5 sm:w-4.5">
                        {isOnline && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        )}
                        <span className={`relative inline-flex rounded-full h-4 w-4 sm:h-4.5 sm:w-4.5 border-2 border-zinc-950 ${
                          isOnline
                            ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.95)] ring-1 ring-emerald-400/60'
                            : isRecentlyActive
                            ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] ring-1 ring-amber-400/50'
                            : 'bg-zinc-600 shadow-[0_0_6px_rgba(0,0,0,0.6)]'
                        }`} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Identity: Band Name, Handle, Location right under avatar */}
                <div className="w-full mt-1">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight font-display flex items-center gap-1.5">
                    {effTarget.full_name || effTarget.name || effTarget.legalName || effTarget.band_name || (selectedUserProfile as any)?.full_name || selectedUserProfile.name || 'User'}
                    {selectedUserProfile.isYou && <Shield className={`w-4 h-4 ${(selectedUserProfile?.role || '').toLowerCase().includes('label') ? 'text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]'}`} />}
                  </h2>

                  <div className="text-xs font-mono text-[#39ff14] font-bold mt-0.5">
                    <span className="text-green-400 font-mono text-sm">
                      {effTarget?.console_handle 
                        ? `@${effTarget.console_handle.replace('@', '')}` 
                        : effTarget?.handle 
                        ? `@${effTarget.handle.replace('@', '')}` 
                        : '@user'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className={`w-3.5 h-3.5 ${(selectedUserProfile?.role || '').toLowerCase().includes('label') ? 'text-orange-500' : 'text-purple-500'}`} /> 
                      {formatLocationDisplay(effTarget)}
                    </span>
                  </div>

                  {/* Genres / Genre Tags & Label Name (Bands only) */}
                  {(() => {
                    const prof = effTarget;
                    const r = (prof?.portalRole || prof?.role || prof?.account_type || '').toLowerCase();
                    const isBandProfile = !!(prof?.isBandProfile || prof?.type === 'band' || ((r.includes('artist') || r.includes('band')) && !prof?.isPersonal && prof?.type !== 'user' && !r.includes('industry') && !r.includes('creative') && !r.includes('pro')));

                    if (!isBandProfile) return null;

                    let rawList: string[] = [];

                    const micro = prof?.micro_genres || prof?.profileMicroGenres;
                    if (Array.isArray(micro) && micro.length > 0) {
                      rawList.push(...micro);
                    } else if (typeof micro === 'string' && micro.trim()) {
                      rawList.push(...micro.split(/[\/,]/).map((s: string) => s.trim()).filter(Boolean));
                    }

                    const tags = prof?.genre_tags || prof?.genres;
                    if (Array.isArray(tags) && tags.length > 0) {
                      rawList.push(...tags);
                    } else if (typeof tags === 'string' && tags.trim()) {
                      rawList.push(...tags.split(/[\/,]/).map((s: string) => s.trim()).filter(Boolean));
                    }

                    if (rawList.length === 0 && prof?.genre) {
                      if (typeof prof.genre === 'string') {
                        rawList.push(...prof.genre.split(/[\/,]/).map((s: string) => s.trim()).filter(Boolean));
                      } else if (Array.isArray(prof.genre)) {
                        rawList.push(...prof.genre);
                      }
                    }

                    const genresList = Array.from(new Set(rawList.filter(Boolean))).slice(0, 4);

                    const labelName = 
                      prof?.record_label || 
                      prof?.label_name || 
                      prof?.labelName || 
                      prof?.label || 
                      selectedUserProfile?.record_label || 
                      selectedUserProfile?.label_name || 
                      selectedUserProfile?.labelName || 
                      selectedUserProfile?.label;

                    if (genresList.length === 0 && (!labelName || typeof labelName !== 'string' || !labelName.trim())) return null;

                    return (
                      <div className="mt-2.5 mb-1 space-y-1">
                        {genresList.length > 0 && (
                          <div className="flex items-center text-zinc-400 text-xs">
                            <Music className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-emerald-500" />
                            <div className="truncate font-mono text-[11px] text-zinc-300 font-bold">
                              {genresList.join(' • ')}
                            </div>
                          </div>
                        )}

                        {labelName && typeof labelName === 'string' && labelName.trim() && (
                          <div className="flex items-center text-zinc-400 text-xs">
                            <Building2 className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-violet-400" />
                            <span className="font-mono text-[11px] text-violet-300 font-bold truncate">
                              Label: {labelName.trim()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Action Buttons Grid: Follow, Message, Join Team (conditional), Storefront (conditional) */}
                  {(() => {
                    const isYou = Boolean(selectedUserProfile?.isYou || effTarget?.isYou);
                    const r = (effTarget?.portalRole || effTarget?.role || effTarget?.account_type || selectedUserProfile?.role || selectedUserProfile?.portalRole || selectedUserProfile?.account_type || '').toLowerCase();
                    const isPersonalOrFan = effTarget?.isPersonal === true || 
                      selectedUserProfile?.isPersonal === true || 
                      effTarget?.type === 'user' || 
                      selectedUserProfile?.type === 'user' || 
                      r === 'fan' || 
                      r.includes('fan listener') || 
                      r.includes('industry pro') || 
                      r === 'industry' || 
                      r === 'listener';

                    const showJoinTeam = !isPersonalOrFan && (
                      effTarget?.isBandProfile || 
                      effTarget?.type === 'band' || 
                      r.includes('band') || 
                      r.includes('artist') || 
                      r.includes('creative') || 
                      r.includes('label') || 
                      r.includes('promoter')
                    );

                    const showStorefront = !isPersonalOrFan && (
                      effTarget?.isBandProfile || 
                      effTarget?.type === 'band' || 
                      r.includes('band') || 
                      r.includes('artist') || 
                      r.includes('creative') || 
                      r.includes('label') || 
                      r.includes('promoter') || 
                      effTarget?.hasStorefront === true || 
                      effTarget?.has_storefront === true
                    );

                    return (
                      <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                        {/* 1. Follow Button */}
                        <button
                          onClick={async () => {
                            if (isYou) {
                              triggerNotification?.("Profile Preview: Follow button is active for your audience.");
                              return;
                            }
                            const nextFollowed = !selectedUserProfile?.isFollowed;
                            const diff = nextFollowed ? 1 : -1;
                            setSelectedUserProfile((prev: any) => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                isFollowed: nextFollowed,
                                followersCount: Math.max(0, (prev.followersCount ?? prev.followers ?? 0) + diff),
                                followers: Math.max(0, (prev.followersCount ?? prev.followers ?? 0) + diff)
                              };
                            });
                            if (setLiveProfileStats) {
                              setLiveProfileStats((prev: any) => prev ? {
                                ...prev,
                                followers: Math.max(0, (prev.followers || 0) + diff),
                                isFollowedByMe: nextFollowed
                              } : {
                                followers: Math.max(0, diff),
                                following: 0,
                                shares: 0,
                                isFollowedByMe: nextFollowed
                              });
                            }
                            if (handleFollowProfile) {
                              const targetToFollow = {
                                ...selectedUserProfile,
                                id: selectedUserProfile?.raw_id || selectedUserProfile?.id,
                                name: effTarget?.name || selectedUserProfile?.name || selectedUserProfile?.promoter_name,
                                role: 'Promoter',
                                type: 'promoter'
                              };
                              await handleFollowProfile(targetToFollow, nextFollowed ? 'follow' : 'unfollow');
                            }
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors uppercase font-mono cursor-pointer ${
                            selectedUserProfile?.isFollowed 
                              ? 'bg-zinc-900 border border-purple-500/30 text-purple-400 hover:bg-zinc-800' 
                              : 'bg-rose-600 text-white hover:bg-rose-500 shadow-md'
                          }`}
                        >
                          {selectedUserProfile?.isFollowed ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Followed
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" /> Follow
                            </>
                          )}
                        </button>

                        {/* 2. Message Button */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();

                            if (isYou) {
                              triggerNotification?.("Profile Preview: Direct Message button is active for visitors.");
                              return;
                            }

                            let targetId = effTarget?.id || (typeof targetProfile === 'string' ? targetProfile : null);

                            if (targetId && !targetId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                              const realProfile = allProfiles.find(p => p.email?.toLowerCase().trim() === targetId?.toLowerCase().trim());
                              if (realProfile?.id && realProfile.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                                targetId = realProfile.id;
                              }
                            }

                            const targetName = effTarget?.full_name || effTarget?.name || effTarget?.console_handle || effTarget?.username || 'User';

                            if (!targetId) {
                              targetId = effTarget?.name || 'user';
                            }

                            window.dispatchEvent(
                              new CustomEvent('nexus_open_chat', {
                                detail: {
                                  profile_id: targetId,
                                  name: targetName,
                                  username: targetName,
                                  avatar_url: effTarget?.avatar || effTarget?.avatar_url || null,
                                },
                              })
                            );
                            openFloatingChat?.(targetId, effTarget);
                          }}
                          className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors uppercase font-mono cursor-pointer"
                          title="Secure Direct Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Message
                        </button>

                        {/* 3. Join Team Button */}
                        {showJoinTeam && (() => {
                          const isPending = bandJoinRequests?.some((r: any) => r.band_name === selectedUserProfile.name && r.user_email === userProfile?.email && r.status === 'pending');
                          if (isPending) {
                            return (
                              <button className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-700 text-zinc-500 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 uppercase font-mono cursor-not-allowed">
                                <UserPlus className="w-3.5 h-3.5" /> Pending
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={() => {
                                const newReq = {
                                  id: `join_req_${Date.now()}`,
                                  band_id: 'unknown_band_id',
                                  band_name: selectedUserProfile.name,
                                  user_id: userProfile?.id || `user_${Date.now()}`,
                                  user_name: userProfile?.name || 'Unknown User',
                                  user_email: userProfile?.email || 'unknown@example.com',
                                  role_requested: userProfile?.role || 'Crew',
                                  status: 'pending',
                                  created_at: new Date().toISOString()
                                };
                                if (setBandJoinRequests) {
                                  queueMicrotask(() => { setBandJoinRequests((prev: any) => [...(prev || []), newReq]); });
                                  triggerNotification?.(`✉️ Sent request to join ${selectedUserProfile.name}!`);
                                }
                              }}
                              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-colors uppercase font-mono shadow-md"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Join Team
                            </button>
                          );
                        })()}

                        {/* 4. Storefront Button */}
                        {showStorefront && (
                          <button
                            onClick={() => {
                              if (setShopBrandFilter) setShopBrandFilter(effTarget.name || selectedUserProfile.name);
                              setProfileActiveTab('shop');
                            }}
                            className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-colors uppercase font-mono shadow-md"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Storefront
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

                {/* Dynamic Workspace / Pro Badges */}
                {(() => {
                  const prof = effTarget;
                  const workspaces = prof?.registered_workspaces || [];
                  const isPro = prof?.is_pro === true;
                  const badgesToRender: Array<{ label: string; classes: string }> = [];

                  const r = (prof?.portalRole || prof?.role || prof?.account_type || '').toLowerCase();
                  const isBandProfile = !!(prof?.isBandProfile || prof?.type === 'band' || ((r.includes('artist') || r.includes('band')) && !prof?.isPersonal && prof?.type !== 'user' && !r.includes('industry') && !r.includes('creative') && !r.includes('pro')));

                  if (!isBandProfile) {
                    if (isProAccount) {
                      badgesToRender.push({
                        label: '⚡ INDUSTRY PRO',
                        classes: 'bg-purple-950/85 border border-purple-500/60 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                      });
                    } else {
                      badgesToRender.push({
                        label: '🤘 FAN SUPPORTER',
                        classes: 'bg-emerald-950/85 border border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      });
                    }
                  }

                  const isMiguelProfile = !selectedUserProfile.isBandProfile && selectedUserProfile.type !== 'band' && !!(
                    selectedUserProfile.name?.toLowerCase().includes('miguel') ||
                    selectedUserProfile.name?.toLowerCase().includes('goregrinder') ||
                    selectedUserProfile.email?.toLowerCase().includes('goregrindsickness')
                  );

                  if (isMiguelProfile) {
                    badgesToRender.push({
                      label: '👑 Founder',
                      classes: 'bg-rose-950/85 border border-rose-500 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                    });
                    badgesToRender.push({
                      label: '🌀 Nexus Overlord',
                      classes: 'bg-amber-950/85 border border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    });
                  }

                  if (workspaces.includes('promoter')) {
                    badgesToRender.push({
                      label: '🏟️ Promoter',
                      classes: 'bg-yellow-950/80 border border-yellow-500 text-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    });
                  }
                  if (workspaces.includes('label')) {
                    badgesToRender.push({
                      label: '💿 Record Label',
                      classes: 'bg-orange-950/80 border border-orange-500 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.2)]'
                    });
                  }
                  if (workspaces.includes('creative')) {
                    badgesToRender.push({
                      label: '🎨 Creative',
                      classes: 'bg-fuchsia-950/80 border border-fuchsia-500 text-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.2)]'
                    });
                  }

                  const uniqueBadges = Array.from(new Map(badgesToRender.map(b => [b.label, b])).values());
                  if (uniqueBadges.length === 0) return null;

                  return (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {uniqueBadges.map((b, idx) => (
                        <span 
                          key={`promoter-badge-${b.label || ''}-${idx}`} 
                          className={`inline-flex items-center gap-1 text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider ${b.classes}`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  );
                })()}

                {/* ASSOCIATED ENTITIES (2x2 GRID) */}
                {(() => {
                  const isTargetSelf = Boolean(
                    effTarget?.isYou ||
                    (userProfile?.id && effTarget?.id && String(effTarget.id) === String(userProfile.id))
                  );
                  const registeredWorkspaces = isTargetSelf
                    ? (userProfile?.registered_workspaces || effTarget?.registered_workspaces || userProfile?.allowed_workspaces || effTarget?.allowed_workspaces || effTarget?.workspaces || [])
                    : (effTarget?.registered_workspaces || effTarget?.allowed_workspaces || effTarget?.workspaces || []);

                  const hasWorkspaceType = (type: string) => {
                    if (!registeredWorkspaces || !Array.isArray(registeredWorkspaces)) return false;
                    const targetType = type.toLowerCase();
                    return registeredWorkspaces.some((w: any) => {
                      if (!w) return false;
                      if (typeof w === 'string') return w.toLowerCase() === targetType;
                      if (typeof w === 'object' && w.type) return w.type.toLowerCase() === targetType;
                      return false;
                    });
                  };
                  
                  const bandWsRef = Array.isArray(registeredWorkspaces) 
                    ? registeredWorkspaces.find((w: any) => (typeof w === 'object' && w?.type?.toLowerCase() === 'band') || (typeof w === 'string' && w.toLowerCase() === 'band')) 
                    : null;
                  const promoterWsRef = Array.isArray(registeredWorkspaces) 
                    ? registeredWorkspaces.find((w: any) => (typeof w === 'object' && w?.type?.toLowerCase() === 'promoter') || (typeof w === 'string' && w.toLowerCase() === 'promoter')) 
                    : null;
                  const creativeWsRef = Array.isArray(registeredWorkspaces) 
                    ? registeredWorkspaces.find((w: any) => (typeof w === 'object' && w?.type?.toLowerCase() === 'creative') || (typeof w === 'string' && w.toLowerCase() === 'creative')) 
                    : null;
                  const labelWsRef = Array.isArray(registeredWorkspaces) 
                    ? registeredWorkspaces.find((w: any) => (typeof w === 'object' && w?.type?.toLowerCase() === 'label') || (typeof w === 'string' && w.toLowerCase() === 'label')) 
                    : null;

                  const entities: Array<{
                    key: string;
                    icon: string;
                    badgeClass: string;
                    borderHoverClass: string;
                    typeLabel: string;
                    name: string;
                    logo: string;
                    subtitle: string;
                    onClick: () => void;
                  }> = [];

                  // 1. BAND / ARTIST WORKSPACE
                  const isCurrentProfileBand = Boolean(
                    effTarget?.type === 'band' || 
                    effTarget?.isBandProfile || 
                    effTarget?.account_type === 'band' ||
                    (targetRole && targetRole.toLowerCase() === 'band')
                  );

                  const isEffTargetMiguel = isMiguelNameOrProfile(effTarget) || (isTargetSelf && isMiguelNameOrProfile(userProfile));
                  const targetBandId = isEffTargetMiguel ? 'cbddb810-259b-4230-9968-3d402dfdb872' : (effTarget?.band_id || (isTargetSelf ? userProfile?.band_id : null));
                  let matchingBandProfile: any = null;

                  if (isEffTargetMiguel) {
                    matchingBandProfile = allProfiles.find((p: any) => {
                      const pId = String(p.id || '').toLowerCase().trim();
                      const rawId = String(p.raw_id || p.band_id || '').toLowerCase().trim();
                      const cleanName = (p.name || p.band_name || '').toLowerCase().trim();
                      return pId === 'cbddb810-259b-4230-9968-3d402dfdb872' || pId === 'real-b-cbddb810-259b-4230-9968-3d402dfdb872' || rawId === 'cbddb810-259b-4230-9968-3d402dfdb872' || cleanName === 'virulent excision';
                    });
                  } else if (targetBandId) {
                    matchingBandProfile = allProfiles.find((p: any) => {
                      if (isCommunityBandRecord(p.id) || isCommunityBandRecord(p.name) || isCommunityBandRecord(p.band_name) || (p.name && p.name.toLowerCase().includes('necroticgorebeast'))) return false;
                      const isBandType = p.type === 'band' || p.isBandProfile || p.category === 'bands' || (p.role && p.role.toLowerCase() === 'band') || (p.portalRole && p.portalRole.toLowerCase() === 'band');
                      if (!isBandType) return false;
                      return p.id === targetBandId || p.band_id === targetBandId || p.id === `real-b-${targetBandId}`;
                    });
                  } else if (typeof bandWsRef === 'object' && bandWsRef?.workspace_id) {
                     matchingBandProfile = allProfiles.find((p: any) => (p.type === 'band' || p.isBandProfile || p.category === 'bands' || p.role === 'Band') && (p.id === bandWsRef.workspace_id || p.id === `real-b-${bandWsRef.workspace_id}`));
                  } else if (typeof bandWsRef === 'object' && bandWsRef?.name) {
                     matchingBandProfile = allProfiles.find((p: any) => (p.type === 'band' || p.isBandProfile || p.category === 'bands' || p.role === 'Band') && p.name?.toLowerCase() === bandWsRef.name.toLowerCase());
                  } else if (effTarget?.band_name || (isTargetSelf && userProfile?.band_name)) {
                     const bName = effTarget?.band_name || (isTargetSelf ? userProfile?.band_name : '');
                     if (bName && !isCommunityBandRecord(bName)) {
                       matchingBandProfile = allProfiles.find((p: any) => {
                         const isBandType = p.type === 'band' || p.isBandProfile || p.category === 'bands' || (p.role && p.role.toLowerCase() === 'band') || (p.portalRole && p.portalRole.toLowerCase() === 'band');
                         if (!isBandType) return false;
                         if (isCommunityBandRecord(p.id) || isCommunityBandRecord(p.name) || isCommunityBandRecord(p.band_name)) return false;
                         return (p.name?.toLowerCase() === bName.toLowerCase() || p.band_name?.toLowerCase() === bName.toLowerCase());
                       });
                     }
                  }

                  const lbd = matchingBandProfile || (
                    isTargetSelf && (userProfile?.band_name || userProfile?.band_id) ? (
                      typeof fetchedBandData !== 'undefined' && fetchedBandData ? fetchedBandData : null
                    ) : null
                  );

                  let rawBandName = isEffTargetMiguel
                    ? 'Virulent Excision'
                    : (lbd?.band_name || lbd?.name || effTarget.band_name || effTarget.bandName || (typeof bandWsRef === 'object' && bandWsRef?.name ? bandWsRef.name : null) || (isTargetSelf ? (userProfile?.band_name || userProfile?.bandName) : null) || (hasWorkspaceType('band') ? (effTarget.name ? `${effTarget.name} Band` : 'Artist Workspace') : null));
                  
                  if (isEffTargetMiguel) {
                    rawBandName = 'Virulent Excision';
                  }

                  const hasBandWorkspace = (
                    isEffTargetMiguel ||
                    hasWorkspaceType('band') ||
                    Boolean(matchingBandProfile) ||
                    Boolean(targetBandId) ||
                    Boolean(effTarget.band_name) ||
                    Boolean(effTarget.bandName) ||
                    (isTargetSelf && Boolean(userProfile?.band_name || userProfile?.band_id))
                  ) && Boolean(rawBandName) && String(rawBandName).trim() !== '' && !isCommunityBandRecord(rawBandName);

                   const hasBand = !isCurrentProfileBand && hasBandWorkspace;

                   if (hasBand) {
                    const isVeOverride = isEffTargetMiguel || (typeof rawBandName === 'string' && rawBandName.toLowerCase() === 'virulent excision');
                    const name = isVeOverride ? 'Virulent Excision' : String(rawBandName).trim();
                    const isVirulentExcision = name.toLowerCase() === 'virulent excision' || isVeOverride;
                    const veLogo = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396';
                    const veBanner = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-cover_1787467851123.jpg?t=1787467851123';
                    const logo = isVirulentExcision
                      ? (lbd?.logo_url && !lbd.logo_url.includes('unsplash') ? lbd.logo_url : veLogo)
                      : (lbd?.logo_url || lbd?.avatar_url || lbd?.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300');
                    const subtitle = isVirulentExcision
                      ? 'Brutal Death Metal • Slamming BDM • Death Metal'
                      : (lbd?.genre || (lbd?.micro_genres && Array.isArray(lbd.micro_genres) && lbd.micro_genres.length > 0 ? lbd.micro_genres.join(' • ') : 'Metal / Hardcore'));

                    entities.push({
                      key: 'band',
                      icon: '🎸',
                      badgeClass: 'bg-purple-950/80 border border-purple-500/50 text-purple-300',
                      borderHoverClass: 'hover:border-purple-400/80',
                      typeLabel: 'Band',
                      name,
                      logo,
                      subtitle,
                      onClick: () => {
                        const isRealBandProfile = matchingBandProfile && (matchingBandProfile.type === 'band' || matchingBandProfile.isBandProfile || (matchingBandProfile.role && matchingBandProfile.role.toLowerCase() === 'band'));
                        const targetBandProfile = isRealBandProfile ? matchingBandProfile : null;

                        const bandProfileObj = {
                          ...(isVirulentExcision ? {} : (targetBandProfile || lbd || {})),
                          id: isVirulentExcision ? 'cbddb810-259b-4230-9968-3d402dfdb872' : (targetBandProfile?.id || lbd?.id || targetBandId || `band_${effTarget?.id || Date.now()}`),
                          name,
                          band_name: name,
                          bandName: name,
                          type: 'band',
                          role: 'Band',
                          portalRole: 'band',
                          account_type: 'band',
                          isBandProfile: true,
                          isPersonal: false,
                          avatar: logo,
                          avatar_url: logo,
                          banner: isVirulentExcision ? veBanner : (lbd?.cover_url || lbd?.banner_url || targetBandProfile?.banner_url || effTarget.banner_url),
                          banner_url: isVirulentExcision ? veBanner : (lbd?.cover_url || lbd?.banner_url || targetBandProfile?.banner_url || effTarget.banner_url),
                          cover_url: isVirulentExcision ? veBanner : (lbd?.cover_url || targetBandProfile?.cover_url),
                          logo_url: logo,
                          genre: isVirulentExcision ? 'Brutal Death Metal' : subtitle,
                          micro_genres: isVirulentExcision ? ['Brutal Death Metal', 'Death Metal', 'Slamming BDM'] : (lbd?.micro_genres || targetBandProfile?.micro_genres || []),
                          subgenres: isVirulentExcision ? ['Brutal Death Metal', 'Death Metal', 'Slamming BDM'] : undefined,
                          genre_tags: isVirulentExcision ? ['Brutal Death Metal', 'Death Metal', 'Slamming BDM'] : undefined,
                          homebase: isVirulentExcision ? 'Denison, TX, USA' : (lbd?.homebase || targetBandProfile?.homebase || effTarget.homebase || 'Global Scene'),
                          city: isVirulentExcision ? 'Denison' : undefined,
                          state_province: isVirulentExcision ? 'TX' : undefined,
                          country: isVirulentExcision ? 'USA' : undefined,
                          custom_slug: isVirulentExcision ? 'virulent-excision' : (lbd?.custom_slug || targetBandProfile?.custom_slug),
                          handle: isVirulentExcision ? '@virulent-excision' : (lbd?.custom_slug ? `@${lbd.custom_slug}` : undefined),
                          console_handle: isVirulentExcision ? '@virulent-excision' : undefined,
                          record_label: isVirulentExcision ? 'Comatose Music' : undefined,
                          label: isVirulentExcision ? 'Comatose Music' : undefined,
                          metal_archives_url: isVirulentExcision ? 'https://www.metal-archives.com/bands/Virulent_Excision/3540459437' : undefined,
                          bio: isVirulentExcision ? 'V.E. is brutal death metal, fusing old-school NYDM weight with modern technical slam. Driven by themes of biological reconfiguration and systemic depopulation, the project stands as an uncompromising, heavy-hitting soundtrack to humanity’s extinction..' : (lbd?.bio || lbd?.description || targetBandProfile?.bio || `Official Nexus Artist Profile for ${name}.`)
                        };
                        setSelectedUserProfile(bandProfileObj);
                        triggerNotification?.(`🎸 Opening Public Band Profile for ${name}...`);
                      }
                    });
                  }

                  // 2. PROMOTER WORKSPACE
                  const isCurrentProfilePromoter = Boolean(
                    effTarget?.type === 'promoter' || 
                    effTarget?.account_type === 'promoter' ||
                    (targetRole && targetRole.toLowerCase() === 'promoter')
                  );

                  const matchingPromoterProfile = Array.isArray(allProfiles) ? allProfiles.find((p: any) => {
                    const isPromoterType = p.type === 'promoter' || p.role === 'Promoter' || p.category === 'venues' || p.account_type === 'promoter';
                    if (!isPromoterType) return false;
                    if (effTarget.promoter_id && (p.id === effTarget.promoter_id || p.promoter_id === effTarget.promoter_id)) return true;
                    if (effTarget.id && (p.user_id === effTarget.id || p.owner_id === effTarget.id)) return true;
                    if (typeof promoterWsRef === 'object' && promoterWsRef?.workspace_id && (p.id === promoterWsRef.workspace_id || p.promoter_id === promoterWsRef.workspace_id)) return true;
                    return false;
                  }) : null;

                  const rawPromoterName = 
                    matchingPromoterProfile?.promoter_name || 
                    matchingPromoterProfile?.promoterName || 
                    matchingPromoterProfile?.agency_name || 
                    effTarget.promoter_name || 
                    effTarget.promoterName || 
                    effTarget.agency_name || 
                    matchingPromoterProfile?.name || 
                    (typeof promoterWsRef === 'object' && promoterWsRef?.name ? promoterWsRef.name : null) || 
                    (hasWorkspaceType('promoter') ? (effTarget.name ? `${effTarget.name} Booking` : 'Promoter Agency') : null);
                  const hasPromoterWorkspace = (hasWorkspaceType('promoter') || Boolean(matchingPromoterProfile) || Boolean(effTarget.agency_name) || Boolean(effTarget.promoter_name) || Boolean(effTarget.promoter_id)) && Boolean(rawPromoterName) && String(rawPromoterName).trim() !== '';

                  const hasPromoter = !isCurrentProfilePromoter && hasPromoterWorkspace;

                  if (hasPromoter) {
                    const name = String(rawPromoterName).trim();
                    const logo = matchingPromoterProfile?.promoter_logo || effTarget?.promoter_logo || (isTargetSelf ? userProfile?.promoter_logo : null) || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=300';
                    const subtitle = effTarget.venue || effTarget.location || 'Promoter & Venue Booking';

                    entities.push({
                      key: 'promoter',
                      icon: '🎪',
                      badgeClass: 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300',
                      borderHoverClass: 'hover:border-emerald-400/80',
                      typeLabel: 'Promoter',
                      name,
                      logo,
                      subtitle,
                      onClick: () => {
                        const promoterProfileObj = {
                          ...effTarget,
                          id: effTarget.promoter_id || (typeof promoterWsRef === 'object' && promoterWsRef?.id) || `promoter_${effTarget.id || Date.now()}`,
                          name,
                          agency_name: name,
                          type: 'promoter',
                          role: 'Promoter',
                          portalRole: 'promoter',
                          account_type: 'promoter',
                          isPersonal: false,
                          avatar: logo,
                          avatar_url: logo,
                          location: subtitle,
                          bio: effTarget.bio || `Official Promoter & Booking entity for ${name}.`
                        };
                        setSelectedUserProfile(promoterProfileObj);
                        triggerNotification?.(`🎪 Opening Promoter Profile for ${name}...`);
                      }
                    });
                  }

                  // 3. CREATIVE WORKSPACE
                  const isCurrentProfileCreative = Boolean(
                    effTarget?.type === 'creative' || 
                    effTarget?.account_type === 'creative' ||
                    (targetRole && targetRole.toLowerCase() === 'creative')
                  );

                  const matchingCreativeProfile = Array.isArray(allProfiles) ? allProfiles.find((p: any) => {
                    const isCreativeType = p.type === 'creative' || p.role === 'Creative' || p.category === 'creatives' || p.account_type === 'creative';
                    if (!isCreativeType) return false;
                    if (effTarget.creative_id && (p.id === effTarget.creative_id || p.creative_id === effTarget.creative_id)) return true;
                    if (effTarget.id && (p.user_id === effTarget.id || p.owner_id === effTarget.id)) return true;
                    if (typeof creativeWsRef === 'object' && creativeWsRef?.workspace_id && (p.id === creativeWsRef.workspace_id || p.creative_id === creativeWsRef.workspace_id)) return true;
                    return false;
                  }) : null;

                  const rawCreativeName = 
                    matchingCreativeProfile?.creative_name || 
                    matchingCreativeProfile?.creative_business_name || 
                    matchingCreativeProfile?.business_name || 
                    effTarget.creative_name || 
                    effTarget.creative_business_name || 
                    effTarget.business_name || 
                    (isTargetSelf ? (userProfile?.creative_business_name || userProfile?.creative_name || userProfile?.creative_metadata?.business_name) : null) ||
                    matchingCreativeProfile?.name || 
                    (typeof creativeWsRef === 'object' && creativeWsRef?.name ? creativeWsRef.name : null) || 
                    (hasWorkspaceType('creative') ? (effTarget.name && !['user', 'user name', 'industry pro', 'pro_user', 'fan listener', 'member', 'fan_core', 'listener'].includes(String(effTarget.name).toLowerCase().trim()) ? `${effTarget.name} Studios` : 'Vortex Graphics') : null);
                  const hasCreativeWorkspace = (hasWorkspaceType('creative') || Boolean(matchingCreativeProfile) || Boolean(effTarget.business_name) || Boolean(effTarget.creative_name) || Boolean(effTarget.creative_id) || (isTargetSelf && Boolean(userProfile?.creative_id || userProfile?.creative_name || userProfile?.creative_business_name))) && Boolean(rawCreativeName) && String(rawCreativeName).trim() !== '';

                  const hasCreative = !isCurrentProfileCreative && hasCreativeWorkspace;

                  if (hasCreative) {
                    const name = String(rawCreativeName).trim();
                    const logo = matchingCreativeProfile?.creative_avatar || effTarget?.creative_avatar || (isTargetSelf ? userProfile?.creative_avatar : null) || 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=150';
                    const subtitle = effTarget.primary_specialty || effTarget.specialty || 'Creative Media & Sound Design';

                    entities.push({
                      key: 'creative',
                      icon: '🎨',
                      badgeClass: 'bg-amber-950/80 border border-amber-500/50 text-amber-300',
                      borderHoverClass: 'hover:border-amber-400/80',
                      typeLabel: 'Creative',
                      name,
                      logo,
                      subtitle,
                      onClick: () => {
                        const creativeBanner = matchingCreativeProfile?.creative_banner || matchingCreativeProfile?.banner_url || matchingCreativeProfile?.cover_url || effTarget?.creative_banner || (isTargetSelf ? userProfile?.creative_banner : null) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200';
                        const creativeHandle = matchingCreativeProfile?.creative_handle || matchingCreativeProfile?.console_handle || matchingCreativeProfile?.handle || effTarget?.creative_handle || (isTargetSelf ? userProfile?.creative_handle : null) || 'vortexgraphics';
                        const creativeName = name || matchingCreativeProfile?.business_name || matchingCreativeProfile?.creative_name || effTarget?.creative_name || (isTargetSelf ? userProfile?.creative_business_name : null) || 'Vortex Graphics';

                        const creativeProfileObj = {
                          ...(matchingCreativeProfile || {}),
                          ...(!matchingCreativeProfile ? effTarget : {}),
                          id: matchingCreativeProfile?.id || effTarget.creative_id || (typeof creativeWsRef === 'object' && creativeWsRef?.id) || `creative_${effTarget.id || Date.now()}`,
                          name: creativeName,
                          business_name: creativeName,
                          creative_name: creativeName,
                          creative_business_name: creativeName,
                          type: 'creative',
                          role: 'Creative',
                          portalRole: 'creative',
                          account_type: 'creative',
                          isPersonal: false,
                          isIndustryProPersonal: false,
                          avatar: logo,
                          avatar_url: logo,
                          creative_avatar: logo,
                          creative_banner: creativeBanner,
                          banner: creativeBanner,
                          banner_url: creativeBanner,
                          cover_url: creativeBanner,
                          creative_handle: creativeHandle,
                          console_handle: creativeHandle,
                          handle: creativeHandle,
                          specialty: subtitle,
                          bio: matchingCreativeProfile?.bio || effTarget.bio || `Official Creative Specialist Profile for ${creativeName}.`
                        };
                        setSelectedUserProfile(creativeProfileObj);
                        triggerNotification?.(`🎨 Opening Creative Profile for ${creativeName}...`);
                      }
                    });
                  }

                  // 4. RECORD LABEL WORKSPACE
                  const isCurrentProfileLabel = Boolean(
                    effTarget?.type === 'label' || 
                    effTarget?.account_type === 'label' ||
                    (targetRole && targetRole.toLowerCase() === 'label')
                  );

                  const matchingLabelProfile = Array.isArray(allProfiles) ? allProfiles.find((p: any) => {
                    const isLabelType = p.type === 'label' || p.role === 'Label' || p.category === 'labels' || p.account_type === 'label';
                    if (!isLabelType) return false;
                    if (effTarget.label_id && (p.id === effTarget.label_id || p.label_id === effTarget.label_id)) return true;
                    if (effTarget.id && (p.user_id === effTarget.id || p.owner_id === effTarget.id)) return true;
                    if (typeof labelWsRef === 'object' && labelWsRef?.workspace_id && (p.id === labelWsRef.workspace_id || p.label_id === labelWsRef.workspace_id)) return true;
                    return false;
                  }) : null;

                  const rawLabelName = 
                    matchingLabelProfile?.label_company_name || 
                    matchingLabelProfile?.label_name || 
                    matchingLabelProfile?.labelName || 
                    effTarget.label_company_name || 
                    effTarget.label_name || 
                    effTarget.labelName || 
                    (isTargetSelf ? userProfile?.label_company_name : null) ||
                    matchingLabelProfile?.name || 
                    (typeof labelWsRef === 'object' && labelWsRef?.name ? labelWsRef.name : null) || 
                    (hasWorkspaceType('label') ? (effTarget.name ? `${effTarget.name} Records` : 'Record Label') : null);
                  const hasLabelWorkspace = (hasWorkspaceType('label') || Boolean(matchingLabelProfile) || Boolean(effTarget?.label_name) || Boolean(effTarget?.labelName) || Boolean(effTarget?.label_id) || (isTargetSelf && Boolean(userProfile?.label_id || userProfile?.label_company_name))) && Boolean(rawLabelName) && String(rawLabelName).trim() !== '';

                  const hasLabel = !isCurrentProfileLabel && hasLabelWorkspace;

                  if (hasLabel) {
                    const name = String(rawLabelName).trim();
                    const logo = matchingLabelProfile?.label_avatar || effTarget?.label_avatar || (isTargetSelf ? userProfile?.label_avatar : null) || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300';
                    const subtitle = effTarget.label_region || effTarget.location || 'Independent Label Group';

                    entities.push({
                      key: 'label',
                      icon: '🏷️',
                      badgeClass: 'bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-300',
                      borderHoverClass: 'hover:border-fuchsia-400/80',
                      typeLabel: 'Record Label',
                      name,
                      logo,
                      subtitle,
                      onClick: () => {
                        const labelProfileObj = {
                          ...effTarget,
                          id: effTarget.label_id || (typeof labelWsRef === 'object' && labelWsRef?.id) || `label_${effTarget.id || Date.now()}`,
                          name,
                          label_name: name,
                          labelName: name,
                          type: 'label',
                          role: 'Label',
                          portalRole: 'label',
                          account_type: 'label',
                          isPersonal: false,
                          avatar: logo,
                          avatar_url: logo,
                          location: subtitle,
                          bio: effTarget.bio || `Official Record Label Profile for ${name}.`
                        };
                        setSelectedUserProfile(labelProfileObj);
                        triggerNotification?.(`🏷️ Opening Record Label Profile for ${name}...`);
                      }
                    });
                  }

                  if (entities.length === 0) return null;

                  return (
                    <div className="mt-4 text-left">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-800/80">
                        <span className="text-[10px] font-mono font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                          Associated Entities
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">
                          {entities.length} {entities.length === 1 ? 'Workspace' : 'Workspaces'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {entities.map((item, idx) => (
                          <div
                            key={`assoc-${item.key}-${idx}`}
                            onClick={item.onClick}
                            className={`p-1.5 sm:p-2 bg-gradient-to-r from-zinc-900/90 to-zinc-950 border border-zinc-800 ${item.borderHoverClass} rounded-lg sm:rounded-xl transition-all cursor-pointer group relative overflow-hidden flex items-center gap-1.5 sm:gap-2.5 shadow-md hover:shadow-purple-950/30 hover:scale-[1.01]`}
                          >
                            {/* Logo */}
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-zinc-950 border border-zinc-700/60 overflow-hidden shrink-0 group-hover:border-purple-400/80 transition-colors shadow-inner flex items-center justify-center">
                              <img
                                src={item.logo}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className={`text-[7px] sm:text-[8px] font-mono font-black uppercase px-1 sm:px-1.5 py-0.2 rounded ${item.badgeClass}`}>
                                  {item.icon} {item.typeLabel}
                                </span>
                              </div>
                              <h5 className="text-[10px] sm:text-xs font-black text-white group-hover:text-purple-300 truncate tracking-tight mt-0.5 font-display">
                                {item.name}
                              </h5>
                              <p className="text-[7.5px] sm:text-[9px] font-mono text-zinc-400 truncate leading-tight">
                                {item.subtitle}
                              </p>
                            </div>

                            {/* Arrow */}
                            <div className="shrink-0 pr-0.5 sm:pr-1 text-zinc-500 group-hover:text-purple-300 transition-colors text-[10px] sm:text-xs font-bold hidden xs:block sm:block">
                              →
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}


                {/* Custom badges */}
                {selectedUserProfile.customBadges && selectedUserProfile.customBadges.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedUserProfile.customBadges
                      .filter((badge: string) => {
                        const bLower = badge.toLowerCase();
                        if ((selectedUserProfile?.role || '').toLowerCase().includes('label')) {
                          return !bLower.includes('overlord') && !bLower.includes('founder');
                        }
                        if (
                          bLower.includes('fan') ||
                          bLower.includes('supporter') ||
                          bLower.includes('industry') ||
                          bLower.includes('pro') ||
                          bLower.includes('member') ||
                          bLower === 'fan_only' ||
                          bLower === 'fan only' ||
                          bLower === 'listener' ||
                          bLower === 'operator' ||
                          bLower === selectedUserProfile.role?.toLowerCase()
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((badge: string, idx: number) => (
                        <span key={`promoter-secbadge-${badge}-${idx}`} className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          (selectedUserProfile?.role || '').toLowerCase().includes('label') 
                            ? 'bg-orange-500/5 text-orange-400 border border-orange-950' 
                            : 'bg-rose-500/5 text-rose-400 border border-rose-950'
                        }`}>
                          {badge}
                        </span>
                      ))}
                  </div>
                )}

                {/* Label action buttons: Message and Submit EPK */}
                {(selectedUserProfile?.role || '').toLowerCase().includes('label') && (
                  <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => {
                        const targetUser = selectedUserProfile;
                        setSelectedUserProfile(null);
                        window.dispatchEvent(new CustomEvent('nexus_open_chat', { detail: { profile_id: targetUser?.email || targetUser?.name, name: targetUser?.name, username: targetUser?.name, avatar_url: targetUser?.avatar } }));
                        window.dispatchEvent(new CustomEvent('nexus_open_chat_thread', { detail: { profile_id: targetUser?.email || targetUser?.name, name: targetUser?.name, username: targetUser?.name, avatar_url: targetUser?.avatar } }));
                        triggerNotification?.(`⚡ Opened encrypted channel with ${targetUser?.name || 'Unknown Label'}`);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/30 hover:border-orange-500/60 text-orange-400 text-[10px] font-black rounded-xl uppercase tracking-wider font-mono transition-all cursor-pointer shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message Label
                    </button>
                    <button
                      onClick={() => {
                        setShowSubmitEpkModal?.(true);
                        triggerNotification?.("⚡ EPK Submission Terminal active");
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 text-[10px] font-black rounded-xl uppercase tracking-wider font-mono transition-all cursor-pointer shadow-sm"
                    >
                      <FileUp className="w-3.5 h-3.5" /> Submit EPK
                    </button>

                    <button
                      onClick={() => {
                        const labelName = selectedUserProfile.name;
                        setSelectedUserProfile(null);
                        setShopBrandFilter?.(labelName);
                        setActiveTab?.('shop');
                        triggerNotification?.(`🛒 Entering ${labelName}'s In-App Storefront...`);
                      }}
                      className="col-span-2 mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest font-mono transition-all cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.3)] border border-orange-400/40 hover:scale-[1.01]"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Enter Official Storefront
                    </button>
                  </div>
                )}

                 {/* ACTIVE PIT/RITUAL PORTAL STATE OR SCROLLING BANNER */}
                 {selectedUserProfile.isYou && isEditingBio ? (
                   <div className="mt-3 bg-zinc-950/20 border border-zinc-900 rounded-xl p-3 relative">
                     <div className="flex items-center justify-between mb-1.5">
                       <label className="text-[10px] uppercase font-bold text-[#39ff14] font-mono tracking-wider flex items-center gap-1">
                         ✍️ EDIT BIO
                       </label>
                       <div className="flex items-center gap-2">
                         <span className="text-[9px] font-mono text-zinc-500 font-bold">{(profileBlurb || '').length}/500</span>
                         <button
                           onClick={() => {
                             saveProfileData(true);
                             setIsEditingBio(false);
                             triggerNotification?.("💾 Bio updated in your node matrix.");
                           }}
                           className="px-2 py-0.5 bg-[#39ff14]/10 hover:bg-[#39ff14]/20 border border-[#39ff14]/40 text-[#39ff14] text-[9.5px] font-mono font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
                         >
                           <Check className="w-3 h-3" /> Save Bio
                         </button>
                       </div>
                     </div>
                     <textarea
                       maxLength={500}
                       value={profileBlurb}
                       onChange={(e) => {
                         const val = e.target.value.slice(0, 500);
                         setProfileBlurb(val);
                         setSelectedUserProfile((prev: any) => prev ? { ...prev, bio: val, profileBlurb: val } : null);
                         if (setUserProfile) { queueMicrotask(() => { setUserProfile((pPrev: any) => pPrev ? { ...pPrev, bio: val } : null); }); }
                         try {
                           localStorage.setItem('nexus_user_bio', val);
                         } catch(err){}
                       }}
                       onBlur={() => {
                         saveProfileData(true);
                       }}
                       placeholder={(selectedUserProfile?.role || '').toLowerCase().includes('label') ? "We are a record label navigating the Nexus." : "Currently navigating the Nexus."}
                       className="w-full bg-black/60 border border-zinc-850 hover:border-[#39ff14]/30 focus:border-[#39ff14]/60 rounded-lg p-2.5 text-xs text-zinc-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#39ff14]/20 font-mono italic"
                       rows={3}
                       autoFocus
                     />
                   </div>
                 ) : (
                   <div className="mt-3 space-y-1">
                     <div className="flex items-center justify-between px-0.5">
                       <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider uppercase flex items-center gap-1">
                         📖 BIO
                       </span>
                       {selectedUserProfile.isYou && (
                         <button
                           onClick={() => setIsEditingBio(true)}
                           title="Edit Bio"
                           className="px-2 py-0.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-[#39ff14] rounded-md transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-[10px] font-mono font-semibold"
                         >
                           <Pencil className="w-3 h-3 text-zinc-400 group-hover:text-[#39ff14]" /> Edit Bio
                         </button>
                       )}
                     </div>
                     <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3.5 text-xs text-zinc-300 leading-relaxed italic relative">
                       {(() => {
                         const isOwner = Boolean(
                           selectedUserProfile?.isYou ||
                           effTarget?.isYou ||
                           baseTarget?.isYou ||
                           (userProfile?.id && (selectedUserProfile?.id === userProfile.id || effTarget?.id === userProfile.id || baseTarget?.id === userProfile.id))
                         );
                         if (isOwner) {
                           const b = (profileBlurb || effTarget?.bio || (userProfile as any)?.bio || '').trim();
                           return b ? `"${b}"` : '"Click edit to add your bio."';
                         } else {
                           const b = (fetchedProfileData?.bio || effTarget?.bio || baseTarget?.bio || '').trim();
                           return b ? `"${b}"` : '"no bio written yet"';
                         }
                       })()}
                     </div>
                   </div>
                 )}

                                   {/* Glowing Scrolling Marquee Text Box for Live Updates */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        📢 LIVE UPDATE
                      </span>
                      {selectedUserProfile.isYou && !isEditingTicker && (
                        <button
                          type="button"
                          onClick={() => setIsEditingTicker(true)}
                          title="Edit Marquee Update"
                          className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 text-cyan-300 hover:text-white rounded-md transition-all shadow-sm cursor-pointer flex items-center gap-1 text-[10px] font-mono font-semibold group"
                        >
                          <Pencil className="w-3 h-3 text-cyan-400 group-hover:text-cyan-300" /> Edit Update
                        </button>
                      )}
                    </div>

                    {isEditingTicker ? (
                      <div className="bg-zinc-950/90 border border-cyan-500/50 rounded-xl p-3 space-y-2 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            ✍️ EDIT TICKER
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-zinc-400 font-bold">
                              {tickerUpdateText.length}/200
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSaveTickerUpdate(tickerUpdateText)}
                              className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 hover:text-cyan-200 text-[9.5px] font-mono font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingTicker(false)}
                              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 text-[9.5px] font-mono font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        <textarea
                          maxLength={200}
                          value={tickerUpdateText}
                          onChange={(e) => setTickerUpdateText(e.target.value.slice(0, 200))}
                          placeholder="Post a quick live update, gig news, tape drop, or announcement (max 200 chars)..."
                          className="w-full bg-black/80 border border-zinc-800 focus:border-cyan-400 rounded-lg p-2.5 text-xs text-cyan-200 font-mono tracking-wide focus:outline-none focus:ring-1 focus:ring-cyan-400/30 resize-none"
                          rows={2.5}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center border rounded-xl overflow-hidden bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] py-2.5 px-1 relative group/marquee cursor-default">
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0b0c0e] to-transparent z-[5] pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0b0c0e] to-transparent z-[5] pointer-events-none" />
                        <div className="w-full relative flex items-center overflow-hidden">
                          <div className="flex whitespace-nowrap animate-[marquee_28s_linear_infinite] group-hover/marquee:[animation-play-state:paused] items-center">
                            <span className="text-[10.5px] font-mono font-bold tracking-widest uppercase text-cyan-300 px-6 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] flex items-center gap-2">
                              ⚡ {tickerUpdateText || "NAVIGATING THE NEXUS MATRIX • STAY TUNED FOR LIVE SHOWS & RELEASES"}
                            </span>
                            <span className="text-[10.5px] font-mono font-bold tracking-widest uppercase text-cyan-300 px-6 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] flex items-center gap-2">
                              ⚡ {tickerUpdateText || "NAVIGATING THE NEXUS MATRIX • STAY TUNED FOR LIVE SHOWS & RELEASES"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats Ledger Row */}
                {(() => {
                  const followersVal = liveProfileStats?.followers !== undefined ? liveProfileStats.followers : (effTarget.followersCount !== undefined ? effTarget.followersCount : (effTarget.followers || 0));
                  const followingVal = liveProfileStats?.following !== undefined ? liveProfileStats.following : (effTarget.followingCount !== undefined ? effTarget.followingCount : (effTarget.following || 0));

                  return (
                    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 mt-4 transition-all duration-200 hover:border-violet-500/40 shadow-inner">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-900/80 px-1">
                        <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-violet-400 animate-pulse" />
                          Network Telemetry
                        </span>
                        <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Live Node
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div 
                          onClick={() => setViewingFollowersOrFollowing?.('followers')}
                          className="rounded-lg p-2 transition-all border border-zinc-900/60 bg-zinc-900/40 flex flex-col items-center justify-center hover:bg-violet-950/40 cursor-pointer group/stat hover:border-violet-700/40 hover:shadow-lg hover:shadow-violet-950/30"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono uppercase tracking-wider group-hover/stat:text-violet-300 transition-colors">
                            <Users className="w-3.5 h-3.5 text-violet-400 group-hover/stat:scale-110 transition-transform" />
                            Followers
                          </div>
                          <div className="text-base font-black text-white font-mono mt-1 group-hover/stat:text-violet-200 group-hover/stat:scale-105 transition-all">
                            {followersVal.toLocaleString()}
                          </div>
                          <div className="text-[8px] text-zinc-500 font-mono uppercase tracking-tight mt-1 group-hover/stat:text-violet-400 flex items-center gap-0.5 transition-colors">
                            View Roster <ArrowUpRight className="w-2.5 h-2.5 opacity-60 group-hover/stat:opacity-100 group-hover/stat:translate-x-0.5 transition-all" />
                          </div>
                        </div>

                        <div 
                          onClick={() => setViewingFollowersOrFollowing?.('following')}
                          className="rounded-lg p-2 transition-all border border-zinc-900/60 bg-zinc-900/40 flex flex-col items-center justify-center hover:bg-violet-950/40 cursor-pointer group/stat hover:border-violet-700/40 hover:shadow-lg hover:shadow-violet-950/30"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono uppercase tracking-wider group-hover/stat:text-violet-300 transition-colors">
                            <UserCheck className="w-3.5 h-3.5 text-violet-400 group-hover/stat:scale-110 transition-transform" />
                            Following
                          </div>
                          <div className="text-base font-black text-white font-mono mt-1 group-hover/stat:text-violet-200 group-hover/stat:scale-105 transition-all">
                            {followingVal.toLocaleString()}
                          </div>
                          <div className="text-[8px] text-zinc-500 font-mono uppercase tracking-tight mt-1 group-hover/stat:text-violet-400 flex items-center gap-0.5 transition-colors">
                            View List <ArrowUpRight className="w-2.5 h-2.5 opacity-60 group-hover/stat:opacity-100 group-hover/stat:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Unlimited "My Favorite Genres" Badge Section for Fan Only and Industry Pro Profiles */}
                {(() => {
                  const targetRoleStr = (effTarget?.portalRole || effTarget?.role || effTarget?.account_type || '').toLowerCase();
                  const isTargetBand = !!(
                    effTarget?.isBandProfile ||
                    effTarget?.type === 'band' ||
                    ((targetRoleStr.includes('artist') || targetRoleStr.includes('band')) && !effTarget?.isPersonal && effTarget?.type !== 'user' && !targetRoleStr.includes('industry') && !targetRoleStr.includes('creative') && !targetRoleStr.includes('pro'))
                  );

                  // Band profiles do NOT render 'My Favorite Genres' badge block here
                  if (isTargetBand) return null;

                  let rawList: string[] = [];

                  if (effTarget?.isYou) {
                    rawList = [
                      ...(profileMicroGenres || []),
                      ...(profilePrimaryGenres || []),
                      ...(profileGenres || []),
                      ...(userProfile?.fan_genres || []),
                      ...(effTarget?.genres || []),
                      ...(effTarget?.genre_tags || []),
                    ];
                  }
                  if (rawList.length === 0 && effTarget?.fan_genres && Array.isArray(effTarget.fan_genres)) {
                    rawList = [...effTarget.fan_genres];
                  }
                  if (rawList.length === 0 && effTarget?.genres && Array.isArray(effTarget.genres)) {
                    rawList = [...effTarget.genres];
                  }
                  if (rawList.length === 0 && effTarget?.genre_tags && Array.isArray(effTarget.genre_tags)) {
                    rawList = [...effTarget.genre_tags];
                  }
                  if (rawList.length === 0 && effTarget?.genre) {
                    if (typeof effTarget.genre === 'string') {
                      rawList = effTarget.genre.split(/[\/,]/).map((s: string) => s.trim()).filter(Boolean);
                    } else if (Array.isArray(effTarget.genre)) {
                      rawList = effTarget.genre;
                    }
                  }
                  if (rawList.length === 0 && effTarget?.profileMicroGenres && Array.isArray(effTarget.profileMicroGenres)) {
                    rawList = [...rawList, ...effTarget.profileMicroGenres];
                  }
                  if (rawList.length === 0 && effTarget?.profilePrimaryGenres && Array.isArray(effTarget.profilePrimaryGenres)) {
                    rawList = [...rawList, ...effTarget.profilePrimaryGenres];
                  }

                  const allGenres = Array.from(new Set(rawList.filter(Boolean)));
                  if (allGenres.length === 0) return null;

                  const isFanOnly = (targetRoleStr.includes('fan') || targetRoleStr.includes('listener') || effTarget?.name === 'Fan Listener') && !effTarget?.isBandProfile && !isTargetBand;

                  return (
                    <div className="mt-3 bg-zinc-950/80 border border-zinc-900 rounded-xl p-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Tag className={`w-3.5 h-3.5 ${isFanOnly ? 'text-blue-400' : 'text-violet-400'}`} />
                          <span>My Genres</span>
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono font-medium">
                          {allGenres.length} {allGenres.length === 1 ? 'Genre' : 'Genres'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                        {allGenres.map((genre, idx) => (
                          <span
                            key={`promoter-profile-item-${idx}`}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] leading-tight font-mono font-bold tracking-tight border transition-all shadow-sm ${
                              isFanOnly
                                ? 'bg-blue-950/40 border-blue-800/40 text-blue-300 hover:border-blue-500 hover:text-blue-200'
                                : 'bg-violet-950/40 border-violet-800/40 text-violet-300 hover:border-violet-500 hover:text-violet-200'
                            }`}
                          >
                            #{genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}



              {/* Ever-Present Embedded Player Card */}
              {(() => {
                const r = (selectedUserProfile?.role || '').toLowerCase();
                const isArtist = r.includes('artist') || r.includes('band');
                const isLabel = r.includes('label');
                const isPromoter = r.includes('promoter');
                const isCreative = r.includes('creative');

                let playerTitle = 'CURRENT TOP SONG / ANTHEM';
                let badgeTheme = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                let cardBorder = 'border-cyan-500/30 hover:border-cyan-500/60';
                let glowEffect = 'shadow-[0_0_15px_rgba(6,182,212,0.12)]';

                if (isArtist) {
                  playerTitle = 'NEWEST VIDEO / HIGHLIGHTED TRACK';
                  badgeTheme = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  cardBorder = 'border-emerald-500/30 hover:border-emerald-500/60';
                  glowEffect = 'shadow-[0_0_15px_rgba(16,185,129,0.12)]';
                } else if (isLabel) {
                  playerTitle = 'FEATURED RELEASE / HIGHLIGHTED VIDEO';
                  badgeTheme = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                  cardBorder = 'border-orange-500/30 hover:border-orange-500/60';
                  glowEffect = 'shadow-[0_0_15px_rgba(249,115,22,0.12)]';
                } else if (isCreative) {
                  playerTitle = 'CURRENT HIGHLIGHT TRACK';
                  badgeTheme = 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20';
                  cardBorder = 'border-fuchsia-500/30 hover:border-fuchsia-500/60';
                  glowEffect = 'shadow-[0_0_15px_rgba(217,70,239,0.12)]';
                } else if (isPromoter) {
                  playerTitle = 'FEATURED PROMO TRACK / TEASER';
                  badgeTheme = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                  cardBorder = 'border-yellow-500/30 hover:border-yellow-500/60';
                  glowEffect = 'shadow-[0_0_15px_rgba(234,179,8,0.12)]';
                }

                const songUrl = effTarget?.top_song_url || effTarget?.featured_youtube_url || ((selectedUserProfile?.isBandProfile || effTarget?.isBandProfile || effTarget?.type === 'band' || isArtistOrBand) ? '' : ((selectedUserProfile as any)?.top_song_url || (userProfile as any)?.top_song_url || ''));
                const embedUrl = getEmbedUrl(songUrl);
                
                let songTitle = '';
                if (effTarget?.top_song_artist && effTarget?.top_song_title) {
                  songTitle = `${effTarget.top_song_artist} - ${effTarget.top_song_title}`;
                } else if (effTarget?.top_song_title) {
                  songTitle = effTarget.top_song_title;
                } else if (effTarget?.favoriteSong && effTarget.favoriteSong !== 'None Selected') {
                  songTitle = effTarget.favoriteSong;
                } else if (effTarget?.isBandProfile || effTarget?.type === 'band' || isArtistOrBand) {
                  songTitle = effTarget?.name ? `${effTarget.name} - Newest Release` : 'Newest Release Video';
                } else if ((selectedUserProfile?.isYou || effTarget?.isYou) && profileTopSongArtist && profileTopSongTitle) {
                  songTitle = `${profileTopSongArtist} - ${profileTopSongTitle}`;
                } else {
                  songTitle = '';
                }

                return (
                  <div className="mt-3 mb-2 flex flex-col relative transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-black uppercase tracking-wider border ${badgeTheme}`}>
                        🎬 {playerTitle}
                      </span>
                      {songUrl && (
                        <a
                          href={songUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-0.5 hover:underline"
                        >
                          Open <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="w-full flex justify-center items-center my-1">
                      <CrtTvFrame>
                        <div className="w-full bg-black h-full overflow-hidden">
                          {embedUrl ? (
                            embedUrl.includes('spotify.com') ? (
                              <iframe
                                src={embedUrl}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                className="w-full h-full"
                              />
                            ) : embedUrl.includes('soundcloud.com') ? (
                              <iframe
                                width="100%"
                                height="100%"
                                scrolling="no"
                                frameBorder="no"
                                allow="autoplay"
                                src={embedUrl}
                                className="w-full h-full"
                              />
                            ) : (
                              <iframe
                                src={embedUrl}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                              />
                            )
                          ) : (
                            <div className="flex items-center gap-3 p-2 h-full bg-zinc-950/80">
                              <Disc className="w-8 h-8 text-emerald-400 animate-spin-slow shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">AUDIO MATRIX READY</div>
                                <div className="text-xs font-bold text-white truncate">{songTitle || ((selectedUserProfile?.isYou || effTarget?.isYou) ? "No Anthem Selected (Click Edit Anthem to add your top song)" : "No Anthem Selected")}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CrtTvFrame>
                    </div>

                    {songTitle && (
                      <div className="w-full overflow-hidden bg-zinc-950/60 border border-zinc-900/80 rounded px-2 py-1 mb-1">
                        <MarqueeText
                          text={`CURRENT TRACK: ${songTitle}`}
                          className="text-[9.5px] font-mono text-zinc-300 font-bold uppercase tracking-wide"
                        />
                      </div>
                    )}

                    {selectedUserProfile.isYou && (
                      <div className="mt-2 pt-2 border-t border-zinc-900/80 text-left relative">
                        {!isEditingTopSong ? (
                          <div className="flex justify-end">
                            <button
                              onClick={() => setIsEditingTopSong(true)}
                              className="px-2 py-1 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-400 hover:text-[#39ff14] rounded-md transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest"
                              title="Edit Top Song"
                            >
                              <Pencil className="w-3 h-3" /> Edit Anthem
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">Update Anthem Matrix</span>
                              <button
                                onClick={() => {
                                  saveProfileData(true);
                                  setIsEditingTopSong(false);
                                  triggerNotification?.("💾 Anthem updated.");
                                }}
                                className="px-2 py-0.5 bg-[#39ff14]/10 hover:bg-[#39ff14]/20 border border-[#39ff14]/40 text-[#39ff14] text-[9.5px] font-mono font-bold rounded flex items-center gap-1 transition-all"
                              >
                                <Check className="w-3 h-3" /> Save Anthem
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-1">
                              🎸 Band / Artist Name
                            </div>
                            <input
                              type="text"
                              value={profileTopSongArtist}
                              onChange={(e) => {
                                const artist = e.target.value;
                                if (setProfileTopSongArtist) setProfileTopSongArtist(artist);
                                const fullTitle = artist && profileTopSongTitle ? `${artist} - ${profileTopSongTitle}` : (artist || profileTopSongTitle || 'None Selected');
                                setProfileFavoriteSong(fullTitle);
                                setSelectedUserProfile((prev: any) => prev ? { ...prev, favoriteSong: fullTitle, top_song_artist: artist, top_song_title: profileTopSongTitle || fullTitle } : null);
                                if (setUserProfile) { queueMicrotask(() => { setUserProfile((pPrev: any) => pPrev ? { ...pPrev, favoriteSong: fullTitle, top_song_artist: artist, top_song_title: profileTopSongTitle || fullTitle } : null); }); }
                                try {
                                  localStorage.setItem('nexus_favorite_song', fullTitle);
                                } catch(err){}
                              }}
                              onBlur={() => {
                                saveProfileData(true);
                                triggerNotification?.("💾 Band/Artist name updated.");
                              }}
                              placeholder="e.g. Dying Fetus"
                              className="w-full bg-black/80 border border-zinc-800 focus:border-emerald-500 rounded px-2 py-1 text-xs text-white font-mono outline-none"
                            />
                          </div>

                          <div>
                            <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-1">
                              🎵 Song / Track Name
                            </div>
                            <input
                              type="text"
                              value={profileTopSongTitle}
                              onChange={(e) => {
                                const title = e.target.value;
                                if (setProfileTopSongTitle) setProfileTopSongTitle(title);
                                const fullTitle = profileTopSongArtist && title ? `${profileTopSongArtist} - ${title}` : (profileTopSongArtist || title || 'None Selected');
                                setProfileFavoriteSong(fullTitle);
                                setSelectedUserProfile((prev: any) => prev ? { ...prev, favoriteSong: fullTitle, top_song_artist: profileTopSongArtist, top_song_title: title } : null);
                                if (setUserProfile) { queueMicrotask(() => { setUserProfile((pPrev: any) => pPrev ? { ...pPrev, favoriteSong: fullTitle, top_song_artist: profileTopSongArtist, top_song_title: title } : null); }); }
                                try {
                                  localStorage.setItem('nexus_favorite_song', fullTitle);
                                } catch(err){}
                              }}
                              onBlur={() => {
                                saveProfileData(true);
                                triggerNotification?.("💾 Song/Track title updated.");
                              }}
                              placeholder="e.g. Liege of Inveracity"
                              className="w-full bg-black/80 border border-zinc-800 focus:border-emerald-500 rounded px-2 py-1 text-xs text-white font-mono outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-1">
                            🔗 Embed URL (YouTube / Spotify / SoundCloud)
                          </div>
                          <input
                            type="text"
                            value={effTarget?.top_song_url || effTarget?.featured_youtube_url || (selectedUserProfile as any)?.top_song_url || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedUserProfile((prev: any) => prev ? { ...prev, top_song_url: val, featured_youtube_url: val } : null);
                              if (setProfileTopSongUrl) setProfileTopSongUrl(val);
                              if (setUserProfile) { queueMicrotask(() => { setUserProfile((pPrev: any) => pPrev ? { ...pPrev, top_song_url: val, featured_youtube_url: val } : null); }); }
                            }}
                            onBlur={() => {
                              saveProfileData(true);
                              triggerNotification?.("💾 Embed URL updated.");
                            }}
                            placeholder="https://www.youtube.com/watch?v=... or Spotify link"
                            className="w-full bg-black/80 border border-zinc-800 focus:border-emerald-500 rounded px-2 py-1 text-xs text-white font-mono outline-none"
                          />
                        </div>
                      </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Label specific: Upcoming Tours/Shows */}
              {(selectedUserProfile?.role || '').toLowerCase().includes('label') && (
                <div className="mt-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" /> Upcoming Roster Tours
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-900 rounded-lg p-2.5">
                      <div>
                        <p className="text-xs font-bold text-white">European Annihilation Tour</p>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">feat. Devourment, Gorgasm & Putrid Pile</p>
                      </div>
                      <span className="text-[10px] text-orange-400 font-bold bg-orange-950/30 px-2 py-1 rounded">AUG 2026</span>
                    </div>
                    <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-900 rounded-lg p-2.5">
                      <div>
                        <p className="text-xs font-bold text-white">East Coast Deathfest Showcase</p>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">feat. Putrid Pile, Cephalotripsy & Lust of Decay</p>
                      </div>
                      <span className="text-[10px] text-orange-400 font-bold bg-orange-950/30 px-2 py-1 rounded">SEP 2026</span>
                    </div>
                    <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-900 rounded-lg p-2.5">
                      <div>
                        <p className="text-xs font-bold text-white">Asian Sickness Campaign</p>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">feat. Devourment & Virulent Excision</p>
                      </div>
                      <span className="text-[10px] text-orange-400 font-bold bg-orange-950/30 px-2 py-1 rounded">OCT 2026</span>
                    </div>
                  </div>
                </div>
              )}

              {/* VIBE ENDORSEMENTS - GAMIFIED ENGAGEMENT */}
              {!(selectedUserProfile?.role || '').toLowerCase().includes('label') && (
                <div className="mt-4">
                  {(() => {
                    const r = (selectedUserProfile?.role || selectedUserProfile?.account_type || selectedUserProfile?.portalRole || selectedUserProfile?.type || '').toLowerCase();
                    const isArtist = r.includes('artist') || r.includes('band') || selectedUserProfile?.isBandProfile === true || selectedUserProfile?.isBand === true;
                    const isWorkspace = isArtist || 
                      selectedUserProfile?.isCreativeProfile === true || 
                      selectedUserProfile?.isLabelProfile === true || 
                      selectedUserProfile?.isPromoterProfile === true || 
                      r.includes('creative') || 
                      r.includes('designer') || 
                      r.includes('photographer') || 
                      r.includes('videographer') || 
                      r.includes('label') || 
                      r.includes('promoter') || 
                      r.includes('venue');
                    
                    if (isArtist) {
                      return (
                        <>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono mb-2 flex items-center gap-1.5 flex-wrap">
                            <Award className="w-3.5 h-3.5 text-emerald-500" />
                            EPK Analytics & Booking
                          </h3>
                          <div className="flex items-center justify-between gap-3 bg-zinc-900/30 border border-zinc-900/60 p-2.5 rounded-xl">
                            <div className="min-w-0 flex-1">
                              <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500 leading-none">Live Routing Status</div>
                              <div className="text-zinc-400 text-[10px] font-mono mt-1 font-bold">
                                {liveRoutingStats.toursCount} {liveRoutingStats.toursCount === 1 ? 'Tour' : 'Tours'} • {liveRoutingStats.showsCount} Active {liveRoutingStats.showsCount === 1 ? 'Date' : 'Dates'}
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setShowBandBookingModal(true);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black text-[10px] px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider font-mono shrink-0 shadow-md flex items-center gap-1 cursor-pointer active:scale-95 relative z-20"
                            >
                              📥 Book Band
                            </button>
                          </div>
                        </>
                      );
                    }
                    
                    // Sonic Footprint only on user accounts, not on any workspace profiles
                    if (!isWorkspace) {
                      return (
                        <div className="mt-2">
                          <SonicFootprint 
                            profile={selectedUserProfile} 
                            onActionClick={(actionLabel) => {
                              triggerNotification?.(`⚡ Navigating to ${actionLabel}...`);
                            }} 
                          />
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              )}

              {/* Profile Tabs Navigation */}
              {(() => {
                const r = (selectedUserProfile?.role || '').toLowerCase();
                const isArtist = r.includes('artist') || r.includes('band');
                const isLabel = r.includes('label');
                const isPromoter = r.includes('promoter');
                const isCreative = r.includes('creative');

                let tabButtons = [];
                if (isArtist || isLabel) {
                  tabButtons = [
                    { id: 'timeline', label: 'TIMELINE', icon: <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> },
                    { id: 'music', label: 'MUSIC', icon: <Disc className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> },
                    { id: 'gallery', label: 'PHOTO PIT', icon: <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> },
                    { id: 'shop', label: 'MERCH', icon: <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> }
                  ];
                } else if (isPromoter) {
                  tabButtons = [
                    { id: 'timeline', label: 'TIMELINE', icon: <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> },
                    { id: 'gallery', label: 'PHOTO PIT', icon: <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> },
                    { id: 'tickets', label: 'TICKETS', icon: <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> }
                  ];
                } else if (isCreative) {
                  tabButtons = [
                    { id: 'timeline', label: 'TIMELINE', icon: <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> },
                    { id: 'portfolio', label: 'PORTFOLIO', icon: <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> },
                    { id: 'gallery', label: 'PHOTO PIT', icon: <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> }
                  ];
                } else {
                  tabButtons = [
                    { id: 'timeline', label: 'TIMELINE', icon: <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> },
                    { id: 'gallery', label: 'PHOTO PIT', icon: <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> },
                    { id: 'collection', label: 'COLLECTION', icon: <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> }
                  ];
                }

                return (
                  <div className="mt-6 flex flex-nowrap overflow-x-auto hide-scrollbar items-center justify-start sm:justify-around border-b border-zinc-800 bg-zinc-950/60 p-1 sm:p-2 w-full gap-1 sm:gap-2">
                    {tabButtons.map((tab, idx) => {
                      const isActive = profileActiveTab === tab.id;
                      return (
                        <button
                          key={`${tab.id}-${idx}`}
                          onClick={() => setProfileActiveTab(tab.id)}
                          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-2.5 text-[10px] sm:text-xs font-bold tracking-tight sm:tracking-wider uppercase transition-all border-b-2 sm:flex-1 text-center ${
                            isActive
                              ? 'border-purple-500 text-purple-300 shadow-[0_10px_15px_-3px_rgba(168,85,247,0.3)] font-black'
                              : 'border-transparent text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {tab.icon}
                          <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Profile Tabs Content */}
              <div className="mt-4 min-h-[200px]">
                {profileActiveTab === 'portfolio' && (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div>
                        <h3 className="text-xs font-mono font-black uppercase text-fuchsia-400 tracking-wider flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-fuchsia-500" /> Client Portfolio Showcase
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Verified & completed client projects for artists, labels, and venues.
                        </p>
                      </div>
                      {selectedUserProfile.isYou && (
                        <button
                          onClick={() => triggerNotification?.("Add new portfolio project modal opened.")}
                          className="px-2.5 py-1 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-400 border border-fuchsia-500/30 rounded text-[10px] font-mono font-bold transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Project
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          title: "Devourment - Obscene Majesty Album Art",
                          client: "Relapse Records / Devourment",
                          category: "Album Artwork & Layout",
                          year: "2019",
                          status: "Verified & Delivered",
                          image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
                          desc: "Full cover illustration, inner gatefold vinyl layout, and digital press kit graphics."
                        },
                        {
                          title: "Cryptic Slaughter Tour Poster Series",
                          client: "Live Nation & Metal Blade",
                          category: "Print & Tour Branding",
                          year: "2023",
                          status: "Verified & Delivered",
                          image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
                          desc: "Limited edition screenprinted posters for 18 North American tour dates."
                        }
                      ].map((project, idx) => (
                        <div key={`promoter-proj-${project.title}-${idx}`} className="bg-zinc-950 border border-zinc-900 hover:border-fuchsia-500/40 rounded-xl overflow-hidden transition-all group">
                          <div className="relative h-36 overflow-hidden bg-black">
                            <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 border border-fuchsia-500/40 text-fuchsia-400 rounded text-[8px] font-mono font-bold uppercase">
                              {project.status}
                            </div>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 border border-zinc-800 text-zinc-300 rounded text-[8px] font-mono">
                              {project.category}
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="text-xs font-bold text-white group-hover:text-fuchsia-400 transition-colors">{project.title}</div>
                            <div className="text-[10px] text-fuchsia-400/80 font-mono mt-0.5">Client: {project.client} ({project.year})</div>
                            <p className="text-[10px] text-zinc-400 mt-1.5 line-clamp-2">{project.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profileActiveTab === 'tickets' && (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div>
                        <h3 className="text-xs font-mono font-black uppercase text-yellow-400 tracking-wider flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-yellow-500" /> Confirmed Shows & Event Passes
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Get official presale tickets, general admission, and VIP pass packages.
                        </p>
                      </div>
                      {selectedUserProfile.isYou && (
                        <button
                          onClick={() => triggerNotification?.("Create new ticket listing modal opened.")}
                          className="px-2.5 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30 rounded text-[10px] font-mono font-bold transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> List Event Tickets
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          title: "Brutal Deathfest IX 2026",
                          lineup: "Devourment, Gorgasm, Cephalotripsy, Putrid Pile",
                          venue: "The Palladium, Worcester MA",
                          date: "OCT 24, 2026 • 6:00 PM",
                          price: "$45.00",
                          status: "Selling Fast",
                          thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=200"
                        }
                      ].map((event, idx) => (
                        <div key={`promoter-ticket-${event.title}-${idx}`} className="bg-zinc-950 border border-zinc-900 hover:border-yellow-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-4 transition-all">
                          <img src={event.thumbnail} alt={event.title} className="w-20 h-20 rounded-lg object-cover border border-zinc-800 shrink-0" />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-[8px] font-mono font-bold uppercase">{event.status}</span>
                              <span className="text-[10px] font-mono text-zinc-500">{event.date}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-1 truncate">{event.title}</h4>
                            <div className="text-[11px] text-zinc-300 font-mono mt-0.5 truncate">{event.lineup}</div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-yellow-500" /> {event.venue}
                            </div>
                          </div>
                          <div className="flex flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-zinc-900 pt-2 sm:pt-0">
                            <span className="text-sm font-mono font-black text-yellow-400">{event.price}</span>
                            <button
                              onClick={() => {
                                openCheckout?.('ticket', { name: event.title, price: parseFloat(event.price.replace('$','')), venue: event.venue });
                                triggerNotification?.(`Adding ticket for ${event.title} to checkout...`);
                              }}
                              className="mt-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded text-[10px] uppercase font-mono transition-colors shadow-lg"
                            >
                              Buy Tickets
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profileActiveTab === 'collection' && (
                  <div className="space-y-4 text-left">
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

                          return (
                            <div className="space-y-4">
                              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl space-y-3">
                                <div className="text-center">
                                  <div className="text-[9px] font-mono text-zinc-500">NOW PLAYING</div>
                                  <div className="text-sm font-bold text-white mt-1 truncate">{activeMusicItem.data.title || activeMusicItem.data.name}</div>
                                  <div className="text-xs text-zinc-400 truncate">{activeMusicItem.data.band || activeMusicItem.data.artist || 'NEXUS'}</div>
                                </div>
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => setCollPlayerIsPlaying(!collPlayerIsPlaying)}
                                    className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full transition-all"
                                  >
                                    {collPlayerIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {musicItems.map((item, mIdx) => (
                                  <div
                                    key={item.id ? `music-${item.id}-${mIdx}` : `music-${mIdx}`}
                                    onClick={() => {
                                      setCollPlayerActiveId(item.id);
                                      setCollPlayerActiveTrackId(`${item.id}_t1`);
                                      setCollPlayerIsPlaying(true);
                                    }}
                                    className={`p-3 bg-zinc-950 rounded-xl border flex items-center gap-3 cursor-pointer ${item.id === activeMusicItem.id ? 'border-cyan-500/50' : 'border-zinc-900'}`}
                                  >
                                    <img src={item.data.thumbnail} className="w-10 h-10 rounded object-cover" alt="" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-bold text-white truncate">{item.data.title || item.data.name}</div>
                                      <div className="text-[10px] text-zinc-500 truncate">{item.data.band || item.data.artist}</div>
                                    </div>
                                  </div>
                                ))}
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
                                  onClick={() => setShowAddItemModal?.(true)}
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
                                <div className="space-y-2">
                                  {filteredItems.map((item, fIdx) => (
                                    <div key={item.id ? `item-${item.id}-${fIdx}` : `item-${fIdx}`} className="p-3 bg-zinc-950/60 border border-zinc-900 hover:border-zinc-700 transition-colors rounded-xl flex items-center gap-3 cursor-pointer">
                                      <img src={item.data.thumbnail || item.data.coverUrl || "https://placehold.co/150x150/18181b/ffffff?text=MERCH"} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-zinc-800" alt="" />
                                      <div className="flex-1 min-w-0 text-left">
                                        <div className="text-xs font-black text-zinc-100 truncate uppercase tracking-wider">{item.data.name || item.data.title || 'Nexus Item'}</div>
                                        <div className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">{item.data.bandName || item.data.band || item.data.venue || 'Nexus HQ'}</div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        {collectionTab === 'for_sale' && item.data.price && (
                                          <span className="text-xs font-bold text-emerald-400">${item.data.price.toFixed(2)}</span>
                                        )}
                                        <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded shadow-sm">x{item.quantity}</span>
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

                {profileActiveTab === 'timeline' && (
                  <TimelineTab
                    profileId={selectedUserProfile?.id}
                    userId={selectedUserProfile?.id}
                    profileName={selectedUserProfile?.name}
                    isYou={selectedUserProfile?.isYou}
                    selectedUserProfile={selectedUserProfile}
                    triggerPictureViewer={triggerPictureViewer}
                    triggerNotification={triggerNotification}
                  />
                )}

                {profileActiveTab === 'gallery' && (
                  <GalleryTab 
                    selectedUserProfile={selectedUserProfile}
                    userProfile={userProfile}
                    triggerPictureViewer={triggerPictureViewer}
                    setSelectedGalleryItem={setSelectedGalleryItem}
                    feed={feed}
                  />
                )}

                {profileActiveTab === 'tour' && (
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 text-center">
                    <MapPin className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-50" />
                    <h4 className="text-zinc-300 font-mono text-sm uppercase tracking-widest font-black mb-1">Live Itinerary</h4>
                    <p className="text-zinc-500 text-[10px] uppercase font-mono max-w-[200px] mx-auto">Routing schedules and confirmed dates are managed via the professional backend.</p>
                  </div>
                )}

                {profileActiveTab === 'shop' && (
                  <ProfileMarketplaceTab 
                    selectedUserProfile={selectedUserProfile} 
                    openCheckout={openCheckout} 
                    triggerNotification={triggerNotification} 
                  />
                )}

                {profileActiveTab === 'music' && (
                  (selectedUserProfile?.role || '').toLowerCase().includes('label') ? (
                    <div className="border border-orange-500/20 rounded-2xl bg-[#050507]/90 p-4">
                      <div className="flex items-center justify-between mb-3 border-b border-zinc-900/40 pb-2">
                        <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5 font-display">
                          <Disc className="w-3.5 h-3.5 text-orange-500 animate-spin-slow" /> Roster Audio Player
                        </span>
                        <select
                          value={selectedLabelBand}
                          onChange={(e) => {
                            setSelectedLabelBand(e.target.value);
                            triggerNotification?.(`Loading ${e.target.value}'s catalog matrix...`);
                          }}
                          className="bg-zinc-950 text-orange-400 text-[11px] font-black font-mono px-2 py-1 rounded-lg border border-orange-950/50 outline-none focus:border-orange-500/50 cursor-pointer"
                        >
                          {selectedUserProfile.associatedProfiles?.map((ap: any, apIdx: number) => (
                            <option key={ap?.name ? `ap-${ap.name}-${apIdx}` : `ap-${apIdx}`} value={ap?.name}>{ap?.name}</option>
                          ))}
                          {(!selectedUserProfile.associatedProfiles || selectedUserProfile.associatedProfiles.length === 0) && (
                             <option value="None">No Active Roster</option>
                          )}
                        </select>
                      </div>

                      {(() => {
                        const catalogs: Record<string, any> = ROSTER_CATALOGS || {};
                        const currentAlbum = catalogs[selectedLabelBand] || catalogs.Devourment;
                        if (!currentAlbum) return null;

                        return (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="flex items-center gap-5 p-2 bg-zinc-950/45 border border-zinc-900 rounded-xl">
                              <div className="relative w-24 h-24 shrink-0 group/cover">
                                <div className="absolute right-[-12px] top-2 bottom-2 w-full bg-zinc-950 rounded-full border border-zinc-850 shadow-inner flex items-center justify-center translate-x-1 group-hover/cover:translate-x-3 transition-transform duration-500 overflow-hidden z-0">
                                  <div className="w-8 h-8 rounded-full border border-zinc-900 flex items-center justify-center bg-zinc-950">
                                    <div className="w-3.5 h-3.5 rounded-full bg-orange-600/30" />
                                  </div>
                                </div>
                                <div className="absolute inset-0 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-lg z-10">
                                  <img src={currentAlbum.coverUrl} alt={currentAlbum.albumName} className="w-full h-full object-cover" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm md:text-base font-black text-white hover:text-orange-400 transition-colors truncate">
                                  {currentAlbum.albumName}
                                </h4>
                                <p className="text-xs text-orange-500 font-extrabold tracking-widest uppercase truncate mt-0.5">
                                  {selectedLabelBand}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                                  Release Year: {currentAlbum.releaseYear}
                                </p>
                              </div>
                            </div>

                            <div className="bg-black/60 border border-zinc-900/60 rounded-xl p-3.5 font-mono text-xs">
                              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-1 flex items-center justify-between">
                                <span>TRACKLIST PREVIEW</span>
                                <span className="text-orange-550 font-bold animate-pulse">● STEREO HIGH-BITRATE</span>
                              </div>
                              <div className="space-y-1.5 max-h-80 overflow-y-auto no-scrollbar pr-1">
                                {currentAlbum.tracks?.map((track: any, trackIdx: number) => (
                                  <div
                                    key={`promoter-track-${track.id || track.title || trackIdx}-${trackIdx}`}
                                    onClick={() => {
                                      triggerNotification?.(`Playing preview of "${track.title}" by ${selectedLabelBand}...`);
                                    }}
                                    className="flex items-center justify-between py-2 px-3 hover:bg-zinc-900/60 rounded-md cursor-pointer group/track transition-all"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="text-xs text-zinc-500 w-4 text-right">
                                        {String(trackIdx + 1).padStart(2, '0')}
                                      </span>
                                      <PlayCircle className="w-4 h-4 text-zinc-500 group-hover/track:text-orange-500 transition-colors shrink-0" />
                                      <span className="text-zinc-200 text-xs font-medium group-hover/track:text-white transition-colors truncate">
                                        {track.title}
                                      </span>
                                    </div>
                                    <span className="text-xs text-zinc-500 group-hover/track:text-zinc-400 transition-colors">
                                      {track.duration}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    selectedUserProfile.musicCatalog && selectedUserProfile.musicCatalog.length > 0 ? (
                      <div className="space-y-6">
                        {selectedUserProfile.musicCatalog.map((release: any, rIdx: number) => {
                          const coverSrc = getReleaseCoverUrl(release);
                          const relUniqueId = String(release.id || `prom-rel-${rIdx}-${(release.title || 'album').replace(/[^a-zA-Z0-9]/g, '_')}`);
                          const rawTracks = Array.isArray(release.tracks) ? release.tracks : [];
                          const releaseTracks = (rawTracks.length > 0
                            ? rawTracks
                            : (release.title ? [{ title: `${release.title} (Full Audio)`, duration: '3:45' }] : [])
                          ).map((t: any, tIdx: number) => {
                            const tTitle = typeof t === 'string' ? t : (t.title || t.name || `Track ${tIdx + 1}`);
                            const tDuration = (typeof t === 'object' && (t.duration || t.length)) ? (t.duration || t.length) : '3:30';
                            const rawId = typeof t === 'object' && t.id ? t.id : `trk-${tIdx + 1}`;
                            const uId = `${relUniqueId}_${rawId}`;
                            return {
                              ...(typeof t === 'object' ? t : {}),
                              id: uId,
                              originalId: rawId,
                              title: tTitle,
                              duration: tDuration,
                              trackNumber: (typeof t === 'object' && t.number) ? t.number : tIdx + 1
                            };
                          });

                          const isPlayingRelease = Boolean(
                            profileActivePlaybackTrackId &&
                            releaseTracks.some((t: any) => t.id === profileActivePlaybackTrackId)
                          );
                          const activeTrackObj = isPlayingRelease
                            ? (releaseTracks.find((t: any) => t.id === profileActivePlaybackTrackId) || releaseTracks[0])
                            : releaseTracks[0];
                          
                          return (
                            <div key={release.id ? `rel-${release.id}-${rIdx}` : `rel-${rIdx}`} className="bg-[#0c0e12] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
                              <div className="flex items-center justify-between p-3 border-b border-zinc-800/80 bg-black/40">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20 text-[8px] font-mono font-black uppercase tracking-widest">{release.format || release.type || 'Release'}</span>
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{release.title}</h4>
                                </div>
                                <button className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-[4px] text-[10px] font-black uppercase tracking-wider transition-colors shadow-lg">
                                  <ShoppingCart className="w-3 h-3" />
                                  <span>Buy • $9.99</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center bg-zinc-950">
                                <div className="md:col-span-4 flex justify-center">
                                  <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center group shrink-0">
                                    {coverSrc ? (
                                      <img 
                                        src={coverSrc} 
                                        alt={release.title || 'Album Cover'} 
                                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center justify-center p-3 text-center">
                                        <Disc className="w-10 h-10 text-zinc-600 mb-1" />
                                        <span className="text-[9px] font-mono text-zinc-500 uppercase">No Cover</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="md:col-span-8 flex flex-col items-center space-y-3 w-full">
                                  <div className="w-full flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest font-black">ACTIVE STEREO STREAM</span>
                                      <span className={`px-1.5 py-0.5 rounded-[2px] text-[7.5px] font-mono uppercase font-black tracking-widest flex items-center gap-1 ${isPlayingRelease && profileIsPlaying ? 'bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/30 animate-pulse' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>
                                        <span className={`w-1 h-1 rounded-full ${isPlayingRelease && profileIsPlaying ? 'bg-[#FF9900] animate-ping' : 'bg-zinc-700'}`} />
                                        {isPlayingRelease && profileIsPlaying ? 'PLAYING' : 'PAUSED'}
                                      </span>
                                    </div>

                                    <div className="w-full h-8 flex items-center justify-center bg-black/40 px-3 rounded-lg border border-zinc-900 max-w-md mx-auto mb-2">
                                      <span className="font-mono font-black text-xs uppercase tracking-wider text-[#FF9900] text-center truncate">
                                        {activeTrackObj ? (
                                          isPlayingRelease && profileIsPlaying 
                                            ? `▶ ${activeTrackObj.trackNumber ? `${activeTrackObj.trackNumber}. ` : ''}${activeTrackObj.title}` 
                                            : `${activeTrackObj.trackNumber ? `${activeTrackObj.trackNumber}. ` : ''}${activeTrackObj.title}`
                                        ) : 'NO DISC LOADED'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-center gap-3">
                                    <button 
                                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors active:scale-95 cursor-pointer"
                                      onClick={() => {
                                        if (releaseTracks.length > 0) {
                                          const currentIdx = releaseTracks.findIndex((t: any) => t.id === profileActivePlaybackTrackId);
                                          const prevIdx = currentIdx > 0 ? currentIdx - 1 : releaseTracks.length - 1;
                                          setProfileActivePlaybackTrackId(releaseTracks[prevIdx]?.id || null);
                                          setProfileIsPlaying(true);
                                        }
                                      }}
                                    >
                                      <SkipBack className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (isPlayingRelease) {
                                          setProfileIsPlaying(!profileIsPlaying);
                                        } else if (releaseTracks.length > 0) {
                                          setProfileActivePlaybackTrackId(releaseTracks[0].id);
                                          setProfileIsPlaying(true);
                                        }
                                      }} 
                                      className="p-3.5 bg-[#FF9900]/10 hover:bg-[#FF9900]/20 border border-[#FF9900]/30 text-[#FF9900] rounded-full transition-colors active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                                    >
                                      {isPlayingRelease && profileIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                    </button>
                                    <button 
                                      onClick={() => { 
                                        if (isPlayingRelease) {
                                          setProfileIsPlaying(false); 
                                          setProfilePlaybackProgress(0); 
                                          setProfileActivePlaybackTrackId(null); 
                                        }
                                      }} 
                                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors active:scale-95 cursor-pointer"
                                    >
                                      <Square className="w-4 h-4" />
                                    </button>
                                    <button 
                                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors active:scale-95 cursor-pointer"
                                      onClick={() => {
                                        if (releaseTracks.length > 0) {
                                          const currentIdx = releaseTracks.findIndex((t: any) => t.id === profileActivePlaybackTrackId);
                                          const nextIdx = (currentIdx >= 0 && currentIdx < releaseTracks.length - 1) ? currentIdx + 1 : 0;
                                          setProfileActivePlaybackTrackId(releaseTracks[nextIdx]?.id || null);
                                          setProfileIsPlaying(true);
                                        }
                                      }}
                                    >
                                      <SkipForward className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {releaseTracks.length > 0 && (
                                    <div className="w-full mt-2 pt-2 border-t border-zinc-900/80">
                                      <div className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-wider mb-1.5 flex items-center justify-between px-1">
                                        <span>TRACKLIST ({releaseTracks.length})</span>
                                        <span className="text-[7.5px] text-zinc-600">CLICK TO PLAY</span>
                                      </div>
                                      <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar pr-0.5">
                                        {releaseTracks.map((trk: any, tIdx: number) => {
                                          const isCurrentTrack = profileActivePlaybackTrackId === trk.id;
                                          const isCurrentPlaying = isCurrentTrack && profileIsPlaying;
                                          return (
                                            <div
                                              key={trk.id || `track-${tIdx}`}
                                              onClick={() => {
                                                if (isCurrentPlaying) {
                                                  setProfileIsPlaying(false);
                                                } else {
                                                  setProfileActivePlaybackTrackId(trk.id);
                                                  setProfileIsPlaying(true);
                                                }
                                              }}
                                              className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-all text-[11px] font-mono ${
                                                isCurrentTrack
                                                  ? 'bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/30 font-bold'
                                                  : 'bg-black/30 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-transparent'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[9px] text-zinc-500 w-4 shrink-0 text-right">
                                                  {String(trk.trackNumber || tIdx + 1).padStart(2, '0')}
                                                </span>
                                                {isCurrentPlaying ? (
                                                  <Pause className="w-3 h-3 text-[#FF9900] shrink-0 animate-pulse" />
                                                ) : (
                                                  <Play className="w-3 h-3 text-zinc-500 group-hover:text-[#FF9900] shrink-0" />
                                                )}
                                                <span className="truncate">{trk.title}</span>
                                              </div>
                                              {trk.duration && (
                                                <span className="text-[9px] text-zinc-500 shrink-0 ml-2">{trk.duration}</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-[#0c0e12] border border-orange-500/20 rounded-2xl p-8 text-center space-y-3">
                        <Disc className="w-12 h-12 text-orange-500/80 animate-spin-slow mx-auto" />
                        <h4 className="text-sm font-bold font-mono text-white uppercase tracking-wider">No Catalog Releases Published</h4>
                        <p className="text-xs text-zinc-500 font-mono max-w-sm mx-auto">
                          Official digital downloads and physical merch releases will be listed here. Use the highlight player on the profile header to stream featured audio.
                        </p>
                        {selectedUserProfile.isYou && (
                          <button
                            onClick={() => triggerNotification?.("Catalog release manager opened.")}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-mono font-bold transition-colors inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Upload Release Catalog
                          </button>
                        )}
                      </div>
                    )
                  )
                )}
              </div>

              {/* Centered Report Button at bottom of card */}
              {!selectedUserProfile.isYou && (
                <div className="mt-8 pt-4 border-t border-zinc-900/60 flex justify-center">
                  <button
                    onClick={() => setShowReportModal?.(true)}
                    className="px-4 py-2 bg-zinc-950 hover:bg-rose-950/20 border border-zinc-900 hover:border-rose-500/30 text-zinc-500 hover:text-rose-400 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 group"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-zinc-500 group-hover:text-rose-400" /> Report Profile
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* FULL WIDTH DIGITAL MUSIC PLAYER (rendered only for labels) */}
          {(selectedUserProfile?.role || '').toLowerCase().includes('label') && (() => {
            const catalogs: Record<string, any> = ROSTER_CATALOGS || {};
            const currentAlbum = catalogs[selectedLabelBand] || catalogs.Devourment;
            if (!currentAlbum) return null;
            const isPlayingRelease = (currentAlbum?.tracks || []).some((t: any) => t.id === profileActivePlaybackTrackId);
            const activeTrackObj = isPlayingRelease ? currentAlbum.tracks.find((t: any) => t.id === profileActivePlaybackTrackId) : currentAlbum.tracks[0];
            const formatOptions = currentAlbum.purchaseLinks || [];

            return (
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350, delay: 0.1 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg lg:max-w-xl xl:max-w-2xl shrink-0 bg-[#070709] rounded-[24px] border border-red-500/20 shadow-[0_0_50px_rgba(255,51,0,0.1)] p-5 md:p-6 font-mono overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,153,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,153,0,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute inset-2 rounded-[16px] border border-red-500/10 pointer-events-none" />

                <div className="flex flex-col items-center gap-4 mb-5 relative z-10">
                  <h2 className="text-white text-[13px] sm:text-sm font-bold tracking-[0.2em] flex items-center gap-2 whitespace-nowrap">
                    <Volume2 className="w-3.5 h-3.5 text-orange-500 animate-pulse shrink-0" />
                    DIGITAL MUSIC PLAYER
                  </h2>
                  
                  <div className="flex items-center justify-center gap-3 sm:gap-4 shrink-0 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest hidden sm:inline">Band:</span>
                      <div className="relative flex items-center">
                        <select
                          value={selectedLabelBand}
                          onChange={(e) => {
                            setSelectedLabelBand(e.target.value);
                            const firstTrack = (ROSTER_CATALOGS as any)[e.target.value]?.tracks?.[0]?.id || null;
                            setProfileActivePlaybackTrackId(firstTrack);
                            setProfileIsPlaying(true);
                            setProfilePlaybackProgress(0);
                            triggerNotification?.(`Loading ${e.target.value}'s catalog matrix...`);
                          }}
                          className="bg-black border border-orange-500/30 text-orange-400 text-[10px] uppercase font-bold tracking-widest pl-3 pr-7 py-1.5 rounded-full outline-none cursor-pointer appearance-none min-w-[120px] text-center shadow-[0_0_10px_rgba(255,153,0,0.1)]"
                        >
                          <option value="Devourment">Devourment</option>
                          <option value="Gorgasm">Gorgasm</option>
                          <option value="Lust of Decay">Lust of Decay</option>
                          <option value="Putrid Pile">Putrid Pile</option>
                          <option value="Cephalotripsy">Cephalotripsy</option>
                          <option value="Virulent Excision">Virulent Excision</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-orange-500 absolute right-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-5 relative z-10">
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                    <div className="absolute inset-0 bg-black rounded-3xl border border-zinc-800 shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center group">
                      {/* Glow Behind */}
                      <div 
                        className="absolute inset-0 bg-orange-500/10 rounded-3xl blur-xl transition-opacity duration-500" 
                        style={{ opacity: profileIsPlaying && isPlayingRelease ? 0.7 : 0.2 }} 
                      />

                      {currentAlbum?.coverUrl ? (
                        <img 
                          src={currentAlbum.coverUrl} 
                          alt={currentAlbum.albumName} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-center">
                          <Disc className="w-12 h-12 text-orange-500 mb-2 opacity-80" />
                          <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase">OFFICIAL COVER ART</span>
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />

                      {/* Bottom Badges */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-zinc-800 text-[8px] font-mono text-orange-400 uppercase tracking-widest font-bold truncate max-w-[120px]">
                          {selectedLabelBand}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-zinc-800 text-[7.5px] font-mono text-zinc-400 uppercase font-bold">
                          {currentAlbum.releaseYear || 'HI-FI'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-3 mb-5 relative z-10">
                  <div className="flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] sm:text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5 ${isPlayingRelease && profileIsPlaying ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPlayingRelease && profileIsPlaying ? 'bg-orange-500 animate-pulse' : 'bg-zinc-500'}`} />
                      {isPlayingRelease && profileIsPlaying ? 'PLAYING' : 'PAUSED'}
                    </span>
                  </div>

                  <div className="bg-black border border-zinc-900/80 rounded-xl py-2.5 px-4 mx-auto max-w-md text-orange-500 shadow-inner">
                    <h3 className="text-xs sm:text-sm font-bold tracking-wider truncate">
                      {activeTrackObj?.title?.toUpperCase()}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-5 relative z-10">
                  <button className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"><SkipBack className="w-4 h-4" /></button>
                  <button 
                    onClick={() => {
                      if (profileIsPlaying && isPlayingRelease) {
                        setProfileIsPlaying(false);
                      } else {
                        if (!profileActivePlaybackTrackId || !isPlayingRelease) {
                          setProfileActivePlaybackTrackId(activeTrackObj?.id);
                        }
                        setProfileIsPlaying(true);
                      }
                    }}
                    className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border border-orange-500/40 rounded-full text-orange-400 hover:bg-orange-500/10 transition-colors"
                  >
                    {isPlayingRelease && profileIsPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-1" />}
                  </button>
                  <button 
                    onClick={() => {
                      setProfileIsPlaying(false);
                      setProfilePlaybackProgress(0);
                      setProfileActivePlaybackTrackId(null);
                    }}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"><SkipForward className="w-4 h-4" /></button>
                </div>

                <div className="border-t border-zinc-900 mt-5 pt-5 relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-4 font-mono">
                    ORDER FORMATS
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {formatOptions.map((link: any, idx: number) => (
                      <button
                        key={`format-${link.format || idx}`}
                        onClick={() => {
                          openCheckout?.('merch', {
                            name: `${selectedLabelBand} - ${currentAlbum.albumName} (${link.format})`,
                            price: parseFloat(link.price.replace('$', '')),
                            thumbnail: currentAlbum.coverUrl,
                            sizes: [],
                            bandName: selectedLabelBand
                          });
                          triggerNotification?.(`Adding ${selectedLabelBand} - ${currentAlbum.albumName} (${link.format}) to order...`);
                        }}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 hover:border-orange-500/40 bg-zinc-950 hover:bg-orange-950/20 text-center transition-all cursor-pointer group/btn shadow-inner"
                      >
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1.5 text-zinc-400 group-hover/btn:text-orange-400 transition-colors">
                          {link.format === 'Vinyl' ? (
                            <Disc className="w-4 h-4 text-orange-500" />
                          ) : link.format === 'CD' ? (
                            <Music className="w-4 h-4 text-orange-500" />
                          ) : (
                            <Download className="w-4 h-4 text-orange-500" />
                          )}
                          {link.format}
                        </span>
                        <span className="text-[11px] sm:text-xs font-mono font-black text-zinc-500 group-hover/btn:text-white mt-1.5 transition-colors">
                          {link.price}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </motion.div>
      )}
    </AnimatePresence>

    {/* FORMAL BAND BOOKING TRANSMISSION MODAL */}
    <BandBookingModal
      key="promoter-band-booking-modal"
      isOpen={showBandBookingModal}
      onClose={() => setShowBandBookingModal(false)}
      targetProfile={selectedUserProfile || targetProfile || fetchedBandData || linkedBandData}
      userProfile={userProfile}
      triggerNotification={triggerNotification}
    />
  </>
  );
};
