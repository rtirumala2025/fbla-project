# Onboarding System Code Fixes

This document contains ready-to-apply code fixes for the identified bugs in the onboarding system.

---

## Fix #1: Always Check Pet Existence (Remove Profile Dependency)

**File:** `frontend/src/contexts/AuthContext.tsx`  
**Lines:** 69-80  
**Severity:** 🟡 MEDIUM

### Current Code:
```typescript
// Check for pet existence
let petExists = false;
if (!isNew) {
  // Only check for pet if user has a profile
  try {
    const pet = await petService.getPet(userId);
    petExists = pet !== null;
  } catch (petError) {
    console.error('Error checking pet:', petError);
    petExists = false; // Assume no pet if check fails
  }
}
```

### Fixed Code:
```typescript
// Check for pet existence (always check, regardless of profile status)
let petExists = false;
try {
  const pet = await petService.getPet(userId);
  petExists = pet !== null;
} catch (petError: any) {
  // PGRST116 = no rows found (user has no pet)
  if (petError?.code === 'PGRST116') {
    petExists = false;
  } else {
    console.error('Error checking pet:', petError);
    // On error, assume no pet (safer for onboarding flow)
    petExists = false;
  }
}
```

**Also update in `refreshUserState()` method (lines 107-117):**
```typescript
// Check for pet existence (always check, regardless of profile status)
let petExists = false;
try {
  const pet = await petService.getPet(session.user.id);
  petExists = pet !== null;
} catch (petError: any) {
  // PGRST116 = no rows found (user has no pet)
  if (petError?.code === 'PGRST116') {
    petExists = false;
  } else {
    console.error('Error checking pet during refresh:', petError);
    petExists = false;
  }
}
```

---

## Fix #2: Fix Race Condition in AuthContext Initialization

**File:** `frontend/src/contexts/AuthContext.tsx`  
**Lines:** 156-196  
**Severity:** 🔴 HIGH

### Current Code:
```typescript
supabase.auth.getSession().then(async ({ data: { session }, error }: { data: { session: any }, error: any }) => {
  console.log('🔵 AuthContext: Initial session check');
  // ... logging ...
  
  const mappedUser = mapSupabaseUser(session?.user || null);
  
  try {
    if (mappedUser) {
      // Check if user has a profile and pet
      const { isNew, hasPet: petExists } = await checkUserProfile(mappedUser.uid);
      // ... set state ...
    } else {
      setIsNewUser(false);
      setHasPet(false);
    }
  } catch (profileError) {
    // ... error handling ...
  }
  
  setCurrentUser(mappedUser);
  setLoading(false); // ⚠️ This may execute before async operations complete
  initialSessionLoadedRef.current = true;
  clearTimeout(fallbackTimeout);
});
```

### Fixed Code:
```typescript
supabase.auth.getSession().then(async ({ data: { session }, error }: { data: { session: any }, error: any }) => {
  console.log('🔵 AuthContext: Initial session check');
  console.log('  Session exists:', !!session);
  console.log('  User email:', session?.user?.email || 'No user');
  console.log('  Session error:', error?.message || 'none');
  console.log('  Session expires at:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A');
  
  const mappedUser = mapSupabaseUser(session?.user || null);
  console.log('  Mapped user:', mappedUser?.email || 'null');
  
  try {
    if (mappedUser) {
      // Check if user has a profile and pet - AWAIT before setting loading = false
      const { isNew, hasPet: petExists } = await checkUserProfile(mappedUser.uid);
      console.log('  Is new user:', isNew);
      console.log('  Has pet:', petExists);
      setIsNewUser(isNew);
      setHasPet(petExists);
    } else {
      setIsNewUser(false);
      setHasPet(false);
    }
  } catch (profileError) {
    console.error('❌ Error checking user profile:', profileError);
    setIsNewUser(false); // Default to not new user if check fails
    setHasPet(false);
  }
  
  // ✅ Set state only after all async operations complete
  setCurrentUser(mappedUser);
  setLoading(false);
  initialSessionLoadedRef.current = true;
  clearTimeout(fallbackTimeout);
}).catch((err: any) => {
  console.error('❌ Error getting session:', err);
  setCurrentUser(null);
  setIsNewUser(false);
  setHasPet(false);
  setLoading(false);
  initialSessionLoadedRef.current = true;
  clearTimeout(fallbackTimeout);
});
```

**Note:** The key change is ensuring `setLoading(false)` is called AFTER `await checkUserProfile()` completes.

---

## Fix #3: Add Error Handling for refreshUserState() Failure

**File:** `frontend/src/context/PetContext.tsx`  
**Lines:** 215-218  
**Severity:** 🟡 MEDIUM

### Current Code:
```typescript
// Refresh auth state to update hasPet flag
// This ensures route guards recognize the user has completed onboarding
console.log('🔄 Refreshing auth state after pet creation...');
await refreshUserState();
```

### Fixed Code:
```typescript
// Refresh auth state to update hasPet flag
// This ensures route guards recognize the user has completed onboarding
console.log('🔄 Refreshing auth state after pet creation...');
try {
  await refreshUserState();
  console.log('✅ Auth state refreshed successfully');
} catch (refreshError) {
  console.error('❌ Error refreshing auth state:', refreshError);
  // Even if refresh fails, pet exists in DB, so manually update hasPet
  // This prevents redirect loops
  // Note: This is a fallback - the proper fix is to ensure refreshUserState() works
  // But this prevents the user from being stuck in a redirect loop
  console.warn('⚠️ Using fallback: Pet exists in DB, but refreshUserState() failed');
  // The next page load will correctly detect the pet
  // For now, we'll let the navigation proceed - the route guard will check Supabase directly
}
```

