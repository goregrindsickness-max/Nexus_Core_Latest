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
  type?: 'post' | 'merch_drop' | 'ticket_sale' | 'poll' | 'tape_share' | 'event';
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

export const mockLiveTonight = [
  { id: '1', venue: 'The Underground', headliner: 'AUTOPSY', date: 'Tonight', time: 'Doors 8:00 PM', city: 'Los Angeles, CA', distance: '3.2 mi', price: '$35.00' },
  { id: '2', venue: 'Nexus Hub', headliner: 'INCANTATION', date: 'Tonight', time: 'Set 9:30 PM', city: 'Long Beach, CA', distance: '8.4 mi', price: '$30.00' },
  { id: '3', venue: 'Warehouse 4', headliner: 'CRYPTOPSY', date: 'Tomorrow', time: 'Doors 7:00 PM', city: 'Anaheim, CA', distance: '14.1 mi', price: '$28.00' },
  { id: '4', venue: 'Masonic Temple', headliner: 'DEATH ANGEL', date: 'Fri, Oct 24', time: 'Doors 6:30 PM', city: 'San Francisco, CA', distance: '22 mi', price: '$45.00' },
  { id: '5', venue: 'The Pit Stage', headliner: 'SKINLESS', date: 'Sat, Oct 25', time: 'Set 10:00 PM', city: 'San Diego, CA', distance: '45 mi', price: '$25.00' },
  { id: '6', venue: 'Cathedral of Doom', headliner: 'DARK FUNERAL', date: 'Sun, Oct 26', time: 'Doors 8:30 PM', city: 'Phoenix, AZ', distance: '120 mi', price: '$32.00' },
  { id: '7', venue: 'Vortex Room', headliner: 'HYPOCRISY', date: 'Tue, Oct 28', time: 'Set 11:00 PM', city: 'Las Vegas, NV', distance: '180 mi', price: '$30.00' },
  { id: '8', venue: 'Monarch Theatre', headliner: 'IMMOLATION', date: 'Fri, Oct 31', time: 'Doors 7:30 PM', city: 'Seattle, WA', distance: '240 mi', price: '$35.00' },
];

export const bandSetlists: Record<string, string[]> = {
  'AUTOPSY': [
    'Severed Survival',
    'Charred Remains',
    'Service for a Vacant Coffin',
    'Ridden with Disease',
    'Disembowel',
    'Pagan Saviour',
    'Gasping for Air'
  ],
  'INCANTATION': [
    'Entrantment of Evil',
    'Golgotha',
    'Devoured Death',
    'Unholy Massacre',
    'Deliverance of Horrific Prophecies',
    'Rotting Spiritual Embodiment',
    'Profanation'
  ],
  'CRYPTOPSY': [
    'Crown of Horns',
    'Slit Your Guts',
    'Graves of the Fathers',
    'Dead and Dripping',
    'Benedictine Convulsions',
    'Phobophile',
    'Lichmistress',
    'Orgiastic Disembowelment'
  ],
  'DEATH ANGEL': [
    'The Ultra-Violence',
    'Evil Priest',
    'Voracious Souls',
    'Mistress of Pain',
    'Kill as One',
    'Seemingly Endless Time',
    'Thrown to the Wolves'
  ],
  'SKINLESS': [
    'Foreshadowing Our Demise',
    'Smothered',
    'The Optimist',
    'Crispy Kids',
    'Tampon Lollipops',
    'Tug of War Intestines'
  ],
  'DARK FUNERAL': [
    'Unchain My Soul',
    'The Secrets of the Black Arts',
    'Where Shadows Forever Reign',
    'Nail Them to the Cross',
    'My Funeral',
    'Vobiscum Satanas'
  ],
  'HYPOCRISY': [
    'Roswell 47',
    'Fractured Millennium',
    'Eraser',
    'Adjusting the Sun',
    'Fire in the Sky',
    'Chemical Whore'
  ],
  'IMMOLATION': [
    'Into Everlasting Fire',
    'Immolation',
    'Father, You’re a Murderer',
    'Harnessing Ruin',
    'Destructive Currents',
    'No Covenant'
  ]
};

