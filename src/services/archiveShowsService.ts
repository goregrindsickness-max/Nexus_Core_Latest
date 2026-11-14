import { getSupabase } from './clientService';
import { executeWithSchemaResilience } from './schemaResilienceService';
import { uploadArchiveFlyer } from './storageService';

export interface ArchiveShowItem {
  id: string;
  user_id?: string;
  promoter_id?: string;
  band_id?: string;
  year: number;
  title: string;
  type: 'festival' | 'tour' | 'club_gig' | 'anniversary';
  date: string;
  venue: string;
  venueAddress?: string;
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

// Static festival archive catalog removed from client bundle (moved to server/seeds/seedCatalogsData.ts)
export const CANONICAL_DOMINATION_FEST_ARCHIVES: ArchiveShowItem[] = [];

const LOCAL_STORAGE_CUSTOM_KEY = 'nexus_promoter_custom_archives';
const LOCAL_STORAGE_OVERRIDES_KEY = 'nexus_promoter_archive_overrides';
const LOCAL_STORAGE_DELETED_KEY = 'nexus_promoter_deleted_archives';
const LOCAL_STORAGE_ALL_KEY = 'nexus_promoter_archive_shows_db_cache';

export function parseVenueAndAddress(s: any): { venueName: string; venueAddress: string } {
  const candidateName = (s.venue_name || s.venue || s.venueName || '').trim();
  const candidateAddress = (s.venue_address || s.address || s.location || '').trim();

  const isStreetAddress = (str: string) => /^\d+\s+[A-Za-z0-9]/.test(str);

  let venueName = candidateName;
  let venueAddress = candidateAddress;

  if (candidateName && isStreetAddress(candidateName)) {
    if (s.venue_name && !isStreetAddress(s.venue_name)) {
      venueName = s.venue_name.trim();
      venueAddress = candidateName;
    } else if (candidateAddress && !isStreetAddress(candidateAddress)) {
      venueName = candidateAddress;
      venueAddress = candidateName;
    } else {
      venueName = candidateName;
      venueAddress = candidateName;
    }
  } else if (!candidateName && candidateAddress) {
    venueName = candidateAddress;
    venueAddress = candidateAddress;
  }

  if (!venueName) {
    venueName = 'Underground Venue';
  }

  if (venueAddress === venueName) {
    venueAddress = '';
  }

  return { venueName, venueAddress };
}

export function classifyEventType(item: any): 'festival' | 'tour' | 'club_gig' {
  const typeStr = String(item.type || item.show_type || '').toLowerCase();
  const titleStr = String(item.title || item.name || item.show_name || '').toLowerCase();
  const festName = String(item.festival_name || item.festivalName || '').toLowerCase();
  const tourName = String(item.tour_name || item.tourName || '').toLowerCase();
  const notesStr = String(item.description || item.additional_notes || item.historicalNotes || item.notes || '').toLowerCase();

  if (
    typeStr === 'festival' || 
    typeStr === 'anniversary' || 
    festName || 
    titleStr.includes('fest') || 
    titleStr.includes('festival') ||
    notesStr.includes('festival') ||
    item.is_festival === true
  ) {
    return 'festival';
  }

  if (
    typeStr === 'tour' || 
    typeStr === 'tour date' || 
    tourName || 
    titleStr.includes('tour') || 
    notesStr.includes('tour') || 
    notesStr.includes('vader') ||
    item.tour_id ||
    item.is_tour === true
  ) {
    return 'tour';
  }

  if (typeStr === 'club_gig' || typeStr === 'gig' || typeStr === 'club') {
    return 'club_gig';
  }

  return 'tour';
}

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

  const { venueName, venueAddress } = parseVenueAndAddress(row);
  const evType = classifyEventType(row);

