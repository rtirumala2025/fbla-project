/**
 * PetGameScene Component
 * A true game experience with immersive environment and floating HUD
 * Transforms the dashboard-style pet care into a living, breathing game world
 */
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import dayjs from 'dayjs';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { 
  Heart, 
  Zap, 
  Droplets, 
  Sparkles, 
  Cookie, 
  Gamepad2, 
  Bath, 
  Moon,
  ChevronLeft,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { bathePetAction, feedPetAction, getPetDiary, playWithPet, restPetAction } from '../../api/pets';
import type { PetActionResponse, PetDiaryEntry, PetStats } from '../../types/pet';
import { usePet } from '../../context/PetContext';
import { useFinancial } from '../../context/FinancialContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EvolutionAnimation } from './EvolutionAnimation';

// ============================================================================
// TYPES
// ============================================================================

type CareAction = 'feed' | 'play' | 'bathe' | 'rest';

interface FloatingText {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral' | 'coin';
  x: number;
  y: number;
}

interface ActionConfig {
  id: CareAction;
  label: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTIONS: ActionConfig[] = [
  {
    id: 'feed',
    label: 'Feed',
    icon: <Cookie className="w-6 h-6" />,
    color: 'from-amber-400 to-orange-500',
    hoverColor: 'from-amber-500 to-orange-600',
    description: 'Give a tasty meal',
  },
  {
    id: 'play',
    label: 'Play',
    icon: <Gamepad2 className="w-6 h-6" />,
    color: 'from-emerald-400 to-teal-500',
    hoverColor: 'from-emerald-500 to-teal-600',
    description: 'Have some fun!',
  },
  {
    id: 'rest',
    label: 'Rest',
    icon: <Moon className="w-6 h-6" />,
    color: 'from-violet-400 to-purple-500',
    hoverColor: 'from-violet-500 to-purple-600',
    description: 'Take a peaceful nap',
  },
  {
    id: 'bathe',
    label: 'Bathe',
    icon: <Bath className="w-6 h-6" />,
    color: 'from-cyan-400 to-blue-500',
    hoverColor: 'from-cyan-500 to-blue-600',
    description: 'Splish splash!',
  },
];

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  excited: '🤩',
  content: '😌',
  playful: '😄',
  sleepy: '😴',
  tired: '😪',
  hungry: '🤤',
  sad: '😢',
  sick: '🤒',
  angry: '😠',
  anxious: '😰',
  bored: '😑',
  default: '🐾',
};

const PET_SPRITES: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  fox: '🦊',
  dragon: '🐉',
  default: '🐾',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Floating stat popup that appears when stats change
const FloatingStatPopup: React.FC<{ text: FloatingText; onComplete: () => void }> = ({ text, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const bgColor = text.type === 'positive' ? 'bg-emerald-500' 
    : text.type === 'negative' ? 'bg-rose-500'
    : text.type === 'coin' ? 'bg-amber-500'
    : 'bg-slate-500';

  return (
    <motion.div
      className={`fixed z-50 px-3 py-1.5 rounded-full ${bgColor} text-white font-bold text-sm shadow-lg pointer-events-none`}
      style={{ left: text.x, top: text.y }}
      initial={{ opacity: 0, y: 20, scale: 0.5 }}
      animate={{ opacity: 1, y: -40, scale: 1 }}
      exit={{ opacity: 0, y: -80, scale: 0.5 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {text.text}
    </motion.div>
  );
};

// Stat bar for the HUD
const StatBar: React.FC<{ 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  change?: number;
}> = ({ label, value, icon, color, change }) => {
  return (
    <div className="flex items-center gap-2 group">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      <div className="flex-1 min-w-[100px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">{label}</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white">{Math.round(value)}%</span>
            {change !== undefined && change !== 0 && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs font-bold ${change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {change > 0 ? '+' : ''}{change}
              </motion.span>
            )}
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

// Main pet character with animations
const PetCharacter: React.FC<{
  species: string;
  mood: string;
  isActing: boolean;
  lastAction?: CareAction;
}> = ({ species, mood, isActing, lastAction }) => {
  const controls = useAnimationControls();
  const sprite = PET_SPRITES[species] || PET_SPRITES.default;
  
  // Base idle animation
  useEffect(() => {
    if (!isActing) {
      controls.start({
        y: [0, -10, 0],
        rotate: [0, 2, -2, 0],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    }
  }, [controls, isActing]);

  // Action-specific animations
  useEffect(() => {
    if (isActing && lastAction) {
      switch (lastAction) {
        case 'feed':
          controls.start({
            scale: [1, 1.2, 1.1, 1.2, 1],
            rotate: [0, -5, 5, -5, 0],
            transition: { duration: 0.8, ease: 'easeOut' },
          });
          break;
        case 'play':
          controls.start({
            y: [0, -50, 0, -30, 0],
            rotate: [0, 360],
            transition: { duration: 1, ease: 'easeOut' },
          });
          break;
        case 'bathe':
          controls.start({
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5, ease: 'easeOut' },
          });
          break;
        case 'rest':
          controls.start({
            scale: [1, 0.95, 1],
            transition: { duration: 2, ease: 'easeInOut', repeat: 2 },
          });
          break;
      }
    }
  }, [controls, isActing, lastAction]);

  // Mood-based visual effects
  const getMoodEffect = () => {
    switch (mood) {
      case 'happy':
      case 'excited':
        return 'drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]';
      case 'sad':
        return 'drop-shadow-[0_0_20px_rgba(59,130,246,0.4)] grayscale-[20%]';
      case 'sick':
        return 'drop-shadow-[0_0_20px_rgba(239,68,68,0.4)] hue-rotate-[30deg]';
      case 'sleepy':
        return 'drop-shadow-[0_0_15px_rgba(139,92,246,0.4)] brightness-90';
      default:
        return 'drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]';
    }
  };

  return (
    <div className="relative">
      {/* Glow effect behind pet */}
      <motion.div
        className="absolute inset-0 blur-3xl opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Main pet sprite */}
      <motion.div
        className={`text-[150px] sm:text-[180px] md:text-[220px] lg:text-[260px] select-none ${getMoodEffect()}`}
        animate={controls}
        style={{ lineHeight: 1 }}
      >
        {sprite}
      </motion.div>

      {/* Mood indicator floating above */}
      <motion.div
        className="absolute -top-4 left-1/2 -translate-x-1/2"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-4xl">{MOOD_EMOJIS[mood] || MOOD_EMOJIS.default}</span>
      </motion.div>

      {/* Z's for sleeping */}
      {(mood === 'sleepy' || mood === 'tired') && (
        <div className="absolute -top-8 right-0">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute text-2xl text-violet-300 font-bold"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                x: [0, 20 + i * 10],
                y: [0, -20 - i * 15],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeOut',
              }}
            >
              Z
            </motion.span>
          ))}
        </div>
      )}

      {/* Hearts for happy */}
      {(mood === 'happy' || mood === 'excited') && (
        <div className="absolute -top-4 left-0 right-0">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute text-xl text-rose-400"
              style={{ left: `${30 + i * 20}%` }}
              initial={{ opacity: 0, y: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                y: [0, -30],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            >
              ❤️
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
};

// Action button with hover effects
const ActionButton: React.FC<{
  action: ActionConfig;
  onClick: () => void;
  disabled: boolean;
  isActive: boolean;
}> = ({ action, onClick, disabled, isActive }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center
        w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
        rounded-2xl
        bg-gradient-to-br ${action.color}
        shadow-lg shadow-black/20
        border-2 border-white/20
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        group
        overflow-hidden
      `}
      whileHover={!disabled ? { scale: 1.1, y: -5 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0"
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '100%', opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Loading spinner */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-black/30 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
      
      <div className="relative z-10 text-white">
        {action.icon}
      </div>
      <span className="relative z-10 text-[10px] sm:text-xs font-bold text-white mt-1 uppercase tracking-wider">
        {action.label}
      </span>
      
      {/* Tooltip on hover */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {action.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
      </div>
    </motion.button>
  );
};

// Diary panel (slide-out)
const DiaryPanel: React.FC<{
  diary: PetDiaryEntry[];
  isOpen: boolean;
  onClose: () => void;
}> = ({ diary, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">📔</span>
                  Activity Diary
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Entries */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {diary.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-3 block">📝</span>
                    <p className="text-white/60">No diary entries yet.</p>
                    <p className="text-white/40 text-sm">Interact with your pet to create memories!</p>
                  </div>
                ) : (
                  diary.map((entry) => (
                    <motion.div
                      key={entry.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">
                          {MOOD_EMOJIS[entry.mood || 'default'] || MOOD_EMOJIS.default}
                        </span>
                        <span className="text-xs text-white/50">
                          {dayjs(entry.created_at).format('MMM D, h:mm A')}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {entry.note || entry.entry_text || 'No note recorded.'}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// AI Reaction bubble
const ReactionBubble: React.FC<{
  reaction: string;
  mood: string;
}> = ({ reaction, mood }) => {
  if (!reaction) return null;

  return (
    <motion.div
      className="max-w-xs bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl rounded-br-sm p-4 shadow-xl"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
    >
      <div className="flex items-start gap-2">
        <span className="text-2xl shrink-0">
          {MOOD_EMOJIS[mood] || MOOD_EMOJIS.default}
        </span>
        <p className="text-white/90 text-sm leading-relaxed">{reaction}</p>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PetGameScene() {
  // Get pet from context - this is the source of truth
  const { pet, loading: petLoading, error: petError } = usePet();
  const { balance, refreshBalance } = useFinancial();

  // State
  const [stats, setStats] = useState<PetStats | null>(null);
  const [diary, setDiary] = useState<PetDiaryEntry[]>([]);
  const [reaction, setReaction] = useState<string>('');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<CareAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEvolution, setShowEvolution] = useState(false);
  const [evolutionData, setEvolutionData] = useState<{ oldStage: string; newStage: string; level: number } | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastAction, setLastAction] = useState<CareAction | undefined>();
  
  const prevStatsRef = useRef<PetStats | null>(null);
  const prevBalanceRef = useRef<number>(0);
  const actionButtonsRef = useRef<HTMLDivElement>(null);

  // Sync stats from pet context
  useEffect(() => {
    if (pet?.stats) {
      setStats(pet.stats);
      setDataLoading(false);
    }
  }, [pet?.stats]);

  // Combined loading state
  const loading = petLoading || (dataLoading && !stats);

  // Derived values
  const petSpecies = pet?.species || 'default';
  const petName = pet?.name || 'Your Pet';
  const currentMood = stats?.mood || pet?.stats?.mood || 'content';

  // Helper functions
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

  const addFloatingText = useCallback((text: string, type: FloatingText['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    setFloatingTexts(prev => [...prev, {
      id,
      text,
      type,
      x: centerX + (Math.random() - 0.5) * 100,
      y: centerY - 50,
    }]);
  }, []);

  const removeFloatingText = useCallback((id: string) => {
    setFloatingTexts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Calculate stat changes and show floating popups
  const calculateStatChanges = useCallback((oldStats: PetStats | null, newStats: PetStats | null) => {
    if (!oldStats || !newStats) return;

    const hygiene = newStats.hygiene ?? newStats.cleanliness ?? 60;
    const oldHygiene = oldStats.hygiene ?? oldStats.cleanliness ?? 60;
    
    const statMap = [
      { key: 'Happiness', old: oldStats.happiness ?? 50, new: newStats.happiness ?? 50 },
      { key: 'Hunger', old: oldStats.hunger, new: newStats.hunger },
      { key: 'Hygiene', old: oldHygiene, new: hygiene },
      { key: 'Energy', old: oldStats.energy, new: newStats.energy },
      { key: 'Health', old: oldStats.health, new: newStats.health },
    ];

    statMap.forEach(({ key, old, new: newVal }) => {
      const change = Math.round(newVal - old);
      if (Math.abs(change) > 0.5) {
        const type = change > 0 ? 'positive' : 'negative';
        addFloatingText(`${change > 0 ? '+' : ''}${change} ${key}`, type);
      }
    });
  }, [addFloatingText]);

  const updateFromAction = useCallback((response: PetActionResponse) => {
    if (response.pet && response.pet.stats) {
      const newStats = response.pet.stats as PetStats;
      const oldStats = stats;
      
      if (oldStats) {
        calculateStatChanges(oldStats, newStats);
        checkEvolution(oldStats, newStats);
      }
      
      setStats(newStats);
    }
    if (response.pet?.diary) {
      setDiary(response.pet.diary);
    }
    setReaction(response.reaction || '');
    setNotifications(response.notifications || []);
  }, [stats, checkEvolution, calculateStatChanges]);

  // Track coin changes
  useEffect(() => {
    if (prevBalanceRef.current !== 0 && balance !== prevBalanceRef.current) {
      const change = balance - prevBalanceRef.current;
      if (Math.abs(change) > 0) {
        addFloatingText(`${change > 0 ? '+' : ''}${change} coins`, 'coin');
      }
    }
    prevBalanceRef.current = balance;
  }, [balance, addFloatingText]);

  // Load diary data (stats come from pet context)
  const loadDiaryData = useCallback(async () => {
    try {
      setError(null);
      const fetchedDiary = await getPetDiary();
      setDiary(fetchedDiary);
      setDataLoading(false);
      await refreshBalance();
    } catch (err: any) {
      console.error('Failed to load diary data:', err);
      // Don't block on diary errors - just log and continue
      setDataLoading(false);
    }
  }, [refreshBalance]);

  // Load diary when pet is available
  useEffect(() => {
    if (pet) {
      loadDiaryData();
      
      const refreshInterval = setInterval(() => {
        loadDiaryData().catch(() => {});
      }, 60000);

      return () => clearInterval(refreshInterval);
    }
  }, [pet, loadDiaryData]);

  // Handle pet context errors
  useEffect(() => {
    if (petError) {
      setError(petError);
    }
  }, [petError]);

  // Handle actions
  const handleAction = useCallback(async (action: CareAction) => {
    try {
      setActionLoading(action);
      setLastAction(action);
      setError(null);
      setReaction('');
      
      let response: PetActionResponse;
      switch (action) {
        case 'feed':
          response = await feedPetAction('standard');
          break;
        case 'play':
          response = await playWithPet('fetch');
          break;
        case 'bathe':
          response = await bathePetAction();
          break;
        case 'rest':
          response = await restPetAction(1);
          break;
        default:
          throw new Error('Unknown action');
      }
      
      updateFromAction(response);
      await refreshBalance();
      
      // Play sound effect (placeholder)
      if (soundEnabled) {
        // Sound hooks would go here
      }
    } catch (err: any) {
      console.error('Pet action error:', err);
      const message = err instanceof Error ? err.message : 'Action failed. Please try again.';
      setError(message);
      addFloatingText('Action failed!', 'negative');
    } finally {
      setActionLoading(null);
    }
  }, [updateFromAction, refreshBalance, soundEnabled, addFloatingText]);

  // Calculate computed stats
  const computedStats = useMemo(() => {
    if (!stats) return null;
    
    const hygiene = stats.hygiene ?? stats.cleanliness ?? 60;
    const happiness = stats.happiness ?? Math.round(
      ((stats.hunger ?? 50) * 0.25 + hygiene * 0.20 + (stats.energy ?? 50) * 0.25 + (stats.health ?? 50) * 0.30)
    );
    
    return {
      happiness,
      health: stats.health ?? 50,
      energy: stats.energy ?? 50,
      cleanliness: hygiene,
    };
  }, [stats]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-8xl mb-6"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            🐾
          </motion.div>
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white/60">Waking up your pet...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* ========== ENVIRONMENT BACKGROUND ========== */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900" />
        
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.3) 0%, transparent 50%)',
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Stars */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        
        {/* Ground/floor gradient */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{
            background: 'linear-gradient(to top, rgba(30,27,75,0.9) 0%, transparent 100%)',
          }}
        />
        
        {/* Ground particles */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bottom-0 w-2 h-2 bg-purple-400/30 rounded-full blur-sm"
              style={{
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* ========== EVOLUTION ANIMATION ========== */}
      {showEvolution && evolutionData && (
        <EvolutionAnimation
          petName={petName}
          oldStage={evolutionData.oldStage as any}
          newStage={evolutionData.newStage as any}
          level={evolutionData.level}
          onComplete={() => {
            setShowEvolution(false);
            setEvolutionData(null);
          }}
        />
      )}

      {/* ========== FLOATING STAT POPUPS ========== */}
      <AnimatePresence>
        {floatingTexts.map((text) => (
          <FloatingStatPopup
            key={text.id}
            text={text}
            onComplete={() => removeFloatingText(text.id)}
          />
        ))}
      </AnimatePresence>

      {/* ========== TOP-LEFT HUD: STATS ========== */}
      <motion.div
        className="fixed top-4 left-4 z-30 p-4 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-3 min-w-[180px]">
          {computedStats && (
            <>
              <StatBar
                label="Happiness"
                value={computedStats.happiness}
                icon={<Sparkles className="w-4 h-4" />}
                color="bg-amber-500"
              />
              <StatBar
                label="Health"
                value={computedStats.health}
                icon={<Heart className="w-4 h-4" />}
                color="bg-rose-500"
              />
              <StatBar
                label="Energy"
                value={computedStats.energy}
                icon={<Zap className="w-4 h-4" />}
                color="bg-emerald-500"
              />
              <StatBar
                label="Clean"
                value={computedStats.cleanliness}
                icon={<Droplets className="w-4 h-4" />}
                color="bg-cyan-500"
              />
            </>
          )}
        </div>
      </motion.div>

      {/* ========== TOP-RIGHT HUD: COINS ========== */}
      <motion.div
        className="fixed top-4 right-4 z-30"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-4">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-10 h-10 rounded-xl bg-black/30 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          {/* Coin counter */}
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl"
            whileHover={{ scale: 1.05 }}
          >
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              💰
            </motion.span>
            <motion.span
              key={balance}
              className="text-xl font-bold text-amber-400"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
            >
              {balance}
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      {/* ========== CENTER: PET CHARACTER ========== */}
      <div className="absolute inset-0 flex items-center justify-center pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 15 }}
        >
          <PetCharacter
            species={petSpecies}
            mood={currentMood}
            isActing={actionLoading !== null}
            lastAction={lastAction}
          />
        </motion.div>
      </div>

      {/* ========== BOTTOM-CENTER: ACTION BUTTONS ========== */}
      <motion.div
        ref={actionButtonsRef}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-3xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl">
          {ACTIONS.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onClick={() => handleAction(action.id)}
              disabled={actionLoading !== null}
              isActive={actionLoading === action.id}
            />
          ))}
        </div>
      </motion.div>

      {/* ========== BOTTOM-RIGHT: AI REACTION ========== */}
      <motion.div
        className="fixed bottom-24 right-4 z-30 max-w-xs"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <AnimatePresence mode="wait">
          {reaction && (
            <ReactionBubble reaction={reaction} mood={currentMood} />
          )}
        </AnimatePresence>
      </motion.div>

      {/* ========== RIGHT SIDE: DIARY TOGGLE ========== */}
      <motion.button
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 rounded-l-xl bg-black/30 backdrop-blur-xl border border-white/10 border-r-0 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/50 transition-all"
        onClick={() => setDiaryOpen(true)}
        whileHover={{ x: -5 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      {/* ========== DIARY PANEL ========== */}
      <DiaryPanel
        diary={diary}
        isOpen={diaryOpen}
        onClose={() => setDiaryOpen(false)}
      />

      {/* ========== ERROR NOTIFICATION ========== */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-rose-500/90 backdrop-blur-xl border border-rose-400/50 shadow-2xl"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <div className="flex items-center gap-3 text-white">
              <span className="text-xl">😿</span>
              <p className="font-medium">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  loadDiaryData();
                }}
                className="ml-2 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== NOTIFICATIONS (SCOUT TIPS) ========== */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            className="fixed top-24 left-4 z-40 max-w-sm"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="p-4 rounded-xl bg-amber-500/20 backdrop-blur-xl border border-amber-400/30 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💡</span>
                <span className="font-semibold text-amber-300">Tips</span>
              </div>
              <ul className="space-y-1">
                {notifications.slice(0, 3).map((note, i) => (
                  <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== PET NAME BADGE ========== */}
      <motion.div
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="px-6 py-2 rounded-full bg-black/30 backdrop-blur-xl border border-white/10">
          <span className="text-white font-bold text-lg">{petName}</span>
          {stats?.level && (
            <span className="ml-2 text-amber-400 text-sm font-semibold">Lv.{stats.level}</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default PetGameScene;

