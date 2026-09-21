import React, { useState, useEffect } from 'react';
import { 
  Check, 
  RotateCw, 
  ShieldCheck, 
  Settings, 
  Terminal, 
  Layers, 
  Volume2, 
  Camera, 
  PenTool, 
  Activity, 
  BookOpen 
} from 'lucide-react';

export interface PromoterWorkspaceProtocolsProps {
  workerCategory: 'visual' | 'audio' | 'media';
  activeProtocols?: Record<string, boolean>; // map of item.id -> isEnforced
  isEditableByBand?: boolean;
  onProtocolsChange?: (protocols: Record<string, boolean>) => void;
  onAllCompletedChange?: (completed: boolean) => void;
  onSubmitVerification?: () => void;
  verifiedProtocols?: Record<string, boolean>; // initial list of completed items
  onCompletedItemsChange?: (completed: Record<string, boolean>) => void; // call when check items are modified
}

interface ProtocolItem {
  id: string;
  title: string;
  desc: string;
}

export default function PromoterWorkspaceProtocols({
  workerCategory,
  activeProtocols = {},
  isEditableByBand = false,
  onProtocolsChange,
  onAllCompletedChange,
  onSubmitVerification,
  verifiedProtocols = {},
  onCompletedItemsChange
}: PromoterWorkspaceProtocolsProps) {
  // Define standard parameters per category
  const protocolDatabase: Record<'visual' | 'audio' | 'media', ProtocolItem[]> = {
    visual: [
      { 
        id: 'visual-1', 
        title: 'High-Resolution Vector Export', 
        desc: 'Export the final promoter asset in a clean, high-quality vector format.' 
      },
      { 
        id: 'visual-2', 
        title: 'Layered Print-Ready Files', 
        desc: 'Organize files into clean, easy-to-use print layers for production.' 
      }
    ],
    audio: [
      { 
        id: 'audio-1', 
        title: 'Audio Volume & EQ Balance Check', 
        desc: 'Assure standard audio playback levels are clean, balanced, and free of peak clipping.' 
      },
      { 
        id: 'audio-2', 
        title: 'Master Audio Stem Archives', 
        desc: 'Save and document all individual raw track stems into standard zip archives.' 
      }
    ],
    media: [
      { 
        id: 'media-1', 
        title: 'Video Footage Quality Review', 
        desc: 'Check raw clips to ensure they are crisp, clean, and completely free of frame defects.' 
      },
      { 
        id: 'media-2', 
        title: 'High-Res Video File Backups', 
        desc: 'Store clean original-resolution video formats and secure master backups.' 
      }
    ]
  };

  const visibleItems = protocolDatabase[workerCategory] || [];

  // Internal local states for toggle/checkbox selections
  const [localActive, setLocalActive] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    visibleItems.forEach(item => {
      initial[item.id] = activeProtocols[item.id] !== undefined ? activeProtocols[item.id] : true;
    });
    return initial;
  });

  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => verifiedProtocols || {});

  // Sync state if activeProtocols, category shifts, or verifiedProtocols change
  useEffect(() => {
    const updated: Record<string, boolean> = {};
    visibleItems.forEach(item => {
      updated[item.id] = activeProtocols[item.id] !== undefined ? activeProtocols[item.id] : true;
    });
    setLocalActive(updated);
    setCompletedItems(verifiedProtocols || {});
  }, [workerCategory, JSON.stringify(activeProtocols), JSON.stringify(verifiedProtocols)]);

  // Handle Band editing toggle switches
  const handleToggleBandProtocol = (id: string) => {
    const nextState = {
      ...localActive,
      [id]: !localActive[id]
    };
    setLocalActive(nextState);
    if (onProtocolsChange) {
      onProtocolsChange(nextState);
    }
  };

  // Handle Freelancer checklist checkbox selection
  const handleToggleFreelancerCheck = (id: string) => {
    const nextCompleted = {
      ...completedItems,
      [id]: !completedItems[id]
    };
    setCompletedItems(nextCompleted);
    if (onCompletedItemsChange) {
      onCompletedItemsChange(nextCompleted);
    }
  };

  // Determine active enforced items
  const enforcedItems = visibleItems.filter(item => isEditableByBand || localActive[item.id] === true);
  const activeEnforcedCount = visibleItems.filter(item => localActive[item.id] === true).length;

  // Check if freelancer completed all active, enforced check-items
  const allActiveChecked = visibleItems
    .filter(item => localActive[item.id] === true)
    .every(item => completedItems[item.id] === true);

  // Propagate completion callback to parent components
  useEffect(() => {
    if (onAllCompletedChange) {
      onAllCompletedChange(allActiveChecked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allActiveChecked]);

  const getCategoryIcon = () => {
    switch (workerCategory) {
      case 'visual': return <PenTool className="text-violet-400 w-4.5 h-4.5 animate-pulse" />;
      case 'audio': return <Volume2 className="text-emerald-400 w-4.5 h-4.5" />;
      case 'media': return <Camera className="text-sky-400 w-4.5 h-4.5" />;
    }
  };

  return (
    <div className="bg-[#07080b] border border-zinc-850 hover:border-violet-500/20 transition-all duration-300 p-6 rounded-2xl space-y-4 select-none relative overflow-hidden flex flex-col items-center justify-center text-center">
      
      <div className="flex flex-col items-center justify-center gap-2 pb-2.5 border-b border-zinc-900 w-full text-center">
        <div className="flex items-center justify-center gap-2">
          {getCategoryIcon()}
          <span className="text-sm font-black text-white tracking-widest uppercase font-sans">
            Production Quality Checklist
          </span>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed text-center max-w-sm mx-auto">
        {isEditableByBand 
          ? "Set the standard quality checks required for your project deliverables before the payout release is authorized." 
          : "Please complete and check off the standard quality steps below to authorize release of final reservation funds."
        }
      </p>

      {/* RENDER FOR BAND CREATION WORKFLOW WITH TOGGLE SWITCHES */}
      {isEditableByBand ? (
        <div className="space-y-3 pt-1 w-full max-w-4xl mx-auto">
          {visibleItems.map((item, idx) => {
            const isEnforced = localActive[item.id] === true;
            return (
              <div 
                key={`${item.id}-${idx}`} 
                className={`p-4 border transition-all duration-205 flex flex-row items-center justify-between text-left gap-4 cursor-pointer rounded-none ${
                  isEnforced 
                    ? 'bg-zinc-950/80 border-violet-500/40' 
                    : 'bg-[#030406] border-zinc-900 opacity-65 hover:opacity-100'
                }`}
                onClick={() => handleToggleBandProtocol(item.id)}
              >
                <div className="flex-1 space-y-1">
                  <span className="text-white text-xs font-bold block uppercase tracking-wide w-full">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-zinc-400 block max-w-full leading-normal">
                    {item.desc}
                  </span>
                </div>

                {/* Simplified Toggle representation */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 select-none">
                  <span className={`text-[8.5px] font-bold tracking-wider ${isEnforced ? 'text-violet-400 font-mono' : 'text-zinc-600'}`}>
                    {isEnforced ? '✓ REQUIRED' : 'OPTIONAL'}
                  </span>
                  <div className={`w-8 h-4 border p-0.5 transition-all flex rounded-full ${
                    isEnforced 
                      ? 'border-violet-500/80 bg-zinc-950/60 justify-end' 
                      : 'border-zinc-805 bg-black justify-start'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isEnforced ? 'bg-violet-400' : 'bg-zinc-700'}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* RENDER FOR FREELANCER WITH CHECKBOXES */
        <div className="space-y-3 pt-1 w-full max-w-4xl mx-auto">
          {activeEnforcedCount === 0 ? (
            <div className="p-5 border border-dashed border-zinc-900 text-center bg-zinc-950/40">
              <span className="text-zinc-550 text-[11px] tracking-wide block">
                No active production checks required for this service tier.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5 w-full">
                {visibleItems
                  .filter(item => localActive[item.id] === true)
                  .map((item, idx) => {
                    const isChecked = completedItems[item.id] === true;
                    return (
                      <div 
                        key={`${item.id}-${idx}`} 
                        className={`w-full py-3 px-4 border transition-all duration-200 flex flex-row items-center justify-start text-left gap-4 cursor-pointer rounded-none ${
                          isChecked 
                            ? 'bg-zinc-950 border-emerald-500/40 text-emerald-300' 
                            : 'bg-[#030406] border-zinc-900 text-zinc-400 hover:border-zinc-800'
                        }`}
                        onClick={() => handleToggleFreelancerCheck(item.id)}
                      >
                        {/* Centered Checkbox */}
                        <div className="flex items-center justify-center select-none shrink-0 whitespace-nowrap">
                          <div className={`flex items-center justify-center transition-all min-w-[24px] ${
                            isChecked 
                              ? 'text-emerald-400' 
                              : 'text-zinc-700'
                          }`}>
                            {isChecked ? <span className="font-extrabold pb-0.5 whitespace-nowrap">[✓]</span> : <span className="font-extrabold pb-0.5 whitespace-nowrap">[•]</span>}
                          </div>
                        </div>

                        <div className="leading-snug">
                          <span 
                            className={`text-xs font-bold block uppercase tracking-widest transition-colors ${isChecked ? 'text-white' : 'text-zinc-400'}`}
                          >
                            {item.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* STATUS ACTION MATRICES */}
              <div className="pt-2 w-full text-center flex flex-col items-center">
                {/* primary submit button */}
                <button
                  disabled={!allActiveChecked}
                  onClick={() => {
                    if (allActiveChecked && onSubmitVerification) {
                      onSubmitVerification();
                    }
                  }}
                  className={`w-full text-xs font-black uppercase tracking-widest py-4 px-5 transition-all duration-200 cursor-pointer rounded-none ${
                    allActiveChecked
                      ? 'bg-zinc-950 border-2 border-[#39ff14] text-[#39ff14] shadow-[0_0_15px_rgba(57,255,20,0.15)] active:scale-[0.98]'
                      : 'bg-black border border-zinc-900 text-zinc-700 cursor-not-allowed'
                  }`}
                >
                  Complete Work & Release Payout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
