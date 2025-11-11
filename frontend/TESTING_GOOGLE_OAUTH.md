# Testing Google OAuth - Quick Start Guide

## ✅ Pre-Test Checklist

Before testing, verify:

- [ ] Dev server is running (`npm start`)
- [ ] `.env` file has `REACT_APP_USE_MOCK=false`
- [ ] Browser DevTools console is open (F12 → Console tab)
- [ ] You're in a fresh browser session (or incognito mode)

## 🧪 Test Procedure

### Step 1: Navigate to Login Page
```
http://localhost:3000/login
```

**Expected console output:**
```
✅ Initializing real Supabase client
✅ Supabase URL: https://xhhtkjtcdeewesijxbts.supabase.co
✅ Auth config: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
✅ Supabase client initialized successfully
```

**If you see mock mode:**
```
🔧 Using mock Supabase client for development
```
→ **STOP**: Fix `.env` file and restart server

### Step 2: Click "Sign in with Google"

**Expected visual behavior:**
1. Button text changes to "Connecting to Google..."
2. Loading spinner appears
3. Button becomes disabled (grayed out)

**Expected console output:**
```
🔵 Google Sign-In button clicked
🔵 Attempting Google sign-in redirect to: http://localhost:3000/auth/callback
🔵 Supabase client: initialized
🔵 Supabase OAuth response: { data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?...' }, error: null }
✅ Redirecting to Google OAuth URL: https://accounts.google.com/...
```

**Expected browser behavior:**
- Browser redirects to `accounts.google.com` within 1-2 seconds

### Step 3: Google Sign-In Page

**Expected:**
- Google sign-in page loads
- Shows "Sign in with Google" or account picker
- Lists your Google accounts (if previously signed in)

**Actions:**
1. Select a Google account
2. Grant permissions if prompted
3. Wait for redirect

### Step 4: Callback Handling

**Expected URL:**
```
http://localhost:3000/auth/callback#access_token=...&expires_in=3600&...
```

**Expected console output:**
```
🔵 AuthCallback: Starting callback handling
🔵 Current URL: http://localhost:3000/auth/callback#access_token=...
🔵 Session data: { user: { email: 'your-email@gmail.com', ... }, access_token: '...' }
🔵 Session error: null
✅ User authenticated, redirecting to dashboard
✅ User: your-email@gmail.com
```

**Expected browser behavior:**
- Briefly shows "Completing sign in..." page
- Automatically redirects to `/dashboard`
- You are now logged in

### Step 5: Verify Login State

**Check dashboard:**
- URL should be `http://localhost:3000/dashboard`
- Header should show your user info
- Navigation links should be visible
- Pet data should load

**Check Supabase Dashboard:**
1. Go to Supabase Dashboard → Authentication → Users
2. Your Google account should appear in the list
3. Provider should show "google"

## 🐛 Troubleshooting

### Issue: Mock Mode Active

**Console shows:**
```
🔧 Using mock Supabase client for development
```

**Fix:**
```bash
# Edit frontend/.env
REACT_APP_USE_MOCK=false

# Restart server
npm start
```

### Issue: No Redirect URL

**Console shows:**
```
⚠️ No redirect URL received from Supabase
```

**Possible causes:**
1. Google OAuth not enabled in Supabase
2. Missing Google credentials in Supabase
3. Supabase project issue

**Fix:**
1. Go to Supabase Dashboard
2. Authentication → Providers → Google
3. Verify it's enabled with valid credentials

### Issue: redirect_uri_mismatch

**Browser shows:**
```
Error 400: redirect_uri_mismatch
```

**Fix:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
3. Save and try again

### Issue: Session Not Found

**Console shows:**
```
🔵 Session data: null
⚠️ No session found, redirecting to login
```

**Possible causes:**
1. OAuth flow didn't complete
2. Session not persisted
3. Browser blocking cookies

**Fix:**
1. Check browser allows cookies
2. Try incognito mode
3. Clear browser cache and try again
4. Verify `detectSessionInUrl: true` in supabase.ts

### Issue: Button Freezes

**Symptoms:**
- Button shows "Connecting to Google..."
- No redirect happens
- No error in console

**Debug:**
1. Check console for OAuth response
2. Look for `data: { url: null }` or `error: {...}`
3. If `url` is null, Supabase isn't configured correctly

**Fix:**
- Verify Supabase project is active
- Check Supabase service status
- Verify environment variables are correct

## 📊 Success Criteria

✅ All console logs appear in correct order  
✅ Button shows loading state  
✅ Redirects to Google within 2 seconds  
✅ Google sign-in page loads  
✅ Redirects back to `/auth/callback`  
✅ Session is detected  
✅ Redirects to `/dashboard`  
✅ User is logged in  
✅ User appears in Supabase dashboard  

## 🔄 Testing Multiple Accounts

To test with different Google accounts:

1. Sign out from dashboard
2. Clear browser cookies
3. Go back to `/login`
4. Click "Sign in with Google"
5. Choose different account or "Use another account"

## 📝 Reporting Issues

If OAuth still doesn't work, provide:

1. **Console logs** (copy entire console output)
2. **Environment variables** (`.env` file contents, hide sensitive keys)
3. **Supabase configuration** (screenshot of OAuth settings)
4. **Browser and version** (e.g., Chrome 120)
5. **Steps to reproduce** (what you clicked, what happened)

Share these in the troubleshooting channel or with the development team.

## 🎯 Quick Test Script

Run this in browser console after clicking "Sign in with Google":

```javascript
// Check Supabase client
console.log('Supabase client exists:', typeof supabase !== 'undefined');

// Check environment
console.log('Mock mode:', process.env.REACT_APP_USE_MOCK);
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);

// Check session
supabase.auth.getSession().then(({ data, error }) => {
  console.log('Current session:', data.session);
  console.log('Session error:', error);
});
```

This will show if the client is properly initialized and if there's an active session.

