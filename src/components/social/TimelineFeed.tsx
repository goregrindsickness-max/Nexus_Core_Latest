import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import { requestPauseSceneRadio } from './utils/mediaPlaybackCoordinator';
import { tapeAudioEngine } from './utils/tapeAudioEngine';
import { isAudioUrl } from '../../utils/socialFeedUtils';
import { isBrokenOrDeletedPost } from './utils/feedCacheUtils';
import {
  FeedComment,
  SongEmbedData,
  AlbumEmbedTrack,
  AlbumEmbedData,
  PollOption,
  PollEmbedData,
  TapeEmbedData,
  TourEmbedData,
  FeedPost,
  TimelineFeedProps,
  REACTION_PALETTE,
  ANALEPSY_QUIESCENCE_TRACKS,
  renderPostMessage,
  HeaderMarqueeText,
  MerchCountdownTimer,
  formatFullSizeName,
  MarqueeText,
  RealAudioWaveform,
  PostCard,
  BoostPostModal,
  FullAlbumModal,
  SharePostModal,
  TicketPurchaseModal,
  FeedMediaLightboxModal,
  MerchLightboxModal,
  DiscoveryZone,
  PeopleYouMayKnow,
} from './timeline';

export type {
  FeedComment,
  SongEmbedData,
  AlbumEmbedTrack,
  AlbumEmbedData,
  PollOption,
  PollEmbedData,
  TapeEmbedData,
  TourEmbedData,
  FeedPost,
  TimelineFeedProps,
};

export {
  REACTION_PALETTE,
  ANALEPSY_QUIESCENCE_TRACKS,
  renderPostMessage,
  HeaderMarqueeText,
  MerchCountdownTimer,
  formatFullSizeName,
  MarqueeText,
  RealAudioWaveform,
};

