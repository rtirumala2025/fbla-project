import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SoundContextValue = {
  effectsEnabled: boolean;
  ambientEnabled: boolean;
  toggleEffects: () => void;
  toggleAmbient: () => void;
  setEffectsEnabled: (enabled: boolean) => void;
  setAmbientEnabled: (enabled: boolean) => void;
};

const effectsStorageKey = 'virtual-pet-sound-effects';
const ambientStorageKey = 'virtual-pet-ambient';

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

const readStoredBoolean = (key: string, fallback: boolean): boolean => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return raw === 'true';
  } catch (error) {
    console.warn(`[SoundContext] Failed to read ${key} from storage`, error);
    return fallback;
  }
};

const persistBoolean = (key: string, value: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value.toString());
  } catch (error) {
    console.warn(`[SoundContext] Failed to persist ${key}`, error);
  }
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [effectsEnabled, setEffectsEnabledState] = useState<boolean>(() => readStoredBoolean(effectsStorageKey, true));
  const [ambientEnabled, setAmbientEnabledState] = useState<boolean>(() => readStoredBoolean(ambientStorageKey, true));

  useEffect(() => {
    persistBoolean(effectsStorageKey, effectsEnabled);
  }, [effectsEnabled]);

  useEffect(() => {
    persistBoolean(ambientStorageKey, ambientEnabled);
  }, [ambientEnabled]);

  const value = useMemo<SoundContextValue>(
    () => ({
      effectsEnabled,
      ambientEnabled,
      toggleEffects: () => setEffectsEnabledState((previous) => !previous),
      toggleAmbient: () => setAmbientEnabledState((previous) => !previous),
      setEffectsEnabled: setEffectsEnabledState,
      setAmbientEnabled: setAmbientEnabledState,
    }),
    [effectsEnabled, ambientEnabled],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSoundPreferences = (): SoundContextValue => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundPreferences must be used within a SoundProvider');
  }
  return context;
};
