import { supabase, getRawSupabase, rawClient, getSupabase, ensureValidSupabaseAuthSession } from './supabaseClient';
import { authFetch, getSupabaseAccessToken } from '../utils/apiConfig';

/**
 * Canonical Storage & Read-Through Cache Manager
 * Consolidates Supabase Storage uploads, WebP image transcoding/compression,
 * and safe localStorage read-through cache utilities into a single module.
 */

export function isClientOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

export function sanitizeForLocalStorage<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  try {
    const clone = JSON.parse(JSON.stringify(data));

    const sanitizeValue = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string') {
          if (val.length > 30000 && (val.startsWith('data:image/') || val.startsWith('data:application/'))) {
            delete obj[key];
          }
        } else if (typeof val === 'object' && val !== null) {
          sanitizeValue(val);
        }
      }
    };

    sanitizeValue(clone);
    return clone;
  } catch (_) {
    return data;
  }
}

export function safeSetLocalStorageItem(key: string, value: any): boolean {
  if (typeof window === 'undefined') return false;

  const strVal = typeof value === 'string' ? value : JSON.stringify(value);

  if (strVal.length > 1500000 && typeof value === 'object' && value !== null) {
    const sanitized = sanitizeForLocalStorage(value);
    try {
      localStorage.setItem(key, JSON.stringify(sanitized));
      return true;
    } catch (_) {}
  }

  try {
    localStorage.setItem(key, strVal);
    return true;
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.number === -2147024882) {
      console.warn(`[StorageManager] QuotaExceededError on setting "${key}". Sanitizing payload...`);

      if (typeof value === 'object' && value !== null) {
        try {
          const sanitized = sanitizeForLocalStorage(value);
          localStorage.setItem(key, JSON.stringify(sanitized));
          return true;
        } catch (_) {}
      }

      try {
        const nonEssentialKeys = [
          'nexus_core_notifications',
          'nexus_core_shows_extended',
          'nexus_core_sales_offline',
          'nexus_master_setlists',
          'nexus_my_collections_v1',
          'distro_db_announcements'
        ];
        for (const evictKey of nonEssentialKeys) {
          if (evictKey !== key) {
            localStorage.removeItem(evictKey);
          }
        }

        const retryVal = typeof value === 'object' && value !== null
          ? JSON.stringify(sanitizeForLocalStorage(value))
          : strVal;

        localStorage.setItem(key, retryVal);
        return true;
      } catch (_) {
        console.warn(`[StorageManager] Could not write "${key}" to localStorage even after eviction.`);
      }
    } else {
      console.warn(`[StorageManager] Error setting "${key}" in localStorage:`, err);
    }
    return false;
  }
}

export function safeGetLocalStorageItem<T = string>(key: string, fallback: T | null = null): T | null {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return item as unknown as T;
  } catch (_) {
    return fallback;
  }
}

export const compressImage = async (file: File | Blob, maxWidth = 2048, quality = 0.85): Promise<Blob> => {
  if (file.type === 'image/gif' || file.type.startsWith('audio/') || !file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(blob || file),
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

const getAudioContentType = (fileName: string, mimeType?: string): string => {
  if (mimeType && mimeType.startsWith('audio/')) return mimeType;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.flac')) return 'audio/flac';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.aac')) return 'audio/aac';
  return 'audio/mpeg';
};

const getImageContentType = (fileName: string, mimeType?: string): string => {
  if (mimeType && mimeType.startsWith('image/')) return mimeType;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
};

export const uploadAudioVault = async (
  file: File | Blob,
  customName?: string,
  onProgress?: (percent: number) => void
): Promise<string | null> => {
  try {
    const originalName = (file as File).name || customName || 'master_audio.wav';
    const MAX_SIZE_BYTES = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      console.warn('File size exceeds 100MB vault limit.');
    }

    const cleanBaseName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const contentType = getAudioContentType(originalName, file.type);
    const uniqueSalt = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();

    const flatFileName = `masters/${timestamp}_${uniqueSalt}_${cleanBaseName}`;
    const simpleFileName = `${timestamp}_${uniqueSalt}_${cleanBaseName}`;

    const pathOptions = [flatFileName, simpleFileName];
    const targetBuckets = ['audio-vault', 'audio', 'feed_media', 'music', 'public-assets', 'posts'];

    for (let attempt = 1; attempt <= 3; attempt++) {
      for (const bucketName of targetBuckets) {
        for (const filePath of pathOptions) {
          try {
            const { data, error } = await supabase.storage
              .from(bucketName)
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
                contentType
              });

            if (!error && data) {
              const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(data.path);

              onProgress?.(100);
              return publicUrl;
            }
          } catch (_) {}
        }
      }

      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 600 * attempt));
      }
    }

    return null;
  } catch (err) {
    console.error('[AUDIO-VAULT CRITICAL EXCEPTION]:', err);
    return null;
  }
};

