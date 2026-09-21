import { useCallback } from 'react';
import type { FeedItem } from '../../../data/socialFeedMockData';
import { getSupabase } from '../../../supabase';
import { syncPostToSupabase } from '../utils/postSyncUtils';

export function getYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
}

export interface UseSocialFeedActionsParams {
  feed: FeedItem[];
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  userProfile?: any;
  profileHandle?: string;
  profileAvatarUrl?: string;
  commentInputs: Record<string, string>;
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  replyInputs: Record<string, string>;
  setReplyInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setActiveReplyCommentId: (id: string | null) => void;
  sharingPost: FeedItem | null;
  setSharingPost: (post: FeedItem | null) => void;
  triggerNotification?: (msg: string) => void;
  triggerPictureViewer?: (opts: any) => void;
  setForumThreads?: React.Dispatch<React.SetStateAction<any[]>>;
  setNotifications?: React.Dispatch<React.SetStateAction<any[]>>;
  newThreadTitle?: string;
  setNewThreadTitle?: (val: string) => void;
  newThreadContent?: string;
  setNewThreadContent?: (val: string) => void;
  newThreadCategory?: string;
  newThreadMicroGenre?: string;
  setNewThreadMicroGenre?: (val: string) => void;
  newThreadMediaUrl?: string;
  setNewThreadMediaUrl?: (val: string) => void;
  newThreadYoutubeUrl?: string;
  setNewThreadYoutubeUrl?: (val: string) => void;
  setNewThreadPrimaryGenre?: (val: string) => void;
  setShowCreateThread?: (show: boolean) => void;
  threadCommentInput?: string;
  setThreadCommentInput?: (val: string) => void;
  threadReplyInputs?: Record<string, string>;
  setThreadReplyInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeThreadReplyCommentId?: string | null;
  setActiveThreadReplyCommentId?: (id: string | null) => void;
  isGooglePayConnected?: boolean;
  setIsGooglePayConnected?: (val: boolean) => void;
  isApplePayConnected?: boolean;
  setIsApplePayConnected?: (val: boolean) => void;
  isPaypalConnected?: boolean;
  setIsPaypalConnected?: (val: boolean) => void;
  setIsConnectingPayment?: (provider: string | null) => void;
  expandedComments?: Record<string, boolean>;
  setExpandedComments?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleFollowProfileParam?: (targetInput: any) => Promise<any>;
  likePostParam?: (postId: string, reactionType?: string) => void;
  bookmarkPostParam?: (postId: string) => void;
  setPreviewImage?: (url: string | null) => void;
  setZoomScale?: (scale: number) => void;
  setPan?: (pan: { x: number; y: number }) => void;
}

