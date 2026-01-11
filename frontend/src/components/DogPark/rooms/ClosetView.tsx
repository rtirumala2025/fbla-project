/**
 * ClosetView.tsx
 * 
 * Closet room for equipping accessories on the pet.
 * Split layout: Pet preview on left, accessory grid on right.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, Check, X } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';

interface ClosetViewProps {
    petName: string;
    accessories: InventoryEntry[];
    equippedLoadout: Record<string, string>; // slot -> item_id
    onToggleEquip: (item: InventoryEntry, slot: string) => void;
}

const getSlotFromItem = (item: InventoryEntry): string => {
    // Try to extract slot from item metadata or guess from name
    const name = item.item_name.toLowerCase();
    if (name.includes('collar') || name.includes('bowtie')) return 'collar';
    if (name.includes('hat') || name.includes('crown')) return 'hat';
    if (name.includes('glasses') || name.includes('shades')) return 'glasses';
    if (name.includes('bandana')) return 'bandana';
    if (name.includes('cape') || name.includes('wings')) return 'back';
    return 'collar'; // default
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
    // Group accessories by inferred slot
    const accessoriesBySlot = accessories.reduce((acc, item) => {
        const slot = getSlotFromItem(item);
        if (!acc[slot]) acc[slot] = [];
        acc[slot].push(item);
        return acc;
    }, {} as Record<string, InventoryEntry[]>);

    const isEquipped = (itemId: string): boolean => {
        return Object.values(equippedLoadout).includes(itemId);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ display: 'flex', gap: 20 }}
        >
            {/* Left: Pet Preview */}
            <div style={{
                flex: '0 0 160px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>
                <div style={{
                    width: 140,
                    height: 180,
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.1))',
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    position: 'relative',
                }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 8 }}>Preview</div>

                    {/* Pet with equipped items visualization */}
                    <div style={{ position: 'relative' }}>
                        {/* Hat slot indicator */}
                        {equippedLoadout.hat && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    position: 'absolute',
                                    top: -15,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '1.3rem',
                                }}
                            >
                                👑
                            </motion.div>
                        )}

                        {/* Glasses slot indicator */}
                        {equippedLoadout.glasses && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    position: 'absolute',
                                    top: 8,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '1rem',
                                }}
                            >
                                🕶️
                            </motion.div>
                        )}

                        {/* Pet */}
                        <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ fontSize: '3.5rem' }}
                        >
                            🐕
                        </motion.div>

                        {/* Collar/bandana slot indicator */}
                        {(equippedLoadout.collar || equippedLoadout.bandana) && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    position: 'absolute',
                                    bottom: 8,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '0.9rem',
                                }}
                            >
                                {equippedLoadout.collar ? '📿' : '🧣'}
                            </motion.div>
                        )}

                        {/* Back slot indicator */}
                        {equippedLoadout.back && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    position: 'absolute',
                                    bottom: 20,
                                    right: -20,
                                    fontSize: '1.2rem',
                                }}
                            >
                                🦸
                            </motion.div>
                        )}
                    </div>

                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 12 }}>
                        {petName}
                    </div>
                </div>

                {/* Equipped count */}
                <div style={{
                    marginTop: 10,
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    textAlign: 'center',
                }}>
                    {Object.keys(equippedLoadout).length} items equipped
                </div>
            </div>

            {/* Right: Accessory Grid */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}>
                    <Shirt size={16} /> Accessories
                </h4>

                {accessories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                        <Shirt size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <p style={{ fontSize: '0.9rem' }}>No accessories</p>
                        <p style={{ fontSize: '0.8rem' }}>Buy accessories from the shop!</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: 10,
                        maxHeight: 280,
                        overflowY: 'auto',
                        paddingRight: 4,
                    }}>
                        {accessories.map(item => {
                            const slot = getSlotFromItem(item);
                            const equipped = isEquipped(item.item_id);

                            return (
                                <motion.button
                                    key={item.item_id}
                                    onClick={() => onToggleEquip(item, slot)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{
                                        padding: 12,
                                        borderRadius: 10,
                                        border: equipped
                                            ? '2px solid #10b981'
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                        background: equipped
                                            ? 'rgba(16, 185, 129, 0.15)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        position: 'relative',
                                        color: '#fff',
                                    }}
                                >
                                    {/* Equipped badge */}
                                    {equipped && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            background: '#10b981',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Check size={12} />
                                        </div>
                                    )}

                                    <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>
                                        {getAccessoryEmoji(item.item_name)}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        marginBottom: 2,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {item.item_name}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
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
