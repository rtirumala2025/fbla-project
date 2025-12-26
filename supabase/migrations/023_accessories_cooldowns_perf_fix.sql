BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_accessories'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_accessories_pet_equipped
      ON public.user_accessories(pet_id, equipped)
      WHERE equipped = true;

    ANALYZE public.user_accessories;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_cooldowns'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_cooldowns_user_id
      ON public.user_cooldowns(user_id);

    ANALYZE public.user_cooldowns;
  END IF;
END $$;

COMMIT;
