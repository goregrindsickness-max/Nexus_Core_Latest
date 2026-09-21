import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Vote, Music, Sparkles, Plus, Trash2, Clock } from 'lucide-react';

interface PollCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollVariant: 'standard' | 'encore_setlist' | 'promoter_lineup';
  setPollVariant: (val: 'standard' | 'encore_setlist' | 'promoter_lineup') => void;
  pollQuestion: string;
  setPollQuestion: (val: string) => void;
  pollOptions: string[];
  setPollOptions: React.Dispatch<React.SetStateAction<string[]>>;
  pollIsTimed: boolean;
  setPollIsTimed: (val: boolean) => void;
  pollTimerDays: string;
  setPollTimerDays: (val: string) => void;
  pollTimerHours: string;
  setPollTimerHours: (val: string) => void;
  triggerNotification?: (msg: string) => void;
}

export const PollCreateModal: React.FC<PollCreateModalProps> = ({
  isOpen,
  onClose,
  pollVariant,
  setPollVariant,
  pollQuestion,
  setPollQuestion,
  pollOptions,
  setPollOptions,
  pollIsTimed,
  setPollIsTimed,
  pollTimerDays,
  setPollTimerDays,
  pollTimerHours,
  setPollTimerHours,
  triggerNotification,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0c0d10] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Vote className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest font-display">Create Interactive Poll</h3>
            </div>

            <div className="space-y-4">
              {/* Poll type selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Poll Purpose</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPollVariant('standard')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      pollVariant === 'standard'
                        ? 'bg-purple-950/40 border-purple-500/70 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                        : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400'
                    }`}
                  >
                    <Vote className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-wider">General</span>
                    <span className="text-[7px] text-zinc-500 mt-0.5 leading-tight">Standard Poll</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPollVariant('encore_setlist')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      pollVariant === 'encore_setlist'
                        ? 'bg-emerald-950/40 border-[#39ff14]/70 text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                        : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400'
                    }`}
                  >
                    <Music className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Encore Song</span>
                    <span className="text-[7px] text-zinc-500 mt-0.5 leading-tight">Band Setlist Request</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPollVariant('promoter_lineup')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      pollVariant === 'promoter_lineup'
                        ? 'bg-yellow-950/40 border-[#f3ff00]/70 text-[#f3ff00] shadow-[0_0_10px_rgba(243,255,0,0.2)]'
                        : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Lineup</span>
                    <span className="text-[7px] text-zinc-500 mt-0.5 leading-tight">Promoter Wishlist</span>
                  </button>
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Question / Prompt</label>
                <input 
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder={
                    pollVariant === 'encore_setlist'
                      ? "Which song should we play as tonight's final encore?"
                      : pollVariant === 'promoter_lineup'
                      ? "Who do you want to see most on our next showcase / fest?"
                      : "e.g., Best death metal release of 2026?"
                  }
                  className={`w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all ${
                    pollVariant === 'encore_setlist'
                      ? 'focus:border-emerald-900/50'
                      : pollVariant === 'promoter_lineup'
                      ? 'focus:border-yellow-900/50'
                      : 'focus:border-purple-900/50'
                  }`}
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1">Answers</label>
                <div className="max-h-42 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {pollOptions.map((option, idx) => (
                    <div key={`poll-create-opt-${idx}`} className="flex gap-2 items-center">
                      <span className="text-[10px] font-mono text-zinc-600 w-4 shrink-0">{idx + 1}.</span>
                      <input 
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                        placeholder={
                          pollVariant === 'encore_setlist'
                            ? `Encore Song Option ${idx + 1}`
                            : pollVariant === 'promoter_lineup'
                            ? `Band Option ${idx + 1}`
                            : `Option ${idx + 1}`
                        }
                        className={`flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all ${
                          pollVariant === 'encore_setlist'
                            ? 'focus:border-emerald-900/50'
                            : pollVariant === 'promoter_lineup'
                            ? 'focus:border-yellow-900/50'
                            : 'focus:border-purple-900/50'
                        }`}
                      />
                      {pollOptions.length > 2 && (
                        <button 
                          onClick={() => {
                            setPollOptions(pollOptions.filter((_, i) => i !== idx));
                          }}
                          className="text-zinc-600 hover:text-rose-400 p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mt-2 cursor-pointer ${
                    pollVariant === 'encore_setlist'
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : pollVariant === 'promoter_lineup'
                      ? 'text-yellow-400 hover:text-yellow-300'
                      : 'text-purple-400 hover:text-purple-300'
                  }`}
                >
                  <Plus className="w-3 h-3" /> Add Answer Option
                </button>
              </div>

              {/* Timed Poll */}
              <div className="pt-3 border-t border-zinc-900 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pollIsTimed}
                      onChange={(e) => setPollIsTimed(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/20 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-amber-400 font-extrabold uppercase text-[10px] tracking-wide">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> TIMED POLL / SET DEADLINE
                    </span>
                  </label>
                  {pollIsTimed && (
                    <span className="text-[9px] font-mono text-amber-400/80 uppercase font-bold">
                      {parseInt(pollTimerDays || '0') > 0 ? `${pollTimerDays}d ` : ''}{pollTimerHours}h limit
                    </span>
                  )}
                </div>

                {pollIsTimed && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-amber-500/30 space-y-2.5 animate-in fade-in duration-200">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Voting Closes In:</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: '1 HOUR', days: '0', hours: '1' },
                        { label: '24 HOURS', days: '1', hours: '0' },
                        { label: '3 DAYS', days: '3', hours: '0' },
                        { label: '7 DAYS', days: '7', hours: '0' },
                      ].map((preset, prIdx) => (
                        <button
                          key={`poll-preset-${preset.label}-${prIdx}`}
                          type="button"
                          onClick={() => {
                            setPollTimerDays(preset.days);
                            setPollTimerHours(preset.hours);
                          }}
                          className={`py-1.5 px-1 rounded text-[8px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                            pollTimerDays === preset.days && pollTimerHours === preset.hours
                              ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono text-zinc-400 font-bold shrink-0">Days:</span>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={pollTimerDays}
                        onChange={(e) => setPollTimerDays(e.target.value)}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] font-mono text-zinc-400 font-bold shrink-0">Hours:</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={pollTimerHours}
                        onChange={(e) => setPollTimerHours(e.target.value)}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={onClose}
                className="flex-1 bg-zinc-900 hover:bg-[#1a1c24] text-zinc-400 hover:text-white font-black text-xs uppercase tracking-widest py-2.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!pollQuestion.trim()) {
                    triggerNotification?.("Please enter a question.");
                    return;
                  }
                  if (pollOptions.filter(o => o.trim()).length < 2) {
                    triggerNotification?.("Please provide at least 2 non-empty answers.");
                    return;
                  }
                  onClose();
                  triggerNotification?.("Poll draft saved. Click Post to publish.");
                }}
                className={`flex-1 font-black text-xs uppercase tracking-widest py-2.5 rounded-lg shadow-lg transition-colors cursor-pointer ${
                  pollVariant === 'encore_setlist'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                    : pollVariant === 'promoter_lineup'
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-yellow-900/20'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
                }`}
              >
                Attach Poll
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
