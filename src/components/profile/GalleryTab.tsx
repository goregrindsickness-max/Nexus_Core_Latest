import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getSupabase } from '../../supabase';
import { Search, Folder, ImageIcon, X, RefreshCw } from 'lucide-react';
import { socialFeedStore, profileStore, creativeNodesStore } from '../../utils/indexedDB';
import { getDeletedPostIdsLocal } from '../social/utils/feedCacheUtils';
import { normalizeImageUrl, purgeStaleIndexedDBPhotos } from '../../utils/photoPitSyncUtils';

interface GalleryTabProps {
  profileId?: string;
  userId?: string;
  profileName?: string;
  isYou?: boolean;
  selectedUserProfile?: any;
  userProfile?: any;
  workspaceType?: string;
  currentActiveWorkspace?: string;
  portalRole?: string;
  triggerPictureViewer?: (data: any) => void;
  setSelectedGalleryItem?: (item: any) => void;
  feed?: any[];
}

const DEFAULT_FOLDERS = ['All Photos', 'Profile Pics', 'Cover Images'];

// Helper to filter out hard-coded placeholder mock images (CMYK silk-screen, concert lighting crowd, guitarist stock image)
const isHardcodedPlaceholder = (imgUrl?: string, title?: string, id?: string) => {
  if (!imgUrl || typeof imgUrl !== 'string') return true;
  const lowerUrl = imgUrl.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();
  const lowerId = (id || '').toLowerCase();

  // 1. Brutal CMYK Silk-screen Index Concept
  if (
    lowerUrl.includes('1541701494587') ||
    lowerTitle.includes('brutal cmyk') ||
    lowerId === 'gal-1' ||
    lowerId.includes('brutal_cmyk')
  ) {
    return true;
  }

  // 2. Live Concert Stage Lighting Vector Matrix
  if (
    lowerUrl.includes('1514525253161') ||
    lowerTitle.includes('live concert stage lighting') ||
    lowerId === 'gal-2' ||
    lowerId.includes('live_concert')
  ) {
    return true;
  }

  // 3. Guitarist / Gothic placeholder stock images
  if (
    lowerUrl.includes('1511671782779') ||
    lowerUrl.includes('1498038432885') ||
    lowerTitle.includes('gothic album design') ||
    lowerId === 'gal-3' ||
    lowerId.includes('gothic_album')
  ) {
    return true;
  }

  // Generic fallback banner placeholder
  if (lowerUrl.includes('1618005182384')) {
    return true;
  }

  return false;
};

const MOCK_FOLDERS_TO_REMOVE = new Set([
  'tour & live',
  'backstage & gear',
  'studio & rehearsals',
  'fan album',
  'official promo',
  'backstage pass',
]);

