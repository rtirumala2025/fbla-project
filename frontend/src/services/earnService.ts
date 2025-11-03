import { shopService } from './shopService';

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

const useMock = process.env.REACT_APP_USE_MOCK === 'true';

export const defaultChores: Chore[] = [
  { id: 'wash-dishes', name: 'Wash Dishes', reward: 15, timeSeconds: 30, difficulty: 'easy', cooldownSeconds: 60 },
  { id: 'mow-lawn', name: 'Mow Lawn', reward: 25, timeSeconds: 45, difficulty: 'medium', cooldownSeconds: 120 },
  { id: 'clean-room', name: 'Clean Room', reward: 20, timeSeconds: 40, difficulty: 'easy', cooldownSeconds: 90 },
];

const COOLDOWN_KEY = 'vp_chores_cooldowns';

function getCooldowns(userId: string | undefined) {
  const raw = localStorage.getItem(`${COOLDOWN_KEY}_${userId || 'anon'}`);
  return raw ? (JSON.parse(raw) as Record<string, number>) : {};
}

function setCooldowns(userId: string | undefined, data: Record<string, number>) {
  localStorage.setItem(`${COOLDOWN_KEY}_${userId || 'anon'}`, JSON.stringify(data));
}

export const earnService = {
  async listChores(): Promise<Chore[]> {
    // In future, fetch from Supabase table 'chores'
    return defaultChores;
  },

  getChoreCooldown(userId: string | undefined, choreId: string): number {
    const cooldowns = getCooldowns(userId);
    const until = cooldowns[choreId];
    const now = Date.now();
    return until && until > now ? Math.ceil((until - now) / 1000) : 0;
  },

  async completeChore(userId: string, choreId: string): Promise<ChoreResult> {
    const chore = defaultChores.find(c => c.id === choreId);
    if (!chore) throw new Error('Invalid chore');

    // Save cooldown
    const cooldowns = getCooldowns(userId);
    cooldowns[choreId] = Date.now() + chore.cooldownSeconds * 1000;
    setCooldowns(userId, cooldowns);

    const reward = chore.reward;

    if (useMock) {
      // Mock: just return and pretend we inserted a transaction
      return { reward, completedAt: new Date() };
    }

    // Real: add coins and insert transaction via shopService
    await shopService.addCoins(userId, reward, `Completed Chore: ${chore.name}`);
    return { reward, completedAt: new Date() };
  },
};


