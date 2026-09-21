import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Radar, 
  Sparkles, 
  UserPlus, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ExternalLink,
  MapPin,
  Music2,
  Check,
  Building2,
  Palette,
  Disc3,
  Radio,
  Flame,
  ShieldCheck,
  RefreshCw,
  Users,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../../../supabase';
import { communityBandManager, purgeDeletedAndZombieBands, isDeletedOrZombieBand } from '../../../lib/communityBands';

export interface DiscoveryProfile {
  id: string;
  raw_id?: string;
  user_id?: string;
  band_id?: string;
  name: string;
  role?: string;
  portalRole?: string;
  type?: string;
  category: 'bands' | 'venues' | 'creatives' | 'labels' | 'fans' | string;
  desc?: string;
  avatar?: string;
  image?: string;
  avatar_url?: string;
  logo_url?: string;
  banner?: string;
  banner_url?: string;
  location?: string;
  genre?: string;
  followed?: boolean;
  followedBack?: boolean;
  isBandProfile?: boolean;
  isRealBand?: boolean;
  is_community_archive?: boolean;
  verification_status?: string;
  is_verified?: boolean;
  followers_count?: number;
  registered_workspaces?: string[];
  allowed_workspaces?: string[];
  account_type?: string;
  email?: string;
}

export interface DiscoveryZoneProps {
  discoverProfiles?: DiscoveryProfile[];
  currentUserId?: string;
  currentUserName?: string;
  onOpenProfile?: (authorId: any, authorName: any) => void;
  onFollowProfile?: (profile: any) => void;
  onTriggerNotification?: (msg: string) => void;
}

// Category Color & Theme Matrix
const CATEGORY_THEMES: Record<string, {
  accentColor: string;
  accentHex: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  btnBg: string;
  btnHover: string;
  btnText: string;
  btnShadow: string;
  icon: React.ElementType;
  label: string;
  tagline: string;
}> = {
  bands: {
    accentColor: 'text-emerald-400',
    accentHex: '#10b981',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    badgeBg: 'bg-emerald-950/80 border-emerald-500/50',
    badgeText: 'text-emerald-300',
    btnBg: 'bg-emerald-500 hover:bg-emerald-400',
    btnHover: 'hover:bg-emerald-400',
    btnText: 'text-black',
    btnShadow: 'shadow-[0_0_14px_rgba(16,185,129,0.3)]',
    icon: Music2,
    label: 'Band',
    tagline: 'Underground Metal Artist'
  },
  venues: {
    accentColor: 'text-amber-400',
    accentHex: '#f59e0b',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    badgeBg: 'bg-amber-950/80 border-amber-500/50',
    badgeText: 'text-amber-300',
    btnBg: 'bg-amber-500 hover:bg-amber-400',
    btnHover: 'hover:bg-amber-400',
    btnText: 'text-black',
    btnShadow: 'shadow-[0_0_14px_rgba(245,158,11,0.3)]',
    icon: Building2,
    label: 'Promoter / Venue',
    tagline: 'Tour Booking & Stage'
  },
  creatives: {
    accentColor: 'text-pink-400',
    accentHex: '#ec4899',
    borderClass: 'border-pink-500/40 hover:border-pink-400',
    badgeBg: 'bg-pink-950/80 border-pink-500/50',
    badgeText: 'text-pink-300',
    btnBg: 'bg-pink-500 hover:bg-pink-400',
    btnHover: 'hover:bg-pink-400',
    btnText: 'text-white',
    btnShadow: 'shadow-[0_0_14px_rgba(236,72,153,0.3)]',
    icon: Palette,
    label: 'Creative Pro',
    tagline: 'Artwork & Media Specialist'
  },
  labels: {
    accentColor: 'text-orange-400',
    accentHex: '#f97316',
    borderClass: 'border-orange-500/40 hover:border-orange-400',
    badgeBg: 'bg-orange-950/80 border-orange-500/50',
    badgeText: 'text-orange-300',
    btnBg: 'bg-orange-500 hover:bg-orange-400',
    btnHover: 'hover:bg-orange-400',
    btnText: 'text-black',
    btnShadow: 'shadow-[0_0_14px_rgba(249,115,22,0.3)]',
    icon: Disc3,
    label: 'Record Label',
    tagline: 'Music Distribution & Press'
  },
  fans: {
    accentColor: 'text-cyan-400',
    accentHex: '#06b6d4',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    badgeBg: 'bg-cyan-950/80 border-cyan-500/50',
    badgeText: 'text-cyan-300',
    btnBg: 'bg-cyan-400 hover:bg-cyan-300',
    btnHover: 'hover:bg-cyan-300',
    btnText: 'text-black',
    btnShadow: 'shadow-[0_0_14px_rgba(6,182,212,0.3)]',
    icon: Flame,
    label: 'Fan / Listener',
    tagline: 'Scene Supporter'
  }
};

