-- 017_missing_service_tables.sql
-- Description:
--   Create tables that are currently created dynamically in service layer.
--   This ensures proper schema versioning, RLS policies, and foreign key constraints.

BEGIN;

-- Pet Diary Entries
-- Currently created in backend/app/services/pet_service.py
CREATE TABLE IF NOT EXISTS public.pet_diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_pet_diary_pet_id 
ON public.pet_diary_entries(pet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pet_diary_user_created 
ON public.pet_diary_entries(user_id, created_at DESC);

ALTER TABLE public.pet_diary_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pet_diary_select_own ON public.pet_diary_entries;
CREATE POLICY pet_diary_select_own ON public.pet_diary_entries
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pet_diary_insert_own ON public.pet_diary_entries;
CREATE POLICY pet_diary_insert_own ON public.pet_diary_entries
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pet_diary_update_own ON public.pet_diary_entries;
CREATE POLICY pet_diary_update_own ON public.pet_diary_entries
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pet_diary_delete_own ON public.pet_diary_entries;
CREATE POLICY pet_diary_delete_own ON public.pet_diary_entries
FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_diary_entries TO authenticated;
GRANT ALL ON public.pet_diary_entries TO service_role;

-- Pet AI Context
-- Currently created in backend/app/services/pet_ai_service.py
CREATE TABLE IF NOT EXISTS public.pet_ai_context (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  memory JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (user_id, pet_id)
);

CREATE INDEX IF NOT EXISTS idx_pet_ai_context_user_id ON public.pet_ai_context(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_ai_context_pet_id ON public.pet_ai_context(pet_id);

ALTER TABLE public.pet_ai_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pet_ai_context_select_own ON public.pet_ai_context;
CREATE POLICY pet_ai_context_select_own ON public.pet_ai_context
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pet_ai_context_upsert_own ON public.pet_ai_context;
CREATE POLICY pet_ai_context_upsert_own ON public.pet_ai_context
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_ai_context TO authenticated;
GRANT ALL ON public.pet_ai_context TO service_role;

-- Events Table
-- Referenced in backend/app/services/event_service.py but missing from migrations
CREATE TABLE IF NOT EXISTS public.events (
  event_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL,
  effects JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_events_timestamps ON public.events;
CREATE TRIGGER trg_events_timestamps
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_events_dates ON public.events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);

-- Events catalog is readable by all authenticated users; managed via service role
GRANT SELECT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

-- User Event Participation
-- Referenced in backend/app/services/event_service.py but missing from migrations
CREATE TABLE IF NOT EXISTS public.user_event_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_interacted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (event_id, user_id)
);

DROP TRIGGER IF EXISTS trg_user_event_participation_timestamps ON public.user_event_participation;
CREATE TRIGGER trg_user_event_participation_timestamps
BEFORE INSERT OR UPDATE ON public.user_event_participation
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_user_event_participation_user_id ON public.user_event_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_participation_event_id ON public.user_event_participation(event_id);

ALTER TABLE public.user_event_participation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_event_participation_select_own ON public.user_event_participation;
CREATE POLICY user_event_participation_select_own ON public.user_event_participation
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_event_participation_modify_own ON public.user_event_participation;
CREATE POLICY user_event_participation_modify_own ON public.user_event_participation
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_event_participation TO authenticated;
GRANT ALL ON public.user_event_participation TO service_role;

COMMIT;

