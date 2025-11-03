# COMPREHENSIVE SITE-WIDE AUTHENTICATION & USER DATA AUDIT

**Branch**: `fix/username-save-auth-check`  
**Audit Date**: November 1, 2025  
**Auditor**: Claude Sonnet 4.5

---

## EXECUTIVE SUMMARY

This audit examines every page, route, and UI element that reads or writes user data across the entire application. Each element is tested for: network requests, database persistence, UI updates, authentication protection, and RLS enforcement.

### Key Findings
- **Total Routes Audited**: 27
- **User Data Touchpoints**: 8 critical flows
- **Passing Flows**: TBD
- **Failing Flows**: TBD  
- **Partially Implemented**: TBD

---

## SITE MAP & ELEMENT INVENTORY

### PUBLIC ROUTES (No Auth Required)

| Route | Component | File Path | User Data Elements |
|-------|-----------|-----------|-------------------|
| `/` | LandingPage | `pages/LandingPage.tsx` | None (marketing page) |
| `/login` | Login | `pages/Login.tsx` | Email input, Password input, Submit button |
| `/signup` | SignUp | `pages/Signup.tsx` | Email input, Password input, Display Name input, Submit button |
| `/register` | Register | `pages/Register.tsx` | Email input, Password input, Submit button |
| `/auth/callback` | AuthCallback | `pages/AuthCallback.tsx` | OAuth callback handler |

### PROTECTED ROUTES (Auth Required)

#### Core User Flows
| Route | Component | File Path | User Data Elements |
|-------|-----------|-----------|-------------------|
| `/setup-profile` | SetupProfile | `pages/SetupProfile.tsx` | Username input, Avatar selector, Save button |
| `/profile` | ProfilePage | `pages/ProfilePage.tsx` | Username edit, Pet name edit, Stats display |
| `/settings` | SettingsScreen | `pages/settings/SettingsScreen.tsx` | User preferences, settings toggles |
| `/dashboard` | Dashboard | `pages/Dashboard.tsx` | Username display, User stats |

#### Pet Management (User Context)
| Route | Component | File Path | User Data Elements |
|-------|-----------|-----------|-------------------|
| `/shop` | Shop | `pages/Shop.tsx` | Purchase transactions (user_id linked) |
| `/feed` | FeedScreen | `pages/feed/FeedScreen.tsx` | Pet actions (user context) |
| `/clean` | CleanScreen | `pages/clean/CleanScreen.tsx` | Pet actions (user context) |
| `/play` | PlayScreen | `pages/play/PlayScreen.tsx` | Pet actions (user context) |
| `/rest` | RestScreen | `pages/rest/RestScreen.tsx` | Pet actions (user context) |
| `/health` | HealthCheckScreen | `pages/health/HealthCheckScreen.tsx` | Pet health data |
| `/earn` | EarnMoneyScreen | `pages/earn/EarnMoneyScreen.tsx` | User coins/transactions |
| `/budget` | BudgetDashboard | `pages/budget/BudgetDashboard.tsx` | User financial data |
| `/help` | HelpScreen | `pages/help/HelpScreen.tsx` | None (informational) |

#### Onboarding Flow
| Route | Component | File Path | User Data Elements |
|-------|-----------|-----------|-------------------|
| `/onboarding/species` | SpeciesSelection | `pages/SpeciesSelection.tsx` | Pet creation (user linked) |
| `/onboarding/breed` | BreedSelection | `pages/BreedSelection.tsx` | Pet creation (user linked) |
| `/onboarding/naming` | PetNaming | `pages/PetNaming.tsx` | Pet name (user linked) |

#### Mini-games
| Route | Component | File Path | User Data Elements |
|-------|-----------|-----------|-------------------|
| `/minigames/fetch` | FetchGame | `pages/minigames/FetchGame.tsx` | Score/rewards (user linked) |
| `/minigames/puzzle` | PuzzleGame | `pages/minigames/PuzzleGame.tsx` | Score/rewards (user linked) |
| `/minigames/reaction` | ReactionGame | `pages/minigames/ReactionGame.tsx` | Score/rewards (user linked) |
| `/minigames/dream` | DreamWorld | `pages/minigames/DreamWorld.tsx` | Score/rewards (user linked) |

---

## CRITICAL USER DATA FLOWS TO AUDIT

### Flow 1: User Registration/Signup
**Pages**: `/signup`, `/register`  
**Database Tables**: `auth.users`, `public.profiles`  
**Operations**: INSERT

### Flow 2: User Login
**Pages**: `/login`  
**Database Tables**: `auth.users` (via Supabase Auth)  
**Operations**: SELECT (session creation)

### Flow 3: Profile Creation
**Pages**: `/setup-profile`  
**Database Tables**: `public.profiles`  
**Operations**: INSERT

### Flow 4: Profile Updates
**Pages**: `/profile`  
**Database Tables**: `public.profiles`  
**Operations**: UPDATE

### Flow 5: Settings Changes
**Pages**: `/settings`  
**Database Tables**: `public.profiles` or `public.user_preferences`  
**Operations**: UPDATE

### Flow 6: Pet Creation
**Pages**: `/onboarding/species`, `/onboarding/breed`, `/onboarding/naming`  
**Database Tables**: `public.pets`  
**Operations**: INSERT

### Flow 7: Transaction/Coins Updates
**Pages**: `/shop`, `/earn`, `/budget`  
**Database Tables**: `public.profiles` (coins column), `public.transactions`  
**Operations**: UPDATE, INSERT

### Flow 8: OAuth Flow
**Pages**: `/auth/callback`  
**Database Tables**: `auth.users`, `public.profiles`  
**Operations**: SELECT, INSERT

---

## DETAILED AUDIT RESULTS

_Tests and evidence to be collected for each flow..._


