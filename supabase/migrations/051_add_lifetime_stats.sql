-- Migration: Add lifetime_stats for cumulative achievement tracking
-- Run this in Supabase SQL Editor

-- Add lifetime_stats column to track cumulative progress
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS lifetime_stats JSONB DEFAULT '{
    "total_washes": 0,
    "total_earnings": 0,
    "total_spent": 0,
    "days_survived": 0,
    "food_eaten": 0,
    "play_sessions": 0
}'::jsonb;

-- Create index for faster queries on lifetime_stats
CREATE INDEX IF NOT EXISTS idx_pets_lifetime_stats ON pets USING GIN (lifetime_stats);

-- Comment for documentation
COMMENT ON COLUMN pets.lifetime_stats IS 'Cumulative lifetime stats for achievement tracking (JSONB)';
