# Global Context Architecture Execution Order

**Date:** 2024-12-19  
**Purpose:** Safe sequence to apply architecture fixes without breaking the application

---

## Execution Strategy

1. **Fix in dependency order:** Fix contexts that other contexts depend on first
2. **One file at a time:** Complete all changes to a file before moving to next
3. **Test after each file:** Run typecheck, build, and tests after each file
4. **Atomic commits:** Commit after each file is complete and tested
5. **Rollback ready:** Each commit is independently reversible

---

## Execution Sequence

### Phase 1: Foundation (AuthContext)
**Why first:** Other contexts depend on AuthContext for user state

#### Step 1.1: AuthContext - Add Profile Realtime Subscription
- **File:** `frontend/src/contexts/AuthContext.tsx`
- **Change:** Add profile table to realtime subscription
- **Risk:** Low - only adds subscription, doesn't change existing logic
- **Test:** Verify profile updates sync across tabs

**Commit message:**
```
fix(AuthContext): Add realtime subscription for profiles table

- Add profiles table to realtime subscription alongside pets
- Sync profile changes across tabs to update isNewUser flag
- Fixes stale profile state in multi-tab scenarios
```

---

#### Step 1.2: AuthContext - Extract Subscription Helper
- **File:** `frontend/src/contexts/AuthContext.tsx`
- **Change:** Extract subscription setup to helper function
- **Risk:** Low - refactoring, no behavior change
- **Test:** Verify subscriptions still work correctly

**Commit message:**
```
refactor(AuthContext): Extract subscription setup to helper function

- Eliminate duplicate subscription code
- Create setupUserDataSubscription helper
- Improve maintainability and consistency
```

---

#### Step 1.3: AuthContext - Memoize Functions
- **File:** `frontend/src/contexts/AuthContext.tsx`
- **Change:** Wrap checkUserProfile and refreshUserState in useCallback
- **Risk:** Low - performance optimization, no behavior change
- **Test:** Verify functions still work, check for unnecessary re-renders

**Commit message:**
```
perf(AuthContext): Memoize checkUserProfile and refreshUserState

- Wrap functions in useCallback to prevent unnecessary re-renders
- Improve performance and ensure stable function references
```

---

#### Step 1.4: AuthContext - Fix Timeout Cleanup
- **File:** `frontend/src/contexts/AuthContext.tsx`
- **Change:** Store timeout in ref for proper cleanup
- **Risk:** Low - memory leak fix, no behavior change
- **Test:** Verify timeout is cleaned up on unmount

**Commit message:**
```
fix(AuthContext): Fix fallback timeout cleanup

- Store timeout in ref for proper cleanup
- Prevent memory leaks on component unmount
```

---

**Phase 1 Complete Checkpoint:**
```bash
cd frontend && npm run typecheck
cd frontend && npm run build
cd frontend && npm test -- --testPathPattern=AuthContext
```

---

### Phase 2: Pet Context (Depends on AuthContext)
**Why second:** PetContext uses AuthContext, but is independent otherwise

#### Step 2.1: PetContext - Add Realtime Subscription
- **File:** `frontend/src/context/PetContext.tsx`
- **Change:** Add realtime subscription for pets table
- **Risk:** Medium - adds new behavior, test thoroughly
- **Test:** Verify pet updates sync across tabs

**Commit message:**
```
feat(PetContext): Add realtime subscription for pet changes

- Subscribe to pets table changes for real-time sync
- Sync pet updates across tabs and windows
- Fixes stale pet data in multi-tab scenarios
```

---

#### Step 2.2: PetContext - Fix Dependency Array
- **File:** `frontend/src/context/PetContext.tsx`
- **Change:** Fix useEffect dependency from loadPet to userId
- **Risk:** Low - fixes incorrect dependency, should improve behavior
- **Test:** Verify pet loads correctly when userId changes

**Commit message:**
```
fix(PetContext): Fix useEffect dependency array

- Change dependency from loadPet to userId
- Prevents unnecessary re-renders and potential infinite loops
- Ensures correct dependency tracking
```

---

#### Step 2.3: PetContext - Add Retry Logic
- **File:** `frontend/src/context/PetContext.tsx`
- **Change:** Add retry logic with exponential backoff to loadPet
- **Risk:** Medium - changes error handling behavior
- **Test:** Verify retries work on transient errors, verify no infinite retries

**Commit message:**
```
feat(PetContext): Add retry logic for pet data loading

- Implement exponential backoff retry (3 attempts)
- Handle transient network errors gracefully
- Improve reliability of pet data loading
```

