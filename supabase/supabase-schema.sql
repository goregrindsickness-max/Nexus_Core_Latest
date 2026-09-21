-- =========================================================================
-- Supabase Database Schema Dump (Pulled via db-pull script)
-- Date: 2026-06-25T21:00:00.554Z
-- Host: db.cyjnpuneruonskfzpmqo.supabase.co
-- Database: postgres
-- =========================================================================

BEGIN;

-- Clean drop existing tables (for recreation purposes)
DROP TABLE IF EXISTS public."asset_revenue_splits" CASCADE;
DROP TABLE IF EXISTS public."bands" CASCADE;
DROP TABLE IF EXISTS public."co_op_gear_assets" CASCADE;
DROP TABLE IF EXISTS public."co_op_route_nodes" CASCADE;
DROP TABLE IF EXISTS public."co_op_tour_bands" CASCADE;
DROP TABLE IF EXISTS public."co_op_tours" CASCADE;
DROP TABLE IF EXISTS public."community_printers_v1" CASCADE;
DROP TABLE IF EXISTS public."contact_suggestions" CASCADE;
DROP TABLE IF EXISTS public."creative_alliances" CASCADE;
DROP TABLE IF EXISTS public."creative_contracts_v1" CASCADE;
DROP TABLE IF EXISTS public."creative_feed_posts" CASCADE;
DROP TABLE IF EXISTS public."creative_lookbook_feed" CASCADE;
DROP TABLE IF EXISTS public."creative_portfolio_assets" CASCADE;
DROP TABLE IF EXISTS public."creatives" CASCADE;
DROP TABLE IF EXISTS public."creatives_v1" CASCADE;
DROP TABLE IF EXISTS public."distro_store_items" CASCADE;
DROP TABLE IF EXISTS public."follows" CASCADE;
DROP TABLE IF EXISTS public."fan_profiles" CASCADE;
DROP TABLE IF EXISTS public."flights" CASCADE;
DROP TABLE IF EXISTS public."guestlists" CASCADE;
DROP TABLE IF EXISTS public."inventory" CASCADE;
DROP TABLE IF EXISTS public."inventory_audits" CASCADE;
DROP TABLE IF EXISTS public."labels" CASCADE;
DROP TABLE IF EXISTS public."ledger_entries" CASCADE;
DROP TABLE IF EXISTS public."loyalty_members" CASCADE;
DROP TABLE IF EXISTS public."music_tracks" CASCADE;
DROP TABLE IF EXISTS public."notes" CASCADE;
DROP TABLE IF EXISTS public."notifications_v1" CASCADE;
DROP TABLE IF EXISTS public."profiles" CASCADE;
DROP TABLE IF EXISTS public."profiles_v2" CASCADE;
DROP TABLE IF EXISTS public."repertoire_songs" CASCADE;
DROP TABLE IF EXISTS public."routing_beacons_v1" CASCADE;
DROP TABLE IF EXISTS public."sales" CASCADE;
DROP TABLE IF EXISTS public."setlists" CASCADE;
DROP TABLE IF EXISTS public."show_audit_snapshots_v1" CASCADE;
DROP TABLE IF EXISTS public."show_settlements_v1" CASCADE;
DROP TABLE IF EXISTS public."shows" CASCADE;
DROP TABLE IF EXISTS public."staged_tickets" CASCADE;
DROP TABLE IF EXISTS public."staged_tour_bands" CASCADE;
DROP TABLE IF EXISTS public."staged_tour_nodes" CASCADE;
DROP TABLE IF EXISTS public."staged_tours" CASCADE;
DROP TABLE IF EXISTS public."tour_flights_v1" CASCADE;
DROP TABLE IF EXISTS public."user_reviews" CASCADE;
DROP TABLE IF EXISTS public."venues" CASCADE;

-- ==========================================
-- Table: public."asset_revenue_splits"
-- ==========================================

CREATE TABLE public."asset_revenue_splits" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "item_id" TEXT NOT NULL,
    "label_percentage" NUMERIC NOT NULL,
    "artist_percentage" NUMERIC NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."asset_revenue_splits" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."bands"
-- ==========================================

CREATE TABLE public."bands" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "name" TEXT NOT NULL DEFAULT 'Unnamed Band'::text,
    "genre" TEXT,
    "homebase" TEXT,
    "logo_url" TEXT,
    "label_id" UUID,
    "live_update" TEXT,
    "featured_video_band_name" TEXT,
    "featured_video_track_name" TEXT,
    FOREIGN KEY ("label_id") REFERENCES public."labels"("id") ON DELETE SET NULL
);

ALTER TABLE public."bands" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "bands"
CREATE POLICY "Allow public select of bands" ON public."bands"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of bands" ON public."bands"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of bands" ON public."bands"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of bands" ON public."bands"
    FOR DELETE
    TO public
    USING (true);

-- ==========================================
-- Table: public."co_op_gear_assets"
-- ==========================================

CREATE TABLE public."co_op_gear_assets" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "tour_id" UUID,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supplier_id" TEXT,
    "utilizer_ids" TEXT[] DEFAULT '{}'::text[],
    FOREIGN KEY ("tour_id") REFERENCES public."co_op_tours"("id") ON DELETE SET NULL
);

ALTER TABLE public."co_op_gear_assets" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."co_op_route_nodes"
-- ==========================================

CREATE TABLE public."co_op_route_nodes" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "tour_id" UUID,
    "date" TEXT,
    "city" TEXT NOT NULL,
    "venue" TEXT,
    "load_in_time" TEXT,
    "doors_time" TEXT,
    "set_time" TEXT,
    "curfew_time" TEXT,
    "status" TEXT DEFAULT 'Pending'::text,
    FOREIGN KEY ("tour_id") REFERENCES public."co_op_tours"("id") ON DELETE SET NULL
);

