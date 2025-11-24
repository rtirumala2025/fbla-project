# Onboarding, Routing, and Authentication Fix Plan

**Date**: 2024-12-19  
**Agent**: Authentication, Routing, and Onboarding Refactor Agent  
**Based on**: ONBOARDING_ROUTING_AUTH_AUDIT.md

---

## Fix Strategy Overview

This plan provides exact, file-by-file changes to fix all identified issues. Changes are designed to be:
- **Atomic**: Each change can be committed independently
- **Reversible**: All changes can be rolled back
- **Type-safe**: Maintains TypeScript type safety
- **Non-breaking**: Doesn't break existing functionality

---

## File 1: `frontend/src/contexts/AuthContext.tsx`

### Change 1.1: Fix Race Condition in Initialization
**Issue**: `onAuthStateChange` can fire before `getSession()` completes  
**Location**: Lines 159-280

**Current Code** (lines 159-200):
```typescript
useEffect(() => {
  onboardingLogger.authInit('Initializing AuthContext', { supabaseInitialized: !!supabase });
  
  const fallbackTimeout = setTimeout(() => {
    console.warn('⏰ AuthContext: Fallback timeout - forcing loading to false');
    setLoading(false);
  }, 10000);
  
  supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    // ... state updates
    setCurrentUser(mappedUser);
    setLoading(false);
    initialSessionLoadedRef.current = true; // Set too late
    clearTimeout(fallbackTimeout);
    // ...
  });
```

