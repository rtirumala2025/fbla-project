import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, PawPrint, Coins, Calendar, Edit2, Save, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { profileService, type Profile as UserProfile } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { Database } from '../types/database.types';

type Pet = Database['public']['Tables']['pets']['Row'];

export const ProfilePage = () => {
  const toast = useToast();
  const { currentUser, refreshUserState } = useAuth();
  
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [petData, setPetData] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPet, setIsEditingPet] = useState(false);
  
  const [tempUsername, setTempUsername] = useState('');
  const [tempPetName, setTempPetName] = useState('');

  // Fetch user profile and pet data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔵 ProfilePage: Fetching profile and pet data for user:', currentUser.uid);
        
        // Fetch profile
        const profile = await profileService.getProfile(currentUser.uid);
        console.log('✅ ProfilePage: Profile data:', profile);
        setUserData(profile);
        setTempUsername(profile?.username || '');

        // Fetch pet data
        const { data: pet, error: petError } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', currentUser.uid)
          .single();

        if (petError && petError.code !== 'PGRST116') {
          console.error('❌ Error fetching pet:', petError);
        } else {
          console.log('✅ ProfilePage: Pet data:', pet);
          setPetData(pet);
          setTempPetName(pet?.name || '');
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser?.uid, toast]);

  const handleSaveProfile = async () => {
    if (!currentUser?.uid || !tempUsername.trim()) {
      toast.error('Please enter a valid username');
      return;
    }

    setSaving(true);
    try {
      console.log('🔵 ProfilePage: Updating username to:', tempUsername);
      
      // Update username in database and auth metadata
      const updatedProfile = await profileService.updateUsername(currentUser.uid, tempUsername.trim());
      console.log('✅ ProfilePage: Profile updated successfully:', updatedProfile);
      
      setUserData(updatedProfile);
    setIsEditingProfile(false);
      
      // Refresh the auth context to update the display name everywhere
      await refreshUserState();
      console.log('✅ ProfilePage: Auth state refreshed');
      
    toast.success('Profile updated successfully! 🎉');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelProfile = () => {
    setTempUsername(userData?.username || '');
    setIsEditingProfile(false);
  };

  const handleSavePet = async () => {
    if (!currentUser?.uid || !petData || !tempPetName.trim()) {
      toast.error('Please enter a valid pet name');
      return;
    }

    setSaving(true);
    try {
      console.log('🔵 ProfilePage: Updating pet name to:', tempPetName);
      
      const { data: updatedPet, error } = await supabase
        .from('pets')
        .update({ name: tempPetName.trim() })
        .eq('user_id', currentUser.uid)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ ProfilePage: Pet updated successfully:', updatedPet);
      setPetData(updatedPet);
    setIsEditingPet(false);
    toast.success(`Pet renamed to ${tempPetName}! 🐾`);
    } catch (error) {
      console.error('❌ Error updating pet:', error);
      toast.error('Failed to update pet name');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPet = () => {
    setTempPetName(petData?.name || '');
    setIsEditingPet(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

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
                    disabled={saving}
                    className="w-full px-4 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 disabled:opacity-50"
                    placeholder="Enter username"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
                    {userData?.username || 'Not set'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium">
                  {currentUser?.email || 'Not available'}
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
                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'Not available'}
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
                  <p className="text-amber-700 font-bold text-lg">{userData?.coins || 0}</p>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditingProfile && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
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
              {petData ? (
                <>
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
                        disabled={saving}
                        className="w-full px-4 py-2 border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 disabled:opacity-50"
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
                    <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium capitalize">
                  {petData.species}
                </p>
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Breed
                </label>
                    <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium capitalize">
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
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelPet}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PawPrint className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pet found. Complete the pet setup to create your pet!</p>
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
                <p className="text-2xl font-black text-blue-700">{petData?.age || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                <p className="text-sm text-purple-600 font-semibold mb-1">Pet Level</p>
                <p className="text-2xl font-black text-purple-700">{petData?.level || 1}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-600 font-semibold mb-1">Coins</p>
                <p className="text-2xl font-black text-amber-700">{userData?.coins || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-600 font-semibold mb-1">Happiness</p>
                <p className="text-2xl font-black text-emerald-700">{petData?.happiness || 0}%</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

