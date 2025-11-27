/**
 * PublicProfilesGrid Component
 * Displays a grid of public profiles with search functionality
 */
import React, { useState } from 'react';
import { Search, User, Trophy, Coins, Sparkles } from 'lucide-react';
import type { PublicProfileSummary } from '../../api/social';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface PublicProfilesGridProps {
  profiles: PublicProfileSummary[];
  loading?: boolean;
  onSendRequest?: (userId: string) => Promise<void>;
  onViewProfile?: (userId: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: (query: string) => void;
}

export const PublicProfilesGrid: React.FC<PublicProfilesGridProps> = ({
  profiles,
  loading,
  onSendRequest,
  onViewProfile,
  searchValue = '',
  onSearchChange,
  onSearch,
}) => {
  const [requesting, setRequesting] = useState<Set<string>>(new Set());

  const handleSendRequest = async (userId: string) => {
    if (requesting.has(userId) || !onSendRequest) return;
    setRequesting((prev) => new Set(prev).add(userId));
    try {
      await onSendRequest(userId);
    } finally {
      setRequesting((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchValue);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search for users..."
          className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
        />
      </form>

      {/* Profiles Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No profiles found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchValue ? 'Try a different search term' : 'No public profiles available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => {
            const isRequesting = requesting.has(profile.user_id);
            return (
              <div
                key={profile.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => onViewProfile?.(profile.user_id)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {profile.display_name[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{profile.display_name}</h3>
                      {profile.bio && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{profile.bio}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    <span>{profile.total_xp} XP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    <span>{profile.total_coins}</span>
                  </div>
                  {profile.achievements.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{profile.achievements.length}</span>
                    </div>
                  )}
                </div>

                {onSendRequest && (
                  <button
                    onClick={() => handleSendRequest(profile.user_id)}
                    disabled={isRequesting}
                    className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isRequesting ? 'Sending...' : 'Send Friend Request'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

