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
    allInventoryCount?: number;
    onFeedItem: (item: InventoryEntry) => void;
    isFeeding?: boolean;
    hasFood?: boolean;
}

// Comprehensive Item Registry - includes ALL supermarket items
const ITEM_REGISTRY: Record<string, { name: string; icon: string; color: string }> = {
    // ============= FOOD ITEMS =============
    'premium': { name: 'Premium Kibble', icon: '🍖', color: '#D7CCC8' },
    'dog_food': { name: 'Premium Kibble', icon: '🍖', color: '#D7CCC8' },
    'food': { name: 'Pet Food', icon: '🍖', color: '#D7CCC8' },
    'treat': { name: 'Treat Bag', icon: '🍪', color: '#FFE0B2' },
    'treats': { name: 'Treat Bag', icon: '🍪', color: '#FFE0B2' },
    'bone': { name: 'Bone Pack', icon: '🦴', color: '#EFEBE9' },
    'bones': { name: 'Bone Pack', icon: '🦴', color: '#EFEBE9' },
    'gourmet': { name: 'Gourmet Meal', icon: '🥩', color: '#FFAB91' },
    'wet': { name: 'Wet Food Can', icon: '🥫', color: '#FFCCBC' },
    'puppy': { name: 'Puppy Formula', icon: '🍼', color: '#BBDEFB' },
    'salmon': { name: 'Salmon Bites', icon: '🐟', color: '#B2EBF2' },
    'fish': { name: 'Fresh Fish', icon: '🐟', color: '#B2EBF2' },
    'veggie': { name: 'Veggie Mix', icon: '🥕', color: '#FFCC80' },
    'carrot': { name: 'Crunchy Carrot', icon: '🥕', color: '#FFCC80' },
    'apple': { name: 'Fresh Apple', icon: '🍎', color: '#FFCDD2' },
    'sushi': { name: 'Sushi Roll', icon: '🍣', color: '#FFCC80' },
    'water': { name: 'Fresh Water', icon: '💧', color: '#B3E5FC' },
    'meat': { name: 'Prime Meat', icon: '🥩', color: '#FFCCBC' },
    'steak': { name: 'Juicy Steak', icon: '🥩', color: '#FFAB91' },
    'chicken': { name: 'Roasted Chicken', icon: '🍗', color: '#FFE082' },
    'cheese': { name: 'Cheese Block', icon: '🧀', color: '#FFF59D' },
    'pizza': { name: 'Pizza Slice', icon: '🍕', color: '#FFAB91' },
    'cookie': { name: 'Doggy Cookie', icon: '🍪', color: '#D7CCC8' },
    'bread': { name: 'Fresh Bread', icon: '🍞', color: '#FFE0B2' },
    'banana': { name: 'Ripe Banana', icon: '🍌', color: '#FFF59D' },

    // ============= TOYS =============
    'squeaky': { name: 'Squeaky Toy', icon: '🧸', color: '#C8E6C9' },
    'ball': { name: 'Ball Launcher', icon: '🎾', color: '#A5D6A7' },
    'frisbee': { name: 'Flying Disc', icon: '🥏', color: '#81C784' },
    'rope': { name: 'Tug Rope', icon: '🪢', color: '#AED581' },
    'puzzle': { name: 'Puzzle Feeder', icon: '🧩', color: '#CE93D8' },
    'plush': { name: 'Plush Friend', icon: '🐻', color: '#BCAAA4' },
    'kong': { name: 'Chew Kong', icon: '🔴', color: '#EF9A9A' },
    'laser': { name: 'Laser Pointer', icon: '🔦', color: '#FFF59D' },
    'toy': { name: 'Pet Toy', icon: '🧸', color: '#C8E6C9' },

    // ============= FURNITURE =============
    'bed': { name: 'Cozy Bed', icon: '🛏️', color: '#D1C4E9' },
    'fountain': { name: 'Water Fountain', icon: '💧', color: '#B3E5FC' },
    'house': { name: 'Dog House', icon: '🏠', color: '#FFCC80' },
    'scratching': { name: 'Scratching Post', icon: '🐱', color: '#FFAB91' },
    'tree': { name: 'Cat Tree Deluxe', icon: '🌳', color: '#A5D6A7' },
    'tunnel': { name: 'Play Tunnel', icon: '🕳️', color: '#B0BEC5' },
    'feeder': { name: 'Auto Feeder', icon: '🤖', color: '#90CAF9' },
    'window': { name: 'Window Perch', icon: '🪟', color: '#B3E5FC' },

    // ============= ACCESSORIES =============
    'collar': { name: 'Fancy Collar', icon: '📿', color: '#CE93D8' },
    'bandana': { name: 'Cool Bandana', icon: '🧣', color: '#EF9A9A' },
    'bowtie': { name: 'Dapper Bowtie', icon: '🎀', color: '#F48FB1' },
    'sunglasses': { name: 'Pet Sunglasses', icon: '🕶️', color: '#90A4AE' },
    'harness': { name: 'Adventure Harness', icon: '🎒', color: '#A1887F' },
    'raincoat': { name: 'Rainy Day Coat', icon: '🧥', color: '#90CAF9' },
    'boots': { name: 'Paw Booties', icon: '🥾', color: '#BCAAA4' },
    'crown': { name: 'Royal Crown', icon: '👑', color: '#FFD54F' },

    // ============= HEALTH & CARE =============
    'grooming': { name: 'Grooming Kit', icon: '✨', color: '#B39DDB' },
    'vitamins': { name: 'Pet Vitamins', icon: '💊', color: '#EF9A9A' },
    'energy': { name: 'Energy Boost', icon: '⚡', color: '#FFF59D' },
    'shampoo': { name: 'Premium Shampoo', icon: '🧴', color: '#80DEEA' },
    'flea': { name: 'Flea Treatment', icon: '🛡️', color: '#A5D6A7' },
    'dental': { name: 'Dental Chews', icon: '🦷', color: '#E0E0E0' },
    'joint': { name: 'Joint Supplement', icon: '💪', color: '#FFAB91' },
    'calm': { name: 'Calming Treats', icon: '🧘', color: '#CE93D8' },
    'brush': { name: 'Deluxe Brush', icon: '🪮', color: '#BCAAA4' },
    'nail': { name: 'Nail Clippers', icon: '✂️', color: '#B0BEC5' },
    'dryer': { name: 'Pet Dryer', icon: '💨', color: '#B3E5FC' },
    'perfume': { name: 'Pet Cologne', icon: '🌸', color: '#F8BBD9' },

    // ============= DEALS & BUNDLES =============
    'bundle': { name: 'Starter Bundle', icon: '🎁', color: '#FFAB91' },
    'flash': { name: 'Flash Sale', icon: '⚡', color: '#FFF59D' },
    'spa': { name: 'Spa Day Kit', icon: '🧖', color: '#B39DDB' },
    'deal': { name: 'Special Deal', icon: '🔥', color: '#EF9A9A' },
};

