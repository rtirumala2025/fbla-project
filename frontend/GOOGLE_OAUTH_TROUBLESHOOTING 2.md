# Google OAuth Troubleshooting Guide

## Debug Checklist

When you click "Sign in with Google", check the browser console for these logs:

### 1. Supabase Client Initialization
Look for one of these:
- ✅ `Initializing real Supabase client` - Good! Real client is being used
- 🔧 `Using mock Supabase client for development` - Mock mode is active

### 2. Button Click
- 🔵 `Google Sign-In button clicked` - Button handler is working

### 3. OAuth Request
- 🔵 `Attempting Google sign-in redirect to: http://localhost:3000/auth/callback`
- 🔵 `Supabase client: initialized`
- 🔵 `Supabase OAuth response: { data: {...}, error: null }`

### 4. Expected Outcomes

#### ✅ Success Case:
```
✅ Redirecting to Google OAuth URL: https://accounts.google.com/...
```
→ Browser should redirect to Google sign-in page

#### ❌ Error Cases:

**No redirect URL received:**
```
⚠️ No redirect URL received from Supabase
```
**Cause:** Supabase is not returning an OAuth URL  
**Fix:** Check Supabase dashboard redirect URL configuration

**OAuth error:**
```
❌ Google sign-in error: {...}
```
**Cause:** Supabase rejected the OAuth request  
**Fix:** Verify Google OAuth is enabled in Supabase dashboard

## Common Issues

### Issue 1: Button Freezes, No Redirect
**Symptoms:** Button shows "Connecting to Google..." but nothing happens

**Debug Steps:**
1. Open browser console
2. Look for the logs above
3. Check if you see `data: { url: null }` in the OAuth response

**Solution:**
- Verify `.env` file has `VITE_SUPABASE_USE_MOCK=false`
- Restart dev server after changing `.env`
- Check Supabase dashboard → Authentication → Providers → Google is enabled

### Issue 2: Mock Client Being Used
**Symptoms:** Console shows `Using mock Supabase client`

**Solution:**
1. Check `frontend/.env` file exists
2. Verify it contains:
   ```
   VITE_SUPABASE_USE_MOCK=false
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart dev server: `npm start`

### Issue 3: redirect_uri_mismatch
**Symptoms:** Google shows "Error 400: redirect_uri_mismatch"

**Solution:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
3. Save and try again

### Issue 4: Session Not Found After Redirect
**Symptoms:** Redirects back to `/auth/callback` but then goes to login

**Debug Steps:**
1. Check console for `AuthCallback: Starting callback handling`
2. Look for `Session data:` log - should show user object
3. If session is `null`, OAuth didn't complete properly

**Solution:**
- Verify `detectSessionInUrl: true` in Supabase client config
- Check that the URL contains `#access_token=...` after redirect
- Clear browser cache and cookies, try again

## Environment Variables Reference

Your `frontend/.env` should look like this:

```env
# For production OAuth (real Google sign-in)
VITE_SUPABASE_USE_MOCK=false
VITE_SUPABASE_URL=https://xhhtkjtcdeewesijxbts.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# For demo/testing (no real OAuth)
# VITE_SUPABASE_USE_MOCK=true
```

## Supabase Dashboard Configuration

### Required Settings:

1. **Authentication → Providers → Google**
   - Status: Enabled ✅
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)

2. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**`

## Testing Steps

1. **Clear browser state:**
   ```
   - Clear cookies
   - Clear local storage
   - Close all browser tabs
   ```

2. **Start fresh:**
   ```bash
   cd frontend
   npm start
   ```

3. **Open console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Filter for "Google" or "OAuth"

4. **Click button:**
   - Click "Sign in with Google"
   - Watch console logs
   - Should see redirect within 1-2 seconds

5. **Verify redirect:**
   - Should go to `accounts.google.com`
   - Select Google account
   - Should redirect back to `/auth/callback`
   - Should automatically go to `/dashboard`

## Still Not Working?

If you've tried everything above and it's still not working:

1. **Check Supabase service status:** https://status.supabase.com
2. **Verify Google OAuth credentials** in Google Cloud Console
3. **Try incognito mode** to rule out browser cache issues
4. **Check network tab** in DevTools for failed requests
5. **Share console logs** with the team for debugging

## Quick Fix: Use Mock Mode for Demo

If you need to demo the app without setting up OAuth:

```bash
# In frontend/.env
VITE_SUPABASE_USE_MOCK=true
```

Then restart the server. Google button will be disabled, but email/password login will work with mock data.

