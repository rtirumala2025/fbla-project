/**
 * PetStatsDisplay Component
 * Displays pet stats with health bars and visual indicators
 */
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Zap, Smile, Droplet, Activity } from 'lucide-react';
import { PetStats } from '../../types/pet';

interface PetStatsDisplayProps {
  stats: PetStats;
  level?: number;
  xp?: number;
}

const statConfig = {
  health: { 
    icon: Heart, 
    color: 'bg-red-500', 
    bgColor: 'bg-red-100',
    label: 'Health',
    description: 'Overall pet health'
  },
  energy: { 
    icon: Zap, 
    color: 'bg-yellow-500', 
    bgColor: 'bg-yellow-100',
    label: 'Energy',
    description: 'Activity level'
  },
  happiness: { 
    icon: Smile, 
    color: 'bg-blue-500', 
    bgColor: 'bg-blue-100',
    label: 'Happiness',
    description: 'Mood and contentment'
  },
  cleanliness: { 
    icon: Droplet, 
    color: 'bg-green-500', 
    bgColor: 'bg-green-100',
    label: 'Cleanliness',
    description: 'Hygiene level'
  },
  hunger: { 
    icon: Activity, 
    color: 'bg-orange-500', 
    bgColor: 'bg-orange-100',
    label: 'Hunger',
    description: 'Food level'
  },
} as const;

export const PetStatsDisplay: React.FC<PetStatsDisplayProps> = memo(({ stats, level, xp }) => {
  const statsArray = [
    { key: 'health' as const, value: stats.health },
    { key: 'energy' as const, value: stats.energy },
    { key: 'happiness' as const, value: stats.happiness },
    { key: 'cleanliness' as const, value: stats.cleanliness },
    { key: 'hunger' as const, value: stats.hunger },
  ];

  const getStatStatus = (value: number) => {
    if (value >= 80) return 'excellent';
    if (value >= 60) return 'good';
    if (value >= 40) return 'fair';
    return 'poor';
  };

  const xpProgress = xp ? (xp % 1000) / 10 : 0;

  return (
    <div className="space-y-4">
      {/* Level and XP */}
      {(level !== undefined || xp !== undefined) && (
        <div className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Level {level || 1}</div>
            {xp !== undefined && (
              <div className="text-xs opacity-90">{xp} XP</div>
            )}
          </div>
          {xp !== undefined && (
            <div className="h-2 w-full rounded-full bg-white/20">
              <motion.div
                className="h-2 rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="space-y-3">
        {statsArray.map(({ key, value }) => {
          const config = statConfig[key];
          const Icon = config.icon;
          const status = getStatStatus(value);
          const clampedValue = Math.max(0, Math.min(100, value));

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: statsArray.indexOf({ key, value }) * 0.1 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color.replace('bg-', 'text-')}`} />
                  <span className="font-medium text-gray-700">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    status === 'excellent' ? 'text-green-600' :
                    status === 'good' ? 'text-blue-600' :
                    status === 'fair' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {Math.round(clampedValue)}%
                  </span>
                </div>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <motion.div
                  className={`h-full ${config.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${clampedValue}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                {/* Gradient overlay for visual appeal */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <p className="text-xs text-gray-500">{config.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Overall health indicator */}
      <div className="mt-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Overall Status</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            stats.health >= 80 && stats.happiness >= 70
              ? 'bg-green-100 text-green-700'
              : stats.health >= 60 && stats.happiness >= 50
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {stats.health >= 80 && stats.happiness >= 70 ? 'Excellent' :
             stats.health >= 60 && stats.happiness >= 50 ? 'Good' : 'Needs Care'}
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.stats.health === nextProps.stats.health &&
    prevProps.stats.energy === nextProps.stats.energy &&
    prevProps.stats.happiness === nextProps.stats.happiness &&
    prevProps.stats.cleanliness === nextProps.stats.cleanliness &&
    prevProps.stats.hunger === nextProps.stats.hunger &&
    prevProps.level === nextProps.level &&
    prevProps.xp === nextProps.xp
  );
});

PetStatsDisplay.displayName = 'PetStatsDisplay';

export default PetStatsDisplay;

