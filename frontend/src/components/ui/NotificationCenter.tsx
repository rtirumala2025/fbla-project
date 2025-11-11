import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success';
}

type Props = {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
};

const typeStyles: Record<NonNullable<NotificationItem['type']>, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export const NotificationCenter: React.FC<Props> = ({ notifications, onDismiss }) => {
  return (
    <div className="pointer-events-none fixed top-24 right-4 z-40 w-full max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className={`pointer-events-auto mb-3 rounded-3xl border p-4 shadow-lg ${
              notification.type ? typeStyles[notification.type] : typeStyles.info
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{notification.title}</p>
                <p className="text-xs">{notification.message}</p>
              </div>
              <button
                className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onClick={() => onDismiss(notification.id)}
                aria-label={`Dismiss ${notification.title}`}
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;

