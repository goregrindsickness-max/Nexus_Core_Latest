import { getSupabase } from './clientService';
import { INITIAL_COMMUNITY_BANDS } from '../lib/seedBandsData';
import { isDeletedOrZombieBand } from '../lib/communityBands';

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

// In-memory cache
let cachedBands: BandProfileOption[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds

export async function getAllRealBandProfiles(extraBands: any[] = []): Promise<BandProfileOption[]> {
  const now = Date.now();
  if (cachedBands.length > 0 && now - lastFetchTime < CACHE_TTL_MS && extraBands.length === 0) {
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
      : b.micro_genres || b.genre || (Array.isArray(b.subgenres) ? b.subgenres.slice(0, 2).join(' / ') : b.sub_genres) || 'Metal / Hardcore';

    const city = b.city || b.homebase_city || '';
    const state = b.state_province || b.state || '';
    const locParts = [city, state, b.country].filter(Boolean);
    const location = locParts.length > 0 ? locParts.join(', ') : (b.location || '');

    const avatar = b.logo_url || b.cover_url || b.avatar_url || b.avatar || b.image || '';
    const banner = b.banner_url || b.cover_url || '';
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
      displayText: `${name}${location ? ` • ${location}` : ''}${genre ? ` (${genre})` : ''}`
    };

    // If already exists, prefer database source with avatar
    if (bandMap.has(lowerName)) {
      const existing = bandMap.get(lowerName)!;
      if (!existing.avatar && avatar) {
        bandMap.set(lowerName, { ...existing, avatar });
      }
    } else {
      bandMap.set(lowerName, opt);
    }
  };

  // 1. Load from INITIAL_COMMUNITY_BANDS
  if (Array.isArray(INITIAL_COMMUNITY_BANDS)) {
    INITIAL_COMMUNITY_BANDS.forEach((b) => addBandToMap(b, 'community'));
  }

  // 2. Load from localStorage nexus_bands_list
  try {
    const local = localStorage.getItem('nexus_bands_list');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach((b) => addBandToMap(b, 'database'));
      }
    }
  } catch (_) {}

  // 3. Load extraBands passed from props/context
  if (Array.isArray(extraBands)) {
    extraBands.forEach((b) => addBandToMap(b, 'profile'));
  }

  // 4. Query live Supabase database
  try {
    const client = getSupabase();
    if (client) {
      const { data: dbBands, error: bErr } = await client
        .from('bands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (dbBands && !bErr && Array.isArray(dbBands)) {
        dbBands.forEach((b) => addBandToMap(b, 'database'));
      }

      // Query profiles with account_type = 'band'
      const { data: pBands, error: pErr } = await client
        .from('profiles')
        .select('*')
        .eq('account_type', 'band')
        .limit(50);

      if (pBands && !pErr && Array.isArray(pBands)) {
        pBands.forEach((p) => {
          const bName = p.bandName || p.full_name || p.display_name || p.name;
          if (bName) {
            addBandToMap(
              {
                ...p,
                band_name: bName,
                avatar_url: p.avatar_url || p.avatar
              },
              'profile'
            );
          }
        });
      }
    }
  } catch (err) {
    console.warn('[bandProfileSearchService] Supabase query notice:', err);
  }

  const results = Array.from(bandMap.values());
  cachedBands = results;
  lastFetchTime = now;

  return results;
}

export async function searchBandProfiles(
  query: string,
  extraBands: any[] = []
): Promise<BandProfileOption[]> {
  const allBands = await getAllRealBandProfiles(extraBands);

  if (!query || query.trim().length === 0) {
    // Return top 8 prominent bands
    return allBands.slice(0, 8);
  }

  const cleanQ = query.toLowerCase().trim();

  return allBands
    .filter((b) => {
      const nameMatch = b.name.toLowerCase().includes(cleanQ);
      const slugMatch = b.slug && b.slug.toLowerCase().includes(cleanQ);
      const genreMatch = b.genre && b.genre.toLowerCase().includes(cleanQ);
      const locMatch = b.location && b.location.toLowerCase().includes(cleanQ);
      return nameMatch || slugMatch || genreMatch || locMatch;
    })
    .slice(0, 10);
}
