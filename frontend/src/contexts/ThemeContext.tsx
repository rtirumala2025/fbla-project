/**
 * Theme Context
 * Manages light/dark theme and color blind mode preferences
 * Removed localStorage - preferences stored in component state
 * Future: Will sync to Supabase user_preferences table when table is extended with theme/color_blind_mode columns
 */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  colorBlindMode: boolean;
  toggleTheme: () => void;
  toggleColorBlindMode: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getSystemPreference = (): Theme => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Removed localStorage - using component state only
  // Preferences are ephemeral per session until Supabase table is extended
  const [theme, setThemeState] = useState<Theme>(getSystemPreference());
  const [colorBlindMode, setColorBlindModeState] = useState<boolean>(false);

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
    // TODO: Sync to Supabase user_preferences table when table is extended with theme column
  }, []);

  const setColorBlindMode = useCallback((newMode: boolean) => {
    setColorBlindModeState(newMode);
    // TODO: Sync to Supabase user_preferences table when table is extended with color_blind_mode column
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const toggleColorBlindMode = useCallback(() => {
    setColorBlindMode(!colorBlindMode);
  }, [colorBlindMode, setColorBlindMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colorBlindMode,
      toggleTheme,
      toggleColorBlindMode,
      setTheme,
    }),
    [theme, colorBlindMode, toggleTheme, toggleColorBlindMode, setTheme],
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

