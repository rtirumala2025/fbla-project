# Database Migration Instructions

The Supabase/PostgreSQL schema is maintained through the SQL files in `supabase/migrations`.  
Each migration is idempotent and wrapped in an explicit transaction. Apply them in numeric order:

```
000_core_schema.sql
001_profiles_and_preferences.sql
002_pets.sql
003_social_layer.sql
004_accessories_and_art_cache.sql
005_finance_system.sql
006_quests.sql
007_games.sql
008_analytics_and_sync.sql
009_realtime_and_replication.sql
```

## Applying Migrations

### Option 1 – Supabase CLI (recommended)

```bash
# from the project root
cd supabase

# apply every migration in order
supabase db push

# or execute a single migration file
supabase db execute --file migrations/005_finance_system.sql
```

### Option 2 – Supabase SQL Editor

1. Sign in to the Supabase dashboard for the project.
2. Navigate to **SQL Editor → New query**.
3. Paste the contents of the first migration file (`000_core_schema.sql`) and run it.
4. Repeat for each subsequent file, ensuring the numeric order is preserved.

### Option 3 – Direct `psql`

```bash
# Replace placeholders with your Supabase connection values.
psql "postgresql://postgres:<YOUR-PASSWORD>@db.<PROJECT>.supabase.co:5432/postgres"

# Then execute each migration in order.
\i migrations/000_core_schema.sql
\i migrations/001_profiles_and_preferences.sql
...
\i migrations/009_realtime_and_replication.sql
```

## Post-Migration Verification

Run the following queries to confirm the schema is healthy and RLS is active:

```sql
-- 1. Confirm critical tables exist
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'profiles', 'user_preferences', 'pets',
    'finance_wallets', 'finance_transactions', 'finance_goals', 'finance_inventory',
    'quests', 'user_quests',
    'game_rounds', 'game_sessions', 'game_leaderboards', 'game_achievements',
    'analytics_daily_snapshots', 'analytics_notifications', 'cloud_sync_snapshots',
    'friends', 'public_profiles'
  )
ORDER BY tablename;

-- 2. Check compatibility views (expected: view)
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('shop_items', 'transactions', 'pet_inventory');

-- 3. Inspect a sample policy set
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'pets', 'finance_wallets', 'user_quests')
ORDER BY tablename, cmd;
```

For a deeper audit, review `db_verification_queries.sql` in the repository which includes additional integrity checks.

## Rollback Helpers

To remove the custom schema (for example in a staging reset), drop tables in reverse dependency order:

```sql
DROP VIEW IF EXISTS public.transactions, public.shop_items, public.pet_inventory;
DROP TABLE IF EXISTS public.analytics_notifications,
                     public.analytics_monthly_snapshots,
                     public.analytics_weekly_snapshots,
                     public.analytics_daily_snapshots,
                     public.cloud_sync_snapshots,
                     public.game_achievements,
                     public.game_leaderboards,
                     public.game_sessions,
                     public.game_rounds,
                     public.user_quests,
                     public.quests,
                     public.finance_inventory,
                     public.finance_transactions,
                     public.finance_shop_items,
                     public.finance_goals,
                     public.finance_wallets,
                     public.pet_art_cache,
                     public.user_accessories,
                     public.accessories,
                     public.public_profiles,
                     public.friends,
                     public.pets,
                     public.user_preferences,
                     public.profiles,
                     public.users
CASCADE;
DROP TYPE IF EXISTS public.pet_mood;
```

## Additional Notes

- `000_core_schema.sql` integrates Supabase Auth with the `public.users` table via triggers.
- RLS is enforced on every user-owned table. Service-role connections (used by the FastAPI backend) bypass RLS, but regular authenticated clients only see their own rows.
- Compatibility views (`shop_items`, `transactions`, `pet_inventory`) keep legacy Supabase client code working while the backend uses the richer `finance_*` tables.
- `009_realtime_and_replication.sql` adds the new tables to the `supabase_realtime` publication and forces `REPLICA IDENTITY FULL` where real-time updates are expected.

Always back up production data before applying migrations.
