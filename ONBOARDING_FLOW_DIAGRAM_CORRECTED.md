# Corrected Onboarding Flow Diagram

## Updated Flow (After Fixes)

```
┌─────────────────────────────────────────────────────────────┐
│                    User Visits App                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  AuthContext  │
                    │  Initializes  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Check Session │
                    │  (Supabase)   │
                    └───────┬───────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
    ┌───────────────┐            ┌──────────────────┐
    │  No Session   │            │   Has Session    │
    └───────┬───────┘            └────────┬─────────┘
            │                               │
            ▼                               ▼
    ┌───────────────┐            ┌──────────────────┐
    │  Landing Page │            │ checkUserProfile()│
    │      (/)      │            │  (Supabase Query) │
    └───────────────┘            └────────┬─────────┘
                                           │
                                           ▼
                            ┌──────────────────────────┐
                            │  Check Profile (async)   │
                            │  Check Pet (async)       │
                            │  [ALWAYS check both]     │
                            └────────┬─────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
            ┌───────────────┐                ┌──────────────────┐
            │  No Profile   │                │  Has Profile     │
            │  (isNew=true) │                │  (isNew=false)   │
            └───────┬───────┘                └──────────────────┘
                    │                                 │
                    │                                 │
                    │                                 ▼
                    │                         ┌──────────────────┐
                    │                         │  Check Pet      │
                    │                         │  (ALWAYS)        │
                    │                         └────────┬─────────┘
                    │                                  │
                    │        ┌─────────────────────────┴─────────────────────────┐
                    │        │                                                 │
                    │        ▼                                                 ▼
                    │  ┌───────────────┐                              ┌───────────────┐
                    │  │   No Pet      │                              │   Has Pet     │
                    │  │  (hasPet=false)│                              │  (hasPet=true)│
                    │  └───────┬───────┘                              └───────┬───────┘
                    │          │                                               │
                    └──────────┴───────────────────────────────────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │   Route Decision      │
                            │  [Wait for loading]   │
                            └───────────┬───────────┘
                                        │
                ┌───────────────────────┴───────────────────────┐
                │                                               │
                ▼                                               ▼
        ┌───────────────┐                            ┌──────────────────┐
        │ /pet-selection│                            │   /dashboard     │
        │  (Onboarding) │                            │  (Protected)     │
        └───────┬───────┘                            └──────────────────┘
                │
                ▼
        ┌───────────────┐
        │ Select Pet    │
        │  Type/Breed    │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │  Name Pet     │
        │  (PetNaming)  │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ createPet()    │
        │  (Supabase)    │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Pet Created   │
        │  in DB ✅     │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │refreshUserState│
        │  (Update hasPet)│
        │  [with retry] │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ hasPet = true │
        │  [State Sync]  │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │  /dashboard   │
        │  [Navigate]   │
        └───────────────┘
```

## Key Changes from Original Flow

1. **Pet Check Always Runs:** Pet existence check is independent of profile check
2. **Loading State:** Routes wait for all async operations to complete before rendering
3. **Error Handling:** Retry logic and fallback behavior added
4. **Realtime Sync:** Pet changes trigger state updates across tabs

## State Transitions

### State Machine

```
States:
- UNKNOWN (initial)
- LOADING
- AUTHENTICATED_NO_PET
- AUTHENTICATED_HAS_PET
- UNAUTHENTICATED

Transitions:
UNKNOWN → LOADING (on mount)
LOADING → AUTHENTICATED_NO_PET (session + no pet)
LOADING → AUTHENTICATED_HAS_PET (session + pet)
LOADING → UNAUTHENTICATED (no session)
AUTHENTICATED_NO_PET → AUTHENTICATED_HAS_PET (pet created)
AUTHENTICATED_HAS_PET → AUTHENTICATED_NO_PET (pet deleted - edge case)
AUTHENTICATED_* → UNAUTHENTICATED (logout)
```

## Route Guard Logic

```
ProtectedRoute:
  if loading → show spinner
  if !currentUser → redirect to /login
  if !hasPet → redirect to /pet-selection
  else → render children

PublicRoute:
  if loading → show spinner
  if currentUser && !hasPet → redirect to /pet-selection
  if currentUser && hasPet → redirect to /dashboard
  else → render children

OnboardingRoute:
  if loading → show spinner
  if !currentUser → redirect to /login
  if hasPet → redirect to /dashboard
  else → render children
```

