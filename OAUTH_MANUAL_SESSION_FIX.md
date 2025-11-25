# OAuth Manual Session Fix

## Problem
Google OAuth sign-in was receiving the OAuth callback with tokens in the URL hash, but Supabase's `detectSessionInUrl: true` was not automatically processing the hash. This resulted in:
- Hash exists in URL with `access_token` and `refresh_token`
- localStorage remains empty
- `getSession()` returns null
- User redirected back to login page

## Root Cause
The Supabase client's automatic hash processing (`detectSessionInUrl: true`) was not working reliably. This can happen due to:
1. Timing issues where the client initialization doesn't catch the hash
2. Browser security settings blocking localStorage access
3. Race conditions between page load and hash processing

## Solution
Implemented a **manual hash processing fallback** that:
1. **Extracts tokens from URL hash** when detected
2. **Manually calls `setSession()`** with the extracted tokens
3. **Clears the hash from URL** after successful session creation
4. **Falls back to automatic detection** if manual processing fails

### Implementation Details

**Location**: `frontend/src/pages/AuthCallback.tsx`

**Key Changes**:
1. **Hash Detection**: Checks if URL hash contains `access_token=`
2. **Token Extraction**: Parses hash parameters using `URLSearchParams`
3. **Manual Session Creation**: Uses `supabase.auth.setSession()` with extracted tokens
4. **URL Cleanup**: Removes hash from URL after successful session creation
5. **Fallback Strategy**: If manual processing fails, waits and tries automatic detection

**Code Flow**:
```typescript
1. Check if hash exists with access_token
2. Extract access_token and refresh_token from hash
3. Decode token to verify format (optional logging)
4. Call supabase.auth.setSession({ access_token, refresh_token })
5. Clear hash from URL: window.history.replaceState(...)
6. Wait 100ms for Supabase to process
7. Call getSession() to retrieve full session
8. If successful, proceed with redirect logic
9. If failed, fall back to automatic detection with delay
```

## Testing Instructions

### 1. Test the OAuth Flow
1. **Clear browser state**:
   - Clear cookies and localStorage
   - Close all browser tabs
   - Use incognito mode for clean test

2. **Start the dev server**:
   ```bash
   cd frontend
   npm start
   ```

3. **Open browser console** (F12) and navigate to login page

4. **Click "Sign in with Google"**

5. **Complete Google authentication**

6. **Check console logs** for:
   - `🔵 AuthCallback: Hash detected with access_token - attempting manual session creation...`
   - `✅ AuthCallback: Session set successfully via setSession()`
   - `✅ AuthCallback: Full session retrieved after setSession()`

7. **Verify**:
   - User is redirected to `/dashboard` or `/setup-profile`
   - No redirect loop back to login
   - Session persists in localStorage

### 2. Expected Console Output

**Successful Flow**:
```
🔵 AuthCallback: Hash detected with access_token - attempting manual session creation...
  ✓ Access token extracted from hash
  ✓ Refresh token: present
  ✓ Expires in: 3600 seconds
  ✓ Token decoded successfully - User ID: <user-id>, Email: <email>
🔵 AuthCallback: Setting session manually with extracted tokens...
✅ AuthCallback: Session set successfully via setSession()
  ✓ Hash cleared from URL
✅ AuthCallback: Full session retrieved after setSession()
✅ AuthCallback: Processing successful authentication
```

### 3. Troubleshooting

**If manual processing still fails**:

1. **Check environment variables**:
   ```bash
   # frontend/.env should have:
   REACT_APP_USE_MOCK=false
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Verify Supabase configuration**:
   - Dashboard → Authentication → Providers → Google: **Enabled**
   - Dashboard → Authentication → URL Configuration:
     - Site URL: `http://localhost:3000` (dev) or your production URL
     - Redirect URLs: 
       - `http://localhost:3000/auth/callback`
       - `http://localhost:3000/**`

3. **Check browser console for errors**:
   - Network errors when calling `setSession()`
   - CORS errors
   - Token validation errors

4. **Verify token format**:
   - Access token should be a valid JWT (3 parts separated by dots)
   - Refresh token should be present

## Files Modified

- `frontend/src/pages/AuthCallback.tsx`
  - Added manual hash processing logic
  - Added token extraction and validation
  - Added manual `setSession()` call
  - Added hash cleanup from URL
  - Improved error handling and logging

## Notes

- This fix maintains backward compatibility with automatic hash processing
- If automatic processing works, it will be used as a fallback
- Manual processing only triggers when hash exists and automatic processing failed
- The hash is cleared from URL after successful session creation to prevent reprocessing
- All operations are logged for debugging purposes

## Related Issues

- Original issue: OAuth callback received tokens but session not created
- Previous attempts: Automatic detection was expected but unreliable
- This fix provides a reliable fallback mechanism

