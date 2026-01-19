/**
 * BadgeDetailsModal.tsx
 * 
 * Premium modal for viewing badge details, progress, and lore.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle, Sparkles } from 'lucide-react';
import { Badge, getBadgeProgress, BadgeCheckStats } from '@/config/Achievements';

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
                    className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with gradient */}
                    <div className={`relative p-6 pb-10 text-center ${isUnlocked
                            ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400'
                            : 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600'
                        }`}>
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                        >
                            <X size={18} className="text-white" />
                        </button>

                        {/* Icon */}
                        <motion.div
                            animate={isUnlocked ? { y: [0, -8, 0] } : {}}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-7xl mb-2"
                        >
                            {isUnlocked ? badge.icon : '🔒'}
                        </motion.div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                            {badge.name}
                        </h2>

                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium ${isUnlocked
                                ? 'bg-white/30 text-white'
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
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                        {/* Lore */}
                        <div className="text-center">
                            <p className="text-slate-500 italic leading-relaxed">
                                "{badge.lore}"
                            </p>
                        </div>

                        {/* Progress Section */}
                        {!isUnlocked && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 font-medium">Progress</span>
                                    <span className="text-slate-800 font-bold">
                                        {current} / {badge.target}
                                    </span>
                                </div>
                                <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Guide / How-To */}
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                                {isUnlocked ? '🎉 Achievement' : '📋 How to Unlock'}
                            </h4>
                            <p className="text-slate-700 text-sm leading-relaxed">
                                {badge.guide}
                            </p>
                        </div>

                        {/* Unlocked extras */}
                        {isUnlocked && (
                            <div className="flex items-center justify-center gap-2 text-yellow-600">
                                <Sparkles size={16} />
                                <span className="text-sm font-medium">Earned this badge!</span>
                                <Sparkles size={16} />
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default BadgeDetailsModal;
