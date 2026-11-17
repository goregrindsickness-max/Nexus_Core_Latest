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
  Skull,
  Share2,
  Check,
} from 'lucide-react';
import {
  ForumHighlightThread,
  voteForumHighlight,
  addQuickCommentToThread,
} from '../../services/forumHighlightService';
import {
  MIGUEL_DEFAULT_AVATAR,
  KNOWN_USER_AVATARS,
} from '../../utils/bandProfileUtils';
import { BirthdayShoutoutBadge } from './BirthdayShoutoutBadge';
import { buildBirthdayHornsMessage, isMutualConnection } from '../../utils/birthdayUtils';
import { isProfileFollowedGlobally } from '../../utils/followSyncService';

export interface ForumHighlightCardProps {
  thread: ForumHighlightThread;
  userProfile?: any;
  allProfiles?: any[];
  discoverProfiles?: any[];
  currentUserName?: string;
  currentUserAvatar?: string;
  isUserPost?: boolean;
  onOpenThread: (threadId: string) => void;
  onDismiss?: (threadId: string) => void;
  onTriggerNotification?: (msg: string) => void;
}

export const ForumHighlightCard: React.FC<ForumHighlightCardProps> = ({
  thread,
  userProfile,
  allProfiles = [],
  discoverProfiles = [],
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
    }
    setIsSubmittingReply(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#160709] via-[#0b0607] to-[#050405] shadow-2xl transition-all duration-200 ${
      isUserPost
        ? 'border border-red-600/60 hover:border-red-500/80 shadow-[0_8px_32px_rgba(127,29,29,0.28)]'
        : 'border border-red-950/90 hover:border-red-800/70 shadow-black/80'
    }`}>
      {/* Brutal Death Metal Blood-Iron Accent Bar */}
      <div className={`h-1 w-full ${
        isUserPost
          ? 'bg-gradient-to-r from-red-950 via-red-600 to-zinc-800'
          : 'bg-gradient-to-r from-zinc-900 via-red-900 to-zinc-900'
      }`} />

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header: Badge, Category & Dismiss */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {isUserPost ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/90 border border-red-600/60 text-[10px] font-mono font-black tracking-wider text-red-200 shadow-sm uppercase">
                <Skull className="w-3 h-3 text-red-400" />
                <span>HIGHLIGHTED // YOUR THREAD</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-950 border border-red-900/70 text-[10px] font-mono font-black tracking-wider text-red-400 shadow-sm uppercase">
                <Flame className="w-3 h-3 text-red-500" />
                <span>PIT HIGHLIGHT</span>
              </span>
            )}

            {thread.category && (
              <span className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-300 font-semibold">
                #{thread.category}
              </span>
            )}

            {thread.genre && (
              <span className="px-2 py-0.5 rounded-md bg-red-950/35 border border-red-900/50 text-[10px] font-mono text-red-300/90 font-semibold">
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
        {(() => {
          const isValidImgUrl = (url?: string) =>
            typeof url === 'string' &&
            url.length > 5 &&
            !url.includes('ui-avatars.com') &&
            !url.includes('undefined') &&
            !url.includes('null') &&
            (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:'));

          const cleanAuthor = (thread.author || '').toLowerCase().replace(/[@"']/g, '').trim();
          const isUserAuthor = Boolean(
            isUserPost ||
            cleanAuthor === 'you' ||
            cleanAuthor.includes('miguel') ||
            cleanAuthor.includes('goregrinder') ||
            cleanAuthor.includes('bdmceo') ||
            (currentUserName && (cleanAuthor === currentUserName.toLowerCase() || cleanAuthor.includes(currentUserName.toLowerCase())))
          );

          let resolvedAvatar: string | undefined = undefined;
          if (isUserAuthor) {
            if (isValidImgUrl(currentUserAvatar)) {
              resolvedAvatar = currentUserAvatar;
            } else if (typeof window !== 'undefined' && isValidImgUrl(localStorage.getItem('nexus_user_avatar') || localStorage.getItem('nexus_avatar') || '')) {
              resolvedAvatar = (localStorage.getItem('nexus_user_avatar') || localStorage.getItem('nexus_avatar'))!;
            } else if (isValidImgUrl(thread.authorAvatar)) {
              resolvedAvatar = thread.authorAvatar;
            } else {
              resolvedAvatar = MIGUEL_DEFAULT_AVATAR;
            }
          } else {
            if (isValidImgUrl(thread.authorAvatar)) {
              resolvedAvatar = thread.authorAvatar;
            } else if (KNOWN_USER_AVATARS[cleanAuthor]) {
              resolvedAvatar = KNOWN_USER_AVATARS[cleanAuthor];
            }
          }

          const initials = (thread.author || 'Fan')
            .replace(/@/g, '')
            .split(/[\s_]+/)
            .map((n: string) => n[0])
            .filter(Boolean)
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'FA';

          return (
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 overflow-hidden ${
                isUserPost
                  ? 'bg-gradient-to-tr from-red-950 to-zinc-900 border border-red-600/70 text-red-200'
                  : 'bg-gradient-to-tr from-red-950/80 to-zinc-900 border border-red-900/50 text-red-300'
              }`}>
                {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt={thread.author}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (isUserAuthor) {
                        target.src = MIGUEL_DEFAULT_AVATAR;
                      } else {
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-initials')) {
                          const span = document.createElement('span');
                          span.className = 'text-[10px] font-black text-red-400 font-mono fallback-initials';
                          span.textContent = initials;
                          parent.appendChild(span);
                        }
                      }
                    }}
                  />
                ) : (
                  <span className="text-[10px] font-black font-mono">{initials}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
                <span className={`font-bold ${isUserPost ? 'text-red-300' : 'text-zinc-200'}`}>
                  {isUserPost ? `You (${thread.author?.startsWith('@') ? thread.author : `@${thread.author || 'you'}`})` : (thread.author?.startsWith('@') ? thread.author : `@${thread.author || 'anonymous'}`)}
                </span>
                {(() => {
                  const pool = [...(allProfiles || []), ...(discoverProfiles || [])];
                  const matchedProfile = isUserAuthor
                    ? userProfile
                    : pool.find((p: any) => {
                        if (!p) return false;
                        const pName = String(p.name || p.username || '').toLowerCase().replace(/^@/, '').trim();
                        const pHandle = String(p.console_handle || p.handle || '').toLowerCase().replace(/^@/, '').trim();
                        return cleanAuthor && (pName === cleanAuthor || pHandle === cleanAuthor);
                      });
                  const authorBirthdayProfile = {
                    ...(thread as any),
                    ...(matchedProfile || {}),
                    ...(isUserAuthor && userProfile ? userProfile : {}),
                  };
                  const isMutual = !isUserAuthor && Boolean(
                    isMutualConnection(authorBirthdayProfile, userProfile) ||
                    isProfileFollowedGlobally(authorBirthdayProfile)
                  );
                  return (
                    <BirthdayShoutoutBadge
                      profile={authorBirthdayProfile}
                      isOwnProfile={isUserAuthor}
                      isMutual={isMutual}
                      compact
                      onSendBirthdayHorns={() => {
                        const hornsMsg = buildBirthdayHornsMessage(thread.author || 'Friend');
                        const newComment = addQuickCommentToThread(
                          thread.id,
                          hornsMsg,
                          currentUserName,
                          currentUserAvatar
                        );
                        if (newComment) {
                          setComments((prev) => [newComment, ...prev]);
                        }
                        onTriggerNotification?.(`🤘 Sent Birthday Horns to ${thread.author || 'thread'}!`);
                      }}
                    />
                  );
                })()}
                {isUserPost && (
                  <span className="px-1.5 py-0.5 rounded bg-red-950/90 border border-red-800/70 text-[9px] text-red-300 font-mono font-bold uppercase tracking-wider">
                    OP
                  </span>
                )}
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] text-zinc-500">{thread.timeAgo || 'Active discussion'}</span>
              </div>
            </div>
          );
        })()}

        {/* Thread Title & Content */}
        <div
          onClick={() => onOpenThread(thread.id)}
          className="cursor-pointer group space-y-1.5"
        >
          <h3 className={`text-base sm:text-lg font-black transition-colors leading-snug tracking-tight ${
            isUserPost ? 'text-zinc-100 group-hover:text-red-400' : 'text-zinc-100 group-hover:text-red-400'
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-300 font-semibold bg-black/80 border border-red-900/50 px-2.5 py-1 rounded-md backdrop-blur-sm">
                <ExternalLink className="w-3 h-3" /> View full discussion
              </span>
            </div>
          </div>
        )}

        {/* Top Reply Preview */}
        {topComment && (
          <div className="rounded-xl bg-[#090607] border border-red-950/70 p-3 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] uppercase font-bold tracking-wider">
              <CornerDownRight className="w-3 h-3 text-red-500" />
              <span>Top Pit Reply</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 normal-case font-medium">
                {topComment.author?.startsWith('@') ? topComment.author : `@${topComment.author}`}
              </span>
            </div>
            <p className="text-zinc-300 italic text-xs leading-relaxed line-clamp-2 pl-4 border-l-2 border-red-700/60">
              "{topComment.text}"
            </p>
          </div>
        )}

        {/* Footer Actions: Votes, Comments & Join Discussion */}
        <div className="pt-1 flex items-center justify-between gap-2 flex-wrap border-t border-red-950/40">
          {/* Vote Controls */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={(e) => handleVote('up', e)}
              className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-mono font-bold transition-all ${
                userVote === 'up'
                  ? 'bg-red-950/80 text-red-400 border border-red-600/50'
                  : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-900'
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
                  ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
                  : 'text-zinc-500 hover:text-red-400 hover:bg-zinc-900'
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
                  ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                  : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
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
                  ? 'bg-red-950/80 hover:bg-red-900/80 text-red-200 hover:text-white border border-red-600/60 hover:border-red-500/80'
                  : 'bg-zinc-950 hover:bg-red-950/60 text-red-300 hover:text-red-200 border border-red-900/60 hover:border-red-700/70'
              }`}
            >
              <span>{isUserPost ? 'Open Your Thread' : 'Enter Pit Thread'}</span>
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
              className="flex-1 bg-zinc-950 text-xs text-white placeholder:text-zinc-600 border border-zinc-800 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-red-600/70 transition-colors"
            />
            <button
              type="submit"
              disabled={!quickReplyText.trim() || isSubmittingReply}
              className="px-3 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs font-mono rounded-xl flex items-center gap-1 transition-colors shrink-0"
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
