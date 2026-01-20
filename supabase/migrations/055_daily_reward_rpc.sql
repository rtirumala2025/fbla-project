-- Create a robust function to handle daily rewards atomically
CREATE OR REPLACE FUNCTION claim_daily_reward(user_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_claim TIMESTAMPTZ;
  reward_amount INT := 50; -- Set to $50
BEGIN
  -- 1. Get last claim time
  SELECT last_daily_claim INTO last_claim FROM pet_gamestate WHERE user_id = user_id_input;
  
  -- 2. Check if 24 hours have passed
  IF last_claim IS NOT NULL AND last_claim > NOW() - INTERVAL '24 hours' THEN
    RETURN FALSE; -- Too soon
  END IF;

  -- 3. Update Game State (Timestamp & Lifetime Stats)
  UPDATE pet_gamestate 
  SET 
    -- Update timestamp
    last_daily_claim = NOW(),
    -- Increment total_earned in lifetime_stats JSONB
    lifetime_stats = jsonb_set(
      lifetime_stats, 
      '{total_earnings}', 
      (COALESCE((lifetime_stats->>'total_earnings')::int, 0) + reward_amount)::text::jsonb
    )
  WHERE user_id = user_id_input;

  -- 4. Update Finance Wallet (The actual money)
  UPDATE finance_wallets
  SET balance = balance + reward_amount
  WHERE user_id = user_id_input;

  RETURN TRUE; -- Success
END;
$$ LANGUAGE plpgsql;
