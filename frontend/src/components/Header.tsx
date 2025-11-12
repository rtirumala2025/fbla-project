import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Home, ShoppingCart, User, PawPrint, Heart, Gamepad2, DollarSign, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
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


  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Navigation links for all users - for testing purposes
  const allNavLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: <Home size={20} /> },
    { name: 'Feed', to: '/feed', icon: <Heart size={20} /> },
    { name: 'Play', to: '/play', icon: <Gamepad2 size={20} /> },
    { name: 'Earn', to: '/earn', icon: <DollarSign size={20} /> },
    { name: 'Budget', to: '/budget', icon: <BarChart3 size={20} /> },
    { name: 'Shop', to: '/shop', icon: <ShoppingCart size={20} /> },
    { name: 'Profile', to: '/profile', icon: <User size={20} /> },
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
      } text-black border-b border-gray-100`}
    >
      <div className="max-w-[95vw] mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Section - Logo */}
          <NavLink to="/" className="flex items-center space-x-3 group flex-shrink-0">
            <PawPrint className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
            <span className="text-2xl font-bold text-black">Companion</span>
          </NavLink>

          {/* Center Section - Navigation (always visible for demo access) */}
          <nav className="hidden lg:flex items-center justify-center flex-1 mx-12">
            <div className="flex items-center gap-6">
              {allNavLinks.map((link) => (
                <NavLink 
                  key={link.to}
                  to={link.to} 
                  className={({ isActive }) => `flex items-center gap-2 px-5 py-3 rounded-lg text-base font-semibold transition-all ${
                    isActive 
                      ? 'text-white bg-indigo-600 shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Right Section - Auth Buttons */}
          <div className="flex items-center gap-6 flex-shrink-0">
            {!loading && currentUser ? (
              <>
                {/* Welcome message for logged-in users */}
                <div className="hidden lg:block text-sm text-gray-600">
                  <span className="font-medium">Welcome, {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}! 👋</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden lg:flex items-center gap-2 px-5 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors group"
                >
                  <LogOut size={20} className="group-hover:animate-pulse" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="hidden lg:block px-5 py-3 rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/signup"
                  className="hidden lg:block px-5 py-3 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity shadow-lg hover:shadow-indigo-500/20"
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
              {/* Show page navigation for mobile users */}
              {allNavLinks.map((link) => (
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

              {currentUser ? (
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
                          to="/signup"
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
