import { getSupabase } from '../supabase';
import { communityBandManager } from '../lib/communityBands';

export type EntityCategory =
  | 'festival'
  | 'label_distro'
  | 'booking_agency'
  | 'media_press'
  | 'band'
  | 'venue';

export type EntityMemberRole = 'owner' | 'admin' | 'editor';

export type FestivalEditionStatus = 'draft' | 'announced' | 'sold_out' | 'completed';

export type BillingTier =
  | 'headliner'
  | 'co_headliner'
  | 'main_support'
  | 'support'
  | 'opener';

export interface NetworkEntity {
  id: string;
  slug: string;
  display_name: string;
  category: EntityCategory;
  avatar_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  location?: string | null;
  external_links?: {
    website?: string;
    instagram?: string;
    bandcamp?: string;
    facebook?: string;
    youtube?: string;
    tickets?: string;
    [key: string]: string | undefined;
  };
  owner_id?: string | null;
  created_at: string;
}

export interface EntityMember {
  entity_id: string;
  user_id: string;
  role: EntityMemberRole;
  user_name?: string;
  user_handle?: string;
  user_avatar?: string;
}

export interface FestivalEdition {
  id: string;
  entity_id: string;
  edition_name: string;
  start_date: string;
  end_date: string;
  venue_name?: string | null;
  city: string;
  state?: string | null;
  ticket_url?: string | null;
  flyer_url?: string | null;
  status: FestivalEditionStatus;
  created_at: string;
}

export interface FestivalLineupItem {
  id: string;
  edition_id: string;
  band_entity_id?: string | null;
  custom_band_name?: string | null;
  custom_external_url?: string | null;
  billing_tier: BillingTier;
  sort_order: number;
  day_number: number;
  stage_name?: string | null;
  performance_date?: string | null;
  set_time?: string | null;
  created_at: string;
  // Hydrated client metadata for fast rendering
  resolved_band_name?: string;
  resolved_band_logo?: string;
  resolved_band_genre?: string;
  resolved_band_location?: string;
  is_platform_band?: boolean;
}

export interface PlatformBandCandidate {
  id: string;
  name: string;
  genre: string;
  location: string;
  logo_url: string;
  banner_url?: string;
  slug: string;
  is_registered: boolean;
  rawBand?: any;
}

const STORAGE_KEYS = {
  ENTITIES: 'nexus_network_entities_v1',
  MEMBERS: 'nexus_entity_members_v1',
  EDITIONS: 'nexus_festival_editions_v1',
  LINEUP_ITEMS: 'nexus_festival_lineup_items_v1',
  PROMOTER_LINKS: 'nexus_promoter_workspace_entity_links_v1',
};

export const ENTITY_CATEGORY_META: Record<
  EntityCategory,
  {
    label: string;
    shortLabel: string;
    icon: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    accentHex: string;
    description: string;
  }
> = {
  festival: {
    label: 'Festival / Annual Gathering',
    shortLabel: 'Festival',
    icon: '🎪',
    badgeBg: 'bg-amber-950/70',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    accentHex: '#f59e0b',
    description: 'Multi-band festivals, annual extreme metal gatherings, and weekenders with interactive tiered billing.',
  },
  label_distro: {
    label: 'Record Label / Distro',
    shortLabel: 'Label / Distro',
    icon: '💿',
    badgeBg: 'bg-orange-950/70',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/40',
    accentHex: '#f97316',
    description: 'Independent record labels, underground tape/vinyl distros, and mailorder collectives.',
  },
  booking_agency: {
    label: 'Booking Collective / Agency',
    shortLabel: 'Booking Agency',
    icon: '🧭',
    badgeBg: 'bg-emerald-950/70',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    accentHex: '#10b981',
    description: 'Tour routing collectives, independent booking agents, and regional DIY show promoters.',
  },
  media_press: {
    label: 'Media / Zine / Press',
    shortLabel: 'Media / Press',
    icon: '📡',
    badgeBg: 'bg-cyan-950/70',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    accentHex: '#06b6d4',
    description: 'Underground webzines, podcast networks, live bootleg videographers, and scene radio press.',
  },
  band: {
    label: 'Band / Musical Project',
    shortLabel: 'Band',
    icon: '🎸',
    badgeBg: 'bg-rose-950/70',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/40',
    accentHex: '#f43f5e',
    description: 'Public artist entity for tagging in festival lineups and cross-network releases.',
  },
  venue: {
    label: 'Venue / DIY Space',
    shortLabel: 'Venue',
    icon: '🏟️',
    badgeBg: 'bg-yellow-950/70',
    badgeText: 'text-yellow-300',
    badgeBorder: 'border-yellow-500/40',
    accentHex: '#eab308',
    description: 'Clubs, halls, VFW spaces, and underground performance spots.',
  },
};

