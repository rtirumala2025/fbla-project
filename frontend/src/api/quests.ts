import { apiRequest } from './httpClient';
import type { ActiveQuestsResponse, CoachAdviceResponse, QuestCompletionResponse } from '../types/quests';

export async function fetchActiveQuests(): Promise<ActiveQuestsResponse> {
  return apiRequest<ActiveQuestsResponse>('/api/quests');
}

export async function completeQuest(questId: string): Promise<QuestCompletionResponse> {
  return apiRequest<QuestCompletionResponse>('/api/quests/complete', {
    method: 'POST',
    body: JSON.stringify({ quest_id: questId }),
  });
}

export async function fetchCoachAdvice(): Promise<CoachAdviceResponse> {
  return apiRequest<CoachAdviceResponse>('/api/coach');
}


