/**
 * QuestBoard Component
 * Displays quests organized by type (daily, weekly, event)
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, memo } from 'react';
import type { Quest } from '../../types/quests';
import { QuestCard } from './QuestCard';

interface QuestBoardProps {
  quests: Record<'daily' | 'weekly' | 'event', Quest[]>;
  onComplete: (quest: Quest) => void;
  isProcessingId?: string | null;
}

const sectionTitles: Record<'daily' | 'weekly' | 'event', { title: string; caption: string }> = {
  daily: { title: 'Daily Momentum', caption: 'Quick wins to keep your pet thriving.' },
  weekly: { title: 'Weekly Challenges', caption: 'Bigger goals with richer rewards.' },
  event: { title: 'Event Spotlight', caption: 'Limited-time adventures and seasonal quests.' },
};

export const QuestBoard = memo(({ quests, onComplete, isProcessingId = null }: QuestBoardProps) => {
  return (
    <div className="space-y-10">
      {(Object.keys(sectionTitles) as Array<'daily' | 'weekly' | 'event'>).map((key) => {
        const section = sectionTitles[key];
        const questList = quests[key];
        if (!questList.length) return <Fragment key={key} />;
        return (
          <section key={key}>
            <header className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <p className="text-sm text-slate-500">{section.caption}</p>
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {questList.length} active
              </motion.span>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence>
                {questList.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={onComplete}
                    isProcessing={isProcessingId === quest.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if quests or processing state changes
  return (
    JSON.stringify(prevProps.quests) === JSON.stringify(nextProps.quests) &&
    prevProps.isProcessingId === nextProps.isProcessingId
  );
});

QuestBoard.displayName = 'QuestBoard';

export default QuestBoard;

