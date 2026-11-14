import { getSupabase } from './clientService';
import { getAllRealBandProfiles } from './bandProfileSearchService';
import { createMonogramPlaceholderSvg } from '../utils/imageFallbacks';

export interface MentionSuggestionItem {
  id: string;
  tagType: 'band' | 'user' | 'promoter' | 'venue' | 'creative' | 'label';
  name: string;
  handle: string;
  avatar?: string;
  subtitle: string;
}

const MENTION_PROFILE_COLUMNS =
  'id, full_name, display_name, name, console_handle, handle, username, email, account_type, role, city, state, avatar_url, promoter_metadata';

export async function searchMentionSuggestions(
  query: string,
  extraBands: any[] = [],
  page = 0,
  pageSize = 20
): Promise<MentionSuggestionItem[]> {
  const cleanQ = (query || '').toLowerCase().trim().replace(/^@+/, '');
  const sanitizedQ = cleanQ.replace(/[%_]/g, '');
  const from = Math.max(0, page * pageSize);
  const to = from + pageSize - 1;
  const results: MentionSuggestionItem[] = [];
  const seenKeys = new Set<string>();

  const addResult = (item: MentionSuggestionItem) => {
    if (!item.name || !item.name.trim()) return;
    const dedup = item.name.toLowerCase().trim();
    if (seenKeys.has(dedup)) return;
    seenKeys.add(dedup);
    results.push({
      ...item,
      avatar: item.avatar || createMonogramPlaceholderSvg(item.name, item.tagType === 'band' ? 'band' : 'user'),
    });
  };

  // 1. Bands from authoritative paginated band search service
  try {
    const bands = await getAllRealBandProfiles(extraBands, {
      query: sanitizedQ,
      page,
      pageSize,
    });
    bands.forEach((b) => {
      const bName = b.name || '';
      const bSlug = b.slug || '';
      const bGenre = b.genre || '';
      const bLoc = b.location || '';
      if (
        !cleanQ ||
        bName.toLowerCase().includes(cleanQ) ||
        bSlug.toLowerCase().includes(cleanQ) ||
        bGenre.toLowerCase().includes(cleanQ) ||
        bLoc.toLowerCase().includes(cleanQ)
      ) {
        addResult({
          id: `band-${b.id || b.name}`,
          tagType: 'band',
          name: b.name,
          handle: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          avatar: b.avatar || createMonogramPlaceholderSvg(b.name, 'band'),
          subtitle: `🎵 Band ${b.genre ? `• ${b.genre}` : ''}${b.location ? ` • ${b.location}` : ''}`,
        });
      }
    });
  } catch (err) {
    console.warn('[mentionSearchService] Error querying bands:', err);
  }

  // 2. Query Supabase 'profiles' table with explicit column selection, .order(), .range() & .ilike()
  try {
    const client = getSupabase();
    if (client) {
      let qb = client
        .from('profiles')
        .select(MENTION_PROFILE_COLUMNS)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (sanitizedQ.length > 0) {
        qb = qb.or(
          `full_name.ilike.%${sanitizedQ}%,console_handle.ilike.%${sanitizedQ}%,email.ilike.%${sanitizedQ}%,city.ilike.%${sanitizedQ}%`
        );
      }

      const { data: profilesData, error } = await qb;
      if (profilesData && !error && Array.isArray(profilesData)) {
        profilesData.forEach((p: any) => {
          const pName = (p.full_name || p.display_name || p.name || '').trim();
          const pHandle = (p.console_handle || p.handle || p.username || '')
            .trim()
            .replace(/^@+/, '');
          const pEmail = (p.email || '').trim().toLowerCase();
          const pRole = (p.account_type || p.role || p.portalRole || 'member').toLowerCase();
          const pCity = p.city || p.location || '';

          if (!pName) return;

          const matches =
            !cleanQ ||
            pName.toLowerCase().includes(cleanQ) ||
            pHandle.toLowerCase().includes(cleanQ) ||
            pEmail.includes(cleanQ) ||
            pCity.toLowerCase().includes(cleanQ);

          if (matches) {
            const promoterBrand = (
              p.promoter_metadata?.brand_name ||
              p.promoter_metadata?.agency_name ||
              ''
            ).trim();
            if (
              pRole === 'promoter' &&
              promoterBrand &&
              promoterBrand.toLowerCase() !== pName.toLowerCase()
            ) {
              addResult({
                id: `promoter-${p.id || promoterBrand}`,
                tagType: 'promoter',
                name: promoterBrand,
                handle: promoterBrand.toLowerCase().replace(/[^a-z0-9]/g, ''),
                avatar:
                  p.promoter_metadata?.logo_url ||
                  p.avatar_url ||
                  createMonogramPlaceholderSvg(promoterBrand, 'venue'),
                subtitle: `🎪 Promoter / Venue${pCity ? ` • ${pCity}` : ''}`,
              });
            }

            addResult({
              id: `user-${p.id || pName}`,
              tagType:
                pRole === 'promoter'
                  ? 'promoter'
                  : pRole === 'creative'
                    ? 'creative'
                    : pRole === 'label'
                      ? 'label'
                      : 'user',
              name: pName,
              handle: pHandle || pName.toLowerCase().replace(/[^a-z0-9]/g, ''),
              avatar:
                p.avatar_url ||
                p.profile_avatar ||
                p.avatar ||
                createMonogramPlaceholderSvg(pName, 'user'),
              subtitle: `👤 ${
                pRole === 'promoter'
                  ? 'Promoter'
                  : pRole === 'creative'
                    ? 'Creative'
                    : pRole === 'label'
                      ? 'Record Label'
                      : 'Scene Member'
              }${pCity ? ` • ${pCity}` : ''}`,
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('[mentionSearchService] Error querying profiles:', err);
  }

  return results.slice(0, 8);
}
