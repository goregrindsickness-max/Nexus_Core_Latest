import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Activity, 
  MessageSquare, 
  Flame, 
  Image as ImageIcon, 
  Sparkles, 
  Share2, 
  Volume2, 
  Video, 
  Calendar, 
  MapPin, 
  Users, 
  Lock, 
  Check, 
  Send, 
  X, 
  CornerDownRight 
} from 'lucide-react';
import { YouTubeEmbedCard } from '../social/embeds/YouTubeEmbedCard';
import { PollWidget } from '../social/embeds/PollWidget';
import { TapeEmbedCard } from '../social/embeds/TapeEmbedCard';
import { BandcampEmbedCard } from '../social/embeds/BandcampEmbedCard';
import { PollEmbedData, REACTION_PALETTE } from '../social/timeline/types';
import { tapeAudioEngine } from '../social/utils/tapeAudioEngine';
import { awardSonicPoints } from '../../services/sonicFootprintService';
import { formatPostTimestamp } from '../../utils/socialFeedUtils';
import { savePostReaction, mergePostWithReactions, normalizeReactionCounts } from '../social/utils/reactionStore';

export interface TimelinePost {
  id: string;
  profile_id?: string;
  author_id?: string;
  user_id?: string;
  content: string;
  media_url?: string | null;
  images?: string[];
  created_at: string;
  author?: {
    name: string;
    avatar?: string;
    role?: string;
    full_name?: string;
    workspace_type?: string;
    [key: string]: any;
  };
  type?: string;
  tag?: string;
  reactions_count?: number;
  reactions?: any;
  user_reactions?: Record<string, boolean>;
  user_liked?: boolean;
  likes_count?: number;
  comments?: any[];
  eventData?: any;
  merchData?: any;
  songData?: any;
  tapeData?: any;
  pollData?: any;
  workspace_type?: string;
  [key: string]: any;
}

interface TimelineTabProps {
  profileId?: string;
  userId?: string;
  profileName?: string;
  isYou?: boolean;
  selectedUserProfile?: any;
  targetProfile?: any;
  workspaceType?: string;
  currentActiveWorkspace?: string;
  portalRole?: string;
  triggerPictureViewer?: (data: any) => void;
  triggerNotification?: (msg: string) => void;
  feed?: any[];
}

const getValidUrl = (url: any): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (
    trimmed === '' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === '[object Object]' ||
    trimmed === 'null/null'
  ) {
    return null;
  }
  return trimmed;
};

const isAudioUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.toLowerCase().split('?')[0];
  return (
    clean.endsWith('.mp3') ||
    clean.endsWith('.wav') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.flac') ||
    clean.endsWith('.m4a') ||
    clean.includes('/audio/') ||
    clean.startsWith('data:audio/')
  );
};

const isVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.toLowerCase().split('?')[0];
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    clean.startsWith('data:video/')
  );
};

const isYoutubeUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const extractYoutubeId = (url?: string | null): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Role-themed color resolution matching canonical social feed rules
const resolvePostRoleTheme = (post: any, selectedUserProfile: any) => {
  const authorName = (post.author?.name || '').toLowerCase();
  const rawRole = (post.author?.role || post.role || post.authorRole || post.tag || '').toUpperCase();
  const workspace = (post.workspace_type || post.workspaceType || post.author?.workspace_type || '').toLowerCase();
  
  // 1. Band / Artist = Neon Green (#39ff14)
  const isBand = workspace === 'band' ||
    rawRole === 'BAND' ||
    rawRole === 'ARTIST' ||
    rawRole === 'BAND / ARTIST' ||
    rawRole.includes('BAND') ||
    rawRole.includes('BRUTAL DEATH') ||
    rawRole.includes('SLAM') ||
    rawRole.includes('DEATHCORE') ||
    rawRole.includes('METAL') ||
    rawRole.includes('GRIND') ||
    Boolean(post.isBandProfile) ||
    Boolean(post.author?.isBand) ||
    authorName.includes('virulent excision');

  // 2. Record Label = Neon Orange (#ff6b00)
  const isLabel = !isBand && (
    workspace === 'label' ||
    rawRole === 'LABEL' ||
    rawRole === 'RECORD LABEL' ||
    rawRole.includes('LABEL') ||
    rawRole.includes('RECORDS') ||
    authorName.includes('records') ||
    authorName.includes('label')
  );

  // 3. Creative Pro = Magenta (#ff00aa)
  const isCreative = !isBand && !isLabel && (
    workspace === 'creative' ||
    rawRole.includes('CREATIVE') ||
    rawRole.includes('GRAPHIC') ||
    rawRole.includes('DESIGN') ||
    rawRole.includes('ARTIST') ||
    rawRole === 'PHOTOGRAPHER' ||
    rawRole.includes('MEDIA') ||
    rawRole.includes('VIDEOGRAPHER') ||
    rawRole.includes('ILLUSTRAT') ||
    authorName.includes('vortex graphics') ||
    authorName.includes('graphics') ||
    authorName.includes('design') ||
    authorName.includes('photo')
  );

  // 4. Venue Promoter = Neon Yellow (#ffff00)
  const isPromoter = !isBand && !isLabel && !isCreative && (
    workspace === 'promoter' ||
    rawRole === 'PROMOTER' ||
    rawRole === 'VENUE' ||
    rawRole === 'PROMOTER / VENUE' ||
    rawRole === 'VENUE PROMOTER' ||
    rawRole.includes('PROMOTER') ||
    rawRole.includes('VENUE') ||
    rawRole.includes('BOOKING') ||
    authorName.includes('booking') ||
    authorName.includes('promotions')
  );

  // 5. Industry Pro = Deep Purple (#8b5cf6)
  const isIndustry = !isBand && !isLabel && !isCreative && !isPromoter && (
    workspace === 'industry_pro' ||
    workspace === 'pro' ||
    rawRole.includes('INDUSTRY') ||
    rawRole === 'PRO' ||
    rawRole === 'MANAGER' ||
    rawRole === 'EXECUTIVE' ||
    rawRole === 'PRODUCER' ||
    rawRole === 'ENGINEER' ||
    rawRole === 'AGENT' ||
    authorName.includes('industry') ||
    authorName === 'bdmceo'
  );

  if (isBand) {
    return {
      label: rawRole === 'BAND' || rawRole === 'BAND / ARTIST' || !post.author?.role ? 'Band / Artist' : post.author.role,
      colorHex: '#39ff14',
      badgeClass: 'text-[#39ff14]',
      dotClass: 'bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.85)]',
      borderClass: 'border-[#39ff14]'
    };
  }
  if (isLabel) {
    return {
      label: 'Record Label',
      colorHex: '#ff6b00',
      badgeClass: 'text-[#ff6b00]',
      dotClass: 'bg-[#ff6b00] shadow-[0_0_8px_rgba(255,107,0,0.85)]',
      borderClass: 'border-[#ff6b00]'
    };
  }
  if (isCreative) {
    return {
      label: 'Creative Pro',
      colorHex: '#ff00aa',
      badgeClass: 'text-[#ff00aa]',
      dotClass: 'bg-[#ff00aa] shadow-[0_0_8px_rgba(255,0,170,0.85)]',
      borderClass: 'border-[#ff00aa]'
    };
  }
  if (isPromoter) {
    return {
      label: 'Venue Promoter',
      colorHex: '#ffff00',
      badgeClass: 'text-[#ffff00]',
      dotClass: 'bg-[#ffff00] shadow-[0_0_8px_rgba(255,255,0,0.85)]',
      borderClass: 'border-[#ffff00]'
    };
  }
  if (isIndustry) {
    return {
      label: 'Industry Pro',
      colorHex: '#8b5cf6',
      badgeClass: 'text-[#a78bfa]',
      dotClass: 'bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.85)]',
      borderClass: 'border-[#8b5cf6]'
    };
  }
  return {
    label: 'Fan Supporter',
    colorHex: '#00f0ff',
    badgeClass: 'text-[#00f0ff]',
    dotClass: 'bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.85)]',
    borderClass: 'border-[#00f0ff]'
  };
};

