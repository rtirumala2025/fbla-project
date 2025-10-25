import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Zap, Smile, Droplets, Activity, 
  ShoppingBag, BarChart3, MessageCircle
} from 'lucide-react';

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
  breed: string;
  age: number; // in days
  level: number;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  // TODO: Replace with Supabase data fetching in Phase 2
  const [petData] = useState<PetData>({
    name: localStorage.getItem('petName') || 'Buddy',
    species: localStorage.getItem('selectedSpecies') || 'dog',
    breed: localStorage.getItem('selectedBreed') || 'labrador',
    age: 1,
    level: 1,
  });

  const [stats, setStats] = useState<PetStats>({
    health: 100,
    hunger: 75,
    happiness: 80,
    cleanliness: 90,
    energy: 85,
  });

  const [money, setMoney] = useState(100);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  
  // Pet chat messages
  const petMessages = [
    "I'm feeling great today! 🌟",
    "Can we play fetch soon? 🎾",
    "Thanks for feeding me! 🍖",
    "I love spending time with you! ❤️",
    "That was so much fun! 😄",
    "I'm ready for an adventure! 🗺️",
    "You're the best pet parent ever! 🏆",
    "Can we go to the park? 🌳",
    "I need some belly rubs! 🤗",
    "Let's learn something new together! 📚",
    "I'm getting stronger every day! 💪",
    "Time for a nap? 😴",
  ];
  
  const [currentMessage, setCurrentMessage] = useState(petMessages[0]);
  const [messageVisible, setMessageVisible] = useState(true);
  
  // Rotate pet messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageVisible(false);
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * petMessages.length);
        setCurrentMessage(petMessages[randomIndex]);
        setMessageVisible(true);
      }, 300);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [petMessages]);

  // Simulate stat decay over time
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        health: Math.max(0, prev.health - 0.1),
        hunger: Math.max(0, prev.hunger - 0.5),
        happiness: Math.max(0, prev.happiness - 0.3),
        cleanliness: Math.max(0, prev.cleanliness - 0.2),
        energy: Math.max(0, prev.energy - 0.4),
      }));

      // Check for warnings
      if (stats.hunger < 30) {
        addNotification(`${petData.name} is getting hungry!`);
      }
      if (stats.cleanliness < 40) {
        addNotification(`${petData.name} needs a bath.`);
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [stats, petData.name]);

  const addNotification = (message: string) => {
    setNotifications(prev => {
      if (!prev.includes(message)) {
        return [message, ...prev].slice(0, 3);
      }
      return prev;
    });
  };

  const handleAction = (action: string, cost: number = 0) => {
    if (cost > 0 && money < cost) {
      addNotification("Not enough coins!");
      return;
    }

    setSelectedAction(action);
    
    switch (action) {
      case 'feed':
        setStats(prev => ({ ...prev, hunger: Math.min(100, prev.hunger + 30) }));
        setMoney(prev => prev - cost);
        addNotification(`Fed ${petData.name}!`);
        break;
      case 'play':
        setStats(prev => ({ 
          ...prev, 
          happiness: Math.min(100, prev.happiness + 25),
          energy: Math.max(0, prev.energy - 15)
        }));
        addNotification(`Played with ${petData.name}!`);
        break;
      case 'bathe':
        setStats(prev => ({ ...prev, cleanliness: Math.min(100, prev.cleanliness + 40) }));
        setMoney(prev => prev - cost);
        addNotification(`${petData.name} is squeaky clean!`);
        break;
      case 'rest':
        setStats(prev => ({ 
          ...prev, 
          energy: Math.min(100, prev.energy + 35),
          health: Math.min(100, prev.health + 5)
        }));
        addNotification(`${petData.name} is well-rested!`);
        break;
    }

    setTimeout(() => setSelectedAction(null), 1000);
  };

  const getStatColor = (value: number) => {
    if (value >= 70) return 'from-emerald-500 to-teal-500';
    if (value >= 40) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getEmoji = () => {
    if (stats.happiness < 30) return '😢';
    if (stats.hunger < 30) return '😫';
    if (stats.energy < 30) return '😴';
    if (stats.happiness > 80) return '😄';
    return '🙂';
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Money display */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-amber-400">{money}</span>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar - Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pet info card */}
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-3xl">
                  {petData.species === 'dog' && '🐕'}
                  {petData.species === 'cat' && '🐱'}
                  {petData.species === 'bird' && '🐦'}
                  {petData.species === 'rabbit' && '🐰'}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{petData.name}</h2>
                  <p className="text-sm text-gray-600 capitalize">{petData.breed.replace('-', ' ')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Age</span>
                  <p className="font-bold text-gray-900">{petData.age} days</p>
                </div>
                <div>
                  <span className="text-gray-500">Level</span>
                  <p className="font-bold text-gray-900">{petData.level}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Stats</h3>
              <div className="space-y-4">
                {/* Health */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-gray-700">Health</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{Math.round(stats.health)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getStatColor(stats.health)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.health}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Hunger */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-semibold text-gray-700">Hunger</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{Math.round(stats.hunger)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getStatColor(stats.hunger)}`}
                      animate={{ width: `${stats.hunger}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Happiness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-700">Happiness</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{Math.round(stats.happiness)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getStatColor(stats.happiness)}`}
                      animate={{ width: `${stats.happiness}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Cleanliness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-gray-700">Cleanliness</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{Math.round(stats.cleanliness)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getStatColor(stats.cleanliness)}`}
                      animate={{ width: `${stats.cleanliness}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Energy */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-gray-700">Energy</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{Math.round(stats.energy)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getStatColor(stats.energy)}`}
                      animate={{ width: `${stats.energy}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="bg-white border-2 border-gray-300 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Notifications</h3>
                <div className="space-y-2">
                  <AnimatePresence>
                    {notifications.map((notif, index) => (
                      <motion.div
                        key={index}
                        className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-700"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        {notif}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
            
            {/* Pet Chat / AI Assistant */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Pet Chat</h3>
              </div>
              <AnimatePresence mode="wait">
                {messageVisible && (
                  <motion.div
                    key={currentMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white border border-indigo-200 rounded-xl p-4 shadow-sm"
                  >
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <span className="font-semibold text-indigo-600">{petData.name}:</span>{' '}
                      {currentMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-3 text-xs text-gray-500 text-center">
                ✨ AI-powered companion
              </div>
            </div>
          </div>

          {/* Center - Pet display */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-300 rounded-3xl p-12 min-h-[600px] flex flex-col shadow-xl">
              {/* Pet display */}
              <div className="flex-1 flex items-center justify-center mb-8">
                <motion.div
                  className="text-center"
                  animate={{
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="text-9xl mb-4 filter drop-shadow-2xl">
                    {petData.species === 'dog' && '🐕'}
                    {petData.species === 'cat' && '🐱'}
                    {petData.species === 'bird' && '🐦'}
                    {petData.species === 'rabbit' && '🐰'}
                  </div>
                  
                  {/* Emotion indicator */}
                  <motion.div
                    className="text-6xl"
                    key={getEmoji()}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {getEmoji()}
                  </motion.div>
                </motion.div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => handleAction('feed', 10)}
                  disabled={selectedAction === 'feed'}
                  className="p-6 bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-2xl font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50"
                >
                  <div className="text-3xl mb-2">🍖</div>
                  <div className="text-sm">Feed</div>
                  <div className="text-xs opacity-75">10 coins</div>
                </button>

                <button
                  onClick={() => handleAction('play')}
                  disabled={selectedAction === 'play'}
                  className="p-6 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50"
                >
                  <div className="text-3xl mb-2">⚽</div>
                  <div className="text-sm">Play</div>
                  <div className="text-xs opacity-75">Free</div>
                </button>

                <button
                  onClick={() => handleAction('bathe', 15)}
                  disabled={selectedAction === 'bathe'}
                  className="p-6 bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50"
                >
                  <div className="text-3xl mb-2">🛁</div>
                  <div className="text-sm">Bathe</div>
                  <div className="text-xs opacity-75">15 coins</div>
                </button>

                <button
                  onClick={() => handleAction('rest')}
                  disabled={selectedAction === 'rest'}
                  className="p-6 bg-gradient-to-br from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-2xl font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50"
                >
                  <div className="text-3xl mb-2">😴</div>
                  <div className="text-sm">Rest</div>
                  <div className="text-xs opacity-75">Free</div>
                </button>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <button 
                  onClick={() => navigate('/shop')}
                  className="p-4 bg-white border-2 border-gray-300 hover:border-indigo-500 text-gray-800 hover:text-indigo-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden md:inline">Shop</span>
                </button>
                <button className="p-4 bg-white border-2 border-gray-300 hover:border-indigo-500 text-gray-800 hover:text-indigo-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden md:inline">Analytics</span>
                </button>
                <button className="p-4 bg-white border-2 border-gray-300 hover:border-indigo-500 text-gray-800 hover:text-indigo-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden md:inline">AI Help</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
