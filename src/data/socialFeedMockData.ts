// Shared mock data, themes, and playlists extracted from UniversalSocialFeed.tsx

export const GENRE_REACTION_MATRICES: Record<string, Record<string, { label: string; icon: string; accent: string }>> = {
  metal: {
    hype:                      { label: 'Hype',   icon: '🔥', accent: 'text-red-500' },
    token_heavy_energy:        { label: 'Heavy',  icon: '🔨', accent: 'text-zinc-300' },
    token_movement_vibe:       { label: 'Mosh',   icon: '🌀', accent: 'text-purple-500' },
    token_collectible_classic: { label: 'Grail',  icon: '💿', accent: 'text-cyan-400' },
    token_aesthetic:           { label: 'Grim',   icon: '💀', accent: 'text-orange-500' },
    token_disappointment:      { label: 'Gutted', icon: '🩹', accent: 'text-yellow-600' },
    token_rejection:           { label: 'Whack',  icon: '🚫', accent: 'text-rose-700' }
  },
  electronic: {
    hype:                      { label: 'Hype',      icon: '🔥', accent: 'text-red-500' },
    token_heavy_energy:        { label: 'Electric',  icon: '⚡', accent: 'text-yellow-400' },
    token_movement_vibe:       { label: 'Groove',    icon: '💃', accent: 'text-fuchsia-500' },
    token_collectible_classic: { label: 'Vinyl',     icon: '💿', accent: 'text-cyan-400' },
    token_aesthetic:           { label: 'Vibe',      icon: '🌌', accent: 'text-indigo-400' },
    token_disappointment:      { label: 'Faded',     icon: '📉', accent: 'text-zinc-500' },
    token_rejection:           { label: 'Whack',     icon: '🚫', accent: 'text-rose-700' }
  },
  hiphop: {
    hype:                      { label: 'Hype',    icon: '🔥', accent: 'text-red-500' },
    token_heavy_energy:        { label: 'Cold',    icon: '🥶', accent: 'text-sky-400' },
    token_movement_vibe:       { label: 'Bounce',  icon: '🌊', accent: 'text-cyan-500' },
    token_collectible_classic: { label: 'Classic', icon: '👑', accent: 'text-amber-400' },
    token_aesthetic:           { label: 'Gem',     icon: '💎', accent: 'text-teal-400' },
    token_disappointment:      { label: 'Brick',   icon: '🛑', accent: 'text-red-600' },
    token_rejection:           { label: 'Whack',   icon: '🚫', accent: 'text-rose-700' }
  }
};

