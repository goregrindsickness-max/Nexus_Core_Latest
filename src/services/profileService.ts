import { normalizeRegisteredWorkspaces } from '../types';
import { executeWithSchemaResilience } from './schemaResilienceService';
import { isMiguelNameOrProfile } from '../components/social/utils/profileUtils';
import { isCommunityBandRecord } from '../lib/seedBandsData';
import { isPromoterAvatarUrl, isPromoterCoverUrl, DEFAULT_PERSONAL_AVATAR, DEFAULT_PERSONAL_COVER } from '../utils/bandProfileUtils';

export const PROFILES_COLUMNS = [
  'id',
  'created_at',
  'email',
  'full_name',
  'console_handle',
  'avatar_url',
  'banner_url',
  'zip_code',
  'pin',
  'genre_tags',
  'sub_tier',
  'city',
  'state_province',
  'country',
  'phone',
  'account_type',
  'active_workspace',
  'allowed_workspaces',
  'registered_workspaces',
  'creative_id',
  'creative_name',
  'promoter_id',
  'label_id',
  'band_id',
  'band_name',
  'creative_metadata',
  'promoter_metadata',
  'label_metadata',
  'band_metadata',
  'show_active_status',
  'read_receipts_enabled',
  'gatekeeper_setting',
  'sound_effects_enabled',
  'auto_download_media',
  'autoplay_audio',
  'bio',
  'top_song_title',
  'top_song_url',
  'update_ticker',
  'photo_folders',
];

/**
 * Normalizes a profile loaded from Supabase to match the frontend state expectations.
 * Pulls custom metadata fields out of JSONB metadata columns if not present at top-level.
 */
