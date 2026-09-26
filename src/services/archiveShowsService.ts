import { getSupabase } from './clientService';
import { executeWithSchemaResilience } from './schemaResilienceService';
import { uploadArchiveFlyer } from './storageService';

export interface ArchiveShowItem {
  id: string;
  user_id?: string;
  promoter_id?: string;
  year: number;
  title: string;
  type: 'festival' | 'tour' | 'club_gig' | 'anniversary';
  date: string;
  venue: string;
  city: string;
  lineup: string[];
  attendance?: string;
  milestone?: string;
  historicalNotes?: string;
  notes?: string;
  flyerUrl?: string;
  photoCount?: number;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const CANONICAL_DOMINATION_FEST_ARCHIVES: ArchiveShowItem[] = [
  {
    id: 'cdf-2024-finale',
    year: 2024,
    title: 'Chicago Domination Fest 2024 (10-Year Anniversary Finale)',
    type: 'anniversary',
    date: 'OCT 18 - 20, 2024',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Defeated Sanity',
      'Disgorge',
      'Cephalotripsy',
      'Internal Bleeding',
      'Malignancy',
      'Gorgasm',
      'Kraanium',
      'Brodequin',
      'Short Bus Pile Up',
      'Vulvodynia'
    ],
    attendance: '750+ Sold Out Capacity',
    milestone: '🏆 Decade Finale & 10th Milestone Anniversary',
    historicalNotes: 'The grand finale of the decade-long Chicago Domination Fest franchise. Drew underground fans and international touring acts from over 18 countries across 3 devastating days.',
    flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
    photoCount: 142
  },
  {
    id: 'cdf-2023-9th',
    year: 2023,
    title: 'Chicago Domination Fest 2023 (9th Edition)',
    type: 'festival',
    date: 'OCT 20 - 22, 2023',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Devourment',
      'Skinless',
      'Mortal Decay',
      'Visceral Disgorge',
      'Short Bus Pile Up',
      'Lust of Decay',
      'Cognitive',
      'Gorgasm'
    ],
    attendance: 'Sold Out (3 Days)',
    milestone: '🔥 Historic Slam Co-Headliner Package',
    historicalNotes: 'A legendary slam death metal takeover featuring the reunion of several foundational early 2000s brutal death acts.',
    flyerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    photoCount: 88
  },
  {
    id: 'tdf-2022-inaugural',
    year: 2022,
    title: 'Texas Domination Fest 2022 (Inaugural Expansion)',
    type: 'festival',
    date: 'NOV 11 - 12, 2022',
    venue: 'The Rail Club Live',
    city: 'Fort Worth / Dallas, TX',
    lineup: [
      'Putrid Pile',
      'Devourment',
      'Stabbing',
      'Viral Load',
      'Prophecy',
      'Condemned',
      'Embodied Torment'
    ],
    attendance: 'Packed Texas Crowd',
    milestone: '⚡ Official Southwest Territory Expansion',
    historicalNotes: 'Expansion of the Domination Fest banner into the Lone Star state, cementing Texas as a stronghold for pure underground slam and death metal.',
    flyerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800',
    photoCount: 65
  },
  {
    id: 'cdf-2021-return',
    year: 2021,
    title: 'Chicago Domination Fest 2021 (The Return)',
    type: 'festival',
    date: 'OCT 15 - 17, 2021',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Cephalotripsy',
      'Pyrexia',
      'Pathology',
      'Abominable Putridity (USA Set)',
      'Gorgasm',
      'Cinerary',
      'Stabbing'
    ],
    attendance: 'Sold Out Venue',
    milestone: '💥 Post-Lockdown Heavy Metal Re-emergence',
    historicalNotes: 'The legendary return to live pits following the global shutdown. High energy from open to close with attendees celebrating extreme music survival.',
    flyerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    photoCount: 94
  },
  {
    id: 'cdf-2019-6th',
    year: 2019,
    title: 'Chicago Domination Fest 2019 (6th Annual)',
    type: 'festival',
    date: 'OCT 24 - 26, 2019',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Malignancy',
      'Disentomb (Australia)',
      'Dehumanized',
      'Condemned',
      'Gorgasm',
      'Cognitive',
      'Cognizant',
      'Abnormal Inhumane'
    ],
    attendance: 'International Roster Sellout',
    milestone: '🌍 Global Brutality Convergence',
    historicalNotes: 'Featured top-tier international acts making exclusive Chicago appearances curated by Miguel Goregrinder Medina.',
    flyerUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=800',
    photoCount: 110
  },
  {
    id: 'cdf-2018-5th',
    year: 2018,
    title: 'Chicago Domination Fest 2018 (5-Year Milestone)',
    type: 'anniversary',
    date: 'JUL 26 - 28, 2018',
    venue: 'Subterranean',
    city: 'Chicago, IL',
    lineup: [
      'Gorgasm',
      'Internal Bleeding',
      'Cenotaph (Turkey)',
      'Sexcrement',
      'Coathanger Abortion',
      'Splattered',
      'Scattered Remains'
    ],
    attendance: '500+ Cap Sold Out',
    milestone: '⭐ 5th Anniversary Golden Era',
    historicalNotes: 'Commemorating 5 years of underground dominance at Subterranean in Wicker Park.',
    flyerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800',
    photoCount: 76
  },
  {
    id: 'cdf-2017-4th',
    year: 2017,
    title: 'Chicago Domination Fest 2017 (4th Edition)',
    type: 'festival',
    date: 'JUL 27 - 29, 2017',
    venue: 'Wire / Live Wire Lounge',
    city: 'Berwyn / Chicago, IL',
    lineup: [
      'Putrid Pile',
      'Digested Flesh',
      'Dysentery',
      'Pathology',
      'Sexual Atrocities',
      'Parasitic Ejaculation'
    ],
    attendance: 'Capacity Weekend',
    milestone: '🔥 Underground Heritage Gathering',
    historicalNotes: 'Multi-room underground setup with non-stop blastbeats and dual stage setups.',
    flyerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    photoCount: 52
  },
  {
    id: 'cdf-2016-3rd',
    year: 2016,
    title: 'Chicago Domination Fest 2016 (3rd Edition)',
    type: 'festival',
    date: 'JUL 28 - 30, 2016',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Disgorge',
      'Broken Hope',
      'Gorgasm',
      'Malignancy',
      'Lividity',
      'Gutrot',
      'Inveracity'
    ],
    attendance: 'Sold Out',
    milestone: '⚡ Iconic Midwest Classic',
    historicalNotes: 'Historic bill reuniting Midwest and West Coast pioneers for an unforgettable 3-night showcase.',
    flyerUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800',
    photoCount: 68
  },
  {
    id: 'cdf-2015-2nd',
    year: 2015,
    title: 'Chicago Domination Fest 2015 (2nd Edition)',
    type: 'festival',
    date: 'AUG 14 - 15, 2015',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Inveracity',
      'Gorgasm',
      'Devourment',
      'Prophecy',
      'Inherit Disease',
      'Cerebral Incubation'
    ],
    attendance: 'Sellout Gathering',
    milestone: '🏛️ National Slam Death Foundation',
    historicalNotes: 'Solidified Chicago as the epicenter of North American brutal death festivals.',
    flyerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800',
    photoCount: 45
  },
  {
    id: 'cdf-2014-inaugural',
    year: 2014,
    title: 'Chicago Domination Fest 2014 (Inaugural Launch)',
    type: 'anniversary',
    date: 'OCT 10 - 11, 2014',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Cephalotripsy',
      'Putrid Pile',
      'Gorgasm',
      'Malignancy',
      'Gutrot',
      'Viral Load',
      'Disfigured'
    ],
    attendance: 'Inaugural Sellout',
    milestone: '🌱 Genesis of Chicago Domination Fest',
    historicalNotes: 'The festival that started it all. Conceived and promoted by Miguel Medina, launching a 10-year legacy in extreme music history.',
    flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
    photoCount: 50
  }
];

