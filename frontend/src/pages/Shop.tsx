/**
 * Shop Page
 * Virtual pet shop for purchasing items
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
// Removed usePet - items are now stored in inventory, not auto-applied
import {
  getFinanceSummary,
  getShopCatalog,
  purchaseItems,
} from '../api/finance';
import type { FinanceSummary, ShopItemEntry } from '../types/finance';

type CartState = Record<string, number>;

const categoryDisplay: Record<string, string> = {
  food: 'Food',
  toy: 'Toys',
  medicine: 'Medicine',
  energy: 'Energy',
};

export const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartState>({});
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [shopItems, setShopItems] = useState<ShopItemEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  // Removed pet context - purchases go to inventory

  const loadData = useCallback(async (withSpinner: boolean = true) => {
    if (!currentUser?.uid) {
      if (withSpinner) {
        setLoading(false);
      }
      return;
    }

    try {
      if (withSpinner) {
        setLoading(true);
      }
      const [summaryResponse, shopResponse] = await Promise.all([
        getFinanceSummary(),
        getShopCatalog(),
      ]);
      setFinanceSummary(summaryResponse.summary);
      setShopItems(shopResponse);
    } catch (error: any) {
      console.error('❌ Shop: Failed to load store data:', error);
      toast.error(`Failed to load shop: ${error.message || 'Unknown error'}`);
    } finally {
      if (withSpinner) {
        setLoading(false);
      }
    }
  }, [currentUser?.uid, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const balance = financeSummary?.balance || 0;

  const categories = useMemo(() => {
    const unique = new Set<string>(shopItems.map((item) => item.category));
    return ['all', ...Array.from(unique)];
  }, [shopItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return shopItems;
    }
    return shopItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, shopItems]);

  const getItemQuantity = (sku: string) => cart[sku] || 0;

  const updateCartQuantity = (sku: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[sku] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        delete next[sku];
      } else {
        next[sku] = newValue;
      }
      return next;
    });
  };

  const getTotalCost = useCallback(() => {
    return Object.entries(cart).reduce((sum, [sku, quantity]) => {
      const item = shopItems.find((entry) => entry.sku === sku);
      return sum + (item ? item.price * quantity : 0);
    }, 0);
  }, [cart, shopItems]);

  const totalCost = getTotalCost();

  const handlePurchase = async () => {
    if (!currentUser?.uid) {
      toast.error('Please log in to make a purchase');
      return;
    }

    if (Object.keys(cart).length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    if (balance < totalCost) {
      toast.error('Not enough coins! 💰');
      return;
    }

    setProcessing(true);

    try {
      const payload = {
        items: Object.entries(cart).map(([itemId, quantity]) => ({
          item_id: itemId,
          quantity,
        })),
      };

      const response = await purchaseItems(payload);
      setFinanceSummary(response.summary);
      await loadData(false);

      const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
      setCart({});
      toast.success(
        `Purchase successful! ${itemCount} item${itemCount > 1 ? 's' : ''} added to your inventory! 🎉`,
      );
      
      // Suggest going to inventory to use items
      setTimeout(() => {
        toast.info('Visit your inventory to use items on your pet!', { duration: 5000 });
      }, 2000);
    } catch (error: any) {
      console.error('❌ Shop: Error processing purchase:', error);
      toast.error(`Failed to process purchase: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2">
              <span className="text-xl">💰</span>
              <span className="font-bold text-amber-400">{balance}</span>
            </div>

            {Object.keys(cart).length > 0 && (
              <button
                onClick={handlePurchase}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                Checkout ({getTotalCost()} coins)
              </button>
            )}
          </div>
        </div>

        <h1 className="text-4xl font-black text-gray-900 mb-2">Shop</h1>
        <p className="text-gray-600 mb-8">
          Purchase items and add them to your inventory
        </p>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading shop...</p>
          </div>
        )}

        {/* Category filters */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all capitalize ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:text-gray-900 border-2 border-gray-300 hover:border-gray-400'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const itemCount = getItemQuantity(item.sku);
            const displayCategory = categoryDisplay[item.category] || item.category;
            const stockRemaining = Math.max(0, item.stock - itemCount);
            const metadata = (item.metadata ?? {}) as Record<string, unknown>;
            const emojiValue = metadata['emoji'];
            const emoji = typeof emojiValue === 'string' ? emojiValue : '🛒';
            return (
              <motion.div
                key={item.id}
                className="bg-white border-2 border-gray-300 rounded-2xl p-6 hover:border-indigo-500 transition-all shadow-lg hover:shadow-xl"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-4xl" role="img" aria-hidden="true">
                      {emoji}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-3 mb-1">{item.name}</h3>
                    {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
                  </div>
                  <PackageCheck className="h-6 w-6 text-indigo-500" />
                </div>

                <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 mb-4 capitalize">
                  {displayCategory}
                </span>

                <p className="text-xs text-gray-500 mb-2">SKU: {item.sku}</p>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-amber-600 font-bold">{item.price} coins</span>
                    <p className="text-xs text-gray-500">Stock: {stockRemaining}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {itemCount > 0 && (
                      <>
                        <button
                          onClick={() => updateCartQuantity(item.sku, -1)}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                        >
                          -
                        </button>
                        <span className="text-gray-900 font-bold">{itemCount}</span>
                      </>
                    )}
                    <button
                      onClick={() => updateCartQuantity(item.sku, 1)}
                      disabled={stockRemaining <= 0}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
                    >
                      {stockRemaining <= 0 ? 'Sold out' : '+'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Cart summary */}
        {Object.keys(cart).length > 0 && (
          <motion.div
            className="fixed bottom-6 right-6 bg-white border-2 border-gray-300 rounded-2xl p-6 shadow-2xl max-w-sm"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cart Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Items:</span>
                <span>{Object.values(cart).reduce((sum, qty) => sum + qty, 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total:</span>
                <span className="text-amber-600">{totalCost} coins</span>
              </div>
            </div>
            <button
              onClick={handlePurchase}
              disabled={totalCost > balance || processing || Object.keys(cart).length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Complete Purchase'}
            </button>
            {totalCost > balance && (
              <p className="text-red-600 text-sm mt-2 text-center">Not enough coins!</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
