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
  Compass,
  Play,
  Pause,
  Shuffle,
  Volume2,
  Search,
  Eye,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../../../supabase';
import { isProfileFollowedGlobally, saveFollowStateGlobally, FOLLOW_EVENT_NAME, getTargetFollowKeys } from '../../../utils/followSyncService';
import { communityBandManager, purgeDeletedAndZombieBands, isDeletedOrZombieBand } from '../../../lib/communityBands';
import { resolveBandStatus, getBandStatusLabel, getBandStatusBadgeClass } from '../../../utils/bandProfileUtils';

export interface DiscoveryProfile {
  id: string;
  raw_id?: string;
  user_id?: string;
  creator_id?: string;
  owner_id?: string;
  band_id?: string;
  name: string;
  brand_name?: string;
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
  cover_url?: string;
  location?: string;
  genre?: string;
  followed?: boolean;
  followedBack?: boolean;
  isBandProfile?: boolean;
  isRealBand?: boolean;
  is_community_archive?: boolean;
  verification_status?: string;
  is_verified?: boolean;
  status?: string;
  is_split_up?: boolean;
  founded_year?: string;
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
  onFollowProfile?: (profile: any, action?: 'follow' | 'unfollow') => void;
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

const isBadImageUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return true;
  const clean = url.trim();
  return (
    !clean ||
    clean.includes('undefined') ||
    clean.includes('null') ||
    clean.includes('ui-avatars.com') ||
    clean.includes('photo-1534528741775-53994a69daeb')
  );
};

// Priority: Album artwork poster or promotional cover first, then banner, then avatar/logo
export const resolveHeroImage = (item: any): string => {
  if (!item) return '';

  const nameLower = (item.name || '').toLowerCase();

  // Authoritative Nexus Live Productions cover banner (never contaminated with Cranial Impalement or other bands)
  if (nameLower.includes('nexus live')) {
    const OFFICIAL_NEXUS_BANNER = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635';
    const OFFICIAL_NEXUS_LOGO = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601';
    if (!isBadImageUrl(item.banner_url) && !item.banner_url.includes('cranial')) return item.banner_url.trim();
    if (!isBadImageUrl(item.cover_url) && !item.cover_url.includes('cranial')) return item.cover_url.trim();
    if (!isBadImageUrl(item.image) && !item.image.includes('cranial')) return item.image.trim();
    return OFFICIAL_NEXUS_BANNER || OFFICIAL_NEXUS_LOGO;
  }

  const d = item.discography;
  if (Array.isArray(d) && d.length > 0) {
    for (const album of d) {
      const cover = album?.cover_url || album?.cover_image || album?.image_url;
      if (!isBadImageUrl(cover)) return cover.trim();
    }
  }

  if (!isBadImageUrl(item.banner_url)) return item.banner_url.trim();
  if (!isBadImageUrl(item.banner)) return item.banner.trim();
  if (!isBadImageUrl(item.cover_url)) return item.cover_url.trim();
  if (!isBadImageUrl(item.cover_image)) return item.cover_image.trim();
  if (!isBadImageUrl(item.image)) return item.image.trim();
  if (!isBadImageUrl(item.avatar_url)) return item.avatar_url.trim();
  if (!isBadImageUrl(item.logo_url)) return item.logo_url.trim();
  if (!isBadImageUrl(item.avatar)) return item.avatar.trim();

  return '';
};

// Secondary circle avatar
export const resolveCardAvatar = (item: any): string => {
  if (!item) return '';
  const nameLower = (item.name || '').toLowerCase();
  if (nameLower.includes('nexus live')) {
    return 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601';
  }
  if (!isBadImageUrl(item.logo_url)) return item.logo_url.trim();
  if (!isBadImageUrl(item.avatar_url)) return item.avatar_url.trim();
  if (!isBadImageUrl(item.avatar)) return item.avatar.trim();
  if (!isBadImageUrl(item.image)) return item.image.trim();
  return '';
};

