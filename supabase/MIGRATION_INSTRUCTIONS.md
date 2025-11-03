# Database Migration Instructions

## How to Apply Migrations

### Option 1: Supabase SQL Editor (Recommended for Manual Testing)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file in order:
   - `001_user_preferences.sql`
   - `002_pets_table_complete.sql`
4. Click **Run** for each migration

### Option 2: Supabase CLI (Recommended for Production)

```bash
# From project root
cd supabase

# Apply migrations
supabase db push

# Or apply individually
supabase db execute --file migrations/001_user_preferences.sql
supabase db execute --file migrations/002_pets_table_complete.sql
```

### Option 3: Direct psql Connection

```bash
# Get connection string from Supabase dashboard
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# Then run each migration file
\i migrations/001_user_preferences.sql
\i migrations/002_pets_table_complete.sql
```

## Verification

After applying migrations, verify tables exist:

```sql
-- Check user_preferences table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_preferences'
AND table_schema = 'public';

-- Check pets table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pets'
AND table_schema = 'public';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('user_preferences', 'pets')
AND schemaname = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('user_preferences', 'pets');
```

## Rollback (if needed)

```sql
-- Drop user_preferences table
DROP TABLE IF EXISTS public.user_preferences CASCADE;

-- Drop pets table (careful - this deletes all pet data!)
DROP TABLE IF EXISTS public.pets CASCADE;
```

## Notes

- These migrations are idempotent (safe to run multiple times)
- RLS policies ensure users can only access their own data
- Triggers automatically update `updated_at` timestamps
- One pet per user constraint enforced via UNIQUE(user_id)

