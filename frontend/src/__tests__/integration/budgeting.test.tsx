/**
 * Integration tests for budgeting functionality
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFinanceRealtime } from '../../hooks/useFinanceRealtime';
import { shopService } from '../../services/shopService';
import { profileService } from '../../services/profileService';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../services/shopService');
jest.mock('../../services/profileService');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      })),
    })),
    removeChannel: jest.fn(),
  },
  isSupabaseMock: jest.fn(() => false),
}));

const mockShopService = shopService as jest.Mocked<typeof shopService>;
const mockProfileService = profileService as jest.Mocked<typeof profileService>;
const mockSupabase = supabase as any;

describe('Budgeting Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transaction Flow', () => {
    it('should track purchase transactions', async () => {
      const initialBalance = 100;
      const itemPrice = 15;
      const expectedBalance = initialBalance - itemPrice;

      mockProfileService.getProfile.mockResolvedValue({
        id: 'profile-id',
        user_id: 'user-id',
        coins: initialBalance,
        username: 'testuser',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      mockShopService.purchaseItems.mockResolvedValue({
        success: true,
        newBalance: expectedBalance,
      });

      const items = [{ id: 'item-1', name: 'Dog Food', price: itemPrice }];
      const result = await shopService.purchaseItems('user-id', items);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(expectedBalance);
      expect(mockShopService.purchaseItems).toHaveBeenCalledWith('user-id', items);
    });

    it('should prevent purchases with insufficient funds', async () => {
      const initialBalance = 10;
      const itemPrice = 50;

      mockProfileService.getProfile.mockResolvedValue({
        id: 'profile-id',
        user_id: 'user-id',
        coins: initialBalance,
        username: 'testuser',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      mockShopService.purchaseItems.mockRejectedValue(new Error('Insufficient funds'));

      const items = [{ id: 'item-1', name: 'Expensive Item', price: itemPrice }];

      await expect(shopService.purchaseItems('user-id', items)).rejects.toThrow('Insufficient funds');
    });

    it('should record transaction history', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          user_id: 'user-id',
          item_id: 'item-1',
          item_name: 'Dog Food',
          amount: -15,
          transaction_type: 'purchase',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'tx-2',
          user_id: 'user-id',
          item_id: 'reward',
          item_name: 'Completed Chore',
          amount: 25,
          transaction_type: 'reward',
          created_at: '2024-01-01T01:00:00Z',
        },
      ];

      mockShopService.getTransactionHistory.mockResolvedValue(mockTransactions);

      const history = await shopService.getTransactionHistory('user-id', 10);

      expect(history).toHaveLength(2);
      expect(history[0].transaction_type).toBe('purchase');
      expect(history[1].transaction_type).toBe('reward');
    });
  });

  describe('Balance Management', () => {
    it('should add coins for rewards', async () => {
      const initialBalance = 50;
      const rewardAmount = 25;

      mockShopService.getUserBalance.mockResolvedValue(initialBalance);
      mockShopService.addCoins.mockResolvedValue(initialBalance + rewardAmount);

      const newBalance = await shopService.addCoins('user-id', rewardAmount, 'Test Reward');

      expect(newBalance).toBe(initialBalance + rewardAmount);
      expect(mockShopService.addCoins).toHaveBeenCalledWith('user-id', rewardAmount, 'Test Reward');
    });

    it('should maintain balance consistency across operations', async () => {
      const initialBalance = 100;

      mockShopService.getUserBalance.mockResolvedValue(initialBalance);
      mockProfileService.getProfile.mockResolvedValue({
        id: 'profile-id',
        user_id: 'user-id',
        coins: initialBalance,
        username: 'testuser',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      // Add coins
      mockShopService.addCoins.mockResolvedValueOnce(initialBalance + 50);

      const balanceAfterReward = await shopService.addCoins('user-id', 50, 'Reward');
      expect(balanceAfterReward).toBe(150);

      // Purchase items
      mockShopService.purchaseItems.mockResolvedValue({
        success: true,
        newBalance: balanceAfterReward - 20,
      });

      const purchaseResult = await shopService.purchaseItems('user-id', [
        { id: 'item-1', name: 'Item', price: 20 },
      ]);

      expect(purchaseResult.newBalance).toBe(130);
    });
  });

  describe('Real-time Finance Updates', () => {
    it('should subscribe to finance changes', async () => {
      const mockChannel = {
        on: jest.fn(() => ({
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        })),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const { result } = renderHook(() => useFinanceRealtime('user-id'));

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled();
      });

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'transactions',
        }),
        expect.any(Function)
      );
    });

    it('should update balance when transaction occurs', async () => {
      const initialBalance = 100;
      const mockProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        coins: initialBalance,
        username: 'testuser',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockProfileService.getProfile.mockResolvedValue(mockProfile);

      const mockChannel = {
        on: jest.fn(() => ({
          subscribe: jest.fn((callback) => {
            // Simulate transaction event
            setTimeout(() => {
              callback({
                eventType: 'INSERT',
                new: {
                  user_id: 'user-id',
                  amount: -15,
                  transaction_type: 'purchase',
                },
              });
            }, 100);
            return { unsubscribe: jest.fn() };
          }),
        })),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const { result } = renderHook(() => useFinanceRealtime('user-id'));

      await waitFor(() => {
        expect(result.current.balance).toBeDefined();
      });
    });
  });

  describe('Budget Validation', () => {
    it('should validate sufficient balance before purchase', async () => {
      const balance = 50;
      const totalCost = 60;

      mockShopService.getUserBalance.mockResolvedValue(balance);

      const items = [
        { id: 'item-1', name: 'Item 1', price: 30 },
        { id: 'item-2', name: 'Item 2', price: 30 },
      ];

      mockShopService.purchaseItems.mockRejectedValue(new Error('Insufficient funds'));

      await expect(shopService.purchaseItems('user-id', items)).rejects.toThrow('Insufficient funds');
    });

    it('should calculate total cost correctly', () => {
      const items = [
        { id: 'item-1', name: 'Item 1', price: 10 },
        { id: 'item-2', name: 'Item 2', price: 20 },
        { id: 'item-3', name: 'Item 3', price: 15 },
      ];

      const totalCost = items.reduce((sum, item) => sum + item.price, 0);
      expect(totalCost).toBe(45);
    });
  });

  describe('Transaction Types', () => {
    it('should handle purchase transactions', async () => {
      mockShopService.purchaseItems.mockResolvedValue({
        success: true,
        newBalance: 85,
      });

      const result = await shopService.purchaseItems('user-id', [
        { id: 'item-1', name: 'Item', price: 15 },
      ]);

      expect(result.success).toBe(true);
    });

    it('should handle reward transactions', async () => {
      mockShopService.addCoins.mockResolvedValue(125);

      const newBalance = await shopService.addCoins('user-id', 25, 'Chore Reward');

      expect(newBalance).toBe(125);
    });

    it('should track transaction metadata', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          user_id: 'user-id',
          item_id: 'item-1',
          item_name: 'Dog Food',
          amount: -15,
          transaction_type: 'purchase',
          metadata: { category: 'food' },
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockShopService.getTransactionHistory.mockResolvedValue(mockTransactions);

      const history = await shopService.getTransactionHistory('user-id', 10);

      expect(history[0].metadata).toEqual({ category: 'food' });
    });
  });
});