ALTER TABLE public."co_op_route_nodes" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."co_op_tour_bands"
-- ==========================================

CREATE TABLE public."co_op_tour_bands" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "tour_id" UUID,
    "band_id" TEXT,
    "band_name" TEXT NOT NULL,
    "is_host" BOOLEAN DEFAULT false,
    "is_registered" BOOLEAN DEFAULT false,
    "accepted" BOOLEAN DEFAULT false,
    "guarantee_amount" NUMERIC DEFAULT 0,
    FOREIGN KEY ("tour_id") REFERENCES public."co_op_tours"("id") ON DELETE SET NULL
);

ALTER TABLE public."co_op_tour_bands" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."co_op_tours"
-- ==========================================

CREATE TABLE public."co_op_tours" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "tour_name" TEXT NOT NULL,
    "transport_type" TEXT DEFAULT 'Shared Van & Trailer'::text,
    "guarantee_basis" TEXT DEFAULT 'PER_SHOW'::text,
    "gas_price_estimate" NUMERIC DEFAULT 3.65,
    "share_drums" BOOLEAN DEFAULT false,
    "share_bass" BOOLEAN DEFAULT false,
    "share_guitar" BOOLEAN DEFAULT false,
    "share_custom" BOOLEAN DEFAULT false,
    "custom_gear_notes" TEXT
);

ALTER TABLE public."co_op_tours" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."community_printers_v1"
-- ==========================================

CREATE TABLE public."community_printers_v1" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "company_name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "rating" NUMERIC DEFAULT 4.8,
    "price_range" TEXT DEFAULT 'moderate'::text,
    "region" TEXT,
    "specialties" TEXT[] DEFAULT '{}'::text[],
    "likes" INTEGER DEFAULT 0,
    "reviews" JSONB DEFAULT '[]'::jsonb,
    "blacklisted" BOOLEAN DEFAULT false,
    "blacklist_reason" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "offers_dtg" BOOLEAN DEFAULT false,
    "offers_dtf" BOOLEAN DEFAULT false,
    "max_screen_colors" INTEGER DEFAULT 4
);

ALTER TABLE public."community_printers_v1" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "community_printers_v1"
CREATE POLICY "Enable select for everyone" ON public."community_printers_v1"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Enable insert for everyone" ON public."community_printers_v1"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Enable update for everyone" ON public."community_printers_v1"
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);
CREATE POLICY "Enable delete for custom owners" ON public."community_printers_v1"
    FOR DELETE
    TO public
    USING (true);

-- ==========================================
-- Table: public."contact_suggestions"
-- ==========================================

CREATE TABLE public."contact_suggestions" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "venue_id" TEXT NOT NULL,
    "suggested_buyer_name" TEXT,
    "suggested_booking_email" TEXT,
    "status" TEXT DEFAULT 'pending'::text,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."contact_suggestions" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."creative_alliances"
-- ==========================================

CREATE TABLE public."creative_alliances" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "project_name" TEXT NOT NULL,
    "band_id" TEXT,
    "total_budget" NUMERIC DEFAULT 0.00,
    "primary_creative_id" TEXT NOT NULL,
    "partner_creative_id" TEXT,
    "primary_payout_percentage" NUMERIC DEFAULT 100.00,
    "partner_payout_percentage" NUMERIC DEFAULT 0.00,
    "alliance_status" TEXT DEFAULT 'PROPOSED'::text,
    "contract_specs" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("partner_creative_id") REFERENCES public."profiles"("id") ON DELETE SET NULL,
    FOREIGN KEY ("primary_creative_id") REFERENCES public."profiles"("id") ON DELETE SET NULL
);

ALTER TABLE public."creative_alliances" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "creative_alliances"
CREATE POLICY "select_my_alliances" ON public."creative_alliances"
    FOR SELECT
    TO public
    USING (((primary_creative_id = (auth.uid())::text) OR (partner_creative_id = (auth.uid())::text)));
CREATE POLICY "insert_alliances" ON public."creative_alliances"
    FOR INSERT
    TO public
    WITH CHECK ((primary_creative_id = (auth.uid())::text));
CREATE POLICY "update_my_alliances" ON public."creative_alliances"
    FOR UPDATE
    TO public
    USING (((primary_creative_id = (auth.uid())::text) OR (partner_creative_id = (auth.uid())::text)));
CREATE POLICY "delete_my_alliances" ON public."creative_alliances"
    FOR DELETE
    TO public
    USING ((primary_creative_id = (auth.uid())::text));

-- Indexes for "creative_alliances"
CREATE INDEX idx_alliance_primary_creative ON public.creative_alliances USING btree (primary_creative_id);
CREATE INDEX idx_alliance_partner_creative ON public.creative_alliances USING btree (partner_creative_id);
CREATE INDEX idx_alliance_status ON public.creative_alliances USING btree (alliance_status);

-- ==========================================
-- Table: public."creative_contracts_v1"
-- ==========================================

CREATE TABLE public."creative_contracts_v1" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "project_title" TEXT NOT NULL,
    "creative_id" TEXT NOT NULL,
    "creative_name" TEXT NOT NULL,
    "creative_category" TEXT NOT NULL,
    "band_name" TEXT NOT NULL,
    "fee" NUMERIC NOT NULL DEFAULT 0.00,
    "timeline_days" INTEGER NOT NULL DEFAULT 1,
    "enforced_protocols" JSONB DEFAULT '[]'::jsonb,
    "verified_protocols" JSONB DEFAULT '[]'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'pending'::text
);

ALTER TABLE public."creative_contracts_v1" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "creative_contracts_v1"
CREATE POLICY "Allow public access to creative_contracts_v1" ON public."creative_contracts_v1"
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- Table: public."creative_feed_posts"
-- ==========================================