export function normalizeLoadedProfile(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const normalized = { ...data };

  // Normalize photo_folders array
  if (data.photo_folders !== undefined && data.photo_folders !== null) {
    if (Array.isArray(data.photo_folders)) {
      normalized.photo_folders = data.photo_folders;
    } else if (typeof data.photo_folders === 'string' && data.photo_folders.trim()) {
      try {
        const parsed = JSON.parse(data.photo_folders);
        normalized.photo_folders = Array.isArray(parsed) ? parsed : [data.photo_folders];
      } catch (e) {
        normalized.photo_folders = [data.photo_folders];
      }
    }
  }

  // 1. Map 'full_name' back to 'name' for frontend code compatibility
  normalized.name =
    normalized.name || normalized.full_name || normalized.display_name || normalized.console_handle || 'User';
  normalized.role = normalized.role || normalized.account_type || 'Fan Listener';
  normalized.avatar = normalized.avatar || normalized.avatar_url || '👤';

  // 1b. Handle dedicated personal columns explicitly as primary source of truth
  if (data.bio !== undefined && data.bio !== null) {
    normalized.bio = data.bio;
  }

  if (data.top_song_title !== undefined && data.top_song_title !== null && data.top_song_title !== '') {
    normalized.top_song_title = data.top_song_title;
    normalized.favoriteSong = data.top_song_title;
  } else if (!normalized.top_song_title) {
    normalized.top_song_title = data.favoriteSong || '';
    normalized.favoriteSong = normalized.top_song_title;
  }

  if (data.top_song_url !== undefined && data.top_song_url !== null && data.top_song_url !== '') {
    normalized.top_song_url = data.top_song_url;
  }

  const tickerVal = data.update_ticker || data.rosterTicker || '';
  if (tickerVal) {
    normalized.update_ticker = tickerVal;
    normalized.rosterTicker = tickerVal;
  }

  // Normalize genre_tags and genres for consistent micro-genre arrays from top-level columns
  const rawGenreSource = data.genre_tags || data.genres;
  if (rawGenreSource) {
    if (Array.isArray(rawGenreSource)) {
      normalized.genres = rawGenreSource;
      normalized.genre_tags = rawGenreSource;
    } else if (typeof rawGenreSource === 'string' && rawGenreSource.trim()) {
      try {
        const parsed = JSON.parse(rawGenreSource);
        normalized.genres = Array.isArray(parsed) ? parsed : [rawGenreSource];
      } catch (e) {
        normalized.genres = rawGenreSource
          .split(',')
          .map((g: string) => g.trim())
          .filter(Boolean);
      }
      normalized.genre_tags = normalized.genres;
    }
  }

  // 2. Extract nested custom fields ONLY from user_metadata (workspace metadata must remain isolated to their respective roles)
  if (data.user_metadata && typeof data.user_metadata === 'object') {
    for (const [key, val] of Object.entries(data.user_metadata)) {
      if (
        key !== 'custom_fields' &&
        (!(key in normalized) || normalized[key] === undefined || normalized[key] === null)
      ) {
        normalized[key] = val;
      }
    }
    if (data.user_metadata.custom_fields && typeof data.user_metadata.custom_fields === 'object') {
      for (const [key, val] of Object.entries(data.user_metadata.custom_fields)) {
        if (!(key in normalized) || normalized[key] === undefined || normalized[key] === null) {
          normalized[key] = val;
        }
      }
    }
  }

  // Ensure promoter_metadata is synthesized and fully populated for promoter profiles
  if (!normalized.promoter_metadata || typeof normalized.promoter_metadata !== 'object') {
    normalized.promoter_metadata = {};
  }
  const pm = normalized.promoter_metadata;
  pm.brand_name = pm.brand_name || pm.agency_name || pm.entity_name || normalized.promoter_agency || normalized.promoter_brand || normalized.promoter_name || normalized.entity_name || normalized.corporate_name || 'Nexus Live Productions';
  pm.agency_name = pm.agency_name || pm.brand_name;
  pm.business_name = pm.business_name || pm.brand_name || pm.agency_name;
  pm.city = pm.city || normalized.promoter_city || normalized.city;
  pm.state = pm.state || normalized.promoter_state || normalized.state_province || normalized.state;
  pm.logo_url = pm.logo_url || pm.avatar_url || normalized.promoter_logo || 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601';
  pm.banner_url = pm.banner_url || pm.cover_url || normalized.promoter_cover_image || 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635';
  pm.bio = pm.bio || normalized.promoter_bio || 'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. I have a lengthy history in the underground extreme metal scene with several festivals under my name most notably the Chicago/ Texas Domination Fest that ran from 2014-2024. The next evolution is set to move to another new market more details on that in the near future.';

  // Backfill namespaced promoter properties so promoter components never fall back to empty or stale local storage
  normalized.promoter_id = normalized.promoter_id || pm.id || (normalized.id && normalized.id !== 'guest' ? normalized.id : undefined);
  normalized.promoter_name = pm.brand_name;
  normalized.promoter_agency = pm.agency_name;
  normalized.promoter_brand = pm.brand_name;
  normalized.promoter_logo = pm.logo_url;
  normalized.promoter_cover_image = pm.banner_url;
  normalized.promoter_bio = pm.bio;
  normalized.promoter_city = pm.city || normalized.promoter_city || normalized.city;
  normalized.promoter_state = pm.state || normalized.promoter_state;
  normalized.promoter_booking_email = pm.booking_email || normalized.promoter_booking_email || normalized.email;

  // Extract only dedicated namespaced custom fields from metadata without touching top-level personal banner/avatar/bio
  const namespacedCustomFields = [
    'pin',
    'location_code',
    'console_handle',
    'clearance_tier',
    'sub_tier',
    'subscription_status',
    'zip_code',
    'legal_name',
    'screen_name',
    'nexus_consent_checked',
    'label_tax_registration_number',
    'metal_archives_url',
    'metal_archives',
    'creative_id',
    'creative_name',
    'creative_business_name',
    'creative_avatar',
    'creative_banner',
    'creative_handle',
    'creative_specialty',
    'creative_primary_specialty',
    'creative_core_skill',
    'creative_gear',
    'creative_base_rate_value',
    'creative_base_rate_setup',
    'creative_instagram',
    'creative_website',
    'creative_bio',
  ];
  for (const key of namespacedCustomFields) {
    if (!(key in normalized) || normalized[key] === undefined || normalized[key] === null) {
      const metadataVal =
        normalized.user_metadata?.[key] ||
        normalized.creative_metadata?.[key] ||
        normalized.promoter_metadata?.[key] ||
        normalized.label_metadata?.[key] ||
        normalized.band_metadata?.[key] ||
        normalized.user_metadata?.custom_fields?.[key] ||
        normalized.creative_metadata?.custom_fields?.[key];
      if (metadataVal !== undefined && metadataVal !== null) {
        normalized[key] = metadataVal;
      }
    }
  }

  // Explicit top-level creative resolution
  if (normalized.creative_metadata && typeof normalized.creative_metadata === 'object') {
    if (!normalized.creative_avatar && (normalized.creative_metadata.creative_avatar || normalized.creative_metadata.avatar_url || normalized.creative_metadata.image)) {
      normalized.creative_avatar = normalized.creative_metadata.creative_avatar || normalized.creative_metadata.avatar_url || normalized.creative_metadata.image;
    }
    if (!normalized.creative_banner && (normalized.creative_metadata.creative_banner || normalized.creative_metadata.banner_url || normalized.creative_metadata.cover_url)) {
      normalized.creative_banner = normalized.creative_metadata.creative_banner || normalized.creative_metadata.banner_url || normalized.creative_metadata.cover_url;
    }
    if (!normalized.creative_business_name && (normalized.creative_metadata.creative_business_name || normalized.creative_metadata.business_name || normalized.creative_metadata.name)) {
      normalized.creative_business_name = normalized.creative_metadata.creative_business_name || normalized.creative_metadata.business_name || normalized.creative_metadata.name;
    }
    if (!normalized.creative_name && (normalized.creative_metadata.creative_name || normalized.creative_metadata.business_name || normalized.creative_metadata.name)) {
      normalized.creative_name = normalized.creative_metadata.creative_name || normalized.creative_metadata.business_name || normalized.creative_metadata.name;
    }
    if (!normalized.creative_handle && normalized.creative_metadata.handle) {
      normalized.creative_handle = normalized.creative_metadata.handle;
    }
  }

  // Sanitize personal avatar_url & banner_url: isolate promoter assets when in personal / industry pro context
  const isPromoterContext = normalized.account_type === 'promoter' || normalized.active_workspace === 'promoter';
  if (!isPromoterContext) {
    if (isPromoterAvatarUrl(normalized.avatar_url, normalized) || isPromoterAvatarUrl(normalized.avatar, normalized)) {
      const savedUserAvatar = typeof window !== 'undefined' ? (localStorage.getItem('nexus_user_avatar') || localStorage.getItem('nexus_avatar')) : null;
      normalized.avatar_url = savedUserAvatar && !isPromoterAvatarUrl(savedUserAvatar, normalized) ? savedUserAvatar : DEFAULT_PERSONAL_AVATAR;
      normalized.avatar = normalized.avatar_url;
    }
    if (isPromoterCoverUrl(normalized.banner_url, normalized) || isPromoterCoverUrl(normalized.cover_url, normalized) || isPromoterCoverUrl(normalized.banner, normalized)) {
      const savedUserBanner = typeof window !== 'undefined' ? (localStorage.getItem('nexus_user_banner') || localStorage.getItem('nexus_banner')) : null;
      normalized.banner_url = savedUserBanner && !isPromoterCoverUrl(savedUserBanner, normalized) ? savedUserBanner : DEFAULT_PERSONAL_COVER;
      normalized.cover_url = normalized.banner_url;
      normalized.banner = normalized.banner_url;
    }
  }

  // Ensure band identity integrity: prevent community bands (e.g. Necroticgorebeast) from corrupting personal band profile
  if (isMiguelNameOrProfile(normalized)) {
    normalized.band_id = 'cbddb810-259b-4230-9968-3d402dfdb872';
    normalized.band_name = 'Virulent Excision';
    normalized.bandName = 'Virulent Excision';
  } else {
    if (normalized.band_id && isCommunityBandRecord(normalized.band_id)) {
      normalized.band_id = undefined;
    }
    if (normalized.band_name && (isCommunityBandRecord(normalized.band_name) || String(normalized.band_name).toLowerCase().includes('necroticgorebeast'))) {
      normalized.band_name = undefined;
      normalized.bandName = undefined;
    }
    if (normalized.bandName && (isCommunityBandRecord(normalized.bandName) || String(normalized.bandName).toLowerCase().includes('necroticgorebeast'))) {
      normalized.bandName = undefined;
    }
  }

  return normalized;
}

