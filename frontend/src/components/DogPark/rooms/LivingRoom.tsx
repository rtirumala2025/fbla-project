/**
 * LivingRoom.tsx
 * 
 * The main hub room featuring Rest/Sleep functionality and toy usage.
 * Migrated from the old "Rest" tab in HouseWindow.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Zap, Bell, BellOff, Clock, Gamepad2 } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';

// Sleep durations in seconds (for demo, shorter times)
const SLEEP_DURATIONS = [
    { label: 'Quick Nap', seconds: 30, energyRestore: 20, icon: '😴' },
    { label: 'Rest', seconds: 120, energyRestore: 50, icon: '💤' },
    { label: 'Full Sleep', seconds: 300, energyRestore: 100, icon: '🌙' },
];

interface LivingRoomProps {
    petName: string;
    currentEnergy: number;
    onSleepComplete?: (energyRestored: number) => void;
    toys: InventoryEntry[];
    onUseToy?: (item: InventoryEntry) => void;
}

export function LivingRoom({
    petName,
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

    // Check notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    }, []);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

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
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }

                    if (notificationsEnabled && !wakeNotifiedRef.current) {
                        wakeNotifiedRef.current = true;
                        new Notification(`${petName} is awake! 🌞`, {
                            body: `${petName} has finished resting and is ready to play! Energy restored: +${sleep.energyRestore}`,
                            icon: '/pet-icon.png',
                            tag: 'pet-wake-notification'
                        });
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
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsSleeping(false);
        setRemainingTime(0);
        setSelectedSleep(null);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const sleepProgress = sleepDuration > 0 ? ((sleepDuration - remainingTime) / sleepDuration) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            {/* Sub-tabs: Rest / Play */}
            <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 20,
                justifyContent: 'center',
            }}>
                <button
                    onClick={() => setActiveTab('rest')}
                    style={{
                        padding: '8px 20px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'rest' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                        color: activeTab === 'rest' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                    }}
                >
                    <Moon size={16} /> Rest
                </button>
                <button
                    onClick={() => setActiveTab('play')}
                    style={{
                        padding: '8px 20px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'play' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                        color: activeTab === 'play' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                    }}
                >
                    <Gamepad2 size={16} /> Play
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'rest' ? (
                    <motion.div
                        key="rest"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        {/* Sleeping Pet Animation */}
                        <div style={{
                            width: 180,
                            height: 180,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 20,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {isSleeping ? (
                                <>
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{ fontSize: '4.5rem' }}
                                    >
                                        😴
                                    </motion.div>
                                    {[...Array(3)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                                            animate={{
                                                opacity: [0, 1, 0],
                                                x: [20, 40, 60],
                                                y: [-20, -50, -80],
                                                scale: [0.5, 1, 0.5]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
                                            style={{
                                                position: 'absolute',
                                                fontSize: '1.5rem',
                                                color: '#a5b4fc',
                                                fontWeight: 700
                                            }}
                                        >
                                            Z
                                        </motion.div>
                                    ))}
                                </>
                            ) : (
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{ fontSize: '4.5rem' }}
                                >
                                    🐕
                                </motion.div>
                            )}
                        </div>

                        {/* Energy Bar */}
                        <div style={{ width: '100%', maxWidth: 280, marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                                    <Zap size={14} color="#fbbf24" /> Energy
                                </span>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                    {Math.min(100, currentEnergy + (isSleeping && selectedSleep ?
                                        Math.floor((sleepProgress / 100) * selectedSleep.energyRestore) : 0
                                    ))}%
                                </span>
                            </div>
                            <div style={{
                                height: 10,
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: 5,
                                overflow: 'hidden'
                            }}>
                                <motion.div
                                    style={{
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                                        borderRadius: 5
                                    }}
                                    animate={{
                                        width: `${Math.min(100, currentEnergy + (isSleeping && selectedSleep ?
                                            (sleepProgress / 100) * selectedSleep.energyRestore : 0
                                        ))}%`
                                    }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {isSleeping ? (
                            <div style={{ textAlign: 'center', width: '100%', maxWidth: 280 }}>
                                <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 6, fontFamily: 'monospace' }}>
                                    <Clock size={20} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                    {formatTime(remainingTime)}
                                </div>
                                <div style={{
                                    height: 6,
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    marginBottom: 12
                                }}>
                                    <motion.div
                                        style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                            borderRadius: 3
                                        }}
                                        animate={{ width: `${sleepProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <p style={{ color: '#94a3b8', marginBottom: 12, fontSize: '0.85rem' }}>
                                    {petName} is {selectedSleep?.label.toLowerCase()}...
                                    {selectedSleep && ` (+${selectedSleep.energyRestore} energy)`}
                                </p>
                                <button
                                    className="building-btn building-btn-danger"
                                    onClick={cancelSleep}
                                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                >
                                    Wake Up Early
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 16,
                                    padding: '8px 14px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 8,
                                    fontSize: '0.85rem'
                                }}>
                                    {notificationsEnabled ? <Bell size={16} color="#10b981" /> : <BellOff size={16} color="#64748b" />}
                                    <span style={{ flex: 1 }}>
                                        {notificationsEnabled ? "Notify me when pet wakes up" : "Enable wake-up notifications"}
                                    </span>
                                    {notificationPermission !== 'granted' ? (
                                        <button
                                            className="building-btn building-btn-primary"
                                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                            onClick={requestNotificationPermission}
                                        >
                                            Enable
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                            style={{
                                                width: 36, height: 20, borderRadius: 10,
                                                background: notificationsEnabled ? '#10b981' : 'rgba(255,255,255,0.2)',
                                                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: 16, height: 16, borderRadius: '50%', background: 'white',
                                                position: 'absolute', top: 2, left: notificationsEnabled ? 18 : 2, transition: 'left 0.2s'
                                            }} />
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {SLEEP_DURATIONS.map(sleep => (
                                        <motion.button
                                            key={sleep.label}
                                            className="building-btn building-btn-primary"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => startSleep(sleep)}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                padding: '12px 16px', minWidth: 85
                                            }}
                                        >
                                            <span style={{ fontSize: '1.3rem', marginBottom: 2 }}>{sleep.icon}</span>
                                            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{sleep.label}</span>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{formatTime(sleep.seconds)}</span>
                                            <span style={{ fontSize: '0.65rem', color: '#10b981', marginTop: 2 }}>
                                                +{sleep.energyRestore} <Zap size={8} style={{ verticalAlign: 'middle' }} />
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="play"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <h4 style={{ textAlign: 'center', marginBottom: 16, color: '#94a3b8' }}>
                            🎮 Your Toys
                        </h4>
                        {toys.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                                <Gamepad2 size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                                <p>No toys in inventory</p>
                                <p style={{ fontSize: '0.85rem' }}>Visit the shop to buy toys!</p>
                            </div>
                        ) : (
                            <div className="building-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                                {toys.map(toy => (
                                    <motion.button
                                        key={toy.item_id}
                                        className="building-grid-item"
                                        onClick={() => onUseToy?.(toy)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ cursor: 'pointer', border: 'none', textAlign: 'left' }}
                                    >
                                        <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🧸</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{toy.item_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>x{toy.quantity}</div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default LivingRoom;
