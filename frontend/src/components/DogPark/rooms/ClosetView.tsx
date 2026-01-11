/**
 * ClosetView.tsx
 * 
 * Closet room for equipping accessories on the pet.
 * Features: Interactive 3D pet preview with OrbitControls, accessory grid.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shirt, Check, Sparkles, RotateCcw } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { EquippedAccessory } from '../../../game3d/core/BehaviourSystem';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import type { PetBreed } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';

interface ClosetViewProps {
    petName: string;
    petType?: PetGame2PetType;
    petBreed?: string;
    accessories: InventoryEntry[];
    equippedLoadout: Record<string, string>; // slot -> item_id
    onToggleEquip: (item: InventoryEntry, slot: string) => void;
}

const getSlotFromItem = (item: InventoryEntry): 'collar' | 'hat' | 'bandana' | 'glasses' | 'back' => {
    const name = item.item_name.toLowerCase();
    if (name.includes('collar') || name.includes('bowtie')) return 'collar';
    if (name.includes('hat') || name.includes('crown')) return 'hat';
    if (name.includes('glasses') || name.includes('shades')) return 'glasses';
    if (name.includes('bandana')) return 'bandana';
    if (name.includes('cape') || name.includes('wings') || name.includes('coat')) return 'back';
    return 'collar';
};

const getAccessoryColor = (itemName: string): string => {
    const name = itemName.toLowerCase();
    if (name.includes('gold') || name.includes('fancy')) return '#ffd700';
    if (name.includes('red') || name.includes('ruby')) return '#dc2626';
    if (name.includes('blue') || name.includes('sapphire')) return '#2563eb';
    if (name.includes('pink')) return '#ec4899';
    if (name.includes('green') || name.includes('emerald')) return '#16a34a';
    if (name.includes('purple')) return '#9333ea';
    if (name.includes('silver')) return '#94a3b8';
    if (name.includes('rainbow')) return '#f97316';
    if (name.includes('rainy') || name.includes('rain')) return '#0ea5e9';
    return '#8b5cf6'; // Default purple
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
    if (name.includes('coat')) return '🧥';
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
    petType = 'dog',
    petBreed = 'labrador',
    accessories,
    equippedLoadout,
    onToggleEquip,
}: ClosetViewProps) {
    const isEquipped = (itemId: string): boolean => {
        return Object.values(equippedLoadout).includes(itemId);
    };

    // Convert equipped loadout to EquippedAccessory format for 3D viewer
    const equippedAccessories: EquippedAccessory[] = useMemo(() => {
        return Object.entries(equippedLoadout).map(([slot, itemId]) => {
            const item = accessories.find(a => a.item_id === itemId);
            return {
                id: itemId,
                slot: slot as EquippedAccessory['slot'],
                color: item ? getAccessoryColor(item.item_name) : '#8b5cf6',
                name: item?.item_name,
            };
        }).filter(acc => acc.slot);
    }, [equippedLoadout, accessories]);

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
            {/* Left: 3D Pet Preview Panel (45% width) */}
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
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <Sparkles size={18} /> 3D Preview
                </div>

                {/* 3D Pet Viewer */}
                <PetViewer3D
                    petType={petType}
                    breed={petBreed as PetBreed}
                    accessories={equippedAccessories}
                    interactive={true}
                    size={280}
                />

                {/* Rotation hint */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 16,
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                }}>
                    <RotateCcw size={14} /> Drag to rotate
                </div>

                {/* Pet Name & Equipped Count */}
                <div style={{
                    marginTop: 16,
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
