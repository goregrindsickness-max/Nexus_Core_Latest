import { getSupabase } from './clientService';
import { getAllRealBandProfiles } from './bandProfileSearchService';

export interface MentionSuggestionItem {
  id: string;
  tagType: 'band' | 'user' | 'promoter' | 'venue' | 'creative' | 'label';
  name: string;
  handle: string;
  avatar?: string;
  subtitle: string;
}

// In-memory cache for profiles
let cachedProfiles: any[] = [];
let lastProfilesFetch = 0;
const PROFILES_CACHE_TTL = 15000; // 15 seconds

const CORE_FALLBACK_ENTITIES: MentionSuggestionItem[] = [
  {
    id: 'core-cannibal-corpse',
    tagType: 'band',
    name: 'Cannibal Corpse',
    handle: 'cannibalcorpse',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
    subtitle: '🎵 Band • Death Metal • Buffalo, NY'
  },
  {
    id: 'core-brodequin',
    tagType: 'band',
    name: 'Brodequin',
    handle: 'brodequin',
    avatar: '',
    subtitle: '🎵 Band • Brutal Death Metal • Knoxville, TN'
  },
  {
    id: 'core-birdflesh',
    tagType: 'band',
    name: 'Birdflesh',
    handle: 'birdflesh',
    avatar: '',
    subtitle: '🎵 Band • Extreme Metal • Växjö, Sweden'
  },
  {
    id: 'core-cordyceps',
    tagType: 'band',
    name: 'Cordyceps',
    handle: 'cordyceps',
    avatar: '',
    subtitle: '🎵 Band • Technical Death Metal • Denver, CO'
  },
  {
    id: 'core-cranial-impalement',
    tagType: 'band',
    name: 'Cranial Impalement',
    handle: 'cranialimpalement',
    avatar: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1790608983047_1790608983069.jpg?t=1790608983069',
    subtitle: '🎵 Band • Brutal Death Metal • Chattanooga, TN'
  },
  {
    id: 'core-lust-of-decay',
    tagType: 'band',
    name: 'Lust of Decay',
    handle: 'lustofdecay',
    avatar: '',
    subtitle: '🎵 Band • Brutal Death Metal • Comatose Music'
  },
  {
    id: 'core-nexus-live',
    tagType: 'promoter',
    name: 'Nexus Live Productions',
    handle: 'nexusliveproductions',
    avatar: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601',
    subtitle: '🎪 Promoter / Venue • National Tour Booking'
  },
  {
    id: 'core-miguel-medina',
    tagType: 'user',
    name: 'Miguel Goregrinder Medina',
    handle: 'miguelmedina',
    avatar: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/avatar_1786739491396.jpg',
    subtitle: '👤 Scene Member • Admin & Curator'
  },
  {
    id: 'core-garrett-workman',
    tagType: 'user',
    name: 'Garrett Workman',
    handle: 'garrettworkman',
    avatar: '',
    subtitle: '👤 Scene Member • Dallas, TX'
  },
  {
    id: 'core-tyler-slamson',
    tagType: 'user',
    name: 'Tyler Slamson',
    handle: 'tylerslamson',
    avatar: '',
    subtitle: '👤 Scene Member'
  },
  {
    id: 'core-ana-lisa-allen',
    tagType: 'user',
    name: 'Ana Lisa Allen',
    handle: 'analisaallen',
    avatar: '',
    subtitle: '👤 Scene Member • Durant, OK'
  }
];

