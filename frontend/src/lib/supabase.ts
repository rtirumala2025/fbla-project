import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const createMockClient = (): SupabaseClient => {
  return {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: null }),
      signInWithOAuth: async () => ({ data: { url: null }, error: null }),
      signOut: async () => ({ error: null }),
      signUp: async () => ({ data: { user: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getUserIdentities: async () => ({ data: { identities: [] }, error: null }),
    },
  } as unknown as SupabaseClient;
};

/**
 * Supabase client configuration
 * 
 * OAuth Flow:
 * 1. User clicks "Sign in with Google" → signInWithOAuth() called
 * 2. Supabase redirects to Google OAuth consent screen
 * 3. Google redirects back to /auth/callback with hash parameters (#access_token=...)
 * 4. Supabase detects session in URL automatically (detectSessionInUrl: true)
 * 5. AuthCallback component uses getSession() which automatically processes URL hash when detectSessionInUrl is enabled
 * 6. User is redirected to dashboard or setup-profile
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Required: Persist session to localStorage
        autoRefreshToken: true, // Required: Auto-refresh expired tokens
        detectSessionInUrl: true, // Required: Automatically detect and process OAuth callback from URL hash
      },
    })
  : createMockClient();

// Runtime assertion logging for debugging
if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase env variables missing or not loaded.');
  console.warn('   REACT_APP_SUPABASE_URL exists:', !!process.env.REACT_APP_SUPABASE_URL);
  console.warn('   REACT_APP_SUPABASE_ANON_KEY exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
  console.warn('   REACT_APP_USE_MOCK:', process.env.REACT_APP_USE_MOCK || 'false');
} else {
  console.log('✅ Supabase client initialized with env variables');
  console.log('✅ Session persistence enabled: persistSession=true');
  console.log('✅ Token refresh enabled: autoRefreshToken=true');
  console.log('✅ URL hash detection enabled: detectSessionInUrl=true');
  console.log('✅ OAuth callback will be processed automatically from URL hash');
}

export const isSupabaseMock = (): boolean => {
  return !supabaseUrl || !supabaseAnonKey;
};

export default supabase;
