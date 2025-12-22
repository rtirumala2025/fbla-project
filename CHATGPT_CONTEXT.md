# Virtual Pet FBLA Project - Rebuild Context Document

**Purpose:** This document provides ChatGPT with complete context about our project, the recent restoration action, and what needs to be rebuilt. Use this as context when asking ChatGPT to help restore the lost features.

---

## 📋 Project Overview

### What We're Building
A **Virtual Pet Companion Web Application** for the FBLA (Future Business Leaders of America) Intro to Programming competition. This is an educational application that teaches financial literacy through interactive gameplay.

### Core Concept
Students adopt a virtual pet companion, care for it (feed, play, bathe, rest), manage virtual finances, play mini-games, and receive AI-driven coaching. The pet's well-being depends on good financial decisions, creating an engaging learning experience.

### Project Goals
1. **Competition Readiness:** Polished, professional application suitable for FBLA judges
2. **Educational Value:** Demonstrate financial literacy concepts through gameplay
3. **Technical Excellence:** Showcase full-stack development skills
4. **User Experience:** Smooth, intuitive interface with animations and feedback
5. **Visual Polish:** Modern UI with Roblox-inspired game aesthetics

---

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript, Vite, React Router, Framer Motion, Tailwind CSS
- **Backend:** FastAPI (Python), SQLAlchemy, Pydantic
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication:** Supabase Auth (Email/Password + Google OAuth)
- **State Management:** React Context API (AuthContext, PetContext, FinancialContext)
- **Styling:** Tailwind CSS with custom design system

### Project Structure
```
fbla-project/
├── frontend/              # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── pets/      # Pet-related components
│   │   │   ├── ai/        # AI chat and features
│   │   │   ├── finance/   # Financial features
│   │   │   └── ...
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client functions
│   │   └── types/         # TypeScript types
│   └── vite.config.ts
├── app/                   # FastAPI backend
│   ├── main.py
│   ├── routers/           # API route handlers
│   └── services/          # Business logic
├── supabase/
│   └── migrations/        # Database migrations
└── docs/                  # Documentation

```

### Key Features (Current State)
✅ **Authentication System**
- Email/password signup and login
- Google OAuth integration
- Session management with Supabase
- Protected routes

✅ **Pet Management**
- Pet creation flow (species → breed → name)
- Pet stats system: Health, Hunger, Happiness, Cleanliness, Energy
- Pet actions: Feed, Play, Bathe, Rest
- Stats decay over time
- Pet data persistence in Supabase

✅ **Dashboard**
- Real-time pet display
- Interactive stat bars with color coding
- Action buttons with coin costs
- Coin balance tracking
- Pet mood indicators

✅ **Shop System**
- Item catalog (food, toys, medicine)
- Shopping cart
- Purchase flow with coin deduction
- Item effects on pet stats

✅ **Financial System**
- Wallet/coin tracking
- Transaction history
- Budget advisor (AI-powered)
- Expense analytics

✅ **Mini-Games**
- Memory game
- Puzzle game
- Fetch game
- Adaptive difficulty scaling

✅ **Additional Features**
- Quest system
- Social features (friends, leaderboards)
- Analytics dashboard
- Settings (theme, sound, notifications)

---

## ⚠️ What Just Happened (The Restoration)

### Action Taken
We performed a **hard reset** to commit `94290a8e6ebef073a9a6123d35aac9d5f775756a` and **force-pushed to remote**. This removed 23 commits worth of recent work.

### Why It Happened
The restoration was intentional to revert to a known stable state, but it removed significant visual improvements and feature work.

### Impact
- **23 commits lost** (~2-3 days of development work)
- **48 files affected**
- **~9,978 lines of code removed**
- **~1,302 lines of code deleted**
- **Net loss: ~8,676 lines of work**

---

## 🚨 What Was Lost (Critical Features to Rebuild)

### 1. **PetVisual Component System** ❌ CRITICAL - MUST REBUILD
**File:** `frontend/src/components/pets/PetVisual.tsx` (517 lines)

**What It Was:**
- A brand new, standalone component for visual-only pet rendering
- Replaced/refactored the existing pet rendering system
- Designed to be cleaner, more performant, and more maintainable

