/**
 * API client for finance and wallet features
 * Handles transactions, goals, shop, donations, and leaderboards
 * Uses Supabase directly for all data
 */
import { apiRequest } from './httpClient';
import { supabase, isSupabaseMock } from '../lib/supabase';
import { cachedRequest, requestCache } from '../utils/requestCache';
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

export type DateRange = 'today' | 'week' | 'month' | 'all';

async function getTransactionsFromSupabase(userId: string, range: DateRange): Promise<TransactionRecord[]> {
  let query = supabase
    .from('finance_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const now = new Date();
  let startDate: Date;

  switch (range) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      query = query.gte('created_at', startDate.toISOString());
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      query = query.gte('created_at', startDate.toISOString());
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      query = query.gte('created_at', startDate.toISOString());
      break;
    case 'all':
      // limit to last 1000 for performance if 'all'
      query = query.limit(1000);
      break;
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(tx => ({
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
}

export async function getTransactions(userId: string, range: DateRange): Promise<TransactionRecord[]> {
  return cachedRequest(
    `finance-transactions-${userId}-${range}`,
    async () => {
      return await getTransactionsFromSupabase(userId, range);
    },
    10000
  );
}

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
  let userWallet;
  let careScore = 0;
  let walletError: any = null;

  // Try fetching wallet with profile join first
  const { data: walletWithProfile, error: joinError } = await supabase
    .from('finance_wallets')
    .select('*, profiles!inner(care_score)') // Try joining via user_id
    .eq('user_id', userId)
    .maybeSingle();

  if (joinError && (joinError.code === '42P01' || joinError.code === 'PGRST100')) { // relation doesn't exist or bad request
    console.warn("Finance wallet join failed, trying simple fetch and separate profile fetch");
    // Fallback to simple wallet fetch
    const { data: walletSimple, error: simpleWalletError } = await supabase
      .from('finance_wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (simpleWalletError) {
      walletError = simpleWalletError;
    } else {
      userWallet = walletSimple;
      // Fetch profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('care_score')
        .eq('id', userId)
        .single();
      careScore = profile?.care_score || 0;
    }
  } else if (joinError) {
    walletError = joinError;
  } else {
    userWallet = walletWithProfile;
    if (userWallet && (userWallet as any).profiles) {
      careScore = (userWallet as any).profiles.care_score || 0;
      delete (userWallet as any).profiles; // Clean up the joined data
    }
  }

  if (walletError && walletError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw walletError;
  }

  // If no wallet exists, create one with initial balance
  // Reuse existing variable
  if (!userWallet) {
    console.log('Creating new wallet for user:', userId);
    const { data: newWallet, error: createError } = await supabase
      .from('finance_wallets')
      .insert({
        user_id: userId,
        balance: 500, // Initial balance
        currency: 'COIN',
        lifetime_earned: 500
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create wallet:', createError);
      // Fallback to empty state but don't crash
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
    userWallet = newWallet;
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
  const lastAllowanceAt = userWallet!.last_allowance_at ? new Date(userWallet!.last_allowance_at) : null;
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
      balance
    `)
    .order('balance', { ascending: false })
    .limit(10);

  const leaderboard: LeaderboardEntry[] = [];
  if (!leaderboardError && leaderboardData) {
    // Fetch profiles for the leaderboard users separately
    const userIds = leaderboardData.map(entry => entry.user_id);
    let profilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, care_score, username')
        .in('id', userIds);

      profiles?.forEach(p => {
        profilesMap[p.id] = p;
      });
    }

    leaderboardData.forEach((entry, index) => {
      const profile = profilesMap[entry.user_id];
      leaderboard.push({
        user_id: entry.user_id,
        balance: entry.balance,
        rank: index + 1,
        care_score: profile?.care_score || 0,
        username: profile?.username || 'Unknown Trainer',
      });
    });
  }

  const summary: FinanceSummary = {
    currency: userWallet!.currency || 'COIN',
    balance: userWallet!.balance || 0,
    donation_total: userWallet!.donation_total || 0,
    lifetime_earned: userWallet!.lifetime_earned || 0,
    lifetime_spent: userWallet!.lifetime_spent || 0,
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

export async function getFinanceSummary(options?: { force?: boolean }): Promise<FinanceResponse> {
  if (options?.force) {
    requestCache.invalidate('finance-summary');
  }
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

export async function purchaseItems(data: PurchaseRequestPayload): Promise<void> {
  // Use shop endpoint for purchases
  await apiRequest(`/api/shop/purchase`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getLeaderboard(metric: 'balance' | 'care_score'): Promise<LeaderboardEntry[]> {
  return apiRequest<LeaderboardEntry[]>(`${API_BASE}/leaderboard?metric=${metric}`);
}

async function getShopCatalogFromSupabase(): Promise<ShopItemEntry[]> {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .order('category');

  if (error) throw error;

  return data || [];
}

export async function getShopCatalog(): Promise<ShopItemEntry[]> {
  return cachedRequest(
    'shop-catalog',
    async () => {
      return await getShopCatalogFromSupabase();
    },
    60000 // Cache for 1 minute
  );
}

export async function getInventory(): Promise<InventoryEntry[]> {
  return apiRequest<InventoryEntry[]>(`/api/shop/inventory`);
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
  return apiRequest<UseItemResponse>(`/api/shop/use`, {
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

export async function claimBetaAllowance(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase
    .from('transactions') // Use the view which has the trigger
    .insert({
      user_id: user.id,
      amount: 500,
      transaction_type: 'allowance',
      category: 'beta_reward',
      description: 'Beta Tester Allowance',
      item_name: 'Beta Reward',
      item_id: 'beta_reward'
    });

  if (error) throw error;
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

