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

const STORAGE_KEY_THEME = 'app_theme';
const STORAGE_KEY_COLOR_BLIND = 'app_color_blind_mode';

const getSystemPreference = (): Theme => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return null;
};

const getStoredColorBlindMode = (): boolean | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY_COLOR_BLIND);
  if (stored === 'true') return true;
  if (stored === 'false') return false;
  return null;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() || getSystemPreference());
  const [colorBlindMode, setColorBlindModeState] = useState<boolean>(() => getStoredColorBlindMode() || false);
  const [loading, setLoading] = useState(true);
  const isInitialLoadRef = useRef(true);
  const isSavingRef = useRef(false);

  // Load preferences from Supabase on mount or when user changes
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser?.uid) {
        // Not authenticated - use localStorage
        const storedTheme = getStoredTheme();
        const storedColorBlind = getStoredColorBlindMode();
        
        if (storedTheme) {
          setThemeState(storedTheme);
        }
        if (storedColorBlind !== null) {
          setColorBlindModeState(storedColorBlind);
        }
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
          // Fallback to localStorage
          const storedTheme = getStoredTheme();
          const storedColorBlind = getStoredColorBlindMode();
          if (storedTheme) setThemeState(storedTheme);
          if (storedColorBlind !== null) setColorBlindModeState(storedColorBlind);
        } else if (data) {
          // Load from Supabase
          if (data.theme === 'light' || data.theme === 'dark') {
            setThemeState(data.theme);
            localStorage.setItem(STORAGE_KEY_THEME, data.theme);
          }
          if (typeof data.color_blind_mode === 'boolean') {
            setColorBlindModeState(data.color_blind_mode);
            localStorage.setItem(STORAGE_KEY_COLOR_BLIND, String(data.color_blind_mode));
          }
        } else {
          // No preferences found - use localStorage or defaults
          const storedTheme = getStoredTheme();
          const storedColorBlind = getStoredColorBlindMode();
          if (storedTheme) setThemeState(storedTheme);
          if (storedColorBlind !== null) setColorBlindModeState(storedColorBlind);
        }
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
        // Fallback to localStorage
        const storedTheme = getStoredTheme();
        const storedColorBlind = getStoredColorBlindMode();
        if (storedTheme) setThemeState(storedTheme);
        if (storedColorBlind !== null) setColorBlindModeState(storedColorBlind);
      } finally {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    };

    loadPreferences();
  }, [currentUser?.uid]);

  // Save preferences to Supabase or localStorage
  const savePreferences = useCallback(async (newTheme: Theme, newColorBlindMode: boolean) => {
    // Always update localStorage for immediate persistence
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    localStorage.setItem(STORAGE_KEY_COLOR_BLIND, String(newColorBlindMode));

    // If authenticated, also save to Supabase
    if (currentUser?.uid && !isSavingRef.current) {
      isSavingRef.current = true;
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert(
            {
              user_id: currentUser.uid,
              theme: newTheme,
              color_blind_mode: newColorBlindMode,
            },
            {
              onConflict: 'user_id',
            }
          );

        if (error) {
          console.warn('Failed to save theme preferences to Supabase:', error);
          // Preferences are still saved in localStorage, so continue
        }
      } catch (error) {
        console.error('Error saving theme preferences:', error);
      } finally {
        isSavingRef.current = false;
      }
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
    setThemeState(newTheme);
    if (!isInitialLoadRef.current) {
      savePreferences(newTheme, colorBlindMode);
    }
  }, [colorBlindMode, savePreferences]);

  const setColorBlindMode = useCallback((newMode: boolean) => {
    setColorBlindModeState(newMode);
    if (!isInitialLoadRef.current) {
      savePreferences(theme, newMode);
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

