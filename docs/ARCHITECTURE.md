# System Architecture - FBLA Virtual Pet Companion

**Version:** 1.0.0  
**Last Updated:** January 2025

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Layers](#system-layers)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Architecture](#database-architecture)
6. [API Design](#api-design)
7. [Authentication & Security](#authentication--security)
8. [State Management](#state-management)
9. [Real-time Features](#real-time-features)
10. [AI Integration](#ai-integration)
11. [Deployment Architecture](#deployment-architecture)
12. [Design Patterns](#design-patterns)

---

## Architecture Overview

The Virtual Pet Companion follows a **layered, service-oriented architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│  React SPA with Zustand State, Context Providers, Hooks     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS + JWT
┌────────────────────▼────────────────────────────────────────┐
│                  API Gateway Layer                           │
│  FastAPI with Authentication Middleware, CORS, Error Handler │
└────────────────────┬────────────────────────────────────────┘
                     │ REST/JSON
┌────────────────────▼────────────────────────────────────────┐
│                   Router Layer                               │
│  Domain-specific routers (auth, pets, finance, quests, etc.) │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Service Layer                              │
│  Business logic, AI integration, data transformations       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                Data Access Layer                             │
│  Supabase Client, Async Database Queries, Models            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Database Layer                              │
│  PostgreSQL with RLS policies, Realtime subscriptions       │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns:** Clear boundaries between UI, business logic, and data
2. **Single Responsibility:** Each module has one well-defined purpose
3. **Dependency Injection:** Services receive dependencies through constructors
4. **API-First Design:** RESTful endpoints with OpenAPI documentation
5. **Stateless Backend:** JWT tokens for authentication, no server-side sessions
6. **Type Safety:** TypeScript frontend, Python type hints backend
7. **Real-time Updates:** Supabase Realtime for live stat changes
8. **Offline Support:** IndexedDB caching for offline functionality

---

## System Layers

### 1. Presentation Layer (Frontend)

**Technology:** React 18, TypeScript, Tailwind CSS

**Responsibilities:**
- User interface rendering
- User input handling
- Client-side routing
- Local state management
- UI animations and transitions

**Key Components:**
- **Pages:** Route-level components (Dashboard, Shop, Profile)
- **Components:** Reusable UI elements (Buttons, Cards, Forms)
- **Contexts:** Global state providers (Auth, Pet, Theme)
- **Hooks:** Custom React hooks for data fetching and state
- **Services:** API clients and utility functions

### 2. Application Layer (Frontend)

**Technology:** Zustand, React Context, Custom Hooks

**Responsibilities:**
- Application state management
- Business logic coordination
- API communication
- Cache management
- Error handling

**Patterns:**
- **Container/Presenter:** Separates logic from presentation
- **Custom Hooks:** Encapsulates reusable logic
- **Context API:** Provides global state to tree
- **Zustand Store:** Normalized global state for pet, quests, inventory

### 3. API Gateway Layer (Backend)

**Technology:** FastAPI, Uvicorn

**Responsibilities:**
- Request routing
- Authentication verification
- Request/response transformation
- Error handling
- Rate limiting
- CORS management

**Middleware Stack:**
1. CORS Middleware
2. Authentication Middleware (JWT)
3. Error Handling Middleware
4. Request Logging Middleware

### 4. Business Logic Layer (Backend)

**Technology:** Python Services

**Responsibilities:**
- Domain logic implementation
- Data validation
- Business rule enforcement
- AI service integration
- External API communication

**Service Architecture:**
- **Pet Service:** Pet care, stat management, evolution
- **Quest Service:** Quest generation, progress tracking, rewards
- **Finance Service:** Transactions, budgets, goals
- **AI Service:** LLM integration, response normalization
- **Social Service:** Friends, leaderboards, profiles

### 5. Data Access Layer

**Technology:** AsyncPG, Supabase Client

**Responsibilities:**
- Database queries
- Data mapping
- Connection management
- Transaction handling

**Patterns:**
- Repository pattern for data access abstraction
- Connection pooling for performance
- Prepared statements for security
- Async/await for non-blocking I/O

### 6. Data Layer

**Technology:** PostgreSQL (Supabase)

**Responsibilities:**
- Data persistence
- Data integrity
- Access control (RLS)
- Real-time subscriptions

**Features:**
- Row-Level Security (RLS) policies
- Database triggers for automated updates
- Indexes for query optimization
- Foreign key constraints for referential integrity

---

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── pets/           # Pet-specific components
│   ├── shop/           # Shop-related components
│   ├── quests/         # Quest components
│   └── ui/             # Generic UI elements
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   ├── PetContext.tsx
│   └── FinancialContext.tsx
├── features/           # Feature modules
│   ├── ar/            # AR pet mode
│   ├── habits/        # Habit prediction
│   └── voice/         # Voice commands
├── hooks/             # Custom React hooks
├── pages/             # Route-level components
├── services/          # API clients and business logic
├── store/             # Zustand global state
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### State Management Strategy

**Multi-layered State Approach:**

1. **Component State (useState):**
   - Local UI state (form inputs, modal visibility)
   - Temporary display state
   - Non-shared state

2. **Context State (React Context):**
   - Authentication state
   - Theme preferences
   - User profile data
   - Cross-component shared state

3. **Global State (Zustand):**
   - Pet stats and inventory
   - Quest progress
   - Coin balance
   - Normalized entity cache

4. **Server State (React Query / Custom Hooks):**
   - API response caching
   - Background refetching
   - Optimistic updates

### Component Architecture

**Pattern:** Container/Presenter Pattern

```typescript
// Container (Logic)
const PetDashboardContainer = () => {
  const { pet, stats } = usePet();
  const { fetchQuests } = useQuests();
  
  useEffect(() => {
    fetchQuests();
  }, []);
  
  return <PetDashboardPresentation pet={pet} stats={stats} />;
};

// Presenter (UI)
const PetDashboardPresentation = ({ pet, stats }) => {
  return (
    <div>
      <PetDisplay pet={pet} />
      <StatsPanel stats={stats} />
    </div>
  );
};
```

### Code Splitting Strategy

- **Route-based splitting:** Each page lazy-loaded
- **Component-based splitting:** Large components (AR mode, games) lazy-loaded
- **Dynamic imports:** Heavy libraries loaded on demand

```typescript
const ARPetMode = lazy(() => import('./features/ar/ARPetMode'));
const FinanceSimulator = lazy(() => import('./features/finance_sim/FinanceSimulator'));
```

---

## Backend Architecture

### Directory Structure

```
backend/app/
├── core/              # Core utilities
│   ├── config.py      # Settings management
│   ├── database.py    # DB connection
│   └── errors.py      # Error handlers
├── middleware/        # Request middleware
│   ├── authentication.py
│   └── error_handler.py
├── models/           # Domain models
│   ├── pet.py
│   ├── quest.py
│   └── user.py
├── routers/          # API endpoints
│   ├── auth.py
│   ├── pets.py
│   └── quests.py
├── schemas/          # Pydantic schemas
│   ├── pet.py
│   └── quest.py
└── services/         # Business logic
    ├── pet_service.py
    └── quest_service.py
```

### Service Layer Pattern

Each service encapsulates domain logic:

```python
class PetService:
    def __init__(self, db_pool: asyncpg.Pool):
        self._pool = db_pool
    
    async def get_pet(self, user_id: str) -> PetResponse:
        # Data access logic
        # Business rule enforcement
        # Response transformation
        pass
    
    async def apply_action(self, user_id: str, action: PetAction) -> PetActionResponse:
        # Validation
        # Stat calculation
        # Evolution checks
        # Database update
        pass
```

### Router Pattern

Routers are thin controllers that delegate to services:

```python
@router.post("/actions/{action}")
async def perform_action(
    action: PetAction,
    request: PetActionRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> PetActionResponse:
    service = PetService(get_db_pool())
    return await service.apply_action(user.id, action, request)
```

---

## Database Architecture

### Schema Organization

**Core Tables:**
- `users` - Authentication (Supabase managed)
- `profiles` - User profile data
- `pets` - Pet entities and stats
- `user_preferences` - User settings

**Feature Tables:**
- `quests` - Quest definitions
- `user_quests` - Quest progress
- `shop_items` - Catalog
- `pet_inventory` - User inventory
- `finance_wallets` - Coin balances
- `transactions` - Purchase history
- `friend_requests` - Social connections
- `leaderboard_entries` - Rankings

### Row-Level Security (RLS)

Every table has RLS policies:

```sql
-- Users can only read their own pets
CREATE POLICY "Users can view own pets"
ON pets FOR SELECT
USING (auth.uid() = user_id);

-- Users can only update their own pets
CREATE POLICY "Users can update own pets"
ON pets FOR UPDATE
USING (auth.uid() = user_id);
```

### Index Strategy

**Performance indexes:**
- Primary keys (automatic)
- Foreign keys (user_id, pet_id)
- Frequently queried columns (username, email)
- Composite indexes for complex queries

```sql
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_user_quests_user_quest ON user_quests(user_id, quest_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at DESC);
```

---

## API Design

### RESTful Principles

- **Resource-based URLs:** `/api/pets`, `/api/quests`
- **HTTP Methods:** GET (read), POST (create), PATCH (update), DELETE (delete)
- **Stateless:** No server-side sessions
- **JSON responses:** Consistent structure

### Endpoint Structure

```
/api
├── /auth          # Authentication
│   ├── POST /signup
│   ├── POST /login
│   └── POST /refresh
├── /pets          # Pet management
│   ├── GET /      # Get user's pet
│   ├── POST /     # Create pet
│   └── POST /actions/{action}
├── /quests        # Quest system
│   ├── GET /      # Get active quests
│   ├── GET /daily # Get daily challenges
│   └── POST /complete
└── /shop          # Shop system
    ├── GET /items
    └── POST /purchase
```

### Response Format

**Success Response:**
```json
{
  "result": {
    "pet": { ... },
    "coins_awarded": 50
  }
}
```

**Error Response:**
```json
{
  "detail": "Pet not found",
  "status_code": 404
}
```

### OpenAPI Documentation

FastAPI auto-generates OpenAPI schema:
- `/docs` - Swagger UI
- `/redoc` - ReDoc UI
- `/openapi.json` - JSON schema

---

## Authentication & Security

### Authentication Flow

1. **Registration:**
   - User signs up via Supabase Auth
   - Backend creates profile record
   - JWT token returned

2. **Login:**
   - Credentials validated by Supabase
   - JWT token issued
   - Token stored in localStorage (frontend)

3. **Request Authentication:**
   - Frontend sends token in `Authorization: Bearer <token>`
   - Backend middleware validates token
   - User identity extracted from token

### Security Measures

1. **JWT Tokens:**
   - Signed with secret key
   - Short expiration (15 minutes)
   - Refresh token mechanism

2. **HTTPS Only:**
   - All API calls over HTTPS
   - Secure cookie flags
   - HSTS headers

3. **Input Validation:**
   - Pydantic schemas validate all inputs
   - SQL injection prevention (parameterized queries)
   - XSS prevention (output escaping)

4. **Rate Limiting:**
   - Per-user rate limits
   - Per-endpoint limits
   - DDoS protection

---

## State Management

### Frontend State Architecture

**Zustand Store Structure:**

```typescript
interface AppStore {
  // Entities
  pets: Record<string, Pet>;
  quests: Record<string, Quest>;
  inventory: Record<string, InventoryItem>;
  
  // Relationships
  userQuestProgress: Record<string, UserQuest>;
  
  // Derived state
  activeQuests: Quest[];
  coinBalance: number;
  
  // Actions
  updatePet: (pet: Pet) => void;
  completeQuest: (questId: string) => void;
}
```

**Normalized State Pattern:**
- Entities stored by ID in maps
- Relationships via foreign keys
- Selectors for derived state
- Immutable updates

### Backend State

**Stateless Design:**
- No server-side sessions
- All state in database
- Cache for performance (Redis optional)

---

## Real-time Features

### Supabase Realtime

**Subscriptions:**
- Pet stat changes
- Quest progress updates
- Friend request notifications
- Leaderboard updates

**Implementation:**
```typescript
const subscription = supabase
  .channel('pet-stats')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pets',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    updatePetStats(payload.new);
  })
  .subscribe();
```

### Game Loop

**Frontend Game Loop:**
- Runs every 30 seconds
- Updates pet stats (decay)
- Checks quest completion
- Syncs with backend

**Backend Scheduled Tasks:**
- Daily quest reset (midnight UTC)
- Streak calculations
- Leaderboard updates

---

## AI Integration

### Architecture

```
Frontend Request
    ↓
Backend Router (/api/ai/chat)
    ↓
AI Service
    ↓
OpenRouter API (LLM)
    ↓
Response Normalization
    ↓
Frontend Adapter
    ↓
UI Display
```

### Response Normalization

All AI responses normalized to consistent schema:

```python
class AIChatResponse(BaseModel):
    session_id: str
    message: str
    mood: str
    notifications: List[str]
    pet_state: PetState
    health_forecast: HealthForecast
```

### Error Handling

- Fallback responses if AI unavailable
- Retry logic with exponential backoff
- Cached responses for common queries

---

## Deployment Architecture

### Production Setup

```
┌─────────────────┐
│   CDN / Vercel  │  (Frontend)
└────────┬────────┘
         │
┌────────▼────────┐
│   Load Balancer │
└────────┬────────┘
         │
┌────────▼────────┐
│  FastAPI Server │  (Backend - Render/Railway)
└────────┬────────┘
         │
┌────────▼────────┐
│  Supabase DB    │  (Database + Auth + Storage)
└─────────────────┘
```

### Environment Separation

- **Development:** Local servers, dev database
- **Staging:** Production-like environment for testing
- **Production:** Live environment for users

### Scaling Considerations

- **Horizontal Scaling:** Multiple backend instances behind load balancer
- **Database Connection Pooling:** Shared pool across instances
- **CDN Caching:** Static assets cached globally
- **Database Indexes:** Optimized for common queries

---

## Design Patterns

### Patterns Used

1. **Repository Pattern:**
   - Data access abstraction
   - Database-agnostic service layer

2. **Service Layer Pattern:**
   - Business logic encapsulation
   - Reusable across endpoints

3. **Dependency Injection:**
   - Services receive dependencies
   - Easier testing and mocking

4. **Factory Pattern:**
   - Service creation
   - Configuration management

5. **Observer Pattern:**
   - Real-time subscriptions
   - Event-driven updates

6. **Strategy Pattern:**
   - Different AI models
   - Payment methods

7. **Adapter Pattern:**
   - AI response normalization
   - External API integration

---

## Performance Optimizations

### Frontend

- Code splitting and lazy loading
- Image optimization and lazy loading
- Memoization for expensive computations
- Virtual scrolling for long lists
- Debounced API calls

### Backend

- Database connection pooling
- Query optimization with indexes
- Response caching for static data
- Async I/O for non-blocking operations
- Pagination for large datasets

### Database

- Indexed columns for fast lookups
- Query optimization with EXPLAIN
- Connection pooling
- Prepared statements
- Materialized views for aggregations

---

## Error Handling Strategy

### Frontend

- **Error Boundaries:** Catch React errors
- **Toast Notifications:** User-friendly error messages
- **Retry Logic:** Automatic retry for transient failures
- **Offline Detection:** Graceful degradation

### Backend

- **Exception Handlers:** Centralized error handling
- **HTTP Status Codes:** Proper status code usage
- **Error Logging:** Structured logging for debugging
- **Validation Errors:** Detailed field-level errors

---

**Document Status:** ✅ Complete  
**Review Date:** January 2025
