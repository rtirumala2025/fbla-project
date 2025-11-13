/**
 * PetAIDashboard Component
 * Displays AI insights, mood, personality, and natural language commands
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getPetAIHelp,
  getPetAIInsights,
  getPetAINotifications,
  parsePetAICommand,
} from '../../api/pets';
import type {
  PetAIInsights,
  PetCommandResponse,
  PetHelpResponse,
  PetNotification,
} from '../../types/pet';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface CommandHistoryEntry {
  input: string;
  result: PetCommandResponse;
}

export function PetAIDashboard() {
  const [insights, setInsights] = useState<PetAIInsights | null>(null);
  const [notifications, setNotifications] = useState<PetNotification[]>([]);
  const [help, setHelp] = useState<PetHelpResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commandText, setCommandText] = useState('');
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);

  const refreshInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [overview, alerts, helpResponse] = await Promise.all([
        getPetAIInsights(),
        getPetAINotifications(),
        getPetAIHelp(),
      ]);

      setInsights(overview);
      setNotifications(alerts);
      setHelp(helpResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load AI insights.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInsights();
  }, [refreshInsights]);

  const handleCommandSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!commandText.trim()) return;

      try {
        setCommandLoading(true);
        setError(null);
        const result = await parsePetAICommand({ command_text: commandText });
        setCommandHistory((prev) => [{ input: commandText, result }, ...prev].slice(0, 5));
        setCommandText('');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to parse command.';
        setError(message);
      } finally {
        setCommandLoading(false);
      }
    },
    [commandText],
  );

  const combinedSuggestions = useMemo(() => {
    if (!insights) {
      return [];
    }
    return Array.from(
      new Set([...(help?.suggestions ?? []), ...(insights.help_suggestions ?? [])]),
    ).slice(0, 6);
  }, [help?.suggestions, insights]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-purple-200 bg-purple-50">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h3 className="text-lg font-semibold">AI insights unavailable</h3>
        <p className="mt-2 text-sm">{error}</p>
        <button
          className="mt-4 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
          onClick={() => refreshInsights()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Pet AI Overview</h2>
            <p className="text-sm text-slate-500">
              Real-time emotional state, personality, and adaptive guidance powered by the AI
              companion.
            </p>
          </div>
          <button
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
            onClick={() => refreshInsights()}
          >
            Refresh
          </button>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
            <h3 className="text-sm font-semibold text-indigo-700">Mood Snapshot</h3>
            <p className="mt-2 text-2xl font-bold text-indigo-900">
              {insights.mood_label}
              <span className="ml-2 text-sm font-medium text-indigo-500">
                Score: {insights.mood_score.toFixed(1)}
              </span>
            </p>
            <ul className="mt-3 space-y-1 text-sm text-indigo-700">
              {insights.recommended_actions.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-4">
            <h3 className="text-sm font-semibold text-purple-700">Personality Traits</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {insights.personality_traits.map((trait) => (
                <span
                  key={trait}
                  className="rounded-full bg-purple-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700"
                >
                  {trait}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-purple-700">{insights.personality_summary}</p>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
            <h3 className="text-sm font-semibold text-emerald-700">Health Forecast</h3>
            <p className="mt-2 text-base font-semibold text-emerald-900">{insights.predicted_health}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Risk: {insights.health_risk_level.toUpperCase()}
            </span>
            <ul className="mt-3 space-y-1 text-sm text-emerald-700">
              {insights.health_factors.map((factor) => (
                <li key={factor}>• {factor}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4">
            <h3 className="text-sm font-semibold text-amber-700">Adaptive Behavior</h3>
            <p className="mt-2 text-sm text-amber-700">
              Recommended mini-game difficulty:{' '}
              <span className="font-semibold text-amber-900">{insights.recommended_difficulty}</span>
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Care style detected:{' '}
              <span className="font-semibold text-amber-900">{insights.care_style}</span>
            </p>
            <p className="mt-3 text-xs text-amber-600">
              Difficulty adjusts automatically as your care style evolves. Keep experimenting with
              different activities for balanced growth.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">AI Help & Suggestions</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {combinedSuggestions.map((tip) => (
              <li key={tip} className="rounded-md bg-slate-50 p-2">
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Notifications</h3>
            <span className="text-xs font-medium text-slate-500">
              {notifications.length} active
            </span>
          </div>
          <ul className="mt-3 space-y-3 text-sm">
            {notifications.map((notification, index) => (
              <li
                key={`${notification.stat ?? 'general'}-${index}`}
                className="rounded-md border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase">
                    {notification.severity} • {notification.urgency.toUpperCase()}
                  </span>
                  {notification.stat && <span>{notification.stat.toUpperCase()}</span>}
                </div>
                <p className="mt-2 text-slate-700">{notification.message}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Natural Language Commands</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try phrases like &ldquo;feed my cat tuna&rdquo; or &ldquo;let&apos;s play fetch&rdquo;.
          </p>
          <form className="mt-3 space-y-3" onSubmit={handleCommandSubmit}>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Type a command..."
              value={commandText}
              onChange={(event) => setCommandText(event.target.value)}
              disabled={commandLoading}
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
              disabled={commandLoading}
            >
              {commandLoading ? 'Analyzing...' : 'Parse Command'}
            </button>
          </form>

          {commandHistory.length > 0 && (
            <div className="mt-4 space-y-3">
              {commandHistory.map((entry, index) => (
                <div key={`${entry.input}-${index}`} className="rounded-md bg-slate-50 p-3 text-xs">
                  <p className="font-semibold text-slate-600">Input: {entry.input}</p>
                  <p className="mt-1 text-slate-600">
                    Action:{' '}
                    <span className="font-semibold text-slate-900">
                      {entry.result.action ?? 'Unknown'}
                    </span>
                    {' • '}
                    Confidence: {(entry.result.confidence * 100).toFixed(0)}%
                  </p>
                  {Object.keys(entry.result.parameters).length > 0 && (
                    <div className="mt-1 text-slate-600">
                      Parameters:{' '}
                      {Object.entries(entry.result.parameters)
                        .map(([key, value]) => `${key}=${value}`)
                        .join(', ')}
                    </div>
                  )}
                  <p className="mt-1 text-slate-500">Note: {entry.result.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

