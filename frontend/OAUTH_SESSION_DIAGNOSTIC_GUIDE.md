# OAuth Session Persistence Diagnostic Guide

## Overview

This guide provides comprehensive diagnostic tools to identify and fix OAuth session persistence issues. The diagnostic system automatically runs when users land on the `/auth/callback` page after OAuth redirect, and can also be run manually from the browser console.

## Problem Statement

**Symptoms:**
- OAuth popup works correctly
- After redirect, `getSession()` returns `null`
- Users are redirected back to login
- Session is not persisted in localStorage
- Previous attempts at manual hash processing caused 401 errors

## Diagnostic Tools

### 1. Automatic Diagnostics (Built-in)

The `AuthCallback` component automatically runs comprehensive diagnostics when mounted. The diagnostic report is available in the browser console and can be downloaded.

**Access the report:**
```javascript
// In browser console after OAuth redirect
window.__OAUTH_DIAGNOSTIC_REPORT__  // View report
window.__OAUTH_DIAGNOSTICS__.downloadReport()  // Download as JSON
```

### 2. Manual Console Script

Run the comprehensive diagnostic script manually:

1. Open browser DevTools (F12)
2. Navigate to `/auth/callback` (after OAuth redirect)
3. Open Console tab
4. Paste the contents of `frontend/scripts/comprehensive-oauth-diagnostic.js`
5. Press Enter
6. Review the output
7. Download report: `downloadDiagnosticReport()`

## What Gets Checked

### 1. Environment Variables
- ✅ `REACT_APP_SUPABASE_URL` - Must be set
- ✅ `REACT_APP_SUPABASE_ANON_KEY` - Must be set
- ✅ `REACT_APP_USE_MOCK` - Should be `false` for OAuth
- ✅ Dev server restart after `.env` changes

**Common Issues:**
- Env vars not accessible → Restart dev server
- Mock mode enabled → Set `REACT_APP_USE_MOCK=false`

### 2. Supabase Client Configuration

**Required settings in `frontend/src/lib/supabase.ts`:**
```typescript
auth: {
  persistSession: true,        // Required: Persist session to localStorage
  autoRefreshToken: true,       // Required: Auto-refresh expired tokens
  detectSessionInUrl: true,     // Required: Auto-detect OAuth callback from URL hash
}
```

**Verification:**
- Check console for: "✅ Supabase client initialized"
- Verify `supabase.ts` has all three settings set to `true`

### 3. URL Hash Contents

**What to check:**
- Hash exists in URL after redirect
- Hash contains `access_token`
- Hash contains `refresh_token`
- No `error` parameter in hash

**Common Issues:**
- No hash → OAuth redirect failed
- Hash contains error → Check error message
- Hash exists but no session → Supabase not processing hash

### 4. LocalStorage Session Token

**Storage key format:**
```
sb-<PROJECT_REF>-auth-token
```

**What to check:**
- Token exists in localStorage
- Token is valid JSON
- Token contains session data

**Common Issues:**
- No token → Supabase didn't process hash
- Invalid token → Session corrupted
- Token exists but getSession() returns null → Timing issue

### 5. Network Requests

**Critical requests to monitor:**
- `POST /auth/v1/token` - Should return 200 with session
- `GET /auth/v1/callback` - OAuth callback endpoint

**How to check:**
1. Open DevTools → Network tab
2. Filter by: `/auth/v1/token`
3. Look for POST request with status 200
4. Check response body for session data

**Common Issues:**
- 401 Unauthorized → Invalid credentials or redirect URI mismatch
- 400 Bad Request → Malformed request
- Network error → CORS or connectivity issue

### 6. Auth State Change Events

**Expected events:**
- `SIGNED_IN` - Should fire when session is established
- `TOKEN_REFRESHED` - Should fire when token is refreshed
- `SIGNED_OUT` - Indicates session loss

**How to check:**
- Console logs: "🔵 Auth state change: SIGNED_IN"
- Diagnostic report includes all events with timestamps

