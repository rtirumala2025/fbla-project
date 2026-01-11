/**
 * LivingRoom.tsx - Main hub room with Rest/Play
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Zap, Bell, BellOff, Clock, Gamepad2 } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';

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

export function LivingRoom({ petName, currentEnergy, onSleepComplete, toys, onUseToy }: LivingRoomProps) {
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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: 'calc(100vh - 180px)', padding: '20px 0' }}>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center' }}>
                {[{ id: 'rest', icon: <Moon size={18} />, label: 'Rest' }, { id: 'play', icon: <Gamepad2 size={18} />, label: 'Play' }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as 'rest' | 'play')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.3)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 500, transition: 'all 0.2s' }}>{tab.icon} {tab.label}</button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'rest' ? (
                    <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Pet Display */}
                        <div style={{ width: 240, height: 240, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, position: 'relative' }}>
                            {isSleeping ? (
                                <>
                                    <motion.div animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: '6rem' }}>😴</motion.div>
                                    {[...Array(3)].map((_, i) => <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], x: [20, 60], y: [-20, -80] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} style={{ position: 'absolute', fontSize: '2rem', color: '#a5b4fc', fontWeight: 700 }}>Z</motion.div>)}
                                </>
                            ) : <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: '6rem' }}>🐕</motion.div>}
                        </div>

                        {/* Energy Bar */}
                        <div style={{ width: '100%', maxWidth: 350, marginBottom: 28 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={18} color="#fbbf24" /> Energy</span><span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{Math.min(100, currentEnergy + (isSleeping && selectedSleep ? Math.floor((sleepProgress / 100) * selectedSleep.energyRestore) : 0))}%</span></div>
                            <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}><motion.div animate={{ width: `${Math.min(100, currentEnergy + (isSleeping && selectedSleep ? (sleepProgress / 100) * selectedSleep.energyRestore : 0))}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 6 }} /></div>
                        </div>

                        {isSleeping ? (
                            <div style={{ textAlign: 'center', width: '100%', maxWidth: 350 }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 10, fontFamily: 'monospace' }}><Clock size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />{formatTime(remainingTime)}</div>
                                <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}><motion.div animate={{ width: `${sleepProgress}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4 }} /></div>
                                <p style={{ color: '#94a3b8', marginBottom: 16 }}>{petName} is {selectedSleep?.label.toLowerCase()}... (+{selectedSleep?.energyRestore} energy)</p>
                                <button onClick={cancelSleep} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'rgba(255, 80, 80, 0.2)', color: '#ff8888', cursor: 'pointer', fontWeight: 600 }}>Wake Up Early</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                                    {notificationsEnabled ? <Bell size={18} color="#10b981" /> : <BellOff size={18} color="#64748b" />}
                                    <span style={{ flex: 1 }}>{notificationsEnabled ? "Notify when pet wakes" : "Enable notifications"}</span>
                                    {notificationPermission !== 'granted' ? <button onClick={requestNotificationPermission} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(99, 102, 241, 0.3)', color: '#fff', cursor: 'pointer' }}>Enable</button> : <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} style={{ width: 44, height: 24, borderRadius: 12, background: notificationsEnabled ? '#10b981' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', position: 'relative' }}><div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: notificationsEnabled ? 22 : 4, transition: 'left 0.2s' }} /></button>}
                                </div>
                                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {SLEEP_DURATIONS.map(sleep => (
                                        <motion.button key={sleep.label} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => startSleep(sleep)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px', minWidth: 120, background: 'rgba(99, 102, 241, 0.25)', borderRadius: 16, border: '1px solid rgba(99, 102, 241, 0.3)', cursor: 'pointer', color: '#fff' }}>
                                            <span style={{ fontSize: '2rem', marginBottom: 8 }}>{sleep.icon}</span>
                                            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{sleep.label}</span>
                                            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{formatTime(sleep.seconds)}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 6 }}>+{sleep.energyRestore} <Zap size={10} style={{ verticalAlign: 'middle' }} /></span>
                                        </motion.button>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: 24, color: '#94a3b8', fontSize: '1.2rem' }}>🎮 Your Toys</h3>
                        {toys.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 50, color: '#64748b' }}><Gamepad2 size={64} style={{ marginBottom: 20, opacity: 0.3 }} /><p style={{ fontSize: '1.1rem' }}>No toys in inventory</p><p>Visit the shop to buy toys!</p></div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 20, width: '100%', maxWidth: 600 }}>
                                {toys.map(toy => (
                                    <motion.button key={toy.item_id} onClick={() => onUseToy?.(toy)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', padding: 20, background: 'rgba(35, 35, 45, 0.7)', borderRadius: 16, color: '#fff' }}>
                                        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🧸</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>{toy.item_name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>x{toy.quantity}</div>
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
