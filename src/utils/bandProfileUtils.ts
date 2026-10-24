import { isMiguelNameOrProfile } from '../components/social/utils/profileUtils';
import { 
  VIRULENT_EXCISION_SVG_LOGO, 
  VIRULENT_EXCISION_SVG_COVER, 
  PROMOTER_SVG_AVATAR, 
  PROMOTER_SVG_COVER,
  VORTEX_GRAPHICS_SVG_AVATAR,
  VORTEX_GRAPHICS_SVG_COVER,
  getResilientFallback,
  handleImageFallbackError
} from './imageFallbacks';

/**
 * Central utility for resolving band and role assets (logo, cover, handle, name, bio, location).
 * Ensures that band and creative workspaces NEVER inadvertently display personal user avatars/banners.
 */

export const VIRULENT_EXCISION_DEFAULT_LOGO = VIRULENT_EXCISION_SVG_LOGO;
export const VIRULENT_EXCISION_DEFAULT_COVER = VIRULENT_EXCISION_SVG_COVER;
export { getResilientFallback, handleImageFallbackError };

export const isVirulentExcisionProfile = (activeBand: any, userProfile: any): boolean => {
  const bName = (
    activeBand?.name || 
    activeBand?.band_name || 
    userProfile?.band_name || 
    userProfile?.bandName || 
    ''
  ).toLowerCase();
  
  return bName.includes('virulent');
};

export const resolveBandLogo = (activeBand: any, userProfile: any, profileAvatarUrl?: string | null): string => {
  if (profileAvatarUrl && typeof profileAvatarUrl === 'string' && profileAvatarUrl.trim()) {
    return profileAvatarUrl;
  }
  if (activeBand?.id && typeof window !== 'undefined') {
    const saved = localStorage.getItem(`nexus_core_band_logo_${activeBand.id}`) || localStorage.getItem(`nexus_band_logo_${activeBand.id}`) || localStorage.getItem('nexus_band_logo');
    if (saved && typeof saved === 'string' && saved.trim()) return saved;
  }
  const userLogo = userProfile?.band_logo || userProfile?.bandLogo || (userProfile?.account_type === 'band' ? userProfile?.avatar_url : null);
  if (userLogo && typeof userLogo === 'string' && userLogo.trim()) {
    return userLogo;
  }
  if (activeBand?.logo_url && typeof activeBand.logo_url === 'string' && activeBand.logo_url.trim()) return activeBand.logo_url;
  if (activeBand?.avatar_url && typeof activeBand.avatar_url === 'string' && activeBand.avatar_url.trim()) return activeBand.avatar_url;
  if (activeBand?.avatar && typeof activeBand.avatar === 'string' && activeBand.avatar.trim()) return activeBand.avatar;
  if (activeBand?.image && typeof activeBand.image === 'string' && activeBand.image.trim()) return activeBand.image;
  if (userProfile?.band_metadata?.logo_url && typeof userProfile.band_metadata.logo_url === 'string' && userProfile.band_metadata.logo_url.trim()) {
    return userProfile.band_metadata.logo_url;
  }
  
  if (isVirulentExcisionProfile(activeBand, userProfile)) {
    return VIRULENT_EXCISION_DEFAULT_LOGO;
  }
  return '';
};

