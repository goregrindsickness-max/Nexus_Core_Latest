import { inventoryStore, labelCatalogStore } from '../utils/indexedDB';
import { InventoryItem } from '../types';
import { DiscographyRelease } from '../lib/communityBands';

/**
 * Checks whether an item or release is a split / collaborative release
 */
export function isSplitRelease(item: any): boolean {
  if (!item) return false;
  
  if (item.is_split || item.split) return true;
  
  const typeStr = String(item.type || item.release_type || item.item_type || '').toLowerCase().trim();
  if (typeStr === 'split' || typeStr.includes('split')) return true;

  const formatStr = String(item.format || item.subcategory || '').toLowerCase().trim();
  if (formatStr.includes('split')) return true;

  const titleStr = String(item.title || item.name || '').toLowerCase();
  if (titleStr.includes(' split') || titleStr.includes('/ split') || titleStr.includes('split /') || titleStr.includes('split lp') || titleStr.includes('split cd') || titleStr.includes('split 7"')) {
    return true;
  }
  
  // Title contains " / " or " vs " usually designating split releases
  if (titleStr.includes(' / ') || titleStr.includes(' vs. ') || titleStr.includes(' vs ')) {
    return true;
  }

  const collabs = item.collaborators || item.collaborator_ids || item.bands || item.artists || item.band_ids;
  if (Array.isArray(collabs) && collabs.length > 1) {
    return true;
  }

  return false;
}

/**
 * Validates whether an inventory item, merch, or catalog release belongs strictly
 * to the specified band OR is a collaborative split release involving this band.
 */
export function isItemBelongingToBandOrSplit(
  item: any,
  activeBandId?: string | null,
  activeBandName?: string | null
): boolean {
  if (!item) return false;
  if (!activeBandId && !activeBandName) return true;

  const bId = (activeBandId || '').toLowerCase().trim();
  const bName = (activeBandName || '').toLowerCase().trim();

  // 1. Direct band_id matches
  const itemBandId = String(item.band_id || item.bandId || item.artist_id || item.creator_id || '').toLowerCase().trim();
  if (bId && itemBandId) {
    if (itemBandId === bId || itemBandId.includes(bId) || bId.includes(itemBandId)) {
      return true;
    }
  }

  // 2. Direct artist / band name matches
  const itemArtist = String(item.artist || item.artist_name || item.band_name || item.band || '').toLowerCase().trim();
  if (bName && itemArtist) {
    if (itemArtist === bName || itemArtist.includes(bName) || bName.includes(itemArtist)) {
      return true;
    }
  }

  // 3. Split release handling: check if the active band is one of the collaborators
  if (isSplitRelease(item)) {
    // Check collaborators / band lists
    const collabs = item.collaborators || item.collaborator_ids || item.bands || item.artists || item.band_ids;
    if (Array.isArray(collabs)) {
      const matchInCollabs = collabs.some((c: any) => {
        if (typeof c === 'string') {
          const cLower = c.toLowerCase().trim();
          return (bId && (cLower === bId || cLower.includes(bId))) || (bName && (cLower === bName || cLower.includes(bName) || bName.includes(cLower)));
        }
        if (typeof c === 'object' && c) {
          const cId = String(c.id || c.band_id || '').toLowerCase().trim();
          const cN = String(c.name || c.band_name || '').toLowerCase().trim();
          return (bId && (cId === bId || cId.includes(bId))) || (bName && (cN === bName || cN.includes(bName) || bName.includes(cN)));
        }
        return false;
      });
      if (matchInCollabs) return true;
    }

    // Check title / description for band name
    const titleLower = String(item.title || item.name || '').toLowerCase();
    const descLower = String(item.description || '').toLowerCase();
    if (bName && (titleLower.includes(bName) || descLower.includes(bName))) {
      return true;
    }
  }

  // If item doesn't have an explicit band_id and matches band name in title or description
  if (!itemBandId && bName) {
    const titleLower = String(item.title || item.name || '').toLowerCase();
    if (titleLower.includes(bName)) {
      return true;
    }
  }

  return false;
}

/**
 * Filter a list of inventory or catalog items strictly for a specific band and its splits
 */
