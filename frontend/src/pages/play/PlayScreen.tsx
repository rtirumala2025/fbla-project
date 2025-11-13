import React from 'react';
import { useNavigate } from 'react-router-dom';

import { usePet } from '../../context/PetContext';

type Activity = { id: string; name: string; cost: number; energyCost: number; benefits: string; emoji: string; path?: string };

const ACTIVITIES: Activity[] = [
  { id: 'free', name: 'Free Play', cost: 0, energyCost: 15, benefits: '+10 happiness', emoji: '🎈', path: '/minigames/reaction' },
  { id: 'fetch', name: 'Fetch', cost: 5, energyCost: 20, benefits: '+20 happiness', emoji: '🎾', path: '/minigames/fetch' },
  { id: 'puzzle', name: 'Puzzle Toy', cost: 10, energyCost: 10, benefits: '+25 happiness, +5 intelligence', emoji: '🧩', path: '/minigames/puzzle' },
  { id: 'adventure', name: 'Outdoor Adventure', cost: 15, energyCost: 30, benefits: '+35 happiness, +5 health', emoji: '⛺', path: '/minigames/dream' },
];

const moodGradients: Record<string, string> = {
  happy: 'from-amber-100 via-emerald-50 to-slate-50',
  excited: 'from-rose-100 via-orange-50 to-yellow-50',
  neutral: 'from-slate-100 via-white to-slate-50',
  tired: 'from-slate-900 via-slate-800 to-indigo-900 text-white',
  relaxed: 'from-emerald-100 via-teal-50 to-white',
  curious: 'from-sky-100 via-indigo-50 to-white',
  playful: 'from-fuchsia-100 via-purple-50 to-white',
  calm: 'from-blue-100 via-slate-50 to-white',
};

export const PlayScreen: React.FC = () => {
  const navigate = useNavigate();
  const { pet } = usePet();

  const petMood = pet?.stats?.mood?.toLowerCase() ?? 'neutral';
  const gradient = moodGradients[petMood] ?? moodGradients.neutral;
  const isDark = gradient.includes('text-white');

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient.replace(' text-white', '')} pt-20 px-6 pb-10 ${isDark ? 'text-white' : 'text-charcoal'}`}>
      <div className="max-w-5xl mx-auto">
        <button className="mb-4 text-sm font-semibold flex items-center gap-1" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black mb-1">Play with your pet</h1>
            <p className="text-sm opacity-80">Pick an activity. Some launch mini-games.</p>
          </div>
          {pet && (
            <div className={`rounded-2xl px-4 py-2 text-sm font-semibold ${isDark ? 'bg-white/10' : 'bg-white/70 text-charcoal'} shadow`}> 
              Mood: <span className="capitalize">{petMood}</span>
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {ACTIVITIES.map((activity) => (
            <button
              key={activity.id}
              onClick={() => activity.path && navigate(activity.path)}
              className={`p-4 text-left rounded-pet border transition ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white border-slate-200 hover:shadow-lg'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl" aria-hidden>
                  {activity.emoji}
                </div>
                <div className="font-bold">{activity.cost === 0 ? 'FREE' : `$${activity.cost}`}</div>
              </div>
              <div className="font-semibold">{activity.name}</div>
              <div className="text-sm opacity-80">Energy: -{activity.energyCost}</div>
              <div className="text-sm opacity-80">Benefits: {activity.benefits}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayScreen;


