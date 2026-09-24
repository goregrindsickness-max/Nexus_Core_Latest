import { getSupabase } from './clientService';
import { ensureUUID, generateUUID, executeWithSchemaResilience } from './schemaResilienceService';
import { isCommunityBandRecord } from '../lib/seedBandsData';

export const PRIMARY_GENRE_KEYWORDS = new Set([
  'extreme metal',
  'rock / heavy metal',
  'rock',
  'heavy metal',
  'hardcore / punk',
  'hardcore',
  'punk',
  'electronic / industrial',
  'hip-hop / underground',
  'hip-hop',
  'electronic',
  'general',
  'other',
]);

export function sanitizeMicroGenres(genresInput: any): string[] {
  if (!genresInput) return [];
  let list: string[] = [];
  if (Array.isArray(genresInput)) {
    list = genresInput;
  } else if (typeof genresInput === 'string') {
    try {
      const parsed = JSON.parse(genresInput);
      if (Array.isArray(parsed)) list = parsed;
      else list = genresInput.split(',').map((s) => s.trim());
    } catch {
      list = genresInput.split(',').map((s) => s.trim());
    }
  }
  const filtered = list
    .filter(Boolean)
    .map((g) => (typeof g === 'object' && g ? ((g as any).name || (g as any).label || (g as any).tag || String(g)) : String(g || '')).trim())
    .filter((g) => g.length > 0);
  return Array.from(new Set(filtered));
}

export function parseLocationFields(locInput: any): { city: string; state_province: string; country: string } {
  if (!locInput) return { city: '', state_province: '', country: '' };

  if (typeof locInput === 'object') {
    return {
      city: locInput.city || locInput.homebase_city || '',
      state_province: locInput.state_province || locInput.state || '',
      country: locInput.country || '',
    };
  }

  if (typeof locInput === 'string') {
    const parts = locInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 1) {
      return { city: parts[0], state_province: '', country: '' };
    } else if (parts.length === 2) {
      return { city: parts[0], state_province: parts[1], country: '' };
    } else if (parts.length >= 3) {
      return { city: parts[0], state_province: parts[1], country: parts.slice(2).join(', ') };
    }
  }

  return { city: '', state_province: '', country: '' };
}

export function formatBandLocation(band: any): string {
  if (!band) return 'Global Scene';
  const city = band.city || '';
  const state_province = band.state_province || band.state || '';
  const country = band.country || '';
  const compiled = [city, state_province, country].filter(Boolean).join(', ');
  if (compiled) return compiled;
  if (band.homebase) return band.homebase;
  if (band.location) return band.location;
  return 'Global Scene';
}

export const VALID_BAND_COLUMNS = new Set([
  'id',
  'created_at',
  'updated_at',
  'creator_id',
  'band_name',
  'custom_slug',
  'logo_url',
  'cover_url',
  'bio',
  'founded_year',
  'micro_genres',
  'city',
  'state_province',
  'country',
  'booking_email',
  'booking_phone',
  'featured_youtube_url',
  'streaming_url',
  'metal_archives_url',
  'instagram',
  'spotify',
  'bandcamp',
  'website',
  'tour_vehicle',
  'apparel_sizes',
  'tech_rider_url',
  'lineup',
  'headcount',
  'featured_video_band_name',
  'user_role_in_band',
  'record_label',
  'tax_id',
  'legal_entity_type',
  'verification_platform',
  'legal_name',
  'payment_routing',
  'live_update',
  'featured_video_track_name',
  'verification_status',
  'is_verified',
  'is_managed_client',
  'management_role',
  'management_commission_pct',
  'management_day_rate',
  'executive_contact_name',
  'executive_contact_email',
  'executive_contact_phone',
  'client_roster_notes',
]);

