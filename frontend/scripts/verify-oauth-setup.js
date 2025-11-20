/**
 * Pre-Flight OAuth Setup Verification
 * 
 * Run this script BEFORE attempting OAuth to verify all configuration is correct.
 * 
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Navigate to http://localhost:3000/login
 * 3. Paste this script into console
 * 4. Review the output
 * 
 * This checks:
 * - Environment variables
 * - Supabase client configuration
 * - AuthContext redirect flow
 * - Supabase Dashboard settings (manual checklist)
 */

(function verifyOAuthSetup() {
  console.log('\n%c🔍 PRE-FLIGHT OAUTH SETUP VERIFICATION', 'font-size: 20px; font-weight: bold; color: #2563eb; background: #f0f9ff; padding: 10px;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const verificationReport = {
    timestamp: new Date().toISOString(),
    environment: {},
    supabaseConfig: {},
    authContext: {},
    recommendations: [],
    ready: false
  };

  // Helper
  const check = (name, condition, message, details = null) => {
    const passed = condition;
    const icon = passed ? '✅' : '❌';
    const style = passed ? 'color: #059669;' : 'color: #dc2626;';
    console.log(`%c${icon} ${name}`, `font-weight: bold; ${style}`);
    console.log(`   ${message}`);
    if (details) console.log(`   ${details}`);
    if (!passed) {
      verificationReport.recommendations.push(`${name}: ${message}`);
    }
    return passed;
  };

  // ============================================================================
  // 1. ENVIRONMENT VARIABLES
  // ============================================================================
  console.log('%c📋 1. ENVIRONMENT VARIABLES', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  // Check if we can access env vars (React embeds at build time)
  let supabaseUrl = null;
  let supabaseAnonKey = null;
  let useMock = null;

  // Try window.__ENV__ if available
  if (window.__ENV__) {
    supabaseUrl = window.__ENV__.REACT_APP_SUPABASE_URL;
    supabaseAnonKey = window.__ENV__.REACT_APP_SUPABASE_ANON_KEY;
    useMock = window.__ENV__.REACT_APP_USE_MOCK;
  }

  // Check console for Supabase initialization logs
  console.log('ℹ️  Checking environment variables...');
  console.log('   Note: React embeds env vars at build time');
  console.log('   Check frontend/.env file and ensure dev server was restarted');

  const envCheck1 = check(
    'REACT_APP_SUPABASE_URL',
    supabaseUrl !== null && supabaseUrl !== undefined,
    supabaseUrl ? `Set: ${supabaseUrl.substring(0, 40)}...` : 'Not accessible - check .env file',
    'Required: Set in frontend/.env and restart dev server'
  );

  const envCheck2 = check(
    'REACT_APP_SUPABASE_ANON_KEY',
    supabaseAnonKey !== null && supabaseAnonKey !== undefined,
    supabaseAnonKey ? 'Set (REDACTED)' : 'Not accessible - check .env file',
    'Required: Set in frontend/.env and restart dev server'
  );

  const mockCheck = check(
    'REACT_APP_USE_MOCK',
    useMock !== 'true',
    useMock === 'true' ? 'Set to "true" - OAuth will not work!' : `Set to "${useMock || 'false'}"`,
    useMock === 'true' ? 'CRITICAL: Set REACT_APP_USE_MOCK=false in .env' : 'OK'
  );

  verificationReport.environment = {
    supabaseUrl: supabaseUrl || 'NOT_SET',
    supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT_SET',
    useMock: useMock || 'false',
    allSet: envCheck1 && envCheck2 && mockCheck
  };

  // ============================================================================
  // 2. SUPABASE CLIENT CONFIGURATION
  // ============================================================================
  console.log('\n%c📋 2. SUPABASE CLIENT CONFIGURATION', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('ℹ️  Verify in frontend/src/lib/supabase.ts:');
  console.log('   Expected configuration:');
  console.log('     auth: {');
  console.log('       persistSession: true,');
  console.log('       autoRefreshToken: true,');
  console.log('       detectSessionInUrl: true,');
  console.log('     }');

  // Check console logs for Supabase initialization
  console.log('\n   Check browser console for:');
  console.log('     ✅ Supabase client initialized with env variables');
  console.log('     ✅ Session persistence enabled: persistSession=true');
  console.log('     ✅ Token refresh enabled: autoRefreshToken=true');
  console.log('     ✅ URL hash detection enabled: detectSessionInUrl=true');

  verificationReport.supabaseConfig = {
    note: 'Verify manually in frontend/src/lib/supabase.ts',
    expected: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  };

  check(
    'Supabase Client Config',
    true, // Manual verification required
    'Verify manually in code (see above)',
    'Check frontend/src/lib/supabase.ts has all three settings set to true'
  );

  // ============================================================================
  // 3. AUTHCONTEXT VERIFICATION
  // ============================================================================
  console.log('\n%c📋 3. AUTHCONTEXT VERIFICATION', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('ℹ️  Verify in frontend/src/contexts/AuthContext.tsx:');
  console.log('   Expected signInWithOAuth call:');
  console.log('     supabase.auth.signInWithOAuth({');
  console.log('       provider: "google",');
  console.log('       options: {');
  console.log('         redirectTo: window.location.origin + "/auth/callback",');
  console.log('         skipBrowserRedirect: false,  // or omit (defaults to false)');
  console.log('       }');
  console.log('     })');

  const expectedRedirect = `${window.location.origin}/auth/callback`;
  console.log(`\n   Expected redirect URL: ${expectedRedirect}`);

  verificationReport.authContext = {
    expectedRedirect,
    note: 'Verify manually in frontend/src/contexts/AuthContext.tsx',
    usesRedirectFlow: true
  };

  check(
    'AuthContext Redirect Flow',
    true, // Manual verification required
    'Verify manually in code (see above)',
    'Ensure signInWithOAuth uses redirect flow (skipBrowserRedirect: false)'
  );

  // ============================================================================
  // 4. SUPABASE DASHBOARD CHECKLIST
  // ============================================================================
  console.log('\n%c📋 4. SUPABASE DASHBOARD CHECKLIST', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  console.log('⚠️  Manual verification required in Supabase Dashboard:\n');

  const siteUrl = 'http://localhost:3000';
  const redirectUrl = `${siteUrl}/auth/callback`;

  console.log('1. Authentication → URL Configuration:');
  console.log(`   ☐ Site URL: ${siteUrl}`);
  console.log(`   ☐ Redirect URLs includes: ${redirectUrl}\n`);

  console.log('2. Authentication → Providers → Google:');
  console.log('   ☐ Google provider is enabled');
  console.log('   ☐ Client ID is set');
  console.log('   ☐ Client Secret is set\n');

  if (supabaseUrl) {
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectRef) {
      const googleRedirectUri = `https://${projectRef}.supabase.co/auth/v1/callback`;
      console.log('3. Google Cloud Console → APIs & Services → Credentials:');
      console.log('   ☐ OAuth 2.0 Client ID exists');
      console.log(`   ☐ Authorized redirect URI includes: ${googleRedirectUri}`);
      console.log('   ☐ Client ID matches Supabase Dashboard\n');
    }
  }

  verificationReport.supabaseDashboard = {
    siteUrl,
    redirectUrl,
    note: 'Manual verification required',
    checklist: [
      'Site URL set to http://localhost:3000',
      'Redirect URL includes http://localhost:3000/auth/callback',
      'Google provider enabled with credentials',
      'Google Cloud Console redirect URI configured'
    ]
  };

  // ============================================================================
  // 5. SUMMARY
  // ============================================================================
  console.log('\n%c📋 5. SUMMARY', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('─────────────────────────────────────────────────────────');

  const allEnvSet = verificationReport.environment.allSet;
  const ready = allEnvSet;

  verificationReport.ready = ready;

  if (ready) {
    console.log('✅ Environment variables are set correctly');
    console.log('⚠️  Manual verification still required:');
    console.log('   1. Supabase client configuration (supabase.ts)');
    console.log('   2. AuthContext redirect flow (AuthContext.tsx)');
    console.log('   3. Supabase Dashboard settings');
    console.log('   4. Google Cloud Console settings');
  } else {
    console.log('❌ Environment variables are NOT set correctly');
    console.log('   Fix the issues above before attempting OAuth');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('%c✅ VERIFICATION COMPLETE', 'font-weight: bold; font-size: 16px; color: #059669;');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Store report
  window.__OAUTH_SETUP_VERIFICATION__ = verificationReport;

  console.log('📊 Verification report stored in: window.__OAUTH_SETUP_VERIFICATION__\n');

  return verificationReport;
})();

