import { hasRegisteredWorkspace } from '../../../types';
import { resolveBandName, resolveBandLogo } from '../../../utils/bandProfileUtils';

export interface PostingPersona {
  id: string;
  type: 'band' | 'label' | 'promoter' | 'creative' | 'industry_pro' | 'fan';
  name: string;
  avatarUrl?: string;
  roleBadge: string;
  subtitle: string;
  realName?: string;
  isPrimaryForWorkspace?: boolean;
}

export interface PersonaResolutionParams {
  portalRole?: string;
  userProfile?: any;
  activeBand?: any;
  bands?: any[];
  postIdentity?: string;
  profileFullLegalName?: string;
  profileHandle?: string;
  profileAvatarUrl?: string;
}

/**
 * Returns all valid personas the current user can adopt when publishing a transmission.
 * The primary persona matching the active workspace is placed first.
 */
export function getAvailablePersonas({
  portalRole = 'industry_pro',
  userProfile,
  activeBand,
  bands = [],
  profileFullLegalName,
  profileHandle,
  profileAvatarUrl,
}: PersonaResolutionParams): PostingPersona[] {
  const personas: PostingPersona[] = [];
  const registeredIds = new Set<string>();

  const normalizedRole = (portalRole || userProfile?.active_workspace || 'industry_pro').toLowerCase();
  const liveUserAvatar = profileAvatarUrl || userProfile?.avatar || userProfile?.avatar_url || userProfile?.profile_avatar || userProfile?.profile_image;
  const legalName = profileFullLegalName || userProfile?.full_name || userProfile?.legal_name || userProfile?.name;

  const addPersona = (p: PostingPersona, isPrimary = false) => {
    if (!registeredIds.has(p.id)) {
      registeredIds.add(p.id);
      if (isPrimary) {
        personas.unshift({ ...p, isPrimaryForWorkspace: true });
      } else {
        personas.push(p);
      }
    }
  };

  // Collect all band candidates from props, userProfile, registered_workspaces, and localStorage
  const rawBandCandidates: any[] = [];
  if (activeBand && typeof activeBand === 'object') {
    rawBandCandidates.push(activeBand);
  }
  if (Array.isArray(bands)) {
    for (const b of bands) {
      if (b) rawBandCandidates.push(b);
    }
  }
  if (Array.isArray(userProfile?.bands)) {
    for (const b of userProfile.bands) {
      if (b) rawBandCandidates.push(b);
    }
  }
  if (Array.isArray(userProfile?.registered_workspaces)) {
    for (const w of userProfile.registered_workspaces) {
      if (!w) continue;
      if (typeof w === 'object') {
        const wType = String(w.type || w.workspace_type || w.key || '').toLowerCase();
        if (wType === 'band' || w.band_id) {
          rawBandCandidates.push({
            id: w.id || w.band_id || w.name,
            name: w.name || w.band_name || userProfile?.band_name || userProfile?.bandName,
            logo_url: w.logo_url || w.logo || userProfile?.band_logo || userProfile?.bandLogo,
            role: w.role
          });
        }
      } else if (typeof w === 'string') {
        const trimmed = w.trim();
        if (trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && ((parsed.type || parsed.workspace_type) === 'band' || parsed.band_id)) {
              rawBandCandidates.push({
                id: parsed.id || parsed.band_id || parsed.name,
                name: parsed.name || parsed.band_name || userProfile?.band_name || userProfile?.bandName,
                logo_url: parsed.logo_url || parsed.logo,
                role: parsed.role
              });
            }
          } catch (_) {}
        }
      }
    }
  }
  if (userProfile?.band_name || userProfile?.bandName || userProfile?.band_id) {
    rawBandCandidates.push({
      id: userProfile.band_id || 'band:active',
      name: userProfile.band_name || userProfile.bandName || 'Band Workspace',
      logo_url: userProfile.band_logo || userProfile.bandLogo || liveUserAvatar,
    });
  }
  try {
    const cachedActiveBandRaw = localStorage.getItem('nexus_active_band');
    if (cachedActiveBandRaw) {
      const parsedCached = JSON.parse(cachedActiveBandRaw);
      if (parsedCached && (parsedCached.name || parsedCached.id)) {
        rawBandCandidates.push(parsedCached);
      }
    }
  } catch (_) {}
  try {
    const cachedCoreBandsRaw = localStorage.getItem('nexus_core_bands');
    if (cachedCoreBandsRaw) {
      const parsedCoreBands = JSON.parse(cachedCoreBandsRaw);
      if (Array.isArray(parsedCoreBands)) {
        for (const cb of parsedCoreBands) {
          if (cb) rawBandCandidates.push(cb);
        }
      }
    }
  } catch (_) {}

  // Check if band workspace is registered on profile
  const isBandWorkspaceRegistered = hasRegisteredWorkspace(userProfile, 'band') ||
    userProfile?.account_type === 'band' ||
    userProfile?.active_workspace === 'band' ||
    Boolean(userProfile?.band_id || userProfile?.bandName || userProfile?.band_name);

  if (isBandWorkspaceRegistered && rawBandCandidates.length === 0) {
    rawBandCandidates.push({
      id: userProfile?.band_id || 'band:registered',
      name: userProfile?.band_name || userProfile?.bandName || 'Band / Artist',
      logo_url: userProfile?.band_logo || userProfile?.bandLogo || liveUserAvatar,
      role: 'Band Workspace'
    });
  }

  // 1. Primary workspace persona based on active portal role
  if (normalizedRole === 'band' || normalizedRole.includes('artist')) {
    const bandName = resolveBandName(activeBand, userProfile) || (bands[0]?.name) || (rawBandCandidates[0]?.name) || 'Band / Artist';
    const bandAvatar = resolveBandLogo(activeBand, userProfile) || (bands[0]?.logo_url) || (rawBandCandidates[0]?.logo_url) || liveUserAvatar;
    const rawBandId = activeBand?.id || userProfile?.band_id || (bands[0]?.id) || (rawBandCandidates[0]?.id) || 'active';
    const bandId = String(rawBandId).startsWith('band:') ? String(rawBandId) : `band:${rawBandId}`;
    addPersona({
      id: bandId,
      type: 'band',
      name: bandName,
      avatarUrl: bandAvatar,
      roleBadge: 'Band / Artist',
      subtitle: 'Active Band Workspace',
      realName: legalName,
    }, true);
  } else if (normalizedRole === 'label') {
    const labelName = userProfile?.label_company_name || userProfile?.label_name || 'Record Label';
    const labelAvatar = userProfile?.label_logo || liveUserAvatar;
    addPersona({
      id: 'workspace:label',
      type: 'label',
      name: labelName,
      avatarUrl: labelAvatar,
      roleBadge: 'Record Label',
      subtitle: 'Record Label Terminal',
      realName: legalName,
    }, true);
  } else if (normalizedRole === 'promoter') {
    const promoterName = userProfile?.promoter_metadata?.brand_name || userProfile?.promoter_name || 'Promoter Gateway';
    const promoterAvatar = userProfile?.promoter_metadata?.logo || userProfile?.promoter_logo || liveUserAvatar;
    addPersona({
      id: 'workspace:promoter',
      type: 'promoter',
      name: promoterName,
      avatarUrl: promoterAvatar,
      roleBadge: 'Promoter',
      subtitle: 'Venue Promoter Gateway',
      realName: legalName,
    }, true);
  } else if (normalizedRole === 'creative') {
    const creativeName = userProfile?.creative_metadata?.business_name || 
      userProfile?.creative_business_name || 
      userProfile?.creative_name || 
      userProfile?.creative_profile?.business_name || 
      userProfile?.creative_profile?.name || 
      (profileHandle || userProfile?.console_handle || userProfile?.username || legalName || 'Creative Pro');
    const creativeAvatar = userProfile?.creative_metadata?.avatar_url || userProfile?.creative_avatar || userProfile?.creative_profile?.avatar || liveUserAvatar;
    addPersona({
      id: 'workspace:creative',
      type: 'creative',
      name: creativeName,
      avatarUrl: creativeAvatar,
      roleBadge: 'Creative Pro',
      subtitle: 'Creative / Crew Space',
      realName: legalName,
    }, true);
  } else if (normalizedRole === 'fan_only' || normalizedRole === 'fan') {
    const fanHandle = profileHandle || userProfile?.console_handle || userProfile?.screen_name || 'Fan Listener';
    addPersona({
      id: 'personal:fan',
      type: 'fan',
      name: fanHandle,
      avatarUrl: liveUserAvatar,
      roleBadge: 'Fan',
      subtitle: 'Fan Identity',
      realName: legalName,
    }, true);
  } else {
    // Default Industry Pro
    const proHandle = profileHandle || userProfile?.console_handle || userProfile?.username || legalName || 'Industry Pro';
    addPersona({
      id: 'personal:industry_pro',
      type: 'industry_pro',
      name: proHandle,
      avatarUrl: liveUserAvatar,
      roleBadge: 'Industry Pro',
      subtitle: 'Personal Pro Console',
      realName: legalName,
    }, true);
  }

  // 2. Add all bands the user owns or manages or has registered
  const seenBandKeys = new Set<string>();
  for (const b of rawBandCandidates) {
    if (!b) continue;
    const bandName = b.name || b.band_name || (typeof b === 'string' ? b : '');
    if (!bandName || typeof bandName !== 'string' || !bandName.trim()) continue;

    const rawId = b.id || b.band_id || bandName;
    const cleanId = String(rawId).startsWith('band:') ? String(rawId) : `band:${rawId}`;
    const nameKey = bandName.trim().toLowerCase();

    if (seenBandKeys.has(cleanId) || seenBandKeys.has(nameKey)) continue;
    seenBandKeys.add(cleanId);
    seenBandKeys.add(nameKey);

    const avatar = b.logo_url || b.logo || b.avatar_url || b.cover_url || userProfile?.band_logo || userProfile?.bandLogo || liveUserAvatar;

    addPersona({
      id: cleanId,
      type: 'band',
      name: bandName.trim(),
      avatarUrl: avatar,
      roleBadge: 'Band / Artist',
      subtitle: b.role ? `Band (${b.role})` : (activeBand?.id && String(rawId).includes(String(activeBand.id)) ? 'Active Band Workspace' : 'Band Workspace'),
      realName: legalName,
    });
  }

  // 3. Add Label workspace persona if user has registered label data
  if (userProfile?.label_company_name && !registeredIds.has('workspace:label')) {
    addPersona({
      id: 'workspace:label',
      type: 'label',
      name: userProfile.label_company_name,
      avatarUrl: userProfile?.label_logo || liveUserAvatar,
      roleBadge: 'Record Label',
      subtitle: 'Record Label Terminal',
      realName: legalName,
    });
  }

  // 4. Add Promoter workspace persona if user has promoter data
  if ((userProfile?.promoter_metadata?.brand_name || userProfile?.promoter_name) && !registeredIds.has('workspace:promoter')) {
    addPersona({
      id: 'workspace:promoter',
      type: 'promoter',
      name: userProfile.promoter_metadata?.brand_name || userProfile.promoter_name,
      avatarUrl: userProfile.promoter_metadata?.logo || userProfile.promoter_logo || liveUserAvatar,
      roleBadge: 'Promoter',
      subtitle: 'Venue Promoter Gateway',
      realName: legalName,
    });
  }

  // 5. Add Creative workspace persona if user has creative metadata or registration
  const hasCreativeAccess = hasRegisteredWorkspace(userProfile, 'creative') ||
    userProfile?.account_type === 'creative' ||
    userProfile?.active_workspace === 'creative' ||
    Boolean(userProfile?.creative_metadata?.business_name || userProfile?.creative_business_name || userProfile?.creative_name || userProfile?.creative_profile);
  if (hasCreativeAccess && !registeredIds.has('workspace:creative')) {
    const creativeName = userProfile?.creative_metadata?.business_name || 
      userProfile?.creative_business_name || 
      userProfile?.creative_name || 
      userProfile?.creative_profile?.business_name || 
      userProfile?.creative_profile?.name || 
      (profileHandle || userProfile?.console_handle || userProfile?.username || legalName || 'Creative Pro');
    const creativeAvatar = userProfile?.creative_metadata?.avatar_url || userProfile?.creative_avatar || userProfile?.creative_profile?.avatar || liveUserAvatar;
    addPersona({
      id: 'workspace:creative',
      type: 'creative',
      name: creativeName,
      avatarUrl: creativeAvatar,
      roleBadge: 'Creative Pro',
      subtitle: 'Creative / Crew Space',
      realName: legalName,
    });
  }

  // 6. Always ensure Personal Industry Pro is available as an option
  if (!registeredIds.has('personal:industry_pro') && normalizedRole !== 'fan_only' && normalizedRole !== 'fan') {
    const proHandle = profileHandle || userProfile?.console_handle || userProfile?.username || legalName || 'Industry Pro';
    addPersona({
      id: 'personal:industry_pro',
      type: 'industry_pro',
      name: proHandle,
      avatarUrl: liveUserAvatar,
      roleBadge: 'Industry Pro',
      subtitle: 'Personal Pro Console',
      realName: legalName,
    });
  }

  return personas;
}