/**
 * Sanitizes a raw profile object according to exact database whitelist columns and rules.
 */
export function sanitizeProfilePayload(rawPayload: any): any {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return rawPayload;
  }

  if (Array.isArray(rawPayload)) {
    return rawPayload.map((item) => sanitizeProfilePayload(item)).filter(Boolean);
  }

  // Strict whitelist construction from scratch using only explicit, known database columns
  const cleanProfilePayload: Record<string, any> = {};

  // 1. Copy only explicit, known database columns from PROFILES_COLUMNS if present in rawPayload
  for (const col of PROFILES_COLUMNS) {
    if (rawPayload[col] !== undefined && rawPayload[col] !== null) {
      cleanProfilePayload[col] = rawPayload[col];
    }
  }

  // 2. Cleanly map extended creative_*, label_* and promoter_* workspace fields into respective JSONB metadata columns
  const existingCreativeMeta =
    rawPayload.creative_metadata && typeof rawPayload.creative_metadata === 'object' ? rawPayload.creative_metadata : {};
  const extractedCreativeProps: Record<string, any> = {};
  for (const key of Object.keys(rawPayload)) {
    if ((key.startsWith('creative_') || key === 'business_name') && key !== 'creative_id' && key !== 'creative_metadata') {
      if (rawPayload[key] !== undefined && rawPayload[key] !== null) {
        extractedCreativeProps[key] = rawPayload[key];
      }
    }
  }

  if (Object.keys(existingCreativeMeta).length > 0 || Object.keys(extractedCreativeProps).length > 0) {
    cleanProfilePayload.creative_metadata = {
      ...extractedCreativeProps,
      ...existingCreativeMeta,
    };
  }

  const existingLabelMeta =
    rawPayload.label_metadata && typeof rawPayload.label_metadata === 'object' ? rawPayload.label_metadata : {};
  const extractedLabelProps: Record<string, any> = {};
  for (const key of Object.keys(rawPayload)) {
    if (key.startsWith('label_') && key !== 'label_id' && key !== 'label_metadata') {
      if (rawPayload[key] !== undefined && rawPayload[key] !== null) {
        extractedLabelProps[key] = rawPayload[key];
      }
    }
  }

  if (Object.keys(existingLabelMeta).length > 0 || Object.keys(extractedLabelProps).length > 0) {
    cleanProfilePayload.label_metadata = {
      ...extractedLabelProps,
      ...existingLabelMeta,
    };
  }

  const existingPromoterMeta =
    rawPayload.promoter_metadata && typeof rawPayload.promoter_metadata === 'object'
      ? rawPayload.promoter_metadata
      : {};
  const extractedPromoterProps: Record<string, any> = {};
  for (const key of Object.keys(rawPayload)) {
    if (key.startsWith('promoter_') && key !== 'promoter_id' && key !== 'promoter_metadata') {
      if (rawPayload[key] !== undefined && rawPayload[key] !== null) {
        extractedPromoterProps[key] = rawPayload[key];
      }
    }
  }

  if (Object.keys(existingPromoterMeta).length > 0 || Object.keys(extractedPromoterProps).length > 0) {
    const meta = {
      ...extractedPromoterProps,
      ...existingPromoterMeta,
    };
    delete meta.top_song_title;
    delete meta.top_song_url;
    delete meta.genre_tags;
    delete meta.favoriteSong;
    delete meta.genres;
    cleanProfilePayload.promoter_metadata = meta;
  }

  // 3. Map explicit fallback/alias fields for key database columns:
  if (
    !cleanProfilePayload.full_name &&
    (rawPayload.full_name !== undefined ||
      rawPayload.name !== undefined ||
      rawPayload.legal_name !== undefined ||
      rawPayload.legalName !== undefined ||
      rawPayload.CreativeName !== undefined ||
      rawPayload.creative_business_name !== undefined ||
      rawPayload.creativename !== undefined)
  ) {
    const candidateName =
      rawPayload.full_name ||
      rawPayload.name ||
      rawPayload.legal_name ||
      rawPayload.legalName ||
      rawPayload.CreativeName ||
      rawPayload.creative_business_name ||
      rawPayload.creativename;
    if (candidateName) {
      cleanProfilePayload.full_name = candidateName;
    }
  }

  // console_handle <- console_handle || handle || screen_name || creative_handle
  if (
    !cleanProfilePayload.console_handle &&
    (rawPayload.console_handle !== undefined || rawPayload.handle !== undefined || rawPayload.creative_handle !== undefined)
  ) {
    const candidateHandle =
      rawPayload.console_handle || rawPayload.handle || rawPayload.creative_handle;
    if (candidateHandle) {
      cleanProfilePayload.console_handle = candidateHandle;
    }
  }

  // bio <- bio || profileBlurb || blurb || about
  if (
    rawPayload.bio !== undefined ||
    rawPayload.profileBlurb !== undefined ||
    rawPayload.blurb !== undefined ||
    rawPayload.about !== undefined
  ) {
    const candidateBio = rawPayload.bio ?? rawPayload.profileBlurb ?? rawPayload.blurb ?? rawPayload.about;
    if (candidateBio !== undefined) {
      cleanProfilePayload.bio = candidateBio !== null ? String(candidateBio) : null;
    }
  }

  // update_ticker <- update_ticker || rosterTicker
  if (rawPayload.update_ticker !== undefined || rawPayload.rosterTicker !== undefined) {
    const candidateTicker = rawPayload.update_ticker ?? rawPayload.rosterTicker;
    if (candidateTicker !== undefined) {
      cleanProfilePayload.update_ticker = candidateTicker !== null ? String(candidateTicker) : null;
    }
  }

  // Avatar URL resolving only if an avatar field was provided
  const hasAvatarField =
    rawPayload.avatar_url !== undefined ||
    rawPayload.avatarUrl !== undefined ||
    rawPayload.avatar !== undefined ||
    rawPayload.profileAvatarUrl !== undefined ||
    rawPayload.logo_url !== undefined;

  if (hasAvatarField) {
    let chosenAvatarUrl: string | null = null;
    const avatarCandidates = [
      rawPayload.avatar_url,
      rawPayload.avatarUrl,
      rawPayload.avatar,
      rawPayload.profileAvatarUrl,
      rawPayload.logo_url,
    ];

    for (const cand of avatarCandidates) {
      if (typeof cand === 'string' && cand.trim().length > 0) {
        if (!cand.includes('Nexus%20Icon%20Circuits.png')) {
          chosenAvatarUrl = cand.trim();
          break;
        }
      }
    }

    if (chosenAvatarUrl !== null) {
      cleanProfilePayload.avatar_url = chosenAvatarUrl;
    } else if (rawPayload.avatar_url === null || rawPayload.avatar === null) {
      cleanProfilePayload.avatar_url = null;
    }
  }

  // Banner URL resolving only if a banner field was provided
  const hasBannerField =
    rawPayload.banner_url !== undefined ||
    rawPayload.bannerUrl !== undefined ||
    rawPayload.banner !== undefined ||
    rawPayload.cover_url !== undefined ||
    rawPayload.profileCoverUrl !== undefined;

  if (hasBannerField) {
    let chosenBannerUrl: string | null = null;
    const bannerCandidates = [
      rawPayload.banner_url,
      rawPayload.bannerUrl,
      rawPayload.banner,
      rawPayload.cover_url,
      rawPayload.profileCoverUrl,
    ];

    for (const cand of bannerCandidates) {
      if (typeof cand === 'string' && cand.trim().length > 0) {
        chosenBannerUrl = cand.trim();
        break;
      }
    }

    if (chosenBannerUrl !== null) {
      cleanProfilePayload.banner_url = chosenBannerUrl;
    } else if (rawPayload.banner_url === null || rawPayload.cover_url === null) {
      cleanProfilePayload.banner_url = null;
    }
  }

  // Preserving active_workspace only if present in payload
  if (cleanProfilePayload.active_workspace !== undefined || rawPayload.active_workspace !== undefined) {
    cleanProfilePayload.active_workspace = cleanProfilePayload.active_workspace || rawPayload.active_workspace;
  }

  // account_type column on profiles table can ONLY EVER be "fan" or "industry pro"
  if (cleanProfilePayload.account_type !== undefined || rawPayload.account_type !== undefined || rawPayload.role !== undefined) {
    const rawAccVal = cleanProfilePayload.account_type || rawPayload.account_type || rawPayload.role || '';
    if (rawAccVal) {
      const lowerAcc = String(rawAccVal).toLowerCase().trim();
      if (['fan', 'fan_only', 'fan listener', 'fan only supporter', 'user'].includes(lowerAcc)) {
        cleanProfilePayload.account_type = 'fan';
      } else {
        cleanProfilePayload.account_type = 'industry pro';
      }
    }
  }

  // top_song_title <- top_song_title || favoriteSong
  if (cleanProfilePayload.top_song_title === undefined && rawPayload.favoriteSong !== undefined) {
    cleanProfilePayload.top_song_title = rawPayload.favoriteSong;
  }

  // genre_tags <- genre_tags || genres
  if (cleanProfilePayload.genre_tags === undefined && rawPayload.genres !== undefined && Array.isArray(rawPayload.genres)) {
    cleanProfilePayload.genre_tags = rawPayload.genres;
  }

  // Ensure registered_workspaces on profiles is strictly an array of string workspace keys
  if (cleanProfilePayload.registered_workspaces) {
    cleanProfilePayload.registered_workspaces = normalizeRegisteredWorkspaces(
      cleanProfilePayload.registered_workspaces
    );
  }

  // Creative form fields belong strictly in the 'creatives' table, NOT stored in creative_metadata on profiles table
  delete cleanProfilePayload.creative_metadata;

  // Explicitly drop columns that do NOT belong on the profiles table:
  delete cleanProfilePayload.screen_name;
  delete cleanProfilePayload.cover_url;
  delete cleanProfilePayload.Cover_url;
  delete cleanProfilePayload.CoverUrl;
  delete cleanProfilePayload.CreativeName;
  delete cleanProfilePayload.creative_business_name;
  delete cleanProfilePayload.creative_handle;
  delete cleanProfilePayload.creative_avatar;
  delete cleanProfilePayload.creative_banner;
  delete cleanProfilePayload.creativename;
  delete cleanProfilePayload.metal_archives_url;
  delete cleanProfilePayload.metal_archives;

  return cleanProfilePayload;
}

