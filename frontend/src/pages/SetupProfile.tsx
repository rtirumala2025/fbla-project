import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Save, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const SetupProfile = () => {
  const navigate = useNavigate();
  const { currentUser, isNewUser, markUserAsReturning, endTransition } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    avatar: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill username from Google metadata
  useEffect(() => {
    if (currentUser?.displayName) {
      setFormData(prev => ({ ...prev, username: currentUser.displayName || '' }));
    }
  }, [currentUser]);

  // Redirect if not a new user (handles redirect if user somehow lands here)
  useEffect(() => {
    if (!isNewUser && currentUser) {
      console.log('🔄 SetupProfile: User is not new, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isNewUser, currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!currentUser) {
      setError('No user found. Please try logging in again.');
      return;
    }

    if (!currentUser.uid) {
      setError('Invalid user session. Please try logging in again.');
      return;
    }

    // Prevent duplicate submissions
    if (isLoading) {
      console.warn('⚠️ Profile creation already in progress, ignoring duplicate submit');
      return;
    }

    setIsLoading(true);

    try {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔵 SetupProfile: Starting profile creation');
      console.log('Current user UID:', currentUser.uid);
      console.log('Current user email:', currentUser.email);
      console.log('Username to save:', formData.username.trim());
      console.log('═══════════════════════════════════════════════════════');
      
      // Create user profile and await completion
      // Note: createProfile now fetches user ID from Supabase session internally
      const createdProfile = await profileService.createProfile(
        formData.username.trim()
      );
      
      // Verify profile was created
      if (!createdProfile || !createdProfile.id) {
        throw new Error('Profile creation returned invalid data');
      }
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅✅✅ SetupProfile: Profile persisted successfully!');
      console.log('Profile ID:', createdProfile.id);
      console.log('Profile user_id:', createdProfile.user_id);
      console.log('Profile username:', createdProfile.username);
      console.log('Profile coins:', createdProfile.coins);
      console.log('Timestamp:', new Date().toISOString());
      console.log('═══════════════════════════════════════════════════════');
      
      // Update profile with additional data if provided
      if (formData.avatar) {
        console.log('🔵 SetupProfile: Updating avatar...');
        await profileService.updateProfile(currentUser.uid, {
          avatar_url: formData.avatar || null,
        });
      }

      // Trigger welcome email as fallback (database trigger should handle it, but this ensures it works)
      try {
        const { sendWelcomeEmail } = await import('../services/emailService');
        // Call in background - don't block navigation
        sendWelcomeEmail(currentUser.uid).catch((err) => {
          console.warn('⚠️ Welcome email fallback failed (trigger should handle it):', err);
        });
      } catch (err) {
        // Email service import failed - trigger should still work
        console.warn('⚠️ Could not import email service (trigger should handle welcome email):', err);
      }

      console.log('✅ SetupProfile: Profile setup complete, navigating to dashboard');
      
      // Mark user as returning and navigate explicitly
      markUserAsReturning();
      navigate('/dashboard', { replace: true });
      // End transition next tick so ProtectedRoute can re-enable normal checks
      setTimeout(() => endTransition(), 0);
    } catch (err: any) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌❌❌ SetupProfile: PROFILE CREATION FAILED');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Timestamp:', new Date().toISOString());
      console.error('═══════════════════════════════════════════════════════');
      
      // Show error to user
      const errorMessage = err.message || 'Failed to create profile. Please try again.';
      setError(errorMessage);
      
      // Also show browser alert for visibility
      alert(`Profile Creation Failed:\n\n${errorMessage}\n\nPlease check the console for details and try again.`);
      
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream py-16 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-pet shadow-soft"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-4xl font-bold text-charcoal mb-2">
            Welcome{currentUser.displayName ? `, ${currentUser.displayName}` : ''}! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Let's set up your profile to get started
          </p>
        </motion.div>

        {/* Form */}
        <motion.form onSubmit={handleSubmit} className="space-y-6" variants={itemVariants}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-pet p-4 text-red-700 flex items-center"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Username */}
          <motion.div variants={itemVariants}>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-4 pl-12 border border-gray-300 rounded-pet placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </motion.div>

          {/* Avatar Placeholder */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {formData.username.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">
                  Avatar upload coming soon! For now, we'll use your initial.
                </p>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-pet text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Photo
                </button>
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants}>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-8 border border-transparent text-lg font-semibold rounded-pet text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <Save className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                  </span>
                  Complete Setup
                  <span className="absolute right-0 inset-y-0 flex items-center pr-3">
                    <ArrowRight className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                  </span>
                </>
              )}
            </button>
          </motion.div>
        </motion.form>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center">
          <p className="text-sm text-gray-500">
            You can always update your profile later in settings
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SetupProfile;
