-- =========================================================================
-- Migration: Add or Upgrade 'releases' table for Digital & Physical Master Catalog
-- =========================================================================

-- 1. Ensure 'audio-vault' bucket exists with public read/write access
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-vault', 'audio-vault', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Access for audio-vault Bucket" ON storage.objects;
CREATE POLICY "Public Read Access for audio-vault Bucket"
ON storage.objects FOR SELECT USING (bucket_id = 'audio-vault');

DROP POLICY IF EXISTS "Public Upload Access for audio-vault Bucket" ON storage.objects;
CREATE POLICY "Public Upload Access for audio-vault Bucket"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio-vault');

DROP POLICY IF EXISTS "Public Update Access for audio-vault Bucket" ON storage.objects;
CREATE POLICY "Public Update Access for audio-vault Bucket"
ON storage.objects FOR UPDATE USING (bucket_id = 'audio-vault');

DROP POLICY IF EXISTS "Public Delete Access for audio-vault Bucket" ON storage.objects;
CREATE POLICY "Public Delete Access for audio-vault Bucket"
ON storage.objects FOR DELETE USING (bucket_id = 'audio-vault');

-- 2. Create 'releases' table
CREATE TABLE IF NOT EXISTS public."releases" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "band_id" TEXT NOT NULL,
    "label_id" TEXT,
    "title" TEXT NOT NULL,
    "catalog_id" TEXT,
    "type" TEXT DEFAULT 'Album',
    "release_date" TEXT,
    "label" TEXT,
    "genre" TEXT,
    "cover_image" TEXT,
    "cover_url" TEXT,
    "cover_color" TEXT,
    "tracks" JSONB DEFAULT '[]'::jsonb,
    "formats" JSONB DEFAULT '{}'::jsonb,
    "digital" JSONB DEFAULT '[]'::jsonb,
    "audio_vault_path" TEXT,
    "status" TEXT DEFAULT 'active',
    "created_by" TEXT
);

-- Drop any foreign key constraints to prevent blocking inserts for roster bands
ALTER TABLE public."releases" DROP CONSTRAINT IF EXISTS fk_releases_band;
ALTER TABLE public."releases" DROP CONSTRAINT IF EXISTS releases_band_id_fkey;
ALTER TABLE public."releases" DROP CONSTRAINT IF EXISTS fk_releases_label;
ALTER TABLE public."releases" DROP CONSTRAINT IF EXISTS releases_label_id_fkey;

-- Ensure label_id column accepts text
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'releases' 
        AND column_name = 'label_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public."releases" ALTER COLUMN "label_id" TYPE TEXT USING label_id::text;
    END IF;
END $$;

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_releases_band_id" ON public."releases" ("band_id");
CREATE INDEX IF NOT EXISTS "idx_releases_catalog_id" ON public."releases" ("catalog_id");
CREATE INDEX IF NOT EXISTS "idx_releases_created_at" ON public."releases" ("created_at");

-- 4. Row Level Security (RLS)
ALTER TABLE public."releases" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select of releases" ON public."releases";
CREATE POLICY "Allow public select of releases" ON public."releases"
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow public insert of releases" ON public."releases";
CREATE POLICY "Allow public insert of releases" ON public."releases"
    FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update of releases" ON public."releases";
CREATE POLICY "Allow public update of releases" ON public."releases"
    FOR UPDATE
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow public delete of releases" ON public."releases";
CREATE POLICY "Allow public delete of releases" ON public."releases"
    FOR DELETE
    TO public
    USING (true);
