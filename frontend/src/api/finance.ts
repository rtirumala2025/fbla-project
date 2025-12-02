/**
 * API client for finance and wallet features
 * Handles transactions, goals, shop, donations, and leaderboards
 * Uses Supabase directly for all data
 */
import { apiRequest } from './httpClient';
import { supabase, isSupabaseMock } from '../lib/supabase';
import { cachedRequest } from '../utils/requestCache';
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
  GoalSummary,
  TransactionRecord,
  InventoryEntry,
} from '../types/finance';

const API_BASE = '/api/finance';

async function getFinanceSummaryFromSupabase(): Promise<FinanceResponse> {
  if (isSupabaseMock()) {
    throw new Error('Supabase is not configured');
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();

  // Fetch wallet
  const { data: wallet, error: walletError } = await supabase
    .from('finance_wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (walletError && walletError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw walletError;
  }

  // If no wallet exists, return empty summary
  if (!wallet) {
    return {
      summary: {
        currency: 'COIN',
        balance: 0,
        donation_total: 0,
        lifetime_earned: 0,
        lifetime_spent: 0,
        income_today: 0,
        expenses_today: 0,
        budget_warning: null,
        recommendations: [],
        notifications: [],
        daily_allowance_available: false,
        allowance_amount: 0,
        goals: [],
        transactions: [],
        inventory: [],
        leaderboard: [],
      },
    };
  }

  // Fetch today's transactions
  const { data: todayTransactions, error: todayTxError } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', todayStart)
    .order('created_at', { ascending: false });

  if (todayTxError) {
    throw todayTxError;
  }

  const incomeToday = (todayTransactions || [])
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expensesToday = (todayTransactions || [])
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Fetch recent transactions (last 50)
  const { data: transactions, error: txError } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (txError) {
    throw txError;
  }

  // Fetch goals
  const { data: goals, error: goalsError } = await supabase
    .from('finance_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (goalsError) {
    throw goalsError;
  }

  // Fetch inventory
  const { data: inventory, error: inventoryError } = await supabase
    .from('finance_inventory')
    .select('*')
    .eq('user_id', userId);

  if (inventoryError) {
    throw inventoryError;
  }

  // Check daily allowance (if last_allowance_at is more than 24 hours ago or null)
  const lastAllowanceAt = wallet.last_allowance_at ? new Date(wallet.last_allowance_at) : null;
  const now = new Date();
  const hoursSinceLastAllowance = lastAllowanceAt
    ? (now.getTime() - lastAllowanceAt.getTime()) / (1000 * 60 * 60)
    : 999;
  const dailyAllowanceAvailable = hoursSinceLastAllowance >= 24;

  // Map transactions
  const transactionRecords: TransactionRecord[] = (transactions || []).map(tx => ({
    id: tx.id,
    amount: tx.amount,
    transaction_type: tx.transaction_type === 'income' || tx.amount > 0 ? 'income' : 'expense',
    category: tx.category,
    description: tx.description,
    created_at: tx.created_at,
    balance_after: tx.balance_after,
    related_goal_id: tx.related_goal_id,
    related_shop_item_id: tx.related_shop_item_id,
  }));

  // Map goals
  const goalSummaries: GoalSummary[] = (goals || []).map(goal => ({
    id: goal.id,
    name: goal.name,
    target_amount: goal.target_amount,
    current_amount: goal.current_amount,
    status: goal.status as 'active' | 'completed' | 'cancelled',
    deadline: goal.deadline,
    completed_at: goal.completed_at,
    progress_percent: goal.target_amount > 0
      ? Math.round((goal.current_amount / goal.target_amount) * 100)
      : 0,
  }));

  // Map inventory
  const inventoryEntries: InventoryEntry[] = (inventory || []).map(inv => ({
    item_id: inv.item_id,
    item_name: inv.item_name,
    category: inv.category,
    quantity: inv.quantity,
    shop_item_id: inv.shop_item_id,
  }));

  // Fetch leaderboard (top 10 by balance)
  const { data: leaderboardData, error: leaderboardError } = await supabase
    .from('finance_wallets')
    .select(`
      user_id,
      balance,
      profiles!inner(care_score)
    `)
    .order('balance', { ascending: false })
    .limit(10);

  const leaderboard: LeaderboardEntry[] = [];
  if (!leaderboardError && leaderboardData) {
    leaderboardData.forEach((entry, index) => {
      leaderboard.push({
        user_id: entry.user_id,
        balance: entry.balance,
        care_score: (entry.profiles as any)?.care_score || 0,
        rank: index + 1,
      });
    });
  }

  const summary: FinanceSummary = {
    currency: wallet.currency || 'COIN',
    balance: wallet.balance || 0,
    donation_total: wallet.donation_total || 0,
    lifetime_earned: wallet.lifetime_earned || 0,
    lifetime_spent: wallet.lifetime_spent || 0,
    income_today: incomeToday,
    expenses_today: expensesToday,
    budget_warning: null,
    recommendations: [],
    notifications: dailyAllowanceAvailable ? ['Daily allowance available!'] : [],
    daily_allowance_available: dailyAllowanceAvailable,
    allowance_amount: 50, // Default allowance amount
    goals: goalSummaries,
    transactions: transactionRecords,
    inventory: inventoryEntries,
    leaderboard,
  };

  return { summary };
}

export async function getFinanceSummary(): Promise<FinanceResponse> {
  return cachedRequest(
    'finance-summary',
    async () => {
      try {
        return await getFinanceSummaryFromSupabase();
      } catch (error) {
        // Try backend API as fallback
        try {
          return await apiRequest<FinanceResponse>(API_BASE);
        } catch (apiError: any) {
          throw new Error('Failed to load finance data. Please ensure you are logged in and try again.');
        }
      }
    },
    30000 // Cache for 30 seconds
  );
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

export async function getInventory(): Promise<InventoryEntry[]> {
  return apiRequest<InventoryEntry[]>(`${API_BASE}/shop/inventory`);
}

export interface UseItemPayload {
  item_id: string;
  quantity?: number;
  pet_id?: string | null;
}

export interface UseItemResponse {
  success: boolean;
  remaining_quantity: number;
  stat_updates: Record<string, number>;
  message: string;
}

export async function useItem(payload: UseItemPayload): Promise<UseItemResponse> {
  return apiRequest<UseItemResponse>(`${API_BASE}/shop/use`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function claimDailyAllowance(): Promise<FinanceResponse> {
  try {
    return await apiRequest<FinanceResponse>(`${API_BASE}/daily-allowance`, {
      method: 'POST',
    });
  } catch (error: any) {
    if (error?.status === 0 || error?.data?.networkError) {
      throw new Error('Backend server is not available. Please start the backend server to use this feature.');
    }
    throw error;
  }
}

export async function donateCoins(data: DonationPayload): Promise<FinanceResponse> {
  try {
    return await apiRequest<FinanceResponse>(`${API_BASE}/donate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error: any) {
    if (error?.status === 0 || error?.data?.networkError) {
      throw new Error('Backend server is not available. Please start the backend server to use this feature.');
    }
    throw error;
  }
}

export async function createGoal(data: GoalCreatePayload): Promise<FinanceResponse> {
  try {
    return await apiRequest<FinanceResponse>(`${API_BASE}/goals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error: any) {
    if (error?.status === 0 || error?.data?.networkError) {
      throw new Error('Backend server is not available. Please start the backend server to use this feature.');
    }
    throw error;
  }
}

export async function contributeGoal(goalId: string, data: GoalContributionPayload): Promise<FinanceResponse> {
  try {
    return await apiRequest<FinanceResponse>(`${API_BASE}/goals/${goalId}/contribute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error: any) {
    if (error?.status === 0 || error?.data?.networkError) {
      throw new Error('Backend server is not available. Please start the backend server to use this feature.');
    }
    throw error;
  }
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

