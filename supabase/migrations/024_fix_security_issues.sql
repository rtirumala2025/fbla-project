-- 024_fix_security_issues.sql
-- Description:
--   Fixes security issues reported by Supabase linter:
--   1. Fixes SECURITY DEFINER views (shop_items, pet_inventory) by setting security_invoker = on
--   2. Enables RLS on public tables (users, accessories, finance_shop_items, events, quests, game_leaderboards)
--   3. Adds appropriate styles for these tables (Public Read for catalogs, Private Read for users)

BEGIN;

-- ============================================================================
-- 1. Fix Security Definer Views
-- ============================================================================

-- Fix shop_items view to respect RLS
ALTER VIEW public.shop_items SET (security_invoker = on);

-- Fix pet_inventory view to respect RLS (Critical for user separation)
ALTER VIEW public.pet_inventory SET (security_invoker = on);


-- ============================================================================
-- 2. Enable RLS and Add Policies
-- ============================================================================

-- Table: public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
-- Note: Service role still has full access.
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);


-- Table: public.accessories (Catalog)
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all accessories
DROP POLICY IF EXISTS "Authenticated users can read all accessories" ON public.accessories;
CREATE POLICY "Authenticated users can read all accessories" 
ON public.accessories 
FOR SELECT 
TO authenticated 
USING (true);


-- Table: public.finance_shop_items (Catalog)
ALTER TABLE public.finance_shop_items ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all shop items
DROP POLICY IF EXISTS "Authenticated users can read all finance shop items" ON public.finance_shop_items;
CREATE POLICY "Authenticated users can read all finance shop items" 
ON public.finance_shop_items 
FOR SELECT 
TO authenticated 
USING (true);


-- Table: public.events (Catalog)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all events
DROP POLICY IF EXISTS "Authenticated users can read all events" ON public.events;
CREATE POLICY "Authenticated users can read all events" 
ON public.events 
FOR SELECT 
TO authenticated 
USING (true);


-- Table: public.quests (Catalog)
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all quests
DROP POLICY IF EXISTS "Authenticated users can read all quests" ON public.quests;
CREATE POLICY "Authenticated users can read all quests" 
ON public.quests 
FOR SELECT 
TO authenticated 
USING (true);


-- Table: public.game_leaderboards (Public Read)
ALTER TABLE public.game_leaderboards ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all leaderboards
DROP POLICY IF EXISTS "Authenticated users can read all leaderboards" ON public.game_leaderboards;
CREATE POLICY "Authenticated users can read all leaderboards" 
ON public.game_leaderboards 
FOR SELECT 
TO authenticated 
USING (true);

COMMIT;
