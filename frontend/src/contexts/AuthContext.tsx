import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, clearAuthTokens, getTokens, setAuthTokens, type AuthTokens, unauthenticatedRequest } from '../api/httpClient';
import { profileService } from '../services/profileService';
import type { Profile } from '../services/profileService';
import { isSupabaseMock } from '@/lib/supabase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  isNewUser: boolean;
  isTransitioning: boolean;
  demoModeAvailable: boolean;
  isDemoModeActive: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkUserProfile: (userId?: string) => Promise<boolean>;
  refreshUserState: () => Promise<void>;
  markUserAsReturning: () => void;
  endTransition: () => void;
  enterDemoMode: (options?: DemoModeOptions) => Promise<void>;
};

type DemoModeOptions = {
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

const DEMO_MODE_STORAGE_KEY = 'virtual-pet.demo-mode';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeJwt = (token: string): { sub?: string; email?: string; exp?: number } => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return {};
    if (typeof window === 'undefined') {
      return {};
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4;
    const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
    const decoded = window.atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode JWT', error);
    return {};
  }
};

const mapProfileToUser = (profile: Profile | null, claims: { sub?: string; email?: string }): User | null => {
  const uid = claims.sub || profile?.user_id;
  if (!uid) {
    return null;
  }
  return {
    uid,
    email: claims.email || null,
    displayName: profile?.username || null,
    avatarUrl: profile?.avatar_url || null,
  };
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const demoModeAvailable = isSupabaseMock();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDemoModeActive, setIsDemoModeActive] = useState(false);

  const persistDemoMode = useCallback((active: boolean) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (active) {
      window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
    }
  }, []);

  const createDemoUser = useCallback((options?: DemoModeOptions): User => {
    const email = options?.email ?? 'demo.user@example.com';
    const displayName =
      options?.displayName ??
      (email ? email.split('@')[0]?.replace(/\W+/g, ' ').trim() || 'Demo Explorer' : 'Demo Explorer');

    return {
      uid: 'demo-user',
      email,
      displayName,
      avatarUrl: options?.avatarUrl ?? 'https://api.dicebear.com/7.x/bottts/png?seed=CompanionDemo',
    };
  }, []);

  const activateDemoUser = useCallback(
    (options?: DemoModeOptions) => {
      const demoUser = createDemoUser(options);
      setCurrentUser(demoUser);
      setIsNewUser(false);
      setIsTransitioning(false);
      setIsDemoModeActive(true);
      setLoading(false);
      persistDemoMode(true);
    },
    [createDemoUser, persistDemoMode],
  );

  const deactivateDemoMode = useCallback(() => {
    setIsDemoModeActive(false);
    persistDemoMode(false);
  }, [persistDemoMode]);

  const hydrateFromTokens = useCallback(async () => {
    const storedTokens = getTokens();
    const storedDemoPreference =
      demoModeAvailable &&
      typeof window !== 'undefined' &&
      window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'true';

    if (!storedTokens?.accessToken) {
      if (demoModeAvailable && storedDemoPreference) {
        activateDemoUser();
        return;
      }

      deactivateDemoMode();
      setCurrentUser(null);
      setIsNewUser(false);
      setLoading(false);
      return;
    }

    try {
      const claims = decodeJwt(storedTokens.accessToken);
      const profile = await profileService.getProfile();
      if (!profile) {
        setIsNewUser(true);
        setCurrentUser(
          mapProfileToUser(null, claims) || {
            uid: claims.sub || 'unknown',
            email: claims.email || null,
            displayName: null,
            avatarUrl: null,
          },
        );
      } else {
        setIsNewUser(false);
        setCurrentUser(mapProfileToUser(profile, claims));
      }
    } catch (error) {
      console.error('Failed to hydrate auth state', error);
      clearAuthTokens();
      setCurrentUser(null);
      setIsNewUser(false);
    } finally {
      setLoading(false);
    }
  }, [activateDemoUser, deactivateDemoMode, demoModeAvailable]);

  useEffect(() => {
    void hydrateFromTokens();
  }, [hydrateFromTokens]);

  const refreshUserState = useCallback(async () => {
    if (isDemoModeActive) {
      activateDemoUser();
      return;
    }

    const activeTokens = getTokens();
    if (!activeTokens?.accessToken) {
      setCurrentUser(null);
      setIsNewUser(false);
      return;
    }

    const claims = decodeJwt(activeTokens.accessToken);
    try {
      const profile = await profileService.getProfile();
      if (!profile) {
        setIsNewUser(true);
        setCurrentUser(mapProfileToUser(null, claims));
      } else {
        setIsNewUser(false);
        setCurrentUser(mapProfileToUser(profile, claims));
      }
    } catch (error) {
      console.error('Failed to refresh user state', error);
      throw error;
    }
  }, [activateDemoUser, isDemoModeActive]);

  const enterDemoMode = useCallback(
    async (options?: DemoModeOptions) => {
      if (!demoModeAvailable) {
        throw new Error('Demo mode is not available without Supabase mock configuration.');
      }
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      activateDemoUser(options);
    },
    [activateDemoUser, demoModeAvailable],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (demoModeAvailable) {
        await enterDemoMode({
          email,
          displayName: email ? email.split('@')[0] : undefined,
        });
        return;
      }

      const response = await unauthenticatedRequest<{
        access_token: string;
        refresh_token: string;
        expires_in?: number;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuthTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
      });

      await refreshUserState();
    },
    [demoModeAvailable, enterDemoMode, refreshUserState],
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (demoModeAvailable) {
        await enterDemoMode({ email, displayName });
        return;
      }

      const response = await unauthenticatedRequest<{
        access_token: string;
        refresh_token: string;
        expires_in?: number;
      }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, username: displayName }),
      });

      const tokens: AuthTokens = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
      };
      setAuthTokens(tokens);

      await profileService.createProfile({ username: displayName });
      await refreshUserState();
    },
    [demoModeAvailable, enterDemoMode, refreshUserState],
  );

  const signInWithGoogle = useCallback(async () => {
    if (demoModeAvailable) {
      await enterDemoMode({
        email: 'demo.google@companion.app',
        displayName: 'Demo Explorer',
      });
      return;
    }

    throw new Error('Google sign-in is not configured for the new authentication system.');
  }, [demoModeAvailable, enterDemoMode]);

  const signOut = useCallback(async () => {
    if (isDemoModeActive || demoModeAvailable) {
      deactivateDemoMode();
      setCurrentUser(null);
      setIsNewUser(false);
      setIsTransitioning(false);
      setLoading(false);
      return;
    }

    try {
      const activeTokens = getTokens();
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: activeTokens?.refreshToken }),
      });
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      clearAuthTokens();
      setCurrentUser(null);
      setIsNewUser(false);
    }
  }, [deactivateDemoMode, demoModeAvailable, isDemoModeActive]);

  const checkUserProfile = useCallback(async (_userId?: string) => {
    if (isDemoModeActive || demoModeAvailable) {
      return false;
    }

    try {
      const profile = await profileService.getProfile();
      return profile === null;
    } catch (error) {
      console.error('Failed to check user profile', error);
      return true;
    }
  }, [demoModeAvailable, isDemoModeActive]);

  const markUserAsReturning = useCallback(() => {
    setIsNewUser(false);
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    if (isTransitioning) {
      setIsTransitioning(false);
    }
  }, [isTransitioning]);

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      loading,
      isNewUser,
      isTransitioning,
      demoModeAvailable,
      isDemoModeActive,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      checkUserProfile,
      refreshUserState,
      markUserAsReturning,
      endTransition,
      enterDemoMode,
    }),
    [
      currentUser,
      loading,
      isNewUser,
      isTransitioning,
      demoModeAvailable,
      isDemoModeActive,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      checkUserProfile,
      refreshUserState,
      markUserAsReturning,
      endTransition,
      enterDemoMode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
