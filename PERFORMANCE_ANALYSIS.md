# Performance Analysis & Optimization Plan

## 🔍 Identified Performance Issues

### 1. **No Code Splitting** ⚠️ CRITICAL
**Impact**: All routes and components are loaded upfront, causing:
- Large initial bundle size (~2-3MB+)
- Slow initial page load
- Unnecessary code loaded for unused routes

**Current State**:
- All routes imported directly in `App.tsx`
- Heavy dependencies (three.js, framer-motion, recharts) loaded upfront
- No lazy loading for any components

**Files Affected**:
- `frontend/src/App.tsx` - All route imports are eager

### 2. **Multiple Sequential API Calls on Dashboard** ⚠️ HIGH
**Impact**: Dashboard makes 6+ API calls on mount, some sequential:
- `loadQuests()` - Supabase query
- `loadCoachAdvice()` - Backend API call
- `loadAccessories()` - Backend API call  
- `loadAnalytics()` - Backend API call (heavy aggregation)
- `refreshBalance()` - Supabase query
- `earnService.listChores()` - Backend API call
- Multiple `getChoreCooldown()` calls - N+1 query pattern

**Current State**:
```typescript
// DashboardPage.tsx line 286-320
useEffect(() => {
  if (currentUser && pet) {
    loadQuests();           // Call 1
    loadCoachAdvice();      // Call 2
    loadAccessories();      // Call 3
    loadAnalytics();        // Call 4 (heavy)
    refreshBalance();       // Call 5
    
    // N+1 query pattern
    earnService.listChores().then(async (choresList) => {
      const cooldownPromises = choresList.map(async (chore) => {
        const cd = await earnService.getChoreCooldown(...); // N queries
      });
    });
  }
}, [currentUser, pet, ...]);
```

**Estimated Load Time**: 2-5 seconds for all calls to complete

### 3. **N+1 Query Pattern for Chore Cooldowns** ⚠️ HIGH
**Impact**: If there are 5 chores, this makes 6 API calls (1 for list + 5 for cooldowns)

**Current State**:
- `earnService.listChores()` - 1 call
- Then loops through each chore calling `getChoreCooldown()` - N calls

**Solution**: Backend should return cooldowns with the chore list, or batch the cooldown requests

### 4. **Heavy Dependencies Loaded Upfront** ⚠️ MEDIUM
**Impact**: Large JavaScript bundles loaded before first paint

**Dependencies**:
- `three.js` (~600KB) - Only needed for 3D pet view
- `@react-three/fiber` + `@react-three/drei` (~200KB) - Only for 3D
- `framer-motion` (~150KB) - Used for animations
- `recharts` (~200KB) - Only for analytics charts
- `react-router-dom` - All routes loaded

**Total Estimated Bundle**: ~2-3MB before gzip

### 5. **No Request Batching or Caching** ⚠️ MEDIUM
**Impact**: Same data fetched multiple times, no coordination between requests

**Issues**:
- No request deduplication
- No shared cache between components
- Analytics snapshot fetched every time (could be cached)
- No request prioritization (critical vs. nice-to-have)

### 6. **Context Provider Re-renders** ⚠️ LOW-MEDIUM
**Impact**: Multiple context providers might cause unnecessary re-renders

**Context Chain**:
```
AuthProvider → ToastProvider → PetProvider → FinancialProvider
```

Each context update can trigger re-renders down the tree.

## 📊 Performance Metrics (Estimated)

### Current State:
- **Initial Bundle Size**: ~2-3MB (uncompressed)
- **Time to Interactive (TTI)**: 3-5 seconds
- **First Contentful Paint (FCP)**: 1-2 seconds
- **Dashboard Load Time**: 2-5 seconds (API calls)

### Target State:
- **Initial Bundle Size**: ~500KB-800KB (uncompressed)
- **Time to Interactive (TTI)**: <2 seconds
- **First Contentful Paint (FCP)**: <1 second
- **Dashboard Load Time**: <1.5 seconds (API calls)

## 🚀 Optimization Plan

### Phase 1: Code Splitting (High Impact)
1. Implement React.lazy() for all routes
2. Add Suspense boundaries with loading states
3. Lazy load heavy components (3D visualization, charts)

### Phase 2: API Optimization (High Impact)
1. Batch dashboard API calls using Promise.all()
2. Fix N+1 query pattern for chore cooldowns
3. Add request deduplication
4. Implement request prioritization (critical first)

### Phase 3: Bundle Optimization (Medium Impact)
1. Analyze bundle with webpack-bundle-analyzer
2. Tree-shake unused dependencies
3. Consider dynamic imports for heavy libraries

### Phase 4: Caching & Memoization (Medium Impact)
1. Add React.memo() to expensive components
2. Implement request caching for analytics
3. Use useMemo/useCallback more strategically

## 📝 Implementation Priority

1. **Immediate** (Do First):
   - Code splitting for routes
   - Batch dashboard API calls
   - Fix N+1 query pattern

2. **Short-term** (This Week):
   - Lazy load heavy components
   - Add request caching
   - Optimize bundle size

3. **Long-term** (Next Sprint):
   - Advanced caching strategies
   - Service worker for offline support
   - Progressive loading

