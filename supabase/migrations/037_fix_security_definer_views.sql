-- 037_fix_security_definer_views.sql
-- Description:
--   Fixes SECURITY DEFINER view warnings by recreating views with security_invoker = true.
--   Fixes remaining function search_path issues by re-applying the setting.
--   
--   Issues Fixed:
--   - security_definer_view on public.shop_items
--   - security_definer_view on public.pet_inventory
--   - security_definer_view on public.transactions
--   - function_search_path_mutable on public.ensure_finance_wallet
--   - function_search_path_mutable on public.transactions_view_insert

BEGIN;

-- ============================================================================
-- 1. Recreate Views with security_invoker = true
-- ============================================================================

-- Drop and recreate shop_items view
DROP VIEW IF EXISTS public.shop_items CASCADE;
CREATE VIEW public.shop_items
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  category,
  price,
  COALESCE(emoji, '✨') AS emoji,
  description,
  COALESCE(species_tags, '{}') AS species_tags,
  created_at
FROM public.finance_shop_items
WHERE is_active IS TRUE;

-- Drop and recreate pet_inventory view
DROP VIEW IF EXISTS public.pet_inventory CASCADE;
CREATE VIEW public.pet_inventory
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  item_id,
  quantity,
  created_at
FROM public.finance_inventory;

-- Drop and recreate transactions view
DROP VIEW IF EXISTS public.transactions CASCADE;
CREATE VIEW public.transactions
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  item_id,
  item_name,
  amount,
  transaction_type,
  created_at
FROM public.finance_transactions;

-- ============================================================================
-- 2. Recreate the transactions view trigger
-- ============================================================================

-- The trigger was dropped with CASCADE, recreate it
DROP TRIGGER IF EXISTS trg_transactions_view_insert ON public.transactions;
CREATE TRIGGER trg_transactions_view_insert
INSTEAD OF INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.transactions_view_insert();

-- ============================================================================
-- 3. Re-grant permissions on views
-- ============================================================================

GRANT SELECT ON public.shop_items TO authenticated;
GRANT SELECT ON public.pet_inventory TO authenticated;
GRANT SELECT, INSERT ON public.transactions TO authenticated;

GRANT ALL ON public.shop_items TO service_role;
GRANT ALL ON public.pet_inventory TO service_role;
GRANT ALL ON public.transactions TO service_role;

-- ============================================================================
-- 4. Fix Function Search Paths (Re-apply to ensure they stick)
-- ============================================================================

-- Recreate ensure_finance_wallet with explicit search_path
CREATE OR REPLACE FUNCTION public.ensure_finance_wallet(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
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
$$;

-- Recreate transactions_view_insert with explicit search_path
CREATE OR REPLACE FUNCTION public.transactions_view_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  wallet_id UUID;
  new_balance INTEGER;
  shop_item_id UUID;
BEGIN
  wallet_id := public.ensure_finance_wallet(NEW.user_id);

  SELECT id INTO shop_item_id
  FROM public.finance_shop_items
  WHERE sku = NEW.item_id OR id::text = NEW.item_id
  LIMIT 1;

  UPDATE public.finance_wallets
  SET balance = balance + NEW.amount,
      lifetime_earned = lifetime_earned + CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
      lifetime_spent = lifetime_spent + CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
      donation_total = donation_total + CASE WHEN NEW.transaction_type = 'donation' THEN ABS(NEW.amount) ELSE 0 END,
      updated_at = timezone('utc', now())
  WHERE id = wallet_id
  RETURNING balance INTO new_balance;

  INSERT INTO public.finance_transactions (
    wallet_id,
    user_id,
    item_id,
    item_name,
    amount,
    transaction_type,
    category,
    description,
    metadata,
    balance_after,
    related_goal_id,
    related_shop_item_id,
    created_at
  )
  VALUES (
    wallet_id,
    NEW.user_id,
    NEW.item_id,
    NEW.item_name,
    NEW.amount,
    NEW.transaction_type,
    COALESCE(NULLIF(NEW.transaction_type, ''), 'general'),
    NEW.item_name,
    jsonb_build_object(
      'source', 'supabase_view',
      'item_id', NEW.item_id,
      'item_name', NEW.item_name
    ),
    new_balance,
    NULL,
    shop_item_id,
    timezone('utc', now())
  )
  RETURNING id, created_at INTO NEW.id, NEW.created_at;

  RETURN NEW;
END;
$$;

COMMIT;
