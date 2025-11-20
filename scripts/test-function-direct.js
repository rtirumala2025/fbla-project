/**
 * Direct test of deployed welcome email function
 * Tests the function endpoint directly without creating users
 */

const EDGE_FUNCTION_URL = 'https://xhhtkjtcdeewesijxbts.supabase.co/functions/v1/send-welcome-email';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaHRranRjZGVld2VzaWp4YnRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzNDI1OCwiZXhwIjoyMDc2NzEwMjU4fQ.Iow-oAe9_srUtAGT1T7TJj8q53cskle2ybJCjQ04YGc';

async function testFunctionDirectly() {
  console.log('🧪 Testing Welcome Email Function Directly');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Function URL: ${EDGE_FUNCTION_URL}\n`);

  // Test with a sample user_id (this will fail but we can see the response)
  const testUserId = '00000000-0000-0000-0000-000000000000';
  
  console.log('Step 1: Calling function with test user_id...');
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        user_id: testUserId,
      }),
    });

    const result = await response.json();
    
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body:`, JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('\n✅ Function executed successfully');
    } else {
      console.log('\n⚠️  Function returned error (expected for invalid user_id)');
      console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testFunctionDirectly().catch(console.error);

