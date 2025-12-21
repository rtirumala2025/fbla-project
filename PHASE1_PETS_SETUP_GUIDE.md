# Phase 1 – Pets Database Setup Guide

This guide walks through verifying and setting up the `pets` and `pet_accessories` tables according to Phase 1 requirements.

---

## 📋 Requirements Checklist

### Pets Table
- ✅ `id` (uuid, primary key)
- ✅ `user_id` (foreign key → auth.users(id))
- ✅ `pet_type` (text, allowed: 'dog', 'cat', 'panda')
- ✅ `name` (text)
- ✅ `created_at` (timestamp, default now())
- ✅ RLS configured so only the user can access their own pet

### Pet Accessories Table
- ✅ `id` (uuid, primary key)
- ✅ `pet_id` (foreign key → pets(id))
- ✅ `accessory_key` (text)
- ✅ `display_name` (text)
- ✅ `equipped` (boolean, default false)
- ✅ RLS configured so only the pet owner can access their own accessories

---

## 🚀 Step 1: Apply Migration

### Option A: Supabase CLI (Recommended)

```bash
# Navigate to project root
cd /Users/ritviktirumala/fbla-project

# Apply the new migration
cd supabase
supabase db push
```

This will apply `020_pets_phase1_setup.sql` automatically.

### Option B: Supabase SQL Editor (Manual)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/xhhtkjtcdeewesijxbts
   - Navigate to **SQL Editor** → **New Query**

2. **Copy Migration SQL**
   ```bash
   cat supabase/migrations/020_pets_phase1_setup.sql
   ```
   Copy the entire output.

3. **Paste and Run**
   - Paste into SQL Editor
   - Click **Run**
   - Verify: `Success. No rows returned`

---

## ✅ Step 2: Verify Database Structure

Run the verification queries from `supabase/verify_pets_phase1.sql` in the Supabase SQL Editor:

### Quick Verification

```sql
-- Check pets table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pets'
ORDER BY ordinal_position;

-- Check pet_type constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%pet_type%';

-- Check foreign key to auth.users
SELECT 
  tc.constraint_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'pets'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users';

-- Check pet_accessories table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'pet_accessories';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('pets', 'pet_accessories');
```

**Expected Results:**
- ✅ `pets` table has columns: `id`, `user_id`, `pet_type`, `name`, `created_at`
- ✅ `pet_type` has CHECK constraint allowing only 'dog', 'cat', 'panda'
- ✅ `pets.user_id` foreign key references `auth.users(id)`
- ✅ `pet_accessories` table exists with all required columns
- ✅ Both tables have `rowsecurity = true`

---

## 🔒 Step 3: Verify RLS Policies

```sql
-- List all RLS policies for pets table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'pets';

-- List all RLS policies for pet_accessories table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'pet_accessories';
```

**Expected Policies:**

**Pets Table:**
- `pets_select_own` - SELECT using `auth.uid() = user_id`
- `pets_insert_own` - INSERT with check `auth.uid() = user_id`
- `pets_update_own` - UPDATE using/with check `auth.uid() = user_id`
- `pets_delete_own` - DELETE using `auth.uid() = user_id`

**Pet Accessories Table:**
- `pet_accessories_select_own` - SELECT via pet ownership check
- `pet_accessories_insert_own` - INSERT via pet ownership check
- `pet_accessories_update_own` - UPDATE via pet ownership check
- `pet_accessories_delete_own` - DELETE via pet ownership check

---

## 🧪 Step 4: Test Google OAuth (CRITICAL)

**⚠️ ABSOLUTE REQUIREMENT: Google OAuth must still work after migration**

### Test Steps:

1. **Clear browser cache/cookies** (or use incognito)
2. **Navigate to the app** (e.g., `http://localhost:3000`)
3. **Click "Sign in with Google"**
4. **Complete OAuth flow**
5. **Verify:**
   - ✅ User is redirected back to app
   - ✅ User session persists (check `localStorage` or `sessionStorage`)
   - ✅ Dashboard loads without errors
   - ✅ User can see their profile

### If OAuth Fails:

**STOP IMMEDIATELY** and roll back:

```sql
-- Rollback: Drop pet_accessories table
DROP TABLE IF EXISTS public.pet_accessories CASCADE;

-- Rollback: Remove pet_type column (if it was added)
ALTER TABLE public.pets DROP COLUMN IF EXISTS pet_type;

-- Verify pets table still works
SELECT * FROM public.pets LIMIT 1;
```

Then investigate the issue before proceeding.

---

## 🧪 Step 5: Test Pet Data Fetching

### As Authenticated User:

1. **Sign in** (via Google OAuth or email/password)
2. **Open browser console** (F12)
3. **Run in console:**

```javascript
// Test fetching pet data
const { data, error } = await supabase
  .from('pets')
  .select('*')
  .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  .single();

console.log('Pet data:', data);
console.log('Error:', error);
```

**Expected:**
- ✅ Returns pet data for logged-in user (or null if no pet exists)
- ✅ No RLS errors
- ✅ `pet_type` column is present in response

### Test Pet Accessories:

