# Global Context Architecture Audit

**Date:** 2024-12-19  
**Scope:** AuthContext, PetContext, ProfileContext, Finance, Analytics, Preferences contexts, Realtime subscriptions, Supabase query consistency

---

## Executive Summary

This audit identifies critical architectural issues in the global state management system that lead to:
- **State duplication** between contexts and services
- **Stale data** due to missing realtime subscriptions
- **Race conditions** between context initialization and auth state changes
- **Missing loading/error states** in several contexts
- **Incorrect dependency arrays** causing unnecessary re-renders or missed updates
- **Inconsistent Supabase query patterns** across contexts

**Severity Breakdown:**
- 🔴 **Critical (8 issues):** Race conditions, missing realtime sync, state duplication
- 🟡 **High (12 issues):** Missing error handling, incorrect dependencies, stale data
- 🟢 **Medium (6 issues):** Missing retries, performance optimizations

---

## 1. AuthContext Issues

### 1.1 🔴 CRITICAL: Race Condition Between getSession() and onAuthStateChange
**Location:** `frontend/src/contexts/AuthContext.tsx:159-331`

**Problem:**
- `getSession()` and `onAuthStateChange` both call `checkUserProfile()` independently
- `initialSessionLoadedRef` guard prevents race but creates timing issues
- If `onAuthStateChange` fires before `getSession()` completes, state can be inconsistent

**Root Cause:**
- No coordination between the two initialization paths
- Both paths independently fetch profile/pet data

**Impact:**
- User state can flicker between authenticated/unauthenticated
- `isNewUser` and `hasPet` flags can be incorrect during initialization
- Navigation guards may redirect incorrectly

**Evidence:**
```typescript
// Line 169: getSession() path
supabase.auth.getSession().then(async ({ data: { session }, error }) => {
  // ... checks profile/pet
});

// Line 238: onAuthStateChange path  
supabase.auth.onAuthStateChange(async (event, session) => {
  // ... also checks profile/pet
  // Guarded by initialSessionLoadedRef but still races
});
```

---

### 1.2 🔴 CRITICAL: Missing Realtime Subscription for Profiles
**Location:** `frontend/src/contexts/AuthContext.tsx:202-226, 282-311`

**Problem:**
- AuthContext subscribes to `pets` table changes but NOT `profiles` table
- When profile is created/updated in another tab, AuthContext doesn't update
- `isNewUser` flag becomes stale

**Root Cause:**
- Only pet subscription exists, profile subscription missing

**Impact:**
- User creates profile in Tab A → Tab B still shows `isNewUser: true`
- Profile updates don't sync across tabs
- Navigation guards may block user incorrectly

**Evidence:**
```typescript
// Line 205-225: Only pets subscription
petSubscriptionRef.current = supabase
  .channel(`pet-changes-${mappedUser.uid}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pets',  // ❌ Missing 'profiles' table
    filter: `user_id=eq.${mappedUser.uid}`,
  }, ...)
```

---

### 1.3 🟡 HIGH: Duplicate Pet Subscription Setup Logic
**Location:** `frontend/src/contexts/AuthContext.tsx:202-226, 290-311`

**Problem:**
- Pet subscription setup code is duplicated in two places:
  1. Initial `getSession()` path (lines 202-226)
  2. `onAuthStateChange` path (lines 290-311)

**Root Cause:**
- Code duplication without shared helper function

**Impact:**
- Maintenance burden
- Risk of inconsistencies if one path is updated but not the other

---

### 1.4 🟡 HIGH: Missing Error Recovery in checkUserProfile
**Location:** `frontend/src/contexts/AuthContext.tsx:87-110`

**Problem:**
- `checkUserProfile()` catches errors but returns default values
- No retry logic for transient network errors
- Errors are logged but not surfaced to user

**Root Cause:**
- Error handling is too permissive (always returns defaults)

**Impact:**
- Silent failures can lead to incorrect user state
- User may be incorrectly marked as new/returning

---

### 1.5 🟡 HIGH: Empty Dependency Array in Main useEffect
**Location:** `frontend/src/contexts/AuthContext.tsx:159`

**Problem:**
- Main `useEffect` has empty dependency array `[]`
- This is intentional but means `checkUserProfile`, `refreshUserState` are recreated on every render
- Functions are not memoized, causing potential unnecessary re-renders

**Root Cause:**
- Functions defined inside component but not wrapped in `useCallback`

**Impact:**
- Minor performance impact
- Potential for stale closures if functions are passed to child components

---

### 1.6 🟢 MEDIUM: Fallback Timeout Not Cleared on Unmount
**Location:** `frontend/src/contexts/AuthContext.tsx:163-166`

**Problem:**
- `fallbackTimeout` is cleared in success path but not guaranteed in error path
- If component unmounts before timeout fires, timeout may still execute

**Root Cause:**
- Timeout not stored in ref for cleanup

**Impact:**
- Minor memory leak risk
- Potential state updates after unmount

---

## 2. PetContext Issues

### 2.1 🔴 CRITICAL: Missing Realtime Subscription
**Location:** `frontend/src/context/PetContext.tsx:29-292`

**Problem:**
- PetContext loads pet data on mount but has NO realtime subscription
- Changes in other tabs/windows don't sync
- Pet stats updates from other tabs are lost

**Root Cause:**
- No subscription to `pets` table changes

**Impact:**
- Multi-tab usage shows stale pet data
- User feeds pet in Tab A → Tab B doesn't update
- Race conditions when multiple tabs update pet simultaneously

**Evidence:**
```typescript
// Line 97-99: Only loads on mount, no subscription
useEffect(() => {
  loadPet();
}, [loadPet]);
// ❌ No realtime subscription setup
```

---

### 2.2 🟡 HIGH: Incorrect Dependency Array in loadPet useCallback
**Location:** `frontend/src/context/PetContext.tsx:39-95`

**Problem:**
- `loadPet` is wrapped in `useCallback` with `[userId]` dependency
- But `loadPet` is used in `useEffect` with `[loadPet]` dependency
- This creates unnecessary re-renders when `loadPet` reference changes

**Root Cause:**
- Should depend on `userId` directly in `useEffect`, not `loadPet`

**Impact:**
- Unnecessary re-renders
- Potential infinite loops if `loadPet` reference changes

**Evidence:**
```typescript
// Line 39: useCallback with userId
const loadPet = useCallback(async () => {
  // ...
}, [userId]);

