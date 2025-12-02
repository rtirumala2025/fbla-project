/**
 * DailyChallenge Component
 * Focused UI for daily challenges with countdown timer
 */
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Sparkles } from 'lucide-react';
import { fetchDailyQuests, claimQuestReward, completeQuest } from '../../api/quests';
import type { Quest } from '../../types/quests';
import { QuestCard } from '../../components/quests/QuestCard';
import { useToast } from '../../contexts/ToastContext';
import { useOfflineCache } from '../../hooks/useOfflineCache';

interface DailyChallengeProps {
  onQuestComplete?: () => void;
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onQuestComplete }) => {
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [nextResetAt, setNextResetAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingQuestId, setProcessingQuestId] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const { cached } = useOfflineCache<{ daily: Quest[]; refreshed_at: string; next_reset_at?: string }>({
    key: 'virtual-pet.daily-quests',
    data: dailyQuests.length > 0 ? { daily: dailyQuests, refreshed_at: new Date().toISOString(), next_reset_at: nextResetAt?.toISOString() } : null,
  });
  const { success, error } = useToast();

  const loadDailyQuests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchDailyQuests();
      setDailyQuests(response.daily);
      // Parse next reset time if available
      if ('next_reset_at' in response && response.next_reset_at && typeof response.next_reset_at === 'string') {
        setNextResetAt(new Date(response.next_reset_at));
      } else {
        // Calculate next reset (midnight UTC)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        setNextResetAt(tomorrow);
      }
    } catch (err) {
      console.error('Failed to load daily quests', err);
      if (cached?.daily) {
        setDailyQuests(cached.daily);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cached]);

  useEffect(() => {
    void loadDailyQuests();
  }, [loadDailyQuests]);

  // Update countdown timer
  useEffect(() => {
    if (!nextResetAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = nextResetAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilReset('Resetting now...');
        void loadDailyQuests(); // Refresh when reset occurs
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextResetAt, loadDailyQuests]);

  const handleComplete = useCallback(
    async (quest: Quest) => {
      setProcessingQuestId(quest.id);
      try {
        const response = await completeQuest(quest.id);
        const updatedQuest = response.result.quest;
        
        setDailyQuests((current) =>
          current.map((q) => (q.id === updatedQuest.id ? updatedQuest : q))
        );
        
        success(`Quest complete! +${response.result.coins_awarded} coins, +${response.result.xp_awarded} XP.`);
        onQuestComplete?.();
      } catch (err) {
        console.error('Quest completion failed', err);
        error('Unable to complete the quest. Please try again.');
      } finally {
        setProcessingQuestId(null);
      }
    },
    [error, onQuestComplete, success]
  );

  const handleClaimReward = useCallback(
    async (quest: Quest) => {
      setDailyQuests((current) =>
        current.map((q) => (q.id === quest.id ? quest : q))
      );
      onQuestComplete?.();
    },
    [onQuestComplete]
  );

  const completedCount = dailyQuests.filter((q) => q.status === 'completed' || q.status === 'claimed').length;
  const totalCount = dailyQuests.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white shadow-lg"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
                <Flame className="h-8 w-8" />
                Daily Challenges
              </h1>
              <p className="text-orange-50">
                Complete daily tasks to earn rewards and keep your pet happy!
              </p>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              {timeUntilReset && (
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-semibold">Reset in: {timeUntilReset}</span>
                </div>
              )}
              {totalCount > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    {completedCount}/{totalCount} completed
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
          </div>
        ) : dailyQuests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl border border-dashed border-orange-200 bg-white p-12 text-center"
          >
            <p className="text-lg text-gray-500">No daily challenges available. Check back later!</p>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dailyQuests.map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <QuestCard
                  quest={quest}
                  onComplete={handleComplete}
                  isProcessing={processingQuestId === quest.id}
                  onClaimReward={handleClaimReward}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyChallenge;
