import { useState, useEffect, useRef } from 'react';
import { profileStore } from '../utils/indexedDB';
import { getSupabase, executeWithSchemaResilience, executeSanitizedProfileUpsert, sanitizeCreativePayload, formatCreativePayload, extractGlobalProfilePayload, sanitizeBandPayload } from '../supabase';
import { resolveBandLogo, resolveBandCover, resolveBandHandle, resolveBandName, resolveBandBio, resolveBandLocation } from '../utils/bandProfileUtils';

export interface UseUserProfileStateProps {
  portalRole: string;
  userProfile?: any;
  activeBand?: any;
  setUserProfile?: (u: any) => void;
}

export function useUserProfileState({
  portalRole,
  userProfile,
  activeBand,
  setUserProfile,
}: UseUserProfileStateProps) {
  const isLoadedRef = useRef(false);

  // User Profile PIN Protection States
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinEntered, setPinEntered] = useState('');
  const [pinError, setPinError] = useState('');

  // User Profile Custom States
  const [profileFullLegalName, setProfileFullLegalName] = useState(() => {
    if (portalRole === 'band') {
      return resolveBandName(activeBand, userProfile);
    }
    if (portalRole === 'creative') {
      return userProfile?.creative_metadata?.business_name || userProfile?.creative_name || 'Pro Creative';
    }
    if (portalRole === 'promoter') {
      return userProfile?.promoter_metadata?.brand_name || userProfile?.promoter_brand || 'Pro Promoter';
    }
    if (portalRole === 'label') {
      return userProfile?.label_company_name || 'Pro Label';
    }

    const savedLegalName = typeof window !== 'undefined' ? (localStorage.getItem('nexus_full_legal_name') || localStorage.getItem('nexus_user_full_name')) : null;
    if (savedLegalName && savedLegalName.trim() !== '') return savedLegalName;

    if (portalRole === 'fan_only') {
      return userProfile?.full_name || userProfile?.legal_name || userProfile?.screen_name || userProfile?.name || 'Fan Listener';
    }
    if (portalRole === 'industry_pro') {
      return userProfile?.full_name || userProfile?.legal_name || userProfile?.name || 'Industry Pro';
    }

    if (userProfile?.full_name || userProfile?.legal_name) {
      return userProfile.full_name || userProfile.legal_name || '';
    }
    if (userProfile?.name && userProfile.name !== 'New User' && userProfile.name !== '') {
      return userProfile.name;
    }
    return 'Fan Listener';
  });

  const [profileHandle, setProfileHandle] = useState(() => {
    if (portalRole === 'band') {
      return resolveBandHandle(activeBand, userProfile);
    }
    if (portalRole === 'creative') {
      const rawC = userProfile?.creative_handle || userProfile?.creative_metadata?.business_name || 'creative_pro';
      return rawC.replace(/^@+/, '').replace(/\s+/g, '_');
    }
    if (portalRole === 'promoter') {
      const rawP = userProfile?.promoter_handle || userProfile?.promoter_metadata?.brand_name || 'promoter_pro';
      return rawP.replace(/^@+/, '').replace(/\s+/g, '_');
    }
    if (portalRole === 'label') {
      const rawL = userProfile?.label_url_slug || userProfile?.label_company_name || 'label_pro';
      return rawL.replace(/^@+/, '').replace(/\s+/g, '_');
    }

    if (userProfile?.console_handle && userProfile.console_handle !== '') {
      return userProfile.console_handle.replace(/^@+/, '');
    }
    if (portalRole === 'fan_only') {
      return userProfile?.screen_name?.replace(/^@+/, '').replace(/\s+/g, '') || 'fan_core';
    }
    if (userProfile?.screen_name && userProfile.screen_name !== '') {
      return userProfile.screen_name.replace(/^@+/, '').replace(/\s+/g, '');
    }
    if (userProfile?.name && userProfile.name !== 'New User' && userProfile.name !== '') {
      return userProfile.name.replace(/^@+/, '').replace(/\s+/g, '');
    }
    return 'pro_user';
  });

  const [profileEmail, setProfileEmail] = useState(userProfile?.email || '');
  const [profilePassword, setProfilePassword] = useState('hardcore123');
  const [profilePin, setProfilePin] = useState(userProfile?.pin || '123456');
  const [profileLocation, setProfileLocation] = useState(() => {
    if (portalRole === 'band') {
      if (activeBand?.city && (activeBand?.state || activeBand?.state_province)) {
        return `${activeBand.city}, ${activeBand.state || activeBand.state_province}, ${activeBand.country || 'USA'}`;
      }
      return activeBand?.homebase || activeBand?.city || activeBand?.location || (userProfile?.city && userProfile?.state_province ? `${userProfile.city}, ${userProfile.state_province}` : 'Denison, TX, USA');
    }
    if (portalRole === 'label' && (userProfile?.label_headquarters || userProfile?.city)) {
      return userProfile.label_headquarters || userProfile.city;
    }
    if (portalRole === 'creative' && userProfile?.creative_metadata?.city) {
      return userProfile.creative_metadata.city;
    }
    if (portalRole === 'promoter' && userProfile?.promoter_metadata?.city) {
      return userProfile.promoter_metadata.city;
    }
    const signupLocation = (userProfile?.city && userProfile?.state_province) ? `${userProfile.city}, ${userProfile.state_province}` : null;
    if (portalRole === 'fan_only') return signupLocation || userProfile?.city_state || userProfile?.location_code || 'Denison, TX';
    return signupLocation || userProfile?.city_state || userProfile?.location_code || 'Detroit, MI';
  });

  const [profileZip, setProfileZip] = useState(userProfile?.zip_code || '');
  const [profileGenres, setProfileGenres] = useState<string[]>(() => {
    if (portalRole === 'fan_only') return ['Goregrind', 'Slam', 'Brutal Death Metal', 'Death Metal'];
    return ['Death Metal', 'Technical Death Metal', 'Grindcore'];
  });

  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [genreClusterExpanded, setGenreClusterExpanded] = useState(false);
  const [profilePrimaryGenres, setProfilePrimaryGenres] = useState<string[]>(['Goregrind', 'Slamming BDM']);
  const [profileMicroGenres, setProfileMicroGenres] = useState<string[]>(['Groovy Goregrind', 'Cybergrind']);

  const parseSongParts = (raw: string) => {
    if (!raw || raw === 'None Selected') return { artist: '', title: '' };
    if (raw.includes(' - ')) {
      const parts = raw.split(' - ');
      return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
    }
    return { artist: '', title: raw.trim() };
  };

  const initialSongParts = parseSongParts(userProfile?.top_song_title || userProfile?.favoriteSong || '');
  const [profileTopSongArtist, setProfileTopSongArtist] = useState<string>(initialSongParts.artist);
  const [profileTopSongTitle, setProfileTopSongTitle] = useState<string>(initialSongParts.title);

  const [profileFavoriteSong, setProfileFavoriteSong] = useState<string>(() => {
    return userProfile?.top_song_title || userProfile?.favoriteSong || '';
  });
  const [profileTopSongUrl, setProfileTopSongUrl] = useState<string>(() => {
    return userProfile?.top_song_url || '';
  });

  useEffect(() => {
    if (userProfile?.top_song_url && userProfile.top_song_url !== profileTopSongUrl) {
      setProfileTopSongUrl(userProfile.top_song_url);
    }
    const titleVal = userProfile?.top_song_title || userProfile?.favoriteSong;
    if (titleVal && titleVal !== profileFavoriteSong) {
      setProfileFavoriteSong(titleVal);
      const parts = parseSongParts(titleVal);
      if (parts.artist) setProfileTopSongArtist(parts.artist);
      if (parts.title) setProfileTopSongTitle(parts.title);
    }
  }, [userProfile?.top_song_url, userProfile?.top_song_title, userProfile?.favoriteSong]);
  const [profileMetalArchivesUrl, setProfileMetalArchivesUrl] = useState<string>(() => {
    return userProfile?.metal_archives_url || userProfile?.metal_archives || '';
  });

  const [profileSceneCred, setProfileSceneCred] = useState(0);
  const [digitalTicketsScanned, setDigitalTicketsScanned] = useState(0);
  const [physicalMerchBought, setPhysicalMerchBought] = useState(0);
  const [bandsDiscovered, setBandsDiscovered] = useState(0);

  useEffect(() => {
    setProfileSceneCred(digitalTicketsScanned * 20 + physicalMerchBought * 50 + bandsDiscovered * 30);
  }, [digitalTicketsScanned, physicalMerchBought, bandsDiscovered]);

  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(() => {
    if (portalRole === 'band') {
      return resolveBandLogo(activeBand, userProfile);
    }
    if (portalRole === 'label') return userProfile?.label_avatar || null;
    if (portalRole === 'creative') return userProfile?.creative_avatar || userProfile?.creative_metadata?.avatar_url || null;
    if (portalRole === 'promoter') return (userProfile as any)?.promoter_logo || userProfile?.promoter_metadata?.logo_url || null;
    if (portalRole === 'fan_only') {
      return userProfile?.avatar_url || 'FL';
    }

    if (userProfile?.avatar_url && userProfile.avatar_url !== 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20Circuits.png') {
      return userProfile.avatar_url;
    }
    return userProfile?.avatar_url || null;
  });

  const [profileCoverUrl, setProfileCoverUrl] = useState<string | null>(() => {
    if (portalRole === 'band') {
      return resolveBandCover(activeBand, userProfile);
    }
    if (portalRole === 'label') return userProfile?.label_banner || null;
    if (portalRole === 'creative') return userProfile?.creative_banner || userProfile?.creative_metadata?.banner_url || null;
    if (portalRole === 'promoter') return (userProfile as any)?.promoter_cover_image || userProfile?.promoter_metadata?.banner_url || null;
    if (portalRole === 'fan_only') return userProfile?.banner_url || null;

    if (userProfile?.banner_url) {
      return userProfile.banner_url;
    }
    return userProfile?.banner_url || null;
  });

  // Image Cropper & Adjuster States
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<'avatar' | 'cover'>('avatar');

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let avatar: string | null = null;
    if (portalRole === 'band') {
      avatar = resolveBandLogo(activeBand, userProfile);
    } else if (portalRole === 'label') {
      avatar = userProfile?.label_avatar || null;
    } else if (portalRole === 'creative') {
      avatar = userProfile?.creative_avatar || userProfile?.creative_metadata?.avatar_url || null;
    } else if (portalRole === 'promoter') {
      avatar = (userProfile as any)?.promoter_logo || userProfile?.promoter_metadata?.logo_url || null;
    } else if (portalRole === 'fan_only') {
      avatar = userProfile?.avatar_url || 'FL';
    } else {
      avatar = userProfile?.avatar_url || null;
    }

    setProfileAvatarUrl(avatar);
  }, [
    portalRole, 
    activeBand?.id, 
    activeBand?.logo_url, 
    activeBand?.avatar_url, 
    activeBand?.avatar, 
    activeBand?.image, 
    activeBand?.name,
    userProfile?.band_logo, 
    userProfile?.avatar_url, 
    userProfile?.label_avatar, 
    userProfile?.creative_avatar, 
    (userProfile as any)?.promoter_logo, 
    userProfile?.email
  ]);

  useEffect(() => {
    let cover: string | null = null;
    if (portalRole === 'band') {
      cover = resolveBandCover(activeBand, userProfile);
    } else if (portalRole === 'label') {
      cover = userProfile?.label_banner || null;
    } else if (portalRole === 'creative') {
      cover = userProfile?.creative_banner || userProfile?.creative_metadata?.banner_url || null;
    } else if (portalRole === 'promoter') {
      cover = (userProfile as any)?.promoter_cover_image || userProfile?.promoter_metadata?.banner_url || null;
    } else if (portalRole === 'fan_only') {
      cover = userProfile?.banner_url || null;
    } else {
      cover = userProfile?.banner_url || null;
    }

    setProfileCoverUrl(cover);
  }, [
    portalRole, 
    activeBand?.id, 
    activeBand?.cover_url, 
    activeBand?.banner_url, 
    activeBand?.name,
    userProfile?.band_cover, 
    userProfile?.banner_url, 
    userProfile?.label_banner, 
    userProfile?.creative_banner, 
    (userProfile as any)?.promoter_cover_image, 
    userProfile?.email
  ]);

  useEffect(() => {
    let name = '';
    if (portalRole === 'band') {
      name = resolveBandName(activeBand, userProfile);
    } else if (portalRole === 'creative') {
      name = userProfile?.creative_metadata?.business_name || userProfile?.creative_name || 'Pro Creative';
    } else if (portalRole === 'promoter') {
      name = userProfile?.promoter_metadata?.brand_name || userProfile?.promoter_brand || 'Pro Promoter';
    } else if (portalRole === 'label') {
      name = userProfile?.label_company_name || 'Pro Label';
    } else if (portalRole === 'fan_only') {
      name = userProfile?.full_name || userProfile?.legal_name || userProfile?.screen_name || userProfile?.name || 'Fan Listener';
    } else if (portalRole === 'industry_pro') {
      name = userProfile?.full_name || userProfile?.legal_name || userProfile?.name || 'Industry Pro';
    } else if (userProfile?.full_name || userProfile?.legal_name) {
      name = userProfile.full_name || userProfile.legal_name || '';
    } else if (userProfile?.name && userProfile.name !== 'New User' && userProfile.name !== '') {
      name = userProfile.name;
    } else {
      name = userProfile?.name || '';
    }

    if (name) {
      setProfileFullLegalName(name);
    }

    let handle = '';
    if (portalRole === 'band') {
      handle = resolveBandHandle(activeBand, userProfile);
    } else if (portalRole === 'creative') {
      const rawC = userProfile?.creative_handle || userProfile?.creative_metadata?.business_name || 'creative_pro';
      handle = rawC.replace(/^@+/, '').replace(/\s+/g, '_');
    } else if (portalRole === 'promoter') {
      const rawP = userProfile?.promoter_handle || userProfile?.promoter_metadata?.brand_name || 'promoter_pro';
      handle = rawP.replace(/^@+/, '').replace(/\s+/g, '_');
    } else if (portalRole === 'label') {
      const rawL = userProfile?.label_url_slug || userProfile?.label_company_name || 'label_pro';
      handle = rawL.replace(/^@+/, '').replace(/\s+/g, '_');
    } else if (portalRole === 'fan_only') {
      handle = (userProfile?.screen_name || userProfile?.console_handle || userProfile?.name || 'fan_core').replace(/^@+/, '').replace(/\s+/g, '');
    } else if (userProfile?.console_handle && userProfile.console_handle !== '') {
      handle = userProfile.console_handle.replace(/^@+/, '');
    } else if (userProfile?.screen_name && userProfile.screen_name !== '') {
      handle = userProfile.screen_name.replace(/^@+/, '').replace(/\s+/g, '');
    } else if (userProfile?.name && userProfile.name !== 'New User' && userProfile.name !== '') {
      handle = userProfile.name.replace(/^@+/, '').replace(/\s+/g, '');
    } else {
      handle = 'fan_core';
    }

    if (handle) {
      setProfileHandle(handle);
    }
  }, [
    portalRole,
    userProfile?.name,
    userProfile?.screen_name,
    userProfile?.console_handle,
    userProfile?.bandName,
    userProfile?.band_name,
    activeBand?.id,
    activeBand?.name,
    activeBand?.custom_slug,
    activeBand?.handle,
    userProfile?.creative_metadata?.business_name,
    userProfile?.promoter_metadata?.brand_name,
    userProfile?.label_company_name,
    userProfile?.label_url_slug,
    userProfile?.email
  ]);

  const [profileSceneRoles, setProfileSceneRoles] = useState<string[]>(() => {
    if (portalRole === 'band') return ['Artist'];
    if (portalRole === 'creative') return ['Creative'];
    if (portalRole === 'promoter') return ['Promoter'];
    if (portalRole === 'label') return ['Record Label'];
    return ['Purely a Supporter'];
  });

  const [profileBlurb, setProfileBlurb] = useState(() => {
    if (portalRole === 'band') {
      return resolveBandBio(activeBand, userProfile);
    }
    if (portalRole === 'creative') {
      return userProfile?.creative_metadata?.bio || userProfile?.creative_bio || 'Professional creative specialist on the Nexus network.';
    }
    if (portalRole === 'promoter') {
      return userProfile?.promoter_metadata?.bio || userProfile?.promoter_bio || 'Concert promoter and event organizer on Nexus.';
    }
    if (portalRole === 'label') {
      return userProfile?.label_bio || 'Official record label on Nexus.';
    }
    if (userProfile?.bio) return userProfile.bio;
    if (userProfile?.profileBlurb) return userProfile.profileBlurb;
    return '';
  });

  useEffect(() => {
    let freshBio = '';
    if (portalRole === 'band') {
      freshBio = resolveBandBio(activeBand, userProfile);
    } else if (portalRole === 'creative') {
      freshBio = userProfile?.creative_metadata?.bio || userProfile?.creative_bio || 'Professional creative specialist on the Nexus network.';
    } else if (portalRole === 'promoter') {
      freshBio = userProfile?.promoter_metadata?.bio || userProfile?.promoter_bio || 'Concert promoter and event organizer on Nexus.';
    } else if (portalRole === 'label') {
      freshBio = userProfile?.label_bio || 'Official record label on Nexus.';
    } else {
      freshBio = userProfile?.bio || userProfile?.profileBlurb || '';
    }

    if (freshBio && freshBio !== profileBlurb) {
      setProfileBlurb(freshBio);
    }
  }, [portalRole, activeBand?.id, activeBand?.name, activeBand?.bio, activeBand?.description, userProfile?.band_bio, userProfile?.creative_metadata?.bio, userProfile?.creative_bio, userProfile?.promoter_metadata?.bio, userProfile?.promoter_bio, userProfile?.label_bio, userProfile?.bio, userProfile?.profileBlurb]);

  const [profileStealthMode, setProfileStealthMode] = useState(false);
  const [filterHideTicketPresales, setFilterHideTicketPresales] = useState(false);
  const [filterShowMerchDropsOnlyFromFollowed, setFilterShowMerchDropsOnlyFromFollowed] = useState(false);
  const [filterShowFollowedOnly, setFilterShowFollowedOnly] = useState(false);
  const [prefPushNotifications, setPrefPushNotifications] = useState(true);
  const [prefLocationServices, setPrefLocationServices] = useState(false);

  const saveProfileData = (finalSave: boolean = false) => {
    const combinedGenres = Array.from(new Set([
      ...profilePrimaryGenres,
      ...profileMicroGenres,
      ...profileGenres
    ])).filter(Boolean);

    const dataToSave = {
      profileFullLegalName,
      profileHandle,
      profileEmail,
      profilePassword,
      profilePin,
      profileLocation,
      profileGenres: combinedGenres,
      profilePrimaryGenres,
      profileMicroGenres,
      profileFavoriteSong,
      profileTopSongArtist,
      profileTopSongTitle,
      profileTopSongUrl,
      profileAvatarUrl,
      profileCoverUrl,
      profileSceneRoles,
      profileBlurb,
      profileStealthMode,
      filterHideTicketPresales,
      filterShowMerchDropsOnlyFromFollowed,
      filterShowFollowedOnly,
      prefPushNotifications,
      prefLocationServices,
      timestamp: Date.now()
    };

    const profileCacheKey = `nexus_${portalRole}_profile_v1_${userProfile?.id || 'guest'}`;

    try {
      localStorage.setItem(profileCacheKey, JSON.stringify(dataToSave));
      if (portalRole === 'band') {
        if (activeBand?.id) {
          if (profileAvatarUrl) localStorage.setItem(`nexus_band_logo_${activeBand.id}`, profileAvatarUrl);
          if (profileCoverUrl) localStorage.setItem(`nexus_core_band_cover_${activeBand.id}`, profileCoverUrl);
          localStorage.setItem(`nexus_band_bio_${activeBand.id}`, profileBlurb);
        }
      } else if (portalRole === 'fan_only' || portalRole === 'industry_pro') {
        if (profileAvatarUrl) localStorage.setItem('nexus_user_avatar', profileAvatarUrl);
        if (profileCoverUrl) localStorage.setItem('nexus_user_banner', profileCoverUrl);
        localStorage.setItem('nexus_user_bio', profileBlurb);
      }
    } catch (err) {
      console.error("Failed to write to localStorage:", err);
    }

    try {
      profileStore.setItem(`active_${portalRole}_${userProfile?.id || 'guest'}`, dataToSave).catch(e => console.warn("profileStore write warning:", e));
    } catch (err) {
      console.warn("Failed to write to IndexedDB profileStore:", err);
    }

    if (setUserProfile) {
      setUserProfile((prev: any) => prev ? {
        ...prev,
        avatar: profileAvatarUrl || prev?.avatar,
        avatar_url: profileAvatarUrl || prev?.avatar_url,
        logo_url: profileAvatarUrl || prev?.logo_url,
        banner: profileCoverUrl || prev?.banner,
        banner_url: profileCoverUrl || prev?.banner_url,
        cover_url: profileCoverUrl || prev?.cover_url,
      } : prev);
    }

    if (profileAvatarUrl && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_avatar_updated', {
        detail: {
          id: userProfile?.id,
          avatarUrl: profileAvatarUrl,
          avatar_url: profileAvatarUrl,
          logo_url: profileAvatarUrl,
          logoUrl: profileAvatarUrl,
          authorName: profileFullLegalName || userProfile?.name || 'User',
          authorRole: portalRole || 'User'
        }
      }));
    }

    if (userProfile?.id && userProfile?.id !== 'guest') {
      const supabase = getSupabase();
      if (supabase) {
        const fullTopSong = profileTopSongTitle
          ? (profileTopSongArtist ? `${profileTopSongArtist} - ${profileTopSongTitle}` : profileTopSongTitle)
          : profileFavoriteSong;

        const finalTopSongUrl = profileTopSongUrl.trim() || userProfile?.top_song_url || '';

        // 1. Separate Workspace Save: Save to specific workspace tables if in a professional portal
        if (portalRole === 'band') {
          const bandId = activeBand?.id || userProfile?.band_id || userProfile?.id;
          if (bandId) {
            const bandPayload = {
              id: bandId,
              band_name: profileFullLegalName || activeBand?.name || userProfile?.name,
              name: profileFullLegalName || activeBand?.name || userProfile?.name,
              logo_url: profileAvatarUrl || activeBand?.logo_url,
              avatar_url: profileAvatarUrl || activeBand?.logo_url,
              cover_url: profileCoverUrl || activeBand?.cover_url,
              banner_url: profileCoverUrl || activeBand?.cover_url,
              bio: profileBlurb || activeBand?.bio,
              micro_genres: combinedGenres,
              city: profileLocation,
              creator_id: userProfile.id,
            };
            const sanitizedBand = sanitizeBandPayload(bandPayload);
            executeWithSchemaResilience(
              async (payload) => await supabase.from('bands').upsert([payload]),
              sanitizedBand
            ).then(({ error }) => {
              if (error) console.error('[Supabase Band Profile Sync Error]:', error);
              else {
                console.log('[Supabase Band Profile Sync Success] Band profile saved.');
                window.dispatchEvent(new CustomEvent('nexus_band_updated', { detail: sanitizedBand }));
              }
            });
          }
        } else if (portalRole === 'creative') {
          const creativeId = userProfile?.creative_id || userProfile?.registered_creative_id;
          if (creativeId) {
            const creativePayload = sanitizeCreativePayload({
              id: creativeId,
              business_name: profileFullLegalName,
              avatar_url: profileAvatarUrl,
              banner_url: profileCoverUrl,
              bio: profileBlurb,
              genres: combinedGenres,
              city: profileLocation,
            });
            executeWithSchemaResilience(
              async (payload) => await supabase.from('creatives').upsert(payload, { onConflict: 'id' }),
              creativePayload
            ).then(({ error }) => {
              if (error) console.error('[Supabase Creative Profile Sync Error]:', error);
              else console.log('[Supabase Creative Profile Sync Success] Creative profile saved.');
            });
          }
        } else if (portalRole === 'promoter') {
          const promoterId = userProfile?.promoter_id || userProfile?.registered_promoter_id;
          if (promoterId) {
            const promoterPayload = {
              id: promoterId,
              brand_name: profileFullLegalName,
              promoter_logo: profileAvatarUrl,
              promoter_cover_image: profileCoverUrl,
              bio: profileBlurb,
              genres: combinedGenres,
              city: profileLocation,
            };
            executeWithSchemaResilience(
              async (payload) => await supabase.from('promoters').upsert([payload]),
              promoterPayload
            ).then(({ error }) => {
              if (error) console.error('[Supabase Promoter Profile Sync Error]:', error);
              else console.log('[Supabase Promoter Profile Sync Success] Promoter profile saved.');
            });
          }
        } else if (portalRole === 'label') {
          const labelId = userProfile?.label_id || userProfile?.registered_label_id;
          if (labelId) {
            const labelPayload = {
              id: labelId,
              label_company_name: profileFullLegalName,
              label_avatar: profileAvatarUrl,
              label_banner: profileCoverUrl,
              bio: profileBlurb,
              genres: combinedGenres,
              label_headquarters: profileLocation,
            };
            executeWithSchemaResilience(
              async (payload) => await supabase.from('labels').upsert([payload]),
              labelPayload
            ).then(({ error }) => {
              if (error) console.error('[Supabase Label Profile Sync Error]:', error);
              else console.log('[Supabase Label Profile Sync Success] Label profile saved.');
            });
          }
        }

        // 2. Profiles Table Save: ALWAYS preserve user's global/personal identity if in a professional portal!
        const isProfessionalPortal = ['band', 'creative', 'promoter', 'label'].includes(portalRole);
        
        let personalName = profileFullLegalName || '';
        let personalHandle = profileHandle || '';
        let personalAvatar = profileAvatarUrl || null;
        let personalBanner = profileCoverUrl || null;
        let personalBio = profileBlurb || '';
        let personalGenres = combinedGenres;
        let personalTopSong = fullTopSong;
        let personalTopSongUrl = finalTopSongUrl;

        if (isProfessionalPortal) {
          // Use original userProfile values to keep personal rows untouched by professional details,
          // while respecting explicitly set avatar/banner
          personalName = userProfile?.full_name || userProfile?.name || '';
          personalHandle = userProfile?.console_handle || userProfile?.handle || '';
          personalAvatar = profileAvatarUrl || userProfile?.avatar_url || null;
          personalBanner = profileCoverUrl || userProfile?.banner_url || null;
          personalBio = userProfile?.bio || profileBlurb || '';
          personalGenres = userProfile?.genre_tags || userProfile?.genres || [];
          personalTopSong = userProfile?.top_song_title || '';
          personalTopSongUrl = userProfile?.top_song_url || '';
        }

        const isCreative = portalRole === 'creative' || userProfile?.account_type === 'creative';

        const globalProfilePayload = extractGlobalProfilePayload({
          id: userProfile.id,
          email: userProfile.email || profileEmail,
          full_name: personalName,
          name: personalName,
          console_handle: personalHandle,
          bio: personalBio,
          genre_tags: personalGenres,
          genres: personalGenres,
          top_song_title: personalTopSong,
          favoriteSong: personalTopSong,
          top_song_url: personalTopSongUrl,
          avatar_url: personalAvatar,
          banner_url: personalBanner,
          city: isProfessionalPortal ? (userProfile?.city || undefined) : profileLocation,
          zip_code: profileZip,
          pin: profilePin,
          update_ticker: userProfile?.update_ticker || userProfile?.rosterTicker || 'No updates posted yet',
          creative_id: isCreative ? (userProfile?.creative_id || userProfile?.registered_creative_id) : undefined,
        }, userProfile.id);

        executeSanitizedProfileUpsert(
          supabase,
          globalProfilePayload
        ).then(({ error }) => {
          if (error) {
            console.error('[Supabase Profile Sync Error]:', error);
          } else {
            console.log('[Supabase Profile Sync Success] Global user profile saved.');
          }
        });
      }
    }
  };

  return {
    isLoadedRef,
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
    saveProfileData
  };
}
