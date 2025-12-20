-- 020_additional_performance_indexes.sql
-- Description:
--   Additional performance indexes identified in the comprehensive performance audit.
--   These indexes target query patterns in the React frontend API calls.

BEGIN;

-- Pets table: Fast lookup by user_id (critical for auth flow)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pets') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'pets' 
      AND indexname = 'idx_pets_user_id_created'
    ) THEN
      CREATE INDEX idx_pets_user_id_created 
      ON public.pets(user_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- Profiles table: Fast balance lookup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND indexname = 'idx_profiles_user_coins'
    ) THEN
      CREATE INDEX idx_profiles_user_coins 
      ON public.profiles(user_id) INCLUDE (coins);
    END IF;
  END IF;
END $$;

-- Pet diary entries: Fast retrieval by pet_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pet_diary_entries') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'pet_diary_entries' 
      AND indexname = 'idx_pet_diary_entries_pet_created'
    ) THEN
      CREATE INDEX idx_pet_diary_entries_pet_created 
      ON public.pet_diary_entries(pet_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- Transactions table: User transaction history lookup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'transactions' 
      AND indexname = 'idx_transactions_user_created'
    ) THEN
      CREATE INDEX idx_transactions_user_created 
      ON public.transactions(user_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- Shop items: Category filtering and sorting
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_items') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'shop_items' 
      AND indexname = 'idx_shop_items_category'
    ) THEN
      CREATE INDEX idx_shop_items_category 
      ON public.shop_items(category, price);
    END IF;
  END IF;
END $$;

-- Coach advice: Recent advice lookup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coach_advice') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'coach_advice' 
      AND indexname = 'idx_coach_advice_user_created'
    ) THEN
      CREATE INDEX idx_coach_advice_user_created 
      ON public.coach_advice(user_id, created_at DESC);
    END IF;
  END IF;
END $$;

COMMIT;

