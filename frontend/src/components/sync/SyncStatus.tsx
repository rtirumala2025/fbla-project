/**
 * SyncStatus Component
 * Displays sync status and allows manual sync/restore
 */
import React from 'react';
import { useSyncManager } from '../../hooks/useSyncManager';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export const SyncStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { status, lastSynced, queuedOperations, save, restore, conflicts, clearConflicts } =
    useSyncManager();
  const offlineStatus = useOfflineStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return 'text-blue-500';
      case 'offline':
        return 'text-gray-500';
      case 'conflict':
        return 'text-red-500';
      case 'restoring':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Offline';
      case 'conflict':
        return `${conflicts.length} conflict(s)`;
      case 'restoring':
        return 'Restoring...';
      default:
        return 'Synced';
    }
  };

  const formatLastSynced = () => {
    if (!lastSynced) return 'Never';
    const seconds = Math.floor((Date.now() - lastSynced) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`sync-status ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`status-indicator ${getStatusColor()}`}>
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        {lastSynced && status === 'idle' && (
          <span className="text-xs text-gray-500">{formatLastSynced()}</span>
        )}
        {queuedOperations > 0 && (
          <span className="text-xs text-orange-500">
            {queuedOperations} queued
          </span>
        )}
      </div>

      {conflicts.length > 0 && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">
            {conflicts.length} conflict(s) detected. Please resolve manually.
          </p>
          <button
            onClick={clearConflicts}
            className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <button
          onClick={() => void save()}
          disabled={status === 'syncing' || status === 'restoring' || offlineStatus.offline}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sync Now
        </button>
        <button
          onClick={() => void restore()}
          disabled={status === 'syncing' || status === 'restoring'}
          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Restore
        </button>
      </div>
    </div>
  );
};

