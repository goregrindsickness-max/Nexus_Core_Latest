-- Migration: Add optional Month & Day birthday columns and shoutout preference to public.profiles
-- Note: Birth year is intentionally omitted for privacy.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthday_month smallint CHECK (birthday_month IS NULL OR (birthday_month >= 1 AND birthday_month <= 12)),
  ADD COLUMN IF NOT EXISTS birthday_day smallint CHECK (birthday_day IS NULL OR (birthday_day >= 1 AND birthday_day <= 31)),
  ADD COLUMN IF NOT EXISTS show_birthday_shoutout boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.birthday_month IS 'Optional birth month (1-12) for scene birthday shoutouts; no birth year stored.';
COMMENT ON COLUMN public.profiles.birthday_day IS 'Optional birth day (1-31) for scene birthday shoutouts; no birth year stored.';
COMMENT ON COLUMN public.profiles.show_birthday_shoutout IS 'Whether to display the Birthday Today badge and Birthday Horns button on the user''s birthday.';

-- Reload PostgREST schema cache so the new columns are immediately recognized by the API
NOTIFY pgrst, 'reload schema';
