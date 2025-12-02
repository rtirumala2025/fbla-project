/**
 * Inventory Page
 * View and use items from inventory
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowLeft, Zap, Heart, UtensilsCrossed, Pill, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { usePet } from '../context/PetContext';
import { getInventory, useItem as useItemFunction } from '../api/finance';
import type { InventoryEntry } from '../types/finance';

const categoryIcons: Record<string, React.ReactNode> = {
  food: <UtensilsCrossed className="w-5 h-5" />,
  medicine: <Pill className="w-5 h-5" />,
  energy: <Zap className="w-5 h-5" />,
  toy: <Gamepad2 className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700 border-orange-300',
  medicine: 'bg-red-100 text-red-700 border-red-300',
  energy: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  toy: 'bg-purple-100 text-purple-700 border-purple-300',
};

export const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingItem, setUsingItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  const { pet, refreshPet } = usePet();

  const loadInventory = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const items = await getInventory();
      setInventory(items);
    } catch (error: any) {
      console.error('❌ Inventory: Failed to load inventory:', error);
      toast.error(`Failed to load inventory: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, toast]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleUseItem = async (item: InventoryEntry, quantity: number = 1) => {
    if (!pet) {
      toast.error('Please create a pet first!');
      return;
    }

    if (item.quantity < quantity) {
      toast.error(`You only have ${item.quantity} of this item.`);
      return;
    }

    setUsingItem(item.item_id);

    try {
      const response = await useItemFunction({
        item_id: item.item_id,
        quantity,
        pet_id: pet.id,
      });

      // Refresh inventory and pet
      await loadInventory();
      await refreshPet();

      // Show success message with stat updates
      const statMessages: string[] = [];
      if (response.stat_updates) {
        Object.entries(response.stat_updates).forEach(([stat, value]) => {
          if (value > 0) {
            statMessages.push(`+${value} ${stat}`);
          }
        });
      }

      const message = response.message + (statMessages.length > 0 ? ` (${statMessages.join(', ')})` : '');
      toast.success(message);

      if (response.remaining_quantity === 0) {
        toast.info(`${item.item_name} is now out of stock.`);
      }
    } catch (error: any) {
      console.error('❌ Inventory: Error using item:', error);
      toast.error(`Failed to use item: ${error.message || 'Unknown error'}`);
    } finally {
      setUsingItem(null);
    }
  };

  const groupedInventory = inventory.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, InventoryEntry[]>);

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
        </div>

        <h1 className="text-4xl font-black text-gray-900 mb-2">Inventory</h1>
        <p className="text-gray-600 mb-8">
          {pet ? `Use items for ${pet.name}` : 'Use items for your pet'}
        </p>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading inventory...</p>
          </div>
        )}

        {!loading && inventory.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-300">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your inventory is empty</h3>
            <p className="text-gray-600 mb-4">Visit the shop to purchase items for your pet!</p>
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-colors"
            >
              Go to Shop
            </button>
          </div>
        )}

        {!loading && inventory.length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedInventory).map(([category, items]) => (
              <div key={category} className="bg-white rounded-2xl border-2 border-gray-300 p-6">
                <div className="flex items-center gap-2 mb-4">
                  {categoryIcons[category] || <Package className="w-5 h-5" />}
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">{category}</h2>
                  <span className="text-sm text-gray-500">({items.length} items)</span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => {
                    const isUsing = usingItem === item.item_id;
                    const categoryColor = categoryColors[category] || 'bg-gray-100 text-gray-700 border-gray-300';

                    return (
                      <motion.div
                        key={item.item_id}
                        className="border-2 border-gray-300 rounded-xl p-4 hover:border-indigo-500 transition-all"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{item.item_name}</h3>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${categoryColor}`}>
                              {category}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Quantity</p>
                            <p className="text-2xl font-bold text-indigo-600">{item.quantity}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleUseItem(item, 1)}
                            disabled={isUsing || item.quantity < 1 || !pet}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUsing ? 'Using...' : 'Use 1'}
                          </button>
                          {item.quantity > 1 && (
                            <button
                              onClick={() => handleUseItem(item, Math.min(item.quantity, 5))}
                              disabled={isUsing || !pet}
                              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Use {Math.min(item.quantity, 5)}
                            </button>
                          )}
                        </div>

                        {!pet && (
                          <p className="text-xs text-red-600 mt-2">Create a pet to use items</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
