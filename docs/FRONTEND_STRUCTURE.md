# Frontend Structure - FBLA Virtual Pet Companion

**Version:** 1.0.0  
**Last Updated:** January 2025

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Component Architecture](#component-architecture)
3. [State Management](#state-management)
4. [Routing](#routing)
5. [API Integration](#api-integration)
6. [Styling System](#styling-system)
7. [Feature Modules](#feature-modules)
8. [Hooks & Utilities](#hooks--utilities)

---

## Directory Structure

```
frontend/src/
├── api/                    # API client modules
│   ├── httpClient.ts       # Base HTTP client with interceptors
│   ├── pets.ts            # Pet API endpoints
│   ├── quests.ts          # Quest API endpoints
│   ├── finance.ts         # Finance API endpoints
│   ├── social.ts          # Social API endpoints
│   └── ...
├── components/            # Reusable UI components
│   ├── pets/              # Pet-specific components
│   ├── quests/            # Quest components
│   ├── shop/              # Shop components
│   ├── ai/                # AI chat components
│   ├── ui/                # Generic UI elements
│   └── sync/              # Sync components
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # Authentication state
│   ├── PetContext.tsx     # Pet state (legacy)
│   ├── FinancialContext.tsx
│   ├── ThemeContext.tsx   # Theme management
│   └── ToastContext.tsx   # Notification system
├── features/              # Feature modules
│   ├── ar/                # AR pet mode
│   ├── habits/            # Habit prediction
│   ├── finance_sim/       # Finance simulator
│   ├── onboarding/        # Onboarding flow
│   ├── quests/            # Quest features
│   ├── social/            # Social features
│   └── voice/             # Voice commands
├── hooks/                 # Custom React hooks
│   ├── useAuthActions.ts
│   ├── useGameLoop.ts
│   ├── useStoreSync.ts
│   └── ...
├── pages/                 # Route-level components
│   ├── DashboardPage.tsx
│   ├── Shop.tsx
│   ├── quests/
│   ├── social/
│   └── ...
├── services/              # Business logic services
│   ├── petService.ts
│   ├── shopService.ts
│   ├── syncService.ts
│   └── ...
├── store/                 # Zustand global state
│   └── useAppStore.ts
├── types/                 # TypeScript definitions
│   ├── pet.ts
│   ├── quests.ts
│   ├── finance.ts
│   └── ...
└── utils/                 # Utility functions
    ├── aiAdapters.ts
    ├── authHelpers.ts
    └── ...
```

---

## Component Architecture

### Component Categories

#### 1. Pages (Route Components)

**Location:** `pages/`

Pages are top-level route components that compose features and components:

```typescript
// pages/DashboardPage.tsx
export function DashboardPage() {
  const { pet, stats } = usePet();
  
  return (
    <Layout>
      <PetDisplay pet={pet} />
      <PetCarePanel stats={stats} />
      <QuestBoard />
    </Layout>
  );
}
```

**Key Pages:**
- `DashboardPage.tsx` - Main pet care dashboard
- `Shop.tsx` - Shopping interface
- `Inventory.tsx` - User inventory
- `quests/QuestDashboard.tsx` - Quest management
- `social/SocialHub.tsx` - Social features hub
- `analytics/AnalyticsDashboard.tsx` - Analytics view

#### 2. Feature Components

**Location:** `components/pets/`, `components/quests/`, etc.

Domain-specific reusable components:

```typescript
// components/pets/PetCarePanel.tsx
export function PetCarePanel() {
  const { stats, updateStats } = usePet();
  
  const handleFeed = async () => {
    const result = await feedPet();
    updateStats(result.stats);
  };
  
  return (
    <div>
      <StatBar stat={stats.hunger} />
      <Button onClick={handleFeed}>Feed</Button>
    </div>
  );
}
```

**Component Groups:**
- **Pets:** `PetDisplay`, `PetCarePanel`, `PetInteractionPanel`, `EvolutionAnimation`
- **Quests:** `QuestBoard`, `QuestCard`, `RewardClaimAnimation`
- **Shop:** `ShopItem`, `ShoppingCart`, `PurchaseButton`
- **AI:** `AIChat`, `BudgetAdvisorAI`, `CoachPanel`

#### 3. UI Components

**Location:** `components/ui/`

Generic, reusable UI elements:

- `LoadingSpinner` - Loading indicators
- `Button` - Styled buttons
- `Card` - Card containers
- `Modal` - Modal dialogs
- `Toast` - Notification toasts
- `ProgressBar` - Progress indicators

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }))} {...props} />
  );
}
```

---

## State Management

### Three-Tier State Architecture

#### 1. Component State (useState)

**Use Case:** Local UI state, form inputs, temporary display state

```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
```

#### 2. Context State (React Context)

**Use Case:** Shared state across component trees

```typescript
// contexts/AuthContext.tsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Contexts:**
- `AuthContext` - Authentication state
- `ThemeContext` - Theme preferences
- `ToastContext` - Notification system
- `PetContext` - Pet state (legacy, migrating to Zustand)

#### 3. Global State (Zustand)

**Use Case:** Normalized entity cache, cross-feature state

```typescript
// store/useAppStore.ts
interface AppStore {
  // Entities (normalized by ID)
  pets: Record<string, Pet>;
  quests: Record<string, Quest>;
  inventory: Record<string, InventoryItem>;
  
  // Relationships
  userQuestProgress: Record<string, UserQuest>;
  
  // Actions
  updatePet: (pet: Pet) => void;
  completeQuest: (questId: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  pets: {},
  quests: {},
  
  updatePet: (pet) => set((state) => ({
    pets: { ...state.pets, [pet.id]: pet }
  })),
}));
```

**Normalized State Pattern:**
- Entities stored by ID in maps
- Relationships via foreign keys
- Selectors for derived state
- Immutable updates

---

## Routing

### Route Configuration

**Location:** `App.tsx`

```typescript
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/shop" element={<Shop />} />
    <Route path="/quests" element={<QuestDashboard />} />
    <Route path="/social" element={<SocialHub />} />
  </Route>
</Routes>
```

### Lazy Loading

All pages are lazy-loaded for code splitting:

```typescript
const DashboardPage = lazy(() => 
  import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);

const QuestDashboard = lazy(() => import('./pages/quests/QuestDashboard'));
```

### Route Guards

**ProtectedRoute Component:**
- Checks authentication
- Redirects to login if not authenticated
- Handles pet creation requirement
- Shows loading state during checks

```typescript
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, hasPet } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!currentUser) return <Navigate to="/login" />;
  if (!hasPet) return <Navigate to="/onboarding" />;
  
  return children;
};
```

---

## API Integration

### HTTP Client

**Location:** `api/httpClient.ts`

Base client with interceptors:

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      logout();
    }
    return Promise.reject(error);
  }
);
```

### API Modules

**Structure:**
- One module per domain (pets, quests, finance, etc.)
- Type-safe request/response types
- Error handling

```typescript
// api/quests.ts
export async function getActiveQuests(): Promise<ActiveQuestsResponse> {
  const response = await apiRequest<ActiveQuestsResponse>({
    url: '/api/quests',
    method: 'GET',
  });
  return response;
}

