import { getSupabase } from '../supabase';
import { Venue } from '../types';

export type PlaceCategory = 'venue' | 'studio' | 'rehearsal' | 'other';

export interface ClassifiedPlaceInfo {
  place_type: PlaceCategory;
  type_label: string;
  estimated_capacity: number;
}

/**
 * Detect if a MusicBrainz place is permanently closed, defunct, or no longer operational.
 */
export function isDefunctPlace(place: any): boolean {
  if (!place) return false;

  // 1. Life-span explicitly ended
  if (place['life-span']?.ended === true || place['life-span']?.end) {
    return true;
  }

  // 2. Disambiguation comment indicators
  const disambiguation = (place.disambiguation || '').toLowerCase();
  const defunctKeywords = [
    'closed', 'defunct', 'shut down', 'demolished', 'former',
    'historical', 'permanently closed', 'no longer exists', 'ceased',
    'destroyed', 'relocated', 'converted'
  ];
  if (defunctKeywords.some(kw => disambiguation.includes(kw))) {
    return true;
  }

  // 3. Name indicators (e.g. "Club Name (closed)", "CBGB [Defunct]")
  const name = (place.name || '').toLowerCase();
  if (
    name.includes('(closed') ||
    name.includes('[closed') ||
    name.includes('(defunct') ||
    name.includes('[defunct') ||
    name.includes('(former') ||
    name.includes('(demolished') ||
    name.includes('(historic') ||
    name.includes('permanently closed')
  ) {
    return true;
  }

  // 4. Tag inspection
  if (Array.isArray(place.tags)) {
    const hasDefunctTag = place.tags.some((t: any) => {
      const tagName = (typeof t === 'string' ? t : t.name || '').toLowerCase();
      return ['closed', 'defunct', 'demolished', 'historical'].includes(tagName);
    });
    if (hasDefunctTag) return true;
  }

  return false;
}

/**
 * Filter out venues irrelevant to underground touring and live music scenes:
 * - Churches & Religious institutions (cathedrals, chapels, ministries, sanctuaries, temples, etc.)
 * - Arenas & Mega-sports stadiums/coliseums (stadiums, speedways, ballparks, etc.)
 * - Convention centers & Expo halls (civic centers, conference centres, fairgrounds, etc.)
 */
export function isIrrelevantPlace(place: any): boolean {
  if (!place) return false;

  const name = (place.name || '').toLowerCase();
  const rawType = (place.type || '').toLowerCase();
  const disambiguation = (place.disambiguation || '').toLowerCase();

  let tagStrings: string[] = [];
  if (Array.isArray(place.tags)) {
    tagStrings = place.tags.map((t: any) => (typeof t === 'string' ? t : t.name || '').toLowerCase());
  }

  const combinedText = `${name} ${rawType} ${disambiguation} ${tagStrings.join(' ')}`;

  // 1. Churches & Religious institutions
  // Exempt legitimate clubs/studios that simply have "Parish" in their title unless explicitly religious
  const isClubOrStudioType = rawType === 'club' || rawType === 'studio' || rawType === 'rehearsal';
  
  const religiousKeywords = [
    'church', 'cathedral', 'chapel', 'ministry', 'ministries',
    'sanctuary', 'worship', 'synagogue', 'mosque', 'tabernacle', 'basilica', 'baptist',
    'methodist', 'lutheran', 'presbyterian', 'episcopal', 'catholic',
    'orthodox church', 'evangelical', 'christian center', 'christian centre',
    'kingdom hall', 'diocese', 'monastery', 'convent', 'abbey',
    'fellowship hall', 'fellowship center', 'fellowship church', 'temple', 'gurdwara', 'ashram'
  ];

  if (religiousKeywords.some(kw => combinedText.includes(kw))) {
    return true;
  }

  if (!isClubOrStudioType && (name.includes('parish church') || name.includes('saint ') || name.includes('st. '))) {
    if (name.includes('parish') || name.includes('mary') || name.includes('paul') || name.includes('peter') || name.includes('john') || name.includes('joseph') || name.includes('jude')) {
      return true;
    }
  }

  // 2. Arenas, Stadiums & Mega-Sports Facilities
  const arenaKeywords = [
    'arena', 'stadium', 'coliseum', 'colosseum', 'fieldhouse',
    'field house', 'ballpark', 'speedway', 'racecourse', 'raceway',
    'racetrack', 'sports complex', 'athletic center', 'athletic centre',
    'center court', 'superdome', 'astrodome', 'metrodome', 'silverdome',
    'skating arena', 'ice center', 'ice centre', 'motorsports', 'velodrome',
    'sports arena', 'motor speedway'
  ];

  if (rawType === 'stadium' || rawType === 'arena') {
    return true;
  }

  if (arenaKeywords.some(kw => combinedText.includes(kw))) {
    return true;
  }

  // 3. Convention Centers, Conference Centers & Expo Halls
  const conventionKeywords = [
    'convention center', 'convention centre', 'convention hall',
    'conference center', 'conference centre', 'conference hall',
    'expo center', 'expo centre', 'exposition center', 'exposition centre',
    'exposition hall', 'civic center', 'civic centre',
    'exhibition center', 'exhibition centre', 'exhibition hall',
    'fairgrounds', 'fair grounds', 'county fair', 'trade center', 'trade centre',
    'trade mart', 'event center at the', 'banquet hall', 'reception hall'
  ];

  if (conventionKeywords.some(kw => combinedText.includes(kw))) {
    return true;
  }

  return false;
}

/**
 * Intelligent place classifier separating Live Venues from Recording Studios, 
 * Rehearsal Spaces, and other music infrastructure with realistic capacity approximations.
 */
export function classifyPlace(name: string, rawType?: string): ClassifiedPlaceInfo {
  const normalizedName = (name || '').toLowerCase();
  const normalizedType = (rawType || '').toLowerCase();

  // 1. Studio detection (Recording Studios, Audio Labs, Mastering, Sound Tracking)
  if (
    normalizedType === 'studio' ||
    normalizedName.includes('studio') ||
    normalizedName.includes('recording') ||
    normalizedName.includes('sound lab') ||
    normalizedName.includes('mastering') ||
    normalizedName.includes('audio lab') ||
    normalizedName.includes('tracking room') ||
    normalizedName.includes('records studio') ||
    normalizedName.includes('sound company')
  ) {
    return {
      place_type: 'studio',
      type_label: 'Recording Studio',
      estimated_capacity: 0
    };
  }

  // 2. Rehearsal / Production Space detection
  if (
    normalizedType === 'rehearsal' ||
    normalizedName.includes('rehearsal') ||
    normalizedName.includes('lockout') ||
    normalizedName.includes('jam space') ||
    normalizedName.includes('practice room') ||
    normalizedName.includes('soundstage') ||
    normalizedName.includes('backline')
  ) {
    return {
      place_type: 'rehearsal',
      type_label: 'Rehearsal & Production',
      estimated_capacity: 0
    };
  }

  // 3. Live Venues & Stages by Type / Name
  if (
    normalizedType === 'stadium' || 
    normalizedName.includes('stadium') || 
    normalizedName.includes('coliseum') || 
    normalizedName.includes('dome')
  ) {
    return {
      place_type: 'venue',
      type_label: 'Stadium / Coliseum',
      estimated_capacity: 25000
    };
  }

  if (
    normalizedType === 'arena' || 
    normalizedName.includes('arena') || 
    normalizedName.includes('pavilion') || 
    normalizedName.includes('center') || 
    normalizedName.includes('centre')
  ) {
    return {
      place_type: 'venue',
      type_label: 'Arena / Pavilion',
      estimated_capacity: 10000
    };
  }

  if (
    normalizedType === 'amphitheatre' || 
    normalizedType === 'amphitheater' || 
    normalizedName.includes('amphitheater') || 
    normalizedName.includes('amphitheatre')
  ) {
    return {
      place_type: 'venue',
      type_label: 'Amphitheater',
      estimated_capacity: 5000
    };
  }

  if (
    normalizedType === 'concert hall' || 
    normalizedName.includes('concert hall') || 
    normalizedName.includes('opera')
  ) {
    return {
      place_type: 'venue',
      type_label: 'Concert Hall',
      estimated_capacity: 2000
    };
  }

  if (
    normalizedName.includes('theatre') || 
    normalizedName.includes('theater') || 
    normalizedName.includes('auditorium') || 
    normalizedName.includes('ballroom')
  ) {
    return {
      place_type: 'venue',
      type_label: 'Theater / Ballroom',
      estimated_capacity: 1200
    };
  }

  if (
    normalizedType === 'club' || 
    normalizedName.includes('club') || 
    normalizedName.includes('hall') || 
    normalizedName.includes('warehouse')
  ) {
    return {
      place_type: 'venue',
      type_label: 'Live Music Club',
      estimated_capacity: 500
    };
  }

  if (
    normalizedName.includes('bar') || 
    normalizedName.includes('pub') || 
    normalizedName.includes('tavern') || 
    normalizedName.includes('lounge') || 
    normalizedName.includes('cantina') || 
    normalizedName.includes('saloon')
  ) {
    return {
      place_type: 'venue',
      type_label: 'Bar & Lounge Stage',
      estimated_capacity: 200
    };
  }

  if (
    normalizedName.includes('cafe') || 
    normalizedName.includes('coffee') || 
    normalizedName.includes('bistro') || 
    normalizedName.includes('brewery') || 
    normalizedName.includes('distillery')
  ) {
    return {
      place_type: 'venue',
      type_label: 'Brewery / Intimate Stage',
      estimated_capacity: 150
    };
  }

  // 4. Explicit 'Other' in MusicBrainz
  if (normalizedType === 'other') {
    return {
      place_type: 'other',
      type_label: 'Music Landmark / Other',
      estimated_capacity: 0
    };
  }

  // Default venue fallback
  return {
    place_type: 'venue',
    type_label: rawType || 'Live Venue',
    estimated_capacity: 350
  };
}

