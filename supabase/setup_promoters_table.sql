-- =========================================================================
-- Supabase Migration: Clean Setup for public.promoters
-- Operations: Nexus Live Productions, Pure Domination Productions, etc.
-- =========================================================================

-- 1. Drop existing table if needed (CASCADE removes dependent constraints/views)
DROP TABLE IF EXISTS public.promoters CASCADE;

-- 2. Create the clean public.promoters table
CREATE TABLE public.promoters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    entity_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    active_venues TEXT[] DEFAULT ARRAY[]::TEXT[],
    social_links JSONB DEFAULT '{}'::JSONB,
    notes TEXT,
    
    -- Additional profile & UI compatibility fields (optional / defaults)
    bio TEXT,
    genres TEXT[] DEFAULT ARRAY[]::TEXT[],
    promoter_logo TEXT,
    promoter_cover_image TEXT,
    top_song_url TEXT,
    featured_youtube_url TEXT,
    top_song_artist TEXT,
    top_song_title TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- 3. Create index on user_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_promoters_user_id ON public.promoters(user_id);
CREATE INDEX IF NOT EXISTS idx_promoters_entity_name ON public.promoters(entity_name);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Authenticated users manage their own promoter records (auth.uid() = user_id)
DROP POLICY IF EXISTS "Users can view own promoter profile" ON public.promoters;
CREATE POLICY "Users can view own promoter profile"
    ON public.promoters
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own promoter profile" ON public.promoters;
CREATE POLICY "Users can insert own promoter profile"
    ON public.promoters
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own promoter profile" ON public.promoters;
CREATE POLICY "Users can update own promoter profile"
    ON public.promoters
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own promoter profile" ON public.promoters;
CREATE POLICY "Users can delete own promoter profile"
    ON public.promoters
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Optional / Recommended for public booking:
-- Allow all users (bands, fans, anonymous) to view active promoter public cards:
DROP POLICY IF EXISTS "Allow public read access to promoter cards" ON public.promoters;
CREATE POLICY "Allow public read access to promoter cards"
    ON public.promoters
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 6. Trigger to automatically refresh updated_at on modifications
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::TEXT, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_promoters_updated_at ON public.promoters;
CREATE TRIGGER set_promoters_updated_at
    BEFORE UPDATE ON public.promoters
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- Example Seed / Insert for Nexus Live Productions & Pure Domination
-- Replace <YOUR_AUTH_USER_UUID> with your actual user_id from auth.users:
-- =========================================================================
/*
INSERT INTO public.promoters (
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
    genres
) VALUES 
(
    '00000000-0000-0000-0000-000000000000'::uuid, -- replace with your auth.uid()
    'Miguel',
    'Nexus Live Productions',
    'booking@nexuslive.com',
    '+1 (555) 019-2831',
    'Chicago, IL / Midwest Underground',
    ARRAY['Reggies Rock Club', 'Subterranean', 'Cobra Lounge', 'WC Social Club'],
    '{"instagram": "https://instagram.com/nexusliveproductions", "facebook": "https://facebook.com/nexuslive"}'::jsonb,
    'Primary underground death metal, slam, and grindcore tour operations.',
    'Underground extreme metal booking and tour routing across North America.',
    ARRAY['Slam Death Metal', 'Brutal Death Metal', 'Grindcore', 'Deathcore']
),
(
    '00000000-0000-0000-0000-000000000000'::uuid, -- replace with your auth.uid()
    'Miguel',
    'Pure Domination Productions',
    'puredomination@gmail.com',
    '+1 (555) 019-2832',
    'Chicago, IL / Midwest',
    ARRAY['Live Wire Lounge', 'Empty Bottle', 'Beat Kitchen'],
    '{"instagram": "https://instagram.com/puredomination"}'::jsonb,
    'Heavy underground bills, international co-promotions, and one-off fests.',
    'Pure Domination Productions: Heavyweight extreme sonic annihilation.',
    ARRAY['Brutal Death Metal', 'Slam', 'Hardcore']
);
*/
