/**
 * HTTP Client for API requests
 * Provides authentication, token management, and request handling
 * Uses Supabase session tokens instead of localStorage
 * Adapted for react-scripts (uses process.env instead of import.meta.env)
 */
import { supabase, isSupabaseMock } from '../lib/supabase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number | null;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function getSupabaseSessionToken(): Promise<string | null> {
  if (isSupabaseMock()) {
    return null;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      return null;
    }
    return session.access_token;
  } catch (error) {
    console.warn('Failed to get Supabase session token', error);
    return null;
  }
}

// Legacy functions for backwards compatibility - now use Supabase session
export function getTokens(): AuthTokens | null {
  // Return null since we're using Supabase session directly
  // This function is kept for backwards compatibility
  return null;
}

export function setAuthTokens(newTokens: AuthTokens | null): void {
  // No-op since we're using Supabase session directly
  // This function is kept for backwards compatibility
  console.warn('setAuthTokens is deprecated. Use Supabase auth session instead.');
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

async function refreshSupabaseSession(): Promise<void> {
  if (isSupabaseMock()) {
    throw new ApiError(401, 'Supabase is not configured', null);
  }

  try {
    // Supabase handles token refresh automatically
    // This just ensures we have a valid session
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error || !session) {
      throw new ApiError(401, 'Failed to refresh session', error);
    }
  } catch (error: any) {
    throw new ApiError(401, 'Failed to refresh session', error);
  }
}

async function safeParse(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  retry?: boolean;
  allowedStatuses?: number[];
};

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, retry = true, allowedStatuses = [] } = options;
  const headers = new Headers(options.headers ?? {});

  // Get Supabase session token if auth is needed
  if (!skipAuth) {
    const token = await getSupabaseSessionToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error: any) {
    // Handle network errors (connection refused, timeout, etc.)
    if (error.message === 'Failed to fetch' || 
        error.code === 'ECONNREFUSED' || 
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('NetworkError')) {
      throw new ApiError(0, 'Network error: Backend server is not available', { networkError: true });
    }
    // Re-throw other errors
    throw error;
  }

  if (allowedStatuses.includes(response.status)) {
    return (await safeParse(response)) as T;
  }

  // Try to refresh Supabase session on 401
  if (response.status === 401 && !skipAuth && retry && !isSupabaseMock()) {
    try {
      await refreshSupabaseSession();
      // Retry request with new token
      return apiRequest(path, { ...options, retry: false });
    } catch (refreshError) {
      // Refresh failed, throw the original 401 error
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, 'API request failed', await safeParse(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await safeParse(response)) as T;
}

export async function unauthenticatedRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, skipAuth: true });
}

export function clearAuthTokens(): void {
  // No-op since we're using Supabase session directly
  // To sign out, use supabase.auth.signOut() instead
  console.warn('clearAuthTokens is deprecated. Use supabase.auth.signOut() instead.');
}

