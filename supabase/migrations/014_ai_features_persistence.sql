-- 014_ai_features_persistence.sql
-- Description:
--   Database tables for persisting AI feature data:
--   - AI chat sessions and messages
--   - Budget advisor analysis history
--   - Coach advice history
--   This enables full end-to-end functionality with data persistence and history tracking.

BEGIN;

-- AI Chat Sessions Table
-- Stores chat session metadata and enables conversation history retrieval
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  last_message_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_session_id ON public.ai_chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_last_message_at ON public.ai_chat_sessions(last_message_at DESC);

-- AI Chat Messages Table
-- Stores individual messages in chat sessions for full conversation history
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  pet_state JSONB,
  health_forecast JSONB,
  mood TEXT,
  notifications JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON public.ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON public.ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON public.ai_chat_messages(created_at DESC);

-- Budget Advisor Analysis History Table
-- Stores budget analysis results for historical tracking and insights
CREATE TABLE IF NOT EXISTS public.budget_advisor_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  total_spending NUMERIC(12, 2) NOT NULL,
  total_income NUMERIC(12, 2) NOT NULL,
  net_balance NUMERIC(12, 2) NOT NULL,
  average_daily_spending NUMERIC(12, 2) NOT NULL,
  monthly_budget NUMERIC(12, 2),
  transaction_count INTEGER NOT NULL,
  top_categories JSONB NOT NULL,
  trends JSONB NOT NULL,
  overspending_alerts JSONB NOT NULL,
  suggestions JSONB NOT NULL,
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  full_analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_budget_advisor_analyses_user_id ON public.budget_advisor_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_advisor_analyses_analysis_date ON public.budget_advisor_analyses(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_advisor_analyses_user_date ON public.budget_advisor_analyses(user_id, analysis_date DESC);

-- Coach Advice History Table
-- Stores coach advice for tracking recommendations over time
CREATE TABLE IF NOT EXISTS public.coach_advice_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  advice_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  mood TEXT,
  difficulty_hint TEXT NOT NULL,
  summary TEXT NOT NULL,
  suggestions JSONB NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('heuristic', 'llm')),
  pet_stats_snapshot JSONB,
  quest_context JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_coach_advice_history_user_id ON public.coach_advice_history(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_advice_history_advice_date ON public.coach_advice_history(advice_date DESC);
CREATE INDEX IF NOT EXISTS idx_coach_advice_history_user_date ON public.coach_advice_history(user_id, advice_date DESC);

-- Timestamp triggers
DROP TRIGGER IF EXISTS trg_ai_chat_sessions_timestamps ON public.ai_chat_sessions;
CREATE TRIGGER trg_ai_chat_sessions_timestamps
BEFORE INSERT OR UPDATE ON public.ai_chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

-- Function to update session message count and last_message_at
CREATE OR REPLACE FUNCTION update_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_chat_sessions
  SET 
    message_count = (
      SELECT COUNT(*) 
      FROM public.ai_chat_messages 
      WHERE session_id = NEW.session_id
    ),
    last_message_at = NEW.created_at,
    updated_at = timezone('utc', now())
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_chat_session_stats ON public.ai_chat_messages;
CREATE TRIGGER trg_update_chat_session_stats
AFTER INSERT ON public.ai_chat_messages
FOR EACH ROW EXECUTE FUNCTION update_chat_session_stats();

COMMIT;

