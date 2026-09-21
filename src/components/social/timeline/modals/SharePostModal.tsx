import React from 'react';
import { X, Share2, Repeat, Send } from 'lucide-react';
import { FeedPost } from '../types';

interface SharePostModalProps {
  post: FeedPost;
  onClose: () => void;
  onShareToTimeline?: (post: FeedPost) => void;
  onNotify?: (msg: string) => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  post,
  onClose,
  onShareToTimeline,
  onNotify,
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-sm w-full bg-[#0d0e12] border border-rose-500/50 rounded-2xl p-5 shadow-2xl space-y-4 text-white relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-black uppercase tracking-wider">
          <Share2 className="w-4 h-4" />
          <span>SHARE BROADCAST</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 space-y-1">
          <p className="text-[11px] font-mono font-bold text-rose-400">@{post.authorName}</p>
          <p className="text-xs font-sans text-zinc-300 line-clamp-2">{post.message}</p>
        </div>

        <div className="space-y-2">
          {/* Option 1: Share to Your Timeline */}
          <button
            onClick={() => {
              if (onShareToTimeline) {
                onShareToTimeline(post);
              }
              onNotify?.("Broadcast reposted to your timeline!");
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-500/60 transition-all cursor-pointer text-left group"
          >
            <div className="p-2 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-400 shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-white group-hover:text-rose-300">Share to Your Timeline</p>
              <p className="text-[10px] font-mono text-zinc-400">Repost this broadcast directly to your feed</p>
            </div>
          </button>

          {/* Option 2: Copy Link */}
          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
              }
              onNotify?.("Direct post link copied to clipboard!");
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer text-left group"
          >
            <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-white group-hover:text-zinc-200">Copy Link</p>
              <p className="text-[10px] font-mono text-zinc-400">Copy broadcast URL to clipboard</p>
            </div>
          </button>

          {/* Option 3: External Native Device Share */}
          <button
            onClick={() => {
              const postUrl = `${window.location.origin}/post/${post.id}`;
              if (typeof navigator !== 'undefined' && navigator.share) {
                navigator.share({
                  title: `Post by ${post.authorName}`,
                  text: post.message,
                  url: postUrl,
                }).catch(() => {});
              } else {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.message)}&url=${encodeURIComponent(postUrl)}`, '_blank');
              }
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 hover:bg-purple-950/60 border border-zinc-800 hover:border-purple-500/60 transition-all cursor-pointer text-left group"
          >
            <div className="p-2 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-400 shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-white group-hover:text-purple-300">External Device Share</p>
              <p className="text-[10px] font-mono text-zinc-400">Share via system apps or external networks</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
