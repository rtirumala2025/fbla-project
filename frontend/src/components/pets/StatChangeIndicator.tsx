/**
 * StatChangeIndicator Component
 * Displays animated +/- stat change indicators that fade out after 2 seconds
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatChangeIndicatorProps {
  change: number; // Positive or negative number
  statKey: string; // Unique key for the stat
}

export const StatChangeIndicator: React.FC<StatChangeIndicatorProps> = ({ change, statKey }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show indicator
    setIsVisible(true);
    
    // Hide after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [change, statKey]);

  if (change === 0) return null;

  const isPositive = change > 0;
  const displayValue = Math.abs(change);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={`${statKey}-${change}`}
          initial={{ opacity: 0, y: -10, scale: 0.8 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.6 }}
          transition={{ 
            duration: 0.3,
            ease: 'easeOut'
          }}
          className={`absolute right-0 top-0 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold shadow-lg ${
            isPositive 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
          style={{
            pointerEvents: 'none',
          }}
        >
          <span>{isPositive ? '+' : '-'}</span>
          <span>{displayValue}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

