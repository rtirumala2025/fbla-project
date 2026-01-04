-- 025_fix_function_search_paths.sql
-- Description:
--   Fixes "Function Search Path Mutable" warnings by explicitly setting search_path.
--   Moves pg_net extension to 'extensions' schema if possible.

BEGIN;

-- ============================================================================
-- 1. Fix Function Search Paths (Explicitly for known local functions)
-- ============================================================================

-- public.set_timestamps()
ALTER FUNCTION public.set_timestamps() SET search_path = public, extensions, pg_temp;

-- public.ensure_auth_link()
ALTER FUNCTION public.ensure_auth_link() SET search_path = public, extensions, pg_temp;

-- public.sync_from_auth_users()
ALTER FUNCTION public.sync_from_auth_users() SET search_path = public, extensions, pg_temp;

-- public.ensure_finance_wallet(p_user_id UUID)
ALTER FUNCTION public.ensure_finance_wallet(UUID) SET search_path = public, extensions, pg_temp;

-- public.transactions_view_insert()
ALTER FUNCTION public.transactions_view_insert() SET search_path = public, extensions, pg_temp;

-- public.send_welcome_email_trigger()
ALTER FUNCTION public.send_welcome_email_trigger() SET search_path = public, extensions, pg_temp;

-- public.update_chat_session_stats() (Assuming no args based on usage in 014)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_chat_session_stats') THEN
        ALTER FUNCTION public.update_chat_session_stats() SET search_path = public, extensions, pg_temp;
    END IF;
END $$;

-- public.sync_pet_type_from_species() (Assuming no args based on usage in 020)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_pet_type_from_species') THEN
        ALTER FUNCTION public.sync_pet_type_from_species() SET search_path = public, extensions, pg_temp;
    END IF;
END $$;


-- ============================================================================
-- 2. Fix Function Search Paths (Dynamic for reported but not found locally)
-- ============================================================================
-- These functions were reported by the linter but not found in local migrations.
-- We use dynamic SQL to fix them if they exist in the DB.

DO $$
DECLARE
    func_record RECORD;
    func_sig TEXT;
BEGIN
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'update_balance_after_transaction',
            'handle_new_user',
            'record_portfolio_snapshot',
            'get_portfolio_performance',
            'update_updated_at_column'
        )
    LOOP
        func_sig := format('%I.%I(%s)', func_record.nspname, func_record.proname, func_record.args);
        RAISE NOTICE 'Fixing search_path for function: %', func_sig;
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions, pg_temp', func_sig);
    END LOOP;
END $$;


-- ============================================================================
-- 3. Extension Schema (Skipped for pg_net)
-- ============================================================================
-- NOTE: pg_net does not support 'SET SCHEMA'. 
-- If you need to move it out of public, you must manually:
-- DROP EXTENSION pg_net CASCADE;
-- CREATE EXTENSION pg_net SCHEMA net;
-- (Warning: This will drop any functions/triggers depending on pg_net)

COMMIT;
