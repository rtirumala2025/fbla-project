-- 034_expand_shop_items.sql
-- Description:
--   Expand shop catalog with more items, deals, and categories for Pet Supermarket

BEGIN;

-- Add more items to existing categories and new seasonal/health categories
INSERT INTO finance_shop_items (sku, name, description, category, price, stock, emoji, is_active, metadata) VALUES
  -- More Food items
  ('seed-food-wet', 'Wet Food Can', 'Premium meat chunks in gravy', 'food', 40, 999, '🥫', true, '{"effect": {"hunger": 30, "happiness": 10}}'),
  ('seed-food-puppy', 'Puppy Formula', 'Special nutrition for growing pups', 'food', 65, 999, '🍼', true, '{"effect": {"hunger": 30, "health": 15}}'),
  ('seed-food-salmon', 'Salmon Bites', 'Omega-rich fish treats', 'food', 55, 999, '🐟', true, '{"effect": {"hunger": 20, "health": 10, "happiness": 5}}'),
  ('seed-food-veggie', 'Veggie Mix', 'Healthy vegetable supplements', 'food', 35, 999, '🥕', true, '{"effect": {"hunger": 15, "health": 10}}'),
  
  -- More Toys
  ('seed-toy-puzzle', 'Puzzle Feeder', 'Mental stimulation toy', 'toy', 85, 999, '🧩', true, '{"effect": {"happiness": 30, "energy": -5}}'),
  ('seed-toy-plush', 'Plush Friend', 'Soft cuddly companion', 'toy', 45, 999, '🐻', true, '{"effect": {"happiness": 20}}'),
  ('seed-toy-kong', 'Chew Kong', 'Durable rubber chew toy', 'toy', 55, 999, '🔴', true, '{"effect": {"happiness": 25, "health": 5}}'),
  ('seed-toy-laser', 'Laser Pointer', 'Endless chase fun for cats', 'toy', 30, 999, '🔦', true, '{"effect": {"happiness": 35, "energy": -15}}'),
  
  -- More Furniture
  ('seed-furn-tree', 'Cat Tree Deluxe', 'Multi-level climbing paradise', 'furniture', 250, 999, '🌳', true, '{"effect": {"happiness": 25, "energy": 10}}'),
  ('seed-furn-tunnel', 'Play Tunnel', 'Collapsible adventure tunnel', 'furniture', 60, 999, '🕳️', true, '{"effect": {"happiness": 20}}'),
  ('seed-furn-feeder', 'Auto Feeder', 'Scheduled feeding station', 'furniture', 180, 999, '🤖', true, '{"effect": {"hunger": 5}}'),
  ('seed-furn-window', 'Window Perch', 'Sunny spot for watching', 'furniture', 90, 999, '🪟', true, '{"effect": {"happiness": 15, "energy": 5}}'),
  
  -- More Accessories
  ('seed-acc-harness', 'Adventure Harness', 'For outdoor explorations', 'accessories', 65, 999, '🎒', true, '{"equippable": true}'),
  ('seed-acc-raincoat', 'Rainy Day Coat', 'Waterproof protection', 'accessories', 55, 999, '🧥', true, '{"equippable": true}'),
  ('seed-acc-boots', 'Paw Booties', 'Protect those paws', 'accessories', 45, 999, '🥾', true, '{"equippable": true}'),
  ('seed-acc-crown', 'Royal Crown', 'For the pet royalty', 'accessories', 120, 999, '👑', true, '{"equippable": true, "rarity": "rare"}'),
  
  -- Health & Medicine
  ('seed-health-flea', 'Flea Treatment', 'Monthly flea prevention', 'health', 75, 999, '🛡️', true, '{"effect": {"health": 20}}'),
  ('seed-health-dental', 'Dental Chews', 'Fresh breath and clean teeth', 'health', 40, 999, '🦷', true, '{"effect": {"health": 15, "happiness": 5}}'),
  ('seed-health-joint', 'Joint Supplement', 'For aging pet mobility', 'health', 85, 999, '💪', true, '{"effect": {"health": 25}}'),
  ('seed-health-calm', 'Calming Treats', 'For anxious pets', 'health', 50, 999, '🧘', true, '{"effect": {"happiness": 20, "energy": -5}}'),
  
  -- Grooming
  ('seed-groom-brush', 'Deluxe Brush', 'Professional grooming brush', 'grooming', 35, 999, '🪮', true, '{"effect": {"cleanliness": 25}}'),
  ('seed-groom-nail', 'Nail Clippers', 'Safe nail trimming', 'grooming', 25, 999, '✂️', true, '{"effect": {"cleanliness": 10, "health": 5}}'),
  ('seed-groom-dryer', 'Pet Dryer', 'Quick drying after baths', 'grooming', 120, 999, '💨', true, '{"effect": {"cleanliness": 15}}'),
  ('seed-groom-perfume', 'Pet Cologne', 'Fresh scent spray', 'grooming', 30, 999, '🌸', true, '{"effect": {"cleanliness": 20, "happiness": 5}}'),
  
  -- Daily Deals (marked with special metadata)
  ('seed-deal-bundle1', '🔥 Starter Bundle', 'Food + Toy + Bed combo deal!', 'deals', 150, 50, '🎁', true, '{"originalPrice": 200, "effect": {"hunger": 25, "happiness": 20, "energy": 10}, "isDeal": true}'),
  ('seed-deal-treat', '⚡ Flash Sale Treats', 'Limited time 50% off!', 'deals', 15, 25, '🍖', true, '{"originalPrice": 30, "effect": {"hunger": 15, "happiness": 10}, "isDeal": true, "limitedTime": true}'),
  ('seed-deal-grooming', '✨ Spa Day Kit', 'Complete grooming set', 'deals', 80, 30, '🧖', true, '{"originalPrice": 110, "effect": {"cleanliness": 50, "happiness": 15}, "isDeal": true}')
  
ON CONFLICT (sku) DO NOTHING;

COMMIT;
