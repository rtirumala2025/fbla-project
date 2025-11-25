// Quick script to verify .env file has correct Supabase credentials
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let supabaseUrl = null;
let supabaseAnonKey = null;

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('REACT_APP_SUPABASE_URL=')) {
    supabaseUrl = trimmed.split('=')[1]?.trim();
  }
  if (trimmed.startsWith('REACT_APP_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = trimmed.split('=')[1]?.trim();
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 Verifying .env file configuration...\n');

if (!supabaseUrl) {
  console.error('❌ REACT_APP_SUPABASE_URL not found in .env');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ REACT_APP_SUPABASE_ANON_KEY not found in .env');
  process.exit(1);
}

console.log('✅ REACT_APP_SUPABASE_URL:', supabaseUrl);

// Decode anon key to verify
try {
  const parts = supabaseAnonKey.split('.');
  if (parts.length !== 3) {
    console.error('❌ Anon key is not a valid JWT (should have 3 parts)');
    process.exit(1);
  }
  
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  const urlProjectRef = supabaseUrl.split('//')[1]?.split('.')[0];
  const anonProjectRef = payload.ref;
  
  console.log('✅ REACT_APP_SUPABASE_ANON_KEY: Present (length:', supabaseAnonKey.length + ')');
  console.log('  📍 URL project ref:', urlProjectRef);
  console.log('  📍 Anon key project ref:', anonProjectRef);
  
  if (urlProjectRef === anonProjectRef) {
    console.log('  ✅ Projects match!');
  } else {
    console.error('  ❌ PROJECT MISMATCH!');
    console.error('     URL is for project:', urlProjectRef);
    console.error('     Anon key is for project:', anonProjectRef);
    console.error('     These must match!');
    process.exit(1);
  }
  
  if (payload.role !== 'anon') {
    console.warn('  ⚠️  Warning: Anon key role is:', payload.role, '(expected: anon)');
  } else {
    console.log('  ✅ Anon key role is correct (anon)');
  }
  
} catch (error) {
  console.error('❌ Failed to decode anon key:', error.message);
  process.exit(1);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ .env file is correctly configured!');
console.log('\n💡 Next steps:');
console.log('   1. Make sure your dev server is restarted (Ctrl+C then npm start)');
console.log('   2. Test Google sign-in again');

