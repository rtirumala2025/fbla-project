# Dashboard & Hero Components - Integration Analysis Report

**Date:** Generated Analysis  
**Components Analyzed:** `Dashboard.tsx`, `DashboardPage.tsx`, `Hero.tsx`  
**Purpose:** Identify placeholder/hardcoded data and map UI elements to live backend APIs/contexts

---

## Executive Summary

This report identifies **all placeholder and hardcoded data** in the Dashboard and Hero components, maps each UI element to its required data source (backend API or React context), and documents missing integrations with `PetContext` and `FinancialContext`.

### Critical Findings

- **Dashboard.tsx**: 100% hardcoded demo data (intentional demo mode)
- **DashboardPage.tsx**: Uses local state instead of `PetContext` - **CRITICAL MISSING INTEGRATION**
- **Hero.tsx**: 100% static placeholder data - no live data connections
- **FinancialContext**: Uses `localStorage` instead of backend API - **CRITICAL ISSUE**

---

## 1. Dashboard.tsx Analysis

**File:** `frontend/src/pages/Dashboard.tsx`  
**Status:** Demo/Static Component  
**Purpose:** Intentional demo mode with hardcoded sample data

### Hardcoded Data Identified

| UI Element | Hardcoded Value | Should Connect To |
|------------|----------------|-------------------|
| **Featured Pet Card** | | |
| Pet Name | `"Nova the Arctic Fox"` | `PetContext.pet.name` |
| Pet Level | `7` | `PetContext.pet.level` |
| Happiness | `92` | `PetContext.pet.stats.happiness` |
| Energy | `76` | `PetContext.pet.stats.energy` |
| Progress Bar | `w-3/4` (75% hardcoded) | `PetContext.pet.stats` (calculate from XP/level) |
| Tip Message | `"Tip: feed Nova before..."` | Dynamic tip based on `PetContext.pet.stats` |
| **Wallet Snapshot Card** | | |
| Balance | `$1,250` | `FinancialContext.balance` OR `getFinanceSummary().summary.balance` |
| Description | `"Savings for virtual pet care..."` | Static (OK) |
| Weekly Allowance | `$80` | `getFinanceSummary().summary.income_today` (or weekly calculation) |
| Emergency Fund Goal | `65% complete` | `getFinanceSummary().summary.goals[].progress_percent` |
| Last Transaction | `"Pet spa day (-$25)"` | `getFinanceSummary().summary.transactions[0]` |
| **Mini-games Card** | | |
| Learning Streak | `12 days` | `getRewardsSummary(gameType).streak_days` OR aggregate across all games |
| Description | `"Students completed 4 mini-games..."` | Calculate from `GameSession` records |
| Budget Blitz Accuracy | `92%` | `getGameLeaderboard('puzzle')` or user's recent scores |
| Care Quest Completed | `3 quests completed` | Quest/achievement API (if exists) |
| Reaction Run High Score | `4,320` | `getGameLeaderboard('reaction')` - user's `best_score` |

### Integration Requirements

**Required Contexts:**
- ❌ `PetContext` - **NOT USED** (should be integrated)
- ❌ `FinancialContext` - **NOT USED** (should be integrated)