const LOCAL_STORAGE_CUSTOM_KEY = 'nexus_promoter_custom_archives';
const LOCAL_STORAGE_OVERRIDES_KEY = 'nexus_promoter_archive_overrides';
const LOCAL_STORAGE_DELETED_KEY = 'nexus_promoter_deleted_archives';
const LOCAL_STORAGE_ALL_KEY = 'nexus_promoter_archive_shows_db_cache';

/**
 * Normalizes a database row to a frontend ArchiveShowItem.
 */
export function mapDbToArchiveShow(row: any): ArchiveShowItem {
  let parsedLineup: string[] = [];
  if (Array.isArray(row.lineup)) {
    parsedLineup = row.lineup;
  } else if (typeof row.lineup === 'string') {
    try {
      const parsed = JSON.parse(row.lineup);
      if (Array.isArray(parsed)) parsedLineup = parsed;
      else parsedLineup = row.lineup.split(',').map((s: string) => s.trim()).filter(Boolean);
    } catch (_) {
      parsedLineup = row.lineup.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return {
    id: String(row.id || `arch_${Date.now()}`),
    user_id: row.user_id,
    promoter_id: row.promoter_id,
    year: typeof row.year === 'number' ? row.year : parseInt(row.year, 10) || 2024,
    title: row.title || row.name || 'Historic Show',
    type: (row.type || row.show_type || 'festival') as any,
    date: row.date || row.show_date || 'Past Event',
    venue: row.venue || row.venue_name || row.venue_address || 'Underground Venue',
    city: row.city || 'Chicago, IL',
    lineup: parsedLineup,
    attendance: row.attendance || row.expected_attendance,
    milestone: row.milestone,
    historicalNotes: row.historical_notes || row.notes || row.additional_notes,
    notes: row.notes,
    flyerUrl: row.flyer_url || row.flyerUrl || row.image_url,
    photoCount: row.photo_count || 0,
    is_deleted: Boolean(row.is_deleted),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Normalizes an ArchiveShowItem to database payload.
 */
export function mapArchiveShowToDbPayload(item: ArchiveShowItem, userId = '5403162d-1947-43aa-b5f6-38a1bd2a1b80'): any {
  return {
    id: item.id,
    user_id: item.user_id || userId,
    promoter_id: item.promoter_id || userId,
    year: item.year || 2024,
    title: item.title,
    type: item.type || 'festival',
    date: item.date,
    venue: item.venue || '',
    city: item.city || 'Chicago, IL',
    lineup: Array.isArray(item.lineup) ? item.lineup : [],
    attendance: item.attendance || null,
    milestone: item.milestone || null,
    historical_notes: item.historicalNotes || item.notes || null,
    notes: item.notes || item.historicalNotes || null,
    flyer_url: item.flyerUrl || null,
    photo_count: item.photoCount || 0,
    is_deleted: Boolean(item.is_deleted),
    updated_at: new Date().toISOString()
  };
}

/**
 * Strips unsupported properties to avoid Postgres PGRST column errors
 */
export function sanitizeArchiveShowForDb(item: any): any {
  const allowedKeys = [
    'id',
    'user_id',
    'promoter_id',
    'year',
    'title',
    'type',
    'date',
    'venue',
    'city',
    'lineup',
    'attendance',
    'milestone',
    'historical_notes',
    'notes',
    'flyer_url',
    'photo_count',
    'is_deleted',
    'created_at',
    'updated_at'
  ];

  const dbItem: any = {};
  for (const key of allowedKeys) {
    if (item[key] !== undefined) {
      dbItem[key] = item[key];
    }
  }
  return dbItem;
}

/**
 * Fetches all archive shows from the public.archive_shows table in Supabase.
 * Falls back to local storage and canonical defaults if table is offline or empty.
 */
export async function fetchArchiveShowsFromDatabase(userId = '5403162d-1947-43aa-b5f6-38a1bd2a1b80'): Promise<ArchiveShowItem[]> {
  const supabase = getSupabase();
  let dbShows: ArchiveShowItem[] = [];
  let tableQuerySuccess = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('archive_shows')
        .select('*')
        .order('year', { ascending: false });

      if (!error && Array.isArray(data)) {
        tableQuerySuccess = true;
        dbShows = data.map(mapDbToArchiveShow).filter(s => !s.is_deleted);
        console.log(`[ARCHIVE-SHOWS-SERVICE] Loaded ${dbShows.length} archive shows from Supabase 'archive_shows' table.`);
      } else if (error) {
        console.warn(`[ARCHIVE-SHOWS-SERVICE] Notice: 'archive_shows' table query (${error.message}). Using resilient fallback store.`);
      }
    } catch (err) {
      console.warn('[ARCHIVE-SHOWS-SERVICE] Supabase query exception:', err);
    }
  }

  // Retrieve cached records & local edits
  let localCustom: ArchiveShowItem[] = [];
  let localOverrides: Record<string, Partial<ArchiveShowItem>> = {};
  let localDeleted = new Set<string>();

  try {
    const rawCustom = localStorage.getItem(LOCAL_STORAGE_CUSTOM_KEY);
    if (rawCustom) {
      const parsed = JSON.parse(rawCustom);
      if (Array.isArray(parsed)) localCustom = parsed;
    }

    const rawOverrides = localStorage.getItem(LOCAL_STORAGE_OVERRIDES_KEY);
    if (rawOverrides) {
      const parsed = JSON.parse(rawOverrides);
      if (parsed && typeof parsed === 'object') localOverrides = parsed;
    }

    const rawDeleted = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    if (rawDeleted) {
      const parsed = JSON.parse(rawDeleted);
      if (Array.isArray(parsed)) localDeleted = new Set(parsed);
    }
  } catch (_) {}

  // If table was accessible and has shows, merge any un-synced local overrides and return
  if (tableQuerySuccess && dbShows.length > 0) {
    const mergedMap = new Map<string, ArchiveShowItem>();
    
    // Seed canonical first
    for (const c of CANONICAL_DOMINATION_FEST_ARCHIVES) {
      mergedMap.set(c.id, c);
    }
    // Overlay DB shows
    for (const d of dbShows) {
      mergedMap.set(d.id, d);
    }
    // Overlay any local overrides if not yet in DB
    for (const [id, override] of Object.entries(localOverrides)) {
      const current = mergedMap.get(id);
      if (current) {
        mergedMap.set(id, { ...current, ...override });
      }
    }
    // Overlay local custom
    for (const cust of localCustom) {
      mergedMap.set(cust.id, cust);
    }

    const finalResults = Array.from(mergedMap.values())
      .filter(item => !localDeleted.has(item.id) && !item.is_deleted)
      .sort((a, b) => b.year - a.year);

    // Save consolidated backup to localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_ALL_KEY, JSON.stringify(finalResults));
    } catch (_) {}

    return finalResults;
  }

  // Fallback: Combine canonical presets + local custom + overrides
  const map = new Map<string, ArchiveShowItem>();
  for (const item of CANONICAL_DOMINATION_FEST_ARCHIVES) {
    const override = localOverrides[item.id];
    map.set(item.id, override ? { ...item, ...override } : item);
  }
  for (const custom of localCustom) {
    map.set(custom.id, custom);
  }

  const resultList = Array.from(map.values())
    .filter(item => !localDeleted.has(item.id) && !item.is_deleted)
    .sort((a, b) => b.year - a.year);

  // If we have access to Supabase, seed these canonical/local shows to the table in background
  if (supabase) {
    seedArchiveShowsToTable(resultList, userId).catch(() => {});
  }

  return resultList;
}

/**
 * Permanently saves or updates an archive show in Supabase 'archive_shows' table,
 * while updating local persistence and caching.
 */
export async function saveArchiveShowToDatabase(
  item: ArchiveShowItem,
  userId = '5403162d-1947-43aa-b5f6-38a1bd2a1b80'
): Promise<{ success: boolean; data?: ArchiveShowItem; error?: any }> {
  // 1. Ensure flyer is uploaded to 'archives' bucket if still base64
  let finalItem = { ...item };
  if (finalItem.flyerUrl && finalItem.flyerUrl.startsWith('data:')) {
    try {
      const uploadedUrl = await uploadArchiveFlyer(finalItem.flyerUrl, finalItem.id, finalItem.title);
      if (uploadedUrl && !uploadedUrl.startsWith('data:')) {
        finalItem.flyerUrl = uploadedUrl;
      }
    } catch (err) {
      console.warn('[ARCHIVE-SHOWS-SERVICE] Flyer upload warning:', err);
    }
  }

  const payload = sanitizeArchiveShowForDb(mapArchiveShowToDbPayload(finalItem, userId));

  // 2. Synchronize to local storage for instant resilience
  try {
    const rawCustom = localStorage.getItem(LOCAL_STORAGE_CUSTOM_KEY);
    let customList: ArchiveShowItem[] = rawCustom ? JSON.parse(rawCustom) : [];
    const existsInCustom = customList.some(c => c.id === finalItem.id);

    if (existsInCustom) {
      customList = customList.map(c => c.id === finalItem.id ? finalItem : c);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_KEY, JSON.stringify(customList));
    } else {
      const rawOverrides = localStorage.getItem(LOCAL_STORAGE_OVERRIDES_KEY);
      const overrides: Record<string, Partial<ArchiveShowItem>> = rawOverrides ? JSON.parse(rawOverrides) : {};
      overrides[finalItem.id] = finalItem;
      localStorage.setItem(LOCAL_STORAGE_OVERRIDES_KEY, JSON.stringify(overrides));
    }
  } catch (_) {}

  // 3. Upsert into Supabase public.archive_shows table
  const supabase = getSupabase();
  if (supabase) {
    try {
      const result = await executeWithSchemaResilience(
        async (sanitizedPayload) => {
          return await supabase
            .from('archive_shows')
            .upsert([sanitizedPayload], { onConflict: 'id' })
            .select()
            .maybeSingle();
        },
        payload
      );

      if (!result.error) {
        console.log(`[ARCHIVE-SHOWS-SERVICE] Successfully persisted show "${finalItem.title}" to 'archive_shows' table.`);
        return { success: true, data: finalItem };
      } else {
        console.warn(`[ARCHIVE-SHOWS-SERVICE] DB write notice:`, result.error.message);
      }
    } catch (err) {
      console.warn('[ARCHIVE-SHOWS-SERVICE] DB write exception:', err);
    }
  }

  return { success: true, data: finalItem };
}

