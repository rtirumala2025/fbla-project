# OAuth Diagnostic Quick Reference

## 🚀 Quick Start

### Automatic Diagnostics (After OAuth Redirect)

1. Open DevTools (F12) → Console tab
2. After redirect to `/auth/callback`, diagnostics run automatically
3. View report: `window.__OAUTH_DIAGNOSTIC_REPORT__`
4. Download: `window.__OAUTH_DIAGNOSTICS__.downloadReport()`

### Manual Console Script

1. Open DevTools (F12) → Console tab
2. Navigate to `/auth/callback`
3. Paste: `frontend/scripts/comprehensive-oauth-diagnostic.js`
4. Press Enter
5. Download: `downloadDiagnosticReport()`

## ✅ Success Checklist

- [ ] Env vars set: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`
- [ ] Mock mode disabled: `REACT_APP_USE_MOCK=false`
- [ ] Dev server restarted after `.env` changes
- [ ] `supabase.ts` has: `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`
- [ ] Supabase Dashboard: Site URL = `http://localhost:3000`
- [ ] Supabase Dashboard: Redirect URL = `http://localhost:3000/auth/callback`
- [ ] Google Cloud Console: Redirect URI = `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- [ ] Hash contains `access_token` and `refresh_token`
- [ ] Session token in localStorage: `sb-<PROJECT_REF>-auth-token`
- [ ] Network: POST `/auth/v1/token` returns 200
- [ ] Console: SIGNED_IN event fires
- [ ] `getSession()` returns session

## 🔍 What to Check in Diagnostic Report

1. **environment** - Are env vars set?
2. **supabaseConfig** - All three settings `true`?
3. **urlState** - Hash exists? Contains tokens? No errors?
4. **localStorage** - Session token present? Valid JSON?
5. **networkRequests** - `/auth/v1/token` succeeded? Status 200?
6. **authStateEvents** - SIGNED_IN event fired?
7. **sessionChecks** - Session found in any attempt?
8. **recommendations** - Follow each one

## 🐛 Common Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Env vars missing | `supabaseUrl: null` | Check `.env`, restart dev server |
| Mock mode enabled | `useMock: "true"` | Set `REACT_APP_USE_MOCK=false` |
| No hash | `hash: null` | OAuth redirect failed |
| Hash has error | `hashContainsError: true` | Check error message in hash |
| No session token | `hasSessionToken: false` | Check `detectSessionInUrl: true` |
| Network 401 | Status 401 | Check redirect URI matches |
| No SIGNED_IN event | Event missing | Check network request succeeded |

## 📊 Diagnostic Report Access

```javascript
// View report
window.__OAUTH_DIAGNOSTIC_REPORT__

// Download report
window.__OAUTH_DIAGNOSTICS__.downloadReport()

// Manual script report
window.__COMPREHENSIVE_OAUTH_DIAGNOSTIC_REPORT__
downloadDiagnosticReport()
```

## 🔧 Configuration Checklist

### Supabase Client (`frontend/src/lib/supabase.ts`)
```typescript
auth: {
  persistSession: true,        // ✅ Required
  autoRefreshToken: true,       // ✅ Required
  detectSessionInUrl: true,     // ✅ Required
}
```

### Environment Variables (`.env`)
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_USE_MOCK=false
```

### Supabase Dashboard
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`
- Google Provider: Enabled with Client ID/Secret

### Google Cloud Console
- Redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

## 📝 Full Documentation

See `frontend/OAUTH_SESSION_DIAGNOSTIC_GUIDE.md` for complete details.

