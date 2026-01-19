/**
 * AwardsRoom.tsx
 * 
 * Hall of Fame room displaying earned badges and achievements.
 * Soft App aesthetic with proper contrast (slate bg, white cards).
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Star } from 'lucide-react';
import { BADGES, getBadgeById } from '@/config/Achievements';
import { usePet } from '@/context/PetContext';

export function AwardsRoom() {
    const { badges: unlockedBadges } = usePet();

    // Group badges by category
    const categories = ['care', 'wealth', 'survival', 'special'] as const;
    const categoryLabels = {
        survival: '🏕️ Survival',
        care: '🧼 Care',
        wealth: '💰 Wealth',
        special: '⭐ Special'
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden bg-slate-100"
        >
            {/* Header */}
            <div className="p-6 text-center border-b border-slate-200 bg-white shadow-sm">
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="flex items-center justify-center gap-3 mb-2"
                >
                    <Trophy size={32} className="text-yellow-500" />
                    <h1 className="text-3xl font-bold text-slate-800">Hall of Fame</h1>
                    <Trophy size={32} className="text-yellow-500" />
                </motion.div>
                <p className="text-slate-500 text-sm">
                    Track your achievements and milestones.{' '}
                    <span className="text-yellow-600 font-bold">
                        {unlockedBadges.length}/{BADGES.length} Unlocked
                    </span>
                </p>
            </div>

            {/* Badge Grid - Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-8 [&::-webkit-scrollbar]:hidden scrollbar-hide">
                {categories.map(category => {
                    const categoryBadges = BADGES.filter(b => b.category === category);
                    if (categoryBadges.length === 0) return null;
                    return (
                        <div key={category}>
                            <div className="flex items-center gap-3 mb-4">
                                <h2 className="text-lg font-bold text-slate-800 whitespace-nowrap">
                                    {categoryLabels[category]}
                                </h2>
                                <div className="h-px flex-1 bg-slate-300" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {categoryBadges.map(badge => {
                                    const isUnlocked = unlockedBadges.includes(badge.id);
                                    return (
                                        <BadgeCard
                                            key={badge.id}
                                            badge={badge}
                                            isUnlocked={isUnlocked}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Decorative Trophy Case at bottom */}
            <div className="h-24 bg-white border-t border-slate-200 flex items-center justify-center gap-6 shadow-inner">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${unlockedBadges[i]
                                ? 'bg-yellow-50 border-2 border-yellow-400 shadow-md'
                                : 'bg-slate-100 border border-slate-200'
                            }`}
                    >
                        {unlockedBadges[i] ? (
                            <motion.span
                                whileHover={{ scale: 1.1 }}
                                className="text-2xl cursor-default"
                            >
                                {getBadgeById(unlockedBadges[i])?.icon || '🏆'}
                            </motion.span>
                        ) : (
                            <Lock size={18} className="text-slate-300" />
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

interface BadgeCardProps {
    badge: typeof BADGES[0];
    isUnlocked: boolean;
}

function BadgeCard({ badge, isUnlocked }: BadgeCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 400 }}
            className={`relative p-5 rounded-xl transition-all duration-200 min-h-[140px] ${isUnlocked
                    ? 'bg-white border-2 border-yellow-400 shadow-md'
                    : 'bg-white border border-slate-200 shadow-sm opacity-70'
                }`}
        >
            {/* Badge Icon Container */}
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isUnlocked
                        ? 'bg-yellow-100'
                        : 'bg-slate-100'
                    }`}>
                    {isUnlocked ? (
                        <span className="text-2xl">{badge.icon}</span>
                    ) : (
                        <Lock size={20} className="text-slate-400" />
                    )}
                </div>

                {/* Badge Info */}
                <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold mb-1 ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                        {badge.name}
                    </h3>
                    <p className={`text-sm leading-snug ${isUnlocked ? 'text-gray-500' : 'text-slate-300'}`}>
                        {isUnlocked ? badge.description : '???'}
                    </p>
                </div>
            </div>

            {/* Unlocked Star Indicator */}
            {isUnlocked && (
                <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow"
                >
                    <Star size={12} className="text-white fill-white" />
                </motion.div>
            )}
        </motion.div>
    );
}

export default AwardsRoom;
