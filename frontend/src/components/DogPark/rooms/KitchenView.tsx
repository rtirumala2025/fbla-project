/**
 * KitchenView.tsx
 * 
 * Kitchen room for feeding the pet. Shows food items from inventory.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Apple } from 'lucide-react';
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
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            {/* Kitchen Header */}
            <div style={{
                textAlign: 'center',
                marginBottom: 20,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.1))',
                borderRadius: 12,
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🍽️</div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    {petName}'s Kitchen
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Feed your pet to boost Hunger & Health
                </p>
            </div>

            {/* Food Grid */}
            {foodItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                    <Apple size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <p style={{ fontWeight: 500 }}>No food in kitchen</p>
                    <p style={{ fontSize: '0.85rem' }}>Buy food from the Supermarket!</p>
                </div>
            ) : (
                <div className="building-grid" style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: 12,
                }}>
                    {foodItems.map(item => (
                        <motion.button
                            key={item.item_id}
                            className="building-grid-item"
                            onClick={() => !isFeeding && onFeedItem(item)}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={isFeeding}
                            style={{
                                cursor: isFeeding ? 'not-allowed' : 'pointer',
                                border: 'none',
                                textAlign: 'center',
                                padding: 16,
                                opacity: isFeeding ? 0.6 : 1,
                                position: 'relative',
                            }}
                        >
                            <motion.div
                                style={{ fontSize: '2rem', marginBottom: 8 }}
                                animate={isFeeding ? { rotate: [0, -10, 10, 0] } : {}}
                                transition={{ duration: 0.3, repeat: isFeeding ? Infinity : 0 }}
                            >
                                {getFoodEmoji(item.item_name)}
                            </motion.div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>
                                {item.item_name}
                            </div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '2px 8px',
                                borderRadius: 4,
                                display: 'inline-block',
                            }}>
                                x{item.quantity}
                            </div>

                            {/* Hover overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(249, 115, 22, 0.2)',
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                }}
                            >
                                🍴 Feed
                            </motion.div>
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Tip */}
            <div style={{
                marginTop: 20,
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                fontSize: '0.8rem',
                color: '#94a3b8',
                textAlign: 'center',
            }}>
                💡 Tip: Regular feeding keeps your pet happy and healthy!
            </div>
        </motion.div>
    );
}

export default KitchenView;
