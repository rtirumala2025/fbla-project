/**
 * Sound Context
 * Manages sound effects and ambient sound preferences
 * Uses Supabase user_preferences table instead of localStorage
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseMock } from '../lib/supabase';

type SoundContextValue = {
  effectsEnabled: boolean;
  ambientEnabled: boolean;
  toggleEffects: () => void;
  toggleAmbient: () => void;
  setEffectsEnabled: (enabled: boolean) => void;
  setAmbientEnabled: (enabled: boolean) => void;
};

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [effectsEnabled, setEffectsEnabledState] = useState<boolean>(true);
  const [ambientEnabled, setAmbientEnabledState] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load sound preferences from Supabase user_preferences table
  useEffect(() => {
    const loadSoundPreferences = async () => {
      if (isSupabaseMock()) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          // No user logged in - use defaults
          setIsLoading(false);
          return;
        }

        const userId = session.user.id;

        const { data: prefs, error } = await supabase
          .from('user_preferences')
          .select('sound, music')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to load sound preferences:', error);
          setIsLoading(false);
          return;
        }

        if (prefs) {
          // user_preferences has 'sound' and 'music' columns
          // Map 'sound' to effectsEnabled and 'music' to ambientEnabled
          setEffectsEnabledState(prefs.sound ?? true);
          setAmbientEnabledState(prefs.music ?? true);
        }
      } catch (error) {
        console.error('Error loading sound preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSoundPreferences();
  }, []);

  // Sync sound preferences to Supabase when they change
  const setEffectsEnabled = async (enabled: boolean) => {
    setEffectsEnabledState(enabled);
    
    if (!isSupabaseMock() && !isLoading) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const userId = session.user.id;
          
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: userId,
              sound: enabled,
            }, {
              onConflict: 'user_id',
            });
        }
      } catch (error) {
        console.error('Failed to save sound preferences:', error);
      }
    }
  };

  const setAmbientEnabled = async (enabled: boolean) => {
    setAmbientEnabledState(enabled);
    
    if (!isSupabaseMock() && !isLoading) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const userId = session.user.id;
          
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: userId,
              music: enabled,
            }, {
              onConflict: 'user_id',
            });
        }
      } catch (error) {
        console.error('Failed to save ambient sound preferences:', error);
      }
    }
  };

  const value = useMemo<SoundContextValue>(
    () => ({
      effectsEnabled,
      ambientEnabled,
      toggleEffects: () => setEffectsEnabled(!effectsEnabled),
      toggleAmbient: () => setAmbientEnabled(!ambientEnabled),
      setEffectsEnabled,
      setAmbientEnabled,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectsEnabled, ambientEnabled],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSoundPreferences = (): SoundContextValue => {
  const context = useContext(SoundContext);
  if (!context) {
    // Return defaults instead of throwing - allows usage without provider
    console.warn('useSoundPreferences used without SoundProvider, using defaults');
    return {
      effectsEnabled: true,
      ambientEnabled: true,
      toggleEffects: () => {},
      toggleAmbient: () => {},
      setEffectsEnabled: () => {},
      setAmbientEnabled: () => {},
    };
  }
  return context;
};

