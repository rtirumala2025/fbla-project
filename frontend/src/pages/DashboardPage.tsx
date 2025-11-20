/**
 * DashboardPage - Comprehensive Dashboard
 * Integrates 3D pet visualization, stats, quests, actions, analytics, and accessories
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  Gamepad2, 
  Sparkles, 
  TrendingUp, 
  Coins,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePet } from '../context/PetContext';
import { useToast } from '../contexts/ToastContext';
import { Pet3DVisualization } from '../components/pets/Pet3DVisualization';
import { PetStatsDisplay } from '../components/dashboard/PetStatsDisplay';
import { QuestBoard } from '../components/quests/QuestBoard';
import { fetchActiveQuests, completeQuest } from '../api/quests';
import { fetchAccessories, equipAccessory } from '../api/accessories';
import { fetchSnapshot } from '../api/analytics';
import { logPetInteraction, logUserAction } from '../utils/petInteractionLogger';
import { useInteractionLogger } from '../hooks/useInteractionLogger';
import type { ActiveQuestsResponse, Quest } from '../types/quests';
import type { Accessory, AccessoryEquipResponse } from '../types/accessories';
import type { AnalyticsSnapshot } from '../types/analytics';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAccessoriesRealtime } from '../hooks/useAccessoriesRealtime';

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { pet, loading: petLoading, feed, play, bathe, updatePetStats, refreshPet } = usePet();
  const { success, error: toastError } = useToast();
  const logger = useInteractionLogger('DashboardPage');

  // State
  const [quests, setQuests] = useState<ActiveQuestsResponse | null>(null);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [equippedAccessories, setEquippedAccessories] = useState<AccessoryEquipResponse[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [processingQuestId, setProcessingQuestId] = useState<string | null>(null);

  // Load data
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
    if (!currentUser) return;
    setLoadingAnalytics(true);
    try {
      const data = await fetchSnapshot();
      setAnalytics(data);
      logger.logUserAction('analytics_loaded');
    } catch (err) {
      console.error('Failed to load analytics:', err);
      logger.logInteraction('analytics_load_error', { error: err });
    } finally {
      setLoadingAnalytics(false);
    }
  }, [currentUser, logger]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { state: { from: '/dashboard' } });
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (currentUser && pet) {
      loadQuests();
      loadAccessories();
      loadAnalytics();
    }
  }, [currentUser, pet, loadQuests, loadAccessories, loadAnalytics]);

  // Subscribe to real-time accessory updates
  useAccessoriesRealtime(pet?.id || null, (updatedAccessories) => {
    console.log('🔄 DashboardPage: Real-time accessory update received', updatedAccessories);
    setEquippedAccessories(updatedAccessories.filter((acc) => acc.equipped));
  });

  // Pet actions with logging
  const handleFeed = useCallback(async () => {
    if (!pet || !currentUser || processingAction) return;
    
    setProcessingAction('feed');
    try {
      const oldStats = { ...pet.stats };
      await feed();
      await refreshPet();
      
      // Stat changes are known from the feed action
      const statChanges = {
        hunger: 30, // feed() increases hunger by 30
        energy: 10, // feed() increases energy by 10
      };

      // Log interaction
      if (currentUser && pet) {
        await logPetInteraction({
          user_id: currentUser.uid,
          pet_id: pet.id,
          action_type: 'feed',
          stat_changes: statChanges,
          action_details: { food_type: 'standard' },
        });
      }

      logger.logUserAction('pet_fed', statChanges);
      success('Pet fed! Hunger and energy increased.');
    } catch (err) {
      console.error('Feed error:', err);
      toastError('Failed to feed pet. Please try again.');
      logger.logInteraction('feed_error', { error: err });
    } finally {
      setProcessingAction(null);
    }
  }, [pet, currentUser, feed, refreshPet, processingAction, success, toastError, logger]);

  const handlePlay = useCallback(async () => {
    if (!pet || !currentUser || processingAction) return;
    
    setProcessingAction('play');
    try {
      await play();
      await refreshPet();
      
      // Stat changes are known from the play action
      const statChanges = {
        happiness: 30, // play() increases happiness by 30
        energy: -20, // play() decreases energy by 20
        hunger: -10, // play() decreases hunger by 10
      };

      if (currentUser && pet) {
        await logPetInteraction({
          user_id: currentUser.uid,
          pet_id: pet.id,
          action_type: 'play',
          stat_changes: statChanges,
          action_details: { game_type: 'free_play' },
        });
      }

      logger.logUserAction('pet_played', statChanges);
      success('Played with pet! Happiness increased.');
    } catch (err) {
      console.error('Play error:', err);
      toastError('Failed to play with pet. Please try again.');
      logger.logInteraction('play_error', { error: err });
    } finally {
      setProcessingAction(null);
    }
  }, [pet, currentUser, play, refreshPet, processingAction, success, toastError, logger]);

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
    if (!pet || !currentUser || processingAction) return;
    
    setProcessingAction('earn');
    try {
      // Navigate to minigames or earn page
      navigate('/minigames');
      logger.logUserAction('earn_navigated');
    } catch (err) {
      console.error('Earn navigation error:', err);
      logger.logInteraction('earn_error', { error: err });
    } finally {
      setProcessingAction(null);
    }
  }, [pet, currentUser, processingAction, navigate, logger]);

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
    } catch (err) {
      console.error('Quest completion error:', err);
      toastError('Failed to complete quest. Please try again.');
      logger.logInteraction('quest_complete_error', { error: err });
    } finally {
      setProcessingQuestId(null);
    }
  }, [currentUser, pet, processingQuestId, success, toastError, logger]);

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
            onClick={() => navigate('/pet/create')}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pet Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your pet and track progress</p>
          </div>
          <div className="flex items-center gap-3">
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
        </motion.header>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - 3D Pet & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3D Pet Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl bg-white p-6 shadow-lg"
            >
              <h2 className="mb-4 text-xl font-semibold text-gray-800">3D Pet View</h2>
              <Pet3DVisualization
                pet={pet}
                accessories={equippedAccessories}
                size="lg"
              />
            </motion.div>

            {/* Pet Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white p-6 shadow-lg"
            >
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Pet Statistics</h2>
              <PetStatsDisplay
                stats={pet.stats}
                level={pet.level}
                xp={pet.experience}
              />
            </motion.div>

            {/* Quests Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white p-6 shadow-lg"
            >
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
            </motion.div>
          </div>

          {/* Right Column - Actions & Analytics */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-white p-6 shadow-lg"
            >
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFeed}
                  disabled={processingAction !== null}
                  className="flex flex-col items-center gap-2 rounded-xl bg-orange-100 p-4 text-orange-700 transition hover:bg-orange-200 disabled:opacity-50"
                >
                  <UtensilsCrossed className="h-6 w-6" />
                  <span className="text-sm font-medium">Feed</span>
                  {processingAction === 'feed' && <LoadingSpinner size="sm" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlay}
                  disabled={processingAction !== null}
                  className="flex flex-col items-center gap-2 rounded-xl bg-blue-100 p-4 text-blue-700 transition hover:bg-blue-200 disabled:opacity-50"
                >
                  <Gamepad2 className="h-6 w-6" />
                  <span className="text-sm font-medium">Play</span>
                  {processingAction === 'play' && <LoadingSpinner size="sm" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBathe}
                  disabled={processingAction !== null}
                  className="flex flex-col items-center gap-2 rounded-xl bg-green-100 p-4 text-green-700 transition hover:bg-green-200 disabled:opacity-50"
                >
                  <Sparkles className="h-6 w-6" />
                  <span className="text-sm font-medium">Clean</span>
                  {processingAction === 'bathe' && <LoadingSpinner size="sm" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEarn}
                  disabled={processingAction !== null}
                  className="flex flex-col items-center gap-2 rounded-xl bg-purple-100 p-4 text-purple-700 transition hover:bg-purple-200 disabled:opacity-50"
                >
                  <Coins className="h-6 w-6" />
                  <span className="text-sm font-medium">Earn</span>
                  {processingAction === 'earn' && <LoadingSpinner size="sm" />}
                </motion.button>
              </div>
            </motion.div>

            {/* Analytics Summary */}
            {analytics && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-white p-6 shadow-lg"
              >
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-xl font-semibold text-gray-800">Analytics</h2>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
                    <div className="text-sm opacity-90">Today's Summary</div>
                    <div className="mt-2 text-2xl font-bold">
                      +{analytics.end_of_day.coins_earned - analytics.end_of_day.coins_spent} coins
                    </div>
                    <div className="mt-1 text-xs opacity-75">
                      {analytics.end_of_day.pet_actions} actions • {analytics.end_of_day.games_played} games
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Happiness</span>
                      <span className="font-semibold text-gray-800">
                        {analytics.daily_summary.avg_happiness.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Health</span>
                      <span className="font-semibold text-gray-800">
                        {analytics.daily_summary.avg_health.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Energy</span>
                      <span className="font-semibold text-gray-800">
                        {analytics.daily_summary.avg_energy.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {analytics.ai_insights.length > 0 && (
                    <div className="rounded-lg bg-indigo-50 p-3">
                      <div className="text-xs font-semibold text-indigo-700 mb-1">AI Insights</div>
                      <div className="text-xs text-indigo-600">{analytics.ai_insights[0]}</div>
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/analytics')}
                    className="w-full rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-200"
                  >
                    View Full Analytics
                  </button>
                </div>
              </motion.div>
            )}

            {/* Accessories Preview */}
            {accessories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl bg-white p-6 shadow-lg"
              >
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Accessories</h2>
                <div className="space-y-2">
                  {accessories.slice(0, 3).map(accessory => (
                    <div
                      key={accessory.accessory_id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800">{accessory.name}</div>
                        <div className="text-xs text-gray-500">{accessory.type}</div>
                      </div>
                      <button
                        onClick={() => navigate('/avatar')}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Equip
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate('/avatar')}
                    className="w-full rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-200"
                  >
                    View All Accessories
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