export const BILLING_TIER_META: Record<
  BillingTier,
  {
    label: string;
    order: number;
    badgeClass: string;
    textClass: string;
  }
> = {
  headliner: {
    label: 'Headliner',
    order: 1,
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    textClass: 'text-xl sm:text-2xl font-black tracking-tight text-white uppercase',
  },
  co_headliner: {
    label: 'Co-Headliner',
    order: 2,
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    textClass: 'text-base sm:text-lg font-extrabold tracking-wide text-amber-100 uppercase',
  },
  main_support: {
    label: 'Main Support',
    order: 3,
    badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/50',
    textClass: 'text-sm sm:text-base font-bold tracking-wide text-zinc-100 uppercase',
  },
  support: {
    label: 'Support',
    order: 4,
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    textClass: 'text-xs sm:text-sm font-bold tracking-wider text-zinc-300 uppercase',
  },
  opener: {
    label: 'Opener / Early Slot',
    order: 5,
    badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    textClass: 'text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase',
  },
};

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function slugifyEntityName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `entity-${Date.now().toString(36)}`;
}

const DEFAULT_SEED_ENTITIES: NetworkEntity[] = [];

const DEFAULT_SEED_EDITIONS: FestivalEdition[] = [];

const DEFAULT_SEED_LINEUP_ITEMS: FestivalLineupItem[] = [];

const SEED_PURGED_KEY = 'nexus_sample_entities_purged_v3';
const DEMO_SEED_IDS = new Set([
  'e1111111-1111-4111-8111-111111111111',
  'e2222222-2222-4222-8222-222222222222',
  'e3333333-3333-4333-8333-333333333333'
]);

function purgeSampleSeedEntities(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!localStorage.getItem(SEED_PURGED_KEY)) {
      const rawEntities = localStorage.getItem(STORAGE_KEYS.ENTITIES);
      if (rawEntities) {
        const parsed = JSON.parse(rawEntities);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((e: any) => 
            !DEMO_SEED_IDS.has(e.id) && 
            e.slug !== 'chicago-domination-fest' && 
            e.slug !== 'brutal-mind-distro' && 
            e.slug !== 'necrotic-booking-collective'
          );
          localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(filtered));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify([]));
      }

      const rawEditions = localStorage.getItem(STORAGE_KEYS.EDITIONS);
      if (rawEditions) {
        const parsed = JSON.parse(rawEditions);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((ed: any) => ed.id !== 'f1111111-1111-4111-8111-111111111111' && !DEMO_SEED_IDS.has(ed.entity_id));
          localStorage.setItem(STORAGE_KEYS.EDITIONS, JSON.stringify(filtered));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.EDITIONS, JSON.stringify([]));
      }

      const rawLineup = localStorage.getItem(STORAGE_KEYS.LINEUP_ITEMS);
      if (rawLineup) {
        const parsed = JSON.parse(rawLineup);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item: any) => item.edition_id !== 'f1111111-1111-4111-8111-111111111111');
          localStorage.setItem(STORAGE_KEYS.LINEUP_ITEMS, JSON.stringify(filtered));
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.LINEUP_ITEMS, JSON.stringify([]));
      }

      localStorage.setItem(SEED_PURGED_KEY, 'true');
    }
  } catch (e) {
    console.warn('[networkEntitiesService] Error purging sample seed entities:', e);
  }
}

function readLocalList<T>(key: string, defaultList: T[]): T[] {
  if (typeof window === 'undefined') return defaultList;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultList));
      return defaultList;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultList;
    // Ensure default seed items are present if none exist
    if (parsed.length === 0 && defaultList.length > 0) {
      localStorage.setItem(key, JSON.stringify(defaultList));
      return defaultList;
    }
    return parsed;
  } catch {
    return defaultList;
  }
}

