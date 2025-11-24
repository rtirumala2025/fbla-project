# Stability Error Fix Plan

**Date:** 2024-12-19  
**Purpose:** Exact line-level changes required to fix all stability and error handling issues  
**Status:** Ready for Implementation

---

## Phase 1: Critical Fixes (P0)

### 1.1 Create Global Logger System

**File:** `frontend/src/utils/logger.ts` (NEW FILE)

**Content:**
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = process.env.NODE_ENV === 'development';

  log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      error,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const consoleMethod = {
      debug: console.debug,
      info: console.log,
      warn: console.warn,
      error: console.error,
    }[level];

    if (this.isDevelopment || level === 'error') {
      consoleMethod(`[${level.toUpperCase()}] ${message}`, context || '', error || '');
    }

    // TODO: Send to external logging service in production
    if (level === 'error' && !this.isDevelopment) {
      // Send to error tracking service (e.g., Sentry)
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log('error', message, context, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
export default logger;
```

---

### 1.2 Add Error Boundaries

**File:** `frontend/src/components/ErrorBoundary.tsx`

**Changes:**
- Line 29: Add logging integration
- Line 30: Add error reporting to external service

**New Code:**
```typescript
import { logger } from '../utils/logger';

componentDidCatch(error: Error, info: ErrorInfo) {
  logger.error('[ErrorBoundary] Component error caught', {
    error: error.message,
    stack: error.stack,
    componentStack: info.componentStack,
  }, error);
}
```

**File:** `frontend/src/components/ErrorBoundaryRoute.tsx` (NEW FILE)

**Content:**
```typescript
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

type ErrorBoundaryRouteProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export class ErrorBoundaryRoute extends Component<ErrorBoundaryRouteProps> {
  render() {
    return (
      <ErrorBoundary fallback={this.props.fallback}>
        {this.props.children}
      </ErrorBoundary>
    );
  }
}
```

**File:** `frontend/src/App.tsx`

**Changes:**
- Wrap AuthProvider, PetProvider, FinancialProvider with ErrorBoundary
- Wrap each route with ErrorBoundaryRoute

---

### 1.3 Fix Unhandled Promise Rejections

**File:** `frontend/src/main.tsx`

**Changes:**
- Add global unhandled rejection handler

**New Code (after line 22):**
```typescript
// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  logger.error('Unhandled promise rejection', {
    reason: event.reason?.message || String(event.reason),
    stack: event.reason?.stack,
  }, event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  // Prevent default browser behavior
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  logger.error('Global error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  }, event.error);
});
```

---

### 1.4 Fix AuthContext Error Handling

**File:** `frontend/src/contexts/AuthContext.tsx`

**Changes:**

1. **Line 169**: Wrap `getSession()` in try/catch
```typescript
try {
  const { data: { session }, error } = await supabase.auth.getSession();
  // ... existing code
} catch (err: any) {
  logger.error('Error getting session', { error: err?.message }, err instanceof Error ? err : new Error(String(err)));
  setCurrentUser(null);
  setIsNewUser(false);
  setHasPet(false);
  setLoading(false);
  clearTimeout(fallbackTimeout);
}
```

2. **Line 238**: Add try/catch in `onAuthStateChange` callback
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
  try {
    // ... existing code
  } catch (error) {
    logger.error('Error in auth state change handler', { event }, error instanceof Error ? error : new Error(String(error)));
    // Don't crash the app, just log the error
  }
});
```

3. **Line 333-360**: Add timeout wrapper to `signIn`
```typescript
const signIn = async (email: string, password: string) => {
  // ... mock mode check ...
  
  try {
    const signInPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sign in request timed out')), 15000);
    });
    
    const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;
    
    if (error) {
      throw new Error(error.message);
    }
    
    setCurrentUser(mapSupabaseUser(data.user));
  } catch (err: any) {
    logger.error('Sign in failed', { email }, err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
};
```

4. **Line 362-407**: Add timeout wrapper to `signUp`
5. **Line 424-517**: Add timeout wrapper to `signInWithGoogle`

---

### 1.5 Fix PetService Error Handling

**File:** `frontend/src/services/petService.ts`

**Changes:**

1. **Line 23-40**: Add timeout and retry logic
```typescript
async getPet(userId: string): Promise<Pet | null> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  try {
    const getPetPromise = supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Get pet request timed out')), 10000);
    });
    
    const { data, error } = await Promise.race([getPetPromise, timeoutPromise]) as any;

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching pet', { userId, errorCode: error.code }, error);
      throw error;
    }

    return data;
  } catch (err: any) {
    if (err.message?.includes('timed out')) {
      logger.error('Get pet request timed out', { userId }, err);
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  }
}
```

