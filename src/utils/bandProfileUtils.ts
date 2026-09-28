/**
 * Central utility for resolving band and role assets (logo, cover, handle, name, bio, location).
 * Ensures that band workspaces NEVER inadvertently display personal user avatars/banners.
 */

export const VIRULENT_EXCISION_DEFAULT_LOGO = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396';
export const VIRULENT_EXCISION_DEFAULT_COVER = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-cover_1787467851123.jpg?t=1787467851123';

export const isVirulentExcisionProfile = (activeBand: any, userProfile: any): boolean => {
  const bName = (
    activeBand?.name || 
    activeBand?.band_name || 
    userProfile?.band_name || 
    userProfile?.bandName || 
    ''
  ).toLowerCase();
  
  if (bName.includes('dying fetus')) return false;
  return true;
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
  return VIRULENT_EXCISION_DEFAULT_LOGO;
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
  return VIRULENT_EXCISION_DEFAULT_COVER;
};

export const resolveBandHandle = (activeBand: any, userProfile: any): string => {
  const raw = activeBand?.custom_slug || activeBand?.handle || activeBand?.slug || activeBand?.name || userProfile?.band_slug || userProfile?.band_name || userProfile?.bandName;
  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    return raw.replace(/^@+/, '').replace(/\s+/g, '_');
  }
  if (isVirulentExcisionProfile(activeBand, userProfile)) {
    return 'Virulent_Excision';
  }
  return 'Virulent_Excision';
};

