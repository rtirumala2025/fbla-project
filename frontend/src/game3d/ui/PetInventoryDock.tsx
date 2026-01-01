import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InventoryEntry {
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    shop_item_id?: string;
}

export const PetInventoryDock: React.FC<{
    isOpen: boolean;
    inventory: InventoryEntry[];
    loading: boolean;
    error: string | null;
    onUseItem: (item: InventoryEntry) => void;
    onRefresh: () => void;
}> = ({ isOpen, inventory, loading, error, onUseItem, onRefresh }) => {
    // Only show if open
    if (!isOpen) return null;

    return (
        <motion.div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 transform origin-bottom"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{ width: 'min(640px, calc(100% - 48px))' }}
        >
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2 text-white/90">
                        <span className="text-lg">🎒</span>
                        <span className="text-sm font-bold">Inventory</span>
                        {loading && <span className="text-xs text-white/50 animate-pulse">Loading...</span>}
                        {error && <span className="text-xs text-red-400">{error}</span>}
                    </div>
                    <button
                        onClick={onRefresh}
                        className="text-white/60 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        ↻
                    </button>
                </div>

                <div className="p-4 overflow-x-auto">
                    <div className="flex gap-3 pb-2">
                        {inventory.length === 0 && !loading ? (
                            <div className="w-full text-center py-4 text-white/40 text-sm">
                                No items found. Visit the shop!
                            </div>
                        ) : (
                            inventory.map((item) => {
                                const category = (item.category || 'other').toLowerCase();
                                const icon = category === 'food' ? '🍎' : category === 'toy' ? '🎾' : category === 'medicine' ? '💊' : category === 'energy' ? '⚡' : '⭐';

                                return (
                                    <motion.button
                                        key={item.item_id}
                                        onClick={() => onUseItem(item)}
                                        className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all min-w-[90px] group relative"
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
                                        <div className="text-center">
                                            <div className="text-xs font-medium text-white/90 truncate max-w-[80px]" title={item.item_name}>
                                                {item.item_name}
                                            </div>
                                            <div className="text-[10px] text-white/50 uppercase tracking-wide">
                                                {category}
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                            x{item.quantity}
                                        </div>
                                    </motion.button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
