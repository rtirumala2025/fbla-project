# Database Deduplication Migration Guide

This guide explains how to safely deduplicate club and pet entries in your Supabase database while maintaining all foreign key relationships and data integrity.

## 📋 Overview

The deduplication migration consists of three scripts:

1. **`010_deduplicate_clubs_and_pets.sql`** - Main migration script
2. **`010_deduplicate_clubs_and_pets_rollback.sql`** - Rollback script
3. **`010_validate_deduplication.sql`** - Validation script

## 🎯 What This Migration Does

### Pet Deduplication
- Identifies duplicate pets (multiple pets per user_id)
- Selects the "canonical" pet to keep based on:
  - Data completeness (fewest NULL values)
  - Highest stats (health, happiness, energy)
  - Oldest creation date
- Merges data from duplicate pets into the canonical pet
- Updates all foreign key references to point to canonical pets
- Deletes duplicate pet records

### Club Deduplication
- Checks if a clubs table exists
- Deduplicates clubs based on your schema (customize as needed)
- Updates all foreign key references
- Deletes duplicate club records

### Data Safety
- Creates backup tables before making any changes
- Validates data integrity after migration
- Preserves all foreign key relationships
- Uses database transactions for atomicity

## ⚠️ Prerequisites

Before running the migration:

1. **Backup Your Database**
   ```bash
   # Using Supabase CLI
   supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Or use pg_dump directly
   pg_dump -h your-db-host -U postgres -d postgres > backup.sql
   ```

2. **Schedule Maintenance Window**
   - Plan for 15-30 minutes of downtime
   - Notify users if necessary

3. **Verify Database State**
   - Check that all foreign key constraints are properly defined
   - Ensure no pending migrations are running
   - Verify database connectivity

## 🚀 Execution Steps

### Step 1: Pre-Migration Validation (Optional)

Run the validation script to check the current state:

```sql
-- Run in Supabase SQL Editor
\i supabase/migrations/010_validate_deduplication.sql
```

This will show you:
- Current duplicate counts
- Foreign key integrity status
- Data completeness metrics

### Step 2: Run the Migration

**Option A: Using Supabase SQL Editor**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `010_deduplicate_clubs_and_pets.sql`
3. Click "Run" to execute
4. Review the output for any warnings or errors

**Option B: Using psql**
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/010_deduplicate_clubs_and_pets.sql
```

**Option C: Using Supabase CLI**
```bash
supabase db execute -f supabase/migrations/010_deduplicate_clubs_and_pets.sql
```

### Step 3: Post-Migration Validation

After the migration completes, run the validation script again:

```sql
\i supabase/migrations/010_validate_deduplication.sql
```

Verify that:
- ✅ No duplicate pets remain
- ✅ All foreign keys are valid
- ✅ No orphaned records exist
- ✅ Data counts match expectations

### Step 4: Clean Up (After Verification)

Once you've verified the migration was successful and you no longer need the backup tables, you can remove them:

```sql
BEGIN;

DROP TABLE IF EXISTS public._migration_backup_pets;
DROP TABLE IF EXISTS public._migration_backup_user_accessories;
DROP TABLE IF EXISTS public._migration_backup_pet_art_cache;
DROP TABLE IF EXISTS public._migration_backup_public_profiles;
DROP TABLE IF EXISTS public._migration_backup_finance_inventory;
DROP TABLE IF EXISTS public._migration_backup_clubs;

COMMIT;
```

**⚠️ Only delete backup tables after you're 100% certain the migration was successful!**

## 🔄 Rollback Procedure

If something goes wrong or you need to revert the migration:

### Step 1: Stop All Database Operations
- Pause any running applications
- Ensure no new data is being written

### Step 2: Run the Rollback Script

**Using Supabase SQL Editor:**
1. Open SQL Editor
2. Copy and paste `010_deduplicate_clubs_and_pets_rollback.sql`
3. Execute the script

**Using psql:**
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/010_deduplicate_clubs_and_pets_rollback.sql
```

### Step 3: Verify Rollback

Run the validation script to confirm everything was restored:

```sql
\i supabase/migrations/010_validate_deduplication.sql
```

