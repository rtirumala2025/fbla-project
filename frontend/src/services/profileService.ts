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

    // CRITICAL FIX: Guard against missing session by calling getUser()
    // This ensures we have a valid authenticated session before creating the profile
    // Includes retry logic for OAuth callback timing
    console.log('🔵 Waiting for authenticated Supabase session...');
    let user = null;
    let attempts = 0;
    const maxAttempts = 5; // Increased attempts for better reliability
    const retryDelay = 500; // 500ms between retries

    while (attempts < maxAttempts && !user) {
      attempts++;
      console.log(`🔄 Attempt ${attempts}/${maxAttempts} to get authenticated user...`);
      
      // CRITICAL: Use getUser() to verify the session exists and is valid
      // This throws an error if there's no session, which we catch and handle
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Error getting user:', userError);
        console.error('  Error code:', userError.message);
        
        // If it's a session error, provide a clear message
        if (userError.message.includes('session') || userError.message.includes('JWT')) {
          if (attempts >= maxAttempts) {
            throw new Error('Auth session missing! Please log in again.');
          }
        } else if (attempts >= maxAttempts) {
          throw new Error(`Authentication error: ${userError.message}`);
        }
      } else if (currentUser) {
        user = currentUser;
        console.log('✅ Authenticated user found!');
        console.log('  User ID:', user.id);
        console.log('  User email:', user.email);
        break;
      } else {
        console.log('⏳ No user yet, waiting...');
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // CRITICAL FIX: Only insert profile if user exists
    // This prevents "Auth session missing!" errors
    if (!user) {
      console.error('❌ No authenticated user found after', maxAttempts, 'attempts');
      throw new Error('Auth session missing! Please log in again.');
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
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 updateProfile called');
    console.log('  User ID:', userId);
    console.log('  Updates:', updates);
    console.log('  Timestamp:', new Date().toISOString());
    
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
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ Profile update FAILED');
      console.error('  Error code:', error.code);
      console.error('  Error message:', error.message);
      console.error('  Error details:', error.details);
      console.error('═══════════════════════════════════════════════════════');
      throw error;
    }

    console.log('✅ Profile updated successfully');
    console.log('  Updated data:', data);
    console.log('═══════════════════════════════════════════════════════');

    return data;
  },

  /**
   * Update username (updates both profile and auth metadata)
   */
  async updateUsername(userId: string, username: string): Promise<Profile> {
    console.log('🔵 updateUsername called for userId:', userId, 'new username:', username);
    
    // Update the profile in the database
    const updatedProfile = await this.updateProfile(userId, { username });
    
    // Also update the user metadata in Supabase Auth
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: username,
        },
      });
      
      if (authError) {
        console.warn('⚠️ Failed to update auth metadata:', authError);
        // Don't throw - profile update succeeded, auth metadata update is secondary
      } else {
        console.log('✅ Auth metadata updated successfully');
      }
    } catch (error) {
      console.warn('⚠️ Error updating auth metadata:', error);
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