export async function completeQuest(questId: string): Promise<QuestCompletionResponse> {
  const response = await apiRequest<QuestCompletionResponse>({
    url: '/api/quests/complete',
    method: 'POST',
    data: { quest_id: questId },
  });
  return response;
}
```

### Supabase Integration

Direct Supabase client for real-time features:

```typescript
// lib/supabase.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Real-time subscription
supabase
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

---

## Styling System

### Tailwind CSS

**Configuration:** `tailwind.config.js`

Primary styling approach with utility classes:

```typescript
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold text-gray-900">Pet Stats</h2>
  <Button variant="primary">Feed</Button>
</div>
```

### Design System

**Location:** `styles/design-system.css`

Custom CSS variables and design tokens:

```css
:root {
  --color-primary: #5C45C2;
  --color-secondary: #E26A2C;
  --spacing-unit: 0.25rem;
  --border-radius: 0.5rem;
}
```

### Component Variants

Using `class-variance-authority` for component variants:

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark',
        secondary: 'bg-secondary text-white hover:bg-secondary-dark',
      },
      size: {
        sm: 'px-2 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
      },
    },
  }
);
```

---

## Feature Modules

### Feature Structure

Each feature is self-contained with:

```
features/quests/
├── DailyChallenge.tsx    # Main component
├── index.ts              # Public exports
└── README.md             # Feature documentation
```

### Key Features

#### 1. Quest System (`features/quests/`)

**Components:**
- `DailyChallenge.tsx` - Daily quest display and management

**Hooks:**
- `useQuestProgress` - Quest progress tracking
- `useQuestRewards` - Reward claiming logic

#### 2. Social Features (`features/social/`)

**Components:**
- `FriendsList.tsx` - Friend list display
- `Leaderboard.tsx` - Leaderboard rankings
- `PublicProfiles.tsx` - Discover profiles
- `AddFriendModal.tsx` - Friend request modal

#### 3. AR Pet Mode (`features/ar/`)

**Components:**
- `ARPetMode.tsx` - AR pet visualization

**Technology:**
- Three.js for 3D rendering
- WebXR for AR support

#### 4. Voice Commands (`features/voice/`)

**Components:**
- `VoiceCommandUI.tsx` - Voice command interface

**Technology:**
- Web Speech API
- Natural language processing

---

## Hooks & Utilities

### Custom Hooks

#### useGameLoop

**Purpose:** Periodic pet stat updates

```typescript
export function useGameLoop() {
  useEffect(() => {
    const interval = setInterval(() => {
      updatePetStats();
      checkQuestProgress();
      syncWithBackend();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);
}
```

#### useStoreSync

**Purpose:** Sync Zustand store with database

```typescript
export function useStoreSync() {
  useEffect(() => {
    // Initial load
    loadInitialState();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('store-updates')
      .on('postgres_changes', handleUpdate)
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, []);
}
```

#### useAuthActions

**Purpose:** Authentication actions

```typescript
export function useAuthActions() {
  const { setUser } = useAuth();
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data.user) {
      setUser(data.user);
    }
    
    return { data, error };
  };
  
  return { login, logout, signup };
}
```

### Utilities

#### AI Adapters

**Location:** `utils/aiAdapters.ts`

Normalize AI responses to consistent format:

```typescript
export function adaptBudgetAdvisorResponse(aiResponse: any): BudgetAdvisorResponse {
  return {
    advice: aiResponse.message || aiResponse.advice || '',
    forecast: aiResponse.forecast || [],
    // ... normalization logic
  };
}
```

#### Request Cache

**Location:** `utils/requestCache.ts`

Cache API responses for performance:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();

export async function cachedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

---

## Performance Optimizations

### Code Splitting

- Route-based splitting (pages lazy-loaded)
- Component-based splitting (heavy features lazy-loaded)
- Dynamic imports for large libraries

### Memoization

- `React.memo` for expensive components
- `useMemo` for derived calculations
- `useCallback` for stable function references

### Virtual Scrolling

- Implemented for long lists (leaderboards, quest lists)
- Reduces DOM nodes and improves performance

### Image Optimization

- Lazy loading images
- WebP format with fallbacks
- Responsive image sizes

---

## Testing Structure

### Test Organization

```
src/__tests__/
├── components/        # Component tests
├── hooks/            # Hook tests
├── services/         # Service tests
├── integration/      # Integration tests
└── store/            # Store tests
```

### Testing Tools

- **Jest** - Test runner
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW** - API mocking

---

## Build & Development

### Development Server

```bash
cd frontend
npm install
npm run dev  # Vite dev server on port 5173
```

### Production Build

```bash
npm run build  # Outputs to dist/
npm run preview  # Preview production build
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

---

**Document Status:** ✅ Complete  
**Review Date:** January 2025
