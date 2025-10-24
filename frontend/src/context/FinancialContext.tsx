import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
}

interface FinancialData {
  balance: number;
  transactions: Transaction[];
}

interface FinancialContextType {
  balance: number;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

// Local storage key
const STORAGE_KEY = 'financial_data';

const getStoredFinancialData = (userId: string): FinancialData => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return { balance: 1000, transactions: [] };
    
    const data = JSON.parse(storedData);
    return data[userId] || { balance: 1000, transactions: [] };
  } catch (error) {
    console.error('Error reading financial data:', error);
    return { balance: 1000, transactions: [] };
  }
};

const storeFinancialData = (userId: string, data: FinancialData) => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const allData = storedData ? JSON.parse(storedData) : {};
    allData[userId] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error('Error storing financial data:', error);
  }
};

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

  const loadFinancialData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = getStoredFinancialData(user.uid);
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Error loading financial data:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        date: new Date(),
      };
      
      // Update local state
      const newBalance = transaction.type === 'income' 
        ? balance + transaction.amount 
        : balance - transaction.amount;
      
      const newTransactions = [...transactions, newTransaction];
      
      setBalance(newBalance);
      setTransactions(newTransactions);
      
      // Persist to localStorage
      storeFinancialData(user.uid, {
        balance: newBalance,
        transactions: newTransactions,
      });
      
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError('Failed to add transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = {
    balance,
    transactions,
    addTransaction,
    loading,
    error,
  };

  return (
    <FinancialContext.Provider value={value}>
      {!loading && children}
    </FinancialContext.Provider>
  );
};
