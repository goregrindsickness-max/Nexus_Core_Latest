import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  User,
  Settings,
  Search,
  Filter,
  X,
  Lock,
  ChevronDown,
  Home,
  ShoppingBag,
  Users,
  Camera,
  Video,
  MessageSquare,
  Plus,
  Sparkles,
  Check
} from 'lucide-react';
import { BAND_PORTAL_BILLING } from '../../../config/billingMatrix';
import { hasRegisteredWorkspace, normalizeRegisteredWorkspaces } from '../../../types';
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
  resolveEffectiveAvatar,
  resolveEffectiveCover,
  resolvePromoterName,
  resolvePromoterHandle,
  resolvePromoterLogo
} from '../../../utils/bandProfileUtils';
import { BandWorkspaceNavBanner } from './BandWorkspaceNavBanner';
import { PromoterWorkspaceNavBanner } from './PromoterWorkspaceNavBanner';
import { isMiguelNameOrProfile } from '../utils/profileUtils';
import { handleImageErrorWithCache, getCachedProfileImage } from '../../../services/profileImageCacheService';
import {
  NetworkEntity,
  ENTITY_CATEGORY_META,
  getLocalNetworkEntities,
  getUserManagedEntities,
  openTaggedBandOrEntityProfile,
  syncNetworkEntitiesFromSupabase,
} from '../../../services/networkEntitiesService';
import {
  FOLLOW_EVENT_NAME,
  getTargetFollowKeys,
  isProfileFollowedGlobally,
  saveFollowStateGlobally,
} from '../../../utils/followSyncService';
import { CreateEntityModal } from '../modals/CreateEntityModal';
import { FestivalLineupEditorModal } from '../modals/FestivalLineupEditorModal';
import { getSupabase } from '../../../lib/supabaseClient';
import {
  SwipableWorkspaceEntityCard,
  buildWorkspaceEntityItems,
} from './SwipableWorkspaceEntityCard';

const CURATED_SCENE_DISCOVERY: any[] = [];
const DISCOVER_PAGE_SIZE = 20;

const HeaderAvatarImage: React.FC<{
  src?: string | null;
  alt?: string;
  initials: string;
  className?: string;
  initialsClassName?: string;
}> = ({ src, alt = '', initials, className = 'w-full h-full object-cover', initialsClassName = 'font-bold text-xs text-zinc-300' }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (src && !hasError) {
    return (
      <img
        referrerPolicy="no-referrer"
        src={src}
        alt={alt}
        className={className}
        onError={(e) => {
          handleImageErrorWithCache(e, src, undefined)
            .then(() => {
              if (e.currentTarget.style.display === 'none') {
                setHasError(true);
              }
            })
            .catch(() => setHasError(true));
        }}
      />
    );
  }
  return <span className={initialsClassName}>{initials}</span>;
};

export interface FeedTopHeaderProps {
  isEmbedded?: boolean;
  onBack?: () => void;
  adminClickCount: number;
  setAdminClickCount: React.Dispatch<React.SetStateAction<number>>;
  setShowAdminPINModal: (val: boolean) => void;
  adminPINRef: React.MutableRefObject<any>;
  setIsCartOpen: (val: boolean) => void;
  cartItems: any[];
  profileFullLegalName: string;
  profileAvatarUrl?: string | null;
  profileCoverUrl?: string | null;
  roleMenuOpen: boolean;
  setRoleMenuOpen: (val: boolean) => void;
  portalRole: string;
  setPortalRole?: (val: string) => void;
  switchRole?: (val: string) => void;
  userProfile?: any;
  setUserProfile?: (val: any) => void;
  activeBand?: any;
  bands?: any[];
  activeBandId?: string;
  setActiveBandId?: (id: string) => void;
  getRoleBorderAndGlowClass: (role: string) => string;
  unreadNotifsCount: number;
  setRightDrawerOpen: (val: boolean) => void;
  setLeftDrawerOpen: (val: boolean) => void;
  activeTab: string;
  setActiveTab: (val: any) => void;
  showSceneRadio: boolean;
  setShowSceneRadio: React.Dispatch<React.SetStateAction<boolean>>;
  globalSearchQuery: string;
  setGlobalSearchQuery: (val: string) => void;
  searchResults?: any[];
  allProfiles: any[];
  discoverProfiles: any[];
  handleGlobalSearchFollowToggle: (id: string, name?: string) => void;
  getSupabase: () => any;
  triggerNotification?: (msg: string) => void;
  onLogout?: () => void;
  onNavigateToTab?: (tab: string, subNav?: string) => void;
  setDashboardV2ActiveNav?: (nav: any) => void;
  dashboardV2ActiveNav?: string;
  activeFeedCategoryFilter?: string;
  setActiveFeedCategoryFilter?: (category: string) => void;
}

