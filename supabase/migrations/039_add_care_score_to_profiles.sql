-- 039_add_care_score_to_profiles.sql
-- Description:
--   Fixes 400 Bad Request errors when querying profiles table:
--   1. Adds missing `care_score` column
--   2. The frontend queries profiles by `id` but the table uses `user_id` as the FK.
--      The `id` column is UUID and should match auth.uid() for lookups to work.
--
--   Root Cause: Frontend calls `.eq('id', userId)` but the profiles table has
--   `id` as a separate UUID and `user_id` as the FK to auth.users.
--
--   Fix: We need to ensure that for profiles, the `id` column IS the user_id,
--   OR update the frontend to use `.eq('user_id', userId)`.
--   Since changing the table structure is complex, we'll update the frontend query.
--
--   This migration adds the missing `care_score` column.

BEGIN;

-- Add care_score column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'care_score'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN care_score INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added care_score column to profiles table';
    END IF;
END $$;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_care_score ON public.profiles(care_score DESC);

COMMIT;
