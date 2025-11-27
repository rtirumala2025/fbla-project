/**
 * State Capture Service
 * Captures all user/pet/game state for cloud save and offline mode
 */
import { supabase, isSupabaseMock } from '../lib/supabase';
import type { SyncSnapshot } from '../types/sync';

export interface AppState {
  pet: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  preferences: Record<string, unknown> | null;
  wallet: Record<string, unknown> | null;
  transactions: Array<Record<string, unknown>>;
  goals: Array<Record<string, unknown>>;
  inventory: Array<Record<string, unknown>>;
  accessories: Array<Record<string, unknown>>;
  gameSessions: Array<Record<string, unknown>>;
  gameRounds: Array<Record<string, unknown>>;
  userQuests: Array<Record<string, unknown>>;
  progress: Record<string, unknown>;
}

/**
 * Capture complete application state for cloud save
 */
export async function captureAppState(userId: string): Promise<SyncSnapshot> {
  if (isSupabaseMock() || !userId) {
    return {
      pets: [],
      inventory: [],
      quests: [],
      progress: {},
    };
  }

  try {
    // Capture all state in parallel
    const [
      petData,
      profileData,
      preferencesData,
      walletData,
      transactionsData,
      goalsData,
      inventoryData,
      accessoriesData,
      gameSessionsData,
      gameRoundsData,
      userQuestsData,
    ] = await Promise.all([
      // Pet state
      supabase
        .from('pets')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            console.warn('Failed to capture pet state:', error);
          }
          return data ? { ...data, updated_at: data.updated_at || new Date().toISOString() } : null;
        }),

      // Profile state
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            console.warn('Failed to capture profile state:', error);
          }
          return data ? { ...data, updated_at: data.updated_at || new Date().toISOString() } : null;
        }),

      // User preferences
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            console.warn('Failed to capture preferences state:', error);
          }
          return data ? { ...data, updated_at: data.updated_at || new Date().toISOString() } : null;
        }),

      // Wallet state
      supabase
        .from('finance_wallets')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            console.warn('Failed to capture wallet state:', error);
          }
          return data ? { ...data, updated_at: data.updated_at || new Date().toISOString() } : null;
        }),

      // Transactions (last 100)
      supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
        .then(({ data, error }) => {
          if (error) {
            console.warn('Failed to capture transactions state:', error);
          }
          return (data || []).map((item) => ({
            ...item,
            updated_at: item.created_at || new Date().toISOString(),
          }));
        }),

      // Goals
      supabase
        .from('finance_goals')
        .select('*')
        .eq('user_id', userId)
        .then(({ data, error }) => {
          if (error) {
            console.warn('Failed to capture goals state:', error);
          }
          return (data || []).map((item) => ({
            ...item,
            updated_at: item.updated_at || new Date().toISOString(),
          }));
        }),

      // Inventory
      supabase
        .from('finance_inventory')
        .select('*')
        .eq('user_id', userId)
        .then(({ data, error }) => {
          if (error) {
            console.warn('Failed to capture inventory state:', error);
          }
          return (data || []).map((item) => ({
            ...item,
            updated_at: item.updated_at || new Date().toISOString(),
          }));
        }),

      // Accessories
      supabase
        .from('user_accessories')
        .select('*')
        .eq('user_id', userId)
        .then(({ data, error }) => {
          if (error) {
            console.warn('Failed to capture accessories state:', error);
          }
          return (data || []).map((item) => ({
            ...item,
            updated_at: item.updated_at || new Date().toISOString(),
          }));
        }),

      // Game sessions (last 50)
      supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (error) {
            console.warn('Failed to capture game sessions state:', error);
          }
          return (data || []).map((item) => ({
            ...item,
            updated_at: item.created_at || new Date().toISOString(),
          }));
        }),

      // Game rounds (active only)
      supabase
        .from('game_rounds')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'active'])
        .then(({ data, error }) => {
          if (error) {
            console.warn('Failed to capture game rounds state:', error);
          }
          return (data || []).map((item) => ({
            ...item,
            updated_at: item.updated_at || new Date().toISOString(),
          }));
        }),

      // User quests
      supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .then(({ data, error }) => {
          if (error) {
            console.warn('Failed to capture user quests state:', error);
          }
          return (data || []).map((item) => ({
            ...item,
            updated_at: item.updated_at || new Date().toISOString(),
          }));
        }),
    ]);

    // Build snapshot with all state
    const snapshot: SyncSnapshot = {
      pets: petData ? [petData] : [],
      inventory: [
        ...inventoryData,
        ...accessoriesData.map((acc) => ({ ...acc, type: 'accessory' })),
      ],
      quests: userQuestsData,
      progress: {
        profile: profileData,
        preferences: preferencesData,
        wallet: walletData,
        transactions: transactionsData,
        goals: goalsData,
        gameSessions: gameSessionsData,
        gameRounds: gameRoundsData,
        lastCaptured: new Date().toISOString(),
      },
    };

    return snapshot;
  } catch (error) {
    console.error('Error capturing app state:', error);
    // Return minimal snapshot on error
    return {
      pets: [],
      inventory: [],
      quests: [],
      progress: {
        lastCaptured: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Restore application state from snapshot
 * This is used when restoring from cloud or offline storage
 */
export async function restoreAppState(
  userId: string,
  snapshot: SyncSnapshot,
): Promise<{ restored: boolean; errors: string[] }> {
  if (isSupabaseMock() || !userId || !snapshot) {
    return { restored: false, errors: ['Invalid state or user'] };
  }

  const errors: string[] = [];

  try {
    // Restore pet state (if exists)
    if (snapshot.pets && snapshot.pets.length > 0) {
      const petData = snapshot.pets[0];
      const { error } = await supabase
        .from('pets')
        .upsert(
          {
            ...petData,
            user_id: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
      if (error) {
        errors.push(`Failed to restore pet: ${error.message}`);
      }
    }

    // Restore profile (if exists in progress)
    if (snapshot.progress?.profile) {
      const profileData = snapshot.progress.profile as Record<string, unknown>;
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            ...profileData,
            user_id: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
      if (error) {
        errors.push(`Failed to restore profile: ${error.message}`);
      }
    }

    // Restore preferences (if exists in progress)
    if (snapshot.progress?.preferences) {
      const prefsData = snapshot.progress.preferences as Record<string, unknown>;
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            ...prefsData,
            user_id: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
      if (error) {
        errors.push(`Failed to restore preferences: ${error.message}`);
      }
    }

    // Restore wallet (if exists in progress)
    if (snapshot.progress?.wallet) {
      const walletData = snapshot.progress.wallet as Record<string, unknown>;
      const { error } = await supabase
        .from('finance_wallets')
        .upsert(
          {
            ...walletData,
            user_id: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
      if (error) {
        errors.push(`Failed to restore wallet: ${error.message}`);
      }
    }

    // Restore goals (if exists in progress)
    if (snapshot.progress?.goals && Array.isArray(snapshot.progress.goals)) {
      const goalsData = snapshot.progress.goals as Array<Record<string, unknown>>;
      for (const goal of goalsData) {
        const { error } = await supabase.from('finance_goals').upsert({
          ...goal,
          user_id: userId,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          errors.push(`Failed to restore goal ${goal.id}: ${error.message}`);
        }
      }
    }

    // Restore inventory (if exists)
    if (snapshot.inventory && snapshot.inventory.length > 0) {
      for (const item of snapshot.inventory) {
        const itemData = item as Record<string, unknown>;
        if (itemData.type === 'accessory') {
          // Restore accessory
          const { error } = await supabase.from('user_accessories').upsert({
            ...itemData,
            user_id: userId,
            updated_at: new Date().toISOString(),
          });
          if (error) {
            errors.push(`Failed to restore accessory ${itemData.id}: ${error.message}`);
          }
        } else {
          // Restore inventory item
          const { error } = await supabase.from('finance_inventory').upsert({
            ...itemData,
            user_id: userId,
            updated_at: new Date().toISOString(),
          });
          if (error) {
            errors.push(`Failed to restore inventory item ${itemData.id}: ${error.message}`);
          }
        }
      }
    }

    // Restore user quests (if exists)
    if (snapshot.quests && snapshot.quests.length > 0) {
      for (const quest of snapshot.quests) {
        const questData = quest as Record<string, unknown>;
        const { error } = await supabase.from('user_quests').upsert({
          ...questData,
          user_id: userId,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          errors.push(`Failed to restore quest ${questData.id}: ${error.message}`);
        }
      }
    }

    return {
      restored: errors.length === 0,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Restore failed: ${errorMessage}`);
    return { restored: false, errors };
  }
}

