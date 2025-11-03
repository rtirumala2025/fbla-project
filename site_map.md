# Site-Wide User Data Flow Map

**Generated**: 2025-11-03  
**Purpose**: Complete audit of all UI elements that read/write user data

---

## Authentication & Registration Pages

### 1. `/signup` - SignUp Page
**File**: `frontend/src/pages/Signup.tsx`

**Write Operations**:
- **Email/Password Registration Form**
  - Element: Email input, password input, submit button
  - Action: User creates account
  - Expected DB: `auth.users` table (Supabase Auth)
  - Network: POST to Supabase Auth API `/auth/v1/signup`
  - Verification: User record created in `auth.users`

### 2. `/register` - Register Page
**File**: `frontend/src/pages/Register.tsx`

**Write Operations**:
- **Registration Form**
  - Element: Email input, password input, username input
  - Action: User registers with email/password
  - Expected DB: `auth.users` + potentially `profiles` table
  - Network: POST to Supabase Auth API
  - Verification: User + profile created

### 3. `/login` - Login Page
**File**: `frontend/src/pages/Login.tsx`

**Read Operations**:
- **Login Form**
  - Element: Email input, password input, submit button
  - Action: User logs in
  - Expected DB: Reads from `auth.users` (via Supabase Auth)
  - Network: POST to `/auth/v1/token?grant_type=password`
  - Verification: Session token returned and stored

### 4. `/auth/callback` - OAuth Callback
**File**: `frontend/src/pages/AuthCallback.tsx`

**Read/Write Operations**:
- **OAuth Token Exchange**
  - Action: Process OAuth callback (Google, etc.)
  - Expected DB: `auth.users` lookup/create
  - Network: GET/POST to Supabase Auth
  - Verification: User authenticated, session created

---

## Profile & User Settings

### 5. `/setup-profile` - Profile Setup (First Time)
**File**: `frontend/src/pages/SetupProfile.tsx`

**Write Operations**:
- **Username Input Form**
  - Element: Username input field, submit button
  - Action: New user sets initial username
  - Expected DB: INSERT into `profiles` table (`user_id`, `username`, `coins`, `created_at`, `updated_at`)
  - Network: POST to `/rest/v1/profiles`
  - Verification: Row exists in `profiles` where `user_id = auth.uid()`
  - RLS: User can only insert their own profile

### 6. `/profile` - Profile Page
**File**: `frontend/src/pages/ProfilePage.tsx`

**Read Operations**:
- **Profile Display**
  - Element: Username display, email display, join date, coins
  - Expected DB: SELECT from `profiles` WHERE `user_id = auth.uid()`
  - Network: GET to `/rest/v1/profiles?user_id=eq.{uid}`
  
**Write Operations**:
- **Username Edit Form**
  - Element: Username input (inline edit or modal), save button
  - Action: User updates username
  - Expected DB: UPDATE `profiles` SET `username = ?`, `updated_at = NOW()` WHERE `user_id = auth.uid()`
  - Network: PATCH to `/rest/v1/profiles?user_id=eq.{uid}`
  - Verification: `profiles.username` updated, `profiles.updated_at` changed
  - RLS: User can only update their own profile
  
- **Avatar Upload** (if implemented)
  - Element: Avatar upload button
  - Action: User uploads avatar image
  - Expected DB: UPDATE `profiles` SET `avatar_url = ?` WHERE `user_id = auth.uid()`
  - Network: POST to Supabase Storage + PATCH to `/rest/v1/profiles`
  - Verification: `profiles.avatar_url` points to storage URL

### 7. `/settings` - Settings Page
**File**: `frontend/src/pages/settings/SettingsScreen.tsx`

**Read Operations**:
- **Settings Display**
  - Element: Toggle switches (sound, music, notifications, reduced_motion, high_contrast)
  - Expected DB: SELECT from `user_preferences` WHERE `user_id = auth.uid()`
  - Network: GET to `/rest/v1/user_preferences?user_id=eq.{uid}`

**Write Operations**:
- **Sound Toggle**
  - Element: Sound effects checkbox
  - Action: User toggles sound on/off
  - Expected DB: UPSERT `user_preferences` SET `sound = ?`, `updated_at = NOW()` WHERE `user_id = auth.uid()`
  - Network: POST to `/rest/v1/user_preferences` (upsert)
  - Verification: `user_preferences.sound` matches toggle state
  - RLS: User can only update their own preferences

