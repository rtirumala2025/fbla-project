# Username Persistence Fix - Verification Guide

## Summary of Changes

This fix addresses the bug where username changes were not persisted or displayed after updates. The issue was caused by the ProfilePage using mocked local state instead of real Supabase data, and the AuthContext reading from `user_metadata` instead of the `profiles` table.

## Root Cause

1. **ProfilePage was completely mocked** - It used local React state and never called Supabase APIs
2. **AuthContext read from wrong source** - It used `user_metadata.display_name` which was set once at signup and never updated
3. **No synchronization** - Username updates to the profiles table were not reflected in auth metadata or the UI

## Files Changed

### 1. `frontend/src/contexts/AuthContext.tsx`
**Change**: Updated `refreshUserState()` to fetch username from the `profiles` table  
**Why**: The display name should come from the profiles table (source of truth) rather than cached user_metadata

### 2. `frontend/src/services/profileService.ts`
**Change**: Enhanced `updateUsername()` to also update Supabase auth user_metadata  
**Why**: Keeps auth metadata in sync with the profile for consistency (though profiles table is source of truth)

### 3. `frontend/src/pages/ProfilePage.tsx`
**Change**: Complete rewrite from mocked to real implementation  
**Why**: 
- Fetches real profile data from Supabase on mount
- Calls `profileService.updateUsername()` when saving
- Calls `refreshUserState()` to update AuthContext immediately
- Displays loading/error states properly
- Persists changes to the database

### 4. `frontend/src/__tests__/ProfileUpdate.test.tsx` (NEW)
**Change**: Added comprehensive unit tests  
**Why**: Verifies that username updates persist to the database and auth metadata is updated

## Manual Verification Steps

### Prerequisites
```bash
cd frontend
# Ensure dependencies are installed
npm install

# Ensure you have Supabase credentials in .env
# REACT_APP_SUPABASE_URL=https://your-project.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=your-anon-key
# REACT_APP_USE_MOCK=false
```

### Step 1: Start the Development Server
```bash
cd frontend
PORT=3002 npm start
```

### Step 2: Login and Navigate to Profile
1. Open http://localhost:3002
2. Log in with your credentials (or sign up if new)
3. Complete the profile setup if prompted
4. Navigate to the Profile page

### Step 3: Update Username
1. Click the "Edit" button (✏️) on the User Profile card
2. Change your username to a new value (e.g., "TestUser123")
3. Click "Save Changes"
4. You should see a success toast: "Profile updated successfully! 🎉"

### Step 4: Verify Immediate UI Update
1. The username should update **immediately** in the Profile page
2. Check the header/dashboard - the new username should appear there too
3. The welcome message should say "Welcome, TestUser123!" with the new name

### Step 5: Verify Persistence (Reload Test)
1. Refresh the page (F5 or Cmd+R)
2. The new username should still be displayed (not reverted)
3. Navigate to Dashboard and back to Profile - username persists

### Step 6: Verify Database Persistence
Using Supabase SQL Editor or a database client:

```sql
-- Replace 'YOUR_USER_ID' with the actual user ID
SELECT id, user_id, username, updated_at 
FROM profiles 
WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result:**
- `username` column shows the new username
- `updated_at` timestamp is recent (within last few minutes)

### Step 7: Verify Auth Session
Open browser DevTools Console and run:

```javascript
// Get the current session
const { data: { session } } = await window.supabase.auth.getSession();
console.log('User metadata:', session.user.user_metadata);
console.log('Display name:', session.user.user_metadata.display_name);
```

**Expected Result:**
- `display_name` should match the new username (if auth update succeeded)
- If auth update failed (graceful failure), profile still updated

## Authentication Verification

### Real Auth vs Mock Auth
The app uses **real Supabase authentication**, not mocked auth:

1. **Check the Supabase client** (`frontend/src/lib/supabase.ts`):
   - If `REACT_APP_USE_MOCK=false` and credentials are set, uses real Supabase client
   - Session tokens are verified server-side by Supabase

2. **Verify token in Network tab**:
   - Open DevTools → Network tab
   - Update your username
   - Look for the request to Supabase (e.g., to `/rest/v1/profiles`)
   - Check the `Authorization` header: `Bearer <token>`
   - This token is validated by Supabase on every request

3. **Test invalid token**:
   - Open DevTools Console
   - Manually call: `localStorage.removeItem('supabase.auth.token')`
   - Try to update username
   - **Expected**: Request fails with 401 Unauthorized

### Protected Endpoint Test
```bash
# Get your auth token from localStorage in browser console:
# localStorage.getItem('supabase.auth.token')

