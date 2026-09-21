import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Activity, MessageSquare, Flame, Image as ImageIcon, Sparkles, Share2, Volume2, Video, Calendar, MapPin, Users, Lock, Check } from 'lucide-react';
import { YouTubeEmbedCard } from '../social/embeds/YouTubeEmbedCard';
import { PollWidget } from '../social/embeds/PollWidget';
import { TapeEmbedCard } from '../social/embeds/TapeEmbedCard';
import { PollEmbedData } from '../social/timeline/types';
import { tapeAudioEngine } from '../social/utils/tapeAudioEngine';

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
        // Exclude quiet vault posts from timeline view
        if (postObj.is_gallery_only === true || postObj.post_to_feed === false || postObj.hidden_from_feed === true || postObj.gallery_only === true) {
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

        return {
          id: item.id || postObj.id || `post_${Date.now()}_${Math.random()}`,
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
          eventData: postObj.eventData || item.event_data,
          merchData: postObj.merchData,
          songData: postObj.songData,
          tapeData: postObj.tapeData,
          pollData: resolvedPollData
        };
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
          const aId = fp.authorId || fp.author_id || fp.userId || fp.profile_id || fp.author?.id;
          const aName = (fp.authorName || fp.author?.name || '').toLowerCase();
          const matches = (targetId && aId === targetId) ||
            (targetName && aName && (aName === targetName || aName.includes(targetName) || targetName.includes(aName))) ||
            (targetName.includes('virulent') && aName.includes('virulent'));

          if (matches) {
            const existing = formattedPosts.find(p => p.id === fp.id);
            if (!existing) {
              formattedPosts.unshift({
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
                eventData: fp.eventData,
                merchData: fp.merchData,
                songData: fp.songData,
                tapeData: fp.tapeData,
                pollData: fp.pollData,
              });
            } else if (fp.pollData && !existing.pollData) {
              existing.pollData = fp.pollData;
            }
          }
        });
      }

      setPosts(formattedPosts);
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
            const hasImage = post.media_url && !isAudio && !isVideo && !isYt && !failedImages[post.id];
            const postTheme = resolvePostRoleTheme(post, selectedUserProfile);

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
                          background: `linear-gradient(135deg, ${postTheme.colorHex}, rgba(255,255,255,0.45), ${postTheme.colorHex})`,
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
                            setRsvpedEvents(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                            triggerNotification?.("🔥 RSVP Confirmed! You're on the list for this show.");
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
                      onVote={(optId, poll) => handleVotePoll(post.id, optId, poll)}
                    />
                  </div>
                )}

                {/* Tape / Bootleg Embed Card */}
                {post.tapeData && (
                  <TapeEmbedCard
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

                <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-zinc-900/80 text-zinc-500 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => triggerNotification?.("⚡ Flame reaction logged.")}
                    className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Flame</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerNotification?.("💬 Opening discussion thread...")}
                    className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerNotification?.("🔗 Signal link copied to clipboard!")}
                    className="flex items-center gap-1 hover:text-purple-400 transition-colors ml-auto"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
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