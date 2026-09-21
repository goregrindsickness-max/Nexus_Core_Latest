import { normalizeRegisteredWorkspaces } from '../types';
import { executeWithSchemaResilience } from './schemaResilienceService';
import { isMiguelNameOrProfile } from '../components/social/utils/profileUtils';
import { isCommunityBandRecord } from '../lib/seedBandsData';

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

  // 2. Extract nested custom fields from metadata if they are missing at top-level
  const metadataContainers = [
    data.creative_metadata,
    data.promoter_metadata,
    data.label_metadata,
    data.band_metadata,
    data.user_metadata,
  ];

  for (const metaObj of metadataContainers) {
    if (metaObj && typeof metaObj === 'object') {
      for (const [key, val] of Object.entries(metaObj)) {
        if (
          key !== 'custom_fields' &&
          (!(key in normalized) || normalized[key] === undefined || normalized[key] === null)
        ) {
          normalized[key] = val;
        }
      }
      if (metaObj.custom_fields && typeof metaObj.custom_fields === 'object') {
        for (const [key, val] of Object.entries(metaObj.custom_fields)) {
          if (!(key in normalized) || normalized[key] === undefined || normalized[key] === null) {
            normalized[key] = val;
          }
        }
      }
    }
  }

  const possibleCustomFields = [
    'pin',
    'location_code',
    'banner_url',
    'console_handle',
    'clearance_tier',
    'sub_tier',
    'subscription_status',
    'zip_code',
    'legal_name',
    'screen_name',
    'nexus_consent_checked',
    'label_tax_registration_number',
    'role',
    'name',
    'bandName',
    'band_id',
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
    'business_name',
  ];
  for (const key of possibleCustomFields) {
    if (!(key in normalized) || normalized[key] === undefined || normalized[key] === null) {
      const metadataVal =
        normalized.creative_metadata?.[key] ||
        normalized.promoter_metadata?.[key] ||
        normalized.label_metadata?.[key] ||
        normalized.band_metadata?.[key] ||
        normalized.user_metadata?.[key] ||
        normalized.creative_metadata?.custom_fields?.[key] ||
        normalized.promoter_metadata?.custom_fields?.[key];
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
    (rawPayload.full_name ||
      rawPayload.name ||
      rawPayload.legal_name ||
      rawPayload.legalName ||
      rawPayload.CreativeName ||
      rawPayload.creative_business_name ||
      rawPayload.creativename)
  ) {
    cleanProfilePayload.full_name =
      rawPayload.full_name ||
      rawPayload.name ||
      rawPayload.legal_name ||
      rawPayload.legalName ||
      rawPayload.CreativeName ||
      rawPayload.creative_business_name ||
      rawPayload.creativename;
  }

  // console_handle <- console_handle || handle || screen_name || creative_handle
  if (
    !cleanProfilePayload.console_handle &&
    (rawPayload.console_handle || rawPayload.handle || rawPayload.creative_handle)
  ) {
    cleanProfilePayload.console_handle =
      rawPayload.console_handle || rawPayload.handle || rawPayload.creative_handle;
  }

  // bio <- bio || profileBlurb || blurb || about
  if (
    rawPayload.bio !== undefined ||
    rawPayload.profileBlurb !== undefined ||
    rawPayload.blurb !== undefined ||
    rawPayload.about !== undefined
  ) {
    const candidateBio = rawPayload.bio ?? rawPayload.profileBlurb ?? rawPayload.blurb ?? rawPayload.about;
    if (candidateBio !== undefined && candidateBio !== null) {
      cleanProfilePayload.bio = String(candidateBio);
    }
  }

  // update_ticker <- update_ticker || rosterTicker
  if (rawPayload.update_ticker !== undefined || rawPayload.rosterTicker !== undefined) {
    const candidateTicker = rawPayload.update_ticker ?? rawPayload.rosterTicker;
    if (candidateTicker !== undefined && candidateTicker !== null) {
      cleanProfilePayload.update_ticker = String(candidateTicker);
    }
  }

  // Avatar URL resolving
  let uploadedAvatarUrl: string | null = null;
  let existingAvatarUrl: string | null = null;

  const avatarCandidates = [
    rawPayload.avatar_url,
    rawPayload.avatarUrl,
    rawPayload.avatar,
    rawPayload.creative_avatar,
    rawPayload.profileAvatarUrl,
    rawPayload.label_avatar,
    rawPayload.promoter_logo,
    rawPayload.logo_url,
  ];

  for (const cand of avatarCandidates) {
    if (typeof cand === 'string' && cand.trim().length > 0 && !cand.startsWith('data:image/')) {
      if (!existingAvatarUrl && !cand.includes('Nexus%20Icon%20Circuits.png')) {
        existingAvatarUrl = cand;
      }
    }
  }

  if (
    typeof cleanProfilePayload.avatar_url === 'string' &&
    cleanProfilePayload.avatar_url.trim().length > 0 &&
    !cleanProfilePayload.avatar_url.startsWith('data:image/')
  ) {
    uploadedAvatarUrl = cleanProfilePayload.avatar_url;
  }

  cleanProfilePayload.avatar_url = uploadedAvatarUrl || existingAvatarUrl || null;

  // Banner URL resolving
  let uploadedBannerUrl: string | null = null;
  let existingBannerUrl: string | null = null;

  const bannerCandidates = [
    rawPayload.banner_url,
    rawPayload.bannerUrl,
    rawPayload.banner,
    rawPayload.cover_url,
    rawPayload.creative_banner,
    rawPayload.promoter_cover_image,
    rawPayload.label_banner,
    rawPayload.profileCoverUrl,
  ];

  for (const cand of bannerCandidates) {
    if (typeof cand === 'string' && cand.trim().length > 0 && !cand.startsWith('data:image/')) {
      if (!existingBannerUrl) {
        existingBannerUrl = cand;
      }
    }
  }

  if (
    typeof cleanProfilePayload.banner_url === 'string' &&
    cleanProfilePayload.banner_url.trim().length > 0 &&
    !cleanProfilePayload.banner_url.startsWith('data:image/')
  ) {
    uploadedBannerUrl = cleanProfilePayload.banner_url;
  }

  cleanProfilePayload.banner_url = uploadedBannerUrl || existingBannerUrl || null;

  // Preserving active_workspace if present or defaulting to industry_pro / fan_only
  if (!cleanProfilePayload.active_workspace && rawPayload.active_workspace) {
    cleanProfilePayload.active_workspace = rawPayload.active_workspace;
  } else if (!cleanProfilePayload.active_workspace) {
    const isFan = ['fan', 'fan_only', 'fan listener', 'fan only supporter', 'user'].includes(
      String(rawPayload.account_type || rawPayload.role || '').toLowerCase().trim()
    );
    cleanProfilePayload.active_workspace = isFan ? 'fan_only' : 'industry_pro';
  }

  // CRITICAL REQUIREMENT: account_type column on profiles table can ONLY EVER be "fan" or "industry pro"
  const rawAccVal = cleanProfilePayload.account_type || rawPayload.account_type || rawPayload.role || '';
  if (rawAccVal) {
    const lowerAcc = String(rawAccVal).toLowerCase().trim();
    if (['fan', 'fan_only', 'fan listener', 'fan only supporter', 'user'].includes(lowerAcc)) {
      cleanProfilePayload.account_type = 'fan';
    } else {
      cleanProfilePayload.account_type = 'industry pro';
    }
  } else {
    cleanProfilePayload.account_type = 'fan';
  }

  // top_song_title <- top_song_title || favoriteSong
  if (!cleanProfilePayload.top_song_title && rawPayload.favoriteSong) {
    cleanProfilePayload.top_song_title = rawPayload.favoriteSong;
  }

  // genre_tags <- genre_tags || genres
  if (!cleanProfilePayload.genre_tags && rawPayload.genres && Array.isArray(rawPayload.genres)) {
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
  const fullName =
    rawPayload.full_name ||
    rawPayload.name ||
    rawPayload.legal_name ||
    rawPayload.display_name ||
    'User';

  const avatarUrl =
    rawPayload.avatar_url ||
    rawPayload.avatarUrl ||
    rawPayload.profileAvatarUrl ||
    (typeof rawPayload.avatar === 'string' && !rawPayload.avatar.startsWith('data:') ? rawPayload.avatar : null);

  const bannerUrl =
    rawPayload.banner_url ||
    rawPayload.bannerUrl ||
    rawPayload.profileCoverUrl ||
    (typeof rawPayload.banner === 'string' && !rawPayload.banner.startsWith('data:') ? rawPayload.banner : null) ||
    rawPayload.cover_url ||
    null;

  const bio =
    rawPayload.bio ??
    rawPayload.profileBlurb ??
    rawPayload.blurb ??
    rawPayload.about ??
    null;

  const rawAccountType = String(rawPayload.account_type || rawPayload.role || '').toLowerCase().trim();
  const isFan = ['fan', 'fan_only', 'fan listener', 'fan only supporter', 'user'].includes(rawAccountType);
  const accountType = isFan ? 'fan' : 'industry pro';

  const payload: Record<string, any> = {
    id: uId,
    email: rawPayload.email || undefined,
    full_name: fullName,
    console_handle: rawPayload.console_handle || rawPayload.handle || undefined,
    avatar_url: avatarUrl || null,
    banner_url: bannerUrl || null,
    bio: bio ? String(bio) : null,
    city: rawPayload.city || undefined,
    state_province: rawPayload.state_province || rawPayload.state || undefined,
    country: rawPayload.country || 'USA',
    zip_code: rawPayload.zip_code || rawPayload.zip || undefined,
    pin: rawPayload.pin || undefined,
    phone: rawPayload.phone ? String(rawPayload.phone).replace(/\D/g, '') : undefined,
    account_type: accountType,
    active_workspace: rawPayload.active_workspace !== undefined ? rawPayload.active_workspace : (isFan ? 'fan_only' : 'industry_pro'),
    allowed_workspaces: rawPayload.allowed_workspaces !== undefined ? rawPayload.allowed_workspaces : (isFan ? ['fan'] : ['industry pro', 'band', 'promoter', 'creative', 'label']),
    registered_workspaces: rawPayload.registered_workspaces !== undefined
      ? normalizeRegisteredWorkspaces(
          !isFan
            ? (Array.isArray(rawPayload.registered_workspaces) ? rawPayload.registered_workspaces : [rawPayload.registered_workspaces]).filter((w: any) => {
                const str = typeof w === 'string' ? w.toLowerCase().trim() : (w?.type || '').toLowerCase().trim();
                return str !== 'fan' && str !== 'fan_only';
              })
            : rawPayload.registered_workspaces
        )
      : undefined,
    creative_id: rawPayload.creative_id || undefined,
    creative_name: rawPayload.creative_name || undefined,
    promoter_id: rawPayload.promoter_id || undefined,
    label_id: rawPayload.label_id || undefined,
    band_id: isMiguelNameOrProfile(rawPayload) ? 'cbddb810-259b-4230-9968-3d402dfdb872' : (isCommunityBandRecord(rawPayload.band_id) ? undefined : (rawPayload.band_id || undefined)),
    band_name: isMiguelNameOrProfile(rawPayload) ? 'Virulent Excision' : ((rawPayload.band_name && (isCommunityBandRecord(rawPayload.band_name) || String(rawPayload.band_name).toLowerCase().includes('necroticgorebeast'))) ? undefined : (rawPayload.band_name || rawPayload.bandName || undefined)),
    genre_tags: Array.isArray(rawPayload.genre_tags) ? rawPayload.genre_tags : (Array.isArray(rawPayload.genres) ? rawPayload.genres : undefined),
    top_song_title: rawPayload.top_song_title || rawPayload.favoriteSong || undefined,
    top_song_url: rawPayload.top_song_url || undefined,
    update_ticker: rawPayload.update_ticker || rawPayload.rosterTicker || undefined,
  };

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

      try {
        const cachedFeedRaw =
          localStorage.getItem('nexus_social_feed_cache') || localStorage.getItem('nexus_social_feed_v2');
        let feedItems: any[] = [];
        if (cachedFeedRaw) {
          try {
            feedItems = JSON.parse(cachedFeedRaw);
          } catch (e) {}
        }
        if (!feedItems.some((item: any) => item.image === mediaUrl || item.media_url === mediaUrl)) {
          feedItems.unshift(postObj);
          localStorage.setItem('nexus_social_feed_cache', JSON.stringify(feedItems));
          localStorage.setItem('nexus_social_feed_v2', JSON.stringify(feedItems));
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
    await autoArchiveProfileAssets(supabaseClient, userId, newAvatarUrl, newBannerUrl, userProfileName);
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