/**
 * Strictly extracts only global user profile fields for the 'profiles' table.
 * Isolates user identity (full_name, avatar_url, banner_url, bio, location, etc.)
 * from role-specific workspace payloads (such as creatives, bands, labels).
 */
export function extractGlobalProfilePayload(rawPayload: any, userId?: string): Record<string, any> {
  if (!rawPayload || typeof rawPayload !== 'object') return {};

  const uId = userId || rawPayload.id || rawPayload.user_id;
  const payload: Record<string, any> = {};
  if (uId) payload.id = uId;

  if (rawPayload.email !== undefined) payload.email = rawPayload.email;

  if (
    rawPayload.full_name !== undefined ||
    rawPayload.name !== undefined ||
    rawPayload.legal_name !== undefined ||
    rawPayload.display_name !== undefined
  ) {
    payload.full_name =
      rawPayload.full_name ||
      rawPayload.name ||
      rawPayload.legal_name ||
      rawPayload.display_name;
  }

  if (rawPayload.console_handle !== undefined || rawPayload.handle !== undefined || rawPayload.screen_name !== undefined) {
    payload.console_handle = rawPayload.console_handle || rawPayload.handle || rawPayload.screen_name;
  }

  if (
    rawPayload.avatar_url !== undefined ||
    rawPayload.avatarUrl !== undefined ||
    rawPayload.profileAvatarUrl !== undefined ||
    rawPayload.avatar !== undefined
  ) {
    const avatarUrl =
      rawPayload.avatar_url ||
      rawPayload.avatarUrl ||
      rawPayload.profileAvatarUrl ||
      (typeof rawPayload.avatar === 'string' && !rawPayload.avatar.startsWith('data:') ? rawPayload.avatar : null);
    payload.avatar_url = avatarUrl;
  }

  if (
    rawPayload.banner_url !== undefined ||
    rawPayload.bannerUrl !== undefined ||
    rawPayload.profileCoverUrl !== undefined ||
    rawPayload.banner !== undefined ||
    rawPayload.cover_url !== undefined
  ) {
    const bannerUrl =
      rawPayload.banner_url ||
      rawPayload.bannerUrl ||
      rawPayload.profileCoverUrl ||
      (typeof rawPayload.banner === 'string' && !rawPayload.banner.startsWith('data:') ? rawPayload.banner : null) ||
      rawPayload.cover_url ||
      null;
    payload.banner_url = bannerUrl;
  }

  if (
    rawPayload.bio !== undefined ||
    rawPayload.profileBlurb !== undefined ||
    rawPayload.blurb !== undefined ||
    rawPayload.about !== undefined
  ) {
    const bio = rawPayload.bio ?? rawPayload.profileBlurb ?? rawPayload.blurb ?? rawPayload.about;
    payload.bio = bio ? String(bio) : null;
  }

  if (rawPayload.city !== undefined) payload.city = rawPayload.city;
  if (rawPayload.state_province !== undefined || rawPayload.state !== undefined) {
    payload.state_province = rawPayload.state_province || rawPayload.state;
  }
  if (rawPayload.country !== undefined) payload.country = rawPayload.country;
  if (rawPayload.zip_code !== undefined || rawPayload.zip !== undefined) {
    payload.zip_code = rawPayload.zip_code || rawPayload.zip;
  }
  if (rawPayload.pin !== undefined) payload.pin = rawPayload.pin;
  if (rawPayload.phone !== undefined) {
    payload.phone = rawPayload.phone ? String(rawPayload.phone).replace(/\D/g, '') : null;
  }

  if (rawPayload.account_type !== undefined || rawPayload.role !== undefined) {
    const rawAccountType = String(rawPayload.account_type || rawPayload.role || '').toLowerCase().trim();
    const isFan = ['fan', 'fan_only', 'fan listener', 'fan only supporter', 'user'].includes(rawAccountType);
    payload.account_type = isFan ? 'fan' : 'industry pro';
  }

  if (rawPayload.active_workspace !== undefined) payload.active_workspace = rawPayload.active_workspace;
  if (rawPayload.allowed_workspaces !== undefined) payload.allowed_workspaces = rawPayload.allowed_workspaces;
  if (rawPayload.registered_workspaces !== undefined) {
    payload.registered_workspaces = normalizeRegisteredWorkspaces(rawPayload.registered_workspaces);
  }

  if (rawPayload.creative_id !== undefined) payload.creative_id = rawPayload.creative_id;
  if (rawPayload.creative_name !== undefined) payload.creative_name = rawPayload.creative_name;
  if (rawPayload.promoter_id !== undefined) payload.promoter_id = rawPayload.promoter_id;
  if (rawPayload.label_id !== undefined) payload.label_id = rawPayload.label_id;

  if (rawPayload.band_id !== undefined) {
    payload.band_id = isMiguelNameOrProfile(rawPayload) ? 'cbddb810-259b-4230-9968-3d402dfdb872' : (isCommunityBandRecord(rawPayload.band_id) ? null : rawPayload.band_id);
  }
  if (rawPayload.band_name !== undefined || rawPayload.bandName !== undefined) {
    payload.band_name = isMiguelNameOrProfile(rawPayload) ? 'Virulent Excision' : ((rawPayload.band_name && (isCommunityBandRecord(rawPayload.band_name) || String(rawPayload.band_name).toLowerCase().includes('necroticgorebeast'))) ? null : (rawPayload.band_name || rawPayload.bandName));
  }

  if (rawPayload.genre_tags !== undefined || rawPayload.genres !== undefined) {
    payload.genre_tags = Array.isArray(rawPayload.genre_tags) ? rawPayload.genre_tags : (Array.isArray(rawPayload.genres) ? rawPayload.genres : undefined);
  }
  if (rawPayload.top_song_title !== undefined || rawPayload.favoriteSong !== undefined) {
    payload.top_song_title = rawPayload.top_song_title || rawPayload.favoriteSong;
  }
  if (rawPayload.top_song_url !== undefined) payload.top_song_url = rawPayload.top_song_url;
  if (rawPayload.update_ticker !== undefined || rawPayload.rosterTicker !== undefined) {
    payload.update_ticker = rawPayload.update_ticker || rawPayload.rosterTicker;
  }

  return sanitizeProfileUpsertPayload(payload);
}