// Subtitle format matching Facebook's "Musician/band" with metal twist
export const formatCategorySubtitle = (profile: DiscoveryProfile): string => {
  const isBand = profile.isBandProfile || profile.category === 'bands' || (profile.role || '').toLowerCase().includes('band');
  if (isBand) {
    const genre = profile.genre ? profile.genre.split('/')[0].trim() : 'Death Metal';
    return `Musician/band · ${genre}`;
  }
  if (profile.category === 'venues' || (profile.role || '').toLowerCase().includes('venue') || (profile.role || '').toLowerCase().includes('promoter')) {
    return `Promoter/venue · ${profile.location || 'Tour Booking'}`;
  }
  if (profile.category === 'creatives') {
    return `Creative Pro · ${profile.role || 'Media & Artwork'}`;
  }
  if (profile.category === 'labels') {
    return `Record label · ${profile.location || 'Independent Distribution'}`;
  }
  return `Scene member · ${profile.location || 'Fan Supporter'}`;
};

export interface RealPersonFollower {
  id: string;
  name: string;
  avatar?: string;
}

// Fallback real people from the scene community (no stock models or fake names)
export const DEFAULT_REAL_COMMUNITY_USERS: RealPersonFollower[] = [
  { id: 'usr-garrett', name: 'Garrett Workman' },
  { id: 'usr-christopher', name: 'Christopher Wirstrom' },
  { id: 'usr-alexander', name: 'Alexander Rausa' },
  { id: 'usr-emmanuel', name: 'Emmanuel Flores' },
];

