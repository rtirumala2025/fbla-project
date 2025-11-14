/**
 * Example usage of BudgetAdvisorAI component
 * 
 * This file demonstrates how to integrate the BudgetAdvisorAI component
 * into your application.
 */

import React, { useState, useEffect } from 'react';
import BudgetAdvisorAI, { TransactionInput } from './BudgetAdvisorAI';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/analyticsService';

/**
 * Example: Integrating BudgetAdvisorAI with BudgetDashboard
 */
export const BudgetDashboardWithAI: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionInput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!currentUser) return;

      try {
        // Fetch transactions from your analytics service
        const data = await analyticsService.getTransactions(currentUser.uid, 'month');
        
        // Transform to BudgetAdvisorAI format
        const formattedTransactions: TransactionInput[] = data.map((txn: any) => ({
          amount: Math.abs(txn.amount), // Budget advisor expects positive amounts
          category: txn.category || 'other',
          date: new Date(txn.created_at).toISOString().split('T')[0], // YYYY-MM-DD format
          description: txn.description || txn.notes,
        }));

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [currentUser]);

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Budget Dashboard with AI</h1>
      
      <BudgetAdvisorAI
        transactions={transactions}
        monthlyBudget={2000} // Optional: set monthly budget
        userId={currentUser?.uid}
        autoFetch={true}
        onAnalysisComplete={(analysis) => {
          console.log('Analysis complete:', analysis);
        }}
        onError={(error) => {
          console.error('Analysis error:', error);
        }}
      />
    </div>
  );
};

/**
 * Example: Using BudgetAdvisorAI with manual transaction data
 */
export const BudgetAdvisorExample: React.FC = () => {
  const sampleTransactions: TransactionInput[] = [
    {
      amount: 45.50,
      category: 'food',
      date: '2024-01-15',
      description: 'Grocery shopping',
    },
    {
      amount: 120.00,
      category: 'transport',
      date: '2024-01-16',
      description: 'Gas',
    },
    {
      amount: 25.00,
      category: 'entertainment',
      date: '2024-01-17',
      description: 'Movie tickets',
    },
    {
      amount: 350.00,
      category: 'shopping',
      date: '2024-01-18',
      description: 'Clothing',
    },
    {
      amount: 80.00,
      category: 'food',
      date: '2024-01-19',
      description: 'Restaurant',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Budget Advisor AI</h1>
      
      <BudgetAdvisorAI
        transactions={sampleTransactions}
        monthlyBudget={1500}
        autoFetch={true}
      />
    </div>
  );
};

/**
 * Example: Manual control (without auto-fetch)
 */
export const BudgetAdvisorManualExample: React.FC = () => {
  const [transactions] = useState<TransactionInput[]>([
    {
      amount: 100.00,
      category: 'food',
      date: '2024-01-20',
    },
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <BudgetAdvisorAI
        transactions={transactions}
        autoFetch={false} // Don't auto-fetch
        onAnalysisComplete={(analysis) => {
          alert(`Analysis complete! Found ${analysis.trends.length} trends.`);
        }}
      />
    </div>
  );
};

