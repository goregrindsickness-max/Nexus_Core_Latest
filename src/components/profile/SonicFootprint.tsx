import React, { useState, useEffect, useRef } from 'react';
import { Award, Zap, Disc, ShoppingBag, Radio, ChevronRight, Info, Sparkles, Trophy, Activity, CheckCircle2, History, ArrowUpRight, RotateCcw } from 'lucide-react';
import { 
  getSonicFootprint, 
  awardSonicPoints, 
  resetSonicFootprint,
  initializeSonicActivityListeners, 
  SonicMetricId, 
  SonicActivityItem,
  METRIC_LABELS 
} from '../../services/sonicFootprintService';

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
  instantActionLabel?: string;
  instantActionXP?: number;
}

export const calculateListenerMetrics = (profile: any): Record<string, ListenerMetric> => {
  const footprint = getSonicFootprint(profile);

  const getLevelInfo = (xp: number, titles: string[]) => {
    const levelNumber = Math.min(Math.floor(xp / 100) + 1, 10);
    const levelTitle = titles[levelNumber - 1] || titles[0];
    const percentage = Math.min(Math.round((xp / 1000) * 100), 100);
    return { levelNumber, levelTitle, percentage };
  };

  const pitInfo = getLevelInfo(footprint.show_attendance, [
    'Armchair Listener', 'Casual Attender', 'Show Regular', 'Pit Contender', 
    'Front Row Fiend', 'Stage Diver', 'Venue Veteran', 'Tour Follower', 'Scene Legend', 'Veteran Pit Resident'
  ]);

  const diggerInfo = getLevelInfo(footprint.crate_digger, [
    'Mainstage Listener', 'Demo Explorer', 'Tape Trader', 'Underground Loyalist', 
    'Obscure Finder', 'Demo Archivist', 'Deep Vault Digger', 'Rarity Hunter', 'Sub-Genre Historian', 'Vault Master'
  ]);

  const collectorInfo = getLevelInfo(footprint.physical_collector, [
    'Digital Streamer', 'Casual Supporter', 'Tee Collector', 'Patch Enthusiast', 
    'Vinyl Collector', 'Cassette Hoarder', 'Rare Merch Keeper', 'Vault Curator', 'Physical Purist', 'Master Archivist'
  ]);

  const signalInfo = getLevelInfo(footprint.signal_contributor, [
    'Silent Observer', 'Signal Reader', 'Occasional Voter', 'Pit Photographer', 
    'Reviewer', 'Setlist Curator', 'Scene Chronicler', 'Active Contributor', 'Lead Signal', 'Master Archivist'
  ]);

  return {
    show_attendance: {
      id: 'show_attendance',
      label: 'Pit Frequency',
      currentXP: footprint.show_attendance,
      percentage: pitInfo.percentage,
      levelNumber: pitInfo.levelNumber,
      levelTitle: pitInfo.levelTitle,
      description: 'Tracks your real-world attendance at live concerts, festival dates, and venue check-ins.',
      howToEarn: 'Earn +20 XP per verified ticket stub scan/RSVP and +5 XP for daily venue check-ins.',
      actionLabel: 'Find Upcoming Shows',
      instantActionLabel: 'Check In to Tonight\'s Gig',
      instantActionXP: 5
    },
    crate_digger: {
      id: 'crate_digger',
      label: 'Underground Loyalty',
      currentXP: footprint.crate_digger,
      percentage: diggerInfo.percentage,
      levelNumber: diggerInfo.levelNumber,
      levelTitle: diggerInfo.levelTitle,
      description: 'Measures active streaming of independent releases, Bandcamp audio, and underground demo reels.',
      howToEarn: 'Earn +2 XP per local demo stream, +5 XP per Bandcamp listen, and +15 XP for Bandcamp purchases.',
      actionLabel: 'Explore Music Vault',
      instantActionLabel: 'Stream Underground Demo',
      instantActionXP: 5
    },
    physical_collector: {
      id: 'physical_collector',
      label: 'Physical Collector',
      currentXP: footprint.physical_collector,
      percentage: collectorInfo.percentage,
      levelNumber: collectorInfo.levelNumber,
      levelTitle: collectorInfo.levelTitle,
      description: 'Reflects verified physical vinyl, cassette tape, patch, and official merch order ownership.',
      howToEarn: 'Earn +30 XP per Resale Closet order and +25 XP per official band merchandise purchase.',
      actionLabel: 'Browse Resale Closet',
      instantActionLabel: 'Log Physical Merch Scan',
      instantActionXP: 25
    },
    signal_contributor: {
      id: 'signal_contributor',
      label: 'Signal Contributor',
      currentXP: footprint.signal_contributor,
      percentage: signalInfo.percentage,
      levelNumber: signalInfo.levelNumber,
      levelTitle: signalInfo.levelTitle,
      description: 'Measures your ongoing contributions to community transmissions, forum debates, and polls.',
      howToEarn: 'Earn +10 XP per timeline transmission, +8 XP per forum discussion, and +3 XP per flame reaction.',
      actionLabel: 'Post to Photo Pit',
      instantActionLabel: 'Broadcast Scene Transmission',
      instantActionXP: 10
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
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [lastAwarded, setLastAwarded] = useState<{ metricId: string; amount: number; reason: string } | null>(null);
  const [liveData, setLiveData] = useState(() => getSonicFootprint(profile));

  useEffect(() => {
    initializeSonicActivityListeners();

    const handleXpAwarded = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setLiveData(getSonicFootprint(profile));
        setLastAwarded({
          metricId: detail.metricId,
          amount: detail.amount,
          reason: detail.reason
        });

        // Clear transient popup after 4 seconds
        setTimeout(() => {
          setLastAwarded(prev => (prev?.reason === detail.reason ? null : prev));
        }, 4000);
      }
    };

    const handleProfileUpdate = () => {
      setLiveData(getSonicFootprint(profile));
    };

    window.addEventListener('nexus_sonic_xp_awarded', handleXpAwarded);
    window.addEventListener('nexus_core_user_profile_updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('nexus_sonic_xp_awarded', handleXpAwarded);
      window.removeEventListener('nexus_core_user_profile_updated', handleProfileUpdate);
    };
  }, [profile]);

  const metrics = calculateListenerMetrics(profile);
  const totalXP = Object.values(metrics).reduce((sum, m) => sum + m.currentXP, 0);

  const toggleExpand = (id: string) => {
    setExpandedMetric(expandedMetric === id ? null : id);
  };

  const handleInstantAction = (metric: ListenerMetric) => {
    const metricId = metric.id as SonicMetricId;
    const amount = metric.instantActionXP || 5;
    const reason = metric.instantActionLabel || 'Scene interaction logged';
    
    awardSonicPoints(metricId, amount, reason);
  };

  return (
    <div className={`w-full space-y-3 py-2 ${className}`}>
      {/* Header Section with Live Status Indicator */}
      <div className="flex flex-col items-center justify-center pb-3 border-b border-zinc-800/80 text-center space-y-2">
        <div>
          <div className="flex items-center justify-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Activity className="text-purple-400" size={14} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200 font-mono">
              PERSONAL SONIC FOOTPRINT
            </h3>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
            Real-time app activity tracker & scene participation score
          </p>
        </div>

        {/* Live Total XP & Activity Ticker Button */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="px-3 py-1 bg-purple-950/70 border border-purple-800/70 rounded-full text-[11px] font-mono font-bold text-purple-300 shadow-sm shadow-purple-950 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>{totalXP.toLocaleString()} / 4,000 XP</span>
          </div>

          <button
            type="button"
            onClick={() => setShowActivityLog(!showActivityLog)}
            className="px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 rounded-full text-[10px] font-mono text-zinc-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            title="Toggle Live Activity Log"
          >
            <History className="w-3 h-3 text-emerald-400" />
            <span>{showActivityLog ? 'Hide Feed' : 'Live Activity'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const res = resetSonicFootprint();
              setLiveData(res);
              setLastAwarded({
                metricId: 'show_attendance',
                amount: 0,
                reason: 'XP reset to 0 — tracking live events forward'
              });
              setTimeout(() => setLastAwarded(null), 3000);
            }}
            className="px-2 py-1 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-full text-[9.5px] font-mono text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            title="Reset Sonic Footprint XP to 0"
          >
            <RotateCcw className="w-2.5 h-2.5 text-amber-400" />
            <span>Reset to 0</span>
          </button>
        </div>

        {/* Transient XP Award Notification Banner */}
        {lastAwarded && (
          <div className="w-full max-w-sm px-3 py-1.5 bg-emerald-950/90 border border-emerald-500/60 rounded-lg text-emerald-300 text-[10.5px] font-mono font-bold flex items-center justify-between gap-2 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-1.5 truncate">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
              <span className="truncate">{lastAwarded.reason}</span>
            </div>
            <span className="text-emerald-400 font-black shrink-0">+{lastAwarded.amount} XP</span>
          </div>
        )}
      </div>

      {/* Real-Time Activity Log Drawer */}
      {showActivityLog && (
        <div className="bg-zinc-950/95 border border-purple-900/40 rounded-xl p-3 space-y-2 text-left animate-in fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Activity Telemetry</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-500">Live Recording</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {liveData.activities && liveData.activities.length > 0 ? (
              liveData.activities.map((act) => (
                <div key={act.id} className="flex items-center justify-between text-[9.5px] font-mono bg-zinc-900/60 border border-zinc-800/60 rounded px-2 py-1">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-zinc-300 truncate">{act.reason}</span>
                  </div>
                  <span className="text-purple-300 font-bold shrink-0">+{act.amount} XP</span>
                </div>
              ))
            ) : (
              <div className="text-center py-3 text-[10px] font-mono text-zinc-500">
                No recent activity recorded yet. Stream tracks, make posts, or RSVP to earn points!
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2x2 Full Width Grid */}
      <div className="grid grid-cols-2 gap-2">
        {Object.values(metrics).map((metric, idx) => {
          const isExpanded = expandedMetric === metric.id;
          const isRecentlyAwarded = lastAwarded?.metricId === metric.id;

          return (
            <div
              key={`${metric.id}-${idx}`}
              className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'col-span-2 bg-zinc-900 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                  : isRecentlyAwarded
                  ? 'col-span-1 bg-zinc-900/80 border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
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
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isRecentlyAwarded ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-ping' : 'bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]'}`} />
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
                <div className="px-3 pb-3 pt-1 border-t border-zinc-800/60 bg-zinc-950/60 space-y-2.5 animate-in fade-in slide-in-from-top-1 text-left">
                  <p className="text-[11px] text-zinc-300 leading-relaxed mt-1 font-mono">
                    {metric.description}
                  </p>

                  <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800 text-[10px]">
                    <span className="font-bold text-purple-300 uppercase tracking-wider block mb-0.5 font-mono flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-400" /> HOW TO EARN:
                    </span>
                    <span className="text-zinc-400 font-mono">{metric.howToEarn}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    {/* Instant Action Trigger */}
                    {metric.instantActionLabel && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInstantAction(metric);
                        }}
                        className="flex-1 py-1.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-200 text-[10px] font-bold rounded-lg transition-all text-center uppercase tracking-wider font-mono cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>{metric.instantActionLabel} (+{metric.instantActionXP} XP)</span>
                      </button>
                    )}

                    {metric.actionLabel && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onActionClick?.(metric.actionLabel!, metric.id);
                        }}
                        className="flex-1 py-1.5 px-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 text-purple-200 text-[10px] font-bold rounded-lg transition-all text-center uppercase tracking-wider font-mono cursor-pointer"
                      >
                        {metric.actionLabel} →
                      </button>
                    )}
                  </div>
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
