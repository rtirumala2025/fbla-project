/**
 * API client for finance and wallet features
 * Handles transactions, goals, shop, donations, and leaderboards
 */
import { apiRequest } from './httpClient';
import type {
  DonationPayload,
  EarnRequestPayload,
  FinanceResponse,
  GoalContributionPayload,
  GoalCreatePayload,
  LeaderboardEntry,
  PurchaseRequestPayload,
  ShopItemEntry,
} from '../types/finance';

const API_BASE = '/api/finance';

export async function getFinanceSummary(): Promise<FinanceResponse> {
  return apiRequest<FinanceResponse>(API_BASE);
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

