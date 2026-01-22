import { motion } from 'framer-motion';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';

const Header = ({ onSignUpClick, user, onLogout, onViewDashboard, onNavigateHome }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Portfolio', href: '#portfolio' },
  ];

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        // Always show at top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        setIsVisible(false);
      } else {
        // Scrolling up - show header
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Handle mouse movement - show header when mouse is at top
    const handleMouseMove = (e) => {
      if (e.clientY < 100) {
        // Mouse is near top of screen
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [lastScrollY]);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-1.5 transition-all duration-300 ${isVisible ? 'header-visible' : 'header-hidden'
        }`}
      initial={{ y: -100 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <span className="text-lg font-black text-gray-900 tracking-tight">Callix</span>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (item.label === 'Home') {
                  e.preventDefault();
                  onNavigateHome?.();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  onNavigateHome?.();
                }
              }}
              className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
            </motion.a>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            /* User Profile Dropdown */
            <div className="relative">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#000080] hover:bg-blue-900 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User size={20} />
                <span className="hidden md:inline">{user.user_metadata?.full_name || user.email}</span>
              </motion.button>

              {showUserMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                    <p className="font-semibold text-gray-900">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onViewDashboard();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center space-x-2 text-gray-700 font-medium"
                  >
                    <LayoutDashboard size={18} />
                    <span>My Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-2 text-red-600 font-medium"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.button
              onClick={onSignUpClick}
              className="px-4 py-1.5 rounded-lg bg-[#000080] hover:bg-blue-900 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all hidden md:block"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In / Sign Up
            </motion.button>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 hover:text-purple-600 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          className="md:hidden mt-4 bg-white rounded-2xl p-4 space-y-3 shadow-2xl"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors py-2"
              onClick={(e) => {
                setIsMenuOpen(false);
                if (item.label === 'Home') {
                  e.preventDefault();
                  onNavigateHome?.();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  onNavigateHome?.();
                }
              }}
            >
              {item.label}
            </a>
          ))}

          {user ? (
            <>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onViewDashboard();
                }}
                className="w-full px-6 py-2.5 rounded-xl bg-blue-500 text-white font-bold flex items-center justify-center space-x-2"
              >
                <LayoutDashboard size={18} />
                <span>My Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center space-x-2"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onSignUpClick();
              }}
              className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg"
            >
              Sign In / Sign Up
            </button>
          )}
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
