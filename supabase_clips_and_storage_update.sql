-- ==============================================================================
-- NEXUS CORE / GOREGRIND ECOSYSTEM - SUPABASE UPDATE SCRIPT
-- Resolves:
-- 1. Clips table schema, columns (caption, song_title, band_name, etc.) & RLS policies
-- 2. Clips storage bucket creation & public read/write storage policies
-- 3. Black book venues table persistence & RLS policies
-- 4. Band profiles & lineup synchronization
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- SECTION 1: CLIPS STORAGE BUCKET CONFIGURATION & POLICIES
-- ------------------------------------------------------------------------------
-- Ensure 'clips' storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clips',
  'clips',
  true,
  104857600, -- 100MB video file limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-matroska', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-matroska', 'image/jpeg', 'image/png', 'image/webp'];

-- Enable storage RLS policies for 'clips' bucket
DO $$
BEGIN
  -- Read policy: Anyone can view/stream clips
  DROP POLICY IF EXISTS "Public Clips Bucket Select" ON storage.objects;
  CREATE POLICY "Public Clips Bucket Select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'clips');

  -- Insert policy: Authenticated and public users can upload clips
  DROP POLICY IF EXISTS "Public Clips Bucket Insert" ON storage.objects;
  CREATE POLICY "Public Clips Bucket Insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'clips');

  -- Update policy: Users can update clips in 'clips' bucket
  DROP POLICY IF EXISTS "Public Clips Bucket Update" ON storage.objects;
  CREATE POLICY "Public Clips Bucket Update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'clips');

  -- Delete policy: Users can delete clips in 'clips' bucket
  DROP POLICY IF EXISTS "Public Clips Bucket Delete" ON storage.objects;
  CREATE POLICY "Public Clips Bucket Delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'clips');
END $$;


-- ------------------------------------------------------------------------------
-- SECTION 2: CLIPS TABLE EXTENSION & RLS POLICIES
-- ------------------------------------------------------------------------------
-- Create clips table if not exists, or add required missing columns
CREATE TABLE IF NOT EXISTS public.clips (
  id TEXT PRIMARY KEY,
  user_id UUID,
  video_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  duration NUMERIC DEFAULT 15,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add extended metadata columns to clips table if they don't already exist
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS song_title TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS band_name TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS profile_id TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Enable Row Level Security on clips table
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

-- Clips Table RLS Policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public read clips" ON public.clips;
  CREATE POLICY "Allow public read clips"
    ON public.clips FOR SELECT
    USING (true);

  DROP POLICY IF EXISTS "Allow public insert clips" ON public.clips;
  CREATE POLICY "Allow public insert clips"
    ON public.clips FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow public update clips" ON public.clips;
  CREATE POLICY "Allow public update clips"
    ON public.clips FOR UPDATE
    USING (true);

  DROP POLICY IF EXISTS "Allow public delete clips" ON public.clips;
  CREATE POLICY "Allow public delete clips"
    ON public.clips FOR DELETE
    USING (true);
END $$;


-- ------------------------------------------------------------------------------
-- SECTION 3: VENUES BLACK BOOK PERSISTENCE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venues (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  address TEXT,
  country TEXT DEFAULT 'USA',
  capacity INTEGER DEFAULT 250,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  booking_email TEXT,
  tech_specs TEXT,
  load_in_info TEXT,
  curfew TEXT,
  payout_terms TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public read venues" ON public.venues;
  CREATE POLICY "Allow public read venues"
    ON public.venues FOR SELECT
    USING (true);

  DROP POLICY IF EXISTS "Allow public insert venues" ON public.venues;
  CREATE POLICY "Allow public insert venues"
    ON public.venues FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow public update venues" ON public.venues;
  CREATE POLICY "Allow public update venues"
    ON public.venues FOR UPDATE
    USING (true);
END $$;


-- ------------------------------------------------------------------------------
-- SECTION 4: BANDS TABLE & LINEUP SYNC
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bands (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  genre TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  lineup JSONB DEFAULT '[]'::JSONB,
  social_links JSONB DEFAULT '{}'::JSONB,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bands ADD COLUMN IF NOT EXISTS lineup JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.bands ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.bands ADD COLUMN IF NOT EXISTS banner_url TEXT;

ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public read bands" ON public.bands;
  CREATE POLICY "Allow public read bands"
    ON public.bands FOR SELECT
    USING (true);

  DROP POLICY IF EXISTS "Allow public insert bands" ON public.bands;
  CREATE POLICY "Allow public insert bands"
    ON public.bands FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow public update bands" ON public.bands;
  CREATE POLICY "Allow public update bands"
    ON public.bands FOR UPDATE
    USING (true);
END $$;
