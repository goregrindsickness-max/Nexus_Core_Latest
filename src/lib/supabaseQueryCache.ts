/**
 * Shared Supabase PostgREST query deduplication, 60-second TTL caching,
 * schema-aligned column projections, and auth session guards.
 */

export const DEFAULT_QUERY_TTL_MS = 60_000;

export const SHOW_LIST_COLUMNS =
  'id, creator_id, show_name, festival_name, show_date, date, status, show_type, event_scope, headliner, venue, venue_name, venue_address, city, state_province, country, doors_time, set_time, price, presale_price, day_of_show_price, age_restriction, capacity, venue_capacity, expected_attendance, guarantee_amount, settlement_currency, flyer_url, ticket_url, external_ticket_url, support_lineup, additional_notes, created_at';

export const RELEASE_LIST_COLUMNS =
  'id, band_id, label_id, title, catalog_id, type, release_date, label, genre, cover_image, cover_url, cover_color, tracks, formats, digital, audio_vault_path, status, created_by, created_at, updated_at';

export const BAND_CARD_COLUMNS =
  'id, creator_id, band_name, custom_slug, logo_url, cover_url, avatar_url, banner_url, bio, founded_year, micro_genres, city, state_province, country, verification_platform, is_verified, status, is_split_up, created_at';

export const BAND_DETAIL_COLUMNS =
  `${BAND_CARD_COLUMNS}, lineup, streaming_url, featured_youtube_url, metal_archives_url, instagram, spotify, bandcamp, website, record_label, live_update, featured_video_band_name, featured_video_track_name`;

export const PROFILE_CARD_COLUMNS =
  'id, created_at, email, full_name, console_handle, role_badge, account_type, sub_tier, active_workspace, allowed_workspaces, registered_workspaces, avatar_url, banner_url, city, state_province, country, genre_tags, bio, band_id, band_name, creative_id, creative_name, promoter_id, promoter_company, promoter_name, promoter_brand, promoter_agency, promoter_region, promoter_booking_email, promoter_logo, promoter_cover_image, label_id, label_name, creative_metadata, promoter_metadata, update_ticker, rosterTicker, top_song_title, top_song_url';

export const CREATIVE_CARD_COLUMNS =
  'id, creator_id, user_id, business_name, creative_handle, primary_category, primary_skill, secondary_category, secondary_skill, gear, genres, bio, day_rate, pricing_notes, city, state_province, country, portfolio_link, avatar_url, banner_url, created_at';

export const CREATIVE_DETAIL_COLUMNS =
  `${CREATIVE_CARD_COLUMNS}, top_song_title, top_song_artist, top_song_url, live_update_ticker, broadcast_bulletin, availability_status, instagram, artstation`;

export const LABEL_CARD_COLUMNS = 'id, name, contact_email, created_at';

export const PROMOTER_CARD_COLUMNS =
  'id, user_id, name, entity_name, email, location, active_venues, bio, genres, promoter_logo, promoter_cover_image, top_song_url, featured_youtube_url, top_song_artist, top_song_title, created_at';

export const VENUE_CARD_COLUMNS =
  'id, name, city, state_province, country, capacity, payout_rating, load_in_rating, genre_fit, email, buyers, promoter_id';

export const FORUM_THREAD_COLUMNS =
  'id, title, content, category, genre, primary_genre, author, author_name, user_id, author_avatar, image_url, youtube_id, votes, created_at';

export const FORUM_COMMENT_COLUMNS =
  'id, thread_id, parent_comment_id, author_name, user_id, author_avatar, text, likes, created_at';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const queryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

let cachedAuthSessionState: { hasSession: boolean; expiresAt: number } | null = null;
let inFlightSessionCheck: Promise<boolean> | null = null;
let attachedAuthClients = new WeakSet<object>();

