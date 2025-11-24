# Global Context Architecture Fix Plan

**Date:** 2024-12-19  
**Based on:** GLOBAL_CONTEXT_ARCHITECTURE_AUDIT.md

---

## Overview

This document provides a detailed, file-by-file plan to fix all architectural issues identified in the audit. Each fix is designed to be:
- **Atomic:** Can be applied independently
- **Backward-compatible:** Won't break existing functionality
- **Testable:** Can be verified with TypeScript, build, and tests

---

## Fix Strategy

1. **Fix contexts in dependency order:** AuthContext → PetContext → FinancialContext → SoundContext
2. **Add realtime subscriptions systematically:** All contexts that manage Supabase data
3. **Consolidate state:** Remove duplication, use single source of truth
4. **Fix dependency arrays:** Ensure correct React hooks dependencies
5. **Add error recovery:** Retry logic for transient failures
6. **Add loading states:** Expose updating/loading states where missing

---

## File-by-File Changes

### 1. `frontend/src/contexts/AuthContext.tsx`

#### Change 1.1: Add Profile Realtime Subscription
**Lines:** 202-226, 282-311

**Current:**
```typescript
// Only pets subscription
petSubscriptionRef.current = supabase
  .channel(`pet-changes-${mappedUser.uid}`)
  .on('postgres_changes', { table: 'pets', ... }, ...)
```

**New:**
```typescript
// Combined channel for pets and profiles
const userChannel = supabase.channel(`user-data-${mappedUser.uid}`);

// Pet subscription
userChannel.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'pets',
  filter: `user_id=eq.${mappedUser.uid}`,
}, async (payload) => {
  await refreshUserState();
});

// Profile subscription
userChannel.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'profiles',
  filter: `user_id=eq.${mappedUser.uid}`,
}, async (payload) => {
  await refreshUserState();
});

petSubscriptionRef.current = userChannel.subscribe();
```

**Rationale:** Sync profile changes across tabs, update `isNewUser` flag in real-time.

---

#### Change 1.2: Extract Subscription Setup to Helper Function
**Lines:** 202-226, 282-311

**New Helper Function:**
```typescript
const setupUserDataSubscription = useCallback((userId: string) => {
  // Clean up existing subscription
  if (petSubscriptionRef.current) {
    petSubscriptionRef.current.unsubscribe();
    petSubscriptionRef.current = null;
  }

  const userChannel = supabase.channel(`user-data-${userId}`);

  // Pet subscription
  userChannel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pets',
    filter: `user_id=eq.${userId}`,
  }, async (payload) => {
    try {
      await refreshUserState();
    } catch (error) {
      onboardingLogger.error('Error refreshing state after pet change', error, { userId });
    }
  });

  // Profile subscription
  userChannel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'profiles',
    filter: `user_id=eq.${userId}`,
  }, async (payload) => {
    try {
      await refreshUserState();
    } catch (error) {
      onboardingLogger.error('Error refreshing state after profile change', error, { userId });
    }
  });

  petSubscriptionRef.current = userChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      onboardingLogger.realtimeEvent('User data subscription active', { userId });
    }
  });

  return userChannel;
}, [refreshUserState]);
```

**Usage:** Replace duplicate subscription code in both places with:
```typescript
if (mappedUser?.uid) {
  setupUserDataSubscription(mappedUser.uid);
}
```

**Rationale:** Eliminates code duplication, ensures consistency.

---

#### Change 1.3: Memoize Functions with useCallback
**Lines:** 87-110, 113-142

**Current:**
```typescript
const checkUserProfile = async (userId: string): Promise<{ isNew: boolean; hasPet: boolean }> => {
  // ...
};
```

**New:**
```typescript
const checkUserProfile = useCallback(async (userId: string): Promise<{ isNew: boolean; hasPet: boolean }> => {
  // ... same implementation
}, []); // No dependencies - uses services, not state

const refreshUserState = useCallback(async () => {
  // ... same implementation
}, []); // No dependencies - uses services, not state
```

**Rationale:** Prevents unnecessary re-renders, ensures stable function references.

---

#### Change 1.4: Fix Fallback Timeout Cleanup
**Lines:** 163-166

**Current:**
```typescript
const fallbackTimeout = setTimeout(() => {
  setLoading(false);
}, 10000);
```

