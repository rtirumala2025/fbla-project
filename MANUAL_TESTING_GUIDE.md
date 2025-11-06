# 🧪 Manual Testing Guide - FBLA Virtual Pet App

**Purpose**: Step-by-step manual testing checklist for production deployment  
**Estimated Time**: 30-45 minutes

---

## 📋 Pre-Testing Setup

### 1. Environment Check
- [ ] Dev server running on port 3002
- [ ] Browser DevTools Console open (F12)
- [ ] Network tab open in DevTools
- [ ] Supabase Dashboard open (for verification)

### 2. Database Verification
- [ ] Run: `node scripts/validate_migrations.js`
- [ ] Verify all 4 tables exist (profiles, pets, user_preferences, pet_inventory)
- [ ] Check RLS is enabled on all tables

---

## 🧪 Test Scenario 1: User Signup & Profile Creation

### Steps
1. Navigate to `http://localhost:3002/signup`
2. Enter test email: `test_manual_${Date.now()}@test.com`
3. Enter password: `TestPassword123!`
4. Click "Sign Up"
5. Complete profile setup (enter username)

### Expected Results
- ✅ User created successfully
- ✅ Profile auto-created in `profiles` table
- ✅ Profile has 100 coins default
- ✅ Redirected to onboarding or dashboard

### Console Logs to Verify
```
✅ SetupProfile: Profile persisted successfully!
Profile ID: <uuid>
Profile user_id: <uuid>
Profile username: <username>
Profile coins: 100
```

### Database Verification
```sql
-- Check profile created
SELECT * FROM profiles WHERE username = '<username>';
-- Expected: 1 row with coins = 100
```

### Test Result: ⏳ [ ] PASS / [ ] FAIL

**Notes**: 
_________________________________________________

---

## 🧪 Test Scenario 2: Pet Creation Flow

### Steps
1. Complete onboarding:
   - Select species (e.g., Dog)
   - Select breed (e.g., Labrador)
   - Enter pet name (e.g., "Buddy")
2. Click "Start Journey"

### Expected Results
- ✅ Pet created in `pets` table
- ✅ Pet has default stats:
  - health: 100
  - hunger: 75
  - happiness: 80
  - cleanliness: 90
  - energy: 85
- ✅ Redirected to dashboard
- ✅ Pet displays on dashboard

### Console Logs to Verify
```
✅ Pet created in DB: { name: 'Buddy', species: 'dog', ... }
```

### Database Verification
```sql
-- Check pet created
SELECT * FROM pets WHERE user_id = '<user-id>';
-- Expected: 1 row with default stats
```

### Test Result: ⏳ [ ] PASS / [ ] FAIL

**Notes**: 
_________________________________________________

---

## 🧪 Test Scenario 3: Dashboard Actions

### Test 3.1: Feed Action (10 coins)

**Steps**:
1. Note current balance (should be 100)
2. Note current hunger stat
3. Click "Feed" button (10 coins)
4. Observe UI updates

**Expected Results**:
- ✅ Balance decreases by 10 (100 → 90) immediately
- ✅ Hunger increases by 30 (capped at 100)
- ✅ Energy increases by 10
- ✅ Toast shows "Action completed!"
- ✅ Notification shows "Fed Buddy!"

**Console Logs**:
```
🔵 Dashboard: Performing action "feed" (cost: 10 coins)
💰 Dashboard: Deducting 10 coins (100 → 90)
✅ Dashboard: Coins updated successfully
🍖 Dashboard: Feeding pet...
✅ Dashboard: Pet fed successfully
✅ Dashboard: Action "feed" completed successfully
```

**Database Verification**:
```sql
-- Check balance updated
SELECT coins FROM profiles WHERE user_id = '<user-id>';
-- Expected: 90

-- Check pet stats updated
SELECT hunger, energy FROM pets WHERE user_id = '<user-id>';
-- Expected: hunger increased, energy increased
```

**Test Result**: ⏳ [ ] PASS / [ ] FAIL

---

### Test 3.2: Play Action (Free)

**Steps**:
1. Note current happiness and energy
2. Click "Play" button
3. Observe UI updates

**Expected Results**:
- ✅ Happiness increases by 25
- ✅ Energy decreases by 15
- ✅ Hunger decreases by 10
- ✅ No coins deducted
- ✅ Toast shows success

**Test Result**: ⏳ [ ] PASS / [ ] FAIL

---

### Test 3.3: Bathe Action (15 coins)

**Steps**:
1. Note current balance and cleanliness
2. Click "Bathe" button (15 coins)
3. Observe UI updates

**Expected Results**:
- ✅ Balance decreases by 15
- ✅ Cleanliness set to 100
- ✅ Happiness increases by 10
- ✅ Toast shows success

**Test Result**: ⏳ [ ] PASS / [ ] FAIL

---

### Test 3.4: Rest Action (Free)

**Steps**:
1. Note current energy and health
2. Click "Rest" button
3. Observe UI updates

**Expected Results**:
- ✅ Energy set to 100
- ✅ Health increases by 5
- ✅ Hunger decreases by 10
- ✅ No coins deducted

**Test Result**: ⏳ [ ] FAIL

---

## 🧪 Test Scenario 4: Shop Purchase Flow

### Test 4.1: Single Item Purchase

**Steps**:
1. Navigate to Shop
2. Note current balance
3. Add "Dog Food" (10 coins) to cart
4. Click "Complete Purchase"
5. Return to Dashboard

**Expected Results**:
- ✅ Balance decreases by 10
- ✅ Pet hunger increases by 20
- ✅ Pet health increases by 5
- ✅ Toast shows "Purchase successful!"
- ✅ Item added to inventory (if table exists)

