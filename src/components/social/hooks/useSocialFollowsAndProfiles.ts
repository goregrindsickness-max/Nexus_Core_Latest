import { useState, useEffect } from 'react';
import { initialDiscoverProfiles } from '../data/discoverProfilesData';
import { loadDiscoverProfilesCache, saveDiscoverProfilesCache } from '../utils/feedCacheUtils';
import { extractUUID } from '../../../utils/socialFeedUtils';
import { getSupabase, executeWithSchemaResilience, sanitizeBandPayload } from '../../../supabase';
import { isMiguelNameOrProfile } from '../utils/profileUtils';
import { communityBandManager, isDeletedOrZombieBand, isCommunityBandRecord } from '../../../lib/communityBands';
import {
  isProfileFollowedGlobally,
  saveFollowStateGlobally,
  FOLLOW_EVENT_NAME,
  getScopedFollowsMap,
  syncScopedFollowsFromServer,
  isEntityTargetObject
} from '../../../utils/followSyncService';
import {
  fetchCachedProfilesDirectory,
  fetchCachedBandsDirectory,
  fetchCachedCreativesDirectory,
  fetchCachedLabelsDirectory,
  fetchCachedPromotersDirectory,
  batchResolveBandsAndProfilesByName,
} from '../../../lib/supabaseQueryCache';

const isValidUUID = (str: string | null | undefined): boolean => {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

const generateDeterministicUUID = (seed: string): string => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = ((h2 >>> 16) & 0xffff).toString(16).padStart(4, '0');
  const part3 = ((h2 & 0x0fff) | 0x4000).toString(16).padStart(4, '0');
  const part4 = ((h1 & 0x3fff) | 0x8000).toString(16).padStart(4, '0');
  const part5 = (((h1 >>> 8) ^ h2) >>> 0).toString(16).padStart(8, '0') + ((h2 >>> 8) & 0xffff).toString(16).padStart(4, '0');
  return `${part1}-${part2}-${part3}-${part4}-${part5.slice(0, 12)}`;
};

interface UseSocialFollowsAndProfilesOptions {
  userProfile: any;
  allProfiles: any[];
  allFollows: any[];
  setAllFollows: React.Dispatch<React.SetStateAction<any[]>>;
  selectedUserProfile: any;
  setSelectedUserProfile: React.Dispatch<React.SetStateAction<any>>;
  triggerNotification?: (msg: string) => void;
  setLiveProfileStats?: React.Dispatch<React.SetStateAction<any>>;
  setCurrentUserStats?: React.Dispatch<React.SetStateAction<any>>;
}

