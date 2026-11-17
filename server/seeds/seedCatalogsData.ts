// Server-only seed catalogs extracted from client bundle
export const KNOWN_PUBLIC_BANDS: Record<string, BandEnrichedMetadata> = {
  'hate': {
    founded_year: '1990',
    record_label: 'Metal Blade Records / Napalm Records',
    label: 'Metal Blade Records',
    city: 'Warsaw',
    country: 'Poland',
    genre: 'Blackened Death Metal',
    micro_genres: ['Blackened Death Metal', 'Extreme Metal', 'Death Metal'],
    bio: 'Extreme blackened death metal titan formed in Warsaw, Poland in 1990. Led by ATF Sinner, Hate blends dark atmospheric blackened intensity with brutal death metal precision.',
    spotify_url: 'https://open.spotify.com/artist/0UoN7E3p1wG3uLpM',
    metal_archives_url: 'https://www.metal-archives.com/bands/Hate/1183'
  },
  'deeds of flesh': {
    founded_year: '1993',
    status: 'active',
    is_split_up: false,
    record_label: 'Unique Leader Records',
    label: 'Unique Leader Records',
    city: 'Los Osos',
    state_province: 'CA',
    country: 'USA',
    genre: 'Extreme Metal',
    micro_genres: ['Extreme Metal', 'Technical BDM', 'Brutal Death Metal'],
    bio: 'Formed in 1993 on the Central Coast of California by guitarist/vocalist Erik Lindmark, Deeds of Flesh is a foundational pillar of modern technical and brutal death metal. The band pioneered the iconic California sound—marked by relentless blast beats, intricate shifting time signatures, and deep guttural vocals.',
    spotify_url: 'https://open.spotify.com/artist/5CgVbL1lV6u5v3t8Z3k8qG',
    metal_archives_url: 'https://www.metal-archives.com/bands/Deeds_of_Flesh/293',
    discography: []
  },
  'aeon': {
    founded_year: '1999',
    status: 'active',
    is_split_up: false,
    record_label: 'Metal Blade Records',
    label: 'Metal Blade Records',
    city: 'Östersund',
    state_province: 'Jämtland',
    country: 'Sweden',
    genre: 'Death Metal',
    micro_genres: ['Death Metal', 'Brutal Death Metal', 'Extreme Metal'],
    bio: 'Formed in Östersund, Sweden, in 1999 by vocalist Tommy Dahlström and guitarist Zeb Nilsson following the demise of Defaced Creation. Renowned for their unapologetically blasphemous themes, razor-sharp technical precision, and crushing blast beats, Aeon stands as one of the heaviest death metal exports from Scandinavia.',
    spotify_url: 'https://open.spotify.com/artist/3o6G0K4vW01kL0pM',
    metal_archives_url: 'https://www.metal-archives.com/bands/Aeon/3887'
  },
  'benediction': {
    founded_year: '1989',
    status: 'active',
    is_split_up: false,
    record_label: 'Nuclear Blast Records',
    label: 'Nuclear Blast Records',
    city: 'Birmingham',
    state_province: 'West Midlands',
    country: 'United Kingdom',
    genre: 'Old School Death Metal',
    micro_genres: ['Old School Death Metal', 'Death Metal', 'Extreme Metal'],
    bio: 'Formed in Birmingham, England, in 1989, Benediction is one of the foundational pillars of British Old School Death Metal. Signed to Nuclear Blast Records, Benediction deliver neck-snapping riffage, relentless groove, and crushing vocal intensity across 10 seminal releases.',
    spotify_url: 'https://open.spotify.com/artist/6P27kFvVp0U3a5k8Q5w18b',
    metal_archives_url: 'https://www.metal-archives.com/bands/Benediction/610'
  },
  'hypocrisy': {
    founded_year: '1991',
    status: 'active',
    is_split_up: false,
    record_label: 'Nuclear Blast Records',
    label: 'Nuclear Blast Records',
    city: 'Ludvika',
    state_province: 'Dalarna',
    country: 'Sweden',
    genre: 'Melodic Death Metal',
    micro_genres: ['Melodic Death Metal', 'Death Metal', 'Extreme Metal'],
    bio: 'Formed in Ludvika, Sweden, in 1991 by visionary frontman and producer Peter Tägtgren, Hypocrisy is a world-renowned pioneer of Swedish Melodic Death Metal. Famous for iconic masterpieces like Abducted, The Final Chapter, and Roswell 47.',
    spotify_url: 'https://open.spotify.com/artist/1G14y7G101o0G0K8P',
    metal_archives_url: 'https://www.metal-archives.com/bands/Hypocrisy/349'
  },
  'birdflesh': {
    founded_year: '1992',
    status: 'active',
    is_split_up: false,
    record_label: 'Everlasting Spew Records',
    label: 'Everlasting Spew Records',
    city: 'Växjö',
    state_province: 'Kronoberg',
    country: 'Sweden',
    genre: 'Grindcore',
    micro_genres: ['Extreme Metal', 'Deathgrind', 'Grindcore'],
    bio: 'Formed in 1992 in Växjö, Sweden, Birdflesh is a cult underground institution of humorous, high-octane grindcore and deathgrind, known for wearing outlandish stage masks and delivering breakneck blast beats.',
    lineup: [
      { id: 'bf-1', name: 'Adde Mitroulis', role: 'Drums, Vocals', status: 'active', years: '1997–present' },
      { id: 'bf-2', name: 'Joakim Svensson', role: 'Bass, Vocals', status: 'active', years: '2007–present' },
      { id: 'bf-3', name: 'Elis Edin Markskog', role: 'Guitars, Vocals', status: 'active', years: '2011–present' }
    ],
    spotify_url: 'https://open.spotify.com/artist/2v6E8j010yG5tX01',
    metal_archives_url: 'https://www.metal-archives.com/bands/Birdflesh/1376'
  },
  'gorgasm': {
    founded_year: '1994',
    status: 'active',
    is_split_up: false,
    record_label: 'New Standard Elite / Unique Leader',
    label: 'New Standard Elite / Unique Leader',
    city: 'Chicago',
    state_province: 'IL',
    country: 'USA',
    genre: 'Brutal Death Metal',
    micro_genres: ['Brutal Death Metal', 'Death Metal'],
    bio: 'Formed in Chicago in 1994, Gorgasm is a prominent and enduring force in American brutal death metal, famous for technical blast sections and punishing groove slams.',
    lineup: [
      { id: 'gorg-1', name: 'Damian Leski', role: 'Guitar, Vocals', status: 'active', years: '1994–present' },
      { id: 'gorg-2', name: 'Sasha Chrosciewicz', role: 'Guitar, Vocals', status: 'active', years: '2018–present' },
      { id: 'gorg-3', name: 'John Hull', role: 'Bass, Vocals', status: 'active', years: '2022–present' },
      { id: 'gorg-4', name: 'Tomasz Pilasiewicz', role: 'Drums', status: 'active', years: '2005–2008, 2024–present' }
    ],
    spotify_url: 'https://open.spotify.com/artist/5B4Xf5O2v9t4w7r2M4k8v1',
    metal_archives_url: 'https://www.metal-archives.com/bands/Gorgasm/1175'
  },
  'extermination dismemberment': {
    founded_year: '2009',
    status: 'active',
    is_split_up: false,
    record_label: 'Unique Leader Records',
    label: 'Unique Leader Records',
    city: 'Minsk',
    state_province: 'Minsk',
    country: 'Belarus',
    genre: 'Slamming BDM',
    micro_genres: ['Slamming BDM', 'Brutal Deathcore', 'Extreme Metal'],
    bio: 'Formed in Minsk, Belarus, in 2009, Extermination Dismemberment is an internationally renowned pioneer of slamming brutal death metal. Famous for their seismic sub-bass drops, pulverizing slam grooves, and apocalyptic production.',
    lineup: [
      { id: 'ed-1', name: 'Arseniy Kovalchuk', role: 'Guitars', status: 'active', years: '2009–present' },
      { id: 'ed-2', name: 'Vladislav Vislavskiy', role: 'Vocals', status: 'active', years: '2011–present' },
      { id: 'ed-3', name: 'Viktor Kallas', role: 'Bass', status: 'active', years: '2013–present' },
      { id: 'ed-4', name: 'Denis Dementev', role: 'Drums', status: 'active', years: '2018–present' }
    ],
    spotify_url: 'https://open.spotify.com/artist/7v7E8j010yG5tX01',
    metal_archives_url: 'https://www.metal-archives.com/bands/Extermination_Dismemberment/3540318538'
  },
  'hate eternal': {
    founded_year: '1997',
    status: 'on-hold',
    is_split_up: false,
    record_label: 'Season of Mist',
    label: 'Season of Mist',
    city: 'Tampa',
    state_province: 'FL',
    country: 'USA',
    genre: 'Death Metal',
    micro_genres: ['Extreme Metal', 'Death Metal', 'Tech Death'],
    bio: 'Formed in St. Petersburg, Florida, in 1997 by legendary guitarist and producer Erik Rutan (Morbid Angel, Cannibal Corpse), Hate Eternal is a relentless hurricane of ferocious, hyper-speed technical death metal.',
    lineup: [
      { id: 'he-1', name: 'Erik Rutan', role: 'Guitars, Vocals', status: 'active', years: '1997–present' },
      { id: 'he-2', name: 'JJ Hrubovcak', role: 'Bass', status: 'active', years: '2008–present' },
      { id: 'he-3', name: 'Hannes Grossmann', role: 'Drums', status: 'active', years: '2018–present' }
    ],
    spotify_url: 'https://open.spotify.com/artist/1G14y7G101o0G0K8P',
    metal_archives_url: 'https://www.metal-archives.com/bands/Hate_Eternal/478'
  },
  'visceral disgorge': {
    founded_year: '2007',
    status: 'active',
    is_split_up: false,
    record_label: 'Agonia Records',
    label: 'Agonia Records',
    city: 'Baltimore',
    state_province: 'MD',
    country: 'USA',
    genre: 'Slamming BDM',
    micro_genres: ['Extreme Metal', 'Slamming BDM', 'Brutal Death Metal'],
    bio: 'Formed in Baltimore, Maryland, in 2007, Visceral Disgorge is an undisputed titan of brutal slam death metal, celebrated for grooving guttural slams, ferocious stage presence, and underground classics like Ingesting Putridity.',
    lineup: [
      { id: 'vd-1', name: 'Travis Whitman', role: 'Vocals', status: 'active', years: '2007–present' },
      { id: 'vd-2', name: 'Steve Werigin', role: 'Guitars', status: 'active', years: '2007–present' },
      { id: 'vd-3', name: 'Eric Little', role: 'Bass', status: 'active', years: '2012–present' },
      { id: 'vd-4', name: 'Billy K', role: 'Drums', status: 'active', years: '2018–present' }
    ],
    spotify_url: 'https://open.spotify.com/artist/0UoN7E3p1wG3uLpM',
    metal_archives_url: 'https://www.metal-archives.com/bands/Visceral_Disgorge/3540330953'
  },
  'abnormality': {
    founded_year: '2005',
    status: 'split-up',
    is_split_up: true,
    record_label: 'Metal Blade Records',
    label: 'Metal Blade Records',
    city: 'Boston',
    state_province: 'MA',
    country: 'USA',
    genre: 'Brutal Death Metal',
    micro_genres: ['Brutal Death Metal', 'Technical Death Metal', 'Slam Death Metal'],
    bio: 'Massive brutal technical death metal powerhouse from Boston, Massachusetts, featuring Mallika Sundaramurthy on vocals. Signed to Metal Blade Records with iconic releases including Mechanisms of Omniscience and Sociopathic Constructs.',
    lineup: [
      { id: 'abn-1', name: 'Mallika Sundaramurthy', role: 'Vocals', status: 'past', years: '2005–2020' },
      { id: 'abn-2', name: 'Jay Portnoy', role: 'Guitars', status: 'past', years: '2005–2020' },
      { id: 'abn-3', name: 'Jeremy Henry', role: 'Guitars', status: 'past', years: '2005–2020' },
      { id: 'abn-4', name: 'Josh Hawkes', role: 'Bass', status: 'past', years: '2009–2020' },
      { id: 'abn-5', name: 'Jay Blaisdell', role: 'Drums', status: 'past', years: '2005–2020' }
    ],
    spotify_url: 'https://open.spotify.com/artist/2v6E8j010yG5tX01',
    metal_archives_url: 'https://www.metal-archives.com/bands/Abnormality/94178'
  },
  'dying fetus': {
    founded_year: '1991',
    record_label: 'Relapse Records',
    label: 'Relapse Records',
    city: 'Annapolis',
    state_province: 'MD',
    country: 'USA',
    genre: 'Brutal Death Metal',
    micro_genres: ['Brutal Death Metal', 'Slam Death Metal', 'Grindcore', 'Technical Death Metal'],
    bio: 'Iconic American brutal death metal/grindcore band formed in Annapolis, Maryland in 1991. Renowned for hyper-technical riffs, dual guttural vocals, and crushing slam breakdowns.',
    spotify_url: 'https://open.spotify.com/artist/4X9iP7T41u6T0K8P'
  },
  'suffocation': {
    founded_year: '1988',
    record_label: 'Nuclear Blast Records',
    label: 'Nuclear Blast Records',
    city: 'Long Island',
    state_province: 'NY',
    country: 'USA',
    genre: 'Brutal Death Metal',
    micro_genres: ['Brutal Death Metal', 'Technical Death Metal', 'Slam Death Metal'],
    bio: 'Pioneers of technical brutal death metal and the rhythmic slam breakdown, formed in Long Island, New York in 1988.',
    spotify_url: 'https://open.spotify.com/artist/3s4y9G101o0G0K8P'
  },
  'cannibal corpse': {
    founded_year: '1988',
    record_label: 'Metal Blade Records',
    label: 'Metal Blade Records',
    city: 'Buffalo',
    state_province: 'NY',
    country: 'USA',
    genre: 'Death Metal',
    micro_genres: ['Death Metal', 'Brutal Death Metal', 'Thrash Metal'],
    bio: 'Legendary death metal pioneers formed in Buffalo, New York in 1988. One of the top-selling death metal bands of all time.',
    spotify_url: 'https://open.spotify.com/artist/1G14y7G101o0G0K8P',
    lineup: [
      { id: 'cc-1', name: 'George "Corpsegrinder" Fisher', role: 'Lead Vocals', status: 'active', years: '1995–present' },
      { id: 'cc-2', name: 'Alex Webster', role: 'Bass', status: 'active', year: '1988–present', years: '1988–present' },
      { id: 'cc-3', name: 'Paul Mazurkiewicz', role: 'Drums', status: 'active', years: '1988–present' },
      { id: 'cc-4', name: 'Rob Barrett', role: 'Rhythm Guitar', status: 'active', years: '1993–1997, 2005–present' },
      { id: 'cc-5', name: 'Erik Rutan', role: 'Lead Guitar', status: 'active', years: '2021–present' }
    ],
    discography: []
  },
  'carcass': {
    founded_year: '1985',
    record_label: 'Nuclear Blast / Earache Records',
    label: 'Nuclear Blast',
    city: 'Liverpool',
    country: 'United Kingdom',
    genre: 'Goregrind / Melodic Death Metal',
    micro_genres: ['Goregrind', 'Melodic Death Metal', 'Grindcore'],
    bio: 'Pioneers of goregrind and melodic death metal from Liverpool, UK, formed in 1985. Creators of legendary albums Reek of Putrefaction and Heartwork.'
  },
  'exhumed': {
    founded_year: '1990',
    record_label: 'Relapse Records',
    label: 'Relapse Records',
    city: 'San Jose',
    state_province: 'CA',
    country: 'USA',
    genre: 'Goregrind / Death Metal',
    micro_genres: ['Goregrind', 'Death Metal', 'Grindcore'],
    bio: 'Symphonies of sickness deathgrind pioneers from San Jose, California, led by Matt Harvey since 1990.'
  },
  'devourment': {
    founded_year: '1995',
    record_label: 'Relapse Records',
    label: 'Relapse Records',
    city: 'Dallas',
    state_province: 'TX',
    country: 'USA',
    genre: 'Slam Death Metal',
    micro_genres: ['Slam Death Metal', 'Brutal Death Metal', 'Goregrind'],
    bio: 'Godfathers of slam death metal formed in Dallas, Texas in 1995. Inventors of the guttural slam style with 1999 masterpiece Molesting the Decapitated.'
  },
  'incantation': {
    founded_year: '1989',
    record_label: 'Relapse Records',
    label: 'Relapse Records',
    city: 'Johnstown',
    state_province: 'PA',
    country: 'USA',
    genre: 'Death Metal',
    micro_genres: ['Death Metal', 'Doom Metal', 'Blackened Death Metal'],
    bio: 'Pioneers of dark, atmospheric death metal formed in 1989 by John McEntee.'
  },
  'archspire': {
    founded_year: '2009',
    record_label: 'Season of Mist',
    label: 'Season of Mist',
    city: 'Vancouver',
    state_province: 'BC',
    country: 'Canada',
    genre: 'Technical Death Metal',
    micro_genres: ['Technical Death Metal', 'Extreme Metal'],
    bio: 'Hyper-technical 350+ BPM technical death metal machine from Vancouver, BC, Canada, formed in 2009.'
  },
  'analepsy': {
    founded_year: '2012',
    record_label: 'Miasma Records / Agonia Records',
    label: 'Agonia Records',
    city: 'Ourém',
    country: 'Portugal',
    genre: 'Brutal Death Metal',
    micro_genres: ['Brutal Death Metal', 'Slam Death Metal'],
    bio: 'Portuguese brutal death metal powerhouse delivering crushing slam breakdowns and technical death metal precision since 2012.'
  },
  'benighted': {
    founded_year: '1998',
    record_label: 'Season of Mist',
    label: 'Season of Mist',
    city: 'Saint-Étienne',
    country: 'France',
    genre: 'Deathgrind',
    micro_genres: ['Deathgrind', 'Brutal Death Metal', 'Grindcore'],
    bio: 'High-speed brutal deathgrind assault from Saint-Étienne, France, formed in 1998.'
  },
  'vulvodynia': {
    founded_year: '2014',
    record_label: 'Unique Leader Records',
    label: 'Unique Leader Records',
    city: 'Durban',
    country: 'South Africa',
    genre: 'Slam Death Metal',
    micro_genres: ['Slam Death Metal', 'Brutal Death Metal'],
    bio: 'South African slam death metal heavyweights delivering relentless breakdowns and brutal vocal onslaughts since 2014.'
  },
  'necroticgorebeast': {
    founded_year: '2017',
    record_label: 'Comatose Music',
    label: 'Comatose Music',
    city: 'Quebec City',
    state_province: 'QC',
    country: 'Canada',
    genre: 'Brutal Death Metal',
    micro_genres: ['Brutal Death Metal', 'Slam Death Metal'],
    bio: 'Crushing Canadian brutal death metal behemoth featuring Michael Chamberland and Alexandre Brochu.'
  },
  'scour': {
    founded_year: '2015',
    status: 'active',
    is_split_up: false,
    record_label: 'Housecore Records / Nuclear Blast',
    label: 'Housecore Records',
    city: 'New Orleans',
    state_province: 'LA',
    country: 'USA',
    genre: 'Extreme Metal',
    micro_genres: ['Extreme Metal', 'Black Metal', 'Thrash Metal'],
    bio: 'Extreme metal supergroup formed in 2015 featuring Philip H. Anselmo (Pantera, Down), Derek Engemann (Cattle Decapitation), John Jarvis (Pig Destroyer), Mark Kloeppel (Misery Index), and Adam Jarvis (Misery Index, Pig Destroyer).',
    lineup: [
      { id: 'sc-1', name: 'Philip H. Anselmo', role: 'Lead Vocals', status: 'active', years: '2015–present' },
      { id: 'sc-2', name: 'Derek Engemann', role: 'Guitars, Backing Vocals', status: 'active', years: '2015–present' },
      { id: 'sc-3', name: 'Mark Kloeppel', role: 'Guitars, Backing Vocals', status: 'active', years: '2015–present' },
      { id: 'sc-4', name: 'John Jarvis', role: 'Bass, Backing Vocals', status: 'active', years: '2015–present' },
      { id: 'sc-5', name: 'Adam Jarvis', role: 'Drums', status: 'active', years: '2015–present' }
    ],
    spotify_url: 'https://open.spotify.com/artist/5s87E8j010yG5tX01',
    metal_archives_url: 'https://www.metal-archives.com/bands/Scour/3540411855'
  },
  'squash bowels': {
    founded_year: '1994',
    status: 'split-up',
    is_split_up: true,
    record_label: 'Willowtip Records / Lard Records',
    label: 'Willowtip Records',
    city: 'Białystok',
    state_province: 'Podlaskie',
    country: 'Poland',
    genre: 'Goregrind / Deathgrind',
    micro_genres: ['Goregrind', 'Deathgrind', 'Grindcore'],
    bio: 'Cult Polish goregrind and deathgrind institution formed in Białystok, Poland, in 1994. Known for unrelenting blast beats, pitch-shifted gutturals, and classic albums like Grindvirus and Grindcoholics.',
    lineup: [
      { id: 'sb-1', name: 'Arthur "Paluch" Meinart', role: 'Bass, Vocals', status: 'past', years: '1994–2016' },
      { id: 'sb-2', name: 'Andy', role: 'Guitars', status: 'past', years: '1994–2016' },
      { id: 'sb-3', name: 'Psycho', role: 'Drums', status: 'past', years: '2001–2016' }
    ],
    spotify_url: 'https://open.spotify.com/artist/4u7E8j010yG5tX01',
    metal_archives_url: 'https://www.metal-archives.com/bands/Squash_Bowels/3358'
  }
};

