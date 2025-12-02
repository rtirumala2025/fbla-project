import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { completeQuest, fetchActiveQuests, fetchCoachAdvice } from '../../api/quests';
import type { ActiveQuestsResponse, CoachAdviceResponse, Quest } from '../../types/quests';
import { useOfflineCache } from '../../hooks/useOfflineCache';
import { useToast } from '../../contexts/ToastContext';
import { useCoachRealtime } from '../../hooks/useCoachRealtime';
import { useAuth } from '../../contexts/AuthContext';
import { QuestBoard } from '../../components/quests/QuestBoard';
import { CoachPanel } from '../../components/coach/CoachPanel';

const emptyResponse: ActiveQuestsResponse = {
  daily: [],
  weekly: [],
  event: [],
  refreshed_at: new Date(0).toISOString(),
};

export const QuestDashboard = () => {
  const { currentUser } = useAuth();
  const [quests, setQuests] = useState<ActiveQuestsResponse | null>(null);
  const [coachAdvice, setCoachAdvice] = useState<CoachAdviceResponse | null>(null);
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [processingQuestId, setProcessingQuestId] = useState<string | null>(null);
  const { cached, offline } = useOfflineCache<ActiveQuestsResponse>({
    key: 'virtual-pet.quests',
    data: quests,
  });
  const { success, error, info } = useToast();

  const resolvedQuests = useMemo(() => quests ?? cached ?? emptyResponse, [quests, cached]);

  const loadQuests = useCallback(async () => {
    setIsLoadingQuests(true);
    try {
      const response = await fetchActiveQuests();
      setQuests(response);
      if (offline) {
        info('Reconnected: synced quests from the server.');
      }
    } catch (err) {
      console.error('Failed to load quests', err);
      // Don't show toast - API will fallback to mock data automatically
      // Only show info if we have cached data
      if (!quests && cached) {
        info('Offline: showing cached quests.');
      }
    } finally {
      setIsLoadingQuests(false);
    }
  }, [cached, info, offline, quests]);

  const loadCoachAdvice = useCallback(async () => {
    setIsLoadingCoach(true);
    try {
      const advice = await fetchCoachAdvice();
      setCoachAdvice(advice);
    } catch (err) {
      console.error('Failed to fetch coach advice', err);
      // Don't show toast - API will fallback to mock data automatically
    } finally {
      setIsLoadingCoach(false);
    }
  }, []);

  useEffect(() => {
    void loadQuests();
    void loadCoachAdvice();
  }, [loadQuests, loadCoachAdvice]);

  // Subscribe to real-time pet stats changes for Coach Panel
  useCoachRealtime(loadCoachAdvice, currentUser?.uid);

  const handleComplete = useCallback(
    async (quest: Quest) => {
      setProcessingQuestId(quest.id);
      try {
        const response = await completeQuest(quest.id);
        const updatedQuest = response.result.quest;
        const coinsAwarded = response.result.coins_awarded || 0;
        const xpAwarded = response.result.xp_awarded || 0;
        
        // Update local quest state
        setQuests((current) => {
          const source = current ?? cached ?? emptyResponse;
          const updateCategory = (list: Quest[]) =>
            list.map((item) => (item.id === updatedQuest.id ? updatedQuest : item));
          return {
            daily: updateCategory(source.daily),
            weekly: updateCategory(source.weekly),
            event: updateCategory(source.event),
            refreshed_at: new Date().toISOString(),
          };
        });
        
        // Sync with global store
        const { useAppStore } = await import('../../store/useAppStore');
        useAppStore.getState().completeQuest(quest.id, coinsAwarded, xpAwarded);
        
        // Apply pet XP rewards if pet exists (via API call since we're in callback)
        if (xpAwarded > 0 && currentUser?.uid) {
          try {
            const { apiRequest } = await import('../../api/httpClient');
            await apiRequest('/api/pets/apply-quest-rewards', {
              method: 'POST',
              body: JSON.stringify({
                xp_reward: xpAwarded,
              }),
            });
            // Note: Pet stats will be refreshed on next page load or manual refresh
          } catch (petError) {
            console.warn('Failed to apply pet XP reward:', petError);
            // Non-critical, continue with quest completion
          }
        }
        
        // Refresh FinancialContext if it exists
        try {
          const { profileService } = await import('../../services/profileService');
          const { useAuth } = await import('../../contexts/AuthContext');
          // Note: useAuth is a hook and can't be called here, so we'll skip profile refresh
          // The profile will be refreshed on next component mount
        } catch (refreshError) {
          console.warn('Failed to refresh profile after quest completion:', refreshError);
        }
        
        success(`Quest complete! +${coinsAwarded} coins, +${xpAwarded} XP.`);
      } catch (err) {
        console.error('Quest completion failed', err);
        error('Unable to complete the quest. Please try again.');
      } finally {
        setProcessingQuestId(null);
        void loadCoachAdvice();
      }
    },
    [cached, error, loadCoachAdvice, success],
  );

  const isEmpty =
    resolvedQuests.daily.length === 0 && resolvedQuests.weekly.length === 0 && resolvedQuests.event.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Sparkles className="h-6 w-6 text-indigo-500" />
              Quest Log
            </h1>
            <p className="text-sm text-slate-500">
              Track daily and weekly quests, then check in with your AI coach for adaptive guidance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadQuests}
              disabled={isLoadingQuests}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoadingQuests ? 'Syncing...' : 'Refresh Quests'}
            </button>
            {offline && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Offline mode</span>}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            {isEmpty ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500"
              >
                No active quests found. Check back soon for fresh challenges!
              </motion.div>
            ) : (
              <QuestBoard
                quests={{
                  daily: resolvedQuests.daily,
                  weekly: resolvedQuests.weekly,
                  event: resolvedQuests.event,
                }}
                onComplete={handleComplete}
                isProcessingId={processingQuestId}
                onClaimReward={(quest) => {
                  setQuests((current) => {
                    const source = current ?? cached ?? emptyResponse;
                    const updateCategory = (list: Quest[]) =>
                      list.map((item) => (item.id === quest.id ? quest : item));
                    return {
                      daily: updateCategory(source.daily),
                      weekly: updateCategory(source.weekly),
                      event: updateCategory(source.event),
                      refreshed_at: new Date().toISOString(),
                    };
                  });
                }}
              />
            )}
          </div>
          <CoachPanel advice={coachAdvice} isLoading={isLoadingCoach} onRefresh={loadCoachAdvice} />
        </div>
      </div>
    </div>
  );
};

export default QuestDashboard;


