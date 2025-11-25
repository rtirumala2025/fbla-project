# OAuth Fix - Simple Manual Steps

## Step-by-Step Instructions

### Step 1: Clear Your Browser
1. Open your browser
2. Clear all browsing data:
   - Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
   - Select "All time" or "Everything"
   - Check: Cookies, Cached images, Site data
   - Click "Clear data"
3. Close all browser tabs
4. (Optional but recommended) Use Incognito/Private mode for testing

### Step 2: Check Environment Variables
1. Open the file: `frontend/.env`
2. Make sure these lines are present:
   ```
   REACT_APP_USE_MOCK=false
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Replace `your-project.supabase.co` with your actual Supabase URL
4. Replace `your-anon-key-here` with your actual Supabase anon key

### Step 3: Start the Development Server
1. Open terminal/command prompt
2. Go to the frontend folder:
   ```
   cd frontend
   ```
3. Start the server:
   ```
   npm start
   ```
4. Wait until you see "Compiled successfully!" or the browser opens automatically

### Step 4: Open Browser Console
1. In your browser, open Developer Tools:
   - Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Or right-click → "Inspect" → Click "Console" tab
2. Keep the console open - you'll see logs here

### Step 5: Go to Login Page
1. Navigate to: `http://localhost:3000/login`
2. You should see the login page with a "Continue with Google" button

### Step 6: Click "Sign in with Google"
1. Click the "Continue with Google" button
2. You should be redirected to Google's sign-in page

### Step 7: Sign in with Google
1. Select your Google account
2. Click "Continue" or "Allow" when asked for permissions
3. Wait to be redirected back to your app

### Step 8: Check Console Logs
Look for these messages in the console (in order):

✅ **Good signs:**
- "Hash detected with access_token - attempting manual session creation..."
- "Step 1: Access token extracted from hash"
- "Step 3: Session set successfully via setSession()"
- "Step 6: Full session retrieved successfully"
- "Processing successful authentication"

❌ **Bad signs:**
- "Error setting session"
- "Session not found after all attempts"
- "Authentication failed"

### Step 9: Check Where You Land
After signing in, you should be redirected to one of these pages:

1. **`/dashboard`** - You're logged in! ✅
2. **`/setup-profile`** - New user, needs to set up profile ✅
3. **`/pet-selection`** - Needs to select a pet ✅
4. **`/login`** - Something went wrong ❌

### Step 10: Verify You're Logged In
1. Check if you see your email/name in the header
2. Try navigating to different pages - they should work
3. Refresh the page - you should stay logged in

---

## If It Still Doesn't Work

### Quick Troubleshooting

1. **Check Console Errors**
   - Look for red error messages
   - Copy the error message
   - Check if it mentions "setSession" or "getSession"

2. **Check Network Tab**
   - In Developer Tools, click "Network" tab
   - Try signing in again
   - Look for any failed requests (red)
   - Check if there's a request to `/auth/v1/token` that failed

3. **Verify Supabase Settings**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Go to: Authentication → Providers → Google
   - Make sure it's "Enabled"
   - Go to: Authentication → URL Configuration
   - Make sure these URLs are added:
     - `http://localhost:3000`
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**`

4. **Try Different Browser**
   - Sometimes browser extensions block OAuth
   - Try Chrome, Firefox, or Edge
   - Use Incognito/Private mode

5. **Check Environment Variables Again**
   - Make sure `.env` file has no extra spaces
   - Make sure values are not in quotes
   - Restart the dev server after changing `.env`

---

## What Should Happen (Expected Flow)

```
1. Click "Sign in with Google"
   ↓
2. Redirected to Google sign-in page
   ↓
3. Sign in with Google account
   ↓
4. Redirected back to: http://localhost:3000/auth/callback#access_token=...
   ↓
5. App extracts tokens from URL
   ↓
6. App creates session
   ↓
7. Redirected to: /dashboard or /setup-profile
   ↓
8. You're logged in! ✅
```

---

## Common Issues & Solutions

**Issue:** Stuck on login page after signing in
- **Solution:** Check console for errors, verify Supabase redirect URLs

**Issue:** "redirect_uri_mismatch" error
- **Solution:** Check Supabase dashboard URL configuration

**Issue:** Console shows "Session not found"
- **Solution:** Check Network tab for failed requests, verify environment variables

**Issue:** Browser keeps redirecting in a loop
- **Solution:** Clear browser cache completely, try incognito mode

---

## Quick Checklist

Before testing, make sure:
- [ ] Browser cache cleared
- [ ] `.env` file has correct Supabase URL and key
- [ ] Dev server is running (`npm start`)
- [ ] Browser console is open (F12)
- [ ] Supabase dashboard has correct redirect URLs
- [ ] Google OAuth is enabled in Supabase dashboard

After testing:
- [ ] Console shows success messages
- [ ] Redirected to dashboard/setup-profile (not login)
- [ ] Can navigate to different pages
- [ ] Still logged in after page refresh

