/**
 * ClosetView.tsx - Full-screen Stage + Dock layout
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shirt, Sparkles, RotateCcw, Check } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { EquippedAccessory } from '../../../game3d/core/BehaviourSystem';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';
import { RoomLayout, ROOM_THEMES } from './RoomLayout';

interface ClosetViewProps {
    petName: string;
    petType?: PetGame2PetType;
    petBreed?: string;
    accessories: InventoryEntry[];
    equippedLoadout: Record<string, string>;
    onToggleEquip: (item: InventoryEntry, slot: string) => void;
}

const getSlotFromItem = (item: InventoryEntry): 'collar' | 'hat' | 'bandana' | 'glasses' | 'back' => {
    const n = item.item_name.toLowerCase();
    if (n.includes('collar') || n.includes('bowtie')) return 'collar';
    if (n.includes('hat') || n.includes('crown')) return 'hat';
    if (n.includes('glasses') || n.includes('shades')) return 'glasses';
    if (n.includes('bandana')) return 'bandana';
    if (n.includes('cape') || n.includes('wings') || n.includes('coat')) return 'back';
    return 'collar';
};

const getAccessoryColor = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('gold') || n.includes('fancy')) return '#ffd700';
    if (n.includes('red')) return '#dc2626';
    if (n.includes('blue')) return '#2563eb';
    if (n.includes('pink')) return '#ec4899';
    if (n.includes('green')) return '#16a34a';
    if (n.includes('rainy')) return '#0ea5e9';
    return '#8b5cf6';
};

const getAccessoryEmoji = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('collar')) return '📿';
    if (n.includes('hat') || n.includes('crown')) return '👑';
    if (n.includes('glasses') || n.includes('shades')) return '🕶️';
    if (n.includes('bandana')) return '🧣';
    if (n.includes('bowtie')) return '🎀';
    if (n.includes('cape')) return '🦸';
    if (n.includes('coat')) return '🧥';
    return '✨';
};

const SLOT_LABELS: Record<string, string> = { collar: 'Neck', hat: 'Head', glasses: 'Eyes', bandana: 'Neck', back: 'Back' };

export function ClosetView({
    petName, petType = 'dog', petBreed = 'labrador', accessories, equippedLoadout, onToggleEquip,
}: ClosetViewProps) {
    const isEquipped = (id: string) => Object.values(equippedLoadout).includes(id);

    const equippedAccessories: EquippedAccessory[] = useMemo(() => {
        return Object.entries(equippedLoadout).map(([slot, itemId]) => {
            const item = accessories.find(a => a.item_id === itemId);
            return { id: itemId, slot: slot as EquippedAccessory['slot'], color: item ? getAccessoryColor(item.item_name) : '#8b5cf6' };
        }).filter(acc => acc.slot);
    }, [equippedLoadout, accessories]);

    const equippedCount = Object.keys(equippedLoadout).length;

    const stageContent = (
        <>
            {/* Spotlight effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* 3D Pet - Interactive */}
            <PetViewer3D
                petType={petType}
                breed={petBreed as any}
                accessories={equippedAccessories}
                interactive={true}
                size={300}
            />

            {/* Rotation hint */}
            <div className="flex items-center gap-2 mt-4 text-sm text-white/50 bg-black/30 px-4 py-2 rounded-lg">
                <RotateCcw size={14} /> Drag to rotate
            </div>

            {/* Pet info */}
            <h2 className="mt-3 text-2xl font-bold text-white drop-shadow-lg">{petName}</h2>
            <div className={`flex items-center gap-2 text-sm ${equippedCount > 0 ? 'text-purple-300' : 'text-white/50'}`}>
                <Shirt size={14} /> {equippedCount} items equipped
            </div>
        </>
    );

    const dockContent = (
        <>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 text-white/80">
                <Sparkles size={18} />
                <span className="font-semibold">Your Wardrobe</span>
                <span className="ml-auto text-sm text-white/50">Tap to equip</span>
            </div>

            {/* Items */}
            <div className="flex gap-3 overflow-x-auto flex-1 items-center pb-2">
                {accessories.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-white/40 gap-2">
                        <Shirt size={24} /> No accessories - visit the Gift Shop!
                    </div>
                ) : (
                    accessories.map(item => {
                        const slot = getSlotFromItem(item);
                        const equipped = isEquipped(item.item_id);

                        return (
                            <motion.button
                                key={item.item_id}
                                onClick={() => onToggleEquip(item, slot)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`min-w-[100px] h-[120px] p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shrink-0 relative
                                    ${equipped
                                        ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {equipped && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                                        <Check size={12} />
                                    </div>
                                )}
                                <span className="text-3xl">{getAccessoryEmoji(item.item_name)}</span>
                                <span className="text-sm font-semibold truncate max-w-full">{item.item_name}</span>
                                <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">{SLOT_LABELS[slot]}</span>
                            </motion.button>
                        );
                    })
                )}
            </div>
        </>
    );

    return <RoomLayout room="closet" stageContent={stageContent} dockContent={dockContent} />;
}

export default ClosetView;
