# OAuth Simple Fix - Remove Manual setSession()

## Problem
`setSession()` is failing with "Invalid API key" error even though:
- ✅ The anon key is correct (verified via `verify-env.js`)
- ✅ Projects match (URL and anon key are for same project)
- ✅ Environment variables are loaded

## Root Cause
The manual `setSession()` call is failing due to validation issues, but Supabase's automatic hash processing (`detectSessionInUrl: true`) should work without it.

## Solution
Remove all manual `setSession()` calls and rely **entirely** on:
1. Supabase's automatic hash processing (already configured)
2. `onAuthStateChange` listener waiting for `SIGNED_IN` event
3. Automatic session persistence to localStorage

## Implementation
Simplify `AuthCallback.tsx` to:
1. Extract tokens from URL hash (for logging/validation only)
2. Wait for Supabase to automatically process the hash
3. Listen for `SIGNED_IN` event via `onAuthStateChange`
4. Redirect once session is confirmed

This is the recommended approach according to Supabase documentation.

