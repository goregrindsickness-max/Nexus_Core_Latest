import { useState, useEffect, useMemo, useCallback } from 'react';
import { Band, hasRegisteredWorkspace, normalizeRegisteredWorkspaces } from '../types';
import {
  getSupabase,
  fetchUserBands,
  autoSyncCreativeProfile,
  autoSyncPromoterProfile,
  uploadBase64ToStorage,
  generateUUID,
} from '../supabase';
import { profileStore } from '../utils/indexedDB';
import { safeSetLocalStorageItem } from '../lib/storageManager';
import { communityBandManager, isCommunityBandRecord } from '../lib/communityBands';
import { isMiguelNameOrProfile } from '../components/social/utils/profileUtils';
import { BAND_PORTAL_BILLING } from '../config/billingMatrix';
import {
  resolveBandLogo,
  resolveBandCover,
  resolveBandHandle,
  resolveBandName,
  resolveBandBio,
  resolveBandLocation,
  resolveCreativeName,
  resolveCreativeHandle,
  resolveCreativeLogo,
  resolveCreativeCover,
  resolveCreativeBio,
  resolveCreativeLocation,
  resolvePromoterLogo,
} from '../utils/bandProfileUtils';

export interface UseUserEntitiesOptions {
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  isInitialHydrated: boolean;
  setIsInitialHydrated: React.Dispatch<React.SetStateAction<boolean>>;
  activeClearanceLevel: number;
  setActiveClearanceLevel: (lvl: number) => void;
  simulatedMemberId: string;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  setSales: React.Dispatch<React.SetStateAction<any[]>>;
  setShows: React.Dispatch<React.SetStateAction<any[]>>;
  setNotes: React.Dispatch<React.SetStateAction<any[]>>;
  setInventoryAudits: React.Dispatch<React.SetStateAction<any[]>>;
  setInventory: React.Dispatch<React.SetStateAction<any[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<any[]>>;
  setCashTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  setDailySalesGoal: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Domain hook managing user entities (bands, activeBand, lineup, crew, logos, covers,
 * and entity profile modal resolution across Band, Promoter, Creative, Label, and Personal).
 */
export function useUserEntities(options: UseUserEntitiesOptions) {
  const {
    userProfile,
    setUserProfile,
    isInitialHydrated,
    setIsInitialHydrated,
    activeClearanceLevel,
    setActiveClearanceLevel,
    simulatedMemberId,
    triggerNotification,
    addLog,
    setSales,
    setShows,
    setNotes,
    setInventoryAudits,
    setInventory,
    setExpenses,
    setCashTransactions,
    setDailySalesGoal,
  } = options;

  const [bands, setBands] = useState<Band[]>(() => {
    try {
      const savedProfileStr = localStorage.getItem('nexus_core_user_profile');
      if (savedProfileStr && savedProfileStr !== 'null') {
        const parsedProfile = JSON.parse(savedProfileStr);
        const isMiguel = isMiguelNameOrProfile(parsedProfile);
        if (isMiguel) {
          return [
            {
              id: 'cbddb810-259b-4230-9968-3d402dfdb872',
              name: 'Virulent Excision',
              band_name: 'Virulent Excision',
              genre: 'Brutal Death Metal',
              logo_url:
                'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396',
              cover_url:
                'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-cover_1787467851123.jpg?t=1787467851123',
              owner_id: parsedProfile.id,
            } as any,
          ];
        }
        if (parsedProfile?.id) {
          const userBandsStr = localStorage.getItem(`nexus_core_${parsedProfile.id}_bands`);
          if (userBandsStr) {
            const parsedBands = JSON.parse(userBandsStr);
            if (Array.isArray(parsedBands)) {
              const filtered = parsedBands.filter(
                (b: any) =>
                  b.id !== 'cbddb810-259b-4230-9968-3d402dfdb872' &&
                  !(b.name || b.band_name || '').toLowerCase().includes('virulent excision')
              );
              if (filtered.length > 0) return filtered;
            }
          }
          return [];
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [activeBandId, setActiveBandId] = useState<string>(() => {
    try {
      const savedProfileStr = localStorage.getItem('nexus_core_user_profile');
      if (savedProfileStr && savedProfileStr !== 'null') {
        const parsedProfile = JSON.parse(savedProfileStr);
        if (isMiguelNameOrProfile(parsedProfile)) {
          return 'cbddb810-259b-4230-9968-3d402dfdb872';
        }
        if (parsedProfile?.id) {
          const userActiveId = localStorage.getItem(
            `nexus_core_${parsedProfile.id}_active_band_id`
          );
          if (userActiveId && userActiveId !== 'cbddb810-259b-4230-9968-3d402dfdb872') {
            return userActiveId;
          }
        }
      }
      return '';
    } catch {
      return '';
    }
  });

  const [bandLogoUrl, setBandLogoUrl] = useState<string>('');
  const [bandCoverUrl, setBandCoverUrl] = useState<string>('');
  const [bandLineup, setBandLineup] = useState<any[]>([]);
  const [crewMembers, setCrewMembers] = useState<any[]>([]);
  const [currentLoadedBandId, setCurrentLoadedBandId] = useState<string | null>(null);

  // Fetch live community band profiles in background on mount
  useEffect(() => {
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      communityBandManager.fetchFromSupabase().catch((err) => {
        console.warn('[useUserEntities] Background Supabase band fetch notice:', err);
      });
    }
  }, []);

  // Load account-specific band entities and workspace caches upon context/tenant switch
  useEffect(() => {
    if (!userProfile) return;

    const loadCaches = async () => {
      try {
        let cachedBands = await profileStore.getItem(`nexus_core_${userProfile?.id}_bands`);
        let cachedActiveBandIdStr = await profileStore.getItem(
          `nexus_core_${userProfile?.id}_active_band_id`
        );

        if (!cachedBands) {
          const legacyBands = localStorage.getItem(`nexus_core_${userProfile?.id}_bands`);
          if (legacyBands) cachedBands = JSON.parse(legacyBands);
        }
        if (!cachedActiveBandIdStr) {
          cachedActiveBandIdStr = localStorage.getItem(
            `nexus_core_${userProfile?.id}_active_band_id`
          );
        }

        let currentActiveBandId = activeBandId;

        if (userProfile?.id === 'profile_admin') {
          const adminBands =
            cachedBands && Array.isArray(cachedBands) && cachedBands.length > 0
              ? cachedBands
              : [];
          setBands(adminBands as any[]);
          const adminActiveId = cachedActiveBandIdStr || adminBands[0]?.id || '';
          setActiveBandId(adminActiveId as string);
          currentActiveBandId = adminActiveId as string;
        } else {
          let userBands: any[] = [];
          const supabase = getSupabase();
          let remoteBands: any[] | null = null;
          if (supabase && navigator.onLine && userProfile?.id) {
            try {
              const userBandsData = await fetchUserBands(userProfile.id);
              if (Array.isArray(userBandsData)) {
                remoteBands = userBandsData;
              }
            } catch (_) {}
          }

          if (remoteBands !== null) {
            userBands = remoteBands.map((b: any) => ({
              ...b,
              name: b.band_name || b.name || 'Artist',
            }));
          } else if (cachedBands && Array.isArray(cachedBands) && cachedBands.length > 0) {
            userBands = cachedBands;
          } else if (bands && bands.length > 0) {
            userBands = bands;
          } else {
            userBands = [];
          }

          const isOwnerMiguel = isMiguelNameOrProfile(userProfile);

          if (isOwnerMiguel) {
            userBands = userBands.filter((b: any) => {
              const bId = String(b.id || '').trim();
              const bName = String(b.name || b.band_name || '')
                .trim()
                .toLowerCase();
              return (
                bId === 'cbddb810-259b-4230-9968-3d402dfdb872' ||
                bName.includes('virulent excision')
              );
            });
            if (userBands.length === 0) {
              userBands = [
                {
                  id: 'cbddb810-259b-4230-9968-3d402dfdb872',
                  name: 'Virulent Excision',
                  band_name: 'Virulent Excision',
                  genre: 'Brutal Death Metal',
                  logo_url:
                    'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396',
                  cover_url:
                    'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-cover_1787467851123.jpg?t=1787467851123',
                  owner_id: userProfile?.id,
                },
              ];
            }
          } else {
            userBands = userBands.filter((b: any) => {
              const bId = String(b.id || '').trim();
              const bName = String(b.name || b.band_name || '')
                .trim()
                .toLowerCase();
              return (
                bId !== 'cbddb810-259b-4230-9968-3d402dfdb872' &&
                !bName.includes('virulent excision')
              );
            });
            if (userProfile?.band_name && userProfile.band_name.toLowerCase().includes('virulent')) {
              userProfile.band_name = null;
              userProfile.bandName = null;
              userProfile.band_id = null;
              try {
                safeSetLocalStorageItem('nexus_core_user_profile', userProfile);
                localStorage.removeItem('nexus_my_band_profile');
              } catch (_) {}
            }
          }

          if (userProfile?.id) {
            profileStore.setItem(`nexus_core_${userProfile?.id}_bands`, userBands);
          }
          setBands(userBands);

          const authenticPersonalBio =
            'Chicago born artist, musician, promoter and entrepreneur with 25 years of history in the extreme metal underground. Probably best known for the Chicago/Texas Domination Fest that ran from 2014-2024. I am also the vocalist of Virulent Excision. Currently my latest ambition has been the creation of this very platform. I wanted to create the sickest all-in-one system for bands, labels, promoters and creators to link up free of algorithms of corporate junk and ads found on the platforms. Enjoy!';
          const currentBio = userProfile?.bio || '';
          const promoterBio =
            (userProfile as any)?.promoter_metadata?.bio || (userProfile as any)?.promoter_bio;

          if (
            isOwnerMiguel &&
            currentBio &&
            (currentBio === promoterBio ||
              currentBio.toLowerCase().includes('booking management for underground'))
          ) {
            userProfile.bio = authenticPersonalBio;
            try {
              localStorage.setItem('nexus_user_bio', authenticPersonalBio);
              safeSetLocalStorageItem('nexus_core_user_profile', userProfile);
            } catch (_) {}
            if (supabase && userProfile.id) {
              supabase
                .from('profiles')
                .update({ bio: authenticPersonalBio })
                .eq('id', userProfile.id)
                .then();
            }
          }

          const isCorruptCommunityBand = Boolean(
            (userProfile?.band_id && isCommunityBandRecord(userProfile.band_id)) ||
              (userProfile?.band_name &&
                (isCommunityBandRecord(userProfile.band_name) ||
                  userProfile.band_name.toLowerCase().includes('necroticgorebeast') ||
                  userProfile.band_name.toLowerCase().includes('molested') ||
                  userProfile.band_name.toLowerCase() === 'dying fetus')) ||
              (userProfile?.bandName &&
                (isCommunityBandRecord(userProfile.bandName) ||
                  userProfile.bandName.toLowerCase().includes('necroticgorebeast') ||
                  userProfile.bandName.toLowerCase().includes('molested') ||
                  userProfile.bandName.toLowerCase() === 'dying fetus'))
          );

          if (isOwnerMiguel || isCorruptCommunityBand) {
            const needsVEFix =
              isOwnerMiguel &&
              (userProfile?.band_id !== 'cbddb810-259b-4230-9968-3d402dfdb872' ||
                userProfile?.band_name !== 'Virulent Excision' ||
                userProfile?.bandName !== 'Virulent Excision');

            if (isCorruptCommunityBand || needsVEFix) {
              userProfile.band_id = isOwnerMiguel
                ? 'cbddb810-259b-4230-9968-3d402dfdb872'
                : null;
              userProfile.band_name = isOwnerMiguel ? 'Virulent Excision' : null;
              userProfile.bandName = isOwnerMiguel ? 'Virulent Excision' : null;
              try {
                safeSetLocalStorageItem('nexus_core_user_profile', userProfile);
                if (isOwnerMiguel) {
                  localStorage.setItem(
                    'nexus_active_band_id',
                    'cbddb810-259b-4230-9968-3d402dfdb872'
                  );
                }
              } catch (_) {}
              if (supabase && userProfile.id) {
                supabase
                  .from('profiles')
                  .update({
                    band_id: userProfile.band_id,
                    band_name: userProfile.band_name,
                    bandName: userProfile.bandName,
                  })
                  .eq('id', userProfile.id)
                  .then();
              }
            }
          }

          if (userBands.length > 0 && userProfile?.id) {
            const primaryBand = userBands[0];
            const hasMissingBandFields =
              !userProfile.band_id || !userProfile.band_name || !userProfile.bandName;
            const isPrimaryValid =
              !isCommunityBandRecord(primaryBand.id) &&
              !isCommunityBandRecord(primaryBand.name);
            if (
              isPrimaryValid &&
              ((isOwnerMiguel && userProfile.band_name !== 'Virulent Excision') ||
                (!isOwnerMiguel &&
                  hasMissingBandFields &&
                  !primaryBand.name?.toLowerCase().includes('virulent')))
            ) {
              const updatedProfile = {
                ...userProfile,
                band_id: isOwnerMiguel
                  ? 'cbddb810-259b-4230-9968-3d402dfdb872'
                  : userProfile.band_id || primaryBand.id,
                band_name: isOwnerMiguel
                  ? 'Virulent Excision'
                  : userProfile.band_name ||
                    userProfile.bandName ||
                    primaryBand.band_name ||
                    primaryBand.name,
                bandName: isOwnerMiguel
                  ? 'Virulent Excision'
                  : userProfile.bandName ||
                    userProfile.band_name ||
                    primaryBand.band_name ||
                    primaryBand.name,
                active_workspace:
                  userProfile.active_workspace ||
                  (userProfile.account_type === 'fan' || userProfile.account_type === 'fan_only'
                    ? 'fan_only'
                    : 'industry_pro'),
                account_type:
                  userProfile.account_type === 'fan' || userProfile.account_type === 'fan_only'
                    ? 'fan'
                    : 'industry pro',
              };
              setUserProfile(updatedProfile);
              try {
                safeSetLocalStorageItem('nexus_core_user_profile', updatedProfile);
              } catch (_) {}

              if (supabase) {
                supabase
                  .from('profiles')
                  .update({
                    band_id: updatedProfile.band_id,
                    band_name: updatedProfile.band_name,
                    bandName: updatedProfile.bandName,
                    active_workspace: updatedProfile.active_workspace,
                    account_type: updatedProfile.account_type,
                  })
                  .eq('id', userProfile.id)
                  .then();
              }
            }
          }

          const hasCreativeAccess =
            hasRegisteredWorkspace(userProfile, 'creative') ||
            userProfile?.account_type === 'creative' ||
            userProfile?.active_workspace === 'creative' ||
            Boolean(userProfile?.creative_id && userProfile?.creative_id !== userProfile?.id) ||
            isOwnerMiguel;

          if (
            supabase &&
            navigator.onLine &&
            userProfile?.id &&
            userProfile.id !== 'guest' &&
            hasCreativeAccess
          ) {
            autoSyncCreativeProfile(userProfile)
              .then((synced) => {
                if (synced) {
                  setUserProfile((prev: any) => {
                    if (!prev) return prev;
                    const cName =
                      synced.business_name || synced.creative_name || resolveCreativeName(prev);
                    const cHandle = synced.creative_handle || resolveCreativeHandle(prev);
                    const cAvatar =
                      synced.avatar_url || synced.creative_avatar || resolveCreativeLogo(prev);
                    const cBanner =
                      synced.banner_url || synced.creative_banner || resolveCreativeCover(prev);
                    const cBio = synced.bio || resolveCreativeBio(prev);
                    const healedProfile = {
                      ...prev,
                      creative_id:
                        synced.id ||
                        prev.creative_id ||
                        (isOwnerMiguel ? 'c-vortex' : generateUUID()),
                      creative_name: cName,
                      creative_business_name: cName,
                      creative_handle: cHandle,
                      creative_avatar: cAvatar,
                      creative_banner: cBanner,
                      creative_bio: cBio,
                      creative_metadata: {
                        ...(prev.creative_metadata || {}),
                        ...synced,
                        business_name: cName,
                        creative_handle: cHandle,
                        avatar_url: cAvatar,
                        banner_url: cBanner,
                        bio: cBio,
                      },
                    };
                    try {
                      safeSetLocalStorageItem('nexus_core_user_profile', healedProfile);
                      if (cName) localStorage.setItem('nexus_creative_business_name', cName);
                      if (cHandle) localStorage.setItem('nexus_creative_handle', cHandle);
                      if (cAvatar) localStorage.setItem('nexus_creative_avatar', cAvatar);
                      if (cBanner) localStorage.setItem('nexus_creative_banner', cBanner);
                      if (cBio) localStorage.setItem('nexus_creative_bio', cBio);
                    } catch (_) {}
                    return healedProfile;
                  });
                }
              })
              .catch((err) => console.warn('Creative auto-sync notice:', err));
          }

          const hasPromoterAccess =
            hasRegisteredWorkspace(userProfile, 'promoter') ||
            userProfile?.account_type === 'promoter' ||
            userProfile?.active_workspace === 'promoter' ||
            Boolean(userProfile?.promoter_id && userProfile?.promoter_id !== userProfile?.id) ||
            isOwnerMiguel;

          if (
            supabase &&
            navigator.onLine &&
            userProfile?.id &&
            userProfile.id !== 'guest' &&
            hasPromoterAccess
          ) {
            autoSyncPromoterProfile(userProfile)
              .then((synced) => {
                if (synced) {
                  setUserProfile((prev: any) => {
                    if (!prev) return prev;
                    const healedProfile = {
                      ...prev,
                      promoter_id: synced.id || prev.promoter_id,
                      promoter_name: synced.brand_name || synced.name || prev.promoter_name,
                      promoter_agency:
                        synced.agency_name || synced.brand_name || prev.promoter_agency,
                      promoter_brand: synced.brand_name || prev.promoter_brand,
                      promoter_logo:
                        synced.promoter_logo || synced.logo_url || prev.promoter_logo,
                      promoter_cover_image:
                        synced.promoter_cover_image ||
                        synced.banner_url ||
                        prev.promoter_cover_image,
                      promoter_bio: synced.bio || prev.promoter_bio,
                      promoter_metadata: {
                        ...(prev.promoter_metadata || {}),
                        ...synced,
                      },
                    };
                    try {
                      safeSetLocalStorageItem('nexus_core_user_profile', healedProfile);
                      if (synced.bio) localStorage.setItem('nexus_promoter_bio', synced.bio);
                      if (synced.promoter_logo || synced.logo_url)
                        localStorage.setItem(
                          'nexus_promoter_logo',
                          synced.promoter_logo || synced.logo_url
                        );
                      if (synced.promoter_cover_image || synced.banner_url)
                        localStorage.setItem(
                          'nexus_promoter_cover',
                          synced.promoter_cover_image || synced.banner_url
                        );
                    } catch (_) {}
                    return healedProfile;
                  });
                }
              })
              .catch((err) => console.warn('Promoter auto-sync notice:', err));
          } else if (!hasPromoterAccess && !isOwnerMiguel && userProfile) {
            if (
              userProfile.promoter_agency ||
              userProfile.promoter_brand ||
              userProfile.promoter_name ||
              (userProfile.promoter_id && userProfile.promoter_id === userProfile.id)
            ) {
              setUserProfile((prev: any) => {
                if (!prev) return prev;
                const cleaned = { ...prev };
                delete cleaned.promoter_agency;
                delete cleaned.promoter_brand;
                delete cleaned.promoter_name;
                delete cleaned.promoter_id;
                try {
                  safeSetLocalStorageItem('nexus_core_user_profile', cleaned);
                } catch (_) {}
                return cleaned;
              });
            }
          }

          let userActiveId = '';
          if (isOwnerMiguel) {
            userActiveId = 'cbddb810-259b-4230-9968-3d402dfdb872';
          } else if (
            cachedActiveBandIdStr &&
            userBands.some((b: any) => String(b.id) === String(cachedActiveBandIdStr))
          ) {
            userActiveId = String(cachedActiveBandIdStr);
          } else if (
            userProfile?.band_id &&
            userBands.some((b: any) => String(b.id) === String(userProfile.band_id))
          ) {
            userActiveId = String(userProfile.band_id);
          } else if (userBands.length > 0 && userBands[0]?.id) {
            userActiveId = String(userBands[0].id);
          }
          setActiveBandId(userActiveId);
          currentActiveBandId = userActiveId;
        }

        const suffix = currentActiveBandId || userProfile?.id || 'offline';

        const cachedSalesStr = localStorage.getItem(`nexus_core_${suffix}_sales_offline`);
        const cachedShowsStr = localStorage.getItem(`nexus_core_${suffix}_shows_offline`);
        const cachedNotesStr = localStorage.getItem(`nexus_core_${suffix}_notes_offline`);
        const cachedAuditsStr = localStorage.getItem(`nexus_core_${suffix}_audits_offline`);
        const cachedInventoryStr = localStorage.getItem(`nexus_core_${suffix}_inventory_offline`);
        const cachedExpensesStr = localStorage.getItem(`nexus_core_${suffix}_expenses`);
        const cachedCashTransactionsStr = localStorage.getItem(
          `nexus_core_${suffix}_cash_transactions`
        );
        const cachedSalesGoalStr = localStorage.getItem(`nexus_core_${suffix}_sales_goal`);

        if (userProfile?.id === 'profile_admin') {
          const defaultExpenses = [
            {
              id: 'exp_1',
              description: 'Gas refill (van)',
              amount: 65.0,
              date: new Date().toISOString().split('T')[0],
            },
            {
              id: 'exp_2',
              description: 'Hotel room booking',
              amount: 150.0,
              date: new Date().toISOString().split('T')[0],
            },
            {
              id: 'exp_3',
              description: 'Highway tolls',
              amount: 35.0,
              date: new Date().toISOString().split('T')[0],
            },
          ];
          setSales(cachedSalesStr ? JSON.parse(cachedSalesStr) : []);
          setShows(cachedShowsStr ? JSON.parse(cachedShowsStr) : []);
          setNotes(cachedNotesStr ? JSON.parse(cachedNotesStr) : []);
          setInventoryAudits(cachedAuditsStr ? JSON.parse(cachedAuditsStr) : []);
          setInventory(cachedInventoryStr ? JSON.parse(cachedInventoryStr) : []);
          setExpenses(cachedExpensesStr ? JSON.parse(cachedExpensesStr) : defaultExpenses);
          setCashTransactions(
            cachedCashTransactionsStr ? JSON.parse(cachedCashTransactionsStr) : []
          );
          setDailySalesGoal(cachedSalesGoalStr ? Number(cachedSalesGoalStr) : 250);
        } else {
          setSales(cachedSalesStr ? JSON.parse(cachedSalesStr) : []);
          setShows(cachedShowsStr ? JSON.parse(cachedShowsStr) : []);
          setNotes(cachedNotesStr ? JSON.parse(cachedNotesStr) : []);
          setInventoryAudits(cachedAuditsStr ? JSON.parse(cachedAuditsStr) : []);
          setInventory(cachedInventoryStr ? JSON.parse(cachedInventoryStr) : []);
          setExpenses(cachedExpensesStr ? JSON.parse(cachedExpensesStr) : []);
          setCashTransactions(
            cachedCashTransactionsStr ? JSON.parse(cachedCashTransactionsStr) : []
          );
          setDailySalesGoal(cachedSalesGoalStr ? Number(cachedSalesGoalStr) : 250);
        }
        setIsInitialHydrated(true);
      } catch (e) {
        console.error('Failed to swap context collections:', e);
      }
    };

    loadCaches();
  }, [activeBandId, userProfile?.id]);

  const isBandRegistered = useMemo(() => {
    if (!userProfile) return false;
    return (
      hasRegisteredWorkspace(userProfile, 'band') ||
      Boolean(userProfile.band_id || userProfile.bandName || userProfile.band_name) ||
      (bands && bands.length > 0)
    );
  }, [userProfile, bands]);

  const activeBand = useMemo(() => {
    if (!isBandRegistered) return null;
    const isOwnerMiguel = isMiguelNameOrProfile(userProfile);
    if (isOwnerMiguel) {
      const veBand =
        bands.find(
          (b) =>
            b.id === 'cbddb810-259b-4230-9968-3d402dfdb872' ||
            (b.name || '').toLowerCase().includes('virulent excision')
        ) || bands[0];
      if (
        veBand &&
        (veBand.id === 'cbddb810-259b-4230-9968-3d402dfdb872' ||
          (veBand.name || veBand.band_name || '').toLowerCase().includes('virulent excision'))
      ) {
        return veBand;
      }
      return {
        id: 'cbddb810-259b-4230-9968-3d402dfdb872',
        name: 'Virulent Excision',
        band_name: 'Virulent Excision',
        genre: 'Brutal Death Metal',
        logo_url:
          'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396',
        cover_url:
          'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-cover_1787467851123.jpg?t=1787467851123',
        owner_id: userProfile?.id,
      };
    }

    if (!bands || bands.length === 0) return null;
    if (activeBandId) {
      const matched = bands.find((b) => String(b.id) === String(activeBandId));
      if (matched) return matched;
    }
    if (userProfile?.band_id) {
      const matchedByProfile = bands.find((b) => String(b.id) === String(userProfile.band_id));
      if (matchedByProfile) return matchedByProfile;
    }
    return bands[0] || null;
  }, [bands, activeBandId, isBandRegistered, userProfile]);

  // Hydrate bandLineup, bandCoverUrl, bandLogoUrl, and crewMembers when activeBand changes
  useEffect(() => {
    if (!activeBand) return;
    const bandId = activeBand.id;
    const isOnlineNow = typeof navigator === 'undefined' || navigator.onLine !== false;

    let loadedLineup: any[] | null = null;
    const rawLineup = (activeBand as any).lineup;
    const hasExplicitBandLineup =
      rawLineup !== undefined && rawLineup !== null && String(rawLineup).trim() !== '';

    if (hasExplicitBandLineup) {
      if (Array.isArray(rawLineup)) {
        loadedLineup = rawLineup.map((m: any, idx: number) => ({
          ...m,
          clearanceLevel: m.clearanceLevel || (idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 3 : 2),
        }));
      } else if (typeof rawLineup === 'string') {
        try {
          const parsed = JSON.parse(rawLineup);
          if (Array.isArray(parsed)) {
            loadedLineup = parsed.map((m: any, idx: number) => ({
              ...m,
              clearanceLevel:
                m.clearanceLevel || (idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 3 : 2),
            }));
          }
        } catch (_) {
          const parts = rawLineup
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
          loadedLineup = parts.map((part: string, idx: number) => ({
            id: `l_${Date.now()}_${idx}`,
            name: part,
            role: 'Member',
            clearanceLevel: idx === 0 ? 5 : 4,
            inviteStatus: 'accepted',
          }));
        }
      }
    }

    if (loadedLineup === null) {
      const savedLineup = localStorage.getItem(`nexus_core_band_lineup_${bandId}`);
      if (savedLineup !== null && savedLineup !== undefined && String(savedLineup).trim() !== '') {
        try {
          const parsed = JSON.parse(savedLineup);
          if (Array.isArray(parsed)) {
            loadedLineup = parsed.map((m: any, idx: number) => ({
              ...m,
              clearanceLevel:
                m.clearanceLevel || (idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 3 : 2),
            }));
          }
        } catch (_) {}
      }
    }

    setBandLineup(loadedLineup ?? []);

    const dbCover = activeBand.cover_url || (activeBand as any).banner_url || '';
    const savedCover = isOnlineNow
      ? dbCover || localStorage.getItem(`nexus_core_band_cover_${bandId}`) || ''
      : localStorage.getItem(`nexus_core_band_cover_${bandId}`) || dbCover || '';
    setBandCoverUrl(savedCover);

    const dbLogo = activeBand.logo_url || (activeBand as any).avatar_url || (activeBand as any).avatar || '';
    const savedLogo = isOnlineNow
      ? dbLogo || localStorage.getItem(`nexus_core_band_logo_${bandId}`) || ''
      : localStorage.getItem(`nexus_core_band_logo_${bandId}`) || dbLogo || '';
    setBandLogoUrl(savedLogo);

    const savedCrew = localStorage.getItem(`nexus_core_crew_members_${bandId}`);
    if (savedCrew) {
      try {
        const parsedCrew = JSON.parse(savedCrew);
        setCrewMembers(Array.isArray(parsedCrew) ? parsedCrew : []);
      } catch (_) {
        setCrewMembers([]);
      }
    } else {
      setCrewMembers([]);
    }

    setCurrentLoadedBandId(bandId);
  }, [activeBand?.id, (activeBand as any)?.lineup, activeBand?.logo_url, activeBand?.cover_url]);

  useEffect(() => {
    if (!isInitialHydrated || !activeBand || currentLoadedBandId !== activeBand.id) return;
    try {
      localStorage.setItem(
        `nexus_core_crew_members_${activeBand.id}`,
        JSON.stringify(crewMembers)
      );
    } catch (_) {}
  }, [crewMembers, activeBand?.id, currentLoadedBandId, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated || !activeBand || currentLoadedBandId !== activeBand.id) return;
    try {
      localStorage.setItem(`nexus_core_band_lineup_${activeBand.id}`, JSON.stringify(bandLineup));
    } catch (_) {}
  }, [bandLineup, activeBand?.id, currentLoadedBandId, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated || !activeBand || currentLoadedBandId !== activeBand.id) return;
    try {
      localStorage.setItem(`nexus_core_band_logo_${activeBand.id}`, bandLogoUrl);
    } catch (_) {}
  }, [bandLogoUrl, activeBand?.id, currentLoadedBandId, isInitialHydrated]);

  useEffect(() => {
    if (!isInitialHydrated || !activeBand || currentLoadedBandId !== activeBand.id) return;
    try {
      localStorage.setItem(`nexus_core_band_cover_${activeBand.id}`, bandCoverUrl);
    } catch (_) {}
  }, [bandCoverUrl, activeBand?.id, currentLoadedBandId, isInitialHydrated]);

  const activeSimulatedMember = useMemo(() => {
    const list = Array.isArray(bandLineup) ? bandLineup : [];
    const crewList = Array.isArray(crewMembers) ? crewMembers : [];
    const combined = [
      ...list.map((m: any) => ({ ...m, clearanceLevel: m.clearanceLevel || 5 })),
      ...crewList.map((c: any) => ({ ...c, clearanceLevel: c.clearanceLevel || 1 })),
    ];
    const found = combined.find((m: any) => m.id === simulatedMemberId);
    if (found) return found;
    if (list.length > 0) return { ...list[0], clearanceLevel: list[0].clearanceLevel || 5 };
    return null;
  }, [bandLineup, crewMembers, simulatedMemberId]);

  useEffect(() => {
    if (activeSimulatedMember) {
      const lvl = activeSimulatedMember.clearanceLevel || 5;
      if (lvl !== activeClearanceLevel) {
        setActiveClearanceLevel(lvl);
      }
      localStorage.setItem('nexus_core_active_clearance_level', String(lvl));
      localStorage.setItem('nexus_core_simulated_member_id', activeSimulatedMember.id);
    }
  }, [activeSimulatedMember?.id, activeSimulatedMember?.clearanceLevel, activeClearanceLevel]);

  const handleOpenMyProfile = useCallback(
    (forceRole?: 'personal' | 'promoter' | 'creative' | 'band') => {
      if (typeof window === 'undefined') return;
      const effectiveRole = forceRole || (userProfile?.active_workspace as any) || 'personal';

      if (effectiveRole === 'band') {
        const bandName = resolveBandName(activeBand, userProfile);
        const bandHandle = resolveBandHandle(activeBand, userProfile);
        const normalizedHandle = bandHandle.startsWith('@') ? bandHandle : `@${bandHandle}`;
        const bLogo = resolveBandLogo(activeBand, userProfile, bandLogoUrl);
        const bCover = resolveBandCover(activeBand, userProfile, bandCoverUrl);
        const bandBio = resolveBandBio(activeBand, userProfile);
        const bandLocation = resolveBandLocation(activeBand, userProfile);

        window.dispatchEvent(
          new CustomEvent('openPublicProfile', {
            detail: {
              id: activeBand?.id || userProfile?.band_id || 'band:active',
              name: bandName,
              legalName: bandName,
              handle: normalizedHandle,
              console_handle: normalizedHandle,
              username: normalizedHandle,
              avatar: bLogo,
              avatar_url: bLogo,
              logo: bLogo,
              logo_url: bLogo,
              banner: bCover,
              banner_url: bCover,
              cover: bCover,
              cover_url: bCover,
              location: bandLocation,
              role: 'Band / Artist',
              account_type: 'band',
              type: 'band',
              isPersonal: false,
              isBandProfile: true,
              isYou: true,
              badges: ['⚡ Band Core', '🎵 Metal'],
              customBadges: ['⚡ Band Core', '🎵 Metal'],
              bio: bandBio,
            },
          })
        );
        return;
      }

      if (effectiveRole === 'promoter') {
        const isOwnerMiguel = isMiguelNameOrProfile(userProfile);
        const pm = (userProfile as any)?.promoter_metadata || {};
        const promoterAgencyName =
          pm.brand_name ||
          pm.agency_name ||
          (userProfile as any)?.promoter_agency ||
          (isOwnerMiguel
            ? 'Nexus Live Productions'
            : userProfile?.name
            ? `${userProfile.name} Productions`
            : 'Promoter Operations');
        const promoterLogo = resolvePromoterLogo(userProfile);
        const promoterCover =
          localStorage.getItem('nexus_promoter_cover') ||
          pm.banner_url ||
          pm.cover_url ||
          (userProfile as any)?.promoter_cover_image ||
          (isOwnerMiguel
            ? 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635'
            : userProfile?.promoter_cover_image || '');
        const promoterBio =
          pm.bio ||
          (userProfile as any)?.promoter_bio ||
          localStorage.getItem('nexus_promoter_bio') ||
          (isOwnerMiguel
            ? 'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. I have a lengthy history in the underground extreme metal scene with several festivals under my name most notably the Chicago/ Texas Domination Fest that ran from 2014-2024. The next evolution is set to move to another new market more details on that in the near future.'
            : 'Independent live event promoter.');
        const rawHandle =
          (userProfile as any)?.promoter_handle ||
          (promoterAgencyName
            ? `@${promoterAgencyName.replace(/\s+/g, '')}`
            : isOwnerMiguel
            ? '@NexusLive'
            : '@promoter');
        const resolvedHandle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;

        window.dispatchEvent(
          new CustomEvent('openPublicProfile', {
            detail: {
              id:
                userProfile?.id ||
                (userProfile as any)?.promoter_id ||
                (isOwnerMiguel ? '5403162d-1947-43aa-b5f6-38a1bd2a1b80' : 'promoter_profile'),
              user_id:
                userProfile?.id ||
                (isOwnerMiguel ? '5403162d-1947-43aa-b5f6-38a1bd2a1b80' : 'promoter_profile'),
              email:
                userProfile?.email || (isOwnerMiguel ? 'goregrindsickness@gmail.com' : ''),
              name: promoterAgencyName,
              legalName:
                userProfile?.full_name ||
                userProfile?.name ||
                (isOwnerMiguel ? 'Miguel Goregrinder Medina' : 'Promoter User'),
              full_name:
                userProfile?.full_name ||
                userProfile?.name ||
                (isOwnerMiguel ? 'Miguel Goregrinder Medina' : 'Promoter User'),
              handle: resolvedHandle,
              console_handle: resolvedHandle,
              username: resolvedHandle,
              avatar: promoterLogo,
              avatar_url: promoterLogo,
              logo: promoterLogo,
              logo_url: promoterLogo,
              promoter_logo: promoterLogo,
              banner: promoterCover,
              banner_url: promoterCover,
              cover: promoterCover,
              cover_url: promoterCover,
              promoter_cover_image: promoterCover,
              location: userProfile?.city
                ? `${userProfile.city}, ${userProfile.state || 'TX'}`
                : 'Denison, TX',
              role: 'Event Promoter',
              account_type: 'promoter',
              type: 'promoter',
              isPersonal: false,
              isPromoterProfile: true,
              isBandProfile: false,
              isYou: true,
              badges: ['🎪 Event Promoter', '⚡ Nexus Live'],
              customBadges: ['🎪 Event Promoter', '⚡ Nexus Live'],
              bio: promoterBio,
              promoter_metadata: pm,
            },
          })
        );
        return;
      }

      if (effectiveRole === 'creative') {
        const creativeName = resolveCreativeName(userProfile);
        const creativeAvatar = resolveCreativeLogo(userProfile);
        const creativeBanner = resolveCreativeCover(userProfile);
        const creativeBio = resolveCreativeBio(userProfile);
        const creativeHandle = resolveCreativeHandle(userProfile);
        const normalizedHandle = creativeHandle.startsWith('@')
          ? creativeHandle
          : `@${creativeHandle}`;
        const creativeLoc = resolveCreativeLocation(userProfile);

        window.dispatchEvent(
          new CustomEvent('openPublicProfile', {
            detail: {
              id: (userProfile as any)?.creative_id || userProfile?.id || 'creative:vortex',
              name: creativeName,
              legalName: userProfile?.full_name || userProfile?.name,
              business_name: creativeName,
              handle: normalizedHandle,
              console_handle: normalizedHandle,
              username: normalizedHandle,
              avatar: creativeAvatar,
              avatar_url: creativeAvatar,
              banner: creativeBanner,
              banner_url: creativeBanner,
              cover_url: creativeBanner,
              location: creativeLoc || userProfile?.location || 'Denison, Texas',
              role: 'Creative',
              account_type: 'creative',
              type: 'creative',
              isPersonal: false,
              isCreativeProfile: true,
              isBandProfile: false,
              isYou: true,
              badges: ['🛠️ Creative Pro', '🎨 Designer'],
              customBadges: ['🛠️ Creative Pro', '🎨 Designer'],
              bio: creativeBio,
              creative_metadata: (userProfile as any)?.creative_metadata || {},
            },
          })
        );
        return;
      }

      // Personal / Industry Pro / Fan Profile
      const isOwnerMiguel = isMiguelNameOrProfile(userProfile);
      const personalAvatar =
        userProfile?.avatar_url ||
        localStorage.getItem('nexus_user_avatar') ||
        userProfile?.avatar ||
        userProfile?.profile_avatar ||
        (isOwnerMiguel
          ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
          : null);
      const rawPersonalBanner =
        userProfile?.banner_url || localStorage.getItem('nexus_user_banner') || null;
      const cleanPersonalBanner =
        typeof rawPersonalBanner === 'string' && rawPersonalBanner.includes('promoter-banner')
          ? null
          : rawPersonalBanner;
      const personalHandleRaw =
        userProfile?.console_handle ||
        userProfile?.handle ||
        userProfile?.username ||
        (isOwnerMiguel ? 'bdmCEO' : 'user');
      const personalHandle = personalHandleRaw.startsWith('@')
        ? personalHandleRaw
        : `@${personalHandleRaw}`;
      const personalName =
        userProfile?.full_name ||
        userProfile?.name ||
        (isOwnerMiguel
          ? 'Miguel Goregrinder Medina'
          : userProfile?.email
          ? userProfile.email.split('@')[0]
          : 'Member');

      window.dispatchEvent(
        new CustomEvent('openPublicProfile', {
          detail: {
            id: userProfile?.id || (isOwnerMiguel ? '5403162d-1947-43aa-b5f6-38a1bd2a1b80' : null),
            name: personalName,
            legalName: personalName,
            full_name: personalName,
            handle: personalHandle,
            console_handle: personalHandle,
            username: personalHandle,
            avatar: personalAvatar,
            avatar_url: personalAvatar,
            banner: cleanPersonalBanner,
            banner_url: cleanPersonalBanner,
            cover_url: cleanPersonalBanner,
            location: userProfile?.location || 'Denison, TX',
            role: userProfile?.account_type === 'fan_only' ? 'Fan Listener' : 'Industry Pro',
            account_type: userProfile?.account_type || 'industry_pro',
            type: 'personal',
            isPersonal: true,
            isPromoterProfile: false,
            isCreativeProfile: false,
            isBandProfile: false,
            isYou: true,
            bio:
              userProfile?.bio ||
              localStorage.getItem('nexus_user_bio') ||
              (isOwnerMiguel
                ? 'Chicago born artist, musician, promoter and entrepreneur with 25 years of history in the extreme metal underground.'
                : ''),
          },
        })
      );
    },
    [userProfile, activeBand, bandLogoUrl, bandCoverUrl]
  );

  return {
    bands,
    setBands,
    activeBandId,
    setActiveBandId,
    activeBand,
    isBandRegistered,
    bandLogoUrl,
    setBandLogoUrl,
    bandCoverUrl,
    setBandCoverUrl,
    bandLineup,
    setBandLineup,
    crewMembers,
    setCrewMembers,
    currentLoadedBandId,
    setCurrentLoadedBandId,
    activeSimulatedMember,
    handleOpenMyProfile,
  };
}