- **Music Toggle**
  - Element: Music checkbox
  - Action: User toggles music on/off
  - Expected DB: UPSERT `user_preferences` SET `music = ?` WHERE `user_id = auth.uid()`
  - Network: POST to `/rest/v1/user_preferences`
  - Verification: `user_preferences.music` updated
  - RLS: User can only update their own preferences

- **Notifications Toggle**
  - Element: Notifications checkbox
  - Action: User toggles notifications
  - Expected DB: UPSERT `user_preferences` SET `notifications = ?` WHERE `user_id = auth.uid()`
  - Network: POST to `/rest/v1/user_preferences`
  - Verification: `user_preferences.notifications` updated
  - RLS: User can only update their own preferences

- **Reduced Motion Toggle**
  - Element: Reduced motion checkbox
  - Action: User toggles reduced motion
  - Expected DB: UPSERT `user_preferences` SET `reduced_motion = ?` WHERE `user_id = auth.uid()`
  - Network: POST to `/rest/v1/user_preferences`
  - Verification: `user_preferences.reduced_motion` updated
  - RLS: User can only update their own preferences

- **High Contrast Toggle**
  - Element: High contrast checkbox
  - Action: User toggles high contrast mode
  - Expected DB: UPSERT `user_preferences` SET `high_contrast = ?` WHERE `user_id = auth.uid()`
  - Network: POST to `/rest/v1/user_preferences`
  - Verification: `user_preferences.high_contrast` updated
  - RLS: User can only update their own preferences

- **Reset Progress Button**
  - Element: "Reset Progress" button
  - Action: User resets all game progress
  - Expected DB: DELETE from `pets`, `transactions` WHERE `user_id = auth.uid()`; UPDATE `profiles` SET `coins = 100`
  - Network: Multiple DELETE/UPDATE requests
  - Verification: Pet deleted, transactions cleared, coins reset to 100

---

## Pet Management

### 8. `/onboarding/species` - Species Selection
**File**: `frontend/src/pages/SpeciesSelection.tsx`

**Write Operations**:
- **Species Selection**
  - Element: Species cards (Dog, Cat, Bird, Rabbit)
  - Action: User selects pet species
  - Expected DB: Temporarily stored in localStorage (not yet in DB)
  - Network: None (localStorage only)
  - Verification: `localStorage.getItem('selectedSpecies')`

### 9. `/onboarding/breed` - Breed Selection
**File**: `frontend/src/pages/BreedSelection.tsx`

**Write Operations**:
- **Breed Selection**
  - Element: Breed cards
  - Action: User selects pet breed
  - Expected DB: Temporarily stored in localStorage
  - Network: None (localStorage only)
  - Verification: `localStorage.getItem('selectedBreed')`

### 10. `/onboarding/naming` - Pet Naming
**File**: `frontend/src/pages/PetNaming.tsx`

**Write Operations**:
- **Pet Name Input + Creation**
  - Element: Name input field, "Start Journey" button
  - Action: User names pet and creates it
  - Expected DB: INSERT into `pets` table (`id`, `user_id`, `name`, `species`, `breed`, `health`, `hunger`, `happiness`, `cleanliness`, `energy`, `level`, `xp`, `created_at`, `updated_at`)
  - Network: POST to `/rest/v1/pets`
  - Verification: Row exists in `pets` WHERE `user_id = auth.uid()`
  - RLS: User can only insert their own pet
  - Constraint: UNIQUE(`user_id`) - one pet per user

### 11. `/dashboard` - Dashboard
**File**: `frontend/src/pages/Dashboard.tsx`

**Read Operations**:
- **Pet Display**
  - Element: Pet name, species emoji, stats (health, hunger, happiness, cleanliness, energy)
  - Expected DB: SELECT from `pets` WHERE `user_id = auth.uid()`
  - Network: GET to `/rest/v1/pets?user_id=eq.{uid}`
  
- **User Info Display**
  - Element: Username display, coins display
  - Expected DB: SELECT from `profiles` WHERE `user_id = auth.uid()`
  - Network: GET to `/rest/v1/profiles?user_id=eq.{uid}`

### 12. `/feed` - Feed Screen
**File**: `frontend/src/pages/feed/FeedScreen.tsx`

