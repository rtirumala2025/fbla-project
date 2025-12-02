-- 012_quest_seed_data.sql
-- Description:
--   Seed data for quest catalog - daily and weekly quest definitions
--   These quests are automatically available to all users

BEGIN;

-- Daily Quests
INSERT INTO public.quests (quest_key, description, quest_type, difficulty, rewards, target_value, icon)
VALUES
  -- Easy daily quests
  (
    'daily_feed_pet',
    'Feed your pet a meal',
    'daily',
    'easy',
    '{"coins": 25, "xp": 15, "items": []}'::jsonb,
    1,
    '🍽️'
  ),
  (
    'daily_play_pet',
    'Play with your pet',
    'daily',
    'easy',
    '{"coins": 25, "xp": 15, "items": []}'::jsonb,
    1,
    '🎾'
  ),
  (
    'daily_bathe_pet',
    'Give your pet a bath',
    'daily',
    'easy',
    '{"coins": 20, "xp": 10, "items": []}'::jsonb,
    1,
    '🧼'
  ),
  (
    'daily_check_stats',
    'Check your pet''s stats',
    'daily',
    'easy',
    '{"coins": 10, "xp": 5, "items": []}'::jsonb,
    1,
    '📊'
  ),
  
  -- Normal daily quests
  (
    'daily_feed_three',
    'Feed your pet 3 times',
    'daily',
    'normal',
    '{"coins": 75, "xp": 45, "items": []}'::jsonb,
    3,
    '🍖'
  ),
  (
    'daily_play_five',
    'Play with your pet 5 times',
    'daily',
    'normal',
    '{"coins": 100, "xp": 60, "items": []}'::jsonb,
    5,
    '⚽'
  ),
  (
    'daily_care_complete',
    'Complete all pet care actions (feed, play, bathe)',
    'daily',
    'normal',
    '{"coins": 120, "xp": 75, "items": []}'::jsonb,
    3,
    '⭐'
  ),
  
  -- Hard daily quests
  (
    'daily_perfect_stats',
    'Get all pet stats above 80',
    'daily',
    'hard',
    '{"coins": 200, "xp": 150, "items": ["premium_food"]}'::jsonb,
    5,
    '💎'
  ),
  (
    'daily_level_up',
    'Level up your pet',
    'daily',
    'hard',
    '{"coins": 250, "xp": 200, "items": []}'::jsonb,
    1,
    '⬆️'
  ),
  
  -- Weekly Quests
  (
    'weekly_feeding_master',
    'Feed your pet 20 times this week',
    'weekly',
    'easy',
    '{"coins": 150, "xp": 100, "items": []}'::jsonb,
    20,
    '🥘'
  ),
  (
    'weekly_playtime_champion',
    'Play with your pet 30 times this week',
    'weekly',
    'easy',
    '{"coins": 200, "xp": 150, "items": []}'::jsonb,
    30,
    '🏆'
  ),
  (
    'weekly_caregiver',
    'Complete 50 pet care actions this week',
    'weekly',
    'normal',
    '{"coins": 300, "xp": 250, "items": ["toy_bundle"]}'::jsonb,
    50,
    '👑'
  ),
  (
    'weekly_level_climber',
    'Level up your pet 3 times this week',
    'weekly',
    'hard',
    '{"coins": 500, "xp": 400, "items": ["epic_food", "premium_toy"]}'::jsonb,
    3,
    '🚀'
  ),
  (
    'weekly_perfectionist',
    'Maintain all stats above 75 for 7 days',
    'weekly',
    'heroic',
    '{"coins": 750, "xp": 600, "items": ["legendary_collar", "golden_treat"]}'::jsonb,
    7,
    '✨'
  )
ON CONFLICT (quest_key) DO NOTHING;

COMMIT;
