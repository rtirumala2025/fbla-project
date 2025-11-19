/**
 * Runtime OAuth Diagnostic Script
 * 
 * This script checks the runtime environment for OAuth configuration issues.
 * Run this in the browser console while the app is running on localhost:3000
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Review the output
 */

(function() {
  console.log('\n%c🔍 OAuth Runtime Diagnostic Tool', 'font-size: 20px; font-weight: bold; color: #2563eb;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = {
    environment: {},
    supabase: {},
    routes: {},
    errors: [],
    warnings: [],
    recommendations: []
  };

  // 1. Check Environment Variables
  console.log('%c📋 Step 1: Environment Variables', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('─────────────────────────────────────────');

  const supabaseUrl = process?.env?.REACT_APP_SUPABASE_URL || window?.process?.env?.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process?.env?.REACT_APP_SUPABASE_ANON_KEY || window?.process?.env?.REACT_APP_SUPABASE_ANON_KEY;
  const useMock = process?.env?.REACT_APP_USE_MOCK || window?.process?.env?.REACT_APP_USE_MOCK;
  const oauthRedirect = process?.env?.REACT_APP_OAUTH_REDIRECT_URL || window?.process?.env?.REACT_APP_OAUTH_REDIRECT_URL;

  results.environment = {
    supabaseUrl: supabaseUrl || 'NOT FOUND',
    supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT FOUND',
    useMock: useMock || 'false',
    oauthRedirect: oauthRedirect || 'NOT SET (using dynamic)',
    currentOrigin: window.location.origin,
    currentPath: window.location.pathname
  };

  if (supabaseUrl) {
    console.log('✅ REACT_APP_SUPABASE_URL:', supabaseUrl);
  } else {
    console.error('❌ REACT_APP_SUPABASE_URL: NOT FOUND');
    results.errors.push('REACT_APP_SUPABASE_URL is not loaded at runtime');
  }

  if (supabaseAnonKey) {
    console.log('✅ REACT_APP_SUPABASE_ANON_KEY:', `${supabaseAnonKey.substring(0, 20)}... (${supabaseAnonKey.length} chars)`);
  } else {
    console.error('❌ REACT_APP_SUPABASE_ANON_KEY: NOT FOUND');
    results.errors.push('REACT_APP_SUPABASE_ANON_KEY is not loaded at runtime');
  }

  if (useMock === 'true') {
    console.warn('⚠️  REACT_APP_USE_MOCK: true (OAuth will be disabled)');
    results.warnings.push('REACT_APP_USE_MOCK is set to true - OAuth will not work');
  } else {
    console.log('✅ REACT_APP_USE_MOCK:', useMock || 'false');
  }

  if (oauthRedirect) {
    console.log('✅ REACT_APP_OAUTH_REDIRECT_URL:', oauthRedirect);
  } else {
    console.log('ℹ️  REACT_APP_OAUTH_REDIRECT_URL: Not set (will use dynamic: ' + window.location.origin + '/auth/callback)');
  }

  console.log('📍 Current Origin:', window.location.origin);
  console.log('📍 Current Path:', window.location.pathname);
  console.log('');

  // 2. Check Supabase Client
  console.log('%c📋 Step 2: Supabase Client Configuration', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('─────────────────────────────────────────');

  // Try to access Supabase client from window (if exposed) or check if it exists
  let supabaseClient = null;
  try {
    // Check if supabase is available in React DevTools or window
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('ℹ️  React DevTools detected - checking for Supabase client...');
    }
    
    // Try to find supabase in common locations
    const reactRoot = document.getElementById('root');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('ℹ️  React root found');
    }

    // Check localStorage for Supabase session
    const supabaseSession = localStorage.getItem('sb-' + (supabaseUrl ? supabaseUrl.split('//')[1]?.split('.')[0] : 'unknown') + '-auth-token');
    if (supabaseSession) {
      console.log('✅ Supabase session found in localStorage');
      results.supabase.hasSession = true;
    } else {
      console.log('ℹ️  No Supabase session in localStorage (user not signed in)');
      results.supabase.hasSession = false;
    }

    // Check for Supabase auth state
    const authTokens = Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'));
    if (authTokens.length > 0) {
      console.log('✅ Found auth-related localStorage keys:', authTokens.length);
      results.supabase.localStorageKeys = authTokens;
    }

  } catch (err) {
    console.error('❌ Error checking Supabase client:', err);
    results.errors.push('Error accessing Supabase client: ' + err.message);
  }

  // Check if we're on the callback page
  if (window.location.pathname === '/auth/callback') {
    console.log('📍 Currently on /auth/callback route');
    results.routes.onCallbackPage = true;
    
    // Check for OAuth hash parameters
    if (window.location.hash) {
      console.log('✅ OAuth hash parameters found in URL');
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const error = hashParams.get('error');
      
      if (accessToken) {
        console.log('✅ Access token present in URL hash');
        results.routes.hasAccessToken = true;
      }
      if (error) {
        console.error('❌ OAuth error in URL:', error);
        results.errors.push('OAuth error in callback URL: ' + error);
      }
    } else {
      console.warn('⚠️  No hash parameters in URL (OAuth callback may have failed)');
      results.warnings.push('No OAuth hash parameters found in callback URL');
    }
  } else {
    results.routes.onCallbackPage = false;
  }

  console.log('');

  // 3. Check Routes
  console.log('%c📋 Step 3: Route Configuration', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('─────────────────────────────────────────');

  const expectedCallbackUrl = window.location.origin + '/auth/callback';
  console.log('📍 Expected callback URL:', expectedCallbackUrl);
  console.log('📍 Current URL:', window.location.href);
  
  // Test if callback route exists by checking if we can navigate to it
  if (window.location.pathname !== '/auth/callback') {
    console.log('ℹ️  Not on callback page - route existence cannot be verified from console');
    console.log('ℹ️  To test: Navigate to ' + expectedCallbackUrl);
  }

  console.log('');

  // 4. Check for Console Errors
  console.log('%c📋 Step 4: Console Errors & Warnings', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('─────────────────────────────────────────');

  // Note: We can't capture past console errors, but we can check for common issues
  console.log('ℹ️  Review the console above for any errors or warnings');
  console.log('ℹ️  Common OAuth errors to look for:');
  console.log('   - "redirect_uri_mismatch"');
  console.log('   - "invalid_client"');
  console.log('   - "access_denied"');
  console.log('   - CORS errors');
  console.log('   - Network errors to Supabase');

  console.log('');

  // 5. Network Check
  console.log('%c📋 Step 5: Network Configuration', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('─────────────────────────────────────────');

  if (supabaseUrl) {
    console.log('📍 Supabase URL:', supabaseUrl);
    console.log('ℹ️  Check Network tab for requests to:', supabaseUrl + '/auth/v1/authorize');
    console.log('ℹ️  Expected OAuth flow:');
    console.log('   1. POST to ' + supabaseUrl + '/auth/v1/authorize?provider=google');
    console.log('   2. Redirect to Google OAuth');
    console.log('   3. Redirect back to ' + expectedCallbackUrl);
  }

  console.log('');

  // 6. Recommendations
  console.log('%c📋 Step 6: Recommendations', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('─────────────────────────────────────────');

  if (!supabaseUrl || !supabaseAnonKey) {
    results.recommendations.push('Create frontend/.env file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    results.recommendations.push('Restart the development server after creating .env file');
  }

  if (useMock === 'true') {
    results.recommendations.push('Set REACT_APP_USE_MOCK=false in .env file to enable OAuth');
  }

  if (window.location.origin !== 'http://localhost:3000') {
    results.recommendations.push('Ensure Supabase Dashboard has redirect URL configured for: ' + window.location.origin + '/auth/callback');
  } else {
    results.recommendations.push('Ensure Supabase Dashboard has redirect URL: http://localhost:3000/auth/callback');
  }

  results.recommendations.push('Verify Google OAuth is enabled in Supabase Dashboard → Authentication → Providers');
  results.recommendations.push('Verify Google Cloud Console has redirect URI: ' + (supabaseUrl || 'YOUR_SUPABASE_URL') + '/auth/v1/callback');

  results.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });

  console.log('');

  // Summary
  console.log('%c📊 Diagnostic Summary', 'font-size: 16px; font-weight: bold; color: #2563eb;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n%cEnvironment Variables:', 'font-weight: bold;');
  console.table(results.environment);

  if (results.errors.length > 0) {
    console.error('\n%c❌ Errors Found:', 'font-weight: bold; color: red;');
    results.errors.forEach((err, i) => console.error(`${i + 1}. ${err}`));
  }

  if (results.warnings.length > 0) {
    console.warn('\n%c⚠️  Warnings:', 'font-weight: bold; color: orange;');
    results.warnings.forEach((warn, i) => console.warn(`${i + 1}. ${warn}`));
  }

  console.log('\n%c💡 Copy the results object below for detailed analysis:', 'font-weight: bold; color: #059669;');
  console.log('window.__OAUTH_DIAGNOSTIC_RESULTS =', JSON.stringify(results, null, 2));

  // Store results in window for easy access
  window.__OAUTH_DIAGNOSTIC_RESULTS = results;

  console.log('\n✅ Diagnostic complete! Results stored in window.__OAUTH_DIAGNOSTIC_RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return results;
})();

