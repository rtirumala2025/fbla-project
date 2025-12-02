/**
 * QuestCard Component
 * Displays individual quest card with progress and completion
 */
import { motion } from 'framer-motion';
import { Flame, Sparkles, Trophy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { Quest } from '../../types/quests';
import ProgressBar from '../ui/ProgressBar';
import { RewardClaimAnimation } from './RewardClaimAnimation';
import { claimQuestReward } from '../../api/quests';
import { useToast } from '../../contexts/ToastContext';

interface QuestCardProps {
  quest: Quest;
  onComplete: (quest: Quest) => void;
  isProcessing?: boolean;
  onClaimReward?: (quest: Quest) => void;
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

export const QuestCard = ({ quest, onComplete, isProcessing = false, onClaimReward }: QuestCardProps) => {
  const completionPercent = Math.min(100, Math.round((quest.progress / quest.target_value) * 100));
  const canComplete = quest.status === 'pending' || quest.status === 'in_progress';
  const canClaim = quest.status === 'completed';
  const isClaimed = quest.status === 'claimed';
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { success, error } = useToast();

  const handleClaimReward = async () => {
    if (!canClaim || isClaiming) return;
    
    setIsClaiming(true);
    try {
      const response = await claimQuestReward(quest.id);
      setShowRewardAnimation(true);
      onClaimReward?.(response.result.quest);
      success(response.result.message || 'Rewards claimed successfully!');
    } catch (err) {
      console.error('Failed to claim reward', err);
      error('Unable to claim rewards. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

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

        {canComplete ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: !isProcessing ? 1.02 : 1 }}
            disabled={isProcessing}
            onClick={() => onComplete(quest)}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              !isProcessing
                ? 'bg-indigo-600 text-white shadow hover:bg-indigo-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Complete Quest'}
          </motion.button>
        ) : canClaim ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: !isClaiming ? 1.02 : 1 }}
            disabled={isClaiming}
            onClick={handleClaimReward}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              !isClaiming
                ? 'bg-emerald-600 text-white shadow hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isClaiming ? 'Claiming...' : (
              <>
                <Sparkles className="h-4 w-4" />
                Claim Rewards
              </>
            )}
          </motion.button>
        ) : isClaimed ? (
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Reward Claimed
          </div>
        ) : null}
      </div>
      
      <RewardClaimAnimation
        coins={quest.rewards.coins}
        xp={quest.rewards.xp}
        isVisible={showRewardAnimation}
        onComplete={() => setShowRewardAnimation(false)}
      />
    </motion.div>
  );
};

export default QuestCard;

