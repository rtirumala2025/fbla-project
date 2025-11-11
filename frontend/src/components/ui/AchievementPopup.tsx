import { AnimatePresence, motion } from 'framer-motion';
import { Award, X } from 'lucide-react';
import React from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  points?: number;
}

interface AchievementPopupProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onDismiss }) => {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed right-6 bottom-6 z-[55] max-w-sm rounded-3xl border border-amber-200 bg-white/95 p-5 text-amber-900 shadow-2xl backdrop-blur dark:border-amber-500/30 dark:bg-slate-900/90 dark:text-amber-200"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 220 }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow">
              <Award className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-500/90">Achievement unlocked</p>
              <h4 className="mt-1 text-lg font-semibold">{achievement.title}</h4>
              <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">{achievement.description}</p>
              {typeof achievement.points === 'number' && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                  +{achievement.points} xp
                </p>
              )}
            </div>
            <button
              onClick={onDismiss}
              className="rounded-full border border-transparent p-1 text-amber-500 transition hover:border-amber-200 hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-amber-200 dark:hover:text-amber-100"
              aria-label="Dismiss achievement notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-3xl border border-amber-300/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementPopup;

