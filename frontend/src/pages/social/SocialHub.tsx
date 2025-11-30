/**
 * SocialHub Page
 * Main social features page with friends, requests, profiles, and leaderboard
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Trophy, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useSocialRealtime } from '../../hooks/useSocialRealtime';
import {
  getFriends,
  sendFriendRequest,
  respondToFriendRequest,
  getPublicProfiles,
  getLeaderboard,
  type FriendsListResponse,
  type PublicProfilesResponse,
  type LeaderboardResponse,
  type LeaderboardMetric,
} from '../../api/social';
import { FriendList } from '../../components/social/FriendList';
import { FriendRequestPanel } from '../../components/social/FriendRequestPanel';
import { PublicProfilesGrid } from '../../components/social/PublicProfilesGrid';
import { LeaderboardPanel } from '../../components/social/LeaderboardPanel';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

type Tab = 'friends' | 'discover' | 'leaderboard';

export const SocialHub: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Friends data
  const [friendsData, setFriendsData] = useState<FriendsListResponse | null>(null);

  // Public profiles data
  const [profilesData, setProfilesData] = useState<PublicProfilesResponse | null>(null);
  const [profileSearch, setProfileSearch] = useState('');

  // Leaderboard data
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [leaderboardMetric, setLeaderboardMetric] = useState<LeaderboardMetric>('xp');

  // Load all data
  const loadData = useCallback(
    async (silent = false) => {
      if (!currentUser?.uid) return;

      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const [friends, profiles, leaderboard] = await Promise.all([
          getFriends(),
          getPublicProfiles(undefined, 20),
          getLeaderboard(leaderboardMetric, 20),
        ]);

        setFriendsData(friends);
        setProfilesData(profiles);
        setLeaderboardData(leaderboard);
      } catch (error: any) {
        console.error('Failed to load social data:', error);
        toast.error(error?.message || 'Failed to load social data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUser?.uid, leaderboardMetric, toast],
  );

  // Real-time subscription
  const refreshData = useCallback(
    async (options?: { silent?: boolean }) => {
      await loadData(options?.silent);
    },
    [loadData],
  );
  useSocialRealtime(refreshData);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle friend request
  const handleSendFriendRequest = async (userId: string) => {
    if (!currentUser?.uid) return;

    try {
      const response = await sendFriendRequest({ friend_id: userId });
      setFriendsData(response);
      toast.success('Friend request sent!');
    } catch (error: any) {
      console.error('Failed to send friend request:', error);
      toast.error(error?.message || 'Failed to send friend request');
    }
  };

  // Handle accept/decline friend request
  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    if (!currentUser?.uid) return;

    try {
      const response = await respondToFriendRequest({ request_id: requestId, action });
      setFriendsData(response);
      toast.success(action === 'accept' ? 'Friend request accepted!' : 'Friend request declined');
    } catch (error: any) {
      console.error('Failed to respond to friend request:', error);
      toast.error(error?.message || 'Failed to respond to friend request');
    }
  };

  // Handle cancel outgoing request
  const handleCancelRequest = async (requestId: string) => {
    // For now, we'll decline it (backend doesn't have a cancel endpoint)
    await handleRespondToRequest(requestId, 'decline');
  };

  // Handle profile search
  const handleProfileSearch = async (query: string) => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const response = await getPublicProfiles(query || undefined, 20);
      setProfilesData(response);
    } catch (error: any) {
      console.error('Failed to search profiles:', error);
      toast.error(error?.message || 'Failed to search profiles');
    } finally {
      setLoading(false);
    }
  };

  // Handle leaderboard metric change
  const handleLeaderboardMetricChange = async (metric: LeaderboardMetric) => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const response = await getLeaderboard(metric, 20);
      setLeaderboardData(response);
      setLeaderboardMetric(metric);
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      toast.error(error?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  // Handle view profile (navigate to public profile page)
  const handleViewProfile = (userId: string) => {
    // TODO: Navigate to public profile page
    // For now, just show a toast
    toast.info('Profile view coming soon!');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access social features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Social Hub</h1>
          <p className="text-gray-600">Connect with friends and see how you rank!</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'friends'
                ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-0.5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Friends</span>
              {friendsData && friendsData.friends.length > 0 && (
                <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                  {friendsData.friends.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'discover'
                ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-0.5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              <span>Discover</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'leaderboard'
                ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-0.5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <span>Leaderboard</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {loading && !refreshing ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Friends Tab */}
              {activeTab === 'friends' && friendsData && (
                <div className="space-y-6">
                  {/* Friend Requests */}
                  {(friendsData.pending_incoming.length > 0 ||
                    friendsData.pending_outgoing.length > 0) && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Friend Requests
                      </h2>
                      <FriendRequestPanel
                        incoming={friendsData.pending_incoming}
                        outgoing={friendsData.pending_outgoing}
                        onAccept={(id) => handleRespondToRequest(id, 'accept')}
                        onDecline={(id) => handleRespondToRequest(id, 'decline')}
                        onCancel={handleCancelRequest}
                        onViewProfile={handleViewProfile}
                      />
                    </div>
                  )}

                  {/* Friends List */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      My Friends ({friendsData.friends.length})
                    </h2>
                    <FriendList
                      friends={friendsData.friends}
                      onViewProfile={handleViewProfile}
                    />
                  </div>
                </div>
              )}

              {/* Discover Tab */}
              {activeTab === 'discover' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Discover Users
                  </h2>
                  <PublicProfilesGrid
                    profiles={profilesData?.profiles || []}
                    loading={loading}
                    searchValue={profileSearch}
                    onSearchChange={setProfileSearch}
                    onSearch={handleProfileSearch}
                    onSendRequest={handleSendFriendRequest}
                    onViewProfile={handleViewProfile}
                  />
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Friend Leaderboard
                  </h2>
                  <LeaderboardPanel
                    entries={leaderboardData?.entries || []}
                    metric={leaderboardMetric}
                    loading={loading}
                    onMetricChange={handleLeaderboardMetricChange}
                    onViewProfile={handleViewProfile}
                    currentUserId={currentUser.uid}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

