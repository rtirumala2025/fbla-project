/**
 * AwardsRoom.tsx
 * 
 * Hall of Fame room displaying earned badges and achievements.
 * Features a trophy case with locked/unlocked badge states.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Star, Calendar } from 'lucide-react';
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
            className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-amber-900/20 to-slate-900"
        >
            {/* Header */}
            <div className="p-6 text-center border-b border-amber-500/20">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy size={32} className="text-amber-400" />
                    <h1 className="text-3xl font-bold text-white">Hall of Fame</h1>
                    <Trophy size={32} className="text-amber-400" />
                </div>
                <p className="text-amber-200/70">
                    {unlockedBadges.length} of {BADGES.length} badges unlocked
                </p>
            </div>

            {/* Badge Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {categories.map(category => {
                    const categoryBadges = BADGES.filter(b => b.category === category);
                    return (
                        <div key={category}>
                            <h2 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                                {categoryLabels[category]}
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <div className="h-32 bg-gradient-to-t from-amber-900/40 to-transparent border-t border-amber-500/20 flex items-center justify-center gap-8">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-16 h-16 bg-amber-500/20 rounded-lg border border-amber-400/30 flex items-center justify-center"
                    >
                        {unlockedBadges[i] ? (
                            <span className="text-3xl">{getBadgeById(unlockedBadges[i])?.icon || '🏆'}</span>
                        ) : (
                            <Lock size={24} className="text-amber-400/40" />
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
            whileHover={{ scale: 1.02 }}
            className={`relative p-4 rounded-xl border transition-all ${isUnlocked
                    ? 'bg-amber-500/20 border-amber-400/50 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/50 border-slate-700/50 opacity-60'
                }`}
        >
            {/* Badge Icon */}
            <div className="text-center mb-3">
                <span className={`text-4xl ${!isUnlocked && 'grayscale opacity-50'}`}>
                    {isUnlocked ? badge.icon : '❓'}
                </span>
            </div>

            {/* Badge Info */}
            <div className="text-center">
                <h3 className={`font-bold ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                    {isUnlocked ? badge.name : '???'}
                </h3>
                <p className={`text-xs mt-1 ${isUnlocked ? 'text-amber-200/70' : 'text-slate-600'}`}>
                    {isUnlocked ? badge.description : 'Keep playing to unlock!'}
                </p>
            </div>

            {/* Lock overlay for locked badges */}
            {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={20} className="text-slate-500" />
                </div>
            )}

            {/* Unlocked indicator */}
            {isUnlocked && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                    <Star size={14} className="text-white" />
                </motion.div>
            )}
        </motion.div>
    );
}

export default AwardsRoom;
