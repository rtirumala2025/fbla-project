/**
 * Integration tests for shop purchase flow
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Shop } from '../../pages/Shop';
import { useAppStore } from '../../store/useAppStore';
import { profileService } from '../../services/profileService';
import { purchaseItems } from '../../api/finance';

// Mock dependencies
jest.mock('../../store/useAppStore');
jest.mock('../../services/profileService');
jest.mock('../../api/finance');

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
const mockProfileService = profileService as jest.Mocked<typeof profileService>;
const mockPurchaseItems = purchaseItems as jest.MockedFunction<typeof purchaseItems>;

describe('Shop Purchase Integration', () => {
  const mockStoreActions = {
    setCoins: jest.fn(),
    deductCoins: jest.fn(),
    addInventoryItem: jest.fn(),
    updatePetStats: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppStore.mockReturnValue(mockStoreActions as any);
  });

  it('should sync coins and inventory after purchase', async () => {
    mockPurchaseItems.mockResolvedValue({
      summary: {
        balance: 75,
        income: 0,
        expenses: 25,
        transactions: [],
      },
      items: [
        { item_id: 'food-1', quantity: 2 },
      ],
    });

    // Mock other dependencies
    jest.doMock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        currentUser: { uid: 'user-1' },
      }),
    }));

    jest.doMock('../../context/PetContext', () => ({
      usePet: () => ({
        pet: {
          id: 'pet-1',
          stats: { health: 80, hunger: 60, happiness: 70, cleanliness: 90, energy: 75 },
        },
        updatePetStats: jest.fn().mockResolvedValue(undefined),
      }),
    }));

    // Verify store actions are called
    await waitFor(() => {
      expect(mockStoreActions.setCoins).toHaveBeenCalledWith(75);
      expect(mockStoreActions.deductCoins).toHaveBeenCalledWith(25);
      expect(mockStoreActions.addInventoryItem).toHaveBeenCalled();
    });
  });

  it('should update pet stats after purchase', async () => {
    const mockUpdatePetStats = jest.fn().mockResolvedValue(undefined);

    jest.doMock('../../context/PetContext', () => ({
      usePet: () => ({
        pet: {
          id: 'pet-1',
          stats: { health: 80, hunger: 60, happiness: 70, cleanliness: 90, energy: 75 },
        },
        updatePetStats: mockUpdatePetStats,
      }),
    }));

    mockPurchaseItems.mockResolvedValue({
      summary: { balance: 90, income: 0, expenses: 10, transactions: [] },
      items: [{ item_id: 'food-1', quantity: 1 }],
    });

    await waitFor(() => {
      expect(mockUpdatePetStats).toHaveBeenCalledWith(
        expect.objectContaining({
          hunger: expect.any(Number),
          health: expect.any(Number),
        })
      );
    });
  });
});
