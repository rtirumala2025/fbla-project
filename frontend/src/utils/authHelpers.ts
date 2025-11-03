/**
 * Authentication Helper Utilities
 * Provides timeout handling and error formatting for auth operations
 */

/**
 * Wraps async function with timeout
 * Prevents infinite hanging on network issues
 * 
 * @param promise - The promise to execute
 * @param timeoutMs - Timeout in milliseconds (default: 15000)
 * @param errorMessage - Custom error message on timeout
 * @returns Promise result or throws timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  errorMessage: string = 'Request timed out. Please check your internet connection and try again.'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Checks if error is network-related
 * @param error - Error object to check
 * @returns true if network error, false otherwise
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  const messageString = (error.message || '').toLowerCase();
  
  return (
    messageString.includes('fetch failed') ||
    messageString.includes('network request failed') ||
    messageString.includes('econnreset') ||
    messageString.includes('etimedout') ||
    messageString.includes('timeout') ||
    messageString.includes('tls') ||
    messageString.includes('socket') ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED' ||
    errorString.includes('network') ||
    errorString.includes('connection')
  );
}

/**
 * Format user-friendly error message for authentication errors
 * @param error - Error object from auth operation
 * @returns User-friendly error message
 */
export function formatAuthError(error: any): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }
  
  // Network errors
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again. If using VPN, try disabling it.';
  }
  
  // Parse error message
  const message = error.message || error.toString();
  
  // Common authentication errors
  if (message.includes('Invalid login') || message.includes('invalid_credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Please confirm your email address before signing in. Check your inbox for a confirmation link.';
  }
  
  if (message.includes('User not found') || message.includes('user_not_found')) {
    return 'No account found with this email. Please sign up first.';
  }
  
  if (message.includes('Email already registered') || message.includes('email_exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  
  if (message.includes('weak_password') || message.includes('password') && message.includes('short')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  
  if (message.includes('rate_limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Request timed out. Please check your internet connection and try again.';
  }
  
  // Google OAuth errors
  if (message.includes('popup_closed')) {
    return 'Sign-in popup was closed. Please try again.';
  }
  
  if (message.includes('access_denied')) {
    return 'Access was denied. Please grant the required permissions.';
  }
  
  // Default: return original message or generic error
  if (message && message.length < 200) {
    return message;
  }
  
  return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
}

/**
 * Retry a promise with exponential backoff
 * Useful for transient network failures
 * 
 * @param fn - Function that returns a promise
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Initial delay in milliseconds (default: 1000)
 * @returns Promise result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on non-network errors
      if (!isNetworkError(error)) {
        throw error;
      }
      
      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = delayMs * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

