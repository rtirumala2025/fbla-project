const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

const STORAGE_KEY = 'virtual-pet.auth.tokens';

let tokens: AuthTokens | null = loadTokensFromStorage();

function loadTokensFromStorage(): AuthTokens | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthTokens;
  } catch (error) {
    console.warn('Failed to parse auth tokens from storage', error);
    return null;
  }
}

export function getTokens(): AuthTokens | null {
  return tokens;
}

export function setAuthTokens(newTokens: AuthTokens | null): void {
  tokens = newTokens;
  if (typeof window === 'undefined') {
    return;
  }
  if (!newTokens) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens));
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

async function refreshTokens(): Promise<void> {
  if (!tokens?.refreshToken) {
    throw new ApiError(401, 'Missing refresh token', null);
  }
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: tokens.refreshToken }),
  });

  if (!response.ok) {
    setAuthTokens(null);
    throw new ApiError(response.status, 'Failed to refresh session', await safeParse(response));
  }

  const data = await response.json();
  setAuthTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  });
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

  if (!skipAuth && tokens?.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (allowedStatuses.includes(response.status)) {
    return (await safeParse(response)) as T;
  }

  if (response.status === 401 && !skipAuth && retry && tokens?.refreshToken) {
    await refreshTokens();
    return apiRequest(path, { ...options, retry: false });
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
  setAuthTokens(null);
}
