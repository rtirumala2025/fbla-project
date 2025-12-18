-- 016_fix_pets_rls_policy.sql
-- Description:
--   Fix RLS policy for pets table to allow authenticated users to insert their own pets.
--   The issue is that the foreign key references public.users but RLS uses auth.uid().
--   This migration ensures the foreign key references auth.users and RLS policies work correctly.

BEGIN;

-- First, drop the existing foreign key constraint if it references public.users
DO $$
BEGIN
  -- Drop the old foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.pets'::regclass 
    AND conname LIKE '%user_id%'
    AND confrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_user_id_fkey;
    ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_user_id_users_id_fkey;
  END IF;
END $$;

-- Add foreign key constraint to auth.users instead of public.users
-- This ensures consistency with RLS policies that use auth.uid()
DO $$
BEGIN
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
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the INSERT policy to ensure it's correct
DROP POLICY IF EXISTS pets_insert_own ON public.pets;
CREATE POLICY pets_insert_own
ON public.pets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure other policies are correct
DROP POLICY IF EXISTS pets_select_own ON public.pets;
CREATE POLICY pets_select_own
ON public.pets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

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

COMMIT;

