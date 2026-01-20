/**
 * DailyRewardModal.tsx
 * 
 * Modal that appears when user logs in after 24+ hours.
 * Offers a random reward (coins, food, or energy).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Coins, Zap, Apple, Sparkles } from 'lucide-react';

interface DailyRewardModalProps {
    isOpen: boolean;
    onClaim: () => void;
    reward: {
        type: 'coins' | 'energy' | 'food';
        amount: number;
        label: string;
    } | null;
}

const REWARD_ICONS = {
    coins: <Coins size={48} className="text-yellow-400" />,
    energy: <Zap size={48} className="text-blue-400" />,
    food: <Apple size={48} className="text-orange-400" />,
};

const REWARD_COLORS = {
    coins: 'from-yellow-500 to-amber-600',
    energy: 'from-blue-500 to-cyan-600',
    food: 'from-orange-500 to-red-500',
};

export function DailyRewardModal({ isOpen, onClaim, reward }: DailyRewardModalProps) {
    const [claimed, setClaimed] = useState(false);

    if (!isOpen || !reward) return null;

    const handleClaim = () => {
        setClaimed(true);
        setTimeout(() => {
            onClaim();
            setClaimed(false);
        }, 1500);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
                {/* Sparkle effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                opacity: 0,
                                scale: 0,
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1.5, 0],
                                rotate: 360
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }}
                            className="absolute"
                        >
                            <Sparkles size={20} className="text-yellow-400" />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="relative bg-gradient-to-b from-slate-800 to-slate-900 border border-yellow-500/30 rounded-3xl p-10 text-center max-w-md mx-4 shadow-2xl shadow-yellow-500/20"
                >
                    {/* Gift Icon */}
                    <motion.div
                        animate={{
                            y: [0, -10, 0],
                            rotate: [0, -5, 5, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center"
                    >
                        <Gift size={56} className="text-purple-400" />
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome Back! 🎉
                    </h1>
                    <p className="text-lg text-purple-300 mb-6">
                        Your daily reward is ready!
                    </p>

                    {/* Reward Display */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.5 }}
                        className={`p-6 rounded-2xl bg-gradient-to-r ${REWARD_COLORS[reward.type]} mb-8`}
                    >
                        <div className="flex flex-col items-center gap-3">
                            {REWARD_ICONS[reward.type]}
                            <div className="text-white">
                                <span className="text-4xl font-bold">+{reward.amount}</span>
                                <span className="text-lg ml-2">{reward.label}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Claim Button */}
                    <motion.button
                        onClick={handleClaim}
                        disabled={claimed}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full py-4 px-8 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all ${claimed
                            ? 'bg-green-500 shadow-green-500/30'
                            : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-purple-500/30'
                            }`}
                    >
                        {claimed ? (
                            <>
                                <Sparkles size={24} />
                                Claimed!
                            </>
                        ) : (
                            <>
                                <Gift size={24} />
                                Claim Reward
                            </>
                        )}
                    </motion.button>

                    {/* Decorative corners */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full blur-sm" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full blur-sm" />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-pink-400 rounded-full blur-sm" />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full blur-sm" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Helper to generate random daily reward
export function generateDailyReward(): { type: 'coins' | 'energy' | 'food'; amount: number; label: string } {
    return { type: 'coins' as const, amount: 50, label: 'Coins' };
}


export default DailyRewardModal;