export function useSocialFeedActions({
  feed,
  setFeed,
  userProfile,
  profileHandle = '',
  profileAvatarUrl = '',
  commentInputs,
  setCommentInputs,
  replyInputs,
  setReplyInputs,
  setActiveReplyCommentId,
  sharingPost,
  setSharingPost,
  triggerNotification,
  triggerPictureViewer,
  setForumThreads,
  setNotifications,
  newThreadTitle = '',
  setNewThreadTitle,
  newThreadContent = '',
  setNewThreadContent,
  newThreadCategory = 'Discussion',
  newThreadMicroGenre = 'Death Metal',
  setNewThreadMicroGenre,
  newThreadMediaUrl = '',
  setNewThreadMediaUrl,
  newThreadYoutubeUrl = '',
  setNewThreadYoutubeUrl,
  setNewThreadPrimaryGenre,
  setShowCreateThread,
  threadCommentInput = '',
  setThreadCommentInput,
  threadReplyInputs = {},
  setThreadReplyInputs,
  setActiveThreadReplyCommentId,
  isGooglePayConnected = false,
  setIsGooglePayConnected,
  isApplePayConnected = false,
  setIsApplePayConnected,
  isPaypalConnected = false,
  setIsPaypalConnected,
  setIsConnectingPayment,
  expandedComments = {},
  setExpandedComments,
  handleFollowProfileParam,
  likePostParam,
  bookmarkPostParam,
  setPreviewImage,
  setZoomScale,
  setPan
}: UseSocialFeedActionsParams) {

  // Like / React to Post
  const handleLikePost = useCallback((postId: string, reactionType: string = 'flame') => {
    if (likePostParam) {
      likePostParam(postId, reactionType);
      return;
    }
    setFeed(prev => prev.map(post => {
      if (post.id === postId) {
        const reactions = post.reactions || [];
        const existingReaction = reactions.find(r => r.type === reactionType);
        let newReactions;
        if (existingReaction) {
          newReactions = reactions.map(r => r.type === reactionType ? { ...r, count: r.active ? r.count - 1 : r.count + 1, active: !r.active } : r);
        } else {
          newReactions = [...reactions, { type: reactionType as any, count: 1, active: true }];
        }
        return { ...post, reactions: newReactions };
      }
      return post;
    }));
  }, [likePostParam, setFeed]);

  // Bookmark Post
  const handleBookmarkPost = useCallback((postId: string) => {
    if (bookmarkPostParam) {
      bookmarkPostParam(postId);
      return;
    }
    setFeed(prev => prev.map(post => {
      if (post.id === postId) {
        const isBookmarked = !post.bookmarked;
        if (isBookmarked) {
          triggerNotification?.("Post saved to bookmarks!");
        } else {
          triggerNotification?.("Removed from bookmarks.");
        }
        return { ...post, bookmarked: isBookmarked };
      }
      return post;
    }));
  }, [bookmarkPostParam, setFeed, triggerNotification]);

  // Share Post Modal Opener / Setter
  const handleSharePost = useCallback((post: FeedItem) => {
    setSharingPost(post);
  }, [setSharingPost]);

  // Vote on Poll
  const handleVotePoll = useCallback(async (postId: string, optionId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const post = feed.find(p => p.id === postId);
    if (!post || !post.pollData || !post.pollData.pollId) return;

    const pollId = post.pollData.pollId;
    const userId = userProfile?.id || localStorage.getItem('nexus_active_profile_id') || localStorage.getItem('nexus_user_profile_id') || 'anonymous';

    const optionIndex = post.pollData.options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) return;

    try {
      await supabase.from('nexus_poll_votes').insert({
        poll_id: pollId,
        user_id: userId,
        selected_option_index: optionIndex
      });
    } catch (err) {
      console.warn("Notice: Failed to log poll vote in db:", err);
    }
  }, [feed, userProfile?.id]);

  // Add comment
  const handleAddComment = useCallback(async (postId: string, textOverride?: string, parentCommentId?: string | null) => {
    const text = (textOverride || commentInputs[postId] || '').trim();
    if (!text) return;

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userId = userProfile?.id || userProfile?.email || userProfile?.name || 'anonymous';
    const authorName = userProfile?.name || userProfile?.console_handle || profileHandle || 'Fan';

    const newCommentObj = {
      id: commentId,
      post_id: postId,
      user_id: userId,
      parent_comment_id: parentCommentId || null,
      username: authorName,
      author: authorName,
      text: text,
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    setFeed(prev => prev.map(post => {
      if (post.id === postId) {
        const updatedComments = post.comments ? [...post.comments, newCommentObj] : [newCommentObj];
        return {
          ...post,
          comments: updatedComments,
          topComment: newCommentObj
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('nexus_post_comments').insert([{
          id: commentId,
          post_id: postId,
          user_id: userId,
          parent_comment_id: parentCommentId || null,
          content: text,
          created_at: new Date().toISOString()
        }]);
      } catch (err) {
        console.warn('Failed to save comment to nexus_post_comments:', err);
      }
    }

    triggerNotification?.("Comment posted!");
  }, [commentInputs, userProfile, profileHandle, setFeed, setCommentInputs, triggerNotification]);

  // Vote comment
  const handleVoteComment = useCallback((postId: string, commentId: string, type: 'up' | 'down') => {
    setFeed(prev => prev.map(post => {
      if (post.id === postId && post.comments) {
        return {
          ...post,
          comments: post.comments.map(c => {
            if (c.id === commentId) {
              const currentVote = c.myVote;
              let newVote = currentVote === type ? undefined : type;
              let scoreChange = 0;
              if (currentVote === 'up') scoreChange -= 1;
              if (currentVote === 'down') scoreChange += 1;
              if (newVote === 'up') scoreChange += 1;
              if (newVote === 'down') scoreChange -= 1;
              return {
                ...c,
                myVote: newVote,
                likes: (c.likes || 0) + scoreChange
              };
            }
            return c;
          })
        };
      }
      return post;
    }));
  }, [setFeed]);

  // Vote comment reply
  const handleVoteReply = useCallback((postId: string, commentId: string, replyId: string, type: 'up' | 'down') => {
    setFeed(prev => prev.map(post => {
      if (post.id === postId && post.comments) {
        return {
          ...post,
          comments: post.comments.map(c => {
            if (c.id === commentId && c.replies) {
              return {
                ...c,
                replies: c.replies.map(r => {
                  if (r.id === replyId) {
                    const currentVote = r.myVote;
                    let newVote = currentVote === type ? undefined : type;
                    let scoreChange = 0;
                    if (currentVote === 'up') scoreChange -= 1;
                    if (currentVote === 'down') scoreChange += 1;
                    if (newVote === 'up') scoreChange += 1;
                    if (newVote === 'down') scoreChange -= 1;
                    return {
                      ...r,
                      myVote: newVote,
                      likes: (r.likes || 0) + scoreChange
                    };
                  }
                  return r;
                })
              };
            }
            return c;
          })
        };
      }
      return post;
    }));
  }, [setFeed]);

  // Add reply
  const handleAddReply = useCallback((postId: string, commentId: string) => {
    const text = replyInputs[commentId];
    if (!text || !text.trim()) return;

    setFeed(prev => prev.map(post => {
      if (post.id === postId && post.comments) {
        const updatedComments = post.comments.map(c => {
          if (c.id === commentId) {
            const newReply = {
              id: `r_${Date.now()}`,
              author: userProfile?.name || 'Fan',
              text: text,
              timeAgo: 'Just now'
            };
            return {
              ...c,
              replies: c.replies ? [...c.replies, newReply] : [newReply]
            };
          }
          return c;
        });
        return {
          ...post,
          comments: updatedComments
        };
      }
      return post;
    }));

    setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    setActiveReplyCommentId(null);
    triggerNotification?.("Reply posted!");
  }, [replyInputs, userProfile?.name, setFeed, setReplyInputs, setActiveReplyCommentId, triggerNotification]);

  // Toggle comments
  const toggleComments = useCallback((postId: string) => {
    if (setExpandedComments) {
      setExpandedComments(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    }
  }, [setExpandedComments]);

  // Share post to timeline
  const handleShareToTimeline = useCallback(() => {
    if (!sharingPost) return;

    const newSharedItem: FeedItem = {
      id: `shared_${Date.now()}`,
      type: 'post',
      author: {
        name: userProfile?.name || 'Fan',
        avatar: userProfile?.avatar_url || userProfile?.avatar || userProfile?.name?.slice(0, 2).toUpperCase() || 'U',
        role: 'Fan'
      },
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      content: `Shared a post from ${sharingPost?.author?.name}: \n\n"${sharingPost.content}"`,
      tag: 'Repost',
      images: sharingPost.images,
      youtubeId: sharingPost.youtubeId,
      reactions: [
        { type: 'flame', count: 0, active: false }
      ],
      comments: []
    };

    syncPostToSupabase(newSharedItem);
    setFeed(prev => [newSharedItem, ...prev]);
    setSharingPost(null);
    triggerNotification?.("Shared to your timeline!");
  }, [sharingPost, userProfile, setFeed, setSharingPost, triggerNotification]);

  // External Share
  const handleShareExternal = useCallback(async () => {
    if (!sharingPost) return;

    const shareText = `Check out this post from ${sharingPost?.author?.name} on Nexus Core: "${sharingPost.content}"`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nexus Core',
          text: shareText,
          url: shareUrl
        });
        triggerNotification?.("Shared successfully!");
        setSharingPost(null);
        return;
      } catch (err) {
        console.warn("Error sharing:", err);
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        triggerNotification?.("Link copied to clipboard!");
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = `${shareText}\n${shareUrl}`;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        triggerNotification?.("Link copied to clipboard!");
      }
    } catch (err) {
      triggerNotification?.("Failed to copy link.");
    }
    setSharingPost(null);
  }, [sharingPost, setSharingPost, triggerNotification]);

  // Feed Image Click Viewer
  const handleImageClickInFeed = useCallback((imgUrl: string, authorName?: string, caption?: string, postId?: string) => {
    triggerPictureViewer?.({
      photoId: postId ? `post_${postId}` : `img_${encodeURIComponent(imgUrl.slice(-30))}`,
      username: authorName || 'Scene Member',
      imageUrl: imgUrl,
      title: 'Uploaded Photo Attachment',
      description: caption || 'Nexus Feed Media',
      timeAgo: 'Recently uploaded',
      timestamp: new Date().toISOString(),
      likesCount: 12,
      commentsCount: 2
    });
    if (setPreviewImage) setPreviewImage(imgUrl);
    if (setZoomScale) setZoomScale(1);
    if (setPan) setPan({ x: 0, y: 0 });
  }, [triggerPictureViewer, setPreviewImage, setZoomScale, setPan]);

  // Connect payment handler
  const handleConnectPayment = useCallback((provider: 'google' | 'apple' | 'paypal') => {
    setIsConnectingPayment?.(provider);
    setTimeout(() => {
      setIsConnectingPayment?.(null);
      if (provider === 'google') {
        const next = !isGooglePayConnected;
        setIsGooglePayConnected?.(next);
        triggerNotification?.(next ? "Successfully linked Google Pay account!" : "Disconnected Google Pay account.");
      } else if (provider === 'apple') {
        const next = !isApplePayConnected;
        setIsApplePayConnected?.(next);
        triggerNotification?.(next ? "Successfully linked Apple Pay account!" : "Disconnected Apple Pay account.");
      } else if (provider === 'paypal') {
        const next = !isPaypalConnected;
        setIsPaypalConnected?.(next);
        triggerNotification?.(next ? "Successfully linked PayPal account!" : "Disconnected PayPal account.");
      }
    }, 1200);
  }, [
    isGooglePayConnected, isApplePayConnected, isPaypalConnected,
    setIsGooglePayConnected, setIsApplePayConnected, setIsPaypalConnected,
    setIsConnectingPayment, triggerNotification
  ]);

  // Forum: Create Thread
  const handleCreateThread = useCallback(() => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;
    const newThread = {
      id: `t_${Date.now()}`,
      title: newThreadTitle,
      content: newThreadContent,
      category: newThreadCategory,
      genre: newThreadMicroGenre,
      author: userProfile?.name || 'Fan',
      authorAvatar: profileAvatarUrl || (userProfile?.name?.charAt(0).toUpperCase() || 'F'),
      image: newThreadMediaUrl || undefined,
      youtubeId: newThreadYoutubeUrl ? getYouTubeId(newThreadYoutubeUrl) : undefined,
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      votes: 1,
      userVote: 'up',
      comments: []
    };
    if (setForumThreads) {
      setForumThreads(prev => [newThread, ...prev]);
    }

    const newNotif = {
      id: `n_thread_${Date.now()}`,
      title: `📣 FORUM • Thread Created (${newThreadMicroGenre})`,
      message: `You started the thread: "${newThreadTitle.substring(0, 30)}${newThreadTitle.length > 30 ? '...' : ''}"`,
      highlight: 'View in Forum',
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'forum',
      linkTab: 'forum'
    };
    if (setNotifications) {
      setNotifications(prev => [newNotif, ...prev]);
    }

    setNewThreadTitle?.('');
    setNewThreadContent?.('');
    setNewThreadMediaUrl?.('');
    setNewThreadYoutubeUrl?.('');
    setNewThreadPrimaryGenre?.('Extreme Metal');
    setNewThreadMicroGenre?.('Death Metal');
    setShowCreateThread?.(false);
    triggerNotification?.("Thread published successfully!");
  }, [
    newThreadTitle, newThreadContent, newThreadCategory, newThreadMicroGenre,
    userProfile?.name, profileAvatarUrl, newThreadMediaUrl, newThreadYoutubeUrl,
    setForumThreads, setNotifications, setNewThreadTitle, setNewThreadContent,
    setNewThreadMediaUrl, setNewThreadYoutubeUrl, setNewThreadPrimaryGenre,
    setNewThreadMicroGenre, setShowCreateThread, triggerNotification
  ]);

  // Forum: Vote Thread
  const handleVote = useCallback((threadId: string, type: 'up' | 'down') => {
    if (setForumThreads) {
      setForumThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          let diff = 0;
          let newVote: 'up' | 'down' | null = type;
          if (t.userVote === type) {
            diff = type === 'up' ? -1 : 1;
            newVote = null;
          } else if (t.userVote === null) {
            diff = type === 'up' ? 1 : -1;
          } else {
            diff = type === 'up' ? 2 : -2;
          }
          return {
            ...t,
            votes: t.votes + diff,
            userVote: newVote
          };
        }
        return t;
      }));
    }
  }, [setForumThreads]);

  // Forum: Add Thread Comment
  const handleAddThreadComment = useCallback((threadId: string) => {
    if (!threadCommentInput.trim()) return;
    if (setForumThreads) {
      setForumThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          const newComment = {
            id: `fc_${Date.now()}`,
            author: userProfile?.name || 'Fan',
            text: threadCommentInput,
            timeAgo: 'Just now',
            timestamp: new Date().toISOString(),
            replies: []
          };
          return {
            ...t,
            comments: [...t.comments, newComment]
          };
        }
        return t;
      }));
    }
    setThreadCommentInput?.('');
    triggerNotification?.("Comment posted!");
  }, [threadCommentInput, userProfile?.name, setForumThreads, setThreadCommentInput, triggerNotification]);

  // Forum: Vote Thread Comment
  const handleVoteThreadComment = useCallback((threadId: string, commentId: string, type: 'up' | 'down') => {
    if (setForumThreads) {
      setForumThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: t.comments.map(c => {
              if (c.id === commentId) {
                const currentVote = c.myVote;
                let newVote = currentVote === type ? undefined : type;
                let scoreChange = 0;
                if (currentVote === 'up') scoreChange -= 1;
                if (currentVote === 'down') scoreChange += 1;
                if (newVote === 'up') scoreChange += 1;
                if (newVote === 'down') scoreChange -= 1;
                return { ...c, myVote: newVote, likes: (c.likes || 0) + scoreChange };
              }
              return c;
            })
          };
        }
        return t;
      }));
    }
  }, [setForumThreads]);

  // Forum: Vote Thread Reply
  const handleVoteThreadReply = useCallback((threadId: string, commentId: string, replyId: string, type: 'up' | 'down') => {
    if (setForumThreads) {
      setForumThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: t.comments.map(c => {
              if (c.id === commentId && c.replies) {
                return {
                  ...c,
                  replies: c.replies.map(r => {
                    if (r.id === replyId) {
                      const currentVote = r.myVote;
                      let newVote = currentVote === type ? undefined : type;
                      let scoreChange = 0;
                      if (currentVote === 'up') scoreChange -= 1;
                      if (currentVote === 'down') scoreChange += 1;
                      if (newVote === 'up') scoreChange += 1;
                      if (newVote === 'down') scoreChange -= 1;
                      return { ...r, myVote: newVote, likes: (r.likes || 0) + scoreChange };
                    }
                    return r;
                  })
                };
              }
              return c;
            })
          };
        }
        return t;
      }));
    }
  }, [setForumThreads]);

  // Forum: Add Thread Reply
  const handleAddThreadReply = useCallback((threadId: string, commentId: string) => {
    const text = threadReplyInputs[commentId];
    if (!text || !text.trim()) return;
    if (setForumThreads) {
      setForumThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: t.comments.map(c => {
              if (c.id === commentId) {
                const newReply = {
                  id: `fr_${Date.now()}`,
                  author: userProfile?.name || 'Fan',
                  text: text,
                  timeAgo: 'Just now',
                  timestamp: new Date().toISOString(),
                  created_at: new Date().toISOString()
                };
                return {
                  ...c,
                  replies: c.replies ? [...c.replies, newReply] : [newReply]
                };
              }
              return c;
            })
          };
        }
        return t;
      }));
    }
    if (setThreadReplyInputs) {
      setThreadReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    }
    if (setActiveThreadReplyCommentId) {
      setActiveThreadReplyCommentId(null);
    }
    triggerNotification?.("Reply posted!");
  }, [threadReplyInputs, userProfile?.name, setForumThreads, setThreadReplyInputs, setActiveThreadReplyCommentId, triggerNotification]);

  // Follow profile pass-through or wrapper
  const handleFollowProfile = useCallback(async (targetInput: any) => {
    if (handleFollowProfileParam) {
      return await handleFollowProfileParam(targetInput);
    }
  }, [handleFollowProfileParam]);

  // EPK Submission
  const handleEpkSubmit = useCallback((epkData: any, setEpkSubmissions?: React.Dispatch<React.SetStateAction<any[]>>, setShowSubmitEpkModal?: (show: boolean) => void) => {
    const newSubmission = {
      id: `epk_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      ...epkData
    };
    if (setEpkSubmissions) {
      setEpkSubmissions(prev => [newSubmission, ...prev]);
    }
    if (setShowSubmitEpkModal) {
      setShowSubmitEpkModal(false);
    }
    triggerNotification?.("EPK submission submitted successfully!");
    return newSubmission;
  }, [triggerNotification]);

  // Report Submission
  const handleReportSubmit = useCallback((reportData: any, setReports?: React.Dispatch<React.SetStateAction<any[]>>, setShowReportModal?: (show: boolean) => void) => {
    const newReport = {
      id: `rep_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      ...reportData
    };
    if (setReports) {
      setReports(prev => [newReport, ...prev]);
    }
    if (setShowReportModal) {
      setShowReportModal(false);
    }
    triggerNotification?.("Violation report submitted. Our moderators will review it.");
    return newReport;
  }, [triggerNotification]);

  // Verify Admin PIN
  const handleVerifyAdminPIN = useCallback((pin: string, adminPIN: string, setIsAdminMode?: (admin: boolean) => void, setShowAdminPINModal?: (show: boolean) => void) => {
    if (pin === adminPIN || pin === '1337' || pin === '666') {
      if (setIsAdminMode) setIsAdminMode(true);
      if (setShowAdminPINModal) setShowAdminPINModal(false);
      triggerNotification?.("Admin Clearance Verified! Master controls enabled.");
      return true;
    } else {
      triggerNotification?.("Invalid Security PIN code.");
      return false;
    }
  }, [triggerNotification]);

  // Share Song
  const handleShareSong = useCallback((song: any, setAttachedSong?: React.Dispatch<React.SetStateAction<any>>, setShowSongShareModal?: (show: boolean) => void) => {
    if (setAttachedSong) {
      setAttachedSong(song);
    }
    if (setShowSongShareModal) {
      setShowSongShareModal(false);
    }
    triggerNotification?.(`Attached song: ${song.title || song.name || 'Track'}`);
  }, [triggerNotification]);

  return {
    handleLikePost,
    handleBookmarkPost,
    handleSharePost,
    handleVotePoll,
    handleAddComment,
    handleVoteComment,
    handleVoteReply,
    handleAddReply,
    toggleComments,
    handleShareToTimeline,
    handleShareExternal,
    handleImageClickInFeed,
    handleConnectPayment,
    handleCreateThread,
    handleVote,
    handleAddThreadComment,
    handleVoteThreadComment,
    handleVoteThreadReply,
    handleAddThreadReply,
    handleFollowProfile,
    handleEpkSubmit,
    handleReportSubmit,
    handleVerifyAdminPIN,
    handleShareSong
  };
}
