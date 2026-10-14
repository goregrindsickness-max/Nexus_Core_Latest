// Profile utilities and predefined registry for Nexus network profiles

export const isMiguelNameOrProfile = (p?: any): boolean => {
  if (!p) return false;
  if (typeof p === 'string') {
    const s = p.toLowerCase().trim();
    if (s === '5403162d-1947-43aa-b5f6-38a1bd2a1b80' || s === 'goregrindsickness@gmail.com' || s === 'admin@nexus.com') {
      return true;
    }
    return s === 'miguel goregrinder medina' || s === 'miguel medina';
  }

  // If a profile has an email, and it is NOT Miguel's email, they are NEVER Miguel
  const email = String(p?.email || p?.booking_email || '').toLowerCase().trim();
  if (email && email !== 'goregrindsickness@gmail.com' && email !== 'admin@nexus.com') {
    return false;
  }

  // If a profile has a user ID, and it is a valid UUID other than Miguel's auth ID, they are NOT Miguel
  const pid = String(p?.id || p?.userId || p?.user_id || p?.creator_id || p?.owner_id || p?.author_id || p?.profile_id || '').toLowerCase().trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (pid && pid !== '5403162d-1947-43aa-b5f6-38a1bd2a1b80' && uuidRegex.test(pid)) {
    return false;
  }

  if (email === 'goregrindsickness@gmail.com' || email === 'admin@nexus.com') {
    return true;
  }
  if (pid === '5403162d-1947-43aa-b5f6-38a1bd2a1b80') {
    return true;
  }

  const rawName = String(p?.full_name || p?.legal_name || p?.legalName || p?.name || '').toLowerCase().trim();
  if (rawName === 'miguel goregrinder medina' || rawName === 'miguel medina') {
    return true;
  }

  return false;
};

