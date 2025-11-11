import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Zap, Droplet, Coffee, Activity, Smile } from 'lucide-react';

interface PetState {
  mood: string;
  happiness: number;
  energy: number;
  hunger: number;
  cleanliness: number;
  last_updated?: string;
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  excited: '😃',
  neutral: '😐',
  tired: '😴',
  hungry: '🍽️',
  playful: '🎾',
  sad: '😢',
  sick: '🤒',
};

const moodColors: Record<string, string> = {
  happy: 'bg-yellow-100 border-yellow-300',
  excited: 'bg-pink-100 border-pink-300',
  neutral: 'bg-gray-100 border-gray-300',
  tired: 'bg-blue-100 border-blue-300',
  hungry: 'bg-orange-100 border-orange-300',
  playful: 'bg-green-100 border-green-300',
  sad: 'bg-indigo-100 border-indigo-300',
  sick: 'bg-red-100 border-red-300',
};

const PetEmotionCard: React.FC<{ petState: PetState; className?: string }> = ({
  petState,
  className = '',
}) => {
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [isVisible, setIsVisible] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Update the last updated time
  useEffect(() => {
    if (petState.last_updated) {
      const updated = new Date(petState.last_updated);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        setLastUpdated('Just now');
      } else if (diffInSeconds < 3600) {
        const mins = Math.floor(diffInSeconds / 60);
        setLastUpdated(`${mins} minute${mins === 1 ? '' : 's'} ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setLastUpdated(`${hours} hour${hours === 1 ? '' : 's'} ago`);
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        setLastUpdated(`${days} day${days === 1 ? '' : 's'} ago`);
      }
    }
    
    // Trigger animation
    setIsVisible(true);
  }, [petState.last_updated]);

  // Get mood display info
  const getMoodInfo = () => {
    const mood = petState.mood?.toLowerCase() || 'neutral';
    return {
      emoji: moodEmojis[mood] || moodEmojis.neutral,
      color: moodColors[mood] || moodColors.neutral,
      label: mood.charAt(0).toUpperCase() + mood.slice(1),
    };
  };

  const moodInfo = getMoodInfo();

  // Calculate bar colors based on value
  const getBarColor = (value: number) => {
    if (value < 25) return 'bg-red-400';
    if (value < 50) return 'bg-yellow-400';
    if (value < 75) return 'bg-blue-400';
    return 'bg-green-400';
  };

  // Stats to display
  const stats = [
    {
      name: 'Happiness',
      value: petState.happiness || 50,
      icon: <Heart className="w-4 h-4 text-pink-500" />,
    },
    {
      name: 'Energy',
      value: petState.energy || 50,
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
    },
    {
      name: 'Hunger',
      value: petState.hunger || 50,
      icon: <Coffee className="w-4 h-4 text-orange-500" />,
    },
    {
      name: 'Clean',
      value: petState.cleanliness || 50,
      icon: <Droplet className="w-4 h-4 text-blue-500" />,
    },
  ];

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md overflow-hidden border ${moodInfo.color} transition-all duration-300 ${className}`}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={containerVariants}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Pet Status</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {lastUpdated}
            </span>
          </div>
        </div>
        
        {/* Mood Display */}
        <motion.div 
          className="flex items-center justify-center mb-6 p-4 rounded-lg bg-white/50 backdrop-blur-sm"
          variants={itemVariants}
        >
          <div className="text-6xl mr-4">{moodInfo.emoji}</div>
          <div>
            <div className="text-sm text-gray-500">Current Mood</div>
            <div className="text-2xl font-bold text-gray-800">{moodInfo.label}</div>
            <div className="text-xs text-gray-500 mt-1">
              {moodInfo.label === 'Happy' && 'Your pet is happy and content!'}
              {moodInfo.label === 'Excited' && 'Your pet is super excited!'}
              {moodInfo.label === 'Neutral' && 'Your pet is feeling alright.'}
              {moodInfo.label === 'Tired' && 'Your pet needs some rest.'}
              {moodInfo.label === 'Hungry' && 'Your pet is hungry!'}
              {moodInfo.label === 'Playful' && 'Your pet wants to play!'}
              {moodInfo.label === 'Sad' && 'Your pet is feeling down.'}
              {moodInfo.label === 'Sick' && 'Your pet is not feeling well.'}
            </div>
          </div>
        </motion.div>
        
        {/* Stats */}
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.name} 
              className="space-y-1"
              variants={itemVariants}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-700">
                  {stat.icon}
                  <span>{stat.name}</span>
                </div>
                <span className="font-medium">{stat.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getBarColor(stat.value)}`} 
                  style={{ width: `${stat.value}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Action Suggestions */}
        {petState.hunger < 30 && (
          <motion.div 
            className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-start"
            variants={itemVariants}
          >
            <span>🍖</span>
            <span className="ml-2">Your pet is hungry! Try feeding them some food.</span>
          </motion.div>
        )}
        
        {petState.energy && petState.energy < 30 && (
          <motion.div 
            className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-start"
            variants={itemVariants}
          >
            <span>😴</span>
            <span className="ml-2">Your pet is tired. They might need some rest.</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PetEmotionCard;
