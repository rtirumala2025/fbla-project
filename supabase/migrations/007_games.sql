-- 007_games.sql
-- Description:
--   Game rounds, sessions, leaderboards, and achievements tables powering mini-games.

BEGIN;

CREATE TABLE IF NOT EXISTS public.game_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  recommended_difficulty TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired')),
  ai_seed JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_game_rounds_timestamps ON public.game_rounds;
CREATE TRIGGER trg_game_rounds_timestamps
BEFORE INSERT OR UPDATE ON public.game_rounds
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_game_rounds_user_id ON public.game_rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_status ON public.game_rounds(status);
CREATE INDEX IF NOT EXISTS idx_game_rounds_expires_at ON public.game_rounds(expires_at);

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.game_rounds(id) ON DELETE SET NULL,
  game_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  happiness_gain INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_game_sessions_timestamps ON public.game_sessions;
CREATE TRIGGER trg_game_sessions_timestamps
BEFORE INSERT OR UPDATE ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON public.game_sessions(game_type);

CREATE TABLE IF NOT EXISTS public.game_leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_coins INTEGER NOT NULL DEFAULT 0,
  total_happiness INTEGER NOT NULL DEFAULT 0,
  average_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  daily_streak INTEGER NOT NULL DEFAULT 0,
  last_daily_reset DATE,
  last_played_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, game_type)
);

DROP TRIGGER IF EXISTS trg_game_leaderboards_timestamps ON public.game_leaderboards;
CREATE TRIGGER trg_game_leaderboards_timestamps
BEFORE INSERT OR UPDATE ON public.game_leaderboards
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_game_leaderboards_game_type ON public.game_leaderboards(game_type);
CREATE INDEX IF NOT EXISTS idx_game_leaderboards_best_score ON public.game_leaderboards(best_score DESC);

CREATE TABLE IF NOT EXISTS public.game_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, achievement_key)
);

DROP TRIGGER IF EXISTS trg_game_achievements_timestamps ON public.game_achievements;
CREATE TRIGGER trg_game_achievements_timestamps
BEFORE INSERT OR UPDATE ON public.game_achievements
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_game_achievements_user_id ON public.game_achievements(user_id);

ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS game_rounds_select_own ON public.game_rounds;
CREATE POLICY game_rounds_select_own
ON public.game_rounds
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS game_rounds_modify_own ON public.game_rounds;
CREATE POLICY game_rounds_modify_own
ON public.game_rounds
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS game_sessions_select_own ON public.game_sessions;
CREATE POLICY game_sessions_select_own
ON public.game_sessions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS game_sessions_modify_own ON public.game_sessions;
CREATE POLICY game_sessions_modify_own
ON public.game_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS game_achievements_select_own ON public.game_achievements;
CREATE POLICY game_achievements_select_own
ON public.game_achievements
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS game_achievements_modify_own ON public.game_achievements;
CREATE POLICY game_achievements_modify_own
ON public.game_achievements
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Leaderboards are globally readable; updates managed via service role.
GRANT SELECT ON public.game_leaderboards TO authenticated;
GRANT ALL ON public.game_leaderboards TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_rounds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_achievements TO authenticated;

GRANT ALL ON public.game_rounds TO service_role;
GRANT ALL ON public.game_sessions TO service_role;
GRANT ALL ON public.game_achievements TO service_role;

COMMIT;


