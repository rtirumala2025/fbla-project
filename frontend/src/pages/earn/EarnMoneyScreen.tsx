import React, { useEffect, useState } from 'react';
import { earnService, type Chore } from '../../services/earnService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

type Tab = 'chores' | 'minigames' | 'achievements';

export const EarnMoneyScreen: React.FC = () => {
  const [tab, setTab] = useState<Tab>('chores');
  const [chores, setChores] = useState<Chore[]>([]);
  const { currentUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    earnService.listChores().then(setChores);
  }, []);

  const handleChore = async (choreId: string) => {
    if (!currentUser) return;
    const cd = earnService.getChoreCooldown(currentUser.uid, choreId);
    if (cd > 0) return toast.error(`Chore on cooldown: ${cd}s remaining`);
    const res = await earnService.completeChore(currentUser.uid, choreId);
    toast.success(`Great job! You earned $${res.reward}!`);
  };

  return (
    <div className="min-h-screen px-6 pb-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-charcoal mb-4">Earn Money</h1>
        <div className="flex gap-2 mb-6" role="tablist" aria-label="Earn Tabs">
          {(['chores','minigames','achievements'] as Tab[]).map(t => (
            <button key={t} role="tab" aria-selected={tab===t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-pet text-sm font-semibold ${tab===t?'bg-primary text-white':'bg-white border border-slate-300'}`}>{t}</button>
          ))}
        </div>

        {tab === 'chores' && (
          <div className="grid md:grid-cols-3 gap-4">
            {chores.map(c => {
              const cd = currentUser ? earnService.getChoreCooldown(currentUser.uid, c.id) : 0;
              return (
                <div key={c.id} className="ds-card p-4">
                  <div className="text-lg font-bold mb-1">{c.name}</div>
                  <div className="text-slate-600 text-sm mb-2">Earn: ${c.reward} · Time: {c.timeSeconds}s · {c.difficulty}</div>
                  <button onClick={() => handleChore(c.id)} disabled={cd>0} className="btn-primary disabled:opacity-50">{cd>0?`Cooldown ${cd}s`:'Start Chore'}</button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'minigames' && (
          <div className="grid md:grid-cols-3 gap-4">
            <a href="/minigames/fetch" className="ds-card p-4 block hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"><div className="font-bold">Fetch</div><div className="text-sm text-slate-600">Clicker game · Reward scales</div></a>
            <a href="/minigames/puzzle" className="ds-card p-4 block hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"><div className="font-bold">Puzzle</div><div className="text-sm text-slate-600">3x3 match</div></a>
            <a href="/minigames/reaction" className="ds-card p-4 block hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"><div className="font-bold">Reaction</div><div className="text-sm text-slate-600">Speed test</div></a>
          </div>
        )}

        {tab === 'achievements' && (
          <div className="ds-card p-4">
            <div className="font-semibold">Achievements will unlock as you complete chores and games.</div>
            <ul className="list-disc pl-5 text-slate-700 mt-2">
              <li>First Week Complete — $50</li>
              <li>Perfect Health Week — $75</li>
              <li>Budget Master — $100</li>
              <li>Pet Happiness 100% — $60</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarnMoneyScreen;


