# Phase 1 Post-Migration Checklist

You've successfully run `020_pets_phase1_setup.sql`. Here's what to verify and test next.

---

## ✅ Step 1: Quick Database Verification

Run these queries in Supabase SQL Editor to verify the migration:

### Check Pets Table Structure

```sql
-- Verify pet_type column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pets'
  AND column_name = 'pet_type';

-- Verify pet_type constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'pets_pet_type_check';

-- Verify foreign key to auth.users
SELECT 
  tc.constraint_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'pets'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';
```

### Check Pet Accessories Table

```sql
-- Verify table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'pet_accessories';

-- Verify columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pet_accessories'
ORDER BY ordinal_position;
```

### Check RLS Policies

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('pets', 'pet_accessories');

-- List policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('pets', 'pet_accessories')
ORDER BY tablename, policyname;
```

**Expected Results:**
- ✅ `pets` table has `pet_type` column
- ✅ `pets_pet_type_check` constraint exists
- ✅ `pets.user_id` references `auth.users(id)`
- ✅ `pet_accessories` table exists
- ✅ Both tables have `rowsecurity = true`
- ✅ Each table has 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)

---

## 🧪 Step 2: Test Google OAuth (CRITICAL)

**⚠️ ABSOLUTE REQUIREMENT: This must work after migration**

### Test Steps:

1. **Open your app** (e.g., `http://localhost:3000`)
2. **Clear browser cache/cookies** (or use incognito mode)
3. **Click "Sign in with Google"**
4. **Complete OAuth flow**
5. **Verify:**
   - ✅ User is redirected back to app
   - ✅ User session persists (check browser DevTools → Application → Local Storage)
   - ✅ Dashboard loads without errors
   - ✅ No console errors

### If OAuth Fails:

**STOP IMMEDIATELY** and check:
- Supabase Auth settings (Dashboard → Authentication → Providers → Google)
- Redirect URLs are configured correctly
- No errors in browser console
- Check Supabase logs (Dashboard → Logs)

---

## 🧪 Step 3: Test Pet Data Fetching

### As Authenticated User:

1. **Sign in** (via Google OAuth or email/password)
2. **Open browser console** (F12)
3. **Run this query:**

```javascript
// Get Supabase client (adjust based on your setup)
const { createClient } = supabase;
const supabaseClient = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// Test fetching pet data
const { data, error } = await supabaseClient
  .from('pets')
  .select('*')
  .eq('user_id', (await supabaseClient.auth.getUser()).data.user.id)
  .single();

console.log('Pet data:', data);
console.log('Error:', error);
```

**Expected:**
- ✅ Returns pet data (or `null` if no pet exists)
- ✅ No RLS errors
- ✅ `pet_type` column is present in response

### Test Pet Accessories:

```javascript
// Get user's pet
const { data: pet } = await supabaseClient
  .from('pets')
  .select('id')
  .eq('user_id', (await supabaseClient.auth.getUser()).data.user.id)
  .single();

if (pet) {
  const { data: accessories, error } = await supabaseClient
    .from('pet_accessories')
    .select('*')
    .eq('pet_id', pet.id);
  
  console.log('Accessories:', accessories);
  console.log('Error:', error);
}
```

**Expected:**
- ✅ Returns accessories for user's pet (or empty array)
- ✅ No RLS errors

---

## 🔍 Step 4: Verify Other Migrations

Migration `020_pets_phase1_setup.sql` depends on earlier migrations. Verify these are applied:

### Check Core Tables Exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN (
    'users',           -- from 000_core_schema.sql
    'profiles',        -- from 001_profiles_and_preferences.sql
    'user_preferences', -- from 001_profiles_and_preferences.sql
    'pets'             -- from 002_pets.sql (enhanced by 020)
  )
ORDER BY table_name;
```

**If any tables are missing**, you may need to run earlier migrations:
- `000_core_schema.sql`
- `001_profiles_and_preferences.sql`
- `002_pets.sql`

---

## 📊 Step 5: Data Integrity Check

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

-- Check pet_accessories can join with pets
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

## ✅ Success Criteria

After completing all steps:

- [ ] Database structure verified (pets table has pet_type, pet_accessories exists)
- [ ] RLS policies configured correctly (4 policies per table)
- [ ] Foreign key references auth.users(id) (not public.users)
- [ ] Google OAuth works end-to-end
- [ ] User session persists after refresh
- [ ] Pet data can be fetched for logged-in user
- [ ] Pet accessories can be fetched for user's pet
- [ ] No runtime errors in browser console
- [ ] Frontend compiles without TypeScript errors (application code)

---

## 🚨 If Something Fails

### OAuth Fails:
1. Check Supabase Auth settings
2. Verify redirect URLs
3. Check browser console for errors
4. Review Supabase logs

### Pet Data Fetching Fails:
1. Check RLS policies are correct
2. Verify user is authenticated (`auth.uid()` is not null)
3. Check foreign key constraint
4. Verify pet exists for user

### RLS Errors:
1. Verify policies use `auth.uid() = user_id`
2. Check grants are correct: `GRANT SELECT, INSERT, UPDATE, DELETE ON ... TO authenticated`
3. Verify RLS is enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`

---

## 📝 Next Steps

Once everything is verified:

1. ✅ Document any issues encountered
2. ✅ Test with multiple users
3. ✅ Verify pet creation flow works
4. ✅ Test accessory equipping/unequipping (if implemented)
5. ✅ Proceed to Phase 2 (if applicable)

---

**Migration Applied:** `020_pets_phase1_setup.sql`  
**Status:** Ready for verification and testing

