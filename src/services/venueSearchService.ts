import { getSupabase } from './clientService';
import { venuesStore } from '../utils/indexedDB';
import { authFetch, getApiFallbackEndpoints, getSupabaseAccessToken } from '../utils/apiConfig';

export interface VenueResult {
  id: string;
  name: string;
  category?: string;
  avatar_url?: string | null;
  city?: string;
  state?: string;
  country?: string;
  streetAddress?: string;
  fullAddress?: string;
  capacity?: number | string;
  payoutRating?: number;
  loadInRating?: number;
  genreFit?: number;
  source: 'blackbook' | 'google-places';
  displayText: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  parkingNotes?: string;
  notes?: string;
  stageSpecs?: string;
  tags?: string[];
}

export interface VenueQueryOptions {
  query?: string;
  page?: number;
  pageSize?: number;
}

// Static venue catalog removed from client bundle (moved to server/seeds/seedVenuesData.ts)
export const BUILT_IN_BLACK_BOOK_VENUES: VenueResult[] = [];

export const VENUE_CARD_COLUMNS =
  'id, name, category, avatar_url, city, state, state_province, country, street_address, address, capacity, payout_rating, load_in_rating, genre_fit, email, phone, buyers, website';

// Purge legacy large venue catalogs from localStorage on module initialization
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    localStorage.removeItem('nexus_core_venues');
    localStorage.removeItem('nexus_musicbrainz_venues');
  } catch (_) {}
}

export const GOOGLE_MAPS_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
  'AIzaSyDI0NWyHExs2pWEc9UIoe3y-luHdhqcbGg';

let isScriptLoading = false;
let isScriptLoaded = false;