CREATE TABLE public."creative_feed_posts" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "creative_id" TEXT,
    "artist_name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "tags" TEXT[],
    "is_boosted" BOOLEAN DEFAULT false,
    "boost_expires_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    FOREIGN KEY ("creative_id") REFERENCES public."profiles"("id") ON DELETE SET NULL
);

ALTER TABLE public."creative_feed_posts" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."creative_lookbook_feed"
-- ==========================================

CREATE TABLE public."creative_lookbook_feed" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "talent_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "image_url" TEXT NOT NULL,
    "media_type" TEXT DEFAULT 'image'::text,
    "external_url" TEXT,
    "is_boosted" BOOLEAN DEFAULT false,
    "boost_expires_at" TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY ("asset_id") REFERENCES public."creative_portfolio_assets"("id") ON DELETE SET NULL,
    FOREIGN KEY ("talent_id") REFERENCES public."profiles"("id") ON DELETE SET NULL
);

ALTER TABLE public."creative_lookbook_feed" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."creative_portfolio_assets"
-- ==========================================

CREATE TABLE public."creative_portfolio_assets" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "talent_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "year" TEXT,
    "image_url" TEXT NOT NULL,
    "media_type" TEXT DEFAULT 'image'::text,
    FOREIGN KEY ("talent_id") REFERENCES public."profiles"("id") ON DELETE SET NULL
);

ALTER TABLE public."creative_portfolio_assets" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."creatives"
-- ==========================================

CREATE TABLE public."creatives" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "creator_id" TEXT,
    "user_id" TEXT,
    "name" TEXT DEFAULT 'Creative Studio'::text,
    "business_name" TEXT,
    "creative_name" TEXT,
    "handle" TEXT,
    "creative_handle" TEXT,
    "slug" TEXT,
    "custom_slug" TEXT,
    "console_handle" TEXT,
    "category" TEXT DEFAULT 'visual'::text,
    "primary_category" TEXT DEFAULT 'visual'::text,
    "secondary_category" TEXT,
    "specialty" TEXT DEFAULT 'visual'::text,
    "skills" JSONB DEFAULT '[]'::jsonb,
    "selected_skills" JSONB DEFAULT '[]'::jsonb,
    "primary_gear" TEXT,
    "gear" JSONB DEFAULT '[]'::jsonb,
    "gear_tags" JSONB DEFAULT '[]'::jsonb,
    "genres" JSONB DEFAULT '[]'::jsonb,
    "genre_tags" JSONB DEFAULT '[]'::jsonb,
    "biography" TEXT,
    "bio" TEXT,
    "day_rate" TEXT,
    "base_rate_value" NUMERIC DEFAULT 0,
    "base_rate_setup" TEXT DEFAULT 'DAY_RATE'::text,
    "rate_range" TEXT,
    "pricing_notes" TEXT,
    "booking_email" TEXT,
    "city" TEXT,
    "state_province" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'USA'::text,
    "base_location" TEXT,
    "location" TEXT,
    "portfolio_link" TEXT,
    "website" TEXT,
    "avatar_url" TEXT,
    "banner_url" TEXT,
    "cover_url" TEXT,
    "image" TEXT,
    "image_url" TEXT,
    "creative_avatar" TEXT,
    "creative_banner" TEXT,
    "instagram" TEXT,
    "artstation" TEXT,
    "legal_full_name" TEXT,
    "legal_name" TEXT,
    "legal_first_name" TEXT,
    "legal_last_name" TEXT,
    "legal_entity_type" TEXT,
    "tax_id" TEXT,
    "payout_method" TEXT,
    "stripe_account_id" TEXT,
    "paypal_email" TEXT,
    "availability_status" TEXT DEFAULT 'Available'::text,
    "quick_broadcast" TEXT,
    "broadcast_bulletin" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."creatives" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "creatives"
CREATE POLICY "Allow public access to creatives" ON public."creatives"
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- Table: public."distro_store_items"
-- ==========================================

CREATE TABLE public."distro_store_items" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "inventory_id" UUID NOT NULL,
    "storefront_price" NUMERIC NOT NULL DEFAULT 0.00,
    "public_description" TEXT,
    "product_image_url" TEXT,
    "visibility_status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."distro_store_items" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "distro_store_items"
CREATE POLICY "Allow public consumers to scan visible stock listings" ON public."distro_store_items"
    FOR SELECT
    TO public
    USING ((visibility_status = true));
CREATE POLICY "Allow registered artists or administrative crew to deploy merch" ON public."distro_store_items"
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- Table: public."follows"
-- ==========================================

CREATE TABLE public."follows" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "follower_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "followed_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."follows" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "follows"
CREATE POLICY "Allow public read of follows" ON public."follows"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow authenticating users to self-manage follows" ON public."follows"
    FOR ALL
    TO authenticated
    USING (auth.uid() = follower_id)
    WITH CHECK (auth.uid() = follower_id);

-- ==========================================
-- Table: public."fan_profiles"
-- ==========================================

CREATE TABLE public."fan_profiles" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "homebase_location" VARCHAR(255),
    "registration_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."fan_profiles" ENABLE ROW LEVEL SECURITY;

-- Indexes for "fan_profiles"
CREATE UNIQUE INDEX fan_profiles_username_key ON public.fan_profiles USING btree (username);

-- ==========================================
-- Table: public."flights"
-- ==========================================

CREATE TABLE public."flights" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "traveler_name" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "departure_airport" TEXT NOT NULL,
    "arrival_airport" TEXT NOT NULL,
    "departure_time" TEXT NOT NULL,
    "arrival_time" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled'::text,
    "gate" TEXT,
    "notes" TEXT,
    "band_id" TEXT
);

ALTER TABLE public."flights" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "flights"
CREATE POLICY "Allow public select of flights" ON public."flights"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of flights" ON public."flights"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of flights" ON public."flights"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of flights" ON public."flights"
    FOR DELETE
    TO public
    USING (true);