export const FeedTopHeader: React.FC<FeedTopHeaderProps> = ({
  isEmbedded,
  onBack,
  adminClickCount,
  setAdminClickCount,
  setShowAdminPINModal,
  adminPINRef,
  setIsCartOpen,
  cartItems,
  profileFullLegalName,
  profileAvatarUrl,
  profileCoverUrl,
  roleMenuOpen,
  setRoleMenuOpen,
  portalRole,
  setPortalRole,
  switchRole,
  userProfile,
  setUserProfile,
  activeBand,
  bands = [],
  activeBandId,
  setActiveBandId,
  getRoleBorderAndGlowClass,
  unreadNotifsCount,
  setRightDrawerOpen,
  setLeftDrawerOpen,
  activeTab,
  setActiveTab,
  showSceneRadio,
  setShowSceneRadio,
  globalSearchQuery,
  setGlobalSearchQuery,
  searchResults = [],
  allProfiles,
  discoverProfiles,
  handleGlobalSearchFollowToggle,
  getSupabase,
  triggerNotification,
  onLogout,
  onNavigateToTab,
  setDashboardV2ActiveNav,
  dashboardV2ActiveNav,
  activeFeedCategoryFilter = 'all',
  setActiveFeedCategoryFilter
}) => {
  const handleLogout = async () => {
    setRoleMenuOpen(false);
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      const supabase = getSupabase?.();
      if (supabase?.auth) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error(err);
    }
    window.location.reload();
  };

  React.useEffect(() => {
    if (userProfile?.id && getSupabase) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          supabase.from('profiles').select('console_handle, registered_workspaces').eq('id', userProfile.id).maybeSingle().then(({ data }: any) => {
            if (data?.console_handle || data?.registered_workspaces) {
              const freshHandle = data.console_handle || userProfile.console_handle;
              const freshWorkspaces = data.registered_workspaces || userProfile.registered_workspaces;
              if (freshHandle !== userProfile.console_handle || JSON.stringify(freshWorkspaces) !== JSON.stringify(userProfile.registered_workspaces)) {
                const updated = { ...userProfile, console_handle: freshHandle, registered_workspaces: freshWorkspaces };
                if (setUserProfile) setUserProfile(updated);
                localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
              }
            }
          });
        }
      } catch (e) {
        console.error('Failed to fetch profile sync:', e);
      }
    }
  }, [userProfile?.id]);

  const [managedEntities, setManagedEntities] = React.useState<NetworkEntity[]>([]);
  const [allNetworkEntities, setAllNetworkEntities] = React.useState<NetworkEntity[]>([]);
  const [showCreateEntityModal, setShowCreateEntityModal] = React.useState(false);
  const [lineupEditorEntity, setLineupEditorEntity] = React.useState<NetworkEntity | null>(null);

  // Search focus & Discover the Scene state
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [discoverCategoryFilter, setDiscoverCategoryFilter] = React.useState<
    'all' | 'bands' | 'venues' | 'festivals' | 'pros'
  >('all');
  const [discoverPage, setDiscoverPage] = React.useState(0);
  const [paginatedDiscoverRows, setPaginatedDiscoverRows] = React.useState<any[]>([]);
  const [hasMoreDiscover, setHasMoreDiscover] = React.useState(false);
  const [followedState, setFollowedState] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setFollowedState({});
  }, [userProfile?.id]);

  React.useEffect(() => {
    setDiscoverPage(0);
  }, [discoverCategoryFilter]);

  React.useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      const client = getSupabase();
      if (!client) return;
      const from = discoverPage * DISCOVER_PAGE_SIZE;
      const to = from + DISCOVER_PAGE_SIZE - 1;
      const q = (globalSearchQuery || '').trim();

      try {
        let bQuery = client
          .from('bands')
          .select('id, name, band_name, category, avatar_url, logo_url, city, state, state_province, genre, homebase')
          .order('name', { ascending: true })
          .range(from, to);
        if (q) {
          bQuery = bQuery.or(`name.ilike.%${q}%,band_name.ilike.%${q}%,city.ilike.%${q}%`);
        }

        let vQuery = client
          .from('venues')
          .select('id, name, category, avatar_url, logo_url, city, state')
          .order('name', { ascending: true })
          .range(from, to);
        if (q) {
          vQuery = vQuery.or(`name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%`);
        }

        const [bRes, vRes] = await Promise.all([bQuery, vQuery]);
        if (isCancelled) return;

        const bandsBatch = ((bRes?.data as any[]) || []).map((b) => ({
          ...b,
          name: b.name || b.band_name,
          category: b.category || 'band',
          type: 'band',
          isBandProfile: true,
        }));
        const venuesBatch = ((vRes?.data as any[]) || []).map((v) => ({
          ...v,
          category: v.category || 'venue',
          type: 'venue',
        }));

        const combined = [...bandsBatch, ...venuesBatch];
        setHasMoreDiscover(
          bandsBatch.length >= DISCOVER_PAGE_SIZE || venuesBatch.length >= DISCOVER_PAGE_SIZE
        );
        setPaginatedDiscoverRows((prev) =>
          discoverPage === 0 ? combined : [...prev, ...combined]
        );
      } catch {
        // Ignore transient offline error
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [discoverPage, globalSearchQuery]);

  React.useEffect(() => {
    const handleGlobalFollowUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.keys && Array.isArray(detail.keys)) {
        setFollowedState((prev) => {
          const next = { ...prev };
          detail.keys.forEach((k: string) => {
            next[k] = Boolean(detail.isFollowed);
          });
          return next;
        });
      } else {
        setFollowedState((prev) => ({ ...prev }));
      }
    };

    window.addEventListener(FOLLOW_EVENT_NAME, handleGlobalFollowUpdate);
    window.addEventListener('storage', handleGlobalFollowUpdate);
    return () => {
      window.removeEventListener(FOLLOW_EVENT_NAME, handleGlobalFollowUpdate);
      window.removeEventListener('storage', handleGlobalFollowUpdate);
    };
  }, []);

  React.useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (
        searchContainerRef.current &&
        e.target instanceof Node &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, []);

  React.useEffect(() => {
    const refresh = () => {
      setManagedEntities(getUserManagedEntities(userProfile?.id));
      setAllNetworkEntities(getLocalNetworkEntities());
    };
    refresh();
    syncNetworkEntitiesFromSupabase().then(refresh).catch(() => {});
    window.addEventListener('nexus_entities_updated', refresh);
    return () => window.removeEventListener('nexus_entities_updated', refresh);
  }, [userProfile?.id]);

  const discoverSceneItems = React.useMemo(() => {
    type DiscoverItem = {
      id: string;
      band_id?: string;
      name: string;
      avatar?: string;
      subtitle: string;
      filterBucket: 'bands' | 'venues' | 'festivals' | 'pros';
      badgeLabel: string;
      badgeClass: string;
      rawProfile: any;
      entityObj?: NetworkEntity;
    };

    const items: DiscoverItem[] = [];
    const seenNames = new Set<string>();
    const currentUserId = userProfile?.id ? String(userProfile.id).toLowerCase() : '';

    const pushCandidate = (
      candidate: any,
      forcedEntity?: NetworkEntity
    ) => {
      if (!candidate) return;
      const name = String(
        forcedEntity?.display_name ||
          candidate.full_name ||
          candidate.name ||
          candidate.band_name ||
          candidate.business_name ||
          candidate.agency_name ||
          candidate.label_name ||
          candidate.username ||
          candidate.console_handle ||
          ''
      ).trim();

      if (!name) return;
      if (currentUserId && candidate.id && String(candidate.id).toLowerCase() === currentUserId && !forcedEntity) {
        return;
      }

      const normKey = name.toLowerCase();
      if (seenNames.has(normKey)) return;
      seenNames.add(normKey);

      const catLower = String(
        forcedEntity?.category || candidate.category || candidate.type || candidate.account_type || candidate.portalRole || candidate.role || ''
      ).toLowerCase();
      const roleLower = String(candidate.role || candidate.portalRole || '').toLowerCase();
      const accLower = String(candidate.account_type || '').toLowerCase();
      const activeWsLower = String(candidate.active_workspace || '').toLowerCase();
      const isExplicitIndustryPro =
        accLower === 'industry_pro' ||
        accLower === 'industry pro' ||
        activeWsLower === 'industry_pro' ||
        roleLower === 'industry pro' ||
        roleLower === 'industry_pro';
      const associatedBandName = String(candidate.bandName || candidate.band_name || '').trim().toLowerCase();
      const isPersonalHumanProfile =
        !forcedEntity &&
        !candidate.isBandProfile &&
        candidate.type !== 'band' &&
        Boolean(candidate.full_name) &&
        (!associatedBandName || candidate.full_name.trim().toLowerCase() !== associatedBandName);

      let filterBucket: 'bands' | 'venues' | 'festivals' | 'pros' = 'pros';
      let badgeLabel = 'PRO';
      let badgeClass = 'bg-violet-500/20 text-violet-300 border-violet-500/40';

      if (catLower === 'festival' || roleLower.includes('festival')) {
        filterBucket = 'festivals';
        badgeLabel = 'FESTIVAL';
        badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      } else if (catLower === 'venue' || roleLower.includes('venue')) {
        filterBucket = 'venues';
        badgeLabel = 'VENUE';
        badgeClass = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      } else if (
        catLower === 'label' ||
        catLower === 'label_distro' ||
        roleLower.includes('label') ||
        Boolean(candidate.label_name)
      ) {
        filterBucket = 'pros';
        badgeLabel = 'LABEL';
        badgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      } else if (
        catLower === 'promoter' ||
        catLower === 'booking_agency' ||
        roleLower.includes('promoter') ||
        Boolean(candidate.agency_name)
      ) {
        filterBucket = 'pros';
        badgeLabel = 'PROMOTER';
        badgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      } else if (catLower === 'creative' || roleLower.includes('creative') || Boolean(candidate.business_name)) {
        filterBucket = 'pros';
        badgeLabel = 'CREATIVE';
        badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      } else if (catLower === 'media_press' || roleLower.includes('press') || roleLower.includes('media')) {
        filterBucket = 'pros';
        badgeLabel = 'PRESS';
        badgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      } else if (
        !isExplicitIndustryPro &&
        !isPersonalHumanProfile &&
        (
          forcedEntity?.category === 'band' ||
          candidate.isBandProfile === true ||
          candidate.type === 'band' ||
          catLower === 'band' ||
          catLower === 'bands' ||
          catLower === 'artist_band' ||
          roleLower === 'band' ||
          roleLower === 'artist_band' ||
          (!candidate.full_name && Boolean(candidate.band_name || candidate.bandName))
        )
      ) {
        filterBucket = 'bands';
        badgeLabel = 'BAND';
        badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      } else {
        filterBucket = 'pros';
        badgeLabel = accLower === 'fan_only' || accLower === 'fan' ? 'SCENE' : 'INDUSTRY PRO';
        badgeClass =
          accLower === 'fan_only' || accLower === 'fan'
            ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
            : 'bg-violet-500/20 text-violet-300 border-violet-500/40';
      }

      const avatar =
        forcedEntity?.avatar_url ||
        candidate.avatar_url ||
        candidate.avatar ||
        candidate.logo_url ||
        candidate.band_logo ||
        candidate.creative_avatar ||
        candidate.promoter_logo ||
        candidate.label_avatar;

      const subtitle =
        forcedEntity?.location ||
        candidate.genre ||
        candidate.homebase ||
        candidate.location ||
        candidate.bio ||
        (forcedEntity ? `@${forcedEntity.slug}` : candidate.console_handle || candidate.handle || badgeLabel);

      items.push({
        id: String(forcedEntity?.id || candidate.id || `disc-${normKey}`),
        band_id: candidate.band_id ? String(candidate.band_id) : undefined,
        name,
        avatar,
        subtitle: String(subtitle),
        filterBucket,
        badgeLabel,
        badgeClass,
        rawProfile: forcedEntity || candidate,
        entityObj: forcedEntity,
      });
    };

    // 1. Network entities (festivals, labels, booking collectives, bands, venues)
    (allNetworkEntities || []).forEach((ent) => pushCandidate(ent, ent));
    // 2. Paginated Supabase bands & venues
    (paginatedDiscoverRows || []).forEach((p) => pushCandidate(p));
    // 3. Live discoverProfiles & allProfiles
    (discoverProfiles || []).forEach((p) => pushCandidate(p));
    (allProfiles || []).forEach((p) => pushCandidate(p));
    // 4. Curated underground discovery entries
    CURATED_SCENE_DISCOVERY.forEach((p) => pushCandidate(p));

    return items;
  }, [allNetworkEntities, paginatedDiscoverRows, discoverProfiles, allProfiles, userProfile?.id]);

  const filteredDiscoveryItems = React.useMemo(() => {
    if (discoverCategoryFilter === 'all') return discoverSceneItems;
    return discoverSceneItems.filter((item) => item.filterBucket === discoverCategoryFilter);
  }, [discoverSceneItems, discoverCategoryFilter]);

  const resolveItemFollowed = (item: { rawProfile: any; followed?: boolean }) => {
    const targetObj = item.rawProfile || item;
    const keys = getTargetFollowKeys(targetObj);
    for (const k of keys) {
      if (followedState[k] !== undefined) return Boolean(followedState[k]);
    }
    return Boolean(item.followed || targetObj?.followed || isProfileFollowedGlobally(targetObj));
  };

  const handleDiscoveryFollowToggle = (
    e: React.MouseEvent,
    item: { id: string; band_id?: string; name: string; rawProfile: any }
  ) => {
    e.stopPropagation();
    const targetObj = item.rawProfile || item;
    const currentFollowed = resolveItemFollowed({ rawProfile: targetObj });
    const nextFollowed = !currentFollowed;

    saveFollowStateGlobally(targetObj, nextFollowed);
    const keys = getTargetFollowKeys(targetObj);
    setFollowedState((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        next[k] = nextFollowed;
      });
      return next;
    });

    handleGlobalSearchFollowToggle(item.id || item.band_id || item.name, item.name);
  };

  return (
    <div className="relative z-30 bg-[#030303]/95 backdrop-blur-md border-b border-zinc-900/85 flex flex-col shadow-md">
      {/* Top Navbar */}
      <div className={`px-4 py-1.5 min-h-[66px] items-center justify-between relative z-40 ${isEmbedded ? 'hidden' : 'flex'}`}>
        <div className="flex items-center gap-3">
          <img
            src="https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Core%20Long%20Logo%20copy.png"
            alt="Nexus Core"
            className="h-12 sm:h-14 md:h-16 w-auto object-contain cursor-pointer transition-transform hover:scale-105 origin-left"
            onClick={() => {
              const newCount = adminClickCount + 1;
              setAdminClickCount(newCount);
              if (adminPINRef.current) clearTimeout(adminPINRef.current);
              if (newCount >= 5) {
                setShowAdminPINModal(true);
                setAdminClickCount(0);
              } else {
                adminPINRef.current = setTimeout(() => setAdminClickCount(0), 2000);
              }
            }}
          />
        </div>

        <div className="flex items-center">
          <div className="relative z-[99999]">
            <button
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              title="Switch Workspace / Profile"
              aria-expanded={roleMenuOpen}
              aria-haspopup="menu"
              className={`group px-3.5 py-1.5 rounded-full bg-zinc-900/75 hover:bg-zinc-900 border transition-all duration-200 cursor-pointer text-right active:scale-[0.98] focus:outline-none ${
                portalRole === 'fan_only'
                  ? 'border-cyan-400/35 hover:border-cyan-400/75 shadow-[0_0_12px_rgba(34,211,238,0.12)]'
                  : portalRole === 'promoter'
                  ? 'border-yellow-400/35 hover:border-yellow-400/75 shadow-[0_0_12px_rgba(234,179,8,0.14)]'
                  : (portalRole === 'band' || userProfile?.active_workspace === 'band')
                  ? 'border-[#39ff14]/40 hover:border-[#39ff14]/80 shadow-[0_0_12px_rgba(57,255,20,0.16)]'
                  : portalRole === 'label'
                  ? 'border-orange-500/40 hover:border-orange-400/80 shadow-[0_0_12px_rgba(249,115,22,0.14)]'
                  : portalRole === 'creative'
                  ? 'border-fuchsia-500/40 hover:border-fuchsia-400/80 shadow-[0_0_12px_rgba(217,70,239,0.14)]'
                  : 'border-[#9d4edf]/40 hover:border-[#9d4edf]/80 shadow-[0_0_12px_rgba(157,78,223,0.18)]'
              }`}
            >
              <div className="flex items-center justify-end gap-1.5 mb-0.5">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider leading-none ${
                  portalRole === 'fan_only'
                    ? 'text-cyan-400'
                    : portalRole === 'promoter'
                    ? 'text-yellow-400'
                    : (portalRole === 'band' || userProfile?.active_workspace === 'band')
                    ? 'text-[#39ff14]'
                    : portalRole === 'label'
                    ? 'text-orange-400'
                    : portalRole === 'creative'
                    ? 'text-fuchsia-400'
                    : 'text-[#b57cff]'
                }`}>
                  {portalRole === 'fan_only'
                    ? 'FAN ZONE'
                    : portalRole === 'band'
                    ? resolveBandName(activeBand, userProfile)?.toUpperCase() || 'ARTIST WORKSPACE'
                    : portalRole === 'creative'
                    ? resolveCreativeName(userProfile)?.toUpperCase() || 'CREATIVE PRO'
                    : portalRole === 'promoter'
                    ? (resolvePromoterName(userProfile)?.toUpperCase() || 'PROMOTER PRO')
                    : portalRole === 'label'
                    ? 'RECORD LABEL'
                    : 'INDUSTRY PRO'}
                </span>
                <span
                  aria-hidden="true"
                  className={`text-[7px] leading-none transition-transform duration-200 ${
                    roleMenuOpen ? 'rotate-180' : ''
                  } ${
                    portalRole === 'fan_only'
                      ? 'text-cyan-400/80'
                      : portalRole === 'promoter'
                      ? 'text-yellow-400/80'
                      : (portalRole === 'band' || userProfile?.active_workspace === 'band')
                      ? 'text-[#39ff14]/80'
                      : portalRole === 'label'
                      ? 'text-orange-400/80'
                      : portalRole === 'creative'
                      ? 'text-fuchsia-400/80'
                      : 'text-[#b57cff]/85'
                  }`}
                >
                  ▼
                </span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white leading-none">
                Hi {
                  portalRole === 'band'
                    ? resolveBandName(activeBand, userProfile).split(' ')[0]
                    : portalRole === 'creative'
                    ? resolveCreativeName(userProfile).split(' ')[0]
                    : portalRole === 'promoter'
                    ? resolvePromoterName(userProfile).split(' ')[0]
                    : (profileFullLegalName || userProfile?.display_name || userProfile?.username || userProfile?.name || 'User').split(' ')[0]
                },
              </p>
            </button>

            {/* Role Switcher Dropdown Menu */}
            <AnimatePresence>
              {roleMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[99990] bg-black/60 backdrop-blur-[2px]" onClick={() => setRoleMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed top-16 right-4 sm:right-6 w-[310px] max-h-[85vh] overflow-y-auto bg-[#0d0d0f] border border-zinc-800/90 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.95)] p-3 z-[99999] text-left"
                  >
                    {/* Header */}
                    {(() => {
                      const activeKey = portalRole || userProfile?.active_workspace || 'industry_pro';
                      const activeAvatar = resolveEffectiveAvatar(activeKey, activeBand, userProfile, profileAvatarUrl);
                      const isBand = activeKey === 'band';
                      const isCreative = activeKey === 'creative';
                      const isPromoter = activeKey === 'promoter';
                      const isOwnerMiguel = isMiguelNameOrProfile(userProfile);
                      const rawHandle = isBand 
                        ? resolveBandHandle(activeBand, userProfile)
                        : isCreative
                        ? resolveCreativeHandle(userProfile)
                        : isPromoter
                        ? resolvePromoterHandle(userProfile)
                        : (userProfile?.console_handle || userProfile?.username || userProfile?.handle || userProfile?.display_name?.replace(/\s+/g, '_') || profileFullLegalName?.replace(/\s+/g, '_') || (userProfile?.email ? userProfile.email.split('@')[0] : (isOwnerMiguel ? 'bdmCEO' : 'member')));
                      const fallbackH = isOwnerMiguel ? '@bdmCEO' : (userProfile?.name && !userProfile.name.toLowerCase().includes('miguel') ? `@${userProfile.name.replace(/\s+/g, '_').toLowerCase()}` : (userProfile?.email ? `@${userProfile.email.split('@')[0]}` : '@member'));
                      const userHandle = (isBand || isCreative || isPromoter)
                        ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`)
                        : ((!rawHandle || (isOwnerMiguel && rawHandle.toLowerCase().includes('virulent')) || rawHandle === 'user' || rawHandle === '@user' || (!isOwnerMiguel && (rawHandle.toLowerCase().includes('bdmceo') || rawHandle.toLowerCase().includes('goregrinder')))) ? fallbackH : (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`));
                      const displayName = isBand 
                        ? resolveBandName(activeBand, userProfile) 
                        : isCreative
                        ? resolveCreativeName(userProfile)
                        : isPromoter
                        ? resolvePromoterName(userProfile)
                        : (profileFullLegalName || userProfile?.name || 'User Name');
                      const initials = (displayName || 'U').slice(0, 2).toUpperCase();
                      return (
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-900/80">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full border-2 border-[#6601BB] p-0.5 shadow-[0_0_10px_rgba(102,1,187,0.5)] shrink-0 flex items-center justify-center overflow-hidden bg-zinc-900">
                              <HeaderAvatarImage 
                                src={activeAvatar} 
                                initials={initials} 
                                className="w-full h-full object-cover rounded-full" 
                                initialsClassName="font-bold text-[10px] text-zinc-300" 
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-white tracking-tight truncate">{userHandle}</div>
                              <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider truncate">{displayName}</div>
                            </div>
                          </div>
                          <button onClick={() => setRoleMenuOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })()}

                    <div className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1 px-1">
                      SWITCH ACTIVE PORTAL
                    </div>

                    <div className="space-y-1 mb-2">
                      {(() => {
                        const isIndustryProAccount =
                          userProfile?.account_type === 'industry_pro' ||
                          userProfile?.account_type === 'industry pro' ||
                          ['band', 'promoter', 'creative', 'label', 'industry_pro'].includes(portalRole) ||
                          ['band', 'promoter', 'creative', 'label'].includes(userProfile?.account_type) ||
                          ['band', 'promoter', 'creative', 'label'].some((w) => hasRegisteredWorkspace(userProfile, w));
                        const isFanAccountMode =
                          portalRole === 'fan_only' ||
                          (!isIndustryProAccount &&
                            (userProfile?.account_type === 'fan' || userProfile?.account_type === 'fan_only'));

                        if (isFanAccountMode) {
                          return (
                            <>
                              {/* Active Fan / Supporter Environment */}
                              <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#153444] border border-cyan-500 text-white shadow-md">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm">💙</span>
                                  <div className="text-left min-w-0">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                                      FAN / SUPPORTER
                                    </div>
                                    <div className="text-[9px] font-mono leading-none mt-0.5 text-cyan-300">
                                      Active Environment
                                    </div>
                                  </div>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
                              </div>

                              {/* Upgrade to Industry Pro CTA Card */}
                              <button
                                type="button"
                                onClick={async () => {
                                  if (setPortalRole) setPortalRole('industry_pro');
                                  const updatedProfile = {
                                    ...userProfile,
                                    active_workspace: 'industry_pro',
                                    account_type: 'industry pro',
                                    role: 'Industry Pro',
                                  };
                                  if (setUserProfile) setUserProfile(updatedProfile);
                                  if (typeof window !== 'undefined') {
                                    localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));
                                    window.dispatchEvent(
                                      new CustomEvent('nexus_core_user_profile_updated', { detail: updatedProfile })
                                    );
                                  }
                                  triggerNotification?.(
                                    '⚡ Upgraded to Industry Pro! Select a workspace below to register.'
                                  );
                                  const supabase = getSupabase?.();
                                  if (supabase && userProfile?.id) {
                                    await supabase
                                      .from('profiles')
                                      .update({ active_workspace: 'industry_pro', account_type: 'industry pro' })
                                      .eq('id', userProfile.id);
                                  }
                                }}
                                className="w-full mt-1.5 p-3 rounded-xl bg-gradient-to-br from-[#291244] via-[#1a0b2e] to-[#0d282a] hover:from-[#36185a] hover:via-[#230f3d] hover:to-[#113638] border border-[#9d4edf]/60 hover:border-teal-400/80 shadow-[0_0_20px_rgba(157,78,223,0.28)] transition-all duration-200 cursor-pointer text-left group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-[#6601BB]/40 border border-[#a268ff]/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(162,104,255,0.35)]">
                                      <Sparkles className="w-4 h-4 text-teal-300 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-teal-300 transition-colors">
                                        Upgrade to Industry Pro
                                      </div>
                                      <div className="text-[9.5px] text-zinc-300/90 leading-snug mt-0.5">
                                        Unlock Band, Promoter, Venue, Creative &amp; Label workspaces
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0 group-hover:bg-teal-400/30 transition-colors">
                                    <ArrowRight className="w-3.5 h-3.5 text-teal-300 group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                </div>
                              </button>
                            </>
                          );
                        }

                        return (
                          <>
                            {/* INDUSTRY PRO */}
                            {(() => {
                              const isIndustry =
                                portalRole !== 'fan_only' &&
                                portalRole !== 'band' &&
                                portalRole !== 'creative' &&
                                portalRole !== 'promoter' &&
                                portalRole !== 'label';
                              return (
                                <button
                                  onClick={async () => {
                                    setRoleMenuOpen(false);
                                    if (setPortalRole) setPortalRole('industry_pro');
                                    if (switchRole) switchRole('industry_pro');
                                    const updatedProfile = {
                                      ...userProfile,
                                      active_workspace: 'industry_pro',
                                      account_type: 'industry pro',
                                    };
                                    if (setUserProfile) setUserProfile(updatedProfile);
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));
                                      window.dispatchEvent(
                                        new CustomEvent('nexus_core_user_profile_updated', { detail: updatedProfile })
                                      );
                                      window.dispatchEvent(
                                        new CustomEvent('nexus_navigate_tab', { detail: 'social' })
                                      );
                                    }
                                    const supabase = getSupabase?.();
                                    if (supabase && userProfile?.id) {
                                      await supabase
                                        .from('profiles')
                                        .update({ active_workspace: 'industry_pro', account_type: 'industry pro' })
                                        .eq('id', userProfile.id);
                                    }
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                                    isIndustry
                                      ? 'bg-[#291244] border border-[#6601BB] text-white shadow-md'
                                      : 'hover:bg-zinc-900/80 text-zinc-400 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm">🎟️</span>
                                    <div className="text-left min-w-0">
                                      <div
                                        className={`text-[11px] font-bold uppercase tracking-wider ${
                                          isIndustry ? 'text-[#a268ff]' : 'text-zinc-300'
                                        }`}
                                      >
                                        INDUSTRY PRO
                                      </div>
                                      <div
                                        className={`text-[9px] font-mono leading-none mt-0.5 ${
                                          isIndustry ? 'text-zinc-300' : 'text-zinc-500'
                                        }`}
                                      >
                                        {isIndustry ? 'Active Environment' : 'Switch Workspace'}
                                      </div>
                                    </div>
                                  </div>
                                  {isIndustry && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#a268ff] shadow-[0_0_8px_rgba(162,104,255,0.8)] shrink-0" />
                                  )}
                                </button>
                              );
                            })()}

                            {/* FAN ONLY (Locked for Industry Pro) */}
                            {(() => {
                              const isActive = portalRole === 'fan_only';
                              const isLocked = true;
                              return (
                                <button
                                  disabled={isLocked && !isActive}
                                  onClick={() => {
                                    triggerNotification?.('⚡ Downgrade not possible for Industry Pro accounts.');
                                  }}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all opacity-40 cursor-not-allowed bg-zinc-950/20 border border-zinc-900/40 text-zinc-650 select-none"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm grayscale opacity-50">💙</span>
                                    <div className="text-left min-w-0">
                                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                        FAN ONLY
                                      </div>
                                      <div className="text-[9px] font-mono leading-none mt-0.5 text-zinc-600">
                                        downgrade not possible
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-[8px] font-bold text-zinc-700 tracking-widest uppercase shrink-0">
                                    LOCKED
                                  </div>
                                </button>
                              );
                            })()}

                            {/* BAND / ARTIST */}
                            {(() => {
                              const bandAllowed = hasRegisteredWorkspace(userProfile, 'band');
                              const isActive = portalRole === 'band';
                              if (bandAllowed) {
                                const bandEntities = buildWorkspaceEntityItems('band', {
                                  userProfile,
                                  activeBand,
                                  bands,
                                  managedEntities,
                                });
                                return (
                                  <SwipableWorkspaceEntityCard
                                    workspaceType="band"
                                    entities={bandEntities}
                                    activeEntityId={activeBandId || activeBand?.id || userProfile?.band_id}
                                    isWorkspaceActive={isActive}
                                    onSelectEntity={async (selectedEntity) => {
                                      setRoleMenuOpen(false);
                                      if (setActiveBandId && selectedEntity.id) {
                                        setActiveBandId(selectedEntity.id);
                                      }
                                      if (setPortalRole) setPortalRole('band');
                                      if (switchRole) switchRole('band');
                                      const updatedProfile = {
                                        ...userProfile,
                                        active_workspace: 'band',
                                        account_type: 'industry pro',
                                        band_id: selectedEntity.id || userProfile?.band_id,
                                        band_name: selectedEntity.name || userProfile?.band_name,
                                        band_handle: selectedEntity.handle || userProfile?.band_handle,
                                        band_logo: selectedEntity.logoUrl || userProfile?.band_logo,
                                      };
                                      if (setUserProfile) setUserProfile(updatedProfile);
                                      if (typeof window !== 'undefined') {
                                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));
                                        window.dispatchEvent(
                                          new CustomEvent('nexus_core_user_profile_updated', { detail: updatedProfile })
                                        );
                                        window.dispatchEvent(new CustomEvent('nexus_navigate', { detail: 'home-v2' }));
                                        window.dispatchEvent(
                                          new CustomEvent('nexus_navigate_tab', { detail: 'home-v2' })
                                        );
                                      }
                                      const supabase = getSupabase?.();
                                      if (supabase && userProfile?.id) {
                                        await supabase
                                          .from('profiles')
                                          .update({ active_workspace: 'band', account_type: 'industry pro' })
                                          .eq('id', userProfile.id);
                                      }
                                    }}
                                  />
                                );
                              }
                              return (
                                <button
                                  onClick={async () => {
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('nexus_target_register_workspace', 'BAND');
                                    }
                                    window.dispatchEvent(
                                      new CustomEvent('nexus_target_register_workspace', {
                                        detail: { target: 'band' },
                                      })
                                    );
                                    setRoleMenuOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm opacity-80">🎸</span>
                                    <div className="text-left min-w-0">
                                      <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-300">
                                        BAND / ARTIST <Lock className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                                      </div>
                                      <div className="text-[9px] font-mono leading-none mt-0.5 text-amber-400/80 font-semibold">
                                        LOCKED • Tap to Register
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0">
                                    <Lock className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                                  </div>
                                </button>
                              );
                            })()}

                            {/* VENUE PROMOTER */}
                            {(() => {
                              const promoterAllowed = hasRegisteredWorkspace(userProfile, 'promoter');
                              const isActive = portalRole === 'promoter';
                              if (promoterAllowed) {
                                const promoterEntities = buildWorkspaceEntityItems('promoter', {
                                  userProfile,
                                  activeBand,
                                  bands,
                                  managedEntities,
                                });
                                return (
                                  <SwipableWorkspaceEntityCard
                                    workspaceType="promoter"
                                    entities={promoterEntities}
                                    activeEntityId={(userProfile as any)?.promoter_id}
                                    isWorkspaceActive={isActive}
                                    onSelectEntity={async (selectedEntity) => {
                                      setRoleMenuOpen(false);
                                      if (setPortalRole) setPortalRole('promoter');
                                      if (switchRole) switchRole('promoter');
                                      const updatedProfile = {
                                        ...userProfile,
                                        active_workspace: 'promoter',
                                        account_type: 'industry pro',
                                        promoter_agency: selectedEntity.name || (userProfile as any)?.promoter_agency,
                                        promoter_handle: selectedEntity.handle || (userProfile as any)?.promoter_handle,
                                        promoter_logo: selectedEntity.logoUrl || (userProfile as any)?.promoter_logo,
                                      };
                                      if (setUserProfile) setUserProfile(updatedProfile);
                                      if (typeof window !== 'undefined') {
                                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));
                                        window.dispatchEvent(
                                          new CustomEvent('nexus_core_user_profile_updated', { detail: updatedProfile })
                                        );
                                      }
                                      const supabase = getSupabase?.();
                                      if (supabase && userProfile?.id) {
                                        await supabase
                                          .from('profiles')
                                          .update({ active_workspace: 'promoter', account_type: 'industry pro' })
                                          .eq('id', userProfile.id);
                                      }
                                    }}
                                  />
                                );
                              }
                              return (
                                <button
                                  onClick={async () => {
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('nexus_target_register_workspace', 'PROMOTER');
                                    }
                                    window.dispatchEvent(
                                      new CustomEvent('nexus_target_register_workspace', {
                                        detail: { target: 'promoter' },
                                      })
                                    );
                                    setRoleMenuOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm opacity-80">🏟️</span>
                                    <div className="text-left min-w-0">
                                      <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-300">
                                        VENUE PROMOTER <Lock className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                                      </div>
                                      <div className="text-[9px] font-mono leading-none mt-0.5 text-amber-400/80 font-semibold">
                                        LOCKED • Tap to Register
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0">
                                    <Lock className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                                  </div>
                                </button>
                              );
                            })()}

                            {/* CREATIVE HUB */}
                            {(() => {
                              const creativeAllowed = hasRegisteredWorkspace(userProfile, 'creative');
                              const isActive = portalRole === 'creative';
                              if (creativeAllowed) {
                                const creativeEntities = buildWorkspaceEntityItems('creative', {
                                  userProfile,
                                  activeBand,
                                  bands,
                                  managedEntities,
                                });
                                return (
                                  <SwipableWorkspaceEntityCard
                                    workspaceType="creative"
                                    entities={creativeEntities}
                                    activeEntityId={(userProfile as any)?.creative_id}
                                    isWorkspaceActive={isActive}
                                    onSelectEntity={async (selectedEntity) => {
                                      setRoleMenuOpen(false);
                                      if (setPortalRole) setPortalRole('creative');
                                      if (switchRole) switchRole('creative');
                                      const registered = normalizeRegisteredWorkspaces(
                                        userProfile?.registered_workspaces,
                                        ['creative']
                                      );
                                      const updatedProfile = {
                                        ...userProfile,
                                        active_workspace: 'creative',
                                        account_type: 'creative',
                                        registered_workspaces: registered,
                                        creative_name: selectedEntity.name || (userProfile as any)?.creative_name,
                                        creative_handle: selectedEntity.handle || (userProfile as any)?.creative_handle,
                                        creative_logo: selectedEntity.logoUrl || (userProfile as any)?.creative_logo,
                                      };
                                      if (setUserProfile) setUserProfile(updatedProfile);
                                      if (setActiveTab) setActiveTab('creative');
                                      if (typeof window !== 'undefined') {
                                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));
                                        window.dispatchEvent(
                                          new CustomEvent('nexus_core_user_profile_updated', { detail: updatedProfile })
                                        );
                                      }
                                      const supabase = getSupabase?.();
                                      if (supabase && userProfile?.id) {
                                        await supabase
                                          .from('profiles')
                                          .update({ active_workspace: 'creative', account_type: 'creative' })
                                          .eq('id', userProfile.id);
                                      }
                                    }}
                                  />
                                );
                              }
                              return (
                                <button
                                  onClick={async () => {
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('nexus_target_register_workspace', 'CREATIVE');
                                    }
                                    window.dispatchEvent(
                                      new CustomEvent('nexus_target_register_workspace', {
                                        detail: { target: 'creative' },
                                      })
                                    );
                                    setRoleMenuOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm opacity-80">🛠️</span>
                                    <div className="text-left min-w-0">
                                      <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-300">
                                        CREATIVE HUB <Lock className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                                      </div>
                                      <div className="text-[9px] font-mono leading-none mt-0.5 text-amber-400/80 font-semibold">
                                        LOCKED • Tap to Register
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0">
                                    <Lock className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                                  </div>
                                </button>
                              );
                            })()}

                            {/* RECORD LABEL */}
                            {(() => {
                              const labelAllowed = hasRegisteredWorkspace(userProfile, 'label');
                              const isActive = portalRole === 'label';
                              if (labelAllowed) {
                                const labelEntities = buildWorkspaceEntityItems('label', {
                                  userProfile,
                                  activeBand,
                                  bands,
                                  managedEntities,
                                });
                                return (
                                  <SwipableWorkspaceEntityCard
                                    workspaceType="label"
                                    entities={labelEntities}
                                    activeEntityId={(userProfile as any)?.label_id}
                                    isWorkspaceActive={isActive}
                                    onSelectEntity={async (selectedEntity) => {
                                      setRoleMenuOpen(false);
                                      if (setPortalRole) setPortalRole('label');
                                      if (switchRole) switchRole('label');
                                      const updatedProfile = {
                                        ...userProfile,
                                        active_workspace: 'label',
                                        account_type: 'industry pro',
                                        label_name: selectedEntity.name || (userProfile as any)?.label_name,
                                        label_handle: selectedEntity.handle || (userProfile as any)?.label_handle,
                                        label_avatar: selectedEntity.logoUrl || (userProfile as any)?.label_avatar,
                                      };
                                      if (setUserProfile) setUserProfile(updatedProfile);
                                      if (typeof window !== 'undefined') {
                                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));
                                        window.dispatchEvent(
                                          new CustomEvent('nexus_core_user_profile_updated', { detail: updatedProfile })
                                        );
                                      }
                                      const supabase = getSupabase?.();
                                      if (supabase && userProfile?.id) {
                                        await supabase
                                          .from('profiles')
                                          .update({ active_workspace: 'label', account_type: 'industry pro' })
                                          .eq('id', userProfile.id);
                                      }
                                    }}
                                  />
                                );
                              }
                              return (
                                <button
                                  onClick={async () => {
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('nexus_target_register_workspace', 'LABEL');
                                    }
                                    window.dispatchEvent(
                                      new CustomEvent('nexus_target_register_workspace', {
                                        detail: { target: 'label' },
                                      })
                                    );
                                    setRoleMenuOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm opacity-80">💿</span>
                                    <div className="text-left min-w-0">
                                      <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-300">
                                        RECORD LABEL <Lock className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                                      </div>
                                      <div className="text-[9px] font-mono leading-none mt-0.5 text-amber-400/80 font-semibold">
                                        LOCKED • Tap to Register
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0">
                                    <Lock className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                                  </div>
                                </button>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>

                    {/* Decoupled Public Pages & Festival Entities */}
                    <div className="pt-2 mb-2 border-t border-zinc-900/80 space-y-1.5">
                      <div className="text-[8px] font-mono font-bold text-amber-400 uppercase tracking-widest px-1">
                        PUBLIC PAGES & FESTIVAL ENTITIES ({managedEntities.length})
                      </div>
                      {managedEntities.length > 0 && (
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                          {managedEntities.map((ent) => {
                            const catMeta = ENTITY_CATEGORY_META[ent.category] || ENTITY_CATEGORY_META.festival;
                            return (
                              <div
                                key={ent.id}
                                className="w-full flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800/80 transition-all"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRoleMenuOpen(false);
                                    openTaggedBandOrEntityProfile(ent, triggerNotification);
                                  }}
                                  className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                                >
                                  <span className="text-xs shrink-0">{catMeta.icon}</span>
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-white truncate">
                                      {ent.display_name}
                                    </div>
                                    <div className="text-[8px] font-mono text-amber-300/80 truncate">
                                      @{ent.slug} • {catMeta.shortLabel}
                                    </div>
                                  </div>
                                </button>
                                {ent.category === 'festival' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRoleMenuOpen(false);
                                      setLineupEditorEntity(ent);
                                    }}
                                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[8px] font-mono font-bold uppercase shrink-0 cursor-pointer"
                                  >
                                    Lineup
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setRoleMenuOpen(false);
                          setShowCreateEntityModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 hover:text-white text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Create Public Page or Entity</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-zinc-900/80">
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-2 text-xs font-bold text-[#a268ff] hover:text-[#b78aff] transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-[#6601BB]/10 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Log Out from Terminal
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <CreateEntityModal
              isOpen={showCreateEntityModal}
              onClose={() => setShowCreateEntityModal(false)}
              userProfile={userProfile}
              onEntityCreated={(created, createdEditionId) => {
                setManagedEntities(getUserManagedEntities(userProfile?.id));
                if (created.category === 'festival' && createdEditionId) {
                  setLineupEditorEntity(created);
                }
              }}
              triggerNotification={triggerNotification}
            />

            <FestivalLineupEditorModal
              isOpen={Boolean(lineupEditorEntity)}
              onClose={() => setLineupEditorEntity(null)}
              entity={lineupEditorEntity}
              triggerNotification={triggerNotification}
            />
          </div>
        </div>
      </div>

      {/* Band Workspace Navigation Bar - Only for Band/Artist workspace, positioned directly ABOVE the Social sub-nav bar */}
      {(portalRole === 'band' || portalRole === 'artist') && (
        <BandWorkspaceNavBanner
          activeBand={activeBand}
          userProfile={userProfile}
          onNavigateToTab={onNavigateToTab}
          setActiveTab={setActiveTab}
          setDashboardV2ActiveNav={setDashboardV2ActiveNav}
          triggerNotification={triggerNotification}
          portalRole={portalRole}
        />
      )}

      {/* Promoter Workspace Navigation Bar - Only for Promoter workspace */}
      {portalRole === 'promoter' && (
        <PromoterWorkspaceNavBanner
          userProfile={userProfile}
          onNavigateToTab={onNavigateToTab}
          setActiveTab={setActiveTab}
          triggerNotification={triggerNotification}
          portalRole={portalRole}
        />
      )}

      {/* Primary Global Navigation Bar / Sub-Navigation Bar & Universal Search (Hidden in Clips tab for immersive fullscreen video, and in Messages/Inbox tab) */}
      {activeTab !== 'reels' && activeTab !== 'messages' && (
        <div className="flex flex-col border-t border-zinc-900/80 bg-[#0c0e12]">
          <div className="flex items-center justify-around px-1 py-[3px] relative w-full overflow-x-auto no-scrollbar">
            {[
              { id: 'feed', label: 'Feed', icon: Home },
              { id: 'shop', label: 'Shop', icon: ShoppingBag },
              { id: 'forum', label: 'Forum', icon: Users },
              { id: 'photopit', label: 'Photo Pit', icon: Camera },
              { id: 'reels', label: 'Clips', icon: Video },
              { id: 'messages', label: 'Inbox', icon: MessageSquare },
            ].map((item, itemIdx) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={`feed-tab-${item.id}-${itemIdx}`}
                  onClick={() => setActiveTab(item.id)}
                  className="relative flex-1 flex flex-col items-center justify-center gap-1 px-1 py-1 min-w-[48px] transition-all group cursor-pointer"
                >
                  {/* Icon */}
                  <div className={`relative flex items-center justify-center transition-colors ${
                    isActive 
                      ? portalRole === 'fan_only' ? 'text-cyan-400' : portalRole === 'promoter' ? 'text-yellow-400' : (portalRole === 'band' || userProfile?.active_workspace === 'band') ? 'text-[#00ffcc]' : portalRole === 'label' ? 'text-orange-400' : portalRole === 'creative' ? 'text-fuchsia-400' : 'text-[#9d4edf]' 
                      : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                    <item.icon className="w-[22px] h-[22px]" strokeWidth={1.5} />
                  </div>
                  {/* Label */}
                  <span className={`text-[9px] font-black uppercase tracking-[0.1em] transition-colors whitespace-nowrap ${
                    isActive 
                      ? portalRole === 'fan_only' ? 'text-cyan-400' : portalRole === 'promoter' ? 'text-yellow-400' : (portalRole === 'band' || userProfile?.active_workspace === 'band') ? 'text-[#00ffcc]' : portalRole === 'label' ? 'text-orange-400' : portalRole === 'creative' ? 'text-fuchsia-400' : 'text-[#9d4edf]'
                      : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                    {item.label}
                  </span>
                  {/* Active Indicator Line */}
                  {isActive && (
                    <motion.div
                      layoutId="socialNavIndicator"
                      className={`absolute -bottom-[3px] left-1 right-1 h-[2px] rounded-t-full ${
                        portalRole === 'fan_only' 
                          ? 'bg-cyan-400 shadow-[0_-2px_8px_rgba(34,211,238,0.5)]' 
                          : portalRole === 'promoter'
                          ? 'bg-yellow-400 shadow-[0_-2px_8px_rgba(234,179,8,0.8)]'
                          : (portalRole === 'band' || userProfile?.active_workspace === 'band')
                          ? 'bg-[#00ffcc] shadow-[0_-2px_8px_rgba(0,255,204,0.8)]'
                          : portalRole === 'label'
                          ? 'bg-orange-500 shadow-[0_-2px_8px_rgba(249,115,22,0.8)]'
                          : portalRole === 'creative'
                          ? 'bg-fuchsia-500 shadow-[0_-2px_8px_rgba(217,70,239,0.8)]'
                          : 'bg-[#6601BB] shadow-[0_-2px_8px_rgba(102,1,187,0.8)]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Universal Live Search Bar (Hidden in Photo Pit and Shop to keep UI focused) */}
          {activeTab !== 'photopit' && activeTab !== 'gallery' && activeTab !== 'shop' && (
            <div ref={searchContainerRef} className="w-full p-2 pb-2.5 border-t border-zinc-900 bg-[#060607] relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    if (!isSearchFocused) setIsSearchFocused(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchFocused(false);
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="Bands, Venues, Creatives, Labels and People"
                  className="w-full bg-zinc-900/60 border border-transparent rounded-full pl-9 pr-8 py-2 text-[12px] text-white placeholder-zinc-500 focus:outline-none focus:bg-zinc-900 focus:border-zinc-700 transition-all font-sans truncate"
                />
                {globalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearchQuery('')}
                    className="absolute right-2 text-zinc-500 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Discover the Scene Panel (Shown on search focus when query is empty) */}
              {isSearchFocused && globalSearchQuery.trim().length === 0 && (
                <div className="absolute right-0 left-0 top-full mt-2 mx-2 bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[9999] overflow-hidden flex flex-col max-h-[420px]">
                  {/* Panel Header */}
                  <div className="px-3.5 py-2.5 border-b border-zinc-900 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse shrink-0" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-white truncate">
                        Discover the Scene
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                        ({filteredDiscoveryItems.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSearchFocused(false)}
                      className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                      aria-label="Close Discover the Scene"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Category Filter Pills */}
                  <div className="px-3 py-2 border-b border-zinc-900/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-[#0d0d10]">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'bands', label: 'Bands' },
                      { id: 'venues', label: 'Venues' },
                      { id: 'festivals', label: 'Festivals' },
                      { id: 'pros', label: 'Pros' },
                    ].map((pill) => {
                      const active = discoverCategoryFilter === pill.id;
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => setDiscoverCategoryFilter(pill.id as any)}
                          className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer shrink-0 ${
                            active
                              ? 'bg-teal-500/20 text-teal-300 border-teal-400/60 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active / Suggested Profiles List */}
                  <div className="overflow-y-auto p-2 space-y-1 no-scrollbar flex-1">
                    {filteredDiscoveryItems.length === 0 ? (
                      <div className="py-6 px-4 text-center">
                        <p className="text-xs text-zinc-400 font-medium">
                          No {discoverCategoryFilter === 'all' ? 'scene profiles' : discoverCategoryFilter} found yet.
                        </p>
                        <p className="text-[10px] text-zinc-600 font-mono mt-1">
                          Type a name above to search all registered bands, venues, and members.
                        </p>
                      </div>
                    ) : (
                      <>
                        {filteredDiscoveryItems
                          .slice(0, (discoverPage + 1) * DISCOVER_PAGE_SIZE)
                          .map((item, idx) => {
                            const isFollowed = resolveItemFollowed({ rawProfile: item.rawProfile });
                            return (
                              <div
                                key={`discover-${item.id}-${idx}`}
                                onClick={() => {
                                  setIsSearchFocused(false);
                                  if (item.entityObj) {
                                    openTaggedBandOrEntityProfile(item.entityObj, triggerNotification);
                                  } else {
                                    window.dispatchEvent(
                                      new CustomEvent('openPublicProfile', { detail: { profile: item.rawProfile } })
                                    );
                                  }
                                }}
                                className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-zinc-900/90 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 border border-zinc-800">
                                    <HeaderAvatarImage
                                      src={item.avatar}
                                      alt={item.name}
                                      initials={item.name.slice(0, 2).toUpperCase()}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <p className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors truncate leading-tight">
                                        {item.name}
                                      </p>
                                      <span
                                        className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider border shrink-0 leading-none ${item.badgeClass}`}
                                      >
                                        {item.badgeLabel}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                                      {item.subtitle}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => handleDiscoveryFollowToggle(e, item)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-wider border transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                                    isFollowed
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                                      : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-violet-950/70 hover:border-teal-400/60 hover:text-white'
                                  }`}
                                >
                                  {isFollowed ? (
                                    <>
                                      <Check className="w-2.5 h-2.5 text-emerald-400" strokeWidth={2.75} />
                                      <span>Following</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-2.5 h-2.5 text-teal-400" strokeWidth={2.75} />
                                      <span>Follow</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        {(filteredDiscoveryItems.length > (discoverPage + 1) * DISCOVER_PAGE_SIZE ||
                          hasMoreDiscover) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDiscoverPage((p) => p + 1);
                            }}
                            className="w-full py-2 mt-1 text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 hover:text-teal-300 bg-zinc-900/70 hover:bg-zinc-900 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
                          >
                            Load More ({DISCOVER_PAGE_SIZE} per page)
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Search Dropdown Results */}
              {globalSearchQuery.trim().length > 0 && (
                <div className="absolute right-0 left-0 top-full mt-2 mx-2 bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl p-2 z-[9999] overflow-hidden max-h-96 overflow-y-auto no-scrollbar">
                  <div className="px-3 py-1.5 border-b border-zinc-900 flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                      Live Search Results
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600">
                      Matches query: "{globalSearchQuery}"
                    </span>
                  </div>

                  {(() => {
                    const q = globalSearchQuery.toLowerCase();
                    const rawList = [...(searchResults || []), ...(allProfiles || []), ...(discoverProfiles || [])];
                    
                    // Create a map to unify profiles by normalized identity (name, handle, or ID)
                    const profileMap = new Map<string, any>();

                    rawList.forEach((p) => {
                      if (!p) return;
                      const rawName = (
                        p.full_name ||
                        p.name ||
                        p.band_name ||
                        p.business_name ||
                        p.agency_name ||
                        p.label_name ||
                        p.username ||
                        p.console_handle ||
                        ''
                      ).trim();

                      const normalizedName = rawName.toLowerCase();
                      const handle = (p.console_handle || p.username || '').trim().toLowerCase();
                      const idKey = p.id ? String(p.id).toLowerCase() : '';
                      const bandIdKey = p.band_id ? String(p.band_id).toLowerCase() : '';

                      // Determine primary deduplication key (prefer normalized name, then handle, then id)
                      const primaryKey = normalizedName || handle || idKey || bandIdKey;
                      if (!primaryKey) return;

                      if (!profileMap.has(primaryKey)) {
                        profileMap.set(primaryKey, { ...p });
                      } else {
                        // Merge fields: prefer real database UUIDs, richer avatars, and sync followed state
                        const existing = profileMap.get(primaryKey);
                        const isDbUuid = (id: any) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

                        const mergedId = isDbUuid(p.id) ? p.id : existing.id;
                        const mergedBandId = isDbUuid(p.band_id) ? p.band_id : existing.band_id;
                        const isFollowed = Boolean(existing.followed || p.followed || existing.isFollowed || p.isFollowed);
                        const avatar = p.avatar_url || p.avatar || p.logo_url || existing.avatar_url || existing.avatar || existing.logo_url;

                        profileMap.set(primaryKey, {
                          ...existing,
                          ...p,
                          id: mergedId,
                          band_id: mergedBandId,
                          avatar,
                          followed: isFollowed,
                          isFollowed
                        });
                      }
                    });

                    // Cross-check follow status against discoverProfiles
                    const unique = Array.from(profileMap.values()).map((p) => {
                      const pName = (p.full_name || p.name || p.band_name || p.username || '').trim().toLowerCase();
                      const matchedDiscover = (discoverProfiles || []).find((dp: any) => {
                        const dpName = (dp.full_name || dp.name || dp.band_name || dp.username || '').trim().toLowerCase();
                        return (dp.id && p.id && dp.id === p.id) || (dpName && pName && dpName === pName);
                      });
                      if (matchedDiscover?.followed) {
                        return { ...p, followed: true, isFollowed: true };
                      }
                      return p;
                    });

                    const matchingProfiles = unique.filter(p => {
                      const nameFields = [
                        p.full_name,
                        p.username,
                        p.name,
                        p.console_handle,
                        p.band_name,
                        p.business_name,
                        p.agency_name,
                        p.label_name
                      ].filter(Boolean).map(f => String(f).toLowerCase());

                      const nameCombined = nameFields.join(' ');
                      
                      // If searching for Miguel, exclude "Vortex Graphics" creative/band profile.
                      const isSearchingForMiguel = q.includes('miguel') || q.includes('goregrinder') || q.includes('goregrindsickness');
                      const isVortexProfile = nameCombined.includes('vortex graphics') || nameCombined.includes('vortex graphic');
                      if (isSearchingForMiguel && isVortexProfile) {
                        return false;
                      }

                      const role = (p.role || p.portalRole || p.type || '').toLowerCase();
                      const genre = (p.genre || p.genres || '').toString().toLowerCase();
                      const location = (p.homebase || p.city || p.location || '').toLowerCase();
                      const bio = (p.bio || p.description || '').toLowerCase();

                      const matchesName = nameFields.some(f => f.includes(q));
                      return matchesName || role.includes(q) || genre.includes(q) || location.includes(q) || bio.includes(q);
                    });

                    if (matchingProfiles.length === 0) {
                      return (
                        <div className="p-4 text-center">
                          <p className="text-xs text-zinc-500 font-medium">No matching profiles, registered bands, or entities found.</p>
                        </div>
                      );
                    }

                    const grouped: Record<string, any[]> = {};
                    matchingProfiles.forEach(p => {
                      const roleLower = String(p.role || p.portalRole || '').toLowerCase().trim();
                      const accLower = String(p.account_type || '').toLowerCase().trim();
                      const activeWsLower = String(p.active_workspace || '').toLowerCase().trim();
                      const associatedBand = String(p.bandName || p.band_name || '').trim().toLowerCase();
                      const isPersonalHumanProfile =
                        !p.isBandProfile &&
                        p.type !== 'band' &&
                        Boolean(p.full_name) &&
                        (!associatedBand || p.full_name.trim().toLowerCase() !== associatedBand);
                      const isIndustryPro =
                        accLower === 'industry_pro' ||
                        accLower === 'industry pro' ||
                        activeWsLower === 'industry_pro' ||
                        roleLower === 'industry pro' ||
                        roleLower === 'industry_pro';
                      const isLabel = !isIndustryPro && (roleLower === 'label' || Boolean(p.label_name));
                      const isPromoter = !isIndustryPro && (roleLower === 'promoter' || roleLower === 'venue' || Boolean(p.agency_name));
                      const isCreative = !isIndustryPro && (roleLower === 'creative' || Boolean(p.business_name));
                      const isBand =
                        !isIndustryPro &&
                        !isPersonalHumanProfile &&
                        (p.isBandProfile || p.type === 'band' || roleLower === 'band' || roleLower === 'artist_band' || Boolean(p.band_name || p.bandName));

                      const cat = isIndustryPro
                        ? 'Community & Scene'
                        : isLabel
                        ? 'Record Labels'
                        : isPromoter
                        ? 'Promoters & Venues'
                        : isCreative
                        ? 'Creative Media'
                        : isBand
                        ? 'Bands & Artists'
                        : 'Community & Scene';
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(p);
                    });

                    return Object.entries(grouped).map(([catName, items], catIdx) => (
                      <div key={`cat-group-${catName}-${catIdx}`} className="mb-2 last:mb-0">
                        <div className="px-2 py-1 text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono">
                          {catName}
                        </div>
                        <div className="space-y-1 mt-1">
                          {items.map((item, itemIdx) => {
                            const displayName = item.full_name || item.band_name || item.business_name || item.agency_name || item.label_name || item.username || item.name || item.console_handle || 'Unknown Entity';
                            const displayAvatar = item.avatar_url || item.avatar || item.logo_url || item.band_logo || item.creative_avatar || item.promoter_logo || item.label_avatar;
                            const subRole = item.genre || item.homebase || item.portalRole || item.role || (catName === 'Bands & Artists' ? 'Registered Band' : 'Scene Member');

                            const uniqueKey = `search-item-${catIdx}-${item.id || ''}-${item.band_id || ''}-${item.role || item.portalRole || item.type || ''}-${itemIdx}`;

                            return (
                              <div
                                key={uniqueKey}
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('openPublicProfile', { detail: { profile: item } }));
                                  setGlobalSearchQuery('');
                                }}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 border border-zinc-800">
                                      <HeaderAvatarImage
                                        src={displayAvatar}
                                        alt={displayName}
                                        initials={displayName.slice(0, 2).toUpperCase()}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors truncate leading-tight">
                                      {displayName}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 truncate leading-tight">
                                      {subRole}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGlobalSearchFollowToggle(item.id || item.band_id, displayName);
                                  }}
                                  className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider font-mono rounded-full border transition-all shrink-0 ${
                                    item.followed
                                      ? 'bg-purple-950/50 text-purple-400 border-purple-500/40 hover:bg-purple-900/50'
                                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                                  }`}
                                >
                                  {item.followed ? 'Followed' : '+ Follow'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
