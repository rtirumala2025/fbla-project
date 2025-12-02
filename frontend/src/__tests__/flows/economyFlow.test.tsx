/**
 * Integration tests for Economy Flow
 * Tests shop purchases, coin balance updates, and inventory management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Shop } from '../../pages/Shop';
import { useAppStore } from '../../store/useAppStore';
import { shopService } from '../../services/shopService';

jest.mock('../../store/useAppStore');
jest.mock('../../services/shopService');

const mockShopItems = [
  {
    id: 'item-1',
    name: 'Basic Food',
    price: 10,
    category: 'food',
    stock: 100,
  },
  {
    id: 'item-2',
    name: 'Toy Ball',
    price: 25,
    category: 'toy',
    stock: 50,
  },
];

describe('Economy Flow', () => {
  const mockUpdateCoins = jest.fn();
  const mockAddToInventory = jest.fn();

  beforeEach(() => {
    (useAppStore as jest.Mock).mockReturnValue({
      coins: 100,
      updateCoins: mockUpdateCoins,
      addToInventory: mockAddToInventory,
    });

    (shopService.getItems as jest.Mock) = jest.fn().mockResolvedValue(mockShopItems);

    (shopService.purchaseItems as jest.Mock) = jest.fn().mockResolvedValue({
      success: true,
      newBalance: 90,
      items_added: [{ item_id: 'item-1', quantity: 1 }],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays shop items', async () => {
    render(<Shop />);

    await waitFor(() => {
      expect(screen.getByText('Basic Food')).toBeInTheDocument();
      expect(screen.getByText('Toy Ball')).toBeInTheDocument();
    });
  });

  it('completes purchase flow', async () => {
    render(<Shop />);

    await waitFor(() => {
      expect(screen.getByText('Basic Food')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: /buy/i });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(shopService.purchaseItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'item-1',
            quantity: 1,
          }),
        ])
      );
      expect(mockUpdateCoins).toHaveBeenCalledWith(90);
      expect(mockAddToInventory).toHaveBeenCalled();
    });
  });

  it('prevents purchase with insufficient funds', async () => {
    (useAppStore as jest.Mock).mockReturnValue({
      coins: 5,
      updateCoins: mockUpdateCoins,
      addToInventory: mockAddToInventory,
    });

    (shopService.purchaseItems as jest.Mock).mockRejectedValueOnce(
      new Error('Insufficient funds')
    );

    render(<Shop />);

    await waitFor(() => {
      expect(screen.getByText('Basic Food')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: /buy/i });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText(/insufficient/i)).toBeInTheDocument();
    });
  });

  it('updates coin balance after purchase', async () => {
    render(<Shop />);

    await waitFor(() => {
      expect(screen.getByText('Basic Food')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: /buy/i });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockUpdateCoins).toHaveBeenCalledWith(90);
    });
  });

  it('adds items to inventory after purchase', async () => {
    render(<Shop />);

    await waitFor(() => {
      expect(screen.getByText('Basic Food')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: /buy/i });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockAddToInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          item_id: 'item-1',
          quantity: 1,
        })
      );
    });
  });

  it('handles purchase errors gracefully', async () => {
    (shopService.purchaseItems as jest.Mock).mockRejectedValueOnce(
      new Error('Purchase failed')
    );

    render(<Shop />);

    await waitFor(() => {
      expect(screen.getByText('Basic Food')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: /buy/i });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('displays current coin balance', () => {
    render(<Shop />);

    expect(screen.getByText(/100/i)).toBeInTheDocument();
  });

  it('disables buy button when item is out of stock', async () => {
    const outOfStockItems = [
      {
        ...mockShopItems[0],
        stock: 0,
      },
    ];

    (shopService.getItems as jest.Mock).mockResolvedValueOnce(outOfStockItems);

    render(<Shop />);

    await waitFor(() => {
      const buyButton = screen.getByRole('button', { name: /buy/i });
      expect(buyButton).toBeDisabled();
    });
  });
});
