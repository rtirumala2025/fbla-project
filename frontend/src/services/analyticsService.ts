import dayjs from 'dayjs';
import { supabase, isSupabaseMock } from '@/lib/supabase';

export type Transaction = {
  id: string;
  user_id: string;
  item_name: string;
  amount: number; // negative for expenses, positive for income
  category?: string;
  created_at: string;
  transaction_type?: string;
};

export type DateRange = 'today' | 'week' | 'month' | 'all';

const ensureSupabase = () => {
  if (isSupabaseMock()) {
    throw new Error('Supabase mock is enabled. Analytics requires real Supabase credentials.');
  }
};

export const analyticsService = {
  async getTransactions(userId: string, range: DateRange = 'week'): Promise<Transaction[]> {
    ensureSupabase();

    const query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const now = dayjs();
    if (range === 'today') query.gte('created_at', now.startOf('day').toISOString());
    if (range === 'week') query.gte('created_at', now.subtract(7, 'day').toISOString());
    if (range === 'month') query.gte('created_at', now.subtract(30, 'day').toISOString());

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Transaction[];
  },
};