export const mockStories = [
  {
    id: 's1',
    name: 'AUTOPSY',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600',
    border: 'border-rose-500/80',
    textColor: 'text-rose-400',
    caption: 'New live tapes recorded straight from the soundboard!',
    stickers: [
      {
        id: 'bc_sticker_autopsy',
        type: 'bandcamp',
        trackTitle: 'Severed Survival',
        artistName: 'AUTOPSY',
        coverArtUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/metal_scraping.ogg',
        bandcampUrl: 'https://peaceville.bandcamp.com/album/severed-survival',
        variant: 'merch_badge',
        scale: 1.0,
        x: 50,
        y: 40
      }
    ]
  },
  {
    id: 's2',
    name: 'Nexus Promoters',
    avatar: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=150',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=600',
    border: 'border-purple-500',
    textColor: 'text-purple-400',
    stickers: [
      {
        id: 'bc_sticker_vinyl',
        type: 'bandcamp',
        trackTitle: 'Babykiller (Live)',
        artistName: 'DEVOURMENT',
        coverArtUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://actions.google.com/sounds/v1/foley/heavy_door_slam.ogg',
        bandcampUrl: 'https://devourment.bandcamp.com',
        variant: 'vinyl_sleeve',
        scale: 1.0,
        x: 50,
        y: 42
      }
    ]
  },
  { id: 's3', name: 'CRYPTOPSY', avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=150', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=600', border: 'border-rose-500/80', textColor: 'text-rose-400' },
  { id: 's4', name: 'INCANTATION', avatar: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=150', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600', border: 'border-rose-500/80', textColor: 'text-rose-400' },
  { id: 's5', name: 'SKINLESS', avatar: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=150', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=600', border: 'border-rose-500/80', textColor: 'text-rose-400' },
  { id: 's6', name: 'DEATH ANGEL', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=150', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600', border: 'border-rose-500/80', textColor: 'text-rose-400' },
  { id: 's7', name: 'DARK FUNERAL', avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=150', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600', border: 'border-purple-500', textColor: 'text-purple-400' },
  { id: 's8', name: 'HYPOCRISY', avatar: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=150', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600', border: 'border-rose-500/80', textColor: 'text-rose-400' },
  { id: 's9', name: 'IMMOLATION', avatar: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=150', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=600', border: 'border-rose-500/80', textColor: 'text-rose-400' },
];

export const mockInAppSongs = [
  { id: 'song1', band: 'AUTOPSY', title: 'Severed Survival', album: 'Severed Survival', duration: '3:28' },
  { id: 'song2', band: 'INCANTATION', title: 'Golgotha', album: 'Onward to Golgotha', duration: '3:29' },
  { id: 'song3', band: 'CRYPTOPSY', title: 'Phobophile', album: 'None So Vile', duration: '4:38' },
  { id: 'song4', band: 'CRYPTOPSY', title: 'Slit Your Guts', album: 'None So Vile', duration: '4:02' },
  { id: 'song5', band: 'DEVOURMENT', title: 'Babykiller', album: 'Molesting the Decapitated', duration: '4:49' },
  { id: 'song6', band: 'MORTICIAN', title: 'Chainsaw Dismemberment', album: 'Chainsaw Dismemberment', duration: '2:30' },
  { id: 'song7', band: 'SKINLESS', title: 'The Optimist', album: 'Foreshadowing Our Demise', duration: '3:43' },
  { id: 'song8', band: 'DEATH ANGEL', title: 'The Ultra-Violence', album: 'The Ultra-Violence', duration: '10:33' },
  { id: 'song9', band: 'DARK FUNERAL', title: 'Where Shadows Forever Reign', album: 'Where Shadows Forever Reign', duration: '5:12' },
  { id: 'song10', band: 'HYPOCRISY', title: 'Roswell 47', album: 'Abducted', duration: '3:50' },
  { id: 'song11', band: 'IMMOLATION', title: 'Into Everlasting Fire', album: 'Dawn of Possession', duration: '5:14' },
];

