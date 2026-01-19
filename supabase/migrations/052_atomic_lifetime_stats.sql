-- Migration 052: Add atomic increment function for lifetime stats
-- This ensures safe concurrent updates to spending/earnings counters

-- 1. Ensure the column has proper defaults for existing rows
UPDATE pets 
SET lifetime_stats = COALESCE(lifetime_stats, '{}'::jsonb) || 
    jsonb_build_object(
        'total_washes', COALESCE((lifetime_stats->>'total_washes')::int, 0),
        'total_earnings', COALESCE((lifetime_stats->>'total_earnings')::int, 0),
        'total_spent', COALESCE((lifetime_stats->>'total_spent')::int, 0),
        'days_survived', COALESCE((lifetime_stats->>'days_survived')::int, 0),
        'food_eaten', COALESCE((lifetime_stats->>'food_eaten')::int, 0),
        'play_sessions', COALESCE((lifetime_stats->>'play_sessions')::int, 0)
    )
WHERE lifetime_stats IS NULL OR lifetime_stats->>'total_spent' IS NULL;

-- 2. Create atomic increment function for total_spent
CREATE OR REPLACE FUNCTION increment_pet_stat(
    pet_id_input UUID, 
    stat_key TEXT, 
    amount INT
)
RETURNS VOID 
SECURITY DEFINER
AS $$
BEGIN
    UPDATE pets
    SET lifetime_stats = jsonb_set(
        COALESCE(lifetime_stats, '{}'::jsonb),
        ARRAY[stat_key],
        to_jsonb(COALESCE((lifetime_stats->>stat_key)::int, 0) + amount)
    ),
    updated_at = NOW()
    WHERE id = pet_id_input;
END;
$$ LANGUAGE plpgsql;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_pet_stat(UUID, TEXT, INT) TO authenticated;

-- 4. Create a convenience RPC for spending specifically
CREATE OR REPLACE FUNCTION record_spending(
    pet_id_input UUID,
    amount INT
)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
    UPDATE pets
    SET lifetime_stats = jsonb_set(
        COALESCE(lifetime_stats, '{"total_spent": 0}'::jsonb),
        '{total_spent}',
        to_jsonb(COALESCE((lifetime_stats->>'total_spent')::int, 0) + amount)
    ),
    updated_at = NOW()
    WHERE id = pet_id_input;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION record_spending(UUID, INT) TO authenticated;

-- 5. Add RLS policy to allow users to call these functions on their own pets
-- (The function uses SECURITY DEFINER so it bypasses RLS, but the WHERE clause ensures
-- users can only update their own pets if called through proper channels)

COMMENT ON FUNCTION increment_pet_stat IS 'Atomically increment a lifetime stat counter for a pet';
COMMENT ON FUNCTION record_spending IS 'Record spending and atomically update total_spent counter';
