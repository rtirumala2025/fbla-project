# OAuth Session Persistence - Root Cause Diagnosis & Fix

## 🔍 Problem Summary

**Symptoms:**
- Google OAuth popup opens and authenticates successfully
- After redirect, `getSession()` returns `null`
- `SIGNED_IN` listener never fires
- Users redirected back to login
- Manual hash processing previously caused 401 errors

**Root Cause:** This is a **backend/session configuration issue**, not a frontend code issue.

## ✅ Diagnostic Tools Created

### 1. Configuration Diagnostic Script

**Location:** `frontend/scripts/diagnose-oauth-config.js`

**Run:**
```bash
cd frontend
node scripts/diagnose-oauth-config.js
```

**Checks:**
- ✅ Environment variables in `.env` file
- ✅ Supabase client configuration (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`)
- ✅ Provides configuration checklist
- ✅ Shows expected Google OAuth redirect URI

### 2. Enhanced Session Debugging

**Location:** `frontend/src/pages/AuthCallback.tsx`

**Added:**
- localStorage checks before and after delay
- Enhanced diagnostics when session is null
- Detailed error messages for configuration issues
- Network request guidance

### 3. Comprehensive Configuration Guide

**Location:** `SUPABASE_OAUTH_CONFIGURATION_GUIDE.md`

**Includes:**
- Step-by-step Supabase Dashboard configuration
- Google Cloud Console setup instructions
- Frontend environment variable setup
- Browser configuration requirements
- Common issues and fixes
- Verification checklist

## 📋 Configuration Checklist

Based on diagnostic script output, your project reference is: **xhhtkjtcdeewesijxbts**

### ✅ Already Configured

- [x] Environment variables in `.env` file
- [x] Supabase client configuration (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`)

### ⚠️ Manual Verification Required

#### 1. Supabase Dashboard

**Authentication → URL Configuration:**
- [ ] Site URL: `http://localhost:3000`
- [ ] Redirect URLs include: `http://localhost:3000/auth/callback`

**Authentication → Providers → Google:**
- [ ] Google provider enabled
- [ ] Client ID set (from Google Cloud Console)
- [ ] Client Secret set (from Google Cloud Console)

#### 2. Google Cloud Console

**APIs & Services → Credentials:**
- [ ] OAuth 2.0 Client exists
- [ ] Authorized redirect URI: `https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/callback`

**OAuth Consent Screen:**
- [ ] Configured with required scopes (`email`, `profile`, `openid`)
- [ ] Test users added (if using External user type)

#### 3. Browser Settings

- [ ] Third-party cookies allowed
- [ ] Local storage enabled
- [ ] No blocking extensions (ad blockers, privacy tools)

## 🔧 Quick Fix Steps

### Step 1: Verify Supabase Dashboard Configuration

1. Go to: https://app.supabase.com → Your Project → **Authentication** → **URL Configuration**

2. Set **Site URL**: `http://localhost:3000`

3. Add to **Redirect URLs**: `http://localhost:3000/auth/callback`

4. Click **Save**

### Step 2: Verify Google Provider Configuration

1. Go to: **Authentication** → **Providers** → **Google**

2. Ensure **Google provider is enabled**

3. Verify **Client ID** and **Client Secret** match Google Cloud Console

### Step 3: Verify Google Cloud Console

1. Go to: https://console.cloud.google.com → **APIs & Services** → **Credentials**

2. Find your OAuth 2.0 Client

3. Verify **Authorized redirect URIs** includes:
   ```
   https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/callback
   ```

4. If missing, add it and click **Save**

### Step 4: Restart Dev Server

**CRITICAL:** After any `.env` changes, restart the dev server:

```bash
# Stop server (Ctrl+C)
cd frontend
npm start
```

### Step 5: Test OAuth Flow

1. Open browser DevTools → **Network** tab
2. Navigate to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. After redirect, check:
   - **Network tab**: `POST /auth/v1/token` should return **200 OK**
   - **Console**: Should see session object
   - **Application → Local Storage**: Should see `sb-xhhtkjtcdeewesijxbts-auth-token`

