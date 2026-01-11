/**
 * KitchenView.tsx - Full-screen Stage + Dock layout
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Apple, Heart, Utensils } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';
import { RoomLayout, DockItemCard, ROOM_THEMES } from './RoomLayout';

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
    if (n.includes('milk')) return '🥛';
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

    const stageContent = (
        <>
            {/* 3D Pet */}
            <motion.div animate={feedingItem ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.4 }}>
                <PetViewer3D petType={petType} breed={petBreed as any} size={260} interactive={false} />
            </motion.div>

            {/* Pet Name */}
            <h2 className="mt-4 text-2xl font-bold text-white drop-shadow-lg">{petName}</h2>

            {/* Stats Preview */}
            <div className="flex gap-4 mt-3 px-4 py-2 bg-black/30 rounded-xl">
                <span className="flex items-center gap-1 text-sm"><Apple size={16} className="text-orange-400" /> +15 Hunger</span>
                <span className="flex items-center gap-1 text-sm"><Heart size={16} className="text-red-400" /> +5 Health</span>
            </div>
        </>
    );

    const dockContent = (
        <>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 text-white/80">
                <Utensils size={18} />
                <span className="font-semibold">Food Inventory</span>
                <span className="ml-auto text-sm text-white/50">{foodItems.length} items</span>
            </div>

            {/* Items */}
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
                            accentColor={ROOM_THEMES.kitchen.accent}
                        />
                    ))
                )}
            </div>
        </>
    );

    return <RoomLayout room="kitchen" stageContent={stageContent} dockContent={dockContent} />;
}

export default KitchenView;
