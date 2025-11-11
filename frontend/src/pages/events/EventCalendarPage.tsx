import React from 'react';

import AppShell from '../../components/layout/AppShell';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useSeasonalExperience } from '../../hooks/useSeasonalExperience';
import EventCalendar from '../../components/events/EventCalendar';
import SeasonalBanner from '../../components/events/SeasonalBanner';

export const EventCalendarPage: React.FC = () => {
  const { events, weather, seasonalMood, loading, error, offline, usingCache, refresh, lastUpdated } = useSeasonalExperience();

  const activeEvent = events?.current?.[0] ?? null;

  return (
    <AppShell
      title="Seasonal calendar"
      subtitle="Track upcoming celebrations, unlock weather reactions, and plan your pet’s festivities."
      actions={
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {loading ? 'Refreshing...' : 'Refresh schedule'}
        </button>
      }
    >
      <div className="space-y-6">
        <SeasonalBanner
          event={activeEvent}
          weather={weather}
          seasonalMood={seasonalMood}
          loading={loading}
          offline={offline}
          usingCache={usingCache}
          onRefresh={refresh}
        />

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
            {error}
          </div>
        )}

        {!events && loading && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {events && <EventCalendar current={events.current} upcoming={events.upcoming} />}

        {lastUpdated && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last synced {new Date(lastUpdated).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            {usingCache && ' • showing cached data'}
            {offline && ' • offline mode'}
          </p>
        )}
      </div>
    </AppShell>
  );
};

export default EventCalendarPage;

