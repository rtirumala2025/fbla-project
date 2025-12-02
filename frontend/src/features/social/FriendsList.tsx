/**
 * Friends List Component
 * Displays user's friends, pending requests, and allows sending/responding to requests
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check, X, Users, UserCheck, Clock, Trash2 } from 'lucide-react';
import { 
  getFriends, 
  sendFriendRequest, 
  respondToFriendRequest,
  removeFriend,
  type FriendsListResponse,
  type FriendListEntry 
} from '../../api/social';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AddFriendModal } from './AddFriendModal';

interface FriendsListProps {
  userId?: string;
}

export function FriendsList({ userId }: FriendsListProps) {
  const [friendsData, setFriendsData] = useState<FriendsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFriends();
      setFriendsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessing(requestId);
      await respondToFriendRequest({ request_id: requestId, action: 'accept' });
      await loadFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      setProcessing(requestId);
      await respondToFriendRequest({ request_id: requestId, action: 'decline' });
      await loadFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline request');
    } finally {
      setProcessing(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }
    try {
      setProcessing(friendId);
      await removeFriend(friendId);
      await loadFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
    } finally {
      setProcessing(null);
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

  if (!friendsData) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Add Friend Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Friends</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Friends Section */}
        {friendsData.friends.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Friends ({friendsData.friends.length})
            </h3>
            <div className="space-y-2">
              {friendsData.friends.map((friend) => (
                <FriendCard 
                  key={friend.id} 
                  friend={friend} 
                  onRemove={() => handleRemoveFriend(friend.counterpart_user_id)}
                  processing={processing === friend.counterpart_user_id}
                />
              ))}
            </div>
          </section>
        )}

      {/* Pending Incoming Requests */}
      {friendsData.pending_incoming.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Requests ({friendsData.pending_incoming.length})
          </h3>
          <div className="space-y-2">
            {friendsData.pending_incoming.map((request) => (
              <PendingRequestCard
                key={request.id}
                request={request}
                onAccept={() => handleAcceptRequest(request.id)}
                onDecline={() => handleDeclineRequest(request.id)}
                processing={processing === request.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pending Outgoing Requests */}
      {friendsData.pending_outgoing.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Sent Requests ({friendsData.pending_outgoing.length})
          </h3>
          <div className="space-y-2">
            {friendsData.pending_outgoing.map((request) => (
              <FriendCard key={request.id} friend={request} isPending />
            ))}
          </div>
        </section>
      )}

        {/* Empty State */}
        {friendsData.total_count === 0 && friendsData.pending_incoming.length === 0 && friendsData.pending_outgoing.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No friends yet. Start adding friends to see them here!</p>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onFriendRequestSent={() => {
          loadFriends();
          setShowAddModal(false);
        }}
      />
    </>
  );
}

function FriendCard({ 
  friend, 
  isPending, 
  onRemove,
  processing 
}: { 
  friend: FriendListEntry; 
  isPending?: boolean;
  onRemove?: () => void;
  processing?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {friend.profile?.display_name || `User ${friend.counterpart_user_id.slice(0, 8)}`}
          </p>
          {friend.profile?.bio && (
            <p className="text-sm text-gray-500">{friend.profile.bio}</p>
          )}
          {isPending && (
            <p className="text-xs text-yellow-600 mt-1">Request sent</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {friend.profile && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{friend.profile.total_xp} XP</p>
            <p className="text-xs text-gray-500">{friend.profile.total_coins} coins</p>
          </div>
        )}
        {onRemove && !isPending && (
          <button
            onClick={onRemove}
            disabled={processing}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
            aria-label="Remove friend"
            title="Remove friend"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function PendingRequestCard({
  request,
  onAccept,
  onDecline,
  processing,
}: {
  request: FriendListEntry;
  onAccept: () => void;
  onDecline: () => void;
  processing: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {request.profile?.display_name || `User ${request.counterpart_user_id.slice(0, 8)}`}
          </p>
          <p className="text-sm text-gray-500">wants to be your friend</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          disabled={processing}
          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          aria-label="Accept request"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onDecline}
          disabled={processing}
          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          aria-label="Decline request"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