**New:**
```typescript
const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// In useEffect:
fallbackTimeoutRef.current = setTimeout(() => {
  console.warn('⏰ AuthContext: Fallback timeout - forcing loading to false');
  setLoading(false);
}, 10000);

// In cleanup:
return () => {
  if (fallbackTimeoutRef.current) {
    clearTimeout(fallbackTimeoutRef.current);
  }
  subscription.unsubscribe();
  if (petSubscriptionRef.current) {
    petSubscriptionRef.current.unsubscribe();
    petSubscriptionRef.current = null;
  }
};
```

**Rationale:** Ensures timeout is always cleaned up, prevents memory leaks.

---

### 2. `frontend/src/context/PetContext.tsx`

#### Change 2.1: Add Realtime Subscription
**Lines:** 97-99 (after useEffect)

**New:**
```typescript
// Realtime subscription for pet changes
useEffect(() => {
  if (!userId || isSupabaseMock()) {
    return;
  }

  const channel = supabase
    .channel(`pet-realtime-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pets',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('🔄 PetContext: Pet change detected, refreshing...', payload.eventType);
        // Reload pet data from Supabase
        await loadPet();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ PetContext: Realtime subscription active');
      }
    });

  return () => {
    channel.unsubscribe();
    supabase.removeChannel(channel);
  };
}, [userId, loadPet]);
```

**Rationale:** Syncs pet changes across tabs in real-time.

---

#### Change 2.2: Fix Dependency Array
**Lines:** 97-99

**Current:**
```typescript
useEffect(() => {
  loadPet();
}, [loadPet]);
```

**New:**
```typescript
useEffect(() => {
  loadPet();
}, [userId]); // Direct dependency on userId, not loadPet
```

**Also update loadPet:**
```typescript
const loadPet = useCallback(async () => {
  // ... same implementation
}, [userId]); // Keep userId dependency
```

**Rationale:** Prevents unnecessary re-renders, ensures correct dependency tracking.

---

#### Change 2.3: Add Retry Logic to loadPet
**Lines:** 39-95

**Current:**
```typescript
} catch (err) {
  console.error('❌ Error loading pet:', err);
  setError('Failed to load pet data');
}
```

**New:**
```typescript
} catch (err) {
  console.error('❌ Error loading pet:', err);
  
  // Retry logic for transient errors
  const maxRetries = 3;
  let retries = 0;
  let lastError = err;
  
  while (retries < maxRetries) {
    retries++;
    const delay = 100 * Math.pow(2, retries - 1); // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      // Retry fetch
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        // Success - map and set pet
        const loadedPet: Pet = { /* ... */ };
        setPet(loadedPet);
        setError(null);
        return; // Success, exit
      }
      
      if (error && error.code !== 'PGRST116') {
        lastError = error;
      } else {
        // No pet found - not an error
        setPet(null);
        setError(null);
        return;
      }
    } catch (retryErr) {
      lastError = retryErr;
    }
  }
  
  // All retries failed
  setError('Failed to load pet data after retries');
  console.error('❌ PetContext: All retry attempts failed', lastError);
}
```

**Rationale:** Handles transient network errors gracefully.

---

#### Change 2.4: Add Updating State
**Lines:** 33-35, 101-154

**Current:**
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**New:**
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [updating, setUpdating] = useState(false);
```

**In updatePetStats:**
```typescript
const updatePetStats = useCallback(async (updates: Partial<PetStats>) => {
  if (!pet || !userId) return;
  
  setUpdating(true);
  try {
    // ... existing implementation
  } finally {
    setUpdating(false);
  }
}, [pet, userId, loadPet]);
```

**Export in context value:**
```typescript
const value = {
  pet,
  loading,
  error,
  updating, // Add this
  updatePetStats,
  // ...
};
```

**Rationale:** Allows UI to show loading state during updates.

---

#### Change 2.5: Improve Optimistic Update Rollback
**Lines:** 119-152

**Current:**
```typescript
// Optimistic update
setPet(updatedPet);

// Persist to database
const { error } = await supabase.from('pets').update(...);

if (error) {
  await loadPet(); // Reload to revert
}
```

**New:**
```typescript
// Store previous state for rollback
const previousPet = pet;

// Optimistic update
setPet(updatedPet);

try {
  // Persist to database
  const { error } = await supabase.from('pets').update(...);
  
  if (error) {
    // Immediate rollback
    setPet(previousPet);
    throw new Error('Failed to update pet stats');
  }
} catch (err) {
  // Rollback on any error
  setPet(previousPet);
  // Also reload to ensure consistency
  await loadPet();
  throw err;
}
```

