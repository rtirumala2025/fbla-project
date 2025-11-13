/**
 * EventCalendar Component
 * Displays current and upcoming seasonal events
 */
import { motion } from 'framer-motion';
import { PartyPopper, Sparkles, Trophy } from 'lucide-react';
import React from 'react';
import type { EventResponse } from '../../types/events';

type EventCalendarProps = {
  current: EventResponse[];
  upcoming: EventResponse[];
};

const formatRange = (event: EventResponse): string => {
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

export const EventCalendar: React.FC<EventCalendarProps> = ({ current, upcoming }) => {
  const noEvents = current.length === 0 && upcoming.length === 0;

  if (noEvents) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <Sparkles className="mx-auto mb-3 h-10 w-10 text-indigo-400" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No events scheduled</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Check back soon for festive surprises, limited quests, and seasonal collectibles.
        </p>
      </div>
    );
  }

  const renderEventCard = (event: EventResponse, index: number) => {
    const isActive = event.is_active;
    const Icon = isActive ? PartyPopper : Trophy;
    return (
      <motion.li
        key={event.event_id}
        className={`relative overflow-hidden rounded-3xl border ${
          isActive ? 'border-indigo-200 bg-indigo-50/60' : 'border-slate-200 bg-white'
        } p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <motion.div
          className="pointer-events-none absolute -top-12 right-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20"
          animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        />
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'} shadow-inner`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{event.name}</h3>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {formatRange(event)} • {event.type}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {event.description ?? 'Seasonal bonuses active for your companion.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {event.is_active && <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-600 dark:text-emerald-300">Active now</span>}
              {event.participation_status && (
                <span className="rounded-full bg-slate-900/10 px-3 py-1 font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-700/40 dark:text-slate-200">
                  {event.participation_status}
                </span>
              )}
              {typeof event.days_remaining === 'number' && event.days_remaining >= 0 && (
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-700 dark:text-indigo-200">
                  {event.days_remaining} day{event.days_remaining === 1 ? '' : 's'} left
                </span>
              )}
              {typeof event.days_until_start === 'number' && event.days_until_start >= 0 && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-600 dark:text-amber-300">
                  Starts in {event.days_until_start} day{event.days_until_start === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.li>
    );
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Seasonal calendar</h2>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {current.length + upcoming.length} events on the horizon
        </p>
      </header>

      {current.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Active now</h3>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {current.map((event, index) => renderEventCard(event, index))}
          </ul>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Upcoming</h3>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {upcoming.map((event, index) => renderEventCard(event, current.length + index))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;

