/**
 * BathroomView.tsx - Spa-like hygiene layout with 3D pet
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bath, Droplets, Sparkles } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';

interface BathroomViewProps {
    petName: string;
    petType?: PetGame2PetType;
    petBreed?: string;
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
    petName, petType = 'dog', petBreed = 'labrador', hygieneItems, currentHygiene, onUseItem, onQuickWash, isWashing = false,
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
                {/* Header with 3D Pet */}
                <div style={{ textAlign: 'center', padding: '24px 40px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)', borderRadius: 24, border: '1px solid rgba(59, 130, 246, 0.2)', position: 'relative', overflow: 'hidden', width: '100%', marginBottom: 24 }}>
                    <AnimatePresence>
                        {showBubbles && [...Array(10)].map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 80 }} animate={{ opacity: [0, 1, 0], y: -100 }} exit={{ opacity: 0 }} transition={{ duration: 2, delay: i * 0.1 }} style={{ position: 'absolute', fontSize: '2rem', left: `${20 + i * 8}%`, bottom: 0 }}>🫧</motion.div>
                        ))}
                    </AnimatePresence>

                    {/* 3D Pet Display */}
                    <div style={{ marginBottom: 16, position: 'relative', zIndex: 1 }}>
                        <PetViewer3D
                            petType={petType}
                            breed={petBreed as any}
                            size={160}
                            interactive={false}
                        />
                    </div>

                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, marginBottom: 6, position: 'relative', zIndex: 1 }}>{petName}'s Spa</h2>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', position: 'relative', zIndex: 1 }}>Keep your pet clean and fresh</p>
                </div>

                {/* Hygiene Bar */}
                <div style={{ width: '100%', padding: '16px 24px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 14, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Droplets size={18} color="#3b82f6" /> Cleanliness</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{currentHygiene}%</span>
                    </div>
                    <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                        <motion.div animate={{ width: `${currentHygiene}%` }} style={{ height: '100%', background: currentHygiene > 60 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : currentHygiene > 30 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)', borderRadius: 6 }} />
                    </div>
                </div>

                {/* Quick Wash */}
                {onQuickWash && (
                    <motion.button onClick={handleQuickWash} disabled={isWashing} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%', padding: '18px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '1.1rem', fontWeight: 600, border: 'none', borderRadius: 14, cursor: isWashing ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.3))', color: '#fff', boxShadow: '0 6px 24px rgba(59, 130, 246, 0.2)', opacity: isWashing ? 0.7 : 1 }}>
                        {isWashing ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} style={{ fontSize: '1.3rem' }}>🫧</motion.span>Washing...</> : <><Bath size={22} /> Quick Bubble Bath</>}
                    </motion.button>
                )}

                {/* Items */}
                <div style={{ width: '100%' }}>
                    <h4 style={{ marginBottom: 14, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={16} /> Spa Supplies</h4>
                    {hygieneItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', borderRadius: 14 }}>
                            <Bath size={40} style={{ marginBottom: 12, opacity: 0.3 }} /><p>No supplies - visit the shop!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
                            {hygieneItems.map(item => (
                                <motion.button key={item.item_id} onClick={() => onUseItem(item)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', padding: 16, background: 'rgba(35, 35, 45, 0.7)', borderRadius: 14, color: '#fff' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>{getHygieneEmoji(item.item_name)}</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{item.item_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>x{item.quantity}</div>
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
