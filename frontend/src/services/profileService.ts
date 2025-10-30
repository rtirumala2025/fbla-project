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
   * Includes retry logic to wait for session to be ready after OAuth
   */
  async createProfile(username: string): Promise<Profile> {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 createProfile called');
    console.log('Username:', username);
    console.log('═══════════════════════════════════════════════════════');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check environment variables.');
    }

    if (!username || !username.trim()) {
      throw new Error('Username is required');
    }

    // Wait for authenticated user with retry logic (for OAuth callback timing)
    console.log('🔵 Waiting for authenticated Supabase session...');
    let user = null;
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 500; // 500ms between retries

    while (attempts < maxAttempts && !user) {
      attempts++;
      console.log(`🔄 Attempt ${attempts}/${maxAttempts} to get authenticated user...`);
      
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Error getting user:', userError);
        if (attempts >= maxAttempts) {
          throw new Error(`Authentication error: ${userError.message}`);
        }
      } else if (currentUser) {
        user = currentUser;
        console.log('✅ Authenticated user found!');
        break;
      } else {
        console.log('⏳ No user yet, waiting...');
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    if (!user) {
      console.error('❌ No authenticated user found after', maxAttempts, 'attempts');
      throw new Error('User not authenticated. Please log in again.');
    }

    console.log('✅ Authenticated user ID from Supabase:', user.id);
    console.log('📝 User email:', user.email);
    console.log('📝 User metadata:', user.user_metadata);

    // Use the authenticated user's ID for the insert
    const profileData = {
      user_id: user.id,
      username: username.trim(),
      coins: 100,
    };

    console.log('🔵 Inserting profile into Supabase profiles table...');
    console.log('Profile data:', profileData);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌❌❌ PROFILE INSERT FAILED');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('═══════════════════════════════════════════════════════');
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    if (!data) {
      console.error('❌ Profile insert succeeded but no data returned');
      throw new Error('Profile created but no data returned from database');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅✅✅ PROFILE SUCCESSFULLY SAVED TO DATABASE!');
    console.log('Profile ID:', data.id);
    console.log('Profile user_id:', data.user_id);
    console.log('Profile username:', data.username);
    console.log('Profile coins:', data.coins);
    console.log('Profile created_at:', data.created_at);
    console.log('═══════════════════════════════════════════════════════');
    
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