  return {
    id: String(row.id || `arch_${Date.now()}`),
    user_id: row.user_id,
    promoter_id: row.promoter_id,
    year: typeof row.year === 'number' ? row.year : parseInt(row.year, 10) || 2024,
    title: row.title || row.name || 'Historic Show',
    type: evType as any,
    date: row.date || row.show_date || 'Past Event',
    venue: venueName,
    venueAddress: venueAddress,
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

    // Automatically import past shows from the public.shows table (dates prior to today)
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: pastShowsData } = await supabase
        .from('shows')
        .select('*');

      if (pastShowsData && Array.isArray(pastShowsData)) {
        const pastFromShowsTable: ArchiveShowItem[] = pastShowsData
          .filter(s => {
            const sDate = s.date || s.show_date;
            const isPast = sDate && String(sDate).split('T')[0] < todayStr;
            const isArchived = s.additional_notes && String(s.additional_notes).includes('"archived":true');
            const isStatusConcluded = s.status === 'Concluded' || s.status === 'Archived' || s.status === 'Completed';
            return isPast || isArchived || isStatusConcluded;
          })
          .map(s => {
            const rawDate = s.date || s.show_date || '';
            const dateParts = String(rawDate).split('-');
            const y = dateParts[0] ? parseInt(dateParts[0], 10) : 2026;
            
            let formattedDate = 'Past Event';
            if (dateParts.length === 3) {
              try {
                const d = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
                formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
              } catch (_) {
                formattedDate = String(rawDate);
              }
            }

            const support = Array.isArray(s.support_lineup)
              ? s.support_lineup.map((x: any) => typeof x === 'string' ? x : (x.name || x.band)).filter(Boolean)
              : (typeof s.support_lineup === 'string' ? s.support_lineup.split(',').map((x: string) => x.trim()).filter(Boolean) : []);

            const extraLineup = Array.isArray(s.lineup)
              ? s.lineup.map((x: any) => typeof x === 'string' ? x : (x.name || x.band)).filter(Boolean)
              : (typeof s.lineup === 'string' ? s.lineup.split(',').map((x: string) => x.trim()).filter(Boolean) : []);

            const combinedLineup = Array.from(new Set([s.headliner || s.name, ...support, ...extraLineup])).filter(Boolean);

            const { venueName, venueAddress } = parseVenueAndAddress(s);
            const evType = classifyEventType(s);

            return {
              id: s.id,
              user_id: s.creator_id || userId,
              promoter_id: s.promoter_id || s.creator_id || userId,
              band_id: s.band_id,
              year: isNaN(y) ? 2026 : y,
              title: s.tour_name
                ? `${s.tour_name} - ${venueName || s.city || 'Live'}`
                : (s.show_name 
                    ? `${s.headliner || s.name || 'Artist'} - ${s.show_name}`
                    : (s.festival_name || `${s.headliner || 'Live'} at ${venueName || 'Venue'}`)),
              type: evType as any,
              date: formattedDate,
              venue: venueName,
              venueAddress: venueAddress,
              city: s.city ? (s.state_province ? `${s.city}, ${s.state_province}` : s.city) : 'Haltom City, TX',
              lineup: combinedLineup,
              attendance: s.expected_attendance ? `${s.expected_attendance} Capacity` : 'Full House',
              milestone: '⚡ Completed Live Performance',
              historicalNotes: typeof s.additional_notes === 'string' ? s.additional_notes : (s.additional_notes ? JSON.stringify(s.additional_notes) : `Official headline show at ${s.venue || 'venue'}.`),
              flyerUrl: s.flyer_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
              photoCount: 24,
              is_deleted: false
            };
          });

        if (pastFromShowsTable.length > 0) {
          tableQuerySuccess = true;
          dbShows = [...dbShows, ...pastFromShowsTable];
        }
      }
    } catch (e) {
      console.warn('[ARCHIVE-SHOWS-SERVICE] Could not query past shows from shows table:', e);
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
      if (Array.isArray(parsed)) {
        // Exclude community shows (like Vader) that were temporarily stored
        localCustom = parsed.filter(item => item.id !== '5c8a0bc3-aff4-491f-9693-d3ca3ed406ee' && !item.title?.toLowerCase().includes('vader'));
      }
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