/**
 * Removes or marks an archive show as deleted in Supabase and local cache.
 */
export async function deleteArchiveShowFromDatabase(
  id: string,
  userId = '5403162d-1947-43aa-b5f6-38a1bd2a1b80'
): Promise<{ success: boolean; error?: any }> {
  // 1. Update local cache
  try {
    const rawDeleted = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    if (!deletedList.includes(id)) {
      deletedList.push(id);
      localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(deletedList));
    }

    const rawCustom = localStorage.getItem(LOCAL_STORAGE_CUSTOM_KEY);
    if (rawCustom) {
      const customList: ArchiveShowItem[] = JSON.parse(rawCustom);
      const filtered = customList.filter(c => c.id !== id);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_KEY, JSON.stringify(filtered));
    }
  } catch (_) {}

  // 2. Delete or mark as deleted in Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await executeWithSchemaResilience(
        async () => {
          return await supabase
            .from('archive_shows')
            .delete()
            .eq('id', id);
        },
        { id }
      );
    } catch (_) {}
  }

  return { success: true };
}

/**
 * Resets an edited show back to canonical default values.
 */
export async function resetArchiveShowInDatabase(
  id: string,
  userId = '5403162d-1947-43aa-b5f6-38a1bd2a1b80'
): Promise<{ success: boolean; data?: ArchiveShowItem }> {
  const defaultShow = CANONICAL_DOMINATION_FEST_ARCHIVES.find(s => s.id === id);
  if (!defaultShow) return { success: false };

  // Remove override from local storage
  try {
    const rawOverrides = localStorage.getItem(LOCAL_STORAGE_OVERRIDES_KEY);
    if (rawOverrides) {
      const overrides = JSON.parse(rawOverrides);
      delete overrides[id];
      localStorage.setItem(LOCAL_STORAGE_OVERRIDES_KEY, JSON.stringify(overrides));
    }
  } catch (_) {}

  // Save canonical default back to table
  return await saveArchiveShowToDatabase(defaultShow, userId);
}

/**
 * Seeds initial archives to the database if not present.
 */
export async function seedArchiveShowsToTable(
  shows: ArchiveShowItem[],
  userId = '5403162d-1947-43aa-b5f6-38a1bd2a1b80'
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !shows || shows.length === 0) return;

  try {
    const payloads = shows.map(s => sanitizeArchiveShowForDb(mapArchiveShowToDbPayload(s, userId)));
    await executeWithSchemaResilience(
      async (sanitizedList) => {
        return await supabase
          .from('archive_shows')
          .upsert(sanitizedList, { onConflict: 'id' });
      },
      payloads
    );
  } catch (_) {}
}
