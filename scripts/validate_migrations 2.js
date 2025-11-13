#!/usr/bin/env node
/**
 * Validation script to check if all database migrations are applied
 * Run: node scripts/validate_migrations.js
 */

require('dotenv').config({ path: './frontend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function validateMigrations() {
  console.log('🔍 Validating Database Migrations...\n');
  
  const requiredTables = [
    'profiles',
    'pets',
    'user_preferences',
    'pet_inventory'
  ];
  
  const results = {
    tables: {},
    rls: {},
    policies: {},
    overall: true
  };
  
  for (const tableName of requiredTables) {
    try {
      // Check if table exists by attempting a query
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          console.log(`❌ Table "${tableName}" does NOT exist`);
          results.tables[tableName] = false;
          results.overall = false;
          continue;
        } else {
          // Other error (might be RLS or permission)
          console.log(`⚠️  Table "${tableName}" exists but query failed: ${error.message}`);
          results.tables[tableName] = true;
        }
      } else {
        console.log(`✅ Table "${tableName}" exists`);
        results.tables[tableName] = true;
      }
      
      // Check RLS (this requires a direct SQL query, which we can't do with anon key)
      // We'll assume RLS is enabled if we can query (anon key would fail if RLS wasn't set up)
      results.rls[tableName] = error?.code !== '42501'; // 42501 = insufficient privileges
      
    } catch (err) {
      console.error(`❌ Error checking table "${tableName}":`, err.message);
      results.tables[tableName] = false;
      results.overall = false;
    }
  }
  
  console.log('\n📊 Validation Summary:');
  console.log('─'.repeat(50));
  
  for (const [table, exists] of Object.entries(results.tables)) {
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${table}`);
  }
  
  console.log('─'.repeat(50));
  
  if (results.overall) {
    console.log('\n✅ All required tables exist!');
    console.log('⚠️  Note: RLS verification requires SQL Editor access');
    console.log('   Please verify RLS is enabled in Supabase Dashboard → Table Editor');
  } else {
    console.log('\n❌ Some tables are missing!');
    console.log('📝 Next steps:');
    console.log('   1. Go to Supabase SQL Editor');
    console.log('   2. Run missing migrations from supabase/migrations/');
    console.log('   3. Re-run this validation script');
  }
  
  return results;
}

// Run validation
validateMigrations()
  .then(results => {
    process.exit(results.overall ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });

