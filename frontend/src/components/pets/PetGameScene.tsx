/**
 * PetGameScene Component
 * A Roblox-style pet game with a proper game world structure
 * The pet lives in a cozy room with interactive objects
 */
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import dayjs from 'dayjs';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { X } from 'lucide-react';
import { bathePetAction, feedPetAction, getPetDiary, playWithPet, restPetAction } from '../../api/pets';
import type { PetActionResponse, PetDiaryEntry, PetStats } from '../../types/pet';
import { usePet } from '../../context/PetContext';
import { useFinancial } from '../../context/FinancialContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EvolutionAnimation } from './EvolutionAnimation';
import { 
  getEnvironmentConfig, 
  getWorldObjects, 
  getZoneLabels,
  type EnvironmentConfig,
} from './environmentConfig';

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
// UI CONSTANTS (shared across all environments)
// ============================================================================

const UI_COLORS = {
  // UI colors - refined for clarity (these don't change per environment)
  hudBg: 'rgba(15, 23, 42, 0.88)',
  hudBorder: 'rgba(255, 255, 255, 0.08)',
  hudGlow: 'rgba(99, 102, 241, 0.15)',
  primary: '#FF6B9D',
  secondary: '#FFB347',
  accent: '#7DD3FC',
  success: '#4ADE80',
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
// WORLD OBJECTS TYPE (config-driven, see environmentConfig.ts)
// ============================================================================

interface WorldObject {
  id: CareAction;
  label: string;
  emoji: string;
  secondaryEmoji?: string;
  position: { x: string; y: string };
  size: string;
  description: string;
  actionEmoji: string[];
  zone: 'feed' | 'rest' | 'play' | 'clean';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Success messages - short, playful, competition-ready
const SUCCESS_MESSAGES: Record<CareAction, string[]> = {
  feed: ['Yum! 😋', 'Tasty!', 'Full tummy!', 'Munch munch!'],
  play: ['Woohoo! 🎉', 'So fun!', 'Best day!', 'Let\'s go!'],
  bathe: ['Squeaky! ✨', 'So fresh!', 'Sparkly!', 'Clean!'],
  rest: ['Zzz... 💤', 'So cozy~', 'Sleepy...', 'Dreaming~'],
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

// Success toast - appears after action with playful animation
const SuccessToast: React.FC<{
  indicator: SuccessIndicator;
  onComplete: () => void;
}> = ({ indicator, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const styles: Record<CareAction, { bg: string; emoji: string }> = {
    feed: { bg: 'linear-gradient(135deg, #F59E0B, #EA580C)', emoji: '🍖' },
    play: { bg: 'linear-gradient(135deg, #10B981, #059669)', emoji: '🎉' },
    bathe: { bg: 'linear-gradient(135deg, #06B6D4, #0284C7)', emoji: '✨' },
    rest: { bg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', emoji: '💤' },
  };

  const style = styles[indicator.action];

  return (
    <motion.div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-white font-bold text-base shadow-xl"
      style={{ 
        background: style.bg,
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
      }}
      initial={{ opacity: 0, y: -25, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.9 }}
      transition={{ type: 'spring', damping: 18, stiffness: 250 }}
    >
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.4, repeat: 2 }}
        >
          {style.emoji}
        </motion.span>
        <span>{indicator.message}</span>
      </div>
    </motion.div>
  );
};

// Refined stat bar for HUD - cleaner, more playful
const StatBar: React.FC<{ 
  value: number; 
  emoji: string;
  color: string;
  label: string;
}> = ({ value, emoji, color, label }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const isLow = clampedValue < 30;
  const isCritical = clampedValue < 15;
  
  return (
    <div 
      className="flex items-center gap-2 group" 
      title={`${label}: ${Math.round(clampedValue)}%`}
    >
      {/* Emoji icon with pulse when low */}
      <motion.span 
        className="text-base select-none"
        animate={isCritical ? { scale: [1, 1.2, 1] } : {}}
        transition={isCritical ? { duration: 0.5, repeat: Infinity } : {}}
      >
        {emoji}
      </motion.span>
      
      {/* Bar container */}
      <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden relative">
        {/* Fill bar with smooth transition */}
          <motion.div
          className="h-full rounded-full"
          style={{ 
            backgroundColor: isLow ? '#F87171' : color,
            boxShadow: isLow ? '0 0 8px rgba(248, 113, 113, 0.5)' : 'none',
          }}
            initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          />
        </div>
      </div>
  );
};

// Interactive world object with zone grouping (environment-aware)
const InteractiveObject: React.FC<{
  object: WorldObject;
  onClick: () => void;
  disabled: boolean;
  isActive: boolean;
  envConfig: EnvironmentConfig;
}> = ({ object, onClick, disabled, isActive, envConfig }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Zone-specific colors from environment config
  const zoneColors = {
    feed: { bg: envConfig.zones.feedZone, glow: envConfig.zoneLabels.feed + '80', border: envConfig.zoneLabels.feed + '4D' },
    rest: { bg: envConfig.zones.restZone, glow: envConfig.zoneLabels.rest + '80', border: envConfig.zoneLabels.rest + '4D' },
    play: { bg: envConfig.zones.playZone, glow: envConfig.zoneLabels.play + '80', border: envConfig.zoneLabels.play + '4D' },
    clean: { bg: envConfig.zones.cleanZone, glow: envConfig.zoneLabels.clean + '80', border: envConfig.zoneLabels.clean + '4D' },
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

      {/* Name badge - clean and readable */}
      <motion.div
        className="mt-3 px-4 py-1.5 rounded-full backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.85))',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
      >
        <span className="text-white font-bold text-base">{name}</span>
        {level && (
          <span className="ml-2 text-amber-400 text-xs font-bold bg-amber-400/10 px-1.5 py-0.5 rounded-full">
            Lv.{level}
          </span>
        )}
      </motion.div>
    </div>
  );
};

// Zone labels that appear on first load to teach gameplay (environment-aware)
const ZoneLabels: React.FC<{ show: boolean; envConfig: EnvironmentConfig }> = ({ show, envConfig }) => {
  if (!show) return null;

  const zones = getZoneLabels(envConfig);

  return (
    <>
      {zones.map((zone, index) => (
        <motion.div
          key={zone.label}
          className="absolute z-10 pointer-events-none"
          style={zone.position}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.8 + index * 0.15, duration: 0.4 }}
        >
          <motion.div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${zone.color}ee, ${zone.color}cc)`,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
          >
            <span>{zone.emoji}</span>
            <span>{zone.label}</span>
          </motion.div>
        </motion.div>
      ))}
    </>
  );
};

// Room decorations - environment-aware, driven by config
const RoomDecorations: React.FC<{ envConfig: EnvironmentConfig }> = ({ envConfig }) => {
  return (
    <>
      {/* Window with gentle light - only for indoor environments */}
      {envConfig.window.show && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-0 opacity-85">
          <div className="relative">
            {/* Window frame - simplified */}
            <div className="w-28 h-20 bg-gradient-to-b from-sky-200/70 to-sky-100/50 rounded-t-xl border-2 border-amber-600/50 shadow-md overflow-hidden">
              {/* Window panes */}
              <div className="absolute inset-1 grid grid-cols-2 gap-0.5">
                <div className="bg-sky-100/30 rounded-tl-lg" />
                <div className="bg-sky-100/30 rounded-tr-lg" />
              </div>
              {/* Sun - color from config */}
              <motion.div
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full"
                style={{ backgroundColor: envConfig.window.sunColor }}
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            {/* Window sill */}
            <div className="w-32 h-1.5 bg-amber-600/60 rounded-b -mt-0.5 mx-auto" />
          </div>
        </div>
      )}
        
      {/* Central spotlight for pet - defines the main stage */}
      <div 
        className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-56 h-16 rounded-full z-0"
        style={{
          background: `radial-gradient(ellipse, ${envConfig.spotlight.color} 0%, transparent 65%)`,
          opacity: envConfig.spotlight.opacity,
        }}
      />
      
      {/* Corner decorative elements from config */}
      {envConfig.decorations.map((decoration, index) => (
        <div 
          key={index}
          className="absolute text-lg z-0"
          style={{ 
            ...decoration.position,
            opacity: decoration.opacity,
          }}
        >
          {decoration.emoji}
        </div>
      ))}
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
                  <div className="text-center py-10">
                    <motion.span 
                      className="text-5xl mb-4 block"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      📝
                    </motion.span>
                    <p className="text-white/70 font-medium mb-1">No memories yet!</p>
                    <p className="text-white/40 text-sm">Care for your pet to write new entries~</p>
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
  const [showZoneLabels, setShowZoneLabels] = useState(true);
  
  const sceneRef = useRef<HTMLDivElement>(null);

  // Hide zone labels after first interaction (they're just for teaching)
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setShowZoneLabels(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

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

  // Get environment config based on pet species
  const envConfig = useMemo(() => getEnvironmentConfig(petSpecies), [petSpecies]);
  
  // Get world objects for this environment
  const worldObjects = useMemo(() => getWorldObjects(envConfig), [envConfig]);

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

  // Create particle burst (uses environment-specific props)
  const createParticleBurst = useCallback((action: CareAction, centerX: number, centerY: number) => {
    const worldObject = worldObjects.find(o => o.id === action);
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
  }, [worldObjects]);

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

  // Loading state - polished for competition (uses default environment)
  if (loading) {
    const defaultEnv = getEnvironmentConfig('default');
    return (
      <div 
        className="fixed inset-0 top-[80px] flex items-center justify-center"
        style={{ 
          background: `linear-gradient(180deg, ${defaultEnv.room.wallTop} 0%, ${defaultEnv.room.wallBottom} 60%, ${defaultEnv.room.floor} 100%)`,
        }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-7xl mb-4"
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            🐾
          </motion.div>
          <LoadingSpinner size="lg" />
          <motion.p 
            className="mt-4 text-slate-700 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Waking up your pet...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // No pet state - encouraging and clear (uses default dog environment colors)
  if (!pet) {
    const defaultEnv = getEnvironmentConfig('default');
    return (
      <div 
        className="fixed inset-0 top-[80px] flex items-center justify-center"
        style={{ 
          background: `linear-gradient(180deg, ${defaultEnv.room.wallTop} 0%, ${defaultEnv.room.wallBottom} 60%, ${defaultEnv.room.floor} 100%)`,
        }}
      >
        <motion.div
          className="text-center max-w-sm px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="text-7xl mb-4"
            animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🥚
          </motion.div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Ready to meet your pet?</h2>
          <p className="text-slate-600 text-sm mb-5">Create your companion and start your adventure!</p>
          <motion.a
            href="/pet-selection"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #FF6B9D, #FFB347)',
              boxShadow: '0 4px 15px rgba(255, 107, 157, 0.35)',
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>🎉</span>
            Create My Pet
          </motion.a>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      ref={sceneRef}
      className="fixed inset-0 top-[80px] overflow-hidden"
      animate={screenShake ? { x: [0, -2, 2, -2, 0] } : {}}
      transition={{ duration: 0.15 }}
    >
      {/* ========== ROOM BACKGROUND (environment-driven) ========== */}
      <div className="absolute inset-0">
        {/* Wall gradient - from environment config */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, 
              ${envConfig.room.wallTop} 0%, 
              ${envConfig.room.wallBottom} 55%, 
              ${envConfig.room.floor} 55%, 
              ${envConfig.room.floorLight} 100%
            )`,
          }}
        />
        
        {/* Floor with subtle texture */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[45%]"
          style={{
            background: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 80px,
                ${envConfig.room.floorAccent}15 80px,
                ${envConfig.room.floorAccent}15 81px
              ),
              linear-gradient(180deg, ${envConfig.room.floor} 0%, ${envConfig.room.floorLight} 100%)
            `,
          }}
        />
        
        {/* Baseboard - clean divider */}
        <div 
          className="absolute left-0 right-0 h-2"
          style={{
            top: '55%',
            background: `linear-gradient(180deg, ${envConfig.room.floorAccent} 0%, ${envConfig.room.floor} 100%)`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        />

        {/* Zone highlight areas - from environment config */}
        <div 
          className="absolute w-28 h-28 rounded-3xl z-[1]"
          style={{
            left: '10%',
            bottom: '12%',
            background: `radial-gradient(ellipse, ${envConfig.floorHighlights.feed} 0%, transparent 70%)`,
          }}
        />
        <div 
          className="absolute w-28 h-28 rounded-3xl z-[1]"
          style={{
            right: '10%',
            bottom: '12%',
            background: `radial-gradient(ellipse, ${envConfig.floorHighlights.rest} 0%, transparent 70%)`,
          }}
        />
        <div 
          className="absolute w-28 h-28 rounded-3xl z-[1]"
          style={{
            right: '10%',
            top: '38%',
            background: `radial-gradient(ellipse, ${envConfig.floorHighlights.play} 0%, transparent 70%)`,
          }}
        />
        <div 
          className="absolute w-28 h-28 rounded-3xl z-[1]"
          style={{
            left: '10%',
            top: '38%',
            background: `radial-gradient(ellipse, ${envConfig.floorHighlights.clean} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* ========== ROOM DECORATIONS ========== */}
      <RoomDecorations envConfig={envConfig} />

      {/* ========== ZONE LABELS (teaching overlay) ========== */}
      <ZoneLabels show={showZoneLabels && !actionLoading} envConfig={envConfig} />

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

      {/* ========== INTERACTIVE WORLD OBJECTS (environment-driven) ========== */}
      {worldObjects.map((obj) => (
        <InteractiveObject
          key={obj.id}
          object={obj}
          onClick={(e?: any) => handleAction(obj.id, e)}
          disabled={actionLoading !== null}
          isActive={actionLoading === obj.id}
          envConfig={envConfig}
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
        className="absolute top-3 left-3 z-30 px-3 py-2.5 rounded-2xl shadow-xl backdrop-blur-sm"
        style={{ 
          backgroundColor: UI_COLORS.hudBg,
          border: `1px solid ${UI_COLORS.hudBorder}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 ${UI_COLORS.hudGlow}`,
        }}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
      >
        <div className="space-y-1.5">
              <StatBar
                label="Happiness"
                value={computedStats.happiness}
            emoji="😊"
            color="#FBBF24"
              />
              <StatBar
                label="Health"
                value={computedStats.health}
            emoji="❤️"
            color="#FB7185"
              />
              <StatBar
                label="Energy"
                value={computedStats.energy}
            emoji="⚡"
            color="#4ADE80"
              />
              <StatBar
                label="Clean"
                value={computedStats.cleanliness}
            emoji="✨"
            color="#38BDF8"
              />
        </div>
      </motion.div>

      {/* ========== TOP-RIGHT HUD: COINS & ACTIONS ========== */}
      <motion.div
        className="absolute top-3 right-3 z-30"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
      >
        <div className="flex items-center gap-2">
          {/* Diary button - compact */}
          <motion.button
            onClick={() => setDiaryOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-sm"
            style={{ 
              backgroundColor: UI_COLORS.hudBg,
              border: `1px solid ${UI_COLORS.hudBorder}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}
            whileHover={{ scale: 1.08, backgroundColor: 'rgba(30, 41, 59, 0.95)' }}
            whileTap={{ scale: 0.94 }}
            title="Pet Diary"
          >
            <span className="text-base">📔</span>
          </motion.button>
          
          {/* Coin counter - polished Roblox-style */}
          <motion.div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm"
            style={{ 
              background: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.92))',
              border: `1px solid ${UI_COLORS.hudBorder}`,
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            }}
            whileHover={{ scale: 1.04 }}
          >
            <motion.span
              className="text-lg"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              🪙
            </motion.span>
            <motion.span
              key={balance}
              className="text-base font-bold text-amber-400 tabular-nums"
              initial={{ scale: 1.2, color: '#86EFAC' }}
              animate={{ scale: 1, color: '#FBBF24' }}
              transition={{ duration: 0.4 }}
            >
              {balance.toLocaleString()}
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      {/* ========== BOTTOM INSTRUCTION HINT ========== */}
      <AnimatePresence>
        {showZoneLabels && (
        <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 1.2, duration: 0.4 }}
          >
            <motion.div 
              className="px-4 py-2 rounded-full text-white text-sm font-semibold backdrop-blur-sm"
              style={{ 
                background: 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Tap the objects to care for your pet! 🐾
      </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full backdrop-blur-lg shadow-xl max-w-xs"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
            initial={{ opacity: 0, y: -15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
          >
            <div className="flex items-center gap-2 text-white">
              <span className="text-base">😿</span>
              <p className="text-sm font-medium truncate">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  loadDiaryData();
                }}
                className="ml-1 px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors"
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
