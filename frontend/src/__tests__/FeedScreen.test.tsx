import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const navigateMock = vi.fn();
const toastMock = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
const updatePetStatsMock = vi.fn();
const addCoinsMock = vi.fn();

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
const defaultPetContext: any = {
  pet: { name: 'Buddy', stats: { hunger: 50, happiness: 50, health: 90 } },
  updatePetStats: updatePetStatsMock,
};
const usePetMock = vi.fn(() => defaultPetContext);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { MemoryRouter } from 'react-router-dom';
import FeedScreen from '../pages/feed/FeedScreen';

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => useAuthMock() }));
vi.mock('../context/PetContext', () => ({
  usePet: () => usePetMock(),
}));
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => toastMock,
}));
vi.mock('../services/shopService', () => ({
  shopService: {
    addCoins: (...args: unknown[]) => addCoinsMock(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  addCoinsMock.mockResolvedValue(undefined);
  updatePetStatsMock.mockResolvedValue(undefined);
  useAuthMock.mockReturnValue(createAuthContext());
  usePetMock.mockReturnValue(defaultPetContext);
});

describe('FeedScreen', () => {
  it('renders food options', () => {
    render(
      <MemoryRouter>
        <FeedScreen />
      </MemoryRouter>
    );
    expect(screen.getByText(/Feed Buddy/i)).toBeInTheDocument();
    expect(screen.getByText(/Basic Kibble/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Back to dashboard/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('feeds the pet successfully and navigates away', async () => {
    render(
      <MemoryRouter>
        <FeedScreen />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Premium Food/i));
    fireEvent.click(screen.getByRole('button', { name: /Feed Pet/i }));

    await waitFor(() => expect(addCoinsMock).toHaveBeenCalledWith('u1', -15, expect.any(String)));
    expect(updatePetStatsMock).toHaveBeenCalledWith({
      hunger: 90,
      happiness: 55,
      health: 90,
    });
    expect(toastMock.success).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  it('surfaces an error when feeding fails', async () => {
    addCoinsMock.mockRejectedValueOnce(new Error('no coins'));

    render(
      <MemoryRouter>
        <FeedScreen />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Premium Food/i));
    fireEvent.click(screen.getByRole('button', { name: /Feed Pet/i }));

    await waitFor(() => expect(addCoinsMock).toHaveBeenCalled());
    expect(updatePetStatsMock).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith('no coins');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('does nothing when the user or pet context is missing', async () => {
    usePetMock.mockReturnValue({ pet: null, updatePetStats: updatePetStatsMock } as any);

    render(
      <MemoryRouter>
        <FeedScreen />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Premium Food/i));
    fireEvent.click(screen.getByRole('button', { name: /Feed Pet/i }));

    await waitFor(() => expect(addCoinsMock).not.toHaveBeenCalled());
    expect(updatePetStatsMock).not.toHaveBeenCalled();

    usePetMock.mockReturnValue(defaultPetContext);
  });
});


