import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Layout Components
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// App Pages
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import SpeciesSelection from './pages/SpeciesSelection';
import BreedSelection from './pages/BreedSelection';
import PetNaming from './pages/PetNaming';
import Tutorial from './pages/Tutorial';
import Help from './pages/Help';
import DailyReport from './pages/DailyReport';
import Leaderboard from './pages/Leaderboard';
import Analytics from './pages/Analytics';

// Animation variants for page transitions
const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3,
};

function App() {
  const { currentUser, loading } = useAuth();

  // Show loading state while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={currentUser ? <Layout /> : <Navigate to="/login" />}
        >
          <Route
            index
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <Dashboard />
              </motion.div>
            }
          />
          <Route
            path="species-selection"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <SpeciesSelection />
              </motion.div>
            }
          />
          <Route
            path="breed-selection"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <BreedSelection />
              </motion.div>
            }
          />
          <Route
            path="pet-naming"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <PetNaming />
              </motion.div>
            }
          />
          <Route
            path="tutorial"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <Tutorial />
              </motion.div>
            }
          />
          <Route
            path="shop"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <Shop />
              </motion.div>
            }
          />
          <Route
            path="profile"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <Profile />
              </motion.div>
            }
          />
          <Route
            path="help"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <Help />
              </motion.div>
            }
          />
          <Route
            path="daily-report"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <DailyReport />
              </motion.div>
            }
          />
          <Route
            path="leaderboard"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <Leaderboard />
              </motion.div>
            }
          />
          <Route
            path="analytics"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 p-4"
              >
                <Analytics />
              </motion.div>
            }
          />
        </Route>

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
              <h1 className="text-4xl font-bold text-gray-800">404</h1>
              <p className="text-gray-600">Page not found</p>
            </div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
