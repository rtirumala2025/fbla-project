# Complete Technology Stack Audit Report

**Generated:** $(date)  
**Project:** Virtual Pet Application (FBLA Project)  
**Audit Scope:** Complete codebase analysis of all technologies, frameworks, libraries, APIs, and tools

---

## Executive Summary

This project is a full-stack web application with:
- **Frontend:** React 18 + TypeScript SPA using Create React App (react-scripts)
- **Backend:** FastAPI (Python) with async/await architecture
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **AI Services:** OpenRouter (Llama 4) and OpenAI (image generation)
- **Testing:** Playwright (E2E), Jest (unit), Pytest (backend)
- **Build Tools:** react-scripts (Webpack), Babel, TypeScript compiler

---

## 1. Frontend Technologies

### Core Framework & Language
- **React** `^18.2.0`
  - File: `frontend/package.json`
  - Usage: Primary UI framework throughout `frontend/src/`
  - Features: Hooks, Context API, Error Boundaries

- **React DOM** `^18.2.0`
  - File: `frontend/package.json`
  - Usage: DOM rendering in `frontend/src/main.tsx`

- **TypeScript** `^4.9.5`
  - File: `frontend/package.json`, `frontend/tsconfig.json`
  - Configuration: `frontend/tsconfig.json` (ES5 target, React JSX, path aliases)
  - Usage: All frontend source files in `frontend/src/`

### Build Tools & Bundlers
- **react-scripts** `5.0.1`
  - File: `frontend/package.json`
  - Usage: Build system (wraps Webpack, Babel, ESLint)
  - Scripts: `start`, `build`, `test`, `eject`
  - Note: Uses Webpack under the hood (not directly configured)

- **Babel** (via react-scripts)
  - File: `frontend/package-lock.json` (transitive dependency)
  - Usage: JavaScript/TypeScript transpilation
  - Plugins: React JSX transform, ES6+ features

- **Webpack** (via react-scripts)
  - File: `frontend/package-lock.json` (transitive dependency)
  - Usage: Module bundling, code splitting, asset management

### Routing
- **react-router-dom** `^6.18.0`
  - File: `frontend/package.json`
  - Usage: Client-side routing in `frontend/src/App.tsx`
  - Routes: Dashboard, Login, Register, Shop, Games, Profile, etc.

### State Management
- **Zustand** `^4.4.7`
  - File: `frontend/package.json`
  - Usage: Lightweight state management (likely for pet state or global state)

- **React Context API**
  - Files: `frontend/src/contexts/` directory
  - Contexts:
    - `AuthContext.tsx` - Authentication state
    - `PetContext.tsx` - Pet data and interactions
    - `FinancialContext.tsx` - Finance/wallet state
    - `SupabaseContext.tsx` - Supabase client
    - `SyncContext.tsx` - Offline sync state
    - `ThemeContext.tsx` - Theme preferences
    - `ToastContext.tsx` - Toast notifications
    - `SoundContext.tsx` - Sound effects

