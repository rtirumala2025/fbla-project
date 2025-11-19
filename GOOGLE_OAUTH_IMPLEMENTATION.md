# Google OAuth Implementation Guide

## Overview

This document describes the Google OAuth sign-up/sign-in flow implementation for the Virtual Pet FBLA project.

## OAuth Flow Architecture

### 1. User Initiates Google Sign-In

**Location:** `frontend/src/contexts/AuthContext.tsx` → `signInWithGoogle()`

When a user clicks "Sign in with Google":
1. The `signInWithGoogle()` function is called
2. It constructs the redirect URL: `${window.location.origin}/auth/callback`
3. Calls `supabase.auth.signInWithOAuth()` with the redirect URL
4. Supabase returns an OAuth URL
5. User is redirected to Google's OAuth consent screen

### 2. User Authenticates with Google

- User selects their Google account
- Grants permissions to the application
- Google redirects back to the callback URL

### 3. OAuth Callback Handling

**Location:** `frontend/src/pages/AuthCallback.tsx`

The `AuthCallback` component handles the OAuth callback:
1. Uses `supabase.auth.getSessionFromUrl()` to retrieve the session from URL hash parameters
2. Session is automatically stored by Supabase
3. Checks if user has a profile in the database
4. Redirects to:
   - `/setup-profile` if new user (no profile exists)
   - `/dashboard` if returning user (profile exists)

### 4. Session Persistence

**Location:** `frontend/src/lib/supabase.ts`

The Supabase client is configured with:
- `detectSessionInUrl: true` - Automatically detects session in URL hash
- `persistSession: true` - Persists session to localStorage
- `autoRefreshToken: true` - Automatically refreshes expired tokens

## Configuration Requirements

### Supabase Dashboard Configuration

1. **URL Configuration** (`Authentication` → `URL Configuration`):
   - **Site URL:**
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - **Redirect URLs:**
     - `http://localhost:3000/auth/callback`
     - `https://yourdomain.com/auth/callback`

2. **Google OAuth Provider** (`Authentication` → `Providers`):
   - Enable Google provider
   - Add Google Client ID and Client Secret from Google Cloud Console

### Google Cloud Console Configuration

1. **Authorized JavaScript origins:**
   - `https://xhhtkjtcdeewesijxbts.supabase.co`

2. **Authorized redirect URIs:**
   - `https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/callback`

### Environment Variables

Required environment variables in `.env`:
```env
REACT_APP_SUPABASE_URL=https://xhhtkjtcdeewesijxbts.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_USE_MOCK=false  # Set to true for development without real OAuth
```

## Development vs Production

### Development (localhost:3000)

The redirect URL is automatically constructed as `http://localhost:3000/auth/callback` based on `window.location.origin`.

**Requirements:**
- Add `http://localhost:3000/auth/callback` to Supabase redirect URLs
- Google OAuth provider enabled in Supabase
- Environment variables configured

### Production (Live URL)

The redirect URL is automatically constructed based on the production domain.

**Requirements:**
- Add production callback URL to Supabase redirect URLs (e.g., `https://yourdomain.com/auth/callback`)
- Site URL in Supabase set to production domain
- Environment variables configured for production

## Error Handling

The implementation includes comprehensive error handling:

1. **No redirect URL received:**
   - Checks if Supabase is configured
   - Verifies Google OAuth is enabled
   - Provides helpful error messages with setup instructions

2. **OAuth callback errors:**
   - Falls back to checking session in storage
   - Provides user-friendly error messages
   - Redirects to login page with error state

3. **Session retrieval errors:**
   - Tries `getSessionFromUrl()` first
   - Falls back to `getSession()` from storage
   - Handles both new and existing users

## Testing

### Test the OAuth Flow

1. Start the development server: `npm start`
2. Navigate to `/login` or `/signup`
3. Click "Sign in with Google"
4. Verify redirect to Google OAuth
5. Authenticate with Google account
6. Verify redirect back to `/auth/callback`
7. Verify redirect to `/dashboard` or `/setup-profile`

### Debug Logging

The implementation includes comprehensive console logging:
- 🔵 Info: OAuth flow steps
- ✅ Success: Successful operations
- ❌ Error: Error conditions
- ⚠️ Warning: Non-critical issues

Check browser console for detailed OAuth flow logs.

## Files Modified

1. **`frontend/src/lib/supabase.ts`**
   - Added `detectSessionInUrl: true` to Supabase client configuration
   - Added OAuth flow documentation

2. **`frontend/src/pages/AuthCallback.tsx`**
   - Complete rewrite to use `getSessionFromUrl()`
   - Added comprehensive error handling
   - Added profile check for new vs returning users
   - Added detailed logging

3. **`frontend/src/contexts/AuthContext.tsx`**
   - Enhanced `signInWithGoogle()` with better error messages
   - Added configuration validation
   - Added detailed logging

## Common Issues & Solutions

### Issue: "No redirect URL received from Supabase"

**Solution:**
1. Verify Google OAuth is enabled in Supabase Dashboard → Authentication → Providers
2. Verify redirect URL is added in Supabase Dashboard → Authentication → URL Configuration
3. Check environment variables are set correctly

### Issue: "redirect_uri_mismatch"

**Solution:**
1. Verify redirect URL in Supabase matches exactly: `${window.location.origin}/auth/callback`
2. Verify Google Cloud Console redirect URI matches: `https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/callback`

### Issue: Session not persisting

**Solution:**
1. Verify `detectSessionInUrl: true` in Supabase client configuration
2. Verify `persistSession: true` in Supabase client configuration
3. Check browser localStorage for Supabase session

## Security Considerations

1. **HTTPS in Production:** Always use HTTPS in production for secure OAuth flow
2. **Redirect URLs:** Only allow specific, trusted redirect URLs
3. **Session Storage:** Sessions are stored in localStorage (browser-secure)
4. **Token Refresh:** Tokens are automatically refreshed by Supabase client

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

