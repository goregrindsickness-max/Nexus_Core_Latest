import React, { useRef, useState } from 'react';
import {
  Pin,
  Rocket,
  Shield,
  Sparkles,
  MapPin,
  MoreVertical,
  Edit2,
  Trash2,
  Share2,
  Check,
  Tag,
  MessageSquare,
  X,
  Send,
} from 'lucide-react';
import {
  FeedPost,
  SongEmbedData,
  AlbumEmbedData,
  PollEmbedData,
  REACTION_PALETTE,
} from './types';
import { renderPostMessage } from './utils';
import { formatPostTimestamp } from '../../../utils/socialFeedUtils';
import {
  LinkPreviewCard,
  SongEmbedCard,
  AlbumEmbedCard,
  PollWidget,
  TapeEmbedCard,
  YouTubeEmbedCard,
  MediaGalleryGrid,
  TourEmbedCard,
  EventEmbedCard,
  MerchEmbedCard,
  BandcampEmbedCard,
} from '../embeds';
import { GigProximityPill } from './GigProximityPill';

interface PostCardProps {
  post: FeedPost;
  currentUserId?: string;
  currentUserName?: string;
  userProfile?: any;
  portalRole?: string;
  boostData?: { isBoosted: boolean; boostGlowColor: 'blue' | 'purple'; boostType: string; boostedAt: string };
  isCommentsOpen: boolean;
  commentDraft: string;
  replyingTo: { commentId: string; username: string } | null;
  isEditing: boolean;
  editingText: string;
  isPostMenuOpen: boolean;
  isReactionMenuOpen: boolean;
  isHypeAnimated: boolean;
  playingSongId: string | null;
  songProgress: number;
  songVolumeMuted: boolean;
  pollVote?: { optionId: string; totalVotes: number; options: any[] };
  playingTapeId: string | null;
  tapeProgress: number;
  isTourExpanded: boolean;
  isRsvped: boolean;
  rsvpCount: number;
  unlockedVipPosts: Record<string, boolean>;
  selectedSizesMap: Record<string, string>;
  offerStatusMap: Record<string, any>;
  activeNegotiationPostId: string | null;
  offerValues: Record<string, string>;
  shareToastActive: boolean;

