import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getFinanceSummary } from '../api/finance';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
}

interface FinancialContextType {
  balance: number;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  refreshBalance: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

export const FinancialProvider: React.FC<{ children: React.ReactNode; user: User | null }> = ({ children, user }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinancialData = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await getFinanceSummary();
      
      if (response?.summary) {
        const summary = response.summary;
        setBalance(summary.balance || 0);
        
        // Map backend transactions to our Transaction format
        const mappedTransactions: Transaction[] = (summary.transactions || []).map((t) => ({
          id: t.id,
          type: t.transaction_type === 'income' ? 'income' : 'expense',
          amount: Math.abs(t.amount),
          description: t.description || '',
          category: t.category || 'other',
          date: new Date(t.created_at),
        }));
        
        setTransactions(mappedTransactions);
      } else {
        setBalance(0);
        setTransactions([]);
      }
    } catch (err: any) {
      setError('Failed to load financial data');
      // Don't throw - allow fallback behavior
      setBalance(0);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshBalance = useCallback(async () => {
    await loadFinancialData();
  }, [loadFinancialData]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Optimistic update
      setBalance(prev => transaction.type === 'income' 
        ? prev + transaction.amount 
        : prev - transaction.amount);
      
      const optimisticTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        date: new Date(),
      };
      
      setTransactions(prev => [optimisticTransaction, ...prev]);
      
      // Refresh from API to get server-confirmed values
      await loadFinancialData();
      
    } catch (err: any) {
      setError('Failed to add transaction');
      // Revert optimistic update
      await loadFinancialData();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, loadFinancialData]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  const value = useMemo(() => ({
    balance,
    transactions,
    addTransaction,
    refreshBalance,
    loading,
    error,
  }), [balance, transactions, addTransaction, refreshBalance, loading, error]);

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};
