import dayjs from 'dayjs';
import { supabase, isSupabaseMock } from '../lib/supabase';

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

export const analyticsService = {
  async getTransactions(userId: string, range: DateRange = 'week'): Promise<Transaction[]> {
    if (isSupabaseMock()) {
      throw new Error('Supabase is not configured');
    }

    try {
      // Use finance_transactions table directly (the actual table with all columns)
      // This avoids issues with the transactions view which may not have all columns
      let query = supabase
        .from('finance_transactions')
        .select('id, user_id, item_name, amount, category, created_at, transaction_type, description')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      const now = dayjs();
      if (range === 'today') {
        query = query.gte('created_at', now.startOf('day').toISOString());
      } else if (range === 'week') {
        query = query.gte('created_at', now.subtract(7, 'day').toISOString());
      } else if (range === 'month') {
        query = query.gte('created_at', now.subtract(30, 'day').toISOString());
      }
      // 'all' range doesn't need a date filter
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to fetch transactions from Supabase:', error);
        throw error;
      }
      
      // Map finance_transactions data to Transaction type
      if (data && Array.isArray(data)) {
        return data.map((tx: any) => ({
          id: tx.id,
          user_id: tx.user_id,
          item_name: tx.item_name || tx.description || 'Transaction',
          amount: tx.amount,
          category: tx.category || 'other',
          created_at: tx.created_at,
          transaction_type: tx.transaction_type,
        })) as Transaction[];
      }
      
      // Return empty array if no data
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },
};


