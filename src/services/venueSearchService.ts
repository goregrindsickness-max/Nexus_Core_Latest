import { venuesStore } from '../utils/indexedDB';

export interface VenueResult {
  id: string;
  name: string;
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
}

// Built-in curated Black Book venue directory (curated underground & premier music venues)
export const BUILT_IN_BLACK_BOOK_VENUES: VenueResult[] = [
  {
    id: 'bb_v1',
    name: 'The Echo',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    streetAddress: '1822 Sunset Blvd',
    fullAddress: '1822 Sunset Blvd, Los Angeles, CA 90026',
    capacity: 350,
    payoutRating: 4.8,
    loadInRating: 3.5,
    genreFit: 92,
    source: 'blackbook',
    displayText: 'The Echo • Los Angeles, CA (Cap: 350)'
  },
  {
    id: 'bb_v2',
    name: 'Chain Reaction',
    city: 'Anaheim',
    state: 'CA',
    country: 'USA',
    streetAddress: '1652 W Lincoln Ave',
    fullAddress: '1652 W Lincoln Ave, Anaheim, CA 92801',
    capacity: 250,
    payoutRating: 4.5,
    loadInRating: 4.0,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'Chain Reaction • Anaheim, CA (Cap: 250)'
  },
  {
    id: 'bb_v3',
    name: 'Bottom of the Hill',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    streetAddress: '1233 17th St',
    fullAddress: '1233 17th St, San Francisco, CA 94107',
    capacity: 246,
    payoutRating: 5.0,
    loadInRating: 3.0,
    genreFit: 85,
    source: 'blackbook',
    displayText: 'Bottom of the Hill • San Francisco, CA (Cap: 246)'
  },
  {
    id: 'bb_v4',
    name: 'Neumos',
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    streetAddress: '925 E Pike St',
    fullAddress: '925 E Pike St, Seattle, WA 98122',
    capacity: 650,
    payoutRating: 4.9,
    loadInRating: 4.5,
    genreFit: 78,
    source: 'blackbook',
    displayText: 'Neumos • Seattle, WA (Cap: 650)'
  },
  {
    id: 'bb_v5',
    name: '924 Gilman',
    city: 'Berkeley',
    state: 'CA',
    country: 'USA',
    streetAddress: '924 Gilman St',
    fullAddress: '924 Gilman St, Berkeley, CA 94710',
    capacity: 300,
    payoutRating: 4.9,
    loadInRating: 4.0,
    genreFit: 99,
    source: 'blackbook',
    displayText: '924 Gilman • Berkeley, CA (Cap: 300)'
  },
  {
    id: 'bb_v6',
    name: 'Saint Vitus Bar',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    streetAddress: '1120 Manhattan Ave',
    fullAddress: '1120 Manhattan Ave, Brooklyn, NY 11222',
    capacity: 250,
    payoutRating: 4.9,
    loadInRating: 3.8,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'Saint Vitus Bar • Brooklyn, NY (Cap: 250)'
  },
  {
    id: 'bb_v7',
    name: 'First Avenue & 7th St Entry',
    city: 'Minneapolis',
    state: 'MN',
    country: 'USA',
    streetAddress: '701 N 1st Ave',
    fullAddress: '701 N 1st Ave, Minneapolis, MN 55403',
    capacity: 1500,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 88,
    source: 'blackbook',
    displayText: 'First Avenue • Minneapolis, MN (Cap: 1500)'
  },
  {
    id: 'bb_v8',
    name: 'Subterranean',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    streetAddress: '2011 W North Ave',
    fullAddress: '2011 W North Ave, Chicago, IL 60647',
    capacity: 400,
    payoutRating: 4.6,
    loadInRating: 3.2,
    genreFit: 90,
    source: 'blackbook',
    displayText: 'Subterranean • Chicago, IL (Cap: 400)'
  },
  {
    id: 'bb_v9',
    name: 'Reggies Rock Club',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    streetAddress: '2105 S State St',
    fullAddress: '2105 S State St, Chicago, IL 60616',
    capacity: 400,
    payoutRating: 4.7,
    loadInRating: 4.2,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'Reggies Rock Club • Chicago, IL (Cap: 400)'
  },
  {
    id: 'bb_v10',
    name: 'Mohawk Austin',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    streetAddress: '912 Red River St',
    fullAddress: '912 Red River St, Austin, TX 78701',
    capacity: 900,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 94,
    source: 'blackbook',
    displayText: 'Mohawk Austin • Austin, TX (Cap: 900)'
  },
  {
    id: 'bb_v11',
    name: 'The Middle East Restaurant and Nightclub',
    city: 'Cambridge',
    state: 'MA',
    country: 'USA',
    streetAddress: '472 Massachusetts Ave',
    fullAddress: '472 Massachusetts Ave, Cambridge, MA 02139',
    capacity: 575,
    payoutRating: 4.4,
    loadInRating: 3.6,
    genreFit: 89,
    source: 'blackbook',
    displayText: 'The Middle East • Cambridge, MA (Cap: 575)'
  },
  {
    id: 'bb_v12',
    name: 'The Underworld Camden',
    city: 'London',
    country: 'UK',
    streetAddress: '174 Camden High St',
    fullAddress: '174 Camden High St, London NW1 0NE, UK',
    capacity: 500,
    payoutRating: 4.7,
    loadInRating: 3.5,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'The Underworld • London, UK (Cap: 500)'
  },
  {
    id: 'bb_v13',
    name: 'Whisky a Go Go',
    city: 'West Hollywood',
    state: 'CA',
    country: 'USA',
    streetAddress: '8901 Sunset Blvd',
    fullAddress: '8901 Sunset Blvd, West Hollywood, CA 90069',
    capacity: 500,
    payoutRating: 4.0,
    loadInRating: 3.5,
    genreFit: 80,
    source: 'blackbook',
    displayText: 'Whisky a Go Go • West Hollywood, CA (Cap: 500)'
  },
  {
    id: 'bb_v14',
    name: 'Metro Chicago',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    streetAddress: '3730 N Clark St',
    fullAddress: '3730 N Clark St, Chicago, IL 60613',
    capacity: 1100,
    payoutRating: 5.0,
    loadInRating: 4.7,
    genreFit: 91,
    source: 'blackbook',
    displayText: 'Metro Chicago • Chicago, IL (Cap: 1100)'
  }
];

