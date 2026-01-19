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
}

export const BADGES: Badge[] = [
    // === SURVIVAL BADGES ===
    {
        id: 'SURVIVOR_1',
        name: 'First Day Survivor',
        description: 'Survived your first day!',
        icon: '🥉',
        category: 'survival',
        condition: (s) => s.totalDaysAlive >= 1,
    },
    {
        id: 'SURVIVOR_7',
        name: 'Week Warrior',
        description: 'Survived 7 days!',
        icon: '🥈',
        category: 'survival',
        condition: (s) => s.totalDaysAlive >= 7,
    },
    {
        id: 'SURVIVOR_30',
        name: 'Monthly Master',
        description: 'Survived 30 days!',
        icon: '🥇',
        category: 'survival',
        condition: (s) => s.totalDaysAlive >= 30,
    },

    // === CARE BADGES ===
    {
        id: 'CLEAN_FREAK',
        name: 'Clean Freak',
        description: 'Washed your pet 10 times!',
        icon: '🧼',
        category: 'care',
        condition: (s) => s.totalBaths >= 10,
    },
    {
        id: 'FOODIE',
        name: 'Foodie',
        description: 'Fed your pet 25 times!',
        icon: '🍖',
        category: 'care',
        condition: (s) => s.totalMeals >= 25,
    },
    {
        id: 'PLAYFUL',
        name: 'Playful Spirit',
        description: 'Played with your pet 20 times!',
        icon: '🎾',
        category: 'care',
        condition: (s) => s.totalPlaySessions >= 20,
    },
    {
        id: 'HAPPY_PET',
        name: 'Happy Pet',
        description: 'Keep happiness above 90%!',
        icon: '😊',
        category: 'care',
        condition: (s) => s.currentHappiness >= 90,
    },

    // === WEALTH BADGES ===
    {
        id: 'FIRST_HUNDRED',
        name: 'First Hundred',
        description: 'Earned $100 coins!',
        icon: '💰',
        category: 'wealth',
        condition: (s) => s.totalCoinsEarned >= 100,
    },
    {
        id: 'MILLIONAIRE',
        name: 'Millionaire',
        description: 'Earned $1,000 coins!',
        icon: '💎',
        category: 'wealth',
        condition: (s) => s.totalCoinsEarned >= 1000,
    },
    {
        id: 'BIG_SPENDER',
        name: 'Big Spender',
        description: 'Spent $500 on your pet!',
        icon: '🛍️',
        category: 'wealth',
        condition: (s) => s.totalCoinsSpent >= 500,
    },

    // === SPECIAL BADGES ===
    {
        id: 'PERFECT_DAY',
        name: 'Perfect Day',
        description: 'All stats above 80% at once!',
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
