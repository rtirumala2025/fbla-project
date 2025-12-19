# Supabase Fix Summary

## Issue Found

The `ai_chat_messages` table exists but is missing the `created_at` column, which prevents the performance index from being created.

## Solution

Run the fix script: `supabase/fix_ai_chat_messages_table.sql`

This script will:
1. ✅ Add the missing `created_at` column
2. ✅ Create the performance index `idx_ai_chat_messages_session_created`

## What Happened?

The `ai_chat_messages` table was likely created manually or through a partial migration, missing the `created_at` column that should have been created by migration 014.

## After Running the Fix

After running `fix_ai_chat_messages_table.sql`, verify:

```sql
-- Check column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ai_chat_messages' 
AND column_name = 'created_at';
-- Should return: created_at

-- Check index exists
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'ai_chat_messages' 
AND indexname = 'idx_ai_chat_messages_session_created';
-- Should return: idx_ai_chat_messages_session_created
```

## Final Verification

After the fix, all 3 performance indexes should exist:
- ✅ `idx_finance_transactions_type`
- ✅ `idx_user_quests_user_status_progress`
- ✅ `idx_ai_chat_messages_session_created` (will be created by fix script)