const resolveImage = (item: any): string => {
  if (!item) return '';
  const isUnsplash = (url?: string) => !url || typeof url !== 'string' || url.includes('unsplash');

  if (item.logo_url && !isUnsplash(item.logo_url)) return item.logo_url;
  if (item.avatar_url && !isUnsplash(item.avatar_url)) return item.avatar_url;
  if (item.avatar && !isUnsplash(item.avatar)) return item.avatar;
  if (item.image && !isUnsplash(item.image)) return item.image;
  if (item.cover_url && !isUnsplash(item.cover_url)) return item.cover_url;

  const discCover = item.discography?.[0]?.cover_url || item.discography?.[0]?.cover_image || item.discography?.[0]?.image_url;
  if (discCover && !isUnsplash(discCover)) return discCover;

  return item.logo_url || item.avatar_url || item.avatar || item.image || item.cover_url || '';
};

export const DiscoveryZone: React.FC<DiscoveryZoneProps> = ({
  discoverProfiles = [],
  currentUserId,
  currentUserName,
  onOpenProfile,
  onFollowProfile,
  onTriggerNotification,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [localFollowedMap, setLocalFollowedMap] = useState<Record<string, boolean>>({});
  
  // Real profiles state backed strictly by Supabase
  const [supabaseBands, setSupabaseBands] = useState<DiscoveryProfile[]>([]);
  const [supabaseOthers, setSupabaseOthers] = useState<DiscoveryProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Synchronize and query real profiles strictly from Supabase tables
  const fetchSupabaseData = useCallback(async () => {
    // Purge any stale zombie bands from browser storage
    purgeDeletedAndZombieBands();

    const client = getSupabase();
    const fetchedBands: DiscoveryProfile[] = [];
    const fetchedOthers: DiscoveryProfile[] = [];

    if (!client) {
      setSupabaseBands([]);
      setSupabaseOthers([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      // 1. Primary: Fetch real bands directly from 'bands' table in Supabase
      const { data: bData, error: bError } = await client
        .from('bands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (bData && !bError && Array.isArray(bData)) {
        bData.forEach((b: any) => {
          const bName = b.band_name || b.name;
          if (!bName || !bName.trim()) return;
          if (isDeletedOrZombieBand(b.id) || isDeletedOrZombieBand(bName) || isDeletedOrZombieBand(b.custom_slug)) return;

          const locationParts = [b.city, b.state_province || b.state, b.country].filter(Boolean);
          const locationStr = locationParts.length > 0 ? locationParts.join(', ') : undefined;
          const genreStr = Array.isArray(b.micro_genres) 
            ? b.micro_genres.join(' / ') 
            : (b.micro_genres || b.genre || (Array.isArray(b.subgenres) ? b.subgenres.join(' / ') : b.sub_genres) || 'Death Metal');
          const avatarUrl = b.logo_url || b.cover_url || b.avatar_url || resolveImage(b);
          const isArchive = b.verification_status === 'community_archive';

          const existingIdx = fetchedBands.findIndex(fb => 
            fb.name.toLowerCase().trim() === bName.toLowerCase().trim() ||
            fb.raw_id === b.id ||
            fb.band_id === b.id
          );

          const bandProfile: DiscoveryProfile = {
            id: `db-band-${b.id}`,
            raw_id: b.id,
            band_id: b.id,
            user_id: b.creator_id || b.user_id || b.owner_id || b.profile_id,
            name: bName.trim(),
            role: isArchive ? 'Archive Band' : 'Band',
            portalRole: 'band',
            category: 'bands',
            genre: genreStr,
            location: locationStr,
            desc: b.bio || b.description || `${genreStr}${locationStr ? ` • ${locationStr}` : ''}`,
            avatar: avatarUrl,
            image: avatarUrl,
            logo_url: b.logo_url || avatarUrl,
            avatar_url: b.avatar_url || avatarUrl,
            banner: b.cover_url || b.banner_url || '',
            banner_url: b.cover_url || b.banner_url || '',
            isBandProfile: true,
            isRealBand: true,
            is_community_archive: isArchive,
            verification_status: b.verification_status || (b.is_verified ? 'verified_official' : 'community_archive'),
            is_verified: b.is_verified === true || b.verification_status === 'verified_official',
            followers_count: b.followers_count || 150,
            followed: false
          };

          if (existingIdx >= 0) {
            fetchedBands[existingIdx] = {
              ...fetchedBands[existingIdx],
              ...bandProfile,
              avatar: avatarUrl || fetchedBands[existingIdx].avatar,
              image: avatarUrl || fetchedBands[existingIdx].image
            };
          } else {
            fetchedBands.push(bandProfile);
          }
        });
      }

      // 2. Fetch from dedicated 'creatives' table in Supabase
      try {
        const { data: cData, error: cError } = await client
          .from('creatives')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (cData && !cError && Array.isArray(cData)) {
          cData.forEach((c: any) => {
            const cName = c.business_name || c.creative_handle || c.creative_name || c.name;
            if (!cName || !cName.trim()) return;

            const cAvatar = c.avatar_url || c.banner_url || c.image || c.creative_avatar || '';
            const locParts = [c.city, c.state_province || c.state, c.country].filter(Boolean);
            const locStr = locParts.length > 0 ? locParts.join(', ') : undefined;
            const genreStr = Array.isArray(c.genres) ? c.genres.slice(0, 3).join(' • ') : (c.genres || '');
            const cRole = c.primary_category || c.primary_skill || 'Creative Pro';

            const existingIdx = fetchedOthers.findIndex(o => 
              o.name.toLowerCase().trim() === cName.toLowerCase().trim() ||
              o.raw_id === c.id
            );

            const creativeProfile: DiscoveryProfile = {
              id: `db-c-${c.id}`,
              raw_id: c.id,
              user_id: c.user_id || c.creator_id,
              name: cName.trim(),
              role: cRole,
              portalRole: 'creative',
              category: 'creatives',
              genre: genreStr,
              location: locStr,
              desc: c.bio || c.broadcast_bulletin || c.pricing_notes || `${cRole} on Nexus Network`,
              avatar: cAvatar,
              image: cAvatar,
              banner: c.banner_url || '',
              banner_url: c.banner_url || '',
              followed: false
            };

            if (existingIdx >= 0) {
              fetchedOthers[existingIdx] = {
                ...fetchedOthers[existingIdx],
                ...creativeProfile
              };
            } else {
              fetchedOthers.push(creativeProfile);
            }
          });
        }
      } catch (err) {
        // Table might be empty or optional
      }

      // 3. Fetch real users & workspace accounts from 'profiles' table
      const { data: pData, error: pError } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (pData && !pError && Array.isArray(pData)) {
        pData.forEach((p: any) => {
          const pName = p.full_name || p.display_name || p.name || p.console_handle || p.email?.split('@')[0];
          if (!pName || !pName.trim()) return;

          let role = p.role || p.account_type || 'Fan / Listener';
          let cat = 'fans';
          let displayName = pName.trim();
          let displayAvatar = p.avatar_url || p.avatar || '';
          let displayBio = p.bio || '';

          if (p.account_type === 'band' || p.bandName) {
            displayName = p.bandName || displayName;
            role = 'Band';
            cat = 'bands';
          } else if (p.account_type === 'creative' || p.creative_name) {
            displayName = p.creative_name || p.creative_metadata?.business_name || displayName;
            displayAvatar = p.creative_avatar || displayAvatar;
            displayBio = p.creative_metadata?.bio || displayBio;
            role = 'Creative Pro';
            cat = 'creatives';
          } else if (p.account_type === 'label' || p.label_company_name) {
            displayName = p.label_company_name || displayName;
            displayAvatar = p.label_avatar || displayAvatar;
            displayBio = p.label_metadata?.description || displayBio;
            role = 'Record Label';
            cat = 'labels';
          } else if (p.account_type === 'promoter' || p.promoter_name) {
            displayName = p.promoter_name || p.promoter_metadata?.brand_name || displayName;
            displayAvatar = p.promoter_logo || displayAvatar;
            displayBio = p.promoter_metadata?.description || displayBio;
            role = 'Promoter / Venue';
            cat = 'venues';
          }

          const locParts = [p.city, p.state_province || p.state, p.country].filter(Boolean);
          const locStr = locParts.length > 0 ? locParts.join(', ') : undefined;

          // If this profile represents a band and isn't in fetchedBands yet
          if (cat === 'bands') {
            if (!fetchedBands.some(fb => fb.name.toLowerCase() === displayName.toLowerCase() || fb.raw_id === p.id)) {
              fetchedBands.push({
                id: `db-p-band-${p.id}`,
                raw_id: p.id,
                user_id: p.id,
                name: displayName,
                role: 'Band',
                portalRole: 'band',
                category: 'bands',
                location: locStr,
                desc: displayBio || 'Artist Profile on Nexus',
                avatar: displayAvatar,
                image: displayAvatar,
                banner: p.banner_url || '',
                banner_url: p.banner_url || '',
                isBandProfile: true,
                isRealBand: true,
                followed: false,
                email: p.email,
                account_type: p.account_type
              });
            }
            return;
          }

          // If this profile represents a creative and isn't in fetchedOthers yet
          if (cat === 'creatives') {
            if (!fetchedOthers.some(fo => fo.name.toLowerCase() === displayName.toLowerCase() || fo.raw_id === p.id)) {
              fetchedOthers.push({
                id: `db-p-c-${p.id}`,
                raw_id: p.id,
                user_id: p.id,
                name: displayName,
                role: 'Creative Pro',
                portalRole: 'creative',
                category: 'creatives',
                location: locStr,
                desc: displayBio || 'Creative Specialist on Nexus',
                avatar: displayAvatar,
                image: displayAvatar,
                banner: p.banner_url || '',
                banner_url: p.banner_url || '',
                followed: false,
                email: p.email,
                account_type: p.account_type
              });
            }
            return;
          }

          if (!fetchedOthers.some(fo => fo.name.toLowerCase() === displayName.toLowerCase() || fo.raw_id === p.id)) {
            fetchedOthers.push({
              id: `db-p-${p.id || p.email}`,
              raw_id: p.id,
              user_id: p.id,
              name: displayName,
              role: role,
              category: cat,
              location: locStr,
              desc: displayBio || `${role} on Nexus Network`,
              avatar: displayAvatar,
              image: displayAvatar,
              banner: p.banner_url || '',
              banner_url: p.banner_url || '',
              followed: false,
              email: p.email,
              account_type: p.account_type
            });
          }
        });
      }

      // 4. Fetch from dedicated 'labels' table
      try {
        const { data: lData } = await client.from('labels').select('*').limit(50);
        if (lData && Array.isArray(lData)) {
          lData.forEach((l: any) => {
            const lName = l.label_company_name || l.label_name || l.name;
            if (!lName || !lName.trim()) return;
            if (fetchedOthers.some(o => o.name.toLowerCase() === lName.toLowerCase())) return;

            const lAvatar = l.label_avatar || l.avatar_url || l.logo_url || '';
            const locParts = [l.city || l.headquarters, l.country].filter(Boolean);

            fetchedOthers.push({
              id: `db-l-${l.id}`,
              raw_id: l.id,
              user_id: l.user_id || l.creator_id,
              name: lName.trim(),
              role: 'Record Label',
              category: 'labels',
              location: locParts.length > 0 ? locParts.join(', ') : undefined,
              desc: l.description || 'Independent Extreme Record Label',
              avatar: lAvatar,
              image: lAvatar,
              followed: false
            });
          });
        }
      } catch (err) {
        // Table might not exist or be empty
      }

      // 5. Fetch from dedicated 'promoters' or 'venues' table
      try {
        const { data: prData } = await client.from('promoters').select('*').limit(50);
        if (prData && Array.isArray(prData)) {
          prData.forEach((pr: any) => {
            const prName = pr.brand_name || pr.agency_name || pr.promoter_name || pr.name;
            if (!prName || !prName.trim()) return;
            if (fetchedOthers.some(o => o.name.toLowerCase() === prName.toLowerCase())) return;

            const prAvatar = pr.promoter_logo || pr.logo_url || pr.avatar_url || '';
            const locParts = [pr.region || pr.city, pr.country].filter(Boolean);

            fetchedOthers.push({
              id: `db-pr-${pr.id}`,
              raw_id: pr.id,
              user_id: pr.user_id || pr.creator_id,
              name: prName.trim(),
              role: 'Promoter / Venue',
              category: 'venues',
              location: locParts.length > 0 ? locParts.join(', ') : undefined,
              desc: pr.description || pr.region || 'Live Venue & Tour Booking',
              avatar: prAvatar,
              image: prAvatar,
              followed: false
            });
          });
        }
      } catch (err) {
        // Table might not exist or be empty
      }

      setSupabaseBands(fetchedBands);
      setSupabaseOthers(fetchedOthers);
    } catch (err) {
      console.warn('Error loading Discovery Zone profiles from Supabase:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load & real-time event listeners
  useEffect(() => {
    setIsLoading(true);
    fetchSupabaseData();

    const handleUpdate = () => {
      fetchSupabaseData();
    };

    window.addEventListener('nexus_community_bands_updated', handleUpdate);
    window.addEventListener('nexus_band_created', handleUpdate);
    window.addEventListener('nexus_avatar_updated', handleUpdate);
    window.addEventListener('nexus_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('nexus_community_bands_updated', handleUpdate);
      window.removeEventListener('nexus_band_created', handleUpdate);
      window.removeEventListener('nexus_avatar_updated', handleUpdate);
      window.removeEventListener('nexus_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchSupabaseData]);

  // Combine ONLY real Supabase profiles (Bands first, then Venues, Creatives, Labels, Fans)
  const allRealProfiles = useMemo(() => {
    const pool = [
      ...supabaseBands,
      ...supabaseOthers
    ];

    const unique: DiscoveryProfile[] = [];
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();

    for (const item of pool) {
      if (!item || !item.name) continue;
      const lowerName = item.name.trim().toLowerCase();
      const pId = String(item.id || item.raw_id || item.band_id || '');

      if (isDeletedOrZombieBand(item.id) || isDeletedOrZombieBand(item.raw_id) || isDeletedOrZombieBand(item.band_id) || isDeletedOrZombieBand(lowerName)) {
        continue;
      }

      // Exclude current user ONLY for individual personal fan/member accounts
      const isPersonalAccount = item.category === 'fans' || item.role === 'Member' || item.role === 'Fan / Listener' || item.role === 'industry pro';
      if (isPersonalAccount) {
        if (currentUserId && (item.id === currentUserId || item.raw_id === currentUserId || item.user_id === currentUserId)) continue;
        if (currentUserName && lowerName === currentUserName.trim().toLowerCase()) continue;
      }
      if (dismissedIds.has(item.id)) continue;

      if (!seenNames.has(lowerName) && (!pId || !seenIds.has(pId))) {
        seenNames.add(lowerName);
        if (pId) seenIds.add(pId);
        unique.push(item);
      }
    }

    return unique;
  }, [supabaseBands, supabaseOthers, currentUserId, currentUserName, dismissedIds]);

  // Filter profiles based on selected category tab
  const filteredProfiles = useMemo(() => {
    if (selectedCategory === 'all') {
      return allRealProfiles;
    }

    if (selectedCategory === 'bands') {
      return allRealProfiles.filter(p => 
        p.category === 'bands' || p.isBandProfile || p.isRealBand || (p.role || '').toLowerCase().includes('band')
      );
    }

    if (selectedCategory === 'venues') {
      return allRealProfiles.filter(p => 
        p.category === 'venues' || (p.role || '').toLowerCase().includes('venue') || (p.role || '').toLowerCase().includes('promoter')
      );
    }

    if (selectedCategory === 'creatives') {
      return allRealProfiles.filter(p => 
        p.category === 'creatives' || (p.role || '').toLowerCase().includes('creative') || (p.role || '').toLowerCase().includes('artist')
      );
    }

    if (selectedCategory === 'labels') {
      return allRealProfiles.filter(p => 
        p.category === 'labels' || (p.role || '').toLowerCase().includes('label')
      );
    }

    if (selectedCategory === 'fans') {
      return allRealProfiles.filter(p => 
        p.category === 'fans' || (p.role || '').toLowerCase().includes('fan') || (p.role || '').toLowerCase().includes('listener') || (p.role || '').toLowerCase().includes('member')
      );
    }

    return allRealProfiles;
  }, [allRealProfiles, selectedCategory]);

  // Counts for each category
  const categoryCounts = useMemo(() => {
    const counts = {
      all: allRealProfiles.length,
      bands: allRealProfiles.filter(p => p.category === 'bands' || p.isBandProfile || p.isRealBand).length,
      venues: allRealProfiles.filter(p => p.category === 'venues' || (p.role || '').toLowerCase().includes('venue') || (p.role || '').toLowerCase().includes('promoter')).length,
      creatives: allRealProfiles.filter(p => p.category === 'creatives' || (p.role || '').toLowerCase().includes('creative')).length,
      labels: allRealProfiles.filter(p => p.category === 'labels' || (p.role || '').toLowerCase().includes('label')).length,
      fans: allRealProfiles.filter(p => p.category === 'fans' || (p.role || '').toLowerCase().includes('fan') || (p.role || '').toLowerCase().includes('member')).length,
    };
    return counts;
  }, [allRealProfiles]);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [filteredProfiles.length, selectedCategory]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 340;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchSupabaseData();
    onTriggerNotification?.("⚡ Discovery Zone synced with Supabase");
  };

  const handleToggleFollow = (profile: DiscoveryProfile) => {
    let localFollows: Record<string, boolean> = {};
    try {
      localFollows = JSON.parse(localStorage.getItem('nexus_local_follows_v1') || '{}');
    } catch (e) {}

    const nameKey = (profile.name || '').toLowerCase().trim();
    const currentFollowed = localFollowedMap[profile.id] !== undefined
      ? localFollowedMap[profile.id]
      : Boolean(
          localFollows[profile.id] || 
          localFollows[profile.band_id || ''] || 
          localFollows[profile.raw_id || ''] || 
          localFollows[nameKey] ||
          profile.followed
        );

    const nextState = !currentFollowed;
    setLocalFollowedMap(prev => ({ 
      ...prev, 
      [profile.id]: nextState,
      ...(profile.band_id ? { [profile.band_id]: nextState } : {}),
      ...(profile.raw_id ? { [profile.raw_id]: nextState } : {}),
      ...(nameKey ? { [nameKey]: nextState } : {})
    }));

    try {
      if (nextState) {
        localFollows[profile.id] = true;
        if (profile.band_id) localFollows[profile.band_id] = true;
        if (profile.raw_id) localFollows[profile.raw_id] = true;
        if (nameKey) localFollows[nameKey] = true;
      } else {
        delete localFollows[profile.id];
        if (profile.band_id) delete localFollows[profile.band_id];
        if (profile.raw_id) delete localFollows[profile.raw_id];
        if (nameKey) delete localFollows[nameKey];
      }
      localStorage.setItem('nexus_local_follows_v1', JSON.stringify(localFollows));
    } catch (e) {}

    if (onFollowProfile) {
      onFollowProfile(profile);
    } else if (onTriggerNotification) {
      onTriggerNotification(nextState ? `Now following ${profile.name}!` : `Unfollowed ${profile.name}`);
    }
  };

  // If no profiles at all and user dismissed everything, hide container
  if (allRealProfiles.length === 0 && !isLoading && dismissedIds.size > 0) {
    return null;
  }

  const categoryTabs = [
    { id: 'all', label: 'All', count: categoryCounts.all, color: '#ffffff' },
    { id: 'bands', label: 'Bands', count: categoryCounts.bands, color: '#10b981' },
    { id: 'venues', label: 'Venues', count: categoryCounts.venues, color: '#f59e0b' },
    { id: 'creatives', label: 'Creatives', count: categoryCounts.creatives, color: '#ec4899' },
    { id: 'labels', label: 'Labels', count: categoryCounts.labels, color: '#f97316' },
    { id: 'fans', label: 'Fans', count: categoryCounts.fans, color: '#06b6d4' }
  ];

  return (
    <div 
      id="discovery-zone-section"
      className="bg-gradient-to-b from-[#0e111a] via-[#0a0c13] to-[#07090e] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-3.5 sm:p-4 my-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl group/discovery transition-all duration-300"
    >
      {/* Top Ambient Cyber Highlight Glow */}
      <div className="absolute -top-12 left-1/4 w-96 h-28 bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 relative z-10">
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-950/40 to-zinc-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] shrink-0"
          >
            <Compass className="w-4 h-4" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-zinc-100 tracking-tight font-sans">
                Discovery Zone
              </h3>
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Supabase Scene
              </span>
            </div>
            <p className="text-[10.5px] text-zinc-400 font-sans leading-none mt-0.5">
              Explore real verified bands, promoters, creatives & fans from the database
            </p>
          </div>
        </div>

        {/* Categories & Carousel Navigation */}
        <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
            {categoryTabs.map((cat, catIdx) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={`discovery-tab-${cat.id}-${catIdx}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-zinc-800 text-white border font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.08)]'
                      : 'bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700'
                  }`}
                  style={isSelected ? { borderColor: `${cat.color}88`, color: cat.color } : {}}
                >
                  <span>{cat.label}</span>
                  {cat.count > 0 && (
                    <span 
                      className={`text-[8.5px] px-1 py-0.2 rounded-md font-mono ${
                        isSelected ? 'bg-white/10 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Tools: Refresh & Navigation Arrows */}
          <div className="flex items-center gap-1 pl-1 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="w-7 h-7 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 border border-zinc-800 flex items-center justify-center transition-all cursor-pointer active:scale-90"
              title="Sync Live Profiles from Supabase"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                canScrollLeft 
                  ? 'bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 active:scale-90' 
                  : 'bg-zinc-900/40 text-zinc-600 border border-zinc-800/40 cursor-not-allowed opacity-30'
              }`}
              title="Scroll Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                canScrollRight 
                  ? 'bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 active:scale-90' 
                  : 'bg-zinc-900/40 text-zinc-600 border border-zinc-800/40 cursor-not-allowed opacity-30'
              }`}
              title="Scroll Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-none py-1.5 px-0.5 scroll-smooth select-none items-center min-h-[224px]"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {isLoading && filteredProfiles.length === 0 ? (
          // Loading Skeletons
          <div className="flex gap-3 w-full py-4">
            {[1, 2, 3, 4].map((n, nIdx) => (
              <div 
                key={`skel-${n}-${nIdx}`} 
                className="w-[168px] min-w-[168px] h-[220px] bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex flex-col items-center justify-between animate-pulse"
              >
                <div className="w-13 h-13 rounded-full bg-zinc-800 mt-2" />
                <div className="w-24 h-3 bg-zinc-800 rounded mt-2" />
                <div className="w-16 h-2.5 bg-zinc-800/60 rounded mt-1" />
                <div className="w-full h-8 bg-zinc-800/80 rounded-lg mt-auto" />
              </div>
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          // Empty Category Notification
          <div className="w-full py-8 flex flex-col items-center justify-center text-center bg-zinc-950/40 border border-dashed border-zinc-800/80 rounded-xl px-4">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-zinc-300">
              No real {selectedCategory === 'all' ? 'profiles' : selectedCategory} found in Supabase yet
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5 max-w-sm">
              Profiles created in your Supabase database ({selectedCategory === 'bands' ? 'bands table' : 'profiles table'}) will automatically appear here live.
            </p>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="mt-3 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                View All Categories
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProfiles.map((profile, pIdx) => {
              let localFollows: Record<string, boolean> = {};
              try {
                localFollows = JSON.parse(localStorage.getItem('nexus_local_follows_v1') || '{}');
              } catch (e) {}

              const nameKey = (profile.name || '').toLowerCase().trim();
              const isFollowed = 
                localFollowedMap[profile.id] !== undefined ? localFollowedMap[profile.id] :
                localFollowedMap[profile.band_id || ''] !== undefined ? localFollowedMap[profile.band_id || ''] :
                localFollowedMap[profile.raw_id || ''] !== undefined ? localFollowedMap[profile.raw_id || ''] :
                localFollowedMap[nameKey] !== undefined ? localFollowedMap[nameKey] :
                Boolean(
                  localFollows[profile.id] || 
                  localFollows[profile.band_id || ''] || 
                  localFollows[profile.raw_id || ''] || 
                  localFollows[nameKey] ||
                  profile.followed
                );

              const catKey = profile.category in CATEGORY_THEMES ? profile.category : 'fans';
              const theme = CATEGORY_THEMES[catKey] || CATEGORY_THEMES.fans;
              const RoleIcon = theme.icon;
              const isBand = profile.isBandProfile || profile.category === 'bands';

              return (
                <motion.div
                  key={`discovery-card-${pIdx}-${profile.id || ''}-${profile.raw_id || ''}-${profile.band_id || ''}-${(profile as any).handle || ''}-${profile.name || ''}`}
                  layout
                  initial={{ opacity: 0, scale: 0.94, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className={`w-[168px] min-w-[168px] max-w-[168px] h-[224px] min-h-[224px] bg-[#11141f]/95 hover:bg-[#151928] border border-zinc-800/90 ${theme.borderClass} rounded-xl p-2.5 flex flex-col justify-between items-center text-center relative group/card transition-all duration-200 shadow-lg overflow-hidden`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Category Accent Top Glow Line */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-75 group-hover/card:opacity-100 transition-opacity"
                    style={{ backgroundColor: theme.accentHex }}
                  />

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(profile.id);
                    }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-zinc-900/90 text-zinc-500 hover:text-white hover:bg-zinc-800 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-20 cursor-pointer shadow-sm"
                    title="Dismiss"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>

                  {/* Profile Top Details (Clickable) */}
                  <div 
                    className="w-full flex flex-col items-center cursor-pointer"
                    onClick={() => onOpenProfile?.(profile.raw_id || profile.band_id || profile.id, profile as any)}
                  >
                    {/* Glowing Avatar Frame */}
                    <div className="relative mb-1.5 mt-0.5">
                      <motion.div 
                        whileHover={{ scale: 1.06 }}
                        className="w-13 h-13 rounded-full bg-zinc-900 border-2 overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-inner transition-all relative"
                        style={{ borderColor: theme.accentHex }}
                      >
                        {profile.image || profile.avatar ? (
                          <img 
                            src={profile.image || profile.avatar} 
                            alt={profile.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent && !parent.querySelector('.init-monogram')) {
                                const span = document.createElement('span');
                                span.className = 'init-monogram font-extrabold text-zinc-200 text-xs';
                                span.innerText = (profile.name.slice(0, 2)).toUpperCase();
                                parent.appendChild(span);
                              }
                            }}
                          />
                        ) : (
                          <span className="font-extrabold text-zinc-200 text-xs">
                            {profile.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </motion.div>

                      {/* Category Micro Badge Overlay */}
                      <div 
                        className="absolute -top-1 -left-1 w-4.5 h-4.5 rounded-full bg-zinc-950 border flex items-center justify-center shadow-md"
                        style={{ borderColor: `${theme.accentHex}88` }}
                        title={theme.label}
                      >
                        <RoleIcon className="w-2.5 h-2.5" style={{ color: theme.accentHex }} />
                      </div>

                      {/* Followed Checkmark Badge */}
                      {isFollowed && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#11141f] flex items-center justify-center shadow-sm"
                        >
                          <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                        </motion.div>
                      )}
                    </div>

                    {/* Profile Name & Verification */}
                    <h4 
                      className="font-extrabold text-[11.5px] text-zinc-100 group-hover/card:text-white transition-colors truncate max-w-[146px] leading-tight flex items-center justify-center gap-1"
                      title={profile.name}
                    >
                      <span className="truncate">{profile.name}</span>
                      {isBand && (profile.is_verified || profile.verification_status === 'verified_official') && (
                        <span title="Verified Supabase Artist" className="inline-flex items-center">
                          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0 inline" />
                        </span>
                      )}
                    </h4>

                    {/* Category Role Capsule Tag */}
                    <div 
                      className={`text-[8px] font-bold mt-1 px-2 py-0.5 rounded-md border flex items-center gap-1 max-w-[146px] truncate ${theme.badgeBg}`}
                    >
                      <RoleIcon className="w-2.5 h-2.5 shrink-0" style={{ color: theme.accentHex }} />
                      <span className={`truncate ${theme.badgeText}`}>{theme.label}</span>
                    </div>

                    {/* Location Indicator */}
                    {profile.location && (
                      <div className="flex items-center gap-0.5 text-[8px] font-mono text-zinc-400 truncate max-w-[146px] mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{profile.location}</span>
                      </div>
                    )}

                    {/* Bio / Description Preview */}
                    <p 
                      className="text-[9px] text-zinc-400 line-clamp-2 h-[24px] my-1 leading-tight px-0.5 font-sans"
                      title={profile.desc || profile.genre || profile.location}
                    >
                      {profile.desc || profile.genre || theme.tagline}
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="w-full space-y-1 mt-auto pt-0.5">
                    {/* Primary Follow Button */}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFollow(profile);
                      }}
                      className={`w-full py-1 px-2 rounded-lg text-[10.5px] font-bold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
                        isFollowed
                          ? 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 shadow-sm'
                          : `${theme.btnBg} ${theme.btnText} ${theme.btnShadow}`
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Follow</span>
                        </>
                      )}
                    </motion.button>

                    {/* View Profile Link */}
                    <button
                      type="button"
                      onClick={() => onOpenProfile?.(profile.raw_id || profile.band_id || profile.id, profile as any)}
                      className="w-full py-0.5 text-[9px] text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-0.5 font-medium cursor-pointer"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