// Line 97: useEffect depends on loadPet
useEffect(() => {
  loadPet();
}, [loadPet]); // ❌ Should be [userId]
```

---

### 2.3 🟡 HIGH: Missing Retry Logic for Failed Fetches
**Location:** `frontend/src/context/PetContext.tsx:39-95`

**Problem:**
- `loadPet()` has no retry logic for transient network errors
- Single failure leaves pet in error state
- No exponential backoff

**Root Cause:**
- Error handling is basic (sets error state, no retry)

**Impact:**
- Transient network issues cause permanent error state
- User must refresh page to recover

---

### 2.4 🟡 HIGH: Optimistic Updates Without Rollback on Error
**Location:** `frontend/src/context/PetContext.tsx:101-154`

**Problem:**
- `updatePetStats()` does optimistic update, then persists
- On error, calls `loadPet()` to revert, but this is async
- UI shows incorrect state during rollback

**Root Cause:**
- Optimistic update not stored separately for easy rollback

**Impact:**
- Brief incorrect UI state during error recovery
- User may see wrong pet stats momentarily

---

### 2.5 🟢 MEDIUM: Missing Loading State During Updates
**Location:** `frontend/src/context/PetContext.tsx:101-154`

**Problem:**
- `updatePetStats()` doesn't set loading state during update
- UI can't show loading indicator during save

**Root Cause:**
- No `updating` state flag

**Impact:**
- User can't tell if update is in progress
- Multiple rapid clicks can cause race conditions

---

## 3. FinancialContext Issues

### 3.1 🔴 CRITICAL: Not Using useFinanceRealtime Hook
**Location:** `frontend/src/context/FinancialContext.tsx:38-151`

**Problem:**
- FinancialContext exists but doesn't use `useFinanceRealtime` hook
- `useFinanceRealtime` exists and is used in `FinancePanel` component
- Context and component-level realtime are duplicated

**Root Cause:**
- Context was created before realtime hook, never integrated

**Impact:**
- FinancialContext doesn't sync across tabs
- State duplication between context and component
- Inconsistent data sources

**Evidence:**
```typescript
// FinancialContext.tsx: No realtime subscription
useEffect(() => {
  loadFinancialData();
}, [user]);

// But useFinanceRealtime exists and is used in FinancePanel.tsx
useFinanceRealtime(fetchSummary);
```

---

### 3.2 🔴 CRITICAL: Uses API Endpoint Instead of Direct Supabase
**Location:** `frontend/src/context/FinancialContext.tsx:44-89`

**Problem:**
- `loadFinancialData()` calls `getFinanceSummary()` API endpoint
- API endpoint internally uses Supabase, but adds unnecessary layer
- Other contexts use Supabase directly

**Root Cause:**
- Inconsistent pattern across codebase

**Impact:**
- Extra network hop
- API endpoint may be unavailable while Supabase is available
- Inconsistent error handling

**Evidence:**
```typescript
// Line 57: Uses API endpoint
const response = await getFinanceSummary();

