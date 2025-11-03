-- ============================================
-- DATABASE VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to verify setup
-- ============================================

-- 1. Check if user_preferences table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_preferences'
) AS user_preferences_exists;

-- 2. Check if pets table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'pets'
) AS pets_exists;

-- 3. Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) AS profiles_exists;

-- 4. Check if transactions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'transactions'
) AS transactions_exists;

-- 5. Verify RLS is enabled on user_preferences
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_preferences' AND schemaname = 'public';

-- 6. Verify RLS is enabled on pets
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'pets' AND schemaname = 'public';

-- 7. Verify RLS is enabled on profiles
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 8. List all RLS policies on user_preferences
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd AS operation,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'user_preferences'
ORDER BY policyname;

-- 9. List all RLS policies on pets
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd AS operation,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'pets'
ORDER BY policyname;

-- 10. List all RLS policies on profiles
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd AS operation,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 11. View user_preferences table schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 12. View pets table schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'pets' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 13. View profiles table schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 14. Check for UNIQUE constraint on pets.user_id
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'pets'
  AND tc.constraint_type = 'UNIQUE';

-- 15. Sample query - Check a specific user's profile (REPLACE <user_id>)
-- SELECT * FROM profiles WHERE user_id = '<YOUR_USER_ID>';

-- 16. Sample query - Check a specific user's preferences (REPLACE <user_id>)
-- SELECT * FROM user_preferences WHERE user_id = '<YOUR_USER_ID>';

-- 17. Sample query - Check a specific user's pet (REPLACE <user_id>)
-- SELECT * FROM pets WHERE user_id = '<YOUR_USER_ID>';

-- 18. Count total users with profiles
SELECT COUNT(*) AS total_profiles FROM profiles;

-- 19. Count total users with preferences
SELECT COUNT(*) AS total_preferences FROM user_preferences;

-- 20. Count total pets
SELECT COUNT(*) AS total_pets FROM pets;

-- ============================================
-- EXPECTED RESULTS:
-- - All EXISTS queries should return TRUE
-- - All rowsecurity should be TRUE
-- - user_preferences should have 4 RLS policies (INSERT, SELECT, UPDATE, DELETE)
-- - pets should have 4 RLS policies (INSERT, SELECT, UPDATE, DELETE)
-- - profiles should have 4 RLS policies (INSERT, SELECT, UPDATE, DELETE)
-- - All policies should use "auth.uid() = user_id" pattern
-- - pets table should have UNIQUE constraint on user_id
-- ============================================

