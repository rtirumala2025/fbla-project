-- 011_email_logging.sql
-- Description:
--   Create email logging table to track welcome emails sent to users

BEGIN;

-- Email logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'welcome',
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage all email logs
DROP POLICY IF EXISTS email_logs_service_role ON public.email_logs;
CREATE POLICY email_logs_service_role
ON public.email_logs
FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policy: Users can view their own email logs
DROP POLICY IF EXISTS email_logs_select_own ON public.email_logs;
CREATE POLICY email_logs_select_own
ON public.email_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

COMMIT;

