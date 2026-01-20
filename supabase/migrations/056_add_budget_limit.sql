-- 056_add_budget_limit.sql
-- Add monthly_budget_limit to finance_wallets and RPC to update it.

BEGIN;

-- 1. Add column to finance_wallets
ALTER TABLE public.finance_wallets
ADD COLUMN IF NOT EXISTS monthly_budget_limit INTEGER NOT NULL DEFAULT 1000;

-- 2. Create RPC function to securely update the limit
CREATE OR REPLACE FUNCTION public.update_budget_limit(new_limit INTEGER)
RETURNS JSONB AS $$
DECLARE
  wallet_result JSONB;
BEGIN
  -- Validate input
  IF new_limit < 0 THEN
    RAISE EXCEPTION 'Budget limit cannot be negative';
  END IF;

  -- Update the wallet for the current user
  UPDATE public.finance_wallets
  SET 
    monthly_budget_limit = new_limit,
    updated_at = timezone('utc', now())
  WHERE user_id = auth.uid()
  RETURNING to_jsonb(finance_wallets.*) INTO wallet_result;

  IF wallet_result IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;

  RETURN wallet_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_budget_limit(INTEGER) TO authenticated;

COMMIT;