export const CANONICAL_DOMINATION_FEST_ARCHIVES: any[] = [
  {
    id: 'cdf-2024-finale',
    year: 2024,
    title: 'Chicago Domination Fest 2024 (10-Year Anniversary Finale)',
    type: 'anniversary',
    date: 'OCT 18 - 20, 2024',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Defeated Sanity',
      'Disgorge',
      'Cephalotripsy',
      'Internal Bleeding',
      'Malignancy',
      'Gorgasm',
      'Kraanium',
      'Brodequin',
      'Short Bus Pile Up',
      'Vulvodynia'
    ],
    attendance: '750+ Sold Out Capacity',
    milestone: '🏆 Decade Finale & 10th Milestone Anniversary',
    historicalNotes: 'The grand finale of the decade-long Chicago Domination Fest franchise. Drew underground fans and international touring acts from over 18 countries across 3 devastating days.',
    flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
    photoCount: 142
  },
  {
    id: 'cdf-2023-9th',
    year: 2023,
    title: 'Chicago Domination Fest 2023 (9th Edition)',
    type: 'festival',
    date: 'OCT 20 - 22, 2023',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Devourment',
      'Skinless',
      'Mortal Decay',
      'Visceral Disgorge',
      'Short Bus Pile Up',
      'Lust of Decay',
      'Cognitive',
      'Gorgasm'
    ],
    attendance: 'Sold Out (3 Days)',
    milestone: '🔥 Historic Slam Co-Headliner Package',
    historicalNotes: 'A legendary slam death metal takeover featuring the reunion of several foundational early 2000s brutal death acts.',
    flyerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    photoCount: 88
  },
  {
    id: 'tdf-2022-inaugural',
    year: 2022,
    title: 'Texas Domination Fest 2022 (Inaugural Expansion)',
    type: 'festival',
    date: 'NOV 11 - 12, 2022',
    venue: 'The Rail Club Live',
    city: 'Fort Worth / Dallas, TX',
    lineup: [
      'Putrid Pile',
      'Devourment',
      'Stabbing',
      'Viral Load',
      'Prophecy',
      'Condemned',
      'Embodied Torment'
    ],
    attendance: 'Packed Texas Crowd',
    milestone: '⚡ Official Southwest Territory Expansion',
    historicalNotes: 'Expansion of the Domination Fest banner into the Lone Star state, cementing Texas as a stronghold for pure underground slam and death metal.',
    flyerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800',
    photoCount: 65
  },
  {
    id: 'cdf-2021-return',
    year: 2021,
    title: 'Chicago Domination Fest 2021 (The Return)',
    type: 'festival',
    date: 'OCT 15 - 17, 2021',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Cephalotripsy',
      'Pyrexia',
      'Pathology',
      'Abominable Putridity (USA Set)',
      'Gorgasm',
      'Cinerary',
      'Stabbing'
    ],
    attendance: 'Sold Out Venue',
    milestone: '💥 Post-Lockdown Heavy Metal Re-emergence',
    historicalNotes: 'The legendary return to live pits following the global shutdown. High energy from open to close with attendees celebrating extreme music survival.',
    flyerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    photoCount: 94
  },
  {
    id: 'cdf-2019-6th',
    year: 2019,
    title: 'Chicago Domination Fest 2019 (6th Annual)',
    type: 'festival',
    date: 'OCT 24 - 26, 2019',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Malignancy',
      'Disentomb (Australia)',
      'Dehumanized',
      'Condemned',
      'Gorgasm',
      'Cognitive',
      'Cognizant',
      'Abnormal Inhumane'
    ],
    attendance: 'International Roster Sellout',
    milestone: '🌍 Global Brutality Convergence',
    historicalNotes: 'Featured top-tier international acts making exclusive Chicago appearances curated by Miguel Goregrinder Medina.',
    flyerUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=800',
    photoCount: 110
  },
  {
    id: 'cdf-2018-5th',
    year: 2018,
    title: 'Chicago Domination Fest 2018 (5-Year Milestone)',
    type: 'anniversary',
    date: 'JUL 26 - 28, 2018',
    venue: 'Subterranean',
    city: 'Chicago, IL',
    lineup: [
      'Gorgasm',
      'Internal Bleeding',
      'Cenotaph (Turkey)',
      'Sexcrement',
      'Coathanger Abortion',
      'Splattered',
      'Scattered Remains'
    ],
    attendance: '500+ Cap Sold Out',
    milestone: '⭐ 5th Anniversary Golden Era',
    historicalNotes: 'Commemorating 5 years of underground dominance at Subterranean in Wicker Park.',
    flyerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800',
    photoCount: 76
  },
  {
    id: 'cdf-2017-4th',
    year: 2017,
    title: 'Chicago Domination Fest 2017 (4th Edition)',
    type: 'festival',
    date: 'JUL 27 - 29, 2017',
    venue: 'Wire / Live Wire Lounge',
    city: 'Berwyn / Chicago, IL',
    lineup: [
      'Putrid Pile',
      'Digested Flesh',
      'Dysentery',
      'Pathology',
      'Sexual Atrocities',
      'Parasitic Ejaculation'
    ],
    attendance: 'Capacity Weekend',
    milestone: '🔥 Underground Heritage Gathering',
    historicalNotes: 'Multi-room underground setup with non-stop blastbeats and dual stage setups.',
    flyerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    photoCount: 52
  },
  {
    id: 'cdf-2016-3rd',
    year: 2016,
    title: 'Chicago Domination Fest 2016 (3rd Edition)',
    type: 'festival',
    date: 'JUL 28 - 30, 2016',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Disgorge',
      'Broken Hope',
      'Gorgasm',
      'Malignancy',
      'Lividity',
      'Gutrot',
      'Inveracity'
    ],
    attendance: 'Sold Out',
    milestone: '⚡ Iconic Midwest Classic',
    historicalNotes: 'Historic bill reuniting Midwest and West Coast pioneers for an unforgettable 3-night showcase.',
    flyerUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800',
    photoCount: 68
  },
  {
    id: 'cdf-2015-2nd',
    year: 2015,
    title: 'Chicago Domination Fest 2015 (2nd Edition)',
    type: 'festival',
    date: 'AUG 14 - 15, 2015',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Inveracity',
      'Gorgasm',
      'Devourment',
      'Prophecy',
      'Inherit Disease',
      'Cerebral Incubation'
    ],
    attendance: 'Sellout Gathering',
    milestone: '🏛️ National Slam Death Foundation',
    historicalNotes: 'Solidified Chicago as the epicenter of North American brutal death festivals.',
    flyerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800',
    photoCount: 45
  },
  {
    id: 'cdf-2014-inaugural',
    year: 2014,
    title: 'Chicago Domination Fest 2014 (Inaugural Launch)',
    type: 'anniversary',
    date: 'OCT 10 - 11, 2014',
    venue: 'Reggies Rock Club',
    city: 'Chicago, IL',
    lineup: [
      'Cephalotripsy',
      'Putrid Pile',
      'Gorgasm',
      'Malignancy',
      'Gutrot',
      'Viral Load',
      'Disfigured'
    ],
    attendance: 'Inaugural Sellout',
    milestone: '🌱 Genesis of Chicago Domination Fest',
    historicalNotes: 'The festival that started it all. Conceived and promoted by Miguel Medina, launching a 10-year legacy in extreme music history.',
    flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
    photoCount: 50
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
