/**
 * PetGameScreen Component
 * Main game screen for Virtual Pet Companion
 * Displays pet, stats, coin balance, and action buttons
 */
import React from 'react';
import { usePet } from '../context/PetContext';
import { useFinancial } from '../context/FinancialContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatBar } from '../components/pets/StatBar';
import { Heart, Zap, Smile, Droplet, Activity, Utensils, Gamepad2, Sparkles, Moon } from 'lucide-react';

const getSpeciesEmoji = (species?: string): string => {
  if (!species) return '🐕';
  switch (species.toLowerCase()) {
    case 'dog': return '🐶';
    case 'cat': return '🐱';
    case 'bird': return '🐦';
    case 'rabbit': return '🐰';
    default: return '🐕';
  }
};

export const PetGameScreen: React.FC = () => {
  const { pet, loading: petLoading } = usePet();
  const { balance, loading: financialLoading } = useFinancial();

  if (petLoading || financialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Pet Found</h2>
          <p className="text-gray-600">Please create a pet first.</p>
        </div>
      </div>
    );
  }

  const petEmoji = getSpeciesEmoji(pet.species);
  const stats = pet.stats;

  // Stat configurations with icons
  const statConfigs = [
    { key: 'health', label: 'Health', value: stats.health, icon: <Heart className="w-4 h-4 text-red-500" /> },
    { key: 'hunger', label: 'Hunger', value: stats.hunger, icon: <Utensils className="w-4 h-4 text-orange-500" /> },
    { key: 'happiness', label: 'Happiness', value: stats.happiness, icon: <Smile className="w-4 h-4 text-yellow-500" /> },
    { key: 'cleanliness', label: 'Cleanliness', value: stats.cleanliness, icon: <Droplet className="w-4 h-4 text-blue-500" /> },
    { key: 'energy', label: 'Energy', value: stats.energy, icon: <Zap className="w-4 h-4 text-yellow-500" /> },
  ];

  // Action button configurations
  const actionButtons = [
    { id: 'feed', label: 'Feed', icon: <Utensils className="w-6 h-6" />, color: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'play', label: 'Play', icon: <Gamepad2 className="w-6 h-6" />, color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'clean', label: 'Clean', icon: <Sparkles className="w-6 h-6" />, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'rest', label: 'Rest', icon: <Moon className="w-6 h-6" />, color: 'bg-purple-500 hover:bg-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Coin Balance */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {pet.name}'s Game
            </h1>
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
              <span className="text-2xl">🪙</span>
              <span className="text-lg font-bold text-gray-800">
                {balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Pet Display - Center/Top */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center">
              <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-8 md:p-12 mb-6 w-full max-w-md">
                <div className="text-center">
                  <div className="text-8xl md:text-9xl mb-4 animate-bounce">
                    {petEmoji}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                    {pet.name}
                  </h2>
                  <p className="text-sm text-gray-600 capitalize">
                    {pet.species} • Level {pet.level || 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Panel - Side */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Pet Stats</h3>
                <div className="space-y-4">
                  {statConfigs.map((stat) => (
                    <StatBar
                      key={stat.key}
                      label={stat.label}
                      value={stat.value}
                      icon={stat.icon}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {actionButtons.map((action) => (
              <button
                key={action.id}
                className={`
                  ${action.color}
                  text-white font-semibold py-4 px-6 rounded-xl
                  transition-all duration-200 transform hover:scale-105
                  active:scale-95 shadow-md hover:shadow-lg
                  flex flex-col items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                disabled={false} // Will be implemented later
              >
                {action.icon}
                <span className="text-base md:text-lg">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetGameScreen;
