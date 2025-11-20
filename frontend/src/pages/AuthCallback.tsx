/**
 * AuthCallback Component
 * 
 * Handles OAuth callback from Supabase after Google authentication.
 * 
 * Flow:
 * 1. User authenticates with Google OAuth
 * 2. Google redirects back to /auth/callback with hash parameters (#access_token=...)
 * 3. This component uses getSession() which automatically processes URL hash when detectSessionInUrl is enabled
 * 4. Session is stored by Supabase automatically
 * 5. User is redirected to dashboard (existing user) or setup-profile (new user)
 * 
 * Works in both development (localhost) and production (live URL).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Enhanced logging for OAuth callback debugging
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔵 AuthCallback: Component mounted');
      console.log('🔵 AuthCallback: Full URL:', window.location.href);
      console.log('🔵 AuthCallback: Hash exists:', !!window.location.hash);
      console.log('🔵 AuthCallback: Hash length:', window.location.hash.length);
      if (window.location.hash) {
        // Log hash contents (masked for security)
        const hashPreview = window.location.hash.substring(0, 150);
        console.log('🔵 AuthCallback: Hash preview:', hashPreview + (window.location.hash.length > 150 ? '...' : ''));
        // Check for tokens in hash
        const hasAccessToken = window.location.hash.includes('access_token');
        const hasRefreshToken = window.location.hash.includes('refresh_token');
        const hasError = window.location.hash.includes('error');
        console.log('🔵 AuthCallback: Hash contains access_token:', hasAccessToken);
        console.log('🔵 AuthCallback: Hash contains refresh_token:', hasRefreshToken);
        console.log('🔵 AuthCallback: Hash contains error:', hasError);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      try {
        // Check if we're in mock mode
        if (process.env.REACT_APP_USE_MOCK === 'true') {
          console.log('⚠️ AuthCallback: Mock mode enabled, skipping OAuth');
          setStatus('Mock mode: Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
          return;
        }

        // With detectSessionInUrl: true configured in Supabase client,
        // getSession() will automatically detect and process the session from URL hash parameters
        // Wait briefly (~500ms) to allow Supabase to process the hash parameters
        console.log('🔵 AuthCallback: Waiting for Supabase to process OAuth callback...');
        console.log('  Waiting 500ms for Supabase to extract session from URL hash...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Retrieve session - Supabase automatically extracts it from URL hash when detectSessionInUrl is enabled
        console.log('🔵 AuthCallback: Retrieving session from Supabase...');
        console.log('  Using getSession() with detectSessionInUrl: true');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Log session retrieval result
        console.log('🔵 AuthCallback: Session retrieval result:');
        console.log('  Session exists:', !!session);
        console.log('  Error:', sessionError || 'none');
        if (session) {
          console.log('  User ID:', session.user.id);
          console.log('  User email:', session.user.email);
          console.log('  Session expires at:', new Date(session.expires_at! * 1000).toISOString());
          console.log('  Session expires in:', Math.round((session.expires_at! * 1000 - Date.now()) / 1000), 'seconds');
        }

        if (sessionError) {
          console.error('❌ AuthCallback: Error retrieving session:', sessionError);
          setError(sessionError.message || 'Session retrieval failed');
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => {
            navigate('/login', { 
              replace: true, 
              state: { error: `Authentication failed: ${sessionError.message}` } 
            });
          }, 2000);
          return;
        }

        if (!session) {
          // Enhanced error logging when session is missing
          console.warn('⚠️ AuthCallback: No session found after getSession()');
          console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.warn('  URL hash exists:', !!window.location.hash);
          if (window.location.hash) {
            console.warn('  URL hash length:', window.location.hash.length);
            const hashPreview = window.location.hash.substring(0, 200);
            console.warn('  URL hash preview:', hashPreview + (window.location.hash.length > 200 ? '...' : ''));
            console.warn('  Hash contains access_token:', window.location.hash.includes('access_token'));
            console.warn('  Hash contains refresh_token:', window.location.hash.includes('refresh_token'));
            console.warn('  Hash contains error:', window.location.hash.includes('error'));
            // Log full hash for debugging (in development)
            if (process.env.NODE_ENV === 'development') {
              console.warn('  Full hash:', window.location.hash);
            }
          } else {
            console.error('  ❌ CRITICAL: No hash in URL! OAuth redirect may have failed.');
            console.error('  This usually means:');
            console.error('    1. Redirect URL mismatch in Supabase/Google configuration');
            console.error('    2. OAuth flow was not completed');
          }
          console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // Fallback: try getSession() again after longer delay (in case of timing issue)
          console.log('🔵 AuthCallback: Retrying session retrieval with 1000ms delay...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
          
          if (retryError || !retrySession) {
            console.error('❌ AuthCallback: No session found after retry');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('  Retry error:', retryError);
            console.error('  URL hash present:', !!window.location.hash);
            if (window.location.hash) {
              console.error('  Hash contains access_token:', window.location.hash.includes('access_token'));
              console.error('  Hash contains refresh_token:', window.location.hash.includes('refresh_token'));
              console.error('  Full hash for debugging:', window.location.hash);
            }
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            setError('No session found. Please try signing in again.');
            setStatus('Authentication failed. Redirecting to login...');
            setTimeout(() => {
              navigate('/login', { 
                replace: true, 
                state: { error: 'Authentication failed. Please try again. Check console for details.' } 
              });
            }, 2000);
            return;
          }
          
          console.log('✅ AuthCallback: Found session after retry');
          await handleSessionSuccess(retrySession);
          return;
        }

        console.log('✅ AuthCallback: Session retrieved successfully');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  User ID:', session.user.id);
        console.log('  User email:', session.user.email);
        console.log('  Session expires at:', new Date(session.expires_at! * 1000).toISOString());
        console.log('  Session expires in:', Math.round((session.expires_at! * 1000 - Date.now()) / 1000), 'seconds');
        console.log('  Session access token exists:', !!session.access_token);
        console.log('  Session refresh token exists:', !!session.refresh_token);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        await handleSessionSuccess(session);
      } catch (err: any) {
        console.error('❌ AuthCallback: Unexpected error:', err);
        setError(err.message || 'An unexpected error occurred');
        setStatus('Authentication failed. Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { 
            replace: true, 
            state: { error: 'Authentication failed. Please try again.' } 
          });
        }, 2000);
      }
    };

    const handleSessionSuccess = async (session: any) => {
      const userId = session.user.id;
      const userEmail = session.user.email;
      
      console.log('✅ AuthCallback: Processing successful authentication');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  User ID:', userId);
      console.log('  User email:', userEmail);

      // Check if user has a profile to determine if they're new
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .eq('user_id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('❌ AuthCallback: Error checking profile:', profileError);
        }

        const isNewUser = !profile;

        console.log('🔍 AuthCallback: Profile check result');
        console.log('  Has profile:', !!profile);
        console.log('  Is new user:', isNewUser);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Route decision: new users to setup-profile, returning users to dashboard
        if (isNewUser) {
          console.log('🆕 AuthCallback: New user detected → redirecting to /setup-profile');
          setStatus('Welcome! Setting up your profile...');
          setTimeout(() => {
            navigate('/setup-profile', { replace: true });
          }, 1000);
        } else {
          console.log('👋 AuthCallback: Returning user → redirecting to /dashboard');
          setStatus('Welcome back! Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        }
      } catch (profileCheckError) {
        console.error('❌ AuthCallback: Error in profile check:', profileCheckError);
        // Default to dashboard if profile check fails
        setStatus('Welcome! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="text-center max-w-md w-full">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-gray-600">
          {status}
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {!error && (
          <p className="mt-2 text-sm text-gray-500">
            Please wait...
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;