-- 021_fix_pets_foreign_key_and_policies.sql
-- Description:
--   Fix pets table foreign key to auth.users and ensure all RLS policies exist
--   This addresses issues found in Phase 1 verification

BEGIN;

-- ============================================================================
-- STEP 1: Fix foreign key to auth.users(id)
-- ============================================================================

-- Drop any existing foreign key constraints on pets.user_id
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find and drop all foreign key constraints on pets.user_id
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.pets'::regclass
      AND contype = 'f'
      AND conkey::text LIKE '%user_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

-- Add foreign key to auth.users(id) if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.pets'::regclass 
    AND confrelid = 'auth.users'::regclass
    AND contype = 'f'
  ) THEN
    ALTER TABLE public.pets
      ADD CONSTRAINT pets_user_id_auth_users_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
    
    RAISE NOTICE 'Created foreign key: pets.user_id → auth.users(id)';
  ELSE
    RAISE NOTICE 'Foreign key already exists: pets.user_id → auth.users(id)';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure all RLS policies exist for pets table
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (using dynamic SQL to catch all possible names)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop all policies on pets table
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'pets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pets', policy_record.policyname);
  END LOOP;
END $$;

-- Create SELECT policy (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pets'
      AND cmd = 'SELECT'
      AND policyname = 'pets_select_own'
  ) THEN
    CREATE POLICY pets_select_own
    ON public.pets
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    RAISE NOTICE 'Created SELECT policy';
  END IF;
END $$;

-- Create INSERT policy (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pets'
      AND cmd = 'INSERT'
      AND policyname = 'pets_insert_own'
  ) THEN
    CREATE POLICY pets_insert_own
    ON public.pets
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created INSERT policy';
  END IF;
END $$;

-- Create UPDATE policy (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pets'
      AND cmd = 'UPDATE'
      AND policyname = 'pets_update_own'
  ) THEN
    CREATE POLICY pets_update_own
    ON public.pets
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created UPDATE policy';
  END IF;
END $$;

-- Create DELETE policy (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pets'
      AND cmd = 'DELETE'
      AND policyname = 'pets_delete_own'
  ) THEN
    CREATE POLICY pets_delete_own
    ON public.pets
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
    RAISE NOTICE 'Created DELETE policy';
  END IF;
END $$;

-- Ensure grants are correct
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

-- ============================================================================
-- STEP 3: Verify the fixes
-- ============================================================================

DO $$
DECLARE
  fk_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Check foreign key
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE conrelid = 'public.pets'::regclass
    AND confrelid = 'auth.users'::regclass
    AND contype = 'f';
  
  IF fk_count = 0 THEN
    RAISE WARNING 'Foreign key to auth.users not found after fix attempt';
  ELSE
    RAISE NOTICE '✓ Foreign key to auth.users verified';
  END IF;
  
  -- Check policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'pets';
  
  IF policy_count < 4 THEN
    RAISE WARNING 'Expected 4 RLS policies, found %', policy_count;
  ELSE
    RAISE NOTICE '✓ RLS policies verified: % policies found', policy_count;
  END IF;
END $$;

COMMIT;

