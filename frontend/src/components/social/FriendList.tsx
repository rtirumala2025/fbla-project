import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { UserPlus2, Users } from 'lucide-react';
import type { FriendListEntry, FriendsListResponse } from '../../types/social';

interface FriendListProps {
  data?: FriendsListResponse | null;
  isLoading: boolean;
  offline: boolean;
  onAccept: (entry: FriendListEntry) => void;
  onDecline: (entry: FriendListEntry) => void;
}

const variants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
};

export const FriendList = ({ data, isLoading, offline, onAccept, onDecline }: FriendListProps) => {
  const friends = data?.friends ?? [];
  const pendingIncoming = data?.pending_incoming ?? [];
  const pendingOutgoing = data?.pending_outgoing ?? [];

  const emptyState = useMemo(() => {
    if (isLoading) return 'Loading your social circle...';
    if (offline && !data) return 'Offline. Showing cached friendships if available.';
    if (!friends.length && !pendingIncoming.length && !pendingOutgoing.length) {
      return 'No friends yet. Explore public profiles to connect!';
    }
    return null;
  }, [isLoading, offline, data, friends.length, pendingIncoming.length, pendingOutgoing.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Friends
          </h2>
          <p className="text-sm text-slate-500">
            {isLoading ? 'Syncing with the cloud...' : `Connected with ${friends.length} companion${friends.length === 1 ? '' : 's'}.`}
          </p>
        </div>
        {offline && <span className="text-xs font-semibold text-amber-600">Offline mode</span>}
      </div>

      {emptyState ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
          {emptyState}
        </div>
      ) : (
        <div className="grid gap-5">
          {!!pendingIncoming.length && (
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <UserPlus2 className="w-4 h-4 text-emerald-500" />
                Incoming Requests
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Approve new companions to share stats, achievements, and seasonal bonuses.
              </p>
              <ul className="mt-4 space-y-3">
                <AnimatePresence>
                  {pendingIncoming.map((entry) => (
                    <motion.li
                      key={entry.id}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={variants}
                      layout
                      className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {entry.profile?.display_name ?? 'New Friend'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {entry.profile?.bio ?? 'Ready to start a new adventure together.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onAccept(entry)}
                            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                          >
                            Accept
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onDecline(entry)}
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                          >
                            Decline
                          </motion.button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          )}

          {!!friends.length && (
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Active Companions</h3>
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {friends.map((entry) => (
                  <motion.li
                    key={entry.id}
                    layout
                    className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {entry.profile?.display_name ?? 'Friend'}
                        </p>
                        <p className="text-xs text-slate-500">
                          XP {entry.profile?.total_xp ?? 0} • Coins {entry.profile?.total_coins ?? 0}
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
                        Achievements {entry.profile?.achievements.length ?? 0}
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </section>
          )}

          {!!pendingOutgoing.length && (
            <section className="rounded-3xl bg-slate-50/70 p-5 ring-1 ring-dashed ring-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Awaiting Responses</h3>
              <ul className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                {pendingOutgoing.map((entry) => (
                  <motion.li
                    key={entry.id}
                    layout
                    className="rounded-full bg-white px-3 py-1 shadow ring-1 ring-slate-200"
                  >
                    {entry.profile?.display_name ?? 'Pending friend'}
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendList;


