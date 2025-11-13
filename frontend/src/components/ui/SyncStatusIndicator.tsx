/**
 * SyncStatusIndicator Component
 * Displays sync status with icon and click to refresh
 */
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, CloudOff, CloudUpload } from 'lucide-react';
import { useSync } from '../../contexts/SyncContext';

export const SyncStatusIndicator = () => {
  const { status, conflicts, refresh } = useSync();

  const icon =
    status === 'offline'
      ? <CloudOff className="h-4 w-4 text-amber-500" />
      : status === 'conflict'
        ? <AlertTriangle className="h-4 w-4 text-amber-500" />
        : status === 'syncing'
          ? <CloudUpload className="h-4 w-4 text-indigo-500 animate-pulse" />
          : <CheckCircle2 className="h-4 w-4 text-emerald-500" />;

  const label =
    status === 'offline'
      ? 'Offline'
      : status === 'conflict'
        ? `${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'}`
        : status === 'syncing'
          ? 'Syncing…'
          : 'Synced';

  return (
    <motion.button
      type="button"
      onClick={() => refresh()}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
};

export default SyncStatusIndicator;

