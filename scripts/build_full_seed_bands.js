import fs from 'fs';
import path from 'path';

const releases = JSON.parse(fs.readFileSync('data/releases_cache.json', 'utf8'));

// Helper to get discography for a band
function getReleasesForBand(bandId, bandName) {
  const bId = String(bandId || '').toLowerCase().trim();
  const bName = String(bandName || '').toLowerCase().trim();

  const matched = releases.filter(r => {
    const rBandId = String(r.band_id || '').toLowerCase().trim();
    const rBandName = String(r.band_name || r.artist || '').toLowerCase().trim();
    if (bId && (rBandId === bId || rBandId.replace(/-/g, '') === bId.replace(/-/g, ''))) return true;
    if (bName && rBandName && (rBandName === bName || rBandName.includes(bName) || bName.includes(rBandName))) return true;
    return false;
  });

  // Deduplicate by title
  const seen = new Set();
  const deduped = [];
  for (const r of matched) {
    const t = r.title.toLowerCase().trim();
    if (!seen.has(t)) {
      seen.add(t);
      deduped.push({
        id: r.id,
        title: r.title,
        year: String(r.release_date || r.release_year || '2024'),
        type: r.type || 'album',
        label: r.label,
        catalog_id: r.catalog_id || r.catalogId,
        cover_url: r.cover_url || r.cover_image,
        cover_image: r.cover_image || r.cover_url,
        tracks: r.tracks || []
      });
    }
  }
  return deduped;
}

