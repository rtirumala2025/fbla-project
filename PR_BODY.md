### Summary
This PR fixes a redirect loop that occurred after completing profile setup. A short-lived `isTransitioning` flag in `AuthContext` now gates route redirects during the handoff from `/setup-profile` to `/dashboard`, ensuring deterministic navigation without racing React state updates.

### Root Cause
A race condition between state propagation and route guards:
- `markUserAsReturning()` set `isNewUser = false`, but the React state update is async.
- `ProtectedRoute` sometimes re-evaluated before state propagation and redirected back to `/setup-profile`, causing a loop.

### Solution
- **AuthContext** (`frontend/src/contexts/AuthContext.tsx`)
  - Added `isTransitioning: boolean` state and `endTransition()` method.
  - Updated `markUserAsReturning()` to set both `isNewUser = false` and `isTransitioning = true`.
  - Exported both `isTransitioning` and `endTransition` in `AuthContextType`.
- **ProtectedRoute** (`frontend/src/App.tsx`)
  - Updated route protection to bypass redirect checks when `isTransitioning` is true (while still requiring authentication).
- **SetupProfile** (`frontend/src/pages/SetupProfile.tsx`)
  - After successful profile creation: calls `markUserAsReturning()`, navigates to `/dashboard`, then calls `endTransition()` on the next tick.

### Testing & Verification
Manual checks:
- ✅ New user flow: Sign in with Google → redirected to `/setup-profile` → complete setup → redirected to `/dashboard` (no loops).
- ✅ Returning user flow: Navigate to app while authenticated → lands on `/dashboard`; manually visiting `/setup-profile` → redirected to `/dashboard`.
- ✅ Build/lint/type checks pass (no new errors introduced).

### Impact
Affects authentication context, route protection behavior, and the onboarding flow handoff. No backend changes required; compatible with existing Supabase setup. Normal route protection for returning users remains intact—only the transition window is bypassed.