export const initGooglePlacesScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google?.maps) {
    isScriptLoaded = true;
    return Promise.resolve(true);
  }
  if (isScriptLoaded) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existingScript = document.getElementById('google-maps-places-sdk');
    if (existingScript) {
      if ((window as any).google?.maps) {
        isScriptLoaded = true;
        resolve(true);
      } else {
        existingScript.addEventListener('load', () => {
          isScriptLoaded = true;
          resolve(true);
        });
        existingScript.addEventListener('error', () => resolve(false));
      }
      return;
    }

    if (isScriptLoading) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkInterval);
          isScriptLoaded = true;
          resolve(true);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
      return;
    }

    isScriptLoading = true;
    const script = document.createElement('script');
    script.id = 'google-maps-places-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isScriptLoading = false;
      isScriptLoaded = true;
      resolve(true);
    };
    script.onerror = () => {
      isScriptLoading = false;
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

function mapRawVenueToResult(v: any, idPrefix = 'srv'): VenueResult {
  const nameSlug = (v.name || 'venue').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const citySlug = (v.city || 'city').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const vId =
    v.id && typeof v.id === 'string' && v.id.trim().length > 0 && v.id !== 'undefined' && v.id !== 'null'
      ? v.id
      : `${idPrefix}_${nameSlug}_${citySlug}`;
  const stateVal = v.state_province || v.state || '';
  const streetVal = v.street_address || v.address || '';
  return {
    id: vId,
    name: v.name,
    category: v.category || 'venue',
    avatar_url: v.avatar_url || v.logo_url || null,
    city: v.city,
    state: stateVal,
    country: v.country || 'USA',
    streetAddress: streetVal,
    fullAddress: v.fullAddress || [streetVal, v.city, stateVal].filter(Boolean).join(', '),
    capacity: v.capacity,
    payoutRating: v.payout_rating || v.payoutRating || 4.5,
    loadInRating: v.load_in_rating || v.loadInRating || 4.0,
    genreFit: v.genre_fit || v.genreFit || 90,
    contactName: v.contactName || v.buyers || undefined,
    contactEmail: v.contactEmail || v.email || undefined,
    contactPhone: v.contactPhone || v.phone || undefined,
    website: v.website || undefined,
    parkingNotes: v.parkingNotes || v.loadIn || undefined,
    notes: v.notes || undefined,
    tags: Array.isArray(v.tags) ? v.tags : undefined,
    source: 'blackbook',
    displayText:
      v.displayText ||
      `${v.name}${v.city ? ` • ${v.city}${stateVal ? `, ${stateVal}` : ''}` : ''}${v.capacity ? ` (Cap: ${v.capacity})` : ''}`,
  };
}

/**
 * Paginated & filtered venue query against Supabase `venues` table and server `/api/venues`.
 */
export async function getAllBlackBookVenues(options: VenueQueryOptions = {}): Promise<VenueResult[]> {
  const { query = '', page = 0, pageSize = 20 } = options;
  const from = Math.max(0, page * pageSize);
  const to = from + pageSize - 1;
  const cleanQuery = query.trim();

  const aggregated: VenueResult[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  const addVenue = (v: any, prefix = 'srv') => {
    if (!v?.name) return;
    const key = `${v.name.toLowerCase().trim()}_${(v.city || '').toLowerCase().trim()}`;
    if (seenNames.has(key)) return;
    const mapped = mapRawVenueToResult(v, prefix);
    if (seenIds.has(mapped.id.toLowerCase())) return;
    seenNames.add(key);
    seenIds.add(mapped.id.toLowerCase());
    aggregated.push(mapped);
  };

  // 1. Primary: Query Supabase `venues` table with explicit columns, .order(), .range(from, to), and .ilike()
  try {
    const client = getSupabase();
    if (client) {
      let qb = client
        .from('venues')
        .select(VENUE_CARD_COLUMNS)
        .order('name', { ascending: true })
        .range(from, to);

      if (cleanQuery.length > 0) {
        const sanitized = cleanQuery.replace(/[%_]/g, '');
        qb = qb.or(`name.ilike.%${sanitized}%,city.ilike.%${sanitized}%,state.ilike.%${sanitized}%`);
      }

      const { data: sbVenues, error: sbErr } = await qb;
      if (!sbErr && Array.isArray(sbVenues)) {
        sbVenues.forEach((v) => addVenue(v, 'sb'));
      }
    }
  } catch (_) {}

  // 2. Query server API endpoint `/api/venues` with pagination & search params
  try {
    const qs = new URLSearchParams();
    if (cleanQuery) qs.set('q', cleanQuery);
    qs.set('page', String(page));
    qs.set('limit', String(pageSize));
    const endpoints = getApiFallbackEndpoints(`/api/venues?${qs.toString()}`);

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(ep, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.venues) && data.venues.length > 0) {
            data.venues.forEach((v: any) => addVenue(v, 'srv'));
            break;
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  // 3. Fallback: Check IndexedDB venuesStore if offline
  if (aggregated.length === 0) {
    try {
      const stored = await venuesStore.getItem<any>('nexus_master_venues');
      const dbVenues: any[] = stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : [];
      if (Array.isArray(dbVenues)) {
        const filtered = cleanQuery
          ? dbVenues.filter((v) => {
              const hay = `${v?.name || ''} ${v?.city || ''} ${v?.state || ''}`.toLowerCase();
              return hay.includes(cleanQuery.toLowerCase());
            })
          : dbVenues;
        filtered.slice(from, to + 1).forEach((v) => addVenue(v, 'db'));
      }
    } catch (_) {}
  }

  return aggregated;
}

// Search Black Book venues using paginated & filtered query
export async function searchBlackBookVenues(query: string, page = 0, pageSize = 20): Promise<VenueResult[]> {
  if (!query || query.trim().length === 0) return [];
  const results = await getAllBlackBookVenues({ query: query.trim(), page, pageSize });
  return results.slice(0, pageSize);
}

// Search Places API (New) via REST
export async function searchPlacesApiNew(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length < 2 || !GOOGLE_MAPS_API_KEY) return [];

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY
      },
      body: JSON.stringify({
        input: query.trim()
      })
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const suggestions = data?.suggestions || [];

    return suggestions.map((s: any) => {
      const pred = s.placePrediction;
      const mainText = pred?.structuredFormat?.mainText?.text || pred?.text?.text || query;
      const secondaryText = pred?.structuredFormat?.secondaryText?.text || '';
      const fullText = pred?.text?.text || (secondaryText ? `${mainText}, ${secondaryText}` : mainText);
      const placeId = pred?.placeId || pred?.place || '';

      return {
        id: `gp_${placeId || Math.random().toString(36).substring(2, 9)}`,
        name: mainText,
        fullAddress: fullText,
        placeId,
        source: 'google-places' as const,
        displayText: secondaryText ? `${mainText} • ${secondaryText}` : mainText
      };
    });
  } catch {
    return [];
  }
}

