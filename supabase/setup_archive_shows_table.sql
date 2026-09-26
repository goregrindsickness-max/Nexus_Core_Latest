-- =========================================================================
-- Supabase Migration: Setup for public.archive_shows
-- Stores permanent archive & festival entries for promoters and organizers
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.archive_shows (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    promoter_id TEXT,
    year INTEGER NOT NULL DEFAULT 2024,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'festival',
    date TEXT NOT NULL,
    venue TEXT,
    city TEXT,
    lineup TEXT[] DEFAULT ARRAY[]::TEXT[],
    attendance TEXT,
    milestone TEXT,
    historical_notes TEXT,
    notes TEXT,
    flyer_url TEXT,
    photo_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_archive_shows_year ON public.archive_shows(year);
CREATE INDEX IF NOT EXISTS idx_archive_shows_user_id ON public.archive_shows(user_id);
CREATE INDEX IF NOT EXISTS idx_archive_shows_type ON public.archive_shows(type);

-- Enable RLS
ALTER TABLE public.archive_shows ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read archive_shows" ON public.archive_shows;
CREATE POLICY "Allow public read archive_shows"
    ON public.archive_shows
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow upsert/insert/update/delete access
DROP POLICY IF EXISTS "Allow public insert archive_shows" ON public.archive_shows;
CREATE POLICY "Allow public insert archive_shows"
    ON public.archive_shows
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update archive_shows" ON public.archive_shows;
CREATE POLICY "Allow public update archive_shows"
    ON public.archive_shows
    FOR UPDATE
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow public delete archive_shows" ON public.archive_shows;
CREATE POLICY "Allow public delete archive_shows"
    ON public.archive_shows
    FOR DELETE
    TO anon, authenticated
    USING (true);
