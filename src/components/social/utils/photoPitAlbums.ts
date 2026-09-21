import { getSupabase } from '../../../supabase';
import { profileStore } from '../../../utils/indexedDB';

export const normalizeFolderName = (f?: string): string => {
  if (!f) return '';
  const trimmed = f.trim();
  if (trimmed.toLowerCase() === 'profile photos') return 'Profile Pics';
  if (trimmed.toLowerCase() === 'cover photos') return 'Cover Images';
  return trimmed;
};

export const MOCK_FOLDERS_TO_REMOVE = new Set([
  'stage & barricade',
  'mosh pit action',
  'backstage passes',
  'green room & gear',
  'crowd portraits',
  'analog 35mm rolls',
  'diy warehouse shows',
  'vintage cassettes & vinyl',
  'band promo & portraits',
  'soundcheck & pedals',
  'riot shots',
  'tour van life',
  'soundboard / foh',
  'merch table setup'
]);

export const loadSavedPhotoPitFolders = (userProfile?: any, portalRole?: string): string[] => {
  const userId = userProfile?.id || userProfile?.uuid || userProfile?.user_id || 'guest';
  let baseFolders: string[] = [];

  let deletedFolders: string[] = [];
  try {
    const deletedKey = `nexus_deleted_folders_${userId}`;
    const parsedDeleted = JSON.parse(localStorage.getItem(deletedKey) || '[]');
    if (Array.isArray(parsedDeleted)) {
      deletedFolders = parsedDeleted.map((d: string) => d.toLowerCase());
    }
  } catch (_) {}

  const role = (portalRole || userProfile?.portalRole || '').toLowerCase();
  const isBand = role.includes('band') || role.includes('artist') || Boolean(userProfile?.band_name);
  const isCreative = !isBand && (role.includes('creative') || role.includes('industry') || Boolean(userProfile?.creative_id));

  if (isBand) {
    try {
      const bandSaved = localStorage.getItem(`nexus_photo_folders_band_${userId}`) || localStorage.getItem(`nexus_band_photo_folders_${userId}`);
      if (bandSaved) {
        const parsed = JSON.parse(bandSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseFolders = parsed;
        }
      }
    } catch (_) {}
    if (baseFolders.length === 0 && Array.isArray(userProfile?.photo_folders) && userProfile.photo_folders.length > 0) {
      baseFolders = userProfile.photo_folders;
    }
  } else if (isCreative) {
    try {
      const creativeSaved = localStorage.getItem(`nexus_photo_folders_${userId}_creative`) || localStorage.getItem(`nexus_photo_folders_creative_${userId}`);
      if (creativeSaved) {
        const parsed = JSON.parse(creativeSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseFolders = parsed;
        }
      }
    } catch (_) {}
    if (baseFolders.length === 0 && Array.isArray(userProfile?.photo_folders) && userProfile.photo_folders.length > 0) {
      baseFolders = userProfile.photo_folders;
    }
  } else {
    if (Array.isArray(userProfile?.photo_folders) && userProfile.photo_folders.length > 0) {
      baseFolders = userProfile.photo_folders;
    } else {
      try {
        const saved = localStorage.getItem(`nexus_photo_folders_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            baseFolders = parsed;
          }
        }
      } catch (e) {
        console.warn("Failed loading saved photo folders from localStorage:", e);
      }
    }
  }

  const filtered = baseFolders
    .map((f) => normalizeFolderName(f))
    .filter((f) => {
      if (!f) return false;
      const lower = f.toLowerCase();
      if (MOCK_FOLDERS_TO_REMOVE.has(lower)) return false;
      if (deletedFolders.includes(lower)) return false;
      return true;
    });

  // Deduplicate folders case-insensitively
  const cleanedFolders: string[] = [];
  filtered.forEach((f) => {
    if (!cleanedFolders.some((existing) => existing.toLowerCase() === f.toLowerCase())) {
      cleanedFolders.push(f);
    }
  });

  const uniqueWithoutAll = cleanedFolders.filter((f) => f.toLowerCase() !== 'all photos');
  return [
    'All Photos',
    'Profile Pics',
    'Cover Images',
    ...uniqueWithoutAll.filter((f) => f.toLowerCase() !== 'profile pics' && f.toLowerCase() !== 'cover images')
  ];
};

/**
 * Returns existing Photo Pit albums only (excluding 'All Photos' filter category)
 */
export const getExistingPhotoPitAlbums = (userProfile?: any, portalRole?: string): string[] => {
  const folders = loadSavedPhotoPitFolders(userProfile, portalRole);
  return folders.filter((f) => f.toLowerCase() !== 'all photos');
};

/**
 * Persist modified Photo Pit folders across localStorage, IndexedDB, and Supabase
 */
export const persistPhotoPitFolders = async (
  updatedList: string[],
  userProfile?: any,
  portalRole?: string,
  setUserProfile?: (prof: any) => void
): Promise<string[]> => {
  const userId = userProfile?.id || userProfile?.uuid || userProfile?.user_id || 'guest';
  const activeRole = (portalRole || userProfile?.portalRole || 'fan').toLowerCase();
  const isBand = activeRole.includes('band') || activeRole.includes('artist') || Boolean(userProfile?.band_name);
  const isCreative = !isBand && (activeRole.includes('creative') || activeRole.includes('industry') || Boolean(userProfile?.creative_id));

  const normalized = updatedList
    .map((f) => normalizeFolderName(f))
    .filter((f) => f && !MOCK_FOLDERS_TO_REMOVE.has(f.toLowerCase()));

  // Deduplicate folders case-insensitively
  const unique: string[] = [];
  normalized.forEach((f) => {
    if (!unique.some((existing) => existing.toLowerCase() === f.toLowerCase())) {
      unique.push(f);
    }
  });

  const filteredUnique = unique.filter((f) => f.toLowerCase() !== 'all photos');
  const finalFolders = ['All Photos', ...filteredUnique];

  try {
    if (isBand) {
      localStorage.setItem(`nexus_photo_folders_band_${userId}`, JSON.stringify(finalFolders));
      localStorage.setItem(`nexus_band_photo_folders_${userId}`, JSON.stringify(finalFolders));
    } else if (isCreative) {
      localStorage.setItem(`nexus_photo_folders_${userId}_creative`, JSON.stringify(finalFolders));
      localStorage.setItem(`nexus_photo_folders_creative_${userId}`, JSON.stringify(finalFolders));
    } else {
      localStorage.setItem(`nexus_photo_folders_${userId}`, JSON.stringify(finalFolders));
    }
  } catch (e) {
    console.warn("Failed saving photo folders to localStorage:", e);
  }

  if (userProfile && setUserProfile) {
    const updatedProf = {
      ...userProfile,
      photo_folders: finalFolders
    };
    setUserProfile(updatedProf);
    try {
      localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProf));
    } catch (e) {}
  }

  // Persist to IndexedDB profileStore strictly for the active role
  try {
    const targetRole = isBand ? 'band' : isCreative ? 'creative' : activeRole;
    const activeKey = `active_${targetRole}_${userId}`;
    const v1Key = `nexus_${targetRole}_profile_v1_${userId}`;
    const activeProf = await profileStore.getItem<any>(activeKey);
    if (activeProf) {
      activeProf.photo_folders = finalFolders;
      await profileStore.setItem(activeKey, activeProf);
    }
    const v1Prof = await profileStore.getItem<any>(v1Key);
    if (v1Prof) {
      v1Prof.photo_folders = finalFolders;
      await profileStore.setItem(v1Key, v1Prof);
    }
  } catch (e) {}

  // Persist to Supabase profiles table
  const supabase = getSupabase();
  if (supabase && userId && userId !== 'guest') {
    try {
      const updatePayload = {
        photo_folders: finalFolders,
        updated_at: new Date().toISOString()
      };
      if (isCreative) {
        const creativeId = userProfile?.creative_id || userProfile?.registered_creative_id;
        if (creativeId) {
          try {
            await supabase.from('creatives').update(updatePayload).eq('id', creativeId);
          } catch (_) {}
        }
      } else if (isBand) {
        const bandId = userProfile?.band_id || userProfile?.bandId;
        if (bandId) {
          try {
            await supabase.from('bands').update(updatePayload).eq('id', bandId);
          } catch (_) {}
        }
      }
      await supabase.from('profiles').update(updatePayload).eq('id', userId);
      if (userProfile?.user_id) {
        await supabase.from('profiles').update(updatePayload).eq('user_id', userProfile.user_id);
      }
    } catch (e) {
      console.warn("Could not sync photo_folders to Supabase profiles:", e);
    }
  }

  return finalFolders;
};