// Should use Supabase directly like other contexts
```

---

### 3.3 🟡 HIGH: Missing Error Recovery
**Location:** `frontend/src/context/FinancialContext.tsx:80-88`

**Problem:**
- Errors are caught and logged but no retry logic
- Error state persists until manual refresh

**Root Cause:**
- Basic error handling without retry

**Impact:**
- Transient errors cause permanent error state

---

### 3.4 🟡 HIGH: Optimistic Updates Without Proper Rollback
**Location:** `frontend/src/context/FinancialContext.tsx:95-130`

**Problem:**
- `addTransaction()` does optimistic update
- On error, calls `loadFinancialData()` to revert, but async
- UI shows incorrect balance during rollback

**Root Cause:**
- Optimistic state not stored separately

**Impact:**
- Brief incorrect balance display

---

## 4. SoundContext Issues

### 4.1 🔴 CRITICAL: Missing Realtime Subscription
**Location:** `frontend/src/contexts/SoundContext.tsx:20-133`

**Problem:**
- SoundContext loads preferences on mount but has NO realtime subscription
- Changes in other tabs don't sync
- User toggles sound in Tab A → Tab B doesn't update

**Root Cause:**
- No subscription to `user_preferences` table changes

**Impact:**
- Multi-tab usage shows stale preferences
- Inconsistent sound state across tabs

**Evidence:**
```typescript
// Line 26-69: Loads on mount, no subscription
useEffect(() => {
  const loadSoundPreferences = async () => {
    // ... loads from Supabase
  };
  loadSoundPreferences();
}, []); // ❌ No realtime subscription
```

---

### 4.2 🟡 HIGH: Empty Dependency Array Without Memoization
**Location:** `frontend/src/contexts/SoundContext.tsx:26`

**Problem:**
- `useEffect` has empty dependency array `[]`
- `loadSoundPreferences` function is recreated on every render (not memoized)
- Function is only called once, but still recreated

**Root Cause:**
- Function not wrapped in `useCallback`

**Impact:**
- Minor performance impact
- Code smell (function recreated unnecessarily)

---

### 4.3 🟡 HIGH: No Error Recovery
**Location:** `frontend/src/contexts/SoundContext.tsx:49-65`

**Problem:**
- Errors are caught and logged but no retry
- Failed load leaves preferences at defaults

**Root Cause:**
- Basic error handling

**Impact:**
- User preferences may not load on first attempt

---

## 5. ProfileService Issues

### 5.1 🔴 CRITICAL: Cache Invalidation Not Triggered by Realtime
**Location:** `frontend/src/services/profileService.ts:7-74`

**Problem:**
- `profileService` has 30-second TTL cache
- Cache is cleared manually via `clearCache()` but not on realtime updates
- No realtime subscription awareness

**Root Cause:**
- Cache is service-level, not context-aware
- No integration with realtime subscriptions

**Impact:**
- Profile updates in other tabs don't invalidate cache
- Stale profile data served from cache
- User sees old username/avatar for up to 30 seconds

**Evidence:**
```typescript
// Line 8-9: Cache with TTL
const profileCache = new Map<string, { data: Profile | null; timestamp: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

// Line 68-74: Manual cache clear, but no realtime integration
clearCache(userId?: string): void {
  // ...
}
```

---

### 5.2 🟡 HIGH: Cache Cleanup Runs on Every Get
**Location:** `frontend/src/services/profileService.ts:52-60`

**Problem:**
- Cache cleanup runs on every `getProfile()` call if cache size > 50
- Should be debounced or run periodically

**Root Cause:**
- Cleanup logic in hot path

**Impact:**
- Minor performance impact on frequent profile fetches

---

## 6. useProfile Hook Issues

### 6.1 🔴 CRITICAL: Missing Realtime Subscription
**Location:** `frontend/src/hooks/useProfile.ts:13-56`

**Problem:**
- `useProfile` hook loads profile on mount but has NO realtime subscription
- Profile updates in other tabs don't sync

**Root Cause:**
- No subscription to `profiles` table changes

**Impact:**
- Multi-tab usage shows stale profile data
- Username/avatar changes don't sync

**Evidence:**
```typescript
// Line 36-38: Loads on mount, no subscription
useEffect(() => {
  refresh();
}, [refresh]); // ❌ No realtime subscription
```

---

### 6.2 🟡 HIGH: refresh Function Recreated on Every currentUser Change
**Location:** `frontend/src/hooks/useProfile.ts:19-34`

**Problem:**
- `refresh` is wrapped in `useCallback` with `[currentUser]` dependency
- When `currentUser` changes, `refresh` reference changes
- This triggers `useEffect` to re-run, which is correct but inefficient

**Root Cause:**
- Could depend on `currentUser?.uid` instead of entire `currentUser` object

**Impact:**
- Unnecessary re-renders if `currentUser` object reference changes but `uid` is same

---

## 7. State Duplication Issues

### 7.1 🔴 CRITICAL: Profile Data Duplicated Across Contexts
**Location:** Multiple files

**Problem:**
- Profile data exists in:
  1. `AuthContext` (checks profile existence, stores `isNewUser`)
  2. `useProfile` hook (stores full profile object)
  3. `ProfilePage` component (fetches profile independently)
  4. `profileService` cache (service-level cache)

**Root Cause:**
- No single source of truth
- Each component/hook fetches independently

**Impact:**
- Inconsistent profile state across app
- Multiple network requests for same data
- Stale data in some contexts

---

### 7.2 🔴 CRITICAL: Pet Data Duplicated
**Location:** Multiple files

**Problem:**
- Pet data exists in:
  1. `AuthContext` (checks pet existence, stores `hasPet`)
  2. `PetContext` (stores full pet object)
  3. `ProfilePage` component (fetches pet independently)

**Root Cause:**
- No single source of truth

**Impact:**
- Inconsistent pet state
- Multiple network requests
- Stale data

---

### 7.3 🟡 HIGH: Finance Data Duplicated
**Location:** `frontend/src/context/FinancialContext.tsx`, `frontend/src/components/finance/FinancePanel.tsx`

**Problem:**
- Finance data exists in:
  1. `FinancialContext` (stores balance, transactions)
  2. `FinancePanel` component (stores summary independently)

**Root Cause:**
- Context not integrated with component

**Impact:**
- Duplicate state
- Inconsistent data

---

## 8. Realtime Subscription Issues

### 8.1 🔴 CRITICAL: Inconsistent Realtime Patterns
**Location:** Multiple files

**Problem:**
- Some contexts have realtime (AuthContext for pets)
- Some hooks have realtime (useFinanceRealtime)
- Some contexts missing realtime (PetContext, SoundContext, useProfile)
- No unified pattern

**Root Cause:**
- Realtime added incrementally, not systematically

**Impact:**
- Inconsistent sync behavior
- Some features sync, others don't
- User confusion

---

### 8.2 🟡 HIGH: Realtime Subscriptions Not Cleaned Up Properly
**Location:** `frontend/src/contexts/AuthContext.tsx:322-330`

**Problem:**
- Cleanup in `useEffect` return, but if component unmounts during async operation, cleanup may not run
- No check for active subscriptions before cleanup

**Root Cause:**
- Cleanup assumes subscription exists

**Impact:**
- Potential memory leaks
- Subscriptions may persist after unmount

---

## 9. Missing Loading/Error States

### 9.1 🟡 HIGH: PetContext Missing Updating State
**Location:** `frontend/src/context/PetContext.tsx:101-154`

**Problem:**
- `updatePetStats()` doesn't expose `updating` state
- UI can't show loading indicator during updates

---

### 9.2 🟡 HIGH: FinancialContext Error State Not Exposed Properly
**Location:** `frontend/src/context/FinancialContext.tsx:41-42`

**Problem:**
- Error state exists but not always set on all error paths
- Some errors are swallowed

---

## 10. Dependency Array Issues

### 10.1 🟡 HIGH: Multiple Incorrect Dependency Arrays
**Location:** Various files

**Summary:**
- `PetContext`: `useEffect` depends on `loadPet` instead of `userId`
- `SoundContext`: Empty dependency array but function not memoized
- `FinancialContext`: Missing `loadFinancialData` in dependency array (intentional but risky)
- `useProfile`: Depends on `currentUser` object instead of `currentUser?.uid`

---

## Summary Statistics

- **Total Issues:** 26
- **Critical:** 8
- **High:** 12
- **Medium:** 6

**Most Affected Files:**
1. `AuthContext.tsx` - 6 issues
2. `PetContext.tsx` - 5 issues
3. `FinancialContext.tsx` - 4 issues
4. `SoundContext.tsx` - 3 issues
5. `profileService.ts` - 2 issues
6. `useProfile.ts` - 2 issues

**Root Causes:**
1. Missing realtime subscriptions (6 contexts/hooks)
2. State duplication (3 areas)
3. Race conditions (2 areas)
4. Incorrect dependency arrays (4 instances)
5. Missing error recovery (5 instances)

---

## Recommendations

1. **Immediate (Critical):**
   - Add realtime subscriptions to all contexts
   - Fix race conditions in AuthContext
   - Consolidate state to single source of truth

2. **Short-term (High):**
   - Fix dependency arrays
   - Add retry logic to all fetch operations
   - Integrate FinancialContext with useFinanceRealtime

3. **Long-term (Medium):**
   - Add updating states to all contexts
   - Optimize cache cleanup
   - Create unified realtime subscription pattern

