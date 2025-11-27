import { shopService } from './shopService';
import { supabase, isSupabaseMock } from '../lib/supabase';

export type Chore = {
  id: string;
  name: string;
  reward: number;
  timeSeconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cooldownSeconds: number;
};

export type ChoreResult = {
  reward: number;
  completedAt: Date;
};

export const defaultChores: Chore[] = [
  { id: 'wash-dishes', name: 'Wash Dishes', reward: 15, timeSeconds: 30, difficulty: 'easy', cooldownSeconds: 60 },
  { id: 'mow-lawn', name: 'Mow Lawn', reward: 25, timeSeconds: 45, difficulty: 'medium', cooldownSeconds: 120 },
  { id: 'clean-room', name: 'Clean Room', reward: 20, timeSeconds: 40, difficulty: 'easy', cooldownSeconds: 90 },
];

// Get cooldowns from Supabase
async function getCooldowns(userId: string | undefined): Promise<Record<string, number>> {
  if (!userId || isSupabaseMock()) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('user_cooldowns')
      .select('cooldowns')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return {};
    }

    if (data?.cooldowns) {
      // Parse and filter expired cooldowns
      const cooldowns = data.cooldowns as Record<string, number>;
      const now = Date.now();
      const validCooldowns: Record<string, number> = {};
      
      for (const [key, value] of Object.entries(cooldowns)) {
        if (typeof value === 'number' && value > now) {
          validCooldowns[key] = value;
        }
      }
      
      return validCooldowns;
    }

    return {};
  } catch (error) {
    return {};
  }
}

// Save cooldowns to Supabase
async function setCooldowns(userId: string | undefined, data: Record<string, number>): Promise<void> {
  if (!userId || isSupabaseMock()) {
    return;
  }

  try {
    const { error } = await supabase
      .from('user_cooldowns')
      .upsert({
        user_id: userId,
        cooldowns: data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      // Failed to save cooldowns - continue silently
    }
  } catch (error) {
    // Error saving cooldowns - continue silently
  }
}

export const earnService = {
  async listChores(): Promise<Chore[]> {
    // In future, fetch from Supabase table 'chores'
    return defaultChores;
  },

  async getChoreCooldown(userId: string | undefined, choreId: string): Promise<number> {
    const cooldowns = await getCooldowns(userId);
    const until = cooldowns[choreId];
    const now = Date.now();
    return until && until > now ? Math.ceil((until - now) / 1000) : 0;
  },

  async completeChore(userId: string, choreId: string): Promise<ChoreResult> {
    const chore = defaultChores.find(c => c.id === choreId);
    if (!chore) throw new Error('Invalid chore');

    // Save cooldown to Supabase
    const cooldowns = await getCooldowns(userId);
    cooldowns[choreId] = Date.now() + chore.cooldownSeconds * 1000;
    await setCooldowns(userId, cooldowns);

    const reward = chore.reward;

    // Add coins and insert transaction via shopService
    await shopService.addCoins(userId, reward, `Completed Chore: ${chore.name}`);
    return { reward, completedAt: new Date() };
  },
};