### UI Libraries & Styling
- **Tailwind CSS**
  - File: `frontend/tailwind.config.js`
  - Usage: Utility-first CSS framework throughout components
  - Configuration: Custom colors, animations, theme extensions
  - Custom theme: Primary (#FF8B5A), Secondary (#FFD166), Accent (#06D6A0)

- **Framer Motion** `^10.16.4`
  - File: `frontend/package.json`
  - Usage: Animation library in components (e.g., `frontend/src/pages/Login.tsx`, `frontend/src/components/Header.tsx`)
  - Features: Page transitions, component animations

- **Lucide React** `^0.546.0`
  - File: `frontend/package.json`
  - Usage: Icon library throughout UI components
  - Examples: `frontend/src/components/Header.tsx`, `frontend/src/config/appNavigation.ts`

- **React Icons** `^4.12.0`
  - File: `frontend/package.json`
  - Usage: Additional icon sets

- **classnames** `^2.5.1`
  - File: `frontend/package.json`
  - Usage: Conditional CSS class management

### 3D Graphics
- **Three.js** `^0.181.2`
  - File: `frontend/package.json`
  - Usage: 3D pet visualization
  - Files: `frontend/src/components/pets/Pet3D.tsx`, `frontend/src/components/pets/Pet3DVisualization.tsx`

- **@react-three/fiber** `^8.18.0`
  - File: `frontend/package.json`
  - Usage: React renderer for Three.js
  - Files: `frontend/src/components/pets/Pet3D.tsx`

- **@react-three/drei** `^9.122.0`
  - File: `frontend/package.json`
  - Usage: Helper components for React Three Fiber
  - Components: OrbitControls, PerspectiveCamera, Environment, Text

### Data Visualization
- **Recharts** `^2.15.4`
  - File: `frontend/package.json`
  - Usage: Chart library for analytics
  - Files: `frontend/src/components/analytics/ExpensePieChart.tsx`, `frontend/src/components/analytics/TrendChart.tsx`
  - Types: `@types/recharts` `^1.8.29`

### HTTP Clients
- **Axios** `^1.6.2`
  - File: `frontend/package.json`
  - Usage: HTTP client for API requests
  - Files: `frontend/src/services/apiClient.ts`
  - Features: Interceptors, automatic token injection

- **Native Fetch API**
  - Usage: HTTP requests in `frontend/src/api/httpClient.ts`
  - Features: Custom wrapper with token refresh, retry logic

### Utilities
- **dayjs** `^1.11.18`
  - File: `frontend/package.json`
  - Usage: Date manipulation and formatting
  - Files: `frontend/src/services/analyticsService.ts`, `frontend/src/components/pets/PetCarePanel.tsx`, `frontend/src/components/finance/FinancePanel.tsx`

- **canvas-confetti** `^1.9.3`
  - File: `frontend/package.json`
  - Usage: Confetti animations (likely for achievements/rewards)
  - Types: `@types/canvas-confetti` `^1.6.4`

- **ajv** `^6.12.6` & **ajv-keywords** `^3.5.2`
  - File: `frontend/package.json`
  - Usage: JSON schema validation

- **web-vitals** `^2.1.4`
  - File: `frontend/package.json`
  - Usage: Web performance metrics

### Notifications
- **react-hot-toast** `^2.6.0`
  - File: `frontend/package.json`
  - Usage: Toast notifications

- **react-toastify** `^10.0.4`
  - File: `frontend/package.json`
  - Usage: Alternative/additional toast notifications

### Type Definitions
- **@types/node** `^20.10.5`
- **@types/react** `^18.2.42`
- **@types/react-dom** `^18.2.18`
- **@types/classnames** `^2.3.4`
- **@types/canvas-confetti** `^1.6.4`
- **@types/recharts** `^1.8.29`

---

## 2. Backend Technologies

### Core Framework
- **FastAPI** `0.104.1`
  - File: `requirements.txt`, `backend/app/main.py`
  - Usage: ASGI web framework
  - Features: Automatic OpenAPI docs, async/await support, dependency injection
  - Entry point: `backend/app/main.py`

- **Python** `3.12+` (inferred from requirements)
  - Usage: Backend language
  - Files: All `.py` files in `backend/`

- **Uvicorn** `0.24.0.post1` (with `[standard]`)
  - File: `requirements.txt`
  - Usage: ASGI server for FastAPI
  - Configuration: Used in `playwright.config.ts` for E2E tests

### Database & ORM
- **SQLAlchemy** `2.0.36`
  - File: `requirements.txt`
  - Usage: Python SQL toolkit and ORM
  - Files: `backend/app/core/database.py`
  - Features: Async support, connection pooling

- **asyncpg** (via psycopg)
  - File: `requirements.txt` (psycopg[binary]==3.2.12)
  - Usage: Async PostgreSQL driver
  - Files: `backend/app/utils/dependencies.py`, `backend/app/services/*.py`
  - Connection: `postgresql+asyncpg://` URLs

- **PostgreSQL** (via Supabase)
  - File: `env.example`, `backend/app/core/config.py`
  - Usage: Primary database
  - Connection: Managed by Supabase
  - Features: Row-Level Security (RLS), realtime subscriptions

- **Alembic**
  - File: `backend/alembic/env.py`
  - Usage: Database migration tool
  - Configuration: `backend/alembic/env.py`
  - Note: Migrations primarily handled via Supabase SQL files

### Authentication & Security
- **python-jose[cryptography]** `3.3.0`
  - File: `requirements.txt`
  - Usage: JWT token encoding/decoding
  - Files: `backend/app/middleware/authentication.py`

- **Supabase Auth** (via Supabase JS SDK)
  - File: `backend/app/services/auth_service.py`
  - Usage: User authentication, OAuth (Google), session management
  - Integration: Supabase Auth API

### Data Validation
- **Pydantic** `1.10.14`
  - File: `requirements.txt`
  - Usage: Data validation using Python type annotations
  - Files: `backend/app/schemas/`, `backend/app/core/config.py`
  - Features: Settings management, request/response models

- **pydantic-settings** (inferred)
  - Usage: Settings management (BaseSettings)
  - File: `backend/app/core/config.py`

### HTTP Client
- **httpx** `0.25.1`
  - File: `requirements.txt`
  - Usage: Async HTTP client for external API calls
  - Files: `backend/app/services/ai_service.py`, `backend/app/services/pet_art_service.py`
  - APIs: OpenRouter, OpenAI

### Utilities
- **python-dotenv** `1.0.0`
  - File: `requirements.txt`
  - Usage: Environment variable management
  - Files: `backend/app/core/config.py`

- **python-multipart** `0.0.6`
  - File: `requirements.txt`
  - Usage: Form data parsing for FastAPI

- **greenlet** `3.2.4`
  - File: `requirements.txt`
  - Usage: Lightweight coroutines (SQLAlchemy dependency)

---

## 3. Database & Storage

### Primary Database
- **Supabase (PostgreSQL)**
  - Files: `supabase/migrations/*.sql`, `frontend/src/lib/supabase.ts`
  - Usage: Primary database and backend-as-a-service
  - Features:
    - PostgreSQL database with RLS
    - Authentication (email/password, OAuth)
    - Realtime subscriptions
    - Storage buckets (avatars)
    - Edge Functions (Deno runtime)
  - Migrations: 12 SQL migration files in `supabase/migrations/`
  - Tables: users, profiles, pets, accessories, finance, quests, games, analytics, etc.

### Database Driver
- **psycopg[binary]** `3.2.12`
  - File: `requirements.txt`
  - Usage: PostgreSQL adapter for Python
  - Note: Includes asyncpg for async operations

### Migration Tools
- **Alembic** (Python)
  - File: `backend/alembic/env.py`
  - Usage: Database schema versioning (though Supabase SQL migrations are primary)

- **Supabase CLI** (implied)
  - Usage: Migration management (`supabase db push`)
  - Files: `supabase/MIGRATION_INSTRUCTIONS.md`

---

## 4. External APIs & Services

### AI Services
- **OpenRouter API**
  - Files: `backend/app/services/pet_ai_service.py`, `backend/app/core/config.py`
  - Usage: LLM API gateway for Llama 4 model
  - Model: `openrouter/llama-4-11b-instruct-scout`
  - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
  - Features: AI chat, pet interactions, mood prediction

- **OpenAI API**
  - Files: `backend/app/services/pet_art_service.py`, `backend/app/core/config.py`
  - Usage: Image generation for pet art
  - Model: `gpt-image-1` (custom model name)
  - Endpoint: `https://api.openai.com/v1/images/generations`
  - Features: AI-generated pet artwork, caching

### Email Services
- **Resend API** (primary)
  - File: `supabase/functions/send-welcome-email/index.ts`
  - Usage: Transactional email sending
  - Endpoint: `https://api.resend.com/emails`
  - Features: Welcome emails, HTML templates

- **SendGrid API** (fallback)
  - File: `supabase/functions/send-welcome-email/index.ts`
  - Usage: Email sending via SendGrid
  - Endpoint: `https://api.sendgrid.com/v3/mail/send`

- **Mailgun API** (fallback)
  - File: `supabase/functions/send-welcome-email/index.ts`
  - Usage: Email sending via Mailgun
  - Endpoint: `https://api.mailgun.net/v3/{domain}/messages`

- **SMTP** (fallback)
  - File: `supabase/functions/send-welcome-email/index.ts`
  - Usage: Generic SMTP email sending
  - Configuration: Via environment variables

### Weather API
- **Weather API** (implied)
  - Files: `env.example`, `backend/app/core/config.py`
  - Usage: Weather data for pet reactions
  - Configuration: `WEATHER_API_KEY` environment variable
  - Service: `backend/app/services/weather_service.py`

### Authentication Provider
- **Google OAuth**
  - Files: `frontend/src/pages/Login.tsx`, `backend/app/services/auth_service.py`
  - Usage: Social authentication
  - Integration: Via Supabase Auth

---

## 5. Testing Technologies

### End-to-End Testing
- **Playwright** `^1.56.1`
  - Files: `package.json`, `playwright.config.ts`, `e2e/` directory
  - Usage: E2E browser testing
  - Configuration: `playwright.config.ts`
  - Browsers: Chromium (desktop, mobile, tablet)
  - Features: Screenshots, videos, traces, HTML reports

- **@playwright/test** `^1.56.1`
  - Files: `package.json`, `frontend/package.json`
  - Usage: Playwright test runner

### Frontend Unit Testing
- **Jest** (via react-scripts)
  - Files: `frontend/package.json` (via react-scripts)
  - Usage: JavaScript testing framework
  - Configuration: Via react-scripts defaults

- **@testing-library/react** `^13.4.0`
  - Files: `frontend/package.json`
  - Usage: React component testing utilities

- **@testing-library/jest-dom** `^5.17.0`
  - Files: `frontend/package.json`
  - Usage: Custom Jest matchers for DOM

- **@testing-library/user-event** `^13.5.0`
  - Files: `frontend/package.json`
  - Usage: User interaction simulation

- **jest-axe** `^9.0.0`
  - Files: `frontend/package.json`
  - Usage: Accessibility testing

### Backend Testing
- **pytest** `8.3.2`
  - Files: `requirements.txt`, `pytest.ini`
  - Usage: Python testing framework
  - Configuration: `pytest.ini`
  - Test directory: `backend/tests/`

- **pytest-asyncio** `0.23.7`
  - Files: `requirements.txt`
  - Usage: Async test support for pytest

- **pytest-cov** `4.1.0`
  - Files: `requirements.txt`
  - Usage: Code coverage reporting
  - Configuration: `pytest.ini` (85% coverage threshold)

### Code Quality
- **ESLint** (via react-scripts)
  - Files: `frontend/package.json`
  - Usage: JavaScript/TypeScript linting
  - Configuration: `frontend/package.json` (react-app, react-app/jest)

- **Ruff** `0.7.1`
  - Files: `requirements.txt`
  - Usage: Python linter and formatter
  - Usage: `npm run lint` (checks Python code)

---

## 6. Development Tools & Scripts

### Package Managers
- **npm**
  - Files: `package.json`, `package-lock.json`
  - Usage: Node.js package management

- **pip**
  - Files: `requirements.txt`
  - Usage: Python package management

### Environment Management
- **dotenv** `^17.2.3` (root)
  - Files: `package.json`
  - Usage: Environment variable loading

- **python-dotenv** `1.0.0` (backend)
  - Files: `requirements.txt`
  - Usage: Python environment variable management

### Type Checking
- **TypeScript Compiler**
  - Files: `frontend/tsconfig.json`
  - Usage: Type checking for frontend
  - Configuration: Strict mode, path aliases, ES5 target

---

## 7. Deployment & Infrastructure

### Edge Functions
- **Deno Runtime**
  - Files: `supabase/functions/send-welcome-email/index.ts`, `supabase/functions/send-welcome-email/deno.json`
  - Usage: Supabase Edge Functions
  - Features: Welcome email sending, serverless execution

### Supabase Services
- **Supabase Storage**
  - Usage: File storage (avatars bucket)
  - Configuration: `SUPABASE_STORAGE_BUCKET=avatars`
  - Files: `backend/app/core/config.py`, `frontend/src/lib/supabase.ts`

- **Supabase Realtime**
  - Files: `frontend/src/hooks/useFinanceRealtime.ts`, `frontend/src/hooks/useAccessoriesRealtime.ts`
  - Usage: Real-time database subscriptions
  - Features: Live updates for finance, accessories, pet data

### Build Configuration
- **Browserslist**
  - Files: `frontend/package.json`
  - Usage: Browser compatibility targets
  - Configuration: Production (>0.2%, not dead), Development (latest Chrome/Firefox/Safari)

---

## 8. Architectural Patterns

### Frontend Architecture
- **Component-Based Architecture**
  - Structure: `frontend/src/components/` organized by feature
  - Patterns: Functional components, hooks, context providers

- **Feature-Based Routing**
  - Structure: `frontend/src/pages/` with route components
  - Patterns: Protected routes, lazy loading (implied)

- **Service Layer Pattern**
  - Files: `frontend/src/services/`
  - Services: `apiClient.ts`, `analyticsService.ts`, `earnService.ts`, `minigameService.ts`, `petService.ts`, `profileService.ts`, `seasonalService.ts`, `shopService.ts`

- **API Client Abstraction**
  - Files: `frontend/src/api/`
  - Pattern: Centralized API clients with error handling
  - Clients: `httpClient.ts`, `accessories.ts`, `analytics.ts`, `art.ts`, `finance.ts`, `games.ts`, `nextGen.ts`, `pets.ts`, `quests.ts`, `sync.ts`

### Backend Architecture
- **Layered Architecture**
  - Structure:
    - `routers/` - API endpoints
    - `services/` - Business logic
    - `models/` - Data models
    - `schemas/` - Pydantic validation
    - `core/` - Configuration, database, security

- **Dependency Injection**
  - Pattern: FastAPI dependency system
  - Files: `backend/app/utils/dependencies.py`

- **Middleware Pattern**
  - Files: `backend/app/middleware/`
  - Middleware: Authentication, error handling, CORS

- **Repository Pattern** (implied)
  - Pattern: Service layer abstracts database access
  - Files: `backend/app/services/`

### Database Architecture
- **Row-Level Security (RLS)**
  - Usage: Supabase PostgreSQL RLS policies
  - Files: `supabase/migrations/*.sql`

- **Migration-Based Schema Management**
  - Pattern: Versioned SQL migrations
  - Files: `supabase/migrations/000_core_schema.sql` through `012_welcome_email_trigger.sql`

---

## 9. Configuration Files

### Frontend Configuration
- `frontend/package.json` - Dependencies and scripts
- `frontend/tsconfig.json` - TypeScript compiler configuration
- `frontend/tailwind.config.js` - Tailwind CSS configuration
- `frontend/.eslintrc` (implied via package.json) - ESLint configuration

### Backend Configuration
- `requirements.txt` - Python dependencies
- `pytest.ini` - Pytest configuration
- `backend/alembic/env.py` - Alembic migration environment
- `backend/app/core/config.py` - Application settings (Pydantic)

### Root Configuration
- `package.json` - Root npm scripts and dev dependencies
- `playwright.config.ts` - Playwright E2E test configuration
- `env.example` - Environment variable template
- `.gitignore` (implied) - Git ignore patterns

### Supabase Configuration
- `supabase/functions/send-welcome-email/deno.json` - Deno/Edge Function config
- `supabase/migrations/*.sql` - Database schema migrations

---

## 10. Notable Dependencies & Utilities

### Frontend Utilities
- **tslib** `^2.8.1` (root)
  - Files: `package.json`
  - Usage: TypeScript runtime library

### Backend Utilities
- **greenlet** `3.2.4`
  - Files: `requirements.txt`
  - Usage: Lightweight coroutines (SQLAlchemy dependency)

---

## 11. Build & Development Scripts

### Frontend Scripts (from `frontend/package.json`)
- `start` - Development server (react-scripts start)
- `build` - Production build (react-scripts build)
- `test` - Run tests (react-scripts test)
- `test:integration` - Integration tests
- `test:e2e` - E2E tests (Playwright)
- `lint` - ESLint check
- `eject` - Eject from Create React App

### Root Scripts (from `package.json`)
- `lint` - Lint frontend and backend
- `test` - Run all tests (frontend + backend)

### Backend Scripts (implied)
- Uvicorn server: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Pytest: `pytest` (with coverage)

---

## 12. File Structure Summary

### Key Directories
- `frontend/src/` - React application source
- `backend/app/` - FastAPI application source
- `backend/tests/` - Python test suite
- `e2e/` - Playwright E2E tests
- `supabase/migrations/` - Database migrations
- `supabase/functions/` - Edge Functions (Deno)
- `docs/` - Documentation files

---

## 13. Technology Versions Summary

### Frontend Core
- React: 18.2.0
- TypeScript: 4.9.5
- react-scripts: 5.0.1

### Backend Core
- FastAPI: 0.104.1
- Python: 3.12+ (inferred)
- SQLAlchemy: 2.0.36
- Pydantic: 1.10.14

### Testing
- Playwright: 1.56.1
- Pytest: 8.3.2
- Jest: (via react-scripts, ~27.5.1)

### Database
- PostgreSQL (via Supabase)
- psycopg: 3.2.12

---

## 14. Likely Technologies (Inferred)

### Build Tools (via react-scripts)
- **Webpack** - Module bundler (not directly configured)
- **Babel** - JavaScript compiler (not directly configured)
- **PostCSS** - CSS processing (likely used by Tailwind)

### Development Server
- **Webpack Dev Server** (via react-scripts) - Development server

### Code Generation
- **OpenAPI/Swagger** (via FastAPI) - API documentation
  - Endpoints: `/docs`, `/redoc`, `/openapi.json`

---

## 15. Missing/Uncertain Technologies

### Not Found
- **Vite** - Mentioned in some docs but project uses react-scripts
- **Next.js** - Not used (pure React SPA)
- **Redux** - Not used (Zustand + Context API instead)
- **Material-UI / MUI** - Not used (Tailwind CSS instead)
- **Bootstrap** - Not used (Tailwind CSS instead)
- **GraphQL** - Not used (REST API)
- **WebSocket** - Not directly used (Supabase Realtime handles this)

### Uncertain
- **PostCSS** - Likely used by Tailwind but not explicitly configured
- **Autoprefixer** - Likely used by Tailwind but not explicitly configured

---

## Conclusion

This is a modern full-stack application using:
- **Frontend:** React 18 + TypeScript with Create React App, Tailwind CSS, Framer Motion, Three.js
- **Backend:** FastAPI (Python) with async/await, SQLAlchemy, Pydantic
- **Database:** Supabase (PostgreSQL) with RLS, Realtime, Storage, Edge Functions
- **AI:** OpenRouter (Llama 4) and OpenAI (image generation)
- **Testing:** Playwright (E2E), Jest (frontend), Pytest (backend)
- **Deployment:** Supabase Edge Functions (Deno), likely Vercel/Netlify for frontend

The stack emphasizes modern async patterns, type safety (TypeScript + Pydantic), and comprehensive testing coverage.

---

**End of Audit Report**

