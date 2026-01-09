BEGIN;

-- Allow users to upsert their own leaderboard entries
-- We already have SELECT granted to authenticated users.
-- We need to add a policy for INSERT and UPDATE (or ALL) on game_leaderboards.

ALTER TABLE public.game_leaderboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS game_leaderboards_select_all ON public.game_leaderboards;
CREATE POLICY game_leaderboards_select_all
ON public.game_leaderboards
FOR SELECT
USING (true); -- Everyone can see leaderboards

DROP POLICY IF EXISTS game_leaderboards_upsert_own ON public.game_leaderboards;
CREATE POLICY game_leaderboards_upsert_own
ON public.game_leaderboards
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.game_leaderboards TO authenticated;

COMMIT;