```javascript
// Test fetching pet accessories
const { data: petData } = await supabase
  .from('pets')
  .select('id')
  .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  .single();

if (petData) {
  const { data: accessories, error } = await supabase
    .from('pet_accessories')
    .select('*')
    .eq('pet_id', petData.id);
  
  console.log('Accessories:', accessories);
  console.log('Error:', error);
}
```

**Expected:**
- ✅ Returns accessories for user's pet (or empty array)
- ✅ No RLS errors

---

## 🧪 Step 6: Verify Frontend Compilation

```bash
# Navigate to frontend directory
cd frontend

# Check TypeScript compilation
npm run type-check
# or
npx tsc --noEmit
```

**Expected:**
- ✅ No TypeScript errors
- ✅ All type definitions are valid

### If TypeScript Errors Occur:

The migration adds `pet_type` column but keeps `species` column for backward compatibility. The frontend should continue using `species`. If errors occur:

1. Check if any code references `pet_type` directly
2. Ensure `species` column still exists (it should)
3. The trigger syncs `pet_type` from `species`, so both should be in sync

---

## 📊 Step 7: Data Integrity Check

```sql
-- Check for invalid pet_type values
SELECT id, name, pet_type, species
FROM public.pets
WHERE pet_type NOT IN ('dog', 'cat', 'panda')
   OR pet_type IS NULL;

-- Count pets by pet_type
SELECT pet_type, COUNT(*) as count
FROM public.pets
GROUP BY pet_type
ORDER BY pet_type;

-- Check pet_accessories data
SELECT 
  pa.id,
  pa.pet_id,
  p.name as pet_name,
  p.user_id,
  pa.accessory_key,
  pa.display_name,
  pa.equipped
FROM public.pet_accessories pa
JOIN public.pets p ON pa.pet_id = p.id
LIMIT 10;
```

**Expected:**
- ✅ All `pet_type` values are 'dog', 'cat', or 'panda'
- ✅ No NULL `pet_type` values
- ✅ `pet_accessories` can be joined with `pets` successfully

---

## 🔄 Migration Details

### What the Migration Does:

1. **Pets Table:**
   - Adds `pet_type` column if missing
   - Populates `pet_type` from `species` column (if exists)
   - Adds CHECK constraint: `pet_type IN ('dog', 'cat', 'panda')`
   - Creates trigger to sync `pet_type` from `species` on INSERT/UPDATE
   - Verifies foreign key references `auth.users(id)` (not `public.users(id)`)
   - Ensures RLS policies are correct

2. **Pet Accessories Table:**
   - Creates `pet_accessories` table if missing
   - Adds all required columns
   - Sets up foreign key to `pets(id)`
   - Configures RLS policies to check pet ownership

### Backward Compatibility:

- ✅ `species` column remains unchanged (frontend continues to use it)
- ✅ `pet_type` is automatically synced from `species` via trigger
- ✅ Existing pets get `pet_type` populated automatically
- ✅ No breaking changes to existing queries

---

## 🚨 Troubleshooting

### Issue: Migration fails with foreign key error

**Cause:** `pets.user_id` still references `public.users(id)` instead of `auth.users(id)`

**Fix:** Migration 016 should have fixed this. If not, run:

```sql
ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_user_id_fkey;
ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_user_id_users_id_fkey;

ALTER TABLE public.pets
  ADD CONSTRAINT pets_user_id_auth_users_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
```

### Issue: RLS policies block all queries

**Cause:** RLS policies may be incorrectly configured

**Fix:** Verify policies use `auth.uid()`:

```sql
SELECT policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'pets';
```

All policies should use `auth.uid() = user_id`.

### Issue: `pet_type` is NULL for existing pets

**Cause:** Migration didn't populate `pet_type` from `species`

**Fix:** Run manually:

```sql
UPDATE public.pets
SET pet_type = CASE 
  WHEN LOWER(species) = 'dog' THEN 'dog'
  WHEN LOWER(species) = 'cat' THEN 'cat'
  WHEN LOWER(species) = 'panda' THEN 'panda'
  ELSE 'dog'
END
WHERE pet_type IS NULL;
```

---

## ✅ Success Criteria

After completing all steps, verify:

- ✅ Migration applied successfully (no errors)
- ✅ `pets` table has `pet_type` column with correct constraint
- ✅ `pets.user_id` references `auth.users(id)`
- ✅ `pet_accessories` table exists with all columns
- ✅ RLS is enabled on both tables
- ✅ Google OAuth works end-to-end
- ✅ User can fetch their pet data
- ✅ Frontend compiles without TypeScript errors
- ✅ No runtime errors in browser console

---

## 📝 Next Steps

After Phase 1 is complete and verified:

1. Document any issues encountered
2. Test with multiple users
3. Verify pet creation flow works
4. Test accessory equipping/unequipping
5. Proceed to Phase 2 (if applicable)

---

**Migration File:** `supabase/migrations/020_pets_phase1_setup.sql`  
**Verification File:** `supabase/verify_pets_phase1.sql`  
**Created:** Phase 1 Setup