export const uploadArtworkToVault = async (
  file: File | Blob,
  customName?: string
): Promise<string | null> => {
  try {
    const originalName = (file as File).name || customName || 'artwork.jpg';
    let userId = 'anonymous';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || 'anonymous';
    } catch (_) {}

    const compressed = await compressImage(file);
    const cleanBaseName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const contentType = getImageContentType(originalName, compressed.type);
    const fileName = `artwork/${userId}/${Date.now()}_${cleanBaseName}`;

    const targetBuckets = ['community-bands', 'audio-vault', 'public-assets', 'feed_media'];

    for (const bucketName of targetBuckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, compressed, {
            cacheControl: '3600',
            upsert: true,
            contentType
          });

        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);

          return publicUrl;
        }
      } catch (_) {}
    }

    return null;
  } catch (err) {
    console.error('[ARTWORK UPLOAD EXCEPTION]:', err);
    return null;
  }
};

export const uploadFeedMedia = async (file: File): Promise<string | null> => {
  try {
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name);
    if (isAudio) {
      return uploadAudioVault(file);
    }

    const MAX_SIZE_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      console.warn('File size exceeds the 50MB limit.');
      return null;
    }

    let userId = 'anonymous';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || 'anonymous';
    } catch (_) {}

    const uploadPayload = await compressImage(file);
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('feed_media')
      .upload(fileName, uploadPayload, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });

    if (error) {
      console.error(`[STORAGE UPLOAD ERROR in feed_media]:`, error.message);
      return uploadArtworkToVault(file);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('feed_media')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error('[STORAGE EXCEPTION]:', err);
    return null;
  }
};

export function compressAndTranscodeImageToWebP(file: any): Promise<any> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(file);
      return;
    }

    const isImageObject =
      file &&
      typeof file === 'object' &&
      'type' in file &&
      typeof file.type === 'string' &&
      file.type.startsWith('image/');
    const isImageBase64 = typeof file === 'string' && file.startsWith('data:image/');

    if (!isImageObject && !isImageBase64) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        resolve(file);
        return;
      }

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxEdge = 1080;

        if (width > maxEdge || height > maxEdge) {
          if (width > height) {
            height = Math.round((height * maxEdge) / width);
            width = maxEdge;
          } else {
            width = Math.round((width * maxEdge) / height);
            height = maxEdge;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                let originalName = 'image.webp';
                if (file && typeof file === 'object' && 'name' in file && typeof (file as any).name === 'string') {
                  const originalNameStr = (file as any).name;
                  const baseName = originalNameStr.substring(0, originalNameStr.lastIndexOf('.')) || 'image';
                  originalName = `${baseName}.webp`;
                }
                const webpFile = new File([blob], originalName, { type: 'image/webp' });
                resolve(webpFile);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.8
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);

    if (file && typeof file === 'object' && ('type' in file || 'size' in file)) {
      reader.readAsDataURL(file as any);
    } else if (typeof file === 'string' && file.startsWith('data:')) {
      fetch(file)
        .then((res) => res.blob())
        .then((blob) => reader.readAsDataURL(blob))
        .catch(() => resolve(file));
    } else {
      resolve(file);
    }
  });
}

export function isValidStorageOrImageUrl(
  url?: string | null,
  _bucketType?: 'community-bands' | 'avatars' | 'bannersv2' | 'inventory-items' | 'any'
): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('undefined') || trimmed.includes('null')) return false;

  if (trimmed.startsWith('data:image/')) {
    return true;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }

  if (trimmed.startsWith('/')) {
    return true;
  }

  return false;
}

