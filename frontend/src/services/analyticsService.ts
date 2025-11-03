import dayjs from 'dayjs';

export type Transaction = {
  id: string;
  user_id: string;
  item_name: string;
  amount: number; // negative for expenses, positive for income
  category?: string; // optional in mock
  created_at: string;
  transaction_type?: string;
};

export type DateRange = 'today' | 'week' | 'month' | 'all';

const useMock = process.env.REACT_APP_USE_MOCK === 'true';

// Import supabase only when not in mock mode
let supabase: any = null;
if (!useMock) {
  try {
    supabase = require('../lib/supabase').supabase;
  } catch (error) {
    console.warn('Failed to import supabase, using mock mode');
  }
}

const mockTransactions: Transaction[] = Array.from({ length: 18 }).map((_, i) => ({
  id: String(i + 1),
  user_id: 'mock-user',
  item_name: i % 3 === 0 ? 'Fed Premium Food' : i % 3 === 1 ? 'Completed Chore' : 'Bought Toy',
  amount: i % 3 === 1 ? 30 : -(i % 3 === 0 ? 15 : 20),
  category: i % 3 === 1 ? 'income' : i % 3 === 0 ? 'food' : 'toys',
  created_at: dayjs().subtract(i, 'day').toISOString(),
  transaction_type: i % 3 === 1 ? 'reward' : 'purchase',
}));

export const analyticsService = {
  async getTransactions(userId: string, range: DateRange = 'week'): Promise<Transaction[]> {
    if (useMock) {
      return mockTransactions;
    }

    const query = supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    const now = dayjs();
    if (range === 'today') query.gte('created_at', now.startOf('day').toISOString());
    if (range === 'week') query.gte('created_at', now.subtract(7, 'day').toISOString());
    if (range === 'month') query.gte('created_at', now.subtract(30, 'day').toISOString());
    const { data, error } = await query;
    if (error) throw error;
    return (data as any) as Transaction[];
  },
};


