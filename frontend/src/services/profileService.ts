import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profileService = {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
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
      console.error('Error creating profile:', error);
      throw error;
    }

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

