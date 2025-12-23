/**
 * DashboardPage - Comprehensive Dashboard
 * Integrates 3D pet visualization, stats, quests, actions, analytics, and accessories
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  TrendingUp, 
  // Coins, // Unused
  RefreshCw,
  ShoppingBag,
  ChevronUp,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePet } from '../context/PetContext';
import { useToast } from '../contexts/ToastContext';
import { useFinancial } from '../context/FinancialContext';
import { PetStatsDisplay } from '../components/dashboard/PetStatsDisplay';
import { QuestBoard } from '../components/quests/QuestBoard';
import { CoachPanel } from '../components/coach/CoachPanel';
import { fetchActiveQuests, completeQuest, fetchCoachAdvice } from '../api/quests';
import type { CoachAdviceResponse } from '../types/quests';
import { fetchAccessories } from '../api/accessories';
import { fetchSnapshot, exportReports } from '../api/analytics';
import { logPetInteraction } from '../utils/petInteractionLogger';
import { useInteractionLogger } from '../hooks/useInteractionLogger';
import type { ActiveQuestsResponse, Quest } from '../types/quests';
import type { Accessory, AccessoryEquipResponse } from '../types/accessories';
import type { AnalyticsSnapshot, SnapshotNotification, SnapshotSummary, TrendSeries } from '../types/analytics';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DailyChallengeCard } from '../components/minigames/DailyChallengeCard';
import { useAccessoriesRealtime } from '../hooks/useAccessoriesRealtime';
import { useCoachRealtime } from '../hooks/useCoachRealtime';
import { shopService } from '../services/shopService';
import { earnService, type Chore } from '../services/earnService';

// Lazy load heavy components
const Pet3DVisualization = lazy(() => import('../components/pets/Pet3DVisualization'));
const ExpensePieChart = lazy(() => import('../components/analytics/ExpensePieChart'));
const TrendChart = lazy(() => import('../components/analytics/TrendChart'));

type FoodOption = {
  id: string;
  name: string;
  cost: number;
  hungerGain: number;
  happinessGain?: number;
  healthGain?: number;
  emoji: string;
};

type Activity = { 
  id: string; 
  name: string; 
  cost: number; 
  energyCost: number; 
  benefits: string; 
  emoji: string; 
  path?: string 
};

type EarnTab = 'chores' | 'minigames' | 'achievements';

const FOODS: FoodOption[] = [
  { id: 'basic-kibble', name: 'Basic Kibble', cost: 5, hungerGain: 20, emoji: '🥣' },
  { id: 'premium-food', name: 'Premium Food', cost: 15, hungerGain: 40, happinessGain: 5, emoji: '🍖' },
  { id: 'healthy-meal', name: 'Healthy Meal', cost: 12, hungerGain: 30, healthGain: 3, emoji: '🥗' },
  { id: 'treat', name: 'Treat', cost: 8, hungerGain: 15, happinessGain: 10, emoji: '🍪' },
  { id: 'gourmet', name: 'Gourmet Dinner', cost: 25, hungerGain: 50, happinessGain: 10, healthGain: 5, emoji: '🍱' },
];

const ACTIVITIES: Activity[] = [
  { id: 'free', name: 'Free Play', cost: 0, energyCost: 15, benefits: '+10 happiness', emoji: '🎈', path: '/minigames/reaction' },
  { id: 'fetch', name: 'Fetch', cost: 5, energyCost: 20, benefits: '+20 happiness', emoji: '🎾', path: '/minigames/fetch' },
  { id: 'puzzle', name: 'Puzzle Toy', cost: 10, energyCost: 10, benefits: '+25 happiness, +5 intelligence', emoji: '🧩', path: '/minigames/puzzle' },
  { id: 'adventure', name: 'Outdoor Adventure', cost: 15, energyCost: 30, benefits: '+35 happiness, +5 health', emoji: '⛺', path: '/minigames/dream' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { pet, loading: petLoading, bathe, updatePetStats, refreshPet } = usePet();
  const { success, error: toastError } = useToast();
  const { balance, refreshBalance } = useFinancial();
  const logger = useInteractionLogger('DashboardPage');
  
  // Feed state
  const [selectedFood, setSelectedFood] = useState<FoodOption | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  
  // Play state
  const [showPlay, setShowPlay] = useState(false);
  
  // Earn state
  const [earnTab, setEarnTab] = useState<EarnTab>('chores');
  const [chores, setChores] = useState<Chore[]>([]);
  const [showEarn, setShowEarn] = useState(false);
  const [choreCooldowns, setChoreCooldowns] = useState<Record<string, number>>({});

  // State
  const [quests, setQuests] = useState<ActiveQuestsResponse | null>(null);
  const [coachAdvice, setCoachAdvice] = useState<CoachAdviceResponse | null>(null);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [equippedAccessories, setEquippedAccessories] = useState<AccessoryEquipResponse[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [, setLoadingAccessories] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [processingQuestId, setProcessingQuestId] = useState<string | null>(null);
  const isLoadingAnalyticsRef = useRef(false);

  // Load data
  // Individual load functions for manual refresh (keep for refresh buttons)
  const loadQuests = useCallback(async () => {
    if (!currentUser) return;
    setLoadingQuests(true);
    try {
      const data = await fetchActiveQuests();
      setQuests(data);
      logger.logUserAction('quests_loaded', { count: data.daily.length + data.weekly.length });
    } catch (err) {
      console.error('Failed to load quests:', err);
      logger.logInteraction('quests_load_error', { error: err });
    } finally {
      setLoadingQuests(false);
    }
  }, [currentUser, logger]);

  const loadCoachAdvice = useCallback(async () => {
    if (!currentUser) return;
    setLoadingCoach(true);
    try {
      const advice = await fetchCoachAdvice();
      setCoachAdvice(advice);
      logger.logUserAction('coach_advice_loaded');
    } catch (err) {
      console.error('Failed to fetch coach advice:', err);
      logger.logInteraction('coach_advice_error', { error: err });
    } finally {
      setLoadingCoach(false);
    }
  }, [currentUser, logger]);

  const loadAccessories = useCallback(async () => {
    if (!currentUser || !pet) return;
    setLoadingAccessories(true);
    try {
      const data = await fetchAccessories();
      setAccessories(data);
      
      // Load equipped accessories from Supabase
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: equippedData, error: equippedError } = await supabase
          .from('user_accessories')
          .select('*')
          .eq('pet_id', pet.id)
          .eq('equipped', true);

        if (equippedError) {
          console.error('❌ DashboardPage: Failed to load equipped accessories', equippedError);
        } else if (equippedData) {
          const equipped: AccessoryEquipResponse[] = equippedData.map((item) => ({
            accessory_id: item.accessory_id,
            pet_id: item.pet_id,
            equipped: item.equipped,
            equipped_color: item.equipped_color,
            equipped_slot: item.equipped_slot,
            applied_mood: item.applied_mood || 'happy',
            updated_at: item.updated_at,
          }));
          setEquippedAccessories(equipped);
          console.log('✅ DashboardPage: Loaded equipped accessories', {
            count: equipped.length,
            accessories: equipped.map(acc => acc.accessory_id),
          });
        }
      } catch (error) {
        console.error('❌ DashboardPage: Error loading equipped accessories', error);
        // Continue with empty array if loading fails
        setEquippedAccessories([]);
      }
      
      logger.logUserAction('accessories_loaded', { count: data.length });
    } catch (err) {
      console.error('Failed to load accessories:', err);
      logger.logInteraction('accessories_load_error', { error: err });
    } finally {
      setLoadingAccessories(false);
    }
  }, [currentUser, pet, logger]);

  const loadAnalytics = useCallback(async () => {
    if (!currentUser || isLoadingAnalyticsRef.current) return;
    try {
      isLoadingAnalyticsRef.current = true;
      setLoadingAnalytics(true);
      const data = await fetchSnapshot();
      setAnalytics(data);
      logger.logUserAction('analytics_loaded');
    } catch (err) {
      logger.logInteraction('analytics_load_error', { error: err });
    } finally {
      setLoadingAnalytics(false);
      isLoadingAnalyticsRef.current = false;
    }
  }, [currentUser, logger]);

  const handleExport = useCallback(async () => {
    if (!analytics || exporting) return;
    setExporting(true);
    try {
      const start = analytics.weekly_trend.points[0]?.timestamp.slice(0, 10);
      const end = analytics.weekly_trend.points.at(-1)?.timestamp.slice(0, 10);
      if (!start || !end) {
        throw new Error('Unable to determine date range for export');
      }
      const exportData = await exportReports(start, end);
      const blob = new Blob([exportData.content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exportData.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      success('CSV exported successfully.');
    } catch (err: any) {
      console.error('Export failed', err);
      toastError(err?.message || 'Unable to export CSV');
    } finally {
      setExporting(false);
    }
  }, [analytics, exporting, success, toastError]);

  // Memoized analytics data
  const bestInsight = useMemo(() => analytics?.ai_insights[0] ?? 'Consistent care keeps your pet thriving!', [analytics]);

  const summaries = useMemo(() => 
    analytics
      ? [analytics.daily_summary, analytics.weekly_summary, analytics.monthly_summary]
      : [],
    [analytics]
  );

  const formattedSeries = useMemo(() => {
    if (!analytics) {
      return {
        weekly: null,
        monthly: null,
        health: null,
      };
    }
    const renameSeries = (series: TrendSeries, label: string): TrendSeries => ({
      ...series,
      label,
    });
    return {
      weekly: renameSeries(analytics.weekly_trend, 'Weekly Net Coins'),
      monthly: renameSeries(analytics.monthly_trend, 'Monthly Net Coins'),
      health: renameSeries(analytics.health_progression, 'Health Average'),
    };
  }, [analytics]);

  const notificationStyles = useCallback((notification: SnapshotNotification) => {
    const base = 'rounded-2xl px-3 py-2 text-sm shadow-soft';
    switch (notification.severity) {
      case 'critical':
        return `${base} border border-rose-200 bg-rose-50 text-rose-700`;
      case 'warning':
        return `${base} border border-amber-200 bg-amber-50 text-amber-700`;
      case 'success':
        return `${base} border border-emerald-200 bg-emerald-50 text-emerald-700`;
      default:
        return `${base} border border-slate-200 bg-slate-50 text-slate-600`;
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { state: { from: '/dashboard' } });
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (currentUser && pet) {
      // Batch all API calls in parallel for faster loading
      // Priority: Critical data first, then secondary data
      const loadAllData = async () => {
        try {
          // Critical data - load in parallel
          const [questsData, coachData, accessoriesData, balanceData, choresList] = await Promise.allSettled([
            fetchActiveQuests().catch(err => {
              logger.logInteraction('quests_load_error', { error: err });
              return { daily: [], weekly: [], event: [], refreshed_at: new Date().toISOString() };
            }),
            fetchCoachAdvice().catch(err => {
              logger.logInteraction('coach_advice_error', { error: err });
              return null;
            }),
            fetchAccessories().catch(err => {
              logger.logInteraction('accessories_load_error', { error: err });
              return [];
            }),
            refreshBalance().catch(() => {
              // Balance refresh failed - continue without update
            }),
            currentUser?.uid ? earnService.listChores().catch(() => {
              return [];
            }) : Promise.resolve([]),
          ]);

          // Update state from settled promises
          if (questsData.status === 'fulfilled') {
            setQuests(questsData.value);
            logger.logUserAction('quests_loaded', { 
              count: questsData.value.daily.length + questsData.value.weekly.length 
            });
          }
          if (coachData.status === 'fulfilled') {
            setCoachAdvice(coachData.value);
            logger.logUserAction('coach_advice_loaded');
          }
          if (accessoriesData.status === 'fulfilled') {
            setAccessories(accessoriesData.value);
            
            // Load equipped accessories from Supabase
            if (pet) {
              try {
                const { supabase } = await import('../lib/supabase');
                const { data: equippedData, error: equippedError } = await supabase
                  .from('user_accessories')
                  .select('*')
                  .eq('pet_id', pet.id)
                  .eq('equipped', true);

                if (equippedError) {
                  // Failed to load equipped accessories - continue without them
                } else if (equippedData) {
                  const equipped: AccessoryEquipResponse[] = equippedData.map((item) => ({
                    accessory_id: item.accessory_id,
                    pet_id: item.pet_id,
                    equipped: item.equipped,
                    equipped_color: item.equipped_color,
                    equipped_slot: item.equipped_slot,
                    applied_mood: item.applied_mood || 'happy',
                    updated_at: item.updated_at,
                  }));
                  setEquippedAccessories(equipped);
                }
              } catch (error) {
                setEquippedAccessories([]);
              }
            }
            logger.logUserAction('accessories_loaded', { count: accessoriesData.value.length });
          }
          if (choresList.status === 'fulfilled' && choresList.value.length > 0 && currentUser?.uid) {
            setChores(choresList.value);
          
            // Batch load all cooldowns in parallel (fixes N+1 query pattern)
          try {
              const cooldownPromises = choresList.value.map(async (chore) => {
              const cd = await earnService.getChoreCooldown(currentUser.uid, chore.id);
              return [chore.id, cd] as [string, number];
            });
            
            const cooldownPairs = await Promise.all(cooldownPromises);
            const cooldowns: Record<string, number> = {};
            cooldownPairs.forEach(([choreId, cd]) => {
              cooldowns[choreId] = cd;
            });
            setChoreCooldowns(cooldowns);
          } catch (err) {
              // Failed to load cooldowns - continue without them
            }
          }

          // Secondary data - load analytics after critical data (can be slower)
          // Analytics is heavy, so load it separately to not block critical UI
          // Delay analytics load slightly to prioritize critical UI rendering
          setTimeout(() => {
            loadAnalytics().catch(() => {
              // Analytics failed - continue without it
            });
          }, 500); // 500ms delay to let critical UI render first
        } catch (err) {
          // Error loading dashboard data - continue with partial data
        }
      };

      loadAllData();
    }
  }, [currentUser, pet, loadAnalytics, logger]);

  // Subscribe to real-time accessory updates
  useAccessoriesRealtime(pet?.id || null, (updatedAccessories) => {
    setEquippedAccessories(updatedAccessories.filter((acc) => acc.equipped));
  });

  // Subscribe to real-time pet stats changes for Coach Panel
  useCoachRealtime(loadCoachAdvice, currentUser?.uid);

  // Feed with food selection
  const handleFeedWithFood = useCallback(async () => {
    if (!selectedFood || !pet || !currentUser || feedLoading) return;
    if (balance < selectedFood.cost) {
      toastError('Insufficient funds');
      return;
    }
    
    setFeedLoading(true);
    try {
      await shopService.addCoins(currentUser.uid, -selectedFood.cost, `Fed ${selectedFood.name}`);
      await refreshBalance();
      
      await updatePetStats({
        hunger: Math.min(100, pet.stats.hunger + selectedFood.hungerGain),
        happiness: Math.min(100, pet.stats.happiness + (selectedFood.happinessGain || 0)),
        health: Math.min(100, pet.stats.health + (selectedFood.healthGain || 0)),
      });
      await refreshPet();
      
      if (currentUser && pet) {
        await logPetInteraction({
          user_id: currentUser.uid,
          pet_id: pet.id,
          action_type: 'feed',
          stat_changes: {
            hunger: selectedFood.hungerGain,
            happiness: selectedFood.happinessGain || 0,
            health: selectedFood.healthGain || 0,
          },
          action_details: { food_type: selectedFood.name },
        });
      }
      
      success(`Yum! ${pet.name} loved the ${selectedFood.name}!`);
      setSelectedFood(null);
      setShowFeed(false);
    } catch (err: any) {
      console.error('Feed error:', err);
      toastError(err.message || 'Failed to feed pet');
    } finally {
      setFeedLoading(false);
    }
  }, [selectedFood, pet, currentUser, balance, feedLoading, refreshBalance, updatePetStats, refreshPet, success, toastError]);

  // Pet actions with logging (simplified feed - keeping for backwards compatibility)
  const handleFeed = useCallback(async () => {
    setShowFeed(true);
  }, []);

  const handlePlay = useCallback(async () => {
    setShowPlay(true);
  }, []);
  
  const handleActivitySelect = useCallback((activity: Activity) => {
    if (activity.path) {
      navigate(activity.path);
    }
  }, [navigate]);

  const handleBathe = useCallback(async () => {
    if (!pet || !currentUser || processingAction) return;
    
    setProcessingAction('bathe');
    try {
      const oldCleanliness = pet.stats.cleanliness;
      await bathe();
      await refreshPet();
      
      // bathe() sets cleanliness to 100 and increases happiness by 10
      const statChanges = {
        cleanliness: 100 - oldCleanliness,
        happiness: 10,
      };

      if (currentUser && pet) {
        await logPetInteraction({
          user_id: currentUser.uid,
          pet_id: pet.id,
          action_type: 'bathe',
          stat_changes: statChanges,
        });
      }

      logger.logUserAction('pet_bathed', statChanges);
      success('Pet cleaned! Cleanliness restored.');
    } catch (err) {
      console.error('Bathe error:', err);
      toastError('Failed to clean pet. Please try again.');
      logger.logInteraction('bathe_error', { error: err });
    } finally {
      setProcessingAction(null);
    }
  }, [pet, currentUser, bathe, refreshPet, processingAction, success, toastError, logger]);

  const handleEarn = useCallback(async () => {
    setShowEarn(true);
  }, []);
  
  const handleChore = useCallback(async (choreId: string) => {
    if (!currentUser) return;
    const cd = await earnService.getChoreCooldown(currentUser.uid, choreId);
    if (cd > 0) {
      toastError(`Chore on cooldown: ${cd}s remaining`);
      // Update cooldowns state
      setChoreCooldowns(prev => ({ ...prev, [choreId]: cd }));
      return;
    }
    try {
      const res = await earnService.completeChore(currentUser.uid, choreId);
      await refreshBalance();
      
      // Update cooldowns state after completing chore
      const chore = chores.find(c => c.id === choreId);
      if (chore) {
        const newCooldown = await earnService.getChoreCooldown(currentUser.uid, choreId);
        setChoreCooldowns(prev => ({ ...prev, [choreId]: newCooldown }));
      }
      
      success(`Great job! You earned $${res.reward}!`);
    } catch (err: any) {
      toastError(err.message || 'Failed to complete chore');
    }
  }, [currentUser, success, toastError, refreshBalance, chores]);
  
  const canAffordFood = useCallback((cost: number) => balance >= cost, [balance]);
  const moneyAfterFood = useMemo(() => (selectedFood ? balance - selectedFood.cost : balance), [balance, selectedFood]);

  const handleQuestComplete = useCallback(async (quest: Quest) => {
    if (!currentUser || processingQuestId) return;
    
    setProcessingQuestId(quest.id);
    try {
      const response = await completeQuest(quest.id);
      
      // Update quests state
      setQuests(prev => {
        if (!prev) return prev;
        const updateCategory = (list: Quest[]) =>
          list.map(item => item.id === quest.id ? response.result.quest : item);
        return {
          ...prev,
          daily: updateCategory(prev.daily),
          weekly: updateCategory(prev.weekly),
          event: updateCategory(prev.event),
        };
      });

      if (currentUser && pet) {
        await logPetInteraction({
          user_id: currentUser.uid,
          pet_id: pet.id,
          action_type: 'quest_complete',
          coins_earned: response.result.coins_awarded,
          xp_gained: response.result.xp_awarded,
          action_details: { quest_id: quest.id, quest_type: quest.quest_type },
        });
      }

      logger.logUserAction('quest_completed', {
        quest_id: quest.id,
        coins: response.result.coins_awarded,
        xp: response.result.xp_awarded,
      });

      success(`Quest complete! +${response.result.coins_awarded} coins, +${response.result.xp_awarded} XP.`);
      
      // Refresh coach advice after quest completion
      await loadCoachAdvice();
    } catch (err) {
      console.error('Quest completion error:', err);
      toastError('Failed to complete quest. Please try again.');
      logger.logInteraction('quest_complete_error', { error: err });
    } finally {
      setProcessingQuestId(null);
    }
  }, [currentUser, pet, processingQuestId, success, toastError, logger, loadCoachAdvice]);

  // Loading states
  if (authLoading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (petLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl font-semibold text-gray-700">Loading your pet...</div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl font-semibold text-gray-700">No pet found</div>
          <p className="mb-4 text-gray-600">Create a pet to get started!</p>
          <button
            onClick={() => navigate('/pet-selection')}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Create Pet
          </button>
        </div>
      </div>
    );
  }

  const questsData = quests || { daily: [], weekly: [], event: [], refreshed_at: new Date().toISOString() };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" style={{ willChange: 'scroll-position' }}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pet Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your pet and track progress</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/pet-game')}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-white shadow-md transition hover:shadow-lg hover:from-indigo-600 hover:to-purple-600"
            >
              <Gamepad2 className="h-4 w-4" />
              <span>Pet Game</span>
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-md transition hover:shadow-lg"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Shop</span>
            </button>
            <button
              onClick={loadAnalytics}
              disabled={loadingAnalytics}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-md transition hover:shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Main Grid - Optimized for horizontal space */}
        <div className="space-y-6">
          {/* Top Row - Pet View and Stats Side by Side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 3D Pet Visualization */}
            <div className="rounded-2xl bg-white p-6 shadow-lg" style={{ contain: 'layout style paint' }}>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">3D Pet View</h2>
              <React.Suspense fallback={
                <div className="flex h-[500px] items-center justify-center">
                  <LoadingSpinner />
                </div>
              }>
                <Pet3DVisualization
                  pet={pet}
                  accessories={equippedAccessories}
                  size="lg"
                />
              </React.Suspense>
            </div>

            {/* Pet Stats */}
            <div className="rounded-2xl bg-white p-6 shadow-lg" style={{ contain: 'layout style paint' }}>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Pet Statistics</h2>
              <PetStatsDisplay
                stats={pet.stats}
                level={pet.level}
                xp={pet.experience}
              />
            </div>
            </div>

          {/* Second Row - Quests and Coach Side by Side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quests Section */}
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    Active Quests
                  </h2>
                  <button
                    onClick={loadQuests}
                    disabled={loadingQuests}
                    className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                  >
                    {loadingQuests ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                {loadingQuests ? (
                  <LoadingSpinner />
                ) : (
                  <QuestBoard
                    quests={questsData}
                    onComplete={handleQuestComplete}
                    isProcessingId={processingQuestId}
                  />
                )}
              </div>
              
              {/* AI Coach Panel */}
              <CoachPanel 
                advice={coachAdvice} 
                isLoading={loadingCoach} 
                onRefresh={loadCoachAdvice} 
              />
          </div>

          {/* Actions Column - Feed, Play, Earn sections */}
          <div className="space-y-6">

            {/* Feed Section */}
            {showFeed && (
              <div className="rounded-2xl bg-white p-6 shadow-lg" style={{ contain: 'layout style paint' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Feed {pet?.name}</h3>
                  <button
                    onClick={() => {
                      setShowFeed(false);
                      setSelectedFood(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mb-4 p-2 bg-secondary/20 border border-secondary/40 rounded-full">
                  <span className="text-xl">💰</span>
                  <span className="font-bold text-secondary">${balance}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-3 mb-4">
                  {FOODS.map(food => (
                    <button
                      key={food.id}
                      onClick={() => setSelectedFood(food)}
                      className={`text-left p-3 rounded-lg border transition ${
                        selectedFood?.id === food.id
                          ? 'border-primary bg-primary/10'
                          : canAffordFood(food.cost)
                          ? 'border-gray-200 bg-white hover:shadow-md'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{food.emoji}</span>
                        <span className={`text-sm font-bold ${canAffordFood(food.cost) ? 'text-charcoal' : 'text-gray-400'}`}>
                          ${food.cost}
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-charcoal">{food.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        +{food.hungerGain} hunger
                        {food.happinessGain ? ` · +${food.happinessGain} happiness` : ''}
                        {food.healthGain ? ` · +${food.healthGain} health` : ''}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-600">Money after purchase</div>
                    <div className={`text-lg font-bold ${selectedFood && !canAffordFood(selectedFood.cost) ? 'text-red-600' : 'text-charcoal'}`}>
                      ${moneyAfterFood}
                    </div>
                  </div>
                  <button
                    onClick={handleFeedWithFood}
                    disabled={!selectedFood || (selectedFood && !canAffordFood(selectedFood.cost)) || feedLoading}
                    className="btn-primary disabled:opacity-50 text-sm px-4 py-2"
                  >
                    {feedLoading ? 'Feeding…' : 'Feed Pet'}
                  </button>
                </div>
              </div>
            )}

            {/* Play Section */}
            {showPlay && (
              <div className="rounded-2xl bg-white p-6 shadow-lg" style={{ contain: 'layout style paint' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Play with your pet</h3>
                  <button
                    onClick={() => setShowPlay(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                </div>
                {pet && (
                  <div className="mb-4 p-2 bg-gray-50 rounded-lg text-sm">
                    Mood: <span className="capitalize font-semibold">{pet.stats?.mood?.toLowerCase() || 'neutral'}</span>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  {ACTIVITIES.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => handleActivitySelect(activity)}
                      className="p-3 text-left rounded-lg border border-gray-200 bg-white hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{activity.emoji}</span>
                        <span className="font-bold text-sm">
                          {activity.cost === 0 ? 'FREE' : `$${activity.cost}`}
                        </span>
                      </div>
                      <div className="font-semibold text-sm">{activity.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Energy: -{activity.energyCost} · {activity.benefits}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Earn Section */}
            {showEarn && (
              <div className="rounded-2xl bg-white p-6 shadow-lg" style={{ contain: 'layout style paint' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Earn Money</h3>
                  <button
                    onClick={() => setShowEarn(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex gap-2 mb-4">
                  {(['chores', 'minigames', 'achievements'] as EarnTab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setEarnTab(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        earnTab === t
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                {earnTab === 'chores' && (
                  <div className="grid md:grid-cols-2 gap-3">
                    {chores.map(c => {
                      const cd = choreCooldowns[c.id] || 0;
                      return (
                        <div key={c.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="font-semibold text-sm mb-1">{c.name}</div>
                          <div className="text-xs text-gray-600 mb-2">
                            Earn: ${c.reward} · Time: {c.timeSeconds}s · {c.difficulty}
                          </div>
                          <button
                            onClick={() => handleChore(c.id)}
                            disabled={cd > 0}
                            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                          >
                            {cd > 0 ? `Cooldown ${cd}s` : 'Start Chore'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {earnTab === 'minigames' && (
                  <div className="grid md:grid-cols-3 gap-3">
                    <button
                      onClick={() => navigate('/minigames/fetch')}
                      className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition text-left"
                    >
                      <div className="font-semibold text-sm">Fetch</div>
                      <div className="text-xs text-gray-600">Clicker game · Reward scales</div>
                    </button>
                    <button
                      onClick={() => navigate('/minigames/puzzle')}
                      className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition text-left"
                    >
                      <div className="font-semibold text-sm">Puzzle</div>
                      <div className="text-xs text-gray-600">3x3 match</div>
                    </button>
                    <button
                      onClick={() => navigate('/minigames/reaction')}
                      className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition text-left"
                    >
                      <div className="font-semibold text-sm">Reaction</div>
                      <div className="text-xs text-gray-600">Speed test</div>
                    </button>
                  </div>
                )}

                {earnTab === 'achievements' && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">
                      Achievements will unlock as you complete chores and games.
                    </div>
                    <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
                      <li>First Week Complete — $50</li>
                      <li>Perfect Health Week — $75</li>
                      <li>Budget Master — $100</li>
                      <li>Pet Happiness 100% — $60</li>
                    </ul>
                  </div>
                )}
              </div>
            )}


            {/* Accessories Preview */}
            {accessories.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-lg" style={{ contain: 'layout style paint' }}>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Accessories</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {accessories.slice(0, 3).map(accessory => (
                    <div
                      key={accessory.accessory_id}
                      className="flex flex-col items-center justify-between rounded-lg border border-gray-200 p-4 text-center"
                    >
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-800">{accessory.name}</div>
                        <div className="text-xs text-gray-500">{accessory.type}</div>
                      </div>
                      <button
                        onClick={() => navigate('/avatar')}
                        className="w-full rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-200"
                      >
                        Equip
                      </button>
                    </div>
                  ))}
                </div>
                  <button
                    onClick={() => navigate('/avatar')}
                  className="mt-4 w-full rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-200"
                  >
                    View All Accessories
                  </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section - Full Width */}
        {analytics && (
          <div className="mt-6 space-y-6" style={{ contain: 'layout style paint' }}>
            {/* Analytics Header */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                  <TrendingUp className="h-6 w-6 text-indigo-500" />
                  Care Analytics
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Track your pet&apos;s wellbeing, spending, and care trends with AI-guided insights.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadAnalytics}
                  disabled={loadingAnalytics}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-50"
                >
                  {loadingAnalytics ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting || !analytics}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                >
                  {exporting ? 'Exporting…' : 'Export Weekly CSV'}
                </button>
              </div>
            </div>

            {/* Today's Stats Cards */}
            {analytics.end_of_day && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-xs font-semibold uppercase text-emerald-600">Coins earned</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-800">{analytics.end_of_day.coins_earned}</p>
                  <p className="text-xs text-emerald-700">Spent: {analytics.end_of_day.coins_spent}</p>
                </div>
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
                  <p className="text-xs font-semibold uppercase text-indigo-600">Happiness gain</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-800">+{analytics.end_of_day.happiness_gain}</p>
                  <p className="text-xs text-indigo-700">Health change: {analytics.end_of_day.health_change}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <p className="text-xs font-semibold uppercase text-amber-600">AI insight</p>
                  <p className="mt-2 text-sm text-amber-800">{bestInsight}</p>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            {summaries.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {summaries.map((summary: SnapshotSummary) => (
                  <div key={summary.period} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                    <p className="text-xs font-semibold uppercase text-slate-500">{summary.period} snapshot</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{summary.net_coins >= 0 ? '+' : ''}{summary.net_coins} coins</p>
                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      <p>Avg health: {summary.avg_health.toFixed(0)} • Avg happiness: {summary.avg_happiness.toFixed(0)}</p>
                      <p>Games played: {summary.games_played} • Pet actions: {summary.pet_actions}</p>
                      {summary.ai_summary && <p className="rounded-xl bg-slate-50 p-2 text-slate-600">{summary.ai_summary}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2" style={{ contain: 'layout style paint' }}>
              <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-200" />}>
                {formattedSeries.weekly && <TrendChart series={formattedSeries.weekly} color="#6366f1" />}
              </Suspense>
              <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-200" />}>
                {formattedSeries.health && <TrendChart series={formattedSeries.health} color="#10b981" />}
              </Suspense>
              <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-200" />}>
                {formattedSeries.monthly && <TrendChart series={formattedSeries.monthly} color="#f97316" />}
              </Suspense>
              <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-200" />}>
                {analytics.expenses && <ExpensePieChart expenses={analytics.expenses} />}
              </Suspense>
            </div>

            {/* Daily Challenge Card */}
            {analytics.end_of_day && (
              <DailyChallengeCard
                challengeText="Keep a positive coin flow for the next three days to unlock a savings bonus."
                progress={`Daily coins: ${analytics.end_of_day.coins_earned - analytics.end_of_day.coins_spent} • Games played: ${analytics.end_of_day.games_played}`}
              />
            )}

            {/* AI Recommendations */}
            {analytics.ai_insights && analytics.ai_insights.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800">AI Recommendations</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {analytics.ai_insights.map((insight) => (
                    <li key={insight} className="rounded-xl bg-slate-50 px-3 py-2">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notifications */}
            {analytics.notifications && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Recent Notifications</h3>
                  <span className="text-xs font-semibold text-slate-500">{analytics.notifications.length} alerts</span>
                </div>
                <div className="mt-4 space-y-3">
                  {analytics.notifications.length === 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      All clear! No critical changes detected.
                    </div>
                  )}
                  {analytics.notifications.map((notification) => (
                    <div key={notification.id} className={notificationStyles(notification)}>
                      <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                        <span>{notification.period_type}</span>
                        <span>{new Date(notification.reference_date).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-2 text-sm">{notification.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
