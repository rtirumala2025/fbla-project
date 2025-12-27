/**
 * Theme Context
 * Manages light/dark theme and color blind mode preferences
 * Persists preferences to Supabase user_preferences table when authenticated
 * Falls back to localStorage for unauthenticated users
 */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  colorBlindMode: boolean;
  toggleTheme: () => void;
  toggleColorBlindMode: () => void;
  setTheme: (theme: Theme) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getSystemPreference = (): Theme => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => getSystemPreference());
  const [colorBlindMode, setColorBlindModeState] = useState<boolean>(() => false);
  const [loading, setLoading] = useState(true);
  const isInitialLoadRef = useRef(true);
  const isSavingRef = useRef(false);

  // Load preferences from Supabase on mount or when user changes
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser?.uid) {
        // Not authenticated - use defaults only (no localStorage)
        setThemeState(getSystemPreference());
        setColorBlindModeState(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme, color_blind_mode')
          .eq('user_id', currentUser.uid)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows, which is okay (first time user)
          console.warn('Error loading theme preferences:', error);
          // Fallback to defaults only
          setThemeState(getSystemPreference());
          setColorBlindModeState(false);
        } else if (data) {
          // Load from Supabase
          if (data.theme === 'light' || data.theme === 'dark') {
            setThemeState(data.theme);
          }
          if (typeof data.color_blind_mode === 'boolean') {
            setColorBlindModeState(data.color_blind_mode);
          }
        } else {
          // No preferences found - use defaults
          setThemeState(getSystemPreference());
          setColorBlindModeState(false);
        }
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
        // Fallback to defaults
        setThemeState(getSystemPreference());
        setColorBlindModeState(false);
      } finally {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    };

    loadPreferences();
  }, [currentUser?.uid]);

  // Save preferences to Supabase only. If save fails, revert UI state.
  const savePreferences = useCallback(async (prev: { theme: Theme; colorBlindMode: boolean }, next: { theme: Theme; colorBlindMode: boolean }) => {
    if (!currentUser?.uid || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: currentUser.uid,
            theme: next.theme,
            color_blind_mode: next.colorBlindMode,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.warn('Failed to save theme preferences to Supabase:', error);
        setThemeState(prev.theme);
        setColorBlindModeState(prev.colorBlindMode);
      }
    } catch (error) {
      console.error('Error saving theme preferences:', error);
      setThemeState(prev.theme);
      setColorBlindModeState(prev.colorBlindMode);
    } finally {
      isSavingRef.current = false;
    }
  }, [currentUser?.uid]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Apply color blind mode to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (colorBlindMode) {
      root.classList.add('color-blind');
    } else {
      root.classList.remove('color-blind');
    }
  }, [colorBlindMode]);

  const setTheme = useCallback((newTheme: Theme) => {
    const prev = { theme, colorBlindMode };
    setThemeState(newTheme);
    if (!isInitialLoadRef.current) {
      savePreferences(prev, { theme: newTheme, colorBlindMode });
    }
  }, [colorBlindMode, savePreferences, theme]);

  const setColorBlindMode = useCallback((newMode: boolean) => {
    const prev = { theme, colorBlindMode };
    setColorBlindModeState(newMode);
    if (!isInitialLoadRef.current) {
      savePreferences(prev, { theme, colorBlindMode: newMode });
    }
  }, [theme, savePreferences]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  const toggleColorBlindMode = useCallback(() => {
    const newMode = !colorBlindMode;
    setColorBlindMode(newMode);
  }, [colorBlindMode, setColorBlindMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colorBlindMode,
      toggleTheme,
      toggleColorBlindMode,
      setTheme,
      loading,
    }),
    [theme, colorBlindMode, toggleTheme, toggleColorBlindMode, setTheme, loading],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

