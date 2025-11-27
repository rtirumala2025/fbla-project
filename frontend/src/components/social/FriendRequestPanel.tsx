/**
 * FriendRequestPanel Component
 * Handles incoming and outgoing friend requests
 */
import React, { useState } from 'react';
import { UserPlus, Check, X, Clock, Send } from 'lucide-react';
import type { FriendListEntry } from '../../api/social';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface FriendRequestPanelProps {
  incoming: FriendListEntry[];
  outgoing: FriendListEntry[];
  loading?: boolean;
  onAccept?: (requestId: string) => Promise<void>;
  onDecline?: (requestId: string) => Promise<void>;
  onCancel?: (requestId: string) => Promise<void>;
  onViewProfile?: (userId: string) => void;
}

export const FriendRequestPanel: React.FC<FriendRequestPanelProps> = ({
  incoming,
  outgoing,
  loading,
  onAccept,
  onDecline,
  onCancel,
  onViewProfile,
}) => {
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  const handleAccept = async (requestId: string) => {
    if (processing.has(requestId) || !onAccept) return;
    setProcessing((prev) => new Set(prev).add(requestId));
    try {
      await onAccept(requestId);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    if (processing.has(requestId) || !onDecline) return;
    setProcessing((prev) => new Set(prev).add(requestId));
    try {
      await onDecline(requestId);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleCancel = async (requestId: string) => {
    if (processing.has(requestId) || !onCancel) return;
    setProcessing((prev) => new Set(prev).add(requestId));
    try {
      await onCancel(requestId);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasRequests = incoming.length > 0 || outgoing.length > 0;

  if (!hasRequests) {
    return (
      <div className="text-center py-8">
        <UserPlus className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No pending requests</p>
        <p className="text-sm text-gray-500 mt-1">Friend requests will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Incoming Requests */}
      {incoming.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Incoming Requests ({incoming.length})
          </h3>
          <div className="space-y-2">
            {incoming.map((request) => {
              const isProcessing = processing.has(request.id);
              return (
                <div
                  key={request.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => onViewProfile?.(request.counterpart_user_id)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {request.profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">
                          {request.profile?.display_name || 'Unknown User'}
                        </h4>
                        {request.profile?.bio && (
                          <p className="text-xs text-gray-600 truncate mt-1">{request.profile.bio}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={isProcessing}
                        className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Accept request"
                      >
                        {isProcessing ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDecline(request.id)}
                        disabled={isProcessing}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Decline request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoing.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4" />
            Outgoing Requests ({outgoing.length})
          </h3>
          <div className="space-y-2">
            {outgoing.map((request) => {
              const isProcessing = processing.has(request.id);
              return (
                <div
                  key={request.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => onViewProfile?.(request.counterpart_user_id)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {request.profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">
                          {request.profile?.display_name || 'Unknown User'}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">Waiting for response...</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancel(request.id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Canceling...' : 'Cancel'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