/**
 * Deterministically resolves the active posting persona from postIdentity and available personas.
 */
export function resolveActivePersona(params: PersonaResolutionParams): PostingPersona {
  const personas = getAvailablePersonas(params);
  if (personas.length === 0) {
    return {
      id: 'personal:industry_pro',
      type: 'industry_pro',
      name: params.profileHandle || params.userProfile?.name || 'Operator',
      avatarUrl: params.profileAvatarUrl || params.userProfile?.avatar,
      roleBadge: 'Industry Pro',
      subtitle: 'Personal Console',
      realName: params.profileFullLegalName || params.userProfile?.full_name || params.userProfile?.name,
    };
  }

  const identity = params.postIdentity;
  if (!identity || identity === 'default' || identity === 'active') {
    return personas[0];
  }

  // Direct ID match
  const directMatch = personas.find(p => p.id === identity);
  if (directMatch) return directMatch;

  // Band ID match (e.g. postIdentity was just 'b1' instead of 'band:b1' or vice versa)
  const bandMatch = personas.find(p => 
    p.id === `band:${identity}` || 
    p.id.replace(/^band:/, '') === identity.replace(/^band:/, '') ||
    (p.type === 'band' && (p.id.includes(identity) || p.name.toLowerCase() === identity.toLowerCase()))
  );
  if (bandMatch) return bandMatch;

  // Workspace type match (e.g. postIdentity === 'label' or 'promoter' or 'creative' or 'band')
  const typeMatch = personas.find(p => p.type === identity || p.id === `workspace:${identity}` || (identity === 'band' && p.type === 'band'));
  if (typeMatch) return typeMatch;

  return personas[0];
}
