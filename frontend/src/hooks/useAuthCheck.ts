import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useAuthCheck = (requireAuth: boolean = true) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (requireAuth && !currentUser) {
      // If auth is required but no user, redirect to login
      navigate('/login', { replace: true });
    } else if (!requireAuth && currentUser) {
      // If user is already authenticated, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate, requireAuth]);

  return { currentUser, loading };
};
