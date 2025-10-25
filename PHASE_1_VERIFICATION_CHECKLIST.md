# 🔍 Phase 1 Verification Checklist

This checklist helps you verify that Supabase integration is properly set up.

---

## ✅ Prerequisites

Before running verification tests, complete these steps:

### 1. Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Sign in / Create account
- [ ] Click "New Project"
- [ ] Name your project (e.g., "virtual-pet-app")
- [ ] Set a strong database password
- [ ] Choose a region close to you
- [ ] Wait for project to finish setting up (~2 minutes)

### 2. Get Supabase Credentials
- [ ] Open your project in Supabase Dashboard
- [ ] Go to Settings → API
- [ ] Copy **Project URL** (starts with `https://`)
- [ ] Copy **anon/public** key (long string starting with `eyJ...`)

### 3. Create `.env` File
- [ ] Copy `frontend/.env.example` to `frontend/.env`
- [ ] Replace `your-project-id.supabase.co` with your actual Project URL
- [ ] Replace `your-anon-key-here` with your actual anon key
- [ ] Save the file

**Example `.env`:**
```env

VITE_API_URL=http://localhost:8000
```

### 4. Run Database Setup SQL
- [ ] Open `PHASE_2_SETUP_GUIDE.md`
- [ ] Copy the entire SQL script from "Step 2.1: Create Tables"
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Click "New Query"
- [ ] Paste the SQL script
- [ ] Click "Run" (bottom right)
- [ ] Verify no errors appear
- [ ] Copy and run the SQL from "Step 2.2: Insert Sample Shop Items"
- [ ] Click "Run" again
- [ ] Copy and run the SQL from "Step 2.3: Enable Row Level Security (RLS)"
- [ ] Click "Run" again

### 5. Verify Tables in Dashboard
- [ ] Go to Supabase Dashboard → Table Editor
- [ ] Confirm these tables exist:
  - [ ] `profiles`
  - [ ] `pets`
  - [ ] `shop_items` (should have 12+ items)
  - [ ] `transactions`
  - [ ] `pet_inventory`
- [ ] Click on `shop_items` table
- [ ] Verify you see items like "Premium Dog Food", "Cat Toy", etc.

### 6. Install NPM Dependencies
- [ ] Open terminal in `frontend/` directory
- [ ] Run: `npm install @supabase/supabase-js axios`
- [ ] Wait for installation to complete
- [ ] Verify no errors

### 7. Restart Dev Server
- [ ] Stop current dev server (Ctrl+C in terminal)
- [ ] Run: `npm start`
- [ ] Wait for "Compiled successfully!" message
- [ ] Open http://localhost:3000 in browser

---

## 🧪 Run Verification Tests

### Test 1: Connection Test

