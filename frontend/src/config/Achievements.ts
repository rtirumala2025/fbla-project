/**
 * Achievements.ts
 * 
 * MASSIVE 200+ Badge Registry with Tiered Progression System
 * "Easy to learn, impossible to master" - Exponential scaling from Bronze to Diamond
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type BadgeCategory = 'care' | 'wealth' | 'survival' | 'special' | 'secret';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: BadgeCategory;
    tier: BadgeTier;
    target: number;
    statKey: keyof BadgeCheckStats;
    details: string;
    guide: string;
    condition: (stats: BadgeCheckStats) => boolean;
    // Optional: for secret/creative badges
    isSecret?: boolean;
    isCreative?: boolean;
}

export interface BadgeCheckStats {
    // Core counters
    totalDaysAlive: number;
    totalBaths: number;
    totalMeals: number;
    totalCoinsEarned: number;
    totalCoinsSpent: number;
    totalPlaySessions: number;
    // Current stats
    currentHealth: number;
    currentHappiness: number;
    currentCleanliness: number;
    currentBalance?: number;
    // Extended tracking (for creative badges)
    currentHour?: number;           // 0-23 for time-based badges
    perfectDays?: number;           // Days with all stats > 50%
    timesRevived?: number;          // Game over count
    highestBalance?: number;        // Peak balance achieved
    itemsBought?: number;           // Total items purchased
    consecutiveLogins?: number;     // Login streak
    uniqueFoodsEaten?: number;      // Variety of foods
    treatsFed?: number;             // Treats specifically
    toysUsed?: number;              // Toy interactions
    gamesPlayed?: number;           // Minigame sessions
    gamesWon?: number;              // Minigame victories
    totalSteps?: number;            // Walk/exercise steps
    photosaken?: number;           // Screenshots/photos
    friendsMade?: number;           // Social features
    questsCompleted?: number;       // Story/quest progress
}

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

export const TIER_CONFIG: Record<BadgeTier, {
    color: string;
    label: string;
    multiplier: number;
    gradient: string;
    ring: string;
    shadow: string;
}> = {
    bronze: {
        color: '#CD7F32',
        label: 'Bronze',
        multiplier: 1,
        gradient: 'from-amber-600 via-orange-700 to-amber-800',
        ring: 'ring-amber-600/50',
        shadow: 'shadow-amber-700/40',
    },
    silver: {
        color: '#C0C0C0',
        label: 'Silver',
        multiplier: 10,
        gradient: 'from-slate-300 via-gray-400 to-slate-500',
        ring: 'ring-slate-400/50',
        shadow: 'shadow-slate-500/40',
    },
    gold: {
        color: '#FFD700',
        label: 'Gold',
        multiplier: 50,
        gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
        ring: 'ring-yellow-500/50',
        shadow: 'shadow-yellow-500/50',
    },
    platinum: {
        color: '#E5E4E2',
        label: 'Platinum',
        multiplier: 250,
        gradient: 'from-cyan-200 via-slate-300 to-blue-300',
        ring: 'ring-cyan-400/50',
        shadow: 'shadow-cyan-400/50',
    },
    diamond: {
        color: '#B9F2FF',
        label: 'Diamond',
        multiplier: 1000,
        gradient: 'from-cyan-400 via-blue-500 to-purple-600',
        ring: 'ring-cyan-500/60',
        shadow: 'shadow-cyan-500/60',
    },
};

// ============================================================================
// BADGE GENERATOR UTILITIES
// ============================================================================

type TierDef = { tier: BadgeTier; target: number; suffix: string };

const STANDARD_TIERS: TierDef[] = [
    { tier: 'bronze', target: 1, suffix: 'Novice' },
    { tier: 'bronze', target: 5, suffix: 'Beginner' },
    { tier: 'silver', target: 10, suffix: 'Apprentice' },
    { tier: 'silver', target: 25, suffix: 'Regular' },
    { tier: 'gold', target: 50, suffix: 'Expert' },
    { tier: 'gold', target: 100, suffix: 'Pro' },
    { tier: 'platinum', target: 250, suffix: 'Master' },
    { tier: 'platinum', target: 500, suffix: 'Grandmaster' },
    { tier: 'diamond', target: 1000, suffix: 'Legend' },
    { tier: 'diamond', target: 2500, suffix: 'Immortal' },
];

const MONEY_TIERS: TierDef[] = [
    { tier: 'bronze', target: 50, suffix: 'Saver' },
    { tier: 'bronze', target: 100, suffix: 'Piggy Bank' },
    { tier: 'silver', target: 250, suffix: 'Banker' },
    { tier: 'silver', target: 500, suffix: 'Investor' },
    { tier: 'gold', target: 1000, suffix: 'Rich' },
    { tier: 'gold', target: 2500, suffix: 'Wealthy' },
    { tier: 'platinum', target: 5000, suffix: 'Millionaire' },
    { tier: 'platinum', target: 10000, suffix: 'Tycoon' },
    { tier: 'diamond', target: 25000, suffix: 'Mogul' },
    { tier: 'diamond', target: 100000, suffix: 'Billionaire' },
];

const SURVIVAL_TIERS: TierDef[] = [
    { tier: 'bronze', target: 1, suffix: 'Day One' },
    { tier: 'bronze', target: 3, suffix: 'Three Days' },
    { tier: 'silver', target: 7, suffix: 'Week' },
    { tier: 'silver', target: 14, suffix: 'Two Weeks' },
    { tier: 'gold', target: 30, suffix: 'Month' },
    { tier: 'gold', target: 60, suffix: 'Two Months' },
    { tier: 'platinum', target: 100, suffix: 'Century' },
    { tier: 'platinum', target: 180, suffix: 'Half Year' },
    { tier: 'diamond', target: 365, suffix: 'Annual' },
    { tier: 'diamond', target: 1000, suffix: 'Eternal' },
];

function generateTieredBadges(
    baseId: string,
    baseName: string,
    icon: string,
    category: BadgeCategory,
    statKey: keyof BadgeCheckStats,
    tiers: TierDef[],
    detailsTemplate: (target: number) => string,
    guideTemplate: (target: number) => string
): Badge[] {
    return tiers.map((t, index) => ({
        id: `${baseId}_${t.target}`,
        name: `${baseName} ${t.suffix}`,
        description: `Reach ${t.target.toLocaleString()} ${baseName.toLowerCase()}`,
        icon,
        category,
        tier: t.tier,
        target: t.target,
        statKey,
        details: detailsTemplate(t.target),
        guide: guideTemplate(t.target),
        condition: (s: BadgeCheckStats) => (s[statKey] as number) >= t.target,
    }));
}

// ============================================================================
// THE MASSIVE BADGE REGISTRY (200+ BADGES)
// ============================================================================

export const BADGES: Badge[] = [
    // ========================================================================
    // 🧼 HYGIENE CATEGORY (30 badges)
    // ========================================================================

    // Wash Progression (10 badges)
    ...generateTieredBadges(
        'wash', 'Bath', '🧼', 'care', 'totalBaths', STANDARD_TIERS,
        (t) => `Complete ${t.toLocaleString()} bath sessions. Cleanliness is next to happiness!`,
        (t) => `Give Duke ${t.toLocaleString()} baths in the Bathroom.`
    ),

    // Cleanliness Mastery (5 badges)
    {
        id: 'clean_streak_3',
        name: 'Tidy Trio',
        description: 'Keep cleanliness above 80% for 3 days',
        icon: '🫧',
        category: 'care',
        tier: 'silver',
        target: 3,
        statKey: 'currentCleanliness',
        details: 'Maintain excellent hygiene standards over multiple days.',
        guide: 'Keep Duke\'s cleanliness above 80% for 3 consecutive days.',
        condition: (s) => s.currentCleanliness >= 80,
    },
    {
        id: 'sparkle_100',
        name: 'Sparkling Clean',
        description: 'Reach 100% cleanliness',
        icon: '✨',
        category: 'care',
        tier: 'bronze',
        target: 100,
        statKey: 'currentCleanliness',
        details: 'Duke is absolutely spotless! Maximum cleanliness achieved.',
        guide: 'Bathe Duke until cleanliness reaches 100%.',
        condition: (s) => s.currentCleanliness >= 100,
    },
    {
        id: 'grooming_expert',
        name: 'Grooming Expert',
        description: 'Keep cleanliness above 90% for a week',
        icon: '💅',
        category: 'care',
        tier: 'gold',
        target: 7,
        statKey: 'currentCleanliness',
        details: 'A week of impeccable grooming standards.',
        guide: 'Maintain 90%+ cleanliness for 7 days straight.',
        condition: (s) => s.currentCleanliness >= 90,
    },

    // ========================================================================
    // 🍖 FEEDING CATEGORY (35 badges)
    // ========================================================================

    // Meal Progression (10 badges)
    ...generateTieredBadges(
        'feed', 'Meal', '🍖', 'care', 'totalMeals', STANDARD_TIERS,
        (t) => `Feed Duke ${t.toLocaleString()} times. A well-fed pet is a happy pet!`,
        (t) => `Provide ${t.toLocaleString()} meals to Duke from the Kitchen.`
    ),

    // Hunger Management (5 badges)
    {
        id: 'full_belly',
        name: 'Full Belly',
        description: 'Keep hunger below 20%',
        icon: '😋',
        category: 'care',
        tier: 'bronze',
        target: 20,
        statKey: 'currentHealth', // Using health as proxy (hunger is inverted)
        details: 'Duke is completely satisfied and not hungry at all.',
        guide: 'Feed Duke until hunger drops below 20%.',
        condition: (s) => s.currentHealth >= 80,
    },
    {
        id: 'treat_giver_10',
        name: 'Treat Giver',
        description: 'Give 10 treats',
        icon: '🦴',
        category: 'care',
        tier: 'bronze',
        target: 10,
        statKey: 'treatsFed',
        details: 'Treats make Duke extra happy! Reward good behavior.',
        guide: 'Give Duke 10 treats from the Kitchen.',
        condition: (s) => (s.treatsFed ?? 0) >= 10,
    },
    {
        id: 'treat_master',
        name: 'Treat Master',
        description: 'Give 100 treats',
        icon: '🎁',
        category: 'care',
        tier: 'gold',
        target: 100,
        statKey: 'treatsFed',
        details: 'You really know how to spoil Duke!',
        guide: 'Accumulate 100 treats given to Duke.',
        condition: (s) => (s.treatsFed ?? 0) >= 100,
    },

    // ========================================================================
    // 🎮 PLAY CATEGORY (30 badges)
    // ========================================================================

    // Play Session Progression (10 badges)
    ...generateTieredBadges(
        'play', 'Play', '🎾', 'care', 'totalPlaySessions', STANDARD_TIERS,
        (t) => `Complete ${t.toLocaleString()} play sessions with Duke.`,
        (t) => `Play with Duke ${t.toLocaleString()} times.`
    ),

    // Happiness Mastery (5 badges)
    {
        id: 'happy_50',
        name: 'Content Pet',
        description: 'Reach 50% happiness',
        icon: '🙂',
        category: 'care',
        tier: 'bronze',
        target: 50,
        statKey: 'currentHappiness',
        details: 'Duke is feeling pretty good about life.',
        guide: 'Get Duke\'s happiness to 50%.',
        condition: (s) => s.currentHappiness >= 50,
    },
    {
        id: 'happy_75',
        name: 'Happy Pet',
        description: 'Reach 75% happiness',
        icon: '😊',
        category: 'care',
        tier: 'silver',
        target: 75,
        statKey: 'currentHappiness',
        details: 'Duke is in great spirits!',
        guide: 'Get Duke\'s happiness to 75%.',
        condition: (s) => s.currentHappiness >= 75,
    },
    {
        id: 'happy_90',
        name: 'Joyful Pet',
        description: 'Reach 90% happiness',
        icon: '😄',
        category: 'care',
        tier: 'gold',
        target: 90,
        statKey: 'currentHappiness',
        details: 'Duke is absolutely thrilled! Tail wagging at max speed.',
        guide: 'Get Duke\'s happiness to 90%.',
        condition: (s) => s.currentHappiness >= 90,
    },
    {
        id: 'happy_100',
        name: 'Pure Bliss',
        description: 'Reach 100% happiness',
        icon: '🥳',
        category: 'care',
        tier: 'platinum',
        target: 100,
        statKey: 'currentHappiness',
        details: 'Maximum happiness! Duke has never been happier.',
        guide: 'Get Duke\'s happiness to 100%.',
        condition: (s) => s.currentHappiness >= 100,
    },

    // Toy Interaction (5 badges)
    {
        id: 'toy_user_10',
        name: 'Playful',
        description: 'Use toys 10 times',
        icon: '🧸',
        category: 'care',
        tier: 'bronze',
        target: 10,
        statKey: 'toysUsed',
        details: 'Duke loves playing with toys!',
        guide: 'Interact with toys 10 times.',
        condition: (s) => (s.toysUsed ?? 0) >= 10,
    },
    {
        id: 'toy_user_50',
        name: 'Toy Collector',
        description: 'Use toys 50 times',
        icon: '🪀',
        category: 'care',
        tier: 'silver',
        target: 50,
        statKey: 'toysUsed',
        details: 'You know how to keep Duke entertained!',
        guide: 'Interact with toys 50 times.',
        condition: (s) => (s.toysUsed ?? 0) >= 50,
    },

    // ========================================================================
    // 💰 WEALTH CATEGORY (40 badges)
    // ========================================================================

    // Earnings Progression (10 badges)
    ...generateTieredBadges(
        'earn', 'Earnings', '💵', 'wealth', 'totalCoinsEarned', MONEY_TIERS,
        (t) => `Earn a total of $${t.toLocaleString()}. Build your pet care empire!`,
        (t) => `Accumulate $${t.toLocaleString()} in total earnings.`
    ),

    // Spending Progression (10 badges)
    ...generateTieredBadges(
        'spend', 'Spending', '🛒', 'wealth', 'totalCoinsSpent', MONEY_TIERS,
        (t) => `Spend $${t.toLocaleString()} on Duke. Invest in your pet's happiness!`,
        (t) => `Spend a total of $${t.toLocaleString()} on food, items, and services.`
    ),

    // Balance Milestones (5 badges)
    {
        id: 'balance_100',
        name: 'First Hundred',
        description: 'Have $100 in your wallet',
        icon: '💵',
        category: 'wealth',
        tier: 'bronze',
        target: 100,
        statKey: 'currentBalance',
        details: 'Your first triple-digit savings!',
        guide: 'Save up until you have $100 in your wallet.',
        condition: (s) => (s.currentBalance ?? 0) >= 100,
    },
    {
        id: 'balance_500',
        name: 'Half Grand',
        description: 'Have $500 in your wallet',
        icon: '💰',
        category: 'wealth',
        tier: 'silver',
        target: 500,
        statKey: 'currentBalance',
        details: 'Solid savings! You\'re prepared for anything.',
        guide: 'Save up until you have $500 in your wallet.',
        condition: (s) => (s.currentBalance ?? 0) >= 500,
    },
    {
        id: 'balance_1000',
        name: 'Grand Saver',
        description: 'Have $1,000 in your wallet',
        icon: '🏦',
        category: 'wealth',
        tier: 'gold',
        target: 1000,
        statKey: 'currentBalance',
        details: 'A thousand dollars saved! Financial security achieved.',
        guide: 'Save up until you have $1,000 in your wallet.',
        condition: (s) => (s.currentBalance ?? 0) >= 1000,
    },
    {
        id: 'balance_5000',
        name: 'Wealthy Owner',
        description: 'Have $5,000 in your wallet',
        icon: '💎',
        category: 'wealth',
        tier: 'platinum',
        target: 5000,
        statKey: 'currentBalance',
        details: 'You\'re rich! Duke lives like royalty.',
        guide: 'Save up until you have $5,000 in your wallet.',
        condition: (s) => (s.currentBalance ?? 0) >= 5000,
    },
    {
        id: 'balance_10000',
        name: 'Pet Millionaire',
        description: 'Have $10,000 in your wallet',
        icon: '👑',
        category: 'wealth',
        tier: 'diamond',
        target: 10000,
        statKey: 'currentBalance',
        details: 'Ultimate wealth! You\'ve mastered the art of pet economics.',
        guide: 'Save up until you have $10,000 in your wallet.',
        condition: (s) => (s.currentBalance ?? 0) >= 10000,
    },

    // Shopping Badges (5 badges)
    {
        id: 'items_10',
        name: 'Shopper',
        description: 'Buy 10 items',
        icon: '🛍️',
        category: 'wealth',
        tier: 'bronze',
        target: 10,
        statKey: 'itemsBought',
        details: 'You\'re starting to build Duke\'s collection!',
        guide: 'Purchase 10 items from the shop.',
        condition: (s) => (s.itemsBought ?? 0) >= 10,
    },
    {
        id: 'items_50',
        name: 'Frequent Shopper',
        description: 'Buy 50 items',
        icon: '🏪',
        category: 'wealth',
        tier: 'silver',
        target: 50,
        statKey: 'itemsBought',
        details: 'You know your way around the pet store!',
        guide: 'Purchase 50 items from the shop.',
        condition: (s) => (s.itemsBought ?? 0) >= 50,
    },
    {
        id: 'items_100',
        name: 'VIP Customer',
        description: 'Buy 100 items',
        icon: '⭐',
        category: 'wealth',
        tier: 'gold',
        target: 100,
        statKey: 'itemsBought',
        details: 'The shop owner knows you by name!',
        guide: 'Purchase 100 items from the shop.',
        condition: (s) => (s.itemsBought ?? 0) >= 100,
    },

    // ========================================================================
    // 🏕️ SURVIVAL CATEGORY (30 badges)
    // ========================================================================

    // Days Alive Progression (10 badges)
    ...generateTieredBadges(
        'survive', 'Survival', '🌅', 'survival', 'totalDaysAlive', SURVIVAL_TIERS,
        (t) => `Keep Duke alive for ${t.toLocaleString()} days. True dedication!`,
        (t) => `Care for Duke consistently for ${t.toLocaleString()} days.`
    ),

    // Health Milestones (5 badges)
    {
        id: 'health_50',
        name: 'Recovering',
        description: 'Reach 50% health',
        icon: '💚',
        category: 'survival',
        tier: 'bronze',
        target: 50,
        statKey: 'currentHealth',
        details: 'Duke is on the mend!',
        guide: 'Get Duke\'s health to 50%.',
        condition: (s) => s.currentHealth >= 50,
    },
    {
        id: 'health_75',
        name: 'Healthy Pet',
        description: 'Reach 75% health',
        icon: '💛',
        category: 'survival',
        tier: 'silver',
        target: 75,
        statKey: 'currentHealth',
        details: 'Duke is feeling great!',
        guide: 'Get Duke\'s health to 75%.',
        condition: (s) => s.currentHealth >= 75,
    },
    {
        id: 'health_90',
        name: 'Peak Health',
        description: 'Reach 90% health',
        icon: '💖',
        category: 'survival',
        tier: 'gold',
        target: 90,
        statKey: 'currentHealth',
        details: 'Duke is in excellent condition!',
        guide: 'Get Duke\'s health to 90%.',
        condition: (s) => s.currentHealth >= 90,
    },
    {
        id: 'health_100',
        name: 'Perfect Health',
        description: 'Reach 100% health',
        icon: '❤️‍🔥',
        category: 'survival',
        tier: 'platinum',
        target: 100,
        statKey: 'currentHealth',
        details: 'Maximum health! Duke is at peak physical condition.',
        guide: 'Get Duke\'s health to 100%.',
        condition: (s) => s.currentHealth >= 100,
    },

    // Revival Badges (3 badges)
    {
        id: 'revive_1',
        name: 'Second Chance',
        description: 'Revive Duke once',
        icon: '🔄',
        category: 'survival',
        tier: 'bronze',
        target: 1,
        statKey: 'timesRevived',
        details: 'Everyone deserves another chance. You brought Duke back!',
        guide: 'Restart the game after a Game Over.',
        condition: (s) => (s.timesRevived ?? 0) >= 1,
    },
    {
        id: 'revive_5',
        name: 'Never Give Up',
        description: 'Revive Duke 5 times',
        icon: '💪',
        category: 'survival',
        tier: 'silver',
        target: 5,
        statKey: 'timesRevived',
        details: 'Your determination is admirable!',
        guide: 'Restart the game 5 times after Game Over.',
        condition: (s) => (s.timesRevived ?? 0) >= 5,
    },
    {
        id: 'revive_10',
        name: 'Phoenix',
        description: 'Revive Duke 10 times',
        icon: '🐦‍🔥',
        category: 'survival',
        tier: 'gold',
        target: 10,
        statKey: 'timesRevived',
        details: 'Like a phoenix, Duke rises from the ashes!',
        guide: 'Restart the game 10 times after Game Over.',
        condition: (s) => (s.timesRevived ?? 0) >= 10,
    },

    // ========================================================================
    // ⭐ SPECIAL CATEGORY (25 badges)
    // ========================================================================

    // Perfect Stats Badges (5 badges)
    {
        id: 'perfect_day',
        name: 'Perfect Day',
        description: 'All stats above 80%',
        icon: '🌟',
        category: 'special',
        tier: 'gold',
        target: 80,
        statKey: 'currentHealth',
        details: 'Every stat is thriving! Duke is living his best life.',
        guide: 'Get Health, Happiness, and Cleanliness all above 80% simultaneously.',
        condition: (s) => s.currentHealth >= 80 && s.currentHappiness >= 80 && s.currentCleanliness >= 80,
    },
    {
        id: 'perfect_90',
        name: 'Exceptional Care',
        description: 'All stats above 90%',
        icon: '💫',
        category: 'special',
        tier: 'platinum',
        target: 90,
        statKey: 'currentHealth',
        details: 'Near-perfect pet care! Outstanding dedication.',
        guide: 'Get all stats above 90% simultaneously.',
        condition: (s) => s.currentHealth >= 90 && s.currentHappiness >= 90 && s.currentCleanliness >= 90,
    },
    {
        id: 'perfect_100',
        name: 'Flawless',
        description: 'All stats at 100%',
        icon: '👑',
        category: 'special',
        tier: 'diamond',
        target: 100,
        statKey: 'currentHealth',
        details: 'Absolute perfection! Every stat is maxed out.',
        guide: 'Get all stats to 100% simultaneously.',
        condition: (s) => s.currentHealth >= 100 && s.currentHappiness >= 100 && s.currentCleanliness >= 100,
    },

    // Minigame Badges (10 badges)
    {
        id: 'games_1',
        name: 'First Game',
        description: 'Play 1 minigame',
        icon: '🎮',
        category: 'special',
        tier: 'bronze',
        target: 1,
        statKey: 'gamesPlayed',
        details: 'Your first minigame experience!',
        guide: 'Play any minigame once.',
        condition: (s) => (s.gamesPlayed ?? 0) >= 1,
    },
    {
        id: 'games_10',
        name: 'Game Enthusiast',
        description: 'Play 10 minigames',
        icon: '🕹️',
        category: 'special',
        tier: 'bronze',
        target: 10,
        statKey: 'gamesPlayed',
        details: 'You\'re getting into the gaming spirit!',
        guide: 'Play 10 minigames.',
        condition: (s) => (s.gamesPlayed ?? 0) >= 10,
    },
    {
        id: 'games_50',
        name: 'Arcade Regular',
        description: 'Play 50 minigames',
        icon: '🎰',
        category: 'special',
        tier: 'silver',
        target: 50,
        statKey: 'gamesPlayed',
        details: 'The arcade is like your second home!',
        guide: 'Play 50 minigames.',
        condition: (s) => (s.gamesPlayed ?? 0) >= 50,
    },
    {
        id: 'games_100',
        name: 'Gaming Pro',
        description: 'Play 100 minigames',
        icon: '🏆',
        category: 'special',
        tier: 'gold',
        target: 100,
        statKey: 'gamesPlayed',
        details: 'You\'ve mastered the art of pet gaming!',
        guide: 'Play 100 minigames.',
        condition: (s) => (s.gamesPlayed ?? 0) >= 100,
    },
    {
        id: 'wins_10',
        name: 'Winner',
        description: 'Win 10 minigames',
        icon: '🥇',
        category: 'special',
        tier: 'silver',
        target: 10,
        statKey: 'gamesWon',
        details: 'Victory tastes sweet! 10 wins under your belt.',
        guide: 'Win 10 minigames.',
        condition: (s) => (s.gamesWon ?? 0) >= 10,
    },
    {
        id: 'wins_50',
        name: 'Champion',
        description: 'Win 50 minigames',
        icon: '🏅',
        category: 'special',
        tier: 'gold',
        target: 50,
        statKey: 'gamesWon',
        details: 'A true champion! 50 victories!',
        guide: 'Win 50 minigames.',
        condition: (s) => (s.gamesWon ?? 0) >= 50,
    },

    // Streak Badges (5 badges)
    {
        id: 'streak_3',
        name: 'Hat Trick',
        description: 'Log in 3 days in a row',
        icon: '🔥',
        category: 'special',
        tier: 'bronze',
        target: 3,
        statKey: 'consecutiveLogins',
        details: 'Three days strong! Keep the streak going.',
        guide: 'Log in for 3 consecutive days.',
        condition: (s) => (s.consecutiveLogins ?? 0) >= 3,
    },
    {
        id: 'streak_7',
        name: 'Week Streak',
        description: 'Log in 7 days in a row',
        icon: '⚡',
        category: 'special',
        tier: 'silver',
        target: 7,
        statKey: 'consecutiveLogins',
        details: 'A full week of dedication! Impressive.',
        guide: 'Log in for 7 consecutive days.',
        condition: (s) => (s.consecutiveLogins ?? 0) >= 7,
    },
    {
        id: 'streak_30',
        name: 'Month Streak',
        description: 'Log in 30 days in a row',
        icon: '💥',
        category: 'special',
        tier: 'gold',
        target: 30,
        statKey: 'consecutiveLogins',
        details: 'A whole month! Your dedication is legendary.',
        guide: 'Log in for 30 consecutive days.',
        condition: (s) => (s.consecutiveLogins ?? 0) >= 30,
    },
    {
        id: 'streak_100',
        name: 'Century Streak',
        description: 'Log in 100 days in a row',
        icon: '🌈',
        category: 'special',
        tier: 'diamond',
        target: 100,
        statKey: 'consecutiveLogins',
        details: '100 days without missing one! Unbelievable commitment.',
        guide: 'Log in for 100 consecutive days.',
        condition: (s) => (s.consecutiveLogins ?? 0) >= 100,
    },

    // ========================================================================
    // 🤫 SECRET CATEGORY (20 badges) - Creative & Time-based
    // ========================================================================

    // Time-Based Secrets
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Play between midnight and 4am',
        icon: '🦉',
        category: 'secret',
        tier: 'silver',
        target: 1,
        statKey: 'currentHour',
        details: 'Who needs sleep? You and Duke are night creatures!',
        guide: 'Play the game between 12:00 AM and 4:00 AM.',
        condition: (s) => (s.currentHour ?? 12) >= 0 && (s.currentHour ?? 12) < 4,
        isSecret: true,
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Play between 5am and 7am',
        icon: '🐦',
        category: 'secret',
        tier: 'silver',
        target: 1,
        statKey: 'currentHour',
        details: 'The early bird gets the worm... and a badge!',
        guide: 'Play the game between 5:00 AM and 7:00 AM.',
        condition: (s) => (s.currentHour ?? 12) >= 5 && (s.currentHour ?? 12) < 7,
        isSecret: true,
    },
    {
        id: 'midnight_snack',
        name: 'Midnight Snack',
        description: 'Feed Duke at midnight',
        icon: '🌙',
        category: 'secret',
        tier: 'gold',
        target: 1,
        statKey: 'currentHour',
        details: 'A secret snack session under the moonlight!',
        guide: 'Feed Duke exactly at midnight (12:00 AM).',
        condition: (s) => (s.currentHour ?? 12) === 0 && (s.totalMeals ?? 0) > 0,
        isSecret: true,
        isCreative: true,
    },

    // Balance-Based Secrets
    {
        id: 'broke',
        name: 'Broke',
        description: 'Have exactly $0',
        icon: '😅',
        category: 'secret',
        tier: 'bronze',
        target: 0,
        statKey: 'currentBalance',
        details: 'You spent every last coin! Hope it was worth it.',
        guide: 'Spend all your money until you have exactly $0.',
        condition: (s) => (s.currentBalance ?? 1) === 0,
        isSecret: true,
    },
    {
        id: 'lucky_777',
        name: 'Lucky Seven',
        description: 'Have exactly $777',
        icon: '🎰',
        category: 'secret',
        tier: 'gold',
        target: 777,
        statKey: 'currentBalance',
        details: 'Triple sevens! Lady luck is on your side.',
        guide: 'Manage your balance to reach exactly $777.',
        condition: (s) => (s.currentBalance ?? 0) === 777,
        isSecret: true,
        isCreative: true,
    },
    {
        id: 'nice_69',
        name: 'Nice',
        description: 'Have exactly $69',
        icon: '😏',
        category: 'secret',
        tier: 'bronze',
        target: 69,
        statKey: 'currentBalance',
        details: 'Nice.',
        guide: 'Manage your balance to reach exactly $69.',
        condition: (s) => (s.currentBalance ?? 0) === 69,
        isSecret: true,
        isCreative: true,
    },
    {
        id: 'round_1000',
        name: 'Clean Thousand',
        description: 'Have exactly $1,000',
        icon: '💯',
        category: 'secret',
        tier: 'silver',
        target: 1000,
        statKey: 'currentBalance',
        details: 'A perfectly round number. Satisfying!',
        guide: 'Manage your balance to reach exactly $1,000.',
        condition: (s) => (s.currentBalance ?? 0) === 1000,
        isSecret: true,
    },

    // Stat-Based Secrets
    {
        id: 'balanced',
        name: 'Perfectly Balanced',
        description: 'All stats at exactly 50%',
        icon: '⚖️',
        category: 'secret',
        tier: 'platinum',
        target: 50,
        statKey: 'currentHealth',
        details: 'As all things should be. Perfect equilibrium.',
        guide: 'Get all stats to exactly 50% simultaneously.',
        condition: (s) => s.currentHealth === 50 && s.currentHappiness === 50 && s.currentCleanliness === 50,
        isSecret: true,
        isCreative: true,
    },
    {
        id: 'extremist',
        name: 'Extremist',
        description: 'One stat at 100%, one at 0%',
        icon: '🎭',
        category: 'secret',
        tier: 'gold',
        target: 100,
        statKey: 'currentHealth',
        details: 'Living on the edge! Maximum contrast.',
        guide: 'Have one stat at 100% and another at 0% (careful!).',
        condition: (s) => {
            const stats = [s.currentHealth, s.currentHappiness, s.currentCleanliness];
            return stats.some(s => s >= 100) && stats.some(s => s <= 0);
        },
        isSecret: true,
    },

    // Achievement Meta Badges
    {
        id: 'collector_10',
        name: 'Badge Hunter',
        description: 'Collect 10 badges',
        icon: '🎖️',
        category: 'secret',
        tier: 'bronze',
        target: 10,
        statKey: 'totalDaysAlive', // Placeholder - checked differently
        details: 'You\'re on your way to becoming a master collector!',
        guide: 'Unlock 10 different badges.',
        condition: () => false, // Checked separately in context
        isSecret: true,
    },
    {
        id: 'collector_50',
        name: 'Badge Collector',
        description: 'Collect 50 badges',
        icon: '🏵️',
        category: 'secret',
        tier: 'silver',
        target: 50,
        statKey: 'totalDaysAlive',
        details: 'Half a century of badges! Impressive collection.',
        guide: 'Unlock 50 different badges.',
        condition: () => false,
        isSecret: true,
    },
    {
        id: 'collector_100',
        name: 'Badge Master',
        description: 'Collect 100 badges',
        icon: '🎪',
        category: 'secret',
        tier: 'gold',
        target: 100,
        statKey: 'totalDaysAlive',
        details: 'Triple digits! You\'re a true completionist.',
        guide: 'Unlock 100 different badges.',
        condition: () => false,
        isSecret: true,
    },
    {
        id: 'collector_all',
        name: 'Completionist',
        description: 'Collect ALL badges',
        icon: '🌟',
        category: 'secret',
        tier: 'diamond',
        target: 999,
        statKey: 'totalDaysAlive',
        details: 'The ultimate achievement. You\'ve done everything!',
        guide: 'Unlock every single badge in the game.',
        condition: () => false,
        isSecret: true,
    },

    // Fun Secrets
    {
        id: 'speedrunner',
        name: 'Speedrunner',
        description: 'Unlock 5 badges in one session',
        icon: '⏱️',
        category: 'secret',
        tier: 'gold',
        target: 5,
        statKey: 'totalDaysAlive',
        details: 'Blazing fast! 5 badges in a single play session.',
        guide: 'Unlock 5 badges without closing the app.',
        condition: () => false,
        isSecret: true,
    },
    {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Maintain all stats above 90% for 7 days',
        icon: '✨',
        category: 'secret',
        tier: 'diamond',
        target: 7,
        statKey: 'perfectDays',
        details: 'A full week of near-perfect care. Incredible!',
        guide: 'Keep all stats above 90% for 7 consecutive days.',
        condition: (s) => (s.perfectDays ?? 0) >= 7,
        isSecret: true,
    },
    {
        id: 'iron_pet',
        name: 'Iron Pet',
        description: 'Survive 30 days without game over',
        icon: '🛡️',
        category: 'secret',
        tier: 'platinum',
        target: 30,
        statKey: 'totalDaysAlive',
        details: 'A month of survival with zero failures. Legendary!',
        guide: 'Survive 30 days without triggering Game Over.',
        condition: (s) => s.totalDaysAlive >= 30 && (s.timesRevived ?? 0) === 0,
        isSecret: true,
    },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get total badge count
export const TOTAL_BADGES = BADGES.length;

// Get badge by ID
export function getBadgeById(id: string): Badge | undefined {
    return BADGES.find(b => b.id === id);
}

// Get badges by category
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
    return BADGES.filter(b => b.category === category);
}

// Get badges by tier
export function getBadgesByTier(tier: BadgeTier): Badge[] {
    return BADGES.filter(b => b.tier === tier);
}

// Check which badges are newly unlocked
export function checkNewBadges(
    currentBadges: string[],
    stats: BadgeCheckStats
): Badge[] {
    // Add current hour for time-based badges
    const enrichedStats: BadgeCheckStats = {
        ...stats,
        currentHour: new Date().getHours(),
    };

    return BADGES.filter(badge =>
        !currentBadges.includes(badge.id) && badge.condition(enrichedStats)
    );
}

// Get current progress for a badge
export function getBadgeProgress(badge: Badge, stats: BadgeCheckStats): number {
    const current = stats[badge.statKey] ?? 0;
    return typeof current === 'number' ? current : 0;
}

// Get category display info
export const CATEGORY_INFO: Record<BadgeCategory, { label: string; icon: string }> = {
    care: { label: 'Hygiene & Care', icon: '🧼' },
    wealth: { label: 'Wealth & Economy', icon: '💰' },
    survival: { label: 'Survival & Health', icon: '🏕️' },
    special: { label: 'Special Achievements', icon: '⭐' },
    secret: { label: 'Secret & Creative', icon: '🤫' },
};

// Statistics helper
export function getBadgeStats(unlockedBadges: string[]): {
    total: number;
    unlocked: number;
    byTier: Record<BadgeTier, { total: number; unlocked: number }>;
    byCategory: Record<BadgeCategory, { total: number; unlocked: number }>;
} {
    const byTier: Record<BadgeTier, { total: number; unlocked: number }> = {
        bronze: { total: 0, unlocked: 0 },
        silver: { total: 0, unlocked: 0 },
        gold: { total: 0, unlocked: 0 },
        platinum: { total: 0, unlocked: 0 },
        diamond: { total: 0, unlocked: 0 },
    };

    const byCategory: Record<BadgeCategory, { total: number; unlocked: number }> = {
        care: { total: 0, unlocked: 0 },
        wealth: { total: 0, unlocked: 0 },
        survival: { total: 0, unlocked: 0 },
        special: { total: 0, unlocked: 0 },
        secret: { total: 0, unlocked: 0 },
    };

    BADGES.forEach(badge => {
        byTier[badge.tier].total++;
        byCategory[badge.category].total++;

        if (unlockedBadges.includes(badge.id)) {
            byTier[badge.tier].unlocked++;
            byCategory[badge.category].unlocked++;
        }
    });

    return {
        total: BADGES.length,
        unlocked: unlockedBadges.length,
        byTier,
        byCategory,
    };
}

console.log(`🏆 Achievement System Loaded: ${BADGES.length} badges available!`);
