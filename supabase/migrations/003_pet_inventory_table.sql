-- Migration: Pet Inventory Table
-- Description: Tracks purchased items for each pet
-- Apply: Run this SQL in Supabase SQL Editor after pets table is created

-- Create pet_inventory table
CREATE TABLE IF NOT EXISTS public.pet_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pet_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.pet_inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.pet_inventory;
DROP POLICY IF EXISTS "Users can select own inventory" ON public.pet_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.pet_inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.pet_inventory;

-- RLS Policy: Users can insert their own inventory
CREATE POLICY "Users can insert own inventory"
ON public.pet_inventory
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can select their own inventory
CREATE POLICY "Users can select own inventory"
ON public.pet_inventory
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own inventory
CREATE POLICY "Users can update own inventory"
ON public.pet_inventory
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own inventory
CREATE POLICY "Users can delete own inventory"
ON public.pet_inventory
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pet_inventory_user_id ON public.pet_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_inventory_pet_id ON public.pet_inventory(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_inventory_item_id ON public.pet_inventory(item_id);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_pet_inventory_updated_at ON public.pet_inventory;
CREATE TRIGGER update_pet_inventory_updated_at
BEFORE UPDATE ON public.pet_inventory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant access
GRANT ALL ON public.pet_inventory TO authenticated;
GRANT ALL ON public.pet_inventory TO service_role;

