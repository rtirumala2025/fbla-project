# How to Find Your Supabase Anon Key

## Step-by-Step Instructions

1. **You're already in the right place!** You're in Project Settings
2. **Click on "API Keys"** in the left menu
3. **You'll see a section called "Project API keys"** with these keys:
   - **anon public** - This is the one you need! (starts with `eyJ...`)
   - **service_role secret** - Don't use this one (it's for backend only)

4. **Look for the "anon public" key** - it should look like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaHRranRjZGVld2VzaWp4YnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDIyOTAsImV4cCI6MjA3NjU2NTY4N30...
   ```

5. **Click the "Copy" button** next to the "anon public" key

6. **Important:** Make sure you're looking at the project that matches your URL:
   - Your URL is: `xhhtkjtcdeewesijxbts.supabase.co`
   - So the anon key should reference this same project ID in the token

## What to Ignore

- ❌ **Publishable key** (`sb_publishable_...`) - This is different, not what you need
- ❌ **service_role** key - This is for backend only, not for frontend
- ✅ **anon public** key - This is the one!

## After You Get It

Once you have the anon public key, I'll help you update your `.env` file with it.

