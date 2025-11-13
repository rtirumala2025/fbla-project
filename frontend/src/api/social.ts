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
} from '../types/social';

export async function fetchFriends(): Promise<FriendsListResponse> {
  return apiRequest<FriendsListResponse>('/api/social/friends');
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
  const params = new URLSearchParams();
  if (search) {
    params.set('search', search);
  }
  const query = params.toString();
  return apiRequest<PublicProfilesResponse>(`/api/social/public_profiles${query ? `?${query}` : ''}`);
}

export async function fetchLeaderboard(metric: LeaderboardMetric, limit = 20): Promise<LeaderboardResponse> {
  const params = new URLSearchParams({ metric, limit: limit.toString() });
  return apiRequest<LeaderboardResponse>(`/api/social/leaderboard?${params.toString()}`);
}

