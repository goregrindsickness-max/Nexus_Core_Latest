import React, { useState, useEffect, useRef } from 'react';
import { Award, Zap, Disc, ShoppingBag, Radio, ChevronRight, Info, Sparkles, Trophy, Activity } from 'lucide-react';

const MarqueeText = ({ text, className }: { text: string; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    checkOverflow();
    // Re-check after a short delay to account for rendering shifts
    const timer = setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden whitespace-nowrap w-full flex items-center ${className}`}>
      <span
        ref={textRef}
        className={`inline-block ${isOverflowing ? 'animate-marquee' : ''}`}
        style={isOverflowing ? { paddingRight: '20px' } : {}}
      >
        {text}
      </span>
      {isOverflowing && (
        <style>{`
          @keyframes marquee {
            0%, 15% { transform: translateX(0); }
            85%, 100% { transform: translateX(calc(-100% + ${containerRef.current?.clientWidth || 80}px)); }
          }
          .animate-marquee {
            animation: marquee 5s linear infinite alternate;
          }
        `}</style>
      )}
    </div>
  );
};

export interface ListenerMetric {
  id: string;
  label: string;
  currentXP: number; // 0 to 1000
  percentage: number; // (currentXP / 1000) * 100
  levelNumber: number; // 1 to 10
  levelTitle: string;
  description: string;
  howToEarn: string;
  actionLabel?: string;
}

export const calculateListenerMetrics = (profile: any): Record<string, ListenerMetric> => {
  // Pull from real Supabase profile columns, defaulting strictly to 0
  const pitXP = Math.min(profile?.pit_frequency ?? profile?.show_attendance ?? profile?.pit_xp ?? 0, 1000);
  const diggerXP = Math.min(profile?.underground_loyalty ?? profile?.crate_digger ?? profile?.loyalty_xp ?? 0, 1000);
  const collectorXP = Math.min(profile?.physical_collector ?? profile?.merch_collector ?? profile?.collector_xp ?? 0, 1000);
  const signalXP = Math.min(profile?.signal_contributor ?? profile?.community_signal ?? profile?.signal_xp ?? 0, 1000);

  const getLevelInfo = (xp: number, titles: string[]) => {
    // 100 XP per level (0-99 = Lvl 1, 100-199 = Lvl 2, ..., 900-1000 = Lvl 10)
    const levelNumber = Math.min(Math.floor(xp / 100) + 1, 10);
    const levelTitle = titles[levelNumber - 1] || titles[0];
    const percentage = Math.min(Math.round((xp / 1000) * 100), 100);
    return { levelNumber, levelTitle, percentage };
  };

  const pitInfo = getLevelInfo(pitXP, [
    'Armchair Listener', 'Casual Attender', 'Show Regular', 'Pit Contender', 
    'Front Row Fiend', 'Stage Diver', 'Venue Veteran', 'Tour Follower', 'Scene Legend', 'Veteran Pit Resident'
  ]);

  const diggerInfo = getLevelInfo(diggerXP, [
    'Mainstage Listener', 'Demo Explorer', 'Tape Trader', 'Underground Loyalist', 
    'Obscure Finder', 'Demo Archivist', 'Deep Vault Digger', 'Rarity Hunter', 'Sub-Genre Historian', 'Vault Master'
  ]);

  const collectorInfo = getLevelInfo(collectorXP, [
    'Digital Streamer', 'Casual Supporter', 'Tee Collector', 'Patch Enthusiast', 
    'Vinyl Collector', 'Cassette Hoarder', 'Rare Merch Keeper', 'Vault Curator', 'Physical Purist', 'Master Archivist'
  ]);

  const signalInfo = getLevelInfo(signalXP, [
    'Silent Observer', 'Signal Reader', 'Occasional Voter', 'Pit Photographer', 
    'Reviewer', 'Setlist Curator', 'Scene Chronicler', 'Active Contributor', 'Lead Signal', 'Master Archivist'
  ]);

  return {
    show_attendance: {
      id: 'show_attendance',
      label: 'Pit Frequency',
      currentXP: pitXP,
      percentage: pitInfo.percentage,
      levelNumber: pitInfo.levelNumber,
      levelTitle: pitInfo.levelTitle,
      description: 'Tracks your real-world attendance at live concerts and festival dates over time.',
      howToEarn: 'Earn +20 XP per verified ticket stub scan and +5 XP for daily venue check-ins.',
      actionLabel: 'Find Upcoming Shows'
    },
    crate_digger: {
      id: 'crate_digger',
      label: 'Underground Loyalty',
      currentXP: diggerXP,
      percentage: diggerInfo.percentage,
      levelNumber: diggerInfo.levelNumber,
      levelTitle: diggerInfo.levelTitle,
      description: 'Measures long-term support for independent, unsigned, and underground acts.',
      howToEarn: 'Earn +2 XP per local demo stream and +15 XP for digital vault album purchases.',
      actionLabel: 'Explore Music Vault'
    },
    physical_collector: {
      id: 'physical_collector',
      label: 'Physical Collector',
      currentXP: collectorXP,
      percentage: collectorInfo.percentage,
      levelNumber: collectorInfo.levelNumber,
      levelTitle: collectorInfo.levelTitle,
      description: 'Reflects physical vinyl, tape, and official merch ownership history.',
      howToEarn: 'Earn +30 XP per Resale Closet transaction and +25 XP per band merch purchase.',
      actionLabel: 'Browse Resale Closet'
    },
    signal_contributor: {
      id: 'signal_contributor',
      label: 'Signal Contributor',
      currentXP: signalXP,
      percentage: signalInfo.percentage,
      levelNumber: signalInfo.levelNumber,
      levelTitle: signalInfo.levelTitle,
      description: 'Measures your ongoing contributions to the community social ecosystem.',
      howToEarn: 'Earn +5 XP per Photo Pit upload, +3 XP per show review or setlist poll created.',
      actionLabel: 'Post to Photo Pit'
    }
  };
};

interface SonicFootprintProps {
  profile?: any;
  onActionClick?: (actionLabel: string, metricId: string) => void;
  className?: string;
}

export const SonicFootprint: React.FC<SonicFootprintProps> = ({ profile, onActionClick, className = '' }) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const metrics = calculateListenerMetrics(profile);
  const totalXP = Object.values(metrics).reduce((sum, m) => sum + m.currentXP, 0);

  const toggleExpand = (id: string) => {
    setExpandedMetric(expandedMetric === id ? null : id);
  };

  return (
    <div className={`w-full space-y-3 py-2 ${className}`}>
      {/* Header Section with Micro-Description */}
      <div className="flex flex-col items-center justify-center pb-3 border-b border-zinc-800/80 text-center space-y-2">
        <div>
          <div className="flex items-center justify-center space-x-2">
            <Activity className="text-purple-400" size={14} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200 font-mono">
              PERSONAL SONIC FOOTPRINT
            </h3>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            Earn points for your scene participation
          </p>
        </div>
        <div className="px-3 py-1 bg-purple-950/70 border border-purple-800/70 rounded-full text-[11px] font-mono font-bold text-purple-300 shadow-sm shadow-purple-950">
          {totalXP.toLocaleString()} / 4,000 XP
        </div>
      </div>

      {/* 2x2 Full Width Grid */}
      <div className="grid grid-cols-2 gap-2">
        {Object.values(metrics).map((metric, idx) => {
          const isExpanded = expandedMetric === metric.id;

          return (
            <div
              key={`${metric.id}-${idx}`}
              className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'col-span-2 bg-zinc-900 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                  : 'col-span-1 bg-zinc-900/40 border-zinc-800/80 hover:border-purple-800/50 hover:bg-zinc-900/60'
              }`}
            >
              {/* Card Face */}
              <div
                onClick={() => toggleExpand(metric.id)}
                className="p-3 cursor-pointer select-none space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                    <MarqueeText text={metric.label} className="text-[11px] font-bold uppercase tracking-wider text-zinc-100 font-mono" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-300 shrink-0 ml-1">
                    Lvl {metric.levelNumber}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800/80">
                  <div
                    className="bg-gradient-to-r from-purple-600 via-purple-500 to-violet-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5">
                  <div className="min-w-0 flex-1 pr-1">
                    <MarqueeText text={metric.levelTitle} className="text-zinc-400" />
                  </div>
                  <span className="shrink-0">{metric.currentXP} XP</span>
                </div>
              </div>

              {/* Expanded Details Drawer */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-zinc-800/60 bg-zinc-950/60 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[11px] text-zinc-300 leading-relaxed mt-1 font-mono">
                    {metric.description}
                  </p>

                  <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800 text-[10px]">
                    <span className="font-bold text-purple-300 uppercase tracking-wider block mb-0.5 font-mono">
                      ⚡ HOW TO EARN:
                    </span>
                    <span className="text-zinc-400 font-mono">{metric.howToEarn}</span>
                  </div>

                  {metric.actionLabel && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onActionClick?.(metric.actionLabel!, metric.id);
                      }}
                      className="w-full py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 text-purple-200 text-[10px] font-bold rounded-lg transition-all text-center uppercase tracking-wider font-mono cursor-pointer"
                    >
                      {metric.actionLabel} →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SonicFootprintListener = SonicFootprint;

export default SonicFootprint;
