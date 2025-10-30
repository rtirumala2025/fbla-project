import type { Database } from '../types/database.types';
import { supabase } from '../lib/supabase';

const useMock = process.env.REACT_APP_USE_MOCK === 'true';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profileService = {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    if (useMock) {
      console.log('🔧 Mock mode: Returning mock profile');
      return {
        id: `mock-profile-${userId}`,
        user_id: userId,
        username: 'Mock User',
        coins: 100,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist yet
        return null;
      }
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  },

  /**
   * Create user profile (called on signup)
   */
  async createProfile(userId: string, username: string): Promise<Profile> {
    console.log('🔵 createProfile called:', { userId, username, useMock });
    
    if (useMock) {
      console.warn('⚠️ Mock mode active - profile will NOT be saved to database');
      return {
        id: `mock-profile-${userId}`,
        user_id: userId,
        username,
        coins: 100,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    if (!supabase) {
      throw new Error('Supabase client not initialized. Check environment variables.');
    }

    if (!userId || !username) {
      throw new Error('userId and username are required');
    }

    console.log('🔵 Inserting profile into Supabase...');
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        username,
        coins: 100, // Starting coins
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Profile creation failed:', error);
      console.error('Error details:', { code: error.code, message: error.message, details: error.details });
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    if (!data) {
      throw new Error('Profile created but no data returned from database');
    }

    console.log('✅ Profile created successfully in database:', data);
    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update username
   */
  async updateUsername(userId: string, username: string): Promise<Profile> {
    return await this.updateProfile(userId, { username });
  },

  /**
   * Update avatar
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<Profile> {
    return await this.updateProfile(userId, { avatar_url: avatarUrl });
  },
};

