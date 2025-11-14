import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePet } from '../../context/PetContext';
import { shopService } from '../../services/shopService';

type Option = { id: string; name: string; cost: number; cleanlinessGain: number; happinessGain?: number; healthGain?: number; emoji: string };

const OPTIONS: Option[] = [
  { id: 'quick', name: 'Quick Wash', cost: 3, cleanlinessGain: 30, emoji: '🧼' },
  { id: 'bath', name: 'Full Bath', cost: 8, cleanlinessGain: 60, happinessGain: 5, emoji: '🛁' },
  { id: 'spa', name: 'Spa Treatment', cost: 20, cleanlinessGain: 100, happinessGain: 15, healthGain: 5, emoji: '💆' },
];

export const CleanScreen: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  const { pet, updatePetStats } = usePet();
  const [selected, setSelected] = useState<Option | null>(null);
  const [balance, setBalance] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const handleClean = async () => {
    if (!selected || !pet || !currentUser) return;
    if (balance < selected.cost) return toast.error('Insufficient funds');
    try {
      setLoading(true);
      await shopService.addCoins(currentUser.uid, -selected.cost, `Clean: ${selected.name}`);
      setBalance(prev => prev - selected.cost);
      await updatePetStats({
        cleanliness: Math.min(100, pet.stats.cleanliness + selected.cleanlinessGain),
        happiness: Math.min(100, pet.stats.happiness + (selected.happinessGain || 0)),
        health: Math.min(100, pet.stats.health + (selected.healthGain || 0)),
      });
      toast.success(`All clean! ${pet.name} feels fresh!`);
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Failed to clean pet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} aria-label="Back">← Back</button>
          <div className="flex items-center gap-2 bg-secondary/20 border border-secondary/40 rounded-full px-4 py-2" aria-live="polite">
            <span className="text-xl">💰</span>
            <span className="font-bold text-secondary">${balance}</span>
          </div>
        </div>
        <header className="mb-6">
          <h1 className="text-3xl font-black text-charcoal">Clean {pet?.name}</h1>
          <p className="text-slate-600">Pick a cleaning option</p>
        </header>
        <div className="grid md:grid-cols-3 gap-4">
          {OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setSelected(opt)} className={`p-4 text-left rounded-pet border ${selected?.id===opt.id?'border-primary':'border-slate-200'} bg-white shadow-soft hover:shadow-lg`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl" aria-hidden>{opt.emoji}</div>
                <div className={`text-lg font-bold ${balance<opt.cost?'text-slate-400':'text-charcoal'}`}>${opt.cost}</div>
              </div>
              <div className="font-semibold">{opt.name}</div>
              <div className="text-sm text-slate-600 mt-1">+{opt.cleanlinessGain} cleanliness{opt.happinessGain?` · +${opt.happinessGain} happiness`:''}{opt.healthGain?` · +${opt.healthGain} health`:''}</div>
            </button>
          ))}
        </div>
        <div className="ds-card p-4 mt-6 flex items-center justify-end gap-2">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-pet border border-slate-300 bg-white font-semibold">Cancel</button>
          <button onClick={handleClean} disabled={!selected || loading || (selected && balance < selected.cost)} className="btn-primary">{loading? 'Cleaning…' : 'Clean Pet'}</button>
        </div>
      </div>
    </div>
  );
};

export default CleanScreen;


