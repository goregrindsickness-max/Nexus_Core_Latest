import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { FeedItem } from '../../../data/socialFeedMockData';
import { fetchGlobalInteractions, ReactorUser } from '../../../services/postInteractionsService';
import { getSupabase } from '../../../supabase';

export interface InlineReactionsModalProps {
  viewingReactionsPost: FeedItem | any | null;
  setViewingReactionsPost: (post: FeedItem | any | null) => void;
  reactionsActiveTab?: string;
  setReactionsActiveTab?: (tab: string) => void;
  allProfiles?: any[];
  userProfile?: any;
}

const REACTION_CONFIG: Record<string, { label: string; icon: string; emoji: string }> = {
  all: { label: 'All', icon: '✨', emoji: '✨' },
  hype: { label: 'Hype', icon: '🔥', emoji: '🔥' },
  horns: { label: 'Horns', icon: '🤘', emoji: '🤘' },
  likes: { label: 'Like', icon: '❤️', emoji: '❤️' },
  like: { label: 'Like', icon: '❤️', emoji: '❤️' },
  brutal: { label: 'Brutal', icon: '💀', emoji: '💀' },
  respect: { label: 'Respect', icon: '🤝', emoji: '🤝' },
  crushed: { label: 'Crushed', icon: '💥', emoji: '💥' }
};

