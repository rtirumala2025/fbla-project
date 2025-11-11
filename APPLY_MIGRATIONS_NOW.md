# 🚨 CRITICAL: Apply Supabase Migrations Now

The new backend relies on a fully rebuilt Supabase schema. Apply every migration in `supabase/migrations` **before running the app or seeding data**.

---

## ✅ Prerequisites

- Supabase project URL: `https://xhhtkjtcdeewesijxbts.supabase.co`
- Access to the Supabase dashboard SQL Editor (or Supabase CLI)
- Service role key stored locally (used by backend API)

---

## 📦 Migration Order (10 scripts total)

1. `000_core_schema.sql` – UUID extension, shared timestamp trigger, `public.users` wiring with Supabase Auth triggers.
2. `001_profiles_and_preferences.sql` – Profiles + user preferences tables with RLS.
3. `002_pets.sql` – Comprehensive pet stats, diary, ENUMs, RLS.
4. `003_social_layer.sql` – Friends graph + public profiles.
5. `004_accessories_and_art_cache.sql` – Accessory catalog, user equipment state, AI art cache.
6. `005_finance_system.sql` – Wallets, shop catalog, inventory, compatibility views (`shop_items`, `transactions`, `pet_inventory`).
7. `006_quests.sql` – Quest catalog + per-user progress.
8. `007_games.sql` – Game rounds, sessions, leaderboards, achievements.
9. `008_analytics_and_sync.sql` – Analytics snapshots + cloud sync state.
10. `009_realtime_and_replication.sql` – Realtime publication + replica identity updates.

👉 **All scripts are idempotent** – safe to rerun if needed.

---

## 🚀 Fastest Path – Supabase CLI

```bash
cd supabase
supabase db push
```

CLI automatically runs migrations in order. Prefer this for repeatable environments (CI, staging, prod).

### Manual Fallback – SQL Editor

For each file:
1. Dashboard → SQL Editor → New Query
2. Paste file contents
3. Press **Run**
4. Confirm `Success. No rows returned`

### Direct `psql`

```bash
psql "postgresql://postgres:<password>@db.xhhtkjtcdeewesijxbts.supabase.co:5432/postgres"
\i migrations/000_core_schema.sql
...
\i migrations/009_realtime_and_replication.sql
```

---

## 🔍 Quick Verification Checklist

Run these queries in the SQL editor after migrations finish:

```sql
-- 1. RLS is enabled everywhere
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles','pets','user_preferences',
    'finance_wallets','finance_transactions','finance_inventory',
    'quests','user_quests',
    'game_rounds','game_leaderboards','game_achievements',
    'analytics_daily_snapshots','analytics_notifications','cloud_sync_snapshots',
    'friends','public_profiles'
  )
ORDER BY tablename;

-- 2. Legacy compatibility views exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('shop_items', 'transactions', 'pet_inventory');

-- 3. Sample policy sanity check
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles','pets','finance_wallets','user_quests')
ORDER BY tablename, cmd;
```

All listed tables should report `rowsecurity = true`, and the compatibility views should be present as `VIEW`.

---

## 🌱 Seed & Smoke Test (optional but recommended)

> Run these only after migrations succeed.

```sql
-- Create or update a profile for your Supabase auth user
INSERT INTO public.profiles (user_id, username)
VALUES ('<USER_UUID>', 'demo_caretaker')
ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username;

-- Ensure wallet and balance via compatibility views
SELECT * FROM public.shop_items LIMIT 5;
SELECT * FROM public.transactions WHERE user_id = '<USER_UUID>' ORDER BY created_at DESC;
```

To populate richer demo data, use `scripts/seed_competition_data.sql` after verifying migrations.

---

## 🧯 Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `ERROR: relation already exists` | Migration rerun | Safe to ignore |
| `ERROR: duplicate key value violates unique constraint` | Rerun with same data | Safe to ignore |
| `permission denied for table ...` | Missing Supabase role privileges | Ensure you run using project owner credentials |
| `function ... does not exist` | Migration order skipped | Re-run from the first failing file in order |
| Realtime not broadcasting | `009` not applied | Re-run `009_realtime_and_replication.sql` |

---

## ✅ After Applying Migrations

1. Hard-refresh the frontend (clear cached Supabase schema).
2. Restart backend services (FastAPI and Supabase listeners) to pick up new tables.
3. Run automated verification: `node scripts/validate_migrations.js`.
4. Confirm real-time updates: equip/unequip accessories and watch live updates in the dashboard.

---

**Status:** ⏳ Waiting for the migrations above to be applied.  
**Blocker:** Backend + frontend remain in maintenance mode until this is done. Apply now!
