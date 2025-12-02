/**
 * Game Loop Service
 * 
 * Handles periodic game state updates:
 * - Stat decay over time
 * - Quest progression updates
 * - Idle coin rewards
 * - Pet state synchronization
 * 
 * Runs:
 * - On login (to catch up on missed time)
 * - Periodically (every 5-10 minutes while app is active)
 * - On app focus (when user returns)
 */

import { supabase, isSupabaseMock } from '../lib/supabase';
import { logger } from '../utils/logger';
import { saveService } from './saveService';
import { shopService } from './shopService';

export interface GameLoopConfig {
  intervalMs: number; // How often to run the loop (default: 5 minutes)
  decayRatePerHour: {
    hunger: number;
    happiness: number;
    cleanliness: number;
    energy: number;
    health: number; // Only decays if other stats are very low
  };
  idleCoinRatePerHour: number; // Coins per hour of idle time
  maxIdleHours: number; // Maximum hours to reward (prevents abuse)
}

const DEFAULT_CONFIG: GameLoopConfig = {
  intervalMs: 5 * 60 * 1000, // 5 minutes
  decayRatePerHour: {
    hunger: 5, // 5 points per hour
    happiness: 3, // 3 points per hour
    cleanliness: 2, // 2 points per hour
    energy: 4, // 4 points per hour
    health: 1, // 1 point per hour (only if other stats < 30)
  },
  idleCoinRatePerHour: 10, // 10 coins per hour
  maxIdleHours: 24, // Max 24 hours of idle rewards
};