export const getRealFollowerProof = (
  profile: DiscoveryProfile,
  realUsers: RealPersonFollower[],
  currentUserId?: string
): { users: RealPersonFollower[]; text: string } => {
  const profileNameLower = (profile.name || '').toLowerCase().trim();
  const profileIdStr = String(profile.id || profile.raw_id || profile.band_id || '');

  // Filter only real human people, excluding the target profile itself and the current user
  const pool = (realUsers.length > 0 ? realUsers : DEFAULT_REAL_COMMUNITY_USERS).filter(u => {
    const uNameLower = (u.name || '').toLowerCase().trim();
    if (uNameLower === profileNameLower) return false;
    if (u.id === profileIdStr || u.id === profile.raw_id) return false;
    if (currentUserId && u.id === currentUserId) return false;
    return true;
  });

  const count = profile.followers_count || 2900;
  const kCount = count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K` : `${count}`;

  if (pool.length >= 2) {
    // Deterministic selection based on string hash so followers stay stable for each page
    const seed = (profile.name || 'band').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const idx1 = seed % pool.length;
    const idx2 = (seed + 1) % pool.length;
    const person1 = pool[idx1];
    const person2 = pool[idx2 === idx1 ? (idx2 + 1) % pool.length : idx2];

    const firstName1 = person1.name.split(' ')[0];
    const firstName2 = person2.name.split(' ')[0];

    return {
      users: [person1, person2],
      text: `${firstName1}, ${firstName2} and ${kCount} others follow this`
    };
  } else if (pool.length === 1) {
    const person1 = pool[0];
    return {
      users: [person1],
      text: `${person1.name} and ${kCount} others follow this`
    };
  }

  return {
    users: [],
    text: `${kCount} scene followers`
  };
};

export const isDisallowedPersonalVenue = (name?: string, category?: string): boolean => {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  // Personal name of Miguel Medina must NEVER be displayed as a promoter or venue card
  if (n.includes('miguel') && (n.includes('medina') || n.includes('goregrinder'))) {
    return true;
  }
  if (category === 'venues' && (n === 'miguel medina' || n === 'miguel goregrinder medina')) {
    return true;
  }
  return false;
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
  const isHoveredRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragScrollLeftRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [localFollowedMap, setLocalFollowedMap] = useState<Record<string, boolean>>({});

  // Real-time synchronization of follow state across all components and portals
  useEffect(() => {
    const handleGlobalFollowUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.keys && Array.isArray(detail.keys)) {
        setLocalFollowedMap(prev => {
          const next = { ...prev };
          detail.keys.forEach((k: string) => {
            next[k] = Boolean(detail.isFollowed);
          });
          return next;
        });
      } else {
        setLocalFollowedMap(prev => ({ ...prev }));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(FOLLOW_EVENT_NAME, handleGlobalFollowUpdate);
      window.addEventListener('storage', handleGlobalFollowUpdate);
      return () => {
        window.removeEventListener(FOLLOW_EVENT_NAME, handleGlobalFollowUpdate);
        window.removeEventListener('storage', handleGlobalFollowUpdate);
      };
    }
  }, []);
  // Auto-scrolling and shuffle state
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Math.floor(Math.random() * 10000) + 1);
  
  // Real profiles state backed strictly by Supabase
  const [supabaseBands, setSupabaseBands] = useState<DiscoveryProfile[]>([]);
  const [supabaseOthers, setSupabaseOthers] = useState<DiscoveryProfile[]>([]);
  const [realSceneUsers, setRealSceneUsers] = useState<RealPersonFollower[]>([]);
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
          const avatarUrl = b.logo_url || b.cover_url || b.avatar_url || resolveHeroImage(b);
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
            status: b.status,
            is_split_up: b.is_split_up || b.status === 'split-up',
            founded_year: b.founded_year || b.year_formed || b.yearFormed,
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
        // Extract real individual human members from profiles for real social proof
        const extractedRealUsers: RealPersonFollower[] = [];
        pData.forEach((p: any) => {
          const rawName = p.full_name || p.display_name || p.name || '';
          if (!rawName.trim()) return;
          const cleanName = rawName.trim();
          if (p.account_type === 'band' || p.isBandProfile) return;
          const lower = cleanName.toLowerCase();
          if (lower.includes('productions') || lower.includes('records') || lower.includes('booking')) return;

          const av = p.avatar_url || p.avatar || '';
          const cleanAv = !isBadImageUrl(av) ? av.trim() : '';

          if (!extractedRealUsers.some(u => u.name.toLowerCase() === lower)) {
            extractedRealUsers.push({
              id: p.id,
              name: cleanName,
              avatar: cleanAv || undefined
            });
          }
        });
        if (extractedRealUsers.length > 0) {
          setRealSceneUsers(extractedRealUsers);
        }

        pData.forEach((p: any) => {
          const pName = p.full_name || p.display_name || p.name || p.console_handle || p.email?.split('@')[0];
          if (!pName || !pName.trim()) return;

          const isMiguel = (p.email?.toLowerCase().trim() === 'goregrindsickness@gmail.com') ||
            pName.toLowerCase().includes('miguel');

          let role = p.role || p.account_type || 'Fan / Listener';
          let cat = 'fans';
          let displayName = pName.trim();
          let displayAvatar = p.avatar_url || p.avatar || '';
          let displayBio = p.bio || '';

          if ((p.account_type === 'band' || p.isBandProfile === true) && p.account_type !== 'fan' && p.account_type !== 'fan_only') {
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
          } else if (!isMiguel && (p.account_type === 'promoter' || p.promoter_name)) {
            // Guard: Other users must NEVER take the brand name "Nexus Live Productions"
            let brandName = p.promoter_name || p.promoter_metadata?.brand_name;
            if (brandName && brandName.toLowerCase().includes('nexus live')) {
              brandName = `${pName} Productions`;
            }
            displayName = brandName || `${pName} Productions`;
            displayAvatar = p.promoter_logo || displayAvatar;
            displayBio = p.promoter_metadata?.description || displayBio;
            role = 'Promoter / Venue';
            cat = 'venues';
          }

          // Suppress any promoter/venue page with Miguel's personal name
          if (cat === 'venues' && (isMiguel || isDisallowedPersonalVenue(displayName, cat))) {
            return;
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

          if (!isDisallowedPersonalVenue(displayName, cat) && !fetchedOthers.some(fo => fo.name.toLowerCase() === displayName.toLowerCase() || fo.raw_id === p.id)) {
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
            if (isDisallowedPersonalVenue(prName, 'venues')) return;
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

      // Ensure authoritative Nexus Live Productions promoter/venue profile exists with official logo & banner
      const officialNexusLive: DiscoveryProfile = {
        id: 'promoter-nexus-live-official',
        raw_id: 'promoter-nexus-live-official',
        user_id: '5403162d-1947-43aa-b5f6-38a1bd2a1b80',
        creator_id: '5403162d-1947-43aa-b5f6-38a1bd2a1b80',
        owner_id: '5403162d-1947-43aa-b5f6-38a1bd2a1b80',
        name: 'Nexus Live Productions',
        brand_name: 'Nexus Live Productions',
        role: 'Promoter / Venue',
        portalRole: 'promoter',
        category: 'venues',
        location: 'Chicago, IL / Texas / National Tour Booking',
        desc: 'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. Lengthy history in the underground extreme metal scene with several festivals under our name most notably the Chicago/Texas Domination Fest that ran from 2014-2024.',
        avatar: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601',
        logo_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601',
        image: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
        banner: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
        cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
        banner_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
        followers_count: 2900,
        followed: false
      };

      // Filter out any promoter with Miguel's personal name, or any corrupted Nexus Live entries from other users
      const cleanedOthers = fetchedOthers.filter(o => {
        const oName = o.name.toLowerCase().trim();
        if (o.category === 'venues' && isDisallowedPersonalVenue(o.name, o.category)) return false;
        if (oName.includes('nexus live')) return false;
        return true;
      });

      cleanedOthers.unshift(officialNexusLive);

      setSupabaseBands(fetchedBands);
      setSupabaseOthers(cleanedOthers);
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

  // Combine & randomize real Supabase profiles across categories
  const allRealProfiles = useMemo(() => {
    const pool = [
      ...supabaseBands,
      ...supabaseOthers,
      ...(discoverProfiles || [])
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

      // Suppress any promoter/venue with Miguel's personal name
      if (isDisallowedPersonalVenue(item.name, item.category)) {
        continue;
      }

      // Ensure only the authoritative Nexus Live Productions promoter profile is shown
      if (lowerName.includes('nexus live') && item.id !== 'promoter-nexus-live-official') {
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

    // Interleave profiles across categories so they are thoroughly mixed
    const buckets: Record<string, DiscoveryProfile[]> = {
      bands: [],
      venues: [],
      creatives: [],
      labels: [],
      fans: []
    };

    for (const item of unique) {
      const cat = (item.category && item.category in buckets) ? item.category : 'fans';
      buckets[cat].push(item);
    }

    const interleaved: DiscoveryProfile[] = [];
    const keys = Object.keys(buckets).filter(k => buckets[k].length > 0);
    let maxLen = 0;
    keys.forEach(k => { maxLen = Math.max(maxLen, buckets[k].length); });

    for (let i = 0; i < maxLen; i++) {
      for (const k of keys) {
        if (i < buckets[k].length) {
          interleaved.push(buckets[k][i]);
        }
      }
    }

    // Deterministic shuffle with shuffleSeed to randomize order
    if (shuffleSeed > 0) {
      const list = [...interleaved];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.abs(Math.sin((i + 1) * shuffleSeed * 9999)) * (i + 1));
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
      }
      return list;
    }

    return interleaved;
  }, [supabaseBands, supabaseOthers, currentUserId, currentUserName, dismissedIds, shuffleSeed]);

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

  // Dynamically calculate one card step width (card width + gap-4)
  const getScrollStep = useCallback(() => {
    if (!scrollContainerRef.current) return 311;
    const cardEl = scrollContainerRef.current.querySelector<HTMLElement>('[data-discovery-card]');
    if (cardEl && cardEl.offsetWidth > 0) {
      return cardEl.offsetWidth + 16;
    }
    return typeof window !== 'undefined' && window.innerWidth < 640 ? 296 : 311;
  }, []);

  const checkScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [filteredProfiles.length, selectedCategory, checkScroll]);

  // Smooth periodic auto-play: cleanly advances by 1 card every 3.8s when enabled
  useEffect(() => {
    if (!isAutoScrolling || filteredProfiles.length < 2) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const timer = setInterval(() => {
      // Pause if hovered or actively dragging or unmounted
      if (isHoveredRef.current || isDraggingRef.current || !scrollContainerRef.current) {
        return;
      }
      const el = scrollContainerRef.current;
      const step = getScrollStep();
      // If at or near the end of the carousel, loop smoothly back to start
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 25) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
      setTimeout(checkScroll, 350);
    }, 3800);

    return () => clearInterval(timer);
  }, [isAutoScrolling, filteredProfiles.length, getScrollStep, checkScroll]);

  // Audio preview playback state
  const [playingProfileId, setPlayingProfileId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStopTimeoutRef = useRef<any>(null);

  // See All full modal view
  const [showSeeAllModal, setShowSeeAllModal] = useState<boolean>(false);
  const [seeAllSearchQuery, setSeeAllSearchQuery] = useState<string>('');
  const [seeAllCategory, setSeeAllCategory] = useState<string>('all');

  useEffect(() => {
    return () => {
      if (audioStopTimeoutRef.current) clearTimeout(audioStopTimeoutRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleToggleAudioPreview = (profile: DiscoveryProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingProfileId === profile.id) {
      if (audioStopTimeoutRef.current) clearTimeout(audioStopTimeoutRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setPlayingProfileId(null);
      return;
    }

    if (audioStopTimeoutRef.current) clearTimeout(audioStopTimeoutRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setPlayingProfileId(profile.id);
    onTriggerNotification?.(`🔊 Playing sample preview for ${profile.name}`);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Heavy drop-tuned metal power chord chugs (D2 / C2 / B1 / C2)
        const rootFreqs = [73.42, 65.41, 58.27, 65.41];
        const now = ctx.currentTime;

        rootFreqs.forEach((freq, idx) => {
          const startTime = now + idx * 0.42;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          const dist = ctx.createWaveShaper();

          const n_samples = 22050;
          const curve = new Float32Array(n_samples);
          const deg = Math.PI / 180;
          const k = 45;
          for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
          }
          dist.curve = curve;
          dist.oversample = '2x';

          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(freq, startTime);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(freq * 1.5, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.16, startTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);

          osc1.connect(dist);
          osc2.connect(dist);
          dist.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(startTime);
          osc2.start(startTime);
          osc1.stop(startTime + 0.4);
          osc2.stop(startTime + 0.4);
        });

        audioStopTimeoutRef.current = setTimeout(() => {
          setPlayingProfileId(null);
          if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
          }
        }, 2000);
      }
    } catch {
      audioStopTimeoutRef.current = setTimeout(() => {
        setPlayingProfileId(null);
      }, 1800);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const step = getScrollStep();

    if (direction === 'right') {
      // If at or near the end, loop smoothly back to start
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: step, behavior: 'smooth' });
      }
    } else {
      // If at start, loop smoothly to end
      if (container.scrollLeft <= 10) {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -step, behavior: 'smooth' });
      }
    }

    // Schedule scroll updates as smooth scrolling glides into place
    [60, 180, 350, 500].forEach(delay => setTimeout(checkScroll, delay));
  };

  // Mouse drag-to-scroll support for fluid desktop dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = e.pageX;
    dragScrollLeftRef.current = scrollContainerRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const delta = e.pageX - dragStartXRef.current;
    if (Math.abs(delta) > 6) {
      hasDraggedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = dragScrollLeftRef.current - delta;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 80);
    checkScroll();
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
    const currentFollowed = isProfileFollowedGlobally(profile);
    const nextState = !currentFollowed;
    saveFollowStateGlobally(profile, nextState);

    const keys = getTargetFollowKeys(profile);
    setLocalFollowedMap(prev => {
      const next = { ...prev };
      keys.forEach(k => {
        next[k] = nextState;
      });
      return next;
    });

    if (onFollowProfile) {
      onFollowProfile(profile, nextState ? 'follow' : 'unfollow');
    }
    onTriggerNotification?.(nextState ? `✨ Now following ${profile.name}!` : `💔 Unfollowed ${profile.name}`);
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

  // Helper renderer for an individual Facebook-style Card
  const renderCard = (profile: DiscoveryProfile, pIdx: number) => {
    const profileKeys = getTargetFollowKeys(profile);
    let isFollowed = false;
    let localOverride: boolean | undefined = undefined;
    for (const k of profileKeys) {
      if (localFollowedMap[k] !== undefined) {
        localOverride = localFollowedMap[k];
        break;
      }
    }
    if (localOverride !== undefined) {
      isFollowed = localOverride;
    } else {
      isFollowed = isProfileFollowedGlobally(profile);
    }

    const catKey = profile.category in CATEGORY_THEMES ? profile.category : 'fans';
    const theme = CATEGORY_THEMES[catKey] || CATEGORY_THEMES.fans;
    const RoleIcon = theme.icon;
    const isBand = profile.isBandProfile || profile.category === 'bands';

    const heroImage = resolveHeroImage(profile) || profile.image || profile.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
    const cardAvatar = resolveCardAvatar(profile) || heroImage;
    const subtitle = formatCategorySubtitle(profile);
    const realProof = getRealFollowerProof(profile, realSceneUsers, currentUserId);
    const isPlaying = playingProfileId === profile.id;

    const handleOpenCard = () => {
      if (hasDraggedRef.current) return;
      if (profile.name && profile.name.toLowerCase().includes('nexus live')) {
        onOpenProfile?.('promoter-nexus-live-official', {
          id: 'promoter-nexus-live-official',
          raw_id: 'promoter-nexus-live-official',
          name: 'Nexus Live Productions',
          brand_name: 'Nexus Live Productions',
          role: 'Promoter / Venue',
          account_type: 'promoter',
          type: 'promoter',
          portalRole: 'promoter',
          isPromoterProfile: true,
          avatar: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601',
          banner: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
          banner_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
          cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
          location: 'Chicago, IL / Texas / National Tour Booking'
        });
        return;
      }
      onOpenProfile?.(profile.raw_id || profile.band_id || profile.id, profile as any);
    };

    return (
      <motion.div
        data-discovery-card="true"
        key={`discovery-card-${pIdx}-${profile.id || ''}-${profile.raw_id || ''}-${profile.band_id || ''}-${(profile as any).handle || ''}-${profile.name || ''}`}
        layout
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="w-[280px] sm:w-[295px] min-w-[280px] sm:min-w-[295px] max-w-[295px] h-[450px] bg-[#18191a] hover:bg-[#1f2022] border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl flex flex-col justify-between relative group/card transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden shrink-0"
        style={{ scrollSnapAlign: 'start' }}
      >
        {/* Top Hero Poster (h-[270px]) */}
        <div 
          className="relative w-full h-[270px] overflow-hidden bg-zinc-950 cursor-pointer"
          onClick={handleOpenCard}
        >
          <img 
            src={heroImage} 
            alt={profile.name}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback to heavy metal dark textured placeholder
              e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Dismiss (✕) Button in Top-Right corner matching Facebook screenshot */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss(profile.id);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all z-20 cursor-pointer shadow-md border border-white/10 active:scale-95"
            title="Dismiss from suggestions"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Top-Left Category & Band Status Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-20 pointer-events-none">
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-md bg-black/75 border flex items-center gap-1 shadow-sm"
              style={{ borderColor: `${theme.accentHex}77`, color: theme.accentHex }}
            >
              <RoleIcon className="w-3 h-3" />
              <span>{theme.label}</span>
            </span>

            {isBand && (
              <span 
                className={`text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-sm backdrop-blur-md ${getBandStatusBadgeClass(resolveBandStatus(profile))}`}
              >
                {getBandStatusLabel(resolveBandStatus(profile))}
              </span>
            )}
          </div>

          {/* Quick Audio Riff Preview Button with Soundwave Feedback */}
          <button
            type="button"
            onClick={(e) => handleToggleAudioPreview(profile, e)}
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all z-20 cursor-pointer shadow-lg border active:scale-95 ${
              isPlaying
                ? 'bg-emerald-500 text-black border-emerald-400 ring-2 ring-emerald-500/50'
                : 'bg-black/70 hover:bg-black/90 text-emerald-400 hover:text-emerald-300 border-emerald-500/30'
            }`}
            title={isPlaying ? "Stop sample preview" : "Play audio sample riff"}
          >
            {isPlaying ? (
              <span className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-3 bg-black animate-pulse" />
                <span className="w-0.5 h-2 bg-black animate-pulse delay-75" />
                <span className="w-0.5 h-3 bg-black animate-pulse delay-150" />
              </span>
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Bottom Artwork Gradient Shade transitioning into card body */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#18191a] via-[#18191a]/50 to-transparent pointer-events-none" />
        </div>

        {/* Card Content Body */}
        <div className="p-3.5 pt-2 flex flex-col flex-1 justify-between bg-[#18191a]">
          {/* Upper Text: Title, Subtitle, and Social Proof */}
          <div>
            {/* Title */}
            <div 
              className="flex items-center gap-1.5 cursor-pointer"
              onClick={handleOpenCard}
            >
              <h4 
                className="font-bold text-[16px] sm:text-[17px] text-white tracking-tight hover:underline truncate leading-snug flex-1"
                title={profile.name}
              >
                {profile.name}
              </h4>
              {isBand && (profile.is_verified || profile.verification_status === 'verified_official') && (
                <span title="Verified Artist" className="inline-flex items-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </span>
              )}
            </div>

            {/* Subtitle matching Facebook "Musician/band" */}
            <p 
              className="text-[12.5px] sm:text-[13px] text-zinc-400 truncate mt-0.5 font-normal leading-tight"
              title={subtitle}
            >
              {subtitle}
            </p>

            {/* Social Proof Line with Overlapping Real Member Avatars */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-1.5 shrink-0">
                {realProof.users.map((u, uIdx) => (
                  u.avatar ? (
                    <img 
                      key={`rf-${profile.id}-${u.id}-${uIdx}`}
                      src={u.avatar} 
                      alt={u.name}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-[#18191a]" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      key={`rf-init-${profile.id}-${u.id}-${uIdx}`}
                      className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-[8.5px] font-bold text-zinc-200 ring-1 ring-[#18191a]"
                      title={u.name}
                    >
                      {u.name.slice(0, 1).toUpperCase()}
                    </div>
                  )
                ))}
              </div>
              <span className="text-[12px] text-zinc-300 font-normal truncate" title={realProof.text}>
                {realProof.text}
              </span>
            </div>
          </div>

          {/* Action Buttons Row matching Facebook Side-by-Side: Follow + Preview */}
          <div className="flex items-center gap-2 mt-3 pt-1 border-t border-zinc-800/60">
            {/* Primary Follow Button (Facebook Blue style / Followed style) */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFollow(profile);
              }}
              className={`flex-1 h-9 rounded-lg font-semibold text-[13.5px] sm:text-[14px] transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                isFollowed
                  ? 'bg-zinc-800/90 hover:bg-zinc-750 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#1877f2] hover:bg-[#166fe5] text-white'
              }`}
            >
              {isFollowed ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Follow</span>
                </>
              )}
            </motion.button>

            {/* Secondary Preview Button */}
            <button
              type="button"
              onClick={handleOpenCard}
              className="px-4 h-9 rounded-lg font-semibold text-[13px] sm:text-[13.5px] bg-[#3a3b3c] hover:bg-[#4e4f50] text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-96"
            >
              <span>Preview</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <div 
        id="discovery-zone-section"
        className="bg-gradient-to-b from-[#0f1118] via-[#0b0d13] to-[#07090e] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 my-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl group/discovery transition-all duration-300"
      >
        {/* Top Ambient Glow Highlight */}
        <div className="absolute -top-12 left-1/4 w-96 h-28 bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 mb-3.5 relative z-10">
          {/* Title */}
          <div className="flex items-center gap-2.5">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-950/40 to-zinc-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] shrink-0"
            >
              <Compass className="w-4.5 h-4.5" />
            </motion.div>
            <h3 className="text-[17px] sm:text-[18px] font-extrabold text-zinc-100 tracking-tight font-sans">
              Suggested Pages for you
            </h3>
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-3 mb-2">
          {categoryTabs.map((cat, catIdx) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={`discovery-tab-${cat.id}-${catIdx}`}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-zinc-800 text-white border font-extrabold shadow-sm'
                    : 'bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                }`}
                style={isSelected ? { borderColor: `${cat.color}88`, color: cat.color } : {}}
              >
                <span>{cat.label}</span>
                {cat.count > 0 && (
                  <span 
                    className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-mono ${
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

        {/* Horizontal Carousel Container for Large Cards */}
        <div 
          ref={scrollContainerRef}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { 
            isHoveredRef.current = false; 
            handleMouseUpOrLeave();
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onTouchStart={() => { 
            isHoveredRef.current = true; 
            isDraggingRef.current = true;
          }}
          onTouchEnd={() => { 
            isHoveredRef.current = false; 
            isDraggingRef.current = false;
            setTimeout(checkScroll, 200);
          }}
          className="flex gap-4 overflow-x-auto scrollbar-none py-2 px-1 select-none items-stretch min-h-[460px] cursor-grab active:cursor-grabbing"
          style={{ scrollSnapType: 'x proximity' }}
        >
          {isLoading && filteredProfiles.length === 0 ? (
            // Loading Skeletons
            <div className="flex gap-4 w-full py-2">
              {[1, 2, 3].map((n) => (
                <div 
                  key={`skel-${n}`} 
                  className="w-[280px] sm:w-[295px] min-w-[280px] h-[450px] bg-zinc-900/50 border border-zinc-800/60 rounded-2xl overflow-hidden animate-pulse flex flex-col justify-between"
                >
                  <div className="w-full h-[270px] bg-zinc-800/80" />
                  <div className="p-4 space-y-3">
                    <div className="w-40 h-4 bg-zinc-800 rounded" />
                    <div className="w-28 h-3 bg-zinc-800/60 rounded" />
                    <div className="w-48 h-3 bg-zinc-800/40 rounded" />
                    <div className="flex gap-2 pt-2">
                      <div className="flex-1 h-9 bg-zinc-800 rounded-lg" />
                      <div className="w-20 h-9 bg-zinc-800 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            // Empty Notification
            <div className="w-full py-12 flex flex-col items-center justify-center text-center bg-zinc-950/40 border border-dashed border-zinc-800/80 rounded-2xl px-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-200">
                No {selectedCategory === 'all' ? 'profiles' : selectedCategory} found in database
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Profiles created in Supabase will automatically sync live right here.
              </p>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  View All Categories
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredProfiles.map((profile, pIdx) => renderCard(profile, pIdx))}
            </AnimatePresence>
          )}
        </div>

        {/* Facebook-style Bottom "See all >" Action */}
        <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setShowSeeAllModal(true)}
            className="text-[13.5px] sm:text-[14px] font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 py-1.5 px-4 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-all group/seeall"
          >
            <span>See all</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover/seeall:text-white group-hover/seeall:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* "See all" Modal Dialog */}
      <AnimatePresence>
        {showSeeAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-5xl max-h-[90vh] bg-[#12141c] border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <span>All Suggested Pages & Scene Profiles</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Browse all verified bands, labels, venues, creatives & scene members
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSeeAllModal(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Filters & Search Bar */}
              <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col sm:flex-row items-center gap-3 justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={seeAllSearchQuery}
                    onChange={(e) => setSeeAllSearchQuery(e.target.value)}
                    placeholder="Search by name, genre, city..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  {seeAllSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSeeAllSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
                  {categoryTabs.map((cat) => (
                    <button
                      key={`seeall-cat-${cat.id}`}
                      type="button"
                      onClick={() => setSeeAllCategory(cat.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        seeAllCategory === cat.id
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Grid of Cards */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
                {(() => {
                  let list = allRealProfiles;
                  if (seeAllCategory !== 'all') {
                    if (seeAllCategory === 'bands') {
                      list = list.filter(p => p.category === 'bands' || p.isBandProfile || p.isRealBand);
                    } else if (seeAllCategory === 'venues') {
                      list = list.filter(p => p.category === 'venues' || (p.role || '').toLowerCase().includes('venue') || (p.role || '').toLowerCase().includes('promoter'));
                    } else if (seeAllCategory === 'creatives') {
                      list = list.filter(p => p.category === 'creatives' || (p.role || '').toLowerCase().includes('creative'));
                    } else if (seeAllCategory === 'labels') {
                      list = list.filter(p => p.category === 'labels' || (p.role || '').toLowerCase().includes('label'));
                    } else if (seeAllCategory === 'fans') {
                      list = list.filter(p => p.category === 'fans' || (p.role || '').toLowerCase().includes('fan') || (p.role || '').toLowerCase().includes('member'));
                    }
                  }

                  if (seeAllSearchQuery.trim()) {
                    const q = seeAllSearchQuery.toLowerCase().trim();
                    list = list.filter(p => 
                      p.name.toLowerCase().includes(q) ||
                      (p.genre && p.genre.toLowerCase().includes(q)) ||
                      (p.location && p.location.toLowerCase().includes(q)) ||
                      (p.desc && p.desc.toLowerCase().includes(q))
                    );
                  }

                  if (list.length === 0) {
                    return (
                      <div className="py-16 text-center text-zinc-400">
                        <p className="text-sm">No profiles found matching your query.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
                      {list.map((profile, idx) => renderCard(profile, idx))}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

