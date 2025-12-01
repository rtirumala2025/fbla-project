/**
 * Public Profiles Component
 * Browse and search public pet profiles
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Star, Coins, TrendingUp } from 'lucide-react';
import { getPublicProfiles, sendFriendRequest, type PublicProfileSummary } from '../../api/social';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export function PublicProfiles() {
  const [profiles, setProfiles] = useState<PublicProfileSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  const loadProfiles = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicProfiles(search, 20);
      setProfiles(data.profiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProfiles(searchQuery || undefined);
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      setSendingRequest(userId);
      await sendFriendRequest({ friend_id: userId });
      // Optionally show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No profiles found. Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onSendRequest={() => handleSendFriendRequest(profile.user_id)}
              sendingRequest={sendingRequest === profile.user_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileCard({
  profile,
  onSendRequest,
  sendingRequest,
}: {
  profile: PublicProfileSummary;
  onSendRequest: () => void;
  sendingRequest: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{profile.display_name}</h3>
            {profile.bio && (
              <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Experience</p>
            <p className="font-semibold text-gray-900">{profile.total_xp.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-600" />
          <div>
            <p className="text-xs text-gray-500">Coins</p>
            <p className="font-semibold text-gray-900">{profile.total_coins.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {profile.achievements.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Achievements</p>
          <div className="flex flex-wrap gap-2">
            {profile.achievements.slice(0, 3).map((achievement, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded text-xs"
              >
                <Star className="w-3 h-3 text-yellow-600" />
                <span className="text-gray-700">{achievement.name}</span>
              </div>
            ))}
            {profile.achievements.length > 3 && (
              <span className="text-xs text-gray-500">
                +{profile.achievements.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add Friend Button */}
      <button
        onClick={onSendRequest}
        disabled={sendingRequest}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {sendingRequest ? 'Sending...' : 'Send Friend Request'}
      </button>
    </motion.div>
  );
}
