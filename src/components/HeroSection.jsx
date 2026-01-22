import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Headphones, 
  Shield,
  Phone,
  PhoneCall
} from 'lucide-react';

const HeroSection = ({ onCallAgent }) => {
  const features = [
    { icon: BarChart3, label: 'Analytics', color: '#70d6ff' },
    { icon: Users, label: 'CRM', color: '#ff70a6' },
    { icon: MessageSquare, label: 'Omni-channel', color: '#9d8df1' },
    { icon: Headphones, label: 'Support', color: '#70d6ff' },
    { icon: Shield, label: 'Security', color: '#ff70a6' },
  ];

  return (
    <section id="features" className="min-h-screen flex items-center justify-center px-4 relative z-10 py-20 md:py-0">
      <div className="max-w-7xl mx-auto text-center">
        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            <span className="text-white">AI Calling</span>
            <br />
            <span className="text-gradient-cyan italic">Agent</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto">
            Next-generation voice intelligence platform with multilingual support
            <br className="hidden md:block" />
            and real-time conversational AI
          </p>
        </motion.div>

        {/* Orbital Section */}
        <div className="relative w-full h-96 md:h-[500px] flex items-center justify-center my-16">
          {/* Orbital Wrapper */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const angle = (360 / features.length) * index;
              const radius = 180; // Adjust for mobile responsiveness

              return (
                <motion.div
                  key={feature.label}
                  className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full glass-strong flex items-center justify-center border-2 border-white/20 z-10"
                  style={{
                    transform: `rotate(${-angle}deg) translateX(${radius}px) rotate(${angle}deg)`,
                  }}
                  whileHover={{ scale: 1.2 }}
                >
                  <Icon
                    size={24}
                    className="md:w-8 md:h-8"
                    style={{ color: feature.color }}
                  />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Central Call Agent Button */}
          <motion.button
            onClick={onCallAgent}
            className="relative z-20 w-32 h-32 md:w-40 md:h-40 rounded-full bg-vibrant-magenta text-white font-bold text-lg md:text-xl glow-magenta flex items-center justify-center shadow-2xl"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 20px rgba(255, 112, 166, 0.5)',
                '0 0 40px rgba(255, 112, 166, 0.8)',
                '0 0 20px rgba(255, 112, 166, 0.5)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex flex-col items-center space-y-2">
              <PhoneCall size={40} className="md:w-12 md:h-12" />
              <span className="hidden md:block">Call Agent</span>
              <span className="md:hidden text-sm">Call</span>
            </div>
          </motion.button>
        </div>

        {/* Features Grid (Mobile Alternative) */}
        <motion.div
          className="grid grid-cols-5 gap-4 md:hidden mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="glass rounded-lg p-3 flex flex-col items-center space-y-1"
              >
                <Icon size={20} style={{ color: feature.color }} />
                <span className="text-xs text-white/60">{feature.label}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="mt-12 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={onCallAgent}
            className="px-8 py-4 rounded-lg bg-electric-cyan text-deep-navy font-bold text-lg glow-cyan hover:opacity-90 transition-opacity flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Phone size={20} />
            <span>Start Voice Interaction</span>
          </motion.button>
          <motion.a
            href="#pricing"
            className="px-8 py-4 rounded-lg glass border border-white/20 text-white font-bold text-lg hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Pricing
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;