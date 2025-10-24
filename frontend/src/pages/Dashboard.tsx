import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Zap, Smile, Droplets, Activity, 
  ShoppingBag, User, HelpCircle, BarChart3,
  MessageCircle
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
  const [petData, setPetData] = useState<PetData>({
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
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-xl">
              🐾
            </div>
            <span className="text-xl font-black text-slate-50">Companion</span>
          </div>

          {/* Money display */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2">
              <span className="text-2xl">💰</span>
              <span className="font-bold text-amber-400">{money}</span>
            </div>

            {/* Quick nav */}
            <div className="hidden md:flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
                <ShoppingBag className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar - Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pet info card */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-3xl">
                  {petData.species === 'dog' && '🐕'}
                  {petData.species === 'cat' && '🐱'}
                  {petData.species === 'bird' && '🐦'}
                  {petData.species === 'rabbit' && '🐰'}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-50">{petData.name}</h2>
                  <p className="text-sm text-slate-400 capitalize">{petData.breed.replace('-', ' ')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Age</span>
                  <p className="font-bold text-slate-300">{petData.age} days</p>
                </div>
                <div>
                  <span className="text-slate-500">Level</span>
                  <p className="font-bold text-slate-300">{petData.level}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-50 mb-4">Stats</h3>
              <div className="space-y-4">
                {/* Health */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-slate-300">Health</span>
                    </div>
                    <span className="text-sm font-bold text-slate-50">{Math.round(stats.health)}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
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
                      <span className="text-sm font-semibold text-slate-300">Hunger</span>
                    </div>
                    <span className="text-sm font-bold text-slate-50">{Math.round(stats.hunger)}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
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
                      <span className="text-sm font-semibold text-slate-300">Happiness</span>
                    </div>
                    <span className="text-sm font-bold text-slate-50">{Math.round(stats.happiness)}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
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
                      <span className="text-sm font-semibold text-slate-300">Cleanliness</span>
                    </div>
                    <span className="text-sm font-bold text-slate-50">{Math.round(stats.cleanliness)}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
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
                      <span className="text-sm font-semibold text-slate-300">Energy</span>
                    </div>
                    <span className="text-sm font-bold text-slate-50">{Math.round(stats.energy)}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
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
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-50 mb-4">Notifications</h3>
                <div className="space-y-2">
                  <AnimatePresence>
                    {notifications.map((notif, index) => (
                      <motion.div
                        key={index}
                        className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-sm text-indigo-300"
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
          </div>

          {/* Center - Pet display */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-12 min-h-[600px] flex flex-col">
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
                  className="p-4 bg-slate-900/50 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-400 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden md:inline">Shop</span>
                </button>
                <button className="p-4 bg-slate-900/50 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-400 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden md:inline">Analytics</span>
                </button>
                <button className="p-4 bg-slate-900/50 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-400 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
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