export const roleTheme = {
  fan: {
    name: 'Fan',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    hoverBorderClass: 'hover:border-rose-500/50',
    bgClass: 'bg-rose-950/40',
    bgBadge: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.25)]',
    pulseGlow: 'animate-pulse-glow',
    stripClass: 'from-rose-600 via-rose-500 to-rose-900',
    accentColor: '#f43f5e',
    accentColorRgba: 'rgba(244,63,94,0.25)',
    gridColor: 'rgba(239,68,68,0.025)',
    btnClass: 'bg-rose-600 hover:bg-rose-500 text-white',
  },
  creative: {
    name: 'Creative',
    textClass: 'text-fuchsia-400',
    borderClass: 'border-fuchsia-500/30',
    hoverBorderClass: 'hover:border-fuchsia-500/50',
    bgClass: 'bg-fuchsia-950/40',
    bgBadge: 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(217,70,239,0.3)]',
    pulseGlow: 'animate-pulse-glow-magenta',
    stripClass: 'from-fuchsia-600 via-fuchsia-500 to-fuchsia-900',
    accentColor: '#d946ef',
    accentColorRgba: 'rgba(217,70,239,0.3)',
    gridColor: 'rgba(217,70,239,0.025)',
    btnClass: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white',
  },
  band: {
    name: 'Band',
    textClass: 'text-[#39ff14]',
    borderClass: 'border-[#39ff14]/30',
    hoverBorderClass: 'hover:border-[#39ff14]/50',
    bgClass: 'bg-[#39ff14]/10',
    bgBadge: 'bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/40',
    glowClass: 'shadow-[0_0_15px_rgba(57,255,20,0.3)]',
    pulseGlow: 'animate-pulse-glow-green',
    stripClass: 'from-[#39ff14]/80 via-[#39ff14]/60 to-[#39ff14]/40',
    accentColor: '#39ff14',
    accentColorRgba: 'rgba(57,255,20,0.3)',
    gridColor: 'rgba(57,255,20,0.015)',
    btnClass: 'bg-[#39ff14]/80 hover:bg-[#39ff14] text-black',
  },
  promoter: {
    name: 'Promoter',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
    hoverBorderClass: 'hover:border-yellow-500/50',
    bgClass: 'bg-yellow-950/40',
    bgBadge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]',
    pulseGlow: 'animate-pulse-glow-yellow',
    stripClass: 'from-yellow-600 via-yellow-500 to-yellow-900',
    accentColor: '#eab308',
    accentColorRgba: 'rgba(234,179,8,0.3)',
    gridColor: 'rgba(234,179,8,0.02)',
    btnClass: 'bg-yellow-500 hover:bg-yellow-400 text-black font-black',
  },
  label: {
    name: 'Record Label',
    textClass: 'text-orange-500',
    borderClass: 'border-orange-500/30',
    hoverBorderClass: 'hover:border-orange-500/50',
    bgClass: 'bg-orange-950/40',
    bgBadge: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    pulseGlow: 'animate-pulse-glow-orange',
    stripClass: 'from-orange-600 via-orange-500 to-orange-900',
    accentColor: '#f97316',
    accentColorRgba: 'rgba(249,115,22,0.3)',
    gridColor: 'rgba(249,115,22,0.02)',
    btnClass: 'bg-orange-600 hover:bg-orange-500 text-white',
  }
};

export interface DIYEventData {
  id?: string;
  title: string;
  category: string;
  date: string;
  time?: string;
  locationName: string;
  address?: string;
  isSecretLocation?: boolean;
  lineup?: string[];
  flyerUrl?: string;
  description?: string;
  cost?: string;
  rsvpsCount?: number;
  attendees?: string[];
}

export interface FeedItem {
  bookmarked?: boolean;
  is_boosted?: boolean;
  boost_expires_at?: string;
  boost_duration?: '24h' | '72h';
  effective_boost?: boolean;
  id: string;
  type?: 'post' | 'merch_drop' | 'ticket_sale' | 'poll' | 'tape_share' | 'event' | 'gear' | 'classifieds' | string;
  category?: string;
  classifiedData?: any;
  classified_data?: any;
  workspace_type?: string;
  workspaceType?: string;
  eventData?: DIYEventData;
  author: {
    id?: string;
    profile_id?: string;
    name: string;
    avatar: string;
    role: string;
    postedBy?: string;
    isYou?: boolean;
    workspace_type?: string;
    workspaceType?: string;
  };
  authorRole?: string;
  timeAgo?: string;
  timestamp?: string;
  created_at?: string;
  content: string;
  image?: string;
  youtubeId?: string;
  images?: string[];
  location?: string;
  tag?: string;
  genre?: string;
  gallery_folder?: string;
  reactions?: any;
  reactionsArray?: { type: string; count: number; active: boolean }[];
  user_reactions?: Record<string, boolean>;
  user_liked?: boolean;
  likes_count?: number;
  comments?: { 
    id: string; 
    author: string; 
    authorRole?: string;
    text: string; 
    timeAgo: string; 
    parent_comment_id?: string | null;
    likes?: number;
    myVote?: 'up' | 'down';
    replies?: { id: string; author: string; text: string; timeAgo: string; likes?: number; myVote?: 'up' | 'down'; }[];
  }[];
  topComment?: { author: string; text: string; };
  merchData?: {
    name: string;
    price: number;
    thumbnail: string;
    sizes: string[];
    isTimed?: boolean;
    durationHours?: number;
    expiresAt?: string;
    stock?: number;
    allowNegotiation?: boolean;
    condition?: string;
    category?: string;
  };
  isVipExclusive?: boolean;
  requiredTier?: string;
  vipDiscountPct?: number;
  ticketData?: {
    headliner?: string;
    venue: string;
    date: string;
    doorTime: string;
    priceRange: string;
    ticketUrl?: string;
    external_ticket_url?: string;
  };
  songData?: {
    band: string;
    title: string;
    album: string;
    duration: string;
    coverArt?: string;
  };
  albumData?: {
    band: string;
    albumName: string;
    releaseYear: string;
    coverUrl: string;
    tracks: { title: string; duration: string }[];
    purchaseLinks: { format: 'CD' | 'Vinyl' | 'Digital'; price: string; link?: string }[];
  };
  pollData?: {
    pollId?: string;
    question: string;
    variant?: 'standard' | 'encore_setlist' | 'promoter_lineup';
    options: { id: string; text: string; votes: number }[];
    totalVotes: number;
    userVotedId?: string;
    isTimed?: boolean;
    expiresAt?: string | null;
  };
  tapeData?: {
    title: string;
    band: string;
    date: string;
    duration: string;
    audioUrl?: string;
    audio_url?: string;
    audio?: string;
    coverUrl?: string;
  };
  tourData?: {
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
  };
}

