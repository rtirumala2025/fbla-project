-- 036_room_system.sql
-- Description:
--   Add equipped_loadout column to pets and usage_type to shop items
--   to support the Pet House Multi-Room Hub system.

BEGIN;

-- ========== PETS TABLE: Add equipped_loadout column ==========
-- Stores currently equipped accessories by slot (e.g., {"collar": "item-uuid", "hat": "item-uuid"})
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pets' 
    AND column_name = 'equipped_loadout'
  ) THEN
    ALTER TABLE public.pets ADD COLUMN equipped_loadout JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ========== SHOP ITEMS: Add usage_type column ==========
-- Classifies items for room-based filtering (food, hygiene, accessory, toy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'finance_shop_items' 
    AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE public.finance_shop_items ADD COLUMN usage_type TEXT;
  END IF;
END $$;

-- Add check constraint for valid usage types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_usage_type'
  ) THEN
    ALTER TABLE public.finance_shop_items 
      ADD CONSTRAINT chk_usage_type 
      CHECK (usage_type IS NULL OR usage_type IN ('food', 'hygiene', 'accessory', 'toy'));
  END IF;
END $$;

-- Create index for filtering by usage_type
CREATE INDEX IF NOT EXISTS idx_finance_shop_items_usage_type 
  ON public.finance_shop_items(usage_type) 
  WHERE usage_type IS NOT NULL;

-- ========== UPDATE EXISTING ITEMS WITH usage_type ==========

-- Set food items
UPDATE public.finance_shop_items 
SET usage_type = 'food'
WHERE usage_type IS NULL 
  AND (
    category IN ('food', 'consumables')
    OR sku LIKE 'food-%'
    OR sku LIKE 'treat-%'
    OR name ILIKE '%apple%'
    OR name ILIKE '%treat%'
    OR name ILIKE '%food%'
    OR name ILIKE '%snack%'
    OR name ILIKE '%bone%'
  );

-- Set hygiene items
UPDATE public.finance_shop_items 
SET usage_type = 'hygiene'
WHERE usage_type IS NULL 
  AND (
    category IN ('care', 'health', 'hygiene')
    OR sku LIKE 'care-%'
    OR sku LIKE 'hygiene-%'
    OR name ILIKE '%shampoo%'
    OR name ILIKE '%soap%'
    OR name ILIKE '%brush%'
    OR name ILIKE '%bath%'
    OR name ILIKE '%clean%'
  );

-- Set accessory items (already have metadata.equippable = true)
UPDATE public.finance_shop_items 
SET usage_type = 'accessory'
WHERE usage_type IS NULL 
  AND (
    category = 'accessories'
    OR sku LIKE 'acc-%'
    OR (metadata->>'equippable')::boolean = true
  );

-- Set toy items
UPDATE public.finance_shop_items 
SET usage_type = 'toy'
WHERE usage_type IS NULL 
  AND (
    category IN ('toys', 'toy')
    OR sku LIKE 'toy-%'
    OR name ILIKE '%ball%'
    OR name ILIKE '%toy%'
    OR name ILIKE '%frisbee%'
  );

-- ========== ADD stat_effects JSONB to shop items for item-specific stat changes ==========
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

-- Set default stat effects for food items
UPDATE public.finance_shop_items 
SET stat_effects = '{"hunger": 15, "health": 5}'::jsonb
WHERE usage_type = 'food' AND stat_effects IS NULL;

-- Set default stat effects for hygiene items
UPDATE public.finance_shop_items 
SET stat_effects = '{"hygiene": 25, "health": 3}'::jsonb
WHERE usage_type = 'hygiene' AND stat_effects IS NULL;

-- Set default stat effects for toy items
UPDATE public.finance_shop_items 
SET stat_effects = '{"energy": -10, "xp": 15}'::jsonb
WHERE usage_type = 'toy' AND stat_effects IS NULL;

COMMIT;