-- ==========================================
-- Table: public."guestlists"
-- ==========================================

CREATE TABLE public."guestlists" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "show_id" TEXT,
    "name" TEXT NOT NULL,
    "additional_count" INTEGER NOT NULL DEFAULT 0,
    "access_type" TEXT NOT NULL DEFAULT 'General'::text,
    "email" TEXT,
    "phone" TEXT,
    "confirmed_sent" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_sent_at" TIMESTAMP WITH TIME ZONE,
    "confirmed_sent_via" TEXT
);

ALTER TABLE public."guestlists" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "guestlists"
CREATE POLICY "Allow public select of guestlists" ON public."guestlists"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of guestlists" ON public."guestlists"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of guestlists" ON public."guestlists"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of guestlists" ON public."guestlists"
    FOR DELETE
    TO public
    USING (true);

-- ==========================================
-- Table: public."inventory"
-- ==========================================

CREATE TABLE public."inventory" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "name" TEXT NOT NULL,
    "table_stock" INTEGER NOT NULL DEFAULT 0,
    "van_stock" INTEGER NOT NULL DEFAULT 0,
    "low_threshold" INTEGER DEFAULT 10,
    "initial_batch_size" INTEGER DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'Healthy'::text,
    "item_type" TEXT NOT NULL,
    "price" NUMERIC NOT NULL DEFAULT 10.00,
    "image_url" TEXT,
    "border_color" TEXT DEFAULT '#00ffcc'::text,
    "is_exclusive" BOOLEAN NOT NULL DEFAULT false,
    "band_id" TEXT,
    "cost" NUMERIC DEFAULT 0.00,
    "sku" TEXT,
    "barcode" TEXT,
    "variants" JSONB,
    "owner_type" OWNER_TYPE_ENUM DEFAULT 'ARTIST'::owner_type_enum,
    "owner_id" TEXT
);

ALTER TABLE public."inventory" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "inventory"
CREATE POLICY "Allow public select of inventory" ON public."inventory"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of inventory" ON public."inventory"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of inventory" ON public."inventory"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of inventory" ON public."inventory"
    FOR DELETE
    TO public
    USING (true);

-- Indexes for "inventory"
CREATE INDEX idx_inventory_band ON public.inventory USING btree (band_id);

-- ==========================================
-- Table: public."inventory_audits"
-- ==========================================

CREATE TABLE public."inventory_audits" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "item_id" TEXT,
    "item_name" TEXT NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "band_id" TEXT
);

ALTER TABLE public."inventory_audits" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "inventory_audits"
CREATE POLICY "Allow public select of inventory_audits" ON public."inventory_audits"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of inventory_audits" ON public."inventory_audits"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of inventory_audits" ON public."inventory_audits"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of inventory_audits" ON public."inventory_audits"
    FOR DELETE
    TO public
    USING (true);

-- ==========================================
-- Table: public."labels"
-- ==========================================

CREATE TABLE public."labels" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "contact_email" TEXT,
    "payout_routing_key" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."labels" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."ledger_entries"
-- ==========================================

CREATE TABLE public."ledger_entries" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "sale_id" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL,
    "payout_target_id" TEXT NOT NULL,
    "payout_target_type" OWNER_TYPE_ENUM NOT NULL,
    "split_percentage" NUMERIC NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."ledger_entries" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."loyalty_members"
-- ==========================================

CREATE TABLE public."loyalty_members" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "opt_in_promotions" BOOLEAN NOT NULL DEFAULT true,
    "lifetime_discount_uses" INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public."loyalty_members" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "loyalty_members"
CREATE POLICY "Allow public select of loyalty_members" ON public."loyalty_members"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of loyalty_members" ON public."loyalty_members"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of loyalty_members" ON public."loyalty_members"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of loyalty_members" ON public."loyalty_members"
    FOR DELETE
    TO public
    USING (true);

-- ==========================================
-- Table: public."music_tracks"
-- ==========================================

CREATE TABLE public."music_tracks" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" TEXT,
    "fileType" TEXT,
    "band_id" TEXT,
    "owner_type" OWNER_TYPE_ENUM DEFAULT 'ARTIST'::owner_type_enum,
    "owner_id" TEXT,
    "track_preview_mode" TEXT DEFAULT '30_SEC_CLIP'::text,
    "track_price" NUMERIC DEFAULT 1.00,
    "track_visibility" BOOLEAN DEFAULT true
);

ALTER TABLE public."music_tracks" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."notes"
-- ==========================================

CREATE TABLE public."notes" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "category" TEXT NOT NULL DEFAULT 'GENERAL'::text,
    "text" TEXT NOT NULL,
    "tag_name" TEXT,
    "show_id" TEXT,
    "band_id" TEXT
);

ALTER TABLE public."notes" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "notes"
CREATE POLICY "Allow public select of notes" ON public."notes"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of notes" ON public."notes"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of notes" ON public."notes"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of notes" ON public."notes"
    FOR DELETE
    TO public
    USING (true);

-- Indexes for "notes"
CREATE INDEX idx_notes_show_id ON public.notes USING btree (show_id);

-- ==========================================
-- Table: public."notifications_v1"
-- ==========================================

CREATE TABLE public."notifications_v1" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "requires_push" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."notifications_v1" ENABLE ROW LEVEL SECURITY;

-- Indexes for "notifications_v1"
CREATE INDEX idx_notifications_unread ON public.notifications_v1 USING btree (user_id, is_read);

-- ==========================================
-- Table: public."profiles"
-- ==========================================