function writeLocalList<T>(key: string, list: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn(`[networkEntitiesService] Failed to write ${key}:`, e);
  }
}

export function broadcastEntitiesUpdated(detail?: any): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('nexus_entities_updated', { detail }));
}

export function getLocalNetworkEntities(): NetworkEntity[] {
  purgeSampleSeedEntities();
  return readLocalList<NetworkEntity>(STORAGE_KEYS.ENTITIES, DEFAULT_SEED_ENTITIES);
}

export function getLocalEntityMembers(): EntityMember[] {
  purgeSampleSeedEntities();
  const defaultMembers: EntityMember[] = DEFAULT_SEED_ENTITIES.map((e) => ({
    entity_id: e.id,
    user_id: e.owner_id || '5403162d-1947-43aa-b5f6-38a1bd2a1b80',
    role: 'owner',
  }));
  return readLocalList<EntityMember>(STORAGE_KEYS.MEMBERS, defaultMembers);
}

export function getLocalFestivalEditions(): FestivalEdition[] {
  purgeSampleSeedEntities();
  return readLocalList<FestivalEdition>(STORAGE_KEYS.EDITIONS, DEFAULT_SEED_EDITIONS);
}

export function getLocalFestivalLineupItems(): FestivalLineupItem[] {
  purgeSampleSeedEntities();
  return readLocalList<FestivalLineupItem>(STORAGE_KEYS.LINEUP_ITEMS, DEFAULT_SEED_LINEUP_ITEMS);
}

/**
 * Returns all entities where the given user is owner or in entity_members.
 * In demo/local sessions, also returns entities created in this browser session.
 */
export function getUserManagedEntities(userId?: string | null): NetworkEntity[] {
  purgeSampleSeedEntities();
  const allEntities = getLocalNetworkEntities();
  const members = getLocalEntityMembers();

  if (!userId) {
    return allEntities;
  }

  const memberEntityIds = new Set(
    members.filter((m) => m.user_id === userId).map((m) => m.entity_id)
  );

  const ownedOrMember = allEntities.filter(
    (e) =>
      e.owner_id === userId ||
      memberEntityIds.has(e.id) ||
      !e.owner_id
  );

  return ownedOrMember;
}

export function getEntityByIdOrSlug(idOrSlug?: string | null): NetworkEntity | null {
  if (!idOrSlug) return null;
  const clean = idOrSlug.replace(/^entity:/i, '').trim().toLowerCase();
  const all = getLocalNetworkEntities();
  return (
    all.find(
      (e) =>
        e.id.toLowerCase() === clean ||
        e.slug.toLowerCase() === clean ||
        e.display_name.toLowerCase() === clean
    ) || null
  );
}

/**
 * Synchronizes network_entities, festival_editions, and festival_lineup_items from Supabase
 * into the local cache without blocking the UI.
 */
