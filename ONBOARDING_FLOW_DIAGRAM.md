# Onboarding Flow - User State Transitions

## State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNAUTHENTICATED STATE                         │
│                                                                   │
│  Routes Available:                                                │
│  - / (Landing Page) ✅                                            │
│  - /login ✅                                                      │
│  - /signup ✅                                                     │
│  - /register ✅                                                   │
│                                                                   │
│  All other routes → Redirect to /login                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Login/Register
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              AUTHENTICATED - CHECKING PET STATE                  │
│                                                                   │
│  AuthCallback checks Supabase:                                   │
│  - Query profiles table                                           │
│  - Query pets table                                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        NO PET FOUND            PET FOUND
                │                       │
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  AUTHENTICATED            │  │  AUTHENTICATED            │
│  NO PET (New User)        │  │  HAS PET (Existing User) │
│                           │  │                           │
│  hasPet = false           │  │  hasPet = true            │
│                           │  │                           │
│  Routes Available:        │  │  Routes Available:        │
│  - /pet-selection ✅       │  │  - /dashboard ✅          │
│  - /onboarding/* ✅        │  │  - /shop ✅                │
│                           │  │  - /profile ✅              │
│  Routes Blocked:          │  │  - /budget ✅               │
│  - /dashboard ❌          │  │  - /minigames/* ✅          │
│  - / (Landing) ❌          │  │  - All protected routes ✅ │
│  - All protected ❌        │  │                           │
│                           │  │  Routes Blocked:          │
│  Redirects to:            │  │  - /pet-selection ❌       │
│  - /pet-selection         │  │  - /onboarding/* ❌        │
│                           │  │  - / (Landing) ❌           │
│                           │  │                           │
│  Redirects to:            │  │  Redirects to:            │
│  - /pet-selection         │  │  - /dashboard             │
└──────────────────────────┘  └──────────────────────────┘
                │                       │
                │                       │
                │ Create Pet            │
                │ (via PetNaming)       │
                │                       │
                ▼                       │
┌──────────────────────────┐           │
│  PET CREATION PROCESS     │           │
│                           │           │
│  1. Insert into pets table│           │
│  2. PetContext.setPet()   │           │
│  3. refreshUserState()    │           │
│  4. hasPet = true         │           │
└──────────────────────────┘           │
                │                       │
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
                ┌──────────────────────────┐
                │  AUTHENTICATED            │
                │  HAS PET (Onboarded)      │
                │                           │
                │  Full access to app       │
                │  Redirects to /dashboard  │
                └──────────────────────────┘
```

## Route Decision Tree

```
User Action
    │
    ├─→ Visit / (Landing)
    │   │
    │   ├─→ Not authenticated → Show landing page ✅
    │   └─→ Authenticated → Check hasPet
    │       ├─→ hasPet = false → Redirect to /pet-selection
    │       └─→ hasPet = true → Redirect to /dashboard
    │
    ├─→ Login/Register
    │   │
    │   └─→ AuthCallback
    │       │
    │       ├─→ Check Supabase for pet
    │       │
    │       ├─→ No pet → Redirect to /pet-selection
    │       └─→ Has pet → Redirect to /dashboard
    │
    ├─→ Visit /pet-selection
    │   │
    │   ├─→ Not authenticated → Redirect to /login
    │   └─→ Authenticated → Check hasPet
    │       ├─→ hasPet = false → Show pet selection ✅
    │       └─→ hasPet = true → Redirect to /dashboard
    │
    ├─→ Visit /dashboard
    │   │
    │   ├─→ Not authenticated → Redirect to /login
    │   └─→ Authenticated → Check hasPet
    │       ├─→ hasPet = false → Redirect to /pet-selection
    │       └─→ hasPet = true → Show dashboard ✅
    │
    └─→ Create Pet (via /onboarding/naming)
        │
        └─→ Pet inserted into Supabase
            │
            └─→ refreshUserState() called
                │
                └─→ hasPet = true
                    │
                    └─→ Redirect to /dashboard
```

## State Transitions Table

| Current State | Action | Next State | Route |
|--------------|--------|------------|-------|
| Unauthenticated | Login | Authenticated (No Pet) | `/pet-selection` |
| Unauthenticated | Register | Authenticated (No Pet) | `/pet-selection` |
| Authenticated (No Pet) | Create Pet | Authenticated (Has Pet) | `/dashboard` |
| Authenticated (No Pet) | Visit `/` | Authenticated (No Pet) | `/pet-selection` (redirect) |
| Authenticated (No Pet) | Visit `/dashboard` | Authenticated (No Pet) | `/pet-selection` (redirect) |
| Authenticated (Has Pet) | Visit `/pet-selection` | Authenticated (Has Pet) | `/dashboard` (redirect) |
| Authenticated (Has Pet) | Visit `/` | Authenticated (Has Pet) | `/dashboard` (redirect) |
| Authenticated (Has Pet) | Visit `/dashboard` | Authenticated (Has Pet) | `/dashboard` ✅ |

## Key Guards

### PublicRoute Guard
```typescript
if (authenticated) {
  if (!hasPet) redirect('/pet-selection');
  else redirect('/dashboard');
}
```

### ProtectedRoute Guard
```typescript
if (!authenticated) redirect('/login');
if (!hasPet) redirect('/pet-selection');
// Otherwise allow access
```

### OnboardingRoute Guard
```typescript
if (!authenticated) redirect('/login');
if (hasPet) redirect('/dashboard');
// Otherwise allow access (user needs onboarding)
```

## Database State

### New User (No Pet)
```sql
-- profiles table: may or may not exist
SELECT * FROM profiles WHERE user_id = '...';
-- Result: NULL or row

-- pets table: does not exist
SELECT * FROM pets WHERE user_id = '...';
-- Result: NULL
```

### Existing User (Has Pet)
```sql
-- profiles table: exists
SELECT * FROM profiles WHERE user_id = '...';
-- Result: row

-- pets table: exists
SELECT * FROM pets WHERE user_id = '...';
-- Result: row
```

## Implementation Notes

1. **Single Source of Truth**: Pet existence is determined solely by Supabase `pets` table
2. **No localStorage**: All state derived from database queries
3. **Immediate Updates**: `refreshUserState()` called after pet creation
4. **Route Guards**: Three layers of protection (Public, Protected, Onboarding)
5. **Automatic Redirects**: Users always land on correct page based on state

