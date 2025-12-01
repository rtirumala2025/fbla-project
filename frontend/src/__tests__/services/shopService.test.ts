/**
 * Tests for shopService
 */
import { shopService } from '../../services/shopService';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as any;

describe('shopService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getShopItems', () => {
    it('should fetch all shop items', async () => {
      const mockItems = [
        { id: 'item-1', name: 'Dog Food', price: 10, category: 'food' },
        { id: 'item-2', name: 'Ball', price: 5, category: 'toy' },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockItems,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      const result = await shopService.getShopItems();

      expect(result).toEqual(mockItems);
      expect(mockSupabase.from).toHaveBeenCalledWith('shop_items');
    });
  });

  describe('getUserBalance', () => {
    it('should fetch user coin balance', async () => {
      const mockProfile = {
        coins: 150,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await shopService.getUserBalance('user-id');

      expect(result).toBe(150);
    });

    it('should return 0 when profile has no coins', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { coins: null },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await shopService.getUserBalance('user-id');

      expect(result).toBe(0);
    });
  });

  describe('purchaseItems', () => {
    it('should purchase items successfully', async () => {
      const items = [
        { id: 'item-1', name: 'Dog Food', price: 10 },
        { id: 'item-2', name: 'Ball', price: 5 },
      ];

      // Mock getBalance
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({
        data: { coins: 100 },
        error: null,
      });

      // Mock update balance
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { coins: 85 },
        error: null,
      });

      // Mock insert transactions
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect1,
        })
        .mockReturnValueOnce({
          update: mockUpdate,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      mockSelect1.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        single: mockSingle1,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        select: mockSelect2,
      });
      mockSelect2.mockReturnValue({
        single: mockSingle2,
      });

      const result = await shopService.purchaseItems('user-id', items);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(85);
      expect(mockUpdate).toHaveBeenCalledWith({ coins: 85 });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'user-id',
            item_id: 'item-1',
            amount: -10,
            transaction_type: 'purchase',
          }),
          expect.objectContaining({
            user_id: 'user-id',
            item_id: 'item-2',
            amount: -5,
            transaction_type: 'purchase',
          }),
        ])
      );
    });

    it('should throw error when insufficient funds', async () => {
      const items = [{ id: 'item-1', name: 'Expensive Item', price: 1000 }];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { coins: 50 },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await expect(shopService.purchaseItems('user-id', items)).rejects.toThrow('Insufficient funds');
    });

    it('should rollback balance if transaction recording fails', async () => {
      const items = [{ id: 'item-1', name: 'Item', price: 10 }];

      // Mock getBalance
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({
        data: { coins: 100 },
        error: null,
      });

      // Mock update balance
      const mockUpdate1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { coins: 90 },
        error: null,
      });

      // Mock insert transactions (fails)
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Transaction failed' },
      });

      // Mock rollback update
      const mockUpdate2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();

      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect1,
        })
        .mockReturnValueOnce({
          update: mockUpdate1,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        })
        .mockReturnValueOnce({
          update: mockUpdate2,
        });

      mockSelect1.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        single: mockSingle1,
      });

      mockUpdate1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        select: mockSelect2,
      });
      mockSelect2.mockReturnValue({
        single: mockSingle2,
      });

      mockUpdate2.mockReturnValue({
        eq: mockEq3,
      });

      await expect(shopService.purchaseItems('user-id', items)).rejects.toThrow();

      // Should rollback
      expect(mockUpdate2).toHaveBeenCalledWith({ coins: 100 });
    });
  });

  describe('addCoins', () => {
    it('should add coins to user balance', async () => {
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({
        data: { coins: 100 },
        error: null,
      });

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { coins: 150 },
        error: null,
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect1,
        })
        .mockReturnValueOnce({
          update: mockUpdate,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      mockSelect1.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        single: mockSingle1,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        select: mockSelect2,
      });
      mockSelect2.mockReturnValue({
        single: mockSingle2,
      });

      const result = await shopService.addCoins('user-id', 50, 'Reward');

      expect(result).toBe(150);
      expect(mockUpdate).toHaveBeenCalledWith({ coins: 150 });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-id',
          amount: 50,
          transaction_type: 'reward',
        })
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('should fetch transaction history', async () => {
      const mockTransactions = [
        { id: 'tx-1', user_id: 'user-id', amount: -10, transaction_type: 'purchase' },
        { id: 'tx-2', user_id: 'user-id', amount: 50, transaction_type: 'reward' },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({
        data: mockTransactions,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });

      const result = await shopService.getTransactionHistory('user-id', 10);

      expect(result).toEqual(mockTransactions);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });
});