export function filterItemsForBand<T = any>(
  items: T[],
  activeBandId?: string | null,
  activeBandName?: string | null
): T[] {
  if (!Array.isArray(items)) return [];
  if (!activeBandId && !activeBandName) return items;

  return items.filter(item => isItemBelongingToBandOrSplit(item, activeBandId, activeBandName));
}

/**
 * Generates an alphanumeric SKU for a physical release
 */
function generateMusicSku(bandName: string, albumTitle: string, year?: string): string {
  const cleanBand = (bandName || 'BAND').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  const cleanTitle = (albumTitle || 'ALBUM').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  const y = year || new Date().getFullYear().toString();
  return `MU-${cleanBand}${cleanTitle}-${y}`;
}

/**
 * Synchronizes a band's discography into:
 * 1. Physical Release Inventory (`nexus_master_inventory`)
 * 2. Label Master Releases (`label_catalog_releases`)
 * 3. Digital Music Player tracks (`distro_db_music_tracks_${bandId}`)
 */
export async function syncBandDiscographyToPhysicalAndDigital(
  band: {
    id: string;
    name?: string;
    band_name?: string;
    discography?: DiscographyRelease[];
    avatar_url?: string;
    logo_url?: string;
    genre?: string;
  }
): Promise<{ physicalCreated: number; tracksPopulated: number }> {
  if (!band || !band.id) {
    return { physicalCreated: 0, tracksPopulated: 0 };
  }

  const bandId = band.id;
  const bandName = band.name || band.band_name || 'Band';
  const discography = Array.isArray(band.discography) ? band.discography : [];

  if (discography.length === 0) {
    return { physicalCreated: 0, tracksPopulated: 0 };
  }

  let physicalCreated = 0;
  let tracksPopulated = 0;

  try {
    // -------------------------------------------------------------
    // STEP 1: PHYSICAL RELEASE INVENTORY SYNC
    // -------------------------------------------------------------
    let currentMasterInventory: InventoryItem[] = [];
    try {
      const stored = await inventoryStore.getItem('nexus_master_inventory');
      if (stored) {
        currentMasterInventory = JSON.parse(stored as string);
      } else {
        const local = localStorage.getItem('nexus_master_inventory');
        if (local) currentMasterInventory = JSON.parse(local);
      }
    } catch (_) {}

    const newInventoryItems: InventoryItem[] = [];

    discography.forEach((release, rIdx) => {
      const releaseTitle = release.title?.trim() || `Release #${rIdx + 1}`;
      const coverUrl = release.cover_url || release.cover_image || release.coverUrl || release.image_url || band.avatar_url || band.logo_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600';
      const releaseType = (release.type || 'album').toLowerCase();
      const isSplit = isSplitRelease(release);

      // Check if already exists in master inventory for this band
      const exists = currentMasterInventory.some(inv => {
        const matchesBand = inv.band_id === bandId || (inv as any).artist === bandName;
        const matchesTitle = inv.name?.toLowerCase().includes(releaseTitle.toLowerCase()) || releaseTitle.toLowerCase().includes(inv.name?.toLowerCase() || '');
        return matchesBand && matchesTitle;
      });

      if (!exists) {
        const itemType = isSplit ? 'SPLIT LP / CD' : releaseType === 'single' ? '7" SINGLE' : releaseType === 'ep' ? '12" EP' : 'VINYL / CD';
        const sku = generateMusicSku(bandName, releaseTitle, release.year);

        const newInvItem: InventoryItem = {
          id: release.id || `inv_rel_${bandId}_${rIdx}_${Date.now()}`,
          name: `${releaseTitle}${isSplit ? ' (Split)' : ''}`,
          item_type: itemType,
          price: 25.00,
          table_stock: 20,
          van_stock: 15,
          low_threshold: 5,
          status: 'Healthy',
          image_url: coverUrl,
          band_id: bandId,
          sku: sku,
          barcode: sku,
          unit_weight: '0.6 lbs',
          variants: [
            { id: `var_v_${Date.now()}_${rIdx}`, size: 'Vinyl LP (180g)', stock: '20' },
            { id: `var_c_${Date.now()}_${rIdx}`, size: 'CD Digipak', stock: '15' },
            { id: `var_k_${Date.now()}_${rIdx}`, size: 'Cassette Tape', stock: '10' }
          ],
          is_exclusive: false,
          created_at: new Date().toISOString()
        };

        newInventoryItems.push(newInvItem);
        physicalCreated++;
      }
    });

    if (newInventoryItems.length > 0) {
      const updatedMaster = [...currentMasterInventory, ...newInventoryItems];
      await inventoryStore.setItem('nexus_master_inventory', JSON.stringify(updatedMaster));
      localStorage.setItem('nexus_master_inventory', JSON.stringify(updatedMaster));
      window.dispatchEvent(new CustomEvent('nexus_inventory_updated', { detail: updatedMaster }));
    }

    // -------------------------------------------------------------
    // STEP 2: MASTER CATALOG RELEASES SYNC (`label_catalog_releases`)
    // -------------------------------------------------------------
    let catalogReleases: Record<string, any[]> = {};
    try {
      const cached = await labelCatalogStore.getItem('label_catalog_releases');
      if (cached) {
        catalogReleases = JSON.parse(cached as string);
      } else {
        const local = localStorage.getItem('label_catalog_releases');
        if (local) catalogReleases = JSON.parse(local);
      }
    } catch (_) {}

    const bandReleases = catalogReleases[bandId] || [];
    let catalogUpdated = false;

    discography.forEach((release, rIdx) => {
      const releaseTitle = release.title?.trim() || `Release #${rIdx + 1}`;
      const existsInCatalog = bandReleases.some(r => r.title?.toLowerCase().trim() === releaseTitle.toLowerCase().trim() || r.id === release.id);

      if (!existsInCatalog) {
        const coverUrl = release.cover_url || release.cover_image || release.coverUrl || release.image_url || band.avatar_url || band.logo_url;
        const tracksList = (release.tracks || []).map((t: any, tIdx: number) => ({
          id: t.id || `track_${bandId}_${rIdx}_${tIdx + 1}`,
          num: String(t.num || tIdx + 1),
          title: t.title || `Track ${tIdx + 1}`,
          duration: t.duration || '3:45',
          audioUrl: t.audioUrl || t.url || undefined,
          status: t.audioUrl || t.url ? 'verified' : 'empty'
        }));

        const newCatalogRelease = {
          id: release.id || `rel_${bandId}_${Date.now()}_${rIdx}`,
          band_id: bandId,
          artist: bandName,
          title: releaseTitle,
          type: release.type || 'Album',
          format: 'Heavyweight Vinyl / CD',
          releaseDate: release.year || '2025',
          label: release.label || 'Sovereign Release',
          genre: band.genre || 'Metal',
          coverImage: coverUrl,
          cover_url: coverUrl,
          price: 25.00,
          is_split: isSplitRelease(release),
          formats: {
            vinyl: { warehouse_qty: 100, price: 25.00 },
            cd: { warehouse_qty: 200, price: 15.00 },
            cassette: { warehouse_qty: 150, price: 12.00 }
          },
          tracks: tracksList,
          created_at: new Date().toISOString()
        };

        bandReleases.push(newCatalogRelease);
        catalogUpdated = true;
      }
    });

    if (catalogUpdated) {
      catalogReleases[bandId] = bandReleases;
      await labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(catalogReleases));
      localStorage.setItem('label_catalog_releases', JSON.stringify(catalogReleases));
    }

    // -------------------------------------------------------------
    // STEP 3: DIGITAL MUSIC PLAYER TRACKS SYNC
    // -------------------------------------------------------------
    const tracksStorageKey = `distro_db_music_tracks_${bandId}`;
    let existingPlayerTracks: any[] = [];
    try {
      const storedTracks = localStorage.getItem(tracksStorageKey);
      if (storedTracks) {
        existingPlayerTracks = JSON.parse(storedTracks);
      }
    } catch (_) {}

    const newPlayerTracks = [...existingPlayerTracks];

    discography.forEach((release, rIdx) => {
      const releaseTitle = release.title?.trim() || `Release #${rIdx + 1}`;
      const coverUrl = release.cover_url || release.cover_image || release.coverUrl || release.image_url || band.avatar_url || band.logo_url;

      if (Array.isArray(release.tracks) && release.tracks.length > 0) {
        release.tracks.forEach((track: any, tIdx: number) => {
          const trackTitle = track.title?.trim() || `Track ${tIdx + 1}`;
          const trackExists = newPlayerTracks.some(
            t => (t.title?.toLowerCase() === trackTitle.toLowerCase() && t.albumTitle?.toLowerCase() === releaseTitle.toLowerCase()) ||
                 (t.id && t.id === track.id)
          );

          if (!trackExists) {
            newPlayerTracks.push({
              id: track.id || `player_track_${bandId}_${rIdx}_${tIdx + 1}`,
              title: trackTitle,
              albumTitle: releaseTitle,
              album_id: release.id,
              trackNum: tIdx + 1,
              duration: track.duration || '3:45',
              url: track.audioUrl || track.url || '',
              cover_url: coverUrl,
              release_year: release.year || '2025',
              fileType: track.audioUrl || track.url ? 'WAV / MP3 Stream' : 'Awaiting Master Audio',
              track_preview_mode: '30_SEC_CLIP',
              track_price: 1.00,
              track_visibility: true,
              hasAudio: Boolean(track.audioUrl || track.url),
              band_id: bandId,
              band_name: bandName
            });
            tracksPopulated++;
          }
        });
      } else {
        // Single/EP/Demo with no itemized tracklist: create track representing title
        const trackExists = newPlayerTracks.some(
          t => t.title?.toLowerCase() === releaseTitle.toLowerCase() && t.albumTitle?.toLowerCase() === releaseTitle.toLowerCase()
        );

        if (!trackExists) {
          newPlayerTracks.push({
            id: `player_track_${bandId}_${rIdx}_main`,
            title: releaseTitle,
            albumTitle: releaseTitle,
            album_id: release.id,
            trackNum: 1,
            duration: '4:15',
            url: release.cover_url?.endsWith('.mp3') ? release.cover_url : '',
            cover_url: coverUrl,
            release_year: release.year || '2025',
            fileType: 'Awaiting Master Audio',
            track_preview_mode: '30_SEC_CLIP',
            track_price: 1.00,
            track_visibility: true,
            hasAudio: false,
            band_id: bandId,
            band_name: bandName
          });
          tracksPopulated++;
        }
      }
    });

    if (tracksPopulated > 0 || !localStorage.getItem(tracksStorageKey)) {
      localStorage.setItem(tracksStorageKey, JSON.stringify(newPlayerTracks));
      // Also sync active distro tracks if active band is this band
      const activeDistroBand = localStorage.getItem('distro_db_active_band_id');
      if (activeDistroBand === bandId || !localStorage.getItem('distro_db_music_tracks')) {
        localStorage.setItem('distro_db_music_tracks', JSON.stringify(newPlayerTracks));
      }
      window.dispatchEvent(new CustomEvent('nexus_distro_tracks_updated', { detail: { bandId, tracks: newPlayerTracks } }));
    }

  } catch (err) {
    console.warn('[discographySyncService] Error during auto-sync:', err);
  }

  return { physicalCreated, tracksPopulated };
}

/**
 * Attaches an audio file (or URL) directly to an existing track's metadata for a band
 */
export function attachAudioToTrack(
  bandId: string,
  trackId: string,
  audioData: {
    url: string;
    fileName?: string;
    fileSize?: string;
    duration?: string;
    fileType?: string;
  }
): boolean {
  try {
    const storageKey = `distro_db_music_tracks_${bandId}`;
    const raw = localStorage.getItem(storageKey) || localStorage.getItem('distro_db_music_tracks');
    if (!raw) return false;

    const tracks: any[] = JSON.parse(raw);
    const updated = tracks.map(t => {
      if (t.id === trackId || t.title?.toLowerCase() === trackId.toLowerCase()) {
        return {
          ...t,
          url: audioData.url,
          fileName: audioData.fileName || t.fileName,
          fileSize: audioData.fileSize || t.fileSize,
          duration: audioData.duration || t.duration,
          fileType: audioData.fileType || 'MP3 / WAV (Direct Master)',
          hasAudio: true
        };
      }
      return t;
    });

    localStorage.setItem(storageKey, JSON.stringify(updated));
    localStorage.setItem('distro_db_music_tracks', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nexus_distro_tracks_updated', { detail: { bandId, tracks: updated } }));
    return true;
  } catch (e) {
    console.error('[discographySyncService] Failed to attach audio:', e);
    return false;
  }
}