export function sanitizeBandPayload(rawPayload: any): Record<string, any> {
  if (!rawPayload || typeof rawPayload !== 'object') return {};

  const clean: Record<string, any> = { ...rawPayload };

  // 0. Ensure id is a valid UUID
  if (clean.id) {
    clean.id = ensureUUID(clean.id);
  }

  // 1. Genres - Map strictly to micro_genres array
  const rawGenreSources = [
    clean.micro_genres,
    clean.sub_genres,
    clean.subgenres,
    clean.genre_tags,
    clean.genres,
    clean.genre,
  ];
  let combinedGenres: string[] = [];
  for (const src of rawGenreSources) {
    if (src) {
      const sanitized = sanitizeMicroGenres(src);
      if (sanitized.length > 0) {
        combinedGenres = Array.from(new Set([...combinedGenres, ...sanitized]));
      }
    }
  }
  clean.micro_genres = combinedGenres;

  delete clean.genre;
  delete clean.sub_genres;
  delete clean.subgenres;
  delete clean.genre_tags;
  delete clean.genres;

  // 2. Location columns (city, state_province, country)
  let city = clean.city || '';
  let state_province = clean.state_province || clean.state || '';
  let country = clean.country || '';

  if (!city && !state_province && !country && (clean.homebase || clean.location)) {
    const parsed = parseLocationFields(clean.homebase || clean.location);
    city = parsed.city;
    state_province = parsed.state_province;
    country = parsed.country;
  }

  clean.city = city ? String(city).trim() : null;
  clean.state_province = state_province ? String(state_province).trim() : null;
  clean.country = country ? String(country).trim() : null;

  delete clean.state;
  delete clean.homebase;
  delete clean.location;

  // 3. YouTube and Streaming URLs (featured_youtube_url and streaming_url)
  const featYt = clean.featured_youtube_url || clean.youtube_url || '';
  clean.featured_youtube_url = featYt ? String(featYt).trim() : null;
  delete clean.youtube_url;

  const streamUrl = clean.streaming_url || clean.music_link || '';
  clean.streaming_url = streamUrl ? String(streamUrl).trim() : null;
  delete clean.music_link;

  // 4. Metal Archives URL
  const maUrl = clean.metal_archives_url || clean.metal_archives || '';
  clean.metal_archives_url = maUrl ? String(maUrl).trim() : null;
  delete clean.metal_archives;

  // Social & Web URLs (instagram, spotify, bandcamp, website)
  clean.instagram = clean.instagram ? String(clean.instagram).trim() : null;
  
  const spotUrl = clean.spotify || clean.spotify_url || '';
  clean.spotify = spotUrl ? String(spotUrl).trim() : null;
  delete clean.spotify_url;

  const bcUrl = clean.bandcamp || clean.bandcamp_url || '';
  clean.bandcamp = bcUrl ? String(bcUrl).trim() : null;
  delete clean.bandcamp_url;

  const webUrl = clean.website || clean.website_url || '';
  clean.website = webUrl ? String(webUrl).trim() : null;
  delete clean.website_url;

  const isVerifiedVal = clean.is_verified !== undefined ? Boolean(clean.is_verified) : (clean.verification_status === 'verified_official' || false);
  clean.is_verified = isVerifiedVal;
  delete clean.verification_status;
  delete clean.curated_by;
  delete clean.curator_name;
  delete clean.followers_count;
  delete clean.discography;

  // 5. Creator ID (strictly creator_id in database)
  const rawCreatorId = clean.creator_id || clean.user_id || clean.owner_id || clean.profile_id || null;
  clean.creator_id = rawCreatorId ? ensureUUID(rawCreatorId) : null;
  delete clean.user_id;
  delete clean.owner_id;
  delete clean.profile_id;

  // 6. Band Name - guarantee non-empty band_name
  const KNOWN_SEEDED_NAMES: Record<string, string> = {
    'cordyceps': 'Cordyceps',
    'mortician': 'Mortician',
    'sanguisugabogg': 'Sanguisugabogg',
    'necrophagist': 'Necrophagist',
    'dying-fetus': 'Dying Fetus',
    'devourment': 'Devourment',
    'origin': 'Origin',
    'peelingflesh': 'PeelingFlesh',
    'putrid-pile': 'Putrid Pile',
    'lividity': 'Lividity'
  };

  let bName = (clean.band_name || clean.name || '').trim();
  const rawSlugCandidate = (clean.custom_slug || clean.slug || '').trim().toLowerCase();

  // If bName is generic or missing, attempt deep resolution
  if (!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') {
    // 1. Check known slug map
    if (rawSlugCandidate && KNOWN_SEEDED_NAMES[rawSlugCandidate]) {
      bName = KNOWN_SEEDED_NAMES[rawSlugCandidate];
    }

    // 2. Check local storage archives with dual UUID lookup
    if ((!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') && clean.id) {
      const cleanId = clean.id;
      const cleanUUID = ensureUUID(clean.id);

      const findInList = (list: any[]) => {
        return list.find((b: any) => {
          if (!b) return false;
          const bId = b.id ? String(b.id) : '';
          const bUUID = b.id ? ensureUUID(b.id) : '';
          const bSlug = (b.custom_slug || b.slug || '').trim().toLowerCase();
          return bId === cleanId || bUUID === cleanUUID || (rawSlugCandidate && bSlug === rawSlugCandidate);
        });
      };

      try {
        const archives = JSON.parse(localStorage.getItem('nexus_community_band_archives') || '[]');
        const found = findInList(archives);
        if (found?.name || found?.band_name) {
          const storedName = (found.name || found.band_name).trim();
          if (storedName && storedName.toLowerCase() !== 'underground label' && storedName.toLowerCase() !== 'nexus artist') {
            bName = storedName;
          }
        }
      } catch {}

      if (!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') {
        try {
          const allCommunity = JSON.parse(localStorage.getItem('nexus_community_bands_v2') || '[]');
          const found = findInList(allCommunity);
          if (found?.name || found?.band_name) {
            const storedName = (found.name || found.band_name).trim();
            if (storedName && storedName.toLowerCase() !== 'underground label' && storedName.toLowerCase() !== 'nexus artist') {
              bName = storedName;
            }
          }
        } catch {}
      }

      if (!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') {
        try {
          const registered = JSON.parse(localStorage.getItem('nexus_registered_bands') || '[]');
          const found = findInList(registered);
          if (found?.name || found?.band_name) {
            const storedName = (found.name || found.band_name).trim();
            if (storedName && storedName.toLowerCase() !== 'underground label' && storedName.toLowerCase() !== 'nexus artist') {
              bName = storedName;
            }
          }
        } catch {}
      }
    }

    // 3. Check active band
    if (!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') {
      try {
        const activeBandRaw = localStorage.getItem('nexus_active_band');
        if (activeBandRaw) {
          const parsed = JSON.parse(activeBandRaw);
          if (parsed?.name || parsed?.band_name) {
            const storedName = (parsed.name || parsed.band_name).trim();
            if (storedName && storedName.toLowerCase() !== 'underground label' && storedName.toLowerCase() !== 'nexus artist') {
              bName = storedName;
            }
          }
        }
      } catch {}
    }

    // 4. Derive from custom_slug if present
    if ((!bName || bName.toLowerCase() === 'underground label' || bName.toLowerCase() === 'nexus artist') && rawSlugCandidate) {
      if (KNOWN_SEEDED_NAMES[rawSlugCandidate]) {
        bName = KNOWN_SEEDED_NAMES[rawSlugCandidate];
      } else {
        // Convert slug e.g. "my-cool-band" -> "My Cool Band"
        bName = rawSlugCandidate
          .split('-')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }
  }

  if (!bName || bName.toLowerCase() === 'underground label') {
    bName = 'Nexus Artist';
  }
  clean.band_name = bName;
  delete clean.name;

  // Custom slug
  const rawSlug = clean.custom_slug || clean.slug || '';
  if (rawSlug) {
    clean.custom_slug = String(rawSlug).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  } else if (clean.band_name) {
    clean.custom_slug = clean.band_name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  }
  delete clean.slug;
  delete clean.status;

  // 7. Sanitize logo_url and cover_url strictly
  let rawLogo =
    clean.logo_url ??
    clean.avatar_url ??
    clean.logo ??
    clean.band_logo ??
    clean.image ??
    clean.avatar ??
    null;

  if ((!rawLogo || String(rawLogo).trim() === '') && clean.id) {
    const cleanId = clean.id;
    const cleanUUID = ensureUUID(clean.id);
    try {
      const allComm = JSON.parse(localStorage.getItem('nexus_community_bands_v2') || '[]');
      const found = allComm.find((b: any) => b && (b.id === cleanId || ensureUUID(b.id) === cleanUUID));
      if (found?.logo_url || found?.avatar_url || found?.avatar || found?.image) {
        rawLogo = found.logo_url || found.avatar_url || found.avatar || found.image;
      }
    } catch {}
  }
  if ((!rawLogo || String(rawLogo).trim() === '') && clean.id) {
    const cleanId = clean.id;
    const cleanUUID = ensureUUID(clean.id);
    try {
      const regBands = JSON.parse(localStorage.getItem('nexus_registered_bands') || '[]');
      const foundReg = regBands.find((b: any) => b && (b.id === cleanId || ensureUUID(b.id) === cleanUUID));
      if (foundReg?.logo_url || foundReg?.avatar_url || foundReg?.avatar || foundReg?.image) {
        rawLogo = foundReg.logo_url || foundReg.avatar_url || foundReg.avatar || foundReg.image;
      }
    } catch {}
  }

  if (typeof rawLogo === 'string' && rawLogo.trim().length > 0 && !rawLogo.includes('Nexus%20Icon%20Circuits.png')) {
    clean.logo_url = rawLogo.trim();
  } else {
    clean.logo_url = null;
  }
  delete clean.avatar_url;
  delete clean.logo;
  delete clean.band_logo;
  delete clean.image;
  delete clean.avatar;

  let rawCover =
    clean.cover_url ??
    clean.banner_url ??
    clean.cover ??
    clean.band_cover ??
    clean.banner ??
    null;

  if ((!rawCover || String(rawCover).trim() === '') && clean.id) {
    const cleanId = clean.id;
    const cleanUUID = ensureUUID(clean.id);
    try {
      const allComm = JSON.parse(localStorage.getItem('nexus_community_bands_v2') || '[]');
      const found = allComm.find((b: any) => b && (b.id === cleanId || ensureUUID(b.id) === cleanUUID));
      if (found?.cover_url || found?.banner_url || found?.cover || found?.banner) {
        rawCover = found.cover_url || found.banner_url || found.cover || found.banner;
      }
    } catch {}
  }

  if (typeof rawCover === 'string' && rawCover.trim().length > 0 && !rawCover.includes('Nexus%20Icon%20Circuits.png')) {
    clean.cover_url = rawCover.trim();
  } else {
    clean.cover_url = null;
  }
  delete clean.banner_url;
  delete clean.cover;
  delete clean.band_cover;
  delete clean.banner;

  // 8. Bio mapping strictly to 'bio' (remove any 'description' column mapping)
  const rawBio = clean.bio ?? clean.description ?? clean.about ?? null;
  if (rawBio !== null && rawBio !== undefined) {
    const trimmedBio = typeof rawBio === 'string' ? rawBio.trim() : String(rawBio);
    clean.bio = trimmedBio.length > 0 ? trimmedBio : null;
  } else {
    clean.bio = null;
  }
  delete clean.description;
  delete clean.about;

  // Record label mapping strictly to 'record_label'
  const rawLabel = clean.record_label ?? clean.label_name ?? clean.label ?? null;
  if (typeof rawLabel === 'string' && rawLabel.trim().length > 0) {
    clean.record_label = rawLabel.trim();
  } else {
    clean.record_label = null;
  }
  delete clean.label_name;
  delete clean.label;
  delete clean.label_id;

  // 9. Numeric field sanitization (prevent 22P02 invalid integer syntax on empty string)
  if (clean.founded_year !== undefined && clean.founded_year !== null && String(clean.founded_year).trim() !== '') {
    const yr = parseInt(String(clean.founded_year), 10);
    clean.founded_year = !isNaN(yr) && yr > 0 ? yr : null;
  } else {
    clean.founded_year = null;
  }

  if (clean.headcount !== undefined && clean.headcount !== null && String(clean.headcount).trim() !== '') {
    const hc = parseInt(String(clean.headcount), 10);
    clean.headcount = !isNaN(hc) && hc > 0 ? hc : null;
  } else {
    clean.headcount = null;
  }

  // 10. Booking and contact details
  clean.booking_email = clean.booking_email ? String(clean.booking_email).trim() : null;
  clean.booking_phone = clean.booking_phone ? String(clean.booking_phone).trim() : null;

  // 11. Logistics & Technical specifications
  clean.tour_vehicle = clean.tour_vehicle ? String(clean.tour_vehicle).trim() : null;
  clean.tech_rider_url = clean.tech_rider_url ? String(clean.tech_rider_url).trim() : null;
  clean.apparel_sizes = clean.apparel_sizes || null;
  clean.user_role_in_band = clean.user_role_in_band ? String(clean.user_role_in_band).trim() : null;

  // 12. Lineup sanitization
  if (clean.lineup !== undefined && clean.lineup !== null) {
    if (Array.isArray(clean.lineup)) {
      clean.lineup = clean.lineup.map((m: any) => typeof m === 'object' ? `${m.name || 'Member'} (${m.role || 'Performer'})` : String(m)).join(', ');
    } else {
      clean.lineup = String(clean.lineup);
    }
  } else {
    clean.lineup = null;
  }

  // 13. Legal, Verification, & Routing
  clean.tax_id = clean.tax_id ? String(clean.tax_id).trim() : null;
  clean.legal_entity_type = clean.legal_entity_type ? String(clean.legal_entity_type).trim() : null;
  clean.verification_platform = clean.verification_platform ? String(clean.verification_platform).trim() : null;
  clean.legal_name = clean.legal_name ? String(clean.legal_name).trim() : null;
  clean.payment_routing = clean.payment_routing ? String(clean.payment_routing).trim() : null;
  clean.live_update = clean.live_update ? String(clean.live_update).trim() : null;
  clean.featured_video_band_name = clean.featured_video_band_name ? String(clean.featured_video_band_name).trim() : null;
  clean.featured_video_track_name = clean.featured_video_track_name ? String(clean.featured_video_track_name).trim() : null;

  // 14. Timestamps
  if (clean.created_at) {
    clean.created_at = new Date(clean.created_at).toISOString();
  }
  clean.updated_at = clean.updated_at ? new Date(clean.updated_at).toISOString() : new Date().toISOString();

  // 15. STRICT SEPARATION: Completely strip out user profile account properties to prevent schema pollution
  delete clean.avatarUrl;
  delete clean.avatar;
  delete clean.creative_avatar;
  delete clean.promoter_logo;
  delete clean.label_avatar;
  delete clean.profileAvatarUrl;
  delete clean.bannerUrl;
  delete clean.creative_banner;
  delete clean.promoter_cover_image;
  delete clean.label_banner;
  delete clean.coverImage;
  delete clean.profileCoverUrl;

  delete clean.email;
  delete clean.password;
  delete clean.pin;
  delete clean.role;
  delete clean.account_type;
  delete clean.full_name;
  delete clean.console_handle;
  delete clean.phone;
  delete clean.active_workspace;
  delete clean.allowed_workspaces;
  delete clean.registered_workspaces;
  delete clean.photo_folders;
  delete clean.update_ticker;
  delete clean.rosterTicker;
  delete clean.profileBlurb;
  delete clean.shipping_address;
  delete clean.shipping_city;
  delete clean.shipping_state;
  delete clean.shipping_postal_code;
  delete clean.shipping_country;
  delete clean.label_shipping_address;
  delete clean.label_shipping_city;
  delete clean.label_shipping_state;
  delete clean.label_shipping_postal_code;
  delete clean.label_shipping_country;
  delete clean.label_security_pin;
  delete clean.label_custom_domain;
  delete clean.label_payout_email;
  delete clean.promoter_metadata;
  delete clean.creative_metadata;
  delete clean.label_metadata;
  delete clean.band_metadata;
  delete clean.user_metadata;
  delete clean.subscription_tier;
  delete clean.subscription_status;
  delete clean.is_subscribed;
  delete clean.auth_id;
  delete clean.targetBandId;
  delete clean.target_band_id;

  // 16. Enforce strict whitelist of valid 'bands' table columns ONLY
  for (const key of Object.keys(clean)) {
    if (!VALID_BAND_COLUMNS.has(key)) {
      delete clean[key];
    }
  }

  return clean;
}

/**
 * Robustly saves a band row to Supabase 'bands' table with multi-tier schema resilience,
 * automatic storage synchronization for base64 images, and local cache updates.
 */
export async function upsertBandToDatabase(
  bandInput: any,
  options?: { isNew?: boolean; triggerNotification?: (msg: string) => void }
): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!bandInput || typeof bandInput !== 'object') {
    return { success: false, error: new Error('Invalid band input') };
  }

  const supabase = getSupabase();
  const cleanBand = sanitizeBandPayload(bandInput);

  // Guarantee standards-compliant RFC4122 v4 UUID for database primary key
  if (!cleanBand.id && !bandInput.id) {
    cleanBand.id = generateUUID();
  } else {
    cleanBand.id = ensureUUID(cleanBand.id || bandInput.id);
  }

  // Sync to local storage immediately for zero-latency UI consistency
  try {
    const bandId = cleanBand.id;
    if (bandId) {
      // 1. Registered bands
      const regRaw = localStorage.getItem('nexus_registered_bands');
      let registered: any[] = regRaw ? JSON.parse(regRaw) : [];
      const regIdx = registered.findIndex((b: any) => b.id === bandId || ensureUUID(b.id) === bandId);
      if (regIdx >= 0) {
        registered[regIdx] = { ...registered[regIdx], ...cleanBand };
      } else {
        registered.push(cleanBand);
      }
      localStorage.setItem('nexus_registered_bands', JSON.stringify(registered));

      // 2. Active band
      const activeRaw = localStorage.getItem('nexus_active_band');
      if (activeRaw) {
        try {
          const activeParsed = JSON.parse(activeRaw);
          if (activeParsed.id === bandId || ensureUUID(activeParsed.id) === bandId) {
            localStorage.setItem('nexus_active_band', JSON.stringify({ ...activeParsed, ...cleanBand }));
          }
        } catch (_) {}
      }

      // 3. Community bands v2
      const commRaw = localStorage.getItem('nexus_community_bands_v2');
      if (commRaw) {
        try {
          let commList = JSON.parse(commRaw);
          if (Array.isArray(commList)) {
            const cIdx = commList.findIndex((b: any) => b.id === bandId || ensureUUID(b.id) === bandId);
            if (cIdx >= 0) {
              commList[cIdx] = { ...commList[cIdx], ...cleanBand };
              localStorage.setItem('nexus_community_bands_v2', JSON.stringify(commList));
            }
          }
        } catch (_) {}
      }
    }
  } catch (storageErr) {
    console.warn('[bandService] Local cache sync notice:', storageErr);
  }

  // Broadcast window events to all UI listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_active_band_updated', { detail: cleanBand }));
    window.dispatchEvent(new CustomEvent('nexus_community_bands_updated', { detail: cleanBand }));
    if (cleanBand.logo_url) {
      verifyAndResyncBandLogo(cleanBand.logo_url, cleanBand.id);
      window.dispatchEvent(new CustomEvent('nexus_band_logo_updated', {
        detail: { logo_url: cleanBand.logo_url, id: cleanBand.id }
      }));
    }
  }

  if (!supabase) {
    return { success: true, data: cleanBand };
  }

  try {
    const isExplicitNew = Boolean(options?.isNew);

    let existingRowId: string | null = null;

    // 1. Check by ID
    if (cleanBand.id) {
      const { data: byId } = await supabase.from('bands').select('id').eq('id', cleanBand.id).maybeSingle();
      if (byId?.id) {
        existingRowId = byId.id;
      }
    }

    // 2. Check by custom_slug if not found by ID
    if (!existingRowId && cleanBand.custom_slug) {
      const { data: bySlug } = await supabase.from('bands').select('id').eq('custom_slug', cleanBand.custom_slug).maybeSingle();
      if (bySlug?.id) {
        existingRowId = bySlug.id;
        cleanBand.id = bySlug.id;
      }
    }

    if (existingRowId && !isExplicitNew) {
      console.log(`[bandService] Record exists (${existingRowId}). Performing targeted UPDATE...`);
      const updateRes = await executeWithSchemaResilience(
        async (payload) => await supabase.from('bands').update(payload).eq('id', existingRowId),
        cleanBand
      );

      if (!updateRes?.error) {
        console.log(`[bandService] Successfully updated band record: ${cleanBand.id}`);
        return { success: true, data: updateRes.data || cleanBand };
      }

      console.warn('[bandService] Resilient update returned error, attempting direct update:', updateRes.error);
      const directUpdate = await supabase.from('bands').update(cleanBand).eq('id', existingRowId);
      if (!directUpdate.error) {
        return { success: true, data: cleanBand };
      }

      const errMsg = directUpdate.error.message || JSON.stringify(directUpdate.error);
      console.error(`[bandService] Database UPDATE failed for band ${cleanBand.id}:`, errMsg);
      options?.triggerNotification?.(`❌ Database band update failed: ${errMsg}`);
      return { success: false, data: cleanBand, error: errMsg };
    } else {
      console.log(`[bandService] Performing INSERT / UPSERT for band ${cleanBand.id} (Name: "${cleanBand.band_name}")...`);
      
      const insertRes = await executeWithSchemaResilience(
        async (payload) => await supabase.from('bands').insert([payload]),
        cleanBand
      );

      if (!insertRes?.error) {
        console.log(`[bandService] Successfully inserted band record: ${cleanBand.id}`);
        return { success: true, data: insertRes.data || cleanBand };
      }

      const directUpsert = await supabase.from('bands').upsert([cleanBand], { onConflict: 'custom_slug' });
      if (!directUpsert.error) {
        console.log(`[bandService] Direct upsert succeeded for ${cleanBand.id}`);
        return { success: true, data: cleanBand };
      }

      const fallbackUpsert = await supabase.from('bands').upsert([cleanBand], { onConflict: 'id' });
      if (!fallbackUpsert.error) {
        return { success: true, data: cleanBand };
      }

      const errMsg = directUpsert.error.message || insertRes.error?.message || JSON.stringify(insertRes.error);
      console.error(`[bandService] Database band save failed for ${cleanBand.id}:`, errMsg);
      options?.triggerNotification?.(`❌ Database band save failed: ${errMsg}`);
      return { success: false, data: cleanBand, error: errMsg };
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error('[bandService] Band database sync exception:', errMsg);
    options?.triggerNotification?.(`❌ Database sync exception: ${errMsg}`);
    return { success: false, data: cleanBand, error: errMsg };
  }
}

