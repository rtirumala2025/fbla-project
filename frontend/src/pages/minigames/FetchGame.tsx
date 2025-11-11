import React, { useRef, useState } from 'react';
import { minigameService, type GameResult } from '../../services/minigameService';

type Props = {
  onComplete?: (result: GameResult) => void;
  difficulty?: 'easy' | 'normal' | 'hard';
};

export const FetchGame: React.FC<Props> = ({ onComplete, difficulty='normal' }) => {
  const [round, setRound] = useState(1);
  const [hits, setHits] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const randomize = () => {
    const w = containerRef.current?.clientWidth || 300;
    const h = containerRef.current?.clientHeight || 300;
    setTargetPos({ x: Math.random() * (w - 40) + 20, y: Math.random() * (h - 40) + 20 });
  };

  const throwBall = () => {
    randomize();
  };

  const onCatch = () => {
    setHits(h => h + 1);
    if (round >= 3) {
      const score = Math.min(100, hits * 33 + 34);
      const result = minigameService.computeRewards(score, difficulty);
      onComplete?.(result);
    } else {
      setRound(r => r + 1);
      randomize();
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6 pb-10">
      <div className="max-w-3xl mx-auto ds-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">Round {round} / 3</div>
          <div className="font-bold">Hits: {hits}</div>
        </div>
        <div ref={containerRef} className="relative h-72 bg-cream rounded-pet overflow-hidden border border-slate-200">
          <button
            onClick={onCatch}
            className="absolute w-10 h-10 bg-primary text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Catch the ball"
            style={{ transform: `translate(${targetPos.x}px, ${targetPos.y}px)` }}
          >⚽</button>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn-primary" onClick={throwBall}>Throw</button>
          <button className="px-3 py-2 rounded-pet border border-slate-300" onClick={() => onComplete?.({ score: 0, coinsEarned: 0, happinessGain: 0 })}>Skip for demo</button>
        </div>
      </div>
    </div>
  );
};

export default FetchGame;


