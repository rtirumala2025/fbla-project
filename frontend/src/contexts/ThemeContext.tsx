import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  colorBlindMode: boolean;
  toggleTheme: () => void;
  toggleColorBlindMode: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'virtual-pet-theme';
const COLOR_BLIND_STORAGE_KEY = 'virtual-pet-colorblind';

const getSystemPreference = (): Theme => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      return storedTheme ?? getSystemPreference();
    } catch {
      return 'light';
    }
  });
  const [colorBlindMode, setColorBlindMode] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem(COLOR_BLIND_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (colorBlindMode) {
      root.classList.add('color-blind');
    } else {
      root.classList.remove('color-blind');
    }
    window.localStorage.setItem(COLOR_BLIND_STORAGE_KEY, colorBlindMode.toString());
  }, [colorBlindMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handler = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colorBlindMode,
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
      toggleColorBlindMode: () => setColorBlindMode((current) => !current),
      setTheme,
    }),
    [theme, colorBlindMode],
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

