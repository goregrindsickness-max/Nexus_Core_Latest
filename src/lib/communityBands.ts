// Nexus Band Community & Verification Management
// Manages community archives, name collision checks, verification status, and artist handover forks

import {
  getSupabase,
  uploadBase64ToStorage,
  uploadCommunityBandMedia,
  executeWithSchemaResilience,
  sanitizeBandPayload,
  sanitizeMicroGenres,
  ensureUUID,
  generateUUID,
  upsertReleasesBatchToDatabase,
  upsertBandToDatabase,
  processOfflineQueue
} from '../supabase';
import { syncBandDiscographyToPhysicalAndDigital } from '../services/discographySyncService';

export type BandVerificationStatus = 'community_archive' | 'claim_pending' | 'verified_official';

export interface LineupMember {
  id?: string;
  name: string;
  role: string;
  status?: 'active' | 'past' | 'touring';
  years?: string;
  avatar_url?: string;
}

export interface DiscographyTrack {
  number?: number;
  title: string;
  duration?: string;
  stream_url?: string;
  lyrics?: string;
}

export interface DiscographyRelease {
  id?: string;
  title: string;
  year: string;
  type: 'album' | 'ep' | 'single' | 'demo' | string;
  image_url?: string;
  cover_url?: string;
  cover_image?: string;
  coverUrl?: string;
  coverImage?: string;
  release_info?: string;
  catalog_id?: string;
  label?: string;
  tracks?: DiscographyTrack[];
}

export interface CommunityBandRecord {
  id: string;
  name: string;
  band_name?: string;
  genre: string;
  subgenres?: string[];
  micro_genres?: string[];
  founded_year?: string;
  city?: string;
  country?: string;
  state?: string;
  state_province?: string;
  record_label?: string;
  label?: string;
  label_name?: string;
  bio?: string;
  description?: string;
  avatar_url?: string;
  logo_url?: string;
  cover_url?: string;
  banner_url?: string;
  avatar?: string;
  image?: string;
  spotify?: string;
  spotify_url?: string;
  bandcamp?: string;
  bandcamp_url?: string;
  metal_archives?: string;
  metal_archives_url?: string;
  youtube_url?: string;
  featured_youtube_url?: string;
  lineup?: LineupMember[];
  discography?: DiscographyRelease[];
  creator_id?: string;
  curated_by?: string; // Fan curator handle or user ID
  curator_name?: string;
  created_at: string;
  verification_status: BandVerificationStatus;
  claimed_by_user_id?: string;
  claimed_at?: string;
  followers_count?: number;
  custom_slug?: string;
  slug?: string;
}

// Initial pre-seeded community archives for iconic bands loaded from seedBandsData
export { INITIAL_COMMUNITY_BANDS, isCommunityBandRecord } from './seedBandsData';
import { INITIAL_COMMUNITY_BANDS, isCommunityBandRecord } from './seedBandsData';

export const UNOFFICIAL_MOCK_BAND_IDS = new Set<string>([
  'exhumed',
  'testament',
  'abominable-putridity',
  'abominable putridity',
  'jungle-rot',
  'jungle rot',
  'disgorge',
  'epicardiectomy',
  'morbid-angel',
  'morbid angel'
]);

export const UNOFFICIAL_MOCK_BAND_NAMES = new Set<string>([
  'exhumed',
  'testament',
  'abominable putridity',
  'jungle rot',
  'disgorge',
  'epicardiectomy',
  'morbid angel'
]);

export function isDeletedOrZombieBand(idOrName?: string): boolean {
  if (!idOrName || typeof idOrName !== 'string') return false;
  const clean = idOrName.toLowerCase().trim();
  const cleanAlpha = clean.replace(/[^a-z0-9]/g, '');

  if (UNOFFICIAL_MOCK_BAND_IDS.has(clean)) return true;
  if (UNOFFICIAL_MOCK_BAND_NAMES.has(clean)) return true;
  for (const name of UNOFFICIAL_MOCK_BAND_NAMES) {
    if (cleanAlpha === name.replace(/[^a-z0-9]/g, '')) return true;
  }

  const deletedIds = getDeletedBandIds();
  if (deletedIds.has(clean)) return true;
  return false;
}


export function deduplicateDiscography(releases: DiscographyRelease[]): DiscographyRelease[] {
  if (!Array.isArray(releases)) return [];
  const seen = new Map<string, DiscographyRelease>();
  for (const r of releases) {
    if (!r || !r.title) continue;
    const normTitle = r.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normTitle) continue;
    if (!seen.has(normTitle)) {
      seen.set(normTitle, r);
    } else {
      const existing = seen.get(normTitle)!;
      const hasBetterCover = (!existing.cover_url || existing.cover_url.includes('unsplash') || existing.cover_url.includes('placeholder')) && (r.cover_url && !r.cover_url.includes('unsplash') && !r.cover_url.includes('placeholder'));
      const hasMoreTracks = (r.tracks?.length || 0) > (existing.tracks?.length || 0);
      if (hasBetterCover || hasMoreTracks) {
        seen.set(normTitle, { ...existing, ...r, cover_url: r.cover_url || existing.cover_url });
      }
    }
  }
  return Array.from(seen.values());
}

export function deduplicateLineup(members: LineupMember[]): LineupMember[] {
  if (!Array.isArray(members)) return [];
  const seen = new Map<string, LineupMember>();
  for (const m of members) {
    if (!m || !m.name) continue;
    const normName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normName) continue;
    if (!seen.has(normName)) {
      seen.set(normName, m);
    } else {
      const existing = seen.get(normName)!;
      if (existing.status === 'past' && m.status === 'active') {
        seen.set(normName, m);
      }
    }
  }
  return Array.from(seen.values());
}

export function purgeDeletedAndZombieBands(): void {
  try {
    const storageKeys = [
      'nexus_community_band_archives',
      'nexus_community_bands_v2',
      'nexus_registered_bands',
      'nexus_social_feed_cache',
      'nexus_social_feed_v2',
      'discover_profiles_cache'
    ];

    for (const key of storageKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item: any) => {
            if (!item) return false;
            const itemId = String(item.id || item.band_id || item.raw_id || '').trim();
            const itemName = String(item.name || item.band_name || item.title || '').trim();
            if (isDeletedOrZombieBand(itemId) || isDeletedOrZombieBand(itemName)) {
              return false;
            }
            return true;
          });
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch {}
    }

    // Also check active band
    const activeBandRaw = localStorage.getItem('nexus_active_band');
    if (activeBandRaw) {
      try {
        const activeBand = JSON.parse(activeBandRaw);
        const activeName = String(activeBand.name || activeBand.band_name || '').trim();
        const activeId = String(activeBand.id || '').trim();
        if (isDeletedOrZombieBand(activeName) || isDeletedOrZombieBand(activeId)) {
          localStorage.removeItem('nexus_active_band');
        }
      } catch {}
    }
  } catch (e) {
    console.warn('Error purging zombie bands:', e);
  }
}

const STORAGE_KEY = 'nexus_community_band_archives';
const DELETED_STORAGE_KEY = 'nexus_deleted_community_bands';

function getDeletedBandIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.map(String));
    }
  } catch {}
  return new Set();
}

