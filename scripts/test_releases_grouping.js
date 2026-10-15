import fs from 'fs';
import path from 'path';

// Load releases from data/releases_cache.json
const releases = JSON.parse(fs.readFileSync('data/releases_cache.json', 'utf8'));

// Group releases by band_id and band_name
const releasesByBandId = new Map();
const releasesByBandName = new Map();

for (const rel of releases) {
  const discoRelease = {
    id: rel.id,
    title: rel.title,
    year: String(rel.release_date || rel.release_year || '2024'),
    type: rel.type || 'album',
    label: rel.label,
    catalog_id: rel.catalog_id || rel.catalogId,
    cover_url: rel.cover_url || rel.cover_image,
    cover_image: rel.cover_image || rel.cover_url,
    tracks: rel.tracks || []
  };

  const bId = String(rel.band_id || '').toLowerCase().trim();
  const bName = String(rel.band_name || rel.artist || '').toLowerCase().trim();

  if (bId) {
    const list = releasesByBandId.get(bId) || [];
    list.push(discoRelease);
    releasesByBandId.set(bId, list);
  }
  if (bName) {
    const list = releasesByBandName.get(bName) || [];
    list.push(discoRelease);
    releasesByBandName.set(bName, list);
  }
}

console.log('Releases by band id keys:', Array.from(releasesByBandId.keys()).length);
console.log('Releases by band name keys:', Array.from(releasesByBandName.keys()).length);
