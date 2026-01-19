/**
 * AwardsRoom.tsx
 * 
 * Hall of Fame room displaying earned badges and achievements.
 * Light/Sunny theme matching the Dashboard aesthetic.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Star } from 'lucide-react';
import { BADGES, getBadgeById } from '@/config/Achievements';
import { usePet } from '@/context/PetContext';

export function AwardsRoom() {
    const { badges: unlockedBadges } = usePet();

    // Group badges by category
    const categories = ['survival', 'care', 'wealth', 'special'] as const;
    const categoryLabels = {
        survival: '🏆 Survival',
        care: '🧼 Care',
        wealth: '💰 Wealth',
        special: '⭐ Special'
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-blue-50 via-white to-slate-50"
        >
            {/* Header */}
            <div className="p-6 text-center border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="flex items-center justify-center gap-3 mb-2"
                >
                    <Trophy size={36} className="text-yellow-500" />
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Hall of Fame</h1>
                    <Trophy size={36} className="text-yellow-500" />
                </motion.div>
                <p className="text-slate-500 text-base font-medium">
                    Track your milestones and legacy.
                    <span className="text-yellow-600 font-bold ml-2">
                        {unlockedBadges.length}/{BADGES.length} Unlocked
                    </span>
                </p>
            </div>

            {/* Badge Grid - Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 pb-40 space-y-10 [&::-webkit-scrollbar]:hidden scrollbar-hide">
                {categories.map(category => {
                    const categoryBadges = BADGES.filter(b => b.category === category);
                    return (
                        <div key={category}>
                            <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-slate-700 whitespace-nowrap">
                                    {categoryLabels[category]}
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div className="h-28 bg-white/90 backdrop-blur-md border-t border-slate-200 flex items-center justify-center gap-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-md transition-all ${unlockedBadges[i]
                                ? 'bg-gradient-to-br from-yellow-100 to-yellow-50 border-2 border-yellow-400'
                                : 'bg-slate-100 border border-slate-200'
                            }`}
                    >
                        {unlockedBadges[i] ? (
                            <motion.span
                                whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                                className="text-3xl cursor-default"
                            >
                                {getBadgeById(unlockedBadges[i])?.icon || '🏆'}
                            </motion.span>
                        ) : (
                            <Lock size={22} className="text-slate-300" />
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
            whileHover={{ scale: 1.03, y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`relative p-6 rounded-2xl transition-all duration-300 overflow-hidden group min-h-[180px] ${isUnlocked
                    ? 'bg-white border-2 border-yellow-400 shadow-xl shadow-yellow-100/50'
                    : 'bg-gray-100 border border-gray-200 opacity-60'
                }`}
        >
            {/* Badge Icon Container */}
            <div className="relative text-center mb-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all ${isUnlocked
                        ? 'bg-gradient-to-br from-yellow-100 to-amber-50 shadow-sm'
                        : 'bg-gray-200'
                    }`}>
                    <span className={`text-4xl transition-all ${isUnlocked ? '' : 'grayscale opacity-30'}`}>
                        {isUnlocked ? badge.icon : <Lock size={28} className="text-gray-400" />}
                    </span>
                </div>
            </div>

            {/* Badge Info */}
            <div className="relative text-center">
                <h3 className={`text-lg font-bold tracking-tight mb-1 ${isUnlocked ? 'text-slate-800' : 'text-gray-400'}`}>
                    {isUnlocked ? badge.name : 'Secret Achievement'}
                </h3>
                <p className={`text-sm leading-relaxed ${isUnlocked ? 'text-slate-500' : 'text-gray-400'}`}>
                    {isUnlocked ? badge.description : 'Keep playing to unlock!'}
                </p>
            </div>

            {/* Unlocked Star Indicator */}
            {isUnlocked && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-md"
                >
                    <Star size={14} className="text-white fill-white" />
                </motion.div>
            )}
        </motion.div>
    );
}

export default AwardsRoom;