**Common Issues:**
- No SIGNED_IN event → Session not established
- SIGNED_OUT event → Session lost
- Event fires but no session → Race condition

### 7. Session Retrieval Attempts

**Multiple attempts with delays:**
- Attempt 1: Immediate
- Attempt 2: After 500ms delay
- Attempt 3: After 1000ms delay

**What to check:**
- Session found in any attempt
- Error messages if all attempts fail
- Timing of successful retrieval

## Diagnostic Report Structure

The diagnostic report is a JSON object with the following structure:

```typescript
{
  timestamp: string;                    // ISO timestamp
  environment: {
    supabaseUrl: string | null;
    supabaseAnonKey: string | null;      // Redacted
    useMock: string | null;
    nodeEnv: string;
  };
  supabaseConfig: {
    persistSession: boolean;
    autoRefreshToken: boolean;
    detectSessionInUrl: boolean;
  };
  urlState: {
    fullUrl: string;
    hash: string | null;
    hashLength: number;
    hashContainsAccessToken: boolean;
    hashContainsRefreshToken: boolean;
    hashContainsError: boolean;
  };
  localStorage: {
    hasSessionToken: boolean;
    storageKey: string | null;
    tokenPreview: string | null;
    allSupabaseKeys: string[];
  };
  sessionChecks: Array<{
    timestamp: string;
    method: 'getSession' | 'authStateChange';
    sessionExists: boolean;
    error: string | null;
    sessionDetails: any;
  }>;
  authStateEvents: Array<{
    timestamp: string;
    event: string;
    hasSession: boolean;
    userEmail: string | null;
  }>;
  networkRequests: Array<{
    timestamp: string;
    url: string;
    method: string;
    status: number | null;
    statusText: string | null;
    responseBody: any;
    error: string | null;
  }>;
  recommendations: string[];             // Actionable fixes
}
```

## Common Root Causes & Fixes

### 1. Environment Variables Not Loaded

**Symptoms:**
- `REACT_APP_SUPABASE_URL` is `null`
- `REACT_APP_SUPABASE_ANON_KEY` is `null`

**Fix:**
1. Check `.env` file exists in `frontend/` directory
2. Verify variables are set:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   REACT_APP_USE_MOCK=false
   ```
3. **Restart dev server** (env vars are embedded at build time)

### 2. Supabase Client Configuration Missing

**Symptoms:**
- `detectSessionInUrl: false` or missing
- `persistSession: false` or missing

**Fix:**
Update `frontend/src/lib/supabase.ts`:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,  // ← Critical for OAuth
  },
});
```

### 3. Supabase Dashboard Configuration

**Required settings:**

1. **Site URL:**
   - Go to: Supabase Dashboard → Authentication → URL Configuration
   - Set Site URL: `http://localhost:3000`

2. **Redirect URLs:**
   - Add: `http://localhost:3000/auth/callback`

3. **Google Provider:**
   - Go to: Authentication → Providers → Google
   - Enable Google provider
   - Set Client ID and Client Secret

### 4. Google Cloud Console Configuration

**Required settings:**

1. **Authorized Redirect URI:**
   - Go to: Google Cloud Console → APIs & Services → Credentials
   - Find your OAuth 2.0 Client
   - Add redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
   - Replace `<PROJECT_REF>` with your Supabase project reference

2. **Client ID/Secret Match:**
   - Ensure Client ID in Google Cloud Console matches Supabase Dashboard
   - Ensure Client Secret matches

### 5. Hash Processing Timing

**Symptoms:**
- Hash exists in URL
- No session token in localStorage
- `getSession()` returns null

**Fix:**
- AuthCallback already waits 750ms before checking session
- If still failing, increase delay or check network requests
- Verify `detectSessionInUrl: true` is set

### 6. Network Request Failures

**Symptoms:**
- POST `/auth/v1/token` returns 401 or 400
- Network error in console

