/**
 * ProfilePage Component
 * Displays user profile with real-time updates via Supabase Realtime
 */
import React, { useState, useEffect } from 'react';
import { User, Trophy, Coins, Award, Send, UserPlus, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getFriends, sendFriendRequest, respondToFriendRequest, type FriendListEntry } from '../../api/social';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProfilePageProps {
  userId: string;
  displayName: string;
  bio?: string;
  totalXp: number;
  totalCoins: number;
  achievements: Array<{ name: string; description?: string; earned_at?: string }>;
  petId?: string;
  petName?: string;
  petSpecies?: string;
  currentUserId?: string;
  onBack?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  displayName,
  bio,
  totalXp,
  totalCoins,
  achievements,
  petId,
  petName,
  petSpecies,
  currentUserId,
  onBack,
}) => {
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'accepted' | 'outgoing'>('none');
  const [loading, setLoading] = useState(false);
  const [realtimeData, setRealtimeData] = useState({ xp: totalXp, coins: totalCoins });

  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    // Check friendship status
    const checkFriendship = async () => {
      try {
        const friends = await getFriends();
        const friendEntry = friends.friends.find(
          (f) => f.counterpart_user_id === userId || f.counterpart_user_id === currentUserId
        );
        if (friendEntry) {
          if (friendEntry.status === 'accepted') {
            setFriendshipStatus('accepted');
          } else if (friendEntry.direction === 'outgoing') {
            setFriendshipStatus('outgoing');
          } else {
            setFriendshipStatus('pending');
          }
        }
      } catch (error) {
        console.error('Error checking friendship:', error);
      }
    };

    if (!isOwnProfile && currentUserId) {
      checkFriendship();
    }

    // Subscribe to real-time updates for this user's profile
    if (petId) {
      const channel = supabase
        .channel(`profile-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pets',
            filter: `id=eq.${petId}`,
          },
          (payload) => {
            // Update real-time data when pet stats change
            console.log('Real-time update received:', payload);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, currentUserId, petId, isOwnProfile]);

  const handleSendFriendRequest = async () => {
    setLoading(true);
    try {
      await sendFriendRequest({ friend_id: userId });
      setFriendshipStatus('outgoing');
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setLoading(true);
    try {
      await respondToFriendRequest({ request_id: requestId, action: 'accept' });
      setFriendshipStatus('accepted');
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            ← Back
          </button>
        )}
        {!isOwnProfile && friendshipStatus === 'none' && (
          <button
            onClick={handleSendFriendRequest}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
            <span>Send Friend Request</span>
          </button>
        )}
        {!isOwnProfile && friendshipStatus === 'outgoing' && (
          <span className="flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
            <Send className="w-4 h-4" />
            Request Sent
          </span>
        )}
        {!isOwnProfile && friendshipStatus === 'accepted' && (
          <span className="flex items-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            <CheckCircle className="w-4 h-4" />
            Friends
          </span>
        )}
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {displayName[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{displayName}</h2>
            {bio && <p className="text-sm text-slate-600 mb-2">{bio}</p>}
            {petName && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>🐾</span>
                <span className="font-semibold">{petName}</span>
                <span className="text-slate-400">•</span>
                <span className="capitalize">{petSpecies}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-600 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-semibold">XP</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{realtimeData.xp.toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-600 mb-1">
              <Coins className="w-4 h-4" />
              <span className="text-xs font-semibold">Coins</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{realtimeData.coins.toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-600 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-semibold">Achievements</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{achievements.length}</div>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {achievements.map((achievement, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center"
                >
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-sm font-semibold text-amber-800">{achievement.name}</div>
                  {achievement.description && (
                    <div className="text-xs text-amber-600 mt-1">{achievement.description}</div>
                  )}
                  {achievement.earned_at && (
                    <div className="text-xs text-amber-500 mt-1">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
