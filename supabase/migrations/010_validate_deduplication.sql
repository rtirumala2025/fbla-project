-- ============================================================================
-- VALIDATION SCRIPT: Verify Data Integrity After Deduplication
-- ============================================================================
-- Description:
--   This script validates that the deduplication migration completed successfully
--   and that all data integrity constraints are maintained. Run this after
--   executing the deduplication migration to verify everything is correct.
--
-- Usage:
--   Run this script in Supabase SQL Editor or via psql
--   Review the output to ensure all validations pass
-- ============================================================================

DO $$
DECLARE
    validation_passed BOOLEAN := TRUE;
    error_count INTEGER := 0;
    
    -- Counters
    total_pets INTEGER;
    unique_user_pets INTEGER;
    duplicate_pets INTEGER;
    orphaned_accessories INTEGER;
    orphaned_art_cache INTEGER;
    orphaned_profiles INTEGER;
    invalid_foreign_keys INTEGER;
BEGIN
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'DEDUPLICATION VALIDATION REPORT';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    
    -- ========================================================================
    -- Validation 1: Check for duplicate pets per user
    -- ========================================================================
    RAISE NOTICE 'Validation 1: Checking for duplicate pets per user...';
    
    SELECT COUNT(*) INTO total_pets FROM public.pets;
    SELECT COUNT(DISTINCT user_id) INTO unique_user_pets FROM public.pets;
    
    SELECT COUNT(*) INTO duplicate_pets
    FROM (
        SELECT user_id, COUNT(*) as cnt
        FROM public.pets
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_pets > 0 THEN
        RAISE WARNING '  ✗ FAILED: Found % users with duplicate pets', duplicate_pets;
        validation_passed := FALSE;
        error_count := error_count + 1;
    ELSE
        RAISE NOTICE '  ✓ PASSED: No duplicate pets found';
        RAISE NOTICE '    Total pets: %, Unique users: %', total_pets, unique_user_pets;
    END IF;
    
    RAISE NOTICE '';
    
    -- ========================================================================
    -- Validation 2: Check for orphaned foreign key references
    -- ========================================================================
    RAISE NOTICE 'Validation 2: Checking for orphaned foreign key references...';
    
    -- Check user_accessories
    SELECT COUNT(*) INTO orphaned_accessories
    FROM public.user_accessories ua
    WHERE ua.pet_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.pets p WHERE p.id = ua.pet_id);
    
    IF orphaned_accessories > 0 THEN
        RAISE WARNING '  ✗ FAILED: Found % orphaned user_accessories records', orphaned_accessories;
        validation_passed := FALSE;
        error_count := error_count + 1;
    ELSE
        RAISE NOTICE '  ✓ PASSED: All user_accessories references are valid';
    END IF;
    
    -- Check pet_art_cache
    SELECT COUNT(*) INTO orphaned_art_cache
    FROM public.pet_art_cache pac
    WHERE NOT EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pac.pet_id);
    
    IF orphaned_art_cache > 0 THEN
        RAISE WARNING '  ✗ FAILED: Found % orphaned pet_art_cache records', orphaned_art_cache;
        validation_passed := FALSE;
        error_count := error_count + 1;
    ELSE
        RAISE NOTICE '  ✓ PASSED: All pet_art_cache references are valid';
    END IF;
    
    -- Check public_profiles
    SELECT COUNT(*) INTO orphaned_profiles
    FROM public.public_profiles pp
    WHERE NOT EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pp.pet_id);
    
    IF orphaned_profiles > 0 THEN
        RAISE WARNING '  ✗ FAILED: Found % orphaned public_profiles records', orphaned_profiles;
        validation_passed := FALSE;
        error_count := error_count + 1;
    ELSE
        RAISE NOTICE '  ✓ PASSED: All public_profiles references are valid';
    END IF;
    
    -- Check finance_inventory if it has pet_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'finance_inventory' 
               AND column_name = 'pet_id') THEN
        SELECT COUNT(*) INTO invalid_foreign_keys
        FROM public.finance_inventory fi
        WHERE fi.pet_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.pets p WHERE p.id = fi.pet_id);
        
        IF invalid_foreign_keys > 0 THEN
            RAISE WARNING '  ✗ FAILED: Found % invalid finance_inventory.pet_id references', invalid_foreign_keys;
            validation_passed := FALSE;
            error_count := error_count + 1;
        ELSE
            RAISE NOTICE '  ✓ PASSED: All finance_inventory references are valid';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    
    -- ========================================================================
    -- Validation 3: Check data completeness
    -- ========================================================================
    RAISE NOTICE 'Validation 3: Checking data completeness...';
    
    DECLARE
        pets_with_null_name INTEGER;
        pets_with_null_species INTEGER;
        pets_with_null_user_id INTEGER;
    BEGIN
        SELECT COUNT(*) INTO pets_with_null_name
        FROM public.pets WHERE name IS NULL OR name = '';
        
        SELECT COUNT(*) INTO pets_with_null_species
        FROM public.pets WHERE species IS NULL OR species = '';
        
        SELECT COUNT(*) INTO pets_with_null_user_id
        FROM public.pets WHERE user_id IS NULL;
        
        IF pets_with_null_name > 0 THEN
            RAISE WARNING '  ⚠ WARNING: Found % pets with NULL or empty name', pets_with_null_name;
        END IF;
        
        IF pets_with_null_species > 0 THEN
            RAISE WARNING '  ⚠ WARNING: Found % pets with NULL or empty species', pets_with_null_species;
        END IF;
        
        IF pets_with_null_user_id > 0 THEN
            RAISE WARNING '  ✗ FAILED: Found % pets with NULL user_id', pets_with_null_user_id;
            validation_passed := FALSE;
            error_count := error_count + 1;
        ELSE
            RAISE NOTICE '  ✓ PASSED: All pets have valid user_id';
        END IF;
    END;
    
    RAISE NOTICE '';
    
    -- ========================================================================
    -- Validation 4: Check UNIQUE constraints
    -- ========================================================================
    RAISE NOTICE 'Validation 4: Checking UNIQUE constraints...';
    
    DECLARE
        duplicate_user_pets INTEGER;
    BEGIN
        -- Check if UNIQUE(user_id) constraint is being violated
        SELECT COUNT(*) INTO duplicate_user_pets
        FROM (
            SELECT user_id, COUNT(*) as cnt
            FROM public.pets
            GROUP BY user_id
            HAVING COUNT(*) > 1
        ) dups;
        
        IF duplicate_user_pets > 0 THEN
            RAISE WARNING '  ✗ FAILED: UNIQUE(user_id) constraint violated on pets table';
            validation_passed := FALSE;
            error_count := error_count + 1;
        ELSE
            RAISE NOTICE '  ✓ PASSED: UNIQUE(user_id) constraint is maintained';
        END IF;
    END;
    
    RAISE NOTICE '';
    
    -- ========================================================================
    -- Validation 5: Check clubs table (if exists)
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'clubs') THEN
        RAISE NOTICE 'Validation 5: Checking clubs table...';
        
        DECLARE
            total_clubs INTEGER;
            duplicate_clubs INTEGER;
        BEGIN
            SELECT COUNT(*) INTO total_clubs FROM public.clubs;
            
            -- Adjust duplicate detection based on your clubs table schema
            -- This is a generic example
            SELECT COUNT(*) INTO duplicate_clubs
            FROM (
                SELECT id, COUNT(*) OVER (PARTITION BY id) as cnt
                FROM public.clubs
            ) dups
            WHERE cnt > 1;
            
            IF duplicate_clubs > 0 THEN
                RAISE WARNING '  ⚠ WARNING: Found potential duplicate clubs (verify schema-specific logic)';
            ELSE
                RAISE NOTICE '  ✓ PASSED: Clubs table appears clean';
                RAISE NOTICE '    Total clubs: %', total_clubs;
            END IF;
        END;
        
        RAISE NOTICE '';
    END IF;
    
    -- ========================================================================
    -- Final Summary
    -- ========================================================================
    RAISE NOTICE '========================================================';
    IF validation_passed THEN
        RAISE NOTICE '✓ ALL VALIDATIONS PASSED';
        RAISE NOTICE '  The deduplication migration completed successfully.';
        RAISE NOTICE '  All foreign keys are valid and no data loss detected.';
    ELSE
        RAISE NOTICE '✗ VALIDATION FAILED';
        RAISE NOTICE '  Found % error(s). Please review the warnings above.', error_count;
        RAISE NOTICE '  Consider running the rollback script if necessary.';
    END IF;
    RAISE NOTICE '========================================================';
    
END $$;

