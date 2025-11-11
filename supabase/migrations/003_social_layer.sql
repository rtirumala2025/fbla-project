-- 003_social_layer.sql
-- Description:
--   Establish social graph tables for friendships and public profile showcases.
--   Includes rich metadata, indexes, and comprehensive row-level security policies.

BEGIN;

CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_friend_pair UNIQUE (user_id, friend_id),
  CONSTRAINT chk_friend_self CHECK (user_id <> friend_id)
);

DROP TRIGGER IF EXISTS trg_friends_timestamps ON public.friends;
CREATE TRIGGER trg_friends_timestamps
BEFORE INSERT OR UPDATE ON public.friends
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);

CREATE TABLE IF NOT EXISTS public.public_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL UNIQUE REFERENCES public.pets(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_xp INTEGER NOT NULL DEFAULT 0,
  total_coins INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_public_profiles_timestamps ON public.public_profiles;
CREATE TRIGGER trg_public_profiles_timestamps
BEFORE INSERT OR UPDATE ON public.public_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_public_profiles_user_id ON public.public_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_public_profiles_visibility ON public.public_profiles(is_visible);
CREATE INDEX IF NOT EXISTS idx_public_profiles_total_xp ON public.public_profiles(total_xp DESC);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Friendship policies.
DROP POLICY IF EXISTS friends_select_related ON public.friends;
CREATE POLICY friends_select_related
ON public.friends
FOR SELECT
USING (auth.uid() IN (user_id, friend_id));

DROP POLICY IF EXISTS friends_insert_self ON public.friends;
CREATE POLICY friends_insert_self
ON public.friends
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS friends_update_participants ON public.friends;
CREATE POLICY friends_update_participants
ON public.friends
FOR UPDATE
USING (auth.uid() IN (user_id, friend_id))
WITH CHECK (auth.uid() IN (user_id, friend_id));

DROP POLICY IF EXISTS friends_delete_participants ON public.friends;
CREATE POLICY friends_delete_participants
ON public.friends
FOR DELETE
USING (auth.uid() IN (user_id, friend_id));

-- Public profile policies.
DROP POLICY IF EXISTS public_profiles_select_visible ON public.public_profiles;
CREATE POLICY public_profiles_select_visible
ON public.public_profiles
FOR SELECT
USING (is_visible OR auth.uid() = user_id);

DROP POLICY IF EXISTS public_profiles_insert_self ON public.public_profiles;
CREATE POLICY public_profiles_insert_self
ON public.public_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS public_profiles_update_self ON public.public_profiles;
CREATE POLICY public_profiles_update_self
ON public.public_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS public_profiles_delete_self ON public.public_profiles;
CREATE POLICY public_profiles_delete_self
ON public.public_profiles
FOR DELETE
USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friends TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_profiles TO authenticated;
GRANT ALL ON public.friends TO service_role;
GRANT ALL ON public.public_profiles TO service_role;

COMMIT;