**Fixes:**
- Check redirect URI matches exactly (no trailing slashes)
- Verify CORS settings in Supabase
- Check browser console for detailed error messages
- Verify Google OAuth credentials are correct

## Step-by-Step Diagnostic Process

### Step 1: Run Automatic Diagnostics

1. Start dev server: `cd frontend && npm start`
2. Navigate to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Complete OAuth flow
5. After redirect to `/auth/callback`, check console
6. Look for diagnostic output
7. Download report: `window.__OAUTH_DIAGNOSTICS__.downloadReport()`

### Step 2: Review Diagnostic Report

1. Check `environment` section:
   - Are env vars set?
   - Is mock mode disabled?

2. Check `supabaseConfig` section:
   - Are all three settings `true`?

3. Check `urlState` section:
   - Does hash exist?
   - Does it contain tokens?
   - Any errors?

4. Check `localStorage` section:
   - Is session token present?
   - Is it valid JSON?

5. Check `networkRequests` section:
   - Did `/auth/v1/token` succeed?
   - What was the status code?

6. Check `authStateEvents` section:
   - Did SIGNED_IN event fire?
   - When did it fire?

7. Check `recommendations` section:
   - Follow each recommendation

### Step 3: Manual Verification

1. **Check Supabase Dashboard:**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
   - Google provider enabled with credentials

2. **Check Google Cloud Console:**
   - Redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
   - Client ID matches Supabase

3. **Check Browser:**
   - LocalStorage enabled
   - Third-party cookies allowed
   - No ad blockers interfering

### Step 4: Network Monitoring

1. Open DevTools → Network tab
2. Filter by: `/auth/v1/token`
3. Click "Sign in with Google"
4. After redirect, check:
   - POST request to `/auth/v1/token`
   - Status: 200
   - Response body contains session

### Step 5: Apply Fixes

Based on diagnostic report recommendations:
1. Fix environment variables
2. Update Supabase client config
3. Fix Supabase Dashboard settings
4. Fix Google Cloud Console settings
5. Test again

## Downloading Diagnostic Reports

### Automatic Download (Development)

In development mode, the diagnostic report is automatically available:
```javascript
// View report
console.log(window.__OAUTH_DIAGNOSTIC_REPORT__);

// Download as JSON
window.__OAUTH_DIAGNOSTICS__.downloadReport();
```

### Manual Download

After running the console script:
```javascript
downloadDiagnosticReport();
```

The report will be downloaded as: `oauth-diagnostic-<timestamp>.json`

## Troubleshooting Checklist

- [ ] Environment variables set in `.env` file
- [ ] Dev server restarted after `.env` changes
- [ ] `REACT_APP_USE_MOCK=false` in `.env`
- [ ] `supabase.ts` has `persistSession: true`
- [ ] `supabase.ts` has `autoRefreshToken: true`
- [ ] `supabase.ts` has `detectSessionInUrl: true`
- [ ] Supabase Dashboard: Site URL = `http://localhost:3000`
- [ ] Supabase Dashboard: Redirect URL = `http://localhost:3000/auth/callback`
- [ ] Supabase Dashboard: Google provider enabled
- [ ] Google Cloud Console: Redirect URI = `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- [ ] Browser: LocalStorage enabled
- [ ] Browser: Third-party cookies allowed
- [ ] Network: POST `/auth/v1/token` returns 200
- [ ] Console: SIGNED_IN event fires
- [ ] Console: Session found via `getSession()`

## Next Steps

After running diagnostics:

1. **Review the report** - Identify specific issues
2. **Check recommendations** - Follow actionable fixes
3. **Verify configurations** - Supabase Dashboard and Google Cloud Console
4. **Test again** - Run diagnostics after fixes
5. **Share report** - If issues persist, share diagnostic report for further analysis

## Support

If issues persist after following this guide:

1. Download the diagnostic report
2. Check all checklist items
3. Review network requests in DevTools
4. Share diagnostic report and findings for further analysis

---

**Last Updated:** 2024-01-XX
**Version:** 1.0.0

