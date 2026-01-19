/**
 * Achievements.ts
 * 
 * Badge definitions for the Achievement Engine.
 * Each badge has an ID, name, description, icon, and unlock condition.
 */

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'survival' | 'care' | 'wealth' | 'special';
    condition: (stats: BadgeCheckStats) => boolean;
}

export interface BadgeCheckStats {
    totalDaysAlive: number;
    totalBaths: number;
    totalMeals: number;
    totalCoinsEarned: number;
    totalCoinsSpent: number;
    totalPlaySessions: number;
    currentHealth: number;
    currentHappiness: number;
    currentCleanliness: number;
    currentBalance?: number; // Wallet balance for wealth checks
}

export const BADGES: Badge[] = [
    // === CARE BADGES ===
    {
        id: 'clean_1',
        name: 'Squeaky Clean',
        description: 'Wash Duke 1 time',
        icon: '🧼',
        category: 'care',
        condition: (s) => s.totalBaths >= 1,
    },
    {
        id: 'clean_10',
        name: 'Spa Manager',
        description: 'Wash Duke 10 times',
        icon: '🛁',
        category: 'care',
        condition: (s) => s.totalBaths >= 10,
    },
    {
        id: 'feeder_5',
        name: 'Chef',
        description: 'Feed Duke 5 times',
        icon: '🍖',
        category: 'care',
        condition: (s) => s.totalMeals >= 5,
    },
    {
        id: 'feeder_25',
        name: 'Master Chef',
        description: 'Feed Duke 25 times',
        icon: '👨‍🍳',
        category: 'care',
        condition: (s) => s.totalMeals >= 25,
    },
    {
        id: 'playful_10',
        name: 'Playful Spirit',
        description: 'Play with Duke 10 times',
        icon: '🎾',
        category: 'care',
        condition: (s) => s.totalPlaySessions >= 10,
    },

    // === WEALTH BADGES ===
    {
        id: 'rich_500',
        name: 'Pocket Change',
        description: 'Have $500 in wallet',
        icon: '💰',
        category: 'wealth',
        condition: (s) => (s.currentBalance ?? 0) >= 500,
    },
    {
        id: 'rich_1000',
        name: 'Millionaire',
        description: 'Have $1,000 in wallet',
        icon: '💎',
        category: 'wealth',
        condition: (s) => (s.currentBalance ?? 0) >= 1000,
    },
    {
        id: 'spender_500',
        name: 'Big Spender',
        description: 'Spend $500 on your pet',
        icon: '🛍️',
        category: 'wealth',
        condition: (s) => s.totalCoinsSpent >= 500,
    },

    // === SURVIVAL BADGES ===
    {
        id: 'survivor_1',
        name: 'Survivor',
        description: 'Keep stats > 0 for 24 hours',
        icon: '🏕️',
        category: 'survival',
        condition: (s) => s.totalDaysAlive >= 1,
    },
    {
        id: 'survivor_7',
        name: 'Week Warrior',
        description: 'Keep Duke alive for 7 days',
        icon: '🥈',
        category: 'survival',
        condition: (s) => s.totalDaysAlive >= 7,
    },
    {
        id: 'survivor_30',
        name: 'Monthly Master',
        description: 'Keep Duke alive for 30 days',
        icon: '🥇',
        category: 'survival',
        condition: (s) => s.totalDaysAlive >= 30,
    },

    // === SPECIAL BADGES ===
    {
        id: 'happy_pet',
        name: 'Happy Pet',
        description: 'Keep happiness above 90%',
        icon: '😊',
        category: 'special',
        condition: (s) => s.currentHappiness >= 90,
    },
    {
        id: 'perfect_day',
        name: 'Perfect Day',
        description: 'All stats above 80% at once',
        icon: '⭐',
        category: 'special',
        condition: (s) => s.currentHealth >= 80 && s.currentHappiness >= 80 && s.currentCleanliness >= 80,
    },
];

// Helper to get badge by ID
export function getBadgeById(id: string): Badge | undefined {
    return BADGES.find(b => b.id === id);
}

// Helper to check which badges are newly unlocked
export function checkNewBadges(
    currentBadges: string[],
    stats: BadgeCheckStats
): Badge[] {
    return BADGES.filter(badge =>
        !currentBadges.includes(badge.id) && badge.condition(stats)
    );
}
