#!/usr/bin/env node

/**
 * Authentication Diagnostic Script
 * Tests Supabase connectivity and auth flow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('\n🔍 AUTHENTICATION DIAGNOSIS\n');
console.log('=' .repeat(60));

// Check environment variables
console.log('\n1️⃣ Environment Variables:');
console.log('  REACT_APP_USE_MOCK:', process.env.REACT_APP_USE_MOCK || 'not set');
console.log('  REACT_APP_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  REACT_APP_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('\n❌ CRITICAL: Missing Supabase credentials');
  process.exit(1);
}

// Create client
console.log('\n2️⃣ Creating Supabase Client:');
let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Don't persist in Node
      detectSessionInUrl: false,
    },
  });
  console.log('  ✅ Supabase client created');
} catch (error) {
  console.log('  ❌ Failed to create client:', error.message);
  process.exit(1);
}

// Test connectivity
async function testConnectivity() {
  console.log('\n3️⃣ Testing Network Connectivity:');
  
  try {
    const startTime = Date.now();
    const { data, error } = await Promise.race([
      supabase.from('profiles').select('id').limit(0),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
      )
    ]);
    const elapsed = Date.now() - startTime;
    
    if (error && error.code !== '42P01') { // 42P01 = table doesn't exist (OK)
      console.log(`  ❌ Database query failed (${elapsed}ms):`, error.message);
      return false;
    } else {
      console.log(`  ✅ Database query successful (${elapsed}ms)`);
      return true;
    }
  } catch (error) {
    console.log('  ❌ Network error:', error.message);
    return false;
  }
}

// Test auth endpoint
async function testAuthEndpoint() {
  console.log('\n4️⃣ Testing Auth Endpoint:');
  
  try {
    const startTime = Date.now();
    const { data: { session }, error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
      )
    ]);
    const elapsed = Date.now() - startTime;
    
    if (error) {
      console.log(`  ❌ Auth endpoint error (${elapsed}ms):`, error.message);
      return false;
    } else {
      console.log(`  ✅ Auth endpoint responding (${elapsed}ms)`);
      console.log('    Current session:', session ? 'Active' : 'None');
      return true;
    }
  } catch (error) {
    console.log('  ❌ Auth endpoint timeout:', error.message);
    return false;
  }
}

// Test sign-in flow (with test credentials)
async function testSignInFlow() {
  console.log('\n5️⃣ Testing Sign-In Flow (Dry Run):');
  
  const testEmail = 'test@fbla-project.test';
  const testPassword = 'TestPassword123!';
  
  console.log('  Using test credentials:', testEmail);
  
  try {
    const startTime = Date.now();
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 15s')), 15000)
      )
    ]);
    const elapsed = Date.now() - startTime;
    
    if (error) {
      if (error.message.includes('Invalid login')) {
        console.log(`  ℹ️  Test user doesn't exist (${elapsed}ms) - This is OK if not created yet`);
        console.log('    Auth endpoint is responding correctly');
        return true;
      } else {
        console.log(`  ❌ Sign-in error (${elapsed}ms):`, error.message);
        return false;
      }
    } else {
      console.log(`  ✅ Sign-in successful (${elapsed}ms)`);
      console.log('    User ID:', data.user?.id);
      console.log('    Email:', data.user?.email);
      
      // Sign out after test
      await supabase.auth.signOut();
      console.log('  ✅ Test sign-out successful');
      return true;
    }
  } catch (error) {
    console.log('  ❌ Sign-in timeout or network error:', error.message);
    return false;
  }
}

// Run all tests
async function runDiagnostics() {
  const connectivity = await testConnectivity();
  const authEndpoint = await testAuthEndpoint();
  const signInFlow = await testSignInFlow();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSIS SUMMARY:');
  console.log('='.repeat(60));
  console.log('  Environment Variables:', '✅');
  console.log('  Supabase Client:', '✅');
  console.log('  Network Connectivity:', connectivity ? '✅' : '❌');
  console.log('  Auth Endpoint:', authEndpoint ? '✅' : '❌');
  console.log('  Sign-In Flow:', signInFlow ? '✅' : '❌');
  console.log('='.repeat(60));
  
  if (!connectivity || !authEndpoint || !signInFlow) {
    console.log('\n🔴 ROOT CAUSE IDENTIFIED:');
    
    if (!connectivity) {
      console.log('  → Network connectivity issue');
      console.log('  → Database queries timing out or failing');
      console.log('  → This could be caused by:');
      console.log('     - Firewall blocking Supabase');
      console.log('     - VPN interfering with connections');
      console.log('     - DNS resolution issues');
      console.log('     - ISP blocking outbound HTTPS');
    }
    
    if (!authEndpoint) {
      console.log('  → Auth endpoint not responding');
      console.log('  → Login requests hanging indefinitely');
    }
    
    if (!signInFlow) {
      console.log('  → Sign-in flow failing');
      console.log('  → Users cannot authenticate');
    }
    
    console.log('\n💡 RECOMMENDED FIXES:');
    console.log('  1. Check network connectivity to Supabase');
    console.log('  2. Try different network (WiFi/mobile hotspot)');
    console.log('  3. Disable VPN if enabled');
    console.log('  4. Check firewall settings');
    console.log('  5. Add timeout handling in AuthContext.tsx');
    
    process.exit(1);
  } else {
    console.log('\n✅ All diagnostics passed! Auth flow should work.');
    console.log('\nIf login still hangs, the issue is likely:');
    console.log('  → Frontend loading state not resetting properly');
    console.log('  → Missing error handling in Login component');
    console.log('  → Profile check hanging after successful auth');
    process.exit(0);
  }
}

runDiagnostics().catch(error => {
  console.error('\n❌ Diagnostic script failed:', error);
  process.exit(1);
});

