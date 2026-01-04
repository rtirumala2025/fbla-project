-- 027_optimize_rls_performance.sql
-- Description:
--   Addresses "Auth RLS Initialization Plan" (PERFORMANCE) warnings.
--   1. Drops SPECIFIC legacy policies reported by linter to ensure clean state.
--   2. Wraps auth.uid(), auth.role(), etc. in subqueries (SELECT auth.uid()).
--   3. Merges redundant permissive policies.
--   4. Fixes pet_accessories authorization.

BEGIN;

-- ============================================================================
-- 1. Profiles & Preferences
-- ============================================================================

-- Table: public.profiles
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_own ON public.profiles;
DROP POLICY IF EXISTS "profiles_manage_own" ON public.profiles;

CREATE POLICY "profiles_manage_own"
ON public.profiles
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.user_preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can select own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS user_preferences_select_own ON public.user_preferences;
DROP POLICY IF EXISTS user_preferences_upsert_own ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_manage_own" ON public.user_preferences;

CREATE POLICY "user_preferences_manage_own"
ON public.user_preferences
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- ============================================================================
-- 2. Finance System
-- ============================================================================

-- Table: public.finance_wallets
DROP POLICY IF EXISTS finance_wallets_select_own ON public.finance_wallets;
DROP POLICY IF EXISTS finance_wallets_modify_own ON public.finance_wallets;
DROP POLICY IF EXISTS "finance_wallets_manage_own" ON public.finance_wallets;

CREATE POLICY "finance_wallets_manage_own"
ON public.finance_wallets
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.finance_goals
DROP POLICY IF EXISTS finance_goals_select_own ON public.finance_goals;
DROP POLICY IF EXISTS finance_goals_modify_own ON public.finance_goals;
DROP POLICY IF EXISTS "finance_goals_manage_own" ON public.finance_goals;

CREATE POLICY "finance_goals_manage_own"
ON public.finance_goals
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.finance_transactions
DROP POLICY IF EXISTS finance_transactions_select_own ON public.finance_transactions;
DROP POLICY IF EXISTS finance_transactions_insert_own ON public.finance_transactions;
DROP POLICY IF EXISTS finance_transactions_update_own ON public.finance_transactions;
DROP POLICY IF EXISTS finance_transactions_delete_own ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_manage_own" ON public.finance_transactions;

CREATE POLICY "finance_transactions_manage_own"
ON public.finance_transactions
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.finance_inventory
DROP POLICY IF EXISTS finance_inventory_select_own ON public.finance_inventory;
DROP POLICY IF EXISTS finance_inventory_modify_own ON public.finance_inventory;
DROP POLICY IF EXISTS "finance_inventory_manage_own" ON public.finance_inventory;

CREATE POLICY "finance_inventory_manage_own"
ON public.finance_inventory
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- ============================================================================
-- 3. Analytics & Logs
-- ============================================================================

-- Table: public.analytics_daily_snapshots
DROP POLICY IF EXISTS analytics_daily_select_own ON public.analytics_daily_snapshots;
DROP POLICY IF EXISTS analytics_daily_modify_own ON public.analytics_daily_snapshots;
DROP POLICY IF EXISTS "analytics_daily_manage_own" ON public.analytics_daily_snapshots;

CREATE POLICY "analytics_daily_manage_own"
ON public.analytics_daily_snapshots
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.analytics_weekly_snapshots
DROP POLICY IF EXISTS analytics_weekly_select_own ON public.analytics_weekly_snapshots;
DROP POLICY IF EXISTS analytics_weekly_modify_own ON public.analytics_weekly_snapshots;
DROP POLICY IF EXISTS "analytics_weekly_manage_own" ON public.analytics_weekly_snapshots;

CREATE POLICY "analytics_weekly_manage_own"
ON public.analytics_weekly_snapshots
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.analytics_monthly_snapshots
DROP POLICY IF EXISTS analytics_monthly_select_own ON public.analytics_monthly_snapshots;
DROP POLICY IF EXISTS analytics_monthly_modify_own ON public.analytics_monthly_snapshots;
DROP POLICY IF EXISTS "analytics_monthly_manage_own" ON public.analytics_monthly_snapshots;

