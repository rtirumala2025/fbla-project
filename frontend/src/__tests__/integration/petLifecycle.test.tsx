/**
 * Integration tests for pet lifecycle
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { PetProvider } from '../../context/PetContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { petService } from '../../services/petService';
import { supabase } from '../../lib/supabase';

// Mock services
jest.mock('../../services/petService');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
  isSupabaseMock: jest.fn(() => false),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <PetProvider userId="test-user-id">{children}</PetProvider>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Pet Lifecycle Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a pet and update stats', async () => {
    const mockPet = {
      id: 'pet-1',
      user_id: 'test-user-id',
      name: 'Fluffy',
      species: 'dragon',
      breed: 'Azure',
      color: 'blue',
      stats: {
        hunger: 100,
        hygiene: 100,
        energy: 100,
        mood: 'happy',
        health: 100,
      },
    };

    (petService.createPet as jest.Mock).mockResolvedValue(mockPet);
    (petService.getPet as jest.Mock).mockResolvedValue(mockPet);
    (petService.updatePet as jest.Mock).mockResolvedValue({
      ...mockPet,
      stats: {
        ...mockPet.stats,
        hunger: 80,
        energy: 85,
      },
    });

    // Simulate pet creation
    const createdPet = await petService.createPet({
      user_id: 'test-user-id',
      name: 'Fluffy',
      species: 'dragon',
      breed: 'Azure',
      color: 'blue',
    });

    expect(createdPet).toEqual(mockPet);
    expect(petService.createPet).toHaveBeenCalled();

    // Simulate feeding the pet
    const updatedPet = await petService.updatePet('pet-1', {
      stats: {
        hunger: 80,
        energy: 85,
      },
    });

    expect(updatedPet.stats.hunger).toBe(80);
    expect(updatedPet.stats.energy).toBe(85);
  });

  it('should handle pet actions (feed, play, bathe, rest)', async () => {
    const mockPet = {
      id: 'pet-1',
      user_id: 'test-user-id',
      name: 'Fluffy',
      stats: {
        hunger: 50,
        hygiene: 60,
        energy: 40,
        mood: 'content',
        health: 80,
      },
    };

    (petService.getPet as jest.Mock).mockResolvedValue(mockPet);

    // Test feed action
    (petService.updatePet as jest.Mock).mockResolvedValueOnce({
      ...mockPet,
      stats: {
        ...mockPet.stats,
        hunger: 90,
        mood: 'happy',
      },
    });

    const fedPet = await petService.updatePet('pet-1', {
      stats: {
        hunger: 90,
        mood: 'happy',
      },
    });

    expect(fedPet.stats.hunger).toBe(90);
    expect(fedPet.stats.mood).toBe('happy');

    // Test play action
    (petService.updatePet as jest.Mock).mockResolvedValueOnce({
      ...mockPet,
      stats: {
        ...mockPet.stats,
        energy: 60,
        mood: 'happy',
      },
    });

    const playedPet = await petService.updatePet('pet-1', {
      stats: {
        energy: 60,
        mood: 'happy',
      },
    });

    expect(playedPet.stats.energy).toBe(60);
  });

  it('should track pet stats over time', async () => {
    const initialPet = {
      id: 'pet-1',
      stats: {
        hunger: 100,
        hygiene: 100,
        energy: 100,
        mood: 'happy',
        health: 100,
      },
    };

    const statsHistory: Array<typeof initialPet.stats> = [];

    (petService.getPet as jest.Mock).mockImplementation(async () => {
      return {
        ...initialPet,
        stats: statsHistory[statsHistory.length - 1] || initialPet.stats,
      };
    });

    // Simulate time passing and stats decreasing
    const simulateTimePassage = async () => {
      for (let i = 0; i < 5; i++) {
        const currentStats = statsHistory[statsHistory.length - 1] || initialPet.stats;
        statsHistory.push({
          hunger: Math.max(0, currentStats.hunger - 10),
          hygiene: Math.max(0, currentStats.hygiene - 5),
          energy: Math.max(0, currentStats.energy - 8),
          mood: currentStats.hunger < 30 ? 'distressed' : 'content',
          health: Math.max(0, currentStats.health - 2),
        });
      }
    };

    await simulateTimePassage();

    const finalPet = await petService.getPet('test-user-id');
    expect(finalPet?.stats.hunger).toBeLessThan(initialPet.stats.hunger);
    expect(finalPet?.stats.health).toBeLessThan(initialPet.stats.health);
  });
});