export async function syncNetworkEntitiesFromSupabase(): Promise<{
  entities: NetworkEntity[];
  editions: FestivalEdition[];
  lineupItems: FestivalLineupItem[];
}> {
  const supabase = getSupabase();
  let entities = getLocalNetworkEntities();
  let editions = getLocalFestivalEditions();
  let lineupItems = getLocalFestivalLineupItems();

  if (!supabase) {
    return { entities, editions, lineupItems };
  }

  try {
    const [entitiesRes, editionsRes, lineupRes] = await Promise.all([
      supabase.from('network_entities').select('*').order('created_at', { ascending: false }),
      supabase.from('festival_editions').select('*').order('start_date', { ascending: false }),
      supabase.from('festival_lineup_items').select('*').order('sort_order', { ascending: true }),
    ]);

    if (!entitiesRes.error && Array.isArray(entitiesRes.data) && entitiesRes.data.length > 0) {
      const mergedMap = new Map<string, NetworkEntity>();
      for (const local of entities) mergedMap.set(local.id, local);
      for (const remote of entitiesRes.data as NetworkEntity[]) mergedMap.set(remote.id, remote);
      entities = Array.from(mergedMap.values());
      writeLocalList(STORAGE_KEYS.ENTITIES, entities);
    }

    if (!editionsRes.error && Array.isArray(editionsRes.data) && editionsRes.data.length > 0) {
      const mergedEditions = new Map<string, FestivalEdition>();
      for (const local of editions) mergedEditions.set(local.id, local);
      for (const remote of editionsRes.data as FestivalEdition[]) mergedEditions.set(remote.id, remote);
      editions = Array.from(mergedEditions.values());
      writeLocalList(STORAGE_KEYS.EDITIONS, editions);
    }

    if (!lineupRes.error && Array.isArray(lineupRes.data) && lineupRes.data.length > 0) {
      const mergedLineup = new Map<string, FestivalLineupItem>();
      for (const local of lineupItems) mergedLineup.set(local.id, local);
      for (const remote of lineupRes.data as FestivalLineupItem[]) mergedLineup.set(remote.id, remote);
      lineupItems = Array.from(mergedLineup.values());
      writeLocalList(STORAGE_KEYS.LINEUP_ITEMS, lineupItems);
    }

    broadcastEntitiesUpdated({ entities, editions, lineupItems });
  } catch (err) {
    // Table may not yet exist on remote Supabase instance; local persistence keeps everything running smoothly
    console.debug('[networkEntitiesService] Using local cache fallback:', err);
  }

  return { entities, editions, lineupItems };
}

export interface CreateEntityPayload {
  display_name: string;
  slug?: string;
  category: EntityCategory;
  location?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  external_links?: Record<string, string | undefined>;
  owner_id?: string | null;
}

export async function createNetworkEntity(payload: CreateEntityPayload): Promise<NetworkEntity> {
  const existing = getLocalNetworkEntities();
  const baseSlug = slugifyEntityName(payload.slug || payload.display_name);
  let uniqueSlug = baseSlug;
  let counter = 2;
  while (existing.some((e) => e.slug.toLowerCase() === uniqueSlug.toLowerCase())) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const ownerId =
    payload.owner_id ||
    (typeof window !== 'undefined'
      ? (() => {
          try {
            const p = JSON.parse(localStorage.getItem('nexus_core_user_profile') || '{}');
            return p?.id || '5403162d-1947-43aa-b5f6-38a1bd2a1b80';
          } catch {
            return '5403162d-1947-43aa-b5f6-38a1bd2a1b80';
          }
        })()
      : '5403162d-1947-43aa-b5f6-38a1bd2a1b80');

  const newEntity: NetworkEntity = {
    id: generateUUID(),
    slug: uniqueSlug,
    display_name: payload.display_name.trim(),
    category: payload.category,
    avatar_url:
      payload.avatar_url?.trim() ||
      (payload.category === 'festival'
        ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
        : payload.category === 'label_distro'
        ? 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80'
        : payload.category === 'booking_agency'
        ? 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'),
    banner_url:
      payload.banner_url?.trim() ||
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    bio: payload.bio?.trim() || `${payload.display_name.trim()} on Nexus Underground Network.`,
    location: payload.location?.trim() || 'Global Underground',
    external_links: payload.external_links || {},
    owner_id: ownerId,
    created_at: new Date().toISOString(),
  };

  // Save to local cache immediately
  const nextEntities = [newEntity, ...existing];
  writeLocalList(STORAGE_KEYS.ENTITIES, nextEntities);

  const members = getLocalEntityMembers();
  const newMember: EntityMember = {
    entity_id: newEntity.id,
    user_id: ownerId,
    role: 'owner',
  };
  writeLocalList(STORAGE_KEYS.MEMBERS, [newMember, ...members]);

  // If this is a festival, also create an initial announced edition if desired or keep ready
  broadcastEntitiesUpdated({ createdEntity: newEntity, entities: nextEntities });

  // Best-effort persist to Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('network_entities').upsert([newEntity], { onConflict: 'id' });
      await supabase.from('entity_members').upsert([newMember], { onConflict: 'entity_id,user_id' });
    } catch (err) {
      console.debug('[networkEntitiesService] Supabase insert notice (cached locally):', err);
    }
  }

  return newEntity;
}

