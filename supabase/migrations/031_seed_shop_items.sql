-- 031_seed_shop_items.sql
-- Description:
--   Seed data for shop items catalog - provides initial items for the Gift Shop

BEGIN;

-- Clear existing items (if any) to avoid duplicates on re-run
DELETE FROM finance_shop_items WHERE sku LIKE 'seed-%';

-- Insert shop items
INSERT INTO finance_shop_items (sku, name, description, category, price, stock, emoji, is_active, metadata) VALUES
  -- Food items
  ('seed-food-premium', 'Premium Dog Food', 'High-quality nutrition for your pet', 'food', 50, 999, '🍖', true, '{"effect": {"hunger": 25, "health": 5}}'),
  ('seed-food-treats', 'Treat Bag', 'Delicious training snacks', 'food', 30, 999, '🍪', true, '{"effect": {"hunger": 15, "happiness": 10}}'),
  ('seed-food-bones', 'Bone Pack', 'Crunchy dental treats', 'food', 25, 999, '🦴', true, '{"effect": {"hunger": 10, "health": 5}}'),
  ('seed-food-gourmet', 'Gourmet Meal', 'Five-star dining for discerning pets', 'food', 100, 999, '🥩', true, '{"effect": {"hunger": 50, "happiness": 20, "health": 10}}'),
  
  -- Toys
  ('seed-toy-squeaky', 'Squeaky Toy', 'Hours of fun playtime', 'toy', 25, 999, '🧸', true, '{"effect": {"happiness": 20}}'),
  ('seed-toy-ball', 'Ball Launcher', 'Automatic fetch fun', 'toy', 150, 999, '🎾', true, '{"effect": {"happiness": 35, "energy": -10}}'),
  ('seed-toy-frisbee', 'Flying Disc', 'For outdoor adventures', 'toy', 35, 999, '🥏', true, '{"effect": {"happiness": 25, "energy": -5}}'),
  ('seed-toy-rope', 'Tug Rope', 'Durable rope for tug-of-war', 'toy', 20, 999, '🪢', true, '{"effect": {"happiness": 15}}'),
  
  -- Furniture
  ('seed-furn-bed', 'Cozy Bed', 'Comfortable sleeping spot', 'furniture', 100, 999, '🛏️', true, '{"effect": {"energy": 10}}'),
  ('seed-furn-fountain', 'Water Fountain', 'Fresh water always', 'furniture', 80, 999, '💧', true, '{"effect": {"health": 5}}'),
  ('seed-furn-house', 'Dog House', 'A place to call home', 'furniture', 200, 999, '🏠', true, '{"effect": {"happiness": 15, "energy": 5}}'),
  ('seed-furn-scratching', 'Scratching Post', 'Perfect for cats', 'furniture', 75, 999, '🐱', true, '{"effect": {"happiness": 20}}'),
  
  -- Accessories
  ('seed-acc-collar', 'Fancy Collar', 'Stylish accessory', 'accessories', 75, 999, '📿', true, '{"equippable": true}'),
  ('seed-acc-bandana', 'Cool Bandana', 'Fashionable neckwear', 'accessories', 40, 999, '🧣', true, '{"equippable": true}'),
  ('seed-acc-bowtie', 'Dapper Bowtie', 'For formal occasions', 'accessories', 50, 999, '🎀', true, '{"equippable": true}'),
  ('seed-acc-sunglasses', 'Pet Sunglasses', 'Cool shades for cool pets', 'accessories', 60, 999, '🕶️', true, '{"equippable": true}'),
  
  -- Care/Medicine
  ('seed-care-grooming', 'Grooming Kit', 'Keep your pet clean and healthy', 'care', 45, 999, '✨', true, '{"effect": {"hygiene": 30, "happiness": 5}}'),
  ('seed-care-vitamins', 'Pet Vitamins', 'Daily health supplement', 'medicine', 60, 999, '💊', true, '{"effect": {"health": 25}}'),
  ('seed-care-energy', 'Energy Boost', 'Quick energy restoration', 'energy', 35, 999, '⚡', true, '{"effect": {"energy": 40}}'),
  ('seed-care-shampoo', 'Premium Shampoo', 'Luxurious bath time', 'care', 30, 999, '🧴', true, '{"effect": {"hygiene": 25, "health": 5}}');

COMMIT;
