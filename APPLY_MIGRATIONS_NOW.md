# 🚨 URGENT: Apply Database Migrations to Fix 406 Errors

## Problem
Your app shows `406 Not Acceptable` errors because **the database tables don't exist yet**.

The migration files exist but haven't been applied to your Supabase database.

## Solution: Apply Migrations Manually

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `xhhtkjtcdeewesijxbts`
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Apply Each Migration (IN ORDER)

Copy and paste the contents of each file below into the SQL Editor and click **Run** after each one:

#### Migration 1: `000_profiles_table.sql`

```bash
cat supabase/migrations/000_profiles_table.sql
```

Copy the entire contents and run it in SQL Editor.

#### Migration 2: `001_user_preferences.sql`

```bash
cat supabase/migrations/001_user_preferences.sql
```

Copy the entire contents and run it in SQL Editor.

#### Migration 3: `002_pets_table_complete.sql`

```bash
cat supabase/migrations/002_pets_table_complete.sql
```

Copy the entire contents and run it in SQL Editor.

### Step 3: Verify Tables Exist

Run this verification query in SQL Editor:

```sql
-- Check all tables exist
SELECT 
  schemaname, 
  tablename, 
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE 
  schemaname = 'public' 
  AND tablename IN ('profiles', 'pets', 'user_preferences')
ORDER BY tablename;

-- Check RLS policies exist
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd AS operation
FROM pg_policies
WHERE tablename IN ('profiles', 'pets', 'user_preferences')
ORDER BY tablename, cmd;

-- Check table columns
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name IN ('profiles', 'pets', 'user_preferences')
ORDER BY table_name, ordinal_position;
```

Expected output:
- **3 tables**: profiles, pets, user_preferences
- **RLS enabled**: true for all 3 tables
- **12+ RLS policies**: SELECT, INSERT, UPDATE, DELETE for each table
- **30+ columns total** across all tables

### Step 4: Create Profile for Test User

After migrations, manually create a profile for your test user:

```sql
-- Insert profile for test user
INSERT INTO public.profiles (user_id, username, coins)
VALUES (
  '13cab41e-af70-41fa-b4e7-0f664afe0115',  -- Your test user ID from console logs
  'test_user',
  100
)
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  updated_at = NOW();

-- Verify profile created
SELECT * FROM public.profiles WHERE user_id = '13cab41e-af70-41fa-b4e7-0f664afe0115';
```

### Step 5: Reload Your App

1. Go back to `http://localhost:3002`
2. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Check browser console - the `406` errors should be **GONE**
4. You should see:
   - `profileService.ts:27` → ✅ Profile found
   - `PetContext.tsx:84` → ✅ Ready to create pet

## Quick Commands (Terminal)

### Option A: Copy migration contents to clipboard (Mac)

```bash
# Copy profiles migration
cat supabase/migrations/000_profiles_table.sql | pbcopy
# Now paste into Supabase SQL Editor and run

# Copy user_preferences migration
cat supabase/migrations/001_user_preferences.sql | pbcopy
# Paste and run

# Copy pets migration
cat supabase/migrations/002_pets_table.sql | pbcopy
# Paste and run
```

### Option B: Use Supabase CLI (if installed)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref xhhtkjtcdeewesijxbts

# Apply all migrations
supabase db push

# Verify
supabase db diff
```

## Troubleshooting

### Error: "relation already exists"
✅ **Safe to ignore** - means the table was already created. Continue with next migration.

### Error: "permission denied"
❌ **Check your Supabase permissions** - you may need to use the service role key or contact your project admin.

### Error: "function update_updated_at_column already exists"
✅ **Safe to ignore** - the function is shared across tables. Use `CREATE OR REPLACE FUNCTION` (already in migration).

### Still getting 406 errors after migrations?
1. Check the verification queries show all 3 tables
2. Verify RLS is enabled: `rowsecurity = true`
3. Ensure you're logged in as `test@fbla-project.test`
4. Hard refresh the browser
5. Check Network tab - status should be `200 OK` not `406`

## Expected Results

### Before Migrations (Current State):
```
❌ GET /rest/v1/profiles?... → 406 Not Acceptable
❌ GET /rest/v1/pets?... → 406 Not Acceptable
❌ No profile found for user
❌ No pet found for user
```

### After Migrations (Fixed State):
```
✅ GET /rest/v1/profiles?... → 200 OK
✅ GET /rest/v1/pets?... → 200 OK (or 404 if no pet yet)
✅ Profile loaded: { username: 'test_user', coins: 100 }
✅ Ready to create pet
```

## Next Steps After Migrations

1. ✅ Verify all 3 tables exist
2. ✅ Create profile for test user
3. ✅ Reload app and confirm 406 errors are gone
4. ✅ Test creating a pet
5. ✅ Test updating username in profile
6. ✅ Test updating settings

---

**DO THIS NOW** → Go to Supabase SQL Editor and apply the 3 migrations in order!


