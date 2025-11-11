import React, { useEffect, useState } from 'react';
import { minigameService, type GameResult } from '../../services/minigameService';

type Props = { onComplete?: (result: GameResult) => void; difficulty?: 'easy'|'normal'|'hard' };

const symbols = ['🟦','🟥','🟨','🟩'];

export const DreamWorld: React.FC<Props> = ({ onComplete, difficulty='normal' }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [showing, setShowing] = useState(true);

  useEffect(() => {
    const first = [Math.floor(Math.random()*4)];
    setSequence(first);
    const t = setTimeout(() => setShowing(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const press = (i: number) => {
    if (showing) return;
    const next = [...input, i];
    setInput(next);
    if (sequence[next.length - 1] !== i) {
      const score = Math.max(10, Math.min(100, sequence.length * 20));
      const result = minigameService.computeRewards(score, difficulty);
      onComplete?.(result);
      return;
    }
    if (next.length === sequence.length) {
      const extended = [...sequence, Math.floor(Math.random()*4)];
      setSequence(extended);
      setInput([]);
      setShowing(true);
      setTimeout(() => setShowing(false), 800);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6 pb-10">
      <div className="max-w-sm mx-auto ds-card p-4 text-center">
        <div className="mb-2">Repeat the sequence</div>
        <div className="grid grid-cols-2 gap-3">
          {symbols.map((s, i) => (
            <button key={i} onClick={() => press(i)} className={`h-24 rounded-pet text-3xl ${showing && sequence[0]===i?'ring-4 ring-primary':''}`}>{s}</button>
          ))}
        </div>
        <div className="mt-3 text-slate-600">Length: {sequence.length}</div>
        <button className="px-3 py-2 rounded-pet border border-slate-300 mt-4" onClick={() => onComplete?.({ score: 0, coinsEarned: 0, happinessGain: 0 })}>Skip for demo</button>
      </div>
    </div>
  );
};

export default DreamWorld;