2. **Line 45-58**: Add timeout to `createPet`
3. **Line 63-80**: Add timeout to `updatePet`
4. **Line 101-115**: Add null check before accessing `pet.age`
```typescript
async incrementAge(petId: string): Promise<Pet> {
  const { data: pet, error: fetchError } = await supabase
    .from('pets')
    .select('age')
    .eq('id', petId)
    .single();

  if (fetchError) {
    logger.error('Error fetching pet for age increment', { petId }, fetchError);
    throw new Error('Pet not found');
  }

  if (!pet || typeof pet.age !== 'number') {
    logger.error('Invalid pet data for age increment', { petId, pet });
    throw new Error('Invalid pet data');
  }

  return await this.updatePet(petId, {
    age: pet.age + 1,
  });
}
```

5. **Line 120-135**: Add null check before accessing `pet.level`

---

### 1.6 Fix ProfileService Error Handling

**File:** `frontend/src/services/profileService.ts`

**Changes:**

1. **Line 15-63**: Add timeout wrapper
2. **Line 81-176**: Add timeout and better error handling to `createProfile`
3. **Line 181-213**: Add timeout to `updateProfile`

---

### 1.7 Fix Null Guards

**File:** `frontend/src/context/PetContext.tsx`

**Changes:**

1. **Line 64-83**: Add null checks
```typescript
if (data) {
  // Validate required fields
  if (!data.id || !data.name || !data.species) {
    logger.error('Invalid pet data from database', { data });
    setError('Invalid pet data received');
    setLoading(false);
    return;
  }
  
  const loadedPet: Pet = {
    id: data.id,
    name: data.name,
    species: data.species as 'dog' | 'cat' | 'bird' | 'rabbit',
    breed: data.breed || 'Mixed',
    age: data.age ?? 0,
    level: data.level ?? 1,
    experience: data.xp ?? 0,
    ownerId: data.user_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    stats: {
      health: data.health ?? 100,
      hunger: data.hunger ?? 50,
      happiness: data.happiness ?? 50,
      cleanliness: data.cleanliness ?? 50,
      energy: data.energy ?? 50,
      lastUpdated: new Date(data.updated_at),
    },
  };
  setPet(loadedPet);
}
```

---

## Phase 2: High Priority Fixes (P1)

### 2.1 Add Supabase Timeout Configuration

**File:** `frontend/src/lib/supabase.ts`

**Changes:**
- Add timeout configuration to Supabase client
- Add retry logic wrapper

**New Code:**
```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from './utils/logger';

// ... existing code ...

// Helper function to add timeout to Supabase queries
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

// Helper function to retry Supabase operations
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
          lastError.message.includes('unauthorized')) {
        throw lastError;
      }
      
      if (attempt < maxRetries) {
        logger.warn(`Retrying ${operationName} (attempt ${attempt}/${maxRetries})`, { error: lastError.message });
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  logger.error(`${operationName} failed after ${maxRetries} attempts`, {}, lastError!);
  throw lastError!;
}
```

---

### 2.2 Fix Realtime Subscription Error Handling

**File:** `frontend/src/hooks/useAccessoriesRealtime.ts`

**Changes:**

1. **Line 80**: Add try/catch in subscription callback
```typescript
async (payload) => {
  if (!isActive) return;

  try {
    console.log('🔄 useAccessoriesRealtime: Change detected', {
      event: payload.eventType,
      payload: payload.new || payload.old,
    });

    // Fetch updated accessories
    const { data, error } = await supabase
      .from('user_accessories')
      .select('*')
      .eq('pet_id', petId);

    if (error) {
      logger.error('Failed to fetch updated accessories', { petId, error }, error);
      return;
    }

    if (data && isActive) {
      const accessories: AccessoryEquipResponse[] = data.map((item) => ({
        // ... mapping
      }));
      callbackRef.current(accessories);
    }
  } catch (error) {
    logger.error('Error in accessories realtime callback', { petId }, error instanceof Error ? error : new Error(String(error)));
  }
}
```

2. **Line 117**: Add error handling in subscription status callback
```typescript
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    logger.info('Subscribed to accessories realtime channel', { petId });
  } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
    logger.error('Realtime channel error', { petId, status });
    // Attempt to resubscribe after delay
    setTimeout(() => {
      if (isActive && channelRef.current) {
        setupRealtime();
      }
    }, 5000);
  }
});
```

**File:** `frontend/src/hooks/useFinanceRealtime.ts`

**Similar changes as above**

**File:** `frontend/src/contexts/AuthContext.tsx`

**Changes:**
- Line 215, 301: Add try/catch in pet subscription callbacks

---

### 2.3 Add Network Error Detection

**File:** `frontend/src/utils/networkUtils.ts` (NEW FILE)

**Content:**
```typescript
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
```

---

## Phase 3: Medium Priority Fixes (P2)

### 3.1 Add Request Cancellation

**File:** `frontend/src/hooks/useCancellableRequest.ts` (NEW FILE)

**Content:**
```typescript
import { useEffect, useRef } from 'react';

export function useCancellableRequest() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const createAbortController = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  };

  return { createAbortController };
}
```

---

### 3.2 Improve Backend Error Handling

**File:** `backend/app/middleware/error_handler.py`

**Changes:**
- Add structured logging
- Add error tracking integration
- Standardize error responses

---

## Implementation Order

See `STABILITY_ERROR_IMPLEMENTATION_STEPS.md` for the exact sequence of changes.

