/**
 * API client for finance and wallet features
 * Handles transactions, goals, shop, donations, and leaderboards
 */
import { apiRequest } from './httpClient';
import type {
  DonationPayload,
  EarnRequestPayload,
  FinanceResponse,
  FinanceSummary,
  GoalContributionPayload,
  GoalCreatePayload,
  LeaderboardEntry,
  PurchaseRequestPayload,
  ShopItemEntry,
} from '../types/finance';

const API_BASE = '/api/finance';
const useMock = process.env.REACT_APP_USE_MOCK === 'true';

// Generate mock finance summary
function generateMockFinanceSummary(): FinanceResponse {
  return {
    summary: {
      currency: 'coins',
      balance: 1250,
      donation_total: 150,
      lifetime_earned: 3500,
      lifetime_spent: 2250,
      income_today: 85,
      expenses_today: 45,
      budget_warning: null,
      recommendations: [
        'You\'re doing great with your savings!',
        'Consider setting a goal for a special pet item',
        'Your daily allowance is available to claim',
      ],
      notifications: [
        'Daily allowance available!',
        'You\'ve earned 50 coins this week',
      ],
      daily_allowance_available: true,
      allowance_amount: 50,
      goals: [
        {
          id: '1',
          name: 'Luxury Pet Bed',
          target_amount: 500,
          current_amount: 320,
          status: 'active',
          deadline: null,
          completed_at: null,
          progress_percent: 64,
        },
        {
          id: '2',
          name: 'Premium Food Supply',
          target_amount: 200,
          current_amount: 200,
          status: 'completed',
          deadline: null,
          completed_at: new Date().toISOString(),
          progress_percent: 100,
        },
      ],
      transactions: [
        {
          id: '1',
          amount: 50,
          transaction_type: 'income',
          category: 'allowance',
          description: 'Daily allowance claimed',
          created_at: new Date().toISOString(),
          balance_after: 1250,
          related_goal_id: null,
          related_shop_item_id: null,
        },
        {
          id: '2',
          amount: -25,
          transaction_type: 'expense',
          category: 'food',
          description: 'Premium pet food',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          balance_after: 1200,
          related_goal_id: null,
          related_shop_item_id: 'food-1',
        },
      ],
      inventory: [
        {
          item_id: '1',
          item_name: 'Premium Pet Food',
          category: 'food',
          quantity: 3,
          shop_item_id: 'food-1',
        },
        {
          item_id: '2',
          item_name: 'Toy Ball',
          category: 'toys',
          quantity: 1,
          shop_item_id: 'toy-1',
        },
      ],
      leaderboard: [
        {
          user_id: 'user-1',
          balance: 2500,
          care_score: 95,
          rank: 1,
        },
        {
          user_id: 'user-2',
          balance: 1800,
          care_score: 88,
          rank: 2,
        },
      ],
    },
  };
}

export async function getFinanceSummary(): Promise<FinanceResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockFinanceSummary();
  }

  try {
    return await apiRequest<FinanceResponse>(API_BASE);
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Finance API unavailable, using mock data', error);
    return generateMockFinanceSummary();
  }
}

export async function earnCoins(data: EarnRequestPayload): Promise<FinanceResponse> {
  return apiRequest<FinanceResponse>(`${API_BASE}/earn`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function purchaseItems(data: PurchaseRequestPayload): Promise<FinanceResponse> {
  return apiRequest<FinanceResponse>(`${API_BASE}/purchase`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getLeaderboard(metric: 'balance' | 'care_score'): Promise<LeaderboardEntry[]> {
  return apiRequest<LeaderboardEntry[]>(`${API_BASE}/leaderboard?metric=${metric}`);
}

export async function getShopCatalog(): Promise<ShopItemEntry[]> {
  return apiRequest<ShopItemEntry[]>(`${API_BASE}/shop`);
}

export async function claimDailyAllowance(): Promise<FinanceResponse> {
  return apiRequest<FinanceResponse>(`${API_BASE}/daily-allowance`, {
    method: 'POST',
  });
}

export async function donateCoins(data: DonationPayload): Promise<FinanceResponse> {
  return apiRequest<FinanceResponse>(`${API_BASE}/donate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createGoal(data: GoalCreatePayload): Promise<FinanceResponse> {
  return apiRequest<FinanceResponse>(`${API_BASE}/goals`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function contributeGoal(goalId: string, data: GoalContributionPayload): Promise<FinanceResponse> {
  return apiRequest<FinanceResponse>(`${API_BASE}/goals/${goalId}/contribute`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listGoals(): Promise<FinanceResponse> {
  return apiRequest<FinanceResponse>(`${API_BASE}/goals`);
}

// Budget Advisor API
export interface BudgetAdvisorTransaction {
  amount: number;
  category: string;
  date: string;
  description?: string;
}

export interface BudgetAdvisorRequest {
  transactions: BudgetAdvisorTransaction[];
  monthly_budget?: number;
}

export interface BudgetAdvisorResponse {
  status: 'success' | 'error';
  data?: {
    total_spending: number;
    total_income: number;
    net_balance: number;
    average_daily_spending: number;
    top_categories: string[];
    trends: Array<{
      category: string;
      total_spent: number;
      transaction_count: number;
      average_amount: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      percentage_change?: number;
    }>;
    overspending_alerts: Array<{
      category: string;
      current_spending: number;
      budget_limit?: number;
      excess_amount?: number;
      severity: 'low' | 'medium' | 'high';
      recommendation: string;
    }>;
    suggestions: string[];
    analysis_period: {
      start: string;
      end: string;
    };
  };
  message: string;
}

export async function analyzeBudget(request: BudgetAdvisorRequest): Promise<BudgetAdvisorResponse> {
  return apiRequest<BudgetAdvisorResponse>('/api/budget-advisor/analyze', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

