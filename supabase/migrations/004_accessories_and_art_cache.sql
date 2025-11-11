-- 004_accessories_and_art_cache.sql
-- Description:
--   Accessory catalog, user equipment state, and pet art cache tables with policies.

BEGIN;

CREATE TABLE IF NOT EXISTS public.accessories (
  accessory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  effects JSONB NOT NULL DEFAULT '{}'::jsonb,
  color_palette JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_accessories_timestamps ON public.accessories;
CREATE TRIGGER trg_accessories_timestamps
BEFORE INSERT OR UPDATE ON public.accessories
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_accessories_type ON public.accessories(type);
CREATE INDEX IF NOT EXISTS idx_accessories_rarity ON public.accessories(rarity);

CREATE TABLE IF NOT EXISTS public.user_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES public.accessories(accessory_id) ON DELETE CASCADE,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  equipped_color TEXT,
  equipped_slot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, pet_id, accessory_id)
);

DROP TRIGGER IF EXISTS trg_user_accessories_timestamps ON public.user_accessories;
CREATE TRIGGER trg_user_accessories_timestamps
BEFORE INSERT OR UPDATE ON public.user_accessories
FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

CREATE INDEX IF NOT EXISTS idx_user_accessories_user_id ON public.user_accessories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accessories_pet_id ON public.user_accessories(pet_id);
CREATE INDEX IF NOT EXISTS idx_user_accessories_accessory_id ON public.user_accessories(accessory_id);

CREATE TABLE IF NOT EXISTS public.pet_art_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  prompt_hash TEXT NOT NULL,
  prompt TEXT NOT NULL,
  style TEXT,
  mood TEXT,
  accessory_ids UUID[] NOT NULL DEFAULT '{}',
  image_base64 TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (user_id, pet_id, prompt_hash)
);

CREATE INDEX IF NOT EXISTS idx_pet_art_cache_user_id ON public.pet_art_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_art_cache_pet_id ON public.pet_art_cache(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_art_cache_expires_at ON public.pet_art_cache(expires_at);

ALTER TABLE public.user_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_art_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_accessories_select_own ON public.user_accessories;
CREATE POLICY user_accessories_select_own
ON public.user_accessories
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_accessories_modify_own ON public.user_accessories;
CREATE POLICY user_accessories_modify_own
ON public.user_accessories
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pet_art_cache_select_own ON public.pet_art_cache;
CREATE POLICY pet_art_cache_select_own
ON public.pet_art_cache
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pet_art_cache_upsert_own ON public.pet_art_cache;
CREATE POLICY pet_art_cache_upsert_own
ON public.pet_art_cache
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pet_art_cache_update_own ON public.pet_art_cache;
CREATE POLICY pet_art_cache_update_own
ON public.pet_art_cache
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pet_art_cache_delete_own ON public.pet_art_cache;
CREATE POLICY pet_art_cache_delete_own
ON public.pet_art_cache
FOR DELETE
USING (auth.uid() = user_id);

-- Grants.
GRANT SELECT ON public.accessories TO authenticated;
GRANT ALL ON public.accessories TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_accessories TO authenticated;
GRANT ALL ON public.user_accessories TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_art_cache TO authenticated;
GRANT ALL ON public.pet_art_cache TO service_role;

COMMIT;