**Method A: Using Browser Console**
1. [ ] Open your app in browser (http://localhost:3000)
2. [ ] Open browser DevTools (F12 or Right-click → Inspect)
3. [ ] Go to "Console" tab
4. [ ] Paste this code and press Enter:
   ```javascript
   import('/src/test-supabase').then(m => m.testSupabaseConnection())
   ```
5. [ ] Check console output

**Method B: Temporary App.tsx Integration**
1. [ ] Open `frontend/src/App.tsx`
2. [ ] Add at the top:
   ```typescript
   import { useEffect } from 'react';
   import { testSupabaseConnection } from './test-supabase';
   ```
3. [ ] Inside `AppContent` component, add:
   ```typescript
   useEffect(() => {
     testSupabaseConnection();
   }, []);
   ```
4. [ ] Save file and check browser console
5. [ ] Remove the test code after verification

**Expected Output:**
```
🔍 Testing Supabase connection...

1️⃣ Checking Supabase client initialization...
✅ Supabase client initialized

2️⃣ Fetching shop items...
✅ Shop items fetched successfully!
   Found 12 items: [...]

3️⃣ Checking auth session...
ℹ️  No active session (user not logged in)

4️⃣ Checking database tables...
✅ Table "profiles" exists
✅ Table "pets" exists
✅ Table "shop_items" exists
✅ Table "transactions" exists

📊 Test Summary:
──────────────────────────────────────────────────
🎉 Supabase connection successful!
✅ Database is set up correctly
✅ Ready to proceed with frontend integration
──────────────────────────────────────────────────
```

---

## ✅ Verification Checklist Results

Mark each item as you verify it:

### 1. Connection Test
- [ ] Test script runs without errors
- [ ] Console shows "✅ Supabase client initialized"
- [ ] Console shows "✅ Shop items fetched successfully!"
- [ ] At least 12 shop items are returned
- [ ] No CORS errors appear
- [ ] No "Missing environment variables" warnings

### 2. Database Schema Validation
- [ ] `profiles` table exists in Supabase Table Editor
- [ ] `pets` table exists
- [ ] `shop_items` table exists with sample data
- [ ] `transactions` table exists
- [ ] `pet_inventory` table exists
- [ ] All tables have RLS (Row Level Security) enabled
  - Check: Table Editor → Click table → "RLS enabled" badge visible

### 3. Environment Variables
- [ ] `.env` file exists in `frontend/` directory
- [ ] `VITE_SUPABASE_URL` is set to your project URL
- [ ] `VITE_SUPABASE_ANON_KEY` is set to your anon key
- [ ] Both values match Supabase Dashboard → Settings → API
- [ ] Dev server restarted after creating `.env`

### 4. Supabase Client
- [ ] `frontend/src/lib/supabase.ts` exists
- [ ] File exports `supabase` client
- [ ] No TypeScript errors in the file
- [ ] No console errors about missing env variables

### 5. Authentication Setup
- [ ] Supabase Dashboard → Authentication is accessible
- [ ] Email auth provider is enabled (default)
- [ ] Can create a test user:
  1. [ ] Go to Authentication → Users
  2. [ ] Click "Add user" → "Create new user"
  3. [ ] Enter email + password
  4. [ ] Click "Create user"
  5. [ ] User appears in list
- [ ] If user was created, check `profiles` table has matching row

---

## 🎯 Pass/Fail Criteria

### ✅ PASS - Phase 1 Complete
If ALL of these are true:
- ✅ Test script outputs "🎉 Supabase connection successful!"
- ✅ At least 12 shop items returned from database
- ✅ All 5 tables exist in Supabase
- ✅ `.env` file configured correctly
- ✅ No console errors related to Supabase

**You can proceed to Phase 2!** 🚀

### ❌ FAIL - Setup Incomplete
If ANY of these are true:
- ❌ Console shows "Missing environment variables"
- ❌ CORS errors appear
- ❌ Shop items fetch returns 0 items or error
- ❌ Tables don't exist in Supabase
- ❌ RLS not enabled on tables

**Fix the issues listed below before continuing.**

---

## 🔧 Common Issues & Fixes

### Issue: "Missing Supabase environment variables"
**Fix:**
1. Verify `.env` file exists in `frontend/` directory
2. Check `.env` has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Restart dev server: `npm start`
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: "Shop items fetch failed" or returns 0 items
**Fix:**
1. Go to Supabase Dashboard → SQL Editor
2. Re-run the "Insert Sample Shop Items" SQL from `PHASE_2_SETUP_GUIDE.md`
3. Go to Table Editor → `shop_items` → verify items appear
4. Check RLS policies are set correctly

### Issue: CORS errors
**Fix:**
1. Verify you're using the correct Supabase URL (should start with `https://`)
2. Make sure you're using the **anon/public** key, not the service_role key
3. Check Supabase project is active (not paused)

### Issue: "relation 'profiles' does not exist"
**Fix:**
1. Tables weren't created yet
2. Run the full SQL script from `PHASE_2_SETUP_GUIDE.md` Step 2.1
3. Verify tables appear in Table Editor

### Issue: TypeScript errors about `import.meta.env`
**Fix:**
1. Verify `vite-env.d.ts` exists in `frontend/src/`
2. Restart TypeScript server:
   - Command Palette (Cmd+Shift+P)
   - Type "TypeScript: Restart TS Server"
   - Hit Enter
3. If error persists, restart your editor

---

## 🎉 Success!

If all checks pass, you should see:

```
✅ Connection Test - PASS
✅ Database Schema - PASS
✅ Environment Variables - PASS
✅ Supabase Client - PASS
✅ Authentication Setup - PASS
```

**🔥 Supabase Phase 1 fully verified — ready for backend integration (Phase 2).**

---

## 📝 Next Steps After Verification

Once Phase 1 passes:
1. ✅ Update `DashboardPage.tsx` to use real Supabase pet data
2. ✅ Connect `ShopPage.tsx` to Supabase transactions
3. ✅ Update `ProfilePage.tsx` with Supabase profile data
4. ✅ Set up backend API (FastAPI server)
5. ✅ Integrate AI pet responses

See `PHASE_2_SETUP_GUIDE.md` for detailed instructions.