export const InlineReactionsModal: React.FC<InlineReactionsModalProps> = ({
  viewingReactionsPost,
  setViewingReactionsPost,
  reactionsActiveTab: propActiveTab,
  setReactionsActiveTab: propSetActiveTab,
  userProfile,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<string>('all');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

  const [compiledReactors, setCompiledReactors] = useState<Array<{
    userId: string;
    name: string;
    avatar: string;
    role: string;
    type: string;
    handle: string;
    reactedAt?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load real Supabase-backed reactor profiles
  useEffect(() => {
    if (!viewingReactionsPost) return;

    let isMounted = true;
    setIsLoading(true);

    const loadInteractions = async () => {
      try {
        const data = await fetchGlobalInteractions(true);
        if (!isMounted) return;

        const postId = viewingReactionsPost.id;
        const postRx = data.reactions?.[postId];

        // Collect raw reactors recorded in backend
        const rawReactors: ReactorUser[] = postRx?.users ? Object.values(postRx.users) : [];

        // Filter out any fake/mock seed IDs completely
        const validReactors = rawReactors.filter((u) => {
          if (!u || !u.userId) return false;
          const uId = String(u.userId).toLowerCase();
          if (uId.startsWith('user_sarah_') || uId.startsWith('user_metal_') || uId.startsWith('seed_')) return false;
          if (uId === 'user_sarah_blast_venue' || uId === 'user_metal_dan_creative') return false;
          return true;
        });

        // Collect Supabase UUIDs to fetch live, authoritative profiles
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const profileUuids = validReactors
          .map(r => r.userId)
          .filter(id => uuidRegex.test(id));

        const profileMap = new Map<string, any>();
        const bandMap = new Map<string, any>();

        const supabase = getSupabase?.();
        if (supabase) {
          if (profileUuids.length > 0) {
            try {
              const { data: dbProfiles } = await supabase
                .from('profiles')
                .select('id, full_name, console_handle, avatar_url, account_type, active_workspace')
                .in('id', profileUuids);

              if (dbProfiles) {
                dbProfiles.forEach((p: any) => profileMap.set(p.id, p));
              }
            } catch (err) {
              console.warn('[InlineReactionsModal] Supabase profiles fetch notice:', err);
            }
          }

          // Check if any reactor is a band persona (starts with band: or UUID in bands table)
          const bandIds = validReactors
            .filter(r => r.userId.startsWith('band:'))
            .map(r => r.userId.replace(/^band:/, ''))
            .filter(id => uuidRegex.test(id));

          if (bandIds.length > 0) {
            try {
              const { data: dbBands } = await supabase
                .from('bands')
                .select('id, name, logo_url')
                .in('id', bandIds);

              if (dbBands) {
                dbBands.forEach((b: any) => bandMap.set(b.id, b));
              }
            } catch (err) {
              console.warn('[InlineReactionsModal] Supabase bands fetch notice:', err);
            }
          }
        }

        // Build list of real reactors
        const list: Array<{
          userId: string;
          name: string;
          avatar: string;
          role: string;
          type: string;
          handle: string;
          reactedAt?: string;
        }> = [];

        const seenKeys = new Set<string>();

        validReactors.forEach((u) => {
          const key = `${u.userId}-${u.reactionType}`;
          if (seenKeys.has(key)) return;
          seenKeys.add(key);

          const dbProf = profileMap.get(u.userId);
          const isBandPersona = u.userId.startsWith('band:');
          const bandId = isBandPersona ? u.userId.replace(/^band:/, '') : null;
          const dbBand = bandId ? bandMap.get(bandId) : null;

          let finalName = u.userName || 'Scene Member';
          let finalAvatar = u.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
          let finalRole = u.userRole || 'Scene Fan';
          let finalHandle = `@${finalName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;

          if (dbProf) {
            // Live profile from Supabase
            finalName = dbProf.full_name || dbProf.console_handle || finalName;
            if (dbProf.avatar_url) finalAvatar = dbProf.avatar_url;
            if (dbProf.console_handle) {
              finalHandle = `@${dbProf.console_handle.replace(/^@/, '')}`;
            }

            // Authoritative role resolution for personal profile
            const isMiguel = dbProf.id === '5403162d-1947-43aa-b5f6-38a1bd2a1b80' || (dbProf.full_name && dbProf.full_name.toLowerCase().includes('miguel'));
            const accType = (dbProf.account_type || '').toLowerCase();
            const activeWs = (dbProf.active_workspace || '').toLowerCase();

            if (isMiguel || accType.includes('industry') || activeWs === 'industry_pro') {
              finalRole = 'Industry Pro';
            } else if (accType.includes('promoter') || activeWs === 'promoter') {
              finalRole = 'Venue Promoter';
            } else if (accType.includes('creative') || activeWs === 'creative') {
              finalRole = 'Creative Pro';
            } else if (accType.includes('band') || activeWs === 'band') {
              finalRole = 'Band / Artist';
            } else if (accType.includes('label') || activeWs === 'label') {
              finalRole = 'Record Label';
            }
          } else if (isBandPersona) {
            finalRole = 'Band / Artist';
            if (dbBand) {
              finalName = dbBand.name || finalName;
              if (dbBand.logo_url) finalAvatar = dbBand.logo_url;
              finalHandle = `@${finalName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
            }
          } else if (u.userId.startsWith('promoter:')) {
            finalRole = 'Venue Promoter';
          } else if (u.userId.startsWith('creative:')) {
            finalRole = 'Creative Pro';
          } else if (u.userId.startsWith('label:')) {
            finalRole = 'Record Label';
          }

          list.push({
            userId: u.userId,
            name: finalName,
            avatar: finalAvatar,
            role: finalRole,
            type: u.reactionType,
            handle: finalHandle,
            reactedAt: u.reactedAt
          });
        });

        if (isMounted) {
          setCompiledReactors(list);
        }
      } catch (err) {
        console.warn('Failed to load global reaction details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInteractions();

    return () => {
      isMounted = false;
    };
  }, [viewingReactionsPost]);

  if (!viewingReactionsPost) return null;

  // Compute reaction counts strictly from genuine, Supabase-backed reactors
  const reactionCounts: Record<string, number> = {};
  compiledReactors.forEach((r) => {
    reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
  });

  const totalReactions = compiledReactors.length;

  // Active reaction breakdown tabs with counts > 0
  const activeTabs = Object.entries(reactionCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type,
      count,
      config: REACTION_CONFIG[type] || { label: type.toUpperCase(), icon: '🔥', emoji: '🔥' }
    }));

  // Helper for role badge styling - Industry Pro uses deep purple (#8b5cf6)
  const getRoleBadge = (roleName?: string) => {
    const r = (roleName || '').toLowerCase().trim();
    if (r.includes('industry') || r.includes('manager') || r === 'pro' || r.includes('industry pro')) {
      return {
        label: 'Industry Pro',
        colorClass: 'text-[#8b5cf6] border-[#8b5cf6]/30 bg-[#8b5cf6]/10'
      };
    }
    if (r.includes('band') || r.includes('artist')) {
      return {
        label: 'Band / Artist',
        colorClass: 'text-[#39ff14] border-[#39ff14]/30 bg-[#39ff14]/10'
      };
    }
    if (r.includes('label') || r.includes('record')) {
      return {
        label: 'Record Label',
        colorClass: 'text-[#ff6b00] border-[#ff6b00]/30 bg-[#ff6b00]/10'
      };
    }
    if (r.includes('creative') || r.includes('graphic') || r.includes('photo')) {
      return {
        label: 'Creative Pro',
        colorClass: 'text-[#ff00aa] border-[#ff00aa]/30 bg-[#ff00aa]/10'
      };
    }
    if (r.includes('promoter') || r.includes('venue') || r.includes('booking')) {
      return {
        label: 'Venue Promoter',
        colorClass: 'text-[#ffff00] border-[#ffff00]/30 bg-[#ffff00]/10'
      };
    }
    return {
      label: 'Scene Fan',
      colorClass: 'text-[#00f0ff] border-[#00f0ff]/30 bg-[#00f0ff]/10'
    };
  };

  // Filter reactors by selected reaction tab
  const filteredReactors = compiledReactors.filter((r) => activeTab === 'all' || r.type === activeTab);

  return (
    <AnimatePresence>
      <motion.div
        key="reactions-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-4 sm:p-6"
        onClick={() => setViewingReactionsPost(null)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0f1013] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[82vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-zinc-100 tracking-wider font-mono">
                Post Reactions
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-rose-400 font-mono">
                {totalReactions} total
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewingReactionsPost(null)}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Reaction Breakdown Filter Tabs */}
          <div className="flex gap-1.5 p-2.5 overflow-x-auto no-scrollbar border-b border-zinc-900 bg-zinc-950/40 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all duration-150 shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              All ({totalReactions})
            </button>

            {activeTabs.map((tab) => (
              <button
                key={`rx-tab-${tab.type}`}
                type="button"
                onClick={() => setActiveTab(tab.type)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === tab.type
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-800/80 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <span>{tab.config.emoji}</span>
                <span className="text-[11px]">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Reactor List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[220px] max-h-[50vh] no-scrollbar">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-zinc-500 font-mono animate-pulse">
                Loading transmission signal reactions...
              </div>
            ) : filteredReactors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-1">
                <span className="text-3xl mb-1">⚡</span>
                <p className="text-xs font-bold text-zinc-400 font-mono">No reactions yet</p>
                <p className="text-[11px] text-zinc-600">Be the first to hit the flame or raise the horns!</p>
              </div>
            ) : (
              filteredReactors.map((reactor, i) => {
                const rxConfig = REACTION_CONFIG[reactor.type] || { label: reactor.type.toUpperCase(), icon: '🔥', emoji: '🔥' };
                const roleBadge = getRoleBadge(reactor.role);

                return (
                  <div
                    key={`reactor-row-${reactor.userId}-${reactor.type}-${i}`}
                    className="flex items-center justify-between p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl hover:border-zinc-700/80 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 border border-zinc-700/80 relative">
                        {reactor.avatar && (reactor.avatar.startsWith('http') || reactor.avatar.startsWith('/') || reactor.avatar.startsWith('data:image')) ? (
                          <img
                            referrerPolicy="no-referrer"
                            src={reactor.avatar}
                            className="w-full h-full object-cover"
                            alt={reactor.name}
                          />
                        ) : (
                          <span className="font-mono text-xs">{reactor.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>

                      {/* Name & Role */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white truncate max-w-[170px]">
                            {reactor.name}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${roleBadge.colorClass}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono truncate block">
                          {reactor.handle}
                        </span>
                      </div>
                    </div>

                    {/* Reaction Type Badge */}
                    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg shrink-0 shadow-sm">
                      <span className="text-sm select-none leading-none">{rxConfig.emoji}</span>
                      <span className="text-[9px] uppercase font-mono font-bold text-zinc-300 tracking-wider">
                        {rxConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900 text-[10px] font-mono text-zinc-500 flex items-center justify-between shrink-0">
            <span>Verified Supabase underground accounts</span>
            <span>📡 Live</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