export async function searchMentionSuggestions(
  query: string,
  extraBands: any[] = []
): Promise<MentionSuggestionItem[]> {
  const cleanQ = (query || '').toLowerCase().trim().replace(/^@+/, '');
  const results: MentionSuggestionItem[] = [];
  const seenKeys = new Set<string>();

  const addResult = (item: MentionSuggestionItem) => {
    if (!item.name || !item.name.trim()) return;
    const dedup = item.name.toLowerCase().trim();
    if (seenKeys.has(dedup)) return;
    seenKeys.add(dedup);
    results.push(item);
  };

  // 1. Bands from authoritative band service
  try {
    const bands = await getAllRealBandProfiles(extraBands);
    bands.forEach((b) => {
      const bName = b.name || '';
      const bSlug = b.slug || '';
      const bGenre = b.genre || '';
      const bLoc = b.location || '';
      if (!cleanQ || bName.toLowerCase().includes(cleanQ) || bSlug.toLowerCase().includes(cleanQ) || bGenre.toLowerCase().includes(cleanQ) || bLoc.toLowerCase().includes(cleanQ)) {
        addResult({
          id: `band-${b.id || b.name}`,
          tagType: 'band',
          name: b.name,
          handle: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          avatar: b.avatar,
          subtitle: `🎵 Band ${b.genre ? `• ${b.genre}` : ''}${b.location ? ` • ${b.location}` : ''}`
        });
      }
    });
  } catch (err) {
    console.warn('[mentionSearchService] Error querying bands:', err);
  }

  // 2. Query Supabase 'profiles' table with caching
  try {
    const now = Date.now();
    if (cachedProfiles.length === 0 || now - lastProfilesFetch > PROFILES_CACHE_TTL) {
      const client = getSupabase();
      if (client) {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(80);
        if (data && !error && Array.isArray(data)) {
          cachedProfiles = data;
          lastProfilesFetch = now;
        }
      }
    }

    cachedProfiles.forEach((p) => {
      const pName = (p.full_name || p.display_name || p.name || '').trim();
      const pHandle = (p.console_handle || p.handle || p.username || '').trim().replace(/^@+/, '');
      const pEmail = (p.email || '').trim().toLowerCase();
      const pRole = (p.account_type || p.role || p.portalRole || 'member').toLowerCase();
      const pCity = p.city || p.location || '';

      if (!pName) return;

      const matches = !cleanQ || 
        pName.toLowerCase().includes(cleanQ) || 
        pHandle.toLowerCase().includes(cleanQ) || 
        pEmail.includes(cleanQ) ||
        pCity.toLowerCase().includes(cleanQ);

      if (matches) {
        // Promoter brand override if applicable
        const promoterBrand = (p.promoter_metadata?.brand_name || p.promoter_metadata?.agency_name || '').trim();
        if (pRole === 'promoter' && promoterBrand && promoterBrand.toLowerCase() !== pName.toLowerCase()) {
          addResult({
            id: `promoter-${p.id || promoterBrand}`,
            tagType: 'promoter',
            name: promoterBrand,
            handle: promoterBrand.toLowerCase().replace(/[^a-z0-9]/g, ''),
            avatar: p.promoter_metadata?.logo_url || p.avatar_url || '',
            subtitle: `🎪 Promoter / Venue${pCity ? ` • ${pCity}` : ''}`
          });
        }

        // Scene Member
        addResult({
          id: `user-${p.id || pName}`,
          tagType: pRole === 'promoter' ? 'promoter' : pRole === 'creative' ? 'creative' : pRole === 'label' ? 'label' : 'user',
          name: pName,
          handle: pHandle || pName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          avatar: p.avatar_url || p.profile_avatar || p.avatar || '',
          subtitle: `👤 ${pRole === 'promoter' ? 'Promoter' : pRole === 'creative' ? 'Creative' : pRole === 'label' ? 'Record Label' : 'Scene Member'}${pCity ? ` • ${pCity}` : ''}`
        });
      }
    });
  } catch (err) {
    console.warn('[mentionSearchService] Error querying profiles:', err);
  }

  // 3. Merge Core Fallbacks if query matches or if results are still sparse
  CORE_FALLBACK_ENTITIES.forEach((item) => {
    if (!cleanQ || item.name.toLowerCase().includes(cleanQ) || item.handle.toLowerCase().includes(cleanQ)) {
      addResult(item);
    }
  });

  // Limit to top 8 suggestions for clean keyboard navigation and UI compactness
  return results.slice(0, 8);
}
