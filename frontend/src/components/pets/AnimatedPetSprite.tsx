/**
 * AnimatedPetSprite Component
 * Displays animated pet sprite with mood-based emoji
 */
import { AnimatePresence, motion } from 'framer-motion';
import React, { useMemo } from 'react';

export type PetMood = 'joyful' | 'calm' | 'sleepy' | 'playful' | 'concerned';

export interface AnimatedPetSpriteProps {
  species: string;
  mood: PetMood;
  size?: 'sm' | 'md' | 'lg';
  level?: number;
}

const SPRITE_EMOJI: Record<string, Record<PetMood, string>> = {
  dog: {
    joyful: '🐕‍🦺',
    calm: '🐕',
    sleepy: '🐶💤',
    playful: '🐶🎾',
    concerned: '🐶🥺',
  },
  cat: {
    joyful: '😺',
    calm: '🐈',
    sleepy: '🐈💤',
    playful: '🐱🧶',
    concerned: '🐱😿',
  },
  bird: {
    joyful: '🐦🎶',
    calm: '🐦',
    sleepy: '🐦💤',
    playful: '🐦🌿',
    concerned: '🐦❗️',
  },
  rabbit: {
    joyful: '🐰🌸',
    calm: '🐇',
    sleepy: '🐇💤',
    playful: '🐰🥕',
    concerned: '🐰😟',
  },
  fox: {
    joyful: '🦊✨',
    calm: '🦊',
    sleepy: '🦊💤',
    playful: '🦊🪵',
    concerned: '🦊❗️',
  },
  dragon: {
    joyful: '🐲🔥',
    calm: '🐲',
    sleepy: '🐲💤',
    playful: '🐲🎮',
    concerned: '🐲💧',
  },
  panda: {
    joyful: '🐼✨',
    calm: '🐼',
    sleepy: '🐼💤',
    playful: '🐼🎋',
    concerned: '🐼😟',
  },
};

const sizeClasses: Record<NonNullable<AnimatedPetSpriteProps['size']>, string> = {
  sm: 'h-32 w-32',
  md: 'h-40 w-40',
  lg: 'h-48 w-48',
};

export const AnimatedPetSprite: React.FC<AnimatedPetSpriteProps> = ({ species, mood, size = 'md', level }) => {
  const sprite = useMemo(() => {
    const normalizedSpecies = species?.toLowerCase()?.trim() || '';
    const palette = SPRITE_EMOJI[normalizedSpecies];
    
    // Fallback to dog if species not found, with warning in development
    if (!palette && normalizedSpecies) {
      console.warn(`AnimatedPetSprite: Species "${normalizedSpecies}" not found, falling back to dog`);
    }
    
    return (palette ?? SPRITE_EMOJI.dog)[mood] ?? (palette ?? SPRITE_EMOJI.dog).joyful;
  }, [species, mood]);

  return (
    <motion.div
      className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 via-sky-50 to-emerald-100 shadow-inner dark:from-indigo-900/60 dark:via-slate-900 dark:to-emerald-900/60 ${sizeClasses[size]}`}
      animate={{ rotate: [0, 2.2, 0], scale: [1, 1.03, 1] }}
      transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
      role="img"
      aria-label={`${species} sprite feeling ${mood}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={`${species}-${mood}`}
          className="text-5xl sm:text-6xl"
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.95 }}
          transition={{ duration: 0.4 }}
        >
          {sprite}
        </motion.span>
      </AnimatePresence>

      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <div className="absolute inset-3 rounded-full border border-white/60 shadow-inner dark:border-white/10" />
      </motion.div>

      <AnimatePresence>
        {typeof level === 'number' && (
          <motion.span
            key={level}
            className="absolute -bottom-4 inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-white px-3 py-1 text-xs font-semibold text-violet-600 shadow-lg dark:border-violet-400/30 dark:bg-slate-900 dark:text-violet-200"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            role="status"
            aria-live="polite"
          >
            Level {level}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedPetSprite;

