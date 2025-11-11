import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { useSync } from '../../contexts/SyncContext';

const SyncConflictBanner = () => {
  const { status, conflicts, clearConflicts, refresh } = useSync();

  if (status !== 'conflict' || conflicts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-auto mb-4 w-full max-w-4xl rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-900">We detected {conflicts.length} sync conflict(s).</p>
            <p className="mt-1 text-xs text-amber-800">
              Latest cloud changes were merged automatically. Review the summary below and confirm to continue.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-900">
              {conflicts.slice(0, 3).map((conflict, index) => (
                <li key={index} className="rounded-xl bg-white/70 px-3 py-2">
                  <span className="font-semibold capitalize">{String(conflict.type ?? 'item')}:</span>{' '}
                  {String(conflict.id ?? 'unknown')} kept newest changes.
                </li>
              ))}
              {conflicts.length > 3 && (
                <li className="text-xs italic text-amber-800">+ {conflicts.length - 3} more</li>
              )}
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 md:flex-row">
          <button
            onClick={() => refresh()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-100"
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            Retry Sync
          </button>
          <button
            onClick={() => clearConflicts()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-700"
            type="button"
          >
            <X className="h-4 w-4" />
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SyncConflictBanner;