export const GOOGLE_MAPS_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
  'AIzaSyDI0NWyHExs2pWEc9UIoe3y-luHdhqcbGg';

let isScriptLoading = false;
let isScriptLoaded = false;

// Initialize Google Maps script using the new modern loading pattern
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

// Fetch all aggregated local Black Book venues
export async function getAllBlackBookVenues(): Promise<VenueResult[]> {
  const aggregated: VenueResult[] = [...BUILT_IN_BLACK_BOOK_VENUES];
  const seenIds = new Set(aggregated.map((v) => v.id.toLowerCase()));
  const seenNames = new Set(aggregated.map((v) => `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`));

  // 1. Check IndexedDB venuesStore
  try {
    const stored = await venuesStore.getItem<any>('nexus_master_venues');
    let dbVenues: any[] = [];
    if (stored) {
      dbVenues = typeof stored === 'string' ? JSON.parse(stored) : stored;
    }
    if (Array.isArray(dbVenues)) {
      dbVenues.forEach((v) => {
        if (!v?.name) return;
        const key = `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          const vId = v.id || `db_${v.name.replace(/\s+/g, '_')}`;
          if (!seenIds.has(vId.toLowerCase())) {
            seenIds.add(vId.toLowerCase());
            aggregated.push({
              id: vId,
              name: v.name,
              city: v.city,
              state: v.state,
              country: v.country || 'USA',
              streetAddress: v.street_address || v.address,
              fullAddress: [v.street_address || v.address, v.city, v.state].filter(Boolean).join(', '),
              capacity: v.capacity,
              payoutRating: v.payoutRating || 4.5,
              loadInRating: v.loadInRating || 4.0,
              genreFit: v.genreFit || 90,
              source: 'blackbook',
              displayText: `${v.name}${v.city ? ` • ${v.city}${v.state ? `, ${v.state}` : ''}` : ''}${v.capacity ? ` (Cap: ${v.capacity})` : ''}`
            });
          }
        }
      });
    }
  } catch (_) {}

  // 2. Check localStorage nexus_core_venues
  try {
    const local = localStorage.getItem('nexus_core_venues');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach((v) => {
          if (!v?.name) return;
          const key = `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            const vId = v.id || `loc_${v.name.replace(/\s+/g, '_')}`;
            if (!seenIds.has(vId.toLowerCase())) {
              seenIds.add(vId.toLowerCase());
              aggregated.push({
                id: vId,
                name: v.name,
                city: v.city,
                state: v.state,
                country: v.country || 'USA',
                streetAddress: v.street_address || v.address,
                fullAddress: [v.street_address || v.address, v.city, v.state].filter(Boolean).join(', '),
                capacity: v.capacity,
                payoutRating: v.payoutRating || 4.5,
                loadInRating: v.loadInRating || 4.0,
                genreFit: v.genreFit || 90,
                source: 'blackbook',
                displayText: `${v.name}${v.city ? ` • ${v.city}${v.state ? `, ${v.state}` : ''}` : ''}${v.capacity ? ` (Cap: ${v.capacity})` : ''}`
              });
            }
          }
        });
      }
    }
  } catch (_) {}

  return aggregated;
}

// Search Black Book venues
export async function searchBlackBookVenues(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length === 0) return [];
  const cleanQ = query.toLowerCase().trim();
  const all = await getAllBlackBookVenues();

  return all
    .filter((v) => {
      const nameMatch = v.name.toLowerCase().includes(cleanQ);
      const cityMatch = v.city && v.city.toLowerCase().includes(cleanQ);
      const stateMatch = v.state && v.state.toLowerCase().includes(cleanQ);
      const fullMatch = v.fullAddress && v.fullAddress.toLowerCase().includes(cleanQ);
      return nameMatch || cityMatch || stateMatch || fullMatch;
    })
    .slice(0, 6);
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
    // Try Places API (New) REST first
    externalPlacesResults = await searchPlacesApiNew(cleanQ);

    // If REST returned empty, try JS SDK
    if (externalPlacesResults.length === 0) {
      externalPlacesResults = await searchPlacesJsSdk(cleanQ);
    }

    // If still empty, fallback to Photon OSM
    if (externalPlacesResults.length === 0) {
      externalPlacesResults = await searchPhotonVenues(cleanQ);
    }
  }

  const seenKeys = new Set<string>();
  const combined: VenueResult[] = [];

  // Add Black Book matches first
  blackBookResults.forEach((v) => {
    const key = v.name.toLowerCase().trim();
    seenKeys.add(key);
    combined.push(v);
  });

  // Add Google Places / external matches
  externalPlacesResults.forEach((v) => {
    const key = v.name.toLowerCase().trim();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      combined.push(v);
    }
  });

  return combined;
}
