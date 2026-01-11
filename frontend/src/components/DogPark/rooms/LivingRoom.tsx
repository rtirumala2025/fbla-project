/**
 * LivingRoom.tsx - Main hub room with Rest/Play and 3D pet
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Zap, Bell, BellOff, Clock, Gamepad2 } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';

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

export function LivingRoom({ petName, petType = 'dog', petBreed = 'labrador', currentEnergy, onSleepComplete, toys, onUseToy }: LivingRoomProps) {
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
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, justifyContent: 'center' }}>
                {[{ id: 'rest', icon: <Moon size={18} />, label: 'Rest' }, { id: 'play', icon: <Gamepad2 size={18} />, label: 'Play' }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as 'rest' | 'play')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.3)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 500, transition: 'all 0.2s' }}>{tab.icon} {tab.label}</button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'rest' ? (
                    <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* 3D Pet Display */}
                        <div style={{ marginBottom: 24 }}>
                            <PetViewer3D
                                petType={petType}
                                breed={petBreed as any}
                                size={200}
                                interactive={false}
                            />
                        </div>

                        {/* Energy Bar */}
                        <div style={{ width: '100%', maxWidth: 320, marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={18} color="#fbbf24" /> Energy</span><span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{Math.min(100, currentEnergy + (isSleeping && selectedSleep ? Math.floor((sleepProgress / 100) * selectedSleep.energyRestore) : 0))}%</span></div>
                            <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}><motion.div animate={{ width: `${Math.min(100, currentEnergy + (isSleeping && selectedSleep ? (sleepProgress / 100) * selectedSleep.energyRestore : 0))}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 5 }} /></div>
                        </div>

                        {isSleeping ? (
                            <div style={{ textAlign: 'center', width: '100%', maxWidth: 320 }}>
                                <div style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 8, fontFamily: 'monospace' }}><Clock size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />{formatTime(remainingTime)}</div>
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}><motion.div animate={{ width: `${sleepProgress}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 3 }} /></div>
                                <p style={{ color: '#94a3b8', marginBottom: 14, fontSize: '0.9rem' }}>{petName} is {selectedSleep?.label.toLowerCase()}... (+{selectedSleep?.energyRestore})</p>
                                <button onClick={cancelSleep} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'rgba(255, 80, 80, 0.2)', color: '#ff8888', cursor: 'pointer', fontWeight: 600 }}>Wake Up Early</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, fontSize: '0.9rem' }}>
                                    {notificationsEnabled ? <Bell size={16} color="#10b981" /> : <BellOff size={16} color="#64748b" />}
                                    <span style={{ flex: 1 }}>{notificationsEnabled ? "Notify when pet wakes" : "Enable notifications"}</span>
                                    {notificationPermission !== 'granted' ? <button onClick={requestNotificationPermission} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(99, 102, 241, 0.3)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>Enable</button> : <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} style={{ width: 40, height: 22, borderRadius: 11, background: notificationsEnabled ? '#10b981' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', position: 'relative' }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: notificationsEnabled ? 20 : 4, transition: 'left 0.2s' }} /></button>}
                                </div>
                                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {SLEEP_DURATIONS.map(sleep => (
                                        <motion.button key={sleep.label} whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.96 }} onClick={() => startSleep(sleep)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px', minWidth: 110, background: 'rgba(99, 102, 241, 0.25)', borderRadius: 14, border: '1px solid rgba(99, 102, 241, 0.3)', cursor: 'pointer', color: '#fff' }}>
                                            <span style={{ fontSize: '1.8rem', marginBottom: 6 }}>{sleep.icon}</span>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sleep.label}</span>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{formatTime(sleep.seconds)}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 4 }}>+{sleep.energyRestore} <Zap size={10} style={{ verticalAlign: 'middle' }} /></span>
                                        </motion.button>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: 20, color: '#94a3b8', fontSize: '1.1rem' }}>🎮 Your Toys</h3>
                        {toys.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}><Gamepad2 size={56} style={{ marginBottom: 16, opacity: 0.3 }} /><p style={{ fontSize: '1rem' }}>No toys in inventory</p><p style={{ fontSize: '0.9rem' }}>Visit the shop to buy toys!</p></div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16, width: '100%', maxWidth: 550 }}>
                                {toys.map(toy => (
                                    <motion.button key={toy.item_id} onClick={() => onUseToy?.(toy)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', padding: 16, background: 'rgba(35, 35, 45, 0.7)', borderRadius: 14, color: '#fff' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🧸</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{toy.item_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>x{toy.quantity}</div>
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
