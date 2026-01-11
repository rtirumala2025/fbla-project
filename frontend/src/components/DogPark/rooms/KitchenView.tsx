/**
 * KitchenView.tsx - Stage + Dock (transparent, gradient from parent)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Apple, Heart, Utensils } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';
import { DockItemCard } from './RoomLayout';

interface KitchenViewProps {
    petName: string;
    petType?: PetGame2PetType;
    petBreed?: string;
    foodItems: InventoryEntry[];
    onFeedItem: (item: InventoryEntry) => void;
    isFeeding?: boolean;
}

const getFoodEmoji = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('apple')) return '🍎';
    if (n.includes('bone') || n.includes('treat')) return '🦴';
    if (n.includes('fish')) return '🐟';
    if (n.includes('meat')) return '🥩';
    return '🍖';
};

export function KitchenView({
    petName, petType = 'dog', petBreed = 'labrador', foodItems, onFeedItem, isFeeding = false,
}: KitchenViewProps) {
    const [feedingItem, setFeedingItem] = useState<string | null>(null);

    const handleFeed = (item: InventoryEntry) => {
        if (isFeeding) return;
        setFeedingItem(item.item_id);
        onFeedItem(item);
        setTimeout(() => setFeedingItem(null), 800);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Stage */}
            <div className="flex-1 relative flex flex-col items-center justify-center min-h-0">
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                <motion.div animate={feedingItem ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.4 }}>
                    <PetViewer3D petType={petType} breed={petBreed as any} size={260} interactive={false} />
                </motion.div>

                <h2 className="mt-4 text-2xl font-bold text-white drop-shadow-lg relative z-10">{petName}</h2>

                <div className="flex gap-4 mt-3 px-4 py-2 bg-black/30 rounded-xl relative z-10">
                    <span className="flex items-center gap-1 text-sm text-white"><Apple size={16} className="text-orange-400" /> +15 Hunger</span>
                    <span className="flex items-center gap-1 text-sm text-white"><Heart size={16} className="text-red-400" /> +5 Health</span>
                </div>
            </div>

            {/* Dock */}
            <div className="h-[200px] shrink-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-white/80">
                    <Utensils size={18} />
                    <span className="font-semibold">Food Inventory</span>
                    <span className="ml-auto text-sm text-white/50">{foodItems.length} items</span>
                </div>

                <div className="flex gap-3 overflow-x-auto flex-1 items-center pb-2">
                    {foodItems.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-white/40 gap-2">
                            <Apple size={24} /> Kitchen is empty - visit the Supermarket!
                        </div>
                    ) : (
                        foodItems.map(item => (
                            <DockItemCard
                                key={item.item_id}
                                emoji={getFoodEmoji(item.item_name)}
                                name={item.item_name}
                                quantity={item.quantity}
                                onClick={() => handleFeed(item)}
                                disabled={isFeeding}
                            />
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default KitchenView;