export function base64ToBlob(base64Str: string): Blob {
  const block = base64Str.split(';');
  const contentType = block[0].split(':')[1] || 'image/jpeg';

  let base64Data: string;
  if (base64Str.includes(',')) {
    base64Data = base64Str.split(',')[1];
  } else {
    base64Data = block[1]?.replace('base64,', '') || base64Str;
  }

  const cleanedData = base64Data.replace(/[\s\r\n]+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof window !== 'undefined' ? window.atob(cleanedData) : atob(cleanedData);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

export async function uploadBase64ToStorage(
  base64Str: string,
  bucketName: string,
  userId: string,
  fileNameToken = 'image'
): Promise<string> {
  if (!base64Str) return '';
  if (!base64Str.startsWith('data:')) {
    return base64Str;
  }

  const client = getRawSupabase() || rawClient || getSupabase();
  if (!client) {
    console.warn('Supabase client not available, preserving base64.');
    return base64Str;
  }

  try {
    const activeSession = await ensureValidSupabaseAuthSession(client);

    let authUserId = activeSession?.user?.id;
    if (!authUserId) {
      try {
        const { data: userData } = await client.auth.getUser();
        authUserId = userData?.user?.id;
      } catch (_) {}
    }

    const cleanRequested = bucketName ? bucketName.toLowerCase().trim() : '';
    const cleanToken = String(fileNameToken || 'asset').toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');

    let primaryBucket = 'community-bands';
    if (
      cleanRequested === 'archives' ||
      cleanRequested.includes('archive') ||
      cleanToken.includes('archive') ||
      cleanToken.includes('flyer')
    ) {
      primaryBucket = 'archives';
    } else if (cleanRequested === 'stories' || cleanRequested.includes('stori') || cleanToken.includes('story')) {
      primaryBucket = 'stories';
    } else if (cleanRequested === 'clips' || cleanRequested.includes('clip') || cleanToken.includes('clip')) {
      primaryBucket = 'clips';
    } else if (cleanRequested === 'shop-merch' || cleanRequested === 'shop_merch' || cleanToken.includes('shop') || cleanToken.includes('classified')) {
      primaryBucket = 'shop-merch';
    } else if (cleanRequested === 'inventory-items' || cleanRequested.includes('inventory') || cleanRequested.includes('merch') || cleanToken.includes('inventory') || cleanToken.includes('merch')) {
      primaryBucket = 'shop-merch';
    } else if (cleanRequested.includes('audio') || cleanRequested.includes('track') || cleanRequested.includes('music')) {
      primaryBucket = 'audio-vault';
    } else if (cleanRequested.includes('photo') || cleanRequested.includes('gallery') || cleanRequested.includes('pit')) {
      primaryBucket = 'photo-pit';
    } else if (
      cleanRequested === 'avatars' ||
      cleanToken.includes('avatar') ||
      cleanToken.includes('logo') ||
      cleanToken.includes('profile-avatar') ||
      cleanToken.includes('creative-avatar') ||
      cleanToken.includes('label-avatar') ||
      cleanToken.includes('promoter-logo')
    ) {
      primaryBucket = 'avatars';
    } else if (
      cleanRequested === 'banners' ||
      cleanRequested === 'bannersv2' ||
      cleanToken.includes('banner') ||
      cleanToken.includes('cover') ||
      cleanToken.includes('profile-banner') ||
      cleanToken.includes('creative-banner') ||
      cleanToken.includes('label-banner') ||
      cleanToken.includes('promoter-cover')
    ) {
      primaryBucket = 'bannersv2';
    } else if (
      cleanRequested === 'releases' ||
      cleanRequested === 'community-bands' ||
      !cleanRequested
    ) {
      primaryBucket = 'community-bands';
    } else if (cleanRequested === 'assets') {
      primaryBucket = 'public-assets';
    } else {
      primaryBucket = cleanRequested;
    }

    const isArchiveRequested =
      cleanRequested === 'archives' ||
      cleanRequested.includes('archive') ||
      cleanToken.includes('archive') ||
      cleanToken.includes('flyer');
    const isStoryRequested = cleanRequested === 'stories' || cleanRequested.includes('stori') || cleanToken.includes('story');
    const isClipRequested = cleanRequested === 'clips' || cleanRequested.includes('clip') || cleanToken.includes('clip');
    const bucketCandidates = Array.from(
      new Set(
        [
          primaryBucket,
          ...(isArchiveRequested ? ['archives', 'public-assets', 'community-bands', 'feed_media', 'bannersv2'] : []),
          ...(isStoryRequested ? ['stories', 'photo-pit', 'clips', 'public-assets', 'media'] : []),
          ...(isClipRequested ? ['clips'] : []),
          'archives',
          'stories',
          'photo-pit',
          'community-bands',
          'public-assets',
          'media',
          cleanRequested,
          'shop-merch',
          'inventory-items',
          'avatars',
          'bannersv2',
          'audio-vault',
        ].filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
      )
    );

    const cleanAuthId = String(authUserId || userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const blob = base64ToBlob(base64Str);
    const mimeType = blob.type || 'image/jpeg';
    const fileExt = (mimeType.split('/')[1] || 'webp').toLowerCase().replace('jpeg', 'jpg');
    const timestamp = Date.now();

    let lastErrorMessage = '';

    for (const targetBucket of bucketCandidates) {
      const folderPath = `${cleanAuthId}/${cleanToken}_${timestamp}.${fileExt}`;
      const flatPath = `${cleanToken}_${cleanAuthId}_${timestamp}.${fileExt}`;
      const pathAttempts = [folderPath, flatPath];

      for (const currentPath of pathAttempts) {
        try {
          const { data: uploadData, error: uploadError } = await client.storage
            .from(targetBucket)
            .upload(currentPath, blob, {
              upsert: true,
              cacheControl: '31536000',
              contentType: mimeType,
            });

          if (!uploadError && uploadData) {
            const finalPath = uploadData.path || currentPath;
            const { data: publicUrlData } = client.storage.from(targetBucket).getPublicUrl(finalPath);
            if (publicUrlData?.publicUrl && !publicUrlData.publicUrl.startsWith('data:')) {
              return publicUrlData.publicUrl;
            }
          } else if (uploadError) {
            lastErrorMessage = uploadError.message;
          }
        } catch (attemptErr: any) {
          lastErrorMessage = attemptErr?.message || String(attemptErr);
        }
      }
    }

    console.warn(`[STORAGE UPLOAD NOTICE] Storage upload returned without remote URL (${lastErrorMessage || 'no matching bucket'}). Using local Base64 preview data.`);
    return base64Str;
  } catch (err: any) {
    console.warn('[STORAGE HELPER WARNING] Exception uploading asset, using local Base64 data URI:', err?.message || err);
    return base64Str;
  }
}

export async function uploadCommunityBandMedia(
  imageInput: string | File | null | undefined,
  bandId: string,
  mediaType: 'logo' | 'cover' | 'banner' | 'avatar' = 'logo'
): Promise<string> {
  if (!imageInput) return '';
  if (typeof imageInput === 'string' && !imageInput.startsWith('data:')) {
    return imageInput;
  }

  try {
    const resolvedBandId = bandId || 'band';
    const token = (mediaType === 'logo' || mediaType === 'avatar') ? 'band-logo' : 'band-cover';

    let processedFile: any = imageInput;
    if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
      processedFile = await compressAndTranscodeImageToWebP(imageInput);
    } else if (typeof imageInput === 'object' && imageInput instanceof File) {
      processedFile = await compressAndTranscodeImageToWebP(imageInput);
    }

    let base64String = '';
    if (typeof processedFile === 'string') {
      base64String = processedFile;
    } else if (processedFile instanceof File || processedFile instanceof Blob) {
      base64String = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(processedFile);
      });
    }

    if (!base64String) {
      return typeof imageInput === 'string' ? imageInput : '';
    }

    const publicUrl = await uploadBase64ToStorage(
      base64String,
      'community-bands',
      resolvedBandId,
      token
    );

    if (publicUrl && !publicUrl.startsWith('data:')) {
      try {
        if (resolvedBandId && resolvedBandId !== 'band') {
          if (token === 'band-logo') {
            localStorage.setItem(`nexus_core_band_logo_${resolvedBandId}`, publicUrl);
          } else {
            localStorage.setItem(`nexus_core_band_cover_${resolvedBandId}`, publicUrl);
          }
        }
      } catch (_) {}

      return publicUrl;
    }

    return typeof imageInput === 'string' ? imageInput : '';
  } catch (err) {
    console.warn(`[uploadCommunityBandMedia] Error uploading ${mediaType}:`, err);
    return typeof imageInput === 'string' ? imageInput : '';
  }
}

