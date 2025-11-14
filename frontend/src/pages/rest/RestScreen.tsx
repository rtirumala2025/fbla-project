import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { usePet } from '../../context/PetContext';

const DURATIONS = [
  { id: 'nap', label: 'Quick Nap', seconds: 5, energyGain: 20 },
  { id: 'sleep', label: 'Good Sleep', seconds: 10, energyGain: 50 },
  { id: 'full', label: 'Full Rest', seconds: 15, energyGain: 100 },
];

export const RestScreen: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { pet, updatePetStats } = usePet();
  const [selected, setSelected] = useState(DURATIONS[0]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, []);

  const startRest = () => {
    setRemaining(selected.seconds);
    timerRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          completeRest();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    toast.info(`${pet?.name} is resting...`);
    // Navigate back while resting
    navigate('/dashboard');
  };

  const completeRest = async () => {
    if (!pet) return;
    await updatePetStats({ energy: Math.min(100, pet.stats.energy + selected.energyGain) });
    toast.success(`${pet.name} is refreshed and ready!`);
  };

  return (
    <div className="min-h-screen px-6 pb-10">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4">← Back</button>
        <h1 className="text-3xl font-black text-charcoal mb-2">Rest Time for {pet?.name}</h1>
        <p className="text-slate-600 mb-6">Select a duration. Rest happens in the background.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {DURATIONS.map(d => (
            <button key={d.id} onClick={() => setSelected(d)} className={`p-4 rounded-pet border ${selected.id===d.id?'border-primary':'border-slate-200'} bg-white shadow-soft`} aria-pressed={selected.id===d.id}>
              <div className="text-lg font-bold">{d.label}</div>
              <div className="text-sm text-slate-600">{d.seconds}s · +{d.energyGain} energy</div>
            </button>
          ))}
        </div>
        <div className="ds-card p-4 mt-6 flex items-center justify-end">
          <button onClick={startRest} className="btn-primary">Start Rest</button>
        </div>
        {remaining !== null && (
          <div className="mt-3 text-slate-700">Resting... {remaining}s remaining</div>
        )}
      </div>
    </div>
  );
};

export default RestScreen;


