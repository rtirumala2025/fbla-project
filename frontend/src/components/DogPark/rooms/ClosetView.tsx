/**
 * ClosetView.tsx - Stage + Dock (transparent, gradient from parent)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shirt, Sparkles, RotateCcw, Check } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { EquippedAccessory } from '../../../game3d/core/BehaviourSystem';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';

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
    return 'collar';
};

const getAccessoryColor = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('gold')) return '#ffd700';
    if (n.includes('red')) return '#dc2626';
    if (n.includes('blue')) return '#2563eb';
    if (n.includes('pink')) return '#ec4899';
    return '#8b5cf6';
};

const getAccessoryEmoji = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('collar')) return '📿';
    if (n.includes('hat') || n.includes('crown')) return '👑';
    if (n.includes('glasses')) return '🕶️';
    if (n.includes('bandana')) return '🧣';
    if (n.includes('bowtie')) return '🎀';
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Stage */}
            <div className="flex-1 relative min-h-0">
                {/* 3D Canvas - fills entire stage */}
                <PetViewer3D
                    petType={petType}
                    breed={petBreed as any}
                    accessories={equippedAccessories}
                    interactive={true}
                    currentRoom="closet"
                />

                {/* Floating UI overlays */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-8">
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Spotlight */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center pointer-events-auto">
                        <div className="flex items-center gap-2 text-sm text-white/50 bg-black/30 px-4 py-2 rounded-lg">
                            <RotateCcw size={14} /> Drag to rotate
                        </div>

                        <h2 className="mt-3 text-2xl font-bold text-white drop-shadow-lg">{petName}</h2>
                        <div className={`flex items-center gap-2 text-sm ${equippedCount > 0 ? 'text-purple-300' : 'text-white/50'}`}>
                            <Shirt size={14} /> {equippedCount} items equipped
                        </div>
                    </div>
                </div>
            </div>


            {/* Dock */}
            <div className="h-[200px] shrink-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-white/80">
                    <Sparkles size={18} />
                    <span className="font-semibold">Your Wardrobe</span>
                    <span className="ml-auto text-sm text-white/50">Tap to equip</span>
                </div>

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
                                    className={`min-w-[100px] h-[110px] p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shrink-0 relative text-white
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
                                    <span className="text-2xl">{getAccessoryEmoji(item.item_name)}</span>
                                    <span className="text-xs font-semibold truncate max-w-full">{item.item_name}</span>
                                    <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">{SLOT_LABELS[slot]}</span>
                                </motion.button>
                            );
                        })
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default ClosetView;
