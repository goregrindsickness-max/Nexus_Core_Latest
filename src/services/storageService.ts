import { getRawSupabase, rawClient, getSupabase, ensureValidSupabaseAuthSession } from './clientService';

/**
 * Strips EXIF coordinates/camera tags by drawing onto 2D canvas,
 * downscales to max 1200px constraint, and transcodes to lightweight WebP at 80% quality.
 */
export function compressAndTranscodeImageToWebP(file: any): Promise<any> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(file);
      return;
    }

    // Identify if the payload is an image using robust property checks
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
        const maxEdge = 1200;

        // Strip EXIF coordinates/camera tags by drawing onto 2D canvas,
        // and systematically downscale to maximum 1200px constraint on longest edge
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

          // Transcode to lightweight WebP at 80% quality threshold
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
      img.onerror = () => {
        resolve(file);
      };
    };
    reader.onerror = () => {
      resolve(file);
    };

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

/**
 * Validates whether a given string is a legitimate image URL or Supabase storage object URL.
 */
export function isValidStorageOrImageUrl(
  url?: string | null,
  bucketType?: 'community-bands' | 'avatars' | 'bannersv2' | 'inventory-items' | 'any'
): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Rule 1: Allow Valid Supabase Storage URLs
  if (
    trimmed.includes('/storage/v1/object/public/stories/') ||
    trimmed.includes('/storage/v1/object/public/inventory-items/') ||
    trimmed.includes('/storage/v1/object/public/community-bands/') ||
    trimmed.includes('/storage/v1/object/public/avatars/') ||
    trimmed.includes('/storage/v1/object/public/bannersv2/') ||
    trimmed.includes('/storage/v1/object/public/clips/') ||
    trimmed.includes('/storage/v1/object/public/') ||
    trimmed.includes('/stories/') ||
    trimmed.includes('/inventory-items/') ||
    trimmed.includes('/community-bands/') ||
    trimmed.includes('/avatars/') ||
    trimmed.includes('/bannersv2/') ||
    trimmed.includes('/clips/')
  ) {
    if (!trimmed.includes('Nexus%20Icon%20Circuits.png') && !trimmed.includes('Nexus Icon Circuits.png')) {
      return true;
    }
  }

  // Explicitly reject fallback asset and default unsplash placeholders
  if (
    trimmed.includes('Nexus%20Icon%20Circuits.png') ||
    trimmed.includes('Nexus Icon Circuits.png') ||
    trimmed.includes('unsplash.com')
  ) {
    return false;
  }

  // Base64 data URIs
  if (trimmed.startsWith('data:image/')) {
    return true;
  }

  // Any other valid HTTP/HTTPS image URL (not fallback or unsplash)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }

  return false;
}

/**
 * Converts a Base64 data URI string to a binary Blob object.
 */
