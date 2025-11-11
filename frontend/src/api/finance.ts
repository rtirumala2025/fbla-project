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

interface RequestOptions {
  token: string;
}

const headers = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export async function getFinanceSummary(options: RequestOptions): Promise<FinanceResponse> {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function earnCoins(data: EarnRequestPayload, options: RequestOptions): Promise<FinanceResponse> {
  const response = await fetch(`${API_BASE}/earn`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function purchaseItems(
  data: PurchaseRequestPayload,
  options: RequestOptions,
): Promise<FinanceResponse> {
  const response = await fetch(`${API_BASE}/purchase`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function getLeaderboard(
  metric: 'balance' | 'care_score',
  options: RequestOptions,
): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${API_BASE}/leaderboard?metric=${metric}`, {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function getShopCatalog(options: RequestOptions): Promise<ShopItemEntry[]> {
  const response = await fetch(`${API_BASE}/shop`, {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function claimDailyAllowance(options: RequestOptions): Promise<FinanceResponse> {
  const response = await fetch(`${API_BASE}/daily-allowance`, {
    method: 'POST',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function donateCoins(
  data: DonationPayload,
  options: RequestOptions,
): Promise<FinanceResponse> {
  const response = await fetch(`${API_BASE}/donate`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function createGoal(
  data: GoalCreatePayload,
  options: RequestOptions,
): Promise<FinanceResponse> {
  const response = await fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function contributeGoal(
  goalId: string,
  data: GoalContributionPayload,
  options: RequestOptions,
): Promise<FinanceResponse> {
  const response = await fetch(`${API_BASE}/goals/${goalId}/contribute`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function listGoals(options: RequestOptions) {
  const response = await fetch(`${API_BASE}/goals`, {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

