import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Users,
  AlertTriangle,
  ArrowRight,
  Archive,
  Layers,
  Heart
} from 'lucide-react';
import { CommunityBandRecord, communityBandManager } from '../../../lib/communityBands';

interface BandClaimHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandRecord: CommunityBandRecord;
  currentUserId: string;
  onClaimSuccess: (claimedBand: CommunityBandRecord) => void;
}

export const BandClaimHandoverModal: React.FC<BandClaimHandoverModalProps> = ({
  isOpen,
  onClose,
  bandRecord,
  currentUserId,
  onClaimSuccess
}) => {
  const [confirming, setConfirming] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleConfirmClaim = () => {
    setConfirming(true);
    try {
      const result = communityBandManager.claimBandHandover(
        bandRecord.id,
        currentUserId
      );
      setIsDone(true);
      setTimeout(() => {
        onClaimSuccess(result.bandRecord);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000005] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#090a0f] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-850 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-display uppercase tracking-wide">
                  Official Artist Claim & Verification Handover
                </h3>
                <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  CONFIRMED MATCH
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                Claiming fan-curated archive for <strong className="text-white">{bandRecord.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Community Foundation Summary */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-950/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={bandRecord.avatar_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
              />
              <div>
                <h4 className="text-sm font-bold text-white font-display">{bandRecord.name}</h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {bandRecord.genre} • {bandRecord.city || bandRecord.country || 'Global'}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Curated by: <span className="text-amber-400">{bandRecord.curated_by || '@fan_archivist'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-sm font-black text-white font-mono block">
                  {bandRecord.followers_count || 240}
                </span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase">Existing Followers</span>
              </div>
              <div className="border-l border-zinc-800 pl-4">
                <span className="text-sm font-black text-white font-mono block">
                  {bandRecord.discography?.length || 0}
                </span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase">Catalog Items</span>
              </div>
            </div>
          </div>

          {/* Seamless Handover Guarantee Info */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-wider">
                Full Profile & Catalog Handover
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Everything on this community band page—including the complete discography, tracklists, lineup, photos, biography, genres, and streaming links—will be <strong>passed along exactly as is</strong> to your official band ownership.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="text-[11px] font-mono text-emerald-300/90 bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-800/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>100% Discography Intact</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-300/90 bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-800/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Lineup & Bios Preserved</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-300/90 bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-800/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Followers Inherited</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 italic pt-0.5">
              Nothing is ever wiped. Once claimed, you can freely modify, add, or update any detail at your convenience from your Band Workspace settings.
            </p>
          </div>

          {/* Fan Contributor Respect Banner */}
          <div className="p-3 rounded-xl border border-zinc-850 bg-zinc-950/40 flex items-center gap-3">
            <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-[11px] text-zinc-400">
              The founding fan curator (<span className="text-zinc-200 font-mono">{bandRecord.curated_by || 'Fan Archivist'}</span>) will be credited as a <em>Founding Community Contributor</em> on your profile credits.
            </p>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono font-bold uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClaim}
              disabled={confirming || isDone}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg"
            >
              {isDone ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Claimed & Verified!
                </>
              ) : confirming ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Ownership...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Confirm & Claim Band Page
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BandClaimHandoverModal;
