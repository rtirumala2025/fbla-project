/**
 * API client for social features
 * Handles friend requests, public profiles, and leaderboard
 */
import { apiRequest } from './httpClient';

const BASE_PATH = '/api/social';

// Types matching backend schemas
export interface AchievementBadge {
  name: string;
  description?: string;
  earned_at?: string;
}

export interface PublicProfileSummary {
  id: string;
  user_id: string;
  pet_id: string;
  display_name: string;
  bio?: string;
  achievements: AchievementBadge[];
  total_xp: number;
  total_coins: number;
  is_visible: boolean;
}

export type FriendStatus = 'pending' | 'accepted' | 'declined';
export type FriendDirection = 'incoming' | 'outgoing' | 'friend';

export interface FriendListEntry {
  id: string;
  status: FriendStatus;
  direction: FriendDirection;
  counterpart_user_id: string;
  requested_at: string;
  responded_at?: string;
  profile?: PublicProfileSummary;
}

export interface FriendsListResponse {
  friends: FriendListEntry[];
  pending_incoming: FriendListEntry[];
  pending_outgoing: FriendListEntry[];
  total_count: number;
}

export interface FriendRequestPayload {
  friend_id: string;
}

export interface FriendRespondPayload {
  request_id: string;
  action: 'accept' | 'decline';
}

export interface PublicProfilesResponse {
  profiles: PublicProfileSummary[];
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  pet_id: string;
  total_xp: number;
  total_coins: number;
  achievements_count: number;
  rank: number;
  metric_value: number;
}

export type LeaderboardMetric = 'xp' | 'coins' | 'achievements';

export interface LeaderboardResponse {
  metric: LeaderboardMetric;
  entries: LeaderboardEntry[];
}

/**
 * Get the authenticated user's friendship graph
 */
export async function getFriends(): Promise<FriendsListResponse> {
  return apiRequest<FriendsListResponse>(`${BASE_PATH}/friends`);
}

/**
 * Send a friend request to another user
 */
export async function sendFriendRequest(payload: FriendRequestPayload): Promise<FriendsListResponse> {
  return apiRequest<FriendsListResponse>(`${BASE_PATH}/friends/request`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Accept or decline a friend request
 */
export async function respondToFriendRequest(payload: FriendRespondPayload): Promise<FriendsListResponse> {
  return apiRequest<FriendsListResponse>(`${BASE_PATH}/friends/respond`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * List public profiles with optional search
 */
export async function getPublicProfiles(search?: string, limit: number = 20): Promise<PublicProfilesResponse> {
  const params = new URLSearchParams();
  if (search) {
    params.append('search', search);
  }
  params.append('limit', limit.toString());
  
  const queryString = params.toString();
  const url = queryString ? `${BASE_PATH}/public_profiles?${queryString}` : `${BASE_PATH}/public_profiles`;
  
  return apiRequest<PublicProfilesResponse>(url);
}

/**
 * Get the social leaderboard for friends
 */
export async function getLeaderboard(metric: LeaderboardMetric = 'xp', limit: number = 20): Promise<LeaderboardResponse> {
  const params = new URLSearchParams();
  params.append('metric', metric);
  params.append('limit', limit.toString());
  
  return apiRequest<LeaderboardResponse>(`${BASE_PATH}/leaderboard?${params.toString()}`);
}

