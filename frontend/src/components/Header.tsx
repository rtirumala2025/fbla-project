import { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Home, ShoppingCart, Package, PawPrint, BarChart3, Settings, Gamepad2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmationModal } from './ui/ConfirmationModal';

const Header = memo(() => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

  // Get auth state
  const { currentUser, signOut, loading } = useAuth();


  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMoreMenuOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown]')) {
          setIsMoreMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);


  const handleLogout = useCallback(() => {
    setShowSignOutConfirm(true);
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
  }, []);

  const confirmLogout = useCallback(async () => {
    try {
      await signOut();
      // No need for navigation here - signOut() redirects
    } catch (error) {
      window.location.href = '/login';
    }
  }, [signOut]);

  // Navigation links for authenticated users only (Profile link removed - shown as welcome message)
  // Consolidated to 6 essential tabs for cleaner, focused navigation
  const authenticatedNavLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: <Home size={20} /> },
    { name: 'Pet Game', to: '/pet-game', icon: <Gamepad2 size={20} /> },
    { name: 'Budget', to: '/budget', icon: <BarChart3 size={20} /> },

    { name: 'Settings', to: '/settings', icon: <Settings size={20} /> },
  ];

  // Navigation links for public users (anchor links to landing page sections)
  const publicNavLinks = [
    { name: 'Features', to: '#features' },
    { name: 'How It Works', to: '#how-it-works' },
    { name: 'AI Technology', to: '#ai' },
    { name: 'Pricing', to: '#pricing' },
  ];

  return (
    <header
      className={`sticky top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white/90'
        } text-black border-b border-gray-100 h-16`}
    >
      <div className="w-full max-w-full mx-auto px-4 lg:px-6 h-full relative">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Left Section - Logo */}
          <NavLink
            to="/"
            className="flex items-center space-x-2 group flex-shrink-0 min-w-0"
          >
            <PawPrint className="h-6 w-6 text-indigo-600 group-hover:text-indigo-700 transition-colors flex-shrink-0" />
            <span className="text-xl font-bold text-black truncate">
              Companion
            </span>
          </NavLink>

          {/* Center Section - Navigation (hidden on smaller screens, visible on xl+) */}
          {!loading && currentUser && (
            <nav className="hidden xl:flex items-center justify-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 h-full">
              <div className="flex items-center gap-1 h-full">
                {authenticatedNavLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    <span>{link.name}</span>
                  </NavLink>
                ))}
              </div>
            </nav>
          )}

          {/* Right Section - Profile Button / Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0 min-w-0">
            {/* Show auth buttons when not logged in */}
            {!loading && !currentUser ? (
              <div className="hidden xl:flex items-center gap-3">
                <NavLink
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-black transition-colors whitespace-nowrap"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Get Started
                </NavLink>
              </div>
            ) : null}

            {/* Welcome message with profile link: Only show when logged in */}
            {!loading && currentUser ? (
              <>
                {/* Welcome message for logged-in users - clickable to go to profile, visible on all screens, positioned in corner */}
                <NavLink
                  to="/profile"
                  className="flex items-center text-xs sm:text-sm md:text-base text-gray-600 hover:text-indigo-600 min-w-0 transition-colors cursor-pointer"
                >
                  <span className="font-medium truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-none">
                    Welcome, {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}!
                  </span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="hidden xl:flex items-center gap-1 lg:gap-2 px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 xl:py-3 rounded-lg text-xs lg:text-sm xl:text-base font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors group whitespace-nowrap flex-shrink-0"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4 lg:h-5 lg:w-5 xl:h-5 xl:w-5 group-hover:animate-pulse flex-shrink-0" />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              </>
            ) : null}

            {/* Mobile menu button - visible on screens smaller than xl */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-black focus:outline-none transition-colors flex-shrink-0"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
            >
              <span className="sr-only">{isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - visible on screens smaller than xl */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="xl:hidden overflow-hidden bg-white border-t border-gray-200 shadow-lg max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            <div className="px-2 sm:px-4 pt-2 pb-4 space-y-1 max-w-full overflow-x-hidden">
              {/* Show page navigation for authenticated mobile users */}
              {currentUser && authenticatedNavLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors min-w-0 w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  <span className="truncate flex-1 min-w-0">{link.name}</span>
                </NavLink>
              ))}

              {currentUser ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Sign Out</span>
                </button>
              ) : (
                <>
                  <NavLink
                    to="/"
                    className="block px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors truncate"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </NavLink>

                  {/* Public navigation links */}
                  {publicNavLinks.map((link) => (
                    <a
                      key={link.to}
                      href={link.to}
                      className="block px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors truncate"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        const target = document.querySelector(link.to);
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      {link.name}
                    </a>
                  ))}

                  {/* Divider before auth buttons */}
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <NavLink
                      to="/login"
                      className="block px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors truncate"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </NavLink>
                    <NavLink
                      to="/signup"
                      className="block px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 rounded-lg transition-opacity mx-2 mt-2 text-center truncate"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get Started
                    </NavLink>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <ConfirmationModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={confirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Stay"
      />
    </header >
  );
});

Header.displayName = 'Header';

export default Header;
