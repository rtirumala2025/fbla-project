/**
 * End-to-end test for deployed send-welcome-email Edge Function
 * 
 * Usage:
 *   node scripts/test-deployed-welcome-email.js
 * 
 * Requires environment variables:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xhhtkjtcdeewesijxbts.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-welcome-email`;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('   Please set it in your .env file or export it:');
  console.error('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testResults = {
  emailSent: false,
  emailContent: null,
  databaseLog: null,
  warnings: [],
  errors: [],
  retries: 0,
};

async function testWelcomeEmailFunction() {
  console.log('🧪 Testing Deployed Welcome Email Edge Function');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('Configuration:');
  console.log(`   Function URL: ${EDGE_FUNCTION_URL}`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Service Key: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}\n`);

  let testUserId = null;
  let testProfileId = null;

  try {
    // Step 1: Create a test user
    console.log('Step 1: Creating test user...');
    const testEmail = `test-welcome-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message || 'Unknown error'}`);
    }

    testUserId = authData.user.id;
    console.log(`✅ Test user created: ${testEmail} (${testUserId})\n`);

    // Step 2: Create a test profile
    console.log('Step 2: Creating test profile...');
    const testUsername = `testuser_${Date.now()}`;
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: testUserId,
        username: testUsername,
        coins: 100,
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    testProfileId = profileData.id;
    console.log(`✅ Profile created: ${testUsername} (${testProfileId})\n`);

    // Step 3: Create a test pet (optional, to test pet info in email)
    console.log('Step 3: Creating test pet...');
    try {
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .insert({
          user_id: testUserId,
          name: 'Test Pet',
          species: 'dog',
          breed: 'Golden Retriever',
          color_pattern: 'Golden',
        })
        .select()
        .single();

      if (!petError && petData) {
        console.log(`✅ Test pet created: ${petData.name}\n`);
      } else {
        console.log(`⚠️  Pet creation skipped (optional): ${petError?.message || 'Unknown'}\n`);
      }
    } catch (petErr) {
      console.log(`⚠️  Pet creation skipped (optional)\n`);
    }

    // Step 4: Call the edge function directly
    console.log('Step 4: Calling deployed edge function...');
    const functionResponse = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        user_id: testUserId,
        profile_id: testProfileId,
      }),
    });

    const functionResult = await functionResponse.json();
    
    if (functionResponse.ok && functionResult.success) {
      testResults.emailSent = true;
      testResults.emailContent = {
        subject: `Welcome to Virtual Pet, ${testUsername}! 🎉`,
        recipient: testEmail,
        timestamp: functionResult.timestamp,
      };
      console.log('✅ Edge function executed successfully');
      console.log(`   Message: ${functionResult.message}`);
      console.log(`   Email: ${functionResult.email}`);
      console.log(`   Timestamp: ${functionResult.timestamp}\n`);
    } else {
      testResults.errors.push(`Function call failed: ${functionResult.error || `HTTP ${functionResponse.status}`}`);
      console.error('❌ Edge function failed:');
      console.error(`   Error: ${functionResult.error || `HTTP ${functionResponse.status}`}`);
      console.error(`   Response: ${JSON.stringify(functionResult, null, 2)}\n`);
    }

    // Step 5: Wait for async operations to complete
    console.log('Step 5: Waiting for async operations...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 6: Check email_logs table
    console.log('Step 6: Checking email_logs table...');
    const { data: emailLogs, error: logError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', testUserId)
      .eq('email_type', 'welcome')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logError) {
      testResults.errors.push(`Failed to query email_logs: ${logError.message}`);
      console.error('❌ Failed to query email_logs:', logError);
    } else if (emailLogs && emailLogs.length > 0) {
      const latestLog = emailLogs[0];
      testResults.databaseLog = {
        id: latestLog.id,
        status: latestLog.status,
        email: latestLog.email_address,
        subject: latestLog.subject,
        sentAt: latestLog.sent_at,
        errorMessage: latestLog.error_message,
        createdAt: latestLog.created_at,
      };

      console.log('✅ Email log found:');
      console.log(`   ID: ${latestLog.id}`);
      console.log(`   Status: ${latestLog.status}`);
      console.log(`   Email: ${latestLog.email_address}`);
      console.log(`   Subject: ${latestLog.subject}`);
      console.log(`   Created: ${latestLog.created_at}`);
      console.log(`   Sent: ${latestLog.sent_at || 'Not sent yet'}`);
      
      if (latestLog.error_message) {
        console.log(`   Error: ${latestLog.error_message}`);
        testResults.warnings.push(`Email log shows error: ${latestLog.error_message}`);
      }

      if (latestLog.status === 'pending') {
        testResults.warnings.push('Email status is still "pending" - may need more time to process');
      }

      // Check for retries (multiple log entries)
      if (emailLogs.length > 1) {
        testResults.retries = emailLogs.length - 1;
        console.log(`   Note: ${emailLogs.length - 1} additional log entries found (possible retries)`);
      }
      console.log();
    } else {
      testResults.errors.push('No email log entries found');
      console.warn('⚠️  No email log entries found for this user\n');
    }

    // Step 7: Verify email content structure (if we can infer it)
    if (testResults.databaseLog && testResults.databaseLog.subject) {
      console.log('Step 7: Verifying email content structure...');
      const subject = testResults.databaseLog.subject;
      
      if (subject.includes('Welcome') && subject.includes(testUsername)) {
        console.log('✅ Email subject includes user name');
      } else {
        testResults.warnings.push('Email subject may not include user name correctly');
      }
      
      if (subject.includes('🎉')) {
        console.log('✅ Email subject includes emoji');
      }
      console.log();
    }

    // Cleanup: Delete test user (this will cascade delete profile and pet)
    console.log('Cleanup: Deleting test user...');
    try {
      await supabase.auth.admin.deleteUser(testUserId);
      console.log('✅ Test user deleted\n');
    } catch (cleanupError) {
      testResults.warnings.push(`Failed to delete test user: ${cleanupError.message}`);
      console.warn(`⚠️  Failed to delete test user: ${cleanupError.message}\n`);
    }

  } catch (error) {
    testResults.errors.push(error.message);
    console.error('❌ Test failed:', error);
    
    // Attempt cleanup
    if (testUserId) {
      try {
        await supabase.auth.admin.deleteUser(testUserId);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  // Generate final report
  generateReport();
}

function generateReport() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Welcome Email Function Test Report');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('1. Email Sent Status:');
  if (testResults.emailSent) {
    console.log('   ✅ Email sent successfully');
    if (testResults.emailContent) {
      console.log(`   Recipient: ${testResults.emailContent.recipient}`);
      console.log(`   Timestamp: ${testResults.emailContent.timestamp}`);
    }
  } else {
    console.log('   ❌ Email not sent');
  }
  console.log();

  console.log('2. Email Content Preview:');
  if (testResults.databaseLog) {
    console.log(`   Subject: ${testResults.databaseLog.subject}`);
    console.log(`   Status: ${testResults.databaseLog.status}`);
    console.log(`   Email Address: ${testResults.databaseLog.email}`);
    if (testResults.databaseLog.sentAt) {
      console.log(`   Sent At: ${testResults.databaseLog.sentAt}`);
    }
  } else {
    console.log('   ⚠️  No email log data available');
  }
  console.log();

  console.log('3. Database Log Entry Verification:');
  if (testResults.databaseLog) {
    console.log('   ✅ Email log entry found');
    console.log(`   Log ID: ${testResults.databaseLog.id}`);
    console.log(`   Status: ${testResults.databaseLog.status}`);
    console.log(`   Created: ${testResults.databaseLog.createdAt}`);
    if (testResults.databaseLog.status === 'sent') {
      console.log('   ✅ Status: SENT (success)');
    } else if (testResults.databaseLog.status === 'failed') {
      console.log('   ❌ Status: FAILED');
      if (testResults.databaseLog.errorMessage) {
        console.log(`   Error: ${testResults.databaseLog.errorMessage}`);
      }
    } else {
      console.log(`   ⏳ Status: ${testResults.databaseLog.status} (pending)`);
    }
  } else {
    console.log('   ❌ No database log entry found');
  }
  console.log();

  if (testResults.retries > 0) {
    console.log('4. Retries:');
    console.log(`   ⚠️  ${testResults.retries} retry attempt(s) detected`);
    console.log();
  }

  if (testResults.warnings.length > 0) {
    console.log('5. Warnings:');
    testResults.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ⚠️  ${warning}`);
    });
    console.log();
  }

  if (testResults.errors.length > 0) {
    console.log('6. Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ❌ ${error}`);
    });
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════');
  
  const allPassed = testResults.emailSent && 
                    testResults.databaseLog && 
                    testResults.databaseLog.status === 'sent' &&
                    testResults.errors.length === 0;

  if (allPassed) {
    console.log('✅ Welcome email function tested successfully.');
  } else {
    console.log('⚠️  Test completed with warnings or errors.');
    console.log('   Review the details above for more information.');
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run the test
if (require.main === module) {
  testWelcomeEmailFunction().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testWelcomeEmailFunction };

