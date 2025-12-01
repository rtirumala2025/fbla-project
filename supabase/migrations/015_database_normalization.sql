-- 015_database_normalization.sql
-- Description:
--   Normalize database schema by removing redundant columns and enforcing foreign keys.
--   This migration removes redundant user_id columns that can be derived from foreign keys.

BEGIN;

-- Remove redundant user_id from finance_goals (can be derived from wallet_id -> user_id)
DO $$
BEGIN
  -- Check if user_id column exists and has data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'finance_goals' 
    AND column_name = 'user_id'
  ) THEN
    -- Verify data consistency before removing
    -- If there are any inconsistencies, we'll keep the column but add a constraint
    IF NOT EXISTS (
      SELECT 1 FROM public.finance_goals fg
      JOIN public.finance_wallets fw ON fg.wallet_id = fw.id
      WHERE fg.user_id != fw.user_id
    ) THEN
      -- Data is consistent, safe to remove
      ALTER TABLE public.finance_goals DROP COLUMN user_id;
      RAISE NOTICE 'Removed redundant user_id column from finance_goals';
    ELSE
      -- Data inconsistent, fix it first
      UPDATE public.finance_goals fg
      SET user_id = fw.user_id
      FROM public.finance_wallets fw
      WHERE fg.wallet_id = fw.id AND fg.user_id != fw.user_id;
      
      -- Then remove the column
      ALTER TABLE public.finance_goals DROP COLUMN user_id;
      RAISE NOTICE 'Fixed inconsistencies and removed redundant user_id column from finance_goals';
    END IF;
  END IF;
END $$;

-- Remove redundant user_id from finance_transactions (can be derived from wallet_id -> user_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'finance_transactions' 
    AND column_name = 'user_id'
  ) THEN
    -- Verify data consistency
    IF NOT EXISTS (
      SELECT 1 FROM public.finance_transactions ft
      JOIN public.finance_wallets fw ON ft.wallet_id = fw.id
      WHERE ft.user_id != fw.user_id
    ) THEN
      ALTER TABLE public.finance_transactions DROP COLUMN user_id;
      RAISE NOTICE 'Removed redundant user_id column from finance_transactions';
    ELSE
      -- Fix inconsistencies
      UPDATE public.finance_transactions ft
      SET user_id = fw.user_id
      FROM public.finance_wallets fw
      WHERE ft.wallet_id = fw.id AND ft.user_id != fw.user_id;
      
      ALTER TABLE public.finance_transactions DROP COLUMN user_id;
      RAISE NOTICE 'Fixed inconsistencies and removed redundant user_id column from finance_transactions';
    END IF;
  END IF;
END $$;

-- Ensure all foreign key constraints are properly enforced
DO $$
BEGIN
  -- Ensure finance_goals.wallet_id foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'finance_goals_wallet_id_fkey' 
    AND conrelid = 'public.finance_goals'::regclass
  ) THEN
    ALTER TABLE public.finance_goals
      ADD CONSTRAINT finance_goals_wallet_id_fkey
      FOREIGN KEY (wallet_id) 
      REFERENCES public.finance_wallets(id) 
      ON DELETE CASCADE;
  END IF;

  -- Ensure finance_transactions.wallet_id foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'finance_transactions_wallet_id_fkey' 
    AND conrelid = 'public.finance_transactions'::regclass
  ) THEN
    ALTER TABLE public.finance_transactions
      ADD CONSTRAINT finance_transactions_wallet_id_fkey
      FOREIGN KEY (wallet_id) 
      REFERENCES public.finance_wallets(id) 
      ON DELETE CASCADE;
  END IF;

  -- Ensure finance_inventory.wallet_id foreign key exists (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'finance_inventory'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'finance_inventory_wallet_id_fkey' 
      AND conrelid = 'public.finance_inventory'::regclass
    ) THEN
      ALTER TABLE public.finance_inventory
        ADD CONSTRAINT finance_inventory_wallet_id_fkey
        FOREIGN KEY (wallet_id) 
        REFERENCES public.finance_wallets(id) 
        ON DELETE CASCADE;
    END IF;
  END IF;

  -- Ensure pets.user_id foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pets_user_id_fkey' 
    AND conrelid = 'public.pets'::regclass
  ) THEN
    ALTER TABLE public.pets
      ADD CONSTRAINT pets_user_id_fkey
      FOREIGN KEY (user_id) 
      REFERENCES public.users(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better query performance on foreign keys
CREATE INDEX IF NOT EXISTS idx_finance_goals_wallet_id ON public.finance_goals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_wallet_id ON public.finance_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_created_at ON public.finance_transactions(created_at DESC);

-- Create a view to get user_id for finance_goals (for backward compatibility)
CREATE OR REPLACE VIEW public.finance_goals_with_user AS
SELECT 
  fg.*,
  fw.user_id
FROM public.finance_goals fg
JOIN public.finance_wallets fw ON fg.wallet_id = fw.id;

-- Create a view to get user_id for finance_transactions (for backward compatibility)
CREATE OR REPLACE VIEW public.finance_transactions_with_user AS
SELECT 
  ft.*,
  fw.user_id
FROM public.finance_transactions ft
JOIN public.finance_wallets fw ON ft.wallet_id = fw.id;

COMMIT;
