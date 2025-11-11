export interface StatPoint {
  timestamp: string;
  value: number;
}

export interface TrendSeries {
  label: string;
  points: StatPoint[];
}

export interface ExpenseCategory {
  category: string;
  total: number;
}

export interface CareReport {
  date: string;
  coins_earned: number;
  coins_spent: number;
  happiness_gain: number;
  health_change: number;
  games_played: number;
  pet_actions: number;
}

export interface WeeklySummary {
  start_date: string;
  end_date: string;
  reports: CareReport[];
}

export interface SnapshotSummary {
  period: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  coins_earned: number;
  coins_spent: number;
  net_coins: number;
  avg_happiness: number;
  avg_health: number;
  avg_energy: number;
  avg_cleanliness: number;
  happiness_gain: number;
  health_change: number;
  games_played: number;
  pet_actions: number;
  ai_summary?: string | null;
}

export interface SnapshotNotification {
  id: string;
  period_type: string;
  reference_date: string;
  stat?: string | null;
  change: number;
  severity: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AnalyticsSnapshot {
  end_of_day: CareReport;
  daily_summary: SnapshotSummary;
  weekly_summary: SnapshotSummary;
  monthly_summary: SnapshotSummary;
  weekly_trend: TrendSeries;
  monthly_trend: TrendSeries;
  expenses: ExpenseCategory[];
  health_progression: TrendSeries;
  ai_insights: string[];
  notifications: SnapshotNotification[];
}

export interface AnalyticsCSVResponse {
  filename: string;
  content: string;
}

