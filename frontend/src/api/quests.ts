/**
 * API client for quest system and coach features
 * Handles fetching active quests, completing quests, and getting coach advice
 */
import { apiRequest } from './httpClient';
import type { ActiveQuestsResponse, CoachAdviceResponse, QuestCompletionResponse, Quest } from '../types/quests';

const useMock = process.env.REACT_APP_USE_MOCK === 'true';

// Generate mock active quests
function generateMockActiveQuests(): ActiveQuestsResponse {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    daily: [
      {
        id: 'daily-1',
        quest_key: 'feed_pet_3_times',
        description: 'Feed your pet 3 times today',
        quest_type: 'daily',
        difficulty: 'easy',
        rewards: { coins: 25, xp: 50, items: [] },
        target_value: 3,
        icon: '🍖',
        start_at: now.toISOString(),
        end_at: tomorrow.toISOString(),
        progress: 1,
        status: 'in_progress',
      },
      {
        id: 'daily-2',
        quest_key: 'play_minigame',
        description: 'Play any mini-game once',
        quest_type: 'daily',
        difficulty: 'easy',
        rewards: { coins: 30, xp: 40, items: [] },
        target_value: 1,
        icon: '🎮',
        start_at: now.toISOString(),
        end_at: tomorrow.toISOString(),
        progress: 0,
        status: 'pending',
      },
    ],
    weekly: [
      {
        id: 'weekly-1',
        quest_key: 'complete_10_quests',
        description: 'Complete 10 quests this week',
        quest_type: 'weekly',
        difficulty: 'normal',
        rewards: { coins: 150, xp: 300, items: ['premium_food'] },
        target_value: 10,
        icon: '⭐',
        start_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 4,
        status: 'in_progress',
      },
    ],
    event: [],
    refreshed_at: now.toISOString(),
  };
}

// Generate mock coach advice
function generateMockCoachAdvice(): CoachAdviceResponse {
  return {
    mood: 'encouraging',
    difficulty_hint: 'normal',
    summary: 'You\'re making great progress! Keep up the consistent care routine.',
    suggestions: [
      {
        category: 'care',
        recommendation: 'Your pet\'s happiness is improving. Try playing a mini-game to boost it even more!',
      },
      {
        category: 'quest',
        recommendation: 'Focus on completing daily quests first - they give great rewards and reset every day.',
      },
      {
        category: 'activity',
        recommendation: 'Remember to feed your pet regularly to maintain good health stats.',
      },
    ],
    generated_at: new Date().toISOString(),
    source: 'heuristic',
  };
}

export async function fetchActiveQuests(): Promise<ActiveQuestsResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockActiveQuests();
  }

  try {
    return await apiRequest<ActiveQuestsResponse>('/api/quests');
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Quests API unavailable, using mock data', error);
    return generateMockActiveQuests();
  }
}

export async function completeQuest(questId: string): Promise<QuestCompletionResponse> {
  return apiRequest<QuestCompletionResponse>('/api/quests/complete', {
    method: 'POST',
    body: JSON.stringify({ quest_id: questId }),
  });
}

export async function fetchCoachAdvice(): Promise<CoachAdviceResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockCoachAdvice();
  }

  try {
    return await apiRequest<CoachAdviceResponse>('/api/coach');
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Coach API unavailable, using mock data', error);
    return generateMockCoachAdvice();
  }
}

