/**
 * gameConfig.ts - Pet Simulation Engine Rulebook
 * 
 * REBALANCED FOR CASUAL PLAY (30 min/day target)
 * - Offline decay capped at 12 hours max
 * - Reduced passive decay rates
 * - Buffed action rewards for quick recovery
 * - Daily login bonus for returning players
 */

// ============================================================
// OFFLINE DECAY SETTINGS (The Safety Net)
// ============================================================
export const OFFLINE_CONFIG = {
    /** Maximum minutes of decay to apply (12 hours = 720 min) */
    maxDecayMinutes: 720,
    /** Minimum hours away to trigger "Well Rested" bonus */
    wellRestedThresholdHours: 8,
    /** Happiness bonus for returning after 8+ hours */
    wellRestedBonus: 20,
    /** Welcome back message */
    welcomeMessage: "Welcome back! Your pet missed you. 🐕",
} as const;

// ============================================================
// STAT DECAY RATES (per minute) - CASUAL FRIENDLY
// ============================================================
export const DECAY_RATES = {
    /** Hunger increases by this amount per minute (pet gets hungrier) */
    hunger: 0.08,  // ~58 points in 12 hours (was 0.2)
    /** Energy decreases by this amount per minute */
    energy: 0.08,  // ~58 points in 12 hours (was 0.2)
    /** Happiness decreases by this amount per minute */
    happiness: 0.05, // ~36 points in 12 hours (was 0.1)
    /** Cleanliness decreases by this amount per minute */
    cleanliness: 0.05, // ~36 points in 12 hours (was 0.06)
    /** Health decay rate when hunger >= 95 or energy <= 5 */
    healthPenalty: 0.02, // Slower health drain (was 0.033)
} as const;

// ============================================================
// STAT BOUNDS
// ============================================================
export const STAT_BOUNDS = {
    min: 0,
    max: 100,
} as const;

// ============================================================
// ACTION EFFECTS - BUFFED FOR QUICK RECOVERY
// Each action can affect multiple stats (positive = increase, negative = decrease)
// ============================================================
export type ActionType = keyof typeof ACTIONS;

export const ACTIONS = {
    // === FEEDING (Buffed: 3 meals = full recovery) ===
    EAT_APPLE: {
        name: 'Eat Apple',
        cost: 0,
        effects: { hunger: -20, health: +5, happiness: +5 },
        room: 'kitchen',
    },
    EAT_KIBBLE: {
        name: 'Eat Kibble',
        cost: 0,
        effects: { hunger: -35, health: +10 },
        room: 'kitchen',
    },
    EAT_TREAT: {
        name: 'Eat Treat',
        cost: 0,
        effects: { hunger: -15, happiness: +20 },
        room: 'kitchen',
    },
    EAT_GOURMET: {
        name: 'Eat Gourmet Meal',
        cost: 0,
        effects: { hunger: -60, happiness: +25, health: +15 },
        room: 'kitchen',
    },
    DRINK_WATER: {
        name: 'Drink Water',
        cost: 0,
        effects: { hunger: -10, health: +10 },
        room: 'kitchen',
    },

    // === RESTING (Buffed: Power Naps for busy players) ===
    SLEEP: {
        name: 'Full Sleep',
        cost: 0,
        effects: { energy: +100, hunger: +15 },
        room: 'bedroom',
    },
    NAP: {
        name: 'Power Nap',
        cost: 0,
        effects: { energy: +40, hunger: +5 },  // Buffed from +30
        room: 'bedroom',
    },
    REST: {
        name: 'Rest',
        cost: 0,
        effects: { energy: +60, hunger: +5 },  // Buffed from +50
        room: 'bedroom',
    },

    // === PLAY & EXERCISE (High Risk/Reward) ===
    PLAY: {
        name: 'Play',
        cost: 0,
        effects: { happiness: +35, energy: -15 },  // Buffed happiness, reduced energy cost
        room: 'living',
    },
    WALK: {
        name: 'Go for a Walk',
        cost: 0,
        effects: { happiness: +30, energy: -20, hunger: +10 },
        room: 'outdoors',
    },
    GYM_WORKOUT: {
        name: 'Gym Workout',
        cost: 0,
        effects: { happiness: +35, energy: -40, cleanliness: -20 },  // High risk/reward
        room: 'gym',
    },
    FETCH: {
        name: 'Play Fetch',
        cost: 0,
        effects: { happiness: +40, energy: -25 },
        room: 'outdoors',
    },

    // === HYGIENE (Buffed: 2 showers = full) ===
    BATHE: {
        name: 'Take a Bath',
        cost: 3,
        effects: { cleanliness: +60, happiness: +10 },  // Buffed from +50
        room: 'bathroom',
    },
    SHOWER: {
        name: 'Quick Shower',
        cost: 0,
        effects: { cleanliness: +50, happiness: +10, energy: -5 },
        room: 'bathroom',
    },
    GROOM: {
        name: 'Grooming Session',
        cost: 5,
        effects: { cleanliness: +45, happiness: +15 },  // Buffed
        room: 'bathroom',
    },
    BRUSH_TEETH: {
        name: 'Brush Teeth',
        cost: 0,
        effects: { cleanliness: +15, health: +5 },
        room: 'bathroom',
    },

    // === SPECIAL (Premium Recovery) ===
    VET_CHECKUP: {
        name: 'General Checkup',
        cost: 50,
        effects: { health: +15 },
        room: 'clinic',
    },
    VET_MEDICINE: {
        name: 'Medicine',
        cost: 120,
        effects: { health: +50 },
        room: 'clinic',
    },
    VET_SURGERY: {
        name: 'Emergency Surgery',
        cost: 500,
        effects: { health: +100 },
        room: 'clinic',
    },

    // === INCOME (Chores) ===
    CHORE_DISHES: {
        name: 'Wash Dishes',
        cost: -15, // Income: +15 coins
        effects: { energy: -10 },
        room: 'kitchen',
    },
    CHORE_YARD: {
        name: 'Clean Yard',
        cost: -25, // Income: +25 coins
        effects: { energy: -20 },
        room: 'kitchen',
    },

    SPA_DAY: {
        name: 'Spa Day',
        cost: 20,
        effects: { cleanliness: +60, happiness: +40, energy: +30 },  // Buffed
        room: 'spa',
    },
} as const;