## 🎯 Expected Behavior After Fix

1. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth consent screen ✅

2. **User authenticates**
   - Google redirects to `http://localhost:3000/auth/callback#access_token=...` ✅

3. **AuthCallback processes session**
   - Waits 750ms for Supabase to process hash ✅
   - Calls `getSession()` → **Returns session object** ✅
   - OR `SIGNED_IN` listener fires → **Session received** ✅

4. **Session persists**
   - Stored in localStorage ✅
   - Survives page refresh ✅
   - User redirected to `/dashboard` or `/setup-profile` ✅

5. **Network tab shows**
   - `POST /auth/v1/token` → **200 OK** ✅
   - Session token in response ✅

## 🐛 Common Issues & Fixes

### Issue: `getSession()` returns `null`

**Diagnosis:**
- Check Network tab for `POST /auth/v1/token` request
- If **401**: API keys or redirect URI mismatch
- If **404**: Supabase URL incorrect
- If **no request**: `detectSessionInUrl` may be false

**Fixes:**
1. Verify redirect URL in Supabase Dashboard
2. Verify Google OAuth redirect URI in Google Cloud Console
3. Check `detectSessionInUrl: true` in `supabase.ts`
4. Restart dev server after `.env` changes

### Issue: `SIGNED_IN` listener never fires

**Diagnosis:**
- Session not being established (see above)
- `persistSession: false` in `supabase.ts`
- Browser blocking third-party cookies

**Fixes:**
1. Fix session establishment (see above)
2. Verify `persistSession: true` in `supabase.ts`
3. Allow third-party cookies in browser

### Issue: 401 "Invalid API key" errors

**Diagnosis:**
- Wrong `REACT_APP_SUPABASE_ANON_KEY`
- Key not loaded (dev server not restarted)
- Manual hash processing (should not exist)

**Fixes:**
1. Copy correct key from Supabase Dashboard
2. Restart dev server
3. Remove any manual `setSession()` calls

## 📊 Diagnostic Output

When you run the diagnostic script, you should see:

```
✅ .env file exists
✅ REACT_APP_SUPABASE_URL: Found
✅ REACT_APP_SUPABASE_ANON_KEY: Found
✅ persistSession: Enabled
✅ autoRefreshToken: Enabled
✅ detectSessionInUrl: Enabled
```

If any are missing, follow the configuration guide to fix them.

## 📝 Files Created/Modified

1. **`frontend/scripts/diagnose-oauth-config.js`**
   - Diagnostic script to check configuration

2. **`SUPABASE_OAUTH_CONFIGURATION_GUIDE.md`**
   - Comprehensive configuration guide

3. **`frontend/src/pages/AuthCallback.tsx`**
   - Enhanced session debugging
   - localStorage checks
   - Better error messages

4. **`OAUTH_SESSION_DIAGNOSIS_SUMMARY.md`** (this file)
   - Quick reference for diagnosis and fixes

## 🚀 Next Steps

1. **Run diagnostic script:**
   ```bash
   cd frontend
   node scripts/diagnose-oauth-config.js
   ```

2. **Follow configuration checklist** in `SUPABASE_OAUTH_CONFIGURATION_GUIDE.md`

3. **Verify Supabase Dashboard settings:**
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
   - Google provider enabled

4. **Verify Google Cloud Console:**
   - Redirect URI: `https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/callback`

5. **Test OAuth flow** and check Network tab for `POST /auth/v1/token` → 200 OK

6. **Verify session persists** after page refresh

## ✅ Success Criteria

After configuration fixes, you should see:

- ✅ `getSession()` returns session object (not null)
- ✅ `SIGNED_IN` listener fires (or session found via getSession)
- ✅ Session persists in localStorage
- ✅ User redirected to `/dashboard` or `/setup-profile`
- ✅ Network tab shows `POST /auth/v1/token` → 200 OK
- ✅ Page refresh maintains session

If all criteria are met, OAuth session persistence is working correctly!

