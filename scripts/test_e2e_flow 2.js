#!/usr/bin/env node
/**
 * End-to-End Testing Script
 * Tests: Signup → Profile → Pet → Dashboard → Shop
 * Run: node scripts/test_e2e_flow.js
 */

require('dotenv').config({ path: './frontend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Optional

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminSupabase = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

const TEST_EMAIL = `test_${Date.now()}@fbla-test.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_USERNAME = `testuser_${Date.now()}`;

let testUserId = null;
let testProfileId = null;
let testPetId = null;

async function testSignup() {
  console.log('\n📝 Test 1: User Signup');
  console.log('─'.repeat(50));
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          username: TEST_USERNAME
        }
      }
    });
    
    if (error) throw error;
    
    if (data.user) {
      testUserId = data.user.id;
      console.log(`✅ User created: ${data.user.email}`);
      console.log(`   User ID: ${testUserId}`);
      return true;
    } else {
      console.log('⚠️  Signup initiated (email confirmation may be required)');
      return false;
    }
  } catch (error) {
    console.error('❌ Signup failed:', error.message);
    return false;
  }
}

async function testProfileCreation() {
  console.log('\n👤 Test 2: Profile Creation');
  console.log('─'.repeat(50));
  
  if (!testUserId) {
    console.log('⏭️  Skipped (no user ID)');
    return false;
  }
  
  try {
    // Check if profile was auto-created
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      testProfileId = data.id;
      console.log(`✅ Profile found: ${data.username}`);
      console.log(`   Coins: ${data.coins}`);
      return true;
    } else {
      console.log('⚠️  Profile not auto-created (may need manual creation)');
      return false;
    }
  } catch (error) {
    console.error('❌ Profile check failed:', error.message);
    return false;
  }
}

async function testPetCreation() {
  console.log('\n🐾 Test 3: Pet Creation');
  console.log('─'.repeat(50));
  
  if (!testUserId) {
    console.log('⏭️  Skipped (no user ID)');
    return false;
  }
  
  try {
    const petData = {
      user_id: testUserId,
      name: 'TestPet',
      species: 'dog',
      breed: 'labrador',
      age: 0,
      level: 1,
      health: 100,
      hunger: 75,
      happiness: 80,
      cleanliness: 90,
      energy: 85,
      xp: 0,
    };
    
    const { data, error } = await supabase
      .from('pets')
      .insert([petData])
      .select()
      .single();
    
    if (error) throw error;
    
    if (data) {
      testPetId = data.id;
      console.log(`✅ Pet created: ${data.name}`);
      console.log(`   Species: ${data.species}, Level: ${data.level}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Pet creation failed:', error.message);
    return false;
  }
}

async function testDashboardActions() {
  console.log('\n🎮 Test 4: Dashboard Actions');
  console.log('─'.repeat(50));
  
  if (!testPetId || !testUserId) {
    console.log('⏭️  Skipped (no pet or user ID)');
    return false;
  }
  
  try {
    // Test updating pet stats (simulate feed action)
    const { data: before } = await supabase
      .from('pets')
      .select('hunger, health')
      .eq('id', testPetId)
      .single();
    
    console.log(`   Before: hunger=${before?.hunger}, health=${before?.health}`);
    
    const { data: updated, error } = await supabase
      .from('pets')
      .update({
        hunger: Math.min(100, (before?.hunger || 75) + 30),
        health: Math.min(100, (before?.health || 100) + 5),
        updated_at: new Date().toISOString()
      })
      .eq('id', testPetId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`   After: hunger=${updated.hunger}, health=${updated.health}`);
    console.log('✅ Pet stats updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Dashboard action failed:', error.message);
    return false;
  }
}

async function testShopPurchase() {
  console.log('\n🛒 Test 5: Shop Purchase');
  console.log('─'.repeat(50));
  
  if (!testUserId || !testPetId || !testProfileId) {
    console.log('⏭️  Skipped (missing IDs)');
    return false;
  }
  
  try {
    // Get current balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('user_id', testUserId)
      .single();
    
    const beforeBalance = profile?.coins || 0;
    console.log(`   Balance before: ${beforeBalance} coins`);
    
    const purchaseCost = 25;
    const newBalance = beforeBalance - purchaseCost;
    
    // Deduct coins
    const { error: coinError } = await supabase
      .from('profiles')
      .update({ coins: newBalance })
      .eq('user_id', testUserId);
    
    if (coinError) throw coinError;
    
    // Update pet stats (simulate medicine purchase)
    const { data: pet } = await supabase
      .from('pets')
      .select('health')
      .eq('id', testPetId)
      .single();
    
    const { error: petError } = await supabase
      .from('pets')
      .update({
        health: Math.min(100, (pet?.health || 100) + 30),
        updated_at: new Date().toISOString()
      })
      .eq('id', testPetId);
    
    if (petError) throw petError;
    
    // Try to add to inventory (optional)
    try {
      await supabase
        .from('pet_inventory')
        .insert({
          user_id: testUserId,
          pet_id: testPetId,
          item_id: 'test_medicine',
          item_name: 'Test Medicine',
          quantity: 1,
        });
      console.log('✅ Inventory item added');
    } catch (invError) {
      if (invError.code === '42P01') {
        console.log('⚠️  Inventory table not found (optional feature)');
      } else {
        console.warn('⚠️  Inventory add failed:', invError.message);
      }
    }
    
    console.log(`   Balance after: ${newBalance} coins`);
    console.log('✅ Purchase processed successfully');
    return true;
  } catch (error) {
    console.error('❌ Shop purchase failed:', error.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleanup: Removing test data');
  console.log('─'.repeat(50));
  
  if (!adminSupabase) {
    console.log('⚠️  Service role key not provided - skipping cleanup');
    console.log('   Test user:', TEST_EMAIL);
    return;
  }
  
  try {
    if (testUserId) {
      // Delete user (cascades to profile, pet, inventory)
      const { error } = await adminSupabase.auth.admin.deleteUser(testUserId);
      if (error && error.message !== 'User not found') {
        console.warn('⚠️  Cleanup warning:', error.message);
      } else {
        console.log('✅ Test user deleted');
      }
    }
  } catch (error) {
    console.warn('⚠️  Cleanup error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting End-to-End Tests');
  console.log('═'.repeat(50));
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log(`Test Username: ${TEST_USERNAME}`);
  console.log('═'.repeat(50));
  
  const results = {
    signup: await testSignup(),
    profile: await testProfileCreation(),
    pet: await testPetCreation(),
    dashboard: await testDashboardActions(),
    shop: await testShopPurchase(),
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('═'.repeat(50));
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  }
  console.log('═'.repeat(50));
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '✅' : '❌'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  await cleanup();
  
  return allPassed;
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });

