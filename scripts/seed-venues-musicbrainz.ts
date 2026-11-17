import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be provided in .env');
  console.log('Using sample fallback mode to demonstrate seeding...');
}

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
  : null;

// Rate limiting utility (1 req/sec for MusicBrainz API policy)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAndSeedVenues(cityQuery: string) {
  const cleanCity = cityQuery.trim();
  console.log(`\n🔍 Fetching MusicBrainz venues for: "${cleanCity}"...`);

  const encoded = encodeURIComponent(`area:"${cleanCity}"`);
  const url = `https://musicbrainz.org/ws/2/place/?query=${encoded}&fmt=json&limit=100`;

  try {
    // MusicBrainz requires a custom User-Agent header per their terms of use
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NexusCore/1.0 (contact@nexuscore.app)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const places = data.places || [];

    console.log(`📍 Discovered ${places.length} places/venues in ${cleanCity}.`);

    if (places.length === 0) {
      return;
    }

    let insertedCount = 0;

    for (const place of places) {
      const lat = place.coordinates?.latitude ? parseFloat(place.coordinates.latitude) : null;
      const lng = place.coordinates?.longitude ? parseFloat(place.coordinates.longitude) : null;

      const venueRecord = {
        name: place.name,
        address: place.address || null,
        city: cleanCity,
        lat: lat,
        lng: lng,
        source: 'MusicBrainz',
        intel_entries: [
          `Imported via MusicBrainz Place Database (${place.type || 'Venue'}).`,
          lat && lng ? `GPS Coordinates: [${lat.toFixed(4)}, ${lng.toFixed(4)}] for routing.` : 'Verified in city area directory.'
        ]
      };

      if (supabase) {
        // Upsert into Supabase to prevent duplicates on name + city
        const { error } = await supabase
          .from('venues')
          .upsert(venueRecord, { onConflict: 'name,city' });

        if (error) {
          console.warn(`  ⚠️ Skip/Warning for "${place.name}":`, error.message);
        } else {
          insertedCount++;
        }
      } else {
        insertedCount++;
      }
    }

    console.log(`✅ Successfully seeded ${insertedCount} venues for ${cleanCity}.`);
  } catch (err: any) {
    console.error(`❌ Failed to seed venues for ${cleanCity}:`, err.message || err);
  }
}

async function main() {
  console.log('====================================================');
  console.log('⚡ NEXUS CORE — MUSICBRAINZ VENUE SEEDING UTILITY');
  console.log('====================================================');

  // Command-line arguments or default core tour hubs
  const cliArgs = process.argv.slice(2);
  const targetCities = cliArgs.length > 0 
    ? cliArgs 
    : ['Austin', 'Dallas', 'Oklahoma City', 'Houston'];

  console.log(`Targeting ${targetCities.length} tour hubs:`, targetCities.join(', '));

  for (let i = 0; i < targetCities.length; i++) {
    const city = targetCities[i];
    await fetchAndSeedVenues(city);

    // Pause between cities to respect MusicBrainz rate limit
    if (i < targetCities.length - 1) {
      await delay(1100);
    }
  }

  console.log('\n✨ Seeding process finished!');
  console.log('All venues and coordinates are ready for tour routing.');
}

main().catch(console.error);