// Static seed catalogs removed from client bundle (moved to server/seeds/seedCatalogsData.ts)
export const mockLiveTonight: any[] = [];

export const bandSetlists: Record<string, string[]> = {};

export const mockStories: any[] = [];

export const mockInAppSongs: any[] = [];

export const mockFeed: FeedItem[] = [];

export const ROSTER_CATALOGS: Record<string, any> = {};

export const RADIO_PLAYLISTS = {
  brutal: {
    name: 'Brutal Death',
    playlistId: 'PLchMzReuuu_8PieB87bPG3rTxWogLuoMB',
    tagline: 'Gutturals, blastbeats & heavy speed'
  },
  death: {
    name: 'Classic Death',
    playlistId: 'PLchMzReuuu_-fffjCRQpc5Mo50-QYzNMI',
    tagline: 'Classic buzzsaw riffs & Old School Death Metal'
  },
  tech: {
    name: 'Tech Death',
    playlistId: 'PLBWvM6w9IQeR1uy-3_eIf2g8fHFccXWzZ',
    tagline: 'Sweeps, hyper-complex scales & polymeters'
  },
  gore: {
    name: 'Goregrind',
    playlistId: 'PLchMzReuuu_9bhcmdqiiwZjzR4TL0Lt1r',
    tagline: 'Micro-songs, raw energy & pitch-shifters'
  },
  grind: {
    name: 'Grindcore',
    playlistId: 'PLchMzReuuu__jJpKhyYVGfavwrgHBdtK2',
    tagline: 'Savage speed, blastbeats & crust punk fusion'
  },
  blackdeath: {
    name: 'Blackened Death',
    playlistId: 'PLchMzReuuu_8av4RYcuW8rptIqmr0kSHS',
    tagline: 'Sinister melodies, blackened speed & heavy atmosphere'
  },
  black: {
    name: 'Black Metal',
    playlistId: 'PLchMzReuuu_8tMyh0UKsCasYz6BlbKGmW',
    tagline: 'Cold tremolos, raw screams & atmospheric blastbeats'
  },
  thrash: {
    name: 'Thrash Metal',
    playlistId: 'PLchMzReuuu_8X8-o1wN3VkESLti7TLAMV',
    tagline: 'Chugging bay area riffs, fast solos & speed'
  },
  lyric: {
    name: 'Lyric Videos',
    playlistId: 'PLchMzReuuu_8FppUXuwggPW9e86Jn6vFu',
    tagline: 'Official dynamic lyric playbacks & visuals'
  }
};

