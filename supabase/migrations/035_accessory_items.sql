-- 035_accessory_items.sql
-- Description:
--   Seed data for pet accessories that can be equipped on the 3D pet model

BEGIN;

-- Clear existing accessory items to avoid duplicates
DELETE FROM finance_shop_items WHERE sku LIKE 'acc-%';

-- Insert accessory items with equippable metadata and slot info
INSERT INTO finance_shop_items (sku, name, description, category, price, stock, emoji, is_active, metadata) VALUES
  -- Collars
  ('acc-collar-basic', 'Classic Collar', 'A simple but elegant collar', 'accessories', 50, 999, '📿', true, 
   '{"equippable": true, "slot": "collar", "color": "#6366f1"}'),
  ('acc-collar-fancy', 'Fancy Collar', 'Stylish leather with studs', 'accessories', 100, 999, '📿', true, 
   '{"equippable": true, "slot": "collar", "color": "#f59e0b", "rarity": "uncommon"}'),
  ('acc-collar-gold', 'Golden Collar', 'Luxurious gold-plated collar', 'accessories', 250, 50, '📿', true, 
   '{"equippable": true, "slot": "collar", "color": "#fbbf24", "rarity": "rare"}'),
  
  -- Bandanas
  ('acc-bandana-red', 'Red Bandana', 'Classic red cowboy style', 'accessories', 40, 999, '🧣', true, 
   '{"equippable": true, "slot": "bandana", "color": "#ef4444"}'),
  ('acc-bandana-blue', 'Blue Bandana', 'Cool ocean blue bandana', 'accessories', 40, 999, '🧣', true, 
   '{"equippable": true, "slot": "bandana", "color": "#3b82f6"}'),
  ('acc-bandana-rainbow', 'Rainbow Bandana', 'Colorful pride bandana', 'accessories', 75, 999, '🧣', true, 
   '{"equippable": true, "slot": "bandana", "color": "#ec4899", "rarity": "uncommon"}'),
  
  -- Hats & Headwear
  ('acc-hat-crown', 'Royal Crown', 'For the pet royalty', 'accessories', 200, 30, '👑', true, 
   '{"equippable": true, "slot": "hat", "color": "#fbbf24", "rarity": "rare"}'),
  ('acc-hat-party', 'Party Hat', 'Perfect for celebrations', 'accessories', 35, 999, '🎉', true, 
   '{"equippable": true, "slot": "hat", "color": "#8b5cf6"}'),
  ('acc-hat-top', 'Top Hat', 'Gentleman style', 'accessories', 120, 99, '🎩', true, 
   '{"equippable": true, "slot": "hat", "color": "#1f2937", "rarity": "uncommon"}'),
  ('acc-hat-witch', 'Witch Hat', 'Spooky season special', 'accessories', 80, 99, '🧙', true, 
   '{"equippable": true, "slot": "hat", "color": "#7c3aed"}'),
  
  -- Eyewear
  ('acc-glasses-sun', 'Sunglasses', 'Cool shades for cool pets', 'accessories', 60, 999, '🕶️', true, 
   '{"equippable": true, "slot": "glasses", "color": "#1f2937"}'),
  ('acc-glasses-heart', 'Heart Glasses', 'Lovely heart-shaped frames', 'accessories', 55, 999, '💖', true, 
   '{"equippable": true, "slot": "glasses", "color": "#ec4899"}'),
  ('acc-glasses-nerd', 'Nerd Glasses', 'Big brain energy', 'accessories', 45, 999, '🤓', true, 
   '{"equippable": true, "slot": "glasses", "color": "#1f2937"}'),
  
  -- Bowties & Neckwear
  ('acc-bowtie-red', 'Red Bowtie', 'Dapper and elegant', 'accessories', 55, 999, '🎀', true, 
   '{"equippable": true, "slot": "collar", "color": "#ef4444"}'),
  ('acc-bowtie-black', 'Black Bowtie', 'For formal occasions', 'accessories', 65, 999, '🎀', true, 
   '{"equippable": true, "slot": "collar", "color": "#1f2937", "rarity": "uncommon"}'),
  
  -- Special/Rare Items
  ('acc-wings-angel', 'Angel Wings', 'Heavenly accessory', 'accessories', 300, 20, '👼', true, 
   '{"equippable": true, "slot": "back", "color": "#ffffff", "rarity": "legendary"}'),
  ('acc-cape-hero', 'Hero Cape', 'For super pets', 'accessories', 150, 50, '🦸', true, 
   '{"equippable": true, "slot": "back", "color": "#ef4444", "rarity": "rare"}')

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  metadata = EXCLUDED.metadata;

COMMIT;
