-- 005_finance_system.sql
-- Description:
--   Finance subsystem covering wallets, transactions, shop catalog, inventory, and savings goals.

BEGIN;

CREATE TABLE IF NOT EXISTS public.finance_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'COIN',
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  donation_total INTEGER NOT NULL DEFAULT 0,
  active_goal_id UUID,
  last_allowance_at TIMESTAMPTZ,
  goals_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- finance_goals referenced above; create table first to avoid dependency issues.
CREATE TABLE IF NOT EXISTS public.finance_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.finance_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  current_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notifications JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.finance_wallets
  DROP CONSTRAINT IF EXISTS fk_finance_wallet_active_goal;

ALTER TABLE public.finance_wallets
  ADD CONSTRAINT fk_finance_wallet_active_goal
    FOREIGN KEY (active_goal_id) REFERENCES public.finance_goals(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS trg_finance_wallets_timestamps ON public.finance_wallets;
CREATE TRIGGER trg_finance_wallets_timestamps
BEFORE INSERT OR UPDATE ON public.finance_wallets
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

DROP TRIGGER IF EXISTS trg_finance_goals_timestamps ON public.finance_goals;
CREATE TRIGGER trg_finance_goals_timestamps
BEFORE INSERT OR UPDATE ON public.finance_goals
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_finance_wallets_user_id ON public.finance_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_goals_wallet_id ON public.finance_goals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_finance_goals_user_id ON public.finance_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_goals_status ON public.finance_goals(status);

CREATE TABLE IF NOT EXISTS public.finance_shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  emoji TEXT,
  species_tags TEXT[] DEFAULT '{}',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_finance_shop_items_timestamps ON public.finance_shop_items;
CREATE TRIGGER trg_finance_shop_items_timestamps
BEFORE INSERT OR UPDATE ON public.finance_shop_items
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_finance_shop_items_category ON public.finance_shop_items(category);
CREATE INDEX IF NOT EXISTS idx_finance_shop_items_active ON public.finance_shop_items(is_active);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.finance_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id TEXT,
  item_name TEXT,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('income', 'expense', 'purchase', 'reward', 'donation', 'allowance')
  ),
  category TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  balance_after INTEGER,
  related_goal_id UUID REFERENCES public.finance_goals(id) ON DELETE SET NULL,
  related_shop_item_id UUID REFERENCES public.finance_shop_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_wallet_id ON public.finance_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_id ON public.finance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_created_at ON public.finance_transactions(created_at DESC);

CREATE TABLE IF NOT EXISTS public.finance_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.finance_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  shop_item_id UUID REFERENCES public.finance_shop_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, item_id)
);

DROP TRIGGER IF EXISTS trg_finance_inventory_timestamps ON public.finance_inventory;
CREATE TRIGGER trg_finance_inventory_timestamps
BEFORE INSERT OR UPDATE ON public.finance_inventory
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_finance_inventory_user_id ON public.finance_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_inventory_wallet_id ON public.finance_inventory(wallet_id);

ALTER TABLE public.finance_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS finance_wallets_select_own ON public.finance_wallets;
CREATE POLICY finance_wallets_select_own
ON public.finance_wallets
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS finance_wallets_modify_own ON public.finance_wallets;
CREATE POLICY finance_wallets_modify_own
ON public.finance_wallets
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS finance_goals_select_own ON public.finance_goals;
CREATE POLICY finance_goals_select_own
ON public.finance_goals
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS finance_goals_modify_own ON public.finance_goals;
CREATE POLICY finance_goals_modify_own
ON public.finance_goals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS finance_transactions_select_own ON public.finance_transactions;
CREATE POLICY finance_transactions_select_own
ON public.finance_transactions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS finance_transactions_insert_own ON public.finance_transactions;
CREATE POLICY finance_transactions_insert_own
ON public.finance_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS finance_transactions_update_own ON public.finance_transactions;
CREATE POLICY finance_transactions_update_own
ON public.finance_transactions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS finance_transactions_delete_own ON public.finance_transactions;
CREATE POLICY finance_transactions_delete_own
ON public.finance_transactions
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS finance_inventory_select_own ON public.finance_inventory;
CREATE POLICY finance_inventory_select_own
ON public.finance_inventory
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS finance_inventory_modify_own ON public.finance_inventory;
CREATE POLICY finance_inventory_modify_own
ON public.finance_inventory
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Helper to ensure wallets exist when compatibility views insert rows.
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
$$ LANGUAGE plpgsql;

-- Backward compatibility views for Supabase client code.
CREATE OR REPLACE VIEW public.shop_items AS
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

CREATE OR REPLACE VIEW public.pet_inventory AS
SELECT
  id,
  user_id,
  item_id,
  quantity,
  created_at
FROM public.finance_inventory;

CREATE OR REPLACE VIEW public.transactions AS
SELECT
  id,
  user_id,
  item_id,
  item_name,
  amount,
  transaction_type,
  created_at
FROM public.finance_transactions;

CREATE OR REPLACE FUNCTION public.transactions_view_insert()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_view_insert ON public.transactions;
CREATE TRIGGER trg_transactions_view_insert
INSTEAD OF INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.transactions_view_insert();

-- Shop catalog is world-readable but managed via service role.
GRANT SELECT ON public.finance_shop_items TO authenticated;
GRANT ALL ON public.finance_shop_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_inventory TO authenticated;

GRANT ALL ON public.finance_wallets TO service_role;
GRANT ALL ON public.finance_goals TO service_role;
GRANT ALL ON public.finance_transactions TO service_role;
GRANT ALL ON public.finance_inventory TO service_role;

GRANT SELECT ON public.shop_items TO authenticated;
GRANT SELECT ON public.pet_inventory TO authenticated;
GRANT SELECT, INSERT ON public.transactions TO authenticated;

GRANT ALL ON public.shop_items TO service_role;
GRANT ALL ON public.pet_inventory TO service_role;
GRANT ALL ON public.transactions TO service_role;

COMMIT;


