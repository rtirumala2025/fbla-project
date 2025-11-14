/**
 * PetAIDashboard Component
 * Displays AI insights, mood, personality, and natural language commands
 * FBLA Competition-Level: Enhanced with validation, tooltips, error messages, smooth transitions, mobile-friendly, and logging
 */
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, CheckCircle2, Send, Loader2 } from 'lucide-react';
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
import { useInteractionLogger } from '../../hooks/useInteractionLogger';

interface CommandHistoryEntry {
  input: string;
  result: PetCommandResponse;
}

const MIN_COMMAND_LENGTH = 2;
const MAX_COMMAND_LENGTH = 200;

export function PetAIDashboard() {
  const [insights, setInsights] = useState<PetAIInsights | null>(null);
  const [notifications, setNotifications] = useState<PetNotification[]>([]);
  const [help, setHelp] = useState<PetHelpResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commandText, setCommandText] = useState('');
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [commandTouched, setCommandTouched] = useState(false);
  const [showCommandTooltip, setShowCommandTooltip] = useState(false);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const { logFormSubmit, logFormValidation, logFormError, logUserAction } = useInteractionLogger('PetAIDashboard');

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

  const validateCommand = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Command cannot be empty';
    }
    if (trimmed.length < MIN_COMMAND_LENGTH) {
      return `Command must be at least ${MIN_COMMAND_LENGTH} characters`;
    }
    if (trimmed.length > MAX_COMMAND_LENGTH) {
      return `Command must be no more than ${MAX_COMMAND_LENGTH} characters`;
    }
    return null;
  };

  const handleCommandChange = (value: string) => {
    setCommandText(value);
    setCommandTouched(true);
    setCommandError(null);
    
    if (commandTouched) {
      const error = validateCommand(value);
      setCommandError(error);
      if (error) {
        logFormValidation('command', false, error);
      } else {
        logFormValidation('command', true);
      }
    }
    
    logUserAction('command_input', { length: value.length });
  };

  const handleCommandSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCommandTouched(true);
      
      const validationError = validateCommand(commandText);
      if (validationError) {
        setCommandError(validationError);
        logFormError('command', validationError);
        commandInputRef.current?.focus();
        return;
      }

      if (!commandText.trim()) {
        const emptyError = 'Command cannot be empty';
        setCommandError(emptyError);
        logFormError('command', emptyError);
        commandInputRef.current?.focus();
        return;
      }

      try {
        setCommandLoading(true);
        setCommandError(null);
        setError(null);
        
        logFormSubmit({ command: commandText.trim() }, false);
        
        const result = await parsePetAICommand({ command_text: commandText.trim() });
        setCommandHistory((prev) => [{ input: commandText.trim(), result }, ...prev].slice(0, 5));
        setCommandText('');
        setCommandTouched(false);
        
        logFormSubmit({ command: commandText.trim() }, true);
        logUserAction('command_success', { action: result.action, confidence: result.confidence });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to parse command.';
        setCommandError(message);
        setError(message);
        logFormError('command_parse', message, { command: commandText.trim() });
      } finally {
        setCommandLoading(false);
      }
    },
    [commandText, commandTouched, logFormSubmit, logFormError, logFormValidation, logUserAction],
  );

  const handleCommandBlur = () => {
    setCommandTouched(true);
    const error = validateCommand(commandText);
    setCommandError(error);
    if (error) {
      logFormValidation('command', false, error);
    }
  };

  const isCommandValid = !commandError && commandText.trim().length >= MIN_COMMAND_LENGTH;

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

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Natural Language Commands</h3>
            <button
              type="button"
              className="inline-flex items-center"
              onMouseEnter={() => setShowCommandTooltip(true)}
              onMouseLeave={() => setShowCommandTooltip(false)}
              onFocus={() => setShowCommandTooltip(true)}
              onBlur={() => setShowCommandTooltip(false)}
              aria-label="Command help"
            >
              <HelpCircle className="w-4 h-4 text-slate-400 hover:text-indigo-500 transition-colors" />
            </button>
          </div>
          
          {/* Tooltip */}
          <AnimatePresence>
            {showCommandTooltip && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600"
              >
                <p className="font-semibold mb-1">Try commands like:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>&ldquo;feed my cat tuna&rdquo;</li>
                  <li>&ldquo;let&apos;s play fetch&rdquo;</li>
                  <li>&ldquo;give my pet a bath&rdquo;</li>
                  <li>&ldquo;check my pet&apos;s health&rdquo;</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="mt-1 text-xs text-slate-500 mb-3">
            Use natural language to interact with your pet
          </p>
          
          <form className="mt-3 space-y-3" onSubmit={handleCommandSubmit}>
            <div className="relative">
              <input
                ref={commandInputRef}
                type="text"
                className={`w-full rounded-md border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                  commandTouched && commandError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : commandTouched && isCommandValid
                    ? 'border-green-500 focus:border-indigo-500 focus:ring-indigo-500/20'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                placeholder="Type a command..."
                value={commandText}
                onChange={(event) => handleCommandChange(event.target.value)}
                onBlur={handleCommandBlur}
                disabled={commandLoading}
                maxLength={MAX_COMMAND_LENGTH}
                aria-invalid={commandTouched && !!commandError}
                aria-describedby={commandTouched && commandError ? 'command-error' : commandTouched && isCommandValid ? 'command-success' : undefined}
              />
              
              {/* Validation icon */}
              {commandTouched && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait">
                    {commandError ? (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
                      </motion.div>
                    ) : isCommandValid ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            {/* Error message */}
            <AnimatePresence>
              {commandTouched && commandError && (
                <motion.p
                  id="command-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-red-600 font-medium"
                  role="alert"
                >
                  {commandError}
                </motion.p>
              )}
              {commandTouched && isCommandValid && (
                <motion.p
                  id="command-success"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-green-600 font-medium"
                >
                  Ready to send!
                </motion.p>
              )}
            </AnimatePresence>
            
            <motion.button
              type="submit"
              whileHover={!commandLoading && isCommandValid ? { scale: 1.02 } : {}}
              whileTap={!commandLoading && isCommandValid ? { scale: 0.98 } : {}}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-full sm:w-auto"
              disabled={commandLoading || !isCommandValid}
              aria-label={isCommandValid ? "Submit command" : "Please enter a valid command"}
            >
              {commandLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Parse Command</span>
                </>
              )}
            </motion.button>
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

