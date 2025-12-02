import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ARSessionView } from '../../components/ar/ARSessionView';
import { DailyChallengeCard } from '../../components/minigames/DailyChallengeCard';
import { GameLeaderboardPanel } from '../../components/minigames/GameLeaderboardPanel';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { NotificationCenter, type NotificationItem } from '../../components/ui/NotificationCenter';
import { useAuth } from '../../contexts/AuthContext';
import { usePet } from '../../context/PetContext';
import { useToast } from '../../contexts/ToastContext';
import {
  fetchARSession,
  fetchHabitPrediction,
  fetchSeasonalEvent,
  fetchWeatherReaction,
  saveCloudState,
  sendSocialInteraction,
  sendVoiceCommand,
} from '../../api/nextGen';
import { fetchSnapshot } from '../../api/analytics';
import type { AnalyticsSnapshot } from '../../types/analytics';
import type {
  ARSessionResponse,
  HabitPredictionResponse,
  SeasonalEventResponse,
  SocialInteractionResponse,
  VoiceCommandResponse,
  WeatherReactionResponse,
} from '../../types/nextGen';
import type { GameLeaderboardEntry } from '../../types/game';
import { minigameService } from '../../services/minigameService';

declare global {
  interface Window {
    SpeechRecognition?: { new (): unknown };
    webkitSpeechRecognition?: { new (): unknown };
  }
}

type SpeechRecognitionEventLike = {
  results: Array<{ 0: { transcript: string } }>;
};

type SpeechRecognitionType = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: () => void;
};

