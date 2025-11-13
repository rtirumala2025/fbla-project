/**
 * useAuthActions Hook
 * Provides convenient access to authentication actions from AuthContext
 */
import { useAuth } from '../contexts/AuthContext';

export const useAuthActions = () => {
  const {
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    refreshUserState,
    markUserAsReturning,
  } = useAuth();

  return {
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    refreshUserState,
    markUserAsReturning,
  };
};

