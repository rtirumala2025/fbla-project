/**
 * BathroomView.tsx - Full-screen Stage + Dock layout
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

    const stageContent = (
        <>
            {/* Bubbles Animation */}
            <AnimatePresence>
                {showBubbles && [...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 50, x: (Math.random() - 0.5) * 200 }}
                        animate={{ opacity: [0, 1, 0], y: -150 }}
                        transition={{ duration: 2, delay: i * 0.1 }}
                        className="absolute text-3xl pointer-events-none"
                    >
                        🫧
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* 3D Pet */}
            <motion.div animate={isWashing ? { rotate: [0, -3, 3, 0] } : {}} transition={{ duration: 0.5, repeat: isWashing ? Infinity : 0 }}>
                <PetViewer3D petType={petType} breed={petBreed as any} size={260} interactive={false} />
            </motion.div>

            {/* Pet Name */}
            <h2 className="mt-4 text-2xl font-bold text-white drop-shadow-lg">{petName}'s Spa</h2>

            {/* Hygiene Bar */}
            <div className="w-48 mt-3">
                <div className="flex justify-between text-sm mb-1">
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
                    className={`mt-5 px-8 py-4 text-lg font-semibold rounded-2xl flex items-center gap-3
                        bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30
                        ${isWashing ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-cyan-500/50'}`}
                >
                    {isWashing ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🫧</motion.span> Washing...</> : <><Bath size={22} /> Bubble Bath</>}
                </motion.button>
            )}
        </>
    );

    const dockContent = (
        <>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 text-white/80">
                <Sparkles size={18} />
                <span className="font-semibold">Spa Supplies</span>
                <span className="ml-auto text-sm text-white/50">{hygieneItems.length} items</span>
            </div>

            {/* Items */}
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
                            accentColor={ROOM_THEMES.bathroom.accent}
                        />
                    ))
                )}
            </div>
        </>
    );

    return <RoomLayout room="bathroom" stageContent={stageContent} dockContent={dockContent} />;
}

export default BathroomView;
