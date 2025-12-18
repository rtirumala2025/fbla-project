/**
 * API client for quest system and coach features
 * Handles fetching active quests, completing quests, and getting coach advice
 * Uses Supabase directly for all quest data
 */
import { apiRequest } from './httpClient';
import { supabase, isSupabaseMock } from '../lib/supabase';
import { cachedRequest } from '../utils/requestCache';
import type { ActiveQuestsResponse, CoachAdviceResponse, QuestCompletionResponse, Quest } from '../types/quests';

async function fetchActiveQuestsFromSupabase(): Promise<ActiveQuestsResponse> {
  if (isSupabaseMock()) {
    throw new Error('Supabase is not configured');
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;
  const now = new Date();

  // Fetch all quests of type daily, weekly, or event
  const { data: allQuests, error: questsError } = await supabase
    .from('quests')
    .select('*')
    .in('quest_type', ['daily', 'weekly', 'event']);

  if (questsError) {
    throw questsError;
  }

  // Filter quests that are currently active (no start/end date OR within date range)
  const activeQuests = (allQuests || []).filter((quest) => {
    const startAt = quest.start_at ? new Date(quest.start_at) : null;
    const endAt = quest.end_at ? new Date(quest.end_at) : null;
    
    // Quest is active if:
    // - No start date OR start date is in the past
    // - AND no end date OR end date is in the future
    const isStarted = !startAt || startAt <= now;
    const isNotEnded = !endAt || endAt >= now;
    
    return isStarted && isNotEnded;
  });

  // Fetch user progress for all quests
  const { data: userQuests, error: userQuestsError } = await supabase
    .from('user_quests')
    .select('*')
    .eq('user_id', userId);

  if (userQuestsError) {
    throw userQuestsError;
  }

  // Build map of quest_id -> user quest progress
  const userQuestMap = new Map<string, any>();
  (userQuests || []).forEach((uq: any) => {
    userQuestMap.set(uq.quest_id, {
      progress: uq.progress,
      status: uq.status,
      target_value: uq.target_value,
    });
  });

  // Convert to Quest format
  const quests: Quest[] = activeQuests.map((quest) => {
    const userQuest = userQuestMap.get(quest.id);
    const rewards = typeof quest.rewards === 'object' ? quest.rewards : { coins: 0, xp: 0, items: [] };
    
    return {
      id: quest.id,
      quest_key: quest.quest_key,
      description: quest.description,
      quest_type: quest.quest_type as 'daily' | 'weekly' | 'event',
      difficulty: quest.difficulty as 'easy' | 'normal' | 'hard' | 'heroic',
      rewards: {
        coins: rewards.coins || 0,
        xp: rewards.xp || 0,
        items: rewards.items || [],
      },
      target_value: quest.target_value,
      icon: quest.icon,
      start_at: quest.start_at,
      end_at: quest.end_at,
      progress: userQuest?.progress || 0,
      status: userQuest?.status || 'pending',
    };
  });

  // Group by quest type
  const daily = quests.filter(q => q.quest_type === 'daily');
  const weekly = quests.filter(q => q.quest_type === 'weekly');
  const event = quests.filter(q => q.quest_type === 'event');

  return {
    daily,
    weekly,
    event,
    refreshed_at: new Date().toISOString(),
  };
}

export async function fetchActiveQuests(): Promise<ActiveQuestsResponse> {
  return cachedRequest(
    'active-quests',
    async () => {
      try {
        return await fetchActiveQuestsFromSupabase();
      } catch (error) {
        // Try backend API as fallback
        try {
          return await apiRequest<ActiveQuestsResponse>('/api/quests');
        } catch (apiError) {
          throw new Error('Failed to load quests. Please ensure you are logged in and try again.');
        }
      }
    },
    30000 // Cache for 30 seconds
  );
}

export async function completeQuest(questId: string): Promise<QuestCompletionResponse> {
  return apiRequest<QuestCompletionResponse>('/api/quests/complete', {
    method: 'POST',
    body: JSON.stringify({ quest_id: questId }),
  });
}

export async function claimQuestReward(questId: string): Promise<import('../types/quests').QuestClaimResponse> {
  return apiRequest<import('../types/quests').QuestClaimResponse>('/api/quests/claim-reward', {
    method: 'POST',
    body: JSON.stringify({ quest_id: questId }),
  });
}

export async function fetchDailyQuests(): Promise<import('../types/quests').ActiveQuestsResponse> {
  return cachedRequest(
    'daily-quests',
    async () => {
      try {
        const response = await apiRequest<{ daily: Quest[]; refreshed_at: string; next_reset_at?: string }>('/api/quests/daily');
        // Convert to ActiveQuestsResponse format
        return {
          daily: response.daily,
          weekly: [],
          event: [],
          refreshed_at: response.refreshed_at,
        };
      } catch (error) {
        // Fallback to full quest list
        return await fetchActiveQuests();
      }
    },
    30000 // Cache for 30 seconds
  );
}

export async function fetchCoachAdvice(): Promise<CoachAdviceResponse> {
  // Coach endpoint not available - return basic advice gracefully
  // This feature can be implemented later if needed
  console.warn('Coach endpoint not available, returning basic advice');
  return {
    mood: 'happy',
    difficulty_hint: 'normal',
    summary: 'Keep taking good care of your pet! Remember to feed, play, and bathe regularly.',
    suggestions: [
      { category: 'care', recommendation: 'Check your pet\'s stats daily' },
      { category: 'quest', recommendation: 'Complete quests to earn rewards' },
      { category: 'activity', recommendation: 'Save coins for special items' },
      { category: 'motivation', recommendation: 'You\'re doing great! Keep up the excellent pet care!' },
    ],
    generated_at: new Date().toISOString(),
    source: 'heuristic',
  };
}