**Console Logs**:
```
🔵 Shop: Processing purchase { itemCount: 1, totalCost: 10, ... }
💰 Shop: Deducting 10 coins (90 → 80)
✅ Shop: Coins deducted successfully
📊 Shop: Stat updates: { hunger: 95, health: 105 }
🔵 Shop: Updating pet stats...
✅ Shop: Pet stats updated successfully
✅ Shop: Purchase completed successfully!
```

**Database Verification**:
```sql
-- Check balance
SELECT coins FROM profiles WHERE user_id = '<user-id>';

-- Check pet stats
SELECT hunger, health FROM pets WHERE user_id = '<user-id>';

-- Check inventory (if table exists)
SELECT * FROM pet_inventory WHERE user_id = '<user-id>';
```

**Test Result**: ⏳ [ ] PASS / [ ] FAIL

---

### Test 4.2: Multiple Items Purchase

**Steps**:
1. Add 3 items to cart (total: 50 coins)
2. Complete purchase
3. Verify all effects applied

**Expected Results**:
- ✅ Balance decreases by total cost
- ✅ All item effects applied to pet
- ✅ All items tracked in inventory
- ✅ Single success toast

**Test Result**: ⏳ [ ] PASS / [ ] FAIL

---

### Test 4.3: Insufficient Balance

**Steps**:
1. Ensure balance < item price
2. Try to purchase expensive item
3. Observe error handling

**Expected Results**:
- ✅ Purchase button disabled
- ✅ Error toast: "Not enough coins!"
- ✅ No coins deducted
- ✅ No pet stats changed

**Test Result**: ⏳ [ ] PASS / [ ] FAIL

---

## 🧪 Test Scenario 5: Data Persistence

### Steps
1. Perform several actions (feed, play, purchase)
2. Note current stats and balance
3. Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R)
4. Check dashboard and shop

### Expected Results
- ✅ Pet stats persist (same values)
- ✅ Coin balance persists
- ✅ Pet data loads from database
- ✅ No data loss
- ✅ No console errors

### Database Verification
```sql
-- Compare before/after reload
SELECT * FROM pets WHERE user_id = '<user-id>';
SELECT * FROM profiles WHERE user_id = '<user-id>';
```

### Test Result: ⏳ [ ] PASS / [ ] FAIL

---

## 🧪 Test Scenario 6: Error Handling

### Test 6.1: Network Failure

**Steps**:
1. Open DevTools → Network tab
2. Set to "Offline"
3. Try to perform action (feed, purchase)
4. Re-enable network

**Expected Results**:
- ✅ Error toast shows user-friendly message
- ✅ Optimistic update reverted
- ✅ Console shows error details
- ✅ App doesn't crash
- ✅ Error boundary doesn't trigger (handled gracefully)

**Test Result**: ⏳ [ ] PASS / [ ] FAIL

---

### Test 6.2: Invalid Data

**Steps**:
1. Try to purchase with no pet created
2. Try to feed with insufficient balance

**Expected Results**:
- ✅ Appropriate error messages
- ✅ No database changes
- ✅ UI remains stable

**Test Result**: ⏳ [ ] PASS / [ ] FAIL

---

### Test 6.3: Error Boundary

**Steps**:
1. Simulate React error (if possible)
2. Observe error boundary behavior

**Expected Results**:
- ✅ Error boundary catches error
- ✅ User sees friendly error message
- ✅ "Try Again" button works
- ✅ App doesn't completely crash

**Test Result**: ⏳ [ ] PASS / [ ] FAIL

---

## 🧪 Test Scenario 7: Loading States

### Steps
1. Perform actions and observe loading states
2. Check dashboard loading spinner
3. Check shop loading spinner
4. Check processing states during purchases

### Expected Results
- ✅ Loading spinners show during data fetch
- ✅ Buttons disabled during processing
- ✅ "Processing..." text during purchases
- ✅ Smooth transitions

### Test Result: ⏳ [ ] PASS / [ ] FAIL

---

## 🧪 Test Scenario 8: Optimistic UI Updates

### Steps
1. Perform feed action (10 coins)
2. Observe balance update immediately
3. Check if it persists after action completes

### Expected Results
- ✅ Balance updates immediately (optimistic)
- ✅ Action completes successfully
- ✅ Final balance matches database
- ✅ If error occurs, balance reverts

### Test Result: ⏳ [ ] PASS / [ ] FAIL

---

## 📊 Test Results Summary

| Test Scenario | Status | Notes |
|---------------|--------|-------|
| User Signup | ⏳ | |
| Profile Creation | ⏳ | |
| Pet Creation | ⏳ | |
| Feed Action | ⏳ | |
| Play Action | ⏳ | |
| Bathe Action | ⏳ | |
| Rest Action | ⏳ | |
| Single Purchase | ⏳ | |
| Multiple Purchase | ⏳ | |
| Insufficient Balance | ⏳ | |
| Data Persistence | ⏳ | |
| Network Failure | ⏳ | |
| Invalid Data | ⏳ | |
| Error Boundary | ⏳ | |
| Loading States | ⏳ | |
| Optimistic Updates | ⏳ | |

---

## ✅ Overall Test Result

**Status**: ⏳ [ ] ALL TESTS PASSED / [ ] SOME TESTS FAILED

**Issues Found**: 
_________________________________________________
_________________________________________________

**Ready for Production**: ⏳ [ ] YES / [ ] NO

---

**Test Date**: _______________  
**Tester**: _______________  
**Environment**: Local Development (Port 3002)

