-- =========================================================================
-- Migration: Promoter Schema Update (profiles + promoters table)
-- Description: Adds promoter columns to profiles and creates the promoters
--              table with full RLS policies and schema cache reload.
-- =========================================================================

-- 1. Ensure promoter columns exist on the "profiles" table
ALTER TABLE public."profiles"
    ADD COLUMN IF NOT EXISTS "promoter_metadata" JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS "promoter_id" TEXT,
    ADD COLUMN IF NOT EXISTS "promoter_agency" TEXT,
    ADD COLUMN IF NOT EXISTS "promoter_brand" TEXT,
    ADD COLUMN IF NOT EXISTS "promoter_name" TEXT,
    ADD COLUMN IF NOT EXISTS "promoter_region" TEXT,
    ADD COLUMN IF NOT EXISTS "promoter_booking_email" TEXT,
    ADD COLUMN IF NOT EXISTS "promoter_logo" TEXT,
    ADD COLUMN IF NOT EXISTS "promoter_cover_image" TEXT;

-- 2. Create the "promoters" table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public."promoters" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "user_id" TEXT,
    "creator_id" TEXT,
    "owner_id" TEXT,
    "name" TEXT,
    "promoter_name" TEXT,
    "brand_name" TEXT,
    "agency_name" TEXT,
    "title" TEXT,
    "region" TEXT,
    "target_region" TEXT,
    "phone" TEXT,
    "admin_email" TEXT,
    "booking_email" TEXT,
    "venue_class" TEXT,
    "capacity" INTEGER,
    "currency" TEXT DEFAULT 'USD'::text,
    "pipeline" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "website" TEXT,
    "bio" TEXT,
    "description" TEXT,
    "genres" TEXT[],
    "street_address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "state_province" TEXT,
    "country" TEXT DEFAULT 'USA'::text,
    "tech_rider" TEXT,
    "security_map" TEXT,
    "defer_tech_specs" BOOLEAN DEFAULT false,
    "home_venue" JSONB DEFAULT '{}'::jsonb,
    "promoter_logo" TEXT,
    "logo_url" TEXT,
    "cover_url" TEXT,
    "banner_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. If "promoters" already existed with fewer columns, add any missing ones safely
ALTER TABLE public."promoters"
    ADD COLUMN IF NOT EXISTS "user_id" TEXT,
    ADD COLUMN IF NOT EXISTS "creator_id" TEXT,
    ADD COLUMN IF NOT EXISTS "owner_id" TEXT,
    ADD COLUMN IF NOT EXISTS "name" TEXT,
    ADD COLUMN IF NOT EXISTS "promoter_name" TEXT,
    ADD COLUMN IF NOT EXISTS "brand_name" TEXT,
    ADD COLUMN IF NOT EXISTS "agency_name" TEXT,
    ADD COLUMN IF NOT EXISTS "title" TEXT,
    ADD COLUMN IF NOT EXISTS "region" TEXT,
    ADD COLUMN IF NOT EXISTS "target_region" TEXT,
    ADD COLUMN IF NOT EXISTS "phone" TEXT,
    ADD COLUMN IF NOT EXISTS "admin_email" TEXT,
    ADD COLUMN IF NOT EXISTS "booking_email" TEXT,
    ADD COLUMN IF NOT EXISTS "venue_class" TEXT,
    ADD COLUMN IF NOT EXISTS "capacity" INTEGER,
    ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD'::text,
    ADD COLUMN IF NOT EXISTS "pipeline" TEXT,
    ADD COLUMN IF NOT EXISTS "instagram" TEXT,
    ADD COLUMN IF NOT EXISTS "twitter" TEXT,
    ADD COLUMN IF NOT EXISTS "website" TEXT,
    ADD COLUMN IF NOT EXISTS "bio" TEXT,
    ADD COLUMN IF NOT EXISTS "description" TEXT,
    ADD COLUMN IF NOT EXISTS "genres" TEXT[],
    ADD COLUMN IF NOT EXISTS "street_address" TEXT,
    ADD COLUMN IF NOT EXISTS "city" TEXT,
    ADD COLUMN IF NOT EXISTS "state" TEXT,
    ADD COLUMN IF NOT EXISTS "state_province" TEXT,
    ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'USA'::text,
    ADD COLUMN IF NOT EXISTS "tech_rider" TEXT,
    ADD COLUMN IF NOT EXISTS "security_map" TEXT,
    ADD COLUMN IF NOT EXISTS "defer_tech_specs" BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS "home_venue" JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS "promoter_logo" TEXT,
    ADD COLUMN IF NOT EXISTS "logo_url" TEXT,
    ADD COLUMN IF NOT EXISTS "cover_url" TEXT,
    ADD COLUMN IF NOT EXISTS "banner_url" TEXT,
    ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Enable Row Level Security (RLS) on "promoters"
ALTER TABLE public."promoters" ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for "promoters"
DROP POLICY IF EXISTS "Allow public select of promoters" ON public."promoters";
DROP POLICY IF EXISTS "Allow public insert of promoters" ON public."promoters";
DROP POLICY IF EXISTS "Allow public update of promoters" ON public."promoters";
DROP POLICY IF EXISTS "Allow public delete of promoters" ON public."promoters";

CREATE POLICY "Allow public select of promoters" ON public."promoters"
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert of promoters" ON public."promoters"
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update of promoters" ON public."promoters"
    FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete of promoters" ON public."promoters"
    FOR DELETE TO public USING (true);

-- 6. Indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_promoters_user_id ON public."promoters" ("user_id");
CREATE INDEX IF NOT EXISTS idx_promoters_creator_id ON public."promoters" ("creator_id");
CREATE INDEX IF NOT EXISTS idx_promoters_brand_name ON public."promoters" ("brand_name");
CREATE INDEX IF NOT EXISTS idx_profiles_promoter_id ON public."profiles" ("promoter_id");

-- 7. Refresh PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
