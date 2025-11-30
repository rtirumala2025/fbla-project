import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { PetProvider } from './context/PetContext';
import { FinancialProvider } from './context/FinancialContext';
import { PetAutoSync } from './components/sync/PetAutoSync';
import Header from './components/Header';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import './styles/globals.css';

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const SignUp = lazy(() => import('./pages/Signup').then(m => ({ default: m.SignUp })));
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(m => ({ default: m.AuthCallback })));
const SetupProfile = lazy(() => import('./pages/SetupProfile').then(m => ({ default: m.SetupProfile })));
const SpeciesSelection = lazy(() => import('./pages/SpeciesSelection').then(m => ({ default: m.SpeciesSelection })));
const BreedSelection = lazy(() => import('./pages/BreedSelection').then(m => ({ default: m.BreedSelection })));
const PetNaming = lazy(() => import('./pages/PetNaming').then(m => ({ default: m.PetNaming })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const BudgetDashboard = lazy(() => import('./pages/budget/BudgetDashboard'));
const CleanScreen = lazy(() => import('./pages/clean/CleanScreen'));
const RestScreen = lazy(() => import('./pages/rest/RestScreen'));
const HealthCheckScreen = lazy(() => import('./pages/health/HealthCheckScreen'));
const SettingsScreen = lazy(() => import('./pages/settings/SettingsScreen'));
const HelpScreen = lazy(() => import('./pages/help/HelpScreen'));
const FetchGame = lazy(() => import('./pages/minigames/FetchGame'));
const PuzzleGame = lazy(() => import('./pages/minigames/PuzzleGame'));
const ReactionGame = lazy(() => import('./pages/minigames/ReactionGame'));
const DreamWorld = lazy(() => import('./pages/minigames/DreamWorld'));
const MemoryMatchGame = lazy(() => import('./pages/minigames/MemoryMatchGame'));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const EventCalendarPage = lazy(() => import('./pages/events/EventCalendarPage').then(m => ({ default: m.EventCalendarPage })));
const NextGenHub = lazy(() => import('./pages/nextgen/NextGenHub').then(m => ({ default: m.NextGenHub })));
const AvatarStudio = lazy(() => import('./pages/pets/AvatarStudio').then(m => ({ default: m.AvatarStudio })));
const PetSelectionPage = lazy(() => import('./pages/PetSelectionPage').then(m => ({ default: m.PetSelectionPage })));
const GameUI = lazy(() => import('./pages/GameUI').then(m => ({ default: m.GameUI })));
const SocialHub = lazy(() => import('./pages/social/SocialHub').then(m => ({ default: m.SocialHub })));

// Page transition wrapper component with Suspense for lazy loading
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {process.env.NODE_ENV === 'development' ? (
        <>{children}</>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.1, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      )}
    </Suspense>
  );
};

// Protected route component - requires authentication
// Redirects new users (without pets) to pet selection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, hasPet, isTransitioning } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: During transition state, allow access to prevent redirect loops
  // This allows navigation to complete before route guards re-evaluate
  if (isTransitioning) {
    return <>{children}</>;
  }

  // If user is authenticated but doesn't have a pet, redirect to pet selection
  // This ensures users complete onboarding before accessing protected routes
  if (!hasPet) {
    return <Navigate to="/pet-selection" replace />;
  }

  return <>{children}</>;
};

// Public route component - only accessible to unauthenticated users
// Redirects authenticated users to dashboard (or pet-selection if new)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, hasPet, isNewUser } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is authenticated, redirect them away from public pages
  if (currentUser) {
    // CRITICAL: New users without profiles should go to profile setup first
    if (isNewUser) {
      return <Navigate to="/setup-profile" replace />;
    }
    // Users without pets go to pet selection
    if (!hasPet) {
      return <Navigate to="/pet-selection" replace />;
    }
    // Existing users with pets go to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Onboarding route component - only accessible to authenticated users WITHOUT pets
// Prevents existing users from accessing pet selection
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, hasPet } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Must be authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user already has a pet, redirect to dashboard (prevent re-onboarding)
  if (hasPet) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Setup profile route component - accessible to authenticated users WITHOUT profiles
