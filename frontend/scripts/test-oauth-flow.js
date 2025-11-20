/**
 * OAuth Flow Test Script
 * 
 * Run this script in the browser console after completing OAuth flow
 * to verify session persistence and redirect behavior.
 * 
 * Usage:
 * 1. Complete Google OAuth sign-in
 * 2. After redirect to /auth/callback, open DevTools (F12)
 * 3. Paste this script into console
 * 4. Press Enter
 * 5. Review results
 */

(function testOAuthFlow() {
  console.log('\n%c🧪 OAUTH FLOW TEST', 'font-size: 20px; font-weight: bold; color: #2563eb; background: #f0f9ff; padding: 10px;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const testResults = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    pathname: window.location.pathname,
    environment: {},
    session: {},
    redirect: {},
    network: {},
    diagnostics: {},
    errors: [],
    recommendations: []
  };

  // Helper
  const test = (name, condition, message, details = null) => {
    const passed = condition;
    const icon = passed ? '✅' : '❌';
    const style = passed ? 'color: #059669;' : 'color: #dc2626;';
    console.log(`%c${icon} ${name}`, `font-weight: bold; ${style}`);
    console.log(`   ${message}`);
    if (details) console.log(`   ${details}`);
    if (!passed) {
      testResults.errors.push(`${name}: ${message}`);
    }
    return passed;
  };

  // ============================================================================
  // 1. ENVIRONMENT CHECK
  // ============================================================================
  console.log('%c📋 1. ENVIRONMENT CHECK', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  // Check if we're on the callback page
  const onCallbackPage = window.location.pathname === '/auth/callback';
  test('On /auth/callback page', onCallbackPage, 
    onCallbackPage ? 'Correct page' : `Current: ${window.location.pathname}`);

  // Check for hash
  const hasHash = !!window.location.hash;
  test('URL hash exists', hasHash, 
    hasHash ? `Hash length: ${window.location.hash.length}` : 'No hash in URL');

  if (hasHash) {
    const hash = window.location.hash;
    test('Hash contains access_token', hash.includes('access_token'),
      hash.includes('access_token') ? 'Found' : 'Missing');
    test('Hash contains refresh_token', hash.includes('refresh_token'),
      hash.includes('refresh_token') ? 'Found' : 'Missing');
    test('Hash contains error', !hash.includes('error'),
      hash.includes('error') ? 'ERROR DETECTED IN HASH' : 'No errors');
  }

  // ============================================================================
  // 2. DIAGNOSTIC REPORT CHECK
  // ============================================================================
  console.log('\n%c📋 2. DIAGNOSTIC REPORT', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  if (window.__OAUTH_DIAGNOSTIC_REPORT__) {
    const report = window.__OAUTH_DIAGNOSTIC_REPORT__;
    testResults.diagnostics = report;

    test('Diagnostic report available', true, 'Report found in window.__OAUTH_DIAGNOSTIC_REPORT__');
    
    // Check environment
    if (report.environment) {
      test('Environment variables', 
        report.environment.supabaseUrl && report.environment.supabaseAnonKey,
        report.environment.supabaseUrl ? 'Variables set' : 'Variables missing');
    }

    // Check Supabase config
    if (report.supabaseConfig) {
      test('persistSession', report.supabaseConfig.persistSession === true, 
        report.supabaseConfig.persistSession ? 'Enabled' : 'Disabled');
      test('autoRefreshToken', report.supabaseConfig.autoRefreshToken === true,
        report.supabaseConfig.autoRefreshToken ? 'Enabled' : 'Disabled');
      test('detectSessionInUrl', report.supabaseConfig.detectSessionInUrl === true,
        report.supabaseConfig.detectSessionInUrl ? 'Enabled' : 'Disabled');
    }

    // Check URL state
    if (report.urlState) {
      test('Hash in diagnostic', !!report.urlState.hash,
        report.urlState.hash ? 'Hash recorded' : 'No hash recorded');
    }

    // Check localStorage
    if (report.localStorage) {
      test('Session token in localStorage', report.localStorage.hasSessionToken === true,
        report.localStorage.hasSessionToken ? 'Token found' : 'Token missing');
    }

    // Check session checks
    if (report.sessionChecks && report.sessionChecks.length > 0) {
      const hasSession = report.sessionChecks.some(check => check.sessionExists === true);
      test('Session found in diagnostics', hasSession,
        hasSession ? 'Session retrieved' : 'Session not found');
    }

    // Check auth state events
    if (report.authStateEvents && report.authStateEvents.length > 0) {
      const signedInEvent = report.authStateEvents.find(e => e.event === 'SIGNED_IN');
      test('SIGNED_IN event fired', !!signedInEvent,
        signedInEvent ? 'SIGNED_IN event detected' : 'SIGNED_IN event not found');
    }

    // Check recommendations
    if (report.recommendations && report.recommendations.length > 0) {
      console.log('\n⚠️  Diagnostic Recommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
        testResults.recommendations.push(rec);
      });
    }

    console.log('\n💾 To download full diagnostic report:');
    console.log('   window.__OAUTH_DIAGNOSTICS__.downloadReport()');
  } else {
    test('Diagnostic report available', false, 'Report not found - diagnostics may not have run');
    testResults.recommendations.push('Wait a moment and check if diagnostics have completed');
  }

  // ============================================================================
  // 3. SESSION VERIFICATION
  // ============================================================================
  console.log('\n%c📋 3. SESSION VERIFICATION', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  // Try to get Supabase client
  let supabaseClient = null;
  if (window.supabase) {
    supabaseClient = window.supabase;
  }

  if (supabaseClient) {
    console.log('🔵 Attempting getSession()...');
    
    (async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (session) {
          testResults.session = {
            exists: true,
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at,
            expiresAtFormatted: new Date(session.expires_at * 1000).toISOString(),
            hasAccessToken: !!session.access_token,
            hasRefreshToken: !!session.refresh_token,
            userMetadata: session.user?.user_metadata || {},
            isNewUser: !session.user?.user_metadata || Object.keys(session.user.user_metadata).length === 0
          };

          test('Session exists', true, 'Session retrieved successfully');
          console.log('   User ID:', session.user?.id);
          console.log('   Email:', session.user?.email);
          console.log('   Expires at:', new Date(session.expires_at * 1000).toISOString());
          console.log('   Is new user:', testResults.session.isNewUser);
          
          // Determine redirect
          const intendedRedirect = testResults.session.isNewUser ? '/setup-profile' : '/dashboard';
          testResults.redirect = {
            intended: intendedRedirect,
            current: window.location.pathname,
            correct: window.location.pathname === intendedRedirect || window.location.pathname === '/auth/callback'
          };

          console.log('   Intended redirect:', intendedRedirect);
          test('Redirect correct', testResults.redirect.correct,
            testResults.redirect.correct ? 'On correct path or callback' : `Expected: ${intendedRedirect}`);
        } else if (error) {
          test('Session exists', false, `Error: ${error.message}`);
          testResults.session = { exists: false, error: error.message };
          testResults.recommendations.push(`Session error: ${error.message}`);
        } else {
          test('Session exists', false, 'No session found');
          testResults.session = { exists: false };
          testResults.recommendations.push('Session not found - check network requests and Supabase configuration');
        }
      } catch (err) {
        test('Session exists', false, `Exception: ${err.message}`);
        testResults.session = { exists: false, error: err.message };
        testResults.recommendations.push(`Session exception: ${err.message}`);
      }
    })();
  } else {
    test('Supabase client available', false, 'Client not accessible in console');
    testResults.recommendations.push('Supabase client not accessible - check React component context');
  }

  // ============================================================================
  // 4. NETWORK REQUEST CHECK
  // ============================================================================
  console.log('\n%c📋 4. NETWORK REQUEST CHECK', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('ℹ️  Manual check required:');
  console.log('   1. Open DevTools → Network tab');
  console.log('   2. Filter by: /auth/v1/token');
  console.log('   3. Look for POST request with status 200');
  console.log('   4. Check response body for session data');

  // Try Performance API
  if (window.performance && window.performance.getEntriesByType) {
    const networkEntries = window.performance.getEntriesByType('resource');
    const authRequests = networkEntries.filter(entry => 
      entry.name.includes('/auth/v1/token') || entry.name.includes('/auth/v1/callback')
    );

    if (authRequests.length > 0) {
      test('Network requests found', true, `Found ${authRequests.length} auth-related requests`);
      authRequests.forEach(entry => {
        console.log(`   ${entry.name} - ${entry.duration.toFixed(2)}ms`);
      });
      testResults.network = {
        requestsFound: true,
        count: authRequests.length
      };
    } else {
      test('Network requests found', false, 'No auth requests in Performance API');
      testResults.recommendations.push('Check Network tab manually for POST /auth/v1/token');
    }
  }

  // ============================================================================
  // 5. SUMMARY
  // ============================================================================
  console.log('\n%c📋 5. TEST SUMMARY', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  const hasErrors = testResults.errors.length > 0;
  const hasRecommendations = testResults.recommendations.length > 0;

  if (!hasErrors && !hasRecommendations) {
    console.log('✅ All tests passed! OAuth flow appears to be working correctly.');
  } else {
    if (hasErrors) {
      console.log('❌ Errors found:');
      testResults.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }
    if (hasRecommendations) {
      console.log('\n⚠️  Recommendations:');
      testResults.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('%c✅ TEST COMPLETE', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Store results
  window.__OAUTH_FLOW_TEST_RESULTS__ = testResults;

  console.log('📊 Test results stored in: window.__OAUTH_FLOW_TEST_RESULTS__');
  console.log('💾 To download results, run: downloadOAuthTestResults()\n');

  // Download function
  window.downloadOAuthTestResults = function() {
    const json = JSON.stringify(testResults, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oauth-flow-test-${Date.now()}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Test results downloaded!');
  };

  return testResults;
})();

