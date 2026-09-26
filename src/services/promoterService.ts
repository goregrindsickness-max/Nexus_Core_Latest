import { getSupabase } from './clientService';
import { executeWithSchemaResilience } from './schemaResilienceService';

export interface PromoterRecord {
  id?: string;
  user_id: string;
  name: string;
  entity_name: string;
  email?: string;
  phone?: string;
  location?: string;
  active_venues?: string[];
  social_links?: Record<string, any>;
  notes?: string;
  bio?: string;
  genres?: string[];
  promoter_logo?: string;
  promoter_cover_image?: string;
  top_song_url?: string;
  featured_youtube_url?: string;
  top_song_artist?: string;
  top_song_title?: string;
}

/**
 * Builds the canonical Nexus Live Productions promoter payload from a user profile object.
 */
export function buildNexusLivePromoterPayload(userProfile: any): PromoterRecord {
  const userId = userProfile?.id || '5403162d-1947-43aa-b5f6-38a1bd2a1b80';
  const meta = userProfile?.promoter_metadata || {};
  
  return {
    id: userProfile?.promoter_id || userId,
    user_id: userId,
    name: userProfile?.full_name || userProfile?.name || 'Miguel Goregrinder Medina',
    entity_name: meta.brand_name || meta.agency_name || userProfile?.promoter_agency || 'Nexus Live Productions',
    email: meta.booking_email || meta.admin_email || userProfile?.email || 'goregrindsickness@gmail.com',
    phone: meta.phone || userProfile?.phone || '(580)952-2047',
    location: meta.city ? `${meta.city}, ${meta.state || 'TX'}` : (userProfile?.city || 'Denison, TX'),
    active_venues: [
      'Reggies Rock Club',
      'Subterranean',
      'Cobra Lounge',
      'WC Social Club',
      'Live Wire Lounge',
      'Empty Bottle',
      'Beat Kitchen'
    ],
    social_links: {
      instagram: meta.instagram || 'https://instagram.com/nexusliveproductions',
      facebook: 'https://facebook.com/nexuslive'
    },
    notes: 'Primary underground death metal, slam, and grindcore tour operations (Chicago/Texas Domination Fest iterations).',
    bio: meta.bio || userProfile?.promoter_bio || 'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. I have a lengthy history in the underground extreme metal scene with several festivals under my name most notably the Chicago/ Texas Domination Fest that ran from 2014-2024. The next evolution is set to move to another new market more details on that in the near future.',
    genres: Array.isArray(meta.genres) && meta.genres.length > 0 
      ? meta.genres 
      : ['Brutal Death Metal', 'Slam Death Metal', 'Grindcore', 'Deathcore', 'Death Metal', 'Extreme Metal'],
    promoter_logo: meta.logo_url || userProfile?.promoter_logo || 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601',
    promoter_cover_image: meta.banner_url || meta.cover_url || userProfile?.promoter_cover_image || 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
    top_song_url: userProfile?.top_song_url || 'https://youtu.be/IiyG2jGoYwQ?is=0Di4mt0umKGjpmro',
    featured_youtube_url: userProfile?.featured_youtube_url || userProfile?.top_song_url || 'https://youtu.be/IiyG2jGoYwQ?is=0Di4mt0umKGjpmro',
    top_song_artist: userProfile?.top_song_artist || 'Analepsy',
    top_song_title: userProfile?.top_song_title || 'Analepsy - Recursive Singularity'
  };
}

/**
 * Sends/upserts the promoter record to the Supabase public.promoters table.
 */
export async function syncPromoterProfileToSupabase(userProfile: any): Promise<{ data?: any; error: any }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: new Error('Supabase client unavailable') };
  }

  const payload = buildNexusLivePromoterPayload(userProfile);

  return await executeWithSchemaResilience(
    async (sanitizedPayload) => await supabase.from('promoters').upsert([sanitizedPayload], { onConflict: 'id' }),
    payload
  );
}
