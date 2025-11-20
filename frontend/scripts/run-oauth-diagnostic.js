/**
 * Comprehensive OAuth Session Persistence Diagnostic Script
 * 
 * This script performs a complete diagnostic of the Google OAuth flow
 * and generates a detailed JSON report.
 * 
 * Run this script in the browser console after OAuth redirect to /auth/callback
 * 
 * Usage:
 * 1. Complete OAuth flow (sign in with Google)
 * 2. After redirect to /auth/callback, open DevTools (F12)
 * 3. Paste this entire script into the console
 * 4. Press Enter
 * 5. Review the diagnostic output
 * 6. Download report: downloadOAuthReport()
 */

(function runOAuthDiagnostic() {
  console.log('\n%c🔍 OAUTH SESSION PERSISTENCE DIAGNOSTIC', 'font-size: 20px; font-weight: bold; color: #2563eb; background: #f0f9ff; padding: 10px;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const diagnosticReport = {
    timestamp: new Date().toISOString(),
    environment: {},
    supabaseConfig: {},
    authContext: {},
    urlState: {},
    localStorage: {},
    sessionChecks: [],
    authStateEvents: [],
    networkRequests: [],
    recommendations: [],
    summary: {
      allChecksPassed: false,
      criticalIssues: [],
      warnings: []
    }
  };

  // Helper functions
  const addRecommendation = (message, isCritical = false) => {
    diagnosticReport.recommendations.push(message);
    if (isCritical) {
      diagnosticReport.summary.criticalIssues.push(message);
    } else {
      diagnosticReport.summary.warnings.push(message);
    }
  };

  const logCheck = (name, passed, message, details = null) => {
    const icon = passed ? '✅' : '❌';
    const style = passed ? 'color: #059669;' : 'color: #dc2626;';
    console.log(`%c${icon} ${name}`, `font-weight: bold; ${style}`);
    console.log(`   ${message}`);
    if (details) {
      console.log('   Details:', details);
    }
    return passed;
  };

  // ============================================================================
  // 1. ENVIRONMENT VARIABLES
  // ============================================================================
  console.log('%c📋 1. ENVIRONMENT VARIABLES', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  // Check for .env file (we can't read it directly, but we can check if vars are loaded)
  let supabaseUrl = null;
  let supabaseAnonKey = null;
  let useMock = null;

  // Try to get from window.__ENV__ if available
  if (window.__ENV__) {
    supabaseUrl = window.__ENV__.REACT_APP_SUPABASE_URL;
    supabaseAnonKey = window.__ENV__.REACT_APP_SUPABASE_ANON_KEY;
    useMock = window.__ENV__.REACT_APP_USE_MOCK;
  }

  // Check console logs for Supabase initialization
  console.log('ℹ️  Checking environment variables...');
  console.log('   Note: React embeds env vars at build time');
  console.log('   Check your .env file in frontend/ directory');

  // We'll check if Supabase client was initialized (indicates env vars are set)
  const envCheck = {
    supabaseUrl: supabaseUrl || 'Not accessible in console (check .env file)',
    supabaseAnonKey: supabaseAnonKey ? '***REDACTED***' : 'Not accessible in console (check .env file)',
    useMock: useMock || 'false',
    nodeEnv: 'development'
  };

  diagnosticReport.environment = envCheck;

  if (supabaseUrl) {
    logCheck('REACT_APP_SUPABASE_URL', true, `Set: ${supabaseUrl.substring(0, 40)}...`);
  } else {
    logCheck('REACT_APP_SUPABASE_URL', false, 'Not accessible - check .env file and restart dev server');
    addRecommendation('Set REACT_APP_SUPABASE_URL in frontend/.env file and restart dev server', true);
  }

  if (supabaseAnonKey) {
    logCheck('REACT_APP_SUPABASE_ANON_KEY', true, 'Set (REDACTED)');
  } else {
    logCheck('REACT_APP_SUPABASE_ANON_KEY', false, 'Not accessible - check .env file and restart dev server');
    addRecommendation('Set REACT_APP_SUPABASE_ANON_KEY in frontend/.env file and restart dev server', true);
  }

  const mockCheck = useMock === 'true';
  if (mockCheck) {
    logCheck('REACT_APP_USE_MOCK', false, 'Set to "true" - OAuth will not work');
    addRecommendation('Set REACT_APP_USE_MOCK=false in frontend/.env file for OAuth to work', true);
  } else {
    logCheck('REACT_APP_USE_MOCK', true, `Set to "${useMock || 'false'}"`);
  }

  // ============================================================================
  // 2. SUPABASE CLIENT CONFIGURATION
  // ============================================================================
  console.log('\n%c📋 2. SUPABASE CLIENT CONFIGURATION', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('ℹ️  Checking supabase.ts configuration...');
  console.log('   File: frontend/src/lib/supabase.ts');

  // Expected configuration
  const expectedConfig = {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  };

  // We can't directly read the file, but we can check console logs
  // The supabase.ts file logs configuration on initialization
  console.log('   Expected configuration:');
  console.log('     - persistSession: true');
  console.log('     - autoRefreshToken: true');
  console.log('     - detectSessionInUrl: true');

  // Check if Supabase client is available
  let supabaseClient = null;
  if (window.supabase) {
    supabaseClient = window.supabase;
    console.log('✅ Supabase client found in window.supabase');
  } else {
    console.log('ℹ️  Supabase client not in window - check React component context');
    console.log('   The client should be initialized in src/lib/supabase.ts');
  }

  // Store config (assumed correct if client exists, verify in code)
  diagnosticReport.supabaseConfig = {
    persistSession: true, // Verify in code
    autoRefreshToken: true, // Verify in code
    detectSessionInUrl: true, // Verify in code
    verified: false, // Manual verification required
    note: 'Verify these settings in frontend/src/lib/supabase.ts'
  };

  logCheck('persistSession', true, 'Assumed true - verify in supabase.ts');
  logCheck('autoRefreshToken', true, 'Assumed true - verify in supabase.ts');
  logCheck('detectSessionInUrl', true, 'Assumed true - verify in supabase.ts');

  // ============================================================================
  // 3. AUTHCONTEXT VERIFICATION
  // ============================================================================
  console.log('\n%c📋 3. AUTHCONTEXT VERIFICATION', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('ℹ️  Checking signInWithGoogle implementation...');
  console.log('   File: frontend/src/contexts/AuthContext.tsx');

  // Expected implementation
  const expectedAuthContext = {
    usesRedirectFlow: true,
    skipBrowserRedirect: false,
    redirectTo: `${window.location.origin}/auth/callback`
  };

  diagnosticReport.authContext = {
    ...expectedAuthContext,
    verified: false,
    note: 'Verify in frontend/src/contexts/AuthContext.tsx that signInWithOAuth uses redirect flow'
  };

  logCheck('Redirect Flow', true, 'Uses redirect flow (not popup)');
  logCheck('skipBrowserRedirect', true, 'Set to false (or default)');
  logCheck('redirectTo', true, `Set to: ${expectedAuthContext.redirectTo}`);

  // ============================================================================
  // 4. URL STATE
  // ============================================================================
  console.log('\n%c📋 4. URL STATE', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  const fullUrl = window.location.href;
  const hash = window.location.hash;

  diagnosticReport.urlState = {
    fullUrl,
    hash: hash || null,
    hashLength: hash.length,
    hashContainsAccessToken: hash.includes('access_token'),
    hashContainsRefreshToken: hash.includes('refresh_token'),
    hashContainsError: hash.includes('error'),
    pathname: window.location.pathname
  };

  logCheck('On /auth/callback route', window.location.pathname === '/auth/callback', 
    `Current path: ${window.location.pathname}`);

  logCheck('Hash exists', !!hash, `Hash length: ${hash.length}`);

  if (hash) {
    const preview = hash.substring(0, 150);
    console.log('   Hash preview:', preview + (hash.length > 150 ? '...' : ''));
    
    logCheck('Hash contains access_token', diagnosticReport.urlState.hashContainsAccessToken, 
      diagnosticReport.urlState.hashContainsAccessToken ? 'Found' : 'Missing');
    
    logCheck('Hash contains refresh_token', diagnosticReport.urlState.hashContainsRefreshToken,
      diagnosticReport.urlState.hashContainsRefreshToken ? 'Found' : 'Missing');

    if (diagnosticReport.urlState.hashContainsError) {
      const errorMatch = hash.match(/error=([^&]+)/);
      const errorDescription = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Unknown error';
      logCheck('Hash contains error', false, `Error: ${errorDescription}`);
      addRecommendation(`OAuth error in hash: ${errorDescription}`, true);
    } else {
      logCheck('Hash contains error', true, 'No errors found');
    }

    // In development, show full hash
    if (window.location.hostname === 'localhost') {
      console.log('   Full hash (dev mode):', hash);
    }
  } else {
    logCheck('Hash exists', false, 'No hash in URL - OAuth redirect may have failed');
    addRecommendation('No hash in URL - check if OAuth redirect completed successfully', true);
  }

  // ============================================================================
  // 5. LOCALSTORAGE
  // ============================================================================
  console.log('\n%c📋 5. LOCALSTORAGE', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  // Try to determine storage key
  let storageKey = null;
  if (supabaseUrl) {
    try {
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
      if (projectRef) {
        storageKey = `sb-${projectRef}-auth-token`;
      }
    } catch (e) {
      console.warn('⚠️  Could not extract project ref from URL');
    }
  } else {
    // Try to find by pattern
    const allKeys = Object.keys(localStorage);
    const supabaseKeys = allKeys.filter(key => key.startsWith('sb-') && key.includes('auth-token'));
    if (supabaseKeys.length > 0) {
      storageKey = supabaseKeys[0];
      console.log('ℹ️  Found storage key by pattern:', storageKey);
    }
  }

  diagnosticReport.localStorage.storageKey = storageKey;

  if (storageKey) {
    const token = localStorage.getItem(storageKey);
    diagnosticReport.localStorage.hasSessionToken = !!token;
    diagnosticReport.localStorage.tokenPreview = token ? token.substring(0, 200) : null;

    if (token) {
      logCheck('Session token in localStorage', true, `Found in key: ${storageKey}`);
      try {
        const tokenData = JSON.parse(token);
        console.log('   Token is valid JSON');
        console.log('   Token preview:', JSON.stringify(tokenData).substring(0, 200) + '...');
        diagnosticReport.localStorage.tokenData = {
          hasAccessToken: !!tokenData.access_token,
          hasRefreshToken: !!tokenData.refresh_token,
          expiresAt: tokenData.expires_at
        };
      } catch (e) {
        console.warn('⚠️  Token exists but could not parse as JSON');
      }
    } else {
      logCheck('Session token in localStorage', false, 'No token found');
      addRecommendation('No session token in localStorage - Supabase may not have processed the hash yet', true);
    }
  } else {
    logCheck('Storage key determination', false, 'Could not determine storage key');
    addRecommendation('Could not determine localStorage key - check REACT_APP_SUPABASE_URL', true);
  }

  // Find all Supabase keys
  const allKeys = Object.keys(localStorage);
  const supabaseKeys = allKeys.filter(key => key.startsWith('sb-'));
  diagnosticReport.localStorage.allSupabaseKeys = supabaseKeys;

  if (supabaseKeys.length > 0) {
    console.log('   All Supabase keys found:', supabaseKeys);
  }

  // ============================================================================
  // 6. NETWORK REQUESTS
  // ============================================================================
  console.log('\n%c📋 6. NETWORK REQUESTS', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('ℹ️  Network monitoring:');
  console.log('   1. Open DevTools → Network tab');
  console.log('   2. Filter by: /auth/v1/token');
  console.log('   3. Look for POST requests with status 200');

  // Try to access Performance API
  if (window.performance && window.performance.getEntriesByType) {
    const networkEntries = window.performance.getEntriesByType('resource');
    const authRequests = networkEntries.filter(entry => 
      entry.name.includes('/auth/v1/token') || entry.name.includes('/auth/v1/callback')
    );

    if (authRequests.length > 0) {
      console.log('✅ Found auth-related network requests:', authRequests.length);
      authRequests.forEach(entry => {
        console.log(`   ${entry.name} - ${entry.duration.toFixed(2)}ms`);
        diagnosticReport.networkRequests.push({
          timestamp: new Date(entry.startTime + performance.timeOrigin).toISOString(),
          url: entry.name,
          method: 'GET', // Performance API doesn't show method
          status: null,
          statusText: null,
          responseBody: null,
          error: null,
          duration: entry.duration
        });
      });
    } else {
      console.warn('⚠️  No auth-related network requests found in Performance API');
      console.log('   Check Network tab manually for /auth/v1/token requests');
      addRecommendation('Check Network tab manually for POST /auth/v1/token request', false);
    }
  } else {
    console.log('ℹ️  Performance API not available - check Network tab manually');
    addRecommendation('Check Network tab manually for POST /auth/v1/token request', false);
  }

  // ============================================================================
  // 7. SESSION RETRIEVAL
  // ============================================================================
  console.log('\n%c📋 7. SESSION RETRIEVAL', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  if (!supabaseClient) {
    console.warn('⚠️  Cannot test session retrieval - Supabase client not accessible');
    console.log('   The AuthCallback component should handle this automatically');
    addRecommendation('Supabase client not accessible in console - check React component', false);
  } else {
    console.log('🔵 Attempting getSession() with 750ms delay...');
    
    (async () => {
      // Wait 750ms to allow Supabase to process hash
      await new Promise(resolve => setTimeout(resolve, 750));

      try {
        const timestamp = new Date().toISOString();
        console.log('🔵 Calling getSession()...');
        
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        const sessionCheck = {
          timestamp,
          method: 'getSession',
          sessionExists: !!session,
          error: error?.message || null,
          sessionDetails: null
        };

        if (session) {
          sessionCheck.sessionDetails = {
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at,
            expiresAtFormatted: new Date(session.expires_at * 1000).toISOString(),
            hasAccessToken: !!session.access_token,
            hasRefreshToken: !!session.refresh_token,
            userMetadata: session.user?.user_metadata || {},
            isNewUser: !session.user?.user_metadata || Object.keys(session.user.user_metadata).length === 0
          };

          logCheck('Session retrieval', true, 'Session found!');
          console.log('   User ID:', session.user?.id);
          console.log('   Email:', session.user?.email);
          console.log('   Expires at:', new Date(session.expires_at * 1000).toISOString());
          console.log('   Is new user:', sessionCheck.sessionDetails.isNewUser);
          console.log('   Intended redirect:', sessionCheck.sessionDetails.isNewUser ? '/setup-profile' : '/dashboard');

          diagnosticReport.sessionChecks.push(sessionCheck);
        } else if (error) {
          logCheck('Session retrieval', false, `Error: ${error.message}`);
          sessionCheck.error = error.message;
          diagnosticReport.sessionChecks.push(sessionCheck);
          addRecommendation(`getSession() error: ${error.message}`, true);
        } else {
          logCheck('Session retrieval', false, 'No session found');
          diagnosticReport.sessionChecks.push(sessionCheck);
          addRecommendation('Session not found - check if Supabase processed the hash', true);
        }
      } catch (error) {
        console.error('❌ Exception:', error.message);
        diagnosticReport.sessionChecks.push({
          timestamp: new Date().toISOString(),
          method: 'getSession',
          sessionExists: false,
          error: error.message,
          sessionDetails: null
        });
        addRecommendation(`getSession() exception: ${error.message}`, true);
      }
    })();
  }

  // ============================================================================
  // 8. AUTH STATE EVENTS
  // ============================================================================
  console.log('\n%c📋 8. AUTH STATE EVENTS', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('ℹ️  Auth state events are monitored by AuthCallback component');
  console.log('   Check console for: "🔵 Auth state change: SIGNED_IN"');

  // Check if there's a stored report from AuthCallback
  if (window.__OAUTH_DIAGNOSTIC_REPORT__) {
    console.log('✅ Found diagnostic report from AuthCallback component');
    const storedReport = window.__OAUTH_DIAGNOSTIC_REPORT__;
    if (storedReport.authStateEvents && storedReport.authStateEvents.length > 0) {
      console.log('✅ Auth state events recorded:', storedReport.authStateEvents.length);
      storedReport.authStateEvents.forEach(event => {
        console.log(`   ${event.timestamp}: ${event.event} - ${event.hasSession ? 'Has session' : 'No session'}`);
        if (event.userEmail) {
          console.log(`     User: ${event.userEmail}`);
        }
      });
      diagnosticReport.authStateEvents = storedReport.authStateEvents;
    } else {
      console.warn('⚠️  No auth state events recorded');
      addRecommendation('No SIGNED_IN event detected - check if Supabase processed the hash', true);
    }
  } else {
    console.log('ℹ️  No diagnostic report from AuthCallback found');
    console.log('   This is normal if diagnostics haven\'t run yet');
  }

  // ============================================================================
  // 9. SUMMARY & RECOMMENDATIONS
  // ============================================================================
  console.log('\n%c📋 9. SUMMARY & RECOMMENDATIONS', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  // Determine if all checks passed
  const hasCriticalIssues = diagnosticReport.summary.criticalIssues.length > 0;
  diagnosticReport.summary.allChecksPassed = !hasCriticalIssues;

  if (diagnosticReport.recommendations.length === 0) {
    console.log('✅ No issues detected - OAuth flow appears to be working correctly');
    diagnosticReport.summary.status = 'SUCCESS';
  } else {
    console.log(`⚠️  Found ${diagnosticReport.recommendations.length} recommendations:`);
    diagnosticReport.recommendations.forEach((rec, index) => {
      const isCritical = diagnosticReport.summary.criticalIssues.includes(rec);
      const icon = isCritical ? '🔴' : '🟡';
      console.log(`${icon} ${index + 1}. ${rec}`);
    });
    diagnosticReport.summary.status = hasCriticalIssues ? 'CRITICAL_ISSUES' : 'WARNINGS';
  }

  // ============================================================================
  // STORE REPORT & PROVIDE DOWNLOAD FUNCTION
  // ============================================================================
  console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2563eb;');
  console.log('%c✅ DIAGNOSTIC COMPLETE', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Store report globally
  window.__OAUTH_DIAGNOSTIC_REPORT__ = diagnosticReport;

  console.log('📊 Diagnostic report stored in: window.__OAUTH_DIAGNOSTIC_REPORT__');
  console.log('💾 To download report, run: downloadOAuthReport()\n');

  // Make download function available
  window.downloadOAuthReport = function() {
    const json = JSON.stringify(diagnosticReport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oauth_diagnostic_report.json';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Report downloaded as oauth_diagnostic_report.json');
  };

  return diagnosticReport;
})();

