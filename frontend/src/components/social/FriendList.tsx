/**
 * FriendList Component
 * Displays the user's friends list with real-time updates
 */
import React from 'react';
import { User, UserPlus, Trophy, Coins, Sparkles } from 'lucide-react';
import type { FriendListEntry } from '../../api/social';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface FriendListProps {
  friends: FriendListEntry[];
  loading?: boolean;
  onViewProfile?: (userId: string) => void;
}

export const FriendList: React.FC<FriendListProps> = ({ friends, loading, onViewProfile }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No friends yet</p>
        <p className="text-sm text-gray-500 mt-2">Start adding friends to see them here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors cursor-pointer"
          onClick={() => onViewProfile?.(friend.counterpart_user_id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {friend.profile?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">
                  {friend.profile?.display_name || 'Unknown User'}
                </h3>
                {friend.profile?.bio && (
                  <p className="text-sm text-gray-600 truncate mt-1">{friend.profile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    <span>{friend.profile?.total_xp || 0} XP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    <span>{friend.profile?.total_coins || 0}</span>
                  </div>
                  {friend.profile && friend.profile.achievements.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{friend.profile.achievements.length} achievements</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <UserPlus className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
};