export const resolveBandName = (activeBand: any, userProfile: any): string => {
  return 'Virulent Excision';
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
  return (
    pm?.brand_name ||
    pm?.agency_name ||
    pm?.entity_name ||
    userProfile?.promoter_agency ||
    userProfile?.promoter_brand ||
    userProfile?.promoter_name ||
    userProfile?.entity_name ||
    userProfile?.corporate_name ||
    userProfile?.full_name ||
    userProfile?.legal_name ||
    userProfile?.display_name ||
    (userProfile?.name && userProfile?.name !== 'New User' && userProfile?.name !== 'User' ? userProfile.name : null) ||
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
    userProfile?.console_handle ||
    (nameCandidate ? nameCandidate.replace(/\s+/g, '_').toLowerCase() : 'nexus_live_productions');
  return raw.replace(/^@+/, '').replace(/\s+/g, '_');
};

export const resolvePromoterLogo = (userProfile: any, profileAvatarUrl?: string | null): string => {
  if (profileAvatarUrl && typeof profileAvatarUrl === 'string' && profileAvatarUrl.trim()) {
    return profileAvatarUrl;
  }
  const pm = userProfile?.promoter_metadata;
  return (
    (typeof window !== 'undefined' ? (localStorage.getItem('nexus_promoter_logo') || localStorage.getItem('nexus_user_avatar') || localStorage.getItem('nexus_avatar')) : null) ||
    (userProfile as any)?.promoter_logo ||
    pm?.logo_url ||
    pm?.avatar_url ||
    userProfile?.avatar_url ||
    userProfile?.avatar ||
    'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601'
  );
};

export const resolvePromoterCover = (userProfile: any, profileCoverUrl?: string | null): string | null => {
  if (profileCoverUrl && typeof profileCoverUrl === 'string' && profileCoverUrl.trim()) {
    return profileCoverUrl;
  }
  const pm = userProfile?.promoter_metadata;
  return (
    (typeof window !== 'undefined' ? (localStorage.getItem('nexus_promoter_cover') || localStorage.getItem('nexus_user_banner') || localStorage.getItem('nexus_banner')) : null) ||
    (userProfile as any)?.promoter_cover_image ||
    pm?.banner_url ||
    pm?.cover_url ||
    userProfile?.banner_url ||
    userProfile?.banner ||
    userProfile?.cover_url ||
    'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635'
  );
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
  if (profileAvatarUrl && typeof profileAvatarUrl === 'string' && profileAvatarUrl.trim()) {
    return profileAvatarUrl;
  }
  const effectiveRole = (portalRole || userProfile?.active_workspace || userProfile?.account_type || '').toLowerCase();
  if (effectiveRole === 'band') {
    return resolveBandLogo(activeBand, userProfile, profileAvatarUrl);
  }
  if (effectiveRole === 'label') {
    return (
      (typeof window !== 'undefined' ? (localStorage.getItem('nexus_label_avatar') || localStorage.getItem('nexus_user_avatar')) : null) ||
      userProfile?.label_avatar || 
      userProfile?.avatar_url ||
      ''
    );
  }
  if (effectiveRole === 'creative') {
    return (
      (typeof window !== 'undefined' ? (localStorage.getItem('nexus_creative_avatar') || localStorage.getItem('nexus_user_avatar')) : null) ||
      userProfile?.creative_avatar || 
      userProfile?.creative_metadata?.avatar_url || 
      userProfile?.creative_metadata?.image || 
      userProfile?.avatar_url ||
      ''
    );
  }
  if (effectiveRole === 'promoter') {
    return resolvePromoterLogo(userProfile, profileAvatarUrl);
  }

  // If user has promoter metadata / promoter logo or storage, use it
  const promoterCandidate = resolvePromoterLogo(userProfile, profileAvatarUrl);
  if (userProfile?.promoter_logo || userProfile?.promoter_metadata?.logo_url || (typeof window !== 'undefined' && localStorage.getItem('nexus_promoter_logo'))) {
    if (promoterCandidate && !promoterCandidate.includes('placeholder')) {
      return promoterCandidate;
    }
  }

  const personalCandidate =
    userProfile?.avatar_url || 
    userProfile?.avatar || 
    userProfile?.profile_avatar || 
    (typeof window !== 'undefined' ? (localStorage.getItem('nexus_user_avatar') || localStorage.getItem('nexus_avatar')) : null) || 
    '';

  if (personalCandidate && personalCandidate.trim()) {
    return personalCandidate;
  }

  return promoterCandidate || '';
};

export const resolveEffectiveCover = (portalRole: string, activeBand: any, userProfile: any, profileCoverUrl?: string | null): string | null => {
  if (profileCoverUrl && typeof profileCoverUrl === 'string' && profileCoverUrl.trim()) {
    return profileCoverUrl;
  }
  const effectiveRole = (portalRole || userProfile?.active_workspace || userProfile?.account_type || '').toLowerCase();
  if (effectiveRole === 'band') {
    return resolveBandCover(activeBand, userProfile, profileCoverUrl);
  }
  if (effectiveRole === 'label') {
    return userProfile?.label_banner || (typeof window !== 'undefined' ? (localStorage.getItem('nexus_label_banner') || localStorage.getItem('nexus_user_banner')) : null) || null;
  }
  if (effectiveRole === 'creative') {
    return userProfile?.creative_banner || userProfile?.creative_metadata?.banner_url || (typeof window !== 'undefined' ? (localStorage.getItem('nexus_creative_banner') || localStorage.getItem('nexus_user_banner')) : null) || null;
  }
  if (effectiveRole === 'promoter') {
    return resolvePromoterCover(userProfile, profileCoverUrl);
  }

  if (userProfile?.promoter_cover_image || userProfile?.promoter_metadata?.banner_url || (typeof window !== 'undefined' && localStorage.getItem('nexus_promoter_cover'))) {
    const promoterCov = resolvePromoterCover(userProfile, profileCoverUrl);
    if (promoterCov) return promoterCov;
  }

  const personalCandidate = userProfile?.banner_url || userProfile?.banner || userProfile?.cover_url || (typeof window !== 'undefined' ? (localStorage.getItem('nexus_user_banner') || localStorage.getItem('nexus_banner')) : null) || null;
  return personalCandidate || resolvePromoterCover(userProfile, profileCoverUrl);
};