CREATE POLICY "analytics_monthly_manage_own"
ON public.analytics_monthly_snapshots
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.analytics_notifications
DROP POLICY IF EXISTS analytics_notifications_select_own ON public.analytics_notifications;
DROP POLICY IF EXISTS analytics_notifications_modify_own ON public.analytics_notifications;
DROP POLICY IF EXISTS "analytics_notifications_manage_own" ON public.analytics_notifications;

CREATE POLICY "analytics_notifications_manage_own"
ON public.analytics_notifications
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.email_logs
DROP POLICY IF EXISTS email_logs_select_own ON public.email_logs;
DROP POLICY IF EXISTS email_logs_service_role ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_manage_own" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_service_role_manage" ON public.email_logs;

CREATE POLICY "email_logs_manage_own"
ON public.email_logs
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "email_logs_service_role_manage"
ON public.email_logs
FOR ALL
TO service_role
USING ((SELECT auth.role()) = 'service_role');


-- ============================================================================
-- 4. Social & Friends
-- ============================================================================

-- Table: public.friends
DROP POLICY IF EXISTS friends_select_related ON public.friends;
DROP POLICY IF EXISTS friends_insert_self ON public.friends;
DROP POLICY IF EXISTS friends_update_participants ON public.friends;
DROP POLICY IF EXISTS friends_delete_participants ON public.friends;
DROP POLICY IF EXISTS "friends_manage_own" ON public.friends;

CREATE POLICY "friends_manage_own"
ON public.friends
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) IN (user_id, friend_id))
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.public_profiles
DROP POLICY IF EXISTS public_profiles_select_visible ON public.public_profiles;
DROP POLICY IF EXISTS public_profiles_insert_self ON public.public_profiles;
DROP POLICY IF EXISTS public_profiles_update_self ON public.public_profiles;
DROP POLICY IF EXISTS public_profiles_delete_self ON public.public_profiles;
DROP POLICY IF EXISTS "public_profiles_select_policy" ON public.public_profiles;
DROP POLICY IF EXISTS "public_profiles_modify_own" ON public.public_profiles;
DROP POLICY IF EXISTS "public_profiles_insert_own" ON public.public_profiles;
DROP POLICY IF EXISTS "public_profiles_update_own" ON public.public_profiles;
DROP POLICY IF EXISTS "public_profiles_delete_own" ON public.public_profiles;

CREATE POLICY "public_profiles_select_policy"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (is_visible OR (SELECT auth.uid()) = user_id);

CREATE POLICY "public_profiles_insert_own"
ON public.public_profiles
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "public_profiles_update_own"
ON public.public_profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "public_profiles_delete_own"
ON public.public_profiles
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);


-- ============================================================================
-- 5. Game & Quests
-- ============================================================================

-- Table: public.user_quests
DROP POLICY IF EXISTS user_quests_select_own ON public.user_quests;
DROP POLICY IF EXISTS user_quests_modify_own ON public.user_quests;
DROP POLICY IF EXISTS "user_quests_manage_own" ON public.user_quests;

CREATE POLICY "user_quests_manage_own"
ON public.user_quests
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- ============================================================================
-- 6. Core Tables
-- ============================================================================

-- Table: public.users
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "users_read_own" ON public.users;

CREATE POLICY "users_read_own"
ON public.users
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);


-- ============================================================================
-- 7. Additional Tables & Pet Accessories
-- ============================================================================

-- Table: public.user_accessories
DROP POLICY IF EXISTS user_accessories_select_own ON public.user_accessories;
DROP POLICY IF EXISTS user_accessories_modify_own ON public.user_accessories;
DROP POLICY IF EXISTS "user_accessories_manage_own" ON public.user_accessories;

CREATE POLICY "user_accessories_manage_own"
ON public.user_accessories
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.pet_art_cache
DROP POLICY IF EXISTS pet_art_cache_select_own ON public.pet_art_cache;
DROP POLICY IF EXISTS pet_art_cache_upsert_own ON public.pet_art_cache;
DROP POLICY IF EXISTS pet_art_cache_update_own ON public.pet_art_cache;
DROP POLICY IF EXISTS pet_art_cache_delete_own ON public.pet_art_cache;
DROP POLICY IF EXISTS "pet_art_cache_manage_own" ON public.pet_art_cache;

