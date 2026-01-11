/**
 * BathroomView.tsx - Spa-like hygiene layout
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
    return '✨';
};

export function BathroomView({
    petName, hygieneItems, currentHygiene, onUseItem, onQuickWash, isWashing = false,
}: BathroomViewProps) {
    const [showBubbles, setShowBubbles] = useState(false);

    const handleQuickWash = () => {
        setShowBubbles(true);
        onQuickWash?.();
        setTimeout(() => setShowBubbles(false), 2500);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 'calc(100vh - 180px)', padding: '30px 20px' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 600 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', padding: '30px 50px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)', borderRadius: 24, border: '1px solid rgba(59, 130, 246, 0.2)', position: 'relative', overflow: 'hidden', width: '100%', marginBottom: 24 }}>
                    <AnimatePresence>
                        {showBubbles && [...Array(10)].map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 80 }} animate={{ opacity: [0, 1, 0], y: -100 }} exit={{ opacity: 0 }} transition={{ duration: 2, delay: i * 0.1 }} style={{ position: 'absolute', fontSize: '2rem', left: `${20 + i * 8}%`, bottom: 0 }}>🫧</motion.div>
                        ))}
                    </AnimatePresence>
                    <motion.div animate={isWashing ? { rotate: [0, -8, 8, 0] } : { y: [0, -5, 0] }} transition={{ duration: 1, repeat: Infinity }} style={{ fontSize: '6rem', marginBottom: 16 }}>🐕</motion.div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>{petName}'s Spa</h2>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.6)' }}>Keep your pet clean and fresh</p>
                </div>

                {/* Hygiene Bar */}
                <div style={{ width: '100%', padding: '20px 28px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Droplets size={18} color="#3b82f6" /> Cleanliness</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{currentHygiene}%</span>
                    </div>
                    <div style={{ height: 14, background: 'rgba(255,255,255,0.1)', borderRadius: 7, overflow: 'hidden' }}>
                        <motion.div animate={{ width: `${currentHygiene}%` }} style={{ height: '100%', background: currentHygiene > 60 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : currentHygiene > 30 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)', borderRadius: 7 }} />
                    </div>
                </div>

                {/* Quick Wash */}
                {onQuickWash && (
                    <motion.button onClick={handleQuickWash} disabled={isWashing} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ width: '100%', padding: '22px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: '1.15rem', fontWeight: 600, border: 'none', borderRadius: 16, cursor: isWashing ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.3))', color: '#fff', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)', opacity: isWashing ? 0.7 : 1 }}>
                        {isWashing ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} style={{ fontSize: '1.5rem' }}>🫧</motion.span>Washing...</> : <><Bath size={24} /> Quick Bubble Bath <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>(+15 Hygiene)</span></>}
                    </motion.button>
                )}

                {/* Items */}
                <div style={{ width: '100%' }}>
                    <h4 style={{ marginBottom: 16, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={18} /> Spa Supplies</h4>
                    {hygieneItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
                            <Bath size={48} style={{ marginBottom: 16, opacity: 0.3 }} /><p>No supplies - visit the shop!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                            {hygieneItems.map(item => (
                                <motion.button key={item.item_id} onClick={() => onUseItem(item)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', padding: 20, background: 'rgba(35, 35, 45, 0.7)', borderRadius: 16, color: '#fff' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{getHygieneEmoji(item.item_name)}</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>{item.item_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>x{item.quantity}</div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default BathroomView;
