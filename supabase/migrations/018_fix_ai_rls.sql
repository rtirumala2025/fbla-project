-- 018_fix_ai_rls.sql
-- Description:
--   Enable RLS and create policies for AI feature tables created in migration 014.
--   These tables were created without RLS, which is a security vulnerability.
--   This migration is defensive and will skip tables that don't exist yet.

BEGIN;

-- AI Chat Sessions: Enable RLS and create policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_chat_sessions') THEN
    ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS ai_chat_sessions_select_own ON public.ai_chat_sessions;
    CREATE POLICY ai_chat_sessions_select_own ON public.ai_chat_sessions
    FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS ai_chat_sessions_modify_own ON public.ai_chat_sessions;
    CREATE POLICY ai_chat_sessions_modify_own ON public.ai_chat_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_sessions TO authenticated;
    GRANT ALL ON public.ai_chat_sessions TO service_role;
  END IF;
END $$;

-- AI Chat Messages: Enable RLS and create policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_chat_messages') THEN
    ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS ai_chat_messages_select_own ON public.ai_chat_messages;
    CREATE POLICY ai_chat_messages_select_own ON public.ai_chat_messages
    FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS ai_chat_messages_insert_own ON public.ai_chat_messages;
    CREATE POLICY ai_chat_messages_insert_own ON public.ai_chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS ai_chat_messages_update_own ON public.ai_chat_messages;
    CREATE POLICY ai_chat_messages_update_own ON public.ai_chat_messages
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS ai_chat_messages_delete_own ON public.ai_chat_messages;
    CREATE POLICY ai_chat_messages_delete_own ON public.ai_chat_messages
    FOR DELETE USING (auth.uid() = user_id);
    
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_messages TO authenticated;
    GRANT ALL ON public.ai_chat_messages TO service_role;
  END IF;
END $$;

-- Budget Advisor Analyses: Enable RLS and create policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budget_advisor_analyses') THEN
    ALTER TABLE public.budget_advisor_analyses ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS budget_advisor_select_own ON public.budget_advisor_analyses;
    CREATE POLICY budget_advisor_select_own ON public.budget_advisor_analyses
    FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS budget_advisor_insert_own ON public.budget_advisor_analyses;
    CREATE POLICY budget_advisor_insert_own ON public.budget_advisor_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    GRANT SELECT, INSERT ON public.budget_advisor_analyses TO authenticated;
    GRANT ALL ON public.budget_advisor_analyses TO service_role;
  END IF;
END $$;

-- Coach Advice History: Enable RLS and create policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coach_advice_history') THEN
    ALTER TABLE public.coach_advice_history ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS coach_advice_select_own ON public.coach_advice_history;
    CREATE POLICY coach_advice_select_own ON public.coach_advice_history
    FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS coach_advice_insert_own ON public.coach_advice_history;
    CREATE POLICY coach_advice_insert_own ON public.coach_advice_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    GRANT SELECT, INSERT ON public.coach_advice_history TO authenticated;
    GRANT ALL ON public.coach_advice_history TO service_role;
  END IF;
END $$;

COMMIT;

