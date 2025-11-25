-- 000_core_schema.sql
-- Description:
--   Bootstrap PostgreSQL extensions, shared helper functions, and core user table wiring.
--   Ensures Supabase Auth (auth.users) stays synchronised with application-facing users table.

BEGIN;

-- Ensure UUID generation support is available.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to keep updated_at columns current.
CREATE OR REPLACE FUNCTION public.set_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  IF NEW.created_at IS NULL THEN
    NEW.created_at := timezone('utc', now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application users table (extends Supabase auth.users with app-specific columns).
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Keep timestamps in sync.
DROP TRIGGER IF EXISTS trg_users_timestamps ON public.users;
CREATE TRIGGER trg_users_timestamps
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

-- Link application users to Supabase auth.users whenever possible.
CREATE OR REPLACE FUNCTION public.ensure_auth_link()
RETURNS TRIGGER AS $$
DECLARE
  matched_id UUID;
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    SELECT id INTO matched_id FROM auth.users WHERE id = NEW.id;
    IF matched_id IS NULL THEN
      SELECT id INTO matched_id FROM auth.users WHERE lower(email) = lower(NEW.email) LIMIT 1;
    END IF;
    IF matched_id IS NOT NULL THEN
      NEW.auth_user_id := matched_id;
      NEW.id := matched_id;
    END IF;
  END IF;
  IF NEW.auth_user_id IS NULL THEN
    NEW.auth_user_id := NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_auth_link ON public.users;
CREATE TRIGGER trg_users_auth_link
BEFORE INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.ensure_auth_link();

-- Foreign key to Supabase auth (deferrable to allow transaction ordering).
-- Use DO block to check if constraint exists before adding it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_users_auth_user' 
    AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_auth_user
      FOREIGN KEY (auth_user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- Keep application table in sync when Supabase auth.users changes.
CREATE OR REPLACE FUNCTION public.sync_from_auth_users()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, auth_user_id, email, password_hash, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.encrypted_password::text, COALESCE(NEW.raw_user_meta_data->>'password_hash', NEW.email)),
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        email = EXCLUDED.email,
        password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash),
        updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auth_users_sync ON auth.users;
CREATE TRIGGER trg_auth_users_sync
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_from_auth_users();

-- Table grants (no direct RLS; restrict standard roles to service role).
REVOKE ALL ON public.users FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;
GRANT SELECT ON public.users TO authenticated;

COMMIT;


