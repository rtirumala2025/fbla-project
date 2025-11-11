-- 008_analytics_and_sync.sql
-- Description:
--   Analytics snapshot tables and cloud sync state with user-scoped security controls.

BEGIN;

CREATE TABLE IF NOT EXISTS public.analytics_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  coins_spent INTEGER NOT NULL DEFAULT 0,
  net_coins INTEGER NOT NULL DEFAULT 0,
  happiness_gain INTEGER NOT NULL DEFAULT 0,
  health_change INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  pet_actions INTEGER NOT NULL DEFAULT 0,
  avg_happiness DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_health DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_energy DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_cleanliness DOUBLE PRECISION NOT NULL DEFAULT 0,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, snapshot_date)
);

DROP TRIGGER IF EXISTS trg_analytics_daily_timestamps ON public.analytics_daily_snapshots;
CREATE TRIGGER trg_analytics_daily_timestamps
BEFORE INSERT OR UPDATE ON public.analytics_daily_snapshots
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_analytics_daily_user_id ON public.analytics_daily_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.analytics_daily_snapshots(snapshot_date DESC);

CREATE TABLE IF NOT EXISTS public.analytics_weekly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  coins_spent INTEGER NOT NULL DEFAULT 0,
  net_coins INTEGER NOT NULL DEFAULT 0,
  avg_happiness DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_health DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_energy DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_cleanliness DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_happiness_gain INTEGER NOT NULL DEFAULT 0,
  total_health_change INTEGER NOT NULL DEFAULT 0,
  total_games_played INTEGER NOT NULL DEFAULT 0,
  total_pet_actions INTEGER NOT NULL DEFAULT 0,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, period_start)
);

DROP TRIGGER IF EXISTS trg_analytics_weekly_timestamps ON public.analytics_weekly_snapshots;
CREATE TRIGGER trg_analytics_weekly_timestamps
BEFORE INSERT OR UPDATE ON public.analytics_weekly_snapshots
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_analytics_weekly_user_id ON public.analytics_weekly_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_weekly_period ON public.analytics_weekly_snapshots(period_start DESC);

CREATE TABLE IF NOT EXISTS public.analytics_monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  coins_spent INTEGER NOT NULL DEFAULT 0,
  net_coins INTEGER NOT NULL DEFAULT 0,
  avg_happiness DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_health DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_energy DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_cleanliness DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_happiness_gain INTEGER NOT NULL DEFAULT 0,
  total_health_change INTEGER NOT NULL DEFAULT 0,
  total_games_played INTEGER NOT NULL DEFAULT 0,
  total_pet_actions INTEGER NOT NULL DEFAULT 0,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, period_start)
);

DROP TRIGGER IF EXISTS trg_analytics_monthly_timestamps ON public.analytics_monthly_snapshots;
CREATE TRIGGER trg_analytics_monthly_timestamps
BEFORE INSERT OR UPDATE ON public.analytics_monthly_snapshots
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_analytics_monthly_user_id ON public.analytics_monthly_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_monthly_period ON public.analytics_monthly_snapshots(period_start DESC);

CREATE TABLE IF NOT EXISTS public.analytics_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  daily_snapshot_id UUID REFERENCES public.analytics_daily_snapshots(id) ON DELETE SET NULL,
  period_type TEXT NOT NULL DEFAULT 'daily',
  reference_date DATE NOT NULL,
  stat TEXT,
  change DOUBLE PRECISION NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_analytics_notifications_timestamps ON public.analytics_notifications;
CREATE TRIGGER trg_analytics_notifications_timestamps
BEFORE INSERT OR UPDATE ON public.analytics_notifications
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_analytics_notifications_user_id ON public.analytics_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_notifications_reference ON public.analytics_notifications(reference_date DESC);

CREATE TABLE IF NOT EXISTS public.cloud_sync_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_modified TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  last_device_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  conflict_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_cloud_sync_snapshots_timestamps ON public.cloud_sync_snapshots;
CREATE TRIGGER trg_cloud_sync_snapshots_timestamps
BEFORE INSERT OR UPDATE ON public.cloud_sync_snapshots
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

ALTER TABLE public.analytics_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_weekly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_sync_snapshots ENABLE ROW LEVEL SECURITY;

-- Daily snapshots policies.
DROP POLICY IF EXISTS analytics_daily_select_own ON public.analytics_daily_snapshots;
CREATE POLICY analytics_daily_select_own
ON public.analytics_daily_snapshots
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS analytics_daily_modify_own ON public.analytics_daily_snapshots;
CREATE POLICY analytics_daily_modify_own
ON public.analytics_daily_snapshots
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Weekly snapshots policies.
DROP POLICY IF EXISTS analytics_weekly_select_own ON public.analytics_weekly_snapshots;
CREATE POLICY analytics_weekly_select_own
ON public.analytics_weekly_snapshots
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS analytics_weekly_modify_own ON public.analytics_weekly_snapshots;
CREATE POLICY analytics_weekly_modify_own
ON public.analytics_weekly_snapshots
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Monthly snapshots policies.
DROP POLICY IF EXISTS analytics_monthly_select_own ON public.analytics_monthly_snapshots;
CREATE POLICY analytics_monthly_select_own
ON public.analytics_monthly_snapshots
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS analytics_monthly_modify_own ON public.analytics_monthly_snapshots;
CREATE POLICY analytics_monthly_modify_own
ON public.analytics_monthly_snapshots
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Notifications policies.
DROP POLICY IF EXISTS analytics_notifications_select_own ON public.analytics_notifications;
CREATE POLICY analytics_notifications_select_own
ON public.analytics_notifications
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS analytics_notifications_modify_own ON public.analytics_notifications;
CREATE POLICY analytics_notifications_modify_own
ON public.analytics_notifications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Cloud sync policies.
DROP POLICY IF EXISTS cloud_sync_select_own ON public.cloud_sync_snapshots;
CREATE POLICY cloud_sync_select_own
ON public.cloud_sync_snapshots
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS cloud_sync_modify_own ON public.cloud_sync_snapshots;
CREATE POLICY cloud_sync_modify_own
ON public.cloud_sync_snapshots
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_daily_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_weekly_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_monthly_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cloud_sync_snapshots TO authenticated;

GRANT ALL ON public.analytics_daily_snapshots TO service_role;
GRANT ALL ON public.analytics_weekly_snapshots TO service_role;
GRANT ALL ON public.analytics_monthly_snapshots TO service_role;
GRANT ALL ON public.analytics_notifications TO service_role;
GRANT ALL ON public.cloud_sync_snapshots TO service_role;

COMMIT;


