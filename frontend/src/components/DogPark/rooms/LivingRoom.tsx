/**
 * LivingRoom.tsx - Stage + Dock (transparent, gradient comes from parent)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Zap, Clock, Gamepad2 } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';
import { DockItemCard, ROOM_THEMES } from './RoomLayout';

const SLEEP_DURATIONS = [
    { label: 'Quick Nap', seconds: 30, energyRestore: 20, icon: '😴' },
    { label: 'Rest', seconds: 120, energyRestore: 50, icon: '💤' },
    { label: 'Full Sleep', seconds: 300, energyRestore: 100, icon: '🌙' },
];

interface LivingRoomProps {
    petName: string;
    petType?: PetGame2PetType;
    petBreed?: string;
    currentEnergy: number;
    onSleepComplete?: (energyRestored: number) => void;
    toys: InventoryEntry[];
    onUseToy?: (item: InventoryEntry) => void;
}

export function LivingRoom({
    petName, petType = 'dog', petBreed = 'labrador', currentEnergy, onSleepComplete, toys, onUseToy,
}: LivingRoomProps) {
    const [isSleeping, setIsSleeping] = useState(false);
    const [sleepDuration, setSleepDuration] = useState(0);
    const [remainingTime, setRemainingTime] = useState(0);
    const [selectedSleep, setSelectedSleep] = useState<typeof SLEEP_DURATIONS[0] | null>(null);
    const [activeTab, setActiveTab] = useState<'rest' | 'play'>('rest');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    const startSleep = useCallback((sleep: typeof SLEEP_DURATIONS[0]) => {
        setSelectedSleep(sleep);
        setSleepDuration(sleep.seconds);
        setRemainingTime(sleep.seconds);
        setIsSleeping(true);
        timerRef.current = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setIsSleeping(false);
                    onSleepComplete?.(sleep.energyRestore);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [onSleepComplete]);

    const cancelSleep = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsSleeping(false);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const sleepProgress = sleepDuration > 0 ? ((sleepDuration - remainingTime) / sleepDuration) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Stage */}
            <div className="flex-1 relative min-h-0">
                {/* 3D Canvas - fills entire stage */}
                <PetViewer3D petType={petType} breed={petBreed as any} interactive={true} currentRoom="living" />

                {/* Floating UI overlays */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-8">
                    {/* Floor shadow */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Sleeping Z's */}
                    <AnimatePresence>
                        {isSleeping && [0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 60, y: 0 }}
                                animate={{ opacity: [0, 1, 0], x: 100, y: -80 }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                                className="absolute text-3xl font-bold text-amber-400"
                                style={{ top: '35%', right: '30%' }}
                            >
                                Z
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Pet Name and Energy */}
                    <div className="relative z-10 flex flex-col items-center pointer-events-auto">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">{petName}</h2>

                        {/* Energy Bar */}
                        <div className="w-48 mt-3">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="flex items-center gap-1"><Zap size={14} className="text-amber-400" /> Energy</span>
                                <span className="font-bold">{Math.min(100, currentEnergy + (isSleeping && selectedSleep ? Math.floor((sleepProgress / 100) * selectedSleep.energyRestore) : 0))}%</span>
                            </div>
                            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: `${Math.min(100, currentEnergy + (isSleeping && selectedSleep ? (sleepProgress / 100) * selectedSleep.energyRestore : 0))}%` }}
                                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                                />
                            </div>
                        </div>

                        {/* Sleep Progress */}
                        {isSleeping && (
                            <div className="mt-4 text-center">
                                <div className="text-3xl font-mono font-bold flex items-center gap-2 text-white">
                                    <Clock size={24} /> {formatTime(remainingTime)}
                                </div>
                                <p className="text-white/60 text-sm mt-1">{selectedSleep?.label}... (+{selectedSleep?.energyRestore})</p>
                                <button onClick={cancelSleep} className="mt-3 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-500/30">
                                    Wake Up
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dock - Floating Island */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90%] bg-black/60 backdrop-blur-md border border-white/10 rounded-3xl p-4 flex flex-col shadow-2xl">

                {/* Tabs */}
                <div className="flex gap-2 mb-3 justify-center">
                    {[{ id: 'rest', icon: <Moon size={16} />, label: 'Rest' }, { id: 'play', icon: <Gamepad2 size={16} />, label: 'Play' }].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'rest' | 'play')}
                            className={`px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-amber-500/30 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Items */}
                <div className="flex gap-3 overflow-x-auto flex-1 items-center pb-2 hide-scrollbar justify-center">
                    {activeTab === 'rest' ? (
                        SLEEP_DURATIONS.map(sleep => (
                            <motion.button
                                key={sleep.label}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => !isSleeping && startSleep(sleep)}
                                disabled={isSleeping}
                                className={`min-w-[100px] h-[100px] flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border shrink-0 text-white
                                ${isSleeping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-amber-500/20'}
                                bg-amber-500/15 border-amber-500/30`}
                            >
                                <span className="text-2xl">{sleep.icon}</span>
                                <span className="text-xs font-semibold">{sleep.label}</span>
                                <span className="text-xs text-emerald-400">+{sleep.energyRestore} ⚡</span>
                            </motion.button>
                        ))
                    ) : toys.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-white/40 gap-2 px-8">
                            <Gamepad2 size={24} /> No toys - visit the shop!
                        </div>
                    ) : (
                        toys.map(toy => (
                            <DockItemCard
                                key={toy.item_id}
                                emoji="🧸"
                                name={toy.item_name}
                                quantity={toy.quantity}
                                onClick={() => onUseToy?.(toy)}
                            />
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default LivingRoom;

