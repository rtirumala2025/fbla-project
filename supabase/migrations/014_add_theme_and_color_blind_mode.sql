-- 014_add_theme_and_color_blind_mode.sql
-- Description:
--   Add theme and color_blind_mode columns to user_preferences table
--   to support theme toggle and color-blind accessibility mode persistence

BEGIN;

-- Add theme column (light or dark)
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark'));

-- Add color_blind_mode column
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS color_blind_mode BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing rows to have default theme
UPDATE public.user_preferences
SET theme = 'light'
WHERE theme IS NULL;

-- Make theme NOT NULL after setting defaults
ALTER TABLE public.user_preferences
ALTER COLUMN theme SET NOT NULL;

COMMIT;

