BEGIN;

-- Add last_stat_update to pets table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'last_stat_update') THEN
        ALTER TABLE public.pets ADD COLUMN last_stat_update TIMESTAMPTZ DEFAULT timezone('utc', now());
    END IF;
END $$;

-- Ensure it's populated for existing pets
UPDATE public.pets SET last_stat_update = updated_at WHERE last_stat_update IS NULL;

COMMIT;