export function cachedSupabaseQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_QUERY_TTL_MS,
  shouldCache?: (value: T) => boolean
): Promise<T> {
  const now = Date.now();
  const cached = queryCache.get(key);
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.value as T);
  }

  const existingInFlight = inFlightRequests.get(key);
  if (existingInFlight) {
    return existingInFlight as Promise<T>;
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      const cacheAllowed = shouldCache ? shouldCache(result) : result !== null && result !== undefined;
      if (cacheAllowed) {
        queryCache.set(key, {
          value: result,
          expiresAt: Date.now() + Math.max(0, ttlMs),
        });
      }
      return result;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

export function getCachedSupabaseValue<T>(keyPrefix: string): T | null {
  const now = Date.now();
  for (const [k, entry] of queryCache.entries()) {
    if ((k === keyPrefix || k.startsWith(keyPrefix)) && entry.expiresAt > now) {
      return entry.value as T;
    }
  }
  return null;
}

export function invalidateSupabaseQueryCache(prefixOrKey?: string): void {
  if (!prefixOrKey) {
    queryCache.clear();
    return;
  }
  for (const key of Array.from(queryCache.keys())) {
    if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
      queryCache.delete(key);
    }
  }
}

export function resetAuthSessionCache(): void {
  cachedAuthSessionState = null;
  inFlightSessionCheck = null;
}

export async function hasAuthenticatedSupabaseSession(client: any): Promise<boolean> {
  if (!client || typeof client.auth?.getSession !== 'function') {
    return false;
  }

  if (typeof client === 'object' && client !== null && !attachedAuthClients.has(client)) {
    attachedAuthClients.add(client);
    try {
      client.auth.onAuthStateChange?.((_event: string, session: any) => {
        const hasSession = Boolean(session?.user?.id && session?.access_token);
        cachedAuthSessionState = {
          hasSession,
          expiresAt: Date.now() + 10_000,
        };
      });
    } catch {
      // Ignore listener attachment failures in test/SSR environments
    }
  }

  const now = Date.now();
  if (cachedAuthSessionState && cachedAuthSessionState.expiresAt > now) {
    return cachedAuthSessionState.hasSession;
  }

  if (inFlightSessionCheck) {
    return inFlightSessionCheck;
  }

  inFlightSessionCheck = (async () => {
    try {
      const { data } = await client.auth.getSession();
      const session = data?.session;
      const hasSession = Boolean(session?.user?.id && session?.access_token);
      cachedAuthSessionState = {
        hasSession,
        expiresAt: Date.now() + 10_000,
      };
      return hasSession;
    } catch {
      cachedAuthSessionState = {
        hasSession: false,
        expiresAt: Date.now() + 3_000,
      };
      return false;
    } finally {
      inFlightSessionCheck = null;
    }
  })();

  return inFlightSessionCheck;
}

export async function fetchCachedShowsList(
  client: any,
  options: { limit?: number; ascending?: boolean } = {}
): Promise<any[]> {
  if (!client) return [];
  const limit = Math.min(500, Math.max(1, options.limit ?? 500));
  const ascending = options.ascending ?? true;
  const cacheKey = `shows:list:${ascending ? 'asc' : 'desc'}:${limit}`;

  return cachedSupabaseQuery(
    cacheKey,
    async () => {
      const { data, error } = await client
        .from('shows')
        .select(SHOW_LIST_COLUMNS)
        .order('date', { ascending })
        .limit(limit);
      if (error || !Array.isArray(data)) {
        return [];
      }
      return data;
    },
    DEFAULT_QUERY_TTL_MS,
    (rows) => Array.isArray(rows)
  );
}