export async function updateNetworkEntity(
  entityId: string,
  updates: Partial<NetworkEntity>
): Promise<NetworkEntity | null> {
  const entities = getLocalNetworkEntities();
  const idx = entities.findIndex((e) => e.id === entityId);
  if (idx === -1) return null;

  const updated: NetworkEntity = {
    ...entities[idx],
    ...updates,
    id: entities[idx].id,
  };
  entities[idx] = updated;
  writeLocalList(STORAGE_KEYS.ENTITIES, entities);
  broadcastEntitiesUpdated({ updatedEntity: updated, entities });

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('network_entities').update(updates).eq('id', entityId);
    } catch (err) {
      console.debug('[networkEntitiesService] Supabase update notice:', err);
    }
  }

  return updated;
}

export async function deleteNetworkEntity(entityId: string): Promise<void> {
  const entities = getLocalNetworkEntities().filter((e) => e.id !== entityId);
  writeLocalList(STORAGE_KEYS.ENTITIES, entities);

  const editions = getLocalFestivalEditions();
  const removedEditionIds = new Set(
    editions.filter((ed) => ed.entity_id === entityId).map((ed) => ed.id)
  );
  const remainingEditions = editions.filter((ed) => ed.entity_id !== entityId);
  writeLocalList(STORAGE_KEYS.EDITIONS, remainingEditions);

  const remainingLineup = getLocalFestivalLineupItems().filter(
    (item) => !removedEditionIds.has(item.edition_id)
  );
  writeLocalList(STORAGE_KEYS.LINEUP_ITEMS, remainingLineup);

  broadcastEntitiesUpdated({ deletedEntityId: entityId, entities });

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('network_entities').delete().eq('id', entityId);
    } catch (err) {
      console.debug('[networkEntitiesService] Supabase delete notice:', err);
    }
  }
}

export function getEditionsForEntity(entityId: string): FestivalEdition[] {
  return getLocalFestivalEditions()
    .filter((ed) => ed.entity_id === entityId)
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
}

export function getEditionById(editionId: string): FestivalEdition | null {
  return getLocalFestivalEditions().find((ed) => ed.id === editionId) || null;
}

export function getLineupForEdition(editionId: string): FestivalLineupItem[] {
  const items = getLocalFestivalLineupItems().filter((i) => i.edition_id === editionId);
  return items
    .map((item) => hydrateLineupItemWithBandMetadata(item))
    .sort((a, b) => {
      const tierDiff =
        (BILLING_TIER_META[a.billing_tier]?.order || 99) -
        (BILLING_TIER_META[b.billing_tier]?.order || 99);
      if (tierDiff !== 0) return tierDiff;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
}

export async function saveFestivalEdition(
  editionInput: Partial<FestivalEdition> & { entity_id: string; edition_name: string }
): Promise<FestivalEdition> {
  const editions = getLocalFestivalEditions();
  const existingIdx = editionInput.id
    ? editions.findIndex((e) => e.id === editionInput.id)
    : -1;

  const savedEdition: FestivalEdition =
    existingIdx >= 0
      ? {
          ...editions[existingIdx],
          ...editionInput,
        }
      : {
          id: editionInput.id || generateUUID(),
          entity_id: editionInput.entity_id,
          edition_name: editionInput.edition_name.trim(),
          start_date: editionInput.start_date || '2027-07-16',
          end_date: editionInput.end_date || editionInput.start_date || '2027-07-18',
          venue_name: editionInput.venue_name || 'Main Festival Grounds',
          city: editionInput.city || 'Chicago',
          state: editionInput.state || 'IL',
          ticket_url: editionInput.ticket_url || '',
          flyer_url: editionInput.flyer_url || '',
          status: editionInput.status || 'announced',
          created_at: new Date().toISOString(),
        };

  if (existingIdx >= 0) {
    editions[existingIdx] = savedEdition;
  } else {
    editions.unshift(savedEdition);
  }

  writeLocalList(STORAGE_KEYS.EDITIONS, editions);
  broadcastEntitiesUpdated({ savedEdition, editions });

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('festival_editions').upsert([savedEdition], { onConflict: 'id' });
    } catch (err) {
      console.debug('[networkEntitiesService] Supabase saveFestivalEdition notice:', err);
    }
  }

  return savedEdition;
}

