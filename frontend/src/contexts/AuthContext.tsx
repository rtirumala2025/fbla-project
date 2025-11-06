import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/profileService';
import { withTimeout, isNetworkError } from '../utils/authHelpers';
import type { User as SupabaseUser, AuthResponse, OAuthResponse } from '@supabase/supabase-js';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  isNewUser: boolean;
  isTransitioning: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkUserProfile: (userId: string) => Promise<boolean>;
  refreshUserState: () => Promise<void>;
  markUserAsReturning: () => void;
  endTransition: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to convert Supabase user to our User type
const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;
  
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email || null,
    displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Helper function to check if user has a profile
  const checkUserProfile = async (userId: string): Promise<boolean> => {
    try {
      if (process.env.REACT_APP_USE_MOCK === 'true') {
        // In mock mode, assume user has profile
        return false;
      }
      
      // Add timeout to profile check (10 seconds)
      const profile = await withTimeout(
        profileService.getProfile(userId),
        10000,
        'Profile check timed out'
      );
      
      return profile === null; // true if no profile exists (new user)
    } catch (error) {
      console.error('Error checking user profile:', error);
      
      // On network timeout, assume profile exists (safer default)
      if (isNetworkError(error)) {
        console.warn('Network error during profile check, assuming profile exists');
        return false;
      }
      
      return true; // Assume new user if other error occurs
    }
  };

  // Method to refresh user state after profile creation or update
  const refreshUserState = async () => {
    console.log('🔄 AuthContext: Refreshing user state...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch the latest profile data from the database
        const profile = await profileService.getProfile(session.user.id);
        
        // Create updated user object with latest username from profile
        const updatedUser: User = {
          uid: session.user.id,
          email: session.user.email || null,
          displayName: profile?.username || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || null,
        };
        
        const isNew = profile === null;
          console.log('🔄 AuthContext: Refreshed - isNewUser:', isNew);
        console.log('🔄 AuthContext: Updated displayName from profile:', updatedUser.displayName);
          setIsNewUser(isNew);
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user state:', error);
    }
  };

  // Method to directly mark user as not new (after successful profile creation)
  const markUserAsReturning = () => {
    console.log('✅ AuthContext: Marking user as returning (profile exists)');
    setIsNewUser(false);
    setIsTransitioning(true);
  };

  // Method to end transition window after navigation completes
  const endTransition = () => {
    if (isTransitioning) {
      console.log('✅ AuthContext: Ending transition window');
      setIsTransitioning(false);
    }
  };

  useEffect(() => {
    console.log('🔵 AuthContext: Initializing...');
    console.log('🔵 AuthContext: Supabase client:', supabase ? 'initialized' : 'NOT initialized');
    
    // Fallback timeout to ensure loading never gets stuck
    const fallbackTimeout = setTimeout(() => {
      console.warn('⏰ AuthContext: Fallback timeout - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }: { data: { session: any }, error: any }) => {
      console.log('🔵 AuthContext: Initial session check');
      console.log('  Session exists:', !!session);
      console.log('  User email:', session?.user?.email || 'No user');
      console.log('  Session error:', error?.message || 'none');
      console.log('  Session expires at:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A');
      
      const mappedUser = mapSupabaseUser(session?.user || null);
      console.log('  Mapped user:', mappedUser?.email || 'null');
      
      try {
        if (mappedUser) {
          // Check if user has a profile
          const isNew = await checkUserProfile(mappedUser.uid);
          console.log('  Is new user:', isNew);
          setIsNewUser(isNew);
        } else {
          setIsNewUser(false);
        }
      } catch (profileError) {
        console.error('❌ Error checking user profile:', profileError);
        setIsNewUser(false); // Default to not new user if check fails
      }
      
      setCurrentUser(mappedUser);
      setLoading(false);
      clearTimeout(fallbackTimeout); // Clear timeout since we completed successfully
    }).catch((err: any) => {
      console.error('❌ Error getting session:', err);
      setCurrentUser(null);
      setIsNewUser(false);
      setLoading(false);
      clearTimeout(fallbackTimeout); // Clear timeout since we completed (with error)
    });

    // Listen for auth changes - this will fire for all auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('🔵 AuthContext: Auth state change detected');
      console.log('  Event type:', event);
      console.log('  Has session:', !!session);
      console.log('  User email:', session?.user?.email || 'none');
      console.log('  Session expires at:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A');
      
      const mappedUser = mapSupabaseUser(session?.user || null);
      console.log('  Setting user:', mappedUser?.email || 'null');
      
      try {
        if (mappedUser) {
          // Check if user has a profile
          const isNew = await checkUserProfile(mappedUser.uid);
          console.log('  Is new user:', isNew);
          setIsNewUser(isNew);
        } else {
          setIsNewUser(false);
        }
      } catch (profileError) {
        console.error('❌ Error checking user profile in auth change:', profileError);
        setIsNewUser(false); // Default to not new user if check fails
      }
      
      setCurrentUser(mappedUser);
      setLoading(false);
    });

    return () => {
      console.log('🔵 AuthContext: Cleaning up subscription');
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock authentication for development
    if (process.env.REACT_APP_USE_MOCK === 'true') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock user
      const mockUser = {
        uid: 'mock-user-123',
        email: email,
        displayName: email.split('@')[0],
      };
      
      setCurrentUser(mockUser);
      return;
    }

    // Add timeout wrapper (15 seconds)
    const authResponse = await withTimeout<AuthResponse>(
      supabase.auth.signInWithPassword({
      email,
      password,
      }),
      15000,
      'Sign-in request timed out. Please check your internet connection.'
    );
    
    const { data, error } = authResponse;

    if (error) {
      throw new Error(error.message);
    }

    setCurrentUser(mapSupabaseUser(data.user));
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    // Mock authentication for development
    if (process.env.REACT_APP_USE_MOCK === 'true') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock user
      const mockUser = {
        uid: `mock-user-${Date.now()}`,
        email: email,
        displayName: displayName || email.split('@')[0],
      };
      
      setCurrentUser(mockUser);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        username: displayName,
        coins: 100, // Starting coins
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    setCurrentUser(mapSupabaseUser(data.user));
  };

  const signInWithGoogle = async () => {
    console.log('🔵 AuthContext: Google sign-in initiated');
    
    // Mock authentication for development
    if (process.env.REACT_APP_USE_MOCK === 'true') {
      console.log('🔧 Mock mode: Simulating Google sign-in');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock user
      const mockUser = {
        uid: 'mock-google-user-123',
        email: 'mockuser@gmail.com',
        displayName: 'Mock Google User',
      };
      
      setCurrentUser(mockUser);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('🔵 AuthContext: Redirecting to Google OAuth');
      console.log('  Redirect URL:', redirectUrl);
      
      // Add timeout to OAuth initiation (10 seconds)
      const oauthResponse = await withTimeout<OAuthResponse>(
        supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
        }),
        10000,
        'Google sign-in request timed out. Please check your internet connection.'
      );
      
      const { data, error } = oauthResponse;

      if (error) {
        console.error('❌ Google sign-in error:', error);
        throw new Error(error.message);
      }

      if (data?.url) {
        console.log('✅ Redirecting to Google OAuth URL');
        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL received from Supabase');
      }
    } catch (err: any) {
      console.error('❌ Google sign-in failed:', err);
      throw new Error(err.message || 'Google sign-in failed');
    }
  };

  const signOut = async () => {
    // Mock sign out for development
    if (process.env.REACT_APP_USE_MOCK === 'true') {
      setCurrentUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    isNewUser,
    isTransitioning,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    checkUserProfile,
    refreshUserState,
    markUserAsReturning,
    endTransition,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
