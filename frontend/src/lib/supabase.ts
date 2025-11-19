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
 * 5. AuthCallback component uses getSessionFromUrl() to retrieve session
 * 6. User is redirected to dashboard or setup-profile
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // Required for OAuth callback handling
      },
    })
  : createMockClient();

export const isSupabaseMock = (): boolean => {
  return !supabaseUrl || !supabaseAnonKey;
};

export default supabase;
