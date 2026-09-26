-- =========================================================================
-- Insert / Upsert Nexus Live Productions into public.promoters
-- User ID: 5403162d-1947-43aa-b5f6-38a1bd2a1b80 (Miguel Goregrinder Medina)
-- =========================================================================

INSERT INTO public.promoters (
    id,
    user_id,
    name,
    entity_name,
    email,
    phone,
    location,
    active_venues,
    social_links,
    notes,
    bio,
    genres,
    promoter_logo,
    promoter_cover_image,
    top_song_url,
    featured_youtube_url,
    top_song_artist,
    top_song_title
) VALUES (
    '5403162d-1947-43aa-b5f6-38a1bd2a1b80'::uuid,
    '5403162d-1947-43aa-b5f6-38a1bd2a1b80'::uuid,
    'Miguel Goregrinder Medina',
    'Nexus Live Productions',
    'goregrindsickness@gmail.com',
    '(580)952-2047',
    'Denison, TX / North Texas',
    ARRAY[
        'Reggies Rock Club',
        'Subterranean',
        'Cobra Lounge',
        'WC Social Club',
        'Live Wire Lounge',
        'Empty Bottle',
        'Beat Kitchen'
    ],
    '{
        "instagram": "https://instagram.com/nexusliveproductions",
        "facebook": "https://facebook.com/nexuslive"
    }'::jsonb,
    'Primary underground death metal, slam, and grindcore tour operations (Chicago/Texas Domination Fest iterations).',
    'While Nexus Live Productions itself is new the history behind it is anything but. Having gone through several iterations since 2002. I have a lengthy history in the underground extreme metal scene with several festivals under my name most notably the Chicago/ Texas Domination Fest that ran from 2014-2024. The next evolution is set to move to another new market more details on that in the near future.',
    ARRAY[
        'Brutal Death Metal',
        'Slam Death Metal',
        'Grindcore',
        'Deathcore',
        'Death Metal',
        'Extreme Metal'
    ],
    'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/avatars/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-avatar_1790307456601.webp?t=1790307456601',
    'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/bannersv2/5403162d-1947-43aa-b5f6-38a1bd2a1b80/promoter-banner_1790307913635.webp?t=1790307913635',
    'https://youtu.be/IiyG2jGoYwQ?is=0Di4mt0umKGjpmro',
    'https://youtu.be/IiyG2jGoYwQ?is=0Di4mt0umKGjpmro',
    'Analepsy',
    'Analepsy - Recursive Singularity'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    entity_name = EXCLUDED.entity_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    active_venues = EXCLUDED.active_venues,
    social_links = EXCLUDED.social_links,
    notes = EXCLUDED.notes,
    bio = EXCLUDED.bio,
    genres = EXCLUDED.genres,
    promoter_logo = EXCLUDED.promoter_logo,
    promoter_cover_image = EXCLUDED.promoter_cover_image,
    top_song_url = EXCLUDED.top_song_url,
    featured_youtube_url = EXCLUDED.featured_youtube_url,
    top_song_artist = EXCLUDED.top_song_artist,
    top_song_title = EXCLUDED.top_song_title,
    updated_at = timezone('utc'::TEXT, now());
