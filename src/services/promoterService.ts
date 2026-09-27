import { getSupabase, ensureValidSupabaseAuthSession } from './clientService';
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
      : (Array.isArray(meta.genre_tags) && meta.genre_tags.length > 0 ? meta.genre_tags : (Array.isArray(userProfile?.genres) && userProfile.genres.length > 0 ? userProfile.genres : (Array.isArray(userProfile?.genre_tags) && userProfile.genre_tags.length > 0 ? userProfile.genre_tags : ['Brutal Death Metal', 'Slam Death Metal', 'Grindcore', 'Deathcore', 'Death Metal', 'Extreme Metal']))),
    promoter_logo: meta.logo_url || userProfile?.promoter_logo || 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601',
    promoter_cover_image: meta.banner_url || meta.cover_url || userProfile?.promoter_cover_image || 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
    top_song_url: userProfile?.top_song_url || userProfile?.promoter_metadata?.top_song_url || '',
    featured_youtube_url: userProfile?.featured_youtube_url || userProfile?.top_song_url || userProfile?.promoter_metadata?.featured_video_url || userProfile?.promoter_metadata?.top_song_url || '',
    top_song_artist: userProfile?.top_song_artist || userProfile?.promoter_metadata?.top_song_artist || '',
    top_song_title: userProfile?.top_song_title || userProfile?.promoter_metadata?.top_song_title || ''
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

  await ensureValidSupabaseAuthSession(supabase).catch(() => {});
  const payload = buildNexusLivePromoterPayload(userProfile);

  return await executeWithSchemaResilience(
    async (sanitizedPayload) => {
      const targetUid = sanitizedPayload.user_id || userProfile?.id;
      const targetPid = sanitizedPayload.id;
      const targetEmail = sanitizedPayload.email;

      let updateQuery = supabase.from('promoters').update(sanitizedPayload);
      if (targetPid && targetUid) {
        updateQuery = updateQuery.or(`id.eq.${targetPid},user_id.eq.${targetUid}`);
      } else if (targetPid) {
        updateQuery = updateQuery.eq('id', targetPid);
      } else if (targetUid) {
        updateQuery = updateQuery.eq('user_id', targetUid);
      } else if (targetEmail) {
        updateQuery = updateQuery.ilike('email', targetEmail);
      }

      const { error: updateErr, data: updateData } = await updateQuery;
      if (!updateErr) {
        return { error: null, data: updateData };
      }

      return await supabase.from('promoters').upsert([sanitizedPayload], { onConflict: 'id' });
    },
    payload
  );
}

/**
 * Authoritatively fetches and synchronizes the promoter profile from Supabase profiles/promoters tables.
 */
