/**
 * GameResultOverlay Component
 * Displays game result overlay with rewards
 */
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

  const handleClose = () => {
    // Scroll to top of game area when closing overlay
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border border-emerald-200 bg-white shadow-2xl my-auto"
      >
        <div className="p-6 overflow-y-auto flex-1">
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
        </div>

        <div className="p-6 pt-4 bg-white rounded-b-3xl border-t border-emerald-100 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600"
          >
            Keep Playing
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default GameResultOverlay;

