/**
 * PetGameScene Component
 * A Roblox-style pet game with a proper game world structure
 * The pet lives in a cozy room with interactive objects
 */
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import dayjs from 'dayjs';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { 
  Heart, 
  Zap, 
  Droplets, 
  Sparkles, 
  X,
  Book
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

interface FloatingParticle {
  id: string;
  emoji: string;
  x: number;
  y: number;
  delay: number;
}

interface SuccessIndicator {
  id: string;
  action: CareAction;
  message: string;
}

// ============================================================================
// CONSTANTS - ROBLOX-STYLE COLOR PALETTE
// ============================================================================

// Primary palette: Warm, inviting, kid-friendly
const COLORS = {
  // Room colors - softer, less saturated for background harmony
  wallTop: '#B4D7E8',      // Soft sky blue (desaturated)
  wallBottom: '#D4E5EF',   // Very light blue
  floor: '#C9A87C',        // Warm light wood
  floorLight: '#D9BC94',   // Lighter wood
  floorAccent: '#B89A6D',  // Wood grain accent
  
  // Zone colors - subtle area highlighting
  feedZone: 'rgba(255, 183, 71, 0.12)',    // Warm orange tint
  restZone: 'rgba(167, 139, 250, 0.10)',   // Soft purple tint
  playZone: 'rgba(74, 222, 128, 0.10)',    // Fresh green tint
  cleanZone: 'rgba(56, 189, 248, 0.10)',   // Cool cyan tint
  
  // Accent colors
  primary: '#FF6B9D',      // Playful pink
  secondary: '#FFB347',    // Warm orange
  accent: '#7DD3FC',       // Bright cyan
  success: '#4ADE80',      // Fresh green
  
  // UI colors - refined for clarity
  hudBg: 'rgba(15, 23, 42, 0.88)',
  hudBorder: 'rgba(255, 255, 255, 0.08)',
  hudGlow: 'rgba(99, 102, 241, 0.15)',
};

// Pet sprites with better visual representation
const PET_SPRITES: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  fox: '🦊',
  dragon: '🐉',
  panda: '🐼',
  hamster: '🐹',
  fish: '🐠',
  turtle: '🐢',
  default: '🐾',
};

const MOOD_EXPRESSIONS: Record<string, { emoji: string; color: string }> = {
  happy: { emoji: '😊', color: '#FFD700' },
  excited: { emoji: '🤩', color: '#FF69B4' },
  content: { emoji: '😌', color: '#98FB98' },
  playful: { emoji: '😄', color: '#FFA500' },
  sleepy: { emoji: '😴', color: '#DDA0DD' },
  tired: { emoji: '😪', color: '#B8B8B8' },
  hungry: { emoji: '🤤', color: '#FFB347' },
  sad: { emoji: '😢', color: '#87CEEB' },
  sick: { emoji: '🤒', color: '#90EE90' },
  angry: { emoji: '😠', color: '#FF6B6B' },
  anxious: { emoji: '😰', color: '#E0E0E0' },
  bored: { emoji: '😑', color: '#C0C0C0' },
  default: { emoji: '🐾', color: '#FFD700' },
};

// ============================================================================
// WORLD OBJECTS - Interactive game elements with consistent sizing
// ============================================================================

interface WorldObject {
  id: CareAction;
  label: string;
  emoji: string;
  secondaryEmoji?: string; // Companion object for zone grouping
  position: { x: string; y: string };
  size: string;
  description: string;
  actionEmoji: string[];
  zone: 'feed' | 'rest' | 'play' | 'clean';
}

// Consistent object sizing: All objects use the same base size (64px)
// This creates visual harmony and makes the pet the clear focal point
const OBJECT_SIZE = '64px';

