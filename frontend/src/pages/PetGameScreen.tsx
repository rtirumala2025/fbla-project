import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePet } from '../context/PetContext';
import { useFinancial } from '../context/FinancialContext';
import { useToast } from '../contexts/ToastContext';
import { interactWithPet, PetInteractResponse } from '../api/pets';

type ActionType = 'feed' | 'play' | 'clean' | 'rest';

interface ActionConfig {
  id: ActionType;
  label: string;
  emoji: string;
  cost: number;
  description: string;
  color: string;
}

const ACTIONS: ActionConfig[] = [
  {
    id: 'feed',
    label: 'Feed',
    emoji: '🍖',
    cost: 5,
    description: 'Feed your pet to increase hunger and energy',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'play',
    label: 'Play',
    emoji: '🎾',
    cost: 0,
    description: 'Play with your pet to increase happiness',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'clean',
    label: 'Clean',
    emoji: '🧼',
    cost: 3,
    description: 'Clean your pet to increase cleanliness',
    color: 'from-teal-500 to-emerald-500',
  },
  {
    id: 'rest',
    label: 'Rest',
    emoji: '😴',
    cost: 0,
    description: 'Let your pet rest to restore energy',
    color: 'from-purple-500 to-indigo-500',
  },
];

export const PetGameScreen: React.FC = () => {
  const { pet, refreshPet, updating } = usePet();
  const { balance, refreshBalance } = useFinancial();
  const { success, error: showError } = useToast();
  
  const [actionLoading, setActionLoading] = useState<ActionType | null>(null);
  const [reactionMessage, setReactionMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<ActionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => `pet-session-${Date.now()}`);

  // Clear reaction message after 5 seconds
  useEffect(() => {
    if (reactionMessage) {
      const timer = setTimeout(() => {
        setReactionMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [reactionMessage]);

  const handleAction = useCallback(
    async (action: ActionType) => {
      if (!pet) {
        showError('No pet found. Please create a pet first.');
        return;
      }

      const actionConfig = ACTIONS.find((a) => a.id === action);
      if (!actionConfig) return;

      // Check if user has enough coins for actions that cost money
      if (actionConfig.cost > 0 && balance < actionConfig.cost) {
        showError(`Insufficient coins! You need ${actionConfig.cost} coins to ${actionConfig.label.toLowerCase()} your pet.`);
        return;
      }

      setActionLoading(action);
      setError(null);
      setReactionMessage(null);

      try {
        const response: PetInteractResponse = await interactWithPet({
          session_id: sessionId,
          action: action,
          message: actionConfig.description,
        });

        // Update pet stats from response
        if (response.pet_state) {
          // Refresh pet data to get updated stats
          await refreshPet();
        }

        // Update wallet balance if action cost money
        if (actionConfig.cost > 0) {
          await refreshBalance();
        }

        // Display reaction message
        setReactionMessage(response.message);
        setLastAction(action);
        success(`${pet.name} ${actionConfig.label.toLowerCase()}ed!`);

        // Show notifications if any
        if (response.notifications && response.notifications.length > 0) {
          response.notifications.forEach((notification) => {
            success(notification);
          });
        }
      } catch (err: any) {
        const errorMessage = err?.message || `Failed to ${actionConfig.label.toLowerCase()} pet. Please try again.`;
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setActionLoading(null);
      }
    },
    [pet, balance, sessionId, refreshPet, refreshBalance, success, showError]
  );

  if (!pet) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg">No pet found. Please create a pet first.</p>
        </div>
      </div>
    );
  }

  const stats = pet.stats;

  return (
    <div className="min-h-screen bg-slate-900 px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-slate-50 mb-2">
            {pet.name}'s Game
          </h1>
          <p className="text-slate-400">Take care of your virtual pet</p>
        </motion.div>

        {/* Pet Stats Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'health', value: stats.health, label: 'Health', color: 'from-red-500 to-pink-500' },
              { key: 'hunger', value: stats.hunger, label: 'Hunger', color: 'from-orange-500 to-amber-500' },
              { key: 'happiness', value: stats.happiness, label: 'Happiness', color: 'from-yellow-500 to-orange-500' },
              { key: 'cleanliness', value: stats.cleanliness, label: 'Cleanliness', color: 'from-teal-500 to-emerald-500' },
              { key: 'energy', value: stats.energy, label: 'Energy', color: 'from-blue-500 to-cyan-500' },
            ].map((stat) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>{stat.label}</span>
                  <motion.span
                    key={stat.value}
                    initial={{ scale: 1.2, color: '#10B981' }}
                    animate={{ scale: 1, color: '#94A3B8' }}
                    transition={{ duration: 0.3 }}
                    className="font-bold"
                  >
                    {Math.round(stat.value)}%
                  </motion.span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-700/50 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, stat.value))}%` }}
                    transition={{ 
                      duration: 0.8, 
                      ease: 'easeOut',
                      type: 'spring',
                      stiffness: 100,
                      damping: 15
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reaction Message Card */}
        <AnimatePresence>
          {reactionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mb-6 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {lastAction ? ACTIONS.find((a) => a.id === lastAction)?.emoji : '💬'}
                </div>
                <div className="flex-1">
                  <p className="text-slate-100 font-semibold text-lg mb-1">
                    {pet.name} says:
                  </p>
                  <p className="text-slate-300">{reactionMessage}</p>
                </div>
                <button
                  onClick={() => setReactionMessage(null)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Close message"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4"
          >
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {ACTIONS.map((action) => {
            const isLoading = actionLoading === action.id;
            const isDisabled =
              isLoading ||
              updating ||
              (action.cost > 0 && balance < action.cost);

            return (
              <motion.button
                key={action.id}
                onClick={() => handleAction(action.id)}
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                className={`
                  relative bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6
                  transition-all duration-300
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-600 hover:bg-slate-800/70'}
                  ${isLoading ? 'animate-pulse' : ''}
                `}
                aria-label={`${action.label} your pet`}
              >
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 hover:opacity-10 rounded-xl transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  {/* Emoji */}
                  <div className="text-5xl mb-3 text-center">{action.emoji}</div>

                  {/* Label */}
                  <h3 className="text-xl font-bold text-slate-50 mb-2 text-center">
                    {action.label}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-400 mb-3 text-center">
                    {action.description}
                  </p>

                  {/* Cost */}
                  {action.cost > 0 && (
                    <div className="flex items-center justify-center gap-1 text-slate-300">
                      <span className="text-lg">💰</span>
                      <span
                        className={`font-semibold ${
                          balance < action.cost ? 'text-red-400' : 'text-slate-300'
                        }`}
                      >
                        {action.cost}
                      </span>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="mt-3 flex justify-center">
                      <div className="w-6 h-6 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Disabled message */}
                  {!isLoading && action.cost > 0 && balance < action.cost && (
                    <p className="mt-2 text-xs text-red-400 text-center">
                      Insufficient coins
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Balance Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-6 py-3 w-fit mx-auto"
        >
          <span className="text-xl">💰</span>
          <span className="font-bold text-slate-50">Balance: {balance} coins</span>
        </motion.div>
      </div>
    </div>
  );
};

export default PetGameScreen;
