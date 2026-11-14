import { getSupabase } from './clientService';
import { isDeletedOrZombieBand, pickBestBandImage, isValidBandImageUrl } from '../lib/communityBands';
import { createMonogramPlaceholderSvg } from '../utils/imageFallbacks';

export interface BandProfileOption {
  id: string;
  name: string;
  slug?: string;
  genre?: string;
  city?: string;
  state?: string;
  location?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  isVerified?: boolean;
  followersCount?: number;
  source: 'database' | 'profile' | 'community';
  displayText: string;
}

export const BAND_SEARCH_SELECT_COLUMNS =
  'id, name, band_name, category, avatar_url, logo_url, cover_url, banner_url, city, state, state_province, country, micro_genres, custom_slug, verification_status, is_verified, followers_count, bio';

const PROFILE_BAND_SELECT_COLUMNS =
  'id, full_name, band_name, account_type, avatar_url, band_logo, city, state, country, bio';

// Purge legacy bulk band catalog key from localStorage
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    localStorage.removeItem('nexus_bands_list');
  } catch (_) {}
}

let cachedBands: BandProfileOption[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000;

export async function getAllRealBandProfiles(
  extraBands: any[] = [],
  options: { query?: string; page?: number; pageSize?: number } = {}
): Promise<BandProfileOption[]> {
  const { query = '', page = 0, pageSize = 20 } = options;
  const cleanQuery = query.trim().replace(/[%_]/g, '');
  const from = Math.max(0, page * pageSize);
  const to = from + pageSize - 1;
  const now = Date.now();

  if (
    !cleanQuery &&
    page === 0 &&
    cachedBands.length > 0 &&
    now - lastFetchTime < CACHE_TTL_MS &&
    extraBands.length === 0
  ) {
    return cachedBands;
  }

  const bandMap = new Map<string, BandProfileOption>();

  const addBandToMap = (b: any, source: 'database' | 'profile' | 'community') => {
    if (!b) return;
    const name = (b.band_name || b.name || b.bandName || '').trim();
    if (!name || name.length < 2) return;

    const lowerName = name.toLowerCase();
    const id = String(b.id || b.raw_id || b.band_id || `band_${name.replace(/\s+/g, '_')}`);

    if (isDeletedOrZombieBand(id) || isDeletedOrZombieBand(name) || isDeletedOrZombieBand(b.custom_slug)) {
      return;
    }

    const genre = Array.isArray(b.micro_genres)
      ? b.micro_genres.slice(0, 2).join(' / ')
      : b.micro_genres ||
        b.genre ||
        (Array.isArray(b.subgenres) ? b.subgenres.slice(0, 2).join(' / ') : b.sub_genres) ||
        'Metal / Hardcore';

    const city = b.city || b.homebase_city || '';
    const state = b.state_province || b.state || '';
    const locParts = [city, state, b.country].filter(Boolean);
    const location = locParts.length > 0 ? locParts.join(', ') : b.location || '';

    const discCover =
      b.discography?.[0]?.cover_url ||
      b.discography?.[0]?.cover_image ||
      b.discography?.[0]?.image_url;

    let avatar = pickBestBandImage(
      b.logo_url,
      b.avatar_url,
      b.avatar,
      b.logo,
      b.profile_image,
      b.image,
      discCover
    );
    if (!avatar && (b.cover_url || b.banner_url)) {
      avatar = pickBestBandImage(b.cover_url, b.banner_url) || '';
    }
    if (!avatar) {
      avatar = createMonogramPlaceholderSvg(name, 'band');
    }

    const banner = pickBestBandImage(b.banner_url, b.cover_url) || b.banner_url || b.cover_url || '';
    const isVerified = b.is_verified === true || b.verification_status === 'verified_official';
    const followersCount = b.followers_count || 150;

    const opt: BandProfileOption = {
      id,
      name,
      slug: b.custom_slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      genre,
      city,
      state,
      location,
      avatar,
      banner,
      bio: b.bio || b.description || '',
      isVerified,
      followersCount,
      source,
      displayText: `${name}${location ? ` • ${location}` : ''}${genre ? ` (${genre})` : ''}`,
    };

    if (bandMap.has(lowerName)) {
      const existing = bandMap.get(lowerName)!;
      if (source === 'database') {
        bandMap.set(lowerName, {
          ...existing,
          ...opt,
          avatar: pickBestBandImage(avatar, existing.avatar) || avatar || existing.avatar,
          source: 'database',
        });
      } else if ((!existing.avatar || !isValidBandImageUrl(existing.avatar)) && avatar) {
        bandMap.set(lowerName, { ...existing, avatar });
      }
    } else {
      bandMap.set(lowerName, opt);
    }
  };

  // 1. Live Supabase database 'bands' table with explicit column selection, .order(), .range()
  try {
    const client = getSupabase();
    if (client) {
      let qb = client
        .from('bands')
        .select(BAND_SEARCH_SELECT_COLUMNS)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (cleanQuery.length > 0) {
        qb = qb.or(
          `band_name.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%,city.ilike.%${cleanQuery}%,state_province.ilike.%${cleanQuery}%`
        );
      }

      const { data: dbBands, error: bErr } = await qb;
      if (dbBands && !bErr && Array.isArray(dbBands)) {
        dbBands.forEach((b) => addBandToMap(b, 'database'));
      }
    }
  } catch (err) {
    console.warn('[bandProfileSearchService] Supabase bands query notice:', err);
  }

  // 2. Load extraBands passed from props/context
  if (Array.isArray(extraBands)) {
    extraBands.forEach((b) => addBandToMap(b, 'profile'));
  }

  // 3. Query dedicated band accounts from profiles table with explicit columns + .range()
  try {
    const client = getSupabase();
    if (client) {
      let pQb = client
        .from('profiles')
        .select(PROFILE_BAND_SELECT_COLUMNS)
        .eq('account_type', 'band')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (cleanQuery.length > 0) {
        pQb = pQb.or(`band_name.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%,city.ilike.%${cleanQuery}%`);
      }

      const { data: pBands, error: pErr } = await pQb;
      if (pBands && !pErr && Array.isArray(pBands)) {
        pBands.forEach((p: any) => {
          const bName = p.band_name || p.bandName;
          if (bName && !bandMap.has(bName.toLowerCase())) {
            addBandToMap(
              {
                ...p,
                band_name: bName,
                avatar_url: p.band_logo || p.avatar_url || p.avatar || p.logo_url,
              },
              'profile'
            );
          }
        });
      }
    }
  } catch (err) {
    console.warn('[bandProfileSearchService] Supabase profile query notice:', err);
  }

  const results = Array.from(bandMap.values()).sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true })
  );

  if (!cleanQuery && page === 0) {
    cachedBands = results;
    lastFetchTime = now;
  }

  return results;
}

export async function searchBandProfiles(
  query: string,
  extraBands: any[] = [],
  page = 0,
  pageSize = 20
): Promise<BandProfileOption[]> {
  const cleanQ = (query || '').trim();
  const matchingBands = await getAllRealBandProfiles(extraBands, {
    query: cleanQ,
    page,
    pageSize,
  });

  if (!cleanQ) {
    return matchingBands.slice(0, 8);
  }

  const lowerQ = cleanQ.toLowerCase();
  return matchingBands
    .filter((b) => {
      const nameMatch = b.name.toLowerCase().includes(lowerQ);
      const slugMatch = b.slug && b.slug.toLowerCase().includes(lowerQ);
      const genreMatch = b.genre && b.genre.toLowerCase().includes(lowerQ);
      const locMatch = b.location && b.location.toLowerCase().includes(lowerQ);
      return nameMatch || slugMatch || genreMatch || locMatch;
    })
    .slice(0, pageSize);
}
