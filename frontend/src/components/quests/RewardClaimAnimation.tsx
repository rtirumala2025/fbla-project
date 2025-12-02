/**
 * RewardClaimAnimation Component
 * Animated reward claim flow with coin and XP animations
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RewardClaimAnimationProps {
  coins: number;
  xp: number;
  isVisible: boolean;
  onComplete?: () => void;
}

export const RewardClaimAnimation: React.FC<RewardClaimAnimationProps> = ({
  coins,
  xp,
  isVisible,
  onComplete,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setShowAnimation(false);
            onComplete?.();
          }}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="relative rounded-3xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-4 text-6xl"
              >
                🎉
              </motion.div>
              <h3 className="mb-6 text-2xl font-bold text-gray-900">Quest Complete!</h3>
              
              <div className="space-y-4">
                {coins > 0 && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-3 rounded-xl bg-amber-50 p-4"
                  >
                    <Coins className="h-6 w-6 text-amber-600" />
                    <span className="text-xl font-bold text-amber-600">+{coins} coins</span>
                  </motion.div>
                )}
                
                {xp > 0 && (
                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-3 rounded-xl bg-indigo-50 p-4"
                  >
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                    <span className="text-xl font-bold text-indigo-600">+{xp} XP</span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardClaimAnimation;