**Write Operations**:
- **Feed Pet Action**
  - Element: Food item buttons (apple, carrot, burger, etc.)
  - Action: User feeds pet
  - Expected DB: UPDATE `pets` SET `hunger = hunger + X`, `energy = energy + Y`, `updated_at = NOW()` WHERE `user_id = auth.uid()`
  - Network: PATCH to `/rest/v1/pets?user_id=eq.{uid}`
  - Verification: `pets.hunger` increased, `pets.updated_at` changed
  - RLS: User can only update their own pet

### 13. `/play` - Play Screen
**File**: `frontend/src/pages/play/PlayScreen.tsx`

**Write Operations**:
- **Play with Pet Action**
  - Element: Play activity buttons (fetch, tug-of-war, etc.)
  - Action: User plays with pet
  - Expected DB: UPDATE `pets` SET `happiness = happiness + X`, `energy = energy - Y`, `hunger = hunger - Z`, `updated_at = NOW()` WHERE `user_id = auth.uid()`
  - Network: PATCH to `/rest/v1/pets?user_id=eq.{uid}`
  - Verification: `pets.happiness` increased, `pets.energy` decreased
  - RLS: User can only update their own pet

### 14. `/clean` - Clean Screen
**File**: `frontend/src/pages/clean/CleanScreen.tsx`

**Write Operations**:
- **Bathe Pet Action**
  - Element: Bath/clean buttons
  - Action: User cleans pet
  - Expected DB: UPDATE `pets` SET `cleanliness = 100`, `happiness = happiness + X`, `updated_at = NOW()` WHERE `user_id = auth.uid()`
  - Network: PATCH to `/rest/v1/pets?user_id=eq.{uid}`
  - Verification: `pets.cleanliness` set to 100
  - RLS: User can only update their own pet

### 15. `/rest` - Rest Screen
**File**: `frontend/src/pages/rest/RestScreen.tsx`

**Write Operations**:
- **Rest Pet Action**
  - Element: Rest/sleep button
  - Action: User puts pet to rest
  - Expected DB: UPDATE `pets` SET `energy = 100`, `hunger = hunger - X`, `updated_at = NOW()` WHERE `user_id = auth.uid()`
  - Network: PATCH to `/rest/v1/pets?user_id=eq.{uid}`
  - Verification: `pets.energy` set to 100
  - RLS: User can only update their own pet

### 16. `/health` - Health Check Screen
**File**: `frontend/src/pages/health/HealthCheckScreen.tsx`

**Read Operations**:
- **Health Stats Display**
  - Element: Health bar, status indicators
  - Expected DB: SELECT `health`, `hunger`, `happiness`, `cleanliness`, `energy` from `pets` WHERE `user_id = auth.uid()`
  - Network: GET to `/rest/v1/pets?user_id=eq.{uid}`

**Write Operations** (if healing implemented):
- **Heal Pet Action**
  - Expected DB: UPDATE `pets` SET `health = 100` WHERE `user_id = auth.uid()`
  - Network: PATCH to `/rest/v1/pets?user_id=eq.{uid}`

---

## Budget & Transactions

### 17. `/budget` - Budget Dashboard
**File**: `frontend/src/pages/budget/BudgetDashboard.tsx`

**Read Operations**:
- **Transaction List**
  - Element: Transaction table/list
  - Expected DB: SELECT from `transactions` WHERE `user_id = auth.uid()` ORDER BY `created_at` DESC
  - Network: GET to `/rest/v1/transactions?user_id=eq.{uid}&order=created_at.desc`
  - Verification: Transactions displayed match DB rows
  - RLS: User can only read their own transactions

- **Budget Summary**
  - Element: Income/expense totals, balance
  - Expected DB: Aggregated from `transactions` table
  - Network: GET with aggregation (or client-side calculation)

**Write Operations**:
- **Add Transaction Form**
  - Element: Amount input, type dropdown (income/expense), category, submit button
  - Action: User adds transaction
  - Expected DB: INSERT into `transactions` (`id`, `user_id`, `amount`, `type`, `category`, `description`, `created_at`)
  - Network: POST to `/rest/v1/transactions`
  - Verification: New row in `transactions`, user's coins updated in `profiles`
  - RLS: User can only insert their own transactions

### 18. `/earn` - Earn Money Screen
**File**: `frontend/src/pages/earn/EarnMoneyScreen.tsx`

**Write Operations**:
- **Complete Task/Minigame**
  - Element: Task completion buttons, minigame completion
  - Action: User earns coins
  - Expected DB: UPDATE `profiles` SET `coins = coins + X` WHERE `user_id = auth.uid()`; INSERT into `transactions`
  - Network: PATCH to `/rest/v1/profiles` + POST to `/rest/v1/transactions`
  - Verification: `profiles.coins` increased, transaction recorded
  - RLS: User can only update their own coins

