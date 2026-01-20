import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Pet, PetStats } from '@/types/pet';
import { supabase, isSupabaseMock, withTimeout, withRetry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/networkUtils';
import { DECAY_RATES, ACTIONS, clampStat, applyAction, ActionType, OFFLINE_CONFIG } from '../config/gameConfig';
import { checkNewBadges, type BadgeCheckStats } from '../config/Achievements';

/**
 * PetContext.tsx
 * 
 * The central "Brain" of the application. This context manages the entire lifecycle
 * of the digital pet, including:
 * 1. State Management: Persistence of pet stats (health, hunger, etc.) effectively.
 * 2. Game Loop: Handling stat decay over time, even when offline (simulation).
 * 3. Economy: Integration with the financial system for purchasing items and earning rewards.
 * 4. Achievements: Tracking lifetime stats to unlock badges.
 * 
 * Architecture Note:
 * This component acts as the "source of truth" and syncs aggressively with 
 * Supabase to prevent cheating, but maintains optimistic local updates for 
 * a snappy user experience.
 */

/**
 * Interface defining the shape of the PetContext.
 * @interface PetContextType
 */
interface PetContextType {
  /** The current active pet object, or null if loading/none exists */
  pet: Pet | null;
  /** Optimistic update for pet stats, syncs to DB in background */
  updatePetStats: (updates: Partial<PetStats>) => Promise<void>;

  // -- Care Actions --
  /** Feeds the pet, costing coins and restoring hunger/energy */
  feed: () => Promise<void>;
  /** Plays with the pet, boosting happiness but draining energy */
  play: () => Promise<void>;
  /** Bathes the pet, restoring cleanliness */
  bathe: () => Promise<void>;
  /** Puts the pet to sleep, restoring energy fully */
  rest: () => Promise<void>;

  /** 
   * Universal action dispatcher for handling complex events like "Drinking" or "Grooming".
   * This ties into the `gameConfig` system for centralized balancing.
   */
  performAction: (actionType: ActionType) => Promise<void>;

  // -- Debug/Dev Tools --
  increaseStat: (stat: keyof PetStats, amount: number) => Promise<void>;
  decreaseStat: (stat: keyof PetStats, amount: number) => Promise<void>;

  // -- Leaderboards --
  updateHighScore: (gameType: string, score: number, coins?: number) => Promise<void>;
  getHighScore: (gameType: string) => Promise<number>;

  // -- State Flags --
  /** strictly for UI loading spinners */
  loading: boolean;
  /** User-facing error message */
  error: string | null;
  /** True when a background save is in progress */
  updating: boolean;
  /** Granular save status for UI feedback (e.g. "Saving...", "Saved") */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // -- Lifecycle --
  createPet: (name: string, type: string, breed?: string) => Promise<void>;
  /** Forces a re-fetch of pet data from the server */
  refreshPet: () => Promise<void>;

  // -- Game Loop State --
  isGameOver: boolean;
  badges: string[];
  lastLogin: Date | null;
  /** Manually triggers the "Game Over" state (e.g. health <= 0) */
  triggerGameOver: () => Promise<void>;
  /** Resets the pet to initial state (costs everything) */
  restartGame: () => Promise<void>;
  unlockBadge: (badgeId: string) => Promise<void>;
  /** ID of the badge currently being celebrated (triggers toast) */
  badgeToast: string | null;

  /** 
   * Persistent lifetime statistics.
   * critical for achievements like "Master Caretaker" (100 days survived)
   */
  lifetimeStats: {
    total_washes: number;
    total_earnings: number;
    total_spent: number;
    days_survived: number;
    food_eaten: number;
    play_sessions: number;
    total_naps: number;
  };
  /** Triggers visual confetti effect */
  showConfetti: boolean;

  // -- Daily Rewards & Events --
  /** 
   * Server-authoritative check for daily rewards.
   * Returns the reward payload if eligible, or null.
   */
  checkDailyReward: () => Promise<{ type: 'coins' | 'energy' | 'food', amount: number, label: string } | null>;
  oneTimeEvents: string[];
  completeOneTimeEvent: (eventName: string) => Promise<void>;

  // -- Nap Tracking --
  lastNapTimestamp: Date | null;
  recordNap: () => Promise<void>;
}

const PetContext = createContext<PetContextType | null>(null);

/**
 * Hook to access the PetContext.
 * @throws {Error} if used outside of a PetProvider
 */
export const usePet = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePet must be used within a PetProvider');
  }
  return context;
};

