import { useState, useEffect, useCallback } from 'react';
import { getSupabase, normalizeLoadedProfile, syncPromoterProfileToSupabase, generateUUID } from '../supabase';
import { profileStore } from '../utils/indexedDB';
import { safeSetLocalStorageItem } from '../lib/storageManager';
import { cacheProfileMetadata, cacheProfileImage } from '../services/profileImageCacheService';
import { isMiguelNameOrProfile } from '../components/social/utils/profileUtils';
import { hasRegisteredWorkspace, normalizeRegisteredWorkspaces } from '../types';
import {
  resolveCreativeName,
  resolveCreativeHandle,
  resolveCreativeLogo,
  resolveCreativeCover,
  resolveCreativeBio,
  resolveCreativeLocation,
} from '../utils/bandProfileUtils';

const MIGUEL_DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80';

/**
 * Ensures the browser has a valid Supabase Auth session when online.
 */
export async function ensureValidSupabaseAuthSession(currentUserProfile?: any): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }

    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    if (!anonError && anonData?.user?.id) {
      return anonData.user.id;
    }

    const emailToTry = currentUserProfile?.email || 'session_sync_worker@nexus.live';
    const passwordToTry = 'NexusAuthSession2026!';

    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: emailToTry,
      password: passwordToTry,
    });
    if (signInData?.user?.id) {
      return signInData.user.id;
    }

    const { data: signUpData } = await supabase.auth.signUp({
      email: `worker_${Date.now()}@nexus.live`,
      password: passwordToTry,
    });
    if (signUpData?.user?.id) {
      return signUpData.user.id;
    }
  } catch (err) {
    console.warn('Auth session helper warning:', err);
  }
  return null;
}

export interface UseAuthSessionOptions {
  isOnline: boolean;
  triggerNotification?: (msg: string) => void;
  addLog?: (msg: string) => void;
  setActiveTab?: (tab: any) => void;
  setIsTime24Hour?: (val: boolean) => void;
  setActivePlan?: (plan: string) => void;
  setBands?: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveBandId?: (id: string) => void;
}

