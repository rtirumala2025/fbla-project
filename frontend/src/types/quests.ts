export type QuestType = 'daily' | 'weekly' | 'event';
export type QuestDifficulty = 'easy' | 'normal' | 'hard' | 'heroic';
export type QuestStatus = 'pending' | 'in_progress' | 'completed' | 'claimed';

export interface QuestReward {
  coins: number;
  xp: number;
  items: string[];
}

export interface Quest {
  id: string;
  quest_key: string;
  description: string;
  quest_type: QuestType;
  difficulty: QuestDifficulty;
  rewards: QuestReward;
  target_value: number;
  icon?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  progress: number;
  status: QuestStatus;
}

export interface ActiveQuestsResponse {
  daily: Quest[];
  weekly: Quest[];
  event: Quest[];
  refreshed_at: string;
}

export interface QuestCompletionResponse {
  result: {
    quest: Quest;
    coins_awarded: number;
    xp_awarded: number;
    new_balance?: number | null;
    total_xp?: number | null;
    message: string;
  };
}

export interface CoachInsight {
  category: 'care' | 'activity' | 'quest' | 'difficulty' | 'motivation';
  recommendation: string;
}

export interface CoachAdviceResponse {
  mood?: string | null;
  difficulty_hint: QuestDifficulty;
  summary: string;
  suggestions: CoachInsight[];
  generated_at: string;
  source: 'heuristic' | 'llm';
}


