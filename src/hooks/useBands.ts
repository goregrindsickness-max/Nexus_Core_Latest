import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createMonogramPlaceholderSvg } from '../utils/imageFallbacks';

export const BAND_CARD_SELECT_COLUMNS =
  'id, name, band_name, category, avatar_url, logo_url, city, state, state_province, country, micro_genres, custom_slug, verification_status, is_verified, followers_count, status, is_split_up';

export interface BandCardRecord {
  id: string;
  name: string;
  band_name: string;
  category: string;
  avatar_url: string | null;
  placeholder_svg: string;
  city: string;
  state: string;
  country?: string;
  genre?: string;
  slug?: string;
  is_verified?: boolean;
  followers_count?: number;
}

export interface UseBandsOptions {
  initialSearch?: string;
  pageSize?: number;
  debounceMs?: number;
  enabled?: boolean;
}

export function mapBandRowToCard(row: any): BandCardRecord {
  const name = String(row?.band_name || row?.name || 'Unnamed Band').trim();
  const rawAvatar = row?.avatar_url ?? row?.logo_url ?? null;
  const avatarUrl =
    typeof rawAvatar === 'string' && rawAvatar.trim().length > 0 ? rawAvatar.trim() : null;
  const city = String(row?.city || '').trim();
  const state = String(row?.state || row?.state_province || '').trim();
  const genre = Array.isArray(row?.micro_genres)
    ? row.micro_genres.slice(0, 2).join(' / ')
    : String(row?.micro_genres || row?.genre || '');

  return {
    id: String(row?.id || `band_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`),
    name,
    band_name: name,
    category: String(row?.category || 'bands'),
    avatar_url: avatarUrl,
    placeholder_svg: createMonogramPlaceholderSvg(name, 'band'),
    city,
    state,
    country: row?.country || 'USA',
    genre,
    slug: row?.custom_slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    is_verified: Boolean(row?.is_verified || row?.verification_status === 'verified_official'),
    followers_count: Number(row?.followers_count) || 0,
  };
}

export async function queryPaginatedBands(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ bands: BandCardRecord[]; hasMore: boolean }> {
  const { search = '', page = 0, pageSize = 20 } = params;
  const from = Math.max(0, page * pageSize);
  const to = from + pageSize - 1;
  const cleanSearch = search.trim().replace(/[%_]/g, '');

  let query = supabase
    .from('bands')
    .select(BAND_CARD_SELECT_COLUMNS)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (cleanSearch.length > 0) {
    query = query.or(
      `band_name.ilike.%${cleanSearch}%,name.ilike.%${cleanSearch}%,city.ilike.%${cleanSearch}%,state_province.ilike.%${cleanSearch}%`
    );
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) {
    return { bands: [], hasMore: false };
  }

  const bands = data.map(mapBandRowToCard);
  return {
    bands,
    hasMore: data.length >= pageSize,
  };
}

export function useBands(options: UseBandsOptions = {}) {
  const { initialSearch = '', pageSize = 20, debounceMs = 300, enabled = true } = options;

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch.trim());
  const [bands, setBands] = useState<BandCardRecord[]>([]);
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
        const result = await queryPaginatedBands({
          search: queryStr,
          page: targetPage,
          pageSize,
        });
        if (reqId !== requestIdRef.current) return;

        setBands((prev) => {
          if (!append) return result.bands;
          const seen = new Set(prev.map((b) => b.id));
          const merged = [...prev];
          result.bands.forEach((b) => {
            if (!seen.has(b.id)) {
              seen.add(b.id);
              merged.push(b);
            }
          });
          return merged;
        });
        setHasMore(result.hasMore);
      } catch (err: any) {
        if (reqId === requestIdRef.current) {
          setError(err?.message || 'Failed to load bands');
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
    bands,
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
