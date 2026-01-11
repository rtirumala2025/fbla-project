/**
 * BathroomView.tsx
 * 
 * Bathroom room for pet hygiene. Shows hygiene items and wash functionality.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bath, Droplets, Sparkles } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';

interface BathroomViewProps {
    petName: string;
    hygieneItems: InventoryEntry[];
    currentHygiene: number;
    onUseItem: (item: InventoryEntry) => void;
    onQuickWash?: () => void;
    isWashing?: boolean;
}

const getHygieneEmoji = (itemName: string): string => {
    const name = itemName.toLowerCase();
    if (name.includes('shampoo')) return '🧴';
    if (name.includes('brush')) return '🪥';
    if (name.includes('soap')) return '🧼';
    if (name.includes('towel')) return '🛁';
    if (name.includes('spray')) return '💨';
    return '✨';
};

export function BathroomView({
    petName,
    hygieneItems,
    currentHygiene,
    onUseItem,
    onQuickWash,
    isWashing = false,
}: BathroomViewProps) {
    const [showBubbles, setShowBubbles] = useState(false);

    const handleQuickWash = () => {
        setShowBubbles(true);
        onQuickWash?.();
        setTimeout(() => setShowBubbles(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            {/* Bathroom Header */}
            <div style={{
                textAlign: 'center',
                marginBottom: 20,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))',
                borderRadius: 12,
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Bubble animation */}
                <AnimatePresence>
                    {showBubbles && [...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50, x: Math.random() * 200 - 100 }}
                            animate={{ opacity: [0, 1, 0], y: -60, x: Math.random() * 200 - 100 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, delay: i * 0.1 }}
                            style={{
                                position: 'absolute',
                                fontSize: '1.5rem',
                                left: '50%',
                                bottom: 0,
                            }}
                        >
                            🫧
                        </motion.div>
                    ))}
                </AnimatePresence>

                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🛁</div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    {petName}'s Bathroom
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Keep your pet clean and fresh
                </p>
            </div>

            {/* Hygiene Bar */}
            <div style={{
                marginBottom: 20,
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 10,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Droplets size={14} color="#3b82f6" /> Cleanliness
                    </span>
                    <span style={{ fontWeight: 600 }}>{currentHygiene}%</span>
                </div>
                <div style={{
                    height: 8,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    overflow: 'hidden',
                }}>
                    <motion.div
                        style={{
                            height: '100%',
                            background: currentHygiene > 60
                                ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                                : currentHygiene > 30
                                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                    : 'linear-gradient(90deg, #ef4444, #f87171)',
                            borderRadius: 4,
                        }}
                        animate={{ width: `${currentHygiene}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Quick Wash Button */}
            {onQuickWash && (
                <motion.button
                    className="building-btn building-btn-primary"
                    onClick={handleQuickWash}
                    disabled={isWashing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        width: '100%',
                        padding: '14px',
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: '1rem',
                        opacity: isWashing ? 0.6 : 1,
                    }}
                >
                    {isWashing ? (
                        <>
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                🫧
                            </motion.span>
                            Washing...
                        </>
                    ) : (
                        <>
                            <Bath size={18} /> Quick Wash (+15 Hygiene)
                        </>
                    )}
                </motion.button>
            )}

            {/* Hygiene Items */}
            <h4 style={{ marginBottom: 12, fontSize: '0.95rem', color: '#94a3b8' }}>
                <Sparkles size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Hygiene Items
            </h4>

            {hygieneItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                    <Bath size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <p style={{ fontSize: '0.9rem' }}>No hygiene items</p>
                    <p style={{ fontSize: '0.8rem' }}>Buy items from the shop!</p>
                </div>
            ) : (
                <div className="building-grid" style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 10,
                }}>
                    {hygieneItems.map(item => (
                        <motion.button
                            key={item.item_id}
                            className="building-grid-item"
                            onClick={() => onUseItem(item)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                cursor: 'pointer',
                                border: 'none',
                                textAlign: 'center',
                                padding: 14,
                            }}
                        >
                            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>
                                {getHygieneEmoji(item.item_name)}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 4 }}>
                                {item.item_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                x{item.quantity}
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

export default BathroomView;
