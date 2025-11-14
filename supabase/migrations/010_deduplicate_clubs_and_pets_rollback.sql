-- ============================================================================
-- ROLLBACK SCRIPT: Restore Original State After Deduplication Migration
-- ============================================================================
-- Description:
--   This script restores the database to its original state before running
--   the deduplication migration (010_deduplicate_clubs_and_pets.sql).
--   It restores all tables from backup tables created during migration.
--
-- WARNING:
--   This will DELETE all changes made by the deduplication migration.
--   Only run this if you need to rollback the migration.
--
-- Prerequisites:
--   - Backup tables must exist (created during migration)
--   - Run this during a maintenance window
--   - Ensure no new data has been added that depends on deduplicated records
--
-- Execution:
--   Run this script in Supabase SQL Editor or via psql
-- ============================================================================

BEGIN;

DO $$
DECLARE
    backup_exists BOOLEAN;
    restored_count INTEGER;
BEGIN
    -- Check if backup tables exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_migration_backup_pets'
    ) INTO backup_exists;
    
    IF NOT backup_exists THEN
        RAISE EXCEPTION 'Backup tables not found. Cannot rollback - backup tables do not exist.';
    END IF;
    
    RAISE NOTICE 'Starting rollback process...';
    
    -- ========================================================================
    -- Restore pets table
    -- ========================================================================
    RAISE NOTICE 'Restoring pets table...';
    TRUNCATE TABLE public.pets;
    INSERT INTO public.pets SELECT * FROM public._migration_backup_pets;
    GET DIAGNOSTICS restored_count = ROW_COUNT;
    RAISE NOTICE 'Restored % pet records', restored_count;
    
    -- ========================================================================
    -- Restore user_accessories table
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = '_migration_backup_user_accessories') THEN
        RAISE NOTICE 'Restoring user_accessories table...';
        TRUNCATE TABLE public.user_accessories;
        INSERT INTO public.user_accessories 
        SELECT * FROM public._migration_backup_user_accessories;
        GET DIAGNOSTICS restored_count = ROW_COUNT;
        RAISE NOTICE 'Restored % user_accessories records', restored_count;
    END IF;
    
    -- ========================================================================
    -- Restore pet_art_cache table
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = '_migration_backup_pet_art_cache') THEN
        RAISE NOTICE 'Restoring pet_art_cache table...';
        TRUNCATE TABLE public.pet_art_cache;
        INSERT INTO public.pet_art_cache 
        SELECT * FROM public._migration_backup_pet_art_cache;
        GET DIAGNOSTICS restored_count = ROW_COUNT;
        RAISE NOTICE 'Restored % pet_art_cache records', restored_count;
    END IF;
    
    -- ========================================================================
    -- Restore public_profiles table
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = '_migration_backup_public_profiles') THEN
        RAISE NOTICE 'Restoring public_profiles table...';
        TRUNCATE TABLE public.public_profiles;
        INSERT INTO public.public_profiles 
        SELECT * FROM public._migration_backup_public_profiles;
        GET DIAGNOSTICS restored_count = ROW_COUNT;
        RAISE NOTICE 'Restored % public_profiles records', restored_count;
    END IF;
    
    -- ========================================================================
    -- Restore finance_inventory table (if backed up)
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = '_migration_backup_finance_inventory') THEN
        RAISE NOTICE 'Restoring finance_inventory table...';
        TRUNCATE TABLE public.finance_inventory;
        INSERT INTO public.finance_inventory 
        SELECT * FROM public._migration_backup_finance_inventory;
        GET DIAGNOSTICS restored_count = ROW_COUNT;
        RAISE NOTICE 'Restored % finance_inventory records', restored_count;
    END IF;
    
    -- ========================================================================
    -- Restore clubs table (if backed up)
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = '_migration_backup_clubs') THEN
        RAISE NOTICE 'Restoring clubs table...';
        TRUNCATE TABLE public.clubs;
        INSERT INTO public.clubs 
        SELECT * FROM public._migration_backup_clubs;
        GET DIAGNOSTICS restored_count = ROW_COUNT;
        RAISE NOTICE 'Restored % club records', restored_count;
    END IF;
    
    -- ========================================================================
    -- Validate restoration
    -- ========================================================================
    DECLARE
        original_pet_count INTEGER;
        restored_pet_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO original_pet_count 
        FROM public._migration_backup_pets;
        SELECT COUNT(*) INTO restored_pet_count 
        FROM public.pets;
        
        IF original_pet_count != restored_pet_count THEN
            RAISE WARNING 'Pet count mismatch: Original %, Restored %', 
                original_pet_count, restored_pet_count;
        ELSE
            RAISE NOTICE '✓ Pet count validated: % records restored', restored_pet_count;
        END IF;
    END;
    
    RAISE NOTICE 'Rollback completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTE: Backup tables are preserved. You can delete them manually:';
    RAISE NOTICE '  DROP TABLE IF EXISTS public._migration_backup_pets;';
    RAISE NOTICE '  DROP TABLE IF EXISTS public._migration_backup_user_accessories;';
    RAISE NOTICE '  DROP TABLE IF EXISTS public._migration_backup_pet_art_cache;';
    RAISE NOTICE '  DROP TABLE IF EXISTS public._migration_backup_public_profiles;';
    RAISE NOTICE '  DROP TABLE IF EXISTS public._migration_backup_finance_inventory;';
    RAISE NOTICE '  DROP TABLE IF EXISTS public._migration_backup_clubs;';
    
END $$;

COMMIT;

-- ============================================================================
-- OPTIONAL: Clean up backup tables after successful rollback
-- ============================================================================
-- Uncomment the following section if you want to automatically delete
-- backup tables after rollback. Otherwise, keep them for safety.

-- BEGIN;
-- 
-- DROP TABLE IF EXISTS public._migration_backup_pets;
-- DROP TABLE IF EXISTS public._migration_backup_user_accessories;
-- DROP TABLE IF EXISTS public._migration_backup_pet_art_cache;
-- DROP TABLE IF EXISTS public._migration_backup_public_profiles;
-- DROP TABLE IF EXISTS public._migration_backup_finance_inventory;
-- DROP TABLE IF EXISTS public._migration_backup_clubs;
-- 
-- RAISE NOTICE 'Backup tables cleaned up';
-- 
-- COMMIT;

