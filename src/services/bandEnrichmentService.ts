import { INITIAL_COMMUNITY_BANDS } from '../lib/communityBands';
import { authFetch, getSupabaseAccessToken } from '../utils/apiConfig';

export interface BandEnrichedMetadata {
  founded_year?: string;
  status?: string;
  is_split_up?: boolean;
  record_label?: string;
  label?: string;
  city?: string;
  state_province?: string;
  state?: string;
  country?: string;
  genre?: string;
  micro_genres?: string[];
  subgenres?: string[];
  bio?: string;
  lineup?: any[];
  discography?: any[];
  spotify_url?: string;
  metal_archives_url?: string;
  youtube_url?: string;
}

/**
 * Static band knowledge dictionary removed from client bundle (moved to server/seeds/seedCatalogsData.ts)
 */
const KNOWN_PUBLIC_BANDS: Record<string, BandEnrichedMetadata> = {};

/**
 * Parse a location string into city, state, country
 * Examples: "Denver, CO", "Warsaw, Poland", "Boston, Massachusetts, USA"
 */
export function parseLocationString(rawLocation?: string): { city?: string; state_province?: string; country?: string } {
  if (!rawLocation || typeof rawLocation !== 'string' || !rawLocation.trim()) {
    return {};
  }

  const clean = rawLocation.trim().replace(/^[\s,]+|[\s,]+$/g, '');
  const parts = clean.split(',').map((s) => s.trim()).filter(Boolean);

  if (parts.length === 1) {
    return { city: parts[0] };
  }

  if (parts.length === 2) {
    const p1 = parts[0];
    const p2 = parts[1];
    if (/^[A-Z]{2}$/i.test(p2)) {
      return { city: p1, state_province: p2.toUpperCase(), country: 'USA' };
    }
    if (/^(usa|us|united states)$/i.test(p2)) {
      return { city: p1, country: 'USA' };
    }
    return { city: p1, country: p2 };
  }

  if (parts.length >= 3) {
    return {
      city: parts[0],
      state_province: parts[1],
      country: parts[2],
    };
  }

  return {};
}

/**
 * Multi-tiered resolver that pre-fills band metadata from active profile context
 */
export function resolvePublicBandData(bandName: string, activeProfileData?: any): BandEnrichedMetadata {
  if (!bandName || typeof bandName !== 'string') return {};

  const cleanName = bandName.trim().toLowerCase();
  const alphaName = cleanName.replace(/[^a-z0-9]/g, '');

  let mergedResult: BandEnrichedMetadata = {};

  const seedMatch = INITIAL_COMMUNITY_BANDS.find((b) => {
    if (!b) return false;
    const bName = (b.name || b.band_name || '').toLowerCase().trim();
    return bName === cleanName || bName.replace(/[^a-z0-9]/g, '') === alphaName;
  });

  if (seedMatch) {
    mergedResult = {
      founded_year: seedMatch.founded_year,
      status: seedMatch.status,
      is_split_up: seedMatch.is_split_up || seedMatch.isSplitUp,
      record_label: seedMatch.record_label || seedMatch.label || seedMatch.label_name,
      label: seedMatch.record_label || seedMatch.label,
      city: seedMatch.city,
      state_province: seedMatch.state_province || seedMatch.state,
      country: seedMatch.country || 'USA',
      genre: seedMatch.genre,
      micro_genres: seedMatch.micro_genres || seedMatch.subgenres,
      bio: seedMatch.bio,
      lineup: seedMatch.lineup,
      discography: seedMatch.discography,
      spotify_url: seedMatch.spotify_url,
      metal_archives_url: seedMatch.metal_archives_url,
      youtube_url: seedMatch.youtube_url,
    };
  }

  const dictMatch = KNOWN_PUBLIC_BANDS[cleanName] || KNOWN_PUBLIC_BANDS[alphaName];
  if (dictMatch) {
    mergedResult = {
      ...dictMatch,
      ...mergedResult,
    };
  }

  if (activeProfileData && typeof activeProfileData === 'object') {
    const locParsed = parseLocationString(
      activeProfileData.location || activeProfileData.homebase || activeProfileData.city
    );

    const profLabel =
      activeProfileData.record_label ||
      activeProfileData.label_name ||
      activeProfileData.labelName ||
      activeProfileData.label;
    const profYear =
      activeProfileData.founded_year ||
      activeProfileData.year_formed ||
      activeProfileData.yearFormed ||
      activeProfileData.year;

    mergedResult = {
      ...mergedResult,
      city: mergedResult.city || activeProfileData.city || locParsed.city,
      state_province:
        mergedResult.state_province ||
        activeProfileData.state_province ||
        activeProfileData.state ||
        locParsed.state_province,
      country: mergedResult.country || activeProfileData.country || locParsed.country || 'USA',
      record_label: mergedResult.record_label || profLabel,
      label: mergedResult.label || profLabel,
      founded_year: mergedResult.founded_year || (profYear ? String(profYear) : undefined),
      genre: mergedResult.genre || activeProfileData.genre,
      micro_genres:
        mergedResult.micro_genres ||
        activeProfileData.micro_genres ||
        activeProfileData.genre_tags,
    };
  }

  return mergedResult;
}

/**
 * Asynchronously enriches band metadata by querying the server-side AI/Open Music DB API
 */
export async function enrichBandMetadataAsync(bandName: string): Promise<BandEnrichedMetadata> {
  if (!bandName || typeof bandName !== 'string' || !bandName.trim()) {
    return {};
  }

  try {
    const token = await getSupabaseAccessToken();
    if (!token) {
      return resolvePublicBandData(bandName);
    }
    const response = await authFetch('/api/enrich-band', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bandName: bandName.trim() }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        return data as BandEnrichedMetadata;
      }
    }
  } catch (err) {
    console.warn('[enrichBandMetadataAsync] Notice:', err);
  }

  return resolvePublicBandData(bandName);
}
