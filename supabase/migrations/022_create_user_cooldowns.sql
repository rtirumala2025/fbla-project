-- 022_create_user_cooldowns.sql
-- Description:
--   Create user_cooldowns table for tracking earning activity cooldowns

BEGIN;

-- User Cooldowns Table
-- Stores cooldown timestamps for user earning activities
CREATE TABLE IF NOT EXISTS public.user_cooldowns (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  cooldowns JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_user_cooldowns_timestamps ON public.user_cooldowns;
CREATE TRIGGER trg_user_cooldowns_timestamps
BEFORE INSERT OR UPDATE ON public.user_cooldowns
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_user_cooldowns_user_id ON public.user_cooldowns(user_id);

ALTER TABLE public.user_cooldowns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_cooldowns_select_own ON public.user_cooldowns;
CREATE POLICY user_cooldowns_select_own ON public.user_cooldowns
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_cooldowns_upsert_own ON public.user_cooldowns;
CREATE POLICY user_cooldowns_upsert_own ON public.user_cooldowns
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_cooldowns TO authenticated;
GRANT ALL ON public.user_cooldowns TO service_role;

COMMIT;
