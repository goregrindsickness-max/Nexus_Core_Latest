-- ============================================================================
-- NEXUS CORE: Comprehensive Row Level Security (RLS) & Storage Hardening
-- ============================================================================
-- Run this idempotent migration in the Supabase SQL Editor.
-- What it fixes:
--   1. Removes dangerous `TO public` USING(true) / WITH CHECK(true) write policies
--   2. Removes anonymous `OR auth.uid() IS NULL` and `owner_id IS NULL` backdoors
--   3. Locks down private/financial/PII/messaging/contract/admin tables from anon reads
--   4. Enforces authenticated ownership, band operator, entity admin, or platform admin checks
--   5. Replaces world-writable `storage.objects` policies with authenticated upload + owner/admin delete
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Security Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_nexus_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      auth.uid()::text = '5403162d-1947-43aa-b5f6-38a1bd2a1b80'
      OR lower(coalesce(auth.jwt() ->> 'email', '')) IN (
        'goregrindsickness@gmail.com',
        'admin@nexus.com',
        'admin@nexuscore.fm'
      )
    );
$$;

-- Checks whether the authenticated user owns or manages a band via bands owner columns or profiles.band_id
CREATE OR REPLACE FUNCTION public.is_band_owner(target_band_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  uid_text TEXT := auth.uid()::text;
  has_match BOOLEAN := false;
  band_owner_expr TEXT := '';
  col_rec RECORD;
BEGIN
  IF auth.uid() IS NULL OR target_band_id IS NULL OR length(trim(target_band_id)) = 0 THEN
    RETURN false;
  END IF;

  IF public.is_nexus_admin() THEN
    RETURN true;
  END IF;

  -- Check if user's profile is linked to this band
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'band_id'
  ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id::text = $1 AND band_id::text = $2)'
      INTO has_match USING uid_text, target_band_id;
    IF has_match THEN
      RETURN true;
    END IF;
  END IF;

  -- Check band record owner columns if bands table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bands') THEN
    FOR col_rec IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'bands'
        AND column_name IN ('creator_id', 'user_id', 'owner_id', 'profile_id', 'admin_id')
    LOOP
      IF band_owner_expr <> '' THEN
        band_owner_expr := band_owner_expr || ' OR ';
      END IF;
      band_owner_expr := band_owner_expr || format('%I::text = $1', col_rec.column_name);
    END LOOP;

    IF band_owner_expr <> '' THEN
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.bands WHERE id::text = $2 AND (%s))', band_owner_expr)
        INTO has_match USING uid_text, target_band_id;
      IF has_match THEN
        RETURN true;
      END IF;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- Clean up previous permissive is_entity_admin_or_owner and remove auth.uid() IS NULL backdoor
CREATE OR REPLACE FUNCTION public.is_entity_admin_or_owner(target_entity_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      public.is_nexus_admin()
      OR EXISTS (
        SELECT 1 FROM public.network_entities ne
        WHERE ne.id = target_entity_id AND ne.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.entity_members em
        WHERE em.entity_id = target_entity_id
          AND em.user_id = auth.uid()
          AND em.role IN ('owner', 'admin', 'editor')
      )
    );
$$;

-- Helper: Drop all existing RLS policies on a public table safely
CREATE OR REPLACE FUNCTION public._drop_all_policies_on_table(target_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  pol RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = target_table
  ) THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = target_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, target_table);
  END LOOP;
END;
$$;

