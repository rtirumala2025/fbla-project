import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SpeciesSelection } from './pages/SpeciesSelection';
import { BreedSelection } from './pages/BreedSelection';
import { PetNaming } from './pages/PetNaming';
import { Dashboard } from './pages/Dashboard';
import { Shop } from './pages/Shop';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import './styles/globals.css';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public route component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // If user is logged in, redirect to dashboard from auth pages
  if (currentUser && ['/login', '/register'].includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
      
      {/* Protected onboarding flow */}
      <Route path="/onboarding/species" element={<ProtectedRoute><SpeciesSelection /></ProtectedRoute>} />
      <Route path="/onboarding/breed" element={<ProtectedRoute><BreedSelection /></ProtectedRoute>} />
      <Route path="/onboarding/naming" element={<ProtectedRoute><PetNaming /></ProtectedRoute>} />
      
      {/* TODO: Add these routes after creating the pages
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
      <Route path="/daily-report" element={<ProtectedRoute><DailyReport /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/minigames/fetch" element={<ProtectedRoute><FetchGame /></ProtectedRoute>} />
      */}
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
