# Supabase OAuth Configuration Guide - Localhost Fix

## 🔍 Root Cause Diagnosis

If `getSession()` returns `null` and `SIGNED_IN` listener never fires after Google OAuth redirect, this is typically a **backend/configuration issue**, not a frontend code issue.

## ✅ Step-by-Step Configuration Fix

### 1. Supabase Dashboard Configuration

#### A. Authentication → URL Configuration

1. Go to: https://app.supabase.com → Your Project → **Authentication** → **URL Configuration**

2. **Site URL** must be:
   ```
   http://localhost:3000
   ```

3. **Redirect URLs** must include:
   ```
   http://localhost:3000/auth/callback
   ```

4. **Additional Redirect URLs** (if using):
   ```
   http://localhost:3000/**
   ```

5. Click **Save**

#### B. Authentication → Providers → Google

1. Go to: **Authentication** → **Providers** → **Google**

2. **Enable Google provider** (toggle must be ON)

3. **Client ID (for OAuth)**: 
   - Get from Google Cloud Console → APIs & Services → Credentials
   - Should look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

4. **Client Secret (for OAuth)**:
   - Get from Google Cloud Console → APIs & Services → Credentials
   - Should be a long string

5. **Authorized Client IDs** (optional):
   - Can leave empty for basic OAuth flow

6. Click **Save**

### 2. Google Cloud Console Configuration

#### A. Create OAuth 2.0 Client (if not exists)

1. Go to: https://console.cloud.google.com → **APIs & Services** → **Credentials**

2. Click **Create Credentials** → **OAuth 2.0 Client ID**

3. **Application type**: Web application

4. **Name**: Your app name (e.g., "FBLA Virtual Pet")

5. **Authorized redirect URIs**:
   ```
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   
   Replace `<PROJECT_REF>` with your Supabase project reference.
   
   Example:
   ```
   https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/callback
   ```
   
   **How to find PROJECT_REF:**
   - Go to Supabase Dashboard → Settings → API
   - Your Project URL is: `https://<PROJECT_REF>.supabase.co`
   - Extract the `<PROJECT_REF>` part

6. Click **Create**

7. **Copy Client ID and Client Secret** to Supabase Dashboard

#### B. Verify OAuth Consent Screen

1. Go to: **APIs & Services** → **OAuth consent screen**

2. **User Type**: External (for testing) or Internal (for organization)

3. **App information**: Fill in required fields

4. **Scopes**: Add `email`, `profile`, `openid` (usually added automatically)

5. **Test users** (if External): Add your Google account email

6. Click **Save and Continue** through all steps

### 3. Frontend Environment Variables

#### A. Create/Update `.env` file

Location: `frontend/.env`

```env
REACT_APP_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your-anon-key>
REACT_APP_USE_MOCK=false
```

**How to get values:**

1. **REACT_APP_SUPABASE_URL**:
   - Supabase Dashboard → Settings → API
   - Copy "Project URL"

2. **REACT_APP_SUPABASE_ANON_KEY**:
   - Supabase Dashboard → Settings → API
   - Copy "anon public" key (starts with `eyJ...`)

3. **REACT_APP_USE_MOCK**:
   - Set to `false` for real OAuth

#### B. Restart Dev Server

**CRITICAL:** After editing `.env`, you MUST restart the dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd frontend
npm start
```

React only reads `.env` on startup, not during runtime.

### 4. Verify Supabase Client Configuration

Check `frontend/src/lib/supabase.ts`:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // ✅ Must be true
    autoRefreshToken: true,      // ✅ Must be true
    detectSessionInUrl: true,    // ✅ Must be true
  },
});
```

All three must be `true` for OAuth to work.

### 5. Browser Configuration

#### A. Allow Third-Party Cookies

1. **Chrome/Edge:**
   - Settings → Privacy and security → Cookies and other site data
   - Ensure "Block third-party cookies" is OFF (or add exception for localhost)

2. **Firefox:**
   - Settings → Privacy & Security → Cookies and Site Data
   - Ensure "Cross-site and social media tracking cookies" is not blocked

3. **Safari:**
   - Preferences → Privacy
   - Uncheck "Prevent cross-site tracking" (or add exception)

#### B. Enable Local Storage

- Should be enabled by default
- Check: DevTools → Application → Local Storage → `http://localhost:3000`

#### C. Disable Blocking Extensions

- Disable ad blockers, privacy extensions during testing
- Some extensions block OAuth redirects

## 🔬 Diagnostic Testing

### Run Diagnostic Script

```bash
cd frontend
node scripts/diagnose-oauth-config.js
```

This will check:
- Environment variables
- Supabase client configuration
- Provide configuration checklist

### Manual Testing

1. **Start dev server:**
   ```bash
   cd frontend
   npm start
   ```

2. **Open browser DevTools:**
   - Network tab (to see requests)
   - Console tab (to see logs)
   - Application tab → Local Storage (to see session)

3. **Navigate to:** `http://localhost:3000/login`

4. **Click "Sign in with Google"**

