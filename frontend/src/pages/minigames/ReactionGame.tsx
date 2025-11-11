import React, { useEffect, useRef, useState } from 'react';
import { minigameService, type GameResult } from '../../services/minigameService';

type Props = { onComplete?: (result: GameResult) => void; difficulty?: 'easy'|'normal'|'hard' };

export const ReactionGame: React.FC<Props> = ({ onComplete, difficulty='normal' }) => {
  const [waiting, setWaiting] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [reaction, setReaction] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const delay = 1000 + Math.random() * 2000;
    timeoutRef.current = window.setTimeout(() => {
      setWaiting(false);
      setStartTime(performance.now());
    }, delay);
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, []);

  const onClick = () => {
    if (waiting) return; // clicked too early: ignore for simplicity
    if (startTime) {
      const r = performance.now() - startTime;
      setReaction(r);
      const score = Math.max(10, 100 - Math.min(300, r) / 3); // faster => higher score
      const result = minigameService.computeRewards(score, difficulty);
      onComplete?.(result);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6 pb-10">
      <div className="max-w-xl mx-auto ds-card p-6 text-center">
        <div className="text-lg mb-2">Click when the screen turns green</div>
        <button
          className={`w-full h-64 rounded-pet ${waiting?'bg-amber-300':'bg-emerald-400'} focus:outline-none focus:ring-2 focus:ring-primary`}
          onClick={onClick}
          aria-label="Reaction area"
        />
        {reaction !== null && <div className="mt-3">Reaction: {Math.round(reaction)} ms</div>}
        <button className="px-3 py-2 rounded-pet border border-slate-300 mt-4" onClick={() => onComplete?.({ score: 0, coinsEarned: 0, happinessGain: 0 })}>Skip for demo</button>
      </div>
    </div>
  );
};

export default ReactionGame;


