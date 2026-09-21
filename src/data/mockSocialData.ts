export const ALL_BANDS = [
  { id: 'b1', name: 'TOMB MOLD', handle: 'tombmold', isRoster: true, avatarText: 'TM', color: 'text-orange-400 bg-orange-950/20 border-orange-500/30' },
  { id: 'b2', name: 'BLOOD INCANTATION', handle: 'bloodincantation', isRoster: true, avatarText: 'BI', color: 'text-pink-400 bg-pink-950/20 border-pink-500/30' },
  { id: 'b3', name: 'UNDEATH', handle: 'undeath', isRoster: true, avatarText: 'UD', color: 'text-rose-400 bg-rose-950/20 border-rose-500/30' },
  { id: 'b4', name: 'GOREGRIND OVERLORDS', handle: 'goregrind', isRoster: false, avatarText: 'GO', color: 'text-[#39ff14] bg-emerald-950/20 border-emerald-500/30' },
  { id: 'b5', name: 'NECROSYNTH CULT', handle: 'necrosynth', isRoster: false, avatarText: 'NC', color: 'text-[#eab308] bg-yellow-950/20 border-yellow-500/30' },
  { id: 'b6', name: 'CREEPING DEATH', handle: 'creepingdeath', isRoster: false, avatarText: 'CD', color: 'text-[#00ffcc] bg-cyan-950/20 border-cyan-500/30' },
];

export const DEFAULT_LABEL_POSTS = [
  {
    id: 'post_1',
    timestamp: 'June 18, 2026 at 4:32 PM',
    authorId: 'b1',
    authorName: 'TOMB MOLD',
    message: '🔥 NEW VINYL DROP! The Ritual Sewer Gates Double Splatter LP is now staged on our physical distribution desk. Strictly limited to 300 heavy wax pieces worldwide.',
    image_url: 'https://images.unsplash.com/photo-1542208998-f6dbbb27a72f?q=80&w=650&auto=format&fit=crop',
    likes_count: 42,
    user_liked: false,
    comments: [
      { id: 'c_1', username: 'analog_fiend', text: 'Stunning double wax colorway! Just triggered simulated order checkout.', time: '1 hour ago' },
      { id: 'c_1_r1', parent_comment_id: 'c_1', username: 'TOMB MOLD', text: 'Appreciate the heavy support! Yours is packed and ready to ship.', time: '45 mins ago' },
      { id: 'c_2', username: 'synth_cultist', text: 'Will these be loaded into the tour van stash for the Detroit gig?', time: '30 mins ago' },
      { id: 'c_2_r1', parent_comment_id: 'c_2', username: 'TOMB MOLD', text: 'Yes! Stashing 50 copies for the merch table at the Sanctuary.', time: '15 mins ago' },
    ],
  },
  {
    id: 'post_2',
    timestamp: 'June 15, 2026 at 11:12 AM',
    authorId: 'b2',
    authorName: 'BLOOD INCANTATION',
    message: '⚡ ANNOUNCEMENT: Independent Midwest Circuit complete. All shows were packed out and warehouse table stocks underwent full depletion logs.',
    likes_count: 28,
    user_liked: false,
    comments: [
      { id: 'c_3', username: 'midwest_shredder', text: 'The Oak Park show was legendary! Absolute sonic wall.', time: '1 day ago' },
      { id: 'c_3_r1', parent_comment_id: 'c_3', username: 'BLOOD INCANTATION', text: 'Oak Park brought unreal energy! Thanks for coming out.', time: '18 hours ago' },
      { id: 'c_4', username: 'cosmic_drift', text: 'Any chances of west coast dates on the next leg?', time: '12 hours ago' },
    ],
  },
  {
    id: 'post_3',
    timestamp: 'June 12, 2026 at 9:05 AM',
    authorId: 'b3',
    authorName: 'UNDEATH',
    message: '⚡ SECURED BAND TO BAND ALLIANCE: We are officially following heavy noise masters "Goregrind Overlords" and "Necrosynth Cult". Support the local scene and get their merch directly on the new band-to-band network feed!',
    likes_count: 19,
    user_liked: false,
    comments: [
      { id: 'c_5', username: 'goregrind_overlords', text: 'Honored to link up with UNDEATH! Heavy alliance locked in.', time: '2 hours ago' },
      { id: 'c_5_r1', parent_comment_id: 'c_5', username: 'UNDEATH', text: 'Let\'s set up a co-headline gig soon! 👊', time: '1 hour ago' },
    ],
  },
];

export const DEFAULT_INBOUND_INQUIRIES = [
  {
    id: 'inq_1',
    type: 'dm',
    senderName: 'grindcore_warrior',
    senderRole: 'fan',
    timestamp: 'June 24, 2026 at 10:15 AM',
    message: 'Yo! I love the latest vinyl releases you guys did. Will there be a restock for the Chicago show?',
    status: 'unread',
    replies: [],
  },
  {
    id: 'inq_2',
    type: 'epk',
    senderName: 'SEWER GASKET',
    senderRole: 'band',
    timestamp: 'June 23, 2026 at 2:40 PM',
    message: "Hey Nexus Core! We just compiled our new EPK. Our latest demo tracks are raw sludgy grind. We'd love to join the roster!",
    epkLink: 'https://epk.sewergasket.band/demo-2026',
    genre: 'Sludge / Grindcore',
    status: 'unread',
    replies: [],
  },
];
