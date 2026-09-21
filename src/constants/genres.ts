export interface GenreTag {
  id: string;
  label: string;
}

export interface GenreCluster {
  name: string;
  tags: GenreTag[];
}

export const MASTER_GENRES: GenreCluster[] = [
  {
    name: 'Extreme Metal',
    tags: [
      { id: 'death_metal', label: 'Death Metal' },
      { id: 'slamming_bdm', label: 'Slamming BDM' },
      { id: 'brutal_death_metal', label: 'Brutal Death Metal' },
      { id: 'brutal_deathcore', label: 'Brutal Deathcore' },
      { id: 'technical_bdm', label: 'Technical BDM' },
      { id: 'death_n_roll', label: "Death n' Roll" },
      { id: 'tech_death', label: 'Tech Death' },
      { id: 'blasting_bdm', label: 'Blasting BDM' },
      { id: 'grindcore', label: 'Grindcore' },
      { id: 'deathgrind', label: 'Deathgrind' },
      { id: 'goregrind', label: 'Goregrind' },
      { id: 'groovy_goregrind', label: 'Groovy Goregrind' },
      { id: 'cybergrind', label: 'Cybergrind' },
      { id: 'pornogrind', label: 'Pornogrind' },
      { id: 'cyber_slam', label: 'Cyber Slam' },
      { id: 'blackened_grindcore', label: 'Blackened Grindcore' },
      { id: 'noisegrind', label: 'Noisegrind' },
      { id: 'mathgrind', label: 'Mathgrind' },
      { id: 'speed_metal', label: 'Speed Metal' },
      { id: 'thrashcore', label: 'Thrashcore' },
      { id: 'thrash_metal', label: 'Thrash Metal' },
      { id: 'death_thrash', label: 'Death Thrash' },
      { id: 'melodic_death', label: 'Melodic Death' },
      { id: 'osdm', label: 'OSDM' },
      { id: 'doom', label: 'Doom' },
      { id: 'death_doom', label: 'Death Doom' },
      { id: 'black_metal', label: 'Black Metal' },
      { id: 'depressive_black_metal', label: 'Depressive Black Metal' },
      { id: 'atmospheric_black_metal', label: 'Atmospheric Black Metal' },
      { id: 'blackened_death', label: 'Blackened Death' },
      { id: 'symphonic_black', label: 'Symphonic Black' },
      { id: 'deathcore', label: 'Deathcore' },
      { id: 'progressive_death', label: 'Progressive Death' }
    ]
  },
  {
    name: 'Rock/Heavy Metal',
    tags: [
      { id: 'traditional_heavy_metal', label: 'Traditional Heavy Metal' },
      { id: 'doom_metal', label: 'Doom Metal' },
      { id: 'stoner_metal', label: 'Stoner Metal' },
      { id: 'sludge_metal', label: 'Sludge Metal' },
      { id: 'stoner_rock', label: 'Stoner Rock' },
      { id: 'prog_metal', label: 'Prog Metal' },
      { id: 'power_metal', label: 'Power Metal' },
      { id: 'alternative_rock', label: 'Alternative Rock' },
      { id: 'gothic_rock', label: 'Gothic Rock' },
      { id: 'hard_rock', label: 'Hard Rock' },
      { id: 'new_wave', label: 'New Wave' },
      { id: 'folk_metal', label: 'Folk Metal' },
      { id: 'avant_garde', label: 'Avant-garde' },
      { id: 'djent', label: 'Djent' },
      { id: 'mathcore', label: 'Mathcore' },
      { id: 'math_rock', label: 'Math Rock' },
      { id: 'shoe_gaze', label: 'Shoe Gaze' },
      { id: 'noise_rock', label: 'Noise Rock' },
      { id: 'indie_rock', label: 'Indie Rock' },
      { id: 'nu_metal', label: 'Nu Metal' }
    ]
  },
  {
    name: 'Hardcore',
    tags: [
      { id: 'traditional_hardcore', label: 'Traditional Hardcore' },
      { id: 'metalcore', label: 'Metalcore' },
      { id: 'beatdown', label: 'Beatdown' },
      { id: 'youth_crew', label: 'Youth Crew' },
      { id: 'fastcore', label: 'Fastcore' },
      { id: 'post_hardcore', label: 'Post Hardcore' },
      { id: 'melodic_hardcore', label: 'Melodic Hardcore' },
      { id: 'skarmz_scremo', label: 'Skarmz/ Scremo' },
      { id: 'power_violence', label: 'Power Violence' },
      { id: 'mincecore', label: 'Mincecore' }
    ]
  },
  {
    name: 'Punk/Alternative',
    tags: [
      { id: 'punk_rock', label: 'Punk Rock' },
      { id: 'pop_punk', label: 'Pop Punk' },
      { id: 'math_rock_punk', label: 'Math Rock' },
      { id: 'midwest_emo', label: 'Midwest Emo' },
      { id: 'skate_punk', label: 'Skate Punk' },
      { id: 'melodic_punk', label: 'Melodic Punk' },
      { id: 'indie_punk', label: 'Indie Punk' },
      { id: 'post_punk', label: 'Post Punk' },
      { id: 'grunge', label: 'Grunge' }
    ]
  },
  {
    name: 'Industrial/EDM',
    tags: [
      { id: 'ebm', label: 'EBM' },
      { id: 'synthwave', label: 'Synthwave' },
      { id: 'darkwave_cold_wave', label: 'Darkwave/ Cold Wave' },
      { id: 'aggrotech_terror_ebm', label: 'Aggrotech/ Terror EBM' },
      { id: 'techno', label: 'Techno' },
      { id: 'industrial_metal', label: 'Industrial Metal' },
      { id: 'dubstep', label: 'Dubstep' },
      { id: 'drum_and_bass', label: 'Drum & Bass' },
      { id: 'gabber_hardstyle', label: 'Gabber/ Hardstyle' },
      { id: 'breakcore', label: 'Breakcore' },
      { id: 'harsh_noise_wall', label: 'Harsh Noise Wall' },
      { id: 'witch_house', label: 'Witch House' }
    ]
  },
  {
    name: 'Hip Hop/Rap',
    tags: [
      { id: 'underground_rap', label: 'Underground Rap' },
      { id: 'trap', label: 'Trap' },
      { id: 'boom_bap', label: 'Boom Bap' },
      { id: 'phonk', label: 'Phonk' },
      { id: 'drill', label: 'Drill' },
      { id: 'cloud_rap', label: 'Cloud Rap' },
      { id: 'experimental', label: 'Experimental' },
      { id: 'grime', label: 'Grime' }
    ]
  },
  {
    name: 'Jazz',
    tags: [
      { id: 'dixieland', label: 'Dixieland' },
      { id: 'new_orleans_jazz', label: 'New Orleans Jazz' },
      { id: 'swing', label: 'Swing' },
      { id: 'big_band', label: 'Big Band' },
      { id: 'bebop', label: 'Bebop' },
      { id: 'cool_jazz', label: 'Cool Jazz' },
      { id: 'hard_bop', label: 'Hard Bop' },
      { id: 'free_jazz', label: 'Free Jazz' },
      { id: 'avant_garde_jazz', label: 'Avant-Garde Jazz' },
      { id: 'modal_jazz', label: 'Modal Jazz' },
      { id: 'dark_jazz', label: 'Dark Jazz' },
      { id: 'doom_jazz', label: 'Doom Jazz' },
      { id: 'jazz_fusion', label: 'Jazz Fusion' },
      { id: 'jazz_rock', label: 'Jazz-Rock' },
      { id: 'acid_jazz', label: 'Acid Jazz' },
      { id: 'nu_jazz', label: 'Nu Jazz' },
      { id: 'electronic_jazz', label: 'Electronic Jazz' },
      { id: 'jazzhop', label: 'Jazzhop' },
      { id: 'lo_fi_hip_hop', label: 'Lo-Fi Hip-Hop' },
      { id: 'smooth_jazz', label: 'Smooth Jazz' },
      { id: 'afrobeat', label: 'Afrobeat' },
      { id: 'afro_jazz', label: 'Afro-Jazz' },
      { id: 'bossa_nova', label: 'Bossa Nova' },
      { id: 'latin_jazz', label: 'Latin Jazz' },
      { id: 'ethno_jazz', label: 'Ethno-Jazz' },
      { id: 'jazz_manouche', label: 'Jazz Manouche' },
      { id: 'punk_jazz', label: 'Punk Jazz' },
      { id: 'no_wave_jazz', label: 'No Wave Jazz' },
      { id: 'spiritual_jazz', label: 'Spiritual Jazz' },
      { id: 'jazztronica', label: 'Jazztronica' },
      { id: 'math_jazz', label: 'Math Jazz' }
    ]
  }
];

export const MICRO_GENRES_MAP: Record<string, { id: string; label: string }[]> = {};

MASTER_GENRES.forEach(cluster => {
  MICRO_GENRES_MAP[cluster.name] = [
    { id: 'ALL', label: `All ${cluster.name}` },
    ...cluster.tags
  ];
});
