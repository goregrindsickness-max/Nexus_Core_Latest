import React, { useState } from 'react';
import { X, Rocket } from 'lucide-react';
import { FeedPost } from '../types';

interface BoostPostModalProps {
  post: FeedPost;
  monthlyBoostUsed: boolean;
  onClose: () => void;
  onConfirmBoost: (postId: string, plan: 'free' | 'paid_24h' | 'paid_3d', auraColor: 'blue' | 'purple') => void;
}

export const BoostPostModal: React.FC<BoostPostModalProps> = ({
  post,
  monthlyBoostUsed,
  onClose,
  onConfirmBoost,
}) => {
  const [selectedBoostPlan, setSelectedBoostPlan] = useState<'free' | 'paid_24h' | 'paid_3d'>('free');
  const [selectedAuraColor, setSelectedAuraColor] = useState<'blue' | 'purple'>('purple');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <div className="bg-[#0f1015] border border-purple-500/40 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.25)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-rose-600 p-0.5 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-purple-400">
              <Rocket className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span>Boost Post</span>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">24H PIT REACH</span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Amplify reach & move signal to top of feed</p>
          </div>
        </div>

        {/* Monthly perk banner */}
        <div className={`p-3 rounded-xl border mb-4 font-mono text-xs flex items-center justify-between transition-all ${
          !monthlyBoostUsed 
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-base">🎁</span>
            <div>
              <div className="font-bold text-white text-[11px]">Monthly Perk Allowance</div>
              <div className="text-[10px] text-zinc-400">
                {!monthlyBoostUsed ? '1 Free Monthly Boost Available' : 'Monthly free credit claimed (Refills next month)'}
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            !monthlyBoostUsed ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'
          }`}>
            {!monthlyBoostUsed ? '1 READY' : 'CLAIMED'}
          </span>
        </div>

        {/* Package Options */}
        <div className="space-y-2 mb-4">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Select Boost Tier:
          </label>

          {/* Free option */}
          <button
            type="button"
            onClick={() => {
              if (!monthlyBoostUsed) setSelectedBoostPlan('free');
            }}
            disabled={monthlyBoostUsed}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left relative ${
              selectedBoostPlan === 'free' && !monthlyBoostUsed
                ? 'border-emerald-500 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : monthlyBoostUsed
                ? 'border-zinc-800 bg-zinc-900/30 opacity-60 cursor-not-allowed'
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                selectedBoostPlan === 'free' && !monthlyBoostUsed ? 'border-emerald-400 bg-emerald-500' : 'border-zinc-600'
              }`}>
                {selectedBoostPlan === 'free' && !monthlyBoostUsed && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>1 Free Monthly Boost (24 Hours)</span>
                  {!monthlyBoostUsed && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">AVAILABLE</span>}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">Top feed priority + custom neon aura</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-black text-emerald-400 font-mono">$0.00</div>
              <div className="text-[9px] text-zinc-500 font-mono">1 Perk Credit</div>
            </div>
          </button>

          {/* $1 24hr option */}
          <button
            type="button"
            onClick={() => setSelectedBoostPlan('paid_24h')}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
              selectedBoostPlan === 'paid_24h'
                ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                selectedBoostPlan === 'paid_24h' ? 'border-purple-400 bg-purple-500' : 'border-zinc-600'
              }`}>
                {selectedBoostPlan === 'paid_24h' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">$1.00 - 24hr Pit Boost</div>
                <div className="text-[10px] font-mono text-purple-300 mt-0.5">Top feed placement + neon border</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-black text-purple-400 font-mono">$1.00</div>
              <div className="text-[9px] text-zinc-500 font-mono">Micro-Boost</div>
            </div>
          </button>

          {/* $2.50 3-day option */}
          <button
            type="button"
            onClick={() => setSelectedBoostPlan('paid_3d')}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
              selectedBoostPlan === 'paid_3d'
                ? 'border-sky-500 bg-sky-950/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                selectedBoostPlan === 'paid_3d' ? 'border-sky-400 bg-sky-500' : 'border-zinc-600'
              }`}>
                {selectedBoostPlan === 'paid_3d' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">$2.50 - 3-Day Pro Blast</div>
                <div className="text-[10px] font-mono text-sky-300 mt-0.5">Extended 72-hour top feed priority</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-black text-sky-400 font-mono">$2.50</div>
              <div className="text-[9px] text-zinc-500 font-mono">Extended</div>
            </div>
          </button>
        </div>

        {/* Choose Glow Aura Color */}
        <div className="mb-4">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Choose Post Aura Glow Color:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedAuraColor('purple')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                selectedAuraColor === 'purple'
                  ? 'border-purple-500 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.3)] text-purple-300'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-white">Royal Purple</div>
                <div className="text-[9px] font-mono text-purple-400">Industry Pro / Artist</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAuraColor('blue')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                selectedAuraColor === 'blue'
                  ? 'border-sky-400 bg-sky-950/40 shadow-[0_0_15px_rgba(56,189,248,0.3)] text-sky-300'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)] shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-white">Electric Blue</div>
                <div className="text-[9px] font-mono text-sky-400">Fan & Supporter</div>
              </div>
            </button>
          </div>
        </div>

        {/* Live Card Glow Preview Box */}
        <div className="mb-4 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
          <div className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Feed Aura Live Preview
          </div>
          <div className={`p-2.5 rounded-lg border bg-[#0d0e11] transition-all ${
            selectedAuraColor === 'purple'
              ? 'border-purple-500/90 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
              : 'border-sky-400/90 shadow-[0_0_20px_rgba(56,189,248,0.35)]'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
              <span className={`flex items-center gap-1 ${selectedAuraColor === 'purple' ? 'text-purple-300' : 'text-sky-300'}`}>
                <Rocket className="w-3 h-3 animate-pulse" /> ⚡ 24H PIT BOOSTED
              </span>
              <span className="text-zinc-500 text-[9px]">Preview</span>
            </div>
            <div className="text-xs font-mono text-white truncate font-bold">{post.authorName}</div>
            <div className="text-[11px] text-zinc-300 truncate mt-0.5">{post.message || 'Check out this post!'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl font-mono text-xs font-bold uppercase transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => onConfirmBoost(post.id, selectedBoostPlan, selectedAuraColor)}
            className={`w-2/3 py-2.5 text-black rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 ${
              selectedBoostPlan === 'free'
                ? 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                : selectedAuraColor === 'purple'
                ? 'bg-purple-400 hover:bg-purple-300 shadow-[0_0_20px_rgba(192,132,252,0.3)]'
                : 'bg-sky-400 hover:bg-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>
              {selectedBoostPlan === 'free' ? 'Claim Free Boost' : `Confirm ($${selectedBoostPlan === 'paid_24h' ? '1.00' : '2.50'})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
