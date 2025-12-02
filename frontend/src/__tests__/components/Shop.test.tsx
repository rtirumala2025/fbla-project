/**
 * Tests for Shop component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Shop } from '../../pages/Shop';
import { useAuth } from '../../contexts/AuthContext';
import { usePet } from '../../context/PetContext';
import { useToast } from '../../contexts/ToastContext';
import { getFinanceSummary, getShopCatalog, purchaseItems } from '../../api/finance';
import { useAppStore } from '../../store/useAppStore';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../context/PetContext');
jest.mock('../../contexts/ToastContext');
jest.mock('../../api/finance');
jest.mock('../../store/useAppStore');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePet = usePet as jest.MockedFunction<typeof usePet>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockGetFinanceSummary = getFinanceSummary as jest.MockedFunction<typeof getFinanceSummary>;
const mockGetShopCatalog = getShopCatalog as jest.MockedFunction<typeof getShopCatalog>;
const mockPurchaseItems = purchaseItems as jest.MockedFunction<typeof purchaseItems>;
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;

describe('Shop Component', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };

  const mockPet = {
    id: 'pet-1',
    name: 'Fluffy',
    species: 'dog' as const,
    breed: 'Golden Retriever',
    age: 2,
    level: 5,
    experience: 1000,
    ownerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    stats: {
      health: 80,
      hunger: 60,
      happiness: 70,
      cleanliness: 90,
      energy: 75,
      lastUpdated: new Date(),
    },
  };

  const mockShopItems = [
    {
      sku: 'food-1',
      name: 'Dog Food',
      category: 'food',
      price: 10,
      stock: 100,
      description: 'Nutritious food',
      emoji: '🍖',
    },
    {
      sku: 'toy-1',
      name: 'Ball',
      category: 'toy',
      price: 15,
      stock: 50,
      description: 'Bouncy ball',
      emoji: '⚽',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      currentUser: { uid: 'user-1', email: 'test@example.com' },
      loading: false,
      hasPet: true,
      isNewUser: false,
      isTransitioning: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshUserState: jest.fn(),
    });

    mockUsePet.mockReturnValue({
      pet: mockPet,
      loading: false,
      error: null,
      updating: false,
      updatePetStats: jest.fn().mockResolvedValue(undefined),
      feed: jest.fn(),
      play: jest.fn(),
      bathe: jest.fn(),
      rest: jest.fn(),
      createPet: jest.fn(),
      refreshPet: jest.fn(),
    });

    mockUseToast.mockReturnValue(mockToast);

    mockGetFinanceSummary.mockResolvedValue({
      summary: {
        balance: 100,
        income: 0,
        expenses: 0,
        transactions: [],
      },
    });

    mockGetShopCatalog.mockResolvedValue(mockShopItems);

    mockUseAppStore.mockReturnValue({
      setCoins: jest.fn(),
      deductCoins: jest.fn(),
      addInventoryItem: jest.fn(),
      updatePetStats: jest.fn(),
    } as any);
  });

  it('should render shop items', async () => {
    render(
      <BrowserRouter>
        <Shop />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dog Food')).toBeInTheDocument();
      expect(screen.getByText('Ball')).toBeInTheDocument();
    });
  });

  it('should add items to cart', async () => {
    render(
      <BrowserRouter>
        <Shop />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dog Food')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0]);

    expect(screen.getByText('1')).toBeInTheDocument(); // Cart count
  });

  it('should remove items from cart', async () => {
    render(
      <BrowserRouter>
        <Shop />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dog Food')).toBeInTheDocument();
    });

    const addButton = screen.getAllByText('+')[0];
    fireEvent.click(addButton);
    fireEvent.click(addButton); // Add 2 items

    const removeButton = screen.getAllByText('-')[0];
    fireEvent.click(removeButton);

    expect(screen.getByText('1')).toBeInTheDocument(); // Should have 1 item left
  });

  it('should handle purchase successfully', async () => {
    mockPurchaseItems.mockResolvedValue({
      summary: {
        balance: 75, // 100 - 25 (2*10 + 1*15)
        income: 0,
        expenses: 25,
        transactions: [],
      },
      items: [
        { item_id: 'food-1', quantity: 2 },
        { item_id: 'toy-1', quantity: 1 },
      ],
    });

    render(
      <BrowserRouter>
        <Shop />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dog Food')).toBeInTheDocument();
    });

    // Add items to cart
    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0]); // Add food
    fireEvent.click(addButtons[0]); // Add food again
    fireEvent.click(addButtons[1]); // Add toy

    // Purchase
    const purchaseButton = screen.getByText(/purchase|buy|checkout/i);
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(mockPurchaseItems).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it('should show error for insufficient funds', async () => {
    mockGetFinanceSummary.mockResolvedValue({
      summary: {
        balance: 5, // Not enough for items
        income: 0,
        expenses: 0,
        transactions: [],
      },
    });

    render(
      <BrowserRouter>
        <Shop />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dog Food')).toBeInTheDocument();
    });

    const addButton = screen.getAllByText('+')[0];
    fireEvent.click(addButton);

    const purchaseButton = screen.getByText(/purchase|buy|checkout/i);
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('Not enough coins')
      );
    });
  });

  it('should show error when no pet exists', async () => {
    mockUsePet.mockReturnValue({
      pet: null,
      loading: false,
      error: null,
      updating: false,
      updatePetStats: jest.fn(),
      feed: jest.fn(),
      play: jest.fn(),
      bathe: jest.fn(),
      rest: jest.fn(),
      createPet: jest.fn(),
      refreshPet: jest.fn(),
    });

    render(
      <BrowserRouter>
        <Shop />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dog Food')).toBeInTheDocument();
    });

    const addButton = screen.getAllByText('+')[0];
    fireEvent.click(addButton);

    const purchaseButton = screen.getByText(/purchase|buy|checkout/i);
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('create a pet')
      );
    });
  });

  it('should filter items by category', async () => {
    render(
      <BrowserRouter>
        <Shop />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dog Food')).toBeInTheDocument();
    });

    // Click food category filter
    const foodFilter = screen.getByText(/food/i);
    fireEvent.click(foodFilter);

    await waitFor(() => {
      expect(screen.getByText('Dog Food')).toBeInTheDocument();
      expect(screen.queryByText('Ball')).not.toBeInTheDocument();
    });
  });
});
