/**
 * Supabase Connection Test Script
 * 
 * Run this file to verify your Supabase setup is working correctly.
 * 
 * Usage:
 *   1. Make sure you've created .env with real Supabase credentials
 *   2. Run: npm start (then open browser console)
 *   3. Or add this to your App.tsx temporarily to test
 */

import { supabase } from './lib/supabase';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check Supabase client initialization
    console.log('1️⃣ Checking Supabase client initialization...');
    if (!supabase) {
      throw new Error('❌ Supabase client not initialized');
    }
    console.log('✅ Supabase client initialized\n');

    // Test 2: Fetch shop items
    console.log('2️⃣ Fetching shop items...');
    const { data: shopItems, error: shopError } = await supabase
      .from('shop_items')
      .select('*')
      .limit(5);

    if (shopError) {
      console.error('❌ Shop items fetch failed:', shopError.message);
    } else if (!shopItems || shopItems.length === 0) {
      console.warn('⚠️  No shop items found. Make sure to run the SQL setup script.');
    } else {
      console.log('✅ Shop items fetched successfully!');
      console.log(`   Found ${shopItems.length} items:`, shopItems);
    }
    console.log('');

    // Test 3: Check auth session
    console.log('3️⃣ Checking auth session...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message);
    } else if (session?.session) {
      console.log('✅ User is authenticated:', session.session.user.email);
    } else {
      console.log('ℹ️  No active session (user not logged in)');
    }
    console.log('');

    // Test 4: Check tables exist
    console.log('4️⃣ Checking database tables...');
    const tablesToCheck = ['profiles', 'pets', 'shop_items', 'transactions'] as const;
    
    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table as any).select('id').limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          console.error(`❌ Table "${table}" does not exist`);
        } else {
          console.warn(`⚠️  Table "${table}" check returned error:`, error.message);
        }
      } else {
        console.log(`✅ Table "${table}" exists`);
      }
    }
    console.log('');

    // Final summary
    console.log('📊 Test Summary:');
    console.log('─'.repeat(50));
    
    if (!shopError && shopItems && shopItems.length > 0) {
      console.log('🎉 Supabase connection successful!');
      console.log('✅ Database is set up correctly');
      console.log('✅ Ready to proceed with frontend integration');
    } else {
      console.log('⚠️  Supabase connected but setup incomplete');
      console.log('📝 Next steps:');
      console.log('   1. Run the SQL setup script from PHASE_2_SETUP_GUIDE.md');
      console.log('   2. Verify tables in Supabase Dashboard');
      console.log('   3. Re-run this test');
    }
    console.log('─'.repeat(50));

    return { success: !shopError && shopItems && shopItems.length > 0 };

  } catch (error: any) {
    console.error('❌ Supabase connection test failed:', error.message);
    console.log('\n📝 Troubleshooting:');
    console.log('   1. Check your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('   2. Restart the dev server after changing .env');
    console.log('   3. Verify your Supabase project is active');
    console.log('   4. Check PHASE_2_SETUP_GUIDE.md for setup instructions');
    
    return { success: false, error };
  }
}

// Auto-run in development (optional - uncomment the line below if needed)
// if (process.env.NODE_ENV === 'development') {
//   testSupabaseConnection();
// }

