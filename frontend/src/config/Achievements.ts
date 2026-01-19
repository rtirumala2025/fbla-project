/**
 * Achievements.ts
 * 
 * Badge Registry for the Sticker Collection.
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
    currentBalance?: number;
}

export const BADGES: Badge[] = [
    // === HYGIENE BADGES ===
    {
        id: 'clean_1',
        name: 'Bubble Cadet',
        description: 'Wash Duke 1 time',
        icon: '🧼',
        category: 'care',
        condition: (s) => s.totalBaths >= 1,
    },
    {
        id: 'clean_10',
        name: 'Soap Opera Star',
        description: 'Wash Duke 10 times',
        icon: '🛁',
        category: 'care',
        condition: (s) => s.totalBaths >= 10,
    },
    {
        id: 'clean_50',
        name: 'The Sparkle King',
        description: 'Wash Duke 50 times',
        icon: '✨',
        category: 'care',
        condition: (s) => s.totalBaths >= 50,
    },

    // === FEEDING BADGES ===
    {
        id: 'food_5',
        name: 'Snack Time',
        description: 'Feed Duke 5 times',
        icon: '🥪',
        category: 'care',
        condition: (s) => s.totalMeals >= 5,
    },
    {
        id: 'food_10',
        name: 'Gourmet',
        description: 'Feed Duke 10 times',
        icon: '🍗',
        category: 'care',
        condition: (s) => s.totalMeals >= 10,
    },
    {
        id: 'food_50',
        name: 'Master Chef',
        description: 'Feed Duke 50 times',
        icon: '👨‍🍳',
        category: 'care',
        condition: (s) => s.totalMeals >= 50,
    },

    // === WEALTH BADGES ===
    {
        id: 'rich_100',
        name: 'Piggy Banker',
        description: 'Earn $100 total',
        icon: '🐖',
        category: 'wealth',
        condition: (s) => s.totalCoinsEarned >= 100,
    },
    {
        id: 'rich_500',
        name: 'Money Bags',
        description: 'Earn $500 total',
        icon: '💰',
        category: 'wealth',
        condition: (s) => s.totalCoinsEarned >= 500,
    },
    {
        id: 'rich_1000',
        name: 'Tycoon',
        description: 'Earn $1,000 total',
        icon: '💎',
        category: 'wealth',
        condition: (s) => s.totalCoinsEarned >= 1000,
    },
    {
        id: 'spender_500',
        name: 'Big Spender',
        description: 'Spend $500 on Duke',
        icon: '🛍️',
        category: 'wealth',
        condition: (s) => s.totalCoinsSpent >= 500,
    },

    // === SURVIVAL BADGES ===
    {
        id: 'survivor_1',
        name: 'Day One',
        description: 'Survive 1 day',
        icon: '🌅',
        category: 'survival',
        condition: (s) => s.totalDaysAlive >= 1,
    },
    {
        id: 'survivor_7',
        name: 'Week Warrior',
        description: 'Survive 7 days',
        icon: '🏕️',
        category: 'survival',
        condition: (s) => s.totalDaysAlive >= 7,
    },
    {
        id: 'survivor_30',
        name: 'Monthly Master',
        description: 'Survive 30 days',
        icon: '🏆',
        category: 'survival',
        condition: (s) => s.totalDaysAlive >= 30,
    },

    // === SPECIAL BADGES ===
    {
        id: 'happy_pet',
        name: 'Pure Joy',
        description: 'Reach 90% happiness',
        icon: '😊',
        category: 'special',
        condition: (s) => s.currentHappiness >= 90,
    },
    {
        id: 'perfect_day',
        name: 'Perfect Day',
        description: 'All stats above 80%',
        icon: '⭐',
        category: 'special',
        condition: (s) => s.currentHealth >= 80 && s.currentHappiness >= 80 && s.currentCleanliness >= 80,
    },
    {
        id: 'play_10',
        name: 'Playful Spirit',
        description: 'Play 10 times',
        icon: '🎾',
        category: 'special',
        condition: (s) => s.totalPlaySessions >= 10,
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
