/**
 * PublicProfileGrid Component
 * Displays grid of public profiles for friend discovery
 */
import { motion } from 'framer-motion';
import { Sparkles, Trophy, UserPlus2 } from 'lucide-react';
import type { PublicProfileSummary } from '../../types/social';

interface PublicProfileGridProps {
  profiles: PublicProfileSummary[];
  onAddFriend: (profile: PublicProfileSummary) => void;
  isLoading: boolean;
}

export const PublicProfileGrid = ({ profiles, onAddFriend, isLoading }: PublicProfileGridProps) => {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading public showcases...
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
        No public profiles found. Try a different search or check back later.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {profiles.map((profile) => (
        <motion.article
          key={profile.id}
          className="group rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-indigo-50/40 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          whileHover={{ y: -4 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{profile.display_name}</h3>
            <Sparkles className="h-5 w-5 text-indigo-400 group-hover:text-indigo-500" />
          </div>
          <p className="mt-2 text-sm text-slate-600 line-clamp-3">{profile.bio ?? 'No bio yet.'}</p>

          <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-slate-600">
            <div className="rounded-2xl bg-white/80 p-3 shadow-inner">
              <dt className="text-slate-500">XP</dt>
              <dd className="text-indigo-600">{profile.total_xp}</dd>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 shadow-inner">
              <dt className="text-slate-500">Coins</dt>
              <dd className="text-amber-500">{profile.total_coins}</dd>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 shadow-inner">
              <dt className="text-slate-500">Achievements</dt>
              <dd className="text-emerald-600">{profile.achievements.length}</dd>
            </div>
          </dl>

          {profile.achievements.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              {profile.achievements.slice(0, 3).map((achievement) => (
                <span
                  key={achievement.name}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm ring-1 ring-slate-200"
                >
                  <Trophy className="h-3 w-3 text-amber-400" />
                  {achievement.name}
                </span>
              ))}
              {profile.achievements.length > 3 && (
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-600">
                  +{profile.achievements.length - 3} more
                </span>
              )}
            </div>
          )}

          <motion.button
            type="button"
            onClick={() => onAddFriend(profile)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            whileTap={{ scale: 0.97 }}
          >
            <UserPlus2 className="h-4 w-4" />
            Add Friend
          </motion.button>
        </motion.article>
      ))}
    </div>
  );
};

export default PublicProfileGrid;

