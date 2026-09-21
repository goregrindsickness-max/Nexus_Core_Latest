import { getSupabase } from './clientService';
import { parseLocationFields } from './bandService';
import { generateUUID, executeWithSchemaResilience } from './schemaResilienceService';
import { hasRegisteredWorkspace } from '../types';

export const VALID_CREATIVE_COLUMNS = new Set([
  'id',
  'creator_id',
  'user_id',
  'business_name',
  'creative_handle',
  'primary_category',
  'primary_skill',
  'secondary_category',
  'secondary_skill',
  'skills',
  'gear',
  'genres',
  'bio',
  'day_rate',
  'pricing_notes',
  'city',
  'state_province',
  'country',
  'portfolio_link',
  'avatar_url',
  'banner_url',
  'instagram',
  'artstation',
  'top_song_title',
  'top_song_artist',
  'top_song_url',
  'live_update_ticker',
  'broadcast_bulletin',
  'availability_status',
  'payout_method',
  'stripe_account_id',
  'paypal_email',
  'tax_id',
  'legal_name',
  'legal_entity_type',
  'created_at',
  'updated_at',
]);

export function sanitizeCreativePayload(rawPayload: any): Record<string, any> {
  if (!rawPayload || typeof rawPayload !== 'object') return {};

  const clean: Record<string, any> = { ...rawPayload };

  // 1. Business Name canonicalization
  const bName = clean.business_name || clean.creative_name || clean.name || 'Creative Studio';
  clean.business_name = bName;

  // 2. Creator ID & User ID
  const creatorId = clean.creator_id || clean.user_id || clean.owner_id || clean.profile_id || null;
  clean.creator_id = creatorId;
  clean.user_id = creatorId;

  // 3. Creative Handle
  const handleVal = clean.creative_handle || clean.handle || clean.console_handle || null;
  if (handleVal) {
    clean.creative_handle = String(handleVal).replace('@', '').trim();
  }

  // 4. Location canonicalization (city, state_province, country)
  let city = clean.city || '';
  let state_province = clean.state_province || clean.state || '';
  let country = clean.country || '';

  if (!city && !state_province && !country && (clean.base_location || clean.location)) {
    const parsed = parseLocationFields(clean.base_location || clean.location);
    city = parsed.city;
    state_province = parsed.state_province;
    country = parsed.country;
  }

  clean.city = city ? city.trim() : null;
  clean.state_province = state_province ? state_province.trim() : null;
  clean.country = country ? country.trim() : 'USA';

  // 5. Bio
  const bio = clean.bio || clean.biography || clean.profileBlurb || '';
  clean.bio = bio ? String(bio).trim() : null;

  // 6. Categories & Core Skills
  const primaryCategory = clean.primary_category || clean.category || clean.specialty || 'GRAPHIC_DESIGN';
  clean.primary_category = primaryCategory;

  const primarySkill = clean.primary_skill || (Array.isArray(clean.skills) && clean.skills[0]) || (Array.isArray(clean.selected_skills) && clean.selected_skills[0]) || 'MERCH_DESIGN';
  clean.primary_skill = primarySkill;

  if (clean.secondary_category) {
    clean.secondary_category = clean.secondary_category;
  }
  if (clean.secondary_skill || (Array.isArray(clean.skills) && clean.skills[1])) {
    clean.secondary_skill = clean.secondary_skill || clean.skills[1];
  }

  // 7. Skills array
  if (clean.skills || clean.selected_skills) {
    const rawSkills = clean.skills || clean.selected_skills;
    if (Array.isArray(rawSkills)) {
      clean.skills = rawSkills.filter(Boolean).map(String);
    } else if (typeof rawSkills === 'string') {
      try {
        const parsed = JSON.parse(rawSkills);
        clean.skills = Array.isArray(parsed) ? parsed : rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
      } catch {
        clean.skills = rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
  }

  // 8. Gear array
  if (clean.gear || clean.gear_tags || clean.primary_gear) {
    const rawGear = clean.gear || clean.gear_tags || (clean.primary_gear ? [clean.primary_gear] : []);
    if (Array.isArray(rawGear)) {
      clean.gear = rawGear.filter(Boolean).map(String);
    } else if (typeof rawGear === 'string') {
      try {
        const parsed = JSON.parse(rawGear);
        clean.gear = Array.isArray(parsed) ? parsed : rawGear.split(',').map((s: string) => s.trim()).filter(Boolean);
      } catch {
        clean.gear = rawGear.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
  }

  // 9. Genres array (aligned with registration taxonomy)
  if (clean.genres || clean.genre_tags || clean.micro_genres || clean.selected_genres) {
    const rawGenres = clean.genres || clean.genre_tags || clean.micro_genres || clean.selected_genres;
    if (Array.isArray(rawGenres)) {
      clean.genres = rawGenres.filter(Boolean).map(String);
    } else if (typeof rawGenres === 'string') {
      try {
        const parsed = JSON.parse(rawGenres);
        clean.genres = Array.isArray(parsed) ? parsed : rawGenres.split(',').map((s: string) => s.trim()).filter(Boolean);
      } catch {
        clean.genres = rawGenres.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
  }

  // 10. Live update ticker & bulletin
  const tickerVal = clean.live_update_ticker || clean.broadcast_bulletin || clean.initial_broadcast_bulletin || clean.inital_broadcast_bulletin || clean.quick_broadcast || clean.update_ticker || null;
  if (tickerVal) {
    clean.live_update_ticker = String(tickerVal).trim();
    clean.broadcast_bulletin = String(tickerVal).trim();
  }

  // 11. Highlight Track / Anthem media
  const highlightUrl = clean.top_song_url || clean.featured_youtube_url || clean.highlight_track_url || clean.highlight_track || null;
  const highlightTitle = clean.top_song_title || clean.highlight_track_title || clean.favoriteSong || null;
  const highlightArtist = clean.top_song_artist || clean.highlight_track_artist || null;

  if (highlightUrl) clean.top_song_url = String(highlightUrl).trim();
  if (highlightTitle) clean.top_song_title = String(highlightTitle).trim();
  if (highlightArtist) clean.top_song_artist = String(highlightArtist).trim();

  // 12. Legal name
  if (clean.legal_name || clean.legal_full_name) {
    clean.legal_name = clean.legal_name || clean.legal_full_name;
  }

  // 13. Avatar & Banner (strictly clean values)
  const rawAvatar = clean.avatar_url ?? clean.creative_avatar ?? clean.image ?? clean.image_url ?? null;
  if (typeof rawAvatar === 'string' && rawAvatar.trim().length > 0) {
    clean.avatar_url = rawAvatar.trim();
  } else if (clean.avatar_url === null) {
    clean.avatar_url = null;
  }

  const rawBanner = clean.banner_url ?? clean.creative_banner ?? clean.cover_url ?? clean.banner ?? null;
  if (typeof rawBanner === 'string' && rawBanner.trim().length > 0) {
    clean.banner_url = rawBanner.trim();
  } else if (clean.banner_url === null) {
    clean.banner_url = null;
  }

  // 14. Links: portfolio_link
  const webLink = clean.portfolio_link || clean.website || null;
  if (webLink) {
    clean.portfolio_link = webLink;
  }

  // 15. STRICT WHITELIST: Delete all other fields before saving to Supabase
  for (const key of Object.keys(clean)) {
    if (!VALID_CREATIVE_COLUMNS.has(key)) {
      delete clean[key];
    }
  }

  return clean;
}

/**
 * Format creative payload cleanly without bleeding user profile / band attributes.
 */
export function formatCreativePayload(profile: any, creativeId?: string, userId?: string): Record<string, any> {
  if (!profile || typeof profile !== 'object') return {};

  const cleanProfileInput = { ...profile };
  delete cleanProfileInput.band_id;
  delete cleanProfileInput.band_name;
  delete cleanProfileInput.bandName;
  delete cleanProfileInput.band;
  delete cleanProfileInput.band_members;
  delete cleanProfileInput.band_bio;
  delete cleanProfileInput.band_logo;
  delete cleanProfileInput.band_banner;

  const cId = creativeId || cleanProfileInput.creative_id || cleanProfileInput.registered_creative_id || cleanProfileInput.id;
  const uId = userId || cleanProfileInput.creator_id || cleanProfileInput.user_id || cleanProfileInput.id;

  const creativePayload: Record<string, any> = {
    id: cId,
    creator_id: uId,
    user_id: uId,
    business_name: cleanProfileInput.business_name || cleanProfileInput.creative_name || cleanProfileInput.name || 'Creative Studio',
    creative_handle: cleanProfileInput.creative_handle || cleanProfileInput.handle || cleanProfileInput.console_handle || 'creative_pro',
    primary_category: cleanProfileInput.primary_category || cleanProfileInput.category || cleanProfileInput.specialty || 'GRAPHIC_DESIGN',
    primary_skill: cleanProfileInput.primary_skill || (Array.isArray(cleanProfileInput.skills) ? cleanProfileInput.skills[0] : 'MERCH_DESIGN'),
    secondary_category: cleanProfileInput.secondary_category || null,
    secondary_skill: cleanProfileInput.secondary_skill || (Array.isArray(cleanProfileInput.skills) ? cleanProfileInput.skills[1] : null),
    skills: cleanProfileInput.skills || cleanProfileInput.selected_skills || [],
    gear: cleanProfileInput.gear || cleanProfileInput.gear_tags || (cleanProfileInput.primary_gear ? [cleanProfileInput.primary_gear] : []),
    genres: cleanProfileInput.genres || cleanProfileInput.genre_tags || cleanProfileInput.micro_genres || [],
    bio: cleanProfileInput.bio || cleanProfileInput.biography || cleanProfileInput.profileBlurb || null,
    day_rate: cleanProfileInput.day_rate ? String(cleanProfileInput.day_rate) : (cleanProfileInput.base_rate_value ? String(cleanProfileInput.base_rate_value) : '350'),
    pricing_notes: cleanProfileInput.pricing_notes || null,
    city: cleanProfileInput.city || null,
    state_province: cleanProfileInput.state_province || null,
    country: cleanProfileInput.country || 'USA',
    portfolio_link: cleanProfileInput.portfolio_link || cleanProfileInput.website || null,
    avatar_url: cleanProfileInput.creative_avatar || cleanProfileInput.avatar_url || null,
    banner_url: cleanProfileInput.creative_banner || cleanProfileInput.banner_url || null,
    instagram: cleanProfileInput.instagram || null,
    artstation: cleanProfileInput.artstation || null,
    top_song_title: cleanProfileInput.top_song_title || cleanProfileInput.highlight_track_title || cleanProfileInput.favoriteSong || null,
    top_song_artist: cleanProfileInput.top_song_artist || cleanProfileInput.highlight_track_artist || null,
    top_song_url: cleanProfileInput.top_song_url || cleanProfileInput.featured_youtube_url || cleanProfileInput.highlight_track_url || null,
    live_update_ticker: cleanProfileInput.live_update_ticker || cleanProfileInput.broadcast_bulletin || cleanProfileInput.initial_broadcast_bulletin || cleanProfileInput.inital_broadcast_bulletin || cleanProfileInput.quick_broadcast || null,
    broadcast_bulletin: cleanProfileInput.broadcast_bulletin || cleanProfileInput.live_update_ticker || cleanProfileInput.initial_broadcast_bulletin || cleanProfileInput.inital_broadcast_bulletin || cleanProfileInput.quick_broadcast || null,
    availability_status: cleanProfileInput.availability_status || 'Available',
    payout_method: cleanProfileInput.payout_method || 'stripe',
    stripe_account_id: cleanProfileInput.stripe_account_id || null,
    paypal_email: cleanProfileInput.paypal_email || null,
    tax_id: cleanProfileInput.tax_id || null,
    legal_name: cleanProfileInput.legal_name || cleanProfileInput.legal_full_name || null,
    legal_entity_type: cleanProfileInput.legal_entity_type || 'sole_proprietorship',
  };

  return sanitizeCreativePayload({
    ...cleanProfileInput,
    ...creativePayload
  });
}

export const mapCreativeData = (rows: any[] | null) => {
  if (!rows) return [];
  return rows.map((c) => {
    const city = c.city || '';
    const state_province = c.state_province || c.state || '';
    const country = c.country || '';
    const compiledLocation =
      [city, state_province, country].filter(Boolean).join(', ') || 'Global Scene';

    const validName = c.business_name || c.creative_name || c.name || 'Creative Studio';
    const validCreatorId = c.creator_id || c.user_id || c.owner_id || null;
    const validAvatar = c.avatar_url || c.creative_avatar || c.image || c.image_url || 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=150';
    const validBanner = c.banner_url || c.creative_banner || c.cover_url || '';

    const validBio = c.bio || c.biography || '';
    const validBulletin = c.live_update_ticker || c.broadcast_bulletin || c.initial_broadcast_bulletin || c.inital_broadcast_bulletin || c.quick_broadcast || '';
    const validTopSongUrl = c.top_song_url || c.featured_youtube_url || c.highlight_track_url || '';
    const validTopSongTitle = c.top_song_title || c.highlight_track_title || c.favoriteSong || '';
    const validTopSongArtist = c.top_song_artist || c.highlight_track_artist || '';
    const validGenres = Array.isArray(c.genres) ? c.genres : (Array.isArray(c.genre_tags) ? c.genre_tags : (Array.isArray(c.micro_genres) ? c.micro_genres : []));
    const validSkills = Array.isArray(c.skills) ? c.skills : (Array.isArray(c.selected_skills) ? c.selected_skills : []);
    const validGear = Array.isArray(c.gear) ? c.gear : (Array.isArray(c.gear_tags) ? c.gear_tags : []);

    const primary_category = c.primary_category || c.category || c.specialty || 'GRAPHIC_DESIGN';
    const primary_skill = c.primary_skill || validSkills[0] || 'MERCH_DESIGN';
    const secondary_category = c.secondary_category || null;
    const secondary_skill = c.secondary_skill || validSkills[1] || null;

    return {
      ...c,
      business_name: validName,
      creative_name: validName,
      name: validName,
      creative_handle: c.creative_handle || c.handle || 'creative_pro',
      creator_id: validCreatorId,
      user_id: validCreatorId,
      primary_category,
      category: primary_category,
      specialty: primary_category,
      primary_skill,
      secondary_category,
      secondary_skill,
      avatar_url: validAvatar,
      creative_avatar: validAvatar,
      banner_url: validBanner,
      creative_banner: validBanner,
      bio: validBio,
      biography: validBio,
      live_update_ticker: validBulletin,
      broadcast_bulletin: validBulletin,
      initial_broadcast_bulletin: validBulletin,
      inital_broadcast_bulletin: validBulletin,
      quick_broadcast: validBulletin,
      update_ticker: validBulletin,
      top_song_url: validTopSongUrl,
      featured_youtube_url: validTopSongUrl,
      highlight_track_url: validTopSongUrl,
      top_song_title: validTopSongTitle,
      highlight_track_title: validTopSongTitle,
      favoriteSong: validTopSongTitle,
      top_song_artist: validTopSongArtist,
      highlight_track_artist: validTopSongArtist,
      genres: validGenres,
      genre_tags: validGenres,
      micro_genres: validGenres,
      skills: validSkills,
      selected_skills: validSkills,
      gear: validGear,
      gear_tags: validGear,
      city,
      state_province,
      country,
      base_location: compiledLocation,
      location: compiledLocation,
    };
  });
};

export const fetchUserCreatives = async (userId: string) => {
  if (!userId) return [];
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('creatives')
      .select('*')
      .or(`creator_id.eq.${userId},user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notice fetching creatives:', error.message);
      return [];
    }

    return mapCreativeData(data);
  } catch (err: any) {
    console.warn('Notice fetching creatives exception:', err?.message || err);
    return [];
  }
};

export const autoSyncCreativeProfile = async (userProfile: any) => {
  if (!userProfile?.id || userProfile.id === 'guest') return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const upAny = userProfile as any;
    let localProf: any = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
        if (raw) localProf = JSON.parse(raw);
      }
    } catch (_) {}

    const creativeIdToQuery = upAny.creative_id || localProf.creative_id || upAny.registered_creative_id;
    let query = supabase.from('creatives').select('*');
    if (creativeIdToQuery) {
      query = query.or(`id.eq.${creativeIdToQuery},creator_id.eq.${userProfile.id},user_id.eq.${userProfile.id}`);
    } else {
      query = query.or(`creator_id.eq.${userProfile.id},user_id.eq.${userProfile.id}`);
    }
    const { data: existingCreative } = await query.maybeSingle();

    // If record exists in Supabase, RETURN IT directly and DO NOT OVERWRITE
    if (existingCreative) {
      return existingCreative;
    }

    // Check if user is registered in creative workspace
    const isExplicitlyRegistered =
      hasRegisteredWorkspace(userProfile, 'creative') ||
      userProfile.active_workspace === 'creative' ||
      userProfile.account_type === 'creative' ||
      (Array.isArray(userProfile.registered_workspaces) &&
        userProfile.registered_workspaces.some((w: any) =>
          typeof w === 'string' ? (w.toLowerCase() === 'creative' || w.toLowerCase() === 'creative pro') : w?.type === 'creative'
        ));

    const meta = userProfile.creative_metadata && typeof userProfile.creative_metadata === 'object' ? userProfile.creative_metadata : {};
    const localMeta = localProf.creative_metadata && typeof localProf.creative_metadata === 'object' ? localProf.creative_metadata : {};
    const hasExplicitCreativeId = Boolean(upAny.creative_id || (localProf && localProf.creative_id) || upAny.registered_creative_id);
    const hasExplicitBizData = Boolean((meta && meta.business_name) || upAny.creative_business_name);

    if (!isExplicitlyRegistered && !hasExplicitCreativeId && !hasExplicitBizData) {
      return null;
    }

    const effectiveId = creativeIdToQuery || generateUUID();
    const effectiveBizName =
      meta.business_name ||
      localMeta.business_name ||
      upAny.creative_business_name ||
      localProf.creative_business_name ||
      upAny.creative_name ||
      'Creative Studio';

    const effectiveAvatar =
      meta.avatar_url ||
      localMeta.avatar_url ||
      upAny.creative_avatar ||
      localProf.creative_avatar ||
      null;

    const effectiveBanner =
      meta.banner_url ||
      localMeta.banner_url ||
      upAny.creative_banner ||
      localProf.creative_banner ||
      null;

    const effectiveBio =
      meta.bio ||
      localMeta.bio ||
      'Visual artist, creative director, & audio specialist.';

    const effectiveCity = meta.city || localMeta.city || null;
    const effectiveState = meta.state_province || localMeta.state_province || null;
    const effectiveCountry = meta.country || localMeta.country || 'USA';

    const effectiveDayRate = meta.day_rate ? String(meta.day_rate) : localMeta.day_rate ? String(localMeta.day_rate) : '350';
    const effectiveCategory = meta.primary_category || meta.category || localMeta.primary_category || 'GRAPHIC_DESIGN';
    const effectivePrimarySkill = meta.primary_skill || (Array.isArray(meta.skills) && meta.skills[0]) || 'MERCH_DESIGN';
    const effectiveSecondaryCategory = meta.secondary_category || localMeta.secondary_category || null;
    const effectiveSecondarySkill = meta.secondary_skill || (Array.isArray(meta.skills) && meta.skills[1]) || null;
    const effectiveSkills = meta.skills || meta.selected_skills || localMeta.selected_skills || [effectivePrimarySkill, effectiveSecondarySkill].filter(Boolean);
    const effectiveGear = meta.gear || meta.gear_tags || localMeta.gear_tags || ['Adobe Photoshop', 'Illustrator', 'Wacom Cintiq Pro', 'Canon EOS R5'];
    const effectiveGenres = meta.genres || meta.genre_tags || localMeta.genres || [];
    const effectiveTicker = meta.live_update_ticker || meta.broadcast_bulletin || meta.quick_broadcast || 'Ready for commissions & assignments.';

    const payload = sanitizeCreativePayload({
      id: effectiveId,
      creator_id: userProfile.id,
      user_id: userProfile.id,
      business_name: effectiveBizName,
      creative_handle: upAny.creative_handle || localProf.creative_handle || 'creative_pro',
      primary_category: effectiveCategory,
      primary_skill: effectivePrimarySkill,
      secondary_category: effectiveSecondaryCategory,
      secondary_skill: effectiveSecondarySkill,
      avatar_url: effectiveAvatar,
      banner_url: effectiveBanner,
      bio: effectiveBio,
      city: effectiveCity,
      state_province: effectiveState,
      country: effectiveCountry,
      portfolio_link: meta.portfolio_link || meta.website || localMeta.portfolio_link || null,
      day_rate: effectiveDayRate,
      pricing_notes: meta.pricing_notes || localMeta.pricing_notes || 'Standard commission terms: 50% deposit required.',
      availability_status: meta.availability_status || localMeta.availability_status || 'Available',
      live_update_ticker: effectiveTicker,
      broadcast_bulletin: effectiveTicker,
      gear: effectiveGear,
      genres: effectiveGenres,
      skills: effectiveSkills,
      payout_method: meta.payout_method || localMeta.payout_method || 'stripe',
      stripe_account_id: meta.stripe_account_id || localMeta.stripe_account_id || null,
      paypal_email: meta.paypal_email || localMeta.paypal_email || null,
    });

    console.log('[Auto-Sync] Registering canonical creative record to Supabase:', payload);
    const { data: upsertData, error: upsertErr } = await executeWithSchemaResilience(
      async (p) => supabase.from('creatives').upsert(p, { onConflict: 'id' }).select().maybeSingle(),
      payload
    );

    if (upsertErr) {
      console.warn('[Auto-Sync] Warning saving to creatives table:', upsertErr);
    } else {
      console.log('✓ [Auto-Sync] Successfully saved creative profile row into Supabase creatives table!');
    }

    // Delay before updating profiles table to ensure PostgREST foreign key cache registers the creative row
    await new Promise(r => setTimeout(r, 300));

    try {
      await supabase
        .from('profiles')
        .update({
          creative_id: effectiveId,
          creative_name: effectiveBizName,
          allowed_workspaces: Array.from(new Set([...(userProfile.allowed_workspaces || []), 'creative'])),
        })
        .eq('id', userProfile.id);
    } catch (_) {}

    return upsertData || payload;
  } catch (err: any) {
    console.warn('[Auto-Sync] Notice syncing existing creative profile:', err);
    return null;
  }
};
