/**
 * GameOverModal.tsx
 * 
 * Blocking modal displayed when pet's stats hit critical levels.
 * Cannot be dismissed - user must click "Start New Game" to continue.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, RefreshCw, Heart, Zap } from 'lucide-react';

interface GameOverModalProps {
    isOpen: boolean;
    petName: string;
    onRestart: () => void;
}

export function GameOverModal({ isOpen, petName, onRestart }: GameOverModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
            >
                {/* Sad particle effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                opacity: 0.3,
                                y: 0,
                                x: Math.random() * window.innerWidth
                            }}
                            animate={{
                                opacity: 0,
                                y: window.innerHeight,
                                rotate: 360
                            }}
                            transition={{
                                duration: 4 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }}
                            className="absolute text-2xl"
                        >
                            💔
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="relative bg-gradient-to-b from-slate-800 to-slate-900 border border-red-500/30 rounded-3xl p-10 text-center max-w-md mx-4 shadow-2xl shadow-red-500/20"
                >
                    {/* Skull Icon */}
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, -5, 5, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
                    >
                        <Skull size={56} className="text-red-400" />
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Game Over
                    </h1>
                    <p className="text-xl text-red-400 mb-6">
                        {petName} has fainted...
                    </p>

                    {/* Stats that caused death */}
                    <div className="flex justify-center gap-6 mb-8 text-slate-400">
                        <div className="flex items-center gap-2">
                            <Heart size={20} className="text-red-500" />
                            <span>0%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap size={20} className="text-yellow-500" />
                            <span>0%</span>
                        </div>
                    </div>

                    {/* Message */}
                    <p className="text-slate-400 text-sm mb-8">
                        Your pet ran out of energy or health. Don't worry - your
                        <span className="text-yellow-400 font-bold"> badges </span>
                        and
                        <span className="text-yellow-400 font-bold"> high scores </span>
                        are saved!
                    </p>

                    {/* Restart Button */}
                    <motion.button
                        onClick={onRestart}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-4 px-8 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-red-500/30 transition-all"
                    >
                        <RefreshCw size={24} />
                        Start New Game
                    </motion.button>

                    {/* Decorative elements */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full blur-sm" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full blur-sm" />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-red-500 rounded-full blur-sm" />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-red-500 rounded-full blur-sm" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default GameOverModal;
