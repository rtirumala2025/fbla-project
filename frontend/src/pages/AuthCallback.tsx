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
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Helper to log to both console and file
const logToFile = (message: string, type: 'log' | 'warn' | 'error' = 'log') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  
  // Log to console
  if (type === 'error') {
    console.error(logMessage);
  } else if (type === 'warn') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
  
  // Store in window for later export (we'll save to file)
  if (typeof window !== 'undefined') {
    if (!(window as any).__OAUTH_DEBUG_LOGS__) {
      (window as any).__OAUTH_DEBUG_LOGS__ = [];
    }
    (window as any).__OAUTH_DEBUG_LOGS__.push(logMessage);
  }
};

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);
  const authStateSubscription = useRef<any>(null);

  useEffect(() => {
    // Prevent duplicate processing
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    // Export logs to file helper (defined early for use throughout)
    const exportLogsToFile = () => {
      if (typeof window !== 'undefined' && (window as any).__OAUTH_DEBUG_LOGS__) {
        try {
          const logs = (window as any).__OAUTH_DEBUG_LOGS__.join('');
          const blob = new Blob([logs], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'oauth_session_debug.log';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          logToFile('📄 Logs exported to oauth_session_debug.log');
        } catch (err) {
          console.error('Failed to export logs:', err);
        }
      }
    };

    const handleOAuthCallback = async () => {
      // Enhanced logging for OAuth callback debugging
      logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logToFile('🔵 AuthCallback: Component mounted');
      logToFile(`🔵 AuthCallback: Full URL: ${window.location.href}`);
      logToFile(`🔵 AuthCallback: Hash exists: ${!!window.location.hash}`);
      logToFile(`🔵 AuthCallback: Hash length: ${window.location.hash.length}`);
      
      // Check localStorage for existing session
      const storedSession = localStorage.getItem('sb-' + process.env.REACT_APP_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
      logToFile(`🔵 AuthCallback: Session in localStorage: ${!!storedSession}`);
      
      // Check cookies
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      logToFile(`🔵 AuthCallback: Cookies present: ${Object.keys(cookies).length > 0}`);
      const supabaseCookie = Object.keys(cookies).find(key => key.includes('supabase') || key.includes('auth'));
      logToFile(`🔵 AuthCallback: Supabase cookie found: ${!!supabaseCookie}`);
      
      if (window.location.hash) {
        // Log hash contents (masked for security)
        const hashPreview = window.location.hash.substring(0, 150);
        logToFile(`🔵 AuthCallback: Hash preview: ${hashPreview}${window.location.hash.length > 150 ? '...' : ''}`);
        // Check for tokens in hash
        const hasAccessToken = window.location.hash.includes('access_token');
        const hasRefreshToken = window.location.hash.includes('refresh_token');
        const hasError = window.location.hash.includes('error');
        logToFile(`🔵 AuthCallback: Hash contains access_token: ${hasAccessToken}`);
        logToFile(`🔵 AuthCallback: Hash contains refresh_token: ${hasRefreshToken}`);
        logToFile(`🔵 AuthCallback: Hash contains error: ${hasError}`);
        
        // In development, log full hash for debugging
        if (process.env.NODE_ENV === 'development') {
          logToFile(`🔵 AuthCallback: Full hash: ${window.location.hash}`);
        }
      }
      logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
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

        // Strategy 1: Listen for auth state change event (most reliable for OAuth)
        // This ensures we catch the SIGNED_IN event when Supabase processes the hash
        logToFile('🔵 AuthCallback: Setting up auth state change listener...');
        
        const sessionPromise = new Promise<any>((resolve, reject) => {
          let resolved = false;
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              logToFile('⚠️ AuthCallback: Auth state change timeout (5s)', 'warn');
              reject(new Error('Auth state change timeout'));
            }
          }, 5000);
          
          authStateSubscription.current = supabase.auth.onAuthStateChange(async (event, session) => {
            logToFile(`🔵 AuthCallback: Auth state change event: ${event}`);
            logToFile(`🔵 AuthCallback: Session in event: ${!!session}`);
            
            if (event === 'SIGNED_IN' && session) {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                logToFile('✅ AuthCallback: SIGNED_IN event received with session');
                resolve(session);
              }
            } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                logToFile('❌ AuthCallback: Session not found in auth state change', 'error');
                reject(new Error('No session in auth state change'));
              }
            }
          });
        });

        // Strategy 2: Also try getSession() after waiting
        logToFile('🔵 AuthCallback: Waiting for Supabase to process OAuth callback...');
        logToFile('  Strategy 1: Listening for SIGNED_IN event (preferred)');
        logToFile('  Strategy 2: Will try getSession() after 1000ms delay');
        
        // Wait a bit for Supabase to process the hash
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try getSession() as fallback
        logToFile('🔵 AuthCallback: Attempting getSession() as fallback...');
        const { data: { session: directSession }, error: sessionError } = await supabase.auth.getSession();
        
        logToFile(`🔵 AuthCallback: Direct getSession() result:`);
        logToFile(`  Session exists: ${!!directSession}`);
        logToFile(`  Error: ${sessionError?.message || 'none'}`);
        
        let session = directSession;
        
        // If direct getSession() found session, use it immediately
        if (session) {
          logToFile('✅ AuthCallback: Session found via direct getSession()');
        } else {
          // Wait for auth state change event
          logToFile('🔵 AuthCallback: No session via direct getSession(), waiting for SIGNED_IN event...');
          try {
            session = await Promise.race([
              sessionPromise,
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);
            logToFile('✅ AuthCallback: Session received from auth state change event');
          } catch (err: any) {
            logToFile(`⚠️ AuthCallback: Auth state change listener failed: ${err.message}`, 'warn');
            // Will fall through to retry logic below
          }
        }
        
        // Log session details if found
        if (session) {
          logToFile(`  User ID: ${session.user.id}`);
          logToFile(`  User email: ${session.user.email}`);
          logToFile(`  Session expires at: ${new Date(session.expires_at! * 1000).toISOString()}`);
          logToFile(`  Session expires in: ${Math.round((session.expires_at! * 1000 - Date.now()) / 1000)} seconds`);
          logToFile(`  Access token exists: ${!!session.access_token}`);
          logToFile(`  Refresh token exists: ${!!session.refresh_token}`);
        }

        // Clean up auth state subscription
        if (authStateSubscription.current) {
          authStateSubscription.current.data.subscription.unsubscribe();
          authStateSubscription.current = null;
        }

        if (sessionError) {
          logToFile(`❌ AuthCallback: Error retrieving session: ${sessionError.message}`, 'error');
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
          logToFile('⚠️ AuthCallback: No session found after all attempts', 'warn');
          logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          logToFile(`  URL hash exists: ${!!window.location.hash}`);
          if (window.location.hash) {
            logToFile(`  URL hash length: ${window.location.hash.length}`);
            const hashPreview = window.location.hash.substring(0, 200);
            logToFile(`  URL hash preview: ${hashPreview}${window.location.hash.length > 200 ? '...' : ''}`);
            logToFile(`  Hash contains access_token: ${window.location.hash.includes('access_token')}`);
            logToFile(`  Hash contains refresh_token: ${window.location.hash.includes('refresh_token')}`);
            logToFile(`  Hash contains error: ${window.location.hash.includes('error')}`);
            // Log full hash for debugging (in development)
            if (process.env.NODE_ENV === 'development') {
              logToFile(`  Full hash: ${window.location.hash}`);
            }
          } else {
            logToFile('  ❌ CRITICAL: No hash in URL! OAuth redirect may have failed.', 'error');
            logToFile('  This usually means:', 'error');
            logToFile('    1. Redirect URL mismatch in Supabase/Google configuration', 'error');
            logToFile('    2. OAuth flow was not completed', 'error');
          }
          
          // Check localStorage again
          const finalStoredSession = localStorage.getItem('sb-' + process.env.REACT_APP_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
          logToFile(`  Final check - Session in localStorage: ${!!finalStoredSession}`);
          
          logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // Final retry: try getSession() one more time after longer delay
          logToFile('🔵 AuthCallback: Final retry - waiting 2000ms and trying getSession() again...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { data: { session: finalSession }, error: finalError } = await supabase.auth.getSession();
          
          if (finalError || !finalSession) {
            logToFile('❌ AuthCallback: No session found after final retry', 'error');
            logToFile(`  Final retry error: ${finalError?.message || 'none'}`, 'error');
            logToFile(`  URL hash present: ${!!window.location.hash}`, 'error');
            if (window.location.hash) {
              logToFile(`  Hash contains access_token: ${window.location.hash.includes('access_token')}`, 'error');
              logToFile(`  Hash contains refresh_token: ${window.location.hash.includes('refresh_token')}`, 'error');
              if (process.env.NODE_ENV === 'development') {
                logToFile(`  Full hash for debugging: ${window.location.hash}`, 'error');
              }
            }
            logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
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
          
          logToFile('✅ AuthCallback: Found session after final retry');
          session = finalSession;
        }

        logToFile('✅ AuthCallback: Session retrieved successfully');
        logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logToFile(`  User ID: ${session.user.id}`);
        logToFile(`  User email: ${session.user.email}`);
        logToFile(`  Session expires at: ${new Date(session.expires_at! * 1000).toISOString()}`);
        logToFile(`  Session expires in: ${Math.round((session.expires_at! * 1000 - Date.now()) / 1000)} seconds`);
        logToFile(`  Session access token exists: ${!!session.access_token}`);
        logToFile(`  Session refresh token exists: ${!!session.refresh_token}`);
        
        // Verify session is persisted
        const persistedSession = localStorage.getItem('sb-' + process.env.REACT_APP_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
        logToFile(`  Session persisted to localStorage: ${!!persistedSession}`);
        logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        await handleSessionSuccess(session);
      } catch (err: any) {
        logToFile(`❌ AuthCallback: Unexpected error: ${err.message || err}`, 'error');
        logToFile(`  Stack: ${err.stack || 'none'}`, 'error');
        setError(err.message || 'An unexpected error occurred');
        setStatus('Authentication failed. Redirecting to login...');
        
        setTimeout(() => {
          // Export logs to file before navigating (will be defined above)
          if (typeof exportLogsToFile === 'function') {
            exportLogsToFile();
          }
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
      
      logToFile('✅ AuthCallback: Processing successful authentication');
      logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logToFile(`  User ID: ${userId}`);
      logToFile(`  User email: ${userEmail}`);

      // Check if user has a profile to determine if they're new
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .eq('user_id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          logToFile(`❌ AuthCallback: Error checking profile: ${profileError.message}`, 'error');
        }

        const isNewUser = !profile;

        logToFile('🔍 AuthCallback: Profile check result');
        logToFile(`  Has profile: ${!!profile}`);
        logToFile(`  Is new user: ${isNewUser}`);
        logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Route decision: new users to setup-profile, returning users to dashboard
        if (isNewUser) {
          logToFile('🆕 AuthCallback: New user detected → redirecting to /setup-profile');
          setStatus('Welcome! Setting up your profile...');
          // Export logs before redirect (delay slightly to capture all logs)
          setTimeout(() => {
            exportLogsToFile();
            setTimeout(() => {
              navigate('/setup-profile', { replace: true });
            }, 500);
          }, 1000);
        } else {
          logToFile('👋 AuthCallback: Returning user → redirecting to /dashboard');
          setStatus('Welcome back! Redirecting to dashboard...');
          // Export logs before redirect (delay slightly to capture all logs)
          setTimeout(() => {
            exportLogsToFile();
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 500);
          }, 1000);
        }
      } catch (profileCheckError: any) {
        logToFile(`❌ AuthCallback: Error in profile check: ${profileCheckError?.message || profileCheckError}`, 'error');
        // Default to dashboard if profile check fails
        setStatus('Welcome! Redirecting to dashboard...');
        setTimeout(() => {
          exportLogsToFile();
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        }, 1000);
      }
    };

    handleOAuthCallback();
    
    // Cleanup function
    return () => {
      if (authStateSubscription.current) {
        authStateSubscription.current.data.subscription.unsubscribe();
        authStateSubscription.current = null;
      }
    };
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