CREATE TABLE public."profiles" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "full_name" TEXT NOT NULL DEFAULT 'Unnamed Operator'::text,
    "email" TEXT NOT NULL DEFAULT 'unknown@tour-hq.com'::text,
    "role" TEXT NOT NULL DEFAULT 'Operator'::text,
    "avatar_url" TEXT,
    "band_id" TEXT,
    "account_type" TEXT DEFAULT 'band'::text,
    "target_region" TEXT,
    "creative_metadata" JSONB DEFAULT '{}'::jsonb,
    "promoter_metadata" JSONB DEFAULT '{}'::jsonb,
    "genre_tags" TEXT[],
    "allowed_workspaces" TEXT[],
    "sub_tier" SUBSCRIPTION_TIER_V1 DEFAULT 'free_for_life'::subscription_tier_v1,
    "stripe_customer_id" TEXT,
    "subscription_status" TEXT DEFAULT 'inactive'::text,
    "current_period_end" TIMESTAMP WITH TIME ZONE,
    "stripe_connect_id" TEXT,
    "subscription_tier" TEXT DEFAULT 'free'::text,
    FOREIGN KEY ("band_id") REFERENCES public."bands"("id") ON DELETE SET NULL
);

ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "profiles"
CREATE POLICY "Allow public select of profiles" ON public."profiles"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of profiles" ON public."profiles"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of profiles" ON public."profiles"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of profiles" ON public."profiles"
    FOR DELETE
    TO public
    USING (true);

-- Indexes for "profiles"
CREATE INDEX idx_profile_sub_tier ON public.profiles USING btree (sub_tier);
CREATE INDEX idx_profiles_sub_tier ON public.profiles USING btree (sub_tier);

-- ==========================================
-- Table: public."profiles_v2"
-- ==========================================

CREATE TABLE public."profiles_v2" (
    "id" UUID PRIMARY KEY NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "subscription_tier" TEXT DEFAULT 'free'::text,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "account_type" TEXT DEFAULT 'artist'::text,
    "target_region" TEXT
);

ALTER TABLE public."profiles_v2" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "profiles_v2"
CREATE POLICY "Allow individual read access" ON public."profiles_v2"
    FOR SELECT
    TO public
    USING ((auth.uid() = id));

-- ==========================================
-- Table: public."repertoire_songs"
-- ==========================================

CREATE TABLE public."repertoire_songs" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "name" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 4,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "band_id" TEXT
);

ALTER TABLE public."repertoire_songs" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "repertoire_songs"
CREATE POLICY "Allow public select of repertoire" ON public."repertoire_songs"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of repertoire" ON public."repertoire_songs"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of repertoire" ON public."repertoire_songs"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of repertoire" ON public."repertoire_songs"
    FOR DELETE
    TO public
    USING (true);

-- ==========================================
-- Table: public."routing_beacons_v1"
-- ==========================================

CREATE TABLE public."routing_beacons_v1" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "band_id" UUID NOT NULL,
    "band_name" TEXT NOT NULL,
    "target_region" TEXT NOT NULL,
    "availability_start" DATE NOT NULL,
    "availability_end" DATE NOT NULL,
    "booking_email" TEXT NOT NULL,
    "additional_routing_notes" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."routing_beacons_v1" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "routing_beacons_v1"
CREATE POLICY "Bands can manage own beacons" ON public."routing_beacons_v1"
    FOR ALL
    TO public
    USING ((auth.uid() = band_id));
CREATE POLICY "Anyone authenticated can view active beacons" ON public."routing_beacons_v1"
    FOR SELECT
    TO public
    USING (((auth.uid() IS NOT NULL) AND (is_active = true)));

-- ==========================================
-- Table: public."sales"
-- ==========================================

CREATE TABLE public."sales" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "item_type" TEXT NOT NULL DEFAULT 'Multiple'::text,
    "amount" NUMERIC NOT NULL DEFAULT 0.00,
    "payment_method" TEXT NOT NULL,
    "customer_email" TEXT,
    "show_id" TEXT,
    "image_url" TEXT,
    "band_id" TEXT,
    "cart_items" JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public."sales" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "sales"
CREATE POLICY "Allow public select of sales" ON public."sales"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of sales" ON public."sales"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of sales" ON public."sales"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of sales" ON public."sales"
    FOR DELETE
    TO public
    USING (true);

-- Indexes for "sales"
CREATE INDEX idx_sales_show_id ON public.sales USING btree (show_id);
CREATE INDEX idx_sales_created_at ON public.sales USING btree (created_at);
CREATE INDEX idx_sales_band ON public.sales USING btree (band_id);

-- ==========================================
-- Table: public."setlists"
-- ==========================================

CREATE TABLE public."setlists" (
    "show_id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "allotted_minutes" INTEGER NOT NULL DEFAULT 60,
    "allotted_seconds" INTEGER NOT NULL DEFAULT 0,
    "songs" JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public."setlists" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "setlists"
CREATE POLICY "Allow public select of setlists" ON public."setlists"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of setlists" ON public."setlists"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of setlists" ON public."setlists"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of setlists" ON public."setlists"
    FOR DELETE
    TO public
    USING (true);

-- ==========================================
-- Table: public."show_audit_snapshots_v1"
-- ==========================================

CREATE TABLE public."show_audit_snapshots_v1" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "show_id" TEXT NOT NULL,
    "snapshot_data" JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public."show_audit_snapshots_v1" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "show_audit_snapshots_v1"
CREATE POLICY "Allow public select of audit snapshots" ON public."show_audit_snapshots_v1"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of audit snapshots" ON public."show_audit_snapshots_v1"
    FOR INSERT
    TO public
    WITH CHECK (true);

-- ==========================================
-- Table: public."show_settlements_v1"
-- ==========================================

CREATE TABLE public."show_settlements_v1" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "show_id" TEXT NOT NULL,
    "gross_merch_sales" NUMERIC NOT NULL DEFAULT 0.00,
    "venue_cut_apparel_pct" NUMERIC NOT NULL DEFAULT 20.00,
    "venue_cut_media_pct" NUMERIC NOT NULL DEFAULT 10.00,
    "show_guarantee" NUMERIC NOT NULL DEFAULT 0.00,
    "variance_penalty_total" NUMERIC NOT NULL DEFAULT 0.00,
    "net_venue_cut" NUMERIC NOT NULL DEFAULT 0.00,
    "band_net_payout" NUMERIC NOT NULL DEFAULT 0.00,
    "artist_signature" TEXT,
    "venue_signature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'settled'::text
);