export async function autoSyncPromoterProfile(userProfile: any): Promise<any> {
  if (!userProfile?.id || userProfile.id === 'guest') return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    await ensureValidSupabaseAuthSession(supabase).catch(() => {});
    const userId = userProfile.id;
    const userEmail = (userProfile.email || '').trim();

    // 1. Fetch fresh record from Supabase profiles table
    let profData: any = null;
    try {
      let query = supabase.from('profiles').select('*');
      if (userId && userEmail) {
        query = query.or(`id.eq.${userId},email.ilike.${userEmail}`);
      } else if (userId) {
        query = query.eq('id', userId);
      } else if (userEmail) {
        query = query.ilike('email', userEmail);
      }
      const { data, error } = await query.maybeSingle();
      if (data && !error) profData = data;
    } catch (e) {
      console.warn('[promoterService] profiles query error:', e);
    }

    // 2. Fetch from promoters table if accessible
    let promoterRecord: any = null;
    try {
      const promoterIdToQuery = userProfile.promoter_id || profData?.promoter_id;
      let query = supabase.from('promoters').select('*');
      if (promoterIdToQuery) {
        query = query.or(`id.eq.${promoterIdToQuery},user_id.eq.${userId}`);
      } else {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query.maybeSingle();
      if (data && !error) promoterRecord = data;
    } catch (_) {
      // Ignore permission denied or missing table
    }

    const pm = profData?.promoter_metadata || userProfile?.promoter_metadata || {};
    const effectiveBio = promoterRecord?.bio || pm.bio || profData?.promoter_bio || userProfile?.promoter_bio || 'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. I have a lengthy history in the underground extreme metal scene with several festivals under my name most notably the Chicago/ Texas Domination Fest that ran from 2014-2024. The next evolution is set to move to another new market more details on that in the near future.';
    const effectiveBrandName = promoterRecord?.entity_name || pm.brand_name || pm.agency_name || pm.business_name || profData?.promoter_agency || profData?.promoter_brand || 'Nexus Live Productions';
    const effectiveLogo = promoterRecord?.promoter_logo || pm.logo_url || profData?.promoter_logo || profData?.avatar_url || userProfile?.promoter_logo || userProfile?.avatar_url || 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601';
    const effectiveBanner = promoterRecord?.promoter_cover_image || pm.banner_url || pm.cover_url || profData?.promoter_cover_image || profData?.banner_url || userProfile?.promoter_cover_image || userProfile?.banner_url || 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635';

    const merged = {
      ...pm,
      ...(promoterRecord || {}),
      id: promoterRecord?.id || profData?.promoter_id || pm.id || userId,
      user_id: userId,
      name: profData?.full_name || userProfile?.full_name || 'Miguel Goregrinder Medina',
      brand_name: effectiveBrandName,
      agency_name: effectiveBrandName,
      entity_name: effectiveBrandName,
      business_name: effectiveBrandName,
      promoter_name: effectiveBrandName,
      promoter_agency: effectiveBrandName,
      promoter_brand: effectiveBrandName,
      bio: effectiveBio,
      promoter_bio: effectiveBio,
      city: promoterRecord?.location?.split(',')[0]?.trim() || pm.city || profData?.city || 'Denison',
      state: promoterRecord?.location?.split(',')[1]?.trim() || pm.state || profData?.state_province || 'TX',
      booking_email: promoterRecord?.email || pm.booking_email || profData?.email || userEmail || 'goregrindsickness@gmail.com',
      phone: promoterRecord?.phone || pm.phone || profData?.phone || '(580)952-2047',
      logo_url: effectiveLogo,
      promoter_logo: effectiveLogo,
      banner_url: effectiveBanner,
      promoter_cover_image: effectiveBanner,
      top_song_url: promoterRecord?.top_song_url || pm.top_song_url || profData?.top_song_url || userProfile?.top_song_url || '',
      featured_youtube_url: promoterRecord?.featured_youtube_url || promoterRecord?.top_song_url || pm.featured_video_url || pm.featured_youtube_url || pm.top_song_url || profData?.featured_youtube_url || profData?.top_song_url || userProfile?.featured_youtube_url || userProfile?.top_song_url || '',
      top_song_artist: promoterRecord?.top_song_artist || pm.top_song_artist || profData?.top_song_artist || userProfile?.top_song_artist || '',
      top_song_title: promoterRecord?.top_song_title || pm.top_song_title || profData?.top_song_title || userProfile?.top_song_title || '',
      active_venues: promoterRecord?.active_venues || pm.active_venues || [
        'Reggies Rock Club',
        'Subterranean',
        'Cobra Lounge',
        'WC Social Club',
        'Live Wire Lounge',
        'Empty Bottle',
        'Beat Kitchen'
      ],
      social_links: promoterRecord?.social_links || pm.social_links || {
        facebook: 'https://facebook.com/nexuslive',
        instagram: 'https://instagram.com/nexusliveproductions'
      },
      genres: Array.isArray(promoterRecord?.genres) && promoterRecord.genres.length > 0 
        ? promoterRecord.genres 
        : (Array.isArray(promoterRecord?.genre_tags) && promoterRecord.genre_tags.length > 0
          ? promoterRecord.genre_tags
          : (Array.isArray(pm.genres) && pm.genres.length > 0 
            ? pm.genres 
            : (Array.isArray(pm.genre_tags) && pm.genre_tags.length > 0
              ? pm.genre_tags
              : (Array.isArray(profData?.genre_tags) && profData.genre_tags.length > 0
                ? profData.genre_tags
                : (Array.isArray(userProfile?.genres) && userProfile.genres.length > 0
                  ? userProfile.genres
                  : ['Brutal Death Metal', 'Slam Death Metal', 'Grindcore', 'Deathcore', 'Death Metal', 'Extreme Metal'])))))
    };

    return merged;
  } catch (err) {
    console.error('[promoterService] Error during autoSyncPromoterProfile:', err);
    return null;
  }
}
