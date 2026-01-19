/**
 * BadgeDetailsModal.tsx
 * 
 * Premium "Collector's Card" modal with Tiered Visual Hierarchy
 * Supports Bronze → Silver → Gold → Platinum → Diamond tiers
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle, Sparkles, Trophy, Target, Star } from 'lucide-react';
import {
    Badge, getBadgeProgress, BadgeCheckStats,
    TIER_CONFIG, CATEGORY_INFO, BadgeTier
} from '@/config/Achievements';

// Category-specific styling
const categoryStyles: Record<string, {
    gradient: string;
    progressBar: string;
    ring: string;
    iconBg: string;
    accentText: string;
    lightBg: string;
}> = {
    care: {
        gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
        progressBar: 'from-cyan-400 via-blue-500 to-indigo-500',
        ring: 'ring-cyan-400/50',
        iconBg: 'from-cyan-400 to-blue-500',
        accentText: 'text-cyan-600',
        lightBg: 'bg-cyan-50',
    },
    wealth: {
        gradient: 'from-yellow-400 via-amber-500 to-orange-600',
        progressBar: 'from-yellow-400 via-amber-500 to-orange-500',
        ring: 'ring-amber-400/50',
        iconBg: 'from-yellow-400 to-orange-500',
        accentText: 'text-amber-600',
        lightBg: 'bg-amber-50',
    },
    survival: {
        gradient: 'from-orange-500 via-red-500 to-rose-600',
        progressBar: 'from-orange-400 via-red-500 to-rose-500',
        ring: 'ring-orange-400/50',
        iconBg: 'from-orange-400 to-red-500',
        accentText: 'text-orange-600',
        lightBg: 'bg-orange-50',
    },
    special: {
        gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
        progressBar: 'from-violet-400 via-purple-500 to-fuchsia-500',
        ring: 'ring-purple-400/50',
        iconBg: 'from-violet-400 to-fuchsia-500',
        accentText: 'text-purple-600',
        lightBg: 'bg-purple-50',
    },
    secret: {
        gradient: 'from-slate-700 via-purple-800 to-slate-900',
        progressBar: 'from-slate-400 via-purple-500 to-slate-600',
        ring: 'ring-slate-500/50',
        iconBg: 'from-slate-500 to-purple-700',
        accentText: 'text-slate-600',
        lightBg: 'bg-slate-100',
    },
};

interface BadgeDetailsModalProps {
    badge: Badge | null;
    isUnlocked: boolean;
    stats: BadgeCheckStats;
    onClose: () => void;
}

export function BadgeDetailsModal({ badge, isUnlocked, stats, onClose }: BadgeDetailsModalProps) {
    if (!badge) return null;

    const current = getBadgeProgress(badge, stats);
    const progressPercent = Math.min(100, (current / badge.target) * 100);
    const style = categoryStyles[badge.category] || categoryStyles.special;
    const tierConfig = TIER_CONFIG[badge.tier];
    const categoryInfo = CATEGORY_INFO[badge.category];

    // Tier-specific ring styling
    const tierRingStyle = {
        bronze: 'ring-amber-600/40',
        silver: 'ring-slate-400/50',
        gold: 'ring-yellow-500/60',
        platinum: 'ring-cyan-400/60',
        diamond: 'ring-purple-500/70',
    }[badge.tier];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className={`w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden ring-4 ${tierRingStyle}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Tier-aware gradient */}
                    <div
                        className={`relative p-6 pb-14 text-center`}
                        style={{
                            background: isUnlocked
                                ? `linear-gradient(135deg, ${tierConfig.color}dd, ${tierConfig.color}99)`
                                : 'linear-gradient(135deg, #64748b, #475569)'
                        }}
                    >
                        {/* Overlay gradient for depth */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${isUnlocked ? style.gradient : 'from-slate-500 to-slate-600'} opacity-80`} />

                        {/* Sparkle effects for unlocked */}
                        {isUnlocked && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute text-white/30"
                                        initial={{
                                            x: `${10 + Math.random() * 80}%`,
                                            y: `${10 + Math.random() * 80}%`,
                                            scale: 0.5 + Math.random() * 0.5,
                                        }}
                                        animate={{
                                            opacity: [0.2, 0.6, 0.2],
                                            scale: [1, 1.3, 1],
                                        }}
                                        transition={{
                                            duration: 2 + Math.random() * 2,
                                            repeat: Infinity,
                                            delay: Math.random() * 2,
                                        }}
                                    >
                                        <Star size={10 + Math.random() * 8} fill="currentColor" />
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Diamond holographic effect */}
                        {isUnlocked && badge.tier === 'diamond' && (
                            <motion.div
                                className="absolute inset-0 opacity-30"
                                style={{ background: 'conic-gradient(from 0deg, rgba(255,255,255,0.5), rgba(168,85,247,0.5), rgba(59,130,246,0.5), rgba(255,255,255,0.5))' }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                            />
                        )}

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-all hover:scale-110"
                        >
                            <X size={18} className="text-white" />
                        </button>

                        {/* Tier Badge - Top Left */}
                        <div
                            className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-black text-white shadow-lg"
                            style={{ background: tierConfig.color }}
                        >
                            {tierConfig.label.toUpperCase()}
                        </div>

                        {/* HUGE Icon with Sticker Effect */}
                        <motion.div
                            animate={isUnlocked ? {
                                y: [0, -8, 0],
                                rotate: [0, 3, -3, 0],
                            } : {}}
                            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                            className="relative z-10 inline-block"
                        >
                            <div className={`
                                w-28 h-28 mx-auto rounded-full flex items-center justify-center
                                ${isUnlocked
                                    ? 'bg-white shadow-xl'
                                    : 'bg-white/30 border-4 border-dashed border-white/50'
                                }
                            `}
                                style={isUnlocked ? { boxShadow: `0 0 30px ${tierConfig.color}80` } : {}}
                            >
                                <span
                                    className="text-7xl"
                                    style={{
                                        filter: isUnlocked ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'grayscale(0.8) opacity(0.5)',
                                    }}
                                >
                                    {isUnlocked ? badge.icon : (badge.isSecret ? '❓' : '🔒')}
                                </span>
                            </div>

                            {/* Tier corner badge */}
                            {isUnlocked && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-3 ring-white"
                                    style={{ background: tierConfig.color }}
                                >
                                    <CheckCircle size={20} className="text-white" />
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Title */}
                        <h2 className="relative z-10 text-2xl font-black text-white mt-4 drop-shadow-lg">
                            {badge.isSecret && !isUnlocked ? '???' : badge.name}
                        </h2>

                        {/* Category & Status Pills */}
                        <div className="relative z-10 flex items-center justify-center gap-2 mt-3 flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-black/20 text-white/90 text-xs font-semibold">
                                {categoryInfo.icon} {categoryInfo.label}
                            </span>
                            {badge.isSecret && (
                                <span className="px-3 py-1 rounded-full bg-purple-500/50 text-white text-xs font-semibold">
                                    🤫 Secret
                                </span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isUnlocked
                                    ? 'bg-white text-green-600'
                                    : 'bg-white/20 text-white/80'
                                }`}>
                                {isUnlocked ? (
                                    <>
                                        <CheckCircle size={12} />
                                        Unlocked!
                                    </>
                                ) : (
                                    <>
                                        <Lock size={12} />
                                        Locked
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4 -mt-6">
                        {/* Achievement Description Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-4 border border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.lightBg}`}>
                                    <Trophy size={18} className={style.accentText} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                                        About This Achievement
                                    </h4>
                                    <p className="text-slate-700 text-sm leading-relaxed">
                                        {badge.isSecret && !isUnlocked
                                            ? 'This is a secret achievement! Keep playing to discover how to unlock it.'
                                            : badge.details
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Section (Only for locked non-secret badges) */}
                        {!isUnlocked && !badge.isSecret && (
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                        Progress
                                    </span>
                                    <span className={`text-lg font-black ${style.accentText}`}>
                                        {current.toLocaleString()} / {badge.target.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className={`h-full bg-gradient-to-r ${style.progressBar} rounded-full relative`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0" />
                                    </motion.div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 text-center">
                                    {Math.round(progressPercent)}% complete
                                </p>
                            </div>
                        )}

                        {/* How to Unlock / Guide */}
                        {(!badge.isSecret || isUnlocked) && (
                            <div className={`rounded-2xl p-4 ${style.lightBg}`}>
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
                                        <Target size={18} className={style.accentText} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                                            {isUnlocked ? 'How You Earned It' : 'How to Unlock'}
                                        </h4>
                                        <p className="text-slate-800 text-sm leading-relaxed font-medium">
                                            {badge.guide}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tier Info */}
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ background: tierConfig.color }}
                            />
                            <span className="text-slate-500 font-medium">
                                {tierConfig.label} Tier Achievement
                            </span>
                        </div>

                        {/* Unlocked celebration */}
                        {isUnlocked && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl"
                                style={{ background: `linear-gradient(90deg, ${tierConfig.color}cc, ${tierConfig.color}99)` }}
                            >
                                <Sparkles size={16} className="text-white" />
                                <span className="text-sm font-bold text-white">Achievement Unlocked!</span>
                                <Sparkles size={16} className="text-white" />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default BadgeDetailsModal;