ALTER TABLE public."show_settlements_v1" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "show_settlements_v1"
CREATE POLICY "Allow public select of settlements" ON public."show_settlements_v1"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of settlements" ON public."show_settlements_v1"
    FOR INSERT
    TO public
    WITH CHECK (true);

-- ==========================================
-- Table: public."shows"
-- ==========================================

CREATE TABLE public."shows" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "name" TEXT NOT NULL,
    "festival_name" TEXT,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled'::text,
    "revenue" NUMERIC DEFAULT 0.00,
    "show_type" TEXT,
    "band_id" TEXT,
    "event_scope" TEXT DEFAULT 'tour'::text,
    "tour_id" TEXT,
    "venue_address" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Tour City'::text,
    "state_province" TEXT,
    "country" TEXT,
    "promoter_contact" TEXT,
    "load_in_time" TEXT,
    "doors_time" TEXT,
    "set_time" TEXT,
    "curfew_time" TEXT,
    "venue_cut_percentage" NUMERIC DEFAULT 0.00,
    "guarantee_amount" NUMERIC DEFAULT 0.00,
    "currency" TEXT DEFAULT 'USD'::text,
    "tax_rate" NUMERIC DEFAULT 0.00,
    "expected_attendance" TEXT,
    "additional_notes" TEXT,
    "merch_space_fee" NUMERIC DEFAULT 0.00,
    "seller_cost" NUMERIC DEFAULT 0.00,
    "tables_provided" BOOLEAN DEFAULT false,
    "hanging_grids_provided" BOOLEAN DEFAULT false,
    "shore_power" BOOLEAN DEFAULT false,
    "parking_arrangements" TEXT,
    "age_restriction" TEXT,
    "wifi_network" TEXT,
    "wifi_password" TEXT,
    "merch_call_time" TEXT,
    "soundcheck_time" TEXT,
    "dinner_arrangements" TEXT,
    "local_food_notes" TEXT,
    "emergency_medical_info" TEXT,
    "local_pharmacy_info" TEXT,
    "stage_name" TEXT
);

ALTER TABLE public."shows" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "shows"
CREATE POLICY "Allow public select of shows" ON public."shows"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of shows" ON public."shows"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of shows" ON public."shows"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of shows" ON public."shows"
    FOR DELETE
    TO public
    USING (true);

-- Indexes for "shows"
CREATE INDEX idx_shows_date ON public.shows USING btree (date);

-- ==========================================
-- Table: public."staged_tickets"
-- ==========================================

CREATE TABLE public."staged_tickets" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "tour_node_id" UUID NOT NULL,
    "fan_profile_id" TEXT NOT NULL,
    "purchase_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "is_scanned" BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY ("fan_profile_id") REFERENCES public."fan_profiles"("id") ON DELETE SET NULL,
    FOREIGN KEY ("tour_node_id") REFERENCES public."staged_tour_nodes"("id") ON DELETE SET NULL
);

ALTER TABLE public."staged_tickets" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."staged_tour_bands"
-- ==========================================

CREATE TABLE public."staged_tour_bands" (
    "staged_tour_id" UUID NOT NULL,
    "band_id" TEXT NOT NULL,
    "is_accepted" BOOLEAN DEFAULT false,
    "financial_cut_percentage" NUMERIC DEFAULT 0.00,
    PRIMARY KEY ("staged_tour_id", "band_id"),
    FOREIGN KEY ("staged_tour_id") REFERENCES public."staged_tours"("id") ON DELETE SET NULL
);

ALTER TABLE public."staged_tour_bands" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."staged_tour_nodes"
-- ==========================================

CREATE TABLE public."staged_tour_nodes" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "staged_tour_id" UUID,
    "calendar_date" DATE NOT NULL,
    "target_city" TEXT NOT NULL,
    "target_venue_name" TEXT NOT NULL,
    "expected_load_in" TIME WITHOUT TIME ZONE,
    "expected_show_start" TIME WITHOUT TIME ZONE,
    "gear_sharing_notes" TEXT DEFAULT 'NONE'::text,
    "node_status" TEXT DEFAULT 'PROPOSED'::text,
    FOREIGN KEY ("staged_tour_id") REFERENCES public."staged_tours"("id") ON DELETE SET NULL
);

ALTER TABLE public."staged_tour_nodes" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Table: public."staged_tours"
-- ==========================================

CREATE TABLE public."staged_tours" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "tour_name" TEXT NOT NULL,
    "host_band_id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'SANDBOX'::text,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."staged_tours" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "staged_tours"
CREATE POLICY "Users can only modify their own staged tours" ON public."staged_tours"
    FOR ALL
    TO authenticated
    USING ((host_band_id = (auth.uid())::text));

-- ==========================================
-- Table: public."tour_flights_v1"
-- ==========================================

CREATE TABLE public."tour_flights_v1" (
    "flight_number" TEXT NOT NULL,
    "traveler_name" TEXT NOT NULL,
    "departure_date" TEXT NOT NULL,
    "departure_terminal" TEXT,
    "departure_gate" TEXT,
    "arrival_terminal" TEXT,
    "arrival_gate" TEXT,
    "estimated_arrival_time" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "sync_timestamp" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("flight_number", "traveler_name", "departure_date")
);