**Rationale:** Immediate rollback provides better UX, then reload ensures consistency.

---

### 3. `frontend/src/context/FinancialContext.tsx`

#### Change 3.1: Integrate useFinanceRealtime Hook
**Lines:** 38-151

**Current:**
```typescript
useEffect(() => {
  loadFinancialData();
}, [user]);
```

**New:**
```typescript
import { useFinanceRealtime } from '../hooks/useFinanceRealtime';

// Inside component:
useEffect(() => {
  loadFinancialData();
}, [user]);

// Add realtime subscription
useFinanceRealtime(async (options) => {
  const silent = options?.silent ?? false;
  if (!silent) {
    setLoading(true);
  }
  try {
    await loadFinancialData();
  } catch (err) {
    if (!silent) {
      setError('Failed to refresh financial data');
    }
  } finally {
    if (!silent) {
      setLoading(false);
    }
  }
});
```

**Rationale:** Syncs finance data across tabs using existing hook.

---

#### Change 3.2: Use Supabase Directly Instead of API
**Lines:** 44-89

**Current:**
```typescript
const response = await getFinanceSummary();
```

**New:**
```typescript
// Import Supabase
import { supabase, isSupabaseMock } from '../lib/supabase';

const loadFinancialData = async () => {
  if (!user) {
    setBalance(0);
    setTransactions([]);
    setLoading(false);
    return;
  }

  if (isSupabaseMock()) {
    setBalance(0);
    setTransactions([]);
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    const userId = user.uid;
    
    // Fetch wallet
    const { data: wallet, error: walletError } = await supabase
      .from('finance_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError;
    }
    
    const balance = wallet?.balance || 0;
    setBalance(balance);
    
    // Fetch recent transactions
    const { data: transactions, error: txError } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (txError) {
      throw txError;
    }
    
    // Map transactions
    const mappedTransactions: Transaction[] = (transactions || []).map((t) => ({
      id: t.id,
      type: t.transaction_type === 'income' || t.amount > 0 ? 'income' : 'expense',
      amount: Math.abs(t.amount),
      description: t.description || '',
      category: t.category || 'other',
      date: new Date(t.created_at),
    }));
    
    setTransactions(mappedTransactions);
  } catch (err: any) {
    console.error('❌ Error loading financial data:', err);
    setError('Failed to load financial data');
    setBalance(0);
    setTransactions([]);
  } finally {
    setLoading(false);
  }
};
```

**Rationale:** Consistent with other contexts, removes API dependency, faster.

---

#### Change 3.3: Add Retry Logic
**Lines:** 44-89

**Add retry wrapper:**
```typescript
const loadFinancialDataWithRetry = async (maxRetries = 3) => {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await loadFinancialData();
      return; // Success
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = 100 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  throw lastError;
};
```

**Use in useEffect:**
```typescript
useEffect(() => {
  loadFinancialDataWithRetry();
}, [user]);
```

**Rationale:** Handles transient network errors.

---

#### Change 3.4: Improve Optimistic Update Rollback
**Lines:** 95-130

**Similar to PetContext Change 2.5:**
- Store previous state
- Immediate rollback on error
- Then reload for consistency

---

### 4. `frontend/src/contexts/SoundContext.tsx`

#### Change 4.1: Add Realtime Subscription
**Lines:** 26-69

**New:**
```typescript
// Realtime subscription for user_preferences
useEffect(() => {
  if (isSupabaseMock()) {
    return;
  }

  const setupRealtime = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return;
    }

    const userId = session.user.id;
    const channel = supabase
      .channel(`sound-preferences-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('🔄 SoundContext: Preferences change detected');
          // Reload preferences
          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('sound, music')
            .eq('user_id', userId)
            .single();
          
          if (prefs) {
            setEffectsEnabledState(prefs.sound ?? true);
            setAmbientEnabledState(prefs.music ?? true);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  };

  const cleanup = setupRealtime();
  
  return () => {
    cleanup.then(cleanupFn => cleanupFn?.());
  };
}, []); // Only run once on mount
```

**Rationale:** Syncs sound preferences across tabs.

---

#### Change 4.2: Memoize loadSoundPreferences
**Lines:** 26-69

**New:**
```typescript
const loadSoundPreferences = useCallback(async () => {
  // ... existing implementation
}, []); // No dependencies

