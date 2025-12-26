# Performance Bottlenecks Audit Report

**Generated:** January 2025  
**Auditor:** Web Performance Engineering Analysis  
**Project:** FBLA Virtual Pet Application

---

## Executive Summary

This comprehensive audit identifies performance bottlenecks across the frontend React application and Supabase backend. The analysis covers bundle size, render performance, network requests, and database query optimization.

**Overall Performance Grade: B-**  
**Estimated Improvement Potential: 50-70% faster load times**

**Key Findings:**
- ✅ Already using Vite (excellent!)
- ✅ Routes are lazy loaded (good!)
- ⚠️ N+1 query patterns in chore cooldowns
- ⚠️ Missing memoization in heavy components
- ⚠️ No image lazy loading
- ⚠️ Multiple sequential Supabase queries on auth
- ⚠️ Analytics delayed artificially
- ⚠️ Missing request caching/deduplication

---

## Critical Bottlenecks (P0 - Immediate Action Required)

### 1. N+1 Query Pattern - Chore Cooldowns ⚠️ CRITICAL

| Metric | Issue | Impact | Priority |
|--------|-------|--------|----------|
| **Query Pattern** | Individual `getChoreCooldown()` calls per chore | 1 + N queries instead of 1 | 🔴 Critical |

**Location:** `frontend/src/services/earnService.ts:93-98`

**Current Flow:**
```typescript
// DashboardPage.tsx - N+1 pattern
earnService.listChores().then(async (choresList) => {
  const cooldownPromises = choresList.map(async (chore) => {
    const cd = await earnService.getChoreCooldown(userId, chore.id); // N queries
  });
});
```

**Impact:**
- If 5 chores exist: 6 API calls (1 list + 5 cooldowns)
- Each cooldown query: ~50-100ms
- Total overhead: 250-500ms

**Solution:**
- Batch all cooldowns in single query (already implemented in `getCooldowns()`)
- Return cooldowns with `listChores()` response
- Cache cooldowns in component state

---

### 2. Missing Component Memoization ⚠️ HIGH

| Component | Issue | Impact |
|-----------|-------|--------|
| **PetGameScene** | 1,452 lines, no memoization | 🔴 Critical |
| **DashboardPage** | Heavy component, many re-renders | 🟡 High |
| **Header** | Re-renders on every route change | 🟡 Medium |

**Issues:**
- Inline object/function creation in render
- Missing `useMemo` for expensive computations
- Missing `useCallback` for event handlers
- Child components not memoized

**Recommendations:**
- Wrap heavy components with `React.memo()`
- Memoize expensive computations with `useMemo`
- Use `useCallback` for all event handlers
- Extract constants outside components

---

### 3. Sequential Auth Queries ⚠️ HIGH

| Metric | Issue | Impact |
|--------|-------|--------|
| **API Calls** | 3-4 sequential calls on auth check | 🟡 High |
| **Blocking** | Blocks UI while checking profile/pet | 🟡 High |

**Location:** `frontend/src/contexts/AuthContext.tsx`

**Current Flow:**
1. `getSession()` - Supabase auth check (~100ms)
2. `getProfile()` - Profile service check (~100ms)
3. `getPet()` - Pet service check with retry (up to 3x, ~300ms worst case)
4. Real-time subscription setup (~50ms)

**Total Time:** ~550ms (worst case)

**Recommendations:**
- Batch profile + pet check into single RPC function
- Use stale-while-revalidate pattern
- Cache last known state in sessionStorage
- Parallelize where possible

---

## High Priority Bottlenecks (P1)

### 4. DashboardPage - Artificial Analytics Delay

| Metric | Issue | Impact |
|--------|-------|--------|
| **Delay** | 500ms artificial delay before analytics | 🟡 Medium |

**Location:** `frontend/src/pages/DashboardPage.tsx`

**Current Code:**
```typescript
// Analytics delayed unnecessarily
setTimeout(() => {
  loadAnalytics();
}, 500);
```

**Impact:** Adds 500ms to dashboard load time

**Solution:** Remove artificial delay, load immediately

---

### 5. Missing Image Lazy Loading

| Asset Type | Current State | Recommendation |
|------------|--------------|----------------|
| **SVG Assets** | 28 SVG files, no lazy loading | Add `loading="lazy"` |
| **Pet Sprites** | Emoji-based (efficient) | ✅ Good |
| **3D Models** | Lazy loaded (good!) | ✅ Good |

**Location:** All image components

**Impact:** Off-screen images block initial render

**Solution:** Add `loading="lazy"` to all off-screen images

---

### 6. Missing Request Caching/Deduplication

| Issue | Impact |
|-------|--------|
| Same data fetched multiple times | 🟡 Medium |
| No request deduplication | 🟡 Medium |
| Analytics snapshot fetched every time | 🟡 Medium |

**Examples:**
- `fetchActiveQuests()` called multiple times
- `fetchAccessories()` called on every dashboard visit
- No shared cache between components

**Solution:**
- Implement request deduplication
- Add response caching (5-10 min TTL)
- Use React Query or SWR for caching

