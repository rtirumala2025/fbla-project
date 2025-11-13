/**
 * CoachPanel Component
 * Displays AI coach advice and recommendations
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Loader2 } from 'lucide-react';
import type { CoachAdviceResponse } from '../../types/quests';

interface CoachPanelProps {
  advice?: CoachAdviceResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const CoachPanel = ({ advice, isLoading, onRefresh }: CoachPanelProps) => {
  return (
    <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Brain className="h-5 w-5 text-indigo-500" />
            AI Coach
          </h2>
          <p className="text-sm text-slate-500">Personalised advice based on your pet&apos;s stats and quest history.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-200 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            Generating new suggestions...
          </div>
        ) : advice ? (
          <>
            <p className="rounded-2xl bg-white/70 p-4 text-sm text-slate-700 shadow-inner">
              {advice.summary}{' '}
              <span className="font-semibold text-indigo-600">
                Suggested difficulty: {advice.difficulty_hint.toUpperCase()}
              </span>
            </p>
            <AnimatePresence>
              {advice.suggestions.map((suggestion) => (
                <motion.div
                  key={`${suggestion.category}-${suggestion.recommendation.slice(0, 16)}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="rounded-2xl border border-slate-100 bg-white p-3 text-sm text-slate-700 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{suggestion.category}</p>
                  <p className="mt-1">{suggestion.recommendation}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            <p className="text-xs text-slate-400">
              Generated at {new Date(advice.generated_at).toLocaleTimeString()} • Source: {advice.source.toUpperCase()}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">No advice available yet. Refresh once you have an active pet and quests.</p>
        )}
      </div>
    </div>
  );
};

export default CoachPanel;

