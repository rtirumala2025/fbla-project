/**
 * GiftShopWindow.tsx
 * 
 * Floating window for the Gift Shop building.
 * Features: scrollable item catalog, shopping cart, checkout flow
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ShoppingCart, Plus, Minus, Trash2, CreditCard, Loader2, Check, X, Gift } from 'lucide-react';
import { BuildingInteractionWindow } from './BuildingInteractionWindow';
import { getShopCatalog, purchaseItems, getFinanceSummary } from '../../api/finance';
import type { ShopItemEntry } from '../../types/finance';
import './building-windows.css';

// Extended local type that includes icon for display purposes
interface DisplayShopItem extends ShopItemEntry {
    icon?: string;
}

interface CartItem {
    item: DisplayShopItem;
    quantity: number;
}

interface GiftShopWindowProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchaseComplete?: () => void;
}

// Map a category to an icon for display
const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
        food: '🍖',
        toys: '🧸',
        furniture: '🛏️',
        accessories: '📿',
        care: '✨',
    };
    return icons[category?.toLowerCase()] || '📦';
};

export function GiftShopWindow({ isOpen, onClose, onPurchaseComplete }: GiftShopWindowProps) {
    const [items, setItems] = useState<DisplayShopItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [balance, setBalance] = useState(0);
    const [showCheckout, setShowCheckout] = useState(false);
    const [purchaseResult, setPurchaseResult] = useState<'success' | 'error' | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Load shop items and balance
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
            // Add icon based on category
            const itemsWithIcons: DisplayShopItem[] = catalogData.map(item => ({
                ...item,
                icon: getCategoryIcon(item.category)
            }));
            setItems(itemsWithIcons);
            setBalance(financeData.summary?.balance ?? 0);
        } catch (error) {
            console.error('Failed to load shop data:', error);
            // Use mock data as fallback
            setItems([
                { id: '1', sku: 'food-1', name: 'Premium Dog Food', description: 'High-quality nutrition for your pet', price: 50, category: 'food', stock: 99, icon: '🍖' },
                { id: '2', sku: 'toy-1', name: 'Squeaky Toy', description: 'Hours of fun playtime', price: 25, category: 'toys', stock: 99, icon: '🧸' },
                { id: '3', sku: 'furn-1', name: 'Cozy Bed', description: 'Comfortable sleeping spot', price: 100, category: 'furniture', stock: 99, icon: '🛏️' },
                { id: '4', sku: 'acc-1', name: 'Fancy Collar', description: 'Stylish accessory', price: 75, category: 'accessories', stock: 99, icon: '📿' },
                { id: '5', sku: 'food-2', name: 'Treat Bag', description: 'Delicious snacks', price: 30, category: 'food', stock: 99, icon: '🍪' },
                { id: '6', sku: 'toy-2', name: 'Ball Launcher', description: 'Automatic fetch fun', price: 150, category: 'toys', stock: 99, icon: '🎾' },
                { id: '7', sku: 'care-1', name: 'Grooming Kit', description: 'Keep your pet clean and healthy', price: 45, category: 'care', stock: 99, icon: '✨' },
                { id: '8', sku: 'furn-2', name: 'Water Fountain', description: 'Fresh water always', price: 80, category: 'furniture', stock: 99, icon: '💧' },
            ]);
            setBalance(500);
        } finally {
            setLoading(false);
        }
    };

    // Cart calculations
    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

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

    const clearCart = useCallback(() => {
        setCart([]);
        setShowCheckout(false);
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

            // Clear cart after short delay
            setTimeout(() => {
                setCart([]);
                setShowCheckout(false);
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

    // Close handler - reset state
    const handleClose = () => {
        setShowCheckout(false);
        setPurchaseResult(null);
        onClose();
    };

    return (
        <BuildingInteractionWindow
            isOpen={isOpen}
            onClose={handleClose}
            title="Gift Shop"
            icon={<Gift />}
            width={800}
            minHeight={500}
            footer={
                cart.length > 0 && !showCheckout ? (
                    <button
                        className="building-btn building-btn-primary"
                        onClick={() => setShowCheckout(true)}
                    >
                        <ShoppingCart size={16} style={{ marginRight: 8 }} />
                        Checkout ({cartItemCount} items - {cartTotal} coins)
                    </button>
                ) : undefined
            }
        >
            {loading ? (
                <div className="building-loading">
                    <div className="building-loading-spinner" />
                    <span>Loading shop...</span>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 20, height: '100%' }}>
                    {/* Item Catalog */}
                    <div style={{ flex: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20
                        }}>
                            <h3 className="building-section-header" style={{ margin: 0 }}>
                                Available Items
                            </h3>
                            <div className="building-balance-pill">
                                💰 {balance} coins
                            </div>
                        </div>

                        <div className="building-grid" style={{
                            overflowY: 'auto',
                            flex: 1,
                            paddingRight: 8
                        }}>
                            {items.map(item => {
                                const inCart = cart.find(c => c.item.id === item.id);
                                return (
                                    <motion.div
                                        key={item.id}
                                        className={`building-grid-item ${inCart ? 'selected' : ''}`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => addToCart(item)}
                                    >
                                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                                            {item.icon || '📦'}
                                        </div>
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                            {item.name}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#94a3b8',
                                            marginBottom: 8,
                                            minHeight: 32
                                        }}>
                                            {item.description}
                                        </div>
                                        <div className="building-price">
                                            {item.price} 💰
                                        </div>
                                        {inCart && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                background: '#6366f1',
                                                borderRadius: '50%',
                                                width: 24,
                                                height: 24,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 700
                                            }}>
                                                {inCart.quantity}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cart Sidebar */}
                    <div className="building-cart-sidebar" style={{ flex: 1, minWidth: 260 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 16
                        }}>
                            <ShoppingCart size={20} />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Cart</h3>
                        </div>

                        {cart.length === 0 ? (
                            <div className="building-empty-state">
                                <ShoppingBag size={36} className="building-empty-state-icon" />
                                <p style={{ margin: '0 0 4px' }}>Your cart is empty</p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Click items to add them</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    <AnimatePresence mode="popLayout">
                                        {cart.map(({ item, quantity }) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '8px 0',
                                                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.25rem' }}>{item.icon || '📦'}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontWeight: 500,
                                                        fontSize: '0.85rem',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {item.name}
                                                    </div>
                                                    <div className="building-price" style={{ fontSize: '0.75rem' }}>
                                                        {item.price * quantity} 💰
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="building-qty-btn"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span style={{
                                                        width: 24,
                                                        textAlign: 'center',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="building-qty-btn"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="building-qty-btn building-qty-btn-delete"
                                                        style={{ marginLeft: 4 }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Cart Total */}
                                <div style={{
                                    borderTop: '1px solid rgba(255,255,255,0.2)',
                                    paddingTop: 12,
                                    marginTop: 12
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 12
                                    }}>
                                        <span style={{ fontWeight: 600 }}>Total:</span>
                                        <span style={{
                                            fontWeight: 700,
                                            color: canAfford ? '#fbbf24' : '#ef4444'
                                        }}>
                                            {cartTotal} 💰
                                        </span>
                                    </div>

                                    {!canAfford && (
                                        <div style={{
                                            color: '#ef4444',
                                            fontSize: '0.8rem',
                                            marginBottom: 8,
                                            textAlign: 'center'
                                        }}>
                                            Insufficient funds! Need {cartTotal - balance} more coins
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            className="building-btn building-btn-secondary"
                                            onClick={clearCart}
                                            style={{ flex: 1 }}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            className="building-btn building-btn-success"
                                            onClick={() => setShowCheckout(true)}
                                            disabled={!canAfford}
                                            style={{ flex: 2 }}
                                        >
                                            <CreditCard size={14} style={{ marginRight: 4 }} />
                                            Buy
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            <AnimatePresence>
                {showCheckout && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="building-checkout-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="building-checkout-card"
                        >
                            {purchaseResult === 'success' ? (
                                <div style={{ textAlign: 'center' }}>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.1 }}
                                        className="building-result-icon success"
                                    >
                                        <Check size={40} color="rgba(120, 255, 180, 0.95)" />
                                    </motion.div>
                                    <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>
                                        Purchase Complete!
                                    </h3>
                                    <p style={{ color: '#94a3b8', margin: 0 }}>
                                        Items have been added to your inventory
                                    </p>
                                </div>
                            ) : purchaseResult === 'error' ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div className="building-result-icon error">
                                        <X size={40} color="rgba(255, 120, 120, 0.9)" />
                                    </div>
                                    <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#ef4444' }}>
                                        Purchase Failed
                                    </h3>
                                    <p style={{ color: '#94a3b8', margin: '0 0 16px' }}>
                                        {errorMessage}
                                    </p>
                                    <button
                                        className="building-btn building-btn-secondary"
                                        onClick={() => {
                                            setPurchaseResult(null);
                                            setShowCheckout(false);
                                        }}
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', textAlign: 'center' }}>
                                        Confirm Purchase
                                    </h3>

                                    <div className="building-checkout-items">
                                        {cart.map(({ item, quantity }) => (
                                            <div key={item.id} className="building-checkout-item">
                                                <span>
                                                    {item.icon} {item.name} × {quantity}
                                                </span>
                                                <span className="building-price">
                                                    {item.price * quantity} 💰
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="building-checkout-total">
                                        <span>Total:</span>
                                        <span className="building-price">{cartTotal} 💰</span>
                                    </div>

                                    <div className="building-checkout-after">
                                        <span>Balance after:</span>
                                        <span>{balance - cartTotal} 💰</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            className="building-btn building-btn-secondary"
                                            onClick={() => setShowCheckout(false)}
                                            style={{ flex: 1 }}
                                            disabled={purchasing}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="building-btn building-btn-success"
                                            onClick={handleCheckout}
                                            disabled={purchasing}
                                            style={{ flex: 2 }}
                                        >
                                            {purchasing ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard size={16} style={{ marginRight: 8 }} />
                                                    Confirm Purchase
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </BuildingInteractionWindow>
    );
}

export default GiftShopWindow;
