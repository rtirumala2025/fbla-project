export interface TransactionRecord {
  id: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  description?: string | null;
  created_at: string;
  balance_after?: number | null;
  related_goal_id?: string | null;
  related_shop_item_id?: string | null;
}

export interface InventoryEntry {
  item_id: string;
  item_name: string;
  category?: string | null;
  quantity: number;
  shop_item_id?: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  balance: number;
  care_score: number;
  rank: number;
}

export interface GoalSummary {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  status: 'active' | 'completed' | 'cancelled';
  deadline?: string | null;
  completed_at?: string | null;
  progress_percent: number;
}

export interface ShopItemEntry {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface FinanceSummary {
  currency: string;
  balance: number;
  donation_total: number;
  lifetime_earned: number;
  lifetime_spent: number;
  income_today: number;
  expenses_today: number;
  budget_warning?: string | null;
  recommendations: string[];
  notifications: string[];
  daily_allowance_available: boolean;
  allowance_amount: number;
  goals: GoalSummary[];
  transactions: TransactionRecord[];
  inventory: InventoryEntry[];
  leaderboard: LeaderboardEntry[];
}

export interface FinanceResponse {
  summary: FinanceSummary;
}

export interface PurchaseLineItemPayload {
  item_id: string;
  quantity: number;
}

export interface PurchaseRequestPayload {
  items: PurchaseLineItemPayload[];
  pet_id?: string | null;
}

export interface EarnRequestPayload {
  amount: number;
  reason: string;
  care_score?: number;
}

export interface GoalCreatePayload {
  name: string;
  target_amount: number;
  deadline?: string | null;
}

export interface GoalContributionPayload {
  amount: number;
}

export interface DonationPayload {
  recipient_id: string;
  amount: number;
  message?: string | null;
}
