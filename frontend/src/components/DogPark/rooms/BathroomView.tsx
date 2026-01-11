/**
 * BathroomView.tsx
 * 
 * Bathroom/Spa with Stage (3D Pet + cyan/blue gradient) + Dock (hygiene items)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bath, Droplets, Sparkles } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';
import { RoomLayout, DockItemCard, ROOM_THEMES } from './RoomLayout';

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
    if (name.includes('towel')) return '🛁';
    return '✨';
};

export function BathroomView({
    petName,
    petType = 'dog',
    petBreed = 'labrador',
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
        setTimeout(() => setShowBubbles(false), 2500);
    };

    const stageContent = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
        }}>
            {/* Bubbles Animation */}
            <AnimatePresence>
                {showBubbles && [...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 100, x: (Math.random() - 0.5) * 300 }}
                        animate={{ opacity: [0, 1, 0], y: -200 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, delay: i * 0.1 }}
                        style={{
                            position: 'absolute',
                            fontSize: '2rem',
                            pointerEvents: 'none',
                        }}
                    >
                        🫧
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* 3D Pet */}
            <motion.div animate={isWashing ? { rotate: [0, -5, 5, 0] } : {}} transition={{ duration: 0.5, repeat: isWashing ? Infinity : 0 }}>
                <PetViewer3D
                    petType={petType}
                    breed={petBreed as any}
                    size={280}
                    interactive={false}
                />
            </motion.div>

            {/* Pet Name + Hygiene */}
            <h2 style={{
                marginTop: 16,
                fontSize: '1.5rem',
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
                {petName}'s Spa
            </h2>

            {/* Hygiene Bar */}
            <div style={{
                width: 200,
                marginTop: 12,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Droplets size={14} /> Cleanliness
                    </span>
                    <span style={{ fontWeight: 700 }}>{currentHygiene}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                        animate={{ width: `${currentHygiene}%` }}
                        style={{
                            height: '100%',
                            background: currentHygiene > 60 ? '#0ea5e9' : currentHygiene > 30 ? '#f59e0b' : '#ef4444',
                            borderRadius: 4,
                        }}
                    />
                </div>
            </div>

            {/* Quick Wash Button */}
            {onQuickWash && (
                <motion.button
                    onClick={handleQuickWash}
                    disabled={isWashing}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        marginTop: 20,
                        padding: '14px 32px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                        color: '#fff',
                        cursor: isWashing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        boxShadow: '0 4px 20px rgba(14, 165, 233, 0.4)',
                        opacity: isWashing ? 0.7 : 1,
                    }}
                >
                    {isWashing ? (
                        <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🫧</motion.span> Washing...</>
                    ) : (
                        <><Bath size={20} /> Quick Bubble Bath</>
                    )}
                </motion.button>
            )}
        </div>
    );

    const dockContent = (
        <>
            {/* Dock Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                color: 'rgba(255, 255, 255, 0.8)',
            }}>
                <Sparkles size={18} />
                <span style={{ fontWeight: 600 }}>Spa Supplies</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    {hygieneItems.length} items
                </span>
            </div>

            {/* Items Grid */}
            {hygieneItems.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)',
                    gap: 10,
                }}>
                    <Bath size={24} />
                    <span>No spa supplies - visit the shop!</span>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    gap: 12,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    paddingBottom: 8,
                    flex: 1,
                    alignItems: 'center',
                }}>
                    {hygieneItems.map(item => (
                        <DockItemCard
                            key={item.item_id}
                            emoji={getHygieneEmoji(item.item_name)}
                            name={item.item_name}
                            quantity={item.quantity}
                            onClick={() => onUseItem(item)}
                            disabled={isWashing}
                            accentColor={ROOM_THEMES.bathroom.accent}
                        />
                    ))}
                </div>
            )}
        </>
    );

    return (
        <RoomLayout
            room="bathroom"
            stageContent={stageContent}
            dockContent={dockContent}
        />
    );
}

export default BathroomView;