// Search Places API (New) via modern JS SDK (importLibrary)
export async function searchPlacesJsSdk(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const google = (window as any).google;
    if (!google?.maps?.importLibrary) return [];

    const placesLib: any = await google.maps.importLibrary('places');
    if (placesLib?.AutocompleteSuggestion) {
      const resp = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query.trim()
      });
      const suggestions = resp?.suggestions || [];

      return suggestions.map((s: any, idx: number) => {
        const pred = s.placePrediction;
        const mainText = pred?.mainText?.toString() || pred?.text?.toString() || query;
        const secondaryText = pred?.secondaryText?.toString() || '';
        const fullText = pred?.text?.toString() || (secondaryText ? `${mainText}, ${secondaryText}` : mainText);
        const placeId = pred?.placeId || `gp_${idx}`;

        return {
          id: `gp_${placeId}`,
          name: mainText,
          fullAddress: fullText,
          placeId,
          source: 'google-places' as const,
          displayText: secondaryText ? `${mainText} • ${secondaryText}` : mainText
        };
      });
    }
  } catch {
    // fallback
  }

  return [];
}

// OpenStreetMap / Photon live geocoding fallback for venues & establishments
export async function searchPhotonVenues(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=5`);
    if (!res.ok) return [];

    const data = await res.json();
    const features = data?.features || [];

    return features.map((f: any, idx: number) => {
      const p = f.properties || {};
      const name = p.name || query;
      const city = p.city || p.county || p.state || '';
      const state = p.state || p.country || '';
      const street = p.street ? `${p.housenumber ? p.housenumber + ' ' : ''}${p.street}` : '';
      const full = [street, city, state, p.country].filter(Boolean).join(', ');

      return {
        id: `osm_${p.osm_id || idx}`,
        name,
        city,
        state,
        country: p.country,
        streetAddress: street,
        fullAddress: full || name,
        source: 'google-places' as const,
        displayText: city || state ? `${name} • ${[city, state].filter(Boolean).join(', ')}` : name
      };
    });
  } catch {
    return [];
  }
}

// Unified Venue Search (Black Book directory first, complemented by Places API New + fallback)
export async function searchVenues(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length === 0) return [];
  const cleanQ = query.trim();

  // 1. Search Black Book
  const blackBookResults = await searchBlackBookVenues(cleanQ);

  // 2. Search Places API (New) if query is 2+ chars
  let externalPlacesResults: VenueResult[] = [];
  if (cleanQ.length >= 2) {
    externalPlacesResults = await searchPlacesApiNew(cleanQ);

    if (externalPlacesResults.length === 0) {
      externalPlacesResults = await searchPlacesJsSdk(cleanQ);
    }

    if (externalPlacesResults.length === 0) {
      externalPlacesResults = await searchPhotonVenues(cleanQ);
    }
  }

  const seenKeys = new Set<string>();
  const combined: VenueResult[] = [];

  blackBookResults.forEach((v) => {
    const key = v.name.toLowerCase().trim();
    seenKeys.add(key);
    combined.push(v);
  });

  externalPlacesResults.forEach((v) => {
    const key = v.name.toLowerCase().trim();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      combined.push(v);
    }
  });

  return combined;
}

/**
 * Check if a venue is already registered in the Black Book directory
 */
export async function isVenueInBlackBook(venueName: string, city?: string): Promise<boolean> {
  if (!venueName || !venueName.trim()) return false;
  const match = await findBlackBookVenue(venueName, city);
  return !!match;
}

/**
 * Locate a Black Book venue by name and optional city match
 */
export async function findBlackBookVenue(venueName: string, city?: string): Promise<VenueResult | null> {
  if (!venueName || !venueName.trim()) return null;
  const cleanName = venueName.trim().toLowerCase();
  const cleanCity = city?.trim().toLowerCase();
  const matches = await getAllBlackBookVenues({ query: venueName.trim(), page: 0, pageSize: 20 });

  const found = matches.find((v) => {
    const nameMatch =
      v.name.toLowerCase() === cleanName ||
      v.name.toLowerCase().includes(cleanName) ||
      cleanName.includes(v.name.toLowerCase());
    if (!nameMatch) return false;
    if (cleanCity && v.city) {
      return (
        v.city.toLowerCase() === cleanCity ||
        v.city.toLowerCase().includes(cleanCity) ||
        cleanCity.includes(v.city.toLowerCase())
      );
    }
    return true;
  });

  return found || null;
}

/**
 * Save a new venue into the Black Book directory via Supabase & server API without storing full catalogs in localStorage.
 */
export function saveVenueToBlackBook(venueData: {
  name: string;
  city: string;
  state?: string;
  country?: string;
  address?: string;
  streetAddress?: string;
  capacity?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  parkingNotes?: string;
}): VenueResult {
  const venueId = `v_bb_${Date.now()}`;
  const fullAddress = [venueData.address || venueData.streetAddress, venueData.city, venueData.state].filter(Boolean).join(', ');

  const newVenueRecord: any = {
    id: venueId,
    name: venueData.name.trim(),
    city: venueData.city.trim(),
    state: venueData.state?.trim() || 'USA',
    state_province: venueData.state?.trim() || 'USA',
    country: venueData.country || 'USA',
    place_type: 'venue',
    address: venueData.address || venueData.streetAddress || fullAddress,
    street_address: venueData.streetAddress || venueData.address || '',
    website: venueData.website?.trim() || '',
    capacity: venueData.capacity || 500,
    email: venueData.contactEmail || '',
    buyers: venueData.contactName || 'Production / Booking Dept.',
    phone: venueData.contactPhone || '',
    genre_fit: 90,
    genreFit: 90,
    payout_rating: 4.8,
    payoutRating: 4.8,
    load_in_rating: 4.5,
    loadInRating: 4.5,
    intel_entries: venueData.parkingNotes ? [venueData.parkingNotes] : ['Imported from Tour Manager show routing.'],
    intelEntries: venueData.parkingNotes ? [venueData.parkingNotes] : ['Imported from Tour Manager show routing.'],
    source: 'blackbook'
  };

  // Persist to Supabase `venues` table directly if client available
  try {
    const client = getSupabase();
    if (client) {
      client
        .from('venues')
        .upsert(
          {
            id: venueId,
            name: newVenueRecord.name,
            city: newVenueRecord.city,
            state: newVenueRecord.state,
            country: newVenueRecord.country,
            address: newVenueRecord.address,
            capacity: newVenueRecord.capacity,
            email: newVenueRecord.email,
            phone: newVenueRecord.phone,
            buyers: newVenueRecord.buyers,
            website: newVenueRecord.website,
          },
          { onConflict: 'id' }
        )
        .then(() => {}, () => {});
    }
  } catch (_) {}

  // Persist to server API endpoint
  try {
    getSupabaseAccessToken().then((token) => {
      if (!token) return;
      authFetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue: newVenueRecord })
      }).catch(() => {});
    }).catch(() => {});
  } catch (_) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_venues_updated', { detail: newVenueRecord }));
  }

  return {
    id: venueId,
    name: newVenueRecord.name,
    city: newVenueRecord.city,
    state: newVenueRecord.state,
    country: newVenueRecord.country,
    streetAddress: newVenueRecord.street_address,
    fullAddress: newVenueRecord.address,
    capacity: newVenueRecord.capacity,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 90,
    source: 'blackbook',
    displayText: `${newVenueRecord.name} • ${newVenueRecord.city}${newVenueRecord.state ? `, ${newVenueRecord.state}` : ''}${newVenueRecord.capacity ? ` (Cap: ${newVenueRecord.capacity})` : ''}`
  };
}
