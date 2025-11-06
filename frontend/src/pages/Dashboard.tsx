import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePet } from '../context/PetContext';
import { profileService } from '../services/profileService';
import { useToast } from '../contexts/ToastContext';
import { 
  Heart, Zap, Smile, Droplets, Activity, 
  ShoppingBag, BarChart3, MessageCircle
} from 'lucide-react';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

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
  const { currentUser } = useAuth();
  const { pet, loading: petLoading, feed: feedPet, play: playPet, bathe: bathePet, rest: restPet, updatePetStats } = usePet();
  const toast = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  
  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) {
        setLoadingProfile(false);
        return;
      }
      
      try {
        setLoadingProfile(true);
        console.log('🔵 Dashboard: Loading profile for user:', currentUser.uid);
        const profileData = await profileService.getProfile(currentUser.uid);
        if (profileData) {
          console.log('✅ Dashboard: Profile loaded successfully', { 
            username: profileData.username, 
            coins: profileData.coins 
          });
          setProfile(profileData);
        } else {
          console.warn('⚠️ Dashboard: No profile found for user');
          toast.error('Profile not found. Please complete setup.');
        }
      } catch (error: any) {
        console.error('❌ Dashboard: Error loading profile:', error);
        toast.error(`Failed to load profile: ${error.message || 'Unknown error'}`);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    loadProfile();
  }, [currentUser?.uid, toast]);
  
  // Derived pet data from PetContext
  const petData: PetData | null = pet ? {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    level: pet.level,
  } : null;
  
  // Stats from pet
  const stats: PetStats = pet?.stats || {
    health: 100,
    hunger: 75,
    happiness: 80,
    cleanliness: 90,
    energy: 85,
  };
  
  const money = profile?.coins || 0;
  
  // Pet chat messages
  const petMessages = useMemo(() => [
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
  ], []);
  
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

  // Check for low stats and show notifications
  useEffect(() => {
    if (!pet || !petData) return;
    
    if (stats.hunger < 30) {
      addNotification(`${petData.name} is getting hungry!`);
    }
    if (stats.cleanliness < 40) {
      addNotification(`${petData.name} needs a bath.`);
    }
    if (stats.health < 30) {
      addNotification(`${petData.name} needs medical attention!`);
    }
    if (stats.energy < 20) {
      addNotification(`${petData.name} is very tired!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.hunger, stats.cleanliness, stats.health, stats.energy, petData?.name]);

  const addNotification = (message: string) => {
    setNotifications(prev => {
      if (!prev.includes(message)) {
        return [message, ...prev].slice(0, 3);
      }
      return prev;
    });
  };

  const handleAction = async (action: string, cost: number = 0) => {
    if (!pet || !currentUser?.uid) {
      toast.error('Please create a pet first!');
      return;
    }

    if (cost > 0 && money < cost) {
      addNotification("Not enough coins!");
      toast.error('Not enough coins!');
      return;
    }

    setSelectedAction(action);
    
    // Optimistic UI update - update balance immediately
    let previousBalance = balance;
    let previousProfile = profile;
    
    if (cost > 0 && profile) {
      const optimisticBalance = (profile.coins || 0) - cost;
      setProfile({ ...profile, coins: optimisticBalance });
    }
    
    try {
      console.log(`🔵 Dashboard: Performing action "${action}" (cost: ${cost} coins)`);
      
      // Deduct coins if action costs money
      if (cost > 0 && profile) {
        const newBalance = (profile.coins || 0) - cost;
        console.log(`💰 Dashboard: Deducting ${cost} coins (${profile.coins} → ${newBalance})`);
        await profileService.updateProfile(currentUser.uid, { coins: newBalance });
        setProfile({ ...profile, coins: newBalance });
        console.log('✅ Dashboard: Coins updated successfully');
      }
      
      // Perform pet action via PetContext (already handles optimistic updates)
      switch (action) {
        case 'feed':
          console.log('🍖 Dashboard: Feeding pet...');
          await feedPet();
          addNotification(`Fed ${petData?.name || 'pet'}!`);
          console.log('✅ Dashboard: Pet fed successfully');
          break;
        case 'play':
          console.log('⚽ Dashboard: Playing with pet...');
          await playPet();
          addNotification(`Played with ${petData?.name || 'pet'}!`);
          console.log('✅ Dashboard: Played with pet successfully');
          break;
        case 'bathe':
          console.log('🛁 Dashboard: Bathing pet...');
          await bathePet();
          addNotification(`${petData?.name || 'Pet'} is squeaky clean!`);
          console.log('✅ Dashboard: Pet bathed successfully');
          break;
        case 'rest':
          console.log('😴 Dashboard: Pet resting...');
          await restPet();
          addNotification(`${petData?.name || 'Pet'} is well-rested!`);
          console.log('✅ Dashboard: Pet rested successfully');
          break;
      }
      
      toast.success(`Action completed!`);
      console.log(`✅ Dashboard: Action "${action}" completed successfully`);
    } catch (error: any) {
      console.error(`❌ Dashboard: Error performing action "${action}":`, error);
      console.error('Error details:', { message: error.message, stack: error.stack });
      // Revert optimistic update on error
      if (cost > 0 && previousProfile) {
        console.log('🔄 Dashboard: Reverting optimistic balance update');
        setProfile(previousProfile);
      }
      toast.error(`Failed to perform action: ${error.message || 'Unknown error'}`);
    } finally {
      setTimeout(() => setSelectedAction(null), 1000);
    }
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

  // Show loading state
  if (petLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-cream pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your pet...</p>
        </div>
      </div>
    );
  }
  
  // Show message if no pet
  if (!pet || !petData) {
    return (
      <div className="min-h-screen bg-cream pt-24 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-bold text-charcoal mb-2">No Pet Yet!</h2>
          <p className="text-gray-600 mb-6">
            Create your virtual pet to get started.
          </p>
          <button
            onClick={() => navigate('/onboarding/species')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Create Your Pet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-24">
      <div className="max-w-[90vw] mx-auto px-8 py-10">
        {/* Welcome message */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-charcoal mb-2">
            Welcome{currentUser?.displayName ? `, ${currentUser.displayName}` : ''}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Ready to take care of {petData.name} today?
          </p>
        </motion.div>

        {/* Money display */}
        <div className="flex items-center justify-end mb-8">
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-full px-6 py-3">
            <span className="text-3xl">💰</span>
            <span className="font-bold text-amber-600 text-xl">{money}</span>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left sidebar - Stats */}
          <div className="lg:col-span-1 space-y-8">
            {/* Pet info card */}
            <div className="bg-white rounded-pet p-8 shadow-soft">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-4xl">
                  {petData.species === 'dog' && '🐕'}
                  {petData.species === 'cat' && '🐱'}
                  {petData.species === 'bird' && '🐦'}
                  {petData.species === 'rabbit' && '🐰'}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-charcoal">{petData.name}</h2>
                  <p className="text-base text-gray-600 capitalize">{petData.breed.replace('-', ' ')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-base">
                <div>
                  <span className="text-gray-500">Age</span>
                  <p className="font-bold text-charcoal text-lg">{petData.age} days</p>
                </div>
                <div>
                  <span className="text-gray-500">Level</span>
                  <p className="font-bold text-charcoal text-lg">{petData.level}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-pet p-8 shadow-soft">
              <h3 className="text-2xl font-bold text-charcoal mb-6">Stats</h3>
              <div className="space-y-5">
                {/* Health */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-red-400" />
                      <span className="text-base font-semibold text-gray-700">Health</span>
                    </div>
                    <span className="text-base font-bold text-charcoal">{Math.round(stats.health)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
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
                      <span className="font-semibold text-indigo-600">{petData?.name || 'Pet'}:</span>{' '}
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
