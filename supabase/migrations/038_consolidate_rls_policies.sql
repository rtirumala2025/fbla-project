-- 038_consolidate_rls_policies.sql
-- Description:
--   Fixes performance warnings by:
--   1. Dropping ALL duplicate/redundant policies on finance tables and game_leaderboards
--   2. Recreating single consolidated policies using (SELECT auth.uid()) subquery
--   3. Ensuring no multiple_permissive_policies warnings

BEGIN;

-- ============================================================================
-- 1. finance_wallets: Drop all existing policies, create single consolidated policy
-- ============================================================================

DROP POLICY IF EXISTS "finance_wallets_select_own" ON public.finance_wallets;
DROP POLICY IF EXISTS "finance_wallets_modify_own" ON public.finance_wallets;
DROP POLICY IF EXISTS "finance_wallets_manage_own" ON public.finance_wallets;

CREATE POLICY "finance_wallets_manage_own"
ON public.finance_wallets
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 2. finance_goals: Drop all existing policies, create single consolidated policy
-- ============================================================================

DROP POLICY IF EXISTS "finance_goals_select_own" ON public.finance_goals;
DROP POLICY IF EXISTS "finance_goals_modify_own" ON public.finance_goals;
DROP POLICY IF EXISTS "finance_goals_manage_own" ON public.finance_goals;

CREATE POLICY "finance_goals_manage_own"
ON public.finance_goals
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 3. finance_transactions: Drop all existing policies, create single consolidated policy
-- ============================================================================

DROP POLICY IF EXISTS "finance_transactions_select_own" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_insert_own" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_update_own" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_delete_own" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_manage_own" ON public.finance_transactions;

CREATE POLICY "finance_transactions_manage_own"
ON public.finance_transactions
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 4. finance_inventory: Drop all existing policies, create single consolidated policy
-- ============================================================================

DROP POLICY IF EXISTS "finance_inventory_select_own" ON public.finance_inventory;
DROP POLICY IF EXISTS "finance_inventory_modify_own" ON public.finance_inventory;
DROP POLICY IF EXISTS "finance_inventory_manage_own" ON public.finance_inventory;

CREATE POLICY "finance_inventory_manage_own"
ON public.finance_inventory
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 5. game_leaderboards: Drop all existing policies, create single consolidated policy
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read all leaderboards" ON public.game_leaderboards;
DROP POLICY IF EXISTS "game_leaderboards_select_all" ON public.game_leaderboards;
DROP POLICY IF EXISTS "game_leaderboards_upsert_own" ON public.game_leaderboards;

-- Single SELECT policy for public read access
CREATE POLICY "game_leaderboards_read_all"
ON public.game_leaderboards
FOR SELECT
TO authenticated
USING (true);

-- Single policy for write access (INSERT, UPDATE, DELETE)
CREATE POLICY "game_leaderboards_write_own"
ON public.game_leaderboards
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "game_leaderboards_update_own"
ON public.game_leaderboards
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "game_leaderboards_delete_own"
ON public.game_leaderboards
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

COMMIT;
