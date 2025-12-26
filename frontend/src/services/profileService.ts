import type { Database } from '../types/database.types';
import { supabase, withTimeout, withRetry } from '../lib/supabase';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/networkUtils';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Simple in-memory cache for profile data (TTL: 5 minutes)
const profileCache = new Map<string, { data: Profile | null; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (increased from 30 seconds for better performance)

export const profileService = {
  /**
   * Get user profile with caching
   */
  async getProfile(userId: string, useCache: boolean = true): Promise<Profile | null> {
    // Check cache first
    if (useCache) {
      const cached = profileCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
    }
    
    logger.debug('getProfile called', { userId });
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const getProfileOperation = async () => {
        const query = supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        const { data, error } = await withTimeout(
          query as unknown as Promise<any>,
          10000,
          'Get profile'
        ) as any;

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist yet
            logger.debug('No profile found for user', { userId });
            profileCache.set(userId, { data: null, timestamp: Date.now() });
            return null;
          }
          logger.error('Error fetching profile', { userId, errorCode: error.code }, error);
          throw error;
        }

        logger.debug('Profile found', { userId, profileId: data?.id });
        return data;
      };

      const data = await withRetry(getProfileOperation, 3, 1000, 'Get profile');
      // Cache the result
      if (data) {
        profileCache.set(userId, { data, timestamp: Date.now() });
      } else {
        profileCache.set(userId, { data: null, timestamp: Date.now() });
      }
      
      // Clean up old cache entries (keep cache size manageable)
      if (profileCache.size > 50) {
        const now = Date.now();
        for (const [key, value] of profileCache.entries()) {
          if (now - value.timestamp > CACHE_TTL_MS * 2) {
            profileCache.delete(key);
          }
        }
      }
      
      return data;
    } catch (err: any) {
      if (err.message?.includes('timed out')) {
        logger.error('Get profile request timed out', { userId }, err);
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
  },
  
  /**
   * Clear profile cache for a user (call after updates)
   */
  clearCache(userId?: string): void {
    if (userId) {
      profileCache.delete(userId);
    } else {
      profileCache.clear();
    }
  },

  /**
   * Create user profile (called on signup)
   * Uses the authenticated Supabase session to ensure correct user_id
   * Includes retry logic to wait for session to be ready after OAuth
   */
  async createProfile(username: string): Promise<Profile> {
    logger.info('createProfile called', { username });
    
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check environment variables.');
    }

    if (!username || !username.trim()) {
      throw new Error('Username is required');
    }

    // Wait for authenticated user with retry logic (for OAuth callback timing)
    logger.debug('Waiting for authenticated Supabase session');
    let user = null;
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 500; // 500ms between retries

    while (attempts < maxAttempts && !user) {
      attempts++;
      logger.debug(`Attempt ${attempts}/${maxAttempts} to get authenticated user`);
      
      try {
        const getUserPromise = supabase.auth.getUser();
        const { data: { user: currentUser }, error: userError } = await withTimeout(
          getUserPromise,
          5000,
          'Get authenticated user'
        ) as any;
        
        if (userError) {
          logger.error('Error getting user', { attempt: attempts, maxAttempts, errorCode: userError.code }, userError);
          if (attempts >= maxAttempts) {
            throw new Error(`Authentication error: ${userError.message}`);
          }
        } else if (currentUser) {
          user = currentUser;
          logger.debug('Authenticated user found', { userId: currentUser.id });
          break;
        } else {
          logger.debug('No user yet, waiting', { attempt: attempts });
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      } catch (err: any) {
        if (err.message?.includes('timed out')) {
          logger.error('Get user request timed out', { attempt: attempts }, err);
          if (attempts >= maxAttempts) {
            throw new Error('Authentication request timed out. Please try again.');
          }
        } else {
          throw err;
        }
      }
    }
    
    if (!user) {
      logger.error('No authenticated user found after max attempts', { maxAttempts });
      throw new Error('User not authenticated. Please log in again.');
    }

    logger.debug('Authenticated user found', { userId: user.id, email: user.email });

    // Check if profile already exists to prevent duplicate key violation
    logger.debug('Checking for existing profile', { userId: user.id });
    const existingProfile = await this.getProfile(user.id, false); // Don't use cache
    
    if (existingProfile) {
      logger.info('Profile already exists', { userId: user.id, profileId: existingProfile.id });
      return existingProfile;
    }

    // Use the authenticated user's ID for the insert
    const profileData = {
      user_id: user.id,
      username: username.trim(),
      coins: 100,
    };

    logger.debug('Inserting profile into Supabase', { profileData });
    
    try {
      const query = supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      const { data, error } = await withTimeout(
        query as unknown as Promise<any>,
        15000,
        'Create profile'
      ) as any;

      if (error) {
        logger.error('Profile insert failed', {
          userId: user.id,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        }, error);
        
        // Handle duplicate key violation specifically
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('profiles_user_id_unique')) {
          logger.warn('Duplicate profile detected, fetching existing profile', { userId: user.id });
          const existingProfile = await this.getProfile(user.id, false);
          if (existingProfile) {
            return existingProfile;
          }
        }
        
        throw new Error(getErrorMessage(error, `Failed to create profile: ${error.message}`));
      }

      if (!data) {
        logger.error('Profile insert succeeded but no data returned', { userId: user.id });
        throw new Error('Profile created but no data returned from database');
      }

      logger.info('Profile successfully saved to database', {
        profileId: data.id,
        userId: data.user_id,
        username: data.username,
      });
      
      // Clear cache for this user
      profileCache.delete(user.id);
      
      return data;
    } catch (err: any) {
      if (err.message?.includes('timed out')) {
        logger.error('Create profile request timed out', { userId: user.id }, err);
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    logger.debug('updateProfile called', { userId, updates });
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      const query = supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      const { data, error } = await withTimeout(
        query as unknown as Promise<any>,
        10000,
        'Update profile'
      ) as any;

      if (error) {
        logger.error('Profile update failed', {
          userId,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
        }, error);
        throw new Error(getErrorMessage(error, error.message || 'Failed to update profile'));
      }

      if (!data) {
        logger.error('Profile update succeeded but no data returned', { userId });
        throw new Error('Profile update succeeded but no data returned');
      }

      logger.info('Profile updated successfully', { userId, profileId: data.id });
      
      // Clear cache for this user
      profileCache.delete(userId);
      
      return data;
    } catch (err: any) {
      if (err.message?.includes('timed out')) {
        logger.error('Update profile request timed out', { userId }, err);
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
  },

  /**
   * Update username (updates both profile and auth metadata)
   */
  async updateUsername(userId: string, username: string): Promise<Profile> {
    logger.debug('updateUsername called', { userId, username });
    
    // Update the profile in the database
    const updatedProfile = await this.updateProfile(userId, { username });
    
    // Also update the user metadata in Supabase Auth
    try {
      const updateUserPromise = supabase.auth.updateUser({
        data: {
          display_name: username,
        },
      });
      
      const { error: authError } = await withTimeout(
        updateUserPromise as Promise<any>,
        10000,
        'Update auth metadata'
      ) as any;
      
      if (authError) {
        logger.error('Failed to update auth metadata', { userId, errorCode: authError.code }, authError instanceof Error ? authError : new Error(String(authError)));
        // Don't throw - profile update succeeded, auth metadata update is secondary
      } else {
        logger.debug('Auth metadata updated successfully', { userId });
      }
    } catch (error) {
      logger.error('Error updating auth metadata', { userId }, error instanceof Error ? error : new Error(String(error)));
      // Don't throw - profile update succeeded
    }
    
    return updatedProfile;
  },

  /**
   * Update avatar
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<Profile> {
    return await this.updateProfile(userId, { avatar_url: avatarUrl });
  },
};

