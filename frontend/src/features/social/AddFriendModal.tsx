/**
 * Add Friend Modal Component
 * Allows users to search for and send friend requests to other users
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';
import { getPublicProfiles, sendFriendRequest, type PublicProfileSummary } from '../../api/social';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendRequestSent?: () => void;
}

export function AddFriendModal({ isOpen, onClose, onFriendRequestSent }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<PublicProfileSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchProfiles();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    } else if (isOpen && searchQuery.trim().length === 0) {
      // Load initial profiles when modal opens
      searchProfiles();
    }
  }, [searchQuery, isOpen]);

  const searchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPublicProfiles(searchQuery || undefined, 20);
      setProfiles(response.profiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search profiles');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      setSendingRequest(friendId);
      setError(null);
      await sendFriendRequest({ friend_id: friendId });
      if (onFriendRequestSent) {
        onFriendRequestSent();
      }
      // Optionally close modal after sending
      // onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black bg-opacity-50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Add Friend</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or bio..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>
                  {searchQuery.trim().length >= 2
                    ? 'No profiles found matching your search'
                    : 'Start typing to search for friends'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {profile.display_name}
                        </p>
                        {profile.bio && (
                          <p className="text-sm text-gray-500 truncate">{profile.bio}</p>
                        )}
                        <div className="flex gap-4 mt-1 text-xs text-gray-400">
                          <span>{profile.total_xp} XP</span>
                          <span>{profile.total_coins} coins</span>
                          {profile.achievements.length > 0 && (
                            <span>{profile.achievements.length} achievements</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(profile.user_id)}
                      disabled={sendingRequest === profile.user_id}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {sendingRequest === profile.user_id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Add Friend</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
