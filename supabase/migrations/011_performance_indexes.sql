-- 011_performance_indexes.sql
-- Description:
--   Additional performance indexes for common query patterns
--   These indexes optimize frequently used queries identified in performance audit
--   Safe to run even if some tables don't exist yet (uses DO blocks to check existence)

BEGIN;

-- Composite index for user_accessories queries filtering by pet_id and equipped status
-- This optimizes the query: SELECT * FROM user_accessories WHERE pet_id = ? AND equipped = true
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_accessories') THEN
    CREATE INDEX IF NOT EXISTS idx_user_accessories_pet_equipped 
    ON public.user_accessories(pet_id, equipped) 
    WHERE equipped = true;
  END IF;
END $$;

-- Index for finance_transactions queries by user_id and created_at (for date range queries)
-- Note: This table is created in migration 005_finance_system.sql
-- If that migration hasn't been run, this index creation will be skipped
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_transactions') THEN
    -- Check if composite index doesn't already exist (migration 005 creates separate indexes)
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'finance_transactions' 
      AND indexname = 'idx_finance_transactions_user_created'
    ) THEN
      CREATE INDEX idx_finance_transactions_user_created 
      ON public.finance_transactions(user_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- Index for user_quests queries by user_id and status
-- Note: This table is created in migration 006_quests.sql
-- The table is named 'user_quests', not 'quest_progress'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_quests') THEN
    -- Check if composite index doesn't already exist (migration 006 creates separate indexes)
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'user_quests' 
      AND indexname = 'idx_user_quests_user_status'
    ) THEN
      CREATE INDEX idx_user_quests_user_status 
      ON public.user_quests(user_id, status);
    END IF;
  END IF;
END $$;

COMMIT;

