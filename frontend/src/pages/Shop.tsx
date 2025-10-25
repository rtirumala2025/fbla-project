import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

interface ShopItem {
  id: string;
  name: string;
  category: 'food' | 'toy' | 'medicine' | 'energy';
  price: number;
  emoji: string;
  description: string;
  species: string[];
}

const shopItems: ShopItem[] = [
  { id: '1', name: 'Dog Food', category: 'food', price: 10, emoji: '🍖', description: 'Nutritious meal', species: ['dog'] },
  { id: '2', name: 'Cat Food', category: 'food', price: 10, emoji: '🐟', description: 'Tasty fish', species: ['cat'] },
  { id: '3', name: 'Bird Seed', category: 'food', price: 8, emoji: '🌾', description: 'Premium seeds', species: ['bird'] },
  { id: '4', name: 'Rabbit Food', category: 'food', price: 8, emoji: '🥕', description: 'Fresh veggies', species: ['rabbit'] },
  { id: '5', name: 'Ball', category: 'toy', price: 15, emoji: '⚽', description: 'Fun toy', species: ['dog', 'cat', 'rabbit'] },
  { id: '6', name: 'Feather Toy', category: 'toy', price: 12, emoji: '🪶', description: 'Interactive play', species: ['cat', 'bird'] },
  { id: '7', name: 'Chew Toy', category: 'toy', price: 18, emoji: '🦴', description: 'Durable chew', species: ['dog', 'rabbit'] },
  { id: '8', name: 'Medicine', category: 'medicine', price: 25, emoji: '💊', description: 'Health boost', species: ['dog', 'cat', 'bird', 'rabbit'] },
  { id: '9', name: 'Vitamins', category: 'medicine', price: 20, emoji: '💉', description: 'Daily vitamins', species: ['dog', 'cat', 'bird', 'rabbit'] },
  { id: '10', name: 'Energy Drink', category: 'energy', price: 15, emoji: '⚡', description: 'Instant energy boost', species: ['dog', 'cat', 'bird', 'rabbit'] },
  { id: '11', name: 'Power Potion', category: 'energy', price: 18, emoji: '🧪', description: 'Maximum energy', species: ['dog', 'cat', 'bird', 'rabbit'] },
];

export const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<string[]>([]);
  const [balance] = useState(100); // TODO: Connect to global state
  const navigate = useNavigate();
  const toast = useToast();

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);

  const addToCart = (itemId: string) => {
    setCart([...cart, itemId]);
  };

  const removeFromCart = (itemId: string) => {
    const index = cart.indexOf(itemId);
    if (index > -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };

  const getTotalCost = () => {
    return cart.reduce((sum, itemId) => {
      const item = shopItems.find(i => i.id === itemId);
      return sum + (item?.price || 0);
    }, 0);
  };

  const getItemCount = (itemId: string) => {
    return cart.filter(id => id === itemId).length;
  };

  const handlePurchase = () => {
    const total = getTotalCost();
    if (balance >= total) {
      // TODO: Implement actual purchase logic with context
      const itemCount = cart.length;
      setCart([]);
      toast.success(`Purchase successful! ${itemCount} item${itemCount > 1 ? 's' : ''} added to your inventory. 🎉`);
    } else {
      toast.error('Not enough coins! 💰');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-12 pt-20">
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

            {cart.length > 0 && (
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
        <p className="text-gray-600 mb-8">Get supplies for your pet</p>

        {/* Category filters */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {['all', 'food', 'toy', 'medicine', 'energy'].map(category => (
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
          {filteredItems.map(item => {
            const itemCount = getItemCount(item.id);
            return (
              <motion.div
                key={item.id}
                className="bg-white border-2 border-gray-300 rounded-2xl p-6 hover:border-indigo-500 transition-all shadow-lg hover:shadow-xl"
                whileHover={{ y: -5 }}
              >
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                
                {/* Category badge */}
                <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 mb-4 capitalize">
                  {item.category}
                </span>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-amber-600 font-bold">{item.price} coins</span>
                  <div className="flex items-center gap-2">
                    {itemCount > 0 && (
                      <>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                        >
                          -
                        </button>
                        <span className="text-gray-900 font-bold">{itemCount}</span>
                      </>
                    )}
                    <button
                      onClick={() => addToCart(item.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Cart summary */}
        {cart.length > 0 && (
          <motion.div
            className="fixed bottom-6 right-6 bg-white border-2 border-gray-300 rounded-2xl p-6 shadow-2xl max-w-sm"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cart Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Items:</span>
                <span>{cart.length}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total:</span>
                <span className="text-amber-600">{getTotalCost()} coins</span>
              </div>
            </div>
            <button
              onClick={handlePurchase}
              disabled={getTotalCost() > balance}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Purchase
            </button>
            {getTotalCost() > balance && (
              <p className="text-red-600 text-sm mt-2 text-center">Not enough coins!</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
