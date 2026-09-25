-- =========================================================================
-- Ensure "venues" table contains all extended metadata columns
-- =========================================================================

ALTER TABLE IF EXISTS public.venues 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC,
  ADD COLUMN IF NOT EXISTS place_type TEXT DEFAULT 'venue',
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'MusicBrainz';

-- Create lookup performance indices
CREATE INDEX IF NOT EXISTS idx_venues_city_lower ON public.venues ((LOWER(city)));
CREATE INDEX IF NOT EXISTS idx_venues_name_lower ON public.venues ((LOWER(name)));

-- Enable RLS and public policies
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venues' AND policyname = 'Public venues read access'
  ) THEN
    CREATE POLICY "Public venues read access" ON public.venues FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venues' AND policyname = 'Authenticated venues insert and update'
  ) THEN
    CREATE POLICY "Authenticated venues insert and update" ON public.venues FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
