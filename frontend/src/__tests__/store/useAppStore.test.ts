/**
 * Tests for unified app store
 */
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.getState().reset();
  });

  describe('Pet state management', () => {
    it('should set pet correctly', () => {
      const { result } = renderHook(() => useAppStore());
      
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

      act(() => {
        result.current.setPet(mockPet);
      });

      expect(result.current.pet).toEqual(mockPet);
      expect(result.current.petStats).toEqual(mockPet.stats);
    });

    it('should update pet stats correctly', () => {
      const { result } = renderHook(() => useAppStore());
      
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

      act(() => {
        result.current.setPet(mockPet);
        result.current.updatePetStats({ health: 100, hunger: 80 });
      });

      expect(result.current.pet?.stats.health).toBe(100);
      expect(result.current.pet?.stats.hunger).toBe(80);
      expect(result.current.pet?.stats.happiness).toBe(70); // Unchanged
    });

    it('should clamp stats to valid range', () => {
      const { result } = renderHook(() => useAppStore());
      
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
          health: 50,
          hunger: 50,
          happiness: 50,
          cleanliness: 50,
          energy: 50,
          lastUpdated: new Date(),
        },
      };

      act(() => {
        result.current.setPet(mockPet);
        result.current.updatePetStats({ health: 150, hunger: -10 });
      });

      expect(result.current.pet?.stats.health).toBe(100);
      expect(result.current.pet?.stats.hunger).toBe(0);
    });
  });

  describe('Coins management', () => {
    it('should set coins correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCoins(100);
      });

      expect(result.current.coins).toBe(100);
    });

    it('should add coins correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCoins(50);
        result.current.addCoins(25);
      });

      expect(result.current.coins).toBe(75);
    });

    it('should deduct coins correctly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCoins(100);
        result.current.deductCoins(30);
      });

      expect(result.current.coins).toBe(70);
    });

    it('should prevent negative coins', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCoins(10);
        result.current.deductCoins(20);
      });

      expect(result.current.coins).toBe(0);
    });
  });

  describe('Inventory management', () => {
    it('should add inventory items', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addInventoryItem({
          itemId: 'food-1',
          itemName: 'Dog Food',
          category: 'food',
          quantity: 5,
        });
      });

      expect(result.current.inventory).toHaveLength(1);
      expect(result.current.inventory[0].quantity).toBe(5);
    });

    it('should stack inventory items with same ID', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addInventoryItem({
          itemId: 'food-1',
          itemName: 'Dog Food',
          category: 'food',
          quantity: 5,
        });
        result.current.addInventoryItem({
          itemId: 'food-1',
          itemName: 'Dog Food',
          category: 'food',
          quantity: 3,
        });
      });

      expect(result.current.inventory).toHaveLength(1);
      expect(result.current.inventory[0].quantity).toBe(8);
    });

    it('should remove inventory items', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addInventoryItem({
          itemId: 'food-1',
          itemName: 'Dog Food',
          category: 'food',
          quantity: 10,
        });
        result.current.removeInventoryItem('food-1', 3);
      });

      expect(result.current.inventory[0].quantity).toBe(7);
    });

    it('should remove item completely when quantity reaches zero', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addInventoryItem({
          itemId: 'food-1',
          itemName: 'Dog Food',
          category: 'food',
          quantity: 5,
        });
        result.current.removeInventoryItem('food-1', 5);
      });

      expect(result.current.inventory).toHaveLength(0);
    });
  });

  describe('Quest management', () => {
    it('should set active quests', () => {
      const { result } = renderHook(() => useAppStore());

      const quests = {
        daily: [
          {
            id: 'quest-1',
            quest_key: 'daily_feed',
            description: 'Feed your pet',
            quest_type: 'daily' as const,
            difficulty: 'easy' as const,
            rewards: { coins: 10, xp: 5, items: [] },
            target_value: 1,
            progress: 0,
            status: 'pending' as const,
          },
        ],
        weekly: [],
        event: [],
      };

      act(() => {
        result.current.setActiveQuests(quests);
      });

      expect(result.current.activeQuests.daily).toHaveLength(1);
      expect(result.current.activeQuests.daily[0].id).toBe('quest-1');
    });

    it('should complete quest and award rewards', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCoins(100);
        result.current.setXP(50);
        result.current.setActiveQuests({
          daily: [
            {
              id: 'quest-1',
              quest_key: 'daily_feed',
              description: 'Feed your pet',
              quest_type: 'daily' as const,
              difficulty: 'easy' as const,
              rewards: { coins: 10, xp: 5, items: [] },
              target_value: 1,
              progress: 1,
              status: 'pending' as const,
            },
          ],
          weekly: [],
          event: [],
        });
        result.current.completeQuest('quest-1', 10, 5);
      });

      expect(result.current.coins).toBe(110);
      expect(result.current.xp).toBe(55);
      expect(result.current.completedQuestIds.has('quest-1')).toBe(true);
      expect(result.current.activeQuests.daily[0].status).toBe('completed');
    });
  });

  describe('Loading states', () => {
    it('should manage loading states independently', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setPetLoading(true);
        result.current.setProfileLoading(true);
        result.current.setQuestsLoading(false);
      });

      expect(result.current.loading.pet).toBe(true);
      expect(result.current.loading.profile).toBe(true);
      expect(result.current.loading.quests).toBe(false);
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCoins(100);
        result.current.setXP(50);
        result.current.addInventoryItem({
          itemId: 'food-1',
          itemName: 'Dog Food',
          category: 'food',
          quantity: 5,
        });
        result.current.reset();
      });

      expect(result.current.coins).toBe(0);
      expect(result.current.xp).toBe(0);
      expect(result.current.inventory).toHaveLength(0);
      expect(result.current.pet).toBeNull();
    });
  });
});
