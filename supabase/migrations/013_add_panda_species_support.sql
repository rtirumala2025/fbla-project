-- 013_add_panda_species_support.sql
-- Description:
--   Add support for 'panda' species by updating the CHECK constraint on pets.species
--   This migration drops the existing constraint and recreates it with panda included

BEGIN;

-- Drop existing constraint if it exists
ALTER TABLE IF EXISTS public.pets
  DROP CONSTRAINT IF EXISTS pets_species_check;

-- Recreate the constraint with panda support
-- Allowed species: dog, cat, bird, rabbit, fox, dragon, panda
ALTER TABLE public.pets
  ADD CONSTRAINT pets_species_check
  CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'fox', 'dragon', 'panda'));

COMMIT;

