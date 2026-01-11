/**
 * ClosetView.tsx
 * 
 * Closet room for equipping accessories on the pet.
 * Premium split-screen layout: Large pet preview on left, accessory grid on right.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, Check, Sparkles } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';

interface ClosetViewProps {
    petName: string;
    accessories: InventoryEntry[];
    equippedLoadout: Record<string, string>; // slot -> item_id
    onToggleEquip: (item: InventoryEntry, slot: string) => void;
}

const getSlotFromItem = (item: InventoryEntry): string => {
    const name = item.item_name.toLowerCase();
    if (name.includes('collar') || name.includes('bowtie')) return 'collar';
    if (name.includes('hat') || name.includes('crown')) return 'hat';
    if (name.includes('glasses') || name.includes('shades')) return 'glasses';
    if (name.includes('bandana')) return 'bandana';
    if (name.includes('cape') || name.includes('wings')) return 'back';
    return 'collar';
};

const getAccessoryEmoji = (itemName: string): string => {
    const name = itemName.toLowerCase();
    if (name.includes('collar')) return '📿';
    if (name.includes('hat') || name.includes('crown')) return '👑';
    if (name.includes('glasses') || name.includes('shades')) return '🕶️';
    if (name.includes('bandana')) return '🧣';
    if (name.includes('bowtie')) return '🎀';
    if (name.includes('cape')) return '🦸';
    if (name.includes('wings')) return '👼';
    if (name.includes('party')) return '🎉';
    return '✨';
};

const SLOT_LABELS: Record<string, string> = {
    collar: 'Neck',
    hat: 'Head',
    glasses: 'Eyes',
    bandana: 'Neck',
    back: 'Back',
};

export function ClosetView({
    petName,
    accessories,
    equippedLoadout,
    onToggleEquip,
}: ClosetViewProps) {
    const isEquipped = (itemId: string): boolean => {
        return Object.values(equippedLoadout).includes(itemId);
    };

    const equippedCount = Object.keys(equippedLoadout).length;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{
                display: 'flex',
                gap: 32,
                height: '100%',
                minHeight: 'calc(100vh - 180px)',
                padding: '20px 0',
            }}
        >
            {/* Left: Large Pet Preview Panel (45% width) */}
            <div style={{
                flex: '0 0 45%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
                borderRadius: 24,
                padding: 32,
                border: '1px solid rgba(139, 92, 246, 0.2)',
            }}>
                {/* Header */}
                <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <Sparkles size={18} /> Preview
                </div>

                {/* Large Pet Display */}
                <div style={{
                    width: 280,
                    height: 320,
                    background: 'rgba(20, 20, 30, 0.6)',
                    borderRadius: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                }}>
                    {/* Spotlight effect */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 200,
                        height: 150,
                        background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    {/* Pet with equipped items visualization */}
                    <div style={{ position: 'relative', marginTop: 20 }}>
                        {/* Hat slot indicator */}
                        <AnimatePresence>
                            {equippedLoadout.hat && (
                                <motion.div
                                    initial={{ scale: 0, y: 10 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0 }}
                                    style={{
                                        position: 'absolute',
                                        top: -40,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '3rem',
                                    }}
                                >
                                    👑
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Glasses slot indicator */}
                        <AnimatePresence>
                            {equippedLoadout.glasses && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    style={{
                                        position: 'absolute',
                                        top: 20,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '2rem',
                                    }}
                                >
                                    🕶️
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pet - Large */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ fontSize: '8rem' }}
                        >
                            🐕
                        </motion.div>

                        {/* Collar/bandana slot indicator */}
                        <AnimatePresence>
                            {(equippedLoadout.collar || equippedLoadout.bandana) && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: 15,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '2rem',
                                    }}
                                >
                                    {equippedLoadout.collar ? '📿' : '🧣'}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Back slot indicator */}
                        <AnimatePresence>
                            {equippedLoadout.back && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: 40,
                                        right: -50,
                                        fontSize: '2.5rem',
                                    }}
                                >
                                    🦸
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Pet Name & Equipped Count */}
                <div style={{
                    marginTop: 24,
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>
                        {petName}
                    </div>
                    <div style={{
                        fontSize: '0.9rem',
                        color: equippedCount > 0 ? 'rgba(139, 92, 246, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                    }}>
                        <Shirt size={14} />
                        {equippedCount} {equippedCount === 1 ? 'item' : 'items'} equipped
                    </div>
                </div>
            </div>

            {/* Right: Accessory Grid (55% width) */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
            }}>
                <h3 style={{
                    margin: '0 0 20px 0',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontWeight: 600,
                }}>
                    <Shirt size={22} /> Your Wardrobe
                </h3>

                {accessories.length === 0 ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 20,
                        padding: 40,
                    }}>
                        <Shirt size={64} style={{ marginBottom: 20, opacity: 0.3 }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No accessories yet</p>
                        <p style={{ fontSize: '0.9rem', marginTop: 8 }}>
                            Visit the Gift Shop to buy accessories!
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: 16,
                        flex: 1,
                        overflowY: 'auto',
                        paddingRight: 8,
                        alignContent: 'start',
                    }}>
                        {accessories.map(item => {
                            const slot = getSlotFromItem(item);
                            const equipped = isEquipped(item.item_id);

                            return (
                                <motion.button
                                    key={item.item_id}
                                    onClick={() => onToggleEquip(item, slot)}
                                    whileHover={{ scale: 1.04, y: -4 }}
                                    whileTap={{ scale: 0.96 }}
                                    style={{
                                        padding: 20,
                                        borderRadius: 16,
                                        border: equipped
                                            ? '2px solid rgba(16, 185, 129, 0.6)'
                                            : '1px solid rgba(255, 255, 255, 0.12)',
                                        background: equipped
                                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                                            : 'rgba(35, 35, 45, 0.7)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        position: 'relative',
                                        color: '#fff',
                                        transition: 'all 0.2s ease',
                                        boxShadow: equipped
                                            ? '0 8px 24px rgba(16, 185, 129, 0.2)'
                                            : '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    }}
                                >
                                    {/* Equipped badge */}
                                    {equipped && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                background: '#10b981',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                                            }}
                                        >
                                            <Check size={14} />
                                        </motion.div>
                                    )}

                                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>
                                        {getAccessoryEmoji(item.item_name)}
                                    </div>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        marginBottom: 6,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {item.item_name}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        display: 'inline-block',
                                    }}>
                                        {SLOT_LABELS[slot] || slot}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default ClosetView;
