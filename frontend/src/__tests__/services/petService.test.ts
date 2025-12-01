/**
 * Tests for petService
 */
import { petService } from '../../services/petService';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  withTimeout: jest.fn((promise) => promise),
  withRetry: jest.fn((fn) => fn()),
}));

const mockSupabase = supabase as any;

describe('petService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPet', () => {
    it('should fetch pet from database', async () => {
      const mockPet = {
        id: 'pet-id',
        user_id: 'user-id',
        name: 'Fluffy',
        species: 'dog',
        breed: 'golden-retriever',
        health: 80,
        hunger: 70,
        happiness: 75,
        cleanliness: 85,
        energy: 90,
        age: 5,
        level: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockPet,
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

      const result = await petService.getPet('user-id');

      expect(result).toEqual(mockPet);
      expect(mockSupabase.from).toHaveBeenCalledWith('pets');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-id');
    });

    it('should return null when pet does not exist', async () => {
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

      const result = await petService.getPet('user-id');

      expect(result).toBe(null);
    });
  });

  describe('createPet', () => {
    it('should create pet successfully', async () => {
      const petData = {
        user_id: 'user-id',
        name: 'Fluffy',
        species: 'dog',
        breed: 'golden-retriever',
        health: 100,
        hunger: 100,
        happiness: 100,
        cleanliness: 100,
        energy: 100,
        age: 0,
        level: 1,
      };

      const mockPet = {
        id: 'pet-id',
        ...petData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockPet,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await petService.createPet(petData);

      expect(result).toEqual(mockPet);
      expect(mockInsert).toHaveBeenCalledWith(petData);
    });
  });

  describe('updatePet', () => {
    it('should update pet stats', async () => {
      const mockUpdatedPet = {
        id: 'pet-id',
        user_id: 'user-id',
        name: 'Fluffy',
        health: 85,
        hunger: 75,
        happiness: 80,
        cleanliness: 90,
        energy: 95,
        age: 5,
        level: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockUpdatedPet,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await petService.updatePet('pet-id', { health: 85 });

      expect(result).toEqual(mockUpdatedPet);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          health: 85,
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error when pet ID is missing', async () => {
      await expect(petService.updatePet('', { health: 100 })).rejects.toThrow('Pet ID is required');
    });
  });

  describe('updatePetStats', () => {
    it('should update multiple pet stats atomically', async () => {
      const mockUpdatedPet = {
        id: 'pet-id',
        user_id: 'user-id',
        health: 85,
        hunger: 75,
        happiness: 80,
        cleanliness: 90,
        energy: 95,
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockUpdatedPet,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await petService.updatePetStats('pet-id', {
        health: 85,
        hunger: 75,
        happiness: 80,
      });

      expect(result).toEqual(mockUpdatedPet);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          health: 85,
          hunger: 75,
          happiness: 80,
        })
      );
    });
  });

  describe('incrementAge', () => {
    it('should increment pet age', async () => {
      const mockPet = {
        id: 'pet-id',
        age: 5,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockPet,
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

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { ...mockPet, age: 6 },
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect,
      }).mockReturnValueOnce({
        update: mockUpdate,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: mockSelect2,
        }),
      });
      mockSelect2.mockReturnValue({
        single: mockSingle2,
      });

      const result = await petService.incrementAge('pet-id');

      expect(result.age).toBe(6);
    });

    it('should throw error when pet ID is missing', async () => {
      await expect(petService.incrementAge('')).rejects.toThrow('Pet ID is required');
    });
  });

  describe('levelUp', () => {
    it('should increment pet level', async () => {
      const mockPet = {
        id: 'pet-id',
        level: 2,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockPet,
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

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { ...mockPet, level: 3 },
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect,
      }).mockReturnValueOnce({
        update: mockUpdate,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: mockSelect2,
        }),
      });
      mockSelect2.mockReturnValue({
        single: mockSingle2,
      });

      const result = await petService.levelUp('pet-id');

      expect(result.level).toBe(3);
    });

    it('should throw error when pet ID is missing', async () => {
      await expect(petService.levelUp('')).rejects.toThrow('Pet ID is required');
    });
  });
});
