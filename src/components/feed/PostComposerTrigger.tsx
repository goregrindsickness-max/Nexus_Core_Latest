import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

// Reversible A/B test flag: set to false to immediately restore the inline composer card
export const ENABLE_COMPACT_COMPOSER_STRIP_AB_TEST = true;

export interface PostComposerTriggerProps {
  avatarUrl?: string;
  personaName: string;
  postingLabel: string;
  onOpenComposer: () => void;
}

export const PostComposerTrigger: React.FC<PostComposerTriggerProps> = ({
  avatarUrl,
  personaName,
  postingLabel,
  onOpenComposer,
}) => {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-2 pb-1.5 sm:px-4">
      <div className="w-full flex items-center gap-2 sm:gap-2.5 select-none">
        {/* Left: Active user/entity avatar with small badge & tooltip */}
        <button
          type="button"
          onClick={onOpenComposer}
          title={`Posting as ${postingLabel}`}
          aria-label={`Posting as ${postingLabel}. Open post composer`}
          className="flex flex-col items-center shrink-0 cursor-pointer group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-900 border border-purple-500/45 group-hover:border-teal-400/70 flex items-center justify-center transition-colors shadow-[0_0_10px_rgba(168,85,247,0.2)]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={personaName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xs font-black text-zinc-300">
                {(postingLabel || personaName || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="-mt-2 relative z-10 px-1.5 py-[2px] rounded-full bg-[#09080f] border border-purple-500/50 text-[8px] font-mono font-bold leading-none text-purple-200 max-w-[60px] truncate shadow-sm">
            {postingLabel}
          </span>
        </button>

        {/* Center: Recessed dark rounded pill input affordance */}
        <button
          type="button"
          onClick={onOpenComposer}
          className="flex-1 min-w-0 bg-zinc-900/90 border border-white/10 hover:border-teal-400/45 hover:bg-zinc-900 rounded-full px-3.5 sm:px-4 py-2.5 text-left transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        >
          <span className="block text-[11.5px] sm:text-[13px] text-zinc-400 group-hover:text-zinc-200 transition-colors whitespace-nowrap">
            Drop an update, flyer, or riff...
          </span>
        </button>

        {/* Right: Bright teal/purple Photo/Media icon button */}
        <button
          type="button"
          onClick={onOpenComposer}
          aria-label="Open composer with photo or media"
          title="Add photo or media"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-600/30 via-fuchsia-500/20 to-teal-500/30 border border-teal-400/50 hover:border-teal-300 text-teal-300 hover:text-white shadow-[0_0_14px_rgba(20,184,166,0.26),0_0_10px_rgba(168,85,247,0.22)] flex items-center justify-center shrink-0 transition-all cursor-pointer hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
        >
          <ImageIcon className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>
    </div>
  );
};

// Alias for backward compatibility
export const CompactComposerTriggerBar = PostComposerTrigger;
export type CompactComposerTriggerBarProps = PostComposerTriggerProps;

export default PostComposerTrigger;
