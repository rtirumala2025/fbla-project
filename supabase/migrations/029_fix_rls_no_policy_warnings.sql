-- 029_fix_rls_no_policy_warnings.sql
-- Description:
--   Addresses "RLS Enabled No Policy" warnings for AI and Finance tables.
--   Ensures all tables have appropriate policies and use optimized subqueries.

BEGIN;

-- ============================================================================
-- 1. AI Feature Tables (Re-applying with Optimization)
-- ============================================================================

-- Table: public.ai_chat_sessions
ALTER TABLE IF EXISTS public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_chat_sessions_select_own ON public.ai_chat_sessions;
DROP POLICY IF EXISTS ai_chat_sessions_modify_own ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "ai_chat_sessions_manage_own" ON public.ai_chat_sessions;

CREATE POLICY "ai_chat_sessions_manage_own"
ON public.ai_chat_sessions
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.ai_chat_messages
ALTER TABLE IF EXISTS public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_chat_messages_select_own ON public.ai_chat_messages;
DROP POLICY IF EXISTS ai_chat_messages_insert_own ON public.ai_chat_messages;
DROP POLICY IF EXISTS ai_chat_messages_update_own ON public.ai_chat_messages;
DROP POLICY IF EXISTS ai_chat_messages_delete_own ON public.ai_chat_messages;
DROP POLICY IF EXISTS "ai_chat_messages_manage_own" ON public.ai_chat_messages;

CREATE POLICY "ai_chat_messages_manage_own"
ON public.ai_chat_messages
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.budget_advisor_analyses
ALTER TABLE IF EXISTS public.budget_advisor_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budget_advisor_select_own ON public.budget_advisor_analyses;
DROP POLICY IF EXISTS budget_advisor_insert_own ON public.budget_advisor_analyses;
DROP POLICY IF EXISTS "budget_advisor_manage_own" ON public.budget_advisor_analyses;

CREATE POLICY "budget_advisor_manage_own"
ON public.budget_advisor_analyses
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.coach_advice_history
ALTER TABLE IF EXISTS public.coach_advice_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS coach_advice_select_own ON public.coach_advice_history;
DROP POLICY IF EXISTS coach_advice_insert_own ON public.coach_advice_history;
DROP POLICY IF EXISTS "coach_advice_manage_own" ON public.coach_advice_history;

CREATE POLICY "coach_advice_manage_own"
ON public.coach_advice_history
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- ============================================================================
-- 2. Finance Compatibility Tables/Views
-- ============================================================================

-- Table/View: public.transactions
DO $$
BEGIN
    -- If it's a base table, add RLS and policy
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions' AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "transactions_manage_own" ON public.transactions;
        CREATE POLICY "transactions_manage_own"
        ON public.transactions
        FOR ALL
        TO authenticated
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    -- If it's a view, set security_invoker = on
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions' AND table_type = 'VIEW'
    ) THEN
        ALTER VIEW public.transactions SET (security_invoker = on);
    END IF;
END $$;

COMMIT;