export const normalizeFolderName = (f?: string): string => {
  if (!f) return '';
  let str = String(f).trim();
  // Standardize single and double quotes (curly quotes, backticks, escaped quotes)
  str = str.replace(/[\u2018\u2019\u201A\u201B`\\]/g, "'");
  str = str.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  // Normalize whitespace around slashes: "designed / revamped" -> "designed/revamped"
  str = str.replace(/\s*\/\s*/g, '/');
  // Normalize consecutive spaces
  str = str.replace(/\s+/g, ' ');

  if (str.toLowerCase() === 'profile photos' || str.toLowerCase() === 'profile pics') return 'Profile Pics';
  if (str.toLowerCase() === 'cover photos' || str.toLowerCase() === 'cover images' || str.toLowerCase() === 'cover banner') return 'Cover Images';
  return str;
};

export const areFoldersEqual = (a?: string, b?: string): boolean => {
  if (!a || !b) return false;
  if (a === b) return true;
  const normA = normalizeFolderName(a).toLowerCase();
  const normB = normalizeFolderName(b).toLowerCase();
  if (normA === normB) return true;
  const strip = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sA = strip(normA);
  const sB = strip(normB);
  return sA.length > 0 && sA === sB;
};

export const GalleryTab: React.FC<GalleryTabProps> = ({
  profileId,
  userId,
  profileName = '',
  isYou = false,
  selectedUserProfile,
  userProfile,
  workspaceType,
  currentActiveWorkspace,
  portalRole,
  triggerPictureViewer,
  setSelectedGalleryItem,
  feed,
}) => {
  const [images, setImages] = useState<any[]>([]);
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState<string>('All Photos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set());

  const handleSyncGallery = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  // Listen for real-time photo replacement or upload events across the app
  useEffect(() => {
    const handlePhotoUpdate = () => {
      setReloadTrigger((prev) => prev + 1);
    };

    window.addEventListener('nexus_photos_updated', handlePhotoUpdate);
    window.addEventListener('storage', handlePhotoUpdate);
    return () => {
      window.removeEventListener('nexus_photos_updated', handlePhotoUpdate);
      window.removeEventListener('storage', handlePhotoUpdate);
    };
  }, []);

  // Keep latest props in ref to prevent infinite callback recreation
  const propsRef = useRef({
    profileId,
    userId,
    profileName,
    isYou,
    selectedUserProfile,
    userProfile,
    workspaceType,
    currentActiveWorkspace,
    portalRole,
    feed,
  });
  propsRef.current = {
    profileId,
    userId,
    profileName,
    isYou,
    selectedUserProfile,
    userProfile,
    workspaceType,
    currentActiveWorkspace,
    portalRole,
    feed,
  };

  // Derive resolved workspace type
  const targetWorkspaceType = (
    workspaceType ||
    portalRole ||
    currentActiveWorkspace ||
    selectedUserProfile?.portalRole ||
    selectedUserProfile?.workspaceType ||
    selectedUserProfile?.account_type ||
    selectedUserProfile?.role ||
    ''
  ).toLowerCase();

  const isBandWorkspace =
    targetWorkspaceType.includes('band') ||
    targetWorkspaceType.includes('artist') ||
    Boolean(selectedUserProfile?.band_name || selectedUserProfile?.bandName);

  const isCreativeWorkspace =
    !isBandWorkspace &&
    (targetWorkspaceType.includes('creative') ||
      targetWorkspaceType.includes('industry') ||
      Boolean(selectedUserProfile?.creative_id || selectedUserProfile?.creative_metadata));

  const isPromoterWorkspace =
    !isBandWorkspace &&
    !isCreativeWorkspace &&
    (targetWorkspaceType.includes('promoter') || Boolean(selectedUserProfile?.promoter_metadata));

  const isLabelWorkspace =
    !isBandWorkspace &&
    !isCreativeWorkspace &&
    !isPromoterWorkspace &&
    (targetWorkspaceType.includes('label') || Boolean(selectedUserProfile?.label_company_name));

  // Derive primitive stable keys for useEffect triggers
  const primaryId = String(
    isBandWorkspace
      ? (profileId ||
          selectedUserProfile?.id ||
          selectedUserProfile?.uuid ||
          selectedUserProfile?.band_id ||
          selectedUserProfile?.bandId ||
          userId ||
          '')
      : isCreativeWorkspace
      ? (profileId ||
          selectedUserProfile?.creative_id ||
          selectedUserProfile?.registered_creative_id ||
          selectedUserProfile?.creator_id ||
          selectedUserProfile?.id ||
          selectedUserProfile?.uuid ||
          userId ||
          '')
      : (profileId ||
          userId ||
          selectedUserProfile?.id ||
          selectedUserProfile?.uuid ||
          selectedUserProfile?.user_id ||
          userProfile?.id ||
          userProfile?.uuid ||
          '')
  ).trim();

  const userAvatarKey = String(
    isBandWorkspace
      ? (selectedUserProfile?.logo_url || selectedUserProfile?.avatar_url || selectedUserProfile?.avatar || selectedUserProfile?.band_logo || '')
      : isCreativeWorkspace
      ? (selectedUserProfile?.creative_avatar || selectedUserProfile?.avatar_url || selectedUserProfile?.avatar || '')
      : isPromoterWorkspace
      ? (selectedUserProfile?.promoter_logo || selectedUserProfile?.avatar_url || selectedUserProfile?.avatar || '')
      : isLabelWorkspace
      ? (selectedUserProfile?.label_avatar || selectedUserProfile?.avatar_url || selectedUserProfile?.avatar || '')
      : (selectedUserProfile?.avatar_url || selectedUserProfile?.avatar || userProfile?.avatar_url || userProfile?.avatar || '')
  ).trim();

  const userBannerKey = String(
    isBandWorkspace
      ? (selectedUserProfile?.cover_url || selectedUserProfile?.banner_url || selectedUserProfile?.banner || '')
      : isCreativeWorkspace
      ? (selectedUserProfile?.creative_banner || selectedUserProfile?.banner_url || selectedUserProfile?.banner || '')
      : isPromoterWorkspace
      ? (selectedUserProfile?.promoter_cover_image || selectedUserProfile?.banner_url || selectedUserProfile?.banner || '')
      : isLabelWorkspace
      ? (selectedUserProfile?.label_banner || selectedUserProfile?.banner_url || selectedUserProfile?.banner || '')
      : (selectedUserProfile?.banner_url || selectedUserProfile?.cover_url || userProfile?.banner_url || userProfile?.cover_url || '')
  ).trim();

  const profileCustomFoldersKey = JSON.stringify(
    isBandWorkspace
      ? (selectedUserProfile?.photo_folders || [])
      : (selectedUserProfile?.photo_folders || userProfile?.photo_folders || [])
  );

  useEffect(() => {
    let isMounted = true;

    const loadGallery = async () => {
      if (!primaryId) {
        if (isMounted) {
          setImages([]);
          setFolders(DEFAULT_FOLDERS);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
      }

      try {
        const curSelected = propsRef.current.selectedUserProfile;
        const curUser = propsRef.current.userProfile;
        const curFeed = propsRef.current.feed || [];
        const curIsYou = propsRef.current.isYou;
        const curProfileName = propsRef.current.profileName || curSelected?.name || 'Nexus Member';

        // 1. Gather candidate IDs strictly scoped to the active workspace
        const candidateIdSet = new Set<string>();

        if (isBandWorkspace) {
          // Band workspace: ONLY include identifiers belonging to this specific band
          [
            primaryId,
            propsRef.current.profileId,
            curSelected?.id,
            curSelected?.uuid,
            curSelected?.band_id,
            curSelected?.bandId,
            curSelected?.custom_slug,
            curSelected?.slug,
          ].forEach((item) => {
            if (item && typeof item === 'string' && item.trim()) {
              candidateIdSet.add(item.trim());
            }
          });
        } else if (isCreativeWorkspace) {
          // Creative workspace: Include creative node and portfolio identifiers
          [
            primaryId,
            propsRef.current.profileId,
            propsRef.current.userId,
            curSelected?.id,
            curSelected?.uuid,
            curSelected?.creator_id,
            curSelected?.registered_creative_id,
            curSelected?.creative_id,
            curSelected?.creative_metadata?.creative_id,
            curSelected?.console_handle,
            curSelected?.creative_handle,
            curSelected?.business_name,
          ].forEach((item) => {
            if (item && typeof item === 'string' && item.trim()) {
              candidateIdSet.add(item.trim());
            }
          });

          if (curIsYou) {
            [
              curUser?.creator_id,
              curUser?.registered_creative_id,
              curUser?.creative_id,
              curUser?.creative_metadata?.creative_id,
            ].forEach((item) => {
              if (item && typeof item === 'string' && item.trim()) {
                candidateIdSet.add(item.trim());
              }
            });
          }
        } else if (isPromoterWorkspace) {
          [
            primaryId,
            propsRef.current.profileId,
            curSelected?.id,
            curSelected?.uuid,
            curSelected?.promoter_id,
          ].forEach((item) => {
            if (item && typeof item === 'string' && item.trim()) {
              candidateIdSet.add(item.trim());
            }
          });
        } else if (isLabelWorkspace) {
          [
            primaryId,
            propsRef.current.profileId,
            curSelected?.id,
            curSelected?.uuid,
            curSelected?.label_id,
          ].forEach((item) => {
            if (item && typeof item === 'string' && item.trim()) {
              candidateIdSet.add(item.trim());
            }
          });
        } else {
          // Fan / General Profile
          [
            primaryId,
            propsRef.current.profileId,
            propsRef.current.userId,
            curSelected?.id,
            curSelected?.uuid,
            curSelected?.user_id,
            curUser?.id,
            curUser?.uuid,
            curUser?.user_id,
          ].forEach((item) => {
            if (item && typeof item === 'string' && item.trim()) {
              candidateIdSet.add(item.trim());
            }
          });

          if (typeof window !== 'undefined' && curIsYou) {
            const activeUuid = localStorage.getItem('nexus_active_user_uuid');
            const activeProfileId = localStorage.getItem('nexus_active_profile_id');
            const activeUserId = localStorage.getItem('nexus_user_profile_id');
            if (activeUuid) candidateIdSet.add(activeUuid);
            if (activeProfileId) candidateIdSet.add(activeProfileId);
            if (activeUserId) candidateIdSet.add(activeUserId);
          }
        }

        const candidateIds = Array.from(candidateIdSet);

        // 2. Retrieve custom folders scoped to this workspace
        let storedFolders: string[] = [];

        if (isBandWorkspace) {
          // Band folders only
          const bandFolders = curSelected?.photo_folders;
          if (Array.isArray(bandFolders)) {
            storedFolders.push(...bandFolders);
          }
          candidateIds.forEach((id) => {
            try {
              const bandKeys = [
                `nexus_photo_folders_band_${id}`,
                `nexus_band_photo_folders_${id}`,
              ];
              bandKeys.forEach((k) => {
                const saved = localStorage.getItem(k);
                if (saved) {
                  const parsed = JSON.parse(saved);
                  if (Array.isArray(parsed)) {
                    storedFolders.push(...parsed);
                  }
                }
              });
            } catch (e) {}
          });
        } else if (isCreativeWorkspace) {
          // Creative folders
          const creativeFolders = curSelected?.photo_folders || curUser?.photo_folders;
          if (Array.isArray(creativeFolders)) {
            storedFolders.push(...creativeFolders);
          }
          candidateIds.forEach((id) => {
            try {
              const creativeKeys = [
                `nexus_photo_folders_${id}_creative`,
                `nexus_photo_folders_creative_${id}`,
                `nexus_photo_folders_${id}`,
              ];
              creativeKeys.forEach((k) => {
                const saved = localStorage.getItem(k);
                if (saved) {
                  const parsed = JSON.parse(saved);
                  if (Array.isArray(parsed)) {
                    storedFolders.push(...parsed);
                  }
                }
              });
            } catch (e) {}
          });
        } else {
          // General / Other workspace folders
          const profileFolders = curSelected?.photo_folders || curUser?.photo_folders || [];
          if (Array.isArray(profileFolders)) {
            storedFolders.push(...profileFolders);
          }
          candidateIds.forEach((id) => {
            try {
              const saved = localStorage.getItem(`nexus_photo_folders_${id}`);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                  storedFolders.push(...parsed);
                }
              }
            } catch (e) {}
          });
        }

        // Helper to determine if a post strictly matches the current workspace
        const bandName = (
          curSelected?.band_name ||
          curSelected?.bandName ||
          curSelected?.name ||
          propsRef.current.profileName ||
          ''
        ).toLowerCase().trim();

        const isPostForActiveWorkspace = (p: any): boolean => {
          if (!p) return false;
          const postWorkspace = (p.workspace_type || p.data?.workspace_type || '').toLowerCase();
          const authorRole = (p.author?.role || p.data?.author?.role || '').toLowerCase();
          const authorName = (p.author?.name || p.data?.author?.name || p.authorName || '').toLowerCase().trim();
          const pProfId = p.profile_id || p.data?.profile_id || p.data?.postedBy || p.author?.id;
          const pUserId = p.user_id || p.data?.user_id;

          if (isBandWorkspace) {
            // STRICT ISOLATION: Reject if explicitly tagged as creative, industry pro, promoter, or label
            if (
              postWorkspace.includes('creative') ||
              postWorkspace.includes('industry') ||
              postWorkspace.includes('promoter') ||
              postWorkspace.includes('label')
            ) {
              return false;
            }
            if (
              authorRole.includes('creative') ||
              authorRole.includes('industry') ||
              authorRole.includes('graphic') ||
              authorRole.includes('promoter') ||
              authorRole.includes('label')
            ) {
              return false;
            }

            // Exclude user's creative/industry IDs if present
            if (curUser?.creator_id && (pProfId === curUser.creator_id || pUserId === curUser.creator_id)) {
              return false;
            }
            if (curUser?.registered_creative_id && (pProfId === curUser.registered_creative_id || pUserId === curUser.registered_creative_id)) {
              return false;
            }

            // Accept if matching band candidate IDs or band name
            if (pProfId && candidateIds.includes(pProfId)) return true;
            if (p.data?.band_id && candidateIds.includes(p.data.band_id)) return true;
            if (p.data?.bandId && candidateIds.includes(p.data.bandId)) return true;
            if (bandName && authorName && (authorName === bandName || authorName.includes(bandName))) return true;
            if (postWorkspace === 'band' && (pProfId && candidateIds.includes(pProfId))) return true;
            return false;
          }

          if (isCreativeWorkspace) {
            // STRICT ISOLATION: Reject band posts
            if (postWorkspace === 'band' || authorRole.includes('artist') || authorRole.includes('band')) {
              return false;
            }
            if (pProfId && candidateIds.includes(pProfId)) return true;
            if (pUserId && candidateIds.includes(pUserId)) return true;
            return false;
          }

          if (isPromoterWorkspace) {
            if (postWorkspace && postWorkspace !== 'promoter') return false;
            if (pProfId && candidateIds.includes(pProfId)) return true;
            return false;
          }

          if (isLabelWorkspace) {
            if (postWorkspace && postWorkspace !== 'label') return false;
            if (pProfId && candidateIds.includes(pProfId)) return true;
            return false;
          }

          // Fan / fallback
          if (pProfId && candidateIds.includes(pProfId)) return true;
          if (pUserId && candidateIds.includes(pUserId)) return true;
          if (curIsYou && (p.author?.isYou || p.isYou)) return true;
          return false;
        };

        // 3. Query Supabase posts
        const supabase = getSupabase();
        let dbRows: any[] = [];
        if (supabase && candidateIds.length > 0) {
          try {
            const orFilter = candidateIds
              .map((id) => `profile_id.eq.${id},user_id.eq.${id}`)
              .join(',');

            const { data, error: selectErr } = await supabase
              .from('nexus_posts')
              .select('*')
              .or(orFilter)
              .limit(2000)
              .order('created_at', { ascending: false });

            if (!selectErr && Array.isArray(data)) {
              dbRows = data.filter(isPostForActiveWorkspace);
            } else if (selectErr) {
              console.warn('[GalleryTab] Posts fetch notice:', selectErr);
            }
          } catch (err) {
            console.warn('[GalleryTab] Query execution notice:', err);
          }
        }

        // 4. In-memory / cached feed posts and local storage archives
        const feedCandidatePosts: any[] = [];
        const deletedPostIds = new Set<string>(getDeletedPostIdsLocal());

        if (Array.isArray(curFeed) && curFeed.length > 0) {
          curFeed.forEach((p) => {
            if (!p) return;
            const pid = String(p.id || p.data?.id || '');
            if (deletedPostIds.has(pid)) return;

            if (isPostForActiveWorkspace(p)) {
              feedCandidatePosts.push(p);
            }
          });
        }

        // Read local storage feed and gallery caches
        try {
          const cacheKeys = [
            'nexus_feed',
            'nexus_feed_posts',
            'nexus_social_feed_cache',
            'nexus_social_feed_v2',
            'nexus_dbUserPosts',
          ];
          cacheKeys.forEach((key) => {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                parsed.forEach((p: any) => {
                  if (!p) return;
                  const pid = String(p.id || p.data?.id || '');
                  if (deletedPostIds.has(pid)) return;

                  if (isPostForActiveWorkspace(p)) {
                    feedCandidatePosts.push(p);
                  }
                });
              }
            }
          });

          // ONLY for creative workspace: Check direct creative gallery items and nodes in localStorage/IndexedDB
          if (isCreativeWorkspace) {
            candidateIds.forEach((id) => {
              const creativeGalleryKey = `nexus_core_creative_gallery_${id}`;
              const raw = localStorage.getItem(creativeGalleryKey);
              if (raw) {
                try {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed)) {
                    const cleaned = parsed.filter((item: any) => {
                      const imgUrl = item?.imageUrl || item?.url || item?.image;
                      return item && imgUrl && !isHardcodedPlaceholder(imgUrl, item.title, item.id);
                    });
                    if (cleaned.length !== parsed.length) {
                      localStorage.setItem(creativeGalleryKey, JSON.stringify(cleaned));
                    }
                    cleaned.forEach((item: any) => {
                      const imgUrl = item.imageUrl || item.url || item.image;
                      feedCandidatePosts.push({
                        id: item.id || `creative_gal_${id}_${item.title}`,
                        profile_id: id,
                        user_id: id,
                        image: imgUrl,
                        content: item.title || item.subtitle || 'Creative Portfolio Piece',
                        gallery_folder: item.folder || item.gallery_folder || 'Portfolio Work',
                        timestamp: item.year || 'Portfolio Work',
                      });
                    });
                  }
                } catch (_) {}
              }
            });

            try {
              const nodeKeys = await creativeNodesStore.keys();
              for (const nk of nodeKeys) {
                const nodeItem = await creativeNodesStore.getItem<any>(nk);
                if (nodeItem && (nodeItem.imageUrl || nodeItem.url || nodeItem.image)) {
                  const nodeCreator = nodeItem.creator_id || nodeItem.user_id;
                  if (nodeCreator && candidateIds.includes(nodeCreator)) {
                    feedCandidatePosts.push({
                      id: nodeItem.id || `node_${nk}`,
                      profile_id: nodeCreator,
                      user_id: nodeCreator,
                      image: nodeItem.imageUrl || nodeItem.url || nodeItem.image,
                      content: nodeItem.title || nodeItem.name || 'Creative Asset',
                      gallery_folder: nodeItem.folder || nodeItem.gallery_folder || 'Portfolio Work',
                      timestamp: nodeItem.timestamp || 'Portfolio Item',
                    });
                  }
                }
              }
            } catch (nodeErr) {
              console.warn('[GalleryTab] Creative nodes fetch notice:', nodeErr);
            }
          }

          // Scan IndexedDB feed with workspace isolation
          try {
            const feedKeys = await socialFeedStore.keys();
            for (const fk of feedKeys) {
              const cachedFeed = await socialFeedStore.getItem<any[]>(fk);
              if (Array.isArray(cachedFeed)) {
                cachedFeed.forEach((p: any) => {
                  if (!p) return;
                  const pid = String(p.id || p.data?.id || '');
                  if (deletedPostIds.has(pid)) return;

                  if (isPostForActiveWorkspace(p)) {
                    feedCandidatePosts.push(p);
                  }
                });
              }
            }
          } catch (idbErr) {
            console.warn('[GalleryTab] IndexedDB fetch notice:', idbErr);
          }
        } catch (e) {}

        // Trigger asynchronous background cleanup of stale IndexedDB photos if dbRows available
        if (dbRows.length > 0 && primaryId) {
          const authIds = dbRows.map((r) => r.id);
          const authUrls = dbRows.map((r) => r.media_url || r.image).filter(Boolean);
          purgeStaleIndexedDBPhotos(primaryId, authIds, authUrls).catch(() => {});
        }

        // 5. Aggregate images with robust deduplication and unique ID guarantees
        const allImages: any[] = [];
        const seenUrls = new Set<string>();
        const seenImageIds = new Set<string>();
        const seenPostCombos = new Set<string>();
        const postFolders = new Set<string>();

        const cleanUrlForDedupe = (u: string) => {
          if (!u || typeof u !== 'string') return '';
          return normalizeImageUrl(u);
        };

        const processPostObject = (postObj: any, rawPostId?: string, rawCreatedAt?: string) => {
          if (!postObj) return;
          if (!isPostForActiveWorkspace(postObj)) return;

          const postId = String(rawPostId || postObj.id || '');
          if (postId.startsWith('mock_') || postObj.isMock || deletedPostIds.has(postId)) return;

          const rawFolderCandidate =
            postObj.gallery_folder ||
            postObj.folder ||
            postObj.album ||
            postObj.galleryFolder ||
            postObj.album_name ||
            postObj.albumName ||
            postObj.category ||
            postObj.data?.gallery_folder ||
            postObj.data?.folder ||
            postObj.data?.album ||
            postObj.data?.galleryFolder ||
            postObj.data?.album_name;

          let rawFolder = normalizeFolderName(rawFolderCandidate);
          if (!rawFolder || MOCK_FOLDERS_TO_REMOVE.has(rawFolder.toLowerCase())) {
            rawFolder = 'All Photos';
          }
          if (!areFoldersEqual(rawFolder, 'All Photos')) {
            postFolders.add(rawFolder);
          }

          const postImages: string[] = [];
          if (Array.isArray(postObj.images) && postObj.images.length > 0) {
            postObj.images.forEach((img: any) => {
              if (typeof img === 'string' && img.trim()) postImages.push(img.trim());
              else if (img && typeof img.url === 'string' && img.url.trim()) postImages.push(img.url.trim());
              else if (img && typeof img.imageUrl === 'string' && img.imageUrl.trim()) postImages.push(img.imageUrl.trim());
            });
          }
          if (postImages.length === 0) {
            const singleImg =
              postObj.image ||
              postObj.media_url ||
              postObj.imageUrl ||
              postObj.photo_url ||
              postObj.url ||
              postObj.data?.image ||
              postObj.data?.media_url;
            if (typeof singleImg === 'string' && singleImg.trim()) {
              postImages.push(singleImg.trim());
            }
          }

          postImages.forEach((img: string, idx: number) => {
            if (!img || typeof img !== 'string' || !img.trim()) return;

            // Reject any hard-coded mock placeholder images
            if (isHardcodedPlaceholder(img, postObj.content || postObj.title, postId)) {
              return;
            }

            const normalizedUrl = cleanUrlForDedupe(img);
            const comboKey = `${postId}_img_${idx}`;

            if (seenPostCombos.has(comboKey) || (normalizedUrl && seenUrls.has(normalizedUrl)) || seenUrls.has(img)) {
              return;
            }

            seenPostCombos.add(comboKey);
            if (normalizedUrl) seenUrls.add(normalizedUrl);
            seenUrls.add(img);

            let uniqueId = `${postId || 'post'}_img_${idx}`;
            if (seenImageIds.has(uniqueId)) {
              let suffix = 1;
              while (seenImageIds.has(`${uniqueId}_${suffix}`)) {
                suffix++;
              }
              uniqueId = `${uniqueId}_${suffix}`;
            }
            seenImageIds.add(uniqueId);

            allImages.push({
              id: uniqueId,
              url: img,
              caption: postObj.content || postObj.title || 'Photo Pit Upload',
              timestamp: rawCreatedAt || postObj.timestamp || postObj.created_at || 'Recently',
              folder: rawFolder,
              authorName: postObj.author?.name || curSelected?.name || curProfileName || 'Nexus Member',
              authorAvatar: postObj.author?.avatar || curSelected?.avatar_url || curSelected?.avatar || '',
              authorRole: postObj.author?.role || curSelected?.role || (isBandWorkspace ? 'Artist' : 'Creative Pro'),
              post: postObj,
            });
          });
        };

        dbRows.forEach((row: any) => {
          const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : row.data || {};
          const mergedObj = {
            ...postObj,
            ...row,
            data: postObj,
            id: row.id || postObj.id,
            profile_id: row.profile_id || postObj.profile_id,
            user_id: row.user_id || postObj.user_id,
            media_url: row.media_url || postObj.media_url || postObj.image,
            image: row.media_url || postObj.image || postObj.media_url,
            content: row.content || postObj.content || '',
            gallery_folder: row.gallery_folder || postObj.gallery_folder || row.folder || postObj.folder || row.album || postObj.album || 'All Photos',
            timestamp: row.created_at || postObj.timestamp,
          };
          processPostObject(mergedObj, row.id, row.created_at);
        });

        feedCandidatePosts.forEach((feedPost: any) => {
          const postObj = typeof feedPost.data === 'string' ? JSON.parse(feedPost.data) : feedPost.data || feedPost;
          processPostObject({ ...postObj, ...feedPost }, feedPost.id, feedPost.created_at);
        });

        // 6. Include active avatar & banner strictly for this workspace
        const userAvatar = isBandWorkspace
          ? (curSelected?.logo_url || curSelected?.avatar_url || curSelected?.avatar || curSelected?.band_logo)
          : isCreativeWorkspace
          ? (curSelected?.creative_avatar || curSelected?.avatar_url || curSelected?.avatar)
          : isPromoterWorkspace
          ? (curSelected?.promoter_logo || curSelected?.avatar_url || curSelected?.avatar)
          : isLabelWorkspace
          ? (curSelected?.label_avatar || curSelected?.avatar_url || curSelected?.avatar)
          : (curSelected?.avatar_url || curSelected?.avatar || curUser?.avatar_url || curUser?.avatar);

        if (
          userAvatar &&
          typeof userAvatar === 'string' &&
          userAvatar.trim() &&
          !userAvatar.startsWith('data:') &&
          !isHardcodedPlaceholder(userAvatar, 'Current Profile Picture')
        ) {
          const normAvatar = cleanUrlForDedupe(userAvatar);
          if (!seenUrls.has(normAvatar) && !seenUrls.has(userAvatar)) {
            if (normAvatar) seenUrls.add(normAvatar);
            seenUrls.add(userAvatar);
            let avatarId = `profile_avatar_${primaryId}`;
            if (seenImageIds.has(avatarId)) {
              avatarId = `${avatarId}_${Date.now()}`;
            }
            seenImageIds.add(avatarId);
            allImages.push({
              id: avatarId,
              url: userAvatar,
              caption: isBandWorkspace ? 'Band Official Logo' : 'Current Profile Picture',
              timestamp: 'Active',
              folder: 'Profile Pics',
              authorName: curSelected?.name || curProfileName || 'Nexus Member',
              authorAvatar: userAvatar,
              authorRole: isBandWorkspace ? 'Artist' : curSelected?.role || 'Member',
            });
          }
        }

        const userCover = isBandWorkspace
          ? (curSelected?.cover_url || curSelected?.banner_url || curSelected?.banner)
          : isCreativeWorkspace
          ? (curSelected?.creative_banner || curSelected?.banner_url || curSelected?.banner)
          : isPromoterWorkspace
          ? (curSelected?.promoter_cover_image || curSelected?.banner_url || curSelected?.banner)
          : isLabelWorkspace
          ? (curSelected?.label_banner || curSelected?.banner_url || curSelected?.banner)
          : (curSelected?.banner_url || curSelected?.cover_url || curUser?.banner_url || curUser?.cover_url);

        if (
          userCover &&
          typeof userCover === 'string' &&
          userCover.trim() &&
          !userCover.startsWith('data:') &&
          !isHardcodedPlaceholder(userCover, 'Current Cover Banner')
        ) {
          const normCover = cleanUrlForDedupe(userCover);
          if (!seenUrls.has(normCover) && !seenUrls.has(userCover)) {
            if (normCover) seenUrls.add(normCover);
            seenUrls.add(userCover);
            let coverId = `profile_cover_${primaryId}`;
            if (seenImageIds.has(coverId)) {
              coverId = `${coverId}_${Date.now()}`;
            }
            seenImageIds.add(coverId);
            allImages.push({
              id: coverId,
              url: userCover,
              caption: isBandWorkspace ? 'Band Stage Banner' : 'Current Cover Banner',
              timestamp: 'Active',
              folder: 'Cover Images',
              authorName: curSelected?.name || curProfileName || 'Nexus Member',
              authorAvatar: userAvatar || '',
              authorRole: isBandWorkspace ? 'Artist' : curSelected?.role || 'Member',
            });
          }
        }

        // 7. Assemble deduplicated clean folders list
        let deletedFolders: string[] = [];
        try {
          const deletedKey = `nexus_deleted_folders_${primaryId || userId || profileId || 'guest'}`;
          const parsedDeleted = JSON.parse(localStorage.getItem(deletedKey) || '[]');
          if (Array.isArray(parsedDeleted)) {
            deletedFolders = parsedDeleted.map((d: string) => d.toLowerCase());
          }
        } catch (_) {}

        const rawFolderList = [
          ...DEFAULT_FOLDERS,
          ...storedFolders,
          ...Array.from(postFolders),
        ];

        const cleanedFolders: string[] = [];
        rawFolderList.forEach((f) => {
          const norm = normalizeFolderName(f);
          if (!norm || MOCK_FOLDERS_TO_REMOVE.has(norm.toLowerCase())) return;
          if (deletedFolders.includes(norm.toLowerCase())) return;

          // Prune folders that contain 0 images (except system folders)
          const isSystemFolder = areFoldersEqual(norm, 'All Photos') || areFoldersEqual(norm, 'Profile Pics') || areFoldersEqual(norm, 'Cover Images');
          if (!isSystemFolder) {
            const imageCountInFolder = allImages.filter((img) => areFoldersEqual(img.folder, norm)).length;
            if (imageCountInFolder === 0) {
              return; // Omit empty ghost folders with 0 files
            }
          }
          
          // In Band workspace: Prune cross-pollinated folders (like "Logos", "Logos & Branding", "Graphic Design Portfolio")
          // if they contain 0 images for this band
          if (isBandWorkspace) {
            const isKnownCreativeFolder =
              norm.toLowerCase() === 'logos' ||
              norm.toLowerCase() === 'logos & branding' ||
              norm.toLowerCase() === 'graphic design portfolio' ||
              norm.toLowerCase() === 'client artworks' ||
              norm.toLowerCase() === 'commission samples';

            if (isKnownCreativeFolder) {
              const imageCountInFolder = allImages.filter((img) => areFoldersEqual(img.folder, norm)).length;
              if (imageCountInFolder === 0) {
                return; // Omit cross-pollinated empty creative folder from band
              }
            }
          }

          if (!cleanedFolders.some((existing) => areFoldersEqual(existing, norm))) {
            cleanedFolders.push(norm);
          }
        });

        const orderedFolders = [
          'All Photos',
          'Profile Pics',
          'Cover Images',
          ...cleanedFolders.filter(
            (f) =>
              !areFoldersEqual(f, 'All Photos') &&
              !areFoldersEqual(f, 'Profile Pics') &&
              !areFoldersEqual(f, 'Cover Images')
          ),
        ];

        if (isMounted) {
          setImages(allImages);
          setFolders(orderedFolders);
        }
      } catch (err) {
        console.error('[GalleryTab] Error loading photo pit gallery:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGallery();

    return () => {
      isMounted = false;
    };
  }, [primaryId, userAvatarKey, userBannerKey, profileCustomFoldersKey, reloadTrigger]);

  // Compute folder counts with case & quote resilience
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach((f) => {
      if (areFoldersEqual(f, 'All Photos')) {
        counts[f] = images.length;
      } else {
        counts[f] = images.filter((img) => areFoldersEqual(img.folder, f)).length;
      }
    });
    return counts;
  }, [folders, images]);

  // Filter images by selected folder & search query with resilient comparison
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const matchesFolder =
        areFoldersEqual(selectedFolder, 'All Photos') ||
        areFoldersEqual(img.folder, selectedFolder);
      if (!matchesFolder) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchCaption = img.caption && img.caption.toLowerCase().includes(q);
      const matchFolder = img.folder && img.folder.toLowerCase().includes(q);
      return matchCaption || matchFolder;
    });
  }, [images, selectedFolder, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Folder Navigation Matrix */}
      {folders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide pt-1">
          {folders.map((folder, fIdx) => {
            const count = folderCounts[folder] || 0;
            const isSelected = areFoldersEqual(selectedFolder, folder);

            return (
              <button
                key={`gallery_folder_tab_${folder}_${fIdx}`}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                className={`rounded-xl px-3 py-2 text-left min-w-[120px] flex-shrink-0 flex items-center gap-2.5 transition-all border ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase truncate font-mono tracking-wider">
                    {folder}
                  </div>
                  <div className="text-[8.5px] text-zinc-500 font-mono">
                    {count} {count === 1 ? 'photo' : 'photos'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter / Search Bar & Re-sync Action */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-zinc-950/60 border border-zinc-800/60 rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder={`Search ${selectedFolder.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[11px] font-mono text-zinc-200 placeholder-zinc-600 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSyncGallery}
          disabled={loading}
          title="Re-sync photo vault with Supabase and photo-pit bucket"
          className="flex items-center gap-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-[10px] font-mono uppercase px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>
      </div>

      {/* Photo Pit Grid Display */}
      {loading ? (
        <div className="py-12 text-center text-zinc-500 font-mono text-xs animate-pulse flex flex-col items-center justify-center gap-2">
          <ImageIcon className="w-6 h-6 text-zinc-600 animate-spin" />
          <span>Synchronizing Photo Pit visual archives...</span>
        </div>
      ) : filteredImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredImages.map((img, idx) => (
            <div
              key={img.id ? `gal_cell_${img.id}_${idx}` : `gal_idx_${idx}`}
              onClick={() => {
                triggerPictureViewer?.({
                  photoId: `gallery_${primaryId}_${idx}`,
                  username: img.authorName || selectedUserProfile?.name || profileName,
                  imageUrl: img.url,
                  avatarUrl: typeof img.authorAvatar === 'string' ? img.authorAvatar : undefined,
                  title: img.folder || 'Photo Pit Capture',
                  caption: img.caption || 'Live performance captured on the Nexus Network.',
                });
                setSelectedGalleryItem?.({
                  url: img.url,
                  authorName: img.authorName || selectedUserProfile?.name || profileName,
                  authorRole: img.authorRole || selectedUserProfile?.role,
                  authorAvatar: img.authorAvatar || selectedUserProfile?.avatar || '👤',
                  content: img.caption || 'Live performance captured on the Nexus Network.',
                  timestamp: img.timestamp,
                  folder: img.folder || 'Photo Pit',
                });
              }}
              className="aspect-square bg-zinc-950 rounded-xl border border-zinc-800/90 overflow-hidden relative group cursor-pointer hover:border-emerald-500/50 transition-all shadow-md"
            >
              <img
                src={img.url}
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                alt={img.caption || 'Photo Pit'}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                <div className="flex justify-end">
                  {img.folder && (
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-black/80 border border-emerald-500/30 px-1.5 py-0.5 rounded shadow">
                      {img.folder}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[9.5px] font-mono text-white line-clamp-2 leading-tight">
                    {img.caption}
                  </p>
                  <div className="text-[8px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>{img.timestamp}</span>
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center border border-zinc-900 border-dashed rounded-2xl flex flex-col items-center justify-center text-zinc-500 space-y-2.5 p-6 bg-zinc-950/30">
          <ImageIcon className="w-7 h-7 opacity-40 text-zinc-400" />
          <div className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
            {!areFoldersEqual(selectedFolder, 'All Photos')
              ? `No Photos in "${selectedFolder}"`
              : 'No Photos Uploaded in Photo Pit'}
          </div>
          <p className="text-[9px] font-mono text-zinc-600 max-w-[240px]">
            {!areFoldersEqual(selectedFolder, 'All Photos')
              ? 'Try switching to All Photos to view all captures.'
              : 'Visual memories and EPK photo captures will appear here once saved.'}
          </p>
          {!areFoldersEqual(selectedFolder, 'All Photos') && (
            <button
              type="button"
              onClick={() => setSelectedFolder('All Photos')}
              className="mt-1 text-[9px] font-mono text-emerald-400 hover:text-emerald-300 underline uppercase tracking-wider"
            >
              View All Photos ({folderCounts['All Photos'] || 0})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

