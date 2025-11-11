import { useAuth } from '../contexts/AuthContext';

export const useAuthActions = () => {
  const {
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    refreshUserState,
    markUserAsReturning,
    enterDemoMode,
  } = useAuth();

  return {
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    refreshUserState,
    markUserAsReturning,
    enterDemoMode,
  };
};
