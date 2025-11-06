# 🚨 CRITICAL: Apply Database Migrations to Unblock App

## Step-by-Step Migration Execution

### Prerequisites
- ✅ Supabase project URL: `https://xhhtkjtcdeewesijxbts.supabase.co`
- ✅ Access to Supabase Dashboard: https://supabase.com/dashboard/project/xhhtkjtcdeewesijxbts
- ✅ SQL Editor access

---

## Migration 1: Profiles Table (MUST RUN FIRST)

**File**: `supabase/migrations/000_profiles_table.sql`

**Steps**:
1. Open Supabase Dashboard → SQL Editor
2. Click "New query"
3. Copy the entire contents of `000_profiles_table.sql`
4. Paste into SQL Editor
5. Click **Run** (bottom right)
6. Verify: Should see "Success. No rows returned"

**What it creates**:
- `profiles` table (username, coins, avatar_url)
- RLS policies (users can only access their own profile)
- Auto-create profile trigger on user signup
- Indexes for performance

---

## Migration 2: User Preferences Table

**File**: `supabase/migrations/001_user_preferences.sql`

**Steps**:
1. In SQL Editor, click "New query"
2. Copy contents of `001_user_preferences.sql`
3. Paste and click **Run**

**What it creates**:
- `user_preferences` table (sound, music, notifications settings)
- RLS policies
- Settings persistence for users

---

## Migration 3: Pets Table

**File**: `supabase/migrations/002_pets_table_complete.sql`

**Steps**:
1. In SQL Editor, click "New query"
2. Copy contents of `002_pets_table_complete.sql`
3. Paste and click **Run**

**What it creates**:
- `pets` table (name, species, breed, stats: health, hunger, happiness, cleanliness, energy)
- RLS policies
- One pet per user constraint

---

## Verification Queries

After running all 3 migrations, run these verification queries:

### 1. Check Tables Exist
```sql
SELECT 
  tablename, 
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'pets', 'user_preferences')
ORDER BY tablename;
```

**Expected Result**:
```
tablename          | rls_enabled
-------------------+------------
pets               | true
profiles           | true
user_preferences   | true
```

### 2. Check RLS Policies
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

**Expected Result**: 12 rows (4 policies per table: SELECT, INSERT, UPDATE, DELETE)

### 3. Check Table Structure
```sql
-- Profiles columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Pets columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pets'
ORDER BY ordinal_position;

-- User preferences columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_preferences'
ORDER BY ordinal_position;
```

---

## Create Test User Profile

After migrations, create a profile for your test user:

```sql
-- Replace USER_ID with your actual user ID from browser console
-- (Get it by logging in and checking auth.users table or browser console logs)

INSERT INTO public.profiles (user_id, username, coins)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace this!
  'test_user',
  100
)
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  updated_at = NOW();

-- Verify profile created
SELECT * FROM public.profiles WHERE user_id = 'YOUR_USER_ID_HERE';
```

**To find your user ID**:
1. Log in to the app
2. Open browser console (F12)
3. Look for: `🔵 Loading pet for user: <user-id>`
4. Or check Supabase Dashboard → Authentication → Users

---

## Troubleshooting

### Error: "relation already exists"
✅ **Safe to ignore** - Table was already created. Continue with next migration.

### Error: "function update_updated_at_column already exists"
✅ **Safe to ignore** - Function is shared across tables. The migration uses `CREATE OR REPLACE`.

### Error: "permission denied"
❌ **Check**: You need to be project owner or have SQL execution permissions.

### Error: "duplicate key value violates unique constraint"
✅ **Safe to ignore** - Policy/trigger already exists. The migration uses `CREATE OR REPLACE` / `DROP IF EXISTS`.

---

## Next Steps After Migrations

1. ✅ Hard refresh your app (Cmd+Shift+R / Ctrl+Shift+R)
2. ✅ Check browser console - should see `✅ Profile found` instead of `406 Not Acceptable`
3. ✅ Test creating a pet - should save to database
4. ✅ Test updating username - should persist
5. ✅ Test settings - should save preferences

---

**Status**: ⏳ Waiting for migrations to be applied
