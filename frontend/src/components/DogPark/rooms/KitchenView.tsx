/**
 * KitchenView.tsx
 * 
 * Kitchen room for feeding the pet. Centered immersive layout with large item cards.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, Apple, Heart, Zap } from 'lucide-react';
import type { InventoryEntry } from '../../../types/finance';

interface KitchenViewProps {
    petName: string;
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
                {/* Kitchen Header with Pet */}
                <div style={{
                    textAlign: 'center',
                    padding: '30px 50px',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.08) 100%)',
                    borderRadius: 24,
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    marginBottom: 20,
                }}>
                    {/* Feeding Animation Zone */}
                    <div style={{ position: 'relative', marginBottom: 16 }}>
                        <motion.div
                            animate={isFeeding ? {
                                scale: [1, 1.15, 1],
                                rotate: [0, -5, 5, 0],
                            } : {
                                y: [0, -5, 0],
                            }}
                            transition={isFeeding ? {
                                duration: 0.5,
                                repeat: 2,
                            } : {
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            style={{ fontSize: '6rem' }}
                        >
                            🐕
                        </motion.div>

                        {/* Food flying animation */}
                        <AnimatePresence>
                            {selectedItem && (
                                <motion.div
                                    initial={{ x: -100, y: 50, opacity: 0, scale: 0.5 }}
                                    animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        position: 'absolute',
                                        top: 20,
                                        right: -30,
                                        fontSize: '2.5rem',
                                    }}
                                >
                                    {getFoodEmoji(selectedItem.item_name)}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <h2 style={{
                        margin: 0,
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        marginBottom: 8,
                    }}>
                        {petName}'s Kitchen
                    </h2>
                    <p style={{
                        margin: 0,
                        fontSize: '0.95rem',
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

            {/* Food Grid - Large Cards */}
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
                    <Apple size={80} style={{ marginBottom: 24, opacity: 0.3 }} />
                    <p style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: 8 }}>
                        Kitchen is empty
                    </p>
                    <p style={{ fontSize: '0.95rem' }}>
                        Buy food from the Supermarket to feed your pet!
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 20,
                    width: '100%',
                    maxWidth: 800,
                    padding: '0 20px',
                }}>
                    {foodItems.map(item => (
                        <motion.button
                            key={item.item_id}
                            onClick={() => !isFeeding && handleFeed(item)}
                            whileHover={{ scale: 1.05, y: -6 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isFeeding}
                            style={{
                                cursor: isFeeding ? 'not-allowed' : 'pointer',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                textAlign: 'center',
                                padding: 24,
                                opacity: isFeeding ? 0.6 : 1,
                                background: 'rgba(35, 35, 45, 0.7)',
                                borderRadius: 20,
                                color: '#fff',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            <motion.div
                                style={{ fontSize: '3rem', marginBottom: 12 }}
                                animate={isFeeding && selectedItem?.item_id === item.item_id ? {
                                    rotate: [0, -15, 15, 0],
                                    scale: [1, 1.2, 1],
                                } : {}}
                                transition={{ duration: 0.3 }}
                            >
                                {getFoodEmoji(item.item_name)}
                            </motion.div>
                            <div style={{
                                fontWeight: 600,
                                fontSize: '1rem',
                                marginBottom: 8,
                            }}>
                                {item.item_name}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.15)',
                                padding: '6px 14px',
                                borderRadius: 10,
                                display: 'inline-block',
                                fontWeight: 500,
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
                paddingTop: 30,
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
            }}>
                💡 Tip: Regular feeding keeps your pet happy and healthy!
            </div>
        </motion.div>
    );
}

export default KitchenView;