export const mapBandData = (rows: any[] | null) => {
  if (!rows) return [];
  return rows.map((b) => {
    const city = b.city || '';
    const state_province = b.state_province || b.state || '';
    const country = b.country || '';
    const compiledLocation =
      [city, state_province, country].filter(Boolean).join(', ') || b.homebase || b.location || 'Global Scene';

    const cleanMicroGenres = sanitizeMicroGenres(
      b.micro_genres || b.sub_genres || b.genre_tags || b.genres || b.genre
    );
    const validBandName = b.band_name || b.name || 'Unnamed Band';
    const validCreatorId = b.creator_id || b.user_id || b.owner_id || null;
    const validFeaturedYoutube = b.featured_youtube_url || b.youtube_url || '';
    const validMetalArchives = b.metal_archives_url || b.metal_archives || '';

    return {
      ...b,
      // Canonical name field and legacy in-memory alias
      band_name: validBandName,
      name: validBandName,
      // Canonical owner ID and legacy in-memory aliases
      creator_id: validCreatorId,
      user_id: validCreatorId,
      owner_id: validCreatorId,
      // Bio & Description
      bio: b.bio || b.description || '',
      description: b.description || b.bio || '',
      // Canonical media URLs and legacy aliases
      featured_youtube_url: validFeaturedYoutube,
      youtube_url: validFeaturedYoutube,
      metal_archives_url: validMetalArchives,
      metal_archives: validMetalArchives,
      // Location
      city,
      state_province,
      country,
      homebase: compiledLocation,
      location: compiledLocation,
      // Genres
      micro_genres: cleanMicroGenres,
      genre: cleanMicroGenres.length > 0 ? cleanMicroGenres.join(' • ') : 'Metal / Hardcore',
      genres: cleanMicroGenres,
      genre_tags: cleanMicroGenres,
    };
  });
};

