-- =========================================================================
-- Migration: Add / Update "tour_packages" table in Supabase
-- Description: Persists collaborative tour package routing, lineups, 
--              day sheets, backline specs, and vehicle logistics.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public."tour_packages" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Tour Package Workspace',
    "headliner_client_name" TEXT DEFAULT 'Headliner Band',
    "publication_status" TEXT DEFAULT 'embargoed_private',
    "embargo_until_date" TEXT,
    "bands" JSONB DEFAULT '[]'::jsonb,
    "stops" JSONB DEFAULT '[]'::jsonb,
    "vehicles" JSONB DEFAULT '[]'::jsonb,
    "backline_config" JSONB DEFAULT '{}'::jsonb,
    "data" JSONB DEFAULT '{}'::jsonb,
    "payload" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public."tour_packages" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid duplicates
DROP POLICY IF EXISTS "Allow public select of tour_packages" ON public."tour_packages";
DROP POLICY IF EXISTS "Allow public insert of tour_packages" ON public."tour_packages";
DROP POLICY IF EXISTS "Allow public update of tour_packages" ON public."tour_packages";
DROP POLICY IF EXISTS "Allow public delete of tour_packages" ON public."tour_packages";

-- Allow read/write access for collaborative band & tour manager workflows
CREATE POLICY "Allow public select of tour_packages" ON public."tour_packages"
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert of tour_packages" ON public."tour_packages"
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public update of tour_packages" ON public."tour_packages"
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete of tour_packages" ON public."tour_packages"
    FOR DELETE
    TO public
    USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tour_packages_updated_at ON public."tour_packages" ("updated_at" DESC);
CREATE INDEX IF NOT EXISTS idx_tour_packages_headliner ON public."tour_packages" ("headliner_client_name");
