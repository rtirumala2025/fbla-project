import { motion } from 'framer-motion';
import { CalendarDays, CloudRain, RefreshCcw, Snowflake, Sparkles, SunMedium, Umbrella } from 'lucide-react';
import React from 'react';

import type { EventResponse, SeasonalMoodPayload, WeatherResponse } from '../../types/events';

type SeasonalBannerProps = {
  event: EventResponse | null;
  weather: WeatherResponse | null;
  seasonalMood: SeasonalMoodPayload | null;
  loading: boolean;
  offline: boolean;
  usingCache: boolean;
  onRefresh: () => void;
};

const weatherIcon = (weather?: WeatherResponse | null) => {
  if (!weather) return <Sparkles className="h-5 w-5 text-indigo-300" aria-hidden="true" />;
  const condition = weather.condition.toLowerCase();
  if (condition.includes('snow')) return <Snowflake className="h-5 w-5 text-sky-200" aria-hidden="true" />;
  if (condition.includes('rain') || condition.includes('drizzle')) return <Umbrella className="h-5 w-5 text-sky-200" aria-hidden="true" />;
  if (condition.includes('cloud')) return <CloudRain className="h-5 w-5 text-slate-200" aria-hidden="true" />;
  return <SunMedium className="h-5 w-5 text-amber-200" aria-hidden="true" />;
};

export const SeasonalBanner: React.FC<SeasonalBannerProps> = ({
  event,
  weather,
  seasonalMood,
  loading,
  offline,
  usingCache,
  onRefresh,
}) => {
  const bannerTitle = event ? `${event.name}` : 'No active seasonal event';
  const moodLabel = seasonalMood?.mood ? `Mood boost: ${seasonalMood.mood}` : 'Keeping mood steady';

  return (
    <motion.section
      className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-6 text-white shadow-xl dark:from-indigo-600 dark:via-indigo-500 dark:to-sky-500"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      role="region"
      aria-label="Seasonal event banner"
    >
      <motion.div
        className="pointer-events-none absolute -top-24 right-6 h-36 w-36 rounded-full bg-white/10 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <motion.span
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 shadow-lg"
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
            >
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </motion.span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Seasonal spotlight</p>
              <h2 className="text-2xl font-black tracking-tight">{bannerTitle}</h2>
            </div>
          </div>

          <p className="mt-3 max-w-xl text-sm text-white/90">
            {event?.description ??
              (event
                ? 'Special bonuses are active for your pet while this event lasts.'
                : 'Check back soon for upcoming festivities and limited-time rewards.')}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/80">
            {event && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {event.type}
              </span>
            )}
            {seasonalMood && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">{moodLabel}</span>
            )}
            {usingCache && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                Cached view
              </span>
            )}
            {offline && (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/80 px-3 py-1 text-amber-50">
                Offline mode
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl bg-white/15 p-4 text-sm shadow-inner backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-white/25 p-2">{weatherIcon(weather)}</span>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/70">Current weather</p>
              <p className="font-semibold">
                {weather ? `${weather.condition} • ${Math.round(weather.temperature_c)}°C` : 'Awaiting forecast'}
              </p>
              {weather && (
                <p className="text-xs text-white/80">
                  {weather.description} • Wind {weather.wind_speed.toFixed(1)} m/s • Humidity {Math.round(weather.humidity)}%
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:bg-white/10"
            type="button"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {loading ? 'Syncing...' : 'Refresh mood'}
          </button>
        </div>
      </div>
    </motion.section>
  );
};

export default SeasonalBanner;

