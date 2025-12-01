import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BudgetAdvisor from '../BudgetAdvisor';
import apiClient from '../../services/apiClient';

jest.mock('../../services/apiClient');

describe('BudgetAdvisor', () => {
  const mockUserId = 'test-user-id';
  const mockTransactions = [
    { amount: -50.0, category: 'food', date: '2024-01-01', description: 'Groceries' },
    { amount: -30.0, category: 'transport', date: '2024-01-02' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (apiClient.post as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<BudgetAdvisor userId={mockUserId} transactionHistory={mockTransactions} />);
    
    expect(screen.getByText(/Analyzing your budget/i)).toBeInTheDocument();
  });

  it('renders budget advice and forecast on success', async () => {
    const mockResponse = {
      data: {
        advice: 'Test budget advice',
        forecast: [
          { month: '2024-01', predicted_spend: 1000.0 },
          { month: '2024-02', predicted_spend: 1100.0 },
        ],
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    render(<BudgetAdvisor userId={mockUserId} transactionHistory={mockTransactions} />);

    await waitFor(() => {
      expect(screen.getByText('Test budget advice')).toBeInTheDocument();
      expect(screen.getByText('Spending Forecast')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<BudgetAdvisor userId={mockUserId} transactionHistory={mockTransactions} />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Budget Advice/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no transactions', () => {
    render(<BudgetAdvisor userId={mockUserId} transactionHistory={[]} />);

    expect(screen.getByText(/No Budget Analysis Available/i)).toBeInTheDocument();
  });
});
