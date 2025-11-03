# OAuth Callback Fix - Session Detection Issue

## Problem
Google OAuth was working (redirecting to Google and back), but after returning to the site, users were redirected back to the login page instead of the dashboard.

## Root Cause
The `AuthCallback` component was checking for the session too quickly, before Supabase had time to process the OAuth callback from the URL hash parameters.

## Solution Implemented

### 1. Added Delays in AuthCallback
```typescript
// Wait for Supabase to process the OAuth callback
await new Promise(resolve => setTimeout(resolve, 500));

// Get session
const { data: { session } } = await supabase.auth.getSession();

// If no session, try again after another delay
if (!session) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const { data: { session: retrySession } } = await supabase.auth.getSession();
  // ... handle retry
}
```

### 2. Added Debug Logging
Added comprehensive logging to track the OAuth flow:

**In AuthCallback.tsx:**
- Current URL and hash
- Session data at each check
- Retry attempts

**In AuthContext.tsx:**
- Initial session check
- Auth state change events
- User email when session changes

## How It Works Now

### OAuth Flow Timeline

1. **User clicks "Sign in with Google"** (Login page)
   ```
   🔵 Google Sign-In button clicked
   🔵 Attempting Google sign-in redirect to: http://localhost:3000/auth/callback
   ✅ Redirecting to Google OAuth URL: https://accounts.google.com/...
   ```

2. **User authenticates with Google** (Google's page)
   - User selects account
   - Grants permissions
   - Google redirects back

3. **Redirect to /auth/callback** (with hash parameters)
   ```
   URL: http://localhost:3000/auth/callback#access_token=...&expires_in=3600&...
   ```

4. **AuthCallback processes the session**
   ```
   🔵 AuthCallback: Starting callback handling
   🔵 Current URL: http://localhost:3000/auth/callback#access_token=...
   🔵 URL hash: #access_token=...
   
   [Wait 500ms for Supabase to process]
   
   🔵 Session data: { user: { email: 'user@gmail.com', ... } }
   ✅ User authenticated, redirecting to dashboard
   ✅ User: user@gmail.com
   ```

5. **AuthContext detects the session**
   ```
   🔵 AuthContext: Auth state changed SIGNED_IN user@gmail.com
   ```

6. **Navigate to dashboard**
   ```
   URL: http://localhost:3000/dashboard
   User is logged in
   ```

## Testing Instructions

### 1. Clear Browser State
```bash
# Clear cookies and local storage
# Or use incognito mode
```

### 2. Open Login Page
```
http://localhost:3000/login
```

### 3. Click "Sign in with Google"
Watch the console for:
```
🔵 Google Sign-In button clicked
✅ Redirecting to Google OAuth URL
```

### 4. Sign In with Google
- Select your Google account
- Grant permissions

### 5. Watch the Callback Process
After redirect, console should show:
```
🔵 AuthCallback: Starting callback handling
🔵 Current URL: http://localhost:3000/auth/callback#access_token=...
🔵 URL hash: #access_token=...
[500ms delay]
🔵 Session data: { user: {...} }
✅ User authenticated, redirecting to dashboard
```

### 6. Verify Dashboard
- Should redirect to `/dashboard`
- User should be logged in
- Header should show user info

## Troubleshooting

### Issue: Still redirects to login after callback

**Check console for:**
```
⚠️ No session found after 500ms, trying one more time...
❌ Still no session found, redirecting to login
```

**Possible causes:**
1. Supabase `detectSessionInUrl` not enabled
2. OAuth callback not being processed
3. Session storage blocked by browser

**Solutions:**
1. Verify `supabase.ts` has:
   ```typescript
   auth: {
     detectSessionInUrl: true,
     persistSession: true,
   }
   ```
2. Try incognito mode
3. Check browser console for errors
4. Increase delay in `AuthCallback.tsx`

### Issue: "No session found" in console

**Check:**
1. URL hash contains `access_token`
2. Supabase client is initialized (not mock mode)
3. Browser allows cookies and local storage

**Debug:**
```typescript
// In AuthCallback, add:
console.log('URL has access_token:', window.location.hash.includes('access_token'));
```

### Issue: Session found but still redirects to login

**Check:**
1. `AuthContext` is wrapping the app
2. `ProtectedRoute` is checking `currentUser` correctly
3. No race condition in route protection

## Files Modified

### frontend/src/pages/AuthCallback.tsx
- Added 500ms delay before first session check
- Added retry logic with 1000ms delay
- Added comprehensive debug logging
- Added URL hash logging

### frontend/src/contexts/AuthContext.tsx
- Added debug logging to initial session check
- Added debug logging to auth state change listener
- Shows event type and user email

## Configuration Requirements

### Supabase Client (frontend/src/lib/supabase.ts)
```typescript
supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // ← Critical for OAuth
  },
});
```

### Environment Variables (frontend/.env)
```env
REACT_APP_USE_MOCK=false
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Dashboard
1. **Authentication → Providers → Google**: Enabled
2. **Authentication → URL Configuration**:
   - Redirect URLs: `http://localhost:3000/auth/callback`

## Expected Console Output (Success)

```
🔵 Google Sign-In button clicked
🔵 Attempting Google sign-in redirect to: http://localhost:3000/auth/callback
🔵 Supabase client: initialized
🔵 Supabase OAuth response: { data: { url: 'https://accounts.google.com/...' }, error: null }
✅ Redirecting to Google OAuth URL: https://accounts.google.com/...

[User authenticates with Google]

🔵 AuthCallback: Starting callback handling
🔵 Current URL: http://localhost:3000/auth/callback#access_token=eyJ...
🔵 URL hash: #access_token=eyJ...&expires_in=3600&...
🔵 Session data: { user: { id: '...', email: 'user@gmail.com', ... }, access_token: '...' }
✅ User authenticated, redirecting to dashboard
✅ User: user@gmail.com
🔵 AuthContext: Auth state changed SIGNED_IN user@gmail.com
```

## Benefits of This Fix

1. ✅ **Handles timing issues** - Waits for Supabase to process OAuth
2. ✅ **Retry logic** - Tries twice before giving up
3. ✅ **Comprehensive logging** - Easy to debug issues
4. ✅ **User feedback** - Shows "Completing sign in..." during process
5. ✅ **Graceful fallback** - Redirects to login if session not found

## Next Steps

1. Test the OAuth flow with the new delays
2. Check console output to verify session detection
3. If still failing, increase delays or check Supabase configuration
4. Once working, consider reducing delays for faster UX

## Production Considerations

For production, you may want to:
1. Reduce delays (500ms → 200ms, 1000ms → 500ms)
2. Remove debug logging or use a logging service
3. Add error tracking (e.g., Sentry)
4. Add user-friendly error messages
5. Add loading progress indicator

The delays are conservative to ensure reliability across different network conditions and devices.

