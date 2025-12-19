-- 019_performance_indexes.sql
-- Description:
--   Additional performance indexes for query optimization.
--   These indexes target common query patterns identified in the audit.

BEGIN;

-- Quest progress queries: frequently filter by user_id, status, and order by progress
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_quests') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'user_quests' 
      AND indexname = 'idx_user_quests_user_status_progress'
    ) THEN
      CREATE INDEX idx_user_quests_user_status_progress 
      ON public.user_quests(user_id, status, progress DESC);
    END IF;
  END IF;
END $$;

-- Finance transactions by type: filter transactions by type and date
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_transactions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'finance_transactions' 
      AND indexname = 'idx_finance_transactions_type'
    ) THEN
      CREATE INDEX idx_finance_transactions_type 
      ON public.finance_transactions(transaction_type, created_at DESC);
    END IF;
  END IF;
END $$;

-- AI chat messages: retrieve conversation history in chronological order
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_chat_messages') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'ai_chat_messages' 
      AND indexname = 'idx_ai_chat_messages_session_created'
    ) THEN
      CREATE INDEX idx_ai_chat_messages_session_created 
      ON public.ai_chat_messages(session_id, created_at ASC);
    END IF;
  END IF;
END $$;

COMMIT;

