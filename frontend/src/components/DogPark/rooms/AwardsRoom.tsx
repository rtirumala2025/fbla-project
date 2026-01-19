/**
 * AwardsRoom.tsx
 * 
 * Collector's Album / Sticker Book with interactive modals and progress bars.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import { BADGES, Badge, getBadgeProgress, BadgeCheckStats } from '@/config/Achievements';
import { usePet } from '@/context/PetContext';
import { BadgeDetailsModal } from './BadgeDetailsModal';

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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900"
        >
            {/* Header */}
            <div className="p-5 text-center">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-center gap-3 mb-1"
                >
                    <Sparkles size={28} className="text-yellow-400" />
                    <h1 className="text-2xl font-bold text-white">Sticker Collection</h1>
                    <Sparkles size={28} className="text-yellow-400" />
                </motion.div>
                <p className="text-slate-400 text-sm">
                    Tap any sticker to learn more!{' '}
                    <span className="text-yellow-400 font-semibold">
                        {unlockedBadges.length}/{BADGES.length}
                    </span>
                </p>
            </div>

            {/* The Album (White Card) */}
            <div className="flex-1 mx-4 mb-4 overflow-hidden">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Album Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-8 [&::-webkit-scrollbar]:hidden scrollbar-hide">
                        {categories.map(category => {
                            const categoryBadges = BADGES.filter(b => b.category === category);
                            if (categoryBadges.length === 0) return null;
                            return (
                                <div key={category}>
                                    <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
                                        {categoryLabels[category]}
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {categoryBadges.map(badge => {
                                            const isUnlocked = unlockedBadges.includes(badge.id);
                                            return (
                                                <StickerSlot
                                                    key={badge.id}
                                                    badge={badge}
                                                    isUnlocked={isUnlocked}
                                                    stats={stats}
                                                    onClick={() => setSelectedBadge(badge)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
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
    onClick: () => void;
}

function StickerSlot({ badge, isUnlocked, stats, onClick }: StickerSlotProps) {
    const current = getBadgeProgress(badge, stats);
    const progressPercent = Math.min(100, (current / badge.target) * 100);

    return (
        <motion.div
            onClick={onClick}
            initial={isUnlocked ? { scale: 0.5, opacity: 0 } : {}}
            animate={isUnlocked ? { scale: 1, opacity: 1 } : {}}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all ${isUnlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-4 border-yellow-400 shadow-lg'
                    : 'bg-slate-100 border-4 border-dashed border-slate-300 shadow-inner hover:border-slate-400'
                }`}
        >
            {/* Icon */}
            {isUnlocked ? (
                <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="text-4xl mb-1"
                >
                    {badge.icon}
                </motion.span>
            ) : (
                <Lock size={28} className="text-slate-400 mb-1" />
            )}

            {/* Title - ALWAYS VISIBLE */}
            <p className={`text-xs font-bold text-center leading-tight ${isUnlocked ? 'text-slate-800' : 'text-slate-400'
                }`}>
                {badge.name}
            </p>

            {/* Progress Bar (for locked badges) */}
            {!isUnlocked && (
                <div className="w-full mt-1.5 px-1">
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-0.5 font-medium">
                        {current}/{badge.target}
                    </p>
                </div>
            )}

            {/* Sparkle indicator for unlocked */}
            {isUnlocked && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow"
                >
                    <Sparkles size={10} className="text-white" />
                </motion.div>
            )}
        </motion.div>
    );
}

export default AwardsRoom;
