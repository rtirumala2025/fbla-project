import { useEffect, useRef, useState } from 'react';

import { useSoundPreferences } from '@/contexts/SoundContext';

export function useSound(initialUrl: string, volume: number = 0.5) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [source, setSource] = useState(initialUrl);
  const { effectsEnabled, toggleEffects, setEffectsEnabled } = useSoundPreferences();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => undefined;
    }
    audioRef.current?.pause();
    audioRef.current = new Audio(source);
    audioRef.current.volume = volume;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [source, volume]);

  const play = () => {
    if (!effectsEnabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => undefined);
  };

  return {
    play,
    enabled: effectsEnabled,
    toggle: toggleEffects,
    setEnabled: setEffectsEnabled,
    setSource,
    source,
  };
}

export function useAmbientMusic(url: string, volume: number = 0.2) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [source, setSource] = useState(url);
  const { ambientEnabled, toggleAmbient, setAmbientEnabled } = useSoundPreferences();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    const audio = new Audio(source);
    audio.loop = true;
    audio.volume = volume;
    if (ambientEnabled) {
      audio.play().catch(() => undefined);
    }
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [ambientEnabled, source, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (ambientEnabled) {
      audio.currentTime = 0;
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [ambientEnabled]);

  const play = () => {
    if (!ambientEnabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => undefined);
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  return {
    play,
    pause,
    enabled: ambientEnabled,
    toggle: toggleAmbient,
    setEnabled: setAmbientEnabled,
    setSource,
    source,
  };
}

