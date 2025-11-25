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

-- Add missing columns if table already exists (from migration 004)
DO $$
BEGIN
  -- Add breed if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'breed') THEN
    ALTER TABLE public.pets ADD COLUMN breed TEXT NOT NULL DEFAULT 'Mixed';
  END IF;
  
  -- Add color_pattern if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'color_pattern') THEN
    ALTER TABLE public.pets ADD COLUMN color_pattern TEXT NOT NULL DEFAULT 'solid';
  END IF;
  
  -- Add birthday if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'birthday') THEN
    ALTER TABLE public.pets ADD COLUMN birthday DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
  
  -- Add stat columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'hunger') THEN
    ALTER TABLE public.pets ADD COLUMN hunger INTEGER NOT NULL DEFAULT 70 CHECK (hunger BETWEEN 0 AND 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'happiness') THEN
    ALTER TABLE public.pets ADD COLUMN happiness INTEGER NOT NULL DEFAULT 70 CHECK (happiness BETWEEN 0 AND 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'cleanliness') THEN
    ALTER TABLE public.pets ADD COLUMN cleanliness INTEGER NOT NULL DEFAULT 70 CHECK (cleanliness BETWEEN 0 AND 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'energy') THEN
    ALTER TABLE public.pets ADD COLUMN energy INTEGER NOT NULL DEFAULT 70 CHECK (energy BETWEEN 0 AND 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'health') THEN
    ALTER TABLE public.pets ADD COLUMN health INTEGER NOT NULL DEFAULT 80 CHECK (health BETWEEN 0 AND 100);
  END IF;
  
  -- Add timestamp columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'last_fed') THEN
    ALTER TABLE public.pets ADD COLUMN last_fed TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'last_played') THEN
    ALTER TABLE public.pets ADD COLUMN last_played TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'last_bathed') THEN
    ALTER TABLE public.pets ADD COLUMN last_bathed TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'last_slept') THEN
    ALTER TABLE public.pets ADD COLUMN last_slept TIMESTAMPTZ;
  END IF;
  
  -- Add mood column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'mood') THEN
    ALTER TABLE public.pets ADD COLUMN mood public.pet_mood NOT NULL DEFAULT 'happy';
  END IF;
  
  -- Add JSONB columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'diary') THEN
    ALTER TABLE public.pets ADD COLUMN diary JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'traits') THEN
    ALTER TABLE public.pets ADD COLUMN traits JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_pets_timestamps ON public.pets;
CREATE TRIGGER trg_pets_timestamps
BEFORE INSERT OR UPDATE ON public.pets
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_pets_user_id ON public.pets(user_id);

-- Only create mood index if mood column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pets' 
    AND column_name = 'mood'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_pets_mood ON public.pets(mood);
  END IF;
END $$;

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


