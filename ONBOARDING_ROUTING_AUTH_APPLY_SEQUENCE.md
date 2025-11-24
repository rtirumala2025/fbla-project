# Onboarding, Routing, and Authentication Fix Application Sequence

**Date**: 2024-12-19  
**Agent**: Authentication, Routing, and Onboarding Refactor Agent  
**Based on**: ONBOARDING_ROUTING_AUTH_FIX_PLAN.md

---

## Execution Strategy

Changes will be applied in **dependency order** to ensure:
1. ✅ Type safety is maintained at each step
2. ✅ Each change can be tested independently
3. ✅ Reversible commits for easy rollback
4. ✅ No breaking changes between steps

---

## Phase 1: Core AuthContext Fixes (Foundation)

### Step 1.1: Fix AuthContext Type Signature
**File**: `frontend/src/contexts/AuthContext.tsx`  
**Change**: Update `AuthContextType` to include return types  
**Risk**: 🟢 LOW  
**Dependencies**: None

**Actions**:
1. Update `refreshUserState` return type to `Promise<boolean>`
2. Update `markUserAsReturning` to accept optional `hasPetValue?: boolean`
3. Run TypeScript typecheck
4. Commit: `fix(AuthContext): update type signatures for state management methods`

**Verification**:
```bash
cd frontend
npm run type-check
```

---

### Step 1.2: Fix markUserAsReturning Implementation
**File**: `frontend/src/contexts/AuthContext.tsx`  
**Change**: Update `markUserAsReturning()` to accept and update `hasPet`  
**Risk**: 🟢 LOW  
**Dependencies**: Step 1.1

**Actions**:
1. Modify `markUserAsReturning()` function signature and implementation
2. Update calls to `markUserAsReturning()` in SetupProfile.tsx
3. Run TypeScript typecheck
4. Run build
5. Commit: `fix(AuthContext): markUserAsReturning now accepts optional hasPet parameter`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

---

### Step 1.3: Fix refreshUserState Return Value
**File**: `frontend/src/contexts/AuthContext.tsx`  
**Change**: Make `refreshUserState()` return `Promise<boolean>`  
**Risk**: 🟡 MEDIUM  
**Dependencies**: Step 1.1

**Actions**:
1. Modify `refreshUserState()` to return boolean success status
2. Add proper error handling and null checks
3. Update all callers to handle return value (will be done in later steps)
4. Run TypeScript typecheck
5. Run build
6. Commit: `fix(AuthContext): refreshUserState now returns success status`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

---

### Step 1.4: Fix Race Condition in AuthContext Initialization
**File**: `frontend/src/contexts/AuthContext.tsx`  
**Change**: Add synchronization between `getSession()` and `onAuthStateChange()`  
**Risk**: 🔴 HIGH  
**Dependencies**: Steps 1.1-1.3

