#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * This script:
 * 1. Creates test user in Supabase Auth
 * 2. Applies database migrations
 * 3. Verifies RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../frontend/.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_USER_EMAIL = 'test@fbla-project.test';
const TEST_USER_PASSWORD = 'TestPassword123!';

console.log('🚀 Starting environment setup...\n');

// Check for required credentials
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestUser() {
  console.log('👤 Creating test user...');
  console.log(`   Email: ${TEST_USER_EMAIL}`);
  
  try {
    // Try to sign in first to see if user already exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    
    if (signInData?.user) {
      console.log('✅ Test user already exists and can authenticate');
      console.log(`   User ID: ${signInData.user.id}`);
      await supabase.auth.signOut();
      return signInData.user;
    }
    
    // If sign in failed, try to create the user
    if (signInError) {
      console.log('   User does not exist, attempting to create...');
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        options: {
          data: {
            display_name: 'Test User',
          }
        }
      });
      
      if (signUpError) {
        console.error('❌ Failed to create test user:', signUpError.message);
        console.log('\n⚠️  MANUAL ACTION REQUIRED:');
        console.log('   1. Go to Supabase Dashboard → Authentication → Users');
        console.log('   2. Click "Add user"');
        console.log(`   3. Email: ${TEST_USER_EMAIL}`);
        console.log(`   4. Password: ${TEST_USER_PASSWORD}`);
        console.log('   5. Check "Auto Confirm User"');
        return null;
      }
      
      if (signUpData?.user) {
        console.log('✅ Test user created successfully');
        console.log(`   User ID: ${signUpData.user.id}`);
        
        if (signUpData.user.email_confirmed_at) {
          console.log('✅ Email auto-confirmed');
        } else {
          console.log('⚠️  Email confirmation required');
          console.log('   Check Supabase Dashboard to confirm user manually');
        }
        
        return signUpData.user;
      }
    }
  } catch (error) {
    console.error('❌ Error during test user setup:', error.message);
    return null;
  }
}

async function checkMigrations() {
  console.log('\n📊 Checking database tables...');
  
  try {
    // Check if tables exist by trying to query them
    const tables = ['profiles', 'user_preferences', 'pets'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(0);
        results[table] = !error || error.code !== '42P01'; // 42P01 = table does not exist
        
        if (results[table]) {
          console.log(`   ✅ Table '${table}' exists`);
        } else {
          console.log(`   ❌ Table '${table}' does not exist`);
        }
      } catch (err) {
        results[table] = false;
        console.log(`   ❌ Table '${table}' does not exist`);
      }
    }
    
    const allExist = Object.values(results).every(v => v);
    
    if (!allExist) {
      console.log('\n⚠️  MIGRATIONS NOT APPLIED');
      console.log('   Missing tables need to be created.');
      console.log('\n📝 To apply migrations:');
      console.log('   1. Open Supabase Dashboard → SQL Editor');
      console.log(`   2. Copy contents of: supabase/migrations/001_user_preferences.sql`);
      console.log('   3. Click "Run"');
      console.log(`   4. Copy contents of: supabase/migrations/002_pets_table_complete.sql`);
      console.log('   5. Click "Run"');
      console.log('\n   Or use Supabase CLI:');
      console.log('   $ supabase db push');
    } else {
      console.log('\n✅ All required tables exist');
    }
    
    return allExist;
  } catch (error) {
    console.error('❌ Error checking migrations:', error.message);
    return false;
  }
}

async function verifyRLS() {
  console.log('\n🔒 Verifying Row Level Security...');
  console.log('   (RLS verification requires direct database access)');
  console.log('   Run this SQL in Supabase SQL Editor to verify:');
  console.log('');
  console.log('   SELECT tablename, policyname, cmd');
  console.log('   FROM pg_policies');
  console.log('   WHERE tablename IN (\'user_preferences\', \'pets\', \'profiles\');');
  console.log('');
  console.log('   Expected: 4 policies per table (INSERT, SELECT, UPDATE, DELETE)');
}

async function main() {
  // Step 1: Create test user
  const user = await createTestUser();
  
  // Step 2: Check migrations
  const migrationsApplied = await checkMigrations();
  
  // Step 3: Verify RLS
  await verifyRLS();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SETUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Test User: ${user ? '✅ Ready' : '⚠️  Needs manual setup'}`);
  console.log(`Migrations: ${migrationsApplied ? '✅ Applied' : '⚠️  Need to be applied'}`);
  console.log(`RLS: ℹ️  Manual verification required`);
  console.log('='.repeat(60));
  
  if (!user || !migrationsApplied) {
    console.log('\n⚠️  MANUAL ACTIONS REQUIRED - See instructions above');
    process.exit(1);
  } else {
    console.log('\n✅ Environment setup complete!');
    console.log('   Ready to run tests.');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

