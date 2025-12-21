# Phase 1 – Pets Database Setup - Migration Summary

## ✅ Migration Created

**File:** `supabase/migrations/020_pets_phase1_setup.sql`

This migration ensures the database schema meets Phase 1 requirements:

### Changes Made

1. **Pets Table Enhancements:**
   - ✅ Adds `pet_type` column (text, CHECK constraint: 'dog', 'cat', 'panda')
   - ✅ Populates `pet_type` from existing `species` column (if exists)
   - ✅ Creates trigger to auto-sync `pet_type` from `species` on INSERT/UPDATE
   - ✅ Verifies foreign key references `auth.users(id)` (not `public.users(id)`)
   - ✅ Ensures all required columns exist: `id`, `user_id`, `pet_type`, `name`, `created_at`
   - ✅ Configures RLS policies to allow only pet owner access

2. **Pet Accessories Table Creation:**
   - ✅ Creates `pet_accessories` table with required columns:
     - `id` (uuid, primary key)
     - `pet_id` (foreign key → pets(id))
     - `accessory_key` (text)
     - `display_name` (text)
     - `equipped` (boolean, default false)
   - ✅ Configures RLS policies to check pet ownership via subquery
   - ✅ Adds indexes for performance

### Backward Compatibility

- ✅ **`species` column preserved** - Frontend continues to use `species` without changes
- ✅ **Automatic sync** - `pet_type` is automatically populated from `species` via trigger
- ✅ **No breaking changes** - Existing queries continue to work
- ✅ **Safe to apply** - Migration is idempotent (can be run multiple times safely)

---

## 📋 Verification Files Created

1. **`supabase/verify_pets_phase1.sql`**
   - Comprehensive verification queries
   - Checks table structure, columns, constraints
   - Verifies RLS policies
   - Tests data integrity

2. **`PHASE1_PETS_SETUP_GUIDE.md`**
   - Step-by-step application guide
   - Testing procedures
   - Troubleshooting tips
   - Success criteria

---

## 🚀 Next Steps (Manual Actions Required)

### 1. Apply Migration

**Option A: Supabase CLI**
```bash
cd supabase
supabase db push
```

**Option B: Supabase SQL Editor**
1. Open: https://supabase.com/dashboard/project/xhhtkjtcdeewesijxbts
2. SQL Editor → New Query
3. Copy contents of `supabase/migrations/020_pets_phase1_setup.sql`
4. Paste and click **Run**
5. Verify: `Success. No rows returned`

### 2. Verify Database Structure

Run queries from `supabase/verify_pets_phase1.sql` in SQL Editor to confirm:
- ✅ `pets` table has `pet_type` column
- ✅ `pet_type` has CHECK constraint (dog, cat, panda only)
- ✅ `pets.user_id` references `auth.users(id)`
- ✅ `pet_accessories` table exists
- ✅ RLS is enabled on both tables

### 3. Test Google OAuth (CRITICAL)

**⚠️ MUST VERIFY:**
1. Sign in with Google OAuth
2. Verify session persists
3. Verify dashboard loads
4. **If OAuth fails, roll back immediately**

### 4. Test Pet Data Fetching

As authenticated user:
```javascript
// In browser console
const { data, error } = await supabase
  .from('pets')
  .select('*')
  .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  .single();

console.log('Pet data:', data);
```

Expected: Returns pet data (or null) with no errors.

### 5. Test Pet Accessories

```javascript
// Get user's pet
const { data: pet } = await supabase
  .from('pets')
  .select('id')
  .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  .single();

if (pet) {
  const { data: accessories } = await supabase
    .from('pet_accessories')
    .select('*')
    .eq('pet_id', pet.id);
  
  console.log('Accessories:', accessories);
}
```

---

## 🔍 TypeScript Compilation Status

**Status:** ✅ **No application code errors**

- TypeScript errors exist only in test files (`__tests__/`)
- Application code compiles successfully
- Migration does not affect frontend TypeScript types
- `species` column remains unchanged, so no type updates needed

---

## 📊 Migration Safety

### Why This Migration is Safe:

1. **Idempotent:** Can be run multiple times without side effects
2. **Non-destructive:** Doesn't drop or modify existing data
3. **Additive:** Only adds new column and table
4. **Backward compatible:** Existing code continues to work
5. **RLS verified:** Policies use `auth.uid()` correctly

### Rollback Plan (if needed):

```sql
-- Rollback pet_accessories table
DROP TABLE IF EXISTS public.pet_accessories CASCADE;

-- Rollback pet_type column (if needed)
ALTER TABLE public.pets DROP COLUMN IF EXISTS pet_type;
DROP FUNCTION IF EXISTS public.sync_pet_type_from_species() CASCADE;
```

---

## ✅ Success Criteria Checklist

After applying migration and testing:

- [ ] Migration applied successfully (no errors)
- [ ] `pets` table has `pet_type` column with CHECK constraint
- [ ] `pets.user_id` references `auth.users(id)` (verified via foreign key query)
- [ ] `pet_accessories` table exists with all required columns
- [ ] RLS enabled on both tables (`rowsecurity = true`)
- [ ] RLS policies configured correctly (4 policies per table)
- [ ] Google OAuth works end-to-end
- [ ] User session persists after refresh
- [ ] Pet data can be fetched for logged-in user
- [ ] Pet accessories can be fetched for user's pet
- [ ] Frontend compiles (no application code TypeScript errors)
- [ ] No runtime errors in browser console

---

## 📝 Notes

- **Migration Number:** 020 (follows existing migration sequence)
- **Dependencies:** Requires migrations 000-019 to be applied first
- **Frontend Impact:** None (uses `species` column, which remains unchanged)
- **Backend Impact:** None (backend can use either `species` or `pet_type`)
- **Database Impact:** Adds one column and one table, no data loss

---

## 🆘 Support

If issues occur:

1. Check `PHASE1_PETS_SETUP_GUIDE.md` troubleshooting section
2. Run verification queries from `supabase/verify_pets_phase1.sql`
3. Check Supabase logs for errors
4. Verify RLS policies are correct
5. Test with a fresh user account

---

**Created:** Phase 1 Setup  
**Migration File:** `supabase/migrations/020_pets_phase1_setup.sql`  
**Status:** Ready for application