-- Helper: Apply hardened policies dynamically based on actual columns present in live DB
CREATE OR REPLACE FUNCTION public._apply_table_rls(
  target_table TEXT,
  select_mode TEXT,         -- 'public' | 'authenticated' | 'owner_only' | 'admin_only'
  insert_mode TEXT,         -- 'owner_or_auth' | 'owner_strict' | 'admin_only'
  update_mode TEXT          -- 'owner_strict' | 'admin_only'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  col_rec RECORD;
  owner_cols TEXT[] := ARRAY[
    'user_id', 'owner_id', 'creator_id', 'profile_id', 'seller_id',
    'author_id', 'posted_by', 'talent_id', 'creative_id', 'promoter_id',
    'follower_id', 'sender_id', 'recipient_id', 'actor_id',
    'primary_creative_id', 'partner_creative_id', 'host_band_id', 'created_by', 'blocker_id'
  ];
  matched_cols TEXT[] := ARRAY[]::TEXT[];
  has_band_id BOOLEAN := false;
  has_id_col BOOLEAN := false;
  has_data_json BOOLEAN := false;
  owner_expr TEXT := '';
  insert_expr TEXT := '';
  col_name TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = target_table
  ) THEN
    RETURN;
  END IF;

  PERFORM public._drop_all_policies_on_table(target_table);

  -- Discover ownership columns on this table
  FOR col_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = target_table
  LOOP
    IF col_rec.column_name = ANY(owner_cols) THEN
      matched_cols := array_append(matched_cols, col_rec.column_name);
    ELSIF col_rec.column_name = 'band_id' THEN
      has_band_id := true;
    ELSIF col_rec.column_name = 'id' THEN
      has_id_col := true;
    ELSIF col_rec.column_name = 'data' AND col_rec.data_type IN ('json', 'jsonb') THEN
      has_data_json := true;
    END IF;
  END LOOP;

  -- Build owner predicate
  FOREACH col_name IN ARRAY matched_cols LOOP
    IF owner_expr <> '' THEN
      owner_expr := owner_expr || ' OR ';
    END IF;
    owner_expr := owner_expr || format('%I::text = auth.uid()::text', col_name);
  END LOOP;

  IF has_band_id THEN
    IF owner_expr <> '' THEN
      owner_expr := owner_expr || ' OR ';
    END IF;
    owner_expr := owner_expr || '(band_id::text = auth.uid()::text OR public.is_band_owner(band_id::text))';
  END IF;

  -- Tables keyed directly by auth.uid() (profiles, fan_profiles, profiles_v2, creatives, promoters, labels)
  IF has_id_col AND target_table IN ('profiles', 'profiles_v2', 'fan_profiles', 'creatives', 'creatives_v1', 'promoters', 'labels') THEN
    IF owner_expr <> '' THEN
      owner_expr := owner_expr || ' OR ';
    END IF;
    owner_expr := owner_expr || 'id::text = auth.uid()::text';
  END IF;

  -- JSONB payload ownership fallback (nexus_posts, nexus_chats, nexus_notifications)
  IF has_data_json THEN
    IF owner_expr <> '' THEN
      owner_expr := owner_expr || ' OR ';
    END IF;
    owner_expr := owner_expr || '(
      coalesce(data->>''authorId'', '''') = auth.uid()::text
      OR coalesce(data->>''userId'', '''') = auth.uid()::text
      OR coalesce(data->>''senderId'', '''') = auth.uid()::text
      OR coalesce(data->>''recipientId'', '''') = auth.uid()::text
      OR coalesce(data->>''profileId'', '''') = auth.uid()::text
    )';
  END IF;

  IF owner_expr = '' THEN
    owner_expr := 'public.is_nexus_admin()';
  ELSE
    owner_expr := '(' || owner_expr || ' OR public.is_nexus_admin())';
  END IF;

  -- SELECT policy
  IF select_mode = 'public' THEN
    EXECUTE format('CREATE POLICY "Hardened public read" ON public.%I FOR SELECT TO public USING (true)', target_table);
  ELSIF select_mode = 'authenticated' THEN
    EXECUTE format('CREATE POLICY "Hardened authenticated read" ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', target_table);
  ELSIF select_mode = 'owner_only' THEN
    EXECUTE format('CREATE POLICY "Hardened owner read" ON public.%I FOR SELECT TO authenticated USING (%s)', target_table, owner_expr);
  ELSE
    EXECUTE format('CREATE POLICY "Hardened admin read" ON public.%I FOR SELECT TO authenticated USING (public.is_nexus_admin())', target_table);
  END IF;

  -- INSERT policy (never TO public, never unconditional true)
  IF insert_mode = 'admin_only' THEN
    EXECUTE format('CREATE POLICY "Hardened admin insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_nexus_admin())', target_table);
  ELSIF insert_mode = 'owner_strict' THEN
    EXECUTE format('CREATE POLICY "Hardened owner insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND %s)', target_table, owner_expr);
  ELSE
    -- Authenticated insert: must match owner column when any owner column exists, or require auth.uid() IS NOT NULL for tables without owner columns
    IF array_length(matched_cols, 1) IS NOT NULL OR has_band_id OR has_data_json OR target_table IN ('profiles', 'profiles_v2', 'fan_profiles') THEN
      insert_expr := owner_expr;
    ELSE
      insert_expr := 'auth.uid() IS NOT NULL';
    END IF;
    EXECUTE format('CREATE POLICY "Hardened authenticated insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND (%s))', target_table, insert_expr);
  END IF;

  -- UPDATE & DELETE policies
  IF update_mode = 'admin_only' THEN
    EXECUTE format('CREATE POLICY "Hardened admin update" ON public.%I FOR UPDATE TO authenticated USING (public.is_nexus_admin()) WITH CHECK (public.is_nexus_admin())', target_table);
    EXECUTE format('CREATE POLICY "Hardened admin delete" ON public.%I FOR DELETE TO authenticated USING (public.is_nexus_admin())', target_table);
  ELSE
    EXECUTE format('CREATE POLICY "Hardened owner update" ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', target_table, owner_expr, owner_expr);
    EXECUTE format('CREATE POLICY "Hardened owner delete" ON public.%I FOR DELETE TO authenticated USING (%s)', target_table, owner_expr);
  END IF;
END;
$$;

-- ============================================================================
-- 2. Apply Policies Across Application Tables
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- --------------------------------------------------------------------------
  -- A. Public Catalogs, Profiles & Social Feeds
  --    (Public SELECT for browse/discovery; Authenticated Owner/Admin writes)
  -- --------------------------------------------------------------------------
  FOREACH tbl IN ARRAY ARRAY[
    'profiles',
    'fan_profiles',
    'bands',
    'shows',
    'archive_shows',
    'releases',
    'inventory',
    'distro_store_items',
    'promoters',
    'creatives',
    'creatives_v1',
    'labels',
    'venues',
    'music_tracks',
    'repertoire_songs',
    'setlists',
    'nexus_posts',
    'nexus_post_comments',
    'nexus_post_reactions',
    'universal_social_feed_posts',
    'nexus_stories',
    'stories',
    'clips',
    'creative_feed_posts',
    'creative_lookbook_feed',
    'creative_portfolio_assets',
    'feed_media',
    'media',
    'forum_threads',
    'forum_comments',
    'nexus_events',
    'nexus_polls',
    'nexus_poll_votes',
    'nexus_event_rsvps',
    'nexus_setlists',
    'nexus_shop_items',
    'nexus_tracks',
    'user_marketplace_items',
    'user_reviews',
    'follows',
    'user_follows',
    'community_printers_v1'
  ] LOOP
    PERFORM public._apply_table_rls(tbl, 'public', 'owner_or_auth', 'owner_strict');
  END LOOP;

  -- Special rule for tour_packages: hide drafts/archived packages from non-owners
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tour_packages') THEN
    PERFORM public._apply_table_rls('tour_packages', 'public', 'owner_strict', 'owner_strict');
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tour_packages' AND column_name = 'publication_status'
    ) THEN
      DROP POLICY IF EXISTS "Hardened public read" ON public.tour_packages;
      CREATE POLICY "Hardened public read published tour packages" ON public.tour_packages
        FOR SELECT TO public
        USING (
          publication_status = 'published'
          OR (auth.uid() IS NOT NULL AND (
            public.is_nexus_admin()
            OR band_id::text = auth.uid()::text
            OR public.is_band_owner(band_id::text)
          ))
        );
    END IF;
  END IF;

  -- Special rule for routing_beacons_v1 & contact_suggestions: authenticated browse only (contains booking emails)
  PERFORM public._apply_table_rls('routing_beacons_v1', 'authenticated', 'owner_strict', 'owner_strict');
  PERFORM public._apply_table_rls('contact_suggestions', 'authenticated', 'owner_or_auth', 'admin_only');

  -- --------------------------------------------------------------------------
  -- B. Private User Data, Messaging, Financials, Contracts, Audits & Ops
  --    (ZERO anon access: Authenticated owner / participant / admin only)
  -- --------------------------------------------------------------------------
  FOREACH tbl IN ARRAY ARRAY[
    'profiles_v2',
    'blocks',
    'hidden_conversations',
    'push_subscriptions',
    'notifications_v1',
    'nexus_notifications',
    'nexus_chats',
    'nexus_venue_chat',
    'conversation_participants',
    'conversations',
    'messages',
    'sales',
    'guestlists',
    'loyalty_members',
    'show_rsvps',
    'show_settlements',
    'source_split_payouts',
    'show_settlements_v1',
    'show_audit_snapshots_v1',
    'inventory_audits',
    'ledger_entries',
    'asset_revenue_splits',
    'creative_contracts_v1',
    'promoter_contracts_v1',
    'creative_alliances',
    'promoter_alliances',
    'nexus_booking_requests',
    'epk_submissions',
    'flights',
    'tour_flights_v1',
    'notes',
    'itineraries',
    'song_projects',
    'song_stems',
    'project_collaborators',
    'co_op_tours',
    'co_op_tour_bands',
    'co_op_route_nodes',
    'co_op_gear_assets',
    'staged_tours',
    'staged_tour_bands',
    'staged_tour_nodes',
    'staged_tickets',
    'band_join_requests_v1'
  ] LOOP
    PERFORM public._apply_table_rls(tbl, 'owner_only', 'owner_strict', 'owner_strict');
  END LOOP;

  -- --------------------------------------------------------------------------
  -- C. Admin / Moderation / System Tables
  -- --------------------------------------------------------------------------
  PERFORM public._apply_table_rls('app_blacklist', 'admin_only', 'admin_only', 'admin_only');
  PERFORM public._apply_table_rls('restricted_profiles', 'owner_only', 'admin_only', 'admin_only');

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bug_reports') THEN
    PERFORM public._drop_all_policies_on_table('bug_reports');
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bug_reports' AND column_name = 'user_id'
    ) THEN
      CREATE POLICY "Users read own or admin reads all bug_reports" ON public.bug_reports
        FOR SELECT TO authenticated
        USING (user_id::text = auth.uid()::text OR public.is_nexus_admin());
      CREATE POLICY "Authenticated users insert own bug_reports" ON public.bug_reports
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id::text = auth.uid()::text OR public.is_nexus_admin()));
    ELSE
      CREATE POLICY "Admins read bug_reports" ON public.bug_reports
        FOR SELECT TO authenticated
        USING (public.is_nexus_admin());
      CREATE POLICY "Authenticated users insert bug_reports" ON public.bug_reports
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    CREATE POLICY "Admins update bug_reports" ON public.bug_reports
      FOR UPDATE TO authenticated
      USING (public.is_nexus_admin()) WITH CHECK (public.is_nexus_admin());
    CREATE POLICY "Admins delete bug_reports" ON public.bug_reports
      FOR DELETE TO authenticated
      USING (public.is_nexus_admin());
  END IF;
END;
$$;

-- ============================================================================
-- 3. Decoupled Network Entities, Festivals & Promoter Workspaces (Zero auth.uid() IS NULL Backdoors)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'network_entities') THEN
    PERFORM public._drop_all_policies_on_table('network_entities');
    CREATE POLICY "Public read access for network_entities"
      ON public.network_entities FOR SELECT TO public
      USING (true);
    CREATE POLICY "Authenticated owners insert network_entities"
      ON public.network_entities FOR INSERT TO authenticated
      WITH CHECK (owner_id = auth.uid() OR public.is_nexus_admin());
    CREATE POLICY "Entity admins update network_entities"
      ON public.network_entities FOR UPDATE TO authenticated
      USING (public.is_entity_admin_or_owner(id))
      WITH CHECK (public.is_entity_admin_or_owner(id));
    CREATE POLICY "Entity admins delete network_entities"
      ON public.network_entities FOR DELETE TO authenticated
      USING (public.is_entity_admin_or_owner(id));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entity_members') THEN
    PERFORM public._drop_all_policies_on_table('entity_members');
    CREATE POLICY "Public read access for entity_members"
      ON public.entity_members FOR SELECT TO public
      USING (true);
    CREATE POLICY "Entity admins manage entity_members"
      ON public.entity_members FOR ALL TO authenticated
      USING (user_id = auth.uid() OR public.is_entity_admin_or_owner(entity_id))
      WITH CHECK (public.is_entity_admin_or_owner(entity_id));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'festival_editions') THEN
    PERFORM public._drop_all_policies_on_table('festival_editions');
    CREATE POLICY "Public read published festival_editions"
      ON public.festival_editions FOR SELECT TO public
      USING (status <> 'draft' OR public.is_entity_admin_or_owner(entity_id));
    CREATE POLICY "Entity admins insert festival_editions"
      ON public.festival_editions FOR INSERT TO authenticated
      WITH CHECK (public.is_entity_admin_or_owner(entity_id));
    CREATE POLICY "Entity admins update festival_editions"
      ON public.festival_editions FOR UPDATE TO authenticated
      USING (public.is_entity_admin_or_owner(entity_id))
      WITH CHECK (public.is_entity_admin_or_owner(entity_id));
    CREATE POLICY "Entity admins delete festival_editions"
      ON public.festival_editions FOR DELETE TO authenticated
      USING (public.is_entity_admin_or_owner(entity_id));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'festival_lineup_items') THEN
    PERFORM public._drop_all_policies_on_table('festival_lineup_items');
    CREATE POLICY "Public read published festival_lineup_items"
      ON public.festival_lineup_items FOR SELECT TO public
      USING (
        EXISTS (
          SELECT 1 FROM public.festival_editions fe
          WHERE fe.id = festival_lineup_items.edition_id
            AND (fe.status <> 'draft' OR public.is_entity_admin_or_owner(fe.entity_id))
        )
      );
    CREATE POLICY "Entity admins manage festival_lineup_items"
      ON public.festival_lineup_items FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.festival_editions fe
          WHERE fe.id = festival_lineup_items.edition_id
            AND public.is_entity_admin_or_owner(fe.entity_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.festival_editions fe
          WHERE fe.id = festival_lineup_items.edition_id
            AND public.is_entity_admin_or_owner(fe.entity_id)
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'promoter_workspaces') THEN
    PERFORM public._drop_all_policies_on_table('promoter_workspaces');
    CREATE POLICY "Public read access for promoter_workspaces"
      ON public.promoter_workspaces FOR SELECT TO public
      USING (true);
    CREATE POLICY "Owners manage promoter_workspaces"
      ON public.promoter_workspaces FOR ALL TO authenticated
      USING (owner_id = auth.uid() OR public.is_nexus_admin())
      WITH CHECK (owner_id = auth.uid() OR public.is_nexus_admin());
  END IF;
END;
$$;

-- ============================================================================
-- 4. Storage Bucket Policy Hardening (storage.objects)
-- ============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for audio-vault Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access for audio-vault Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access for audio-vault Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access for audio-vault Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Nexus public media read" ON storage.objects;
DROP POLICY IF EXISTS "Nexus authenticated media upload" ON storage.objects;
DROP POLICY IF EXISTS "Nexus owner media update" ON storage.objects;
DROP POLICY IF EXISTS "Nexus owner media delete" ON storage.objects;

-- Allow public reads ONLY for designated public media buckets
CREATE POLICY "Nexus public media read"
  ON storage.objects FOR SELECT TO public
  USING (
    bucket_id IN (
      'avatars',
      'bannersv2',
      'assets',
      'marketplace',
      'audio-vault',
      'photo-pit',
      'clips',
      'inventory-items',
      'feed_media'
    )
  );

-- Require authenticated Supabase session for uploads to designated media buckets
CREATE POLICY "Nexus authenticated media upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND bucket_id IN (
      'avatars',
      'bannersv2',
      'assets',
      'marketplace',
      'audio-vault',
      'photo-pit',
      'clips',
      'inventory-items',
      'feed_media'
    )
  );

-- Only file owner or platform admin may overwrite or delete objects
CREATE POLICY "Nexus owner media update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (owner = auth.uid() OR public.is_nexus_admin())
  WITH CHECK (owner = auth.uid() OR public.is_nexus_admin());

CREATE POLICY "Nexus owner media delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (owner = auth.uid() OR public.is_nexus_admin());

-- Clean up temporary helper routines used only during migration?
-- Note: Keeping _drop_all_policies_on_table and _apply_table_rls is harmless or we can drop the temporary setup helpers while keeping is_nexus_admin / is_band_owner / is_entity_admin_or_owner!
DROP FUNCTION IF EXISTS public._apply_table_rls(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public._drop_all_policies_on_table(TEXT);

COMMIT;
