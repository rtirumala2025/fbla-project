import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePet } from '../../context/PetContext';
import { shopService } from '../../services/shopService';

type FoodOption = {
  id: string;
  name: string;
  cost: number;
  hungerGain: number;
  happinessGain?: number;
  healthGain?: number;
  emoji: string;
};

const FOODS: FoodOption[] = [
  { id: 'basic-kibble', name: 'Basic Kibble', cost: 5, hungerGain: 20, emoji: '🥣' },
  { id: 'premium-food', name: 'Premium Food', cost: 15, hungerGain: 40, happinessGain: 5, emoji: '🍖' },
  { id: 'healthy-meal', name: 'Healthy Meal', cost: 12, hungerGain: 30, healthGain: 3, emoji: '🥗' },
  { id: 'treat', name: 'Treat', cost: 8, hungerGain: 15, happinessGain: 10, emoji: '🍪' },
  { id: 'gourmet', name: 'Gourmet Dinner', cost: 25, hungerGain: 50, happinessGain: 10, healthGain: 5, emoji: '🍱' },
];

export const FeedScreen: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  const { pet, updatePetStats } = usePet();
  const [selected, setSelected] = useState<FoodOption | null>(null);
  const [balance, setBalance] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const canAfford = (cost: number) => balance >= cost;
  const moneyAfter = useMemo(() => (selected ? balance - selected.cost : balance), [balance, selected]);

  const handleFeed = async () => {
    if (!selected || !pet || !currentUser) return;
    if (!canAfford(selected.cost)) return toast.error('Insufficient funds');
    try {
      setLoading(true);
      // Deduct money and create transaction
      await shopService.addCoins(currentUser.uid, -selected.cost, `Fed ${selected.name}`);
      setBalance(prev => prev - selected.cost);
      // Update pet stats
      await updatePetStats({
        hunger: Math.min(100, pet.stats.hunger + selected.hungerGain),
        happiness: Math.min(100, pet.stats.happiness + (selected.happinessGain || 0)),
        health: Math.min(100, pet.stats.health + (selected.healthGain || 0)),
      });
      toast.success(`Yum! ${pet.name} loved the ${selected.name}!`);
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Failed to feed pet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-charcoal" aria-label="Back to dashboard">← Back</button>
          <div className="flex items-center gap-2 bg-secondary/20 border border-secondary/40 rounded-full px-4 py-2" aria-live="polite">
            <span className="text-xl">💰</span>
            <span className="font-bold text-secondary">${balance}</span>
          </div>
        </div>
        <header className="mb-6">
          <h1 className="text-3xl font-black text-charcoal">Feed {pet?.name}</h1>
          <p className="text-slate-600">Choose a meal and see its benefits</p>
        </header>

        <div className="grid md:grid-cols-3 gap-4" role="list" aria-label="Food Options">
          {FOODS.map(food => (
            <button
              key={food.id}
              onClick={() => setSelected(food)}
              className={`text-left p-4 rounded-pet border shadow-soft hover:shadow-lg transition ${selected?.id===food.id?'border-primary':'border-slate-200 bg-white'}`}
              aria-pressed={selected?.id === food.id}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl" aria-hidden>{food.emoji}</div>
                <div className={`text-lg font-bold ${canAfford(food.cost)?'text-charcoal':'text-slate-400'}`}>${food.cost}</div>
              </div>
              <div className="font-semibold text-charcoal">{food.name}</div>
              <div className="text-sm text-slate-600 mt-1">
                +{food.hungerGain} hunger
                {food.happinessGain ? ` · +${food.happinessGain} happiness` : ''}
                {food.healthGain ? ` · +${food.healthGain} health` : ''}
              </div>
              {!canAfford(food.cost) && (
                <div className="text-xs text-red-600 mt-2" role="note">Insufficient funds</div>
              )}
            </button>
          ))}
        </div>

        <div className="ds-card p-4 mt-6 flex items-center justify-between" aria-live="polite">
          <div>
            <div className="text-slate-700">Money after purchase</div>
            <div className={`text-2xl font-black ${selected && !canAfford(selected.cost)?'text-red-600':'text-charcoal'}`}>${moneyAfter}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-pet border border-slate-300 bg-white font-semibold">Cancel</button>
            <button onClick={handleFeed} disabled={!selected || (selected && !canAfford(selected.cost)) || loading} className="btn-primary disabled:opacity-50">{loading? 'Feeding…' : 'Feed Pet'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedScreen;


