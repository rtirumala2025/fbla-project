import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase, withTimeout } from '../lib/supabase';
import { profileService } from '../services/profileService';
import { petService } from '../services/petService';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { onboardingLogger } from '../utils/onboardingLogger';
import { logger } from '../utils/logger';
import { getEnv } from '../utils/env';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  isNewUser: boolean;
  hasPet: boolean;
  isTransitioning: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkUserProfile: (userId: string) => Promise<{ isNew: boolean; hasPet: boolean }>;
  refreshUserState: () => Promise<void>;
  markUserAsReturning: (hasPetValue?: boolean) => void;
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
  const [hasPet, setHasPet] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const initialSessionLoadedRef = useRef(false);
  const petSubscriptionRef = useRef<any>(null);

  // Helper function to retry pet check with exponential backoff
  const checkPetWithRetry = async (userId: string, maxRetries = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const pet = await petService.getPet(userId);
        return pet !== null;
      } catch (error: any) {
        if (error?.code === 'PGRST116') {
          // No pet found - not an error
          return false;
        }
        
        if (attempt === maxRetries) {
          onboardingLogger.error(`Pet check failed after ${maxRetries} attempts`, error, { userId, maxRetries });
          return false; // Default to no pet on final failure
        }
        
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = 100 * Math.pow(2, attempt - 1);
        onboardingLogger.petRetry(attempt, maxRetries, { userId, delay, error: error?.message });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  };

  // Helper function to check if user has a profile and pet
  const checkUserProfile = useCallback(async (userId: string): Promise<{ isNew: boolean; hasPet: boolean }> => {
    try {
      onboardingLogger.petCheck('Starting user profile check', { userId });
      if (getEnv('USE_MOCK', 'false') === 'true') {
        // In mock mode, assume user has profile and pet
        onboardingLogger.petCheck('Mock mode: returning default values', { userId });
        return { isNew: false, hasPet: true };
      }
      
      const profile = await profileService.getProfile(userId);
      const isNew = profile === null; // true if no profile exists (new user)
      onboardingLogger.petCheck('Profile check complete', { userId, isNew });
      
      // Check for pet existence (always check, regardless of profile status)
      let petExists = false;
      petExists = await checkPetWithRetry(userId);
      onboardingLogger.petCheck('Pet check complete', { userId, hasPet: petExists });
      
      return { isNew, hasPet: petExists };
    } catch (error) {
      onboardingLogger.error('Error checking user profile', error, { userId });
      return { isNew: true, hasPet: false }; // Assume new user if error occurs
    }
  }, []); // checkPetWithRetry is defined above and doesn't need to be in deps

  // Method to refresh user state after profile creation or update
  const refreshUserState = useCallback(async () => {
    onboardingLogger.authInit('Refreshing user state');
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
        
        // Check for pet existence (always check, regardless of profile status)
        let petExists = false;
        petExists = await checkPetWithRetry(session.user.id);
        
        onboardingLogger.authInit('User state refreshed', { userId: session.user.id, isNew, hasPet: petExists, displayName: updatedUser.displayName });
        setIsNewUser(isNew);
        setHasPet(petExists);
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      onboardingLogger.error('Error refreshing user state', error);
    }
  }, []); // checkPetWithRetry is defined above and doesn't need to be in deps

  // Method to directly mark user as not new (after successful profile creation)
  const markUserAsReturning = (hasPetValue?: boolean) => {
    console.log('✅ AuthContext: Marking user as returning (profile exists)', { hasPetValue });
    setIsNewUser(false);
    if (hasPetValue !== undefined) {
      setHasPet(hasPetValue);
    }
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
    onboardingLogger.authInit('Initializing AuthContext', { supabaseInitialized: !!supabase });
    
    // Fallback timeout to ensure loading never gets stuck
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3 second timeout for localhost
    
    // Get initial session - this restores the session from localStorage
    (async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await withTimeout(
          sessionPromise,
          10000,
          'Get initial session'
        ) as any;

        onboardingLogger.authInit('Initial session check', {
          hasSession: !!session,
          userEmail: session?.user?.email || undefined,
          error: error?.message || undefined,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
        });
        
        if (error) {
          logger.error('Error getting session', { error: error.message }, error);
          throw error;
        }
        
        const mappedUser = mapSupabaseUser(session?.user || null);
        onboardingLogger.authInit('Mapped user', { userId: mappedUser?.uid || undefined, email: mappedUser?.email || undefined });
        
        try {
          if (mappedUser) {
            // Check if user has a profile and pet
            const { isNew, hasPet: petExists } = await checkUserProfile(mappedUser.uid);
            onboardingLogger.authInit('Profile check complete', { userId: mappedUser.uid, isNew, hasPet: petExists });
            setIsNewUser(isNew);
            setHasPet(petExists);
          } else {
            setIsNewUser(false);
            setHasPet(false);
          }
        } catch (profileError) {
          logger.error('Error checking user profile during initialization', { userId: mappedUser?.uid }, profileError instanceof Error ? profileError : new Error(String(profileError)));
          onboardingLogger.error('Error checking user profile during initialization', profileError);
          setIsNewUser(false); // Default to not new user if check fails
          setHasPet(false);
        }
        
        setCurrentUser(mappedUser);
        setLoading(false);
        initialSessionLoadedRef.current = true; // Mark initial session as loaded
        clearTimeout(fallbackTimeout); // Clear timeout since we completed successfully
        
        // Set up pet subscription if user exists
        if (mappedUser?.uid && !petSubscriptionRef.current) {
          try {
            onboardingLogger.realtimeEvent('Setting up pet subscription', { userId: mappedUser.uid });
            petSubscriptionRef.current = supabase
              .channel(`pet-changes-${mappedUser.uid}`)
              .on(
                'postgres_changes',
                {
                  event: '*', // INSERT, UPDATE, DELETE
                  schema: 'public',
                  table: 'pets',
                  filter: `user_id=eq.${mappedUser.uid}`,
                },
                async (payload) => {
                  try {
                    onboardingLogger.realtimeEvent('Pet change detected', { eventType: payload.eventType, userId: mappedUser.uid });
                    // Refresh user state when pet changes
                    await refreshUserState();
                  } catch (error) {
                    logger.error('Error refreshing state after pet change', { userId: mappedUser.uid }, error instanceof Error ? error : new Error(String(error)));
                    onboardingLogger.error('Error refreshing state after pet change', error, { userId: mappedUser.uid });
                  }
                }
              )
              .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  logger.info('Pet subscription active', { userId: mappedUser.uid });
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                  logger.error('Pet subscription error', { userId: mappedUser.uid, status });
                }
              });
          } catch (subscriptionError) {
            logger.error('Error setting up pet subscription', { userId: mappedUser.uid }, subscriptionError instanceof Error ? subscriptionError : new Error(String(subscriptionError)));
          }
        }
      } catch (err: any) {
        logger.error('Error in auth initialization', {}, err instanceof Error ? err : new Error(String(err)));
        onboardingLogger.error('Error getting session', err);
        setCurrentUser(null);
        setIsNewUser(false);
        setHasPet(false);
        setLoading(false);
        initialSessionLoadedRef.current = true; // Mark as loaded even on error
        clearTimeout(fallbackTimeout);
      }
    })();

    // Listen for auth changes - this will fire for all auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      onboardingLogger.authStateChange(event, {
        hasSession: !!session,
        userEmail: session?.user?.email || undefined,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
      });
      
      // Ignore INITIAL_SESSION event - we handle initial session via getSession() above
      // This prevents race conditions where onAuthStateChange fires before getSession() completes
      if (event === 'INITIAL_SESSION') {
        onboardingLogger.authStateChange('Skipping INITIAL_SESSION - handled by getSession()');
        return;
      }
      
      // Only process auth state changes after initial session is loaded
      // This prevents clearing the user state before getSession() completes
      if (!initialSessionLoadedRef.current) {
        onboardingLogger.authStateChange('Skipping - initial session not yet loaded');
        return;
      }
      
      const mappedUser = mapSupabaseUser(session?.user || null);
      onboardingLogger.authStateChange('Processing auth state change', { userId: mappedUser?.uid || undefined, email: mappedUser?.email || undefined });
      
      try {
        if (mappedUser) {
          // Check if user has a profile and pet
          const { isNew, hasPet: petExists } = await checkUserProfile(mappedUser.uid);
          onboardingLogger.authStateChange('Profile check complete', { userId: mappedUser.uid, isNew, hasPet: petExists });
          setIsNewUser(isNew);
          setHasPet(petExists);
        } else {
          setIsNewUser(false);
          setHasPet(false);
        }
      } catch (profileError) {
        onboardingLogger.error('Error checking user profile in auth change', profileError);
        setIsNewUser(false); // Default to not new user if check fails
        setHasPet(false);
      }
      
      setCurrentUser(mappedUser);
      setLoading(false);
      
      // Set up or update pet subscription if user exists
      if (mappedUser?.uid) {
        // Clean up existing subscription if user changed
        if (petSubscriptionRef.current) {
          petSubscriptionRef.current.unsubscribe();
          petSubscriptionRef.current = null;
        }
        
        onboardingLogger.realtimeEvent('Setting up pet subscription', { userId: mappedUser.uid });
        petSubscriptionRef.current = supabase
          .channel(`pet-changes-${mappedUser.uid}`)
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'pets',
              filter: `user_id=eq.${mappedUser.uid}`,
            },
            async (payload) => {
              onboardingLogger.realtimeEvent('Pet change detected', { eventType: payload.eventType, userId: mappedUser.uid });
              // Refresh user state when pet changes
              try {
                await refreshUserState();
              } catch (error) {
                onboardingLogger.error('Error refreshing state after pet change', error, { userId: mappedUser.uid });
              }
            }
          )
          .subscribe();
      } else {
        // Clean up subscription if user logged out
        if (petSubscriptionRef.current) {
          onboardingLogger.realtimeEvent('Cleaning up pet subscription - user logged out');
          petSubscriptionRef.current.unsubscribe();
          petSubscriptionRef.current = null;
        }
        
        // Explicitly handle SIGNED_OUT event
        if (event === 'SIGNED_OUT') {
          onboardingLogger.authStateChange('SIGNED_OUT event received - clearing all state');
          setCurrentUser(null);
          setIsNewUser(false);
          setHasPet(false);
          setLoading(false);
        }
      }
    });

    return () => {
      onboardingLogger.authInit('Cleaning up subscriptions');
      subscription.unsubscribe();
      if (petSubscriptionRef.current) {
        petSubscriptionRef.current.unsubscribe();
        petSubscriptionRef.current = null;
      }
    };
  }, [checkUserProfile, refreshUserState]);

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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

  /**
   * Sign in with Google OAuth
   * 
   * Flow:
   * 1. Calls Supabase signInWithOAuth with redirect URL
   * 2. Supabase returns OAuth URL to redirect to
   * 3. User authenticates with Google
   * 4. Google redirects back to /auth/callback
   * 5. AuthCallback component handles the callback
   * 
   * The redirect URL must be configured in:
   * - Supabase Dashboard → Authentication → URL Configuration
   * - For dev: http://localhost:3000/auth/callback
   * - For prod: https://yourdomain.com/auth/callback
   */
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
      // Construct redirect URL based on current origin
      // Works for both development (localhost:3000) and production
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('🔵 AuthContext: Initiating Google OAuth');
      console.log('  Current origin:', window.location.origin);
      console.log('  Redirect URL:', redirectUrl);
      console.log('  Supabase URL:', process.env.REACT_APP_SUPABASE_URL || 'Not configured');
      
      // Check if Supabase is properly configured
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        throw new Error(
          'Supabase is not configured. Please check your environment variables:\n' +
          '- REACT_APP_SUPABASE_URL\n' +
          '- REACT_APP_SUPABASE_ANON_KEY\n' +
          '\nAlso ensure Google OAuth is enabled in Supabase Dashboard.'
        );
      }
      
      // Use redirect flow (not popup) for Google OAuth
      // Supabase v2 best practice: Use redirect flow for OAuth
      // - skipBrowserRedirect: false (default) uses redirect flow
      // - Supabase automatically handles URL hash processing with detectSessionInUrl: true
      // - Manual hash processing or setSession() causes 401 errors and must be avoided
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // skipBrowserRedirect defaults to false (redirect flow)
          // Explicitly set to false to ensure redirect flow (not popup)
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('❌ Google sign-in error:', error);
        console.error('  Error code:', error.status);
        console.error('  Error message:', error.message);
        
        // Provide helpful error messages
        if (error.message.includes('redirect')) {
          throw new Error(
            'OAuth redirect URL mismatch. Please ensure:\n' +
            `1. Redirect URL "${redirectUrl}" is added in Supabase Dashboard → Authentication → URL Configuration\n` +
            '2. Google OAuth provider is enabled in Supabase Dashboard → Authentication → Providers\n' +
            '3. Google Cloud Console redirect URI matches: https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/callback'
          );
        }
        
        throw new Error(error.message || 'Google sign-in failed');
      }

      if (data?.url) {
        console.log('✅ Received OAuth URL from Supabase');
        console.log('  OAuth URL preview:', data.url.substring(0, 100) + '...');
        console.log('  Redirecting to Google OAuth consent screen...');
        window.location.href = data.url;
      } else {
        console.error('❌ No redirect URL received from Supabase');
        console.error('  Response data:', data);
        console.error('  Supabase client:', supabase ? 'initialized' : 'NOT initialized');
        
        throw new Error(
          'No redirect URL received from Supabase. This usually means:\n' +
          '1. Google OAuth is not enabled in Supabase Dashboard → Authentication → Providers\n' +
          '2. Redirect URL is not configured in Supabase Dashboard → Authentication → URL Configuration\n' +
          `3. Please add "${redirectUrl}" to your allowed redirect URLs in Supabase`
        );
      }
    } catch (err: any) {
      console.error('❌ Google sign-in failed:', err);
      throw new Error(err.message || 'Google sign-in failed');
    }
  };

  const signOut = async () => {
    try {
      // Mock sign out for development
      if (getEnv('USE_MOCK', 'false') === 'true') {
        setCurrentUser(null);
        setIsNewUser(false);
        setHasPet(false);
        setLoading(false);
        return;
      }

      // Clear pet subscription before signing out
      if (petSubscriptionRef.current) {
        onboardingLogger.realtimeEvent('Cleaning up pet subscription before sign out');
        petSubscriptionRef.current.unsubscribe();
        petSubscriptionRef.current = null;
      }

      // Clear state immediately to prevent UI flicker
      setCurrentUser(null);
      setIsNewUser(false);
      setHasPet(false);
      setLoading(false);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Even if signOut fails, we've cleared local state
        // Log the error but don't throw - user is already logged out locally
        onboardingLogger.error('Supabase signOut error (non-blocking)', error);
      }

      // Clear any cached tokens
      const { clearAuthTokens } = await import('../api/httpClient');
      clearAuthTokens();

      // Clear any cached data
      const { requestCache } = await import('../utils/requestCache');
      requestCache.clearAll();
    } catch (error) {
      // Ensure state is cleared even if there's an error
      setCurrentUser(null);
      setIsNewUser(false);
      setHasPet(false);
      setLoading(false);
      onboardingLogger.error('Error during sign out', error);
      // Don't throw - user should still be able to navigate away
    }
  };

  const value = {
    currentUser,
    loading,
    isNewUser,
    hasPet,
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
