-- 057_fix_pets_rls_final.sql
-- Description:
--   Cleans up and restablishes definitive RLS policies for the pets table.
--   Ensures that authenticated users can manage their own pets without RLS violations.

BEGIN;

-- ============================================================================
-- 1. Clean up existing policies on public.pets
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'pets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pets', policy_record.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- 2. Enable and Harden RLS
-- ============================================================================

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Create Definitive Policies
-- ============================================================================

-- SELECT: Users can read their own pet
CREATE POLICY "pets_select_own"
ON public.pets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can create their own pet
CREATE POLICY "pets_insert_own"
ON public.pets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own pet
CREATE POLICY "pets_update_own"
ON public.pets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own pet
CREATE POLICY "pets_delete_own"
ON public.pets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Ensure Grants are correct
-- ============================================================================

GRANT ALL ON public.pets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;

-- ============================================================================
-- 5. Final Verification of User Table Policies (Consistency)
-- ============================================================================

DROP POLICY IF EXISTS "users_read_own" ON public.users;
CREATE POLICY "users_read_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

COMMIT;
