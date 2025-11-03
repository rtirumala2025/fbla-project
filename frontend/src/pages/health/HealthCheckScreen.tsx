import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePet } from '../../context/PetContext';
import { shopService } from '../../services/shopService';

export const HealthCheckScreen: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  const { pet, updatePetStats } = usePet();

  if (!pet) return null;

  const overall = Math.round((pet.stats.health + pet.stats.happiness + (100 - pet.stats.hunger) + pet.stats.cleanliness + pet.stats.energy) / 5);

  const status = overall >= 80 ? 'Healthy' : overall >= 60 ? 'Minor Issue' : 'Sick';

  const handleTreatment = async (type: 'checkup' | 'medicine' | 'full') => {
    if (!currentUser) return;
    const cost = type === 'checkup' ? 25 : type === 'medicine' ? 40 : 75;
    try {
      await shopService.addCoins(currentUser.uid, -cost, `Health ${type}`);
      const healthGain = type === 'checkup' ? 0 : type === 'medicine' ? 20 : 30;
      await updatePetStats({ health: Math.min(100, pet.stats.health + healthGain) });
      toast.success(`${pet.name} is feeling much better!`);
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Failed to get treatment');
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6 pb-10">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4">← Back</button>
        <h1 className="text-3xl font-black text-charcoal mb-4">Health Check for {pet.name}</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="ds-card p-5">
            <div className="text-6xl mb-3" aria-hidden>🩺</div>
            <div className="text-sm text-slate-600">Overall Health</div>
            <div className="text-3xl font-black">{overall}/100</div>
            <div className="mt-2 text-sm font-semibold">Status: <span className={`${status==='Healthy'?'text-emerald-600':status==='Minor Issue'?'text-amber-600':'text-red-600'}`}>{status}</span></div>
          </div>
          <div className="ds-card p-5">
            <h3 className="text-lg font-bold text-charcoal mb-2">Recommendations</h3>
            <ul className="list-disc pl-5 text-slate-700">
              {pet.stats.energy < 40 && <li>Let your pet rest to restore energy</li>}
              {pet.stats.hunger < 50 && <li>Feed your pet to improve nutrition</li>}
              {pet.stats.cleanliness < 60 && <li>Schedule a bath for better hygiene</li>}
              {pet.stats.happiness < 60 && <li>Play more to improve happiness</li>}
              {overall >= 80 && <li>Keep up the current care routine</li>}
            </ul>
          </div>
        </div>
        <div className="ds-card p-5 mt-6">
          <h3 className="text-lg font-bold text-charcoal mb-3">Treatment Options</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <button onClick={() => handleTreatment('checkup')} className="p-4 rounded-pet border border-slate-200 bg-white text-left hover:shadow-lg">
              <div className="font-bold">Basic Checkup</div>
              <div className="text-slate-600 text-sm">$25 - Diagnosis only</div>
            </button>
            <button onClick={() => handleTreatment('medicine')} className="p-4 rounded-pet border border-slate-200 bg-white text-left hover:shadow-lg">
              <div className="font-bold">Medicine</div>
              <div className="text-slate-600 text-sm">$40 - Cure minor illness</div>
            </button>
            <button onClick={() => handleTreatment('full')} className="p-4 rounded-pet border border-slate-200 bg-white text-left hover:shadow-lg">
              <div className="font-bold">Full Treatment</div>
              <div className="text-slate-600 text-sm">$75 - Cure serious illness</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthCheckScreen;


