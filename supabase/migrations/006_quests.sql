-- 006_quests.sql
-- Description:
--   Quest catalog and per-user quest progress tracking with enumerated constraints and policies.

BEGIN;

CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'event')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard', 'heroic')),
  rewards JSONB NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 1,
  icon TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_quests_timestamps ON public.quests;
CREATE TRIGGER trg_quests_timestamps
BEFORE INSERT OR UPDATE ON public.quests
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_quests_type ON public.quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_difficulty ON public.quests(difficulty);
CREATE INDEX IF NOT EXISTS idx_quests_active_window ON public.quests(start_at, end_at);

CREATE TABLE IF NOT EXISTS public.user_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'claimed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  target_value INTEGER NOT NULL DEFAULT 1 CHECK (target_value > 0),
  last_progress_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, quest_id)
);

DROP TRIGGER IF EXISTS trg_user_quests_timestamps ON public.user_quests;
CREATE TRIGGER trg_user_quests_timestamps
BEFORE INSERT OR UPDATE ON public.user_quests
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON public.user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON public.user_quests(status);

ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_quests_select_own ON public.user_quests;
CREATE POLICY user_quests_select_own
ON public.user_quests
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_quests_modify_own ON public.user_quests;
CREATE POLICY user_quests_modify_own
ON public.user_quests
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Quest catalog is readable by all authenticated users; managed via service role.
GRANT SELECT ON public.quests TO authenticated;
GRANT ALL ON public.quests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_quests TO authenticated;
GRANT ALL ON public.user_quests TO service_role;

COMMIT;