export const TimelineFeed: React.FC<TimelineFeedProps> = ({
  posts,
  currentUserId,
  currentUserName,
  userProfile,
  portalRole,
  onToggleLike,
  onEmojiReact,
  onAddComment,
  onTogglePin,
  onEditPost,
  onDeletePost,
  onOpenProfile,
  onPlaySong,
  onAddToCart,
  onShareToTimeline,
  onVotePoll,
  onOpenTicketModal,
  onOpenMerchModal,
  onTriggerNotification,
  discoverProfiles = [],
  onFollowProfile,
}) => {
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedTourDates, setExpandedTourDates] = useState<Record<string, boolean>>({});
  
  // Ticket purchase modal state
  const [selectedTicketShow, setSelectedTicketShow] = useState<{ post: FeedPost; date: any } | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // Tape playback state powered by tapeAudioEngine
  const [playingTapeId, setPlayingTapeId] = useState<string | null>(tapeAudioEngine.getState().playingTapeId);
  const [tapeProgress, setTapeProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubscribe = tapeAudioEngine.subscribe((state) => {
      setPlayingTapeId(state.isPlaying ? state.playingTapeId : null);
      if (state.playingTapeId) {
        setTapeProgress((prev) => ({
          ...prev,
          [state.playingTapeId!]: state.progress,
        }));
      }
    });
    return unsubscribe;
  }, []);
  
  // Inline post edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Song playback preview state
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [songProgress, setSongProgress] = useState<Record<string, number>>({});
  const [songVolumeMuted, setSongVolumeMuted] = useState<Record<string, boolean>>({});
  const [songPlaybackSpeed, setSongPlaybackSpeed] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!playingSongId) return;
    const speed = songPlaybackSpeed[playingSongId] || 1.0;
    const interval = setInterval(() => {
      setSongProgress(prev => {
        const current = prev[playingSongId] || 0;
        if (current >= 100) {
          setPlayingSongId(null);
          return { ...prev, [playingSongId]: 0 };
        }
        return { ...prev, [playingSongId]: current + (0.5 * speed) };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playingSongId, songPlaybackSpeed]);

  // Poll votes local tracking
  const [pollVotes, setPollVotes] = useState<Record<string, { optionId: string; totalVotes: number; options: PollOption[] }>>({});

  // Share feedback toast and modal
  const [shareToastPostId, setShareToastPostId] = useState<string | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<FeedPost | null>(null);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [activeBoostPostId, setActiveBoostPostId] = useState<string | null>(null);
  const [boostedPosts, setBoostedPosts] = useState<Record<string, { isBoosted: boolean; boostGlowColor: 'blue' | 'purple'; boostType: string; boostedAt: string }>>({});
  const [monthlyBoostUsed, setMonthlyBoostUsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('metal_monthly_boost_used') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Active album modal state
  const [activeAlbumModal, setActiveAlbumModal] = useState<AlbumEmbedData | null>(null);

  // DIY Event RSVP local tracking
  const [rsvpedEvents, setRsvpedEvents] = useState<Record<string, boolean>>({});
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});

  const handleToggleRsvp = (postId: string) => {
    setRsvpedEvents((prev) => {
      const isCurrentlyRsvped = !!prev[postId];
      const nextRsvped = !isCurrentlyRsvped;

      setRsvpCounts((prevCounts) => {
        const currentCount = prevCounts[postId] || 1;
        return {
          ...prevCounts,
          [postId]: nextRsvped ? currentCount + 1 : Math.max(0, currentCount - 1),
        };
      });

      if (onTriggerNotification) {
        onTriggerNotification(
          nextRsvped ? "🔥 RSVP Confirmed! You're on the list for this show." : "RSVP cancelled."
        );
      }

      return {
        ...prev,
        [postId]: nextRsvped,
      };
    });
  };

  // Added to cart feedback
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  // Marketplace & VIP Exclusive States
  const [unlockedVipPosts, setUnlockedVipPosts] = useState<Record<string, boolean>>({});
  const [activeNegotiationPostId, setActiveNegotiationPostId] = useState<string | null>(null);
  const [offerValues, setOfferValues] = useState<Record<string, string>>({});
  const [offerStatusMap, setOfferStatusMap] = useState<Record<string, { status: 'submitted' | 'counter' | 'accepted'; amount: number; counterAmount?: number; message: string }>>({});
  const [selectedSizesMap, setSelectedSizesMap] = useState<Record<string, string>>({});
  const [checkoutModal, setCheckoutModal] = useState<{ post: FeedPost; size: string; price: number; isNegotiated?: boolean } | null>(null);

  // Merch Lightbox Zoom & Gallery State
  const [activeMerchLightbox, setActiveMerchLightbox] = useState<{
    post: FeedPost;
    images: string[];
    activeIndex: number;
  } | null>(null);

  const openMerchLightbox = (post: FeedPost, initialIndex = 0) => {
    if (!post.merchData) return;
    const primary = post.merchData.thumbnail;
    const merchImages = post.merchData.images && post.merchData.images.length > 0
      ? post.merchData.images
      : (post.images && post.images.length > 0 ? post.images : [primary]);
    const uniqueImages = Array.from(new Set(merchImages.filter(Boolean))).slice(0, 3);
    const imagesToUse = uniqueImages.length > 0 ? uniqueImages : [primary];
    setActiveMerchLightbox({
      post,
      images: imagesToUse,
      activeIndex: Math.min(initialIndex, Math.max(0, imagesToUse.length - 1))
    });
  };

  // Active Reaction Picker popover post ID
  const [reactionMenuPostId, setReactionMenuPostId] = useState<string | null>(null);
  
  // Hype Fire Animation State
  const [hypeAnimations, setHypeAnimations] = useState<Record<string, boolean>>({});

  // Replying to comment parent state per post
  const [replyingToCommentId, setReplyingToCommentId] = useState<Record<string, { commentId: string; username: string } | null>>({});

  const triggerEmojiReact = (postId: string, type: string) => {
    if (type === 'hype' || type === 'flame') {
      setHypeAnimations(prev => ({ ...prev, [postId]: true }));
      setTimeout(() => setHypeAnimations(prev => ({ ...prev, [postId]: false })), 600);
    }
    onEmojiReact(postId, type);
  };

  const openAlbumModalForSong = (song: SongEmbedData) => {
    const isAnalepsyQuiescence = 
      (song.band && song.band.toLowerCase().includes('analepsy')) ||
      (song.album && song.album.toLowerCase().includes('quiescence'));

    setActiveAlbumModal({
      band: song.band || 'ANALEPSY',
      albumName: song.album || 'Quiescence',
      releaseYear: '2026',
      coverUrl: song.coverArt || 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Analepsy%20-%20Quinscence.jpg',
      tracks: isAnalepsyQuiescence ? ANALEPSY_QUIESCENCE_TRACKS : [
        { title: song.title, duration: song.duration || '3:45' },
        { title: 'Intro / Slam Arrival', duration: '1:15' },
        { title: 'Tectonic Riffs', duration: '4:02' },
        { title: 'Outro', duration: '2:30' }
      ],
      purchaseLinks: [
        { format: 'Digital', price: '$9.99' },
        { format: 'CD', price: '$14.99' },
        { format: 'Vinyl', price: '$24.99' }
      ]
    });
  };

  const openAlbumModalForAlbum = (album: AlbumEmbedData) => {
    const isAnalepsyQuiescence = 
      (album.band && album.band.toLowerCase().includes('analepsy')) ||
      (album.albumName && album.albumName.toLowerCase().includes('quiescence'));

    setActiveAlbumModal({
      ...album,
      tracks: (album.tracks && album.tracks.length > 0) 
        ? album.tracks 
        : (isAnalepsyQuiescence ? ANALEPSY_QUIESCENCE_TRACKS : [
            { title: 'Locus of Dawning', duration: '3:45' },
            { title: 'Impending Subversion', duration: '4:12' },
            { title: 'Elapsing Permanence (feat. Wilson Ng)', duration: '3:58' },
            { title: 'Quiescence', duration: '4:40' }
          ]),
      purchaseLinks: [
        { format: 'Digital', price: '$9.99' },
        { format: 'CD', price: '$14.99' },
        { format: 'Vinyl', price: '$24.99' }
      ]
    });
  };

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const draft = commentDrafts[postId];
    if (draft && draft.trim()) {
      const parentInfo = replyingToCommentId[postId];
      onAddComment(postId, draft.trim(), parentInfo?.commentId);
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setReplyingToCommentId((prev) => ({ ...prev, [postId]: null }));
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const startEditing = (post: FeedPost) => {
    setEditingPostId(post.id);
    setEditingText(post.message);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditingText('');
  };

  const saveEditing = (postId: string, newText: string) => {
    if (!newText.trim()) return;
    if (onEditPost) {
      onEditPost(postId, newText.trim());
    }
    setEditingPostId(null);
    setEditingText('');
  };

  const handleShare = (postId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    }
    setShareToastPostId(postId);
    setTimeout(() => setShareToastPostId(null), 2500);
  };

  const handleVotePoll = (postId: string, optionId: string, currentPoll: PollEmbedData) => {
    const existing = pollVotes[postId];
    if (existing) return;

    if (onVotePoll) {
      onVotePoll(postId, optionId);
    }

    const updatedOptions = currentPoll.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );
    const updatedTotal = (currentPoll.totalVotes || currentPoll.options.reduce((a, b) => a + b.votes, 0)) + 1;

    setPollVotes(prev => ({
      ...prev,
      [postId]: {
        optionId,
        totalVotes: updatedTotal,
        options: updatedOptions,
      }
    }));
  };

  const handleBuyFormat = (format: string, priceStr: string, bandName: string, albumName: string) => {
    const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 12.99;
    if (onAddToCart) {
      onAddToCart({ title: `${albumName} (${format})`, bandName, price: numericPrice, format });
    }
    setCartNotice(`Added ${bandName} - ${albumName} [${format}] to cart!`);
    setTimeout(() => setCartNotice(null), 2000);
  };

  return (
    <div className="w-full space-y-3.5">
      {cartNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 border border-emerald-500/80 text-emerald-300 font-mono text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <span>{cartNotice}</span>
        </div>
      )}

      {(() => {
        const processedPosts = [...posts].filter(p => !isBrokenOrDeletedPost(p)).map(p => {
          const override = boostedPosts[p.id];
          if (override) {
            return {
              ...p,
              isBoosted: true,
              boostGlowColor: override.boostGlowColor,
              boostType: override.boostType
            };
          }
          return p;
        }).sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;
          return 0;
        });

        if (processedPosts.length === 0) {
          return (
            <div className="bg-[#0f1013] border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-500 font-mono text-xs shadow-xl">
              No network signals found in timeline feed.
            </div>
          );
        }

        return (
          <React.Fragment>
            {processedPosts.map((post, index) => {
              const showSuggestionsAfterThis = (index === 3) || (processedPosts.length < 4 && index === processedPosts.length - 1);
              return (
                <React.Fragment key={post.id ? `feed-post-${index}-${post.id}` : `feed-post-${index}`}>
                  <PostCard
                    post={post}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    userProfile={userProfile}
                    portalRole={portalRole}
                    boostData={boostedPosts[post.id]}
                    isCommentsOpen={!!expandedComments[post.id]}
                    commentDraft={commentDrafts[post.id] || ''}
                    replyingTo={replyingToCommentId[post.id] || null}
                    isEditing={editingPostId === post.id}
                    editingText={editingText}
                    isPostMenuOpen={openPostMenuId === post.id}
                    isReactionMenuOpen={reactionMenuPostId === post.id}
                    isHypeAnimated={!!hypeAnimations[post.id]}
                    playingSongId={playingSongId}
                    songProgress={songProgress[post.id] || 0}
                    songVolumeMuted={songVolumeMuted[post.id] || false}
                    pollVote={pollVotes[post.id]}
                    playingTapeId={playingTapeId}
                    tapeProgress={tapeProgress[post.id] || 0}
                    isTourExpanded={Boolean(expandedTourDates[post.id])}
                    isRsvped={Boolean(rsvpedEvents[post.id])}
                    rsvpCount={rsvpCounts[post.id] || 0}
                    unlockedVipPosts={unlockedVipPosts}
                    selectedSizesMap={selectedSizesMap}
                    offerStatusMap={offerStatusMap}
                    activeNegotiationPostId={activeNegotiationPostId}
                    offerValues={offerValues}
                    shareToastActive={shareToastPostId === post.id}
                    onOpenProfile={onOpenProfile}
                    onTogglePostMenu={() => setOpenPostMenuId(openPostMenuId === post.id ? null : post.id)}
                    onClosePostMenu={() => setOpenPostMenuId(null)}
                    onTogglePin={onTogglePin}
                    onStartEditing={() => startEditing(post)}
                    onCancelEditing={cancelEditing}
                    onSaveEditing={(txt) => saveEditing(post.id, txt)}
                    onSetEditingText={setEditingText}
                    onDeletePost={onDeletePost}
                    onShareClick={() => handleShare(post.id)}
                    onOpenBoostModal={() => setActiveBoostPostId(post.id)}
                    onPlaySong={onPlaySong}
                    onTogglePlaySong={(song) => {
                      if (playingSongId !== post.id) {
                        requestPauseSceneRadio('song_embed_play');
                      }
                      setPlayingSongId(playingSongId === post.id ? null : post.id);
                      if (onPlaySong && song) onPlaySong(song);
                    }}
                    onSeekSong={(pct) => {
                      requestPauseSceneRadio('song_embed_seek');
                      if (playingSongId !== post.id) {
                        setPlayingSongId(post.id);
                      }
                      setSongProgress(prev => ({ ...prev, [post.id]: pct }));
                    }}
                    onToggleMuteSong={() => setSongVolumeMuted(prev => ({ ...prev, [post.id]: !songVolumeMuted[post.id] }))}
                    onOpenAlbumModalForSong={openAlbumModalForSong}
                    onOpenAlbumModalForAlbum={openAlbumModalForAlbum}
                    onBuyFormat={handleBuyFormat}
                    onVotePoll={(optId, poll) => handleVotePoll(post.id, optId, poll)}
                    onTogglePlayTape={() => {
                      const audioUrl = post.tapeData?.audioUrl || 
                        post.tapeData?.audio_url || 
                        post.tapeData?.audio ||
                        ((post as any)?.media_url && isAudioUrl((post as any).media_url) ? (post as any).media_url : undefined) ||
                        (post.mediaUrl && isAudioUrl(post.mediaUrl) ? post.mediaUrl : undefined);
                      tapeAudioEngine.togglePlay(post.id, audioUrl);
                    }}
                    onSeekTape={(progress) => {
                      setTapeProgress(prev => ({ ...prev, [post.id]: progress }));
                      if (playingTapeId === post.id) {
                        tapeAudioEngine.seek(progress);
                      }
                    }}
                    onStopTape={() => {
                      tapeAudioEngine.stop(post.id);
                      setTapeProgress(prev => ({ ...prev, [post.id]: 0 }));
                    }}
                    onOpenLightbox={(images, index) => setLightbox({ images, index })}
                    onToggleTourExpand={() => setExpandedTourDates(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                    onSelectTicketShow={(date) => {
                      setSelectedTicketShow({ post, date });
                    }}
                    onOpenTicketModal={onOpenTicketModal}
                    onToggleRsvp={handleToggleRsvp}
                    setSelectedSizesMap={setSelectedSizesMap}
                    setOfferStatusMap={setOfferStatusMap}
                    setActiveNegotiationPostId={setActiveNegotiationPostId}
                    setOfferValues={setOfferValues}
                    openMerchLightbox={openMerchLightbox}
                    onCheckoutMerch={(p, size, price, isNegotiated) => {
                      setCheckoutModal({ post: p, size, price, isNegotiated });
                    }}
                    onAddToCart={onAddToCart}
                    setCartNotice={setCartNotice}
                    onToggleComments={() => toggleComments(post.id)}
                    onCommentDraftChange={(txt) => setCommentDrafts(prev => ({ ...prev, [post.id]: txt }))}
                    onCommentSubmit={(e) => handleCommentSubmit(post.id, e)}
                    onSetReplyingTo={(info) => setReplyingToCommentId(prev => ({ ...prev, [post.id]: info }))}
                    onTriggerEmojiReact={(type) => triggerEmojiReact(post.id, type)}
                    onOpenReactionMenu={() => setReactionMenuPostId(post.id)}
                    onCloseReactionMenu={() => setReactionMenuPostId(null)}
                    onOpenShareModal={() => setActiveSharePost(post)}
                  />
                  {showSuggestionsAfterThis && (
                    <DiscoveryZone
                      key={`discovery-zone-after-${post.id || index}`}
                      discoverProfiles={discoverProfiles}
                      currentUserId={currentUserId}
                      currentUserName={currentUserName}
                      onOpenProfile={onOpenProfile}
                      onFollowProfile={onFollowProfile}
                      onTriggerNotification={onTriggerNotification}
                    />
                  )}
                </React.Fragment>
              );
            })}

        {/* End of Feed indicator */}
        <div className="pt-2 pb-1 flex items-center justify-center gap-3 select-none">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-zinc-800 flex-1 max-w-[80px]" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d0e11] border border-zinc-800/80 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
              End of Feed
            </span>
          </div>
          <div className="h-px bg-gradient-to-l from-transparent via-zinc-800 to-zinc-800 flex-1 max-w-[80px]" />
        </div>
      </React.Fragment>
    );
  })()}

      {/* Boost Post Modal */}
      {activeBoostPostId && (() => {
        const targetPost = posts.find(p => p.id === activeBoostPostId);
        if (!targetPost) return null;

        return (
          <BoostPostModal
            post={targetPost}
            monthlyBoostUsed={monthlyBoostUsed}
            onClose={() => setActiveBoostPostId(null)}
            onConfirmBoost={(postId, plan, auraColor) => {
              const isFree = plan === 'free';
              if (isFree) {
                setMonthlyBoostUsed(true);
                try { localStorage.setItem('metal_monthly_boost_used', 'true'); } catch (e) {}
              }
              
              setBoostedPosts(prev => ({
                ...prev,
                [postId]: {
                  isBoosted: true,
                  boostGlowColor: auraColor,
                  boostType: plan,
                  boostedAt: new Date().toISOString()
                }
              }));

              setCartNotice(
                isFree 
                  ? '⚡ Free Monthly Boost Activated! Post moved to top of feed with glowing aura.' 
                  : `⚡ $${plan === 'paid_24h' ? '1.00' : '2.50'} Boost Activated! Post is now highlighted at the top.`
              );
              setTimeout(() => setCartNotice(null), 4500);

              setActiveBoostPostId(null);
            }}
          />
        );
      })()}

      {/* FULL ALBUM DETAILS & TRACKLIST MODAL */}
      {activeAlbumModal && (
        <FullAlbumModal
          album={activeAlbumModal}
          onClose={() => setActiveAlbumModal(null)}
          onPlaySong={onPlaySong}
          onBuyFormat={handleBuyFormat}
        />
      )}

      {/* SHARE POST OPTIONS MODAL */}
      {activeSharePost && (
        <SharePostModal
          post={activeSharePost}
          onClose={() => setActiveSharePost(null)}
          onShareToTimeline={onShareToTimeline}
          onNotify={(msg) => {
            setCartNotice(msg);
            setTimeout(() => setCartNotice(null), 2000);
          }}
        />
      )}

      {/* Ticket Purchase Modal */}
      {selectedTicketShow && (
        <TicketPurchaseModal
          selectedTicketShow={selectedTicketShow}
          onClose={() => setSelectedTicketShow(null)}
        />
      )}

      {/* Media Lightbox Modal */}
      {lightbox && (
        <FeedMediaLightboxModal
          lightbox={lightbox}
          onClose={() => setLightbox(null)}
          onSetIndex={(index) => setLightbox(prev => prev ? { ...prev, index } : null)}
        />
      )}

      {/* Merch Product Design Lightbox Modal with Pinch-To-Zoom & Angle Gallery */}
      {activeMerchLightbox && (
        <MerchLightboxModal
          activeMerchLightbox={activeMerchLightbox}
          unlockedVipPosts={unlockedVipPosts}
          selectedSizesMap={selectedSizesMap}
          onClose={() => setActiveMerchLightbox(null)}
          onSelectIndex={(index) => setActiveMerchLightbox(prev => prev ? { ...prev, activeIndex: index } : null)}
          onBuyNow={(p, sz, baseP) => {
            setActiveMerchLightbox(null);
            setCheckoutModal({ post: p, size: sz, price: baseP });
          }}
        />
      )}

      {/* 1-Click Instant Checkout Modal */}
      {checkoutModal && (
        <StripeCheckoutModal
          post={checkoutModal.post}
          size={checkoutModal.size}
          price={checkoutModal.price}
          isNegotiated={checkoutModal.isNegotiated}
          onClose={() => setCheckoutModal(null)}
        />
      )}
    </div>
  );
};

export default TimelineFeed;
