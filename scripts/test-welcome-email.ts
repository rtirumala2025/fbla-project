/**
 * Test script for welcome email functionality
 * 
 * Usage:
 *   deno run --allow-net --allow-env scripts/test-welcome-email.ts
 * 
 * Or with Node/TypeScript:
 *   ts-node scripts/test-welcome-email.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || process.env.SUPABASE_URL || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

async function testWelcomeEmail(): Promise<void> {
  console.log('🧪 Testing Welcome Email Functionality\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Check environment variables
  console.log('Environment Check:');
  const resendKey = Deno.env.get('RESEND_API_KEY') || process.env.RESEND_API_KEY;
  const smtpHost = Deno.env.get('SMTP_HOST') || process.env.SMTP_HOST;
  const appUrl = Deno.env.get('APP_URL') || process.env.APP_URL;
  
  console.log(`   RESEND_API_KEY: ${resendKey ? '✅ Set' : '❌ Not set (emails will not send)'}`);
  console.log(`   SMTP_HOST: ${smtpHost ? '✅ Set' : '❌ Not set'}`);
  console.log(`   APP_URL: ${appUrl ? `✅ ${appUrl}` : '❌ Not set'}`);
  console.log();
  
  if (!resendKey && !smtpHost) {
    console.log('⚠️  WARNING: No email service configured!');
    console.log('   Emails will be logged but not sent.');
    console.log('   Set RESEND_API_KEY or SMTP credentials to enable sending.\n');
  }

  const results: TestResult[] = [];

  // Step 1: Check email_logs table exists
  console.log('Step 1: Checking email_logs table...');
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }
    results.push({
      step: 'Check email_logs table',
      success: true,
      message: 'Email logs table exists and is accessible',
    });
    console.log('✅ Email logs table exists\n');
  } catch (error) {
    results.push({
      step: 'Check email_logs table',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.error('❌ Failed to access email_logs table:', error);
    console.error('   Run migration 011_email_logging.sql first\n');
  }

  // Step 2: Create a test user
  console.log('Step 2: Creating test user...');
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let testUserId: string | null = null;

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw authError || new Error('Failed to create test user');
    }

    testUserId = authData.user.id;
    results.push({
      step: 'Create test user',
      success: true,
      message: `Test user created: ${testEmail}`,
      data: { userId: testUserId },
    });
    console.log(`✅ Test user created: ${testEmail} (${testUserId})\n`);
  } catch (error) {
    results.push({
      step: 'Create test user',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.error('❌ Failed to create test user:', error);
    console.error('   Skipping remaining tests\n');
    printResults(results);
    return;
  }

  // Step 3: Create a test profile (this should trigger the email)
  console.log('Step 3: Creating test profile (should trigger welcome email)...');
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: testUserId,
        username: `testuser_${Date.now()}`,
        coins: 100,
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    results.push({
      step: 'Create test profile',
      success: true,
      message: 'Profile created successfully',
      data: { profileId: profileData.id },
    });
    console.log(`✅ Profile created: ${profileData.username}\n`);

    // Wait a bit for the trigger to execute
    console.log('⏳ Waiting for email trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (error) {
    results.push({
      step: 'Create test profile',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.error('❌ Failed to create profile:', error);
  }

  // Step 4: Check email log
  console.log('Step 4: Checking email log...');
  try {
    const { data: emailLogs, error: logError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', testUserId)
      .eq('email_type', 'welcome')
      .order('created_at', { ascending: false })
      .limit(1);

    if (logError) {
      throw logError;
    }

    if (emailLogs && emailLogs.length > 0) {
      const log = emailLogs[0];
      results.push({
        step: 'Check email log',
        success: true,
        message: `Email log found: ${log.status}`,
        data: {
          status: log.status,
          email: log.email_address,
          sentAt: log.sent_at,
          error: log.error_message,
        },
      });
      console.log('✅ Email log found:');
      console.log(`   Status: ${log.status}`);
      console.log(`   Email: ${log.email_address}`);
      console.log(`   Sent at: ${log.sent_at || 'Not sent yet'}`);
      if (log.error_message) {
        console.log(`   Error: ${log.error_message}`);
      }
      console.log();
    } else {
      results.push({
        step: 'Check email log',
        success: false,
        message: 'No email log found - trigger may not have executed',
      });
      console.warn('⚠️ No email log found. The trigger may not have executed.\n');
    }
  } catch (error) {
    results.push({
      step: 'Check email log',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.error('❌ Failed to check email log:', error);
  }

  // Step 5: Test edge function directly
  console.log('Step 5: Testing edge function directly...');
  try {
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-welcome-email`;
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        user_id: testUserId,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      results.push({
        step: 'Test edge function',
        success: true,
        message: 'Edge function executed successfully',
        data: result,
      });
      console.log('✅ Edge function executed successfully');
      console.log(`   Message: ${result.message}`);
      console.log(`   Timestamp: ${result.timestamp}`);
      console.log(`   Email: ${result.email}\n`);
    } else {
      results.push({
        step: 'Test edge function',
        success: false,
        message: result.error || `HTTP ${response.status}`,
        data: result,
      });
      console.error('❌ Edge function failed:', result);
      if (result.error?.includes('RESEND_API_KEY') || result.error?.includes('SMTP')) {
        console.error('   💡 Tip: Configure email service (RESEND_API_KEY or SMTP credentials)');
      }
    }
  } catch (error) {
    results.push({
      step: 'Test edge function',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.error('❌ Failed to call edge function:', error);
  }

  // Step 6: Verify email log status after direct call
  console.log('Step 6: Verifying final email log status...');
  try {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for async operations
    
    const { data: finalLogs, error: finalLogError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', testUserId)
      .eq('email_type', 'welcome')
      .order('created_at', { ascending: false })
      .limit(1);

    if (finalLogError) {
      throw finalLogError;
    }

    if (finalLogs && finalLogs.length > 0) {
      const log = finalLogs[0];
      results.push({
        step: 'Verify final email log',
        success: true,
        message: `Final status: ${log.status}`,
        data: {
          status: log.status,
          email: log.email_address,
          sentAt: log.sent_at,
          error: log.error_message,
        },
      });
      console.log('✅ Final email log status:');
      console.log(`   Status: ${log.status}`);
      if (log.status === 'sent') {
        console.log(`   ✅ Email sent successfully at: ${log.sent_at}`);
      } else if (log.status === 'failed') {
        console.log(`   ⚠️ Email failed: ${log.error_message || 'Unknown error'}`);
        if (log.error_message?.includes('RESEND_API_KEY') || log.error_message?.includes('SMTP')) {
          console.log(`   💡 Configure email service to enable sending`);
        }
      } else {
        console.log(`   ⏳ Email status: ${log.status}`);
      }
      console.log();
    }
  } catch (error) {
    results.push({
      step: 'Verify final email log',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.error('❌ Failed to verify final email log:', error);
  }

  // Cleanup: Delete test user
  console.log('Cleanup: Deleting test user...');
  if (testUserId) {
    try {
      await supabase.auth.admin.deleteUser(testUserId);
      console.log('✅ Test user deleted\n');
    } catch (error) {
      console.warn('⚠️ Failed to delete test user:', error);
    }
  }

  // Print summary
  printResults(results);
}

function printResults(results: TestResult[]): void {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Test Results Summary');
  console.log('═══════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.step}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
    }
    console.log();

    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Please review the errors above.');
  }
}

// Run the test
if (import.meta.main) {
  testWelcomeEmail().catch(console.error);
}