/**
 * Sanitizes a profile upsert payload (object or array of objects) by filtering keys against
 * an explicit whitelist of allowed database columns to prevent 400 Bad Request errors.
 */
export function sanitizeProfileUpsertPayload<T = any>(
  rawPayload: T,
  allowedColumns: string[] = PROFILES_COLUMNS
): T {
  if (!rawPayload || typeof rawPayload !== 'object') return rawPayload;

  if (Array.isArray(rawPayload)) {
    return rawPayload
      .map((item) => sanitizeProfileUpsertPayload(item, allowedColumns))
      .filter(Boolean) as unknown as T;
  }

  const payload = JSON.parse(JSON.stringify(rawPayload)); // Deep clone

  // 1. Explicitly nuke the "Ghost" keys that cause 400 errors
  const forbiddenKeys = [
    'avatar',
    'profile_image',
    'cover_url',
    'cover_image',
    'banner',
    'metal_archives',
    'metal_archives_url',
  ];
  forbiddenKeys.forEach((key) => delete payload[key]);

  const domainSanitized = sanitizeProfilePayload(payload);

  // 2. Perform the whitelist filter
  const cleanObj: Record<string, any> = {};
  for (const col of allowedColumns) {
    if (Object.prototype.hasOwnProperty.call(domainSanitized, col) && domainSanitized[col] !== undefined) {
      cleanObj[col] = domainSanitized[col];
    }
  }

  return cleanObj as T;
}