**Replace With**:
```typescript
useEffect(() => {
  onboardingLogger.authInit('Initializing AuthContext', { supabaseInitialized: !!supabase });
  
  // CRITICAL: Mark as loading BEFORE any async operations
  // This prevents onAuthStateChange from processing until we're ready
  let isInitialLoadComplete = false;
  const initializationLock = { locked: true };
  
  const fallbackTimeout = setTimeout(() => {
    console.warn('⏰ AuthContext: Fallback timeout - forcing loading to false');
    setLoading(false);
    initializationLock.locked = false;
  }, 10000);
  
  supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    try {
      onboardingLogger.authInit('Initial session check', {
        hasSession: !!session,
        userEmail: session?.user?.email || undefined,
        error: error?.message || undefined,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
      });
      
      const mappedUser = mapSupabaseUser(session?.user || null);
      onboardingLogger.authInit('Mapped user', { userId: mappedUser?.uid || undefined, email: mappedUser?.email || undefined });
      
      try {
        if (mappedUser) {
          const { isNew, hasPet: petExists } = await checkUserProfile(mappedUser.uid);
          onboardingLogger.authInit('Profile check complete', { userId: mappedUser.uid, isNew, hasPet: petExists });
          setIsNewUser(isNew);
          setHasPet(petExists);
        } else {
          setIsNewUser(false);
          setHasPet(false);
        }
      } catch (profileError) {
        onboardingLogger.error('Error checking user profile during initialization', profileError);
        setIsNewUser(false);
        setHasPet(false);
      }
      
      setCurrentUser(mappedUser);
      isInitialLoadComplete = true;
      initializationLock.locked = false;
      setLoading(false);
      clearTimeout(fallbackTimeout);
      
      // Set up pet subscription if user exists
      if (mappedUser?.uid && !petSubscriptionRef.current) {
        onboardingLogger.realtimeEvent('Setting up pet subscription', { userId: mappedUser.uid });
        petSubscriptionRef.current = supabase
          .channel(`pet-changes-${mappedUser.uid}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pets',
              filter: `user_id=eq.${mappedUser.uid}`,
            },
            async (payload) => {
              // CRITICAL: Only process updates after initial load
              if (!isInitialLoadComplete) {
                onboardingLogger.realtimeEvent('Skipping pet change - initial load not complete');
                return;
              }
              onboardingLogger.realtimeEvent('Pet change detected', { eventType: payload.eventType, userId: mappedUser.uid });
              try {
                await refreshUserState();
              } catch (error) {
                onboardingLogger.error('Error refreshing state after pet change', error, { userId: mappedUser.uid });
              }
            }
          )
          .subscribe();
      }
    } catch (err: any) {
      onboardingLogger.error('Error in getSession handler', err);
      isInitialLoadComplete = true;
      initializationLock.locked = false;
      setCurrentUser(null);
      setIsNewUser(false);
      setHasPet(false);
      setLoading(false);
      clearTimeout(fallbackTimeout);
    }
  }).catch((err: any) => {
    onboardingLogger.error('Error getting session', err);
    isInitialLoadComplete = true;
    initializationLock.locked = false;
    setCurrentUser(null);
    setIsNewUser(false);
    setHasPet(false);
    setLoading(false);
    clearTimeout(fallbackTimeout);
  });

  // Listen for auth changes - CRITICAL: Only process after initial load
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
    onboardingLogger.authStateChange(event, {
      hasSession: !!session,
      userEmail: session?.user?.email || undefined,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
    });
    
    // CRITICAL: Ignore INITIAL_SESSION - we handle via getSession()
    if (event === 'INITIAL_SESSION') {
      onboardingLogger.authStateChange('Skipping INITIAL_SESSION - handled by getSession()');
      return;
    }
    
    // CRITICAL: Wait for initial load to complete before processing changes
    // Use polling to check lock (max 5 seconds)
    const maxWaitTime = 5000;
    const checkInterval = 50;
    let waited = 0;
    
    while (initializationLock.locked && waited < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }
    
    if (initializationLock.locked && waited >= maxWaitTime) {
      onboardingLogger.authStateChange('Timeout waiting for initial load - processing anyway');
    }
    
    const mappedUser = mapSupabaseUser(session?.user || null);
    onboardingLogger.authStateChange('Processing auth state change', { userId: mappedUser?.uid || undefined, email: mappedUser?.email || undefined });
    
    try {
      if (mappedUser) {
        const { isNew, hasPet: petExists } = await checkUserProfile(mappedUser.uid);
        onboardingLogger.authStateChange('Profile check complete', { userId: mappedUser.uid, isNew, hasPet: petExists });
        setIsNewUser(isNew);
        setHasPet(petExists);
      } else {
        setIsNewUser(false);
        setHasPet(false);
      }
    } catch (profileError) {
      onboardingLogger.error('Error checking user profile in auth change', profileError);
      setIsNewUser(false);
      setHasPet(false);
    }
    
    setCurrentUser(mappedUser);
    setLoading(false);
    
    // Set up or update pet subscription if user exists
    if (mappedUser?.uid) {
      // Clean up existing subscription if user changed
      if (petSubscriptionRef.current) {
        petSubscriptionRef.current.unsubscribe();
        petSubscriptionRef.current = null;
      }
      
      onboardingLogger.realtimeEvent('Setting up pet subscription', { userId: mappedUser.uid });
      petSubscriptionRef.current = supabase
        .channel(`pet-changes-${mappedUser.uid}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pets',
            filter: `user_id=eq.${mappedUser.uid}`,
          },
          async (payload) => {
            onboardingLogger.realtimeEvent('Pet change detected', { eventType: payload.eventType, userId: mappedUser.uid });
            try {
              await refreshUserState();
            } catch (error) {
              onboardingLogger.error('Error refreshing state after pet change', error, { userId: mappedUser.uid });
            }
          }
        )
        .subscribe();
    } else {
      // Clean up subscription if user logged out
      if (petSubscriptionRef.current) {
        onboardingLogger.realtimeEvent('Cleaning up pet subscription - user logged out');
        petSubscriptionRef.current.unsubscribe();
        petSubscriptionRef.current = null;
      }
    }
  });
```

### Change 1.2: Fix markUserAsReturning to Update hasPet
**Issue**: `markUserAsReturning()` doesn't update `hasPet` state  
**Location**: Lines 145-149

**Current Code**:
```typescript
const markUserAsReturning = () => {
  console.log('✅ AuthContext: Marking user as returning (profile exists)');
  setIsNewUser(false);
  setIsTransitioning(true);
};
```

**Replace With**:
```typescript
const markUserAsReturning = (hasPetValue?: boolean) => {
  console.log('✅ AuthContext: Marking user as returning (profile exists)', { hasPetValue });
  setIsNewUser(false);
  if (hasPetValue !== undefined) {
    setHasPet(hasPetValue);
  }
  setIsTransitioning(true);
};
```

### Change 1.3: Fix refreshUserState to Return Success Status
**Issue**: `refreshUserState()` fails silently  
**Location**: Lines 113-142

**Current Code**:
```typescript
const refreshUserState = async () => {
  onboardingLogger.authInit('Refreshing user state');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // ... state updates
    }
  } catch (error) {
    onboardingLogger.error('Error refreshing user state', error);
  }
};
```

**Replace With**:
```typescript
const refreshUserState = async (): Promise<boolean> => {
  onboardingLogger.authInit('Refreshing user state');
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      onboardingLogger.error('Error getting session in refreshUserState', sessionError);
      return false;
    }
    
    if (!session?.user) {
      onboardingLogger.authInit('No session in refreshUserState');
      setCurrentUser(null);
      setIsNewUser(false);
      setHasPet(false);
      return false;
    }
    
    // Fetch the latest profile data from the database
    const profile = await profileService.getProfile(session.user.id);
    
    // Create updated user object with latest username from profile
    const updatedUser: User = {
      uid: session.user.id,
      email: session.user.email || null,
      displayName: profile?.username || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || null,
    };
    
    const isNew = profile === null;
    
    // Check for pet existence (always check, regardless of profile status)
    let petExists = false;
    petExists = await checkPetWithRetry(session.user.id);
    
    onboardingLogger.authInit('User state refreshed', { userId: session.user.id, isNew, hasPet: petExists, displayName: updatedUser.displayName });
    setIsNewUser(isNew);
    setHasPet(petExists);
    setCurrentUser(updatedUser);
    return true;
  } catch (error) {
    onboardingLogger.error('Error refreshing user state', error);
    return false;
  }
};
```

### Change 1.4: Update AuthContextType to Include Return Type
**Location**: Lines 14-28

**Current Code**:
```typescript
type AuthContextType = {
  // ...
  refreshUserState: () => Promise<void>;
  // ...
};
```

**Replace With**:
```typescript
type AuthContextType = {
  // ...
  refreshUserState: () => Promise<boolean>;
  markUserAsReturning: (hasPetValue?: boolean) => void;
  // ...
};
```

---

## File 2: `frontend/src/App.tsx`

### Change 2.1: Fix ProtectedRoute to Use isTransitioning
**Issue**: `ProtectedRoute` doesn't check `isTransitioning`  
**Location**: Lines 55-77

**Current Code**:
```typescript
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, hasPet } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but doesn't have a pet, redirect to pet selection
  // This ensures users complete onboarding before accessing protected routes
  if (!hasPet) {
    return <Navigate to="/pet-selection" replace />;
  }

  return <>{children}</>;
};
```

**Replace With**:
```typescript
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, hasPet, isTransitioning } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: During transition state, allow access to prevent redirect loops
  // This allows navigation to complete before route guards re-evaluate
  if (isTransitioning) {
    return <>{children}</>;
  }

  // If user is authenticated but doesn't have a pet, redirect to pet selection
  // This ensures users complete onboarding before accessing protected routes
  if (!hasPet) {
    return <Navigate to="/pet-selection" replace />;
  }

  return <>{children}</>;
};
```

### Change 2.2: Create SetupProfileRoute Component
**Issue**: `/setup-profile` uses wrong guard  
**Location**: After `OnboardingRoute` component, before `AppContent`

**Add New Component** (after line 129):
```typescript
// Setup profile route component - accessible to authenticated users WITHOUT profiles
// Allows users to complete profile setup before pet selection
const SetupProfileRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, isNewUser, isTransitioning } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Must be authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: During transition, allow access
  if (isTransitioning) {
    return <>{children}</>;
  }

  // If user already has a profile (not new), redirect to appropriate page
  if (!isNewUser) {
    // User has profile - check if they need pet or can go to dashboard
    // Will be handled by ProtectedRoute or OnboardingRoute
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

### Change 2.3: Update SetupProfile Route to Use SetupProfileRoute
**Location**: Line 164

**Current Code**:
```typescript
<Route path="/setup-profile" element={<ProtectedRoute><PageTransition><SetupProfile /></PageTransition></ProtectedRoute>} />
```

**Replace With**:
```typescript
<Route path="/setup-profile" element={<SetupProfileRoute><PageTransition><SetupProfile /></PageTransition></SetupProfileRoute>} />
```

### Change 2.4: Fix PublicRoute to Check isNewUser
**Location**: Lines 81-103

**Current Code**:
```typescript
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, hasPet } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is authenticated, redirect them away from public pages
  if (currentUser) {
    // New users (without pets) go to pet selection
    if (!hasPet) {
      return <Navigate to="/pet-selection" replace />;
    }
    // Existing users go to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

**Replace With**:
```typescript
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, hasPet, isNewUser } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is authenticated, redirect them away from public pages
  if (currentUser) {
    // CRITICAL: New users without profiles should go to profile setup first
    if (isNewUser) {
      return <Navigate to="/setup-profile" replace />;
    }
    // Users without pets go to pet selection
    if (!hasPet) {
      return <Navigate to="/pet-selection" replace />;
    }
    // Existing users with pets go to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

---

## File 3: `frontend/src/pages/SetupProfile.tsx`

### Change 3.1: Fix SetupProfile to Pass hasPet to markUserAsReturning
**Location**: Lines 111-115

**Current Code**:
```typescript
// Mark user as returning and navigate explicitly
markUserAsReturning();
navigate('/dashboard', { replace: true });
// End transition next tick so ProtectedRoute can re-enable normal checks
setTimeout(() => endTransition(), 0);
```

**Replace With**:
```typescript
// Mark user as returning (profile now exists, but may not have pet yet)
// Pass false for hasPet since profile setup doesn't create a pet
markUserAsReturning(false);
navigate('/dashboard', { replace: true });
// End transition next tick so ProtectedRoute can re-enable normal checks
setTimeout(() => endTransition(), 0);
```

**Note**: After profile setup, user should be redirected to pet selection if they don't have a pet. The redirect will be handled by `ProtectedRoute` checking `hasPet`.

---

## File 4: `frontend/src/pages/PetNaming.tsx`

### Change 4.1: Add Transition State Management for Pet Creation
**Location**: Lines 172-234

**Current Code**:
```typescript
const handleContinue = async () => {
  // ... validation ...
  
  setIsCreating(true);
  logFormSubmit({ name: name.trim(), species, breed }, false);
  
  try {
    // Create pet in database via PetContext (with breed from selection)
    await createPet(name.trim(), species, breed || 'Mixed');
    
    logFormSubmit({ name: name.trim(), species, breed }, true);
    toast.success(`Welcome, ${name}! 🎉`);
    
    // Redirect to dashboard with smooth transition
    setTimeout(() => {
      navigate('/dashboard');
    }, 300);
  } catch (error: any) {
    // ... error handling ...
  }
};
```

**Replace With**:
```typescript
const handleContinue = async () => {
  // ... validation ...
  
  setIsCreating(true);
  logFormSubmit({ name: name.trim(), species, breed }, false);
  
  try {
    // Create pet in database via PetContext (with breed from selection)
    await createPet(name.trim(), species, breed || 'Mixed');
    
    logFormSubmit({ name: name.trim(), species, breed }, true);
    toast.success(`Welcome, ${name}! 🎉`);
    
    // CRITICAL: Wait for state to propagate before navigating
    // PetContext.createPet() calls refreshUserState() which updates hasPet
    // Give it a moment to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Redirect to dashboard with smooth transition
    navigate('/dashboard', { replace: true });
  } catch (error: any) {
    console.error('Failed to create pet:', error);
    const errorMessage = error.message || 'Failed to create pet';
    logFormError('pet_creation', errorMessage, { name: name.trim(), species, breed });
    toast.error(errorMessage);
    setIsCreating(false);
  }
};
```

---

## File 5: `frontend/src/context/PetContext.tsx`

### Change 5.1: Improve refreshUserState Error Handling
**Location**: Lines 215-230

**Current Code**:
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

**Replace With**:
```typescript
// Refresh auth state to update hasPet flag
// This ensures route guards recognize the user has completed onboarding
console.log('🔄 Refreshing auth state after pet creation...');
try {
  const success = await refreshUserState();
  if (success) {
    console.log('✅ Auth state refreshed successfully');
  } else {
    console.warn('⚠️ Auth state refresh returned false - pet may not be detected immediately');
    // Retry once after a short delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const retrySuccess = await refreshUserState();
    if (retrySuccess) {
      console.log('✅ Auth state refreshed on retry');
    } else {
      console.warn('⚠️ Auth state refresh failed on retry - state may be stale');
      // Pet exists in DB, real-time subscription will eventually update state
      // Route guards will check Supabase directly if needed
    }
  }
} catch (refreshError) {
  console.error('❌ Error refreshing auth state:', refreshError);
  // Retry once after error
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    const retrySuccess = await refreshUserState();
    if (!retrySuccess) {
      console.warn('⚠️ Auth state refresh failed after error - state may be stale');
    }
  } catch (retryError) {
    console.error('❌ Auth state refresh retry also failed:', retryError);
  }
}
```

---

## File 6: `frontend/src/pages/AuthCallback.tsx`

### Change 6.1: Improve State Synchronization
**Location**: Lines 445-483

**Current Code**:
```typescript
// Route decision based on pet existence (not just profile)
// Priority: pet existence determines onboarding state
if (!hasPet) {
  // User needs to select a pet (new user or existing user without pet)
  logToFile('🆕 AuthCallback: User needs pet selection → redirecting to /pet-selection');
  logToFile('  Redirect decision: No pet → /pet-selection');
  setStatus('Welcome! Let\'s select your pet...');
  
  // Export logs before redirect
  setTimeout(() => {
    exportLogsToFile();
    setTimeout(() => {
      navigate('/pet-selection', { replace: true });
    }, 500);
  }, 1000);
} else {
  // User has a pet, go to dashboard
  logToFile('👋 AuthCallback: User has pet → redirecting to /dashboard');
  logToFile('  Redirect decision: Has pet → /dashboard');
  setStatus('Welcome back! Redirecting to dashboard...');
  
  // Export logs before redirect
  setTimeout(() => {
    exportLogsToFile();
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 500);
  }, 1000);
}
```

**Replace With**:
```typescript
// Route decision based on profile and pet existence
// Priority: profile existence → pet existence
const hasProfile = !!profile;
const needsProfile = !hasProfile;
const needsPet = !hasPet;

