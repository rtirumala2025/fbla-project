-- 028_add_missing_foreign_key_indexes.sql
-- Description: Adds missing indexes on foreign keys to satisfy Supabase linter "unindexed_foreign_keys" warnings.

BEGIN;

-- analytics_notifications.daily_snapshot_id
CREATE INDEX IF NOT EXISTS idx_analytics_notifications_daily_snapshot_id 
ON public.analytics_notifications(daily_snapshot_id);

-- finance_inventory.shop_item_id
CREATE INDEX IF NOT EXISTS idx_finance_inventory_shop_item_id 
ON public.finance_inventory(shop_item_id);

-- finance_transactions.related_goal_id
CREATE INDEX IF NOT EXISTS idx_finance_transactions_related_goal_id 
ON public.finance_transactions(related_goal_id);

-- finance_transactions.related_shop_item_id
CREATE INDEX IF NOT EXISTS idx_finance_transactions_related_shop_item_id 
ON public.finance_transactions(related_shop_item_id);

-- finance_wallets.active_goal_id
CREATE INDEX IF NOT EXISTS idx_finance_wallets_active_goal_id 
ON public.finance_wallets(active_goal_id);

-- game_sessions.round_id
CREATE INDEX IF NOT EXISTS idx_game_sessions_round_id 
ON public.game_sessions(round_id);

-- user_quests.quest_id
CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id 
ON public.user_quests(quest_id);

-- transactions.user_id (Conditional check as this might be a legacy table or view)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
    END IF;
END $$;

COMMIT;
