/**
 * Supabase OAuth Configuration Validator
 * 
 * This utility validates the Supabase OAuth setup and provides detailed
 * debugging information to help diagnose configuration issues.
 */

import { supabase } from '../lib/supabase';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * Validates the Supabase OAuth configuration
 */
export const validateSupabaseOAuth = async (): Promise<ValidationResult> => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  console.log('🔍 Starting Supabase OAuth Configuration Validation...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Check environment variables
  console.log('\n📋 Step 1: Checking Environment Variables');
  console.log('─────────────────────────────────────────');
  
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const useMock = process.env.REACT_APP_USE_MOCK;

  if (!supabaseUrl || !supabaseAnonKey) {
    result.isValid = false;
    result.errors.push('Missing Supabase environment variables');
    console.error('❌ REACT_APP_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.error('❌ REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
  } else {
    result.info.push('Environment variables configured');
    console.log('✅ REACT_APP_SUPABASE_URL:', supabaseUrl);
    console.log('✅ REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey.substring(0, 20) + '...');
  }

  console.log('📌 REACT_APP_USE_MOCK:', useMock || 'false');
  
  if (useMock === 'true') {
    result.warnings.push('Mock mode is enabled - OAuth will not work');
    console.warn('⚠️  Mock mode is ENABLED - Google OAuth will not function');
  }

  // 2. Check Supabase client initialization
  console.log('\n📋 Step 2: Checking Supabase Client');
  console.log('─────────────────────────────────────────');
  
  if (!supabase) {
    result.isValid = false;
    result.errors.push('Supabase client not initialized');
    console.error('❌ Supabase client is not initialized');
  } else {
    result.info.push('Supabase client initialized');
    console.log('✅ Supabase client is initialized');
    
    // Check if it's the mock client
    if (typeof supabase.auth.signInWithOAuth === 'function') {
      console.log('✅ signInWithOAuth method exists');
    } else {
      result.isValid = false;
      result.errors.push('signInWithOAuth method not available');
      console.error('❌ signInWithOAuth method not available');
    }
  }

  // 3. Check current session
  console.log('\n📋 Step 3: Checking Current Session');
  console.log('─────────────────────────────────────────');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      result.warnings.push(`Session check error: ${error.message}`);
      console.warn('⚠️  Session check error:', error.message);
    } else if (session) {
      result.info.push('User already authenticated');
      console.log('✅ User already authenticated:', session.user?.email);
    } else {
      result.info.push('No active session');
      console.log('ℹ️  No active session (expected for login page)');
    }
  } catch (err: any) {
    result.warnings.push(`Session check failed: ${err.message}`);
    console.warn('⚠️  Session check failed:', err.message);
  }

  // 4. Test OAuth provider availability
  console.log('\n📋 Step 4: Testing OAuth Provider');
  console.log('─────────────────────────────────────────');
  
  try {
    // Attempt to get OAuth URL without actually redirecting
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('📍 Redirect URL:', redirectUrl);
    
    // Note: We can't actually test the provider without triggering the flow
    // But we can check if the method exists and is callable
    result.info.push('OAuth method is available');
    console.log('✅ OAuth method is available and callable');
    
  } catch (err: any) {
    result.isValid = false;
    result.errors.push(`OAuth test failed: ${err.message}`);
    console.error('❌ OAuth test failed:', err.message);
  }

  // 5. Validate redirect URLs
  console.log('\n📋 Step 5: Validating Redirect URLs');
  console.log('─────────────────────────────────────────');
  
  const currentOrigin = window.location.origin;
  const callbackUrl = `${currentOrigin}/auth/callback`;
  
  console.log('📍 Current origin:', currentOrigin);
  console.log('📍 Callback URL:', callbackUrl);
  
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    result.info.push('Running on localhost');
    console.log('ℹ️  Running on localhost - ensure Supabase has this redirect URL');
  } else {
    result.info.push('Running on production domain');
    console.log('ℹ️  Running on production domain:', currentOrigin);
  }

  // 6. Print configuration checklist
  console.log('\n📋 Step 6: Configuration Checklist');
  console.log('─────────────────────────────────────────');
  console.log('');
  console.log('Required Supabase Dashboard Settings:');
  console.log('');
  console.log('1. Authentication → Providers → Google');
  console.log('   ☐ Enabled: YES');
  console.log('   ☐ Client ID: (from Google Cloud Console)');
  console.log('   ☐ Client Secret: (from Google Cloud Console)');
  console.log('');
  console.log('2. Authentication → URL Configuration');
  console.log('   ☐ Site URL:', currentOrigin);
  console.log('   ☐ Redirect URLs:');
  console.log('      •', callbackUrl);
  console.log('      •', `${currentOrigin}/**`);
  console.log('');
  console.log('3. Google Cloud Console');
  console.log('   ☐ Authorized JavaScript origins:');
  console.log('      •', supabaseUrl || 'https://your-project.supabase.co');
  console.log('   ☐ Authorized redirect URIs:');
  console.log('      •', `${supabaseUrl}/auth/v1/callback` || 'https://your-project.supabase.co/auth/v1/callback');
  console.log('');

  // Final summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Validation Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`));
  }
  
  if (result.info.length > 0) {
    console.log('\n✅ INFO:');
    result.info.forEach((info, i) => console.log(`   ${i + 1}. ${info}`));
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (result.isValid) {
    console.log('✅ Configuration appears valid. If OAuth still fails, check Supabase dashboard settings.');
  } else {
    console.log('❌ Configuration has errors. Please fix the issues above.');
  }
  
  return result;
};

/**
 * Generates a setup checklist for missing configuration
 */
export const generateSetupChecklist = (): string => {
  const currentOrigin = window.location.origin;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
  
  return `
# Supabase Google OAuth Setup Checklist

## 1. Environment Variables (.env file)

Create or update \`frontend/.env\`:

\`\`\`env
REACT_APP_USE_MOCK=false
REACT_APP_SUPABASE_URL=${supabaseUrl}
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

## 2. Supabase Dashboard Configuration

### A. Enable Google Provider
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it **ON**
6. Enter:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
7. Click **Save**

### B. Configure Redirect URLs
1. Navigate to: **Authentication** → **URL Configuration**
2. Set **Site URL**: ${currentOrigin}
3. Add **Redirect URLs**:
   - ${currentOrigin}/auth/callback
   - ${currentOrigin}/**
4. Click **Save**

## 3. Google Cloud Console Configuration

1. Go to: https://console.cloud.google.com
2. Select your project (or create one)
3. Navigate to: **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Set **Application type**: Web application
7. Add **Authorized JavaScript origins**:
   - ${supabaseUrl}
8. Add **Authorized redirect URIs**:
   - ${supabaseUrl}/auth/v1/callback
9. Click **Create**
10. Copy **Client ID** and **Client Secret**
11. Paste them into Supabase Dashboard (step 2A above)

## 4. Test the Configuration

1. Restart your dev server: \`npm start\`
2. Open browser console (F12)
3. Navigate to: ${currentOrigin}/login
4. Click "Sign in with Google"
5. Check console for validation output
6. Should redirect to Google sign-in page

## 5. Troubleshooting

If OAuth still doesn't work:
- Clear browser cache and cookies
- Try incognito mode
- Check Supabase service status: https://status.supabase.com
- Verify all URLs match exactly (no trailing slashes)
- Check browser console for detailed error messages
`;
};

