/**
 * AwardsRoom.tsx
 * 
 * VIBRANT Collector's Album / Sticker Book with tactile "vinyl sticker" feel.
 * Features category-colored locked states and explosive unlocked visuals.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock, Star } from 'lucide-react';
import { BADGES, Badge, getBadgeProgress, BadgeCheckStats } from '@/config/Achievements';
import { usePet } from '@/context/PetContext';
import { BadgeDetailsModal } from './BadgeDetailsModal';

// Category color themes for the vibrant sticker effects
const categoryThemes = {
    care: {
        // Cyan/Blue theme for Hygiene & Care
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
        // Green/Gold theme for Wealth
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
        // Orange/Amber theme for Survival
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
        // Purple/Pink theme for Special
        lockedBorder: 'border-purple-400/40',
        lockedBg: 'bg-gradient-to-br from-purple-50/80 to-pink-50/60',
        lockedGlow: 'text-purple-400',
        progressBar: 'from-purple-400 via-pink-500 to-rose-600',
        unlockedGradient: 'from-violet-400 via-fuchsia-500 to-pink-600',
        ring: 'ring-purple-400',
        shadow: 'shadow-purple-500/50',
        headerGradient: 'from-purple-500 to-pink-600',
    },
};

export function AwardsRoom() {
    const { badges: unlockedBadges, pet, lifetimeStats } = usePet();
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    // Build stats object using lifetimeStats from context
    const stats: BadgeCheckStats = {
        totalDaysAlive: lifetimeStats?.days_survived ?? pet?.age ?? 0,
        totalBaths: lifetimeStats?.total_washes ?? 0,
        totalMeals: lifetimeStats?.food_eaten ?? 0,
        totalPlaySessions: lifetimeStats?.play_sessions ?? 0,
        totalCoinsEarned: lifetimeStats?.total_earnings ?? 0,
        totalCoinsSpent: lifetimeStats?.total_spent ?? 0,
        currentHealth: pet?.stats.health ?? 0,
        currentHappiness: pet?.stats.happiness ?? 0,
        currentCleanliness: pet?.stats.cleanliness ?? 0,
    };

    // Group badges by category
    const categories = ['care', 'wealth', 'survival', 'special'] as const;
    const categoryLabels = {
        survival: '🏕️ Survival',
        care: '🧼 Hygiene & Care',
        wealth: '💰 Wealth',
        special: '⭐ Special'
    };

    const unlockedCount = unlockedBadges.length;
    const totalCount = BADGES.length;
    const progressPercent = (unlockedCount / totalCount) * 100;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900"
        >
            {/* Header with Sparkle Animation */}
            <div className="p-5 text-center relative overflow-hidden">
                {/* Floating sparkles background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-yellow-400/30"
                            initial={{
                                x: Math.random() * 100 + '%',
                                y: -20,
                                rotate: 0,
                                scale: 0.5 + Math.random() * 0.5
                            }}
                            animate={{
                                y: '120%',
                                rotate: 360,
                            }}
                            transition={{
                                duration: 4 + Math.random() * 3,
                                repeat: Infinity,
                                delay: Math.random() * 3,
                                ease: 'linear'
                            }}
                        >
                            <Star size={12 + Math.random() * 8} fill="currentColor" />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-center gap-3 mb-2"
                >
                    <motion.div
                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <Sparkles size={32} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 drop-shadow-lg">
                        Sticker Collection
                    </h1>
                    <motion.div
                        animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
                    >
                        <Sparkles size={32} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                    </motion.div>
                </motion.div>

                {/* Progress Bar */}
                <div className="max-w-xs mx-auto">
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                        </motion.div>
                    </div>
                    <p className="text-white/80 text-sm mt-2 font-semibold">
                        <span className="text-yellow-400 text-lg">{unlockedCount}</span>
                        <span className="text-white/60"> / {totalCount} collected</span>
                    </p>
                </div>
            </div>

            {/* The Album (Warm Sticker Book) */}
            <div className="flex-1 mx-4 mb-4 overflow-hidden">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
                    className="h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
                    style={{
                        background: 'linear-gradient(135deg, #fef9e7 0%, #fdf6e3 50%, #fef3c7 100%)',
                    }}
                >
                    {/* Subtle pattern overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, #92400e 1px, transparent 1px)`,
                            backgroundSize: '20px 20px',
                        }}
                    />

                    {/* Album spine decoration */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 shadow-lg" />

                    {/* Album Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 pl-8 pb-24 space-y-10 [&::-webkit-scrollbar]:hidden scrollbar-hide relative">
                        {categories.map((category, categoryIndex) => {
                            const categoryBadges = BADGES.filter(b => b.category === category);
                            if (categoryBadges.length === 0) return null;
                            const theme = categoryThemes[category];

                            return (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * categoryIndex }}
                                >
                                    {/* Category Header */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className={`h-1 flex-1 rounded-full bg-gradient-to-r ${theme.headerGradient} opacity-60`} />
                                        <h2 className={`text-lg font-black px-4 py-1.5 rounded-full bg-gradient-to-r ${theme.headerGradient} text-white shadow-lg`}>
                                            {categoryLabels[category]}
                                        </h2>
                                        <div className={`h-1 flex-1 rounded-full bg-gradient-to-r ${theme.headerGradient} opacity-60`} />
                                    </div>

                                    {/* Badge Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                                        {categoryBadges.map((badge, badgeIndex) => {
                                            const isUnlocked = unlockedBadges.includes(badge.id);
                                            return (
                                                <StickerSlot
                                                    key={badge.id}
                                                    badge={badge}
                                                    isUnlocked={isUnlocked}
                                                    stats={stats}
                                                    theme={theme}
                                                    index={badgeIndex}
                                                    onClick={() => setSelectedBadge(badge)}
                                                />
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
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

    if (isUnlocked) {
        // ============== UNLOCKED: Vibrant Vinyl Sticker ==============
        return (
            <motion.div
                onClick={onClick}
                initial={{ scale: 0, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 15,
                    delay: index * 0.05
                }}
                whileHover={{
                    scale: 1.12,
                    rotate: -3,
                    zIndex: 10,
                }}
                whileTap={{ scale: 0.95 }}
                className={`
                    relative aspect-square rounded-2xl cursor-pointer
                    border-[5px] border-white
                    ring-4 ring-offset-0 ${theme.ring}
                    shadow-xl ${theme.shadow}
                    transition-shadow duration-300
                    hover:shadow-2xl
                    overflow-hidden
                `}
                style={{
                    background: `radial-gradient(ellipse at top left, var(--tw-gradient-stops))`,
                }}
            >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.unlockedGradient}`} />

                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20" />

                {/* Shine Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    style={{ transform: 'skewX(-20deg)' }}
                />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-2">
                    <motion.span
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.1 + index * 0.05 }}
                        className="text-5xl mb-1 drop-shadow-lg"
                        style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}
                    >
                        {badge.icon}
                    </motion.span>
                    <p className="text-xs font-bold text-white text-center leading-tight drop-shadow-md px-1">
                        {badge.name}
                    </p>
                </div>

                {/* Sparkle Badge */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 + index * 0.05 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white"
                >
                    <Sparkles size={14} className="text-white drop-shadow" />
                </motion.div>
            </motion.div>
        );
    }

    // ============== LOCKED: Blueprint / Hologram State ==============
    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className={`
                relative aspect-square rounded-xl cursor-pointer
                ${theme.lockedBg}
                border-[3px] border-dashed ${theme.lockedBorder}
                backdrop-blur-sm
                transition-all duration-300
                hover:border-opacity-70
                overflow-hidden
            `}
        >
            {/* Pulsing glow effect */}
            <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{
                    boxShadow: [
                        'inset 0 0 20px 0 rgba(99, 102, 241, 0.1)',
                        'inset 0 0 30px 5px rgba(99, 102, 241, 0.2)',
                        'inset 0 0 20px 0 rgba(99, 102, 241, 0.1)',
                    ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-2">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.6, 0.8, 0.6],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className={theme.lockedGlow}
                >
                    <Lock size={28} strokeWidth={2.5} className="drop-shadow-sm mb-1" />
                </motion.div>

                {/* Badge Name - Always visible */}
                <p className="text-xs font-bold text-center leading-tight text-slate-500 px-1">
                    {badge.name}
                </p>

                {/* Progress Bar */}
                <div className="w-full mt-2 px-2">
                    <div className="h-2 bg-white/50 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full bg-gradient-to-r ${theme.progressBar} rounded-full relative`}
                        >
                            {/* Shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/60 to-white/30 animate-pulse" />
                        </motion.div>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-1 font-semibold">
                        {current} / {badge.target}
                    </p>
                </div>
            </div>

            {/* Corner decoration */}
            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-br ${theme.headerGradient} opacity-40`} />
            <div className={`absolute bottom-1 left-1 w-2 h-2 rounded-full bg-gradient-to-br ${theme.headerGradient} opacity-40`} />
        </motion.div>
    );
}

export default AwardsRoom;
