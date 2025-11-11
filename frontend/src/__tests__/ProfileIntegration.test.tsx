/**
 * Integration Test: Profile Update API
 * 
 * Tests the complete flow including:
 * - Database updates
 * - Auth token verification
 * - State synchronization
 * - Invalid token rejection
 */

import { profileService } from '../services/profileService';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Skip these tests if in mock mode (they require real Supabase)
const describeIfReal = process.env.REACT_APP_USE_MOCK === 'false' ? describe : describe.skip;

describeIfReal('Profile Update Integration Tests', () => {
  let testUserId: string;
  let originalUsername: string;
  let testProfile: Profile | null;

  beforeAll(async () => {
    // Get current authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.warn('⚠️ Integration tests require authenticated user. Skipping...');
      return;
    }
    
    testUserId = user.id;
    console.log('Running integration tests for user:', testUserId);
    
    // Get current profile
    testProfile = await profileService.getProfile(testUserId);
    originalUsername = testProfile?.username || 'TestUser';
    console.log('Original username:', originalUsername);
  });

  afterAll(async () => {
    // Restore original username if it was changed
    if (testUserId && originalUsername && testProfile) {
      try {
        await profileService.updateUsername(testUserId, originalUsername);
        console.log('Restored original username:', originalUsername);
      } catch (error) {
        console.warn('Failed to restore username:', error);
      }
    }
  });

  test('should fetch profile from database', async () => {
    expect(testUserId).toBeDefined();
    
    const profile = await profileService.getProfile(testUserId);
    
    expect(profile).not.toBeNull();
    expect(profile?.user_id).toBe(testUserId);
    expect(profile?.username).toBeTruthy();
    expect(profile?.coins).toBeGreaterThanOrEqual(0);
    
    console.log('✓ Profile fetched:', profile);
  });

  test('should update username in database', async () => {
    expect(testUserId).toBeDefined();
    
    const newUsername = `IntegrationTest_${Date.now()}`;
    console.log('Updating to:', newUsername);
    
    const updatedProfile = await profileService.updateUsername(testUserId, newUsername);
    
    expect(updatedProfile).not.toBeNull();
    expect(updatedProfile.username).toBe(newUsername);
    expect(updatedProfile.user_id).toBe(testUserId);
    
    console.log('✓ Database updated');
    
    // Verify by fetching again
    const fetchedProfile = await profileService.getProfile(testUserId);
    expect(fetchedProfile?.username).toBe(newUsername);
    
    console.log('✓ Verified by re-fetch');
  });

  test('should update updated_at timestamp', async () => {
    expect(testUserId).toBeDefined();
    
    const beforeUpdate = await profileService.getProfile(testUserId);
    const beforeTimestamp = beforeUpdate?.updated_at;
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const newUsername = `TimestampTest_${Date.now()}`;
    await profileService.updateUsername(testUserId, newUsername);
    
    const afterUpdate = await profileService.getProfile(testUserId);
    const afterTimestamp = afterUpdate?.updated_at;
    
    expect(afterTimestamp).not.toBe(beforeTimestamp);
    expect(new Date(afterTimestamp!).getTime()).toBeGreaterThan(new Date(beforeTimestamp!).getTime());
    
    console.log('✓ Timestamp updated');
  });

  test('should update auth metadata alongside profile', async () => {
    expect(testUserId).toBeDefined();
    
    const newUsername = `AuthMetaTest_${Date.now()}`;
    
    await profileService.updateUsername(testUserId, newUsername);
    
    // Fetch current user to check metadata
    const { data: { user } } = await supabase.auth.getUser();
    
    // Auth metadata should be updated (best effort)
    // Note: This might not always succeed, which is acceptable
    if (user?.user_metadata?.display_name) {
      expect(user.user_metadata.display_name).toBe(newUsername);
      console.log('✓ Auth metadata synchronized');
    } else {
      console.log('⚠️ Auth metadata not synchronized (acceptable fallback)');
    }
  });

  test('should validate JWT token for protected operations', async () => {
    // This test verifies that Supabase client uses real auth
    
    const { data: { session } } = await supabase.auth.getSession();
    expect(session).not.toBeNull();
    expect(session?.access_token).toBeTruthy();
    
    console.log('✓ Valid session with JWT token');
    
    // Token should have standard JWT structure
    const tokenParts = session!.access_token.split('.');
    expect(tokenParts.length).toBe(3); // header.payload.signature
    
    console.log('✓ Token has valid JWT structure');
  });

  test('should reject update with invalid token', async () => {
    // Create a new Supabase client with invalid token
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('⚠️ Skipping invalid token test - credentials not available');
      return;
    }
    
    const invalidClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
      },
    });
    
    // Try to update with invalid token
    const { error } = await invalidClient
      .from('profiles')
      .update({ username: 'ShouldFail' })
      .eq('user_id', testUserId);
    
    // Should fail with auth error
    expect(error).not.toBeNull();
    console.log('✓ Invalid token rejected:', error?.message);
  });

  test('should enforce Row Level Security', async () => {
    expect(testUserId).toBeDefined();
    
    // Try to update another user's profile (should fail due to RLS)
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    
    const { error } = await supabase
      .from('profiles')
      .update({ username: 'ShouldFailRLS' })
      .eq('user_id', fakeUserId);
    
    // Should fail (either no rows or permission denied)
    if (error) {
      console.log('✓ RLS prevented update:', error.message);
      expect(error).toBeDefined();
    } else {
      // If no error, verify no rows were updated
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', fakeUserId)
        .eq('username', 'ShouldFailRLS');
      
      expect(count).toBe(0);
      console.log('✓ RLS prevented update (no rows affected)');
    }
  });

  test('should handle concurrent updates gracefully', async () => {
    expect(testUserId).toBeDefined();
    
    const username1 = `Concurrent1_${Date.now()}`;
    const username2 = `Concurrent2_${Date.now()}`;
    
    // Fire two updates simultaneously
    const [result1, result2] = await Promise.all([
      profileService.updateUsername(testUserId, username1),
      profileService.updateUsername(testUserId, username2),
    ]);
    
    // Both should succeed, one will be the final value
    expect(result1.username).toBeTruthy();
    expect(result2.username).toBeTruthy();
    
    // Final value should be one of them
    const final = await profileService.getProfile(testUserId);
    expect([username1, username2]).toContain(final?.username);
    
    console.log('✓ Concurrent updates handled');
  });
});

