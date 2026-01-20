/**
 * PowerNapModal.tsx
 * 
 * Rest Shelter "Power Nap" feature - rapid energy regeneration with ambient visuals.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Zap, X, Volume2, VolumeX } from 'lucide-react';
import { usePet } from '@/context/PetContext';

interface PowerNapModalProps {
    isOpen: boolean;
    onClose: () => void;
    petEmoji?: string;
}

const ENERGY_REGEN_RATE = 5; // Energy gained per second
const NAP_DURATION = 10; // Seconds for full nap

export function PowerNapModal({ isOpen, onClose, petEmoji = '🐕' }: PowerNapModalProps) {
    const { pet, updatePetStats, lastNapTimestamp, recordNap } = usePet();
    const [isNapping, setIsNapping] = useState(false);
    const [napProgress, setNapProgress] = useState(0);
    const [energyGained, setEnergyGained] = useState(0);
    const [ambientEnabled, setAmbientEnabled] = useState(true);

    const intervalRef = useRef<NodeJS.Timeout>();
    const startEnergyRef = useRef(0);

    // Calculate Cooldown
    const getCooldownStatus = () => {
        if (!lastNapTimestamp) return { canNap: true, timeLeft: '' };

        const now = new Date();
        const lastNap = new Date(lastNapTimestamp);
        const diffMs = now.getTime() - lastNap.getTime();
        const fourHoursMs = 4 * 60 * 60 * 1000;

        if (diffMs >= fourHoursMs) return { canNap: true, timeLeft: '' };

        const remainingMs = fourHoursMs - diffMs;
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        return {
            canNap: false,
            timeLeft: `${hours}h ${minutes}m`
        };
    };

    const { canNap, timeLeft } = getCooldownStatus();

    // Start nap
    const startNap = useCallback(() => {
        if (!pet) return;

        startEnergyRef.current = pet.stats.energy;
        setIsNapping(true);
        setNapProgress(0);
        setEnergyGained(0);
    }, [pet]);

    // Nap progression
    useEffect(() => {
        if (!isNapping || !pet) return;

        intervalRef.current = setInterval(() => {
            setNapProgress(prev => {
                const newProgress = prev + (100 / NAP_DURATION);

                if (newProgress >= 100) {
                    // Nap complete
                    clearInterval(intervalRef.current);
                    setIsNapping(false);
                    return 100;
                }

                // Update energy
                const newEnergyGain = Math.min(
                    100 - startEnergyRef.current,
                    Math.floor((newProgress / 100) * (100 - startEnergyRef.current))
                );
                setEnergyGained(newEnergyGain);

                return newProgress;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isNapping, pet]);

    // Apply energy gain on completion or close
    const applyEnergyGain = useCallback(async () => {
        if (!pet || energyGained <= 0) return;

        const newEnergy = Math.min(100, pet.stats.energy + energyGained);
        await updatePetStats({ energy: newEnergy });

        // Record nap timestamp and trigger achievements for "Sleep"
        if (napProgress >= 100) {
            await recordNap();
        }
    }, [pet, energyGained, updatePetStats, napProgress, recordNap]);

    // Handle close
    const handleClose = async () => {
        if (isNapping) {
            setIsNapping(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            await applyEnergyGain();
        }
        onClose();
    };

    // Apply on nap complete
    useEffect(() => {
        if (!isNapping && napProgress >= 100) {
            applyEnergyGain();
        }
    }, [isNapping, napProgress, applyEnergyGain]);

    if (!isOpen) return null;

    const currentEnergy = pet ? Math.min(100, pet.stats.energy + energyGained) : 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                {/* Ambient night background */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isNapping ? 1 : 0.7 }}
                    className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950"
                >
                    {/* Stars */}
                    {[...Array(50)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 60}%`,
                            }}
                            animate={{
                                opacity: [0.3, 1, 0.3],
                                scale: [1, 1.5, 1],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}

                    {/* Moon */}
                    <motion.div
                        className="absolute top-12 right-16"
                        animate={isNapping ? {
                            y: [0, -10, 0],
                            rotate: [0, 5, 0],
                        } : {}}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 shadow-[0_0_60px_rgba(255,255,200,0.6)]" />
                            <div className="absolute top-2 left-4 w-4 h-4 rounded-full bg-yellow-200/50" />
                            <div className="absolute top-8 left-8 w-3 h-3 rounded-full bg-yellow-200/50" />
                        </div>
                    </motion.div>

                    {/* Floating clouds */}
                    {isNapping && [...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-6xl opacity-20"
                            style={{ top: `${20 + i * 15}%` }}
                            initial={{ left: '-20%' }}
                            animate={{ left: '120%' }}
                            transition={{
                                duration: 30 + i * 10,
                                repeat: Infinity,
                                delay: i * 5,
                            }}
                        >
                            ☁️
                        </motion.div>
                    ))}
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative z-10 w-full max-w-md mx-4"
                >
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute -top-2 -right-2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>

                    {/* Sound toggle */}
                    <button
                        onClick={() => setAmbientEnabled(!ambientEnabled)}
                        className="absolute -top-2 -left-2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors"
                    >
                        {ambientEnabled ? (
                            <Volume2 size={18} className="text-white" />
                        ) : (
                            <VolumeX size={18} className="text-white" />
                        )}
                    </button>

                    {/* Main card */}
                    <div className="bg-gradient-to-b from-indigo-900/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                        {/* Sleeping pet */}
                        <motion.div
                            className="text-center mb-6"
                            animate={isNapping ? {
                                scale: [1, 1.05, 1],
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="relative inline-block">
                                <span className="text-8xl">{petEmoji}</span>

                                {/* Zzz animation */}
                                {isNapping && (
                                    <motion.div
                                        className="absolute -top-4 -right-4 text-3xl"
                                        animate={{
                                            y: [-10, -30],
                                            x: [0, 20],
                                            opacity: [1, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                        }}
                                    >
                                        💤
                                    </motion.div>
                                )}

                                {/* Sleep bubble */}
                                {isNapping && (
                                    <motion.div
                                        className="absolute -top-2 right-full mr-2"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                                            😴 Zzz...
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        {/* Title */}
                        <h2 className="text-2xl font-black text-white text-center mb-2">
                            {isNapping ? 'Sweet Dreams...' : 'Rest Shelter'}
                        </h2>
                        <p className="text-white/60 text-center text-sm mb-6">
                            {isNapping
                                ? 'Your pet is recovering energy'
                                : 'Take a power nap to restore energy quickly'}
                        </p>

                        {/* Energy bar */}
                        <div className="bg-white/10 rounded-2xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Zap size={18} className="text-yellow-400" />
                                    <span className="text-white font-semibold">Energy</span>
                                </div>
                                <span className="text-white font-bold">
                                    {Math.round(currentEnergy)}%
                                    {energyGained > 0 && (
                                        <span className="text-green-400 ml-2">+{energyGained}</span>
                                    )}
                                </span>
                            </div>
                            <div className="h-4 bg-black/30 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                                    initial={{ width: `${pet?.stats.energy || 0}%` }}
                                    animate={{ width: `${currentEnergy}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Nap progress */}
                        {isNapping && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-white/10 rounded-2xl p-4 mb-6"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Moon size={18} className="text-purple-300" />
                                        <span className="text-white font-semibold">Nap Progress</span>
                                    </div>
                                    <span className="text-white font-bold">{Math.round(napProgress)}%</span>
                                </div>
                                <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                                        style={{ width: `${napProgress}%` }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Action button */}
                        {!isNapping ? (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={startNap}
                                disabled={pet?.stats.energy === 100 || !canNap}
                                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Moon size={22} />
                                    {pet?.stats.energy === 100
                                        ? 'Fully Rested!'
                                        : !canNap
                                            ? `Nap Cool: ${timeLeft}`
                                            : 'Take a Power Nap'
                                    }
                                </div>
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleClose}
                                className="w-full py-4 bg-white/20 text-white font-bold text-lg rounded-2xl"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Sun size={22} />
                                    Wake Up Early
                                </div>
                            </motion.button>
                        )}

                        {/* Info */}
                        <p className="text-white/40 text-xs text-center mt-4">
                            💡 Power naps restore energy 10x faster than normal rest
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default PowerNapModal;
