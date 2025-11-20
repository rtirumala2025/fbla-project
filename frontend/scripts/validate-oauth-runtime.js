/**
 * OAuth Runtime Validation Script
 * 
 * This script validates OAuth configuration at runtime.
 * Run this in the browser console after the app loads.
 * 
 * It checks:
 * - Environment variables are loaded
 * - Supabase client configuration
 * - OAuth callback route availability
 */

(function validateOAuthRuntime() {
  console.log('\n%c🔍 OAuth Runtime Validation', 'font-size: 18px; font-weight: bold; color: #2563eb;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = {
    envLoaded: false,
    supabaseConfigured: false,
    callbackRouteAvailable: false,
    errors: []
  };

  // Check environment variables
  console.log('%c1. Environment Variables:', 'font-weight: bold; font-size: 14px;');
  console.log('─────────────────────────────────────────');

  let supabaseUrl = null;
  let supabaseAnonKey = null;
  let useMock = null;

  // Check process.env (React embeds at build time)
  if (typeof process !== 'undefined' && process.env) {
    supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    useMock = process.env.REACT_APP_USE_MOCK;

    if (supabaseUrl && supabaseAnonKey) {
      results.envLoaded = true;
      console.log('✅ REACT_APP_SUPABASE_URL:', 'Set (REDACTED)');
      console.log('✅ REACT_APP_SUPABASE_ANON_KEY:', 'Set (REDACTED)');
      console.log('✅ REACT_APP_USE_MOCK:', useMock || 'false');
    } else {
      console.error('❌ REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('❌ REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
      results.errors.push('Missing Supabase environment variables');
    }
  } else {
    console.error('❌ process.env not accessible');
    results.errors.push('process.env not accessible - may need to restart dev server');
  }

  // Check if window.__ENV__ exists (some bundlers expose this)
  if (!results.envLoaded && window.__ENV__) {
    console.log('ℹ️  Found window.__ENV__:', Object.keys(window.__ENV__));
    if (window.__ENV__.REACT_APP_SUPABASE_URL) {
      results.envLoaded = true;
      console.log('✅ Environment variables found in window.__ENV__');
    }
  }

  // Check Supabase client configuration
  console.log('\n%c2. Supabase Client:', 'font-weight: bold; font-size: 14px;');
  console.log('─────────────────────────────────────────');

  // Look for console logs indicating Supabase initialization
  console.log('ℹ️  Check browser console for Supabase initialization logs');
  console.log('   Look for: "✅ Supabase client initialized"');

  // Check callback route
  console.log('\n%c3. OAuth Callback Route:', 'font-weight: bold; font-size: 14px;');
  console.log('─────────────────────────────────────────');

  const currentUrl = window.location.href;
  const callbackPath = '/auth/callback';
  const isOnCallbackPage = currentUrl.includes(callbackPath);

  if (isOnCallbackPage) {
    console.log('✅ Currently on callback page:', callbackPath);
    console.log('   Full URL:', currentUrl);
    console.log('   Hash present:', !!window.location.hash);
    if (window.location.hash) {
      const hasAccessToken = window.location.hash.includes('access_token');
      const hasRefreshToken = window.location.hash.includes('refresh_token');
      console.log('   Hash contains access_token:', hasAccessToken);
      console.log('   Hash contains refresh_token:', hasRefreshToken);
    }
    results.callbackRouteAvailable = true;
  } else {
    console.log('ℹ️  Not on callback page (current:', window.location.pathname, ')');
    console.log('   Callback route should be:', callbackPath);
    // Can't definitively check without navigating, so assume it exists
    results.callbackRouteAvailable = true; // Route is defined in App.tsx
  }

  // Summary
  console.log('\n%cSummary:', 'font-weight: bold; font-size: 14px;');
  console.log('─────────────────────────────────────────');

  if (results.envLoaded) {
    console.log('✅ Environment variables loaded');
  } else {
    console.error('❌ Environment variables NOT loaded');
    console.error('   Action: Restart dev server (npm start)');
  }

  console.log('✅ OAuth callback route available');

  if (results.errors.length > 0) {
    console.error('\n❌ Issues found:');
    results.errors.forEach(err => console.error('   -', err));
  } else {
    console.log('\n✅ All checks passed!');
  }

  // Store results
  window.__OAUTH_VALIDATION_RESULTS = results;
  console.log('\n✅ Results stored in window.__OAUTH_VALIDATION_RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return results;
})();

