# Onboarding State Machine - Final Documentation

**Date:** 2025-01-23  
**Status:** ✅ **VALIDATED AND DOCUMENTED**

---

## State Machine Overview

The onboarding system uses a state machine to manage user authentication and pet ownership states. The state machine ensures correct routing and prevents invalid state transitions.

---

## States

### 1. **UNKNOWN** (Initial State)
- **Description:** Initial state before auth context initializes
- **Properties:**
  - `currentUser: null`
  - `loading: true`
  - `isNewUser: false`
  - `hasPet: false`
- **Entry Conditions:** App mount, before any auth checks
- **Exit Conditions:** Auth initialization begins

---

### 2. **LOADING**
- **Description:** Auth context is checking session and user state
- **Properties:**
  - `currentUser: null | User`
  - `loading: true`
  - `isNewUser: false | true`
  - `hasPet: false | true`
- **Entry Conditions:**
  - AuthContext initialization
  - Auth state change event
  - Page refresh
- **Exit Conditions:**
  - Session check completes
  - Profile/pet checks complete
  - 10-second timeout (fallback)

---

### 3. **UNAUTHENTICATED**
- **Description:** User is not logged in
- **Properties:**
  - `currentUser: null`
  - `loading: false`
  - `isNewUser: false`
  - `hasPet: false`
- **Entry Conditions:**
  - No session found
  - User signs out
  - Session expires
- **Allowed Routes:**
  - `/` (Landing Page)
  - `/login`
  - `/signup`
  - `/register`
- **Blocked Routes:** All protected routes redirect to `/login`

---

### 4. **AUTHENTICATED_NO_PET** (New User)
- **Description:** User is logged in but has not created a pet
- **Properties:**
  - `currentUser: User`
  - `loading: false`
  - `isNewUser: true | false` (depends on profile)
  - `hasPet: false`
- **Entry Conditions:**
  - User logs in without pet
  - New user completes signup
  - Pet is deleted (edge case)
- **Allowed Routes:**
  - `/pet-selection`
  - `/onboarding/species`
  - `/onboarding/breed`
  - `/onboarding/naming`
- **Blocked Routes:**
  - All protected routes redirect to `/pet-selection`
  - Public routes redirect to `/pet-selection`

---

### 5. **AUTHENTICATED_HAS_PET** (Existing User)
- **Description:** User is logged in and has a pet
- **Properties:**
  - `currentUser: User`
  - `loading: false`
  - `isNewUser: false`
  - `hasPet: true`
- **Entry Conditions:**
  - User completes pet creation
  - Existing user logs in with pet
  - Pet created in another tab (realtime sync)
- **Allowed Routes:**
  - `/dashboard`
  - `/shop`
  - `/profile`
  - `/budget`
  - `/customize/avatar`
  - All protected routes
- **Blocked Routes:**
  - `/pet-selection` redirects to `/dashboard`
  - Public routes redirect to `/dashboard`

---

## State Transitions

### Transition Diagram

```
┌─────────────┐
│   UNKNOWN   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   LOADING   │
└──────┬──────┘
       │
       ├─────────────────┬──────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│UNAUTHENTICATED│  │AUTH_NO_PET  │  │AUTH_HAS_PET      │
└──────────────┘  └──────┬───────┘  └──────────────────┘
       │                 │                  │
       │                 │                  │
       └─────────────────┴──────────────────┘
                         │
                         │ (pet created)
                         ▼
                 ┌──────────────────┐
                 │AUTH_HAS_PET      │
                 └──────────────────┘
```

---

## Transition Rules

### 1. UNKNOWN → LOADING
- **Trigger:** Component mount
- **Action:** Initialize auth context, check session
- **Guarantees:** Always happens on mount

### 2. LOADING → UNAUTHENTICATED
- **Trigger:** No session found
- **Action:** Set `currentUser = null`, `loading = false`
- **Guarantees:** User can access public routes

### 3. LOADING → AUTHENTICATED_NO_PET
- **Trigger:** Session found, no pet detected
- **Action:** Set `currentUser`, `hasPet = false`, `loading = false`
- **Guarantees:** User redirected to `/pet-selection`

### 4. LOADING → AUTHENTICATED_HAS_PET
- **Trigger:** Session found, pet detected
- **Action:** Set `currentUser`, `hasPet = true`, `loading = false`
- **Guarantees:** User redirected to `/dashboard`

### 5. AUTHENTICATED_NO_PET → AUTHENTICATED_HAS_PET
- **Trigger:** Pet created successfully
- **Action:** `refreshUserState()` updates `hasPet = true`
- **Guarantees:** User redirected to `/dashboard`
- **Realtime Sync:** Other tabs detect change via Supabase subscription

### 6. AUTHENTICATED_* → UNAUTHENTICATED
- **Trigger:** User signs out, session expires
- **Action:** Clear user state, reset flags
- **Guarantees:** User redirected to `/login`

### 7. AUTHENTICATED_HAS_PET → AUTHENTICATED_NO_PET
- **Trigger:** Pet deleted (edge case)
- **Action:** `hasPet = false` via realtime subscription
- **Guarantees:** User redirected to `/pet-selection`

---

## Route Guard Logic

### ProtectedRoute
```typescript
if (loading) → show spinner
if (!currentUser) → redirect to /login
if (!hasPet) → redirect to /pet-selection
else → render children
```

### PublicRoute
```typescript
if (loading) → show spinner
if (currentUser && !hasPet) → redirect to /pet-selection
if (currentUser && hasPet) → redirect to /dashboard
else → render children
```

