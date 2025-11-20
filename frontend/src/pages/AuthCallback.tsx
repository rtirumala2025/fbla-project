/**
 * AuthCallback Component
 * 
 * Handles OAuth callback from Supabase after Google authentication.
 * 
 * Flow:
 * 1. User authenticates with Google OAuth
 * 2. Google redirects back to /auth/callback with hash parameters (#access_token=...)
 * 3. This component waits for Supabase to process the URL hash (500-1000ms delay)
 * 4. Attempts getSession() to retrieve session
 * 5. Falls back to SIGNED_IN auth state listener if session not immediately available
 * 6. Only redirects after confirming valid session
 * 7. New user → /setup-profile, Returning user → /dashboard
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
  
  // Store in window for later export
  if (typeof window !== 'undefined') {
    if (!(window as any).__OAUTH_DEBUG_LOGS__) {
      (window as any).__OAUTH_DEBUG_LOGS__ = [];
    }
    (window as any).__OAUTH_DEBUG_LOGS__.push(logMessage);
  }
};

// Helper to export logs to file (downloads as oauth_session_debug.log)
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

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);
  const authStateSubscription = useRef<any>(null);
  const sessionResolved = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const handleOAuthCallback = async () => {
      // Enhanced logging for OAuth callback debugging
      logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logToFile('🔵 AuthCallback: Component mounted');
      logToFile(`🔵 AuthCallback: Full URL: ${window.location.href}`);
      logToFile(`🔵 AuthCallback: Hash exists: ${!!window.location.hash}`);
      logToFile(`🔵 AuthCallback: Hash length: ${window.location.hash.length}`);
      
      // Log hash contents (masked for security in production)
      if (window.location.hash) {
        const hashPreview = window.location.hash.substring(0, 150);
        logToFile(`🔵 AuthCallback: Hash preview: ${hashPreview}${window.location.hash.length > 150 ? '...' : ''}`);
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
      
      // Check localStorage for existing session
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const storageKey = supabaseUrl 
        ? `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`
        : null;
      const storedSession = storageKey ? localStorage.getItem(storageKey) : null;
      logToFile(`🔵 AuthCallback: Session in localStorage: ${!!storedSession}`);
      logToFile(`🔵 AuthCallback: Storage key: ${storageKey || 'N/A'}`);
      
      logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      try {
        // Check if we're in mock mode
        if (process.env.REACT_APP_USE_MOCK === 'true') {
          logToFile('⚠️ AuthCallback: Mock mode enabled, skipping OAuth', 'warn');
          setStatus('Mock mode: Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
          return;
        }

        // Verify environment variables
        logToFile('🔵 AuthCallback: Verifying environment variables...');
        const supabaseUrlEnv = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const useMock = process.env.REACT_APP_USE_MOCK;
        
        logToFile(`  REACT_APP_SUPABASE_URL: ${supabaseUrlEnv ? '✓ Set' : '✗ Missing'}`);
        logToFile(`  REACT_APP_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '✗ Missing'}`);
        logToFile(`  REACT_APP_USE_MOCK: ${useMock || 'false'}`);
        
        if (!supabaseUrlEnv || !supabaseAnonKey) {
          const errorMsg = 'Missing Supabase environment variables';
          logToFile(`❌ AuthCallback: ${errorMsg}`, 'error');
          setError(errorMsg);
          setStatus('Configuration error. Redirecting to login...');
          setTimeout(() => {
            navigate('/login', { 
              replace: true, 
              state: { error: errorMsg } 
            });
          }, 2000);
          return;
        }

        // Strategy 1: Wait for Supabase to process URL hash, then try getSession()
        logToFile('🔵 AuthCallback: Strategy 1 - Waiting 750ms for Supabase to process OAuth callback...');
        await new Promise(resolve => setTimeout(resolve, 750));
        
        logToFile('🔵 AuthCallback: Attempting getSession()...');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        logToFile(`🔵 AuthCallback: getSession() result:`);
        logToFile(`  Session exists: ${!!initialSession}`);
        logToFile(`  Error: ${sessionError?.message || 'none'}`);
        
        if (initialSession) {
          logToFile('✅ AuthCallback: Session found via getSession()');
          logSessionDetails(initialSession);
          sessionResolved.current = true;
          await handleSessionSuccess(initialSession);
          return;
        }

        // Strategy 1.5: Manual hash processing if getSession() failed but hash exists
        // This handles cases where Supabase hasn't processed the hash yet or detectSessionInUrl failed
        // We manually parse the hash and use setSession() to establish the session
        if (window.location.hash.includes('access_token') && !initialSession) {
          logToFile('🔵 AuthCallback: Strategy 1.5 - Manual hash processing...');
          logToFile('  Hash contains access_token but getSession() returned null');
          logToFile('  Attempting to manually process hash and set session...');
          
          try {
            // Parse hash parameters
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const expiresIn = hashParams.get('expires_in');
            const tokenType = hashParams.get('token_type') || 'bearer';
            
            if (accessToken && refreshToken) {
              logToFile('  Found access_token and refresh_token in hash');
              logToFile(`  Token type: ${tokenType}`);
              logToFile(`  Expires in: ${expiresIn || 'unknown'} seconds`);
              
              // Set session manually using setSession()
              // This will establish the session and trigger auth state changes
              const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (setSessionError) {
                logToFile(`  ❌ Error setting session manually: ${setSessionError.message}`, 'error');
                logToFile(`  Error code: ${setSessionError.status || 'unknown'}`, 'error');
              } else if (setSessionData.session) {
                logToFile('  ✅ Successfully set session manually via setSession()');
                logSessionDetails(setSessionData.session);
                sessionResolved.current = true;
                
                // Clean up hash from URL to prevent reprocessing
                window.history.replaceState(null, '', window.location.pathname);
                logToFile('  Cleaned hash from URL');
                
                await handleSessionSuccess(setSessionData.session);
                return;
              } else {
                logToFile('  ⚠️ setSession() succeeded but no session returned', 'warn');
              }
            } else {
              logToFile(`  ⚠️ Missing tokens in hash - access_token: ${!!accessToken}, refresh_token: ${!!refreshToken}`, 'warn');
            }
          } catch (hashError: any) {
            logToFile(`  ❌ Error during manual hash processing: ${hashError.message}`, 'error');
            logToFile(`  Stack: ${hashError.stack || 'none'}`, 'error');
          }
        }

        // Strategy 2: Set up SIGNED_IN auth state listener as fallback
        logToFile('🔵 AuthCallback: Strategy 2 - Setting up SIGNED_IN auth state listener as fallback...');
        
        const sessionPromise = new Promise<any>((resolve, reject) => {
          let resolved = false;
          // 5 second timeout for SIGNED_IN event
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              logToFile('⚠️ AuthCallback: Auth state change timeout (5s) - SIGNED_IN event not received', 'warn');
              reject(new Error('Auth state change timeout - SIGNED_IN event not received within 5 seconds'));
            }
          }, 5000);
          
          authStateSubscription.current = supabase.auth.onAuthStateChange(async (event, session) => {
            logToFile(`🔵 AuthCallback: Auth state change event: ${event}`);
            logToFile(`🔵 AuthCallback: Session in event: ${!!session}`);
            
            if (event === 'SIGNED_IN' && session && !resolved) {
              resolved = true;
              clearTimeout(timeout);
              logToFile('✅ AuthCallback: SIGNED_IN event received with session');
              logSessionDetails(session);
              resolve(session);
            } else if (event === 'SIGNED_OUT' && !resolved) {
              resolved = true;
              clearTimeout(timeout);
              logToFile('❌ AuthCallback: SIGNED_OUT event received', 'error');
              reject(new Error('User signed out'));
            }
          });
        });

        // Try getSession() again after another delay
        logToFile('🔵 AuthCallback: Waiting additional 500ms and retrying getSession()...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
        
        if (retrySession) {
          logToFile('✅ AuthCallback: Session found via retry getSession()');
          logSessionDetails(retrySession);
          sessionResolved.current = true;
          
          // Clean up auth state subscription
          if (authStateSubscription.current) {
            authStateSubscription.current.data.subscription.unsubscribe();
            authStateSubscription.current = null;
          }
          
          await handleSessionSuccess(retrySession);
          return;
        }

        // Wait for auth state change event
        logToFile('🔵 AuthCallback: No session via getSession(), waiting for SIGNED_IN event...');
        try {
          const sessionFromEvent = await Promise.race([
            sessionPromise,
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for SIGNED_IN event')), 3000))
          ]);
          
          logToFile('✅ AuthCallback: Session received from auth state change event');
          sessionResolved.current = true;
          
          // Clean up auth state subscription
          if (authStateSubscription.current) {
            authStateSubscription.current.data.subscription.unsubscribe();
            authStateSubscription.current = null;
          }
          
          await handleSessionSuccess(sessionFromEvent);
          return;
        } catch (err: any) {
          logToFile(`⚠️ AuthCallback: Auth state change listener failed: ${err.message}`, 'warn');
          
          // Clean up auth state subscription
          if (authStateSubscription.current) {
            authStateSubscription.current.data.subscription.unsubscribe();
            authStateSubscription.current = null;
          }
          
          // Final retry: try getSession() one more time after longer delay
          logToFile('🔵 AuthCallback: Final retry - waiting 1000ms and trying getSession() again...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: finalSession }, error: finalError } = await supabase.auth.getSession();
          
          if (finalSession) {
            logToFile('✅ AuthCallback: Found session after final retry');
            logSessionDetails(finalSession);
            sessionResolved.current = true;
            await handleSessionSuccess(finalSession);
            return;
          }
          
          // All strategies failed
          logToFile('❌ AuthCallback: No session found after all attempts', 'error');
          logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          logToFile(`  URL hash exists: ${!!window.location.hash}`, 'error');
          if (window.location.hash) {
            logToFile(`  URL hash length: ${window.location.hash.length}`, 'error');
            const hashPreview = window.location.hash.substring(0, 200);
            logToFile(`  URL hash preview: ${hashPreview}${window.location.hash.length > 200 ? '...' : ''}`, 'error');
            logToFile(`  Hash contains access_token: ${window.location.hash.includes('access_token')}`, 'error');
            logToFile(`  Hash contains refresh_token: ${window.location.hash.includes('refresh_token')}`, 'error');
            if (process.env.NODE_ENV === 'development') {
              logToFile(`  Full hash: ${window.location.hash}`, 'error');
            }
          } else {
            logToFile('  ❌ CRITICAL: No hash in URL! OAuth redirect may have failed.', 'error');
          }
          logToFile(`  Final retry error: ${finalError?.message || 'none'}`, 'error');
          logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
          
          setError('No session found. Please try signing in again.');
          setStatus('Authentication failed. Redirecting to login...');
          
          // Export logs before redirect
          setTimeout(() => {
            exportLogsToFile();
            setTimeout(() => {
              navigate('/login', { 
                replace: true, 
                state: { error: 'Authentication failed. Please try again. Check console for details.' } 
              });
            }, 500);
          }, 1000);
        }
      } catch (err: any) {
        logToFile(`❌ AuthCallback: Unexpected error: ${err.message || err}`, 'error');
        logToFile(`  Stack: ${err.stack || 'none'}`, 'error');
        setError(err.message || 'An unexpected error occurred');
        setStatus('Authentication failed. Redirecting to login...');
        
        // Clean up auth state subscription
        if (authStateSubscription.current) {
          authStateSubscription.current.data.subscription.unsubscribe();
          authStateSubscription.current = null;
        }
        
        setTimeout(() => {
          exportLogsToFile();
          setTimeout(() => {
            navigate('/login', { 
              replace: true, 
              state: { error: 'Authentication failed. Please try again.' } 
            });
          }, 500);
        }, 1000);
      }
    };

    // Helper function to log session details
    const logSessionDetails = (session: any) => {
      if (!session) return;
      
      logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logToFile('✅ AuthCallback: Session details');
      logToFile(`  User ID: ${session.user.id}`);
      logToFile(`  User email: ${session.user.email}`);
      logToFile(`  Session expires at: ${new Date(session.expires_at! * 1000).toISOString()}`);
      logToFile(`  Session expires in: ${Math.round((session.expires_at! * 1000 - Date.now()) / 1000)} seconds`);
      logToFile(`  Access token exists: ${!!session.access_token}`);
      logToFile(`  Refresh token exists: ${!!session.refresh_token}`);
      
      // Verify session is persisted
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const storageKey = supabaseUrl 
        ? `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`
        : null;
      const persistedSession = storageKey ? localStorage.getItem(storageKey) : null;
      logToFile(`  Session persisted to localStorage: ${!!persistedSession}`);
      logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };

    const handleSessionSuccess = async (session: any) => {
      if (!session || !session.user) {
        logToFile('❌ AuthCallback: Invalid session object', 'error');
        setError('Invalid session');
        setStatus('Authentication failed. Redirecting to login...');
        setTimeout(() => {
          exportLogsToFile();
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 500);
        }, 1000);
        return;
      }

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
        // Only redirect after confirming valid session
        if (isNewUser) {
          logToFile('🆕 AuthCallback: New user detected → redirecting to /setup-profile');
          logToFile('  Redirect decision: New user → /setup-profile');
          setStatus('Welcome! Setting up your profile...');
          
          // Export logs before redirect
          setTimeout(() => {
            exportLogsToFile();
            setTimeout(() => {
              navigate('/setup-profile', { replace: true });
            }, 500);
          }, 1000);
        } else {
          logToFile('👋 AuthCallback: Returning user → redirecting to /dashboard');
          logToFile('  Redirect decision: Returning user → /dashboard');
          setStatus('Welcome back! Redirecting to dashboard...');
          
          // Export logs before redirect
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
        logToFile('  Redirect decision: Profile check failed → defaulting to /dashboard');
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
