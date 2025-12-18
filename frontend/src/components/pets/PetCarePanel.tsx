/**
 * PetCarePanel Component
 * Centralized care interface for pet actions and stats
 */
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { bathePetAction, feedPetAction, getPetDiary, getPetStats, playWithPet, restPetAction } from '../../api/pets';
import type { PetActionResponse, PetDiaryEntry, PetStats } from '../../types/pet';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EvolutionAnimation } from './EvolutionAnimation';

type CareAction = 'feed' | 'play' | 'bathe' | 'rest';

const foodOptions = [
  { id: 'standard', label: 'Standard Meal' },
  { id: 'treat', label: 'Treat' },
  { id: 'premium', label: 'Premium Meal' },
];

const gameOptions = [
  { id: 'fetch', label: 'Fetch' },
  { id: 'puzzle', label: 'Puzzle Time' },
  { id: 'dance', label: 'Dance Party' },
];

const restOptions = [
  { id: 1, label: 'Power Nap (1h)' },
  { id: 3, label: 'Deep Snooze (3h)' },
  { id: 6, label: 'Dream Marathon (6h)' },
];

type HealthSummary = {
  summary: string;
  mood: string;
};

export function PetCarePanel() {
  const [stats, setStats] = useState<PetStats | null>(null);
  const [diary, setDiary] = useState<PetDiaryEntry[]>([]);
  const [reaction, setReaction] = useState<string>('');
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEvolution, setShowEvolution] = useState(false);
  const [evolutionData, setEvolutionData] = useState<{ oldStage: string; newStage: string; level: number } | null>(null);
  const prevStatsRef = useRef<PetStats | null>(null);

  const computeHealthSummary = useCallback((currentStats: PetStats | null): HealthSummary | null => {
    if (!currentStats) {
      return null;
    }
    const hygiene = currentStats.hygiene ?? currentStats.cleanliness ?? 60;
    const average = (currentStats.health + currentStats.hunger + hygiene + currentStats.energy) / 4;
    let summary: string;
    if (currentStats.is_sick ?? false) {
      summary = 'Your pet is feeling unwell. Try a bath, rest, or feed them something nourishing.';
    } else if (average >= 80) {
      summary = 'Your pet is thriving! Keep up the excellent care.';
    } else if (average >= 60) {
      summary = 'Your pet is doing well. A little extra attention will keep them on track.';
    } else if (average >= 40) {
      summary = 'Your pet needs some care soon—consider feeding, playing, or resting.';
    } else {
      summary = 'Critical alert! Immediate care is needed to avoid illness.';
    }
    return { summary, mood: currentStats.mood ?? 'content' };
  }, []);

  const getEvolutionStage = useCallback((level: number): string => {
    if (level >= 12) return 'legendary';
    if (level >= 7) return 'adult';
    if (level >= 4) return 'juvenile';
    return 'egg';
  }, []);

  const checkEvolution = useCallback((oldStats: PetStats | null, newStats: PetStats | null) => {
    if (!oldStats || !newStats) return;
    
    const oldLevel = oldStats.level ?? 1;
    const newLevel = newStats.level ?? 1;
    
    if (newLevel > oldLevel) {
      const oldStage = getEvolutionStage(oldLevel);
      const newStage = getEvolutionStage(newLevel);
      
      if (oldStage !== newStage) {
        setEvolutionData({
          oldStage,
          newStage,
          level: newLevel,
        });
        setShowEvolution(true);
      }
    }
  }, [getEvolutionStage]);

  const updateFromAction = useCallback((response: PetActionResponse) => {
    if (response.pet?.stats) {
      const newStats = response.pet.stats as PetStats;
      const oldStats = stats;
      
      setStats(newStats);
      setHealthSummary(computeHealthSummary(newStats));
      
      // Check for evolution
      if (oldStats) {
        checkEvolution(oldStats, newStats);
      }
    }
    if (response.pet?.diary) {
      setDiary(response.pet.diary);
    }
    setReaction(response.reaction ?? '');
    setNotifications(response.notifications ?? []);
  }, [computeHealthSummary, stats, checkEvolution]);

  const loadCareData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [fetchedStats, fetchedDiary] = await Promise.all([getPetStats(), getPetDiary()]);

      // Check for evolution on load
      if (prevStatsRef.current && fetchedStats) {
        checkEvolution(prevStatsRef.current, fetchedStats);
      }
      prevStatsRef.current = fetchedStats;
      
      setStats(fetchedStats);
      setDiary(fetchedDiary);
      setHealthSummary(computeHealthSummary(fetchedStats));
      setNotifications([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load pet care data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [computeHealthSummary]);

  useEffect(() => {
    loadCareData();
  }, [loadCareData]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadCareData().catch(() => {
        // Swallow interval errors; the main call already surfaced feedback.
      });
    }, 60000);

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadCareData is stable, only run interval setup once

  const handleAction = useCallback(
    async (action: CareAction, arg?: string | number) => {
      try {
        setActionLoading(true);
        setError(null);
        switch (action) {
          case 'feed': {
            const foodType = typeof arg === 'string' ? arg : 'standard';
            const response = await feedPetAction(foodType);
            updateFromAction(response);
            break;
          }
          case 'play': {
            const gameType = typeof arg === 'string' ? arg : 'fetch';
            const response = await playWithPet(gameType);
            updateFromAction(response);
            break;
          }
          case 'bathe': {
            const response = await bathePetAction();
            updateFromAction(response);
            break;
          }
          case 'rest': {
            const duration = typeof arg === 'number' ? arg : 1;
            const response = await restPetAction(duration);
            updateFromAction(response);
            break;
          }
          default:
            break;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Action failed. Please try again.';
        setError(message);
      } finally {
        setActionLoading(false);
      }
    },
    [updateFromAction],
  );

  const statEntries = useMemo(() => {
    if (!stats) {
      return [];
    }
    const level = stats.level ?? 1;
    const xp = stats.xp ?? 0;
    const threshold = Math.max(1, level * 120);
    const progress = Math.min(100, Math.round((xp / threshold) * 100));
    const hygiene = stats.hygiene ?? stats.cleanliness ?? 60;
    
    // Calculate happiness score (weighted average)
    const happiness = Math.round(
      (stats.hunger * 0.25 +
       hygiene * 0.20 +
       stats.energy * 0.25 +
       stats.health * 0.30)
    );
    
    return [
      { key: 'happiness', label: 'Happiness', value: happiness, isSpecial: true },
      { key: 'hunger', label: 'Hunger', value: stats.hunger },
      { key: 'hygiene', label: 'Hygiene', value: hygiene },
      { key: 'energy', label: 'Energy', value: stats.energy },
      { key: 'health', label: 'Health', value: stats.health },
      { key: 'xp', label: `Level ${level} Progress`, value: progress, isSpecial: true },
    ];
  }, [stats]);

  const evolutionStage = useMemo(() => {
    if (!stats) return null;
    const level = stats.level ?? 1;
    return getEvolutionStage(level);
  }, [stats, getEvolutionStage]);

  const moodInitial = ((stats?.mood ?? '?').slice(0, 1) || '?').toUpperCase();

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Pet care unavailable</p>
        <p className="mt-2 text-sm">{error}</p>
        <button
          className="mt-4 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
          onClick={() => loadCareData()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {showEvolution && evolutionData && (
        <EvolutionAnimation
          petName="Your Pet"
          oldStage={evolutionData.oldStage as any}
          newStage={evolutionData.newStage as any}
          level={evolutionData.level}
          onComplete={() => {
            setShowEvolution(false);
            setEvolutionData(null);
          }}
        />
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Pet Care Controls</h2>
            <p className="text-sm text-slate-500">
              Keep your companion happy. Each interaction updates stats and diary entries instantly.
            </p>
          </div>
          <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-indigo-600">
            {stats?.mood ? `Mood: ${stats.mood}` : 'Mood pending'}
          </div>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
            <h3 className="text-sm font-semibold text-indigo-700">Feed</h3>
            <p className="mt-1 text-xs text-indigo-500">Meals raise hunger and happiness. Treats boost morale!</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {foodOptions.map((option) => (
                <button
                  key={option.id}
                  className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                  disabled={actionLoading}
                  onClick={() => handleAction('feed', option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-4">
            <h3 className="text-sm font-semibold text-teal-700">Play</h3>
            <p className="mt-1 text-xs text-teal-500">Games burn energy but skyrocket happiness.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {gameOptions.map((option) => (
                <button
                  key={option.id}
                  className="rounded-md bg-teal-600 px-3 py-1 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-50"
                  disabled={actionLoading}
                  onClick={() => handleAction('play', option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-4">
            <h3 className="text-sm font-semibold text-sky-700">Bathtime</h3>
            <p className="mt-1 text-xs text-sky-500">A fresh bath improves cleanliness and boosts health.</p>
            <button
              className="mt-3 inline-flex items-center rounded-md bg-sky-600 px-3 py-1 text-sm font-medium text-white shadow hover:bg-sky-700 disabled:opacity-50"
              disabled={actionLoading}
              onClick={() => handleAction('bathe')}
            >
              Run Bubble Bath
            </button>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4">
            <h3 className="text-sm font-semibold text-amber-700">Rest</h3>
            <p className="mt-1 text-xs text-amber-500">Sleep restores energy and gradually improves health.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {restOptions.map((option) => (
                <button
                  key={option.id}
                  className="rounded-md bg-amber-500 px-3 py-1 text-sm font-medium text-white shadow hover:bg-amber-600 disabled:opacity-50"
                  disabled={actionLoading}
                  onClick={() => handleAction('rest', option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="mt-6 space-y-4">
          <div className="relative rounded-lg border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
            <div className="absolute -top-3 left-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
              AI Reaction
            </div>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600 ring-2 ring-indigo-400">
                {moodInitial}
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-inner shadow-indigo-100">
                <p className="text-sm text-slate-700">
                  {reaction || "Your pet is waiting for your next move!"}
                </p>
              </div>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-700">Scout&apos;s Tips</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                {notifications.map((note, index) => (
                  <li key={`${note}-${index}`}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      <section className="flex flex-col gap-6">
        {/* Evolution Stage Badge */}
        {evolutionStage && (
          <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-purple-700 mb-2">Evolution Stage</h3>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{evolutionStage === 'egg' ? '🥚' : evolutionStage === 'juvenile' ? '🌟' : evolutionStage === 'adult' ? '⭐' : '✨'}</span>
              <div>
                <p className="text-lg font-bold text-purple-900 capitalize">{evolutionStage}</p>
                <p className="text-xs text-purple-600">Level {stats?.level ?? 1}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Current Stats</h3>
          <div className="mt-4 space-y-4">
            {statEntries.map((entry) => (
              <motion.div
                key={entry.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span className={entry.isSpecial ? 'font-bold text-indigo-600' : ''}>{entry.label}</span>
                  <span className={entry.isSpecial ? 'font-bold text-indigo-600' : ''}>{entry.value}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className={`h-2 rounded-full transition-all ${
                      entry.isSpecial
                        ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, entry.value))}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
            {healthSummary && (
              <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                <p className="font-semibold">Health Check</p>
                <p className="mt-1">{healthSummary.summary}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Activity Diary</h3>
            <button
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              onClick={() => loadCareData()}
            >
              Refresh
            </button>
          </div>
          <ul className="mt-4 space-y-4 overflow-auto pr-1 text-sm">
            {diary.length === 0 && (
              <li className="rounded-md bg-slate-50 p-3 text-slate-500">
                No diary entries yet. Take your pet on an adventure!
              </li>
            )}
            {diary.map((entry) => (
              <li key={entry.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold capitalize">Mood: {entry.mood || 'unknown'}</span>
                  <span>{dayjs(entry.created_at).format('MMM D, h:mm A')}</span>
                </div>
                <p className="mt-2 text-slate-700">{entry.note || entry.entry_text || 'No note recorded.'}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
    </>
  );
}

