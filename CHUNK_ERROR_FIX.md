# ChunkLoadError Fix Guide

## Problem
`ChunkLoadError: Loading chunk src_pages_DashboardPage_tsx failed` - This happens when webpack's chunk cache is stale after adding new components or making changes.

## Solution

### Step 1: Stop the Development Server
Press `Ctrl+C` in the terminal where the dev server is running.

### Step 2: Clear All Caches
```bash
cd frontend
rm -rf node_modules/.cache
rm -rf build
rm -rf .cache
```

### Step 3: Clear Browser Cache
**Option A: Hard Refresh**
- Chrome/Edge: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Safari: `Cmd+Option+R`

**Option B: Clear Browser Cache**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 4: Restart Development Server
```bash
cd frontend
npm start
```

### Step 5: If Still Failing
If the error persists, try:

```bash
cd frontend
# Clear everything
rm -rf node_modules/.cache build .cache
# Reinstall dependencies (if needed)
npm install
# Start fresh
npm start
```

## Why This Happens
- Webpack creates chunks (code splits) for lazy-loaded components
- When new components are added (like `ARSessionView`), webpack needs to rebuild chunks
- Stale browser cache tries to load old chunk files that no longer exist
- Solution: Clear caches and restart dev server

## Prevention
- Always restart dev server after adding new components
- Use hard refresh (Ctrl+Shift+R) when seeing chunk errors
- Clear browser cache if errors persist

