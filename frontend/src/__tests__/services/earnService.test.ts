/**
 * Tests for earnService
 */
import { earnService, defaultChores } from '../../services/earnService';
import { shopService } from '../../services/shopService';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../services/shopService');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  isSupabaseMock: jest.fn(() => false),
}));

const mockShopService = shopService as jest.Mocked<typeof shopService>;
const mockSupabase = supabase as any;

describe('earnService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listChores', () => {
    it('should return default chores', async () => {
      const chores = await earnService.listChores();

      expect(chores).toEqual(defaultChores);
      expect(chores.length).toBeGreaterThan(0);
    });
  });

  describe('getChoreCooldown', () => {
    it('should return 0 when chore is not on cooldown', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
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

      const cooldown = await earnService.getChoreCooldown('user-id', 'wash-dishes');

      expect(cooldown).toBe(0);
    });

    it('should return remaining cooldown time in seconds', async () => {
      const futureTime = Date.now() + 30000; // 30 seconds from now
      const mockCooldowns = {
        cooldowns: {
          'wash-dishes': futureTime,
        },
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockCooldowns,
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

      const cooldown = await earnService.getChoreCooldown('user-id', 'wash-dishes');

      expect(cooldown).toBeGreaterThan(0);
      expect(cooldown).toBeLessThanOrEqual(30);
    });

    it('should filter expired cooldowns', async () => {
      const pastTime = Date.now() - 10000; // 10 seconds ago
      const mockCooldowns = {
        cooldowns: {
          'wash-dishes': pastTime,
          'mow-lawn': Date.now() + 60000,
        },
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockCooldowns,
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

      const expiredCooldown = await earnService.getChoreCooldown('user-id', 'wash-dishes');
      const activeCooldown = await earnService.getChoreCooldown('user-id', 'mow-lawn');

      expect(expiredCooldown).toBe(0);
      expect(activeCooldown).toBeGreaterThan(0);
    });
  });

  describe('completeChore', () => {
    it('should complete chore and add coins', async () => {
      const chore = defaultChores[0];
      const mockCooldowns = {
        cooldowns: {},
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockCooldowns,
        error: { code: 'PGRST116' },
      });

      const mockUpsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect,
        })
        .mockReturnValueOnce({
          upsert: mockUpsert,
        });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockShopService.addCoins.mockResolvedValue(115); // 100 + 15 reward

      const result = await earnService.completeChore('user-id', chore.id);

      expect(result.reward).toBe(chore.reward);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(mockShopService.addCoins).toHaveBeenCalledWith(
        'user-id',
        chore.reward,
        expect.stringContaining(chore.name)
      );
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-id',
          cooldowns: expect.objectContaining({
            [chore.id]: expect.any(Number),
          }),
        }),
        expect.any(Object)
      );
    });

    it('should throw error for invalid chore', async () => {
      await expect(earnService.completeChore('user-id', 'invalid-chore')).rejects.toThrow('Invalid chore');
    });

    it('should set cooldown after completing chore', async () => {
      const chore = defaultChores[0];
      const mockCooldowns = {
        cooldowns: {},
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockCooldowns,
        error: { code: 'PGRST116' },
      });

      const mockUpsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect,
        })
        .mockReturnValueOnce({
          upsert: mockUpsert,
        });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockShopService.addCoins.mockResolvedValue(115);

      await earnService.completeChore('user-id', chore.id);

      const cooldownTime = mockUpsert.mock.calls[0][0].cooldowns[chore.id];
      expect(cooldownTime).toBeGreaterThan(Date.now());
      expect(cooldownTime).toBeLessThanOrEqual(Date.now() + chore.cooldownSeconds * 1000);
    });
  });
});