# Then test with curl (replace <TOKEN> and <SUPABASE_URL>):
curl -H "Authorization: Bearer <TOKEN>" \
  <SUPABASE_URL>/rest/v1/profiles?select=username
```

**Expected Results:**
- Valid token → 200 OK with profile data
- Invalid/missing token → 401 Unauthorized

## Running Automated Tests

```bash
cd frontend
npm test -- ProfileUpdate.test.tsx
```

**Expected Output:**
```
 PASS  src/__tests__/ProfileUpdate.test.tsx
  Username Update and Persistence
    ✓ updateUsername updates profile in database
    ✓ updateUsername handles auth metadata update failure gracefully
    ✓ getProfile fetches profile from database
    ✓ updateProfile updates the updated_at timestamp

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

## SQL Verification Queries

### Check profile update history
```sql
SELECT 
  id,
  user_id,
  username,
  created_at,
  updated_at,
  (updated_at - created_at) as time_since_creation
FROM profiles
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC;
```

### Verify username uniqueness (if constraint exists)
```sql
SELECT username, COUNT(*) as count
FROM profiles
GROUP BY username
HAVING COUNT(*) > 1;
```

Should return no rows if username is unique.

## Common Issues and Troubleshooting

### Issue: Username doesn't update in header after save
**Solution**: The AuthContext `refreshUserState()` should be called after save. Check console for errors.

### Issue: Database update fails
**Possible causes**:
1. No internet connection
2. Invalid Supabase credentials
3. Row Level Security (RLS) policies blocking update
4. User not authenticated

**Check**: Open browser DevTools → Console and Network tabs for error messages

### Issue: Auth metadata update fails but profile updates
**This is expected behavior** - Profile update is primary, auth metadata is secondary. The app handles this gracefully.

## Architecture Flow

```
User clicks "Save Changes"
  ↓
ProfilePage.handleSaveProfile()
  ↓
profileService.updateUsername(userId, newUsername)
  ↓
├─ Update profiles table (PRIMARY)
│  └─ UPDATE profiles SET username = ? WHERE user_id = ?
│
└─ Update auth metadata (SECONDARY, optional)
   └─ supabase.auth.updateUser({ data: { display_name: ? } })
  ↓
AuthContext.refreshUserState()
  ↓
├─ Fetch fresh profile from database
├─ Create updated User object with new displayName
└─ Update React state (triggers re-render)
  ↓
All components using currentUser.displayName show new name
```

## Success Criteria ✅

- [x] Username updates persist to Supabase `profiles` table
- [x] Username updates are immediately visible in the UI (Profile page)
- [x] Username updates are visible in Dashboard and Header
- [x] Username persists after page reload
- [x] Username persists after logout/login
- [x] Auth metadata is updated (best effort)
- [x] Real Supabase auth is used (tokens verified server-side)
- [x] Unit tests pass
- [x] Manual verification successful

## Next Steps / Recommendations

1. **Add optimistic updates**: Update UI before API call completes for better UX
2. **Add username validation**: Check for duplicates, length, allowed characters
3. **Add rate limiting**: Prevent abuse of username changes
4. **Add audit log**: Track username changes in a separate table
5. **Add integration tests**: Test full flow from UI to database
6. **Add E2E tests**: Use Playwright/Cypress to test in real browser

