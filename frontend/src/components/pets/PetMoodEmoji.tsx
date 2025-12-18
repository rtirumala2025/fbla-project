/**
 * PetMoodEmoji Component
 * Displays mood emoji above or next to pet based on backend reaction
 */
import React from 'react';
import { motion } from 'framer-motion';

interface PetMoodEmojiProps {
  mood: string;
  reaction?: string;
  className?: string;
}

const moodEmojiMap: Record<string, string> = {
  happy: '😊',
  excited: '🤩',
  content: '😌',
  playful: '😄',
  sleepy: '😴',
  tired: '😪',
  hungry: '😋',
  sad: '😢',
  sick: '🤒',
  angry: '😠',
  anxious: '😰',
  bored: '😑',
  default: '😐',
};

const getMoodFromReaction = (reaction?: string, mood?: string): string => {
  if (!reaction && !mood) return 'default';
  
  const text = (reaction || mood || '').toLowerCase();
  
  // Check for mood keywords in reaction text
  if (text.includes('happy') || text.includes('excited') || text.includes('joy')) return 'happy';
  if (text.includes('excited') || text.includes('thrilled')) return 'excited';
  if (text.includes('playful') || text.includes('playing')) return 'playful';
  if (text.includes('sleepy') || text.includes('tired') || text.includes('rest')) return 'sleepy';
  if (text.includes('hungry') || text.includes('food') || text.includes('feed')) return 'hungry';
  if (text.includes('sad') || text.includes('unhappy')) return 'sad';
  if (text.includes('sick') || text.includes('ill')) return 'sick';
  if (text.includes('angry') || text.includes('mad')) return 'angry';
  if (text.includes('anxious') || text.includes('worried')) return 'anxious';
  if (text.includes('bored')) return 'bored';
  if (text.includes('content') || text.includes('calm')) return 'content';
  
  // Fallback to mood prop or default
  return mood || 'default';
};

export const PetMoodEmoji: React.FC<PetMoodEmojiProps> = ({ mood, reaction, className = '' }) => {
  const detectedMood = getMoodFromReaction(reaction, mood);
  const emoji = moodEmojiMap[detectedMood] || moodEmojiMap.default;

  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: 'spring',
        stiffness: 200,
        damping: 15
      }}
    >
      <motion.div
        className="relative"
        animate={{
          y: [0, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="text-4xl sm:text-5xl md:text-6xl" role="img" aria-label={`Pet mood: ${detectedMood}`}>
          {emoji}
        </span>
      </motion.div>
    </motion.div>
  );
};