### 19. `/shop` - Shop
**File**: `frontend/src/pages/Shop.tsx`

**Write Operations**:
- **Purchase Item**
  - Element: Item cards, buy buttons
  - Action: User purchases item
  - Expected DB: UPDATE `profiles` SET `coins = coins - X` WHERE `user_id = auth.uid()`; INSERT into `transactions` (expense); possibly INSERT into `inventory`
  - Network: PATCH to `/rest/v1/profiles` + POST to `/rest/v1/transactions`
  - Verification: `profiles.coins` decreased, expense transaction recorded
  - RLS: User can only update their own coins

---

## Mini-Games

### 20-23. `/minigames/*` - Various Mini-Games
**Files**: `FetchGame.tsx`, `PuzzleGame.tsx`, `ReactionGame.tsx`, `DreamWorld.tsx`

**Write Operations**:
- **Game Completion**
  - Action: User completes minigame
  - Expected DB: UPDATE `profiles` SET `coins = coins + reward`, possibly UPDATE `pets` SET `xp = xp + X`, `level = ?`, `happiness = happiness + Y`
  - Network: PATCH to `/rest/v1/profiles` and/or `/rest/v1/pets`
  - Verification: Coins/XP increased
  - RLS: User can only update their own data

---

## Global Components

### 24. Header Component
**File**: `frontend/src/components/Header.tsx`

**Read Operations**:
- **User Display**
  - Element: Username display, avatar (if present)
  - Expected DB: SELECT from `profiles` WHERE `user_id = auth.uid()`
  - Network: Provided via AuthContext (no direct call)

**Write Operations**:
- **Logout Button**
  - Element: Logout/sign out button
  - Action: User logs out
  - Expected DB: Session cleared (Supabase Auth)
  - Network: POST to `/auth/v1/logout`
  - Verification: Session token removed from localStorage

---

## Data Tables Summary

| Table | Columns | RLS Policies | Who Can Access |
|-------|---------|--------------|----------------|
| `auth.users` | id, email, encrypted_password, ... | Managed by Supabase Auth | Supabase Auth only |
| `profiles` | id, user_id, username, coins, avatar_url, created_at, updated_at | INSERT/SELECT/UPDATE/DELETE with `auth.uid() = user_id` | Owner only |
| `user_preferences` | id, user_id, sound, music, notifications, reduced_motion, high_contrast, created_at, updated_at | INSERT/SELECT/UPDATE/DELETE with `auth.uid() = user_id` | Owner only |
| `pets` | id, user_id, name, species, breed, health, hunger, happiness, cleanliness, energy, level, xp, created_at, updated_at | INSERT/SELECT/UPDATE/DELETE with `auth.uid() = user_id` | Owner only, UNIQUE(user_id) |
| `transactions` | id, user_id, amount, type, category, description, created_at | INSERT/SELECT/DELETE with `auth.uid() = user_id` | Owner only |

---

## LocalStorage Usage (Temporary Data)

| Key | Used By | Purpose | Should Be Cleared |
|-----|---------|---------|-------------------|
| `selectedSpecies` | SpeciesSelection.tsx | Temp store for onboarding | ✅ Yes (after pet created) |
| `selectedBreed` | BreedSelection.tsx | Temp store for onboarding | ✅ Yes (after pet created) |
| `supabase.auth.token` | Supabase Client | Auth session token | ✅ Yes (on logout) |

---

## Summary Statistics

- **Total Routes**: 24 routes mapped
- **Public Pages**: 5 (landing, login, signup, register, oauth callback)
- **Protected Pages**: 19 (dashboard, profile, settings, pet actions, budget, minigames, onboarding)
- **Pages with Write Operations**: 17
- **Database Tables Involved**: 5 (auth.users, profiles, user_preferences, pets, transactions)
- **Total Write Operations Identified**: 30+
- **Total Read Operations Identified**: 15+

---

## Verification Checklist

For each write operation above, the following must be verified:
1. ✅ Network request occurs (method, URL, headers with Authorization)
2. ✅ Response is successful (200/201/204)
3. ✅ Database row is updated (verified via SQL query)
4. ✅ UI persists after page reload
5. ✅ RLS enforced (unauthorized requests return 401/403)

---

**Generated by**: Complete site-wide audit process  
**Next Step**: Perform verification for each critical write operation