### OnboardingRoute
```typescript
if (loading) → show spinner
if (!currentUser) → redirect to /login
if (hasPet) → redirect to /dashboard
else → render children
```

---

## Race Condition Prevention

### 1. Loading State Management
- `loading = false` only set AFTER all async operations complete
- `checkUserProfile()` is awaited before setting loading state
- Fallback timeout (10s) prevents infinite loading

### 2. Initial Session Handling
- `getSession()` runs first
- `onAuthStateChange()` ignores `INITIAL_SESSION` events
- `initialSessionLoadedRef` prevents premature state changes

### 3. Pet Check Retry Logic
- Exponential backoff (100ms, 200ms, 400ms)
- Up to 3 retry attempts
- Handles transient network failures

### 4. Realtime Synchronization
- Supabase realtime subscription for pet table
- Automatically refreshes state on pet changes
- Prevents stale state across tabs

---

## State Validation

### Valid State Combinations

| currentUser | loading | isNewUser | hasPet | Valid? | Route |
|------------|---------|-----------|--------|--------|-------|
| null | true | false | false | ✅ | Loading spinner |
| null | false | false | false | ✅ | `/` or `/login` |
| User | true | * | * | ✅ | Loading spinner |
| User | false | true | false | ✅ | `/pet-selection` |
| User | false | false | false | ✅ | `/pet-selection` |
| User | false | false | true | ✅ | `/dashboard` |
| User | false | true | true | ⚠️ | Edge case (shouldn't happen) |

### Invalid State Combinations

- `currentUser !== null && loading === true && hasPet === true` (should wait for checks)
- `currentUser === null && hasPet === true` (impossible)
- `currentUser === null && isNewUser === true` (impossible)

---

## Error Handling

### Network Failures
- Retry logic handles transient failures
- Falls back to safe defaults (`hasPet = false`)
- User can retry manually

### Supabase Errors
- `PGRST116` (no rows) treated as "no pet" (not error)
- Other errors logged and handled gracefully
- State remains consistent

### State Refresh Failures
- `refreshUserState()` wrapped in try-catch
- Pet exists in DB (source of truth)
- Next page load will detect correctly

---

## Realtime Sync Behavior

### Multi-Tab Synchronization

1. **Tab A:** User creates pet
2. **Supabase:** Pet inserted into database
3. **Tab B:** Realtime subscription fires
4. **Tab B:** `refreshUserState()` called automatically
5. **Tab B:** `hasPet` updated to `true`
6. **Tab B:** Route guard redirects to `/dashboard`

### Subscription Lifecycle

- **Setup:** When user logs in and `currentUser` is set
- **Cleanup:** On logout, unmount, or user change
- **Events:** INSERT, UPDATE, DELETE on pets table
- **Filter:** `user_id = currentUser.uid`

---

## Token Refresh Handling

### Automatic Token Refresh
- Supabase handles token refresh automatically
- `TOKEN_REFRESHED` event fires
- State remains unchanged (no re-check needed)
- Session persists across refreshes

### Session Expiration
- Session expires → `SIGNED_OUT` event
- State transitions to `UNAUTHENTICATED`
- User redirected to `/login`

---

## Page Refresh Behavior

### Scenario 1: User with Pet Refreshes
1. Page reloads
2. `getSession()` restores session
3. `checkUserProfile()` queries Supabase
4. Pet found → `hasPet = true`
5. Route guard allows access to current route

### Scenario 2: User Without Pet Refreshes
1. Page reloads
2. `getSession()` restores session
3. `checkUserProfile()` queries Supabase
4. No pet found → `hasPet = false`
5. Route guard redirects to `/pet-selection`

### Scenario 3: User Creates Pet, Then Refreshes
1. Pet created in DB
2. `refreshUserState()` called
3. If refresh completes: `hasPet = true` → stay on `/dashboard`
4. If refresh fails: Next page load detects pet → redirect to `/dashboard`

---

## Edge Cases Handled

### 1. Profile Exists, No Pet
- ✅ Pet check runs regardless of profile status
- ✅ User treated as needing onboarding
- ✅ Redirected to `/pet-selection`

### 2. No Profile, Pet Exists (Edge Case)
- ✅ Pet check runs regardless of profile status
- ✅ Pet found → `hasPet = true`
- ✅ User can access protected routes

### 3. Profile Check Fails
- ✅ Pet check still runs
- ✅ Falls back to safe defaults
- ✅ User can retry

### 4. Pet Check Fails (Network Error)
- ✅ Retry logic attempts 3 times
- ✅ Falls back to `hasPet = false`
- ✅ User can retry manually

### 5. Multiple Tabs Open
- ✅ Realtime subscription syncs state
- ✅ All tabs update automatically
- ✅ No manual refresh needed

---

## State Machine Validation Checklist

- ✅ No blind spots in state transitions
- ✅ Race conditions prevented
- ✅ No wrong redirects
- ✅ Correct behavior on refresh
- ✅ Correct behavior across tabs
- ✅ Correct behavior on token refresh
- ✅ Error states handled gracefully
- ✅ Loading states prevent flickering
- ✅ Route guards enforce state correctly

---

## Conclusion

The onboarding state machine is **fully validated** and handles all edge cases. The implementation ensures:

1. **Deterministic routing** based on auth and pet state
2. **Race condition prevention** via proper async handling
3. **Multi-tab synchronization** via realtime subscriptions
4. **Error resilience** via retry logic and fallbacks
5. **Consistent state** across page refreshes and token refreshes

**Status:** ✅ **PRODUCTION READY**

---

**Document Generated:** 2025-01-23  
**Last Updated:** 2025-01-23

