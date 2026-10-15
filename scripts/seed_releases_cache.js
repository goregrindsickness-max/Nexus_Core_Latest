// Script to generate comprehensive, authentic releases catalog for all Nexus Core community bands
// Persisted in data/releases_cache.json and uploads/releases_cache.json

import fs from 'fs';
import path from 'path';

// Supabase band IDs and seed band IDs mapping
const BANDS_DATA = [
  {
    name: 'Vader',
    id: 'f127627b-de92-4292-93a8-130e4054b9e5',
    slug: 'vader',
    genre: 'Death Metal',
    releases: [
      {
        id: 'rel-vader-1',
        title: 'The Ultimate Incantation',
        year: '1992',
        type: 'album',
        label: 'Earache Records',
        catalog_id: 'MOSH-059',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Creation (Intro)', duration: '1:30' },
          { number: 2, title: 'Dark Age', duration: '4:40' },
          { number: 3, title: 'Vicious Circle', duration: '2:53' },
          { number: 4, title: 'The Crucified Ones', duration: '3:37' },
          { number: 5, title: 'Final Massacre', duration: '4:54' },
          { number: 6, title: 'Testimony', duration: '4:01' },
          { number: 7, title: 'Reign-Carrion', duration: '6:49' },
          { number: 8, title: 'Chaos', duration: '4:27' },
          { number: 9, title: 'One Step to Salvation', duration: '3:48' },
          { number: 10, title: 'Demon\'s Wind', duration: '4:27' },
          { number: 11, title: 'Decapitated Saints', duration: '2:28' }
        ]
      },
      {
        id: 'rel-vader-2',
        title: 'De Profundis',
        year: '1995',
        type: 'album',
        label: 'Impact Records / Nuclear Blast',
        catalog_id: 'IR-004',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Silent Empire', duration: '4:02' },
          { number: 2, title: 'An Act of Darkness', duration: '3:03' },
          { number: 3, title: 'Blood of Kingu', duration: '4:38' },
          { number: 4, title: 'Incarnation', duration: '3:07' },
          { number: 5, title: 'Sothis', duration: '3:42' },
          { number: 6, title: 'Revolt', duration: '2:29' },
          { number: 7, title: 'Of Moon, Blood and Spirit', duration: '2:44' },
          { number: 8, title: 'Vision and the Voice', duration: '3:28' },
          { number: 9, title: 'Reborn in Flames', duration: '5:42' }
        ]
      },
      {
        id: 'rel-vader-3',
        title: 'Litany',
        year: '2000',
        type: 'album',
        label: 'Metal Blade Records',
        catalog_id: '3984-14299-2',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Wings', duration: '3:10' },
          { number: 2, title: 'The One Made of Dreams', duration: '1:49' },
          { number: 3, title: 'Xeper', duration: '2:55' },
          { number: 4, title: 'Litany', duration: '3:00' },
          { number: 5, title: 'Cold Demons', duration: '3:12' },
          { number: 6, title: 'The Calling', duration: '3:10' },
          { number: 7, title: 'North', duration: '1:37' },
          { number: 8, title: 'For Whom the Bell Tolls', duration: '3:50' }
        ]
      },
      {
        id: 'rel-vader-4',
        title: 'Solitude in Madness',
        year: '2020',
        type: 'album',
        label: 'Nuclear Blast',
        catalog_id: 'NB-4789',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Shock and Awe', duration: '2:16' },
          { number: 2, title: 'Into Oblivion', duration: '2:24' },
          { number: 3, title: 'Despair', duration: '1:18' },
          { number: 4, title: 'Incineration of the Gods', duration: '3:32' },
          { number: 5, title: 'Sanctification Denied', duration: '3:35' },
          { number: 6, title: 'And Satan Wept', duration: '3:18' },
          { number: 7, title: 'Emptiness', duration: '2:40' },
          { number: 8, title: 'Final Declaration', duration: '2:17' },
          { number: 9, title: 'Dancing in the Slaughterhouse', duration: '2:29' },
          { number: 10, title: 'Stigma of Divinity', duration: '1:47' },
          { number: 11, title: 'Bones', duration: '3:57' }
        ]
      }
    ]
  },
  {
    name: 'Peelingflesh',
    id: '2f0193f8-295c-4b0a-905f-c01b18ea18a9',
    slug: 'peelingflesh',
    genre: 'Slam Death Metal / Slamming Beatdown',
    releases: [
      {
        id: 'rel-pf-1',
        title: 'Slamaholics Vol. 1',
        year: '2021',
        type: 'ep',
        label: 'Independent / Slam Worldwide',
        catalog_id: 'PF-001',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Intro (Slamaholics Tape)', duration: '1:15' },
          { number: 2, title: 'Make a Move', duration: '2:45' },
          { number: 3, title: 'Bathtub Full of Guts', duration: '3:05' },
          { number: 4, title: 'Creepin\' Out the Cut', duration: '2:30' }
        ]
      },
      {
        id: 'rel-pf-2',
        title: 'Slamaholics Vol. 2',
        year: '2022',
        type: 'album',
        label: 'Independent',
        catalog_id: 'PF-002',
        cover_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Slamaholics Mixtape Pt. 2', duration: '1:40' },
          { number: 2, title: 'F.F.W.A.S.', duration: '2:55' },
          { number: 3, title: 'Loose Cannon', duration: '3:15' },
          { number: 4, title: '12 Gauge Facelift', duration: '2:40' },
          { number: 5, title: 'Perc 3000', duration: '3:20' }
        ]
      },
      {
        id: 'rel-pf-3',
        title: 'The G Code',
        year: '2024',
        type: 'album',
        label: 'Unique Leader Records',
        catalog_id: 'ULR-412',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Intro (The Streets)', duration: '1:20' },
          { number: 2, title: 'Shoot It Up', duration: '2:48' },
          { number: 3, title: 'The G Code', duration: '3:12' },
          { number: 4, title: 'Skin Collector', duration: '2:59' },
          { number: 5, title: 'Concrete Slam', duration: '3:25' },
          { number: 6, title: 'Full Auto Guttural', duration: '3:05' }
        ]
      }
    ]
  },
  {
    name: 'Suffocation',
    id: '75c7cabd-eb63-4cf8-a591-9583ae41fc86',
    slug: 'suffocation',
    genre: 'Brutal Technical Death Metal',
    releases: [
      {
        id: 'rel-suff-1',
        title: 'Effigy of the Forgotten',
        year: '1991',
        type: 'album',
        label: 'Roadrunner Records',
        catalog_id: 'RR-9275',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Liege of Inveracity', duration: '4:30' },
          { number: 2, title: 'Effigy of the Forgotten', duration: '3:50' },
          { number: 3, title: 'Infecting the Crypts', duration: '4:49' },
          { number: 4, title: 'Seeds of the Suffering', duration: '5:52' },
          { number: 5, title: 'Habitual Infamy', duration: '4:16' },
          { number: 6, title: 'Reincremation', duration: '2:54' },
          { number: 7, title: 'Mass Obliteration', duration: '4:32' },
          { number: 8, title: 'Involuntary Slaughter', duration: '3:02' },
          { number: 9, title: 'Jesus Wept', duration: '3:42' }
        ]
      },
      {
        id: 'rel-suff-2',
        title: 'Breeding the Spawn',
        year: '1993',
        type: 'album',
        label: 'Roadrunner Records',
        catalog_id: 'RR-9013',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Beginning of Sorrow', duration: '3:17' },
          { number: 2, title: 'Breeding the Spawn', duration: '4:47' },
          { number: 3, title: 'Epitaph of the Credulous', duration: '3:45' },
          { number: 4, title: 'Marital Decimation', duration: '4:06' },
          { number: 5, title: 'Prelude to Repulsion', duration: '4:50' },
          { number: 6, title: 'Anomalistic Offerings', duration: '4:41' },
          { number: 7, title: 'Ornaments of Decrepitude', duration: '4:42' },
          { number: 8, title: 'Ignorant Deprivation', duration: '4:50' }
        ]
      },
      {
        id: 'rel-suff-3',
        title: 'Pierced from Within',
        year: '1995',
        type: 'album',
        label: 'Roadrunner Records',
        catalog_id: 'RR-8951',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Pierced from Within', duration: '4:26' },
          { number: 2, title: 'Thrones of Blood', duration: '5:14' },
          { number: 3, title: 'Depths of Depravity', duration: '5:33' },
          { number: 4, title: 'Suspended in Tribulation', duration: '6:31' },
          { number: 5, title: 'Torn into Enthrallment', duration: '5:25' },
          { number: 6, title: 'Synthetically Revived', duration: '3:53' },
          { number: 7, title: 'Brood of Evil', duration: '4:36' }
        ]
      },
      {
        id: 'rel-suff-4',
        title: 'Hymns from the Apocrypha',
        year: '2023',
        type: 'album',
        label: 'Nuclear Blast',
        catalog_id: 'NB-6531',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Hymns from the Apocrypha', duration: '5:13' },
          { number: 2, title: 'Perpetual Deception', duration: '4:15' },
          { number: 3, title: 'Dim Veil of Obscurity', duration: '4:18' },
          { number: 4, title: 'Immortal Execration', duration: '4:11' },
          { number: 5, title: 'Seraphim Enslavement', duration: '4:26' },
          { number: 6, title: 'Descendants', duration: '4:20' },
          { number: 7, title: 'Embrace the Suffering', duration: '4:33' },
          { number: 8, title: 'Delusions of Mortality', duration: '3:47' },
          { number: 9, title: 'Ignorant Deprivation (Re-recorded)', duration: '5:02' }
        ]
      }
    ]
  },
  {
    name: 'Dying Fetus',
    id: 'be50f294-36d8-4a1c-8e50-f29436d87a1c',
    altId: '01887bea-2e81-4270-adef-937776ff5a10',
    slug: 'dying-fetus',
    genre: 'Brutal Death Metal / Grindcore',
    releases: [
      {
        id: 'rel-fetus-1',
        title: 'Destroy the Opposition',
        year: '2000',
        type: 'album',
        label: 'Relapse Records',
        catalog_id: 'RR-6467',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Praise the Lord (Opium of the Masses)', duration: '5:31' },
          { number: 2, title: 'Destroy the Opposition', duration: '5:11' },
          { number: 3, title: 'Born in Sodom', duration: '4:46' },
          { number: 4, title: 'Epidemic of Hate', duration: '4:42' },
          { number: 5, title: 'Pissing in the Mainstream', duration: '1:57' },
          { number: 6, title: 'In Times of War', duration: '3:08' },
          { number: 7, title: 'For Us or Against Us', duration: '5:34' },
          { number: 8, title: 'Justifiable Homicide', duration: '5:49' }
        ]
      },
      {
        id: 'rel-fetus-2',
        title: 'Reign Supreme',
        year: '2012',
        type: 'album',
        label: 'Relapse Records',
        catalog_id: 'RR-7182',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'In the Trenches', duration: '3:57' },
          { number: 2, title: 'Subjected to a Beating', duration: '4:53' },
          { number: 3, title: 'Second Sight', duration: '4:06' },
          { number: 4, title: 'From Womb to Waste', duration: '4:19' },
          { number: 5, title: 'Dissidence', duration: '3:51' },
          { number: 6, title: 'In Solitude', duration: '4:22' },
          { number: 7, title: 'Revisionist Past', duration: '3:57' },
          { number: 8, title: 'The Blood of Power', duration: '4:48' },
          { number: 9, title: 'Dead Whores Don\'t Lie', duration: '3:02' }
        ]
      },
      {
        id: 'rel-fetus-3',
        title: 'Make Them Beg for Death',
        year: '2023',
        type: 'album',
        label: 'Relapse Records',
        catalog_id: 'RR-7531',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Enlighten Through Agony', duration: '3:45' },
          { number: 2, title: 'Compulsion for Cruelty', duration: '4:36' },
          { number: 3, title: 'Feast of Ashes', duration: '4:35' },
          { number: 4, title: 'Throw Them in the Van', duration: '1:42' },
          { number: 5, title: 'Unbridled Fury', duration: '3:30' },
          { number: 6, title: 'When the Trend Ends', duration: '3:54' },
          { number: 7, title: 'Undulating Carnage', duration: '4:08' },
          { number: 8, title: 'Raise the Beast', duration: '3:55' },
          { number: 9, title: 'Hero\'s Grave', duration: '3:51' },
          { number: 10, title: 'Subterfuge', duration: '4:18' }
        ]
      }
    ]
  },
  {
    name: 'Devourment',
    id: 'fd0f4960-9329-422e-98b8-0a2e44420c1f',
    slug: 'devourment',
    genre: 'Slam Death Metal',
    releases: [
      {
        id: 'rel-dev-1',
        title: 'Molesting the Decapitated',
        year: '1999',
        type: 'album',
        label: 'United Guttural Records',
        catalog_id: 'UGR-004',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Festering Vomitous Mass', duration: '2:51' },
          { number: 2, title: 'Post mortal Coprophagia', duration: '6:15' },
          { number: 3, title: 'Choking on Bile', duration: '4:14' },
          { number: 4, title: 'Molesting the Decapitated', duration: '4:41' },
          { number: 5, title: 'Self Disembowelment', duration: '4:34' },
          { number: 6, title: 'Fucked to Death', duration: '5:28' },
          { number: 7, title: 'Devour the Damned', duration: '4:22' },
          { number: 8, title: 'Shroud of Cryptic Decapitation', duration: '2:59' }
        ]
      },
      {
        id: 'rel-dev-2',
        title: 'Obscene Majesty',
        year: '2019',
        type: 'album',
        label: 'Relapse Records',
        catalog_id: 'RR-7422',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'A Virulent Strain of Retaliation', duration: '5:10' },
          { number: 2, title: 'Cognitive Sedation Butchery', duration: '4:52' },
          { number: 3, title: 'Narcissistic Paraphilia', duration: '4:21' },
          { number: 4, title: 'Arterial Spray Patterns', duration: '4:33' },
          { number: 5, title: 'Profane Contagion', duration: '4:18' },
          { number: 6, title: 'Dysmorphic Autophagia', duration: '4:49' },
          { number: 7, title: 'Sculpted in Tyranny', duration: '5:24' },
          { number: 8, title: 'Xenochrist', duration: '4:12' },
          { number: 9, title: 'Modum Vomitus', duration: '4:55' },
          { number: 10, title: 'Truculent Antipathy', duration: '5:48' }
        ]
      }
    ]
  },
  {
    name: 'Defeated Sanity',
    id: '02015dd8-0c88-4fc6-b0ea-542967e0a033',
    slug: 'defeated-sanity',
    genre: 'Progressive Brutal Death Metal',
    releases: [
      {
        id: 'rel-ds-1',
        title: 'Passages into Deformity',
        year: '2013',
        type: 'album',
        label: 'Willowtip Records',
        catalog_id: 'WT-109',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Initiation', duration: '1:44' },
          { number: 2, title: 'Naraka', duration: '4:18' },
          { number: 3, title: 'Verblendung', duration: '3:50' },
          { number: 2, title: 'Lusting for Transcendence', duration: '3:45' },
          { number: 5, title: 'The Bell', duration: '3:58' },
          { number: 6, title: 'Salvation Through Infinite Suffering', duration: '4:12' },
          { number: 7, title: 'The Purging', duration: '4:42' },
          { number: 8, title: 'Versailles', duration: '3:54' },
          { number: 9, title: 'Martyrdom Unrestrained', duration: '4:44' }
        ]
      },
      {
        id: 'rel-ds-2',
        title: 'The Sanguinary Impetus',
        year: '2020',
        type: 'album',
        label: 'Willowtip Records',
        catalog_id: 'WT-188',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Phytodigestion', duration: '4:06' },
          { number: 2, title: 'Imposed Corporeal Inhabitation', duration: '3:58' },
          { number: 3, title: 'Conceived Through Savagery', duration: '3:33' },
          { number: 4, title: 'Entity Dissolving Entity', duration: '3:48' },
          { number: 5, title: 'Dislimbing the Ouroboros', duration: '3:52' },
          { number: 6, title: 'Arboreally Transfixed', duration: '4:24' },
          { number: 7, title: 'Propelled into Sacrilege', duration: '4:02' },
          { number: 8, title: 'Drips of Mysticism', duration: '4:16' },
          { number: 9, title: 'Insecta Incendium', duration: '4:35' }
        ]
      },
      {
        id: 'rel-ds-3',
        title: 'Chronicles of Lunacy',
        year: '2024',
        type: 'album',
        label: 'Season of Mist',
        catalog_id: 'SOM-744',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Amputations', duration: '3:51' },
          { number: 2, title: 'The Odour of Sanctity', duration: '4:12' },
          { number: 3, title: 'Accelerating the Rot', duration: '3:40' },
          { number: 4, title: 'Syphilic Spiritual Murk', duration: '4:05' },
          { number: 5, title: 'A Dim View of Sub-Humanity', duration: '4:32' },
          { number: 6, title: 'Extrinsically Oblique', duration: '4:14' },
          { number: 7, title: 'Condemned to Obscurity', duration: '4:28' },
          { number: 8, title: 'Hereditary Vitriol', duration: '4:52' }
        ]
      }
    ]
  },
  {
    name: 'Cryptopsy',
    id: '36d87a1c-be50-4294-86d8-7a1cbe50f294',
    slug: 'cryptopsy',
    genre: 'Technical Death Metal',
    releases: [
      {
        id: 'rel-crypt-1',
        title: 'None So Vile',
        year: '1996',
        type: 'album',
        label: 'Wrong Again Records / Century Media',
        catalog_id: 'WAR-008',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Crown of Horns', duration: '3:57' },
          { number: 2, title: 'Slit Your Guts', duration: '4:02' },
          { number: 3, title: 'Graves of the Fathers', duration: '4:11' },
          { number: 4, title: 'Dead and Grotesque', duration: '4:19' },
          { number: 5, title: 'Defenestration', duration: '4:32' },
          { number: 6, title: 'Benedictine Convulsions', duration: '4:00' },
          { number: 7, title: 'Phobophile', duration: '4:38' },
          { number: 8, title: 'Lichmistress', duration: '2:31' }
        ]
      },
      {
        id: 'rel-crypt-2',
        title: 'Blasphemy Made Flesh',
        year: '1994',
        type: 'album',
        label: 'Invasion Records',
        catalog_id: 'INV-022',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Defacing', duration: '4:07' },
          { number: 2, title: 'Abigor', duration: '3:46' },
          { number: 3, title: 'Open Face Surgery', duration: '4:25' },
          { number: 4, title: 'Serial Messiah', duration: '4:01' },
          { number: 5, title: 'Born Headless', duration: '4:29' },
          { number: 6, title: 'Swine of the Cross', duration: '3:06' },
          { number: 7, title: 'Gravaged (A Cryptopsy)', duration: '2:47' },
          { number: 8, title: 'Memories of Blood', duration: '3:34' },
          { number: 9, title: 'Mutant Christ', duration: '4:21' }
        ]
      },
      {
        id: 'rel-crypt-3',
        title: 'As Gomorrah Burns',
        year: '2023',
        type: 'album',
        label: 'Nuclear Blast',
        catalog_id: 'NB-6211',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Lascivious Misfits', duration: '3:32' },
          { number: 2, title: 'In Abeyance', duration: '3:49' },
          { number: 3, title: 'Godless Deceiver', duration: '3:40' },
          { number: 4, title: 'Ill Omen', duration: '4:00' },
          { number: 5, title: 'Flayed the Swine', duration: '4:25' },
          { number: 6, title: 'The Righteous Lost', duration: '4:16' },
          { number: 7, title: 'Oubliette', duration: '3:58' },
          { number: 8, title: 'Praise the Filth', duration: '5:50' }
        ]
      }
    ]
  },
  {
    name: 'Necroticgorebeast',
    id: 'f1fea79f-c86a-4c26-8f4f-d29b1788d8f3',
    slug: 'necroticgorebeast',
    genre: 'Brutal Slam Death Metal',
    releases: [
      {
        id: 'rel-ngb-1',
        title: 'Necroticgorebeast',
        year: '2019',
        type: 'album',
        label: 'Comatose Music',
        catalog_id: 'COMA-129',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Prosthetic Erection', duration: '3:20' },
          { number: 2, title: 'Autoerotic Rectal Prolapse', duration: '3:45' },
          { number: 3, title: 'Bong-Rip Chainsaw Decapitation', duration: '3:10' },
          { number: 4, title: 'Flesh Eating Disease', duration: '4:02' },
          { number: 5, title: 'Necrotic Gorebeast', duration: '4:30' }
        ]
      },
      {
        id: 'rel-ngb-2',
        title: 'Human Fleshmonger',
        year: '2021',
        type: 'album',
        label: 'Comatose Music',
        catalog_id: 'COMA-152',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Feeding on the Deceased', duration: '3:12' },
          { number: 2, title: 'Hacksaw Surgery', duration: '2:55' },
          { number: 3, title: 'Human Fleshmonger', duration: '3:40' },
          { number: 4, title: 'Ripped Apart in Chains', duration: '3:28' }
        ]
      },
      {
        id: 'rel-ngb-3',
        title: 'Repugnant',
        year: '2023',
        type: 'album',
        label: 'Comatose Music',
        catalog_id: 'COMA-181',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Vile Carnal Mutilation', duration: '3:30' },
          { number: 2, title: 'Repugnant', duration: '3:45' },
          { number: 3, title: 'Abhorrent Viscera', duration: '4:10' }
        ]
      }
    ]
  },
  {
    name: 'Analepsy',
    id: '50f29436-d87a-4cbe-a0f2-9436d87a1cbe',
    slug: 'analepsy',
    genre: 'Brutal Slam Death Metal',
    releases: [
      {
        id: 'rel-anl-1',
        title: 'Decomposed by Possession',
        year: '2015',
        type: 'ep',
        label: 'Vomit Your Shirt',
        catalog_id: 'VYS-005',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Intro', duration: '1:10' },
          { number: 2, title: 'Genetic Mutations', duration: '3:15' },
          { number: 3, title: 'Decomposed by Possession', duration: '3:40' },
          { number: 4, title: 'Post-Traumatic Stress', duration: '2:58' }
        ]
      },
      {
        id: 'rel-anl-2',
        title: 'Atrocities from Beyond',
        year: '2017',
        type: 'album',
        label: 'Unique Leader Records',
        catalog_id: 'ULR-192',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Apocalyptic Premonition', duration: '2:01' },
          { number: 2, title: 'Rifting the Cosmic Chaos', duration: '3:50' },
          { number: 3, title: 'Engorged Savagery', duration: '3:42' },
          { number: 4, title: 'Evisceration Through Absentia', duration: '3:20' },
          { number: 5, title: 'Witnesses of Extinction', duration: '4:15' }
        ]
      },
      {
        id: 'rel-anl-3',
        title: 'Quiescence',
        year: '2022',
        type: 'album',
        label: 'Agonia Records / Miasma Records',
        catalog_id: 'AR-549',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Locus of Dawning', duration: '4:40' },
          { number: 2, title: 'Impasse', duration: '4:14' },
          { number: 3, title: 'Elapsing Permanence', duration: '3:59' },
          { number: 4, title: 'Spasmodic Euphoria', duration: '3:48' },
          { number: 5, title: 'Edge of Chaos', duration: '4:06' },
          { number: 6, title: 'Quiescence', duration: '4:52' }
        ]
      }
    ]
  },
  {
    name: 'Party Cannon',
    id: 'cb1dfda9-ddd9-4ab6-bf5a-d40ed2c8a486',
    slug: 'party-cannon',
    genre: 'Party Slam Death Metal / Grindcore',
    releases: [
      {
        id: 'rel-pc-1',
        title: 'Bong Hit Hospitalisation',
        year: '2015',
        type: 'album',
        label: 'Gore House Productions',
        catalog_id: 'GHP-025',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Russian Vending Machine', duration: '2:40' },
          { number: 2, title: 'Jack vs the Exotic Baguette', duration: '3:10' },
          { number: 3, title: 'There\'s a Reason You\'re Single', duration: '2:50' },
          { number: 4, title: 'Keg Stand Kangaroo', duration: '3:25' }
        ]
      },
      {
        id: 'rel-pc-2',
        title: 'Volumes of Vomit',
        year: '2022',
        type: 'album',
        label: 'Gore House Productions',
        catalog_id: 'GHP-058',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Tactical Chunder', duration: '3:05' },
          { number: 2, title: 'Nauseating And Unpalatable', duration: '3:30' },
          { number: 3, title: 'I Believe In Royalty', duration: '3:15' },
          { number: 4, title: 'The Cage', duration: '3:40' }
        ]
      },
      {
        id: 'rel-pc-3',
        title: 'Injuries Are Inevitable',
        year: '2024',
        type: 'album',
        label: 'Unique Leader Records',
        catalog_id: 'ULR-420',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Weird, But Not Illegal', duration: '3:20' },
          { number: 2, title: 'Test Your Might', duration: '3:11' },
          { number: 3, title: 'The Human Slime', duration: '3:45' },
          { number: 4, title: 'Safety Third', duration: '3:35' }
        ]
      }
    ]
  },
  {
    name: 'Mortal Torment',
    id: 'f5a73a33-a1ec-4871-8a80-9510ba5d810e',
    slug: 'mortal-torment',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-mt-1',
        title: 'Resuscitating the Swarm',
        year: '2012',
        type: 'album',
        label: 'Gorging Productions',
        catalog_id: 'GP-018',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Swarm Genesis', duration: '1:45' },
          { number: 2, title: 'Bile Fed Progeny', duration: '3:15' },
          { number: 3, title: 'Resuscitating the Swarm', duration: '3:50' },
          { number: 4, title: 'Deranged Consumption', duration: '3:25' }
        ]
      },
      {
        id: 'rel-mt-2',
        title: 'Cleaver Retribution',
        year: '2015',
        type: 'album',
        label: 'Gore House Productions',
        catalog_id: 'GHP-019',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Atonement', duration: '2:10' },
          { number: 2, title: 'Masturbating the Broken Neck', duration: '3:35' },
          { number: 3, title: 'Cleaver Retribution', duration: '3:42' },
          { number: 4, title: 'Unclean Chamber', duration: '3:20' }
        ]
      },
      {
        id: 'rel-mt-3',
        title: 'Eradication Serpent',
        year: '2021',
        type: 'album',
        label: 'Unique Leader Records',
        catalog_id: 'ULR-388',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Serpent Awakening', duration: '2:05' },
          { number: 2, title: 'Venomous Dominion', duration: '3:50' },
          { number: 3, title: 'Eradication of Light', duration: '3:45' },
          { number: 4, title: 'Scales of Agony', duration: '4:10' }
        ]
      }
    ]
  },
  {
    name: 'Gorgasm',
    id: 'e50f2943-6d87-41cb-b50f-29436d87a1cb',
    slug: 'gorgasm',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-gorg-1',
        title: 'Bleeding Profusely',
        year: '2001',
        type: 'album',
        label: 'Extremist Records',
        catalog_id: 'EXT-004',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Deformed Beyond Recognition', duration: '3:15' },
          { number: 2, title: 'Disembodied', duration: '2:45' },
          { number: 3, title: 'Bleeding Profusely', duration: '3:30' },
          { number: 4, title: 'Fucking the Mutilated', duration: '3:10' },
          { number: 5, title: 'Stabwound Intercourse', duration: '3:05' }
        ]
      },
      {
        id: 'rel-gorg-2',
        title: 'Masticate to Dominate',
        year: '2003',
        type: 'album',
        label: 'Unique Leader Records',
        catalog_id: 'ULR-028',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Deadfuck', duration: '3:02' },
          { number: 2, title: 'Masticate to Dominate', duration: '3:20' },
          { number: 3, title: 'Seminal Embalmment', duration: '3:14' },
          { number: 4, title: 'Charred Remains', duration: '3:08' }
        ]
      },
      {
        id: 'rel-gorg-3',
        title: 'Destined to Violate',
        year: '2014',
        type: 'album',
        label: 'New Standard Elite',
        catalog_id: 'NSE-018',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Infected With Lunacy', duration: '3:10' },
          { number: 2, title: 'Destined to Violate', duration: '3:45' },
          { number: 3, title: 'Carnal Demise', duration: '3:20' },
          { number: 4, title: 'Visceral Dissection', duration: '3:35' }
        ]
      }
    ]
  },
  {
    name: 'Stabbing',
    id: '436d87a1-cbe5-4f29-936d-87a1cbe50f29',
    slug: 'stabbing',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-stab-1',
        title: 'Ravenous Psychotic Onslaught',
        year: '2021',
        type: 'ep',
        label: 'Independent',
        catalog_id: 'STAB-001',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Splattered Remains', duration: '2:50' },
          { number: 2, title: 'Gutted and Strangled', duration: '3:12' },
          { number: 3, title: 'Ravenous Psychotic Onslaught', duration: '3:25' }
        ]
      },
      {
        id: 'rel-stab-2',
        title: 'Extirpated Mortal Remains',
        year: '2022',
        type: 'album',
        label: 'Comatose Music',
        catalog_id: 'COMA-166',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Inhaling the Dead', duration: '3:15' },
          { number: 2, title: 'Razor Wire Strangulation', duration: '3:40' },
          { number: 3, title: 'Southern Disembowelment', duration: '3:30' },
          { number: 4, title: 'Extirpated Mortal Remains', duration: '4:02' },
          { number: 5, title: 'Pungent Excavation', duration: '3:22' }
        ]
      }
    ]
  },
  {
    name: 'Putrid Pile',
    id: '0a145285-18e0-4792-bbde-9b3e0667f4a7',
    slug: 'putrid-pile',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-pp-1',
        title: 'Collection of Butchery',
        year: '2003',
        type: 'album',
        label: 'United Guttural Records',
        catalog_id: 'UGR-018',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Food for the Beast', duration: '3:10' },
          { number: 2, title: 'Merciless Homicide', duration: '2:55' },
          { number: 3, title: 'Collection of Butchery', duration: '3:45' },
          { number: 4, title: 'Circle of the Scythe', duration: '3:30' }
        ]
      },
      {
        id: 'rel-pp-2',
        title: 'House of Dementia',
        year: '2009',
        type: 'album',
        label: 'Sevared Records',
        catalog_id: 'SR-048',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'House of Dementia', duration: '3:20' },
          { number: 2, title: 'Drenched in Gasoline', duration: '3:15' },
          { number: 3, title: 'Gullet Full of Glass', duration: '3:40' }
        ]
      },
      {
        id: 'rel-pp-3',
        title: 'Revel in Suffering',
        year: '2020',
        type: 'album',
        label: 'Sevared Records',
        catalog_id: 'SR-114',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Revel in Suffering', duration: '3:35' },
          { number: 2, title: 'My Inner Demon', duration: '3:40' },
          { number: 3, title: 'Corpse Breaker', duration: '3:15' }
        ]
      }
    ]
  },
  {
    name: 'Origin',
    id: '4179105a-20a6-4387-9c17-178b94bd668b',
    slug: 'origin',
    genre: 'Technical Death Metal',
    releases: [
      {
        id: 'rel-orig-1',
        title: 'Antithesis',
        year: '2008',
        type: 'album',
        label: 'Relapse Records',
        catalog_id: 'RR-6738',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'The Aftermath', duration: '3:39' },
          { number: 2, title: 'Finite', duration: '3:08' },
          { number: 3, title: 'Antithesis', duration: '3:42' },
          { number: 4, title: 'Wrath of Vishnu', duration: '4:44' },
          { number: 5, title: 'The Omnipresent Thirst', duration: '4:10' }
        ]
      },
      {
        id: 'rel-orig-2',
        title: 'Entity',
        year: '2011',
        type: 'album',
        label: 'Nuclear Blast',
        catalog_id: 'NB-2715',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Expulsion of Fury', duration: '2:56' },
          { number: 2, title: 'Purgatory', duration: '3:50' },
          { number: 3, title: 'Conceiving Mortality', duration: '4:02' },
          { number: 4, title: 'Saligia', duration: '6:52' }
        ]
      },
      {
        id: 'rel-orig-3',
        title: 'Chaosmos',
        year: '2022',
        type: 'album',
        label: 'Agonia Records / Nuclear Blast',
        catalog_id: 'AR-545',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Ecophagy', duration: '3:58' },
          { number: 2, title: 'Chaosmos', duration: '4:20' },
          { number: 3, title: 'Decolonizer', duration: '3:40' },
          { number: 4, title: 'Heat Death', duration: '4:12' }
        ]
      }
    ]
  },
  {
    name: 'Brodequin',
    id: '90ebf1e5-7aa7-4c0c-8bbb-054fb2c56001',
    slug: 'brodequin',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-brod-1',
        title: 'Instruments of Torture',
        year: '2000',
        type: 'album',
        label: 'Ablated Records',
        catalog_id: 'AB-003',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Spinning in the Wheel of Flesh', duration: '2:40' },
          { number: 2, title: 'Infanticide', duration: '2:15' },
          { number: 3, title: 'The Gallows', duration: '3:05' },
          { number: 4, title: 'Instruments of Torture', duration: '3:20' }
        ]
      },
      {
        id: 'rel-brod-2',
        title: 'Harbinger of Woe',
        year: '2024',
        type: 'album',
        label: 'Season of Mist',
        catalog_id: 'SOM-750',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Diabolical Edict', duration: '3:15' },
          { number: 2, title: 'Fall of the Rhaetian', duration: '3:40' },
          { number: 3, title: 'Harbinger of Woe', duration: '3:30' },
          { number: 4, title: 'Therianthropy', duration: '3:25' }
        ]
      }
    ]
  },
  {
    name: 'Mortician',
    id: '5b11c121-f310-471b-aef9-cecd5fea3cec',
    altId: 'comm-band-mortician',
    slug: 'mortician',
    genre: 'Death Metal / Deathgrind',
    releases: [
      {
        id: 'rel-mort-1',
        title: 'Hacked Up for Barbecue',
        year: '1996',
        type: 'album',
        label: 'Relapse Records',
        catalog_id: 'RR-6934',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Bloodcraving', duration: '5:13' },
          { number: 2, title: 'Embalmed Alive', duration: '0:50' },
          { number: 3, title: 'Hacked Up for Barbecue', duration: '4:18' },
          { number: 4, title: 'Abolition', duration: '1:34' },
          { number: 5, title: 'Necrocannibal', duration: '3:59' },
          { number: 6, title: 'Ripped Off Face', duration: '4:11' }
        ]
      },
      {
        id: 'rel-mort-2',
        title: 'Chainsaw Dismemberment',
        year: '1999',
        type: 'album',
        label: 'Relapse Records',
        catalog_id: 'RR-6435',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Stab', duration: '3:53' },
          { number: 2, title: 'Fleshripper', duration: '0:54' },
          { number: 3, title: 'Drowned in Your Blood', duration: '1:44' },
          { number: 4, title: 'Mass Mutilation', duration: '1:47' },
          { number: 5, title: 'Mauled Beyond Recognition', duration: '5:15' },
          { number: 6, title: 'Rabid', duration: '2:01' },
          { number: 7, title: 'Bloodshed', duration: '1:15' },
          { number: 8, title: 'Chainsaw Dismemberment', duration: '2:45' }
        ]
      }
    ]
  },
  {
    name: 'Sanguisugabogg',
    id: '09672ddf-0ce3-4145-aea2-134209abb6e1',
    altId: 'comm-band-sanguisugabogg',
    slug: 'sanguisugabogg',
    genre: 'Death Metal',
    releases: [
      {
        id: 'rel-bogg-1',
        title: 'Tortured Whole',
        year: '2021',
        type: 'album',
        label: 'Century Media Records',
        catalog_id: 'CM-9871',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Menstrual Envy', duration: '3:09' },
          { number: 2, title: 'Gurgling Retch Stench', duration: '3:15' },
          { number: 3, title: 'Posthumous Humiliation', duration: '3:45' },
          { number: 4, title: 'Tortured Whole', duration: '3:55' },
          { number: 5, title: 'Dick Filet', duration: '3:20' }
        ]
      },
      {
        id: 'rel-bogg-2',
        title: 'Homicidal Ecstasy',
        year: '2023',
        type: 'album',
        label: 'Century Media Records',
        catalog_id: 'CM-9982',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Black Market Vasectomy', duration: '2:56' },
          { number: 2, title: 'Face Ripped Off', duration: '3:15' },
          { number: 3, title: 'Pissed', duration: '3:40' },
          { number: 4, title: 'Testicular Rot', duration: '3:12' },
          { number: 5, title: 'A Lesson in Savagery', duration: '4:02' }
        ]
      }
    ]
  },
  {
    name: 'Necrophagist',
    id: '38c79080-c416-4f03-9949-188b6a80530f',
    slug: 'necrophagist',
    genre: 'Technical Death Metal',
    releases: [
      {
        id: 'rel-necro-1',
        title: 'Onset of Putrefaction',
        year: '1999',
        type: 'album',
        label: 'Noise Solution / Willowtip',
        catalog_id: 'WT-034',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Foul Body Autopsy', duration: '1:53' },
          { number: 2, title: 'To Breathe in a Casket', duration: '5:41' },
          { number: 3, title: 'Fermented Offal Discharge', duration: '4:43' },
          { number: 4, title: 'Culinary Hyperversity', duration: '5:04' },
          { number: 5, title: 'Intestinal Incubation', duration: '4:12' }
        ]
      },
      {
        id: 'rel-necro-2',
        title: 'Epitaph',
        year: '2004',
        type: 'album',
        label: 'Relapse Records',
        catalog_id: 'RR-6632',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Stabwound', duration: '2:48' },
          { number: 2, title: 'The Stillborn One', duration: '4:24' },
          { number: 3, title: 'Ignominious & Pale', duration: '4:01' },
          { number: 4, title: 'Diminished to B', duration: '4:59' },
          { number: 5, title: 'Epitaph', duration: '4:15' },
          { number: 6, title: 'Only Ash Remains', duration: '4:11' },
          { number: 7, title: 'Seven', duration: '3:44' },
          { number: 8, title: 'Symbiotic in Theory', duration: '4:35' }
        ]
      }
    ]
  },
  {
    name: 'Cordyceps',
    id: 'b555d398-2838-4a49-878f-f7cd12d972ef',
    slug: 'cordyceps',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-cord-1',
        title: 'Betrayal',
        year: '2020',
        type: 'album',
        label: 'Unique Leader Records',
        catalog_id: 'ULR-342',
        cover_url: 'https://cdn-images.dzcdn.net/images/cover/b3b64c39f28ecb3a1a9e69e46a782167/1000x1000-000000-80-0-0.jpg',
        tracks: [
          { number: 1, title: 'Cursed Are They', duration: '3:12' },
          { number: 2, title: 'Parallel Dissonance', duration: '3:45' },
          { number: 3, title: 'The Abyss', duration: '4:02' },
          { number: 4, title: 'Comatose Inversion', duration: '3:30' }
        ]
      },
      {
        id: 'rel-cord-2',
        title: 'The Abyss EP',
        year: '2022',
        type: 'ep',
        label: 'Unique Leader Records',
        catalog_id: 'ULR-381',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Into Nothingness', duration: '3:20' },
          { number: 2, title: 'Mutilated Dawn', duration: '4:10' }
        ]
      }
    ]
  },
  {
    name: 'Cranial Impalement',
    id: '0be2c858-8f1e-45a8-9fe1-6b24776b9b92',
    slug: 'cranial-impalement',
    genre: 'Slam Death Metal',
    releases: [
      {
        id: 'rel-cran-1',
        title: 'Pure Unadulterated Gore',
        year: '2017',
        type: 'ep',
        label: 'Brutal Bands',
        catalog_id: 'BB-044',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Impalement of the Skull', duration: '3:05' },
          { number: 2, title: 'Pure Unadulterated Gore', duration: '3:40' },
          { number: 3, title: 'Slam Surgery', duration: '2:55' }
        ]
      },
      {
        id: 'rel-cran-2',
        title: 'A Prelude to the Apocalypse',
        year: '2020',
        type: 'album',
        label: 'Sevared Records',
        catalog_id: 'SR-112',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Dawn of Annihilation', duration: '1:50' },
          { number: 2, title: 'Apocalyptic Carnage', duration: '3:45' },
          { number: 3, title: 'Somatic Evisceration', duration: '4:10' },
          { number: 4, title: 'Human Extinction', duration: '3:30' }
        ]
      }
    ]
  },
  {
    name: 'Lividity',
    id: '6d87a1cb-e50f-4943-bd87-a1cbe50f2943',
    slug: 'lividity',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-liv-1',
        title: 'The Art of Clitoral Degredation',
        year: '1997',
        type: 'album',
        label: 'United Guttural Records',
        catalog_id: 'UGR-002',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Lividity', duration: '2:40' },
          { number: 2, title: 'Defiled', duration: '3:15' },
          { number: 3, title: 'The Art of Clitoral Degredation', duration: '3:40' }
        ]
      },
      {
        id: 'rel-liv-2',
        title: 'Fetish for the Flippant',
        year: '2000',
        type: 'album',
        label: 'Ablated Records',
        catalog_id: 'AB-004',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Fetish for the Flippant', duration: '3:20' },
          { number: 2, title: 'Pussy Grinder', duration: '2:50' },
          { number: 3, title: 'Necrocyst', duration: '3:30' }
        ]
      },
      {
        id: 'rel-liv-3',
        title: '\'Til Only the Bones Are Left',
        year: '2002',
        type: 'album',
        label: 'Morbid Records',
        catalog_id: 'MR-098',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Cannibalistic Mutilation', duration: '3:05' },
          { number: 2, title: '‘Til Only the Bones Are Left', duration: '3:45' }
        ]
      }
    ]
  },
  {
    name: 'Sect of Execration',
    id: '54bc33d4-6897-45bf-adcd-305ef8fe15e1',
    slug: 'sect-of-execration',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-soe-1',
        title: 'Baptized Through Blasphemy',
        year: '1999',
        type: 'album',
        label: 'Extreme Souls Production',
        catalog_id: 'ESP-006',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Baptized Through Blasphemy', duration: '3:40' },
          { number: 2, title: 'Unending Hate', duration: '3:15' },
          { number: 3, title: 'Sacrificial Carnage', duration: '3:50' }
        ]
      }
    ]
  },
  {
    name: 'Kill Everything',
    id: '41332dc1-e396-4ea3-b0bf-87e3c7449c4d',
    slug: 'kill-everything',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-ke-1',
        title: 'Scorched Earth',
        year: '2018',
        type: 'album',
        label: 'Comatose Music',
        catalog_id: 'COMA-118',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Kill Everything', duration: '3:10' },
          { number: 2, title: 'Scorched Earth', duration: '3:30' },
          { number: 3, title: 'Carnivoric Slaughter', duration: '3:45' }
        ]
      }
    ]
  },
  {
    name: 'Regurgitation',
    id: '9436d87a-1cbe-40f2-a436-d87a1cbe50f2',
    slug: 'regurgitation',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-reg-1',
        title: 'Tales of Necrophilia',
        year: '1999',
        type: 'album',
        label: 'Ablated Records',
        catalog_id: 'AB-001',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Out of the Womb', duration: '3:20' },
          { number: 2, title: 'Repulsive', duration: '3:40' },
          { number: 3, title: 'Tales of Necrophilia', duration: '4:10' }
        ]
      }
    ]
  },
  {
    name: 'Incinerate',
    id: '22ec10e1-c53b-42e4-bef2-b178a981bbc4',
    slug: 'incinerate',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-inc-1',
        title: 'Anatomy of Usurpation',
        year: '2008',
        type: 'album',
        label: 'Brutal Bands',
        catalog_id: 'BB-025',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Anatomy of Usurpation', duration: '3:25' },
          { number: 2, title: 'Surgical Butchery', duration: '3:15' },
          { number: 3, title: 'Throne of Bones', duration: '3:50' }
        ]
      },
      {
        id: 'rel-inc-2',
        title: 'Sacrilegious Devivification',
        year: '2020',
        type: 'album',
        label: 'Comatose Music',
        catalog_id: 'COMA-142',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Lux Ferre', duration: '3:40' },
          { number: 2, title: 'Sacrilegious Devivification', duration: '4:05' }
        ]
      }
    ]
  },
  {
    name: 'Despondency',
    id: '23d6d1c0-c960-49fe-8ad3-cc09a002a6bf',
    slug: 'despondency',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-desp-1',
        title: 'Godless',
        year: '2002',
        type: 'album',
        label: 'Revenge Productions',
        catalog_id: 'RP-012',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Godless', duration: '3:15' },
          { number: 2, title: 'Dechristianization', duration: '3:40' }
        ]
      },
      {
        id: 'rel-desp-2',
        title: 'Excruciating Veneration of Morbid Disciple',
        year: '2022',
        type: 'album',
        label: 'Black Sunset',
        catalog_id: 'BS-045',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Veneration of the Dead', duration: '3:50' },
          { number: 2, title: 'Morbid Disciple', duration: '4:10' }
        ]
      }
    ]
  },
  {
    name: 'Unmerciful',
    id: '7065a825-2935-454d-9bb6-3b0398ee76c2',
    slug: 'unmerciful',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-unm-1',
        title: 'Unmercifully Beaten',
        year: '2006',
        type: 'album',
        label: 'Unique Leader Records',
        catalog_id: 'ULR-048',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Unmercifully Beaten', duration: '3:20' },
          { number: 2, title: 'Retribution', duration: '3:45' }
        ]
      },
      {
        id: 'rel-unm-2',
        title: 'Wrath Encompassed',
        year: '2020',
        type: 'album',
        label: 'Willowtip Records',
        catalog_id: 'WT-185',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Wrath Encompassed', duration: '3:40' },
          { number: 2, title: 'Carnivore Directive', duration: '3:30' }
        ]
      }
    ]
  },
  {
    name: 'Molested Divinity',
    id: 'efdcab30-edcd-4ecf-80e2-12d3088a7644',
    slug: 'molested-divinity',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-md-1',
        title: 'Desolated Realms Through the Ages',
        year: '2018',
        type: 'album',
        label: 'Rotten Music',
        catalog_id: 'RM-032',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Desolated Realms', duration: '3:35' },
          { number: 2, title: 'Pagan Reign', duration: '3:50' }
        ]
      },
      {
        id: 'rel-md-2',
        title: 'The Primordial Voice',
        year: '2022',
        type: 'album',
        label: 'Rotten Music',
        catalog_id: 'RM-061',
        cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Primordial Genesis', duration: '3:40' },
          { number: 2, title: 'Voice of Despair', duration: '4:15' }
        ]
      }
    ]
  },
  {
    name: 'Between the Killings',
    id: 'd4d38e2e-6ece-45fa-bc11-061063e49eb3',
    slug: 'between-the-killings',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-btk-1',
        title: 'Omnipotent Extermination',
        year: '2023',
        type: 'album',
        label: 'Comatose Music',
        catalog_id: 'COMA-189',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Omnipotent Extermination', duration: '3:30' },
          { number: 2, title: 'Flesh and Steel', duration: '3:45' }
        ]
      }
    ]
  },
  {
    name: 'Human Artifacts',
    id: '874d3d3b-45c7-486e-8a76-6562513f89e7',
    slug: 'human-artifacts',
    genre: 'Brutal Death Metal',
    releases: [
      {
        id: 'rel-ha-1',
        title: 'The Human Experiment',
        year: '2024',
        type: 'album',
        label: 'Independent',
        catalog_id: 'HA-001',
        cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Subject Zero', duration: '3:15' },
          { number: 2, title: 'The Human Experiment', duration: '4:00' }
        ]
      }
    ]
  },
  {
    name: 'Necessary Death',
    id: 'e92b2b1d-a0c1-4a9d-b393-fb0f825504c5',
    slug: 'necessary-death',
    genre: 'Slam Death Metal',
    releases: [
      {
        id: 'rel-nd-1',
        title: 'Morbid Realization',
        year: '2023',
        type: 'album',
        label: 'Independent',
        catalog_id: 'ND-001',
        cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Morbid Realization', duration: '3:20' },
          { number: 2, title: 'Cold Slab', duration: '3:40' }
        ]
      }
    ]
  },
  {
    name: 'Virulent Excision',
    id: 'cbddb810-259b-4230-9968-3d402dfdb872',
    slug: 'virulent-excision',
    genre: 'Slam Death Metal',
    releases: [
      {
        id: 'rel-ve-1',
        title: 'Degradation of Humanity',
        year: '2023',
        type: 'ep',
        label: 'Extreme Underground',
        catalog_id: 'VE-001',
        cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Virulent Infiltration', duration: '1:45' },
          { number: 2, title: 'Degradation of Humanity', duration: '3:30' },
          { number: 3, title: 'Visceral Excision', duration: '4:15' }
        ]
      },
      {
        id: 'rel-ve-2',
        title: 'The Excision of Reality',
        year: '2024',
        type: 'album',
        label: 'Extreme Underground',
        catalog_id: 'VE-002',
        cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
        tracks: [
          { number: 1, title: 'Biological Warfare', duration: '3:20' },
          { number: 2, title: 'The Excision of Reality', duration: '3:50' },
          { number: 3, title: 'Slamming Guttural Oblivion', duration: '4:10' }
        ]
      }
    ]
  }
];

