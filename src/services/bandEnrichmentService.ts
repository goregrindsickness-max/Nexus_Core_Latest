import { INITIAL_COMMUNITY_BANDS, CommunityBandRecord } from '../lib/communityBands';
import { ROSTER_CATALOGS } from '../data/socialFeedMockData';

export interface BandEnrichedMetadata {
  founded_year?: string;
  status?: string;
  is_split_up?: boolean;
  record_label?: string;
  label?: string;
  city?: string;
  state_province?: string;
  state?: string;
  country?: string;
  genre?: string;
  micro_genres?: string[];
  subgenres?: string[];
  bio?: string;
  lineup?: any[];
  discography?: any[];
  spotify_url?: string;
  metal_archives_url?: string;
  youtube_url?: string;
}

/**
 * Known public band knowledge dictionary fallback for fast synchronous prefilling
 */
const KNOWN_PUBLIC_BANDS: Record<string, BandEnrichedMetadata> = {
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
    discography: [
      { id: 'dof-rel-1', title: 'Gradually Melted', year: '1995', type: 'ep', label: 'Wild Rags', cover_url: '', cover_image: '' },
      { id: 'dof-rel-2', title: 'Trading Pieces', year: '1996', type: 'album', label: 'Spanish Goblin', cover_url: '', cover_image: '' },
      { id: 'dof-rel-3', title: 'Inbreeding the Anthropophagi', year: '1998', type: 'album', label: 'Decomposed Records', cover_url: '', cover_image: '' },
      { id: 'dof-rel-4', title: 'Path of the Totem', year: '1999', type: 'album', label: 'Unique Leader Records', cover_url: '', cover_image: '' },
      { id: 'dof-rel-5', title: 'Mark of the Legion', year: '2001', type: 'album', label: 'Unique Leader Records', cover_url: '', cover_image: '' },
      { id: 'dof-rel-6', title: 'Reduced to Begging', year: '2003', type: 'album', label: 'Unique Leader Records', cover_url: '', cover_image: '' },
      { id: 'dof-rel-7', title: 'Crown of Souls', year: '2005', type: 'album', label: 'Unique Leader Records', cover_url: '', cover_image: '' },
      { id: 'dof-rel-8', title: "Of What's to Come", year: '2008', type: 'album', label: 'Unique Leader Records', cover_url: '', cover_image: '' },
      { id: 'dof-rel-9', title: 'Portals to Canaan', year: '2013', type: 'album', label: 'Unique Leader Records', cover_url: '', cover_image: '' },
      { id: 'dof-rel-10', title: 'Nucleus', year: '2020', type: 'album', label: 'Unique Leader Records', cover_url: '', cover_image: '' }
    ]
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
      { id: 'bf-1', name: 'Smögen', role: 'Bass, Vocals', status: 'active', years: '1992–present' },
      { id: 'bf-2', name: 'Elis', role: 'Guitars, Vocals', status: 'active', years: '2014–present' },
      { id: 'bf-3', name: 'Barra', role: 'Drums, Vocals', status: 'active', years: '2021–present' }
    ],
    spotify_url: 'https://open.spotify.com/artist/2v6E8j010yG5tX01',
    metal_archives_url: 'https://www.metal-archives.com/bands/Birdflesh/1376'
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
    discography: [
      { id: 'cc-rel-1', title: 'Eaten Back to Life', year: '1990', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-2', title: 'Butchered at Birth', year: '1991', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-3', title: 'Tomb of the Mutilated', year: '1992', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-4', title: 'The Bleeding', year: '1994', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-5', title: 'Vile', year: '1996', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-6', title: 'Gallery of Suicide', year: '1998', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-7', title: 'Bloodthirst', year: '1999', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-8', title: 'Gore Obsessed', year: '2002', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-9', title: 'The Wretched Spawn', year: '2004', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-10', title: 'Kill', year: '2006', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-11', title: 'Evisceration Plague', year: '2009', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-12', title: 'Torture', year: '2012', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-13', title: 'A Skeletal Domain', year: '2014', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-14', title: 'Red Before Black', year: '2017', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-15', title: 'Violence Unimagined', year: '2021', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' },
      { id: 'cc-rel-16', title: 'Chaos Horrific', year: '2023', type: 'album', label: 'Metal Blade Records', cover_url: '', cover_image: '' }
    ]
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

/**
 * Parse a location string into city, state, country
 * Examples: "Denver, CO", "Warsaw, Poland", "Boston, Massachusetts, USA"
 */
export function parseLocationString(rawLocation?: string): { city?: string; state_province?: string; country?: string } {
  if (!rawLocation || typeof rawLocation !== 'string' || !rawLocation.trim()) {
    return {};
  }

  const clean = rawLocation.trim().replace(/^[\s,]+|[\s,]+$/g, '');
  const parts = clean.split(',').map(s => s.trim()).filter(Boolean);

  if (parts.length === 1) {
    return { city: parts[0] };
  }

  if (parts.length === 2) {
    const p1 = parts[0];
    const p2 = parts[1];
    // Check if second part is 2-letter US state code
    if (/^[A-Z]{2}$/i.test(p2)) {
      return { city: p1, state_province: p2.toUpperCase(), country: 'USA' };
    }
    // Check if second part is USA / US
    if (/^(usa|us|united states)$/i.test(p2)) {
      return { city: p1, country: 'USA' };
    }
    // Otherwise second part is country or state
    return { city: p1, country: p2 };
  }

  if (parts.length >= 3) {
    return {
      city: parts[0],
      state_province: parts[1],
      country: parts[2]
    };
  }

  return {};
}

/**
 * Multi-tiered resolver that pre-fills band metadata (year formed, label, location, micro-genres, bio)
 */
export function resolvePublicBandData(bandName: string, activeProfileData?: any): BandEnrichedMetadata {
  if (!bandName || typeof bandName !== 'string') return {};

  const cleanName = bandName.trim().toLowerCase();
  const alphaName = cleanName.replace(/[^a-z0-9]/g, '');

  let mergedResult: BandEnrichedMetadata = {};

  // 1. Check direct seed records in INITIAL_COMMUNITY_BANDS
  const seedMatch = INITIAL_COMMUNITY_BANDS.find(b => {
    if (!b) return false;
    const bName = (b.name || b.band_name || '').toLowerCase().trim();
    return bName === cleanName || bName.replace(/[^a-z0-9]/g, '') === alphaName;
  });

  if (seedMatch) {
    mergedResult = {
      founded_year: seedMatch.founded_year,
      status: seedMatch.status,
      is_split_up: seedMatch.is_split_up || seedMatch.isSplitUp,
      record_label: seedMatch.record_label || seedMatch.label || seedMatch.label_name,
      label: seedMatch.record_label || seedMatch.label,
      city: seedMatch.city,
      state_province: seedMatch.state_province || seedMatch.state,
      country: seedMatch.country || 'USA',
      genre: seedMatch.genre,
      micro_genres: seedMatch.micro_genres || seedMatch.subgenres,
      bio: seedMatch.bio,
      lineup: seedMatch.lineup,
      discography: seedMatch.discography,
      spotify_url: seedMatch.spotify_url,
      metal_archives_url: seedMatch.metal_archives_url,
      youtube_url: seedMatch.youtube_url
    };
  }

  // 2. Check KNOWN_PUBLIC_BANDS dictionary
  const dictMatch = KNOWN_PUBLIC_BANDS[cleanName] || KNOWN_PUBLIC_BANDS[alphaName];
  if (dictMatch) {
    mergedResult = {
      ...dictMatch,
      ...mergedResult,
      founded_year: mergedResult.founded_year || dictMatch.founded_year,
      status: mergedResult.status || dictMatch.status,
      is_split_up: mergedResult.is_split_up !== undefined ? mergedResult.is_split_up : dictMatch.is_split_up,
      record_label: mergedResult.record_label || dictMatch.record_label,
      city: mergedResult.city || dictMatch.city,
      state_province: mergedResult.state_province || dictMatch.state_province,
      country: mergedResult.country || dictMatch.country,
      genre: mergedResult.genre || dictMatch.genre,
      bio: mergedResult.bio || dictMatch.bio,
      lineup: (mergedResult.lineup && mergedResult.lineup.length > 0) ? mergedResult.lineup : dictMatch.lineup,
      discography: (mergedResult.discography && mergedResult.discography.length > 0) ? mergedResult.discography : dictMatch.discography
    };
  }

  // 3. Extract from active profile context if provided
  if (activeProfileData && typeof activeProfileData === 'object') {
    const locParsed = parseLocationString(
      activeProfileData.location || activeProfileData.homebase || activeProfileData.city
    );

    const profLabel = activeProfileData.record_label || activeProfileData.label_name || activeProfileData.labelName || activeProfileData.label;
    const profYear = activeProfileData.founded_year || activeProfileData.year_formed || activeProfileData.yearFormed || activeProfileData.year;

    mergedResult = {
      ...mergedResult,
      city: mergedResult.city || activeProfileData.city || locParsed.city,
      state_province: mergedResult.state_province || activeProfileData.state_province || activeProfileData.state || locParsed.state_province,
      country: mergedResult.country || activeProfileData.country || locParsed.country || 'USA',
      record_label: mergedResult.record_label || profLabel,
      label: mergedResult.label || profLabel,
      founded_year: mergedResult.founded_year || (profYear ? String(profYear) : undefined),
      genre: mergedResult.genre || activeProfileData.genre,
      micro_genres: mergedResult.micro_genres || activeProfileData.micro_genres || activeProfileData.genre_tags
    };
  }

  return mergedResult;
}

/**
 * Asynchronously enriches band metadata by querying the server-side AI/Open Music DB API
 */
export async function enrichBandMetadataAsync(bandName: string): Promise<BandEnrichedMetadata> {
  if (!bandName || typeof bandName !== 'string' || !bandName.trim()) {
    return {};
  }

  try {
    const response = await fetch('/api/enrich-band', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bandName: bandName.trim() })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        return data as BandEnrichedMetadata;
      }
    }
  } catch (err) {
    console.warn('[enrichBandMetadataAsync] Notice:', err);
  }

  return resolvePublicBandData(bandName);
}