export function useAuthSession(options: UseAuthSessionOptions) {
  const {
    isOnline,
    triggerNotification,
    addLog,
    setActiveTab,
    setIsTime24Hour,
    setActivePlan,
    setBands,
    setActiveBandId,
  } = options;

  const [userProfile, setUserProfile] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_user_profile');
      if (saved && saved !== 'null') {
        const parsed = normalizeLoadedProfile(JSON.parse(saved));
        const isMiguel =
          parsed?.id === '5403162d-1947-43aa-b5f6-38a1bd2a1b80' ||
          parsed?.email?.toLowerCase() === 'goregrindsickness@gmail.com' ||
          (parsed?.name || '').toLowerCase().includes('miguel') ||
          (parsed?.full_name || '').toLowerCase().includes('miguel') ||
          (parsed?.console_handle || '').toLowerCase().includes('bdmceo') ||
          (parsed?.username || '').toLowerCase().includes('bdmceo');

        if (isMiguel) {
          parsed.name = 'Miguel Goregrinder Medina';
          parsed.full_name = 'Miguel Goregrinder Medina';
          parsed.console_handle = '@bdmCEO';
          parsed.username = 'bdmCEO';
          parsed.band_id = 'cbddb810-259b-4230-9968-3d402dfdb872';
          parsed.band_name = 'Virulent Excision';
          parsed.bandName = 'Virulent Excision';

          const cleanSavedBio = localStorage.getItem('nexus_user_bio');
          const authenticPersonalBio =
            'Chicago born artist, musician, promoter and entrepreneur with 25 years of history in the extreme metal underground. Probably best known for the Chicago/Texas Domination Fest that ran from 2014-2024. I am also the vocalist of Virulent Excision. Currently my latest ambition has been the creation of this very platform. I wanted to create the sickest all-in-one system for bands, labels, promoters and creators to link up free of algorithms of corporate junk and ads found on the platforms. Enjoy!';
          const authenticPromoterBio =
            'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. I have a lengthy history in the underground extreme metal scene with several festivals under my name most notably the Chicago/ Texas Domination Fest that ran from 2014-2024. The next evolution is set to move to another new market more details on that in the near future.';

          const isOverwrittenWithPromoterBio =
            parsed.bio &&
            (parsed.bio.toLowerCase().includes('booking management for underground') ||
              parsed.bio === parsed.promoter_metadata?.bio);

          if (!parsed.bio || isOverwrittenWithPromoterBio) {
            parsed.bio =
              cleanSavedBio && !cleanSavedBio.toLowerCase().includes('booking management')
                ? cleanSavedBio
                : authenticPersonalBio;
          }

          if (!parsed.promoter_metadata) parsed.promoter_metadata = {};
          if (
            !parsed.promoter_metadata.bio ||
            parsed.promoter_metadata.bio.toLowerCase().includes('booking management for underground')
          ) {
            parsed.promoter_metadata.bio =
              localStorage.getItem('nexus_promoter_bio') || authenticPromoterBio;
          }

          const savedPromoterCover = localStorage.getItem('nexus_promoter_cover');
          const defaultMiguelPromoterBanner =
            'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635';
          const effectivePromoterBanner =
            savedPromoterCover ||
            parsed.promoter_cover_image ||
            parsed.promoter_metadata?.banner_url ||
            parsed.promoter_metadata?.cover_url ||
            defaultMiguelPromoterBanner;
          parsed.promoter_cover_image = effectivePromoterBanner;
          parsed.promoter_metadata.banner_url = effectivePromoterBanner;
          parsed.promoter_metadata.cover_url = effectivePromoterBanner;

          const veLogo =
            'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396';
          if (
            parsed.avatar_url === veLogo ||
            !parsed.avatar_url ||
            parsed.avatar_url.includes('Nexus%20Icon%20Circuits')
          ) {
            const customPersonalAvatar = localStorage.getItem('nexus_user_avatar');
            parsed.avatar_url =
              customPersonalAvatar && customPersonalAvatar !== veLogo
                ? customPersonalAvatar
                : MIGUEL_DEFAULT_AVATAR;
          }
          parsed.avatar = parsed.avatar_url;
          parsed.profile_avatar = parsed.avatar_url;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexus_core_user_profile');
    return saved === null || saved === 'null';
  });

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexus_core_user_profile');
    return saved === null || saved === 'null';
  });

  const [loginInitialTab, setLoginInitialTab] = useState<'login' | 'signup'>('login');
  const [isUpgradeMode, setIsUpgradeMode] = useState<boolean>(false);

  // Persist userProfile to IndexedDB and safe localStorage on updates
  useEffect(() => {
    if (userProfile) {
      profileStore.setItem('nexus_core_user_profile', userProfile);
      safeSetLocalStorageItem('nexus_core_user_profile', userProfile);
    } else {
      profileStore.removeItem('nexus_core_user_profile');
      localStorage.removeItem('nexus_core_user_profile');
    }
  }, [userProfile]);

  // Proactively hydrate userProfile from Supabase on startup / online transition
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !navigator.onLine) return;

    let isSubscribed = true;

    const syncProfileFromSupabase = async () => {
      try {
        const savedStr = localStorage.getItem('nexus_core_user_profile');
        let currentLocal: any = userProfile;
        if (!currentLocal && savedStr && savedStr !== 'null') {
          try {
            currentLocal = JSON.parse(savedStr);
          } catch (_) {}
        }

        const profileId = currentLocal?.id;
        const profileEmail = currentLocal?.email;
        const profileHandle = currentLocal?.console_handle || currentLocal?.username;

        if (!profileId && !profileEmail && !profileHandle) return;

        let query = supabase.from('profiles').select('*');
        if (profileId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
          query = query.eq('id', profileId);
        } else if (profileEmail) {
          query = query.ilike('email', profileEmail);
        } else if (profileHandle) {
          const cleanH = String(profileHandle).replace(/^@/, '');
          query = query.or(`console_handle.ilike.%${cleanH}%,username.ilike.%${cleanH}%`);
        } else {
          return;
        }

        const { data, error } = await query.maybeSingle();
        if (data && !error && isSubscribed) {
          let promoterRecord: any = null;
          try {
            const { data: pData } = await supabase
              .from('promoters')
              .select('*')
              .or(`id.eq.${data.id},user_id.eq.${data.id}`)
              .maybeSingle();
            if (pData) promoterRecord = pData;
          } catch (_) {}

          const normalized = normalizeLoadedProfile(data);
          if (promoterRecord) {
            normalized.promoter_id = promoterRecord.id || normalized.promoter_id;
            normalized.promoter_name =
              promoterRecord.entity_name ||
              promoterRecord.brand_name ||
              promoterRecord.name ||
              normalized.promoter_name;
            normalized.promoter_agency =
              promoterRecord.entity_name ||
              promoterRecord.agency_name ||
              normalized.promoter_agency;
            normalized.promoter_brand =
              promoterRecord.entity_name ||
              promoterRecord.brand_name ||
              normalized.promoter_brand;
            normalized.promoter_logo = promoterRecord.promoter_logo || normalized.promoter_logo;
            normalized.promoter_cover_image =
              promoterRecord.promoter_cover_image || normalized.promoter_cover_image;
            normalized.promoter_bio = promoterRecord.bio || normalized.promoter_bio;
            normalized.promoter_metadata = {
              ...(normalized.promoter_metadata || {}),
              ...promoterRecord,
              brand_name: normalized.promoter_name,
              agency_name: normalized.promoter_agency,
              logo_url: normalized.promoter_logo,
              banner_url: normalized.promoter_cover_image,
              bio: normalized.promoter_bio,
            };
          }

          setUserProfile((prev: any) => {
            if (!prev) return normalized;
            const merged = {
              ...prev,
              ...normalized,
              active_workspace: normalized.active_workspace || prev.active_workspace || 'industry_pro',
              account_type: normalized.account_type || prev.account_type || 'industry pro',
              promoter_id: normalized.promoter_id ?? prev.promoter_id,
              promoter_name: normalized.promoter_name ?? prev.promoter_name,
              promoter_agency: normalized.promoter_agency ?? prev.promoter_agency,
              promoter_brand: normalized.promoter_brand ?? prev.promoter_brand,
              promoter_logo: normalized.promoter_logo ?? prev.promoter_logo,
              promoter_cover_image: normalized.promoter_cover_image ?? prev.promoter_cover_image,
              promoter_bio: normalized.promoter_bio ?? prev.promoter_bio,
              promoter_metadata:
                normalized.promoter_metadata !== undefined
                  ? {
                      ...(prev.promoter_metadata || {}),
                      ...(normalized.promoter_metadata || {}),
                    }
                  : prev.promoter_metadata,
            };
            try {
              profileStore.setItem('nexus_core_user_profile', merged);
              safeSetLocalStorageItem('nexus_core_user_profile', merged);
              if (merged.id) {
                cacheProfileMetadata(merged.id, merged).catch(() => {});
              }
              if (merged.console_handle || merged.username) {
                cacheProfileMetadata(merged.console_handle || merged.username, merged).catch(() => {});
              }
              if (merged.avatar_url) {
                localStorage.setItem('nexus_user_avatar', merged.avatar_url);
                localStorage.setItem('nexus_avatar', merged.avatar_url);
                cacheProfileImage(merged.avatar_url, merged.avatar_url).catch(() => {});
              }
              if (merged.banner_url) {
                localStorage.setItem('nexus_user_banner', merged.banner_url);
                localStorage.setItem('nexus_banner', merged.banner_url);
                cacheProfileImage(merged.banner_url, merged.banner_url).catch(() => {});
              }
              if (merged.bio) {
                localStorage.setItem('nexus_user_bio', merged.bio);
              }
              if (merged.promoter_metadata?.bio) {
                localStorage.setItem('nexus_promoter_bio', merged.promoter_metadata.bio);
              }
              if (merged.promoter_metadata?.logo_url) {
                localStorage.setItem('nexus_promoter_logo', merged.promoter_metadata.logo_url);
              }
              if (merged.promoter_metadata?.cover_url || merged.promoter_metadata?.banner_url) {
                localStorage.setItem(
                  'nexus_promoter_cover',
                  merged.promoter_metadata.cover_url || merged.promoter_metadata.banner_url
                );
              }
            } catch (_) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('[useAuthSession] Proactive Supabase profile hydration notice:', err);
      }
    };

    syncProfileFromSupabase();
    return () => {
      isSubscribed = false;
    };
  }, [userProfile?.id, isOnline]);

  const handleLogin = useCallback(
    (customProfile: any, customBand?: any, selectBandId?: string) => {
      setIsUpgradeMode(false);
      setIsTime24Hour?.(localStorage.getItem('tour_time_is_24h') !== 'false');
      const savedPlan = localStorage.getItem('nexus_core_active_plan');
      if (savedPlan) {
        setActivePlan?.(savedPlan);
      }
      if (customProfile) {
        const isFanAccount =
          customProfile.account_type === 'fan' || customProfile.account_type === 'fan_only';

        const hasUnlockedBandWorkspace = Boolean(
          customBand ||
            selectBandId ||
            customProfile.account_type === 'band' ||
            customProfile.band_id ||
            customProfile.bandName ||
            customProfile.band_name ||
            hasRegisteredWorkspace(customProfile, 'band')
        );

        if (isFanAccount) {
          customProfile.account_type = 'fan';
          customProfile.active_workspace = 'fan_only';
        } else {
          customProfile.account_type = 'industry_pro';
          customProfile.active_workspace = 'industry_pro';
        }

        if (hasUnlockedBandWorkspace) {
          if (customBand) {
            customProfile.band_id = customBand.id;
            customProfile.band_name =
              customBand.name || customBand.band_name || customProfile.band_name;
            customProfile.bandName =
              customBand.name || customBand.band_name || customProfile.bandName;
          }
          if (!hasRegisteredWorkspace(customProfile, 'band')) {
            customProfile.registered_workspaces = normalizeRegisteredWorkspaces(
              customProfile.registered_workspaces,
              [
                {
                  type: 'band',
                  id: customProfile.band_id || selectBandId || customBand?.id || generateUUID(),
                  name:
                    customProfile.band_name ||
                    customProfile.bandName ||
                    customBand?.name ||
                    'Band Workspace',
                },
              ]
            );
          }
        }

        const isOwnerMiguel = isMiguelNameOrProfile(customProfile);
        const cleanPromoterBrand = (v: any) =>
          v && typeof v === 'string' && v.trim() && (isOwnerMiguel || !v.toLowerCase().includes('nexus live'))
            ? v.trim()
            : '';
        const hasUnlockedPromoterWorkspace = Boolean(
          isOwnerMiguel ||
            (customProfile.promoter_id &&
              customProfile.promoter_id !== customProfile.id &&
              !String(customProfile.promoter_name || customProfile.promoter_agency || '')
                .toLowerCase()
                .includes('nexus live')) ||
            cleanPromoterBrand(customProfile.promoter_agency) ||
            cleanPromoterBrand(customProfile.promoter_brand) ||
            cleanPromoterBrand(customProfile.promoter_name) ||
            cleanPromoterBrand(customProfile.promoter_metadata?.brand_name) ||
            cleanPromoterBrand(customProfile.promoter_metadata?.agency_name) ||
            (hasRegisteredWorkspace(customProfile, 'promoter') &&
              customProfile.account_type !== 'fan' &&
              customProfile.account_type !== 'fan_only' &&
              customProfile.promoter_metadata?.is_registered === true)
        );

        if (hasUnlockedPromoterWorkspace) {
          const pName =
            cleanPromoterBrand(customProfile.promoter_metadata?.brand_name) ||
            cleanPromoterBrand(customProfile.promoter_metadata?.agency_name) ||
            cleanPromoterBrand(customProfile.promoter_agency) ||
            cleanPromoterBrand(customProfile.promoter_brand) ||
            cleanPromoterBrand(customProfile.promoter_name) ||
            (isOwnerMiguel ? 'Nexus Live Productions' : 'Promoter Operations');
          const pId =
            customProfile.promoter_id ||
            (customProfile.promoter_metadata as any)?.id ||
            customProfile.id;
          const pLogo =
            customProfile.promoter_logo ||
            customProfile.promoter_metadata?.logo_url ||
            (isOwnerMiguel
              ? 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601'
              : customProfile.avatar_url || '');
          const pCover =
            customProfile.promoter_cover_image ||
            customProfile.promoter_metadata?.banner_url ||
            customProfile.promoter_metadata?.cover_url ||
            (isOwnerMiguel
              ? 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635'
              : customProfile.banner_url || '');
          const pBio =
            customProfile.promoter_bio ||
            customProfile.promoter_metadata?.bio ||
            (isOwnerMiguel
              ? 'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. I have a lengthy history in the underground extreme metal scene with several festivals under my name most notably the Chicago/ Texas Domination Fest that ran from 2014-2024. The next evolution is set to move to another new market more details on that in the near future.'
              : 'Independent concert promoter and live events coordinator.');

          customProfile.promoter_id = pId;
          customProfile.promoter_agency = pName;
          customProfile.promoter_brand = pName;
          customProfile.promoter_name = pName;
          customProfile.promoter_logo = pLogo;
          customProfile.promoter_cover_image = pCover;
          customProfile.promoter_bio = pBio;

          if (!hasRegisteredWorkspace(customProfile, 'promoter')) {
            customProfile.registered_workspaces = normalizeRegisteredWorkspaces(
              customProfile.registered_workspaces,
              [
                {
                  type: 'promoter',
                  id: pId,
                  name: pName,
                },
              ]
            );
          }
          syncPromoterProfileToSupabase(customProfile).catch((err) => {
            console.warn('[Supabase Promoter Sync Warning]:', err);
          });
        } else if (!isOwnerMiguel) {
          delete customProfile.promoter_id;
          delete customProfile.promoter_agency;
          delete customProfile.promoter_brand;
          delete customProfile.promoter_name;
          delete customProfile.promoter_logo;
          delete customProfile.promoter_cover_image;
          delete customProfile.promoter_bio;
          delete customProfile.promoter_metadata;
        }

        const hasUnlockedCreativeWorkspace = Boolean(
          customProfile.creative_id ||
            customProfile.creative_business_name ||
            customProfile.creative_name ||
            customProfile.creative_metadata?.business_name ||
            hasRegisteredWorkspace(customProfile, 'creative') ||
            isMiguelNameOrProfile(customProfile)
        );

        if (hasUnlockedCreativeWorkspace) {
          const cName = resolveCreativeName(customProfile);
          const cHandle = resolveCreativeHandle(customProfile);
          const cId = customProfile.creative_id || (isOwnerMiguel ? 'c-vortex' : generateUUID());
          const cLogo = resolveCreativeLogo(customProfile);
          const cCover = resolveCreativeCover(customProfile);
          const cBio = resolveCreativeBio(customProfile);

          customProfile.creative_id = cId;
          customProfile.creative_business_name = cName;
          customProfile.creative_name = cName;
          customProfile.creative_handle = cHandle;
          customProfile.creative_avatar = cLogo;
          customProfile.creative_banner = cCover;
          customProfile.creative_bio = cBio;
          customProfile.creative_metadata = {
            ...(customProfile.creative_metadata || {}),
            business_name: cName,
            creative_handle: cHandle,
            avatar_url: cLogo,
            banner_url: cCover,
            bio: cBio,
            city: customProfile.creative_metadata?.city || (isOwnerMiguel ? 'Denison' : customProfile.city || ''),
            state_province:
              customProfile.creative_metadata?.state_province ||
              (isOwnerMiguel ? 'TX' : customProfile.state_province || ''),
            country: customProfile.creative_metadata?.country || customProfile.country || 'USA',
          };

          if (!hasRegisteredWorkspace(customProfile, 'creative')) {
            customProfile.registered_workspaces = normalizeRegisteredWorkspaces(
              customProfile.registered_workspaces,
              [
                {
                  type: 'creative',
                  id: cId,
                  name: cName,
                },
              ]
            );
          }
        }

        if (isMiguelNameOrProfile(customProfile)) {
          const veLogo =
            'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396';
          if (!customProfile.band_logo || customProfile.band_logo === customProfile.promoter_logo) {
            customProfile.band_logo = veLogo;
          }
        }

        if (customBand && customBand.name) {
          customProfile.bandName = customBand.name;
          customProfile.band_name = customBand.name;
        }

        setUserProfile(customProfile);
        try {
          localStorage.setItem('nexus_core_user_profile', JSON.stringify(customProfile));
        } catch (_) {}
        triggerNotification?.(`👤 Profile Loaded: Welcome ${customProfile.name || customProfile.full_name}!`);
      }

      if (customBand && setBands) {
        if (customBand.lineup) {
          try {
            localStorage.setItem(
              `nexus_core_band_lineup_${customBand.id}`,
              typeof customBand.lineup === 'string' ? customBand.lineup : JSON.stringify(customBand.lineup)
            );
          } catch (_) {}
        }
        setBands((prev) => {
          const exists = (prev || []).some((b) => b.id === customBand.id);
          if (exists) return (prev || []).map((b) => (b.id === customBand.id ? customBand : b));
          return [customBand, ...(prev || [])];
        });
        try {
          const existingBandsStr = localStorage.getItem('nexus_bands_list');
          const existingBands = existingBandsStr ? JSON.parse(existingBandsStr) : [];
          const updatedBands = [customBand, ...existingBands.filter((b: any) => b.id !== customBand.id)];
          localStorage.setItem('nexus_bands_list', JSON.stringify(updatedBands));
        } catch (_) {}
        triggerNotification?.(`🎸 Artist Workspace Available: ${customBand.name}!`);
      }

      const targetBandId = selectBandId || customBand?.id || customProfile?.band_id;
      if (targetBandId && setActiveBandId) {
        setActiveBandId(targetBandId);
        try {
          localStorage.setItem('nexus_active_band_id', targetBandId);
        } catch (_) {}
      }

      setActiveTab?.('social');
      setIsLoggedOut(false);
      triggerNotification?.('🔓 Session unlocked successfully!');
      addLog?.(
        customProfile
          ? `New crew profile signed up: ${customProfile.name} (${customProfile.role}) for ${customBand?.name || 'Artist'}`
          : 'Session restored by authorized administrator.'
      );
    },
    [setIsTime24Hour, setActivePlan, setBands, setActiveBandId, setActiveTab, triggerNotification, addLog]
  );

  return {
    userProfile,
    setUserProfile,
    isLoggedOut,
    setIsLoggedOut,
    showSplash,
    setShowSplash,
    loginInitialTab,
    setLoginInitialTab,
    isUpgradeMode,
    setIsUpgradeMode,
    handleLogin,
    ensureValidSupabaseAuthSession,
  };
}