**Actions**:
1. Add `initializationLock` mechanism
2. Update `getSession()` handler to set lock appropriately
3. Update `onAuthStateChange()` to wait for lock
4. Add guards to prevent pet subscription updates during initialization
5. Run TypeScript typecheck
6. Run build
7. Run frontend tests
8. Commit: `fix(AuthContext): prevent race condition between getSession and onAuthStateChange`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
npm test -- --testPathPattern="AuthContext|RouteGuards"
```

**Manual Testing**:
1. Clear browser localStorage
2. Refresh page on `/dashboard`
3. Verify no redirect loops
4. Verify user state loads correctly

---

## Phase 2: Route Guard Fixes

### Step 2.1: Add isTransitioning to ProtectedRoute
**File**: `frontend/src/App.tsx`  
**Change**: Add `isTransitioning` check to ProtectedRoute  
**Risk**: 🟡 MEDIUM  
**Dependencies**: None (isTransitioning already exists in AuthContext)

**Actions**:
1. Import `isTransitioning` from `useAuth()` in ProtectedRoute
2. Add check to bypass redirects when `isTransitioning === true`
3. Run TypeScript typecheck
4. Run build
5. Commit: `fix(App): ProtectedRoute now respects isTransitioning state`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

---

### Step 2.2: Create SetupProfileRoute Component
**File**: `frontend/src/App.tsx`  
**Change**: Create new SetupProfileRoute component  
**Risk**: 🟢 LOW  
**Dependencies**: Step 2.1

**Actions**:
1. Add SetupProfileRoute component after OnboardingRoute
2. Component should allow authenticated users with `isNewUser === true`
3. Should respect `isTransitioning` state
4. Run TypeScript typecheck
5. Run build
6. Commit: `fix(App): add SetupProfileRoute for proper profile setup gating`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

---

### Step 2.3: Update SetupProfile Route to Use SetupProfileRoute
**File**: `frontend/src/App.tsx`  
**Change**: Replace ProtectedRoute with SetupProfileRoute for `/setup-profile`  
**Risk**: 🟢 LOW  
**Dependencies**: Step 2.2

**Actions**:
1. Update route definition for `/setup-profile`
2. Replace `<ProtectedRoute>` with `<SetupProfileRoute>`
3. Run TypeScript typecheck
4. Run build
5. Commit: `fix(App): use SetupProfileRoute for setup-profile route`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

**Manual Testing**:
1. Sign up as new user
2. Verify redirect to `/setup-profile` works
3. Verify can access `/setup-profile` page
4. Verify no redirect loops

---

### Step 2.4: Fix PublicRoute Redirect Logic
**File**: `frontend/src/App.tsx`  
**Change**: Check `isNewUser` before `hasPet` in PublicRoute  
**Risk**: 🟡 MEDIUM  
**Dependencies**: None

**Actions**:
1. Import `isNewUser` from `useAuth()` in PublicRoute
2. Update redirect logic to check profile before pet
3. Redirect to `/setup-profile` if `isNewUser === true`
4. Run TypeScript typecheck
5. Run build
6. Commit: `fix(App): PublicRoute now checks profile before pet existence`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

---

## Phase 3: Component State Management Fixes

### Step 3.1: Fix SetupProfile to Pass hasPet Parameter
**File**: `frontend/src/pages/SetupProfile.tsx`  
**Change**: Pass `false` to `markUserAsReturning(false)`  
**Risk**: 🟢 LOW  
**Dependencies**: Step 1.2

**Actions**:
1. Update call to `markUserAsReturning(false)` after profile creation
2. Run TypeScript typecheck
3. Run build
4. Commit: `fix(SetupProfile): pass hasPet=false to markUserAsReturning`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

---

### Step 3.2: Improve PetNaming State Synchronization
**File**: `frontend/src/pages/PetNaming.tsx`  
**Change**: Add delay after pet creation before navigation  
**Risk**: 🟡 MEDIUM  
**Dependencies**: None

**Actions**:
1. Add 500ms delay after `createPet()` completes
2. Use `replace: true` in navigate call
3. Run TypeScript typecheck
4. Run build
5. Commit: `fix(PetNaming): wait for state propagation before navigation`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

**Manual Testing**:
1. Complete pet creation flow
2. Verify redirect to `/dashboard` works
3. Verify no redirect loops
4. Verify pet appears on dashboard

---

### Step 3.3: Improve PetContext refreshUserState Error Handling
**File**: `frontend/src/context/PetContext.tsx`  
**Change**: Handle return value from refreshUserState and add retry logic  
**Risk**: 🟡 MEDIUM  
**Dependencies**: Step 1.3

**Actions**:
1. Update `createPet()` to handle boolean return from `refreshUserState()`
2. Add retry logic with delay
3. Improve error logging
4. Run TypeScript typecheck
5. Run build
6. Commit: `fix(PetContext): improve refreshUserState error handling and retry logic`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

---

### Step 3.4: Fix AuthCallback Redirect Logic
**File**: `frontend/src/pages/AuthCallback.tsx`  
**Change**: Check profile before pet in redirect logic  
**Risk**: 🟡 MEDIUM  
**Dependencies**: None

**Actions**:
1. Update redirect logic to check `hasProfile` first
2. Redirect to `/setup-profile` if no profile
3. Redirect to `/pet-selection` if profile but no pet
4. Redirect to `/dashboard` if both exist
5. Run TypeScript typecheck
6. Run build
7. Commit: `fix(AuthCallback): check profile before pet in redirect logic`

**Verification**:
```bash
cd frontend
npm run type-check
npm run build
```

**Manual Testing**:
1. Test OAuth callback for new user
2. Verify redirect to `/setup-profile`
3. Test OAuth callback for user with profile but no pet
4. Verify redirect to `/pet-selection`
5. Test OAuth callback for existing user
6. Verify redirect to `/dashboard`

---

## Phase 4: Testing and Verification

### Step 4.1: Run Full Test Suite
**Actions**:
1. Run all TypeScript typechecks
2. Run full build
3. Run all frontend tests
4. Check for any new errors

**Commands**:
```bash
cd frontend
npm run type-check
npm run build
npm test
```

---

### Step 4.2: Manual Testing Checklist
**Test Scenarios**:

1. **New User Signup Flow**:
   - ✅ Sign up with email/password → redirects to `/setup-profile`
   - ✅ Complete profile → redirects to `/pet-selection`
   - ✅ Complete pet creation → redirects to `/dashboard`
   - ✅ No redirect loops

2. **OAuth New User Flow**:
   - ✅ Sign in with Google → redirects to `/setup-profile`
   - ✅ Complete profile → redirects to `/pet-selection`
   - ✅ Complete pet creation → redirects to `/dashboard`
   - ✅ No redirect loops

3. **Returning User Flow**:
   - ✅ Login → redirects to `/dashboard`
   - ✅ Refresh page on `/dashboard` → stays on `/dashboard`
   - ✅ No redirect loops

4. **Edge Cases**:
   - ✅ Page refresh during onboarding → maintains correct state
   - ✅ Multiple tabs → state stays consistent
   - ✅ Network failure during state update → graceful degradation

---

## Rollback Plan

If any step fails:

1. **TypeScript Errors**: Fix immediately before proceeding
2. **Build Failures**: Fix immediately before proceeding
3. **Test Failures**: Investigate, fix, or revert commit
4. **Runtime Errors**: Revert commit and investigate

**Rollback Command**:
```bash
git log --oneline -1  # Get commit hash
git revert <commit-hash>
git push
```

---

## Success Criteria

All fixes are successful when:

1. ✅ TypeScript compiles without errors
2. ✅ Build completes without warnings
3. ✅ All existing tests pass
4. ✅ No redirect loops in any flow
5. ✅ New users complete onboarding successfully
6. ✅ Returning users can access dashboard
7. ✅ Page refreshes work correctly
8. ✅ OAuth flow works correctly
9. ✅ State updates propagate correctly
10. ✅ No race conditions observed

---

## Estimated Timeline

- **Phase 1**: 30-45 minutes
- **Phase 2**: 20-30 minutes
- **Phase 3**: 20-30 minutes
- **Phase 4**: 30-45 minutes

**Total**: ~2-2.5 hours

---

**End of Execution Sequence**

