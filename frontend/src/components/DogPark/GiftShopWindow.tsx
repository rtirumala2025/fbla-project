/**
 * GiftShopWindow.tsx (Pet Supermarket)
 * 
 * Full-featured pet supermarket with:
 * - Hero banner with featured deals
 * - Category sidebar navigation
 * - Enhanced product grid
 * - Search and filter functionality
 * - Shopping cart with quantity controls
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, ShoppingCart, Plus, Minus, Trash2, CreditCard,
    Loader2, Check, X, Gift, Search, Sparkles, Tag, Zap,
    Bone, Heart, Scissors, Home, Crown, Package
} from 'lucide-react';
import { BuildingInteractionWindow } from './BuildingInteractionWindow';
import { getShopCatalog, purchaseItems } from '../../api/finance';
import { useFinancial } from '../../context/FinancialContext';
import type { ShopItemEntry } from '../../types/finance';
import './building-windows.css';

// Extended local type that includes icon for display purposes
interface DisplayShopItem extends ShopItemEntry {
    icon?: string;
    originalPrice?: number;
    isDeal?: boolean;
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

// Category configuration - ACCESSORIES ONLY
const CATEGORIES = [
    { id: 'all', name: 'All Accessories', icon: Package, color: '#8b5cf6' },
    { id: 'collar', name: 'Collars', icon: Crown, color: '#f59e0b' },
    { id: 'hat', name: 'Hats & Headwear', icon: Crown, color: '#ec4899' },
    { id: 'bandana', name: 'Bandanas', icon: Gift, color: '#10b981' },
    { id: 'glasses', name: 'Eyewear', icon: Sparkles, color: '#3b82f6' },
    { id: 'outfit', name: 'Outfits', icon: Home, color: '#a855f7' },
    { id: 'accessory', name: 'Other', icon: Heart, color: '#06b6d4' },
];

// Accessory categories to filter from shop catalog
const ACCESSORY_CATEGORIES = ['accessories', 'collar', 'hat', 'bandana', 'glasses', 'outfit', 'accessory'];


// Map a category to an icon for display
const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
        food: '🍖',
        toys: '🧸',
        toy: '🧸',
        furniture: '🛏️',
        accessories: '📿',
        care: '✨',
        health: '💊',
        grooming: '✂️',
        medicine: '💊',
        energy: '⚡',
    };
    return icons[category?.toLowerCase()] || '📦';
};

export function GiftShopWindow({ isOpen, onClose, onPurchaseComplete }: GiftShopWindowProps) {
    const [items, setItems] = useState<DisplayShopItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    // Global finance state
    const { balance, refreshBalance } = useFinancial();

    const [showCheckout, setShowCheckout] = useState(false);
    const [purchaseResult, setPurchaseResult] = useState<'success' | 'error' | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Load shop items and balance
    useEffect(() => {
        if (isOpen) {
            loadShopData();
        }
    }, [isOpen]);

    const loadShopData = async () => {
        setLoading(true);
        console.log('[GiftShop] Loading shop data...');
        try {
            // Promise.all can fail entirely if one fails. Hardening this.
            const catalogData = await getShopCatalog().catch(e => {
                console.error('[GiftShop] Catalog load failed:', e);
                return [];
            });

            console.log('[GiftShop] Loaded:', { catalog: catalogData.length });

            // Filter to accessories only and add icons
            const accessoryItems = catalogData.filter(item =>
                ACCESSORY_CATEGORIES.includes(item.category.toLowerCase()) ||
                (item.metadata as any)?.equippable === true
            );

            const itemsWithIcons: DisplayShopItem[] = accessoryItems.map(item => {
                const metadata = typeof item.metadata === 'object' ? item.metadata : {};
                return {
                    ...item,
                    icon: (item as any).emoji || getCategoryIcon(item.category),
                    originalPrice: (metadata as any)?.originalPrice,
                    isDeal: (metadata as any)?.isDeal || item.category === 'deals',
                };
            });
            setItems(itemsWithIcons);
        } catch (error) {
            console.error('Failed to load shop data:', error);
            // Use accessory mock data as fallback
            setItems([
                { id: '1', sku: 'acc-collar', name: 'Fancy Collar', description: 'Stylish neckwear for your pet', price: 75, category: 'collar', stock: 99, icon: '📿' },
                { id: '2', sku: 'acc-bandana', name: 'Cool Bandana', description: 'Fashionable bandana', price: 40, category: 'bandana', stock: 99, icon: '🧣' },
                { id: '4', sku: 'acc-glasses', name: 'Pet Sunglasses', description: 'Cool shades', price: 60, category: 'glasses', stock: 99, icon: '🕶️' },
            ]);
        } finally {
            setLoading(false);
        }
    };


    // Filtered items based on category and search
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = selectedCategory === 'all' ||
                item.category.toLowerCase() === selectedCategory.toLowerCase();
            const matchesSearch = !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [items, selectedCategory, searchQuery]);



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

            // Add explicit timeout to purchase call to prevent infinite hanging
            const purchasePromise = purchaseItems(purchaseData);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Purchase timed out. Please try again.')), 15000)
            );

            await Promise.race([purchasePromise, timeoutPromise]);

            setPurchaseResult('success');
            // Refresh global balance to reflect purchase (non-blocking)
            refreshBalance().catch(e => console.warn('Background balance refresh failed:', e));

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
            title="Pet Accessories Shop"
            icon={<ShoppingBag />}
            width={1000}
            minHeight={600}
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
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>

                    {/* Hero Banner - Daily Deals */}
                    {/* Hero Banner - Daily Deals REMOVED */}


                    {/* Main Content Area */}
                    <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>

                        {/* Category Sidebar */}
                        <div style={{
                            width: 180,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}>
                            {CATEGORIES.map(cat => {
                                const IconComponent = cat.icon;
                                const isActive = selectedCategory === cat.id;
                                const itemCount = cat.id === 'all'
                                    ? items.length
                                    : items.filter(i => i.category.toLowerCase() === cat.id).length;

                                if (itemCount === 0 && cat.id !== 'all') return null;

                                return (
                                    <motion.button
                                        key={cat.id}
                                        whileHover={{ x: 4 }}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '10px 14px',
                                            borderRadius: 12,
                                            border: 'none',
                                            background: isActive
                                                ? `${cat.color}33`
                                                : 'rgba(255, 255, 255, 0.05)',
                                            color: isActive ? cat.color : 'rgba(255, 255, 255, 0.7)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s',
                                            borderLeft: isActive
                                                ? `3px solid ${cat.color}`
                                                : '3px solid transparent',
                                        }}
                                    >
                                        <IconComponent size={18} />
                                        <span style={{ flex: 1, fontWeight: isActive ? 600 : 500, fontSize: '0.9rem' }}>
                                            {cat.name}
                                        </span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            opacity: 0.7,
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            padding: '2px 6px',
                                            borderRadius: 6,
                                        }}>
                                            {itemCount}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Product Grid */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            {/* Search and Balance Bar */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 16,
                                gap: 16,
                            }}>
                                <div style={{
                                    flex: 1,
                                    maxWidth: 300,
                                    position: 'relative',
                                }}>
                                    <Search
                                        size={16}
                                        style={{
                                            position: 'absolute',
                                            left: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            opacity: 0.5,
                                        }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px 10px 38px',
                                            borderRadius: 10,
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div className="building-balance-pill">
                                    💰 {balance} coins
                                </div>
                            </div>

                            {/* Items Grid */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: 12,
                                paddingRight: 8,
                                alignContent: 'start',
                            }}>
                                {filteredItems.length === 0 ? (
                                    <div style={{
                                        gridColumn: '1 / -1',
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                        color: 'rgba(255, 255, 255, 0.5)',
                                    }}>
                                        <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>No items found</p>
                                    </div>
                                ) : (
                                    filteredItems.map(item => {
                                        const inCart = cart.find(c => c.item.id === item.id);
                                        return (
                                            <motion.div
                                                key={item.id}
                                                className={`building-grid-item ${inCart ? 'selected' : ''}`}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => addToCart(item)}
                                                style={{ position: 'relative' }}
                                            >
                                                {item.isDeal && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: -6,
                                                        left: -6,
                                                        background: '#ef4444',
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: 8,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 3,
                                                    }}>
                                                        <Tag size={10} /> DEAL
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                                                    {item.icon || '📦'}
                                                </div>
                                                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.9rem' }}>
                                                    {item.name}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.7rem',
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    marginBottom: 8,
                                                    minHeight: 28,
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                }}>
                                                    {item.description}
                                                </div>
                                                <div className="building-price" style={{ fontSize: '0.85rem' }}>
                                                    {item.originalPrice && (
                                                        <span style={{
                                                            textDecoration: 'line-through',
                                                            color: '#94a3b8',
                                                            marginRight: 6,
                                                            fontSize: '0.75rem',
                                                        }}>
                                                            {item.originalPrice}
                                                        </span>
                                                    )}
                                                    {item.price} 💰
                                                </div>
                                                {inCart && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        background: '#6366f1',
                                                        borderRadius: '50%',
                                                        width: 22,
                                                        height: 22,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700
                                                    }}>
                                                        {inCart.quantity}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Cart Sidebar */}
                        <div className="building-cart-sidebar" style={{ width: 260, minWidth: 260 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 16
                            }}>
                                <ShoppingCart size={20} />
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Cart</h3>
                                {cartItemCount > 0 && (
                                    <span style={{
                                        background: '#6366f1',
                                        borderRadius: 10,
                                        padding: '2px 8px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                    }}>
                                        {cartItemCount}
                                    </span>
                                )}
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
                                                    <span style={{ fontSize: '1.2rem' }}>{item.icon || '📦'}</span>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontWeight: 500,
                                                            fontSize: '0.8rem',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {item.name}
                                                        </div>
                                                        <div className="building-price" style={{ fontSize: '0.7rem' }}>
                                                            {item.price * quantity} 💰
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="building-qty-btn"
                                                            style={{ width: 24, height: 24 }}
                                                        >
                                                            <Minus size={10} />
                                                        </button>
                                                        <span style={{
                                                            width: 20,
                                                            textAlign: 'center',
                                                            fontSize: '0.8rem'
                                                        }}>
                                                            {quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="building-qty-btn"
                                                            style={{ width: 24, height: 24 }}
                                                        >
                                                            <Plus size={10} />
                                                        </button>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="building-qty-btn building-qty-btn-delete"
                                                            style={{ marginLeft: 2, width: 24, height: 24 }}
                                                        >
                                                            <Trash2 size={10} />
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
                                                fontSize: '0.75rem',
                                                marginBottom: 8,
                                                textAlign: 'center'
                                            }}>
                                                Need {cartTotal - balance} more coins
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                className="building-btn building-btn-secondary"
                                                onClick={clearCart}
                                                style={{ flex: 1, padding: '10px 12px', fontSize: '0.85rem' }}
                                            >
                                                Clear
                                            </button>
                                            <button
                                                className="building-btn building-btn-success"
                                                onClick={() => setShowCheckout(true)}
                                                disabled={!canAfford}
                                                style={{ flex: 2, padding: '10px 12px', fontSize: '0.85rem' }}
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
