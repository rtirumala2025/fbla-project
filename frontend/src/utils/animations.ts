import { Variants } from 'framer-motion';

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0 }
};

export const slideIn = (direction: 'left' | 'right' | 'up' | 'down' = 'up'): Variants => {
  return {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0,
      x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      y: direction === 'up' ? -20 : direction === 'down' ? 20 : 0,
      x: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
      transition: { duration: 0.2 }
    }
  };
};

export const bounce = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  },
  exit: { scale: 0.9, opacity: 0 }
};

export const statChange = (value: number) => ({
  initial: { scale: 1, y: 0 },
  animate: { 
    scale: [1, 1.2, 1],
    y: [0, -5, 0],
    color: value > 0 ? '#10B981' : value < 0 ? '#EF4444' : '#6B7280',
    transition: { duration: 0.5 }
  }
});

export const moodTransition = (mood: string) => {
  const moodColors: Record<string, string> = {
    happy: '#FCD34D',
    excited: '#F59E0B',
    neutral: '#9CA3AF',
    tired: '#60A5FA',
    hungry: '#F97316',
    sad: '#A78BFA',
    sick: '#EC4899'
  };

  return {
    backgroundColor: moodColors[mood] || moodColors.neutral,
    transition: { duration: 0.5 }
  };
};

export const achievementAnimation = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 20
    }
  },
  exit: { scale: 0.5, opacity: 0 }
};
