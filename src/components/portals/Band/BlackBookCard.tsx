import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Band {
  id: string;
  name: string;
}

interface BlackBookCardProps {
  blackBookCardActiveSlot: string;
  setBlackBookCardActiveSlot: (slot: string) => void;
  setActiveTab: (tab: string) => void;
  activeBand: Band | null;
}

export default function BlackBookCard({
  blackBookCardActiveSlot,
  setBlackBookCardActiveSlot,
  setActiveTab,
  activeBand
}: BlackBookCardProps) {
  return (
    <div className="px-5 pt-4 pb-2">
      <motion.div 
        className="bg-[#0b0c10]/80 border border-purple-500/30 rounded-2xl p-4 transition-all duration-300 text-left relative overflow-hidden group hover:border-purple-400/60"
        animate={{
          boxShadow: [
            "0 0 12px rgba(168, 85, 247, 0.15)",
            "0 0 28px rgba(168, 85, 247, 0.45)",
            "0 0 12px rgba(168, 85, 247, 0.15)"
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Title right above the switcher */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 bg-[#a855f7]/20 rounded flex items-center justify-center">
            <span className="text-[#a855f7] font-bold font-mono text-[11px]">BB</span>
          </span>
          <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider transition-colors cursor-pointer hover:text-[#a855f7]" onClick={() => setActiveTab('black-book')}>
            <span className="text-[#a855f7]">Black Book</span> Directory
          </h4>
        </div>

        {/* Large Two Tab Style with separate background colors */}
        <div className="grid grid-cols-2 gap-2 border-b border-purple-500/10 pb-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setBlackBookCardActiveSlot('A'); }}
            className={`py-2 px-3 text-xs sm:text-[13px] font-mono uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
              blackBookCardActiveSlot === 'A' 
                ? 'bg-teal-950/40 border-teal-500/40 text-[#00ffcc] shadow-[0_0_15px_rgba(20,184,166,0.15)] font-black' 
                : 'bg-zinc-900/20 border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${blackBookCardActiveSlot === 'A' ? 'bg-[#00ffcc] animate-pulse shadow-[0_0_8px_#00ffcc]' : 'bg-zinc-700'}`} />
            <span>🛰️ Beacons</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setBlackBookCardActiveSlot('B'); }}
            className={`py-2 px-3 text-xs sm:text-[13px] font-mono uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
              blackBookCardActiveSlot === 'B' 
                ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)] font-black' 
                : 'bg-zinc-900/20 border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${blackBookCardActiveSlot === 'B' ? 'bg-[#c084fc] animate-pulse shadow-[0_0_8px_#c084fc]' : 'bg-zinc-700'}`} />
            <span>🏢 Venues</span>
          </button>
        </div>
        
        <div className="pt-3">
          <AnimatePresence mode="wait">
            {blackBookCardActiveSlot === 'A' ? (
              <motion.div
                key="A"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="mt-1"
              >
                <div className="bg-black border border-zinc-900 rounded-xl overflow-hidden font-mono text-left">
                  <div className="p-3 border-b border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-white tracking-wider">Active Signals</span>
                    </div>
                    <span className="text-[8.5px] text-[#00ffcc] uppercase tracking-widest">{activeBand?.name}</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {(() => {
                      const localStr = localStorage.getItem('nexus_core_routing_beacons_v1');
                      const beacons = localStr ? JSON.parse(localStr).filter((b: any) => b.band_name === activeBand?.name) : [];
                      return beacons.length > 0 ? (
                        <div className="divide-y divide-zinc-900">
                          {beacons.map((beacon: any, i: number) => {
                            const isExpired = new Date(beacon.end_date) < new Date();
                            return (
                              <div key={`bb-card-entry-${i}`} className={`p-3 transition-colors ${isExpired ? 'opacity-50' : 'hover:bg-[#0c0e12]'}`}>
                                <div className="flex justify-between items-start mb-1.5">
                                  <span className="text-xs font-bold text-[#00ffcc] uppercase">{beacon.target_region}</span>
                                  {isExpired ? (
                                    <span className="text-[8px] bg-red-900/30 text-red-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Expired</span>
                                  ) : (
                                    <span className="text-[8px] bg-[#00ffcc]/10 text-[#00ffcc] px-1.5 py-0.5 rounded font-black tracking-widest uppercase animate-pulse">Broadcasting</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-zinc-400">{beacon.start_date} <span className="mx-1 text-zinc-600">TO</span> {beacon.end_date}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">No active routing beacons</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('black-book')}
                  className="w-full mt-2 text-center text-[10px] uppercase font-mono tracking-wider text-zinc-500 hover:text-[#00ffcc] py-1 transition-colors"
                >
                  View Open Promoters & Active Signals
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="B"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-2 cursor-pointer group/item"
                onClick={() => setActiveTab('black-book')}
              >
                <p className="text-[11px] text-zinc-400 leading-normal text-left">
                  Route smarter. Book direct. Strip away expensive booking agent fees and bypass the gatekeepers with direct access to global talent buyers and independent venue contacts. Drop live Routing Beacons to broadcast your open dates straight to regional promoters, negotiate and lock down terms natively, and leverage real-world crew notes, load-in logistics, and honesty ratings to build a bulletproof itinerary.
                </p>
                
                <div className="flex justify-between items-center bg-black/40 border border-[#a855f7]/10 rounded-lg px-2.5 py-2">
                  <div className="flex -space-x-2">
                    {[1,2,3].map((i, _kIdx) => (
                      <div key={`${i}-${_kIdx}`} className={`w-5 h-5 rounded-full border-2 border-[#0b0c10] flex items-center justify-center bg-zinc-800`}>
                        <span className="text-[7px]">🎸</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[8.5px] font-mono text-[#a855f7] uppercase font-bold text-right tracking-wider group-hover/item:text-purple-300">
                    Tap to open directory →
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