export async function replaceEditionLineupItems(
  editionId: string,
  items: Array<Omit<FestivalLineupItem, 'id' | 'edition_id' | 'created_at'> & { id?: string }>
): Promise<FestivalLineupItem[]> {
  const allItems = getLocalFestivalLineupItems().filter((i) => i.edition_id !== editionId);

  const normalizedNewItems: FestivalLineupItem[] = items.map((item, idx) =>
    hydrateLineupItemWithBandMetadata({
      id: item.id || generateUUID(),
      edition_id: editionId,
      band_entity_id: item.band_entity_id || null,
      custom_band_name: item.custom_band_name || item.resolved_band_name || 'Unnamed Band',
      custom_external_url: item.custom_external_url || null,
      billing_tier: item.billing_tier || 'support',
      sort_order: typeof item.sort_order === 'number' ? item.sort_order : idx + 1,
      day_number: item.day_number || 1,
      stage_name: item.stage_name || 'Main Stage',
      performance_date: item.performance_date || null,
      set_time: item.set_time || null,
      created_at: new Date().toISOString(),
      resolved_band_name: item.resolved_band_name,
      resolved_band_logo: item.resolved_band_logo,
      resolved_band_genre: item.resolved_band_genre,
      resolved_band_location: item.resolved_band_location,
      is_platform_band: item.is_platform_band,
    })
  );

  const combined = [...allItems, ...normalizedNewItems];
  writeLocalList(STORAGE_KEYS.LINEUP_ITEMS, combined);
  broadcastEntitiesUpdated({ editionId, lineupItems: normalizedNewItems });

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('festival_lineup_items').delete().eq('edition_id', editionId);
      const dbRows = normalizedNewItems.map((it) => ({
        id: it.id,
        edition_id: it.edition_id,
        band_entity_id:
          it.band_entity_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(it.band_entity_id)
            ? it.band_entity_id
            : null,
        custom_band_name: it.custom_band_name || it.resolved_band_name,
        custom_external_url: it.custom_external_url,
        billing_tier: it.billing_tier,
        sort_order: it.sort_order,
        day_number: it.day_number,
        stage_name: it.stage_name,
        performance_date: it.performance_date,
        set_time: it.set_time,
        created_at: it.created_at,
      }));
      if (dbRows.length > 0) {
        await supabase.from('festival_lineup_items').insert(dbRows);
      }
    } catch (err) {
      console.debug('[networkEntitiesService] Supabase replaceEditionLineupItems notice:', err);
    }
  }

  return normalizedNewItems;
}

/**
 * Searches all registered Community Archive Bands + Band Entities so users can tag
 * existing platform bands into `festival_lineup_items` with full profile card linking.
 */
export function getAllPlatformBandCandidates(): PlatformBandCandidate[] {
  const candidates: PlatformBandCandidate[] = [];
  const seenNames = new Set<string>();

  // 1. Community Band Hub archives (all 49+ bands)
  try {
    const communityBands = communityBandManager.getAll() || [];
    for (const b of communityBands) {
      if (!b || !b.name) continue;
      const key = b.name.trim().toLowerCase();
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      const rawB = b as any;
      candidates.push({
        id: `band:${rawB.id || slugifyEntityName(rawB.name)}`,
        name: rawB.name.trim(),
        genre: rawB.genre || 'Extreme Metal',
        location: rawB.location || rawB.homebase || rawB.origin || 'Underground',
        logo_url: rawB.logo_url || rawB.logo || '',
        banner_url: rawB.banner_url || rawB.cover_url || '',
        slug: slugifyEntityName(rawB.name),
        is_registered: true,
        rawBand: rawB,
      });
    }
  } catch (e) {
    console.warn('[networkEntitiesService] communityBandManager lookup error:', e);
  }

  // 2. Network entities of category 'band'
  const bandEntities = getLocalNetworkEntities().filter((e) => e.category === 'band');
  for (const e of bandEntities) {
    const key = e.display_name.trim().toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    candidates.push({
      id: e.id,
      name: e.display_name,
      genre: 'Extreme Metal',
      location: e.location || 'Underground',
      logo_url: e.avatar_url || '',
      banner_url: e.banner_url || '',
      slug: e.slug,
      is_registered: true,
      rawBand: e,
    });
  }

  return candidates.sort((a, b) => a.name.localeCompare(b.name));
}

