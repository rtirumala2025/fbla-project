# Performance Bottlenecks Report

**Generated:** 2026-01-16  
**Project:** FBLA Virtual Pet App  
**Tech Stack:** React 18, TypeScript, Vite, Supabase, Three.js/@react-three/fiber

---

## Executive Summary

The codebase has **several good practices already in place**:
- ✅ Route-level code splitting via `pageRegistry.ts` (35+ lazy-loaded pages)
- ✅ Vite vendor chunking (react, three.js, supabase, framer-motion separated)
- ✅ CSS code splitting enabled
- ✅ esbuild minification for fast builds
- ✅ Resource hints (preconnect, dns-prefetch) in index.html
- ✅ Initial loader for perceived performance
- ✅ Small SVG assets (< 4KB each)

**Critical issues requiring attention:**
1. TypeScript build error blocking production builds
2. Large page components (DashboardPage: 926 lines, 38KB)
3. 3D components loaded synchronously in some flows
4. API calls not batched optimally
5. Missing React Query/SWR for data caching

---

## Bottleneck Details

### 🔴 Critical Priority

| Component/File | Issue | Load Time Impact | Suggested Action |
|---------------|-------|------------------|------------------|
| `Shop.tsx:137` | TypeScript error blocking builds | **Build fails** | Fix `PurchaseRequestPayload` type - use `entries` instead of `items` |
| `DashboardPage.tsx` | 926 lines, 38KB, multiple API calls on mount | +500-800ms | Split into smaller components, batch API calls |
| Three.js bundle | ~500KB vendor chunk (three + r3f + drei) | +300-500ms | Already lazy-loaded, verify Suspense boundaries |

### 🟠 High Priority

| Component/File | Issue | Load Time Impact | Suggested Action |
|---------------|-------|------------------|------------------|
| `AuthContext.tsx` | 740 lines, complex auth logic | +100-200ms | Split provider logic, memoize handlers |
| `PetGame2Screen.tsx` | 702 lines, 25KB | +200-300ms | Extract sub-components, memoize expensive renders |
| `GiftShopWindow.tsx` | 40KB single component | +150-250ms | Consider code splitting |
| `AgilityGameWindow.tsx` | 48KB single component | +200-300ms | Lazy load game logic |
| `SupermarketWindow.tsx` | 39KB single component | +150-250ms | Consider code splitting |
| `VetGameWindow.tsx` | 37KB single component | +150-200ms | Consider code splitting |

### 🟡 Medium Priority

| Component/File | Issue | Load Time Impact | Suggested Action |
|---------------|-------|------------------|------------------|
| `AuthCallback.tsx` | 38KB, OAuth handling | +100-150ms | Simplify, move logic to service |
| `PetNaming.tsx` | 25KB | +50-100ms | Extract validation logic |
| API calls in DashboardPage | 5+ separate API calls on mount | +200-400ms | Batch into single endpoint or parallelize better |
| No SWR/React Query | API responses not cached client-side | Re-fetch on every navigation | Add data caching layer |

### 🟢 Low Priority  

| Component/File | Issue | Load Time Impact | Suggested Action |
|---------------|-------|------------------|------------------|
| Console logging | Logger calls in production | +10-30ms | Already configured to drop in production |
| SVG assets | Multiple small files | Minimal | Consider SVG sprite or inline critical icons |
| Prefetch hints | Static paths may not work with Vite | Minimal | Update to use modulepreload hints |

---

## Bundle Analysis

**Current Vite Configuration (Good Practices):**
```javascript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
  'vendor-animation': ['framer-motion'],
  'vendor-charts': ['recharts'],
  'vendor-supabase': ['@supabase/supabase-js'],
  'vendor-state': ['zustand'],
  'vendor-ui': ['lucide-react', 'react-hot-toast', 'classnames', 'dayjs'],
}
```

**Estimated Bundle Sizes (based on dependencies):**
- vendor-react: ~140KB (gzipped: ~45KB)
- vendor-three: ~600KB (gzipped: ~180KB) - **Largest**
- vendor-animation: ~100KB (gzipped: ~35KB)
- vendor-charts: ~300KB (gzipped: ~90KB)
- vendor-supabase: ~80KB (gzipped: ~25KB)
- Main app chunk: ~200-300KB (gzipped: ~60-90KB)

---

## API Call Analysis

**DashboardPage loads on mount:**
1. Finance summary
2. Shop catalog
3. Coach advice
4. Quest data
5. Accessories data
6. Pet stats (via context)

**Recommendation:** Create a `/api/dashboard/init` endpoint that returns all required data in one call.

---

## 3D Rendering Analysis

**Current State:**
- Three.js components in `game3d/` directory
- Pet models: DogModel, CatModel, PandaModel
- Room views: HouseShell, RoomStage, PetViewer3D
- Already using Suspense for loading states

**Optimizations Needed:**
1. Use `React.memo` on 3D components
2. Implement `useFrame` throttling for non-critical animations
3. Consider LOD (Level of Detail) for distant objects
4. Dispose of Three.js resources on unmount

---

## Recommended Implementation Order

1. **Fix TypeScript error** (blocks all other work)
2. **Add Suspense boundaries** around heavy components
3. **Implement API response caching** with SWR or React Query
4. **Split DashboardPage** into smaller, memoized components
5. **Lazy load game windows** (GiftShop, Supermarket, VetGame, Agility)
6. **Add virtualization** for long lists (inventory, shop items)
7. **Optimize Three.js rendering** with proper memoization and cleanup

---

## Metrics to Track

| Metric | Current (Estimate) | Target |
|--------|-------------------|--------|
| LCP (Largest Contentful Paint) | ~2.5-3s | < 1.5s |
| FID (First Input Delay) | ~100-200ms | < 100ms |
| CLS (Cumulative Layout Shift) | ~0.1-0.2 | < 0.1 |
| TTI (Time to Interactive) | ~3-4s | < 2s |
| Bundle Size (gzipped) | ~500KB | < 350KB (initial) |
| TTFB | ~200-400ms | < 200ms |
