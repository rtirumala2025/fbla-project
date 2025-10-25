# 🚨 Immediate Action Required - Add Supabase Credentials

Your `.env` file is empty. Follow these steps to complete setup:

---

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Click on your project
3. Go to **Settings** (⚙️) → **API**
4. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Step 2: Add Credentials to `.env`

Open this file in your editor:
```
frontend/.env
```

And paste this content (replace with YOUR actual values):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API (for later)
VITE_API_URL=http://localhost:8000
```

**Example with fake values:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5MDAwMDAwMCwiZXhwIjoyMDA1NTc2MDAwfQ.fake_signature_here
VITE_API_URL=http://localhost:8000
```

---

## Step 3: Verify Database is Set Up

Make sure you've completed these steps in Supabase:

### ✅ Tables Created
Go to Supabase Dashboard → **Table Editor** and verify these tables exist:
- [ ] `profiles`
- [ ] `pets`
- [ ] `shop_items`
- [ ] `transactions`
- [ ] `pet_inventory`

### ✅ Sample Data Inserted
- [ ] `shop_items` table has 12+ items (Dog Food, Cat Food, etc.)

### ✅ RLS Policies Enabled
- [ ] All tables show "RLS enabled" badge

**If any of these are missing:**
1. Open `PHASE_2_SETUP_GUIDE.md`
2. Copy the SQL from **Step 2.1: Create Tables**
3. Go to Supabase Dashboard → **SQL Editor**
4. Click "New Query"
5. Paste and click **Run**
6. Repeat for **Step 2.2: Insert Sample Shop Items**
7. Repeat for **Step 2.3: Enable Row Level Security (RLS)**

---

## Step 4: Install Supabase Package

Make sure you've installed the required npm package:

```bash
cd frontend
npm install @supabase/supabase-js axios
```

---

## Step 5: Restart Dev Server

After adding credentials, restart your dev server:

```bash
# Stop current server (Ctrl+C in terminal)
npm start
```

---

## Step 6: Run Verification Test

Once the server is running, I'll help you run the verification test to confirm everything is working.

---

## 📝 Quick Checklist

```
[ ] Created Supabase project
[ ] Ran SQL scripts to create tables
[ ] Verified tables exist in Table Editor
[ ] Verified shop_items has sample data
[ ] Copied Project URL from Settings → API
[ ] Copied anon key from Settings → API
[ ] Pasted both values into frontend/.env
[ ] Saved .env file
[ ] Ran: npm install @supabase/supabase-js axios
[ ] Restarted dev server: npm start
```

---

## ⚠️ Important Notes

- **NEVER commit `.env` to git** - It's already in `.gitignore`
- Use the **anon/public** key, NOT the service_role key
- Make sure there are NO spaces around the `=` sign
- Make sure values are NOT wrapped in quotes
- The file must be named exactly `.env` (with the dot)

---

## 🆘 Need Help?

If you're stuck on any step, let me know which one and I'll provide more detailed guidance.

Once you complete all steps above, message me and I'll run the full verification test!

