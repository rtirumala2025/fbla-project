/**
 * API client for social features
 * Handles friends, public profiles, and leaderboards
 */
import { apiRequest } from './httpClient';
import type {
  FriendsListResponse,
  LeaderboardMetric,
  LeaderboardResponse,
  PublicProfilesResponse,
  PublicProfileSummary,
  LeaderboardEntry,
} from '../types/social';

const useMock = process.env.REACT_APP_USE_MOCK === 'true';

// Generate mock friends list
function generateMockFriendsList(): FriendsListResponse {
  return {
    friends: [],
    pending_incoming: [],
    pending_outgoing: [],
    total_count: 0,
  };
}

// Generate mock public profiles
function generateMockPublicProfiles(): PublicProfilesResponse {
  return {
    profiles: [
      {
        id: '1',
        user_id: 'user-1',
        pet_id: 'pet-1',
        display_name: 'Alex the Explorer',
        bio: 'Love exploring with my pet companion!',
        achievements: [
          { name: 'First Steps', description: 'Completed first quest', earned_at: new Date().toISOString() },
          { name: 'Coin Collector', description: 'Earned 1000 coins', earned_at: new Date().toISOString() },
        ],
        total_xp: 1250,
        total_coins: 1800,
        is_visible: true,
      },
      {
        id: '2',
        user_id: 'user-2',
        pet_id: 'pet-2',
        display_name: 'Sam the Caregiver',
        bio: 'Dedicated to providing the best care for my pet.',
        achievements: [
          { name: 'Care Master', description: 'Maintained 100% health for 7 days', earned_at: new Date().toISOString() },
        ],
        total_xp: 980,
        total_coins: 1200,
        is_visible: true,
      },
      {
        id: '3',
        user_id: 'user-3',
        pet_id: 'pet-3',
        display_name: 'Jordan the Achiever',
        bio: 'Always striving for new goals!',
        achievements: [
          { name: 'Goal Getter', description: 'Completed 5 goals', earned_at: new Date().toISOString() },
          { name: 'Social Butterfly', description: 'Made 10 friends', earned_at: new Date().toISOString() },
        ],
        total_xp: 2100,
        total_coins: 2500,
        is_visible: true,
      },
    ],
  };
}

// Generate mock leaderboard
function generateMockLeaderboard(metric: LeaderboardMetric): LeaderboardResponse {
  const entries: LeaderboardEntry[] = [
    {
      user_id: 'user-3',
      display_name: 'Jordan the Achiever',
      pet_id: 'pet-3',
      total_xp: 2100,
      total_coins: 2500,
      achievements_count: 8,
      rank: 1,
      metric_value: metric === 'xp' ? 2100 : metric === 'coins' ? 2500 : 8,
    },
    {
      user_id: 'user-1',
      display_name: 'Alex the Explorer',
      pet_id: 'pet-1',
      total_xp: 1250,
      total_coins: 1800,
      achievements_count: 5,
      rank: 2,
      metric_value: metric === 'xp' ? 1250 : metric === 'coins' ? 1800 : 5,
    },
    {
      user_id: 'user-2',
      display_name: 'Sam the Caregiver',
      pet_id: 'pet-2',
      total_xp: 980,
      total_coins: 1200,
      achievements_count: 3,
      rank: 3,
      metric_value: metric === 'xp' ? 980 : metric === 'coins' ? 1200 : 3,
    },
  ];

  return {
    metric,
    entries,
  };
}

export async function fetchFriends(): Promise<FriendsListResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockFriendsList();
  }

  try {
    return await apiRequest<FriendsListResponse>('/api/social/friends');
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Social API unavailable, using mock friends data', error);
    return generateMockFriendsList();
  }
}

export async function sendFriendRequest(friendId: string): Promise<FriendsListResponse> {
  return apiRequest<FriendsListResponse>('/api/social/friends/request', {
    method: 'POST',
    body: JSON.stringify({ friend_id: friendId }),
  });
}

export async function respondToFriendRequest(
  requestId: string,
  action: 'accept' | 'decline'
): Promise<FriendsListResponse> {
  return apiRequest<FriendsListResponse>('/api/social/friends/respond', {
    method: 'PATCH',
    body: JSON.stringify({ request_id: requestId, action }),
  });
}

export async function fetchPublicProfiles(search?: string): Promise<PublicProfilesResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockData = generateMockPublicProfiles();
    // Filter by search term if provided
    if (search) {
      mockData.profiles = mockData.profiles.filter(
        p => p.display_name.toLowerCase().includes(search.toLowerCase()) ||
             p.bio?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return mockData;
  }

  try {
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    const query = params.toString();
    return await apiRequest<PublicProfilesResponse>(`/api/social/public_profiles${query ? `?${query}` : ''}`);
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Social API unavailable, using mock profiles data', error);
    const mockData = generateMockPublicProfiles();
    if (search) {
      mockData.profiles = mockData.profiles.filter(
        p => p.display_name.toLowerCase().includes(search.toLowerCase()) ||
             p.bio?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return mockData;
  }
}

export async function fetchLeaderboard(metric: LeaderboardMetric, limit = 20): Promise<LeaderboardResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockLeaderboard(metric);
  }

  try {
    const params = new URLSearchParams({ metric, limit: limit.toString() });
    return await apiRequest<LeaderboardResponse>(`/api/social/leaderboard?${params.toString()}`);
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Social API unavailable, using mock leaderboard data', error);
    return generateMockLeaderboard(metric);
  }
}

