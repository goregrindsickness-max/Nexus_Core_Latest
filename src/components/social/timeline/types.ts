import React from 'react';

export interface FeedComment {
  id: string;
  post_id?: string;
  user_id?: string;
  parent_comment_id?: string | null;
  username: string;
  text: string;
  time: string;
  created_at?: string;
}

export interface SongEmbedData {
  band: string;
  title: string;
  album: string;
  duration?: string;
  coverArt?: string;
}

export interface AlbumEmbedTrack {
  title: string;
  duration: string;
}

export interface AlbumEmbedData {
  band: string;
  albumName: string;
  releaseYear?: string;
  coverUrl?: string;
  tracks?: AlbumEmbedTrack[];
  purchaseLinks?: { format: string; price: string }[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollEmbedData {
  question: string;
  variant?: string;
  options: PollOption[];
  totalVotes?: number;
  isTimed?: boolean;
  expiresAt?: string;
}

export interface TapeEmbedData {
  title: string;
  band: string;
  duration: string;
  date?: string;
}

export interface TourEmbedData {
  tourName: string;
  dates: {
    date: string;
    city: string;
    venue: string;
    ticketStatus: 'available' | 'soon' | 'sold_out';
    priceRange?: string;
    doorTime?: string;
    showId?: string;
  }[];
}

export interface FeedPost {
  id: string;
  type?: string;
  timestamp: string;
  created_at?: string;
  timeAgo?: string;
  authorId: string;
  authorName: string;
  legalName?: string;
  realName?: string;
  authorAvatar?: string;
  authorRole?: string;
  location?: string;
  venue?: string;
  isVerified?: boolean;
  message: string;
  image_url?: string;
  images?: string[];
  youtubeId?: string;
  tagged_item?: string;
  tag?: string;
  category?: string;
  is_pinned?: boolean;
  isBoosted?: boolean;
  boostGlowColor?: 'blue' | 'purple' | string;
  boostType?: string;
  songData?: SongEmbedData;
  albumData?: AlbumEmbedData;
  pollData?: PollEmbedData;
  tapeData?: TapeEmbedData;
  tourData?: TourEmbedData;
  ticketData?: {
    headliner?: string;
    venue: string;
    date: string;
    doorTime: string;
    priceRange: string;
    ticketUrl?: string;
    external_ticket_url?: string;
  };
  merchData?: {
    name: string;
    price: number;
    thumbnail: string;
    sizes: string[];
    isTimed?: boolean;
    durationHours?: number;
    discount?: number;
    expiresAt?: string;
    stock?: number;
    totalStock?: number;
    allowNegotiation?: boolean;
    condition?: string;
    category?: string;
  };
  eventData?: any;
  isVipExclusive?: boolean;
  requiredTier?: string;
  vipDiscountPct?: number;
  likes_count: number;
  user_liked?: boolean;
  reactions?: { 
    heart?: number; 
    flame?: number; 
    rocket?: number; 
    thumbs?: number; 
    heavy?: number; 
    hype?: number;
    skull?: number;
    horns?: number;
    respect?: number;
    crushed?: number;
    brutal?: number;
    like?: number;
    [key: string]: number | undefined;
  };
  user_reactions?: Record<string, boolean>;
  comments?: FeedComment[];
}

export interface TimelineFeedProps {
  posts: FeedPost[];
  currentUserId?: string;
  currentUserName?: string;
  userProfile?: any;
  portalRole?: string;
  onToggleLike: (postId: string) => void;
  onEmojiReact: (postId: string, reactionType: string) => void;
  onAddComment: (postId: string, commentText: string, parentCommentId?: string) => void;
  onTogglePin?: (postId: string) => void;
  onEditPost?: (postId: string, newText: string) => void;
  onDeletePost?: (postId: string) => void;
  onOpenProfile?: (authorId: string, authorName: string) => void;
  onPlaySong?: (song: SongEmbedData) => void;
  onAddToCart?: (item: { title: string; bandName: string; price: number; format: string }) => void;
  onShareToTimeline?: (post: FeedPost) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onOpenTicketModal?: (ticketData: any) => void;
  onOpenMerchModal?: (merchData: any) => void;
  onTriggerNotification?: (msg: string) => void;
  discoverProfiles?: any[];
  onFollowProfile?: (profile: any) => void;
}

export const REACTION_PALETTE = [
  { id: 'likes', emoji: '👍', label: 'Like', color: 'text-sky-400' },
  { id: 'horns', emoji: '🤘', label: 'Horns', color: 'text-rose-400' },
  { id: 'hype', emoji: '🔥', label: 'Hype', color: 'text-amber-500' },
  { id: 'brutal', emoji: '🔨', label: 'Brutal', color: 'text-red-500' },
  { id: 'respect', emoji: '👊', label: 'Respect', color: 'text-emerald-400' },
  { id: 'crushed', emoji: '⚓', label: 'Crushed', color: 'text-zinc-400' },
];

export const ANALEPSY_QUIESCENCE_TRACKS = [
  { title: 'Locus of Dawning', duration: '3:45' },
  { title: 'Impending Subversion', duration: '4:12' },
  { title: 'Elapsing Permanence (feat. Wilson Ng)', duration: '3:58' },
  { title: 'Accretion Collision', duration: '3:34' },
  { title: 'Stretched and Devoured (feat. Angel Ochoa)', duration: '4:21' },
  { title: 'Converse Condition', duration: '3:15' },
  { title: 'Fractured Continuum', duration: '3:48' },
  { title: 'Spasmodic Dissonance (feat. Ricky Myers)', duration: '4:05' },
  { title: 'Edge of Chaos', duration: '3:52' },
  { title: 'Quiescence', duration: '4:40' }
];
