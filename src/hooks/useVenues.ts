import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { VENUE_CARD_COLUMNS, VenueResult, getAllBlackBookVenues } from '../services/venueSearchService';
import { createMonogramPlaceholderSvg } from '../utils/imageFallbacks';

export const VENUE_CARD_SELECT_COLUMNS =
  'id, name, category, avatar_url, city, state, state_province, country, street_address, address, capacity, payout_rating, load_in_rating, genre_fit, email, phone, buyers, website';

export interface VenueCardRecord extends VenueResult {
  category: string;
  avatar_url: string | null;
  placeholder_svg: string;
}

export interface UseVenuesOptions {
  initialSearch?: string;
  pageSize?: number;
  debounceMs?: number;
  enabled?: boolean;
}

export function mapVenueRowToCard(row: any): VenueCardRecord {
  const name = String(row?.name || 'Unnamed Venue').trim();
  const rawAvatar = row?.avatar_url ?? row?.logo_url ?? null;
  const avatarUrl =
    typeof rawAvatar === 'string' && rawAvatar.trim().length > 0 ? rawAvatar.trim() : null;
  const city = String(row?.city || '').trim();
  const state = String(row?.state || row?.state_province || '').trim();
  const streetAddress = row?.streetAddress || row?.street_address || row?.address || '';
  const fullAddress =
    row?.fullAddress || [streetAddress, city, state].filter(Boolean).join(', ');

  return {
    id: String(row?.id || `venue_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`),
    name,
    category: String(row?.category || 'venues'),
    avatar_url: avatarUrl,
    placeholder_svg: createMonogramPlaceholderSvg(name, 'venue'),
    city,
    state,
    country: row?.country || 'USA',
    streetAddress,
    fullAddress,
    capacity: row?.capacity,
    payoutRating: row?.payoutRating || row?.payout_rating || 4.5,
    loadInRating: row?.loadInRating || row?.load_in_rating || 4.0,
    genreFit: row?.genreFit || row?.genre_fit || 90,
    contactName: row?.contactName || row?.buyers,
    contactEmail: row?.contactEmail || row?.email,
    contactPhone: row?.contactPhone || row?.phone,
    website: row?.website,
    source: 'blackbook',
    displayText:
      row?.displayText ||
      `${name}${city ? ` • ${city}${state ? `, ${state}` : ''}` : ''}${row?.capacity ? ` (Cap: ${row.capacity})` : ''}`,
  };
}

export async function queryPaginatedVenues(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ venues: VenueCardRecord[]; hasMore: boolean }> {
  const { search = '', page = 0, pageSize = 20 } = params;
  const from = Math.max(0, page * pageSize);
  const to = from + pageSize - 1;
  const cleanSearch = search.trim().replace(/[%_]/g, '');

  // 1. Primary: Query Supabase `venues` table with explicit column selection, .order(), .range(from, to), and .ilike()
  let qb = supabase
    .from('venues')
    .select(VENUE_CARD_COLUMNS)
    .order('name', { ascending: true })
    .range(from, to);

  if (cleanSearch.length > 0) {
    qb = qb.or(
      `name.ilike.%${cleanSearch}%,city.ilike.%${cleanSearch}%,state.ilike.%${cleanSearch}%`
    );
  }

  const { data, error } = await qb;
  if (!error && Array.isArray(data) && data.length > 0) {
    const venues = data.map(mapVenueRowToCard);
    return {
      venues,
      hasMore: data.length >= pageSize,
    };
  }

  // 2. Fallback: Paginated server query via getAllBlackBookVenues
  const serverVenues = await getAllBlackBookVenues({
    query: cleanSearch,
    page,
    pageSize,
  });
  const mapped = serverVenues.map(mapVenueRowToCard);
  return {
    venues: mapped,
    hasMore: mapped.length >= pageSize,
  };
}

export function useVenues(options: UseVenuesOptions = {}) {
  const { initialSearch = '', pageSize = 20, debounceMs = 300, enabled = true } = options;

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch.trim());
  const [venues, setVenues] = useState<VenueCardRecord[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // 300ms debounce on search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(0);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  const fetchPage = useCallback(
    async (targetPage: number, queryStr: string, append: boolean) => {
      if (!enabled) return;
      const reqId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const result = await queryPaginatedVenues({
          search: queryStr,
          page: targetPage,
          pageSize,
        });
        if (reqId !== requestIdRef.current) return;

        setVenues((prev) => {
          if (!append) return result.venues;
          const seen = new Set(prev.map((v) => v.id));
          const merged = [...prev];
          result.venues.forEach((v) => {
            if (!seen.has(v.id)) {
              seen.add(v.id);
              merged.push(v);
            }
          });
          return merged;
        });
        setHasMore(result.hasMore);
      } catch (err: any) {
        if (reqId === requestIdRef.current) {
          setError(err?.message || 'Failed to load venues');
        }
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [enabled, pageSize]
  );

  useEffect(() => {
    fetchPage(0, debouncedQuery, false);
  }, [debouncedQuery, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPage(nextPage, debouncedQuery, true);
  }, [loading, hasMore, page, debouncedQuery, fetchPage]);

  const refresh = useCallback(async () => {
    setPage(0);
    await fetchPage(0, debouncedQuery, false);
  }, [debouncedQuery, fetchPage]);

  return {
    venues,
    loading,
    error,
    hasMore,
    page,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    loadMore,
    refresh,
  };
}