export function searchPlatformBandsForLineup(query: string): PlatformBandCandidate[] {
  const all = getAllPlatformBandCandidates();
  const q = query.trim().toLowerCase();
  if (!q) return all.slice(0, 20);
  return all
    .filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q)
    )
    .slice(0, 20);
}

export function hydrateLineupItemWithBandMetadata(item: FestivalLineupItem): FestivalLineupItem {
  const candidates = getAllPlatformBandCandidates();
  const targetName = (item.custom_band_name || item.resolved_band_name || '').trim().toLowerCase();
  const targetId = (item.band_entity_id || '').trim().toLowerCase();

  const match = candidates.find(
    (c) =>
      (targetId && (c.id.toLowerCase() === targetId || `band:${c.slug}` === targetId)) ||
      (targetName && c.name.toLowerCase() === targetName)
  );

  if (match) {
    return {
      ...item,
      band_entity_id: item.band_entity_id || match.id,
      resolved_band_name: match.name,
      resolved_band_logo: item.resolved_band_logo || match.logo_url,
      resolved_band_genre: item.resolved_band_genre || match.genre,
      resolved_band_location: item.resolved_band_location || match.location,
      is_platform_band: true,
    };
  }

  return {
    ...item,
    resolved_band_name: item.custom_band_name || item.resolved_band_name || 'TBA',
    is_platform_band: Boolean(item.band_entity_id),
  };
}

/**
 * Opens the interactive PublicProfileModal when a user clicks on a tagged platform band
 * inside a Festival Lineup Card, or opens a Public Entity profile card.
 */
