-- 020_pets_phase1_setup.sql
-- Description:
--   Phase 1 - Pets Database Setup
--   Ensures pets table has pet_type column and proper structure
--   Creates pet_accessories table with RLS policies
--   Verifies foreign key references auth.users(id) for proper RLS compatibility

BEGIN;

-- ============================================================================
-- STEP 1: Verify and fix pets table structure
-- ============================================================================

-- Ensure pets table exists (should already exist from 002_pets.sql)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pets') THEN
    CREATE TABLE public.pets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      pet_type TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat', 'panda')),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
    );
  END IF;
END $$;

-- Verify foreign key references auth.users(id) (should be fixed by 016_fix_pets_rls_policy.sql)
-- If it still references public.users, fix it
DO $$
BEGIN
  -- Check if foreign key exists and references auth.users
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.pets'::regclass 
    AND confrelid = 'public.users'::regclass
    AND conname LIKE '%user_id%'
  ) THEN
    -- Drop the old foreign key
    ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_user_id_fkey;
    ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_user_id_users_id_fkey;
    
    -- Add new foreign key to auth.users
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'public.pets'::regclass 
      AND conname = 'pets_user_id_auth_users_fkey'
    ) THEN
      ALTER TABLE public.pets
        ADD CONSTRAINT pets_user_id_auth_users_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add pet_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pets' 
    AND column_name = 'pet_type'
  ) THEN
    -- Add pet_type column without inline constraint (we'll add it separately)
    ALTER TABLE public.pets 
      ADD COLUMN pet_type TEXT;
    
    -- Populate pet_type from species if species column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'pets' 
      AND column_name = 'species'
    ) THEN
      -- Map species to pet_type (dog, cat, panda only)
      UPDATE public.pets
      SET pet_type = CASE 
        WHEN LOWER(species) = 'dog' THEN 'dog'
        WHEN LOWER(species) = 'cat' THEN 'cat'
        WHEN LOWER(species) = 'panda' THEN 'panda'
        ELSE 'dog'  -- Default fallback
      END
      WHERE pet_type IS NULL;
    END IF;
    
    -- Make pet_type NOT NULL after populating
    ALTER TABLE public.pets 
      ALTER COLUMN pet_type SET NOT NULL;
    
    -- Add check constraint (only if it doesn't exist)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'public.pets'::regclass 
      AND conname = 'pets_pet_type_check'
    ) THEN
      ALTER TABLE public.pets
        ADD CONSTRAINT pets_pet_type_check 
        CHECK (pet_type IN ('dog', 'cat', 'panda'));
    END IF;
  ELSE
    -- If pet_type exists, ensure it has the correct check constraint
    -- Drop the constraint if it exists (safe to do, we'll recreate it)
    ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_pet_type_check;
    
    -- Add the correct constraint (will fail if pet_type has invalid data, which is expected)
    -- This ensures the constraint is always correct
    ALTER TABLE public.pets
      ADD CONSTRAINT pets_pet_type_check 
      CHECK (pet_type IN ('dog', 'cat', 'panda'));
  END IF;
END $$;

-- Create trigger to sync pet_type from species when species is updated
-- This ensures pet_type stays in sync if species column is used
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pets' 
    AND column_name = 'species'
  ) THEN
    -- Create or replace function to sync pet_type from species
    CREATE OR REPLACE FUNCTION public.sync_pet_type_from_species()
    RETURNS TRIGGER AS $func$
    BEGIN
      -- Only update if species changed and pet_type doesn't match
      IF NEW.species IS DISTINCT FROM OLD.species OR NEW.pet_type IS NULL THEN
        NEW.pet_type := CASE 
          WHEN LOWER(NEW.species) = 'dog' THEN 'dog'
          WHEN LOWER(NEW.species) = 'cat' THEN 'cat'
          WHEN LOWER(NEW.species) = 'panda' THEN 'panda'
          ELSE COALESCE(NEW.pet_type, 'dog')  -- Keep existing or default to dog
        END;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    -- Drop and recreate trigger
    DROP TRIGGER IF EXISTS trg_sync_pet_type_from_species ON public.pets;
    CREATE TRIGGER trg_sync_pet_type_from_species
    BEFORE INSERT OR UPDATE ON public.pets
    FOR EACH ROW
    WHEN (NEW.species IS NOT NULL)
    EXECUTE FUNCTION public.sync_pet_type_from_species();
  END IF;
END $$;

-- Ensure required columns exist (id, user_id, pet_type, name, created_at)
DO $$
BEGIN
  -- Verify id column (should always exist as primary key)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pets' 
    AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'pets table missing required id column';
  END IF;

  -- Verify user_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pets' 
    AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'pets table missing required user_id column';
  END IF;

  -- Verify pet_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pets' 
    AND column_name = 'pet_type'
  ) THEN
    RAISE EXCEPTION 'pets table missing required pet_type column';
  END IF;

  -- Verify name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pets' 
    AND column_name = 'name'
  ) THEN
    RAISE EXCEPTION 'pets table missing required name column';
  END IF;

  -- Verify created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pets' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.pets 
      ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure RLS is enabled and policies are correct for pets table
-- ============================================================================

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate to ensure they're correct
DROP POLICY IF EXISTS pets_select_own ON public.pets;
CREATE POLICY pets_select_own
ON public.pets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pets_insert_own ON public.pets;
CREATE POLICY pets_insert_own
ON public.pets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pets_update_own ON public.pets;
CREATE POLICY pets_update_own
ON public.pets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pets_delete_own ON public.pets;
CREATE POLICY pets_delete_own
ON public.pets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure grants are correct
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

-- ============================================================================
-- STEP 3: Create pet_accessories table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pet_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  accessory_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Add timestamp trigger
DROP TRIGGER IF EXISTS trg_pet_accessories_timestamps ON public.pet_accessories;
CREATE TRIGGER trg_pet_accessories_timestamps
BEFORE INSERT OR UPDATE ON public.pet_accessories
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pet_accessories_pet_id ON public.pet_accessories(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_accessories_equipped ON public.pet_accessories(pet_id, equipped) WHERE equipped = TRUE;

-- ============================================================================
-- STEP 4: Configure RLS for pet_accessories table
-- ============================================================================

ALTER TABLE public.pet_accessories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access accessories for their own pets
-- This uses a subquery to check pet ownership via pets.user_id
DROP POLICY IF EXISTS pet_accessories_select_own ON public.pet_accessories;
CREATE POLICY pet_accessories_select_own
ON public.pet_accessories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_accessories.pet_id
    AND pets.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pet_accessories_insert_own ON public.pet_accessories;
CREATE POLICY pet_accessories_insert_own
ON public.pet_accessories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_accessories.pet_id
    AND pets.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pet_accessories_update_own ON public.pet_accessories;
CREATE POLICY pet_accessories_update_own
ON public.pet_accessories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_accessories.pet_id
    AND pets.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_accessories.pet_id
    AND pets.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pet_accessories_delete_own ON public.pet_accessories;
CREATE POLICY pet_accessories_delete_own
ON public.pet_accessories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_accessories.pet_id
    AND pets.user_id = auth.uid()
  )
);

-- Ensure grants are correct
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_accessories TO authenticated;
GRANT ALL ON public.pet_accessories TO service_role;

COMMIT;

