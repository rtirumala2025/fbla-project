/**
 * EvolutionAnimation Component
 * Displays animated celebration when pet evolves to a new stage
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Zap } from 'lucide-react';

type EvolutionStage = 'egg' | 'juvenile' | 'adult' | 'legendary';

interface EvolutionAnimationProps {
  petName: string;
  oldStage: EvolutionStage;
  newStage: EvolutionStage;
  level: number;
  onComplete?: () => void;
}

const stageNames: Record<EvolutionStage, string> = {
  egg: 'Egg',
  juvenile: 'Juvenile',
  adult: 'Adult',
  legendary: 'Legendary',
};

const stageEmojis: Record<EvolutionStage, string> = {
  egg: '🥚',
  juvenile: '🌟',
  adult: '⭐',
  legendary: '✨',
};

const stageColors: Record<EvolutionStage, string> = {
  egg: 'from-blue-400 to-cyan-400',
  juvenile: 'from-green-400 to-emerald-400',
  adult: 'from-purple-400 to-pink-400',
  legendary: 'from-yellow-400 via-orange-400 to-red-400',
};

export const EvolutionAnimation: React.FC<EvolutionAnimationProps> = ({
  petName,
  oldStage,
  newStage,
  level,
  onComplete,
}) => {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState<'intro' | 'evolution' | 'complete'>('intro');

  useEffect(() => {
    // Intro phase: 1 second
    const introTimer = setTimeout(() => setPhase('evolution'), 1000);
    // Evolution phase: 2 seconds
    const evolutionTimer = setTimeout(() => setPhase('complete'), 3000);
    // Complete phase: 1.5 seconds, then hide
    const completeTimer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 4500);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(evolutionTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          setShow(false);
          onComplete?.();
        }}
      >
        {/* Sparkle particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: '50%',
              y: '50%',
              scale: 0,
              rotate: Math.random() * 360,
            }}
            animate={{
              x: `${50 + (Math.random() - 0.5) * 100}%`,
              y: `${50 + (Math.random() - 0.5) * 100}%`,
              scale: [0, 1, 0],
              rotate: Math.random() * 720,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
          </motion.div>
        ))}

        <motion.div
          className="relative max-w-md w-full mx-4"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`relative rounded-3xl bg-gradient-to-br ${stageColors[newStage]} p-8 shadow-2xl overflow-hidden`}>
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <div className="relative z-10 text-center text-white">
              {phase === 'intro' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Zap className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-3xl font-bold mb-2">Evolution Starting!</h2>
                  <p className="text-lg opacity-90">{petName} is evolving...</p>
                </motion.div>
              )}

              {phase === 'evolution' && (
                <motion.div
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.div
                    className="text-8xl mb-6"
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {stageEmojis[newStage]}
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <h2 className="text-4xl font-black mb-2">EVOLUTION!</h2>
                    <p className="text-2xl font-semibold mb-1">
                      {stageNames[oldStage]} → {stageNames[newStage]}
                    </p>
                    <p className="text-lg opacity-90">Level {level} Reached!</p>
                  </motion.div>
                </motion.div>
              )}

              {phase === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Sparkles className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                  <p className="text-xl font-semibold mb-1">
                    {petName} is now a {stageNames[newStage]}!
                  </p>
                  <p className="text-lg opacity-90">Keep caring for them to unlock more stages!</p>
                </motion.div>
              )}
            </div>

            {/* Bottom decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />
          </div>

          {/* Close hint */}
          <p className="text-center text-white/80 text-sm mt-4">
            Click anywhere to continue
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EvolutionAnimation;
