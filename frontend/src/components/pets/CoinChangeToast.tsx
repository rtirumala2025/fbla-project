/**
 * CoinChangeToast Component
 * Toast-style notification for coin changes after actions
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinChangeToastProps {
  change: number; // Positive or negative number
  id: string; // Unique identifier for the toast
  onComplete?: () => void;
}

export const CoinChangeToast: React.FC<CoinChangeToastProps> = ({ change, id, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show toast
    setIsVisible(true);
    
    // Hide after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 300); // Wait for exit animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [change, id, onComplete]);

  if (change === 0) return null;

  const isPositive = change > 0;
  const displayValue = Math.abs(change);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 25
          }}
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-xl ${
            isPositive 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
          style={{
            maxWidth: '300px',
          }}
        >
          <span className="text-xl">
            {isPositive ? '💰' : '💸'}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {isPositive ? 'Earned' : 'Spent'}
            </span>
            <span className="text-lg font-bold">
              {isPositive ? '+' : '-'}{displayValue} coins
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

