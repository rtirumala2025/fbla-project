#!/usr/bin/env node

/**
 * 🔍 Supabase Phase 1 Verification Script
 * 
 * This script verifies that your Supabase setup is complete and working.
 * Run with: npm run verify:supabase
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const { green, red, yellow, cyan, bright, reset, magenta } = colors;

// Helper functions
const success = (msg) => console.log(`${green}✅ ${msg}${reset}`);
const error = (msg) => console.log(`${red}❌ ${msg}${reset}`);
const warning = (msg) => console.log(`${yellow}⚠️  ${msg}${reset}`);
const info = (msg) => console.log(`${cyan}ℹ️  ${msg}${reset}`);
const header = (msg) => console.log(`\n${bright}${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}\n${bright}${msg}${reset}\n${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}\n`);

let testsPassed = 0;
let testsFailed = 0;

/**
 * Test 1: Check if .env file exists
 */
function checkEnvFileExists() {
  header('Test 1: Checking .env File');
  
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    error('.env file not found!');
    testsFailed++;
    return false;
  }
  
  success('.env file exists');
  testsPassed++;
  return true;
}

/**
 * Test 2: Check if .env has required variables
 */
function checkEnvVariables() {
  header('Test 2: Checking Environment Variables');
  
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasUrl = envContent.includes('VITE_SUPABASE_URL=') && 
                 !envContent.match(/^#.*VITE_SUPABASE_URL=/m);
  const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=') && 
                 !envContent.match(/^#.*VITE_SUPABASE_ANON_KEY=/m);
  
  if (!hasUrl || !hasKey) {
    error('Required environment variables are missing or commented out!');
    console.log('');
    warning('You need to add your Supabase credentials to .env:');
    console.log('');
    console.log('   1. Go to: https://app.supabase.com');
    console.log('   2. Click on your project');
    console.log('   3. Go to Settings → API');
    console.log('   4. Copy "Project URL" and "anon public" key');
    console.log('   5. Edit frontend/.env and uncomment/paste the values');
    console.log('');
    console.log('   Example:');
    console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI...');
    console.log('');
    testsFailed++;
    return false;
  }
  
  success('VITE_SUPABASE_URL is set');
  success('VITE_SUPABASE_ANON_KEY is set');
  testsPassed += 2;
  return true;
}

/**
 * Test 3: Check if @supabase/supabase-js is installed
 */
function checkSupabasePackage() {
  header('Test 3: Checking NPM Dependencies');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const hasDependency = packageJson.dependencies && 
                        packageJson.dependencies['@supabase/supabase-js'];
  
  if (!hasDependency) {
    error('@supabase/supabase-js is not installed!');
    console.log('');
    warning('Install it with:');
    console.log('   npm install @supabase/supabase-js');
    console.log('');
    testsFailed++;
    return false;
  }
  
  success('@supabase/supabase-js is installed');
  testsPassed++;
  return true;
}

/**
 * Test 4: Check if required files exist
 */
function checkRequiredFiles() {
  header('Test 4: Checking Required Files');
  
  const requiredFiles = [
    'src/lib/supabase.ts',
    'src/test-supabase.ts',
    'src/types/database.types.ts',
  ];
  
  let allExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      success(`${file} exists`);
      testsPassed++;
    } else {
      error(`${file} is missing!`);
      testsFailed++;
      allExist = false;
    }
  });
  
  return allExist;
}

/**
 * Test 5: Provide instructions for manual Supabase verification
 */
function printManualSteps() {
  header('Test 5: Manual Verification Steps');
  
  info('Please complete these steps manually in Supabase Dashboard:');
  console.log('');
  console.log('   1. [ ] Go to Table Editor in Supabase Dashboard');
  console.log('   2. [ ] Verify these tables exist:');
  console.log('          • profiles');
  console.log('          • pets');
  console.log('          • shop_items');
  console.log('          • transactions');
  console.log('          • pet_inventory');
  console.log('   3. [ ] Verify shop_items has sample data (12+ items)');
  console.log('   4. [ ] Check that RLS is enabled on all tables');
  console.log('');
}

/**
 * Final step: Instructions for running live test
 */
function printNextSteps() {
  header('Next Steps');
  
  if (testsFailed === 0) {
    success(`All automated checks passed! (${testsPassed} tests)`);
    console.log('');
    info('To verify Supabase connection works:');
    console.log('');
    console.log('   1. Start the dev server:');
    console.log(`      ${bright}npm start${reset}`);
    console.log('');
    console.log('   2. Open browser to http://localhost:3000');
    console.log('');
    console.log('   3. Open browser console (F12)');
    console.log('');
    console.log('   4. Run this command:');
    console.log(`      ${bright}import('/src/test-supabase').then(m => m.testSupabaseConnection())${reset}`);
    console.log('');
    console.log('   5. You should see:');
    console.log('      ✅ Supabase connected! Shop items: [...]');
    console.log('');
    success('If that works, Phase 1 is COMPLETE! 🎉');
    console.log('');
  } else {
    error(`${testsFailed} test(s) failed. Please fix the issues above.`);
    console.log('');
    info('For help, see:');
    console.log('   • SETUP_INSTRUCTIONS.md');
    console.log('   • PHASE_1_VERIFICATION_CHECKLIST.md');
    console.log('   • VERIFICATION_SUMMARY.md');
    console.log('');
  }
}

/**
 * Main execution
 */
function main() {
  console.log('');
  console.log(`${bright}${magenta}🔍 SUPABASE PHASE 1 VERIFICATION${reset}`);
  console.log('');
  
  checkEnvFileExists();
  const hasValidEnv = checkEnvVariables();
  checkSupabasePackage();
  checkRequiredFiles();
  printManualSteps();
  printNextSteps();
  
  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run the script
main();

