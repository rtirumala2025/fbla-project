# 🚀 Step-by-Step: Apply Database Migrations

**Follow these exact steps to apply all 3 migrations to your Supabase database.**

---

## Prerequisites

✅ Supabase project URL: `https://supabase.com/dashboard/project/xhhtkjtcdeewesijxbts`  
✅ You have access to the Supabase SQL Editor  
✅ You're logged into your Supabase account

---

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/xhhtkjtcdeewesijxbts
2. Click **SQL Editor** in the left sidebar
3. Click **New query** button (top right)

---

## Step 2: Apply Migration 1 - Profiles Table

**Copy the entire contents of `supabase/migrations/000_profiles_table.sql` and paste into SQL Editor, then click "Run".**

Expected output:
- ✅ "Success. No rows returned"
- ✅ No errors should appear

**What this creates:**
- `profiles` table with columns: id, user_id, username, avatar_url, coins, created_at, updated_at
- 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- Auto-create profile trigger on user signup
- Indexes for performance

---

## Step 3: Apply Migration 2 - User Preferences Table

**Copy the entire contents of `supabase/migrations/001_user_preferences.sql` and paste into SQL Editor, then click "Run".**

Expected output:
- ✅ "Success. No rows returned"
- ✅ No errors should appear

**What this creates:**
- `user_preferences` table with columns: id, user_id, sound, music, notifications, reduced_motion, high_contrast, created_at, updated_at
- 4 RLS policies
- Auto-update trigger for updated_at

---

## Step 4: Apply Migration 3 - Pets Table

**Copy the entire contents of `supabase/migrations/002_pets_table_complete.sql` and paste into SQL Editor, then click "Run".**

Expected output:
- ✅ "Success. No rows returned"
- ✅ No errors should appear

**What this creates:**
- `pets` table with columns: id, user_id, name, species, breed, age, level, health, hunger, happiness, cleanliness, energy, xp, last_fed_at, last_played_at, created_at, updated_at
- 4 RLS policies
- Unique constraint (one pet per user)

---

## Step 5: Verify Tables Exist

**Run this verification query in SQL Editor:**

```sql
-- Check all tables exist and RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE 
  schemaname = 'public' 
  AND tablename IN ('profiles', 'pets', 'user_preferences')
ORDER BY tablename;
```

**Expected output:**
```
schemaname | tablename          | rls_enabled
-----------|--------------------|-------------
public     | pets               | true
public     | profiles           | true
public     | user_preferences   | true
```

**If you see 3 rows with `rls_enabled = true`, migrations are successful! ✅**

---

## Step 6: Verify RLS Policies

**Run this query to check policies:**

```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd AS operation
FROM pg_policies
WHERE tablename IN ('profiles', 'pets', 'user_preferences')
ORDER BY tablename, cmd;
```

**Expected:** 12 policies total (4 per table: SELECT, INSERT, UPDATE, DELETE)

---

## Step 7: Create Test User Profile (Optional)

**After logging into your app, get your user ID from the browser console, then run:**

```sql
-- Replace 'YOUR_USER_ID_HERE' with actual user ID from browser console
INSERT INTO public.profiles (user_id, username, coins)
VALUES (
  'YOUR_USER_ID_HERE',  -- Get from: console.log(supabase.auth.getUser()) in browser
  'test_user',
  100
)
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  updated_at = NOW();

-- Verify profile was created
SELECT * FROM public.profiles WHERE user_id = 'YOUR_USER_ID_HERE';
```

---

## Troubleshooting

### Error: "relation already exists"
✅ **Safe to ignore** - table already created. Continue with next migration.

### Error: "function update_updated_at_column already exists"
✅ **Safe to ignore** - function is shared across tables. Migration uses `CREATE OR REPLACE`.

### Error: "permission denied"
❌ Check you're using the SQL Editor (not trying to run as anonymous user). If using service role key, ensure it's set correctly.

### Migration succeeds but tables don't appear
1. Refresh the Supabase dashboard
2. Go to **Table Editor** → verify tables appear
3. Check you're looking at the correct project

---

## Next Steps After Migrations

1. ✅ Hard refresh your app (Cmd+Shift+R / Ctrl+Shift+R)
2. ✅ Check browser console - `406` errors should be **GONE**
3. ✅ Test login → should see profile data loading
4. ✅ Test pet creation → should save to database
5. ✅ Test settings → should persist across reloads

---

**Status:** Once you complete Steps 1-5, your app will be ready to use Supabase! 🎉

