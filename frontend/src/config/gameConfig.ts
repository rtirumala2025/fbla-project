/**
 * gameConfig.ts - Pet Simulation Engine Rulebook
 * 
 * This file centralizes all game balance numbers.
 * No "magic numbers" should exist in components - everything comes from here.
 */

// ============================================================
// STAT DECAY RATES (per minute)
// ============================================================
export const DECAY_RATES = {
    /** Hunger increases by this amount per minute (pet gets hungrier) */
    hunger: 0.2,
    /** Energy decreases by this amount per minute */
    energy: 0.2,
    /** Happiness decreases by this amount per minute */
    happiness: 0.1,
    /** Cleanliness decreases by this amount per minute */
    cleanliness: 0.06,
    /** Health decay rate when hunger >= 95 or energy <= 5 */
    healthPenalty: 0.033,
} as const;

// ============================================================
// STAT BOUNDS
// ============================================================
export const STAT_BOUNDS = {
    min: 0,
    max: 100,
} as const;

// ============================================================
// ACTION EFFECTS
// Each action can affect multiple stats (positive = increase, negative = decrease)
// ============================================================
export type ActionType = keyof typeof ACTIONS;

export const ACTIONS = {
    // === FEEDING ===
    EAT_APPLE: {
        name: 'Eat Apple',
        cost: 0,
        effects: { hunger: -15, health: +5 },
        room: 'kitchen',
    },
    EAT_KIBBLE: {
        name: 'Eat Kibble',
        cost: 0,
        effects: { hunger: -25, health: +10 },
        room: 'kitchen',
    },
    EAT_TREAT: {
        name: 'Eat Treat',
        cost: 0,
        effects: { hunger: -10, happiness: +15 },
        room: 'kitchen',
    },
    EAT_GOURMET: {
        name: 'Eat Gourmet Meal',
        cost: 0,
        effects: { hunger: -50, happiness: +20, health: +10 },
        room: 'kitchen',
    },
    DRINK_WATER: {
        name: 'Drink Water',
        cost: 0,
        effects: { hunger: -5, health: +5 },
        room: 'kitchen',
    },

    // === RESTING ===
    SLEEP: {
        name: 'Sleep',
        cost: 0,
        effects: { energy: +100, hunger: +10 },
        room: 'bedroom',
    },
    NAP: {
        name: 'Take a Nap',
        cost: 0,
        effects: { energy: +30, hunger: +5 },
        room: 'bedroom',
    },
    REST: {
        name: 'Rest',
        cost: 0,
        effects: { energy: +50, hunger: +5 },
        room: 'bedroom',
    },

    // === PLAY & EXERCISE ===
    PLAY: {
        name: 'Play',
        cost: 0,
        effects: { happiness: +30, energy: -20 },
        room: 'living',
    },
    WALK: {
        name: 'Go for a Walk',
        cost: 0,
        effects: { happiness: +25, energy: -15, hunger: +10 },
        room: 'outdoors',
    },
    GYM_WORKOUT: {
        name: 'Gym Workout',
        cost: 0,
        effects: { happiness: +20, energy: -30, cleanliness: -15 },
        room: 'gym',
    },
    FETCH: {
        name: 'Play Fetch',
        cost: 0,
        effects: { happiness: +35, energy: -25 },
        room: 'outdoors',
    },

    // === HYGIENE ===
    BATHE: {
        name: 'Take a Bath',
        cost: 3,
        effects: { cleanliness: +50 },
        room: 'bathroom',
    },
    SHOWER: {
        name: 'Quick Shower',
        cost: 0,
        effects: { cleanliness: +30 },
        room: 'bathroom',
    },
    GROOM: {
        name: 'Grooming Session',
        cost: 5,
        effects: { cleanliness: +40, happiness: +10 },
        room: 'bathroom',
    },
    BRUSH_TEETH: {
        name: 'Brush Teeth',
        cost: 0,
        effects: { cleanliness: +10, health: +5 },
        room: 'bathroom',
    },

    // === SPECIAL ===
    VET_VISIT: {
        name: 'Visit the Vet',
        cost: 50,
        effects: { health: +30 },
        room: 'clinic',
    },
    SPA_DAY: {
        name: 'Spa Day',
        cost: 20,
        effects: { cleanliness: +50, happiness: +30, energy: +20 },
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
