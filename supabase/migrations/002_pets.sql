-- 002_pets.sql
-- Description:
--   Establish comprehensive pets table capturing stats, lifecycle timestamps, and diaries.
--   Includes strict constraints and per-user RLS policies.

BEGIN;

DO $$
BEGIN
  CREATE TYPE public.pet_mood AS ENUM ('ecstatic', 'happy', 'content', 'sleepy', 'anxious', 'distressed', 'sad', 'moody');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT NOT NULL,
  color_pattern TEXT NOT NULL,
  birthday DATE NOT NULL,
  hunger INTEGER NOT NULL DEFAULT 70 CHECK (hunger BETWEEN 0 AND 100),
  happiness INTEGER NOT NULL DEFAULT 70 CHECK (happiness BETWEEN 0 AND 100),
  cleanliness INTEGER NOT NULL DEFAULT 70 CHECK (cleanliness BETWEEN 0 AND 100),
  energy INTEGER NOT NULL DEFAULT 70 CHECK (energy BETWEEN 0 AND 100),
  health INTEGER NOT NULL DEFAULT 80 CHECK (health BETWEEN 0 AND 100),
  last_fed TIMESTAMPTZ,
  last_played TIMESTAMPTZ,
  last_bathed TIMESTAMPTZ,
  last_slept TIMESTAMPTZ,
  mood public.pet_mood NOT NULL DEFAULT 'happy',
  diary JSONB NOT NULL DEFAULT '[]'::jsonb,
  traits JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_pets_timestamps ON public.pets;
CREATE TRIGGER trg_pets_timestamps
BEFORE INSERT OR UPDATE ON public.pets
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_pets_user_id ON public.pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_mood ON public.pets(mood);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pets_select_own ON public.pets;
CREATE POLICY pets_select_own
ON public.pets
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pets_insert_own ON public.pets;
CREATE POLICY pets_insert_own
ON public.pets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pets_update_own ON public.pets;
CREATE POLICY pets_update_own
ON public.pets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pets_delete_own ON public.pets;
CREATE POLICY pets_delete_own
ON public.pets
FOR DELETE
USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

COMMIT;