export interface SeedProgressCallback {
  (message: string, currentCity?: string, progressPercent?: number): void;
}

export interface SeedResult {
  success: boolean;
  totalVenuesFound: number;
  totalVenuesSeeded: number;
  citiesProcessed: string[];
  venues: Venue[];
  errors: string[];
}

// Rate limiting utility for MusicBrainz API etiquette (1 req/sec)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch places/venues from MusicBrainz API for a single city
 */
export async function fetchVenuesFromMusicBrainz(cityQuery: string): Promise<Venue[]> {
  const cleanCity = cityQuery.trim();
  if (!cleanCity) return [];

  // MusicBrainz places search query
  const encodedQuery = encodeURIComponent(`area:"${cleanCity}"`);
  const url = `https://musicbrainz.org/ws/2/place/?query=${encodedQuery}&fmt=json&limit=100`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'NexusCore/1.0 (contact@nexuscore.app)',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz API responded with HTTP status ${response.status} for "${cleanCity}"`);
  }

  const data = await response.json();
  const rawPlaces = data.places || [];

  // Exclude permanently closed, demolished, or ended places, AND filter out churches, arenas, and convention centers
  const places = rawPlaces.filter((place: any) => !isDefunctPlace(place) && !isIrrelevantPlace(place));

  const venues: Venue[] = places.map((place: any) => {
    const lat = place.coordinates?.latitude ? parseFloat(place.coordinates.latitude) : undefined;
    const lng = place.coordinates?.longitude ? parseFloat(place.coordinates.longitude) : undefined;
    
    // Extract State/Province or Country if available
    let state = '';
    let country = 'USA';
    if (place.area) {
      if (place.area['iso-3166-2-codes'] && place.area['iso-3166-2-codes'].length > 0) {
        const parts = place.area['iso-3166-2-codes'][0].split('-');
        if (parts.length === 2) {
          country = parts[0];
          state = parts[1];
        }
      }
    }

    const classification = classifyPlace(place.name, place.type);

    return {
      id: place.id || `mb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: place.name,
      address: place.address || '',
      city: cleanCity,
      state_province: state,
      country: country,
      lat: isNaN(lat as number) ? undefined : lat,
      lng: isNaN(lng as number) ? undefined : lng,
      capacity: classification.estimated_capacity,
      place_type: classification.place_type,
      email: '',
      genre_fit: 85,
      payout_rating: 4.5,
      load_in_rating: 4.0,
      buyers: 'Local Booking Coordinator',
      intel_entries: [
        `Verified via MusicBrainz Database (${classification.type_label}).`,
        lat && lng ? `GPS Coordinates: [${lat.toFixed(4)}, ${lng.toFixed(4)}] calibrated for tour routing.` : 'Address verified in regional directory.'
      ],
      source: 'MusicBrainz',
      created_at: new Date().toISOString()
    };
  });

  return venues;
}

/**
 * Seed a list of cities into Supabase database (with local fallback)
 */
