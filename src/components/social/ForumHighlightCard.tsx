import React, { useState } from 'react';
import {
  MessageSquare,
  ArrowBigUp,
  ArrowBigDown,
  Flame,
  CornerDownRight,
  ExternalLink,
  Send,
  X,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import {
  ForumHighlightThread,
  voteForumHighlight,
  addQuickCommentToThread,
} from '../../services/forumHighlightService';

export interface ForumHighlightCardProps {
  thread: ForumHighlightThread;
  currentUserName?: string;
  currentUserAvatar?: string;
  isUserPost?: boolean;
  onOpenThread: (threadId: string) => void;
  onDismiss?: (threadId: string) => void;
  onTriggerNotification?: (msg: string) => void;
}

export const ForumHighlightCard: React.FC<ForumHighlightCardProps> = ({
  thread,
  currentUserName = 'You',
  currentUserAvatar = '',
  isUserPost = false,
  onOpenThread,
  onDismiss,
  onTriggerNotification,
}) => {
  const [votes, setVotes] = useState<number>(thread.votes || 0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(thread.userVote || null);
  const [comments, setComments] = useState(thread.comments || []);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Top comment preview (first comment with text)
  const topComment = comments && comments.length > 0 ? comments[0] : null;

  const handleVote = (type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const result = voteForumHighlight(thread.id, type);
    if (result) {
      setVotes(result.updatedVotes);
      setUserVote(result.newUserVote);
      if (result.newUserVote === 'up') {
        onTriggerNotification?.(`🔥 Upvoted forum discussion "${thread.title.slice(0, 30)}..."`);
      }
    }
  };

  const handleQuickReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReplyText.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    const newComment = addQuickCommentToThread(
      thread.id,
      quickReplyText.trim(),
      currentUserName,
      currentUserAvatar
    );

    if (newComment) {
      setComments((prev) => [newComment, ...prev]);
      setQuickReplyText('');
      setIsQuickReplyOpen(false);
      onTriggerNotification?.(`💬 Reply posted to "${thread.title.slice(0, 30)}..."`);
    }
    setIsSubmittingReply(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopiedLink(true);
    onTriggerNotification?.(`🔗 Link copied to forum thread: "${thread.title.slice(0, 30)}..."`);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#13141a] via-[#0d0e12] to-[#08090b] shadow-xl transition-all duration-200 ${
      isUserPost
        ? 'border border-violet-500/45 hover:border-violet-400/70 shadow-violet-950/20'
        : 'border border-amber-500/25 hover:border-amber-500/40'
    }`}>
      {/* Subtle Glowing Header Accent Bar */}
      <div className={`h-1 w-full opacity-85 ${
        isUserPost
          ? 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400'
          : 'bg-gradient-to-r from-amber-600 via-rose-600 to-amber-500'
      }`} />

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header: Badge, Category & Dismiss */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {isUserPost ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/90 border border-violet-500/60 text-[10px] font-mono font-bold tracking-wider text-violet-300 shadow-sm uppercase">
                <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
                <span>YOUR FORUM POST</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/50 text-[10px] font-mono font-bold tracking-wider text-amber-300 shadow-sm uppercase">
                <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>SCENE BULLETIN</span>
              </span>
            )}

            {thread.category && (
              <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/80 text-[10px] font-mono text-zinc-300 font-medium">
                #{thread.category}
              </span>
            )}

            {thread.genre && (
              <span className="px-2 py-0.5 rounded-md bg-zinc-900/60 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                {thread.genre}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              title="Copy share link"
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            {onDismiss && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(thread.id);
                }}
                title="Dismiss highlight from feed"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 overflow-hidden ${
            isUserPost
              ? 'bg-gradient-to-tr from-violet-900 to-fuchsia-900 border border-violet-500/50 text-violet-200'
              : 'bg-gradient-to-tr from-amber-900 to-zinc-800 border border-amber-600/30 text-amber-200'
          }`}>
            {thread.authorAvatar ? (
              <img src={thread.authorAvatar} alt={thread.author} className="w-full h-full object-cover" />
            ) : (
              (thread.author || 'A').replace('@', '').charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex items-baseline gap-1.5 text-xs font-mono flex-wrap">
            <span className={`font-bold ${isUserPost ? 'text-violet-300' : 'text-zinc-200'}`}>
              {isUserPost ? `You (${thread.author?.startsWith('@') ? thread.author : `@${thread.author || 'you'}`})` : (thread.author?.startsWith('@') ? thread.author : `@${thread.author || 'anonymous'}`)}
            </span>
            {isUserPost && (
              <span className="px-1.5 py-0.5 rounded bg-violet-950/90 border border-violet-700/60 text-[9px] text-violet-300 font-mono font-bold uppercase tracking-wider">
                Original Poster
              </span>
            )}
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] text-zinc-500">{thread.timeAgo || 'Active discussion'}</span>
          </div>
        </div>

        {/* Thread Title & Content */}
        <div
          onClick={() => onOpenThread(thread.id)}
          className="cursor-pointer group space-y-1.5"
        >
          <h3 className={`text-base sm:text-lg font-bold transition-colors leading-snug tracking-tight ${
            isUserPost ? 'text-zinc-100 group-hover:text-violet-300' : 'text-zinc-100 group-hover:text-amber-300'
          }`}>
            {thread.title}
          </h3>

          <p className="text-xs sm:text-sm text-zinc-400 line-clamp-3 leading-relaxed font-sans">
            {thread.content}
          </p>
        </div>

        {/* Attached Image Preview if available */}
        {thread.image && (
          <div
            onClick={() => onOpenThread(thread.id)}
            className="cursor-pointer rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950 relative max-h-64 sm:max-h-80 group"
          >
            <img
              src={thread.image}
              alt={thread.title}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 font-semibold bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-sm">
                <ExternalLink className="w-3 h-3" /> View full discussion
              </span>
            </div>
          </div>
        )}

        {/* Top Reply Preview */}
        {topComment && (
          <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/60 p-3 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] uppercase font-bold tracking-wider">
              <CornerDownRight className="w-3 h-3 text-amber-400" />
              <span>Top Community Reply</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 normal-case font-medium">
                {topComment.author?.startsWith('@') ? topComment.author : `@${topComment.author}`}
              </span>
            </div>
            <p className="text-zinc-300 italic text-xs leading-relaxed line-clamp-2 pl-4 border-l border-amber-500/30">
              "{topComment.text}"
            </p>
          </div>
        )}

        {/* Footer Actions: Votes, Comments & Join Discussion */}
        <div className="pt-1 flex items-center justify-between gap-2 flex-wrap border-t border-zinc-800/50">
          {/* Vote Controls */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={(e) => handleVote('up', e)}
              className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-mono font-bold transition-all ${
                userVote === 'up'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
              }`}
              title="Upvote thread"
            >
              <ArrowBigUp className={`w-4 h-4 ${userVote === 'up' ? 'fill-current' : ''}`} />
              <span>{votes}</span>
            </button>

            <div className="w-[1px] h-3 bg-zinc-800 mx-0.5" />

            <button
              type="button"
              onClick={(e) => handleVote('down', e)}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                userVote === 'down'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800'
              }`}
              title="Downvote thread"
            >
              <ArrowBigDown className={`w-4 h-4 ${userVote === 'down' ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Comment Toggle */}
            <button
              type="button"
              onClick={() => setIsQuickReplyOpen(!isQuickReplyOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                isQuickReplyOpen
                  ? 'bg-zinc-800 text-amber-300 border border-zinc-700'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{comments.length}</span>
              <span className="hidden sm:inline">replies</span>
            </button>

            {/* Direct Jump to Discussion */}
            <button
              type="button"
              onClick={() => onOpenThread(thread.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shadow-sm transition-all ${
                isUserPost
                  ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 hover:text-violet-200 border border-violet-500/40 hover:border-violet-400/60'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50'
              }`}
            >
              <span>{isUserPost ? 'View Your Discussion' : 'Join Discussion'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Inline Quick Reply Drawer */}
        {isQuickReplyOpen && (
          <form
            onSubmit={handleQuickReplySubmit}
            className="pt-2 flex items-center gap-2 animate-in fade-in duration-150"
          >
            <input
              type="text"
              placeholder={`Reply to ${thread.author || 'thread'}...`}
              value={quickReplyText}
              onChange={(e) => setQuickReplyText(e.target.value)}
              autoFocus
              className="flex-1 bg-zinc-950 text-xs text-white placeholder:text-zinc-600 border border-zinc-800 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-amber-500/70 transition-colors"
            />
            <button
              type="submit"
              disabled={!quickReplyText.trim() || isSubmittingReply}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs font-mono rounded-xl flex items-center gap-1 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForumHighlightCard;