useEffect(() => {
  loadSoundPreferences();
}, [loadSoundPreferences]);
```

**Rationale:** Prevents unnecessary function recreation.

---

#### Change 4.3: Add Retry Logic
**Similar to other contexts:** Wrap load in retry logic with exponential backoff.

---

### 5. `frontend/src/services/profileService.ts`

#### Change 5.1: Add Cache Invalidation on Realtime Updates
**Lines:** 7-74

**New:**
```typescript
// Export cache clear function for realtime subscriptions
export const profileService = {
  // ... existing methods
  
  /**
   * Invalidate cache for a user (called by realtime subscriptions)
   */
  invalidateCache(userId: string): void {
    profileCache.delete(userId);
    console.log('🗑️ Profile cache invalidated for userId:', userId);
  },
  
  // ... rest of methods
};
```

**Note:** Contexts using realtime will call this on profile changes.

---

#### Change 5.2: Debounce Cache Cleanup
**Lines:** 52-60

**New:**
```typescript
// Move cleanup to separate function, call less frequently
let lastCleanup = 0;
const CLEANUP_INTERVAL = 60000; // 1 minute

const cleanupCache = () => {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return; // Skip if cleaned recently
  }
  
  lastCleanup = now;
  if (profileCache.size > 50) {
    const cutoff = now - CACHE_TTL_MS * 2;
    for (const [key, value] of profileCache.entries()) {
      if (value.timestamp < cutoff) {
        profileCache.delete(key);
      }
    }
  }
};

// Call cleanup less frequently
if (profileCache.size > 50) {
  cleanupCache();
}
```

**Rationale:** Reduces performance impact.

---

### 6. `frontend/src/hooks/useProfile.ts`

#### Change 6.1: Add Realtime Subscription
**Lines:** 36-38

**New:**
```typescript
// Realtime subscription
useEffect(() => {
  if (!currentUser?.uid || !profile) {
    return; // Only subscribe if we have a profile
  }

  const userId = currentUser.uid;
  const channel = supabase
    .channel(`profile-realtime-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('🔄 useProfile: Profile change detected');
        // Invalidate cache and refresh
        profileService.clearCache(userId);
        await refresh();
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
    supabase.removeChannel(channel);
  };
}, [currentUser?.uid, refresh]); // Depend on uid, not entire currentUser
```

**Also add import:**
```typescript
import { supabase } from '../lib/supabase';
import { profileService } from '../services/profileService';
```

**Rationale:** Syncs profile changes across tabs.

---

#### Change 6.2: Fix Dependency Array
**Lines:** 19-34

**Current:**
```typescript
const refresh = useCallback(async () => {
  // ...
}, [currentUser]);
```

**New:**
```typescript
const refresh = useCallback(async () => {
  if (!currentUser?.uid) {
    setProfile(null);
    return;
  }
  setLoading(true);
  setError(null);
  try {
    const data = await profileService.getProfile(currentUser.uid);
    setProfile(data);
  } catch (err) {
    setError(err as Error);
  } finally {
    setLoading(false);
  }
}, [currentUser?.uid]); // Depend on uid, not entire object
```

**Rationale:** Prevents unnecessary re-renders when currentUser object reference changes.

---

## Summary of Changes

### Files Modified: 6
1. `frontend/src/contexts/AuthContext.tsx` - 4 changes
2. `frontend/src/context/PetContext.tsx` - 5 changes
3. `frontend/src/context/FinancialContext.tsx` - 4 changes
4. `frontend/src/contexts/SoundContext.tsx` - 3 changes
5. `frontend/src/services/profileService.ts` - 2 changes
6. `frontend/src/hooks/useProfile.ts` - 2 changes

### Total Changes: 20
- **Realtime subscriptions added:** 5
- **Dependency arrays fixed:** 4
- **Retry logic added:** 4
- **State improvements:** 3
- **Code deduplication:** 2
- **Cache improvements:** 2

### Breaking Changes: None
All changes are backward-compatible. Existing functionality preserved.

### Testing Requirements
After each change:
1. TypeScript typecheck: `cd frontend && npm run typecheck`
2. Frontend build: `cd frontend && npm run build`
3. Context tests: `cd frontend && npm test -- --testPathPattern=Context`

---

## Execution Order

See `GLOBAL_CONTEXT_ARCHITECTURE_EXECUTION_ORDER.md` for the safe sequence to apply these fixes.

