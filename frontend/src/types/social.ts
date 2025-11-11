export type FriendStatus = 'pending' | 'accepted' | 'declined';

export type FriendDirection = 'incoming' | 'outgoing' | 'friend';

export interface AchievementBadge {
  name: string;
  description?: string | null;
  earned_at?: string | null;
}

export interface PublicProfileSummary {
  id: string;
  user_id: string;
  pet_id: string;
  display_name: string;
  bio?: string | null;
  achievements: AchievementBadge[];
  total_xp: number;
  total_coins: number;
  is_visible: boolean;
}

export interface FriendListEntry {
  id: string;
  status: FriendStatus;
  direction: FriendDirection;
  counterpart_user_id: string;
  requested_at: string;
  responded_at?: string | null;
  profile?: PublicProfileSummary | null;
}

export interface FriendsListResponse {
  friends: FriendListEntry[];
  pending_incoming: FriendListEntry[];
  pending_outgoing: FriendListEntry[];
  total_count: number;
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


