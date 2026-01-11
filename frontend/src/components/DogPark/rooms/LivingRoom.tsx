/**
 * LivingRoom.tsx
 * 
 * Living Room with Stage (3D Pet + warm amber gradient) + Dock (sleep/play controls)
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
    petName,
    petType = 'dog',
    petBreed = 'labrador',
    currentEnergy,
    onSleepComplete,
    toys,
    onUseToy,
}: LivingRoomProps) {
    const [isSleeping, setIsSleeping] = useState(false);
    const [sleepDuration, setSleepDuration] = useState(0);
    const [remainingTime, setRemainingTime] = useState(0);
    const [selectedSleep, setSelectedSleep] = useState<typeof SLEEP_DURATIONS[0] | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [activeTab, setActiveTab] = useState<'rest' | 'play'>('rest');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const wakeNotifiedRef = useRef(false);

    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    }, []);

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            setNotificationsEnabled(permission === 'granted');
        }
    };

    const startSleep = useCallback((sleep: typeof SLEEP_DURATIONS[0]) => {
        setSelectedSleep(sleep);
        setSleepDuration(sleep.seconds);
        setRemainingTime(sleep.seconds);
        setIsSleeping(true);
        wakeNotifiedRef.current = false;
        timerRef.current = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
                    if (notificationsEnabled && !wakeNotifiedRef.current) {
                        wakeNotifiedRef.current = true;
                        new Notification(`${petName} is awake! 🌞`, { body: `Energy restored: +${sleep.energyRestore}`, tag: 'pet-wake' });
                    }
                    setIsSleeping(false);
                    onSleepComplete?.(sleep.energyRestore);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [notificationsEnabled, petName, onSleepComplete]);

    const cancelSleep = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setIsSleeping(false); setRemainingTime(0); setSelectedSleep(null);
    }, []);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const sleepProgress = sleepDuration > 0 ? ((sleepDuration - remainingTime) / sleepDuration) * 100 : 0;

    const stageContent = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
        }}>
            {/* Sleeping Z's Animation */}
            <AnimatePresence>
                {isSleeping && [...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 80, y: 0 }}
                        animate={{ opacity: [0, 1, 0], x: 120, y: -100 }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                        style={{
                            position: 'absolute',
                            top: '30%',
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: ROOM_THEMES.living.accent,
                            pointerEvents: 'none',
                        }}
                    >
                        Z
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* 3D Pet */}
            <motion.div animate={isSleeping ? { y: [0, -5, 0] } : {}} transition={{ duration: 3, repeat: Infinity }}>
                <PetViewer3D
                    petType={petType}
                    breed={petBreed as any}
                    size={280}
                    interactive={false}
                />
            </motion.div>

            {/* Pet Name */}
            <h2 style={{
                marginTop: 16,
                fontSize: '1.5rem',
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
                {petName}
            </h2>

            {/* Energy Bar */}
            <div style={{ width: 200, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} color="#fbbf24" /> Energy
                    </span>
                    <span style={{ fontWeight: 700 }}>
                        {Math.min(100, currentEnergy + (isSleeping && selectedSleep ? Math.floor((sleepProgress / 100) * selectedSleep.energyRestore) : 0))}%
                    </span>
                </div>
                <div style={{ height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                        animate={{ width: `${Math.min(100, currentEnergy + (isSleeping && selectedSleep ? (sleepProgress / 100) * selectedSleep.energyRestore : 0))}%` }}
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                            borderRadius: 4,
                        }}
                    />
                </div>
            </div>

            {/* Sleep Progress (when sleeping) */}
            {isSleeping && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                    }}>
                        <Clock size={24} /> {formatTime(remainingTime)}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: 6 }}>
                        {selectedSleep?.label}... (+{selectedSleep?.energyRestore} energy)
                    </p>
                    <button
                        onClick={cancelSleep}
                        style={{
                            marginTop: 12,
                            padding: '8px 20px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'rgba(255, 80, 80, 0.25)',
                            color: '#ff8888',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        Wake Up
                    </button>
                </div>
            )}
        </div>
    );

    const dockContent = (
        <>
            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[{ id: 'rest', icon: <Moon size={16} />, label: 'Rest' }, { id: 'play', icon: <Gamepad2 size={16} />, label: 'Play' }].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'rest' | 'play')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            background: activeTab === tab.id ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.9rem',
                            fontWeight: 500,
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}

                {/* Notification toggle */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    {notificationsEnabled ? <Bell size={14} color="#10b981" /> : <BellOff size={14} />}
                    {notificationPermission !== 'granted' ? (
                        <button onClick={requestNotificationPermission} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(99, 102, 241, 0.3)', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>Enable</button>
                    ) : (
                        <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} style={{ width: 36, height: 20, borderRadius: 10, background: notificationsEnabled ? '#10b981' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', position: 'relative' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: notificationsEnabled ? 18 : 4, transition: 'left 0.2s' }} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content based on tab */}
            {activeTab === 'rest' ? (
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', flex: 1, alignItems: 'center' }}>
                    {SLEEP_DURATIONS.map(sleep => (
                        <motion.button
                            key={sleep.label}
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => !isSleeping && startSleep(sleep)}
                            disabled={isSleeping}
                            style={{
                                minWidth: 110,
                                height: 110,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: 12,
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                borderRadius: 16,
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                cursor: isSleeping ? 'not-allowed' : 'pointer',
                                color: '#fff',
                                opacity: isSleeping ? 0.5 : 1,
                                flexShrink: 0,
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>{sleep.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sleep.label}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{formatTime(sleep.seconds)}</span>
                            <span style={{ fontSize: '0.7rem', color: '#10b981' }}>+{sleep.energyRestore} <Zap size={10} style={{ verticalAlign: 'middle' }} /></span>
                        </motion.button>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', flex: 1, alignItems: 'center' }}>
                    {toys.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', gap: 10 }}>
                            <Gamepad2 size={24} />
                            <span>No toys - visit the shop!</span>
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
            )}
        </>
    );

    return (
        <RoomLayout
            room="living"
            stageContent={stageContent}
            dockContent={dockContent}
        />
    );
}

export default LivingRoom;