---

### 7. Heavy Dependencies - Bundle Size

| Package | Size (estimated) | Usage | Impact |
|---------|-----------------|-------|--------|
| `three` + `@react-three/*` | ~500KB gzipped | 3D Pet visualization | ✅ Lazy loaded |
| `framer-motion` | ~85KB gzipped | Animations | 🟡 Medium |
| `recharts` | ~150KB gzipped | Analytics charts | ✅ Lazy loaded |
| `lucide-react` | ~40KB | Icons | 🟢 Low |

**Current State:**
- ✅ Three.js lazy loaded (good!)
- ✅ Recharts lazy loaded (good!)
- ⚠️ Framer Motion loaded upfront (used everywhere)

**Recommendations:**
- Consider CSS animations for simple effects
- Keep heavy libs lazy loaded

---

## Medium Priority Bottlenecks (P2)

### 8. React Context Nesting - Provider Chain

```jsx
<AuthProvider>
  <ToastProvider>
    <PetProvider>
      <FinancialProvider>
        {/* App content */}
      </FinancialProvider>
    </PetProvider>
  </ToastProvider>
</AuthProvider>
```

**Issues:**
- 4 levels of context nesting
- Each provider update may cascade re-renders
- No context selectors

**Impact:** Medium - Context updates trigger re-renders

**Recommendations:**
- Use Zustand store (already exists!) for global state
- Implement context selectors where possible
- Split contexts by update frequency

---

### 9. Supabase Query Optimization

| Query | Issue | Impact |
|-------|-------|--------|
| Accessories | Two separate queries (list + equipped) | 🟡 Medium |
| Profile + Pet | Separate queries | 🟢 Low |
| Real-time subs | Multiple channels | 🟢 Low |

**Existing Indexes:** ✅ Good - Many indexes already added

**Recommendations:**
- Combine accessories queries (list + equipped in one)
- Use `.select()` with relationships to reduce queries
- Consider Supabase Edge Functions for complex aggregations

---

### 10. Missing Route Preloading

| Issue | Impact |
|-------|--------|
| No route preloading | 🟢 Low |
| Related routes not prefetched | 🟢 Low |

**Current State:**
- Routes are lazy loaded (good!)
- No preloading strategy

**Recommendations:**
- Preload likely next routes (dashboard → shop, etc.)
- Use `<link rel="prefetch">` for critical routes

---

## Low Priority Bottlenecks (P3)

### 11. CSS Performance

| Issue | Impact |
|-------|--------|
| Tailwind JIT compilation | ✅ Optimized |
| Unused CSS purging | ✅ Tailwind handles this |
| Critical CSS inlining | Not implemented |

**Status:** ✅ Good - Tailwind handles optimization

---

### 12. Animation Performance

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

## Performance Metrics Baseline (Estimated)

| Metric | Current (Est.) | Target | Industry Standard |
|--------|---------------|--------|-------------------|
| **FCP** | 2.0-2.5s | < 1.5s | < 1.8s |
| **LCP** | 3.0-3.5s | < 2.0s | < 2.5s |
| **TTI** | 3.5-4.5s | < 3.0s | < 3.8s |
| **TBT** | 200-400ms | < 150ms | < 200ms |
| **CLS** | 0.05-0.1 | < 0.05 | < 0.1 |
| **Bundle Size** | ~800KB-1.2MB | < 600KB | < 400KB |
| **TTFB** | 150-300ms | < 200ms | < 200ms |

---

## Implementation Priority Matrix

| Priority | Task | Effort | Impact | Status |
|----------|------|--------|---------|--------|
| 🔴 P0 | Fix N+1 query pattern | Low | High | ⏳ Pending |
| 🔴 P0 | Add component memoization | Medium | High | ⏳ Pending |
| 🔴 P0 | Optimize auth queries | Medium | High | ⏳ Pending |
| 🟡 P1 | Remove analytics delay | Low | Medium | ⏳ Pending |
| 🟡 P1 | Add image lazy loading | Low | Medium | ⏳ Pending |
| 🟡 P1 | Implement request caching | Medium | High | ⏳ Pending |
| 🟢 P2 | Context optimization | Medium | Medium | ⏳ Pending |
| 🟢 P2 | Route preloading | Low | Low | ⏳ Pending |
| 🟢 P3 | CSS critical path | Low | Low | ⏳ Pending |

---

## Quick Wins (Immediate Implementation)

1. ✅ **Vite already in use** - Excellent!
2. ✅ **Routes lazy loaded** - Good!
3. ⏳ **Fix N+1 query pattern** - Batch cooldowns
4. ⏳ **Remove analytics delay** - Load immediately
5. ⏳ **Add image lazy loading** - All off-screen images
6. ⏳ **Add component memoization** - Heavy components
7. ⏳ **Implement request caching** - 5-10 min TTL

---

## Next Steps

1. ✅ Audit complete - bottlenecks identified
2. 🔄 Begin implementation of optimizations
3. 📊 Measure before/after metrics
4. 📝 Generate final performance report

---

*Report generated by AI Performance Analysis - January 2025*