export const resolveBandCover = (activeBand: any, userProfile: any, profileCoverUrl?: string | null): string => {
  if (profileCoverUrl && typeof profileCoverUrl === 'string' && profileCoverUrl.trim()) {
    return profileCoverUrl;
  }
  if (activeBand?.id && typeof window !== 'undefined') {
    const saved = localStorage.getItem(`nexus_core_band_cover_${activeBand.id}`) || localStorage.getItem(`nexus_band_cover_${activeBand.id}`) || localStorage.getItem('nexus_band_cover');
    if (saved && typeof saved === 'string' && saved.trim()) return saved;
  }
  const userCover = userProfile?.band_cover || userProfile?.bandCover || (userProfile?.account_type === 'band' ? (userProfile?.banner_url || userProfile?.banner) : null) || (typeof window !== 'undefined' ? localStorage.getItem('nexus_band_cover') : null);
  if (userCover && typeof userCover === 'string' && userCover.trim()) {
    return userCover;
  }
  if (activeBand?.cover_url && typeof activeBand.cover_url === 'string' && activeBand.cover_url.trim()) return activeBand.cover_url;
  if (activeBand?.banner_url && typeof activeBand.banner_url === 'string' && activeBand.banner_url.trim()) return activeBand.banner_url;
  if (activeBand?.banner && typeof activeBand.banner === 'string' && activeBand.banner.trim()) return activeBand.banner;

  if (isVirulentExcisionProfile(activeBand, userProfile)) {
    return VIRULENT_EXCISION_DEFAULT_COVER;
  }
  return '';
};

export const resolveBandHandle = (activeBand: any, userProfile: any): string => {
  const raw = activeBand?.custom_slug || activeBand?.handle || activeBand?.slug || activeBand?.name || userProfile?.band_slug || userProfile?.band_name || userProfile?.bandName;
  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    return raw.replace(/^@+/, '').replace(/\s+/g, '_');
  }
  if (isVirulentExcisionProfile(activeBand, userProfile)) {
    return 'Virulent_Excision';
  }
  return 'Band_Artist';
};

export const resolveBandName = (activeBand: any, userProfile: any): string => {
  if (activeBand?.name && typeof activeBand.name === 'string' && activeBand.name.trim()) {
    return activeBand.name.trim();
  }
  if (activeBand?.band_name && typeof activeBand.band_name === 'string' && activeBand.band_name.trim()) {
    return activeBand.band_name.trim();
  }
  if (userProfile?.band_name && typeof userProfile.band_name === 'string' && userProfile.band_name.trim()) {
    return userProfile.band_name.trim();
  }
  if (userProfile?.bandName && typeof userProfile.bandName === 'string' && userProfile.bandName.trim()) {
    return userProfile.bandName.trim();
  }
  if (isVirulentExcisionProfile(activeBand, userProfile)) {
    return 'Virulent Excision';
  }
  return 'Band / Artist';
};

export const resolveBandBio = (activeBand: any, userProfile: any): string => {
  if (activeBand?.id && typeof window !== 'undefined') {
    const saved = localStorage.getItem(`nexus_band_bio_${activeBand.id}`);
    if (saved) return saved;
  }
  if (activeBand?.bio) return activeBand.bio;
  if (activeBand?.description) return activeBand.description;
  if (userProfile?.band_bio) return userProfile.band_bio;
  if (userProfile?.bandBio) return userProfile.bandBio;

  if (isVirulentExcisionProfile(activeBand, userProfile)) {
    return 'V.E. is brutal death metal, fusing old-school NYDM weight with modern technical slam. Driven by themes of biological reconfiguration and systemic depopulation, the project stands as an uncompromising, heavy-hitting soundtrack to humanity’s extinction..';
  }
  return 'Official Nexus Artist Profile.';
};

