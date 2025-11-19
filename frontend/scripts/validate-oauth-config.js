/**
 * Google OAuth Configuration Validator
 * 
 * This script validates the frontend environment and Supabase client configuration
 * to ensure Google OAuth works properly.
 * 
 * Usage: node scripts/validate-oauth-config.js
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`),
};

const issues = {
  errors: [],
  warnings: [],
  recommendations: [],
};

function checkEnvFile() {
  log.section('Step 1: Checking .env File');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envExists = fs.existsSync(envPath);
  
  if (!envExists) {
    issues.errors.push('Missing .env file in frontend directory');
    log.error('.env file not found in frontend directory');
    log.info('Expected location: frontend/.env');
    return false;
  }
  
  log.success('.env file exists');
  
  // Read and parse .env file
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');
  
  let hasSupabaseUrl = false;
  let hasSupabaseAnonKey = false;
  let useMock = false;
  
  envLines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) {
      return;
    }
    
    if (trimmed.startsWith('REACT_APP_SUPABASE_URL=')) {
      hasSupabaseUrl = true;
      const value = trimmed.split('=')[1]?.trim();
      if (!value || value === '' || value.includes('your-project')) {
        issues.errors.push('REACT_APP_SUPABASE_URL is not set or contains placeholder value');
        log.error(`REACT_APP_SUPABASE_URL is missing or contains placeholder (line ${index + 1})`);
      } else {
        log.success(`REACT_APP_SUPABASE_URL is set: ${value.substring(0, 50)}...`);
      }
    }
    
    if (trimmed.startsWith('REACT_APP_SUPABASE_ANON_KEY=')) {
      hasSupabaseAnonKey = true;
      const value = trimmed.split('=')[1]?.trim();
      if (!value || value === '' || value.includes('your-anon-key')) {
        issues.errors.push('REACT_APP_SUPABASE_ANON_KEY is not set or contains placeholder value');
        log.error(`REACT_APP_SUPABASE_ANON_KEY is missing or contains placeholder (line ${index + 1})`);
      } else {
        log.success(`REACT_APP_SUPABASE_ANON_KEY is set (length: ${value.length} chars)`);
      }
    }
    
    if (trimmed.startsWith('REACT_APP_USE_MOCK=')) {
      const value = trimmed.split('=')[1]?.trim().toLowerCase();
      if (value === 'true') {
        useMock = true;
        issues.warnings.push('REACT_APP_USE_MOCK is set to true - OAuth will not work');
        log.warning('REACT_APP_USE_MOCK is set to true - Google OAuth will be disabled');
      }
    }
  });
  
  if (!hasSupabaseUrl) {
    issues.errors.push('REACT_APP_SUPABASE_URL is missing from .env file');
    log.error('REACT_APP_SUPABASE_URL not found in .env file');
  }
  
  if (!hasSupabaseAnonKey) {
    issues.errors.push('REACT_APP_SUPABASE_ANON_KEY is missing from .env file');
    log.error('REACT_APP_SUPABASE_ANON_KEY not found in .env file');
  }
  
  return hasSupabaseUrl && hasSupabaseAnonKey && !useMock;
}

function checkSupabaseClientConfig() {
  log.section('Step 2: Checking Supabase Client Configuration');
  
  const supabasePath = path.join(__dirname, '..', 'src', 'lib', 'supabase.ts');
  
  if (!fs.existsSync(supabasePath)) {
    issues.errors.push('Supabase client file not found');
    log.error('supabase.ts file not found');
    return false;
  }
  
  log.success('supabase.ts file exists');
  
  const content = fs.readFileSync(supabasePath, 'utf-8');
  
  // Check for environment variable usage
  if (!content.includes('process.env.REACT_APP_SUPABASE_URL')) {
    issues.errors.push('Supabase client does not use REACT_APP_SUPABASE_URL');
    log.error('REACT_APP_SUPABASE_URL not found in supabase.ts');
  } else {
    log.success('REACT_APP_SUPABASE_URL is used in supabase.ts');
  }
  
  if (!content.includes('process.env.REACT_APP_SUPABASE_ANON_KEY')) {
    issues.errors.push('Supabase client does not use REACT_APP_SUPABASE_ANON_KEY');
    log.error('REACT_APP_SUPABASE_ANON_KEY not found in supabase.ts');
  } else {
    log.success('REACT_APP_SUPABASE_ANON_KEY is used in supabase.ts');
  }
  
  // Check for required auth options
  const requiredOptions = [
    'persistSession: true',
    'autoRefreshToken: true',
    'detectSessionInUrl: true',
  ];
  
  requiredOptions.forEach(option => {
    if (content.includes(option)) {
      log.success(`Auth option configured: ${option}`);
    } else {
      issues.errors.push(`Missing required auth option: ${option}`);
      log.error(`Missing auth option: ${option}`);
    }
  });
  
  return true;
}

function checkOAuthRedirectUrls() {
  log.section('Step 3: Checking OAuth Redirect URLs');
  
  const authContextPath = path.join(__dirname, '..', 'src', 'contexts', 'AuthContext.tsx');
  const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
  
  if (!fs.existsSync(authContextPath)) {
    issues.errors.push('AuthContext.tsx not found');
    log.error('AuthContext.tsx file not found');
    return false;
  }
  
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');
  
  // Check redirect URL construction
  if (authContextContent.includes('window.location.origin') && 
      authContextContent.includes('/auth/callback')) {
    log.success('Redirect URL is correctly constructed using window.location.origin');
  } else {
    issues.warnings.push('Redirect URL construction may not be dynamic');
    log.warning('Redirect URL may not be correctly constructed');
  }
  
  // Check route configuration
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    if (appContent.includes('/auth/callback')) {
      log.success('Auth callback route is configured in App.tsx');
    } else {
      issues.errors.push('Auth callback route not found in App.tsx');
      log.error('Auth callback route not configured');
    }
  }
  
  log.info('Expected redirect URLs:');
  log.info('  Development: http://localhost:3000/auth/callback');
  log.info('  Production: https://xhhtkjtcdeewesijxbts.supabase.co/auth/callback');
  log.info('  (Note: Production redirect should be configured in Supabase Dashboard)');
  
  return true;
}

function checkAuthCallbackComponent() {
  log.section('Step 4: Checking AuthCallback Component');
  
  const callbackPath = path.join(__dirname, '..', 'src', 'pages', 'AuthCallback.tsx');
  
  if (!fs.existsSync(callbackPath)) {
    issues.errors.push('AuthCallback component not found');
    log.error('AuthCallback.tsx file not found');
    return false;
  }
  
  log.success('AuthCallback.tsx file exists');
  
  const content = fs.readFileSync(callbackPath, 'utf-8');
  
  // Check for session handling
  if (content.includes('getSession()')) {
    log.success('Component uses getSession() to retrieve session');
  } else {
    issues.warnings.push('AuthCallback may not be using getSession() correctly');
    log.warning('getSession() usage not found');
  }
  
  // Check for redirect logic
  if (content.includes('/dashboard') && content.includes('/setup-profile')) {
    log.success('Component handles redirects to dashboard and setup-profile');
  } else {
    issues.warnings.push('Redirect logic may be incomplete');
    log.warning('Redirect logic may be missing');
  }
  
  return true;
}

function generateReport() {
  log.section('Validation Summary');
  
  console.log('\n');
  
  if (issues.errors.length > 0) {
    log.error(`Found ${issues.errors.length} error(s):`);
    issues.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }
  
  if (issues.warnings.length > 0) {
    log.warning(`Found ${issues.warnings.length} warning(s):`);
    issues.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }
  
  if (issues.recommendations.length > 0) {
    log.info(`Recommendations:`);
    issues.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }
  
  console.log('\n');
  
  // Additional recommendations
  log.section('Additional Configuration Checklist');
  
  console.log('1. Supabase Dashboard Configuration:');
  console.log('   ☐ Go to: https://supabase.com/dashboard/project/xhhtkjtcdeewesijxbts');
  console.log('   ☐ Navigate to: Authentication → Providers → Google');
  console.log('   ☐ Ensure Google OAuth is enabled');
  console.log('   ☐ Verify Client ID and Client Secret are configured');
  console.log('\n');
  
  console.log('2. Redirect URL Configuration:');
  console.log('   ☐ Navigate to: Authentication → URL Configuration');
  console.log('   ☐ Add Site URL: http://localhost:3000 (for development)');
  console.log('   ☐ Add Redirect URLs:');
  console.log('      • http://localhost:3000/auth/callback');
  console.log('      • http://localhost:3000/**');
  console.log('\n');
  
  console.log('3. Google Cloud Console Configuration:');
  console.log('   ☐ Go to: https://console.cloud.google.com');
  console.log('   ☐ Navigate to: APIs & Services → Credentials');
  console.log('   ☐ Add Authorized JavaScript origins:');
  console.log('      • https://xhhtkjtcdeewesijxbts.supabase.co');
  console.log('   ☐ Add Authorized redirect URIs:');
  console.log('      • https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/callback');
  console.log('\n');
  
  const isValid = issues.errors.length === 0;
  
  if (isValid) {
    log.success('Configuration appears valid!');
    log.info('Next steps:');
    log.info('  1. Ensure Supabase Dashboard settings are configured (see checklist above)');
    log.info('  2. Restart your dev server: npm start');
    log.info('  3. Test Google OAuth by clicking "Sign in with Google" on the login page');
  } else {
    log.error('Configuration has errors that must be fixed before OAuth will work');
  }
  
  return {
    isValid,
    errors: issues.errors,
    warnings: issues.warnings,
    recommendations: issues.recommendations,
  };
}

// Main execution
function main() {
  console.log('\n');
  log.section('Google OAuth Configuration Validator');
  
  checkEnvFile();
  checkSupabaseClientConfig();
  checkOAuthRedirectUrls();
  checkAuthCallbackComponent();
  
  const result = generateReport();
  
  // Exit with appropriate code
  process.exit(result.isValid ? 0 : 1);
}

main();