5. **After redirect to `/auth/callback`, check:**

   **Network Tab:**
   - Look for `POST /auth/v1/token` request
   - Should return **200 OK**
   - If **401 Unauthorized**: Check API keys and redirect URIs
   - If **404 Not Found**: Check Supabase URL

   **Console Tab:**
   - Should see: `✅ AuthCallback: Session retrieved successfully`
   - Should see session object with user ID and email

   **Application → Local Storage:**
   - Should see key: `sb-<project-ref>-auth-token`
   - Should contain session data

6. **Refresh page:**
   - Session should persist
   - Should not redirect to login

### Common Issues and Fixes

#### Issue: `getSession()` returns `null`

**Possible causes:**
1. ❌ `detectSessionInUrl: false` in `supabase.ts`
   - ✅ Fix: Set to `true`

2. ❌ Supabase redirect URL mismatch
   - ✅ Fix: Add `http://localhost:3000/auth/callback` to Supabase Dashboard

3. ❌ Google OAuth redirect URI mismatch
   - ✅ Fix: Add `https://<PROJECT_REF>.supabase.co/auth/v1/callback` to Google Cloud Console

4. ❌ Environment variables not loaded
   - ✅ Fix: Restart dev server after editing `.env`

5. ❌ Network request to `/auth/v1/token` failing
   - ✅ Fix: Check Network tab for error, verify API keys

#### Issue: `SIGNED_IN` listener never fires

**Possible causes:**
1. ❌ Session not being established (see above)
2. ❌ `persistSession: false` in `supabase.ts`
   - ✅ Fix: Set to `true`

3. ❌ Browser blocking third-party cookies
   - ✅ Fix: Allow third-party cookies for localhost

#### Issue: 401 "Invalid API key" errors

**Possible causes:**
1. ❌ Wrong `REACT_APP_SUPABASE_ANON_KEY`
   - ✅ Fix: Copy correct key from Supabase Dashboard → Settings → API

2. ❌ Key not loaded (dev server not restarted)
   - ✅ Fix: Restart dev server

3. ❌ Manual hash processing (should not exist)
   - ✅ Fix: Remove any manual `setSession()` calls

## 📋 Verification Checklist

Before testing, verify:

- [ ] Supabase Dashboard → Authentication → URL Configuration
  - [ ] Site URL: `http://localhost:3000`
  - [ ] Redirect URLs include: `http://localhost:3000/auth/callback`

- [ ] Supabase Dashboard → Authentication → Providers → Google
  - [ ] Google provider enabled
  - [ ] Client ID set (matches Google Cloud Console)
  - [ ] Client Secret set (matches Google Cloud Console)

- [ ] Google Cloud Console → APIs & Services → Credentials
  - [ ] OAuth 2.0 Client exists
  - [ ] Authorized redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

- [ ] Frontend `.env` file
  - [ ] `REACT_APP_SUPABASE_URL` set correctly
  - [ ] `REACT_APP_SUPABASE_ANON_KEY` set correctly
  - [ ] `REACT_APP_USE_MOCK=false`

- [ ] Dev server restarted after `.env` changes

- [ ] `frontend/src/lib/supabase.ts`
  - [ ] `persistSession: true`
  - [ ] `autoRefreshToken: true`
  - [ ] `detectSessionInUrl: true`

- [ ] Browser settings
  - [ ] Third-party cookies allowed
  - [ ] Local storage enabled
  - [ ] No blocking extensions

## 🎯 Expected Behavior After Fix

1. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth consent screen

2. **User authenticates with Google**
   - Google redirects to `http://localhost:3000/auth/callback#access_token=...`

3. **AuthCallback component**
   - Waits 750ms for Supabase to process hash
   - Calls `getSession()` → **Returns session object** ✅
   - OR `SIGNED_IN` listener fires → **Session received** ✅

4. **Session persists**
   - Stored in localStorage
   - Survives page refresh
   - User redirected to `/dashboard` or `/setup-profile`

5. **Network tab shows**
   - `POST /auth/v1/token` → **200 OK** ✅
   - Session token in response

## 📝 Debug Logs

After OAuth flow, check console for:

```
✅ Supabase client initialized with env variables
✅ Session persistence enabled: persistSession=true
✅ Token refresh enabled: autoRefreshToken=true
✅ URL hash detection enabled: detectSessionInUrl=true
✅ OAuth callback will be processed automatically from URL hash

[LOG] 🔵 AuthCallback: Component mounted
[LOG] 🔵 AuthCallback: Hash exists: true
[LOG] 🔵 AuthCallback: Waiting 750ms for Supabase to process OAuth callback...
[LOG] 🔵 AuthCallback: Attempting getSession()...
[LOG] ✅ AuthCallback: Session retrieved successfully via getSession()
[LOG] ✅ AuthCallback: Session details
[LOG]   User ID: abc123...
[LOG]   User email: user@example.com
```

If you see `Session exists: false` or `Session is null`, follow the diagnostic steps above.

## 🚀 Quick Fix Summary

1. **Supabase Dashboard:**
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
   - Google provider enabled with correct Client ID/Secret

2. **Google Cloud Console:**
   - Redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

3. **Frontend `.env`:**
   - Set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
   - Set `REACT_APP_USE_MOCK=false`
   - **Restart dev server**

4. **Verify `supabase.ts`:**
   - `persistSession: true`
   - `autoRefreshToken: true`
   - `detectSessionInUrl: true`

5. **Test and verify session persists**