function markBandDeletedInStorage(id: string, name?: string): void {
  try {
    const current = getDeletedBandIds();
    const cleanId = String(id || '').trim();
    if (cleanId) {
      current.add(cleanId);
      current.add(ensureUUID(cleanId));
    }
    if (name && typeof name === 'string' && name.trim()) {
      current.add(name.toLowerCase().trim());
    }
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

export class CommunityBandManager {
  private static instance: CommunityBandManager;

  private constructor() {
    this.initStorage();
  }

  public static getInstance(): CommunityBandManager {
    if (!CommunityBandManager.instance) {
      CommunityBandManager.instance = new CommunityBandManager();
    }
    return CommunityBandManager.instance;
  }

  private initStorage(): void {
    try {
      const deletedIds = getDeletedBandIds();

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Only seed bands that have not been explicitly deleted by the user
        const initialFiltered = INITIAL_COMMUNITY_BANDS.filter(b => 
          !deletedIds.has(b.id) &&
          !deletedIds.has(ensureUUID(b.id)) &&
          !deletedIds.has((b.name || '').toLowerCase().trim())
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialFiltered));
      } else {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Purge any legacy cached mock bands that are not official Supabase records or have been deleted
          const purged = parsed.filter(b => {
            const bId = String(b.id || '').trim();
            const bName = (b.name || (b as any).band_name || '').toLowerCase().trim();
            if (deletedIds.has(bId) || deletedIds.has(ensureUUID(bId)) || deletedIds.has(bName)) return false;
            if (UNOFFICIAL_MOCK_BAND_IDS.has(bId)) return false;
            if (UNOFFICIAL_MOCK_BAND_NAMES.has(bName) && !bId.startsWith('db-')) return false;
            return true;
          });

          // Merge non-deleted initial community bands into storage
          const updated = [...purged];
          for (const initBand of INITIAL_COMMUNITY_BANDS) {
            const initName = (initBand.name || '').toLowerCase().trim();
            if (deletedIds.has(initBand.id) || deletedIds.has(ensureUUID(initBand.id)) || deletedIds.has(initName)) {
              continue;
            }
            const idx = updated.findIndex(b =>
              b.id === initBand.id ||
              ensureUUID(b.id) === ensureUUID(initBand.id) ||
              ((b.name || (b as any).band_name || '').toLowerCase().trim() === initName)
            );
            if (idx === -1) {
              updated.push(initBand);
            } else {
              const bIdKey = initBand.id || '';
              const bUUIDKey = bIdKey ? ensureUUID(bIdKey) : '';
              const savedLogo = (bIdKey ? localStorage.getItem(`nexus_core_band_logo_${bIdKey}`) : null) || 
                                (bUUIDKey ? localStorage.getItem(`nexus_core_band_logo_${bUUIDKey}`) : null) ||
                                localStorage.getItem(`nexus_core_band_logo_${updated[idx].id}`);
              const savedCover = (bIdKey ? localStorage.getItem(`nexus_core_band_cover_${bIdKey}`) : null) || 
                                 (bUUIDKey ? localStorage.getItem(`nexus_core_band_cover_${bUUIDKey}`) : null) ||
                                 localStorage.getItem(`nexus_core_band_cover_${updated[idx].id}`);
              
              const bestLogo = savedLogo || 
                (updated[idx].logo_url && updated[idx].logo_url !== initBand.logo_url && !updated[idx].logo_url.includes('unsplash') ? updated[idx].logo_url : null) ||
                (updated[idx].avatar_url && updated[idx].avatar_url !== initBand.avatar_url && !updated[idx].avatar_url.includes('unsplash') ? updated[idx].avatar_url : null) ||
                initBand.logo_url;
              const bestAvatar = bestLogo;
              const bestCover = savedCover ||
                (updated[idx].cover_url && updated[idx].cover_url !== initBand.cover_url && !updated[idx].cover_url.includes('unsplash') ? updated[idx].cover_url : null) ||
                (updated[idx].banner_url && updated[idx].banner_url !== initBand.banner_url && !updated[idx].banner_url.includes('unsplash') ? updated[idx].banner_url : null) ||
                initBand.cover_url;
              const bestBio = (updated[idx].bio && updated[idx].bio.trim() !== '') ? updated[idx].bio : (initBand.bio || '');
              const bestDiscography = deduplicateDiscography(
                (updated[idx].discography && updated[idx].discography.length > 0)
                  ? updated[idx].discography
                  : (initBand.discography || [])
              );
              const bestLineup = deduplicateLineup(
                (updated[idx].lineup && updated[idx].lineup.length > 0)
                  ? updated[idx].lineup
                  : (initBand.lineup || [])
              );

              // Upgrade with user edits taking absolute precedence over pre-seeded master
              updated[idx] = {
                ...initBand,
                ...updated[idx],
                avatar_url: bestAvatar,
                logo_url: bestLogo,
                avatar: bestLogo,
                image: bestLogo,
                cover_url: bestCover,
                banner_url: bestCover,
                bio: bestBio,
                record_label: updated[idx].record_label || updated[idx].label || initBand.record_label || initBand.label,
                label: updated[idx].label || updated[idx].record_label || initBand.label || initBand.record_label,
                discography: bestDiscography,
                lineup: bestLineup,
                verification_status: updated[idx].verification_status || initBand.verification_status || 'community_archive'
              };
            }
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } else {
          const initialFiltered = INITIAL_COMMUNITY_BANDS.filter(b => 
            !deletedIds.has(b.id) &&
            !deletedIds.has(ensureUUID(b.id)) &&
            !deletedIds.has((b.name || '').toLowerCase().trim())
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initialFiltered));
        }
      }
    } catch (e) {
      console.warn('Error initializing community band archives:', e);
    }
  }

  public getAll(): CommunityBandRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const deletedIds = getDeletedBandIds();
      let list: CommunityBandRecord[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        } catch {}
      }
      
      const initialMap = new Map(INITIAL_COMMUNITY_BANDS.map(b => [b.id, b]));
      const initialByUUID = new Map(INITIAL_COMMUNITY_BANDS.map(b => [ensureUUID(b.id), b]));
      const initialByName = new Map(INITIAL_COMMUNITY_BANDS.map(b => [(b.name || b.band_name || '').toLowerCase().trim(), b]));
      const initialBySlug = new Map(INITIAL_COMMUNITY_BANDS.map(b => [(b.custom_slug || (b.name || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-')).trim(), b]));

      // 1. Group records by canonical identity to filter out inferior duplicate entries
      const byIdentity = new Map<string, CommunityBandRecord[]>();
      let needsPruning = false;

      for (const item of list) {
        if (!item || !item.id) continue;
        if (deletedIds.has(item.id) || deletedIds.has(ensureUUID(item.id))) {
          needsPruning = true;
          continue;
        }

        let rawName = (item.name || (item as any).band_name || '').trim();
        const rawSlug = ((item as any).custom_slug || (item as any).slug || '').trim().toLowerCase();
        const itemUUID = ensureUUID(item.id);

        // Auto-heal corrupted "Nexus Artist" or "Underground Label" or empty names from seed / slug / id
        const fresh = initialMap.get(item.id) || initialByUUID.get(itemUUID) || (rawSlug ? initialBySlug.get(rawSlug) : undefined) || initialByName.get(rawName.toLowerCase());
        if (fresh && (!rawName || rawName.toLowerCase() === 'nexus artist' || rawName.toLowerCase() === 'underground label')) {
          rawName = fresh.name;
          item.name = fresh.name;
          (item as any).band_name = fresh.name;
          if (!item.custom_slug) (item as any).custom_slug = fresh.custom_slug || fresh.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
        } else if (!rawName || rawName.toLowerCase() === 'nexus artist' || rawName.toLowerCase() === 'underground label') {
          if (rawSlug) {
            rawName = rawSlug.split('-').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            item.name = rawName;
            (item as any).band_name = rawName;
          }
        }

        const normName = rawName.toLowerCase().trim();
        if (!normName) continue;
        if (deletedIds.has(normName)) {
          needsPruning = true;
          continue;
        }

        // Purge empty/corrupted placeholder entries with no releases
        if ((normName === 'nexus artist' || normName === 'underground label') && (!item.discography || item.discography.length === 0)) {
          needsPruning = true;
          continue;
        }

        let processedItem = item;
        // If it's a pre-seeded band, only fill in missing fields from fresh, never overwrite user edits!
        if (fresh) {
          processedItem = {
            ...fresh,
            ...item,
            name: rawName,
            band_name: rawName,
            avatar_url: item.avatar_url || fresh.avatar_url,
            logo_url: item.logo_url || fresh.logo_url,
            cover_url: item.cover_url || fresh.cover_url,
            banner_url: item.banner_url || fresh.banner_url,
            bio: (item.bio !== undefined && item.bio !== null) ? item.bio : (fresh.bio || ''),
            city: (item.city !== undefined && item.city !== null) ? item.city : (fresh.city || ''),
            state: (item.state !== undefined && item.state !== null) ? item.state : (fresh.state || ''),
            record_label: (item.record_label !== undefined && item.record_label !== null) ? item.record_label : (item.label || fresh.record_label || fresh.label || ''),
            discography: (Array.isArray(item.discography) && item.discography.length > 0) ? item.discography : fresh.discography,
            lineup: (Array.isArray(item.lineup) && item.lineup.length > 0) ? item.lineup : fresh.lineup
          };
        }

        // Group key: if name is non-placeholder, group by normName; if placeholder, group strictly by UUID
        const groupKey = (normName && normName !== 'nexus artist' && normName !== 'underground label') ? normName : `id-${itemUUID}`;
        const group = byIdentity.get(groupKey) || [];
        group.push(processedItem);
        byIdentity.set(groupKey, group);
      }

      // 2. Select the single best/canonical record for each band identity
      const result: CommunityBandRecord[] = [];
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();

      for (const [groupKey, group] of byIdentity.entries()) {
        if (group.length > 1) {
          needsPruning = true;
          // Score each candidate to pick the true/complete version (e.g. 12 releases over 6 releases)
          group.sort((a, b) => {
            const scoreA = (a.discography?.length || 0) * 10 +
              (a.lineup?.length || 0) * 2 +
              (a.verification_status === 'verified_official' ? 30 : 0) +
              (a.creator_id ? 20 : 0) +
              (a.id.includes('-') && a.id.length >= 30 ? 15 : 0);

            const scoreB = (b.discography?.length || 0) * 10 +
              (b.lineup?.length || 0) * 2 +
              (b.verification_status === 'verified_official' ? 30 : 0) +
              (b.creator_id ? 20 : 0) +
              (b.id.includes('-') && b.id.length >= 30 ? 15 : 0);

            return scoreB - scoreA;
          });
        }

        const winner = group[0];
        const winnerNormName = (winner?.name || (winner as any)?.band_name || '').toLowerCase().trim();
        if (winner && !seenIds.has(winner.id) && !seenIds.has(ensureUUID(winner.id))) {
          seenIds.add(winner.id);
          seenIds.add(ensureUUID(winner.id));
          if (winnerNormName && winnerNormName !== 'nexus artist') {
            seenNames.add(winnerNormName);
          }
          result.push(winner);
        }
      }

      // 3. Append any initial pre-seeded band that is missing from user's storage and not deleted
      for (const initBand of INITIAL_COMMUNITY_BANDS) {
        const initNormName = initBand.name.toLowerCase().trim();
        if (deletedIds.has(initBand.id) || deletedIds.has(ensureUUID(initBand.id))) continue;
        if (!seenIds.has(initBand.id) && !seenNames.has(initNormName)) {
          seenIds.add(initBand.id);
          seenNames.add(initNormName);
          result.push(initBand);
        }
      }

      // Auto-prune localStorage if duplicates or deleted items were purged
      if (needsPruning && result.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
        } catch {}
      }

      return result.length > 0 ? result : INITIAL_COMMUNITY_BANDS;
    } catch {
      return INITIAL_COMMUNITY_BANDS;
    }
  }

  public findByName(name: string): CommunityBandRecord | null {
    if (!name || !name.trim()) return null;
    const clean = name.trim().toLowerCase();
    const cleanNorm = clean.replace(/[^a-z0-9]/g, '');
    const all = this.getAll();
    return all.find((b) => {
      const bName = (b.name || (b as any).band_name || '').toLowerCase();
      return bName === clean || bName.replace(/[^a-z0-9]/g, '') === cleanNorm;
    }) || null;
  }

  public findMatch(name: string): CommunityBandRecord | null {
    return this.findByName(name);
  }

  public getById(id: string): CommunityBandRecord | null {
    if (!id) return null;
    const cleanId = String(id).trim();
    const cleanUUID = ensureUUID(cleanId);
    const all = this.getAll();
    return all.find((b) => b.id === cleanId || ensureUUID(b.id) === cleanUUID) || null;
  }

  private saveToStorage(list: CommunityBandRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage quota exceeded when saving bands, pruning bulky base64 assets...', e);
      try {
        const pruned = list.map(b => ({
          ...b,
          avatar_url: b.avatar_url?.startsWith('data:') ? undefined : b.avatar_url,
          logo_url: b.logo_url?.startsWith('data:') ? undefined : b.logo_url,
          cover_url: b.cover_url?.startsWith('data:') ? undefined : b.cover_url
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      } catch (err2) {
        console.error('Critical storage failure:', err2);
      }
    }
  }

  // Create or quick-edit a fan/community band page without official registration forms
  public upsertCommunityBand(
    band: Partial<CommunityBandRecord> & { name?: string; id?: string },
    options?: { isNew?: boolean }
  ): CommunityBandRecord {
    const all = this.getAll();
    const candidateName = (band.name || (band as any).band_name || '').trim();
    const isExplicitNew = Boolean(options?.isNew);
    
    // 1. Exact ID lookup (only if not explicitly creating a brand-new band)
    let existingIndex = -1;
    if (!isExplicitNew && band.id) {
      existingIndex = all.findIndex((b) => b.id === band.id);
      if (existingIndex < 0) {
        const targetUUID = ensureUUID(band.id);
        existingIndex = all.findIndex((b) => ensureUUID(b.id) === targetUUID);
      }
    }

    // 2. Canonical Name lookup if not found by ID (only when NOT explicitly creating a new band)
    if (!isExplicitNew && existingIndex < 0 && candidateName && candidateName.toLowerCase() !== 'nexus artist') {
      const cleanCandidate = candidateName.toLowerCase().trim();
      existingIndex = all.findIndex((b) => {
        const bName = (b.name || (b as any).band_name || '').toLowerCase().trim();
        return bName === cleanCandidate;
      });
    }

    const now = new Date().toISOString();
    let result: CommunityBandRecord;

    const resolvedAvatar = band.avatar_url || band.logo_url || (band as any).avatar || (band as any).image;
    const resolvedCover = band.cover_url || band.banner_url || (band as any).banner || (band as any).cover;

    if (existingIndex >= 0 && !isExplicitNew) {
      const existing = all[existingIndex];
      const validName = (candidateName || existing.name || 'Nexus Artist').trim();
      const updatedMicroGenres = band.micro_genres || band.subgenres || existing.micro_genres || existing.subgenres || [];
      
      // Preserve discography: if incoming discography is not passed or empty while existing has releases, retain existing
      let discographyToSave: DiscographyRelease[];
      if (Array.isArray(band.discography) && band.discography.length > 0) {
        discographyToSave = band.discography;
      } else if (existing.discography && existing.discography.length > 0) {
        discographyToSave = existing.discography;
      } else {
        discographyToSave = band.discography || [];
      }

      // Preserve lineup: if incoming lineup is not passed or empty while existing has members, retain existing
      let lineupToSave: LineupMember[];
      if (Array.isArray(band.lineup) && band.lineup.length > 0) {
        lineupToSave = band.lineup;
      } else if (existing.lineup && existing.lineup.length > 0) {
        lineupToSave = existing.lineup;
      } else {
        lineupToSave = band.lineup || [];
      }

      const updated: CommunityBandRecord = {
        ...existing,
        ...band,
        id: existing.id,
        name: validName,
        band_name: validName,
        genre: band.genre || existing.genre || 'Extreme Metal',
        micro_genres: updatedMicroGenres,
        subgenres: updatedMicroGenres,
        avatar_url: (band.avatar_url !== undefined && band.avatar_url !== null) ? band.avatar_url : (resolvedAvatar !== undefined && resolvedAvatar !== '' ? resolvedAvatar : (existing.avatar_url || existing.logo_url)),
        logo_url: (band.logo_url !== undefined && band.logo_url !== null) ? band.logo_url : (resolvedAvatar !== undefined && resolvedAvatar !== '' ? resolvedAvatar : (existing.logo_url || existing.avatar_url)),
        avatar: (band.avatar !== undefined && band.avatar !== null) ? band.avatar : (resolvedAvatar !== undefined && resolvedAvatar !== '' ? resolvedAvatar : (existing.avatar || existing.avatar_url)),
        image: (band.image !== undefined && band.image !== null) ? band.image : (resolvedAvatar !== undefined && resolvedAvatar !== '' ? resolvedAvatar : (existing.image || existing.avatar_url)),
        cover_url: (band.cover_url !== undefined && band.cover_url !== null) ? band.cover_url : (resolvedCover !== undefined && resolvedCover !== '' ? resolvedCover : (existing.cover_url || existing.banner_url)),
        banner_url: (band.banner_url !== undefined && band.banner_url !== null) ? band.banner_url : (resolvedCover !== undefined && resolvedCover !== '' ? resolvedCover : (existing.banner_url || existing.cover_url)),
        founded_year: band.founded_year !== undefined ? band.founded_year : existing.founded_year,
        city: band.city !== undefined ? band.city : existing.city,
        state: band.state !== undefined ? band.state : existing.state,
        state_province: band.state_province !== undefined ? band.state_province : (band.state || existing.state_province || existing.state),
        country: band.country !== undefined ? band.country : existing.country,
        record_label: band.record_label !== undefined ? band.record_label : (band.label !== undefined ? band.label : (existing.record_label || existing.label)),
        label: band.label !== undefined ? band.label : (band.record_label !== undefined ? band.record_label : (existing.label || existing.record_label)),
        label_name: band.label_name !== undefined ? band.label_name : (existing.label_name || existing.record_label),
        bio: band.bio !== undefined ? band.bio : (existing.bio || (existing as any).description || ''),
        spotify_url: band.spotify_url || band.spotify || existing.spotify_url || existing.spotify || '',
        bandcamp_url: band.bandcamp_url || band.bandcamp || existing.bandcamp_url || existing.bandcamp || '',
        metal_archives_url: band.metal_archives_url || existing.metal_archives_url || '',
        youtube_url: band.youtube_url || band.featured_youtube_url || existing.youtube_url || existing.featured_youtube_url || '',
        featured_youtube_url: band.featured_youtube_url || band.youtube_url || existing.featured_youtube_url || existing.youtube_url || '',
        lineup: lineupToSave,
        discography: discographyToSave,
        creator_id: band.creator_id || existing.creator_id,
        verification_status: band.verification_status || existing.verification_status || 'community_archive'
      };
      all[existingIndex] = updated;
      this.saveToStorage(all);
      if (updated.logo_url && !updated.logo_url.startsWith('data:')) {
        localStorage.setItem(`nexus_core_band_logo_${updated.id}`, updated.logo_url);
        localStorage.setItem(`nexus_core_band_logo_${existing.id}`, updated.logo_url);
      }
      if (updated.cover_url && !updated.cover_url.startsWith('data:')) {
        localStorage.setItem(`nexus_core_band_cover_${updated.id}`, updated.cover_url);
        localStorage.setItem(`nexus_core_band_cover_${existing.id}`, updated.cover_url);
      }
      window.dispatchEvent(new CustomEvent('nexus_community_bands_updated', { detail: updated }));
      result = updated;
    } else {
      // BRAND NEW ENTRY - Guaranteed unique fresh UUID, never matching fallback strings or overwriting existing items
      const newId = (band.id && !all.some(b => b.id === band.id || ensureUUID(b.id) === ensureUUID(band.id)))
        ? ensureUUID(band.id)
        : generateUUID();

      const validName = (candidateName || 'Nexus Artist').trim();
      const initialMicroGenres = band.micro_genres || band.subgenres || (band.genre ? [band.genre] : ['Extreme Metal']);
      const newBand: CommunityBandRecord = {
        id: newId,
        name: validName,
        band_name: validName,
        genre: band.genre || 'Extreme Metal',
        micro_genres: initialMicroGenres,
        subgenres: initialMicroGenres,
        founded_year: band.founded_year || '',
        city: band.city || '',
        state: band.state || '',
        state_province: band.state_province || band.state || '',
        country: band.country || 'USA',
        record_label: band.record_label || band.label || band.label_name || '',
        label: band.label || band.record_label || band.label_name || '',
        label_name: band.label_name || band.record_label || band.label || '',
        bio: band.bio || `Community-curated archive and discography for ${validName}.`,
        avatar_url: resolvedAvatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        logo_url: resolvedAvatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        avatar: resolvedAvatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        image: resolvedAvatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        cover_url: resolvedCover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
        banner_url: resolvedCover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
        spotify_url: band.spotify_url || band.spotify || '',
        bandcamp_url: band.bandcamp_url || band.bandcamp || '',
        metal_archives_url: band.metal_archives_url || '',
        youtube_url: band.youtube_url || band.featured_youtube_url || '',
        featured_youtube_url: band.featured_youtube_url || band.youtube_url || '',
        lineup: band.lineup || [],
        discography: band.discography || [],
        creator_id: band.creator_id,
        curated_by: band.curated_by || '@fan_archivist',
        curator_name: band.curator_name || 'Community Archivist',
        created_at: now,
        verification_status: 'community_archive',
        followers_count: band.followers_count || 120
      };
      all.unshift(newBand);
      this.saveToStorage(all);
      window.dispatchEvent(new CustomEvent('nexus_community_bands_updated', { detail: newBand }));
      result = newBand;
    }

    // Proactively sync band row to Supabase 'bands' table & 'releases' table
    this.syncToSupabaseTables(result, options).catch((e) => {
      console.warn('[communityBands] Supabase remote sync notice:', e);
    });

    return result;
  }

  // Safe delete method that purges from local and Supabase storage
  public deleteCommunityBand(bandId: string, force?: boolean): { success: boolean; error?: string } {
    const all = this.getAll();
    const targetUUID = ensureUUID(bandId);
    const idx = all.findIndex(b => b.id === bandId || ensureUUID(b.id) === targetUUID);
    if (idx < 0) return { success: false, error: 'Band archive not found.' };

    const band = all[idx];

    // Record in deleted tracking set to prevent resurrection from cached payloads
    markBandDeletedInStorage(band.id, band.name);
    if (bandId !== band.id) markBandDeletedInStorage(bandId, band.name);

    const remaining = all.filter(b => b.id !== band.id && ensureUUID(b.id) !== targetUUID);
    this.saveToStorage(remaining);

    // Delete remote Supabase records asynchronously if client is active
    try {
      const client = getSupabase();
      if (client) {
        Promise.resolve(client.from('releases').delete().or(`band_id.eq.${band.id},band_id.eq.${targetUUID}`)).catch(() => {});
        Promise.resolve(client.from('bands').delete().or(`id.eq.${band.id},id.eq.${targetUUID}`)).catch(() => {});
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('nexus_community_bands_updated', { detail: { id: band.id, deleted: true } }));
    return { success: true };
  }

  // Background & explicit sync to live Supabase 'bands' & 'releases' tables and buckets
  public async syncToSupabaseTables(
    band: CommunityBandRecord | (Partial<CommunityBandRecord> & { id: string }),
    options?: { isNew?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    const dispatchSyncLog = (message: string) => {
      console.log(`[Supabase Band Sync] ${message}`);
      try {
        window.dispatchEvent(new CustomEvent('nexus_band_sync_log', {
          detail: { message, timestamp: Date.now() }
        }));
      } catch {}
    };

    try {
      dispatchSyncLog('Initializing Supabase connection & resolving band name...');
      const client = getSupabase();
      if (!client) {
        dispatchSyncLog('Notice: Supabase client unavailable (offline / mock mode).');
        return { success: true };
      }

      const isExplicitNew = Boolean(options?.isNew);

      const existing = !isExplicitNew ? (this.getById(band.id || '') || (band.name ? this.findByName(band.name) : null)) : null;
      let resolvedBandName = (band.name || (band as any).band_name || existing?.name || existing?.band_name || '').trim();
      const rawTargetSlug = ((band as any).custom_slug || (band as any).slug || '').trim().toLowerCase();

      const KNOWN_SEEDED_NAMES: Record<string, string> = {
        'cordyceps': 'Cordyceps',
        'mortician': 'Mortician',
        'sanguisugabogg': 'Sanguisugabogg',
        'necrophagist': 'Necrophagist',
        'dying-fetus': 'Dying Fetus',
        'devourment': 'Devourment',
        'origin': 'Origin',
        'peelingflesh': 'PeelingFlesh',
        'putrid-pile': 'Putrid Pile',
        'lividity': 'Lividity'
      };

      if (!resolvedBandName || resolvedBandName.toLowerCase() === 'nexus artist' || resolvedBandName.toLowerCase() === 'underground label') {
        if (rawTargetSlug && KNOWN_SEEDED_NAMES[rawTargetSlug]) {
          resolvedBandName = KNOWN_SEEDED_NAMES[rawTargetSlug];
        }
      }

      if ((!resolvedBandName || resolvedBandName.toLowerCase() === 'nexus artist' || resolvedBandName.toLowerCase() === 'underground label') && !isExplicitNew) {
        try {
          const archives = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          const bId = band.id ? String(band.id) : '';
          const bUUID = band.id ? ensureUUID(band.id) : '';
          const found = archives.find((b: any) => b && (b.id === bId || ensureUUID(b.id) === bUUID || (rawTargetSlug && (b.custom_slug === rawTargetSlug || b.slug === rawTargetSlug))));
          if (found?.name || found?.band_name) {
            const n = (found.name || found.band_name).trim();
            if (n && n.toLowerCase() !== 'nexus artist' && n.toLowerCase() !== 'underground label') resolvedBandName = n;
          }
        } catch {}
      }

      if ((!resolvedBandName || resolvedBandName.toLowerCase() === 'nexus artist' || resolvedBandName.toLowerCase() === 'underground label') && !isExplicitNew) {
        try {
          const activeBandRaw = localStorage.getItem('nexus_active_band');
          if (activeBandRaw) {
            const parsed = JSON.parse(activeBandRaw);
            if (parsed?.name || parsed?.band_name) {
              const n = (parsed.name || parsed.band_name).trim();
              if (n && n.toLowerCase() !== 'nexus artist' && n.toLowerCase() !== 'underground label') resolvedBandName = n;
            }
          }
        } catch {}
      }

      if ((!resolvedBandName || resolvedBandName.toLowerCase() === 'nexus artist' || resolvedBandName.toLowerCase() === 'underground label') && rawTargetSlug) {
        resolvedBandName = KNOWN_SEEDED_NAMES[rawTargetSlug] || rawTargetSlug
          .split('-')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      if (!resolvedBandName) {
        resolvedBandName = 'Nexus Artist';
      }

      const targetSlug = (rawTargetSlug || resolvedBandName).toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-');

      // Ensure stable deterministic UUID for bands table
      let bandUUID = (isExplicitNew || !band.id || band.id.startsWith('comm-band-'))
        ? (band.id ? ensureUUID(band.id) : generateUUID())
        : ensureUUID(band.id);

      // If updating an existing band, check if a row with this custom_slug already exists in Supabase to preserve its UUID
      if (!isExplicitNew && targetSlug && client) {
        try {
          const { data: slugRow } = await client.from('bands').select('id').eq('custom_slug', targetSlug).maybeSingle();
          if (slugRow?.id) {
            bandUUID = slugRow.id;
          }
        } catch {}
      }

      dispatchSyncLog(`Resolved target band "${resolvedBandName}" (UUID: ${bandUUID}, Mode: ${isExplicitNew ? 'INSERT' : 'UPDATE/UPSERT'}). Checking storage assets...`);

      // Auto-upload base64 images to community-bands bucket using standardized uploadCommunityBandMedia helper
      let finalAvatarUrl = band.avatar_url || (band as any).logo_url || (band as any).avatar || (band as any).image || existing?.avatar_url || existing?.logo_url;
      if (finalAvatarUrl && finalAvatarUrl.startsWith('data:')) {
        try {
          dispatchSyncLog('Uploading avatar/logo image to Supabase storage bucket...');
          const uploaded = await uploadCommunityBandMedia(finalAvatarUrl, bandUUID, 'logo');
          if (uploaded && !uploaded.startsWith('data:')) {
            finalAvatarUrl = uploaded;
            dispatchSyncLog('Avatar/logo successfully uploaded to storage.');
          }
        } catch (err) {
          console.warn('[communityBands] Avatar storage upload fallback:', err);
          dispatchSyncLog('Avatar storage upload warning (using data URI fallback).');
        }
      }

      let finalCoverUrl = band.cover_url || (band as any).banner_url || (band as any).banner || (band as any).cover || existing?.cover_url || existing?.banner_url;
      if (finalCoverUrl && finalCoverUrl.startsWith('data:')) {
        try {
          dispatchSyncLog('Uploading cover banner image to Supabase storage bucket...');
          const uploaded = await uploadCommunityBandMedia(finalCoverUrl, bandUUID, 'cover');
          if (uploaded && !uploaded.startsWith('data:')) {
            finalCoverUrl = uploaded;
            dispatchSyncLog('Cover banner successfully uploaded to storage.');
          }
        } catch (err) {
          console.warn('[communityBands] Cover banner storage upload fallback:', err);
          dispatchSyncLog('Cover banner storage upload warning.');
        }
      }

      // Update local storage record with the uploaded storage URLs and all incoming band properties (bio, lineup, etc.)
      const all = this.getAll();
      const idx = all.findIndex(b => b.id === band.id || ensureUUID(b.id) === bandUUID);
      const mergedRecord: CommunityBandRecord = {
        ...(idx >= 0 ? all[idx] : {}),
        ...band,
        id: bandUUID,
        name: resolvedBandName,
        band_name: resolvedBandName,
        genre: band.genre || (idx >= 0 ? all[idx].genre : undefined) || 'Extreme Metal',
        created_at: (idx >= 0 ? all[idx].created_at : undefined) || new Date().toISOString(),
        verification_status: band.verification_status || (idx >= 0 ? all[idx].verification_status : undefined) || 'community_archive',
        avatar_url: finalAvatarUrl || band.avatar_url || (idx >= 0 ? all[idx].avatar_url : undefined),
        logo_url: finalAvatarUrl || band.logo_url || (idx >= 0 ? all[idx].logo_url : undefined),
        avatar: finalAvatarUrl || band.avatar || (idx >= 0 ? all[idx].avatar : undefined),
        image: finalAvatarUrl || band.image || (idx >= 0 ? all[idx].image : undefined),
        cover_url: finalCoverUrl || band.cover_url || (idx >= 0 ? all[idx].cover_url : undefined),
        banner_url: finalCoverUrl || band.banner_url || (idx >= 0 ? all[idx].banner_url : undefined),
        bio: band.bio !== undefined ? band.bio : (idx >= 0 ? all[idx].bio : '')
      };

      if (idx >= 0) {
        all[idx] = mergedRecord;
      } else {
        all.push(mergedRecord);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

      if (finalAvatarUrl && !finalAvatarUrl.startsWith('data:')) {
        localStorage.setItem(`nexus_core_band_logo_${bandUUID}`, finalAvatarUrl);
        if (band.id) localStorage.setItem(`nexus_core_band_logo_${band.id}`, finalAvatarUrl);
      }
      if (finalCoverUrl && !finalCoverUrl.startsWith('data:')) {
        localStorage.setItem(`nexus_core_band_cover_${bandUUID}`, finalCoverUrl);
        if (band.id) localStorage.setItem(`nexus_core_band_cover_${band.id}`, finalCoverUrl);
      }

      // 1. Sync to 'bands' table using schema resilience & sanitization with guaranteed non-null band_name
      const parsedYear = (band.founded_year !== undefined && band.founded_year !== null && String(band.founded_year).trim() !== '')
        ? parseInt(String(band.founded_year), 10)
        : ((existing?.founded_year !== undefined && existing?.founded_year !== null && String(existing?.founded_year).trim() !== '')
            ? parseInt(String(existing.founded_year), 10)
            : null);
      const validFoundedYear = (parsedYear && !isNaN(parsedYear) && parsedYear > 0) ? parsedYear : null;

      const rawBandGenres = band.micro_genres || band.subgenres || existing?.micro_genres || existing?.subgenres || (band.genre ? [band.genre] : ['Extreme Metal']);
      const sanitizedBandGenres = sanitizeMicroGenres(rawBandGenres);

      const rawRecordLabel = (band.record_label || band.label || band.label_name || existing?.record_label || existing?.label || existing?.label_name || '').trim() || null;

      const rawBandPayload: Record<string, any> = {
        id: bandUUID,
        band_name: resolvedBandName,
        name: resolvedBandName,
        micro_genres: sanitizedBandGenres,
        founded_year: validFoundedYear,
        city: band.city !== undefined ? (band.city ? String(band.city).trim() : null) : (existing?.city || null),
        state_province: band.state_province || band.state || existing?.state_province || existing?.state || null,
        country: band.country !== undefined ? (band.country ? String(band.country).trim() : null) : (existing?.country || null),
        record_label: rawRecordLabel,
        creator_id: band.creator_id || band.claimed_by_user_id || existing?.creator_id || null,
        bio: band.bio !== undefined ? (band.bio ? String(band.bio).trim() : '') : (existing?.bio || null),
        logo_url: finalAvatarUrl || null,
        cover_url: finalCoverUrl || null,
        spotify: band.spotify || band.spotify_url || existing?.spotify || existing?.spotify_url || null,
        bandcamp: band.bandcamp || band.bandcamp_url || existing?.bandcamp || existing?.bandcamp_url || null,
        metal_archives_url: band.metal_archives_url || existing?.metal_archives_url || null,
        featured_youtube_url: band.featured_youtube_url || band.youtube_url || existing?.featured_youtube_url || existing?.youtube_url || null,
        lineup: band.lineup || existing?.lineup || [],
        is_verified: (band as any).is_verified !== undefined ? Boolean((band as any).is_verified) : (((band as any).verification_status === 'verified_official') || (existing as any)?.is_verified || false),
        custom_slug: (targetSlug || resolvedBandName).toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-'),
        updated_at: new Date().toISOString()
      };

      dispatchSyncLog(`Executing upsertBandToDatabase (isNew: ${isExplicitNew})...`);
      const bandResult = await upsertBandToDatabase(rawBandPayload, { isNew: isExplicitNew });

      if (bandResult?.error) {
        console.error('[communityBands] Band upsert error:', bandResult.error);
        dispatchSyncLog(`❌ Band sync error: ${bandResult.error}`);
      } else {
        dispatchSyncLog(`✅ Band "${resolvedBandName}" synchronized to database successfully.`);
      }

      try {
        dispatchSyncLog('Flushing offline sync queue via processOfflineQueue()...');
        await processOfflineQueue();
        dispatchSyncLog('Offline sync queue flushed successfully.');
      } catch (err: any) {
        console.warn('[communityBands] Offline queue flush notice:', err);
        dispatchSyncLog(`Offline queue flush warning: ${err?.message || err}`);
      }

      if (bandResult?.error) {
        console.error('[communityBands] Band database sync error:', bandResult.error);
        dispatchSyncLog(`❌ Band database sync error: ${bandResult.error}`);
        return { success: false, error: bandResult.error };
      }

      // Broadcast update events across all UI listeners
      window.dispatchEvent(new CustomEvent('nexus_community_bands_updated', {
        detail: {
          ...band,
          id: band.id,
          avatar_url: finalAvatarUrl,
          logo_url: finalAvatarUrl,
          cover_url: finalCoverUrl,
          banner_url: finalCoverUrl
        }
      }));

      // 2. Sync discography albums to 'releases' table with strict batch upsert & duplicate filtering
      if (Array.isArray(band.discography) && band.discography.length > 0) {
        dispatchSyncLog(`Syncing discography (${band.discography.length} albums/releases) to Supabase "releases" table...`);
        const releasePayloads: any[] = [];
        const seenReleaseIds = new Set<string>();

        for (const [idx, album] of band.discography.entries()) {
          const releaseId = ensureUUID(album.id || `rel-${bandUUID}-${idx}-${Date.now()}`);
          if (seenReleaseIds.has(releaseId)) {
            continue;
          }
          seenReleaseIds.add(releaseId);

          let albumCoverUrl = album.cover_url || album.cover_image || album.coverUrl || album.coverImage || album.image_url || null;
          if (albumCoverUrl && albumCoverUrl.startsWith('data:image')) {
            try {
              const uploaded = await uploadBase64ToStorage(albumCoverUrl, 'community-bands', `${bandUUID}-${idx}`, 'cover');
              if (uploaded) albumCoverUrl = uploaded;
            } catch (err) {
              console.warn('[communityBands] Release artwork storage upload fallback:', err);
            }
          }

          releasePayloads.push({
            id: releaseId,
            band_id: bandUUID,
            title: album.title || `Release ${idx + 1}`,
            type: album.type || 'album',
            release_date: album.year || String(new Date().getFullYear()),
            cover_image: albumCoverUrl || null,
            cover_url: albumCoverUrl || null,
            tracks: album.tracks || [],
            label: album.label || album.release_info || null,
            catalog_id: album.catalog_id || null,
            genre: band.genre,
            status: 'active',
            updated_at: new Date().toISOString()
          });
        }

        const batchResult = await upsertReleasesBatchToDatabase(releasePayloads, bandUUID);

        if (!batchResult.success) {
          console.error('[communityBands] Batch discography releases upsert rejected:', batchResult.error);
          dispatchSyncLog(`Discography sync error: ${batchResult.error}`);
          return { success: false, error: batchResult.error };
        } else {
          dispatchSyncLog(`Success! Synchronized ${releasePayloads.length} release(s) for "${resolvedBandName}" to Supabase.`);
        }
      }

      dispatchSyncLog(`Success! Band "${resolvedBandName}" fully synced to Supabase.`);
      return { success: true };
    } catch (err: any) {
      console.warn('[communityBands] Error syncing to Supabase:', err);
      dispatchSyncLog(`Sync failed: ${err?.message || 'Database sync error'}`);
      return { success: false, error: err?.message || 'Database sync error' };
    }
  }

  // Fetch live Supabase 'bands' and 'releases' rows and merge into community archives
  public async fetchFromSupabase(): Promise<CommunityBandRecord[]> {
    try {
      const client = getSupabase();
      if (!client) return this.getAll();

      const { data: bandsData, error: bandsErr } = await client
        .from('bands')
        .select('*')
        .order('created_at', { ascending: false });

      if (bandsErr || !bandsData || !Array.isArray(bandsData)) {
        return this.getAll();
      }

      const { data: releasesData } = await client
        .from('releases')
        .select('*');

      const all = this.getAll();
      const updatedList = [...all];

      for (const b of bandsData) {
        let bandName = b.band_name || b.name;
        if (!bandName || (bandName.toLowerCase().trim() === 'nexus artist' && !b.bio && (!b.micro_genres || b.micro_genres.length === 0))) continue;

        // Find associated releases
        const matchingReleases = Array.isArray(releasesData)
          ? releasesData.filter((r: any) => r.band_id === b.id || (b.id && r.band_id === ensureUUID(b.id)))
          : [];

        const remoteDiscography: DiscographyRelease[] = matchingReleases.map((r: any) => ({
          id: r.id,
          title: r.title || 'Untitled Release',
          year: r.release_date || '',
          type: (r.type?.toLowerCase() || 'album') as any,
          cover_url: r.cover_url || r.cover_image || r.coverUrl || r.coverImage || r.image_url || '',
          cover_image: r.cover_image || r.cover_url || r.coverImage || r.coverUrl || r.image_url || '',
          coverUrl: r.cover_url || r.cover_image || r.coverUrl || r.coverImage || r.image_url || '',
          coverImage: r.cover_image || r.cover_url || r.coverImage || r.coverUrl || r.image_url || '',
          image_url: r.cover_image || r.cover_url || r.coverImage || r.coverUrl || r.image_url || '',
          release_info: r.label || '',
          catalog_id: r.catalog_id || '',
          label: r.label || '',
          tracks: Array.isArray(r.tracks) ? r.tracks : []
        }));

        let cleanBandName = bandName.toLowerCase().trim();
        const bSlug = (b.custom_slug || b.slug || '').trim().toLowerCase();

        const KNOWN_SEEDED_NAMES: Record<string, string> = {
          'cordyceps': 'Cordyceps',
          'mortician': 'Mortician',
          'sanguisugabogg': 'Sanguisugabogg',
          'necrophagist': 'Necrophagist',
          'dying-fetus': 'Dying Fetus',
          'devourment': 'Devourment',
          'origin': 'Origin',
          'peelingflesh': 'PeelingFlesh',
          'putrid-pile': 'Putrid Pile',
          'lividity': 'Lividity',
          'suffocation': 'Suffocation',
          'stabbing': 'Stabbing'
        };

        // Match existing band by ID (exact or UUID) or custom_slug or exact canonical name
        const existingIdx = updatedList.findIndex((x) => {
          if (x.id === b.id || (b.id && ensureUUID(x.id) === b.id) || (b.id && x.id === ensureUUID(b.id))) return true;
          const xSlug = ((x as any).custom_slug || (x as any).slug || '').trim().toLowerCase();
          if (bSlug && xSlug && bSlug === xSlug) return true;
          const xName = (x.name || (x as any).band_name || '').toLowerCase().trim();
          if (xName && cleanBandName && xName === cleanBandName && xName !== 'nexus artist' && xName !== 'underground label') return true;
          return false;
        });

        const existingItem = existingIdx >= 0 ? updatedList[existingIdx] : null;
        const seedMatch = INITIAL_COMMUNITY_BANDS.find((seed) => {
          if (b.id && (seed.id === b.id || ensureUUID(seed.id) === b.id)) return true;
          const sSlug = (seed.custom_slug || (seed.name || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-')).trim().toLowerCase();
          if (bSlug && sSlug === bSlug) return true;
          const sName = (seed.name || seed.band_name || '').toLowerCase().trim();
          if (cleanBandName && sName === cleanBandName && cleanBandName !== 'nexus artist' && cleanBandName !== 'underground label') return true;
          return false;
        });
        const effectiveExisting = existingItem || seedMatch;

        // Protect against accidental label / placeholder corruption (e.g. 'Underground Label', 'Nexus Artist')
        if (cleanBandName === 'underground label' || cleanBandName === 'nexus artist' || !cleanBandName) {
          if (existingItem?.name && existingItem.name.toLowerCase() !== 'underground label' && existingItem.name.toLowerCase() !== 'nexus artist') {
            bandName = existingItem.name;
          } else if (seedMatch?.name) {
            bandName = seedMatch.name;
          } else if (bSlug && KNOWN_SEEDED_NAMES[bSlug]) {
            bandName = KNOWN_SEEDED_NAMES[bSlug];
          } else if (bSlug) {
            bandName = bSlug.split('-').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          } else if (b.bio && b.bio.includes('archive and discography for ')) {
            const bioMatch = b.bio.match(/archive and discography for\s+([^.]+)/i);
            if (bioMatch && bioMatch[1]) bandName = bioMatch[1].trim();
          }
          cleanBandName = bandName.toLowerCase().trim();
        }

        let parsedLineup: LineupMember[] = [];
        if (Array.isArray(b.lineup)) {
          parsedLineup = b.lineup;
        } else if (typeof b.lineup === 'string') {
          try {
            const parsed = JSON.parse(b.lineup);
            if (Array.isArray(parsed)) parsedLineup = parsed;
          } catch {}
        }

        const microGenres = Array.isArray(b.micro_genres)
          ? b.micro_genres
          : typeof b.micro_genres === 'string'
          ? b.micro_genres.split(',').map((s: string) => s.trim())
          : [];

        const bIdKey = b.id || '';
        const bUUIDKey = bIdKey ? ensureUUID(bIdKey) : '';
        const savedLogo = (bIdKey ? localStorage.getItem(`nexus_core_band_logo_${bIdKey}`) : null) || 
                          (bUUIDKey ? localStorage.getItem(`nexus_core_band_logo_${bUUIDKey}`) : null) ||
                          (existingItem?.id ? localStorage.getItem(`nexus_core_band_logo_${existingItem.id}`) : null);
        const savedCover = (bIdKey ? localStorage.getItem(`nexus_core_band_cover_${bIdKey}`) : null) || 
                           (bUUIDKey ? localStorage.getItem(`nexus_core_band_cover_${bUUIDKey}`) : null) ||
                           (existingItem?.id ? localStorage.getItem(`nexus_core_band_cover_${existingItem.id}`) : null);

        const resolvedAvatar = savedLogo || 
          (existingItem?.logo_url && existingItem.logo_url !== seedMatch?.logo_url && !existingItem.logo_url.includes('unsplash') ? existingItem.logo_url : null) ||
          (existingItem?.avatar_url && existingItem.avatar_url !== seedMatch?.avatar_url && !existingItem.avatar_url.includes('unsplash') ? existingItem.avatar_url : null) ||
          (b.logo_url && b.logo_url !== seedMatch?.logo_url && !b.logo_url.includes('unsplash') ? b.logo_url : null) ||
          (b.avatar_url && b.avatar_url !== seedMatch?.avatar_url && !b.avatar_url.includes('unsplash') ? b.avatar_url : null) ||
          seedMatch?.logo_url || seedMatch?.avatar_url || existingItem?.logo_url || existingItem?.avatar_url || b.logo_url || b.avatar_url || '';

        const resolvedCover = savedCover ||
          (existingItem?.cover_url && existingItem.cover_url !== seedMatch?.cover_url && !existingItem.cover_url.includes('unsplash') ? existingItem.cover_url : null) ||
          (existingItem?.banner_url && existingItem.banner_url !== seedMatch?.banner_url && !existingItem.banner_url.includes('unsplash') ? existingItem.banner_url : null) ||
          (b.cover_url && b.cover_url !== seedMatch?.cover_url && !b.cover_url.includes('unsplash') ? b.cover_url : null) ||
          (b.banner_url && b.banner_url !== seedMatch?.banner_url && !b.banner_url.includes('unsplash') ? b.banner_url : null) ||
          seedMatch?.cover_url || seedMatch?.banner_url || existingItem?.cover_url || existingItem?.banner_url || b.cover_url || b.banner_url || '';

        // Intelligently merge discography: prioritize Supabase remoteDiscography, then local edits, strictly deduplicated
        const mergedDiscography: DiscographyRelease[] = (() => {
          let list: DiscographyRelease[] = [];
          if (remoteDiscography && remoteDiscography.length > 0) {
            list = [...remoteDiscography];
            if (existingItem?.discography && existingItem.discography.length > 0) {
              list.push(...existingItem.discography);
            }
          } else if (existingItem?.discography && existingItem.discography.length > 0) {
            list = [...existingItem.discography];
          } else if (seedMatch?.discography && seedMatch.discography.length > 0) {
            list = [...seedMatch.discography];
          }
          return deduplicateDiscography(list);
        })();

        // Merge lineup non-destructively: prioritize Supabase parsedLineup, then existingItem, then seedMatch
        const mergedLineup: LineupMember[] = deduplicateLineup(
          (parsedLineup && parsedLineup.length > 0)
            ? parsedLineup
            : (existingItem?.lineup && existingItem.lineup.length > 0)
            ? existingItem.lineup
            : (seedMatch?.lineup && seedMatch.lineup.length > 0)
            ? seedMatch.lineup
            : []
        );

        const isOfficialVE = (b.id === 'cbddb810-259b-4230-9968-3d402dfdb872' || cleanBandName === 'virulent excision');
        const resolvedVerification: BandVerificationStatus = isOfficialVE
          ? 'verified_official'
          : 'community_archive';

        // Prioritize Supabase cloud data for bio, then local edits, then seed match
        const record: CommunityBandRecord = {
          id: existingItem?.id || b.id,
          name: existingItem?.name || bandName,
          band_name: existingItem?.name || bandName,
          genre: existingItem?.genre || microGenres[0] || b.genre || seedMatch?.genre || 'Extreme Metal',
          subgenres: (existingItem?.subgenres && existingItem.subgenres.length > 0) ? existingItem.subgenres : (microGenres.length > 0 ? microGenres : (seedMatch?.subgenres || [])),
          founded_year: existingItem?.founded_year || b.founded_year || seedMatch?.founded_year || '',
          city: existingItem?.city || b.city || seedMatch?.city || '',
          state: existingItem?.state || b.state_province || b.state || seedMatch?.state || '',
          state_province: existingItem?.state_province || existingItem?.state || b.state_province || b.state || seedMatch?.state_province || seedMatch?.state || '',
          country: existingItem?.country || b.country || seedMatch?.country || 'USA',
          record_label: existingItem?.record_label || existingItem?.label || b.record_label || b.label_name || b.label || seedMatch?.record_label || seedMatch?.label || '',
          label: existingItem?.label || existingItem?.record_label || b.label || b.record_label || b.label_name || seedMatch?.label || seedMatch?.record_label || '',
          creator_id: existingItem?.creator_id || b.creator_id,
          bio: (() => {
            if (b.bio && b.bio.trim() !== '') return b.bio.trim();
            if (existingItem?.bio && existingItem.bio.trim() !== '') return existingItem.bio.trim();
            if (seedMatch?.bio && seedMatch.bio.trim() !== '') return seedMatch.bio.trim();
            return `Community-curated archive for ${bandName}.`;
          })(),
          avatar_url: resolvedAvatar,
          logo_url: resolvedAvatar,
          avatar: resolvedAvatar,
          image: resolvedAvatar,
          cover_url: resolvedCover,
          banner_url: resolvedCover,
          spotify_url: existingItem?.spotify_url || b.spotify || b.spotify_url || seedMatch?.spotify_url || '',
          bandcamp_url: existingItem?.bandcamp_url || b.bandcamp || b.bandcamp_url || seedMatch?.bandcamp_url || '',
          metal_archives_url: existingItem?.metal_archives_url || b.metal_archives_url || seedMatch?.metal_archives_url || '',
          youtube_url: existingItem?.youtube_url || b.featured_youtube_url || b.youtube_url || seedMatch?.youtube_url || '',
          featured_youtube_url: existingItem?.featured_youtube_url || existingItem?.youtube_url || b.featured_youtube_url || b.youtube_url || seedMatch?.featured_youtube_url || '',
          lineup: mergedLineup,
          discography: mergedDiscography,
          curated_by: existingItem?.curated_by || seedMatch?.curated_by || '@fan_archivist',
          curator_name: existingItem?.curator_name || seedMatch?.curator_name || 'Community Archivist',
          created_at: existingItem?.created_at || b.created_at || seedMatch?.created_at || new Date().toISOString(),
          verification_status: resolvedVerification,
          followers_count: existingItem?.followers_count || seedMatch?.followers_count || 120
        };

        if (existingIdx >= 0) {
          updatedList[existingIdx] = record;
        } else {
          updatedList.push(record);
        }
      }

      const deletedIds = getDeletedBandIds();
      const byIdentity = new Map<string, CommunityBandRecord[]>();

      for (const item of updatedList) {
        if (!item || !item.id) continue;
        if (deletedIds.has(item.id) || deletedIds.has(ensureUUID(item.id))) continue;
        const normName = (item.name || (item as any).band_name || '').toLowerCase().trim();
        const itemUUID = ensureUUID(item.id);
        const groupKey = (normName && normName !== 'nexus artist' && normName !== 'underground label') ? normName : `id-${itemUUID}`;

        const group = byIdentity.get(groupKey) || [];
        group.push(item);
        byIdentity.set(groupKey, group);
      }

      const dedupedList: CommunityBandRecord[] = [];
      const seenIds = new Set<string>();

      for (const group of byIdentity.values()) {
        if (group.length > 1) {
          group.sort((a, b) => {
            const isOfficialA = (a.id === 'cbddb810-259b-4230-9968-3d402dfdb872' || (a.name || '').toLowerCase() === 'virulent excision');
            const isOfficialB = (b.id === 'cbddb810-259b-4230-9968-3d402dfdb872' || (b.name || '').toLowerCase() === 'virulent excision');
            if (isOfficialA && !isOfficialB) return -1;
            if (!isOfficialA && isOfficialB) return 1;

            const scoreA = (a.discography?.length || 0) * 10 +
              (a.lineup?.length || 0) * 2 +
              (a.creator_id ? 20 : 0) +
              (a.id.includes('-') && a.id.length >= 30 ? 15 : 0);

            const scoreB = (b.discography?.length || 0) * 10 +
              (b.lineup?.length || 0) * 2 +
              (b.creator_id ? 20 : 0) +
              (b.id.includes('-') && b.id.length >= 30 ? 15 : 0);

            return scoreB - scoreA;
          });
        }

        const winner = group[0];
        if (winner && !seenIds.has(winner.id) && !seenIds.has(ensureUUID(winner.id))) {
          seenIds.add(winner.id);
          seenIds.add(ensureUUID(winner.id));
          dedupedList.push(winner);
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupedList));
      return dedupedList;
    } catch (err) {
      console.warn('[communityBands] fetchFromSupabase exception:', err);
      return this.getAll();
    }
  }

  // Claim handover lifecycle: Handover archive to official band member with 100% data preservation
  public claimBandHandover(
    bandIdOrName: string,
    claimingUserId: string,
    mode?: string
  ): { success: boolean; bandRecord: CommunityBandRecord } {
    const all = this.getAll();
    const cleanSearch = bandIdOrName.toLowerCase().trim();
    const index = all.findIndex((b) => b.id === bandIdOrName || b.name.toLowerCase().trim() === cleanSearch);

    if (index === -1) {
      throw new Error(`Band ${bandIdOrName} not found in community archives.`);
    }

    const current = all[index];

    // Preserve 100% of existing community profile data (discography, lineup, bio, artwork, links, followers)
    const updated: CommunityBandRecord = {
      ...current,
      verification_status: 'verified_official',
      creator_id: claimingUserId,
      claimed_by_user_id: claimingUserId,
      claimed_at: new Date().toISOString()
    };

    all[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('nexus_community_bands_updated', { detail: updated }));

    // Proactively sync handover state to Supabase
    this.syncToSupabaseTables(updated).catch(console.warn);

    // Automatically populate digital music player and physical release inventory with discography
    syncBandDiscographyToPhysicalAndDigital(updated).catch(console.warn);

    return { success: true, bandRecord: updated };
  }

  // Update specific fields of a band profile (e.g. cover art, bio, links) with guaranteed band_name
  public async updateBand(bandId: string, updates: Partial<CommunityBandRecord>): Promise<CommunityBandRecord> {
    const existing = this.getById(bandId) || (updates.name ? this.findByName(updates.name) : null);
    const resolvedName = (updates.name || (updates as any).band_name || existing?.name || existing?.band_name || 'Nexus Artist').trim();
    
    const updatedRecord = this.upsertCommunityBand({
      ...updates,
      id: bandId,
      name: resolvedName,
      band_name: resolvedName
    });

    await this.syncToSupabaseTables(updatedRecord);
    return updatedRecord;
  }

  // Quick helper to update cover banner artwork
  public async updateCoverArt(bandId: string, coverUrl: string): Promise<CommunityBandRecord> {
    return this.updateBand(bandId, { cover_url: coverUrl });
  }

  // Quick helper to update avatar/logo artwork
  public async updateAvatar(bandId: string, avatarUrl: string): Promise<CommunityBandRecord> {
    return this.updateBand(bandId, { avatar_url: avatarUrl });
  }

  // Push all local community bands and discographies to Supabase tables with unique UUIDs
  public async syncAllToSupabase(progressCallback?: (curr: number, total: number, bandName: string) => void): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    const all = this.getAll();
    let syncedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < all.length; i++) {
      const b = all[i];
      try {
        progressCallback?.(i + 1, all.length, b.name);
        const res = await this.syncToSupabaseTables(b);
        if (res.success) {
          syncedCount++;
        } else if (res.error) {
          errors.push(`${b.name}: ${res.error}`);
        }
      } catch (err: any) {
        errors.push(`${b.name}: ${err?.message || err}`);
      }
    }

    return { success: errors.length === 0, syncedCount, errors };
  }
}

export const communityBandManager = CommunityBandManager.getInstance();
