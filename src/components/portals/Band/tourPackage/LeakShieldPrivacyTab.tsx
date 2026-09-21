import React from 'react';
import { Lock, KeyRound, Megaphone, Edit3, ShieldCheck, Clock, Users } from 'lucide-react';

interface LeakShieldPrivacyTabProps {
  publicationStatus: 'embargoed_private' | 'confirmed_routing' | 'public_announced';
  embargoUntilDate: string;
  tourTitle: string;
  onOpenPrivacyModal: () => void;
  onPublish: () => void;
  onLock: () => void;
}

export const LeakShieldPrivacyTab: React.FC<LeakShieldPrivacyTabProps> = ({
  publicationStatus,
  embargoUntilDate,
  tourTitle,
  onOpenPrivacyModal,
  onPublish,
  onLock
}) => {
  return (
    <div className="space-y-4">
      {/* Main Status Header Card */}
      <div className={`p-4 rounded-xl border ${
        publicationStatus === 'embargoed_private'
          ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
          : publicationStatus === 'confirmed_routing'
          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
          : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              publicationStatus === 'embargoed_private'
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
                : publicationStatus === 'confirmed_routing'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
            }`}>
              {publicationStatus === 'embargoed_private' ? (
                <Lock className="w-5 h-5 stroke-[2.5]" />
              ) : publicationStatus === 'confirmed_routing' ? (
                <KeyRound className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Megaphone className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-tight">
                  {publicationStatus === 'embargoed_private'
                    ? 'Confidential & Embargoed Routing (Leak Shield Active)'
                    : publicationStatus === 'confirmed_routing'
                    ? 'Internal Confirmed Routing (Pre-Announce Locked)'
                    : 'Publicly Announced & Live Tour Package'}
                </h3>
              </div>
              <p className="text-[11px] text-zinc-300">
                {publicationStatus === 'embargoed_private'
                  ? 'All tour routing, guarantees, day sheets, and venue advances are strictly locked to internal TM workspace to prevent premature leakage.'
                  : publicationStatus === 'confirmed_routing'
                  ? 'Route holds and contracts are secured across package bands. Ready for artwork/press embargo clearance.'
                  : 'Tour is officially announced. Public flyer assets, discovery links, and venue tickets are live.'}
              </p>
            </div>
          </div>

          {/* Status Switcher Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPrivacyModal}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Change Mode
            </button>
          </div>
        </div>

        {/* Leak Shield Protection Safeguards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
          <div className="bg-black/60 p-3 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>External Feed Isolation</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              {publicationStatus === 'embargoed_private'
                ? 'Dates are isolated strictly inside Tour Manager and will NEVER sync to public discovery or unconfirmed feeds.'
                : 'Feeds synced for public announcement.'}
            </p>
          </div>

          <div className="bg-black/60 p-3 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-zinc-200">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Embargo Lift Target</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Target announce window: <strong className="text-white font-mono">{embargoUntilDate.replace('T', ' ')} EST</strong>. Advance info remains NDA-restricted.
            </p>
          </div>

          <div className="bg-black/60 p-3 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-zinc-200">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Package Band Access</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Shared day sheets and backline matrices are accessible only via direct SMS/WhatsApp advance links.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Leak Prevention Guidelines & Tour Announce Checklist */}
      <div className="bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 space-y-3 text-left">
        <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          Pre-Announcement Security &amp; Confirmation Checklist
        </h4>
        <div className="space-y-2">
          {[
            { label: 'All 3 Package Band Guarantees & Splits Signed', status: 'verified', note: 'Headliner 50%, Support #1 30%, Support #2 20%' },
            { label: 'Venue Deposits & Radius Clause Verification', status: 'verified', note: 'Radius restrictions cleared (>50 miles / 30 days)' },
            { label: 'Official Tour Artwork & Poster Asset Approved', status: 'pending', note: 'High-res 4K tour poster pending final graphic layout' },
            { label: 'Unified On-Sale & Announcement Time Synced', status: 'embargo', note: `Embargo scheduled for ${embargoUntilDate.replace('T', ' ')} EST across all artists` }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded bg-zinc-950/80 border border-zinc-900">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200 block">{item.label}</span>
                <span className="text-[10px] font-mono text-zinc-400">{item.note}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase ${
                item.status === 'verified'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : item.status === 'embargo'
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-950 text-amber-400 border border-amber-500/30'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Publish / Unpublish Action Button */}
        <div className="pt-2 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10.5px] text-zinc-400 font-mono">
            Current Mode: <strong className="text-white uppercase">{publicationStatus.replace('_', ' ')}</strong>
          </span>
          <div className="flex items-center gap-2">
            {publicationStatus !== 'public_announced' ? (
              <button
                type="button"
                onClick={onPublish}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5" />
                Confirm &amp; Announce Tour Publicly
              </button>
            ) : (
              <button
                type="button"
                onClick={onLock}
                className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-mono font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock Tour (Revert to Private Embargo)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
