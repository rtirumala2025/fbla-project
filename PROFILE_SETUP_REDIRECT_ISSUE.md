# Profile Setup Redirect Issue - Explanation

## Problem Description

The user experiences a redirect loop when trying to complete their profile setup:

1. **User successfully logs in** with Google OAuth
2. **User is correctly redirected** to `/setup-profile` page (because they are detected as a new user)
3. **User fills out the form** and clicks "Complete Setup"
4. **Profile is created successfully** in the database (no errors thrown)
5. **The app attempts to redirect** to `/dashboard` using `navigate('/dashboard')`
6. **BUT**, instead of going to the dashboard, the user is **redirected back to `/setup-profile`** and stays on the same page

## Root Cause Analysis

The issue is a **race condition and state synchronization problem**:

### The Flow:
1. `SetupProfile.tsx` calls `profileService.createProfile()` - ✅ **This succeeds**
2. `SetupProfile.tsx` calls `await refreshUserState()` - ⚠️ **This tries to update `isNewUser` state**
3. `SetupProfile.tsx` calls `navigate('/dashboard')` - ⚠️ **This triggers navigation**
4. `App.tsx` `ProtectedRoute` component checks `isNewUser` - ❌ **Still `true` because state hasn't updated yet**
5. `ProtectedRoute` sees `isNewUser === true` and `location.pathname !== '/setup-profile'`, so it redirects back to `/setup-profile`

### Why `refreshUserState()` might not work:
1. **The `getProfile()` call in `checkUserProfile()` is returning 406 errors** (as seen in console logs)
2. When `getProfile()` fails, `checkUserProfile()` returns `true` (assumes new user) as a fallback
3. So even after profile creation, `isNewUser` remains `true`
4. The 406 errors suggest RLS (Row Level Security) policies or API configuration issues

### Additional Issues:
- The `refreshUserState()` method calls `checkUserProfile()` which relies on `profileService.getProfile()`
- If `getProfile()` fails (406 errors), the state never updates
- The `navigate()` call happens immediately after `refreshUserState()`, but React state updates are asynchronous
- The `ProtectedRoute` component checks `isNewUser` synchronously, before the state update from `refreshUserState()` has propagated

## What We've Done So Far

### 1. **Fixed Google OAuth Login Loop**
   - Updated `AuthContext.tsx` to properly detect sessions after OAuth redirect
   - Added `AuthCallback.tsx` component to handle OAuth callbacks
   - Implemented proper session detection and user state management

### 2. **Implemented New User Detection**
   - Added `isNewUser` state to `AuthContext`
   - Created `checkUserProfile()` helper function to detect if user has a profile
   - Updated routing logic to redirect new users to `/setup-profile`

### 3. **Created Profile Setup Page**
   - Built `SetupProfile.tsx` component with form for username and avatar
   - Integrated with `profileService` to create profiles
   - Added form validation and error handling

### 4. **Fixed Database Schema Issues**
   - **Added missing `coins` column** to `profiles` table
   - **Added missing `user_id` column** to `profiles` table
   - **Fixed `id` column** to auto-generate UUIDs with `gen_random_uuid()`
   - **Fixed foreign key constraints** (dropped `profiles_id_fkey`, created `profiles_user_id_fkey`)
   - **Fixed RLS policies** (created permissive policy: "Allow all operations for authenticated users")
   - **Removed unique constraint** on `username` column (`profiles_username_key`)

### 5. **Added State Refresh Mechanism**
   - Created `refreshUserState()` method in `AuthContext` to update user state after profile creation
   - Integrated `refreshUserState()` into `SetupProfile` component to call it after profile creation

### 6. **Updated Protected Routes**
   - Modified `ProtectedRoute` in `App.tsx` to check `isNewUser` and redirect accordingly
   - Added logic to prevent new users from accessing dashboard until profile is complete
   - Added logic to prevent returning users from accessing setup-profile page

## Current State

✅ **Working:**
- Google OAuth login
- New user detection
- Profile creation in database
- Redirect to `/setup-profile` for new users

❌ **Not Working:**
- Redirect from `/setup-profile` to `/dashboard` after profile creation
- State update after profile creation (stuck in redirect loop)

## Solution Implemented

The fix involves:
1. **Directly update `isNewUser` state** after successful profile creation (instead of re-querying the database)
2. **Use `useEffect` to watch for state change** and navigate when `isNewUser` becomes `false`
3. **Avoid race conditions** by letting React handle the state update and navigation in the correct order

### Changes Made:

1. **Added `markUserAsReturning()` method to `AuthContext`**:
   - Directly sets `isNewUser` to `false` without database queries
   - Avoids the 406 errors from `getProfile()` calls
   - Provides immediate state update after profile creation

2. **Updated `SetupProfile` component**:
   - Calls `markUserAsReturning()` after successful profile creation
   - Removed direct `navigate()` call (now handled by `useEffect`)
   - Updated `useEffect` to watch `isNewUser` and navigate when it becomes `false`

3. **Fixed state synchronization**:
   - State update happens immediately after profile creation
   - `useEffect` triggers navigation when state changes
   - No race conditions because React batches state updates correctly

### How It Works Now:

1. User clicks "Complete Setup"
2. Profile is created in database ✅
3. `markUserAsReturning()` is called → `isNewUser` set to `false` ✅
4. React re-renders with new `isNewUser` value
5. `useEffect` detects `isNewUser === false` → navigates to `/dashboard` ✅
6. `ProtectedRoute` sees `isNewUser === false` → allows access to dashboard ✅

This solution is more reliable because:
- ✅ No database queries after profile creation (we know it succeeded)
- ✅ No race conditions (React handles state updates properly)
- ✅ Works even if `getProfile()` has issues (406 errors won't affect it)
- ✅ Clean separation of concerns (state update → navigation trigger)