export const mockFeed: FeedItem[] = [
  {
    id: 'mock_1',
    type: 'post',
    author: { name: 'GoregrindSlayer (Tyler Slamson)', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150', role: 'FAN' },
    timeAgo: '40m ago',
    timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
    content: "Just discovered this absolute slam beast of a track from Analepsy's new record. The grooves are absolutely massive!",
    tag: 'SONG SHARE',
    songData: { band: 'ANALEPSY', title: 'Locus of Dawning', album: 'Quiescence', duration: '3:45', coverArt: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Analepsy%20-%20Quinscence.jpg' },
    reactions: [{ type: 'flame', count: 18, active: false }],
    comments: [
      { id: 'c1', author: 'SlamLover', text: 'That breakdown at 1:45 is pure ignorance.', timeAgo: '35m ago' },
      { id: 'c1_r1', parent_comment_id: 'c1', author: 'PitFiend_TX', text: 'Saw them play this live in Dallas, the entire floor collapsed during that section!', timeAgo: '25m ago' },
      { id: 'c1_r2', parent_comment_id: 'c1', author: 'SlamLover', text: '@PitFiend_TX Texas crowds never disappoint! Can\'t wait for the full LP drop.', timeAgo: '15m ago' },
      { id: 'c1_2', author: 'RiffScraper', text: 'Slam guitar tone on this record is absurdly thick. What tuning are they in?', timeAgo: '20m ago' },
      { id: 'c1_2_r1', parent_comment_id: 'c1_2', author: 'GoreChugger', text: 'Drop A on 7-strings running through a boosted Peavey 6505+!', timeAgo: '10m ago' }
    ]
  },
  {
    id: 'mock_2',
    type: 'post',
    author: { name: 'AUTOPSY', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150', role: 'ARTIST' },
    timeAgo: '1h ago',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    content: "Our monumental release \"Severed Survival\" is now streaming and available in multiple physical formats directly on our page! Grab the official CD, limited clear red vinyl, or digital high-quality download below.",
    tag: 'ALBUM RELEASE',
    albumData: {
      band: 'AUTOPSY',
      albumName: 'Severed Survival',
      releaseYear: '1989',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400',
      tracks: [
        { title: 'Charred Remains', duration: '03:40' },
        { title: 'Service for a Vacant Coffin', duration: '02:51' },
        { title: 'Disembowel', duration: '04:05' },
        { title: 'Gasping for Air', duration: '03:20' },
        { title: 'Ridden with Disease', duration: '04:53' },
        { title: 'Severed Survival', duration: '03:28' }
      ],
      purchaseLinks: [
        { format: 'CD', price: '$12.99' },
        { format: 'Vinyl', price: '$24.99' },
        { format: 'Digital', price: '$8.99' }
      ]
    },
    reactions: [{ type: 'hype', count: 457, active: true }],
    comments: [
      { id: 'c2', author: 'OldSchoolGore', text: 'The blueprint for filthy death metal. Absolute masterclass.', timeAgo: '50m ago' },
      { id: 'c2_r1', parent_comment_id: 'c2', author: 'AutopsyManiac', text: 'Chris Reifert created an entire subgenre with those doom-laden transitions.', timeAgo: '35m ago' },
      { id: 'c2_r2', parent_comment_id: 'c2', author: 'BlastMaster_99', text: 'Still have my original Peaceville cassette tape copy from 1989!', timeAgo: '20m ago' },
      { id: 'c2_2', author: 'VinylStash', text: 'Just copped the clear red wax! When are these shipping out?', timeAgo: '30m ago' },
      { id: 'c2_2_r1', parent_comment_id: 'c2_2', author: 'AUTOPSY', text: 'All vinyl orders ship on Monday via tracked courier! Appreciate the heavy support! 🤘', timeAgo: '15m ago' }
    ]
  },
  {
    id: 'mock_3',
    type: 'poll',
    author: { name: 'Blastfiend999 (Zachary Blaster)', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', role: 'FAN' },
    timeAgo: '15m ago',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    content: "The definitive question for all BDM sickos out there. Which of these newer and classic titans is currently crushing your stereos the hardest?",
    tag: 'SLAM DISCUSSION',
    pollData: {
      question: 'WHAT IS YOUR CURRENT TOP BDM BAND',
      variant: 'standard',
      options: [
        { id: 'opt1', text: 'Stabbing', votes: 120 },
        { id: 'opt2', text: 'Putridity', votes: 85 },
        { id: 'opt3', text: 'Emasculator', votes: 95 },
        { id: 'opt4', text: 'Gorgasm', votes: 110 },
        { id: 'opt5', text: 'Devourment', votes: 127 }
      ],
      totalVotes: 537
    },
    reactions: [{ type: 'flame', count: 42, active: false }],
    comments: [
      { id: 'c3', author: 'RiffMaster', text: 'Putridity is the only correct answer. Mental state: complete caveman.', timeAgo: '10m ago' },
      { id: 'c3_r1', parent_comment_id: 'c3', author: 'SlamGoblin', text: 'Emasculator is giving Putridity a run for their money though, that new promo is filthy.', timeAgo: '8m ago' },
      { id: 'c3_2', author: 'DevourmentFanatic', text: 'Voted Stabbing! Bridget\'s vocals live are absolutely terrifying.', timeAgo: '5m ago' },
      { id: 'c3_2_r1', parent_comment_id: 'c3_2', author: 'Blastfiend999', text: 'Stabbing is taking a huge surge in the poll right now! 120 votes so far.', timeAgo: '2m ago' }
    ]
  },
  {
    id: 'mock_4',
    type: 'post',
    author: { name: 'CRYPTOPSY', avatar: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=150', role: 'ARTIST' },
    timeAgo: '30m ago',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    content: "🇪🇺 EUROPEAN TOUR ANNOUNCEMENT 2026: Canadian death metal pioneers CRYPTOPSY return to lay waste to Europe on the \"All-So-Vile\" European Tour! Special guests on this tour are Inferi, 200 Stabwounds and Corpsepile. All tour dates listed below are fully integrated with our central ticket management system grab yours directly below!",
    tag: 'TOUR ANNOUNCEMENT',
    tourData: {
      tourName: 'ALL-SO-VILE EUROPEAN TOUR 2026',
      dates: [
        { date: '15.01', city: 'Hannover, DE', venue: 'Bei Chéz Heinz', ticketStatus: 'available' },
        { date: '16.01', city: 'Dortmund, DE', venue: 'Junkyard', ticketStatus: 'available' },
        { date: '17.01', city: 'Antwerp, BE', venue: 'Zappa', ticketStatus: 'available' },
        { date: '18.01', city: 'Southampton, UK', venue: 'Engine Rooms', ticketStatus: 'soon' },
        { date: '19.01', city: 'Bristol, UK', venue: 'The Fleece', ticketStatus: 'sold_out' },
        { date: '20.01', city: 'Glasgow, UK', venue: 'Slay', ticketStatus: 'available' },
      ]
    },
    reactions: [{ type: 'hype', count: 282, active: true }],
    comments: [
      { id: 'c4', author: 'SlamCorp', text: 'Oh my god. London Underworld is going to get absolutely demolished by Slit Your Guts.', timeAgo: '20m ago' },
      { id: 'c4_r1', parent_comment_id: 'c4', author: 'UK_DeathMetal', text: 'Bristol Fleece is already sold out! Glad I grabbed mine early.', timeAgo: '12m ago' },
      { id: 'c4_2', author: 'TechDeathKid', text: '200 Stabwounds + Corpsepile as support is a dream tour stack!', timeAgo: '15m ago' },
      { id: 'c4_2_r1', parent_comment_id: 'c4_2', author: 'CRYPTOPSY', text: 'See you in the pit Europe! 🔥', timeAgo: '5m ago' }
    ]
  },
  {
    id: 'mock_5',
    type: 'tape_share',
    author: { name: 'TapeTrader99 (Marcus Cassette)', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', role: 'FAN' },
    timeAgo: '35m ago',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    content: "Uploaded my raw soundboard rip from the Detroit '89 basement show. It's gritty but the bass cuts through perfectly.",
    tag: 'LIVE BOOTLEG',
    tapeData: { title: 'DETROIT 1989', band: 'IMMOLATION', duration: '42:15', date: 'OCT 14, 1989' },
    reactions: [{ type: 'flame', count: 88, active: false }],
    comments: [
      { id: 'c5_1', author: 'CassetteCollector', text: 'This soundboard recording is amazingly clear for an 89 bootleg! The riffs sound razor sharp.', timeAgo: '20m ago' },
      { id: 'c5_1_r1', parent_comment_id: 'c5_1', author: 'TapeTrader99', text: 'Direct line-out straight into a Sony Walkman Pro D6C cassette deck! Glad you dig it.', timeAgo: '10m ago' },
      { id: 'c5_2', author: 'DeathMetalFan', text: 'Do you have the 1988 rehearsal session tape as well?', timeAgo: '15m ago' },
      { id: 'c5_2_r1', parent_comment_id: 'c5_2', author: 'TapeTrader99', text: 'Working on digitizing that reel next week! Keep an eye on my timeline.', timeAgo: '4m ago' }
    ]
  },
  {
    id: 'mock_6',
    type: 'post',
    author: { name: 'Scene Photographer (Dustin Shutter)', avatar: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=150', role: 'CREATIVE' },
    authorRole: 'CREATIVE',
    timeAgo: '1h ago',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    content: "Some incredible energy from the pit last night. Absolute chaos on the floor during the final encore.",
    tag: 'SCENE REPORT',
    reactions: [{ type: 'flame', count: 89, active: false }],
    comments: [
      { id: 'c6_1', author: 'ShutterBug_Live', text: 'The energy during that breakdown was unreal!', timeAgo: '45m ago' },
      { id: 'c6_1_r1', parent_comment_id: 'c6_1', author: 'Scene Photographer', authorRole: 'CREATIVE', text: 'Crowd was moving non-stop right from the opening chord.', timeAgo: '30m ago' },
      { id: 'c6_2', author: 'StageDiver_99', text: 'Stage diving was continuous for the entire hour set haha!', timeAgo: '20m ago' }
    ]
  },
  {
    id: 'mock_video_1',
    type: 'post',
    author: { name: 'SlamNation (Derek Riff)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', role: 'FAN' },
    timeAgo: '2h ago',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    content: "Check out this insane live performance! Pure aggression and uncompromising pit energy. Hit play below to watch!",
    tag: 'GIG REVIEW',
    youtubeId: 'SJJZLhe7b08',
    reactions: [{ type: 'flame', count: 184, active: true }],
    comments: [
      { id: 'cv1', author: 'SlamGod', text: 'This set was absolutely legendary!', timeAgo: '1h ago' },
      { id: 'cv1_r1', parent_comment_id: 'cv1', author: 'SlamNation', text: 'Sound engineer dialed in the snare pitch perfectly for this gig!', timeAgo: '40m ago' },
      { id: 'cv2', author: 'CirclePitKing', text: 'Was in that pit! Security gave up 2 minutes into the first song.', timeAgo: '30m ago' }
    ]
  },
  {
    id: 'mock_7',
    type: 'post',
    author: { name: 'Nexus Promoters', avatar: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=150', role: 'PROMOTER' },
    timeAgo: '5h ago',
    timestamp: new Date(Date.now() - 300 * 60000).toISOString(),
    content: "JUST ANNOUNCED: Devourment \"Pious Impiety\" album release show. Limited capacity event, this will sell out fast.",
    tag: 'BAND DISCOVERY',
    ticketData: { headliner: 'Devourment', venue: 'Nexus Hub Main Room', date: 'OCT 24, 2026', doorTime: '8:00 PM', priceRange: '$25 - $45' },
    reactions: [{ type: 'flame', count: 89, active: false }],
    comments: [
      { id: 'c7_1', author: 'RiffMaster', text: 'Got my tickets! See you in the void.', timeAgo: '4h ago' },
      { id: 'c7_1_r1', parent_comment_id: 'c7_1', author: 'Nexus Promoters', text: 'Confirmation sent to your digital ticket stash! Doors open at 8:00 PM sharp.', timeAgo: '3h ago' },
      { id: 'c7_2', author: 'TexasGore', text: 'Devourment in an intimate venue is going to be pure carnage!', timeAgo: '2h ago' }
    ]
  },
  {
    id: 'mock_8',
    type: 'merch_drop',
    author: { name: 'ORIGIN', avatar: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=150', role: 'ARTIST' },
    timeAgo: '1d ago',
    timestamp: new Date(Date.now() - 1440 * 60000).toISOString(),
    content: "New ORIGIN \"Hail Space 2.0\" official T-Shirts just hit the store. High quality premium print on heavyweight cotton. Grab yours before they sell out!",
    tag: 'MERCH HAUL',
    merchData: { 
      name: 'ORIGIN - Hail Space 2.0 T-Shirt', 
      price: 35, 
      thumbnail: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Origin%20Destroyer%20T-Shirt%20copy.jpg', 
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      isTimed: true,
      durationHours: 24,
      expiresAt: new Date(Date.now() + 18 * 3600000).toISOString(),
      stock: 14,
      allowNegotiation: true,
      condition: 'Brand New / Heavyweight Print',
      category: 'OFFICIAL MERCH DROP'
    },
    reactions: [{ type: 'flame', count: 215, active: false }],
    comments: [
      { id: 'c8_1', author: 'DoomGuy', text: 'Just copped the XXL. Sick design.', timeAgo: '20h ago' },
      { id: 'c8_1_r1', parent_comment_id: 'c8_1', author: 'ORIGIN', text: 'Hell yeah! Shipping out tomorrow morning!', timeAgo: '18h ago' },
      { id: 'c8_2', author: 'BlastSpeed', text: 'Any chance for a zip hoodie version of this design?', timeAgo: '15h ago' },
      { id: 'c8_2_r1', parent_comment_id: 'c8_2', author: 'ORIGIN', text: 'Hoodies dropping next month for the fall circuit!', timeAgo: '10h ago' }
    ]
  },
  {
    id: 'mock_vip_drop_1',
    type: 'merch_drop',
    author: { name: 'DYING FETUS', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150', role: 'ARTIST' },
    timeAgo: '2h ago',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    content: "Ultra-limited 'Destroy the Opposition' Marble Test Pressing Vinyl + Signed Screenprinted Poster. Only 50 pressed worldwide!",
    tag: 'OFFICIAL MERCH DROP',
    isVipExclusive: true,
    requiredTier: 'DIE-HARD VIP CLUB',
    vipDiscountPct: 20,
    merchData: {
      name: 'Dying Fetus - Destroy the Opposition Test Pressing Vinyl Box',
      price: 85,
      thumbnail: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Destroy%20the%20Opps.webp',
      sizes: ['Deluxe Vinyl Box', 'Numbered Collector Edition'],
      stock: 6,
      allowNegotiation: true,
      condition: 'Mint 180g Marble Vinyl + Autographed Poster',
      category: 'EXCLUSIVE VINYL DROP'
    },
    reactions: [{ type: 'flame', count: 342, active: true }, { type: 'horns', count: 180, active: true }],
    comments: [
      { id: 'cvip_1', author: 'MetalCollector', text: 'Test pressing secured! VIP membership was worth every penny.', timeAgo: '1h ago' }
    ]
  },
  {
    id: 'mock_gear_drop_1',
    type: 'merch_drop',
    author: { name: 'MORTICIAN', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150', role: 'ARTIST' },
    timeAgo: '4h ago',
    timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
    content: "Stage-used Boss HM-2 Heavy Metal Distortion Pedal used on the 'Hacked Up For BBQ' 1996 European Tour! Full custom chainsaw mod, signed by Will Rahmer.",
    tag: 'STAGE GEAR MARKETPLACE',
    merchData: {
      name: 'Vintage Boss HM-2 Chainsaw Mod Pedal (Tour Used)',
      price: 240,
      thumbnail: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/HM-2%20Pedal.jpg',
      sizes: ['Pedal + Signed Certificate of Authenticity'],
      stock: 1,
      allowNegotiation: true,
      condition: 'Tour Tested & Fully Functional / Custom Modded',
      category: 'RARE STAGE GEAR'
    },
    reactions: [{ type: 'brutal', count: 412, active: true }],
    comments: [
      { id: 'cgear_1', author: 'PedalCollector', text: 'Sent an offer! Hope to get this piece of death metal history.', timeAgo: '3h ago' }
    ]
  }
];

export const ROSTER_CATALOGS: Record<string, any> = {
  Devourment: {
    albumName: "Obscene Majesty",
    releaseYear: "2019",
    coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200",
    tracks: [
      { id: "lbl_t1_1", title: "A Virulent Depravity", duration: "4:02" },
      { id: "lbl_t1_2", title: "Dysmorphic Casuistry", duration: "3:55" },
      { id: "lbl_t1_3", title: "Cognitive Sedation Pile", duration: "5:10" },
      { id: "lbl_t1_4", title: "Arterial Spray Obstancy", duration: "4:30" },
      { id: "lbl_t1_5", title: "Profane Contagion", duration: "3:45" },
      { id: "lbl_t1_6", title: "Xenomorphic Disfigurement", duration: "4:12" },
      { id: "lbl_t1_7", title: "Sculpted in Gore", duration: "3:50" }
    ],
    purchaseLinks: [
      { format: "Vinyl", price: "$29.99" },
      { format: "CD", price: "$14.99" },
      { format: "Digital", price: "$9.99" }
    ]
  },
  Cephalotripsy: {
    albumName: "Excruciating Unpleasantness",
    releaseYear: "2018",
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=200",
    tracks: [
      { id: "lbl_t3_1", title: "Consummating the Necrophilial Urge", duration: "4:10" },
      { id: "lbl_t3_2", title: "Excruciating Unpleasantness", duration: "3:30" },
      { id: "lbl_t3_3", title: "Intrauterine Vivisection", duration: "3:55" },
      { id: "lbl_t3_4", title: "Ulcerated Mass of Despair", duration: "3:45" },
      { id: "lbl_t3_5", title: "Uterine Defecation", duration: "4:02" }
    ],
    purchaseLinks: [
      { format: "Vinyl", price: "$31.99" },
      { format: "CD", price: "$15.99" },
      { format: "Digital", price: "$9.99" }
    ]
  },
  Pathology: {
    albumName: "The Ritual of Decay",
    releaseYear: "2021",
    coverUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=200",
    tracks: [
      { id: "lbl_t8_1", title: "The Ritual of Decay", duration: "3:10" },
      { id: "lbl_t8_2", title: "Surgical Devastation", duration: "2:45" },
      { id: "lbl_t8_3", title: "Anatomical Decomposition", duration: "3:20" },
      { id: "lbl_t8_4", title: "Post-Mortem Vivisection", duration: "2:55" },
      { id: "lbl_t8_5", title: "Dissecting the Living", duration: "3:15" }
    ],
    purchaseLinks: [
      { format: "Vinyl", price: "$29.99" },
      { format: "CD", price: "$12.99" },
      { format: "Digital", price: "$8.99" }
    ]
  },
  Origin: {
    albumName: "Chaosmos",
    releaseYear: "2022",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200",
    tracks: [
      { id: "lbl_t9_1", title: "Ecstasy in Decay", duration: "4:05" },
      { id: "lbl_t9_2", title: "Chaosmos", duration: "3:30" },
      { id: "lbl_t9_3", title: "Spiraling Into the Abyss", duration: "4:15" },
      { id: "lbl_t9_4", title: "Cognitive Dissonance", duration: "3:55" },
      { id: "lbl_t9_5", title: "Void of No Return", duration: "4:20" }
    ],
    purchaseLinks: [
      { format: "Vinyl", price: "$34.99" },
      { format: "CD", price: "$14.99" },
      { format: "Digital", price: "$9.99" }
    ]
  },
  Malignancy: {
    albumName: "Intrauterine Cannibalism",
    releaseYear: "2023",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200",
    tracks: [
      { id: "lbl_t10_1", title: "Ignorance of Conformity", duration: "2:50" },
      { id: "lbl_t10_2", title: "Intrauterine Cannibalism", duration: "3:15" },
      { id: "lbl_t10_3", title: "Profanation of the Host", duration: "3:40" },
      { id: "lbl_t10_4", title: "Fried Afterbirth", duration: "2:55" },
      { id: "lbl_t10_5", title: "Cerebral Schism", duration: "3:10" }
    ],
    purchaseLinks: [
      { format: "Vinyl", price: "$28.99" },
      { format: "CD", price: "$13.99" },
      { format: "Digital", price: "$8.99" }
    ]
  },
  Incinerate: {
    albumName: "Searing Devastation",
    releaseYear: "2020",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=200",
    tracks: [
      { id: "lbl_t11_1", title: "Searing Devastation", duration: "3:22" },
      { id: "lbl_t11_2", title: "Reduced to Ashes", duration: "3:45" },
      { id: "lbl_t11_3", title: "Anatomical Incineration", duration: "3:10" },
      { id: "lbl_t11_4", fill: "Pyromaniac Rage", title: "Pyromaniac Rage", duration: "3:05" },
      { id: "lbl_t11_5", title: "The Scorched Earth", duration: "3:30" }
    ],
    purchaseLinks: [
      { format: "Vinyl", price: "$27.99" },
      { format: "CD", price: "$12.99" },
      { format: "Digital", price: "$8.99" }
    ]
  },
  Stabbing: {
    albumName: "Extirpated Inimicality",
    releaseYear: "2022",
    coverUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=200",
    tracks: [
      { id: "lbl_t12_1", title: "Invidious Mutation", duration: "3:15" },
      { id: "lbl_t12_2", title: "Extirpated Inimicality", duration: "3:35" },
      { id: "lbl_t12_3", title: "Visceral Decomposition", duration: "3:02" },
      { id: "lbl_t12_4", title: "Severed Limb Feast", duration: "2:50" },
      { id: "lbl_t12_5", title: "Splattered Guts", duration: "3:12" }
    ],
    purchaseLinks: [
      { format: "Vinyl", price: "$30.99" },
      { format: "CD", price: "$14.99" },
      { format: "Digital", price: "$9.99" }
    ]
  }
};

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
  'PLchMzReuuu_8av4RYcuW8rptIqmr0kSHS': [ // Blackened Death
    { videoId: '8f7kP_Y7l0U', title: 'Blow Your Trumpets Gabriel', author: 'Behemoth', thumbnailUrl: 'https://img.youtube.com/vi/8f7kP_Y7l0U/hqdefault.jpg' },
    { videoId: 'f7kP_Z7l_E0', title: 'Virtus Asinaria', author: 'Belphegor', thumbnailUrl: 'https://img.youtube.com/vi/f7kP_Z7l_E0/hqdefault.jpg' },
    { videoId: 'v7kP_Y7l_k8', title: 'Sovereign Sanctity', author: 'Hate', thumbnailUrl: 'https://img.youtube.com/vi/v7kP_Y7l_k8/hqdefault.jpg' }
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