export async function fetchCachedBandsDirectory(
  client: any,
  options: { limit?: number; orderBy?: 'created_at' | 'band_name'; ascending?: boolean } = {}
): Promise<any[]> {
  if (!client) return [];
  const limit = Math.min(200, Math.max(1, options.limit ?? 100));
  const orderBy = options.orderBy ?? 'created_at';
  const ascending = options.ascending ?? false;
  const cacheKey = `bands:dir:${orderBy}:${ascending ? 'asc' : 'desc'}:${limit}`;

  return cachedSupabaseQuery(
    cacheKey,
    async () => {
      const { data, error } = await client
        .from('bands')
        .select(BAND_CARD_COLUMNS)
        .order(orderBy, { ascending })
        .limit(limit);
      if (error || !Array.isArray(data)) {
        return [];
      }
      return data;
    },
    DEFAULT_QUERY_TTL_MS,
    (rows) => Array.isArray(rows) && rows.length > 0
  );
}

export async function fetchCachedProfilesDirectory(
  client: any,
  options: { limit?: number; ascending?: boolean } = {}
): Promise<any[]> {
  if (!client) return [];
  const limit = Math.min(200, Math.max(1, options.limit ?? 100));
  const ascending = options.ascending ?? false;
  const cacheKey = `profiles:dir:${ascending ? 'asc' : 'desc'}:${limit}`;

  return cachedSupabaseQuery(
    cacheKey,
    async () => {
      const { data, error } = await client
        .from('profiles')
        .select(PROFILE_CARD_COLUMNS)
        .order('created_at', { ascending })
        .limit(limit);
      if (error || !Array.isArray(data)) {
        return [];
      }
      return data;
    },
    DEFAULT_QUERY_TTL_MS,
    (rows) => Array.isArray(rows) && rows.length > 0
  );
}

export async function fetchCachedCreativesDirectory(
  client: any,
  options: { limit?: number } = {}
): Promise<any[]> {
  if (!client) return [];
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  const cacheKey = `creatives:dir:${limit}`;

  return cachedSupabaseQuery(
    cacheKey,
    async () => {
      const { data, error } = await client
        .from('creatives')
        .select(CREATIVE_CARD_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !Array.isArray(data)) {
        return [];
      }
      return data;
    },
    DEFAULT_QUERY_TTL_MS,
    (rows) => Array.isArray(rows)
  );
}

export async function fetchCachedLabelsDirectory(
  client: any,
  options: { limit?: number } = {}
): Promise<any[]> {
  if (!client) return [];
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  const cacheKey = `labels:dir:${limit}`;

  return cachedSupabaseQuery(
    cacheKey,
    async () => {
      const { data, error } = await client
        .from('labels')
        .select(LABEL_CARD_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !Array.isArray(data)) {
        return [];
      }
      return data;
    },
    DEFAULT_QUERY_TTL_MS,
    (rows) => Array.isArray(rows)
  );
}

export async function fetchCachedPromotersDirectory(
  client: any,
  options: { limit?: number } = {}
): Promise<any[]> {
  if (!client) return [];
  const hasSession = await hasAuthenticatedSupabaseSession(client);
  if (!hasSession) {
    return [];
  }

  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  const cacheKey = `promoters:dir:${limit}`;

  return cachedSupabaseQuery(
    cacheKey,
    async () => {
      const { data, error } = await client
        .from('promoters')
        .select(PROMOTER_CARD_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !Array.isArray(data)) {
        return [];
      }
      return data;
    },
    DEFAULT_QUERY_TTL_MS,
    (rows) => Array.isArray(rows)
  );
}

