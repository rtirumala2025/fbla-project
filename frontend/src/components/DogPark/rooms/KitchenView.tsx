/**
 * KitchenView.tsx
 * 
 * Kitchen room with Stage (3D Pet + orange gradient) + Dock (food inventory)
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

const getFoodEmoji = (itemName: string): string => {
    const name = itemName.toLowerCase();
    if (name.includes('apple')) return '🍎';
    if (name.includes('bone')) return '🦴';
    if (name.includes('treat')) return '🦴';
    if (name.includes('fish')) return '🐟';
    if (name.includes('meat')) return '🥩';
    if (name.includes('milk')) return '🥛';
    if (name.includes('carrot')) return '🥕';
    if (name.includes('cookie')) return '🍪';
    return '🍖';
};

export function KitchenView({
    petName,
    petType = 'dog',
    petBreed = 'labrador',
    foodItems,
    onFeedItem,
    isFeeding = false,
}: KitchenViewProps) {
    const [feedingItem, setFeedingItem] = useState<string | null>(null);

    const handleFeed = (item: InventoryEntry) => {
        if (isFeeding) return;
        setFeedingItem(item.item_id);
        onFeedItem(item);
        setTimeout(() => setFeedingItem(null), 800);
    };

    const stageContent = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
        }}>
            {/* 3D Pet - Large */}
            <motion.div
                animate={feedingItem ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
            >
                <PetViewer3D
                    petType={petType}
                    breed={petBreed as any}
                    size={280}
                    interactive={false}
                />
            </motion.div>

            {/* Pet Name */}
            <h2 style={{
                marginTop: 16,
                fontSize: '1.5rem',
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
                {petName}
            </h2>

            {/* Stats Preview */}
            <div style={{
                display: 'flex',
                gap: 16,
                marginTop: 12,
                padding: '8px 20px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 12,
            }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                    <Apple size={16} color="#f97316" /> +15 Hunger
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                    <Heart size={16} color="#ef4444" /> +5 Health
                </span>
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
                <Utensils size={18} />
                <span style={{ fontWeight: 600 }}>Food Inventory</span>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.5)'
                }}>
                    {foodItems.length} items
                </span>
            </div>

            {/* Horizontal Scroll Grid */}
            {foodItems.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)',
                    gap: 10,
                }}>
                    <Apple size={24} />
                    <span>Kitchen is empty - visit the Supermarket!</span>
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
                    {foodItems.map(item => (
                        <DockItemCard
                            key={item.item_id}
                            emoji={getFoodEmoji(item.item_name)}
                            name={item.item_name}
                            quantity={item.quantity}
                            onClick={() => handleFeed(item)}
                            disabled={isFeeding}
                            accentColor={ROOM_THEMES.kitchen.accent}
                        />
                    ))}
                </div>
            )}
        </>
    );

    return (
        <RoomLayout
            room="kitchen"
            stageContent={stageContent}
            dockContent={dockContent}
        />
    );
}

export default KitchenView;