// ============================================================
// ROOM STAT PROMINENCE
// Which stats are highlighted in each room/location
// ============================================================
export type RoomType = 'kitchen' | 'bedroom' | 'bathroom' | 'living' | 'closet' | 'gym' | 'outdoors' | 'clinic' | 'spa';

export const ROOM_STAT_HIGHLIGHTS: Record<RoomType, (keyof typeof STAT_DISPLAY_CONFIG)[]> = {
    kitchen: ['hunger'],
    bedroom: ['energy'],
    bathroom: ['cleanliness'],
    living: ['happiness'],
    closet: ['happiness'],
    gym: ['energy', 'happiness'],
    outdoors: ['energy', 'happiness'],
    clinic: ['health'],
    spa: ['cleanliness', 'happiness'],
};

// ============================================================
// STAT DISPLAY CONFIGURATION
// Visual styling for each stat type
// ============================================================
export const STAT_DISPLAY_CONFIG = {
    health: {
        name: 'Health',
        icon: '❤️',
        colorFrom: '#ef4444',
        colorTo: '#dc2626',
        bgColor: 'rgba(239, 68, 68, 0.2)',
    },
    hunger: {
        name: 'Hunger',
        icon: '🍖',
        colorFrom: '#f97316',
        colorTo: '#ea580c',
        bgColor: 'rgba(249, 115, 22, 0.2)',
        inverted: true, // Lower is better
    },
    energy: {
        name: 'Energy',
        icon: '⚡',
        colorFrom: '#eab308',
        colorTo: '#ca8a04',
        bgColor: 'rgba(234, 179, 8, 0.2)',
    },
    happiness: {
        name: 'Happiness',
        icon: '😊',
        colorFrom: '#22c55e',
        colorTo: '#16a34a',
        bgColor: 'rgba(34, 197, 94, 0.2)',
    },
    cleanliness: {
        name: 'Hygiene',
        icon: '🧼',
        colorFrom: '#06b6d4',
        colorTo: '#0891b2',
        bgColor: 'rgba(6, 182, 212, 0.2)',
    },
} as const;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Clamp a stat value between 0 and 100
 */
export function clampStat(value: number): number {
    return Math.max(STAT_BOUNDS.min, Math.min(STAT_BOUNDS.max, value));
}

/**
 * Calculate stat decay over a given time period
 */
export function calculateDecay(elapsedMinutes: number) {
    return {
        hunger: Math.floor(elapsedMinutes * DECAY_RATES.hunger),
        energy: -Math.floor(elapsedMinutes * DECAY_RATES.energy),
        happiness: -Math.floor(elapsedMinutes * DECAY_RATES.happiness),
        cleanliness: -Math.floor(elapsedMinutes * DECAY_RATES.cleanliness),
    };
}

/**
 * Apply action effects to current stats, returning new clamped values
 */
export function applyAction(
    currentStats: { health: number; hunger: number; energy: number; happiness: number; cleanliness: number },
    actionType: ActionType
): typeof currentStats {
    const action = ACTIONS[actionType];
    if (!action) return currentStats;

    const effects = action.effects as Record<string, number>;
    const newStats = { ...currentStats };

    for (const [stat, delta] of Object.entries(effects)) {
        if (stat in newStats) {
            (newStats as any)[stat] = clampStat((newStats as any)[stat] + delta);
        }
    }

    return newStats;
}