  onOpenProfile?: (authorId: string, authorName: string) => void;
  onTogglePostMenu: () => void;
  onClosePostMenu: () => void;
  onTogglePin?: (postId: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: (text: string) => void;
  onSetEditingText: (text: string) => void;
  onDeletePost?: (postId: string) => void;
  onShareClick: () => void;
  onOpenBoostModal: () => void;
  onPlaySong?: (song: SongEmbedData) => void;
  onTogglePlaySong: (song?: SongEmbedData) => void;
  onSeekSong: (pct: number) => void;
  onToggleMuteSong: () => void;
  onOpenAlbumModalForSong: (song: SongEmbedData) => void;
  onOpenAlbumModalForAlbum: (album: AlbumEmbedData) => void;
  onBuyFormat: (format: string, priceStr: string, bandName: string, albumName: string) => void;
  onVotePoll: (optionId: string, currentPoll: PollEmbedData) => void;
  onTogglePlayTape: () => void;
  onSeekTape: (progress: number) => void;
  onStopTape: () => void;
  onOpenLightbox: (images: string[], index: number) => void;
  onToggleTourExpand: () => void;
  onSelectTicketShow: (date: any) => void;
  onOpenTicketModal?: (ticketData: any) => void;
  onToggleRsvp: (postId: string) => void;
  setSelectedSizesMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setOfferStatusMap: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setActiveNegotiationPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setOfferValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  openMerchLightbox: (post: FeedPost, initialIndex?: number) => void;
  onCheckoutMerch: (post: FeedPost, size: string, price: number, isNegotiated?: boolean) => void;
  onAddToCart?: (item: { title: string; bandName: string; price: number; format: string }) => void;
  setCartNotice: (notice: string | null) => void;
  onToggleComments: () => void;
  onCommentDraftChange: (text: string) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  onSetReplyingTo: (info: { commentId: string; username: string } | null) => void;
  onTriggerEmojiReact: (type: string) => void;
  onOpenReactionMenu: () => void;
  onCloseReactionMenu: () => void;
  onOpenShareModal: () => void;
}

const KNOWN_USER_FULL_NAMES: Record<string, string> = {
  'goregrindslayer': 'Tyler Slamson',
  'blastfiend999': 'Zachary Blaster',
  'tapetrader99': 'Marcus Cassette',
  'slamnation': 'Derek Riff',
  'scene photographer': 'Dustin Shutter',
  'deathmetalfan99': 'Alex Mercer',
  'shutterbug_live': 'Leo Lens',
  'stagediver_99': 'Chris Diver',
  'circlepitking': 'Eric Circle',
  'slamgod': 'Kevin Hammer',
  'texasgore': 'Travis Gore',
  'riffmaster': 'Dave Shredder',
  'doomguy': 'Doom Guy',
  'blastspeed': 'Brian Blast',
  'nexus promoters': 'Marcus Vance',
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  currentUserName,
  userProfile,
  portalRole,
  boostData,
  isCommentsOpen,
  commentDraft,
  replyingTo,
  isEditing,
  editingText,
  isPostMenuOpen,
  isReactionMenuOpen,
  isHypeAnimated,
  playingSongId,
  songProgress,
  songVolumeMuted,
  pollVote,
  playingTapeId,
  tapeProgress,
  isTourExpanded,
  isRsvped,
  rsvpCount,
  unlockedVipPosts,
  selectedSizesMap,
  offerStatusMap,
  activeNegotiationPostId,
  offerValues,
  shareToastActive,
  onOpenProfile,
  onTogglePostMenu,
  onClosePostMenu,
  onTogglePin,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onSetEditingText,
  onDeletePost,
  onShareClick,
  onOpenBoostModal,
  onPlaySong,
  onTogglePlaySong,
  onSeekSong,
  onToggleMuteSong,
  onOpenAlbumModalForSong,
  onOpenAlbumModalForAlbum,
  onBuyFormat,
  onVotePoll,
  onTogglePlayTape,
  onSeekTape,
  onStopTape,
  onOpenLightbox,
  onToggleTourExpand,
  onSelectTicketShow,
  onOpenTicketModal,
  onToggleRsvp,
  setSelectedSizesMap,
  setOfferStatusMap,
  setActiveNegotiationPostId,
  setOfferValues,
  openMerchLightbox,
  onCheckoutMerch,
  onAddToCart,
  setCartNotice,
  onToggleComments,
  onCommentDraftChange,
  onCommentSubmit,
  onSetReplyingTo,
  onTriggerEmojiReact,
  onOpenReactionMenu,
  onCloseReactionMenu,
  onOpenShareModal,
}) => {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const commentList = post.comments || [];
  const postRoleUpper = (post.authorRole || (post as any).author?.role || '').toUpperCase();
  const authorNameLower = (post.authorName || (post as any).author?.name || '').toLowerCase();

  // Separate Handle and Real Legal/Full Name
  const nameMatch = post.authorName ? post.authorName.match(/^(.*?)\s*\((.*?)\)$/) : null;
  const handleDisplay = nameMatch ? nameMatch[1].trim() : (post.authorName || 'User');

  // Check if current post is explicitly authored by the current logged-in user
  const targetPostAuthorId = post.authorId || (post as any).author?.id || (post as any).profile_id;
  const isPostExplicitlyOther = Boolean(
    (targetPostAuthorId && currentUserId && currentUserId !== 'author' && currentUserId !== 'user' && targetPostAuthorId !== currentUserId && (!userProfile?.id || targetPostAuthorId !== userProfile.id)) ||
    ((post as any).isYou === false) ||
    ((post as any).author?.isYou === false)
  );

  const isCurrentUser = !isPostExplicitlyOther && Boolean(
    (post as any).isYou === true ||
    (post as any).author?.isYou === true ||
    (currentUserId && currentUserId !== 'author' && currentUserId !== 'user' && (
      (post.authorId && post.authorId === currentUserId) || 
      ((post as any).author?.id && (post as any).author?.id === currentUserId)
    )) ||
    (userProfile?.id && userProfile.id !== 'author' && userProfile.id !== 'user' && (
      (post.authorId && post.authorId === userProfile.id) || 
      ((post as any).author?.id && (post as any).author?.id === userProfile.id)
    )) ||
    (userProfile?.console_handle && 
     userProfile.console_handle !== '@user' && 
     userProfile.console_handle !== 'user' && 
     userProfile.console_handle.trim() !== '' && (
      handleDisplay.toLowerCase() === userProfile.console_handle.toLowerCase() ||
      handleDisplay.toLowerCase() === userProfile.console_handle.replace(/^@/, '').toLowerCase()
    )) ||
    (userProfile?.email && (
      Boolean((post as any).authorEmail && (post as any).authorEmail.toLowerCase() === userProfile.email.toLowerCase()) || 
      Boolean((post as any).author?.email && (post as any).author?.email.toLowerCase() === userProfile.email.toLowerCase())
    ))
  );

  const postWorkspaceType = ((post as any).workspace_type || (post as any).workspaceType || '').toLowerCase();

  // 1. Band = Neon Green (#39ff14)
  const isArtistOrBand = postWorkspaceType === 'band' || 
    postRoleUpper === 'ARTIST' || 
    postRoleUpper === 'BAND' || 
    postRoleUpper === 'BAND / ARTIST' ||
    postRoleUpper.includes('BAND') ||
    postRoleUpper.includes('ARTIST') ||
    Boolean((post as any).author?.isBand) ||
    Boolean((post as any).isBandProfile);

  // 2. Label = Neon Orange (#ff6b00)
  const isLabel = !isArtistOrBand && (
    postWorkspaceType === 'label' || 
    postRoleUpper === 'LABEL' || 
    postRoleUpper === 'RECORD LABEL' ||
    postRoleUpper.includes('LABEL')
  );

  // 3. Creative = Magenta (#ff00aa)
  const isCreative = !isArtistOrBand && !isLabel && (
    postWorkspaceType === 'creative' || 
    postRoleUpper.includes('CREATIVE') || 
    postRoleUpper === 'PHOTOGRAPHER' || 
    postRoleUpper.includes('MEDIA') ||
    authorNameLower.includes('scene photographer') ||
    (post as any).author?.role === 'Creative Pro'
  );

  // 4. Promoter = Neon Yellow (#ffff00)
  const isPromoter = !isArtistOrBand && !isLabel && !isCreative && (
    postWorkspaceType === 'promoter' || 
    postRoleUpper === 'PROMOTER' || 
    postRoleUpper === 'PROMOTER / VENUE' ||
    postRoleUpper === 'VENUE PROMOTER' ||
    postRoleUpper.includes('PROMOTER') ||
    postRoleUpper.includes('VENUE')
  );

  // 5. Industry Pro = Deep Purple (#8b5cf6 / #7c3aed)
  const isIndustryPro = !isArtistOrBand && !isLabel && !isCreative && !isPromoter && Boolean(
    postWorkspaceType === 'industry_pro' ||
    postWorkspaceType === 'pro' ||
    postRoleUpper.includes('INDUSTRY PRO') ||
    postRoleUpper === 'INDUSTRY' ||
    postRoleUpper === 'PRO' ||
    postRoleUpper === 'MANAGER' ||
    postRoleUpper === 'EXECUTIVE' ||
    postRoleUpper === 'PRODUCER' ||
    postRoleUpper === 'ENGINEER' ||
    (post as any).author?.role === 'Industry Pro' ||
    (post as any).author?.account_type === 'industry pro' ||
    (post as any).author?.account_type === 'industry_pro' ||
    (isCurrentUser && (
      userProfile?.account_type === 'industry pro' ||
      userProfile?.account_type === 'industry_pro' ||
      userProfile?.account_type === 'pro' ||
      userProfile?.role === 'Industry Pro' ||
      portalRole === 'industry_pro' ||
      userProfile?.active_workspace === 'industry_pro'
    ))
  );

  // 6. Fan = Cyan Blue (#00f0ff)
  const isFan = !isArtistOrBand && !isLabel && !isCreative && !isPromoter && !isIndustryPro;

  // Canonical Role Colors:
  // Band = Neon Green (#39ff14)
  // Label = Neon Orange (#ff6b00)
  // Creative = Magenta (#ff00aa)
  // Promoter = Neon Yellow (#ffff00)
  // Fan = Cyan Blue (#00f0ff)
  // Industry Pro = Deep Purple (#8b5cf6)
  const roleTheme = isArtistOrBand
    ? {
        name: 'Band / Artist',
        colorHex: '#39ff14',
        ringClasses: 'border-[#39ff14] text-[#39ff14] shadow-[0_0_14px_rgba(57,255,20,0.65)] ring-2 ring-[#39ff14]/35 ring-offset-1 ring-offset-zinc-950',
        shieldClasses: 'text-[#39ff14] fill-[#39ff14]/20',
        fullNameClass: 'text-[#39ff14]',
        badgeDotClass: 'bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.85)]',
        badgeTextClass: 'text-[#39ff14]',
        tagLabel: postRoleUpper === 'BAND' || postRoleUpper === 'BAND / ARTIST' ? 'Band / Artist' : (post.authorRole || (post as any).author?.role || 'Band / Artist')
      }
    : isLabel
    ? {
        name: 'Record Label',
        colorHex: '#ff6b00',
        ringClasses: 'border-[#ff6b00] text-[#ff6b00] shadow-[0_0_14px_rgba(255,107,0,0.65)] ring-2 ring-[#ff6b00]/35 ring-offset-1 ring-offset-zinc-950',
        shieldClasses: 'text-[#ff6b00] fill-[#ff6b00]/20',
        fullNameClass: 'text-[#ff6b00]',
        badgeDotClass: 'bg-[#ff6b00] shadow-[0_0_8px_rgba(255,107,0,0.85)]',
        badgeTextClass: 'text-[#ff6b00]',
        tagLabel: 'Record Label'
      }
    : isCreative
    ? {
        name: 'Creative Pro',
        colorHex: '#ff00aa',
        ringClasses: 'border-[#ff00aa] text-[#ff00aa] shadow-[0_0_14px_rgba(255,0,170,0.65)] ring-2 ring-[#ff00aa]/35 ring-offset-1 ring-offset-zinc-950',
        shieldClasses: 'text-[#ff00aa] fill-[#ff00aa]/20',
        fullNameClass: 'text-[#ff00aa]',
        badgeDotClass: 'bg-[#ff00aa] shadow-[0_0_8px_rgba(255,0,170,0.85)]',
        badgeTextClass: 'text-[#ff00aa]',
        tagLabel: 'Creative Pro'
      }
    : isPromoter
    ? {
        name: 'Venue Promoter',
        colorHex: '#ffff00',
        ringClasses: 'border-[#ffff00] text-[#ffff00] shadow-[0_0_14px_rgba(255,255,0,0.65)] ring-2 ring-[#ffff00]/35 ring-offset-1 ring-offset-zinc-950',
        shieldClasses: 'text-[#ffff00] fill-[#ffff00]/20',
        fullNameClass: 'text-[#ffff00]',
        badgeDotClass: 'bg-[#ffff00] shadow-[0_0_8px_rgba(255,255,0,0.85)]',
        badgeTextClass: 'text-[#ffff00]',
        tagLabel: 'Venue Promoter'
      }
    : isIndustryPro
    ? {
        name: 'Industry Pro',
        colorHex: '#8b5cf6',
        ringClasses: 'border-[#8b5cf6] text-[#a78bfa] shadow-[0_0_14px_rgba(139,92,246,0.65)] ring-2 ring-[#8b5cf6]/35 ring-offset-1 ring-offset-zinc-950',
        shieldClasses: 'text-[#a78bfa] fill-[#8b5cf6]/20',
        fullNameClass: 'text-[#a78bfa]',
        badgeDotClass: 'bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.85)]',
        badgeTextClass: 'text-[#a78bfa]',
        tagLabel: 'Industry Pro'
      }
    : {
        name: 'Fan Supporter',
        colorHex: '#00f0ff',
        ringClasses: 'border-[#00f0ff] text-[#00f0ff] shadow-[0_0_14px_rgba(0,240,255,0.65)] ring-2 ring-[#00f0ff]/35 ring-offset-1 ring-offset-zinc-950',
        shieldClasses: 'text-[#00f0ff] fill-[#00f0ff]/20',
        fullNameClass: 'text-[#00f0ff]',
        badgeDotClass: 'bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.85)]',
        badgeTextClass: 'text-[#00f0ff]',
        tagLabel: 'Fan Supporter'
      };

  // Comprehensive Avatar Resolution & Initials Generator
  const postDataObj = typeof (post as any).data === 'string' 
    ? (() => { try { return JSON.parse((post as any).data); } catch { return {}; } })() 
    : ((post as any).data || {});

  let localStoredAvatar: string | null = null;
  if (typeof window !== 'undefined') {
    localStoredAvatar = localStorage.getItem('nexus_avatar') || localStorage.getItem('nexus_user_avatar') || null;
    if (!localStoredAvatar) {
      try {
        const bOverride = localStorage.getItem('band_profile_override');
        if (bOverride) {
          const parsed = JSON.parse(bOverride);
          localStoredAvatar = parsed.avatar_url || parsed.logo_url || parsed.avatar || null;
        }
      } catch {
        // ignore
      }
    }
  }

  const liveSelfAvatar = userProfile?.avatar || userProfile?.avatar_url || userProfile?.profile_avatar || (userProfile as any)?.profile_image || localStoredAvatar;
  
  const rawPostAvatar = 
    post.authorAvatar || 
    (post as any).author?.avatar || 
    (post as any).author?.avatar_url ||
    (post as any).author?.avatarUrl ||
    (post as any).author?.logo_url ||
    (post as any).avatar ||
    (post as any).avatar_url ||
    (post as any).profile_avatar ||
    (post as any).author_avatar ||
    (post as any).logo_url ||
    postDataObj.author?.avatar ||
    postDataObj.authorAvatar ||
    postDataObj.avatar ||
    postDataObj.avatar_url ||
    postDataObj.profile_avatar ||
    postDataObj.logo_url;

  const isGenericUiAvatar = typeof rawPostAvatar === 'string' && (
    rawPostAvatar.includes('ui-avatars.com') ||
    rawPostAvatar === 'U' ||
    rawPostAvatar === 'Anon' ||
    rawPostAvatar.trim() === ''
  );

  const displayAvatar = (!isGenericUiAvatar && rawPostAvatar)
    ? rawPostAvatar
    : (isCurrentUser ? (liveSelfAvatar || null) : null);

  const getInitials = (str?: string) => {
    if (!str) return 'NX';
    const clean = str.replace(/^@/, '').trim();
    if (clean.toLowerCase() === 'user' || clean.toLowerCase() === 'anonymous' || clean.toLowerCase() === 'anon') {
      if (userProfile?.console_handle && userProfile.console_handle !== '@user') {
        return userProfile.console_handle.replace(/^@/, '').substring(0, 2).toUpperCase();
      }
      if (userProfile?.name) {
        return userProfile.name.substring(0, 2).toUpperCase();
      }
      return 'NX';
    }
    const words = clean.split(/[\s_-]+/);
    if (words.length >= 2 && words[0] && words[1]) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  };

  const displayInitials = getInitials(isCurrentUser ? (userProfile?.console_handle || userProfile?.name || handleDisplay) : handleDisplay);

  const isPostBoosted = Boolean(post.isBoosted || boostData?.isBoosted);
  const auraColor = boostData?.boostGlowColor || post.boostGlowColor || (
    isArtistOrBand ? 'green' :
    isLabel ? 'orange' :
    isCreative ? 'fuchsia' :
    isPromoter ? 'yellow' :
    isIndustryPro ? 'purple' : 'blue'
  );

  // Resolve full_name from Supabase profiles table
  const localSavedFullName = typeof window !== 'undefined'
    ? (localStorage.getItem('nexus_full_legal_name') || localStorage.getItem('nexus_user_full_name'))
    : null;

  const currentProfileFullName =
    userProfile?.full_name ||
    userProfile?.legal_name ||
    (userProfile as any)?.legal_full_name ||
    localSavedFullName ||
    (userProfile?.name && userProfile.name !== 'User' && userProfile.name !== 'New User' ? userProfile.name : undefined);

  const rawPostFullName =
    (post as any).author?.full_name ||
    (post as any).author?.legal_name ||
    (post as any).author?.legalName ||
    (post as any).author?.realName ||
    post.legalName ||
    post.realName ||
    (nameMatch ? nameMatch[2].trim() : undefined);

  const fullNameDisplay = isCurrentUser
    ? (currentProfileFullName || rawPostFullName)
    : (rawPostFullName || KNOWN_USER_FULL_NAMES[handleDisplay.toLowerCase()] || KNOWN_USER_FULL_NAMES[authorNameLower]);

  // Location fallback
  const locationDisplay = post.location || post.venue;

  // Tag display determination
  const displayTag = post.tag || (
    post.songData ? 'SONG SHARE' :
    post.albumData ? 'ALBUM RELEASE' :
    post.pollData ? 'SLAM DISCUSSION' :
    post.tapeData ? 'LIVE BOOTLEG' :
    undefined
  );

  // Calculate reactions total count
  const totalReactions = 
    (post.reactions?.likes || 0) + 
    (post.reactions?.horns || 0) + 
    (post.reactions?.hype || 0) + 
    (post.reactions?.brutal || 0) + 
    (post.reactions?.respect || 0) + 
    (post.reactions?.crushed || 0) +
    (post.reactions?.thumbs || 0) +
    (post.reactions?.heavy || 0) +
    (post.reactions?.flame || 0) +
    (post.reactions?.heart || 0) || 
    post.likes_count || 0;

  // Active reaction emojis
  const activeReactionIcons: string[] = [];
  if ((post.reactions?.likes || 0) > 0 || (post.reactions?.thumbs || 0) > 0 || (post.reactions?.heart || 0) > 0 || post.user_reactions?.likes || post.user_reactions?.like || post.user_liked) activeReactionIcons.push('👍');
  if ((post.reactions?.horns || 0) > 0 || post.user_reactions?.horns) activeReactionIcons.push('🤘');
  if ((post.reactions?.hype || 0) > 0 || (post.reactions?.flame || 0) > 0 || post.user_reactions?.hype || post.user_reactions?.flame) activeReactionIcons.push('🔥');
  if ((post.reactions?.brutal || 0) > 0 || (post.reactions?.heavy || 0) > 0 || post.user_reactions?.brutal || post.user_reactions?.heavy) activeReactionIcons.push('🔨');
  if ((post.reactions?.respect || 0) > 0 || post.user_reactions?.respect) activeReactionIcons.push('👊');
  if ((post.reactions?.crushed || 0) > 0 || post.user_reactions?.crushed) activeReactionIcons.push('⚓');

  // User active reaction
  const hasUserReacted = post.user_liked || Object.values(post.user_reactions || {}).some(Boolean);
  const userActiveReactionKey = Object.keys(post.user_reactions || {}).find(k => post.user_reactions?.[k]);
  const activePaletteItem = REACTION_PALETTE.find(r => r.id === userActiveReactionKey) || 
                            (post.user_liked ? { id: 'likes', emoji: '👍', label: 'Like', color: 'text-sky-400' } : null);

  const defaultReactionId = post.tag === 'SONG SHARE' ? 'brutal' : post.tag === 'ALBUM RELEASE' ? 'hype' : 'likes';

  // Check if post belongs to logged-in user
  const isUserOwnPost = Boolean(
    isCurrentUser ||
    (currentUserId && currentUserId !== 'author' && currentUserId !== 'user' && (
      post.authorId === currentUserId || 
      (post as any).author?.id === currentUserId
    )) ||
    (currentUserName && currentUserName !== 'User' && currentUserName !== 'New User' && post.authorName?.toLowerCase() === currentUserName?.toLowerCase())
  );

  const formattedTimestamp = formatPostTimestamp(post, post.created_at || post.timestamp);

  const startLongPress = () => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onOpenReactionMenu();
    }, 380);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleReactionButtonClick = (defaultType: string) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    if (isReactionMenuOpen) {
      onCloseReactionMenu();
      return;
    }
    onTriggerEmojiReact(defaultType);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <div
      className={`bg-[#0d0e11] border rounded-2xl p-4 sm:p-5 shadow-2xl transition-all relative overflow-hidden space-y-3.5 ${
        isPostBoosted
          ? (auraColor === 'purple'
              ? 'border-2 border-purple-500/90 shadow-[0_0_30px_rgba(168,85,247,0.4)] bg-gradient-to-b from-purple-950/25 via-[#0d0e11] to-[#0d0e11]'
              : 'border-2 border-sky-400/90 shadow-[0_0_30px_rgba(56,189,248,0.4)] bg-gradient-to-b from-sky-950/25 via-[#0d0e11] to-[#0d0e11]'
            )
          : post.is_pinned
          ? 'border-rose-500/70 bg-gradient-to-b from-rose-950/20 via-[#0d0e11] to-[#0d0e11]'
          : post.isVipExclusive
          ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.12)] bg-gradient-to-b from-amber-950/20 via-[#0d0e11] to-[#0d0e11]'
          : 'border-zinc-800/90 hover:border-zinc-700/80'
      }`}
    >
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-[#0d0e11]/98 backdrop-blur-md z-50 flex flex-col items-center justify-center p-5 text-center animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center mb-3 text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <Trash2 className="w-5 h-5 animate-pulse" />
          </div>
          <h4 className="text-xs font-black text-white font-mono uppercase tracking-widest">Delete Transmission?</h4>
          <p className="text-[10px] text-zinc-400 mt-2 max-w-[240px] leading-relaxed font-mono">
            Are you sure you want to permanently delete this signal from the timeline? This action cannot be undone.
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
                if (onDeletePost) {
                  onDeletePost(post.id);
                }
              }}
              className="flex-1 px-3.5 py-2 rounded-xl bg-rose-950/50 border border-rose-500/60 text-[10px] font-mono font-bold text-rose-400 hover:bg-rose-900/60 transition-all cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      {/* Boosted Post Neon Banner Badge */}
      {isPostBoosted && (
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className={`flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full ${
            auraColor === 'purple'
              ? 'bg-purple-950/90 border border-purple-500/80 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.4)] animate-pulse'
              : 'bg-sky-950/90 border border-sky-400/80 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.4)] animate-pulse'
          }`}>
            <Rocket className="w-3.5 h-3.5" />
            <span>⚡ 24H PIT BOOSTED</span>
          </div>
          <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {boostData?.boostType === 'free' ? '🎁 Monthly Perk' : '⚡ Promoted Signal'}
          </span>
        </div>
      )}

      {/* Pinned Network Announcement Tag */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest pb-1 border-b border-rose-900/30">
          <Pin className="w-3 h-3 fill-rose-400/30 text-rose-400" />
          <span>Pinned Network Announcement</span>
        </div>
      )}

      {/* Post Header Row */}
      <div className="flex items-start justify-between gap-3">
        {/* Author Info */}
        <div
          className="flex items-start gap-3 cursor-pointer group flex-1 min-w-0 pt-0.5"
          onClick={() => {
            const authorPayload = {
              id: targetPostAuthorId,
              name: post.authorName || (post as any).author?.name || (post as any).author?.full_name || handleDisplay,
              full_name: (post as any).author?.full_name || post.authorName,
              avatar: displayAvatar || rawPostAvatar,
              avatar_url: displayAvatar || rawPostAvatar,
              role: post.authorRole || (post as any).author?.role || roleTheme.tagLabel,
              workspace_type: postWorkspaceType,
              workspaceType: postWorkspaceType,
              isYou: isCurrentUser,
              isBandProfile: isArtistOrBand,
              band_name: isArtistOrBand ? (post.authorName || (post as any).author?.name) : undefined,
              ...((post as any).author || {})
            };
            onOpenProfile?.(targetPostAuthorId || post.authorName, authorPayload as any);
          }}
        >
          <div className="relative group/avatar shrink-0">
            {/* Micro glow avatar container - static stroke + glow */}
            <div 
              className="relative p-[2px] rounded-full transition-transform duration-200 group-hover/avatar:scale-105"
              style={{
                backgroundColor: roleTheme.colorHex,
                boxShadow: `0 0 12px ${roleTheme.colorHex}66, 0 0 24px ${roleTheme.colorHex}26`
              }}
            >
              <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full flex items-center justify-center font-black font-mono text-xs sm:text-sm overflow-hidden shrink-0 bg-zinc-950 border border-zinc-950">
                {displayAvatar ? (
                  <img 
                    src={displayAvatar} 
                    alt={post.authorName} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      if (isCurrentUser && liveSelfAvatar && e.currentTarget.src !== liveSelfAvatar) {
                        e.currentTarget.src = liveSelfAvatar;
                      } else {
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                    className="w-full h-full object-cover rounded-full" 
                  />
                ) : (
                  <span style={{ color: roleTheme.colorHex }}>{displayInitials}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {/* Line 1: Handle + Verified Badge */}
            <h3 className="text-xs sm:text-sm font-mono font-black tracking-wider transition-colors flex items-center gap-1.5 truncate leading-tight text-white group-hover:text-purple-300">
              <span className="truncate">{handleDisplay}</span>
              {(isCreative || isArtistOrBand || isIndustryPro || isLabel || isPromoter || post.isVerified) && (
                <Shield className={`w-3.5 h-3.5 shrink-0 ${roleTheme.shieldClasses}`} />
              )}
            </h3>

            {/* Line 2: Person's Full Name under the handle */}
            {fullNameDisplay && (
              <p className={`text-[11px] sm:text-xs font-mono font-bold tracking-wider mt-0.5 truncate uppercase ${roleTheme.fullNameClass}`}>
                {fullNameDisplay.toUpperCase()}
              </p>
            )}

            {/* Line 3: Date / Timestamp (+ optional location) */}
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center mt-0.5 truncate">
              <span>{formattedTimestamp}</span>
              {locationDisplay && (
                <>
                  <span className="mx-1 text-zinc-700 shrink-0">•</span>
                  <span className="truncate flex items-center gap-1 text-zinc-400 font-semibold">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0 inline" />
                    <span className="truncate">{locationDisplay.toUpperCase()}</span>
                  </span>
                </>
              )}
            </div>

            {/* Line 4: Role badge with glowing micro-indicator dot */}
            <div className="mt-0.5 flex items-center gap-1">
              <span className={`text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 ${roleTheme.badgeTextClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${roleTheme.badgeDotClass}`} />
                {roleTheme.tagLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 3-Dot Options Dropdown Menu */}
        <div className="relative shrink-0 mt-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePostMenu();
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isPostMenuOpen
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg'
                : 'bg-zinc-900/90 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
            title="Post Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Popup Dropdown Modal */}
          {isPostMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={(e) => {
                  e.stopPropagation();
                  onClosePostMenu();
                }} 
              />
              <div 
                className="absolute right-0 top-11 z-40 w-48 bg-[#121319] border border-zinc-700/80 rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                {onTogglePin && (
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePin(post.id);
                      onClosePostMenu();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-zinc-200 hover:bg-zinc-800/90 hover:text-white transition-colors text-left"
                  >
                    <Pin className={`w-3.5 h-3.5 ${post.is_pinned ? 'text-rose-400 fill-rose-400' : 'text-zinc-400'}`} />
                    <span>{post.is_pinned ? 'Unpin Post' : 'Pin Post'}</span>
                  </button>
                )}

                {onStartEditing && isUserOwnPost && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) {
                        onCancelEditing();
                      } else {
                        onStartEditing();
                      }
                      onClosePostMenu();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-zinc-200 hover:bg-amber-500/10 hover:text-amber-300 transition-colors text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Post'}</span>
                  </button>
                )}

                {onDeletePost && isUserOwnPost && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete();
                      onClosePostMenu();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Post</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onShareClick();
                    onClosePostMenu();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-zinc-300 hover:bg-zinc-800/90 hover:text-white transition-colors text-left"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Copy Link</span>
                </button>
                {isUserOwnPost && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenBoostModal();
                      onClosePostMenu();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors text-left"
                  >
                    <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Boost Post</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Message Content (or Edit Form) - Sits directly snug under author header */}
      <div className="-mt-1 sm:-mt-1.5">
        {isEditing ? (
          <div className="space-y-2 bg-zinc-950 border border-amber-500/50 rounded-xl p-3">
            <textarea
              value={editingText}
              onChange={(e) => onSetEditingText(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/80 font-sans min-h-[80px]"
              placeholder="Update post content..."
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={onCancelEditing}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => onSaveEditing(editingText)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap break-words">
              {renderPostMessage(post.message, onOpenProfile)}
            </p>

            {/* RICH EMBED 0: AUTO LINK PREVIEW CARD */}
            <LinkPreviewCard message={post.message} />
          </div>
        )}
      </div>

      {/* SMART GIG & TOUR PROXIMITY PILL (rendered below post caption, only if dates/tickets exist) */}
      <GigProximityPill
        post={post}
        userProfile={userProfile}
        onOpenTicketModal={onOpenTicketModal}
        onSelectTicketShow={onSelectTicketShow}
      />

      {/* RICH EMBED 1: SONG SHARE CARD */}
      {post.songData && (
        <SongEmbedCard
          post={post}
          isPlaying={playingSongId === post.id}
          progress={songProgress || 0}
          isMuted={songVolumeMuted}
          onPlaySong={onPlaySong}
          onTogglePlay={(song) => onTogglePlaySong(song)}
          onSeek={(pct) => onSeekSong(pct)}
          onToggleMute={onToggleMuteSong}
          onOpenAlbumModal={(song) => onOpenAlbumModalForSong(song)}
        />
      )}

      {/* RICH EMBED 2: ALBUM RELEASE CARD */}
      {post.albumData && (
        <AlbumEmbedCard
          post={post}
          onOpenAlbumModal={(album) => onOpenAlbumModalForAlbum(album)}
          onBuyFormat={onBuyFormat}
        />
      )}

      {/* RICH EMBED 3: INTERACTIVE UNBIASED POLL CARD */}
      {post.pollData && (
        <PollWidget
          post={post}
          pollVote={pollVote}
          onVote={(optionId, pollData) => onVotePoll(optionId, pollData)}
        />
      )}

      {/* RICH EMBED 4: TAPE / BOOTLEG CARD */}
      {post.tapeData && (
        <TapeEmbedCard
          variant="feed"
          post={post}
          isPlaying={playingTapeId === post.id}
          progress={tapeProgress || 0}
          onTogglePlay={onTogglePlayTape}
          onSeek={onSeekTape}
          onStop={onStopTape}
        />
      )}

      {/* YouTube Embed (Old TV Style) */}
      {post.youtubeId && (
        <YouTubeEmbedCard youtubeId={post.youtubeId} />
      )}

      {/* Bandcamp Embed Player */}
      {(post.bandcampUrl || post.bandcamp_url || post.bandcampData || post.bandcamp_data || (post.mediaUrl && post.mediaUrl.includes('bandcamp.com')) || (post.media_url && post.media_url.includes('bandcamp.com')) || (post.image_url && post.image_url.includes('bandcamp.com')) || (post.image && post.image.includes('bandcamp.com'))) && (
        <BandcampEmbedCard post={post} />
      )}

      {/* Media Attachment Image(s) - Edge-to-Edge Showcase */}
      {!post.tapeData && !(post as any).tape_data && !post.songData && !post.albumData && !post.merchData && !post.youtubeId && !post.bandcampUrl && !post.bandcamp_url && !post.bandcampData && !post.bandcamp_data && !(post.mediaUrl && post.mediaUrl.includes('bandcamp.com')) && !(post.media_url && post.media_url.includes('bandcamp.com')) && !(post.image_url && post.image_url.includes('bandcamp.com')) && !(post.image && post.image.includes('bandcamp.com')) && (
        <MediaGalleryGrid
          images={post.images}
          imageUrl={post.image_url}
          onOpenLightbox={(images, index) => onOpenLightbox(images, index)}
          tag={post.tag}
          location={locationDisplay}
          ticketData={post.ticketData}
          eventData={post.eventData}
          onOpenTicketModal={onOpenTicketModal}
          onSelectTicketShow={onSelectTicketShow}
        />
      )}

      {/* Tour Announcement Embed */}
      {(post.ticketData || post.tourData) && (
        <TourEmbedCard
          post={post}
          isExpanded={isTourExpanded}
          onToggleExpand={onToggleTourExpand}
          onSelectTicketShow={(date) => onSelectTicketShow(date)}
          onOpenTicketModal={onOpenTicketModal}
        />
      )}

      {/* In-Feed DIY & Community Event Embed */}
      {post.eventData && (
        <EventEmbedCard
          post={post}
          isRsvped={isRsvped}
          rsvpCount={rsvpCount}
          onToggleRsvp={onToggleRsvp}
        />
      )}

      {/* In-Feed Merch & Gear Marketplace Drop Embed */}
      {post.merchData && (
        <MerchEmbedCard
          post={post}
          unlockedVipPosts={unlockedVipPosts}
          selectedSizesMap={selectedSizesMap}
          setSelectedSizesMap={setSelectedSizesMap}
          offerStatusMap={offerStatusMap}
          setOfferStatusMap={setOfferStatusMap}
          activeNegotiationPostId={activeNegotiationPostId}
          setActiveNegotiationPostId={setActiveNegotiationPostId}
          offerValues={offerValues}
          setOfferValues={setOfferValues}
          openMerchLightbox={openMerchLightbox}
          onCheckout={onCheckoutMerch}
          onAddToCart={onAddToCart}
          setCartNotice={setCartNotice}
        />
      )}

      {/* Tagged Merch / Release Node */}
      {post.tagged_item && (
        <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center gap-2 text-xs font-mono text-rose-300">
          <Tag className="w-3.5 h-3.5 text-rose-400" />
          <span>Linked Node: {post.tagged_item}</span>
        </div>
      )}

      {/* DARKER DIVIDER LINE UNDER PLAYER / CONTENT */}
      <div className="border-t border-zinc-950 my-2" />

      {/* Reactions Summary Counter Row */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
        <div className="bg-zinc-950/90 border border-zinc-900 px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 shadow-sm">
          <span className="flex items-center gap-1">
            <span className="text-sm">{activeReactionIcons.length > 0 ? activeReactionIcons.join('') : '❤️'}</span>
            <span>{totalReactions} reactions</span>
          </span>
        </div>

        <button
          onClick={onToggleComments}
          className="text-[11px] font-mono font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {commentList.length} Comments
        </button>
      </div>

      {/* Action Ribbon: 3 Buttons (Reaction, Comment, Share) */}
      <div className="grid grid-cols-3 gap-2 relative">
        
        {/* Hype Fire Animation Effect */}
        {isHypeAnimated && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-visible">
            <div className="animate-ping absolute -top-8 text-5xl text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,1)]">🔥</div>
            <div className="animate-bounce absolute -top-12 text-6xl text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,1)]" style={{ animationDuration: '0.4s' }}>🔥</div>
          </div>
        )}

        {/* Full Reaction Options Popover */}
        {isReactionMenuOpen && (
          <div className="absolute -top-14 left-0 z-50 bg-zinc-950/95 border border-zinc-700/90 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
            {REACTION_PALETTE.map((r, rIdx) => (
              <button
                key={`react-pal-${r.id}-${rIdx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerEmojiReact(r.id);
                  onCloseReactionMenu();
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

        {/* Button 1: Reaction Button with Long Press */}
        <button
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onClick={() => handleReactionButtonClick(activePaletteItem?.id || defaultReactionId)}
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
              <span className="text-sm leading-none">👍</span>
              <span>Like</span>
            </>
          )}
        </button>

        {/* Button 2: Comment */}
        <button
          onClick={onToggleComments}
          className="py-2 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Comment</span>
        </button>

        {/* Button 3: Share */}
        <button
          onClick={onOpenShareModal}
          className="py-2 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer relative"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{shareToastActive ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Bottom Comment Preview Bar (When Collapsed) */}
      {!isCommentsOpen && commentList.length > 0 && (
        <div 
          onClick={onToggleComments}
          className="bg-[#08090b] border border-red-950/40 hover:border-red-900/70 rounded-xl p-3 px-3.5 text-xs transition-all cursor-pointer group mt-2.5 shadow-sm space-y-1.5"
        >
          <div className="min-w-0">
            <span className="font-mono font-bold text-rose-400 mr-2">{commentList[0].username}:</span>
            <span className="text-zinc-200 font-sans leading-relaxed break-words">{commentList[0].text}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-zinc-900/80 text-[10px] font-mono">
            <span className="text-zinc-500 group-hover:text-red-400 transition-colors uppercase font-bold tracking-wider">
              Click to view all ({commentList.length} comment{commentList.length > 1 ? 's' : ''})
            </span>
            <span className="text-zinc-600">{formatPostTimestamp((commentList[0] as any).created_at || commentList[0].time, commentList[0].time)}</span>
          </div>
        </div>
      )}

      {/* Expanded Comments Section */}
      {isCommentsOpen && (
        <div className="mt-3 space-y-3">
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {commentList.length === 0 ? (
              <p className="text-[11px] font-mono text-zinc-500 italic">No comments yet. Start the signal.</p>
            ) : (
              commentList
                .filter(c => !c.parent_comment_id)
                .map((comment, cIdx) => {
                  const replies = commentList.filter(r => r.parent_comment_id === comment.id);
                  return (
                    <div key={comment.id ? `comm-${comment.id}-${cIdx}` : `comm-${cIdx}`} className="space-y-1.5">
                      {/* Top Level Comment */}
                      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 text-xs space-y-1">
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="font-bold text-rose-400">{comment.username}</span>
                          <span className="text-zinc-600">{formatPostTimestamp((comment as any).created_at || comment.time, comment.time)}</span>
                        </div>
                        <p className="text-zinc-300 font-sans leading-relaxed">{comment.text}</p>
                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => onSetReplyingTo({ commentId: comment.id, username: comment.username })}
                            className="text-[10px] font-mono text-rose-400/80 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            Reply
                          </button>
                        </div>
                      </div>

                      {/* Threaded Replies */}
                      {replies.length > 0 && (
                        <div className="ml-4 pl-2.5 border-l-2 border-rose-900/40 space-y-1.5">
                          {replies.map((reply, rIdx) => (
                            <div key={reply.id ? `reply-${reply.id}-${rIdx}` : `reply-${cIdx}-${rIdx}`} className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2 text-xs space-y-1">
                              <div className="flex items-center justify-between font-mono text-[10px]">
                                <span className="font-bold text-rose-400/90">{reply.username}</span>
                                <span className="text-zinc-600">{formatPostTimestamp((reply as any).created_at || reply.time, reply.time)}</span>
                              </div>
                              <p className="text-zinc-300 font-sans leading-relaxed">{reply.text}</p>
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
          {replyingTo && (
            <div className="flex items-center justify-between bg-rose-950/40 border border-rose-800/40 rounded-lg px-2.5 py-1 text-[11px] font-mono text-rose-300">
              <span>Replying to <strong>@{replyingTo.username}</strong></span>
              <button
                type="button"
                onClick={() => onSetReplyingTo(null)}
                className="hover:text-white cursor-pointer ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Add Comment Input Form */}
          <form onSubmit={onCommentSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
              value={commentDraft || ''}
              onChange={(e) => onCommentDraftChange(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/60 font-sans"
            />
            <button
              type="submit"
              disabled={!(commentDraft || '').trim()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
