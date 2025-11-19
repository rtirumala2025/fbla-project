/**
 * Environment Variable Runtime Checker
 * 
 * This script verifies that environment variables are accessible at runtime.
 * It should be run in the browser console.
 * 
 * Note: React environment variables are embedded at build time, so they
 * should be available via process.env in the browser.
 */

(function checkEnvRuntime() {
  console.log('\n%c🔍 Environment Variable Runtime Check', 'font-size: 18px; font-weight: bold; color: #2563eb;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = {
    variables: {},
    accessible: false,
    method: null,
    errors: []
  };

  // Try different methods to access environment variables
  let supabaseUrl = null;
  let supabaseAnonKey = null;
  let useMock = null;

  // Method 1: Direct process.env (most common in React)
  try {
    if (typeof process !== 'undefined' && process.env) {
      supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      useMock = process.env.REACT_APP_USE_MOCK;
      
      if (supabaseUrl || supabaseAnonKey) {
        results.accessible = true;
        results.method = 'process.env';
        console.log('✅ Environment variables accessible via process.env');
      }
    }
  } catch (e) {
    results.errors.push('Error accessing process.env: ' + e.message);
  }

  // Method 2: window.process.env (some bundlers expose this)
  if (!results.accessible) {
    try {
      if (window.process && window.process.env) {
        supabaseUrl = window.process.env.REACT_APP_SUPABASE_URL;
        supabaseAnonKey = window.process.env.REACT_APP_SUPABASE_ANON_KEY;
        useMock = window.process.env.REACT_APP_USE_MOCK;
        
        if (supabaseUrl || supabaseAnonKey) {
          results.accessible = true;
          results.method = 'window.process.env';
          console.log('✅ Environment variables accessible via window.process.env');
        }
      }
    } catch (e) {
      results.errors.push('Error accessing window.process.env: ' + e.message);
    }
  }

  // Method 3: Check if variables are embedded in window (unlikely but possible)
  if (!results.accessible) {
    if (window.__REACT_APP_SUPABASE_URL) {
      supabaseUrl = window.__REACT_APP_SUPABASE_URL;
      results.accessible = true;
      results.method = 'window.__REACT_APP_*';
      console.log('✅ Environment variables accessible via window.__REACT_APP_*');
    }
  }

  // Display results
  console.log('\n%cEnvironment Variables:', 'font-weight: bold; font-size: 14px;');
  console.log('─────────────────────────────────────────');

  if (supabaseUrl) {
    console.log('✅ REACT_APP_SUPABASE_URL:', supabaseUrl);
    results.variables.REACT_APP_SUPABASE_URL = supabaseUrl;
  } else {
    console.error('❌ REACT_APP_SUPABASE_URL: NOT FOUND');
    results.variables.REACT_APP_SUPABASE_URL = null;
  }

  if (supabaseAnonKey) {
    const masked = supabaseAnonKey.substring(0, 20) + '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 10);
    console.log('✅ REACT_APP_SUPABASE_ANON_KEY:', masked, `(${supabaseAnonKey.length} chars)`);
    results.variables.REACT_APP_SUPABASE_ANON_KEY = masked;
  } else {
    console.error('❌ REACT_APP_SUPABASE_ANON_KEY: NOT FOUND');
    results.variables.REACT_APP_SUPABASE_ANON_KEY = null;
  }

  if (useMock !== undefined && useMock !== null) {
    console.log('✅ REACT_APP_USE_MOCK:', useMock);
    results.variables.REACT_APP_USE_MOCK = useMock;
  } else {
    console.log('ℹ️  REACT_APP_USE_MOCK: Not set (defaults to false)');
    results.variables.REACT_APP_USE_MOCK = 'not set';
  }

  // Check if we can access the Supabase client
  console.log('\n%cSupabase Client Check:', 'font-weight: bold; font-size: 14px;');
  console.log('─────────────────────────────────────────');

  // Try to find Supabase client in the React component tree
  // This is a best-effort check since we can't directly access React internals
  console.log('ℹ️  To verify Supabase client configuration:');
  console.log('   1. Check browser console for Supabase initialization logs');
  console.log('   2. Look for errors mentioning "Supabase" or "OAuth"');
  console.log('   3. Check Network tab for requests to Supabase domain');

  // Summary
  console.log('\n%cSummary:', 'font-weight: bold; font-size: 14px;');
  console.log('─────────────────────────────────────────');

  if (results.accessible) {
    console.log('✅ Environment variables ARE accessible at runtime');
    console.log('   Method:', results.method);
  } else {
    console.error('❌ Environment variables are NOT accessible at runtime');
    console.error('   This usually means:');
    console.error('   1. .env file is missing or not loaded');
    console.error('   2. Development server needs to be restarted');
    console.error('   3. Variables are not prefixed with REACT_APP_');
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ CRITICAL: Supabase credentials are missing!');
    console.error('   OAuth will not work without these variables.');
    console.error('   Action required:');
    console.error('   1. Create frontend/.env file');
    console.error('   2. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    console.error('   3. Restart development server (npm start)');
  }

  // Store results
  window.__ENV_CHECK_RESULTS = results;
  console.log('\n✅ Results stored in window.__ENV_CHECK_RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return results;
})();