logToFile('🔍 AuthCallback: Profile and pet check result');
logToFile(`  Has profile: ${hasProfile}`);
logToFile(`  Has pet: ${hasPet}`);
logToFile(`  Needs profile: ${needsProfile}`);
logToFile(`  Needs pet: ${needsPet}`);
logToFile('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// CRITICAL: Check profile first, then pet
if (needsProfile) {
  // User needs to create profile first
  logToFile('🆕 AuthCallback: User needs profile setup → redirecting to /setup-profile');
  logToFile('  Redirect decision: No profile → /setup-profile');
  setStatus('Welcome! Let\'s set up your profile...');
  
  setTimeout(() => {
    exportLogsToFile();
    setTimeout(() => {
      navigate('/setup-profile', { replace: true });
    }, 500);
  }, 1000);
} else if (needsPet) {
  // User has profile but needs to select a pet
  logToFile('🆕 AuthCallback: User needs pet selection → redirecting to /pet-selection');
  logToFile('  Redirect decision: Has profile, no pet → /pet-selection');
  setStatus('Welcome! Let\'s select your pet...');
  
  setTimeout(() => {
    exportLogsToFile();
    setTimeout(() => {
      navigate('/pet-selection', { replace: true });
    }, 500);
  }, 1000);
} else {
  // User has profile and pet, go to dashboard
  logToFile('👋 AuthCallback: User has profile and pet → redirecting to /dashboard');
  logToFile('  Redirect decision: Has profile and pet → /dashboard');
  setStatus('Welcome back! Redirecting to dashboard...');
  
  setTimeout(() => {
    exportLogsToFile();
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 500);
  }, 1000);
}
```

---

## Summary of Changes

### Files Modified: 6
1. `frontend/src/contexts/AuthContext.tsx` - 4 changes
2. `frontend/src/App.tsx` - 4 changes
3. `frontend/src/pages/SetupProfile.tsx` - 1 change
4. `frontend/src/pages/PetNaming.tsx` - 1 change
5. `frontend/src/context/PetContext.tsx` - 1 change
6. `frontend/src/pages/AuthCallback.tsx` - 1 change

### Total Changes: 12
- 🔴 Critical fixes: 8
- 🟠 High priority fixes: 4

### Key Improvements
1. ✅ Fixed race condition in AuthContext initialization
2. ✅ Added `isTransitioning` check to ProtectedRoute
3. ✅ Created SetupProfileRoute for proper profile setup gating
4. ✅ Fixed `markUserAsReturning()` to accept optional `hasPet` parameter
5. ✅ Made `refreshUserState()` return success status
6. ✅ Improved redirect logic to check profile before pet
7. ✅ Added retry logic for state refresh failures
8. ✅ Improved state synchronization during pet creation

---

**End of Fix Plan**