export const TimelineTab: React.FC<TimelineTabProps> = ({
  profileId,
  userId,
  profileName = '',
  isYou = false,
  selectedUserProfile,
  workspaceType,
  currentActiveWorkspace,
  portalRole,
  triggerPictureViewer,
  triggerNotification,
  feed
}) => {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [rsvpedEvents, setRsvpedEvents] = useState<Record<string, boolean>>({});
  const [pollVotes, setPollVotes] = useState<Record<string, { optionId: string; totalVotes: number; options: any[] }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexus_poll_votes_map');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }
    return {};
  });

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

  const feedRef = useRef(feed);
  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);

  const [reactionMenuOpenFor, setReactionMenuOpenFor] = useState<string | null>(null);
  const [hypeAnimations, setHypeAnimations] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, { commentId: string; username: string } | null>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const activeUserId = typeof window !== 'undefined'
    ? localStorage.getItem('nexus_active_profile_id') || localStorage.getItem('nexus_user_profile_id') || userId || 'current'
    : (userId || 'current');

  const currentUserName = typeof window !== 'undefined'
    ? (() => {
        try {
          const raw = localStorage.getItem('nexus_user') || localStorage.getItem('nexus_core_user_profile');
          if (raw) {
            const p = JSON.parse(raw);
            return p.name || p.console_handle || p.username || 'You';
          }
        } catch (_) {}
        return 'You';
      })()
    : 'You';

  // Live synchronizer for reactions and comments between the profile card and global feed
  useEffect(() => {
    const handleReactionSync = (e: any) => {
      const detail = e.detail;
      if (!detail?.postId) return;
      setPosts(prev => prev.map(p => {
        if (p.id === detail.postId) {
          return {
            ...p,
            reactions: detail.reactions || p.reactions,
            likes_count: detail.likes_count ?? p.likes_count,
            user_reactions: detail.user_reactions || p.user_reactions,
            user_liked: detail.user_liked ?? p.user_liked
          };
        }
        return p;
      }));
    };

    const handleCommentSync = (e: any) => {
      const detail = e.detail;
      if (!detail?.postId || !detail?.comment) return;
      setPosts(prev => prev.map(p => {
        if (p.id === detail.postId) {
          const existing = Array.isArray(p.comments) ? p.comments : [];
          if (existing.some(c => c.id === detail.comment.id)) return p;
          return {
            ...p,
            comments: [...existing, detail.comment]
          };
        }
        return p;
      }));
    };

    window.addEventListener('nexus_reaction_updated', handleReactionSync as EventListener);
    window.addEventListener('nexus_comment_added', handleCommentSync as EventListener);

    return () => {
      window.removeEventListener('nexus_reaction_updated', handleReactionSync as EventListener);
      window.removeEventListener('nexus_comment_added', handleCommentSync as EventListener);
    };
  }, []);

  const handleReaction = async (postId: string, reactionType: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    const keyMap: Record<string, string> = {
      like: 'likes',
      likes: 'likes',
      thumbs: 'likes',
      heart: 'likes',
      flame: 'hype',
      hype: 'hype',
      heavy: 'brutal',
      brutal: 'brutal',
      horns: 'horns',
      respect: 'respect',
      crushed: 'crushed',
      skull: 'brutal',
      grim: 'brutal',
      rocket: 'hype',
    };

    const reactionKey = keyMap[reactionType] || (['likes', 'horns', 'hype', 'brutal', 'respect', 'crushed'].includes(reactionType) ? reactionType : 'hype');

    if (reactionKey === 'hype') {
      setHypeAnimations(prev => ({ ...prev, [postId]: true }));
      setTimeout(() => setHypeAnimations(prev => ({ ...prev, [postId]: false })), 650);
    }
    setReactionMenuOpenFor(null);

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const userReacts = targetPost.user_reactions || {};
    const wasActive = Boolean(userReacts[reactionKey] || (reactionKey === 'likes' && targetPost.user_liked));

    const rx = targetPost.reactions || {};
    const fullCurr = {
      likes: Number(rx.likes || rx.thumbs || rx.heart || 0),
      horns: Number(rx.horns || 0),
      hype: Number(rx.hype || rx.flame || 0),
      brutal: Number(rx.brutal || rx.heavy || 0),
      respect: Number(rx.respect || 0),
      crushed: Number(rx.crushed || 0),
    };

    const nextUserReacts = { ...userReacts };

    if (!wasActive) {
      Object.keys(nextUserReacts).forEach((k) => {
        if (k !== reactionKey && nextUserReacts[k]) {
          nextUserReacts[k] = false;
          const prevTargetKey = k as keyof typeof fullCurr;
          if (fullCurr[prevTargetKey] > 0) {
            fullCurr[prevTargetKey] -= 1;
          }
        }
      });
      nextUserReacts[reactionKey] = true;
      fullCurr[reactionKey as keyof typeof fullCurr] += 1;

      // Award Sonic Footprint XP for signal reaction!
      awardSonicPoints('signal_contributor', 2, `Reacted to scene transmission with ${reactionKey === 'hype' ? 'Flame 🔥' : reactionKey}`);
    } else {
      nextUserReacts[reactionKey] = false;
      if (fullCurr[reactionKey as keyof typeof fullCurr] > 0) {
        fullCurr[reactionKey as keyof typeof fullCurr] -= 1;
      }
    }

    // Optimistically update posts in UI
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          reactions: fullCurr,
          likes_count: fullCurr.likes,
          user_liked: Boolean(nextUserReacts.likes),
          user_reactions: nextUserReacts,
        };
      }
      return p;
    }));

    // Persist locally in reactionStore & dispatch global sync
    savePostReaction(postId, fullCurr, nextUserReacts, activeUserId);

    // Persist to Supabase
    try {
      const { data: existingRows } = await supabase
        .from('nexus_posts')
        .select('id, data')
        .or(`id.eq.${postId},id.eq.nexus_post_${postId}`)
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        const row = existingRows[0];
        const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
        await supabase.from('nexus_posts').update({
          reactions: fullCurr,
          likes_count: fullCurr.likes,
          data: {
            ...postObj,
            reactions: fullCurr,
            likes_count: fullCurr.likes,
          },
        }).eq('id', row.id);
      }

      try {
        await supabase.rpc('toggle_post_reaction', {
          p_post_id: postId,
          p_profile_id: activeUserId,
          p_reaction_type: reactionKey,
        });
      } catch (_) {}
    } catch (err) {
      console.warn('Notice syncing reaction to database:', err);
    }
  };

  const startLongPress = (postId: string) => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setReactionMenuOpenFor(postId);
    }, 380);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentSubmit = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const draft = (commentDrafts[postId] || '').trim();
    if (!draft) return;

    const parentInfo = replyingTo[postId];
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const authorName = currentUserName || 'Fan';

    const newCommentObj = {
      id: commentId,
      post_id: postId,
      user_id: activeUserId,
      parent_comment_id: parentInfo?.commentId || null,
      username: authorName,
      author: authorName,
      text: draft,
      content: draft,
      time: 'Just now',
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // 1. Optimistically update local posts state
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const existingComments = Array.isArray(p.comments) ? p.comments : [];
        return {
          ...p,
          comments: [...existingComments, newCommentObj]
        };
      }
      return p;
    }));

    // Reset input draft
    setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
    setReplyingTo(prev => ({ ...prev, [postId]: null }));

    // 2. Persist in localStorage
    try {
      const cachedKey = `nexus_post_comments_${postId}`;
      const rawPrev = localStorage.getItem(cachedKey);
      const parsedPrev = rawPrev ? JSON.parse(rawPrev) : [];
      localStorage.setItem(cachedKey, JSON.stringify([...parsedPrev, newCommentObj]));
    } catch (_) {}

    // 3. Persist to Supabase
    try {
      await supabase.from('nexus_post_comments').insert([{
        id: commentId,
        post_id: postId,
        user_id: activeUserId,
        parent_comment_id: parentInfo?.commentId || null,
        content: draft,
        created_at: new Date().toISOString()
      }]);

      const { data: rows } = await supabase
        .from('nexus_posts')
        .select('id, data')
        .or(`id.eq.${postId},id.eq.nexus_post_${postId}`)
        .limit(1);

      if (rows && rows.length > 0) {
        const row = rows[0];
        const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
        const mergedComments = [...(postObj.comments || []), newCommentObj];
        await supabase.from('nexus_posts').update({
          data: {
            ...postObj,
            comments: mergedComments
          }
        }).eq('id', row.id);
      }
    } catch (err) {
      console.warn('Notice saving comment to database:', err);
    }

    // 4. Dispatch sync event for other views
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_comment_added', {
        detail: { postId, comment: newCommentObj }
      }));
    }

    // 5. Award Sonic Footprint points!
    awardSonicPoints('signal_contributor', 5, `Commented on scene transmission: "${draft.substring(0, 30)}${draft.length > 30 ? '...' : ''}"`);

    triggerNotification?.("💬 Comment published to transmission thread.");
  };

  const handleShare = async (post: TimelinePost) => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?post=${post.id}` : '';
    const shareTitle = `Underground Transmission by ${post.author?.name || 'Nexus Artist'}`;
    const shareText = post.content ? post.content.substring(0, 120) : 'Check out this underground transmission on the Nexus Network.';

    let sharedNatively = false;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl || window.location.href,
        });
        sharedNatively = true;
      } catch (_) {
        // Fall through to clipboard
      }
    }

    if (!sharedNatively) {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl || `${shareTitle}: ${post.content || ''}`);
        }
      } catch (_) {}
    }

    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2500);

    // Award Sonic Footprint points!
    awardSonicPoints('signal_contributor', 3, `Shared scene transmission by ${post.author?.name || 'artist'}`);

    triggerNotification?.("🔗 Signal link copied to clipboard!");

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_post_shared', {
        detail: { postId: post.id }
      }));
    }
  };

  const selectedProfileId = selectedUserProfile?.id;
  const selectedProfileName = selectedUserProfile?.name;

  const handleVotePoll = useCallback(async (postId: string, optionId: string, currentPoll: any) => {
    const updatedOptions = currentPoll.options.map((opt: any) =>
      opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
    );
    const updatedTotal = (currentPoll.totalVotes || currentPoll.options.reduce((a: any, b: any) => a + (b.votes || 0), 0)) + 1;

    setPollVotes(prev => {
      const next = {
        ...prev,
        [postId]: {
          optionId,
          totalVotes: updatedTotal,
          options: updatedOptions
        }
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nexus_poll_votes_map', JSON.stringify(next));
          localStorage.setItem(`nexus_poll_vote_${postId}`, JSON.stringify({
            optionId,
            totalVotes: updatedTotal,
            options: updatedOptions
          }));
        } catch (e) {}
      }
      return next;
    });

    try {
      const activeUserId = localStorage.getItem('nexus_active_profile_id') || localStorage.getItem('nexus_user_profile_id') || userId || 'anonymous';
      const pollId = currentPoll.pollId || postId;
      const optionIndex = currentPoll.options.findIndex((opt: any) => opt.id === optionId);
      await supabase.from('nexus_poll_votes').insert({
        poll_id: pollId,
        user_id: activeUserId,
        selected_option_index: optionIndex >= 0 ? optionIndex : 0
      });
    } catch (err) {
      console.warn('Notice: Poll vote logging note:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_poll_voted', {
        detail: { postId, optionId, currentPoll }
      }));
    }

    triggerNotification?.("🗳️ Vote cast in underground poll!");
  }, [userId, triggerNotification]);

  const fetchTimelinePosts = useCallback(async () => {
    if (posts.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const targetId = profileId || userId || selectedProfileId || '421610eb-3a87-4da6-b843-1adb4ab6aecb';
      const targetName = (profileName || selectedProfileName || '').toLowerCase();

      // Query posts for this profile
      let query = supabase
        .from('nexus_posts')
        .select('*')
        .eq('profile_id', targetId);

      let { data, error: selectErr } = await query.order('created_at', { ascending: false });

      // Fallback strategy: Select all posts and filter in memory by profile_id or JSONB data
      if (selectErr || !data || data.length === 0) {
        const fallbackAll = await supabase
          .from('nexus_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!fallbackAll.error && fallbackAll.data) {
          data = fallbackAll.data.filter((item: any) => {
            const postObj = typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {});

            if (item.profile_id === targetId || item.author_id === targetId || item.user_id === targetId) return true;
            if (postObj) {
              if (postObj.profile_id === targetId || postObj.postedBy === targetId || postObj.author?.id === targetId || postObj.author_id === targetId || postObj.userId === targetId) return true;
              if (targetName && (
                postObj.author?.name?.toLowerCase() === targetName ||
                postObj.authorName?.toLowerCase() === targetName ||
                postObj.author?.username?.toLowerCase() === targetName ||
                (targetName.includes('virulent') && (postObj.author?.name?.toLowerCase()?.includes('virulent') || postObj.authorName?.toLowerCase()?.includes('virulent')))
              )) return true;
            }
            return false;
          });
          selectErr = null;
        }
      }

      if (selectErr) {
        console.warn('Post query notice:', selectErr.message);
        setError(selectErr.message);
      }

      const formattedPosts: TimelinePost[] = (data || []).filter((item: any) => {
        const postObj = typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {});
        // Exclude quiet vault posts and archived asset posts from timeline view
        if (
          postObj.is_gallery_only === true ||
          postObj.post_to_feed === false ||
          postObj.hidden_from_feed === true ||
          postObj.gallery_only === true ||
          postObj.is_archived_asset === true ||
          item.content === 'Archived Profile Photo' ||
          item.content === 'Archived Cover Photo' ||
          postObj.content === 'Archived Profile Photo' ||
          postObj.content === 'Archived Cover Photo' ||
          String(item.content || '').startsWith('Archived ') ||
          String(postObj.content || '').startsWith('Archived ')
        ) {
          return false;
        }
        return true;
      }).map((item: any) => {
        const postObj = typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {});

        const rawMediaUrl =
          getValidUrl(item.media_url) ||
          getValidUrl(postObj.media_url) ||
          getValidUrl(postObj.mediaUrl) ||
          getValidUrl(postObj.image) ||
          getValidUrl(postObj.image_url) ||
          getValidUrl(postObj.imageUrl) ||
          (Array.isArray(postObj.images) && postObj.images.length > 0 ? getValidUrl(postObj.images[0]) : null) ||
          getValidUrl(postObj.eventData?.flyerUrl) ||
          getValidUrl(postObj.merchData?.imageUrl) ||
          getValidUrl(postObj.songData?.coverUrl) ||
          getValidUrl(postObj.tapeData?.audioUrl) ||
          getValidUrl(postObj.youtubeUrl) ||
          getValidUrl(postObj.youtube_url) ||
          null;

        const imagesArray: string[] = Array.isArray(postObj.images) && postObj.images.length > 0
          ? postObj.images.map((img: any) => getValidUrl(img)).filter(Boolean) as string[]
          : (rawMediaUrl ? [rawMediaUrl] : []);

        // Thorough avatar resolution across older post schema variations and profile fallbacks
        let savedLocalAvatar: string | null = null;
        if (typeof window !== 'undefined') {
          savedLocalAvatar = localStorage.getItem('nexus_avatar') || localStorage.getItem('nexus_user_avatar') || null;
          if (!savedLocalAvatar) {
            try {
              const bOverride = localStorage.getItem('band_profile_override');
              if (bOverride) {
                const parsed = JSON.parse(bOverride);
                savedLocalAvatar = parsed.avatar_url || parsed.logo_url || parsed.avatar || null;
              }
            } catch (e) {
              // ignore
            }
          }
        }

        const resolvedRawAvatar = 
          (postObj.author?.avatar && !postObj.author.avatar.includes('ui-avatars.com') ? postObj.author.avatar : null) ||
          (postObj.authorAvatar && !postObj.authorAvatar.includes('ui-avatars.com') ? postObj.authorAvatar : null) ||
          (postObj.author?.avatar_url && !postObj.author.avatar_url.includes('ui-avatars.com') ? postObj.author.avatar_url : null) ||
          (postObj.author?.logo_url && !postObj.author.logo_url.includes('ui-avatars.com') ? postObj.author.logo_url : null) ||
          (postObj.avatar && !postObj.avatar.includes('ui-avatars.com') ? postObj.avatar : null) ||
          (postObj.avatar_url && !postObj.avatar_url.includes('ui-avatars.com') ? postObj.avatar_url : null) ||
          (postObj.profile_avatar && !postObj.profile_avatar.includes('ui-avatars.com') ? postObj.profile_avatar : null) ||
          (postObj.logo_url && !postObj.logo_url.includes('ui-avatars.com') ? postObj.logo_url : null) ||
          (item.avatar && !item.avatar.includes('ui-avatars.com') ? item.avatar : null) ||
          (item.avatar_url && !item.avatar_url.includes('ui-avatars.com') ? item.avatar_url : null) ||
          (item.author_avatar && !item.author_avatar.includes('ui-avatars.com') ? item.author_avatar : null) ||
          (item.profile_avatar && !item.profile_avatar.includes('ui-avatars.com') ? item.profile_avatar : null) ||
          (selectedUserProfile?.logo_url) ||
          (selectedUserProfile?.avatar) ||
          (selectedUserProfile?.avatar_url) ||
          (selectedUserProfile?.profile_avatar) ||
          (selectedUserProfile?.profile_image) ||
          savedLocalAvatar ||
          null;

        const resolvedPollData = postObj.pollData || item.poll_data || postObj.poll_data || item.pollData || null;

        const postId = item.id || postObj.id || `post_${Date.now()}_${Math.random()}`;
        const localCommentsRaw = typeof window !== 'undefined' ? localStorage.getItem(`nexus_post_comments_${postId}`) : null;
        let localComments: any[] = [];
        if (localCommentsRaw) {
          try { localComments = JSON.parse(localCommentsRaw); } catch (_) {}
        }
        const postComments = Array.isArray(postObj.comments)
          ? postObj.comments
          : Array.isArray(item.comments)
          ? item.comments
          : [];
        const commentMap = new Map();
        postComments.forEach((c: any) => { if (c?.id) commentMap.set(c.id, c); });
        localComments.forEach((c: any) => { if (c?.id) commentMap.set(c.id, c); });
        const finalComments = Array.from(commentMap.values());

        const basePost = {
          id: postId,
          profile_id: item.profile_id || item.author_id || item.user_id || postObj.profile_id || postObj.author_id || postObj.user_id,
          author_id: item.author_id || item.profile_id || item.user_id || postObj.author_id || postObj.profile_id || postObj.author_id,
          user_id: item.user_id || item.profile_id || item.author_id || postObj.user_id || postObj.profile_id || postObj.author_id,
          content: item.content || postObj.content || postObj.message || '',
          media_url: rawMediaUrl,
          images: imagesArray,
          created_at: item.created_at || postObj.timestamp || new Date().toISOString(),
          author: {
            name: postObj.author?.name || postObj.authorName || selectedProfileName || 'Nexus User',
            avatar: resolvedRawAvatar,
            role: postObj.author?.role || postObj.authorRole || (item.role) || (item.author_role) || selectedUserProfile?.role || 'Band',
            full_name: postObj.author?.full_name || postObj.authorFullName || selectedUserProfile?.full_name,
            workspace_type: postObj.workspace_type || postObj.workspaceType || (item.workspace_type) || selectedUserProfile?.active_workspace || ''
          },
          workspace_type: postObj.workspace_type || postObj.workspaceType || (item.workspace_type) || selectedUserProfile?.active_workspace || '',
          type: postObj.type || (resolvedPollData ? 'poll' : postObj.eventData ? 'event' : postObj.merchData ? 'merch' : postObj.songData ? 'track' : 'post'),
          tag: postObj.tag || (resolvedPollData ? 'SLAM DISCUSSION' : postObj.eventData ? 'DIY EVENT' : postObj.merchData ? 'MERCH DROP' : postObj.songData ? 'AUDIO RELEASE' : 'TRANSMISSION'),
          reactions_count: postObj.reactions?.length || 0,
          reactions: postObj.reactions || item.reactions || { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 },
          user_reactions: postObj.user_reactions || item.user_reactions || {},
          user_liked: Boolean(postObj.user_liked || item.user_liked),
          likes_count: Number(postObj.likes_count || item.likes_count || 0),
          comments: finalComments,
          eventData: postObj.eventData || item.event_data,
          merchData: postObj.merchData,
          songData: postObj.songData,
          tapeData: postObj.tapeData,
          pollData: resolvedPollData,
          bandcampUrl: postObj.bandcampUrl || postObj.bandcamp_url || item.bandcamp_url || item.bandcampUrl || (rawMediaUrl && typeof rawMediaUrl === 'string' && rawMediaUrl.includes('bandcamp.com') ? rawMediaUrl : null),
          bandcampData: postObj.bandcampData || postObj.bandcamp_data || item.bandcamp_data || item.bandcampData
        };

        return mergePostWithReactions(basePost, activeUserId);
      });

      // Also merge any posts from feed props or local cache for this profile
      const currentFeed = feedRef.current;
      const feedSources: any[] = [];
      if (Array.isArray(currentFeed) && currentFeed.length > 0) {
        feedSources.push(...currentFeed);
      }
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('nexus_feed_posts');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) feedSources.push(...parsed);
          }
        } catch (e) {}
      }

      if (feedSources.length > 0) {
        feedSources.forEach((fp: any) => {
          if (!fp) return;
          // Exclude quiet vault posts and archived assets
          if (
            fp.is_gallery_only === true ||
            fp.post_to_feed === false ||
            fp.hidden_from_feed === true ||
            fp.gallery_only === true ||
            fp.is_archived_asset === true ||
            fp.content === 'Archived Profile Photo' ||
            fp.content === 'Archived Cover Photo' ||
            String(fp.content || '').startsWith('Archived ')
          ) {
            return;
          }

          const aId = fp.authorId || fp.author_id || fp.userId || fp.profile_id || fp.author?.id;
          const aName = (fp.authorName || fp.author?.name || '').toLowerCase();
          const matches = (targetId && aId === targetId) ||
            (targetName && aName && (aName === targetName || aName.includes(targetName) || targetName.includes(aName))) ||
            (targetName.includes('virulent') && aName.includes('virulent')) ||
            (targetName.includes('miguel') && (aName.includes('miguel') || aName.includes('goregrinder') || aName.includes('virulent'))) ||
            (selectedUserProfile?.isYou && (fp.isYou || aId === '421610eb-3a87-4da6-b843-1adb4ab6aecb' || aName.includes('miguel') || aName.includes('virulent')));

          if (matches) {
            const existing = formattedPosts.find(p => p.id === fp.id);
            if (!existing) {
              const localCommentsRaw = typeof window !== 'undefined' ? localStorage.getItem(`nexus_post_comments_${fp.id}`) : null;
              let localComments: any[] = [];
              if (localCommentsRaw) {
                try { localComments = JSON.parse(localCommentsRaw); } catch (_) {}
              }
              const commentMap = new Map();
              (Array.isArray(fp.comments) ? fp.comments : []).forEach((c: any) => { if (c?.id) commentMap.set(c.id, c); });
              localComments.forEach((c: any) => { if (c?.id) commentMap.set(c.id, c); });
              const finalComments = Array.from(commentMap.values());

              const formatted = mergePostWithReactions({
                id: fp.id,
                profile_id: fp.profile_id || targetId,
                author_id: fp.authorId || fp.author_id || targetId,
                user_id: fp.userId || targetId,
                content: fp.content || fp.message || '',
                media_url: fp.media_url || fp.imageUrl || fp.image_url || null,
                images: Array.isArray(fp.images) && fp.images.length > 0 ? fp.images : (fp.imageUrl || fp.media_url ? [fp.imageUrl || fp.media_url] : []),
                created_at: fp.created_at || fp.timestamp || new Date().toISOString(),
                author: {
                  name: fp.author?.name || fp.authorName || selectedProfileName || targetName || 'User',
                  avatar: fp.author?.avatar || fp.authorAvatar || selectedUserProfile?.avatar || null,
                  role: fp.author?.role || fp.authorRole || selectedUserProfile?.role || 'Band',
                  full_name: fp.author?.full_name || fp.authorFullName,
                  workspace_type: fp.workspace_type || selectedUserProfile?.active_workspace || ''
                },
                workspace_type: fp.workspace_type || selectedUserProfile?.active_workspace || '',
                type: fp.type || (fp.pollData ? 'poll' : 'post'),
                tag: fp.tag || (fp.pollData ? 'SLAM DISCUSSION' : 'TRANSMISSION'),
                reactions_count: fp.reactions?.length || 0,
                reactions: fp.reactions || { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 },
                user_reactions: fp.user_reactions || {},
                user_liked: Boolean(fp.user_liked),
                likes_count: Number(fp.likes_count || 0),
                comments: finalComments,
                eventData: fp.eventData,
                merchData: fp.merchData,
                songData: fp.songData,
                tapeData: fp.tapeData,
                pollData: fp.pollData,
                bandcampUrl: fp.bandcampUrl || fp.bandcamp_url || (fp.media_url && typeof fp.media_url === 'string' && fp.media_url.includes('bandcamp.com') ? fp.media_url : null) || (fp.imageUrl && typeof fp.imageUrl === 'string' && fp.imageUrl.includes('bandcamp.com') ? fp.imageUrl : null),
                bandcampData: fp.bandcampData || fp.bandcamp_data
              }, activeUserId);

              formattedPosts.unshift(formatted);
            } else if (fp.pollData && !existing.pollData) {
              existing.pollData = fp.pollData;
            }
          }
        });
      }

      // Deduplicate posts on the timeline: keep only unique posts (by id or content + media),
      // and for profile picture update announcements, retain only the single newest one
      const seenPostKeys = new Set<string>();
      const deduplicatedPosts = formattedPosts.filter(p => {
        const primaryImage = (p.images && p.images[0]) || p.media_url || '';
        const contentKey = (p.content || '').trim().toLowerCase();

        // If it's an automated profile update signal, keep only the newest one per author
        if (contentKey.includes('updated profile picture')) {
          const authorKey = (p.author?.name || p.user_id || '').toLowerCase();
          const signalKey = `profile_update_signal_${authorKey}`;
          if (seenPostKeys.has(signalKey)) {
            return false;
          }
          seenPostKeys.add(signalKey);
        }

        const dedupKey = p.id ? String(p.id) : `${contentKey}_${primaryImage}`;
        if (seenPostKeys.has(dedupKey)) {
          return false;
        }
        seenPostKeys.add(dedupKey);
        return true;
      });

      setPosts(deduplicatedPosts);
    } catch (err: any) {
      console.error('Error loading timeline posts:', err);
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [profileId, userId, profileName, selectedProfileId, selectedProfileName]);

  useEffect(() => {
    fetchTimelinePosts();

    // Sync via event listener for 'nexus_post_created'
    const handlePostCreated = () => {
      console.log('Detected nexus_post_created event. Refreshing timeline...');
      fetchTimelinePosts();
    };

    const handlePostDeleted = (e: any) => {
      const deletedId = e.detail?.id || e.detail;
      if (deletedId) {
        setPosts(prev => prev.filter(p => p.id !== deletedId && p.id !== `nexus_post_${deletedId}`));
      }
    };

    const handlePollVotedGlobal = (e: any) => {
      const detail = e.detail;
      if (detail?.postId && detail?.optionId) {
        setPollVotes(prev => ({
          ...prev,
          [detail.postId]: {
            optionId: detail.optionId,
            totalVotes: detail.currentPoll?.totalVotes || 1,
            options: detail.currentPoll?.options || []
          }
        }));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('nexus_post_created', handlePostCreated);
      window.addEventListener('nexus_post_deleted', handlePostDeleted as EventListener);
      window.addEventListener('nexus_poll_voted', handlePollVotedGlobal as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('nexus_post_created', handlePostCreated);
        window.removeEventListener('nexus_post_deleted', handlePostDeleted as EventListener);
        window.removeEventListener('nexus_poll_voted', handlePollVotedGlobal as EventListener);
      }
    };
  }, [fetchTimelinePosts]);

  const handleImageError = (postId: string) => {
    setFailedImages((prev) => ({ ...prev, [postId]: true }));
  };

  return (
    <div className="space-y-4 w-full text-left font-sans">
      {loading ? (
        <div className="py-12 text-center bg-zinc-950/40 border border-zinc-900 rounded-xl">
          <div className="inline-block animate-spin w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full mb-2" />
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
            SYNCHRONIZING TIMELINE TRANSMISSIONS...
          </p>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post, idx) => {
            const ytId = extractYoutubeId(post.media_url);
            const isAudio = isAudioUrl(post.media_url);
            const isVideo = isVideoUrl(post.media_url);
            const isYt = isYoutubeUrl(post.media_url) || !!ytId;
            const isBandcamp = Boolean(
              post.bandcampUrl || 
              post.bandcamp_url || 
              post.bandcampData || 
              post.bandcamp_data || 
              (post.media_url && typeof post.media_url === 'string' && post.media_url.includes('bandcamp.com')) ||
              (post.mediaUrl && typeof post.mediaUrl === 'string' && post.mediaUrl.includes('bandcamp.com')) ||
              (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.includes('bandcamp.com')) ||
              (post.image && typeof post.image === 'string' && post.image.includes('bandcamp.com')) ||
              (post.content && typeof post.content === 'string' && post.content.includes('bandcamp.com'))
            );
            const hasImage = post.media_url && !isAudio && !isVideo && !isYt && !isBandcamp && !failedImages[post.id];
            const postTheme = resolvePostRoleTheme(post, selectedUserProfile);

            const rx = post.reactions || {};
            const totalReactions = 
              (rx.likes || 0) + 
              (rx.horns || 0) + 
              (rx.hype || 0) + 
              (rx.brutal || 0) + 
              (rx.respect || 0) + 
              (rx.crushed || 0) +
              (rx.thumbs || 0) +
              (rx.heavy || 0) +
              (rx.flame || 0) +
              (rx.heart || 0) || 
              post.likes_count || 0;

            const activeReactionIcons: string[] = [];
            if ((rx.likes || 0) > 0 || (rx.thumbs || 0) > 0 || (rx.heart || 0) > 0 || post.user_reactions?.likes || post.user_reactions?.like || post.user_liked) activeReactionIcons.push('👍');
            if ((rx.horns || 0) > 0 || post.user_reactions?.horns) activeReactionIcons.push('🤘');
            if ((rx.hype || 0) > 0 || (rx.flame || 0) > 0 || post.user_reactions?.hype || post.user_reactions?.flame) activeReactionIcons.push('🔥');
            if ((rx.brutal || 0) > 0 || (rx.heavy || 0) > 0 || post.user_reactions?.brutal || post.user_reactions?.heavy) activeReactionIcons.push('🔨');
            if ((rx.respect || 0) > 0 || post.user_reactions?.respect) activeReactionIcons.push('👊');
            if ((rx.crushed || 0) > 0 || post.user_reactions?.crushed) activeReactionIcons.push('⚓');

            const hasUserReacted = Boolean(post.user_liked || Object.values(post.user_reactions || {}).some(Boolean));
            const userActiveReactionKey = Object.keys(post.user_reactions || {}).find(k => post.user_reactions?.[k]);
            const activePaletteItem = REACTION_PALETTE.find(r => r.id === userActiveReactionKey) || 
              (post.user_liked ? { id: 'likes', emoji: '👍', label: 'Like', color: 'text-sky-400' } : null);

            const defaultReactionId = post.tag === 'SONG SHARE' ? 'brutal' : post.tag === 'ALBUM RELEASE' ? 'hype' : 'hype';
            const postCommentsList = Array.isArray(post.comments) ? post.comments : [];

            return (
              <div
                key={post.id ? `tl_post_${post.id}_${idx}` : `tl_idx_${idx}`}
                className="bg-zinc-950/80 border border-zinc-900 hover:border-zinc-800 transition-all rounded-xl p-4 shadow-lg text-left w-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Micro glow avatar container - static stroke + glow */}
                    <div className="relative group/avatar shrink-0">
                      <div 
                        className="relative p-[2px] rounded-full transition-transform duration-200 group-hover/avatar:scale-105"
                        style={{
                          backgroundColor: postTheme.colorHex,
                          boxShadow: `0 0 10px ${postTheme.colorHex}66, 0 0 20px ${postTheme.colorHex}26`
                        }}
                      >
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-950 flex items-center justify-center text-xs font-black uppercase overflow-hidden border border-zinc-950">
                          {post.author?.avatar ? (
                            <img 
                              src={post.author?.avatar} 
                              alt="" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const fallback = selectedUserProfile?.logo_url || selectedUserProfile?.avatar || selectedUserProfile?.avatar_url;
                                if (fallback && e.currentTarget.src !== fallback) {
                                  e.currentTarget.src = fallback;
                                } else {
                                  e.currentTarget.style.display = 'none';
                                }
                              }}
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="font-mono font-bold" style={{ color: postTheme.colorHex }}>
                              {(post.author?.name ? post.author.name.replace(/^@/, '').substring(0, 2) : 'NX').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-mono font-bold text-zinc-200 leading-tight">
                        {post.author?.name || profileName || 'User'}
                      </p>
                      {/* Full Name in FULL CAPS */}
                      {(selectedUserProfile?.full_name || (post.author as any)?.full_name || (post.author as any)?.legal_name) && (
                        <p 
                          className="text-[10px] font-mono font-bold tracking-wider mt-0.5 truncate uppercase"
                          style={{ color: postTheme.colorHex }}
                        >
                          {(selectedUserProfile?.full_name || (post.author as any)?.full_name || (post.author as any)?.legal_name).toUpperCase()}
                        </p>
                      )}
                      <p className="text-[9px] font-mono text-zinc-500 mt-0.5">
                        {new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span 
                          className="text-[9px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5"
                          style={{ color: postTheme.colorHex }}
                        >
                          <span 
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ 
                              backgroundColor: postTheme.colorHex,
                              boxShadow: `0 0 8px ${postTheme.colorHex}` 
                            }} 
                          />
                          {postTheme.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-rose-400 font-mono font-bold uppercase tracking-wider">
                      {post.tag || post.type}
                    </span>
                  </div>
                </div>

                {post.content && (
                  <p className="text-xs text-zinc-300 leading-relaxed my-2 whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}

                {/* Event Embed Card */}
                {post.eventData && (
                  <div className="bg-[#0e0c07] rounded-xl border border-amber-500/60 overflow-hidden my-3 shadow-[0_0_20px_rgba(245,158,11,0.15)] font-mono">
                    <div className="p-3 bg-gradient-to-r from-amber-950/80 via-zinc-950 to-amber-950/40 border-b border-amber-900/40 flex items-center justify-between">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> {post.eventData.date} {post.eventData.time ? `• ${post.eventData.time}` : ''}
                      </span>
                      <span className="bg-amber-950 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        {post.eventData.cost || 'FREE'}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <h4 className="text-sm font-extrabold text-white uppercase font-display">{post.eventData.title}</h4>
                      
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{post.eventData.locationName}</span>
                        </div>
                        {post.eventData.isSecretLocation ? (
                          <p className="text-[10px] text-red-400 mt-0.5 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Secret Location — DM Host for details
                          </p>
                        ) : post.eventData.address ? (
                          <p className="text-[10px] text-zinc-400 mt-0.5">{post.eventData.address}</p>
                        ) : null}
                      </div>

                      {post.eventData.lineup && post.eventData.lineup.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {post.eventData.lineup.map((band: string, i: number) => (
                            <span key={`lineup-${post.id || 'p'}-${band}-${i}`} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-amber-200 text-[9px] rounded font-bold uppercase">
                              {band}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-400" /> {post.eventData.rsvpsCount || 1} Attending
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = !rsvpedEvents[post.id];
                            setRsvpedEvents(prev => ({ ...prev, [post.id]: nextVal }));
                            triggerNotification?.("🔥 RSVP Confirmed! You're on the list for this show.");
                            if (nextVal) {
                              try {
                                window.dispatchEvent(new CustomEvent('nexus_show_rsvped', {
                                  detail: { title: post.eventData?.title }
                                }));
                              } catch (_) {}
                            }
                          }}
                          className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all ${
                            rsvpedEvents[post.id]
                              ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                              : 'bg-amber-500 hover:bg-amber-400 text-black'
                          }`}
                        >
                          {rsvpedEvents[post.id] ? "RSVP'D (GOING)" : "RSVP / I'M GOING"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Poll Embed Widget */}
                {post.pollData && (
                  <div className="my-2">
                    <PollWidget
                      post={post}
                      pollVote={pollVotes[post.id]}
                      onVote={(optId, poll) => {
                        handleVotePoll(post.id, optId, poll);
                        try {
                          window.dispatchEvent(new CustomEvent('nexus_poll_voted', { detail: { postId: post.id, optId } }));
                        } catch (_) {}
                      }}
                    />
                  </div>
                )}

                {/* Tape / Bootleg Embed Card */}
                {post.tapeData && (
                  <TapeEmbedCard
                    variant="profile"
                    post={post as any}
                    isPlaying={playingTapeId === post.id}
                    progress={tapeProgress[post.id] || 0}
                    onTogglePlay={() => {
                      const audioUrl = post.tapeData?.audioUrl || 
                        post.tapeData?.audio_url || 
                        post.tapeData?.audio ||
                        ((post as any)?.media_url && isAudioUrl((post as any).media_url) ? (post as any).media_url : undefined) ||
                        (post.mediaUrl && isAudioUrl(post.mediaUrl) ? post.mediaUrl : undefined);
                      tapeAudioEngine.togglePlay(post.id, audioUrl);
                      try {
                        window.dispatchEvent(new CustomEvent('nexus_tape_played', { detail: { title: post.tapeData?.title || 'Bootleg Tape' } }));
                      } catch (_) {}
                    }}
                    onSeek={(progress) => {
                      setTapeProgress((prev) => ({ ...prev, [post.id]: progress }));
                      if (playingTapeId === post.id) {
                        tapeAudioEngine.seek(progress);
                      }
                    }}
                    onStop={() => {
                      tapeAudioEngine.stop(post.id);
                      setTapeProgress((prev) => ({ ...prev, [post.id]: 0 }));
                    }}
                  />
                )}

                {/* Audio File Player */}
                {isAudio && post.media_url && !post.tapeData && (
                  <div className="my-3 p-3 bg-zinc-900/90 rounded-xl border border-zinc-800/80 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-rose-400 text-[10px] font-mono font-bold tracking-wider uppercase">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Audio Track / Transmission</span>
                    </div>
                    <audio controls src={post.media_url} className="w-full h-9 rounded-lg accent-rose-500" />
                  </div>
                )}

                {/* Video File Player */}
                {isVideo && post.media_url && (
                  <div className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-black">
                    <video controls src={post.media_url} className="w-full max-h-80 object-contain" />
                  </div>
                )}

                {/* YouTube Video Player */}
                {isYt && ytId && (
                  <YouTubeEmbedCard youtubeId={ytId} />
                )}

                {/* Bandcamp Embed Player - compact version to fit within public profile card margins */}
                {isBandcamp && (
                  <div className="my-2.5 w-full max-w-full overflow-hidden">
                    <BandcampEmbedCard 
                      post={post}
                      compact={true}
                      variant="timeline"
                    />
                  </div>
                )}

                {/* Image Display with Error Handling & Click to Enlarge */}
                {hasImage && post.media_url && (
                  <div
                    className="mt-3 max-h-80 min-h-[140px] bg-zinc-900/80 rounded-xl overflow-hidden border border-zinc-800/90 cursor-pointer relative group/postImg flex items-center justify-center"
                    onClick={() => {
                      if (triggerPictureViewer) {
                        triggerPictureViewer({
                          photoId: post.id,
                          username: post.author?.name,
                          imageUrl: post.media_url,
                          title: 'Timeline Photo',
                          caption: post.content
                        });
                      }
                    }}
                  >
                    <img
                      src={post.media_url}
                      onError={() => handleImageError(post.id)}
                      className="w-full h-full object-cover max-h-80 opacity-90 group-hover/postImg:opacity-100 group-hover/postImg:scale-105 transition-all duration-300"
                      alt="Post Media"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/postImg:opacity-100 transition-opacity flex items-end p-2.5">
                      <span className="text-[10px] font-mono text-white flex items-center gap-1.5 font-bold">
                        <ImageIcon className="w-3.5 h-3.5 text-rose-400" /> Click to enlarge
                      </span>
                    </div>
                  </div>
                )}

                {/* Divider Line Under Media / Content */}
                <div className="border-t border-zinc-900/80 my-2.5" />

                {/* Reactions Summary Counter Row */}
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                  <div className="bg-zinc-950/90 border border-zinc-900 px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 shadow-sm">
                    <span className="flex items-center gap-1">
                      <span className="text-sm">{activeReactionIcons.length > 0 ? activeReactionIcons.join('') : '🔥'}</span>
                      <span>{totalReactions} reaction{totalReactions === 1 ? '' : 's'}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className="text-[11px] font-mono font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {postCommentsList.length} Comment{postCommentsList.length === 1 ? '' : 's'}
                  </button>
                </div>

                {/* Action Ribbon: 3 Buttons (Reaction, Reply, Share) */}
                <div className="grid grid-cols-3 gap-2 relative">
                  {/* Hype Flame Floating Animation Effect */}
                  {hypeAnimations[post.id] && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-visible">
                      <div className="animate-ping absolute -top-8 text-5xl text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,1)]">🔥</div>
                      <div className="animate-bounce absolute -top-12 text-6xl text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,1)]" style={{ animationDuration: '0.4s' }}>🔥</div>
                    </div>
                  )}

                  {/* Reaction Options Popover */}
                  {reactionMenuOpenFor === post.id && (
                    <div className="absolute -top-14 left-0 z-50 bg-zinc-950/95 border border-zinc-700/90 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                      {REACTION_PALETTE.map((r, rIdx) => (
                        <button
                          key={`react-pal-${r.id}-${rIdx}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReaction(post.id, r.id);
                          }}
                          className="flex flex-col items-center justify-center p-1.5 px-2 rounded-xl hover:bg-zinc-800 transition-all hover:scale-110 cursor-pointer group/btn"
                          title={r.label}
                        >
                          <span className="text-base leading-none">{r.emoji}</span>
                          <span className="text-[9px] font-mono font-extrabold text-zinc-400 group-hover/btn:text-white mt-0.5 uppercase tracking-wider">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Button 1: Reaction Button matching Feed Palette & Logic */}
                  <button
                    type="button"
                    onMouseDown={() => startLongPress(post.id)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={() => startLongPress(post.id)}
                    onTouchEnd={cancelLongPress}
                    onClick={() => {
                      if (isLongPressRef.current) {
                        isLongPressRef.current = false;
                        return;
                      }
                      if (reactionMenuOpenFor === post.id) {
                        setReactionMenuOpenFor(null);
                        return;
                      }
                      handleReaction(post.id, activePaletteItem?.id || defaultReactionId);
                    }}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer group select-none ${
                      hasUserReacted
                        ? 'bg-rose-950/60 border-rose-600 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                    title="Tap to react • Hold for all reactions"
                  >
                    {activePaletteItem ? (
                      <>
                        <span className="text-sm leading-none">{activePaletteItem.emoji}</span>
                        <span>{activePaletteItem.label}</span>
                      </>
                    ) : post.tag === 'SONG SHARE' ? (
                      <>
                        <span className="text-sm leading-none">🔨</span>
                        <span>Brutal</span>
                      </>
                    ) : post.tag === 'ALBUM RELEASE' ? (
                      <>
                        <span className="text-sm leading-none">🔥</span>
                        <span>Hype</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm leading-none">🔥</span>
                        <span>Flame</span>
                      </>
                    )}
                  </button>

                  {/* Button 2: Comment / Reply Button */}
                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      expandedComments[post.id]
                        ? 'bg-cyan-950/60 border-cyan-600 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>

                  {/* Button 3: Share Button */}
                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                      copiedPostId === post.id
                        ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {copiedPostId === post.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Collapsed Comment Preview Banner */}
                {!expandedComments[post.id] && postCommentsList.length > 0 && (
                  <div 
                    onClick={() => toggleComments(post.id)}
                    className="bg-[#08090b] border border-red-950/40 hover:border-red-900/70 rounded-xl p-3 px-3.5 text-xs transition-all cursor-pointer group mt-2.5 shadow-sm space-y-1.5"
                  >
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-rose-400 mr-2">{postCommentsList[0].username || postCommentsList[0].author}:</span>
                      <span className="text-zinc-200 font-sans leading-relaxed break-words">{postCommentsList[0].text || postCommentsList[0].content}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-zinc-900/80 text-[10px] font-mono">
                      <span className="text-zinc-500 group-hover:text-red-400 transition-colors uppercase font-bold tracking-wider">
                        Click to view all ({postCommentsList.length} comment{postCommentsList.length > 1 ? 's' : ''})
                      </span>
                      <span className="text-zinc-600">
                        {formatPostTimestamp(postCommentsList[0].created_at || postCommentsList[0].time, postCommentsList[0].time)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Expanded Comments Thread & Input Drawer */}
                {expandedComments[post.id] && (
                  <div className="mt-3 space-y-3 bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {postCommentsList.length === 0 ? (
                        <p className="text-[11px] font-mono text-zinc-500 italic py-2">No comments yet. Start the transmission signal.</p>
                      ) : (
                        postCommentsList
                          .filter(c => !c.parent_comment_id)
                          .map((comment, cIdx) => {
                            const replies = postCommentsList.filter(r => r.parent_comment_id === comment.id);
                            return (
                              <div key={comment.id ? `comm-${comment.id}-${cIdx}` : `comm-${cIdx}`} className="space-y-1.5">
                                {/* Top-Level Comment */}
                                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5 text-xs space-y-1">
                                  <div className="flex items-center justify-between font-mono text-[10px]">
                                    <span className="font-bold text-rose-400">{comment.username || comment.author || 'Fan'}</span>
                                    <span className="text-zinc-500">{formatPostTimestamp(comment.created_at || comment.time, comment.time)}</span>
                                  </div>
                                  <p className="text-zinc-200 font-sans leading-relaxed">{comment.text || comment.content}</p>
                                  <div className="flex items-center justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setReplyingTo(prev => ({
                                        ...prev,
                                        [post.id]: { commentId: comment.id, username: comment.username || comment.author || 'Fan' }
                                      }))}
                                      className="text-[10px] font-mono text-rose-400/80 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                      <CornerDownRight className="w-2.5 h-2.5" />
                                      <span>Reply</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Threaded Replies */}
                                {replies.length > 0 && (
                                  <div className="ml-4 pl-2.5 border-l-2 border-rose-900/40 space-y-1.5">
                                    {replies.map((reply, rIdx) => (
                                      <div key={reply.id ? `reply-${reply.id}-${rIdx}` : `reply-${cIdx}-${rIdx}`} className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-2 text-xs space-y-1">
                                        <div className="flex items-center justify-between font-mono text-[10px]">
                                          <span className="font-bold text-cyan-400">{reply.username || reply.author || 'Fan'}</span>
                                          <span className="text-zinc-500">{formatPostTimestamp(reply.created_at || reply.time, reply.time)}</span>
                                        </div>
                                        <p className="text-zinc-300 font-sans leading-relaxed">{reply.text || reply.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                      )}
                    </div>

                    {/* Active Reply Banner */}
                    {replyingTo[post.id] && (
                      <div className="flex items-center justify-between bg-rose-950/40 border border-rose-800/40 rounded-lg px-2.5 py-1 text-[11px] font-mono text-rose-300">
                        <span>Replying to <strong>@{replyingTo[post.id]?.username}</strong></span>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(prev => ({ ...prev, [post.id]: null }))}
                          className="hover:text-white cursor-pointer ml-2 text-zinc-400 hover:text-zinc-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Add Comment Input Form */}
                    <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder={replyingTo[post.id] ? `Reply to @${replyingTo[post.id]?.username}...` : "Write a comment..."}
                        value={commentDrafts[post.id] || ''}
                        onChange={(e) => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/60 font-sans"
                      />
                      <button
                        type="submit"
                        disabled={!(commentDrafts[post.id] || '').trim()}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title="Send comment"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl w-full font-mono">
          <Sparkles className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
            NO TIMELINE TRANSMISSIONS FOUND
          </p>
          <p className="text-[10px] text-zinc-600">
            {isYou || selectedUserProfile?.isYou
              ? "Use the broadcast box above to publish your first post to the network."
              : "This account has not posted any signals to the underground nexus yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default TimelineTab;