// All 33 community bands definitions
const ALL_BANDS = [
  {
    id: 'b555d398-2838-4a49-878f-f7cd12d972ef',
    name: 'Cordyceps',
    genre: 'Brutal Death Metal',
    subgenres: ['Technical Death Metal', 'Slam Death Metal', 'Extreme Metal', 'Brutal Death Metal'],
    founded_year: '2014',
    city: 'Denver',
    state: 'CO',
    country: 'USA',
    record_label: 'Unique Leader Records',
    bio: 'Brutal technical death metal powerhouse from Las Vegas, Nevada / Denver, CO, signed to Unique Leader Records. Delivering bone-crushing slam grooves, hyper-technical guitar assault, and guttural vocal devastation.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1788041930287_1788041930303.jpg?t=1788041930303',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1788042390992_1788042391008.jpg?t=1788042391008',
    spotify_url: 'https://open.spotify.com/artist/5eL7qI7R6d3t9e0Vw3uP4a',
    metal_archives_url: 'https://www.metal-archives.com/bands/Cordyceps/3540465543',
    custom_slug: 'cordyceps',
    youtube_url: 'https://www.youtube.com/watch?v=qs6xYfN2YLY',
    curated_by: '@slam_archivist',
    curator_name: 'Vegas Death Metal Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1420,
    lineup: [
      { id: 'cord-0', name: 'Andre Gonzalez', role: 'Guitars / Vocals', status: 'active', years: '2014–present' },
      { id: 'cord-1', name: 'Rafael Gonzalez', role: 'Vocals', status: 'active', years: '2017–present' },
      { id: 'cord-2', name: 'DeLorean Nero', role: 'Lead Guitars', status: 'active', years: '2021–present' },
      { id: 'cord-3', name: 'Michael Nolan', role: 'Drums', status: 'active', years: '2020–present' },
      { id: 'cord-4', name: 'Chris Rosset', role: 'Bass', status: 'active', years: '2022–present' }
    ]
  },
  {
    id: '0be2c858-8f1e-45a8-9fe1-6b24776b9b92',
    name: 'Cranial Impalement',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Slam Death Metal', 'Death Metal'],
    founded_year: '2011',
    city: 'Chattanooga',
    state: 'TN',
    country: 'USA',
    record_label: 'Brutal Bands / Coyote Records',
    bio: 'Formed in Chattanooga, Tennessee, Cranial Impalement delivers blistering slam grooves, relentless blast beats, and guttural vocal devastation.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1790608983047_1790608983069.jpg?t=1790608983069',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1790608991971_1790608991978.jpg?t=1790608991978',
    spotify_url: 'https://open.spotify.com/artist/0UK1Rb40Aek175Sw0nR2Cc',
    metal_archives_url: 'https://www.metal-archives.com/bands/Cranial_Impalement/3540348996',
    custom_slug: 'cranial-impalement',
    curated_by: '@slam_archivist',
    curator_name: 'Tennessee Slam Vault',
    created_at: '2026-09-28T15:29:28.763Z',
    followers_count: 850,
    lineup: [
      { id: 'cran-1', name: 'Christopher Wirstrom', role: 'Vocals', status: 'active', years: '2011–present' },
      { id: 'cran-2', name: 'Eli Alcala', role: 'Guitar', status: 'active', years: '2011–present' },
      { id: 'cran-3', name: 'Caesar Lazo', role: 'Guitar', status: 'active', years: '2011–present' },
      { id: 'cran-4', name: 'Luke Richardson', role: 'Bass', status: 'active', years: '2011–present' },
      { id: 'cran-5', name: 'Riley Davis-McDougal', role: 'Drums', status: 'active', years: '2011–present' }
    ]
  },
  {
    id: 'fd0f4960-9329-422e-98b8-0a2e44420c1f',
    name: 'Devourment',
    genre: 'Slam Death Metal',
    subgenres: ['Brutal Death Metal', 'Slam Death Metal', 'Death Metal'],
    founded_year: '1995',
    city: 'Dallas',
    state: 'TX',
    country: 'USA',
    record_label: 'Relapse Records',
    bio: 'Widely acknowledged as the originators and godfathers of slam death metal. Formed in Dallas, Texas in 1995, Devourment established the guttural template with "Molesting the Decapitated".',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1787891338290.jpg?t=1787891338290',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1787891345437.jpg?t=1787891345437',
    spotify_url: 'https://open.spotify.com/artist/5gU6tM3qg4U8K9W2pM1e1e',
    metal_archives_url: 'https://www.metal-archives.com/bands/Devourment/493',
    custom_slug: 'devourment',
    curated_by: '@slam_originator',
    curator_name: 'Texas Slam Vault',
    created_at: '2026-01-05T12:00:00Z',
    followers_count: 5120,
    lineup: [
      { id: 'dev-1', name: 'Ruben Rosas', role: 'Lead Vocals', status: 'active', years: '1995–present' },
      { id: 'dev-2', name: 'Brad Fincher', role: 'Drums', status: 'active', years: '1995–present' },
      { id: 'dev-3', name: 'Marvin Ruiz', role: 'Guitars', status: 'active', years: '2023–present' },
      { id: 'dev-4', name: 'Dave Spencer', role: 'Bass', status: 'active', years: '2014–present' }
    ]
  },
  {
    id: '02015dd8-0c88-4fc6-b0ea-542967e0a033',
    name: 'Defeated Sanity',
    genre: 'Progressive Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Technical Death Metal', 'Progressive Metal'],
    founded_year: '1994',
    city: 'Berlin',
    state: 'Berlin',
    country: 'DE',
    record_label: 'Season of Mist / Willowtip',
    bio: 'Masterminds of technical jazz-inflected brutal death metal founded in 1994 by drummer Lille Gruber and his late father Wolfgang Teske.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1787857390098.jpg?t=1787857390098',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1787857404616.jpg?t=1787857404616',
    spotify_url: 'https://open.spotify.com/artist/7zV2U3m4v3W2g4U8K9W2pM',
    metal_archives_url: 'https://www.metal-archives.com/bands/Defeated_Sanity/3860',
    custom_slug: 'defeated-sanity',
    curated_by: '@prog_archivist',
    curator_name: 'Berlin Extreme Society',
    created_at: '2026-01-08T12:00:00Z',
    followers_count: 4210,
    lineup: [
      { id: 'ds-1', name: 'Lille Gruber', role: 'Drums', status: 'active', years: '1994–present' },
      { id: 'ds-2', name: 'Jacob Schmidt', role: 'Bass', status: 'active', years: '2005–present' },
      { id: 'ds-3', name: 'Josh Welshman', role: 'Vocals', status: 'active', years: '2016–present' },
      { id: 'ds-4', name: 'Vaughn Stoffey', role: 'Guitars', status: 'active', years: '2021–present' }
    ]
  },
  {
    id: '6d87a1cb-e50f-4943-bd87-a1cbe50f2943',
    name: 'Lividity',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal', 'Pornogrind'],
    founded_year: '1993',
    city: 'Decatur',
    state: 'IL',
    country: 'USA',
    record_label: 'Metal Age / United Guttural',
    bio: 'Formed in 1993 in Decatur, Illinois, Lividity is a veteran underground death metal outfit renowned for groovy mid-tempo blasts, guttural vocals, and raw American brutality.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1787625126838.jpg?t=1787625126838',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1787625134706.jpg?t=1787625134706',
    spotify_url: 'https://open.spotify.com/artist/5B4Xf5O2v9t4w7r2M4k8v1',
    metal_archives_url: 'https://www.metal-archives.com/bands/Lividity/1149',
    custom_slug: 'lividity',
    curated_by: '@midwest_death',
    curator_name: 'Midwest Gutter Vault',
    created_at: '2026-01-10T12:00:00Z',
    followers_count: 2150,
    lineup: [
      { id: 'liv-1', name: 'Dave Kibler', role: 'Guitars, Vocals', status: 'active', years: '1993–present' },
      { id: 'liv-2', name: 'Garrett Scanlan', role: 'Drums', status: 'active', years: '2007–present' },
      { id: 'liv-3', name: 'Jake Lahniers', role: 'Bass, Vocals', status: 'active', years: '2010–present' },
      { id: 'liv-4', name: 'Miles Ellegood', role: 'Guitars', status: 'active', years: '2023–present' }
    ]
  },
  {
    id: '436d87a1-cbe5-4f29-936d-87a1cbe50f29',
    name: 'Stabbing',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal', 'Slam Death Metal'],
    founded_year: '2021',
    city: 'Houston',
    state: 'TX',
    country: 'USA',
    record_label: 'Comatose Music',
    bio: 'Houston, Texas brutal death metal force featuring Bridget Lynch on vocals, delivering unrelenting blasts, crushing groove slams, and murderous guttural intensity.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1787803623565.jpg?t=1787803623565',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1787803632970.jpg?t=1787803632970',
    spotify_url: 'https://open.spotify.com/artist/73G7jO32VzEw5B4v1t4w8r',
    metal_archives_url: 'https://www.metal-archives.com/bands/Stabbing/3540498114',
    custom_slug: 'stabbing',
    curated_by: '@texas_slam',
    curator_name: 'Houston Underground Society',
    created_at: '2026-01-12T12:00:00Z',
    followers_count: 3100,
    lineup: [
      { id: 'stab-1', name: 'Bridget Lynch', role: 'Lead Vocals', status: 'active', years: '2021–present' },
      { id: 'stab-2', name: 'Marvin Ruiz', role: 'Guitars', status: 'active', years: '2021–present' },
      { id: 'stab-3', name: 'Mando Tovar', role: 'Bass', status: 'active', years: '2021–present' },
      { id: 'stab-4', name: 'Rene Martinez', role: 'Drums', status: 'active', years: '2021–present' }
    ]
  },
  {
    id: 'e50f2943-6d87-41cb-b50f-29436d87a1cb',
    name: 'Gorgasm',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '1994',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    record_label: 'New Standard Elite / Unique Leader',
    bio: 'Formed in Chicago in 1994, Gorgasm is a prominent and enduring force in American brutal death metal, famous for technical blast sections and punishing groove slams.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1787807876560.jpg?t=1787807876560',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1787807883534.jpg?t=1787807883534',
    spotify_url: 'https://open.spotify.com/artist/5B4Xf5O2v9t4w7r2M4k8v1',
    metal_archives_url: 'https://www.metal-archives.com/bands/Gorgasm/1175',
    custom_slug: 'gorgasm',
    curated_by: '@chicago_gore',
    curator_name: 'Chicago Death Vault',
    created_at: '2026-01-14T12:00:00Z',
    followers_count: 2450,
    lineup: [
      { id: 'gorg-1', name: 'Damian Leski', role: 'Vocals, Guitars', status: 'active', years: '1994–present' },
      { id: 'gorg-2', name: 'Anthony Voight', role: 'Bass, Vocals', status: 'active', years: '2008–present' },
      { id: 'gorg-3', name: 'Ryan Saylor', role: 'Guitars', status: 'active', years: '2010–present' },
      { id: 'gorg-4', name: 'Kyle Moeller', role: 'Drums', status: 'active', years: '2014–present' }
    ]
  },
  {
    id: '90ebf1e5-7aa7-4c0c-8bbb-054fb2c56001',
    name: 'Brodequin',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Historical Death Metal'],
    founded_year: '1998',
    city: 'Knoxville',
    state: 'TN',
    country: 'USA',
    record_label: 'Season of Mist',
    bio: 'Brodequin is known for hyper-speed historical brutal death metal chronicling medieval torture, execution methods, and dark ages atrocities.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1787864115165.jpg?t=1787864115165',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1787864121287.jpg?t=1787864121287',
    spotify_url: 'https://open.spotify.com/artist/7v2B4w8K9W2pM1e1e7zV2U',
    metal_archives_url: 'https://www.metal-archives.com/bands/Brodequin/1154',
    custom_slug: 'brodequin',
    curated_by: '@medieval_gore',
    curator_name: 'Historical Death Society',
    created_at: '2026-01-16T12:00:00Z',
    followers_count: 2890,
    lineup: [
      { id: 'brod-1', name: 'Jamie Bailey', role: 'Bass, Vocals', status: 'active', years: '1998–present' },
      { id: 'brod-2', name: 'Mike Bailey', role: 'Guitars', status: 'active', years: '1998–present' },
      { id: 'brod-3', name: 'Brennan Shackelford', role: 'Drums', status: 'active', years: '2020–present' }
    ]
  },
  {
    id: '0a145285-18e0-4792-bbde-9b3e0667f4a7',
    name: 'Putrid Pile',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '2000',
    city: 'Racine',
    state: 'WI',
    country: 'USA',
    record_label: 'Sevared Records',
    bio: 'One-man brutal death metal demolition machine founded by Shaun LaCanne in 2000 in Racine, Wisconsin. Delivering crushing riffs, programmed blast assaults, and guttural sickness.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1787866579294.jpg?t=1787866579294',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1787866585149.jpg?t=1787866585149',
    metal_archives_url: 'https://www.metal-archives.com/bands/Putrid_Pile/1225',
    custom_slug: 'putrid-pile',
    curated_by: '@wisconsin_death',
    curator_name: 'Midwest Gore Machine',
    created_at: '2026-01-18T12:00:00Z',
    followers_count: 1980,
    lineup: [
      { id: 'pp-1', name: 'Shaun LaCanne', role: 'All Instruments, Vocals, Programming', status: 'active', years: '2000–present' }
    ]
  },
  {
    id: '4179105a-20a6-4387-9c17-178b94bd668b',
    name: 'Origin',
    genre: 'Technical Death Metal',
    subgenres: ['Tech Death', 'Technical BDM'],
    founded_year: '1997',
    city: 'Topeka',
    state: 'KS',
    country: 'USA',
    record_label: 'Agonia Records / Nuclear Blast',
    bio: 'Formed in Topeka, Kansas in 1997, Origin is one of the most prominent technical death metal entities in extreme music, acclaimed for ferocious arpeggios, gravity blasts, and superhuman execution.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-avatar_1787869057607.jpg?t=1787869057607',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/community-bands/5403162d-1947-43aa-b5f6-38a1bd2a1b80/community-banner_1787869083014.jpg?t=1787869083014',
    metal_archives_url: 'https://www.metal-archives.com/bands/Origin/155',
    custom_slug: 'origin',
    curated_by: '@technical_death',
    curator_name: 'Tech Death Hub',
    created_at: '2026-01-20T12:00:00Z',
    followers_count: 3650,
    lineup: [
      { id: 'orig-1', name: 'Paul Ryan', role: 'Guitars, Vocals', status: 'active', years: '1997–present' },
      { id: 'orig-2', name: 'Mike Flores', role: 'Bass, Vocals', status: 'active', years: '2001–present' },
      { id: 'orig-3', name: 'Jason Keyser', role: 'Lead Vocals', status: 'active', years: '2011–present' },
      { id: 'orig-4', name: 'John Longstreth', role: 'Drums', status: 'active', years: '1999–present' }
    ]
  },
  {
    id: '38c79080-c416-4f03-9949-188b6a80530f',
    name: 'Necrophagist',
    genre: 'Technical Death Metal',
    subgenres: ['Neoclassical Death Metal', 'Progressive Metal', 'Technical Death Metal'],
    founded_year: '1992',
    city: 'Gaggenau',
    state: 'Baden-Württemberg',
    country: 'DE',
    record_label: 'Willowtip / Relapse Records',
    bio: 'Pioneering technical death metal band founded by Muhammed Suiçmez in 1992. Known for neoclassical guitar arpeggios, extreme technical precision, and defining albums "Epitaph" and "Onset of Putrefaction".',
    avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    spotify_url: 'https://open.spotify.com/artist/4ZgH0b67h8U7s8b1vB1e1e',
    metal_archives_url: 'https://www.metal-archives.com/bands/Necrophagist/238',
    custom_slug: 'necrophagist',
    curated_by: '@goregrinder',
    curator_name: 'Goregrind Archivist',
    created_at: '2026-01-10T12:00:00Z',
    followers_count: 2410,
    lineup: [
      { id: 'mem-1', name: 'Muhammed Suiçmez', role: 'Lead Guitars, Vocals', status: 'active', years: '1992–present' },
      { id: 'mem-2', name: 'Sami Raatikainen', role: 'Rhythm Guitars', status: 'active', years: '2006–present' },
      { id: 'mem-3', name: 'Stephan Fimmers', role: 'Bass', status: 'active', years: '2003–present' },
      { id: 'mem-4', name: 'Romain Goulon', role: 'Drums', status: 'active', years: '2008–present' }
    ]
  },
  {
    id: 'be50f294-36d8-4a1c-8e50-f29436d87a1c',
    name: 'Dying Fetus',
    genre: 'Brutal Death Metal / Grindcore',
    subgenres: ['Brutal Death Metal', 'Grindcore', 'Technical Death Metal'],
    founded_year: '1991',
    city: 'Upper Marlboro',
    state: 'MD',
    country: 'USA',
    record_label: 'Relapse Records',
    bio: 'Heavyweight icons of American brutal death metal and grindcore formed in 1991 in Maryland. Known for lethal blast beats, virtuosic dual-vocal attack, and hardcore-groove beatdowns.',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    spotify_url: 'https://open.spotify.com/artist/2vB4w8K9W2pM1e1e7zV2U',
    metal_archives_url: 'https://www.metal-archives.com/bands/Dying_Fetus/154',
    custom_slug: 'dying-fetus',
    curated_by: '@maryland_metal',
    curator_name: 'MD Death Society',
    created_at: '2026-01-05T10:00:00Z',
    followers_count: 7850,
    lineup: [
      { id: 'fetus-1', name: 'John Gallagher', role: 'Guitars, Vocals', status: 'active', years: '1991–present' },
      { id: 'fetus-2', name: 'Sean Beasley', role: 'Bass, Vocals', status: 'active', years: '2001–present' },
      { id: 'fetus-3', name: 'Trey Williams', role: 'Drums', status: 'active', years: '2007–present' }
    ]
  },
  {
    id: '09672ddf-0ce3-4145-aea2-134209abb6e1',
    name: 'Sanguisugabogg',
    genre: 'Death Metal',
    subgenres: ['Death Metal', 'Brutal Death Metal', 'Maggot Stomp'],
    founded_year: '2019',
    city: 'Columbus',
    state: 'OH',
    country: 'USA',
    record_label: 'Century Media Records',
    bio: 'Columbus, Ohio death metal outfit known for caveman riffs, repulsive gutturals, and relentless old-school heaviness. Signed to Century Media.',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    spotify_url: 'https://open.spotify.com/artist/7zV2U3m4v3W2g4U8K9W2pM',
    metal_archives_url: 'https://www.metal-archives.com/bands/Sanguisugabogg/3540456102',
    custom_slug: 'sanguisugabogg',
    curated_by: '@maggot_stomp',
    curator_name: 'Midwest Maggot Society',
    created_at: '2026-01-02T10:00:00Z',
    followers_count: 4950,
    lineup: [
      { id: 'bogg-1', name: 'Devin Swank', role: 'Vocals', status: 'active', years: '2019–present' },
      { id: 'bogg-2', name: 'Cody Davidson', role: 'Drums', status: 'active', years: '2019–present' },
      { id: 'bogg-3', name: 'Ced Davis', role: 'Guitars, Bass', status: 'active', years: '2020–present' },
      { id: 'bogg-4', name: 'Drew Arnold', role: 'Guitars, Bass', status: 'active', years: '2021–present' }
    ]
  },
  {
    id: '5b11c121-f310-471b-aef9-cecd5fea3cec',
    name: 'Mortician',
    genre: 'Death Metal / Deathgrind',
    subgenres: ['Death Metal', 'Grindcore', 'Brutal Death Metal'],
    founded_year: '1989',
    city: 'Yonkers',
    state: 'NY',
    country: 'USA',
    record_label: 'Relapse Records',
    bio: 'Legendary horror death metal/grindcore pioneer formed in Yonkers, New York in 1989 by Will Rahmer and Roger Beaujard. Renowned for low-tuned fuzz, horror movie samples, and relentless blast assaults.',
    avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    spotify_url: 'https://open.spotify.com/artist/4ZgH0b67h8U7s8b1vB1e1e',
    metal_archives_url: 'https://www.metal-archives.com/bands/Mortician/1148',
    custom_slug: 'mortician',
    curated_by: '@horror_grind',
    curator_name: 'Yonkers Horror Society',
    created_at: '2026-01-03T10:00:00Z',
    followers_count: 6120,
    lineup: [
      { id: 'mort-1', name: 'Will Rahmer', role: 'Bass, Vocals', status: 'active', years: '1989–present' },
      { id: 'mort-2', name: 'Roger Beaujard', role: 'Guitars, Drum Programming', status: 'active', years: '1991–present' }
    ]
  },
  {
    id: '75c7cabd-eb63-4cf8-a591-9583ae41fc86',
    name: 'Suffocation',
    genre: 'Brutal Technical Death Metal',
    subgenres: ['Brutal Death Metal', 'Technical Death Metal', 'NYDM'],
    founded_year: '1988',
    city: 'Long Island',
    state: 'NY',
    country: 'USA',
    record_label: 'Nuclear Blast',
    bio: 'Suffocation are considered the founding fathers of brutal and technical death metal, forging the legendary Long Island sound in 1988 with groundbreaking breakdowns, intricate riffing, and Frank Mullen\'s iconic guttural delivery.',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    spotify_url: 'https://open.spotify.com/artist/1e1e7zV2U3m4v3W2g4U8K9',
    metal_archives_url: 'https://www.metal-archives.com/bands/Suffocation/118',
    custom_slug: 'suffocation',
    curated_by: '@nydm_archives',
    curator_name: 'NYDM Legacy Archivist',
    created_at: '2026-01-01T00:00:00Z',
    followers_count: 8940,
    lineup: [
      { id: 'suff-1', name: 'Terrance Hobbs', role: 'Lead Guitars', status: 'active', years: '1988–present' },
      { id: 'suff-2', name: 'Derek Boyer', role: 'Bass', status: 'active', years: '2004–present' },
      { id: 'suff-3', name: 'Ricky Myers', role: 'Lead Vocals', status: 'active', years: '2019–present' },
      { id: 'suff-4', name: 'Charlie Errigo', role: 'Rhythm Guitars', status: 'active', years: '2016–present' }
    ]
  },
  {
    id: 'cbddb810-259b-4230-9968-3d402dfdb872',
    name: 'Virulent Excision',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal', 'Slamming BDM'],
    founded_year: '2019',
    city: 'Denison',
    state: 'TX',
    country: 'USA',
    record_label: 'Comatose Music / Extreme Underground',
    bio: 'V.E. is brutal death metal, fusing old-school NYDM weight with modern technical slam. Driven by themes of biological reconfiguration and systemic depopulation.',
    avatar_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-logo_1786739491396.jpg?t=1786739491396',
    cover_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/band-cover_1787467851123.jpg?t=1787467851123',
    metal_archives_url: 'https://www.metal-archives.com/bands/Virulent_Excision/3540459437',
    custom_slug: 'virulent-excision',
    curated_by: '@slam_archivist',
    curator_name: 'Texas Slam Vault',
    created_at: '2026-01-01T12:00:00Z',
    followers_count: 1540,
    lineup: [
      { id: 've-1', name: 'Vocals / Programming', role: 'All Instruments, Vocals', status: 'active', years: '2019–present' }
    ]
  },
  {
    id: 'f127627b-de92-4292-93a8-130e4054b9e5',
    name: 'Vader',
    genre: 'Death Metal / Thrash Metal',
    subgenres: ['Death Metal', 'Thrash Metal', 'Extreme Metal'],
    founded_year: '1983',
    city: 'Olsztyn',
    state: 'Warmia-Masuria',
    country: 'PL',
    record_label: 'Nuclear Blast / Earache Records',
    bio: 'Polish death metal legends founded in 1983 by Piotr "Peter" Wiwczarek. One of the undisputed pioneering forces in European extreme metal with acclaimed records "The Ultimate Incantation", "De Profundis", and "Litany".',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    spotify_url: 'https://open.spotify.com/artist/2qB8w8K9W2pM1e1e7zV2U',
    metal_archives_url: 'https://www.metal-archives.com/bands/Vader/145',
    custom_slug: 'vader',
    curated_by: '@polish_death',
    curator_name: 'European Death Vault',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 8400,
    lineup: [
      { id: 'vader-1', name: 'Piotr "Peter" Wiwczarek', role: 'Lead Vocals, Guitars', status: 'active', years: '1983–present' },
      { id: 'vader-2', name: 'Marek "Spider" Pająk', role: 'Guitars', status: 'active', years: '2010–present' },
      { id: 'vader-3', name: 'Tomasz "Hal" Halicki', role: 'Bass', status: 'active', years: '2011–present' },
      { id: 'vader-4', name: 'Michał Andrzejczyk', role: 'Drums', status: 'active', years: '2022–present' }
    ]
  },
  {
    id: '2f0193f8-295c-4b0a-905f-c01b18ea18a9',
    name: 'Peelingflesh',
    genre: 'Slam Death Metal / Slamming Beatdown',
    subgenres: ['Slam Death Metal', 'Beatdown Hardcore', 'Brutal Death Metal'],
    founded_year: '2021',
    city: 'Oklahoma City',
    state: 'OK',
    country: 'USA',
    record_label: 'Unique Leader Records',
    bio: 'Oklahoma City slam sensation blending bone-shattering Southern slam riffs with hip-hop mixtape aesthetics, samples, and relentless beatdowns. Signed to Unique Leader Records.',
    avatar_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&auto=format&fit=crop&q=80',
    spotify_url: 'https://open.spotify.com/artist/7zV2U3m4v3W2g4U8K9W2pM',
    metal_archives_url: 'https://www.metal-archives.com/bands/PeelingFlesh/3540492194',
    custom_slug: 'peelingflesh',
    curated_by: '@slamaholics',
    curator_name: 'Oklahoma Slam Vault',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 5320,
    lineup: [
      { id: 'pf-1', name: 'Damonteal Harris', role: 'Vocals', status: 'active', years: '2021–present' },
      { id: 'pf-2', name: 'Mychal Soto', role: 'Guitars', status: 'active', years: '2021–present' },
      { id: 'pf-3', name: 'Jason Parrish', role: 'Guitars', status: 'active', years: '2021–present' },
      { id: 'pf-4', name: 'Austin Hirom', role: 'Bass', status: 'active', years: '2021–present' },
      { id: 'pf-5', name: 'Joe Alexander', role: 'Drums', status: 'active', years: '2021–present' }
    ]
  },
  {
    id: '36d87a1c-be50-4294-86d8-7a1cbe50f294',
    name: 'Cryptopsy',
    genre: 'Technical Death Metal',
    subgenres: ['Technical Death Metal', 'Brutal Death Metal'],
    founded_year: '1988',
    city: 'Montreal',
    state: 'QC',
    country: 'CA',
    record_label: 'Nuclear Blast / Century Media',
    bio: 'Montreal extreme metal pioneers known for groundbreaking speed, chaotic jazz timing, and Flo Mounier\'s legendary drumming. Creators of the magnum opus "None So Vile".',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    spotify_url: 'https://open.spotify.com/artist/5B4Xf5O2v9t4w7r2M4k8v1',
    metal_archives_url: 'https://www.metal-archives.com/bands/Cryptopsy/115',
    custom_slug: 'cryptopsy',
    curated_by: '@montreal_metal',
    curator_name: 'Quebec Death Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 6700,
    lineup: [
      { id: 'crypt-1', name: 'Flo Mounier', role: 'Drums, Backing Vocals', status: 'active', years: '1992–present' },
      { id: 'crypt-2', name: 'Christian Donaldson', role: 'Guitars', status: 'active', years: '2005–present' },
      { id: 'crypt-3', name: 'Matt McGachy', role: 'Lead Vocals', status: 'active', years: '2007–present' },
      { id: 'crypt-4', name: 'Olivier Pinard', role: 'Bass', status: 'active', years: '2012–present' }
    ]
  },
  {
    id: 'f1fea79f-c86a-4c26-8f4f-d29b1788d8f3',
    name: 'Necroticgorebeast',
    genre: 'Brutal Slam Death Metal',
    subgenres: ['Slam Death Metal', 'Brutal Death Metal'],
    founded_year: '2017',
    city: 'Quebec City',
    state: 'QC',
    country: 'CA',
    record_label: 'Comatose Music',
    bio: 'Heavy-hitting Canadian slam death metal juggernaut formed in Quebec. Punishing grooves, guttural vocal devastation, and ruthless precision.',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    metal_archives_url: 'https://www.metal-archives.com/bands/Necroticgorebeast/3540458110',
    custom_slug: 'necroticgorebeast',
    curated_by: '@slam_vault',
    curator_name: 'Canadian Slam Vault',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 2200,
    lineup: [
      { id: 'ngb-1', name: 'John Mayer', role: 'Vocals', status: 'active', years: '2017–present' },
      { id: 'ngb-2', name: 'Alex Brochu', role: 'Guitars', status: 'active', years: '2017–present' }
    ]
  },
  {
    id: '50f29436-d87a-4cbe-a0f2-9436d87a1cbe',
    name: 'Analepsy',
    genre: 'Brutal Slam Death Metal',
    subgenres: ['Slam Death Metal', 'Brutal Death Metal'],
    founded_year: '2013',
    city: 'Lisbon',
    state: 'Lisbon',
    country: 'PT',
    record_label: 'Agonia Records / Miasma Records',
    bio: 'Portuguese slam death metal masters founded in Lisbon in 2013. Blending galactic cosmic themes with punishing slam grooves and razor-sharp modern production.',
    avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    metal_archives_url: 'https://www.metal-archives.com/bands/Analepsy/3540391234',
    custom_slug: 'analepsy',
    curated_by: '@iberian_slam',
    curator_name: 'Iberian Slam Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 3100,
    lineup: [
      { id: 'anl-1', name: 'Marco Cadau', role: 'Guitars', status: 'active', years: '2013–present' },
      { id: 'anl-2', name: 'Calin Paraschiv', role: 'Vocals, Guitars', status: 'active', years: '2020–present' }
    ]
  },
  {
    id: 'cb1dfda9-ddd9-4ab6-bf5a-d40ed2c8a486',
    name: 'Party Cannon',
    genre: 'Party Slam Death Metal / Grindcore',
    subgenres: ['Party Slam', 'Brutal Death Metal', 'Grindcore'],
    founded_year: '2010',
    city: 'Dunfermline',
    state: 'Fife',
    country: 'UK',
    record_label: 'Unique Leader Records / Gore House',
    bio: 'Scottish party death metal innovators famous for contrasting cheerful Fisher-Price typography with brutally crushing slamming death metal.',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&auto=format&fit=crop&q=80',
    metal_archives_url: 'https://www.metal-archives.com/bands/Party_Cannon/3540342918',
    custom_slug: 'party-cannon',
    curated_by: '@party_slam',
    curator_name: 'Scottish Slam Vault',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 4600,
    lineup: [
      { id: 'pc-1', name: 'Stony', role: 'Vocals', status: 'active', years: '2010–present' },
      { id: 'pc-2', name: 'Jack', role: 'Guitars', status: 'active', years: '2010–present' },
      { id: 'pc-3', name: 'Craig', role: 'Guitars', status: 'active', years: '2011–present' },
      { id: 'pc-4', name: 'Cluney', role: 'Bass', status: 'active', years: '2010–present' },
      { id: 'pc-5', name: 'Martin', role: 'Drums', status: 'active', years: '2010–present' }
    ]
  },
  {
    id: 'f5a73a33-a1ec-4871-8a80-9510ba5d810e',
    name: 'Mortal Torment',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '2005',
    city: 'Athens',
    state: 'Attica',
    country: 'GR',
    record_label: 'Unique Leader Records',
    bio: 'Greek brutal death metal masters delivering hyper-groove blast sections, guttural filth, and uncompromising precision.',
    avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    metal_archives_url: 'https://www.metal-archives.com/bands/Mortal_Torment/108991',
    custom_slug: 'mortal-torment',
    curated_by: '@athens_death',
    curator_name: 'Hellenic Death Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1850,
    lineup: [
      { id: 'mt-1', name: 'John', role: 'Vocals', status: 'active', years: '2005–present' },
      { id: 'mt-2', name: 'Vagelis', role: 'Guitars', status: 'active', years: '2005–present' }
    ]
  },
  {
    id: '54bc33d4-6897-45bf-adcd-305ef8fe15e1',
    name: 'Sect of Execration',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '1997',
    city: 'Houston',
    state: 'TX',
    country: 'USA',
    record_label: 'Extreme Souls Production',
    bio: 'Texas underground brutal death metal cult formed in Houston. Acclaimed for the underground classic "Baptized Through Blasphemy".',
    avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'sect-of-execration',
    curated_by: '@texas_slam',
    curator_name: 'Houston Underground Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1250,
    lineup: [
      { id: 'soe-1', name: 'Willie Smith', role: 'Drums', status: 'active', years: '1997–present' }
    ]
  },
  {
    id: '41332dc1-e396-4ea3-b0bf-87e3c7449c4d',
    name: 'Kill Everything',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '2016',
    city: 'Houston',
    state: 'TX',
    country: 'USA',
    record_label: 'Comatose Music',
    bio: 'Brutal death metal group featuring veterans of the Texas underground, delivering ferocious grooves, high-speed blast passages, and total sonic devastation.',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'kill-everything',
    curated_by: '@texas_slam',
    curator_name: 'Houston Underground Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1400,
    lineup: [
      { id: 'ke-1', name: 'Mike Majewski', role: 'Vocals', status: 'active', years: '2016–present' }
    ]
  },
  {
    id: '9436d87a-1cbe-40f2-a436-d87a1cbe50f2',
    name: 'Regurgitation',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '1994',
    city: 'Washington Court House',
    state: 'OH',
    country: 'USA',
    record_label: 'Ablated Records',
    bio: 'Legendary Ohio brutal death metal band known for the classic album "Tales of Necrophilia", featuring crushing blast beats and guttural savagery.',
    avatar_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'regurgitation',
    curated_by: '@ohio_death',
    curator_name: 'Ohio Death Vault',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1650,
    lineup: [
      { id: 'reg-1', name: 'Ben Deskins', role: 'Guitars, Vocals', status: 'active', years: '1994–present' }
    ]
  },
  {
    id: '22ec10e1-c53b-42e4-bef2-b178a981bbc4',
    name: 'Incinerate',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '1998',
    city: 'Minneapolis',
    state: 'MN',
    country: 'USA',
    record_label: 'Comatose Music',
    bio: 'High-speed technical brutal death metal powerhouse delivering razor-sharp riffs, relentless blasts, and guttural fury across multiple acclaimed records.',
    avatar_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'incinerate',
    curated_by: '@midwest_death',
    curator_name: 'Midwest Extreme Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1750,
    lineup: [
      { id: 'inc-1', name: 'Scott Reigel', role: 'Vocals', status: 'active', years: '1998–present' }
    ]
  },
  {
    id: '23d6d1c0-c960-49fe-8ad3-cc09a002a6bf',
    name: 'Despondency',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '1999',
    city: 'Bremen',
    state: 'Bremen',
    country: 'DE',
    record_label: 'Black Sunset / Powerground',
    bio: 'German technical brutal death metal unit from Bremen, delivering punishing blast speed and technical groove precision since 1999.',
    avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'despondency',
    curated_by: '@euro_death',
    curator_name: 'Bremen Death Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1500,
    lineup: [
      { id: 'desp-1', name: 'Mike Scheuer', role: 'Guitars', status: 'active', years: '1999–present' }
    ]
  },
  {
    id: '7065a825-2935-454d-9bb6-3b0398ee76c2',
    name: 'Unmerciful',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '2001',
    city: 'Topeka',
    state: 'KS',
    country: 'USA',
    record_label: 'Willowtip Records',
    bio: 'Topeka, Kansas brutal death metal onslaught featuring members of Origin, delivering blistering blast speed and relentless aggression.',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'unmerciful',
    curated_by: '@midwest_death',
    curator_name: 'Midwest Extreme Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1900,
    lineup: [
      { id: 'unm-1', name: 'Clint Appelhanz', role: 'Guitars, Bass', status: 'active', years: '2001–present' }
    ]
  },
  {
    id: 'efdcab30-edcd-4ecf-80e2-12d3088a7644',
    name: 'Molested Divinity',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '2016',
    city: 'Istanbul',
    state: 'Istanbul',
    country: 'TR',
    record_label: 'Rotten Music',
    bio: 'Turkish brutal death metal force from Istanbul, delivering crushing blast speed, serpentine technical riffs, and deep guttural devastation.',
    avatar_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'molested-divinity',
    curated_by: '@rotten_archives',
    curator_name: 'Anatolian Death Society',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1600,
    lineup: [
      { id: 'md-1', name: 'Batu Çetin', role: 'Vocals', status: 'active', years: '2016–present' }
    ]
  },
  {
    id: 'd4d38e2e-6ece-45fa-bc11-061063e49eb3',
    name: 'Between the Killings',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '2020',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    record_label: 'Comatose Music',
    bio: 'Texas brutal death metal wrecking crew delivering unrelenting technical slam and guttural devastation.',
    avatar_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'between-the-killings',
    curated_by: '@texas_slam',
    curator_name: 'Texas Slam Vault',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 1100,
    lineup: [
      { id: 'btk-1', name: 'Lead', role: 'All Instruments, Vocals', status: 'active', years: '2020–present' }
    ]
  },
  {
    id: '874d3d3b-45c7-486e-8a76-6562513f89e7',
    name: 'Human Artifacts',
    genre: 'Brutal Death Metal',
    subgenres: ['Brutal Death Metal', 'Death Metal'],
    founded_year: '2022',
    city: 'Dallas',
    state: 'TX',
    country: 'USA',
    record_label: 'Independent',
    bio: 'Dallas, Texas extreme underground brutal death metal project delivering crushing guttural riffs and sonic intensity.',
    avatar_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'human-artifacts',
    curated_by: '@texas_slam',
    curator_name: 'Texas Slam Vault',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 950,
    lineup: [
      { id: 'ha-1', name: 'Member', role: 'All Instruments, Vocals', status: 'active', years: '2022–present' }
    ]
  },
  {
    id: 'e92b2b1d-a0c1-4a9d-b393-fb0f825504c5',
    name: 'Necessary Death',
    genre: 'Slam Death Metal',
    subgenres: ['Slam Death Metal', 'Brutal Death Metal'],
    founded_year: '2022',
    city: 'Houston',
    state: 'TX',
    country: 'USA',
    record_label: 'Independent',
    bio: 'Heavyweight Texas slamming death metal project delivering devastating downtuned riffs and guttural vocals.',
    avatar_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&auto=format&fit=crop&q=80',
    custom_slug: 'necessary-death',
    curated_by: '@texas_slam',
    curator_name: 'Texas Slam Vault',
    created_at: '2026-01-01T10:00:00Z',
    followers_count: 890,
    lineup: [
      { id: 'nd-1', name: 'Member', role: 'All Instruments, Vocals', status: 'active', years: '2022–present' }
    ]
  }
];

