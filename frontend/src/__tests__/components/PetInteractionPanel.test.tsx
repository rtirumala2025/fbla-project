/**
 * Tests for PetInteractionPanel component
 * Tests state transitions, command processing, and name validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PetInteractionPanel } from '../../components/pets/PetInteractionPanel';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
};

describe('PetInteractionPanel', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: mockUser,
    });

    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders pet interaction panel', () => {
    render(<PetInteractionPanel />);
    expect(screen.getByText(/pet/i)).toBeInTheDocument();
  });

  it('displays name input field', () => {
    render(<PetInteractionPanel />);
    const nameInput = screen.getByPlaceholderText(/enter pet name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('validates pet name on input', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        suggestions: [],
      }),
    });

    render(<PetInteractionPanel />);
    const nameInput = screen.getByPlaceholderText(/enter pet name/i);

    fireEvent.change(nameInput, { target: { value: 'Luna' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('shows validation suggestions for invalid names', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: false,
        suggestions: ['Luna', 'Max', 'Bella'],
      }),
    });

    render(<PetInteractionPanel />);
    const nameInput = screen.getByPlaceholderText(/enter pet name/i);

    fireEvent.change(nameInput, { target: { value: 'X' } });

    await waitFor(() => {
      expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
    });
  });

  it('sends command when submit button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Pet fed successfully',
        results: [],
      }),
    });

    render(<PetInteractionPanel />);
    const commandInput = screen.getByPlaceholderText(/type a command/i);
    const submitButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(commandInput, { target: { value: 'feed my pet' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('displays command response in chat', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Pet is happy!',
        results: [],
      }),
    });

    render(<PetInteractionPanel />);
    const commandInput = screen.getByPlaceholderText(/type a command/i);
    const submitButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(commandInput, { target: { value: 'status' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Pet is happy/i)).toBeInTheDocument();
    });
  });

  it('handles command errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<PetInteractionPanel />);
    const commandInput = screen.getByPlaceholderText(/type a command/i);
    const submitButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(commandInput, { target: { value: 'invalid command' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('clears input after successful command', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Success',
        results: [],
      }),
    });

    render(<PetInteractionPanel />);
    const commandInput = screen.getByPlaceholderText(/type a command/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(commandInput, { target: { value: 'feed' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(commandInput.value).toBe('');
    });
  });

  it('shows loading state during command processing', async () => {
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

    render(<PetInteractionPanel />);
    const commandInput = screen.getByPlaceholderText(/type a command/i);
    const submitButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(commandInput, { target: { value: 'feed' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    resolveFetch!({
      ok: true,
      json: async () => ({ success: true, message: 'Done', results: [] }),
    });

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});
