import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PetNameInput from '../PetNameInput';
import apiClient from '../../services/apiClient';

jest.mock('../../services/apiClient');

describe('PetNameInput', () => {
  const mockOnChange = jest.fn();
  const mockOnValidationChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders input field', () => {
    render(
      <PetNameInput
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByPlaceholderText(/Enter pet name/i)).toBeInTheDocument();
  });

  it('validates name and shows suggestions', async () => {
    const mockResponse = {
      data: {
        valid: true,
        suggestions: ['Buddy', 'Max', 'Luna'],
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <PetNameInput
        value="Test"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Wait for debounce
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/ai/pet_name_suggestions', {
        input_name: 'Test',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Great name/i)).toBeInTheDocument();
      expect(screen.getByText('Buddy')).toBeInTheDocument();
    });
  });

  it('shows error for invalid name', async () => {
    const mockResponse = {
      data: {
        valid: false,
        suggestions: ['Buddy', 'Max'],
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <PetNameInput
        value="Invalid123!@#"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });

  it('handles suggestion click', async () => {
    const mockResponse = {
      data: {
        valid: true,
        suggestions: ['Buddy'],
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <PetNameInput
        value="Test"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      const suggestionButton = screen.getByText('Buddy');
      fireEvent.click(suggestionButton);
      expect(mockOnChange).toHaveBeenCalledWith('Buddy');
    });
  });
});
