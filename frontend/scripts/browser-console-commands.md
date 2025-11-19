# Browser Console Diagnostic Commands

Use these commands in the browser console (F12) while the app is running on localhost:3000 to diagnose OAuth issues.

## Quick Diagnostic

Copy and paste this entire script into the browser console:

```javascript
// Quick OAuth Diagnostic
(function() {
  console.log('🔍 OAuth Diagnostic');
  console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL || 'NOT FOUND');
  console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'FOUND (' + process.env.REACT_APP_SUPABASE_ANON_KEY.length + ' chars)' : 'NOT FOUND');
  console.log('REACT_APP_USE_MOCK:', process.env.REACT_APP_USE_MOCK || 'false');
  console.log('Current URL:', window.location.href);
  console.log('Current Origin:', window.location.origin);
  console.log('Expected Callback URL:', window.location.origin + '/auth/callback');
  
  // Check localStorage for Supabase session
  const authKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'));
  console.log('Auth-related localStorage keys:', authKeys);
  
  // Check if on callback page
  if (window.location.pathname === '/auth/callback') {
    console.log('📍 On /auth/callback page');
    console.log('Hash:', window.location.hash ? 'Present' : 'Missing');
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      console.log('Access Token:', hashParams.get('access_token') ? 'Present' : 'Missing');
      console.log('Error:', hashParams.get('error') || 'None');
    }
  }
})();
```

## Individual Checks

### Check Environment Variables

```javascript
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('Supabase Key:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
console.log('Use Mock:', process.env.REACT_APP_USE_MOCK);
```

### Check Supabase Client Configuration

```javascript
// This requires the Supabase client to be accessible
// Check the Network tab for requests to Supabase domain
console.log('Check Network tab for requests to:', process.env.REACT_APP_SUPABASE_URL + '/auth/v1/authorize');
```

### Check OAuth Redirect URL

```javascript
const redirectUrl = window.location.origin + '/auth/callback';
console.log('Expected Redirect URL:', redirectUrl);
console.log('Should be configured in Supabase Dashboard as:', redirectUrl);
```

### Check for Console Errors

Look for these common errors in the console:
- `redirect_uri_mismatch` - Redirect URL not configured in Supabase
- `invalid_client` - Google OAuth not configured in Supabase
- `access_denied` - User denied Google OAuth permission
- CORS errors - Supabase URL misconfiguration
- Network errors - Check Supabase service status

### Test OAuth Flow Manually

```javascript
// This will attempt to trigger OAuth (if signInWithGoogle is accessible)
// Note: This may not work depending on how the app is structured
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('React DevTools detected');
  console.log('To test OAuth: Click the "Sign in with Google" button and watch the console');
}
```

## Network Tab Checks

1. Open Network tab (F12 → Network)
2. Click "Sign in with Google" button
3. Look for:
   - Request to `{SUPABASE_URL}/auth/v1/authorize?provider=google`
   - Status code should be 200 or 302 (redirect)
   - Check Response for OAuth URL
   - Check for CORS errors

## Common Issues and Solutions

### Issue: "redirect_uri_mismatch"
**Solution:** Add `http://localhost:3000/auth/callback` to Supabase Dashboard → Authentication → URL Configuration

### Issue: "invalid_client"
**Solution:** Enable Google OAuth in Supabase Dashboard → Authentication → Providers → Google

### Issue: Environment variables not found
**Solution:** 
1. Create `frontend/.env` file
2. Add `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
3. Restart dev server

### Issue: No redirect after clicking button
**Solution:** Check browser console for errors, verify `signInWithGoogle()` is being called

