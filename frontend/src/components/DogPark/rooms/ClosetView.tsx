/**
 * ClosetView.tsx - Premium Dressing Room Experience
 * 
 * Completely redesigned walk-in closet with mirrors, spotlights, and clothing racks.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shirt, Sparkles, RotateCcw, Check, Star } from 'lucide-react';
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
            {/* === DRESSING ROOM STAGE === */}
            <div className="flex-1 relative min-h-0 bg-gradient-to-b from-rose-950 via-fuchsia-950 to-purple-950">

                {/* Runway Floor - Polished Wood */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-amber-900/80 via-amber-800/40 to-transparent">
                    {/* Floor shine lines */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-200/50 to-transparent" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-200/50 to-transparent" />
                        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-200/50 to-transparent" />
                    </div>
                </div>

                {/* Large Wall Mirror (Left) */}
                <div className="absolute left-4 top-1/4 bottom-1/4 w-20 md:w-28">
                    <div className="h-full bg-gradient-to-br from-slate-200/10 via-white/20 to-slate-300/10 rounded-lg border-4 border-amber-700/60 shadow-2xl">
                        {/* Mirror shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded" />
                        <div className="absolute top-2 left-2 w-8 h-8 bg-white/20 rounded-full blur-xl" />
                    </div>
                    {/* Mirror frame decoration */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">💎</div>
                </div>

                {/* Large Wall Mirror (Right) */}
                <div className="absolute right-4 top-1/4 bottom-1/4 w-20 md:w-28">
                    <div className="h-full bg-gradient-to-bl from-slate-200/10 via-white/20 to-slate-300/10 rounded-lg border-4 border-amber-700/60 shadow-2xl">
                        {/* Mirror shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-bl from-white/30 via-transparent to-transparent rounded" />
                        <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full blur-xl" />
                    </div>
                    {/* Mirror frame decoration */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">💎</div>
                </div>

                {/* Clothing Rack (Top Left) */}
                <div className="absolute top-8 left-8 hidden md:flex flex-col items-center">
                    {/* Rack bar */}
                    <div className="w-32 h-2 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full shadow-lg" />
                    <div className="flex gap-2 mt-1">
                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} className="text-2xl">👗</motion.span>
                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} className="text-2xl">👔</motion.span>
                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} className="text-2xl">🧥</motion.span>
                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.9 }} className="text-2xl">👚</motion.span>
                    </div>
                </div>

                {/* Clothing Rack (Top Right) */}
                <div className="absolute top-8 right-8 hidden md:flex flex-col items-center">
                    {/* Rack bar */}
                    <div className="w-32 h-2 bg-gradient-to-r from-slate-600 to-slate-400 rounded-full shadow-lg" />
                    <div className="flex gap-2 mt-1">
                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} className="text-2xl">👒</motion.span>
                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="text-2xl">🎀</motion.span>
                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.8 }} className="text-2xl">👜</motion.span>
                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1.1 }} className="text-2xl">🧣</motion.span>
                    </div>
                </div>

                {/* Spotlight Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-96 bg-gradient-to-b from-fuchsia-400/20 via-pink-300/10 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute top-0 left-1/4 w-32 h-64 bg-gradient-to-b from-purple-400/15 via-transparent to-transparent blur-2xl pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-32 h-64 bg-gradient-to-b from-purple-400/15 via-transparent to-transparent blur-2xl pointer-events-none" />

                {/* Runway Glow (Center Spotlight) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-t from-fuchsia-500/30 via-pink-400/10 to-transparent blur-xl pointer-events-none" />

                {/* 3D Canvas - Pet on the Runway */}
                <PetViewer3D
                    petType={petType}
                    breed={petBreed as any}
                    accessories={equippedAccessories}
                    interactive={true}
                    currentRoom="closet"
                />

                {/* Floating Stars */}
                <motion.div
                    className="absolute top-12 left-16 text-2xl"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    ✨
                </motion.div>
                <motion.div
                    className="absolute top-20 right-20 text-xl"
                    animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                >
                    ⭐
                </motion.div>
                <motion.div
                    className="absolute bottom-32 left-20 text-lg"
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                    💫
                </motion.div>

                {/* Floating UI Overlays */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-8">
                    {/* Bottom gradient overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="relative z-10 flex flex-col items-center pointer-events-auto">
                        <div className="flex items-center gap-2 text-sm text-white/50 bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
                            <RotateCcw size={14} />
                            Drag to spin
                        </div>

                        <h2 className="mt-3 text-2xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                            <Star size={20} className="text-yellow-400" fill="currentColor" />
                            {petName}
                            <Star size={20} className="text-yellow-400" fill="currentColor" />
                        </h2>
                        <div className={`flex items-center gap-2 text-sm ${equippedCount > 0 ? 'text-fuchsia-300' : 'text-white/50'}`}>
                            <Shirt size={14} />
                            {equippedCount} {equippedCount === 1 ? 'item' : 'items'} equipped
                        </div>
                    </div>
                </div>
            </div>

            {/* === WARDROBE DOCK === */}
            <div className="h-[200px] shrink-0 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border-t-2 border-fuchsia-500/30 px-6 py-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-white/90">
                    <Sparkles size={18} className="text-fuchsia-400" />
                    <span className="font-semibold">Your Collection</span>
                    <span className="ml-auto text-sm text-white/50">Tap to equip</span>
                </div>

                <div className="flex gap-3 overflow-x-auto flex-1 items-center pb-2 [&::-webkit-scrollbar]:hidden">
                    {accessories.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-white/40 gap-2">
                            <Shirt size={24} />
                            No accessories yet - visit the Gift Shop!
                        </div>
                    ) : (
                        accessories.map(item => {
                            const slot = getSlotFromItem(item);
                            const equipped = isEquipped(item.item_id);

                            return (
                                <motion.button
                                    key={item.item_id}
                                    onClick={() => onToggleEquip(item, slot)}
                                    whileHover={{ scale: 1.05, y: -4 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`min-w-[100px] h-[110px] p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shrink-0 relative text-white transition-all
                                        ${equipped
                                            ? 'bg-gradient-to-br from-fuchsia-500/30 to-purple-600/30 border-2 border-fuchsia-400 shadow-lg shadow-fuchsia-500/30'
                                            : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {equipped && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-fuchsia-400 flex items-center justify-center">
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
