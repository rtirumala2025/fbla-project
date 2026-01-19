/**
 * Achievements.ts
 * 
 * Badge Registry with progress tracking, lore, and guides.
 */

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'survival' | 'care' | 'wealth' | 'special';
    target: number;
    statKey: keyof BadgeCheckStats;
    lore: string;
    guide: string;
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
        target: 1,
        statKey: 'totalBaths',
        lore: 'Every bubble warrior starts somewhere. Duke\'s first bath is a milestone!',
        guide: 'Go to the Bathroom and use the Bubble Bath button once.',
        condition: (s) => s.totalBaths >= 1,
    },
    {
        id: 'clean_10',
        name: 'Soap Opera Star',
        description: 'Wash Duke 10 times',
        icon: '🛁',
        category: 'care',
        target: 10,
        statKey: 'totalBaths',
        lore: 'Duke\'s fur glistens like a celebrity on the red carpet. Pure spa royalty!',
        guide: 'Keep visiting the Bathroom and scrubbing Duke 10 times total.',
        condition: (s) => s.totalBaths >= 10,
    },
    {
        id: 'clean_50',
        name: 'The Sparkle King',
        description: 'Wash Duke 50 times',
        icon: '✨',
        category: 'care',
        target: 50,
        statKey: 'totalBaths',
        lore: 'Duke sparkles so bright, satellites can see him from space!',
        guide: 'Commit to 50 bath sessions. Duke will be legendary.',
        condition: (s) => s.totalBaths >= 50,
    },

    // === FEEDING BADGES ===
    {
        id: 'food_5',
        name: 'Snack Time',
        description: 'Feed Duke 5 times',
        icon: '🥪',
        category: 'care',
        target: 5,
        statKey: 'totalMeals',
        lore: 'A full belly means a happy pup. Duke appreciates the snacks!',
        guide: 'Feed Duke any food 5 times from the Kitchen.',
        condition: (s) => s.totalMeals >= 5,
    },
    {
        id: 'food_10',
        name: 'Gourmet',
        description: 'Feed Duke 10 times',
        icon: '🍗',
        category: 'care',
        target: 10,
        statKey: 'totalMeals',
        lore: 'Duke\'s palate is refined. Only the finest kibble for this connoisseur!',
        guide: 'Keep feeding Duke until you hit 10 meals.',
        condition: (s) => s.totalMeals >= 10,
    },
    {
        id: 'food_50',
        name: 'Master Chef',
        description: 'Feed Duke 50 times',
        icon: '👨‍🍳',
        category: 'care',
        target: 50,
        statKey: 'totalMeals',
        lore: 'Duke trusts you completely. You are the ultimate provider!',
        guide: 'A journey of 50 meals. Dedication at its finest.',
        condition: (s) => s.totalMeals >= 50,
    },

    // === WEALTH BADGES ===
    {
        id: 'rich_100',
        name: 'Piggy Banker',
        description: 'Earn $100 total',
        icon: '🐖',
        category: 'wealth',
        target: 100,
        statKey: 'totalCoinsEarned',
        lore: 'Your piggy bank is getting heavy. Smart saving!',
        guide: 'Earn coins by completing chores or playing minigames.',
        condition: (s) => s.totalCoinsEarned >= 100,
    },
    {
        id: 'rich_500',
        name: 'Money Bags',
        description: 'Earn $500 total',
        icon: '💰',
        category: 'wealth',
        target: 500,
        statKey: 'totalCoinsEarned',
        lore: 'Cha-ching! You\'re becoming a financial whiz!',
        guide: 'Keep grinding those coins. $500 is within reach!',
        condition: (s) => s.totalCoinsEarned >= 500,
    },
    {
        id: 'rich_1000',
        name: 'Tycoon',
        description: 'Earn $1,000 total',
        icon: '💎',
        category: 'wealth',
        target: 1000,
        statKey: 'totalCoinsEarned',
        lore: 'You\'ve built an empire. Duke lives like royalty!',
        guide: 'Accumulate $1,000 in total earnings. True wealth!',
        condition: (s) => s.totalCoinsEarned >= 1000,
    },
    {
        id: 'spender_500',
        name: 'Big Spender',
        description: 'Spend $500 on Duke',
        icon: '🛍️',
        category: 'wealth',
        target: 500,
        statKey: 'totalCoinsSpent',
        lore: 'Duke is spoiled rotten - and he loves it!',
        guide: 'Spend $500 total on food, items, or services.',
        condition: (s) => s.totalCoinsSpent >= 500,
    },

    // === SURVIVAL BADGES ===
    {
        id: 'survivor_1',
        name: 'Day One',
        description: 'Survive 1 day',
        icon: '🌅',
        category: 'survival',
        target: 1,
        statKey: 'totalDaysAlive',
        lore: 'The journey of a thousand days begins with the first sunrise.',
        guide: 'Keep Duke\'s stats above zero for 24 hours.',
        condition: (s) => s.totalDaysAlive >= 1,
    },
    {
        id: 'survivor_7',
        name: 'Week Warrior',
        description: 'Survive 7 days',
        icon: '🏕️',
        category: 'survival',
        target: 7,
        statKey: 'totalDaysAlive',
        lore: 'A full week of pet parenting! You\'re getting the hang of this.',
        guide: 'Log in daily and care for Duke for one full week.',
        condition: (s) => s.totalDaysAlive >= 7,
    },
    {
        id: 'survivor_30',
        name: 'Monthly Master',
        description: 'Survive 30 days',
        icon: '🏆',
        category: 'survival',
        target: 30,
        statKey: 'totalDaysAlive',
        lore: 'A month of love and care. Duke is family now.',
        guide: 'Commit to 30 days of consistent care.',
        condition: (s) => s.totalDaysAlive >= 30,
    },

    // === SPECIAL BADGES ===
    {
        id: 'happy_pet',
        name: 'Pure Joy',
        description: 'Reach 90% happiness',
        icon: '😊',
        category: 'special',
        target: 90,
        statKey: 'currentHappiness',
        lore: 'Duke is radiating pure happiness! Look at that tail wag!',
        guide: 'Boost happiness by playing and giving treats.',
        condition: (s) => s.currentHappiness >= 90,
    },
    {
        id: 'perfect_day',
        name: 'Perfect Day',
        description: 'All stats above 80%',
        icon: '⭐',
        category: 'special',
        target: 80,
        statKey: 'currentHealth',
        lore: 'A day where everything clicked. Duke is thriving!',
        guide: 'Get Health, Happiness, and Cleanliness all above 80% at once.',
        condition: (s) => s.currentHealth >= 80 && s.currentHappiness >= 80 && s.currentCleanliness >= 80,
    },
    {
        id: 'play_10',
        name: 'Playful Spirit',
        description: 'Play 10 times',
        icon: '🎾',
        category: 'special',
        target: 10,
        statKey: 'totalPlaySessions',
        lore: 'Duke\'s energy is boundless when you\'re around!',
        guide: 'Visit the living room and play with Duke 10 times.',
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

// Helper to get current progress for a badge
export function getBadgeProgress(badge: Badge, stats: BadgeCheckStats): number {
    const current = stats[badge.statKey] ?? 0;
    return typeof current === 'number' ? current : 0;
}