export async function batchResolveBandsAndProfilesByName(
  client: any,
  rawNames: string[]
): Promise<{
  bandsByName: Map<string, any>;
  profilesByName: Map<string, any>;
}> {
  const bandsByName = new Map<string, any>();
  const profilesByName = new Map<string, any>();
  if (!client || !Array.isArray(rawNames) || rawNames.length === 0) {
    return { bandsByName, profilesByName };
  }

  const normalizedWanted = Array.from(
    new Set(
      rawNames
        .map((n) => String(n || '').trim())
        .filter((n) => n.length >= 2)
    )
  );
  if (normalizedWanted.length === 0) {
    return { bandsByName, profilesByName };
  }

  // First check already-cached directories in memory
  const cachedBands = getCachedSupabaseValue<any[]>('bands:dir:') || [];
  const cachedProfiles = getCachedSupabaseValue<any[]>('profiles:dir:') || [];

  const remainingForBands: string[] = [];
  for (const name of normalizedWanted) {
    const lower = name.toLowerCase();
    const matchedBand = cachedBands.find(
      (b) => String(b?.band_name || '').trim().toLowerCase() === lower
    );
    if (matchedBand) {
      bandsByName.set(lower, matchedBand);
    } else {
      remainingForBands.push(name);
    }
  }

  const remainingForProfiles: string[] = [];
  for (const name of normalizedWanted) {
    const lower = name.toLowerCase();
    if (bandsByName.has(lower)) continue;
    const matchedProfile = cachedProfiles.find((p) => {
      const pFull = String(p?.full_name || '').trim().toLowerCase();
      const pBand = String(p?.band_name || '').trim().toLowerCase();
      return pFull === lower || pBand === lower;
    });
    if (matchedProfile) {
      profilesByName.set(lower, matchedProfile);
    } else {
      remainingForProfiles.push(name);
    }
  }

  const expandNameVariants = (names: string[]): string[] => {
    const variants = new Set<string>();
    names.forEach((n) => {
      const trimmed = n.trim();
      if (!trimmed) return;
      variants.add(trimmed);
      variants.add(trimmed.toLowerCase());
      variants.add(
        trimmed.replace(/\b\w/g, (ch) => ch.toUpperCase())
      );
      variants.add(trimmed.toUpperCase());
    });
    return Array.from(variants);
  };

  if (remainingForBands.length > 0) {
    const bandVariants = expandNameVariants(remainingForBands);
    const cacheKey = `bands:batch:${remainingForBands.map((n) => n.toLowerCase()).sort().join('|')}`;
    const fetchedBands = await cachedSupabaseQuery(
      cacheKey,
      async () => {
        const { data, error } = await client
          .from('bands')
          .select(BAND_CARD_COLUMNS)
          .in('band_name', bandVariants)
          .limit(Math.max(20, remainingForBands.length * 2));
        if (error || !Array.isArray(data)) return [];
        return data;
      },
      DEFAULT_QUERY_TTL_MS
    );

    fetchedBands.forEach((b: any) => {
      const key = String(b?.band_name || '').trim().toLowerCase();
      if (key && !bandsByName.has(key)) {
        bandsByName.set(key, b);
      }
    });
  }

  const stillUnresolvedForProfiles = remainingForProfiles.filter(
    (n) => !bandsByName.has(n.toLowerCase())
  );

  if (stillUnresolvedForProfiles.length > 0) {
    const profileVariants = expandNameVariants(stillUnresolvedForProfiles);
    const cacheKey = `profiles:batch:${stillUnresolvedForProfiles.map((n) => n.toLowerCase()).sort().join('|')}`;
    const fetchedProfiles = await cachedSupabaseQuery(
      cacheKey,
      async () => {
        const { data, error } = await client
          .from('profiles')
          .select(PROFILE_CARD_COLUMNS)
          .in('band_name', profileVariants)
          .limit(Math.max(20, stillUnresolvedForProfiles.length * 2));
        if (error || !Array.isArray(data)) return [];
        return data;
      },
      DEFAULT_QUERY_TTL_MS
    );

    fetchedProfiles.forEach((p: any) => {
      const bandKey = String(p?.band_name || '').trim().toLowerCase();
      const nameKey = String(p?.full_name || '').trim().toLowerCase();
      if (bandKey && !profilesByName.has(bandKey)) profilesByName.set(bandKey, p);
      if (nameKey && !profilesByName.has(nameKey)) profilesByName.set(nameKey, p);
    });
  }

  return { bandsByName, profilesByName };
}