---

#### Step 2.4: PetContext - Add Updating State
- **File:** `frontend/src/context/PetContext.tsx`
- **Change:** Add updating state and expose in context value
- **Risk:** Low - adds new state, doesn't change existing behavior
- **Test:** Verify updating state is set during updates

**Commit message:**
```
feat(PetContext): Add updating state for pet stat updates

- Expose updating boolean in context value
- Allow UI to show loading state during updates
- Improve user feedback during pet interactions
```

---

#### Step 2.5: PetContext - Improve Optimistic Update Rollback
- **File:** `frontend/src/context/PetContext.tsx`
- **Change:** Store previous state for immediate rollback
- **Risk:** Low - improves error handling, no behavior change
- **Test:** Verify rollback works correctly on errors

**Commit message:**
```
fix(PetContext): Improve optimistic update rollback

- Store previous pet state for immediate rollback
- Provide better UX during error recovery
- Ensure consistency after failed updates
```

---

**Phase 2 Complete Checkpoint:**
```bash
cd frontend && npm run typecheck
cd frontend && npm run build
cd frontend && npm test -- --testPathPattern=PetContext
```

---

### Phase 3: Financial Context (Independent)
**Why third:** FinancialContext is independent, can be fixed in parallel

#### Step 3.1: FinancialContext - Integrate useFinanceRealtime
- **File:** `frontend/src/context/FinancialContext.tsx`
- **Change:** Add useFinanceRealtime hook integration
- **Risk:** Medium - adds new behavior
- **Test:** Verify finance data syncs across tabs

**Commit message:**
```
feat(FinancialContext): Integrate useFinanceRealtime hook

- Add realtime subscription for finance data
- Sync balance and transactions across tabs
- Use existing useFinanceRealtime hook pattern
```

---

#### Step 3.2: FinancialContext - Use Supabase Directly
- **File:** `frontend/src/context/FinancialContext.tsx`
- **Change:** Replace API calls with direct Supabase queries
- **Risk:** High - changes data source, test thoroughly
- **Test:** Verify all finance data loads correctly, verify error handling

**Commit message:**
```
refactor(FinancialContext): Use Supabase directly instead of API

- Replace getFinanceSummary API call with direct Supabase queries
- Consistent with other contexts (PetContext, etc.)
- Remove unnecessary API layer, improve performance
```

---

#### Step 3.3: FinancialContext - Add Retry Logic
- **File:** `frontend/src/context/FinancialContext.tsx`
- **Change:** Add retry wrapper for loadFinancialData
- **Risk:** Medium - changes error handling
- **Test:** Verify retries work, verify no infinite retries

**Commit message:**
```
feat(FinancialContext): Add retry logic for finance data loading

- Implement exponential backoff retry (3 attempts)
- Handle transient network errors gracefully
- Improve reliability of finance data loading
```

---

#### Step 3.4: FinancialContext - Improve Optimistic Rollback
- **File:** `frontend/src/context/FinancialContext.tsx`
- **Change:** Store previous state for immediate rollback
- **Risk:** Low - improves error handling
- **Test:** Verify rollback works correctly

**Commit message:**
```
fix(FinancialContext): Improve optimistic update rollback

- Store previous balance/transactions for immediate rollback
- Provide better UX during error recovery
- Ensure consistency after failed updates
```

---

**Phase 3 Complete Checkpoint:**
```bash
cd frontend && npm run typecheck
cd frontend && npm run build
cd frontend && npm test -- --testPathPattern=FinancialContext
```

---

### Phase 4: Sound Context (Independent)
**Why fourth:** SoundContext is independent, low risk

#### Step 4.1: SoundContext - Add Realtime Subscription
- **File:** `frontend/src/contexts/SoundContext.tsx`
- **Change:** Add realtime subscription for user_preferences
- **Risk:** Medium - adds new behavior
- **Test:** Verify sound preferences sync across tabs

**Commit message:**
```
feat(SoundContext): Add realtime subscription for preferences

- Subscribe to user_preferences table changes
- Sync sound/music preferences across tabs
- Fixes stale preferences in multi-tab scenarios
```

---

#### Step 4.2: SoundContext - Memoize loadSoundPreferences
- **File:** `frontend/src/contexts/SoundContext.tsx`
- **Change:** Wrap loadSoundPreferences in useCallback
- **Risk:** Low - performance optimization
- **Test:** Verify function still works correctly

**Commit message:**
```
perf(SoundContext): Memoize loadSoundPreferences function

- Wrap in useCallback to prevent unnecessary re-renders
- Improve performance and ensure stable function reference
```

