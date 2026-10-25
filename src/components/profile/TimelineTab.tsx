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
  CornerDownRight,
  Pencil,
  Trash2,
  MessageSquarePlus,
  Upload,
  Link,
  ChevronDown,
  Globe,
  Tag
} from 'lucide-react';
import { uploadFeedMedia } from '../../lib/storage';
import { YouTubeEmbedCard } from '../social/embeds/YouTubeEmbedCard';
import { PollWidget } from '../social/embeds/PollWidget';
import { TapeEmbedCard } from '../social/embeds/TapeEmbedCard';
import { BandcampEmbedCard } from '../social/embeds/BandcampEmbedCard';
import { PollEmbedData, REACTION_PALETTE } from '../social/timeline/types';
import { tapeAudioEngine } from '../social/utils/tapeAudioEngine';
import { awardSonicPoints } from '../../services/sonicFootprintService';
import { formatPostTimestamp } from '../../utils/socialFeedUtils';
import { savePostReaction, mergePostWithReactions, normalizeReactionCounts } from '../social/utils/reactionStore';
import { isValidStorageOrImageUrl } from '../../services/storageService';
import { communityBandManager } from '../../lib/communityBands';
import { DEFAULT_PERSONAL_AVATAR, resolveCommentAvatar } from '../../utils/bandProfileUtils';
import {
  fetchGlobalInteractions,
  submitGlobalComment,
  submitGlobalReaction,
  generateValidUUID,
  updateGlobalComment,
  deleteGlobalComment
} from '../../services/postInteractionsService';
import { InlineReactionsModal } from '../social/modals/InlineReactionsModal';
import { resolveReactionActor } from '../social/utils/personaResolution';
import { CommentMediaPicker } from '../social/timeline/CommentMediaPicker';
import { pushManager } from '../../lib/pushNotifications';

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
  recipient?: {
    id?: string;
    name?: string;
    handle?: string;
    role?: string;
    [key: string]: any;
  } | null;
  target_profile_id?: string;
  target_profile_name?: string;
  is_timeline_post?: boolean;
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
  targetProfile,
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
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});
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
  const [attachedCommentMedia, setAttachedCommentMedia] = useState<Record<string, { url: string; type: 'image' | 'gif' } | null>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, { commentId: string; username: string } | null>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Comment edit & Reaction popover states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');
  const [viewingReactionsPost, setViewingReactionsPost] = useState<any | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const loggedInUserInfo = typeof window !== 'undefined'
    ? (() => {
        try {
          const raw = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
          if (raw) {
            const p = JSON.parse(raw);
            return {
              id: p.id || p.userId || p.profile_id || '',
              name: p.name || p.full_name || '',
              fullName: p.full_name || p.legal_name || p.name || '',
              handle: (p.console_handle || p.handle || p.username || '').replace(/^@/, ''),
              avatar: p.avatar_url || p.avatar || null,
              role: p.role || p.portalRole || 'Member',
              workspace_type: p.workspace_type || p.active_workspace || ''
            };
          }
        } catch (_) {}
        const rawId = localStorage.getItem('nexus_active_profile_id') || localStorage.getItem('nexus_user_profile_id') || localStorage.getItem('nexus_active_user_uuid') || '';
        return { id: rawId, name: '', fullName: '', handle: '', avatar: null, role: 'Member', workspace_type: '' };
      })()
    : { id: '', name: '', fullName: '', handle: '', avatar: null, role: 'Member', workspace_type: '' };

  const activeUserId = loggedInUserInfo.id || 'current';

  // Timeline Direct Composer state
  const [newPostText, setNewPostText] = useState('');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [selectedPostCategory, setSelectedPostCategory] = useState('');
  const [broadcastToFeed, setBroadcastToFeed] = useState(true);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [customImageUrlDraft, setCustomImageUrlDraft] = useState('');
  const [posterPersonaId, setPosterPersonaId] = useState<string>('default');
  const timelineFileInputRef = useRef<HTMLInputElement | null>(null);

  // Available identities to post as (personal vs active band / creative)
  const availableIdentities = React.useMemo(() => {
    const list: Array<{ id: string; name: string; avatar: string | null; role: string; handle: string; type: string }> = [];
    
    // 1. Current logged-in user profile
    const pId = loggedInUserInfo.id || 'personal';
    const pName = loggedInUserInfo.name || 'You';
    const pAvatar = loggedInUserInfo.avatar || (typeof window !== 'undefined' ? localStorage.getItem('nexus_avatar') : null);
    const pRole = loggedInUserInfo.role || 'Member';
    const pHandle = loggedInUserInfo.handle || '';

    list.push({
      id: pId,
      name: pName,
      avatar: pAvatar,
      role: pRole,
      handle: pHandle,
      type: 'personal'
    });

    // 2. Active Band Override from localStorage
    if (typeof window !== 'undefined') {
      try {
        const bandRaw = localStorage.getItem('band_profile_override') || localStorage.getItem('nexus_active_band');
        if (bandRaw) {
          const b = JSON.parse(bandRaw);
          const bName = b.name || b.band_name;
          if (bName && !list.some(item => item.name.toLowerCase() === bName.toLowerCase())) {
            list.push({
              id: b.id || b.band_id || `band_${bName}`,
              name: bName,
              avatar: b.avatar_url || b.logo_url || b.avatar || null,
              role: 'Band / Artist',
              handle: (b.handle || b.username || bName).toLowerCase().replace(/[^a-z0-9_]/g, ''),
              type: 'band'
            });
          }
        }
      } catch (_) {}

      // 3. Creative / Promoter active workspace
      try {
        const creativeRaw = localStorage.getItem('nexus_creative_profile');
        if (creativeRaw) {
          const c = JSON.parse(creativeRaw);
          if (c?.name && !list.some(item => item.name.toLowerCase() === c.name.toLowerCase())) {
            list.push({
              id: c.id || `creative_${c.name}`,
              name: c.name,
              avatar: c.avatar_url || c.avatar || null,
              role: 'Creative Pro',
              handle: (c.handle || c.name).toLowerCase().replace(/[^a-z0-9_]/g, ''),
              type: 'creative'
            });
          }
        }
      } catch (_) {}
    }

    return list;
  }, [loggedInUserInfo]);

  const activePersona = availableIdentities.find(i => i.id === posterPersonaId) || availableIdentities[0] || {
    id: loggedInUserInfo.id || 'personal',
    name: loggedInUserInfo.name || 'You',
    avatar: loggedInUserInfo.avatar || null,
    role: loggedInUserInfo.role || 'Member',
    handle: loggedInUserInfo.handle || '',
    type: 'personal'
  };

  const activeUserProfile = selectedUserProfile || targetProfile;
  const profileAvatarUrl = activeUserProfile?.avatar_url || activeUserProfile?.avatar || activeUserProfile?.profile_avatar || null;

  const currentUserName = loggedInUserInfo.name || loggedInUserInfo.handle || 'You';

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

    const handleAvatarSync = (e: any) => {
      const detail = e.detail;
      const newUrl = detail?.avatarUrl || detail?.avatar_url || detail?.logo_url || detail?.avatar;
      if (!newUrl) return;
      setFailedAvatars({});
      setPosts(prev => prev.map(p => {
        const raw = p as any;
        const postAuthorId = raw.author_id || raw.profile_id || raw.user_id || raw.authorId || p.author?.id;
        const isSelf = Boolean(
          p.author?.isYou ||
          raw.isYou ||
          (selectedUserProfile?.id && postAuthorId === selectedUserProfile.id) ||
          (detail.id && postAuthorId === detail.id)
        );
        if (isSelf) {
          return {
            ...p,
            author: {
              ...(p.author || {}),
              name: p.author?.name || 'User',
              avatar: newUrl
            }
          };
        }
        return p;
      }));
    };

    const handleCommentUpdateSync = (e: any) => {
      const detail = e.detail;
      if (!detail?.postId || !detail?.commentId) return;
      setPosts(prev => prev.map(p => {
        if (p.id === detail.postId && Array.isArray(p.comments)) {
          return {
            ...p,
            comments: p.comments.map(c => c.id === detail.commentId ? { ...c, text: detail.text, content: detail.text, edited: true } : c)
          };
        }
        return p;
      }));
    };

    const handleCommentDeleteSync = (e: any) => {
      const detail = e.detail;
      if (!detail?.postId || !detail?.commentId) return;
      setPosts(prev => prev.map(p => {
        if (p.id === detail.postId && Array.isArray(p.comments)) {
          return {
            ...p,
            comments: p.comments.filter(c => c.id !== detail.commentId && c.parent_comment_id !== detail.commentId)
          };
        }
        return p;
      }));
    };

    window.addEventListener('nexus_reaction_updated', handleReactionSync as EventListener);
    window.addEventListener('nexus_comment_added', handleCommentSync as EventListener);
    window.addEventListener('nexus_comment_updated', handleCommentUpdateSync as EventListener);
    window.addEventListener('nexus_comment_deleted', handleCommentDeleteSync as EventListener);
    window.addEventListener('nexus_avatar_updated', handleAvatarSync as EventListener);

    return () => {
      window.removeEventListener('nexus_reaction_updated', handleReactionSync as EventListener);
      window.removeEventListener('nexus_comment_added', handleCommentSync as EventListener);
      window.removeEventListener('nexus_comment_updated', handleCommentUpdateSync as EventListener);
      window.removeEventListener('nexus_comment_deleted', handleCommentDeleteSync as EventListener);
      window.removeEventListener('nexus_avatar_updated', handleAvatarSync as EventListener);
    };
  }, []);

  const handleCommentEditStart = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleCommentEditSave = async (postId: string, commentId: string) => {
    const clean = editingCommentText.trim();
    if (!clean) return;

    // Optimistically update
    setPosts(prev => prev.map(p => {
      if (p.id === postId && Array.isArray(p.comments)) {
        return {
          ...p,
          comments: p.comments.map(c => c.id === commentId ? { ...c, text: clean, content: clean, edited: true } : c)
        };
      }
      return p;
    }));

    setEditingCommentId(null);
    setEditingCommentText('');

    try {
      await updateGlobalComment(postId, commentId, clean);
      triggerNotification?.("✏️ Comment updated successfully.");
    } catch (err) {
      console.warn('Failed to update comment:', err);
    }
  };

  const handleCommentDelete = async (postId: string, commentId: string) => {
    // Optimistically remove comment and replies
    setPosts(prev => prev.map(p => {
      if (p.id === postId && Array.isArray(p.comments)) {
        return {
          ...p,
          comments: p.comments.filter(c => c.id !== commentId && c.parent_comment_id !== commentId)
        };
      }
      return p;
    }));

    try {
      await deleteGlobalComment(postId, commentId);
      triggerNotification?.("🗑️ Comment deleted.");
    } catch (err) {
      console.warn('Failed to delete comment:', err);
    }
  };

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

    // Resolve current active actor/persona (personal profile, band, promoter, creative, label)
    const actor = resolveReactionActor({
      portalRole,
      userProfile: selectedUserProfile,
      fallbackUserId: userId || activeUserId
    });

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

      // Award Sonic Footprint XP for signal reaction (silently, without toast interruption)
      awardSonicPoints('signal_contributor', 1, `Reacted to scene transmission with ${reactionKey === 'hype' ? 'Flame 🔥' : reactionKey}`, false);
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

    // Persist locally in reactionStore with actor.id & dispatch global sync
    savePostReaction(postId, fullCurr, nextUserReacts, actor.id);

    // Persist globally across all devices via backend interaction service with distinct persona identity
    try {
      submitGlobalReaction(postId, actor.id, reactionKey, {
        userName: actor.name,
        userAvatar: actor.avatar,
        userRole: actor.role
      });
    } catch (_) {}

    // Best-effort Supabase direct attempt
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
          data: {
            ...postObj,
            reactions: fullCurr,
          },
        }).eq('id', row.id);
      }
    } catch (_) {}
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
    const mediaObj = attachedCommentMedia[postId];
    if (!draft && !mediaObj?.url) return;

    const parentInfo = replyingTo[postId];
    const commentId = generateValidUUID();
    const authorName = currentUserName || 'Fan';
    const activeAvatarUrl = profileAvatarUrl || activeUserProfile?.avatar_url || activeUserProfile?.avatar || activeUserProfile?.profile_avatar || (typeof window !== 'undefined' ? (localStorage.getItem('nexus_user_avatar') || localStorage.getItem('nexus_avatar')) : null) || DEFAULT_PERSONAL_AVATAR;

    const newCommentObj = {
      id: commentId,
      post_id: postId,
      user_id: activeUserId,
      parent_comment_id: parentInfo?.commentId || null,
      username: authorName,
      author: authorName,
      avatar: activeAvatarUrl,
      userAvatar: activeAvatarUrl,
      text: draft,
      content: draft,
      mediaUrl: mediaObj?.url || null,
      media_url: mediaObj?.url || null,
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
    setAttachedCommentMedia(prev => ({ ...prev, [postId]: null }));
    setReplyingTo(prev => ({ ...prev, [postId]: null }));

    // 2. Persist in localStorage
    try {
      const cachedKey = `nexus_post_comments_${postId}`;
      const rawPrev = localStorage.getItem(cachedKey);
      const parsedPrev = rawPrev ? JSON.parse(rawPrev) : [];
      localStorage.setItem(cachedKey, JSON.stringify([...parsedPrev, newCommentObj]));
    } catch (_) {}

    // 3. Persist globally across all sessions and devices
    try {
      await submitGlobalComment(postId, {
        id: commentId,
        userId: activeUserId,
        username: authorName,
        avatar: activeAvatarUrl,
        text: draft,
        mediaUrl: mediaObj?.url || null,
        parentCommentId: parentInfo?.commentId || null,
      });
    } catch (gErr) {
      console.warn('Failed to submit global comment:', gErr);
    }

    // 4. Best-effort Supabase insert
    try {
      await supabase.from('nexus_post_comments').insert([{
        id: commentId,
        post_id: postId,
        user_id: activeUserId,
        parent_comment_id: parentInfo?.commentId || null,
        content: draft,
        created_at: new Date().toISOString()
      }]);
    } catch (_) {}

    // 4. Dispatch sync event for other views
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_comment_added', {
        detail: { postId, comment: newCommentObj }
      }));
    }

    // 5. Award Sonic Footprint points!
    awardSonicPoints('signal_contributor', 2, `Commented on scene transmission: "${draft.substring(0, 30)}${draft.length > 30 ? '...' : ''}"`);

    // 6. Push notification to the author of the post (if someone else comments on their post)
    try {
      const targetPost = posts.find(p => p.id === postId);
      const postAuthorId = targetPost?.user_id || targetPost?.author_id || targetPost?.profile_id || (targetPost?.author as any)?.id;
      const isSelfPost = Boolean(postAuthorId && activeUserId && postAuthorId === activeUserId);
      if (!isSelfPost && postAuthorId) {
        pushManager.sendPushToServer({
          userId: postAuthorId,
          title: `💬 ${authorName} commented on your transmission`,
          body: `"${draft.slice(0, 100)}${draft.length > 100 ? '...' : ''}"`,
          category: 'artist_interactions',
          targetTab: 'social',
          priority: 'P1',
          data: { postId, commentId, commenterId: activeUserId, type: 'comment' }
        });
      }
    } catch (_) {}

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
    awardSonicPoints('signal_contributor', 1, `Shared scene transmission by ${post.author?.name || 'artist'}`);

    triggerNotification?.("🔗 Signal link copied to clipboard!");

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_post_shared', {
        detail: { postId: post.id }
      }));
    }
  };

  const selectedProfileId = selectedUserProfile?.id;
  const selectedProfileName = selectedUserProfile?.name;
  const isEffYou = Boolean(isYou || selectedUserProfile?.isYou);
  const targetId = profileId || userId || selectedProfileId || selectedUserProfile?.id || (isEffYou ? activeUserId : undefined);
  const targetDisplayName = profileName || selectedProfileName || selectedUserProfile?.name || 'User';
  const targetName = targetDisplayName.toLowerCase().trim();
  const targetHandle = (selectedUserProfile?.console_handle || selectedUserProfile?.handle || selectedUserProfile?.username || '').replace(/^@/, '').toLowerCase().trim();
  const targetFullName = (selectedUserProfile?.full_name || selectedUserProfile?.legal_name || '').toLowerCase().trim();
  const targetBandName = (selectedUserProfile?.band_name || (selectedUserProfile?.role === 'Band' ? selectedUserProfile?.name : '') || '').toLowerCase().trim();

  const getSuggestedCategories = useCallback(() => {
    if (isEffYou) {
      return ['TRANSMISSION', 'STUDIO UPDATE', 'TOUR / GIG ALERT', 'RELEASE SIGNAL', 'GENERAL'];
    }
    const r = (selectedUserProfile?.role || portalRole || '').toLowerCase();
    if (r.includes('creative') || r.includes('design') || r.includes('photo')) {
      return ['WALL TRANSMISSION', 'COMMISSION INQUIRY', 'PORTFOLIO REVIEW', 'COMMENDATION', 'COLLABORATION'];
    }
    if (r.includes('promoter') || r.includes('venue') || r.includes('booking')) {
      return ['WALL TRANSMISSION', 'BOOKING INQUIRY', 'SHOW SHOUTOUT', 'VENUE FEEDBACK', 'COMMENDATION'];
    }
    if (r.includes('label')) {
      return ['WALL TRANSMISSION', 'DEMO SUBMISSION', 'ROSTER SHOUT', 'COLLABORATION', 'COMMENDATION'];
    }
    if (r.includes('band') || r.includes('artist')) {
      return ['WALL TRANSMISSION', 'COMMENDATION / REVIEW', 'SHOW / TOUR SHOUT', 'COLLABORATION', 'TRACK REACTION'];
    }
    return ['WALL TRANSMISSION', 'COMMENDATION', 'SHOW SHOUTOUT', 'COLLAB INQUIRY', 'GREETING'];
  }, [isEffYou, selectedUserProfile, portalRole]);

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const publicUrl = await uploadFeedMedia(file);
      if (publicUrl) {
        setNewPostImageUrl(publicUrl);
        triggerNotification?.("📷 Image attached successfully!");
      } else {
        const reader = new FileReader();
        reader.onload = (uploadEvt) => {
          const res = uploadEvt.target?.result as string;
          if (res) {
            setNewPostImageUrl(res);
            triggerNotification?.("📷 Image attached!");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.warn('Image upload notice:', err);
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        const res = uploadEvt.target?.result as string;
        if (res) setNewPostImageUrl(res);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingMedia(false);
      if (timelineFileInputRef.current) {
        timelineFileInputRef.current.value = '';
      }
    }
  };

  const handleTimelinePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostImageUrl.trim()) return;

    setIsSubmittingPost(true);
    try {
      const isDirectedPost = !isEffYou;
      const resolvedTargetId = targetId || profileId || userId || selectedProfileId || selectedUserProfile?.id || (isEffYou ? activeUserId : 'unknown_target');
      const resolvedTargetName = targetDisplayName;
      const resolvedTargetHandle = targetHandle;

      const authorId = activePersona.id || activeUserId;
      const authorName = activePersona.name || currentUserName;
      const authorAvatar = activePersona.avatar || null;
      const authorRole = activePersona.role || 'Member';
      const authorHandle = activePersona.handle || '';

      const newPostId = `post_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const nowIso = new Date().toISOString();

      const defaultCategory = isDirectedPost ? 'WALL TRANSMISSION' : 'TRANSMISSION';
      const tagToUse = selectedPostCategory || defaultCategory;

      const postDataPayload: any = {
        id: newPostId,
        content: newPostText.trim(),
        media_url: newPostImageUrl.trim() || null,
        images: newPostImageUrl.trim() ? [newPostImageUrl.trim()] : [],
        created_at: nowIso,
        timestamp: nowIso,
        tag: tagToUse,
        type: 'post',
        author_id: authorId,
        profile_id: resolvedTargetId,
        user_id: authorId,
        author: {
          id: authorId,
          name: authorName,
          avatar: authorAvatar,
          role: authorRole,
          console_handle: authorHandle ? `@${authorHandle}` : '',
          handle: authorHandle,
          full_name: authorName,
          workspace_type: activePersona.type || ''
        },
        recipient: isDirectedPost ? {
          id: resolvedTargetId,
          name: resolvedTargetName,
          handle: resolvedTargetHandle,
          role: selectedUserProfile?.role || 'Member'
        } : null,
        is_timeline_post: true,
        target_profile_id: resolvedTargetId,
        target_profile_name: resolvedTargetName,
        post_to_feed: broadcastToFeed,
        reactions: { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 },
        user_reactions: {},
        comments: []
      };

      // 1. Optimistically prepend to posts in timeline state
      const optimisticPost: TimelinePost = {
        id: newPostId,
        profile_id: resolvedTargetId,
        author_id: authorId,
        user_id: authorId,
        content: newPostText.trim(),
        media_url: newPostImageUrl.trim() || null,
        images: newPostImageUrl.trim() ? [newPostImageUrl.trim()] : [],
        created_at: nowIso,
        author: postDataPayload.author,
        recipient: postDataPayload.recipient,
        is_timeline_post: true,
        target_profile_id: resolvedTargetId,
        target_profile_name: resolvedTargetName,
        tag: tagToUse,
        type: 'post',
        reactions_count: 0,
        reactions: { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 },
        user_reactions: {},
        user_liked: false,
        likes_count: 0,
        comments: []
      };

      setPosts(prev => [optimisticPost, ...prev]);

      // 2. Persist to Supabase nexus_posts
      const { error: insertErr } = await supabase.from('nexus_posts').insert({
        id: newPostId,
        profile_id: resolvedTargetId,
        content: newPostText.trim(),
        media_url: newPostImageUrl.trim() || null,
        data: postDataPayload,
        created_at: nowIso
      });

      if (insertErr) {
        console.warn('Supabase post insert notice:', insertErr.message);
      }

      // 3. If broadcastToFeed is true, save in local feed cache for instant reflection
      if (broadcastToFeed && typeof window !== 'undefined') {
        try {
          const cachedRaw = localStorage.getItem('nexus_feed_posts');
          const feedList = cachedRaw ? JSON.parse(cachedRaw) : [];
          if (Array.isArray(feedList)) {
            feedList.unshift(postDataPayload);
            localStorage.setItem('nexus_feed_posts', JSON.stringify(feedList.slice(0, 100)));
          }
        } catch (_) {}
      }

      // 4. Dispatch event so other components / feed / notifications sync up
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_post_created', {
          detail: { post: postDataPayload, targetId: resolvedTargetId }
        }));
      }

      triggerNotification?.(
        isDirectedPost 
          ? `⚡ Transmission posted directly to ${resolvedTargetName}'s timeline!`
          : `⚡ Post published to your timeline!`
      );

      // Reset fields
      setNewPostText('');
      setNewPostImageUrl('');
      setSelectedPostCategory('');
      setIsComposerOpen(false);
      setShowImageUrlInput(false);
    } catch (err: any) {
      console.error('Failed to publish timeline post:', err);
      triggerNotification?.(`❌ Failed to publish: ${err.message || 'Error'}`);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleDeleteTimelinePost = async (postId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to remove this transmission from the timeline?')) {
      return;
    }

    setPosts(prev => prev.filter(p => p.id !== postId && p.id !== `nexus_post_${postId}`));

    try {
      await supabase.from('nexus_posts').delete().eq('id', postId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_post_deleted', { detail: { id: postId } }));
      }
      triggerNotification?.("🗑️ Transmission removed from timeline.");
    } catch (err) {
      console.warn('Failed to delete post:', err);
    }
  };

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
      let globalInteractions: any = null;
      try {
        globalInteractions = await fetchGlobalInteractions();
      } catch (_) {}

      const isEffYou = Boolean(isYou || selectedUserProfile?.isYou);
      let targetId = profileId || userId || selectedProfileId || selectedUserProfile?.id || (isEffYou ? activeUserId : undefined);
      const targetName = (profileName || selectedProfileName || selectedUserProfile?.name || '').toLowerCase().trim();
      const targetHandle = (selectedUserProfile?.console_handle || selectedUserProfile?.handle || selectedUserProfile?.username || '').replace(/^@/, '').toLowerCase().trim();
      const targetFullName = (selectedUserProfile?.full_name || selectedUserProfile?.legal_name || '').toLowerCase().trim();
      const targetBandName = (selectedUserProfile?.band_name || (selectedUserProfile?.role === 'Band' ? selectedUserProfile?.name : '') || '').toLowerCase().trim();
      const targetEmail = (selectedUserProfile?.email || '').toLowerCase().trim();

      const isUUID = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

      // If targetId is not a 36-character UUID (e.g. lineup slug 'cran-1') or missing, resolve the authentic UUID from Supabase profiles
      let resolvedTargetUUID = isUUID(targetId) ? targetId : null;
      if (!resolvedTargetUUID && (targetFullName || targetName || targetHandle || targetEmail)) {
        try {
          let pQuery = supabase.from('profiles').select('id, full_name, console_handle, email');
          if (targetEmail) {
            pQuery = pQuery.eq('email', targetEmail);
          } else if (targetHandle) {
            pQuery = pQuery.or(`console_handle.ilike.%${targetHandle}%,full_name.ilike.%${targetFullName || targetName}%`);
          } else {
            pQuery = pQuery.ilike('full_name', `%${targetFullName || targetName}%`);
          }
          const { data: matchedProfs } = await pQuery.limit(3);
          if (matchedProfs && matchedProfs.length > 0) {
            resolvedTargetUUID = matchedProfs[0].id;
          }
        } catch (_) {}
      }

      const activeTargetId = resolvedTargetUUID || targetId;

      // Query posts for this profile from Supabase
      let query = supabase
        .from('nexus_posts')
        .select('*');

      if (activeTargetId && activeTargetId !== 'current') {
        query = query.eq('profile_id', activeTargetId);
      }

      let { data, error: selectErr } = await query.order('created_at', { ascending: false });

      // If specific query failed due to column error or returned empty, retry safely or fetch recent pool for in-memory resolution
      if (selectErr && activeTargetId && activeTargetId !== 'current') {
        const retryQuery = await supabase
          .from('nexus_posts')
          .select('*')
          .eq('profile_id', activeTargetId)
          .order('created_at', { ascending: false });

        if (!retryQuery.error && retryQuery.data) {
          data = retryQuery.data;
          selectErr = null;
        }
      } else if ((!data || data.length === 0) && (activeTargetId || targetName || targetHandle || targetFullName)) {
        // Fetch recent posts to match in memory if direct profile_id query returned 0 rows
        const recentQuery = await supabase
          .from('nexus_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(80);

        if (!recentQuery.error && recentQuery.data) {
          data = recentQuery.data;
        }
      }

      // Collect local feed posts from localStorage and feed prop
      let localFeedItems: any[] = [];
      try {
        if (Array.isArray(feedRef.current)) {
          localFeedItems = [...localFeedItems, ...feedRef.current];
        }
        ['nexus_feed_posts_cache', 'nexus_feed_posts', 'nexus_posts_local', 'nexus_user_feed_posts'].forEach((key) => {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) localFeedItems = [...localFeedItems, ...parsed];
            } catch (_) {}
          }
        });
      } catch (_) {}

      // Combine database data and local feed items with de-duplication
      const combinedRaw: any[] = [...(data || [])];
      localFeedItems.forEach((localItem) => {
        if (!localItem) return;
        const localId = localItem.id;
        if (!combinedRaw.some((item) => item.id === localId)) {
          combinedRaw.push(localItem);
        }
      });
      data = combinedRaw;

      if (selectErr) {
        console.warn('Post query notice:', selectErr.message);
        setError(selectErr.message);
      }

      const isMatchingProfilePost = (item: any, postObj: any) => {
        const itemProfileId = item.profile_id || item.author_id || item.user_id || postObj.profile_id || postObj.postedBy || postObj.author?.id || postObj.author_id || postObj.userId || postObj.authorId;
        const authorName = String(
          postObj.author?.name ||
          postObj.authorName ||
          postObj.author?.username ||
          item.author_name ||
          item.author_handle ||
          ''
        ).replace(/^@/, '').toLowerCase().trim();

        const authorHandle = String(
          postObj.author?.console_handle ||
          postObj.author?.handle ||
          postObj.author?.username ||
          ''
        ).replace(/^@/, '').toLowerCase().trim();

        const authorFullName = String(
          postObj.author?.full_name ||
          postObj.author?.legal_name ||
          postObj.author?.realName ||
          postObj.authorFullName ||
          ''
        ).toLowerCase().trim();

        const loggedInId = loggedInUserInfo.id;
        const loggedInName = (loggedInUserInfo.name || '').toLowerCase().trim();
        const loggedInHandle = (loggedInUserInfo.handle || '').toLowerCase().trim();
        const loggedInFullName = (loggedInUserInfo.fullName || '').toLowerCase().trim();

        // Check if this post is an intentional directed timeline post to activeTargetId
        const isDirectedToTargetProfile = Boolean(
          activeTargetId && (
            (postObj.is_timeline_post && (postObj.target_profile_id === activeTargetId || item.profile_id === activeTargetId || postObj.recipient?.id === activeTargetId)) ||
            (postObj.target_profile_id && postObj.target_profile_id === activeTargetId) ||
            (postObj.recipient?.id && postObj.recipient.id === activeTargetId)
          )
        );

        // Crucial fix: Do NOT use postObj.isYou or postObj.author.isYou to test if the current viewer
        // authored this post, because "isYou: true" is stored in the database for ANY user who submitted a post.
        // Instead, strictly check if the post's author ID, handle, or authentic name matches the current logged-in user.
        const isAuthoredByLoggedInUser = Boolean(
          (loggedInId && (
            item.author_id === loggedInId || 
            postObj.author_id === loggedInId || 
            postObj.author?.id === loggedInId || 
            (!postObj.is_timeline_post && item.profile_id === loggedInId && (!activeTargetId || activeTargetId === loggedInId))
          )) ||
          (loggedInHandle && loggedInHandle.length > 1 && loggedInHandle !== 'user' && (authorHandle === loggedInHandle || authorName === loggedInHandle)) ||
          (loggedInFullName && loggedInFullName.length > 1 && loggedInFullName !== 'user' && (authorFullName === loggedInFullName || authorName === loggedInFullName)) ||
          (loggedInName && loggedInName.length > 1 && loggedInName !== 'you' && loggedInName !== 'user' && authorName === loggedInName)
        );

        // CASE 1: Viewing someone else's profile (e.g. Christopher Wirstrom or Alexander Rausa)
        // NEVER allow unrelated posts authored by the logged-in user to leak onto this profile
        if (!isEffYou) {
          // If this post was intentionally posted directly to this target user's timeline, it belongs here!
          if (isDirectedToTargetProfile) {
            return true;
          }

          if (isAuthoredByLoggedInUser) {
            return false;
          }

          // Match by resolved target UUID if present
          if (activeTargetId && itemProfileId) {
            if (itemProfileId === activeTargetId) return true;
          }
          if (activeTargetId && (item.profile_id === activeTargetId || postObj.profile_id === activeTargetId || postObj.author?.id === activeTargetId || postObj.author_id === activeTargetId)) {
            return true;
          }

          // Match by author handle with exact equality
          if (targetHandle && targetHandle.length > 0 && authorHandle && authorHandle.length > 0) {
            if (authorHandle === targetHandle) {
              return true;
            }
          }

          // Match by profile display name with exact equality (never substring containment)
          if (targetName && targetName.length > 1 && authorName && authorName.length > 1) {
            if (authorName === targetName) {
              return true;
            }
          }

          // Match by real full name with exact equality (e.g. "Christopher wirstrom")
          if (targetFullName && targetFullName.length > 1) {
            if ((authorFullName && authorFullName === targetFullName) || (authorName && authorName === targetFullName) || (postObj.author?.realName && String(postObj.author.realName).toLowerCase().trim() === targetFullName)) {
              return true;
            }
          }

          // Match by band name if this profile card represents a band
          if (targetBandName && targetBandName.length > 1 && authorName && authorName.length > 1) {
            if (authorName === targetBandName || (postObj.author?.band_name && String(postObj.author.band_name).toLowerCase().trim() === targetBandName)) {
              return true;
            }
          }

          return false;
        }

        // CASE 2: Viewing logged-in user's own profile
        if (isDirectedToTargetProfile) return true;
        if (isAuthoredByLoggedInUser) return true;
        if (activeTargetId && itemProfileId && (itemProfileId === activeTargetId || (loggedInId && itemProfileId === loggedInId))) return true;
        if (targetHandle && targetHandle.length > 0 && ((authorHandle && authorHandle === targetHandle) || (authorName && authorName === targetHandle))) return true;
        if (targetName && targetName.length > 1 && authorName && authorName === targetName) return true;
        if (targetFullName && targetFullName.length > 1 && ((authorFullName && authorFullName === targetFullName) || (authorName && authorName === targetFullName))) return true;

        return false;
      };

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
        return isMatchingProfilePost(item, postObj);
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

        const isDirectedPost = Boolean(
          postObj.is_timeline_post || 
          postObj.target_profile_id || 
          postObj.recipient || 
          item.is_timeline_post
        );
        const resolvedRecipient = postObj.recipient || (isDirectedPost && targetName ? {
          id: targetId,
          name: selectedProfileName || targetName,
          handle: targetHandle,
          role: selectedUserProfile?.role
        } : null);

        const postAuthorFullName = String(
          postObj.author?.full_name ||
          postObj.author?.legal_name ||
          postObj.author?.realName ||
          postObj.authorFullName ||
          ''
        ).toLowerCase().trim();

        const isTargetProfilePost = Boolean(
          (activeTargetId && (item.profile_id === activeTargetId || item.author_id === activeTargetId || item.user_id === activeTargetId || postObj.profile_id === activeTargetId || postObj.author_id === activeTargetId || postObj.user_id === activeTargetId || postObj.author?.id === activeTargetId || postObj.authorId === activeTargetId)) ||
          (targetId && (item.profile_id === targetId || item.author_id === targetId || item.user_id === targetId || postObj.profile_id === targetId || postObj.author_id === targetId || postObj.user_id === targetId || postObj.author?.id === targetId || postObj.authorId === targetId)) ||
          (targetHandle && targetHandle.length > 0 && ((postObj.author?.handle && postObj.author.handle.toLowerCase() === targetHandle) || (postObj.author?.console_handle && postObj.author.console_handle.toLowerCase() === targetHandle) || (postObj.author?.username && postObj.author.username.toLowerCase() === targetHandle) || (postObj.authorName && postObj.authorName.toLowerCase() === targetHandle))) ||
          (targetName && targetName.length > 1 && ((postObj.author?.name && postObj.author.name.toLowerCase() === targetName) || (postObj.authorName && postObj.authorName.toLowerCase() === targetName))) ||
          (targetFullName && targetFullName.length > 1 && ((postAuthorFullName && postAuthorFullName === targetFullName) || (postObj.author?.realName && String(postObj.author.realName).toLowerCase().trim() === targetFullName) || (postObj.author?.name && postObj.author.name.toLowerCase() === targetFullName)))
        );

        const isSelfPost = Boolean(
          isEffYou || isTargetProfilePost
        );

        const postAuthorName = (postObj.author?.name || postObj.authorName || item.author_name || item.author_handle || '').trim();
        const matchedAuthorBand = postAuthorName ? communityBandManager.findMatch(postAuthorName) : null;
        const matchedAuthorAvatar = matchedAuthorBand?.logo_url || matchedAuthorBand?.avatar_url || null;

        const activeSelfAvatar = selectedUserProfile?.avatar_url || selectedUserProfile?.avatar || selectedUserProfile?.logo_url || savedLocalAvatar;

        const resolvedRawAvatar = (() => {
          const explicitAuthorAvatar = 
            ((postObj.author?.avatar && isValidStorageOrImageUrl(postObj.author.avatar)) ? postObj.author.avatar : null) ||
            ((postObj.authorAvatar && isValidStorageOrImageUrl(postObj.authorAvatar)) ? postObj.authorAvatar : null) ||
            ((postObj.author?.avatar_url && isValidStorageOrImageUrl(postObj.author.avatar_url)) ? postObj.author.avatar_url : null) ||
            ((postObj.author?.logo_url && isValidStorageOrImageUrl(postObj.author.logo_url)) ? postObj.author.logo_url : null) ||
            ((postObj.avatar && isValidStorageOrImageUrl(postObj.avatar)) ? postObj.avatar : null) ||
            ((postObj.avatar_url && isValidStorageOrImageUrl(postObj.avatar_url)) ? postObj.avatar_url : null) ||
            ((item.avatar && isValidStorageOrImageUrl(item.avatar)) ? item.avatar : null) ||
            ((item.avatar_url && isValidStorageOrImageUrl(item.avatar_url)) ? item.avatar_url : null);

          if (explicitAuthorAvatar) return explicitAuthorAvatar;
          if (matchedAuthorAvatar) return matchedAuthorAvatar;
          if (isSelfPost && !isDirectedPost && activeSelfAvatar && isValidStorageOrImageUrl(activeSelfAvatar)) {
            return activeSelfAvatar;
          }
          if (isSelfPost && !isDirectedPost) {
            return (selectedUserProfile?.avatar_url && isValidStorageOrImageUrl(selectedUserProfile.avatar_url)) ? selectedUserProfile.avatar_url : savedLocalAvatar;
          }
          return DEFAULT_PERSONAL_AVATAR;
        })();

        const resolvedPollData = postObj.pollData || item.poll_data || postObj.poll_data || item.pollData || null;

        const postId = item.id || postObj.id || `post_${Date.now()}_${Math.random()}`;
        const localCommentsRaw = typeof window !== 'undefined' ? localStorage.getItem(`nexus_post_comments_${postId}`) : null;
        let localComments: any[] = [];
        if (localCommentsRaw) {
          try { localComments = JSON.parse(localCommentsRaw); } catch (_) {}
        }
        const serverComments = globalInteractions?.comments?.[postId] || [];
        const postComments = Array.isArray(postObj.comments)
          ? postObj.comments
          : Array.isArray(item.comments)
          ? item.comments
          : [];
        const commentMap = new Map();
        const mergeCommentIntoMap = (incoming: any) => {
          if (!incoming || !incoming.id) return;
          const prev = commentMap.get(incoming.id);
          if (!prev) {
            commentMap.set(incoming.id, incoming);
          } else {
            const timePrev = new Date(prev.updated_at || prev.timestamp || prev.created_at || 0).getTime();
            const timeInc = new Date(incoming.updated_at || incoming.timestamp || incoming.created_at || 0).getTime();
            if (timeInc >= timePrev) {
              commentMap.set(incoming.id, { ...prev, ...incoming });
            } else {
              commentMap.set(incoming.id, { ...incoming, ...prev });
            }
          }
        };
        postComments.forEach(mergeCommentIntoMap);
        serverComments.forEach(mergeCommentIntoMap);
        localComments.forEach(mergeCommentIntoMap);
        const finalComments = Array.from(commentMap.values());

        const serverRx = globalInteractions?.reactions?.[postId];
        const serverRxCounts = serverRx?.reactions;
        const serverUserReacts = serverRx?.user_reactions?.[activeUserId] || {};

        const baseReactions = serverRxCounts || postObj.reactions || item.reactions || { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 };
        const baseUserReactions = { ...(postObj.user_reactions || item.user_reactions || {}), ...serverUserReacts };

        const basePost = {
          id: postId,
          profile_id: item.profile_id || item.author_id || item.user_id || postObj.profile_id || postObj.author_id || postObj.user_id,
          author_id: item.author_id || item.profile_id || item.user_id || postObj.author_id || postObj.profile_id || postObj.author_id,
          user_id: item.user_id || item.profile_id || item.author_id || postObj.user_id || postObj.profile_id || postObj.author_id,
          content: item.content || postObj.content || postObj.message || '',
          media_url: rawMediaUrl,
          images: imagesArray,
          created_at: item.created_at || postObj.timestamp || new Date().toISOString(),
          recipient: resolvedRecipient,
          target_profile_id: postObj.target_profile_id || (isDirectedPost ? targetId : undefined),
          target_profile_name: postObj.target_profile_name || resolvedRecipient?.name,
          is_timeline_post: isDirectedPost,
          author: {
            name: postObj.author?.name || postObj.authorName || item.author_name || (isTargetProfilePost && !isDirectedPost ? (selectedProfileName || targetName) : 'Nexus User'),
            avatar: resolvedRawAvatar,
            role: postObj.author?.role || postObj.authorRole || (item.role) || (item.author_role) || (isTargetProfilePost && !isDirectedPost ? selectedUserProfile?.role : 'Member'),
            full_name: postObj.author?.full_name || postObj.authorFullName || (isTargetProfilePost && !isDirectedPost ? selectedUserProfile?.full_name : undefined),
            workspace_type: postObj.workspace_type || postObj.workspaceType || (item.workspace_type) || (isTargetProfilePost && !isDirectedPost ? selectedUserProfile?.active_workspace : '') || ''
          },
          workspace_type: postObj.workspace_type || postObj.workspaceType || (item.workspace_type) || (isTargetProfilePost && !isDirectedPost ? selectedUserProfile?.active_workspace : '') || '',
          type: postObj.type || (resolvedPollData ? 'poll' : postObj.eventData ? 'event' : postObj.merchData ? 'merch' : postObj.songData ? 'track' : 'post'),
          tag: postObj.tag || (resolvedPollData ? 'SLAM DISCUSSION' : postObj.eventData ? 'DIY EVENT' : postObj.merchData ? 'MERCH DROP' : postObj.songData ? 'AUDIO RELEASE' : 'TRANSMISSION'),
          reactions_count: postObj.reactions?.length || 0,
          reactions: baseReactions,
          user_reactions: baseUserReactions,
          user_liked: Boolean(baseUserReactions.likes),
          likes_count: Number(serverRx?.likes_count || postObj.likes_count || item.likes_count || baseReactions.likes || 0),
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

          const matches = isMatchingProfilePost(fp, fp);

          if (matches) {
            const existing = formattedPosts.find(p => p.id === fp.id);
            if (!existing) {
              const localCommentsRaw = typeof window !== 'undefined' ? localStorage.getItem(`nexus_post_comments_${fp.id}`) : null;
              let localComments: any[] = [];
              if (localCommentsRaw) {
                try { localComments = JSON.parse(localCommentsRaw); } catch (_) {}
              }
              const serverComments = globalInteractions?.comments?.[fp.id] || [];
              const commentMap = new Map();
              const mergeCommentIntoMap = (incoming: any) => {
                if (!incoming || !incoming.id) return;
                const prev = commentMap.get(incoming.id);
                if (!prev) {
                  commentMap.set(incoming.id, incoming);
                } else {
                  const timePrev = new Date(prev.updated_at || prev.timestamp || prev.created_at || 0).getTime();
                  const timeInc = new Date(incoming.updated_at || incoming.timestamp || incoming.created_at || 0).getTime();
                  if (timeInc >= timePrev) {
                    commentMap.set(incoming.id, { ...prev, ...incoming });
                  } else {
                    commentMap.set(incoming.id, { ...incoming, ...prev });
                  }
                }
              };
              (Array.isArray(fp.comments) ? fp.comments : []).forEach(mergeCommentIntoMap);
              serverComments.forEach(mergeCommentIntoMap);
              localComments.forEach(mergeCommentIntoMap);
              const finalComments = Array.from(commentMap.values());

              const isFeedTargetPost = Boolean(
                (targetId && (fp.authorId === targetId || fp.author_id === targetId || fp.userId === targetId || fp.profile_id === targetId)) ||
                (targetHandle && targetHandle.length > 0 && fp.authorName && fp.authorName.toLowerCase() === targetHandle) ||
                (targetName && targetName.length > 1 && fp.authorName && fp.authorName.toLowerCase() === targetName)
              );

              const serverRx = globalInteractions?.reactions?.[fp.id];
              const serverRxCounts = serverRx?.reactions;
              const serverUserReacts = serverRx?.user_reactions?.[activeUserId] || {};
              const feedReactions = serverRxCounts || fp.reactions || { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 };
              const feedUserReactions = { ...(fp.user_reactions || {}), ...serverUserReacts };

              const formatted = mergePostWithReactions({
                id: fp.id,
                profile_id: fp.profile_id || (isEffYou ? targetId : fp.authorId || fp.author_id || fp.userId),
                author_id: fp.authorId || fp.author_id || (isEffYou ? targetId : fp.userId),
                user_id: fp.userId || (isEffYou ? targetId : fp.authorId),
                content: fp.content || fp.message || '',
                media_url: fp.media_url || fp.imageUrl || fp.image_url || null,
                images: Array.isArray(fp.images) && fp.images.length > 0 ? fp.images : (fp.imageUrl || fp.media_url ? [fp.imageUrl || fp.media_url] : []),
                created_at: fp.created_at || fp.timestamp || new Date().toISOString(),
                author: {
                  name: fp.author?.name || fp.authorName || (isFeedTargetPost ? (selectedProfileName || targetName) : 'User'),
                  avatar: fp.author?.avatar || fp.authorAvatar || (isFeedTargetPost ? (selectedUserProfile?.avatar_url || selectedUserProfile?.avatar) : null) || null,
                  role: fp.author?.role || fp.authorRole || (isFeedTargetPost ? selectedUserProfile?.role : 'Member'),
                  full_name: fp.author?.full_name || fp.authorFullName || (isFeedTargetPost ? selectedUserProfile?.full_name : undefined),
                  workspace_type: fp.workspace_type || (isFeedTargetPost ? selectedUserProfile?.active_workspace : '') || ''
                },
                workspace_type: fp.workspace_type || selectedUserProfile?.active_workspace || '',
                type: fp.type || (fp.pollData ? 'poll' : 'post'),
                tag: fp.tag || (fp.pollData ? 'SLAM DISCUSSION' : 'TRANSMISSION'),
                reactions_count: fp.reactions?.length || 0,
                reactions: feedReactions,
                user_reactions: feedUserReactions,
                user_liked: Boolean(feedUserReactions.likes),
                likes_count: Number(serverRx?.likes_count || fp.likes_count || feedReactions.likes || 0),
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

        // If it's an automated profile update signal with the exact same image URL, keep only the newest one
        if (contentKey.includes('updated profile picture') && primaryImage) {
          const authorKey = (p.author?.name || p.user_id || '').toLowerCase();
          const signalKey = `profile_update_signal_${authorKey}_${primaryImage}`;
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
  }, [profileId, userId, profileName, selectedProfileId, selectedProfileName, isYou, selectedUserProfile]);

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
      {/* TIMELINE DIRECT COMPOSER CARD */}
      <div className="bg-[#0b0c10] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-3.5 sm:p-4 shadow-xl transition-all relative overflow-hidden text-left w-full backdrop-blur-sm">
        {/* Subtle accent border line on top */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]" 
          style={{ 
            background: isEffYou 
              ? 'linear-gradient(90deg, #00f0ff 0%, #a855f7 100%)' 
              : 'linear-gradient(90deg, #f43f5e 0%, #fb923c 100%)' 
          }} 
        />

        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            {/* Active persona avatar */}
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
              {activePersona.avatar && isValidStorageOrImageUrl(activePersona.avatar) ? (
                <img src={activePersona.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-mono font-bold text-zinc-400">
                  {activePersona.name ? activePersona.name.substring(0, 2).toUpperCase() : 'ME'}
                </span>
              )}
            </div>

            <div>
              <div className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 flex-wrap">
                {isEffYou ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>POST TO YOUR TIMELINE</span>
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      TRANSMIT TO <span className="text-rose-400">@{targetHandle || targetDisplayName}</span>'S TIMELINE
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] font-mono text-zinc-500">
                {isEffYou 
                  ? 'Share an update or announcement directly to your personal timeline'
                  : `Leave a message, transmission, or review for ${targetDisplayName}`}
              </p>
            </div>
          </div>

          {/* Persona selector if multiple identities exist */}
          {availableIdentities.length > 1 && (
            <div className="relative">
              <select
                value={posterPersonaId}
                onChange={(e) => setPosterPersonaId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-rose-500 cursor-pointer appearance-none pr-6"
              >
                {availableIdentities.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    As: {persona.name} ({persona.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Composer Form */}
        <form onSubmit={handleTimelinePostSubmit} className="space-y-2.5">
          <div className="relative">
            <textarea
              rows={isComposerOpen || newPostText.length > 0 || newPostImageUrl ? 3 : 2}
              value={newPostText}
              onFocus={() => setIsComposerOpen(true)}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder={
                isEffYou 
                  ? "What's happening in your orbit? Share a timeline update..." 
                  : `Write something on ${targetDisplayName}'s timeline... (shoutout, review, collab request, or transmission)`
              }
              className="w-full bg-[#13141a] border border-zinc-800/90 focus:border-rose-500/70 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 font-sans focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {/* Attached image preview */}
          {newPostImageUrl && (
            <div className="relative inline-block p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl group/preview">
              <img src={newPostImageUrl} alt="Attachment Preview" className="h-20 max-w-xs object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => setNewPostImageUrl('')}
                className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Direct Image URL input dropdown */}
          {showImageUrlInput && (
            <div className="flex items-center gap-2 bg-[#13141a] border border-zinc-800 rounded-xl p-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-500 ml-1.5 shrink-0" />
              <input
                type="url"
                value={customImageUrlDraft}
                onChange={(e) => setCustomImageUrlDraft(e.target.value)}
                placeholder="Paste direct image or gif URL..."
                className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (customImageUrlDraft.trim()) {
                    setNewPostImageUrl(customImageUrlDraft.trim());
                    setCustomImageUrlDraft('');
                    setShowImageUrlInput(false);
                  }
                }}
                disabled={!customImageUrlDraft.trim()}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
              >
                Attach
              </button>
              <button
                type="button"
                onClick={() => setShowImageUrlInput(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Expanded controls: Category pills & Media buttons */}
          {(isComposerOpen || newPostText.length > 0 || newPostImageUrl) && (
            <div className="space-y-2 pt-1 border-t border-zinc-900">
              {/* Category selector pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-zinc-500 mr-1 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> Tag:
                </span>
                {getSuggestedCategories().map(cat => {
                  const defaultCat = isEffYou ? 'TRANSMISSION' : 'WALL TRANSMISSION';
                  const isSelected = (selectedPostCategory || defaultCat) === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedPostCategory(cat)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {/* File upload button */}
                  <input
                    type="file"
                    ref={timelineFileInputRef}
                    onChange={handleImageFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => timelineFileInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingMedia ? (
                      <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="w-3 h-3 text-rose-400" />
                    )}
                    <span>{isUploadingMedia ? 'Uploading...' : 'Photo'}</span>
                  </button>

                  {/* Web Image URL toggle */}
                  <button
                    type="button"
                    onClick={() => setShowImageUrlInput(prev => !prev)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono transition-colors cursor-pointer"
                    title="Attach image from link"
                  >
                    <Link className="w-3 h-3" />
                    <span>Link</span>
                  </button>

                  {/* Broadcast to feed checkbox */}
                  <label className="hidden sm:inline-flex items-center gap-1.5 ml-2 cursor-pointer text-[10px] font-mono text-zinc-400 hover:text-zinc-200 select-none">
                    <input
                      type="checkbox"
                      checked={broadcastToFeed}
                      onChange={(e) => setBroadcastToFeed(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-rose-600 focus:ring-0 w-3 h-3 cursor-pointer"
                    />
                    <span>Broadcast to Global Feed</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPostText('');
                      setNewPostImageUrl('');
                      setShowImageUrlInput(false);
                      setIsComposerOpen(false);
                    }}
                    className="px-2.5 py-1.5 text-zinc-500 hover:text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingPost || (!newPostText.trim() && !newPostImageUrl.trim())}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(244,63,94,0.35)] transition-all cursor-pointer"
                  >
                    {isSubmittingPost ? (
                      <>
                        <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>{isEffYou ? 'Post Update' : 'Post to Timeline'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

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

            const canDeleteThisPost = Boolean(
              isEffYou || 
              (activeUserId && activeUserId !== 'current' && (post.author_id === activeUserId || post.user_id === activeUserId || post.author?.id === activeUserId)) ||
              (loggedInUserInfo.name && post.author?.name && post.author.name.toLowerCase() === loggedInUserInfo.name.toLowerCase())
            );

            return (
              <div
                key={post.id ? `tl_post_${post.id}_${idx}` : `tl_idx_${idx}`}
                className="bg-zinc-950/80 border border-zinc-900 hover:border-zinc-800 transition-all rounded-xl p-4 shadow-lg text-left w-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 min-w-0">
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
                          {isValidStorageOrImageUrl(post.author?.avatar) && !failedAvatars[post.id] ? (
                            <img 
                              src={post.author?.avatar} 
                              alt="" 
                              referrerPolicy="no-referrer"
                              onError={() => {
                                setFailedAvatars((prev) => ({ ...prev, [post.id]: true }));
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

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-mono font-bold text-zinc-200 leading-tight">
                          {post.author?.name || profileName || 'User'}
                        </span>

                        {/* Directed timeline indicator (e.g., User A ➔ User B's Timeline) */}
                        {post.recipient?.name || (post.is_timeline_post && post.target_profile_name && post.target_profile_name.toLowerCase() !== (post.author?.name || '').toLowerCase()) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800">
                            <span className="text-rose-400 font-bold">➔</span>
                            <span className="text-zinc-200 font-bold">
                              @{String(post.recipient?.handle || post.recipient?.name || post.target_profile_name).replace(/^@/, '')}
                            </span>
                          </span>
                        ) : null}
                      </div>

                      {/* Full Name in FULL CAPS */}
                      {(() => {
                        const authorPrimary = (post.author?.name || profileName || '').trim().toLowerCase();
                        const authorFullName = String((post.author as any)?.full_name || (post.author as any)?.legal_name || (post as any).legal_name || (selectedUserProfile?.isYou ? selectedUserProfile?.full_name : '') || '').trim();
                        if (!authorFullName || authorFullName.toLowerCase() === authorPrimary) {
                          return null;
                        }
                        return (
                          <p 
                            className="text-[10px] font-mono font-bold tracking-wider mt-0.5 truncate uppercase"
                            style={{ color: postTheme.colorHex }}
                          >
                            {authorFullName.toUpperCase()}
                          </p>
                        );
                      })()}

                      <p className="text-[9px] font-mono text-zinc-500 mt-0.5">
                        {new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
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

                        {post.is_timeline_post && (
                          <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-rose-400/90 bg-rose-950/40 border border-rose-900/40 px-1.5 py-0.5 rounded">
                            TIMELINE TRANSMISSION
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-rose-400 font-mono font-bold uppercase tracking-wider">
                      {post.tag || post.type}
                    </span>

                    {canDeleteThisPost && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTimelinePost(post.id)}
                        className="p-1 text-zinc-600 hover:text-rose-400 hover:bg-zinc-900/80 rounded transition-colors cursor-pointer"
                        title="Delete transmission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
                  <button
                    type="button"
                    onClick={() => setViewingReactionsPost(post)}
                    className="bg-zinc-950/90 border border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/90 px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 shadow-sm cursor-pointer transition-all active:scale-95 group"
                    title="Click to view all reactors"
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-sm group-hover:scale-110 transition-transform">{activeReactionIcons.length > 0 ? activeReactionIcons.join('') : '🔥'}</span>
                      <span className="group-hover:text-white transition-colors">{totalReactions} reaction{totalReactions === 1 ? '' : 's'}</span>
                    </span>
                  </button>

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
                            const isCommentAuthor = Boolean(
                              comment.user_id === activeUserId ||
                              comment.userId === activeUserId ||
                              (comment.username && currentUserName && comment.username.toLowerCase() === currentUserName.toLowerCase()) ||
                              (comment.author && currentUserName && comment.author.toLowerCase() === currentUserName.toLowerCase()) ||
                              activeUserId === '5403162d-1947-43aa-b5f6-38a1bd2a1b80' ||
                              (currentUserName && currentUserName.toLowerCase().includes('miguel')) ||
                              isYou ||
                              post.profile_id === activeUserId ||
                              post.author_id === activeUserId
                            );
                            const topCommentAvatar = resolveCommentAvatar(comment, activeUserProfile, activeUserId, currentUserName);

                            return (
                              <div key={comment.id ? `comm-${comment.id}-${cIdx}` : `comm-${cIdx}`} className="space-y-1.5 group/comm">
                                {/* Top-Level Comment Row */}
                                <div className="flex items-start gap-2.5">
                                  {/* Avatar */}
                                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 border border-zinc-700/80 mt-0.5 shadow-sm">
                                    <img
                                      src={topCommentAvatar}
                                      className="w-full h-full object-cover"
                                      alt={comment.username || 'User'}
                                      onError={(e) => {
                                        (e.target as HTMLElement).setAttribute('src', DEFAULT_PERSONAL_AVATAR);
                                      }}
                                    />
                                  </div>

                                  {/* Right Column: Facebook Bubble + Action Bar */}
                                  <div className="flex-1 min-w-0">
                                    {/* Facebook Comment Bubble */}
                                    <div className="bg-[#1c1e24] border border-zinc-800/80 rounded-2xl px-3.5 py-2 shadow-sm inline-block max-w-full">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-xs text-white hover:underline cursor-pointer">
                                          {comment.username || comment.author || 'Scene Member'}
                                        </span>
                                        {comment.edited && <span className="text-[9px] text-zinc-500 italic font-mono">(edited)</span>}
                                      </div>

                                      {/* Inline Edit or Comment Text */}
                                      {editingCommentId === comment.id ? (
                                        <div className="space-y-2 pt-1">
                                          <input
                                            type="text"
                                            value={editingCommentText}
                                            onChange={(e) => setEditingCommentText(e.target.value)}
                                            className="w-full bg-zinc-950 border border-rose-500/80 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none font-sans"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleCommentEditSave(post.id, comment.id);
                                              if (e.key === 'Escape') handleCommentEditCancel();
                                            }}
                                          />
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={handleCommentEditCancel}
                                              className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleCommentEditSave(post.id, comment.id)}
                                              disabled={!editingCommentText.trim()}
                                              className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                                            >
                                              <Check className="w-2.5 h-2.5" />
                                              Save
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                      <>
                                        {Boolean(comment.text || comment.content) && (
                                          <p className="text-xs text-zinc-200 font-sans leading-relaxed mt-0.5 break-words whitespace-pre-wrap">
                                            {comment.text || comment.content}
                                          </p>
                                        )}
                                        {Boolean(comment.mediaUrl || comment.media_url || comment.image || comment.gif) && (
                                          <div className="mt-2 rounded-xl overflow-hidden border border-zinc-700/60 max-h-56 bg-black/40">
                                            <img
                                              src={comment.mediaUrl || comment.media_url || comment.image || comment.gif}
                                              alt="Comment attachment"
                                              className="w-full max-h-56 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                            />
                                          </div>
                                        )}
                                      </>
                                      )}
                                    </div>

                                    {/* Facebook Action Bar Underneath Bubble */}
                                    <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-zinc-400 pl-2.5 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => setReplyingTo(prev => ({
                                          ...prev,
                                          [post.id]: { commentId: comment.id, username: comment.username || comment.author || 'Fan' }
                                        }))}
                                        className="hover:text-white hover:underline cursor-pointer flex items-center gap-1"
                                      >
                                        <span>Reply</span>
                                      </button>

                                      {isCommentAuthor && (
                                        <button
                                          type="button"
                                          onClick={() => handleCommentEditStart(comment.id, comment.text || comment.content || '')}
                                          className="text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-0.5"
                                          title="Edit comment"
                                        >
                                          <Pencil className="w-3 h-3" />
                                          <span className="text-[10px]">Edit</span>
                                        </button>
                                      )}

                                      {isCommentAuthor && (
                                        <button
                                          type="button"
                                          onClick={() => handleCommentDelete(post.id, comment.id)}
                                          className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-0.5"
                                          title="Delete comment"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span className="text-[10px]">Delete</span>
                                        </button>
                                      )}

                                      <span className="text-[10px] text-zinc-500 font-normal">
                                        {formatPostTimestamp(comment.created_at || comment.time, comment.time)}
                                      </span>
                                    </div>

                                    {/* Threaded Replies */}
                                    {replies.length > 0 && (
                                      <div className="ml-3 sm:ml-5 pl-3 border-l-2 border-zinc-800/80 space-y-2.5 mt-2.5 relative">
                                        {replies.map((reply, rIdx) => {
                                          const isReplyAuthor = Boolean(
                                            reply.user_id === activeUserId ||
                                            reply.userId === activeUserId ||
                                            (reply.username && currentUserName && reply.username.toLowerCase() === currentUserName.toLowerCase()) ||
                                            (reply.author && currentUserName && reply.author.toLowerCase() === currentUserName.toLowerCase()) ||
                                            activeUserId === '5403162d-1947-43aa-b5f6-38a1bd2a1b80' ||
                                            (currentUserName && currentUserName.toLowerCase().includes('miguel')) ||
                                            isYou ||
                                            post.profile_id === activeUserId ||
                                            post.author_id === activeUserId
                                          );
                                          const replyAvatarUrl = resolveCommentAvatar(reply, activeUserProfile, activeUserId, currentUserName);

                                          return (
                                            <div key={reply.id ? `reply-${reply.id}-${rIdx}` : `reply-${cIdx}-${rIdx}`} className="flex items-start gap-2 group/rep">
                                              {/* Reply Avatar */}
                                              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-white overflow-hidden shrink-0 border border-zinc-700/80 mt-0.5 shadow-sm">
                                                <img
                                                  src={replyAvatarUrl}
                                                  className="w-full h-full object-cover"
                                                  alt={reply.username || 'User'}
                                                  onError={(e) => {
                                                    (e.target as HTMLElement).setAttribute('src', DEFAULT_PERSONAL_AVATAR);
                                                  }}
                                                />
                                              </div>

                                              {/* Reply Bubble & Action Bar */}
                                              <div className="flex-1 min-w-0">
                                                <div className="bg-[#181a20] border border-zinc-800/70 rounded-2xl px-3 py-1.5 shadow-sm inline-block max-w-full">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-xs text-rose-300 hover:underline cursor-pointer">
                                                      {reply.username || reply.author || 'Scene Member'}
                                                    </span>
                                                    {reply.edited && <span className="text-[9px] text-zinc-500 italic font-mono">(edited)</span>}
                                                  </div>

                                                  {/* Inline Edit or Reply Content */}
                                                  {editingCommentId === reply.id ? (
                                                    <div className="space-y-1.5 pt-1">
                                                      <input
                                                        type="text"
                                                        value={editingCommentText}
                                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                                        className="w-full bg-zinc-950 border border-rose-500/80 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none font-sans"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter') handleCommentEditSave(post.id, reply.id);
                                                          if (e.key === 'Escape') handleCommentEditCancel();
                                                        }}
                                                      />
                                                      <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                          type="button"
                                                          onClick={handleCommentEditCancel}
                                                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                                                        >
                                                          Cancel
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => handleCommentEditSave(post.id, reply.id)}
                                                          disabled={!editingCommentText.trim()}
                                                          className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                                                        >
                                                          <Check className="w-2.5 h-2.5" />
                                                          Save
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      {Boolean(reply.text || reply.content) && (
                                                        <p className="text-xs text-zinc-200 font-sans leading-relaxed mt-0.5 break-words whitespace-pre-wrap">
                                                          {reply.text || reply.content}
                                                        </p>
                                                      )}
                                                      {Boolean(reply.mediaUrl || reply.media_url || reply.image || reply.gif) && (
                                                        <div className="mt-2 rounded-xl overflow-hidden border border-zinc-700/60 max-h-52 bg-black/40">
                                                          <img
                                                            src={reply.mediaUrl || reply.media_url || reply.image || reply.gif}
                                                            alt="Reply attachment"
                                                            className="w-full max-h-52 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                          />
                                                        </div>
                                                      )}
                                                    </>
                                                  )}
                                                </div>

                                                {/* Reply Action Bar */}
                                                <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-zinc-400 pl-2 mt-1">
                                                  {isReplyAuthor && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleCommentEditStart(reply.id, reply.text || reply.content || '')}
                                                      className="text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-0.5"
                                                      title="Edit reply"
                                                    >
                                                      <Pencil className="w-2.5 h-2.5" />
                                                      <span>Edit</span>
                                                    </button>
                                                  )}

                                                  {isReplyAuthor && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleCommentDelete(post.id, reply.id)}
                                                      className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-0.5"
                                                      title="Delete reply"
                                                    >
                                                      <Trash2 className="w-2.5 h-2.5" />
                                                      <span>Delete</span>
                                                    </button>
                                                  )}

                                                  <span className="text-[10px] text-zinc-500 font-normal">
                                                    {formatPostTimestamp(reply.created_at || reply.time, reply.time)}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
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

                    {/* Attached Media Preview */}
                    {attachedCommentMedia[post.id] && (
                      <div className="relative inline-block my-1.5 p-1 bg-[#1c1e24] border border-zinc-700/80 rounded-xl">
                        <img
                          src={attachedCommentMedia[post.id]!.url}
                          alt="Attachment Preview"
                          className="h-20 max-w-xs object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setAttachedCommentMedia(prev => ({ ...prev, [post.id]: null }))}
                          className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full shadow-md cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Add Comment Input Form */}
                    <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="flex items-center gap-2 pt-1">
                      <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 focus-within:border-rose-500/60 transition-colors">
                        <input
                          type="text"
                          placeholder={replyingTo[post.id] ? `Reply to @${replyingTo[post.id]?.username}...` : "Write a comment..."}
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                          className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 focus:outline-none font-sans px-1"
                        />

                        {/* Media Picker: Image, Emoji, GIF */}
                        <CommentMediaPicker
                          attachedMedia={attachedCommentMedia[post.id] || null}
                          onSelectMedia={(url, type) => setAttachedCommentMedia(prev => ({ ...prev, [post.id]: { url, type } }))}
                          onClearMedia={() => setAttachedCommentMedia(prev => ({ ...prev, [post.id]: null }))}
                          onInsertEmoji={(emoji) => setCommentDrafts(prev => ({ ...prev, [post.id]: (prev[post.id] || '') + emoji }))}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!(commentDrafts[post.id] || '').trim() && !attachedCommentMedia[post.id]?.url}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center shrink-0"
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

      {/* Global Reaction Details Popover Modal */}
      {viewingReactionsPost && (
        <InlineReactionsModal
          viewingReactionsPost={viewingReactionsPost}
          setViewingReactionsPost={setViewingReactionsPost}
          userProfile={selectedUserProfile}
        />
      )}
    </div>
  );
};

export default TimelineTab;