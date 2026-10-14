import React, { useState } from 'react';
import {
  Pin,
  Rocket,
  Shield,
  MoreVertical,
  Edit2,
  Trash2,
  Share2,
  Tag,
  MessageSquare,
  MapPin,
  ExternalLink,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  Send,
  X
} from 'lucide-react';
import { FeedPost, ClassifiedPostData, REACTION_PALETTE } from '../timeline/types';

interface BulletinBoardPostCardProps {
  post: FeedPost;
  currentUserId?: string;
  currentUserName?: string;
  userProfile?: any;
  portalRole?: string;
  boostData?: { isBoosted: boolean; boostGlowColor: 'blue' | 'purple'; boostType: string; boostedAt: string };
  isCommentsOpen: boolean;
  commentDraft: string;
  replyingTo: { commentId: string; username: string } | null;
  isPostMenuOpen: boolean;
  isReactionMenuOpen: boolean;
  isHypeAnimated: boolean;
  shareToastActive: boolean;

  onOpenProfile?: (authorId: string, authorPayload: any) => void;
  onTogglePostMenu: () => void;
  onClosePostMenu: () => void;
  onTogglePin?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onShareClick: () => void;
  onOpenBoostModal: () => void;
  onToggleComments: () => void;
  onReactionClick?: (reactionKey: string) => void;
  onToggleReactionMenu?: () => void;
  onCloseReactionMenu?: () => void;
  onCommentDraftChange?: (draft: string) => void;
  onCommentSubmit?: (e: React.FormEvent) => void;
  onSetReplyingTo?: (replying: { commentId: string; username: string } | null) => void;
  openLightbox?: (url: string) => void;
}

