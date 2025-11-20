/**
 * Comprehensive OAuth Session Persistence Diagnostic Script
 * 
 * Run this script in the browser console to diagnose OAuth session persistence issues.
 * 
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Navigate to http://localhost:3000/auth/callback (after OAuth redirect)
 * 3. Paste this entire script into the console and press Enter
 * 4. Review the diagnostic output
 * 5. Download the report using: downloadDiagnosticReport()
 * 
 * This script checks:
 * - Environment variables
 * - Supabase client configuration
 * - URL hash contents
 * - localStorage session tokens
 * - Network requests to /auth/v1/token and /auth/v1/callback
 * - Auth state change events
 * - Session retrieval attempts
 */

(function comprehensiveOAuthDiagnostic() {
  console.log('\n%c🔍 COMPREHENSIVE OAUTH SESSION PERSISTENCE DIAGNOSTIC', 'font-size: 20px; font-weight: bold; color: #2563eb; background: #f0f9ff; padding: 10px;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const diagnosticReport = {
    timestamp: new Date().toISOString(),
    environment: {},
    supabaseConfig: {},
    urlState: {},
    localStorage: {},
    sessionChecks: [],
    authStateEvents: [],
    networkRequests: [],
    recommendations: []
  };

  // Helper to add recommendations
  const addRecommendation = (message) => {
    diagnosticReport.recommendations.push(message);
  };

  // ============================================================================
  // 1. ENVIRONMENT VARIABLES
  // ============================================================================
  console.log('%c📋 1. ENVIRONMENT VARIABLES', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  // Check if we can access process.env (React embeds at build time)
  let supabaseUrl = null;
  let supabaseAnonKey = null;
  let useMock = null;

  // Try to get from window (some bundlers expose this)
  if (window.__ENV__) {
    supabaseUrl = window.__ENV__.REACT_APP_SUPABASE_URL;
    supabaseAnonKey = window.__ENV__.REACT_APP_SUPABASE_ANON_KEY;
    useMock = window.__ENV__.REACT_APP_USE_MOCK;
  }

  // Check console logs for Supabase initialization
  console.log('ℹ️  Checking environment variables...');
  console.log('   Note: React embeds env vars at build time');
  console.log('   Check your .env file and ensure dev server was restarted after changes');

  if (supabaseUrl) {
    console.log('✅ REACT_APP_SUPABASE_URL:', supabaseUrl.substring(0, 40) + '...');
    diagnosticReport.environment.supabaseUrl = supabaseUrl;
  } else {
    console.error('❌ REACT_APP_SUPABASE_URL: Not accessible in console');
    console.error('   Action: Check .env file and restart dev server');
    addRecommendation('REACT_APP_SUPABASE_URL not accessible - check .env file and restart dev server');
  }

  if (supabaseAnonKey) {
    console.log('✅ REACT_APP_SUPABASE_ANON_KEY: Set (REDACTED)');
    diagnosticReport.environment.supabaseAnonKey = '***REDACTED***';
  } else {
    console.error('❌ REACT_APP_SUPABASE_ANON_KEY: Not accessible in console');
    console.error('   Action: Check .env file and restart dev server');
    addRecommendation('REACT_APP_SUPABASE_ANON_KEY not accessible - check .env file and restart dev server');
  }

  console.log('✅ REACT_APP_USE_MOCK:', useMock || 'false');
  diagnosticReport.environment.useMock = useMock || 'false';
  if (useMock === 'true') {
    console.warn('⚠️  Mock mode is enabled - OAuth will not work');
    addRecommendation('Set REACT_APP_USE_MOCK=false in .env file for OAuth to work');
  }

  diagnosticReport.environment.nodeEnv = 'development'; // Assume dev if running in console

  // ============================================================================
  // 2. SUPABASE CLIENT CONFIGURATION
  // ============================================================================
  console.log('\n%c📋 2. SUPABASE CLIENT CONFIGURATION', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  // Try to access supabase from window (if exposed) or check console logs
  console.log('ℹ️  Checking Supabase client configuration...');
  console.log('   Look for console logs: "✅ Supabase client initialized"');
  console.log('   Expected configuration in supabase.ts:');
  console.log('     - persistSession: true');
  console.log('     - autoRefreshToken: true');
  console.log('     - detectSessionInUrl: true');

  // Check if supabase is available globally
  let supabaseClient = null;
  if (window.supabase) {
    supabaseClient = window.supabase;
    console.log('✅ Supabase client found in window.supabase');
  } else {
    console.log('ℹ️  Supabase client not in window - check React component context');
    console.log('   The client should be initialized in src/lib/supabase.ts');
  }

  diagnosticReport.supabaseConfig = {
    persistSession: true, // Assumed - verify in code
    autoRefreshToken: true, // Assumed - verify in code
    detectSessionInUrl: true, // Assumed - verify in code
  };

  console.log('✅ Configuration assumed correct (verify in src/lib/supabase.ts)');

  // ============================================================================
  // 3. URL STATE
  // ============================================================================
  console.log('\n%c📋 3. URL STATE', 'font-weight: bold; font-size: 16px; color: #059669;');
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
  };

  console.log('✅ Full URL:', fullUrl);
  console.log('✅ Hash exists:', !!hash);
  console.log('✅ Hash length:', hash.length);

  if (hash) {
    const preview = hash.substring(0, 150);
    console.log('✅ Hash preview:', preview + (hash.length > 150 ? '...' : ''));
    console.log('✅ Contains access_token:', diagnosticReport.urlState.hashContainsAccessToken);
    console.log('✅ Contains refresh_token:', diagnosticReport.urlState.hashContainsRefreshToken);
    console.log('✅ Contains error:', diagnosticReport.urlState.hashContainsError);

    // In development, show full hash
    if (window.location.hostname === 'localhost') {
      console.log('✅ Full hash (dev mode):', hash);
    }

    if (diagnosticReport.urlState.hashContainsError) {
      const errorMatch = hash.match(/error=([^&]+)/);
      const errorDescription = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Unknown error';
      console.error('❌ OAuth error in hash:', errorDescription);
      addRecommendation(`OAuth error detected: ${errorDescription}`);
    }
  } else {
    console.warn('⚠️  No hash in URL - OAuth redirect may have failed');
    addRecommendation('No hash in URL - check if OAuth redirect completed successfully');
  }

  // ============================================================================
  // 4. LOCALSTORAGE
  // ============================================================================
  console.log('\n%c📋 4. LOCALSTORAGE', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

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
    // Try to find storage key by pattern
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

    if (token) {
      console.log('✅ Session token found in localStorage');
      console.log('✅ Storage key:', storageKey);
      try {
        const tokenData = JSON.parse(token);
        const preview = JSON.stringify(tokenData).substring(0, 200);
        console.log('✅ Token preview:', preview + '...');
        diagnosticReport.localStorage.tokenPreview = preview;
      } catch (e) {
        console.log('✅ Token exists but could not parse');
        diagnosticReport.localStorage.tokenPreview = token.substring(0, 200);
      }
    } else {
      console.warn('⚠️  No session token in localStorage');
      addRecommendation('No session token in localStorage - Supabase may not have processed the hash yet');
    }
  } else {
    console.warn('⚠️  Could not determine storage key');
    addRecommendation('Could not determine localStorage key - check REACT_APP_SUPABASE_URL');
  }

  // Find all Supabase-related keys
  const allKeys = Object.keys(localStorage);
  const supabaseKeys = allKeys.filter(key => key.startsWith('sb-'));
  diagnosticReport.localStorage.allSupabaseKeys = supabaseKeys;

  if (supabaseKeys.length > 0) {
    console.log('✅ Found Supabase keys:', supabaseKeys);
  }

  // ============================================================================
  // 5. NETWORK REQUESTS
  // ============================================================================
  console.log('\n%c📋 5. NETWORK REQUESTS', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('ℹ️  Network monitoring:');
  console.log('   1. Open DevTools → Network tab');
  console.log('   2. Filter by: /auth/v1/token or /auth/v1/callback');
  console.log('   3. Look for POST requests with status 200');
  console.log('   4. Check response body for session data');

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
        });
      });
    } else {
      console.warn('⚠️  No auth-related network requests found in Performance API');
      console.log('   Check Network tab manually for /auth/v1/token requests');
    }
  } else {
    console.log('ℹ️  Performance API not available - check Network tab manually');
  }

  // ============================================================================
  // 6. SESSION RETRIEVAL
  // ============================================================================
  console.log('\n%c📋 6. SESSION RETRIEVAL', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  if (!supabaseClient) {
    console.warn('⚠️  Cannot test session retrieval - Supabase client not accessible');
    console.log('   The AuthCallback component should handle this automatically');
    addRecommendation('Supabase client not accessible in console - check React component');
  } else {
    console.log('🔵 Attempting getSession()...');
    
    (async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        const timestamp = new Date().toISOString();

        diagnosticReport.sessionChecks.push({
          timestamp,
          method: 'getSession',
          sessionExists: !!session,
          error: error?.message || null,
          sessionDetails: session ? {
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at,
            hasAccessToken: !!session.access_token,
            hasRefreshToken: !!session.refresh_token,
          } : null,
        });

        if (session) {
          console.log('✅ Session found!');
          console.log(`   User ID: ${session.user?.id}`);
          console.log(`   Email: ${session.user?.email}`);
          console.log(`   Expires at: ${new Date(session.expires_at * 1000).toISOString()}`);
        } else if (error) {
          console.error(`❌ Error: ${error.message}`);
          addRecommendation(`getSession() error: ${error.message}`);
        } else {
          console.warn('⚠️  No session found');
          addRecommendation('Session not found - check if Supabase processed the hash');
        }
      } catch (error) {
        console.error('❌ Exception:', error.message);
        addRecommendation(`getSession() exception: ${error.message}`);
      }
    })();
  }

  // ============================================================================
  // 7. AUTH STATE EVENTS
  // ============================================================================
  console.log('\n%c📋 7. AUTH STATE EVENTS', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('ℹ️  Auth state events are monitored by AuthCallback component');
  console.log('   Check console for: "🔵 Auth state change: SIGNED_IN"');
  console.log('   If SIGNED_IN event fires, session should be available');

  // Check if there's a stored report from AuthCallback
  if (window.__OAUTH_DIAGNOSTIC_REPORT__) {
    console.log('✅ Found diagnostic report from AuthCallback component');
    const storedReport = window.__OAUTH_DIAGNOSTIC_REPORT__;
    if (storedReport.authStateEvents && storedReport.authStateEvents.length > 0) {
      console.log('✅ Auth state events recorded:', storedReport.authStateEvents.length);
      storedReport.authStateEvents.forEach(event => {
        console.log(`   ${event.timestamp}: ${event.event} - ${event.hasSession ? 'Has session' : 'No session'}`);
      });
      diagnosticReport.authStateEvents = storedReport.authStateEvents;
    }
  }

  // ============================================================================
  // 8. RECOMMENDATIONS
  // ============================================================================
  console.log('\n%c📋 8. RECOMMENDATIONS', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  if (diagnosticReport.recommendations.length === 0) {
    console.log('✅ No issues detected - OAuth flow appears to be working correctly');
  } else {
    diagnosticReport.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #2563eb;');
  console.log('%c✅ DIAGNOSTIC COMPLETE', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Store report globally
  window.__COMPREHENSIVE_OAUTH_DIAGNOSTIC_REPORT__ = diagnosticReport;

  console.log('📊 Diagnostic report stored in: window.__COMPREHENSIVE_OAUTH_DIAGNOSTIC_REPORT__');
  console.log('💾 To download report, run: downloadDiagnosticReport()\n');

  // Make download function available
  window.downloadDiagnosticReport = function() {
    const json = JSON.stringify(diagnosticReport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oauth-diagnostic-${Date.now()}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Report downloaded!');
  };

  return diagnosticReport;
})();

