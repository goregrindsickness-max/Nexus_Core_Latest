import { getSupabaseService } from '../lib/supabaseAdmin';
import { INITIAL_COMMUNITY_BANDS } from './seedBandsData';
import { BUILT_IN_BLACK_BOOK_VENUES } from './seedVenuesData';

/**
 * Server-only seed script for populating Supabase `bands` and `venues` tables.
 * Kept strictly outside `src/` so zero static catalog records are bundled into the frontend client.
 */
export async function seedDatabaseCatalogs() {
  const sb = getSupabaseService();
  if (!sb) {
    console.warn('[SEED DATABASE] Supabase service role client not configured.');
    return { seededBands: 0, seededVenues: 0 };
  }

  let seededBands = 0;
  let seededVenues = 0;

  if (Array.isArray(INITIAL_COMMUNITY_BANDS) && INITIAL_COMMUNITY_BANDS.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < INITIAL_COMMUNITY_BANDS.length; i += batchSize) {
      const chunk = INITIAL_COMMUNITY_BANDS.slice(i, i + batchSize).map((b) => ({
        id: b.id,
        band_name: b.band_name || b.name,
        city: b.city || null,
        state_province: b.state_province || b.state || null,
        country: b.country || 'USA',
        logo_url: b.logo_url || b.avatar_url || null,
        cover_url: b.cover_url || b.banner_url || null,
        bio: b.bio || null,
        micro_genres: b.micro_genres || b.subgenres || [],
        founded_year: b.founded_year || null,
        status: b.status || 'active',
        record_label: b.record_label || b.label || null,
      }));
      const { error } = await sb.from('bands').upsert(chunk, { onConflict: 'id', ignoreDuplicates: true });
      if (!error) seededBands += chunk.length;
    }
  }

  if (Array.isArray(BUILT_IN_BLACK_BOOK_VENUES) && BUILT_IN_BLACK_BOOK_VENUES.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < BUILT_IN_BLACK_BOOK_VENUES.length; i += batchSize) {
      const chunk = BUILT_IN_BLACK_BOOK_VENUES.slice(i, i + batchSize).map((v) => ({
        id: v.id,
        name: v.name,
        city: v.city || null,
        state: v.state || null,
        country: v.country || 'USA',
        address: v.fullAddress || v.streetAddress || null,
        capacity: typeof v.capacity === 'number' ? v.capacity : Number(v.capacity) || 350,
        payout_rating: v.payoutRating || 4.5,
        load_in_rating: v.loadInRating || 4.0,
        genre_fit: v.genreFit || 90,
        email: v.contactEmail || null,
        phone: v.contactPhone || null,
        buyers: v.contactName || null,
        website: v.website || null,
      }));
      const { error } = await sb.from('venues').upsert(chunk, { onConflict: 'id', ignoreDuplicates: true });
      if (!error) seededVenues += chunk.length;
    }
  }

  return { seededBands, seededVenues };
}
