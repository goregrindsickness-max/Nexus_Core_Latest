import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Search, Music, Briefcase, Sparkles, Building2, Ticket, Layers, ArrowUpRight, UserCheck } from 'lucide-react';
import { normalizeLoadedProfile as defaultNormalizeLoadedProfile } from '../../../supabase';

export interface FollowersModalProps {
  viewingFollowersOrFollowing: 'followers' | 'following' | null;
  setViewingFollowersOrFollowing: (val: 'followers' | 'following' | null) => void;
  selectedUserProfile: any;
  portalRole?: string;
  targetProfile?: any;
  liveFollowsLoading?: boolean;
  liveFollowsList?: any[];
  allProfiles?: any[];
  userProfile?: any;
  setSelectedUserProfile: (user: any) => void;
  triggerNotification?: (msg: string) => void;
  getProfileForUser: (userParam: any) => any;
  normalizeLoadedProfile: (profile: any) => any;
  handleFollowProfile?: (user: any, forceAction?: 'follow' | 'unfollow') => Promise<void>;
  handleToggleMutualFollow?: (user: any) => Promise<void>;
}

type CategoryType = 'all' | 'grouped' | 'band' | 'people' | 'creative' | 'label' | 'promoter';

export const FollowersModal: React.FC<FollowersModalProps> = ({
  viewingFollowersOrFollowing,
  setViewingFollowersOrFollowing,
  selectedUserProfile,
  portalRole = '',
  targetProfile,
  liveFollowsLoading = false,
  liveFollowsList = [],
  allProfiles = [],
  userProfile,
  setSelectedUserProfile,
  triggerNotification,
  getProfileForUser,
  normalizeLoadedProfile,
  handleFollowProfile,
  handleToggleMutualFollow,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const uRole = selectedUserProfile?.role?.toLowerCase() || '';
  const isMiguel = !!(
    selectedUserProfile?.name?.toLowerCase().includes('miguel') ||
    selectedUserProfile?.email?.toLowerCase().includes('miguel') ||
    selectedUserProfile?.role?.toLowerCase().includes('miguel')
  );
  const isFanProfile = !isMiguel && (selectedUserProfile?.name === 'Fan Listener' || uRole === 'fan_only' || uRole === 'fan only' || uRole === 'listener' || (selectedUserProfile?.isYou && portalRole === 'fan_only'));
  const isPro = (selectedUserProfile?.hasProAccess || selectedUserProfile?.isYou) && !isFanProfile;

  let modalAccentClass = 'text-orange-400';
  let modalBorderClass = 'border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.2)]';

  if (uRole.includes('artist') || uRole.includes('band')) {
    modalAccentClass = 'text-emerald-400';
    modalBorderClass = 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]';
  } else if (uRole.includes('promoter')) {
    modalAccentClass = 'text-yellow-400';
    modalBorderClass = 'border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.2)]';
  } else if (uRole.includes('creative')) {
    modalAccentClass = 'text-fuchsia-400';
    modalBorderClass = 'border-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.2)]';
  } else if (isPro) {
    modalAccentClass = 'text-violet-500';
    modalBorderClass = 'border-violet-700/50 shadow-[0_0_30px_rgba(109,40,217,0.3)]';
  } else if (isFanProfile) {
    modalAccentClass = 'text-cyan-500';
    modalBorderClass = 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]';
  }

  const isViewingSelf = !!(selectedUserProfile?.isYou || (userProfile?.id && selectedUserProfile?.id === userProfile.id));

  let isMutualActive = false;
  try {
    const localMutuals = JSON.parse(localStorage.getItem('nexus_local_mutuals_v1') || '{}');
    const targetNameKey = selectedUserProfile?.name?.toLowerCase().trim();
    if (selectedUserProfile?.id && localMutuals[selectedUserProfile.id]) isMutualActive = true;
    if (targetNameKey && localMutuals[targetNameKey]) isMutualActive = true;
    if (selectedUserProfile?.followedBack) isMutualActive = true;
  } catch (e) {}

  // Parse and categorize all follow list items
  const parsedItems = useMemo(() => {
    const listToParse = liveFollowsList || [];
    return listToParse.map(p => {
      const targetData = p?.follower || p?.following || p?.profile || p;
      
      const id = targetData?.id || p?.id || p?.user_id || p?.follower_id || p?.following_id;
      
      const isExplicitBand = Boolean(
        p?.target_type === 'band' ||
        targetData?.target_type === 'band' ||
        targetData?.isBandProfile ||
        (p?.type === 'band') ||
        (targetData?.type === 'band') ||
        (p?.category === 'bands' || p?.category === 'band')
      );

      let name = 'Unknown User';
      if (isExplicitBand) {
        name = targetData?.band_name || targetData?.bandName || targetData?.name || targetData?.full_name || 'Band';
      } else {
        name = targetData?.full_name || targetData?.display_name || targetData?.name || targetData?.label_company_name || targetData?.agency_name || targetData?.promoter_name || targetData?.creative_name || targetData?.console_handle || p?.name || 'User';
      }

      const rawHandle = targetData?.console_handle || targetData?.handle || targetData?.email?.split('@')[0] || name.toLowerCase().replace(/\s+/g, '');
      const handle = String(rawHandle).replace(/^@+/, '');
      
      const rawRole = (targetData?.role || targetData?.account_type || targetData?.portalRole || targetData?.workspace || targetData?.active_workspace || '').toLowerCase();
      const is_pro = targetData?.isPro || targetData?.hasProAccess || ['creative', 'promoter', 'label', 'band', 'artist'].includes(rawRole);

      const categoryStr = (targetData?.category || p?.category || '').toLowerCase();
      const workspaces: string[] = Array.isArray(targetData?.registered_workspaces) 
        ? targetData.registered_workspaces.map((w: any) => String(w).toLowerCase())
        : (typeof targetData?.registered_workspaces === 'string' ? [targetData.registered_workspaces.toLowerCase()] : []);

      // Classify category: 'people', 'band', 'creative', 'label', 'promoter'
      let category: 'people' | 'band' | 'creative' | 'label' | 'promoter' = 'people';
      
      if (isExplicitBand) {
        category = 'band';
      } else if (
        categoryStr === 'labels' ||
        categoryStr === 'label' ||
        rawRole === 'label' ||
        targetData?.label_name ||
        targetData?.label_company_name ||
        workspaces.includes('label')
      ) {
        category = 'label';
      } else if (
        categoryStr === 'venues' ||
        categoryStr === 'promoter' ||
        categoryStr === 'promoters' ||
        rawRole.includes('promoter') ||
        rawRole.includes('venue') ||
        rawRole.includes('talent_buyer') ||
        rawRole.includes('talent buyer') ||
        rawRole.includes('booking') ||
        targetData?.agency_name ||
        targetData?.promoter_name ||
        targetData?.promoterName ||
        targetData?.venue_name ||
        workspaces.includes('promoter')
      ) {
        category = 'promoter';
      } else if (
        categoryStr === 'creatives' ||
        categoryStr === 'creative' ||
        rawRole.includes('creative') ||
        rawRole.includes('designer') ||
        rawRole.includes('photographer') ||
        rawRole.includes('producer') ||
        rawRole.includes('studio') ||
        rawRole.includes('printer') ||
        rawRole.includes('audio_engineer') ||
        targetData?.business_name ||
        targetData?.creative_name ||
        workspaces.includes('creative')
      ) {
        category = 'creative';
      } else if (
        categoryStr === 'bands' ||
        categoryStr === 'band' ||
        rawRole.includes('artist') ||
        rawRole.includes('musician') ||
        rawRole.includes('vocalist') ||
        rawRole.includes('guitarist')
      ) {
        category = 'band';
      } else {
        category = 'people';
      }

      return {
        id,
        display_name: name,
        handle,
        is_pro,
        category,
        avatar_url: targetData?.avatar_url || targetData?.avatar || targetData?.image || p?.avatar_url || p?.image || null,
        role: targetData?.role || targetData?.account_type || (category === 'band' ? 'Band / Artist' : category === 'promoter' ? 'Promoter / Venue' : category === 'creative' ? 'Creative Pro' : category === 'label' ? 'Record Label' : 'Fan Listener'),
        raw: targetData
      };
    });
  }, [liveFollowsList]);

  // Counts by category
  const counts = useMemo(() => {
    const res = { all: parsedItems.length, band: 0, creative: 0, label: 0, promoter: 0, people: 0 };
    parsedItems.forEach(item => {
      res[item.category] = (res[item.category] || 0) + 1;
    });
    return res;
  }, [parsedItems]);

  // Filtered by search & category tab
  const filteredItems = useMemo(() => {
    return parsedItems.filter(item => {
      const matchesSearch = !searchQuery.trim() || 
        item.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (activeCategory === 'all' || activeCategory === 'grouped') return true;
      return item.category === activeCategory;
    });
  }, [parsedItems, searchQuery, activeCategory]);

  const handleNavigateToProfile = (user: any) => {
    setViewingFollowersOrFollowing(null);
    
    const dbProfile = allProfiles.find(ap => ap.id === user.id || ap.console_handle === user.handle);
    const normFn = typeof normalizeLoadedProfile === 'function' ? normalizeLoadedProfile : defaultNormalizeLoadedProfile;
    
    let profileData;
    if (dbProfile) {
      profileData = normFn(dbProfile);
    } else if (user.raw && typeof user.raw === 'object') {
      profileData = normFn(user.raw);
    } else {
      profileData = getProfileForUser({ id: user.id, name: user.display_name, avatar: user?.avatar_url, role: user?.role });
    }

    setSelectedUserProfile(profileData);
    triggerNotification?.(`⚡ Loading ${user.display_name}'s profile...`);
  };

  const getCategoryBadge = (category: string, roleStr?: string) => {
    switch (category) {
      case 'band':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 rounded font-mono uppercase font-bold">
            <Music className="w-2.5 h-2.5" /> Band
          </span>
        );
      case 'creative':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-500/40 rounded font-mono uppercase font-bold">
            <Sparkles className="w-2.5 h-2.5" /> Creative
          </span>
        );
      case 'label':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-violet-950/70 text-violet-300 border border-violet-500/40 rounded font-mono uppercase font-bold">
            <Building2 className="w-2.5 h-2.5" /> Label
          </span>
        );
      case 'promoter':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-amber-950/70 text-amber-300 border border-amber-500/40 rounded font-mono uppercase font-bold">
            <Ticket className="w-2.5 h-2.5" /> Promoter
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 rounded font-mono uppercase font-bold">
            <Users className="w-2.5 h-2.5" /> Person
          </span>
        );
    }
  };

  const categoriesConfig: { key: CategoryType; label: string; icon: any; count: number }[] = [
    { key: 'all', label: 'All', icon: Users, count: counts.all },
    { key: 'grouped', label: 'Grouped', icon: Layers, count: counts.all },
    { key: 'people', label: 'People', icon: Users, count: counts.people },
    { key: 'band', label: 'Bands', icon: Music, count: counts.band },
    { key: 'creative', label: 'Creatives', icon: Sparkles, count: counts.creative },
    { key: 'label', label: 'Labels', icon: Building2, count: counts.label },
    { key: 'promoter', label: 'Promoters', icon: Ticket, count: counts.promoter },
  ];

  const renderUserRow = (user: any, index: number, groupKey: string = 'general') => (
    <div 
      key={`follower-row-${groupKey}-${index}-${user.id || ''}-${user.band_id || ''}-${user.raw_id || ''}-${user.handle || ''}-${user.name || ''}`} 
      onClick={() => handleNavigateToProfile(user)}
      className="flex items-center justify-between p-2.5 bg-zinc-900/90 border border-zinc-800/80 rounded-xl hover:border-violet-500/50 hover:bg-zinc-800/60 transition-all text-left cursor-pointer group"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-zinc-700/60 group-hover:border-violet-500/60 transition-colors">
          {user?.avatar_url ? (
            <img 
              src={user?.avatar_url} 
              alt={user.display_name || user.handle} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-violet-950/60 flex items-center justify-center text-xs text-violet-300 font-bold font-mono">
              {(user.display_name || user.handle || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white truncate text-xs group-hover:text-violet-300 transition-colors">
              {user.display_name}
            </span>
            {getCategoryBadge(user.category)}
            {user.is_pro && (
              <span className="text-[8px] px-1 py-0.5 bg-purple-900/60 text-purple-300 border border-purple-500/30 rounded font-mono uppercase font-black">
                PRO
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 truncate font-mono">@{user.handle}</span>
        </div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleNavigateToProfile(user);
        }}
        className="px-2.5 py-1 bg-violet-950/60 hover:bg-violet-800/80 border border-violet-500/40 text-violet-200 text-[10px] rounded-lg font-mono font-bold transition-all shrink-0 flex items-center gap-1 group-hover:border-violet-400"
      >
        View <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {viewingFollowersOrFollowing && (
        <motion.div 
          key="followers-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" 
          onClick={() => setViewingFollowersOrFollowing(null)}
        >
          <motion.div 
            key="followers-modal-card"
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className={`bg-[#0b0c0e] border ${modalBorderClass} rounded-2xl p-5 w-full max-w-lg font-mono relative max-h-[85vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setViewingFollowersOrFollowing(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Modal Title Header */}
            <div className="pb-3 border-b border-zinc-900 pr-8">
              <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2 truncate max-w-[320px]">
                  <Users className={`w-4 h-4 shrink-0 ${modalAccentClass}`} />
                  <span className="truncate">
                    {(selectedUserProfile?.business_name || selectedUserProfile?.creative_name || selectedUserProfile?.band_name || selectedUserProfile?.bandName || selectedUserProfile?.name || selectedUserProfile?.full_name || 'Profile')}'s {viewingFollowersOrFollowing === 'followers' ? 'Followers' : 'Following'}
                  </span>
                </span>
                {!liveFollowsLoading && (
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 font-bold shrink-0">
                    {filteredItems.length !== parsedItems.length 
                      ? `${filteredItems.length} OF ${parsedItems.length} NODES` 
                      : `${parsedItems.length} ${parsedItems.length === 1 ? 'NODE' : 'NODES'}`}
                  </span>
                )}
              </h3>

              {/* Search Bar */}
              <div className="relative mt-3">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Filter nodes by name or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-[10px]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar shrink-0 border-b border-zinc-900/80">
              {categoriesConfig.map((cat, catIdx) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={`follower-cat-${cat.key}-${catIdx}`}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight whitespace-nowrap transition-all border ${
                      isActive
                        ? 'bg-violet-950/80 border-violet-500 text-violet-200 shadow-sm shadow-violet-950'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                    <span className={`text-[8px] px-1 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-violet-800 text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Content List Area */}
            <div className="space-y-2 py-3 overflow-y-auto no-scrollbar pr-1 flex-1 min-h-0">
              {(() => {
                if (liveFollowsLoading) {
                  return (
                    <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-xl">
                      <div className="w-6 h-6 border-2 border-t-transparent border-violet-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-[10px] text-zinc-500 font-mono">LOADING SECTOR NODES...</p>
                    </div>
                  );
                }

                if (filteredItems.length === 0) {
                  return (
                    <div className="text-center py-10 px-4 border border-dashed border-zinc-800/80 rounded-xl">
                      <p className="text-zinc-400 text-xs font-mono font-bold">No nodes found matching filter criteria.</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1">Try switching tabs or clearing your search query.</p>
                    </div>
                  );
                }

                // Grouped View rendering
                if (activeCategory === 'grouped') {
                  const groups: { key: string; title: string; icon: any; color: string; items: typeof filteredItems }[] = [
                    { key: 'band', title: 'BANDS & ARTISTS', icon: Music, color: 'text-emerald-400 border-emerald-500/30', items: filteredItems.filter(i => i.category === 'band') },
                    { key: 'people', title: 'PEOPLE & FANS', icon: Users, color: 'text-cyan-400 border-cyan-500/30', items: filteredItems.filter(i => i.category === 'people') },
                    { key: 'creative', title: 'CREATIVES & PRODUCERS', icon: Sparkles, color: 'text-fuchsia-400 border-fuchsia-500/30', items: filteredItems.filter(i => i.category === 'creative') },
                    { key: 'label', title: 'RECORD LABELS', icon: Building2, color: 'text-violet-400 border-violet-500/30', items: filteredItems.filter(i => i.category === 'label') },
                    { key: 'promoter', title: 'PROMOTERS & VENUES', icon: Ticket, color: 'text-amber-400 border-amber-500/30', items: filteredItems.filter(i => i.category === 'promoter') },
                  ];

                  return (
                    <div className="space-y-4">
                      {groups.map((group, grpIdx) => {
                        if (group.items.length === 0) return null;
                        const GroupIcon = group.icon;
                        return (
                          <div key={`fol-group-${group.key}-${grpIdx}`} className="space-y-2">
                            <div className={`flex items-center justify-between pb-1 border-b ${group.color}`}>
                              <span className={`text-[10px] font-bold tracking-widest flex items-center gap-1.5 ${group.color.split(' ')[0]}`}>
                                <GroupIcon className="w-3 h-3" />
                                {group.title}
                              </span>
                              <span className="text-[9px] text-zinc-500 font-mono">
                                {group.items.length} {group.items.length === 1 ? 'node' : 'nodes'}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {group.items.map((user, idx) => renderUserRow(user, idx, group.key))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Standard list rendering
                return filteredItems.map((user, idx) => renderUserRow(user, idx, activeCategory));
              })()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

