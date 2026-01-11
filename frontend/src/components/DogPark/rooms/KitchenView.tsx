/**
 * KitchenView.tsx
 * 
 * Kitchen room for feeding the pet. Features static 3D pet display.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Heart } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';
import type { PetGame2PetType } from '../../../game3d/core/SceneManager';
import { PetViewer3D } from './PetViewer3D';

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
    if (name.includes('snack')) return '🍖';
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
    const [selectedItem, setSelectedItem] = useState<InventoryEntry | null>(null);

    const handleFeed = (item: InventoryEntry) => {
        setSelectedItem(item);
        onFeedItem(item);
        setTimeout(() => setSelectedItem(null), 1000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 'calc(100vh - 180px)',
                padding: '30px 20px',
            }}
        >
            {/* Central Interactive Zone */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 40,
            }}>
                {/* Kitchen Header with 3D Pet */}
                <div style={{
                    textAlign: 'center',
                    padding: '24px 40px',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.08) 100%)',
                    borderRadius: 24,
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    marginBottom: 20,
                }}>
                    {/* 3D Pet Display */}
                    <div style={{ marginBottom: 16 }}>
                        <PetViewer3D
                            petType={petType}
                            breed={petBreed as any}
                            size={160}
                            interactive={false}
                        />
                    </div>

                    <h2 style={{
                        margin: 0,
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        marginBottom: 6,
                    }}>
                        {petName}'s Kitchen
                    </h2>
                    <p style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                    }}>
                        Select food to feed your pet
                    </p>
                </div>

                {/* Stats Boost Preview */}
                <div style={{
                    display: 'flex',
                    gap: 20,
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                        <Apple size={16} color="#f97316" /> Hunger +15
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                        <Heart size={16} color="#ef4444" /> Health +5
                    </div>
                </div>
            </div>

            {/* Food Grid */}
            {foodItems.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.5)',
                    maxWidth: 400,
                    textAlign: 'center',
                }}>
                    <Apple size={64} style={{ marginBottom: 20, opacity: 0.3 }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Kitchen is empty</p>
                    <p style={{ fontSize: '0.9rem', marginTop: 8 }}>
                        Buy food from the Supermarket!
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 16,
                    width: '100%',
                    maxWidth: 700,
                }}>
                    {foodItems.map(item => (
                        <motion.button
                            key={item.item_id}
                            onClick={() => !isFeeding && handleFeed(item)}
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isFeeding}
                            style={{
                                cursor: isFeeding ? 'not-allowed' : 'pointer',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                textAlign: 'center',
                                padding: 20,
                                opacity: isFeeding ? 0.6 : 1,
                                background: 'rgba(35, 35, 45, 0.7)',
                                borderRadius: 16,
                                color: '#fff',
                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>
                                {getFoodEmoji(item.item_name)}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>
                                {item.item_name}
                            </div>
                            <div style={{
                                fontSize: '0.8rem',
                                color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.15)',
                                padding: '4px 10px',
                                borderRadius: 8,
                                display: 'inline-block',
                            }}>
                                x{item.quantity}
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Bottom Tip */}
            <div style={{
                marginTop: 'auto',
                paddingTop: 24,
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.4)',
            }}>
                💡 Regular feeding keeps your pet happy!
            </div>
        </motion.div>
    );
}

export default KitchenView;
