import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Home, ShoppingCart, User, PawPrint } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
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

  if (loading) {
    return (
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </header>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Navigation links for authenticated users (with icons)
  const authNavLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: <Home size={18} className="mr-2" /> },
    { name: 'Shop', to: '/shop', icon: <ShoppingCart size={18} className="mr-2" /> },
    { name: 'Profile', to: '/profile', icon: <User size={18} className="mr-2" /> },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg' : 'bg-white/90'
      } text-black`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2 group">
            <PawPrint className="h-6 w-6 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
            <span className="text-xl font-bold text-black">Companion</span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {currentUser ? (
              // Authenticated user navigation with icons
              authNavLinks.map((link) => (
                <NavLink 
                  key={link.to}
                  to={link.to} 
                  className={({ isActive }) => `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-white bg-indigo-600' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </NavLink>
              ))
            ) : (
              // Public navigation (anchor links)
              publicNavLinks.map((link) => (
                <a
                  key={link.to}
                  href={link.to}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black transition-colors relative group"
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.querySelector(link.to);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  {link.name}
                  <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </a>
              ))
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors group"
              >
                <LogOut size={16} className="mr-2 group-hover:animate-pulse" />
                <span>Sign Out</span>
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="hidden md:block px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="hidden md:block px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity shadow-lg hover:shadow-indigo-500/20"
                >
                  Get Started
                </NavLink>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-black focus:outline-none transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-white border-t border-gray-200 shadow-lg"
          >
            <div className="px-2 pt-2 pb-4 space-y-1">
              {currentUser ? (
                <>
                  {authNavLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.icon}
                      {link.name}
                    </NavLink>
                  ))}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={18} className="mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/"
                    className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </NavLink>
                  
                  {/* Public navigation links */}
                  {publicNavLinks.map((link) => (
                    <a
                      key={link.to}
                      href={link.to}
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors"
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
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </NavLink>
                    <NavLink
                      to="/register"
                      className="block px-4 py-3 text-center text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 rounded-lg transition-opacity mx-2 mt-2"
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
    </header>
  );
};

export default Header;
