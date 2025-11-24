/**
 * Network Error Utilities
 * Provides helpers for detecting and handling network errors
 */

export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as any)?.code;
  
  return (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed') ||
    errorMessage.includes('ERR_CONNECTION_REFUSED') ||
    errorMessage.includes('ERR_NETWORK_CHANGED') ||
    errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ETIMEDOUT' ||
    errorCode === 'ENOTFOUND'
  );
}

export function isTimeoutError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorMessage.includes('timed out') || errorMessage.includes('timeout');
}

export function getErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (!error) return defaultMessage;
  
  if (isNetworkError(error)) {
    return 'Network error: Please check your internet connection and try again.';
  }
  
  if (isTimeoutError(error)) {
    return 'Request timed out: Please try again.';
  }
  
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  return String(error) || defaultMessage;
}

