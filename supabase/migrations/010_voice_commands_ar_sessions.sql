-- 010_voice_commands_ar_sessions.sql
-- Description:
--   Voice command history and AR session persistence tables for next-gen features.

BEGIN;

-- Voice command history table
CREATE TABLE IF NOT EXISTS public.voice_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  intent TEXT NOT NULL,
  confidence FLOAT NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
  action TEXT,
  feedback TEXT NOT NULL,
  execution_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_voice_commands_timestamps ON public.voice_commands;
CREATE TRIGGER trg_voice_commands_timestamps
BEFORE INSERT OR UPDATE ON public.voice_commands
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON public.voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_created_at ON public.voice_commands(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON public.voice_commands(intent);

-- AR sessions table
CREATE TABLE IF NOT EXISTS public.ar_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  device_info JSONB,
  anchor_data JSONB,
  pet_data JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_ar_sessions_timestamps ON public.ar_sessions;
CREATE TRIGGER trg_ar_sessions_timestamps
BEFORE INSERT OR UPDATE ON public.ar_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_ar_sessions_user_id ON public.ar_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_sessions_session_id ON public.ar_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ar_sessions_started_at ON public.ar_sessions(started_at);

-- RLS Policies for voice_commands
ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice commands"
  ON public.voice_commands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice commands"
  ON public.voice_commands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice commands"
  ON public.voice_commands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice commands"
  ON public.voice_commands FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ar_sessions
ALTER TABLE public.ar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AR sessions"
  ON public.ar_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AR sessions"
  ON public.ar_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AR sessions"
  ON public.ar_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AR sessions"
  ON public.ar_sessions FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;

