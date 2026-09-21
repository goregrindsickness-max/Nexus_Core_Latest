import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Folder, 
  Plus, 
  X, 
  FileUp, 
  Image as ImageIcon, 
  Trash2, 
  Briefcase, 
  Radio, 
  EyeOff, 
  Copy, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Layers,
  Info,
  RefreshCw,
  Upload,
  Database,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { usePinchZoom } from '../../hooks/usePinchZoom';
import { getSupabase, testPhotoPitStorageConnection } from '../../supabase';
import { socialFeedStore, profileStore } from '../../utils/indexedDB';
import { getDeletedPostIdsLocal, addDeletedPostIdLocal } from './utils/feedCacheUtils';
import { normalizeImageUrl, cleanDeletedPhotoFromStores, purgeStaleIndexedDBPhotos } from '../../utils/photoPitSyncUtils';
import { loadSavedPhotoPitFolders, persistPhotoPitFolders, normalizeFolderName, MOCK_FOLDERS_TO_REMOVE } from './utils/photoPitAlbums';

export const loadSavedFolders = loadSavedPhotoPitFolders;

interface PhotoPitViewProps {
  userProfile?: any;
  setUserProfile?: (profile: any) => void;
  feed?: any[];
  setFeed?: React.Dispatch<React.SetStateAction<any[]>>;
  triggerNotification?: (msg: string) => void;
  profileFullLegalName?: string;
  profileAvatarUrl?: string;
  portalRole?: string;
  syncPostToSupabase?: (post: any, directUserId?: string) => Promise<any> | any;
  uploadBase64ToStorage?: (base64: string, bucket: string, userId: string, filename: string) => Promise<string | null>;
  compressImageInSocialFeed?: (base64: string, maxWidth?: number, maxHeight?: number, quality?: number) => Promise<string>;
  triggerPictureViewer?: (data: any) => void;
  setActiveTab?: (tab: any) => void;
}

const DEFAULT_FOLDERS = [
  'All Photos',
  'Profile Pics',
  'Cover Images',
];

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

  if (lowerUrl.includes('1618005182384')) {
    return true;
  }

  return false;
};

