/**
 * HouseWindow.tsx
 * 
 * Floating window for the Pet House building.
 * Features: Rest tab with sleep timer + notifications, Inventory tab
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Moon, Package, Zap, Bell, BellOff, Clock, Sparkles } from 'lucide-react';
import { BuildingInteractionWindow } from './BuildingInteractionWindow';
import { getInventory } from '../../api/finance';
import type { InventoryEntry } from '../../types/finance';
import './building-windows.css';

// Extended local type for display purposes
interface DisplayInventoryItem extends InventoryEntry {
    icon?: string;
    equipped?: boolean;
}

// Map a category to an icon for display
const getCategoryIcon = (category?: string | null): string => {
    const icons: Record<string, string> = {
        food: '🍖',
        toys: '🧸',
        toy: '🧸',
        furniture: '🛏️',
        accessories: '📿',
        care: '✨',
        medicine: '💊',
    };
    return icons[category?.toLowerCase() || ''] || '📦';
};

interface HouseWindowProps {
    isOpen: boolean;
    onClose: () => void;
    petName?: string;
    currentEnergy?: number;
    onSleepComplete?: (energyRestored: number) => void;
}

type TabType = 'rest' | 'inventory';

// Sleep durations in seconds (for demo, shorter times)
const SLEEP_DURATIONS = [
    { label: 'Quick Nap', seconds: 30, energyRestore: 20, icon: '😴' },
    { label: 'Rest', seconds: 120, energyRestore: 50, icon: '💤' },
    { label: 'Full Sleep', seconds: 300, energyRestore: 100, icon: '🌙' },
];

export function HouseWindow({
    isOpen,
    onClose,
    petName = 'Your pet',
    currentEnergy = 50,
    onSleepComplete
}: HouseWindowProps) {
    const [activeTab, setActiveTab] = useState<TabType>('rest');
    const [inventory, setInventory] = useState<DisplayInventoryItem[]>([]);
    const [loadingInventory, setLoadingInventory] = useState(false);

    // Sleep state
    const [isSleeping, setIsSleeping] = useState(false);
    const [sleepDuration, setSleepDuration] = useState(0);
    const [remainingTime, setRemainingTime] = useState(0);
    const [selectedSleep, setSelectedSleep] = useState<typeof SLEEP_DURATIONS[0] | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const wakeNotifiedRef = useRef(false);

    // Check notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    }, []);

    // Load inventory when tab changes
    useEffect(() => {
        if (isOpen && activeTab === 'inventory') {
            loadInventory();
        }
    }, [isOpen, activeTab]);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const loadInventory = async () => {
        setLoadingInventory(true);
        try {
            const data = await getInventory();
            // Add icon based on category
            const itemsWithIcons: DisplayInventoryItem[] = data.map(item => ({
                ...item,
                icon: getCategoryIcon(item.category)
            }));
            setInventory(itemsWithIcons);
        } catch (error) {
            console.error('Failed to load inventory:', error);
            // Mock data fallback
            setInventory([
                { item_id: '1', item_name: 'Premium Dog Food', quantity: 3, icon: '🍖', category: 'food' },
                { item_id: '2', item_name: 'Squeaky Toy', quantity: 1, icon: '🧸', category: 'toys' },
                { item_id: '4', item_name: 'Fancy Collar', quantity: 1, icon: '📿', category: 'accessories', equipped: true },
            ]);
        } finally {
            setLoadingInventory(false);
        }
    };

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
                    // Sleep complete
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }

                    // Send notification if enabled and not already sent
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
        <BuildingInteractionWindow
            isOpen={isOpen}
            onClose={onClose}
            title="Pet House"
            icon={<Home />}
            width={550}
            minHeight={450}
        >
            {/* Tabs */}
            <div className="building-tabs" style={{ margin: '-20px -20px 20px -20px' }}>
                <button
                    className={`building-tab ${activeTab === 'rest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rest')}
                >
                    <Moon size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Rest
                </button>
                <button
                    className={`building-tab ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    <Package size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Inventory
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'rest' && (
                    <motion.div
                        key="rest"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        {/* Sleeping Pet Animation */}
                        <div style={{
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {isSleeping ? (
                                <>
                                    {/* Sleeping pet */}
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.05, 1],
                                            y: [0, -5, 0]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                        style={{ fontSize: '5rem' }}
                                    >
                                        😴
                                    </motion.div>

                                    {/* Z's animation */}
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
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                delay: i * 0.5,
                                                ease: 'easeOut'
                                            }}
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
                                    style={{ fontSize: '5rem' }}
                                >
                                    🐕
                                </motion.div>
                            )}
                        </div>

                        {/* Energy Bar */}
                        <div style={{
                            width: '100%',
                            maxWidth: 300,
                            marginBottom: 24
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 8
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Zap size={16} color="#fbbf24" />
                                    Energy
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    {Math.min(100, currentEnergy + (isSleeping && selectedSleep ?
                                        Math.floor((sleepProgress / 100) * selectedSleep.energyRestore) : 0
                                    ))}%
                                </span>
                            </div>
                            <div style={{
                                height: 12,
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: 6,
                                overflow: 'hidden'
                            }}>
                                <motion.div
                                    style={{
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                                        borderRadius: 6
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
                            /* Sleep in progress */
                            <div style={{ textAlign: 'center', width: '100%', maxWidth: 300 }}>
                                <div style={{
                                    fontSize: '2.5rem',
                                    fontWeight: 700,
                                    marginBottom: 8,
                                    fontFamily: 'monospace'
                                }}>
                                    <Clock size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                    {formatTime(remainingTime)}
                                </div>

                                {/* Progress bar */}
                                <div style={{
                                    height: 8,
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    marginBottom: 16
                                }}>
                                    <motion.div
                                        style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                            borderRadius: 4
                                        }}
                                        animate={{ width: `${sleepProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>

                                <p style={{ color: '#94a3b8', marginBottom: 16 }}>
                                    {petName} is {selectedSleep?.label.toLowerCase()}...
                                    {selectedSleep && ` (+${selectedSleep.energyRestore} energy)`}
                                </p>

                                <button
                                    className="building-btn building-btn-danger"
                                    onClick={cancelSleep}
                                >
                                    Wake Up Early
                                </button>
                            </div>
                        ) : (
                            /* Sleep options */
                            <>
                                {/* Notification toggle */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    marginBottom: 20,
                                    padding: '10px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 10
                                }}>
                                    {notificationsEnabled ? (
                                        <Bell size={18} color="#10b981" />
                                    ) : (
                                        <BellOff size={18} color="#64748b" />
                                    )}
                                    <span style={{ flex: 1 }}>
                                        {notificationsEnabled
                                            ? "Notify me when pet wakes up"
                                            : "Enable wake-up notifications"
                                        }
                                    </span>
                                    {notificationPermission !== 'granted' ? (
                                        <button
                                            className="building-btn building-btn-primary"
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                            onClick={requestNotificationPermission}
                                        >
                                            Enable
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                            style={{
                                                width: 40,
                                                height: 22,
                                                borderRadius: 11,
                                                background: notificationsEnabled ? '#10b981' : 'rgba(255,255,255,0.2)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                background: 'white',
                                                position: 'absolute',
                                                top: 2,
                                                left: notificationsEnabled ? 20 : 2,
                                                transition: 'left 0.2s'
                                            }} />
                                        </button>
                                    )}
                                </div>

                                {/* Sleep duration options */}
                                <div style={{
                                    display: 'flex',
                                    gap: 12,
                                    width: '100%',
                                    justifyContent: 'center'
                                }}>
                                    {SLEEP_DURATIONS.map(sleep => (
                                        <motion.button
                                            key={sleep.label}
                                            className="building-btn building-btn-primary"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => startSleep(sleep)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                padding: '16px 20px',
                                                minWidth: 100
                                            }}
                                        >
                                            <span style={{ fontSize: '1.5rem', marginBottom: 4 }}>
                                                {sleep.icon}
                                            </span>
                                            <span style={{ fontWeight: 600 }}>{sleep.label}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                {formatTime(sleep.seconds)}
                                            </span>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                color: '#10b981',
                                                marginTop: 4
                                            }}>
                                                +{sleep.energyRestore} <Zap size={10} style={{ verticalAlign: 'middle' }} />
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {activeTab === 'inventory' && (
                    <motion.div
                        key="inventory"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {loadingInventory ? (
                            <div className="building-loading">
                                <div className="building-loading-spinner" />
                                <span>Loading inventory...</span>
                            </div>
                        ) : inventory.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: 40,
                                color: '#64748b'
                            }}>
                                <Package size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                                <p>No items in inventory</p>
                                <p style={{ fontSize: '0.85rem' }}>
                                    Visit the Gift Shop to buy items!
                                </p>
                            </div>
                        ) : (
                            <div className="building-grid">
                                {inventory.map(item => (
                                    <motion.div
                                        key={item.item_id}
                                        className={`building-grid-item ${item.equipped ? 'selected' : ''}`}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                                            {item.icon || '📦'}
                                        </div>
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                            {item.item_name}
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: '#94a3b8'
                                        }}>
                                            Qty: {item.quantity}
                                        </div>
                                        {item.equipped && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                background: '#10b981',
                                                borderRadius: 4,
                                                padding: '2px 6px',
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4
                                            }}>
                                                <Sparkles size={10} />
                                                Equipped
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </BuildingInteractionWindow>
    );
}

export default HouseWindow;
