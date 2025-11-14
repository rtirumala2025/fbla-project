import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FAQ = [
  { q: 'What happens if my pet gets sick?', a: 'Use Health Check to diagnose and purchase treatment options.' },
  { q: 'How do I earn more money?', a: 'Complete chores and play mini-games in the Earn Money screen.' },
  { q: 'Can I change my pet\'s appearance?', a: 'Yes, visit the Shop for accessories and upgrades.' },
];

export const HelpScreen: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="min-h-screen px-6 pb-10">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4">← Back</button>
        <h1 className="text-3xl font-black text-charcoal mb-4">Help & Instructions</h1>
        <section className="ds-card p-4 mb-6">
          <h2 className="text-lg font-bold mb-2">How to Play</h2>
          <ol className="list-decimal pl-5 text-slate-700 space-y-1">
            <li>Create your pet and give it a name.</li>
            <li>Keep stats healthy by feeding, cleaning, playing, and resting.</li>
            <li>Earn money with chores and mini-games; spend wisely.</li>
            <li>Track your budget in the Budget Manager.</li>
          </ol>
        </section>
        <section className="ds-card p-4">
          <h2 className="text-lg font-bold mb-2">FAQ</h2>
          <div>
            {FAQ.map((f, i) => (
              <div key={i} className="border-t first:border-t-0 border-slate-200">
                <button className="w-full text-left py-3 font-semibold" aria-expanded={open===i} onClick={() => setOpen(prev => prev===i?null:i)}>{f.q}</button>
                {open===i && <div className="pb-3 text-slate-700">{f.a}</div>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpScreen;