export const FRONTEND_FALLBACK_PLAYLISTS: Record<string, any[]> = {
  'PLchMzReuuu_8PieB87bPG3rTxWogLuoMB': [ // Brutal Death
    { videoId: '0g863f6H0lE', title: 'Inhumane Harvest', author: 'Cannibal Corpse', thumbnailUrl: 'https://img.youtube.com/vi/0g863f6H0lE/hqdefault.jpg' },
    { videoId: 'gPn6LpA8Z0A', title: 'Into Everlasting Fire', author: 'Immolation', thumbnailUrl: 'https://img.youtube.com/vi/gPn6LpA8Z0A/hqdefault.jpg' },
    { videoId: 'sFst6n2m6W8', title: 'Compulsion for Cruelty', author: 'Dying Fetus', thumbnailUrl: 'https://img.youtube.com/vi/sFst6n2m6W8/hqdefault.jpg' },
    { videoId: '6qG8NIn761w', title: 'Cognitive Evisceration', author: 'Devourment', thumbnailUrl: 'https://img.youtube.com/vi/6qG8NIn761w/hqdefault.jpg' }
  ],
  'PLchMzReuuu_-fffjCRQpc5Mo50-QYzNMI': [ // Classic Death
    { videoId: 'sE08V8U3oH0', title: 'Lack of Comprehension', author: 'Death', thumbnailUrl: 'https://img.youtube.com/vi/sE08V8U3oH0/hqdefault.jpg' },
    { videoId: '6X3ZOf3L61c', title: 'Charred Remains', author: 'Autopsy', thumbnailUrl: 'https://img.youtube.com/vi/6X3ZOf3L61c/hqdefault.jpg' },
    { videoId: '4qgN-6_K2w8', title: 'Slowly We Rot', author: 'Obituary', thumbnailUrl: 'https://img.youtube.com/vi/4qgN-6_K2w8/hqdefault.jpg' },
    { videoId: 'fB37S_o0Bxs', title: 'Left Hand Path', author: 'Entombed', thumbnailUrl: 'https://img.youtube.com/vi/fB37S_o0Bxs/hqdefault.jpg' }
  ],
  'PLBWvM6w9IQeR1uy-3_eIf2g8fHFccXWzZ': [ // Tech Death
    { videoId: 's7oZ4xV_f_k', title: 'Drone Corpse Aviator', author: 'Archspire', thumbnailUrl: 'https://img.youtube.com/vi/s7oZ4xV_f_k/hqdefault.jpg' },
    { videoId: 'e_K6_q_K80o', title: 'Stabwound', author: 'Necrophagist', thumbnailUrl: 'https://img.youtube.com/vi/e_K6_q_K80o/hqdefault.jpg' },
    { videoId: 'v8-S1pW_Fk8', title: 'Septuagint', author: 'Obscura', thumbnailUrl: 'https://img.youtube.com/vi/v8-S1pW_Fk8/hqdefault.jpg' },
    { videoId: 'tK8f7sP_m8E', title: 'Omnipresent Perception', author: 'Beyond Creation', thumbnailUrl: 'https://img.youtube.com/vi/tK8f7sP_m8E/hqdefault.jpg' }
  ],
  'PLchMzReuuu_9bhcmdqiiwZjzR4TL0Lt1r': [ // Goregrind
    { videoId: 'b7f0Y8k_p0U', title: 'Genital Grinder', author: 'Carcass', thumbnailUrl: 'https://img.youtube.com/vi/b7f0Y8k_p0U/hqdefault.jpg' },
    { videoId: '8p_FkS9F0l8', title: 'A Divine Proclamation of Degeneration', author: 'Last Days of Humanity', thumbnailUrl: 'https://img.youtube.com/vi/8p_FkS9F0l8/hqdefault.jpg' },
    { videoId: 't8f_Z8f_k8U', title: 'Bleeding Heap of Flesh', author: 'Regurgitate', thumbnailUrl: 'https://img.youtube.com/vi/t8f_Z8f_k8U/hqdefault.jpg' }
  ],
  'PLchMzReuuu__jJpKhyYVGfavwrgHBdtK2': [ // Grindcore
    { videoId: 'K7oZ7f_N7k0', title: 'You Suffer', author: 'Napalm Death', thumbnailUrl: 'https://img.youtube.com/vi/K7oZ7f_N7k0/hqdefault.jpg' },
    { videoId: '8t8P_Y7l0U8', title: 'Piss Angel', author: 'Pig Destroyer', thumbnailUrl: 'https://img.youtube.com/vi/8t8P_Y7l0U8/hqdefault.jpg' },
    { videoId: 't7P_Z7f_X80', title: 'Wrath', author: 'Nasum', thumbnailUrl: 'https://img.youtube.com/vi/t7P_Z7f_X80/hqdefault.jpg' },
    { videoId: 'v8FkP_Y7lE0', title: 'Dead Shall Rise', author: 'Terrorizer', thumbnailUrl: 'https://img.youtube.com/vi/v8FkP_Y7lE0/hqdefault.jpg' }
  ],
  'PLchMzReuuu_8av4RYcuW8rptIqmr0kSHS': [ // Blackened Death (38 tracks)
    { videoId: 'JCN8qkWVu1w', title: 'DARK FUNERAL - Let the Devil In (OFFICIAL VIDEO)', author: 'Dark Funeral', thumbnailUrl: 'https://img.youtube.com/vi/JCN8qkWVu1w/hqdefault.jpg' },
    { videoId: 'Xi70GHpdOSs', title: 'BELPHEGOR - Conjuring The Dead (OFFICIAL MUSIC VIDEO)', author: 'Belphegor', thumbnailUrl: 'https://img.youtube.com/vi/Xi70GHpdOSs/hqdefault.jpg' },
    { videoId: 'ZVWuutfWY8M', title: 'BELPHEGOR - "Virtus Asinaria - Prayer" [OFFICIAL MUSIC VIDEO]', author: 'Belphegor', thumbnailUrl: 'https://img.youtube.com/vi/ZVWuutfWY8M/hqdefault.jpg' },
    { videoId: '4mWiL8x3iNo', title: 'BELPHEGOR - Necrodaemon Terrorsathan 2020 (OFFICIAL MUSIC VIDEO)', author: 'Belphegor', thumbnailUrl: 'https://img.youtube.com/vi/4mWiL8x3iNo/hqdefault.jpg' },
    { videoId: 'klJcOWTNedA', title: 'DIMMU BORGIR - Ascent (OFFICIAL MUSIC VIDEO)', author: 'Dimmu Borgir', thumbnailUrl: 'https://img.youtube.com/vi/klJcOWTNedA/hqdefault.jpg' },
    { videoId: 'Qmk_PXtem4E', title: 'DARK FUNERAL - Unchain My Soul (OFFICIAL VIDEO)', author: 'Dark Funeral', thumbnailUrl: 'https://img.youtube.com/vi/Qmk_PXtem4E/hqdefault.jpg' },
    { videoId: 'TEVodXzNmPM', title: 'Dark Funeral - My Funeral (Uncut Version) HD', author: 'Dark Funeral', thumbnailUrl: 'https://img.youtube.com/vi/TEVodXzNmPM/hqdefault.jpg' },
    { videoId: 'R84svP3mTJo', title: 'BELPHEGOR - Scarlet Beast — Leviathan (Official Music Video)', author: 'Belphegor', thumbnailUrl: 'https://img.youtube.com/vi/R84svP3mTJo/hqdefault.jpg' },
    { videoId: 'fWrmIqRNFQw', title: 'BELPHEGOR - "The Devils" [OFFICIAL MUSIC VIDEO]', author: 'Belphegor', thumbnailUrl: 'https://img.youtube.com/vi/fWrmIqRNFQw/hqdefault.jpg' },
    { videoId: 'riOykB8uB_A', title: 'BELPHEGOR - Der Geistertreiber (OFFICIAL MUSIC VIDEO)', author: 'Belphegor', thumbnailUrl: 'https://img.youtube.com/vi/riOykB8uB_A/hqdefault.jpg' },
    { videoId: 'HKWqzjQAv14', title: 'Behemoth - Ecclesia Diabolica Catholica (Official Music Video)', author: 'Behemoth', thumbnailUrl: 'https://img.youtube.com/vi/HKWqzjQAv14/hqdefault.jpg' },
    { videoId: 'gxqC-uKp9Og', title: 'SATYRICON - The Pentagram Burns (OFFICIAL MUSIC VIDEO)', author: 'Satyricon', thumbnailUrl: 'https://img.youtube.com/vi/gxqC-uKp9Og/hqdefault.jpg' },
    { videoId: 'NiNTrKsQ8TU', title: 'DIMMU BORGIR - Progenies of The Great Apocalypse (OFFICIAL MUSIC VIDEO)', author: 'Dimmu Borgir', thumbnailUrl: 'https://img.youtube.com/vi/NiNTrKsQ8TU/hqdefault.jpg' },
    { videoId: 'TaBwktSm7zU', title: 'HATE - Iphigenia (Official Video)', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/TaBwktSm7zU/hqdefault.jpg' },
    { videoId: 'HUtHF8Mf6Cw', title: 'HATE - Bellum Regiis (Official)', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/HUtHF8Mf6Cw/hqdefault.jpg' },
    { videoId: 'VfM0PpXMAFA', title: 'Hate - Sovereign Sanctity (OFFICIAL VIDEO)', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/VfM0PpXMAFA/hqdefault.jpg' },
    { videoId: 'WNMFnW34F-0', title: 'HATE - Valley Of Darkness (Official Video) | Napalm Records', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/WNMFnW34F-0/hqdefault.jpg' },
    { videoId: '8-6VyYrMnlw', title: 'Hate - Threnody', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/8-6VyYrMnlw/hqdefault.jpg' },
    { videoId: 'LCjOzrrcIag', title: 'Hate - Exiles of Pantheon (OFFICIAL VIDEO)', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/LCjOzrrcIag/hqdefault.jpg' },
    { videoId: 'VvHPGPSbq5I', title: 'Hate - Resurgence (OFFICIAL VIDEO)', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/VvHPGPSbq5I/hqdefault.jpg' },
    { videoId: '4FgHzTFHUac', title: 'DIMMU BORGIR - The Serpentine Offering', author: 'Dimmu Borgir', thumbnailUrl: 'https://img.youtube.com/vi/4FgHzTFHUac/hqdefault.jpg' },
    { videoId: 'yCORFvKY6J0', title: 'BELPHEGOR - Sanctus Diaboli Confidimus (Official Music Video)', author: 'Belphegor', thumbnailUrl: 'https://img.youtube.com/vi/yCORFvKY6J0/hqdefault.jpg' },
    { videoId: '5ws18_MZ-lw', title: 'DIMMU BORGIR - Council Of Wolves And Snakes (OFFICIAL MUSIC VIDEO)', author: 'Dimmu Borgir', thumbnailUrl: 'https://img.youtube.com/vi/5ws18_MZ-lw/hqdefault.jpg' },
    { videoId: 'PHm0WenekQM', title: 'SKAPHOS (France) - Cult Of Uzura OFFICIAL VIDEO (Death/Black Metal)', author: 'Skaphos', thumbnailUrl: 'https://img.youtube.com/vi/PHm0WenekQM/hqdefault.jpg' },
    { videoId: '6FvSjRi6Wj8', title: 'Nordjevel - Of Rats and Men (Official Music Video)', author: 'Nordjevel', thumbnailUrl: 'https://img.youtube.com/vi/6FvSjRi6Wj8/hqdefault.jpg' },
    { videoId: 'kppI8ZZi4ng', title: 'SCOUR - Infusorium (OFFICIAL MUSIC VIDEO)', author: 'Scour', thumbnailUrl: 'https://img.youtube.com/vi/kppI8ZZi4ng/hqdefault.jpg' },
    { videoId: '7lPolbsFLsA', title: 'Panzerchrist - Sabbath Of The Rat (official video)', author: 'Panzerchrist', thumbnailUrl: 'https://img.youtube.com/vi/7lPolbsFLsA/hqdefault.jpg' },
    { videoId: 'Hfyeyy35hyk', title: "DARK FUNERAL - The Arrival of Satan's Empire (Live in Stockholm)", author: 'Dark Funeral', thumbnailUrl: 'https://img.youtube.com/vi/Hfyeyy35hyk/hqdefault.jpg' },
    { videoId: 'Il2hztYEEV4', title: 'BEHEMOTH - As Above So Below (Official Music Video)', author: 'Behemoth', thumbnailUrl: 'https://img.youtube.com/vi/Il2hztYEEV4/hqdefault.jpg' },
    { videoId: '38j-i8jH7xk', title: 'BEHEMOTH - Conquer All (Official Music Video)', author: 'Behemoth', thumbnailUrl: 'https://img.youtube.com/vi/38j-i8jH7xk/hqdefault.jpg' },
    { videoId: 'cPcnp-bg_JI', title: 'HATE - Alchemy of Blood | Napalm Records', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/cPcnp-bg_JI/hqdefault.jpg' },
    { videoId: 'VSKhPqvb0jw', title: 'HATE - Threnody (Official Video)', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/VSKhPqvb0jw/hqdefault.jpg' },
    { videoId: 'eAmMcBQavKE', title: 'DIMMU BORGIR - The Serpentine Offering (OFFICIAL MUSIC VIDEO)', author: 'Dimmu Borgir', thumbnailUrl: 'https://img.youtube.com/vi/eAmMcBQavKE/hqdefault.jpg' },
    { videoId: 'g-UgVowTXmQ', title: 'PHAZM - Howling for You (OFFICIAL VIDEO)', author: 'Phazm', thumbnailUrl: 'https://img.youtube.com/vi/g-UgVowTXmQ/hqdefault.jpg' },
    { videoId: '-gt7YWwOmRo', title: 'DIMMU BORGIR - Sorgens Kammer - Del II (OFFICIAL MUSIC VIDEO)', author: 'Dimmu Borgir', thumbnailUrl: 'https://img.youtube.com/vi/-gt7YWwOmRo/hqdefault.jpg' },
    { videoId: 'GF3wagWwHjM', title: 'DIMMU BORGIR - The Chosen Legacy (OFFICIAL MUSIC VIDEO)', author: 'Dimmu Borgir', thumbnailUrl: 'https://img.youtube.com/vi/GF3wagWwHjM/hqdefault.jpg' },
    { videoId: 'zzz0YVEgT5U', title: 'BEHEMOTH - "At The Left Hand Ov God" (Official Music Video)', author: 'Behemoth', thumbnailUrl: 'https://img.youtube.com/vi/zzz0YVEgT5U/hqdefault.jpg' },
    { videoId: '-dzARsas29o', title: 'BEHEMOTH - Decade Ov Therion (Official Music Video)', author: 'Behemoth', thumbnailUrl: 'https://img.youtube.com/vi/-dzARsas29o/hqdefault.jpg' }
  ],
  'PLchMzReuuu_8tMyh0UKsCasYz6BlbKGmW': [ // Black Metal
    { videoId: '8f_P_Y7l0U8', title: 'Freezing Moon', author: 'Mayhem', thumbnailUrl: 'https://img.youtube.com/vi/8f_P_Y7l0U8/hqdefault.jpg' },
    { videoId: 'f7_P_Z7l_E0', title: 'Transilvanian Hunger', author: 'Darkthrone', thumbnailUrl: 'https://img.youtube.com/vi/f7_P_Z7l_E0/hqdefault.jpg' },
    { videoId: 'v7_P_Y7l_k8', title: 'I Am the Black Wizards', author: 'Emperor', thumbnailUrl: 'https://img.youtube.com/vi/v7_P_Y7l_k8/hqdefault.jpg' }
  ],
  'PLchMzReuuu_8X8-o1wN3VkESLti7TLAMV': [ // Thrash Metal
    { videoId: '8f_P_Y7l0U9', title: 'Raining Blood', author: 'Slayer', thumbnailUrl: 'https://img.youtube.com/vi/8f_P_Y7l0U9/hqdefault.jpg' },
    { videoId: 'f7_P_Z7l_E9', title: 'Master of Puppets', author: 'Metallica', thumbnailUrl: 'https://img.youtube.com/vi/f7_P_Z7l_E9/hqdefault.jpg' },
    { videoId: 'v7_P_Y7l_k9', title: 'Holy Wars... The Punishment Due', author: 'Megadeth', thumbnailUrl: 'https://img.youtube.com/vi/v7_P_Y7l_k9/hqdefault.jpg' }
  ],
  'PLchMzReuuu_8FppUXuwggPW9e86Jn6vFu': [ // Lyric Videos
    { videoId: 's7oZ4xV_f_k', title: 'Drone Corpse Aviator (Lyric Video)', author: 'Archspire', thumbnailUrl: 'https://img.youtube.com/vi/s7oZ4xV_f_k/hqdefault.jpg' },
    { videoId: '0g863f6H0lE', title: 'Inhumane Harvest (Lyric Video)', author: 'Cannibal Corpse', thumbnailUrl: 'https://img.youtube.com/vi/0g863f6H0lE/hqdefault.jpg' }
  ]
};
