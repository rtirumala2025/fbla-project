-- Migration: Add progression tracking columns for Game Loop
-- Run this in Supabase SQL Editor

-- Add columns for progression tracking to pets table
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS high_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_days_alive INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_game_over BOOLEAN DEFAULT FALSE;

-- Create index for faster badge lookups
CREATE INDEX IF NOT EXISTS idx_pets_badges ON pets USING GIN (badges);

-- Comment for documentation
COMMENT ON COLUMN pets.badges IS 'Array of unlocked badge IDs (JSONB)';
COMMENT ON COLUMN pets.high_score IS 'Highest days survived record';
COMMENT ON COLUMN pets.last_login IS 'Timestamp of last daily reward claim';
COMMENT ON COLUMN pets.total_days_alive IS 'Cumulative days alive across all games';
COMMENT ON COLUMN pets.is_game_over IS 'Whether pet is currently in game over state';
