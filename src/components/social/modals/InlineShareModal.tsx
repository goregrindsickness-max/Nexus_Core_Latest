import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, ArrowRight } from 'lucide-react';
import { FeedItem } from '../../../data/socialFeedMockData';

export interface InlineShareModalProps {
  sharingPost: FeedItem | null;
  setSharingPost: (post: FeedItem | null) => void;
  handleShareToTimeline: () => void;
  handleShareExternal: () => void;
}

export const InlineShareModal: React.FC<InlineShareModalProps> = ({
  sharingPost,
  setSharingPost,
  handleShareToTimeline,
  handleShareExternal,
}) => {
  return (
    <AnimatePresence>
      {sharingPost && (
        <motion.div
          key="share-post-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1, opacity: 1 }}
            className="bg-[#121214] border border-zinc-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-900 bg-zinc-950/40">
              <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Share This Post</span>
              <button onClick={() => setSharingPost(null)} className="text-zinc-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Preview */}
            <div className="p-4 border-b border-zinc-900/60 bg-black/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 border border-zinc-800">
                  {sharingPost?.author?.avatar && (typeof sharingPost?.author?.avatar === 'string' && (sharingPost?.author?.avatar.startsWith('http') || sharingPost?.author?.avatar.startsWith('/') || sharingPost?.author?.avatar.startsWith('data:image'))) ? (
                    <img referrerPolicy="no-referrer" src={sharingPost?.author?.avatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    typeof sharingPost?.author?.avatar === 'string' ? sharingPost?.author?.avatar.slice(0, 2) : '👤'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate leading-snug">{sharingPost?.author?.name}</div>
                  <div className="text-[10px] text-zinc-500 font-medium">{sharingPost.timeAgo}</div>
                </div>
              </div>
              <p className="text-xs text-zinc-300 line-clamp-3 italic leading-relaxed pl-1 border-l-2 border-rose-500/30">"{sharingPost.content}"</p>
            </div>

            {/* Options */}
            <div className="p-4 space-y-3">
              <button
                onClick={handleShareToTimeline}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-900/10 cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Share to my timeline
              </button>
              <button
                onClick={handleShareExternal}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-zinc-800 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 rotate-45" /> Share externally
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
