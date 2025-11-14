/**
 * API client for analytics feature
 * Handles fetching analytics snapshots, weekly summaries, and CSV exports
 */
import { apiRequest } from './httpClient';
import type { AnalyticsCSVResponse, AnalyticsSnapshot, WeeklySummary } from '../types/analytics';

const API_BASE = '/api/analytics';
const useMock = process.env.REACT_APP_USE_MOCK === 'true';

// Generate mock analytics snapshot
function generateMockSnapshot(): AnalyticsSnapshot {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Generate trend points for the last 7 days
  const weeklyPoints = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    return {
      timestamp: date.toISOString(),
      value: 50 + Math.floor(Math.random() * 100) - 20,
    };
  });

  // Generate trend points for the last 30 days (one per week)
  const monthlyPoints = Array.from({ length: 4 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (21 - i * 7));
    return {
      timestamp: date.toISOString(),
      value: 100 + Math.floor(Math.random() * 200) - 50,
    };
  });

  // Generate health progression
  const healthPoints = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    return {
      timestamp: date.toISOString(),
      value: 75 + Math.floor(Math.random() * 20),
    };
  });

  return {
    end_of_day: {
      date: today,
      coins_earned: 85,
      coins_spent: 45,
      happiness_gain: 12,
      health_change: 5,
      games_played: 3,
      pet_actions: 8,
    },
    daily_summary: {
      period: 'daily',
      start_date: today,
      end_date: today,
      coins_earned: 85,
      coins_spent: 45,
      net_coins: 40,
      avg_happiness: 82,
      avg_health: 88,
      avg_energy: 75,
      avg_cleanliness: 90,
      happiness_gain: 12,
      health_change: 5,
      games_played: 3,
      pet_actions: 8,
      ai_summary: 'Great job today! Your pet is happy and healthy. Keep up the consistent care!',
    },
    weekly_summary: {
      period: 'weekly',
      start_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: today,
      coins_earned: 520,
      coins_spent: 280,
      net_coins: 240,
      avg_happiness: 78,
      avg_health: 85,
      avg_energy: 72,
      avg_cleanliness: 87,
      happiness_gain: 45,
      health_change: 18,
      games_played: 18,
      pet_actions: 42,
      ai_summary: 'Strong week! Your pet has been well-cared for with consistent feeding and playtime.',
    },
    monthly_summary: {
      period: 'monthly',
      start_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: today,
      coins_earned: 2100,
      coins_spent: 1200,
      net_coins: 900,
      avg_happiness: 75,
      avg_health: 82,
      avg_energy: 70,
      avg_cleanliness: 85,
      happiness_gain: 180,
      health_change: 65,
      games_played: 75,
      pet_actions: 165,
      ai_summary: 'Excellent month! Your consistent care routine is showing great results. Your pet is thriving!',
    },
    weekly_trend: {
      label: 'Weekly Net Coins',
      points: weeklyPoints,
    },
    monthly_trend: {
      label: 'Monthly Net Coins',
      points: monthlyPoints,
    },
    expenses: [
      { category: 'food', total: 120 },
      { category: 'toys', total: 85 },
      { category: 'health', total: 50 },
      { category: 'accessories', total: 25 },
    ],
    health_progression: {
      label: 'Health Average',
      points: healthPoints,
    },
    ai_insights: [
      'Your pet\'s happiness has increased 12% this week - great job!',
      'Consider playing more games to boost energy levels',
      'Regular feeding schedule is helping maintain good health',
    ],
    notifications: [
      {
        id: '1',
        period_type: 'daily',
        reference_date: today,
        stat: 'happiness',
        change: 12,
        severity: 'success',
        message: 'Happiness increased by 12% today!',
        is_read: false,
        created_at: now.toISOString(),
      },
    ],
  };
}

export async function fetchSnapshot(): Promise<AnalyticsSnapshot> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockSnapshot();
  }

  try {
    return await apiRequest<AnalyticsSnapshot>(`${API_BASE}/snapshot`);
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Analytics API unavailable, using mock data', error);
    return generateMockSnapshot();
  }
}

export async function fetchWeeklySummary(endDate?: string): Promise<WeeklySummary> {
  const url = endDate ? `${API_BASE}/daily?end_date=${encodeURIComponent(endDate)}` : `${API_BASE}/daily`;
  return apiRequest<WeeklySummary>(url);
}

export async function exportReports(start: string, end: string): Promise<AnalyticsCSVResponse> {
  const url = `${API_BASE}/export?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
  const response = await apiRequest<{ filename: string; content: string }>(url);
  return {
    filename: response.filename || `care-report-${start}-to-${end}.csv`,
    content: response.content,
  };
}

