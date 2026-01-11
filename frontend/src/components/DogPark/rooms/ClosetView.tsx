/**
 * ClosetView.tsx
 * 
 * Closet with Stage (3D Pet + spotlight gradient + OrbitControls) + Dock (accessories)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shirt, Sparkles, RotateCcw, Check } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { EquippedAccessory } from '../../../game3d/core/BehaviourSystem';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';
import { RoomLayout, DockItemCard, ROOM_THEMES } from './RoomLayout';

interface ClosetViewProps {
    petName: string;
    petType?: PetGame2PetType;
    petBreed?: string;
    accessories: InventoryEntry[];
    equippedLoadout: Record<string, string>;
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
    if (name.includes('red')) return '#dc2626';
    if (name.includes('blue')) return '#2563eb';
    if (name.includes('pink')) return '#ec4899';
    if (name.includes('green')) return '#16a34a';
    if (name.includes('purple')) return '#9333ea';
    if (name.includes('silver')) return '#94a3b8';
    if (name.includes('rainy') || name.includes('rain')) return '#0ea5e9';
    return '#8b5cf6';
};

const getAccessoryEmoji = (itemName: string): string => {
    const name = itemName.toLowerCase();
    if (name.includes('collar')) return '📿';
    if (name.includes('hat') || name.includes('crown')) return '👑';
    if (name.includes('glasses') || name.includes('shades')) return '🕶️';
    if (name.includes('bandana')) return '🧣';
    if (name.includes('bowtie')) return '🎀';
    if (name.includes('cape')) return '🦸';
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
    const isEquipped = (itemId: string): boolean => Object.values(equippedLoadout).includes(itemId);

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

    const stageContent = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
        }}>
            {/* Spotlight effect */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                height: 400,
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* 3D Pet - LARGE with interactive controls */}
            <PetViewer3D
                petType={petType}
                breed={petBreed as any}
                accessories={equippedAccessories}
                interactive={true}
                size={320}
            />

            {/* Rotation hint */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 16,
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                background: 'rgba(0,0,0,0.3)',
                padding: '6px 14px',
                borderRadius: 8,
            }}>
                <RotateCcw size={14} /> Drag to rotate
            </div>

            {/* Pet Name + Stats */}
            <h2 style={{
                marginTop: 12,
                fontSize: '1.4rem',
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
                {petName}
            </h2>
            <div style={{
                fontSize: '0.9rem',
                color: equippedCount > 0 ? ROOM_THEMES.closet.accent : 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
            }}>
                <Shirt size={14} />
                {equippedCount} {equippedCount === 1 ? 'item' : 'items'} equipped
            </div>
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
                <span style={{ fontWeight: 600 }}>Your Wardrobe</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    Tap to equip
                </span>
            </div>

            {/* Accessories Grid */}
            {accessories.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)',
                    gap: 10,
                }}>
                    <Shirt size={24} />
                    <span>No accessories - visit the Gift Shop!</span>
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
                    {accessories.map(item => {
                        const slot = getSlotFromItem(item);
                        const equipped = isEquipped(item.item_id);

                        return (
                            <motion.button
                                key={item.item_id}
                                onClick={() => onToggleEquip(item, slot)}
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    minWidth: 110,
                                    height: 120,
                                    padding: 12,
                                    borderRadius: 16,
                                    border: equipped
                                        ? '2px solid #10b981'
                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                    background: equipped
                                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.1) 100%)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    color: '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    flexShrink: 0,
                                    position: 'relative',
                                    boxShadow: equipped
                                        ? '0 4px 20px rgba(16, 185, 129, 0.3)'
                                        : '0 4px 12px rgba(0,0,0,0.3)',
                                }}
                            >
                                {equipped && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 6,
                                        right: 6,
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        background: '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Check size={12} />
                                    </div>
                                )}
                                <span style={{ fontSize: '2rem' }}>{getAccessoryEmoji(item.item_name)}</span>
                                <span style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '100%',
                                }}>
                                    {item.item_name}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                }}>
                                    {SLOT_LABELS[slot] || slot}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </>
    );

    return (
        <RoomLayout
            room="closet"
            stageContent={stageContent}
            dockContent={dockContent}
        />
    );
}

export default ClosetView;