export const formatCleanLocation = (rawLoc?: string | null, rawState?: string | null, rawCountry?: string | null): string => {
  if (!rawLoc && !rawState && !rawCountry) return '';
  const combined = `${rawLoc || ''}, ${rawState || ''}, ${rawCountry || ''}`;
  const rawParts = combined
    .split(/[,/|]+/)
    .map(p => p.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const parts: string[] = [];

  const STATE_MAP: Record<string, string> = {
    'texas': 'tx',
    'california': 'ca',
    'illinois': 'il',
    'michigan': 'mi',
    'new york': 'ny',
    'florida': 'fl',
    'ohio': 'oh',
    'pennsylvania': 'pa',
    'tennessee': 'tn',
    'georgia': 'ga',
    'colorado': 'co',
    'washington': 'wa',
    'massachusetts': 'ma',
    'arizona': 'az',
    'indiana': 'in',
    'missouri': 'mo',
    'maryland': 'md',
    'wisconsin': 'wi',
    'minnesota': 'mn',
    'louisiana': 'la',
    'alabama': 'al',
    'kentucky': 'ky',
    'oregon': 'or',
    'oklahoma': 'ok',
    'connecticut': 'ct',
    'utah': 'ut',
    'nevada': 'nv',
    'iowa': 'ia',
    'arkansas': 'ar',
    'mississippi': 'ms',
    'kansas': 'ks',
    'new mexico': 'nm',
    'nebraska': 'ne',
    'west virginia': 'wv',
    'idaho': 'id',
    'hawaii': 'hi',
    'new hampshire': 'nh',
    'maine': 'me',
    'rhode island': 'ri',
    'montana': 'mt',
    'delaware': 'de',
    'south dakota': 'sd',
    'north dakota': 'nd',
    'alaska': 'ak',
    'vermont': 'vt',
    'wyoming': 'wy'
  };

  for (let rawPart of rawParts) {
    let clean = rawPart.replace(/\s+/g, ' ').trim();
    if (!clean) continue;

    // Eliminate repeated words within a single segment (e.g. "TX TX" or "Denison TX TX")
    const words = clean.split(' ');
    const dedupedWords: string[] = [];
    for (const w of words) {
      if (dedupedWords.length > 0 && dedupedWords[dedupedWords.length - 1].toLowerCase() === w.toLowerCase()) {
        continue;
      }
      dedupedWords.push(w);
    }
    clean = dedupedWords.join(' ');

    const lower = clean.toLowerCase();
    const normalizedState = STATE_MAP[lower] || (lower.length === 2 ? lower : null);

    if (normalizedState && seen.has(normalizedState)) {
      continue;
    }

    if (!seen.has(lower)) {
      // Check if this part is a state that is already at the end of the previous city part
      const isAlreadyInCity = parts.some(existing => {
        const exLower = existing.toLowerCase();
        if (clean.length === 2 && (exLower.endsWith(` ${lower}`) || exLower.endsWith(`, ${lower}`))) {
          return true;
        }
        if (normalizedState && (exLower.endsWith(` ${normalizedState}`) || exLower.endsWith(`, ${normalizedState}`))) {
          return true;
        }
        return false;
      });

      if (!isAlreadyInCity) {
        seen.add(lower);
        if (normalizedState) seen.add(normalizedState);
        parts.push(clean);
      }
    }
  }

  // Ensure if first part already has the 2-letter state at end, remove a standalone duplicate second part
  if (parts.length >= 2) {
    const firstLower = parts[0].toLowerCase();
    const secondLower = parts[1].toLowerCase();
    if (secondLower.length === 2 && (firstLower.endsWith(` ${secondLower}`) || firstLower.endsWith(`, ${secondLower}`))) {
      parts.splice(1, 1);
    }
  }

  return parts.join(', ');
};

export const resolveBandLocation = (activeBand: any, userProfile: any): string => {
  if (activeBand?.city || activeBand?.state || activeBand?.state_province || activeBand?.homebase || activeBand?.location) {
    const rawCity = activeBand?.city || '';
    const rawState = activeBand?.state || activeBand?.state_province || '';
    const rawCountry = activeBand?.country || '';
    const rawHomebase = activeBand?.homebase || activeBand?.location || '';
    const clean = formatCleanLocation(rawCity || rawHomebase, rawState, rawCountry);
    if (clean) return clean;
  }
  if (userProfile?.city || userProfile?.state_province) {
    const clean = formatCleanLocation(userProfile.city, userProfile.state_province, userProfile.country);
    if (clean) return clean;
  }
  return 'Denison, TX, USA';
};

export const resolvePromoterName = (userProfile: any): string => {
  const pm = userProfile?.promoter_metadata;
  const saved = typeof window !== 'undefined' ? (localStorage.getItem('nexus_promoter_brand') || localStorage.getItem('nexus_promoter_name')) : null;
  if (saved && typeof saved === 'string' && saved.trim()) return saved.trim();

  return (
    pm?.brand_name ||
    pm?.agency_name ||
    pm?.entity_name ||
    userProfile?.promoter_agency ||
    userProfile?.promoter_brand ||
    userProfile?.promoter_name ||
    userProfile?.entity_name ||
    userProfile?.corporate_name ||
    'Nexus Live Productions'
  );
};

export const resolvePromoterHandle = (userProfile: any): string => {
  const nameCandidate = resolvePromoterName(userProfile);
  const raw =
    userProfile?.promoter_handle ||
    userProfile?.promoter_metadata?.brand_name ||
    userProfile?.promoter_metadata?.agency_name ||
    userProfile?.promoter_agency ||
    userProfile?.promoter_brand ||
    userProfile?.promoter_name ||
    (nameCandidate ? nameCandidate.replace(/\s+/g, '_').toLowerCase() : 'nexus_live_productions');
  return raw.replace(/^@+/, '').replace(/\s+/g, '_');
};

export const PROMOTER_DEFAULT_AVATAR = PROMOTER_SVG_AVATAR;
export const PROMOTER_DEFAULT_COVER = PROMOTER_SVG_COVER;

export const VORTEX_GRAPHICS_DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23050505'/><circle cx='200' cy='200' r='180' fill='none' stroke='%2310b981' stroke-width='6' stroke-dasharray='12 6'/><circle cx='200' cy='200' r='140' fill='none' stroke='%23d946ef' stroke-width='4' opacity='0.7'/><g transform='translate(200,200)'><path d='M0,-110 C60,-110 110,-60 110,0 C110,60 60,110 0,110 C-60,110 -110,60 -110,0' fill='none' stroke='%2310b981' stroke-width='8' stroke-linecap='round'/><path d='M0,-75 C40,-75 75,-40 75,0 C75,40 40,75 0,75 C-40,75 -75,40 -75,0' fill='none' stroke='%23d946ef' stroke-width='6' stroke-linecap='round'/><path d='M0,-40 C20,-40 40,-20 40,0 C40,20 20,40 0,40 C-20,40 -40,20 -40,0' fill='none' stroke='%2322c55e' stroke-width='5'/><circle cx='0' cy='0' r='14' fill='%2310b981'/></g><text x='200' y='360' font-family='monospace' font-size='22' font-weight='900' fill='%2310b981' text-anchor='middle' letter-spacing='4'>VORTEX GRAPHICS</text></svg>";
export const VORTEX_GRAPHICS_DEFAULT_COVER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80';
export const CREATIVE_GENERIC_DEFAULT_AVATAR = VORTEX_GRAPHICS_DEFAULT_AVATAR;
export const CREATIVE_GENERIC_DEFAULT_COVER = VORTEX_GRAPHICS_DEFAULT_COVER;

export const DEFAULT_PERSONAL_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
export const DEFAULT_PERSONAL_COVER = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80';

export const isPromoterAvatarUrl = (url?: string | null, _userProfile?: any): boolean => {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const clean = url.trim();
  return clean.includes('promoter-avatar_') || clean.includes('promoter-logo_') || clean.includes('NEXUS LIVE') || clean.includes('PROMOTER');
};

export const isPromoterCoverUrl = (url?: string | null, _userProfile?: any): boolean => {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const clean = url.trim();
  return clean.includes('promoter-banner_') || clean.includes('promoter-cover_');
};

export const isCreativeAvatarUrl = (url?: string | null, _userProfile?: any): boolean => {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const clean = url.trim();
  return clean.includes('creative-avatar') || clean.includes('creative-logo') || clean.includes('VORTEX GRAPHICS');
};

export const isCreativeCoverUrl = (url?: string | null, _userProfile?: any): boolean => {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const clean = url.trim();
  return clean.includes('creative-banner') || clean.includes('creative-cover') || clean.includes('creative_banner');
};

export const resolveCreativeName = (userProfile: any): string => {
  const cm = userProfile?.creative_metadata;
  const saved = typeof window !== 'undefined' ? (localStorage.getItem('nexus_creative_business_name') || localStorage.getItem('nexus_creative_name')) : null;
  if (saved && typeof saved === 'string' && saved.trim() && !['pro creative', 'creative pro', 'creative hub', 'creative studio'].includes(saved.toLowerCase().trim())) {
    return saved.trim();
  }

  const cand =
    cm?.business_name ||
    cm?.creative_name ||
    userProfile?.creative_business_name ||
    userProfile?.creative_name ||
    userProfile?.creative_profile?.business_name ||
    userProfile?.creative_profile?.name;

  if (cand && typeof cand === 'string' && cand.trim() && !['pro creative', 'creative pro', 'creative hub', 'creative studio'].includes(cand.toLowerCase().trim())) {
    return cand.trim();
  }

  return 'Vortex Graphics';
};

export const resolveCreativeHandle = (userProfile: any): string => {
  const cm = userProfile?.creative_metadata;
  const raw =
    userProfile?.creative_handle ||
    userProfile?.creative_slug ||
    cm?.creative_handle ||
    cm?.handle ||
    (typeof window !== 'undefined' ? localStorage.getItem('nexus_creative_handle') : null);

  if (raw && typeof raw === 'string' && raw.trim() && !['creative_pro', 'creativepro', 'user', '@user'].includes(raw.toLowerCase().trim())) {
    return raw.replace(/^@+/, '').replace(/\s+/g, '_');
  }

  return 'vortexgraphics';
};

export const resolveCreativeLogo = (userProfile: any, profileAvatarUrl?: string | null): string => {
  const cm = userProfile?.creative_metadata;

  const saved = typeof window !== 'undefined' ? localStorage.getItem('nexus_creative_avatar') : null;
  if (saved && typeof saved === 'string' && saved.trim() && !isPromoterAvatarUrl(saved)) {
    return saved.trim();
  }

  const personalAvatar = userProfile?.avatar_url || (typeof window !== 'undefined' ? localStorage.getItem('nexus_user_avatar') : null);

  const cand =
    userProfile?.creative_avatar ||
    cm?.avatar_url ||
    cm?.image ||
    cm?.logo_url ||
    userProfile?.creative_profile?.avatar ||
    userProfile?.creative_profile?.avatar_url;

  if (cand && typeof cand === 'string' && cand.trim() && !isPromoterAvatarUrl(cand)) {
    if (cand !== personalAvatar || cand.includes('vortex') || cand.includes('creative') || cand.includes('data:image')) {
      return cand.trim();
    }
  }

  if (profileAvatarUrl && typeof profileAvatarUrl === 'string' && profileAvatarUrl.trim() && !isPromoterAvatarUrl(profileAvatarUrl)) {
    if (profileAvatarUrl !== personalAvatar || profileAvatarUrl.includes('vortex') || profileAvatarUrl.includes('creative') || profileAvatarUrl.includes('data:image')) {
      return profileAvatarUrl.trim();
    }
  }

  return VORTEX_GRAPHICS_DEFAULT_AVATAR;
};

export const resolveCreativeCover = (userProfile: any, profileCoverUrl?: string | null): string | null => {
  const cm = userProfile?.creative_metadata;

  const saved = typeof window !== 'undefined' ? (localStorage.getItem('nexus_creative_banner') || localStorage.getItem('nexus_creative_cover')) : null;
  if (saved && typeof saved === 'string' && saved.trim()) {
    return saved.trim();
  }

  const personalCover = userProfile?.banner_url || (typeof window !== 'undefined' ? localStorage.getItem('nexus_user_banner') : null);

  const cand =
    userProfile?.creative_banner ||
    cm?.banner_url ||
    cm?.cover_url ||
    userProfile?.creative_profile?.banner ||
    userProfile?.creative_profile?.cover_url;

  if (cand && typeof cand === 'string' && cand.trim() && cand !== personalCover && cand !== DEFAULT_PERSONAL_COVER) {
    return cand.trim();
  }

  if (profileCoverUrl && typeof profileCoverUrl === 'string' && profileCoverUrl.trim() && profileCoverUrl !== personalCover && profileCoverUrl !== DEFAULT_PERSONAL_COVER) {
    return profileCoverUrl.trim();
  }

  return VORTEX_GRAPHICS_DEFAULT_COVER;
};

export const resolveCreativeBio = (userProfile: any): string => {
  const cm = userProfile?.creative_metadata;
  const cand =
    cm?.bio ||
    cm?.biography ||
    userProfile?.creative_bio ||
    (typeof window !== 'undefined' ? localStorage.getItem('nexus_creative_bio') : null);

  if (cand && typeof cand === 'string' && cand.trim()) {
    return cand.trim();
  }

  return 'Heavy vector specialist, halftone master, custom punk typography and production-ready CMYK separated files.';
};

export const resolveCreativeLocation = (userProfile: any): string => {
  const cm = userProfile?.creative_metadata;
  const loc = cm?.city || cm?.base_location || userProfile?.creative_city || 'Detroit';
  const state = cm?.state || cm?.state_province || userProfile?.creative_state || 'MI';

  const clean = formatCleanLocation(loc, state);
  if (clean) return clean;
  return 'Detroit, MI';
};

export const resolvePromoterLogo = (userProfile: any, profileAvatarUrl?: string | null): string => {
  const pm = userProfile?.promoter_metadata;

  const saved = typeof window !== 'undefined' ? localStorage.getItem('nexus_promoter_logo') : null;
  if (saved && typeof saved === 'string' && saved.trim()) {
    return saved.trim();
  }

  const isOwnerMiguel = isMiguelNameOrProfile(userProfile);
  const OFFICIAL_NEXUS_LIVE_LOGO = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601';

  const cand =
    (userProfile as any)?.promoter_logo ||
    pm?.logo_url ||
    pm?.avatar_url ||
    userProfile?.logo_url ||
    userProfile?.logo ||
    userProfile?.avatar_url ||
    userProfile?.avatar;

  if (cand && typeof cand === 'string' && cand.trim() && !isCreativeAvatarUrl(cand)) {
    return cand.trim();
  }

  if (profileAvatarUrl && typeof profileAvatarUrl === 'string' && profileAvatarUrl.trim() && !isCreativeAvatarUrl(profileAvatarUrl)) {
    return profileAvatarUrl.trim();
  }

  if (isOwnerMiguel || (userProfile?.name && String(userProfile.name).toLowerCase().includes('nexus live'))) {
    return OFFICIAL_NEXUS_LIVE_LOGO;
  }

  return PROMOTER_DEFAULT_AVATAR;
};

export const resolvePromoterCover = (userProfile: any, profileCoverUrl?: string | null): string | null => {
  const pm = userProfile?.promoter_metadata;

  const saved = typeof window !== 'undefined' ? localStorage.getItem('nexus_promoter_cover') : null;
  if (saved && typeof saved === 'string' && saved.trim()) {
    return saved.trim();
  }

  const personalCover = userProfile?.banner_url || (typeof window !== 'undefined' ? localStorage.getItem('nexus_user_banner') : null);

  const cand =
    (userProfile as any)?.promoter_cover_image ||
    pm?.banner_url ||
    pm?.cover_url;

  if (cand && typeof cand === 'string' && cand.trim() && cand !== personalCover) {
    return cand.trim();
  }

  if (profileCoverUrl && typeof profileCoverUrl === 'string' && profileCoverUrl.trim() && profileCoverUrl !== personalCover) {
    return profileCoverUrl.trim();
  }

  return PROMOTER_DEFAULT_COVER;
};

export const resolvePromoterBio = (userProfile: any): string => {
  const pm = userProfile?.promoter_metadata;
  const cand = pm?.bio || userProfile?.promoter_bio;
  if (cand && !cand.toLowerCase().includes('booking management for underground')) {
    return cand;
  }
  return 'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. I have a lengthy history in the underground extreme metal scene with several festivals under my name most notably the Chicago/ Texas Domination Fest that ran from 2014-2024. The next evolution is set to move to another new market more details on that in the near future.';
};

export const resolvePromoterLocation = (userProfile: any): string => {
  const pm = userProfile?.promoter_metadata;
  const loc = pm?.city || pm?.base_location || (userProfile as any)?.promoter_city || userProfile?.city || '';
  const state = pm?.state || (userProfile as any)?.promoter_state || userProfile?.state_province || userProfile?.state || '';

  const clean = formatCleanLocation(loc, state);
  if (clean) return clean;
  return userProfile?.location_code || userProfile?.city_state || 'Denison, TX';
};

export const resolveEffectiveAvatar = (portalRole: string, activeBand: any, userProfile: any, profileAvatarUrl?: string | null): string => {
  const effectiveRole = (portalRole || userProfile?.active_workspace || userProfile?.account_type || '').toLowerCase();
  if (effectiveRole === 'band') {
    return resolveBandLogo(activeBand, userProfile, profileAvatarUrl);
  }
  if (effectiveRole === 'label') {
    return (
      (typeof window !== 'undefined' ? (localStorage.getItem('nexus_label_avatar')) : null) ||
      userProfile?.label_avatar || 
      userProfile?.avatar_url ||
      ''
    );
  }
  if (effectiveRole === 'creative') {
    return resolveCreativeLogo(userProfile, profileAvatarUrl);
  }
  if (effectiveRole === 'promoter') {
    return resolvePromoterLogo(userProfile, profileAvatarUrl);
  }

  // Personal / Industry Pro / Fan Role candidate filtering:
  if (profileAvatarUrl && typeof profileAvatarUrl === 'string' && profileAvatarUrl.trim() && !isPromoterAvatarUrl(profileAvatarUrl) && !isCreativeAvatarUrl(profileAvatarUrl)) {
    return profileAvatarUrl;
  }

  const rawCandidates = [
    userProfile?.profile_avatar,
    userProfile?.user_avatar,
    userProfile?.avatar_url,
    userProfile?.avatar,
    typeof window !== 'undefined' ? (localStorage.getItem('nexus_user_avatar') || localStorage.getItem('nexus_avatar')) : null,
  ];

  for (const cand of rawCandidates) {
    if (cand && typeof cand === 'string' && cand.trim() && !isPromoterAvatarUrl(cand) && !isCreativeAvatarUrl(cand) && !cand.includes('undefined') && !cand.includes('null')) {
      return cand.trim();
    }
  }

  return userProfile?.avatar_url || userProfile?.avatar || '';
};

export const resolveEffectiveCover = (portalRole: string, activeBand: any, userProfile: any, profileCoverUrl?: string | null): string | null => {
  const effectiveRole = (portalRole || userProfile?.active_workspace || userProfile?.account_type || '').toLowerCase();
  if (effectiveRole === 'band') {
    return resolveBandCover(activeBand, userProfile, profileCoverUrl);
  }
  if (effectiveRole === 'label') {
    return userProfile?.label_banner || (typeof window !== 'undefined' ? (localStorage.getItem('nexus_label_banner')) : null) || null;
  }
  if (effectiveRole === 'creative') {
    return resolveCreativeCover(userProfile, profileCoverUrl);
  }
  if (effectiveRole === 'promoter') {
    return resolvePromoterCover(userProfile, profileCoverUrl);
  }

  // Personal / Industry Pro / Fan Role cover candidate filtering:
  if (profileCoverUrl && typeof profileCoverUrl === 'string' && profileCoverUrl.trim() && !isPromoterCoverUrl(profileCoverUrl) && !isCreativeCoverUrl(profileCoverUrl)) {
    return profileCoverUrl;
  }

  const rawCandidates = [
    userProfile?.profile_cover,
    userProfile?.user_banner,
    userProfile?.banner_url,
    userProfile?.banner,
    userProfile?.cover_url,
    typeof window !== 'undefined' ? (localStorage.getItem('nexus_user_banner') || localStorage.getItem('nexus_banner')) : null,
  ];

  for (const cand of rawCandidates) {
    if (cand && typeof cand === 'string' && cand.trim() && !isPromoterCoverUrl(cand) && !isCreativeCoverUrl(cand) && !cand.includes('undefined') && !cand.includes('null')) {
      return cand.trim();
    }
  }

  return userProfile?.banner_url || userProfile?.cover_url || null;
};

export const KNOWN_USER_AVATARS: Record<string, string> = {
  'miguel goregrinder medina': DEFAULT_PERSONAL_AVATAR,
  'miguel medina': DEFAULT_PERSONAL_AVATAR,
  'tyler slamson': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'goregrindslayer': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'zachary blaster': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'blastfiend999': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'marcus cassette': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  'tapetrader99': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  'derek riff': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  'slamnation': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  'dustin shutter': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'scene photographer': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'shutterbug_live': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'alex mercer': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'deathmetalfan99': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'leo lens': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  'chris diver': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'stagediver_99': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'eric circle': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'circlepitking': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'travis gore': 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
  'texasgore': 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
  'dave shredder': 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80',
  'riffmaster': 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80',
  'goth_girl99': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'nexus promoters': 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601',
  'devourment': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
  'origin': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
  'pathology': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80'
};

export const resolveCommentAvatar = (
  comment: any,
  userProfile?: any,
  currentUserId?: string,
  currentUserName?: string
): string => {
  if (!comment) return DEFAULT_PERSONAL_AVATAR;

  const explicitAvatar = comment.avatar || comment.userAvatar || comment.user_avatar || comment.authorAvatar;
  if (
    explicitAvatar &&
    typeof explicitAvatar === 'string' &&
    explicitAvatar.trim() &&
    !explicitAvatar.includes('undefined') &&
    !explicitAvatar.includes('null') &&
    (explicitAvatar.startsWith('http') || explicitAvatar.startsWith('data:') || explicitAvatar.startsWith('/'))
  ) {
    return explicitAvatar.trim();
  }

  const commentUsername = String(comment.username || comment.author || comment.user_name || '').trim().toLowerCase();
  const commentUserId = String(comment.user_id || comment.userId || '').trim();

  const isMiguel = isMiguelNameOrProfile(commentUsername) || isMiguelNameOrProfile(commentUserId);
  const isCurrentUser = Boolean(
    (currentUserId && commentUserId && commentUserId === currentUserId) ||
    (currentUserName && commentUsername && commentUsername === currentUserName.toLowerCase())
  );

  if (isMiguel || isCurrentUser) {
    const liveAvatar =
      userProfile?.avatar_url ||
      userProfile?.avatar ||
      userProfile?.profile_avatar ||
      (typeof window !== 'undefined' ? (localStorage.getItem('nexus_user_avatar') || localStorage.getItem('nexus_avatar')) : null);

    if (liveAvatar && typeof liveAvatar === 'string' && liveAvatar.trim() && liveAvatar !== '👤') {
      return liveAvatar.trim();
    }
    return DEFAULT_PERSONAL_AVATAR;
  }

  if (commentUsername && KNOWN_USER_AVATARS[commentUsername]) {
    return KNOWN_USER_AVATARS[commentUsername];
  }

  return DEFAULT_PERSONAL_AVATAR;
};

