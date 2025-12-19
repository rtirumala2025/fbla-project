# Supabase Migration Order Guide

## ⚠️ Critical: Migration Dependencies

Migration 018 requires migration 014 to be run first.

## Correct Migration Order

### Step 1: Run Migration 014 (if not already run)
**File:** `supabase/migrations/014_ai_features_persistence.sql`

**What it does:**
- Creates `ai_chat_sessions` table
- Creates `ai_chat_messages` table
- Creates `budget_advisor_analyses` table
- Creates `coach_advice_history` table

**How to check if it's been run:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'ai_chat_sessions',
  'ai_chat_messages',
  'budget_advisor_analyses',
  'coach_advice_history'
);
```

**Expected:** 4 rows if migration 014 has been run

### Step 2: Run Migration 018 (now safe to run)
**File:** `supabase/migrations/018_fix_ai_rls.sql`

**What it does:**
- Enables RLS on AI tables (if they exist)
- Creates RLS policies for authenticated users
- Sets up proper grants

**Note:** The updated migration 018 is now defensive and will skip tables that don't exist, but you should still run 014 first to create the tables.

## Quick Fix: Run Both Migrations

If you're not sure which migrations have been run, you can run them in order:

1. **First, run migration 014:**
   ```sql
   -- Copy and paste contents of 014_ai_features_persistence.sql
   ```

2. **Then, run migration 018:**
   ```sql
   -- Copy and paste contents of 018_fix_ai_rls.sql
   ```

## Verification After Running

After running both migrations, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'ai_chat_sessions',
  'ai_chat_messages',
  'budget_advisor_analyses',
  'coach_advice_history'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'ai_chat_sessions',
  'ai_chat_messages',
  'budget_advisor_analyses',
  'coach_advice_history'
);

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'ai_chat_sessions',
  'ai_chat_messages',
  'budget_advisor_analyses',
  'coach_advice_history'
)
ORDER BY tablename, policyname;
```

**Expected Results:**
- 4 tables exist
- All 4 tables have `rowsecurity = true`
- Multiple policies per table (SELECT, INSERT, UPDATE, DELETE as appropriate)

