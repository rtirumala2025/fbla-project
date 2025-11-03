import React from 'react';
import { useNavigate } from 'react-router-dom';

type Activity = { id: string; name: string; cost: number; energyCost: number; benefits: string; emoji: string; path?: string };

const ACTIVITIES: Activity[] = [
  { id: 'free', name: 'Free Play', cost: 0, energyCost: 15, benefits: '+10 happiness', emoji: '🎈', path: '/minigames/reaction' },
  { id: 'fetch', name: 'Fetch', cost: 5, energyCost: 20, benefits: '+20 happiness', emoji: '🎾', path: '/minigames/fetch' },
  { id: 'puzzle', name: 'Puzzle Toy', cost: 10, energyCost: 10, benefits: '+25 happiness, +5 intelligence', emoji: '🧩', path: '/minigames/puzzle' },
  { id: 'adventure', name: 'Outdoor Adventure', cost: 15, energyCost: 30, benefits: '+35 happiness, +5 health', emoji: '⛺', path: '/minigames/dream' },
];

export const PlayScreen: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pt-20 px-6 pb-10">
      <div className="max-w-5xl mx-auto">
        <button className="mb-4" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="text-3xl font-black text-charcoal mb-1">Play with your pet</h1>
        <p className="text-slate-600 mb-6">Pick an activity. Some launch mini-games.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACTIVITIES.map(a => (
            <button key={a.id} onClick={() => a.path && navigate(a.path)} className="p-4 text-left bg-white border border-slate-200 rounded-pet hover:shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl" aria-hidden>{a.emoji}</div>
                <div className="font-bold">{a.cost === 0 ? 'FREE' : `$${a.cost}`}</div>
              </div>
              <div className="font-semibold">{a.name}</div>
              <div className="text-sm text-slate-600">Energy: -{a.energyCost}</div>
              <div className="text-sm text-slate-600">Benefits: {a.benefits}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayScreen;