// Subcomponent for interactive pinch-to-zoom lightbox stage in PhotoPit
const PhotoPitLightboxStage: React.FC<{
  imageUrl: string;
  onClose: () => void;
}> = ({ imageUrl, onClose }) => {
  const {
    scale,
    reset,
    zoomIn,
    zoomOut,
    containerProps,
    imageStyle,
  } = usePinchZoom({ minScale: 1, maxScale: 4 });

  useEffect(() => {
    reset();
  }, [imageUrl, reset]);

  return (
    <div 
      className="flex-1 bg-black flex items-center justify-center relative overflow-hidden min-h-[300px] md:min-h-[500px] select-none"
      {...containerProps}
    >
      {/* Zoom Controls Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md border border-zinc-800 rounded-xl p-1 shadow-lg pointer-events-auto">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); zoomOut(0.5); }}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono font-bold text-zinc-300 px-1 min-w-[32px] text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); zoomIn(0.5); }}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        {scale > 1.05 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); reset(); }}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/60 border border-zinc-800 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer shadow-lg pointer-events-auto"
        title="Close Photo Pit Lightbox"
      >
        <X className="w-4 h-4" />
      </button>

      <img
        src={imageUrl}
        alt="Photo Pit View"
        referrerPolicy="no-referrer"
        className={`max-w-full max-h-[80vh] object-contain select-none animate-fade-in ${
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
        style={imageStyle}
        draggable={false}
      />
    </div>
  );
};

export const PhotoPitView: React.FC<PhotoPitViewProps> = ({
  userProfile,
  setUserProfile,
  feed = [],
  setFeed,
  triggerNotification,
  profileFullLegalName,
  profileAvatarUrl,
  portalRole,
  syncPostToSupabase,
  uploadBase64ToStorage,
  compressImageInSocialFeed,
  triggerPictureViewer,
  setActiveTab,
}) => {
  const currentUserId = userProfile?.id || userProfile?.uuid || userProfile?.user_id || '';

  const [selectedFolder, setSelectedFolder] = useState('All Photos');
  const [foldersList, setFoldersList] = useState<string[]>(() => loadSavedFolders(userProfile, portalRole));
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<any | null>(null);
  const [showFolderCreator, setShowFolderCreator] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [galleryLimit, setGalleryLimit] = useState(24);
  const [dbUserPosts, setDbUserPosts] = useState<any[]>([]);

  // Helper to persist folder modifications scoped to current workspace role and user UUID
  const saveFolders = async (updatedList: string[]) => {
    const finalFolders = await persistPhotoPitFolders(updatedList, userProfile, portalRole, setUserProfile);
    setFoldersList(finalFolders);
  };

  // Helper function: Strictly verify that a post belongs to the current user's UUID
  const isUserPhotoPost = useCallback((post: any): boolean => {
    if (!post) return false;
    // Exclude mock placeholder posts
    if (String(post.id).startsWith('mock_') || post.isMock) return false;

    if (currentUserId) {
      const pProfileId = post.profile_id || post.data?.profile_id || post.data?.postedBy;
      const pUserId = post.user_id || post.data?.user_id;
      const pAuthorId = post.author?.id || post.data?.author?.id;

      if (pProfileId && pProfileId === currentUserId) return true;
      if (pUserId && pUserId === currentUserId) return true;
      if (pAuthorId && pAuthorId === currentUserId) return true;

      // If explicit other user IDs are attached, reject
      if (pProfileId && pProfileId !== currentUserId) return false;
      if (pUserId && pUserId !== currentUserId) return false;
      if (pAuthorId && pAuthorId !== currentUserId) return false;

      // Author marked isYou
      if (post.author?.isYou === true || post.isYou === true) return true;
      return false;
    } else {
      if (post.author?.isYou === true || post.isYou === true) return true;
      return false;
    }
  }, [currentUserId]);

  // Fetch photos owned strictly by current user's UUID from Supabase nexus_posts and IndexedDB stores
  useEffect(() => {
    let isMounted = true;
    const fetchUserMediaPosts = async () => {
      if (!currentUserId) return;
      const combinedUserPosts: any[] = [];
      const seenIds = new Set<string>();
      const seenUrls = new Set<string>();
      const deletedPostIds = new Set<string>(getDeletedPostIdsLocal());

      // 1. Supabase query
      const supabase = getSupabase();
      let dbDataList: any[] = [];
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('nexus_posts')
            .select('*')
            .or(`profile_id.eq.${currentUserId},user_id.eq.${currentUserId}`)
            .not('media_url', 'is', null)
            .order('created_at', { ascending: false });

          if (!error && data && Array.isArray(data)) {
            dbDataList = data;
            data
              .filter((row: any) => !String(row.id).startsWith('mock_') && !deletedPostIds.has(String(row.id)))
              .forEach((row: any) => {
                const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
                const media = row.media_url || postObj.image || postObj.media_url;
                const postId = String(row.id || postObj.id);
                if (postId) seenIds.add(postId);
                const norm = normalizeImageUrl(media);
                if (norm) seenUrls.add(norm);

                combinedUserPosts.push({
                  ...postObj,
                  id: postId,
                  profile_id: row.profile_id || currentUserId,
                  user_id: row.user_id || currentUserId,
                  media_url: media,
                  image: media,
                  images: postObj.images || (media ? [media] : []),
                  content: row.content || postObj.content || '',
                  gallery_folder: postObj.gallery_folder || postObj.folder || 'All Photos',
                  timestamp: row.created_at || postObj.timestamp || new Date().toISOString(),
                  author: {
                    id: currentUserId,
                    name: userProfile?.name || postObj.author?.name || 'Nexus Member',
                    avatar: userProfile?.avatar_url || userProfile?.avatar || postObj.author?.avatar || '',
                    role: userProfile?.role || postObj.author?.role || 'Fan Listener',
                    isYou: true
                  }
                });
              });
          }
        } catch (err) {
          console.warn("[PhotoPitView] Error querying user posts from Supabase:", err);
        }
      }

      // Background cleanup of stale IndexedDB records if Supabase returned records
      if (dbDataList.length > 0) {
        const authIds = dbDataList.map((r: any) => String(r.id));
        const authUrls = dbDataList.map((r: any) => r.media_url || r.image).filter(Boolean);
        purgeStaleIndexedDBPhotos(currentUserId, authIds, authUrls).catch(() => {});
      }

      // 2. Scan IndexedDB socialFeedStore & profileStore (only if not deleted and not already in combined posts)
      try {
        const feedKeys = await socialFeedStore.keys();
        for (const fk of feedKeys) {
          const cachedFeed = await socialFeedStore.getItem<any[]>(fk);
          if (Array.isArray(cachedFeed)) {
            cachedFeed.forEach((post: any) => {
              if (!post) return;
              const postId = String(post.id || post.data?.id || '');
              if (deletedPostIds.has(postId) || seenIds.has(postId)) return;

              const pProfileId = post.profile_id || post.data?.profile_id || post.data?.postedBy || post.author?.id;
              const pUserId = post.user_id || post.data?.user_id;
              const isMatch = pProfileId === currentUserId || pUserId === currentUserId || post.author?.isYou === true || post.isYou === true;

              if (isMatch) {
                const media = post.media_url || post.image || (post.images && post.images[0]);
                const norm = normalizeImageUrl(media);
                if (media && (!norm || !seenUrls.has(norm))) {
                  seenIds.add(postId || norm);
                  if (norm) seenUrls.add(norm);

                  combinedUserPosts.push({
                    ...post,
                    id: postId || `idb_${Date.now()}_${Math.random()}`,
                    profile_id: pProfileId || currentUserId,
                    user_id: pUserId || currentUserId,
                    media_url: media,
                    image: media,
                    images: post.images || [media],
                    gallery_folder: post.gallery_folder || post.folder || 'All Photos',
                    timestamp: post.timestamp || new Date().toISOString(),
                    author: {
                      id: currentUserId,
                      name: userProfile?.name || post.author?.name || 'Nexus Member',
                      avatar: userProfile?.avatar_url || userProfile?.avatar || post.author?.avatar || '',
                      role: userProfile?.role || post.author?.role || 'Fan Listener',
                      isYou: true
                    }
                  });
                }
              }
            });
          }
        }
      } catch (idbErr) {
        console.warn("[PhotoPitView] IndexedDB socialFeedStore fetch notice:", idbErr);
      }

      if (isMounted) {
        setDbUserPosts(combinedUserPosts);
      }
    };
    fetchUserMediaPosts();
    return () => { isMounted = false; };
  }, [currentUserId, userProfile]);

  // Combine user-owned posts from feed & database
  const allUserPosts = useMemo(() => {
    const map = new Map<string, any>();
    dbUserPosts.forEach((p) => {
      if (p.id) map.set(p.id, p);
    });
    (feed || []).forEach((p) => {
      if (isUserPhotoPost(p) && p.id) {
        map.set(p.id, { ...map.get(p.id), ...p });
      }
    });
    return Array.from(map.values());
  }, [dbUserPosts, feed, isUserPhotoPost]);

  // Sync folders dynamically from user's own items
  useEffect(() => {
    if (allUserPosts && allUserPosts.length > 0) {
      let deletedFolders: string[] = [];
      try {
        const deletedKey = `nexus_deleted_folders_${currentUserId || 'guest'}`;
        const parsedDeleted = JSON.parse(localStorage.getItem(deletedKey) || '[]');
        if (Array.isArray(parsedDeleted)) {
          deletedFolders = parsedDeleted.map((d: string) => d.toLowerCase());
        }
      } catch (_) {}

      const feedFolders = allUserPosts
        .map((item: any) => normalizeFolderName(item.gallery_folder || item.folder))
        .filter((f): f is string => {
          if (!f || typeof f !== 'string' || !f.trim()) return false;
          const lower = f.toLowerCase();
          if (MOCK_FOLDERS_TO_REMOVE.has(lower)) return false;
          if (deletedFolders.includes(lower)) return false;
          return true;
        });

      if (feedFolders.length > 0) {
        const updated = [...foldersList];
        let changed = false;
        feedFolders.forEach((f) => {
          if (!updated.some((existing) => existing.toLowerCase() === f.toLowerCase())) {
            updated.push(f);
            changed = true;
          }
        });
        if (changed) {
          saveFolders(updated);
        }
      }
    }
  }, [allUserPosts, foldersList, currentUserId]);

  // Upload drawer state (supports single and batch uploads)
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [postToFeed, setPostToFeed] = useState<boolean>(false); // Quiet vault upload by default to avoid flooding feed
  const [isSubmittingPhotos, setIsSubmittingPhotos] = useState<boolean>(false);
  const [pendingFolder, setPendingFolder] = useState('Profile Pics');
  const [pendingCaption, setPendingCaption] = useState('');

  // Album Duplication to Creative Workspace state
  const [albumToDuplicate, setAlbumToDuplicate] = useState<string | null>(null);
  const [targetDuplicateFolder, setTargetDuplicateFolder] = useState<string>('');
  const [duplicateBroadcastFeed, setDuplicateBroadcastFeed] = useState<boolean>(false);
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false);

  // Lightbox modal state
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<any | null>(null);
  const replacePhotoInputRef = useRef<HTMLInputElement>(null);
  const [isReplacingPhoto, setIsReplacingPhoto] = useState<boolean>(false);

  // Storage Diagnostics Modal State
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<any | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const handleRunStorageDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticsResult(null);
    try {
      const result = await testPhotoPitStorageConnection();
      setDiagnosticsResult(result);
    } catch (e: any) {
      setDiagnosticsResult({
        success: false,
        bucketExists: false,
        canWrite: false,
        publicUrlAccessible: false,
        testedBucket: 'photo-pit',
        errorMessage: e?.message || String(e),
        diagnostics: [`❌ Exception: ${e?.message || e}`]
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  // Collect all images strictly owned by this user's UUID
  const galleryItems = useMemo(() => {
    const acc: any[] = [];
    const seenUrls = new Set<string>();
    const seenImageIds = new Set<string>();
    const seenCombos = new Set<string>();

    const cleanUrlForDedupe = (u: string) => {
      if (!u || typeof u !== 'string') return '';
      return u.split('?')[0].trim().toLowerCase();
    };

    allUserPosts.forEach((post: any) => {
      const postImages = post.images && post.images.length > 0
        ? post.images
        : (post.image ? [post.image] : (post.media_url ? [post.media_url] : []));

      if (postImages.length > 0) {
        postImages.forEach((img: string, idx: number) => {
          if (!img || typeof img !== 'string' || !img.trim()) return;
          if (isHardcodedPlaceholder(img, post.content, post.id)) return;
          const normalized = cleanUrlForDedupe(img);
          const comboKey = `${post.id}_img_${idx}`;

          if (seenCombos.has(comboKey) || (normalized && seenUrls.has(normalized)) || seenUrls.has(img)) {
            return;
          }
          seenCombos.add(comboKey);
          if (normalized) seenUrls.add(normalized);
          seenUrls.add(img);

          let rawFolder = normalizeFolderName(post.gallery_folder || post.folder);
          if (!rawFolder || MOCK_FOLDERS_TO_REMOVE.has(rawFolder.toLowerCase())) {
            rawFolder = 'All Photos';
          }
          const assignedFolder = rawFolder;
          let itemId = `${post.id}-img`;
          if (seenImageIds.has(itemId)) {
            let count = 1;
            while (seenImageIds.has(`${itemId}_${count}`)) count++;
            itemId = `${itemId}_${count}`;
          }
          seenImageIds.add(itemId);

          acc.push({
            id: itemId,
            url: img,
            authorName: post.author?.name || userProfile?.name || 'Nexus Member',
            authorAvatar: post.author?.avatar || userProfile?.avatar_url || userProfile?.avatar || '',
            authorRole: post.author?.role || userProfile?.role || 'Fan Listener',
            content: post.content || '',
            timestamp: post.timestamp || 'Just now',
            folder: assignedFolder,
            post,
          });
        });
      }
    });

    // Also include user's active Profile Avatar and Cover Banner if present (excluding default placeholders)
    const userAvatar = userProfile?.avatar_url || userProfile?.avatar;
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
        let avatarId = `profile_avatar_${currentUserId || 'self'}`;
        if (seenImageIds.has(avatarId)) avatarId = `${avatarId}_${Date.now()}`;
        seenImageIds.add(avatarId);
        acc.push({
          id: avatarId,
          url: userAvatar,
          authorName: userProfile?.name || 'Nexus Member',
          authorAvatar: userAvatar,
          authorRole: userProfile?.role || 'Fan Listener',
          content: 'Current Profile Picture',
          timestamp: 'Active',
          folder: 'Profile Pics',
          post: {
            id: avatarId,
            profile_id: currentUserId,
            user_id: currentUserId,
            content: 'Current Profile Picture',
            gallery_folder: 'Profile Pics',
            image: userAvatar,
          }
        });
      }
    }

    const userCover = userProfile?.banner_url || userProfile?.cover_url || userProfile?.creative_banner || userProfile?.label_banner || userProfile?.banner;
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
        let coverId = `profile_cover_${currentUserId || 'self'}`;
        if (seenImageIds.has(coverId)) coverId = `${coverId}_${Date.now()}`;
        seenImageIds.add(coverId);
        acc.push({
          id: coverId,
          url: userCover,
          authorName: userProfile?.name || 'Nexus Member',
          authorAvatar: userAvatar || '',
          authorRole: userProfile?.role || 'Fan Listener',
          content: 'Current Cover Banner',
          timestamp: 'Active',
          folder: 'Cover Images',
          post: {
            id: coverId,
            profile_id: currentUserId,
            user_id: currentUserId,
            content: 'Current Cover Banner',
            gallery_folder: 'Cover Images',
            image: userCover,
          }
        });
      }
    }

    return acc;
  }, [allUserPosts, userProfile, currentUserId]);

  // Calculate photo counts per folder
  const folderCounts = foldersList.reduce((acc: Record<string, number>, folder) => {
    if (folder.toLowerCase() === 'all photos') {
      acc[folder] = galleryItems.length;
    } else {
      acc[folder] = galleryItems.filter((item: any) => item.folder && item.folder.toLowerCase() === folder.toLowerCase()).length;
    }
    return acc;
  }, {});

  // Helper to get latest preview image for a folder
  const getLatestImageForFolder = (folder: string) => {
    const items = folder.toLowerCase() === 'all photos'
      ? galleryItems
      : galleryItems.filter((item: any) => item.folder && item.folder.toLowerCase() === folder.toLowerCase());
    return items[0]?.url || null;
  };

  // Filter items based on active folder selection and search query
  const folderItems = selectedFolder.toLowerCase() === 'all photos'
    ? galleryItems
    : galleryItems.filter((item: any) => item.folder && item.folder.toLowerCase() === selectedFolder.toLowerCase());

  const filteredItems = folderItems.filter((item: any) =>
    item.authorName.toLowerCase().includes(gallerySearchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(gallerySearchQuery.toLowerCase())
  );

  // Slice for memory conservation
  const paginatedItems = filteredItems.slice(0, galleryLimit);

  // Handle initial photo selection for upload workflow (supports single or multi-files)
  const handleImageUploadInit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    triggerNotification?.(`⏳ Compressing and loading ${files.length} image${files.length > 1 ? 's' : ''}...`);

    const fileList = Array.from(files);
    const compressedList: string[] = [];
    let processedCount = 0;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          let compressedBase64 = base64;
          if (compressImageInSocialFeed) {
            compressedBase64 = await compressImageInSocialFeed(base64, 1024, 1024, 0.75);
          }
          compressedList.push(compressedBase64);
        } catch (error) {
          compressedList.push(base64);
        } finally {
          processedCount++;
          if (processedCount === fileList.length) {
            setPendingPhotos(compressedList);
            setPendingFolder(selectedFolder !== 'All Photos' ? selectedFolder : 'Profile Pics');
            setPendingCaption('');
            triggerNotification?.(`⚡ ${compressedList.length} image${compressedList.length > 1 ? 's' : ''} ready! Please set folder & feed options.`);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Submit newly organized photos
  const submitGalleryPost = async () => {
    if (pendingPhotos.length === 0) return;
    setIsSubmittingPhotos(true);

    try {
      const userProfileId = currentUserId || userProfile?.id || userProfile?.uuid || 'guest';
      const uploadedUrls: string[] = [];

      for (let i = 0; i < pendingPhotos.length; i++) {
        const photo = pendingPhotos[i];
        let finalImage = photo;
        if (uploadBase64ToStorage) {
          try {
            triggerNotification?.(`⏳ Uploading memory ${i + 1}/${pendingPhotos.length} to storage...`);
            const publicUrl = await uploadBase64ToStorage(
              photo,
              'photo-pit',
              userProfileId,
              `gallery-post-${Date.now()}`
            );
            if (publicUrl) {
              finalImage = publicUrl;
            }
          } catch (e) {
            console.warn("Failed to upload gallery image to storage, using base64 fallback:", e);
          }
        }
        uploadedUrls.push(finalImage);
      }

      const authorName = `${userProfile?.console_handle || userProfile?.name || 'NexusMember'} (${userProfile?.full_name || profileFullLegalName || userProfile?.name || 'Nexus Member'})`;
      const authorAvatar = profileAvatarUrl || userProfile?.avatar || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100';
      const effectiveWorkspace = portalRole || 'fan';
      const authorRole = portalRole === 'band' 
        ? '💀 Artist' 
        : portalRole === 'creative' 
        ? 'Creative Pro' 
        : portalRole === 'promoter' 
        ? 'Promoter Pro' 
        : portalRole === 'label' 
        ? 'Record Label' 
        : (userProfile?.role || 'Fan Listener');
      const userLocation = userProfile?.location || userProfile?.city || '';

      const createdPostObjs: any[] = [];

      // Create individual distinct entries for each uploaded image to ensure they are accessible in the gallery
      for (let i = 0; i < uploadedUrls.length; i++) {
        const imgUrl = uploadedUrls[i];
        const postUuid = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'f' + Date.now().toString(16) + '-4000-8000-8000-' + Math.floor(Math.random() * 1e12).toString(16).padStart(12, '0');

        const newPost: any = {
          id: postUuid,
          profile_id: userProfileId,
          user_id: userProfileId,
          workspace_type: effectiveWorkspace,
          author: {
            id: userProfileId,
            name: authorName,
            avatar: authorAvatar,
            role: authorRole,
            isYou: true
          },
          location: userLocation,
          content: pendingCaption || (postToFeed ? `Shared a new memory in the "${pendingFolder}" folder.` : `Vault memory in "${pendingFolder}"`),
          timestamp: new Date().toISOString(),
          timeAgo: 'Just now',
          comments: [],
          image: imgUrl,
          images: [imgUrl],
          media_url: imgUrl,
          gallery_folder: pendingFolder,
          is_gallery_only: !postToFeed,
          post_to_feed: postToFeed,
          hidden_from_feed: !postToFeed,
          gallery_only: !postToFeed,
          reactions: [{ type: 'flame', count: 0, active: false }],
        };

        let syncedId: string | null = null;
        if (syncPostToSupabase) {
          syncedId = await syncPostToSupabase(newPost, userProfileId);
        }

        const finalPostObj = {
          ...newPost,
          id: syncedId || postUuid
        };
        createdPostObjs.push(finalPostObj);
      }

      // If user enabled Post to Feed, also prepend to the live social feed
      if (postToFeed && setFeed) {
        setFeed((prev) => {
          const ids = new Set(createdPostObjs.map(p => p.id));
          const filtered = prev.filter((p) => !ids.has(p.id));
          return [...createdPostObjs, ...filtered];
        });
      }

      // Always add to dbUserPosts so it immediately displays in Photo Pit
      setDbUserPosts((prev) => {
        const ids = new Set(createdPostObjs.map(p => p.id));
        const filtered = prev.filter((p) => !ids.has(p.id));
        return [...createdPostObjs, ...filtered];
      });

      // Ensure the target folder is preserved in folder list
      if (!foldersList.includes(pendingFolder)) {
        saveFolders([...foldersList, pendingFolder]);
      }

      setPendingPhotos([]);
      setPendingCaption('');
      triggerNotification?.(
        postToFeed
          ? `⚡ ${uploadedUrls.length} photo(s) filed in "${pendingFolder}" & broadcast to feed!`
          : `🔒 ${uploadedUrls.length} photo(s) quietly saved to Photo Pit vault "${pendingFolder}"!`
      );
    } catch (err) {
      console.error("Failed to submit photo pit items:", err);
      triggerNotification?.("⚠️ Error uploading photos. Please try again.");
    } finally {
      setIsSubmittingPhotos(false);
    }
  };

  // Duplicate Album to Creative Workspace Handler
  const handleDuplicateAlbumToCreative = async () => {
    if (!albumToDuplicate) return;
    setIsDuplicating(true);

    try {
      const sourceFolder = albumToDuplicate;
      const targetFolder = normalizeFolderName(targetDuplicateFolder) || sourceFolder;

      // Find all photos belonging to the source folder
      const sourcePhotos = galleryItems.filter((item: any) => {
        if (sourceFolder === 'All Photos') return true;
        return (item.folder || '').toLowerCase() === sourceFolder.toLowerCase();
      });

      if (sourcePhotos.length === 0) {
        triggerNotification?.(`⚠️ No photos found in "${sourceFolder}" to duplicate.`);
        setIsDuplicating(false);
        return;
      }

      const targetCreativeId = userProfile?.creative_id || (userProfile as any)?.registered_creative_id || currentUserId || 'creative_vault';
      const creativeName = userProfile?.creative_metadata?.business_name || (userProfile as any)?.creative_name || (userProfile as any)?.creative_business_name || userProfile?.name || 'Creative Studio';
      const creativeAvatar = userProfile?.creative_avatar || userProfile?.creative_metadata?.creative_avatar || profileAvatarUrl || userProfile?.avatar || userProfile?.avatar_url || '';

      triggerNotification?.(`⏳ Duplicating ${sourcePhotos.length} photo(s) to Creative Workspace under "${targetFolder}"...`);

      const supabase = getSupabase();
      const duplicatedPostObjs: any[] = [];

      for (let i = 0; i < sourcePhotos.length; i++) {
        const item = sourcePhotos[i];
        const newUuid = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'c' + Date.now().toString(16) + '-4000-8000-8000-' + Math.floor(Math.random() * 1e12).toString(16).padStart(12, '0');

        const postData = {
          id: newUuid,
          profile_id: targetCreativeId,
          user_id: currentUserId,
          workspace_type: 'creative',
          workspaceType: 'creative',
          author: {
            id: targetCreativeId,
            name: creativeName,
            avatar: creativeAvatar,
            role: 'Creative Pro',
            isYou: true
          },
          content: item.content || `Showcase work from "${sourceFolder}"`,
          timestamp: new Date().toISOString(),
          image: item.url,
          media_url: item.url,
          images: [item.url],
          gallery_folder: targetFolder,
          is_gallery_only: !duplicateBroadcastFeed,
          post_to_feed: duplicateBroadcastFeed,
          hidden_from_feed: !duplicateBroadcastFeed,
          gallery_only: !duplicateBroadcastFeed,
          reactions: [{ type: 'flame', count: 0, active: false }]
        };

        duplicatedPostObjs.push(postData);

        if (supabase) {
          try {
            await supabase.from('nexus_posts').upsert([{
              id: newUuid,
              profile_id: targetCreativeId,
              user_id: currentUserId,
              workspace_type: 'creative',
              content: postData.content,
              media_url: item.url,
              data: postData,
              created_at: new Date().toISOString()
            }], { onConflict: 'id' });
          } catch (e) {
            console.warn("Failed duplicating post row to Supabase:", e);
          }
        }
      }

      // Persist target folder into Creative workspace photo folders
      const creativeFolderKey1 = `nexus_photo_folders_${targetCreativeId}`;
      const creativeFolderKey2 = `nexus_photo_folders_${currentUserId}_creative`;
      
      const updateStoredFolders = (key: string) => {
        try {
          const raw = localStorage.getItem(key);
          let list = raw ? JSON.parse(raw) : ['All Photos', 'Profile Pics', 'Cover Images'];
          if (!list.includes(targetFolder)) {
            list.push(targetFolder);
            localStorage.setItem(key, JSON.stringify(list));
          }
        } catch (e) {}
      };
      updateStoredFolders(creativeFolderKey1);
      updateStoredFolders(creativeFolderKey2);

      // If user is currently in creative workspace portal, update live views
      if (portalRole === 'creative') {
        if (!foldersList.includes(targetFolder)) {
          saveFolders([...foldersList, targetFolder]);
        }
        setDbUserPosts((prev) => [...duplicatedPostObjs, ...prev]);
      }

      setAlbumToDuplicate(null);
      triggerNotification?.(`✨ Successfully duplicated ${sourcePhotos.length} photo(s) into Creative Workspace folder "${targetFolder}"!`);
    } catch (err) {
      console.error("Failed to duplicate album to Creative Workspace:", err);
      triggerNotification?.("⚠️ Error duplicating album to Creative Workspace.");
    } finally {
      setIsDuplicating(false);
    }
  };

  // Delete folder function
  const handleDeleteFolder = (folderName: string) => {
    if (folderName === 'All Photos') {
      triggerNotification?.("⚠️ 'All Photos' is the global vault and cannot be deleted.");
      setFolderToDelete(null);
      return;
    }

    const updated = foldersList.filter((f) => f !== folderName);
    saveFolders(updated);

    try {
      const deletedKey = `nexus_deleted_folders_${currentUserId || 'guest'}`;
      const existingDeleted = JSON.parse(localStorage.getItem(deletedKey) || '[]');
      if (!existingDeleted.includes(folderName)) {
        existingDeleted.push(folderName);
        localStorage.setItem(deletedKey, JSON.stringify(existingDeleted));
      }
    } catch (_) {}

    if (selectedFolder === folderName) {
      setSelectedFolder('All Photos');
    }

    setFolderToDelete(null);
    triggerNotification?.(`🗑️ Deleted folder "${folderName}". Photos remain safely in All Photos.`);
  };

  // Delete individual photo function
  const handleDeletePhoto = async (targetItem: any) => {
    if (!targetItem) return;

    const targetUrl = targetItem.url;
    const parentPost = targetItem.post;

    if (parentPost) {
      const parentPostId = parentPost.id;

      // Clean from IndexedDB stores and localStorage caches
      try {
        await cleanDeletedPhotoFromStores(targetUrl, parentPostId);
      } catch (cleanErr) {
        console.warn('[handleDeletePhoto] Store cleaning error:', cleanErr);
      }

      // Check if parent post has multiple images
      const parentImages: string[] = Array.isArray(parentPost.images) && parentPost.images.length > 0
        ? parentPost.images
        : (parentPost.image ? [parentPost.image] : (parentPost.media_url ? [parentPost.media_url] : []));

      const remainingImages = parentImages.filter((img) => img !== targetUrl);

      if (remainingImages.length > 0) {
        // Update post with remaining images
        if (setFeed) {
          setFeed((prev) =>
            prev.map((p) => {
              if (p.id === parentPostId) {
                return {
                  ...p,
                  image: remainingImages[0],
                  images: remainingImages,
                  media_url: remainingImages[0],
                };
              }
              return p;
            })
          );
        }
        setDbUserPosts((prev) =>
          prev.map((p) => {
            if (p.id === parentPostId) {
              return {
                ...p,
                image: remainingImages[0],
                images: remainingImages,
                media_url: remainingImages[0],
              };
            }
            return p;
          })
        );

        const supabase = getSupabase();
        if (supabase && parentPostId) {
          try {
            const updatedPostData = {
              ...parentPost,
              image: remainingImages[0],
              images: remainingImages,
              media_url: remainingImages[0],
            };
            await supabase
              .from('nexus_posts')
              .update({
                data: updatedPostData,
                media_url: remainingImages[0],
              })
              .eq('id', parentPostId);
          } catch (e) {
            console.warn('[handleDeletePhoto] Supabase image update error:', e);
          }
        }
      } else {
        // Remove post entirely if no remaining images
        if (setFeed) {
          setFeed((prev) => prev.filter((p) => p.id !== parentPostId));
        }
        setDbUserPosts((prev) => prev.filter((p) => p.id !== parentPostId));

        const supabase = getSupabase();
        if (supabase && parentPostId) {
          try {
            await supabase.from('nexus_posts').delete().eq('id', parentPostId);
          } catch (e) {
            console.warn('[handleDeletePhoto] Supabase post delete error:', e);
          }
        }
      }
    } else {
      // If no parent post was attached, still clean target URL across stores
      try {
        await cleanDeletedPhotoFromStores(targetUrl);
      } catch (_) {}
    }

    // Clean active user profile fields if they match the deleted photo URL
    if (userProfile && setUserProfile) {
      const normTarget = normalizeImageUrl(targetUrl);
      const avatarField = userProfile.avatar_url || userProfile.avatar;
      const isAvatar = avatarField && normalizeImageUrl(avatarField) === normTarget;

      const coverField = userProfile.banner_url || userProfile.cover_url || userProfile.creative_banner || userProfile.label_banner || userProfile.banner;
      const isCover = coverField && normalizeImageUrl(coverField) === normTarget;

      if (isAvatar || isCover) {
        const updatedProf = { ...userProfile };
        if (isAvatar) {
          if (updatedProf.avatar_url) updatedProf.avatar_url = '';
          if (updatedProf.avatar) updatedProf.avatar = '';
        }
        if (isCover) {
          if (updatedProf.banner_url) updatedProf.banner_url = '';
          if (updatedProf.cover_url) updatedProf.cover_url = '';
          if (updatedProf.creative_banner) updatedProf.creative_banner = '';
          if (updatedProf.label_banner) updatedProf.label_banner = '';
          if (updatedProf.banner) updatedProf.banner = '';
        }

        setUserProfile(updatedProf);
        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProf));

        const activeKey = 'nexus_core_user_profile';
        const userId = userProfile.id || userProfile.uuid || userProfile.user_id;
        try {
          await profileStore.setItem(activeKey, updatedProf);
          if (userId) {
            await profileStore.setItem(`nexus_core_${userId}_profile`, updatedProf);
          }
        } catch (dbErr) {
          console.warn('[handleDeletePhoto] Failed to sync profile update to IndexedDB:', dbErr);
        }

        const supabase = getSupabase();
        if (supabase) {
          try {
            if (userProfile.user_id) {
              const profilePayload: any = {};
              if (isAvatar) profilePayload.avatar_url = null;
              if (isCover) profilePayload.banner_url = null;
              await supabase.from('profiles').update(profilePayload).eq('user_id', userProfile.user_id);
            }

            const creativeId = userProfile.creative_id || userProfile.registered_creative_id;
            if (creativeId) {
              const creativePayload: any = {};
              if (isAvatar) creativePayload.avatar_url = null;
              if (isCover) {
                creativePayload.cover_url = null;
                creativePayload.creative_banner = null;
                creativePayload.label_banner = null;
              }
              await supabase.from('creatives').update(creativePayload).eq('id', creativeId);
            }
          } catch (supaErr) {
            console.warn('[handleDeletePhoto] Failed to sync profile updates to Supabase:', supaErr);
          }
        }
      }
    }

    if (selectedGalleryItem && selectedGalleryItem.id === targetItem.id) {
      setSelectedGalleryItem(null);
    }

    // Broadcast photo deletion event to update all profile tabs and cards
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_photos_updated', {
        detail: { deletedUrl: targetUrl, parentPostId: parentPost?.id }
      }));
    }

    setPhotoToDelete(null);
    triggerNotification?.('🗑️ Photo permanently removed.');
  };

  // Replace / Re-upload a photo on an existing post without losing captions or metadata
  const handleReplacePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGalleryItem) return;

    setIsReplacingPhoto(true);
    triggerNotification?.('⏳ Uploading replacement photo to photo-pit storage...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        let base64 = reader.result as string;
        if (compressImageInSocialFeed) {
          try {
            base64 = await compressImageInSocialFeed(base64, 1600, 1600, 0.85);
          } catch (compErr) {
            console.warn('[handleReplacePhotoFile] Compression fallback:', compErr);
          }
        }

        const userProfileId = currentUserId || userProfile?.id || userProfile?.uuid || 'guest';
        let newImageUrl = base64;

        if (uploadBase64ToStorage) {
          try {
            const publicUrl = await uploadBase64ToStorage(
              base64,
              'photo-pit',
              userProfileId,
              `replaced-photo-${Date.now()}`
            );
            if (publicUrl) {
              newImageUrl = publicUrl;
            }
          } catch (uploadErr) {
            console.warn('[handleReplacePhotoFile] Storage upload error:', uploadErr);
          }
        }

        const targetPost = selectedGalleryItem.post;
        const parentPostId = targetPost?.id;
        const oldUrl = selectedGalleryItem.url;

        // 1. Update in local feed & dbUserPosts
        if (parentPostId) {
          if (setFeed) {
            setFeed((prev) =>
              prev.map((p) => {
                if (p.id === parentPostId) {
                  const currImages = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : [p.media_url]);
                  const updatedImages = currImages.map((img: string) => (img === oldUrl ? newImageUrl : img));
                  return {
                    ...p,
                    image: p.image === oldUrl ? newImageUrl : p.image || newImageUrl,
                    media_url: p.media_url === oldUrl ? newImageUrl : p.media_url || newImageUrl,
                    images: updatedImages,
                  };
                }
                return p;
              })
            );
          }

          setDbUserPosts((prev) =>
            prev.map((p) => {
              if (p.id === parentPostId) {
                const currImages = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : [p.media_url]);
                const updatedImages = currImages.map((img: string) => (img === oldUrl ? newImageUrl : img));
                return {
                  ...p,
                  image: p.image === oldUrl ? newImageUrl : p.image || newImageUrl,
                  media_url: p.media_url === oldUrl ? newImageUrl : p.media_url || newImageUrl,
                  images: updatedImages,
                };
              }
              return p;
            })
          );

          // 2. Persist update to Supabase nexus_posts
          const supabase = getSupabase();
          if (supabase) {
            try {
              const updatedData = {
                ...targetPost,
                image: targetPost.image === oldUrl ? newImageUrl : targetPost.image || newImageUrl,
                media_url: targetPost.media_url === oldUrl ? newImageUrl : targetPost.media_url || newImageUrl,
                images: (targetPost.images || [targetPost.image || targetPost.media_url]).map((img: string) => (img === oldUrl ? newImageUrl : img)),
              };
              await supabase
                .from('nexus_posts')
                .update({
                  data: updatedData,
                  media_url: newImageUrl,
                })
                .eq('id', parentPostId);
            } catch (supaErr) {
              console.warn('[handleReplacePhotoFile] Supabase update exception:', supaErr);
            }
          }

          // 3. Update localStorage feed & user post caches to ensure ProfileCard / GalleryTab syncs immediately
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
                  const updated = parsed.map((p: any) => {
                    if (p && (p.id === parentPostId || p.data?.id === parentPostId)) {
                      const currImages = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : [p.media_url]);
                      const updatedImages = (currImages || []).map((img: string) => (img === oldUrl ? newImageUrl : img));
                      return {
                        ...p,
                        image: p.image === oldUrl ? newImageUrl : p.image || newImageUrl,
                        media_url: p.media_url === oldUrl ? newImageUrl : p.media_url || newImageUrl,
                        images: updatedImages,
                        data: p.data ? {
                          ...p.data,
                          image: p.data.image === oldUrl ? newImageUrl : p.data.image || newImageUrl,
                          media_url: p.data.media_url === oldUrl ? newImageUrl : p.data.media_url || newImageUrl,
                          images: updatedImages,
                        } : undefined,
                      };
                    }
                    return p;
                  });
                  localStorage.setItem(key, JSON.stringify(updated));
                }
              }
            });

            // Also update IndexedDB social feed store
            try {
              const idbKeys = await socialFeedStore.keys();
              for (const ik of idbKeys) {
                const cachedList = await socialFeedStore.getItem<any[]>(ik);
                if (Array.isArray(cachedList)) {
                  const updatedList = cachedList.map((p: any) => {
                    if (p && (p.id === parentPostId || p.data?.id === parentPostId)) {
                      const currImages = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : [p.media_url]);
                      const updatedImages = (currImages || []).map((img: string) => (img === oldUrl ? newImageUrl : img));
                      return {
                        ...p,
                        image: p.image === oldUrl ? newImageUrl : p.image || newImageUrl,
                        media_url: p.media_url === oldUrl ? newImageUrl : p.media_url || newImageUrl,
                        images: updatedImages,
                      };
                    }
                    return p;
                  });
                  await socialFeedStore.setItem(ik, updatedList);
                }
              }
            } catch (_) {}

            // Broadcast real-time photo change event to profile card and gallery
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('nexus_photos_updated', {
                detail: { parentPostId, oldUrl, newImageUrl }
              }));
            }
          } catch (cacheErr) {
            console.warn('[handleReplacePhotoFile] Local cache update notice:', cacheErr);
          }
        }

        // Update active lightbox view
        setSelectedGalleryItem((prev: any) => (prev ? { ...prev, url: newImageUrl } : null));
        
        const isRemoteUrl = newImageUrl && (newImageUrl.startsWith('http://') || newImageUrl.startsWith('https://'));
        if (isRemoteUrl) {
          triggerNotification?.('✨ Photo successfully uploaded to photo-pit storage bucket! Caption and folder preserved.');
        } else {
          triggerNotification?.('⚠️ Supabase Storage permissions blocked direct bucket upload. Image saved as local fallback. Check storage connection.');
        }
        setIsReplacingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('[handleReplacePhotoFile] Error replacing photo:', err);
      setIsReplacingPhoto(false);
      triggerNotification?.('❌ Error replacing photo. Please try again.');
    } finally {
      if (replacePhotoInputRef.current) {
        replacePhotoInputRef.current.value = '';
      }
    }
  };

  // Add custom folder
  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    if ((foldersList || []).some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      triggerNotification?.("⚠️ This folder already exists!");
      return;
    }

    const updated = [...foldersList, trimmed];
    saveFolders(updated);
    setSelectedFolder(trimmed);
    setNewFolderName('');
    setShowFolderCreator(false);
    triggerNotification?.(`📁 Created new folder: "${trimmed}"`);
  };

  // Full re-sync of Photo Pit & Profile Card gallery with Supabase database
  const [isResyncingProfile, setIsResyncingProfile] = useState<boolean>(false);
  const handleFullResyncWithProfile = async () => {
    setIsResyncingProfile(true);
    triggerNotification?.('⏳ Synchronizing Photo Pit and Public Profile Card with Supabase...');
    try {
      const supabase = getSupabase();
      const userProfileId = currentUserId || userProfile?.id || userProfile?.uuid || 'guest';
      
      if (supabase && userProfileId && userProfileId !== 'guest') {
        const { data: dbData, error: dbErr } = await supabase
          .from('nexus_posts')
          .select('*')
          .or(`profile_id.eq.${userProfileId},user_id.eq.${userProfileId}`)
          .order('created_at', { ascending: false });

        if (!dbErr && Array.isArray(dbData)) {
          const freshPosts = dbData.map((row: any) => {
            const pObj = typeof row.data === 'string' ? JSON.parse(row.data) : row.data || {};
            return {
              ...pObj,
              ...row,
              data: pObj,
              id: row.id,
              profile_id: row.profile_id,
              user_id: row.user_id,
              media_url: row.media_url || pObj.media_url || pObj.image,
              image: row.media_url || pObj.image || pObj.media_url,
              gallery_folder: row.gallery_folder || pObj.gallery_folder || 'All Photos',
            };
          });

          setDbUserPosts(freshPosts);
          if (setFeed) {
            setFeed((prev) => {
              const otherPosts = prev.filter((p) => {
                const pId = p.profile_id || p.user_id || p.data?.profile_id || p.data?.user_id;
                return pId !== userProfileId;
              });
              return [...freshPosts, ...otherPosts];
            });
          }

          // Update local cache
          localStorage.setItem('nexus_dbUserPosts', JSON.stringify(freshPosts));

          // Purge obsolete and duplicate records from IndexedDB
          const freshIds = freshPosts.map((p) => String(p.id));
          const freshUrls = freshPosts.map((p) => p.media_url || p.image).filter(Boolean);
          await purgeStaleIndexedDBPhotos(userProfileId, freshIds, freshUrls);
        }
      }

      // Dispatch global sync event to all open Profile Cards & Gallery tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_photos_updated'));
      }
      triggerNotification?.('✨ Photo Pit and Public Profile Card re-synchronized with latest photos!');
    } catch (err) {
      console.warn('[handleFullResyncWithProfile] Sync error:', err);
      triggerNotification?.('⚠️ Sync completed with local cache.');
    } finally {
      setIsResyncingProfile(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 animate-in fade-in duration-300">
      {/* Photo Pit Intro Header */}
      <div className="mb-8 flex flex-col items-center justify-center text-center gap-4 border-b border-zinc-900 pb-6">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white [text-shadow:0_0_15px_rgba(59,130,246,0.85),0_0_30px_rgba(37,99,235,0.5),0_0_45px_rgba(29,78,216,0.3)]">
          Welcome to your Photo Pit
        </h2>

        {/* Action buttons: Search photos bar and +Add Photos */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search photos..."
              value={gallerySearchQuery}
              onChange={(e) => setGallerySearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-blue-500/50 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
            />
            {gallerySearchQuery && (
              <button
                onClick={() => setGallerySearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upload Trigger Button */}
          <label className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest px-4 py-2 rounded-xl transition duration-150 cursor-pointer text-center shrink-0 shadow-lg shadow-rose-950/40">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUploadInit}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Folder Navigation Breadcrumbs */}
      {selectedFolder !== 'All Photos' && (
        <div className="mb-6 flex flex-wrap items-center justify-between bg-zinc-950/40 border border-zinc-900 p-3 rounded-2xl gap-2">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setSelectedFolder('All Photos')}
              className="text-zinc-500 hover:text-white transition-colors uppercase font-bold"
            >
              Folders Directory
            </button>
            <span className="text-zinc-700">/</span>
            <span className="text-rose-400 font-extrabold uppercase">{selectedFolder}</span>
            <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
              {filteredItems.length} photos
            </span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Duplicate to Creative Workspace Action */}
            <button
              type="button"
              onClick={() => {
                setAlbumToDuplicate(selectedFolder);
                setTargetDuplicateFolder(selectedFolder);
              }}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase text-fuchsia-300 hover:text-white bg-fuchsia-950/50 hover:bg-fuchsia-900/70 border border-fuchsia-700/50 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-sm"
              title="Duplicate this album to your Creative Workspace portfolio"
            >
              <Copy className="w-3 h-3 text-fuchsia-400" />
              <span>Copy to Creative Workspace</span>
            </button>
            
            <button
              type="button"
              onClick={() => setFolderToDelete(selectedFolder)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3 text-rose-500" />
              <span>Delete Folder</span>
            </button>
            <button
              onClick={() => setSelectedFolder('All Photos')}
              className="text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              ← Back to Folders
            </button>
          </div>
        </div>
      )}

      {/* FOLDER SELECTION GRID (Only shown when viewing all directories or navigating back) */}
      {selectedFolder === 'All Photos' && (
        <div className="mb-8 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Folder className="w-4 h-4 text-rose-500" />
              <span>Memory Folders Directory</span>
            </h3>

            {/* Create Custom Folder Toggle */}
            <button
              onClick={() => setShowFolderCreator((prev) => !prev)}
              className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors animate-pulse"
            >
              <Plus className="w-3 h-3" />
              <span>Create Custom Folder</span>
            </button>
          </div>

          {/* Inline Folder Creator Form */}
          {showFolderCreator && (
            <form
              onSubmit={handleCreateFolderSubmit}
              className="bg-zinc-950/80 border border-zinc-900 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center animate-in slide-in-from-top duration-205"
            >
              <div className="flex-1">
                <label className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1">New Album Name</label>
                <input
                  type="text"
                  placeholder="e.g. Seattle Concert June 26, Backstage Tour..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-rose-900 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                  required
                  maxLength={40}
                />
              </div>
              <div className="flex gap-2 self-end w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowFolderCreator(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xs uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs uppercase font-black tracking-wider transition-colors"
                >
                  Create & View
                </button>
              </div>
            </form>
          )}

          {/* Grid of Folder Directories */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {foldersList.map((folder, fIdx) => {
              const latestImg = getLatestImageForFolder(folder);
              const count = folderCounts[folder] || 0;
              const isRoot = folder === 'All Photos';

              return (
                <div
                  key={`pit_folder_card_${folder}_${fIdx}`}
                  onClick={() => setSelectedFolder(folder)}
                  className={`group relative h-28 rounded-2xl border cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
                    selectedFolder === folder
                      ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-zinc-900/60'
                      : 'border-zinc-900 hover:border-rose-900/50 bg-zinc-950/40'
                  }`}
                >
                  {latestImg ? (
                    <>
                      <img src={latestImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 group-hover:opacity-35 transition-all duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07090d] via-[#07090d]/85 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[#07090d]/40 flex items-center justify-center text-zinc-800">
                      <Folder className="w-10 h-10 stroke-[1px]" />
                    </div>
                  )}

                  <div className="absolute inset-0 p-3 flex flex-col justify-between z-10">
                    <div className="flex items-start justify-between">
                      <Folder className={`w-5 h-5 ${selectedFolder === folder ? 'text-rose-500' : 'text-zinc-650 group-hover:text-rose-400'} transition-colors`} />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-950/75 border border-zinc-900 px-2 py-0.5 rounded-full">
                          {count} file{count !== 1 && 's'}
                        </span>
                        {!isRoot && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAlbumToDuplicate(folder);
                                setTargetDuplicateFolder(folder);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-fuchsia-950/90 hover:bg-fuchsia-600 text-fuchsia-400 hover:text-white border border-fuchsia-800/50 rounded-lg text-xs cursor-pointer"
                              title={`Duplicate "${folder}" to Creative Workspace`}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFolderToDelete(folder);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-rose-950/80 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-800/50 rounded-lg text-xs cursor-pointer"
                              title={`Delete folder "${folder}"`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-[11px] font-black uppercase text-zinc-100 truncate group-hover:text-white transition-colors">{folder}</h4>
                      <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block">
                        {isRoot ? 'Global Vault' : 'Categorized'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Thumbnail Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/10">
          <div className="w-12 h-12 rounded-full bg-zinc-950/60 border border-zinc-900 flex items-center justify-center text-zinc-500 mb-3">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Images Found</h4>
          <p className="text-xs text-zinc-550 max-w-xs mt-1">
            {selectedFolder === 'All Photos'
              ? 'No photos uploaded yet in the vault.'
              : `This folder ("${selectedFolder}") is currently empty.`} Upload a photo to fill it up!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedFolder === 'All Photos' && (
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Displaying All vault images ({filteredItems.length})
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {paginatedItems.map((item: any, idx: number) => (
              <div
                key={item.id ? `pit_img_cell_${item.id}_${idx}` : `pit_img_idx_${idx}`}
                onClick={() => {
                  if (triggerPictureViewer) {
                    triggerPictureViewer({
                      photoId: item.id || `gallery_${encodeURIComponent(item.url.slice(-30))}`,
                      username: item.authorName || 'User',
                      imageUrl: item.url,
                      avatarUrl: item.authorAvatar,
                      title: `Gallery Photo (${item.folder || 'Vault'})`,
                      caption: item.content || undefined,
                    });
                  }
                  setSelectedGalleryItem(item);
                }}
                className="group relative aspect-square bg-[#0b0c10] border border-zinc-900 hover:border-rose-500/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(244,63,94,0.06)]"
              >
                <img
                  src={item.url}
                  alt={item.content}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800';
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:brightness-110"
                />

                <span className="absolute top-2 right-2 text-[8px] font-mono font-bold bg-black/75 text-rose-300 border border-zinc-800/80 px-2 py-0.5 rounded-full z-10 uppercase truncate max-w-[100px]">
                  {item.folder}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoToDelete(item);
                  }}
                  className="absolute top-2 left-2 p-1.5 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer shadow-md"
                  title="Delete photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-white truncate font-display">{item.authorName}</span>
                  <span className="text-[8px] font-mono text-zinc-400 mt-0.5 truncate">{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length > galleryLimit && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setGalleryLimit((prev) => prev + 12)}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-850 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-400 transition-all cursor-pointer"
              >
                Show More Photos ({filteredItems.length - galleryLimit} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHOTO UPLOAD CAPTION & FOLDER SPECIFIER DIALOG (Supports multi-upload & quiet vault toggle) */}
      <AnimatePresence>
        {pendingPhotos.length > 0 && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => !isSubmittingPhotos && setPendingPhotos([])} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-[#07090d] border border-zinc-900 rounded-3xl p-5 shadow-2xl z-20 space-y-4 animate-in duration-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-950/60 border border-rose-900/60 flex items-center justify-center text-rose-500">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white">
                      File Photo Pit Uploads
                    </h3>
                    <span className="text-[9px] font-mono text-zinc-500 block">
                      {pendingPhotos.length} image{pendingPhotos.length > 1 ? 's' : ''} queued for storage
                    </span>
                  </div>
                </div>
                {!isSubmittingPhotos && (
                  <button onClick={() => setPendingPhotos([])} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Photos Preview Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Images Selected ({pendingPhotos.length})</label>
                  {pendingPhotos.length > 1 && (
                    <span className="text-[9px] text-zinc-500 font-mono">Scroll to view all</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-zinc-950/80 rounded-2xl border border-zinc-900">
                  {pendingPhotos.map((photo, idx) => (
                    <div key={`pending-photo-${idx}`} className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-850 group">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      {!isSubmittingPhotos && (
                        <button
                          type="button"
                          onClick={() => setPendingPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 bg-rose-950/90 text-rose-400 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-rose-800"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <span className="absolute bottom-1 left-1 bg-black/80 font-mono text-[7px] text-zinc-300 px-1 py-0.2 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {/* Target Album Selection */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Target Photo Pit Album</label>
                  <div className="flex gap-2">
                    <select
                      value={pendingFolder}
                      onChange={(e) => setPendingFolder(e.target.value)}
                      disabled={isSubmittingPhotos}
                      className="flex-1 bg-zinc-900 border border-zinc-850 focus:border-rose-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {foldersList.filter((f) => f !== 'All Photos').map((f, fIdx) => (
                        <option key={`folder-opt-${f}-${fIdx}`} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Caption / Context Notes */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Caption / Album Notes (Optional)</label>
                  <textarea
                    placeholder="e.g. Vintage logo marks, band identity archives, tour artwork..."
                    value={pendingCaption}
                    onChange={(e) => setPendingCaption(e.target.value)}
                    disabled={isSubmittingPhotos}
                    className="w-full bg-zinc-900 border border-zinc-850 focus:border-rose-900 rounded-xl p-2.5 text-xs text-white placeholder-zinc-600 h-16 resize-none focus:outline-none"
                  />
                </div>

                {/* FEED BROADCAST TOGGLE (Quiet vault vs Post to feed) */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  postToFeed
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : 'bg-zinc-950/60 border-zinc-850'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {postToFeed ? (
                          <Radio className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-zinc-400 shrink-0" />
                        )}
                        <span className={`text-xs font-black uppercase tracking-wide ${postToFeed ? 'text-rose-400' : 'text-zinc-300'}`}>
                          {postToFeed ? 'Broadcast to Main Feed' : 'Quiet Vault Upload (Recommended for Archives)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-normal pl-6">
                        {postToFeed
                          ? 'Each uploaded image will create a public post on your followers’ timelines.'
                          : 'Images will be quietly filed into your Photo Pit gallery without generating public feed posts.'}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      disabled={isSubmittingPhotos}
                      onClick={() => setPostToFeed((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                        postToFeed ? 'bg-rose-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          postToFeed ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-900 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmittingPhotos}
                  onClick={() => setPendingPhotos([])}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xs uppercase font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingPhotos || pendingPhotos.length === 0}
                  onClick={submitGalleryPost}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all cursor-pointer shadow-lg shadow-rose-950/50 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingPhotos ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving {pendingPhotos.length} Photo{pendingPhotos.length > 1 ? 's' : ''}...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-3.5 h-3.5" />
                      <span>{postToFeed ? 'Upload & Broadcast' : `Save ${pendingPhotos.length} to Vault`}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DUPLICATE ALBUM TO CREATIVE WORKSPACE MODAL */}
      <AnimatePresence>
        {albumToDuplicate && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => !isDuplicating && setAlbumToDuplicate(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#07090d] border border-fuchsia-800/60 rounded-3xl p-5 shadow-2xl z-20 space-y-4 animate-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-fuchsia-950/70 border border-fuchsia-700/60 flex items-center justify-center text-fuchsia-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white">
                      Duplicate Album to Creative Workspace
                    </h3>
                    <span className="text-[9px] font-mono text-fuchsia-400/80 block">
                      Sync portfolio gallery to your Creative Specialist hub
                    </span>
                  </div>
                </div>
                {!isDuplicating && (
                  <button onClick={() => setAlbumToDuplicate(null)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Album info summary */}
              <div className="bg-zinc-950/70 border border-zinc-900 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono text-[10px] uppercase">Source Album:</span>
                  <span className="text-white font-bold uppercase bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                    {albumToDuplicate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono text-[10px] uppercase">Total Photos:</span>
                  <span className="text-fuchsia-400 font-mono font-bold">
                    {galleryItems.filter((i: any) => albumToDuplicate === 'All Photos' || (i.folder || '').toLowerCase() === albumToDuplicate.toLowerCase()).length} photos
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono text-[10px] uppercase">Target Workspace:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Creative Specialist Portfolio
                  </span>
                </div>
              </div>

              {/* Target Folder Name Customization */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                  Target Album Name in Creative Workspace
                </label>
                <input
                  type="text"
                  value={targetDuplicateFolder}
                  onChange={(e) => setTargetDuplicateFolder(e.target.value)}
                  disabled={isDuplicating}
                  placeholder="e.g. Logos & Branding Archive, Graphic Design Portfolio..."
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-fuchsia-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                  maxLength={50}
                />
              </div>

              {/* Feed broadcast toggle for duplicate */}
              <div className={`p-3 rounded-2xl border transition-all ${
                duplicateBroadcastFeed ? 'bg-fuchsia-950/20 border-fuchsia-800/60' : 'bg-zinc-950/50 border-zinc-850'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase text-zinc-300 block">
                      Post Duplicated Photos to Feed?
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      {duplicateBroadcastFeed ? 'Will announce newly copied photos in the feed.' : 'Quiet vault copy (does not spam timeline).'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isDuplicating}
                    onClick={() => setDuplicateBroadcastFeed((prev) => !prev)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      duplicateBroadcastFeed ? 'bg-fuchsia-600' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        duplicateBroadcastFeed ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-900 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isDuplicating}
                  onClick={() => setAlbumToDuplicate(null)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xs uppercase font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDuplicating}
                  onClick={handleDuplicateAlbumToCreative}
                  className="px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all cursor-pointer shadow-lg shadow-fuchsia-950/50 flex items-center gap-2 disabled:opacity-50"
                >
                  {isDuplicating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Duplicating Album...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate to Creative Hub</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox / Memory Card Detail Drawer */}
      <AnimatePresence>
        {selectedGalleryItem && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div
              onClick={() => setSelectedGalleryItem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-4xl bg-[#07090d] border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 max-h-[90vh]"
            >
              <PhotoPitLightboxStage
                imageUrl={selectedGalleryItem.url}
                onClose={() => setSelectedGalleryItem(null)}
              />

              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-900 p-5 flex flex-col justify-between bg-zinc-950/60 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-rose-500 overflow-hidden text-xs shrink-0">
                      {selectedGalleryItem.authorAvatar ? (
                        <img src={selectedGalleryItem.authorAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedGalleryItem.authorName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-black text-white truncate font-display">{selectedGalleryItem.authorName}</h4>
                      <span className="text-[8px] font-mono text-zinc-550 block truncate uppercase mt-0.5">{selectedGalleryItem.authorRole}</span>
                    </div>
                  </div>

                  <div className="space-y-2 bg-zinc-900/20 p-3 rounded-xl border border-zinc-900">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">CAPTION / CONTEXT</span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      {selectedGalleryItem.content || 'Memory captured during a performance event.'}
                    </p>
                    <div className="flex justify-between items-center pt-2 text-[9px] font-mono text-zinc-500">
                      <span>Uploaded:</span>
                      <span>{selectedGalleryItem.timestamp}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                      <span>Folder Directory:</span>
                      <span className="text-rose-400 font-bold uppercase">{selectedGalleryItem.folder}</span>
                    </div>
                  </div>

                  <div className="bg-[#051109] border border-emerald-950/80 p-3 rounded-xl space-y-1.5">
                    <span className="text-[8px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest block">MEMORY SAVER HEALTH</span>
                    <div className="flex justify-between text-[10px] font-mono text-emerald-300">
                      <span>Resolution:</span>
                      <span>Scale-fitted (1024 max)</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-emerald-300">
                      <span>Format:</span>
                      <span>JPEG Compression</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-emerald-300">
                      <span>Browser Footprint:</span>
                      <span>Optimal (No leaks)</span>
                    </div>
                  </div>
                </div>

                {/* Hidden File Input for replacing image */}
                <input
                  ref={replacePhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReplacePhotoFile}
                  className="hidden"
                />

                <div className="pt-5 border-t border-zinc-900 mt-6 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isReplacingPhoto}
                      onClick={() => replacePhotoInputRef.current?.click()}
                      className="flex-1 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 hover:text-white rounded-xl py-2.5 px-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      title="Upload a new photo to replace this broken image while keeping the exact same caption and folder"
                    >
                      {isReplacingPhoto ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isReplacingPhoto ? 'Uploading...' : 'Replace Image'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoToDelete(selectedGalleryItem);
                      }}
                      className="bg-rose-950/60 hover:bg-rose-900/80 border border-rose-900/80 text-rose-300 hover:text-white rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerNotification?.("❤️ Marked photo as favorite!");
                      }}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-white rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Like
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGalleryItem(null);
                        if (setActiveTab) setActiveTab('feed');
                        triggerNotification?.("Navigating to source thread...");
                      }}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Thread
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Folder Confirmation Dialog */}
      <AnimatePresence>
        {folderToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setFolderToDelete(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#07090d] border border-rose-900/60 rounded-3xl p-5 shadow-2xl z-20 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500 border-b border-zinc-900 pb-3">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Delete Photo Folder</h3>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                Are you sure you want to delete <strong className="text-rose-400">"{folderToDelete}"</strong>?
                The folder will be removed, but all photos inside will remain safely accessible in your <strong className="text-white">All Photos</strong> global vault.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFolderToDelete(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xs uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(folderToDelete)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-colors cursor-pointer"
                >
                  Delete Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Photo Confirmation Dialog */}
      <AnimatePresence>
        {photoToDelete && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setPhotoToDelete(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#07090d] border border-rose-900/60 rounded-3xl p-5 shadow-2xl z-20 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500 border-b border-zinc-900 pb-3">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Delete Photo</h3>
              </div>

              {photoToDelete.url && (
                <div className="w-full h-32 bg-black rounded-xl border border-zinc-850 overflow-hidden relative">
                  <img src={photoToDelete.url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                Are you sure you want to permanently delete this photo? This will remove it from <strong className="text-rose-400">{photoToDelete.folder || 'Vault'}</strong> and from your feed.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoToDelete(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xs uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photoToDelete)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-colors cursor-pointer"
                >
                  Delete Photo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Storage Diagnostics Modal */}
      <AnimatePresence>
        {showDiagnosticsModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowDiagnosticsModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#07090d] border border-zinc-800 rounded-3xl p-6 shadow-2xl z-20 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-rose-500" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">photo-pit Storage Health</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">Live Supabase Storage connection test</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Header */}
              {isRunningDiagnostics ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <RefreshCw className="w-7 h-7 text-rose-500 animate-spin" />
                  <span className="text-xs font-mono text-zinc-300">Testing connection to "photo-pit" bucket...</span>
                </div>
              ) : diagnosticsResult ? (
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-2xl border ${diagnosticsResult.success ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' : 'bg-amber-950/30 border-amber-800/60 text-amber-300'} flex items-start gap-3`}>
                    {diagnosticsResult.success ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs space-y-1">
                      <div className="font-bold uppercase tracking-wider">
                        {diagnosticsResult.success ? 'Storage Connection Healthy!' : 'Storage Upload Blocked by Supabase'}
                      </div>
                      <div className="text-[11px] text-zinc-300">
                        {diagnosticsResult.success
                          ? 'The photo-pit bucket is public, readable, and accepting image uploads normally.'
                          : diagnosticsResult.errorMessage || 'Storage permissions / Row Level Security policies require setup in Supabase.'}
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Logs */}
                  <div className="bg-black/80 border border-zinc-900 rounded-xl p-3 font-mono text-[11px] space-y-1.5 text-zinc-300">
                    <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Diagnostic Details:</div>
                    {diagnosticsResult.diagnostics?.map((line: string, i: number) => (
                      <div key={`diag-line-${i}`} className="leading-relaxed">{line}</div>
                    ))}
                  </div>

                  {/* SQL Fix Helper if blocked */}
                  {!diagnosticsResult.success && (
                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">1-Click SQL Fix for Supabase:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const sql = `-- 1. Ensure photo-pit bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('photo-pit', 'photo-pit', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public and authenticated uploads & reads
DROP POLICY IF EXISTS "Public and Authenticated Upload photo-pit" ON storage.objects;
CREATE POLICY "Public and Authenticated Upload photo-pit"
ON storage.objects FOR ALL
USING (bucket_id = 'photo-pit')
WITH CHECK (bucket_id = 'photo-pit');`;
                            navigator.clipboard.writeText(sql);
                            setCopiedSql(true);
                            setTimeout(() => setCopiedSql(false), 3000);
                          }}
                          className="flex items-center gap-1 text-[10px] font-mono uppercase bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white px-2.5 py-1 rounded-lg border border-rose-900/80 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Paste and run this in your <strong>Supabase Dashboard → SQL Editor</strong> to enable instant public uploads and fix storage permissions.
                      </p>
                      <pre className="bg-black border border-zinc-850 p-2.5 rounded-lg text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre">
{`-- 1. Ensure photo-pit bucket exists & is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('photo-pit', 'photo-pit', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow uploads & access
DROP POLICY IF EXISTS "Public photo-pit" ON storage.objects;
CREATE POLICY "Public photo-pit" ON storage.objects FOR ALL
USING (bucket_id = 'photo-pit') WITH CHECK (bucket_id = 'photo-pit');`}
                      </pre>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="pt-3 flex justify-between gap-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={handleRunStorageDiagnostics}
                  disabled={isRunningDiagnostics}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl text-xs uppercase font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
                  <span>Re-test Connection</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs uppercase font-black tracking-widest transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoPitView;
