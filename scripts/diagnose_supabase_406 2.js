/**
 * Diagnostic script to investigate 406 Not Acceptable errors from Supabase
 * Run with: node scripts/diagnose_supabase_406.js
 */

require('dotenv').config({ path: './frontend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 Diagnosing Supabase 406 Error\n');
console.log('📋 Configuration:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING'}\n`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-diagnostic/1.0.0',
    },
  },
});

async function testDatabaseConnection() {
  console.log('🧪 Test 1: Check if profiles table is accessible\n');
  
  try {
    // Test 1: Simple select on profiles table
    console.log('   Attempting: supabase.from("profiles").select("*").limit(1)');
    const { data, error, status, statusText } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    console.log(`   Status: ${status} ${statusText}`);
    console.log(`   Error:`, error);
    console.log(`   Data:`, data ? `${data.length} rows` : 'null');
    
    if (error) {
      console.log(`\n   ❌ Error Details:`);
      console.log(`      Code: ${error.code}`);
      console.log(`      Message: ${error.message}`);
      console.log(`      Hint: ${error.hint || 'none'}`);
      console.log(`      Details: ${error.details || 'none'}`);
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
  }
  
  console.log('\n🧪 Test 2: Check if pets table is accessible\n');
  
  try {
    console.log('   Attempting: supabase.from("pets").select("*").limit(1)');
    const { data, error, status, statusText } = await supabase
      .from('pets')
      .select('*')
      .limit(1);
    
    console.log(`   Status: ${status} ${statusText}`);
    console.log(`   Error:`, error);
    console.log(`   Data:`, data ? `${data.length} rows` : 'null');
    
    if (error) {
      console.log(`\n   ❌ Error Details:`);
      console.log(`      Code: ${error.code}`);
      console.log(`      Message: ${error.message}`);
      console.log(`      Hint: ${error.hint || 'none'}`);
      console.log(`      Details: ${error.details || 'none'}`);
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
  }
  
  console.log('\n🧪 Test 3: Check RLS and auth state\n');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log(`   Authenticated: ${!!session}`);
    if (session) {
      console.log(`   User: ${session.user.email}`);
    } else {
      console.log(`   ⚠️  Not authenticated - RLS may block access`);
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
  }
  
  console.log('\n🧪 Test 4: Raw REST API call\n');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    });
    
    console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`      ${key}: ${value}`);
    });
    
    const responseText = await response.text();
    console.log(`   Body: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
    
    if (response.status === 406) {
      console.log(`\n   🔍 406 Not Acceptable Analysis:`);
      console.log(`      This usually means:`);
      console.log(`      1. PostgREST cannot return data in the requested format`);
      console.log(`      2. The Accept header is requesting an unsupported media type`);
      console.log(`      3. API Gateway configuration issue`);
      console.log(`\n   💡 Possible fixes:`);
      console.log(`      • Check Supabase dashboard for API settings`);
      console.log(`      • Verify the table schema matches expectations`);
      console.log(`      • Check if the project is paused or has issues`);
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
  }
}

testDatabaseConnection().then(() => {
  console.log('\n✅ Diagnostic complete');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Diagnostic failed:', err);
  process.exit(1);
});

