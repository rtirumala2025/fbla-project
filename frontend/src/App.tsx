import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SoundProvider } from './contexts/SoundContext';
import { PetProvider } from './context/PetContext';
import { FinancialProvider } from './context/FinancialContext';
import { PetAutoSync } from './components/sync/PetAutoSync';
import { StoreSync } from './components/sync/StoreSync';
import Header from './components/Header';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import OnboardingTutorial from './components/OnboardingTutorial';
import TooltipGuide from './components/TooltipGuide';
import { useGameLoop } from './hooks/useGameLoop';
// import { preloadCriticalRoutes, preloadRelatedRoutes } from './utils/routePreloader';
import { isDev } from './utils/env';
import './styles/globals.css';

import { Pages } from './pages/pageRegistry';

// Page transition wrapper component with Suspense for lazy loading
// Optimized: Skip animations in development for faster iteration
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {isDev() ? (
        <>{children}</>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
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

  console.log('ProtectedRoute check:', {
    currentUser: !!currentUser,
    loading,
    hasPet,
    isTransitioning,
    currentPath: window.location.pathname
  });

  if (loading) {
    console.log('ProtectedRoute: Still loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: During transition state, allow access to prevent redirect loops
  // This allows navigation to complete before route guards re-evaluate
  if (isTransitioning) {
    console.log('ProtectedRoute: In transition, allowing access');
    return <>{children}</>;
  }

  // If user is authenticated but doesn't have a pet, redirect to pet selection
  // This ensures users complete onboarding before accessing protected routes
  if (!hasPet) {
    console.log('ProtectedRoute: No pet, redirecting to pet-selection');
    return <Navigate to="/pet-selection" replace />;
  }

  console.log('ProtectedRoute: All checks passed, allowing access');
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

  // Start/stop game loop based on auth state
  useGameLoop(currentUser?.uid);

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

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Route preloading completely disabled to fix dynamic import conflicts
  useEffect(() => {
    // DISABLED: Route preloading was causing dynamic import errors
  }, []);

  useEffect(() => {
    // DISABLED: Route preloading was causing dynamic import errors
  }, [location.pathname]);

  // Handle chunk load errors - automatically reload page when chunks fail to load
  // This happens when webpack chunks are stale (e.g., after a new build)
  React.useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error;
      if (
        error &&
        (error.name === 'ChunkLoadError' ||
          (error.message && error.message.includes('Loading chunk') && error.message.includes('failed')))
      ) {
        console.warn('Chunk load error detected, reloading page...', error);
        // Reload the page to fetch fresh chunks
        window.location.reload();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (
        reason &&
        (reason.name === 'ChunkLoadError' ||
          (reason.message && reason.message.includes('Loading chunk') && reason.message.includes('failed')))
      ) {
        console.warn('Chunk load error detected in promise rejection, reloading page...', reason);
        // Reload the page to fetch fresh chunks
        window.location.reload();
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <PetProvider userId={currentUser?.uid || null}>
      <PetAutoSync />
      <StoreSync />
      <FinancialProvider user={currentUser}>
        {/* UX Enhancement Components */}
        <OnboardingTutorial autoStart={false} />
        <TooltipGuide enabled={true} />
        <div className="bg-cream text-charcoal flex flex-col h-screen overflow-hidden">
          <Header />
          <main className="bg-cream flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                {/* Public routes */}
                <Route path="/" element={<PublicRoute><PageTransition><Pages.LandingPage /></PageTransition></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><PageTransition><Pages.Login /></PageTransition></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><PageTransition><Pages.SignUp /></PageTransition></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><PageTransition><Pages.Register /></PageTransition></PublicRoute>} />
                <Route path="/auth/callback" element={<Pages.AuthCallback />} />

                {/* Setup profile route - accessible to authenticated users */}
                <Route path="/setup-profile" element={<SetupProfileRoute><PageTransition><Pages.SetupProfile /></PageTransition></SetupProfileRoute>} />

                {/* Protected routes - require authentication */}
                <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Pages.DashboardPage /></PageTransition></ProtectedRoute>} />
                <Route path="/game" element={<ProtectedRoute><PageTransition><Pages.GameUI /></PageTransition></ProtectedRoute>} />
                <Route
                  path="/pet-game"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <Pages.PetGame2Screen />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />

                <Route path="/shop" element={<ProtectedRoute><PageTransition><Pages.Shop /></PageTransition></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><PageTransition><Pages.Inventory /></PageTransition></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><PageTransition><Pages.ProfilePage /></PageTransition></ProtectedRoute>} />
                <Route path="/budget" element={<ProtectedRoute><PageTransition><Pages.BudgetDashboard /></PageTransition></ProtectedRoute>} />
                <Route path="/clean" element={<ProtectedRoute><PageTransition><Pages.CleanScreen /></PageTransition></ProtectedRoute>} />
                <Route path="/rest" element={<ProtectedRoute><PageTransition><Pages.RestScreen /></PageTransition></ProtectedRoute>} />
                <Route path="/health" element={<ProtectedRoute><PageTransition><Pages.HealthCheckScreen /></PageTransition></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><PageTransition><Pages.SettingsScreen /></PageTransition></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><PageTransition><Pages.HelpScreen /></PageTransition></ProtectedRoute>} />
                <Route path="/events" element={<ProtectedRoute><PageTransition><Pages.EventCalendarPage /></PageTransition></ProtectedRoute>} />
                <Route path="/social" element={<ProtectedRoute><PageTransition><Pages.SocialHub /></PageTransition></ProtectedRoute>} />
                <Route path="/social-features" element={<ProtectedRoute><PageTransition><Pages.SocialFeaturesPage /></PageTransition></ProtectedRoute>} />
                {/* Nationals-level features */}
                <Route path="/ar" element={<ProtectedRoute><PageTransition><Pages.ARPetModePage /></PageTransition></ProtectedRoute>} />

                <Route path="/finance-sim" element={<ProtectedRoute><PageTransition><Pages.FinanceSimulatorPage /></PageTransition></ProtectedRoute>} />
                {/* Wallet route removed - functionality integrated into Budget page */}
                {/* Quests route removed - functionality integrated into Dashboard page */}
                <Route
                  path="/nextgen"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <Pages.NextGenHub />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customize/avatar"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <Pages.AvatarStudio />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />

                {/* Mini-games */}
                <Route path="/minigames/fetch" element={<ProtectedRoute><PageTransition><Pages.FetchGame /></PageTransition></ProtectedRoute>} />
                <Route path="/minigames/puzzle" element={<ProtectedRoute><PageTransition><Pages.PuzzleGame /></PageTransition></ProtectedRoute>} />
                <Route path="/minigames/reaction" element={<ProtectedRoute><PageTransition><Pages.ReactionGame /></PageTransition></ProtectedRoute>} />
                <Route path="/minigames/dream" element={<ProtectedRoute><PageTransition><Pages.DreamWorld /></PageTransition></ProtectedRoute>} />
                <Route path="/minigames/memory" element={<ProtectedRoute><PageTransition><Pages.MemoryMatchGame /></PageTransition></ProtectedRoute>} />

                {/* Protected onboarding flow - only for users without pets */}
                <Route path="/onboarding/species" element={<OnboardingRoute><PageTransition><Pages.SpeciesSelection /></PageTransition></OnboardingRoute>} />
                <Route path="/onboarding/breed" element={<OnboardingRoute><PageTransition><Pages.BreedSelection /></PageTransition></OnboardingRoute>} />
                <Route path="/onboarding/naming" element={<OnboardingRoute><PageTransition><Pages.PetNaming /></PageTransition></OnboardingRoute>} />

                {/* Pet selection page - only for users without pets */}
                <Route path="/pet-selection" element={<OnboardingRoute><PageTransition><Pages.PetSelectionPage /></PageTransition></OnboardingRoute>} />
                {/* Simple pet creation page - alternative simpler flow */}
                <Route path="/create-pet" element={<OnboardingRoute><PageTransition><Pages.CreatePetPage /></PageTransition></OnboardingRoute>} />
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
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ThemeProvider>
            <SoundProvider>
              <AppContent />
            </SoundProvider>
          </ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;