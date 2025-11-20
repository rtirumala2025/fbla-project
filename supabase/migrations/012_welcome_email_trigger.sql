-- 012_welcome_email_trigger.sql
-- Description:
--   Create database trigger to send welcome email when profile is created
--   Uses pg_net extension to call Supabase Edge Function
--   
--   Note: This trigger calls the edge function asynchronously.
--   For a more reliable approach, consider using Supabase webhooks or
--   calling the edge function directly from the application code.

BEGIN;

-- Enable pg_net extension for HTTP requests (if available)
-- Note: pg_net may not be available in all Supabase projects
-- If pg_net is not available, you can:
--   1. Use Supabase webhooks instead
--   2. Call the edge function from application code after profile creation
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_net extension not available. Consider using webhooks or application-level calls.';
END $$;

-- Function to trigger welcome email via Edge Function
-- Uses pg_net extension for async HTTP requests
-- Falls back gracefully if pg_net is unavailable
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
  pg_net_available BOOLEAN := false;
BEGIN
  -- Validate required fields
  IF NEW.user_id IS NULL THEN
    RAISE WARNING 'Cannot send welcome email: user_id is NULL';
    RETURN NEW;
  END IF;

  -- Check if pg_net extension is available
  BEGIN
    SELECT EXISTS(
      SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
    ) INTO pg_net_available;
  EXCEPTION
    WHEN OTHERS THEN
      pg_net_available := false;
  END;

  IF NOT pg_net_available THEN
    -- pg_net not available - log warning but don't fail
    -- Application code should call the edge function directly
    RAISE NOTICE 'pg_net extension not available. Welcome email should be triggered from application code.';
    RETURN NEW;
  END IF;

  -- Get Supabase configuration from database settings
  -- These should be set via: ALTER DATABASE postgres SET app.supabase_url = 'https://...';
  BEGIN
    supabase_url := current_setting('app.supabase_url', true);
    service_role_key := current_setting('app.supabase_service_role_key', true);
  EXCEPTION
    WHEN OTHERS THEN
      -- Settings not configured
      supabase_url := NULL;
      service_role_key := NULL;
  END;
  
  -- Validate Supabase URL
  IF supabase_url IS NULL OR supabase_url = '' THEN
    RAISE WARNING 'Supabase URL not configured (app.supabase_url). Welcome email trigger will not work.';
    RAISE WARNING 'Configure via: ALTER DATABASE postgres SET app.supabase_url = ''https://your-project.supabase.co'';';
    RETURN NEW;
  END IF;

  -- Validate service role key (optional but recommended)
  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE WARNING 'Service role key not configured (app.supabase_service_role_key). Edge function call may fail.';
  END IF;

  -- Construct edge function URL
  edge_function_url := rtrim(supabase_url, '/') || '/functions/v1/send-welcome-email';

  -- Log the trigger execution
  RAISE NOTICE 'Triggering welcome email for user_id: % (profile_id: %)', NEW.user_id, NEW.id;

  -- Call the edge function via HTTP (async using pg_net)
  BEGIN
    SELECT net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
      )::jsonb,
      body := jsonb_build_object(
        'user_id', NEW.user_id::text,
        'profile_id', NEW.id::text
      )::jsonb
    ) INTO request_id;

    RAISE NOTICE 'Welcome email request queued successfully (pg_net request_id: %)', request_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- pg_net request failed
      -- Log the failure but don't block the profile creation
      RAISE WARNING 'Failed to queue welcome email for user_id: %. Error: %', 
        NEW.user_id, SQLERRM;
      
      -- Try to log the failure in email_logs table
      BEGIN
        INSERT INTO public.email_logs (
          user_id,
          email_address,
          email_type,
          subject,
          status,
          error_message
        ) VALUES (
          NEW.user_id,
          'unknown@example.com',
          'welcome',
          'Welcome to Virtual Pet!',
          'failed',
          'Trigger error (pg_net failed): ' || SQLERRM
        );
      EXCEPTION
        WHEN OTHERS THEN
          -- If logging fails, just continue
          RAISE WARNING 'Failed to log email error: %', SQLERRM;
      END;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function after profile insert
DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;
CREATE TRIGGER trg_send_welcome_email
AFTER INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.user_id IS NOT NULL)
EXECUTE FUNCTION public.send_welcome_email_trigger();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.send_welcome_email_trigger() TO service_role;

COMMIT;

