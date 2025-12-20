/**
 * Environment variable utility
 * Provides compatibility between CRA (process.env.REACT_APP_*) and Vite (import.meta.env.VITE_*)
 */

// Detect if running in Vite
const isVite = typeof import.meta !== 'undefined' && import.meta.env;

/**
 * Get environment variable with fallback support
 * Checks both VITE_ and REACT_APP_ prefixes for compatibility
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  // For Vite environment
  if (isVite) {
    // Try VITE_ prefix first
    const viteKey = `VITE_${key}`;
    // @ts-ignore - import.meta.env is available in Vite
    const viteValue = import.meta.env[viteKey];
    if (viteValue !== undefined) return viteValue;
    
    // Try REACT_APP_ prefix for backwards compatibility
    const reactKey = `REACT_APP_${key}`;
    // @ts-ignore - import.meta.env is available in Vite
    const reactValue = import.meta.env[reactKey];
    if (reactValue !== undefined) return reactValue;
    
    // Try without prefix
    // @ts-ignore
    const directValue = import.meta.env[key];
    if (directValue !== undefined) return directValue;
  }
  
  // For CRA environment (process.env)
  if (typeof process !== 'undefined' && process.env) {
    // Try REACT_APP_ prefix
    const reactKey = `REACT_APP_${key}`;
    const reactValue = process.env[reactKey];
    if (reactValue !== undefined) return reactValue;
    
    // Try VITE_ prefix for compatibility
    const viteKey = `VITE_${key}`;
    const viteValue = process.env[viteKey];
    if (viteValue !== undefined) return viteValue;
    
    // Try without prefix
    const directValue = process.env[key];
    if (directValue !== undefined) return directValue;
  }
  
  return defaultValue;
}

/**
 * Check if running in development mode
 */
export function isDev(): boolean {
  if (isVite) {
    // @ts-ignore
    return import.meta.env.DEV === true;
  }
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProd(): boolean {
  if (isVite) {
    // @ts-ignore
    return import.meta.env.PROD === true;
  }
  return process.env.NODE_ENV === 'production';
}

/**
 * Environment configuration object
 * Provides type-safe access to all environment variables
 */
export const env = {
  // Supabase configuration
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('SUPABASE_ANON_KEY'),
  
  // API configuration
  API_URL: getEnv('API_URL', 'http://localhost:8000'),
  
  // Feature flags
  USE_MOCK: getEnv('USE_MOCK', 'false') === 'true',
  
  // Mode
  isDev: isDev(),
  isProd: isProd(),
};

export default env;