class GameLoopService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastRunTime: number = 0;
  private isRunning: boolean = false;
  private config: GameLoopConfig;
  private userId: string | null = null;

  constructor(config: Partial<GameLoopConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the game loop for a user
   */
  start(userId: string): void {
    if (this.isRunning && this.userId === userId) {
      return; // Already running for this user
    }

    this.userId = userId;
    this.lastRunTime = Date.now();

    // Run immediately on start (catches up on missed time)
    this.runGameLoop().catch(err => {
      logger.error('Error in initial game loop run', { userId, error: err }, err instanceof Error ? err : undefined);
    });

    // Set up periodic execution
    this.intervalId = setInterval(() => {
      this.runGameLoop().catch(err => {
        logger.error('Error in periodic game loop', { userId, error: err }, err);
      });
    }, this.config.intervalMs);

    this.isRunning = true;
    logger.info('Game loop started', { userId, intervalMs: this.config.intervalMs });
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.userId = null;
    logger.info('Game loop stopped');
  }

  /**
   * Run the game loop once
   */
  async runGameLoop(): Promise<void> {
    if (!this.userId || isSupabaseMock()) {
      return;
    }

    if (this.isRunning) {
      // Prevent concurrent runs
      return;
    }

    this.isRunning = true;

    try {
      const now = Date.now();
      const timeSinceLastRun = this.lastRunTime > 0 
        ? (now - this.lastRunTime) / (1000 * 60 * 60) // Convert to hours
        : 0;

      if (timeSinceLastRun < 0.01) {
        // Less than 36 seconds, skip to avoid excessive updates
        this.isRunning = false;
        return;
      }

      logger.debug('Running game loop', {
        userId: this.userId,
        hoursSinceLastRun: timeSinceLastRun.toFixed(2),
      });

      // Load current pet state
      const pet = await this.loadPet();
      if (!pet) {
        logger.debug('No pet found, skipping game loop', { userId: this.userId });
        this.isRunning = false;
        return;
      }

      // Apply stat decay
      const updatedStats = await this.applyStatDecay(pet, timeSinceLastRun);

      // Update quest progression
      await this.updateQuestProgression(this.userId, timeSinceLastRun);

      // Award idle coins
      await this.awardIdleCoins(this.userId, timeSinceLastRun);

      // Save updated pet state
      if (updatedStats) {
        await saveService.saveImmediate('pet', pet.id, updatedStats);
      }

      this.lastRunTime = now;
      logger.debug('Game loop completed', { userId: this.userId });
    } catch (error) {
      logger.error('Error in game loop', { userId: this.userId, error }, error instanceof Error ? error : undefined);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Load pet from database
   */
  private async loadPet(): Promise<any | null> {
    if (!supabase || !this.userId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No pet found
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error loading pet for game loop', { userId: this.userId, error }, error instanceof Error ? error : undefined);
      return null;
    }
  }

  /**
   * Apply stat decay based on time elapsed
   */
  private async applyStatDecay(
    pet: any,
    hoursElapsed: number
  ): Promise<Record<string, number> | null> {
    const stats = {
      health: pet.health ?? 100,
      hunger: pet.hunger ?? 50,
      happiness: pet.happiness ?? 50,
      cleanliness: pet.cleanliness ?? 50,
      energy: pet.energy ?? 50,
    };

    const decay = this.config.decayRatePerHour;
    const updates: Record<string, number> = {};

    // Apply decay
    const newHunger = Math.max(0, stats.hunger - decay.hunger * hoursElapsed);
    const newHappiness = Math.max(0, stats.happiness - decay.happiness * hoursElapsed);
    const newCleanliness = Math.max(0, stats.cleanliness - decay.cleanliness * hoursElapsed);
    const newEnergy = Math.max(0, stats.energy - decay.energy * hoursElapsed);

    // Health only decays if other stats are very low
    let newHealth = stats.health;
    const avgOtherStats = (newHunger + newHappiness + newCleanliness + newEnergy) / 4;
    if (avgOtherStats < 30) {
      newHealth = Math.max(0, stats.health - decay.health * hoursElapsed);
    }

    // Only update if there are meaningful changes
    if (Math.abs(newHunger - stats.hunger) >= 1) {
      updates.hunger = Math.round(newHunger);
    }
    if (Math.abs(newHappiness - stats.happiness) >= 1) {
      updates.happiness = Math.round(newHappiness);
    }
    if (Math.abs(newCleanliness - stats.cleanliness) >= 1) {
      updates.cleanliness = Math.round(newCleanliness);
    }
    if (Math.abs(newEnergy - stats.energy) >= 1) {
      updates.energy = Math.round(newEnergy);
    }
    if (Math.abs(newHealth - stats.health) >= 1) {
      updates.health = Math.round(newHealth);
    }

    return Object.keys(updates).length > 0 ? updates : null;
  }

  /**
   * Update quest progression based on time elapsed
   */
  private async updateQuestProgression(userId: string, hoursElapsed: number): Promise<void> {
    if (!supabase) {
      return;
    }

    try {
      // Load active quests
      const { data: quests, error } = await supabase
        .from('user_quests')
        .select('*, quests(*)')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress']);

      if (error) {
        logger.error('Error loading quests for progression', { userId, error }, error instanceof Error ? error : undefined);
        return;
      }

      if (!quests || quests.length === 0) {
        return;
      }

      // Update time-based quests (e.g., "Play for 1 hour")
      for (const userQuest of quests) {
        const quest = userQuest.quests;
        if (!quest) continue;

        // Check if quest is time-based (e.g., description contains "hour" or "minute")
        const isTimeBased = quest.description?.toLowerCase().includes('hour') ||
                           quest.description?.toLowerCase().includes('minute') ||
                           quest.description?.toLowerCase().includes('time');

        if (isTimeBased && userQuest.progress < userQuest.target_value) {
          const progressIncrement = Math.floor(hoursElapsed * 60); // Convert hours to minutes
          const newProgress = Math.min(
            userQuest.target_value,
            userQuest.progress + progressIncrement
          );

          if (newProgress > userQuest.progress) {
            await saveService.queueSave('quest', userQuest.id, {
              progress: newProgress,
              last_progress_at: new Date().toISOString(),
              status: newProgress >= userQuest.target_value ? 'completed' : 'in_progress',
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error updating quest progression', { userId, error }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Award idle coins based on time elapsed
   */
  private async awardIdleCoins(userId: string, hoursElapsed: number): Promise<void> {
    if (hoursElapsed <= 0) {
      return;
    }

    // Cap idle hours to prevent abuse
    const cappedHours = Math.min(hoursElapsed, this.config.maxIdleHours);
    const coinsToAward = Math.floor(cappedHours * this.config.idleCoinRatePerHour);

    if (coinsToAward <= 0) {
      return;
    }

    try {
      await shopService.addCoins(
        userId,
        coinsToAward,
        `Idle rewards (${cappedHours.toFixed(1)} hours)`
      );

      logger.info('Idle coins awarded', {
        userId,
        hours: cappedHours.toFixed(2),
        coins: coinsToAward,
      });
    } catch (error) {
      logger.error('Error awarding idle coins', { userId, error }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get time since last run (for debugging)
   */
  getTimeSinceLastRun(): number {
    if (this.lastRunTime === 0) {
      return 0;
    }
    return (Date.now() - this.lastRunTime) / (1000 * 60 * 60); // Hours
  }

  /**
   * Check if game loop is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const gameLoopService = new GameLoopService();