## 📊 Understanding the Migration Process

### How Pet Deduplication Works

1. **Backup Creation**: All tables are backed up to `_migration_backup_*` tables
2. **Mapping Creation**: For each user, identify which pet to keep (canonical pet)
3. **Foreign Key Updates**: Update all references to point to canonical pets:
   - `user_accessories.pet_id`
   - `pet_art_cache.pet_id`
   - `public_profiles.pet_id`
   - `finance_inventory.pet_id` (if exists)
4. **Data Merging**: Merge data from duplicate pets into canonical pets:
   - Keep best values (highest stats)
   - Combine diary entries
   - Merge traits
   - Preserve oldest timestamps
5. **Deletion**: Remove duplicate pet records
6. **Validation**: Verify no data loss and all foreign keys are valid

### How Club Deduplication Works

The clubs deduplication logic is generic and needs to be customized based on your clubs table schema. The script:
- Checks if clubs table exists
- Creates a mapping table for duplicate clubs
- Updates foreign key references
- Deletes duplicate clubs

**⚠️ You must customize the duplicate detection logic in the migration script based on your clubs table structure!**

## 🔧 Customization

### Customizing Club Deduplication

Edit `010_deduplicate_clubs_and_pets.sql` and modify the club deduplication section (around line 300):

```sql
-- Example: Deduplicate by club name
INSERT INTO public._migration_club_id_mapping (old_club_id, canonical_club_id, reason)
SELECT 
    c1.id as old_club_id,
    MIN(c2.id) as canonical_club_id,
    'duplicate - will merge'
FROM public.clubs c1
JOIN public.clubs c2 ON c1.name = c2.name
WHERE c1.id > c2.id
GROUP BY c1.id;
```

### Customizing Pet Selection Logic

Modify the pet selection query (around line 150) to change how the canonical pet is chosen:

```sql
-- Example: Prefer pets with higher XP
ORDER BY
    COALESCE(xp, 0) DESC,  -- Add this if you have an XP column
    created_at ASC
```

## 📝 Migration Output

The migration script provides detailed logging:

- `RAISE NOTICE` messages show progress
- `RAISE WARNING` messages indicate potential issues
- `RAISE EXCEPTION` stops the migration if critical errors occur

Example output:
```
NOTICE: Backup tables created successfully
NOTICE: Found 5 users with duplicate pets
NOTICE: Updated 12 user_accessories records
NOTICE: Merged data from 5 duplicate pets
NOTICE: ✓ Validation passed: All foreign keys are valid
NOTICE: Migration completed successfully!
```

## 🐛 Troubleshooting

### Migration Fails with Foreign Key Violation

**Problem**: Foreign key constraint violation during update

**Solution**:
1. Check which table is causing the issue
2. Verify foreign key constraints are properly defined
3. Ensure all referenced records exist
4. Run rollback and fix the underlying issue

### Validation Shows Orphaned Records

**Problem**: Validation finds orphaned foreign key references

**Solution**:
1. Run rollback script
2. Investigate why records became orphaned
3. Fix the root cause
4. Re-run migration

### Backup Tables Don't Exist

**Problem**: Rollback fails because backup tables are missing

**Solution**:
- Restore from your full database backup
- Backup tables are only created during migration execution

## 📞 Support

If you encounter issues:

1. Check the migration output for specific error messages
2. Review the validation script results
3. Check Supabase logs for additional details
4. Restore from full database backup if needed

## ✅ Success Criteria

After migration, you should see:

- ✅ No duplicate pets per user
- ✅ All foreign key references are valid
- ✅ No orphaned records
- ✅ Data counts match (users haven't lost their pets)
- ✅ All validation checks pass

## 📚 Related Files

- `010_deduplicate_clubs_and_pets.sql` - Main migration
- `010_deduplicate_clubs_and_pets_rollback.sql` - Rollback script
- `010_validate_deduplication.sql` - Validation script
- `010_DEDUPLICATION_README.md` - This file

---

**Last Updated**: 2025-01-27  
**Version**: 1.0.0  
**Database**: Supabase (PostgreSQL)