ALTER TABLE public."tour_flights_v1" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "tour_flights_v1"
CREATE POLICY "Allow public access to tour_flights_v1" ON public."tour_flights_v1"
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- Table: public."user_reviews"
-- ==========================================

CREATE TABLE public."user_reviews" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "rating" INTEGER NOT NULL DEFAULT 5,
    "text" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "infraction_type" TEXT,
    "target_promoter_id" TEXT,
    "venue_id" TEXT
);

ALTER TABLE public."user_reviews" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "user_reviews"
CREATE POLICY "Allow public select of user_reviews" ON public."user_reviews"
    FOR SELECT
    TO public
    USING (true);
CREATE POLICY "Allow public insert of user_reviews" ON public."user_reviews"
    FOR INSERT
    TO public
    WITH CHECK (true);
CREATE POLICY "Allow public update of user_reviews" ON public."user_reviews"
    FOR UPDATE
    TO public
    USING (true);
CREATE POLICY "Allow public delete of user_reviews" ON public."user_reviews"
    FOR DELETE
    TO public
    USING (true);

-- ==========================================
-- Table: public."venues"
-- ==========================================

CREATE TABLE public."venues" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state_province" TEXT,
    "country" TEXT,
    "capacity" INTEGER,
    "email" TEXT,
    "genre_fit" NUMERIC,
    "payout_rating" NUMERIC,
    "load_in_rating" NUMERIC,
    "buyers" TEXT,
    "intel_entries" JSONB DEFAULT '[]'::jsonb,
    "promoter_id" TEXT
);

-- ==========================================
-- Table: public."app_blacklist"
-- ==========================================

CREATE TABLE IF NOT EXISTS public.app_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('email', 'handle')),
  value TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_blacklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Block public access to blacklist" ON public.app_blacklist FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.check_blacklist_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.app_blacklist 
    WHERE (type = 'email' AND LOWER(value) = LOWER(NEW.email))
       OR (type = 'handle' AND LOWER(value) = LOWER(NEW.raw_user_meta_data->>'handle'))
  ) THEN
    RAISE EXCEPTION 'Registration restricted.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER enforce_scene_blacklist
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_blacklist_enrollment();

COMMIT;


-- add_source_splits.sql
-- Creates show_settlements and source_split_payouts tables with RLS

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_role_type') THEN
        CREATE TYPE payout_role_type AS ENUM ('artist', 'promoter', 'venue', 'freelancer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status_type') THEN
        CREATE TYPE payout_status_type AS ENUM ('escrow', 'transferred');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.show_settlements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id uuid NOT NULL,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    gross_revenue numeric(10, 2) NOT NULL DEFAULT 0.00,
    sales_tax numeric(10, 2) NOT NULL DEFAULT 0.00,
    venue_house_cuts numeric(10, 2) NOT NULL DEFAULT 0.00,
    net_artist_pool numeric(10, 2) NOT NULL DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.source_split_payouts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    settlement_id uuid NOT NULL REFERENCES public.show_settlements(id) ON DELETE CASCADE,
    show_id uuid NOT NULL,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    recipient_name text NOT NULL,
    role payout_role_type NOT NULL,
    amount numeric(10, 2) NOT NULL DEFAULT 0.00,
    status payout_status_type NOT NULL DEFAULT 'escrow',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.show_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_split_payouts ENABLE ROW LEVEL SECURITY;

-- Create policies for show_settlements
DROP POLICY IF EXISTS "Users can view their own show settlements" ON public.show_settlements;
CREATE POLICY "Users can view their own show settlements" 
    ON public.show_settlements 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own show settlements" ON public.show_settlements;
CREATE POLICY "Users can insert their own show settlements" 
    ON public.show_settlements 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own show settlements" ON public.show_settlements;
CREATE POLICY "Users can update their own show settlements" 
    ON public.show_settlements 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create policies for source_split_payouts
DROP POLICY IF EXISTS "Users can view their own source split payouts" ON public.source_split_payouts;
CREATE POLICY "Users can view their own source split payouts" 
    ON public.source_split_payouts 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own source split payouts" ON public.source_split_payouts;
CREATE POLICY "Users can insert their own source split payouts" 
    ON public.source_split_payouts 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own source split payouts" ON public.source_split_payouts;
CREATE POLICY "Users can update their own source split payouts" 
    ON public.source_split_payouts 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- ==========================================
-- Table: public."universal_social_feed_posts"
-- ==========================================
CREATE TABLE public."universal_social_feed_posts" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "author_name" TEXT NOT NULL,
    "author_avatar" TEXT,
    "author_role" TEXT,
    "posted_by" TEXT,
    "post_type" TEXT DEFAULT 'post',
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "youtube_id" TEXT,
    "location" TEXT,
    "tag" TEXT,
    "genre" TEXT,
    "reactions_json" JSONB DEFAULT '[]'::jsonb,
    "poll_data_json" JSONB,
    "merch_data_json" JSONB,
    "tape_data_json" JSONB,
    "song_data_json" JSONB
);

ALTER TABLE public."universal_social_feed_posts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for social feed posts" ON public."universal_social_feed_posts";
CREATE POLICY "Public read access for social feed posts" ON public."universal_social_feed_posts" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert access for social feed posts" ON public."universal_social_feed_posts";
CREATE POLICY "Authenticated insert access for social feed posts" ON public."universal_social_feed_posts" FOR INSERT WITH CHECK (true);


-- ==========================================
-- Table: public."nexus_posts"
-- ==========================================
CREATE TABLE public."nexus_posts" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "data" JSONB NOT NULL
);
ALTER TABLE public."nexus_posts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for nexus posts" ON public."nexus_posts" FOR SELECT USING (true);
CREATE POLICY "Authenticated insert access for nexus posts" ON public."nexus_posts" FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update access for nexus posts" ON public."nexus_posts" FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete access for nexus posts" ON public."nexus_posts" FOR DELETE USING (true);

