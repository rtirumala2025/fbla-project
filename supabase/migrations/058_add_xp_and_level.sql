-- Migration: Add XP and Level columns to pets table
-- Required by PetService (backend) for AI and progression features

ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN public.pets.xp IS 'Current experience points';
COMMENT ON COLUMN public.pets.level IS 'Current pet level (derived from XP)';
