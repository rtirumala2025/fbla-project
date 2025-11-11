-- 009_realtime_and_replication.sql
-- Description:
--   Configure realtime publication and replica identity for user-facing tables.

BEGIN;

DO $$
DECLARE
  target TEXT;
  tables TEXT[] := ARRAY[
    'public.profiles',
    'public.user_preferences',
    'public.pets',
    'public.friends',
    'public.public_profiles',
    'public.accessories',
    'public.user_accessories',
    'public.pet_art_cache',
    'public.finance_wallets',
    'public.finance_transactions',
    'public.finance_goals',
    'public.finance_inventory',
    'public.finance_shop_items',
    'public.quests',
    'public.user_quests',
    'public.game_rounds',
    'public.game_sessions',
    'public.game_leaderboards',
    'public.game_achievements',
    'public.analytics_daily_snapshots',
    'public.analytics_weekly_snapshots',
    'public.analytics_monthly_snapshots',
    'public.analytics_notifications',
    'public.cloud_sync_snapshots'
  ];
BEGIN
  FOREACH target IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %s REPLICA IDENTITY FULL;', target);
  END LOOP;
END
$$;

DO $$
DECLARE
  entry TEXT;
  schema_name TEXT;
  table_name TEXT;
BEGIN
  FOR entry IN SELECT unnest(ARRAY[
    'public.profiles',
    'public.user_preferences',
    'public.pets',
    'public.friends',
    'public.public_profiles',
    'public.accessories',
    'public.user_accessories',
    'public.pet_art_cache',
    'public.finance_wallets',
    'public.finance_transactions',
    'public.finance_goals',
    'public.finance_inventory',
    'public.finance_shop_items',
    'public.quests',
    'public.user_quests',
    'public.game_rounds',
    'public.game_sessions',
    'public.game_leaderboards',
    'public.game_achievements',
    'public.analytics_daily_snapshots',
    'public.analytics_weekly_snapshots',
    'public.analytics_monthly_snapshots',
    'public.analytics_notifications',
    'public.cloud_sync_snapshots'
  ]) LOOP
    schema_name := split_part(entry, '.', 1);
    table_name := split_part(entry, '.', 2);
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = schema_name
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I.%I;', schema_name, table_name);
    END IF;
  END LOOP;
END
$$;

COMMIT;


