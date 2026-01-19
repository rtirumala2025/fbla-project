/**
 * AwardsRoom.tsx
 * 
 * Collector's Album / Sticker Book design for earned badges.
 * Square slots with revealed titles, dashed borders for locked.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import { BADGES, getBadgeById } from '@/config/Achievements';
import { usePet } from '@/context/PetContext';

export function AwardsRoom() {
    const { badges: unlockedBadges } = usePet();

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
                    Complete challenges to earn stickers!{' '}
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
        </motion.div>
    );
}

interface StickerSlotProps {
    badge: typeof BADGES[0];
    isUnlocked: boolean;
}

function StickerSlot({ badge, isUnlocked }: StickerSlotProps) {
    return (
        <motion.div
            initial={isUnlocked ? { scale: 0.5, opacity: 0 } : {}}
            animate={isUnlocked ? { scale: 1, opacity: 1 } : {}}
            whileHover={{ scale: isUnlocked ? 1.05 : 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${isUnlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-4 border-yellow-400 shadow-lg'
                    : 'bg-slate-100 border-4 border-dashed border-slate-300 shadow-inner'
                }`}
        >
            {/* Icon */}
            {isUnlocked ? (
                <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="text-5xl mb-1"
                >
                    {badge.icon}
                </motion.span>
            ) : (
                <span className="text-3xl mb-1 opacity-50">🔒</span>
            )}

            {/* Title - ALWAYS VISIBLE */}
            <p className={`text-xs font-bold text-center leading-tight ${isUnlocked ? 'text-slate-800' : 'text-slate-400'
                }`}>
                {badge.name}
            </p>

            {/* Description / Hint */}
            <p className={`text-[10px] text-center leading-tight mt-0.5 ${isUnlocked ? 'text-slate-500' : 'text-slate-300'
                }`}>
                {isUnlocked ? badge.description : '???'}
            </p>

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