/**
 * Provider component that wraps the application to provide pet state.
 * 
 * @param {React.ReactNode} children - The child components
 * @param {string} userId - The current authenticated user's ID
 */
export const PetProvider: React.FC<{ children: React.ReactNode; userId?: string | null }> = ({
  children,
  userId
}) => {
  // Core state for the pet object (name, stats, etc.)
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isGameOver, setIsGameOver] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);
  const [lastLogin, setLastLogin] = useState<Date | null>(null);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  // Lifetime stats for persistent achievement tracking
  const [lifetimeStats, setLifetimeStats] = useState<{
    total_washes: number;
    total_earnings: number;
    total_spent: number;
    days_survived: number;
    food_eaten: number;
    play_sessions: number;
    total_naps: number;
  }>({ total_washes: 0, total_earnings: 0, total_spent: 0, days_survived: 0, food_eaten: 0, play_sessions: 0, total_naps: 0 });

  // Game State (DB Persisted)
  const [oneTimeEvents, setOneTimeEvents] = useState<string[]>([]);
  const [lastDailyClaim, setLastDailyClaim] = useState<Date | null>(null);
  const [lastNapTimestamp, setLastNapTimestamp] = useState<Date | null>(null);

  // Action counters strictly for the current session (used to optimize DB writes)
  const actionCountsRef = useRef({ baths: 0, meals: 0, plays: 0, coinsEarned: 0, coinsSpent: 0, naps: 0 });

  // Timeout ref for debouncing the "Saved" status indicator so user sees it for at least 1.5s
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { refreshUserState } = useAuth();

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
        saveStatusTimeoutRef.current = null;
      }
    };
  }, []);

  // -- 1. Utility Helpers --

  const logTransaction = useCallback(async (action: string, cost: number) => {
    if (!userId || !supabase) return;
    try {
      const query = supabase.from('transactions').insert({
        user_id: userId,
        item_id: action,
        item_name: action,
        transaction_type: 'expense',
        amount: cost,
      }).select('*').maybeSingle();

      const { error } = await withTimeout(query as unknown as Promise<any>, 10000, 'Log transaction') as any;
      if (error) console.warn('Failed to log transaction:', error);
    } catch (e) {
      console.warn('Transaction logging error:', e);
    }
  }, [userId]);

  /**
   * Core function to update pet statistics.
   * Handles clamping, timestamp updates, and optimistic UI rendering.
   * 
   * @param updates Partial<PetStats> - specific stats to modify
   */
  const updatePetStats = useCallback(async (updates: Partial<PetStats>) => {
    if (!pet || !userId || !supabase) return;
    setUpdating(true);
    // Show "Saving..." immediately for feedback
    setSaveStatus('saving');
    try {
      const now = new Date();
      const updatedStats: PetStats = {
        ...pet.stats,
        ...updates,
        lastUpdated: now,
      };

      // Ensure stats stay within 0-100 bounds using gameConfig clamp
      const bounded = {
        health: clampStat(updatedStats.health),
        hunger: clampStat(updatedStats.hunger),
        happiness: clampStat(updatedStats.happiness),
        cleanliness: clampStat(updatedStats.cleanliness),
        energy: clampStat(updatedStats.energy),
      };

      const { data, error } = await supabase.from('pets').update({
        ...bounded,
        updated_at: now.toISOString(),
      } as any).eq('id', pet.id).select('*').maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      const updatedPet: Pet = {
        ...pet,
        updatedAt: now,
        stats: { ...updatedStats, ...bounded, lastUpdated: now },
      };

      setPet(updatedPet);
      setSaveStatus('saved');
      saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (err) {
      console.error('Update stats error:', err);
      setSaveStatus('error');
    } finally {
      setUpdating(false);
    }
  }, [pet, userId]);

  // -- 2. Care Actions --

  const statAction = useCallback(async (action: string, updates: Partial<PetStats>, cost: number = 0) => {
    if (!pet || !userId) return;
    try {
      // Wallet check for non-free actions
      if (cost > 0) {
        const { data: wallet } = await supabase.from('finance_wallets').select('balance').eq('user_id', userId).maybeSingle();
        if (!wallet || wallet.balance < cost) {
          alert(`Insufficient funds! You need ${cost} coins.`);
          return;
        }
      }

      await updatePetStats(updates);
      await logTransaction(action, cost);

      // Update last_stat_update to prevent immediate decay
      await supabase.from('pets').update({ last_stat_update: new Date().toISOString() } as any).eq('id', pet.id);
      setPet(prev => prev ? { ...prev, lastStatUpdate: new Date() } : prev);

    } catch (err) {
      console.error(`${action} failed:`, err);
    }
  }, [pet, userId, updatePetStats, logTransaction]);

  const feed = () => statAction('feed', {
    hunger: clampStat((pet?.stats.hunger || 0) - 30),
    energy: clampStat((pet?.stats.energy || 0) + 10)
  }, 5);

  const play = () => statAction('play', {
    happiness: clampStat((pet?.stats.happiness || 0) + 30),
    energy: clampStat((pet?.stats.energy || 0) - 20)
  }, 0);

  const bathe = () => statAction('bathe', {
    cleanliness: clampStat((pet?.stats.cleanliness || 0) + 50)
  }, 3);

  const rest = () => statAction('rest', {
    energy: 100,
    hunger: clampStat((pet?.stats.hunger || 0) + 10)
  }, 0);

  /**
   * Universal action handler.
   * This is the preferred way to interact with the pet. It:
   * 1. Looks up the action config (cost, stats)
   * 2. Checks wallet balance
   * 3. Applies stats
   * 4. Updates lifetime stats for achievements
   */
  const performAction = useCallback(async (actionType: ActionType) => {
    if (!pet || !userId) return;
    const action = ACTIONS[actionType];
    if (!action) {
      console.warn(`Unknown action type: ${actionType}`);
      return;
    }

    const newStats = applyAction(pet.stats, actionType);
    console.log(`Executing: ${actionType}`, action.effects, "New Stats:", newStats);

    await statAction(action.name, newStats, action.cost);

    // Update lifetime stats and persist to Supabase (null-safe)
    const defaultLifetime = { total_washes: 0, total_earnings: 0, total_spent: 0, days_survived: 0, food_eaten: 0, play_sessions: 0, total_naps: 0 };
    const safeLifetime = { ...defaultLifetime, ...lifetimeStats };
    const updatedLifetime = { ...safeLifetime };

    console.log('🎮 Action:', actionType, '| Before:', safeLifetime);

    if (actionType.includes('SHOWER') || actionType.includes('BATHE') || actionType.includes('GROOM')) {
      updatedLifetime.total_washes++;
      actionCountsRef.current.baths++;
    }
    if (actionType.includes('EAT') || actionType.includes('DRINK') || actionType.includes('FEED')) {
      updatedLifetime.food_eaten++;
      actionCountsRef.current.meals++;
    }
    if (actionType.includes('PLAY') || actionType.includes('FETCH') || actionType.includes('WALK')) {
      updatedLifetime.play_sessions++;
      actionCountsRef.current.plays++;
    }
    if (actionType.includes('REST') || actionType.includes('NAP') || actionType.includes('SLEEP')) {
      updatedLifetime.total_naps++;
      actionCountsRef.current.naps++;
    }
    if (action.cost < 0) {
      updatedLifetime.total_earnings += Math.abs(action.cost);
      actionCountsRef.current.coinsEarned += Math.abs(action.cost);
    } else if (action.cost > 0) {
      updatedLifetime.total_spent += action.cost;
      actionCountsRef.current.coinsSpent += action.cost;
    }

    // Persist lifetime stats to Supabase
    setLifetimeStats(updatedLifetime);
    try {
      await supabase.from('pets').update({ lifetime_stats: updatedLifetime } as any).eq('id', pet.id);
      console.log('📊 Lifetime stats updated:', updatedLifetime);
    } catch (e) {
      console.warn('Failed to persist lifetime stats:', e);
    }

    // Check for new achievements with updated lifetime stats
    await checkAchievementsWithLifetime(updatedLifetime);
  }, [pet, userId, statAction]);

  const increaseStat = useCallback(async (stat: keyof PetStats, amount: number) => {
    if (!pet) return;
    const val = (pet.stats as any)[stat] || 0;
    await updatePetStats({ [stat]: Math.min(100, val + amount) });
  }, [pet, updatePetStats]);

  const decreaseStat = useCallback(async (stat: keyof PetStats, amount: number) => {
    if (!pet) return;
    const val = (pet.stats as any)[stat] || 0;
    await updatePetStats({ [stat]: Math.max(0, val - amount) });
  }, [pet, updatePetStats]);

  // -- 3. Game Management --

  const updateHighScore = useCallback(async (gameType: string, score: number, coins: number = 0) => {
    if (!userId || !supabase) return;
    try {
      const { data: existing } = await supabase.from('game_leaderboards').select('*').eq('user_id', userId).eq('game_type', gameType).maybeSingle();
      if (existing) {
        const isNewBest = score > existing.best_score;
        await supabase.from('game_leaderboards').update({
          best_score: isNewBest ? score : existing.best_score,
          games_played: existing.games_played + 1,
          total_score: existing.total_score + score,
          total_coins: existing.total_coins + coins,
          updated_at: new Date().toISOString()
        } as any).eq('id', existing.id);
      } else {
        await supabase.from('game_leaderboards').insert({
          user_id: userId, game_type: gameType, best_score: score, games_played: 1, total_score: score, total_coins: coins
        } as any);
      }
    } catch (e) {
      logger.error('High score update failed', { error: e }, e instanceof Error ? e : new Error(String(e)));
    }
  }, [userId]);

  const getHighScore = useCallback(async (gameType: string) => {
    if (!userId || !supabase) return 0;
    try {
      const { data } = await supabase.from('game_leaderboards').select('best_score').eq('user_id', userId).eq('game_type', gameType).maybeSingle();
      return data?.best_score || 0;
    } catch (e) {
      return 0;
    }
  }, [userId]);

  // -- 4. Lifecycle & Background --

  /**
   * Loads the pet data from Supabase.
   * Also hydrates derived state like age, level, and achievements.
   */
  const loadPet = useCallback(async () => {
    if (!userId || !supabase) {
      setPet(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await withTimeout(
        supabase.from('pets').select('*').eq('user_id', userId).maybeSingle() as unknown as Promise<any>,
        10000,
        'Load pet'
      ) as any;

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

      if (data) {
        // Calculate age dynamically from birthday/creation date
        const birthday = data.birthday ? new Date(data.birthday) : new Date(data.created_at);
        const age = Math.floor((new Date().getTime() - birthday.getTime()) / (1000 * 60 * 60 * 24));
        const species = (data.pet_type || data.species || 'dog').toLowerCase() as Pet['species'];

        const loaded: Pet = {
          id: data.id,
          name: data.name,
          species,
          breed: data.breed || 'Mixed',
          age,
          level: 1, // Default level (not stored in DB)
          experience: 0, // Default XP (not stored in DB)
          ownerId: data.user_id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          lastStatUpdate: data.last_stat_update ? new Date(data.last_stat_update) : new Date(data.updated_at),
          stats: {
            health: data.health ?? 100,
            hunger: data.hunger ?? 50,
            happiness: data.happiness ?? 50,
            cleanliness: data.cleanliness ?? 50,
            energy: data.energy ?? 50,
            lastUpdated: new Date(data.updated_at),
          },
        };
        setPet(loaded);
        // Load game loop state
        setIsGameOver(data.is_game_over ?? false);
        setBadges(data.badges ?? []);
        setLastLogin(data.last_login ? new Date(data.last_login) : null);
        // Load lifetime stats
        const defaultLifetime = { total_washes: 0, total_earnings: 0, total_spent: 0, days_survived: 0, food_eaten: 0, play_sessions: 0 };
        setLifetimeStats(data.lifetime_stats ? { ...defaultLifetime, ...data.lifetime_stats } : defaultLifetime);
      } else {
        setPet(null);
      }


      // Load Game State (pet_gamestate)
      const { data: gamestate } = await supabase
        .from('pet_gamestate')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (gamestate) {
        setOneTimeEvents(Array.isArray(gamestate.one_time_events) ? gamestate.one_time_events : []);
        setLastDailyClaim(gamestate.last_daily_claim ? new Date(gamestate.last_daily_claim) : null);
        setLastNapTimestamp(gamestate.last_nap_timestamp ? new Date(gamestate.last_nap_timestamp) : null);
      } else {
        // Initialize if missing
        setOneTimeEvents([]);
        setLastDailyClaim(null);
        setLastNapTimestamp(null);
        // Create initial record
        const { error: initError } = await supabase.from('pet_gamestate').insert({
          user_id: userId,
          one_time_events: [],
          last_daily_claim: '2000-01-01 00:00:00Z'
        });
        if (initError) console.warn('Failed to init gamestate:', initError);
      }

    } catch (e) {
      console.error('Load pet failed:', e);
      setError(getErrorMessage(e, 'Failed to load pet data'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const completeOneTimeEvent = useCallback(async (eventName: string) => {
    if (!userId || !supabase) return;
    if (oneTimeEvents.includes(eventName)) return;

    const newEvents = [...oneTimeEvents, eventName];
    setOneTimeEvents(newEvents);

    // Persist
    try {
      await supabase.from('pet_gamestate').upsert({
        user_id: userId,
        one_time_events: newEvents,
        settings: { music: true, sfx: true } // Default if missing
      }, { onConflict: 'user_id' });
      console.log(`✅ Completed event: ${eventName}`);
    } catch (e) {
      console.warn('Failed to save one-time event:', e);
    }
  }, [userId, oneTimeEvents]);

  const recordNap = useCallback(async () => {
    if (!userId || !supabase) return;
    const now = new Date();
    setLastNapTimestamp(now);

    // Trigger REST action for achievements (counts as "Sleep")
    // This will check achievements internally
    await performAction('REST' as ActionType);

    try {
      await supabase.from('pet_gamestate').upsert({
        user_id: userId,
        last_nap_timestamp: now.toISOString()
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('Failed to record nap:', e);
    }
  }, [userId, performAction]);

  /**
   * Checks if the user is eligible for a daily reward.
   * This calls a Postgres RPC function `claim_daily_reward` which handles 
   * the date logic server-side to prevent client clock manipulation.
   */
  const checkDailyReward = useCallback(async () => {
    if (!userId || !supabase) return null;

    // Call Server Function
    const { data: success, error } = await supabase.rpc('claim_daily_reward', { user_id_input: userId });

    if (error) {
      console.warn('Daily reward check failed:', error);
      return null;
    }

    if (success) {
      console.log('🌞 Daily Reward Claimed via Server!');

      // Update local state to reflect the claim
      const now = new Date();
      setLastDailyClaim(now);

      // Update stats locally for immediate feedback
      actionCountsRef.current.coinsEarned += 50;
      setLifetimeStats(prev => ({
        ...prev,
        total_earnings: prev.total_earnings + 50
      }));

      // Refresh User State to get new wallet balance
      await refreshUserState();

      return { type: 'coins' as const, amount: 50, label: 'Daily Coins' };
    }

    return null;
  }, [userId, refreshUserState]);

  /**
   * The Heartbeat of the pet. 
   * Calculates stat decay based on time passed since last update.
   * Runs intelligently:
   * - Only if >1 minute has passed
   * - Capped at 12 hours (Casual Mode) to prevent punishing users who sleep/work.
   */
  const processStatDecay = useCallback(async () => {
    if (!pet || !userId || !supabase) return;
    const lastUpdate = pet.lastStatUpdate || pet.updatedAt || new Date();
    const actualMinutesPassed = (new Date().getTime() - lastUpdate.getTime()) / 60000;
    if (actualMinutesPassed < 1) return;

    // CASUAL-FRIENDLY: Cap offline decay at 12 hours max
    // even if they leave for a week, their pet effectively paused after 12h
    const effectiveMinutes = Math.min(actualMinutesPassed, OFFLINE_CONFIG.maxDecayMinutes);
    const hoursAway = actualMinutesPassed / 60;

    logger.debug('Decaying stats (casual mode)', { actualMinutesPassed, effectiveMinutes, hoursAway });

    // Use DECAY_RATES from gameConfig (reduced for casual play)
    const updates: Partial<PetStats> = {
      // Hunger grows
      hunger: clampStat((pet.stats.hunger || 0) + Math.floor(effectiveMinutes * DECAY_RATES.hunger)),
      // Energy drains
      energy: clampStat((pet.stats.energy || 0) - Math.floor(effectiveMinutes * DECAY_RATES.energy)),
      // Happiness drops
      happiness: clampStat((pet.stats.happiness || 0) - Math.floor(effectiveMinutes * DECAY_RATES.happiness)),
      // Cleanliness reduces
      cleanliness: clampStat((pet.stats.cleanliness || 0) - Math.floor(effectiveMinutes * DECAY_RATES.cleanliness)),
    };

    // DAILY BONUS: "Well Rested" happiness boost for returning after 8+ hours
    if (hoursAway >= OFFLINE_CONFIG.wellRestedThresholdHours) {
      updates.happiness = clampStat((updates.happiness || pet.stats.happiness || 0) + OFFLINE_CONFIG.wellRestedBonus);
      console.log(`🐕 ${OFFLINE_CONFIG.welcomeMessage} (+${OFFLINE_CONFIG.wellRestedBonus} happiness)`);
    }

    // Health penalty when hunger >= 95 or energy <= 5
    if (pet.stats.hunger >= 95 || pet.stats.energy <= 5) {
      updates.health = clampStat((pet.stats.health || 0) - Math.floor(effectiveMinutes * DECAY_RATES.healthPenalty));
    }

    // Only update if there are actual changes
    const hasChanges = Object.keys(updates).some(key => updates[key as keyof PetStats] !== pet.stats[key as keyof PetStats]);

    if (hasChanges) {
      await updatePetStats(updates);
      await supabase.from('pets').update({ last_stat_update: new Date().toISOString() } as any).eq('id', pet.id);
      setPet(prev => prev ? { ...prev, lastStatUpdate: new Date() } : prev);
    }

    // GAME OVER CHECK: If any critical stat hits 0
    const currentHealth = updates.health ?? pet.stats.health;
    const currentEnergy = updates.energy ?? pet.stats.energy;
    if (currentHealth <= 0 || currentEnergy <= 0) {
      await triggerGameOver();
    }
  }, [pet, userId, updatePetStats]);

  // -- 5. Game Over & Restart --

  const triggerGameOver = useCallback(async () => {
    if (!pet || !userId || !supabase || isGameOver) return;
    console.log('💀 GAME OVER triggered!');
    setIsGameOver(true);
    try {
      // Try to save is_game_over to DB (requires migration)
      const { error } = await supabase.from('pets').update({
        is_game_over: true,
        updated_at: new Date().toISOString()
      } as any).eq('id', pet.id);

      if (error) {
        // Ignore if column doesn't exist
        if (!error.message?.includes('is_game_over')) {
          console.error('Failed to save game over state:', error);
        } else {
          console.warn('is_game_over column not found, local state only');
        }
      }
    } catch (e) {
      console.error('Failed to save game over state:', e);
    }
  }, [pet, userId, isGameOver]);

  const restartGame = useCallback(async () => {
    if (!pet || !userId || !supabase) {
      console.error('restartGame: Missing pet, userId, or supabase');
      return;
    }
    console.log('🔄 Restarting game for pet:', pet.id);

    try {
      // Reset stats but keep badges and high_score
      // First try with is_game_over (requires migration)
      const updatePayload: Record<string, any> = {
        health: 100,
        hunger: 50,
        happiness: 80,
        cleanliness: 90,
        energy: 85,
        updated_at: new Date().toISOString(),
      };

      // Try to update is_game_over if column exists
      try {
        updatePayload.is_game_over = false;
        updatePayload.last_stat_update = new Date().toISOString();
      } catch (e) {
        console.warn('is_game_over column may not exist, skipping');
      }

      const { data, error } = await supabase
        .from('pets')
        .update(updatePayload)
        .eq('id', pet.id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Supabase update error:', error);
        // If is_game_over column doesn't exist, try without it
        if (error.message?.includes('is_game_over') || error.code === 'PGRST204') {
          console.log('Retrying without is_game_over column...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('pets')
            .update({
              health: 100,
              hunger: 50,
              happiness: 80,
              cleanliness: 90,
              energy: 85,
              updated_at: new Date().toISOString(),
            })
            .eq('id', pet.id)
            .select('*')
            .maybeSingle();

          if (fallbackError) {
            throw fallbackError;
          }
          console.log('✅ Fallback restart successful:', fallbackData);
        } else {
          throw error;
        }
      } else {
        console.log('✅ Restart successful:', data);
      }

      // Reset local state
      setIsGameOver(false);

      // Force reload pet data
      await loadPet();

      console.log('🎮 Game restarted successfully!');
    } catch (e) {
      console.error('Failed to restart game:', e);
      // Even if DB fails, try to reset local state as fallback
      setIsGameOver(false);
      setPet(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          health: 100,
          hunger: 50,
          happiness: 80,
          cleanliness: 90,
          energy: 85,
          lastUpdated: new Date(),
        }
      } : prev);
    }
  }, [pet, userId, loadPet]);

  // -- 6. Achievements --

  const unlockBadge = useCallback(async (badgeId: string) => {
    if (!pet || !userId || !supabase) return;
    if (badges.includes(badgeId)) return; // Already unlocked

    const newBadges = [...badges, badgeId];
    setBadges(newBadges);

    // Show toast
    setBadgeToast(badgeId);
    setTimeout(() => setBadgeToast(null), 4000);

    // Save to Supabase
    try {
      await supabase.from('pets').update({ badges: newBadges } as any).eq('id', pet.id);
      console.log(`🏆 Badge unlocked: ${badgeId}`);
    } catch (e) {
      console.error('Failed to save badge:', e);
    }
  }, [pet, userId, badges]);

  const checkAchievements = useCallback(async () => {
    if (!pet) return;

    const stats: BadgeCheckStats = {
      totalDaysAlive: pet.age || 0,
      totalBaths: actionCountsRef.current.baths,
      totalMeals: actionCountsRef.current.meals,
      totalPlaySessions: actionCountsRef.current.plays,
      totalCoinsEarned: actionCountsRef.current.coinsEarned,
      totalCoinsSpent: actionCountsRef.current.coinsSpent,
      totalNaps: actionCountsRef.current.naps,
      currentHealth: pet.stats.health,
      currentHappiness: pet.stats.happiness,
      currentCleanliness: pet.stats.cleanliness,
    };

    const newlyUnlocked = checkNewBadges(badges, stats);
    for (const badge of newlyUnlocked) {
      await unlockBadge(badge.id);
    }
  }, [pet, badges, unlockBadge]);

  // Check achievements using persistent lifetime stats from Supabase
  const checkAchievementsWithLifetime = useCallback(async (lifetime: typeof lifetimeStats) => {
    if (!pet) return;

    const stats: BadgeCheckStats = {
      totalDaysAlive: lifetime.days_survived || pet.age || 0,
      totalBaths: lifetime.total_washes,
      totalMeals: lifetime.food_eaten,
      totalPlaySessions: lifetime.play_sessions,
      totalCoinsEarned: lifetime.total_earnings,
      totalCoinsSpent: lifetime.total_spent,
      totalNaps: lifetime.total_naps || 0,
      currentHealth: pet.stats.health,
      currentHappiness: pet.stats.happiness,
      currentCleanliness: pet.stats.cleanliness,
    };

    console.log('🔍 Checking badges with lifetime stats:', stats);
    const newlyUnlocked = checkNewBadges(badges, stats);
    for (const badge of newlyUnlocked) {
      console.log(`🏆 Unlocking badge: ${badge.name}`);
      await unlockBadge(badge.id);
    }
  }, [pet, badges, unlockBadge, lifetimeStats]);

  useEffect(() => { loadPet(); }, [userId, loadPet]);
  useEffect(() => {
    if (!pet || !userId || isSupabaseMock()) return;
    const sub = supabase.channel(`pet-realtime-${pet.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'pets', filter: `id=eq.${pet.id}` }, () => loadPet()).subscribe();
    const inv = setInterval(() => processStatDecay(), 300000); // Every 5 minutes (reduced from 60s to lower egress)
    return () => { supabase.removeChannel(sub); clearInterval(inv); };
  }, [pet?.id, userId, processStatDecay, loadPet]);

  /**
   * Initializes a new pet for the user.
   * Handles "Species mapping" for cases where we support more visual avatars than
   * distinct backend pet types (e.g. Dragon -> Panda type stats).
   */
  const createPet = useCallback(async (name: string, type: string, breed: string = 'Mixed') => {
    if (!userId || !supabase) throw new Error('User not authenticated or Supabase not initialized');
    try {
      // Normalizer: Maps diverse UI options to core backend types (dog/cat/panda)
      // This allows us to add new visual species without breaking database constraints
      const normalizePetType = (type: string): 'dog' | 'cat' | 'panda' => {
        const normalized = type.toLowerCase().trim();
        const validPetTypes: ('dog' | 'cat' | 'panda')[] = ['dog', 'cat', 'panda'];
        if (validPetTypes.includes(normalized as any)) return normalized as any;
        const speciesToPetType: Record<string, 'dog' | 'cat' | 'panda'> = {
          'bird': 'dog', 'rabbit': 'cat', 'fox': 'dog', 'dragon': 'panda',
        };
        const mappedType = speciesToPetType[normalized];
        if (mappedType) return mappedType;
        return 'dog'; // Fallback safe default
      };
      const petType = normalizePetType(type);

      const { data, error } = await withTimeout(
        supabase.from('pets').upsert({
          user_id: userId, name, pet_type: petType, species: petType, breed,
          health: 100, hunger: 75, happiness: 80, cleanliness: 90, energy: 85
        }, { onConflict: 'user_id' }).select().maybeSingle() as unknown as Promise<any>,
        10000,
        'Create pet'
      ) as any;

      if (error) {
        logger.error('Error creating pet', { userId, name, type, errorCode: error.code }, error);
        throw new Error(getErrorMessage(error, 'Failed to create pet'));
      }
      if (!data) throw new Error('Pet created but no data returned');

      await refreshUserState();
      await loadPet(); // Reload to get the newly created pet
    } catch (err: any) {
      console.error('Create pet failed:', err);
      throw err;
    }
  }, [userId, refreshUserState, loadPet]);

  const value = useMemo(() => ({
    pet, loading, error, updating, saveStatus, updatePetStats, feed, play, bathe, rest,
    performAction,
    increaseStat,
    decreaseStat,
    updateHighScore,
    getHighScore,
    createPet,
    refreshPet: loadPet,
    // Game Loop
    isGameOver,
    badges,
    lastLogin,
    triggerGameOver,
    restartGame,
    unlockBadge,
    badgeToast,
    lifetimeStats,
    showConfetti: !!badgeToast, // Show confetti when badge toast is active
    checkDailyReward,
    oneTimeEvents,
    completeOneTimeEvent,
    lastNapTimestamp,
    recordNap,
  }), [pet, loading, error, updating, saveStatus, updatePetStats, feed, play, bathe, rest, performAction, increaseStat, decreaseStat, updateHighScore, getHighScore, createPet, loadPet, isGameOver, badges, lastLogin, triggerGameOver, restartGame, unlockBadge, badgeToast, lifetimeStats, checkDailyReward, oneTimeEvents, completeOneTimeEvent, lastNapTimestamp, recordNap]);

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
};
