-- Add last_nap_timestamp to pet_gamestate if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pet_gamestate' AND column_name = 'last_nap_timestamp') THEN
        ALTER TABLE pet_gamestate ADD COLUMN last_nap_timestamp TIMESTAMPTZ DEFAULT '2000-01-01 00:00:00Z';
    END IF;
END $$;
