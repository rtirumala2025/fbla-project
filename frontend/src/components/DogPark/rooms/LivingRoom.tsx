/**
 * LivingRoom.tsx - Full-screen layout with Stage + Dock
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Zap, Bell, BellOff, Clock, Gamepad2 } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';
import { RoomLayout, DockItemCard, ROOM_THEMES } from './RoomLayout';

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
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
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

    const stageContent = (
        <>
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

            {/* 3D Pet */}
            <motion.div animate={isSleeping ? { y: [0, -8, 0] } : {}} transition={{ duration: 3, repeat: Infinity }}>
                <PetViewer3D petType={petType} breed={petBreed as any} size={260} interactive={false} />
            </motion.div>

            {/* Pet Name */}
            <h2 className="mt-4 text-2xl font-bold text-white drop-shadow-lg">{petName}</h2>

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
                    <div className="text-3xl font-mono font-bold flex items-center gap-2">
                        <Clock size={24} /> {formatTime(remainingTime)}
                    </div>
                    <p className="text-white/60 text-sm mt-1">{selectedSleep?.label}... (+{selectedSleep?.energyRestore})</p>
                    <button onClick={cancelSleep} className="mt-3 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-500/30">
                        Wake Up
                    </button>
                </div>
            )}
        </>
    );

    const dockContent = (
        <>
            {/* Tab Switcher */}
            <div className="flex gap-2 mb-3">
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

            {/* Content */}
            <div className="flex gap-3 overflow-x-auto flex-1 items-center pb-2">
                {activeTab === 'rest' ? (
                    SLEEP_DURATIONS.map(sleep => (
                        <motion.button
                            key={sleep.label}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => !isSleeping && startSleep(sleep)}
                            disabled={isSleeping}
                            className={`min-w-[110px] h-[110px] flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border shrink-0
                                ${isSleeping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-amber-500/20'}
                                bg-amber-500/15 border-amber-500/30`}
                        >
                            <span className="text-3xl">{sleep.icon}</span>
                            <span className="text-sm font-semibold">{sleep.label}</span>
                            <span className="text-xs text-white/60">{formatTime(sleep.seconds)}</span>
                            <span className="text-xs text-emerald-400">+{sleep.energyRestore} ⚡</span>
                        </motion.button>
                    ))
                ) : toys.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-white/40 gap-2">
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
                            accentColor={ROOM_THEMES.living.accent}
                        />
                    ))
                )}
            </div>
        </>
    );

    return <RoomLayout room="living" stageContent={stageContent} dockContent={dockContent} />;
}

export default LivingRoom;
