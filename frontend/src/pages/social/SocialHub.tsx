import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, RefreshCw, Users } from 'lucide-react';
import {
  fetchFriends,
  fetchLeaderboard,
  fetchPublicProfiles,
  respondToFriendRequest,
  sendFriendRequest,
} from '../../api/social';
import type {
  FriendListEntry,
  FriendsListResponse,
  LeaderboardMetric,
  LeaderboardResponse,
  PublicProfileSummary,
} from '../../types/social';
import { FriendList } from '../../components/social/FriendList';
import { useOfflineCache } from '../../hooks/useOfflineCache';
import { useToast } from '../../contexts/ToastContext';
import { LeaderboardPanel } from '../../components/social/LeaderboardPanel';
import { PublicProfileGrid } from '../../components/social/PublicProfileGrid';

type Tab = 'friends' | 'profiles' | 'leaderboard';

export const SocialHub = () => {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friendsData, setFriendsData] = useState<FriendsListResponse | null>(null);
  const [profiles, setProfiles] = useState<PublicProfileSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [leaderboardMetric, setLeaderboardMetric] = useState<LeaderboardMetric>('xp');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);
  const [isFetchingFriends, setIsFetchingFriends] = useState(false);
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false);

  const { cached, offline } = useOfflineCache({ key: 'social-friends-cache', data: friendsData });
  const { success, info, error } = useToast();
  const previousIncomingCount = useRef<number>(0);

  const handleFriendsFetch = useCallback(async () => {
    setIsFetchingFriends(true);
    try {
      const result = await fetchFriends();
      setFriendsData(result);
    } catch (err) {
      console.error('Unable to fetch friends', err);
      // Don't show toast - API will fallback to mock data automatically
      // Only show info if we have cached data
      if (!friendsData && cached) {
        info('Offline mode: showing cached friends list.');
      }
    } finally {
      setIsFetchingFriends(false);
    }
  }, [cached, friendsData, info]);

  const handleProfilesFetch = useCallback(
    async (query?: string) => {
      setIsFetchingProfiles(true);
      try {
        const result = await fetchPublicProfiles(query);
        setProfiles(result.profiles);
      } catch (err) {
        console.error('Unable to fetch public profiles', err);
        // Don't show toast - API will fallback to mock data automatically
      } finally {
        setIsFetchingProfiles(false);
      }
    },
    [],
  );

  const handleLeaderboardFetch = useCallback(
    async (metric: LeaderboardMetric) => {
      setIsFetchingLeaderboard(true);
      try {
        const result = await fetchLeaderboard(metric);
        setLeaderboard(result);
      } catch (err) {
        console.error('Unable to fetch leaderboard', err);
        // Don't show toast - API will fallback to mock data automatically
      } finally {
        setIsFetchingLeaderboard(false);
      }
    },
    [],
  );

  useEffect(() => {
    handleFriendsFetch();
    handleProfilesFetch();
    handleLeaderboardFetch(leaderboardMetric);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (friendsData) {
      const incomingCount = friendsData.pending_incoming.length;
      if (incomingCount > previousIncomingCount.current) {
        info(`You have ${incomingCount - previousIncomingCount.current} new friend request(s)!`);
      }
      previousIncomingCount.current = incomingCount;
    }
  }, [friendsData, info]);

  const handleAccept = useCallback(
    async (entry: FriendListEntry) => {
      try {
        setFriendsData((prev) =>
          prev
            ? {
                ...prev,
                pending_incoming: prev.pending_incoming.filter((item) => item.id !== entry.id),
              }
            : prev,
        );
        const updated = await respondToFriendRequest(entry.id, 'accept');
        setFriendsData(updated);
        success('Friend request accepted! 🎉');
      } catch (err) {
        console.error('Failed to accept friend request', err);
        error('Unable to accept friend request.');
        handleFriendsFetch();
      }
    },
    [error, handleFriendsFetch, success],
  );

  const handleDecline = useCallback(
    async (entry: FriendListEntry) => {
      try {
        setFriendsData((prev) =>
          prev
            ? {
                ...prev,
                pending_incoming: prev.pending_incoming.filter((item) => item.id !== entry.id),
              }
            : prev,
        );
        const updated = await respondToFriendRequest(entry.id, 'decline');
        setFriendsData(updated);
        info('Friend request declined.');
      } catch (err) {
        console.error('Failed to decline request', err);
        error('Unable to decline friend request.');
        handleFriendsFetch();
      }
    },
    [error, handleFriendsFetch, info],
  );

  const handleAddFriend = useCallback(
    async (profile: PublicProfileSummary) => {
      try {
        const updated = await sendFriendRequest(profile.user_id);
        setFriendsData(updated);
        success(`Friend request sent to ${profile.display_name}.`);
      } catch (err) {
        console.error('Failed to send friend request', err);
        error('Unable to send friend request.');
      }
    },
    [error, success],
  );

  const friendsList = useMemo<FriendsListResponse | null>(() => {
    if (friendsData) return friendsData;
    if (cached) return cached as FriendsListResponse;
    return null;
  }, [friendsData, cached]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Users className="h-6 w-6 text-indigo-500" />
              Social Hub
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage friendships, explore public pet profiles, and climb the leaderboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleFriendsFetch}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingFriends ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
            {activeTab === 'profiles' && (
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <input
                  className="bg-transparent text-sm text-slate-600 outline-none"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleProfilesFetch(searchTerm || undefined);
                    }
                  }}
                  placeholder="Search companions..."
                />
              </div>
            )}
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 rounded-full bg-slate-100/70 p-2">
          {(['friends', 'profiles', 'leaderboard'] as Tab[]).map((tab) => {
            const active = tab === activeTab;
            const label =
              tab === 'friends'
                ? 'Friends'
                : tab === 'profiles'
                ? 'Public Profiles'
                : 'Leaderboard';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {activeTab === 'friends' && (
          <FriendList
            data={friendsList}
            isLoading={isFetchingFriends}
            offline={offline}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )}

        {activeTab === 'profiles' && (
          <PublicProfileGrid profiles={profiles} onAddFriend={handleAddFriend} isLoading={isFetchingProfiles} />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPanel
            data={leaderboard}
            metric={leaderboardMetric}
            isLoading={isFetchingLeaderboard}
            onMetricChange={(metric) => {
              setLeaderboardMetric(metric);
              handleLeaderboardFetch(metric);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SocialHub;


