-- Migration: Complete Pets Table
-- Description: Ensures pets table exists with all required columns and RLS
-- Apply: Run this SQL in Supabase SQL Editor or via `supabase db push`

-- Create pets table (if not exists, or add missing columns)
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  health INTEGER DEFAULT 100 CHECK (health >= 0 AND health <= 100),
  hunger INTEGER DEFAULT 75 CHECK (hunger >= 0 AND hunger <= 100),
  happiness INTEGER DEFAULT 80 CHECK (happiness >= 0 AND happiness <= 100),
  cleanliness INTEGER DEFAULT 90 CHECK (cleanliness >= 0 AND cleanliness <= 100),
  energy INTEGER DEFAULT 85 CHECK (energy >= 0 AND energy <= 100),
  xp INTEGER DEFAULT 0,
  last_fed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)  -- One pet per user
);

-- Enable Row Level Security
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can insert own pet" ON public.pets;
DROP POLICY IF EXISTS "Users can select own pet" ON public.pets;
DROP POLICY IF EXISTS "Users can update own pet" ON public.pets;
DROP POLICY IF EXISTS "Users can delete own pet" ON public.pets;

-- RLS Policy: Users can insert their own pet
CREATE POLICY "Users can insert own pet"
ON public.pets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can select their own pet
CREATE POLICY "Users can select own pet"
ON public.pets
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own pet
CREATE POLICY "Users can update own pet"
ON public.pets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own pet
CREATE POLICY "Users can delete own pet"
ON public.pets
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON public.pets(user_id);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_pets_updated_at ON public.pets;
CREATE TRIGGER update_pets_updated_at
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant access
GRANT ALL ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

