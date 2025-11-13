/**
 * QuestCard Component
 * Displays individual quest card with progress and completion
 */
import { motion } from 'framer-motion';
import { Flame, Sparkles, Trophy } from 'lucide-react';
import type { Quest } from '../../types/quests';
import ProgressBar from '../ui/ProgressBar';

interface QuestCardProps {
  quest: Quest;
  onComplete: (quest: Quest) => void;
  isProcessing?: boolean;
}

const difficultyAccent: Record<Quest['difficulty'], string> = {
  easy: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  normal: 'bg-sky-50 text-sky-600 border border-sky-200',
  hard: 'bg-amber-50 text-amber-600 border border-amber-200',
  heroic: 'bg-purple-50 text-purple-600 border border-purple-200',
};

const typeIcon: Record<Quest['quest_type'], JSX.Element> = {
  daily: <Flame className="h-4 w-4 text-emerald-500" />,
  weekly: <Trophy className="h-4 w-4 text-amber-500" />,
  event: <Sparkles className="h-4 w-4 text-indigo-500" />,
};

export const QuestCard = ({ quest, onComplete, isProcessing = false }: QuestCardProps) => {
  const completionPercent = Math.min(100, Math.round((quest.progress / quest.target_value) * 100));
  const canComplete = quest.status === 'pending' || quest.status === 'in_progress';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              {typeIcon[quest.quest_type]}
              {quest.quest_type} quest
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${difficultyAccent[quest.difficulty]}`}>
              {quest.difficulty}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900">{quest.description}</h3>
        </div>
        <div className="text-right text-sm font-semibold text-slate-500">
          <p>
            +{quest.rewards.coins} <span className="text-amber-500">coins</span>
          </p>
          <p>
            +{quest.rewards.xp} <span className="text-indigo-500">XP</span>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <ProgressBar
          value={completionPercent}
          label={`Progress (${quest.progress}/${quest.target_value})`}
          accessibleLabel={`Quest progress ${completionPercent} percent`}
        />

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: canComplete ? 1.02 : 1 }}
          disabled={!canComplete || isProcessing}
          onClick={() => onComplete(quest)}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            canComplete && !isProcessing
              ? 'bg-indigo-600 text-white shadow hover:bg-indigo-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? 'Processing...' : canComplete ? 'Complete Quest' : 'Reward Claimed'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default QuestCard;

