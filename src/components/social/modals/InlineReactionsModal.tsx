import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { FeedItem, GENRE_REACTION_MATRICES } from '../../../data/socialFeedMockData';

export interface InlineReactionsModalProps {
  viewingReactionsPost: FeedItem | null;
  setViewingReactionsPost: (post: FeedItem | null) => void;
  reactionsActiveTab: string;
  setReactionsActiveTab: (tab: string) => void;
  allProfiles?: any[];
  userProfile?: any;
}

export const InlineReactionsModal: React.FC<InlineReactionsModalProps> = ({
  viewingReactionsPost,
  setViewingReactionsPost,
  reactionsActiveTab,
  setReactionsActiveTab,
  allProfiles = [],
  userProfile,
}) => {
  return (
    <AnimatePresence>
      {viewingReactionsPost && (
        <motion.div
          key="reactions-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setViewingReactionsPost(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121214] border border-zinc-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-zinc-200 tracking-wider font-display">Post Reactions</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                  {Array.isArray(viewingReactionsPost.reactions) ? viewingReactionsPost.reactions.reduce((sum, r) => sum + r.count, 0) :
                   (Object.values(viewingReactionsPost.reactions) as number[]).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0)}
                </span>
              </div>
              <button onClick={() => setViewingReactionsPost(null)} className="text-zinc-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reaction Tabs / Breakdown */}
            {(() => {
              const genreKey = viewingReactionsPost.genre?.toLowerCase() || 'metal';
              const matrix = GENRE_REACTION_MATRICES[genreKey] || GENRE_REACTION_MATRICES['metal'];

              let reactionsArray = viewingReactionsPost.reactions;
              if (!Array.isArray(reactionsArray)) {
                reactionsArray = Object.entries(reactionsArray || {}).map(([key, value]) => ({
                  type: key,
                  count: typeof value === 'number' ? value : 0,
                  active: false
                }));
              }
              const activeReactions = reactionsArray.filter((r: any) => r.count > 0);

              return (
                <>
                  <div className="flex gap-1.5 p-3 overflow-x-auto no-scrollbar border-b border-zinc-900 bg-black/10 shrink-0">
                    <button
                      onClick={() => setReactionsActiveTab('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0 ${
                        reactionsActiveTab === 'all'
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                      }`}
                    >
                      All
                    </button>
                    {activeReactions.map((r, rIdx) => {
                      const token = matrix[r.type] || matrix['hype'];
                      return (
                        <button
                          key={`inline-react-tab-${r.type}-${rIdx}`}
                          onClick={() => setReactionsActiveTab(r.type)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                            reactionsActiveTab === r.type
                              ? 'bg-zinc-800 text-white border border-zinc-700'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                          }`}
                        >
                          <span>{token.icon}</span>
                          <span className="font-mono text-[11px]">{r.count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Reactors List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[50vh] no-scrollbar">
                    {(() => {
                      const dbReactors = allProfiles.length > 0 ? allProfiles.map((p: any) => ({
                        name: p.username || p.full_name || 'Unknown',
                        role: p.role || 'Fan',
                        avatar: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                        label: (p.role || 'Fan').split('_')[0],
                        color: (p.role === 'fan' || p.role === 'fan_only') ? "text-rose-400 border-rose-500/30 bg-rose-950/40" : (p.role === 'artist_band' || p.role === 'band' ? "text-[#39ff14] border-[#39ff14]/30 bg-[#39ff14]/10" : "text-cyan-400 border-cyan-500/30 bg-cyan-950/40"),
                        handle: `@${p.username || p.full_name?.toLowerCase().replace(/\s+/g, '_') || 'unknown'}`
                      })) : [
                        { name: "BlastBeatPro", role: "Band Member", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100", label: "Band", color: "text-[#39ff14] border-[#39ff14]/30 bg-[#39ff14]/10", handle: "@blastbeat" },
                        { name: "VocalistDan", role: "Creative", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100", label: "Creative", color: "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/40", handle: "@dan_vocal" },
                        { name: "MetalGuitarist", role: "Creative", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", label: "Creative", color: "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/40", handle: "@shredder" },
                        { name: "SynthWrecker", role: "Industry Pro", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100", label: "Pro", color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40", handle: "@synth_wrecker" },
                        { name: "CoOpManager", role: "Promoter", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", label: "Promoter", color: "text-amber-400 border-amber-500/30 bg-amber-950/40", handle: "@coop_hq" },
                        { name: "BassDemon", role: "Creative", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100", label: "Creative", color: "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/40", handle: "@bass_demon" },
                        { name: "FanaticRiot", role: "Fan", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100", label: "Fan", color: "text-rose-400 border-rose-500/30 bg-rose-950/40", handle: "@riot_fan" },
                        { name: "CoreConqueror", role: "Fan", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100", label: "Fan", color: "text-rose-400 border-rose-500/30 bg-rose-950/40", handle: "@conqueror" },
                        { name: "TourTornado", role: "Industry Pro", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100", label: "Pro", color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40", handle: "@tour_tornado" }
                      ];

                      // Build a deterministic set of reactors for this post
                      const seed = viewingReactionsPost.id.charCodeAt(viewingReactionsPost.id.length - 1) || 0;
                      const reactionsList: Array<{ name: string; avatar: string; label: string; color: string; handle: string; type: string }> = [];

                      viewingReactionsPost.reactions.forEach((reaction, idx) => {
                        if (reaction.count <= 0) return;

                        let countAdded = 0;
                        for (let i = 0; i < reaction.count; i++) {
                          const reactorIndex = (seed + idx * 3 + i) % dbReactors.length;
                          const baseReactor = dbReactors[reactorIndex];
                          const suffix = i >= dbReactors.length ? ` #${Math.floor(i / dbReactors.length) + 1}` : '';

                          reactionsList.push({
                            ...baseReactor,
                            name: baseReactor.name + suffix,
                            type: reaction.type
                          });

                          countAdded++;
                          if (countAdded >= reaction.count) break;
                        }

                        if (reaction.active) {
                          reactionsList.unshift({
                            name: userProfile?.name || 'You',
                            handle: '@you',
                            avatar: userProfile?.avatar_url || userProfile?.avatar || 'U',
                            label: 'You',
                            color: 'text-rose-400 border-rose-500/30 bg-rose-950/40',
                            type: reaction.type
                          });
                        }
                      });

                      const filteredReactors = reactionsList.filter(r => reactionsActiveTab === 'all' || r.type === reactionsActiveTab);

                      const uniqueReactors: typeof filteredReactors = [];
                      const seenNames = new Set<string>();
                      filteredReactors.forEach(r => {
                        const key = `${r.name}-${r.type}`;
                        if (!seenNames.has(key)) {
                          seenNames.add(key);
                          uniqueReactors.push(r);
                        }
                      });

                      if (uniqueReactors.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <span className="text-2xl mb-2">✨</span>
                            <p className="text-xs text-zinc-500 font-medium">No reactors found for this filter.</p>
                          </div>
                        );
                      }

                      return uniqueReactors.map((reactor, i) => {
                        const token = matrix[reactor.type] || matrix['hype'];
                        return (
                          <div key={`reactor-${reactor.name || 'user'}-${reactor.type || ''}-${i}`} className="flex items-center justify-between p-2.5 bg-black/40 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 border border-zinc-800">
                                {reactor?.avatar && (reactor?.avatar.startsWith('http') || reactor?.avatar.startsWith('/') || reactor?.avatar.startsWith('data:image')) ? (
                                  <img referrerPolicy="no-referrer" src={reactor?.avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  typeof reactor?.avatar === 'string' ? reactor?.avatar.slice(0, 2) : '👤'
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white">{reactor?.name}</span>
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${reactor.color}`}>
                                    {reactor.label}
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono">{reactor.handle}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-2 py-1 rounded-lg">
                              <span className="text-base select-none">{token.icon}</span>
                              <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider font-mono">{token.label}</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