**Features Lost:**
- Visual-only rendering (separated from game logic)
- Idle animations (subtle animations when pet is idle)
- Environment-specific visual theming (pet appearance adapts to environment)
- Better performance (optimized rendering)
- Modular design (easier to maintain)

**Integration Points:**
- Was integrated into `PetGameScene.tsx`
- Used by the game scene to display the pet visually
- Received environment prop to adapt appearance

**Current State:**
- File **does not exist** (needs to be created from scratch)
- `PetGameScene.tsx` was reverted to previous version (doesn't use PetVisual)

---

### 2. **Environment Rendering System** ❌ CRITICAL - MUST REBUILD
**Files:**
- `frontend/src/components/environments/EnvironmentRenderer.tsx` (91 lines)
- `frontend/src/components/environments/BambooForestEnvironment.tsx` (121 lines)
- `frontend/src/components/environments/CozyRoomEnvironment.tsx` (112 lines)

**What It Was:**
- A complete system for rendering different environments where pets live
- Each pet type had its own themed environment
- Environment shell components that wrap around the pet

**Features Lost:**
- **BambooForestEnvironment:** Panda pet's environment (bamboo forest theme)
- **CozyRoomEnvironment:** Cat pet's cozy room environment
- **EnvironmentRenderer:** Main component that selects and renders the appropriate environment
- Dynamic environment loading based on pet type
- Visual consistency with pet theming

**Current State:**
- Environment components **do not exist** (entire `environments/` directory missing)
- `PetGameScene.tsx` was reverted and doesn't use environment system

---

### 3. **Environment Configuration System** ❌ CRITICAL - MUST REBUILD
**Files:**
- `frontend/src/config/environmentConfig.ts` (104 lines)
- `frontend/src/config/environmentResolver.ts` (157 lines)
- `frontend/src/config/petConfig.ts` (86 lines)
- `frontend/src/components/pets/environmentConfig.ts` (473 lines - different file!)

**What It Was:**
- Centralized configuration system for pets and their environments
- Configuration-driven architecture (pet-config driven)
- Resolver functions that match pets to their environments
- Pure functions for environment resolution

**Features Lost:**
- Pet-to-environment mapping
- Centralized pet configuration (breeds, species, traits)
- Environment configuration (themes, colors, assets)
- Environment resolver function (pure function that determines environment)
- Pet-config driven architecture

**Current State:**
- Config files **do not exist** (entire `config/` directory may be missing)
- System architecture reverted to non-config-driven approach

---

### 4. **Performance Optimizations** ⚠️ IMPORTANT - SHOULD REBUILD
**Files:**
- `supabase/migrations/020_additional_performance_indexes.sql` (105 lines)
- `frontend/src/components/ui/LazyImage.tsx` (143 lines)
- `frontend/src/utils/routePreloader.ts` (105 lines)
- `frontend/src/utils/stats-wrapper.ts` (55 lines)

**What Was Lost:**
- Database performance indexes (faster queries)
- Lazy image loading component (better page load performance)
- Route preloader utilities (faster navigation)
- Stats wrapper utilities (optimized stat calculations)

**Impact:**
- Slower database queries
- Slower page loads
- No lazy loading for images
- No route preloading

**Current State:**
- Migration file missing (may need to check if indexes were already applied to database)
- Utility components missing

---

### 5. **Build System Modernization** ⚠️ IMPORTANT - SHOULD REBUILD
**Files:**
- `frontend/vite.config.ts` (266 lines added/modified)
- `frontend/tsconfig.json` (updates)
- `frontend/tsconfig.node.json` (12 lines - new file)
- `frontend/postcss.config.js` (new file)
- `frontend/src/utils/env.ts` (97 lines - new file)

**What Was Lost:**
- Modern Vite configuration (optimizations, plugins)
- Improved TypeScript configuration
- PostCSS configuration
- Environment variable utilities
- Migration from `index.js` to `main.tsx` entry point

**Impact:**
- Potentially slower build times
- Less optimized production builds
- Missing environment variable helpers

**Current State:**
- Configuration files reverted to previous versions
- May have outdated build setup

---

### 6. **PetGameScene Major Refactor** ❌ CRITICAL - MUST REBUILD
**File:** `frontend/src/components/pets/PetGameScene.tsx` (735 lines changed)

**What Changed (That Was Lost):**
- Integration of PetVisual component
- Integration of EnvironmentRenderer
- Integration of environment resolver
- Refactored to use new visual system
- Better separation of concerns

**Current State:**
- File exists but is **reverted to old version**
- Doesn't use PetVisual, EnvironmentRenderer, or resolver
- Uses older rendering approach

---

## 🎯 Rebuild Priority & Strategy

### Priority 1: Core Visual System (CRITICAL)
1. **Rebuild PetVisual component** (`frontend/src/components/pets/PetVisual.tsx`)
   - Start from scratch or check git history for lost code
   - Should be a visual-only component
   - Needs idle animations
   - Needs environment theming support
   - Should accept environment prop

2. **Rebuild Environment System**
   - Create `frontend/src/components/environments/` directory
   - Build EnvironmentRenderer.tsx
   - Build BambooForestEnvironment.tsx
   - Build CozyRoomEnvironment.tsx
   - Each should have appropriate styling and theming

3. **Rebuild Configuration System**
   - Create `frontend/src/config/` directory if missing
   - Build environmentConfig.ts
   - Build environmentResolver.ts
   - Build petConfig.ts
   - Implement pet-to-environment mapping logic

4. **Update PetGameScene**
   - Integrate PetVisual component
   - Integrate EnvironmentRenderer
   - Use environment resolver
   - Refactor to use new architecture

### Priority 2: Performance & Build (IMPORTANT)
1. Rebuild performance utilities (LazyImage, routePreloader, stats-wrapper)
2. Update Vite configuration with optimizations
3. Add PostCSS configuration
4. Create environment utilities (`utils/env.ts`)
5. Apply database performance indexes migration (check if needed)

### Priority 3: Documentation (NICE TO HAVE)
- Restore implementation documentation files
- Document the new architecture

---

## 📚 Context for Rebuilding

### Current PetGameScene State
The current `PetGameScene.tsx` is a Roblox-style pet game component with:
- A cozy room environment (hardcoded)
- Pet rendering using existing methods
- Interactive zones and objects
- Care actions (feed, play, bathe, rest)
- Floating particles and animations
- Pet stats management

**What It Needs:**
- Replace hardcoded environment with EnvironmentRenderer
- Replace current pet rendering with PetVisual component
- Use environment resolver to determine environment dynamically
- Support multiple pet types with their specific environments

### Design Principles (What to Maintain)
- **Roblox-inspired aesthetics:** Warm, kid-friendly colors
- **Smooth animations:** Framer Motion transitions
- **Interactive elements:** Clickable zones and objects
- **Visual feedback:** Particle effects, success indicators
- **Performance:** Optimized rendering, lazy loading

### Architecture Principles (What to Implement)
- **Separation of concerns:** Visual components separate from game logic
- **Configuration-driven:** Use config files instead of hardcoded values
- **Modularity:** Components should be reusable and independent
- **Type safety:** Full TypeScript support
- **Performance:** Lazy loading, code splitting, optimized renders

---

## 🔍 How to Recover Lost Code

### Option 1: Git History (If Available)
```bash
# View lost commits
git log 94290a8e6ebef073a9a6123d35aac9d5f775756a..origin/main --oneline

# View specific file from lost commit
git show <commit-hash>:frontend/src/components/pets/PetVisual.tsx

# See all changes in a commit
git show <commit-hash>
```

### Option 2: Reflog (If Local History Exists)
```bash
# Check reflog for lost commits
git reflog

# View commit details
git show <reflog-commit-hash>
```

### Option 3: Remote Branches
Check if any of this work exists in other branches:
```bash
git branch -r
git log <branch-name> --oneline
```

### Option 4: Rebuild from Scratch
If code cannot be recovered, rebuild using:
- This context document
- Current PetGameScene as reference
- Design principles outlined above
- Component structure inferred from lost files list

---

## 🎨 Visual Design Context

### Color Palette (Roblox-Style)
- Warm, inviting, kid-friendly colors
- Soft blues for sky/walls (#B4D7E8, #D4E5EF)
- Warm wood tones for floors (#C9A87C, #D9BC94)
- Vibrant but not overwhelming
- Good contrast for accessibility

### Environment Themes
- **Cozy Room:** Warm, indoor environment for cats
- **Bamboo Forest:** Natural, outdoor environment for pandas
- Should be visually distinct but cohesive with overall design

### Pet Visual Design
- Should be visually appealing and expressive
- Support idle animations (subtle, not distracting)
- Adapt to environment (colors, effects)
- Maintain performance (optimized rendering)

---

## 📝 Key Implementation Details to Remember

### PetVisual Component Should:
- Be a pure visual component (no game logic)
- Accept props: `pet` (pet data), `environment` (environment config), `onInteraction` (callbacks)
- Support idle animations
- Support environment-specific theming
- Be performant (use React.memo, optimize renders)
- Be fully typed (TypeScript)

### EnvironmentRenderer Should:
- Accept `pet` prop to determine environment
- Use environment resolver to get correct environment config
- Render appropriate environment component
- Pass environment config to PetVisual
- Handle environment transitions smoothly

### Environment Resolver Should:
- Be a pure function
- Take pet data as input
- Return environment configuration
- Use centralized pet/environment configs
- Be fully typed

### Integration Pattern:
```
PetGameScene
  ├── EnvironmentRenderer (determines and renders environment)
  │   └── [Environment Component] (CozyRoom, BambooForest, etc.)
  │       └── PetVisual (renders pet with environment theming)
  └── [Game Logic, Interactions, etc.]
```

---

## 🚀 Next Steps for ChatGPT

When asking ChatGPT to help rebuild:

1. **Start with PetVisual component:**
   - "Help me rebuild the PetVisual component based on this context..."
   - Provide current PetGameScene.tsx as reference
   - Ask for TypeScript implementation with idle animations

2. **Then build Environment System:**
   - "Now help me create the environment rendering system..."
   - Specify requirements for each environment type
   - Ask for integration with PetVisual

3. **Create Configuration System:**
   - "Help me build the configuration and resolver system..."
   - Specify pet-to-environment mappings
   - Ask for TypeScript types and pure functions

4. **Integrate Everything:**
   - "Help me integrate these components into PetGameScene..."
   - Show current PetGameScene
   - Ask for refactoring to use new system

5. **Add Performance Optimizations:**
   - "Help me rebuild the performance utilities..."
   - Request lazy loading, route preloading, etc.

---

## 📊 Lost Commits Reference

**Total Lost Commits:** 23

**Key Commits (in order):**
1. Refactor environment system to be pet-config driven
2. Add cat and panda environments using shared environment system
3. Load environment dynamically based on selected pet
4. Stabilize multi-pet environment system end-to-end
5. Update performance report, frontend components, and add performance indexes migration
6. Add centralized pet and environment configuration files
7. Add pure environment resolver function
8. Integrate environment resolver into PetGameScene
9. Create environment shell components
10. Integrate EnvironmentRenderer into PetGameScene
11. Create PetVisual component for visual-only pet rendering
12. Integrate PetVisual into PetGameScene
13. Add subtle idle animations to PetVisual component
14. Add environment-specific visual theming to PetVisual
15. Integrate environment prop into PetVisual in PetGameScene
16. Update pet visual components and frontend configuration

---

## ✅ Success Criteria

The rebuild will be successful when:

1. ✅ PetVisual component exists and renders pets with animations
2. ✅ EnvironmentRenderer exists and renders appropriate environments
3. ✅ Configuration system exists with pet/environment mappings
4. ✅ PetGameScene uses new components (PetVisual + EnvironmentRenderer)
5. ✅ Multiple pet types show different environments
6. ✅ Idle animations work smoothly
7. ✅ Environment theming affects pet appearance
8. ✅ Performance optimizations are restored
9. ✅ Build system is modernized
10. ✅ Everything is fully typed with TypeScript
11. ✅ Code follows project patterns and style

---

## 📞 Additional Context

- **Competition:** FBLA Intro to Programming
- **Deadline:** Important to restore quickly
- **Team:** Solo or small team development
- **Repository:** `rtirumala2025/fbla-project` on GitHub
- **Current Branch:** `main`
- **Last Stable Commit:** `94290a8e6ebef073a9a6123d35aac9d5f775756a`

---

**End of Context Document**

Use this document as the foundation when asking ChatGPT for help rebuilding the lost features. Provide specific file paths, show current code when asking about integration, and reference the design principles and architecture patterns outlined above.

