// Forum mock threads data for Nexus Underground Social Feed

export const initialForumThreads = [
  {
    id: 't1',
    title: "Close to a World Below's album art is a masterpiece. Who is the artist?",
    content: "The surreal apocalyptic aesthetic fits the dissonant death metal sound perfectly. Is it Andreas Marschall?",
    category: 'Album Art',
    genre: 'Death Metal',
    author: 'StarGazer',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    timeAgo: '2h ago',
    votes: 148,
    userVote: null,
    comments: [
      {
        id: 'fc1',
        author: 'CosmicVoid',
        text: "It's actually painted by Andreas Marschall! Incredible choice by Immolation.",
        timeAgo: '1h ago',
        replies: [
          { id: 'fr1', author: 'StarGazer', text: "That is awesome! No wonder it felt so familiar." }
        ]
      }
    ]
  },
  {
    id: 't2',
    title: 'Immolation - Close to a World Below: Decades Later',
    content: 'Can we talk about how well this legendary record has aged? The crushing riffs, the dark atmospheres, and Ross Dolan\'s tone.',
    category: 'Album Reviews',
    genre: 'Death Metal',
    author: 'OnyxRiff',
    timeAgo: '4h ago',
    votes: 95,
    userVote: null,
    comments: [
      {
        id: 'fc2',
        author: 'PummelingBass',
        text: 'Totally agree. It pioneered a resurgence of high-speed technical death metal. Every track is an absolute anthem.',
        timeAgo: '3h ago',
        replies: []
      }
    ]
  },
  {
    id: 't3',
    title: 'Maryland Deathfest 2026 predictions and wishlist',
    content: "Who are we hoping to see on the bill next year? I'm hoping for a Cryptopsy/Immolation co-headline set!",
    category: 'Show & Fest',
    genre: 'Death Metal',
    author: 'FestivalGoon',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    timeAgo: '1d ago',
    votes: 204,
    userVote: null,
    comments: []
  },
  {
    id: 't4',
    title: 'What gear did Cryptopsy use on None So Vile for that extreme speed?',
    content: "Is it standard Marshall amps or custom distortion chains? Jon Levasseur's guitar tone cut right through Flo Mounier's gravity blasts.",
    category: 'Gear & Rig',
    genre: 'Death Metal',
    author: 'GuitarNerd_666',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    timeAgo: '2d ago',
    votes: 64,
    userVote: null,
    comments: []
  },
  {
    id: 't5',
    title: 'Cosmic Black Metal: Paysage d\'Hiver vs. Alcest vs. Darkspace',
    content: "I'm fascinated by black metal that reaches into the cold starry abyss instead of just dark forests. Which act hits hardest for you?",
    category: 'Album Reviews',
    genre: 'Black Metal',
    author: 'AstraVoid',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    timeAgo: '5h ago',
    votes: 78,
    userVote: null,
    comments: [
      {
        id: 'fc3',
        author: 'SpectralGlow',
        text: 'Darkspace is the absolute pinnacle of cosmic dread. Paysage d\'Hiver is more like blizzard isolation.',
        timeAgo: '3h ago',
        replies: []
      }
    ]
  },
  {
    id: 't6',
    title: 'The vintage 4-track raw tape sound of early Norwegian Black Metal',
    content: 'Is there any modern plug-in or analog deck that actually replicates that Transilvanian Hunger cassette tape saturation?',
    category: 'Gear & Rig',
    genre: 'Black Metal',
    author: 'GravenSoul',
    timeAgo: '1d ago',
    votes: 42,
    userVote: null,
    comments: []
  },
  {
    id: 't7',
    title: 'Is Electric Wizard\'s "Dopethrone" the heaviest record ever recorded?',
    content: 'That guitar tone sounds like molten sludge. I\'ve heard rumors they used maxed-out Boss FZ-2 Hyper Fuzz pedals into vintage Sound City heads.',
    category: 'Gear & Rig',
    genre: 'Doom/Sludge',
    author: 'SludgeWorship',
    image: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=600&auto=format&fit=crop&q=80',
    timeAgo: '3h ago',
    votes: 115,
    userVote: null,
    comments: [
      {
        id: 'fc4',
        author: 'FuzzLord',
        text: 'Yes! It is indeed the FZ-2 on Mode II (scooped boost) pushing those power tubes into pure obliteration.',
        timeAgo: '1h ago',
        replies: []
      }
    ]
  },
  {
    id: 't8',
    title: 'Bell Witch live is a colossal, crushing, slow-motion experience',
    content: 'Just saw them perform Mirror Reaper in its entirety last night. Only two musicians on stage, but filling the entire venue with sonic weight.',
    category: 'Show & Fest',
    genre: 'Doom/Sludge',
    author: 'MournfulChord',
    timeAgo: '2d ago',
    votes: 93,
    userVote: null,
    comments: []
  },
  {
    id: 't9',
    title: 'Knocked Loose & Gel tour is absolutely unhinged live',
    content: 'Saw the opening night in Chicago. The crowd response during the breakdown in "Deep in the Willow" nearly demolished the floorboards.',
    category: 'Show & Fest',
    genre: 'Hardcore Punk',
    author: 'PitWarrior_99',
    timeAgo: '1h ago',
    votes: 210,
    userVote: null,
    comments: [
      {
        id: 'fc5',
        author: 'FastTempo',
        text: 'Gel was incredible too! Best modern hardcore band by a mile. Raw energy.',
        timeAgo: '30m ago',
        replies: []
      }
    ]
  },
  {
    id: 't10',
    title: 'D-Beat drum patterns: Favorite crust punk bands keeping it raw?',
    content: 'Discharge created a monster. Who is doing D-beat best today? Framtid? Physique? Destruct?',
    category: 'Recommendations',
    genre: 'Hardcore Punk',
    author: 'CrustyCactus',
    timeAgo: '3d ago',
    votes: 56,
    userVote: null,
    comments: []
  },
  {
    id: 't11',
    title: 'The ultimate shoegaze guitar: Jazzmaster vs. Jaguar for tremolo arm glide',
    content: 'Is there a consensus on which body shape/bridge works best for that classic Kevin Shields reverse-reverb glide guitar technique?',
    category: 'Gear & Rig',
    genre: 'Post-Rock / Shoegaze',
    author: 'ReverbDrenched',
    timeAgo: '6h ago',
    votes: 84,
    userVote: null,
    comments: [
      {
        id: 'fc6',
        author: 'GlideDreamer',
        text: 'Jazzmaster all day! The longer scale length gives a slightly different tension that keeps lower tunings stable while gliding.',
        timeAgo: '4h ago',
        replies: []
      }
    ]
  },
  {
    id: 't12',
    title: 'This Will Destroy You - Self Titled: 15 year anniversary appreciation',
    content: 'The transition from "The World is Our ___" into "The Villa" still gives me goosebumps every single time.',
    category: 'Album Art',
    genre: 'Post-Rock / Shoegaze',
    author: 'DelayRepeat',
    timeAgo: '1d ago',
    votes: 119,
    userVote: null,
    comments: []
  },
  {
    id: 't13',
    title: 'Mortiis dungeon synth - classic medieval ambient masterpieces',
    content: 'For fans of classic extreme metal side-projects, Mortiis is the absolute king of dungeon synth. Era 1 records are magical.',
    category: 'Album Reviews',
    genre: 'Synth & Ambient',
    author: 'ModularChaos',
    timeAgo: '12h ago',
    votes: 132,
    userVote: null,
    comments: [
      {
        id: 'fc7',
        author: 'Oscillator_7',
        text: 'Absolutely! The Eurorack modular structures are incredibly well-paced. Perfect late night synth soundscape.',
        timeAgo: '10h ago',
        replies: []
      }
    ]
  },
  {
    id: 't14',
    title: 'Dark Ambient starter pack: Where to begin after Lustmord?',
    content: "I love the cavernous, dread-inducing soundscapes. Which labels or artists should I dig into next? Cryo Chamber? Cold Meat Industry?",
    category: 'Recommendations',
    genre: 'Synth & Ambient',
    author: 'DreadDrone',
    timeAgo: '2d ago',
    votes: 61,
    userVote: null,
    comments: []
  }
];