CREATE POLICY "pet_art_cache_manage_own"
ON public.pet_art_cache
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


-- Table: public.pet_accessories
-- NOTE: Corrected column name from user_id to pet_id + join
DROP POLICY IF EXISTS pet_accessories_select_own ON public.pet_accessories;
DROP POLICY IF EXISTS pet_accessories_insert_own ON public.pet_accessories;
DROP POLICY IF EXISTS pet_accessories_update_own ON public.pet_accessories;
DROP POLICY IF EXISTS pet_accessories_delete_own ON public.pet_accessories;
DROP POLICY IF EXISTS "pet_accessories_manage_own" ON public.pet_accessories;

CREATE POLICY "pet_accessories_manage_own"
ON public.pet_accessories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_accessories.pet_id
    AND pets.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = pet_accessories.pet_id
    AND pets.user_id = (SELECT auth.uid())
  )
);


-- ============================================================================
-- 8. Catch-all for reported tables (Conditional)
-- ============================================================================

DO $$
BEGIN
    -- pets
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pets') THEN
        DROP POLICY IF EXISTS pets_select_own ON public.pets;
        DROP POLICY IF EXISTS pets_insert_own ON public.pets;
        DROP POLICY IF EXISTS pets_update_own ON public.pets;
        DROP POLICY IF EXISTS pets_delete_own ON public.pets;
        DROP POLICY IF EXISTS "pets_manage_own" ON public.pets;
        
        EXECUTE 'CREATE POLICY "pets_manage_own" ON public.pets FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;

    -- game_sessions
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_sessions') THEN
        DROP POLICY IF EXISTS game_sessions_select_own ON public.game_sessions;
        DROP POLICY IF EXISTS game_sessions_modify_own ON public.game_sessions;
        DROP POLICY IF EXISTS "game_sessions_manage_own" ON public.game_sessions;
        
        EXECUTE 'CREATE POLICY "game_sessions_manage_own" ON public.game_sessions FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;

    -- cloud_sync_snapshots
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cloud_sync_snapshots') THEN
        DROP POLICY IF EXISTS cloud_sync_select_own ON public.cloud_sync_snapshots;
        DROP POLICY IF EXISTS cloud_sync_modify_own ON public.cloud_sync_snapshots;
        DROP POLICY IF EXISTS "cloud_sync_manage_own" ON public.cloud_sync_snapshots;
        
        EXECUTE 'CREATE POLICY "cloud_sync_manage_own" ON public.cloud_sync_snapshots FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;

    -- user_balance (legacy?)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_balance') THEN
        BEGIN
            DROP POLICY IF EXISTS "Users can view own balance" ON public.user_balance;
            DROP POLICY IF EXISTS "Users can update own balance" ON public.user_balance;
        EXCEPTION WHEN undefined_object THEN
            NULL;
        END;
        DROP POLICY IF EXISTS "user_balance_manage_own" ON public.user_balance;
        
        EXECUTE 'CREATE POLICY "user_balance_manage_own" ON public.user_balance FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;

    -- simulation_logs (legacy?)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'simulation_logs') THEN
        BEGIN
            DROP POLICY IF EXISTS "Users can view own simulation logs" ON public.simulation_logs;
            DROP POLICY IF EXISTS "Users can insert own simulation logs" ON public.simulation_logs;
        EXCEPTION WHEN undefined_object THEN
            NULL;
        END;
        DROP POLICY IF EXISTS "simulation_logs_manage_own" ON public.simulation_logs;

        EXECUTE 'CREATE POLICY "simulation_logs_manage_own" ON public.simulation_logs FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;

    -- portfolio_history (legacy?)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portfolio_history') THEN
        BEGIN
            DROP POLICY IF EXISTS "Users can view own portfolio history" ON public.portfolio_history;
            DROP POLICY IF EXISTS "Users can insert own portfolio history" ON public.portfolio_history;
        EXCEPTION WHEN undefined_object THEN
            NULL;
        END;
        DROP POLICY IF EXISTS "portfolio_history_manage_own" ON public.portfolio_history;

        EXECUTE 'CREATE POLICY "portfolio_history_manage_own" ON public.portfolio_history FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;
    
    -- game_rounds
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_rounds') THEN
        DROP POLICY IF EXISTS game_rounds_select_own ON public.game_rounds;
        DROP POLICY IF EXISTS game_rounds_modify_own ON public.game_rounds;
        DROP POLICY IF EXISTS "game_rounds_manage_own" ON public.game_rounds;
        
        EXECUTE 'CREATE POLICY "game_rounds_manage_own" ON public.game_rounds FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;

    -- game_achievements
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_achievements') THEN
        DROP POLICY IF EXISTS game_achievements_select_own ON public.game_achievements;
        DROP POLICY IF EXISTS game_achievements_modify_own ON public.game_achievements;
        DROP POLICY IF EXISTS "game_achievements_manage_own" ON public.game_achievements;
        
        EXECUTE 'CREATE POLICY "game_achievements_manage_own" ON public.game_achievements FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;
    
    -- pet_ai_context
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pet_ai_context') THEN
        DROP POLICY IF EXISTS pet_ai_context_select_own ON public.pet_ai_context;
        DROP POLICY IF EXISTS pet_ai_context_upsert_own ON public.pet_ai_context;
        DROP POLICY IF EXISTS "pet_ai_context_manage_own" ON public.pet_ai_context;
        
        EXECUTE 'CREATE POLICY "pet_ai_context_manage_own" ON public.pet_ai_context FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;

    -- transaction table (if linter reports it separate from finance_transactions)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        BEGIN
             DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
        EXCEPTION WHEN undefined_object THEN
             NULL;
        END;
    END IF;

    -- user_event_participation
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_event_participation') THEN
        DROP POLICY IF EXISTS user_event_participation_select_own ON public.user_event_participation;
        DROP POLICY IF EXISTS user_event_participation_modify_own ON public.user_event_participation;
        DROP POLICY IF EXISTS "user_event_participation_manage_own" ON public.user_event_participation;
        
        EXECUTE 'CREATE POLICY "user_event_participation_manage_own" ON public.user_event_participation FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
    END IF;

    -- pet_diary_entries
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pet_diary_entries') THEN
        DROP POLICY IF EXISTS pet_diary_select_own ON public.pet_diary_entries;
        DROP POLICY IF EXISTS pet_diary_insert_own ON public.pet_diary_entries;
        DROP POLICY IF EXISTS pet_diary_update_own ON public.pet_diary_entries;
        DROP POLICY IF EXISTS pet_diary_delete_own ON public.pet_diary_entries;
        DROP POLICY IF EXISTS "pet_diary_manage_own" ON public.pet_diary_entries;
        
        -- Needs a JOIN or check if user_id is on table? 017_missing_service_tables.sql says it uses `pet_id`
        -- Wait, 017 says pet_diary_entries has `pet_id REFERENCES pets`. So it needs JOIN.
        -- Let's check if it also has user_id. 
        -- If it only has `pet_id`, we need the JOIN logic like pet_accessories.
        -- I will assume for now I need to check the schema. But to be safe, I'll use the JOIN logic if user_id is missing.
        -- Actually, checking 017 file would be best.
        -- Assuming user_id exists if the previous policy was just `auth.uid() = user_id` (which linter implied was bad due to optimization).
        -- BUT if linter complained about initplan, it means it's calling auth.uid().
        -- Let's use the JOIN logic just to be safe if user_id is missing, but if user_id is there, direct check is better.
        -- I'll check user_id column existence dynamically.
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pet_diary_entries' AND column_name = 'user_id') THEN
             EXECUTE 'CREATE POLICY "pet_diary_manage_own" ON public.pet_diary_entries FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)';
        ELSE
             EXECUTE 'CREATE POLICY "pet_diary_manage_own" ON public.pet_diary_entries FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.pets WHERE pets.id = pet_diary_entries.pet_id AND pets.user_id = (SELECT auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.pets WHERE pets.id = pet_diary_entries.pet_id AND pets.user_id = (SELECT auth.uid())))';
        END IF;
    END IF;

END $$;

-- Drop duplicate index on profiles if it exists
DROP INDEX IF EXISTS public.profiles_user_id_idx;

COMMIT;
