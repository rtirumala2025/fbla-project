import { motion } from 'framer-motion';
import React from 'react';

import type { GamePlayResponse } from '../../types/game';

type Props = {
  result: GamePlayResponse | null;
  onClose: () => void;
};

export const GameResultOverlay: React.FC<Props> = ({ result, onClose }) => {
  if (!result) return null;

  const { reward, message } = result;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-emerald-700">🎉 Rewards Earned!</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        <div className="mt-4 space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide">Coins</span>
            <span className="text-lg font-bold text-emerald-700">+{reward.coins}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide">Happiness</span>
            <span className="text-lg font-bold text-emerald-700">+{reward.happiness}</span>
          </div>
          {reward.streak_bonus > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold uppercase tracking-wide">Streak Bonus</span>
              <span className="font-semibold text-emerald-700">+{reward.streak_bonus}</span>
            </div>
          )}
          {reward.achievement_unlocked && (
            <div className="rounded-xl bg-white/80 p-3 text-center text-sm font-semibold text-amber-600">
              🌟 Achievement unlocked: {reward.achievement_unlocked.replace('_', ' ')}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600"
        >
          Keep Playing
        </button>
      </motion.div>
    </div>
  );
};

export default GameResultOverlay;