export const fetchUserBands = async (userId: string) => {
  if (!userId) return [];
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .or(`creator_id.eq.${userId},owner_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notice fetching bands:', error.message);
      return [];
    }

    // Restrict active band workspace strictly to Virulent Excision
    const validUserBands = (data || []).filter((b: any) => {
      const bId = String(b.id || '').trim();
      const bName = String(b.name || b.band_name || '').trim().toLowerCase();
      return bId === 'cbddb810-259b-4230-9968-3d402dfdb872' || bName.includes('virulent excision');
    });

    const mapped = mapBandData(validUserBands);
    if (mapped.length === 0) {
      mapped.push({
        id: 'cbddb810-259b-4230-9968-3d402dfdb872',
        name: 'Virulent Excision',
        band_name: 'Virulent Excision',
        genre: 'Brutal Death Metal',
        logo_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396',
        cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-cover_1787467851123.jpg?t=1787467851123',
        owner_id: userId
      });
    }

    return mapped;
  } catch (err: any) {
    console.warn('Notice fetching bands exception:', err?.message || err);
    return [];
  }
};

/**
 * Verification step after setBandLogoUrl that cross-references the Supabase storage URL
 * with the local cache and forces a re-sync if they mismatch.
 */
export function verifyAndResyncBandLogo(url: string, bandId?: string) {
  if (!url || typeof window === 'undefined') return;
  try {
    const isStorageUrl = url.includes('supabase.co/storage') || url.startsWith('http') || url.startsWith('data:');
    if (!isStorageUrl) return;

    // 1. Check nexus_active_band
    const activeRaw = localStorage.getItem('nexus_active_band');
    let activeBandObj: any = null;
    if (activeRaw) {
      try {
        activeBandObj = JSON.parse(activeRaw);
        const targetMatch = !bandId || activeBandObj.id === bandId || ensureUUID(activeBandObj.id) === ensureUUID(bandId) || activeBandObj.custom_slug === bandId;
        if (targetMatch && activeBandObj.logo_url !== url) {
          console.log('[verifyAndResyncBandLogo] Mismatch detected in nexus_active_band. Forcing re-sync...', { cached: activeBandObj.logo_url, newUrl: url });
          activeBandObj.logo_url = url;
          activeBandObj.avatar_url = url;
          activeBandObj.avatar = url;
          localStorage.setItem('nexus_active_band', JSON.stringify(activeBandObj));
          window.dispatchEvent(new CustomEvent('nexus_active_band_updated', { detail: activeBandObj }));
        }
      } catch (_) {}
    }

    const activeId = activeBandObj?.id;
    const activeSlug = activeBandObj?.custom_slug;
    const activeName = activeBandObj?.name?.toLowerCase();

    // 2. Check nexus_registered_bands
    const regRaw = localStorage.getItem('nexus_registered_bands');
    if (regRaw) {
      let registered = JSON.parse(regRaw);
      if (Array.isArray(registered)) {
        let changed = false;
        registered = registered.map((b: any) => {
          const matches = (bandId && (b.id === bandId || ensureUUID(b.id) === ensureUUID(bandId))) ||
                          (activeId && (b.id === activeId || ensureUUID(b.id) === ensureUUID(activeId))) ||
                          (activeSlug && b.custom_slug === activeSlug) ||
                          (activeName && b.name?.toLowerCase() === activeName) ||
                          b.name?.toLowerCase() === 'brodequin' || b.name?.toLowerCase() === 'suffocation';
          if (matches && b.logo_url !== url) {
            changed = true;
            return { ...b, logo_url: url, avatar_url: url, avatar: url };
          }
          return b;
        });
        if (changed) {
          localStorage.setItem('nexus_registered_bands', JSON.stringify(registered));
        }
      }
    }

    // 3. Check nexus_community_bands_v2
    const commRaw = localStorage.getItem('nexus_community_bands_v2');
    if (commRaw) {
      let commList = JSON.parse(commRaw);
      if (Array.isArray(commList)) {
        let changed = false;
        commList = commList.map((b: any) => {
          const matches = (bandId && (b.id === bandId || ensureUUID(b.id) === ensureUUID(bandId))) ||
                          (activeId && (b.id === activeId || ensureUUID(b.id) === ensureUUID(activeId))) ||
                          (activeSlug && b.custom_slug === activeSlug) ||
                          (activeName && (b.name?.toLowerCase() === activeName || b.band_name?.toLowerCase() === activeName)) ||
                          b.name?.toLowerCase() === 'brodequin' || b.name?.toLowerCase() === 'suffocation';
          if (matches && b.logo_url !== url) {
            changed = true;
            return { ...b, logo_url: url, avatar_url: url, avatar: url };
          }
          return b;
        });
        if (changed) {
          localStorage.setItem('nexus_community_bands_v2', JSON.stringify(commList));
          window.dispatchEvent(new CustomEvent('nexus_community_bands_updated', { detail: commList }));
        }
      }
    }

    // 4. Check nexus_bands_list
    const listRaw = localStorage.getItem('nexus_bands_list');
    if (listRaw) {
      let list = JSON.parse(listRaw);
      if (Array.isArray(list)) {
        let changed = false;
        list = list.map((b: any) => {
          const matches = (bandId && (b.id === bandId || ensureUUID(b.id) === ensureUUID(bandId))) ||
                          (activeId && (b.id === activeId || ensureUUID(b.id) === ensureUUID(activeId))) ||
                          (activeSlug && b.custom_slug === activeSlug) ||
                          (activeName && (b.name?.toLowerCase() === activeName || b.band_name?.toLowerCase() === activeName)) ||
                          b.name?.toLowerCase() === 'brodequin' || b.name?.toLowerCase() === 'suffocation';
          if (matches && b.logo_url !== url) {
            changed = true;
            return { ...b, logo_url: url, avatar_url: url, avatar: url };
          }
          return b;
        });
        if (changed) {
          localStorage.setItem('nexus_bands_list', JSON.stringify(list));
        }
      }
    }
  } catch (err) {
    console.warn('[verifyAndResyncBandLogo] Error during verification & re-sync:', err);
  }
}
