-- 030_harden_rls_policies.sql
-- Description:
--   Hardens security by restricting direct user modification of sensitive finance data.
--   Standard users can no longer INSERT/UPDATE/DELETE their own wallet or inventory directly.
--   Modifications MUST be done via the backend API (service role).

BEGIN;

-- ============================================================================
-- 1. finance_wallets
-- ============================================================================

-- Drop the overly permissive "modify own" policy
DROP POLICY IF EXISTS "finance_wallets_modify_own" ON public.finance_wallets;

-- Policy: Users can only READ their own wallet
DROP POLICY IF EXISTS "finance_wallets_select_own" ON public.finance_wallets;
CREATE POLICY "finance_wallets_select_own" 
ON public.finance_wallets 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);


-- ============================================================================
-- 2. finance_inventory
-- ============================================================================

-- Drop the overly permissive "modify own" policy
DROP POLICY IF EXISTS "finance_inventory_modify_own" ON public.finance_inventory;

-- Policy: Users can only READ their own inventory
DROP POLICY IF EXISTS "finance_inventory_select_own" ON public.finance_inventory;
CREATE POLICY "finance_inventory_select_own" 
ON public.finance_inventory 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);


-- ============================================================================
-- 3. finance_transactions
-- ============================================================================

-- Restrict transactions to READ ONLY for the user. 
-- The backend API will handle transaction creation using the service role.
DROP POLICY IF EXISTS "finance_transactions_insert_own" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_update_own" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_delete_own" ON public.finance_transactions;

-- Keep selective access
DROP POLICY IF EXISTS "finance_transactions_select_own" ON public.finance_transactions;
CREATE POLICY "finance_transactions_select_own" 
ON public.finance_transactions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);


-- ============================================================================
-- 4. pets (Hardening)
-- ============================================================================

-- While users need to update their pet, we will soon restrict the API.
-- For now, ensure only valid columns are updated if possible (Postgres doesn't support column-level RLS easily).
-- However, we can restrict the update policy to ONLY certain actions if we use RPC, 
-- but since the app uses direct Supabase for fetching, we keep SELECT.
-- The API uses Python, so we don't need to change pets RLS yet, 
-- but we should ensure the Python backend is the primary source of truth for stats.

COMMIT;