export function base64ToBlob(base64Str: string): Blob {
  // Safe extraction check in case the string header format varies
  const block = base64Str.split(';');
  const contentType = block[0].split(':')[1] || 'image/jpeg';

  let base64Data: string;
  if (base64Str.includes(',')) {
    base64Data = base64Str.split(',')[1];
  } else {
    base64Data = block[1]?.replace('base64,', '') || base64Str;
  }

  // Clean whitespace/newlines and replace URL-safe characters for robust decoding
  const cleanedData = base64Data.replace(/[\s\r\n]+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof window !== 'undefined' ? window.atob(cleanedData) : atob(cleanedData);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Uploads a Base64 data URI image to Supabase Storage and returns its public URL.
 * If the string does not start with "data:", it is treated as a regular URL and returned directly.
 */
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
    // Proactively verify and refresh session to ensure active Bearer token is attached
    const activeSession = await ensureValidSupabaseAuthSession(client);

    let authUserId = activeSession?.user?.id;
    if (!authUserId) {
      try {
        const { data: userData } = await client.auth.getUser();
        authUserId = userData?.user?.id;
      } catch (_) {}
    }

    // Target bucket normalization with flexible candidate fallbacks
    const cleanRequested = bucketName ? bucketName.toLowerCase().trim() : '';
    const cleanToken = String(fileNameToken || 'asset').toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');

    let primaryBucket = 'community-bands';
    if (cleanRequested === 'stories' || cleanRequested.includes('stori') || cleanToken.includes('story')) {
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
    } else {
      primaryBucket = cleanRequested;
    }

    const isStoryRequested = cleanRequested === 'stories' || cleanRequested.includes('stori') || cleanToken.includes('story');
    const isClipRequested = cleanRequested === 'clips' || cleanRequested.includes('clip') || cleanToken.includes('clip');
    const bucketCandidates = Array.from(
      new Set(
        [
          primaryBucket,
          ...(isStoryRequested ? ['stories', 'photo-pit', 'clips', 'public-assets', 'media'] : []),
          ...(isClipRequested ? ['clips'] : []),
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

    // Bucket creation handled manually in Supabase Dashboard UI
    if (primaryBucket) {
      // Skipped client-side createBucket
    }

    let lastErrorMessage = '';

    for (const targetBucket of bucketCandidates) {
      // Path option 1: folder-namespaced path (authUserId/filename)
      const folderPath = `${cleanAuthId}/${cleanToken}_${timestamp}.${fileExt}`;
      // Path option 2: flat root path
      const flatPath = `${cleanToken}_${cleanAuthId}_${timestamp}.${fileExt}`;

      const pathAttempts = [folderPath, flatPath];

      for (const currentPath of pathAttempts) {
        try {
          const { data: uploadData, error: uploadError } = await client.storage
            .from(targetBucket)
            .upload(currentPath, blob, {
              upsert: true,
              cacheControl: '3600',
              contentType: mimeType,
            });

          if (!uploadError && uploadData) {
            const finalPath = uploadData.path || currentPath;
            const { data: publicUrlData } = client.storage.from(targetBucket).getPublicUrl(finalPath);
            if (publicUrlData?.publicUrl && !publicUrlData.publicUrl.startsWith('data:')) {
              const finalPublicUrl = `${publicUrlData.publicUrl}?t=${timestamp}`;
              console.log(`[STORAGE UPLOAD SUCCESS] Stored image in bucket "${targetBucket}" (${finalPath}):`, finalPublicUrl);
              return finalPublicUrl;
            }
          } else if (uploadError) {
            lastErrorMessage = uploadError.message;
            console.warn(
              `[STORAGE UPLOAD ATTEMPT] Bucket "${targetBucket}" path "${currentPath}" error:`,
              uploadError.message
            );
          }
        } catch (attemptErr: any) {
          lastErrorMessage = attemptErr?.message || String(attemptErr);
          console.warn(`[STORAGE UPLOAD ATTEMPT ERROR] ${targetBucket}/${currentPath}:`, attemptErr?.message || attemptErr);
        }
      }
    }

    console.warn(`[STORAGE UPLOAD NOTICE] All storage bucket upload attempts completed without a remote URL (${lastErrorMessage || 'no matching bucket'}). Retaining local asset data.`);
    return base64Str;
  } catch (err: any) {
    console.warn('[STORAGE HELPER WARNING] Exception uploading asset:', err?.message || err);
    return base64Str;
  }
}

/**
 * Standardized single helper utility for uploading community band media (logo or cover)
 * ensuring consistent storage path ('community-bands' bucket), transcoding, metadata handling, and persistence logic.
 */
export async function uploadCommunityBandMedia(
  imageInput: string | File | null | undefined,
  bandId: string,
  mediaType: 'logo' | 'cover' | 'banner' | 'avatar' = 'logo'
): Promise<string> {
  if (!imageInput) return '';
  if (typeof imageInput === 'string' && !imageInput.startsWith('data:')) {
    return imageInput; // Already a remote storage URL
  }

  try {
    const resolvedBandId = bandId || 'band';
    const token = (mediaType === 'logo' || mediaType === 'avatar') ? 'band-logo' : 'band-cover';
    
    // 1. Transcode/compress image to WebP
    let processedFile: any = imageInput;
    if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
      processedFile = await compressAndTranscodeImageToWebP(imageInput);
    } else if (typeof imageInput === 'object' && imageInput instanceof File) {
      processedFile = await compressAndTranscodeImageToWebP(imageInput);
    }

    // 2. Convert processed file/blob to base64 string
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

    // 3. Upload to Supabase Storage using standardized 'community-bands' bucket
    const publicUrl = await uploadBase64ToStorage(
      base64String,
      'community-bands',
      resolvedBandId,
      token
    );

    if (publicUrl && !publicUrl.startsWith('data:')) {
      // Synchronize to localStorage cache for robustness across sessions
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

/**
 * Diagnostics function to live-test Supabase Storage connectivity to the 'photo-pit' bucket.
 */
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
      diagnostics: ['❌ Supabase client is not initialized.']
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
    // 1. Check if bucket exists
    const { data: buckets, error: listError } = await client.storage.listBuckets();
    if (listError) {
      diagnostics.push(`⚠️ listBuckets() restricted: ${listError.message}`);
    } else if (buckets) {
      const found = buckets.find((b: any) => b.id === targetBucket || b.name === targetBucket);
      if (found) {
        bucketExists = true;
        diagnostics.push(`✅ Bucket "${targetBucket}" found in Supabase (public: ${Boolean(found.public)}).`);
      } else {
        diagnostics.push(`⚠️ Bucket "${targetBucket}" not found in list. Available buckets: ${buckets.map((b: any) => b.name).join(', ') || 'none'}.`);
      }
    }

    // 2. Bucket creation handled manually in Supabase Dashboard UI
    if (!bucketExists) {
      diagnostics.push(`ℹ️ Skipped createBucket API call. Ensure bucket "${targetBucket}" exists in Supabase Dashboard.`);
    }

    // 3. Test writing a 1x1 test pixel
    const testBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])], { type: 'image/png' });
    const testPath = `_test_connection_${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await client.storage
      .from(targetBucket)
      .upload(testPath, testBlob, {
        upsert: true,
        contentType: 'image/png'
      });

    if (uploadError) {
      errorMessage = uploadError.message;
      diagnostics.push(`❌ Write to "${targetBucket}" failed: ${uploadError.message}`);
      if (uploadError.message?.toLowerCase().includes('row-level security') || (uploadError as any).statusCode === '42501') {
        diagnostics.push(`💡 Cause: Row-Level Security (RLS) is blocking uploads. Need INSERT policy on storage.objects.`);
      } else if (uploadError.message?.toLowerCase().includes('not found')) {
        diagnostics.push(`💡 Cause: Bucket "${targetBucket}" does not exist in Supabase storage.`);
      }
    } else {
      canWrite = true;
      bucketExists = true;
      diagnostics.push(`✅ Write test to "${targetBucket}" succeeded!`);

      // 4. Test public URL generation
      const { data: urlData } = client.storage.from(targetBucket).getPublicUrl(testPath);
      if (urlData?.publicUrl) {
        samplePublicUrl = urlData.publicUrl;
        publicUrlAccessible = true;
        diagnostics.push(`✅ Public URL generated: ${urlData.publicUrl}`);
      }

      // Cleanup test file
      try {
        await client.storage.from(targetBucket).remove([testPath]);
        diagnostics.push(`✅ Test file cleaned up.`);
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
      diagnostics: [...diagnostics, `❌ Exception during test: ${e?.message || e}`]
    };
  }
}

/**
 * Automatically uploads Base64 image data URIs present in entity payloads to Supabase Storage.
 */
export async function ensureImagesUploadedToStorage(payload: any): Promise<any> {
  if (!payload || typeof payload !== 'object') return payload;

  const isArray = Array.isArray(payload);
  const items = isArray ? payload : [payload];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    if (import.meta.env.DEV && false) {
      console.log('[Debug Payload Incoming]:', item);
    }

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
      // Process creative avatar (avatar_url / creative_avatar)
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
            } catch (e) {
              console.warn(`[Storage] Upload failed for creative avatar ${key}:`, e);
            }
          } else if (!existingAvatarUrl && !val.includes('Nexus%20Icon%20Circuits.png')) {
            existingAvatarUrl = val;
          }
        }
      }

      item.avatar_url = uploadedAvatarUrl || existingAvatarUrl || item.avatar_url || item.creative_avatar || null;

      // Process creative banner (banner_url / creative_banner)
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
            } catch (e) {
              console.warn(`[Storage] Upload failed for creative banner ${key}:`, e);
            }
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
      // 1. Strictly process band logo (logo_url)
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
            } catch (e) {
              console.warn(`[Storage] Upload failed for band logo ${key}:`, e);
            }
          } else if (!existingLogoUrl && !val.includes('Nexus%20Icon%20Circuits.png')) {
            existingLogoUrl = val;
          }
        }
      }

      item.logo_url = uploadedLogoUrl || existingLogoUrl || item.logo_url || null;

      // 2. Strictly process band cover (cover_url)
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
            } catch (e) {
              console.warn(`[Storage] Upload failed for band cover ${key}:`, e);
            }
          } else if (!existingCoverUrl) {
            existingCoverUrl = val;
          }
        }
      }

      item.cover_url = uploadedCoverUrl || existingCoverUrl || item.cover_url || null;

      // CRITICAL: Strip any user profile image properties (avatar_url, banner_url, etc.) from band records
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
      // User personal profile or generic entity image processing
      // Strictly process PERSONAL profile avatar (avatar_url, avatarUrl, avatar, profileAvatarUrl)
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
            } catch (e) {
              console.warn(`[Storage] Upload failed for personal avatar ${key}:`, e);
            }
          } else if (!existingAvatarUrl && !val.includes('Nexus%20Icon%20Circuits.png')) {
            existingAvatarUrl = val;
          }
        }
      }

      if (uploadedAvatarUrl || existingAvatarUrl) {
        item.avatar_url = uploadedAvatarUrl || existingAvatarUrl || item.avatar_url || null;
      }

      // Strictly process PERSONAL profile banner (banner_url, bannerUrl, banner, coverImage, profileCoverUrl, cover_url)
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
            } catch (e) {
              console.warn(`[Storage] Upload failed for personal banner ${key}:`, e);
            }
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

      // If creative_avatar or creative_banner happen to be in the profile object as raw base64, process them with creative tokens without overwriting personal fields
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

/**
 * Uploads a clip video file directly to the 'clips' Supabase storage bucket,
 * with fallbacks to other public media buckets if needed, and returns the accessible public URL.
 */
export async function uploadClipVideoFile(
  file: File | Blob,
  userId: string = 'user',
  fileNameToken: string = 'clip'
): Promise<string> {
  if (!file) return '';

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
    
    // Bucket creation check (safe try-catch)
    try {
      await client.storage.createBucket('clips', { public: true });
    } catch (_) {}

    let rawName = 'clip.mp4';
    if (file && typeof file === 'object' && 'name' in file && typeof (file as any).name === 'string') {
      rawName = (file as any).name;
    }
    const extMatch = rawName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'mp4';
    const cleanBaseName = rawName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const safeFileName = `${cleanBaseName || 'clip'}.${ext}`;

    let contentType = 'video/mp4';
    if (file && typeof file === 'object' && 'type' in file && typeof (file as any).type === 'string' && (file as any).type && (file as any).type !== 'application/octet-stream') {
      contentType = (file as any).type;
    } else if (ext === 'webm') {
      contentType = 'video/webm';
    } else if (ext === 'mov') {
      contentType = 'video/quicktime';
    } else {
      contentType = 'video/mp4';
    }

    const bucketCandidates = ['clips', 'photo-pit', 'media', 'public-assets'];

    for (const targetBucket of bucketCandidates) {
      const flatPath = `${cleanToken}_${cleanAuthId}_${timestamp}_${safeFileName}`;
      const folderPath = `${cleanAuthId}/${cleanToken}_${timestamp}_${safeFileName}`;
      const simplePath = `${timestamp}_${safeFileName}`;

      for (const currentPath of [flatPath, folderPath, simplePath]) {
        try {
          const { data: uploadData, error: uploadError } = await client.storage
            .from(targetBucket)
            .upload(currentPath, file, {
              upsert: true,
              cacheControl: '3600',
              contentType,
            });

          if (!uploadError && uploadData) {
            const finalPath = uploadData.path || currentPath;
            const { data: publicUrlData } = client.storage.from(targetBucket).getPublicUrl(finalPath);
            if (publicUrlData?.publicUrl) {
              const finalPublicUrl = publicUrlData.publicUrl;
              console.log(`[STORAGE UPLOAD SUCCESS] Stored clip in bucket "${targetBucket}" (${finalPath}):`, finalPublicUrl);
              return finalPublicUrl;
            }
          } else if (uploadError) {
            console.warn(`[STORAGE UPLOAD ATTEMPT] Bucket "${targetBucket}" path "${currentPath}" error:`, uploadError.message);
          }
        } catch (attemptErr: any) {
          console.warn(`[STORAGE UPLOAD ATTEMPT ERROR] ${targetBucket}/${currentPath}:`, attemptErr?.message || attemptErr);
        }
      }
    }

    console.warn('[STORAGE UPLOAD NOTICE] Could not upload clip video to storage buckets.');
    return '';
  } catch (err: any) {
    console.error('[STORAGE HELPER ERROR] Failed uploading clip file:', err);
    return '';
  }
}

/**
 * Dedicated storage uploader for Stories media (images and videos).
 * Uploads directly to 'stories' bucket with fallbacks to 'photo-pit', 'clips', 'media', 'community-bands', 'public-assets'.
 * Tries both folder-namespaced path and flat root path to conform to any RLS bucket policy.
 */
export async function uploadStoryMediaToStorage(
  media: File | Blob | string,
  userId?: string,
  mediaType: 'image' | 'video' = 'image'
): Promise<string> {
  if (!media) return '';

  const client = getRawSupabase() || rawClient || getSupabase();
  if (!client) {
    console.warn('[STORIES UPLOAD] Supabase client unavailable.');
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
        // Already a remote public URL
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

    // Prioritize 'stories' bucket first as requested by the user
    const bucketCandidates = ['stories', 'photo-pit', 'clips', 'media', 'community-bands', 'public-assets'];

    const cleanToken = `story_${timestamp}`;
    const folderPath = `${cleanAuthId}/${cleanToken}.${fileExt}`;
    const flatPath = `${cleanToken}_${cleanAuthId}.${fileExt}`;
    const directPath = `story_${cleanAuthId}_${timestamp}.${fileExt}`;

    let lastErrorMessage = '';

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
              const finalPublicUrl = `${publicUrlData.publicUrl}?t=${timestamp}`;
              console.log(`[STORIES STORAGE UPLOAD SUCCESS] Stored in bucket "${targetBucket}" (${finalPath}):`, finalPublicUrl);
              return finalPublicUrl;
            }
          } else if (uploadError) {
            lastErrorMessage = uploadError.message;
            console.warn(`[STORIES STORAGE ATTEMPT] Bucket "${targetBucket}" path "${currentPath}" error:`, uploadError.message);
          }
        } catch (attemptErr: any) {
          lastErrorMessage = attemptErr?.message || String(attemptErr);
          console.warn(`[STORIES STORAGE ATTEMPT ERROR] ${targetBucket}/${currentPath}:`, lastErrorMessage);
        }
      }
    }

    console.warn(`[STORIES STORAGE NOTICE] All storage bucket upload attempts completed without a remote URL (${lastErrorMessage || 'no matching bucket'}). Retaining local asset data.`);
    return typeof media === 'string' ? media : '';
  } catch (err: any) {
    console.error('[STORIES STORAGE ERROR] Failed uploading story media:', err);
    return typeof media === 'string' ? media : '';
  }
}