export const PROFILE_REGISTRY: Record<string, any> = {
  'devourment': {
    bio: '💀 Brutal Slamming BDM pioneers from Dallas, Texas. Defining the heavy, mid-tempo, crushing slam groove since 1995.',
    location: 'Dallas, TX',
    genres: ['Slamming BDM', 'Brutal Death Metal'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 1520,
    favoriteSong: 'Babykiller',
    customBadges: ['👑 Slam Kings', '🔥 Texas Brutality']
  },
  'pathology': {
    bio: '💀 Brutal Death Metal surgeons from San Diego, California. Intricate anatomical brutality with extreme high speed and surgical precision.',
    location: 'San Diego, CA',
    genres: ['Brutal Death Metal', 'Technical Death Metal'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 430,
    favoriteSong: 'The Ritual of Decay',
    customBadges: ['💀 Surgical Precision', '🔥 Blasting Speed']
  },
  'origin': {
    bio: '💀 Tech-death masters of blistering speed and cosmic chaos. Unmatched sweeping, dynamic picking, and technical wizardry.',
    location: 'Topeka, KS',
    genres: ['Technical Death Metal', 'Brutal Death Metal'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 710,
    favoriteSong: 'Chaosmos',
    customBadges: ['⚡ Speed Demons', '🛸 Tech Wizards']
  },
  'incinerate': {
    bio: '💀 Relentless brutal death metal firestorm with hyper-blasting percussion and intense melodic undertones.',
    location: 'Minneapolis, MN',
    genres: ['Brutal Death Metal'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 210,
    favoriteSong: 'Searing Devastation',
    customBadges: ['🔥 Pyromaniacs', '⚡ Blast Beat Masters']
  },
  'stabbing': {
    bio: '💀 TXDM brutal slam death metal force. Vicious, raw moshpit energy and bloodthirsty modern slam sequences.',
    location: 'Houston, TX',
    genres: ['Brutal Death Metal', 'Slam'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 450,
    favoriteSong: 'Extirpated Inimicality',
    customBadges: ['🗡️ TXDM Savage', '⚡ Modern Slam']
  },
  'cryptopsy': {
    bio: '💀 Extreme Technical Death Metal from Montreal, Canada. Mind-bending speed, savage vocals, and gravity blasts.',
    location: 'Montreal, QC',
    genres: ['Technical Death Metal', 'Brutal Death Metal', 'Grindcore'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 420,
    favoriteSong: 'Phobophile',
    customBadges: ['⚡ Technical Masters', '🍁 Canadian Extreme', '🔊 Gravity Blast']
  },
  'nexus promoters': {
    bio: '🏟️ Main organizer & live booking alliance for the extreme underground syndicate.',
    location: 'Austin, TX',
    genres: ['All Extreme Genres'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 420,
    favoriteSong: 'Nexus Hub Anthems',
    customBadges: ['⚡ Promoter Elite', '🎫 Ticket Master']
  },
  'the underground': {
    bio: '🏟️ Monolithic underground live sanctuary, hosting the heaviest acts from around the globe.',
    location: 'Denison, TX',
    genres: ['Death Metal', 'Black Metal', 'Hardcore'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 610,
    favoriteSong: 'Live Rituals Vol. 1',
    customBadges: ['🏟️ Certified Venue', '🔊 Soundboard SBD']
  },
  'aura records': {
    bio: '💿 Indie extreme music vinyl label, dedicated to physical formats, raw tapes, and dark ambient.',
    location: 'Portland, OR',
    genres: ['Doom Metal', 'Black Metal', 'Ambient'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 320,
    favoriteSong: 'Vinyl Cuts No. 9',
    customBadges: ['💿 Record Presser', '📼 Tape Syndicate']
  },
  'shadowland records': {
    bio: '💿 Imprint for pure extreme metal and atmospheric drone formats.',
    location: 'Seattle, WA',
    genres: ['Doom', 'Sludge', 'Drone'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 180,
    favoriteSong: 'Drone of the Abyss',
    customBadges: ['💿 Record Presser']
  },
  'thrash_fiend': {
    bio: '🎧 Battle vest designer, pit warrior, and old school tape trader. Always chasing the buzzsaw.',
    location: 'Houston, TX',
    genres: ['Thrash', 'Death Metal', 'Crossover'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 34,
    favoriteSong: 'Slayer - Reign in Blood',
    customBadges: ['🎧 Pit Warrior', '📼 Tape Collector']
  },
  'goth_girl99': {
    bio: '🎧 Spooky synth and atmospheric black metal listener. I press real vinyl and run custom merch tables.',
    location: 'Denver, CO',
    genres: ['Synthwave', 'Black Metal', 'Goth Rock'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 81,
    favoriteSong: 'Lebanon Hanover - Gallowdance',
    customBadges: ['🎧 Night Wanderer', '🥀 Dark Velvet']
  },
  'tapetrader99': {
    bio: '🎧 Archiving underground soundboard cassette bootlegs since 1999. Send me your raw WAVs.',
    location: 'Denison, TX',
    genres: ['Old School Death Metal', 'Black Metal'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 310,
    favoriteSong: 'Immolation - Dawn of Possession',
    customBadges: ['📼 Tape Archivist', '🎚️ Soundboard Master']
  },
  'scene photographer': {
    bio: '🎧 Capturing the sonic sweat and blood of the extreme music pits. Sony A7SIII, analog Leica M6.',
    location: 'Los Angeles, CA',
    genres: ['Hardcore', 'Death Metal', 'Sludge'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 92,
    favoriteSong: 'Sunn O))) - It Took the Night to Believe',
    customBadges: ['📸 Pit Photographer', '⚡ Official Creative']
  },
  'riffmaster': {
    bio: '🎧 Custom cabinet woodworker and low-frequency explorer. 7-string baritone Ibanez enthusiast.',
    location: 'Austin, TX',
    genres: ['Sludge', 'Doom', 'Drone'],
    followersCount: 0,
    followingCount: 0,
    sharesCount: 12,
    favoriteSong: 'Electric Wizard - Dopethrone',
    customBadges: ['🎸 Cabinet Master', '🔊 Sub-Freq Spec']
  }
};
