import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePet } from '../context/PetContext';

// Pet Display Component
const PetDisplay = ({ name, species }: { name: string; species: string }) => {
  const getSpeciesEmoji = () => {
    switch (species.toLowerCase()) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      case 'rabbit': return '🐰';
      default: return '🐾';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
      <div className="text-8xl mb-4">{getSpeciesEmoji()}</div>
      <h1 className="text-2xl font-bold text-gray-800">{name}</h1>
      <p className="text-gray-600 capitalize">{species}</p>
    </div>
  );
};

// Stats Component
const PetStats = ({ stats }: { stats: PetStats }) => {
  const statConfig = {
    health: { color: 'bg-red-400', label: 'Health' },
    hunger: { color: 'bg-yellow-400', label: 'Hunger' },
    happiness: { color: 'bg-blue-400', label: 'Happiness' },
    cleanliness: { color: 'bg-green-400', label: 'Cleanliness' },
    energy: { color: 'bg-purple-400', label: 'Energy' },
  } as const;

  const statsArray = [
    { key: 'health', value: stats.health },
    { key: 'hunger', value: stats.hunger },
    { key: 'happiness', value: stats.happiness },
    { key: 'cleanliness', value: stats.cleanliness },
    { key: 'energy', value: stats.energy },
  ];

  return (
    <div className="space-y-4">
      {statsArray.map(({ key, value }) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">
              {statConfig[key as keyof typeof statConfig]?.label || key}
            </span>
            <span className="text-gray-500">{value}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${statConfig[key as keyof typeof statConfig]?.color || 'bg-gray-400'}`}
              style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Actions Component
const PetActions = ({ onAction }: { onAction: (action: string) => void }) => {
  const actions = [
    { id: 'feed', label: '🍖 Feed', stat: 'hunger', value: 15 },
    { id: 'play', label: '🎾 Play', stat: 'happiness', value: 10 },
    { id: 'clean', label: '🧼 Clean', stat: 'cleanliness', value: 20 },
    { id: 'heal', label: '❤️‍🩹 Heal', stat: 'health', value: 10 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAction(action.id)}
          className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
        >
          {action.label}
        </motion.button>
      ))}
    </div>
  );
};

interface PetStats {
  health: number;
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
}

interface PetData {
  name: string;
  species: string;
  stats: PetStats;
}

// Main Dashboard Page
export function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { pet, loading: petLoading, feed, play, bathe, updatePetStats } = usePet();
  
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { state: { from: '/dashboard' } });
    }
  }, [currentUser, authLoading, navigate]);
  
  // Conditional returns after all hooks
  if (authLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">Loading...</div>
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (petLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">Loading your pet...</div>
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">No pet found</div>
          <p className="text-gray-600 mb-4">Create a pet to get started!</p>
          <button 
            onClick={() => navigate('/pet/create')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create Pet
          </button>
        </div>
      </div>
    );
  }

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case 'feed':
          await feed();
          break;
        case 'play':
          await play();
          break;
        case 'clean':
          await bathe();
          break;
        case 'heal':
          await updatePetStats({
            health: Math.min(100, pet.stats.health + 10),
          });
          break;
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const name = pet.name;
  const species = pet.species;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Virtual Pet Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/shop')}
              className="flex items-center px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="mr-2">🛍️</span> Shop
            </button>
            <button 
              onClick={() => {
                // Add sign out logic here
                navigate('/');
              }}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Panel - Pet Display */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PetDisplay name={name} species={species} />
          </motion.div>
          
          {/* Right Panel - Stats and Actions */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Pet Stats</h2>
              <PetStats stats={pet.stats} />
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Actions</h2>
              <PetActions onAction={handleAction} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
