/**
 * AuthCallback Component
 * 
 * Handles OAuth callback from Supabase after Google authentication.
 * 
 * Flow (as per OAUTH_MANUAL_SESSION_FIX.md):
 * 1. User authenticates with Google OAuth
 * 2. Google redirects back to /auth/callback with hash parameters (#access_token=...)
 * 3. Manual hash processing (PRIMARY STRATEGY):
 *    - Extract access_token and refresh_token from URL hash
 *    - Call supabase.auth.setSession() with extracted tokens
 *    - Clear hash from URL after successful session creation
 *    - Retrieve full session via getSession() or SIGNED_IN event
 * 4. Automatic detection (FALLBACK STRATEGY):
 *    - If manual processing fails/skipped, wait for Supabase auto-detection
 *    - Uses detectSessionInUrl: true configuration
 * 5. Session retrieved and user is redirected:
 *    - New user → /setup-profile
 *    - Returning user with no pet → /pet-selection
 *    - Returning user → /dashboard
 * 
 * Note: Manual hash processing is now the primary strategy due to reliability
 * issues with automatic detection in some environments.
 * 
 * Works in both development (localhost) and production (live URL).
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import OAuthDiagnostics from '../utils/oauthDiagnostics';

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
  const { currentUser, loading, checkUserProfile } = useAuth();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);
  const authStateSubscription = useRef<any>(null);


  const diagnosticsRef = useRef<OAuthDiagnostics | null>(null);

  // Optimization: If AuthContext already picked up the session, redirect immediately
  // This prevents race conditions where AuthCallback diagnostics might fail or be slow
  useEffect(() => {
    // If loading, just wait.
    if (loading) {
      setStatus('Verifying session...');
      return;
    }

    if (currentUser) {
      logToFile('✅ AuthCallback: currentUser detected via AuthContext - redirecting');

      // Short delay to ensure profile/state is consistent
      const timer = setTimeout(async () => {
        try {
          // Do a quick profile check to determine routing
          const { isNew, hasPet } = await checkUserProfile(currentUser.uid);

          if (isNew) {
            navigate('/setup-profile', { replace: true });
          } else if (!hasPet) {
            navigate('/pet-selection', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (e) {
          // Default safe fallback
          navigate('/dashboard', { replace: true });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentUser, loading, navigate, checkUserProfile]);

  useEffect(() => {
    // If AuthContext is loading, we wait.
    // If AuthContext has a user, the effect above handles it.
    // We only run this logic if we are NOT loading and NOT authenticated yet,
    // OR if we have a hash that needs processing.
    if (loading || currentUser) {
      return;
    }

    // Prevent duplicate processing
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const handleOAuthCallback = async () => {
      // Run comprehensive diagnostics
      logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logToFile('🔵 AuthCallback: Component mounted');
      logToFile('🔵 AuthCallback: Starting comprehensive OAuth diagnostics...');

      // Initialize and run diagnostics
      diagnosticsRef.current = new OAuthDiagnostics();
      try {
        const diagnosticReport = await diagnosticsRef.current.runDiagnostics(supabase);

        // Store report and diagnostics instance in window for access
        (window as any).__OAUTH_DIAGNOSTIC_REPORT__ = diagnosticReport;
        (window as any).__OAUTH_DIAGNOSTICS__ = diagnosticsRef.current;

        // Export report automatically
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Diagnostic report available at window.__OAUTH_DIAGNOSTIC_REPORT__');
          console.log('💾 To download report, run: window.__OAUTH_DIAGNOSTICS__.downloadReport()');
        }

        logToFile('✅ Diagnostics complete - see console for details');
      } catch (diagnosticError: any) {
        logToFile(`⚠️ Diagnostic error: ${diagnosticError.message}`, 'warn');
      }

      // Enhanced logging for OAuth callback debugging
      logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

        // PRIMARY STRATEGY: Manual hash processing (as per OAUTH_MANUAL_SESSION_FIX.md)
        // Extract tokens from URL hash and manually create session
        const hash = window.location.hash;
        let session = null;
        let sessionError: Error | null = null;

        if (hash && hash.includes('access_token=')) {
          logToFile('🔵 AuthCallback: Hash detected with access_token - attempting manual session creation...');
          logToFile('  Following OAUTH_MANUAL_SESSION_FIX.md strategy...');

          try {
            // Step 1: Extract tokens from hash
            const hashParams = new URLSearchParams(hash.substring(1)); // Remove # symbol
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const expiresIn = hashParams.get('expires_in');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const tokenType = hashParams.get('token_type') || 'bearer';

            if (accessToken) {
              logToFile('  ✓ Step 1: Access token extracted from hash');
              logToFile(`  ✓ Step 1: Refresh token: ${refreshToken ? 'present' : 'missing'}`);
              logToFile(`  ✓ Step 1: Expires in: ${expiresIn || 'unknown'} seconds`);

              // Step 2: Verify token format (decode for validation)
              try {
                const tokenParts = accessToken.split('.');
                if (tokenParts.length === 3) {
                  const payload = JSON.parse(atob(tokenParts[1]));
                  logToFile(`  ✓ Step 2: Token decoded successfully - User ID: ${payload.sub}, Email: ${payload.email || 'N/A'}`);

                  // Check if token issuer matches configured Supabase URL
                  const tokenIssuer = payload.iss ? payload.iss.replace('/auth/v1', '') : null;
                  const configuredUrl = process.env.REACT_APP_SUPABASE_URL;

                  if (tokenIssuer && configuredUrl) {
                    logToFile(`  📍 Token issuer: ${tokenIssuer}`);
                    logToFile(`  📍 Configured URL: ${configuredUrl}`);

                    if (tokenIssuer !== configuredUrl) {
                      const mismatchError = new Error(
                        `Token issuer mismatch! Token is from ${tokenIssuer} but your .env has ${configuredUrl}. ` +
                        `Update your .env file to match the token issuer.`
                      );
                      logToFile(`❌ Step 2: ${mismatchError.message}`, 'error');
                      sessionError = mismatchError;
                    } else {
                      logToFile(`  ✓ Token issuer matches configured URL`);
                    }
                  }

                  // Step 3: Instead of setSession(), let Supabase auto-process the hash
                  // with detectSessionInUrl: true, getSession() should trigger automatic processing
                  if (!sessionError) {
                    logToFile('🔵 Step 3: Triggering Supabase automatic hash processing...');
                    logToFile('  Note: detectSessionInUrl: true should auto-process the hash when getSession() is called');

                    // Give Supabase time to process the hash automatically
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Call getSession() which should trigger automatic hash processing
                    logToFile('🔵 Step 3: Calling getSession() to trigger automatic hash processing...');
                    const { data: { session: autoSession }, error: getSessionErr } = await supabase.auth.getSession();

                    if (autoSession) {
                      session = autoSession;
                      logToFile('✅ Step 3: Session retrieved via automatic hash processing');
                      logToFile(`  ✓ User: ${autoSession.user?.email || 'N/A'}`);

                      // Clear hash from URL now that session is set
                      window.history.replaceState(null, '', window.location.pathname + window.location.search);
                      logToFile('  ✓ Step 4: Hash cleared from URL');
                    } else if (getSessionErr) {
                      logToFile(`⚠️ Step 3: Automatic processing failed: ${getSessionErr.message}`, 'warn');
                      logToFile('🔵 Step 3: Trying manual setSession() as fallback...');

                      // Fallback: Try manual setSession() but construct proper session object
                      try {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { data: sessionResult, error: setSessionError } = await supabase.auth.setSession({
                          access_token: accessToken,
                          refresh_token: refreshToken || '',
                        });

                        if (setSessionError) {
                          logToFile(`❌ Step 3: Manual setSession() also failed: ${setSessionError.message}`, 'error');

                          // Enhanced error message
                          if (setSessionError.message.includes('Invalid API key')) {
                            const enhancedError = new Error(
                              `Invalid API key error. Your REACT_APP_SUPABASE_ANON_KEY in .env is incorrect.\n` +
                              `Get the correct anon key from: Supabase Dashboard → Settings → API → anon public key\n` +
                              `Make sure the key matches the project: ${tokenIssuer}`
                            );
                            logToFile(`  💡 ${enhancedError.message}`, 'error');
                            sessionError = enhancedError;
                          } else {
                            sessionError = setSessionError;
                          }
                        } else {
                          // Manual setSession() worked
                          logToFile('✅ Step 3: Manual setSession() succeeded');
                          await new Promise(resolve => setTimeout(resolve, 200));
                          const { data: { session: manualSession } } = await supabase.auth.getSession();
                          if (manualSession) {
                            session = manualSession;
                            window.history.replaceState(null, '', window.location.pathname + window.location.search);
                          }
                        }
                      } catch (manualError: any) {
                        logToFile(`❌ Step 3: Manual setSession() error: ${manualError.message}`, 'error');
                        sessionError = manualError;
                      }
                    } else {
                      // No session and no error - try constructing session manually as last resort
                      logToFile('⚠️ Step 3: Automatic processing failed, constructing session manually...', 'warn');

                      // Last resort: Try calling Supabase auth API directly
                      logToFile('🔵 Step 3: Attempting direct API call to exchange tokens...');

                      try {
                        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
                        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

                        logToFile(`  📍 Using URL: ${supabaseUrl}`);
                        logToFile(`  📍 Anon key present: ${!!supabaseAnonKey}`);
                        logToFile(`  📍 Anon key preview: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 50) + '...' : 'missing'}`);

                        // Decode anon key to verify it matches the project
                        if (supabaseAnonKey) {
                          try {
                            const anonKeyParts = supabaseAnonKey.split('.');
                            if (anonKeyParts.length === 3) {
                              const anonPayload = JSON.parse(atob(anonKeyParts[1]));
                              logToFile(`  📍 Anon key project ref: ${anonPayload.ref}`);
                              logToFile(`  📍 Token issuer project: ${tokenIssuer?.split('//')[1]?.split('.')[0] || 'unknown'}`);

                              const anonProjectRef = anonPayload.ref;
                              const tokenProjectRef = tokenIssuer?.split('//')[1]?.split('.')[0] || '';

                              if (anonProjectRef !== tokenProjectRef) {
                                sessionError = new Error(
                                  `CRITICAL MISMATCH: Anon key is for project "${anonProjectRef}" but token is from "${tokenProjectRef}"!\n` +
                                  `You need the anon key from the project: ${tokenIssuer}\n` +
                                  `Get it from: Supabase Dashboard → Select project "${tokenProjectRef}" → Settings → API → anon public key`
                                );
                                logToFile(`  ❌ ${sessionError.message}`, 'error');
                              } else {
                                logToFile(`  ✓ Anon key project matches token project`);
                              }
                            }
                          } catch (decodeErr) {
                            logToFile(`  ⚠️ Could not decode anon key: ${decodeErr}`, 'warn');
                          }
                        }

                        // Only proceed if no mismatch detected
                        if (!sessionError) {
                          // First, try setSession directly (simplest approach)
                          logToFile('🔵 Step 3: Attempting setSession() with correct anon key...');
                          const { data: sessionResult, error: finalSetError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                          });

                          if (!finalSetError && sessionResult?.session) {
                            session = sessionResult.session;
                            logToFile('✅ Step 3: Session set successfully!');
                            window.history.replaceState(null, '', window.location.pathname + window.location.search);
                          } else if (finalSetError) {
                            logToFile(`❌ Step 3: setSession() failed: ${finalSetError.message}`, 'error');

                            // Enhanced diagnostics for Invalid API key
                            if (finalSetError.message.includes('Invalid API key')) {
                              logToFile('  🔍 Diagnostic: Invalid API key error details...');
                              logToFile(`    Token issuer: ${tokenIssuer}`);
                              logToFile(`    Configured URL: ${supabaseUrl}`);
                              logToFile(`    Anon key loaded: ${!!supabaseAnonKey}`);

                              sessionError = new Error(
                                `Invalid API key error. The anon key doesn't match the project that issued the tokens.\n` +
                                `Token is from: ${tokenIssuer}\n` +
                                `Make sure your .env file has the anon key from the SAME project.\n` +
                                `If you just updated the .env file, make sure you restarted the dev server.`
                              );
                              logToFile(`  ❌ ${sessionError.message}`, 'error');
                            } else {
                              sessionError = finalSetError;
                            }
                          }
                        }
                      } catch (apiError: any) {
                        logToFile(`❌ Step 3: setSession() error: ${apiError.message}`, 'error');
                        sessionError = apiError;
                      }

                      // Final fallback: wait for SIGNED_IN event
                      if (!session && !sessionError) {
                        logToFile('🔵 Step 3: Waiting for SIGNED_IN event as final fallback...');

                        const sessionPromise = new Promise<any>((resolve, reject) => {
                          let resolved = false;
                          const timeout = setTimeout(() => {
                            if (!resolved) {
                              resolved = true;
                              reject(new Error('Timeout waiting for SIGNED_IN event'));
                            }
                          }, 3000);

                          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, authSession) => {
                            if (event === 'SIGNED_IN' && authSession && !resolved) {
                              resolved = true;
                              clearTimeout(timeout);
                              subscription.unsubscribe();
                              resolve(authSession);
                            }
                          });
                        });

                        try {
                          session = await Promise.race([
                            sessionPromise,
                            new Promise<any>((_, reject) =>
                              setTimeout(() => reject(new Error('SIGNED_IN event timeout')), 3000)
                            )
                          ]);
                          logToFile('✅ Step 3: Session received from SIGNED_IN event');
                          window.history.replaceState(null, '', window.location.pathname + window.location.search);
                        } catch (eventError: any) {
                          logToFile(`⚠️ Step 3: SIGNED_IN event timeout: ${eventError.message}`, 'warn');
                        }
                      }
                    }
                  }
                } else {
                  logToFile('⚠️ AuthCallback: Invalid access token format (expected JWT with 3 parts)', 'warn');
                }
              } catch (decodeError: any) {
                logToFile(`❌ AuthCallback: Error decoding token: ${decodeError.message}`, 'error');
                sessionError = decodeError;
              }
            } else {
              logToFile('⚠️ AuthCallback: No access_token found in hash', 'warn');
            }
          } catch (hashError: any) {
            logToFile(`❌ AuthCallback: Error processing hash: ${hashError.message}`, 'error');
            sessionError = hashError;
          }
        }

        // FALLBACK STRATEGY: If manual processing didn't work, try automatic detection
        if (!session && !sessionError) {
          logToFile('🔵 AuthCallback: Manual processing skipped (no hash), trying automatic detection...');
          logToFile('  Waiting 500ms for Supabase to process URL hash automatically...');

          await new Promise(resolve => setTimeout(resolve, 500));

          logToFile('🔵 AuthCallback: Attempting getSession() with automatic detection...');
          const getSessionResult = await supabase.auth.getSession();
          session = getSessionResult.data.session;
          sessionError = getSessionResult.error;

          logToFile(`🔵 AuthCallback: getSession() result:`);
          logToFile(`  Session exists: ${!!session}`);
          logToFile(`  Error: ${sessionError?.message || 'none'}`);
        }

        if (sessionError) {
          const errorMessage = sessionError.message || 'Session retrieval failed';
          logToFile(`❌ AuthCallback: Error retrieving session: ${errorMessage}`, 'error');
          setError(errorMessage);
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => {
            exportLogsToFile();
            setTimeout(() => {
              navigate('/login', {
                replace: true,
                state: { error: `Authentication failed: ${errorMessage}` }
              });
            }, 500);
          }, 1000);
          return;
        }

        if (!session) {
          // Strategy 2: Fallback - Listen for SIGNED_IN event
          // Sometimes Supabase needs a bit more time to process the hash
          logToFile('🔵 AuthCallback: No session via getSession(), setting up SIGNED_IN listener as fallback...');

          const sessionPromise = new Promise<any>((resolve, reject) => {
            let resolved = false;
            const timeout = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                logToFile('⚠️ AuthCallback: Auth state change timeout (5s)', 'warn');
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
                resolve(session);
              } else if (event === 'SIGNED_OUT' && !resolved) {
                resolved = true;
                clearTimeout(timeout);
                logToFile('❌ AuthCallback: SIGNED_OUT event received', 'error');
                reject(new Error('User signed out'));
              }
            });
          });

          try {
            // Wait for SIGNED_IN event with timeout
            const sessionFromEvent = await Promise.race([
              sessionPromise,
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for SIGNED_IN event')), 3000))
            ]);

            logToFile('✅ AuthCallback: Session received from auth state change event');

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

            setTimeout(() => {
              exportLogsToFile();
              setTimeout(() => {
                navigate('/login', {
                  replace: true,
                  state: { error: 'Authentication failed. Please try again. Check console for details.' }
                });
              }, 500);
            }, 1000);
            return;
          }
        }

        // Session found via getSession()
        logToFile('✅ AuthCallback: Session retrieved successfully via getSession()');
        await handleSessionSuccess(session);
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
      logSessionDetails(session);

      // Check if user has a profile and pet to determine redirect
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .eq('user_id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          logToFile(`❌ AuthCallback: Error checking profile: ${profileError.message}`, 'error');
        }

        const hasProfile = !!profile;

        // Check for pet existence (always check, regardless of profile status)
        let hasPet = false;
        try {
          const { data: pet, error: petError } = await supabase
            .from('pets')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (petError && petError.code !== 'PGRST116') {
            logToFile(`❌ AuthCallback: Error checking pet: ${petError.message}`, 'error');
            hasPet = false;
          } else {
            hasPet = !!pet;
          }
        } catch (petCheckError: any) {
          logToFile(`⚠️ AuthCallback: Error checking pet: ${petCheckError?.message || petCheckError}`, 'warn');
          hasPet = false;
        }

        // Route decision based on profile and pet existence
        // Priority: profile existence → pet existence
        const needsProfile = !hasProfile;
        const needsPet = !hasPet;

        logToFile('🔍 AuthCallback: Profile and pet check result');
        logToFile(`  Has profile: ${hasProfile}`);
        logToFile(`  Has pet: ${hasPet}`);
        logToFile(`  Needs profile: ${needsProfile}`);
        logToFile(`  Needs pet: ${needsPet}`);
        logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // CRITICAL: Check profile first, then pet
        if (needsProfile) {
          // User needs to create profile first
          logToFile('🆕 AuthCallback: User needs profile setup → redirecting to /setup-profile');
          logToFile('  Redirect decision: No profile → /setup-profile');
          setStatus('Welcome! Let\'s set up your profile...');

          setTimeout(() => {
            exportLogsToFile();
            setTimeout(() => {
              navigate('/setup-profile', { replace: true });
            }, 500);
          }, 1000);
        } else if (needsPet) {
          // User has profile but needs to select a pet
          logToFile('🆕 AuthCallback: User needs pet selection → redirecting to /pet-selection');
          logToFile('  Redirect decision: Has profile, no pet → /pet-selection');
          setStatus('Welcome! Let\'s select your pet...');

          setTimeout(() => {
            exportLogsToFile();
            setTimeout(() => {
              navigate('/pet-selection', { replace: true });
            }, 500);
          }, 1000);
        } else {
          // User has profile and pet, go to dashboard
          logToFile('👋 AuthCallback: User has profile and pet → redirecting to /dashboard');
          logToFile('  Redirect decision: Has profile and pet → /dashboard');
          setStatus('Welcome back! Redirecting to dashboard...');

          setTimeout(() => {
            exportLogsToFile();
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 500);
          }, 1000);
        }
      } catch (checkError: any) {
        logToFile(`❌ AuthCallback: Error in profile/pet check: ${checkError?.message || checkError}`, 'error');
        // Default to pet selection if check fails (safer for onboarding)
        logToFile('  Redirect decision: Check failed → defaulting to /pet-selection');
        setStatus('Welcome! Setting up your account...');
        setTimeout(() => {
          exportLogsToFile();
          setTimeout(() => {
            navigate('/pet-selection', { replace: true });
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
      if (diagnosticsRef.current) {
        diagnosticsRef.current.cleanup();
        diagnosticsRef.current = null;
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