// Get item details with smart fallback
const getItemDetails = (item: { item_id: string; item_name: string }) => {
    // Try exact match on item_id first
    const idLower = item.item_id.toLowerCase();
    if (ITEM_REGISTRY[idLower]) {
        return ITEM_REGISTRY[idLower];
    }

    // Try to match by item_name keywords
    const nameLower = item.item_name.toLowerCase();
    for (const [key, value] of Object.entries(ITEM_REGISTRY)) {
        if (nameLower.includes(key)) {
            return value;
        }
    }

    // Default fallback
    return { name: item.item_name, icon: '🍖', color: '#D7CCC8' };
};

export function KitchenView({
    petName, petType = 'dog', petBreed = 'labrador', foodItems, allInventoryCount = 0, onFeedItem, isFeeding = false, hasFood = false,
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
            <div className="flex-1 relative min-h-0">
                {/* 3D Canvas - fills entire stage */}
                <PetViewer3D petType={petType} breed={petBreed as any} interactive={true} currentRoom="kitchen" hasFood={hasFood} isEating={hasFood} />

                {/* HUD: Hunger Bar - Top Right */}
                <div className="absolute top-4 right-4 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[120px]">
                        <div className="flex items-center gap-2 mb-1">
                            <Apple size={14} className="text-orange-400" />
                            <span className="text-xs font-medium text-white/80">Hunger</span>
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
                                initial={{ width: '40%' }}
                                animate={{ width: hasFood ? '100%' : '40%' }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Floating UI overlays */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-8">
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

                    <motion.div animate={feedingItem ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.4 }} className="pointer-events-auto" />

                    <div className="relative z-10 flex flex-col items-center pointer-events-auto">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">{petName}</h2>
                        <div className="flex gap-4 mt-3 px-4 py-2 bg-black/30 rounded-xl">
                            <span className="flex items-center gap-1 text-sm text-white"><Apple size={16} className="text-orange-400" /> +15 Hunger</span>
                            <span className="flex items-center gap-1 text-sm text-white"><Heart size={16} className="text-red-400" /> +5 Health</span>
                        </div>
                    </div>
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
                        foodItems.map(item => {
                            const details = getItemDetails(item);
                            return (
                                <DockItemCard
                                    key={item.item_id}
                                    emoji={details.icon}
                                    name={details.name}
                                    quantity={item.quantity}
                                    onClick={() => handleFeed(item)}
                                    disabled={isFeeding}
                                    accentColor={details.color}
                                />
                            );
                        })
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default KitchenView;
