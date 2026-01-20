-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS pet_gamestate (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_daily_claim TIMESTAMPTZ DEFAULT '2000-01-01 00:00:00Z',
    one_time_events JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{"music": true, "sfx": true}'::jsonb
);

-- Enable RLS
ALTER TABLE pet_gamestate ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own gamestate" ON pet_gamestate
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamestate" ON pet_gamestate
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamestate" ON pet_gamestate
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add columns if they missed (for robustness)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pet_gamestate' AND column_name = 'last_daily_claim') THEN
        ALTER TABLE pet_gamestate ADD COLUMN last_daily_claim TIMESTAMPTZ DEFAULT '2000-01-01 00:00:00Z';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pet_gamestate' AND column_name = 'one_time_events') THEN
        ALTER TABLE pet_gamestate ADD COLUMN one_time_events JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pet_gamestate' AND column_name = 'settings') THEN
        ALTER TABLE pet_gamestate ADD COLUMN settings JSONB DEFAULT '{"music": true, "sfx": true}'::jsonb;
    END IF;
END $$;
