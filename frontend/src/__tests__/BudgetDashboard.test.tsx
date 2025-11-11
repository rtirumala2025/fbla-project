import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import BudgetDashboard from '../pages/budget/BudgetDashboard';

const getTransactionsMock = vi.fn();

const createAuthContext = (overrides: Record<string, unknown> = {}) => ({
  currentUser: { uid: 'u1' },
  loading: false,
  isNewUser: false,
  isTransitioning: false,
  demoModeAvailable: false,
  isDemoModeActive: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  checkUserProfile: vi.fn(),
  refreshUserState: vi.fn(),
  markUserAsReturning: vi.fn(),
  endTransition: vi.fn(),
  enterDemoMode: vi.fn(),
  ...overrides,
});

const useAuthMock = vi.fn(() => createAuthContext());

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => useAuthMock() }));
vi.mock('../contexts/ToastContext', () => {
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };
  return {
    useToast: () => toast,
  };
});
vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    getTransactions: (...args: unknown[]) => getTransactionsMock(...args),
  },
}));

const sampleTxns = [
  {
    id: '1',
    created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
    item_name: 'Fed Premium Food',
    amount: -15,
    category: 'food',
  },
  {
    id: '2',
    created_at: new Date('2024-01-02T00:00:00Z').toISOString(),
    item_name: 'Training Reward',
    amount: 40,
    category: 'income',
  },
  {
    id: '3',
    created_at: new Date('2024-01-03T00:00:00Z').toISOString(),
    item_name: 'Mystery charge',
    amount: -5,
    category: undefined,
  },
];

describe('BudgetDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTransactionsMock.mockResolvedValue(sampleTxns);
    useAuthMock.mockReturnValue(createAuthContext());
  });

  it('renders summary cards and table', async () => {
    render(<MemoryRouter><BudgetDashboard /></MemoryRouter>);
    expect(await screen.findByText(/Budget Dashboard/i)).toBeInTheDocument();
    expect(await screen.findByText(/Filter Transactions/i)).toBeInTheDocument();
  });

  it('loads transactions and responds to filters', async () => {
    render(<MemoryRouter><BudgetDashboard /></MemoryRouter>);

    await waitFor(() => expect(getTransactionsMock).toHaveBeenCalledWith('u1', 'week'));

    const incomeCard = screen.getByLabelText('Total Income');
    expect(incomeCard).toBeTruthy();
    expect(incomeCard).toHaveTextContent(/\$40/);

    fireEvent.click(screen.getByRole('button', { name: /Month/i }));
    await waitFor(() => expect(getTransactionsMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Type/i), { target: { value: 'income' } });
    await waitFor(() => expect(getTransactionsMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'food' } });
    await waitFor(() => expect(getTransactionsMock).toHaveBeenCalled());
  });

  it('shows an error message when loading fails', async () => {
    getTransactionsMock.mockRejectedValue(new Error('boom'));
    render(<MemoryRouter><BudgetDashboard /></MemoryRouter>);

    await waitFor(() => expect(getTransactionsMock).toHaveBeenCalled());
    expect(await screen.findByText('boom')).toBeInTheDocument();
  });

  it('does not attempt to load data without an authenticated user', async () => {
    useAuthMock.mockReturnValue(createAuthContext({ currentUser: null }));
    render(<MemoryRouter><BudgetDashboard /></MemoryRouter>);

    await waitFor(() => {
      expect(getTransactionsMock).not.toHaveBeenCalled();
    });
  });
});


