/**
 * Tests for useAuthActions hook
 */
import { renderHook } from '@testing-library/react';
import { useAuthActions } from '../../hooks/useAuthActions';
import { useAuth } from '../../contexts/AuthContext';

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('useAuthActions', () => {
  const mockAuthActions = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signInWithGoogle: jest.fn(),
    refreshUserState: jest.fn(),
    markUserAsReturning: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(mockAuthActions);
  });

  it('should return all auth actions from context', () => {
    const { result } = renderHook(() => useAuthActions());

    expect(result.current.signIn).toBe(mockAuthActions.signIn);
    expect(result.current.signUp).toBe(mockAuthActions.signUp);
    expect(result.current.signOut).toBe(mockAuthActions.signOut);
    expect(result.current.signInWithGoogle).toBe(mockAuthActions.signInWithGoogle);
    expect(result.current.refreshUserState).toBe(mockAuthActions.refreshUserState);
    expect(result.current.markUserAsReturning).toBe(mockAuthActions.markUserAsReturning);
  });

  it('should call signIn when invoked', () => {
    const { result } = renderHook(() => useAuthActions());

    result.current.signIn('test@example.com', 'password');

    expect(mockAuthActions.signIn).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should call signUp when invoked', () => {
    const { result } = renderHook(() => useAuthActions());

    result.current.signUp('test@example.com', 'password', 'username');

    expect(mockAuthActions.signUp).toHaveBeenCalledWith('test@example.com', 'password', 'username');
  });

  it('should call signOut when invoked', () => {
    const { result } = renderHook(() => useAuthActions());

    result.current.signOut();

    expect(mockAuthActions.signOut).toHaveBeenCalled();
  });

  it('should call signInWithGoogle when invoked', () => {
    const { result } = renderHook(() => useAuthActions());

    result.current.signInWithGoogle();

    expect(mockAuthActions.signInWithGoogle).toHaveBeenCalled();
  });

  it('should call refreshUserState when invoked', () => {
    const { result } = renderHook(() => useAuthActions());

    result.current.refreshUserState();

    expect(mockAuthActions.refreshUserState).toHaveBeenCalled();
  });

  it('should call markUserAsReturning when invoked', () => {
    const { result } = renderHook(() => useAuthActions());

    result.current.markUserAsReturning();

    expect(mockAuthActions.markUserAsReturning).toHaveBeenCalled();
  });
});