---

#### Step 4.3: SoundContext - Add Retry Logic
- **File:** `frontend/src/contexts/SoundContext.tsx`
- **Change:** Add retry logic with exponential backoff
- **Risk:** Medium - changes error handling
- **Test:** Verify retries work correctly

**Commit message:**
```
feat(SoundContext): Add retry logic for preferences loading

- Implement exponential backoff retry (3 attempts)
- Handle transient network errors gracefully
- Improve reliability of preferences loading
```

---

**Phase 4 Complete Checkpoint:**
```bash
cd frontend && npm run typecheck
cd frontend && npm run build
cd frontend && npm test -- --testPathPattern=SoundContext
```

---

### Phase 5: Services and Hooks
**Why last:** These are used by contexts, but changes are independent

#### Step 5.1: profileService - Add Cache Invalidation
- **File:** `frontend/src/services/profileService.ts`
- **Change:** Export invalidateCache function
- **Risk:** Low - adds new function, doesn't change existing behavior
- **Test:** Verify cache invalidation works

**Commit message:**
```
feat(profileService): Export cache invalidation function

- Add invalidateCache method for realtime subscriptions
- Allow contexts to invalidate cache on profile changes
- Improve cache consistency with realtime updates
```

---

#### Step 5.2: profileService - Debounce Cache Cleanup
- **File:** `frontend/src/services/profileService.ts`
- **Change:** Debounce cache cleanup to reduce performance impact
- **Risk:** Low - performance optimization
- **Test:** Verify cache cleanup still works

**Commit message:**
```
perf(profileService): Debounce cache cleanup

- Reduce frequency of cache cleanup operations
- Improve performance on frequent profile fetches
- Maintain cache size management
```

---

#### Step 5.3: useProfile - Add Realtime Subscription
- **File:** `frontend/src/hooks/useProfile.ts`
- **Change:** Add realtime subscription for profiles table
- **Risk:** Medium - adds new behavior
- **Test:** Verify profile updates sync across tabs

**Commit message:**
```
feat(useProfile): Add realtime subscription for profile changes

- Subscribe to profiles table changes
- Sync profile updates across tabs
- Invalidate cache and refresh on changes
```

---

#### Step 5.4: useProfile - Fix Dependency Array
- **File:** `frontend/src/hooks/useProfile.ts`
- **Change:** Fix dependency from currentUser to currentUser?.uid
- **Risk:** Low - fixes incorrect dependency
- **Test:** Verify profile loads correctly when user changes

**Commit message:**
```
fix(useProfile): Fix dependency array for refresh function

- Change dependency from currentUser to currentUser?.uid
- Prevents unnecessary re-renders when currentUser object changes
- Ensures correct dependency tracking
```

---

**Phase 5 Complete Checkpoint:**
```bash
cd frontend && npm run typecheck
cd frontend && npm run build
cd frontend && npm test -- --testPathPattern="(profileService|useProfile)"
```

---

## Final Verification

After all phases complete:

```bash
# Full typecheck
cd frontend && npm run typecheck

# Full build
cd frontend && npm run build

# All context tests
cd frontend && npm test -- --testPathPattern=Context

# Integration test (if available)
cd frontend && npm test -- --testPathPattern=integration
```

---

## Rollback Plan

If any step fails:

1. **Identify failing step** from commit history
2. **Revert last commit:** `git revert HEAD`
3. **Fix issue** in code
4. **Re-apply fix** and test
5. **Continue** from failing step

Each commit is atomic and independently reversible.

---

## Estimated Time

- **Phase 1 (AuthContext):** 30-45 minutes
- **Phase 2 (PetContext):** 30-45 minutes
- **Phase 3 (FinancialContext):** 30-45 minutes
- **Phase 4 (SoundContext):** 20-30 minutes
- **Phase 5 (Services/Hooks):** 20-30 minutes

**Total:** ~2.5-3.5 hours

---

## Success Criteria

✅ All TypeScript typechecks pass  
✅ All builds complete without errors  
✅ All context tests pass  
✅ Realtime subscriptions work across tabs  
✅ No state duplication between contexts  
✅ All dependency arrays are correct  
✅ Error recovery works for all contexts  
✅ Loading states are properly exposed  

---

## Notes

- **Never skip testing:** Always run typecheck, build, and tests after each file
- **Commit frequently:** Each file should be committed separately
- **Test manually:** In addition to automated tests, manually verify realtime sync across tabs
- **Monitor console:** Watch for errors or warnings during testing
- **Document issues:** If any step fails, document the issue before proceeding