// Allows users to complete profile setup before pet selection
const SetupProfileRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, isNewUser, isTransitioning } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Must be authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: During transition, allow access
  if (isTransitioning) {
    return <>{children}</>;
  }

  // If user already has a profile (not new), redirect to appropriate page
  if (!isNewUser) {
    // User has profile - check if they need pet or can go to dashboard
    // Will be handled by ProtectedRoute or OnboardingRoute
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// App content component (needs to be inside AuthProvider to use useAuth)
function AppContent() {
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Apply background color to the root element
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('background-color', '#ffffff', 'important');
    document.body.style.backgroundColor = '#ffffff';
    
    return () => {
      root.style.removeProperty('background-color');
      document.body.style.removeProperty('background-color');
    };
  }, []);

  return (
    <PetProvider userId={currentUser?.uid || null}>
      <PetAutoSync />
      <FinancialProvider user={currentUser}>
        <div className="bg-cream text-charcoal">
        <Header />
        <main className="bg-cream">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/" element={<PublicRoute><PageTransition><LandingPage /></PageTransition></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><PageTransition><Login /></PageTransition></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><PageTransition><SignUp /></PageTransition></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><PageTransition><Register /></PageTransition></PublicRoute>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Setup profile route - accessible to authenticated users */}
            <Route path="/setup-profile" element={<SetupProfileRoute><PageTransition><SetupProfile /></PageTransition></SetupProfileRoute>} />
            
            {/* Protected routes - require authentication */}
            <Route path="/dashboard" element={<ProtectedRoute><PageTransition><DashboardPage /></PageTransition></ProtectedRoute>} />
            <Route path="/game" element={<ProtectedRoute><PageTransition><GameUI /></PageTransition></ProtectedRoute>} />
            <Route path="/shop" element={<ProtectedRoute><PageTransition><Shop /></PageTransition></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute><PageTransition><BudgetDashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/clean" element={<ProtectedRoute><PageTransition><CleanScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/rest" element={<ProtectedRoute><PageTransition><RestScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/health" element={<ProtectedRoute><PageTransition><HealthCheckScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><PageTransition><SettingsScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><PageTransition><HelpScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><PageTransition><EventCalendarPage /></PageTransition></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute><PageTransition><SocialHub /></PageTransition></ProtectedRoute>} />
            {/* Wallet route removed - functionality integrated into Budget page */}
            {/* Quests route removed - functionality integrated into Dashboard page */}
            <Route
              path="/nextgen"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <NextGenHub />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customize/avatar"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <AvatarStudio />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Mini-games */}
            <Route path="/minigames/fetch" element={<ProtectedRoute><PageTransition><FetchGame /></PageTransition></ProtectedRoute>} />
            <Route path="/minigames/puzzle" element={<ProtectedRoute><PageTransition><PuzzleGame /></PageTransition></ProtectedRoute>} />
            <Route path="/minigames/reaction" element={<ProtectedRoute><PageTransition><ReactionGame /></PageTransition></ProtectedRoute>} />
            <Route path="/minigames/dream" element={<ProtectedRoute><PageTransition><DreamWorld /></PageTransition></ProtectedRoute>} />
            <Route path="/minigames/memory" element={<ProtectedRoute><PageTransition><MemoryMatchGame /></PageTransition></ProtectedRoute>} />
            
            {/* Protected onboarding flow - only for users without pets */}
            <Route path="/onboarding/species" element={<OnboardingRoute><PageTransition><SpeciesSelection /></PageTransition></OnboardingRoute>} />
            <Route path="/onboarding/breed" element={<OnboardingRoute><PageTransition><BreedSelection /></PageTransition></OnboardingRoute>} />
            <Route path="/onboarding/naming" element={<OnboardingRoute><PageTransition><PetNaming /></PageTransition></OnboardingRoute>} />
            
            {/* Pet selection page - only for users without pets */}
            <Route path="/pet-selection" element={<OnboardingRoute><PageTransition><PetSelectionPage /></PageTransition></OnboardingRoute>} />
            {/* Legacy route redirect */}
            <Route path="/select-pet" element={<Navigate to="/pet-selection" replace />} />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
      </FinancialProvider>
    </PetProvider>
  );
}

// Main App component with AuthProvider and ToastProvider wrapper
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;