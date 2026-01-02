/**
 * DashboardPage - Comprehensive Dashboard
 * Integrates 3D pet visualization, stats, quests, actions, analytics, and accessories
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ChevronUp,
  Gamepad2,
  Sparkles
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

import { logPetInteraction } from '../utils/petInteractionLogger';
import { useInteractionLogger } from '../hooks/useInteractionLogger';
import type { ActiveQuestsResponse, Quest } from '../types/quests';
import type { Accessory, AccessoryEquipResponse } from '../types/accessories';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DailyChallengeCard } from '../components/minigames/DailyChallengeCard';
import { useAccessoriesRealtime } from '../hooks/useAccessoriesRealtime';
import { useCoachRealtime } from '../hooks/useCoachRealtime';
import { shopService } from '../services/shopService';
import { earnService, type Chore } from '../services/earnService';

// Lazy load heavy components


type PetType = 'dog' | 'cat' | 'panda';

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

// Memoized DashboardPage to prevent unnecessary re-renders
export const DashboardPage = React.memo(function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { pet, loading: petLoading, bathe, updatePetStats, refreshPet, saveStatus } = usePet();
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
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [, setLoadingAccessories] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [processingQuestId, setProcessingQuestId] = useState<string | null>(null);

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
      // Optimized: Load accessories and equipped accessories in parallel
      const [data, equippedResult] = await Promise.allSettled([
        fetchAccessories(),
        (async () => {
          try {
            const { supabase } = await import('../lib/supabase');
            const { data: equippedData, error: equippedError } = await supabase
              .from('user_accessories')
              .select('*')
              .eq('pet_id', pet.id)
              .eq('equipped', true);

            if (equippedError) {
              console.error('❌ DashboardPage: Failed to load equipped accessories', equippedError);
              return [];
            }

            return equippedData?.map((item) => ({
              accessory_id: item.accessory_id,
              pet_id: item.pet_id,
              equipped: item.equipped,
              equipped_color: item.equipped_color,
              equipped_slot: item.equipped_slot,
              applied_mood: item.applied_mood || 'happy',
              updated_at: item.updated_at,
            })) || [];
          } catch (error) {
            console.error('❌ DashboardPage: Error loading equipped accessories', error);
            return [];
          }
        })(),
      ]);

      if (data.status === 'fulfilled') {
        setAccessories(data.value);
        logger.logUserAction('accessories_loaded', { count: data.value.length });
      }

      if (equippedResult.status === 'fulfilled') {
        setEquippedAccessories(equippedResult.value);
      } else {
        setEquippedAccessories([]);
      }
    } catch (err) {
      console.error('Failed to load accessories:', err);
      logger.logInteraction('accessories_load_error', { error: err });
    } finally {
      setLoadingAccessories(false);
    }
  }, [currentUser, pet, logger]);



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
            logger.logUserAction('accessories_loaded', { count: accessoriesData.value.length });

            // Optimized: Load equipped accessories in parallel (already handled in loadAccessories)
            // This is a fallback for the initial load
            if (pet) {
              Promise.resolve().then(async () => {
                try {
                  const { supabase } = await import('../lib/supabase');
                  const { data: equippedData, error: equippedError } = await supabase
                    .from('user_accessories')
                    .select('*')
                    .eq('pet_id', pet.id)
                    .eq('equipped', true);

                  if (!equippedError && equippedData) {
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
                  // Silently fail - equipped accessories will load via real-time subscription
                }
              });
            }
          }
          if (choresList.status === 'fulfilled' && choresList.value.length > 0 && currentUser?.uid) {
            setChores(choresList.value);

            // Optimized: Load all cooldowns in single query (fixes N+1 pattern)
            try {
              const cooldowns = await earnService.getAllChoreCooldowns(currentUser.uid);
              setChoreCooldowns(cooldowns);
            } catch (err) {
              // Failed to load cooldowns - continue without them
            }
          }

        } catch (err) {
          console.error(err);
        }
      };

      loadAllData();
    }
  }, [currentUser, pet, logger]);

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
            <div
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${saveStatus === 'saving'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : saveStatus === 'saved'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : saveStatus === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-transparent bg-transparent text-transparent'
                }`}
              aria-live="polite"
            >
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                  ? 'Saved ✓'
                  : saveStatus === 'error'
                    ? 'Save failed'
                    : 'Saved'}
            </div>
            <button
              onClick={() => {
                console.log('Pet game button clicked!');
                console.log('Current path before navigation:', window.location.pathname);
                navigate('/pet-game');
                console.log('Navigate called, current path after:', window.location.pathname);
              }}
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

          </div>
        </header>

        {/* Main Grid - Optimized for horizontal space */}
        <div className="space-y-6">
          {/* Top Row - Pet View and Stats Side by Side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pet Visualization */}
            <div className="rounded-2xl bg-white p-6 shadow-lg" style={{ contain: 'layout style paint' }}>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Pet View</h2>
              <div className="relative h-[500px] overflow-hidden rounded-xl">
                {(() => {
                  // Map pet species to petType ('dog' | 'cat' | 'panda')
                  // pet_type is canonical, species is fallback
                  const species = (pet as any).pet_type || pet.species || 'dog';
                  const petType: PetType =
                    species === 'dog' || species === 'cat' || species === 'panda'
                      ? species
                      : 'dog';

                  return (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-100 to-white/50">
                      <div className="text-center">
                        <div className="text-6xl mb-4">
                          {petType === 'cat' ? '🐱' : petType === 'panda' ? '🐼' : '🐕'}
                        </div>
                        <button
                          onClick={() => navigate('/pet-game')}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition"
                        >
                          Play in 3D
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
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
                      className={`text-left p-3 rounded-lg border transition ${selectedFood?.id === food.id
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${earnTab === t
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


      </div>
    </div>
  );
});

export default DashboardPage;
