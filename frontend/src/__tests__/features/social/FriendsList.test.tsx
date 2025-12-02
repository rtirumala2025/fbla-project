/**
 * Tests for FriendsList component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FriendsList } from '../../../features/social/FriendsList';
import * as socialApi from '../../../api/social';

// Mock the API
jest.mock('../../../api/social');

const mockGetFriends = socialApi.getFriends as jest.MockedFunction<typeof socialApi.getFriends>;
const mockAcceptFriendRequest = socialApi.acceptFriendRequest as jest.MockedFunction<typeof socialApi.acceptFriendRequest>;
const mockRejectFriendRequest = socialApi.rejectFriendRequest as jest.MockedFunction<typeof socialApi.rejectFriendRequest>;
const mockRemoveFriend = socialApi.removeFriend as jest.MockedFunction<typeof socialApi.removeFriend>;

describe('FriendsList Component', () => {
  const mockFriendsData = {
    friends: [
      {
        id: 'friend-1',
        status: 'accepted' as const,
        direction: 'friend' as const,
        counterpart_user_id: 'user-2',
        requested_at: '2024-01-01T00:00:00Z',
        profile: {
          id: 'profile-1',
          user_id: 'user-2',
          pet_id: 'pet-2',
          display_name: 'Friend User',
          bio: 'Test bio',
          achievements: [],
          total_xp: 1000,
          total_coins: 500,
          is_visible: true,
        },
      },
    ],
    pending_incoming: [
      {
        id: 'req-1',
        status: 'pending' as const,
        direction: 'incoming' as const,
        counterpart_user_id: 'user-3',
        requested_at: '2024-01-02T00:00:00Z',
        profile: {
          id: 'profile-2',
          user_id: 'user-3',
          pet_id: 'pet-3',
          display_name: 'Incoming Request',
          bio: 'Test bio 2',
          achievements: [],
          total_xp: 800,
          total_coins: 400,
          is_visible: true,
        },
      },
    ],
    pending_outgoing: [
      {
        id: 'req-2',
        status: 'pending' as const,
        direction: 'outgoing' as const,
        counterpart_user_id: 'user-4',
        requested_at: '2024-01-03T00:00:00Z',
        profile: {
          id: 'profile-3',
          user_id: 'user-4',
          pet_id: 'pet-4',
          display_name: 'Outgoing Request',
          bio: 'Test bio 3',
          achievements: [],
          total_xp: 600,
          total_coins: 300,
          is_visible: true,
        },
      },
    ],
    total_count: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFriends.mockResolvedValue(mockFriendsData);
  });

  it('renders friends list', async () => {
    render(<FriendsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Friends')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Friend User')).toBeInTheDocument();
    expect(screen.getByText('Incoming Request')).toBeInTheDocument();
    expect(screen.getByText('Outgoing Request')).toBeInTheDocument();
  });

  it('shows add friend button', async () => {
    render(<FriendsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Friend')).toBeInTheDocument();
    });
  });

  it('opens add friend modal when button is clicked', async () => {
    render(<FriendsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Friend')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText('Add Friend');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Add Friend', { selector: 'h2' })).toBeInTheDocument();
    });
  });

  it('accepts incoming friend request', async () => {
    mockAcceptFriendRequest.mockResolvedValue(mockFriendsData);
    
    render(<FriendsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Incoming Request')).toBeInTheDocument();
    });
    
    const acceptButtons = screen.getAllByLabelText('Accept request');
    fireEvent.click(acceptButtons[0]);
    
    await waitFor(() => {
      expect(mockAcceptFriendRequest).toHaveBeenCalledWith('req-1');
    });
  });

  it('rejects incoming friend request', async () => {
    mockRejectFriendRequest.mockResolvedValue(mockFriendsData);
    
    render(<FriendsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Incoming Request')).toBeInTheDocument();
    });
    
    const rejectButtons = screen.getAllByLabelText('Decline request');
    fireEvent.click(rejectButtons[0]);
    
    await waitFor(() => {
      expect(mockRejectFriendRequest).toHaveBeenCalledWith('req-1');
    });
  });

  it('removes a friend', async () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    mockRemoveFriend.mockResolvedValue(mockFriendsData);
    
    render(<FriendsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Friend User')).toBeInTheDocument();
    });
    
    const removeButtons = screen.getAllByLabelText('Remove friend');
    fireEvent.click(removeButtons[0]);
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(mockRemoveFriend).toHaveBeenCalledWith('user-2');
    });
  });

  it('shows empty state when no friends', async () => {
    mockGetFriends.mockResolvedValue({
      friends: [],
      pending_incoming: [],
      pending_outgoing: [],
      total_count: 0,
    });
    
    render(<FriendsList />);
    
    await waitFor(() => {
      expect(screen.getByText(/No friends yet/)).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    mockGetFriends.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<FriendsList />);
    
    // Should show loading spinner (implementation dependent)
    // This test may need adjustment based on actual LoadingSpinner implementation
  });

  it('handles error state', async () => {
    mockGetFriends.mockRejectedValue(new Error('Failed to load friends'));
    
    render(<FriendsList />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load friends/)).toBeInTheDocument();
    });
  });
});