**Required API Calls:**
- `getFinanceSummary()` from `frontend/src/api/finance.ts`
- `getRewardsSummary(gameType)` from `frontend/src/api/games.ts` (for each game type)
- `getGameLeaderboard(gameType)` from `frontend/src/api/games.ts` (for user's best scores)

**Backend Endpoints:**
- `GET /api/finance` - Returns `FinanceResponse` with full financial summary
- `GET /api/games/rewards?game_type={type}` - Returns `GameRewardsResponse` with streak data
- `GET /api/games/leaderboard?game_type={type}` - Returns user's leaderboard position

---

## 2. DashboardPage.tsx Analysis

**File:** `frontend/src/pages/DashboardPage.tsx`  
**Status:** ⚠️ **CRITICAL - Uses Local State Instead of Context**  
**Purpose:** Main dashboard with pet display, stats, and actions

### Hardcoded Data Identified

| UI Element | Hardcoded Value | Current Source | Should Connect To |
|------------|----------------|----------------|-------------------|
| **Pet Display** | | | |
| Pet Name | `"Luna"` | `useState` (line 106) | `PetContext.pet.name` |
| Pet Species | `"dog"` | `useState` (line 107) | `PetContext.pet.species` |
| Pet Emoji | `🐶` (derived from species) | Static mapping | `PetContext.pet.species` |
| **Pet Stats** | | | |
| Health | `100` | `useState` (line 109) | `PetContext.pet.stats.health` |
| Hunger | `70` | `useState` (line 110) | `PetContext.pet.stats.hunger` |
| Happiness | `80` | `useState` (line 111) | `PetContext.pet.stats.happiness` |
| Cleanliness | `90` | `useState` (line 112) | `PetContext.pet.stats.cleanliness` |
| Energy | `85` | `useState` (line 113) | `PetContext.pet.stats.energy` |
| **Pet Actions** | | | |
| Feed Action | Updates local state | `handleAction()` (line 135) | `PetContext.feed()` |
| Play Action | Updates local state | `handleAction()` (line 135) | `PetContext.play()` |
| Clean Action | Updates local state | `handleAction()` (line 135) | `PetContext.bathe()` |
| Heal Action | Updates local state | `handleAction()` (line 135) | `PetContext.updatePetStats()` |

### Critical Issues

1. **❌ NOT USING PetContext**
   - Component uses local `useState` instead of `usePet()` hook
   - Pet data is hardcoded and not persisted
   - Actions update local state only, not database

2. **❌ NO FinancialContext Integration**
   - No wallet/balance display
   - No transaction history
   - No financial data shown

3. **❌ Actions Don't Persist**
   - `handleAction()` updates local state only
   - Changes are lost on page refresh
   - No API calls to backend

### Integration Requirements

**Required Contexts:**
- ✅ `AuthContext` - **USED** (line 102) - ✅ Correct
- ❌ `PetContext` - **NOT USED** - **MUST ADD**
- ❌ `FinancialContext` - **NOT USED** - **SHOULD ADD** (for wallet display)

**Required Changes:**
```typescript
// CURRENT (WRONG):
const [pet, setPet] = useState<PetData>({...hardcoded...});

// SHOULD BE:
const { pet, loading, error, feed, play, bathe, updatePetStats } = usePet();
```

**Action Mapping:**
- `feed` → `PetContext.feed()` (line 141)
- `play` → `PetContext.play()` (line 143)
- `clean` → `PetContext.bathe()` (line 147)
- `heal` → `PetContext.updatePetStats({ health: ... })` (line 150)

**Backend Integration:**
- Pet data loaded via `PetContext` → Supabase `pets` table (already implemented)
- Actions persist via `PetContext` methods → Supabase updates (already implemented)

---

## 3. Hero.tsx Analysis

**File:** `frontend/src/components/Hero.tsx`  
**Status:** 100% Static Placeholder  
**Purpose:** Landing page hero section with pet preview

### Hardcoded Data Identified

| UI Element | Hardcoded Value | Should Connect To |
|------------|----------------|-------------------|
| **Pet Display** | | |
| Pet Emoji | `🐕` (line 89) | `PetContext.pet.species` → emoji mapping |
| **Stats Grid** | | |
| Health Bar | `85%` (line 105) | `PetContext.pet.stats.health` |
| Energy Bar | `70%` (line 105) | `PetContext.pet.stats.energy` |
| Happy Bar | `95%` (line 105) | `PetContext.pet.stats.happiness` |
| Clean Bar | `60%` (line 105) | `PetContext.pet.stats.cleanliness` |
| Strong Bar | `75%` (line 105) | `PetContext.pet.stats.energy` (or calculated) |
| Stat Labels | `['Health', 'Energy', 'Happy', 'Clean', 'Strong']` | Static (OK) |
| Stat Icons | `['❤️', '⚡', '🎨', '🧼', '💪']` | Static (OK) |

### Integration Requirements

**Required Contexts:**
- ❌ `PetContext` - **NOT USED** - **SHOULD ADD** (if user is logged in)
- ❌ `AuthContext` - **NOT USED** - **SHOULD ADD** (to conditionally show pet data)

**Integration Strategy:**
- If user is **not logged in**: Show static placeholder (current behavior) ✅
- If user **is logged in**: Show their actual pet data from `PetContext`

**Required Changes:**
```typescript
// Add conditional rendering:
const { currentUser } = useAuth();
const { pet } = usePet();

// If logged in, use real pet data:
const stats = pet ? [
  pet.stats.health,
  pet.stats.energy,
  pet.stats.happiness,
  pet.stats.cleanliness,
  pet.stats.energy, // or calculate "strength"
] : [85, 70, 95, 60, 75]; // fallback to placeholder
```

**Backend Integration:**
- Pet data via `PetContext` → Supabase `pets` table
- No additional API calls needed (context handles it)

---

## 4. Context Integration Status

### PetContext.tsx

**Status:** ✅ **FULLY IMPLEMENTED**  
**Data Source:** Supabase `pets` table (direct queries)  
**API Layer:** Direct Supabase client (no backend API)

**Available Data:**
- `pet: Pet | null` - Full pet object with stats
- `pet.stats.health` - Health stat (0-100)
- `pet.stats.hunger` - Hunger stat (0-100)
- `pet.stats.happiness` - Happiness stat (0-100)
- `pet.stats.cleanliness` - Cleanliness stat (0-100)
- `pet.stats.energy` - Energy stat (0-100)
- `pet.level` - Pet level
- `pet.experience` - XP points
- `pet.name` - Pet name
- `pet.species` - Pet species

**Available Actions:**
- `feed()` - Increases hunger, energy
- `play()` - Increases happiness, decreases energy
- `bathe()` - Sets cleanliness to 100
- `rest()` - Sets energy to 100
- `updatePetStats(updates)` - Custom stat updates

**Integration Status:**
- ✅ `DashboardPage.tsx` - ❌ **NOT INTEGRATED** (uses local state)
- ❌ `Dashboard.tsx` - Not integrated (demo mode, intentional)
- ❌ `Hero.tsx` - Not integrated (static placeholder)

---

### FinancialContext.tsx

**Status:** ⚠️ **CRITICAL ISSUE - Uses localStorage Instead of Backend API**  
**Data Source:** `localStorage` (should use `/api/finance`)  
**API Layer:** ❌ **MISSING** - Should use `getFinanceSummary()` from `api/finance.ts`

**Current Implementation:**
- Uses `localStorage.getItem('financial_data')` (line 38)
- Default balance: `1000` (hardcoded fallback)
- No backend API integration

**Available Data (Current):**
- `balance: number` - Wallet balance (from localStorage)
- `transactions: Transaction[]` - Transaction history (from localStorage)

**Should Provide (via Backend API):**
- `balance` - From `FinanceSummary.balance`
- `transactions` - From `FinanceSummary.transactions`
- `goals` - From `FinanceSummary.goals`
- `income_today` - From `FinanceSummary.income_today`
- `expenses_today` - From `FinanceSummary.expenses_today`
- `daily_allowance_available` - From `FinanceSummary.daily_allowance_available`
- `recommendations` - From `FinanceSummary.recommendations`
- `notifications` - From `FinanceSummary.notifications`

**Backend API Available:**
- `GET /api/finance` → Returns `FinanceResponse` with full `FinanceSummary`
- Endpoint: `frontend/src/api/finance.ts::getFinanceSummary()`

**Integration Status:**
- ❌ `DashboardPage.tsx` - Not integrated
- ❌ `Dashboard.tsx` - Not integrated (uses hardcoded values)
- ❌ `Hero.tsx` - Not integrated (no financial data shown)

**Required Fix:**
```typescript
// CURRENT (WRONG):
const data = getStoredFinancialData(user.uid); // localStorage

// SHOULD BE:
const response = await getFinanceSummary(); // Backend API
const data = response.summary;
```

---

## 5. Backend API Endpoints Reference

### Finance API

**Base URL:** `/api/finance`  
**Client:** `frontend/src/api/finance.ts`

| Endpoint | Method | Returns | Used For |
|----------|--------|---------|----------|
| `/api/finance` | GET | `FinanceResponse` | Wallet balance, transactions, goals, recommendations |
| `/api/finance/earn` | POST | `FinanceResponse` | Earning coins (mini-games, tasks) |
| `/api/finance/purchase` | POST | `FinanceResponse` | Purchasing shop items |
| `/api/finance/daily-allowance` | POST | `FinanceResponse` | Claiming daily allowance |
| `/api/finance/goals` | GET/POST | `FinanceResponse` | Financial goals management |
| `/api/finance/leaderboard` | GET | `LeaderboardEntry[]` | Finance leaderboard |

**FinanceResponse Structure:**
```typescript
{
  summary: {
    balance: number;              // Wallet balance
    transactions: TransactionRecord[];  // Recent transactions
    goals: GoalSummary[];         // Financial goals
    income_today: number;         // Today's income
    expenses_today: number;       // Today's expenses
    daily_allowance_available: boolean;
    allowance_amount: number;
    recommendations: string[];
    notifications: string[];
    // ... more fields
  }
}
```

---

### Games API

**Base URL:** `/api/games`  
**Client:** `frontend/src/api/games.ts`

| Endpoint | Method | Returns | Used For |
|----------|--------|---------|----------|
| `/api/games/rewards?game_type={type}` | GET | `GameRewardsResponse` | Streak days, daily streak, leaderboard rank |
| `/api/games/leaderboard?game_type={type}` | GET | `GameLeaderboardResponse` | User's best scores, rankings |
| `/api/games/start` | POST | `GameStartResponse` | Starting a game session |
| `/api/games/submit-score` | POST | `GamePlayResponse` | Submitting game scores |

**GameRewardsResponse Structure:**
```typescript
{
  streak_days: number;           // Current streak
  daily_streak: number;         // Daily streak counter
  longest_streak: number;       // Longest streak achieved
  next_streak_bonus: number | null;
  leaderboard_rank: number | null;
  average_score: number | null;
  recent_rewards: GameRewardHistory[];
}
```

**Used For Dashboard:**
- Learning streak display (aggregate across all game types)
- Mini-game completion counts
- Best scores per game type

---

## 6. Integration Roadmap

### Priority 1: Critical Fixes

#### 6.1 Fix DashboardPage.tsx - Integrate PetContext

**Current Issue:** Uses local state instead of `PetContext`

**Required Changes:**
1. Remove local `useState` for pet data
2. Import and use `usePet()` hook
3. Replace `handleAction()` with `PetContext` methods
4. Add loading/error states from context

**Code Changes:**
```typescript
// REMOVE:
const [pet, setPet] = useState<PetData>({...});

// ADD:
import { usePet } from '../context/PetContext';
const { pet, loading, error, feed, play, bathe, updatePetStats } = usePet();

// REPLACE handleAction:
const handleAction = async (action: string) => {
  switch (action) {
    case 'feed': await feed(); break;
    case 'play': await play(); break;
    case 'clean': await bathe(); break;
    case 'heal': await updatePetStats({ health: Math.min(100, pet.stats.health + 10) }); break;
  }
};
```

**Files to Modify:**
- `frontend/src/pages/DashboardPage.tsx`

---

#### 6.2 Fix FinancialContext.tsx - Use Backend API

**Current Issue:** Uses `localStorage` instead of `/api/finance`

**Required Changes:**
1. Replace `getStoredFinancialData()` with `getFinanceSummary()` API call
2. Update `loadFinancialData()` to fetch from backend
3. Update `addTransaction()` to use backend API (if endpoint exists)
4. Remove localStorage dependency

**Code Changes:**
```typescript
// REMOVE:
import { getStoredFinancialData, storeFinancialData } from './localStorage';

// ADD:
import { getFinanceSummary } from '../api/finance';

// REPLACE loadFinancialData:
const loadFinancialData = async () => {
  if (!user) {
    setLoading(false);
    return;
  }
  try {
    setLoading(true);
    const response = await getFinanceSummary();
    setBalance(response.summary.balance);
    setTransactions(response.summary.transactions);
    // Store other fields as needed
  } catch (err) {
    console.error('Error loading financial data:', err);
    setError('Failed to load financial data');
  } finally {
    setLoading(false);
  }
};
```

**Files to Modify:**
- `frontend/src/context/FinancialContext.tsx`

---

### Priority 2: Dashboard.tsx Integration

#### 6.3 Integrate Live Data into Dashboard.tsx

**Current Status:** Intentional demo mode with hardcoded data

**Decision Required:**
- Option A: Keep as demo component (no changes needed)
- Option B: Convert to live data component (requires full integration)

**If Option B (Live Data):**

**Required Changes:**
1. Add `usePet()` hook for pet data
2. Add `useFinancial()` hook for wallet data
3. Add API calls for mini-game streaks (`getRewardsSummary()`)
4. Replace all hardcoded values with live data
5. Add loading states

**Files to Modify:**
- `frontend/src/pages/Dashboard.tsx`

---

### Priority 3: Hero.tsx Conditional Integration

#### 6.4 Add Conditional Pet Data to Hero.tsx

**Current Status:** Always shows static placeholder

**Required Changes:**
1. Add `useAuth()` to check if user is logged in
2. Add `usePet()` to get pet data (if logged in)
3. Conditionally render:
   - **Not logged in:** Static placeholder (current behavior)
   - **Logged in:** Real pet stats from `PetContext`

**Code Changes:**
```typescript
import { useAuth } from '../contexts/AuthContext';
import { usePet } from '../context/PetContext';

export const Hero = () => {
  const { currentUser } = useAuth();
  const { pet } = usePet();
  
  // Use real pet data if logged in, otherwise placeholder
  const stats = pet && currentUser ? [
    pet.stats.health,
    pet.stats.energy,
    pet.stats.happiness,
    pet.stats.cleanliness,
    pet.stats.energy,
  ] : [85, 70, 95, 60, 75];
  
  const petEmoji = pet && currentUser 
    ? getSpeciesEmoji(pet.species)
    : '🐕';
  
  // ... rest of component
};
```

**Files to Modify:**
- `frontend/src/components/Hero.tsx`

---

## 7. Data Flow Diagrams

### Current State (Broken)

```
DashboardPage.tsx
  └─> useState (hardcoded pet data)
      └─> handleAction() updates local state
          └─> ❌ Changes lost on refresh

FinancialContext.tsx
  └─> localStorage.getItem('financial_data')
      └─> ❌ Not synced with backend

Hero.tsx
  └─> Static hardcoded values
      └─> ❌ No live data
```

### Target State (Fixed)

```
DashboardPage.tsx
  └─> usePet() hook
      └─> PetContext
          └─> Supabase pets table
              └─> ✅ Persistent data

FinancialContext.tsx
  └─> getFinanceSummary() API call
      └─> GET /api/finance
          └─> Backend finance_service
              └─> Database wallets/transactions
                  └─> ✅ Live backend data

Hero.tsx
  └─> useAuth() + usePet()
      └─> Conditional rendering
          └─> PetContext (if logged in)
              └─> ✅ Real pet data when authenticated
```

---

## 8. Missing API Endpoints / Features

### 8.1 Mini-Game Aggregates

**Issue:** Dashboard shows "4 mini-games completed today" but no API endpoint aggregates this.

**Required:**
- Endpoint: `GET /api/games/summary` or similar
- Returns: Total games played today, per-game-type counts, aggregate streak

**Workaround:**
- Call `getRewardsSummary()` for each game type and aggregate client-side
- Or query `GameSession` table directly (if frontend has access)

---

### 8.2 Quest/Achievement System

**Issue:** Dashboard mentions "Care Quest — 3 quests completed" but no quest API found.

**Status:** Unknown if quest system exists in backend.

**Required Investigation:**
- Check for `/api/quests` endpoints
- Check for achievement/quest models in backend
- If missing, either remove from dashboard or implement

---

## 9. Summary Table

| Component | Pet Data | Financial Data | Streak Data | Status |
|-----------|----------|----------------|-------------|--------|
| **Dashboard.tsx** | ❌ Hardcoded | ❌ Hardcoded | ❌ Hardcoded | Demo mode (intentional) |
| **DashboardPage.tsx** | ❌ Local state | ❌ Missing | ❌ Missing | **CRITICAL: Needs PetContext** |
| **Hero.tsx** | ❌ Static | N/A | N/A | Should conditionally use PetContext |
| **PetContext.tsx** | ✅ Live (Supabase) | N/A | N/A | ✅ Fully implemented |
| **FinancialContext.tsx** | N/A | ⚠️ localStorage | N/A | **CRITICAL: Should use /api/finance** |

---

## 10. Action Items Checklist

### Immediate (Priority 1)

- [ ] **Fix DashboardPage.tsx** - Replace `useState` with `usePet()` hook
- [ ] **Fix DashboardPage.tsx** - Replace `handleAction()` with `PetContext` methods
- [ ] **Fix FinancialContext.tsx** - Replace `localStorage` with `getFinanceSummary()` API call
- [ ] **Fix FinancialContext.tsx** - Update `addTransaction()` to use backend API

### High Priority (Priority 2)

- [ ] **Integrate Dashboard.tsx** - Add `usePet()` and `useFinancial()` hooks (if converting to live mode)
- [ ] **Integrate Dashboard.tsx** - Add mini-game streak API calls (`getRewardsSummary()`)
- [ ] **Integrate Dashboard.tsx** - Replace hardcoded wallet/streak values with live data

### Medium Priority (Priority 3)

- [ ] **Enhance Hero.tsx** - Add conditional `useAuth()` + `usePet()` for logged-in users
- [ ] **Investigate Quest System** - Determine if quest/achievement API exists
- [ ] **Add Mini-Game Aggregates** - Create API endpoint or client-side aggregation for "games completed today"

---

## 11. Testing Requirements

After integration, verify:

1. **PetContext Integration:**
   - [ ] Pet data loads from database on DashboardPage
   - [ ] Actions (feed, play, clean, heal) persist to database
   - [ ] Stats update in real-time after actions
   - [ ] Loading states display correctly
   - [ ] Error states handle gracefully

2. **FinancialContext Integration:**
   - [ ] Balance loads from `/api/finance` endpoint
   - [ ] Transactions display from backend
   - [ ] Goals display from backend
   - [ ] No localStorage dependency remains

3. **Hero Component:**
   - [ ] Shows placeholder when not logged in
   - [ ] Shows real pet data when logged in
   - [ ] Stats bars reflect actual pet stats

4. **Dashboard Component:**
   - [ ] (If converting to live mode) All data loads from contexts/APIs
   - [ ] Streak data aggregates correctly
   - [ ] Wallet data displays correctly

---

## 12. Notes

- **Dashboard.tsx** appears to be intentionally a demo component. Decision needed on whether to convert to live data or keep as-is.
- **FinancialContext** currently has a `User` interface that may not match the actual auth user type. Verify compatibility.
- **PetContext** uses direct Supabase queries, not backend API. This is acceptable but different from FinancialContext pattern.
- Consider creating a unified data fetching pattern (all via backend API vs. all via Supabase direct).

---

**Report Generated:** Frontend Integration Analysis  
**Next Steps:** Review priorities and begin implementation of Priority 1 fixes.

