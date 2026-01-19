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
            className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_center,_#2E1065_0%,_#111827_100%)]"
        >
            {/* Header */}
            <div className="p-8 text-center border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="flex items-center justify-center gap-4 mb-3"
                >
                    <Trophy size={40} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                    <h1 className="text-5xl font-black text-white tracking-tight uppercase">Hall of Fame</h1>
                    <Trophy size={40} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                </motion.div>
                <p className="text-slate-400 text-lg font-medium">
                    Track your milestones and legacy. <span className="text-yellow-400/80 ml-2">{unlockedBadges.length}/{BADGES.length} Unlocked</span>
                </p>
            </div>

            {/* Badge Grid - Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-10 pb-48 space-y-12 [&::-webkit-scrollbar]:hidden scrollbar-hide">
                {categories.map(category => {
                    const categoryBadges = BADGES.filter(b => b.category === category);
                    return (
                        <div key={category}>
                            <div className="flex items-center gap-4 mb-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-widest whitespace-nowrap">
                                    {categoryLabels[category]}
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
            <div className="h-40 bg-black/40 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center shadow-inner group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {unlockedBadges[i] ? (
                            <motion.span
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                                className="text-4xl drop-shadow-lg cursor-default"
                            >
                                {getBadgeById(unlockedBadges[i])?.icon || '🏆'}
                            </motion.span>
                        ) : (
                            <Lock size={30} className="text-white/10" />
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
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`relative p-8 rounded-3xl border backdrop-blur-xl transition-all duration-300 overflow-hidden group min-h-[200px] ${isUnlocked
                ? 'bg-white/10 border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(34,211,238,0.2)]'
                : 'bg-black/40 border-white/5 opacity-70'
                }`}
        >
            {/* Background Glow for Unlocked */}
            {isUnlocked && (
                <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            {/* Badge Icon Container */}
            <div className="relative text-center mb-6">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700 ${isUnlocked
                    ? 'bg-gradient-to-br from-white/10 to-white/5 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)]'
                    : 'bg-black/60 shadow-inner'
                    }`}>
                    <span className={`text-5xl drop-shadow-2xl transition-all duration-500 ${isUnlocked ? 'scale-110' : 'grayscale opacity-20'
                        }`}>
                        {isUnlocked ? badge.icon : <Lock size={32} className="text-white/20" />}
                    </span>
                </div>
            </div>

            {/* Badge Info */}
            <div className="relative text-center">
                <h3 className={`text-xl font-black tracking-tight mb-2 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                    {isUnlocked ? badge.name : 'Secret Achievement'}
                </h3>
                <div className="flex justify-center mb-3">
                    <div className={`h-1 w-8 rounded-full transition-colors ${isUnlocked ? 'bg-cyan-400' : 'bg-slate-800'}`} />
                </div>
                <p className={`text-sm font-medium leading-relaxed ${isUnlocked ? 'text-slate-300' : 'text-slate-400'}`}>
                    {isUnlocked ? badge.description : 'Unlock this milestone to reveal its secret.'}
                </p>
            </div>

            {/* Locked Visual Decoration */}
            {!isUnlocked && (
                <div className="absolute top-4 right-4 opacity-5">
                    <Lock size={60} />
                </div>
            )}

            {/* Unlocked Glow Effect */}
            {isUnlocked && (
                <div className="absolute top-0 right-0 p-4">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_15px_#22d3ee]" />
                </div>
            )}
        </motion.div>
    );
}

export default AwardsRoom;