export function openTaggedBandOrEntityProfile(
  itemOrEntity: FestivalLineupItem | NetworkEntity,
  triggerNotification?: (msg: string) => void
): void {
  if (typeof window === 'undefined') return;

  // Check if it's a NetworkEntity directly
  if ('category' in itemOrEntity && 'display_name' in itemOrEntity) {
    const entity = itemOrEntity;
    const catMeta = ENTITY_CATEGORY_META[entity.category] || ENTITY_CATEGORY_META.festival;
    const isLabel = entity.category === 'label_distro';
    const isBand = entity.category === 'band';

    const detailPayload = {
      id: entity.id,
      name: entity.display_name,
      legalName: entity.display_name,
      handle: `@${entity.slug}`,
      console_handle: `@${entity.slug}`,
      username: `@${entity.slug}`,
      avatar: entity.avatar_url,
      avatar_url: entity.avatar_url,
      banner: entity.banner_url,
      banner_url: entity.banner_url,
      cover_url: entity.banner_url,
      location: entity.location || 'Global Underground',
      role: catMeta.shortLabel,
      account_type: isLabel ? 'label' : isBand ? 'band' : 'promoter',
      type: isLabel ? 'label' : isBand ? 'band' : 'promoter',
      isPersonal: false,
      isPromoterProfile: !isLabel && !isBand,
      isLabelProfile: isLabel,
      isBandProfile: isBand,
      badges: [`${catMeta.icon} ${catMeta.shortLabel}`],
      customBadges: [`${catMeta.icon} ${catMeta.shortLabel}`],
      bio: entity.bio || `${entity.display_name} official page on Nexus Core.`,
      external_links: entity.external_links || {},
      entityData: entity,
    };

    window.dispatchEvent(new CustomEvent('openPublicProfile', { detail: detailPayload }));
    triggerNotification?.(`${catMeta.icon} Opening ${entity.display_name} public page...`);
    return;
  }

  // Otherwise it's a FestivalLineupItem
  const lineupItem = hydrateLineupItemWithBandMetadata(itemOrEntity);
  const candidates = getAllPlatformBandCandidates();
  const bandName = lineupItem.resolved_band_name || lineupItem.custom_band_name || '';
  const match = candidates.find(
    (c) =>
      (lineupItem.band_entity_id && c.id.toLowerCase() === lineupItem.band_entity_id.toLowerCase()) ||
      c.name.toLowerCase() === bandName.toLowerCase()
  );

  if (match && match.rawBand) {
    const raw = match.rawBand;
    const detailPayload = {
      ...raw,
      id: raw.id || match.id,
      name: match.name,
      handle: `@${match.slug}`,
      avatar: match.logo_url,
      avatar_url: match.logo_url,
      logo_url: match.logo_url,
      banner: match.banner_url || raw.banner_url,
      banner_url: match.banner_url || raw.banner_url,
      cover_url: match.banner_url || raw.banner_url,
      genre: match.genre,
      location: match.location,
      homebase: match.location,
      role: 'Band / Artist',
      account_type: 'band',
      type: 'band',
      isBandProfile: true,
      isPersonal: false,
      bio: raw.bio || `${match.name} (${match.genre}) from ${match.location}.`,
    };
    window.dispatchEvent(new CustomEvent('openPublicProfile', { detail: detailPayload }));
    triggerNotification?.(`🎸 Opening ${match.name} band profile...`);
    return;
  }

  if (lineupItem.custom_external_url) {
    window.open(lineupItem.custom_external_url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Fallback synthetic band profile modal
  const fallbackPayload = {
    id: lineupItem.band_entity_id || `band:${slugifyEntityName(bandName)}`,
    name: bandName,
    handle: `@${slugifyEntityName(bandName)}`,
    role: 'Band / Artist',
    account_type: 'band',
    type: 'band',
    isBandProfile: true,
    isPersonal: false,
    genre: lineupItem.resolved_band_genre || 'Extreme Metal',
    location: lineupItem.resolved_band_location || 'Underground Scene',
    bio: `${bandName} — Performing on ${lineupItem.stage_name || 'Main Stage'} (Day ${lineupItem.day_number || 1}).`,
  };
  window.dispatchEvent(new CustomEvent('openPublicProfile', { detail: fallbackPayload }));
  triggerNotification?.(`🎸 Opening ${bandName} profile card...`);
}

/**
 * Phase 1.5: Promoter Workspace Pointer/Reference Model (`linked_entity_id`)
 * Links a Promoter Workspace to a `network_entities` record without duplicating or migrating posts/followers.
 */
export async function linkEntityToPromoterWorkspace(
  entityId: string | null,
  userProfile?: any,
  setUserProfile?: (p: any) => void
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const mapRaw = localStorage.getItem(STORAGE_KEYS.PROMOTER_LINKS);
      const map = mapRaw ? JSON.parse(mapRaw) : {};
      const key = userProfile?.id || 'default';
      if (entityId) {
        map[key] = entityId;
      } else {
        delete map[key];
      }
      localStorage.setItem(STORAGE_KEYS.PROMOTER_LINKS, JSON.stringify(map));
    } catch {}
  }

  if (userProfile) {
    const updatedProfile = {
      ...userProfile,
      linked_entity_id: entityId,
      promoter_metadata: {
        ...(userProfile.promoter_metadata || {}),
        linked_entity_id: entityId,
      },
    };
    if (setUserProfile) setUserProfile(updatedProfile);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));
        window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updatedProfile }));
      } catch {}
    }
  }

  const supabase = getSupabase();
  if (supabase && userProfile?.id) {
    try {
      await supabase
        .from('promoter_workspaces')
        .upsert(
          [
            {
              owner_id: userProfile.id,
              workspace_name:
                userProfile?.promoter_metadata?.brand_name ||
                userProfile?.promoter_name ||
                'Promoter Workspace',
              linked_entity_id: entityId,
            },
          ],
          { onConflict: 'id' }
        );
    } catch (err) {
      console.debug('[networkEntitiesService] promoter_workspaces pointer update notice:', err);
    }
  }

  broadcastEntitiesUpdated({ linkedEntityId: entityId });
}

export function getLinkedEntityForPromoterWorkspace(userProfile?: any): NetworkEntity | null {
  let linkedId: string | null =
    userProfile?.linked_entity_id ||
    userProfile?.promoter_metadata?.linked_entity_id ||
    null;

  if (!linkedId && typeof window !== 'undefined') {
    try {
      const mapRaw = localStorage.getItem(STORAGE_KEYS.PROMOTER_LINKS);
      if (mapRaw) {
        const map = JSON.parse(mapRaw);
        linkedId = map[userProfile?.id || 'default'] || map.default || null;
      }
    } catch {}
  }

  if (!linkedId) return null;
  return getEntityByIdOrSlug(linkedId);
}
