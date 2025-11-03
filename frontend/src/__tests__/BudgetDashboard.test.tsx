import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import BudgetDashboard from '../pages/budget/BudgetDashboard';

jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ currentUser: { uid: 'u1' } }) }));
jest.mock('../contexts/ToastContext', () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn(), info: jest.fn() }) }));
jest.mock('../services/analyticsService', () => ({ analyticsService: { getTransactions: async () => ([{ id: '1', created_at: new Date().toISOString(), item_name: 'Fed Premium Food', amount: -15, category: 'food' }]) } }));

describe('BudgetDashboard', () => {
  it('renders summary cards and table', async () => {
    render(<MemoryRouter><BudgetDashboard /></MemoryRouter>);
    expect(await screen.findByText(/Budget Manager/i)).toBeInTheDocument();
    expect(await screen.findByText(/Transactions/i)).toBeInTheDocument();
  });
});


