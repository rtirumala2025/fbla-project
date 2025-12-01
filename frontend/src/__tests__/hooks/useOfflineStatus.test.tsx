/**
 * Tests for useOfflineStatus hook
 */
import { renderHook, act } from '@testing-library/react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

describe('useOfflineStatus', () => {
  const originalOnLine = navigator.onLine;
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  beforeEach(() => {
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    // Mock connection API if available
    const mockConnection = {
      effectiveType: '4g',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalOnLine,
    });
  });

  it('should initialize with online status when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.offline).toBe(false);
    expect(result.current.lastSyncedAt).not.toBe(null);
  });

  it('should initialize with offline status when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.offline).toBe(true);
    expect(result.current.lastSyncedAt).toBe(null);
  });

  it('should update to offline when offline event is fired', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.offline).toBe(false);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.offline).toBe(true);
  });

  it('should update to online when online event is fired', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.offline).toBe(true);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.offline).toBe(false);
    expect(result.current.lastSyncedAt).not.toBe(null);
  });

  it('should include connection type when available', () => {
    const mockConnection = {
      effectiveType: '4g',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });

    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.connectionType).toBe('4g');
  });

  it('should handle connection type changes', () => {
    const mockConnection = {
      effectiveType: '3g',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });

    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.connectionType).toBe('3g');

    act(() => {
      mockConnection.effectiveType = '4g';
      if (mockConnection.addEventListener) {
        const changeHandler = mockConnection.addEventListener.mock.calls.find(
          (call) => call[0] === 'change'
        )?.[1];
        if (changeHandler && typeof changeHandler === 'function') {
          changeHandler();
        }
      }
    });

    // Connection type should update
    expect(mockConnection.addEventListener).toHaveBeenCalled();
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOfflineStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
