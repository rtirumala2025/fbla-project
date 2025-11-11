import React, { useState } from 'react';
import { minigameService, type GameResult } from '../../services/minigameService';

type Props = { onComplete?: (result: GameResult) => void; difficulty?: 'easy' | 'normal' | 'hard' };

const tiles = ['🐶','🐱','🐰','🐦','🐶','🐱','🐰','🐦','⭐'];

export const PuzzleGame: React.FC<Props> = ({ onComplete, difficulty='normal' }) => {
  const [shuffled, setShuffled] = useState(() => [...tiles].sort(() => Math.random() - 0.5));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);

  const onSelect = (i: number) => {
    if (selectedIndex === null) setSelectedIndex(i);
    else {
      const copy = [...shuffled];
      [copy[selectedIndex], copy[i]] = [copy[i], copy[selectedIndex]];
      setShuffled(copy);
      setSelectedIndex(null);
      setMoves(m => m + 1);
      if (isSolved(copy)) done(moves + 1);
    }
  };

  const isSolved = (arr: string[]) => JSON.stringify(arr) === JSON.stringify(tiles);

  const done = (m: number) => {
    const score = Math.max(10, 100 - m * 10);
    const result = minigameService.computeRewards(score, difficulty);
    onComplete?.(result);
  };

  return (
    <div className="min-h-screen pt-20 px-6 pb-10">
      <div className="max-w-md mx-auto ds-card p-4">
        <div className="font-bold mb-2">Moves: {moves}</div>
        <div className="grid grid-cols-3 gap-2">
          {shuffled.map((t, i) => (
            <button key={i} onClick={() => onSelect(i)} className={`h-20 rounded-pet border ${selectedIndex===i?'border-primary':'border-slate-200'} bg-white text-2xl`} aria-label={`Tile ${i+1}`}>{t}</button>
          ))}
        </div>
        <button className="px-3 py-2 rounded-pet border border-slate-300 mt-4" onClick={() => onComplete?.({ score: 0, coinsEarned: 0, happinessGain: 0 })}>Skip for demo</button>
      </div>
    </div>
  );
};

export default PuzzleGame;


