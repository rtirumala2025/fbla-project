/**
 * Integration tests for Pet Care Flow
 * Tests complete pet care workflow from feeding to stat updates
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PetCarePanel } from '../../components/pets/PetCarePanel';
import { useAppStore } from '../../store/useAppStore';
import { petService } from '../../services/petService';

jest.mock('../../store/useAppStore');
jest.mock('../../services/petService');

const mockPet = {
  id: 'pet-1',
  name: 'TestPet',
  stats: {
    hunger: 50,
    happiness: 70,
    hygiene: 60,
    energy: 65,
    health: 75,
    mood: 'content',
  },
};

describe('Pet Care Flow', () => {
  const mockUpdatePetStats = jest.fn();
  const mockGetPet = jest.fn();

  beforeEach(() => {
    (useAppStore as jest.Mock).mockReturnValue({
      pet: mockPet,
      updatePetStats: mockUpdatePetStats,
      coins: 100,
    });

    (petService.feedPet as jest.Mock) = jest.fn().mockResolvedValue({
      success: true,
      pet: {
        ...mockPet,
        stats: {
          ...mockPet.stats,
          hunger: 80,
        },
      },
    });

    (petService.playWithPet as jest.Mock) = jest.fn().mockResolvedValue({
      success: true,
      pet: {
        ...mockPet,
        stats: {
          ...mockPet.stats,
          happiness: 85,
          energy: 55,
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('completes feed pet flow', async () => {
    render(<PetCarePanel />);

    const feedButton = screen.getByRole('button', { name: /feed/i });
    fireEvent.click(feedButton);

    await waitFor(() => {
      expect(petService.feedPet).toHaveBeenCalled();
      expect(mockUpdatePetStats).toHaveBeenCalledWith(
        expect.objectContaining({
          hunger: 80,
        })
      );
    });
  });

  it('completes play with pet flow', async () => {
    render(<PetCarePanel />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(petService.playWithPet).toHaveBeenCalled();
      expect(mockUpdatePetStats).toHaveBeenCalledWith(
        expect.objectContaining({
          happiness: 85,
          energy: 55,
        })
      );
    });
  });

  it('completes bathe pet flow', async () => {
    (petService.bathePet as jest.Mock) = jest.fn().mockResolvedValue({
      success: true,
      pet: {
        ...mockPet,
        stats: {
          ...mockPet.stats,
          hygiene: 90,
        },
      },
    });

    render(<PetCarePanel />);

    const batheButton = screen.getByRole('button', { name: /bathe/i });
    fireEvent.click(batheButton);

    await waitFor(() => {
      expect(petService.bathePet).toHaveBeenCalled();
      expect(mockUpdatePetStats).toHaveBeenCalled();
    });
  });

  it('shows error when pet care action fails', async () => {
    (petService.feedPet as jest.Mock).mockRejectedValueOnce(
      new Error('Action failed')
    );

    render(<PetCarePanel />);

    const feedButton = screen.getByRole('button', { name: /feed/i });
    fireEvent.click(feedButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('updates pet stats in store after successful action', async () => {
    render(<PetCarePanel />);

    const feedButton = screen.getByRole('button', { name: /feed/i });
    fireEvent.click(feedButton);

    await waitFor(() => {
      expect(mockUpdatePetStats).toHaveBeenCalledWith(
        expect.objectContaining({
          hunger: expect.any(Number),
        })
      );
    });
  });

  it('disables buttons during action processing', async () => {
    let resolveAction: (value: any) => void;
    const actionPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    (petService.feedPet as jest.Mock).mockReturnValueOnce(actionPromise);

    render(<PetCarePanel />);

    const feedButton = screen.getByRole('button', { name: /feed/i });
    fireEvent.click(feedButton);

    expect(feedButton).toBeDisabled();

    resolveAction!({
      success: true,
      pet: mockPet,
    });

    await waitFor(() => {
      expect(feedButton).not.toBeDisabled();
    });
  });
});
