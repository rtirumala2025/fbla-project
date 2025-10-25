import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, PawPrint, Coins, Calendar, Edit2, Save, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const ProfilePage = () => {
  const toast = useToast();
  
  // Mock user data - will be replaced with actual context/state management
  const [userData, setUserData] = useState({
    username: 'PetLover123',
    email: 'petlover@example.com',
    joinDate: '2024-01-15',
    coins: 150,
  });

  const [petData, setPetData] = useState({
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: 45, // days
    level: 5,
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPet, setIsEditingPet] = useState(false);
  
  const [tempUsername, setTempUsername] = useState(userData.username);
  const [tempPetName, setTempPetName] = useState(petData.name);

  const handleSaveProfile = () => {
    setUserData({ ...userData, username: tempUsername });
    setIsEditingProfile(false);
    toast.success('Profile updated successfully! 🎉');
  };

  const handleCancelProfile = () => {
    setTempUsername(userData.username);
    setIsEditingProfile(false);
  };

  const handleSavePet = () => {
    setPetData({ ...petData, name: tempPetName });
    setIsEditingPet(false);
    toast.success(`Pet renamed to ${tempPetName}! 🐾`);
  };

  const handleCancelPet = () => {
    setTempPetName(petData.name);
    setIsEditingPet(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and pet information</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <motion.div
            className="bg-white border-2 border-gray-300 rounded-2xl p-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
                  <p className="text-sm text-gray-500">Account details</p>
                </div>
              </div>
              
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Edit profile"
                >
                  <Edit2 className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="Enter username"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
                    {userData.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium">
                  {userData.email}
                </p>
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Member Since
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <p className="text-gray-600 font-medium">
                    {new Date(userData.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Coins */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Coins Balance
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <p className="text-amber-700 font-bold text-lg">{userData.coins}</p>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditingProfile && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelProfile}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Pet Profile Card */}
          <motion.div
            className="bg-white border-2 border-gray-300 rounded-2xl p-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                  <PawPrint className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pet Profile</h2>
                  <p className="text-sm text-gray-500">Your companion</p>
                </div>
              </div>
              
              {!isEditingPet && (
                <button
                  onClick={() => setIsEditingPet(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Edit pet"
                >
                  <Edit2 className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Pet Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pet Name
                </label>
                {isEditingPet ? (
                  <input
                    type="text"
                    value={tempPetName}
                    onChange={(e) => setTempPetName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    placeholder="Enter pet name"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
                    {petData.name}
                  </p>
                )}
              </div>

              {/* Species */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Species
                </label>
                <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium">
                  {petData.species}
                </p>
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Breed
                </label>
                <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium">
                  {petData.breed}
                </p>
              </div>

              {/* Age & Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Age
                  </label>
                  <p className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-bold text-center">
                    {petData.age} days
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Level
                  </label>
                  <p className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 font-bold text-center">
                    Level {petData.level}
                  </p>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditingPet && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSavePet}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelPet}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            className="bg-white border-2 border-gray-300 rounded-2xl p-6 shadow-xl md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-600 font-semibold mb-1">Total Days</p>
                <p className="text-2xl font-black text-blue-700">{petData.age}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                <p className="text-sm text-purple-600 font-semibold mb-1">Pet Level</p>
                <p className="text-2xl font-black text-purple-700">{petData.level}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-600 font-semibold mb-1">Coins</p>
                <p className="text-2xl font-black text-amber-700">{userData.coins}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-600 font-semibold mb-1">Happiness</p>
                <p className="text-2xl font-black text-emerald-700">85%</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

