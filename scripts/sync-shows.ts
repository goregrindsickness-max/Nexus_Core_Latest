import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be defined in your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const APP_ID = process.env.BANDSINTOWN_APP_ID || 'nexuscore_app_2026';

// Curated list of extreme metal bands to seed remote markets
const metalBands = [
  'Dying Fetus',
  'Suffocation',
  'Cryptopsy',
  'Origin',
  'Cattle Decapitation'
];

async function syncArtistShows() {
  console.log('🚀 Starting Bandsintown artist shows synchronization...');
  for (const artist of metalBands) {
    try {
      console.log(`Fetching shows for ${artist}...`);
      const response = await fetch(`https://rest.bandsintown.com/artists/${encodeURIComponent(artist)}/events?app_id=${APP_ID}`);
      const events = await response.json();

      if (!Array.isArray(events)) {
        console.log(`⚠️ No events or rate limit hit for ${artist}`);
        continue;
      }

      console.log(`📍 Found ${events.length} events for ${artist}. Upserting to Supabase...`);

      for (const event of events) {
        const showData = {
          artist_name: artist,
          venue_name: event.venue?.name || 'Unknown Venue',
          city: event.venue?.city || 'Unknown City',
          region: event.venue?.region || '',
          country: event.venue?.country || '',
          date_time: event.datetime || new Date().toISOString(),
          ticket_url: event.offers?.[0]?.url || null,
          source: 'bandsintown-auto'
        };

        // Upsert into Supabase shows table based on unique constraint or combination
        const { error } = await supabase
          .from('shows')
          .upsert(showData, { onConflict: 'artist_name,date_time,venue_name' });

        if (error) {
          console.error('Supabase insert error:', error.message);
        }
      }
      console.log(`✅ Synced shows for: ${artist}`);
    } catch (err) {
      console.error(`❌ Failed to fetch for ${artist}:`, err);
    }
  }
  console.log('🎉 Show synchronization completed successfully.');
}

syncArtistShows();