// Add discography to every band
const processedBands = ALL_BANDS.map(b => {
  const disco = getReleasesForBand(b.id, b.name);
  return {
    ...b,
    band_name: b.name,
    micro_genres: b.subgenres,
    state_province: b.state,
    avatar: b.avatar_url,
    logo_url: b.avatar_url,
    image: b.avatar_url,
    banner_url: b.cover_url,
    verification_status: b.name === 'Virulent Excision' ? 'verified_official' : 'community_archive',
    discography: disco
  };
});

console.log('Total processed bands:', processedBands.length);
processedBands.forEach(b => {
  console.log('Band:', b.name, '| Discography items:', b.discography.length);
});

// Generate TypeScript file content
const fileHeader = `import { CommunityBandRecord } from './communityBands';

export const INITIAL_COMMUNITY_BANDS: CommunityBandRecord[] = `;

const fileFooter = `;

/**
 * Checks if a band ID or name belongs to community band archives or non-personal artist catalogs.
 * Note: Virulent Excision (cbddb810-259b-4230-9968-3d402dfdb872) is the user's official registered band and NOT a community archive.
 */
export function isCommunityBandRecord(idOrName?: string): boolean {
  if (!idOrName || typeof idOrName !== 'string') return false;
  const clean = idOrName.toLowerCase().trim();
  const cleanAlpha = clean.replace(/[^a-z0-9]/g, '');

  // Virulent Excision is the user's official band workspace, never treated as community archive
  if (clean === 'cbddb810-259b-4230-9968-3d402dfdb872' || cleanAlpha.includes('virulentexcision') || clean.includes('virulent excision')) {
    return false;
  }

  // Explicit community band identifiers
  if (cleanAlpha.includes('necroticgorebeast') || clean.includes('necroticgorebeast') || cleanAlpha.includes('molesteddivinity') || cleanAlpha.includes('dyingfetus') || clean.includes('vader') || cleanAlpha.includes('peelingflesh')) {
    return true;
  }

  for (const b of INITIAL_COMMUNITY_BANDS) {
    if (b.id === 'cbddb810-259b-4230-9968-3d402dfdb872' || (b.name || '').toLowerCase().trim() === 'virulent excision') {
      continue;
    }
    if (b.id.toLowerCase() === clean) return true;
    const bName = (b.name || '').toLowerCase().trim();
    if (bName === clean || bName.replace(/[^a-z0-9]/g, '') === cleanAlpha) return true;
    if (b.custom_slug && b.custom_slug.toLowerCase() === clean) return true;
  }

  // Check dynamic community archives stored locally
  try {
    const rawArchives = localStorage.getItem('nexus_community_band_archives');
    if (rawArchives) {
      const archives = JSON.parse(rawArchives);
      if (Array.isArray(archives)) {
        for (const item of archives) {
          if (!item) continue;
          if (item.id && String(item.id).toLowerCase() === clean) return true;
          const iName = String(item.name || item.band_name || '').toLowerCase().trim();
          if (iName && (iName === clean || iName.replace(/[^a-z0-9]/g, '') === cleanAlpha)) return true;
        }
      }
    }
  } catch (_) {}

  return false;
}
`;

const tsContent = fileHeader + JSON.stringify(processedBands, null, 2) + fileFooter;
fs.writeFileSync('src/lib/seedBandsData.ts', tsContent, 'utf8');
console.log('Successfully wrote src/lib/seedBandsData.ts!');