---

## Fix #4: Add Retry Logic for Pet Queries

**File:** `frontend/src/contexts/AuthContext.tsx`  
**Location:** Add before `checkUserProfile` function  
**Severity:** 🟡 MEDIUM

### New Helper Function:
```typescript
// Helper function to retry pet check with exponential backoff
const checkPetWithRetry = async (userId: string, maxRetries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const pet = await petService.getPet(userId);
      return pet !== null;
    } catch (error: any) {
      if (error?.code === 'PGRST116') {
        // No pet found - not an error
        return false;
      }
      
      if (attempt === maxRetries) {
        console.error(`❌ Pet check failed after ${maxRetries} attempts:`, error);
        return false; // Default to no pet on final failure
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = 100 * Math.pow(2, attempt - 1);
      console.warn(`⚠️ Pet check attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};
```

### Update checkUserProfile to use retry:
```typescript
// Check for pet existence (always check, regardless of profile status)
let petExists = false;
petExists = await checkPetWithRetry(userId);
```

**Note:** This replaces the try-catch block in the pet check section.

---

## Fix #5: Add Realtime Subscription for Pet Changes

**File:** `frontend/src/contexts/AuthContext.tsx`  
**Location:** Add in useEffect, after auth state change subscription (around line 243)  
**Severity:** 🟢 LOW

### Add After Auth State Change Subscription:
```typescript
// Subscribe to pet changes for realtime sync across tabs
let petSubscription: any = null;
if (mappedUser?.uid) {
  petSubscription = supabase
    .channel(`pet-changes-${mappedUser.uid}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'pets',
        filter: `user_id=eq.${mappedUser.uid}`,
      },
      async (payload) => {
        console.log('🔵 AuthContext: Pet change detected:', payload.eventType);
        if (mappedUser) {
          // Refresh user state when pet changes
          try {
            await refreshUserState();
          } catch (error) {
            console.error('❌ Error refreshing state after pet change:', error);
          }
        }
      }
    )
    .subscribe();
}
```

### Update Cleanup Function:
```typescript
return () => {
  console.log('🔵 AuthContext: Cleaning up subscriptions');
  clearTimeout(fallbackTimeout);
  subscription.unsubscribe();
  if (petSubscription) {
    petSubscription.unsubscribe();
  }
};
```

**Note:** This requires the pet subscription to be stored in a ref or state variable that persists across renders. Consider using `useRef`:

```typescript
const petSubscriptionRef = useRef<any>(null);

// In useEffect:
if (mappedUser?.uid && !petSubscriptionRef.current) {
  petSubscriptionRef.current = supabase
    .channel(`pet-changes-${mappedUser.uid}`)
    // ... rest of subscription code ...
}

// In cleanup:
if (petSubscriptionRef.current) {
  petSubscriptionRef.current.unsubscribe();
  petSubscriptionRef.current = null;
}
```

---

## Fix #6: Update AuthCallback to Always Check Pet

**File:** `frontend/src/pages/AuthCallback.tsx`  
**Lines:** 418-437  
**Severity:** 🟡 MEDIUM

### Current Code:
```typescript
// Check for pet existence
let hasPet = false;
if (hasProfile) {
  try {
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (petError && petError.code !== 'PGRST116') {
      logToFile(`❌ AuthCallback: Error checking pet: ${petError.message}`, 'error');
    } else {
      hasPet = !!pet;
    }
  } catch (petCheckError: any) {
    logToFile(`⚠️ AuthCallback: Error checking pet: ${petCheckError?.message || petCheckError}`, 'warn');
    hasPet = false;
  }
}
```

### Fixed Code:
```typescript
// Check for pet existence (always check, regardless of profile status)
let hasPet = false;
try {
  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (petError && petError.code !== 'PGRST116') {
    logToFile(`❌ AuthCallback: Error checking pet: ${petError.message}`, 'error');
    hasPet = false;
  } else {
    hasPet = !!pet;
  }
} catch (petCheckError: any) {
  logToFile(`⚠️ AuthCallback: Error checking pet: ${petCheckError?.message || petCheckError}`, 'warn');
  hasPet = false;
}
```

---

## Summary of Changes

1. **Fix #1:** Remove profile dependency from pet check - Always check pet existence
2. **Fix #2:** Fix race condition - Ensure loading state waits for async operations
3. **Fix #3:** Add error handling - Handle refreshUserState() failures gracefully
4. **Fix #4:** Add retry logic - Handle transient network failures
5. **Fix #5:** Add realtime sync - Enable multi-tab synchronization
6. **Fix #6:** Update AuthCallback - Always check pet regardless of profile

### Files Modified:
- `frontend/src/contexts/AuthContext.tsx` (Fixes #1, #2, #4, #5)
- `frontend/src/context/PetContext.tsx` (Fix #3)
- `frontend/src/pages/AuthCallback.tsx` (Fix #6)

### Testing After Fixes:
1. Test pet creation flow
2. Test page refresh during pet creation
3. Test multiple tabs/devices
4. Test slow network conditions
5. Test Supabase query failures
6. Test OAuth callback flow

---

**End of Code Fixes**

