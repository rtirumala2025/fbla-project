/**
 * Tests for useSound hook
 */
import { renderHook, act } from '@testing-library/react';
import { useSound, useAmbientMusic } from '../../hooks/useSound';
import { useSoundPreferences } from '../../contexts/SoundContext';

// Mock SoundContext
jest.mock('../../contexts/SoundContext', () => ({
  useSoundPreferences: jest.fn(),
}));

// Mock Audio
const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn();

global.Audio = jest.fn().mockImplementation(() => ({
  play: mockPlay,
  pause: mockPause,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  volume: 0.5,
  loop: false,
})) as any;

describe('useSound', () => {
  const mockSoundPreferences = {
    effectsEnabled: true,
    ambientEnabled: true,
    toggleEffects: jest.fn(),
    toggleAmbient: jest.fn(),
    setEffectsEnabled: jest.fn(),
    setAmbientEnabled: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSoundPreferences as jest.Mock).mockReturnValue(mockSoundPreferences);
    mockPlay.mockResolvedValue(undefined);
  });

  it('should create audio element with initial URL and volume', () => {
    renderHook(() => useSound('/test-sound.mp3', 0.7));

    expect(global.Audio).toHaveBeenCalledWith('/test-sound.mp3');
  });

  it('should play sound when effects are enabled', () => {
    mockSoundPreferences.effectsEnabled = true;

    const { result } = renderHook(() => useSound('/test-sound.mp3'));

    act(() => {
      result.current.play();
    });

    expect(mockPlay).toHaveBeenCalled();
  });

  it('should not play sound when effects are disabled', () => {
    mockSoundPreferences.effectsEnabled = false;

    const { result } = renderHook(() => useSound('/test-sound.mp3'));

    act(() => {
      result.current.play();
    });

    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('should reset currentTime to 0 before playing', () => {
    const audioInstance = {
      play: mockPlay,
      pause: mockPause,
      currentTime: 5,
      volume: 0.5,
    };

    (global.Audio as jest.Mock).mockReturnValue(audioInstance);

    const { result } = renderHook(() => useSound('/test-sound.mp3'));

    act(() => {
      result.current.play();
    });

    expect(audioInstance.currentTime).toBe(0);
    expect(mockPlay).toHaveBeenCalled();
  });

  it('should update source when setSource is called', () => {
    const { result } = renderHook(() => useSound('/initial-sound.mp3'));

    act(() => {
      result.current.setSource('/new-sound.mp3');
    });

    expect(result.current.source).toBe('/new-sound.mp3');
    expect(global.Audio).toHaveBeenCalledWith('/new-sound.mp3');
  });

  it('should return sound preferences', () => {
    const { result } = renderHook(() => useSound('/test-sound.mp3'));

    expect(result.current.enabled).toBe(true);
    expect(result.current.toggle).toBe(mockSoundPreferences.toggleEffects);
    expect(result.current.setEnabled).toBe(mockSoundPreferences.setEffectsEnabled);
  });

  it('should handle play errors gracefully', async () => {
    const error = new Error('Play failed');
    mockPlay.mockRejectedValue(error);

    const { result } = renderHook(() => useSound('/test-sound.mp3'));

    await act(async () => {
      await result.current.play();
    });

    // Should not throw
    expect(mockPlay).toHaveBeenCalled();
  });
});

describe('useAmbientMusic', () => {
  const mockSoundPreferences = {
    effectsEnabled: true,
    ambientEnabled: true,
    toggleEffects: jest.fn(),
    toggleAmbient: jest.fn(),
    setEffectsEnabled: jest.fn(),
    setAmbientEnabled: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSoundPreferences as jest.Mock).mockReturnValue(mockSoundPreferences);
    mockPlay.mockResolvedValue(undefined);
  });

  it('should create audio element with loop enabled', () => {
    const audioInstance = {
      play: mockPlay,
      pause: mockPause,
      currentTime: 0,
      volume: 0.2,
      loop: false,
    };

    (global.Audio as jest.Mock).mockReturnValue(audioInstance);

    renderHook(() => useAmbientMusic('/ambient.mp3', 0.3));

    expect(global.Audio).toHaveBeenCalledWith('/ambient.mp3');
    expect(audioInstance.loop).toBe(true);
    expect(audioInstance.volume).toBe(0.3);
  });

  it('should play music when ambient is enabled', () => {
    mockSoundPreferences.ambientEnabled = true;

    renderHook(() => useAmbientMusic('/ambient.mp3'));

    expect(mockPlay).toHaveBeenCalled();
  });

  it('should not play music when ambient is disabled', () => {
    mockSoundPreferences.ambientEnabled = false;

    renderHook(() => useAmbientMusic('/ambient.mp3'));

    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('should pause music when pause is called', () => {
    const { result } = renderHook(() => useAmbientMusic('/ambient.mp3'));

    act(() => {
      result.current.pause();
    });

    expect(mockPause).toHaveBeenCalled();
  });

  it('should toggle play/pause based on ambient enabled state', () => {
    const audioInstance = {
      play: mockPlay,
      pause: mockPause,
      currentTime: 0,
      volume: 0.2,
      loop: true,
    };

    (global.Audio as jest.Mock).mockReturnValue(audioInstance);

    const { rerender } = renderHook(
      ({ enabled }) => useAmbientMusic('/ambient.mp3'),
      { initialProps: { enabled: true } }
    );

    expect(mockPlay).toHaveBeenCalled();

    mockSoundPreferences.ambientEnabled = false;
    rerender({ enabled: false });

    expect(mockPause).toHaveBeenCalled();
  });

  it('should update source when setSource is called', () => {
    const { result } = renderHook(() => useAmbientMusic('/initial-ambient.mp3'));

    act(() => {
      result.current.setSource('/new-ambient.mp3');
    });

    expect(result.current.source).toBe('/new-ambient.mp3');
  });
});
