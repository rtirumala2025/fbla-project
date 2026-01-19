/**
 * AwardsRoom.tsx
 * 
 * MASSIVE 200+ Badge Sticker Collection with Tiered Visual Hierarchy
 * Bronze → Silver → Gold → Platinum → Diamond progression
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock, Star, Trophy, Filter, ChevronDown } from 'lucide-react';
import {
    BADGES, Badge, getBadgeProgress, BadgeCheckStats,
    TIER_CONFIG, CATEGORY_INFO, getBadgeStats,
    BadgeTier, BadgeCategory
} from '@/config/Achievements';
import { usePet } from '@/context/PetContext';
import { BadgeDetailsModal } from './BadgeDetailsModal';

// Category color themes
const categoryThemes: Record<BadgeCategory, {
    lockedBorder: string;
    lockedBg: string;
    lockedGlow: string;
    progressBar: string;
    unlockedGradient: string;
    ring: string;
    shadow: string;
    headerGradient: string;
}> = {
    care: {
        lockedBorder: 'border-cyan-400/40',
        lockedBg: 'bg-gradient-to-br from-cyan-50/80 to-blue-50/60',
        lockedGlow: 'text-cyan-400',
        progressBar: 'from-cyan-400 via-blue-500 to-indigo-600',
        unlockedGradient: 'from-cyan-300 via-blue-500 to-purple-600',
        ring: 'ring-cyan-400',
        shadow: 'shadow-cyan-500/50',
        headerGradient: 'from-cyan-500 to-blue-600',
    },
    wealth: {
        lockedBorder: 'border-emerald-400/40',
        lockedBg: 'bg-gradient-to-br from-emerald-50/80 to-yellow-50/60',
        lockedGlow: 'text-emerald-400',
        progressBar: 'from-yellow-400 via-emerald-500 to-green-600',
        unlockedGradient: 'from-yellow-300 via-emerald-500 to-green-700',
        ring: 'ring-emerald-400',
        shadow: 'shadow-emerald-500/50',
        headerGradient: 'from-emerald-500 to-green-600',
    },
    survival: {
        lockedBorder: 'border-orange-400/40',
        lockedBg: 'bg-gradient-to-br from-orange-50/80 to-amber-50/60',
        lockedGlow: 'text-orange-400',
        progressBar: 'from-orange-400 via-amber-500 to-red-500',
        unlockedGradient: 'from-orange-300 via-red-500 to-rose-700',
        ring: 'ring-orange-400',
        shadow: 'shadow-orange-500/50',
        headerGradient: 'from-orange-500 to-red-500',
    },
    special: {
        lockedBorder: 'border-purple-400/40',
        lockedBg: 'bg-gradient-to-br from-purple-50/80 to-pink-50/60',
        lockedGlow: 'text-purple-400',
        progressBar: 'from-purple-400 via-pink-500 to-rose-600',
        unlockedGradient: 'from-violet-400 via-fuchsia-500 to-pink-600',
        ring: 'ring-purple-400',
        shadow: 'shadow-purple-500/50',
        headerGradient: 'from-purple-500 to-pink-600',
    },
    secret: {
        lockedBorder: 'border-slate-400/40',
        lockedBg: 'bg-gradient-to-br from-slate-100/80 to-gray-50/60',
        lockedGlow: 'text-slate-500',
        progressBar: 'from-slate-400 via-gray-500 to-slate-600',
        unlockedGradient: 'from-slate-600 via-purple-700 to-black',
        ring: 'ring-slate-500',
        shadow: 'shadow-slate-600/50',
        headerGradient: 'from-slate-600 to-gray-800',
    },
};

// Tier frame styles (the "RPG" look)
const tierFrameStyles: Record<BadgeTier, {
    border: string;
    ring: string;
    glow: string;
    animation: string;
    bgOverlay: string;
}> = {
    bronze: {
        border: 'border-amber-700',
        ring: 'ring-amber-600/30',
        glow: '',
        animation: '',
        bgOverlay: '',
    },
    silver: {
        border: 'border-slate-400',
        ring: 'ring-slate-300/40',
        glow: 'shadow-slate-400/20',
        animation: '',
        bgOverlay: 'bg-gradient-to-tr from-white/10 to-transparent',
    },
    gold: {
        border: 'border-yellow-500',
        ring: 'ring-yellow-400/50',
        glow: 'shadow-yellow-400/40',
        animation: '',
        bgOverlay: 'bg-gradient-to-tr from-yellow-200/20 to-transparent',
    },
    platinum: {
        border: 'border-cyan-300',
        ring: 'ring-cyan-400/50',
        glow: 'shadow-cyan-400/50',
        animation: 'animate-pulse',
        bgOverlay: 'bg-gradient-to-tr from-cyan-200/30 to-purple-200/20',
    },
    diamond: {
        border: 'border-blue-400',
        ring: 'ring-4 ring-purple-500/60',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
        animation: '',
        bgOverlay: 'bg-[conic-gradient(from_0deg,rgba(255,255,255,0.3),rgba(168,85,247,0.3),rgba(59,130,246,0.3),rgba(255,255,255,0.3))]',
    },
};

type FilterType = 'all' | 'unlocked' | 'locked' | BadgeTier;

export function AwardsRoom() {
    const { badges: unlockedBadges, pet, lifetimeStats } = usePet();
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Build stats object
    const stats: BadgeCheckStats = useMemo(() => ({
        totalDaysAlive: lifetimeStats?.days_survived ?? pet?.age ?? 0,
        totalBaths: lifetimeStats?.total_washes ?? 0,
        totalMeals: lifetimeStats?.food_eaten ?? 0,
        totalPlaySessions: lifetimeStats?.play_sessions ?? 0,
        totalCoinsEarned: lifetimeStats?.total_earnings ?? 0,
        totalCoinsSpent: lifetimeStats?.total_spent ?? 0,
        currentHealth: pet?.stats.health ?? 0,
        currentHappiness: pet?.stats.happiness ?? 0,
        currentCleanliness: pet?.stats.cleanliness ?? 0,
        currentHour: new Date().getHours(),
    }), [lifetimeStats, pet]);

    // Get badge statistics
    const badgeStats = useMemo(() => getBadgeStats(unlockedBadges), [unlockedBadges]);

    // Filter badges
    const filteredBadges = useMemo(() => {
        let result = BADGES;

        // Hide secret badges that aren't unlocked (unless filter is 'all')
        result = result.filter(b =>
            !b.isSecret || unlockedBadges.includes(b.id) || filter === 'all'
        );

        if (filter === 'unlocked') {
            result = result.filter(b => unlockedBadges.includes(b.id));
        } else if (filter === 'locked') {
            result = result.filter(b => !unlockedBadges.includes(b.id));
        } else if (['bronze', 'silver', 'gold', 'platinum', 'diamond'].includes(filter)) {
            result = result.filter(b => b.tier === filter);
        }

        return result;
    }, [filter, unlockedBadges]);

    // Group by category
    const categories: BadgeCategory[] = ['care', 'wealth', 'survival', 'special', 'secret'];

    const progressPercent = (badgeStats.unlocked / badgeStats.total) * 100;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900"
        >
            {/* Header */}
            <div className="p-4 text-center relative overflow-hidden">
                {/* Floating sparkles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-yellow-400/30"
                            initial={{ x: `${Math.random() * 100}%`, y: -20, scale: 0.5 + Math.random() * 0.5 }}
                            animate={{ y: '120%', rotate: 360 }}
                            transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3, ease: 'linear' }}
                        >
                            <Star size={12 + Math.random() * 8} fill="currentColor" />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-center gap-2 mb-2"
                >
                    <Trophy size={28} className="text-yellow-400" />
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500">
                        Achievement Collection
                    </h1>
                </motion.div>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto mb-3">
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full"
                        />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                        <span className="text-white/60">
                            <span className="text-yellow-400 font-bold text-sm">{badgeStats.unlocked}</span> / {badgeStats.total}
                        </span>
                        <span className="text-white/60">{Math.round(progressPercent)}% Complete</span>
                    </div>
                </div>

                {/* Tier Stats Row */}
                <div className="flex justify-center gap-2 flex-wrap mb-2">
                    {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as BadgeTier[]).map(tier => (
                        <button
                            key={tier}
                            onClick={() => setFilter(prev => prev === tier ? 'all' : tier)}
                            className={`px-2 py-1 rounded-full text-xs font-bold transition-all ${filter === tier
                                    ? `bg-gradient-to-r ${TIER_CONFIG[tier].gradient} text-white shadow-lg scale-105`
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                        >
                            {TIER_CONFIG[tier].label}: {badgeStats.byTier[tier].unlocked}/{badgeStats.byTier[tier].total}
                        </button>
                    ))}
                </div>

                {/* Filter Toggle */}
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === 'all' ? 'bg-white text-slate-800' : 'bg-white/20 text-white'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unlocked')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === 'unlocked' ? 'bg-green-500 text-white' : 'bg-white/20 text-white'
                            }`}
                    >
                        ✓ Unlocked
                    </button>
                    <button
                        onClick={() => setFilter('locked')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === 'locked' ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
                            }`}
                    >
                        🔒 Locked
                    </button>
                </div>
            </div>

            {/* The Album */}
            <div className="flex-1 mx-3 mb-3 overflow-hidden">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
                    style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #fdf6e3 50%, #fef3c7 100%)' }}
                >
                    {/* Pattern overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #92400e 1px, transparent 1px)`, backgroundSize: '16px 16px' }}
                    />

                    {/* Album spine */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 shadow-lg" />

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 pl-6 pb-20 space-y-6 [&::-webkit-scrollbar]:hidden scrollbar-hide">
                        {categories.map((category, catIndex) => {
                            const categoryBadges = filteredBadges.filter(b => b.category === category);
                            if (categoryBadges.length === 0) return null;

                            const catInfo = CATEGORY_INFO[category];
                            const theme = categoryThemes[category];

                            return (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 * catIndex }}
                                >
                                    {/* Category Header */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`h-0.5 flex-1 rounded-full bg-gradient-to-r ${theme.headerGradient} opacity-40`} />
                                        <h2 className={`text-sm font-black px-3 py-1 rounded-full bg-gradient-to-r ${theme.headerGradient} text-white shadow`}>
                                            {catInfo.icon} {catInfo.label}
                                        </h2>
                                        <span className="text-xs text-slate-500 font-medium">
                                            {categoryBadges.filter(b => unlockedBadges.includes(b.id)).length}/{categoryBadges.length}
                                        </span>
                                        <div className={`h-0.5 flex-1 rounded-full bg-gradient-to-r ${theme.headerGradient} opacity-40`} />
                                    </div>

                                    {/* Badge Grid */}
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                        {categoryBadges.map((badge, index) => (
                                            <StickerSlot
                                                key={badge.id}
                                                badge={badge}
                                                isUnlocked={unlockedBadges.includes(badge.id)}
                                                stats={stats}
                                                theme={theme}
                                                index={index}
                                                onClick={() => setSelectedBadge(badge)}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {filteredBadges.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Lock size={48} className="mx-auto mb-3 opacity-50" />
                                <p className="font-medium">No badges match this filter</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Badge Details Modal */}
            {selectedBadge && (
                <BadgeDetailsModal
                    badge={selectedBadge}
                    isUnlocked={unlockedBadges.includes(selectedBadge.id)}
                    stats={stats}
                    onClose={() => setSelectedBadge(null)}
                />
            )}
        </motion.div>
    );
}

interface StickerSlotProps {
    badge: Badge;
    isUnlocked: boolean;
    stats: BadgeCheckStats;
    theme: typeof categoryThemes.care;
    index: number;
    onClick: () => void;
}

function StickerSlot({ badge, isUnlocked, stats, theme, index, onClick }: StickerSlotProps) {
    const current = getBadgeProgress(badge, stats);
    const progressPercent = Math.min(100, (current / badge.target) * 100);
    const tierStyle = tierFrameStyles[badge.tier];
    const tierConfig = TIER_CONFIG[badge.tier];

    if (isUnlocked) {
        // ============== UNLOCKED: Tiered Vinyl Sticker ==============
        return (
            <motion.div
                onClick={onClick}
                initial={{ scale: 0, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: index * 0.02 }}
                whileHover={{ scale: 1.15, rotate: -3, zIndex: 20 }}
                whileTap={{ scale: 0.95 }}
                className={`
                    relative aspect-square rounded-xl cursor-pointer
                    border-[4px] ${tierStyle.border}
                    ${tierStyle.ring}
                    shadow-lg ${tierStyle.glow}
                    transition-all duration-300
                    hover:shadow-2xl
                    overflow-hidden
                `}
            >
                {/* Tier-specific background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tierConfig.gradient}`} />

                {/* Holographic overlay for Diamond tier */}
                {badge.tier === 'diamond' && (
                    <motion.div
                        className="absolute inset-0 opacity-50"
                        style={{ background: 'conic-gradient(from 0deg, rgba(255,255,255,0.4), rgba(168,85,247,0.4), rgba(59,130,246,0.4), rgba(255,255,255,0.4))' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    />
                )}

                {/* Tier overlay shine */}
                <div className={`absolute inset-0 ${tierStyle.bgOverlay}`} />

                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />

                {/* Shine sweep */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                    initial={{ x: '-150%' }}
                    animate={{ x: '250%' }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-1">
                    <span
                        className="text-3xl mb-0.5 drop-shadow-lg"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    >
                        {badge.icon}
                    </span>
                    <p className="text-[9px] font-bold text-white text-center leading-tight drop-shadow px-0.5 line-clamp-2">
                        {badge.name}
                    </p>
                </div>

                {/* Tier Badge Corner */}
                <div
                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-[8px] font-black text-white`}
                    style={{ background: tierConfig.color }}
                >
                    {badge.tier === 'diamond' ? '💎' : badge.tier === 'platinum' ? '✦' : badge.tier === 'gold' ? '★' : badge.tier === 'silver' ? '◆' : '●'}
                </div>

                {/* Secret badge indicator */}
                {badge.isSecret && (
                    <div className="absolute bottom-0.5 right-0.5 text-[8px]">🤫</div>
                )}
            </motion.div>
        );
    }

    // ============== LOCKED: Blueprint State ==============
    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.015 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className={`
                relative aspect-square rounded-xl cursor-pointer
                ${theme.lockedBg}
                border-2 border-dashed ${theme.lockedBorder}
                backdrop-blur-sm
                transition-all duration-300
                overflow-hidden
            `}
        >
            {/* Pulse glow */}
            <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{
                    boxShadow: [
                        'inset 0 0 10px 0 rgba(99, 102, 241, 0.05)',
                        'inset 0 0 15px 2px rgba(99, 102, 241, 0.1)',
                        'inset 0 0 10px 0 rgba(99, 102, 241, 0.05)',
                    ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-1">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className={theme.lockedGlow}
                >
                    <Lock size={20} strokeWidth={2.5} className="mb-0.5" />
                </motion.div>

                <p className="text-[9px] font-bold text-center leading-tight text-slate-400 px-0.5 line-clamp-2">
                    {badge.isSecret ? '???' : badge.name}
                </p>

                {/* Progress Bar */}
                {!badge.isSecret && (
                    <div className="w-full mt-1 px-1">
                        <div className="h-1 bg-white/50 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                className={`h-full bg-gradient-to-r ${theme.progressBar} rounded-full`}
                            />
                        </div>
                        <p className="text-[8px] text-center text-slate-400 mt-0.5">
                            {current}/{badge.target}
                        </p>
                    </div>
                )}
            </div>

            {/* Tier indicator */}
            <div
                className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full opacity-40"
                style={{ background: tierConfig.color }}
            />
        </motion.div>
    );
}

export default AwardsRoom;