const WORLD_OBJECTS: WorldObject[] = [
  {
    id: 'feed',
    label: 'Food Bowl',
    emoji: '🍖',
    secondaryEmoji: '🥣',
    position: { x: '18%', y: '78%' },
    size: OBJECT_SIZE,
    description: 'Tap to feed!',
    actionEmoji: ['🍖', '🥩', '✨', '💕'],
    zone: 'feed',
  },
  {
    id: 'rest',
    label: 'Cozy Bed',
    emoji: '🛏️',
    secondaryEmoji: '🌙',
    position: { x: '82%', y: '78%' },
    size: OBJECT_SIZE,
    description: 'Tap to rest!',
    actionEmoji: ['💤', '😴', '🌙', '⭐'],
    zone: 'rest',
  },
  {
    id: 'play',
    label: 'Toy Box',
    emoji: '🎾',
    secondaryEmoji: '🧸',
    position: { x: '82%', y: '48%' },
    size: OBJECT_SIZE,
    description: 'Tap to play!',
    actionEmoji: ['🎾', '⭐', '🎉', '💫'],
    zone: 'play',
  },
  {
    id: 'bathe',
    label: 'Bath Time',
    emoji: '🛁',
    secondaryEmoji: '🧼',
    position: { x: '18%', y: '48%' },
    size: OBJECT_SIZE,
    description: 'Tap to bathe!',
    actionEmoji: ['🛁', '🧼', '💧', '✨'],
    zone: 'clean',
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Success messages for each action
const SUCCESS_MESSAGES: Record<CareAction, string[]> = {
  feed: ['Yummy! 🍖', 'Delicious!', 'So tasty!', 'Nom nom!'],
  play: ['So fun! 🎾', 'Wheee!', 'Again!', 'Best day!'],
  bathe: ['So fresh! 🛁', 'Sparkly clean!', 'Squeaky!', 'Shiny!'],
  rest: ['Zzz... 💤', 'So cozy!', 'Sweet dreams!', 'Relaxing~'],
};

// Floating particles for action feedback
const ParticleBurst: React.FC<{ 
  particles: FloatingParticle[]; 
  onComplete: () => void;
}> = ({ particles, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="fixed pointer-events-none z-50 text-3xl"
          style={{ left: p.x, top: p.y }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1, 0.8],
            y: -80,
            x: (Math.random() - 0.5) * 60,
          }}
          transition={{ 
            duration: 1.2, 
            delay: p.delay,
            ease: 'easeOut' 
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

// Success toast that appears after action completes
const SuccessToast: React.FC<{
  indicator: SuccessIndicator;
  onComplete: () => void;
}> = ({ indicator, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const colors: Record<CareAction, string> = {
    feed: 'from-amber-400 to-orange-500',
    play: 'from-emerald-400 to-teal-500',
    bathe: 'from-cyan-400 to-blue-500',
    rest: 'from-violet-400 to-purple-500',
  };

  return (
    <motion.div
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-gradient-to-r ${colors[indicator.action]} text-white font-bold text-lg shadow-2xl`}
      initial={{ opacity: 0, y: -30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
    >
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
        >
          ✨
        </motion.span>
        {indicator.message}
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: 2, delay: 0.2 }}
        >
          ✨
        </motion.span>
      </div>
    </motion.div>
  );
};

// Clean stat bar for HUD
const StatBar: React.FC<{ 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  label: string;
}> = ({ value, icon, color, label }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div className="flex items-center gap-2" title={`${label}: ${Math.round(clampedValue)}%`}>
      <div 
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-md"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div className="w-20 h-2.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
            initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
  );
};

// Interactive world object with zone grouping
const InteractiveObject: React.FC<{
  object: WorldObject;
  onClick: () => void;
  disabled: boolean;
  isActive: boolean;
}> = ({ object, onClick, disabled, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Zone-specific colors for visual grouping
  const zoneColors = {
    feed: { bg: COLORS.feedZone, glow: 'rgba(255, 183, 71, 0.5)', border: 'rgba(255, 183, 71, 0.3)' },
    rest: { bg: COLORS.restZone, glow: 'rgba(167, 139, 250, 0.5)', border: 'rgba(167, 139, 250, 0.3)' },
    play: { bg: COLORS.playZone, glow: 'rgba(74, 222, 128, 0.5)', border: 'rgba(74, 222, 128, 0.3)' },
    clean: { bg: COLORS.cleanZone, glow: 'rgba(56, 189, 248, 0.5)', border: 'rgba(56, 189, 248, 0.3)' },
  };
  const zoneColor = zoneColors[object.zone];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        flex flex-col items-center justify-center
        transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        cursor-pointer z-20
        group
      `}
      style={{ 
        left: object.position.x, 
        top: object.position.y,
        fontSize: object.size,
      }}
      whileHover={!disabled ? { scale: 1.12, y: -6 } : {}}
      whileTap={!disabled ? { scale: 0.92 } : {}}
      animate={isActive ? { 
        scale: [1, 1.08, 1],
        rotate: [0, -3, 3, 0],
      } : {}}
      transition={isActive ? { duration: 0.4, repeat: Infinity } : { type: 'spring', stiffness: 300 }}
    >
      {/* Zone mat/platform - subtle area indicator */}
      <div 
        className="absolute w-24 h-24 rounded-2xl -z-10 transition-all duration-300"
        style={{ 
          background: zoneColor.bg,
          border: `2px solid ${isHovered ? zoneColor.border : 'transparent'}`,
          transform: 'translate(-50%, -50%) scale(1.2)',
          left: '50%',
          top: '50%',
        }}
      />

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
        style={{ 
          background: `radial-gradient(circle, ${zoneColor.glow} 0%, transparent 70%)`,
        }}
        animate={{ opacity: isHovered ? 0.8 : 0 }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Main emoji with secondary companion */}
      <div className="relative">
        <span 
          className="relative select-none block"
          style={{ 
            filter: isHovered 
              ? `drop-shadow(0 0 16px ${zoneColor.glow})` 
              : 'drop-shadow(0 3px 4px rgba(0,0,0,0.25))',
            transition: 'filter 0.2s ease',
          }}
        >
          {object.emoji}
        </span>
        
        {/* Secondary emoji - companion object */}
        {object.secondaryEmoji && (
          <span 
            className="absolute -bottom-1 -right-3 text-[0.45em] opacity-80"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
          >
            {object.secondaryEmoji}
          </span>
        )}
      </div>
      
      {/* Label tooltip - playful style */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <div 
              className="px-3 py-1.5 rounded-full text-white text-sm font-bold shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))',
                border: `1px solid ${zoneColor.border}`,
              }}
            >
              {object.description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator - cleaner pulse */}
      {isActive && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="w-16 h-16 rounded-full border-2 border-white/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.div>
      )}
    </motion.button>
  );
};

// Main pet character with proper ground positioning
const PetCharacter: React.FC<{
  species: string;
  mood: string;
  name: string;
  level?: number;
  isActing: boolean;
  lastAction?: CareAction;
}> = ({ species, mood, name, level, isActing, lastAction }) => {
  const controls = useAnimationControls();
  const sprite = PET_SPRITES[species.toLowerCase()] || PET_SPRITES.default;
  const moodData = MOOD_EXPRESSIONS[mood] || MOOD_EXPRESSIONS.default;
  
  // Idle breathing animation
  useEffect(() => {
    if (!isActing) {
      controls.start({
        y: [0, -8, 0],
        transition: {
          duration: 2.5,
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
            scale: [1, 1.15, 1.05, 1.15, 1],
            rotate: [0, -3, 3, -3, 0],
            transition: { duration: 0.6, ease: 'easeOut' },
          });
          break;
        case 'play':
          controls.start({
            y: [0, -40, 0, -25, 0],
            rotate: [0, 360],
            transition: { duration: 0.8, ease: 'easeOut' },
          });
          break;
        case 'bathe':
          controls.start({
            x: [0, -8, 8, -8, 8, 0],
            transition: { duration: 0.4, ease: 'easeOut' },
          });
          break;
        case 'rest':
          controls.start({
            scale: [1, 0.95, 1],
            transition: { duration: 1.5, ease: 'easeInOut', repeat: 2 },
          });
          break;
      }
    }
  }, [controls, isActing, lastAction]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Mood bubble above pet */}
      <motion.div
        className="absolute -top-6 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50"
          style={{ backgroundColor: moodData.color }}
        >
          <span className="text-lg">{moodData.emoji}</span>
        </div>
      </motion.div>

      {/* Pet sprite */}
      <motion.div
        className="relative"
        animate={controls}
      >
        {/* Glow behind pet */}
        <div 
          className="absolute inset-0 blur-3xl opacity-40 rounded-full"
        style={{
            background: `radial-gradient(circle, ${moodData.color} 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />
        
        <span 
          className="text-[120px] sm:text-[140px] md:text-[160px] lg:text-[180px] select-none relative z-10"
          style={{ 
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))',
            lineHeight: 1,
          }}
      >
        {sprite}
        </span>

      {/* Z's for sleeping */}
      {(mood === 'sleepy' || mood === 'tired') && (
          <div className="absolute -top-4 right-0">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
                className="absolute text-2xl font-bold text-purple-400"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                  x: [0, 15 + i * 8],
                  y: [0, -15 - i * 12],
              }}
              transition={{
                  duration: 1.8,
                repeat: Infinity,
                  delay: i * 0.4,
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
          <div className="absolute -top-2 left-0 right-0">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
                className="absolute text-xl"
                style={{ left: `${25 + i * 25}%` }}
              initial={{ opacity: 0, y: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                  y: [0, -25],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                  duration: 1.2,
                repeat: Infinity,
                  delay: i * 0.3,
                ease: 'easeOut',
              }}
            >
              ❤️
            </motion.span>
          ))}
        </div>
      )}
      </motion.div>

      {/* Shadow on ground */}
      <div 
        className="w-32 h-6 rounded-full mt-2"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
        }}
      />

      {/* Name badge */}
      <motion.div
        className="mt-2 px-5 py-2 rounded-full bg-slate-900/80 backdrop-blur-sm border border-white/20 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-white font-bold text-lg">{name}</span>
        {level && (
          <span className="ml-2 text-amber-400 text-sm font-semibold">Lv.{level}</span>
        )}
      </motion.div>
    </div>
  );
};

// Room decorations - simplified and subtle to not compete with pet
const RoomDecorations: React.FC = () => {
  return (
    <>
      {/* Window with gentle light - smaller and more subtle */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-0 opacity-90">
        <div className="relative">
          {/* Window frame - simplified */}
          <div className="w-32 h-24 bg-gradient-to-b from-sky-200/80 to-sky-100/60 rounded-t-2xl border-2 border-amber-600/60 shadow-md overflow-hidden">
            {/* Window panes */}
            <div className="absolute inset-1 grid grid-cols-2 gap-0.5">
              <div className="bg-sky-100/40 rounded-tl-xl" />
              <div className="bg-sky-100/40 rounded-tr-xl" />
            </div>
            {/* Sun - smaller, gentler glow */}
            <motion.div
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-200"
              animate={{ 
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          {/* Window sill */}
          <div className="w-36 h-2 bg-amber-600/70 rounded-b -mt-0.5 mx-auto" />
        </div>
        
        {/* Soft light rays - very subtle */}
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 w-40 h-24 pointer-events-none opacity-10"
          style={{
            background: 'linear-gradient(180deg, rgba(253,224,71,0.4) 0%, transparent 100%)',
            clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
          }}
        />
      </div>

      {/* Wall accents - minimal, non-distracting */}
      <div className="absolute top-8 right-8 text-xl z-0 opacity-40">
        🕐
      </div>

      {/* Central floor rug for pet - defines the main interaction area */}
      <div 
        className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-48 h-12 rounded-full z-0"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)',
        }}
      />
    </>
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
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">📔</span>
                  Pet Diary
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
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
                          {MOOD_EXPRESSIONS[entry.mood || 'default']?.emoji || '🐾'}
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

// AI Reaction bubble - appears near pet
const ReactionBubble: React.FC<{
  reaction: string;
  mood: string;
}> = ({ reaction, mood }) => {
  if (!reaction) return null;

  return (
    <motion.div
      className="absolute bottom-[45%] right-[10%] max-w-[200px] z-30"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
    >
      <div className="bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-2xl rounded-bl-sm p-3 shadow-xl">
      <div className="flex items-start gap-2">
          <span className="text-xl shrink-0">
            {MOOD_EXPRESSIONS[mood]?.emoji || '🐾'}
        </span>
          <p className="text-slate-700 text-sm leading-relaxed">{reaction}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PetGameScene() {
  const { pet, loading: petLoading, error: petError } = usePet();
  const { balance, refreshBalance } = useFinancial();

  // State
  const [stats, setStats] = useState<PetStats | null>(null);
  const [diary, setDiary] = useState<PetDiaryEntry[]>([]);
  const [reaction, setReaction] = useState<string>('');
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<CareAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEvolution, setShowEvolution] = useState(false);
  const [evolutionData, setEvolutionData] = useState<{ oldStage: string; newStage: string; level: number } | null>(null);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [lastAction, setLastAction] = useState<CareAction | undefined>();
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [successIndicator, setSuccessIndicator] = useState<SuccessIndicator | null>(null);
  
  const sceneRef = useRef<HTMLDivElement>(null);

  // Sync stats from pet context
  useEffect(() => {
    if (pet?.stats) {
      setStats(pet.stats);
      setDataLoading(false);
    } else if (!petLoading && !pet) {
      setDataLoading(false);
    }
  }, [pet?.stats, pet, petLoading]);

  // Timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (dataLoading) {
        setDataLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [dataLoading]);

  const loading = petLoading;
  const petSpecies = (pet?.species || 'default').toLowerCase();
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
        setEvolutionData({ oldStage, newStage, level: newLevel });
        setShowEvolution(true);
      }
    }
  }, [getEvolutionStage]);

  // Create particle burst
  const createParticleBurst = useCallback((action: CareAction, centerX: number, centerY: number) => {
    const worldObject = WORLD_OBJECTS.find(o => o.id === action);
    if (!worldObject) return;

    const newParticles: FloatingParticle[] = worldObject.actionEmoji.map((emoji, i) => ({
      id: `${Date.now()}-${i}`,
      emoji,
      x: centerX + (Math.random() - 0.5) * 40,
      y: centerY,
      delay: i * 0.1,
    }));

    setParticles(newParticles);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
  }, []);

  const updateFromAction = useCallback((response: PetActionResponse) => {
    if (response.pet && response.pet.stats) {
      const newStats = response.pet.stats as PetStats;
      const oldStats = stats;
      
      if (oldStats) {
        checkEvolution(oldStats, newStats);
      }
      
      setStats(newStats);
    }
    if (response.pet?.diary) {
      setDiary(response.pet.diary);
    }
    setReaction(response.reaction || '');
  }, [stats, checkEvolution]);

  // Load diary data
  const loadDiaryData = useCallback(async () => {
    try {
      setError(null);
      const fetchedDiary = await getPetDiary();
      setDiary(fetchedDiary);
      setDataLoading(false);
      await refreshBalance();
    } catch (err: any) {
      console.error('Failed to load diary data:', err);
      setDataLoading(false);
    }
  }, [refreshBalance]);

  useEffect(() => {
    if (pet) {
      loadDiaryData();
      const refreshInterval = setInterval(() => {
        loadDiaryData().catch(() => {});
      }, 60000);
      return () => clearInterval(refreshInterval);
    }
  }, [pet, loadDiaryData]);

  useEffect(() => {
    if (petError) {
      setError(petError);
    }
  }, [petError]);

  // Handle actions
  const handleAction = useCallback(async (action: CareAction, event?: React.MouseEvent) => {
    try {
      setActionLoading(action);
      setLastAction(action);
      setError(null);
      setReaction('');
      
      // Get click position for particles
      if (event) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        createParticleBurst(action, centerX, centerY);
      }
      
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
      
      // Show success indicator
      const messages = SUCCESS_MESSAGES[action];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setSuccessIndicator({
        id: `success-${Date.now()}`,
        action,
        message: randomMessage,
      });
    } catch (err: any) {
      console.error('Pet action error:', err);
      const message = err instanceof Error ? err.message : 'Action failed. Please try again.';
      setError(message);
    } finally {
      setActionLoading(null);
    }
  }, [updateFromAction, refreshBalance, createParticleBurst]);

  // Computed stats
  const computedStats = useMemo(() => {
    const currentStats = stats || pet?.stats;
    if (!currentStats) {
      return { happiness: 50, health: 50, energy: 50, cleanliness: 50 };
    }
    
    const hygiene = currentStats.hygiene ?? currentStats.cleanliness ?? 60;
    const happiness = currentStats.happiness ?? Math.round(
      ((currentStats.hunger ?? 50) * 0.25 + hygiene * 0.20 + (currentStats.energy ?? 50) * 0.25 + (currentStats.health ?? 50) * 0.30)
    );
    
    return {
      happiness,
      health: currentStats.health ?? 50,
      energy: currentStats.energy ?? 50,
      cleanliness: hygiene,
    };
  }, [stats, pet?.stats]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 top-[120px] bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100 flex items-center justify-center">
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
          <p className="mt-4 text-slate-600">Waking up your pet...</p>
        </motion.div>
      </div>
    );
  }

  // No pet state
  if (!pet) {
    return (
      <div className="fixed inset-0 top-[120px] bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md px-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-8xl mb-6"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🥚
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">No Pet Found</h2>
          <p className="text-slate-600 mb-6">You don't have a pet yet! Create one to start playing.</p>
          <a
            href="/pet-selection"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold hover:from-pink-600 hover:to-orange-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <span>🎉</span>
            Create Your Pet
          </a>
        </motion.div>
      </div>
    );
  }

  return (
        <motion.div
      ref={sceneRef}
      className="fixed inset-0 top-[120px] overflow-hidden"
      animate={screenShake ? { x: [0, -3, 3, -3, 0] } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* ========== ROOM BACKGROUND ========== */}
      <div className="absolute inset-0">
        {/* Wall gradient - soft and non-distracting */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, 
              ${COLORS.wallTop} 0%, 
              ${COLORS.wallBottom} 55%, 
              ${COLORS.floor} 55%, 
              ${COLORS.floorLight} 100%
            )`,
          }}
        />
        
        {/* Floor with subtle wood grain texture */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[45%]"
          style={{
            background: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 80px,
                ${COLORS.floorAccent}15 80px,
                ${COLORS.floorAccent}15 81px
              ),
              linear-gradient(180deg, ${COLORS.floor} 0%, ${COLORS.floorLight} 100%)
            `,
          }}
        />
        
        {/* Baseboard - clean divider */}
        <div 
          className="absolute left-0 right-0 h-2"
          style={{
            top: '55%',
            background: 'linear-gradient(180deg, #A08060 0%, #C9A87C 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        />

        {/* Zone highlight areas - subtle floor mats */}
        {/* Feed Zone - bottom left */}
        <div 
          className="absolute w-28 h-28 rounded-3xl z-[1]"
          style={{
            left: '10%',
            bottom: '12%',
            background: `radial-gradient(ellipse, ${COLORS.feedZone} 0%, transparent 70%)`,
          }}
        />
        
        {/* Rest Zone - bottom right */}
        <div 
          className="absolute w-28 h-28 rounded-3xl z-[1]"
          style={{
            right: '10%',
            bottom: '12%',
            background: `radial-gradient(ellipse, ${COLORS.restZone} 0%, transparent 70%)`,
          }}
        />
        
        {/* Play Zone - upper right */}
        <div 
          className="absolute w-28 h-28 rounded-3xl z-[1]"
          style={{
            right: '10%',
            top: '38%',
            background: `radial-gradient(ellipse, ${COLORS.playZone} 0%, transparent 70%)`,
          }}
        />
        
        {/* Clean Zone - upper left */}
        <div 
          className="absolute w-28 h-28 rounded-3xl z-[1]"
          style={{
            left: '10%',
            top: '38%',
            background: `radial-gradient(ellipse, ${COLORS.cleanZone} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* ========== ROOM DECORATIONS ========== */}
      <RoomDecorations />

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

      {/* ========== PARTICLE EFFECTS ========== */}
      {particles.length > 0 && (
        <ParticleBurst 
          particles={particles} 
          onComplete={() => setParticles([])} 
        />
      )}

      {/* ========== SUCCESS INDICATOR ========== */}
      <AnimatePresence>
        {successIndicator && (
          <SuccessToast
            key={successIndicator.id}
            indicator={successIndicator}
            onComplete={() => setSuccessIndicator(null)}
          />
        )}
      </AnimatePresence>

      {/* ========== INTERACTIVE WORLD OBJECTS ========== */}
      {WORLD_OBJECTS.map((obj) => (
        <InteractiveObject
          key={obj.id}
          object={obj}
          onClick={(e?: any) => handleAction(obj.id, e)}
          disabled={actionLoading !== null}
          isActive={actionLoading === obj.id}
          />
        ))}

      {/* ========== PET CHARACTER (CENTER) ========== */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '5%' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 15 }}
        >
          <PetCharacter
            species={petSpecies}
            mood={currentMood}
            name={petName}
            level={stats?.level}
            isActing={actionLoading !== null}
            lastAction={lastAction}
          />
        </motion.div>
      </div>

      {/* ========== AI REACTION BUBBLE ========== */}
      <AnimatePresence mode="wait">
        {reaction && (
          <ReactionBubble reaction={reaction} mood={currentMood} />
        )}
      </AnimatePresence>

      {/* ========== TOP-LEFT HUD: STATS ========== */}
      <motion.div
        className="absolute top-4 left-4 z-30 p-3 rounded-2xl shadow-2xl"
        style={{ 
          backgroundColor: COLORS.hudBg,
          border: `1px solid ${COLORS.hudBorder}`,
        }}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-2">
              <StatBar
                label="Happiness"
                value={computedStats.happiness}
            icon={<Sparkles className="w-3.5 h-3.5" />}
            color="#FBBF24"
              />
              <StatBar
                label="Health"
                value={computedStats.health}
            icon={<Heart className="w-3.5 h-3.5" />}
            color="#F87171"
              />
              <StatBar
                label="Energy"
                value={computedStats.energy}
            icon={<Zap className="w-3.5 h-3.5" />}
            color="#4ADE80"
              />
              <StatBar
                label="Clean"
                value={computedStats.cleanliness}
            icon={<Droplets className="w-3.5 h-3.5" />}
            color="#38BDF8"
              />
        </div>
      </motion.div>

      {/* ========== TOP-RIGHT HUD: COINS ========== */}
      <motion.div
        className="absolute top-4 right-4 z-30"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          {/* Diary button */}
          <motion.button
            onClick={() => setDiaryOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ 
              backgroundColor: COLORS.hudBg,
              border: `1px solid ${COLORS.hudBorder}`,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Book className="w-5 h-5" />
          </motion.button>
          
          {/* Coin counter - Roblox style pill */}
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow-xl"
            style={{ 
              backgroundColor: COLORS.hudBg,
              border: `1px solid ${COLORS.hudBorder}`,
            }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.span
              className="text-xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🪙
            </motion.span>
            <motion.span
              key={balance}
              className="text-lg font-bold text-amber-400"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
            >
              {balance.toLocaleString()}
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      {/* ========== BOTTOM INSTRUCTION HINT ========== */}
        <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div 
          className="px-4 py-2 rounded-full text-white/60 text-sm font-medium"
          style={{ backgroundColor: COLORS.hudBg }}
        >
          Click objects in the room to interact with your pet! 🎮
        </div>
      </motion.div>

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
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-rose-500/90 backdrop-blur-xl border border-rose-400/50 shadow-2xl"
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
          </motion.div>
  );
}

export default PetGameScene;
