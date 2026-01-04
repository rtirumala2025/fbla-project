-- 026_move_pg_net_extension.sql
-- Description:
--   Moves pg_net extension from 'public' to 'extensions' schema.
--   Fixes the error: "schema net is not a member of extension pg_net"
--   by ensuring the target schema is clean and the extension is created correctly.

BEGIN;

-- 1. Drop dependent objects
DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;
DROP FUNCTION IF EXISTS public.send_welcome_email_trigger();

-- 2. Clean up pg_net from public
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- 3. Prepare 'extensions' schema (Standard Supabase schema for extensions)
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 4. Install pg_net into 'extensions' schema
-- We use CASCADE to be safe, though not strictly needed here.
CREATE EXTENSION pg_net SCHEMA extensions;

-- 5. Restore dependent objects with updated schema reference
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
  SELECT EXISTS(
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) INTO pg_net_available;

  IF NOT pg_net_available THEN
    RAISE NOTICE 'pg_net extension not available.';
    RETURN NEW;
  END IF;

  -- Get Supabase configuration from database settings
  BEGIN
    supabase_url := current_setting('app.supabase_url', true);
    service_role_key := current_setting('app.supabase_service_role_key', true);
  EXCEPTION
    WHEN OTHERS THEN
      supabase_url := NULL;
      service_role_key := NULL;
  END;
  
  IF supabase_url IS NULL OR supabase_url = '' THEN
    RETURN NEW;
  END IF;

  -- Construct edge function URL
  edge_function_url := rtrim(supabase_url, '/') || '/functions/v1/send-welcome-email';

  -- Call the edge function via HTTP (async using pg_net)
  -- Note: Now calling via the 'extensions' schema
  BEGIN
    SELECT extensions.http_post(
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
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to queue welcome email: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- Re-create trigger
CREATE TRIGGER trg_send_welcome_email
AFTER INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.user_id IS NOT NULL)
EXECUTE FUNCTION public.send_welcome_email_trigger();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.send_welcome_email_trigger() TO service_role;

COMMIT;
