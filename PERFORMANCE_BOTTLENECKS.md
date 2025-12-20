# Performance Bottlenecks Audit Report

**Generated:** December 19, 2025  
**Auditor:** Web Performance Engineering Analysis  
**Project:** FBLA Virtual Pet Application

---

## Executive Summary

This audit identifies performance bottlenecks across the frontend React application and Supabase backend. The analysis covers bundle size, render performance, network requests, and database query optimization.

**Overall Performance Grade: C+**  
**Estimated Improvement Potential: 40-60% faster load times**

---

## Critical Bottlenecks (P0 - Immediate Action Required)

### 1. Build System: Create React App (CRA) vs Vite

| Metric | Issue | Impact | Priority |
|--------|-------|--------|----------|
| **Build Tool** | Using react-scripts (CRA) | Slow builds, larger bundles, no tree-shaking optimization | 🔴 Critical |

**Details:**
- CRA uses Webpack 5 with limited optimization options
- Development server startup: ~15-30 seconds
- Production builds: ~2-4 minutes
- Bundle splitting is suboptimal

**Recommendation:** Migrate to Vite for:
- 10-100x faster dev server startup (native ES modules)
- Better tree-shaking and dead code elimination
- Improved code splitting with rollup
- Smaller production bundles

---

### 2. Heavy Dependencies - Bundle Size Impact

| Package | Size (estimated) | Usage | Impact |
|---------|-----------------|-------|--------|
| `three` + `@react-three/*` | ~500KB gzipped | 3D Pet visualization | 🔴 Critical |
| `framer-motion` | ~85KB gzipped | Animations everywhere | 🟡 Medium |
| `recharts` | ~150KB gzipped | Analytics charts | 🟡 Medium |
| `react-icons` + `lucide-react` | ~40KB | Duplicate icon libs | 🟡 Medium |
| `react-hot-toast` + `react-toastify` | ~20KB | Duplicate toast libs | 🟢 Low |
| `react-joyride` | ~35KB gzipped | Onboarding tours | 🟢 Low |

**Total Estimated Bundle Overhead:** ~830KB+ (before tree-shaking)

**Recommendations:**
- ✅ Already lazy-loading 3D visualization - good!
- Remove `react-icons` (use only `lucide-react`)
- Remove `react-toastify` (use only `react-hot-toast`)
- Dynamic import `recharts` only on analytics pages
- Consider lighter animation alternatives for simple use cases

---

### 3. PetGameScene.tsx - 1,452 Lines Single Component

| Metric | Value | Impact |
|--------|-------|--------|
| File Size | 1,452 lines | 🔴 Critical |
| Re-render Risk | High | 🔴 Critical |
| Code Splitting | Partially split | 🟡 Medium |

**Issues:**
- Monolithic component with many responsibilities
- Multiple `useState` hooks causing cascading re-renders
- Inline object creation in render causing unnecessary re-renders
- Animation controls not properly memoized

**Recommendations:**
- Split into smaller sub-components
- Extract constants outside component
- Memoize all child components
- Use `useCallback` for all event handlers
- Consider state management refactor (Zustand already available)

---

## High Priority Bottlenecks (P1)

### 4. AuthContext - Multiple API Calls on Mount

| Metric | Issue | Impact |
|--------|-------|--------|
| **API Calls** | 3-4 sequential calls on auth check | 🟡 High |
| **Blocking** | Blocks UI while checking profile/pet | 🟡 High |

**Current Flow:**
1. `getSession()` - Supabase auth check
2. `getProfile()` - Profile service check
3. `getPet()` - Pet service check (with retry logic up to 3x)
4. Real-time subscription setup

**Recommendations:**
- Batch profile + pet check into single API call
- Use stale-while-revalidate pattern for faster perceived load
- Cache last known state in sessionStorage

---

### 5. DashboardPage - Waterfall API Requests

| Metric | Issue | Impact |
|--------|-------|--------|
| **Parallel Calls** | 5+ calls (good!) | ✅ Optimized |
| **Analytics Delay** | 500ms artificial delay | 🟡 Medium |
| **N+1 Query** | Chore cooldowns fetch individually | 🟡 Medium |

**Current Flow (Good):**
```javascript
Promise.allSettled([
  fetchActiveQuests(),
  fetchCoachAdvice(), 
  fetchAccessories(),
  refreshBalance(),
  earnService.listChores()
]);
```

**Issues:**
- Analytics delayed by 500ms (unnecessary if network is fast)
- Chore cooldowns loaded in N+1 pattern (one query per chore)
- Equipped accessories require second Supabase query

**Recommendations:**
- Remove artificial analytics delay
- Batch cooldown queries into single Supabase call
- Include equipped accessories in main accessories fetch

---

