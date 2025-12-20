import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { getEnv } from '../utils/env';

// Use env utility for Vite/CRA compatibility
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

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
        storage: window.localStorage, // Explicit storage
      },
    })
  : createMockClient();

// Log the actual anon key being used (first 50 chars for security)
if (supabaseUrl && supabaseAnonKey) {
  const anonPreview = supabaseAnonKey.substring(0, 50) + '...';
  logger.info('Supabase client using anon key', { 
    url: supabaseUrl, 
    anonKeyPreview: anonPreview,
    anonKeyLength: supabaseAnonKey.length 
  });
}

// Runtime assertion logging for debugging
if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  logger.warn('Supabase env variables missing or not loaded.', {
    hasUrl: !!process.env.REACT_APP_SUPABASE_URL,
    hasKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
    useMock: process.env.REACT_APP_USE_MOCK || 'false',
  });
  } else {
    // Decode anon key to verify project match
    try {
      const anonKeyParts = process.env.REACT_APP_SUPABASE_ANON_KEY.split('.');
      if (anonKeyParts.length === 3) {
        const anonPayload = JSON.parse(atob(anonKeyParts[1]));
        const urlProjectRef = process.env.REACT_APP_SUPABASE_URL?.split('//')[1]?.split('.')[0];
        const anonProjectRef = anonPayload.ref;
      
      logger.info('Supabase client initialized', {
        sessionPersistence: true,
    autoRefreshToken: true,
        detectSessionInUrl: true,
        urlProjectRef,
        anonKeyProjectRef: anonProjectRef,
        projectMatch: urlProjectRef === anonProjectRef,
      });
      
      if (urlProjectRef !== anonProjectRef) {
        console.error('⚠️ WARNING: Supabase URL project does not match anon key project!', {
          urlProject: urlProjectRef,
          anonKeyProject: anonProjectRef,
        });
      }
    }
  } catch (e) {
    // Couldn't decode, but continue anyway
    logger.info('Supabase client initialized', {
      sessionPersistence: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    });
  }
}

export const isSupabaseMock = (): boolean => {
  return !supabaseUrl || !supabaseAnonKey;
};

/**
 * Helper function to add timeout to Supabase queries
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  operation: string = 'Supabase operation'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      logger.error(`Supabase operation timed out: ${operation}`, { timeoutMs });
    }
    throw error;
  }
}

/**
 * Helper function to retry Supabase operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  operationName: string = 'Supabase operation'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      if (lastError.message.includes('PGRST116') || // Not found
          lastError.message.includes('permission') ||
          lastError.message.includes('unauthorized') ||
          lastError.message.includes('duplicate') ||
          lastError.message.includes('unique')) {
        throw lastError;
      }
      
      if (attempt < maxRetries) {
        logger.warn(`Retrying ${operationName} (attempt ${attempt}/${maxRetries})`, { 
          error: lastError.message,
          attempt,
          maxRetries,
        });
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  logger.error(`${operationName} failed after ${maxRetries} attempts`, {}, lastError!);
  throw new Error(lastError!.message || `${operationName} failed after ${maxRetries} attempts`);
}

export default supabase;
