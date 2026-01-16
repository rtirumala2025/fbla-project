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



  // 1. Fetch Wallet
  const { data: walletData, error: initialWalletError } = await supabase
    .from('finance_wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle(); // Use maybeSingle to avoid 406 on missing rows

  if (initialWalletError) {
    console.error('Wallet fetch failed:', initialWalletError);
    throw initialWalletError;
  }

  userWallet = walletData;

  // 2. Fetch Profile (Care Score)
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('care_score')
      .eq('user_id', userId)
      .single();

    if (profileData) {
      careScore = profileData.care_score;
    }
  } catch (e) {
    console.warn('Profile fetch failed (non-critical):', e);
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

  // DEBUG: Show actual balance seen
  const currentBalance = userWallet ? userWallet.balance : 'null';
  console.log(`DEBUG: Wallet found? ${!!userWallet}, Balance=${currentBalance}`);

  if (userWallet && userWallet.balance <= 0) {
    alert(`DEBUG: Balance is 0. Attempting fix...`); // Keep this one alert for the fix

    console.log('Wallet balance is 0. Auto-funding 500 coins directly...');
    alert("SYSTEM: Your balance is 0. Attempting to fix now...");
    try {
      // 1. Directly update wallet (Bypass view trigger logic which might be failing)
      const { error: updateError } = await supabase
        .from('finance_wallets')
        .update({
          balance: 500,
          lifetime_earned: (userWallet.lifetime_earned || 0) + 500
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update wallet balance:', updateError);
      } else {
        console.log('Wallet balance updated to 500.');

        // 2. Insert transaction record into BASE TABLE (finance_transactions)
        // This bypasses the 'transactions' view trigger, ensuring we don't double-add
        const { error: txError } = await supabase
          .from('finance_transactions')
          .insert({
            user_id: userId,
            amount: 500,
            wallet_id: userWallet.id, // Needed for base table
            transaction_type: 'allowance',
            category: 'starter_fund',
            description: 'Starter Funds',
            item_name: 'Starter Funds',
            item_id: 'starter_funds'
          });

        if (txError) console.error('Failed to log transaction:', txError);

        // 3. Update local state
        userWallet.balance = 500;
        userWallet.lifetime_earned = (userWallet.lifetime_earned || 0) + 500;
      }
    } catch (err) {
      console.error('Error auto-funding:', err);
    }
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
        .select('user_id, care_score, username')
        .in('user_id', userIds);

      profiles?.forEach(p => {
        profilesMap[p.user_id] = p;
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
  const { entries } = data;
  if (!entries || entries.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Calculate Total Cost
  // We need to fetch prices to be safe, but for now we'll trust the catalog data or fetch it briefly
  // To allow offline-ish purchases, we'll optimistically assume the client knows the price/id
  // But better to fetch the item price to avoid simple exploits if possible.

  let totalCost = 0;
  const transactionInserts: any[] = [];
  const inventoryInserts: any[] = [];

  // Fetch current wallet to check balance
  const { data: wallet, error: walletError } = await supabase
    .from('finance_wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (walletError || !wallet) throw new Error("Could not load wallet for purchase");

  // Process items
  for (const entry of entries) {
    // Find item details (optional validation in a real app, strict here helps)
    const { data: item } = await supabase
      .from('shop_items') // view
      .select('*')
      .eq('id', entry.itemId)
      .single();

    const price = item?.price || 0;
    const cost = price * entry.quantity;
    totalCost += cost;

    transactionInserts.push({
      user_id: user.id,
      wallet_id: wallet.id,
      amount: -cost, // Negative for expense
      transaction_type: 'purchase',
      category: item?.category || 'general',
      item_id: entry.itemId,
      item_name: item?.name || entry.itemId,
      description: `Bought ${entry.quantity} x ${item?.name}`,
      quantity: entry.quantity
    });

    inventoryInserts.push({
      user_id: user.id,
      wallet_id: wallet.id,
      item_id: entry.itemId,
      item_name: item?.name || entry.itemId,
      category: item?.category || 'general',
      quantity: entry.quantity
    });
  }

  if (wallet.balance < totalCost) {
    throw new Error(`Insufficient funds. Cost: ${totalCost}, Balance: ${wallet.balance}`);
  }

  // 2. Update Wallet Balance directly
  const { error: updateError } = await supabase
    .from('finance_wallets')
    .update({
      balance: wallet.balance - totalCost,
      lifetime_spent: (wallet.lifetime_spent || 0) + totalCost
    })
    .eq('id', wallet.id);

  if (updateError) throw new Error("Failed to deduct funds: " + updateError.message);

  // 3. Insert Transactions (Logs)
  // We do them one by one or batch? Batch is better but let's simple loop to be safe with types
  for (const tx of transactionInserts) {
    await supabase.from('finance_transactions').insert(tx);
  }

  // 4. Update Inventory (Upsert)
  for (const inv of inventoryInserts) {
    // Check if exists
    const { data: existing } = await supabase
      .from('finance_inventory')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', inv.item_id)
      .single();

    if (existing) {
      await supabase
        .from('finance_inventory')
        .update({ quantity: existing.quantity + inv.quantity })
        .eq('id', existing.id);
    } else {
      await supabase.from('finance_inventory').insert(inv);
    }
  }
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('finance_inventory')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to fetch inventory:', error);
    throw error;
  }

  return data || [];
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

