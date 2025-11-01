# Complete Testing Guide - Username Persistence Fix

## Overview

This guide covers all testing layers for the username persistence fix:
- **Unit Tests**: Mock-based tests for individual functions
- **Integration Tests**: Real Supabase database tests
- **E2E Tests**: Full browser automation with Playwright

---

## Prerequisites

### 1. Environment Setup

Create `frontend/.env`:
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_USE_MOCK=false
```

### 2. Test User

For E2E tests, export credentials:
```bash
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=YourPassword123!
```

---

## Quick Start: Run All Tests

```bash
# Run the complete test suite
./scripts/test-username-persistence.sh
```

This script will:
1. ✓ Check environment configuration
2. ✓ Install dependencies
3. ✓ Run unit tests
4. ✓ Run integration tests
5. ✓ Check dev server status
6. ✓ Run E2E tests
7. ✓ Display manual verification steps

---

## Individual Test Commands

### Unit Tests (Fast, No DB Required)

```bash
cd frontend
npm test -- ProfileUpdate.test.tsx --watchAll=false
```

**What it tests**:
- `profileService.updateUsername()` updates database
- `profileService.getProfile()` fetches profiles
- Auth metadata update (mocked)
- Graceful error handling

**Expected output**:
```
PASS src/__tests__/ProfileUpdate.test.tsx
  ✓ updateUsername updates profile in database
  ✓ updateUsername handles auth metadata update failure gracefully
  ✓ getProfile fetches profile from database
  ✓ updateProfile updates the updated_at timestamp

Test Suites: 1 passed
Tests:       4 passed
```

---

### Integration Tests (Real Supabase)

```bash
cd frontend
REACT_APP_USE_MOCK=false npm run test:integration
```

**What it tests**:
- Real database reads/writes
- JWT token validation
- Row Level Security (RLS) policies
- Concurrent update handling
- Auth metadata synchronization

**Requirements**:
- Must be logged in (valid Supabase session)
- Real Supabase credentials in `.env`

**Expected output**:
```
PASS src/__tests__/ProfileIntegration.test.tsx
  ✓ should fetch profile from database
  ✓ should update username in database
  ✓ should update updated_at timestamp
  ✓ should update auth metadata alongside profile
  ✓ should validate JWT token for protected operations
  ✓ should reject update with invalid token
  ✓ should enforce Row Level Security
  ✓ should handle concurrent updates gracefully

Test Suites: 1 passed
Tests:       8 passed
```

---

### E2E Tests (Browser Automation)

```bash
# Run headless (CI mode)
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed
```

**What it tests**:
- Complete user flow: login → profile → edit → save
- Immediate UI updates
- Persistence after page reload
- Dashboard synchronization
- Unauthorized access prevention

**Requirements**:
- Dev server running on port 3002
- Test user credentials in environment

**Expected output**:
```
Running 2 tests using 1 worker

  ✓  username-persistence.spec.ts:22:3 › should persist username change through full flow (15s)
  ✓  username-persistence.spec.ts:88:3 › should reject unauthorized profile updates (3s)

2 passed (18s)
```

---

## Manual Testing

### Complete Manual Flow

```bash
# 1. Start dev server
cd frontend
PORT=3002 npm start

# 2. Open browser
open http://localhost:3002

# 3. Test the flow
# - Login
# - Go to Profile
# - Edit username to "ManualTest123"
# - Click Save
# - Verify success toast
# - Go to Dashboard
# - Verify "Welcome, ManualTest123!"
# - Refresh page
# - Verify username persists
```

### Network Inspection

1. Open DevTools → Network tab
2. Edit and save username
3. Look for `PATCH` request to `/rest/v1/profiles`
4. Verify request headers:
   - `Authorization: Bearer <JWT>`
   - `apikey: <anon-key>`
5. Verify response: `200 OK` with updated profile

### Database Verification

In Supabase SQL Editor:

```sql
-- Check recent updates
SELECT 
  user_id, 
  username, 
  updated_at,
  (EXTRACT(EPOCH FROM (NOW() - updated_at))) as seconds_ago
FROM profiles
ORDER BY updated_at DESC
LIMIT 10;
```

**Expected**: Your username with `updated_at` < 60 seconds ago

### Auth Token Verification

In browser console:

```javascript
// Get current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Token:', session.access_token);

