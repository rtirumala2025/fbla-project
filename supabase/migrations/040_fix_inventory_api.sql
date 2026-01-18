-- 040_fix_inventory_api.sql
-- Description: Ensure inventory-related columns and test data exist for feeding system

BEGIN;

-- ========== VERIFY/ADD COLUMNS ==========
-- Ensure usage_type column exists on finance_shop_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'finance_shop_items'
        AND column_name = 'usage_type'
    ) THEN
        ALTER TABLE public.finance_shop_items ADD COLUMN usage_type TEXT;
        ALTER TABLE public.finance_shop_items 
          ADD CONSTRAINT chk_usage_type_040
          CHECK (usage_type IS NULL OR usage_type IN ('food', 'hygiene', 'accessory', 'toy'));
    END IF;
END $$;

-- Ensure stat_effects column exists on finance_shop_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'finance_shop_items'
        AND column_name = 'stat_effects'
    ) THEN
        ALTER TABLE public.finance_shop_items ADD COLUMN stat_effects JSONB DEFAULT NULL;
    END IF;
END $$;

-- ========== SEED TEST FOOD ITEMS ==========
-- These are consumable food items that can be used via the inventory API

INSERT INTO public.finance_shop_items (sku, name, description, category, price, stock, is_active, emoji, usage_type, stat_effects)
VALUES
    ('food-apple', 'Apple', 'A fresh, juicy apple. Restores hunger.', 'Food', 5, 999, TRUE, '🍎', 'food', '{"hunger": 15, "health": 5}'::jsonb),
    ('food-bone', 'Tasty Bone', 'A crunchy treat that pets love.', 'Food', 8, 999, TRUE, '🦴', 'food', '{"hunger": 20, "health": 8}'::jsonb),
    ('food-kibble', 'Premium Kibble', 'Nutritious pet food.', 'Food', 10, 999, TRUE, '🍖', 'food', '{"hunger": 25, "health": 10}'::jsonb)
ON CONFLICT (sku) DO UPDATE SET
    usage_type = EXCLUDED.usage_type,
    stat_effects = EXCLUDED.stat_effects;

-- ========== ENSURE WALLET AND INVENTORY HELPERS ==========
-- Grant demo user some inventory items for testing

-- Create wallet for user if not exists (used by finance_inventory FK)
-- This helper function may already exist from 005_finance_system.sql
CREATE OR REPLACE FUNCTION public.ensure_finance_wallet(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  wallet_id UUID;
BEGIN
  SELECT id INTO wallet_id FROM public.finance_wallets WHERE user_id = p_user_id;
  IF wallet_id IS NULL THEN
    INSERT INTO public.finance_wallets (user_id) VALUES (p_user_id)
    RETURNING id INTO wallet_id;
  END IF;
  RETURN wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