-- ==========================================
-- Table: public."nexus_chats"
-- ==========================================
CREATE TABLE public."nexus_chats" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "data" JSONB NOT NULL
);
ALTER TABLE public."nexus_chats" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for nexus chats" ON public."nexus_chats" FOR SELECT USING (true);
CREATE POLICY "Authenticated insert access for nexus chats" ON public."nexus_chats" FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update access for nexus chats" ON public."nexus_chats" FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete access for nexus chats" ON public."nexus_chats" FOR DELETE USING (true);

-- ==========================================
-- Table: public."nexus_notifications"
-- ==========================================
CREATE TABLE public."nexus_notifications" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "data" JSONB NOT NULL
);
ALTER TABLE public."nexus_notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for nexus notifications" ON public."nexus_notifications" FOR SELECT USING (true);
CREATE POLICY "Authenticated insert access for nexus notifications" ON public."nexus_notifications" FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update access for nexus notifications" ON public."nexus_notifications" FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete access for nexus notifications" ON public."nexus_notifications" FOR DELETE USING (true);


-- Marketplace Items
CREATE TABLE IF NOT EXISTS public.user_marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  condition TEXT,
  size TEXT,
  category TEXT,
  shipping_price NUMERIC(10, 2) DEFAULT 0,
  shipping_scope TEXT,
  type TEXT DEFAULT 'merch',
  is_sold BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_marketplace_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view marketplace items" ON public.user_marketplace_items;
CREATE POLICY "Public can view marketplace items" ON public.user_marketplace_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own marketplace items" ON public.user_marketplace_items;
CREATE POLICY "Users can insert own marketplace items" ON public.user_marketplace_items FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users can update own marketplace items" ON public.user_marketplace_items;
CREATE POLICY "Users can update own marketplace items" ON public.user_marketplace_items FOR UPDATE USING (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users can delete own marketplace items" ON public.user_marketplace_items;
CREATE POLICY "Users can delete own marketplace items" ON public.user_marketplace_items FOR DELETE USING (auth.uid() = seller_id);


-- add_source_splits.sql
-- Creates show_settlements and source_split_payouts tables with RLS

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_role_type') THEN
        CREATE TYPE payout_role_type AS ENUM ('artist', 'promoter', 'venue', 'freelancer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status_type') THEN
        CREATE TYPE payout_status_type AS ENUM ('escrow', 'transferred');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.show_settlements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id uuid NOT NULL,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    gross_revenue numeric(10, 2) NOT NULL DEFAULT 0.00,
    sales_tax numeric(10, 2) NOT NULL DEFAULT 0.00,
    venue_house_cuts numeric(10, 2) NOT NULL DEFAULT 0.00,
    net_artist_pool numeric(10, 2) NOT NULL DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.source_split_payouts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    settlement_id uuid NOT NULL REFERENCES public.show_settlements(id) ON DELETE CASCADE,
    show_id uuid NOT NULL,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    recipient_name text NOT NULL,
    role payout_role_type NOT NULL,
    amount numeric(10, 2) NOT NULL DEFAULT 0.00,
    status payout_status_type NOT NULL DEFAULT 'escrow',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.show_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_split_payouts ENABLE ROW LEVEL SECURITY;

-- Create policies for show_settlements
DROP POLICY IF EXISTS "Users can view their own show settlements" ON public.show_settlements;
CREATE POLICY "Users can view their own show settlements" 
    ON public.show_settlements 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own show settlements" ON public.show_settlements;
CREATE POLICY "Users can insert their own show settlements" 
    ON public.show_settlements 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own show settlements" ON public.show_settlements;
CREATE POLICY "Users can update their own show settlements" 
    ON public.show_settlements 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create policies for source_split_payouts
DROP POLICY IF EXISTS "Users can view their own source split payouts" ON public.source_split_payouts;
CREATE POLICY "Users can view their own source split payouts" 
    ON public.source_split_payouts 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own source split payouts" ON public.source_split_payouts;
CREATE POLICY "Users can insert their own source split payouts" 
    ON public.source_split_payouts 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own source split payouts" ON public.source_split_payouts;
CREATE POLICY "Users can update their own source split payouts" 
    ON public.source_split_payouts 
    FOR UPDATE 
    USING (auth.uid() = user_id);


-- ==========================================
-- STORAGE BUCKETS & POLICIES SETUP
-- ==========================================

-- Create storage schema tables if they don't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Insert default buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('bannersv2', 'bannersv2', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-vault', 'audio-vault', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow anyone to view any files
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (true);

-- Insert policy: Allow anyone to upload new files
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (true);

-- Update policy: Allow anyone to update existing files
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (true);

-- Delete policy: Allow anyone to delete files
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (true);

-- ==========================================
-- Table: public."releases"
-- ==========================================

CREATE TABLE IF NOT EXISTS public."releases" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    "band_id" TEXT NOT NULL,
    "label_id" UUID,
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
    "created_by" TEXT,
    FOREIGN KEY ("band_id") REFERENCES public."bands"("id") ON DELETE CASCADE,
    FOREIGN KEY ("label_id") REFERENCES public."labels"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_releases_band_id" ON public."releases" ("band_id");
CREATE INDEX IF NOT EXISTS "idx_releases_catalog_id" ON public."releases" ("catalog_id");
CREATE INDEX IF NOT EXISTS "idx_releases_created_at" ON public."releases" ("created_at");

ALTER TABLE public."releases" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select of releases" ON public."releases"
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert of releases" ON public."releases"
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public update of releases" ON public."releases"
    FOR UPDATE
    TO public
    USING (true);

CREATE POLICY "Allow public delete of releases" ON public."releases"
    FOR DELETE
    TO public
    USING (true);