export const NextGenHub: React.FC = () => {
  const { currentUser } = useAuth();
  const { pet } = usePet();
  const toast = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [arSession, setArSession] = useState<ARSessionResponse | null>(null);
  const [weather, setWeather] = useState<WeatherReactionResponse | null>(null);
  const [habits, setHabits] = useState<string | null>(null);
  const [habitPrediction, setHabitPrediction] = useState<HabitPredictionResponse | null>(null);
  const [seasonal, setSeasonal] = useState<SeasonalEventResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<GameLeaderboardEntry[]>([]);
  const [voiceResult, setVoiceResult] = useState<VoiceCommandResponse | null>(null);
  const [socialResponse, setSocialResponse] = useState<SocialInteractionResponse | null>(null);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const [isListening, setIsListening] = useState(false);

  const supportsSpeech = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [snapshotData, ar, habitPrediction, seasonalEvent, leaderboardEntries] = await Promise.all([
          fetchSnapshot(),
          fetchARSession(),
          fetchHabitPrediction(),
          fetchSeasonalEvent(),
          minigameService.fetchLeaderboard('fetch').catch(() => []), // Fallback to empty array
        ]);
        setSnapshot(snapshotData);
        setArSession(ar);
        setHabitPrediction(habitPrediction);
        
        // Enhanced habit prediction display with AI suggestions
        const habitText = habitPrediction.preferred_actions.length > 0
          ? `${habitPrediction.preferred_actions.join(', ')} around ${habitPrediction.next_best_time}`
          : 'No prediction yet. Keep interacting with your pet!';
        setHabits(habitText);
        
        // Show habit prediction notification if available
        if (habitPrediction.notification_message) {
          setNotifications((prev) => [
            {
              id: `habit-prediction-${Date.now()}`,
              title: 'Habit Prediction',
              message: habitPrediction.notification_message || '',
              type: 'info' as const,
            },
            ...prev,
          ]);
        }
        
        setSeasonal(seasonalEvent);
        setLeaderboard(leaderboardEntries);
      } catch (error: any) {
        console.error('Failed to load next-gen data', error);
        // Don't show toast - APIs will fallback to mock data automatically
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (!supportsSpeech) return;
    const SpeechRecognitionCtor =
      (window.SpeechRecognition || window.webkitSpeechRecognition) as
        | (new () => SpeechRecognitionType)
        | undefined;
    if (!SpeechRecognitionCtor) {
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = async (event: SpeechRecognitionEventLike) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      try {
        const response = await sendVoiceCommand({ transcript });
        setVoiceResult(response);
        
        // Enhanced notification with action feedback
        const notificationType = response.confidence > 0.7 ? 'success' : response.confidence > 0.5 ? 'info' : 'warning';
        setNotifications((prev) => [
          {
            id: `voice-${response.intent}-${Date.now()}`,
            title: response.action ? 'Voice command executed' : 'Voice intent detected',
            message: response.feedback || `${response.intent} (${(response.confidence * 100).toFixed(0)}% confidence)`,
            type: notificationType,
          },
          ...prev,
        ]);
        
        // Show success toast if action was executed
        if (response.action && response.confidence > 0.7) {
          toast.success(response.feedback || 'Voice command executed successfully!');
          
          // Navigate based on action
          if (response.action === 'open_analytics') {
            navigate('/analytics');
          } else if (response.action === 'open_quests') {
            navigate('/dashboard'); // Quests are in dashboard
          } else if (response.action === 'open_shop') {
            navigate('/shop');
          } else if (response.action === 'open_budget') {
            navigate('/budget');
          } else if (response.action === 'check_status') {
            navigate('/dashboard'); // Status is shown in dashboard
          }
        }
      } catch (error: any) {
        console.error('Voice command failed', error);
        // Don't show toast for voice command failures - they're not critical
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, [supportsSpeech]);

  const requestWeather = useCallback(async () => {
    try {
      const coords = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });
      const reaction = await fetchWeatherReaction(coords.coords.latitude, coords.coords.longitude);
      setWeather(reaction);
    } catch (_error) {
      // Fallback to NYC coordinates, API will use mock data if it fails
      try {
        const reaction = await fetchWeatherReaction(40.7128, -74.006);
        setWeather(reaction);
      } catch (err) {
        // API will return mock data, so this should not fail
        console.warn('Weather request failed', err);
      }
    }
  }, []);

  useEffect(() => {
    requestWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestWeather]);

  const snapshotHighlights = useMemo(() => {
    if (!snapshot) return [];
    const { daily_summary: summary } = snapshot;
    const formatNumber = (value: number) => value.toLocaleString();
    return [
      { label: 'Coins earned', value: `${formatNumber(summary.coins_earned)} 🪙` },
      { label: 'Pet actions', value: `${formatNumber(summary.pet_actions)} 🐾` },
      { label: 'Avg happiness', value: `${Math.round(summary.avg_happiness)}% 😊` },
      { label: 'Avg health', value: `${Math.round(summary.avg_health)}% ❤️` },
    ];
  }, [snapshot]);

  const aiSummary = snapshot?.daily_summary.ai_summary ?? null;

  const handleCloudSave = async () => {
    if (!pet || !currentUser?.uid) return;
    try {
      const response = await saveCloudState({
        state: { pet, stats: pet.stats, timestamp: new Date().toISOString() },
      });
      setCloudStatus(`Cloud save at ${new Date(response.saved_at).toLocaleTimeString()}`);
      toast.success('Cloud state saved!');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to save to cloud');
    }
  };

  const handleSocialSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pet || !currentUser?.uid) return;
    const formData = new FormData(event.currentTarget);
    const targetId = formData.get('targetPetId') as string;
    const prompt = formData.get('prompt') as string;
    if (!targetId || !prompt) return;
    try {
      const response = await sendSocialInteraction({
        pet_id: pet.id,
        target_pet_id: targetId,
        prompt,
      });
      setSocialResponse(response);
      toast.success('Social interaction recorded.');
    } catch (error: any) {
      toast.error(error?.message || 'Social interaction failed');
    }
  };

  const toggleListening = () => {
    if (!supportsSpeech) return;
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const quizQuestion = useMemo(
    () => ({
      question: 'How many coins do you earn from a perfect fetch round?',
      options: ['5', '10', '20', '30'],
      answer: '20',
    }),
    [],
  );
  const [quizResult, setQuizResult] = useState<string | null>(null);

  const handleQuiz = (choice: string) => {
    if (choice === quizQuestion.answer) {
      setQuizResult('Correct! Your pet is proud of your financial savvy.');
      toast.success('Quiz correct! Bonus streak recorded.');
    } else {
      setQuizResult('Not quite. Play another mini-game to review the rules.');
      toast.error('Try again! Review the finance analytics panel.');
    }
  };

  const mood = pet?.stats?.mood?.toLowerCase() ?? 'calm';
  const moodGradients: Record<string, string> = {
    happy: 'from-emerald-100 via-emerald-50 to-white',
    excited: 'from-rose-100 via-orange-50 to-amber-50',
    calm: 'from-sky-100 via-indigo-50 to-white',
    playful: 'from-fuchsia-100 via-purple-50 to-white',
    tired: 'from-slate-900 via-indigo-900 to-slate-800 text-white',
    cozy: 'from-amber-100 via-rose-50 to-white',
  };
  const gradient = moodGradients[mood] ?? moodGradients.calm;
  const moodBannerIsDark = gradient.includes('text-white');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <NotificationCenter
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((item) => item.id !== id))}
      />
      <div className={`min-h-screen bg-gradient-to-br ${gradient.replace(' text-white', '')} px-6 pb-16 ${moodBannerIsDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-900">Next-Gen Companion Lab</h1>
                <p className="text-sm text-slate-600">
                  Experiment with social interactions, voice commands, AR sessions, and smart insights.
                </p>
              </div>
              <button
                onClick={handleCloudSave}
                className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
              >
                Save to Cloud
              </button>
            </div>
            {pet && (
              <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${moodBannerIsDark ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                Mood synced: <span className="capitalize">{mood}</span>
              </div>
            )}
            {cloudStatus && <p className="mt-2 text-xs text-emerald-600">{cloudStatus}</p>}
          </div>

          {seasonal && (
            <div className="rounded-3xl border-2 border-amber-200 bg-amber-50/70 p-6 shadow-soft">
              <h2 className="text-xl font-semibold text-amber-700">{seasonal.event_name}</h2>
              <p className="text-sm text-amber-800">{seasonal.message}</p>
              {seasonal.rewards.length > 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  Rewards: {seasonal.rewards.join(', ')}
                </p>
              )}
            </div>
          )}

          {snapshotHighlights.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-800">Today&apos;s care snapshot</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {snapshotHighlights.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-slate-50 p-4 shadow-inner">
                    <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
              {aiSummary && (
                <p className="mt-4 text-sm text-slate-600">
                  {aiSummary}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={handleSocialSubmit}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-3"
            >
              <h2 className="text-lg font-semibold text-slate-800">Pet Social Interaction (Preview)</h2>
              <label className="text-xs font-semibold text-slate-500" htmlFor="targetPetId">
                Target Pet ID
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                name="targetPetId"
                id="targetPetId"
                placeholder="00000000-0000-0000-0000-000000000000"
                required
              />
              <label className="text-xs font-semibold text-slate-500" htmlFor="prompt">
                Conversation prompt
              </label>
              <textarea
                className="h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                name="prompt"
                id="prompt"
                placeholder="Plan a co-op fetch challenge..."
                required
              />
              <button
                type="submit"
                className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              >
                Send Social Ping
              </button>
              {socialResponse && (
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">Summary</p>
                  <p>{socialResponse.summary}</p>
                  <p className="mt-1 text-slate-500">Follow-up: {socialResponse.suggested_follow_up}</p>
                </div>
              )}
            </form>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Voice Commands</h2>
                {!supportsSpeech && (
                  <span className="text-xs font-semibold text-amber-600">Browser not supported</span>
                )}
              </div>
              <button
                onClick={toggleListening}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow ${
                  isListening ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`}
                disabled={!supportsSpeech}
              >
                {isListening ? 'Listening… tap to stop' : 'Tap to speak'}
              </button>
              {voiceResult && (
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p>
                    Intent: <strong>{voiceResult.intent}</strong> ({(voiceResult.confidence * 100).toFixed(0)}%)
                  </p>
                  <p>{voiceResult.feedback}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ARSessionView session={arSession} petName={pet?.name} />

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-800">Weather Reaction</h2>
              <button
                onClick={requestWeather}
                className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary"
              >
                Refresh weather
              </button>
              {weather && (
                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <p>
                    Condition: <strong>{weather.condition}</strong> ({weather.temperature_c.toFixed(1)} °C)
                  </p>
                  <p>{weather.reaction}</p>
                  <p className="text-slate-500">{weather.recommendation}</p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-800">Habit Predictions</h2>
              <p className="mt-2 text-sm text-slate-600">
                {habits ?? 'No prediction yet. Keep interacting with your pet!'}
              </p>
              {habitPrediction?.ai_suggestions && habitPrediction.ai_suggestions.length > 0 && (
                <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs font-semibold text-emerald-800">AI Suggestions:</p>
                  <ul className="mt-1 space-y-1 text-xs text-emerald-700">
                    {habitPrediction.ai_suggestions.map((suggestion, idx) => (
                      <li key={idx}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-3">
              <h2 className="text-lg font-semibold text-slate-800">Gamified Quiz</h2>
              <p className="text-sm text-slate-600">{quizQuestion.question}</p>
              <div className="flex flex-wrap gap-2">
                {quizQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleQuiz(option)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary"
                  >
                    {option}
                  </button>
                ))}
              </div>
              {quizResult && <p className="text-xs text-slate-500">{quizResult}</p>}
            </div>

            <GameLeaderboardPanel entries={leaderboard} gameType="fetch" />
          </div>

          <DailyChallengeCard
            challengeText="Use a voice command and complete a social ping to unlock the AR celebration badge."
            progress={`Voice command: ${voiceResult ? '✅' : '❌'} • Social ping: ${socialResponse ? '✅' : '❌'}`}
          />
        </div>
      </div>
    </>
  );
};

export default NextGenHub;

