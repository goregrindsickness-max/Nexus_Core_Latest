-- ============================================================================
-- NEXUS CORE: Decoupled Public Entities & Festival Lineup Architecture
-- Phase 1: Database Schema, Promoter Workspace Pointer & RLS Policies
-- ============================================================================

BEGIN;

-- 1. Create the network_entities table
CREATE TABLE IF NOT EXISTS public.network_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('festival', 'label_distro', 'booking_agency', 'media_press', 'band', 'venue')),
    avatar_url TEXT,
    banner_url TEXT,
    bio TEXT,
    location TEXT,
    external_links JSONB DEFAULT '{}'::jsonb,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_network_entities_slug ON public.network_entities(slug);
CREATE INDEX IF NOT EXISTS idx_network_entities_category ON public.network_entities(category);
CREATE INDEX IF NOT EXISTS idx_network_entities_owner_id ON public.network_entities(owner_id);

-- 2. Create the entity_members junction table (multi-admin access)
CREATE TABLE IF NOT EXISTS public.entity_members (
    entity_id UUID REFERENCES public.network_entities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'editor')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (entity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_members_user_id ON public.entity_members(user_id);

-- 3. Create the festival_editions table
CREATE TABLE IF NOT EXISTS public.festival_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES public.network_entities(id) ON DELETE CASCADE NOT NULL,
    edition_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    venue_name TEXT,
    city TEXT NOT NULL,
    state TEXT,
    ticket_url TEXT,
    flyer_url TEXT,
    status TEXT DEFAULT 'announced' CHECK (status IN ('draft', 'announced', 'sold_out', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_festival_editions_entity_id ON public.festival_editions(entity_id);
CREATE INDEX IF NOT EXISTS idx_festival_editions_status ON public.festival_editions(status);

-- 4. Create the festival_lineup_items table
CREATE TABLE IF NOT EXISTS public.festival_lineup_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edition_id UUID REFERENCES public.festival_editions(id) ON DELETE CASCADE NOT NULL,
    band_entity_id UUID REFERENCES public.network_entities(id) ON DELETE SET NULL,
    custom_band_name TEXT,
    custom_external_url TEXT,
    billing_tier TEXT DEFAULT 'support' CHECK (billing_tier IN ('headliner', 'co_headliner', 'main_support', 'support', 'opener')),
    sort_order INT DEFAULT 0,
    day_number INT DEFAULT 1,
    stage_name TEXT,
    performance_date DATE,
    set_time TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_festival_lineup_items_edition_id ON public.festival_lineup_items(edition_id);
CREATE INDEX IF NOT EXISTS idx_festival_lineup_items_band_entity_id ON public.festival_lineup_items(band_entity_id);

-- 5. Link to Promoter Workspaces (Pointer/Reference Model)
CREATE TABLE IF NOT EXISTS public.promoter_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_name TEXT NOT NULL,
    linked_entity_id UUID REFERENCES public.network_entities(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.promoter_workspaces
    ADD COLUMN IF NOT EXISTS linked_entity_id UUID REFERENCES public.network_entities(id) ON DELETE SET NULL;

-- Also add optional pointer on profiles for lightweight promoter workspace configs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_entity_id UUID REFERENCES public.network_entities(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. Configure Row Level Security (RLS) Policies
ALTER TABLE public.network_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_lineup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_workspaces ENABLE ROW LEVEL SECURITY;

-- Helper check: is current user owner or member of a given entity_id
CREATE OR REPLACE FUNCTION public.is_entity_admin_or_owner(target_entity_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.network_entities ne
        WHERE ne.id = target_entity_id AND ne.owner_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.entity_members em
        WHERE em.entity_id = target_entity_id
          AND em.user_id = auth.uid()
          AND em.role IN ('owner', 'admin', 'editor')
    );
$$;

-- network_entities policies
DROP POLICY IF EXISTS "Public read access for network_entities" ON public.network_entities;
CREATE POLICY "Public read access for network_entities"
    ON public.network_entities
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Owners and members can insert network_entities" ON public.network_entities;
CREATE POLICY "Owners and members can insert network_entities"
    ON public.network_entities
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() IS NULL OR owner_id IS NULL OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners and members can update network_entities" ON public.network_entities;
CREATE POLICY "Owners and members can update network_entities"
    ON public.network_entities
    FOR UPDATE
    TO public
    USING (owner_id IS NULL OR owner_id = auth.uid() OR public.is_entity_admin_or_owner(id));

DROP POLICY IF EXISTS "Owners and members can delete network_entities" ON public.network_entities;
CREATE POLICY "Owners and members can delete network_entities"
    ON public.network_entities
    FOR DELETE
    TO public
    USING (owner_id IS NULL OR owner_id = auth.uid() OR public.is_entity_admin_or_owner(id));

-- entity_members policies
DROP POLICY IF EXISTS "Public read access for entity_members" ON public.entity_members;
CREATE POLICY "Public read access for entity_members"
    ON public.entity_members
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Entity owners and admins can manage entity_members" ON public.entity_members;
CREATE POLICY "Entity owners and admins can manage entity_members"
    ON public.entity_members
    FOR ALL
    TO public
    USING (user_id = auth.uid() OR public.is_entity_admin_or_owner(entity_id))
    WITH CHECK (user_id = auth.uid() OR public.is_entity_admin_or_owner(entity_id));

-- festival_editions policies
DROP POLICY IF EXISTS "Public read access for festival_editions" ON public.festival_editions;
CREATE POLICY "Public read access for festival_editions"
    ON public.festival_editions
    FOR SELECT
    TO public
    USING (status <> 'draft' OR public.is_entity_admin_or_owner(entity_id) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Entity owners and members can insert festival_editions" ON public.festival_editions;
CREATE POLICY "Entity owners and members can insert festival_editions"
    ON public.festival_editions
    FOR INSERT
    TO public
    WITH CHECK (public.is_entity_admin_or_owner(entity_id) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Entity owners and members can update festival_editions" ON public.festival_editions;
CREATE POLICY "Entity owners and members can update festival_editions"
    ON public.festival_editions
    FOR UPDATE
    TO public
    USING (public.is_entity_admin_or_owner(entity_id) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Entity owners and members can delete festival_editions" ON public.festival_editions;
CREATE POLICY "Entity owners and members can delete festival_editions"
    ON public.festival_editions
    FOR DELETE
    TO public
    USING (public.is_entity_admin_or_owner(entity_id) OR auth.uid() IS NULL);

-- festival_lineup_items policies
DROP POLICY IF EXISTS "Public read access for festival_lineup_items" ON public.festival_lineup_items;
CREATE POLICY "Public read access for festival_lineup_items"
    ON public.festival_lineup_items
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Entity owners and members can manage festival_lineup_items" ON public.festival_lineup_items;
CREATE POLICY "Entity owners and members can manage festival_lineup_items"
    ON public.festival_lineup_items
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.festival_editions fe
            WHERE fe.id = festival_lineup_items.edition_id
              AND (public.is_entity_admin_or_owner(fe.entity_id) OR auth.uid() IS NULL)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.festival_editions fe
            WHERE fe.id = festival_lineup_items.edition_id
              AND (public.is_entity_admin_or_owner(fe.entity_id) OR auth.uid() IS NULL)
        )
    );

-- promoter_workspaces policies
DROP POLICY IF EXISTS "Public read access for promoter_workspaces" ON public.promoter_workspaces;
CREATE POLICY "Public read access for promoter_workspaces"
    ON public.promoter_workspaces
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Owners can manage promoter_workspaces" ON public.promoter_workspaces;
CREATE POLICY "Owners can manage promoter_workspaces"
    ON public.promoter_workspaces
    FOR ALL
    TO public
    USING (owner_id IS NULL OR owner_id = auth.uid())
    WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());

COMMIT;
