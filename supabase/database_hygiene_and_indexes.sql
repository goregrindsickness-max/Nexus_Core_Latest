-- ==========================================
-- NEXUS CORE: Database Hygiene & Performance Indexes
-- ==========================================

-- 1. Unschedule broken cron job and safely guard purge_expired_stories function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE command ILIKE '%purge_expired_stories%';
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.purge_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') THEN
    EXECUTE 'DELETE FROM public.stories WHERE created_at < NOW() - INTERVAL ''24 hours''';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nexus_stories') THEN
    EXECUTE 'DELETE FROM public.nexus_stories WHERE created_at < NOW() - INTERVAL ''24 hours''';
  END IF;
END;
$$;

-- 2. Foreign key indexes to eliminate sequential scans (seq_scan)

-- Follows table indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON public.follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_follows_artist_id ON public.follows(artist_id);
CREATE INDEX IF NOT EXISTS idx_follows_composite ON public.follows(follower_id, followed_id);

-- Bands table indexes
CREATE INDEX IF NOT EXISTS idx_bands_creator_id ON public.bands(creator_id);
CREATE INDEX IF NOT EXISTS idx_bands_user_id ON public.bands(user_id);
CREATE INDEX IF NOT EXISTS idx_bands_owner_id ON public.bands(owner_id);
CREATE INDEX IF NOT EXISTS idx_bands_profile_id ON public.bands(profile_id);
CREATE INDEX IF NOT EXISTS idx_bands_custom_slug ON public.bands(custom_slug);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_console_handle ON public.profiles(console_handle);

-- Shows table indexes
CREATE INDEX IF NOT EXISTS idx_shows_show_date ON public.shows(show_date);
CREATE INDEX IF NOT EXISTS idx_shows_date ON public.shows(date);
CREATE INDEX IF NOT EXISTS idx_shows_creator_id ON public.shows(creator_id);
