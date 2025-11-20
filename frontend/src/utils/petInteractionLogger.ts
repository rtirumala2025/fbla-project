/**
 * Pet Interaction Logger
 * Logs pet interactions to Supabase for analytics and debugging
 */
import { supabase } from '../lib/supabase';

export interface PetInteractionLog {
  user_id: string;
  pet_id: string;
  action_type: 'feed' | 'play' | 'bathe' | 'rest' | 'earn' | 'quest_complete' | 'accessory_equip';
  action_details?: Record<string, any>;
  stat_changes?: {
    health?: number;
    hunger?: number;
    happiness?: number;
    cleanliness?: number;
    energy?: number;
  };
  coins_earned?: number;
  coins_spent?: number;
  xp_gained?: number;
  timestamp?: string;
}

/**
 * Log a pet interaction to Supabase
 */
export async function logPetInteraction(log: PetInteractionLog): Promise<void> {
  try {
    const { error } = await supabase
      .from('pet_interactions')
      .insert({
        user_id: log.user_id,
        pet_id: log.pet_id,
        action_type: log.action_type,
        action_details: log.action_details || {},
        stat_changes: log.stat_changes || {},
        coins_earned: log.coins_earned || 0,
        coins_spent: log.coins_spent || 0,
        xp_gained: log.xp_gained || 0,
        timestamp: log.timestamp || new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log pet interaction:', error);
      // Don't throw - logging failures shouldn't break the app
    } else {
      console.log('✅ Logged pet interaction:', log.action_type);
    }
  } catch (err) {
    console.error('Error logging pet interaction:', err);
    // Silently fail - logging is non-critical
  }
}

/**
 * Log user action (for general user interactions)
 */
export async function logUserAction(
  userId: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    // Try to log to a user_actions table if it exists
    const { error } = await supabase
      .from('user_actions')
      .insert({
        user_id: userId,
        action,
        details: details || {},
        timestamp: new Date().toISOString(),
      });

    if (error) {
      // Table might not exist, fallback to console
      console.log('User action:', { userId, action, details });
    }
  } catch (err) {
    // Silently fail
    console.log('User action:', { userId, action, details });
  }
}