// Decode token (don't do this in production!)
const parts = session.access_token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token payload:', payload);
console.log('Expires:', new Date(payload.exp * 1000));
```

**Expected**: 
- Valid JWT structure (3 parts)
- Contains `user_id`
- Expiration in future

### Protected Endpoint Test

```bash
# 1. Get token from browser console (see above)

# 2. Test with valid token
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
     "https://<YOUR_PROJECT>.supabase.co/rest/v1/profiles?select=username" \
     -H "apikey: <YOUR_ANON_KEY>"

# Expected: 200 OK with profile data

# 3. Test with invalid token
curl -H "Authorization: Bearer invalid-token" \
     "https://<YOUR_PROJECT>.supabase.co/rest/v1/profiles?select=username" \
     -H "apikey: <YOUR_ANON_KEY>"

# Expected: 401 Unauthorized
```

---

## Test Coverage Summary

| Layer | What | How | Coverage |
|-------|------|-----|----------|
| **Unit** | Individual functions | Jest + mocks | Function logic |
| **Integration** | API + Database | Jest + real Supabase | Data persistence, auth |
| **E2E** | Full user flow | Playwright + browser | UI, state sync, reloads |
| **Manual** | Real user testing | Browser + DevTools | UX, edge cases |

---

## Debugging Failed Tests

### Unit Tests Fail

**Problem**: Mock structure mismatch

**Solution**: Check Supabase client method chaining
```typescript
// Ensure mocks match this structure:
.from('profiles')
  .update(data)
  .eq('user_id', id)
  .select()
  .single()
```

### Integration Tests Fail

**Problem**: Not authenticated

**Solution**: 
1. Start dev server
2. Login in browser
3. Re-run tests (uses same session)

**Problem**: RLS blocking updates

**Solution**: Check Supabase RLS policies:
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### E2E Tests Fail

**Problem**: Dev server not running

**Solution**:
```bash
cd frontend
PORT=3002 npm start
```

**Problem**: Test user doesn't exist

**Solution**: Create user in app or use existing credentials

**Problem**: Timeout waiting for elements

**Solution**: Check browser console logs in Playwright trace:
```bash
npx playwright show-report
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Username Persistence

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm install
      
      - name: Run unit tests
        run: cd frontend && npm test -- ProfileUpdate --watchAll=false
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          REACT_APP_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          REACT_APP_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

---

## Performance Testing

### Load Test (Optional)

Test concurrent username updates:

```bash
npm install -g artillery

# Create artillery config
cat > load-test.yml << EOF
config:
  target: 'http://localhost:3002'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: Update username
    flow:
      - post:
          url: '/api/profile/username'
          headers:
            Authorization: 'Bearer {{token}}'
          json:
            username: 'LoadTest{{$randomString()}}'
EOF

# Run test
artillery run load-test.yml
```

---

## Security Testing

### Test Scenarios

1. ✓ **Invalid token rejected**
   - Covered in integration tests
   
2. ✓ **RLS prevents cross-user updates**
   - Covered in integration tests
   
3. ✓ **SQL injection protected**
   - Supabase client uses parameterized queries
   
4. ✓ **XSS prevented**
   - React escapes by default
   - Username validation needed (TODO)

### Additional Manual Checks

```javascript
// Test XSS (should be escaped)
// Try setting username to: <script>alert('XSS')</script>

// Test SQL injection (should be parameterized)
// Try setting username to: '; DROP TABLE profiles; --
```

Both should fail gracefully or be escaped.

---

## Troubleshooting Common Issues

### "Mock mode is enabled"

**Problem**: `.env` has `REACT_APP_USE_MOCK=true`

**Solution**: Set to `false` and restart dev server

### "Network request failed"

**Problem**: No internet or wrong Supabase URL

**Solution**: Check `.env` credentials and network

### "Row Level Security policy violation"

**Problem**: RLS policy blocks update

**Solution**: Check and update policies in Supabase dashboard

### "Token expired"

**Problem**: Session expired

**Solution**: Re-login in browser

---

## Next Steps

After all tests pass:

1. ✓ Commit changes
2. ✓ Push branch
3. ✓ Open PR with test outputs
4. ✓ Manual review by team
5. ✓ Merge to main

---

## Resources

- **Playwright Docs**: https://playwright.dev
- **Supabase Testing**: https://supabase.com/docs/guides/getting-started/testing
- **Jest Docs**: https://jestjs.io/docs/getting-started
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

