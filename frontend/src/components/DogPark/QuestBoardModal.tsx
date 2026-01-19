/**
 * QuestBoardModal.tsx
 * 
 * Daily quests/challenges modal for the Park Hub building.
 * Features: 3 daily tasks with rewards, progress tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Circle, Gift, Clock, Star, Sparkles, Target } from 'lucide-react';
import { usePet } from '@/context/PetContext';

interface QuestBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Quest {
    id: string;
    title: string;
    description: string;
    icon: string;
    target: number;
    current: number;
    reward: number;
    category: 'care' | 'play' | 'explore' | 'social';
    isCompleted: boolean;
    isClaimed: boolean;
}

// Generate daily quests based on the date (so they change each day)
function generateDailyQuests(lifetimeStats: any, dateStr: string): Quest[] {
    const hash = dateStr.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);

    const questPool: Omit<Quest, 'current' | 'isCompleted' | 'isClaimed'>[] = [
        // Care quests
        { id: 'bath_daily', title: 'Squeaky Clean', description: 'Give your pet a bath', icon: '🛁', target: 1, reward: 15, category: 'care' },
        { id: 'feed_3', title: 'Well Fed', description: 'Feed your pet 3 times', icon: '🍖', target: 3, reward: 20, category: 'care' },
        { id: 'feed_5', title: 'Feast Mode', description: 'Feed your pet 5 times', icon: '🍽️', target: 5, reward: 30, category: 'care' },

        // Play quests
        { id: 'play_2', title: 'Playtime!', description: 'Play with your pet 2 times', icon: '🎾', target: 2, reward: 15, category: 'play' },
        { id: 'play_5', title: 'Fun Day', description: 'Play with your pet 5 times', icon: '🎮', target: 5, reward: 35, category: 'play' },
        { id: 'minigame_1', title: 'Gamer', description: 'Play a mini-game', icon: '🕹️', target: 1, reward: 25, category: 'play' },

        // Explore quests
        { id: 'visit_shop', title: 'Window Shopping', description: 'Visit the Gift Shop', icon: '🛍️', target: 1, reward: 10, category: 'explore' },
        { id: 'visit_vet', title: 'Health Check', description: 'Visit the Vet Clinic', icon: '🏥', target: 1, reward: 20, category: 'explore' },
        { id: 'explore_all', title: 'Explorer', description: 'Visit 3 different buildings', icon: '🗺️', target: 3, reward: 40, category: 'explore' },

        // Social quests
        { id: 'high_happiness', title: 'Pure Joy', description: 'Keep happiness above 80%', icon: '😊', target: 80, reward: 25, category: 'social' },
        { id: 'perfect_stats', title: 'Perfect Balance', description: 'All stats above 70%', icon: '⭐', target: 70, reward: 50, category: 'social' },
    ];

    // Select 3 quests based on date hash
    const selectedIndices = new Set<number>();
    let seed = Math.abs(hash);
    while (selectedIndices.size < 3) {
        selectedIndices.add(seed % questPool.length);
        seed = (seed * 1103515245 + 12345) % 2147483647;
    }

    const todayQuests: Quest[] = Array.from(selectedIndices).map(idx => {
        const quest = questPool[idx];
        let current = 0;

        // Get current progress based on quest type
        if (quest.id.startsWith('bath')) current = lifetimeStats?.total_washes ?? 0;
        else if (quest.id.startsWith('feed')) current = lifetimeStats?.food_eaten ?? 0;
        else if (quest.id.startsWith('play')) current = lifetimeStats?.play_sessions ?? 0;

        // For daily quests, we use modulo to track "today's" progress
        // In a real implementation, you'd track daily resets
        const dailyCurrent = current % (quest.target + 5);

        return {
            ...quest,
            current: Math.min(dailyCurrent, quest.target),
            isCompleted: dailyCurrent >= quest.target,
            isClaimed: false,
        };
    });

    return todayQuests;
}

export function QuestBoardModal({ isOpen, onClose }: QuestBoardModalProps) {
    const { lifetimeStats, pet } = usePet();
    const [claimedQuests, setClaimedQuests] = useState<Set<string>>(new Set());

    // Get today's date string for quest generation
    const todayStr = new Date().toISOString().split('T')[0];

    // Generate quests
    const quests = useMemo(() => {
        const generated = generateDailyQuests(lifetimeStats, todayStr);
        return generated.map(q => ({
            ...q,
            isClaimed: claimedQuests.has(q.id),
        }));
    }, [lifetimeStats, todayStr, claimedQuests]);

    // Calculate time until reset
    const [timeUntilReset, setTimeUntilReset] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const diff = tomorrow.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeUntilReset(`${hours}h ${minutes}m`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, []);

    // Claim reward
    const claimReward = (questId: string) => {
        setClaimedQuests(prev => new Set([...prev, questId]));
        // In a real implementation, you'd also:
        // 1. Add coins to user's balance
        // 2. Persist claimed status to database
    };

    const completedCount = quests.filter(q => q.isCompleted).length;
    const claimedCount = quests.filter(q => q.isClaimed).length;

    if (!isOpen) return null;

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
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-lg bg-gradient-to-b from-amber-50 to-orange-50 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="relative p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
                        {/* Decorative elements */}
                        <div className="absolute top-2 right-16 text-4xl opacity-20">📋</div>
                        <div className="absolute bottom-2 left-8 text-3xl opacity-20">⭐</div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <Target size={28} />
                            <h2 className="text-2xl font-black">Daily Quests</h2>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-white/80 text-sm">
                                Complete tasks to earn rewards!
                            </p>
                            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-sm">
                                <Clock size={14} />
                                <span>Resets in {timeUntilReset}</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{completedCount}/3 completed</span>
                            </div>
                            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(completedCount / 3) * 100}%` }}
                                    className="h-full bg-white rounded-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quest List */}
                    <div className="p-5 space-y-3">
                        {quests.map((quest, index) => (
                            <motion.div
                                key={quest.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative p-4 rounded-2xl border-2 transition-all ${quest.isClaimed
                                        ? 'bg-green-50 border-green-200'
                                        : quest.isCompleted
                                            ? 'bg-amber-50 border-amber-300 shadow-md'
                                            : 'bg-white border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${quest.isCompleted ? 'bg-amber-100' : 'bg-gray-100'
                                        }`}>
                                        {quest.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold ${quest.isClaimed ? 'text-green-600' : 'text-slate-800'}`}>
                                                {quest.title}
                                            </h3>
                                            {quest.isCompleted && !quest.isClaimed && (
                                                <motion.span
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                    className="text-amber-500"
                                                >
                                                    <Sparkles size={16} />
                                                </motion.span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">{quest.description}</p>

                                        {/* Progress */}
                                        {!quest.isClaimed && (
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-400">
                                                        {quest.current}/{quest.target}
                                                    </span>
                                                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                                                        <Gift size={12} />
                                                        +{quest.reward} coins
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(quest.current / quest.target) * 100}%` }}
                                                        className={`h-full rounded-full ${quest.isCompleted ? 'bg-green-500' : 'bg-amber-500'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status/Action */}
                                    <div className="flex-shrink-0">
                                        {quest.isClaimed ? (
                                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                                <CheckCircle size={20} className="text-white" />
                                            </div>
                                        ) : quest.isCompleted ? (
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => claimReward(quest.id)}
                                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-shadow"
                                            >
                                                Claim
                                            </motion.button>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Circle size={20} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bonus section */}
                    {completedCount === 3 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-5 mb-5 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl text-white text-center"
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Star size={20} fill="currentColor" />
                                <span className="font-bold">All Quests Complete!</span>
                                <Star size={20} fill="currentColor" />
                            </div>
                            <p className="text-sm text-white/80">
                                Come back tomorrow for new challenges!
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default QuestBoardModal;