export function useSocialFollowsAndProfiles({
  userProfile,
  allProfiles,
  allFollows,
  setAllFollows,
  selectedUserProfile,
  setSelectedUserProfile,
  triggerNotification,
  setLiveProfileStats,
  setCurrentUserStats
}: UseSocialFollowsAndProfilesOptions) {
  const [discoverProfiles, setDiscoverProfiles] = useState<any[]>(initialDiscoverProfiles);
  const [realProfiles, setRealProfiles] = useState<any[]>([]);

  // Load discoverProfiles from IndexedDB on mount
  useEffect(() => {
    let active = true;
    loadDiscoverProfilesCache(userProfile?.id).then((data: any) => {
      if (active && data && Array.isArray(data) && data.length > 0) {
        setDiscoverProfiles(prev => {
          return prev.map(p => {
            const saved = data.find((d: any) => d.id === p.id);
            if (saved) {
              return {
                ...p,
                followed: isProfileFollowedGlobally({ ...p, followed: undefined, isFollowed: undefined, isFollowedByMe: undefined }, undefined, userProfile?.id),
                followedBack: saved.followedBack,
                notificationsEnabled: saved.notificationsEnabled
              };
            }
            return p;
          });
        });
      }
    }).catch(e => console.warn("Failed to load discoverProfiles", e));
    return () => { active = false; };
  }, [userProfile?.id]);

  // Save discoverProfiles to IndexedDB on change
  useEffect(() => {
    saveDiscoverProfilesCache(discoverProfiles, userProfile?.id).catch(e => console.warn("Failed to save discoverProfiles", e));
  }, [discoverProfiles, userProfile?.id]);

  useEffect(() => {
    const fetchRealData = async () => {
      const list: any[] = [];
      let followedArtistIds: string[] = [];
      let whoFollowsUs: string[] = [];
      const supabaseClient = getSupabase();

      let localFollows: Record<string, boolean> = getScopedFollowsMap(userProfile?.id);
      let resolvedFollowerUid: string | undefined = extractUUID(userProfile?.id) || undefined;
      let authoritativeFollowsForCheck: any[] | undefined = undefined;

      if (supabaseClient && userProfile) {
        try {
          let extractedUid = extractUUID(userProfile.id) || extractUUID(userProfile.user_id) || extractUUID(userProfile.email);
          if (!extractedUid) {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session?.user?.id && isValidUUID(session.user.id)) {
              extractedUid = session.user.id;
            }
          }
          if (!extractedUid && userProfile.email) {
            const { data: myP } = await supabaseClient.from('profiles').select('id').eq('email', userProfile.email).maybeSingle();
            if (myP?.id && isValidUUID(myP.id)) {
              extractedUid = myP.id;
            }
          }

          if (extractedUid) {
            resolvedFollowerUid = extractedUid;
            const { data: followsData, error: fErr } = await supabaseClient
              .from('follows')
              .select('follower_id, followed_id')
              .eq('follower_id', extractedUid);
            if (!fErr && followsData) {
              followedArtistIds = followsData
                .map((f: any) => String(f.followed_id || '').toLowerCase().trim())
                .filter(Boolean);
              syncScopedFollowsFromServer(followedArtistIds, extractedUid);
              localFollows = getScopedFollowsMap(extractedUid);
              const mappedFollows = followsData.map((f: any) => ({
                follower_id: f.follower_id || extractedUid,
                followed_id: f.followed_id,
                fan_profile_id: f.follower_id || extractedUid,
                artist_id: f.followed_id
              }));
              authoritativeFollowsForCheck = mappedFollows;
              setAllFollows(mappedFollows);
            }

            const myNames = [
              userProfile.name,
              userProfile.email,
              userProfile.id,
              userProfile.console_handle,
              userProfile.bandName,
              userProfile.label_company_name
            ].filter(Boolean).map(n => n.toLowerCase().trim());

            const cleanUserIds = myNames.filter(isValidUUID);
            if (extractedUid && !cleanUserIds.includes(extractedUid.toLowerCase())) {
              cleanUserIds.push(extractedUid.toLowerCase());
            }

            if (cleanUserIds.length > 0) {
              const { data: followersData } = await supabaseClient
                .from('follows')
                .select('follower_id')
                .in('followed_id', cleanUserIds);
              if (followersData) {
                whoFollowsUs = followersData.map((f: any) => String(f.follower_id || '').toLowerCase().trim());
              }
            }
          }
        } catch (err) {
          console.error("Error fetching follows from Supabase:", err);
        }
      }

      const followsPoolForCheck = authoritativeFollowsForCheck ?? allFollows;

      setDiscoverProfiles(prev => prev.map(dp => {
        const dpNameLower = (dp?.name || "User").toLowerCase().trim();
        const dpIdLower = String(dp.id || '').toLowerCase().trim();
        const cleanDp = { ...dp, followed: undefined, isFollowed: undefined, isFollowedByMe: undefined };
        const isFollowed = isProfileFollowedGlobally(cleanDp, followsPoolForCheck, resolvedFollowerUid);
        const isFollowedBack = whoFollowsUs.includes(dpNameLower) || whoFollowsUs.includes(dpIdLower);
        return { ...dp, followed: isFollowed, followedBack: isFollowedBack };
      }));

      if (userProfile) {
        list.push({
          id: 'real-user',
          name: userProfile.name || 'Your Profile',
          role: userProfile.role || 'User',
          category: 'friends',
          desc: 'Your personal profile on the Nexus network',
          avatar: userProfile.avatar_url || userProfile.avatar || '',
          image: userProfile.avatar_url || userProfile.avatar || '',
          followed: false,
          isYou: true
        });

        if (userProfile.label_company_name) {
          list.push({
            id: 'real-user-label',
            name: userProfile.label_company_name,
            role: 'Label',
            category: 'labels',
            desc: 'Your official Record Label profile',
            avatar: userProfile.label_avatar || userProfile.avatar_url || '',
            image: userProfile.label_avatar || userProfile.avatar_url || '',
            followed: false,
            isYou: true
          });
        }

        if (Array.isArray(userProfile.label_band_roster)) {
          userProfile.label_band_roster.forEach((bandName: string, idx: number) => {
            if (bandName && bandName.trim()) {
              list.push({
                id: `real-roster-band-${idx}`,
                name: bandName.trim(),
                role: 'Band',
                category: 'bands',
                type: 'band',
                isBandProfile: true,
                desc: 'Official roster artist signed to our label',
                avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
                image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
                followed: isProfileFollowedGlobally({ name: bandName.trim(), role: 'Band', type: 'band', isBandProfile: true }, followsPoolForCheck, resolvedFollowerUid),
                isYou: false
              });
            }
          });
        }
      }

      if (supabaseClient) {
        const [profiles, bandsList, creativesList, labelsList, promotersList] = await Promise.all([
          fetchCachedProfilesDirectory(supabaseClient).catch((err) => {
            console.error("Error fetching profiles from Supabase:", err);
            return [];
          }),
          fetchCachedBandsDirectory(supabaseClient).catch((err) => {
            console.error("Error fetching bands from Supabase:", err);
            return [];
          }),
          fetchCachedCreativesDirectory(supabaseClient).catch((err) => {
            console.error("Error fetching creatives from Supabase:", err);
            return [];
          }),
          fetchCachedLabelsDirectory(supabaseClient).catch((err) => {
            console.error("Error fetching labels from Supabase:", err);
            return [];
          }),
          fetchCachedPromotersDirectory(supabaseClient).catch((err) => {
            console.error("Error fetching promoters from Supabase:", err);
            return [];
          }),
        ]);

        try {
          if (profiles && profiles.length > 0) {
            profiles.forEach((p: any) => {
              if (userProfile && p.email === userProfile.email) return;

              const pEmail = (p.email || '').toLowerCase().trim();
              if (pEmail.includes('test_probe') || pEmail.includes('@example.com')) return;

              const bandMeta = p.band_metadata || {};
              const creativeMeta = p.creative_metadata || {};
              const labelMeta = p.label_metadata || {};
              const promoterMeta = p.promoter_metadata || {};

              const rawFullName = (p.full_name || '').trim().toLowerCase();
              const hasHandle = Boolean(p.console_handle && p.console_handle.trim() !== '');
              const hasAvatar = Boolean(p.avatar_url && !String(p.avatar_url).includes('default'));
              const hasBio = Boolean(p.bio && p.bio.trim() !== '');
              const labelCompanyName = labelMeta.company_name || labelMeta.name;
              const hasOrg = Boolean(p.band_name || labelCompanyName || p.creative_name || creativeMeta.business_name || promoterMeta.brand_name);

              if ((!rawFullName || rawFullName === 'new user' || rawFullName === 'user') && !hasHandle && !hasAvatar && !hasBio && !hasOrg) {
                return;
              }

              let profileName = p.full_name || p.console_handle || p.email?.split('@')[0] || 'User';
              let profileAvatar = p.avatar_url || '';
              let profileBanner = p.banner_url || '';
              let profileRole = p.role || p.account_type || 'Member';
              let category = 'friends';

              const isMiguel = (p.email || '').toLowerCase().trim() === 'goregrindsickness@gmail.com' || (p.email || '').toLowerCase().trim() === 'admin@nexus.com' || String(p.id || '').toLowerCase().trim() === '5403162d-1947-43aa-b5f6-38a1bd2a1b80';

              const accTypeLower = String(p.account_type || '').toLowerCase().trim();
              const activeWsLower = String(p.active_workspace || '').toLowerCase().trim();
              const isExplicitIndustryPro =
                accTypeLower === 'industry_pro' ||
                accTypeLower === 'industry pro' ||
                activeWsLower === 'industry_pro';
              const rawBandName = String(p.band_name || bandMeta.band_name || '').trim();
              const isBandEntityRow =
                !isExplicitIndustryPro &&
                !isMiguel &&
                (
                  (!p.full_name && (Boolean(rawBandName) || accTypeLower === 'band')) ||
                  (accTypeLower === 'band' && Boolean(rawBandName) && p.full_name?.trim().toLowerCase() === rawBandName.toLowerCase())
                );

              if (accTypeLower === 'label' || labelCompanyName) {
                profileName = labelCompanyName || profileName;
                profileAvatar = labelMeta.logo_url || labelMeta.avatar_url || profileAvatar;
                profileBanner = labelMeta.banner_url || labelMeta.cover_url || profileBanner;
                profileRole = 'Label';
                category = 'labels';
              } else if (isBandEntityRow) {
                profileName = rawBandName || profileName;
                profileAvatar = bandMeta.logo_url || p.avatar_url || profileAvatar;
                profileBanner = bandMeta.banner_url || bandMeta.cover_url || p.banner_url || profileBanner;
                profileRole = 'Band';
                category = 'bands';
              } else if (accTypeLower === 'creative') {
                profileName = p.creative_name || creativeMeta.business_name || profileName;
                profileAvatar = creativeMeta.avatar_url || profileAvatar;
                profileBanner = creativeMeta.banner_url || creativeMeta.cover_url || profileBanner;
                profileRole = 'Creative';
                category = 'creatives';
              } else if (accTypeLower === 'promoter') {
                if (isMiguel) {
                  profileRole = 'Member';
                  category = 'friends';
                } else {
                  let brand = promoterMeta.brand_name || promoterMeta.agency_name || promoterMeta.name;
                  if (brand && brand.toLowerCase().includes('nexus live')) {
                    brand = `${profileName} Productions`;
                  }
                  profileName = brand || `${profileName} Productions`;
                  profileAvatar = promoterMeta.logo_url || promoterMeta.avatar_url || profileAvatar;
                  profileBanner = promoterMeta.cover_url || promoterMeta.banner_url || profileBanner;
                  profileRole = 'Promoter';
                  category = 'venues';
                }
              } else if (
                isExplicitIndustryPro ||
                ((accTypeLower === 'band' || String(p.role || '').toLowerCase().trim() === 'band') && Boolean(p.full_name))
              ) {
                profileRole = 'Industry Pro';
                category = 'friends';
              }

              const rawRegWs = Array.isArray(p.registered_workspaces) ? p.registered_workspaces : [];
              const hasPollutedPromoter = !isMiguel && [
                promoterMeta.brand_name,
                promoterMeta.agency_name,
              ].some((v: any) => typeof v === 'string' && v.toLowerCase().includes('nexus live'));

              const cleanRegWs = hasPollutedPromoter
                ? rawRegWs.filter((w: any) => {
                    const t = typeof w === 'string' ? w.toLowerCase().trim() : String(w?.type || w?.key || '').toLowerCase().trim();
                    return t !== 'promoter';
                  })
                : rawRegWs;

              const cleanProfFields = hasPollutedPromoter
                ? {
                    promoter_id: undefined,
                    promoter_metadata: undefined,
                  }
                : {};

              list.push({
                ...p,
                ...cleanProfFields,
                id: p.id || `real-p-${p.email}`,
                raw_id: p.id,
                user_id: p.id,
                creator_id: p.id,
                owner_id: p.id,
                band_id: p.band_id,
                band_name: p.band_name,
                name: profileName,
                role: profileRole,
                portalRole: profileRole.toLowerCase(),
                category: category,
                desc: p.bio || creativeMeta.bio || `${profileRole} profile on the Nexus network`,
                avatar: profileAvatar,
                image: profileAvatar,
                banner: profileBanner,
                followed: authoritativeFollowsForCheck !== undefined
                  ? (followedArtistIds.includes(String(p.id || '').toLowerCase().trim()) || followedArtistIds.includes(profileName.toLowerCase()))
                  : (followedArtistIds.includes(String(p.id || '').toLowerCase().trim()) || followedArtistIds.includes(profileName.toLowerCase()) || !!localFollows[p.id] || !!localFollows[profileName.toLowerCase()]),
                isYou: false,
                email: p.email,
                registered_workspaces: cleanRegWs,
                allowed_workspaces: p.allowed_workspaces || []
              });
            });
          }
        } catch (err) {
          console.error("Error mapping profiles:", err);
        }

        try {
          if (bandsList && bandsList.length > 0) {
            bandsList.forEach((b: any) => {
              const bName = b.band_name || '';
              if (!bName) return;
              if (isDeletedOrZombieBand(b.id) || isDeletedOrZombieBand(bName)) return;
              if ((list || []).some(x => x.name.toLowerCase() === bName.toLowerCase())) return;

              const isCommunity = isCommunityBandRecord(b.id) || isCommunityBandRecord(bName) || b.verification_status === 'community_archive';

              list.push({
                ...b,
                id: `real-b-${b.id}`,
                raw_id: b.id,
                band_id: b.id,
                user_id: isCommunity ? undefined : b.creator_id,
                creator_id: isCommunity ? undefined : b.creator_id,
                owner_id: isCommunity ? undefined : b.creator_id,
                profile_id: isCommunity ? undefined : b.creator_id,
                is_community: isCommunity,
                isCommunityArchive: isCommunity,
                name: bName,
                band_name: bName,
                role: 'Band',
                portalRole: 'band',
                isBandProfile: true,
                type: 'band',
                category: 'bands',
                desc: b.bio || (Array.isArray(b.micro_genres) ? b.micro_genres.join(' / ') : 'Underground heavy metal artist'),
                avatar: b.logo_url || b.avatar_url || b.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
                image: b.logo_url || b.avatar_url || b.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
                logo_url: b.logo_url || b.avatar_url || '',
                avatar_url: b.avatar_url || b.logo_url || '',
                cover_url: b.cover_url || b.banner_url || '',
                banner_url: b.banner_url || b.cover_url || '',
                banner: b.cover_url || b.banner_url || '',
                followed: authoritativeFollowsForCheck !== undefined
                  ? (followedArtistIds.includes(String(b.id || '').toLowerCase().trim()) || followedArtistIds.includes(bName.toLowerCase()))
                  : (followedArtistIds.includes(String(b.id || '').toLowerCase().trim()) || followedArtistIds.includes(bName.toLowerCase()) || !!localFollows[b.id] || !!localFollows[bName.toLowerCase()]),
                isYou: false
              });
            });
          }

          // Also inject fan/community-curated band archives
          const commBands = communityBandManager.getAll();
          commBands.forEach((cb) => {
            if ((list || []).some(x => x.name.toLowerCase() === cb.name.toLowerCase())) return;
            const isUnsplash = (url?: string) => !url || typeof url !== 'string' || url.includes('unsplash');
            const discCover = cb.discography?.[0]?.cover_url || cb.discography?.[0]?.cover_image || cb.discography?.[0]?.image_url;
            const cbAvatar = (cb.logo_url && !isUnsplash(cb.logo_url))
              ? cb.logo_url
              : (cb.avatar_url && !isUnsplash(cb.avatar_url))
              ? cb.avatar_url
              : (discCover && !isUnsplash(discCover))
              ? discCover
              : (cb.logo_url || cb.avatar_url || (cb as any).avatar || (cb as any).image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200');
            const cbCover = cb.cover_url || cb.banner_url || (cb as any).cover || (cb as any).banner;
            list.push({
              ...cb,
              id: cb.id,
              band_id: cb.id,
              name: cb.name,
              band_name: cb.name,
              role: 'Band',
              portalRole: 'band',
              isBandProfile: true,
              is_community_archive: cb.verification_status === 'community_archive',
              verification_status: cb.verification_status,
              type: 'band',
              category: 'bands',
              desc: cb.bio || cb.genre,
              avatar: cbAvatar,
              image: cbAvatar,
              avatar_url: cb.avatar_url || cbAvatar,
              logo_url: cb.logo_url || cbAvatar,
              cover_url: cbCover,
              banner_url: cbCover,
              banner: cbCover || '',
              followers_count: cb.followers_count || 120,
              discography: cb.discography || [],
              curated_by: cb.curated_by,
              followed: authoritativeFollowsForCheck !== undefined
                ? (followedArtistIds.includes(String(cb.id || '').toLowerCase().trim()) || followedArtistIds.includes(cb.name.toLowerCase()))
                : (!!localFollows[cb.id] || !!localFollows[cb.name.toLowerCase()]),
              isYou: false
            });
          });
        } catch (err) {
          console.error("Error fetching bands from Supabase:", err);
        }

        try {
          if (creativesList && creativesList.length > 0) {
            creativesList.forEach((c: any) => {
              const cName = c.business_name || c.creative_handle || '';
              if (!cName) return;
              if ((list || []).some(x => x.name.toLowerCase() === cName.toLowerCase())) return;

              const cAvatar = c.avatar_url || 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=150';
              const cBanner = c.banner_url || '';

              list.push({
                ...c,
                id: `real-c-${c.id}`,
                raw_id: c.id,
                creative_id: c.id,
                user_id: c.user_id || c.creator_id,
                creator_id: c.creator_id || c.user_id,
                owner_id: c.user_id || c.creator_id,
                name: cName,
                business_name: cName,
                creative_name: cName,
                creative_business_name: cName,
                role: 'Creative',
                portalRole: 'creative',
                type: 'creative',
                category: 'creatives',
                specialty: c.primary_category || 'Creative Specialist',
                desc: c.bio || 'Specialist creative portfolio on Nexus',
                avatar: cAvatar,
                image: cAvatar,
                creative_avatar: cAvatar,
                banner: cBanner,
                creative_banner: cBanner,
                followed: authoritativeFollowsForCheck !== undefined
                  ? (followedArtistIds.includes(String(c.id || '').toLowerCase().trim()) || followedArtistIds.includes(cName.toLowerCase()))
                  : (followedArtistIds.includes(String(c.id || '').toLowerCase().trim()) || followedArtistIds.includes(cName.toLowerCase()) || !!localFollows[c.id] || !!localFollows[cName.toLowerCase()]),
                isYou: false
              });
            });
          }
        } catch (err) {
          console.error("Error mapping creatives:", err);
        }

        try {
          if (labelsList && labelsList.length > 0) {
            labelsList.forEach((l: any) => {
              const lName = l.name || '';
              if (!lName) return;
              if ((list || []).some(x => x.name.toLowerCase() === lName.toLowerCase())) return;

              const lAvatar = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=150';

              list.push({
                ...l,
                id: `real-l-${l.id}`,
                raw_id: l.id,
                label_id: l.id,
                name: lName,
                label_company_name: lName,
                label_name: lName,
                role: 'Record Label',
                portalRole: 'label',
                type: 'label',
                category: 'labels',
                desc: 'Independent Record Label',
                avatar: lAvatar,
                image: lAvatar,
                label_avatar: lAvatar,
                banner: '',
                followed: authoritativeFollowsForCheck !== undefined
                  ? (followedArtistIds.includes(String(l.id || '').toLowerCase().trim()) || followedArtistIds.includes(lName.toLowerCase()))
                  : (followedArtistIds.includes(String(l.id || '').toLowerCase().trim()) || followedArtistIds.includes(lName.toLowerCase()) || !!localFollows[l.id] || !!localFollows[lName.toLowerCase()]),
                isYou: false
              });
            });
          }
        } catch (err) {
          console.error("Error mapping labels:", err);
        }

        try {
          if (promotersList && promotersList.length > 0) {
            promotersList.forEach((p: any) => {
              const pName = p.entity_name || p.name || '';
              if (!pName) return;
              if ((list || []).some(x => x.name.toLowerCase() === pName.toLowerCase())) return;

              const pAvatar = p.promoter_logo || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150';
              const pBanner = p.promoter_cover_image || '';

              list.push({
                ...p,
                id: `real-pr-${p.id}`,
                raw_id: p.id,
                promoter_id: p.id,
                user_id: p.user_id,
                creator_id: p.user_id,
                owner_id: p.user_id,
                name: pName,
                brand_name: pName,
                agency_name: pName,
                promoter_name: pName,
                role: 'Promoter / Venue',
                portalRole: 'promoter',
                type: 'promoter',
                category: 'venues',
                desc: p.location || p.bio || 'Live Music Booking & Venue Promoter',
                avatar: pAvatar,
                image: pAvatar,
                banner: pBanner,
                followed: authoritativeFollowsForCheck !== undefined
                  ? (followedArtistIds.includes(String(p.id || '').toLowerCase().trim()) || followedArtistIds.includes(pName.toLowerCase()))
                  : (followedArtistIds.includes(String(p.id || '').toLowerCase().trim()) || followedArtistIds.includes(pName.toLowerCase()) || !!localFollows[p.id] || !!localFollows[pName.toLowerCase()]),
                isYou: false
              });
            });
          }
        } catch (err) {
          console.error("Error mapping promoters:", err);
        }
      }

      const uniqueList: any[] = [];
      const seenNames = new Set<string>();

      list.forEach(item => {
        const nameLower = (item?.name || '').toLowerCase();
        if (!seenNames.has(nameLower)) {
          seenNames.add(nameLower);
          uniqueList.push(item);
        }
      });

      setRealProfiles(uniqueList);

      // Merge real profiles into discoverProfiles pool so they appear in recommendations
      if (uniqueList.length > 0) {
        setDiscoverProfiles(prev => {
          const merged = [...prev];
          uniqueList.forEach(rp => {
            if (rp.isYou) return;
            const existingIdx = merged.findIndex(m => 
              (m.id && m.id === rp.id) || 
              (m.name && m.name.toLowerCase() === rp.name.toLowerCase())
            );
            if (existingIdx >= 0) {
              merged[existingIdx] = { ...merged[existingIdx], ...rp };
            } else {
              merged.push(rp);
            }
          });
          return merged;
        });
      }
    };

    fetchRealData();

    const handleUpdate = () => {
      fetchRealData();
    };
    window.addEventListener('nexus_community_bands_updated', handleUpdate);
    window.addEventListener('nexus_avatar_updated', handleUpdate);
    window.addEventListener(FOLLOW_EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('nexus_community_bands_updated', handleUpdate);
      window.removeEventListener('nexus_avatar_updated', handleUpdate);
      window.removeEventListener(FOLLOW_EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userProfile?.id, userProfile?.email]);

  const isValidUUID = (str: string | null | undefined): boolean => {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
  };

  const resolveProfileUUID = (target: any, profilesList: any[] = allProfiles): string | null => {
    if (!target) return null;

    if (typeof target === 'string') {
      const extracted = extractUUID(target);
      if (extracted && isValidUUID(extracted)) return extracted;
    } else if (typeof target === 'object') {
      const isEntity = isEntityTargetObject(target);
      const candidateFields = isEntity
        ? [
            target.raw_id,
            target.band_id,
            target.label_id,
            target.promoter_id,
            target.creative_id,
            target.id
          ]
        : [
            target.raw_id,
            target.band_id,
            target.user_id,
            target.profile_id,
            target.id
          ];
      for (const field of candidateFields) {
        if (field) {
          const extracted = extractUUID(String(field));
          if (extracted && isValidUUID(extracted)) return extracted;
        }
      }
    }

    const targetName = (typeof target === 'string' ? target : target.band_name || target.bandName || target.name || target.full_name || target.display_name || target.label_company_name || target.agency_name || target.business_name || target.console_handle || target.email || '').toLowerCase().trim();
    const targetEmail = (typeof target === 'object' && target?.email ? target.email : '').toLowerCase().trim();
    const targetHandle = (typeof target === 'object' && (target?.console_handle || target?.handle) ? target.console_handle || target.handle : '').toLowerCase().trim().replace('@', '');

    const combinedPool = [...(profilesList || []), ...(realProfiles || []), ...(discoverProfiles || [])];
    const match = combinedPool.find((p: any) => {
      const pExtractedId = extractUUID(p.raw_id) || extractUUID(p.band_id) || extractUUID(p.id) || extractUUID(p.user_id) || extractUUID(p.email);
      if (pExtractedId && (target === pExtractedId || (typeof target === 'object' && extractUUID(target?.id) === pExtractedId))) return true;
      if (targetEmail && p.email && p.email.toLowerCase() === targetEmail) return true;
      if (targetHandle && p.console_handle && p.console_handle.toLowerCase().replace('@', '') === targetHandle) return true;
      if (targetName && p.name && p.name.toLowerCase() === targetName) return true;
      if (targetName && p.full_name && p.full_name.toLowerCase() === targetName) return true;
      if (targetName && (p.band_name || p.bandName) && (p.band_name || p.bandName).toLowerCase() === targetName) return true;
      if (targetName && p.label_company_name && p.label_company_name.toLowerCase() === targetName) return true;
      if (targetName && (p.agency_name || p.promoter_name) && (p.agency_name || p.promoter_name).toLowerCase() === targetName) return true;
      if (targetName && (p.business_name || p.creative_name) && (p.business_name || p.creative_name).toLowerCase() === targetName) return true;
      return false;
    });

    if (match) {
      const matchedUuid = extractUUID(match.raw_id) || extractUUID(match.band_id) || extractUUID(match.id) || extractUUID(match.user_id) || extractUUID(match.profile_id);
      if (matchedUuid && isValidUUID(matchedUuid)) return matchedUuid;
    }

    return null;
  };

  const handleFollowProfile = async (targetInput: any, forceAction?: 'follow' | 'unfollow') => {
    const supabaseClient = getSupabase();

    // 1. Resolve Follower ID (Current User) as a valid UUID
    let followerId = extractUUID(userProfile?.id) || extractUUID(userProfile?.user_id) || extractUUID(userProfile?.raw_id) || resolveProfileUUID(userProfile, allProfiles);
    if ((!followerId || !isValidUUID(followerId)) && supabaseClient) {
      try {
        const { data: userData } = await supabaseClient.auth.getUser();
        if (userData?.user?.id && isValidUUID(userData.user.id)) {
          followerId = userData.user.id;
        } else {
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (session?.user?.id && isValidUUID(session.user.id)) {
            followerId = session.user.id;
          }
        }
      } catch (err) {
        console.error("Auth session retrieval error:", err);
      }
    }
    if ((!followerId || !isValidUUID(followerId)) && supabaseClient && userProfile) {
      try {
        const searchVal = userProfile.email || userProfile.name || userProfile.full_name || userProfile.console_handle;
        if (searchVal) {
          const clean = searchVal.trim();
          const { data: myProf } = await supabaseClient
            .from('profiles')
            .select('id')
            .ilike('email', clean)
            .maybeSingle();
          if (myProf?.id && isValidUUID(myProf.id)) {
            followerId = myProf.id;
          }
        }
      } catch (e) {}
    }
    if (!followerId || !isValidUUID(followerId)) {
      const userSeed = userProfile?.email || userProfile?.name || userProfile?.id || 'current-user-nexus';
      followerId = generateDeterministicUUID(`user-${userSeed}`);
    }

    // 2. Identify if target is a Band (Guard against fan/personal accounts being misidentified)
    const isTargetFan = typeof targetInput === 'object' && (
      targetInput?.account_type === 'fan' ||
      targetInput?.account_type === 'fan_only' ||
      targetInput?.role === 'Fan Listener' ||
      targetInput?.role === 'FAN' ||
      targetInput?.isPersonal === true
    ) && !targetInput?.isBandProfile && targetInput?.account_type !== 'band';

    const isBand = !isTargetFan && ((
      typeof targetInput === 'object' && (
        targetInput?.isBandProfile === true ||
        targetInput?.type === 'band' ||
        targetInput?.role === 'Band' ||
        targetInput?.role === 'band' ||
        targetInput?.portalRole === 'band' ||
        targetInput?.account_type === 'band' ||
        (!!targetInput?.band_name && targetInput?.account_type === 'band') ||
        (!!targetInput?.bandName && targetInput?.account_type === 'band')
      )
    ) || (typeof targetInput === 'string' && targetInput.startsWith('real-b-')));

    // 3. Resolve Target ID and Name (never use creator_id / owner_id / user_id on band/entity objects)
    const isEntity = isBand || isEntityTargetObject(targetInput);
    let targetUserId = extractUUID(
      typeof targetInput === 'object'
        ? (isEntity
            ? (targetInput?.band_id || targetInput?.raw_id || targetInput?.id)
            : (targetInput?.band_id || targetInput?.raw_id || targetInput?.id || targetInput?.user_id || targetInput?.profile_id))
        : targetInput
    ) || resolveProfileUUID(targetInput, allProfiles);
    const targetName = typeof targetInput === 'string'
      ? targetInput.replace(/^real-[pb]-/, '').replace('real-', '')
      : targetInput?.band_name || targetInput?.bandName || targetInput?.name || targetInput?.full_name || targetInput?.console_handle || 'User';

    const cleanSearch = (targetName || '').trim();

    if (supabaseClient && cleanSearch) {
      if (isBand) {
        if (!targetUserId || !isValidUUID(targetUserId)) {
          try {
            const { bandsByName } = await batchResolveBandsAndProfilesByName(supabaseClient, [cleanSearch]);
            const resolvedBand = bandsByName.get(cleanSearch.toLowerCase());
            if (resolvedBand?.id && isValidUUID(resolvedBand.id)) {
              targetUserId = resolvedBand.id;
            }
          } catch (e) {}
        }

        // If band doesn't exist yet in Supabase bands table, ensure a record is created so the relation is valid (only for real band targets)
        if ((!targetUserId || !isValidUUID(targetUserId)) && isBand) {
          const autoBandId = generateDeterministicUUID(`band-${cleanSearch.toLowerCase()}`);
          const bandPayload = sanitizeBandPayload({
            id: autoBandId,
            band_name: cleanSearch,
            name: cleanSearch,
            genre: (typeof targetInput === 'object' && (targetInput.genre || targetInput.genres?.[0])) || 'Metal',
            logo_url: typeof targetInput === 'object' ? (targetInput.logo_url || targetInput.logo || targetInput.band_logo) : undefined,
            cover_url: typeof targetInput === 'object' ? (targetInput.cover_url || targetInput.cover || targetInput.band_cover) : undefined
          });
          try {
            await executeWithSchemaResilience(
              async (p) => supabaseClient.from('bands').upsert(p),
              bandPayload
            );
            targetUserId = autoBandId;
          } catch (createErr) {
            console.warn("Auto-create band notice:", createErr);
            targetUserId = autoBandId;
          }
        }
      } else {
        const isCreativeTarget = typeof targetInput === 'object' && (
          targetInput?.isCreativeProfile ||
          targetInput?.type === 'creative' ||
          targetInput?.account_type === 'creative' ||
          targetInput?.role?.toLowerCase?.().includes('creative') ||
          targetInput?.specialty ||
          !!targetInput?.business_name ||
          !!targetInput?.creative_name
        );

        if (isCreativeTarget && (!targetUserId || !isValidUUID(targetUserId))) {
          try {
            const { data: matchedCreatives } = await supabaseClient
              .from('creatives')
              .select('id, creator_id, user_id')
              .or(`business_name.ilike.%${cleanSearch}%,creative_handle.ilike.%${cleanSearch}%`)
              .limit(1);
            if (matchedCreatives && matchedCreatives.length > 0 && isValidUUID(matchedCreatives[0].id)) {
              targetUserId = matchedCreatives[0].id;
            }
          } catch (e) {}
        }

        if (!targetUserId || !isValidUUID(targetUserId)) {
          try {
            const { profilesByName } = await batchResolveBandsAndProfilesByName(supabaseClient, [cleanSearch]);
            const resolvedProfile = profilesByName.get(cleanSearch.toLowerCase());
            if (resolvedProfile?.id && isValidUUID(resolvedProfile.id)) {
              targetUserId = resolvedProfile.id;
            }
          } catch (e) {}
        }
        if (!targetUserId || !isValidUUID(targetUserId)) {
          targetUserId = generateDeterministicUUID(`profile-${cleanSearch.toLowerCase()}`);
        }
      }
    }

    const finalTargetId = (targetUserId && isValidUUID(targetUserId))
      ? targetUserId
      : generateDeterministicUUID(`target-${cleanSearch.toLowerCase() || 'item'}`);

    const targetNameLower = targetName.toLowerCase().trim();

    const cleanTargetCheck = typeof targetInput === 'object' && targetInput
      ? { ...targetInput, followed: undefined, isFollowed: undefined, isFollowedByMe: undefined }
      : targetInput;
    let currentlyFollowed = isProfileFollowedGlobally(cleanTargetCheck, allFollows, followerId);
    if (!currentlyFollowed && finalTargetId) {
      currentlyFollowed = isProfileFollowedGlobally(finalTargetId, allFollows, followerId);
    }
    if (!currentlyFollowed && targetName) {
      currentlyFollowed = isProfileFollowedGlobally(targetName, allFollows, followerId);
    }

    const nextAction = forceAction ? forceAction : (currentlyFollowed ? 'unfollow' : 'follow');
    const isNowFollowed = nextAction === 'follow';

    // Persist to user-scoped localStorage via followSyncService
    saveFollowStateGlobally(targetInput, isNowFollowed, followerId);
    if (finalTargetId) saveFollowStateGlobally(finalTargetId, isNowFollowed, followerId);

    if (supabaseClient && followerId && finalTargetId && isValidUUID(followerId) && isValidUUID(finalTargetId)) {
      const targetType = isBand ? 'band' : ((typeof targetInput === 'object' ? targetInput?.type || targetInput?.account_type || targetInput?.role : null) || 'user');
      const followId = generateDeterministicUUID(`follow-${followerId}-${finalTargetId}`);

      if (isNowFollowed) {
        const payload = {
          id: followId,
          follower_id: followerId,
          followed_id: finalTargetId,
          target_type: targetType
        };

        const res = await executeWithSchemaResilience(
          async (p) => supabaseClient.from('follows').upsert([p], { onConflict: 'follower_id,followed_id' }),
          payload
        );

        if (res.error) {
          const insertRes = await executeWithSchemaResilience(
            async (p) => supabaseClient.from('follows').insert([p]),
            payload
          );
          if (insertRes.error) {
            console.warn('Supabase Follow Notice:', insertRes.error.message);
          } else {
            console.log('✅ Supabase Follow Record Created Successfully:', payload);
          }
        } else {
          console.log('✅ Supabase Follow Record Upserted Successfully:', payload);
        }
      } else {
        const { error } = await supabaseClient
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('followed_id', finalTargetId);
        if (error) {
          console.warn('Supabase Unfollow Notice:', error.message);
        } else {
          console.log('✅ Supabase Follow Record Removed Successfully:', { follower_id: followerId, followed_id: finalTargetId });
        }
      }
    }

    const matchesFollow = (f: any) => {
      const fId = f.follower_id || f.fan_profile_id;
      const tId = f.followed_id || f.artist_id;
      if (fId === followerId && tId === finalTargetId) return true;
      if (f.target_name && f.target_name.toLowerCase().trim() === targetNameLower) return true;
      return false;
    };

    setAllFollows(prev => {
      if (isNowFollowed) {
        if (prev.some(matchesFollow)) return prev;
        return [...prev, {
          fan_profile_id: followerId,
          artist_id: finalTargetId,
          follower_id: followerId,
          followed_id: finalTargetId,
          target_name: targetName
        }];
      } else {
        return prev.filter(f => !matchesFollow(f));
      }
    });

    setSelectedUserProfile(prev => {
      if (!prev) return null;
      const prevId = resolveProfileUUID(prev, allProfiles) || prev.id;
      if (prevId === finalTargetId || prev.name?.toLowerCase().trim() === targetNameLower) {
        const currentFollowers = prev.followersCount ?? prev.followers ?? 0;
        const diff = isNowFollowed ? 1 : -1;
        const newCount = prev.isFollowed === isNowFollowed ? currentFollowers : Math.max(0, currentFollowers + diff);
        return {
          ...prev,
          isFollowed: isNowFollowed,
          followersCount: newCount,
          followers: newCount
        };
      }
      return prev;
    });

    if (setLiveProfileStats) {
      setLiveProfileStats(prev => {
        if (!prev) return null;
        const currentFollowers = prev.followers || 0;
        const diff = isNowFollowed ? 1 : -1;
        return {
          ...prev,
          followers: Math.max(0, currentFollowers + diff),
          isFollowedByMe: isNowFollowed
        };
      });
    }

    if (setCurrentUserStats) {
      setCurrentUserStats(prev => {
        if (!prev) return null;
        const currentFollowing = prev.following || 0;
        const diff = isNowFollowed ? 1 : -1;
        return {
          ...prev,
          following: Math.max(0, currentFollowing + diff)
        };
      });
    }

    setDiscoverProfiles(prev => {
      const exists = (prev || []).some(p => (p?.name || "User").toLowerCase().trim() === targetNameLower || p.id === finalTargetId);
      if (exists) {
        return prev.map(p => {
          if ((p?.name || "User").toLowerCase().trim() === targetNameLower || p.id === finalTargetId) {
            return { ...p, followed: isNowFollowed };
          }
          return p;
        });
      } else if (isNowFollowed) {
        return [...prev, {
          id: finalTargetId,
          name: targetName,
          role: '👤 Member',
          category: 'friends',
          desc: 'Connected from interactions',
          avatar: targetName.slice(0, 2).toUpperCase(),
          image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=200',
          followed: true,
          followedBack: false,
          notificationsEnabled: true
        }];
      }
      return prev;
    });

    setRealProfiles(prev => {
      return prev.map(p => {
        if (p.id === finalTargetId || (p.name || '').toLowerCase().trim() === targetNameLower) {
          return { ...p, followed: isNowFollowed };
        }
        return p;
      });
    });

    triggerNotification?.(isNowFollowed ? `✨ Now following ${targetName}!` : `💔 Unfollowed ${targetName}.`);
  };

  const handleToggleMutualFollow = async (targetInput: any) => {
    const supabaseClient = getSupabase();

    let myId = extractUUID(userProfile?.id) || extractUUID(userProfile?.user_id) || resolveProfileUUID(userProfile, allProfiles);
    if ((!myId || !isValidUUID(myId)) && supabaseClient) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user?.id && isValidUUID(session.user.id)) {
          myId = session.user.id;
        }
      } catch (err) {}
    }
    if ((!myId || !isValidUUID(myId)) && supabaseClient && userProfile) {
      try {
        const searchVal = userProfile.email || userProfile.name || userProfile.full_name || userProfile.console_handle;
        if (searchVal) {
          const { data: myProf } = await supabaseClient
            .from('profiles')
            .select('id')
            .or(`email.ilike.${searchVal},full_name.ilike.${searchVal},console_handle.ilike.${searchVal}`)
            .maybeSingle();
          if (myProf?.id && isValidUUID(myProf.id)) {
            myId = myProf.id;
          }
        }
      } catch (e) {}
    }

    const targetName = typeof targetInput === 'string'
      ? targetInput.replace(/^real-[pb]-/, '').replace('real-', '')
      : targetInput?.band_name || targetInput?.bandName || targetInput?.name || targetInput?.full_name || targetInput?.console_handle || 'User';

    let targetUserId = extractUUID(typeof targetInput === 'object' ? (targetInput?.raw_id || targetInput?.band_id || targetInput?.user_id || targetInput?.id) : targetInput) || resolveProfileUUID(targetInput, allProfiles);
    const cleanSearch = targetName.trim();
    if ((!targetUserId || !isValidUUID(targetUserId)) && supabaseClient && cleanSearch) {
      try {
        const { bandsByName, profilesByName } = await batchResolveBandsAndProfilesByName(supabaseClient, [cleanSearch]);
        const bMatch = bandsByName.get(cleanSearch.toLowerCase());
        const pMatch = profilesByName.get(cleanSearch.toLowerCase());
        if (bMatch?.id && isValidUUID(bMatch.id)) {
          targetUserId = bMatch.id;
        } else if (pMatch?.id && isValidUUID(pMatch.id)) {
          targetUserId = pMatch.id;
        }
      } catch (e) {}
    }
    if (!targetUserId || !isValidUUID(targetUserId)) {
      targetUserId = generateDeterministicUUID(`target-${cleanSearch.toLowerCase() || 'item'}`);
    }
    const targetNameLower = targetName.toLowerCase().trim();

    let localMutuals: Record<string, boolean> = {};
    try {
      localMutuals = JSON.parse(localStorage.getItem('nexus_local_mutuals_v1') || '{}');
    } catch (e) {}

    const isMutualNow = !(localMutuals[targetUserId] || localMutuals[targetNameLower]);

    try {
      if (isMutualNow) {
        localMutuals[targetUserId] = true;
        if (targetNameLower) localMutuals[targetNameLower] = true;
      } else {
        delete localMutuals[targetUserId];
        if (targetNameLower) delete localMutuals[targetNameLower];
      }
      localStorage.setItem('nexus_local_mutuals_v1', JSON.stringify(localMutuals));
    } catch (e) {}

    if (supabaseClient && myId && targetUserId && isValidUUID(myId) && isValidUUID(targetUserId)) {
      const followId = generateDeterministicUUID(`follow-${targetUserId}-${myId}`);
      const payload = {
        id: followId,
        follower_id: targetUserId,
        followed_id: myId,
        target_type: 'user'
      };

      if (isMutualNow) {
        const res = await executeWithSchemaResilience(
          async (p) => supabaseClient.from('follows').upsert([p], { onConflict: 'follower_id,followed_id' }),
          payload
        );
        if (res.error) {
          const insertRes = await executeWithSchemaResilience(
            async (p) => supabaseClient.from('follows').insert([p]),
            payload
          );
          if (insertRes.error) console.warn("Supabase Mutual Follow Notice:", insertRes.error.message);
          else console.log("✅ Supabase Mutual Follow Inserted:", payload);
        } else {
          console.log("✅ Supabase Mutual Follow Upserted:", payload);
        }
      } else {
        const { error } = await supabaseClient.from('follows').delete()
          .eq('follower_id', targetUserId)
          .eq('followed_id', myId);
        if (error) console.warn("Supabase Mutual Unfollow Notice:", error.message);
        else console.log("✅ Supabase Mutual Follow Removed:", { follower_id: targetUserId, followed_id: myId });
      }
    }

    setAllFollows(prev => {
      if (isMutualNow) {
        return [...prev, {
          follower_id: targetUserId,
          followed_id: myId,
          fan_profile_id: targetUserId,
          artist_id: myId,
          target_name: userProfile?.name || 'My Account'
        }];
      } else {
        return prev.filter(f => !((f.follower_id === targetUserId || f.fan_profile_id === targetUserId) && (f.followed_id === myId || f.artist_id === myId)));
      }
    });

    setDiscoverProfiles(prev => prev.map(p => {
      if (p.id === targetUserId || p.name?.toLowerCase().trim() === targetNameLower) {
        return { ...p, followedBack: isMutualNow };
      }
      return p;
    }));

    setRealProfiles(prev => prev.map(p => {
      if (p.id === targetUserId || p.name?.toLowerCase().trim() === targetNameLower) {
        return { ...p, followedBack: isMutualNow };
      }
      return p;
    }));

    triggerNotification?.(isMutualNow ? `🤝 Mutual connection enabled with ${targetName}! Your account is now in his following list.` : `Removed mutual connection with ${targetName}.`);
  };

  const handleUnfollow = async (targetInput: any) => {
    return handleFollowProfile(targetInput, 'unfollow');
  };

  const handleGlobalSearchFollowToggle = async (profileId: string, name: string) => {
    const targetObj = realProfiles.find(p => p.id === profileId || p.name?.toLowerCase() === name.toLowerCase());
    await handleFollowProfile(targetObj || profileId || name);
  };

  return {
    discoverProfiles,
    setDiscoverProfiles,
    realProfiles,
    setRealProfiles,
    resolveProfileUUID,
    handleFollowProfile,
    handleToggleMutualFollow,
    handleUnfollow,
    handleGlobalSearchFollowToggle
  };
}
