/**
 * SupermarketWindow.tsx
 * 
 * Floating window for the Supermarket building.
 * Features: Food, Toys, Furniture, and other consumable pet supplies
 * (Separate from Gift Shop which is accessories-only)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart, ShoppingBag, Plus, Minus, Trash2, CreditCard,
    Loader2, Check, X, Gift, Search, Sparkles,
    Bone, Heart, Scissors, Home, Package, Zap
} from 'lucide-react';
import { BuildingInteractionWindow } from './BuildingInteractionWindow';
import { getShopCatalog, purchaseItems, getFinanceSummary } from '../../api/finance';
import type { ShopItemEntry } from '../../types/finance';
import './building-windows.css';

// Extended local type for display purposes
interface DisplayShopItem extends ShopItemEntry {
    icon?: string;
    originalPrice?: number;
    isDeal?: boolean;
}

interface CartItem {
    item: DisplayShopItem;
    quantity: number;
}

interface SupermarketWindowProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchaseComplete?: () => void;
}

// Category configuration - CONSUMABLES (not accessories)
const CATEGORIES = [
    { id: 'all', name: 'All Items', icon: Package, color: '#8b5cf6' },
    { id: 'deals', name: 'Hot Deals', icon: Zap, color: '#ef4444' },
    { id: 'food', name: 'Food & Treats', icon: Bone, color: '#f59e0b' },
    { id: 'toy', name: 'Toys', icon: Gift, color: '#10b981' },
    { id: 'furniture', name: 'Furniture', icon: Home, color: '#3b82f6' },
    { id: 'health', name: 'Health', icon: Heart, color: '#ef4444' },
    { id: 'grooming', name: 'Grooming', icon: Scissors, color: '#06b6d4' },
    { id: 'care', name: 'Care', icon: Sparkles, color: '#a855f7' },
    { id: 'energy', name: 'Energy', icon: Zap, color: '#eab308' },
];

// Non-equippable categories only
const CONSUMABLE_CATEGORIES = ['food', 'toy', 'furniture', 'health', 'grooming', 'care', 'deals', 'energy'];

// Map a category to an icon for display
const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
        food: '🍖',
        toys: '🧸',
        toy: '🧸',
        furniture: '🛏️',
        care: '✨',
        health: '💊',
        grooming: '✂️',
        deals: '🔥',
        energy: '⚡',
    };
    return icons[category?.toLowerCase()] || '📦';
};

export function SupermarketWindow({ isOpen, onClose, onPurchaseComplete }: SupermarketWindowProps) {
    const [items, setItems] = useState<DisplayShopItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [balance, setBalance] = useState(0);
    const [showCheckout, setShowCheckout] = useState(false);
    const [purchaseResult, setPurchaseResult] = useState<'success' | 'error' | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Load shop data when window opens
    useEffect(() => {
        if (isOpen) {
            loadShopData();
        }
    }, [isOpen]);

    const loadShopData = async () => {
        setLoading(true);
        try {
            const [catalogData, financeData] = await Promise.all([
                getShopCatalog(),
                getFinanceSummary()
            ]);
            // Filter to consumables only (NOT accessories)
            const consumableItems = catalogData.filter(item =>
                CONSUMABLE_CATEGORIES.includes(item.category.toLowerCase()) &&
                !(item.metadata as any)?.equippable
            );

            const itemsWithIcons: DisplayShopItem[] = consumableItems.map(item => {
                const metadata = typeof item.metadata === 'object' ? item.metadata : {};
                return {
                    ...item,
                    icon: (item as any).emoji || getCategoryIcon(item.category),
                    originalPrice: (metadata as any)?.originalPrice,
                    isDeal: (metadata as any)?.isDeal || item.category === 'deals',
                };
            });
            setItems(itemsWithIcons);
            setBalance(financeData.summary?.balance ?? 0);
        } catch (error) {
            console.error('Failed to load supermarket data:', error);
            setBalance(500);
        } finally {
            setLoading(false);
        }
    };

    // Filtered items based on category and search
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const categoryMatch = selectedCategory === 'all' ||
                item.category.toLowerCase() === selectedCategory ||
                (selectedCategory === 'deals' && item.isDeal);

            const searchMatch = searchQuery === '' ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());

            return categoryMatch && searchMatch;
        });
    }, [items, selectedCategory, searchQuery]);

    // Cart calculations
    const cartTotal = useMemo(() => cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0), [cart]);
    const canAfford = balance >= cartTotal;

    // Cart operations
    const addToCart = useCallback((item: DisplayShopItem) => {
        setCart(prev => {
            const existing = prev.find(c => c.item.id === item.id);
            if (existing) {
                return prev.map(c =>
                    c.item.id === item.id
                        ? { ...c, quantity: c.quantity + 1 }
                        : c
                );
            }
            return [...prev, { item, quantity: 1 }];
        });
    }, []);

    const removeFromCart = useCallback((itemId: string) => {
        setCart(prev => prev.filter(c => c.item.id !== itemId));
    }, []);

    const updateQuantity = useCallback((itemId: string, delta: number) => {
        setCart(prev => prev.map(c => {
            if (c.item.id !== itemId) return c;
            const newQty = Math.max(1, c.quantity + delta);
            return { ...c, quantity: newQty };
        }));
    }, []);

    // Checkout
    const handleCheckout = async () => {
        if (!canAfford || cart.length === 0) return;

        setPurchasing(true);
        setPurchaseResult(null);
        setErrorMessage('');

        try {
            const purchaseData = {
                items: cart.map(c => ({
                    item_id: c.item.id,
                    quantity: c.quantity
                })),
            };

            await purchaseItems(purchaseData);

            setPurchaseResult('success');
            setBalance(prev => prev - cartTotal);
            setCart([]);
            setShowCheckout(false);

            setTimeout(() => {
                setPurchaseResult(null);
                onPurchaseComplete?.();
            }, 2000);
        } catch (error: any) {
            setPurchaseResult('error');
            setErrorMessage(error.message || 'Purchase failed. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    // Close handler
    const handleClose = () => {
        setShowCheckout(false);
        setPurchaseResult(null);
        setSearchQuery('');
        setSelectedCategory('all');
        onClose();
    };

    return (
        <BuildingInteractionWindow
            isOpen={isOpen}
            onClose={handleClose}
            title="Supermarket"
            icon={<ShoppingCart />}
            width={900}
            minHeight={550}
        >
            <div className="flex h-full gap-4">
                {/* Category Sidebar */}
                <div className="w-44 flex-shrink-0 flex flex-col gap-2">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                className={`glass-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={{ '--category-color': cat.color } as React.CSSProperties}
                            >
                                <Icon size={16} style={{ color: cat.color }} />
                                <span>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                    {/* Search Bar */}
                    <div className="glass-search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Balance Display */}
                    <div className="glass-balance-pill">
                        <span>Balance:</span>
                        <strong>${balance.toFixed(2)}</strong>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="animate-spin h-8 w-8 text-green-500" />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-8 text-white/60">
                                No items found
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {filteredItems.map(item => (
                                    <motion.div
                                        key={item.id}
                                        className="glass-product-card"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {item.isDeal && (
                                            <div className="deal-badge">
                                                <Zap size={12} />
                                                DEAL
                                            </div>
                                        )}
                                        <div className="product-icon">{item.icon}</div>
                                        <div className="product-info">
                                            <h4>{item.name}</h4>
                                            <p>{item.description}</p>
                                            <div className="product-price">
                                                {item.originalPrice && (
                                                    <span className="original">${item.originalPrice}</span>
                                                )}
                                                <span className="current">${item.price}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="glass-button small"
                                            onClick={() => addToCart(item)}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart Summary Bar */}
                    {cart.length > 0 && !showCheckout && (
                        <div className="glass-cart-bar">
                            <div className="cart-summary">
                                <ShoppingBag size={18} />
                                <span>{cart.length} items</span>
                                <strong>${cartTotal.toFixed(2)}</strong>
                            </div>
                            <button
                                type="button"
                                className="glass-button primary"
                                onClick={() => setShowCheckout(true)}
                            >
                                Checkout
                            </button>
                        </div>
                    )}
                </div>

                {/* Checkout Panel */}
                <AnimatePresence>
                    {showCheckout && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="w-64 glass-cart-panel"
                        >
                            <h3>Your Cart</h3>
                            <div className="cart-items">
                                {cart.map(({ item, quantity }) => (
                                    <div key={item.id} className="cart-item">
                                        <span className="icon">{item.icon}</span>
                                        <div className="info">
                                            <span className="name">{item.name}</span>
                                            <span className="price">${(item.price * quantity).toFixed(2)}</span>
                                        </div>
                                        <div className="qty-controls">
                                            <button type="button" onClick={() => updateQuantity(item.id, -1)}>
                                                <Minus size={12} />
                                            </button>
                                            <span>{quantity}</span>
                                            <button type="button" onClick={() => updateQuantity(item.id, 1)}>
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            className="remove"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="cart-total">
                                <span>Total:</span>
                                <strong>${cartTotal.toFixed(2)}</strong>
                            </div>
                            {!canAfford && (
                                <div className="text-red-400 text-sm text-center">
                                    Insufficient funds!
                                </div>
                            )}
                            <button
                                type="button"
                                className="glass-button primary w-full"
                                onClick={handleCheckout}
                                disabled={purchasing || !canAfford}
                            >
                                {purchasing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={16} />
                                        Pay ${cartTotal.toFixed(2)}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="glass-button secondary w-full mt-2"
                                onClick={() => setShowCheckout(false)}
                            >
                                Continue Shopping
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Purchase Result Toast */}
            <AnimatePresence>
                {purchaseResult && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className={`purchase-toast ${purchaseResult}`}
                    >
                        {purchaseResult === 'success' ? (
                            <>
                                <Check size={24} />
                                <span>Purchase successful!</span>
                            </>
                        ) : (
                            <>
                                <X size={24} />
                                <span>{errorMessage}</span>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </BuildingInteractionWindow>
    );
}
