import type { Database } from '../types/database.types';
import { supabase } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profileService = {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    console.log('🔵 getProfile called for userId:', userId);
    
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
        console.log('📭 No profile found for user:', userId);
        return null;
      }
      console.error('❌ Error fetching profile:', error);
      throw error;
    }

    console.log('✅ Profile found:', data);
    return data;
  },

  /**
   * Create user profile (called on signup)
   * Uses the authenticated Supabase session to ensure correct user_id
   */
  async createProfile(userId: string, username: string): Promise<Profile> {
    console.log('🔵 createProfile called with userId:', userId, 'username:', username);
    
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check environment variables.');
    }

    if (!username || !username.trim()) {
      throw new Error('Username is required');
    }

    // Get the authenticated user from Supabase session
    console.log('🔵 Getting authenticated user from Supabase session...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Failed to get authenticated user:', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) {
      console.error('❌ No authenticated user found');
      throw new Error('User not authenticated. Please log in again.');
    }

    console.log('✅ Authenticated user ID from Supabase:', user.id);
    console.log('📝 User email:', user.email);
    
    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      console.warn('⚠️ userId mismatch! Provided:', userId, 'Authenticated:', user.id);
      console.log('🔧 Using authenticated user ID:', user.id);
    }

    // Use the authenticated user's ID for the insert
    const profileData = {
      user_id: user.id,
      username: username.trim(),
      coins: 100,
    };

    console.log('🔵 Inserting profile into Supabase profiles table:', profileData);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('❌ Profile creation failed with error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    if (!data) {
      console.error('❌ Profile insert succeeded but no data returned');
      throw new Error('Profile created but no data returned from database');
    }

    console.log('✅✅✅ Profile successfully persisted to database!');
    console.log('Profile ID:', data.id);
    console.log('Profile data:', data);
    
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

