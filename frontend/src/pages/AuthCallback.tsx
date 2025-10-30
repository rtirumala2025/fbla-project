import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { currentUser, loading, isNewUser } = useAuth();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    console.log('🔵 AuthCallback: Component mounted');
    console.log('URL:', window.location.href);
    console.log('Hash:', window.location.hash.substring(0, 50) + '...');
    
    // Wait for AuthContext to finish loading
    if (loading) {
      console.log('⏳ AuthCallback: Waiting for auth context to load...');
      setStatus('Signing you in...');
      return;
    }

    // If no user, redirect to login
    if (!currentUser) {
      console.log('❌ AuthCallback: No user found, redirecting to login');
      setStatus('Authentication failed. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true, state: { error: 'Authentication failed. Please try again.' } });
      }, 1000);
      return;
    }

    // User is authenticated, check if they're new
    console.log('✅ AuthCallback: User authenticated:', currentUser.email);
    console.log('🔍 AuthCallback: Is new user:', isNewUser);

    if (isNewUser) {
      console.log('🆕 AuthCallback: New user detected, redirecting to onboarding');
      setStatus('Welcome! Setting up your profile...');
      setTimeout(() => {
        navigate('/setup-profile', { replace: true });
      }, 1000);
    } else {
      console.log('👋 AuthCallback: Returning user, redirecting to dashboard');
      setStatus('Welcome back! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    }
  }, [currentUser, loading, isNewUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="text-center max-w-md w-full">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-gray-600">
          {status}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Please wait...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;