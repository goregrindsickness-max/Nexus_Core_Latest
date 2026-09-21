import { supabase } from './supabaseClient';

/**
 * Compresses large images before upload using HTML5 Canvas
 */
const compressImage = async (file: File | Blob, maxWidth = 2048, quality = 0.85): Promise<Blob> => {
  if (file.type === 'image/gif' || file.type.startsWith('audio/') || !file.type.startsWith('image/')) return file; // Do not compress audio, GIFs or non-images

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

/**
 * Upload an audio file directly into the 'audio-vault' bucket on Supabase Storage
 * with automatic exponential backoff retry and collision prevention.
 */
export const uploadAudioVault = async (
  file: File | Blob,
  customName?: string,
  onProgress?: (percent: number) => void
): Promise<string | null> => {
  try {
    const originalName = (file as File).name || customName || 'master_audio.wav';
    const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB for studio WAV/master files
    if (file.size > MAX_SIZE_BYTES) {
      console.warn('File size exceeds 100MB vault limit.');
    }

    let userId = 'anonymous';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch (_) {}

    const cleanBaseName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const contentType = getAudioContentType(originalName, file.type);
    const uniqueSalt = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();

    // Construct primary flat and folder paths
    const flatFileName = `masters/${timestamp}_${uniqueSalt}_${cleanBaseName}`;
    const simpleFileName = `${timestamp}_${uniqueSalt}_${cleanBaseName}`;

    const pathOptions = [flatFileName, simpleFileName];
    const targetBuckets = ['audio-vault', 'feed_media', 'public-assets'];

    // Try upload with up to 3 attempts with exponential backoff
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

              console.log(`[AUDIO-VAULT UPLOAD SUCCESS] (Attempt ${attempt}, Bucket: ${bucketName}) URL:`, publicUrl);
              onProgress?.(100);
              return publicUrl;
            } else if (error) {
              console.warn(`[AUDIO-VAULT ATTEMPT ${attempt} - ${bucketName}/${filePath}] Error:`, error.message);
            }
          } catch (bucketErr: any) {
            console.warn(`[AUDIO-VAULT ATTEMPT ${attempt} - ${bucketName}] Exception:`, bucketErr?.message || bucketErr);
          }
        }
      }

      // If attempt failed, back off slightly before retrying
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 600 * attempt));
      }
    }

    console.warn('[AUDIO-VAULT] All storage attempts exhausted without receiving a public URL.');
    return null;
  } catch (err) {
    console.error('[AUDIO-VAULT CRITICAL EXCEPTION]:', err);
    return null;
  }
};

/**
 * Upload album/release artwork directly into the 'audio-vault' or 'public-assets' bucket on Supabase Storage
 */
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

          console.log(`[ARTWORK UPLOAD SUCCESS in ${bucketName}] Public URL:`, publicUrl);
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

    // 1. Check max size limit (50MB)
    const MAX_SIZE_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      alert('File size exceeds the 50MB limit.');
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
      // Try audio-vault / public-assets fallback
      return uploadArtworkToVault(file);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('feed_media')
      .getPublicUrl(data.path);

    console.log(`[STORAGE UPLOAD SUCCESS in feed_media] Public URL:`, publicUrl);
    return publicUrl;
  } catch (err) {
    console.error('[STORAGE EXCEPTION]:', err);
    return null;
  }
};

