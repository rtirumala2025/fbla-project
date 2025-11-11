import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { PetProvider } from './context/PetContext';
import Header from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SignUp } from './pages/Signup';
import { AuthCallback } from './pages/AuthCallback';
import { SetupProfile } from './pages/SetupProfile';
import { SpeciesSelection } from './pages/SpeciesSelection';
import { BreedSelection } from './pages/BreedSelection';
import { PetNaming } from './pages/PetNaming';
import { Dashboard } from './pages/Dashboard';
import { Shop } from './pages/Shop';
import BudgetDashboard from './pages/budget/BudgetDashboard';
import FeedScreen from './pages/feed/FeedScreen';
import CleanScreen from './pages/clean/CleanScreen';
import PlayScreen from './pages/play/PlayScreen';
import RestScreen from './pages/rest/RestScreen';
import HealthCheckScreen from './pages/health/HealthCheckScreen';
import EarnMoneyScreen from './pages/earn/EarnMoneyScreen';
import SettingsScreen from './pages/settings/SettingsScreen';
import HelpScreen from './pages/help/HelpScreen';
import FetchGame from './pages/minigames/FetchGame';
import PuzzleGame from './pages/minigames/PuzzleGame';
import ReactionGame from './pages/minigames/ReactionGame';
import DreamWorld from './pages/minigames/DreamWorld';
import { ProfilePage } from './pages/ProfilePage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import './styles/globals.css';

// Page transition wrapper component
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, isNewUser, isTransitioning } = useAuth();
  const location = useLocation();

  // Don't check auth while still loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // During transition (post-profile creation), allow navigation without redirects
  if (isTransitioning) {
    return <>{children}</>;
  }

  // If user is new and not on setup-profile page, redirect to setup
  if (isNewUser && location.pathname !== '/setup-profile') {
    return <Navigate to="/setup-profile" replace />;
  }

  // If user is not new and on setup-profile page, redirect to dashboard
  if (!isNewUser && location.pathname === '/setup-profile') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public route component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isNewUser } = useAuth();
  const location = useLocation();

  // If user is logged in, redirect appropriately
  if (currentUser) {
    if (['/login', '/register', '/signup'].includes(location.pathname)) {
      // Redirect new users to setup, returning users to dashboard
      return <Navigate to={isNewUser ? "/setup-profile" : "/dashboard"} replace />;
    }
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
            <Route path="/setup-profile" element={<ProtectedRoute><PageTransition><SetupProfile /></PageTransition></ProtectedRoute>} />
            
            {/* Protected routes - require authentication */}
            <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/shop" element={<ProtectedRoute><PageTransition><Shop /></PageTransition></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute><PageTransition><BudgetDashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><PageTransition><FeedScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/clean" element={<ProtectedRoute><PageTransition><CleanScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/play" element={<ProtectedRoute><PageTransition><PlayScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/rest" element={<ProtectedRoute><PageTransition><RestScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/health" element={<ProtectedRoute><PageTransition><HealthCheckScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/earn" element={<ProtectedRoute><PageTransition><EarnMoneyScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><PageTransition><SettingsScreen /></PageTransition></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><PageTransition><HelpScreen /></PageTransition></ProtectedRoute>} />

            {/* Mini-games */}
            <Route path="/minigames/fetch" element={<ProtectedRoute><PageTransition><FetchGame /></PageTransition></ProtectedRoute>} />
            <Route path="/minigames/puzzle" element={<ProtectedRoute><PageTransition><PuzzleGame /></PageTransition></ProtectedRoute>} />
            <Route path="/minigames/reaction" element={<ProtectedRoute><PageTransition><ReactionGame /></PageTransition></ProtectedRoute>} />
            <Route path="/minigames/dream" element={<ProtectedRoute><PageTransition><DreamWorld /></PageTransition></ProtectedRoute>} />
            
            {/* Protected onboarding flow */}
            <Route path="/onboarding/species" element={<ProtectedRoute><PageTransition><SpeciesSelection /></PageTransition></ProtectedRoute>} />
            <Route path="/onboarding/breed" element={<ProtectedRoute><PageTransition><BreedSelection /></PageTransition></ProtectedRoute>} />
            <Route path="/onboarding/naming" element={<ProtectedRoute><PageTransition><PetNaming /></PageTransition></ProtectedRoute>} />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
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