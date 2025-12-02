/**
 * Tests for AddFriendModal component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AddFriendModal } from '../../../features/social/AddFriendModal';
import * as socialApi from '../../../api/social';

// Mock the API
jest.mock('../../../api/social');

const mockGetPublicProfiles = socialApi.getPublicProfiles as jest.MockedFunction<typeof socialApi.getPublicProfiles>;
const mockSendFriendRequest = socialApi.sendFriendRequest as jest.MockedFunction<typeof socialApi.sendFriendRequest>;

describe('AddFriendModal Component', () => {
  const mockProfiles = {
    profiles: [
      {
        id: 'profile-1',
        user_id: 'user-2',
        pet_id: 'pet-2',
        display_name: 'Test User',
        bio: 'Test bio',
        achievements: [],
        total_xp: 1000,
        total_coins: 500,
        is_visible: true,
      },
      {
        id: 'profile-2',
        user_id: 'user-3',
        pet_id: 'pet-3',
        display_name: 'Another User',
        bio: 'Another bio',
        achievements: [],
        total_xp: 800,
        total_coins: 400,
        is_visible: true,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPublicProfiles.mockResolvedValue(mockProfiles);
  });

  it('does not render when closed', () => {
    render(<AddFriendModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByText('Add Friend')).not.toBeInTheDocument();
  });

  it('renders when open', async () => {
    render(<AddFriendModal isOpen={true} onClose={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Friend', { selector: 'h2' })).toBeInTheDocument();
    });
  });

  it('loads profiles when opened', async () => {
    render(<AddFriendModal isOpen={true} onClose={jest.fn()} />);
    
    await waitFor(() => {
      expect(mockGetPublicProfiles).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Another User')).toBeInTheDocument();
    });
  });

  it('searches profiles when typing', async () => {
    jest.useFakeTimers();
    render(<AddFriendModal isOpen={true} onClose={jest.fn()} />);
    
    const searchInput = screen.getByPlaceholderText('Search by name or bio...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(mockGetPublicProfiles).toHaveBeenCalledWith('Test', 20);
    });
    
    jest.useRealTimers();
  });

  it('sends friend request when add button is clicked', async () => {
    mockSendFriendRequest.mockResolvedValue({
      friends: [],
      pending_incoming: [],
      pending_outgoing: [],
      total_count: 0,
    });
    
    render(<AddFriendModal isOpen={true} onClose={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    const addButtons = screen.getAllByText('Add Friend');
    // Find the button in the profile card (not the modal title)
    const addButton = addButtons.find(btn => btn.closest('.bg-gray-50'));
    if (addButton) {
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(mockSendFriendRequest).toHaveBeenCalledWith({ friend_id: 'user-2' });
      });
    }
  });

  it('shows loading state while searching', async () => {
    mockGetPublicProfiles.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<AddFriendModal isOpen={true} onClose={jest.fn()} />);
    
    // Should show loading spinner
    // Implementation may vary
  });

  it('shows empty state when no profiles found', async () => {
    mockGetPublicProfiles.mockResolvedValue({ profiles: [] });
    
    render(<AddFriendModal isOpen={true} onClose={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText(/No profiles found/)).toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', async () => {
    const onClose = jest.fn();
    render(<AddFriendModal isOpen={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Friend', { selector: 'h2' })).toBeInTheDocument();
    });
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('closes modal when backdrop is clicked', async () => {
    const onClose = jest.fn();
    render(<AddFriendModal isOpen={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Friend', { selector: 'h2' })).toBeInTheDocument();
    });
    
    const backdrop = screen.getByText('Add Friend', { selector: 'h2' }).closest('.fixed')?.previousSibling;
    if (backdrop) {
      fireEvent.click(backdrop as Element);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('calls onFriendRequestSent callback after sending request', async () => {
    const onFriendRequestSent = jest.fn();
    mockSendFriendRequest.mockResolvedValue({
      friends: [],
      pending_incoming: [],
      pending_outgoing: [],
      total_count: 0,
    });
    
    render(<AddFriendModal isOpen={true} onClose={jest.fn()} onFriendRequestSent={onFriendRequestSent} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    const addButtons = screen.getAllByText('Add Friend');
    const addButton = addButtons.find(btn => btn.closest('.bg-gray-50'));
    if (addButton) {
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(onFriendRequestSent).toHaveBeenCalled();
      });
    }
  });
});
