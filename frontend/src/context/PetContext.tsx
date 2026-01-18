import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Pet, PetStats } from '@/types/pet';
import { supabase, isSupabaseMock, withTimeout, withRetry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/networkUtils';
import { DECAY_RATES, ACTIONS, clampStat, applyAction, ActionType, OFFLINE_CONFIG } from '../config/gameConfig';

interface PetContextType {
  pet: Pet | null;
  updatePetStats: (updates: Partial<PetStats>) => Promise<void>;
  feed: () => Promise<void>;
  play: () => Promise<void>;
  bathe: () => Promise<void>;
  rest: () => Promise<void>;
  performAction: (actionType: ActionType) => Promise<void>; // NEW: Universal action dispatcher
  increaseStat: (stat: keyof PetStats, amount: number) => Promise<void>;
  decreaseStat: (stat: keyof PetStats, amount: number) => Promise<void>;
  updateHighScore: (gameType: string, score: number, coins?: number) => Promise<void>;
  getHighScore: (gameType: string) => Promise<number>;
  loading: boolean;
  error: string | null;
  updating: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  createPet: (name: string, type: string, breed?: string) => Promise<void>;
  refreshPet: () => Promise<void>;
}

const PetContext = createContext<PetContextType | null>(null);

export const usePet = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePet must be used within a PetProvider');
  }
  return context;
};

export const PetProvider: React.FC<{ children: React.ReactNode; userId?: string | null }> = ({
  children,
  userId
}) => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
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

  const updatePetStats = useCallback(async (updates: Partial<PetStats>) => {
    if (!pet || !userId || !supabase) return;
    setUpdating(true);
    setSaveStatus('saving');
    try {
      const now = new Date();
      const updatedStats: PetStats = {
        ...pet.stats,
        ...updates,
        lastUpdated: now,
      };

      // Ensure bounds using gameConfig
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

  // NEW: Universal action dispatcher using gameConfig
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
      } else {
        setPet(null);
      }
    } catch (e) {
      console.error('Load pet failed:', e);
      setError(getErrorMessage(e, 'Failed to load pet data'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const processStatDecay = useCallback(async () => {
    if (!pet || !userId || !supabase) return;
    const lastUpdate = pet.lastStatUpdate || pet.updatedAt || new Date();
    const actualMinutesPassed = (new Date().getTime() - lastUpdate.getTime()) / 60000;
    if (actualMinutesPassed < 1) return;

    // CASUAL-FRIENDLY: Cap offline decay at 12 hours max
    const effectiveMinutes = Math.min(actualMinutesPassed, OFFLINE_CONFIG.maxDecayMinutes);
    const hoursAway = actualMinutesPassed / 60;

    logger.debug('Decaying stats (casual mode)', { actualMinutesPassed, effectiveMinutes, hoursAway });

    // Use DECAY_RATES from gameConfig (reduced for casual play)
    const updates: Partial<PetStats> = {
      hunger: clampStat((pet.stats.hunger || 0) + Math.floor(effectiveMinutes * DECAY_RATES.hunger)),
      energy: clampStat((pet.stats.energy || 0) - Math.floor(effectiveMinutes * DECAY_RATES.energy)),
      happiness: clampStat((pet.stats.happiness || 0) - Math.floor(effectiveMinutes * DECAY_RATES.happiness)),
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
  }, [pet, userId, updatePetStats]);

  useEffect(() => { loadPet(); }, [userId, loadPet]);
  useEffect(() => {
    if (!pet || !userId || isSupabaseMock()) return;
    const sub = supabase.channel(`pet-realtime-${pet.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'pets', filter: `id=eq.${pet.id}` }, () => loadPet()).subscribe();
    const inv = setInterval(() => processStatDecay(), 300000); // Every 5 minutes (reduced from 60s to lower egress)
    return () => { supabase.removeChannel(sub); clearInterval(inv); };
  }, [pet?.id, userId, processStatDecay, loadPet]);

  const createPet = useCallback(async (name: string, type: string, breed: string = 'Mixed') => {
    if (!userId || !supabase) throw new Error('User not authenticated or Supabase not initialized');
    try {
      const normalizePetType = (type: string): 'dog' | 'cat' | 'panda' => {
        const normalized = type.toLowerCase().trim();
        const validPetTypes: ('dog' | 'cat' | 'panda')[] = ['dog', 'cat', 'panda'];
        if (validPetTypes.includes(normalized as any)) return normalized as any;
        const speciesToPetType: Record<string, 'dog' | 'cat' | 'panda'> = {
          'bird': 'dog', 'rabbit': 'cat', 'fox': 'dog', 'dragon': 'panda',
        };
        const mappedType = speciesToPetType[normalized];
        if (mappedType) return mappedType;
        return 'dog';
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
    performAction, // NEW
    increaseStat,
    decreaseStat,
    updateHighScore,
    getHighScore,
    createPet,
    refreshPet: loadPet,
  }), [pet, loading, error, updating, saveStatus, updatePetStats, feed, play, bathe, rest, performAction, increaseStat, decreaseStat, updateHighScore, getHighScore, createPet, loadPet]);

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
};