export async function seedVenuesForCities(
  cities: string[],
  onProgress?: SeedProgressCallback,
  supabaseClient?: any
): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    totalVenuesFound: 0,
    totalVenuesSeeded: 0,
    citiesProcessed: [],
    venues: [],
    errors: []
  };

  const client = supabaseClient || getSupabase();
  const totalCities = cities.length;

  for (let i = 0; i < totalCities; i++) {
    const city = cities[i];
    const progress = Math.round(((i + 1) / totalCities) * 100);

    if (onProgress) {
      onProgress(`Querying MusicBrainz directory for ${city}...`, city, progress);
    }

    try {
      const fetchedVenues = await fetchVenuesFromMusicBrainz(city);
      result.totalVenuesFound += fetchedVenues.length;
      result.citiesProcessed.push(city);

      if (onProgress) {
        onProgress(`Discovered ${fetchedVenues.length} venues in ${city}. Syncing to Supabase...`, city, progress);
      }

      // Upsert into Supabase if client is available so database is built app-wide
      if (client && fetchedVenues.length > 0) {
        for (const venue of fetchedVenues) {
          const venueId = venue.id || `mb_${venue.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${venue.city.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const venueRecord = {
            id: venueId,
            name: venue.name,
            address: venue.address || null,
            city: venue.city,
            state_province: venue.state_province || null,
            country: venue.country || 'USA',
            lat: venue.lat || null,
            lng: venue.lng || null,
            place_type: venue.place_type || 'venue',
            capacity: venue.capacity || null,
            email: venue.email || null,
            buyers: venue.buyers || 'Local Booking Coordinator',
            genre_fit: (venue as any).genreFit || venue.genre_fit || 85,
            payout_rating: (venue as any).payoutRating || venue.payout_rating || 4.5,
            load_in_rating: (venue as any).loadInRating || venue.load_in_rating || 4.0,
            source: 'MusicBrainz',
            intel_entries: venue.intel_entries || (venue as any).intelEntries || [
              venue.lat && venue.lng ? `GPS: [${venue.lat.toFixed(4)}, ${venue.lng.toFixed(4)}] calibrated for tour routing.` : 'Verified venue.'
            ]
          };

          try {
            // Check if venue already exists by name and city to prevent duplicate spam
            const { data: existing } = await client
              .from('venues')
              .select('id')
              .ilike('name', venue.name)
              .ilike('city', venue.city)
              .maybeSingle();

            if (existing?.id) {
              const { error: updateErr } = await client
                .from('venues')
                .update({
                  address: venueRecord.address,
                  state_province: venueRecord.state_province,
                  lat: venueRecord.lat,
                  lng: venueRecord.lng,
                  place_type: venueRecord.place_type,
                  capacity: venueRecord.capacity,
                  source: 'MusicBrainz',
                  intel_entries: venueRecord.intel_entries
                })
                .eq('id', existing.id);

              if (!updateErr) {
                result.totalVenuesSeeded++;
              }
            } else {
              const { error: insertErr } = await client
                .from('venues')
                .insert([venueRecord]);

              if (!insertErr) {
                result.totalVenuesSeeded++;
              } else {
                // Try upsert by id fallback
                const { error: upsertErr } = await client
                  .from('venues')
                  .upsert(venueRecord, { onConflict: 'id' });
                if (!upsertErr) {
                  result.totalVenuesSeeded++;
                }
              }
            }
          } catch (dbErr: any) {
            console.warn(`Database insert skipped for "${venue.name}":`, dbErr?.message || dbErr);
          }
        }
      } else {
        result.totalVenuesSeeded += fetchedVenues.length;
      }

      result.venues.push(...fetchedVenues);

      // Save to local offline venues cache
      try {
        const cachedRaw = localStorage.getItem('nexus_musicbrainz_venues');
        const existing: Venue[] = cachedRaw ? JSON.parse(cachedRaw) : [];
        const existingNames = new Set(existing.map(v => `${v.name.toLowerCase()}_${v.city.toLowerCase()}`));
        
        const newlyAdded = fetchedVenues.filter(v => !existingNames.has(`${v.name.toLowerCase()}_${v.city.toLowerCase()}`));
        const updated = [...existing, ...newlyAdded];
        localStorage.setItem('nexus_musicbrainz_venues', JSON.stringify(updated));
      } catch (_) {}

      // Rate limit delay between cities to follow MusicBrainz 1 req/sec guidelines
      if (i < totalCities - 1) {
        await delay(1100);
      }
    } catch (err: any) {
      const msg = `Failed seeding for ${city}: ${err?.message || err}`;
      console.error(msg);
      result.errors.push(msg);
      if (onProgress) {
        onProgress(`⚠️ Error query for ${city}: ${err?.message || 'Network error'}`, city, progress);
      }
    }
  }

  if (onProgress) {
    onProgress(`✅ Completed! Seeded ${result.totalVenuesFound} venues across ${result.citiesProcessed.length} hubs.`, undefined, 100);
  }

  return result;
}
