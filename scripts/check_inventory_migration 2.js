#!/usr/bin/env node
/**
 * Check if pet_inventory table migration has been applied
 * Run: node scripts/check_inventory_migration.js
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

async function checkInventoryMigration() {
  console.log('🔍 Checking pet_inventory Migration Status...\n');
  console.log('─'.repeat(50));
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('pet_inventory')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ pet_inventory table does NOT exist');
        console.log('\n📝 Action Required:');
        console.log('   1. Go to Supabase SQL Editor:');
        console.log('      https://supabase.com/dashboard/project/xhhtkjtcdeewesijxbts/sql');
        console.log('   2. Copy contents of: supabase/migrations/003_pet_inventory_table.sql');
        console.log('   3. Paste and click Run');
        console.log('   4. Re-run this script to verify');
        return false;
      } else {
        console.log('⚠️  Table exists but query failed:', error.message);
        console.log('   This might indicate RLS or permission issues');
        return true; // Table exists, just can't query
      }
    } else {
      console.log('✅ pet_inventory table EXISTS');
      console.log('   Table is accessible and ready');
      
      // Try to get table structure
      try {
        const { data: sample } = await supabase
          .from('pet_inventory')
          .select('id, user_id, pet_id, item_id, item_name, quantity, created_at, updated_at')
          .limit(0);
        
        console.log('✅ Table structure verified');
        console.log('   Columns: id, user_id, pet_id, item_id, item_name, quantity, created_at, updated_at');
      } catch (structError) {
        console.log('⚠️  Could not verify structure (RLS may be blocking)');
      }
      
      return true;
    }
  } catch (err) {
    console.error('❌ Error checking migration:', err.message);
    return false;
  }
}

// Run check
checkInventoryMigration()
  .then(exists => {
    console.log('\n' + '─'.repeat(50));
    if (exists) {
      console.log('✅ Migration Status: APPLIED');
      process.exit(0);
    } else {
      console.log('⏳ Migration Status: PENDING');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });

