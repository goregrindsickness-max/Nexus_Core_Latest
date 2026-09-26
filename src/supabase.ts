/**
 * NexusCore Supabase Service Facade
 * 
 * Modular domain services:
 * - ./services/clientService.ts -> Multi-portal Supabase client factory, session refresh, auth management
 * - ./services/storageService.ts -> WebP transcode/compression, storage uploads, Base64 conversion
 * - ./services/offlineSyncService.ts -> IndexedDB offline write queue, network detection, auto-sync
 * - ./services/schemaResilienceService.ts -> Schema resilience, UUID validation, realtime subscriptions, zip code resolution
 * - ./services/profileService.ts -> Profile normalization, column whitelisting, asset auto-archiving
 * - ./services/bandService.ts -> Band schema sanitization, micro-genre parser, band data mapper
 * - ./services/shopMerchService.ts -> Official shop merch & drop catalog service
 * - ./services/releasesService.ts -> Release catalog service
 */

// 1. Client & Auth Service
export {
  getActivePortalType,
  getSupabaseUrlForPortal,
  getSupabaseAnonKeyForPortal,
  getSupabaseUrl,
  getSupabaseAnonKey,
  SUPABASE_URL,
  SUPABASE_KEY,
  rawClient,
  clearSupabaseClientsCache,
  getRawSupabase,
  ensureValidSupabaseAuthSession,
  getSupabase,
} from './services/clientService';

// 2. Storage & Media Service
export {
  compressAndTranscodeImageToWebP,
  isValidStorageOrImageUrl,
  base64ToBlob,
  uploadBase64ToStorage,
  uploadCommunityBandMedia,
  uploadArchiveFlyer,
  uploadClipVideoFile,
  testPhotoPitStorageConnection,
  ensureImagesUploadedToStorage,
} from './services/storageService';

// 3. Offline Sync & Connectivity Service
export {
  isNetworkOrConnectivityError,
  offlineQueueStore,
  initOfflineQueue,
  getOfflineQueue,
  saveOfflineQueue,
  enqueueOfflineAction,
  processOfflineQueue,
  wrapQueryBuilder,
  isBypassRequiredError,
  handleDatabaseFailover,
  saveToFailoverCache,
} from './services/offlineSyncService';
export type { OfflineAction } from './services/offlineSyncService';

// 4. Schema Resilience & Database Utilities
export {
  sanitizeInventoryItemForDb,
  sanitizeShowForDb,
  generateUUID,
  ensureUUID,
  resolveZipCode,
  executeWithSchemaResilience,
  testSupabaseConnection,
  subscribeToTable,
} from './services/schemaResilienceService';

// 5. User Profile Service
export {
  PROFILES_COLUMNS,
  normalizeLoadedProfile,
  sanitizeProfilePayload,
  sanitizeProfileUpsertPayload,
  extractGlobalProfilePayload,
  autoArchiveProfileAssets,
  executeSanitizedProfileUpsert,
} from './services/profileService';

// 6. Band Domain Service
export {
  PRIMARY_GENRE_KEYWORDS,
  sanitizeMicroGenres,
  parseLocationFields,
  formatBandLocation,
  VALID_BAND_COLUMNS,
  sanitizeBandPayload,
  mapBandData,
  fetchUserBands,
  upsertBandToDatabase,
  verifyAndResyncBandLogo,
} from './services/bandService';

// 6b. Creative Domain Service
export {
  VALID_CREATIVE_COLUMNS,
  sanitizeCreativePayload,
  formatCreativePayload,
  mapCreativeData,
  fetchUserCreatives,
  autoSyncCreativeProfile,
} from './services/creativeService';

// 7. Shop Merch Service
export {
  fetchShopMerchItems,
  createShopMerchItem,
  uploadMerchImageToBucket,
} from './services/shopMerchService';
export type { ShopMerchItem } from './services/shopMerchService';

// 8. Releases Service
export {
  fetchReleasesFromDatabase,
  upsertReleaseToDatabase,
  upsertReleasesBatchToDatabase,
  sanitizeReleaseForDb,
} from './services/releasesService';
export type { CatalogRelease, ReleaseTrack } from './services/releasesService';

// 9. Inventory Service
export {
  INVENTORY_STORAGE_BUCKET,
  DEFAULT_INVENTORY_IMAGE,
  resolveInventoryImageUrl,
  uploadInventoryItemImage,
  fetchInventoryItems,
  saveInventoryItem,
  deleteInventoryItem,
} from './services/inventoryService';
export type { InventoryImageUploadResult } from './services/inventoryService';

// 10. Archive Shows Domain Service
export {
  fetchArchiveShowsFromDatabase,
  saveArchiveShowToDatabase,
  deleteArchiveShowFromDatabase,
  resetArchiveShowInDatabase,
  seedArchiveShowsToTable,
  CANONICAL_DOMINATION_FEST_ARCHIVES,
  sanitizeArchiveShowForDb,
} from './services/archiveShowsService';
export type { ArchiveShowItem } from './services/archiveShowsService';