export async function uploadArchiveFlyer(
  imageInput: string | File | Blob | null | undefined,
  showId: string = 'archive-show',
  customTitle: string = 'flyer'
): Promise<string> {
  if (!imageInput) return '';
  if (typeof imageInput === 'string' && !imageInput.startsWith('data:')) {
    return imageInput;
  }

  try {
    const resolvedShowId = showId || `show_${Date.now()}`;
    const cleanToken = `flyer_${customTitle.substring(0, 30).toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    let processedFile: any = imageInput;
    if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
      processedFile = await compressAndTranscodeImageToWebP(imageInput);
    } else if (typeof imageInput === 'object' && (imageInput instanceof File || imageInput instanceof Blob)) {
      processedFile = await compressAndTranscodeImageToWebP(imageInput);
    }

    let base64String = '';
    if (typeof processedFile === 'string') {
      base64String = processedFile;
    } else if (processedFile instanceof File || processedFile instanceof Blob) {
      base64String = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(processedFile);
      });
    }

    if (!base64String) {
      return typeof imageInput === 'string' ? imageInput : '';
    }

    const publicUrl = await uploadBase64ToStorage(
      base64String,
      'archives',
      resolvedShowId,
      cleanToken
    );

    if (publicUrl && !publicUrl.startsWith('data:')) {
      return publicUrl;
    }

    return publicUrl || (typeof imageInput === 'string' ? imageInput : '');
  } catch (err) {
    console.warn(`[uploadArchiveFlyer] Error uploading archive flyer to 'archives' bucket:`, err);
    return typeof imageInput === 'string' ? imageInput : '';
  }
}

export async function testPhotoPitStorageConnection(): Promise<{
  success: boolean;
  bucketExists: boolean;
  canWrite: boolean;
  publicUrlAccessible: boolean;
  errorMessage?: string;
  testedBucket: string;
  samplePublicUrl?: string;
  diagnostics: string[];
}> {
  const diagnostics: string[] = [];
  const client = getRawSupabase() || rawClient || getSupabase();

  if (!client) {
    return {
      success: false,
      bucketExists: false,
      canWrite: false,
      publicUrlAccessible: false,
      testedBucket: 'photo-pit',
      errorMessage: 'Supabase client is not initialized or offline.',
      diagnostics: ['Supabase client is not initialized.']
    };
  }

  const targetBucket = 'photo-pit';
  diagnostics.push(`1. Checking Supabase project client... connected.`);

  let bucketExists = false;
  let canWrite = false;
  let publicUrlAccessible = false;
  let samplePublicUrl = '';
  let errorMessage = '';

  try {
    const { data: buckets, error: listError } = await client.storage.listBuckets();
    if (listError) {
      diagnostics.push(`listBuckets() restricted: ${listError.message}`);
    } else if (buckets) {
      const found = buckets.find((b: any) => b.id === targetBucket || b.name === targetBucket);
      if (found) {
        bucketExists = true;
        diagnostics.push(`Bucket "${targetBucket}" found in Supabase (public: ${Boolean(found.public)}).`);
      } else {
        diagnostics.push(`Bucket "${targetBucket}" not found in list.`);
      }
    }

    const testBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])], { type: 'image/png' });
    const testPath = `_test_connection_${Date.now()}.png`;

    const { error: uploadError } = await client.storage
      .from(targetBucket)
      .upload(testPath, testBlob, {
        upsert: true,
        contentType: 'image/png'
      });

    if (uploadError) {
      errorMessage = uploadError.message;
      diagnostics.push(`Write to "${targetBucket}" failed: ${uploadError.message}`);
    } else {
      canWrite = true;
      bucketExists = true;
      diagnostics.push(`Write test to "${targetBucket}" succeeded!`);

      const { data: urlData } = client.storage.from(targetBucket).getPublicUrl(testPath);
      if (urlData?.publicUrl) {
        samplePublicUrl = urlData.publicUrl;
        publicUrlAccessible = true;
      }

      try {
        await client.storage.from(targetBucket).remove([testPath]);
      } catch (_) {}
    }

    return {
      success: canWrite && publicUrlAccessible,
      bucketExists,
      canWrite,
      publicUrlAccessible,
      testedBucket: targetBucket,
      samplePublicUrl,
      errorMessage: errorMessage || undefined,
      diagnostics
    };
  } catch (e: any) {
    return {
      success: false,
      bucketExists,
      canWrite,
      publicUrlAccessible,
      testedBucket: targetBucket,
      errorMessage: e?.message || String(e),
      diagnostics: [...diagnostics, `Exception during test: ${e?.message || e}`]
    };
  }
}

export async function ensureImagesUploadedToStorage(payload: any): Promise<any> {
  if (!payload || typeof payload !== 'object') return payload;

  const isArray = Array.isArray(payload);
  const items = isArray ? payload : [payload];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const isCreative = Boolean(
      'business_name' in item ||
        'creative_name' in item ||
        'creative_handle' in item ||
        'day_rate' in item ||
        'primary_category' in item ||
        'portfolio_link' in item ||
        ('creator_id' in item &&
          ('skills' in item ||
            'gear' in item ||
            'gear_tags' in item ||
            'primary_gear' in item ||
            'availability_status' in item))
    );

    const isBand = Boolean(
      !isCreative &&
        ('band_name' in item ||
          ('creator_id' in item &&
            ('tech_rider_url' in item || 'tour_vehicle' in item || 'lineup' in item || 'micro_genres' in item)) ||
          ('logo_url' in item &&
            !('email' in item ||
              'account_type' in item ||
              'role' in item ||
              'full_name' in item ||
              'console_handle' in item ||
              'creative_avatar' in item)))
    );

    const isProfile = Boolean(
      !isCreative &&
        !isBand &&
        ('email' in item ||
          'account_type' in item ||
          'console_handle' in item ||
          'registered_workspaces' in item ||
          'full_name' in item)
    );

    const userId = item.id || item.user_id || item.creator_id || 'user';

    if (isCreative) {
      const creativeAvatarKeys = ['avatar_url', 'creative_avatar', 'avatar', 'image'];
      let uploadedAvatarUrl: string | null = null;
      let existingAvatarUrl: string | null = null;

      for (const key of creativeAvatarKeys) {
        const val = item[key];
        if (typeof val === 'string' && val.trim().length > 0) {
          if (val.startsWith('data:image/') || val.startsWith('data:')) {
            try {
              const publicUrl = await uploadBase64ToStorage(val, 'avatars', userId, 'creative-avatar');
              if (publicUrl && typeof publicUrl === 'string') {
                item[key] = publicUrl;
                if (!uploadedAvatarUrl && !publicUrl.startsWith('data:')) {
                  uploadedAvatarUrl = publicUrl;
                }
              }
            } catch (_) {}
          } else if (!existingAvatarUrl && !val.includes('Nexus%20Icon%20Circuits.png')) {
            existingAvatarUrl = val;
          }
        }
      }

      item.avatar_url = uploadedAvatarUrl || existingAvatarUrl || item.avatar_url || item.creative_avatar || null;

      const creativeBannerKeys = ['banner_url', 'creative_banner', 'banner', 'cover_url'];
      let uploadedBannerUrl: string | null = null;
      let existingBannerUrl: string | null = null;

      for (const key of creativeBannerKeys) {
        const val = item[key];
        if (typeof val === 'string' && val.trim().length > 0) {
          if (val.startsWith('data:image/') || val.startsWith('data:')) {
            try {
              const publicUrl = await uploadBase64ToStorage(val, 'bannersv2', userId, 'creative-banner');
              if (publicUrl && typeof publicUrl === 'string') {
                item[key] = publicUrl;
                if (!uploadedBannerUrl && !publicUrl.startsWith('data:')) {
                  uploadedBannerUrl = publicUrl;
                }
              }
            } catch (_) {}
          } else if (!existingBannerUrl) {
            existingBannerUrl = val;
          }
        }
      }

      item.banner_url = uploadedBannerUrl || existingBannerUrl || item.banner_url || item.creative_banner || null;
      delete item.cover_url;
      delete item.band_name;
      delete item.band_id;
    } else if (isBand && !isProfile) {
      const bandLogoKeys = ['logo_url', 'logo', 'band_logo'];
      let uploadedLogoUrl: string | null = null;
      let existingLogoUrl: string | null = null;

      for (const key of bandLogoKeys) {
        const val = item[key];
        if (typeof val === 'string' && val.trim().length > 0) {
          if (val.startsWith('data:image/') || val.startsWith('data:')) {
            try {
              const publicUrl = await uploadBase64ToStorage(val, 'community-bands', userId, 'band-logo');
              if (publicUrl && typeof publicUrl === 'string') {
                item[key] = publicUrl;
                if (!uploadedLogoUrl && !publicUrl.startsWith('data:')) {
                  uploadedLogoUrl = publicUrl;
                }
              }
            } catch (_) {}
          } else if (!existingLogoUrl && !val.includes('Nexus%20Icon%20Circuits.png')) {
            existingLogoUrl = val;
          }
        }
      }

      item.logo_url = uploadedLogoUrl || existingLogoUrl || item.logo_url || null;

      const bandCoverKeys = ['cover_url', 'cover', 'band_cover'];
      let uploadedCoverUrl: string | null = null;
      let existingCoverUrl: string | null = null;

      for (const key of bandCoverKeys) {
        const val = item[key];
        if (typeof val === 'string' && val.trim().length > 0) {
          if (val.startsWith('data:image/') || val.startsWith('data:')) {
            try {
              const publicUrl = await uploadBase64ToStorage(val, 'community-bands', userId, 'band-cover');
              if (publicUrl && typeof publicUrl === 'string') {
                item[key] = publicUrl;
                if (!uploadedCoverUrl && !publicUrl.startsWith('data:')) {
                  uploadedCoverUrl = publicUrl;
                }
              }
            } catch (_) {}
          } else if (!existingCoverUrl) {
            existingCoverUrl = val;
          }
        }
      }

      item.cover_url = uploadedCoverUrl || existingCoverUrl || item.cover_url || null;

      delete item.avatar_url;
      delete item.avatarUrl;
      delete item.avatar;
      delete item.creative_avatar;
      delete item.promoter_logo;
      delete item.label_avatar;
      delete item.profileAvatarUrl;
      delete item.banner_url;
      delete item.bannerUrl;
      delete item.banner;
      delete item.creative_banner;
      delete item.promoter_cover_image;
      delete item.label_banner;
      delete item.coverImage;
      delete item.profileCoverUrl;
      delete item.logo;
      delete item.band_logo;
      delete item.cover;
      delete item.band_cover;
    } else {
      const personalAvatarKeys = [
        'avatar_url',
        'avatarUrl',
        'avatar',
        'profileAvatarUrl',
      ];
      let uploadedAvatarUrl: string | null = null;
      let existingAvatarUrl: string | null = null;

      for (const key of personalAvatarKeys) {
        const val = item[key];
        if (typeof val === 'string' && val.trim().length > 0) {
          if (val.startsWith('data:image/') || val.startsWith('data:')) {
            try {
              const publicUrl = await uploadBase64ToStorage(val, 'avatars', userId, 'profile-avatar');
              if (publicUrl && typeof publicUrl === 'string') {
                item[key] = publicUrl;
                if (!uploadedAvatarUrl && !publicUrl.startsWith('data:')) {
                  uploadedAvatarUrl = publicUrl;
                }
              }
            } catch (_) {}
          } else if (!existingAvatarUrl && !val.includes('Nexus%20Icon%20Circuits.png')) {
            existingAvatarUrl = val;
          }
        }
      }

      if (uploadedAvatarUrl || existingAvatarUrl) {
        item.avatar_url = uploadedAvatarUrl || existingAvatarUrl || item.avatar_url || null;
      }

      const personalBannerKeys = [
        'banner_url',
        'bannerUrl',
        'banner',
        'coverImage',
        'profileCoverUrl',
      ];
      let uploadedBannerUrl: string | null = null;
      let existingBannerUrl: string | null = null;

      for (const key of personalBannerKeys) {
        const val = item[key];
        if (typeof val === 'string' && val.trim().length > 0) {
          if (val.startsWith('data:image/') || val.startsWith('data:')) {
            try {
              const publicUrl = await uploadBase64ToStorage(val, 'bannersv2', userId, 'profile-banner');
              if (publicUrl && typeof publicUrl === 'string') {
                item[key] = publicUrl;
                if (!uploadedBannerUrl && !publicUrl.startsWith('data:')) {
                  uploadedBannerUrl = publicUrl;
                }
              }
            } catch (_) {}
          } else if (!existingBannerUrl) {
            existingBannerUrl = val;
          }
        }
      }

      if (uploadedBannerUrl || existingBannerUrl) {
        item.banner_url = uploadedBannerUrl || existingBannerUrl || item.banner_url || null;
      }
      if (item.cover_url !== undefined && isProfile) {
        item.cover_url = uploadedBannerUrl || existingBannerUrl || item.cover_url || null;
      }

      if (item.creative_avatar && typeof item.creative_avatar === 'string' && item.creative_avatar.startsWith('data:')) {
        try {
          const publicUrl = await uploadBase64ToStorage(item.creative_avatar, 'avatars', userId, 'creative-avatar');
          if (publicUrl) item.creative_avatar = publicUrl;
        } catch (_) {}
      }
      if (item.creative_banner && typeof item.creative_banner === 'string' && item.creative_banner.startsWith('data:')) {
        try {
          const publicUrl = await uploadBase64ToStorage(item.creative_banner, 'bannersv2', userId, 'creative-banner');
          if (publicUrl) item.creative_banner = publicUrl;
        } catch (_) {}
      }
    }
  }

  return isArray ? items : items[0];
}

export async function uploadClipVideoFile(
  file: File | Blob | string,
  userId: string = 'user',
  fileNameToken: string = 'clip'
): Promise<string> {
  if (!file) return '';

  if (typeof file === 'string') {
    if (file.startsWith('http://') || file.startsWith('https://')) {
      if (!file.startsWith('blob:')) {
        return file;
      }
    }
  }

  const client = getRawSupabase() || rawClient || getSupabase();
  if (!client) {
    console.warn('[STORAGE] Supabase client unavailable for clip upload.');
    return '';
  }

  try {
    const activeSession = await ensureValidSupabaseAuthSession(client);
    const authUserId = activeSession?.user?.id || userId || 'user';
    const cleanAuthId = String(authUserId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanToken = String(fileNameToken || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();

    let uploadPayload: Blob | File;
    if (typeof file === 'string' && file.startsWith('data:')) {
      try {
        const parts = file.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        uploadPayload = new Blob([u8arr], { type: mime });
      } catch (convErr) {
        console.warn('[STORAGE] Data URL conversion failed:', convErr);
        return '';
      }
    } else if (typeof file === 'object' && file !== null) {
      uploadPayload = file as Blob | File;
    } else {
      return '';
    }

    let rawName = 'clip.mp4';
    if (uploadPayload && typeof uploadPayload === 'object' && 'name' in uploadPayload && typeof (uploadPayload as any).name === 'string') {
      rawName = (uploadPayload as any).name;
    }
    const extMatch = rawName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'mp4';
    const cleanBaseName = rawName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const safeFileName = `${cleanBaseName || 'clip'}.${ext}`;

    let contentType = 'video/mp4';
    if (uploadPayload && typeof uploadPayload === 'object' && 'type' in uploadPayload && typeof (uploadPayload as any).type === 'string' && (uploadPayload as any).type && (uploadPayload as any).type !== 'application/octet-stream') {
      contentType = (uploadPayload as any).type;
    } else if (ext === 'webm') {
      contentType = 'video/webm';
    } else if (ext === 'mov') {
      contentType = 'video/quicktime';
    } else {
      contentType = 'video/mp4';
    }

    const flatPath = `${cleanToken}_${cleanAuthId}_${timestamp}_${safeFileName}`;
    const candidateBuckets = ['clips', 'posts', 'photo-pit-media'];

    for (const bName of candidateBuckets) {
      try {
        const { data: uploadData, error: uploadError } = await client.storage
          .from(bName)
          .upload(flatPath, uploadPayload, {
            upsert: true,
            cacheControl: '3600',
            contentType,
          });

        if (!uploadError && uploadData) {
          const finalPath = uploadData.path || flatPath;
          const { data: publicUrlData } = client.storage.from(bName).getPublicUrl(finalPath);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch (_) {}
    }

    try {
      let base64String = '';
      if (typeof file === 'string' && file.startsWith('data:')) {
        base64String = file;
      } else if (uploadPayload && uploadPayload.size < 250 * 1024 * 1024) {
        base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadPayload);
        });
      }

      if (base64String && (await getSupabaseAccessToken())) {
        const response = await authFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data: base64String,
            bucket: 'clips',
            userId: cleanAuthId,
            fileNameToken: cleanToken
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.publicUrl) {
            return resJson.publicUrl;
          }
        }
      }
    } catch (_) {}

    if (typeof file === 'object' && file !== null) {
      return URL.createObjectURL(file as Blob);
    }

    return '';
  } catch (err: any) {
    console.error('[STORAGE HELPER ERROR] Failed uploading clip file:', err);
    return '';
  }
}

export async function uploadStoryMediaToStorage(
  media: File | Blob | string,
  userId?: string,
  mediaType: 'image' | 'video' = 'image'
): Promise<string> {
  if (!media) return '';

  const client = getRawSupabase() || rawClient || getSupabase();
  if (!client) {
    return typeof media === 'string' ? media : '';
  }

  try {
    const activeSession = await ensureValidSupabaseAuthSession(client);
    const authUserId = activeSession?.user?.id || userId || 'user';
    const cleanAuthId = String(authUserId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();

    let uploadPayload: Blob;
    let mimeType: string;
    let fileExt: string;

    if (typeof media === 'string') {
      if (media.startsWith('http://') || media.startsWith('https://')) {
        return media;
      }
      uploadPayload = base64ToBlob(media);
      mimeType = uploadPayload.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
      fileExt = (mimeType.split('/')[1] || (mediaType === 'video' ? 'mp4' : 'jpg')).toLowerCase().replace('jpeg', 'jpg');
    } else {
      uploadPayload = media;
      mimeType = media.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
      const nameExt = 'name' in media && typeof (media as any).name === 'string' ? (media as any).name.split('.').pop() : '';
      fileExt = (nameExt || mimeType.split('/')[1] || (mediaType === 'video' ? 'mp4' : 'jpg')).toLowerCase().replace('jpeg', 'jpg');
    }

    const bucketCandidates = ['stories', 'photo-pit', 'clips', 'media', 'community-bands', 'public-assets'];

    const cleanToken = `story_${timestamp}`;
    const folderPath = `${cleanAuthId}/${cleanToken}.${fileExt}`;
    const flatPath = `${cleanToken}_${cleanAuthId}.${fileExt}`;
    const directPath = `story_${cleanAuthId}_${timestamp}.${fileExt}`;

    for (const targetBucket of bucketCandidates) {
      for (const currentPath of [folderPath, flatPath, directPath]) {
        try {
          const { data: uploadData, error: uploadError } = await client.storage
            .from(targetBucket)
            .upload(currentPath, uploadPayload, {
              upsert: true,
              cacheControl: '3600',
              contentType: mimeType,
            });

          if (!uploadError && uploadData) {
            const finalPath = uploadData.path || currentPath;
            const { data: publicUrlData } = client.storage.from(targetBucket).getPublicUrl(finalPath);
            if (publicUrlData?.publicUrl && !publicUrlData.publicUrl.startsWith('data:')) {
              return `${publicUrlData.publicUrl}?t=${timestamp}`;
            }
          }
        } catch (_) {}
      }
    }

    return typeof media === 'string' ? media : '';
  } catch (err: any) {
    console.error('[STORIES STORAGE ERROR] Failed uploading story media:', err);
    return typeof media === 'string' ? media : '';
  }
}
