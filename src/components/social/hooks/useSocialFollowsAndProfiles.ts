import { useState, useEffect } from 'react';
import { initialDiscoverProfiles } from '../data/discoverProfilesData';
import { loadDiscoverProfilesCache, saveDiscoverProfilesCache } from '../utils/feedCacheUtils';
import { extractUUID } from '../../../utils/socialFeedUtils';
import { getSupabase, executeWithSchemaResilience, sanitizeBandPayload } from '../../../supabase';
import { isMiguelNameOrProfile } from '../utils/profileUtils';
import { communityBandManager, isDeletedOrZombieBand } from '../../../lib/communityBands';
import { isCommunityBandRecord } from '../../../lib/seedBandsData';

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
              return { ...p, followed: saved.followed, followedBack: saved.followedBack, notificationsEnabled: saved.notificationsEnabled };
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

      let localFollows: Record<string, boolean> = {};
      try {
        localFollows = JSON.parse(localStorage.getItem('nexus_local_follows_v1') || '{}');
      } catch (e) {}

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
            const { data: followsData } = await supabaseClient
              .from('follows')
              .select('followed_id')
              .eq('follower_id', extractedUid);
            if (followsData) {
              followedArtistIds = followsData.map((f: any) => String(f.followed_id || '').toLowerCase().trim());
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

      setDiscoverProfiles(prev => prev.map(dp => {
        const dpNameLower = (dp?.name || "User").toLowerCase().trim();
        const dpIdLower = String(dp.id || '').toLowerCase().trim();
        const isFollowed = followedArtistIds.includes(dpIdLower) || followedArtistIds.includes(dpNameLower) || !!localFollows[dp.id] || !!localFollows[dpNameLower];
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
                desc: 'Official roster artist signed to our label',
                avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
                image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
                followed: true,
                isYou: false
              });
            }
          });
        }
      }

      if (supabaseClient) {
        try {
          const { data: profiles, error: pError } = await supabaseClient
            .from('profiles')
            .select('*')
            .limit(100);

          if (profiles && !pError) {
            profiles.forEach((p: any) => {
              if (userProfile && p.email === userProfile.email) return;

              // Filter out dummy test probes and disconnected placeholder accounts
              const pEmail = (p.email || '').toLowerCase().trim();
              if (pEmail.includes('test_probe') || pEmail.includes('@example.com')) return;

              const rawFullName = (p.full_name || '').trim().toLowerCase();
              const hasHandle = Boolean(p.console_handle && p.console_handle.trim() !== '');
              const hasAvatar = Boolean((p.avatar_url || p.avatar) && !String(p.avatar_url || p.avatar).includes('default'));
              const hasBio = Boolean(p.bio && p.bio.trim() !== '');
              const hasOrg = Boolean(p.bandName || p.band_name || p.label_company_name || p.creative_name || p.promoter_name);

              if ((!rawFullName || rawFullName === 'new user' || rawFullName === 'user') && !hasHandle && !hasAvatar && !hasBio && !hasOrg) {
                return;
              }

              let profileName = p.full_name || p.display_name || p.name || p.console_handle || p.email?.split('@')[0] || 'User';
              let profileAvatar = p.avatar_url || p.avatar || '';
              let profileBanner = p.banner_url || '';
              let profileRole = p.role || p.account_type || 'Member';
              let category = 'friends';

              if (p.account_type === 'label' || p.label_company_name) {
                profileName = p.label_company_name || profileName;
                profileAvatar = p.label_avatar || profileAvatar;
                profileBanner = p.label_banner || profileBanner;
                profileRole = 'Label';
                category = 'labels';
              } else if (p.account_type === 'band' || (!p.full_name && p.bandName)) {
                profileName = p.bandName || profileName;
                profileAvatar = p.avatar_url || profileAvatar;
                profileBanner = p.banner_url || profileBanner;
                profileRole = 'Band';
                category = 'bands';
              } else if (p.account_type === 'creative') {
                profileName = p.creative_name || p.creative_metadata?.business_name || profileName;
                profileAvatar = p.creative_avatar || profileAvatar;
                profileBanner = p.creative_banner || profileBanner;
                profileRole = 'Creative';
                category = 'creatives';
              } else if (p.account_type === 'promoter') {
                profileName = p.promoter_name || p.promoter_metadata?.brand_name || profileName;
                profileAvatar = p.promoter_logo || profileAvatar;
                profileBanner = p.promoter_cover_image || profileBanner;
                profileRole = 'Promoter';
                category = 'venues';
              }

              list.push({
                ...p,
                id: p.id || `real-p-${p.email}`,
                raw_id: p.id,
                user_id: p.id,
                creator_id: p.creator_id || p.id,
                owner_id: p.owner_id || p.id,
                band_id: p.band_id,
                band_name: p.band_name || p.bandName,
                name: profileName,
                role: profileRole,
                portalRole: profileRole.toLowerCase(),
                category: category,
                desc: p.bio || p.creative_metadata?.bio || `${profileRole} profile on the Nexus network`,
                avatar: profileAvatar,
                image: profileAvatar,
                banner: profileBanner,
                followed: followedArtistIds.includes(String(p.id || '').toLowerCase().trim()) || followedArtistIds.includes(profileName.toLowerCase()) || !!localFollows[p.id] || !!localFollows[profileName.toLowerCase()],
                isYou: false,
                email: p.email,
                registered_workspaces: p.registered_workspaces || p.allowed_workspaces || p.workspaces || [],
                allowed_workspaces: p.allowed_workspaces || p.registered_workspaces || []
              });
            });
          }
        } catch (err) {
          console.error("Error fetching profiles from Supabase:", err);
        }

        try {
          const { data: bandsList, error: bError } = await supabaseClient
            .from('bands')
            .select('*')
            .limit(50);

          if (bandsList && !bError) {
            bandsList.forEach((b: any) => {
              const bName = b.band_name || b.name || '';
              if (!bName) return;
              if (isDeletedOrZombieBand(b.id) || isDeletedOrZombieBand(bName)) return;
              if ((list || []).some(x => x.name.toLowerCase() === bName.toLowerCase())) return;

              const isCommunity = isCommunityBandRecord(b.id) || isCommunityBandRecord(bName) || b.verification_status === 'community_archive' || b.is_community;

              list.push({
                ...b,
                id: `real-b-${b.id}`,
                raw_id: b.id,
                band_id: b.id,
                user_id: isCommunity ? undefined : (b.user_id || b.creator_id || b.owner_id || b.profile_id),
                creator_id: isCommunity ? undefined : (b.creator_id || b.user_id || b.owner_id || b.profile_id),
                owner_id: isCommunity ? undefined : (b.owner_id || b.creator_id || b.user_id || b.profile_id),
                profile_id: isCommunity ? undefined : (b.profile_id || b.user_id || b.creator_id),
                is_community: isCommunity,
                isCommunityArchive: isCommunity,
                name: bName,
                band_name: bName,
                role: 'Band',
                portalRole: 'band',
                isBandProfile: true,
                type: 'band',
                category: 'bands',
                desc: b.genre || 'Underground heavy metal artist',
                avatar: b.logo_url || b.avatar_url || (b as any).avatar || (b as any).image || b.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
                image: b.logo_url || b.avatar_url || (b as any).avatar || (b as any).image || b.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
                logo_url: b.logo_url || b.avatar_url || (b as any).avatar || (b as any).image || '',
                avatar_url: b.avatar_url || b.logo_url || (b as any).avatar || (b as any).image || '',
                cover_url: b.cover_url || b.banner_url || '',
                banner_url: b.banner_url || b.cover_url || '',
                banner: b.cover_url || b.banner_url || '',
                followed: followedArtistIds.includes(String(b.id || '').toLowerCase().trim()) || followedArtistIds.includes(bName.toLowerCase()) || !!localFollows[b.id] || !!localFollows[bName.toLowerCase()],
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
              followed: !!localFollows[cb.id] || !!localFollows[cb.name.toLowerCase()],
              isYou: false
            });
          });
        } catch (err) {
          console.error("Error fetching bands from Supabase:", err);
        }

        try {
          const { data: creativesList, error: cError } = await supabaseClient
            .from('creatives')
            .select('*')
            .limit(50);

          if (creativesList && !cError) {
            creativesList.forEach((c: any) => {
              const cName = c.business_name || c.creative_name || c.name || '';
              if (!cName) return;
              if ((list || []).some(x => x.name.toLowerCase() === cName.toLowerCase())) return;

              const cAvatar = c.avatar_url || c.image || c.image_url || c.creative_avatar || 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=150';
              const cBanner = c.banner_url || c.cover_url || c.creative_banner || '';

              list.push({
                ...c,
                id: `real-c-${c.id}`,
                raw_id: c.id,
                creative_id: c.id,
                user_id: c.user_id || c.creator_id || c.owner_id,
                creator_id: c.creator_id || c.user_id || c.owner_id,
                owner_id: c.owner_id || c.creator_id || c.user_id,
                name: cName,
                business_name: cName,
                creative_name: cName,
                creative_business_name: cName,
                role: 'Creative',
                portalRole: 'creative',
                type: 'creative',
                category: 'creatives',
                specialty: c.specialty || c.category || 'Creative Specialist',
                desc: c.bio || c.biography || 'Specialist creative portfolio on Nexus',
                avatar: cAvatar,
                image: cAvatar,
                creative_avatar: cAvatar,
                banner: cBanner,
                creative_banner: cBanner,
                followed: followedArtistIds.includes(String(c.id || '').toLowerCase().trim()) || followedArtistIds.includes(cName.toLowerCase()) || !!localFollows[c.id] || !!localFollows[cName.toLowerCase()],
                isYou: false
              });
            });
          }
        } catch (err) {
          console.error("Error fetching creatives from Supabase:", err);
        }

        try {
          const { data: labelsList, error: lError } = await supabaseClient
            .from('labels')
            .select('*')
            .limit(50);

          if (labelsList && !lError) {
            labelsList.forEach((l: any) => {
              const lName = l.label_company_name || l.label_name || l.name || l.company_name || '';
              if (!lName) return;
              if ((list || []).some(x => x.name.toLowerCase() === lName.toLowerCase())) return;

              const lAvatar = l.label_avatar || l.avatar_url || l.logo_url || l.image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=150';
              const lBanner = l.label_banner || l.cover_url || l.banner_url || '';

              list.push({
                ...l,
                id: `real-l-${l.id}`,
                raw_id: l.id,
                label_id: l.id,
                user_id: l.user_id || l.creator_id || l.owner_id,
                creator_id: l.creator_id || l.user_id || l.owner_id,
                owner_id: l.owner_id || l.creator_id || l.user_id,
                name: lName,
                label_company_name: lName,
                label_name: lName,
                role: 'Record Label',
                portalRole: 'label',
                type: 'label',
                category: 'labels',
                desc: l.description || l.bio || l.headquarters || 'Independent Record Label',
                avatar: lAvatar,
                image: lAvatar,
                label_avatar: lAvatar,
                banner: lBanner,
                followed: followedArtistIds.includes(String(l.id || '').toLowerCase().trim()) || followedArtistIds.includes(lName.toLowerCase()) || !!localFollows[l.id] || !!localFollows[lName.toLowerCase()],
                isYou: false
              });
            });
          }
        } catch (err) {
          console.error("Error fetching labels from Supabase:", err);
        }

        try {
          const { data: promotersList, error: prError } = await supabaseClient
            .from('promoters')
            .select('*')
            .limit(50);

          if (promotersList && !prError) {
            promotersList.forEach((p: any) => {
              const pName = p.brand_name || p.agency_name || p.promoter_name || p.name || '';
              if (!pName) return;
              if ((list || []).some(x => x.name.toLowerCase() === pName.toLowerCase())) return;

              const pAvatar = p.promoter_logo || p.logo_url || p.avatar_url || p.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150';
              const pBanner = p.promoter_cover_image || p.cover_url || p.banner_url || '';

              list.push({
                ...p,
                id: `real-pr-${p.id}`,
                raw_id: p.id,
                promoter_id: p.id,
                user_id: p.user_id || p.creator_id || p.owner_id,
                creator_id: p.creator_id || p.user_id || p.owner_id,
                owner_id: p.owner_id || p.creator_id || p.user_id,
                name: pName,
                brand_name: pName,
                agency_name: pName,
                promoter_name: pName,
                role: 'Promoter / Venue',
                portalRole: 'promoter',
                type: 'promoter',
                category: 'venues',
                desc: p.region || p.bio || p.description || 'Live Music Booking & Venue Promoter',
                avatar: pAvatar,
                image: pAvatar,
                banner: pBanner,
                followed: followedArtistIds.includes(String(p.id || '').toLowerCase().trim()) || followedArtistIds.includes(pName.toLowerCase()) || !!localFollows[p.id] || !!localFollows[pName.toLowerCase()],
                isYou: false
              });
            });
          }
        } catch (err) {
          console.error("Error fetching promoters from Supabase:", err);
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
    return () => {
      window.removeEventListener('nexus_community_bands_updated', handleUpdate);
      window.removeEventListener('nexus_avatar_updated', handleUpdate);
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
      const candidateFields = [
        target.raw_id,
        target.band_id,
        target.user_id,
        target.profile_id,
        target.creator_id,
        target.owner_id,
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

    // 2. Identify if target is a Band
    const isBand = (
      typeof targetInput === 'object' && (
        targetInput?.isBandProfile ||
        targetInput?.type === 'band' ||
        targetInput?.role === 'Band' ||
        targetInput?.role === 'band' ||
        targetInput?.portalRole === 'band' ||
        targetInput?.account_type === 'band' ||
        !!targetInput?.band_name ||
        !!targetInput?.bandName ||
        !!targetInput?.band_id
      )
    ) || (typeof targetInput === 'string' && targetInput.startsWith('real-b-'));

    // 3. Resolve Target ID and Name
    let targetUserId = extractUUID(typeof targetInput === 'object' ? (targetInput?.band_id || targetInput?.raw_id || targetInput?.id || targetInput?.user_id || targetInput?.creator_id || targetInput?.owner_id) : targetInput) || resolveProfileUUID(targetInput, allProfiles);
    const targetName = typeof targetInput === 'string'
      ? targetInput.replace(/^real-[pb]-/, '').replace('real-', '')
      : targetInput?.band_name || targetInput?.bandName || targetInput?.name || targetInput?.full_name || targetInput?.console_handle || 'User';

    const cleanSearch = (targetName || '').trim();

    if (supabaseClient && cleanSearch) {
      if (isBand) {
        // Query Supabase 'bands' table
        if (!targetUserId || !isValidUUID(targetUserId)) {
          try {
            const { data: matchedBands } = await supabaseClient
              .from('bands')
              .select('id, band_name')
              .ilike('band_name', cleanSearch)
              .limit(1);
            if (matchedBands && matchedBands.length > 0 && isValidUUID(matchedBands[0].id)) {
              targetUserId = matchedBands[0].id;
            }
          } catch (e) {}
        }
        if (!targetUserId || !isValidUUID(targetUserId)) {
          try {
            const { data: matchedBandsPartial } = await supabaseClient
              .from('bands')
              .select('id, band_name')
              .ilike('band_name', `%${cleanSearch}%`)
              .limit(1);
            if (matchedBandsPartial && matchedBandsPartial.length > 0 && isValidUUID(matchedBandsPartial[0].id)) {
              targetUserId = matchedBandsPartial[0].id;
            }
          } catch (e) {}
        }

        // If band doesn't exist yet in Supabase bands table, ensure a record is created so the relation is valid
        if (!targetUserId || !isValidUUID(targetUserId)) {
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
        // Query Supabase 'creatives' or 'profiles' table
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
              .or(`business_name.ilike.%${cleanSearch}%,creative_name.ilike.%${cleanSearch}%,name.ilike.%${cleanSearch}%`)
              .limit(1);
            if (matchedCreatives && matchedCreatives.length > 0 && isValidUUID(matchedCreatives[0].id)) {
              targetUserId = matchedCreatives[0].id;
            }
          } catch (e) {}
        }

        // Query Supabase 'profiles' table for personal profiles
        if (!targetUserId || !isValidUUID(targetUserId)) {
          try {
            const { data: matchedProfiles } = await supabaseClient
              .from('profiles')
              .select('id')
              .ilike('full_name', cleanSearch)
              .limit(1);
            if (matchedProfiles && matchedProfiles.length > 0 && isValidUUID(matchedProfiles[0].id)) {
              targetUserId = matchedProfiles[0].id;
            }
          } catch (e) {}
        }
        if (!targetUserId || !isValidUUID(targetUserId)) {
          try {
            const { data: matchedProfilesHandle } = await supabaseClient
              .from('profiles')
              .select('id')
              .ilike('console_handle', cleanSearch.replace('@', ''))
              .limit(1);
            if (matchedProfilesHandle && matchedProfilesHandle.length > 0 && isValidUUID(matchedProfilesHandle[0].id)) {
              targetUserId = matchedProfilesHandle[0].id;
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

    // Read local storage saved follows
    let localFollows: Record<string, boolean> = {};
    try {
      localFollows = JSON.parse(localStorage.getItem('nexus_local_follows_v1') || '{}');
    } catch (e) {}

    let currentlyFollowed = false;
    const targetNameLower = targetName.toLowerCase().trim();

    if (localFollows[finalTargetId] || localFollows[targetNameLower]) {
      currentlyFollowed = true;
    }

    if (!currentlyFollowed && followerId && finalTargetId) {
      currentlyFollowed = allFollows.some(f => 
        ((f.fan_profile_id === followerId || f.follower_id === followerId) && (f.artist_id === finalTargetId || f.followed_id === finalTargetId)) ||
        (f.target_name && f.target_name.toLowerCase().trim() === targetNameLower)
      );
    }
    if (!currentlyFollowed && selectedUserProfile) {
      const selId = resolveProfileUUID(selectedUserProfile, allProfiles);
      if ((selId && finalTargetId && selId === finalTargetId) || selectedUserProfile.name?.toLowerCase().trim() === targetNameLower) {
        currentlyFollowed = !!selectedUserProfile.isFollowed;
      }
    }
    if (!currentlyFollowed && typeof targetInput === 'object' && targetInput?.followed !== undefined) {
      currentlyFollowed = !!targetInput.followed;
    }
    if (!currentlyFollowed && typeof targetInput === 'object' && targetInput?.isFollowed !== undefined) {
      currentlyFollowed = !!targetInput.isFollowed;
    }
    if (!currentlyFollowed) {
      const inDiscover = discoverProfiles.find(p => (p.name || '').toLowerCase().trim() === targetNameLower || (finalTargetId && p.id === finalTargetId));
      if (inDiscover?.followed) currentlyFollowed = true;
    }
    if (!currentlyFollowed) {
      const inReal = realProfiles.find(p => (p.name || '').toLowerCase().trim() === targetNameLower || (finalTargetId && p.id === finalTargetId));
      if (inReal?.followed) currentlyFollowed = true;
    }

    const nextAction = forceAction ? forceAction : (currentlyFollowed ? 'unfollow' : 'follow');
    const isNowFollowed = nextAction === 'follow';

    // Persist to localStorage
    try {
      if (isNowFollowed) {
        localFollows[finalTargetId] = true;
        if (targetNameLower) localFollows[targetNameLower] = true;
      } else {
        delete localFollows[finalTargetId];
        if (targetNameLower) delete localFollows[targetNameLower];
      }
      localStorage.setItem('nexus_local_follows_v1', JSON.stringify(localFollows));
    } catch (e) {
      console.warn("Failed to write nexus_local_follows_v1", e);
    }

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
        const { data: bMatch } = await supabaseClient
          .from('bands')
          .select('id, band_name')
          .ilike('band_name', cleanSearch)
          .limit(1);
        if (bMatch && bMatch.length > 0 && isValidUUID(bMatch[0].id)) {
          targetUserId = bMatch[0].id;
        } else {
          const { data: pMatch } = await supabaseClient
            .from('profiles')
            .select('id')
            .ilike('full_name', cleanSearch)
            .limit(1);
          if (pMatch && pMatch.length > 0 && isValidUUID(pMatch[0].id)) {
            targetUserId = pMatch[0].id;
          }
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
