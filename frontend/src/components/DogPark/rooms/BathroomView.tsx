/**
 * BathroomView.tsx - Stage + Dock (transparent, gradient from parent)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bath, Droplets, Sparkles } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';
import { DockItemCard } from './RoomLayout';

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

const getHygieneEmoji = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('shampoo')) return '🧴';
    if (n.includes('brush')) return '🪥';
    if (n.includes('soap')) return '🧼';
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
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Stage */}
            <div className="flex-1 relative min-h-0">
                {/* 3D Canvas - fills entire stage */}
                <PetViewer3D petType={petType} breed={petBreed as any} interactive={true} currentRoom="bathroom" />

                {/* Floating UI overlays */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-8">
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Bubbles */}
                    <AnimatePresence>
                        {showBubbles && [...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50, x: (Math.random() - 0.5) * 200 }}
                                animate={{ opacity: [0, 1, 0], y: -150 }}
                                transition={{ duration: 2, delay: i * 0.1 }}
                                className="absolute text-3xl"
                            >
                                🫧
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <div className="relative z-10 flex flex-col items-center pointer-events-auto">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">{petName}'s Spa</h2>

                        {/* Hygiene Bar */}
                        <div className="w-48 mt-3">
                            <div className="flex justify-between text-sm mb-1 text-white">
                                <span className="flex items-center gap-1"><Droplets size={14} className="text-cyan-400" /> Cleanliness</span>
                                <span className="font-bold">{currentHygiene}%</span>
                            </div>
                            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: `${currentHygiene}%` }}
                                    className={`h-full rounded-full ${currentHygiene > 60 ? 'bg-cyan-400' : currentHygiene > 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                                />
                            </div>
                        </div>

                        {/* Quick Wash */}
                        {onQuickWash && (
                            <motion.button
                                onClick={handleQuickWash}
                                disabled={isWashing}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`mt-5 px-8 py-4 text-lg font-semibold rounded-2xl flex items-center gap-3 text-white
                                    bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30
                                    ${isWashing ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-cyan-500/50'}`}
                            >
                                {isWashing ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🫧</motion.span> Washing...</> : <><Bath size={22} /> Bubble Bath</>}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>


            {/* Dock */}
            <div className="h-[200px] shrink-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-white/80">
                    <Sparkles size={18} />
                    <span className="font-semibold">Spa Supplies</span>
                    <span className="ml-auto text-sm text-white/50">{hygieneItems.length} items</span>
                </div>

                <div className="flex gap-3 overflow-x-auto flex-1 items-center pb-2">
                    {hygieneItems.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-white/40 gap-2">
                            <Bath size={24} /> No supplies - visit the shop!
                        </div>
                    ) : (
                        hygieneItems.map(item => (
                            <DockItemCard
                                key={item.item_id}
                                emoji={getHygieneEmoji(item.item_name)}
                                name={item.item_name}
                                quantity={item.quantity}
                                onClick={() => onUseItem(item)}
                                disabled={isWashing}
                            />
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default BathroomView;
