/**
 * OAuth Configuration Diagnostic Script
 * 
 * Run this script to diagnose OAuth session persistence issues:
 * node scripts/diagnose-oauth-config.js
 * 
 * This checks:
 * 1. Environment variables
 * 2. Supabase client initialization
 * 3. Session storage configuration
 * 4. Redirect URL configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 OAuth Configuration Diagnostic');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

console.log('📋 Step 1: Environment File Check');
console.log('─────────────────────────────────────────');
console.log(`  .env file exists: ${envExists ? '✅ Yes' : '❌ No'}`);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  const hasSupabaseUrl = lines.some(line => line.includes('REACT_APP_SUPABASE_URL') && !line.trim().startsWith('#'));
  const hasSupabaseKey = lines.some(line => line.includes('REACT_APP_SUPABASE_ANON_KEY') && !line.trim().startsWith('#'));
  const hasUseMock = lines.some(line => line.includes('REACT_APP_USE_MOCK') && !line.trim().startsWith('#'));
  
  console.log(`  REACT_APP_SUPABASE_URL: ${hasSupabaseUrl ? '✅ Found' : '❌ Missing'}`);
  console.log(`  REACT_APP_SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✅ Found' : '❌ Missing'}`);
  console.log(`  REACT_APP_USE_MOCK: ${hasUseMock ? '✅ Found' : '⚠️  Not set (defaults to false)'}`);
  
  // Extract values (masked)
  if (hasSupabaseUrl) {
    const urlLine = lines.find(line => line.includes('REACT_APP_SUPABASE_URL') && !line.trim().startsWith('#'));
    if (urlLine) {
      const url = urlLine.split('=')[1]?.trim();
      if (url) {
        console.log(`  Supabase URL: ${url.substring(0, 30)}...`);
        const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        if (projectRef) {
          console.log(`  Project Reference: ${projectRef}`);
          console.log(`  Expected Google OAuth redirect URI: https://${projectRef}.supabase.co/auth/v1/callback`);
        }
      }
    }
  }
} else {
  console.log('  ⚠️  Create a .env file in the frontend directory with:');
  console.log('     REACT_APP_SUPABASE_URL=https://your-project.supabase.co');
  console.log('     REACT_APP_SUPABASE_ANON_KEY=your-anon-key');
  console.log('     REACT_APP_USE_MOCK=false');
}

console.log('\n📋 Step 2: Supabase Client Configuration');
console.log('─────────────────────────────────────────');
console.log('  Checking frontend/src/lib/supabase.ts...');

const supabasePath = path.join(__dirname, '..', 'src', 'lib', 'supabase.ts');
const supabaseExists = fs.existsSync(supabasePath);

if (supabaseExists) {
  const supabaseContent = fs.readFileSync(supabasePath, 'utf8');
  
  const hasPersistSession = supabaseContent.includes('persistSession: true');
  const hasAutoRefresh = supabaseContent.includes('autoRefreshToken: true');
  const hasDetectSession = supabaseContent.includes('detectSessionInUrl: true');
  
  console.log(`  persistSession: ${hasPersistSession ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  autoRefreshToken: ${hasAutoRefresh ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  detectSessionInUrl: ${hasDetectSession ? '✅ Enabled' : '❌ Disabled'}`);
  
  if (!hasPersistSession || !hasAutoRefresh || !hasDetectSession) {
    console.log('\n  ⚠️  Missing required configuration! Update supabase.ts to include:');
    console.log('     auth: {');
    console.log('       persistSession: true,');
    console.log('       autoRefreshToken: true,');
    console.log('       detectSessionInUrl: true,');
    console.log('     }');
  }
} else {
  console.log('  ❌ supabase.ts file not found!');
}

console.log('\n📋 Step 3: Supabase Dashboard Configuration Checklist');
console.log('─────────────────────────────────────────');
console.log('  ⚠️  Manual verification required in Supabase Dashboard:\n');
console.log('  1. Go to: https://app.supabase.com → Your Project → Authentication → URL Configuration');
console.log('     ✅ Site URL must be: http://localhost:3000');
console.log('     ✅ Redirect URLs must include: http://localhost:3000/auth/callback\n');
console.log('  2. Go to: Authentication → Providers → Google');
console.log('     ✅ Google provider must be enabled');
console.log('     ✅ Client ID and Client Secret must be set');
console.log('     ✅ Client ID must match Google Cloud Console OAuth 2.0 Client\n');
console.log('  3. Go to: Google Cloud Console → APIs & Services → Credentials');
console.log('     ✅ OAuth 2.0 Client must have Authorized redirect URI:');
console.log('        https://<PROJECT_REF>.supabase.co/auth/v1/callback');
console.log('     ✅ Replace <PROJECT_REF> with your Supabase project reference\n');

console.log('📋 Step 4: Browser Configuration');
console.log('─────────────────────────────────────────');
console.log('  ⚠️  Manual verification required in browser:\n');
console.log('  1. Third-party cookies must be allowed');
console.log('  2. Local storage must be enabled');
console.log('  3. JavaScript must be enabled');
console.log('  4. No browser extensions blocking OAuth (e.g., ad blockers)\n');

console.log('📋 Step 5: Testing Instructions');
console.log('─────────────────────────────────────────');
console.log('  1. Start dev server: cd frontend && npm start');
console.log('  2. Open browser DevTools → Network tab');
console.log('  3. Navigate to http://localhost:3000/login');
console.log('  4. Click "Sign in with Google"');
console.log('  5. After redirect to /auth/callback, check:');
console.log('     - Network tab for POST /auth/v1/token (should return 200)');
console.log('     - Console for session object');
console.log('     - Application → Local Storage for Supabase session token\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Diagnostic complete! Review the checklist above.\n');

