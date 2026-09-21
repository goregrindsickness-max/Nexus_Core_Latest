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

export const resolveBandLogo = (activeBand: any, userProfile: any): string => {
  if (activeBand?.id && typeof window !== 'undefined') {
    const saved = localStorage.getItem(`nexus_core_band_logo_${activeBand.id}`) || localStorage.getItem(`nexus_band_logo_${activeBand.id}`);
    if (saved && !saved.startsWith('data:image')) return saved;
  }
  if (activeBand?.logo_url && !activeBand.logo_url.startsWith('data:image')) return activeBand.logo_url;
  if (activeBand?.avatar_url && !activeBand.avatar_url.startsWith('data:image')) return activeBand.avatar_url;
  if (activeBand?.avatar && !activeBand.avatar.startsWith('data:image')) return activeBand.avatar;
  if (activeBand?.image && !activeBand.image.startsWith('data:image')) return activeBand.image;
  if (userProfile?.band_logo && !userProfile.band_logo.startsWith('data:image')) return userProfile.band_logo;
  if (userProfile?.bandLogo && !userProfile.bandLogo.startsWith('data:image')) return userProfile.bandLogo;
  
  if (isVirulentExcisionProfile(activeBand, userProfile)) {
    return VIRULENT_EXCISION_DEFAULT_LOGO;
  }
  return VIRULENT_EXCISION_DEFAULT_LOGO;
};

export const resolveBandCover = (activeBand: any, userProfile: any): string => {
  if (activeBand?.id && typeof window !== 'undefined') {
    const saved = localStorage.getItem(`nexus_core_band_cover_${activeBand.id}`) || localStorage.getItem(`nexus_band_cover_${activeBand.id}`);
    if (saved && !saved.startsWith('data:image')) return saved;
  }
  if (activeBand?.cover_url && !activeBand.cover_url.startsWith('data:image')) return activeBand.cover_url;
  if (activeBand?.banner_url && !activeBand.banner_url.startsWith('data:image')) return activeBand.banner_url;
  if (activeBand?.banner && !activeBand.banner.startsWith('data:image')) return activeBand.banner;
  if (userProfile?.band_cover && !userProfile.band_cover.startsWith('data:image')) return userProfile.band_cover;
  if (userProfile?.bandCover && !userProfile.bandCover.startsWith('data:image')) return userProfile.bandCover;

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

export const resolveBandLocation = (activeBand: any, userProfile: any): string => {
  if (activeBand?.homebase) return activeBand.homebase;
  if (activeBand?.city && (activeBand?.state || activeBand?.state_province)) {
    return `${activeBand.city}, ${activeBand.state || activeBand.state_province}, ${activeBand.country || 'USA'}`;
  }
  if (activeBand?.location) return activeBand.location;
  if (userProfile?.band_location) return userProfile.band_location;
  return 'Denison, TX, USA';
};

export const resolveEffectiveAvatar = (portalRole: string, activeBand: any, userProfile: any, profileAvatarUrl?: string | null): string => {
  if (portalRole === 'band') {
    return resolveBandLogo(activeBand, userProfile);
  }
  if (portalRole === 'label') {
    return userProfile?.label_avatar || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
  }
  if (portalRole === 'creative') {
    return userProfile?.creative_avatar || userProfile?.creative_metadata?.avatar_url || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
  }
  if (portalRole === 'promoter') {
    return (userProfile as any)?.promoter_logo || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
  }
  return profileAvatarUrl || userProfile?.avatar_url || userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
};

export const resolveEffectiveCover = (portalRole: string, activeBand: any, userProfile: any, profileCoverUrl?: string | null): string | null => {
  if (portalRole === 'band') {
    return resolveBandCover(activeBand, userProfile);
  }
  if (portalRole === 'label') {
    return userProfile?.label_banner || null;
  }
  if (portalRole === 'creative') {
    return userProfile?.creative_banner || userProfile?.banner_url || null;
  }
  if (portalRole === 'promoter') {
    return (userProfile as any)?.promoter_cover_image || null;
  }
  return profileCoverUrl || userProfile?.banner_url || null;
};