/**
 * Auto-archives previous profile avatar and cover/banner images into the user's
 * media gallery / photo folders ("Profile Photos" or "Cover Photos") when a new image URL is set.
 */
export async function autoArchiveProfileAssets(
  supabaseClient: any,
  userId: string,
  newAvatarUrl?: string | null,
  newBannerUrl?: string | null,
  userProfileName?: string
): Promise<{ archivedAvatar?: string; archivedBanner?: string; updatedFolders?: string[] }> {
  if (!userId || (!newAvatarUrl && !newBannerUrl)) {
    return {};
  }

  try {
    let existingProfile: any = null;

    if (supabaseClient) {
      try {
        const { data } = await supabaseClient
          .from('profiles')
          .select('id, name, full_name, avatar_url, banner_url, cover_url, photo_folders')
          .eq('id', userId)
          .maybeSingle();
        if (data) existingProfile = data;
      } catch (e) {
        console.warn('[AutoArchive] Failed to fetch existing profile record:', e);
      }
    }

    if (!existingProfile) {
      try {
        const local = localStorage.getItem('nexus_core_user_profile');
        if (local) existingProfile = JSON.parse(local);
      } catch (e) {}
    }

    if (!existingProfile) {
      return {};
    }

    const currentAvatar = existingProfile.avatar_url || existingProfile.avatar || null;
    const currentBanner =
      existingProfile.banner_url || existingProfile.cover_url || existingProfile.banner || null;
    const currentFolders: string[] = Array.isArray(existingProfile.photo_folders)
      ? existingProfile.photo_folders
      : [];

    let archivedAvatar: string | undefined;
    let archivedBanner: string | undefined;
    const newFoldersSet = new Set<string>(currentFolders);

    const userName =
      userProfileName || existingProfile.full_name || existingProfile.name || 'Nexus Member';

    const insertArchivePost = async (folderName: string, mediaUrl: string, captionText: string) => {
      // Deduplicate: check if this media URL is already archived for this user in nexus_posts
      if (supabaseClient) {
        try {
          const { data: existingPost } = await supabaseClient
            .from('nexus_posts')
            .select('id')
            .eq('profile_id', userId)
            .eq('media_url', mediaUrl)
            .limit(1);
          if (existingPost && existingPost.length > 0) {
            console.log(`[AutoArchive] Media asset ${mediaUrl} already archived for user ${userId}, skipping duplicate.`);
            return;
          }
        } catch (e) {
          // continue with insertion
        }
      }

      const postUuid =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'archive_' + Date.now().toString(16) + '_' + Math.floor(Math.random() * 1e6);

      const postObj = {
        id: postUuid,
        profile_id: userId,
        author: {
          name: userName,
          avatar: newAvatarUrl || currentAvatar || '👤',
          role: 'Nexus User',
          isYou: true,
        },
        content: captionText,
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
        image: mediaUrl,
        media_url: mediaUrl,
        gallery_folder: folderName,
        folder: folderName,
        is_archived_asset: true,
        is_gallery_only: true,
        gallery_only: true,
        post_to_feed: false,
        hidden_from_feed: true,
      };

      if (supabaseClient) {
        try {
          await supabaseClient.from('nexus_posts').insert([
            {
              id: postUuid,
              profile_id: userId,
              content: captionText,
              media_url: mediaUrl,
              workspace_type: 'fan',
              data: postObj,
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (err) {
          console.warn(`[AutoArchive] Error archiving asset to nexus_posts:`, err);
        }
      }

      // Add quietly to local vault cache for Photo Pit / Gallery view without spamming public feed
      try {
        const vaultRaw = localStorage.getItem('nexus_dbUserPosts');
        let vaultItems: any[] = [];
        if (vaultRaw) {
          try {
            vaultItems = JSON.parse(vaultRaw);
          } catch (e) {}
        }
        if (!vaultItems.some((item: any) => item.image === mediaUrl || item.media_url === mediaUrl || item.id === postUuid)) {
          vaultItems.unshift(postObj);
          localStorage.setItem('nexus_dbUserPosts', JSON.stringify(vaultItems));
        }
      } catch (e) {}
    };

    if (
      newAvatarUrl &&
      typeof newAvatarUrl === 'string' &&
      newAvatarUrl.trim().length > 0 &&
      currentAvatar &&
      typeof currentAvatar === 'string' &&
      currentAvatar.trim().length > 0 &&
      currentAvatar !== newAvatarUrl &&
      !currentAvatar.includes('Nexus%20Icon%20Circuits.png') &&
      !currentAvatar.startsWith('data:image/')
    ) {
      console.log(`[AutoArchive] Archiving previous avatar: ${currentAvatar}`);
      newFoldersSet.add('Profile Pics');
      await insertArchivePost('Profile Pics', currentAvatar, 'Archived Profile Photo');
      archivedAvatar = currentAvatar;
    }

    if (
      newBannerUrl &&
      typeof newBannerUrl === 'string' &&
      newBannerUrl.trim().length > 0 &&
      currentBanner &&
      typeof currentBanner === 'string' &&
      currentBanner.trim().length > 0 &&
      currentBanner !== newBannerUrl &&
      !currentBanner.startsWith('data:image/')
    ) {
      console.log(`[AutoArchive] Archiving previous banner: ${currentBanner}`);
      newFoldersSet.add('Cover Images');
      await insertArchivePost('Cover Images', currentBanner, 'Archived Cover Photo');
      archivedBanner = currentBanner;
    }

    const updatedFolders = Array.from(newFoldersSet);

    if (updatedFolders.length > currentFolders.length) {
      if (supabaseClient) {
        try {
          await supabaseClient.from('profiles').update({ photo_folders: updatedFolders }).eq('id', userId);
        } catch (e) {}
      }
      try {
        const local = localStorage.getItem('nexus_core_user_profile');
        if (local) {
          const parsed = JSON.parse(local);
          parsed.photo_folders = updatedFolders;
          localStorage.setItem('nexus_core_user_profile', JSON.stringify(parsed));
        }
      } catch (e) {}
    }

    return { archivedAvatar, archivedBanner, updatedFolders };
  } catch (err) {
    console.error('[AutoArchive] Failed auto-archiving profile assets:', err);
    return {};
  }
}

/**
 * Executes a profile upsert operation using sanitized payload and schema resilience wrapper.
 */
export async function executeSanitizedProfileUpsert(
  supabaseClient: any,
  rawPayload: any,
  options?: { onConflict?: string }
): Promise<{ error: any; data?: any }> {
  // Pass sanitized payload securely into schema resilience execution wrapper
  const sanitizedPayload = sanitizeProfileUpsertPayload(rawPayload);

  const userId = sanitizedPayload?.id || (Array.isArray(sanitizedPayload) ? sanitizedPayload[0]?.id : null);
  const newAvatarUrl =
    sanitizedPayload?.avatar_url || (Array.isArray(sanitizedPayload) ? sanitizedPayload[0]?.avatar_url : null);
  const newBannerUrl =
    sanitizedPayload?.banner_url || (Array.isArray(sanitizedPayload) ? sanitizedPayload[0]?.banner_url : null);
  const userProfileName =
    sanitizedPayload?.full_name ||
    sanitizedPayload?.name ||
    (Array.isArray(sanitizedPayload) ? sanitizedPayload[0]?.name : null);

  if (userId && (newAvatarUrl || newBannerUrl) && supabaseClient) {
    autoArchiveProfileAssets(supabaseClient, userId, newAvatarUrl, newBannerUrl, userProfileName).catch(() => {});
  }

  // If updating a single user profile record, attempt targeted UPDATE first to protect un-passed fields
  if (userId && !Array.isArray(sanitizedPayload) && supabaseClient) {
    const updateResult = await executeWithSchemaResilience(async (payload) => {
      return await supabaseClient.from('profiles').update(payload).eq('id', userId).select();
    }, sanitizedPayload);

    if (!updateResult?.error && Array.isArray(updateResult?.data) && updateResult.data.length > 0) {
      return updateResult;
    }
  }

  const result = await executeWithSchemaResilience(async (payload) => {
    return await supabaseClient.from('profiles').upsert(payload, options);
  }, sanitizedPayload);

  // Catch and expose the exact 400 error details if it fails
  if (result && result.error) {
    console.error('Supabase Profile Upsert Failed (400 Bad Request):', JSON.stringify(result.error, null, 2));
  }

  return result;
}