### 6. Header Component - Re-renders on Every Route Change

| Metric | Issue | Impact |
|--------|-------|--------|
| **Re-renders** | Every location.pathname change | 🟡 Medium |
| **Mobile Menu** | AnimatePresence causes layout shifts | 🟢 Low |

**Issues:**
- Header re-renders completely on route changes
- `useLocation()` hook triggers re-renders
- Multiple `useEffect` with scroll listeners

**Recommendations:**
- ✅ Already using `memo()` - good!
- Consider extracting nav links to separate memoized component
- Debounce scroll handler

---

## Medium Priority Bottlenecks (P2)

### 7. React Context Nesting - Provider Hell

```jsx
<AuthProvider>
  <ToastProvider>
    <PetProvider>
      <FinancialProvider>
        <OnboardingTutorial />
        <TooltipGuide />
        {/* App content */}
      </FinancialProvider>
    </PetProvider>
  </ToastProvider>
</AuthProvider>
```

**Issues:**
- 4 levels of context nesting
- Each provider update may cascade re-renders
- No context selectors (all consumers re-render on any state change)

**Recommendations:**
- Use Zustand store (already exists!) for global state
- Implement context selectors where possible
- Consider React Compiler (React 19) for automatic memoization

---

### 8. Image/Asset Loading

| Asset Type | Current State | Recommendation |
|------------|--------------|----------------|
| Pet Sprites | Emoji-based (efficient) | ✅ Good |
| Icons | Two libraries loaded | Remove duplicate |
| Fonts | System fonts | ✅ Good |
| Images | No lazy loading | Add `loading="lazy"` |

---

### 9. Supabase Query Optimization

| Query | Issue | Impact |
|-------|-------|--------|
| Profile lookup | Individual query | 🟢 Low |
| Pet check | Retry logic (up to 3x) | 🟡 Medium |
| Accessories | Two separate queries | 🟡 Medium |
| Real-time subs | Multiple channels | 🟢 Low |

**Existing Indexes (Good):**
- `019_performance_indexes.sql` - Many indexes already added

**Recommendations:**
- Combine profile + pet into single RPC function
- Use `.select()` with relationships to reduce queries
- Consider Supabase Edge Functions for complex aggregations

---

## Low Priority Bottlenecks (P3)

### 10. CSS Performance

| Issue | Impact |
|-------|--------|
| Tailwind JIT compilation | ✅ Optimized |
| Unused CSS purging | 🟢 Low - Tailwind handles this |
| Critical CSS inlining | Not implemented |

---

### 11. Animation Performance

| Component | Animation Library | Issue |
|-----------|------------------|-------|
| PageTransition | Framer Motion | Smooth but adds bundle size |
| PetGameScene | Framer Motion | Many concurrent animations |
| Header Mobile Menu | Framer Motion | AnimatePresence overhead |

**Recommendations:**
- Use CSS animations for simple effects
- Enable `layout` prop optimization
- Use `will-change` for predictable animations

---

## Quick Wins (Immediate Implementation)

1. **Remove duplicate packages:** `react-icons`, `react-toastify`
2. **Add preload hints:** Critical fonts, Supabase connection
3. **Implement route preloading:** Prefetch likely next routes
4. **Add image lazy loading:** All off-screen images
5. **Optimize dev experience:** Enable Vite for faster iteration

---

## Performance Metrics Baseline (Estimated)

| Metric | Current (Est.) | Target | Industry Standard |
|--------|---------------|--------|-------------------|
| **FCP** | 2.5-3.5s | < 1.8s | < 1.8s |
| **LCP** | 3.5-4.5s | < 2.5s | < 2.5s |
| **TTI** | 4-6s | < 3.8s | < 3.8s |
| **TBT** | 300-500ms | < 200ms | < 200ms |
| **CLS** | 0.1-0.2 | < 0.1 | < 0.1 |
| **Bundle Size** | ~1.5MB | < 500KB | < 400KB |

---

## Implementation Priority Matrix

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 🔴 P0 | Migrate to Vite | High | Very High |
| 🔴 P0 | Remove duplicate deps | Low | Medium |
| 🟡 P1 | Add route preloading | Low | Medium |
| 🟡 P1 | Optimize DashboardPage | Medium | High |
| 🟡 P1 | Split PetGameScene | High | High |
| 🟢 P2 | Context optimization | Medium | Medium |
| 🟢 P2 | Image lazy loading | Low | Low |
| 🟢 P3 | CSS critical path | Low | Low |

---

## Next Steps

1. ✅ Audit complete - bottlenecks identified
2. 🔄 Begin implementation of optimizations
3. 📊 Measure before/after metrics
4. 📝 Generate final performance report

---

*Report generated by AI Performance Analysis*
