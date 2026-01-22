import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useState } from 'react';

const Header = ({ onSignUpClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'Operations', href: '#operations' },
  ];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 glass px-6 py-4"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-cyan to-vibrant-magenta flex items-center justify-center">
            <span className="text-xl font-bold">AI</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Calling Agent</span>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-white/80 hover:text-electric-cyan transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
            </motion.a>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <motion.button
            onClick={onSignUpClick}
            className="px-6 py-2 rounded-lg bg-vibrant-magenta text-white font-semibold glow-magenta hover:opacity-90 transition-opacity hidden md:block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign Up
          </motion.button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white/80 hover:text-electric-cyan"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          className="md:hidden mt-4 glass-strong rounded-lg p-4 space-y-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block text-sm font-medium text-white/80 hover:text-electric-cyan transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <button
            onClick={() => {
              setIsMenuOpen(false);
              onSignUpClick();
            }}
            className="w-full px-6 py-2 rounded-lg bg-vibrant-magenta text-white font-semibold glow-magenta hover:opacity-90 transition-opacity"
          >
            Sign Up
          </button>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;