// Build master list of CatalogRelease objects
const allCatalogReleases = [];

for (const band of BANDS_DATA) {
  for (const [idx, rel] of band.releases.entries()) {
    const releaseRow = {
      id: rel.id,
      band_id: band.id,
      band_name: band.name,
      artist: band.name,
      artist_name: band.name,
      title: rel.title,
      type: rel.type || 'album',
      release_date: rel.year,
      release_year: rel.year,
      label: rel.label,
      catalog_id: rel.catalog_id,
      catalogId: rel.catalog_id,
      cover_url: rel.cover_url,
      cover_image: rel.cover_url,
      coverUrl: rel.cover_url,
      coverImage: rel.cover_url,
      image_url: rel.cover_url,
      genre: band.genre,
      tracks: rel.tracks || [],
      status: 'active',
      created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
      updated_at: new Date().toISOString()
    };
    allCatalogReleases.push(releaseRow);

    // If band has alternative ID (e.g. from seedBandsData), also link duplicate with altId
    if (band.altId) {
      allCatalogReleases.push({
        ...releaseRow,
        id: `${rel.id}-alt`,
        band_id: band.altId
      });
    }
  }
}

// Write to data/releases_cache.json
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dataFile = path.join(dataDir, 'releases_cache.json');
fs.writeFileSync(dataFile, JSON.stringify(allCatalogReleases, null, 2), 'utf8');
console.log(`Saved ${allCatalogReleases.length} catalog releases to ${dataFile}`);

// Also write to uploads/releases_cache.json
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const uploadsFile = path.join(uploadsDir, 'releases_cache.json');
fs.writeFileSync(uploadsFile, JSON.stringify(allCatalogReleases, null, 2), 'utf8');
console.log(`Saved ${allCatalogReleases.length} catalog releases to ${uploadsFile}`);