export const BulletinBoardPostCard: React.FC<BulletinBoardPostCardProps> = ({
  post,
  currentUserId,
  userProfile,
  boostData,
  isCommentsOpen,
  commentDraft,
  replyingTo,
  isPostMenuOpen,
  isReactionMenuOpen,
  isHypeAnimated,
  shareToastActive,
  onOpenProfile,
  onTogglePostMenu,
  onClosePostMenu,
  onTogglePin,
  onDeletePost,
  onShareClick,
  onOpenBoostModal,
  onToggleComments,
  onReactionClick,
  onToggleReactionMenu,
  onCloseReactionMenu,
  onCommentDraftChange,
  onCommentSubmit,
  onSetReplyingTo,
  openLightbox,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const data: ClassifiedPostData = post.classifiedData || post.classified_data || {
    listingType: (post.category === 'gear' ? 'gear' : 'classifieds'),
    title: (post as any).title || post.message?.split('\n')[0] || 'Community Notice',
    description: post.message,
    price: (post as any).price || 0,
    condition: (post as any).condition || 'Good',
    brand: (post as any).brand,
    year: (post as any).year,
    location: post.location || 'Local Community',
    image: post.image || post.image_url || (post.images && post.images[0]),
    seller: post.authorName
  };

  const isGear = data.listingType === 'gear' || post.category === 'gear' || post.type === 'gear' || post.tag === 'GEAR SWAP';
  const price = data.price !== undefined ? Number(data.price) : 0;
  const imageUrl = data.image || post.image || post.image_url || (post.images && post.images[0]);

  const authorHandle = post.authorName ? (post.authorName.startsWith('@') ? post.authorName : `@${post.authorName}`) : '@member';
  const isAuthor = Boolean(
    (currentUserId && post.authorId === currentUserId) ||
    (userProfile?.id && post.authorId === userProfile.id) ||
    (userProfile?.console_handle && authorHandle.toLowerCase() === userProfile.console_handle.toLowerCase())
  );

  const reactions = post.reactions || {};
  const totalReactions = Object.values(reactions).reduce((sum: number, count) => sum + (Number(count) || 0), 0);
  const commentList = post.comments || [];
  const commentsCount = (post as any).comments_count || commentList.length;

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_2px_8px_rgba(0,0,0,0.9)] border-4 border-[#3a2216] select-none"
      style={{
        backgroundColor: '#16100c',
        backgroundImage: `
          radial-gradient(#301f14 1.5px, transparent 1.5px),
          radial-gradient(#22150d 1.5px, transparent 1.5px)
        `,
        backgroundSize: '10px 10px, 10px 10px',
        backgroundPosition: '0 0, 5px 5px'
      }}
    >
      {/* 4 Corner Industrial Mounting Brass/Steel Screws on Corkboard */}
      <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-amber-600 via-zinc-800 to-black border border-amber-900/60 shadow-inner flex items-center justify-center pointer-events-none z-10">
        <div className="w-1.5 h-0.5 bg-black/80 rotate-45" />
      </div>
      <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-amber-600 via-zinc-800 to-black border border-amber-900/60 shadow-inner flex items-center justify-center pointer-events-none z-10">
        <div className="w-1.5 h-0.5 bg-black/80 -rotate-45" />
      </div>
      <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-amber-600 via-zinc-800 to-black border border-amber-900/60 shadow-inner flex items-center justify-center pointer-events-none z-10">
        <div className="w-1.5 h-0.5 bg-black/80 -rotate-12" />
      </div>
      <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-amber-600 via-zinc-800 to-black border border-amber-900/60 shadow-inner flex items-center justify-center pointer-events-none z-10">
        <div className="w-1.5 h-0.5 bg-black/80 rotate-30" />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-500/40 flex items-center justify-center mb-3 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Trash2 className="w-5 h-5 animate-pulse" />
          </div>
          <h4 className="text-xs font-black text-white font-mono uppercase tracking-widest">Remove Notice from Board?</h4>
          <p className="text-[10px] text-zinc-400 mt-2 max-w-[240px] leading-relaxed font-mono">
            This will permanently take down this classified note from the community bulletin board.
          </p>
          <div className="flex items-center gap-3 mt-5 w-full max-w-[240px]">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:bg-zinc-850 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDeletePost?.(post.id);
              }}
              className="flex-1 px-3.5 py-2 rounded-xl bg-rose-950/50 border border-rose-500/60 text-[10px] font-mono font-bold text-rose-400 hover:bg-rose-900/60 transition-all cursor-pointer"
            >
              Take Down
            </button>
          </div>
        </div>
      )}

      {/* Main Nailed Paper Container with Natural Organic Rotation */}
      <div className="p-3 sm:p-5 pb-3">
        <div 
          className="relative bg-gradient-to-b from-[#fbf5e6] via-[#f2e7d0] to-[#e4d6b6] text-zinc-950 rounded-sm shadow-[0_16px_36px_rgba(0,0,0,0.7),0_3px_8px_rgba(0,0,0,0.4)] border border-[#d6c49c]/90 p-4 sm:p-5 transition-transform duration-200 hover:rotate-0"
          style={{ transform: 'rotate(-0.4deg)' }}
        >
          {/* 3D Forged Steel/Iron Nail Head Driven into Paper */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
            {/* Nail head */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-500 to-zinc-900 border border-zinc-400/80 shadow-[0_4px_8px_rgba(0,0,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.7)] flex items-center justify-center">
              <div className="w-2.5 h-0.5 bg-zinc-900/90 rotate-45 rounded-full shadow-inner" />
            </div>
            {/* Cast shadow onto parchment paper */}
            <div className="w-1.5 h-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent -mt-1 filter blur-[0.6px] -rotate-6" />
            {/* Paper puncture hole with dark fray */}
            <div className="w-2.5 h-1.5 bg-black/95 rounded-full -mt-3 filter blur-[0.4px]" />
          </div>

          {/* Top Paper Header: Metadata & Rubber Stamp */}
          <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-[#cbb78d] pb-3 mb-3">
            {/* Author info in Typewriter Style */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => {
                onOpenProfile?.(post.authorId, {
                  id: post.authorId,
                  name: post.authorName,
                  avatar: post.authorAvatar,
                  role: post.authorRole
                });
              }}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 shadow-sm shrink-0 bg-zinc-900">
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-[10px] font-bold text-amber-200">
                    {post.authorName?.substring(0, 2).toUpperCase() || 'TX'}
                  </div>
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-mono text-xs font-extrabold text-zinc-900 tracking-tight flex items-center gap-1 group-hover:text-red-800 transition-colors">
                  {authorHandle}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-650 font-bold flex items-center gap-1">
                  <span>{post.timeAgo || 'Recent'}</span>
                  {data.location && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-zinc-600" />
                        {data.location}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Distressed Official Rubber Stamp */}
            <div className="flex items-center gap-2">
              {isGear ? (
                <div className="border-2 border-dashed border-red-700/90 text-red-700 font-mono font-black uppercase text-[10px] sm:text-[11px] tracking-wider px-2.5 py-0.5 rounded shadow-sm rotate-[-3deg] bg-red-50/40 select-none">
                  🎸 GEAR SWAP
                </div>
              ) : (
                <div className="border-2 border-dashed border-indigo-950/90 text-indigo-950 font-mono font-black uppercase text-[10px] sm:text-[11px] tracking-wider px-2.5 py-0.5 rounded shadow-sm rotate-[3deg] bg-indigo-50/40 select-none">
                  📋 CLASSIFIED NOTICE
                </div>
              )}

              {/* Menu dropdown trigger */}
              <button
                type="button"
                onClick={onTogglePostMenu}
                className="text-zinc-650 hover:text-zinc-950 p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
                title="Notice options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Options Dropdown Menu */}
          {isPostMenuOpen && (
            <div className="absolute top-12 right-4 z-40 bg-[#141416] border border-zinc-800 rounded-xl shadow-2xl p-1.5 min-w-[170px] text-left animate-in fade-in zoom-in-95 duration-150">
              {isAuthor && onTogglePin && (
                <button
                  type="button"
                  onClick={() => {
                    onTogglePin(post.id);
                    onClosePostMenu();
                  }}
                  className="w-full px-3 py-2 text-xs font-mono font-bold text-zinc-300 hover:text-white hover:bg-zinc-850 rounded-lg flex items-center gap-2 text-left cursor-pointer transition-colors"
                >
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{post.is_pinned ? 'Unpin Notice' : 'Pin to Board'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onShareClick();
                  onClosePostMenu();
                }}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-zinc-300 hover:text-white hover:bg-zinc-850 rounded-lg flex items-center gap-2 text-left cursor-pointer transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Share Notice</span>
              </button>
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    onClosePostMenu();
                  }}
                  className="w-full px-3 py-2 text-xs font-mono font-bold text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center gap-2 text-left cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Take Down Notice</span>
                </button>
              )}
            </div>
          )}

          {/* Listing Headline Title */}
          <div className="mb-2.5">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-950 font-sans leading-snug">
              {data.title || post.message}
            </h3>
          </div>

          {/* Price & Attribute Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isGear && price > 0 ? (
              <div className="bg-[#7d1414] text-white font-mono font-black text-xs sm:text-sm px-2.5 py-1 rounded border border-[#9b1e1e] shadow-sm flex items-center gap-1">
                <span>${price.toLocaleString()}</span>
              </div>
            ) : isGear ? (
              <div className="bg-zinc-900 text-amber-300 font-mono font-black text-xs px-2.5 py-1 rounded border border-zinc-800 shadow-sm">
                TRADE / OBO
              </div>
            ) : (
              <div className="bg-zinc-900 text-emerald-300 font-mono font-black text-xs px-2.5 py-1 rounded border border-zinc-800 shadow-sm">
                COMMUNITY LISTING
              </div>
            )}

            {data.condition && (
              <div className="bg-white/80 text-zinc-900 border border-[#cbbb98] font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                Condition: <span className="font-black">{data.condition}</span>
              </div>
            )}

            {data.brand && (
              <div className="bg-white/80 text-zinc-900 border border-[#cbbb98] font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                Brand: <span className="font-black">{data.brand}</span>
              </div>
            )}

            {data.year && data.year !== 'N/A' && (
              <div className="bg-white/80 text-zinc-900 border border-[#cbbb98] font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                Year: <span className="font-black">{data.year}</span>
              </div>
            )}
          </div>

          {/* Taped Photo Frame (If present) */}
          {imageUrl && (
            <div className="relative my-3 p-2 bg-white rounded-sm shadow-md border border-[#cbb78d] flex justify-center group overflow-hidden">
              {/* Translucent Frosted Tape on Top Corners */}
              <div className="absolute -top-1 left-4 w-10 h-3 bg-white/50 border border-white/60 shadow-xs backdrop-blur-[1px] -rotate-12 z-20 pointer-events-none" />
              <div className="absolute -top-1 right-4 w-10 h-3 bg-white/50 border border-white/60 shadow-xs backdrop-blur-[1px] rotate-12 z-20 pointer-events-none" />

              <img
                src={imageUrl}
                alt={data.title}
                onClick={() => openLightbox?.(imageUrl)}
                className="max-h-72 w-full object-cover rounded-xs cursor-pointer group-hover:opacity-95 transition-opacity"
              />
            </div>
          )}

          {/* Description Text in Clear Typewriter Typography */}
          <div className="font-mono text-xs sm:text-[13px] text-zinc-900 leading-relaxed whitespace-pre-wrap select-text mb-3 pt-1">
            {data.description || post.message}
          </div>

          {/* Note Footer Action: Quick Inquire / Contact */}
          <div className="border-t border-[#d8c8a4] pt-2.5 mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-650 font-bold">
              POSTED TO LIVE BULLETIN
            </span>

            <button
              type="button"
              onClick={onToggleComments}
              className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-black text-amber-200 font-mono text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
              <span>Leave Reply / Inquire</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulletin Board Cork Footer Bar (Native Social Actions) */}
      <div className="px-4 py-2.5 bg-black/60 border-t border-[#3a2216] flex items-center justify-between gap-2">
        {/* Reactions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onReactionClick?.('flame')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              reactions.flame ? 'bg-orange-950/70 text-orange-400 border border-orange-600/50' : 'text-zinc-400 hover:text-orange-400 hover:bg-white/5'
            }`}
          >
            <span>🔥</span>
            <span>{reactions.flame || 0}</span>
          </button>
          <button
            type="button"
            onClick={() => onReactionClick?.('horns')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              reactions.horns ? 'bg-purple-950/70 text-purple-400 border border-purple-600/50' : 'text-zinc-400 hover:text-purple-400 hover:bg-white/5'
            }`}
          >
            <span>🤘</span>
            <span>{reactions.horns || 0}</span>
          </button>
        </div>

        {/* Comments & Share */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleComments}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              isCommentsOpen ? 'bg-amber-950/50 text-amber-300 border border-amber-500/50' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{commentsCount} Notes</span>
          </button>
          <button
            type="button"
            onClick={onShareClick}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Share Notice"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Pinned Inquiries & Notes Section on Corkboard */}
      {isCommentsOpen && (
        <div className="p-3 sm:p-5 pt-0 space-y-3 animate-in fade-in duration-200">
          <div className="bg-[#1b140f] border border-[#4a2e1d] rounded-xl p-3.5 shadow-inner space-y-3">
            <div className="flex items-center justify-between border-b border-[#3a2216] pb-2">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45" />
                <span>Pinned Inquiries & Board Notes ({commentList.length})</span>
              </span>
              <span className="font-mono text-[9px] text-zinc-500 uppercase">Public Notice Board</span>
            </div>

            {/* Comments List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {commentList.length === 0 ? (
                <div className="p-3 rounded-lg bg-[#140e0a] border border-[#2e1d13] text-center">
                  <p className="font-mono text-xs text-amber-200/60 italic">
                    No notes pinned yet. Leave an inquiry or offer below.
                  </p>
                </div>
              ) : (
                commentList
                  .filter((c: any) => !c.parent_comment_id)
                  .map((comment: any, cIdx: number) => {
                    const replies = commentList.filter((r: any) => r.parent_comment_id === comment.id);
                    return (
                      <div key={comment.id ? `note-comm-${comment.id}` : `note-c-${cIdx}`} className="space-y-1.5">
                        {/* Parent Note Slip */}
                        <div className="relative bg-[#f8f1de] text-zinc-950 p-2.5 rounded shadow-sm border border-[#d6c49c] font-mono">
                          {/* Mini brass pushpin */}
                          <div className="absolute -top-1.5 right-3 w-2.5 h-2.5 rounded-full bg-red-700 border border-zinc-900 shadow-xs pointer-events-none" />
                          <div className="flex items-center justify-between text-[10px] font-extrabold pb-1 border-b border-[#e2d5b5]">
                            <span className="text-zinc-900">@{comment.username || 'member'}</span>
                            <span className="text-zinc-600 font-medium">{comment.time || 'Recently'}</span>
                          </div>
                          <p className="text-xs text-zinc-900 pt-1 leading-relaxed whitespace-pre-wrap select-text font-sans">
                            {comment.text}
                          </p>
                          {onSetReplyingTo && (
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => onSetReplyingTo({ commentId: comment.id, username: comment.username })}
                                className="text-[9px] font-mono font-bold text-amber-900 hover:text-black uppercase tracking-wider underline cursor-pointer"
                              >
                                Reply to Note
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Threaded Nested Note Slips */}
                        {replies.length > 0 && (
                          <div className="ml-5 pl-2.5 border-l-2 border-amber-800/40 space-y-1.5">
                            {replies.map((reply: any, rIdx: number) => (
                              <div key={reply.id ? `note-rep-${reply.id}` : `note-r-${cIdx}-${rIdx}`} className="relative bg-[#f2e7cd] text-zinc-950 p-2 rounded shadow-xs border border-[#cfbe95] font-mono text-[11px]">
                                <div className="flex items-center justify-between text-[9px] font-extrabold pb-0.5 border-b border-[#dcceab]">
                                  <span className="text-zinc-900">@{reply.username || 'member'}</span>
                                  <span className="text-zinc-600 font-medium">{reply.time || 'Recently'}</span>
                                </div>
                                <p className="text-[11px] text-zinc-900 pt-1 leading-relaxed whitespace-pre-wrap select-text font-sans">
                                  {reply.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Replying-To Indicator */}
            {replyingTo && onSetReplyingTo && (
              <div className="flex items-center justify-between bg-amber-950/40 border border-amber-700/50 rounded-lg px-2.5 py-1 text-[10px] font-mono text-amber-300">
                <span>Replying to <strong>@{replyingTo.username}</strong></span>
                <button
                  type="button"
                  onClick={() => onSetReplyingTo(null)}
                  className="hover:text-white cursor-pointer ml-2 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Submit Note Form */}
            {onCommentSubmit && (
              <form onSubmit={onCommentSubmit} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder={replyingTo ? `Reply to @${replyingTo.username} on board...` : "Pin a reply note or inquiry..."}
                  value={commentDraft || ''}
                  onChange={(e) => onCommentDraftChange?.(e.target.value)}
                  className="flex-1 bg-[#120c08] border border-[#3d2516] rounded-xl px-3 py-2 text-xs text-amber-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                />
                <button
                  type="submit"
                  disabled={!(commentDraft || '').trim()}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pin Note</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Share Toast */}
      {shareToastActive && (
        <div className="absolute bottom-14 right-4 bg-emerald-950 border border-emerald-500 text-emerald-200 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Notice link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
};
